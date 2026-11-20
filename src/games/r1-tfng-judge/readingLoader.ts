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
import { R1_FIXTURE_PASSAGES } from '../../test/fixtures/r1_fixtures';

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
  /** Non-empty relative path when backed by `public/data/reading/passages/*.json` */
  file?: string;
  /** Pre-loaded passage (for fixture entries) */
  fixturePassage?: ReadingPassage;
}

function fixtureToCatalogItem(p: ReadingPassage): PassageCatalogItem {
  const questionCount = p.questionGroups.reduce((acc, g) => acc + g.questions.length, 0);
  const hasJudgeQuestions = p.questionGroups.some((g) => g.type === 'tfng' || g.type === 'ynng');
  return {
    id: p.id,
    level: p.level,
    title: p.title,
    subtitle: p.subtitle,
    topic: p.topic,
    wordCount: p.wordCount,
    questionCount,
    hasJudgeQuestions,
    fixturePassage: p,
  };
}

/**
 * Load available training reading passages catalog from `public/data/reading/index.json`
 * (filtering out `reserved` exam passages per [INV-X1]), falling back gracefully to
 * `R1_FIXTURE_PASSAGES` when real data files are not present yet.
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
      return trainingEntries.map((entry) => ({
        id: entry.id,
        level: entry.level,
        title: entry.title,
        subtitle: entry.subtitle,
        topic: entry.topic,
        wordCount: entry.wordCount,
        questionCount: entry.questionCount,
        hasJudgeQuestions:
          Boolean(entry.hasTfng) ||
          Boolean(entry.hasYnng) ||
          entry.questionTypes.includes('tfng') ||
          entry.questionTypes.includes('ynng'),
        file: entry.file,
      }));
    }
  } catch {
    // Graceful fallback to fixtures when data/reading/index.json is unavailable
  }

  return R1_FIXTURE_PASSAGES.map(fixtureToCatalogItem);
}

/**
 * Load a single full `ReadingPassage` from a catalog item.
 * Falls back to matching fixture or first fixture if fetch fails.
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
    try {
      return await loadContent(item.file, ReadingPassageSchema, silentOpts);
    } catch {
      // Fallback below
    }
  }
  return (
    R1_FIXTURE_PASSAGES.find((p) => p.id === item.id) ??
    R1_FIXTURE_PASSAGES[0]
  );
}
