import {
  loadContentArray,
  resolveAssetUrl,
  type LoadContentOptions,
} from '../../core/content/loaders';
import {
  CollocationItemSchema,
  VocabItemSchema,
  type CollocationItem,
  type VocabItem,
} from '../../core/content/schemas';
import { db, type LexiconV3DB } from '../../core/storage/db';

/**
 * Tải từ vựng cho V2 từ `public/data/vocab/words.json`.
 * Chỉ nạp fixture ở môi trường `test` để không kéo `v2v3_fixtures` vào production bundle (X6).
 */
export async function loadV2VocabItems(
  options: LoadContentOptions = {},
): Promise<VocabItem[]> {
  try {
    const loaded = await loadContentArray(
      'data/vocab/words.json',
      VocabItemSchema,
      options,
    );
    if (loaded.length > 0) return loaded;
  } catch {
    // fallback dưới đây chỉ cho test
  }
  if (import.meta.env.MODE === 'test') {
    const { V2_FIXTURE_VOCAB } = await import('../../test/fixtures/v2v3_fixtures');
    return [...V2_FIXTURE_VOCAB];
  }
  return [];
}

/**
 * Tải collocations cho V2 từ `public/data/vocab/collocations.json`.
 * Không kéo `v2v3_fixtures` vào production bundle (X6).
 */
export async function loadV2Collocations(
  options: LoadContentOptions = {},
): Promise<CollocationItem[]> {
  try {
    const loaded = await loadContentArray(
      'data/vocab/collocations.json',
      CollocationItemSchema,
      options,
    );
    if (loaded.length > 0) return loaded;
  } catch {
    // fallback dưới đây chỉ cho test
  }
  if (import.meta.env.MODE === 'test') {
    const { V2_FIXTURE_COLLOCATIONS } = await import('../../test/fixtures/v2v3_fixtures');
    return [...V2_FIXTURE_COLLOCATIONS];
  }
  return [];
}

let currentAudio: HTMLAudioElement | null = null;

export async function playV2LearningAudio(
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
    audio.addEventListener('ended', () => onEnded?.());
    audio.addEventListener('error', () => onEnded?.());
    await audio.play();
    return true;
  } catch {
    onEnded?.();
    return false;
  }
}

export async function getV2Kv<T>(
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

export async function setV2Kv<T>(
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
