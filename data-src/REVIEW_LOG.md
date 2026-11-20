
## M1 vocab review (rv-data-vocab, 2026-11-20, seed 42)
- validate:data: **exit 1** (7x INV-M1 SHA-256 mismatch in manifest.json); assets PASS.
- Samples/reject: collocations 110/13 (11.8%), paraphrases 32/1 (3.1%), vocab 35/4 (11.4%), error_patterns 35/1 (2.9%).
- Serious: err:legacy_107 (`correct` ungrammatical, duplicated tail); manifest hash stale.
- Collocation rejects: mitigate_the_severity_of, a_high_standard_of_living, acquire_a_reputation_for, eradicate_the_root_causes_of (bad answers); severe_pollution, in_depth_knowledge, raise_public_awareness_of, increase_public_awareness, generate_revenue, increase_access_to, undue_influence, preserve_heritage, cost_effective_solution (l1Trap is acceptable English).
- Vocab: immunotherapy/strike_a_balance meaningVi truncated; engagement definitionEn weak; oral_tradition overlong. 236 words meaningVi >45 chars; clozeAccepted contains non-words (curriculumes, curriculumed).
- Verdict: CONDITIONAL_PASS. Details in data-src/verdict_m1_vocab.json.

## M2 Reading blind-solve (rv-data-reading)
- Solved blind: p1_001, p1_res_001, p2_001, p2_004, p3_001, p3_res_001 = 84 questions. Match 83/84 (98.81%).
- Mismatch: p2_004_q05 (YNNG) gold NG vs blind NO - ambiguous (para E says colleges replace retirees too slowly; 'begun expanding intake' unstated). Suggest rewording.
- validate:data could not run: missing npm package zod (environment).
- Verdict: data-src/reading/verdict_m2_reading.json
