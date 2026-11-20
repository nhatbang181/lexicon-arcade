import { loadContent, clearContentCache, type LoadContentOptions } from './loaders';
import { ManifestSchema, type Manifest, type ManifestFileEntry } from './schemas';

export const MANIFEST_PATH = 'data/manifest.json';

let cachedManifest: Manifest | null = null;

export async function loadManifest(options: LoadContentOptions = {}): Promise<Manifest> {
  if (!options.bypassCache && cachedManifest) {
    return cachedManifest;
  }
  const manifest = await loadContent(MANIFEST_PATH, ManifestSchema, options);
  cachedManifest = manifest;
  return manifest;
}

export function getManifestFileEntry(
  manifest: Manifest,
  relativePath: string,
): ManifestFileEntry | undefined {
  const normalized = relativePath.replace(/^\/+/, '');
  return manifest.files[normalized] ?? manifest.files[`data/${normalized}`];
}

export function clearManifestCache(): void {
  cachedManifest = null;
  clearContentCache();
}
