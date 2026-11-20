import { z } from 'zod';
import {
  filterTrainingPool,
  loadContent,
  loadContentArray,
  type LoadContentOptions,
} from '../../core/content/loaders';
import {
  ListeningEpisodeSchema,
  ListeningQTypeSchema,
  type ListeningEpisode,
} from '../../core/content/schemas';
import { L1_FIXTURE_EPISODES } from '../../test/fixtures/l1_fixtures';

/**
 * Contract agreed with r-data-listening (board #79) for `public/data/listening/index.json`.
 */
export const ListeningIndexEntrySchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  part: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  reserved: z.boolean().optional().default(false),
  title: z.string().min(1),
  contextEn: z.string().optional().default(''),
  difficulty: z.number().int().min(1).max(10).optional().default(3),
  accents: z.array(z.enum(['uk', 'us', 'au', 'nz', 'ca'])).optional().default(['uk']),
  channel: z.enum(['normal', 'phone']).optional().default('normal'),
  audioPath: z.string().optional(),
  durationSec: z.number().positive().optional().default(180),
  questionCount: z.number().int().positive().optional().default(10),
  questionTypes: z.array(ListeningQTypeSchema).optional().default([]),
  hasMap: z.boolean().optional().default(false),
  trapCount: z.number().int().min(0).optional().default(0),
});

export type ListeningIndexEntry = z.infer<typeof ListeningIndexEntrySchema>;

export interface EpisodeCatalogItem {
  id: string;
  part: 1 | 2 | 3 | 4;
  reserved: boolean;
  title: string;
  contextEn: string;
  difficulty: number;
  accents: Array<'uk' | 'us' | 'au' | 'nz' | 'ca'>;
  channel: 'normal' | 'phone';
  audioPath?: string;
  durationSec: number;
  questionCount: number;
  questionTypes: string[];
  hasMap: boolean;
  trapCount: number;
  /** Relative path to episode JSON under `public/` when backed by real data */
  file?: string;
  /** Pre-loaded fixture episode */
  fixtureEpisode?: ListeningEpisode;
}

function fixtureToCatalogItem(ep: ListeningEpisode): EpisodeCatalogItem {
  const questionCount = ep.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  const trapCount = ep.questionGroups.reduce(
    (sum, g) => sum + g.questions.reduce((s, q) => s + q.traps.length, 0),
    0,
  );
  const questionTypes = Array.from(new Set(ep.questionGroups.map((g) => g.type)));
  const hasMap = ep.questionGroups.some((g) => Boolean(g.map) || g.type === 'map_labelling');
  const accents = Array.from(new Set(ep.speakers.map((s) => s.accent)));

  return {
    id: ep.id,
    part: ep.part,
    reserved: ep.reserved === true,
    title: ep.title,
    contextEn: ep.contextEn,
    difficulty: ep.difficulty,
    accents,
    channel: ep.channel ?? 'normal',
    audioPath: ep.audio.path,
    durationSec: ep.audio.durationSec,
    questionCount,
    questionTypes,
    hasMap,
    trapCount,
    fixtureEpisode: ep,
  };
}

/**
 * Load available training listening episodes catalog from `public/data/listening/index.json`
 * (filtering out `reserved` exam episodes per [INV-X1]), falling back gracefully to
 * `L1_FIXTURE_EPISODES` when real data files are not yet present on disk.
 */
export async function loadListeningCatalog(
  options: LoadContentOptions = {},
): Promise<EpisodeCatalogItem[]> {
  const silentOpts: LoadContentOptions = {
    isDev: false,
    onError: () => undefined,
    ...options,
  };

  try {
    const entries = await loadContentArray(
      'data/listening/index.json',
      ListeningIndexEntrySchema,
      silentOpts,
    );
    const trainingEntries = filterTrainingPool(entries);
    if (trainingEntries.length > 0) {
      return trainingEntries.map((entry) => ({
        id: entry.id,
        part: entry.part,
        reserved: entry.reserved === true,
        title: entry.title,
        contextEn: entry.contextEn,
        difficulty: entry.difficulty,
        accents: entry.accents,
        channel: entry.channel,
        audioPath: entry.audioPath,
        durationSec: entry.durationSec,
        questionCount: entry.questionCount,
        questionTypes: entry.questionTypes,
        hasMap: entry.hasMap,
        trapCount: entry.trapCount,
        file: entry.file,
      }));
    }
  } catch {
    // Graceful fallback to fixtures when data/listening/index.json is unavailable
  }

  return L1_FIXTURE_EPISODES.map(fixtureToCatalogItem);
}

/**
 * Load a single full `ListeningEpisode` from a catalog item.
 * Falls back to matching fixture or first fixture if fetch fails.
 */
export async function loadListeningEpisode(
  item: EpisodeCatalogItem,
  options: LoadContentOptions = {},
): Promise<ListeningEpisode> {
  if (item.fixtureEpisode) {
    return item.fixtureEpisode;
  }
  if (item.file) {
    const silentOpts: LoadContentOptions = {
      isDev: false,
      onError: () => undefined,
      ...options,
    };
    try {
      return await loadContent(item.file, ListeningEpisodeSchema, silentOpts);
    } catch {
      // Fallback below
    }
  }
  return L1_FIXTURE_EPISODES.find((e) => e.id === item.id) ?? L1_FIXTURE_EPISODES[0];
}
