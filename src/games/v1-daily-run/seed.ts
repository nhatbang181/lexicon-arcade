/**
 * RNG có seed cho V1: cùng (thẻ, lần ôn, ngày) cho cùng kết quả (test được),
 * khác `reps`/ngày cho vị trí và nhiễu khác (V1-4, V1-5).
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

/** Ngày theo giờ máy (YYYY-MM-DD), dùng làm một phần của seed. */
export function localDayKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Đặt `correct` vào vị trí do seed chọn trong danh sách `distractors` đã xáo. */
export function placeCorrectSeeded<T>(
  correct: T,
  distractors: readonly T[],
  rng: () => number,
): { choices: T[]; correctIndex: number } {
  const pos = Math.floor(rng() * (distractors.length + 1));
  const choices = [...distractors.slice(0, pos), correct, ...distractors.slice(pos)];
  return { choices, correctIndex: pos };
}
