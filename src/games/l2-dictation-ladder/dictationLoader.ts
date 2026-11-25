import {
  loadContentArray,
  resolveAssetUrl,
  type LoadContentOptions,
} from '../../core/content/loaders';
import { DictationItemSchema, type DictationItem } from '../../core/content/schemas';
import { filterByAudioFile } from '../../core/audio/audioAvailability';

export interface LoadedDictationPool {
  items: DictationItem[];
  source: 'data';
  totalInDataset: number;
}

export interface LoadDictationPoolOptions extends LoadContentOptions {
  /**
   * Lọc câu theo file MP3 tồn tại thật bằng HEAD (mặc định `true` — L2-01, SR-22).
   * KHÔNG tin trường JSON; câu thiếu file audio bị loại để không bao giờ chấm FSRS khi không có âm thanh.
   */
  checkAudioExists?: boolean;
}

interface ManifestLike {
  files?: Record<string, unknown>;
}

/**
 * Load dictation items from `public/data/listening/dictation.json` (contract #79)
 * and filter to items whose MP3 file actually exists on disk (L2-01).
 * Never bundles or falls back to test fixtures in production (X6).
 */
export async function loadDictationPool(
  options: LoadDictationPoolOptions = {},
): Promise<LoadedDictationPool> {
  const { checkAudioExists = true, ...loadOpts } = options;
  const fetchFn = loadOpts.fetchImpl ?? globalThis.fetch;

  if (typeof fetchFn === 'function') {
    try {
      const manifestUrl = resolveAssetUrl('data/manifest.json', loadOpts.baseUrl);
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
          return { items: [], source: 'data', totalInDataset: 0 };
        }
      }
    } catch {
      // If manifest cannot be read, fall through to try direct load
    }

    const rawItems = await loadContentArray(
      'data/listening/dictation.json',
      DictationItemSchema,
      {
        isDev: false,
        onError: () => undefined,
        ...loadOpts,
      },
    );

    if (!checkAudioExists) {
      return { items: rawItems, source: 'data', totalInDataset: rawItems.length };
    }

    const withAudio = await filterByAudioFile(rawItems, (item) => item.audio, {
      fetchImpl: loadOpts.fetchImpl,
      baseUrl: loadOpts.baseUrl,
    });
    return { items: withAudio, source: 'data', totalInDataset: rawItems.length };
  }

  return { items: [], source: 'data', totalInDataset: 0 };
}
