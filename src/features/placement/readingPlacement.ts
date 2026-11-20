import type { Span } from '../../core/content/schemas';
import { roundIeltsBand } from '../../core/band/tables';
import { scoreMCQ, scoreTFNG } from '../../core/scoring/readingAnswer';

export type ReadingPlacementSkill = 'tfng' | 'paraphrase' | 'inference';

export interface ReadingPlacementParagraph {
  label: string;
  text: string;
}

export interface ReadingPlacementMiniPassage {
  id: string;
  title: string;
  subtitle: string;
  paragraphs: readonly ReadingPlacementParagraph[];
  wordCount: number;
}

export interface ReadingPlacementQuestion {
  id: string;
  number: number;
  skill: ReadingPlacementSkill;
  bandTier: 6.0 | 6.5 | 7.0 | 7.5 | 8.5;
  prompt: string;
  choices: ReadonlyArray<{ key: string; text: string }>;
  correctKey: string;
  evidence: Span;
  explanationVi: string;
}

function makePlacementSpan(
  paragraphs: readonly ReadingPlacementParagraph[],
  label: string,
  quote: string,
): Span {
  const para = paragraphs.find((p) => p.label === label);
  if (!para) {
    throw new Error(`Reading placement paragraph "${label}" not found`);
  }
  const start = para.text.indexOf(quote);
  if (start === -1) {
    throw new Error(`Reading placement quote not found in paragraph ${label}: "${quote}"`);
  }
  return {
    paragraph: label,
    start,
    end: start + quote.length,
    quote,
  };
}

const MINI_PARAGRAPHS: readonly ReadingPlacementParagraph[] = [
  {
    label: 'A',
    text: 'Discussions of insect pollination typically revolve around honeybees and bumblebees foraging under daylight skies, yet nocturnal moths perform a substantial and frequently overlooked share of plant reproduction. Field surveys across temperate meadows show that moths visit a wider variety of wildflowers than previously assumed, carrying pollen on their dense body scales across considerable distances after dusk. Because many nocturnal insects fly further between feeding patches than diurnal bees, they help sustain genetic exchange between isolated plant populations.',
  },
  {
    label: 'B',
    text: 'Rapid expansion of artificial street lighting has begun to disrupt these night-time networks. Controlled meadow experiments comparing unlit plots with plots illuminated by bright overhead lamps found that nocturnal visits to flowering plants fell by nearly half under constant light. Crucially, the disruption did not vanish at dawn: daytime bee activity alone failed to compensate fully for lost nocturnal pollination, resulting in noticeably fewer seeds produced by illuminated plants at the end of the season.',
  },
  {
    label: 'C',
    text: 'While switching from older sodium lamps to modern white LEDs lowers municipal electricity consumption, ecologists caution that cooler, blue-rich LED wavelengths attract and disorient nocturnal insects even more strongly than warmer light sources. Encouragingly, simple design adjustments—such as shielding fixtures so beams point strictly downward, dimming lamps during low-traffic hours, and selecting amber-tinted spectra—can preserve pedestrian safety without dismantling surrounding ecological webs.',
  },
];

const MINI_WORD_COUNT = MINI_PARAGRAPHS.map((p) => p.text)
  .join(' ')
  .trim()
  .split(/\s+/)
  .filter(Boolean).length;

export const READING_PLACEMENT_PASSAGE: ReadingPlacementMiniPassage = {
  id: 'rp:placement-mini-nocturnal-pollinators',
  title: 'Night-Time Pollinators and Urban Lighting',
  subtitle: 'How artificial light alters overlooked ecological partnerships after dusk',
  paragraphs: MINI_PARAGRAPHS,
  wordCount: MINI_WORD_COUNT,
};

export const READING_PLACEMENT_QUESTIONS: readonly ReadingPlacementQuestion[] = [
  {
    id: 'rpl-q1',
    number: 1,
    skill: 'tfng',
    bandTier: 6.0,
    prompt:
      'Nocturnal moths help connect separated plant populations partly because they often travel longer distances between feeding areas than daytime bees.',
    choices: [
      { key: 'TRUE', text: 'TRUE' },
      { key: 'FALSE', text: 'FALSE' },
      { key: 'NOT GIVEN', text: 'NOT GIVEN' },
    ],
    correctKey: 'TRUE',
    evidence: makePlacementSpan(
      MINI_PARAGRAPHS,
      'A',
      'Because many nocturnal insects fly further between feeding patches than diurnal bees, they help sustain genetic exchange between isolated plant populations.',
    ),
    explanationVi:
      'Đoạn A nêu rõ côn trùng về đêm bay xa hơn ong ban ngày (diurnal bees), giúp duy trì trao đổi gen giữa các quần thể thực vật bị tách biệt.',
  },
  {
    id: 'rpl-q2',
    number: 2,
    skill: 'tfng',
    bandTier: 6.5,
    prompt:
      'In the meadow experiments, daytime bees completely made up for the reduction in night-time pollination under street lamps.',
    choices: [
      { key: 'TRUE', text: 'TRUE' },
      { key: 'FALSE', text: 'FALSE' },
      { key: 'NOT GIVEN', text: 'NOT GIVEN' },
    ],
    correctKey: 'FALSE',
    evidence: makePlacementSpan(
      MINI_PARAGRAPHS,
      'B',
      'daytime bee activity alone failed to compensate fully for lost nocturnal pollination, resulting in noticeably fewer seeds produced by illuminated plants at the end of the season.',
    ),
    explanationVi:
      'Đoạn B nói rõ ong ban ngày "failed to compensate fully", mâu thuẫn trực tiếp với "completely made up for" → FALSE.',
  },
  {
    id: 'rpl-q3',
    number: 3,
    skill: 'tfng',
    bandTier: 7.0,
    prompt:
      'Amber-tinted street lamps are significantly more expensive for local councils to manufacture than blue-rich white LEDs.',
    choices: [
      { key: 'TRUE', text: 'TRUE' },
      { key: 'FALSE', text: 'FALSE' },
      { key: 'NOT GIVEN', text: 'NOT GIVEN' },
    ],
    correctKey: 'NOT GIVEN',
    evidence: makePlacementSpan(
      MINI_PARAGRAPHS,
      'C',
      'Encouragingly, simple design adjustments—such as shielding fixtures so beams point strictly downward, dimming lamps during low-traffic hours, and selecting amber-tinted spectra—can preserve pedestrian safety without dismantling surrounding ecological webs.',
    ),
    explanationVi:
      'Đoạn C chỉ đề cập việc chọn ánh sáng ngả hổ phách (amber-tinted spectra) như giải pháp thiết kế, hoàn toàn không so sánh chi phí sản xuất → NOT GIVEN.',
  },
  {
    id: 'rpl-q4',
    number: 4,
    skill: 'paraphrase',
    bandTier: 7.0,
    prompt:
      'Which phrase in Paragraph A is closest in meaning to "active during daylight hours"?',
    choices: [
      { key: 'A', text: 'temperate meadows' },
      { key: 'B', text: 'diurnal' },
      { key: 'C', text: 'isolated plant populations' },
      { key: 'D', text: 'dense body scales' },
    ],
    correctKey: 'B',
    evidence: makePlacementSpan(
      MINI_PARAGRAPHS,
      'A',
      'Because many nocturnal insects fly further between feeding patches than diurnal bees',
    ),
    explanationVi:
      '"Diurnal" (hoạt động ban ngày) là từ học thuật tương phản trực tiếp với "nocturnal" (hoạt động ban đêm).',
  },
  {
    id: 'rpl-q5',
    number: 5,
    skill: 'paraphrase',
    bandTier: 7.5,
    prompt:
      'In Paragraph C, the writer mentions "shielding fixtures so beams point strictly downward". Which option best paraphrases this measure?',
    choices: [
      { key: 'A', text: 'Turning off every municipal lamp immediately after sunset.' },
      { key: 'B', text: 'Installing taller lampposts to spread light across wider parks.' },
      { key: 'C', text: 'Fitting covers that confine illumination to the ground below.' },
      { key: 'D', text: 'Replacing electric lamps with reflective road signs.' },
    ],
    correctKey: 'C',
    evidence: makePlacementSpan(
      MINI_PARAGRAPHS,
      'C',
      'shielding fixtures so beams point strictly downward',
    ),
    explanationVi:
      '"Shielding fixtures" ↔ "fitting covers", và "beams point strictly downward" ↔ "confine illumination to the ground below".',
  },
  {
    id: 'rpl-q6',
    number: 6,
    skill: 'inference',
    bandTier: 8.5,
    prompt:
      'What can be inferred from Paragraph C about the transition from older sodium lamps to standard white LEDs?',
    choices: [
      { key: 'A', text: 'A policy that achieves energy-efficiency goals can still create unintended ecological harm.' },
      { key: 'B', text: 'Cities should revert exclusively to older sodium lamps to protect all urban wildlife.' },
      { key: 'C', text: 'Pedestrian safety inevitably declines whenever street lights are dimmed overnight.' },
      { key: 'D', text: 'White LEDs fail to reduce municipal power bills in dense urban neighbourhoods.' },
    ],
    correctKey: 'A',
    evidence: makePlacementSpan(
      MINI_PARAGRAPHS,
      'C',
      'While switching from older sodium lamps to modern white LEDs lowers municipal electricity consumption, ecologists caution that cooler, blue-rich LED wavelengths attract and disorient nocturnal insects even more strongly than warmer light sources.',
    ),
    explanationVi:
      'Đoạn C cho thấy chuyển sang đèn LED trắng giúp tiết kiệm điện nhưng lại gây rối loạn mạnh hơn cho côn trùng đêm — một giải pháp tiết kiệm năng lượng vẫn có thể kéo theo tác hại sinh thái ngoài dự kiến.',
  },
];

export interface ReadingPlacementSkillBreakdown {
  correct: number;
  total: number;
}

export interface ReadingPlacementEvaluation {
  correct: number;
  total: number;
  accuracy: number;
  estimatedBand: number;
  recommendedLevel: number;
  bySkill: Record<ReadingPlacementSkill, ReadingPlacementSkillBreakdown>;
  itemResults: Array<{
    qid: string;
    skill: ReadingPlacementSkill;
    correct: boolean;
    userAnswer: string;
    correctKey: string;
  }>;
  summaryVi: string;
}

/**
 * Grade the 6-question Reading Placement test and estimate initial IELTS Reading band (5.0..8.5).
 */
export function evaluateReadingPlacement(
  answers: Readonly<Record<string, string>>,
  questions: readonly ReadingPlacementQuestion[] = READING_PLACEMENT_QUESTIONS,
): ReadingPlacementEvaluation {
  const bySkill: Record<ReadingPlacementSkill, ReadingPlacementSkillBreakdown> = {
    tfng: { correct: 0, total: 0 },
    paraphrase: { correct: 0, total: 0 },
    inference: { correct: 0, total: 0 },
  };

  let correct = 0;
  let weightedEarned = 0;
  let weightedTotal = 0;
  const itemResults: ReadingPlacementEvaluation['itemResults'] = [];

  for (const q of questions) {
    const rawUser = answers[q.id] ?? '';
    const res =
      q.skill === 'tfng'
        ? scoreTFNG(rawUser, q.correctKey)
        : scoreMCQ(rawUser, q.correctKey);

    const weight = q.bandTier - 5.0; // 1.0 for 6.0 up to 3.5 for 8.5
    weightedTotal += weight;
    bySkill[q.skill].total += 1;

    if (res.correct) {
      correct += 1;
      weightedEarned += weight;
      bySkill[q.skill].correct += 1;
    }

    itemResults.push({
      qid: q.id,
      skill: q.skill,
      correct: res.correct,
      userAnswer: rawUser.trim(),
      correctKey: q.correctKey,
    });
  }

  const total = questions.length;
  const accuracy = total > 0 ? correct / total : 0;
  const weightedRatio = weightedTotal > 0 ? weightedEarned / weightedTotal : 0;

  // Blend raw accuracy (40%) and tier-weighted score (60%) into IELTS band 5.0 .. 8.5
  const blended = accuracy * 0.4 + weightedRatio * 0.6;
  const rawBand = 5.0 + blended * 3.5;
  const estimatedBand = Math.min(8.5, Math.max(5.0, roundIeltsBand(rawBand)));

  const recommendedLevel =
    estimatedBand >= 8.0
      ? 5
      : estimatedBand >= 7.5
        ? 4
        : estimatedBand >= 7.0
          ? 3
          : estimatedBand >= 6.5
            ? 2
            : 1;

  let summaryVi: string;
  if (estimatedBand >= 7.5) {
    summaryVi =
      'Nền Reading rất vững (đọc hiểu tốt cả paraphrase và suy luận) — sẵn sàng luyện tốc độ ≤ 60 giây/câu và bẫy Passage 3 trong R1 TFNG Judge.';
  } else if (bySkill.tfng.correct < bySkill.tfng.total) {
    summaryVi =
      'Cần ưu tiên phân biệt FALSE vs NOT GIVEN và tập thói quen bôi câu bằng chứng trước khi kết luận ở R1 TFNG Judge.';
  } else {
    summaryVi =
      'Khả năng định vị TFNG khá ổn — nên kết hợp Paraphrase Radar và R1 Passage Mode để nâng tốc độ lên 7.5–8.0+.';
  }

  return {
    correct,
    total,
    accuracy,
    estimatedBand,
    recommendedLevel,
    bySkill,
    itemResults,
    summaryVi,
  };
}
