import type { ProgressPayload, ProgressResult } from '../../core/storage/repos/attemptRepo';

export interface ProgressSink {
  saveProgress(payload: ProgressPayload): Promise<ProgressResult>;
  finalize(attemptId: number, payload: Omit<ProgressPayload, 'attemptId'>): Promise<ProgressResult>;
}

interface SaverSession {
  attemptId?: number;
  finalized: boolean;
}

/**
 * Ghi tiến độ run xuống DB theo hàng đợi tuần tự (G3). Mỗi run (kể cả "Làm lại câu sai") có 1 session
 * riêng và job chụp session LÚC XẾP HÀNG, nên bấm làm lại nhanh không khiến job `finalize` của run cũ
 * thấy "chưa có attempt" rồi tạo attempt mới và ghi lại toàn bộ review + XP lần 2.
 */
export function createProgressSaver(sink: ProgressSink) {
  let session: SaverSession = { finalized: false };
  let chain: Promise<void> = Promise.resolve();

  return {
    /** `payload = null` = run chưa có gì đáng ghi. Trả về promise xong khi hàng đợi hiện tại đã ghi xong. */
    persist(payload: Omit<ProgressPayload, 'attemptId'> | null, final: boolean): Promise<void> {
      const mine = session;
      if (!payload) {
        if (final) mine.finalized = true;
        return chain;
      }
      chain = chain.then(async () => {
        try {
          let created = false;
          if (mine.attemptId === undefined) {
            const res = await sink.saveProgress(payload);
            mine.attemptId = res.attemptId;
            created = true;
          }
          if (final) {
            await sink.finalize(mine.attemptId, payload);
            mine.finalized = true;
          } else if (!created) {
            await sink.saveProgress({ ...payload, attemptId: mine.attemptId });
          }
        } catch {
          // Lỗi ghi DB không được chặn người học; lần lưu kế tiếp sẽ ghi bù (idempotent).
        }
      });
      return chain;
    },
    /** Bắt đầu run mới: các job đã xếp hàng vẫn thuộc về run cũ. */
    reset(): void {
      session = { finalized: false };
    },
    isFinalized(): boolean {
      return session.finalized;
    },
  };
}
