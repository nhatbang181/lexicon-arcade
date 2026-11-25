import { useEffect, useState, useSyncExternalStore } from 'react';
import { db } from '../../core/storage/db';

/**
 * Khoá lưu cấu hình chuyển động & nhân vật trong bảng `kv` (và mirror sang `localStorage`).
 * Export cho T3-C gắn công tắc ở màn Cài đặt.
 */
export const FX_KV_KEYS = {
  REDUCED_MOTION: 'pref:reducedMotion',
  DISABLE_PARTICLES: 'pref:disableParticles',
  DISABLE_HAPTIC: 'pref:disableHaptic',
  SHOW_MASCOT: 'pref:showMascot',
  MASCOT_NAME: 'pref:mascotName',
} as const;

export interface MotionPrefValues {
  prefReducedMotion: boolean;
  disableParticles: boolean;
  disableHaptic: boolean;
  showMascot: boolean;
  mascotName: string;
}

export interface MotionPrefState extends MotionPrefValues {
  osReduced: boolean;
  reducedMotion: boolean;
  setPref: (patch: Partial<MotionPrefValues>) => void;
}

const DEFAULT_PREFS: MotionPrefValues = {
  prefReducedMotion: false,
  disableParticles: false,
  disableHaptic: false,
  showMascot: true,
  mascotName: 'Lexi',
};

const FIELD_MAP: ReadonlyArray<readonly [keyof MotionPrefValues, string, 'bool' | 'str']> = [
  ['prefReducedMotion', FX_KV_KEYS.REDUCED_MOTION, 'bool'],
  ['disableParticles', FX_KV_KEYS.DISABLE_PARTICLES, 'bool'],
  ['disableHaptic', FX_KV_KEYS.DISABLE_HAPTIC, 'bool'],
  ['showMascot', FX_KV_KEYS.SHOW_MASCOT, 'bool'],
  ['mascotName', FX_KV_KEYS.MASCOT_NAME, 'str'],
];

const LS_PREFIX = 'lexicon:';

function loadInitialPrefs(): MotionPrefValues {
  const out: MotionPrefValues = { ...DEFAULT_PREFS };
  try {
    if (typeof localStorage === 'undefined') return out;
    for (const [field, key, kind] of FIELD_MAP) {
      const raw = localStorage.getItem(LS_PREFIX + key);
      if (raw === null) continue;
      if (kind === 'bool') (out as unknown as Record<string, unknown>)[field] = raw === 'true' || raw === '1';
      else if (raw.trim()) (out as unknown as Record<string, unknown>)[field] = raw.trim();
    }
  } catch {
    // ignore storage errors
  }
  return out;
}

let currentPrefs: MotionPrefValues = loadInitialPrefs();
let hydratedFromDb = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export const subscribeMotionPref = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getMotionPrefSnapshot = (): MotionPrefValues => currentPrefs;

export function getOsReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export const isReducedMotionActive = (): boolean => getOsReducedMotion() || currentPrefs.prefReducedMotion;

export function setMotionPref(patch: Partial<MotionPrefValues>): void {
  const next: MotionPrefValues = { ...currentPrefs, ...patch };
  const kvWrites: Array<{ key: string; value: boolean | string }> = [];
  let changed = false;

  for (const [field, key] of FIELD_MAP) {
    if (patch[field] !== undefined && next[field] !== currentPrefs[field]) {
      changed = true;
    }
    if (patch[field] !== undefined) {
      const val = next[field];
      try {
        localStorage?.setItem(LS_PREFIX + key, String(val));
      } catch {
        // ignore
      }
      kvWrites.push({ key, value: val });
    }
  }
  if (!changed) return;
  currentPrefs = next;
  notify();

  if (kvWrites.length > 0 && typeof indexedDB !== 'undefined') {
    void db.kv.bulkPut(kvWrites).catch(() => undefined);
  }
}

export async function hydrateMotionPrefFromDb(): Promise<void> {
  if (hydratedFromDb || typeof indexedDB === 'undefined') return;
  hydratedFromDb = true;
  try {
    const rows = await db.kv.bulkGet(FIELD_MAP.map((f) => f[1]));
    const next: MotionPrefValues = { ...currentPrefs };
    let changed = false;
    rows.forEach((row, i) => {
      if (!row) return;
      const [field, , kind] = FIELD_MAP[i];
      if (kind === 'bool' && typeof row.value === 'boolean' && next[field] !== row.value) {
        (next as unknown as Record<string, unknown>)[field] = row.value;
        changed = true;
      } else if (kind === 'str' && typeof row.value === 'string' && row.value.trim() && next[field] !== row.value.trim()) {
        (next as unknown as Record<string, unknown>)[field] = row.value.trim();
        changed = true;
      }
    });
    if (changed) {
      currentPrefs = next;
      notify();
    }
  } catch {
    // ignore
  }
}

export function resetMotionPrefForTest(): void {
  currentPrefs = { ...DEFAULT_PREFS };
  hydratedFromDb = false;
  try {
    for (const [, key] of FIELD_MAP) localStorage?.removeItem(LS_PREFIX + key);
  } catch {
    // ignore
  }
  notify();
}

export function useMotionPref(): MotionPrefState {
  const prefs = useSyncExternalStore(subscribeMotionPref, getMotionPrefSnapshot, () => DEFAULT_PREFS);
  const [osReduced, setOsReduced] = useState<boolean>(getOsReducedMotion);

  useEffect(() => {
    void hydrateMotionPrefFromDb();
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return {
    ...prefs,
    osReduced,
    reducedMotion: osReduced || prefs.prefReducedMotion,
    setPref: setMotionPref,
  };
}
