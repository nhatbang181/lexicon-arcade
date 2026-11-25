import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import type { WritingTask1Prompt, WritingTask2Prompt } from '../../core/content/schemas';
import { LexiconV3DB, type EssayRecord } from '../../core/storage/db';
import { essayRepo } from '../../core/storage/repos/essayRepo';
import { bandRepo } from '../../core/storage/repos/bandRepo';
import {
  advanceLifecycle,
  applyBiasOffsetToBand,
  buildEssayGradingPacket,
  buildTask1Checklist,
  buildTask2Checklist,
  canReviseEssay,
  compareRevisionBands,
  computeBiasCalibration,
  computeEssayXp,
  countWords,
  createInitialLifecycle,
  createWritingPacketInput,
  detectPasteEvent,
  evaluateTimerWarning,
  evaluateWordCount,
  filterTask1Entries,
  filterTask2Prompts,
  formatClock,
  getMinWords,
  getRecommendedMinutes,
  pickSuggestedTask2,
  scanCliches,
} from './engine';
import type { ClicheEntry, Task1IndexEntry } from './writingLoader';

const SAMPLE_CLICHES: ClicheEntry[] = [
  {
    id: 'cliche:in_this_day_and_age',
    phrase: 'in this day and age',
    variants: ['in this modern day and age'],
    category: 'opener',
    severity: 'high',
    betterAlternatives: ['in contemporary society', 'over the past two decades'],
    whyAvoidVi: 'Cụm mở bài sáo rỗng.',
  },
  {
    id: 'cliche:every_coin_two_sides',
    phrase: 'every coin has two sides',
    variants: ['two sides of the same coin', 'every coin has 2 sides'],
    category: 'idiom',
    severity: 'high',
    betterAlternatives: ['this trend carries both benefits and drawbacks'],
    whyAvoidVi: 'Thành ngữ sáo rỗng.',
  },
  {
    id: 'cliche:more_and_more',
    phrase: 'more and more',
    variants: [],
    category: 'quantifier',
    severity: 'medium',
    betterAlternatives: ['an increasing number of', 'a growing proportion of'],
    whyAvoidVi: 'Lặp từ thân mật.',
  },
];

const SAMPLE_TASK2: WritingTask2Prompt = {
  id: 'w2:001',
  essayType: 'opinion',
  topic: 'education',
  difficulty: 2,
  prompt: 'Computer coding should be compulsory in secondary school. To what extent do you agree?',
  partsToAddress: ['State clear position', 'Provide reasons and examples', 'Address counterargument'],
  ideaBank: [
    { side: 'for', idea: 'Structured problem-solving', develop: 'Helps in maths and writing.' },
  ],
  band8Model: {
    text: 'Model essay text.',
    wordCount: 270,
    notes: [{ start: 0, end: 5, noteVi: 'Mở bài tốt', criterion: 'TR' }],
  },
  usefulCollocationIds: ['col:literacy_digital_literacy'],
  provenance: {
    createdBy: 'llm+review',
    source: 'test',
    license: 'own',
    qa: { schema: 'pass', verifier: 'pass', blindSolve: 'na' },
  },
};

const SAMPLE_TASK1: WritingTask1Prompt = {
  id: 'w1:001',
  kind: 'bar',
  topic: 'energy',
  difficulty: 1,
  prompt: 'The bar chart shows renewable electricity share across five regions in 2010 and 2024.',
  chart: {
    title: 'Renewable Share (%)',
    unit: '%',
    categories: ['Nordvale', 'Eastbay'],
    series: [
      { name: '2010', values: [42, 8] },
      { name: '2024', values: [78, 21] },
    ],
  },
  keyFeatures: [
    { id: 'kf1', kind: 'overall_trend', textEn: 'All regions grew substantially.', mustMention: true },
    { id: 'kf2', kind: 'highest', textEn: 'Nordvale led in both years.', mustMention: true },
    { id: 'kf3', kind: 'lowest', textEn: 'Eastbay trailed throughout.', mustMention: false },
  ],
  overviewModels: ['Overall, renewable share rose everywhere.'],
  band8Model: {
    text: 'Task 1 model text.',
    wordCount: 170,
  },
  provenance: {
    createdBy: 'llm+review',
    source: 'test',
    license: 'own',
    qa: { schema: 'pass', verifier: 'pass', blindSolve: 'na' },
  },
};

describe('W1 Essay Lab pure engine', () => {
  it('counts words following IELTS conventions (hyphenated words & numbers = 1 word)', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t  ')).toBe(0);
    expect(countWords('well-known twenty-five 2024 78.5%')).toBe(4);
    expect(countWords("It's a state-of-the-art system with 150 users.")).toBe(7);
  });

  it('evaluates Task 1 (150 words) and Task 2 (250 words) minimum thresholds accurately', () => {
    expect(getMinWords('task1')).toBe(150);
    expect(getMinWords('task2')).toBe(250);

    const shortText = Array.from({ length: 40 }, () => 'word').join(' ');
    const midTask1 = Array.from({ length: 120 }, () => 'word').join(' ');
    const okTask1 = Array.from({ length: 155 }, () => 'word').join(' ');
    const okTask2 = Array.from({ length: 260 }, () => 'word').join(' ');

    expect(evaluateWordCount('task1', shortText)).toMatchObject({
      wordCount: 40,
      canGrade: false,
      meetsMinimum: false,
      status: 'too_short',
      deficit: 110,
    });
    expect(evaluateWordCount('task1', midTask1)).toMatchObject({
      wordCount: 120,
      canGrade: true,
      meetsMinimum: false,
      status: 'under_min',
      deficit: 30,
    });
    expect(evaluateWordCount('task1', okTask1)).toMatchObject({
      wordCount: 155,
      canGrade: true,
      meetsMinimum: true,
      status: 'ok',
      deficit: 0,
    });
    expect(evaluateWordCount('task2', okTask1).meetsMinimum).toBe(false);
    expect(evaluateWordCount('task2', okTask2).meetsMinimum).toBe(true);
  });

  it('evaluates timer warnings for Task 1 (20 min) and Task 2 (40 min)', () => {
    expect(getRecommendedMinutes('task1')).toBe(20);
    expect(getRecommendedMinutes('task2')).toBe(40);

    expect(evaluateTimerWarning('task1', 600, 'exam')).toMatchObject({
      remainingSec: 600,
      warningLevel: 'normal',
      isOvertime: false,
    });
    expect(evaluateTimerWarning('task1', 960, 'exam')).toMatchObject({
      remainingSec: 240,
      warningLevel: 'five_min',
    });
    expect(evaluateTimerWarning('task2', 2350, 'exam')).toMatchObject({
      remainingSec: 50,
      warningLevel: 'one_min',
    });
    expect(evaluateTimerWarning('task1', 1205, 'exam')).toMatchObject({
      remainingSec: -5,
      warningLevel: 'overtime',
      isOvertime: true,
    });
    expect(formatClock(125)).toBe('02:05');
    expect(formatClock(-15)).toBe('-00:15');
  });

  it('scans clichés case-insensitively across phrase and variants without double-counting overlaps', () => {
    const essay =
      'In This Modern Day And Age, more and more students believe that EVERY COIN HAS 2 SIDES. Moreover, more and more schools adapt.';
    const hits = scanCliches(essay, SAMPLE_CLICHES);

    expect(hits).toHaveLength(3);
    // High severity sorted first
    expect(hits[0].id).toBe('cliche:in_this_day_and_age');
    expect(hits[0].count).toBe(1);
    expect(hits[0].betterAlternatives.length).toBeGreaterThan(0);
    expect(hits[1].id).toBe('cliche:every_coin_two_sides');
    expect(hits[2].id).toBe('cliche:more_and_more');
    expect(hits[2].count).toBe(2);
  });

  it('respects word boundaries in cliché scanner and returns empty on clean academic prose', () => {
    const clean = 'In contemporary society, digital literacy has become indispensable.';
    expect(scanCliches(clean, SAMPLE_CLICHES)).toEqual([]);
    expect(scanCliches('', SAMPLE_CLICHES)).toEqual([]);
  });

  it('detects suspicious paste events > 100 characters', () => {
    expect(detectPasteEvent('a'.repeat(100)).isSuspiciousPaste).toBe(false);
    const suspicious = detectPasteEvent('a'.repeat(101));
    expect(suspicious.isSuspiciousPaste).toBe(true);
    expect(suspicious.warningVi).toBeTruthy();
  });

  it('builds Task 2 self-check checklist with 6 items and auto word-count & cliché flags', () => {
    const longClean = Array.from({ length: 260 }, () => 'academic').join(' ');
    const items = buildTask2Checklist(SAMPLE_TASK2, longClean, []);
    expect(items).toHaveLength(6);
    expect(items.find((i) => i.id === 't2_wordcount')?.autoPassed).toBe(true);
    expect(items.find((i) => i.id === 't2_cliches')?.autoPassed).toBe(true);

    const shortWithCliche = 'In this day and age, coding matters.';
    const clicheHits = scanCliches(shortWithCliche, SAMPLE_CLICHES);
    const items2 = buildTask2Checklist(SAMPLE_TASK2, shortWithCliche, clicheHits);
    expect(items2.find((i) => i.id === 't2_wordcount')?.autoPassed).toBe(false);
    expect(items2.find((i) => i.id === 't2_cliches')?.autoPassed).toBe(false);
  });

  it('builds Task 1 self-check checklist from keyFeatures plus overview, wordcount, and clichés', () => {
    const text = Array.from({ length: 160 }, () => 'renewable').join(' ');
    const items = buildTask1Checklist(SAMPLE_TASK1, text, []);
    // overview + 3 key features + wordcount + cliches = 6
    expect(items).toHaveLength(6);
    expect(items.filter((i) => i.mustMention)).toHaveLength(2);
    expect(items.find((i) => i.id === 't1_wordcount')?.autoPassed).toBe(true);
  });

  it('manages essay lifecycle transitions and enforces max 3 revisions', () => {
    let state = createInitialLifecycle();
    expect(state.stage).toBe('select');
    state = advanceLifecycle(state, 'start_writing');
    expect(state).toMatchObject({ stage: 'write', status: 'draft', revisionNumber: 0 });
    state = advanceLifecycle(state, 'submit_draft');
    expect(state).toMatchObject({ stage: 'review', status: 'awaiting_grade' });
    state = advanceLifecycle(state, 'grade_received');
    expect(state).toMatchObject({ stage: 'graded', status: 'graded', canReviseAgain: true });

    // Revision 1 -> 2 -> 3
    for (let rev = 1; rev <= 3; rev++) {
      state = advanceLifecycle(state, 'start_revision');
      expect(state.revisionNumber).toBe(rev);
      state = advanceLifecycle(state, 'submit_revision');
      state = advanceLifecycle(state, 'grade_received');
      expect(state.status).toBe('revised');
    }

    expect(canReviseEssay(3)).toBe(false);
    expect(state.canReviseAgain).toBe(false);
    const blocked = advanceLifecycle(state, 'start_revision');
    expect(blocked.revisionNumber).toBe(3);
  });

  it('compares v1 vs v2 criteria bands and produces accurate deltas and win message', () => {
    const comparison = compareRevisionBands(
      { TR_TA: 6.5, CC: 6.5, LR: 6.0, GRA: 6.5 },
      { TR_TA: 7.0, CC: 6.5, LR: 6.5, GRA: 7.0 },
      'task2',
    );
    expect(comparison.overallV1).toBe(6.5);
    expect(comparison.overallV2).toBe(7.0);
    expect(comparison.overallDelta).toBe(0.5);
    expect(comparison.improvedCount).toBe(3);
    expect(comparison.criteriaDeltas.LR.delta).toBe(0.5);
    expect(comparison.winMessageVi).toContain('TR 6.5 → 7.0');
    expect(comparison.winMessageVi).toContain('LR 6.0 → 6.5');
  });

  it('computes Essay Lab XP according to Training rules, 0 XP in Exam (SR-24) and retry (PP-C5)', () => {
    const fullTraining = computeEssayXp({
      meetsMinimum: true,
      checklistCompleted: true,
      claudeGraded: true,
      improvedRevisionsCount: 1,
      mode: 'training',
      onTime: true,
      pasted: false,
    });
    expect(fullTraining).toEqual({
      submitXp: 60,
      checklistXp: 10,
      gradeXp: 20,
      revisionXp: 30,
      examBonusXp: 0,
      totalXp: 120,
    });

    const examRun = computeEssayXp({
      meetsMinimum: true,
      checklistCompleted: true,
      claudeGraded: true,
      improvedRevisionsCount: 1,
      mode: 'exam',
      onTime: true,
      pasted: false,
    });
    expect(examRun.totalXp).toBe(0);

    const retryRun = computeEssayXp({
      meetsMinimum: true,
      checklistCompleted: true,
      claudeGraded: true,
      improvedRevisionsCount: 1,
      mode: 'training',
      onTime: true,
      pasted: false,
      isRetry: true,
    });
    expect(retryRun.totalXp).toBe(0);
  });

  it('applies writing band caps in compareRevisionBands (G-03)', () => {
    const comp = compareRevisionBands(
      { TR_TA: 7.5, CC: 7.5, LR: 7.5, GRA: 7.5 },
      { TR_TA: 7.5, CC: 7.5, LR: 7.5, GRA: 7.5 },
      'task2',
      { kind: 'task2', wordCount: 180, relevance: 'on_topic' },
      { kind: 'task2', wordCount: 270, relevance: 'on_topic' },
    );
    expect(comp.overallV1).toBeLessThan(comp.overallV2);
    expect(comp.overallDelta).toBeGreaterThan(0);
  });

  it('computes biasOffset calibration per docs/07 §6 (>=3 stats, >=5 & |diff|>=0.5 suggest offset)', () => {
    const makeEssay = (id: number, claude: number, official?: number): EssayRecord => ({
      id,
      taskType: id % 2 === 0 ? 'task2' : 'task1',
      promptId: `w2:00${id}`,
      text: 'essay',
      wordCount: 260,
      claudeResult: {
        overallBand: claude,
        criteria: { TR_TA: claude, CC: claude, LR: claude, GRA: claude },
        promptVersion: 'w-1.0',
        rawJson: '{}',
      },
      officialBand: official,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // < 3 paired
    expect(computeBiasCalibration([makeEssay(1, 6.5, 7.0), makeEssay(2, 6.5, 7.0)]).canShowStats).toBe(false);

    // 3 paired: show stats, do not suggest offset yet
    const three = [makeEssay(1, 6.0, 6.5), makeEssay(2, 6.0, 6.5), makeEssay(3, 6.0, 7.0)];
    const cal3 = computeBiasCalibration(three);
    expect(cal3.canShowStats).toBe(true);
    expect(cal3.shouldSuggestOffset).toBe(false);
    expect(cal3.meanDiff).toBeCloseTo(0.67, 2);

    // 5 paired with meanDiff = +0.5 -> suggest +0.5 offset
    const five = [
      makeEssay(1, 6.0, 6.5),
      makeEssay(2, 6.5, 7.0),
      makeEssay(3, 6.0, 6.5),
      makeEssay(4, 6.5, 7.0),
      makeEssay(5, 7.0, 7.5),
    ];
    const cal5 = computeBiasCalibration(five);
    expect(cal5.shouldSuggestOffset).toBe(true);
    expect(cal5.suggestedOffset).toBe(0.5);
    expect(applyBiasOffsetToBand(6.5, cal5.suggestedOffset)).toBe(7.0);
  });

  it('builds a valid Writing grading packet for both Task 1 and Task 2 (including revision issues)', () => {
    const t1Input = createWritingPacketInput({
      attemptId: 'att-t1-01',
      taskType: 'task1',
      mode: 'training',
      essayText: Array.from({ length: 155 }, () => 'renewable').join(' '),
      durationSec: 900,
      task1Prompt: SAMPLE_TASK1,
    });
    const t1Packet = buildEssayGradingPacket(t1Input);
    expect(t1Packet.attemptId).toBe('att-t1-01');
    expect(t1Packet.markdown).toContain('Renewable Share (%)');
    expect(t1Packet.markdown).toContain('Nordvale');

    const t2Input = createWritingPacketInput({
      attemptId: 'att-t2-rev1',
      taskType: 'task2',
      mode: 'exam',
      essayText: Array.from({ length: 260 }, () => 'coding').join(' '),
      durationSec: 1800,
      task2Prompt: SAMPLE_TASK2,
      revisionNumber: 1,
      previousIssues: [
        {
          criterion: 'LR',
          quote: 'make a crime',
          problemVi: 'Collocation sai',
          fix: 'commit a crime',
        },
      ],
    });
    const t2Packet = buildEssayGradingPacket(t2Input);
    expect(t2Packet.markdown).toContain('make a crime');
    expect(t2Packet.markdown).toContain('commit a crime');
  });

  it('filters Task 2 prompts and Task 1 index entries accurately and suggests unwritten prompts', () => {
    const task2List: WritingTask2Prompt[] = [
      SAMPLE_TASK2,
      { ...SAMPLE_TASK2, id: 'w2:002', essayType: 'discussion', topic: 'health', difficulty: 5 },
    ];
    expect(filterTask2Prompts(task2List, { essayType: 'discussion' })).toHaveLength(1);
    expect(filterTask2Prompts(task2List, { topic: 'education' })).toHaveLength(1);
    expect(pickSuggestedTask2(task2List, new Set(['w2:001']), 2)?.id).toBe('w2:002');

    const task1Entries: Task1IndexEntry[] = [
      {
        id: 'w1:001',
        file: 'data/writing/task1/w1_001.json',
        kind: 'bar',
        topic: 'energy',
        difficulty: 1,
        title: 'Renewable Share',
        promptPreview: 'The bar chart shows...',
        keyFeatureCount: 5,
        wordCount: 170,
      },
      {
        id: 'w1:021',
        file: 'data/writing/task1/w1_021.json',
        kind: 'process',
        topic: 'environment',
        difficulty: 4,
        title: 'Plastic Recycling Process',
        promptPreview: 'The diagram illustrates...',
        keyFeatureCount: 5,
        wordCount: 172,
      },
    ];
    expect(filterTask1Entries(task1Entries, { kind: 'process' })).toHaveLength(1);
    expect(filterTask1Entries(task1Entries, { search: 'plastic' })).toHaveLength(1);
  });

  it('persists essays and official scores in Dexie essayRepo & bandRepo cleanly', async () => {
    const testDb = new LexiconV3DB(`W1TestDB_${Date.now()}`);
    const now = Date.now();
    const id = await essayRepo.save(
      {
        taskType: 'task2',
        promptId: 'w2:001',
        text: 'Sample essay content for persistence check.',
        wordCount: 265,
        createdAt: now,
        updatedAt: now,
      },
      testDb,
    );
    expect(id).toBeGreaterThan(0);

    await essayRepo.update(
      id,
      {
        claudeResult: {
          overallBand: 6.5,
          criteria: { TR_TA: 7.0, CC: 6.5, LR: 6.0, GRA: 6.5 },
          promptVersion: 'w-1.0',
          rawJson: '{}',
        },
        officialBand: 7.0,
      },
      testDb,
    );

    await bandRepo.add(
      {
        skill: 'W',
        mode: 'exam',
        ts: now,
        band: 7.0,
        taskType: 'task2',
        sourceGameId: 'w1',
      },
      testDb,
    );

    const saved = await essayRepo.get(id, testDb);
    expect(saved?.claudeResult?.overallBand).toBe(6.5);
    expect(saved?.officialBand).toBe(7.0);

    const latestBand = await bandRepo.getLatest('W', testDb);
    expect(latestBand?.band).toBe(7.0);

    await testDb.delete();
  });
});
