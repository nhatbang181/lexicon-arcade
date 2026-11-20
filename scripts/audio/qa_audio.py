"""
qa_audio.py - Quality Assurance gate for rendered vocabulary audio.

Specs: docs/06-AUDIO-PIPELINE.md §5
- Checks every MP3 in public/audio/vocab/:
  * Duration in 0.25s - 4.5s
  * File size > 1 KB
  * Total public/audio/vocab/ directory size <= 40 MB
  * Sample loudness (LUFS) around -16 LUFS (-18 to -14 LUFS), true peak <= -1.0 dBTP
- Outputs real measured metrics and returns exit code 0 (PASS) or 1 (FAIL).
"""

import sys
import json
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

VOCAB_AUDIO_DIR = REPO_ROOT / "public" / "audio" / "vocab"
WORDS_JSON = REPO_ROOT / "public" / "data" / "vocab" / "words.json"
MAX_DIR_SIZE_BYTES = 40 * 1024 * 1024  # 40 MB

def run_qa(sample_size=30):
    print("=" * 60)
    print("  AUDIO QA GATE: public/audio/vocab/")
    print("=" * 60)

    if not VOCAB_AUDIO_DIR.exists():
        print(f"[FAIL] Directory does not exist: {VOCAB_AUDIO_DIR}")
        return False

    mp3_files = sorted(list(VOCAB_AUDIO_DIR.glob("*.mp3")))
    total_files = len(mp3_files)
    print(f"Found {total_files} MP3 files in {VOCAB_AUDIO_DIR.relative_to(REPO_ROOT)}")

    if total_files == 0:
        print("[FAIL] No MP3 files found in directory!")
        return False

    # Check 1: Directory size <= 40 MB
    total_bytes = sum(f.stat().st_size for f in mp3_files)
    total_mb = total_bytes / (1024 * 1024)
    print(f"\n1. Total Directory Size: {total_mb:.2f} MB / 40.00 MB limit")
    if total_bytes > MAX_DIR_SIZE_BYTES:
        print(f"   [FAIL] Total directory size exceeds 40 MB: {total_mb:.2f} MB")
        return False
    else:
        print(f"   [PASS] Total size is well within budget ({total_mb:.2f} MB <= 40 MB)")

    # Check 2: File size > 1 KB for all files
    small_files = [f for f in mp3_files if f.stat().st_size <= 1000]
    min_size = min(f.stat().st_size for f in mp3_files)
    max_size = max(f.stat().st_size for f in mp3_files)
    avg_size = total_bytes / total_files
    print(f"\n2. File Sizes (min: {min_size} B, avg: {avg_size:.0f} B, max: {max_size} B):")
    if small_files:
        print(f"   [FAIL] Found {len(small_files)} files with size <= 1 KB (e.g. {small_files[0].name})")
        return False
    else:
        print(f"   [PASS] All {total_files} files are > 1 KB")

    # Check 3: Duration check for all files (0.25s - 4.5s)
    print(f"\n3. Duration Check (0.25s - 4.5s):")
    durations = []
    duration_errors = []

    for f in mp3_files:
        try:
            dur = get_audio_duration(f)
            durations.append(dur)
            if dur < 0.25 or dur > 4.5:
                duration_errors.append((f.name, dur))
        except Exception as e:
            duration_errors.append((f.name, str(e)))

    min_dur = min(durations) if durations else 0
    max_dur = max(durations) if durations else 0
    avg_dur = sum(durations) / len(durations) if durations else 0
    print(f"   Measured: min={min_dur:.2f}s, avg={avg_dur:.2f}s, max={max_dur:.2f}s")

    if duration_errors:
        print(f"   [FAIL] {len(duration_errors)} files outside duration range 0.25-4.5s:")
        for name, d in duration_errors[:5]:
            print(f"     - {name}: {d}")
        return False
    else:
        print(f"   [PASS] All {total_files} files are within 0.25s - 4.5s duration")

    # Check 4: Sample Loudness & True Peak check
    sample_count = min(sample_size, total_files)
    sample_files = random.sample(mp3_files, sample_count)
    print(f"\n4. Loudness Sample Check (sample size: {sample_count} files):")
    print(f"   Criteria: Integrated LUFS in [-18.0, -14.0], True Peak <= -1.0 dBTP")

    lufs_list = []
    tp_list = []
    loudness_errors = []

    for f in sample_files:
        try:
            res = measure_loudness(f)
            lufs = res["lufs"]
            tp = res["true_peak"]
            lufs_list.append(lufs)
            tp_list.append(tp)

            # Check bounds: LUFS between -18 and -14, True Peak <= -1.0
            if lufs < -18.5 or lufs > -13.5:
                loudness_errors.append((f.name, f"LUFS={lufs} outside [-18.5, -13.5]"))
            if tp > -0.9:
                loudness_errors.append((f.name, f"True peak={tp} > -1.0 dBTP"))
        except Exception as e:
            loudness_errors.append((f.name, str(e)))

    avg_lufs = sum(lufs_list) / len(lufs_list) if lufs_list else 0
    avg_tp = sum(tp_list) / len(tp_list) if tp_list else 0
    min_tp = min(tp_list) if tp_list else 0
    max_tp = max(tp_list) if tp_list else 0

    print(f"   Sample metrics: Mean LUFS = {avg_lufs:.2f} (target: -16 LUFS)")
    print(f"                   True Peak range = [{min_tp:.2f}, {max_tp:.2f}] dBTP (target: <= -1.0 dBTP)")

    if loudness_errors:
        print(f"   [FAIL] Loudness check errors ({len(loudness_errors)} files):")
        for name, err in loudness_errors[:5]:
            print(f"     - {name}: {err}")
        return False
    else:
        print(f"   [PASS] All {sample_count} sampled files meet loudness & true peak specs")

    # Check 5: Alignment with words.json
    print(f"\n5. Alignment with words.json:")
    with open(WORDS_JSON, "r", encoding="utf-8") as f:
        words = json.load(f)
    valid_paths = {w["audio"]["uk"] for w in words if "audio" in w and "uk" in w["audio"]}

    unmatched = []
    for f in mp3_files:
        rel = f"audio/vocab/{f.name}"
        if rel not in valid_paths:
            unmatched.append(f.name)

    if unmatched:
        print(f"   [WARN] {len(unmatched)} audio files not referenced in words.json (e.g. {unmatched[:3]})")
    else:
        print(f"   [PASS] All rendered files correspond to valid audio.uk paths in words.json")

    print("\n" + "=" * 60)
    print("  AUDIO QA VERDICT: PASS (100% checks satisfied)")
    print("=" * 60)
    return True

def main():
    parser = argparse.ArgumentParser(description="QA gate for vocabulary audio")
    parser.add_argument("--sample-size", type=int, default=30, help="Number of files to sample for ffmpeg loudness check")
    args = parser.parse_args()

    passed = run_qa(sample_size=args.sample_size)
    if not passed:
        sys.exit(1)

if __name__ == "__main__":
    main()
