import {
  loadContentArray,
  resolveAssetUrl,
  type LoadContentOptions,
} from '../../core/content/loaders';
import { DictationItemSchema, type DictationItem } from '../../core/content/schemas';
import { L2_FIXTURES } from '../../test/fixtures/l2_fixtures';

export interface LoadedDictationPool {
  items: DictationItem[];
  source: 'data' | 'fixture';
}

interface ManifestLike {
  files?: Record<string, unknown>;
}

/**
 * Load dictation items from `public/data/listening/dictation.json` (contract #79).
 * Checks `public/data/manifest.json` first so missing optional data files never emit noisy 404 errors,
 * and falls back smoothly to `L2_FIXTURES` (12 items spanning levels 1–6).
 */
export async function loadDictationPool(
  options: LoadContentOptions = {},
): Promise<LoadedDictationPool> {
  const fetchFn = options.fetchImpl ?? globalThis.fetch;

  if (typeof fetchFn === 'function') {
    try {
      const manifestUrl = resolveAssetUrl('data/manifest.json', options.baseUrl);
      const manifestRes = await fetchFn(manifestUrl);
      if (manifestRes.ok) {
        const manifest = (await manifestRes.json()) as ManifestLike;
        const hasDictation =
          manifest?.files !== undefined &&
          (Object.prototype.hasOwnProperty.call(manifest.files, 'listening/dictation.json') ||
            Object.prototype.hasOwnProperty.call(
              manifest.files,
              'data/listening/dictation.json',
            ));

        if (!hasDictation) {
          return { items: [...L2_FIXTURES], source: 'fixture' };
        }
      }
    } catch {
      // If manifest cannot be read, fall through to try direct load or fixtures
    }

    try {
      const items = await loadContentArray(
        'data/listening/dictation.json',
        DictationItemSchema,
        {
          isDev: false,
          onError: () => undefined,
          ...options,
        },
      );
      if (items.length > 0) {
        return { items, source: 'data' };
      }
    } catch {
      // Graceful fallback to fixtures
    }
  }

  return { items: [...L2_FIXTURES], source: 'fixture' };
}
