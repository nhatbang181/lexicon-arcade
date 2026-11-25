import { describe, expect, it } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import {
  CollocationItemSchema,
  DictationItemSchema,
  ErrorItemSchema,
  ParaphraseItemSchema,
  VocabItemSchema,
} from '../../core/content/schemas';
import { createNewCard, type SRSCard } from '../../core/srs/fsrsAdapter';
import {
  V1_FIXTURE_COLLOCATIONS,
  V1_FIXTURE_CONTENT,
  V1_FIXTURE_DICTATION,
  V1_FIXTURE_ERRORS,
  V1_FIXTURE_PARAPHRASES,
  V1_FIXTURE_VOCAB,
  buildV1FixtureCards,
} from '../../test/fixtures/v1_fixtures';
import {
  BOSS_DEFEAT_XP,
  BUSY_RUN_CARDS,
  SESSION_COMPLETE_FIRST_XP,
  SESSION_COMPLETE_REPEAT_XP,
  STAGE_SIZE,
  THORNY_PATH_CARD_COUNT,
  advanceAfterFeedback,
  analyzeSpellingError,
  applyNodeHint,
  buildPlaceholderMask,
  buildPromptForCard,
  buildV1WinStatement,
  chooseCheckpointFork,
  computeCharDiff,
  computeRecent7DayRetention,
  computeSessionCompletionXp,
  computeV1TurnXp,
  continueFromCheckpoint,
  createV1Run,
  downgradeFace,
  finishAtCheckpoint,
  getActiveNode,
  getComboMultiplier,
  hydrateRunContent,
  isProductionFace,
  previewThornyForkCards,
  recordNodeAudioPlay,
  scorePromptAnswer,
  selectBossModifier,
  submitIntroAction,
  submitNodeAnswer,
  type V1PromptPayload,
} from './engine';

const FIXED_NOW = new Date('2026-11-20T09:00:00Z');

/** Dựng prompt và khẳng định item có thật (engine trả null thay vì rơi về phần tử đầu, V1-2). */
function promptFor(...args: Parameters<typeof buildPromptForCard>): V1PromptPayload {
  const prompt = buildPromptForCard(...args);
  if (!prompt) throw new Error(`Không dựng được prompt cho ${args[0]} (${args[1]})`);
  return prompt;
}

function makeDueTestCard(
  itemId: string,
  face: SRSCard['face'],
  stability = 5,
  overdueHours = 24,
): SRSCard {
  const base = createNewCard(itemId, face, { now: FIXED_NOW, unlocked: true });
  return {
    ...base,
    state: State.Review,
    stability,
    difficulty: 5,
    elapsed_days: 3,
    scheduled_days: Math.round(stability),
    reps: 3,
    lapses: 0,
    streak: 2,
    last_review: FIXED_NOW.getTime() - 3 * 86_400_000,
    due: FIXED_NOW.getTime() - overdueHours * 3_600_000,
  };
}

describe('V1 · Daily Run Engine & Fixtures', () => {
  it('1. validates all 32 items in v1_fixtures.ts against strict Zod schemas across all 5 item types', () => {
    const totalCount =
      V1_FIXTURE_VOCAB.length +
      V1_FIXTURE_COLLOCATIONS.length +
      V1_FIXTURE_PARAPHRASES.length +
      V1_FIXTURE_ERRORS.length +
      V1_FIXTURE_DICTATION.length;

    expect(totalCount).toBeGreaterThanOrEqual(25);

    for (const v of V1_FIXTURE_VOCAB) {
      expect(() => VocabItemSchema.parse(v)).not.toThrow();
    }
    for (const c of V1_FIXTURE_COLLOCATIONS) {
      expect(() => CollocationItemSchema.parse(c)).not.toThrow();
    }
    for (const p of V1_FIXTURE_PARAPHRASES) {
      expect(() => ParaphraseItemSchema.parse(p)).not.toThrow();
    }
    for (const e of V1_FIXTURE_ERRORS) {
      expect(() => ErrorItemSchema.parse(e)).not.toThrow();
    }
    for (const d of V1_FIXTURE_DICTATION) {
      expect(() => DictationItemSchema.parse(d)).not.toThrow();
    }
  });

  it('2. Face 1 (intro): "Đã xem" không cộng XP, đánh dấu introSeenAt và chèn node recog; "Tôi biết rồi" switches immediately to recall_meaning', () => {
    const newVocabCard = createNewCard('vocab:ubiquitous', 'recog', {
      now: FIXED_NOW,
      unlocked: true,
    });
    const dueCard = makeDueTestCard('vocab:curriculum', 'recog');

    // Branch A: "Đã xem"
    const runA = createV1Run({
      cards: [newVocabCard, dueCard],
      content: V1_FIXTURE_CONTENT,
      now: FIXED_NOW,
    });
    const introNode = runA.nodes.find((n) => n.itemId === 'vocab:ubiquitous');
    expect(introNode?.face).toBe('intro');
    if (introNode && introNode.prompt.face === 'intro') {
      expect(introNode.prompt.collocations.length).toBe(2);
      expect(introNode.prompt.headword).toBe('ubiquitous');
    }

    // Move index to the intro node and click "Đã xem"
    const introIdx = runA.nodes.findIndex((n) => n.face === 'intro');
    const stateAtIntro = { ...runA, currentIndex: introIdx };
    const afterSeen = submitIntroAction(stateAtIntro, 'seen', FIXED_NOW);
    expect(afterSeen.totalXp).toBe(0);
    expect(afterSeen.updatedCards['vocab:ubiquitous#recog']?.introSeenAt).toBe(FIXED_NOW.getTime());

    // Branch B: "Tôi biết rồi" -> switches immediately to recall_meaning on the active node
    const afterKnow = submitIntroAction(stateAtIntro, 'know_already', FIXED_NOW);
    const activeAfterKnow = getActiveNode(afterKnow);
    expect(activeAfterKnow?.face).toBe('recall_meaning');
    expect(activeAfterKnow?.fromIntroKnowAlready).toBe(true);
    expect(
      afterKnow.events.some((e) => e.type === 'intro_know_already'),
    ).toBe(true);
  });

  it('3. Face 2 (recog): grades 4-option meaning choice by index (1-4) or meaning text, and hint eliminates 1 wrong choice', () => {
    const card = makeDueTestCard('vocab:proliferate', 'recog');
    let state = createV1Run({
      cards: [card],
      content: V1_FIXTURE_CONTENT,
      now: FIXED_NOW,
    });

    const node = getActiveNode(state)!;
    expect(node.prompt.face).toBe('recog');
    if (node.prompt.face !== 'recog') return;

    expect(node.prompt.choices.length).toBe(4);
    const correctChoiceNum = String(node.prompt.correctIndex + 1);

    // Use hint H -> eliminates 1 wrong choice and marks hintsUsed = 1 -> rated Hard
    state = applyNodeHint(state);
    const afterHintNode = getActiveNode(state)!;
    expect(afterHintNode.eliminatedChoices.length).toBe(1);
    expect(afterHintNode.eliminatedChoices[0]).not.toBe(node.prompt.correctIndex);

    state = submitNodeAnswer(state, correctChoiceNum, 3000, FIXED_NOW);
    expect(state.feedback?.status).toBe('correct');
    expect(state.feedback?.rating).toBe(Rating.Hard);
  });

  it('4. Face 3 (recall_meaning): grades exact match, UK/US spelling variants, and multi-word space/hyphen indifference', () => {
    const promptUkUs = promptFor(
      'vocab:organise',
      'recall_meaning',
      V1_FIXTURE_CONTENT,
      5,
    );
    // Answering US variant "organize" for UK headword "organise"
    const resUs = scorePromptAnswer(promptUkUs, 'organize');
    expect(resUs.status).toBe('correct');
    expect(resUs.correct).toBe(true);

    // Answering multi-word "rote-learning" or "rote   learning" for "rote learning"
    const promptMulti = promptFor(
      'vocab:rote_learning',
      'recall_meaning',
      V1_FIXTURE_CONTENT,
      5,
    );
    expect(promptMulti.face).toBe('recall_meaning');
    if (promptMulti.face === 'recall_meaning') {
      expect(promptMulti.placeholderMask).toContain('·');
    }
    expect(scorePromptAnswer(promptMulti, 'rote-learning').status).toBe('correct');
    expect(scorePromptAnswer(promptMulti, 'rote   learning').status).toBe('correct');
  });

  it('5. Face 3 (recall_meaning): 1-character typo on word >= 7 letters is graded partial -> Hard and identifies wrong character', () => {
    const card = makeDueTestCard('vocab:curriculum', 'recall_meaning');
    let state = createV1Run({
      cards: [card],
      content: V1_FIXTURE_CONTENT,
      skillLevel: 5,
      now: FIXED_NOW,
    });

    // "curriculum" has 10 letters (>= 7). Typing "curiculum" (missing 1 'r') = 1 edit distance
    state = submitNodeAnswer(state, 'curiculum', 4500, FIXED_NOW);
    expect(state.feedback?.status).toBe('partial');
    expect(state.feedback?.rating).toBe(Rating.Hard);
    expect(state.feedback?.charDiff?.some((s) => s.status !== 'match')).toBe(true);
    expect(state.feedback?.wrongCharNotice).toBeTruthy();

    // Short word (< 7 letters) or >= 2 edits should be graded wrong -> Again
    const stateWrong = submitNodeAnswer(
      createV1Run({
        cards: [card],
        content: V1_FIXTURE_CONTENT,
        skillLevel: 5,
        now: FIXED_NOW,
      }),
      'curicxlxm',
      4500,
      FIXED_NOW,
    );
    expect(stateWrong.feedback?.status).toBe('wrong');
    expect(stateWrong.feedback?.rating).toBe(Rating.Again);
  });

  it('6. Face 3 (recall_meaning): skillLevel <= 3 reveals first letter automatically; skillLevel > 3 hides all letters initially', () => {
    const promptEasy = promptFor(
      'vocab:curriculum',
      'recall_meaning',
      V1_FIXTURE_CONTENT,
      2,
    );
    const promptHard = promptFor(
      'vocab:curriculum',
      'recall_meaning',
      V1_FIXTURE_CONTENT,
      5,
    );

    expect(promptEasy.face).toBe('recall_meaning');
    expect(promptHard.face).toBe('recall_meaning');
    if (promptEasy.face === 'recall_meaning' && promptHard.face === 'recall_meaning') {
      expect(promptEasy.initialRevealedCount).toBe(1);
      expect(promptEasy.placeholderMask.startsWith('c ')).toBe(true);
      expect(promptHard.initialRevealedCount).toBe(0);
      expect(promptHard.placeholderMask.startsWith('_ ')).toBe(true);
    }
  });

  it('7. Face 4 (recall_cloze): blanks target word in example sentence and accepts all forms in clozeAccepted and family', () => {
    const prompt = promptFor(
      'vocab:mitigate',
      'recall_cloze',
      V1_FIXTURE_CONTENT,
      4,
    );
    expect(prompt.face).toBe('recall_cloze');
    if (prompt.face !== 'recall_cloze') return;

    expect(prompt.clozeSentenceEn).toContain('_____');
    expect(scorePromptAnswer(prompt, 'mitigate').status).toBe('correct');
    expect(scorePromptAnswer(prompt, 'mitigated').status).toBe('correct');
    expect(scorePromptAnswer(prompt, 'mitigating').status).toBe('correct');
    expect(scorePromptAnswer(prompt, 'mitigation').status).toBe('correct');
    expect(scorePromptAnswer(prompt, 'exacerbate').status).toBe('wrong');
  });

  it('8. Face 5 (listen_spell): enforces maxPlays = 2 (or 1 when skillLevel >= 7) and requires 100% spelling with double/silent letter diagnostics', () => {
    const card = makeDueTestCard('vocab:accommodate', 'listen_spell');

    // Level 4 -> maxPlays = 2
    let stateLvl4 = createV1Run({
      cards: [card],
      content: V1_FIXTURE_CONTENT,
      skillLevel: 4,
      now: FIXED_NOW,
    });
    const play1 = recordNodeAudioPlay(stateLvl4);
    expect(play1.allowed).toBe(true);
    expect(play1.remainingPlays).toBe(1);
    const play2 = recordNodeAudioPlay(play1.state);
    expect(play2.allowed).toBe(true);
    expect(play2.remainingPlays).toBe(0);
    const play3 = recordNodeAudioPlay(play2.state);
    expect(play3.allowed).toBe(false);

    // Level 7 -> maxPlays = 1
    const stateLvl7 = createV1Run({
      cards: [card],
      content: V1_FIXTURE_CONTENT,
      skillLevel: 7,
      now: FIXED_NOW,
    });
    const p1 = recordNodeAudioPlay(stateLvl7);
    expect(p1.allowed).toBe(true);
    expect(p1.remainingPlays).toBe(0);
    const p2 = recordNodeAudioPlay(p1.state);
    expect(p2.allowed).toBe(false);

    // Double-letter mistake on "accommodate" ("acomodate") -> strict wrong + double-letter tipVi
    stateLvl4 = submitNodeAnswer(stateLvl4, 'acomodate', 5000, FIXED_NOW);
    expect(stateLvl4.feedback?.status).toBe('wrong');
    expect(stateLvl4.feedback?.spellingAnalysis?.hasDoubleLetterError).toBe(true);
    expect(stateLvl4.feedback?.explanationVi).toContain('chữ đôi');

    // Silent-letter mistake on "environment" ("enviroment") -> silent-letter tipVi
    const silentAnalysis = analyzeSpellingError('enviroment', 'environment');
    expect(silentAnalysis.hasSilentLetterError).toBe(true);
    expect(silentAnalysis.silentLetter).toBe('n');
    expect(silentAnalysis.tipVi).toContain('âm câm');
  });

  it('9. Face 6 (col_gap): matches all accepted answers in collocation gap and surfaces L1 Vietnamese translation traps on failure', () => {
    const prompt = promptFor(
      'col:curriculum_reform',
      'col_gap',
      V1_FIXTURE_CONTENT,
      4,
    );
    expect(prompt.face).toBe('col_gap');

    // Accepted verbs: implement, introduce, initiate, pursue
    expect(scorePromptAnswer(prompt, 'implement').status).toBe('correct');
    expect(scorePromptAnswer(prompt, 'initiate').status).toBe('correct');

    // L1 trap "do" -> wrong with l1Trap explanation
    const wrongOutcome = scorePromptAnswer(prompt, 'do');
    expect(wrongOutcome.status).toBe('wrong');
    expect(wrongOutcome.vnTrap).toContain('do/make');
  });

  it('10. Face 7 (para_match): grades 4-option paraphrase selection and explains decoy trap when wrong', () => {
    const prompt = promptFor(
      'para:0001',
      'para_match',
      V1_FIXTURE_CONTENT,
      4,
    );
    expect(prompt.face).toBe('para_match');
    if (prompt.face !== 'para_match') return;

    expect(prompt.choices.length).toBe(4);
    const rightChoice = String(prompt.correctIndex + 1);
    expect(scorePromptAnswer(prompt, rightChoice).status).toBe('correct');

    const wrongIdx = (prompt.correctIndex + 1) % 4;
    const wrongOutcome = scorePromptAnswer(prompt, String(wrongIdx + 1));
    expect(wrongOutcome.status).toBe('wrong');
    expect(wrongOutcome.explanationVi.length).toBeGreaterThan(10);
  });

  it('11. Face 8 (err_fix): extracts underlined errorSpan, accepts both span correction and full corrected sentence', () => {
    const prompt = promptFor(
      'err:article_0002',
      'err_fix',
      V1_FIXTURE_CONTENT,
      4,
    );
    expect(prompt.face).toBe('err_fix');
    if (prompt.face !== 'err_fix') return;

    expect(prompt.errorSpanText).toBe('environment');
    expect(prompt.expectedCorrection).toBe('the environment');

    // Typing just the corrected span
    expect(scorePromptAnswer(prompt, 'the environment').status).toBe('correct');
    // Typing the full corrected sentence
    expect(
      scorePromptAnswer(
        prompt,
        'Governments must protect the environment from industrial pollution.',
      ).status,
    ).toBe('correct');
    // Typing wrong correction
    expect(scorePromptAnswer(prompt, 'an environment').status).toBe('wrong');
  });

  it('12. downgrades wrong card by 1 difficulty step and re-inserts it 3-5 nodes later in the queue', () => {
    expect(downgradeFace('recall_meaning', 'vocab:curriculum')).toBe('recog');
    expect(downgradeFace('recall_cloze', 'vocab:mitigate')).toBe('recog');
    expect(downgradeFace('listen_spell', 'vocab:accommodate')).toBe('recog');

    const cards = [
      makeDueTestCard('vocab:curriculum', 'recall_meaning', 4, 50),
      makeDueTestCard('vocab:mitigate', 'recall_cloze', 5, 45),
      makeDueTestCard('col:curriculum_reform', 'col_gap', 5, 40),
      makeDueTestCard('para:0001', 'para_match', 5, 35),
      makeDueTestCard('err:article_0001', 'err_fix', 5, 30),
      makeDueTestCard('vocab:disparity', 'recall_meaning', 6, 25),
      makeDueTestCard('vocab:allocate', 'recall_cloze', 6, 20),
    ];

    let state = createV1Run({
      cards,
      content: V1_FIXTURE_CONTENT,
      now: FIXED_NOW,
    });

    const firstNode = getActiveNode(state)!;
    const initialLen = state.nodes.length;

    // Submit wrong answer on first node (index 0)
    state = submitNodeAnswer(state, 'completely_wrong_answer', 4000, FIXED_NOW);
    expect(state.nodes.length).toBe(initialLen + 1);

    const reinsertEvent = state.events.find((e) => e.type === 'card_reinserted');
    expect(reinsertEvent).toBeDefined();
    if (reinsertEvent && reinsertEvent.type === 'card_reinserted') {
      expect(reinsertEvent.offset).toBeGreaterThanOrEqual(3);
      expect(reinsertEvent.offset).toBeLessThanOrEqual(5);
      expect(reinsertEvent.toFace).toBe('recog');
      const retryNode = state.nodes[reinsertEvent.insertedAtIndex];
      expect(retryNode.itemId).toBe(firstNode.itemId);
      expect(retryNode.isRetry).toBe(true);
      expect(retryNode.face).toBe('recog');
    }
  });

  it('13. records FSRS review ONLY on the first encounter of a card, not on subsequent retry turns', () => {
    const cards = [
      makeDueTestCard('vocab:curriculum', 'recall_meaning', 5, 48),
      makeDueTestCard('vocab:mitigate', 'recall_cloze', 5, 40),
      makeDueTestCard('col:curriculum_reform', 'col_gap', 5, 35),
      makeDueTestCard('para:0001', 'para_match', 5, 30),
    ];

    let state = createV1Run({
      cards,
      content: V1_FIXTURE_CONTENT,
      now: FIXED_NOW,
    });

    const firstCardId = getActiveNode(state)!.card.id;

    // 1. Fail on first encounter -> records 1 FSRS review with Rating.Again
    state = submitNodeAnswer(state, 'wrong_try', 3500, FIXED_NOW);
    expect(state.reviews.length).toBe(1);
    expect(state.reviews[0].cardId).toBe(firstCardId);
    expect(state.reviews[0].rating).toBe(Rating.Again);

    // Jump directly to the reinserted retry node and answer correctly
    const retryIdx = state.nodes.findIndex((n) => n.isRetry && n.card.id === firstCardId);
    expect(retryIdx).toBeGreaterThan(0);

    state = { ...state, currentIndex: retryIdx, feedback: null };
    const retryNode = getActiveNode(state)!;
    const correctChoice =
      retryNode.prompt.face === 'recog'
        ? retryNode.prompt.correctAnswer
        : 'curriculum';

    state = submitNodeAnswer(state, correctChoice, 2500, FIXED_NOW);
    expect(state.feedback?.status).toBe('correct');
    expect(state.nodes[retryIdx].repaired).toBe(true);

    // Still only 1 FSRS review for that card!
    const reviewsForFirstCard = state.reviews.filter((r) => r.cardId === firstCardId);
    expect(reviewsForFirstCard.length).toBe(1);
  });

  it('14. Boss phase: selects 5 lowest-retrievability cards, deals 20% HP per correct answer, does not lose life on wrong answer, and awards +50 XP on defeat', () => {
    const cards = buildV1FixtureCards(FIXED_NOW).slice(0, 6);
    let state = createV1Run({
      cards,
      content: V1_FIXTURE_CONTENT,
      mode: 'busy',
      now: FIXED_NOW,
    });

    expect(state.bossCandidateCards.length).toBe(5);

    // Jump to last regular node and finish it to enter Boss phase
    state = { ...state, currentIndex: state.nodes.length - 1 };
    const lastRegular = getActiveNode(state)!;
    const lastAns = getCorrectAnswerForPrompt(lastRegular.prompt);
    state = submitNodeAnswer(state, lastAns, 3000, FIXED_NOW);
    state = advanceAfterFeedback(state, FIXED_NOW);

    expect(state.phase).toBe('boss');
    expect(state.bossHp).toBe(100);
    expect(state.bossNodes.length).toBe(5);

    // Answer 1st boss card WRONG -> HP stays 100%, card is appended to bossNodes for retry
    state = submitNodeAnswer(state, 'wrong_boss_answer', 3000, FIXED_NOW);
    expect(state.bossHp).toBe(100);
    expect(state.bossNodes.length).toBe(6);
    state = advanceAfterFeedback(state, FIXED_NOW);

    // Answer remaining 5 boss cards CORRECTLY -> 20% HP each -> 100 -> 80 -> 60 -> 40 -> 20 -> 0
    const xpBeforeBossKills = state.totalXp;
    for (let k = 0; k < 5; k++) {
      const bossNode = getActiveNode(state)!;
      const ans = getCorrectAnswerForPrompt(bossNode.prompt);
      state = submitNodeAnswer(state, ans, 2800, FIXED_NOW);
      expect(state.bossHp).toBe(Math.max(0, 100 - (k + 1) * 20));
      state = advanceAfterFeedback(state, FIXED_NOW);
    }

    expect(state.bossHp).toBe(0);
    expect(state.bossDefeated).toBe(true);
    expect(state.totalXp).toBe(xpBeforeBossKills + BOSS_DEFEAT_XP + SESSION_COMPLETE_FIRST_XP);
    expect(state.phase).toBe('recap');
    expect(state.recap?.bossDefeated).toBe(true);
    expect(state.recap?.bossBonusXp).toBe(BOSS_DEFEAT_XP);
    expect(state.recap?.sessionCompletionXp).toBe(SESSION_COMPLETE_FIRST_XP);
    expect(
      Math.round((state.recap?.baseXp ?? 0) * (state.recap?.effectiveComboMultiplier ?? 1)) +
        (state.recap?.comboBonusXp ?? 0) +
        (state.recap?.bossBonusXp ?? 0) +
        (state.recap?.sessionCompletionXp ?? 0),
    ).toBe(state.recap?.totalXp);
  });

  it('15. unified XP economy (01-GAME §5): recall 10 XP, production 15 XP, combo ×1/×1.5/×2 cap ×2, session +20/+5, retry/exam 0 XP', () => {
    expect(getComboMultiplier(0)).toBe(1);
    expect(getComboMultiplier(4)).toBe(1);
    expect(getComboMultiplier(5)).toBe(1.5);
    expect(getComboMultiplier(9)).toBe(1.5);
    expect(getComboMultiplier(10)).toBe(2);
    expect(getComboMultiplier(25)).toBe(2);

    expect(isProductionFace('recog')).toBe(false);
    expect(isProductionFace('para_match')).toBe(false);
    expect(isProductionFace('recall_meaning')).toBe(true);
    expect(isProductionFace('listen_spell')).toBe(true);
    expect(isProductionFace('col_gap')).toBe(true);

    // Gợi nhớ đúng lượt đầu: 10 XP × combo (trần ×2)
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 1, face: 'recog' })).toBe(10);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 5, face: 'recog' })).toBe(15);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 10, face: 'recog' })).toBe(20);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 20, face: 'recog' })).toBe(20);

    // Sản xuất / gõ đúng lượt đầu: 15 XP × combo (trần ×2)
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 1, face: 'recall_meaning' })).toBe(15);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 5, face: 'recall_meaning' })).toBe(23);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 10, face: 'recall_meaning' })).toBe(30);

    // Đường gai ×1.5 (có trần)
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 1, face: 'recog', isThornyPath: true })).toBe(15);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 10, face: 'recog', isThornyPath: true })).toBe(25);

    // Again / Retry / Extra Practice / Exam -> 0 XP
    expect(computeV1TurnXp({ rating: Rating.Again, combo: 5, face: 'recog' })).toBe(0);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 6, face: 'recog', isRetry: true })).toBe(0);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 6, face: 'recog', isExtraPractice: true })).toBe(0);
    expect(computeV1TurnXp({ rating: Rating.Good, combo: 10, face: 'recall_meaning', examMode: true })).toBe(0);

    // Thưởng hoàn thành phiên: +20 lần đầu ngày, +5 lần sau, 0 ở Exam / Extra Practice
    expect(computeSessionCompletionXp({ completedRunsToday: 0, firstAttemptTotalCount: 5 })).toBe(SESSION_COMPLETE_FIRST_XP);
    expect(computeSessionCompletionXp({ completedRunsToday: 1, firstAttemptTotalCount: 5 })).toBe(SESSION_COMPLETE_REPEAT_XP);
    expect(computeSessionCompletionXp({ completedRunsToday: 0, firstAttemptTotalCount: 5, examMode: true })).toBe(0);
    expect(computeSessionCompletionXp({ completedRunsToday: 0, firstAttemptTotalCount: 5, isExtraPractice: true })).toBe(0);
  });

  it('16. selects Recap win statement following strict priority order (1. Mature/Mastered > 2. First-attempt accuracy vs last week > 3. Consecutive article fixes)', () => {
    // Priority 1 wins when matureOrMasteredCount > 0
    expect(
      buildV1WinStatement({
        matureOrMasteredCount: 4,
        firstAttemptAccuracy: 90,
        lastWeekAccuracy: 80,
        articleFixStreak: 3,
      }),
    ).toBe('4 từ vừa lên Mature hoặc Mastered');

    // Priority 2 wins when matureOrMasteredCount === 0 and lastWeekAccuracy is present
    expect(
      buildV1WinStatement({
        matureOrMasteredCount: 0,
        firstAttemptAccuracy: 88,
        lastWeekAccuracy: 75,
        articleFixStreak: 3,
      }),
    ).toBe('Tỷ lệ nhớ lượt đầu 88% (tuần trước 75%)');

    // Priority 3 wins when matureOrMasteredCount === 0, no lastWeekAccuracy, and articleFixStreak > 0
    expect(
      buildV1WinStatement({
        matureOrMasteredCount: 0,
        firstAttemptAccuracy: 85,
        lastWeekAccuracy: null,
        articleFixStreak: 3,
      }),
    ).toBe('Bạn sửa được 3 lỗi article liên tiếp');
  });

  it('17. supports standard mode (stages of 20 cards with checkpoints) and busy mode (10 cards)', () => {
    const allCards = buildV1FixtureCards(FIXED_NOW);

    // Busy mode -> capped at 10 cards, 1 stage
    const busyRun = createV1Run({
      cards: allCards,
      content: V1_FIXTURE_CONTENT,
      mode: 'busy',
      now: FIXED_NOW,
    });
    expect(busyRun.nodes.length).toBe(BUSY_RUN_CARDS);
    expect(busyRun.totalStages).toBe(1);

    // Standard mode with > 20 cards -> multiple stages of 20 with checkpoint between stage 0 and stage 1
    const standardRun = createV1Run({
      cards: allCards,
      content: V1_FIXTURE_CONTENT,
      mode: 'standard',
      now: FIXED_NOW,
    });
    expect(standardRun.stageSize).toBe(STAGE_SIZE);
    expect(standardRun.totalStages).toBeGreaterThanOrEqual(2);

    // Complete node 19 (end of Stage 1) and advance -> triggers checkpoint
    let atEndStage1 = { ...standardRun, currentIndex: STAGE_SIZE - 1 };
    const node19 = getActiveNode(atEndStage1)!;
    atEndStage1 = submitNodeAnswer(
      atEndStage1,
      getCorrectAnswerForPrompt(node19.prompt),
      3000,
      FIXED_NOW,
    );
    atEndStage1 = advanceAfterFeedback(atEndStage1, FIXED_NOW);
    expect(atEndStage1.phase).toBe('checkpoint');
    expect(atEndStage1.currentStage).toBe(1);

    // Can continue from checkpoint or finish & save at checkpoint
    const resumed = continueFromCheckpoint(atEndStage1);
    expect(resumed.phase).toBe('playing');

    const savedEarly = finishAtCheckpoint(atEndStage1, FIXED_NOW);
    expect(savedEarly.phase).toBe('recap');
    expect(savedEarly.recap).not.toBeNull();
  });

  it('18. automatically switches to Extra Practice mode (no FSRS recording) when no cards are due and new card quota is exhausted', () => {
    // Future due cards only
    const futureCard: SRSCard = {
      ...makeDueTestCard('vocab:curriculum', 'recall_meaning', 10, -72),
      due: FIXED_NOW.getTime() + 72 * 3_600_000,
    };

    let state = createV1Run({
      cards: [futureCard],
      content: V1_FIXTURE_CONTENT,
      newCardsLimit: 15,
      newCardsDoneToday: 15,
      now: FIXED_NOW,
    });

    expect(state.isExtraPractice).toBe(true);
    expect(state.mode).toBe('extra_practice');
    expect(state.nodes.length).toBe(1);

    const active = getActiveNode(state)!;
    state = submitNodeAnswer(
      state,
      getCorrectAnswerForPrompt(active.prompt),
      3000,
      FIXED_NOW,
    );
    // Extra practice must not write FSRS reviews
    expect(state.reviews.length).toBe(0);
    expect(Object.keys(state.updatedCards).length).toBe(0);
  });

  it('19. detects newly Mature/Mastered items when card stability crosses >= 21 days threshold', () => {
    // Card right below Mature threshold (stability = 18 days, elapsed 20 days)
    const almostMatureCard: SRSCard = {
      ...makeDueTestCard('vocab:scrutinise', 'recall_meaning', 18, 24),
      stability: 18,
      elapsed_days: 20,
      last_review: FIXED_NOW.getTime() - 20 * 86_400_000,
    };

    let state = createV1Run({
      cards: [almostMatureCard],
      content: V1_FIXTURE_CONTENT,
      skillLevel: 5,
      now: FIXED_NOW,
    });

    state = submitNodeAnswer(state, 'scrutinise', 2000, FIXED_NOW);
    expect(state.newlyMatureItemIds).toContain('vocab:scrutinise');
  });

  it('20. unlocks recall_meaning and recall_cloze faces when recog stability reaches >= 3 days', () => {
    const recogCard: SRSCard = {
      ...makeDueTestCard('vocab:proliferate', 'recog', 2.8, 24),
      stability: 2.8,
      elapsed_days: 4,
      last_review: FIXED_NOW.getTime() - 4 * 86_400_000,
    };

    let state = createV1Run({
      cards: [recogCard],
      content: V1_FIXTURE_CONTENT,
      now: FIXED_NOW,
    });

    const active = getActiveNode(state)!;
    state = submitNodeAnswer(
      state,
      getCorrectAnswerForPrompt(active.prompt),
      1800,
      FIXED_NOW,
    );

    expect(state.updatedCards['vocab:proliferate#recall_meaning']).toBeDefined();
    expect(state.updatedCards['vocab:proliferate#recall_cloze']).toBeDefined();
  });

  it('21. buildPlaceholderMask & computeCharDiff format multi-word masks and character diffs accurately', () => {
    expect(buildPlaceholderMask('curriculum', 0)).toBe('_ _ _ _ _ _ _ _ _ _');
    expect(buildPlaceholderMask('curriculum', 3)).toBe('c u r _ _ _ _ _ _ _');
    expect(buildPlaceholderMask('rote learning', 0)).toBe(
      '_ _ _ _ · _ _ _ _ _ _ _ _',
    );

    const diff = computeCharDiff('curiculum', 'curriculum');
    expect(diff.wrongIndices.length).toBeGreaterThan(0);
    expect(diff.firstWrongNotice).toBeDefined();
  });

  it('22. FX-2: computeRecent7DayRetention & createV1Run áp dụng van tải thẻ mới, vòng phục hồi và khối chủ đề', () => {
    // 1. Tính tỷ lệ nhớ 7 ngày gần nhất từ attempts
    const dayMs = 86_400_000;
    const retention = computeRecent7DayRetention(
      [
        { gameId: 'v1', startedAt: FIXED_NOW.getTime() - 2 * dayMs, score: 7, total: 10, status: 'final' },
        { gameId: 'v1', startedAt: FIXED_NOW.getTime() - 4 * dayMs, score: 8, total: 10, status: 'final' },
        // Quá 7 ngày -> bỏ qua
        { gameId: 'v1', startedAt: FIXED_NOW.getTime() - 10 * dayMs, score: 10, total: 10, status: 'final' },
        // Game khác -> bỏ qua
        { gameId: 'r1', startedAt: FIXED_NOW.getTime() - 1 * dayMs, score: 0, total: 10, status: 'final' },
      ],
      FIXED_NOW,
    );
    expect(retention).toBeCloseTo(0.75, 5);

    // 2. Tạo 12 thẻ mới thuộc nhiều chủ đề khác nhau -> createV1Run gom theo khối chủ đề (L-5)
    const vocabList = V1_FIXTURE_CONTENT.vocab.slice(0, 12);
    const newCards = vocabList.map((v, i) =>
      createNewCard(v.id, 'recog', { now: new Date(FIXED_NOW.getTime() + i * 1000), unlocked: true }),
    );
    const topicById = new Map<string, string>(vocabList.map((v) => [v.id, v.topics[0]]));

    // Retention 75% (< 80%) -> van giảm 15 -> 10 thẻ mới
    const throttledRun = createV1Run({
      cards: newCards,
      content: V1_FIXTURE_CONTENT,
      newCardsLimit: 15,
      retention7d: retention,
      now: FIXED_NOW,
    });
    expect(throttledRun.effectiveNewCardsLimit).toBe(10);
    expect(throttledRun.nodes.length).toBe(10);
    expect(throttledRun.newCardsThrottleReason).toBe('low_retention');
    expect(throttledRun.newCardsThrottleReasonVi).toContain('75%');

    // Kiểm tra các thẻ mới đi theo khối chủ đề liên tục (mỗi chủ đề chỉ xuất hiện trong 1 khối)
    const seenTopics = new Set<string>();
    let prevTopic: string | undefined;
    for (const node of throttledRun.nodes) {
      const t = topicById.get(node.itemId);
      if (t !== prevTopic) {
        expect(seenTopics.has(t ?? '')).toBe(false);
        if (t) seenTopics.add(t);
        prevTopic = t;
      }
    }

    // 3. Vòng phục hồi: vắng >= 3 ngày và > 50 thẻ đến hạn -> giới hạn <= 50 thẻ + nhãn thân thiện
    const past = FIXED_NOW.getTime() - 5 * dayMs;
    const baseVocab = V1_FIXTURE_CONTENT.vocab[0];
    const syntheticVocab = Array.from({ length: 65 }, (_, idx) => ({
      ...baseVocab,
      id: `vocab:rec_${idx}` as const,
      headword: `word${idx}`,
      meaningVi: `nghĩa ${idx}`,
    }));
    const recoveryContent = { ...V1_FIXTURE_CONTENT, vocab: syntheticVocab };
    const manyDueCards: SRSCard[] = syntheticVocab.map((v) => ({
      ...createNewCard(v.id, 'recog', { now: new Date(past), unlocked: true }),
      state: State.Review,
      reps: 2,
      stability: 3,
      last_review: past - dayMs,
      due: past,
    }));

    const recoveryRun = createV1Run({
      cards: manyDueCards,
      content: recoveryContent,
      absenceDays: 4,
      now: FIXED_NOW,
    });
    expect(recoveryRun.recoveryMode).toBe(true);
    expect(recoveryRun.recoveryReasonVi).toBe('Vòng phục hồi · tối đa 50 thẻ');
    expect(recoveryRun.nodes.length).toBe(50);
  });

  it('23. Ngã ba run (Run Fork, 01-GAME §6.3): chọn Đường gai lấy 5 thẻ retrievability thấp nhất & thưởng ×1.5 XP', () => {
    const allCards = buildV1FixtureCards(FIXED_NOW);
    const standardRun = createV1Run({
      cards: allCards,
      content: V1_FIXTURE_CONTENT,
      mode: 'standard',
      now: FIXED_NOW,
    });
    expect(standardRun.totalStages).toBeGreaterThanOrEqual(2);

    // Hoàn thành thẻ cuối Chặng 1 -> vào checkpoint
    let atCheckpoint = { ...standardRun, currentIndex: STAGE_SIZE - 1 };
    const node19 = getActiveNode(atCheckpoint)!;
    atCheckpoint = submitNodeAnswer(
      atCheckpoint,
      getCorrectAnswerForPrompt(node19.prompt),
      3000,
      FIXED_NOW,
    );
    atCheckpoint = advanceAfterFeedback(atCheckpoint, FIXED_NOW);
    expect(atCheckpoint.phase).toBe('checkpoint');

    // Xem trước tối đa 5 thẻ khó nhất
    const preview = previewThornyForkCards(atCheckpoint);
    expect(preview.length).toBeGreaterThan(0);
    expect(preview.length).toBeLessThanOrEqual(THORNY_PATH_CARD_COUNT);
    for (let i = 1; i < preview.length; i++) {
      expect(preview[i].retrievability).toBeGreaterThanOrEqual(preview[i - 1].retrievability);
    }

    // Nhánh an toàn giữ nguyên hàng đợi
    const safeRun = chooseCheckpointFork(atCheckpoint, 'safe');
    expect(safeRun.phase).toBe('playing');
    expect(safeRun.chosenForkPath).toBe('safe');
    expect(safeRun.nodes.length).toBe(atCheckpoint.nodes.length);

    // Nhánh Đường gai rút đúng 5 thẻ khó nhất, cập nhật totalStages và gắn cờ isThornyNode (+50% XP gốc)
    const thornyRun = chooseCheckpointFork(atCheckpoint, 'thorny');
    expect(thornyRun.phase).toBe('playing');
    expect(thornyRun.chosenForkPath).toBe('thorny');
    expect(thornyRun.totalStages).toBe(atCheckpoint.currentStage + 1);
    const thornyNodes = thornyRun.nodes.slice(thornyRun.currentIndex);
    expect(thornyNodes.length).toBe(preview.length);
    expect(thornyNodes.every((n) => n.isThornyNode === true)).toBe(true);
    expect(thornyRun.events.some((e) => e.type === 'fork_chosen' && e.path === 'thorny')).toBe(true);

    // Trả lời đúng 1 thẻ Đường gai -> thưởng ×1.5 XP
    const firstThorny = getActiveNode(thornyRun)!;
    const baseExpected = isProductionFace(firstThorny.face) ? 15 : 10;
    const afterThornyAns = submitNodeAnswer(
      { ...thornyRun, combo: 0 },
      getCorrectAnswerForPrompt(firstThorny.prompt),
      2500,
      FIXED_NOW,
    );
    expect(afterThornyAns.feedback?.xpEarned).toBe(Math.round(baseExpected * 1.5));
  });

  it('24. Luật Boss V1 (01-GAME §6.3 & SR-22): no_hints chặn gợi ý, must_type ép gõ, listen_only kiểm MP3 thật và hạ về no_hints khi thiếu MP3', () => {
    const vocabCards = [
      makeDueTestCard('vocab:curriculum', 'recog', 2, 48),
      makeDueTestCard('vocab:mitigate', 'recog', 2, 44),
      makeDueTestCard('vocab:disparity', 'recog', 3, 40),
      makeDueTestCard('vocab:allocate', 'recog', 3, 36),
      makeDueTestCard('vocab:scrutinise', 'recog', 4, 32),
    ];

    const enterBoss = (modifier: 'no_hints' | 'must_type' | 'listen_only', missingAudio: string[] = []) => {
      const content = {
        ...V1_FIXTURE_CONTENT,
        extras: { userItems: {}, reading: {}, listening: {}, missingAudio },
      };
      let s = createV1Run({
        cards: vocabCards,
        content,
        bossModifier: modifier,
        now: FIXED_NOW,
      });
      s = { ...s, currentIndex: s.nodes.length - 1 };
      const last = getActiveNode(s)!;
      s = submitNodeAnswer(s, getCorrectAnswerForPrompt(last.prompt), 2500, FIXED_NOW);
      return advanceAfterFeedback(s, FIXED_NOW);
    };

    // 1. no_hints: chặn applyNodeHint trong Boss
    const bossNoHints = enterBoss('no_hints');
    expect(bossNoHints.phase).toBe('boss');
    expect(bossNoHints.bossModifier).toBe('no_hints');
    const afterHintTry = applyNodeHint(bossNoHints);
    expect(getActiveNode(afterHintTry)?.hintsUsed).toBe(0);
    expect(getActiveNode(afterHintTry)?.eliminatedChoices).toHaveLength(0);

    // 2. must_type: chuyển toàn bộ thẻ recog trong Boss sang recall_meaning (phải gõ)
    const bossMustType = enterBoss('must_type');
    expect(bossMustType.bossModifier).toBe('must_type');
    expect(bossMustType.bossNodes.every((n) => n.face === 'recall_meaning')).toBe(true);

    // 3. listen_only có MP3 đủ -> tất cả thẻ Boss là listen_spell
    const bossListenOk = enterBoss('listen_only', []);
    expect(bossListenOk.bossModifier).toBe('listen_only');
    expect(bossListenOk.bossNodes.every((n) => n.face === 'listen_spell')).toBe(true);

    // 4. listen_only nhưng thiếu MP3 thật ở 1 từ -> tự hạ về no_hints (SR-22)
    expect(
      selectBossModifier(
        vocabCards,
        {
          ...V1_FIXTURE_CONTENT,
          extras: { userItems: {}, reading: {}, listening: {}, missingAudio: ['vocab:curriculum'] },
        },
        'seed',
        'listen_only',
      ),
    ).toBe('no_hints');
    const bossListenFallback = enterBoss('listen_only', ['vocab:curriculum']);
    expect(bossListenFallback.bossModifier).toBe('no_hints');
    expect(bossListenFallback.bossNodes.some((n) => n.face === 'listen_spell')).toBe(false);
  });

  it('25. hydrateRunContent làm giàu định nghĩa/ví dụ mà không làm mất tiến độ đang chạy', () => {
    const card = makeDueTestCard('vocab:curriculum', 'recall_meaning', 4, 24);
    const bareVocab = V1_FIXTURE_CONTENT.vocab.map((v) => ({
      ...v,
      definitionEn: '',
    }));
    const run = createV1Run({
      cards: [card],
      content: { ...V1_FIXTURE_CONTENT, vocab: bareVocab },
      now: FIXED_NOW,
    });
    const before = getActiveNode(run)!;
    expect(before.prompt.face === 'recall_meaning' && before.prompt.definitionEn).toBe('');

    const hydrated = hydrateRunContent(run, V1_FIXTURE_CONTENT);
    const after = getActiveNode(hydrated)!;
    expect(after.prompt.face === 'recall_meaning' && after.prompt.definitionEn.length).toBeGreaterThan(5);
    expect(hydrated.currentIndex).toBe(run.currentIndex);
  });

  it('26. intro không chèn collocation giả dạng "headword (pos)" khi từ chưa có collocation/synonym thật', () => {
    const bareWord = {
      ...V1_FIXTURE_VOCAB[0],
      id: 'vocab:bare_word' as const,
      headword: 'alleviate',
      collocationIds: [],
      synonyms: [],
    };
    const bareCard = createNewCard('vocab:bare_word', 'recog', {
      now: FIXED_NOW,
      unlocked: true,
    });
    const run = createV1Run({
      cards: [bareCard],
      content: { ...V1_FIXTURE_CONTENT, vocab: [...V1_FIXTURE_VOCAB, bareWord] },
      now: FIXED_NOW,
    });
    const introNode = run.nodes.find((n) => n.itemId === 'vocab:bare_word');
    expect(introNode?.prompt.face).toBe('intro');
    if (introNode && introNode.prompt.face === 'intro') {
      expect(introNode.prompt.collocations).toEqual([]);
    }
  });
});

function getCorrectAnswerForPrompt(prompt: V1PromptPayload): string {
  switch (prompt.face) {
    case 'intro':
      return prompt.headword;
    case 'recog':
      return prompt.correctAnswer;
    case 'recall_meaning':
      return prompt.headword;
    case 'recall_cloze':
      return prompt.primaryAnswer;
    case 'listen_spell':
      return prompt.targetWord;
    case 'col_gap':
      return prompt.primaryAnswer;
    case 'para_match':
      return prompt.correctAnswer;
    case 'err_fix':
      return prompt.expectedCorrection;
    default:
      throw new Error(`Mặt ${prompt.face} không dùng trong helper này`);
  }
}
