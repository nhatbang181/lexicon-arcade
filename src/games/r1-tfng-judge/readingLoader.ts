import { z } from 'zod';
import {
  filterTrainingPool,
  loadContent,
  loadContentArray,
  type LoadContentOptions,
} from '../../core/content/loaders';
import {
  ReadingPassageSchema,
  ReadingQTypeSchema,
  TopicSchema,
  type ReadingPassage,
} from '../../core/content/schemas';
import { db, type LexiconV3DB } from '../../core/storage/db';

/**
 * Contract agreed with r-data-reading for `public/data/reading/index.json`.
 */
export const ReadingIndexEntrySchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  level: z.enum(['P1', 'P2', 'P3']),
  reserved: z.boolean().optional().default(false),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  topic: TopicSchema,
  wordCount: z.number().int().positive(),
  paragraphCount: z.number().int().positive(),
  questionCount: z.number().int().positive(),
  questionTypes: z.array(ReadingQTypeSchema),
  hasTfng: z.boolean().optional(),
  hasYnng: z.boolean().optional(),
  hasHeadings: z.boolean().optional(),
});

export type ReadingIndexEntry = z.infer<typeof ReadingIndexEntrySchema>;

export interface PassageCatalogItem {
  id: string;
  level: 'P1' | 'P2' | 'P3';
  title: string;
  subtitle?: string;
  topic: string;
  wordCount: number;
  questionCount: number;
  hasJudgeQuestions: boolean;
  hasTfng?: boolean;
  hasYnng?: boolean;
  /** Non-empty relative path when backed by `public/data/reading/passages/*.json` */
  file?: string;
  /** Pre-loaded passage (for fixture entries in test mode) */
  fixturePassage?: ReadingPassage;
}

function fixtureToCatalogItem(p: ReadingPassage): PassageCatalogItem {
  const questionCount = p.questionGroups.reduce((acc, g) => acc + g.questions.length, 0);
  const hasTfng = p.questionGroups.some((g) => g.type === 'tfng');
  const hasYnng = p.questionGroups.some((g) => g.type === 'ynng');
  return {
    id: p.id,
    level: p.level,
    title: p.title,
    subtitle: p.subtitle,
    topic: p.topic,
    wordCount: p.wordCount,
    questionCount,
    hasJudgeQuestions: hasTfng || hasYnng,
    hasTfng,
    hasYnng,
    fixturePassage: p,
  };
}

/**
 * Tải danh mục bài đọc từ `public/data/reading/index.json` (lọc bỏ `reserved`).
 * Chỉ nạp `r1_fixtures` khi `import.meta.env.MODE === 'test'` để không kéo vào prod bundle (X6).
 */
export async function loadReadingCatalog(
  options: LoadContentOptions = {},
): Promise<PassageCatalogItem[]> {
  const silentOpts: LoadContentOptions = {
    isDev: false,
    onError: () => undefined,
    ...options,
  };

  try {
    const entries = await loadContentArray(
      'data/reading/index.json',
      ReadingIndexEntrySchema,
      silentOpts,
    );
    const trainingEntries = filterTrainingPool(entries);
    if (trainingEntries.length > 0) {
      return trainingEntries.map((entry) => {
        const hasTfng = Boolean(entry.hasTfng) || entry.questionTypes.includes('tfng');
        const hasYnng = Boolean(entry.hasYnng) || entry.questionTypes.includes('ynng');
        return {
          id: entry.id,
          level: entry.level,
          title: entry.title,
          subtitle: entry.subtitle,
          topic: entry.topic,
          wordCount: entry.wordCount,
          questionCount: entry.questionCount,
          hasJudgeQuestions: hasTfng || hasYnng,
          hasTfng,
          hasYnng,
          file: entry.file,
        };
      });
    }
  } catch {
    // fallback chỉ dành cho môi trường test
  }

  if (import.meta.env.MODE === 'test') {
    const { R1_FIXTURE_PASSAGES } = await import('../../test/fixtures/r1_fixtures');
    return R1_FIXTURE_PASSAGES.map(fixtureToCatalogItem);
  }
  return [];
}

/**
 * Tải nội dung chi tiết 1 `ReadingPassage`.
 */
export async function loadReadingPassage(
  item: PassageCatalogItem,
  options: LoadContentOptions = {},
): Promise<ReadingPassage> {
  if (item.fixturePassage) {
    return item.fixturePassage;
  }
  if (item.file) {
    const silentOpts: LoadContentOptions = {
      isDev: false,
      onError: () => undefined,
      ...options,
    };
    return await loadContent(item.file, ReadingPassageSchema, silentOpts);
  }
  if (import.meta.env.MODE === 'test') {
    const { R1_FIXTURE_PASSAGES } = await import('../../test/fixtures/r1_fixtures');
    return R1_FIXTURE_PASSAGES.find((p) => p.id === item.id) ?? R1_FIXTURE_PASSAGES[0];
  }
  throw new Error(`Không tìm thấy file bài đọc cho ${item.id}.`);
}

export async function getR1Kv<T>(
  key: string,
  fallback: T,
  database: LexiconV3DB = db,
): Promise<T> {
  try {
    const row = await database.kv.get(key);
    if (row && row.value !== undefined) return row.value as T;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function setR1Kv<T>(
  key: string,
  value: T,
  database: LexiconV3DB = db,
): Promise<void> {
  try {
    await database.kv.put({ key, value });
  } catch {
    // Bỏ qua lỗi IndexedDB ở môi trường hạn chế
  }
}
