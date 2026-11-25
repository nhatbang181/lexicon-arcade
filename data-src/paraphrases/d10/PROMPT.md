You are an IELTS Reading item editor. Each item is a paraphrase-matching exercise: a learner sees "questionPhrase" and must pick, inside "context", the span ("targetText") that paraphrases it (relation "equivalent"), or for relation "not_equivalent" (level 4) the span is a tempting near-miss that does NOT really say the same thing as questionPhrase. The other highlighted spans are "decoys": plausible wrong picks.

Problem: the current decoys share no content word with questionPhrase, so they do not distract. Fix it with the SMALLEST possible edit.

For each item, return a revised context and decoys such that:
1. At least one decoy contains a content word (same lemma, e.g. "old"/"older", "support"/"supported") taken from questionPhrase, but its meaning in context does NOT paraphrase questionPhrase (a keyword-echo trap, like "older buildings" for "old people").
2. targetText stays EXACTLY unchanged (character for character) and still appears once in the revised context. For "equivalent" items the target remains the only correct answer; no decoy may paraphrase questionPhrase.
3. Edit the context minimally (change or add a few words in one sentence, or reuse an existing span if one already echoes a keyword). Keep it natural, grammatical, factually harmless, 40-110 words total, British spelling. Do not add the whole questionPhrase wording to the context.
4. Return exactly 2 decoys. Each decoy "text" must appear verbatim in the revised context, must not overlap the target or each other, 2-8 words each. "whyVi": one Vietnamese sentence (max 20 words) explaining why it is wrong (e.g. 'Lặp từ "old" nhưng nói về công trình cũ.').
5. If an existing decoy already shares a lemma, keep the context unchanged.

Output ONLY a JSON array, no markdown fence, same order and count as input:
[{"id":"para:...","context":"<revised or same context>","decoys":[{"text":"...","whyVi":"..."},{"text":"...","whyVi":"..."}]}, ...]

INPUT ITEMS (one JSON per line):
