/**
 * RNG có seed cho game (V2-1/V2-5, V3-3, R1-1, R2-1): cùng seed cho cùng kết quả (test được),
 * seed khác cho vị trí/thứ tự khác. Logic thuần, không React, không DOM.
 * (Bản sao nhỏ trong từng game vì game không import game khác.)
 */

export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seededRng(key: string): () => number {
  let a = hashString(key) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ngày theo giờ máy (YYYY-MM-DD) – dùng làm một phần của seed theo ngày. */
export function localDayKey(now: Date | number): string {
  const d = typeof now === 'number' ? new Date(now) : now;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
