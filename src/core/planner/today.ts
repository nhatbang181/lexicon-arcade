import type { IeltsSkill } from '../band/estimator';
import { formatDateKey } from '../gamification/streak';

export type GameId =
  | 'v1'
  | 'v2'
  | 'v3'
  | 'l1'
  | 'l2'
  | 'r1'
  | 'r2'
  | 'w1'
  | 'w2'
  | 's1'
  | 's2'
  | 'x1';

export type GameSkillGroup = 'vocab' | 'listening' | 'reading' | 'writing' | 'speaking' | 'exam';

export interface PlannerGameMeta {
  id: GameId;
  skillGroup: GameSkillGroup;
  ieltsSkill?: IeltsSkill;
  title: string;
  defaultMinutes: number;
  defaultMode: 'training' | 'exam' | 'sprint';
  shortFriendly: boolean;
}

export const PLANNER_GAMES: Record<GameId, PlannerGameMeta> = {
  v1: {
    id: 'v1',
    skillGroup: 'vocab',
    title: 'Daily Run',
    defaultMinutes: 12,
    defaultMode: 'training',
    shortFriendly: true,
  },
  v2: {
    id: 'v2',
    skillGroup: 'vocab',
    title: 'Collocation Forge',
    defaultMinutes: 10,
    defaultMode: 'training',
    shortFriendly: true,
  },
  v3: {
    id: 'v3',
    skillGroup: 'vocab',
    title: 'Paraphrase Radar',
    defaultMinutes: 10,
    defaultMode: 'training',
    shortFriendly: true,
  },
  l1: {
    id: 'l1',
    skillGroup: 'listening',
    ieltsSkill: 'L',
    title: 'Trap Detector',
    defaultMinutes: 15,
    defaultMode: 'training',
    shortFriendly: false,
  },
  l2: {
    id: 'l2',
    skillGroup: 'listening',
    ieltsSkill: 'L',
    title: 'Dictation Ladder',
    defaultMinutes: 12,
    defaultMode: 'training',
    shortFriendly: true,
  },
  r1: {
    id: 'r1',
    skillGroup: 'reading',
    ieltsSkill: 'R',
    title: 'TFNG Judge',
    defaultMinutes: 15,
    defaultMode: 'training',
    shortFriendly: false,
  },
  r2: {
    id: 'r2',
    skillGroup: 'reading',
    ieltsSkill: 'R',
    title: 'Headline Editor',
    defaultMinutes: 12,
    defaultMode: 'training',
    shortFriendly: false,
  },
  w1: {
    id: 'w1',
    skillGroup: 'writing',
    ieltsSkill: 'W',
    title: 'Essay Lab',
    defaultMinutes: 25,
    defaultMode: 'training',
    shortFriendly: false,
  },
  w2: {
    id: 'w2',
    skillGroup: 'writing',
    ieltsSkill: 'W',
    title: 'Writing Sprints',
    defaultMinutes: 10,
    defaultMode: 'sprint',
    shortFriendly: true,
  },
  s1: {
    id: 's1',
    skillGroup: 'speaking',
    ieltsSkill: 'S',
    title: 'Mock Examiner',
    defaultMinutes: 15,
    defaultMode: 'training',
    shortFriendly: false,
  },
  s2: {
    id: 's2',
    skillGroup: 'speaking',
    ieltsSkill: 'S',
    title: '3-Second Rule',
    defaultMinutes: 10,
    defaultMode: 'sprint',
    shortFriendly: true,
  },
  x1: {
    id: 'x1',
    skillGroup: 'exam',
    title: 'Exam Room',
    defaultMinutes: 30,
    defaultMode: 'exam',
    shortFriendly: false,
  },
};

const GAMES_BY_SKILL: Record<IeltsSkill, GameId[]> = {
  L: ['l1', 'l2'],
  R: ['r1', 'r2'],
  W: ['w1', 'w2'],
  S: ['s1', 's2'],
};

const SKILL_LABEL_VI: Record<IeltsSkill, string> = {
  L: 'Listening',
  R: 'Reading',
  W: 'Writing',
  S: 'Speaking',
};

export interface PlannerProfileInput {
  targetBands: Record<IeltsSkill, number>;
  estimatedBands: Record<IeltsSkill, number | null>;
  skillLevels?: Partial<Record<GameId, number>>;
  dailyGoalMin?: number;
}

export interface PlannerAttemptSummary {
  gameId: GameId;
  startedAt: number;
}

export interface BuildTodayPlanInput {
  profile: PlannerProfileInput;
  dueCardsCount: number;
  now?: Date;
  recentAttempts?: readonly PlannerAttemptSummary[];
}

export interface PlannedTask {
  id: string;
  gameId: GameId;
  skillGroup: GameSkillGroup;
  mode: 'training' | 'exam' | 'sprint';
  title: string;
  reasonVi: string;
  estMinutes: number;
  priority: number;
  completed: boolean;
}

export interface DailyPlan {
  date: string;
  goalMinutes: number;
  totalMinutes: number;
  weakestSkill: IeltsSkill;
  tasks: PlannedTask[];
}

const MS_PER_DAY = 86_400_000;

function daysSinceLastPlay(
  gameId: GameId,
  attempts: readonly PlannerAttemptSummary[],
  nowMs: number,
): number {
  let latest = -1;
  for (const a of attempts) {
    if (a.gameId === gameId && a.startedAt > latest) {
      latest = a.startedAt;
    }
  }
  if (latest < 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, (nowMs - latest) / MS_PER_DAY);
}

function playedSkillYesterday(
  skill: 'W' | 'S',
  attempts: readonly PlannerAttemptSummary[],
  now: Date,
): boolean {
  const yesterdayKey = formatDateKey(new Date(now.getTime() - MS_PER_DAY));
  const skillGames = new Set<GameId>(GAMES_BY_SKILL[skill]);
  return attempts.some(
    (a) => skillGames.has(a.gameId) && formatDateKey(new Date(a.startedAt)) === yesterdayKey,
  );
}

function pickBestGameForSkill(
  skill: IeltsSkill,
  profile: PlannerProfileInput,
  attempts: readonly PlannerAttemptSummary[],
  nowMs: number,
  usedGames: ReadonlySet<GameId>,
  maxMinutes?: number,
): GameId | null {
  const candidates = GAMES_BY_SKILL[skill].filter((gid) => {
    if (usedGames.has(gid)) return false;
    if (maxMinutes !== undefined && PLANNER_GAMES[gid].defaultMinutes > maxMinutes) {
      return false;
    }
    return true;
  });
  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => {
    const lvlA = profile.skillLevels?.[a] ?? 1;
    const lvlB = profile.skillLevels?.[b] ?? 1;
    if (lvlA !== lvlB) return lvlA - lvlB;
    return daysSinceLastPlay(b, attempts, nowMs) - daysSinceLastPlay(a, attempts, nowMs);
  })[0];
}

/**
 * Build today's automatic study plan (docs/02-LEARNING-DESIGN.md §6):
 * - Default 45–60 min budget with 3–4 focused tasks (15 min busy mode -> 2 short tasks).
 * - Always puts V1 Daily Run first if dueCardsCount > 0.
 * - Targets the skill with the largest gap to targetBand.
 * - Avoids scheduling the same productive skill (W/S) two consecutive days unless it is weakest.
 * - Schedules weekly X1 Exam Room every 7 days (preferring weekends).
 */
export function buildTodayPlan(input: BuildTodayPlanInput): DailyPlan {
  const { profile, dueCardsCount, now = new Date(), recentAttempts = [] } = input;
  const date = formatDateKey(now);
  const nowMs = now.getTime();
  const goalMinutes = Math.max(15, profile.dailyGoalMin ?? 50);

  // Compute skill gaps (unassessed skills default to 6.0 baseline per SPEC)
  const skills: IeltsSkill[] = ['L', 'R', 'W', 'S'];
  const skillGaps = skills
    .map((skill) => {
      const est = profile.estimatedBands[skill] ?? 6.0;
      const gap = profile.targetBands[skill] - est;
      const staleness = Math.min(
        ...GAMES_BY_SKILL[skill].map((g) => daysSinceLastPlay(g, recentAttempts, nowMs)),
      );
      return { skill, gap, staleness };
    })
    .sort((a, b) => {
      if (Math.abs(b.gap - a.gap) > 1e-6) return b.gap - a.gap;
      return b.staleness - a.staleness;
    });

  const weakestSkill = skillGaps[0].skill;
  const tasks: PlannedTask[] = [];
  const usedGames = new Set<GameId>();
  let totalMinutes = 0;

  const pushTask = (
    gameId: GameId,
    reasonVi: string,
    estMinutesOverride?: number,
    modeOverride?: 'training' | 'exam' | 'sprint',
  ) => {
    const meta = PLANNER_GAMES[gameId];
    const estMinutes = estMinutesOverride ?? meta.defaultMinutes;
    tasks.push({
      id: `${date}:${gameId}:${tasks.length + 1}`,
      gameId,
      skillGroup: meta.skillGroup,
      mode: modeOverride ?? meta.defaultMode,
      title: meta.title,
      reasonVi,
      estMinutes,
      priority: tasks.length + 1,
      completed: false,
    });
    usedGames.add(gameId);
    totalMinutes += estMinutes;
  };

  // 1. Daily Run (V1) always first if cards are due
  if (dueCardsCount > 0) {
    const v1Min = goalMinutes <= 15 ? 8 : Math.min(15, Math.max(8, Math.ceil(dueCardsCount / 4)));
    pushTask(
      'v1',
      `Ôn ${dueCardsCount} thẻ SRS đến hạn để giữ trí nhớ dài hạn.`,
      v1Min,
    );
  }

  // Busy day mode (15 min): Daily Run + 1 short game (V2/V3/L2/S2)
  if (goalMinutes <= 15) {
    const shortCandidates: GameId[] = ['v2', 'v3', 'l2', 's2', 'w2'];
    const pick = shortCandidates
      .filter((g) => !usedGames.has(g))
      .sort(
        (a, b) =>
          daysSinceLastPlay(b, recentAttempts, nowMs) -
          daysSinceLastPlay(a, recentAttempts, nowMs),
      )[0];
    if (pick) {
      pushTask(pick, 'Phiên ngắn ngày bận để giữ nhịp học.', 7);
    }
    return { date, goalMinutes, totalMinutes, weakestSkill, tasks };
  }

  // 2. Weekly Exam Room (X1) check: >= 7 days since last X1 & weekend (or >= 10 days overdue)
  const daysSinceX1 = daysSinceLastPlay('x1', recentAttempts, nowMs);
  const dayOfWeek = now.getUTCDay(); // 0 Sun, 6 Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const shouldSuggestX1 =
    goalMinutes >= 45 &&
    ((isWeekend && daysSinceX1 >= 7) || (Number.isFinite(daysSinceX1) && daysSinceX1 >= 10));

  if (shouldSuggestX1) {
    pushTask(
      'x1',
      'Thi thử định kỳ hằng tuần để cập nhật band ước lượng chính xác.',
      25,
      'exam',
    );
  }

  // 3. Weakest skill focus
  const weakestGame = pickBestGameForSkill(
    weakestSkill,
    profile,
    recentAttempts,
    nowMs,
    usedGames,
  );
  if (weakestGame) {
    const gapVal = Math.max(0, skillGaps[0].gap).toFixed(1);
    pushTask(
      weakestGame,
      `${SKILL_LABEL_VI[weakestSkill]} đang cách mục tiêu ${gapVal} band — ưu tiên luyện hôm nay.`,
    );
  }

  // 4. Secondary skill (respecting productive skill W/S rotation rule)
  const targetMaxTasks = goalMinutes >= 60 ? 4 : 3;
  for (let i = 1; i < skillGaps.length && tasks.length < targetMaxTasks; i++) {
    if (totalMinutes >= goalMinutes - 5) break;
    const { skill } = skillGaps[i];
    if (
      (skill === 'W' || skill === 'S') &&
      playedSkillYesterday(skill, recentAttempts, now)
    ) {
      // Rotation rule: skip productive skill if played yesterday and not weakest
      continue;
    }
    const remainingBudget = goalMinutes - totalMinutes + 5;
    const gameId = pickBestGameForSkill(
      skill,
      profile,
      recentAttempts,
      nowMs,
      usedGames,
      remainingBudget,
    );
    if (gameId) {
      pushTask(
        gameId,
        `Luyện xen kẽ kỹ năng ${SKILL_LABEL_VI[skill]} để giữ cân bằng 4 kỹ năng.`,
      );
    }
  }

  // 5. Interleaved vocab/collocation/paraphrase bridge if still under target count or minutes
  const bridgeGames: GameId[] = ['v2', 'v3', 'l2', 's2', 'w2'];
  bridgeGames.sort(
    (a, b) =>
      daysSinceLastPlay(b, recentAttempts, nowMs) -
      daysSinceLastPlay(a, recentAttempts, nowMs),
  );
  for (const bg of bridgeGames) {
    if (tasks.length >= 4 || (tasks.length >= 3 && totalMinutes >= goalMinutes - 8)) {
      break;
    }
    if (usedGames.has(bg)) continue;
    pushTask(
      bg,
      'Bài luyện xen kẽ giúp tăng tốc phản xạ từ vựng và kỹ năng thi.',
    );
  }

  return {
    date,
    goalMinutes,
    totalMinutes,
    weakestSkill,
    tasks,
  };
}

/**
 * Swap a task in the daily plan when the learner clicks "Đổi" (docs/02 §2.2).
 */
export function swapPlanTask(
  plan: DailyPlan,
  taskId: string,
  replacementGameId: GameId,
): DailyPlan {
  const meta = PLANNER_GAMES[replacementGameId];
  let totalMinutes = 0;
  const tasks = plan.tasks.map((task) => {
    const next =
      task.id === taskId
        ? {
            ...task,
            gameId: replacementGameId,
            skillGroup: meta.skillGroup,
            mode: meta.defaultMode,
            title: meta.title,
            estMinutes: meta.defaultMinutes,
            reasonVi: 'Đã đổi theo lựa chọn của bạn.',
          }
        : task;
    totalMinutes += next.estMinutes;
    return next;
  });

  return {
    ...plan,
    totalMinutes,
    tasks,
  };
}
