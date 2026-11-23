import {
  PLANNER_GAMES,
  swapPlanTask,
  type DailyPlan,
  type GameId,
  type PlannedTask,
} from '../../core/planner/today';

/**
 * Lọc kế hoạch Hôm nay theo game "sẵn sàng" (F12): không bao giờ gợi ý game chưa có
 * (S1, S2, X1...). Hàm thuần để test; `isReady` lấy từ `isGameReady` của registry.
 */

export const SWAP_REASON_VI = 'Đã đổi theo lựa chọn của bạn.';
const FALLBACK_REASON_VI = 'Bài luyện thay thế phù hợp với kế hoạch hôm nay.';

/** Game đã sẵn sàng, chưa có trong kế hoạch, khác `current`; thứ tự theo `allGames`. */
export function swapCandidates(
  plan: DailyPlan,
  current: GameId,
  allGames: readonly GameId[],
  isReady: (g: GameId) => boolean,
): GameId[] {
  const used = new Set(plan.tasks.map((t) => t.gameId));
  return allGames.filter((g) => g !== current && !used.has(g) && isReady(g));
}

/** Đổi 1 việc sang game kế tiếp còn trống; trả `null` nếu không còn game nào để đổi. */
export function swapToReadyGame(
  plan: DailyPlan,
  task: PlannedTask,
  allGames: readonly GameId[],
  isReady: (g: GameId) => boolean,
  pick: (candidates: GameId[]) => GameId = (c) => c[0],
): DailyPlan | null {
  const candidates = swapCandidates(plan, task.gameId, allGames, isReady);
  if (candidates.length === 0) return null;
  return swapPlanTask(plan, task.id, pick(candidates));
}

/**
 * Thay (hoặc bỏ) mọi việc chưa xong trỏ vào game chưa sẵn sàng.
 * Ưu tiên game cùng nhóm kỹ năng; hết chỗ thay thì bỏ việc đó.
 */
export function ensureReadyTasks(
  plan: DailyPlan,
  allGames: readonly GameId[],
  isReady: (g: GameId) => boolean,
): DailyPlan {
  let next = plan;
  for (const task of plan.tasks) {
    if (task.completed || isReady(task.gameId)) continue;
    const candidates = swapCandidates(next, task.gameId, allGames, isReady);
    const sameSkill = candidates.find((g) => PLANNER_GAMES[g].skillGroup === task.skillGroup);
    const replacement = sameSkill ?? candidates[0];
    if (replacement) {
      next = swapPlanTask(next, task.id, replacement);
      next = {
        ...next,
        tasks: next.tasks.map((t) =>
          t.id === task.id ? { ...t, reasonVi: FALLBACK_REASON_VI } : t,
        ),
      };
    } else {
      const tasks = next.tasks.filter((t) => t.id !== task.id);
      next = {
        ...next,
        tasks,
        totalMinutes: tasks.reduce((sum, t) => sum + t.estMinutes, 0),
      };
    }
  }
  return next;
}
