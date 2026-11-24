export interface StreakState {
  count: number;
  longest: number;
  /** YYYY-MM-DD theo giờ địa phương, chuyển ngày 04:00 (xem formatDateKey) */
  lastActiveDay: string | null;
  /** Available streak freezes (0..2, earned 1 per 7 consecutive days) */
  freezes: number;
  /** Dates automatically protected by a streak freeze */
  freezeUsedDates: string[];
}

export interface StreakUpdateResult {
  state: StreakState;
  changed: boolean;
  freezeUsed: boolean;
  freezeEarned: boolean;
  broken: boolean;
}

export interface DailyActivityQualification {
  cardsReviewed?: number;
  sessionsCompleted?: number;
}

export const MAX_STREAK_FREEZES = 2;
export const FREEZE_EARN_INTERVAL = 7;

export function createInitialStreak(): StreakState {
  return {
    count: 0,
    longest: 0,
    lastActiveDay: null,
    freezes: 1, // Start with 1 freeze so early busy day doesn't punish learner
    freezeUsedDates: [],
  };
}

/** Giờ chuyển ngày theo giờ địa phương: 00:00-03:59 vẫn tính là ngày hôm trước (F3). */
export const DAY_ROLLOVER_HOUR = 4;

/** Khoá ngày lịch thuần (YYYY-MM-DD) từ một mốc UTC; chỉ dùng cho phép cộng/trừ ngày. */
function formatCalendarKey(utcDate: Date): string {
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Khoá ngày học (YYYY-MM-DD) theo **giờ địa phương** của máy, ngày mới bắt đầu lúc 04:00.
 * Ví dụ ở UTC+7: 06:30 sáng thứ Ba vẫn là thứ Ba, 02:00 sáng thứ Ba còn tính thứ Hai.
 */
export function formatDateKey(date: Date): string {
  const shifted = new Date(date.getTime() - DAY_ROLLOVER_HOUR * 3_600_000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Số ms từ `now` đến mốc chuyển ngày kế tiếp (04:00 giờ địa phương), luôn > 0. */
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(DAY_ROLLOVER_HOUR, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return Math.max(1, next.getTime() - now.getTime());
}

export function diffCalendarDays(fromDateKey: string, toDateKey: string): number {
  const [fy, fm, fd] = fromDateKey.split('-').map(Number);
  const [ty, tm, td] = toDateKey.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return formatCalendarKey(dt);
}

/**
 * Busy-day qualification rule (docs/02 §2.3):
 * >= 5 reviewed cards in a short Daily Run OR >= 1 completed session keeps the streak alive.
 */
export function qualifiesForStreak(activity: DailyActivityQualification): boolean {
  return (activity.cardsReviewed ?? 0) >= 5 || (activity.sessionsCompleted ?? 0) >= 1;
}

/**
 * Update streak when the learner completes a qualifying study activity on `activeDateKey`.
 * - Same day: no change.
 * - Next day (diff === 1): increment streak; every 7 days earn +1 freeze (max 2).
 * - Missed 1 day (diff === 2) with freezes > 0: auto-consume 1 freeze to protect streak!
 * - Missed > 1 day (or missed 1 day with 0 freezes): reset count to 1 (never deletes XP/progress).
 */
export function updateStreak(
  current: StreakState,
  activeDateKey: string,
): StreakUpdateResult {
  if (!current.lastActiveDay) {
    const next: StreakState = {
      ...current,
      count: 1,
      longest: Math.max(current.longest, 1),
      lastActiveDay: activeDateKey,
    };
    return {
      state: next,
      changed: true,
      freezeUsed: false,
      freezeEarned: false,
      broken: false,
    };
  }

  const diff = diffCalendarDays(current.lastActiveDay, activeDateKey);

  // Same day or clock went backwards -> no change
  if (diff <= 0) {
    return {
      state: { ...current },
      changed: false,
      freezeUsed: false,
      freezeEarned: false,
      broken: false,
    };
  }

  // Consecutive day
  if (diff === 1) {
    const nextCount = current.count + 1;
    const canEarnFreeze =
      nextCount % FREEZE_EARN_INTERVAL === 0 && current.freezes < MAX_STREAK_FREEZES;
    const next: StreakState = {
      ...current,
      count: nextCount,
      longest: Math.max(current.longest, nextCount),
      lastActiveDay: activeDateKey,
      freezes: canEarnFreeze ? current.freezes + 1 : current.freezes,
    };
    return {
      state: next,
      changed: true,
      freezeUsed: false,
      freezeEarned: canEarnFreeze,
      broken: false,
    };
  }

  // Missed exactly 1 day -> auto-apply Streak Freeze if available
  if (diff === 2 && current.freezes > 0) {
    const missedDate = addDays(current.lastActiveDay, 1);
    const nextCount = current.count + 1;
    const freezesAfterUse = current.freezes - 1;
    const canEarnFreeze =
      nextCount % FREEZE_EARN_INTERVAL === 0 && freezesAfterUse < MAX_STREAK_FREEZES;
    const next: StreakState = {
      count: nextCount,
      longest: Math.max(current.longest, nextCount),
      lastActiveDay: activeDateKey,
      freezes: canEarnFreeze ? freezesAfterUse + 1 : freezesAfterUse,
      freezeUsedDates: [...current.freezeUsedDates, missedDate],
    };
    return {
      state: next,
      changed: true,
      freezeUsed: true,
      freezeEarned: canEarnFreeze,
      broken: false,
    };
  }

  // Streak broken -> restart at 1 without touching longest/XP
  const next: StreakState = {
    ...current,
    count: 1,
    longest: Math.max(current.longest, 1),
    lastActiveDay: activeDateKey,
  };
  return {
    state: next,
    changed: true,
    freezeUsed: false,
    freezeEarned: false,
    broken: true,
  };
}

export type StreakHealth = 'completed_today' | 'active_at_risk' | 'protected_by_freeze' | 'broken' | 'not_started';

export function checkStreakStatus(
  state: StreakState,
  todayKey: string,
): { health: StreakHealth; daysSinceActive: number | null } {
  if (!state.lastActiveDay) {
    return { health: 'not_started', daysSinceActive: null };
  }
  const diff = diffCalendarDays(state.lastActiveDay, todayKey);
  if (diff <= 0) return { health: 'completed_today', daysSinceActive: 0 };
  if (diff === 1) return { health: 'active_at_risk', daysSinceActive: 1 };
  if (diff === 2 && state.freezes > 0) {
    return { health: 'protected_by_freeze', daysSinceActive: 2 };
  }
  return { health: 'broken', daysSinceActive: diff };
}

/**
 * Số ngày chuỗi để HIỂN THỊ (shell và Hôm nay dùng chung, F2/F8):
 * chuỗi đã gãy (bỏ quá 1 ngày mà không còn freeze) hiện 0 thay vì số cũ.
 */
export function displayStreakCount(state: StreakState, now: Date = new Date()): number {
  const { health } = checkStreakStatus(state, formatDateKey(now));
  return health === 'broken' || health === 'not_started' ? 0 : state.count;
}
