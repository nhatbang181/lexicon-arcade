import type { IeltsSkill } from '../band/estimator';
import {
  DAY_ROLLOVER_HOUR,
  diffCalendarDays,
  formatDateKey,
} from '../gamification/streak';

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

/** 4 mạch cân bằng của Paul Nation (PP-06). */
export type StrandId = 'input' | 'output' | 'language' | 'fluency';

export interface StrandStat {
  id: StrandId;
  labelVi: string;
  minutes: number;
  pct: number;
  underrepresented: boolean;
}

export interface FourStrandsSummary {
  windowDays: number;
  totalMinutes: number;
  strands: Record<StrandId, StrandStat>;
  underrepresented: StrandId[];
}

export const STRAND_LABELS_VI: Record<StrandId, string> = {
  input: 'Đầu vào (Nghe · Đọc)',
  output: 'Đầu ra (Viết · Nói)',
  language: 'Ngôn ngữ (Từ · Cụm)',
  fluency: 'Trôi chảy (Tốc độ)',
};

const STRAND_GAMES: Record<StrandId, GameId[]> = {
  input: ['l1', 'r1', 'r2'],
  output: ['w2', 'w1', 's2', 's1'],
  language: ['v1', 'v2', 'l2'],
  fluency: ['v3', 'w2', 'x1'],
};

const PRODUCTIVE_GAMES = new Set<GameId>(['w1', 'w2', 's1', 's2']);

export interface PlannerGameMeta {
  id: GameId;
  skillGroup: GameSkillGroup;
  ieltsSkill?: IeltsSkill;
  strand: StrandId;
  title: string;
  defaultMinutes: number;
  defaultMode: 'training' | 'exam' | 'sprint';
  shortFriendly: boolean;
}

export const PLANNER_GAMES: Record<GameId, PlannerGameMeta> = {
  v1: {
    id: 'v1',
    skillGroup: 'vocab',
    strand: 'language',
    title: 'Daily Run',
    defaultMinutes: 12,
    defaultMode: 'training',
    shortFriendly: true,
  },
  v2: {
    id: 'v2',
    skillGroup: 'vocab',
    strand: 'language',
    title: 'Collocation Forge',
    defaultMinutes: 10,
    defaultMode: 'training',
    shortFriendly: true,
  },
  v3: {
    id: 'v3',
    skillGroup: 'vocab',
    strand: 'fluency',
    title: 'Paraphrase Radar',
    defaultMinutes: 10,
    defaultMode: 'training',
    shortFriendly: true,
  },
  l1: {
    id: 'l1',
    skillGroup: 'listening',
    ieltsSkill: 'L',
    strand: 'input',
    title: 'Trap Detector',
    defaultMinutes: 15,
    defaultMode: 'training',
    shortFriendly: false,
  },
  l2: {
    id: 'l2',
    skillGroup: 'listening',
    ieltsSkill: 'L',
    strand: 'language',
    title: 'Dictation Ladder',
    defaultMinutes: 12,
    defaultMode: 'training',
    shortFriendly: true,
  },
  r1: {
    id: 'r1',
    skillGroup: 'reading',
    ieltsSkill: 'R',
    strand: 'input',
    title: 'TFNG Judge',
    defaultMinutes: 15,
    defaultMode: 'training',
    shortFriendly: false,
  },
  r2: {
    id: 'r2',
    skillGroup: 'reading',
    ieltsSkill: 'R',
    strand: 'input',
    title: 'Headline Editor',
    defaultMinutes: 12,
    defaultMode: 'training',
    shortFriendly: false,
  },
  w1: {
    id: 'w1',
    skillGroup: 'writing',
    ieltsSkill: 'W',
    strand: 'output',
    title: 'Essay Lab',
    defaultMinutes: 25,
    defaultMode: 'training',
    shortFriendly: false,
  },
  w2: {
    id: 'w2',
    skillGroup: 'writing',
    ieltsSkill: 'W',
    strand: 'output',
    title: 'Writing Sprints',
    defaultMinutes: 10,
    defaultMode: 'sprint',
    shortFriendly: true,
  },
  s1: {
    id: 's1',
    skillGroup: 'speaking',
    ieltsSkill: 'S',
    strand: 'output',
    title: 'Mock Examiner',
    defaultMinutes: 15,
    defaultMode: 'training',
    shortFriendly: false,
  },
  s2: {
    id: 's2',
    skillGroup: 'speaking',
    ieltsSkill: 'S',
    strand: 'output',
    title: '3-Second Rule',
    defaultMinutes: 10,
    defaultMode: 'sprint',
    shortFriendly: true,
  },
  x1: {
    id: 'x1',
    skillGroup: 'exam',
    strand: 'fluency',
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
  endedAt?: number;
  mode?: 'training' | 'exam' | 'sprint';
}

export interface BuildTodayPlanInput {
  profile: PlannerProfileInput;
  dueCardsCount: number;
  now?: Date;
  recentAttempts?: readonly PlannerAttemptSummary[];
  /** Chế độ "Ngày bận (~10 phút)" (F14). */
  busyMode?: boolean;
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

/** Ngày học địa phương (lùi 4 giờ để 00:00–03:59 vẫn tính ngày hôm trước, khớp `formatDateKey`). */
function localStudyDate(now: Date): Date {
  return new Date(now.getTime() - DAY_ROLLOVER_HOUR * 3_600_000);
}

/** Khoảng cách theo số ngày học địa phương (chuyển ngày 04:00) thay vì chia MS_PER_DAY UTC (F3). */
function daysSinceLastPlay(
  gameId: GameId,
  attempts: readonly PlannerAttemptSummary[],
  todayKey: string,
): number {
  let latestKey: string | null = null;
  for (const a of attempts) {
    if (a.gameId === gameId) {
      const key = formatDateKey(new Date(a.startedAt));
      if (latestKey === null || key > latestKey) {
        latestKey = key;
      }
    }
  }
  if (latestKey === null) return Number.POSITIVE_INFINITY;
  return Math.max(0, diffCalendarDays(latestKey, todayKey));
}

function playedSkillYesterday(
  skill: 'W' | 'S',
  attempts: readonly PlannerAttemptSummary[],
  todayKey: string,
): boolean {
  const skillGames = new Set<GameId>(GAMES_BY_SKILL[skill]);
  return attempts.some((a) => {
    if (!skillGames.has(a.gameId)) return false;
    const key = formatDateKey(new Date(a.startedAt));
    return diffCalendarDays(key, todayKey) === 1;
  });
}

function attemptDurationMinutes(a: PlannerAttemptSummary): number {
  if (typeof a.endedAt === 'number' && a.endedAt > a.startedAt) {
    return Math.max(1, Math.round((a.endedAt - a.startedAt) / 60_000));
  }
  return PLANNER_GAMES[a.gameId]?.defaultMinutes ?? 8;
}

function strandForAttempt(a: PlannerAttemptSummary): StrandId {
  if (a.mode === 'sprint' && (a.gameId === 'v1' || a.gameId === 'v2' || a.gameId === 'v3')) {
    return 'fluency';
  }
  return PLANNER_GAMES[a.gameId]?.strand ?? 'language';
}

/**
 * Tính cân bằng 4 mạch học của Paul Nation (PP-06) trong `windowDays` ngày học gần nhất (mặc định 7 ngày).
 * Mạch nào < 15% tổng thời lượng sẽ được gắn cờ `underrepresented` để Hôm nay đề xuất bù.
 */
export function computeFourStrands(
  attempts: readonly PlannerAttemptSummary[],
  now: Date = new Date(),
  windowDays = 7,
): FourStrandsSummary {
  const todayKey = formatDateKey(now);
  const mins: Record<StrandId, number> = {
    input: 0,
    output: 0,
    language: 0,
    fluency: 0,
  };

  for (const a of attempts) {
    const key = formatDateKey(new Date(a.startedAt));
    const age = diffCalendarDays(key, todayKey);
    if (age < 0 || age >= windowDays) continue;
    const strand = strandForAttempt(a);
    mins[strand] += attemptDurationMinutes(a);
  }

  const totalMinutes = mins.input + mins.output + mins.language + mins.fluency;
  const strandOrder: StrandId[] = ['input', 'output', 'language', 'fluency'];
  const underrepresented: StrandId[] = [];

  const strands = {} as Record<StrandId, StrandStat>;
  for (const id of strandOrder) {
    const pct = totalMinutes > 0 ? Math.round((mins[id] / totalMinutes) * 100) : 0;
    const isLow = totalMinutes > 0 && pct < 15;
    if (isLow) underrepresented.push(id);
    strands[id] = {
      id,
      labelVi: STRAND_LABELS_VI[id],
      minutes: mins[id],
      pct,
      underrepresented: isLow,
    };
  }

  return {
    windowDays,
    totalMinutes,
    strands,
    underrepresented,
  };
}

function pickBestGameForSkill(
  skill: IeltsSkill,
  profile: PlannerProfileInput,
  attempts: readonly PlannerAttemptSummary[],
  todayKey: string,
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
    return daysSinceLastPlay(b, attempts, todayKey) - daysSinceLastPlay(a, attempts, todayKey);
  })[0];
}

/** Tạo nhiệm vụ nhanh "Giữ chuỗi 5 phút" (F14). */
export function createKeepStreakTask(now: Date = new Date()): PlannedTask {
  const date = formatDateKey(now);
  return {
    id: `${date}:v1:keep-streak`,
    gameId: 'v1',
    skillGroup: 'vocab',
    mode: 'sprint',
    title: 'Giữ chuỗi nhanh (5 phút)',
    reasonVi: 'Ôn nhanh 5–10 thẻ đến hạn để bảo vệ chuỗi ngày học.',
    estMinutes: 5,
    priority: 1,
    completed: false,
  };
}

/** Kế hoạch "Ngày bận (~10 phút)": 2 việc ngắn tổng <= 10 phút (F14). */
export function buildBusyDayPlan(input: Omit<BuildTodayPlanInput, 'busyMode'>): DailyPlan {
  return buildTodayPlan({ ...input, busyMode: true });
}

/**
 * Build today's automatic study plan (docs/02-LEARNING-DESIGN.md §6 + PP-06/PP-10/F3/F14):
 * - Default 30–60 min budget with 3–4 focused tasks (15 min -> 2 short tasks; busyMode -> ~10 min).
 * - Always puts V1 Daily Run first if dueCardsCount > 0.
 * - Targets the skill with the largest gap to targetBand.
 * - Respects Four Strands balance (PP-06): boosts any strand < 15% in last 7 days.
 * - Ensures >= 1 production task when goalMinutes >= 20 (PP-10), while respecting W/S rotation.
 * - Uses local study day (04:00 rollover) for weekend & yesterday checks (F3).
 */
export function buildTodayPlan(input: BuildTodayPlanInput): DailyPlan {
  const { profile, dueCardsCount, now = new Date(), recentAttempts = [], busyMode = false } = input;
  const date = formatDateKey(now);
  const goalMinutes = busyMode ? 10 : Math.max(10, profile.dailyGoalMin ?? 45);

  // Compute skill gaps (unassessed skills default to 6.0 baseline per SPEC)
  const skills: IeltsSkill[] = ['L', 'R', 'W', 'S'];
  const skillGaps = skills
    .map((skill) => {
      const est = profile.estimatedBands[skill] ?? 6.0;
      const gap = profile.targetBands[skill] - est;
      const staleness = Math.min(
        ...GAMES_BY_SKILL[skill].map((g) => daysSinceLastPlay(g, recentAttempts, date)),
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

  // 0. Chế độ ngày bận (~10 phút): V1 nhanh 5p + 1 bài ngắn 5p
  if (busyMode) {
    pushTask(
      'v1',
      dueCardsCount > 0
        ? `Ôn nhanh ${Math.min(10, dueCardsCount)} thẻ đến hạn để giữ chuỗi ngày bận.`
        : 'Ôn nhanh 5 phút để giữ nhịp từ vựng ngày bận.',
      5,
      'sprint',
    );
    const shortPick = (['w2', 'v2', 'v3', 'l2'] as GameId[]).sort(
      (a, b) => daysSinceLastPlay(b, recentAttempts, date) - daysSinceLastPlay(a, recentAttempts, date),
    )[0];
    if (shortPick) {
      pushTask(shortPick, 'Bài ngắn 5 phút cho ngày bận.', 5, 'sprint');
    }
    return { date, goalMinutes: 10, totalMinutes, weakestSkill, tasks };
  }

  // 1. Daily Run (V1) always first if cards are due
  if (dueCardsCount > 0) {
    const v1Min = goalMinutes <= 15 ? 8 : Math.min(15, Math.max(8, Math.ceil(dueCardsCount / 4)));
    pushTask(
      'v1',
      `Ôn ${dueCardsCount} thẻ đến hạn để giữ trí nhớ dài hạn.`,
      v1Min,
    );
  }

  // Busy day mode (<= 15 min): Daily Run + 1 short game
  if (goalMinutes <= 15) {
    const shortCandidates: GameId[] = ['v2', 'v3', 'l2', 's2', 'w2'];
    const pick = shortCandidates
      .filter((g) => !usedGames.has(g))
      .sort(
        (a, b) =>
          daysSinceLastPlay(b, recentAttempts, date) -
          daysSinceLastPlay(a, recentAttempts, date),
      )[0];
    if (pick) {
      pushTask(pick, 'Phiên ngắn ngày bận để giữ nhịp học.', 7);
    }
    return { date, goalMinutes, totalMinutes, weakestSkill, tasks };
  }

  // 2. Weekly Exam Room (X1) check: >= 7 days since last X1 & local weekend (F3)
  const daysSinceX1 = daysSinceLastPlay('x1', recentAttempts, date);
  const localDayOfWeek = localStudyDate(now).getDay(); // 0 Sun, 6 Sat (local study day)
  const isWeekend = localDayOfWeek === 0 || localDayOfWeek === 6;
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
    date,
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
  const playedWYesterday = playedSkillYesterday('W', recentAttempts, date);
  const playedSYesterday = playedSkillYesterday('S', recentAttempts, date);
  const targetMaxTasks = goalMinutes >= 60 ? 4 : 3;

  for (let i = 1; i < skillGaps.length && tasks.length < targetMaxTasks; i++) {
    if (totalMinutes >= goalMinutes - 5) break;
    const { skill } = skillGaps[i];
    if (
      (skill === 'W' && playedWYesterday) ||
      (skill === 'S' && playedSYesterday)
    ) {
      continue;
    }
    const remainingBudget = goalMinutes - totalMinutes + 5;
    const gameId = pickBestGameForSkill(
      skill,
      profile,
      recentAttempts,
      date,
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

  // 4b. PP-06 Four Strands: nếu có mạch < 15% trong 7 ngày gần nhất thì đề xuất bù
  const strands = computeFourStrands(recentAttempts, now, 7);
  if (strands.underrepresented.length > 0 && tasks.length < 4) {
    for (const lowStrand of strands.underrepresented) {
      if (tasks.length >= 4) break;
      const alreadyCovered = tasks.some((t) => PLANNER_GAMES[t.gameId].strand === lowStrand);
      if (alreadyCovered) continue;
      const candidate = STRAND_GAMES[lowStrand].find((g) => {
        if (usedGames.has(g)) return false;
        if ((g === 'w1' || g === 'w2') && playedWYesterday && weakestSkill !== 'W') return false;
        if ((g === 's1' || g === 's2') && playedSYesterday && weakestSkill !== 'S') return false;
        return true;
      });
      if (candidate) {
        pushTask(
          candidate,
          `Bù mạch ${STRAND_LABELS_VI[lowStrand]} (dưới 15% trong 7 ngày qua) để cân bằng 4 mạch học.`,
        );
      }
    }
  }

  // 4c. PP-10 Output hypothesis: ngày có >= 20 phút luôn có >= 1 việc sản xuất (W/S),
  // vẫn tôn trọng luật luân phiên W/S nếu hôm qua vừa làm W thì chọn S2.
  const hasProductiveTask = tasks.some((t) => PRODUCTIVE_GAMES.has(t.gameId));
  if (goalMinutes >= 20 && !hasProductiveTask) {
    const prodCandidates: GameId[] = playedWYesterday
      ? ['s2', 's1']
      : ['w2', 's2', 'w1', 's1'];
    const prodPick = prodCandidates.find((g) => !usedGames.has(g));
    if (prodPick) {
      if (tasks.length >= 4) {
        // Thay thế task phụ cuối cùng nếu đã đủ 4 việc
        const dropped = tasks.pop();
        if (dropped) {
          usedGames.delete(dropped.gameId);
          totalMinutes -= dropped.estMinutes;
        }
      }
      pushTask(
        prodPick,
        'Việc sản xuất mỗi ngày giúp chuyển từ vựng nhận diện sang dùng được thật.',
      );
    }
  }

  // 5. Interleaved vocab/collocation/paraphrase bridge if still under target count or minutes
  const bridgeGames: GameId[] = ['v2', 'v3', 'l2', 's2', 'w2'].filter((g) => {
    if ((g === 'w2') && playedWYesterday && weakestSkill !== 'W') return false;
    if ((g === 's2') && playedSYesterday && weakestSkill !== 'S') return false;
    return true;
  }) as GameId[];
  bridgeGames.sort(
    (a, b) =>
      daysSinceLastPlay(b, recentAttempts, date) -
      daysSinceLastPlay(a, recentAttempts, date),
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
