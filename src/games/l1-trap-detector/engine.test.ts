import { describe, it, expect } from 'vitest';
import { ListeningEpisodeSchema, type ListeningEpisode } from '../../core/content/schemas';
import {
  L1_FIXTURE_EPISODES,
  L1_FIXTURE_P1,
  L1_FIXTURE_P2_MAP,
} from '../../test/fixtures/l1_fixtures';
import {
  LISTENING_PLACEMENT_QUESTIONS,
  evaluateListeningPlacement,
} from '../../features/placement/listeningPlacement';
import {
  ListeningIndexEntrySchema,
  loadListeningCatalog,
  loadListeningEpisode,
} from './listeningLoader';
import {
  buildL1ProgressPayload,
  buildL1SessionSavePayload,
  buildL1UserItems,
  buildL1WinStatement,
  canSubmitNow,
  createL1RetrySession,
  createL1Session,
  extractQuestionOptions,
  finishAudioListening,
  finishDebrief,
  getActiveSignpostQid,
  getL1DifficultyConfig,
  getSelectedMultiKeys,
  resolveScriptTimings,
  setAnswer,
  setPrediction,
  startListeningPhase,
  submitAndGrade,
  submitTrapLabel,
  toggleFlag,
  toggleMcqMultiChoice,
} from './engine';

function makeMultiTypeEpisode(): ListeningEpisode {
  return {
    ...L1_FIXTURE_P1,
    id: 'lep:test_all_types',
    part: 4,
    questionGroups: [
      {
        groupId: 'g_note',
        type: 'note_completion',
        instructions: 'Write ONE WORD ONLY.',
        wordLimit: { words: 1, allowNumber: false },
        previewSec: 20,
        questions: [
          {
            qid: 'q_note',
            number: 1,
            prompt: 'Primary energy source: ________',
            answer: { accepted: ['geothermal'] },
            evidence: { lineId: 'l1', start: 0, end: 6 },
            traps: [],
          },
        ],
      },
      {
        groupId: 'g_table',
        type: 'table_completion',
        instructions: 'Write ONE WORD AND/OR A NUMBER.',
        wordLimit: { words: 1, allowNumber: true },
        previewSec: 20,
        questions: [
          {
            qid: 'q_table',
            number: 2,
            prompt: 'Annual output (MW): ________',
            answer: { accepted: ['420'] },
            evidence: { lineId: 'l2', start: 6, end: 13 },
            traps: [
              {
                type: 'distractor_number',
                lineId: 'l2',
                start: 6,
                end: 9,
                decoy: '240',
                explanationVi: '240 là sản lượng giai đoạn đầu, 420 mới là sản lượng hiện tại.',
              },
            ],
          },
        ],
      },
      {
        groupId: 'g_summary',
        type: 'summary_completion',
        instructions: 'Write NO MORE THAN TWO WORDS.',
        wordLimit: { words: 2, allowNumber: false },
        previewSec: 20,
        questions: [
          {
            qid: 'q_summary',
            number: 3,
            prompt: 'Pipe corrosion was reduced by adding ________.',
            answer: { accepted: ['mineral filters'] },
            evidence: { lineId: 'l3', start: 13, end: 20 },
            traps: [],
          },
        ],
      },
      {
        groupId: 'g_matching',
        type: 'matching',
        instructions: 'Match each study with the correct researcher A–C.',
        previewSec: 20,
        options: [
          { key: 'A', text: 'Dr Patel' },
          { key: 'B', text: 'Dr Novak' },
          { key: 'C', text: 'Dr Okafor' },
        ],
        questions: [
          {
            qid: 'q_match',
            number: 4,
            prompt: 'Coastal heat exchange pilot',
            answer: { accepted: ['B'], keys: ['B'] },
            evidence: { lineId: 'l4', start: 20, end: 31 },
            traps: [],
          },
        ],
      },
    ],
  };
}

describe('L1 Trap Detector fixtures & pure engine', () => {
  it('validates both L1 fixture episodes against ListeningEpisodeSchema', () => {
    for (const ep of L1_FIXTURE_EPISODES) {
      const parsed = ListeningEpisodeSchema.safeParse(ep);
      expect(parsed.success).toBe(true);
    }
    expect(L1_FIXTURE_P1.questionGroups[0].template?.rows.length).toBe(7);
    expect(L1_FIXTURE_P2_MAP.questionGroups[0].map?.slots.length).toBe(8);
  });

  it('configures difficulty presets accurately for Training Lv 1–10 and Exam mode', () => {
    const lv2 = getL1DifficultyConfig('training', 2);
    expect(lv2.defaultRate).toBe(0.9);
    expect(lv2.showSignposts).toBe(true);
    expect(lv2.allowPause).toBe(true);
    expect(lv2.countsForBand).toBe(false);

    const lv5 = getL1DifficultyConfig('training', 5);
    expect(lv5.defaultRate).toBe(1);
    expect(lv5.showSignposts).toBe(false);
    expect(lv5.allowPause).toBe(true);

    const lv7 = getL1DifficultyConfig('training', 7);
    expect(lv7.allowPause).toBe(false);
    expect(lv7.allowRewind).toBe(false);

    const lv9 = getL1DifficultyConfig('training', 9);
    expect(lv9.examLocked).toBe(true);
    expect(lv9.countsForBand).toBe(false);

    const exam = getL1DifficultyConfig('exam', 2);
    expect(exam.examLocked).toBe(true);
    expect(exam.showSignposts).toBe(false);
    expect(exam.allowPredictions).toBe(false);
    expect(exam.reviewSec).toBe(30);
    expect(exam.countsForBand).toBe(true);
  });

  it('allows prediction tagging in Training preview but blocks it in Exam preview', () => {
    let training = createL1Session(L1_FIXTURE_P1, { mode: 'training', level: 2 });
    training = setPrediction(training, 'fp1_q01', 'name');
    training = setPrediction(training, 'fp1_q04', 'date');
    expect(training.predictions).toEqual({ fp1_q01: 'name', fp1_q04: 'date' });

    let exam = createL1Session(L1_FIXTURE_P1, { mode: 'exam', level: 2 });
    exam = setPrediction(exam, 'fp1_q01', 'name');
    expect(exam.predictions).toEqual({});
  });

  it('runs the full 4-phase + recap lifecycle in Exam mode (preview -> listening -> review -> debrief -> recap)', () => {
    let s = createL1Session(L1_FIXTURE_P1, { mode: 'exam', level: 5, nowMs: 1000 });
    expect(s.phase).toBe('preview');

    const t1 = startListeningPhase(s);
    s = t1.state;
    expect(s.phase).toBe('listening');

    const t2 = finishAudioListening(s);
    s = t2.state;
    expect(s.phase).toBe('review');

    const t3 = submitAndGrade(s, 200_000);
    s = t3.state;
    expect(s.phase).toBe('debrief');

    const t4 = finishDebrief(s, 240_000);
    s = t4.state;
    expect(s.phase).toBe('recap');
    expect(s.endedAt).toBe(240_000);
  });

  it('enforces early-submission guard in Exam mode and allows confirmed early submit in Training', () => {
    const exam = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'exam' })).state;
    expect(canSubmitNow(exam, false, 30).allowed).toBe(false);
    const examReview = finishAudioListening(exam).state;
    expect(canSubmitNow(examReview, true, 12).allowed).toBe(false);
    expect(canSubmitNow(examReview, true, 0).allowed).toBe(true);

    const training = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training' })).state;
    expect(canSubmitNow(training, false, 0)).toEqual({
      allowed: true,
      needsConfirmation: true,
    });
    expect(canSubmitNow(training, true, 0)).toEqual({
      allowed: true,
      needsConfirmation: false,
    });
  });

  it('grades Part 1 form_completion + mcq_single with IELTS normalization (dates, currency, case)', () => {
    let s = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training', level: 2 })).state;
    s = setAnswer(s, 'fp1_q01', 'bramwell');
    s = setAnswer(s, 'fp1_q02', '48');
    s = setAnswer(s, 'fp1_q03', 'Off-Peak');
    s = setAnswer(s, 'fp1_q04', 'March 30th'); // Equivalent date format
    s = setAnswer(s, 'fp1_q05', 'pilates');
    s = setAnswer(s, 'fp1_q06', '38'); // Currency symbol printed on form
    s = setAnswer(s, 'fp1_q07', 'towels');
    s = setAnswer(s, 'fp1_q08', 'B');
    s = setAnswer(s, 'fp1_q09', 'C');
    s = setAnswer(s, 'fp1_q10', 'C');

    const { state: graded } = submitAndGrade(s);
    expect(graded.correctCount).toBe(10);
    expect(graded.totalQuestions).toBe(10);
    expect(graded.baseXp).toBe(100); // Training: 10 XP per correct answer
    expect(graded.bonusXp).toBe(0);
    expect(graded.totalXp).toBe(100);
  });

  it('classifies all error categories accurately: no_answer, word_limit, spelling, plural, trap:<type>, wrong_content', () => {
    let s = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training' })).state;
    s = setAnswer(s, 'fp1_q01', 'Bramwel'); // minor spelling error (1 letter off)
    s = setAnswer(s, 'fp1_q02', '84'); // trap:self_correction (matches decoy "84")
    s = setAnswer(s, 'fp1_q03', 'very cheap off-peak'); // word_limit (3 words > 1 word limit)
    s = setAnswer(s, 'fp1_q04', '13 March'); // trap:self_correction (matches decoy "13 March")
    s = setAnswer(s, 'fp1_q05', 'swimming'); // wrong_content (does not match decoy "yoga")
    s = setAnswer(s, 'fp1_q06', ''); // no_answer
    s = setAnswer(s, 'fp1_q07', 'towel'); // plural (missing -s)

    const { state: graded } = submitAndGrade(s);
    const byId = Object.fromEntries(graded.results.map((r) => [r.qid, r]));

    expect(byId['fp1_q01'].errorCategory).toBe('spelling');
    expect(byId['fp1_q02'].errorCategory).toBe('trap:self_correction');
    expect(byId['fp1_q03'].errorCategory).toBe('word_limit');
    expect(byId['fp1_q04'].errorCategory).toBe('trap:self_correction');
    expect(byId['fp1_q05'].errorCategory).toBe('wrong_content');
    expect(byId['fp1_q06'].errorCategory).toBe('no_answer');
    expect(byId['fp1_q07'].errorCategory).toBe('plural');
  });

  it('grades Part 2 map_labelling, mcq_single, and paired mcq_multi regardless of selection order', () => {
    let s = startListeningPhase(createL1Session(L1_FIXTURE_P2_MAP, { mode: 'exam', level: 5 })).state;
    // Map labelling A-H
    s = setAnswer(s, 'fp2_q01', 'B');
    s = setAnswer(s, 'fp2_q02', 'D');
    s = setAnswer(s, 'fp2_q03', 'F');
    s = setAnswer(s, 'fp2_q04', 'A');
    s = setAnswer(s, 'fp2_q05', 'H');
    // MCQ single
    s = setAnswer(s, 'fp2_q06', 'B');
    s = setAnswer(s, 'fp2_q07', 'B');
    s = setAnswer(s, 'fp2_q08', 'C');
    // MCQ multi: choose E then B (reverse order of ['B', 'E'])
    s = toggleMcqMultiChoice(s, 'p2_g3_multi', 'fp2_q09', 'E');
    s = toggleMcqMultiChoice(s, 'p2_g3_multi', 'fp2_q09', 'B');
    // Trying to pick a 3rd choice is capped at 2
    s = toggleMcqMultiChoice(s, 'p2_g3_multi', 'fp2_q09', 'A');
    expect(getSelectedMultiKeys(s, L1_FIXTURE_P2_MAP.questionGroups[2], 'fp2_q09')).toEqual([
      'B',
      'E',
    ]);

    const { state: graded } = submitAndGrade(s);
    expect(graded.correctCount).toBe(10);
    // Exam XP: 10 * 15 + 50 (>= 9/10 bonus) = 200
    expect(graded.baseXp).toBe(150);
    expect(graded.bonusXp).toBe(50);
    expect(graded.totalXp).toBe(200);
  });

  it('awards 1 point out of 2 when paired mcq_multi has 1 correct and 1 wrong selection', () => {
    let s = startListeningPhase(createL1Session(L1_FIXTURE_P2_MAP, { mode: 'training' })).state;
    s = toggleMcqMultiChoice(s, 'p2_g3_multi', 'fp2_q09', 'E'); // correct
    s = toggleMcqMultiChoice(s, 'p2_g3_multi', 'fp2_q09', 'A'); // distractor

    const { state: graded } = submitAndGrade(s);
    const q9 = graded.results.find((r) => r.qid === 'fp2_q09')!;
    const q10 = graded.results.find((r) => r.qid === 'fp2_q10')!;
    expect(q9.correct).toBe(true);
    expect(q10.correct).toBe(false);
    expect(q10.userAnswer).toBe('A');
  });

  it('supports note_completion, table_completion, summary_completion, and matching', () => {
    const ep = makeMultiTypeEpisode();
    let s = startListeningPhase(createL1Session(ep, { mode: 'training' })).state;
    s = setAnswer(s, 'q_note', 'geothermal');
    s = setAnswer(s, 'q_table', '240'); // trap:distractor_number
    s = setAnswer(s, 'q_summary', 'mineral filters');
    s = setAnswer(s, 'q_match', 'b');

    const { state: graded } = submitAndGrade(s);
    expect(graded.correctCount).toBe(3);
    expect(graded.totalQuestions).toBe(4);
    expect(graded.results.find((r) => r.qid === 'q_table')?.errorCategory).toBe(
      'trap:distractor_number',
    );
  });

  it('awards +5 metacognition XP once per question when learner labels trap accurately in Debrief', () => {
    let s = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training' })).state;
    s = setAnswer(s, 'fp1_q02', '84'); // wrong -> trap self_correction
    s = setAnswer(s, 'fp1_q04', '13 March'); // wrong -> trap self_correction
    s = submitAndGrade(s).state;
    const xpBefore = s.totalXp;

    // Correct trap self-label on Q2 -> +5 XP
    const r1 = submitTrapLabel(s, 'fp1_q02', 'self_correction');
    s = r1.state;
    expect(r1.events[0]?.matched).toBe(true);
    expect(r1.events[0]?.xpDelta).toBe(5);
    expect(s.debriefXp).toBe(5);
    expect(s.totalXp).toBe(xpBefore + 5);

    // Re-clicking Q2 does not farm XP
    const rRepeat = submitTrapLabel(s, 'fp1_q02', 'self_correction');
    expect(rRepeat.state.debriefXp).toBe(5);

    // Wrong trap label on Q4 -> 0 XP, no penalty
    const r2 = submitTrapLabel(s, 'fp1_q04', 'distractor_number');
    s = r2.state;
    expect(r2.events[0]?.matched).toBe(false);
    expect(r2.events[0]?.xpDelta).toBe(0);
    expect(s.selfTrapLabels['fp1_q04'].expected).toContain('self_correction');
    expect(s.totalXp).toBe(xpBefore + 5);
  });

  it('Exam mode awards +50 bonus at 9/10 and omits +50 bonus at 8/10', () => {
    const answerCorrectly = (count: number) => {
      let s = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'exam' })).state;
      const keys: Array<[string, string]> = [
        ['fp1_q01', 'Bramwell'],
        ['fp1_q02', '48'],
        ['fp1_q03', 'off-peak'],
        ['fp1_q04', '30 March'],
        ['fp1_q05', 'pilates'],
        ['fp1_q06', '38'],
        ['fp1_q07', 'towels'],
        ['fp1_q08', 'B'],
        ['fp1_q09', 'C'],
        ['fp1_q10', 'C'],
      ];
      for (let i = 0; i < count; i++) {
        s = setAnswer(s, keys[i][0], keys[i][1]);
      }
      return submitAndGrade(s).state;
    };

    const at8 = answerCorrectly(8);
    expect(at8.baseXp).toBe(120);
    expect(at8.bonusXp).toBe(0);

    const at9 = answerCorrectly(9);
    expect(at9.baseXp).toBe(135);
    expect(at9.bonusXp).toBe(50);
    expect(at9.totalXp).toBe(185);
  });

  it('shows active signpost ONLY in Training Lv 1–4 within ±10s and NEVER in Exam or Lv >= 5', () => {
    const lv2 = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training', level: 2 })).state;
    // fp1_q02 evidence starts at 41s
    expect(getActiveSignpostQid(lv2, 38)).toBe('fp1_q02');

    const lv6 = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training', level: 6 })).state;
    expect(getActiveSignpostQid(lv6, 38)).toBeNull();

    const exam = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'exam', level: 2 })).state;
    expect(getActiveSignpostQid(exam, 38)).toBeNull();
  });

  it('buildL1SessionSavePayload includes bandEvidence ONLY in Exam mode and creates SRS cards for spelling/plural/traps', () => {
    // Training session with spelling, plural, and trap misses
    let training = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training' })).state;
    training = setAnswer(training, 'fp1_q01', 'Bramwel'); // spelling -> vocab:bramwell#listen_spell
    training = setAnswer(training, 'fp1_q07', 'towel'); // plural -> vocab:towels#listen_spell
    training = setAnswer(training, 'fp1_q02', '84'); // trap -> ltrap:fixture_p1_sports_centre_fp1_q02#ltrap_replay
    training = submitAndGrade(training).state;

    const trainPayload = buildL1SessionSavePayload(training, 500_000);
    expect(trainPayload.attempt.gameId).toBe('l1');
    expect(trainPayload.bandEvidence).toBeUndefined();
    const cardIds = (trainPayload.updatedCards ?? []).map((c) => c.id);
    expect(cardIds).toContain('vocab:bramwell#listen_spell');
    expect(cardIds).toContain('vocab:towels#listen_spell');
    expect(cardIds).toContain('ltrap:fixture_p1_sports_centre_fp1_q02#ltrap_replay');

    // Exam session emits bandEvidence
    let exam = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'exam' })).state;
    exam = setAnswer(exam, 'fp1_q01', 'Bramwell');
    exam = submitAndGrade(exam).state;
    const examPayload = buildL1SessionSavePayload(exam, 600_000);
    expect(examPayload.bandEvidence).toHaveLength(1);
    expect(examPayload.bandEvidence?.[0].skill).toBe('L');
    expect(examPayload.bandEvidence?.[0].mode).toBe('exam');
  });

  it('never creates SRS cards for reserved exam episodes ([INV-X1])', () => {
    const reservedEp: ListeningEpisode = { ...L1_FIXTURE_P1, reserved: true };
    let s = startListeningPhase(createL1Session(reservedEp, { mode: 'exam' })).state;
    s = setAnswer(s, 'fp1_q01', 'Bramwel');
    s = setAnswer(s, 'fp1_q07', 'towel');
    s = setAnswer(s, 'fp1_q02', '84');
    s = submitAndGrade(s).state;

    const payload = buildL1SessionSavePayload(s, 700_000);
    expect(payload.updatedCards).toEqual([]);
  });

  it('synthesizes proportional line timings when pre-render episode script has start=0, end=0', () => {
    const preRender: ListeningEpisode = {
      ...L1_FIXTURE_P1,
      script: L1_FIXTURE_P1.script.map((l) => ({ ...l, start: 0, end: 0 })),
    };
    const timings = resolveScriptTimings(preRender);
    const first = timings[preRender.script[0].lineId];
    const last = timings[preRender.script[preRender.script.length - 1].lineId];
    expect(first.start).toBe(0);
    expect(first.end).toBeGreaterThan(0);
    expect(last.end).toBeCloseTo(preRender.audio.durationSec, 1);
  });

  it('toggles question flags cleanly and builds concrete win statement', () => {
    let s = createL1Session(L1_FIXTURE_P1, { mode: 'training' });
    s = toggleFlag(s, 'fp1_q03');
    expect(s.flaggedQids).toEqual(['fp1_q03']);
    s = toggleFlag(s, 'fp1_q03');
    expect(s.flaggedQids).toEqual([]);

    s = startListeningPhase(s).state;
    s = setAnswer(s, 'fp1_q02', '48');
    s = submitAndGrade(s).state;
    const win = buildL1WinStatement(s);
    expect(win).toContain('Bắt được');
  });

  it('extracts inline A/B/C options from MCQ prompts cleanly', () => {
    const group = L1_FIXTURE_P1.questionGroups[1];
    const q9 = group.questions[1];
    const extracted = extractQuestionOptions(q9, group);
    expect(extracted.stem).toContain('changing-room lockers');
    expect(extracted.options).toHaveLength(3);
    expect(extracted.options[2]).toEqual({
      key: 'C',
      text: 'Members tap their membership wristband',
    });
  });

  it('supports standalone single mcq_multi question selection and scoring', () => {
    const ep: ListeningEpisode = {
      ...L1_FIXTURE_P1,
      id: 'lep:test_standalone_multi',
      questionGroups: [
        {
          groupId: 'g_single_multi',
          type: 'mcq_multi',
          instructions: 'Choose TWO letters, A–D.',
          previewSec: 15,
          options: [
            { key: 'A', text: 'Alpha' },
            { key: 'B', text: 'Beta' },
            { key: 'C', text: 'Gamma' },
            { key: 'D', text: 'Delta' },
          ],
          questions: [
            {
              qid: 'q_multi_1',
              number: 1,
              prompt: 'Which TWO options apply?',
              answer: { accepted: ['A', 'D'], keys: ['A', 'D'] },
              evidence: { lineId: 'l1', start: 0, end: 6 },
              traps: [],
            },
          ],
        },
      ],
    };

    let s = startListeningPhase(createL1Session(ep, { mode: 'training' })).state;
    s = toggleMcqMultiChoice(s, 'g_single_multi', 'q_multi_1', 'D');
    s = toggleMcqMultiChoice(s, 'g_single_multi', 'q_multi_1', 'A');
    const graded = submitAndGrade(s).state;
    expect(graded.correctCount).toBe(1);
    expect(graded.results[0].correct).toBe(true);
  });

  it('validates r-data-listening index.json contract entry schema', () => {
    const sample = {
      id: 'lep:p1_001',
      file: 'data/listening/episodes/p1_001.json',
      part: 1,
      reserved: false,
      title: 'Library Card Application',
      contextEn: 'A student calls the city library.',
      difficulty: 3,
      accents: ['uk', 'au'],
      channel: 'phone',
      audioPath: 'audio/listening/p1_001.mp3',
      durationSec: 195,
      questionCount: 10,
      questionTypes: ['form_completion', 'mcq_single'],
      hasMap: false,
      trapCount: 6,
    };
    const parsed = ListeningIndexEntrySchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });

  it('evaluates the 6-question Listening Placement across Parts 1–4 accurately', () => {
    expect(LISTENING_PLACEMENT_QUESTIONS).toHaveLength(6);

    const allWrong = evaluateListeningPlacement({});
    expect(allWrong.correct).toBe(0);
    expect(allWrong.estimatedBand).toBe(5.0);

    const allRight = evaluateListeningPlacement({
      'lpl-q1': 'June 15th',
      'lpl-q2': 'aprons',
      'lpl-q3': 'B',
      'lpl-q4': 'B',
      'lpl-q5': 'B',
      'lpl-q6': 'crystals',
    });
    expect(allRight.correct).toBe(6);
    expect(allRight.estimatedBand).toBe(8.5);
    expect(allRight.byPart[1]).toEqual({ correct: 2, total: 2 });
    expect(allRight.byPart[4]).toEqual({ correct: 1, total: 1 });

    // Missing plural -s on Q2 fails strictly per IELTS rules
    const missingPlural = evaluateListeningPlacement({
      'lpl-q1': '15 June',
      'lpl-q2': 'apron',
      'lpl-q3': 'B',
      'lpl-q4': 'B',
      'lpl-q5': 'B',
      'lpl-q6': 'crystals',
    });
    expect(missingPlural.correct).toBe(5);
    expect(missingPlural.itemResults.find((r) => r.qid === 'lpl-q2')?.correct).toBe(false);
  });

  describe('T2-B · L1-01, L1-05, L1-08..L1-15, L1-21, B6 producer & saveProgress', () => {
    it('L1-01: loadListeningCatalog lọc theo file MP3 tồn tại thật (HEAD 200 audio/mpeg, bỏ 404 và text/html)', async () => {
      const fakeIndex = [
        {
          id: 'lep:p1_001',
          file: 'data/listening/episodes/p1_001.json',
          part: 1,
          reserved: false,
          title: 'Có audio thật',
          audioPath: 'audio/listening/p1_001.mp3',
        },
        {
          id: 'lep:p1_002',
          file: 'data/listening/episodes/p1_002.json',
          part: 1,
          reserved: false,
          title: 'Thiếu 404',
          audioPath: 'audio/listening/p1_002.mp3',
        },
        {
          id: 'lep:p1_003',
          file: 'data/listening/episodes/p1_003.json',
          part: 1,
          reserved: false,
          title: 'SPA fallback text/html',
          audioPath: 'audio/listening/p1_003.mp3',
        },
      ];
      const fetchImpl = (async (url: RequestInfo | URL, init?: RequestInit) => {
        const s = String(url);
        if (init?.method === 'HEAD') {
          if (s.includes('p1_001.mp3')) {
            return { ok: true, headers: { get: () => 'audio/mpeg' } } as unknown as Response;
          }
          if (s.includes('p1_003.mp3')) {
            return { ok: true, headers: { get: () => 'text/html; charset=utf-8' } } as unknown as Response;
          }
          return { ok: false, headers: { get: () => '' } } as unknown as Response;
        }
        return { ok: true, json: async () => fakeIndex } as unknown as Response;
      }) as typeof fetch;

      const items = await loadListeningCatalog({ fetchImpl, baseUrl: '/', bypassCache: true });
      expect(items.map((x) => x.id)).toEqual(['lep:p1_001']);
    });

    it('L1-11: loadListeningEpisode ném lỗi khi không tải được, không rơi sang fixture khác', async () => {
      const fetchImpl = (async () => ({ ok: false, status: 404 }) as unknown as Response) as typeof fetch;
      await expect(
        loadListeningEpisode(
          {
            id: 'lep:p1_999',
            part: 1,
            reserved: false,
            title: 'Missing',
            contextEn: '',
            difficulty: 3,
            accents: ['uk'],
            channel: 'normal',
            durationSec: 180,
            questionCount: 10,
            questionTypes: [],
            hasMap: false,
            trapCount: 0,
            file: 'data/listening/episodes/p1_999.json',
          },
          { fetchImpl, baseUrl: '/', bypassCache: true },
        ),
      ).rejects.toThrow();
    });

    it('L1-01/SR-89/SR-22: phiên mô phỏng hoặc thiếu audio phát ra 0 bandEvidence và 0 thẻ SRS/userItems', () => {
      let exam = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'exam' })).state;
      exam = setAnswer(exam, 'fp1_q01', 'Bramwell');
      exam = setAnswer(exam, 'fp1_q02', '84'); // trap
      exam = submitAndGrade(exam).state;

      const simPayload = buildL1SessionSavePayload(exam, 500_000, { simulatedMode: true });
      expect(simPayload.bandEvidence).toBeUndefined();
      expect(simPayload.updatedCards).toEqual([]);
      expect(buildL1UserItems(exam, { simulatedMode: true })).toEqual([]);

      const missingPayload = buildL1SessionSavePayload(exam, 500_000, { audioMissing: true });
      expect(missingPayload.bandEvidence).toBeUndefined();
      expect(missingPayload.updatedCards).toEqual([]);
    });

    it('L1-08: createL1RetrySession chỉ giữ câu sai, 0 XP kể cả khi gắn nhãn bẫy, 0 band, có retryClipMap', () => {
      let s = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'exam' })).state;
      s = setAnswer(s, 'fp1_q01', 'Bramwell');
      s = setAnswer(s, 'fp1_q02', '84'); // sai -> trap
      s = setAnswer(s, 'fp1_q03', 'off-peak');
      s = setAnswer(s, 'fp1_q04', '13 March'); // sai -> trap
      s = setAnswer(s, 'fp1_q05', 'pilates');
      s = setAnswer(s, 'fp1_q06', '38');
      s = setAnswer(s, 'fp1_q07', 'towels');
      s = setAnswer(s, 'fp1_q08', 'B');
      s = setAnswer(s, 'fp1_q09', 'C');
      s = setAnswer(s, 'fp1_q10', 'C');
      const graded = submitAndGrade(s).state;
      expect(graded.correctCount).toBe(8);

      let retry = createL1RetrySession(graded);
      expect(retry.isRetry).toBe(true);
      expect(retry.phase).toBe('listening');
      expect(retry.totalQuestions).toBe(2);
      expect(retry.config.countsForBand).toBe(false);
      expect(retry.retryClipMap['fp1_q02']).toBeDefined();
      expect(retry.retryClipMap['fp1_q04']).toBeDefined();

      // Trả lời đúng 1 câu, sai 1 câu rồi gắn nhãn bẫy đúng -> vẫn 0 XP và 0 band
      retry = setAnswer(retry, 'fp1_q02', '48');
      retry = setAnswer(retry, 'fp1_q04', '13 March');
      let retryGraded = submitAndGrade(retry).state;
      expect(retryGraded.totalXp).toBe(0);
      retryGraded = submitTrapLabel(retryGraded, 'fp1_q04', 'self_correction').state;
      expect(retryGraded.totalXp).toBe(0);

      const retryPayload = buildL1SessionSavePayload(retryGraded, 800_000);
      expect(retryPayload.attempt.xp).toBe(0);
      expect(retryPayload.bandEvidence).toBeUndefined();
    });

    it('L1-09: Exam làm lại cùng episode (alreadyDoneExam=true) không phát bandEvidence', () => {
      let s = startListeningPhase(
        createL1Session(L1_FIXTURE_P1, { mode: 'exam', alreadyDoneExam: true }),
      ).state;
      s = setAnswer(s, 'fp1_q01', 'Bramwell');
      s = submitAndGrade(s).state;
      expect(s.config.countsForBand).toBe(false);
      const payload = buildL1SessionSavePayload(s, 900_000);
      expect(payload.bandEvidence).toBeUndefined();
    });

    it('L1-13: Lv 7–8 khoá tua (allowSeek=false), Lv 1–6 cho tua (allowSeek=true)', () => {
      expect(getL1DifficultyConfig('training', 6).allowSeek).toBe(true);
      expect(getL1DifficultyConfig('training', 7).allowSeek).toBe(false);
      expect(getL1DifficultyConfig('exam', 2).allowSeek).toBe(false);
    });

    it('L1-15: buildL1WinStatement hiển thị nhãn bẫy tiếng Việt thay vì key thô', () => {
      let s = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training' })).state;
      s = setAnswer(s, 'fp1_q02', '48');
      s = submitAndGrade(s).state;
      const win = buildL1WinStatement(s);
      expect(win).toContain('Tự sửa lời');
    });

    it('B6/L1-21: buildL1UserItems tạo ltrap:* có audioClip chính xác, ngăn cách | và không tạo cho no_answer', () => {
      let s = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training' })).state;
      s = setAnswer(s, 'fp1_q02', '84'); // trap:self_correction
      s = setAnswer(s, 'fp1_q04', ''); // no_answer -> không tạo ltrap
      s = submitAndGrade(s).state;

      const drafts = buildL1UserItems(s);
      const q2 = drafts.find((d) => d.item.id === 'ltrap:fixture_p1_sports_centre_fp1_q02');
      const q4 = drafts.find((d) => d.item.id === 'ltrap:fixture_p1_sports_centre_fp1_q04');
      expect(q2).toBeDefined();
      expect(q2?.cardFace).toBe('ltrap_replay');
      expect(q2?.item.audioClip?.src).toBe(L1_FIXTURE_P1.audio.path);
      expect(q2?.item.audioClip!.end).toBeGreaterThan(q2?.item.audioClip!.start ?? 0);
      expect(q4).toBeUndefined();

      const progress = buildL1ProgressPayload(s, 777_000);
      expect(progress.attempt.gameId).toBe('l1');
      expect(progress.attempt.items.length).toBe(10);
    });

    it('L1-05: chấm tiền £38 khớp với đáp án "38" nhờ promptUnit từ template', () => {
      let s = startListeningPhase(createL1Session(L1_FIXTURE_P1, { mode: 'training' })).state;
      s = setAnswer(s, 'fp1_q06', '£38');
      const graded = submitAndGrade(s).state;
      const q6 = graded.results.find((r) => r.qid === 'fp1_q06');
      expect(q6?.correct).toBe(true);
    });
  });
});
