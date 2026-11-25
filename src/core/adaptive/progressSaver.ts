/**
 * Đăng ký "lưu giữa phiên" cho game (F1/F4).
 * PlayScreen gọi `runProgressSavers()` khi người chơi chọn "Lưu và thoát".
 * Game đang chơi gọi `registerProgressSaver(fn)` (trả về hàm huỷ đăng ký) để lưu tiến độ dở dang.
 * Logic thuần, không React, không DOM.
 */

export type ProgressSaver = () => void | Promise<void>;

const savers = new Set<ProgressSaver>();

export function registerProgressSaver(saver: ProgressSaver): () => void {
  savers.add(saver);
  return () => {
    savers.delete(saver);
  };
}

export function hasProgressSavers(): boolean {
  return savers.size > 0;
}

export function clearProgressSavers(): void {
  savers.clear();
}

export interface RunProgressSaversResult {
  attempted: number;
  failed: number;
  timedOut: boolean;
}

/** Chạy mọi saver song song, chờ tối đa `timeoutMs` (mặc định 3 s) rồi cho phép thoát. */
export async function runProgressSavers(timeoutMs = 3000): Promise<RunProgressSaversResult> {
  const current = [...savers];
  if (current.length === 0) return { attempted: 0, failed: 0, timedOut: false };

  let failed = 0;
  const jobs = current.map(async (saver) => {
    try {
      await saver();
    } catch {
      failed += 1;
    }
  });

  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.all(jobs),
    new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        timedOut = true;
        resolve();
      }, timeoutMs);
    }),
  ]);
  if (timer) clearTimeout(timer);
  return { attempted: current.length, failed, timedOut };
}
