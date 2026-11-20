import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import {
  CollocationItemSchema,
  VocabItemSchema,
} from '../../core/content/schemas';
import { createNewCard, makeCardId } from '../../core/srs/fsrsAdapter';
import {
  V2_FIXTURE_COLLOCATIONS,
  V2_FIXTURE_VOCAB,
} from '../../test/fixtures/v2v3_fixtures';
import {
  V2_XP,
  advanceFromNung,
  buildHeadwordForges,
  createV2Session,
  finishSprintSession,
  formatCollocationHint,
  formatV2WinStatement,
  makeL1ErrorItemId,
  nextDapQuestion,
  nextToiRound,
  scoreCollocationGap,
  selectDefaultHeadwordForge,
  selectToiCard,
  submitDapAnswer,
  submitNungSelection,
  submitSelfWrite,
  submitSprintAnswer,
  submitToiFix,
  toggleNungChoice,
  useDapHint,
} from './engine';

describe('V2 · Collocation Forge Engine', () => {
  it('1. validates all V2 fixture vocab and collocations against Zod schemas and [INV-C1..C3]', () => {
    expect(V2_FIXTURE_VOCAB.length).toBeGreaterThanOrEqual(3);
    for (const v of V2_FIXTURE_VOCAB) {
      expect(VocabItemSchema.safeParse(v).success).toBe(true);
    }

    expect(V2_FIXTURE_COLLOCATIONS.length).toBeGreaterThanOrEqual(18);
    for (const col of V2_FIXTURE_COLLOCATIONS) {
      const parsed = CollocationItemSchema.safeParse(col);
      expect(parsed.success).toBe(true);

      // [INV-C1] example contains phrase verbatim
      expect(col.example.toLowerCase()).toContain(col.phrase.toLowerCase());

      // [INV-C2] every gap.answers contains primary & display.replace('___', primary) === phrase
      for (const g of col.gaps) {
        expect(g.answers).toContain(g.primary);
        expect(g.display.replace('___', g.primary)).toBe(col.phrase);
      }

      // [INV-C3] l1Traps.wrong !== phrase and not in answers
      for (const trap of col.l1Traps) {
        expect(trap.wrong.toLowerCase()).not.toBe(col.phrase.toLowerCase());
        for (const g of col.gaps) {
          expect(g.answers.map((a) => a.toLowerCase())).not.toContain(
            trap.wrong.toLowerCase(),
          );
        }
      }
    }
  });

  it('2. builds headword forges with >= 6 collocations & >= 2 l1Traps and filters out incomplete headwords', () => {
    const incompleteCol = {
      ...V2_FIXTURE_COLLOCATIONS[0],
      id: 'col:tiny_headword_1' as const,
      headwordId: 'vocab:tiny' as const,
    };
    const forges = buildHeadwordForges(
      [...V2_FIXTURE_COLLOCATIONS, incompleteCol],
      V2_FIXTURE_VOCAB,
    );

    const headwords = forges.map((f) => f.headword);
    expect(headwords).toContain('impact');
    expect(headwords).toContain('issue');
    expect(headwords).toContain('knowledge');
    expect(headwords).not.toContain('tiny');

    for (const forge of forges) {
      expect(forge.collocations.length).toBeGreaterThanOrEqual(6);
      expect(forge.totalL1Traps).toBeGreaterThanOrEqual(2);
    }
  });

  it('3. selects default headword forge by preferredHeadwordId, Task 2 topic, or unlearned count', () => {
    const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);

    const byId = selectDefaultHeadwordForge(forges, {
      preferredHeadwordId: 'vocab:knowledge',
    });
    expect(byId.headword).toBe('knowledge');

    const byTopic = selectDefaultHeadwordForge(forges, {
      recentTask2Topic: 'science',
    });
    expect(byTopic.topics).toContain('science');
  });

  it('4. Stage 1 (NUNG): selects 2 authentic sentences out of 3 and transitions to Stage 2 (DAP)', () => {
    const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);
    const impactForge = forges.find((f) => f.headword === 'impact')!;
    let state = createV2Session({ forge: impactForge, level: 2 });

    expect(state.stage).toBe('nung');
    expect(state.nungChoices).toHaveLength(3);

    const correctIndices = state.nungChoices
      .filter((c) => c.isCorrect)
      .map((c) => c.index);
    expect(correctIndices).toHaveLength(2);

    state = toggleNungChoice(state, correctIndices[0]);
    state = toggleNungChoice(state, correctIndices[1]);
    expect(state.nungSelected).toEqual(correctIndices);

    const { state: scoredState, events } = submitNungSelection(state);
    expect(scoredState.nungSubmitted).toBe(true);
    expect(scoredState.nungCorrect).toBe(true);
    expect(events[0]).toEqual({ type: 'nung_scored', correct: true });

    const { state: dapState } = advanceFromNung(scoredState);
    expect(dapState.stage).toBe('dap');
  });

  it('5. Stage 2 (DAP): scores primary answer (+12 XP) and alternative valid answer with primary suggestion', () => {
    const col = V2_FIXTURE_COLLOCATIONS.find((c) => c.id === 'col:profound_impact_on')!;
    const gap = col.gaps[0]; // "___ a profound impact on", answers: ['have', 'exert', 'exercise'], primary: 'have'

    const primaryRes = scoreCollocationGap('have', col, gap);
    expect(primaryRes.correct).toBe(true);
    expect(primaryRes.outcome).toBe('primary');
    expect(primaryRes.messageVi).toBe('Chính xác!');

    const altRes = scoreCollocationGap('exert', col, gap);
    expect(altRes.correct).toBe(true);
    expect(altRes.outcome).toBe('alt_accepted');
    expect(altRes.messageVi).toBe('Đúng. Cũng có thể dùng: have');
  });

  it('6. Stage 2 (DAP): ignores redundant leading article a/an/the when display already has an article', () => {
    const col = V2_FIXTURE_COLLOCATIONS.find((c) => c.id === 'col:detrimental_impact_on')!;
    const gap = col.gaps[0]; // "a ___ impact on", primary: 'detrimental'

    const withArticle = scoreCollocationGap('a detrimental', col, gap);
    expect(withArticle.correct).toBe(true);
    expect(withArticle.outcome).toBe('primary');

    const altWithArticle = scoreCollocationGap('an adverse', col, gap);
    expect(altWithArticle.correct).toBe(true);
    expect(altWithArticle.outcome).toBe('alt_accepted');
    expect(altWithArticle.messageVi).toBe('Đúng. Cũng có thể dùng: detrimental');
  });

  it('7. Stage 2 (DAP): detects Vietnamese L1 traps (both gap word and full phrase) and creates err:l1col_*#err_fix card', () => {
    const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);
    const impactForge = forges.find((f) => f.headword === 'impact')!;
    let state = createV2Session({ forge: impactForge, level: 2 });
    state = advanceFromNung(state).state;

    const currentQ = state.dapQuestions[0];
    const trapWord = 'make'; // from "make a profound impact on"
    const { state: afterTrap, events } = submitDapAnswer(state, trapWord, 4000, 1_700_000_000_000);

    expect(afterTrap.dapLastResult?.correct).toBe(false);
    expect(afterTrap.dapLastResult?.outcome).toBe('l1_trap');
    expect(afterTrap.dapLastResult?.messageVi).toBe('Đây là collocation kiểu Việt');
    expect(afterTrap.dapLastResult?.whyVi).toBeTruthy();

    const expectedErrCardId = makeCardId(
      makeL1ErrorItemId(currentQ.collocation.id),
      'err_fix',
    );
    expect(afterTrap.srsCards[expectedErrCardId]).toBeDefined();
    expect(afterTrap.srsCards[expectedErrCardId].face).toBe('err_fix');
    expect(events[0]).toMatchObject({
      type: 'answer_scored',
      stage: 'dap',
      correct: false,
      outcome: 'l1_trap',
      errorCardId: expectedErrCardId,
    });
  });

  it('8. Stage 2 (DAP): Hint H reveals letter count at Level 1-3, only first letter at Level 4-10, and rates Hard via autoRate', () => {
    expect(formatCollocationHint('mitigate', 2)).toContain('(8 chữ cái)');
    expect(formatCollocationHint('mitigate', 2)).toMatch(/^m /);
    expect(formatCollocationHint('mitigate', 5)).toBe('m…');

    const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);
    const impactForge = forges.find((f) => f.headword === 'impact')!;
    let state = createV2Session({ forge: impactForge, level: 2 });
    state = advanceFromNung(state).state;

    state = useDapHint(state);
    expect(state.dapQuestions[0].hintUsed).toBe(true);

    const primary = state.dapQuestions[0].gap.primary;
    const { state: afterHintSubmit, events } = submitDapAnswer(state, primary, 3000);
    expect(afterHintSubmit.xp).toBe(V2_XP.DAP_CORRECT);
    expect(afterHintSubmit.forgedShelf).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'answer_scored',
      correct: true,
      rating: Rating.Hard,
    });
  });

  it('9. Stage 3 (TOI): awards +10 XP for spotting L1 trap, +8 XP for typing fix, and +40 XP bonus when forge completes', () => {
    const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);
    const issueForge = forges.find((f) => f.headword === 'issue')!;
    let state = createV2Session({ forge: issueForge, level: 3 });
    state = advanceFromNung(state).state;

    // Complete all Dap questions correctly
    while (state.stage === 'dap') {
      const q = state.dapQuestions[state.dapIndex];
      state = submitDapAnswer(state, q.gap.primary, 3500).state;
      state = nextDapQuestion(state).state;
    }

    expect(state.stage).toBe('toi');
    const xpBeforeToi = state.xp;
    expect(xpBeforeToi).toBe(state.dapQuestions.length * V2_XP.DAP_CORRECT);

    // Complete all Toi rounds correctly
    const totalToiRounds = state.toiRounds.length;
    while (state.stage === 'toi') {
      const round = state.toiRounds[state.toiIndex];
      const trapCard = round.cards.find((c) => c.isTrap)!;

      const spotRes = selectToiCard(state, trapCard.index);
      state = spotRes.state;
      expect(state.toiRounds[state.toiIndex].spotCorrect).toBe(true);
      expect(state.toiRounds[state.toiIndex].step).toBe('type_fix');

      const fixRes = submitToiFix(state, trapCard.correctPhrase);
      state = fixRes.state;
      expect(state.toiRounds[state.toiIndex].fixCorrect).toBe(true);
      expect(state.toiRounds[state.toiIndex].step).toBe('feedback');

      state = nextToiRound(state).state;
    }

    expect(state.stage).toBe('recap');
    expect(state.trapsAvoided).toBe(totalToiRounds);
    const expectedTotalXp =
      xpBeforeToi +
      totalToiRounds * (V2_XP.TOI_SPOT_CORRECT + V2_XP.TOI_FIX_CORRECT) +
      V2_XP.FORGE_COMPLETE_BONUS;
    expect(state.xp).toBe(expectedTotalXp);
    expect(formatV2WinStatement(state)).toContain(
      `Bạn tránh được ${totalToiRounds}/${totalToiRounds} bẫy kiểu Việt.`,
    );
  });

  it('10. Stage 3 (TOI): picking a valid collocation or failing the fix creates an err:l1col_*#err_fix card', () => {
    const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);
    const knowledgeForge = forges.find((f) => f.headword === 'knowledge')!;
    let state = createV2Session({ forge: knowledgeForge, level: 2 });
    state = { ...state, stage: 'toi' };

    const round = state.toiRounds[0];
    const validCard = round.cards.find((c) => !c.isTrap)!;
    const trapCard = round.cards.find((c) => c.isTrap)!;

    const { state: afterWrongSpot } = selectToiCard(state, validCard.index);
    expect(afterWrongSpot.toiRounds[0].spotCorrect).toBe(false);

    const errCardId = makeCardId(makeL1ErrorItemId(trapCard.collocationId), 'err_fix');
    expect(afterWrongSpot.srsCards[errCardId]).toBeDefined();
  });

  it('11. Level 7-10: selects harder preposition/adjective gaps and unlocks Self-Write stage before Recap', () => {
    const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);
    const impactForge = forges.find((f) => f.headword === 'impact')!;
    let state = createV2Session({ forge: impactForge, level: 8 });

    // Check that multi-gap collocation uses harder second gap at level 8
    const detQ = state.dapQuestions.find(
      (q) => q.collocation.id === 'col:detrimental_impact_on',
    );
    expect(detQ?.gap.primary).toBe('on');

    // Fast-forward through Toi completion to trigger 'write' stage
    state = {
      ...state,
      stage: 'toi',
      toiIndex: state.toiRounds.length - 1,
      toiRounds: state.toiRounds.map((r, i) =>
        i === state.toiRounds.length - 1 ? { ...r, step: 'feedback' as const } : r,
      ),
    };

    const { state: writeState } = nextToiRound(state);
    expect(writeState.stage).toBe('write');
    expect(writeState.selfWrite).not.toBeNull();

    const [c1, c2] = writeState.selfWrite!.targetCollocations;
    const userSentence = `Governments should ${c1.phrase} climate change because pollution has ${c2.phrase} public health.`;
    const { state: recapState } = submitSelfWrite(writeState, userSentence, {
      correctPhrase: true,
      correctPreposition: true,
      correctMeaning: true,
    });

    expect(recapState.stage).toBe('recap');
    expect(recapState.selfWrite?.submitted).toBe(true);
    expect(recapState.selfWrite?.matchedPhrases.length).toBeGreaterThanOrEqual(1);
  });

  it('12. Sprint Mode (60s): awards +10 * combo XP, tracks personal best, and only updates existing col_gap cards', () => {
    const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);
    const impactForge = forges.find((f) => f.headword === 'impact')!;
    const firstColId = impactForge.collocations[0].id;
    const existingCard = createNewCard(firstColId, 'col_gap');

    let state = createV2Session({
      mode: 'sprint',
      forge: impactForge,
      allCollocations: V2_FIXTURE_COLLOCATIONS,
      existingCards: [existingCard],
      sprintPersonalBestXp: 25,
    });

    expect(state.stage).toBe('sprint');

    // 1st correct -> combo 1 -> +10 XP (existing card gets updated)
    const q0 = state.sprintQuestions[0];
    state = submitSprintAnswer(state, q0.gap.primary, 2000).state;
    expect(state.combo).toBe(1);
    expect(state.xp).toBe(10);
    expect(state.srsCards[makeCardId(firstColId, 'col_gap')].reps).toBe(1);

    // 2nd correct -> combo 2 -> +20 XP (total 30 XP > personal best 25 XP)
    const q1 = state.sprintQuestions[1];
    state = submitSprintAnswer(state, q1.gap.primary, 2000).state;
    expect(state.combo).toBe(2);
    expect(state.xp).toBe(30);
    expect(state.sprintPersonalBestXp).toBe(30);
    // 2nd card was NOT in existingCards, so Sprint mode must not unlock a new col_gap card
    expect(state.srsCards[makeCardId(q1.collocation.id, 'col_gap')]).toBeUndefined();

    // Finish sprint
    state = finishSprintSession(state).state;
    expect(state.stage).toBe('recap');
  });
});
