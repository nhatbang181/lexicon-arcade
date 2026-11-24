import { describe, expect, it } from 'vitest';
import { R1_FIXTURE_P3 } from '../../test/fixtures/r1_fixtures';
import {
  assignHeadingChoice,
  buildR2ProgressSnapshot,
  createHeadlineRetrySession,
  createHeadlineSession,
  selectMainIdeaSpan,
  selectR2Passage,
  submitCurrentParagraph,
  submitEntirePassage,
  type R2CatalogCandidate,
} from './engine';

const SAMPLE_R2_CATALOG: R2CatalogCandidate[] = [
  { id: 'p2_001', level: 'P2' },
  { id: 'p2_002', level: 'P2' },
  { id: 'p3_001', level: 'P3' },
];

describe('R2 · Headline Editor T2-A (R2-1, R2-3, G1 producer head:*, retry 0 XP, progress)', () => {
  it('R2-1: 2 phiên liên tiếp chọn khác passage khi truyền recentIds', () => {
    const p1 = selectR2Passage(SAMPLE_R2_CATALOG, { seed: 'r2-1', recentIds: [] })!;
    const p2 = selectR2Passage(SAMPLE_R2_CATALOG, { seed: 'r2-2', recentIds: [p1.id] })!;
    expect(p1.id).not.toBe(p2.id);
  });

  it('G1/G3: sai heading tạo producedItems head:<qid> và buildR2ProgressSnapshot hợp lệ', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, {
      level: 3,
      mode: 'training',
      gradingModeOverride: 'per_paragraph',
      nowMs: 1000,
    });
    expect(buildR2ProgressSnapshot(state)).toBeNull();

    const task = state.tasks[state.currentIndex];
    const wrongHeading = state.headings.find((h) => h.key !== task.correctHeadingKey)!;
    state = selectMainIdeaSpan(state, {
      paragraph: task.paragraphLabel,
      start: 0,
      end: Math.min(40, task.paragraphText.length),
      quote: task.paragraphText.slice(0, Math.min(40, task.paragraphText.length)),
    }).state;
    state = assignHeadingChoice(state, wrongHeading.key).state;
    const { state: graded, events } = submitCurrentParagraph(state, 20, 21000);

    const headId = `head:${task.qid}`;
    expect(graded.producedItems[headId]).toBeDefined();
    expect(graded.producedItems[headId].kind).toBe('head');
    expect(graded.producedItems[headId].back).toContain(task.correctHeadingKey);

    const gradedEvt = events.find((e) => e.type === 'paragraph_graded');
    const cards = gradedEvt && gradedEvt.type === 'paragraph_graded' && gradedEvt.srsCard ? [gradedEvt.srsCard] : [];
    const snap = buildR2ProgressSnapshot(graded, cards, 22000);
    expect(snap).not.toBeNull();
    expect(snap!.items.some((i) => i.id === headId)).toBe(true);
    expect(snap!.progress.attempt.gameId).toBe('r2');
  });

  it('R2-3: chế độ exam ghi bandEvidence khi hoàn thành bài', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, {
      level: 8,
      mode: 'exam',
      nowMs: 1000,
    });
    const editable = state.tasks.filter((t) => !t.isExample);
    for (let i = 0; i < editable.length; i++) {
      state = { ...state, currentIndex: state.tasks.indexOf(editable[i]) };
      state = assignHeadingChoice(state, editable[i].correctHeadingKey).state;
    }
    const { state: done } = submitEntirePassage(state, 120, 121000);
    const snap = buildR2ProgressSnapshot(done, [], 122000);
    expect(snap).not.toBeNull();
    expect(snap!.bandEvidence).toHaveLength(1);
    expect(snap!.bandEvidence![0].mode).toBe('exam');
    expect(snap!.bandEvidence![0].skill).toBe('R');
  });

  it('C3: createHeadlineRetrySession chỉ gồm ≤ 5 đoạn sai, 0 XP, 0 producedItems, snapshot = null', () => {
    let state = createHeadlineSession(R1_FIXTURE_P3, {
      level: 3,
      mode: 'training',
      gradingModeOverride: 'per_paragraph',
      nowMs: 1000,
    });
    const task = state.tasks[state.currentIndex];
    const wrongHeading = state.headings.find((h) => h.key !== task.correctHeadingKey)!;
    state = selectMainIdeaSpan(state, {
      paragraph: task.paragraphLabel,
      start: 0,
      end: Math.min(40, task.paragraphText.length),
      quote: task.paragraphText.slice(0, Math.min(40, task.paragraphText.length)),
    }).state;
    state = assignHeadingChoice(state, wrongHeading.key).state;
    state = submitCurrentParagraph(state, 20, 21000).state;

    const retry = createHeadlineRetrySession(state, 50000);
    expect(retry).not.toBeNull();
    expect(retry!.isRetry).toBe(true);
    expect(retry!.tasks.length).toBeLessThanOrEqual(5);

    const rTask = retry!.tasks[0];
    let rState = selectMainIdeaSpan(retry!, {
      paragraph: rTask.paragraphLabel,
      start: 0,
      end: Math.min(40, rTask.paragraphText.length),
      quote: rTask.paragraphText.slice(0, Math.min(40, rTask.paragraphText.length)),
    }).state;
    rState = assignHeadingChoice(rState, rTask.correctHeadingKey).state;
    const { state: rGraded } = submitCurrentParagraph(rState, 10, 60000);

    expect(rGraded.totalXp).toBe(0);
    expect(Object.keys(rGraded.producedItems)).toHaveLength(0);
    expect(buildR2ProgressSnapshot(rGraded)).toBeNull();
  });
});
