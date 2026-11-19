/// <reference types="vite/client" />

/**
 * Resolves an asset or public data path taking into account the base URL
 * (e.g. GitHub Pages repo subpath '/lexicon-arcade/' vs localhost '/')
 */
export function getAssetPath(path: string): string {
  const metaEnv = (import.meta as unknown as { env?: { BASE_URL?: string } }).env;
  const base = metaEnv?.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (base.endsWith('/')) {
    return `${base}${cleanPath}`;
  }
  return `${base}/${cleanPath}`;
}
