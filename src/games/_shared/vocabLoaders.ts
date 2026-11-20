import {
  loadContentArray,
  resolveAssetUrl,
  type LoadContentOptions,
} from '../../core/content/loaders';
import {
  CollocationItemSchema,
  ParaphraseItemSchema,
  VocabItemSchema,
  type CollocationItem,
  type ParaphraseItem,
  type VocabItem,
} from '../../core/content/schemas';
import { db, type LexiconV3DB } from '../../core/storage/db';
import {
  V2_FIXTURE_COLLOCATIONS,
  V2_FIXTURE_VOCAB,
  V3_FIXTURE_PARAPHRASES,
} from '../../test/fixtures/v2v3_fixtures';

/**
 * Load vocabulary items from `public/data/vocab/words.json`, falling back to or merging
 * with `V2_FIXTURE_VOCAB` so V2 headwords (impact, issue, knowledge, policy) are always available.
 */
export async function loadVocabItems(
  options: LoadContentOptions = {},
): Promise<VocabItem[]> {
  try {
    const loaded = await loadContentArray(
      'data/vocab/words.json',
      VocabItemSchema,
      options,
    );
    if (loaded.length === 0) {
      return [...V2_FIXTURE_VOCAB];
    }
    const seen = new Set(loaded.map((w) => w.id));
    const merged = [...loaded];
    for (const fixture of V2_FIXTURE_VOCAB) {
      if (!seen.has(fixture.id)) {
        merged.push(fixture);
      }
    }
    return merged;
  } catch {
    return [...V2_FIXTURE_VOCAB];
  }
}

/**
 * Load collocation items from `public/data/vocab/collocations.json`, falling back to
 * `V2_FIXTURE_COLLOCATIONS` if the JSON file is not merged yet or lacks >= 3 full headword forges.
 */
export async function loadCollocations(
  options: LoadContentOptions = {},
): Promise<CollocationItem[]> {
  try {
    const loaded = await loadContentArray(
      'data/vocab/collocations.json',
      CollocationItemSchema,
      options,
    );
    if (loaded.length === 0) {
      return [...V2_FIXTURE_COLLOCATIONS];
    }
    const seen = new Set(loaded.map((c) => c.id));
    const merged = [...loaded];
    for (const fixture of V2_FIXTURE_COLLOCATIONS) {
      if (!seen.has(fixture.id)) {
        merged.push(fixture);
      }
    }
    return merged;
  } catch {
    return [...V2_FIXTURE_COLLOCATIONS];
  }
}

/**
 * Load paraphrase radar items from `public/data/vocab/paraphrases.json`, falling back to
 * `V3_FIXTURE_PARAPHRASES` if the JSON file is not merged yet or has fewer than 12 items.
 */
export async function loadParaphrases(
  options: LoadContentOptions = {},
): Promise<ParaphraseItem[]> {
  try {
    const loaded = await loadContentArray(
      'data/vocab/paraphrases.json',
      ParaphraseItemSchema,
      options,
    );
    if (loaded.length < 12) {
      const seen = new Set(loaded.map((p) => p.id));
      const merged = [...loaded];
      for (const fixture of V3_FIXTURE_PARAPHRASES) {
        if (!seen.has(fixture.id)) {
          merged.push(fixture);
        }
      }
      return merged;
    }
    return loaded;
  } catch {
    return [...V3_FIXTURE_PARAPHRASES];
  }
}

/**
 * Play pre-rendered offline learning audio (.mp3) via HTMLAudioElement.
 * Strictly obeys AGENTS.md §3: never uses speechSynthesis for learning content.
 */
let currentAudio: HTMLAudioElement | null = null;

export async function playLearningAudio(
  relativePath?: string,
  onEnded?: () => void,
): Promise<boolean> {
  if (!relativePath || typeof Audio === 'undefined') {
    onEnded?.();
    return false;
  }
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    const url = resolveAssetUrl(relativePath);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.addEventListener('ended', () => {
      onEnded?.();
    });
    audio.addEventListener('error', () => {
      onEnded?.();
    });
    await audio.play();
    return true;
  } catch {
    onEnded?.();
    return false;
  }
}

export async function getGameKv<T>(
  key: string,
  fallback: T,
  database: LexiconV3DB = db,
): Promise<T> {
  try {
    const row = await database.kv.get(key);
    if (row && row.value !== undefined) {
      return row.value as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function setGameKv<T>(
  key: string,
  value: T,
  database: LexiconV3DB = db,
): Promise<void> {
  try {
    await database.kv.put({ key, value });
  } catch {
    // Ignore IndexedDB errors in constrained/test environments
  }
}
