#!/usr/bin/env python3
"""
scripts/data/30_ipa_check.py
Normalizes and verifies ipa.uk across all VocabItems:
- Valid /.../ format
- Zero CJK characters
- Proper IPA stress marks (ˈ, ˌ) and length marks (ː)
- Checks multi-syllable words for primary stress mark ˈ
Outputs data-src/vocab/ipa_checked_vocab.json and data-src/vocab/ipa_report.json.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VOCAB_DIR = ROOT / "data-src" / "vocab"
VOCAB_IN = VOCAB_DIR / "tagged_vocab.json"
VOCAB_OUT = VOCAB_DIR / "ipa_checked_vocab.json"
REPORT_OUT = VOCAB_DIR / "ipa_report.json"

CJK_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")
# Approximate IPA vowel nuclei (diphthongs + monophthongs)
VOWEL_NUCLEUS_RE = re.compile(
    r"(?:eɪ|aɪ|ɔɪ|aʊ|əʊ|ɪə|eə|ʊə|oʊ|ɑː|ɜː|iː|ɔː|uː|[aeiouæɑɒɔəɛɜɪʊʌ])"
)

PHRASE_IPA_FIXES = {
    "peaked at": "/ˈpiːkt æt/",
    "reached a low of": "/ˌriːtʃt ə ˈləʊ əv/",
    "case in point": "/ˌkeɪs ɪn ˈpɔɪnt/",
    "in light of": "/ɪn ˈlaɪt əv/",
    "all in all": "/ˌɔːl ɪn ˈɔːl/",
    "be that as it may": "/ˌbiː ðæt æz ɪt ˈmeɪ/",
    "by and large": "/ˌbaɪ ənd ˈlɑːdʒ/",
    "bear the brunt": "/ˌbeə ðə ˈbrʌnt/",
    "pave the way": "/ˌpeɪv ðə ˈweɪ/",
    "shed light on": "/ˌʃed ˈlaɪt ɒn/",
    "stem the tide": "/ˌstem ðə ˈtaɪd/",
}


def normalize_ipa(raw: str) -> str:
    s = str(raw or "").strip()
    if not s:
        return ""
    # Strip outer slashes or brackets then re-wrap cleanly
    s = s.strip("/[] ")
    s = s.replace("'", "ˈ").replace("`", "ˈ").replace(":", "ː")
    s = re.sub(r"\s+", " ", s)
    return f"/{s}/"


def count_syllables_ipa(ipa_inner: str) -> int:
    # Split multi-word IPA and sum nuclei
    return len(VOWEL_NUCLEUS_RE.findall(ipa_inner))


def main():
    items = json.loads(VOCAB_IN.read_text(encoding="utf-8"))

    normalized_count = 0
    flagged = []
    monosyllabic_no_stress = 0
    with_stress = 0
    invalid_format = 0
    cjk_hits = 0

    for item in items:
        ipa_obj = item.get("ipa", {})
        raw_uk = ipa_obj.get("uk", "")
        hw_key = item["headword"].strip().lower()
        norm_uk = PHRASE_IPA_FIXES.get(hw_key, normalize_ipa(raw_uk))
        if norm_uk != raw_uk:
            normalized_count += 1

        if CJK_RE.search(norm_uk):
            cjk_hits += 1
            flagged.append({"id": item["id"], "headword": item["headword"], "ipa": norm_uk, "reason": "cjk"})

        if not re.fullmatch(r"/.+/", norm_uk):
            invalid_format += 1
            flagged.append({"id": item["id"], "headword": item["headword"], "ipa": norm_uk, "reason": "invalid_format"})
        else:
            inner = norm_uk[1:-1]
            has_stress = ("ˈ" in inner) or ("ˌ" in inner)
            if has_stress:
                with_stress += 1
            else:
                syl = count_syllables_ipa(inner)
                if syl <= 1:
                    monosyllabic_no_stress += 1
                else:
                    # Multi-syllable IPA missing primary stress mark: prepend ˈ if single word
                    if " " not in inner:
                        norm_uk = f"/ˈ{inner}/"
                        normalized_count += 1
                        with_stress += 1
                        flagged.append({
                            "id": item["id"],
                            "headword": item["headword"],
                            "ipa": norm_uk,
                            "reason": "auto_added_primary_stress",
                        })
                    else:
                        flagged.append({
                            "id": item["id"],
                            "headword": item["headword"],
                            "ipa": norm_uk,
                            "reason": "multiword_missing_stress",
                        })

        ipa_obj["uk"] = norm_uk
        item["ipa"] = ipa_obj

    VOCAB_OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {
        "total": len(items),
        "normalizedCount": normalized_count,
        "withStressMarks": with_stress,
        "monosyllabicWithoutStress": monosyllabic_no_stress,
        "invalidFormat": invalid_format,
        "cjkHits": cjk_hits,
        "flaggedCount": len(flagged),
        "flaggedSample": flagged[:30],
    }
    REPORT_OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"[30_ipa_check] Checked {len(items)} items | normalized={normalized_count}, "
        f"withStress={with_stress}, mono={monosyllabic_no_stress}, invalid={invalid_format}, "
        f"cjk={cjk_hits}, flagged={len(flagged)}"
    )


if __name__ == "__main__":
    main()
