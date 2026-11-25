import {
  loadContentArray,
  type LoadContentOptions,
} from '../../core/content/loaders';
import {
  ParaphraseItemSchema,
  type ParaphraseItem,
} from '../../core/content/schemas';
import { db, type LexiconV3DB } from '../../core/storage/db';

/**
 * Tải dữ liệu Paraphrase Radar từ `public/data/vocab/paraphrases.json`.
 * Chỉ nạp fixture ở môi trường `test` để không kéo `v2v3_fixtures` vào production bundle (X6).
 */
export async function loadV3Paraphrases(
  options: LoadContentOptions = {},
): Promise<ParaphraseItem[]> {
  try {
    const loaded = await loadContentArray(
      'data/vocab/paraphrases.json',
      ParaphraseItemSchema,
      options,
    );
    if (loaded.length > 0) return loaded;
  } catch {
    // fallback dưới đây chỉ dùng cho test
  }
  if (import.meta.env.MODE === 'test') {
    const { V3_FIXTURE_PARAPHRASES } = await import('../../test/fixtures/v2v3_fixtures');
    return [...V3_FIXTURE_PARAPHRASES];
  }
  return [];
}

export async function getV3Kv<T>(
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

export async function setV3Kv<T>(
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
