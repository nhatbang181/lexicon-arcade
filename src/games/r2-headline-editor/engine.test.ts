import { describe, expect, it } from 'vitest';
import { R1_FIXTURE_P3 } from '../../test/fixtures/r1_fixtures';
import { State } from '../../core/srs/fsrsAdapter';
import {
  advanceAfterParagraphGrade,
  assignHeadingChoice,
  buildR2WinStatement,
  canSubmitCurrentParagraph,
  canSubmitPassage,
  clearHeadingChoice,
  createHeadlineSession,
  createHeadRetrySrsCard,
  evaluateMainIdeaHighlight,
  getCurrentTask,
  getR2DifficultyConfig,
  getUsedHeadingsMap,
  isHeadRetryRetired,
  keyToHeadingIndex,
  resolveDistractorFeedback,
  scoreParagraphHeadline,
  selectMainIdeaSpan,
  selectParagraphIndex,
  submitCurrentParagraph,
  submitEntirePassage,
} from './engine';

describe('R2 Headline Editor — Pure Engine', () => {
  it('1. getR2DifficultyConfig returns exact time targets, mainIdea steps, and grading modes across levels 1-10 and exam', () => {
    expect(getR2DifficultyConfig(1)).toMatchObject({
      targetSecPerParagraph: 75,
      mainIdeaStep: 'required',
      gradingMode: 'per_paragraph',
      extraHeadings: 2,
    });
    expect(getR2DifficultyConfig(4)).toMatchObject({
      targetSecPerParagraph: 60,
      mainIdeaStep: 'required',
      gradingMode: 'per_paragraph',
    });
    expect(getR2DifficultyConfig(6)).toMatchObject({
      targetSecPerParagraph: 45,
      mainIdeaStep: 'optional',
      gradingMode: 'per_paragraph',
      extraHeadings: 3,
    });
    expect(getR2DifficultyConfig(7)).toMatchObject({
      targetSecPerParagraph: 35,
      mainIdeaStep: 'optional',
      gradingMode: 'end_of_passage',
    });
    expect(getR2DifficultyConfig(10)).toMatchObject({
      targetSecPerParagraph: 30,
      mainIdeaStep: 'off',
      gradingMode: 'end_of_passage',
    });
    expect(getR2DifficultyConfig(3, 'exam')).toMatchObject({
      gradingMode: 'end_of_passage',
      mainIdeaStep: 'off',
    });
  });

  it('2. Branch 1: correct heading + overlapping mainIdeaSpan (IoU >= 0.3) awards 15 XP (+5 XP speed bonus)', () => {
    const session = createHeadlineSession(R1_FIXTURE_P3, { level: 3 });
    const taskA = session.tasks[0];
    expect(taskA.paragraphLabel).toBe('A');
    expect(taskA.mainIdeaSpan).not.toBeNull();

    const res = scoreParagraphHeadline({
      task: taskA,
      allTasks: session.tasks,
      chosenHeadingKey: 'iii',
      userMainIdeaSpan: taskA.mainIdeaSpan,
      durationSec: 40, // <= 60s target
      targetSecPerParagraph: 60,
    });

    expect(res.branch).toBe('both_correct');
    expect(res.headingCorrect).toBe(true);
    expect(res.mainIdeaCorrect).toBe(true);
    expect(res.baseXp).toBe(15);
    expect(res.speedBonusXp).toBe(5);
    expect(res.totalXp).toBe(20);
  });

  it('3. Branch 2: correct heading + wrong mainIdeaSpan awards 10 XP (no speed bonus when over time target)', () => {
    const session = createHeadlineSession(R1_FIXTURE_P3, { level: 3 });
    const taskA = session.tasks[0];
    const wrongSpan = {
      paragraph: 'A',
      start: 0,
      end: 30,
      quote: taskA.paragraphText.slice(0, 30),
    };

    const res = scoreParagraphHeadline({
      task: taskA,
      allTasks: session.tasks,
      chosenHeadingKey: 'iii',
      userMainIdeaSpan: wrongSpan,
      durationSec: 75, // > 60s target
      targetSecPerParagraph: 60,
    });

    expect(res.branch).toBe('heading_only');
    expect(res.headingCorrect).toBe(true);
    expect(res.mainIdeaCorrect).toBe(false);
    expect(res.baseXp).toBe(10);
    expect(res.speedBonusXp).toBe(0);
    expect(res.totalXp).toBe(10);
  });

  it('4. Branch 3: wrong heading + correct mainIdeaSpan awards 3 XP with distractorType feedback', () => {
    const session = createHeadlineSession(R1_FIXTURE_P3, { level: 3 });
    const taskA = session.tasks[0];

    const res = scoreParagraphHeadline({
      task: taskA,
      allTasks: session.tasks,
      chosenHeadingKey: 'ii', // listed as too_broad in P3 fixture
      userMainIdeaSpan: taskA.mainIdeaSpan,
      durationSec: 25,
      targetSecPerParagraph: 60,
    });

    expect(res.branch).toBe('main_idea_only');
    expect(res.headingCorrect).toBe(false);
    expect(res.mainIdeaCorrect).toBe(true);
    expect(res.baseXp).toBe(3);
    expect(res.speedBonusXp).toBe(0);
    expect(res.totalXp).toBe(3);
    expect(res.distractorType).toBe('too_broad');
    expect(res.feedbackVi).toContain('Bạn hiểu đúng ý chính, nhưng tít bạn chọn là too_broad');
  });

  it('5. Branch 4: wrong heading + wrong mainIdeaSpan awards 0 XP', () => {
    const session = createHeadlineSession(R1_FIXTURE_P3, { level: 3 });
    const taskB = session.tasks[1];
    const wrongSpan = {
      paragraph: 'B',
      start: taskB.paragraphText.length - 40,
      end: taskB.paragraphText.length - 5,
      quote: taskB.paragraphText.slice(-40, -5),
    };

    const res = scoreParagraphHeadline({
      task: taskB,
      allTasks: session.tasks,
      chosenHeadingKey: 'vii', // keyword_match in fixture
      userMainIdeaSpan: wrongSpan,
      durationSec: 20,
      targetSecPerParagraph: 60,
    });

    expect(res.branch).toBe('both_wrong');
    expect(res.baseXp).toBe(0);
    expect(res.totalXp).toBe(0);
    expect(res.distractorType).toBe('keyword_match');
  });

  it('6. evaluateMainIdeaHighlight passes when user highlights a short phrase inside the SAME sentence even if IoU < 0.3', () => {
    const session = createHeadlineSession(R1_FIXTURE_P3, { level: 3 });
    const taskA = session.tasks[0];
    const gold = taskA.mainIdeaSpan!;
    // Pick a tiny 12-char phrase inside the same sentence as gold
    const shortSpan = {
      paragraph: 'A',
      start: gold.start + 5,
      end: gold.start + 17,
      quote: taskA.paragraphText.slice(gold.start + 5, gold.start + 17),
    };

    const ev = evaluateMainIdeaHighlight(shortSpan, gold, taskA.paragraphText);
    expect(ev.iou).toBeLessThan(0.3);
    expect(ev.sameSentence).toBe(true);
    expect(ev.passed).toBe(true);
  });

  it('7. resolveDistractorFeedback infers adjacent_paragraph when chosen heading belongs to another paragraph and is not explicitly listed', () => {
    const session = createHeadlineSession(R1_FIXTURE_P3, { level: 3 });
    const taskA = session.tasks[0];
    // Heading 'vi' is correct for Paragraph D, not listed in taskA.distractors (only i & ii are)
    const fb = resolveDistractorFeedback(taskA, 'vi', session.tasks);
    expect(fb.distractorType).toBe('adjacent_paragraph');
    expect(fb.whyVi).toContain('đoạn D');
  });

  it('8. Per-paragraph mode (level <= 6) requires mainIdeaSpan at level 1-4 before submitting', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, { level: 3 });
    expect(canSubmitCurrentParagraph(state)).toBe(false);

    // Assign heading without highlighting main idea -> still blocked at level 3
    state = assignHeadingChoice(state, 'iii').state;
    expect(canSubmitCurrentParagraph(state)).toBe(false);

    // Highlight main idea -> now ready to submit
    const spanA = state.tasks[0].mainIdeaSpan!;
    state = selectMainIdeaSpan(state, spanA).state;
    expect(canSubmitCurrentParagraph(state)).toBe(true);
  });

  it('9. Per-paragraph mode locks true heading after grading and prevents reuse on subsequent paragraphs', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, { level: 5 }); // optional main idea
    state = assignHeadingChoice(state, 'iii').state; // correct for A
    const graded = submitCurrentParagraph(state, 30);
    state = graded.state;

    expect(state.lockedHeadings['iii']).toBe('A');
    expect(state.lockedParagraphs['A']).toBe(true);

    state = advanceAfterParagraphGrade(state).state;
    expect(getCurrentTask(state)?.paragraphLabel).toBe('B');

    // Trying to reuse 'iii' on Paragraph B must be rejected
    const attemptReuse = assignHeadingChoice(state, 'iii');
    expect(attemptReuse.events[0]).toMatchObject({
      type: 'heading_locked_rejected',
      headingKey: 'iii',
      usedBy: 'A',
    });
    expect(attemptReuse.state.assignedHeadings['B']).toBeUndefined();
  });

  it('10. End-of-passage mode (level >= 7) allows swapping heading and automatically releases the old heading', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, { level: 8 });
    expect(state.config.gradingMode).toBe('end_of_passage');

    // Assign 'i' to Paragraph A
    state = assignHeadingChoice(state, 'i').state;
    expect(getUsedHeadingsMap(state)['i']).toBe('A');

    // Swap Paragraph A from 'i' to 'iii' -> 'i' must be released
    const swapped = assignHeadingChoice(state, 'iii');
    state = swapped.state;
    expect(swapped.events[0]).toMatchObject({
      type: 'heading_assigned',
      paragraphLabel: 'A',
      headingKey: 'iii',
      releasedKey: 'i',
    });
    expect(getUsedHeadingsMap(state)['i']).toBeUndefined();
    expect(getUsedHeadingsMap(state)['iii']).toBe('A');

    // Now Paragraph B can use 'i' freely!
    state = selectParagraphIndex(state, 1);
    state = assignHeadingChoice(state, 'i').state;
    expect(state.assignedHeadings['B']).toBe('i');
  });

  it('11. End-of-passage mode grades all paragraphs at once and creates SRS cards only for wrong ones', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, { level: 8, nowMs: 1_700_000_000_000 });
    expect(canSubmitPassage(state)).toBe(false);

    // Assign 4 correct + 1 wrong (Paragraph E gets 'v' instead of 'ii')
    const choices: Array<[number, string]> = [
      [0, 'iii'],
      [1, 'i'],
      [2, 'iv'],
      [3, 'vi'],
      [4, 'v'], // wrong for E (correct is ii)
    ];
    for (const [idx, key] of choices) {
      state = selectParagraphIndex(state, idx);
      state = assignHeadingChoice(state, key).state;
    }
    expect(canSubmitPassage(state)).toBe(true);

    const { state: done, events } = submitEntirePassage(state, 150, 1_700_000_150_000);
    expect(done.completed).toBe(true);
    const gradedEvent = events.find((e) => e.type === 'passage_graded');
    expect(gradedEvent).toBeDefined();
    if (gradedEvent && gradedEvent.type === 'passage_graded') {
      expect(gradedEvent.results).toHaveLength(5);
      expect(gradedEvent.results.filter((r) => r.headingCorrect)).toHaveLength(4);
      expect(gradedEvent.srsCards).toHaveLength(1);
      expect(gradedEvent.srsCards[0].itemId).toBe('head:p3-q5');
      expect(gradedEvent.srsCards[0].face).toBe('head_retry');
    }
  });

  it('12. SRS card creation is skipped for reserved passages, and head_retry retires after 3 correct reps', () => {
    const reservedCard = createHeadRetrySrsCard('p3-q1', true);
    expect(reservedCard).toBeNull();

    const normalCard = createHeadRetrySrsCard('p3-q1', false);
    expect(normalCard).not.toBeNull();
    expect(normalCard!.itemId).toBe('head:p3-q1');
    expect(normalCard!.face).toBe('head_retry');
    expect(isHeadRetryRetired(normalCard!)).toBe(false);

    expect(
      isHeadRetryRetired({
        face: 'head_retry',
        reps: 3,
        lastReviewCorrect: true,
      }),
    ).toBe(true);
    expect(
      isHeadRetryRetired({
        face: 'head_retry',
        reps: 3,
        lastReviewCorrect: false,
      }),
    ).toBe(false);
    expect(normalCard!.state).toBe(State.New);
  });

  it('13. Example paragraph pre-fills and locks its heading out of the bank', () => {
    const state = createHeadlineSession(R1_FIXTURE_P3, {
      level: 3,
      exampleAssignments: { A: 'iii' },
    });
    expect(state.tasks[0].isExample).toBe(true);
    expect(state.lockedParagraphs['A']).toBe(true);
    expect(state.lockedHeadings['iii']).toBe('A');
    // Current focus skips Example A and starts at Paragraph B (index 1)
    expect(state.currentIndex).toBe(1);
    expect(getCurrentTask(state)?.paragraphLabel).toBe('B');
  });

  it('14. clearHeadingChoice releases a tentative heading and keyToHeadingIndex maps 1-9 to 0-8 and 0 to 9', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, { level: 7 });
    state = assignHeadingChoice(state, 'iv').state;
    expect(state.assignedHeadings['A']).toBe('iv');

    state = clearHeadingChoice(state, 'A');
    expect(state.assignedHeadings['A']).toBeUndefined();

    expect(keyToHeadingIndex('1')).toBe(0);
    expect(keyToHeadingIndex('9')).toBe(8);
    expect(keyToHeadingIndex('0')).toBe(9);
    expect(keyToHeadingIndex('a')).toBe(-1);
  });

  it('15. buildR2WinStatement produces specific encouraging Vietnamese summary on full session completion', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, { level: 5 });
    const answers = ['iii', 'i', 'iv', 'vi', 'ii'];
    for (let i = 0; i < answers.length; i++) {
      state = assignHeadingChoice(state, answers[i]).state;
      state = submitCurrentParagraph(state, 35).state;
      state = advanceAfterParagraphGrade(state).state;
    }
    expect(state.completed).toBe(true);
    const statement = buildR2WinStatement(state);
    expect(statement).toContain('5/5 tít đúng');
    expect(statement).toContain('35 giây/đoạn');
  });
});
