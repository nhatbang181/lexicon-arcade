import type { ZodType } from 'zod';

export interface LoadContentOptions {
  baseUrl?: string;
  isDev?: boolean;
  bypassCache?: boolean;
  fetchImpl?: typeof fetch;
  onError?: (message: string, details?: unknown) => void;
}

const contentCache = new Map<string, unknown>();

function getDefaultBaseUrl(): string {
  try {
    const env = (import.meta as unknown as { env?: { BASE_URL?: string } }).env;
    if (env && typeof env.BASE_URL === 'string' && env.BASE_URL.length > 0) {
      return env.BASE_URL;
    }
  } catch {
    // Fallback outside Vite runtime
  }
  return '/';
}

function getDefaultIsDev(): boolean {
  try {
    const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
    if (env && typeof env.DEV === 'boolean') {
      return env.DEV;
    }
  } catch {
    // Fallback
  }
  return false;
}

export function resolveAssetUrl(relativePath: string, baseUrl?: string): string {
  const base = baseUrl ?? getDefaultBaseUrl();
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.replace(/^\/+/, '');
  return `${cleanBase}${cleanPath}`;
}

export async function loadContent<T>(
  relativePath: string,
  schema: ZodType<T>,
  options: LoadContentOptions = {},
): Promise<T> {
  const url = resolveAssetUrl(relativePath, options.baseUrl);
  if (!options.bypassCache && contentCache.has(url)) {
    return contentCache.get(url) as T;
  }

  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    throw new Error(`Fetch API is not available to load ${url}`);
  }

  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`Failed to load content "${url}": HTTP ${res.status}`);
  }

  const raw: unknown = await res.json();
  const isDev = options.isDev ?? getDefaultIsDev();

  if (isDev) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Content schema validation failed for "${url}": ${parsed.error.message}`,
      );
    }
    contentCache.set(url, parsed.data);
    return parsed.data;
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const reporter = options.onError ?? ((msg, err) => console.error(msg, err));
    reporter(`Content schema validation warning for "${url}"`, parsed.error);
    throw new Error(`Invalid content payload at "${url}"`);
  }

  contentCache.set(url, parsed.data);
  return parsed.data;
}

export async function loadContentArray<T>(
  relativePath: string,
  itemSchema: ZodType<T>,
  options: LoadContentOptions = {},
): Promise<T[]> {
  const url = resolveAssetUrl(relativePath, options.baseUrl);
  if (!options.bypassCache && contentCache.has(url)) {
    return contentCache.get(url) as T[];
  }

  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    throw new Error(`Fetch API is not available to load ${url}`);
  }

  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`Failed to load content "${url}": HTTP ${res.status}`);
  }

  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) {
    throw new Error(`Expected array payload at "${url}"`);
  }

  const isDev = options.isDev ?? getDefaultIsDev();
  const reporter = options.onError ?? ((msg, err) => console.error(msg, err));
  const validItems: T[] = [];

  for (let i = 0; i < raw.length; i++) {
    const parsed = itemSchema.safeParse(raw[i]);
    if (parsed.success) {
      validItems.push(parsed.data);
    } else if (isDev) {
      throw new Error(
        `Content schema validation failed for "${url}" at index ${i}: ${parsed.error.message}`,
      );
    } else {
      reporter(`Skipping invalid content item at "${url}"[${i}]`, parsed.error);
    }
  }

  contentCache.set(url, validItems);
  return validItems;
}

/**
 * [INV-X1] Reserved exam items must never appear in training pools (L1/R1/R2).
 */
export function filterTrainingPool<T extends { reserved?: boolean }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => item.reserved !== true);
}

export function clearContentCache(): void {
  contentCache.clear();
}

export function getContentCacheSize(): number {
  return contentCache.size;
}
