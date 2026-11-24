import type { VocabItem } from '../../core/content/schemas';
import { createNewCard, type SRSCard } from '../../core/srs/fsrsAdapter';

export const STARTER_CARD_COUNT = 15;

/**
 * Bộ thẻ khởi động THẬT từ `words.json` cho người chưa làm placement (V1-3):
 * từ học thuật B2/C1 thường gặp nhất. Thẻ `recog` mới → V1 hiện giới thiệu rồi ôn.
 */
export function buildStarterVocabCards(
  vocab: readonly VocabItem[],
  now: Date = new Date(),
  count = STARTER_CARD_COUNT,
): SRSCard[] {
  const pool = vocab.filter((v) => v.cefr === 'B2' || v.cefr === 'C1');
  const source = pool.length >= count ? pool : [...vocab];
  const picked = [...source]
    .sort((a, b) => (b.freqZipf ?? 0) - (a.freqZipf ?? 0) || a.id.localeCompare(b.id))
    .slice(0, count);
  return picked.map((v, i) =>
    createNewCard(v.id, 'recog', {
      now: new Date(now.getTime() - (count - i) * 1000),
      unlocked: true,
      source: 'curriculum',
    }),
  );
}
