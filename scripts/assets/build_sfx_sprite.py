#!/usr/bin/env python3
"""
Build SFX audio sprite (public/assets/sfx/sfx.webm, sfx.mp3, sfx.json)
from CC0 Kenney Interface Sounds & Digital Audio packs in scripts/assets/_downloads/.
Normalizes cues to -20 LUFS (with cue-specific adjustments per docs/10-MOTION-AND-SOUND.md §3).
"""

import io
import json
import math
import os
import subprocess
import tempfile
import zipfile
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT_DIR = Path(__file__).resolve().parents[2]
DOWNLOADS_DIR = ROOT_DIR / "scripts" / "assets" / "_downloads"
OUT_DIR = ROOT_DIR / "public" / "assets" / "sfx"

SAMPLE_RATE = 44100
GAP_MS = 120  # Silence padding between cues in sprite

# Canonical 12 cues from brief + source file in Kenney CC0 packs + gain adjustment in dB + max duration (ms)
CUE_SPECS = [
    {
        "name": "tap",
        "aliases": [],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/click_002.ogg",
        "gain_db": 0.0,
        "max_ms": 80,
    },
    {
        "name": "correct",
        "aliases": [],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/confirmation_001.ogg",
        "gain_db": 0.0,
        "max_ms": 260,
    },
    {
        "name": "wrong",
        "aliases": [],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/error_004.ogg",
        "gain_db": -4.0,  # docs/10 §3: giảm 4 dB, trầm mềm
        "max_ms": 220,
    },
    {
        "name": "streak",
        "aliases": ["combo"],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/confirmation_002.ogg",
        "gain_db": 0.0,
        "max_ms": 320,
    },
    {
        "name": "sessionDone",
        "aliases": ["goal"],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/confirmation_004.ogg",
        "gain_db": 0.0,
        "max_ms": 550,
    },
    {
        "name": "levelUp",
        "aliases": ["levelup"],
        "pack": "kenney-digital-audio.zip",
        "entry": "Audio/powerUp7.ogg",
        "gain_db": 0.0,
        "max_ms": 950,
    },
    {
        "name": "tick",
        "aliases": [],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/tick_001.ogg",
        "gain_db": -8.0,  # docs/10 §3: âm lượng ~40% (-8 dB)
        "max_ms": 80,
    },
    {
        "name": "countdownEnd",
        "aliases": ["timeup"],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/bong_001.ogg",
        "gain_db": 0.0,
        "max_ms": 480,
    },
    {
        "name": "flip",
        "aliases": ["page"],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/drop_002.ogg",
        "gain_db": -2.0,
        "max_ms": 140,
    },
    {
        "name": "highlight",
        "aliases": ["reveal"],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/maximize_006.ogg",
        "gain_db": -1.5,
        "max_ms": 240,
    },
    {
        "name": "recordStart",
        "aliases": ["record_start"],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/switch_001.ogg",
        "gain_db": 0.0,
        "max_ms": 150,
    },
    {
        "name": "recordStop",
        "aliases": ["record_stop"],
        "pack": "kenney-interface-sounds.zip",
        "entry": "Audio/switch_002.ogg",
        "gain_db": 0.0,
        "max_ms": 150,
    },
]


def is_safe_zip_entry(entry_name: str) -> bool:
    norm = entry_name.replace("\\", "/")
    if norm.startswith("/") or ".." in norm.split("/"):
        return False
    return norm.lower().endswith((".ogg", ".wav", ".mp3"))


def decode_audio_bytes_to_pcm(ffmpeg_exe: str, raw_bytes: bytes) -> np.ndarray:
    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp_in:
        tmp_in.write(raw_bytes)
        tmp_in_path = tmp_in.name
    try:
        cmd = [
            ffmpeg_exe,
            "-y",
            "-i",
            tmp_in_path,
            "-ac",
            "1",
            "-ar",
            str(SAMPLE_RATE),
            "-f",
            "s16le",
            "-",
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        samples = np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32) / 32768.0
        return samples
    finally:
        if os.path.exists(tmp_in_path):
            os.remove(tmp_in_path)


def normalize_lufs_approx(samples: np.ndarray, target_lufs: float = -20.0, extra_gain_db: float = 0.0) -> np.ndarray:
    if len(samples) == 0:
        return samples
    # Trim trailing near-silence
    abs_s = np.abs(samples)
    active = np.where(abs_s > 0.002)[0]
    if len(active) > 0:
        end_idx = min(len(samples), active[-1] + int(0.015 * SAMPLE_RATE))
        samples = samples[:end_idx]

    rms = float(np.sqrt(np.mean(np.square(samples)) + 1e-12))
    current_db = 20.0 * math.log10(rms)
    target_db = target_lufs + extra_gain_db
    gain = 10.0 ** ((target_db - current_db) / 20.0)
    out = samples * gain

    # Soft limiter so peaks never clip above 0.92
    peak = float(np.max(np.abs(out)))
    if peak > 0.92:
        out = out * (0.92 / peak)

    # Apply 5ms fade-in and 12ms fade-out for zero click artifacts
    fade_in = min(len(out) // 4, int(0.005 * SAMPLE_RATE))
    fade_out = min(len(out) // 3, int(0.012 * SAMPLE_RATE))
    if fade_in > 1:
        out[:fade_in] *= np.linspace(0.0, 1.0, fade_in, dtype=np.float32)
    if fade_out > 1:
        out[-fade_out:] *= np.linspace(1.0, 0.0, fade_out, dtype=np.float32)
    return out


def build_sfx_sprite() -> dict:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    gap_samples = np.zeros(int((GAP_MS / 1000.0) * SAMPLE_RATE), dtype=np.float32)
    timeline_chunks: list[np.ndarray] = []
    current_samples = 0
    sprite_map: dict[str, list[int]] = {}

    for spec in CUE_SPECS:
        zip_path = DOWNLOADS_DIR / spec["pack"]
        if not zip_path.exists():
            raise FileNotFoundError(f"Missing downloaded pack: {zip_path}")
        entry = spec["entry"]
        if not is_safe_zip_entry(entry):
            raise ValueError(f"Unsafe zip entry rejected: {entry}")

        with zipfile.ZipFile(zip_path, "r") as zf:
            raw_bytes = zf.read(entry)

        pcm = decode_audio_bytes_to_pcm(ffmpeg_exe, raw_bytes)
        max_samples = int((spec["max_ms"] / 1000.0) * SAMPLE_RATE)
        if len(pcm) > max_samples:
            pcm = pcm[:max_samples]

        pcm = normalize_lufs_approx(pcm, target_lufs=-20.0, extra_gain_db=spec["gain_db"])

        offset_ms = int(round((current_samples / SAMPLE_RATE) * 1000))
        duration_ms = max(20, int(round((len(pcm) / SAMPLE_RATE) * 1000)))

        sprite_map[spec["name"]] = [offset_ms, duration_ms]
        for alias in spec["aliases"]:
            sprite_map[alias] = [offset_ms, duration_ms]

        timeline_chunks.append(pcm)
        timeline_chunks.append(gap_samples)
        current_samples += len(pcm) + len(gap_samples)

    full_pcm = np.concatenate(timeline_chunks)
    pcm_int16 = np.clip(full_pcm * 32767.0, -32768, 32767).astype(np.int16)

    with tempfile.NamedTemporaryFile(suffix=".pcm", delete=False) as tmp_pcm:
        tmp_pcm.write(pcm_int16.tobytes())
        tmp_pcm_path = tmp_pcm.name

    webm_path = OUT_DIR / "sfx.webm"
    mp3_path = OUT_DIR / "sfx.mp3"
    json_path = OUT_DIR / "sfx.json"

    try:
        # Encode WebM (Opus 48kbps mono)
        subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-f",
                "s16le",
                "-ar",
                str(SAMPLE_RATE),
                "-ac",
                "1",
                "-i",
                tmp_pcm_path,
                "-c:a",
                "libopus",
                "-b:a",
                "48k",
                str(webm_path),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )

        # Encode MP3 (64kbps mono)
        subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-f",
                "s16le",
                "-ar",
                str(SAMPLE_RATE),
                "-ac",
                "1",
                "-i",
                tmp_pcm_path,
                "-c:a",
                "libmp3lame",
                "-b:a",
                "64k",
                str(mp3_path),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )
    finally:
        if os.path.exists(tmp_pcm_path):
            os.remove(tmp_pcm_path)

    sprite_payload = {
        "urls": ["assets/sfx/sfx.webm", "assets/sfx/sfx.mp3"],
        "sprite": sprite_map,
    }
    json_path.write_text(json.dumps(sprite_payload, indent=2) + "\n", encoding="utf-8")

    total_bytes = webm_path.stat().st_size + mp3_path.stat().st_size + json_path.stat().st_size
    print(
        f"Built SFX sprite: sfx.webm={webm_path.stat().st_size}B, "
        f"sfx.mp3={mp3_path.stat().st_size}B, sfx.json={json_path.stat().st_size}B "
        f"(Total={total_bytes}B / {total_bytes / 1024:.1f} KB)"
    )
    return sprite_payload


if __name__ == "__main__":
    build_sfx_sprite()
