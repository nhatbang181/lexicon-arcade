import { State } from 'ts-fsrs';
import { diffCalendarDays, formatDateKey } from '../gamification/streak';
import { isCardRetired } from './faces';
import { getCardRetrievability, type SRSCard } from './fsrsAdapter';

export const DEFAULT_NEW_CARDS_LIMIT = 15;
export const NEW_CARDS_PAUSE_DUE_THRESHOLD = 150;
export const RETENTION_TARGET_7D = 0.8;
export const RECOVERY_ABSENCE_DAYS = 3;
export const RECOVERY_DUE_THRESHOLD = 50;
export const RECOVERY_SESSION_CAP = 50;

export type QueueBucket = 'overdue' | 'leech' | 'new';
export type NewCardThrottleReason = 'due_overload' | 'low_retention' | null;

export interface NewCardValveInput {
  /** Hạn mức thẻ mới/ngày theo cài đặt (mặc định 15). */
  baseLimit?: number;
  /** Số thẻ ôn đang đến hạn. */
  dueCount: number;
  /** Tỷ lệ nhớ lượt đầu 7 ngày gần nhất trong [0, 1] (null/undefined = chưa có dữ liệu). */
  retention7d?: number | null;
  /** Ngưỡng thẻ đến hạn để tạm dừng thẻ mới (mặc định 150, PP-02 / L-11). */
  pauseDueThreshold?: number;
}

export interface NewCardValveResult {
  effectiveLimit: number;
  baseLimit: number;
  throttled: boolean;
  reason: NewCardThrottleReason;
  reasonVi: string | null;
}

/**
 * Van tải thẻ mới (FX-2 · PP-02 + PP-C4 + L-11):
 * - Mặc định 15 thẻ mới/ngày.
 * - Nếu số thẻ ôn đến hạn > 150 → tạm dừng thẻ mới (= 0).
 * - Nếu tỷ lệ nhớ lượt đầu 7 ngày < 80% → giảm bậc (15→10 khi 70–79%, 15→5 khi < 70%).
 * - Luôn trả lý do sư phạm rõ ràng, không phạt (SR-87).
 */
export function computeEffectiveNewCardsLimit(input: NewCardValveInput): NewCardValveResult {
  const baseLimit = Math.max(0, Math.floor(input.baseLimit ?? DEFAULT_NEW_CARDS_LIMIT));
  const pauseDueThreshold = input.pauseDueThreshold ?? NEW_CARDS_PAUSE_DUE_THRESHOLD;

  if (input.dueCount > pauseDueThreshold) {
    return {
      effectiveLimit: 0,
      baseLimit,
      throttled: baseLimit > 0,
      reason: baseLimit > 0 ? 'due_overload' : null,
      reasonVi:
        baseLimit > 0
          ? `Đang có ${input.dueCount} thẻ đến hạn (> ${pauseDueThreshold}), tạm nghỉ thẻ mới để tập trung ôn.`
          : null,
    };
  }

  const retention = input.retention7d;
  if (
    retention !== undefined &&
    retention !== null &&
    Number.isFinite(retention) &&
    retention < RETENTION_TARGET_7D
  ) {
    const pct = Math.round(Math.max(0, Math.min(1, retention)) * 100);
    const scaled =
      baseLimit === 0
        ? 0
        : retention < 0.7
        ? Math.min(baseLimit, Math.max(1, Math.round(baseLimit / 3)))
        : Math.min(baseLimit, Math.max(1, Math.round((baseLimit * 2) / 3)));
    const throttled = scaled < baseLimit;
    return {
      effectiveLimit: scaled,
      baseLimit,
      throttled,
      reason: throttled ? 'low_retention' : null,
      reasonVi: throttled
        ? `Tỷ lệ nhớ lượt đầu 7 ngày đạt ${pct}% (< 80%), giảm tạm thẻ mới xuống ${scaled}/ngày để củng cố.`
        : null,
    };
  }

  return {
    effectiveLimit: baseLimit,
    baseLimit,
    throttled: false,
    reason: null,
    reasonVi: null,
  };
}

/**
 * Số ngày vắng tính theo ngày học địa phương (chuyển ngày lúc 04:00, dùng chung với streak).
 */
export function computeAbsenceDays(
  lastActiveDay: string | null | undefined,
  now: Date = new Date(),
): number {
  if (!lastActiveDay) return 0;
  const todayKey = formatDateKey(now);
  return Math.max(0, diffCalendarDays(lastActiveDay, todayKey));
}

/**
 * Kiểm tra điều kiện Vòng phục hồi (FX-2 · PP-02):
 * quay lại sau ≥ 3 ngày vắng và số thẻ đến hạn > 50 → giới hạn phiên ≤ 50 thẻ.
 */
export function isRecoveryRoundEligible(params: {
  absenceDays: number;
  dueCount: number;
  recoveryAbsenceDays?: number;
  recoveryDueThreshold?: number;
}): boolean {
  const minAbsence = params.recoveryAbsenceDays ?? RECOVERY_ABSENCE_DAYS;
  const minDue = params.recoveryDueThreshold ?? RECOVERY_DUE_THRESHOLD;
  return params.absenceDays >= minAbsence && params.dueCount > minDue;
}

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
  /** Tỷ lệ nhớ lượt đầu 7 ngày gần nhất trong [0, 1] (van tải thẻ mới PP-C4). */
  retention7d?: number | null;
  /** Ngưỡng thẻ đến hạn để tạm dừng thẻ mới (mặc định 150, PP-02 / L-11). */
  pauseNewCardsDueThreshold?: number;
  /** Số ngày vắng gần nhất theo mốc 04:00 giờ địa phương (vòng phục hồi PP-02). */
  absenceDays?: number;
  /** Số ngày vắng tối thiểu để bật vòng phục hồi (mặc định 3). */
  recoveryAbsenceDays?: number;
  /** Số thẻ đến hạn tối thiểu để bật vòng phục hồi (mặc định 50). */
  recoveryDueThreshold?: number;
  /** Giới hạn số thẻ trong vòng phục hồi (mặc định 50). */
  recoverySessionLimit?: number;
  /** Lấy chủ đề (`topic`/`domain`) của thẻ mới để gom theo khối chủ đề (L-5 / PP-05). */
  getNewCardTopic?: (card: SRSCard) => string | undefined;
}

export interface ReviewQueueResult {
  queue: QueuedCard[];
  stats: {
    dueTotal: number;
    overdueCount: number;
    leechCount: number;
    newCount: number;
    backlogWarning: boolean;
    effectiveNewCardsLimit: number;
    newCardsThrottleReason: NewCardThrottleReason;
    newCardsThrottleReasonVi: string | null;
    recoveryMode: boolean;
    recoveryReasonVi: string | null;
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
 * Gom thẻ mới theo khối chủ đề (L-5 / PP-05: từ mới học theo khối chủ đề, không trộn ngẫu nhiên).
 * Thứ tự khối: khối có thẻ gắn sao trước, sau đó theo `createdAt` sớm nhất trong khối, rồi tên chủ đề.
 */
function groupNewCardsByTopic(
  newPool: QueuedCard[],
  getNewCardTopic?: (card: SRSCard) => string | undefined,
): QueuedCard[] {
  const byStarredThenCreated = (a: QueuedCard, b: QueuedCard) => {
    if (a.card.starred !== b.card.starred) return a.card.starred ? -1 : 1;
    return a.card.createdAt - b.card.createdAt;
  };

  if (!getNewCardTopic) {
    return [...newPool].sort(byStarredThenCreated);
  }

  const groups = new Map<string, QueuedCard[]>();
  for (const q of newPool) {
    const raw = getNewCardTopic(q.card)?.trim();
    const key = raw && raw.length > 0 ? raw : '__other__';
    const list = groups.get(key);
    if (list) list.push(q);
    else groups.set(key, [q]);
  }

  const orderedGroups = [...groups.entries()].map(([topic, items]) => {
    items.sort(byStarredThenCreated);
    return {
      topic,
      items,
      hasStarred: items.some((x) => x.card.starred),
      earliestCreated: items[0]?.card.createdAt ?? Number.MAX_SAFE_INTEGER,
    };
  });

  orderedGroups.sort((a, b) => {
    if (a.hasStarred !== b.hasStarred) return a.hasStarred ? -1 : 1;
    if (a.earliestCreated !== b.earliestCreated) return a.earliestCreated - b.earliestCreated;
    return a.topic.localeCompare(b.topic);
  });

  return orderedGroups.flatMap((g) => g.items);
}

/**
 * Build the prioritized, interleaved SRS review queue:
 * 1. Overdue review cards (sorted by lowest retrievability, then oldest due)
 * 2. Due leech cards (lapses >= leechThreshold)
 * 3. New cards up to effective daily ceiling (after load valve), grouped by topic block (L-5),
 *    interleaved at 1 new per 4 reviews
 * 4. Recovery round caps session at <= 50 cards when absence >= 3 days and dueTotal > 50
 * 5. Anti-clustering ensures two faces of the same headword/itemId are not adjacent.
 */
export function buildReviewQueue(
  cards: readonly SRSCard[],
  options: ReviewQueueOptions = {},
): ReviewQueueResult {
  const {
    now = new Date(),
    newCardsLimit = DEFAULT_NEW_CARDS_LIMIT,
    newCardsDoneToday = 0,
    backlogWarningThreshold = 200,
    maxBacklog = 120,
    leechThreshold = 4,
    reviewsPerNew = 4,
    sessionLimit,
    retention7d,
    pauseNewCardsDueThreshold = NEW_CARDS_PAUSE_DUE_THRESHOLD,
    absenceDays = 0,
    recoveryAbsenceDays = RECOVERY_ABSENCE_DAYS,
    recoveryDueThreshold = RECOVERY_DUE_THRESHOLD,
    recoverySessionLimit = RECOVERY_SESSION_CAP,
    getNewCardTopic,
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

  // Gom thẻ mới theo khối chủ đề (L-5 / PP-05)
  const orderedNewPool = groupNewCardsByTopic(newPool, getNewCardTopic);

  const dueTotal = overdue.length + leeches.length;
  const backlogWarning = dueTotal > backlogWarningThreshold;

  // Van tải thẻ mới (PP-02 + PP-C4 + L-11)
  const valve = computeEffectiveNewCardsLimit({
    baseLimit: newCardsLimit,
    dueCount: dueTotal,
    retention7d,
    pauseDueThreshold: pauseNewCardsDueThreshold,
  });

  // Vòng phục hồi (PP-02): vắng >= 3 ngày và > 50 thẻ đến hạn -> giới hạn phiên <= 50 thẻ
  const recoveryMode = isRecoveryRoundEligible({
    absenceDays,
    dueCount: dueTotal,
    recoveryAbsenceDays,
    recoveryDueThreshold,
  });
  const recoveryReasonVi = recoveryMode
    ? `Vòng phục hồi · tối đa ${recoverySessionLimit} thẻ`
    : null;

  // Priority: overdue -> leeches
  let reviewList = [...overdue, ...leeches];
  if (backlogWarning && reviewList.length > maxBacklog) {
    reviewList = reviewList.slice(0, maxBacklog);
  }

  const remainingNewAllowance = Math.max(0, valve.effectiveLimit - newCardsDoneToday);
  const selectedNew = orderedNewPool.slice(0, remainingNewAllowance);

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
  const effectiveSessionLimit =
    recoveryMode
      ? sessionLimit !== undefined
        ? Math.min(sessionLimit, recoverySessionLimit)
        : recoverySessionLimit
      : sessionLimit;

  if (
    effectiveSessionLimit !== undefined &&
    effectiveSessionLimit >= 0 &&
    queue.length > effectiveSessionLimit
  ) {
    queue = queue.slice(0, effectiveSessionLimit);
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
      effectiveNewCardsLimit: valve.effectiveLimit,
      newCardsThrottleReason: valve.reason,
      newCardsThrottleReasonVi: valve.reasonVi,
      recoveryMode,
      recoveryReasonVi,
    },
  };
}
