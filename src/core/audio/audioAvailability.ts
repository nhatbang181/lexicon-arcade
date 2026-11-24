import { resolveAssetUrl } from '../content/loaders';

/**
 * Kiểm file audio có THẬT trên máy chủ không (L1-01, L2-01). Không tin cờ trong JSON:
 * dữ liệu có thể ghi `path` nhưng file chưa render (`sha256: "pending"`).
 *
 * - HEAD không ok (404…) → thiếu.
 * - Dev server / SPA fallback trả 200 + HTML cho đường dẫn không tồn tại → coi `text/html` là thiếu.
 * - Lỗi mạng (offline) → coi là có: không đủ bằng chứng để ẩn bài; nếu file thật sự không tải được thì
 *   trình phát báo lỗi và không cho bắt đầu.
 * Logic thuần, không React/DOM (chỉ cần `fetch`).
 */
export interface AudioAvailabilityOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

const cache = new Map<string, Promise<boolean>>();

export function clearAudioAvailabilityCache(): void {
  cache.clear();
}

export function audioFileExists(
  relativePath: string,
  options: AudioAvailabilityOptions = {},
): Promise<boolean> {
  if (!relativePath) return Promise.resolve(false);
  const url = resolveAssetUrl(relativePath, options.baseUrl);
  const cacheable = !options.fetchImpl;
  if (cacheable) {
    const hit = cache.get(url);
    if (hit) return hit;
  }
  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  const probe = (async () => {
    if (typeof fetchFn !== 'function') return true;
    try {
      const res = await fetchFn(url, { method: 'HEAD' });
      if (!res.ok) return false;
      const type = res.headers?.get?.('content-type') ?? '';
      return !/text\/html/i.test(type);
    } catch {
      return true;
    }
  })();
  if (cacheable) cache.set(url, probe);
  return probe;
}

/** Giữ lại các mục có file audio thật (song song). Thứ tự gốc được giữ nguyên. */
export async function filterByAudioFile<T>(
  items: readonly T[],
  pathOf: (item: T) => string | undefined,
  options: AudioAvailabilityOptions = {},
): Promise<T[]> {
  const flags = await Promise.all(
    items.map((item) => {
      const path = pathOf(item);
      return path ? audioFileExists(path, options) : Promise.resolve(false);
    }),
  );
  return items.filter((_, i) => flags[i]);
}
