import type { SRSCard } from '../srs/fsrsAdapter';
import type { ReviewRecord } from '../storage/db';

const MS_PER_DAY = 86_400_000;

/** Ngưỡng PP-16: ổn định >= 21 ngày và 3 lần ôn gần nhất đều đúng. */
export const MASTERED_MIN_STABILITY_DAYS = 21;
export const MASTERED_MIN_RECENT_CORRECT = 3;

/** Ngưỡng PP-07: thăm dò trễ >= 7 ngày kể từ lần ôn trước của cùng thẻ. */
export const DELAYED_PROBE_MIN_DAYS = 7;

export interface DelayedRetentionSummary {
  total: number;
  correct: number;
  /** Tỷ lệ giữ nhớ 0..1, hoặc null nếu chưa có lượt ôn cách nhau >= 7 ngày. */
  rate: number | null;
}

export interface MasteryMetrics {
  /** Số thẻ đạt chuẩn PP-16: stability >= 21 ngày && >= 3 lần gần nhất đúng. */
  masteredCount: number;
  /** Số thẻ có stability >= 21 ngày (bao gồm chưa đủ 3 lượt gần nhất đúng). */
  stableCount: number;
  /** Thăm dò trễ >= 7 ngày từ lịch sử ôn tập (PP-07). */
  delayedRetention: DelayedRetentionSummary;
}

/**
 * Kiểm tra một thẻ có đạt chuẩn "Từ vững" (PP-16) hay không:
 * stability >= 21 ngày VÀ >= 3 lần ôn gần nhất đều đúng.
 */
export function isCardMasteredPP16(
  card: Pick<SRSCard, 'id' | 'stability'>,
  cardReviews: ReadonlyArray<Pick<ReviewRecord, 'ts' | 'correct'>>,
): boolean {
  if ((card.stability ?? 0) < MASTERED_MIN_STABILITY_DAYS) return false;
  if (cardReviews.length < MASTERED_MIN_RECENT_CORRECT) return false;
  const sorted = [...cardReviews].sort((a, b) => b.ts - a.ts);
  for (let i = 0; i < MASTERED_MIN_RECENT_CORRECT; i++) {
    if (!sorted[i].correct) return false;
  }
  return true;
}

/**
 * Tính các chỉ số "Từ vững" (PP-16) và tỷ lệ giữ nhớ thăm dò trễ >= 7 ngày (PP-07)
 * trực tiếp từ bảng `cards` và `reviews`.
 */
export function computeMasteryMetrics(
  cards: ReadonlyArray<Pick<SRSCard, 'id' | 'stability'>>,
  reviews: ReadonlyArray<Pick<ReviewRecord, 'cardId' | 'ts' | 'correct'>>,
): MasteryMetrics {
  const byCard = new Map<string, Array<Pick<ReviewRecord, 'ts' | 'correct'>>>();
  for (const r of reviews) {
    let list = byCard.get(r.cardId);
    if (!list) {
      list = [];
      byCard.set(r.cardId, list);
    }
    list.push({ ts: r.ts, correct: r.correct });
  }

  let stableCount = 0;
  let masteredCount = 0;
  for (const card of cards) {
    if ((card.stability ?? 0) >= MASTERED_MIN_STABILITY_DAYS) {
      stableCount += 1;
      const list = byCard.get(card.id) ?? [];
      if (isCardMasteredPP16(card, list)) {
        masteredCount += 1;
      }
    }
  }

  let delayedTotal = 0;
  let delayedCorrect = 0;
  const minGapMs = DELAYED_PROBE_MIN_DAYS * MS_PER_DAY;
  for (const list of byCard.values()) {
    if (list.length < 2) continue;
    const asc = [...list].sort((a, b) => a.ts - b.ts);
    for (let i = 1; i < asc.length; i++) {
      if (asc[i].ts - asc[i - 1].ts >= minGapMs) {
        delayedTotal += 1;
        if (asc[i].correct) delayedCorrect += 1;
      }
    }
  }

  return {
    masteredCount,
    stableCount,
    delayedRetention: {
      total: delayedTotal,
      correct: delayedCorrect,
      rate: delayedTotal > 0 ? delayedCorrect / delayedTotal : null,
    },
  };
}
