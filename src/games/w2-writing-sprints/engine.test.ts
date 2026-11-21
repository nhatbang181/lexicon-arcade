import { describe, expect, it } from 'vitest';
import type { WritingTask2Prompt } from '../../core/content/schemas';
import type { SprintResult } from '../../core/grading';
import {
  ACADEMIC_UPGRADE_BANK,
  applyClaudeSprintResult,
  buildClicheDrillItems,
  buildW2SprintPacketInput,
  buildWinSentence,
  CLAUDE_SPRINT_BONUS_XP,
  computeRoundXp,
  computeSessionSummary,
  extractModelThesis,
  extractSpecificNumbers,
  formatSprintClock,
  getRoundDurationSec,
  getTimerTone,
  rankIdeaBankBySimilarity,
  scoreClicheDrill,
  scoreIdeaSelfCheck,
  scoreOverviewSelfCheck,
  scoreThesisResponse,
  scoreUpgradeDrill,
  selectAcademicUpgradeItems,
  selectIdeaPrompts,
  selectOverviewPrompts,
  splitByKeyPhrases,
  updateSprintStreak,
  type CompletedSprintRound,
  type SprintClicheEntry,
} from './engine';

const SAMPLE_CLICHES: SprintClicheEntry[] = [
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
    variants: ['two sides of the same coin'],
    category: 'idiom',
    severity: 'high',
    betterAlternatives: ['this trend carries both clear benefits and notable drawbacks'],
    whyAvoidVi: 'Thành ngữ sáo rỗng.',
  },
  {
    id: 'cliche:double_edged_sword',
    phrase: 'double-edged sword',
    variants: ['double edged sword'],
    category: 'idiom',
    severity: 'high',
    betterAlternatives: ['presents competing advantages and risks'],
    whyAvoidVi: 'Ẩn dụ mòn.',
  },
  {
    id: 'cliche:last_but_not_least',
    phrase: 'last but not least',
    variants: [],
    category: 'filler',
    severity: 'high',
    betterAlternatives: ['a further decisive factor is'],
    whyAvoidVi: 'Cụm văn nói sáo rỗng.',
  },
];

const SAMPLE_TASK2_PROMPT: WritingTask2Prompt = {
  id: 'w2:001',
  essayType: 'opinion',
  topic: 'education',
  difficulty: 2,
  prompt:
    'Some educators argue that computer coding should become a compulsory subject for all secondary school students, alongside mathematics and languages. To what extent do you agree or disagree?',
  partsToAddress: [
    'State clearly whether and to what extent you agree or disagree with making coding compulsory',
    'Develop reasons supporting your position with specific explanations',
  ],
  ideaBank: [
    {
      side: 'for',
      idea: 'Early exposure to coding cultivates structured problem-solving habits applicable across disciplines.',
      develop: 'Breaking a complex task into logical steps trains pupils to debug errors systematically.',
    },
    {
      side: 'for',
      idea: 'Compulsory instruction narrows socio-economic disparities in digital literacy.',
      develop: 'Universal classes ensure equal foundational access for lower-income households.',
    },
    {
      side: 'against',
      idea: 'Mandating full programming courses risks crowding out arts, humanities, and physical education.',
      develop: 'Timetable hours are finite so schools often trim music or history.',
    },
  ],
  band8Model: {
    text: 'Debate over secondary school timetables increasingly centres on whether computer coding warrants mandatory status. While I agree that introductory computational thinking should be compulsory in early secondary years, I contend that advanced programming ought to remain optional.\n\nIntegrating basic coding delivers clear academic benefits.',
    wordCount: 270,
    notes: [],
  },
  usefulCollocationIds: [],
  provenance: {
    createdBy: 'llm+review',
    source: 'test-fixture',
    license: 'own',
    qa: { schema: 'pass', verifier: 'pass', blindSolve: 'na' },
  },
};

describe('W2 Writing Sprints engine — Timer, XP & Streak', () => {
  it('computes round durations by level (harder at L7+)', () => {
    expect(getRoundDurationSec('overview', 2)).toBe(90);
    expect(getRoundDurationSec('overview', 7)).toBe(60);
    expect(getRoundDurationSec('idea', 4)).toBe(180);
    expect(getRoundDurationSec('idea', 8)).toBe(150);
    expect(getRoundDurationSec('thesis', 1)).toBe(60);
  });

  it('switches timer tone at 25% and 10% thresholds', () => {
    expect(getTimerTone(50, 100)).toBe('normal');
    expect(getTimerTone(25, 100)).toBe('warn');
    expect(getTimerTone(11, 100)).toBe('warn');
    expect(getTimerTone(10, 100)).toBe('critical');
    expect(getTimerTone(0, 100)).toBe('critical');
    expect(formatSprintClock(90)).toBe('1:30');
    expect(formatSprintClock(7)).toBe('0:07');
  });

  it('computes XP (10 * stars) and streak progression', () => {
    expect(computeRoundXp(3)).toBe(30);
    expect(computeRoundXp(0)).toBe(0);
    const s1 = updateSprintStreak({ streak: 0, bestStreak: 0 }, 3);
    expect(s1).toEqual({ streak: 1, bestStreak: 1 });
    const s2 = updateSprintStreak(s1, 2);
    expect(s2).toEqual({ streak: 2, bestStreak: 2 });
    const s3 = updateSprintStreak(s2, 1);
    expect(s3).toEqual({ streak: 0, bestStreak: 2 });
  });
});

describe('W2 Writing Sprints engine — 1. Overview Sprint', () => {
  it('converts 4-item checklist to 0–3 stars accurately', () => {
    const cleanText =
      'Overall, every region increased its renewable electricity share between 2010 and 2024, while Nordvale stayed clearly ahead.';
    expect(
      scoreOverviewSelfCheck(cleanText, {
        overallTrend: true,
        keyComparison: true,
        noDetail: true,
        accurate: true,
      }).stars,
    ).toBe(3);

    expect(
      scoreOverviewSelfCheck(cleanText, {
        overallTrend: true,
        keyComparison: true,
        noDetail: true,
        accurate: false,
      }).stars,
    ).toBe(2);

    expect(
      scoreOverviewSelfCheck(cleanText, {
        overallTrend: true,
        keyComparison: false,
        noDetail: true,
        accurate: false,
      }).stars,
    ).toBe(1);
  });

  it('detects specific numbers (while allowing 4-digit years) and penalises checklist contradiction by -1★', () => {
    expect(extractSpecificNumbers('Between 2010 and 2024 all regions grew.')).toEqual([]);
    expect(extractSpecificNumbers('Nordvale surged from 42% to 78% and hit 20,000 units.')).toEqual([
      '42%',
      '78%',
      '20,000',
    ]);

    const res = scoreOverviewSelfCheck(
      'Overall, renewable share rose sharply from 18% to 54% while Eastbay stayed lowest.',
      {
        overallTrend: true,
        keyComparison: true,
        noDetail: true, // contradicts the 18% and 54%
        accurate: true,
      },
    );
    expect(res.contradiction).toBe(true);
    expect(res.rawStars).toBe(3);
    expect(res.stars).toBe(2);
    expect(res.warningVi).toContain('18%');
  });

  it('returns 0★ and disables self-check when overview is empty', () => {
    const res = scoreOverviewSelfCheck('   ', {
      overallTrend: true,
      keyComparison: true,
      noDetail: true,
      accurate: true,
    });
    expect(res.canSelfCheck).toBe(false);
    expect(res.stars).toBe(0);
  });

  it('splits model overview text into highlighted key phrase segments', () => {
    const segments = splitByKeyPhrases(
      'Overall, Nordvale stayed well ahead throughout, whereas Eastbay lagged behind.',
      ['Overall,', 'well ahead throughout', 'lagged behind'],
    );
    const highlighted = segments.filter((s) => s.isKeyPhrase).map((s) => s.phrase);
    expect(highlighted).toEqual(['Overall,', 'well ahead throughout', 'lagged behind']);
  });

  it('prioritises chart kinds by difficulty tier', () => {
    const pool = [
      { id: '1', kind: 'process' as const },
      { id: '2', kind: 'bar' as const },
      { id: '3', kind: 'table' as const },
      { id: '4', kind: 'map' as const },
    ];
    expect(selectOverviewPrompts(pool, 1, 2)[0].kind).toBe('bar');
    expect(selectOverviewPrompts(pool, 5, 2)[0].kind).toBe('table');
    expect(selectOverviewPrompts(pool, 8, 2).map((p) => p.kind)).toEqual(['process', 'map']);
  });
});

describe('W2 Writing Sprints engine — 2. Idea Sprint', () => {
  it('scores 5-item checklist with 0–3 stars and flags empty-field contradiction', () => {
    const fullOutline = {
      stance: 'I partially agree that introductory coding should be compulsory.',
      main1: 'Builds structured problem-solving habits across school subjects.',
      main2: 'Narrows digital literacy gaps for lower-income students.',
      example: 'In rural districts, universal school classes give every pupil access to laptops.',
    };

    expect(
      scoreIdeaSelfCheck(fullOutline, {
        clearStance: true,
        allParts: true,
        relevantIdeas: true,
        developed: true,
        specificExample: true,
      }).stars,
    ).toBe(3);

    expect(
      scoreIdeaSelfCheck(fullOutline, {
        clearStance: true,
        allParts: true,
        relevantIdeas: true,
        developed: false,
        specificExample: false,
      }).stars,
    ).toBe(1);

    const contradicted = scoreIdeaSelfCheck(
      { ...fullOutline, example: '' },
      {
        clearStance: true,
        allParts: true,
        relevantIdeas: true,
        developed: true,
        specificExample: true,
      },
    );
    expect(contradicted.contradiction).toBe(true);
    expect(contradicted.stars).toBe(2);
  });

  it('returns 0★ when Idea outline is blank', () => {
    const res = scoreIdeaSelfCheck(
      { stance: '', main1: '', main2: '', example: '' },
      {
        clearStance: true,
        allParts: true,
        relevantIdeas: true,
        developed: true,
        specificExample: true,
      },
    );
    expect(res.canSelfCheck).toBe(false);
    expect(res.stars).toBe(0);
  });

  it('ranks ideaBank by keyword similarity to learner outline', () => {
    const ranked = rankIdeaBankBySimilarity(
      {
        stance: 'I disagree because timetables are finite.',
        main1: 'Mandating programming crowds out arts, music, and history.',
        main2: 'Humanities and physical education suffer when timetable hours shrink.',
        example: 'Schools trim studio art.',
      },
      SAMPLE_TASK2_PROMPT.ideaBank,
    );
    expect(ranked[0].item.side).toBe('against');
    expect(ranked[0].matchedKeywords.length).toBeGreaterThanOrEqual(3);
  });

  it('selects Task 2 prompts by essayType difficulty tier', () => {
    const discussionPrompt: WritingTask2Prompt = {
      ...SAMPLE_TASK2_PROMPT,
      id: 'w2:010',
      essayType: 'discussion',
    };
    const pickedLow = selectIdeaPrompts([discussionPrompt, SAMPLE_TASK2_PROMPT], 2, 1);
    expect(pickedLow[0].essayType).toBe('opinion');
    const pickedHigh = selectIdeaPrompts([SAMPLE_TASK2_PROMPT, discussionPrompt], 8, 1);
    expect(pickedHigh[0].essayType).toBe('discussion');
  });
});

describe('W2 Writing Sprints engine — 3. Thesis Sprint', () => {
  it('awards 3★ to a concise, on-topic, cliché-free thesis with clear stance', () => {
    const thesis =
      'While I agree that introductory computer coding should be compulsory for secondary students, I argue that advanced programming should remain optional.';
    const res = scoreThesisResponse(thesis, SAMPLE_TASK2_PROMPT, SAMPLE_CLICHES);
    expect(res.stars).toBe(3);
    expect(res.checks).toEqual({
      goodLength: true,
      clearStance: true,
      onTopic: true,
      noCliche: true,
    });
    expect(res.modelThesis).toContain('While I agree');
  });

  it('penalises clichés in a thesis statement and extracts model thesis', () => {
    const thesis =
      'In this day and age, I agree that computer coding should be compulsory for secondary school students.';
    const res = scoreThesisResponse(thesis, SAMPLE_TASK2_PROMPT, SAMPLE_CLICHES);
    expect(res.checks.noCliche).toBe(false);
    expect(res.detectedCliches).toContain('in this day and age');
    expect(res.stars).toBe(2);
    expect(extractModelThesis(SAMPLE_TASK2_PROMPT.band8Model.text)).toContain('remain optional');
  });
});

describe('W2 Writing Sprints engine — 4. Cliché Surgery', () => {
  it('builds 4-option drills from cliches.json and scores accurately', () => {
    const drills = buildClicheDrillItems(SAMPLE_CLICHES, 4, 1);
    expect(drills).toHaveLength(4);
    const first = drills[0];
    expect(first.options).toHaveLength(4);
    expect(first.options[first.correctIndex]).toBe(first.correctReplacement);

    const right = scoreClicheDrill(first, first.correctIndex);
    expect(right.correct).toBe(true);
    expect(right.stars).toBe(3);

    const wrong = scoreClicheDrill(first, (first.correctIndex + 1) % 4);
    expect(wrong.correct).toBe(false);
    expect(wrong.stars).toBe(0);
  });
});

describe('W2 Writing Sprints engine — 5. Academic Upgrade (Hedging & Cohesion)', () => {
  it('selects mixed hedging/cohesion items and scores upgrades', () => {
    const items = selectAcademicUpgradeItems(6, 0);
    expect(items).toHaveLength(6);
    expect(items.some((i) => i.subKind === 'hedging')).toBe(true);
    expect(items.some((i) => i.subKind === 'cohesion')).toBe(true);

    const item = ACADEMIC_UPGRADE_BANK[0];
    expect(scoreUpgradeDrill(item, item.correctIndex).stars).toBe(3);
    expect(scoreUpgradeDrill(item, (item.correctIndex + 1) % 4).stars).toBe(0);
  });
});

describe('W2 Writing Sprints engine — Claude SprintResult mapping & Recap', () => {
  it('maps Claude SprintResult onto rounds by ref and reports missing refs', () => {
    const rounds: CompletedSprintRound[] = [
      {
        ref: 'w1:001',
        title: 'Chart 1',
        promptText: 'Prompt 1',
        responseText: 'Overall, all regions rose.',
        durationSec: 65,
        stars: 2,
        checks: { overallTrend: true, keyComparison: false, noDetail: true, accurate: true },
        gradedBy: 'self',
      },
      {
        ref: 'w1:002',
        title: 'Chart 2',
        promptText: 'Prompt 2',
        responseText: 'Overall, engineering led.',
        durationSec: 70,
        stars: 2,
        checks: { overallTrend: true, keyComparison: true, noDetail: true, accurate: false },
        gradedBy: 'self',
      },
    ];

    const packet = buildW2SprintPacketInput('att-w2-001', 'overview', rounds);
    expect(packet.kind).toBe('w2_overview');
    expect(packet.items).toHaveLength(2);

    const claudeResult: SprintResult = {
      attemptId: 'att-w2-001',
      promptVersion: 'sp-1.0',
      kind: 'w2_overview',
      items: [
        {
          ref: 'w1:001',
          stars: 3,
          checks: { overallTrend: true, keyComparison: true, noDetail: true, accurate: true },
          tipVi: 'Gọn và chuẩn Band 8.',
          betterChunk: { original: 'all regions rose', better: 'all five regions expanded markedly' },
        },
      ],
    };

    const outcome = applyClaudeSprintResult(rounds, claudeResult);
    expect(outcome.matchedRefs).toEqual(['w1:001']);
    expect(outcome.missingRefs).toEqual(['w1:002']);
    expect(outcome.rounds[0].gradedBy).toBe('claude');
    expect(outcome.rounds[0].stars).toBe(3);
    expect(outcome.rounds[1].gradedBy).toBe('self');
    expect(outcome.betterChunks).toHaveLength(1);

    const summary = computeSessionSummary(outcome.rounds, true);
    expect(summary.totalStars).toBe(5);
    expect(summary.totalXp).toBe(50 + CLAUDE_SPRINT_BONUS_XP);
    expect(buildWinSentence('overview', outcome.rounds)).toContain('2/2');
  });
});
