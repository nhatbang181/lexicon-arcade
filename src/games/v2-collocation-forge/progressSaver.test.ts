import { describe, expect, it } from 'vitest';
import { createProgressSaver, type ProgressSink } from './progressSaver';
import type { ProgressPayload } from '../../core/storage/repos/attemptRepo';

const payload = (xp: number): Omit<ProgressPayload, 'attemptId'> => ({
  attempt: { gameId: 'v2', mode: 'training', startedAt: 1, endedAt: 2, score: 1, total: 1, xp, items: [] },
  reviews: [],
});

function fakeSink() {
  const calls: string[] = [];
  let nextId = 1;
  let release: (() => void) | undefined;
  const gate = new Promise<void>((r) => (release = r));
  const sink: ProgressSink & { release: () => void } = {
    release: () => release?.(),
    async saveProgress(p) {
      await gate;
      const id = p.attemptId ?? nextId++;
      calls.push(`save:${id}${p.attemptId === undefined ? ':new' : ''}`);
      return { attemptId: id, totalXp: 0, streakCount: 0, reviewsSaved: 0 };
    },
    async finalize(id) {
      calls.push(`final:${id}`);
      return { attemptId: id, totalXp: 0, streakCount: 0, reviewsSaved: 0 };
    },
  };
  return { sink, calls };
}

describe('createProgressSaver (G3, chống ghi trùng khi "Làm lại câu sai")', () => {
  it('reset trước khi job finalize của run cũ chạy: run cũ KHÔNG tạo attempt thứ hai', async () => {
    const { sink, calls } = fakeSink();
    const saver = createProgressSaver(sink);
    // Run 1 chốt ở Recap, job còn nằm trong hàng đợi (DB chậm)
    const finalJob = saver.persist(payload(50), true);
    // Người học bấm "Làm lại câu sai" ngay: reset session trước khi job chạy
    saver.reset();
    sink.release();
    await finalJob;
    // Run 2 lưu tiến độ
    await saver.persist(payload(10), false);
    // Run 1: 1 attempt mới + finalize cùng id; run 2: attempt mới riêng. Không có lần ghi 2 lần cho run 1.
    expect(calls).toEqual(['save:1:new', 'final:1', 'save:2:new']);
    expect(saver.isFinalized()).toBe(false);
  });

  it('cùng 1 run: lưu nhiều lần dùng chung attempt, finalize đúng id đó', async () => {
    const { sink, calls } = fakeSink();
    sink.release();
    const saver = createProgressSaver(sink);
    await saver.persist(payload(5), false);
    await saver.persist(payload(10), false);
    await saver.persist(payload(15), true);
    expect(calls).toEqual(['save:1:new', 'save:1', 'final:1']);
    expect(saver.isFinalized()).toBe(true);
  });

  it('bấm "Làm lại" hai lần liên tiếp không tạo thêm attempt rỗng', async () => {
    const { sink, calls } = fakeSink();
    sink.release();
    const saver = createProgressSaver(sink);
    saver.reset();
    saver.reset();
    await saver.persist(null, false);
    expect(calls).toEqual([]);
  });
});
