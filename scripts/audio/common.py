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

# Multi-speaker Voice Mappings (edge-tts)
# Maps Kokoro voice names or shorthand tokens to natural Edge-TTS neural voices
VOICE_MAP = {
    # UK Female
    "bf_emma": "en-GB-SoniaNeural",
    "bf_isabella": "en-GB-LibbyNeural",
    "bf_alice": "en-GB-MaisieNeural",
    "bf_lily": "en-GB-SoniaNeural",
    # UK Male
    "bm_george": "en-GB-RyanNeural",
    "bm_daniel": "en-GB-ThomasNeural",
    "bm_lewis": "en-GB-RyanNeural",
    "bm_fable": "en-GB-ThomasNeural",
    # US Female
    "af_heart": "en-US-JennyNeural",
    "af_bella": "en-US-AriaNeural",
    "af_nicole": "en-US-AvaNeural",
    "af_sarah": "en-US-JennyNeural",
    # US Male
    "am_michael": "en-US-GuyNeural",
    "am_adam": "en-US-ChristopherNeural",
    # AU/NZ/CA
    "edge:en-AU-NatashaNeural": "en-AU-NatashaNeural",
    "edge:en-AU-WilliamNeural": "en-AU-WilliamNeural",
    "edge:en-NZ-MitchellNeural": "en-NZ-MitchellNeural",
    "edge:en-NZ-MollyNeural": "en-NZ-MollyNeural",
    "edge:en-CA-ClaraNeural": "en-CA-ClaraNeural",
    "edge:en-CA-LiamNeural": "en-CA-LiamNeural",
}

VOICE_POOLS = {
    ("uk", "f"): ["en-GB-SoniaNeural", "en-GB-LibbyNeural", "en-GB-MaisieNeural"],
    ("uk", "m"): ["en-GB-RyanNeural", "en-GB-ThomasNeural"],
    ("us", "f"): ["en-US-JennyNeural", "en-US-AriaNeural", "en-US-AvaNeural"],
    ("us", "m"): ["en-US-GuyNeural", "en-US-ChristopherNeural"],
    ("au", "f"): ["en-AU-NatashaNeural"],
    ("au", "m"): ["en-AU-WilliamNeural"],
    ("nz", "f"): ["en-NZ-MollyNeural"],
    ("nz", "m"): ["en-NZ-MitchellNeural"],
    ("ca", "f"): ["en-CA-ClaraNeural"],
    ("ca", "m"): ["en-CA-LiamNeural"],
}

def resolve_voice(raw_voice: str, accent: str = "uk") -> str:
    """Resolve a voice token to a concrete edge-tts voice."""
    if not raw_voice:
        return "en-GB-SoniaNeural"
    if raw_voice.startswith("edge:"):
        return raw_voice.replace("edge:", "")
    if raw_voice in VOICE_MAP:
        return VOICE_MAP[raw_voice]
    accent_lower = accent.lower()
    gender = "f" if raw_voice.startswith(("bf_", "af_")) else "m"
    pool = VOICE_POOLS.get((accent_lower, gender), VOICE_POOLS.get(("uk", gender), ["en-GB-SoniaNeural"]))
    return pool[0]

def resolve_episode_voices(speakers: list[dict]) -> dict[str, str]:
    """
    Ensure all speakers within the same episode are assigned distinct voices.
    Returns mapping: speakerId -> edge_voice
    """
    assigned = {}
    used_voices = set()
    for s in speakers:
        sid = s["id"]
        raw = s.get("voice", "")
        accent = s.get("accent", "uk").lower()
        gender = "f" if raw.startswith(("bf_", "af_")) or any(name in raw for name in ["Natasha", "Molly", "Clara"]) else "m"

        target = raw.replace("edge:", "") if raw.startswith("edge:") else VOICE_MAP.get(raw)
        if not target or target in used_voices:
            # Pick an unused voice from pool
            pool = VOICE_POOLS.get((accent, gender), VOICE_POOLS.get(("uk", gender), []))
            for v in pool:
                if v not in used_voices:
                    target = v
                    break
            if not target or target in used_voices:
                # Any unused voice from all pools
                for p in VOICE_POOLS.values():
                    for v in p:
                        if v not in used_voices:
                            target = v
                            break
                    if target and target not in used_voices:
                        break
        if not target:
            target = "en-GB-SoniaNeural"
        used_voices.add(target)
        assigned[sid] = target
    return assigned

def dictation_wpm_to_rate(wpm: float) -> str:
    """
    Convert target WPM to edge-tts rate string.
    Edge-tts natural speech baseline is ~128 WPM.
    """
    pct = int(round((wpm / 128.0 - 1.0) * 100))
    # Cap rate between -30% and +40%
    pct = max(-30, min(40, pct))
    return f"{'+' if pct >= 0 else ''}{pct}%"

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
    # 1. silenceremove: trim start silence down to <= 80ms
    # 2. areverse + silenceremove + areverse: trim end silence
    # 3. apad=whole_dur=0.6: ensure minimum 0.6s total duration so ITU BS.1770 / EBU R128
    #    gating window (400ms) always has valid non-inf integrated loudness.
    # 4. loudnorm: normalize to -16 LUFS, TP -1.0 dBTP, LRA 11
    af_filter = (
        "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,areverse,"
        "apad=whole_dur=0.6,"
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
async def synthesize_edge_tts(
    text: str,
    voice: str = "en-GB-SoniaNeural",
    speed: float = 1.0,
    raw_tmp_path: Path | str = None,
    rate_str: str = None
) -> Path:
    import edge_tts
    if rate_str is None:
        pct = int(round((speed - 1.0) * 100))
        rate_str = f"{'+' if pct >= 0 else ''}{pct}%"

    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_str)
    await communicate.save(str(raw_tmp_path))
    return Path(raw_tmp_path)

def render_silence_wav(duration: float, output_path: Path | str) -> None:
    """Generate exact duration of silence at 24kHz mono PCM."""
    out_p = Path(output_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    dur_str = f"{max(0.01, duration):.3f}"
    cmd = [
        FFMPEG_BIN, "-y",
        "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-t", dur_str,
        "-ar", "24000", "-ac", "1",
        str(out_p)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg render_silence_wav failed: {res.stderr}")

def trim_line_wav(input_path: Path | str, output_path: Path | str) -> float:
    """
    Trim silence at start/end down to <= 80ms and output 24kHz mono WAV.
    Returns the measured duration of the trimmed WAV.
    """
    out_p = Path(output_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    af_filter = (
        "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB,areverse"
    )
    cmd = [
        FFMPEG_BIN, "-y",
        "-i", str(input_path),
        "-af", af_filter,
        "-ar", "24000",
        "-ac", "1",
        str(out_p)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg trim_line_wav failed: {res.stderr}")
    return get_audio_duration(out_p)

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
