"""
render_episode.py - Render offline multi-speaker Listening episode audio for Lexicon Arcade.

Specs: docs/06-AUDIO-PIPELINE.md §4
- Reads public/data/listening/episodes/<slug>.json
- Multi-speaker voice assignment via Edge-TTS (UK, US, AU, NZ, CA)
- Silence trimming <= 80ms for each line
- Proper pause insertion:
  * 0.25s between lines of same speaker
  * 0.45s between lines of different speakers
  * 0.8s before signposts in Part 4 (or explicit pauseAfter >= 0.5s)
- Normalization: -16 LUFS, true peak <= -1.5 dBTP, LRA 11
- Target format: MP3 mono 48 kbps, 24 kHz at public/audio/listening/<slug>.mp3
- Updates script[i].start/end, evidence.start/end, trap.start/end,
  audio.durationSec, audio.sha256, audio.loudnessLUFS back into episode JSON.
- Updates durationSec in public/data/listening/index.json.
- Rebuilds public/data/manifest.json.
"""

import os
import sys
import json
import asyncio
import argparse
import time
import shutil
import hashlib
import tempfile
import subprocess
from pathlib import Path

# Ensure repo root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.audio.common import (
    REPO_ROOT,
    FFMPEG_BIN,
    load_cache,
    save_cache,
    get_cache_hash,
    get_audio_duration,
    measure_loudness,
    resolve_episode_voices,
    synthesize_edge_tts,
    render_silence_wav,
    trim_line_wav
)

EPISODES_DIR = REPO_ROOT / "public" / "data" / "listening" / "episodes"
INDEX_JSON = REPO_ROOT / "public" / "data" / "listening" / "index.json"
LISTENING_AUDIO_DIR = REPO_ROOT / "public" / "audio" / "listening"
DEFAULT_SLUGS = ["p1_001", "p2_001", "p3_001", "p4_001"]

def get_line_pause_after(line: dict, next_line: dict | None, is_part_4: bool) -> float:
    """Determine pause duration in seconds after a script line."""
    if next_line is None:
        return 0.8  # Trailing silence at end of episode

    # Explicit pauseAfter from schema (e.g. signpost pause)
    raw_pause = line.get("pauseAfter")
    if raw_pause is not None and float(raw_pause) >= 0.5:
        return float(raw_pause)

    # Check for Part 4 signpost cues
    if is_part_4:
        next_text = (next_line.get("text") or "").strip().lower()
        signpost_prefixes = (
            "now, ", "let's turn", "moving on", "finally,", "turning to",
            "let us look", "to begin with", "another key"
        )
        if any(next_text.startswith(sp) for sp in signpost_prefixes):
            return 0.8

    curr_speaker = line.get("speakerId")
    next_speaker = next_line.get("speakerId")

    if curr_speaker != next_speaker:
        return float(raw_pause or 0.45)
    return 0.25

async def render_single_line(
    text: str,
    voice: str,
    speed: float,
    out_wav: Path,
    cache: dict,
    lock: asyncio.Lock,
    sem: asyncio.Semaphore,
    force: bool = False
) -> float:
    """
    Synthesize and trim a single script line. Returns duration in seconds.
    """
    h = get_cache_hash(text, voice, speed)
    async with sem:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tf:
            tmp_mp3 = Path(tf.name)
        try:
            await synthesize_edge_tts(text=text, voice=voice, speed=speed, raw_tmp_path=tmp_mp3)
            dur = trim_line_wav(tmp_mp3, out_wav)
            return dur
        finally:
            if tmp_mp3.exists():
                try:
                    tmp_mp3.unlink()
                except Exception:
                    pass

async def render_episode(slug: str, cache: dict, lock: asyncio.Lock, concurrency: int = 5, force: bool = False) -> dict:
    ep_file = EPISODES_DIR / f"{slug}.json"
    if not ep_file.exists():
        raise FileNotFoundError(f"Episode file not found: {ep_file}")

    with open(ep_file, "r", encoding="utf-8") as f:
        ep_data = json.load(f)

    out_mp3 = LISTENING_AUDIO_DIR / f"{slug}.mp3"
    out_mp3.parent.mkdir(parents=True, exist_ok=True)

    print(f"\n--- Rendering Episode: {slug} ({ep_data.get('title', '')}) ---")

    speakers = ep_data.get("speakers", [])
    voice_map = resolve_episode_voices(speakers)
    print(f"  Speakers & Voices: {voice_map}")

    script = ep_data.get("script", [])
    part = ep_data.get("part", 1)
    is_part_4 = (part == 4)

    # Set base speed by Part according to docs/06-AUDIO-PIPELINE.md §3
    if part == 1:
        base_speed = 0.98
    elif part == 4:
        base_speed = 1.02
    else:
        base_speed = 1.0

    sem = asyncio.Semaphore(concurrency)

    # Working temp dir for line audio segments
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        line_wavs = []
        silence_wavs = []

        print(f"  Synthesizing {len(script)} lines...")
        tasks = []
        for i, line in enumerate(script):
            line_text = line.get("ttsText") or line.get("text", "")
            spk_id = line.get("speakerId")
            spk_voice = voice_map.get(spk_id, "en-GB-SoniaNeural")
            line_wav = tmp_path / f"line_{i:04d}.wav"
            line_wavs.append(line_wav)
            tasks.append(
                render_single_line(
                    text=line_text,
                    voice=spk_voice,
                    speed=base_speed,
                    out_wav=line_wav,
                    cache=cache,
                    lock=lock,
                    sem=sem,
                    force=force
                )
            )

        line_durations = await asyncio.gather(*tasks)

        # Build timeline and generate pause silences
        current_time = 0.0
        concat_entries = []
        line_timings = {}

        for i, line in enumerate(script):
            dur = line_durations[i]
            start_t = round(current_time, 2)
            end_t = round(current_time + dur, 2)

            line["start"] = start_t
            line["end"] = end_t
            line_timings[line["lineId"]] = (start_t, end_t)

            concat_entries.append(line_wavs[i])

            next_line = script[i + 1] if i + 1 < len(script) else None
            pause_sec = get_line_pause_after(line, next_line, is_part_4)

            sil_wav = tmp_path / f"silence_{i:04d}.wav"
            render_silence_wav(pause_sec, sil_wav)
            concat_entries.append(sil_wav)

            current_time = end_t + pause_sec

        # Update evidence and traps timestamps in questionGroups
        for grp in ep_data.get("questionGroups", []):
            for q in grp.get("questions", []):
                ev = q.get("evidence")
                if ev and ev.get("lineId") in line_timings:
                    ev["start"] = line_timings[ev["lineId"]][0]
                    ev["end"] = line_timings[ev["lineId"]][1]
                for tr in q.get("traps", []):
                    if tr.get("lineId") in line_timings:
                        tr["start"] = line_timings[tr["lineId"]][0]
                        tr["end"] = line_timings[tr["lineId"]][1]

        # Write concat demuxer file
        concat_txt = tmp_path / "concat.txt"
        with open(concat_txt, "w", encoding="utf-8") as f:
            for entry in concat_entries:
                escaped = str(entry).replace("\\", "/")
                f.write(f"file '{escaped}'\n")

        raw_joined_wav = tmp_path / "raw_joined.wav"
        print("  Concatenating lines and pauses...")
        cmd_concat = [
            FFMPEG_BIN, "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_txt),
            "-c", "copy",
            str(raw_joined_wav)
        ]
        res_c = subprocess.run(cmd_concat, capture_output=True, text=True)
        if res_c.returncode != 0:
            raise RuntimeError(f"FFmpeg concat failed: {res_c.stderr}")

        # Normalize with loudnorm and encode to MP3 mono 48k 24kHz
        print("  Normalizing (-16 LUFS, TP -1.5 dBTP) and encoding MP3...")
        cmd_encode = [
            FFMPEG_BIN, "-y",
            "-i", str(raw_joined_wav),
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar", "24000",
            "-ac", "1",
            "-b:a", "48k",
            str(out_mp3)
        ]
        res_e = subprocess.run(cmd_encode, capture_output=True, text=True)
        if res_e.returncode != 0:
            raise RuntimeError(f"FFmpeg loudnorm encode failed: {res_e.stderr}")

    # Measure output file
    final_dur = round(get_audio_duration(out_mp3), 1)
    file_size = out_mp3.stat().st_size
    loudness_info = measure_loudness(out_mp3)
    final_lufs = round(loudness_info["lufs"], 1)

    with open(out_mp3, "rb") as f:
        sha256_hex = hashlib.sha256(f.read()).hexdigest()

    print(f"  Rendered: {final_dur:.1f}s, {file_size / 1024:.1f} KB, LUFS: {final_lufs}, TP: {loudness_info['true_peak']:.2f} dBTP")

    # Update episode JSON
    ep_data["audio"]["durationSec"] = final_dur
    ep_data["audio"]["sha256"] = sha256_hex
    ep_data["audio"]["loudnessLUFS"] = final_lufs

    with open(ep_file, "w", encoding="utf-8", newline="\n") as f:
        json.dump(ep_data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return {
        "slug": slug,
        "durationSec": final_dur,
        "sha256": sha256_hex,
        "loudnessLUFS": final_lufs,
        "sizeBytes": file_size
    }

def update_listening_index(rendered_results: list[dict]) -> None:
    """Update durationSec in public/data/listening/index.json."""
    if not INDEX_JSON.exists():
        return
    with open(INDEX_JSON, "r", encoding="utf-8") as f:
        index_data = json.load(f)

    result_map = {r["slug"]: r for r in rendered_results}
    updated = False
    for item in index_data:
        slug = item.get("id", "").replace("lep:", "")
        if slug in result_map:
            item["durationSec"] = result_map[slug]["durationSec"]
            updated = True

    if updated:
        with open(INDEX_JSON, "w", encoding="utf-8", newline="\n") as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Updated durationSec for {len(rendered_results)} episodes in {INDEX_JSON.relative_to(REPO_ROOT)}")

def rebuild_manifest() -> None:
    """Run scripts/data/60_build_manifest.mjs to keep manifest.json in sync."""
    script_path = REPO_ROOT / "scripts" / "data" / "60_build_manifest.mjs"
    if script_path.exists():
        print("\nRebuilding manifest.json...")
        res = subprocess.run(["node", str(script_path)], capture_output=True, text=True)
        if res.returncode == 0:
            print("  manifest.json successfully rebuilt.")
        else:
            print(f"  [warn] Manifest rebuild error: {res.stderr}", file=sys.stderr)

async def main_async():
    parser = argparse.ArgumentParser(description="Render Listening episode audio for Lexicon Arcade")
    parser.add_argument("--slugs", nargs="+", default=DEFAULT_SLUGS, help="Episode slugs to render")
    parser.add_argument("--all", action="store_true", help="Render all 32 episodes")
    parser.add_argument("--concurrency", type=int, default=5, help="Line synthesis concurrency")
    parser.add_argument("--force", action="store_true", help="Force re-rendering")
    args = parser.parse_args()

    if args.all:
        all_files = sorted(EPISODES_DIR.glob("*.json"))
        target_slugs = [f.stem for f in all_files]
    else:
        target_slugs = args.slugs

    print(f"Target episodes to render ({len(target_slugs)}): {target_slugs}")

    cache = load_cache()
    lock = asyncio.Lock()
    results = []

    t0 = time.time()
    for slug in target_slugs:
        try:
            res = await render_episode(slug, cache, lock, concurrency=args.concurrency, force=args.force)
            results.append(res)
        except Exception as e:
            print(f"[FAIL] Error rendering episode {slug}: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()

    save_cache(cache)
    elapsed = time.time() - t0

    if results:
        update_listening_index(results)
        rebuild_manifest()

    print("\n" + "=" * 60)
    print(f"Episode Render Completed: {len(results)}/{len(target_slugs)} episodes rendered in {elapsed:.1f}s")
    total_mb = sum(r["sizeBytes"] for r in results) / (1024 * 1024)
    print(f"Total size of rendered episodes: {total_mb:.2f} MB")
    print("=" * 60)

def main():
    asyncio.run(main_async())

if __name__ == "__main__":
    main()
