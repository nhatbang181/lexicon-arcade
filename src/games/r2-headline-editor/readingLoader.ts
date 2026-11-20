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

function getFixtureHeadingPassages(): ReadingPassage[] {
  return R1_FIXTURE_PASSAGES.filter((p) =>
    p.questionGroups.some((g) => g.type === 'headings'),
  );
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
 * Load training reading passages that contain a Matching Headings (`headings`) group.
 * Reads `public/data/reading/index.json` (excluding `reserved` exam passages),
 * falling back cleanly to `R1_FIXTURE_PASSAGES` when real data files are absent.
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
    // Fallback to fixture passages below
  }

  return getFixtureHeadingPassages().map(toCatalogItem);
}

/**
 * Load a full `ReadingPassage` with a `headings` group from a catalog item.
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
    try {
      const passage = await loadContent(item.file, ReadingPassageSchema, silentOpts);
      if (passage.questionGroups.some((g) => g.type === 'headings')) {
        return passage;
      }
    } catch {
      // Fallback below
    }
  }

  const fixtures = getFixtureHeadingPassages();
  return fixtures.find((p) => p.id === item.id) ?? fixtures[0];
}
