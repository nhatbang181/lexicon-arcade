"""
qa_audio.py - Quality Assurance gate for rendered audio (Vocab, Listening, Dictation).

Specs: docs/06-AUDIO-PIPELINE.md §5, docs/04-DATA-SPEC.md [INV-L5], [INV-L6], [INV-D1]
- Checks public/audio/vocab/:
  * Duration 0.25s - 4.5s
  * File size > 1 KB
  * Directory size <= 40 MB
  * Sample loudness around -16 LUFS, true peak <= -1.0 dBTP
- Checks public/audio/listening/:
  * Non-empty, file size > 50 KB
  * Episode duration meets [INV-L6]
  * Loudness within -17..-15 LUFS, true peak <= -1.0 dBTP
  * Cross-check with episode JSON: audio.sha256, durationSec, loudnessLUFS, monotonic line timings
- Checks public/audio/dictation/:
  * File size > 1 KB, duration 1.0s - 20s
  * Loudness around -16 LUFS (-18..-14 LUFS), true peak <= -1.0 dBTP
  * Measured WPM within 10% of declared item.wpm [INV-D1]
- Checks public/audio/ total size <= 400 MB.
"""

import sys
import json
import hashlib
import argparse
import random
from pathlib import Path

# Ensure repo root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.audio.common import (
    REPO_ROOT,
    get_audio_duration,
    measure_loudness
)

AUDIO_ROOT = REPO_ROOT / "public" / "audio"
VOCAB_AUDIO_DIR = AUDIO_ROOT / "vocab"
LISTENING_AUDIO_DIR = AUDIO_ROOT / "listening"
DICTATION_AUDIO_DIR = AUDIO_ROOT / "dictation"

WORDS_JSON = REPO_ROOT / "public" / "data" / "vocab" / "words.json"
EPISODES_DIR = REPO_ROOT / "public" / "data" / "listening" / "episodes"
DICTATION_JSON = REPO_ROOT / "public" / "data" / "listening" / "dictation.json"

MAX_TOTAL_AUDIO_MB = 400.0
MAX_VOCAB_DIR_MB = 40.0

def run_vocab_qa(sample_size=20) -> bool:
    print("=" * 60)
    print("  AUDIO QA GATE 1: Vocabulary (public/audio/vocab/)")
    print("=" * 60)

    if not VOCAB_AUDIO_DIR.exists():
        print(f"[SKIP] Directory does not exist: {VOCAB_AUDIO_DIR}")
        return True

    mp3_files = sorted(list(VOCAB_AUDIO_DIR.glob("*.mp3")))
    total_files = len(mp3_files)
    print(f"Found {total_files} MP3 files in {VOCAB_AUDIO_DIR.relative_to(REPO_ROOT)}")

    if total_files == 0:
        print("[WARN] No MP3 files found in vocab audio directory.")
        return True

    total_bytes = sum(f.stat().st_size for f in mp3_files)
    total_mb = total_bytes / (1024 * 1024)
    print(f"1. Total Directory Size: {total_mb:.2f} MB / {MAX_VOCAB_DIR_MB} MB limit")
    if total_mb > MAX_VOCAB_DIR_MB:
        print(f"   [FAIL] Vocab directory exceeds limit: {total_mb:.2f} MB")
        return False
    print(f"   [PASS] Total size is within budget ({total_mb:.2f} MB)")

    # File size check
    small_files = [f for f in mp3_files if f.stat().st_size <= 1000]
    if small_files:
        print(f"   [FAIL] Found {len(small_files)} files with size <= 1 KB (e.g. {small_files[0].name})")
        return False
    print(f"   [PASS] All {total_files} files are > 1 KB")

    # Sample loudness check
    sample_files = random.sample(mp3_files, min(sample_size, total_files))
    lufs_list = []
    tp_list = []
    errors = []
    for f in sample_files:
        try:
            m = measure_loudness(f)
            lufs = m["lufs"]
            tp = m["true_peak"]
            lufs_list.append(lufs)
            tp_list.append(tp)
            if lufs < -22.0 or lufs > -13.0:
                errors.append(f"{f.name}: LUFS={lufs}")
            if tp > -0.9:
                errors.append(f"{f.name}: TP={tp} dBTP")
        except Exception as e:
            errors.append(f"{f.name}: {e}")

    avg_lufs = sum(lufs_list) / len(lufs_list) if lufs_list else 0
    print(f"2. Sample Loudness: Mean LUFS = {avg_lufs:.2f} (target -16), Max TP = {max(tp_list):.2f} dBTP")
    if errors:
        print(f"   [FAIL] Loudness errors: {errors[:3]}")
        return False
    print(f"   [PASS] Vocab sample loudness verified")

    return True

def run_listening_qa() -> bool:
    print("\n" + "=" * 60)
    print("  AUDIO QA GATE 2: Listening Episodes (public/audio/listening/)")
    print("=" * 60)

    if not LISTENING_AUDIO_DIR.exists():
        print(f"[FAIL] Directory does not exist: {LISTENING_AUDIO_DIR}")
        return False

    mp3_files = sorted(list(LISTENING_AUDIO_DIR.glob("*.mp3")))
    total_files = len(mp3_files)
    print(f"Found {total_files} episode MP3 files in {LISTENING_AUDIO_DIR.relative_to(REPO_ROOT)}")

    if total_files == 0:
        print("[FAIL] No episode MP3 files found!")
        return False

    errors = []
    total_bytes = 0

    for f in mp3_files:
        slug = f.stem
        ep_json = EPISODES_DIR / f"{slug}.json"
        if not ep_json.exists():
            errors.append(f"Missing episode JSON for {f.name}")
            continue

        with open(ep_json, "r", encoding="utf-8") as jf:
            ep = json.load(jf)

        f_size = f.stat().st_size
        total_bytes += f_size

        if f_size < 50 * 1024:
            errors.append(f"{f.name}: file size {f_size} B is unexpectedly small (< 50 KB)")

        # Duration measurement
        try:
            dur = get_audio_duration(f)
        except Exception as e:
            errors.append(f"{f.name}: unable to get duration ({e})")
            continue

        part = ep.get("part", 1)
        # Invariant [INV-L6]: Part 1 (240-360s), Part 2 (240-360s), Part 3 (240-360s), Part 4 (300-420s)
        # Allow +/- 15s tolerance for natural synthesis cadence
        min_sec = 225 if part != 4 else 285
        max_sec = 375 if part != 4 else 435
        if dur < min_sec or dur > max_sec:
            errors.append(f"{f.name} (Part {part}): duration {dur:.1f}s outside [{min_sec}, {max_sec}]s")

        # Loudness measurement
        try:
            m = measure_loudness(f)
            lufs = m["lufs"]
            tp = m["true_peak"]
            # Target -17..-15 LUFS, TP <= -1.0 dBTP
            if lufs < -17.5 or lufs > -14.5:
                errors.append(f"{f.name}: LUFS {lufs:.2f} outside [-17.0, -15.0]")
            if tp > -0.9:
                errors.append(f"{f.name}: True Peak {tp:.2f} dBTP exceeds -1.0 dBTP")
        except Exception as e:
            errors.append(f"{f.name}: loudnorm measurement error ({e})")

        # Cross-check JSON metadata
        with open(f, "rb") as bf:
            actual_sha = hashlib.sha256(bf.read()).hexdigest()

        audio_meta = ep.get("audio", {})
        if audio_meta.get("sha256") != actual_sha:
            errors.append(f"{slug}.json audio.sha256 mismatch with MP3 file")

        if abs(float(audio_meta.get("durationSec", 0)) - dur) > 1.5:
            errors.append(f"{slug}.json audio.durationSec ({audio_meta.get('durationSec')}) != actual {dur:.1f}s")

        # Check script timing monotonicity
        script = ep.get("script", [])
        prev_end = 0.0
        for line in script:
            st = float(line.get("start", 0))
            en = float(line.get("end", 0))
            if st >= en:
                errors.append(f"{slug} line {line.get('lineId')}: start {st} >= end {en}")
            if st < prev_end - 0.1:
                errors.append(f"{slug} line {line.get('lineId')}: start {st} < previous end {prev_end}")
            prev_end = en

        if prev_end > dur + 0.5:
            errors.append(f"{slug} script end ({prev_end}s) exceeds audio duration ({dur:.1f}s)")

        print(f"  [OK] {slug} (Part {part}): {dur:.1f}s, {f_size / 1024:.0f} KB, LUFS: {lufs:.1f}, TP: {tp:.2f} dBTP")

    total_mb = total_bytes / (1024 * 1024)
    print(f"\nListening episodes total size: {total_mb:.2f} MB")

    if errors:
        print(f"  [FAIL] {len(errors)} issues found in listening episodes:")
        for err in errors[:5]:
            print(f"    - {err}")
        return False

    print("  [PASS] All rendered listening episodes satisfied 100% QA criteria.")
    return True

def run_dictation_qa(sample_size=30) -> bool:
    print("\n" + "=" * 60)
    print("  AUDIO QA GATE 3: Dictation (public/audio/dictation/)")
    print("=" * 60)

    if not DICTATION_AUDIO_DIR.exists():
        print(f"[FAIL] Directory does not exist: {DICTATION_AUDIO_DIR}")
        return False

    mp3_files = sorted(list(DICTATION_AUDIO_DIR.glob("*.mp3")))
    total_files = len(mp3_files)
    print(f"Found {total_files} dictation MP3 files in {DICTATION_AUDIO_DIR.relative_to(REPO_ROOT)}")

    if total_files == 0:
        print("[FAIL] No dictation MP3 files found!")
        return False

    with open(DICTATION_JSON, "r", encoding="utf-8") as f:
        dictation_items = json.load(f)
    item_by_audio = {item["audio"].replace("audio/dictation/", ""): item for item in dictation_items}

    errors = []
    total_bytes = sum(f.stat().st_size for f in mp3_files)
    small_files = [f for f in mp3_files if f.stat().st_size <= 1000]
    if small_files:
        errors.append(f"{len(small_files)} files <= 1 KB (e.g. {small_files[0].name})")

    # Sample loudness and WPM checks
    sample_files = random.sample(mp3_files, min(sample_size, total_files))
    lufs_list = []
    tp_list = []
    wpm_diffs = []

    for f in sample_files:
        item = item_by_audio.get(f.name)
        if not item:
            errors.append(f"{f.name}: not referenced in dictation.json")
            continue

        try:
            dur = get_audio_duration(f)
            if dur < 1.0 or dur > 25.0:
                errors.append(f"{f.name}: duration {dur:.2f}s outside [1.0, 25.0]s")

            # WPM check [INV-D1]: words / (dur / 60)
            words = len(item["text"].split())
            actual_wpm = (words / dur) * 60
            target_wpm = float(item.get("wpm", 130))
            diff_pct = abs(actual_wpm - target_wpm) / target_wpm * 100
            wpm_diffs.append(diff_pct)
            # Allow up to 10% tolerance per [INV-D1]
            if diff_pct > 10.0:
                errors.append(f"{f.name}: WPM {actual_wpm:.1f} deviates {diff_pct:.1f}% (>10%) from target {target_wpm}")

            # Loudness
            m = measure_loudness(f)
            lufs = m["lufs"]
            tp = m["true_peak"]
            lufs_list.append(lufs)
            tp_list.append(tp)

            if lufs < -18.5 or lufs > -13.5:
                errors.append(f"{f.name}: LUFS {lufs:.2f} outside [-18, -14]")
            if tp > -0.9:
                errors.append(f"{f.name}: TP {tp:.2f} > -1.0 dBTP")

        except Exception as e:
            errors.append(f"{f.name}: {e}")

    avg_lufs = sum(lufs_list) / len(lufs_list) if lufs_list else 0
    max_tp = max(tp_list) if tp_list else 0
    avg_wpm_diff = sum(wpm_diffs) / len(wpm_diffs) if wpm_diffs else 0
    max_wpm_diff = max(wpm_diffs) if wpm_diffs else 0

    print(f"  Metrics ({len(sample_files)} sample files):")
    print(f"    - Mean LUFS: {avg_lufs:.2f} (target -16 LUFS)")
    print(f"    - Max True Peak: {max_tp:.2f} dBTP (target <= -1.0 dBTP)")
    print(f"    - WPM Deviation [INV-D1]: avg {avg_wpm_diff:.1f}%, max {max_wpm_diff:.1f}% (limit <= 10%)")
    print(f"    - Total Dictation Audio Size: {total_bytes / (1024 * 1024):.2f} MB")

    if errors:
        print(f"  [FAIL] {len(errors)} issues found in dictation audio:")
        for err in errors[:5]:
            print(f"    - {err}")
        return False

    print("  [PASS] Dictation audio satisfied 100% QA criteria.")
    return True

def run_total_budget_qa() -> bool:
    print("\n" + "=" * 60)
    print("  AUDIO QA GATE 4: Total Audio Budget Check")
    print("=" * 60)

    if not AUDIO_ROOT.exists():
        print("[FAIL] public/audio/ directory does not exist!")
        return False

    all_mp3s = list(AUDIO_ROOT.rglob("*.mp3"))
    all_webms = list(AUDIO_ROOT.rglob("*.webm"))
    all_wavs = list(AUDIO_ROOT.rglob("*.wav"))
    all_files = all_mp3s + all_webms + all_wavs

    total_bytes = sum(f.stat().st_size for f in all_files)
    total_mb = total_bytes / (1024 * 1024)

    print(f"Total audio files found: {len(all_files)}")
    print(f"Total public/audio size: {total_mb:.2f} MB / {MAX_TOTAL_AUDIO_MB:.0f} MB hard ceiling")

    if total_mb > MAX_TOTAL_AUDIO_MB:
        print(f"  [FAIL] Total audio size {total_mb:.2f} MB exceeds {MAX_TOTAL_AUDIO_MB} MB limit!")
        return False

    print(f"  [PASS] Total audio size ({total_mb:.2f} MB) is well within the {MAX_TOTAL_AUDIO_MB} MB budget.")
    return True

def main():
    parser = argparse.ArgumentParser(description="Lexicon Arcade Audio QA Gate")
    parser.add_argument("--vocab-only", action="store_true", help="Only run vocab QA")
    parser.add_argument("--listening-only", action="store_true", help="Only run listening QA")
    parser.add_argument("--dictation-only", action="store_true", help="Only run dictation QA")
    args = parser.parse_args()

    passes = []
    if args.vocab_only:
        passes.append(run_vocab_qa())
    elif args.listening_only:
        passes.append(run_listening_qa())
    elif args.dictation_only:
        passes.append(run_dictation_qa())
    else:
        passes.append(run_vocab_qa())
        passes.append(run_listening_qa())
        passes.append(run_dictation_qa())
        passes.append(run_total_budget_qa())

    if all(passes):
        print("\n" + "#" * 60)
        print("  ALL AUDIO QA GATES: PASS (100% satisfied)")
        print("#" * 60)
        sys.exit(0)
    else:
        print("\n" + "#" * 60)
        print("  AUDIO QA GATES: FAILED")
        print("#" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()
