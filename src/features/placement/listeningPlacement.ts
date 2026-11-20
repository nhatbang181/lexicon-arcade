import { roundIeltsBand } from '../../core/band/tables';
import type { ListeningTrap, WordLimit } from '../../core/content/schemas';
import { scoreListeningAnswer } from '../../core/scoring/listeningAnswer';
import { scoreMCQ } from '../../core/scoring/readingAnswer';

export type ListeningPlacementPart = 1 | 2 | 3 | 4;
export type ListeningPlacementKind = 'completion' | 'mcq_single' | 'map_labelling';

export interface ListeningPlacementQuestion {
  id: string;
  number: number;
  part: ListeningPlacementPart;
  kind: ListeningPlacementKind;
  bandTier: 6.0 | 6.5 | 7.0 | 7.5 | 8.5;
  contextEn: string;
  /** Short realistic IELTS audio transcript snippet (also usable as preview/review fallback when MP3 is absent) */
  transcriptSnippet: string;
  /** Optional relative audio clip path under public/ */
  audioPath?: string;
  prompt: string;
  wordLimit?: WordLimit;
  choices?: ReadonlyArray<{ key: string; text: string }>;
  acceptedAnswers?: readonly string[];
  correctKey?: string;
  trapType: ListeningTrap;
  explanationVi: string;
}

export const LISTENING_PLACEMENT_QUESTIONS: readonly ListeningPlacementQuestion[] = [
  {
    id: 'lpl-q1',
    number: 1,
    part: 1,
    kind: 'completion',
    bandTier: 6.0,
    contextEn: 'Part 1 · Library card registration telephone call',
    transcriptSnippet:
      'Caller: "My postcode is... wait, I always mix up the last two digits — I moved from SW4 21B last month, so my current flat is SW4 12B. And let us start the pass on 14 June, oh no, that is a Sunday — make it 15 June instead."',
    audioPath: 'audio/listening/placement_q1.mp3',
    prompt: 'Write ONE WORD AND/OR A NUMBER. Library pass start date: ________',
    wordLimit: { words: 1, allowNumber: true },
    acceptedAnswers: ['15 June', '15th June', 'June 15', 'June 15th'],
    trapType: 'self_correction',
    explanationVi:
      'Bẫy self-correction quen thuộc ở Part 1: người nói nhắc 14 June trước rồi tự sửa sang 15 June vì ngày 14 là Chủ Nhật.',
  },
  {
    id: 'lpl-q2',
    number: 2,
    part: 1,
    kind: 'completion',
    bandTier: 6.5,
    contextEn: 'Part 1 · Community workshop booking enquiry',
    transcriptSnippet:
      'Coordinator: "The pottery fee covers clay and kiln firing, and clean aprons are supplied in the studio every session, so you only need to bring a notebook."',
    audioPath: 'audio/listening/placement_q2.mp3',
    prompt: 'Write ONE WORD ONLY. Free equipment supplied every session: ________',
    wordLimit: { words: 1, allowNumber: false },
    acceptedAnswers: ['aprons'],
    trapType: 'plural_singular',
    explanationVi:
      'Bẫy âm cuối số nhiều (-s): trong câu nói dùng "clean aprons are supplied" nên thiếu "-s" sẽ bị chấm sai theo luật IELTS.',
  },
  {
    id: 'lpl-q3',
    number: 3,
    part: 2,
    kind: 'mcq_single',
    bandTier: 7.0,
    contextEn: 'Part 2 · Maritime Museum visitor orientation talk',
    transcriptSnippet:
      'Guide: "The harbour boat trip used to leave from Pier One, and many brochures still list a ten-pound surcharge. This season, however, admission includes the ferry ride, though visitors must collect a timed boarding pass at the courtyard desk."',
    audioPath: 'audio/listening/placement_q3.mp3',
    prompt: 'What must visitors do to take the harbour ferry ride this season?',
    choices: [
      { key: 'A', text: 'Pay a £10 surcharge at Pier One' },
      { key: 'B', text: 'Pick up a timed boarding pass at the courtyard desk' },
      { key: 'C', text: 'Reserve a seat at least one week online' },
    ],
    correctKey: 'B',
    trapType: 'option_mentioned_rejected',
    explanationVi:
      'Phí £10 ở Pier One là thông tin cũ trên tờ rơi; mùa này vé tàu đã bao gồm trong vé vào cửa nhưng cần lấy thẻ lên tàu theo khung giờ (B).',
  },
  {
    id: 'lpl-q4',
    number: 4,
    part: 2,
    kind: 'map_labelling',
    bandTier: 7.0,
    contextEn: 'Part 2 · Campus Sustainability Fair map directions',
    transcriptSnippet:
      'Organiser: "From the Main Gate, walk straight north past the clock tower. Do not turn left into the Bike Shed — instead, take the path east towards the pond; the Seed Swap tent is the second pavilion on your right, directly opposite the greenhouse."',
    audioPath: 'audio/listening/placement_q4.mp3',
    prompt: 'Which description matches the Seed Swap tent location on the map?',
    choices: [
      { key: 'A', text: 'West of the clock tower, next to the Bike Shed' },
      { key: 'B', text: 'East of the clock tower, directly opposite the greenhouse' },
      { key: 'C', text: 'Immediately inside the Main Gate on the south border' },
      { key: 'D', text: 'North of the pond, behind the amphitheatre' },
    ],
    correctKey: 'B',
    trapType: 'map_direction',
    explanationVi:
      'Bẫy rẽ nhầm ("Do not turn left into the Bike Shed"): đi thẳng qua tháp đồng hồ rồi rẽ đông về phía hồ, đối diện nhà kính (B).',
  },
  {
    id: 'lpl-q5',
    number: 5,
    part: 3,
    kind: 'mcq_single',
    bandTier: 7.5,
    contextEn: 'Part 3 · Two postgraduate students discussing their urban noise study',
    transcriptSnippet:
      'Maya: "I initially thought our sample of forty streets was too small to show any pattern." Liam: "Actually, the statistics held up fine. What worries me is that half the microphones were placed near bus stops, skewing the peak decibel readings." Maya: "You are right — we should flag that placement bias before submitting."',
    audioPath: 'audio/listening/placement_q5.mp3',
    prompt: 'What limitation of the study do BOTH students finally agree on?',
    choices: [
      { key: 'A', text: 'The sample size of forty streets was statistically insufficient.' },
      { key: 'B', text: 'Microphone locations near bus stops distorted peak noise readings.' },
      { key: 'C', text: 'The recording devices ran out of battery overnight.' },
    ],
    correctKey: 'B',
    trapType: 'negation_shift',
    explanationVi:
      'Bẫy đồng thuận Part 3: Maya ban đầu lo cỡ mẫu nhỏ (A) nhưng Liam bác bỏ và nêu vấn đề đặt micro gần trạm xe buýt — Maya đồng ý ("You are right") → B.',
  },
  {
    id: 'lpl-q6',
    number: 6,
    part: 4,
    kind: 'completion',
    bandTier: 8.5,
    contextEn: 'Part 4 · Academic lecture on ancient Roman maritime concrete',
    transcriptSnippet:
      'Lecturer: "Unlike modern Portland cement, which degrades rapidly when exposed to saltwater, volcanic ash mixtures reacted slowly with infiltrating seawater to grow interlocking crystals that actually reinforced microscopic fractures over centuries."',
    audioPath: 'audio/listening/placement_q6.mp3',
    prompt:
      'Write ONE WORD ONLY. Seawater reacted with volcanic ash to form interlocking ________ that strengthened tiny cracks.',
    wordLimit: { words: 1, allowNumber: false },
    acceptedAnswers: ['crystals'],
    trapType: 'synonym_paraphrase',
    explanationVi:
      'Bẫy paraphrase Part 4: "strengthened tiny cracks" ↔ "reinforced microscopic fractures", từ cần điền nguyên văn số nhiều là "crystals".',
  },
];

export interface ListeningPlacementPartBreakdown {
  correct: number;
  total: number;
}

export interface ListeningPlacementEvaluation {
  correct: number;
  total: number;
  accuracy: number;
  estimatedBand: number;
  recommendedLevel: number;
  byPart: Record<ListeningPlacementPart, ListeningPlacementPartBreakdown>;
  itemResults: Array<{
    qid: string;
    part: ListeningPlacementPart;
    correct: boolean;
    userAnswer: string;
    expectedDisplay: string;
    trapType: ListeningTrap;
  }>;
  summaryVi: string;
}

/**
 * Grade the 6-question Listening Placement (Parts 1–4) and estimate initial IELTS Listening band (5.0..8.5).
 */
export function evaluateListeningPlacement(
  answers: Readonly<Record<string, string>>,
  questions: readonly ListeningPlacementQuestion[] = LISTENING_PLACEMENT_QUESTIONS,
): ListeningPlacementEvaluation {
  const byPart: Record<ListeningPlacementPart, ListeningPlacementPartBreakdown> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
    4: { correct: 0, total: 0 },
  };

  let correct = 0;
  let weightedEarned = 0;
  let weightedTotal = 0;
  const itemResults: ListeningPlacementEvaluation['itemResults'] = [];

  for (const q of questions) {
    const rawUser = answers[q.id] ?? '';
    let isCorrect = false;
    let expectedDisplay = '';

    if (q.kind === 'completion') {
      const accepted = q.acceptedAnswers ?? [];
      expectedDisplay = accepted[0] ?? '';
      isCorrect = scoreListeningAnswer(rawUser, accepted, { wordLimit: q.wordLimit }).correct;
    } else {
      const key = q.correctKey ?? '';
      expectedDisplay = key;
      isCorrect = scoreMCQ(rawUser, key).correct;
    }

    const weight = q.bandTier - 5.0; // 1.0 for 6.0 up to 3.5 for 8.5
    weightedTotal += weight;
    byPart[q.part].total += 1;

    if (isCorrect) {
      correct += 1;
      weightedEarned += weight;
      byPart[q.part].correct += 1;
    }

    itemResults.push({
      qid: q.id,
      part: q.part,
      correct: isCorrect,
      userAnswer: rawUser.trim(),
      expectedDisplay,
      trapType: q.trapType,
    });
  }

  const total = questions.length;
  const accuracy = total > 0 ? correct / total : 0;
  const weightedRatio = weightedTotal > 0 ? weightedEarned / weightedTotal : 0;

  // Blend raw accuracy (40%) and tier-weighted score (60%) into IELTS Listening band 5.0..8.5
  const blended = accuracy * 0.4 + weightedRatio * 0.6;
  const rawBand = 5.0 + blended * 3.5;
  const estimatedBand = Math.min(8.5, Math.max(5.0, roundIeltsBand(rawBand)));

  const recommendedLevel =
    estimatedBand >= 8.0
      ? 8
      : estimatedBand >= 7.5
        ? 6
        : estimatedBand >= 7.0
          ? 5
          : estimatedBand >= 6.5
            ? 3
            : 2;

  let summaryVi: string;
  if (estimatedBand >= 7.5) {
    summaryVi =
      'Nền Listening rất tốt, bắt kịp cả paraphrase Part 4 và bẫy đồng thuận Part 3 — nên vào thẳng L1 Trap Detector cấp 6–8 và Exam mode để hướng tới 8.5.';
  } else if (byPart[1].correct < byPart[1].total) {
    summaryVi =
      'Cần siết chặt chi tiết Part 1 (tự sửa lời, số/ngày, đuôi số nhiều -s) trước khi tăng tốc lên Part 3–4 — bắt đầu L1 Trap Detector từ cấp 2–3.';
  } else {
    summaryVi =
      'Bạn xử lý khá chắc Part 1–2 — nên luyện L1 Trap Detector cấp 4–5 (tập trung bẫy bản đồ, loại trừ MCQ và paraphrase Part 3–4).';
  }

  return {
    correct,
    total,
    accuracy,
    estimatedBand,
    recommendedLevel,
    byPart,
    itemResults,
    summaryVi,
  };
}
