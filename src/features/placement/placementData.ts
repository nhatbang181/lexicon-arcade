import { loadContent, loadContentArray } from '../../core/content/loaders';
import {
  PlacementVocabSchema,
  VocabItemSchema,
  type PlacementVocab,
  type VocabItem,
} from '../../core/content/schemas';
import { createNewCard, type SRSCard } from '../../core/srs/fsrsAdapter';
import { V1_FIXTURE_VOCAB } from '../../test/fixtures/v1_fixtures';

export interface PlacementVocabQuestion {
  id: string;
  word: string;
  ipa: string;
  bandTier: 5.5 | 6.0 | 6.5 | 7.0 | 7.5 | 8.0 | 8.5;
  promptVi: string;
  contextEn: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationVi: string;
}

const BAND_TO_TIER: Record<1 | 2 | 3 | 4 | 5 | 6, PlacementVocabQuestion['bandTier']> = {
  1: 5.5,
  2: 6.0,
  3: 6.5,
  4: 7.0,
  5: 7.5,
  6: 8.5,
};

const BAND_QUOTAS: ReadonlyArray<readonly [1 | 2 | 3 | 4 | 5 | 6, number]> = [
  [1, 2],
  [2, 2],
  [3, 3],
  [4, 3],
  [5, 3],
  [6, 2],
];

function deterministicHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mapPlacementVocabItem(
  item: PlacementVocab['items'][number],
  vocabLookup?: ReadonlyMap<string, VocabItem>,
): PlacementVocabQuestion {
  const bandTier = BAND_TO_TIER[item.band];
  const matchedVocab = vocabLookup?.get(item.headword.trim().toLowerCase());

  const correctIndex = (deterministicHash(item.id) % 4) as 0 | 1 | 2 | 3;
  const rawChoices: string[] = [...item.foilsVi];
  rawChoices.splice(correctIndex, 0, item.checkMeaningVi);
  const choices: [string, string, string, string] = [
    rawChoices[0],
    rawChoices[1],
    rawChoices[2],
    rawChoices[3],
  ];

  const contextEn =
    matchedVocab?.examples[0]?.en ??
    `Academic IELTS vocabulary (Band ${bandTier.toFixed(1)}): "${item.headword}"`;

  const explanationVi = matchedVocab?.definitionEn
    ? `"${item.headword}" nghĩa là "${item.checkMeaningVi}" — ${matchedVocab.definitionEn}`
    : `"${item.headword}" có nghĩa học thuật là "${item.checkMeaningVi}".`;

  return {
    id: item.id,
    word: item.headword,
    ipa: matchedVocab?.ipa.uk ?? '',
    bandTier,
    promptVi: `Chọn nghĩa học thuật đúng nhất của từ "${item.headword}":`,
    contextEn,
    choices,
    correctIndex,
    explanationVi,
  };
}

/**
 * 15-item tiered Academic IELTS vocabulary placement test (Band 5.5 -> 8.5).
 * Original prompts & contexts; used directly or as fallback if placement_vocab.json is absent.
 */
export const BUILTIN_PLACEMENT_QUESTIONS: readonly PlacementVocabQuestion[] = [
  {
    id: 'pv-01',
    word: 'curriculum',
    ipa: '/kəˈrɪkjələm/',
    bandTier: 5.5,
    promptVi: 'Chọn nghĩa học thuật đúng nhất của từ "curriculum":',
    contextEn: 'Digital literacy has recently been added to the national curriculum.',
    choices: [
      'chương trình giảng dạy',
      'học bổng toàn phần',
      'bằng tốt nghiệp đại học',
      'kỳ thi đầu vào',
    ],
    correctIndex: 0,
    explanationVi: 'Curriculum chỉ toàn bộ chương trình các môn học trong trường hoặc khóa học.',
  },
  {
    id: 'pv-02',
    word: 'allocate',
    ipa: '/ˈæləkeɪt/',
    bandTier: 5.5,
    promptVi: 'Động từ "allocate" trong câu sau có nghĩa là gì?',
    contextEn: 'Local councils must allocate sufficient funding to public transit.',
    choices: [
      'thu hồi toàn bộ',
      'phân bổ (nguồn lực, ngân sách)',
      'cắt giảm đột ngột',
      'ước tính sơ bộ',
    ],
    correctIndex: 1,
    explanationVi: 'Allocate funding/resources = phân bổ nguồn lực cho một mục đích cụ thể.',
  },
  {
    id: 'pv-03',
    word: 'sustainable',
    ipa: '/səˈsteɪnəbl/',
    bandTier: 6.0,
    promptVi: 'Tính từ "sustainable" trong ngữ cảnh môi trường nghĩa là:',
    contextEn: 'Cities are investing in sustainable energy to reduce carbon emissions.',
    choices: [
      'tốn kém chi phí cao',
      'có tính tạm thời ngắn hạn',
      'bền vững, duy trì được lâu dài',
      'phụ thuộc vào nhiên liệu hoá thạch',
    ],
    correctIndex: 2,
    explanationVi: 'Sustainable mô tả giải pháp có thể duy trì lâu dài mà không làm cạn kiệt tài nguyên.',
  },
  {
    id: 'pv-04',
    word: 'accommodate',
    ipa: '/əˈkɒmədeɪt/',
    bandTier: 6.0,
    promptVi: 'Chọn nghĩa phù hợp nhất của "accommodate" trong câu:',
    contextEn: 'The expanded rail network can accommodate twice as many commuters.',
    choices: [
      'thay thế hoàn toàn',
      'hạn chế số lượng',
      'từ chối tiếp nhận',
      'đáp ứng, chứa được',
    ],
    correctIndex: 3,
    explanationVi: 'Accommodate = đáp ứng nhu cầu hoặc đủ sức chứa một lượng người/phương tiện.',
  },
  {
    id: 'pv-05',
    word: 'deteriorate',
    ipa: '/dɪˈtɪəriəreɪt/',
    bandTier: 6.5,
    promptVi: 'Động từ "deteriorate" đồng nghĩa gần nhất với:',
    contextEn: 'Air quality tends to deteriorate rapidly during dry winter months.',
    choices: [
      'trở nên tồi tệ, suy giảm chất lượng',
      'ổn định ở mức trung bình',
      'cải thiện đáng kể',
      'dao động không đều',
    ],
    correctIndex: 0,
    explanationVi: 'Deteriorate thường dùng cho chất lượng không khí, sức khoẻ hoặc cơ sở hạ tầng xuống cấp.',
  },
  {
    id: 'pv-06',
    word: 'disparity',
    ipa: '/dɪˈspærəti/',
    bandTier: 6.5,
    promptVi: 'Danh từ "disparity" thường xuất hiện trong IELTS Writing Task 2 với nghĩa:',
    contextEn: 'A widening income disparity between urban and rural regions remains a concern.',
    choices: [
      'sự hợp tác chặt chẽ',
      'sự chênh lệch, bất bình đẳng rõ rệt',
      'sự tương đồng về văn hoá',
      'sự ổn định kinh tế',
    ],
    correctIndex: 1,
    explanationVi: 'Income/regional disparity = khoảng cách chênh lệch rõ rệt giữa hai nhóm.',
  },
  {
    id: 'pv-07',
    word: 'mitigate',
    ipa: '/ˈmɪtɪɡeɪt/',
    bandTier: 7.0,
    promptVi: 'Động từ "mitigate" mang sắc thái học thuật nào?',
    contextEn: 'Coastal wetlands help mitigate the impact of seasonal storm surges.',
    choices: [
      'làm gia tăng mức độ nghiêm trọng',
      'phớt lờ hậu quả lâu dài',
      'giảm nhẹ tác động tiêu cực',
      'dự báo chính xác thời điểm',
    ],
    correctIndex: 2,
    explanationVi: 'Collocation chuẩn IELTS 7.0+: mitigate the impact / effects / risks.',
  },
  {
    id: 'pv-08',
    word: 'exacerbate',
    ipa: '/ɪɡˈzæsəbeɪt/',
    bandTier: 7.0,
    promptVi: 'Chọn nghĩa chính xác của "exacerbate":',
    contextEn: 'Unregulated urban sprawl can exacerbate traffic congestion.',
    choices: [
      'giải quyết triệt để một vấn đề',
      'trì hoãn quá trình thực thi',
      'đánh giá lại tính khả thi',
      'làm vấn đề vốn xấu trở nên trầm trọng hơn',
    ],
    correctIndex: 3,
    explanationVi: 'Exacerbate trái nghĩa với alleviate/mitigate: làm tình hình xấu thêm.',
  },
  {
    id: 'pv-09',
    word: 'scrutinise',
    ipa: '/ˈskruːtənaɪz/',
    bandTier: 7.0,
    promptVi: 'Động từ "scrutinise" trong văn bản học thuật nghĩa là:',
    contextEn: 'Independent panels scrutinise clinical trial data before approving new treatments.',
    choices: [
      'xem xét, kiểm tra kỹ lưỡng từng chi tiết',
      'tóm tắt ngắn gọn ý chính',
      'công bố rộng rãi trên báo chí',
      'bác bỏ ngay lập tức không cần bằng chứng',
    ],
    correctIndex: 0,
    explanationVi: 'Scrutinise = examine closely and critically, rất phổ biến ở Reading Passage 2–3.',
  },
  {
    id: 'pv-10',
    word: 'proliferate',
    ipa: '/prəˈlɪfəreɪt/',
    bandTier: 7.5,
    promptVi: 'Động từ "proliferate" mô tả xu hướng nào?',
    contextEn: 'Short-form video platforms have proliferated across every age group.',
    choices: [
      'biến mất dần khỏi thị trường',
      'tăng nhanh và lan rộng về số lượng',
      'bị kiểm soát chặt chẽ bởi luật pháp',
      'giữ nguyên quy mô ban đầu',
    ],
    correctIndex: 1,
    explanationVi: 'Proliferate = multiply or spread rapidly in numbers.',
  },
  {
    id: 'pv-11',
    word: 'ubiquitous',
    ipa: '/juːˈbɪkwɪtəs/',
    bandTier: 7.5,
    promptVi: 'Tính từ "ubiquitous" đồng nghĩa gần nhất với:',
    contextEn: 'Contactless payment terminals have become ubiquitous in metropolitan areas.',
    choices: [
      'cực kỳ hiếm gặp',
      'lỗi thời, không còn được dùng',
      'có mặt ở khắp mọi nơi',
      'gây tranh cãi gay gắt',
    ],
    correctIndex: 2,
    explanationVi: 'Ubiquitous = present, appearing, or found everywhere.',
  },
  {
    id: 'pv-12',
    word: 'corroborate',
    ipa: '/kəˈrɒbəreɪt/',
    bandTier: 8.0,
    promptVi: 'Trong bài đọc khoa học, "corroborate" có nghĩa là:',
    contextEn: 'Ice-core samples corroborate earlier archaeological records of a prolonged drought.',
    choices: [
      'phủ nhận hoàn toàn giả thuyết cũ',
      'đặt nghi vấn về độ tin cậy',
      'trình bày lại bằng ngôn ngữ đơn giản',
      'củng cố, xác nhận thêm bằng bằng chứng mới',
    ],
    correctIndex: 3,
    explanationVi: 'Corroborate a claim/finding = cung cấp thêm chứng cứ củng cố một kết luận.',
  },
  {
    id: 'pv-13',
    word: 'ephemeral',
    ipa: '/ɪˈfemərəl/',
    bandTier: 8.0,
    promptVi: 'Tính từ "ephemeral" mô tả sự vật có đặc điểm gì?',
    contextEn: 'Viral online trends are often ephemeral, fading within a matter of weeks.',
    choices: [
      'ngắn ngủi, chóng tàn',
      'có tầm ảnh hưởng sâu rộng nhiều thập kỷ',
      'mang tính học thuật chuyên sâu',
      'khó đo lường bằng số liệu',
    ],
    correctIndex: 0,
    explanationVi: 'Ephemeral = lasting for a very short time.',
  },
  {
    id: 'pv-14',
    word: 'ostensibly',
    ipa: '/ɒˈstensəbli/',
    bandTier: 8.5,
    promptVi: 'Trạng từ "ostensibly" báo hiệu sắc thái nào của tác giả?',
    contextEn: 'The policy was ostensibly designed to protect consumers, yet it raised retail prices.',
    choices: [
      'chắc chắn và đã được chứng minh tuyệt đối',
      'bề ngoài có vẻ như vậy (nhưng thực chất có thể khác)',
      'vô tình xảy ra ngoài ý muốn',
      'được thực hiện một cách bí mật',
    ],
    correctIndex: 1,
    explanationVi: 'Ostensibly là tín hiệu tương phản mạnh ở IELTS Reading Passage 3 (bề ngoài là vậy nhưng thực tế khác).',
  },
  {
    id: 'pv-15',
    word: 'ameliorate',
    ipa: '/əˈmiːliəreɪt/',
    bandTier: 8.5,
    promptVi: 'Động từ "ameliorate" trong câu học thuật nghĩa là:',
    contextEn: 'Targeted nutrition programmes can ameliorate the effects of early childhood poverty.',
    choices: [
      'phân loại theo mức độ ưu tiên',
      'ghi chép lại diễn biến lịch sử',
      'cải thiện làm cho tình trạng xấu bớt nặng nề hơn',
      'chấm dứt hoàn toàn nguồn tài trợ',
    ],
    correctIndex: 2,
    explanationVi: 'Ameliorate = make something bad or unsatisfactory better (C2 academic verb).',
  },
];

export async function loadPlacementVocabQuestions(): Promise<PlacementVocabQuestion[]> {
  const silentOpts = { isDev: false, onError: () => undefined };
  try {
    const payload = await loadContent(
      'data/vocab/placement_vocab.json',
      PlacementVocabSchema,
      silentOpts,
    );

    if (payload.items.length >= 12) {
      let vocabLookup: Map<string, VocabItem> | undefined;
      try {
        const words = await loadContentArray('data/vocab/words.json', VocabItemSchema, silentOpts);
        vocabLookup = new Map(words.map((w) => [w.headword.trim().toLowerCase(), w]));
      } catch {
        // Optional enrichment; placement_vocab.json works standalone
      }

      const byBand = new Map<number, PlacementVocab['items']>();
      for (const item of payload.items) {
        const list = byBand.get(item.band);
        if (list) list.push(item);
        else byBand.set(item.band, [item]);
      }

      const sampled: PlacementVocab['items'] = [];
      for (const [band, quota] of BAND_QUOTAS) {
        const pool = byBand.get(band) ?? [];
        if (pool.length === 0) continue;
        const step = Math.max(1, Math.floor(pool.length / quota));
        for (let i = 0; i < quota && i * step < pool.length; i++) {
          sampled.push(pool[i * step]);
        }
      }

      const sourceItems = sampled.length >= 12 ? sampled : payload.items.slice(0, 15);
      return sourceItems.map((item) => mapPlacementVocabItem(item, vocabLookup));
    }
  } catch {
    // Fallback to built-in curated 15 questions
  }
  return [...BUILTIN_PLACEMENT_QUESTIONS];
}

export interface PlacementEvaluation {
  correct: number;
  total: number;
  accuracy: number;
  estimatedBand: number;
  estimatedVocabSize: number;
  recommendedLevel: number;
  summaryVi: string;
}

export function evaluateVocabPlacement(
  questions: readonly PlacementVocabQuestion[],
  selectedIndices: readonly number[],
): PlacementEvaluation {
  const total = questions.length;
  let correct = 0;
  let weightedSum = 0;
  let maxWeighted = 0;

  for (let i = 0; i < total; i++) {
    const q = questions[i];
    const weight = q.bandTier - 4.5; // 1.0 for 5.5 up to 4.0 for 8.5
    maxWeighted += weight;
    if (selectedIndices[i] === q.correctIndex) {
      correct++;
      weightedSum += weight;
    }
  }

  const weightedRatio = maxWeighted > 0 ? weightedSum / maxWeighted : 0;
  const accuracy = total > 0 ? correct / total : 0;

  // Map weighted score smoothly into 5.5 .. 8.5 (0.5 steps)
  const rawBand = 5.5 + weightedRatio * 3.0;
  const estimatedBand = Math.min(8.5, Math.max(5.5, Math.round(rawBand * 2) / 2));

  // Estimate active academic vocabulary size
  const estimatedVocabSize = Math.round((1200 + weightedRatio * 4800) / 100) * 100;

  // Seed starting game level 1..5
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

  const summaryVi =
    estimatedBand >= 7.5
      ? 'Nền từ học thuật rất tốt — tập trung vào collocation tự nhiên, paraphrase tốc độ cao và tránh bẫy C1–C2.'
      : estimatedBand >= 6.5
        ? 'Nền từ khá vững ở mức 6.5–7.0 — ưu tiên chuyển từ nhận diện sang tự sản xuất (Daily Run + Collocation Forge).'
        : 'Cần củng cố nhanh 600 từ AWL cốt lõi trong giai đoạn G1 để bứt tốc Reading & Listening.';

  return {
    correct,
    total,
    accuracy,
    estimatedBand,
    estimatedVocabSize,
    recommendedLevel,
    summaryVi,
  };
}

/**
 * Build 15 immediately-due starter SRS cards for V1 Daily Run after placement.
 * Uses real vocab item IDs from public/data/vocab/words.json merged with V1_FIXTURE_VOCAB.
 */
export async function buildStarterVocabCards(now = new Date()): Promise<SRSCard[]> {
  const silentOpts = { isDev: false, onError: () => undefined };
  let vocabIds: string[] = [];

  try {
    const loaded = await loadContentArray('data/vocab/words.json', VocabItemSchema, silentOpts);
    vocabIds = loaded.map((v) => v.id);
  } catch {
    // Fallback to fixture vocab
  }

  const mergedIds: string[] = [];
  const seen = new Set<string>();
  for (const id of [...vocabIds, ...V1_FIXTURE_VOCAB.map((v) => v.id)]) {
    if (!seen.has(id)) {
      seen.add(id);
      mergedIds.push(id);
    }
  }

  const cards: SRSCard[] = [];
  const targetCount = 15;

  for (const itemId of mergedIds.slice(0, targetCount)) {
    cards.push(
      createNewCard(itemId, 'recog', {
        now,
        unlocked: true,
        source: 'placement',
      }),
    );
  }

  // If fewer than 15 unique vocab items exist (e.g. fixture-only mode has 12),
  // add unlocked recall_meaning faces for the first items to guarantee 15 starter cards.
  let idx = 0;
  while (cards.length < targetCount && idx < mergedIds.length) {
    cards.push(
      createNewCard(mergedIds[idx], 'recall_meaning', {
        now,
        unlocked: true,
        source: 'placement',
      }),
    );
    idx++;
  }

  return cards;
}
