import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LexiconV3DB } from '../storage/db';
import { attemptRepo, profileRepo } from '../storage/repos';
import { applySessionLevel, readSkillLevel } from './applySessionLevel';
import {
  bandToLevel,
  formatBandLabel,
  levelToBand,
  modeLabelVi,
  parsePlayMode,
  replayLevelFromAttempts,
  type AttemptForLevel,
} from './sessionLevel';
import { hasProgressSavers, registerProgressSaver, runProgressSavers } from './progressSaver';
import { adjustDifficulty, type TurnOutcome } from './difficulty';

function items(correct: number, total: number): TurnOutcome[] {
  return Array.from({ length: total }, (_, i) => ({ correct: i < correct }));
}

function attempt(id: number, correct: number, total: number, mode: 'training' | 'exam' = 'training'): AttemptForLevel {
  return { id, mode, items: items(correct, total) };
}

describe('src/core/adaptive/sessionLevel (thuần)', () => {
  it('đổi qua lại level <-> band theo thang chung 4.0 = L1, 6.0 = L5, 8.0 = L9, 8.5+ = L10', () => {
    expect(bandToLevel(4.0)).toBe(1);
    expect(bandToLevel(6.0)).toBe(5);
    expect(bandToLevel(8.0)).toBe(9);
    expect(bandToLevel(9.0)).toBe(10);
    expect(levelToBand(1)).toBe(4.0);
    expect(levelToBand(5)).toBe(6.0);
    expect(levelToBand(99)).toBe(8.5);
    expect(formatBandLabel(7)).toBe('Band ≈ 7.0');
    expect(formatBandLabel(7)).not.toMatch(/Level/);
  });

  it('nhãn chế độ bằng tiếng Việt, mode lạ rơi về Luyện/training', () => {
    expect(modeLabelVi('training')).toBe('Luyện');
    expect(modeLabelVi('exam')).toBe('Thi');
    expect(parsePlayMode('exam', ['training', 'sprint'])).toBe('training');
    expect(parsePlayMode('sprint', ['training', 'sprint'])).toBe('sprint');
    expect(parsePlayMode(null, ['exam'])).toBe('exam');
  });

  it('ngưỡng B6: 90% -> +1, 65% -> -1, 70% giữ nguyên', () => {
    const st = { level: 4, turnsSinceLastChange: 20 };
    expect(adjustDifficulty(st, items(18, 20)).direction).toBe('up');
    expect(adjustDifficulty(st, items(13, 20)).direction).toBe('down');
    expect(adjustDifficulty(st, items(14, 20)).direction).toBe('hold');
    expect(adjustDifficulty(st, items(17, 20)).direction).toBe('hold');
  });

  it('20 lượt đúng 95% -> +1; 60% -> -1', () => {
    const up = replayLevelFromAttempts({ level: 3, turnsSinceLastChange: 0, lastAttemptId: 0 }, [
      attempt(1, 19, 20),
    ]);
    expect(up.level).toBe(4);
    expect(up.direction).toBe('up');

    const down = replayLevelFromAttempts({ level: 3, turnsSinceLastChange: 0, lastAttemptId: 0 }, [
      attempt(1, 12, 20),
    ]);
    expect(down.level).toBe(2);
    expect(down.direction).toBe('down');
  });

  it('chưa đủ 10 lượt thì giữ nguyên; cooldown 10 lượt chặn đổi liên tiếp', () => {
    const few = replayLevelFromAttempts({ level: 3, turnsSinceLastChange: 0, lastAttemptId: 0 }, [
      attempt(1, 6, 6),
    ]);
    expect(few.level).toBe(3);
    expect(few.changed).toBe(false);

    // phiên 1 (10 lượt đúng hết) lên 1 bậc; phiên 2 chỉ 5 lượt nên còn trong cooldown
    const two = replayLevelFromAttempts({ level: 3, turnsSinceLastChange: 0, lastAttemptId: 0 }, [
      attempt(1, 10, 10),
      attempt(2, 5, 5),
    ]);
    expect(two.level).toBe(4);
  });

  it('exam không đổi bậc và không vào cửa sổ; chạy lại không đổi (idempotent)', () => {
    const start = { level: 3, turnsSinceLastChange: 0, lastAttemptId: 0 };
    const withExam = replayLevelFromAttempts(start, [attempt(1, 0, 20, 'exam')]);
    expect(withExam.level).toBe(3);
    expect(withExam.processed).toBe(0);

    const first = replayLevelFromAttempts(start, [attempt(1, 20, 20)]);
    const again = replayLevelFromAttempts(first, [attempt(1, 20, 20)]);
    expect(first.level).toBe(4);
    expect(again.level).toBe(4);
    expect(again.processed).toBe(0);
  });

  it('level bị kẹp trong 1..10', () => {
    const top = replayLevelFromAttempts({ level: 10, turnsSinceLastChange: 0, lastAttemptId: 0 }, [attempt(1, 20, 20)]);
    const bottom = replayLevelFromAttempts({ level: 1, turnsSinceLastChange: 0, lastAttemptId: 0 }, [attempt(1, 0, 20)]);
    expect(top.level).toBe(10);
    expect(bottom.level).toBe(1);
  });
});

describe('src/core/adaptive/progressSaver', () => {
  it('chạy mọi saver, báo lỗi và hết giờ', async () => {
    expect(hasProgressSavers()).toBe(false);
    expect(await runProgressSavers()).toEqual({ attempted: 0, failed: 0, timedOut: false });

    let saved = 0;
    const off1 = registerProgressSaver(async () => {
      saved += 1;
    });
    const off2 = registerProgressSaver(() => {
      throw new Error('boom');
    });
    expect(hasProgressSavers()).toBe(true);
    const res = await runProgressSavers();
    expect(saved).toBe(1);
    expect(res).toEqual({ attempted: 2, failed: 1, timedOut: false });
    off1();
    off2();

    const off3 = registerProgressSaver(() => new Promise<void>(() => undefined));
    const slow = await runProgressSavers(20);
    expect(slow.timedOut).toBe(true);
    off3();
    expect(hasProgressSavers()).toBe(false);
  });
});

describe('src/core/adaptive/applySessionLevel (IndexedDB)', () => {
  let testDb: LexiconV3DB;

  beforeEach(async () => {
    testDb = new LexiconV3DB(`AdaptiveTest_${Math.random().toString(36).slice(2)}`);
    await testDb.open();
  });
  afterEach(async () => {
    await testDb.delete();
  });

  async function saveAttempt(gameId: 'v3' | 'l2' | 'l1', correct: number, total: number, t: number) {
    await attemptRepo.save(
      {
        gameId,
        mode: 'training',
        startedAt: t,
        endedAt: t + 1000,
        score: correct,
        total,
        xp: 0,
        items: Array.from({ length: total }, (_, i) => ({ itemId: `i${t}_${i}`, correct: i < correct })),
      },
      testDb,
    );
  }

  it('placement ghi skillLevels.l1 = 3 -> PlayScreen đọc được level 3', async () => {
    const p = await profileRepo.getOrCreate(testDb);
    await profileRepo.update({ skillLevels: { ...p.skillLevels, l1: 3 } }, testDb);
    expect(await readSkillLevel('l1', testDb)).toBe(3);
    expect((await applySessionLevel('l1', testDb)).level).toBe(3);
  });

  it('2 phiên V3 đúng 100% -> level tăng ở phiên 3 và lưu vào profile', async () => {
    const p = await profileRepo.getOrCreate(testDb);
    await profileRepo.update({ skillLevels: { ...p.skillLevels, v3: 3 } }, testDb);

    await saveAttempt('v3', 6, 6, 1000);
    const afterOne = await applySessionLevel('v3', testDb);
    expect(afterOne.level).toBe(3);

    await saveAttempt('v3', 6, 6, 5000);
    const afterTwo = await applySessionLevel('v3', testDb);
    expect(afterTwo).toMatchObject({ level: 4, changed: true, direction: 'up' });
    expect((await profileRepo.get(testDb))?.skillLevels.v3).toBe(4);

    // gọi lại không đổi
    expect((await applySessionLevel('v3', testDb)).level).toBe(4);
  });

  it('L2 tự quản level: không bị đổi', async () => {
    await saveAttempt('l2', 20, 20, 1000);
    const res = await applySessionLevel('l2', testDb);
    expect(res.changed).toBe(false);
    expect(res.level).toBe(1);
  });
});
