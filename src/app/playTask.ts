import { formatDateKey } from '../core/gamification/streak';
import { planRepo } from '../core/storage/repos/planRepo';
import { isGameReady } from '../games/registry';

export interface NextTaskInfo {
  taskId: string;
  gameId: string;
  title: string;
  /** Đường dẫn app để mở việc kế tiếp, ví dụ `/play/r1?from=today&task=...`. */
  path: string;
}

export type PlayOrigin = 'today' | 'hub';

export function playPath(
  gameId: string,
  origin: PlayOrigin,
  taskId?: string,
  mode?: string,
): string {
  const modeQuery = mode && mode !== 'training' ? `mode=${encodeURIComponent(mode)}` : '';
  if (origin !== 'today') return modeQuery ? `/play/${gameId}?${modeQuery}` : `/play/${gameId}`;
  const task = taskId ? `&task=${encodeURIComponent(taskId)}` : '';
  return `/play/${gameId}?from=today${task}${modeQuery ? `&${modeQuery}` : ''}`;
}

/**
 * Việc kế tiếp trong kế hoạch Hôm nay (F5): ưu tiên việc chưa xong đứng sau việc hiện tại,
 * rồi mới tới các việc chưa xong đứng trước; chỉ lấy game đã sẵn sàng.
 */
export async function findNextTask(
  currentTaskId: string | null,
  currentGameId: string,
  now: Date = new Date(),
): Promise<NextTaskInfo | null> {
  const plan = await planRepo.get(formatDateKey(now));
  if (!plan || plan.tasks.length === 0) return null;

  const idx = currentTaskId ? plan.tasks.findIndex((t) => t.id === currentTaskId) : -1;
  const open = plan.tasks.filter(
    (t) => !t.completed && t.id !== currentTaskId && t.gameId !== currentGameId && isGameReady(t.gameId),
  );
  if (open.length === 0) return null;

  const after = open.find((t) => plan.tasks.indexOf(t) > idx);
  const next = after ?? open[0];
  return {
    taskId: next.id,
    gameId: next.gameId,
    title: next.title,
    path: playPath(next.gameId, 'today', next.id, next.mode),
  };
}
