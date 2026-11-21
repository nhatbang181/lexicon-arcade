"""
render_dictation.py - Render offline audio for Lexicon Arcade Listening Dictation (L2).

Specs: docs/06-AUDIO-PIPELINE.md §4, docs/05-DATA-PIPELINE.md §6.4
- Reads public/data/listening/dictation.json
- Accents: UK, US, AU (Edge-TTS natural neural voices)
- Rate/speed calibrated to match item target WPM within 10% [INV-D1]:
  * L1: 110 WPM (UK)
  * L2: 120 WPM (UK)
  * L3: 130 WPM (UK/US)
  * L4: 140 WPM (UK/US)
  * L5: 150 WPM (UK/US/AU)
  * L6: 160 WPM (UK/US/AU)
- Normalization: -16 LUFS, true peak <= -1.0 dBTP, silence <= 80ms at start/end
- Target format: MP3 mono 48 kbps, 24 kHz at public/audio/dictation/<id>.mp3 (matches item.audio)
- Priority batch: 60 sentences (first 10 of each level L1-L6)
- Supports --all to render all 300 sentences
"""

import os
import sys
import json
import asyncio
import argparse
import time
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
    resolve_voice,
    dictation_wpm_to_rate,
    synthesize_edge_tts
)

DICTATION_JSON = REPO_ROOT / "public" / "data" / "listening" / "dictation.json"
PUBLIC_DIR = REPO_ROOT / "public"

def select_dictation_items(items: list[dict], all_items: bool = False, count_per_level: int = 10) -> list[dict]:
    """Select items to render: default first 10 per level L1-L6 (60 items), or all 300."""
    if all_items:
        return items

    selected = []
    level_counts = {}
    for item in items:
        lvl = item.get("level", 1)
        cnt = level_counts.get(lvl, 0)
        if cnt < count_per_level:
            selected.append(item)
            level_counts[lvl] = cnt + 1

    return selected

def process_dictation_audio(raw_input_path: Path, out_mp3_path: Path, target_wpm: float, words_count: int) -> float:
    """
    Trim silence, match target WPM via precision atempo stretching, normalize to -16 LUFS,
    and encode to MP3 mono 48k 24kHz. Returns final duration.
    """
    out_mp3_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
        trimmed_wav = Path(tf.name)

    try:
        # Step 1: Trim leading and trailing silence
        af_trim = (
            "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,"
            "areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,areverse"
        )
        cmd_trim = [
            FFMPEG_BIN, "-y",
            "-i", str(raw_input_path),
            "-af", af_trim,
            "-ar", "24000",
            "-ac", "1",
            str(trimmed_wav)
        ]
        res_t = subprocess.run(cmd_trim, capture_output=True, text=True)
        if res_t.returncode != 0:
            raise RuntimeError(f"FFmpeg silence trim failed: {res_t.stderr}")

        trimmed_dur = get_audio_duration(trimmed_wav)

        # Step 2: Compute precision tempo to match target WPM
        target_dur = (words_count / max(50.0, target_wpm)) * 60.0
        tempo = trimmed_dur / target_dur
        tempo = max(0.5, min(2.0, tempo))

        # Step 3: Apply atempo + apad + loudnorm (-16 LUFS, TP -1.5 dBTP)
        af_final = f"atempo={tempo:.3f},apad=whole_dur=0.6,loudnorm=I=-16:TP=-1.5:LRA=11"
        cmd_final = [
            FFMPEG_BIN, "-y",
            "-i", str(trimmed_wav),
            "-af", af_final,
            "-ar", "24000",
            "-ac", "1",
            "-b:a", "48k",
            str(out_mp3_path)
        ]
        res_f = subprocess.run(cmd_final, capture_output=True, text=True)
        if res_f.returncode != 0:
            raise RuntimeError(f"FFmpeg final encode failed: {res_f.stderr}")

        return get_audio_duration(out_mp3_path)
    finally:
        if trimmed_wav.exists():
            try:
                trimmed_wav.unlink()
            except Exception:
                pass

async def render_item(
    item: dict,
    cache: dict,
    lock: asyncio.Lock,
    sem: asyncio.Semaphore,
    force: bool = False
) -> dict:
    text = item.get("ttsText") or item.get("text", "")
    voice_raw = item.get("voice", "")
    accent = item.get("accent", "uk")
    voice = resolve_voice(voice_raw, accent)
    wpm = float(item.get("wpm", 130))
    words = len(text.split())

    # Output path
    audio_rel = item.get("audio", f"audio/dictation/{item['id'].replace(':', '_')}.mp3")
    out_p = PUBLIC_DIR / audio_rel

    h = get_cache_hash(text, voice + f"@{wpm:.1f}", speed=1.0)

    # Check cache and destination existence
    if not force and h in cache and out_p.exists() and out_p.stat().st_size > 1000:
        return {
            "id": item["id"],
            "status": "cached",
            "duration": cache[h].get("duration", 0),
            "size": out_p.stat().st_size
        }

    async with sem:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            raw_tmp = Path(tmp_file.name)

        try:
            await synthesize_edge_tts(text=text, voice=voice, raw_tmp_path=raw_tmp)
            dur = process_dictation_audio(raw_tmp, out_p, target_wpm=wpm, words_count=words)
            file_size = out_p.stat().st_size

            entry = {
                "hash": h,
                "id": item["id"],
                "text": text,
                "voice": voice,
                "targetWpm": wpm,
                "duration": round(dur, 3),
                "size": file_size
            }

            async with lock:
                cache[h] = entry

            return {
                "id": item["id"],
                "status": "rendered",
                "duration": dur,
                "size": file_size
            }
        finally:
            if raw_tmp.exists():
                try:
                    raw_tmp.unlink()
                except Exception:
                    pass

async def main_async():
    parser = argparse.ArgumentParser(description="Render audio for Dictation sentences")
    parser.add_argument("--all", action="store_true", help="Render all 300 sentences (default: 60 priority)")
    parser.add_argument("--per-level", type=int, default=10, help="Number of items per level if not --all")
    parser.add_argument("--concurrency", type=int, default=8, help="Concurrent synthesis requests")
    parser.add_argument("--force", action="store_true", help="Force re-rendering")
    args = parser.parse_args()

    if not DICTATION_JSON.exists():
        print(f"[FAIL] Dictation file not found: {DICTATION_JSON}", file=sys.stderr)
        sys.exit(1)

    with open(DICTATION_JSON, "r", encoding="utf-8") as f:
        all_items = json.load(f)

    targets = select_dictation_items(all_items, all_items=args.all, count_per_level=args.per_level)
    print(f"Target dictation items to render: {len(targets)} (total in dataset: {len(all_items)})")

    cache = load_cache()
    lock = asyncio.Lock()
    sem = asyncio.Semaphore(args.concurrency)

    t0 = time.time()
    tasks = [render_item(item, cache, lock, sem, force=args.force) for item in targets]
    results = await asyncio.gather(*tasks)

    save_cache(cache)
    elapsed = time.time() - t0

    rendered = [r for r in results if r["status"] == "rendered"]
    cached = [r for r in results if r["status"] == "cached"]
    total_bytes = sum(r["size"] for r in results)

    print("\n" + "=" * 60)
    print(f"Dictation Render Completed in {elapsed:.1f}s")
    print(f"  Rendered: {len(rendered)} files")
    print(f"  Cached:   {len(cached)} files")
    print(f"  Total:    {len(results)} files ({total_bytes / (1024 * 1024):.2f} MB)")
    print("=" * 60)

def main():
    asyncio.run(main_async())

if __name__ == "__main__":
    main()
