import { describe, expect, it } from 'vitest';
import {
  ReadingPassageSchema,
  type ReadingPassage,
  type ReadingQuestionGroup,
} from '../../core/content/schemas';
import { Rating } from '../../core/srs/fsrsAdapter';
import {
  READING_PLACEMENT_PASSAGE,
  READING_PLACEMENT_QUESTIONS,
  evaluateReadingPlacement,
} from '../../features/placement/readingPlacement';
import { R1_FIXTURE_P1, R1_FIXTURE_P3 } from '../../test/fixtures/r1_fixtures';
import {
  buildJudgeWinStatement,
  canSubmitJudgeVerdict,
  createEmptyConfusionMatrix,
  createJudgeSession,
  createParaphraseSrsCard,
  createPassageSession,
  createTfngRetryCardIfNeeded,
  evaluateJudgeEvidence,
  extractParaphraseSuggestions,
  findParagraphSentenceBounds,
  getFalseVsNgStats,
  getR1DifficultyConfig,
  mergeConfusionMatrices,
  nextJudgeQuestion,
  recordConfusion,
  reviewTfngRetryCard,
  scorePassageQuestion,
  selectJudgeEvidence,
  selectPassageQuestion,
  setPassageAnswer,
  setPassageEvidence,
  submitJudgeVerdict,
  submitPassageSession,
  tickPassageTimer,
  toggleJudgeNoDirectInfo,
  togglePassageFlag,
  useJudgeParagraphHint,
} from './engine';

describe('R1 · TFNG Judge — Fixtures & Invariants', () => {
  it('validates both P1 and P3 fixtures against ReadingPassageSchema and [INV-R1..R6]', () => {
    for (const passage of [R1_FIXTURE_P1, R1_FIXTURE_P3]) {
      expect(() => ReadingPassageSchema.parse(passage)).not.toThrow();

      // [INV-R1] Exact quote === paragraph.text.slice(start, end)
      for (const group of passage.questionGroups) {
        for (const q of group.questions) {
          for (const sp of q.evidence) {
            const para = passage.paragraphs.find((p) => p.label === sp.paragraph);
            expect(para).toBeDefined();
            expect(para!.text.slice(sp.start, sp.end)).toBe(sp.quote);
          }
          if (q.mainIdeaSpan) {
            const para = passage.paragraphs.find((p) => p.label === q.mainIdeaSpan!.paragraph);
            expect(para!.text.slice(q.mainIdeaSpan.start, q.mainIdeaSpan.end)).toBe(
              q.mainIdeaSpan.quote,
            );
          }
        }
      }

      // [INV-R3] 13 or 14 questions, >= 2 groups
      const totalQs = passage.questionGroups.reduce((s, g) => s + g.questions.length, 0);
      expect(totalQs).toBeGreaterThanOrEqual(13);
      expect(totalQs).toBeLessThanOrEqual(14);
      expect(passage.questionGroups.length).toBeGreaterThanOrEqual(2);
    }

    // [INV-R2] Word counts in P1 (650..850) and P3 (800..950)
    expect(R1_FIXTURE_P1.wordCount).toBeGreaterThanOrEqual(650);
    expect(R1_FIXTURE_P1.wordCount).toBeLessThanOrEqual(850);
    expect(R1_FIXTURE_P3.wordCount).toBeGreaterThanOrEqual(800);
    expect(R1_FIXTURE_P3.wordCount).toBeLessThanOrEqual(950);
  });
});

describe('R1 · TFNG Judge — Difficulty & Step ① Gate', () => {
  it('returns correct difficulty parameters across levels 1..10', () => {
    const l1 = getR1DifficultyConfig(1);
    expect(l1.glossaryDefaultOn).toBe(true);
    expect(l1.allowParagraphHint).toBe(true);
    expect(l1.allowedPassageLevels).toEqual(['P1']);

    const l4 = getR1DifficultyConfig(4);
    expect(l4.glossaryDefaultOn).toBe(false);
    expect(l4.allowParagraphHint).toBe(true);

    const l5 = getR1DifficultyConfig(5);
    expect(l5.allowParagraphHint).toBe(false);
    expect(l5.targetSecPerQuestion).toBe(75);

    const l9 = getR1DifficultyConfig(9);
    expect(l9.targetSecPerQuestion).toBe(55);
    expect(l9.warnOverSec).toBe(90);
    expect(l9.mixTfngAndYnng).toBe(true);
  });

  it('blocks all verdicts until Step ① evidence or noDirectInfo is provided', () => {
    const state = createJudgeSession(R1_FIXTURE_P1, { level: 1 });
    expect(canSubmitJudgeVerdict(state, 'TRUE')).toBe(false);
    expect(canSubmitJudgeVerdict(state, 'FALSE')).toBe(false);
    expect(canSubmitJudgeVerdict(state, 'NOT GIVEN')).toBe(false);

    // Highlighting unlocks all 3 TFNG verdicts (and rejects YNNG verdicts)
    const gold = R1_FIXTURE_P1.questionGroups[0].questions[0].evidence[0];
    const withSpan = selectJudgeEvidence(state, gold);
    expect(canSubmitJudgeVerdict(withSpan, 'TRUE')).toBe(true);
    expect(canSubmitJudgeVerdict(withSpan, 'FALSE')).toBe(true);
    expect(canSubmitJudgeVerdict(withSpan, 'NOT GIVEN')).toBe(true);
    expect(canSubmitJudgeVerdict(withSpan, 'YES')).toBe(false);
    expect(canSubmitJudgeVerdict(withSpan, 'NO')).toBe(false);
  });

  it('restricts verdicts to NOT GIVEN or FALSE/NO when noDirectInfo is toggled', () => {
    const tfngState = toggleJudgeNoDirectInfo(createJudgeSession(R1_FIXTURE_P1), true);
    expect(canSubmitJudgeVerdict(tfngState, 'TRUE')).toBe(false);
    expect(canSubmitJudgeVerdict(tfngState, 'FALSE')).toBe(true);
    expect(canSubmitJudgeVerdict(tfngState, 'NOT GIVEN')).toBe(true);

    const ynngState = toggleJudgeNoDirectInfo(createJudgeSession(R1_FIXTURE_P3), true);
    expect(canSubmitJudgeVerdict(ynngState, 'YES')).toBe(false);
    expect(canSubmitJudgeVerdict(ynngState, 'NO')).toBe(true);
    expect(canSubmitJudgeVerdict(ynngState, 'NOT GIVEN')).toBe(true);
  });
});

describe('R1 · TFNG Judge — 2-Layer Scoring & Evidence Edge Cases', () => {
  it('awards Chuẩn (15 XP) when verdict is correct and evidence IoU >= 0.3', () => {
    let state = createJudgeSession(R1_FIXTURE_P1, { level: 5 });
    const q1Gold = state.items[0].question.evidence[0]; // FALSE
    state = selectJudgeEvidence(state, q1Gold);
    state = submitJudgeVerdict(state, 'FALSE', 42_000);

    expect(state.lastResult?.outcome).toBe('perfect');
    expect(state.lastResult?.outcomeLabelVi).toBe('Chuẩn');
    expect(state.lastResult?.xpEarned).toBe(15);
    expect(state.lastResult?.fsrsRating).toBe(Rating.Good);
    expect(state.lastResult?.retryCard).toBeNull();
  });

  it('awards Chuẩn (15 XP) when user highlights a short phrase in the same sentence as gold evidence', () => {
    const paraB = R1_FIXTURE_P1.paragraphs.find((p) => p.label === 'B')!;
    const q1 = R1_FIXTURE_P1.questionGroups[0].questions[0];
    const shortPhrase = 'expanded their canopy by 10%';
    const start = paraB.text.indexOf(shortPhrase);
    const shortSpan = {
      paragraph: 'B',
      start,
      end: start + shortPhrase.length,
      quote: shortPhrase,
    };

    const evCheck = evaluateJudgeEvidence(R1_FIXTURE_P1, q1.evidence, 'FALSE', shortSpan, false);
    expect(evCheck.passed).toBe(true);
    expect(evCheck.matchedBy).toBe('same_sentence');
  });

  it('scores Đúng may (5 XP, Hard) when verdict is right but evidence is in the wrong paragraph', () => {
    let state = createJudgeSession(R1_FIXTURE_P1, { level: 5 });
    const paraA = R1_FIXTURE_P1.paragraphs[0];
    state = selectJudgeEvidence(state, {
      paragraph: 'A',
      start: 0,
      end: 40,
      quote: paraA.text.slice(0, 40),
    });
    state = submitJudgeVerdict(state, 'FALSE', 35_000);

    expect(state.lastResult?.outcome).toBe('lucky');
    expect(state.lastResult?.outcomeLabelVi).toBe('Đúng may');
    expect(state.lastResult?.xpEarned).toBe(5);
    expect(state.lastResult?.fsrsRating).toBe(Rating.Hard);
    expect(state.lastResult?.retryCard).toBeNull();
  });

  it('scores Đúng may with highlightedTooBroad when user highlights the entire paragraph', () => {
    const paraB = R1_FIXTURE_P1.paragraphs.find((p) => p.label === 'B')!;
    const fullParaSpan = {
      paragraph: 'B',
      start: 0,
      end: paraB.text.length,
      quote: paraB.text,
    };

    let state = createJudgeSession(R1_FIXTURE_P1, { level: 5 });
    state = selectJudgeEvidence(state, fullParaSpan);
    state = submitJudgeVerdict(state, 'FALSE', 40_000);

    expect(state.lastResult?.outcome).toBe('lucky');
    expect(state.lastResult?.evidenceCheck.highlightedTooBroad).toBe(true);
    expect(state.lastResult?.diagnosisVi).toContain('bôi câu cụ thể');
  });

  it('scores Hiểu sai (0 XP, Again) when verdict is wrong but evidence is right', () => {
    let state = createJudgeSession(R1_FIXTURE_P1, { level: 5 });
    const q1Gold = state.items[0].question.evidence[0];
    state = selectJudgeEvidence(state, q1Gold);
    state = submitJudgeVerdict(state, 'NOT GIVEN', 38_000);

    expect(state.lastResult?.outcome).toBe('misread');
    expect(state.lastResult?.outcomeLabelVi).toBe('Hiểu sai');
    expect(state.lastResult?.xpEarned).toBe(0);
    expect(state.lastResult?.fsrsRating).toBe(Rating.Again);
    expect(state.lastResult?.retryCard?.itemId).toBe('tfng:p1-q1');
    expect(state.lastResult?.retryCard?.face).toBe('tfng_retry');
  });

  it('scores Lạc (0 XP, Again) when both verdict and evidence are wrong', () => {
    let state = createJudgeSession(R1_FIXTURE_P1, { level: 5 });
    const paraF = R1_FIXTURE_P1.paragraphs[5];
    state = selectJudgeEvidence(state, {
      paragraph: 'F',
      start: 0,
      end: 35,
      quote: paraF.text.slice(0, 35),
    });
    state = submitJudgeVerdict(state, 'TRUE', 50_000);

    expect(state.lastResult?.outcome).toBe('lost');
    expect(state.lastResult?.outcomeLabelVi).toBe('Lạc');
    expect(state.lastResult?.xpEarned).toBe(0);
    expect(state.lastResult?.fsrsRating).toBe(Rating.Again);
    expect(state.lastResult?.retryCard?.itemId).toBe('tfng:p1-q1');
  });

  it('scores NOT GIVEN as Chuẩn both with noDirectInfo and with closest gold span', () => {
    // Advance to p1-q4 (NOT GIVEN, index 3)
    let state = createJudgeSession(R1_FIXTURE_P1, { level: 5 });
    state = { ...state, currentIndex: 3 };

    const viaNoDirect = submitJudgeVerdict(
      toggleJudgeNoDirectInfo(state, true),
      'NOT GIVEN',
      25_000,
    );
    expect(viaNoDirect.lastResult?.outcome).toBe('perfect');
    expect(viaNoDirect.lastResult?.xpEarned).toBe(15);
    expect(viaNoDirect.lastResult?.evidenceCheck.matchedBy).toBe('ng_no_direct_info');

    const q4Gold = state.items[3].question.evidence[0];
    const viaClosestSpan = submitJudgeVerdict(
      selectJudgeEvidence(state, q4Gold),
      'NOT GIVEN',
      25_000,
    );
    expect(viaClosestSpan.lastResult?.outcome).toBe('perfect');
    expect(viaClosestSpan.lastResult?.xpEarned).toBe(15);
  });

  it('supports paragraph hint at level 1–4 (-50% XP) and disables it at level 5+', () => {
    let low = createJudgeSession(R1_FIXTURE_P1, { level: 2 });
    low = useJudgeParagraphHint(low);
    expect(low.hintedParagraph).toBe('B');
    expect(low.hintUsedForCurrent).toBe(true);
    low = selectJudgeEvidence(low, low.items[0].question.evidence[0]);
    low = submitJudgeVerdict(low, 'FALSE', 30_000);
    expect(low.lastResult?.xpEarned).toBe(8); // Math.round(15 * 0.5)

    let high = createJudgeSession(R1_FIXTURE_P1, { level: 5 });
    high = useJudgeParagraphHint(high);
    expect(high.hintedParagraph).toBeNull();
    expect(high.hintUsedForCurrent).toBe(false);
  });

  it('handles multi-span evidence where highlighting either span passes', () => {
    const paraA = R1_FIXTURE_P1.paragraphs[0];
    const bounds1 = findParagraphSentenceBounds(paraA.text, 5);
    const bounds2 = findParagraphSentenceBounds(paraA.text, bounds1.end + 5);
    const goldSpans = [
      { paragraph: 'A', start: bounds1.start, end: bounds1.end, quote: paraA.text.slice(bounds1.start, bounds1.end) },
      { paragraph: 'A', start: bounds2.start, end: bounds2.end, quote: paraA.text.slice(bounds2.start, bounds2.end) },
    ];
    const check = evaluateJudgeEvidence(R1_FIXTURE_P1, goldSpans, 'TRUE', goldSpans[1], false);
    expect(check.passed).toBe(true);
  });
});

describe('R1 · TFNG Judge — Confusion Matrix, Trap Stats & SRS', () => {
  it('computes 3x3 confusion matrix across TFNG and YNNG and merges rolling totals', () => {
    let m1 = createEmptyConfusionMatrix();
    m1 = recordConfusion(m1, 'TRUE', 'TRUE');
    m1 = recordConfusion(m1, 'FALSE', 'NOT GIVEN'); // F -> NG confusion
    m1 = recordConfusion(m1, 'NO', 'NO'); // YNNG normalized to FALSE
    m1 = recordConfusion(m1, 'YES', 'YES'); // YNNG normalized to TRUE

    let m2 = createEmptyConfusionMatrix();
    m2 = recordConfusion(m2, 'NOT GIVEN', 'FALSE'); // NG -> F confusion

    const merged = mergeConfusionMatrices(m1, m2);
    expect(merged.TRUE.TRUE).toBe(2);
    expect(merged.FALSE.FALSE).toBe(1);
    expect(merged.FALSE['NOT GIVEN']).toBe(1);
    expect(merged['NOT GIVEN'].FALSE).toBe(1);

    const fn = getFalseVsNgStats(merged);
    expect(fn.correct).toBe(1);
    expect(fn.total).toBe(3);
    expect(fn.confusedCount).toBe(2);
  });

  it('never creates SRS tfng:<qid> retry cards for reserved exam passages', () => {
    const reservedPassage: ReadingPassage = { ...R1_FIXTURE_P1, reserved: true };
    const card = createTfngRetryCardIfNeeded(
      reservedPassage,
      R1_FIXTURE_P1.questionGroups[0].questions[0],
      'misread',
    );
    expect(card).toBeNull();

    const trainingCard = createTfngRetryCardIfNeeded(
      R1_FIXTURE_P1,
      R1_FIXTURE_P1.questionGroups[0].questions[0],
      'lost',
    );
    expect(trainingCard).not.toBeNull();
    expect(trainingCard!.id).toBe('tfng:p1-q1#tfng_retry');
  });

  it('auto-retires tfng_retry card after 3 successful reviews', () => {
    const now = new Date('2026-11-20T10:00:00Z');
    let card = createTfngRetryCardIfNeeded(
      R1_FIXTURE_P1,
      R1_FIXTURE_P1.questionGroups[0].questions[0],
      'misread',
      now,
    )!;

    const r1 = reviewTfngRetryCard(card, true, new Date(now.getTime() + 86_400_000));
    expect(r1.retired).toBe(false);
    expect(r1.card.unlocked).toBe(true);

    const r2 = reviewTfngRetryCard(r1.card, true, new Date(now.getTime() + 3 * 86_400_000));
    expect(r2.retired).toBe(false);
    expect(r2.card.unlocked).toBe(true);

    const r3 = reviewTfngRetryCard(r2.card, true, new Date(now.getTime() + 8 * 86_400_000));
    expect(r3.retired).toBe(true);
    expect(r3.card.unlocked).toBe(false);
  });

  it('extracts paraphrase pairs from reasoning steps and creates para_match SRS cards', () => {
    const steps = R1_FIXTURE_P1.questionGroups[0].questions[1].steps;
    const suggestions = extractParaphraseSuggestions(steps, 'p1-q2');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions[0].sourcePhrase).toBe('narrow commercial streets');
    expect(suggestions[0].targetPhrase).toBe('commercial corridors with narrow pavements');

    const card = createParaphraseSrsCard(suggestions[0]);
    expect(card.itemId.startsWith('para:')).toBe(true);
    expect(card.face).toBe('para_match');
  });

  it('runs a complete Judge session end-to-end and generates a meaningful win statement', () => {
    let state = createJudgeSession(R1_FIXTURE_P1, { level: 5 });
    for (let i = 0; i < state.items.length; i++) {
      const q = state.items[i].question;
      state = selectJudgeEvidence(state, q.evidence[0]);
      state = submitJudgeVerdict(state, q.answer.key as 'TRUE' | 'FALSE' | 'NOT GIVEN', 40_000);
      state = nextJudgeQuestion(state);
    }
    expect(state.finished).toBe(true);
    expect(state.results).toHaveLength(6);
    expect(state.totalXp).toBe(90);
    expect(state.trapStats.qualifier).toEqual({ total: 1, wrong: 0 });
    expect(buildJudgeWinStatement(state)).toContain('Chuẩn 6/6');
  });
});

describe('R1 · Passage Mode (Training & Exam) — All ReadingQTypes', () => {
  it('scores every ReadingQType accurately via readingAnswer.ts', () => {
    const makeGroup = (type: ReadingQuestionGroup['type'], extra?: Partial<ReadingQuestionGroup>): ReadingQuestionGroup => ({
      groupId: `g-${type}`,
      type,
      instructions: 'Test instructions',
      questions: [],
      ...extra,
    });

    const baseQ = {
      qid: 'q1',
      number: 1,
      prompt: 'Prompt',
      evidence: [],
      explanationVi: 'Exp',
    };

    // tfng & ynng (including format-confusion rejection)
    expect(scorePassageQuestion(makeGroup('tfng'), { ...baseQ, answer: { key: 'TRUE' } }, 'TRUE').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('tfng'), { ...baseQ, answer: { key: 'TRUE' } }, 'YES').reason).toBe('wrong_format_ynng');
    expect(scorePassageQuestion(makeGroup('ynng'), { ...baseQ, answer: { key: 'NO' } }, 'NO').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('ynng'), { ...baseQ, answer: { key: 'NO' } }, 'FALSE').reason).toBe('wrong_format_tfng');

    // headings (case-insensitive roman numeral)
    expect(scorePassageQuestion(makeGroup('headings'), { ...baseQ, answer: { key: 'iv' } }, 'IV').correct).toBe(true);

    // mcq_single & mcq_multi
    expect(scorePassageQuestion(makeGroup('mcq_single'), { ...baseQ, answer: { key: 'B' } }, 'b').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('mcq_multi'), { ...baseQ, answer: { keys: ['A', 'D'] } }, ['D', 'A']).correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('mcq_multi'), { ...baseQ, answer: { keys: ['A', 'D'] } }, ['A']).reason).toBe('partial_match');

    // matching_info, matching_features, sentence_endings, summary_wordlist
    expect(scorePassageQuestion(makeGroup('matching_info'), { ...baseQ, answer: { key: 'C' } }, 'C').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('matching_features'), { ...baseQ, answer: { key: 'B' } }, 'B').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('sentence_endings'), { ...baseQ, answer: { key: 'E' } }, 'E').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('summary_wordlist'), { ...baseQ, answer: { key: 'G' } }, 'G').correct).toBe(true);

    // completion types + word limit + spelling
    const wl1 = { words: 1 as const, allowNumber: false };
    const wl2 = { words: 2 as const, allowNumber: true };
    expect(scorePassageQuestion(makeGroup('summary_completion', { wordLimit: wl2 }), { ...baseQ, answer: { accepted: ['paving slabs'] } }, 'paving slabs').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('summary_completion', { wordLimit: wl1 }), { ...baseQ, answer: { accepted: ['blight'] } }, 'fungal blight').reason).toBe('word_limit_exceeded');
    expect(scorePassageQuestion(makeGroup('sentence_completion', { wordLimit: wl1 }), { ...baseQ, answer: { accepted: ['synthesis'] } }, 'synthesis').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('table_completion', { wordLimit: wl2 }), { ...baseQ, answer: { accepted: ['15 percent'] } }, '15%').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('flowchart_completion', { wordLimit: wl1 }), { ...baseQ, answer: { accepted: ['filtration'] } }, 'filtration').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('diagram_labelling', { wordLimit: wl1 }), { ...baseQ, answer: { accepted: ['valve'] } }, 'valve').correct).toBe(true);
    expect(scorePassageQuestion(makeGroup('short_answer', { wordLimit: wl2 }), { ...baseQ, answer: { accepted: ['stormwater runoff'] } }, 'stormwater runoff').correct).toBe(true);
  });

  it('runs a full 13-question Passage Exam with flagging, timer tick, and timeout submission', () => {
    let state = createPassageSession(R1_FIXTURE_P1, { mode: 'exam', durationSec: 1200 });
    expect(state.questions).toHaveLength(13);
    expect(state.remainingSec).toBe(1200);

    // Flag Q1, navigate to Q7, fill all 13 answers accurately
    state = togglePassageFlag(state, 'p1-q1');
    expect(state.flaggedQids).toEqual(['p1-q1']);
    state = selectPassageQuestion(state, 'p1-q7');
    expect(state.currentQid).toBe('p1-q7');

    for (const item of state.questions) {
      const expected = item.question.answer.key ?? item.question.answer.accepted?.[0] ?? '';
      state = setPassageAnswer(state, item.qid, expected);
    }

    // Fast-forward timer to 0 and submit as timeout
    state = tickPassageTimer(state, 1200);
    expect(state.remainingSec).toBe(0);

    state = submitPassageSession(state, 'timeout');
    expect(state.submitted).toBe(true);
    expect(state.summary?.submitReason).toBe('timeout');
    expect(state.summary?.score).toBe(13);
    expect(state.summary?.total).toBe(13);
    expect(state.summary?.estimatedBand).toBe(9.0);
    expect(state.summary?.retryCards).toHaveLength(0);
  });

  it('tracks optional evidence in Passage training mode and creates retry cards for missed TFNG/YNNG', () => {
    let state = createPassageSession(R1_FIXTURE_P3, {
      mode: 'training',
      requireEvidence: true,
    });
    expect(state.questions).toHaveLength(14);

    // Answer Q6 (YNNG, expected NO) wrongly with YES, and attach evidence for Q1
    const q1Ev = state.questions[0].question.evidence[0];
    state = setPassageEvidence(state, 'p3-q1', q1Ev);
    state = setPassageAnswer(state, 'p3-q1', 'iii');
    state = setPassageAnswer(state, 'p3-q6', 'YES');

    state = submitPassageSession(state, 'manual');
    const q1Grade = state.summary!.grades.find((g) => g.qid === 'p3-q1')!;
    expect(q1Grade.scoreResult.correct).toBe(true);
    expect(q1Grade.evidencePassed).toBe(true);

    // Missed YNNG questions should generate tfng_retry SRS cards
    expect(state.summary!.retryCards.some((c) => c.itemId === 'tfng:p3-q6')).toBe(true);
  });
});

describe('Reading Placement (src/features/placement/readingPlacement.ts)', () => {
  it('verifies mini-passage structure, 6 questions across TFNG/Paraphrase/Inference, and exact spans', () => {
    expect(READING_PLACEMENT_PASSAGE.paragraphs).toHaveLength(3);
    expect(READING_PLACEMENT_QUESTIONS).toHaveLength(6);

    const skills = new Set(READING_PLACEMENT_QUESTIONS.map((q) => q.skill));
    expect(skills).toEqual(new Set(['tfng', 'paraphrase', 'inference']));

    for (const q of READING_PLACEMENT_QUESTIONS) {
      const para = READING_PLACEMENT_PASSAGE.paragraphs.find((p) => p.label === q.evidence.paragraph);
      expect(para).toBeDefined();
      expect(para!.text.slice(q.evidence.start, q.evidence.end)).toBe(q.evidence.quote);
    }
  });

  it('evaluates reading placement scores accurately from Band 5.0 to Band 8.5', () => {
    const allCorrect = Object.fromEntries(
      READING_PLACEMENT_QUESTIONS.map((q) => [q.id, q.correctKey]),
    );
    const high = evaluateReadingPlacement(allCorrect);
    expect(high.correct).toBe(6);
    expect(high.total).toBe(6);
    expect(high.estimatedBand).toBe(8.5);
    expect(high.recommendedLevel).toBe(5);
    expect(high.bySkill.tfng).toEqual({ correct: 3, total: 3 });
    expect(high.bySkill.paraphrase).toEqual({ correct: 2, total: 2 });
    expect(high.bySkill.inference).toEqual({ correct: 1, total: 1 });

    const noneCorrect = evaluateReadingPlacement({});
    expect(noneCorrect.correct).toBe(0);
    expect(noneCorrect.estimatedBand).toBe(5.0);
    expect(noneCorrect.recommendedLevel).toBe(1);

    const mid = evaluateReadingPlacement({
      'rpl-q1': 'TRUE',
      'rpl-q2': 'FALSE',
      'rpl-q3': 'FALSE', // wrong
      'rpl-q4': 'B',
      'rpl-q5': 'A', // wrong
      'rpl-q6': 'B', // wrong
    });
    expect(mid.correct).toBe(3);
    expect(mid.estimatedBand).toBeGreaterThanOrEqual(6.0);
    expect(mid.estimatedBand).toBeLessThanOrEqual(7.0);
  });
});
