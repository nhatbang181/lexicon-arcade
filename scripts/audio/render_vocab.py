"""
render_vocab.py - Offline audio renderer for Lexicon Arcade vocabulary.

Specs: docs/06-AUDIO-PIPELINE.md
- Reads public/data/vocab/words.json
- Renders UK audio to public/audio/vocab/<slug>.uk.mp3
- Prioritizes: 150 placement words + 127 collocation headwords + AWL sublist 1-4
- Supports --limit N, --all, --concurrency C, --voice V, --force
"""

import os
import sys
import json
import asyncio
import argparse
import time
from pathlib import Path

# Ensure repo root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.audio.common import (
    REPO_ROOT,
    load_cache,
    save_cache,
    synthesize_and_process
)

WORDS_JSON = REPO_ROOT / "public" / "data" / "vocab" / "words.json"
PLACEMENT_JSON = REPO_ROOT / "public" / "data" / "vocab" / "placement_vocab.json"
COLLOCATIONS_JSON = REPO_ROOT / "public" / "data" / "vocab" / "collocations.json"
PUBLIC_DIR = REPO_ROOT / "public"

def load_word_data():
    with open(WORDS_JSON, "r", encoding="utf-8") as f:
        words = json.load(f)

    # Load placement words
    pv_words = []
    if PLACEMENT_JSON.exists():
        with open(PLACEMENT_JSON, "r", encoding="utf-8") as f:
            pv_data = json.load(f)
            pv_words = [item["headword"].lower() for item in pv_data.get("items", [])]

    # Load collocation headword IDs
    colloc_hw_ids = set()
    if COLLOCATIONS_JSON.exists():
        with open(COLLOCATIONS_JSON, "r", encoding="utf-8") as f:
            colloc_data = json.load(f)
            colloc_hw_ids = {c.get("headwordId") for c in colloc_data if c.get("headwordId")}

    word_by_headword = {w["headword"].lower(): w for w in words}
    word_by_id = {w["id"]: w for w in words}

    # Identify AWL 1-4 words
    awl_targets = {"AWL1", "AWL2", "AWL3", "AWL4"}
    awl_1_4 = [w for w in words if any(l in awl_targets for l in w.get("lists", []))]

    # Build prioritized list
    ordered_words = []
    seen = set()

    def add_word(w):
        if w["id"] not in seen:
            seen.add(w["id"])
            ordered_words.append(w)

    # Priority 1: Placement items (150 words)
    for hw in pv_words:
        if hw in word_by_headword:
            add_word(word_by_headword[hw])

    # Priority 2: Collocation headwords (127 headwords)
    for cid in colloc_hw_ids:
        if cid in word_by_id:
            add_word(word_by_id[cid])

    # Priority 3: AWL sublist 1-4 (up to 333 words)
    for w in awl_1_4:
        add_word(w)

    # Priority 4: All remaining words
    for w in words:
        add_word(w)

    return ordered_words

async def render_words(words_to_render, voice="en-GB-SoniaNeural", concurrency=8, force=False):
    cache = load_cache()
    lock = asyncio.Lock()
    sem = asyncio.Semaphore(concurrency)

    total = len(words_to_render)
    completed = 0
    skipped = 0
    errors = []
    t0 = time.time()

    print(f"=== Rendering {total} vocabulary audio files ===")
    print(f"Voice: {voice} | Concurrency: {concurrency} | Force: {force}")

    async def worker(index, word_item):
        nonlocal completed, skipped
        async with sem:
            hw = word_item.get("headword", "")
            audio_path_rel = word_item.get("audio", {}).get("uk")
            if not audio_path_rel:
                errors.append(f"{word_item.get('id')}: missing audio.uk in words.json")
                return

            dest_path = PUBLIC_DIR / audio_path_rel

            if not force and dest_path.exists() and dest_path.stat().st_size > 1000:
                skipped += 1
                completed += 1
                return

            try:
                await synthesize_and_process(
                    text=hw,
                    output_path=dest_path,
                    voice=voice,
                    speed=1.0,
                    engine="edge-tts",
                    cache=cache,
                    lock=lock,
                    force=force
                )
                completed += 1
                if completed % 25 == 0 or completed == total:
                    elapsed = time.time() - t0
                    rate = completed / elapsed if elapsed > 0 else 0
                    print(f"Progress: [{completed}/{total}] ({completed*100//total}%) - {rate:.1f} files/s (skipped: {skipped})")
            except Exception as e:
                errors.append(f"{hw} ({audio_path_rel}): {e}")
                completed += 1

    tasks = [worker(i, w) for i, w in enumerate(words_to_render)]
    await asyncio.gather(*tasks)

    # Save updated cache
    save_cache(cache)
    elapsed = time.time() - t0
    print(f"\nRender finished in {elapsed:.2f}s.")
    print(f"Total: {total} | Completed: {completed} | Skipped: {skipped} | Errors: {len(errors)}")
    if errors:
        print("Sample errors (up to 5):")
        for err in errors[:5]:
            print(f"  - {err}")
    return len(errors) == 0

def main():
    parser = argparse.ArgumentParser(description="Render vocabulary audio for Lexicon Arcade")
    parser.add_argument("--limit", type=int, default=537, help="Max words to render (default: 537 priority words, 0 for all)")
    parser.add_argument("--all", action="store_true", help="Render all 2207 words in words.json")
    parser.add_argument("--voice", type=str, default="en-GB-SoniaNeural", help="Voice name (default: en-GB-SoniaNeural)")
    parser.add_argument("--concurrency", type=int, default=8, help="Async concurrency limit (default: 8)")
    parser.add_argument("--force", action="store_true", help="Force re-rendering existing audio")

    args = parser.parse_args()

    ordered_words = load_word_data()
    if args.all or args.limit == 0:
        target_words = ordered_words
    else:
        target_words = ordered_words[:args.limit]

    success = asyncio.run(render_words(
        target_words,
        voice=args.voice,
        concurrency=args.concurrency,
        force=args.force
    ))

    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
