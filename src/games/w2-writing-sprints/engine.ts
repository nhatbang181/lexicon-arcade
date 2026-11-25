import type {
  ChartKind,
  EssayType,
  WritingTask1Prompt,
  WritingTask2Prompt,
} from '../../core/content/schemas';
import type {
  SprintAttemptInput,
  SprintItemInput,
  SprintItemResult,
  SprintResult,
} from '../../core/grading';
import { countIeltsWords } from '../../core/text/tokenize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SprintType = 'overview' | 'idea' | 'thesis' | 'cliche' | 'upgrade';

export interface SprintClicheEntry {
  id: string;
  phrase: string;
  variants: string[];
  category: string;
  severity: 'high' | 'medium' | 'low';
  betterAlternatives: string[];
  whyAvoidVi: string;
}

export interface SprintMeta {
  type: SprintType;
  title: string;
  titleVi: string;
  subtitleVi: string;
  roundsPerSession: number;
  baseDurationSec: number;
  hardDurationSec: number;
  supportsClaudeBatch: boolean;
}

export const SPRINT_CATALOG: readonly SprintMeta[] = [
  {
    type: 'overview',
    title: 'Overview Sprint',
    titleVi: 'Overview Task 1',
    subtitleVi: 'Nhìn biểu đồ viết 1–2 câu overview trong 90 giây, không nhồi số liệu.',
    roundsPerSession: 6,
    baseDurationSec: 90,
    hardDurationSec: 60,
    supportsClaudeBatch: true,
  },
  {
    type: 'idea',
    title: 'Idea Sprint',
    titleVi: 'Lập ý Task 2',
    subtitleVi: 'Lên khung quan điểm + 2 ý chính phát triển + ví dụ cụ thể trong 3 phút.',
    roundsPerSession: 4,
    baseDurationSec: 180,
    hardDurationSec: 150,
    supportsClaudeBatch: true,
  },
  {
    type: 'thesis',
    title: 'Thesis Sprint',
    titleVi: 'Câu luận điểm 60s',
    subtitleVi: 'Viết 1–2 câu mở lập trường sắc nét, không sáo rỗng cho đề Task 2.',
    roundsPerSession: 5,
    baseDurationSec: 60,
    hardDurationSec: 45,
    supportsClaudeBatch: false,
  },
  {
    type: 'cliche',
    title: 'Cliché Surgery',
    titleVi: 'Phẫu thuật câu sáo',
    subtitleVi: 'Thay thế cụm thuộc lòng (in this day and age, double-edged sword…) bằng văn phong học thuật.',
    roundsPerSession: 6,
    baseDurationSec: 60,
    hardDurationSec: 45,
    supportsClaudeBatch: false,
  },
  {
    type: 'upgrade',
    title: 'Academic Upgrade',
    titleVi: 'Hedging & Cohesion',
    subtitleVi: 'Giảm khẳng định cực đoan (hedging) và sửa từ nối máy móc lên chuẩn Band 8.',
    roundsPerSession: 6,
    baseDurationSec: 60,
    hardDurationSec: 45,
    supportsClaudeBatch: false,
  },
] as const;

export const CLAUDE_SPRINT_BONUS_XP = 20;

export function getSprintMeta(type: SprintType): SprintMeta {
  return SPRINT_CATALOG.find((m) => m.type === type) ?? SPRINT_CATALOG[0];
}

export function getRoundDurationSec(type: SprintType, level: number): number {
  const meta = getSprintMeta(type);
  return level >= 7 ? meta.hardDurationSec : meta.baseDurationSec;
}

// ---------------------------------------------------------------------------
// Timer & XP Helpers
// ---------------------------------------------------------------------------

export type TimerTone = 'normal' | 'warn' | 'critical';

/**
 * docs/games/W2-WRITING-SPRINTS.md §10:
 * Horizontal timer bar changes colour at 25% and 10%.
 */
export function getTimerTone(remainingSec: number, totalSec: number): TimerTone {
  if (totalSec <= 0) return 'critical';
  const ratio = Math.max(0, remainingSec) / totalSec;
  if (ratio <= 0.1) return 'critical';
  if (ratio <= 0.25) return 'warn';
  return 'normal';
}

export function formatSprintClock(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

export function computeRoundXp(stars: number): number {
  const clamped = Math.max(0, Math.min(3, Math.round(stars)));
  return clamped * 10;
}

export function updateSprintStreak(
  current: { streak: number; bestStreak: number },
  stars: number,
): { streak: number; bestStreak: number } {
  const nextStreak = stars >= 2 ? current.streak + 1 : 0;
  return {
    streak: nextStreak,
    bestStreak: Math.max(current.bestStreak, nextStreak),
  };
}

// ---------------------------------------------------------------------------
// 1. Overview Sprint (Task 1) — pure scoring & highlighting
// ---------------------------------------------------------------------------

export interface OverviewChecklist {
  overallTrend: boolean;
  keyComparison: boolean;
  noDetail: boolean;
  accurate: boolean;
}

export const EMPTY_OVERVIEW_CHECKLIST: OverviewChecklist = {
  overallTrend: false,
  keyComparison: false,
  noDetail: false,
  accurate: false,
};

export const OVERVIEW_CHECKLIST_META: ReadonlyArray<{
  key: keyof OverviewChecklist;
  labelVi: string;
}> = [
  { key: 'overallTrend', labelVi: 'Nêu rõ xu hướng chung' },
  { key: 'keyComparison', labelVi: 'Có so sánh / điểm nổi bật' },
  { key: 'noDetail', labelVi: 'Không đưa số liệu cụ thể' },
  { key: 'accurate', labelVi: 'Khớp dữ liệu biểu đồ' },
];

/**
 * Extract specific numeric data figures from an Overview sentence.
 * Bare 4-digit years (1900-2099) used as timeframe anchors (e.g. "between 2010 and 2024")
 * are allowed, whereas percentages (42%), decimals (3.5), large figures (20,000),
 * or non-year counts (54, 18) are flagged as specific data details.
 */
export function extractSpecificNumbers(text: string): string[] {
  const matches = text.match(/\b\d+(?:[,.]\d+)*(?:\s*%)?/g);
  if (!matches) return [];
  const specific: string[] = [];
  for (const raw of matches) {
    const trimmed = raw.trim();
    if (trimmed.includes('%')) {
      specific.push(trimmed);
      continue;
    }
    const numeric = Number(trimmed.replace(/,/g, ''));
    const isFourDigitYear = /^\d{4}$/.test(trimmed) && numeric >= 1900 && numeric <= 2099;
    if (!isFourDigitYear) {
      specific.push(trimmed);
    }
  }
  return specific;
}

export interface OverviewScoreResult {
  stars: number;
  rawStars: number;
  canSelfCheck: boolean;
  specificNumbers: string[];
  contradiction: boolean;
  warningVi: string | null;
}

/**
 * docs/games/W2-WRITING-SPRINTS.md §4 & §11:
 * - Empty text → 0★, self-check disabled.
 * - 4 checks => 3★, 3 checks => 2★, 2 checks => 1★, <=1 => 0★.
 * - Contradiction: ticking `noDetail` when specific numbers appear → -1★ & warning.
 */
export function scoreOverviewSelfCheck(
  text: string,
  checks: OverviewChecklist,
): OverviewScoreResult {
  const trimmed = text.trim();
  const specificNumbers = extractSpecificNumbers(trimmed);

  if (countIeltsWords(trimmed) < 3) {
    return {
      stars: 0,
      rawStars: 0,
      canSelfCheck: false,
      specificNumbers,
      contradiction: false,
      warningVi: 'Bạn chưa viết câu overview nên không thể tự chấm.',
    };
  }

  const ticked =
    Number(checks.overallTrend) +
    Number(checks.keyComparison) +
    Number(checks.noDetail) +
    Number(checks.accurate);

  let rawStars = 0;
  if (ticked >= 4) rawStars = 3;
  else if (ticked === 3) rawStars = 2;
  else if (ticked === 2) rawStars = 1;

  const contradiction = checks.noDetail && specificNumbers.length > 0;
  const stars = contradiction ? Math.max(0, rawStars - 1) : rawStars;

  return {
    stars,
    rawStars,
    canSelfCheck: true,
    specificNumbers,
    contradiction,
    warningVi: contradiction
      ? `Phát hiện số liệu cụ thể (${specificNumbers.slice(0, 3).join(', ')}) trong overview — tự động hạ 1★. Hãy bỏ số liệu chi tiết khỏi câu tổng quan.`
      : specificNumbers.length > 0
        ? `Gợi ý: câu của bạn có số liệu (${specificNumbers.slice(0, 3).join(', ')}); nên bỏ tick "Không đưa số liệu cụ thể".`
        : null,
  };
}

export interface KeyPhraseSegment {
  text: string;
  isKeyPhrase: boolean;
  phrase?: string;
}

/**
 * Splits a Band 8 model overview into plain text and clickable highlighted key phrases.
 */
export function splitByKeyPhrases(
  modelText: string,
  keyPhrases: readonly string[],
): KeyPhraseSegment[] {
  const cleaned = [...new Set(keyPhrases.map((p) => p.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (cleaned.length === 0 || !modelText) {
    return [{ text: modelText, isKeyPhrase: false }];
  }

  const escaped = cleaned.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = modelText.split(regex);
  const segments: KeyPhraseSegment[] = [];

  for (const part of parts) {
    if (!part) continue;
    const matched = cleaned.find((p) => p.toLowerCase() === part.toLowerCase());
    if (matched) {
      segments.push({ text: part, isKeyPhrase: true, phrase: matched });
    } else {
      segments.push({ text: part, isKeyPhrase: false });
    }
  }
  return segments;
}

/**
 * Deterministic seeded shuffle (Mulberry32) so consecutive sessions get varied prompts (W2-02).
 */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let s = (seed >>> 0) || 1;
  const nextRand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface SprintSelectionOptions {
  seed?: number;
  excludeIds?: ReadonlySet<string>;
}

/**
 * Filter/select Task 1 prompts by difficulty tier (W2-WRITING-SPRINTS.md §5).
 * Supports seeded shuffle and excluding recently completed prompt IDs (W2-02).
 */
export function selectOverviewPrompts<T extends { id: string; kind: ChartKind }>(
  items: readonly T[],
  level: number,
  count: number,
  options?: SprintSelectionOptions,
): T[] {
  const preferredKinds: ChartKind[] =
    level <= 3
      ? ['bar', 'line', 'pie']
      : level <= 6
        ? ['table', 'mixed']
        : ['process', 'map'];

  const exclude = options?.excludeIds;
  const primary = items.filter((item) => preferredKinds.includes(item.kind));
  const fallback = items.filter((item) => !preferredKinds.includes(item.kind));

  const orderBucket = (bucket: T[], salt: number): T[] => {
    const fresh = exclude ? bucket.filter((it) => !exclude.has(it.id)) : bucket;
    const seen = exclude ? bucket.filter((it) => exclude.has(it.id)) : [];
    if (options?.seed === undefined) {
      return [...fresh, ...seen];
    }
    return [
      ...seededShuffle(fresh, options.seed ^ salt),
      ...seededShuffle(seen, (options.seed ^ salt) + 97),
    ];
  };

  return [...orderBucket(primary, 0x9e3779b9), ...orderBucket(fallback, 0x85ebca6b)].slice(0, count);
}

// ---------------------------------------------------------------------------
// 2. Idea Sprint (Task 2) — pure scoring & ideaBank ranking
// ---------------------------------------------------------------------------

export interface IdeaOutlineInput {
  stance: string;
  main1: string;
  main2: string;
  example: string;
}

export const EMPTY_IDEA_OUTLINE: IdeaOutlineInput = {
  stance: '',
  main1: '',
  main2: '',
  example: '',
};

export interface IdeaChecklist {
  clearStance: boolean;
  allParts: boolean;
  relevantIdeas: boolean;
  developed: boolean;
  specificExample: boolean;
}

export const EMPTY_IDEA_CHECKLIST: IdeaChecklist = {
  clearStance: false,
  allParts: false,
  relevantIdeas: false,
  developed: false,
  specificExample: false,
};

export const IDEA_CHECKLIST_META: ReadonlyArray<{
  key: keyof IdeaChecklist;
  labelVi: string;
}> = [
  { key: 'clearStance', labelVi: 'Quan điểm rõ ngay câu đầu' },
  { key: 'allParts', labelVi: 'Trả lời đủ mọi phần của đề' },
  { key: 'relevantIdeas', labelVi: '2 ý chính bám sát trọng tâm' },
  { key: 'developed', labelVi: 'Mỗi ý đều có giải thích / hệ quả' },
  { key: 'specificExample', labelVi: 'Ví dụ cụ thể, không chung chung' },
];

export function formatIdeaOutlineText(outline: IdeaOutlineInput): string {
  return [
    `Stance: ${outline.stance.trim() || '(trống)'}`,
    `Main idea 1: ${outline.main1.trim() || '(trống)'}`,
    `Main idea 2: ${outline.main2.trim() || '(trống)'}`,
    `Example: ${outline.example.trim() || '(trống)'}`,
  ].join('\n');
}

export interface IdeaScoreResult {
  stars: number;
  rawStars: number;
  canSelfCheck: boolean;
  contradiction: boolean;
  warningVi: string | null;
}

/**
 * docs/games/W2-WRITING-SPRINTS.md §4 & §11:
 * - Empty outline (< 5 words total) → 0★, self-check disabled.
 * - 5 checks => 3★, 4 checks => 2★, 2-3 checks => 1★, <=1 => 0★.
 * - Contradiction if ticking clearStance with empty stance or specificExample with empty example → -1★.
 */
export function scoreIdeaSelfCheck(
  outline: IdeaOutlineInput,
  checks: IdeaChecklist,
): IdeaScoreResult {
  const combined = `${outline.stance} ${outline.main1} ${outline.main2} ${outline.example}`.trim();
  if (countIeltsWords(combined) < 5) {
    return {
      stars: 0,
      rawStars: 0,
      canSelfCheck: false,
      contradiction: false,
      warningVi: 'Bạn cần điền khung lập ý trước khi tự chấm.',
    };
  }

  const ticked =
    Number(checks.clearStance) +
    Number(checks.allParts) +
    Number(checks.relevantIdeas) +
    Number(checks.developed) +
    Number(checks.specificExample);

  let rawStars = 0;
  if (ticked >= 5) rawStars = 3;
  else if (ticked === 4) rawStars = 2;
  else if (ticked >= 2) rawStars = 1;

  const missingStance = checks.clearStance && countIeltsWords(outline.stance) < 3;
  const missingExample = checks.specificExample && countIeltsWords(outline.example) < 3;
  const contradiction = missingStance || missingExample;
  const stars = contradiction ? Math.max(0, rawStars - 1) : rawStars;

  const warningParts: string[] = [];
  if (missingStance) warningParts.push('ô Quan điểm còn trống/quá ngắn');
  if (missingExample) warningParts.push('ô Ví dụ cụ thể còn trống/quá ngắn');

  return {
    stars,
    rawStars,
    canSelfCheck: true,
    contradiction,
    warningVi: contradiction
      ? `Mâu thuẫn tự chấm (${warningParts.join('; ')}) — hạ 1★.`
      : null,
  };
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with',
  'by', 'from', 'at', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'that', 'this', 'these', 'those', 'it', 'its', 'they', 'their', 'them', 'we',
  'our', 'you', 'your', 'can', 'could', 'should', 'would', 'will', 'may', 'might',
  'have', 'has', 'had', 'do', 'does', 'did', 'not', 'no', 'more', 'most', 'very',
  'also', 'such', 'than', 'into', 'over', 'about', 'while', 'when', 'where',
]);

export function extractKeywords(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return new Set(tokens);
}

export interface RankedIdeaBankItem {
  item: WritingTask2Prompt['ideaBank'][number];
  score: number;
  matchedKeywords: string[];
}

/**
 * Ranks `ideaBank` entries by keyword overlap with the learner's outline
 * so the closest model ideas float to the top (W2-WRITING-SPRINTS.md §3).
 */
export function rankIdeaBankBySimilarity(
  outline: IdeaOutlineInput,
  ideaBank: WritingTask2Prompt['ideaBank'],
): RankedIdeaBankItem[] {
  const userKeywords = extractKeywords(
    `${outline.stance} ${outline.main1} ${outline.main2} ${outline.example}`,
  );

  return ideaBank
    .map((item, idx) => {
      const itemKeywords = extractKeywords(`${item.idea} ${item.develop}`);
      const matched: string[] = [];
      for (const kw of userKeywords) {
        if (itemKeywords.has(kw)) {
          matched.push(kw);
        }
      }
      const denom = Math.max(1, Math.min(userKeywords.size || 1, itemKeywords.size));
      const score = userKeywords.size === 0 ? 0 : matched.length / denom;
      return { item, score, matchedKeywords: matched, idx };
    })
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - b.idx))
    .map(({ item, score, matchedKeywords }) => ({ item, score, matchedKeywords }));
}

export function selectIdeaPrompts(
  prompts: readonly WritingTask2Prompt[],
  level: number,
  count: number,
  options?: SprintSelectionOptions,
): WritingTask2Prompt[] {
  const preferredTypes: EssayType[] =
    level <= 3
      ? ['opinion', 'adv_disadv']
      : level <= 6
        ? ['problem_solution', 'positive_negative']
        : ['discussion', 'two_part'];

  const exclude = options?.excludeIds;
  const primary = prompts.filter((p) => preferredTypes.includes(p.essayType));
  const fallback = prompts.filter((p) => !preferredTypes.includes(p.essayType));

  const orderBucket = (bucket: WritingTask2Prompt[], salt: number): WritingTask2Prompt[] => {
    const fresh = exclude ? bucket.filter((p) => !exclude.has(p.id)) : bucket;
    const seen = exclude ? bucket.filter((p) => exclude.has(p.id)) : [];
    if (options?.seed === undefined) {
      return [...fresh, ...seen];
    }
    return [
      ...seededShuffle(fresh, options.seed ^ salt),
      ...seededShuffle(seen, (options.seed ^ salt) + 131),
    ];
  };

  return [...orderBucket(primary, 0x243f6a88), ...orderBucket(fallback, 0x85a308d3)].slice(0, count);
}

// ---------------------------------------------------------------------------
// 3. Thesis Sprint (Task 2 · 60s) — instant local auto-scoring
// ---------------------------------------------------------------------------

const STANCE_MARKERS_RE =
  /\b(agree|disagree|believe|argue|contend|maintain|view|position|outweigh|while|although|whereas|however|this essay|largely|partially|strongly|should|ought to|effective|beneficial|detrimental|both|balanced)\b/i;

export interface ThesisScoreResult {
  stars: number;
  wordCount: number;
  checks: {
    goodLength: boolean;
    clearStance: boolean;
    onTopic: boolean;
    noCliche: boolean;
  };
  detectedCliches: string[];
  modelThesis: string;
  tipVi: string;
}

export function extractModelThesis(band8Text: string): string {
  const firstPara = band8Text.split(/\n\s*\n/)[0]?.trim() ?? '';
  const sentences = firstPara.match(/[^.!?]+[.!?]+/g) ?? [];
  if (sentences.length >= 2) {
    return sentences[sentences.length - 1].trim();
  }
  return firstPara;
}

export function scanSprintCliches(
  text: string,
  cliches: readonly SprintClicheEntry[],
): SprintClicheEntry[] {
  const lower = text.toLowerCase();
  const hits: SprintClicheEntry[] = [];
  for (const entry of cliches) {
    const candidates = [entry.phrase, ...entry.variants];
    if (candidates.some((c) => c && lower.includes(c.toLowerCase()))) {
      hits.push(entry);
    }
  }
  return hits;
}

export function scoreThesisResponse(
  text: string,
  prompt: WritingTask2Prompt,
  cliches: readonly SprintClicheEntry[],
): ThesisScoreResult {
  const trimmed = text.trim();
  const wordCount = countIeltsWords(trimmed);
  const modelThesis = extractModelThesis(prompt.band8Model.text);

  if (wordCount < 5) {
    return {
      stars: 0,
      wordCount,
      checks: { goodLength: false, clearStance: false, onTopic: false, noCliche: true },
      detectedCliches: [],
      modelThesis,
      tipVi: 'Câu luận điểm quá ngắn. Hãy nêu rõ lập trường và lý do chính trong 15–45 từ.',
    };
  }

  const goodLength = wordCount >= 12 && wordCount <= 55;
  const clearStance = STANCE_MARKERS_RE.test(trimmed);

  const promptKeywords = extractKeywords(prompt.prompt);
  const responseKeywords = extractKeywords(trimmed);
  let overlap = 0;
  for (const kw of responseKeywords) {
    if (promptKeywords.has(kw)) overlap++;
  }
  const onTopic = overlap >= 2;

  const clicheHits = scanSprintCliches(trimmed, cliches);
  const noCliche = clicheHits.length === 0;

  const passedCount =
    Number(goodLength) + Number(clearStance) + Number(onTopic) + Number(noCliche);

  let stars = 0;
  if (passedCount === 4) stars = 3;
  else if (passedCount === 3) stars = 2;
  else if (passedCount === 2) stars = 1;

  let tipVi = 'Câu luận điểm sắc nét, rõ lập trường, bám đề và không sáo rỗng!';
  if (!noCliche) {
    tipVi = `Tránh cụm sáo rỗng "${clicheHits[0].phrase}" — thử thay bằng "${clicheHits[0].betterAlternatives[0]}".`;
  } else if (!clearStance) {
    tipVi = 'Chưa thấy dấu hiệu lập trường rõ (vd: While I agree that..., I contend that...).';
  } else if (!onTopic) {
    tipVi = 'Câu luận điểm chưa bám đủ từ khoá cốt lõi của đề bài.';
  } else if (!goodLength) {
    tipVi =
      wordCount < 12
        ? 'Câu luận điểm hơi ngắn; thêm vế lý do hoặc sắc thái (While..., ...).'
        : 'Câu luận điểm hơi dài (> 55 từ); nén gọn lại 1–2 câu súc tích.';
  }

  return {
    stars,
    wordCount,
    checks: { goodLength, clearStance, onTopic, noCliche },
    detectedCliches: clicheHits.map((c) => c.phrase),
    modelThesis,
    tipVi,
  };
}

// ---------------------------------------------------------------------------
// 4. Cliché Surgery — powered by public/data/writing/cliches.json
// ---------------------------------------------------------------------------

export interface ClicheDrillItem {
  id: string;
  entry: SprintClicheEntry;
  sentenceBefore: string;
  sentenceAfter: string;
  options: string[];
  correctIndex: number;
  correctReplacement: string;
}

const CLICHE_TEMPLATES: ReadonlyArray<{ before: string; after: string }> = [
  { before: 'Many argue that ', after: ', urban transport policy requires long-term planning.' },
  { before: 'In academic discussion, ', after: ' when evaluating digital education reforms.' },
  { before: 'Critics often claim that ', after: ' for developing economies.' },
  { before: 'Policymakers should recognise that ', after: ' in public healthcare.' },
];

const WEAK_DISTRACTORS: readonly string[] = [
  'nowadays everybody knows that things are very big',
  'it is super obvious to all people around the world',
  'this stuff has a lot of good and bad things',
  'in our modern world today people always say',
  'there is no doubt at all in the whole universe',
  'from my personal point of view I totally think',
];

export function buildClicheDrillItems(
  cliches: readonly SprintClicheEntry[],
  count: number,
  offset = 0,
): ClicheDrillItem[] {
  if (cliches.length === 0) return [];
  const items: ClicheDrillItem[] = [];
  const total = Math.min(count, cliches.length);

  for (let i = 0; i < total; i++) {
    const entry = cliches[(i + offset) % cliches.length];
    const tpl = CLICHE_TEMPLATES[i % CLICHE_TEMPLATES.length];
    const correctReplacement = entry.betterAlternatives[0];

    const distractor1 = cliches[(i + offset + 3) % cliches.length].phrase;
    const distractor2 = WEAK_DISTRACTORS[(i + offset) % WEAK_DISTRACTORS.length];
    const distractor3 = WEAK_DISTRACTORS[(i + offset + 2) % WEAK_DISTRACTORS.length];

    const rawOptions = [correctReplacement, distractor1, distractor2, distractor3];
    // Deterministic rotation so correct option isn't always index 0
    const shift = (i + offset) % 4;
    const options = rawOptions.map((_, idx) => rawOptions[(idx + shift) % 4]);
    const correctIndex = options.indexOf(correctReplacement);

    items.push({
      id: `cliche-drill:${entry.id}`,
      entry,
      sentenceBefore: tpl.before,
      sentenceAfter: tpl.after,
      options,
      correctIndex,
      correctReplacement,
    });
  }

  return items;
}

export interface ClicheDrillScore {
  stars: number;
  correct: boolean;
  explanationVi: string;
  keyPhrase: string;
}

export function scoreClicheDrill(
  item: ClicheDrillItem,
  selectedIndex: number,
): ClicheDrillScore {
  const correct = selectedIndex === item.correctIndex;
  return {
    stars: correct ? 3 : 0,
    correct,
    explanationVi: correct
      ? `Chính xác! "${item.correctReplacement}" thay thế cụm sáo rỗng mượt mà và học thuật hơn. (${item.entry.whyAvoidVi})`
      : `Chưa chuẩn. ${item.entry.whyAvoidVi} Nên dùng: "${item.correctReplacement}".`,
    keyPhrase: item.correctReplacement,
  };
}

// ---------------------------------------------------------------------------
// 5. Academic Upgrade (Hedging Upgrade + Cohesive Repair)
// ---------------------------------------------------------------------------

export interface AcademicUpgradeItem {
  id: string;
  subKind: 'hedging' | 'cohesion';
  band6Sentence: string;
  flawHighlight: string;
  promptVi: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationVi: string;
  keyPhrase: string;
}

export const ACADEMIC_UPGRADE_BANK: readonly AcademicUpgradeItem[] = [
  {
    id: 'upg:hedge_01',
    subKind: 'hedging',
    band6Sentence: 'Working from home always destroys team collaboration and ruins productivity.',
    flawHighlight: 'always destroys ... ruins',
    promptVi: 'Giảm khẳng định tuyệt đối bằng ngôn ngữ thận trọng (hedging) chuẩn Band 8:',
    options: [
      'Working from home can undermine spontaneous collaboration if teams lack clear communication norms.',
      'Working from home definitely kills every single form of teamwork.',
      'Working from home never helps anyone collaborate at all.',
      'Working from home is 100% bad for productivity in every company.',
    ],
    correctIndex: 0,
    explanationVi:
      'Dùng modal "can" + điều kiện "if teams lack..." tránh lỗi khái quát hoá quá mức (overgeneralisation).',
    keyPhrase: 'can undermine ... if teams lack',
  },
  {
    id: 'upg:cohesion_01',
    subKind: 'cohesion',
    band6Sentence: 'Because urban traffic is worsening, so governments must expand metro lines.',
    flawHighlight: 'Because ... so',
    promptVi: 'Sửa lỗi lặp liên từ nguyên nhân–kết quả kiểu Việt ("Because ... so"):',
    options: [
      'Because urban traffic is worsening, therefore governments must expand metro lines.',
      'As urban congestion intensifies, municipal authorities need to expand metro networks.',
      'Because urban traffic is worsening, so that governments must expand metro lines.',
      'Due to urban traffic is worsening, governments must expand metro lines.',
    ],
    correctIndex: 1,
    explanationVi:
      'Trong tiếng Anh không dùng đồng thời "Because" và "so/therefore" trong cùng một câu. "As ..., ..." vừa chuẩn ngữ pháp vừa trang trọng.',
    keyPhrase: 'As urban congestion intensifies,',
  },
  {
    id: 'upg:hedge_02',
    subKind: 'hedging',
    band6Sentence: 'Social media proves that young people no longer care about real friendships.',
    flawHighlight: 'proves ... no longer care',
    promptVi: 'Nâng cấp câu quá cực đoan sang giọng văn phân tích học thuật:',
    options: [
      'Social media completely proves that youth hate real friendships.',
      'Heavy social media use appears to correlate with fewer face-to-face interactions among some adolescents.',
      'Social media obviously shows everyone stopped having real friends.',
      'Social media always forces teenagers to abandon their friends.',
    ],
    correctIndex: 1,
    explanationVi:
      '"appears to correlate with" + "among some adolescents" thể hiện tư duy học thuật cẩn trọng, không gán nhân quả tuyệt đối.',
    keyPhrase: 'appears to correlate with',
  },
  {
    id: 'upg:cohesion_02',
    subKind: 'cohesion',
    band6Sentence: 'Public libraries offer free books. Besides, they provide quiet spaces for students.',
    flawHighlight: 'Besides,',
    promptVi: 'Thay từ nối "Besides," mang sắc thái văn nói bằng liên kết mạch lạc Band 8:',
    options: [
      'Public libraries offer free books. Anyway, they provide quiet spaces for students.',
      'Public libraries offer free books. Plus, they provide quiet spaces for students.',
      'Beyond lending books free of charge, public libraries serve as quiet study environments for students.',
      'Public libraries offer free books. On the other hand, they provide quiet spaces for students.',
    ],
    correctIndex: 2,
    explanationVi:
      'Cấu trúc "Beyond + V-ing, ..." gộp 2 ý bổ sung mượt mà hơn hẳn từ nối máy móc "Besides," hay sai logic "On the other hand".',
    keyPhrase: 'Beyond lending ..., ... serve as',
  },
  {
    id: 'upg:hedge_03',
    subKind: 'hedging',
    band6Sentence: 'Raising university tuition fees will certainly stop poor students from studying.',
    flawHighlight: 'will certainly stop',
    promptVi: 'Chuyển sang hedging chính xác (chỉ rõ khả năng và phạm vi tác động):',
    options: [
      'Higher tuition fees are likely to deter lower-income applicants unless targeted grants are expanded.',
      'Higher tuition fees will 100% ban every poor student from campus.',
      'Higher tuition fees always make university impossible for everyone.',
      'Higher tuition fees definitely destroy education overnight.',
    ],
    correctIndex: 0,
    explanationVi:
      '"are likely to deter ... unless ..." nêu hệ quả có cơ sở kèm điều kiện giảm nhẹ, rất được đánh giá cao ở TR & LR.',
    keyPhrase: 'are likely to deter ... unless',
  },
  {
    id: 'upg:cohesion_03',
    subKind: 'cohesion',
    band6Sentence: 'Solar energy is clean. However, it depends on weather. However, batteries are improving.',
    flawHighlight: 'However ... However',
    promptVi: 'Xử lý lỗi lặp từ nối "However" liên tiếp trong 2 câu kề nhau:',
    options: [
      'Solar energy is clean. But it depends on weather. But batteries are improving.',
      'Although solar generation remains weather-dependent, advances in battery storage are steadily mitigating this limitation.',
      'Solar energy is clean. However, it depends on weather. Nevertheless, however, batteries are improving.',
      'Solar energy is clean. On the contrary, it depends on weather, so batteries are improving.',
    ],
    correctIndex: 1,
    explanationVi:
      'Dùng mệnh đề nhượng bộ "Although..." kết hợp danh từ tham chiếu "this limitation" tạo liên kết nội tại (cohesion) vượt trội Band 8.',
    keyPhrase: 'are steadily mitigating this limitation',
  },
  {
    id: 'upg:hedge_04',
    subKind: 'hedging',
    band6Sentence: 'Banning plastic bags solves ocean pollution immediately.',
    flawHighlight: 'solves ... immediately',
    promptVi: 'Diễn đạt tác động chính sách thực tế, không phóng đại:',
    options: [
      'Restricting single-use plastic bags can contribute to reducing marine litter, though broader waste reforms remain necessary.',
      'Banning plastic bags instantly fixes the entire ocean forever.',
      'Banning plastic bags completely ends all pollution on Earth.',
      'Banning plastic bags is the only solution that ever works.',
    ],
    correctIndex: 0,
    explanationVi:
      '"can contribute to reducing ..., though ... remain necessary" thừa nhận giới hạn của giải pháp — đặc trưng của bài lập luận Band 8.',
    keyPhrase: 'can contribute to reducing ..., though',
  },
  {
    id: 'upg:cohesion_04',
    subKind: 'cohesion',
    band6Sentence: 'On the other hand, congestion charges reduce car numbers in city centres.',
    flawHighlight: 'On the other hand,',
    promptVi: 'Câu này mở đầu đoạn thân bài đầu tiên (chưa có "On the one hand"). Chọn cách mở đoạn đúng:',
    options: [
      'On the other hand, congestion charges reduce car numbers in city centres.',
      'One primary argument in favour of congestion charges is their measurable impact on inner-city traffic volume.',
      'In contrast, on the other hand, congestion charges reduce cars.',
      'Last but not least, congestion charges reduce car numbers in city centres.',
    ],
    correctIndex: 1,
    explanationVi:
      'Không dùng "On the other hand" khi chưa nêu vế đối lập trước đó. Câu chủ đề rõ chức năng lập luận giúp CC lên 7.5–8.0.',
    keyPhrase: 'One primary argument in favour of',
  },
] as const;

export function selectAcademicUpgradeItems(count: number, offset = 0): AcademicUpgradeItem[] {
  const total = Math.min(count, ACADEMIC_UPGRADE_BANK.length);
  const picked: AcademicUpgradeItem[] = [];
  for (let i = 0; i < total; i++) {
    picked.push(ACADEMIC_UPGRADE_BANK[(i + offset) % ACADEMIC_UPGRADE_BANK.length]);
  }
  return picked;
}

export interface UpgradeDrillScore {
  stars: number;
  correct: boolean;
  explanationVi: string;
  keyPhrase: string;
  upgradedSentence: string;
}

export function scoreUpgradeDrill(
  item: AcademicUpgradeItem,
  selectedIndex: number,
): UpgradeDrillScore {
  const correct = selectedIndex === item.correctIndex;
  return {
    stars: correct ? 3 : 0,
    correct,
    explanationVi: item.explanationVi,
    keyPhrase: item.keyPhrase,
    upgradedSentence: item.options[item.correctIndex],
  };
}

// ---------------------------------------------------------------------------
// Session Aggregation, Win Sentence & Claude SprintResult Mapping
// ---------------------------------------------------------------------------

export interface CompletedSprintRound {
  ref: string;
  title: string;
  promptText: string;
  responseText: string;
  durationSec: number;
  stars: number;
  checks: Record<string, boolean>;
  gradedBy: 'self' | 'auto' | 'claude';
  tipVi?: string;
  betterChunk?: { original: string; better: string } | null;
  keyFeatures?: string[];
  partsToAddress?: string[];
}

export function buildW2SprintPacketInput(
  attemptId: string,
  sprintType: 'overview' | 'idea',
  rounds: readonly CompletedSprintRound[],
): SprintAttemptInput {
  const items: SprintItemInput[] = rounds.map((r) => ({
    ref: r.ref,
    prompt: r.promptText,
    response: r.responseText || '(bỏ trống)',
    keyFeatures: r.keyFeatures,
    partsToAddress: r.partsToAddress,
    durationSec: r.durationSec,
  }));

  const totalDurationSec = rounds.reduce((acc, r) => acc + r.durationSec, 0);

  return {
    attemptId,
    kind: sprintType === 'overview' ? 'w2_overview' : 'w2_idea',
    mode: 'sprint',
    durationSec: totalDurationSec,
    items,
  };
}

export interface ApplyClaudeSprintOutcome {
  rounds: CompletedSprintRound[];
  matchedRefs: string[];
  missingRefs: string[];
  betterChunks: Array<{ ref: string; original: string; better: string }>;
}

/**
 * docs/games/W2-WRITING-SPRINTS.md §3 & §11:
 * Maps Claude `SprintResult` onto completed sprint rounds by `ref`.
 * If Claude misses some refs, only matched rounds are overwritten and missingRefs are reported.
 */
export function applyClaudeSprintResult(
  rounds: readonly CompletedSprintRound[],
  result: SprintResult,
): ApplyClaudeSprintOutcome {
  const byRef = new Map<string, SprintItemResult>();
  for (const item of result.items) {
    byRef.set(item.ref, item);
  }

  const matchedRefs: string[] = [];
  const missingRefs: string[] = [];
  const betterChunks: Array<{ ref: string; original: string; better: string }> = [];

  const updatedRounds = rounds.map((round) => {
    const match = byRef.get(round.ref);
    if (!match) {
      missingRefs.push(round.ref);
      return round;
    }
    matchedRefs.push(round.ref);
    if (match.betterChunk) {
      betterChunks.push({
        ref: round.ref,
        original: match.betterChunk.original,
        better: match.betterChunk.better,
      });
    }
    return {
      ...round,
      stars: match.stars,
      checks: { ...round.checks, ...match.checks },
      gradedBy: 'claude' as const,
      tipVi: match.tipVi,
      betterChunk: match.betterChunk,
    };
  });

  return {
    rounds: updatedRounds,
    matchedRefs,
    missingRefs,
    betterChunks,
  };
}

/**
 * docs/games/W2-WRITING-SPRINTS.md §7:
 * Concrete Vietnamese win sentence summarizing what the learner achieved.
 */
export function buildWinSentence(
  sprintType: SprintType,
  rounds: readonly CompletedSprintRound[],
): string {
  const total = rounds.length;
  if (total === 0) return 'Hoàn thành phiên luyện Writing Sprints.';

  if (sprintType === 'overview') {
    const trendCount = rounds.filter((r) => r.checks.overallTrend).length;
    return `Overview có xu hướng chung ${trendCount}/${total} lần.`;
  }
  if (sprintType === 'idea') {
    const stanceCount = rounds.filter((r) => r.checks.clearStance).length;
    return `${stanceCount}/${total} đề có quan điểm rõ ngay câu đầu.`;
  }
  if (sprintType === 'thesis') {
    const sharpCount = rounds.filter((r) => r.stars >= 2).length;
    return `${sharpCount}/${total} câu luận điểm đạt chuẩn rõ lập trường & bám đề.`;
  }
  if (sprintType === 'cliche') {
    const cleanCount = rounds.filter((r) => r.stars === 3).length;
    return `Phẫu thuật sạch ${cleanCount}/${total} cụm sáo rỗng sang văn phong học thuật.`;
  }
  const upgradedCount = rounds.filter((r) => r.stars === 3).length;
  return `Nâng cấp thành công ${upgradedCount}/${total} câu Hedging & Cohesion lên Band 8.`;
}

export function computeSessionSummary(
  rounds: readonly CompletedSprintRound[],
  claudeGraded: boolean,
): {
  totalStars: number;
  maxStars: number;
  totalXp: number;
  accuracyPercent: number;
} {
  const totalStars = rounds.reduce((acc, r) => acc + r.stars, 0);
  const maxStars = rounds.length * 3;
  const baseXp = rounds.reduce((acc, r) => acc + computeRoundXp(r.stars), 0);
  const totalXp = baseXp + (claudeGraded ? CLAUDE_SPRINT_BONUS_XP : 0);
  const accuracyPercent = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0;

  return { totalStars, maxStars, totalXp, accuracyPercent };
}
