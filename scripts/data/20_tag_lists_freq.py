#!/usr/bin/env python3
"""
scripts/data/20_tag_lists_freq.py
Tags VocabItems with AWL1..AWL10, NAWL, NGSL lists, computes freqZipf via wordfreq,
generates wordfreq-verified morphological word families, and assigns CEFR / bandTarget (7/8/9).
"""

import json
import re
from pathlib import Path
from wordfreq import zipf_frequency

ROOT = Path(__file__).resolve().parents[2]
DATA_SRC = ROOT / "data-src"
WORDLISTS = DATA_SRC / "wordlists"
VOCAB_IN = DATA_SRC / "vocab" / "legacy_anki.json"
VOCAB_OUT = DATA_SRC / "vocab" / "tagged_vocab.json"

STOPWORDS = {
    "a", "an", "the", "of", "to", "in", "on", "at", "for", "from", "by", "with",
    "and", "or", "as", "into", "out", "up", "down", "off", "over", "under", "be",
    "that", "it", "may", "is", "are", "was", "were", "not", "no", "per",
}

# Suffix-based morphological expansion rules (filtered strictly by wordfreq >= 1.8)
def generate_family(headword: str, pos_list: list[str]) -> list[dict]:
    hw = headword.strip().lower()
    if " " in hw or not re.fullmatch(r"[a-z][a-z\-]{2,}", hw):
        return []

    candidates: list[tuple[str, str]] = []
    pos0 = pos_list[0] if pos_list else "n"

    # Common base stem extraction
    stems = [hw]
    if hw.endswith("e") and len(hw) > 4:
        stems.append(hw[:-1])
    if hw.endswith("y") and len(hw) > 4 and hw[-2] not in "aeiou":
        stems.append(hw[:-1] + "i")
    if hw.endswith("ic") and len(hw) > 4:
        candidates.append((hw + "ally", "adv"))
        candidates.append((hw + "al", "adj"))
    if hw.endswith("ise") and len(hw) > 5:
        base = hw[:-3]
        candidates.extend([
            (base + "isation", "n"),
            (base + "ised", "adj"),
            (base + "ising", "adj"),
        ])
    if hw.endswith("ize") and len(hw) > 5:
        base = hw[:-3]
        candidates.extend([
            (base + "ization", "n"),
            (base + "ized", "adj"),
        ])
    if hw.endswith("ate") and len(hw) > 5:
        base = hw[:-1]
        candidates.extend([
            (base + "ion", "n"),
            (base + "ive", "adj"),
            (base + "ively", "adv"),
            (base + "or", "n"),
        ])
    if hw.endswith("tion") and len(hw) > 6:
        base = hw[:-4]
        candidates.extend([
            (base + "te", "v"),
            (base + "tive", "adj"),
            (base + "tional", "adj"),
            (base + "tionally", "adv"),
        ])
    if hw.endswith("ity") and len(hw) > 5:
        base = hw[:-3]
        candidates.extend([
            (base, "adj"),
            (base + "e", "adj"),
            (base + "ly", "adv"),
        ])
    if hw.endswith("ment") and len(hw) > 6:
        base = hw[:-4]
        candidates.extend([
            (base, "v"),
            (base + "al", "adj"),
        ])
    if hw.endswith("al") and len(hw) > 5:
        candidates.extend([
            (hw + "ly", "adv"),
            (hw[:-2], "n"),
            (hw[:-2] + "e", "n"),
        ])
    if hw.endswith("ive") and len(hw) > 5:
        candidates.extend([
            (hw + "ly", "adv"),
            (hw + "ness", "n"),
            (hw[:-3] + "e", "v"),
            (hw[:-3] + "ion", "n"),
        ])
    if hw.endswith("ous") and len(hw) > 5:
        candidates.extend([
            (hw + "ly", "adv"),
            (hw + "ness", "n"),
        ])
    if hw.endswith("able") and len(hw) > 6:
        candidates.extend([
            (hw[:-4], "v"),
            (hw[:-4] + "e", "v"),
            (hw[:-2] + "ility", "n"),
            (hw[:-1] + "y", "adv"),
        ])
    if hw.endswith("ly") and len(hw) > 5:
        candidates.append((hw[:-2], "adj"))
        if hw.endswith("ily"):
            candidates.append((hw[:-3] + "y", "adj"))
        if hw.endswith("ally"):
            candidates.append((hw[:-4], "adj"))

    # Standard derivations by POS
    for st in stems:
        if pos0 == "v":
            candidates.extend([
                (st + "ion", "n"),
                (st + "ation", "n"),
                (st + "ment", "n"),
                (st + "ance", "n"),
                (st + "ence", "n"),
                (st + "er", "n"),
                (st + "or", "n"),
                (st + "ive", "adj"),
                (st + "able", "adj"),
                (st + "ible", "adj"),
                (st + "al", "adj"),
            ])
        elif pos0 == "n":
            candidates.extend([
                (st + "al", "adj"),
                (st + "ic", "adj"),
                (st + "ical", "adj"),
                (st + "ous", "adj"),
                (st + "ive", "adj"),
                (st + "ful", "adj"),
                (st + "less", "adj"),
                (st + "ise", "v"),
                (st + "ate", "v"),
                (st + "ally", "adv"),
            ])
        elif pos0 == "adj":
            candidates.extend([
                (st + "ly", "adv"),
                (st + "ness", "n"),
                (st + "ity", "n"),
                (st + "ise", "v"),
                (st + "cy", "n"),
            ])

    # Filter strictly by wordfreq >= 2.1 (real, established English words) and deduplicate
    seen = {hw}
    verified = []
    for form, fpos in candidates:
        f = form.strip().lower()
        if f in seen or len(f) < 3:
            continue
        if zipf_frequency(f, "en") >= 2.2:
            seen.add(f)
            verified.append({"form": f, "pos": fpos})
        if len(verified) >= 5:
            break

    return verified


def compute_zipf(headword: str) -> float:
    hw = headword.strip().lower()
    z = zipf_frequency(hw, "en")
    if z > 0:
        return round(z, 2)
    tokens = [t for t in re.split(r"[\s\-]+", hw) if t and t not in STOPWORDS]
    if not tokens:
        tokens = [t for t in re.split(r"[\s\-]+", hw) if t]
    scores = [zipf_frequency(t, "en") for t in tokens]
    non_zero = [s for s in scores if s > 0]
    if non_zero:
        return round(min(non_zero), 2)
    return 1.5


def norm_variants(word: str) -> set[str]:
    w = word.strip().lower()
    out = {w}
    if w.endswith("ise"):
        out.add(w[:-3] + "ize")
    elif w.endswith("ize"):
        out.add(w[:-3] + "ise")
    if w.endswith("isation"):
        out.add(w[:-7] + "ization")
    elif w.endswith("ization"):
        out.add(w[:-7] + "isation")
    if "our" in w:
        out.add(w.replace("our", "or"))
    if w.endswith("re") and len(w) > 4:
        out.add(w[:-2] + "er")
    # Basic stem fallback for matching AWL headwords (e.g. "economic" -> "economy")
    if w.endswith("s") and len(w) > 4:
        out.add(w[:-1])
    if w.endswith("es") and len(w) > 4:
        out.add(w[:-2])
    if w.endswith("ed") and len(w) > 4:
        out.add(w[:-2])
        out.add(w[:-1])
    if w.endswith("ing") and len(w) > 5:
        out.add(w[:-3])
        out.add(w[:-3] + "e")
    return out


def main():
    awl_data = json.loads((WORDLISTS / "awl_sublists.json").read_text(encoding="utf-8"))
    ngsl_data = json.loads((WORDLISTS / "ngsl.json").read_text(encoding="utf-8"))
    nawl_data = json.loads((WORDLISTS / "nawl.json").read_text(encoding="utf-8"))

    awl_map: dict[str, str] = {}
    for sub, words in awl_data["sublists"].items():
        for w in words:
            awl_map[w.lower()] = sub

    ngsl_set = {w.lower() for w in ngsl_data["words"]}
    nawl_set = {w.lower() for w in nawl_data["words"]}

    items = json.loads(VOCAB_IN.read_text(encoding="utf-8"))
    seen_hw = {it["headword"].strip().lower() for it in items}
    for extra_path in sorted((DATA_SRC / "vocab").glob("extra_*.json")):
        for ex in json.loads(extra_path.read_text(encoding="utf-8")):
            k = ex["headword"].strip().lower()
            if k not in seen_hw:
                seen_hw.add(k)
                items.append(ex)

    awl_hits = 0
    nawl_hits = 0
    ngsl_hits = 0
    band_counts = {7: 0, 8: 0, 9: 0}

    for item in items:
        hw = item["headword"]
        z = compute_zipf(hw)
        item["freqZipf"] = z

        family = generate_family(hw, item.get("pos", ["n"]))
        if family:
            item["family"] = family

        # Collect lookup forms: headword + family + tokens
        forms_to_check = set()
        forms_to_check |= norm_variants(hw)
        for fam in family:
            forms_to_check |= norm_variants(fam["form"])
        # For multi-word expressions, check key content words against AWL
        if " " in hw:
            for tok in re.split(r"[\s\-]+", hw.lower()):
                if len(tok) >= 4 and tok not in STOPWORDS:
                    forms_to_check |= norm_variants(tok)

        lists = list(item.get("lists", ["ANKI"]))
        matched_awl = None
        for f in forms_to_check:
            if f in awl_map:
                matched_awl = awl_map[f]
                break
        if matched_awl and matched_awl not in lists:
            lists.insert(0, matched_awl)
            awl_hits += 1

        if any(f in nawl_set for f in norm_variants(hw)) and "NAWL" not in lists:
            lists.append("NAWL")
            nawl_hits += 1

        if any(f in ngsl_set for f in norm_variants(hw)) and "NGSL" not in lists:
            lists.append("NGSL")
            ngsl_hits += 1

        # Deduplicate while preserving order
        item["lists"] = list(dict.fromkeys(lists))

        # Assign CEFR & bandTarget (7, 8, 9)
        awl_num = int(matched_awl[3:]) if matched_awl else None
        if z >= 5.1 and not matched_awl:
            cefr = "B1"
            band = 7
        elif z >= 4.2 or (awl_num is not None and awl_num <= 3):
            cefr = "B2" if z >= 4.5 else "C1"
            band = 7 if z >= 4.5 else 8
        elif z >= 3.0 or (awl_num is not None and awl_num <= 7):
            cefr = "C1"
            band = 8
        else:
            cefr = "C2"
            band = 9

        item["cefr"] = cefr
        item["_bandTarget"] = band
        band_counts[band] += 1

    VOCAB_OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"[20_tag_lists_freq] Tagged {len(items)} items -> {VOCAB_OUT.name} | "
        f"AWL={awl_hits}, NAWL={nawl_hits}, NGSL={ngsl_hits} | bands={band_counts}"
    )


if __name__ == "__main__":
    main()
