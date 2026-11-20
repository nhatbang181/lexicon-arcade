"""
common.py - Common audio utilities for Lexicon Arcade TTS and Audio Pipeline.

Specs: docs/06-AUDIO-PIPELINE.md
- Supported TTS: edge-tts (default UK en-GB-SoniaNeural / en-GB-RyanNeural) and Kokoro-82M.
- Normalization: -16 LUFS, true peak <= -1.0 dBTP, silence <= 80ms at start/end.
- Target format: MP3 mono 48 kbps, 24 kHz.
- Cache: data-src/audio_cache.json keyed by sha256(text + "|" + voice + "|" + speed).
"""

import os
import sys
import json
import shutil
import hashlib
import tempfile
import asyncio
import subprocess
import re
from datetime import datetime
from pathlib import Path

# Paths
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CACHE_FILE = REPO_ROOT / "data-src" / "audio_cache.json"

# Resolve FFmpeg executable
def get_ffmpeg_bin() -> str:
    which_ffmpeg = shutil.which("ffmpeg")
    if which_ffmpeg:
        return which_ffmpeg
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    # Common Windows fallback paths
    for p in [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
    ]:
        if os.path.exists(p):
            return p
    raise RuntimeError("FFmpeg executable not found. Please install ffmpeg or imageio-ffmpeg.")

FFMPEG_BIN = get_ffmpeg_bin()

# Cache management
def get_cache_hash(text: str, voice: str, speed: float = 1.0) -> str:
    key = f"{text.strip()}|{voice.strip()}|{speed:.2f}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()

def load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[warning] Failed to load cache from {CACHE_FILE}: {e}", file=sys.stderr)
            return {}
    return {}

def save_cache(cache: dict) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)

# Audio measurement & probing
def get_audio_duration(file_path: Path | str) -> float:
    cmd = [FFMPEG_BIN, "-nostats", "-i", str(file_path), "-hide_banner"]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", res.stderr)
    if match:
        h, m, s = match.groups()
        return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError(f"Unable to parse duration from {file_path}")

def measure_loudness(file_path: Path | str) -> dict:
    cmd = [
        FFMPEG_BIN, "-nostats", "-i", str(file_path),
        "-af", "loudnorm=print_format=json",
        "-f", "null", "-"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    match = re.search(r"\{\s*\"input_i\".*?\}", res.stderr, re.DOTALL)
    if match:
        data = json.loads(match.group(0))
        return {
            "lufs": float(data.get("input_i", -99)),
            "true_peak": float(data.get("input_tp", -99)),
            "lra": float(data.get("input_lra", 0))
        }
    raise RuntimeError(f"Unable to measure loudness on {file_path}")

# Audio post-processing: silence trimming + loudnorm + mono 48kbps 24kHz
def process_audio(raw_audio_path: Path | str, output_path: Path | str) -> None:
    out_p = Path(output_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)

    # Filter explanation:
    # 1. silenceremove: trim start silence
    # 2. areverse + silenceremove + areverse: trim end silence
    # 3. adelay=60:all=1: keep standard 60ms start-padding (<= 80ms, docs/06 §4)
    # 4. apad=pad_dur=0.15: keep standard end-padding for natural decay and valid EBU R128 gating
    # 5. loudnorm: normalize to -16 LUFS, TP -1.0 dBTP, LRA 11
    af_filter = (
        "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,areverse,"
        "adelay=60:all=1,"
        "apad=pad_dur=0.15,"
        "loudnorm=I=-16:TP=-1.0:LRA=11"
    )

    cmd = [
        FFMPEG_BIN, "-y",
        "-i", str(raw_audio_path),
        "-af", af_filter,
        "-ar", "24000",
        "-ac", "1",
        "-b:a", "48k",
        str(out_p)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg process_audio failed: {res.stderr}")

# TTS Synthesizers
async def synthesize_edge_tts(text: str, voice: str = "en-GB-SoniaNeural", speed: float = 1.0, raw_tmp_path: Path | str = None) -> Path:
    import edge_tts
    # Speed to edge-tts rate percentage string
    pct = int(round((speed - 1.0) * 100))
    rate_str = f"{'+' if pct >= 0 else ''}{pct}%"

    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_str)
    await communicate.save(str(raw_tmp_path))
    return Path(raw_tmp_path)

async def synthesize_and_process(
    text: str,
    output_path: Path | str,
    voice: str = "en-GB-SoniaNeural",
    speed: float = 1.0,
    engine: str = "edge-tts",
    cache: dict = None,
    lock: asyncio.Lock = None,
    force: bool = False
) -> dict:
    """
    Synthesize text, process to MP3 mono 48k 24kHz, and cache result.
    """
    out_p = Path(output_path)
    h = get_cache_hash(text, voice, speed)

    # Check cache and destination existence
    if not force and cache is not None and h in cache and out_p.exists() and out_p.stat().st_size > 1000:
        return cache[h]

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
        raw_tmp = Path(tmp_file.name)

    try:
        if engine == "edge-tts":
            await synthesize_edge_tts(text, voice=voice, speed=speed, raw_tmp_path=raw_tmp)
        elif engine == "kokoro":
            # Attempt Kokoro synthesis if available
            try:
                from kokoro import KPipeline
                import soundfile as sf
                pipeline = KPipeline(lang_code="b") # British English
                generator = pipeline(text, voice=voice, speed=speed)
                for _, _, audio in generator:
                    sf.write(str(raw_tmp) + ".wav", audio, 24000)
                    raw_tmp = Path(str(raw_tmp) + ".wav")
                    break
            except Exception as e:
                # Fallback to edge-tts if kokoro fails
                await synthesize_edge_tts(text, voice=voice, speed=speed, raw_tmp_path=raw_tmp)
        else:
            await synthesize_edge_tts(text, voice=voice, speed=speed, raw_tmp_path=raw_tmp)

        # Process to output MP3
        process_audio(raw_tmp, out_p)

        duration = get_audio_duration(out_p)
        file_size = out_p.stat().st_size

        try:
            rel_audio = str(out_p.resolve().relative_to(REPO_ROOT.resolve())).replace("\\", "/")
        except Exception:
            rel_audio = str(out_p).replace("\\", "/")

        entry = {
            "hash": h,
            "text": text,
            "voice": voice,
            "speed": speed,
            "duration": round(duration, 3),
            "size": file_size,
            "audio_file": rel_audio,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }

        if cache is not None:
            if lock is not None:
                async with lock:
                    cache[h] = entry
            else:
                cache[h] = entry

        return entry

    finally:
        if raw_tmp.exists():
            try:
                raw_tmp.unlink()
            except Exception:
                pass
        wav_extra = Path(str(raw_tmp) + ".wav")
        if wav_extra.exists():
            try:
                wav_extra.unlink()
            except Exception:
                pass
