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

const R2ReadingIndexEntrySchema = z.object({
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
  hasHeadings: z.boolean().optional(),
});

export interface HeadlineCatalogItem {
  id: string;
  level: 'P1' | 'P2' | 'P3';
  title: string;
  subtitle?: string;
  topic: string;
  wordCount: number;
  paragraphCount: number;
  file?: string;
  fixturePassage?: ReadingPassage;
}

function toCatalogItem(p: ReadingPassage): HeadlineCatalogItem {
  return {
    id: p.id,
    level: p.level,
    title: p.title,
    subtitle: p.subtitle,
    topic: p.topic,
    wordCount: p.wordCount,
    paragraphCount: p.paragraphs.length,
    fixturePassage: p,
  };
}

/**
 * Tải danh mục bài đọc có Matching Headings (`headings`) từ `public/data/reading/index.json`.
 * Chỉ nạp `r1_fixtures` ở `MODE === 'test'` để không kéo vào production bundle (X6).
 */
export async function loadHeadlineCatalog(
  options: LoadContentOptions = {},
): Promise<HeadlineCatalogItem[]> {
  const silentOpts: LoadContentOptions = {
    isDev: false,
    onError: () => undefined,
    ...options,
  };

  try {
    const entries = await loadContentArray(
      'data/reading/index.json',
      R2ReadingIndexEntrySchema,
      silentOpts,
    );
    const training = filterTrainingPool(entries).filter(
      (entry) => Boolean(entry.hasHeadings) || entry.questionTypes.includes('headings'),
    );
    if (training.length > 0) {
      return training.map((entry) => ({
        id: entry.id,
        level: entry.level,
        title: entry.title,
        subtitle: entry.subtitle,
        topic: entry.topic,
        wordCount: entry.wordCount,
        paragraphCount: entry.paragraphCount,
        file: entry.file,
      }));
    }
  } catch {
    // Fallback chỉ dành cho test
  }

  if (import.meta.env.MODE === 'test') {
    const { R1_FIXTURE_PASSAGES } = await import('../../test/fixtures/r1_fixtures');
    return R1_FIXTURE_PASSAGES.filter((p) =>
      p.questionGroups.some((g) => g.type === 'headings'),
    ).map(toCatalogItem);
  }
  return [];
}

/**
 * Tải nội dung chi tiết `ReadingPassage` cho R2.
 */
export async function loadHeadlinePassage(
  item: HeadlineCatalogItem,
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
    const passage = await loadContent(item.file, ReadingPassageSchema, silentOpts);
    if (passage.questionGroups.some((g) => g.type === 'headings')) {
      return passage;
    }
  }

  if (import.meta.env.MODE === 'test') {
    const { R1_FIXTURE_PASSAGES } = await import('../../test/fixtures/r1_fixtures');
    const fixtures = R1_FIXTURE_PASSAGES.filter((p) =>
      p.questionGroups.some((g) => g.type === 'headings'),
    );
    return fixtures.find((p) => p.id === item.id) ?? fixtures[0];
  }
  throw new Error(`Không tìm thấy bài đọc Matching Headings cho ${item.id}.`);
}

export async function getR2Kv<T>(
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

export async function setR2Kv<T>(
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
