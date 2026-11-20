import { State } from 'ts-fsrs';
import { isCardRetired } from './faces';
import { getCardRetrievability, type SRSCard } from './fsrsAdapter';

export type QueueBucket = 'overdue' | 'leech' | 'new';

export interface QueuedCard {
  card: SRSCard;
  bucket: QueueBucket;
  retrievability: number;
  isLeech: boolean;
}

export interface ReviewQueueOptions {
  now?: Date;
  /** Daily ceiling of new cards (default 15, docs/02 §3.5). */
  newCardsLimit?: number;
  /** Number of new cards already studied today (default 0). */
  newCardsDoneToday?: number;
  /** Trigger backlog cap when due reviews exceed this count (default 200). */
  backlogWarningThreshold?: number;
  /** Maximum due reviews taken in one run when backlog triggers (default 120). */
  maxBacklog?: number;
  /** Lapses threshold for leech tagging (default 4). */
  leechThreshold?: number;
  /** Number of review cards between each interleaved new card (default 4, docs/02 §3.5). */
  reviewsPerNew?: number;
  /** Optional cap on total cards returned for this session. */
  sessionLimit?: number;
}

export interface ReviewQueueResult {
  queue: QueuedCard[];
  stats: {
    dueTotal: number;
    overdueCount: number;
    leechCount: number;
    newCount: number;
    backlogWarning: boolean;
  };
}

/**
 * Rearrange a sequence greedily so two cards sharing the same `itemId`
 * do not appear consecutively whenever a non-adjacent alternative exists.
 */
function deClusterByItemId(items: QueuedCard[]): QueuedCard[] {
  if (items.length <= 2) return items;
  const remaining = [...items];
  const result: QueuedCard[] = [];

  while (remaining.length > 0) {
    const prevItemId = result.length > 0 ? result[result.length - 1].card.itemId : null;
    let pickIdx = 0;
    if (prevItemId !== null && remaining[0].card.itemId === prevItemId) {
      const alt = remaining.findIndex((x) => x.card.itemId !== prevItemId);
      if (alt !== -1) {
        pickIdx = alt;
      }
    }
    result.push(remaining.splice(pickIdx, 1)[0]);
  }
  return result;
}

/**
 * Build the prioritized, interleaved SRS review queue:
 * 1. Overdue review cards (sorted by lowest retrievability, then oldest due)
 * 2. Due leech cards (lapses >= leechThreshold)
 * 3. New cards up to remaining daily ceiling, interleaved at 1 new per 4 reviews
 * 4. Anti-clustering ensures two faces of the same headword/itemId are not adjacent.
 */
export function buildReviewQueue(
  cards: readonly SRSCard[],
  options: ReviewQueueOptions = {},
): ReviewQueueResult {
  const {
    now = new Date(),
    newCardsLimit = 15,
    newCardsDoneToday = 0,
    backlogWarningThreshold = 200,
    maxBacklog = 120,
    leechThreshold = 4,
    reviewsPerNew = 4,
    sessionLimit,
  } = options;

  const nowMs = now.getTime();
  const eligible = cards.filter(
    (c) => c.unlocked && c.face !== 'intro' && !isCardRetired(c),
  );

  const overdue: QueuedCard[] = [];
  const leeches: QueuedCard[] = [];
  const newPool: QueuedCard[] = [];

  for (const card of eligible) {
    if (card.state === State.New) {
      newPool.push({
        card,
        bucket: 'new',
        retrievability: 0,
        isLeech: false,
      });
    } else if (card.due <= nowMs) {
      const ret = getCardRetrievability(card, now);
      const isLeech = card.lapses >= leechThreshold;
      if (isLeech) {
        leeches.push({ card, bucket: 'leech', retrievability: ret, isLeech: true });
      } else {
        overdue.push({ card, bucket: 'overdue', retrievability: ret, isLeech: false });
      }
    }
  }

  // Sort overdue & leeches by lowest retrievability first, tie-break by oldest due date
  const sortByUrgency = (a: QueuedCard, b: QueuedCard) => {
    if (Math.abs(a.retrievability - b.retrievability) > 1e-6) {
      return a.retrievability - b.retrievability;
    }
    return a.card.due - b.card.due;
  };
  overdue.sort(sortByUrgency);
  leeches.sort(sortByUrgency);

  // Sort new cards: starred first, then oldest createdAt
  newPool.sort((a, b) => {
    if (a.card.starred !== b.card.starred) return a.card.starred ? -1 : 1;
    return a.card.createdAt - b.card.createdAt;
  });

  const dueTotal = overdue.length + leeches.length;
  const backlogWarning = dueTotal > backlogWarningThreshold;

  // Priority: overdue -> leeches
  let reviewList = [...overdue, ...leeches];
  if (backlogWarning && reviewList.length > maxBacklog) {
    reviewList = reviewList.slice(0, maxBacklog);
  }

  const remainingNewAllowance = Math.max(0, newCardsLimit - newCardsDoneToday);
  const selectedNew = newPool.slice(0, remainingNewAllowance);

  // Interleave: 1 new card after every `reviewsPerNew` (4) review cards
  const merged: QueuedCard[] = [];
  let rIdx = 0;
  let nIdx = 0;
  const step = Math.max(1, reviewsPerNew);

  while (rIdx < reviewList.length || nIdx < selectedNew.length) {
    for (let k = 0; k < step && rIdx < reviewList.length; k++) {
      merged.push(reviewList[rIdx++]);
    }
    if (nIdx < selectedNew.length) {
      merged.push(selectedNew[nIdx++]);
    }
  }

  let queue = deClusterByItemId(merged);
  if (sessionLimit !== undefined && sessionLimit >= 0 && queue.length > sessionLimit) {
    queue = queue.slice(0, sessionLimit);
  }

  const overdueCount = queue.filter((q) => q.bucket === 'overdue').length;
  const leechCount = queue.filter((q) => q.bucket === 'leech').length;
  const newCount = queue.filter((q) => q.bucket === 'new').length;

  return {
    queue,
    stats: {
      dueTotal,
      overdueCount,
      leechCount,
      newCount,
      backlogWarning,
    },
  };
}
