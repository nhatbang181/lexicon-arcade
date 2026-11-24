import { beforeAll, describe, expect, it } from 'vitest';
import { createInitialStreak, formatDateKey, msUntilNextDay, updateStreak } from './streak';

// F3: ngày học theo giờ địa phương (Việt Nam, UTC+7), chuyển ngày lúc 04:00.
beforeAll(() => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
});

// Giờ Việt Nam -> mốc UTC. 23/11/2026 là thứ Hai.
const vn = (day: number, hh: number, mm: number) =>
  new Date(Date.UTC(2026, 10, day, hh - 7, mm, 0));

describe('streak theo giờ địa phương + chuyển ngày 04:00 (F3)', () => {
  it('máy chạy đúng múi giờ UTC+7', () => {
    expect(new Date(vn(23, 8, 0)).getTimezoneOffset()).toBe(-420);
  });

  it('06:30 sáng vẫn là ngày hôm đó (UTC sẽ báo nhầm ngày trước)', () => {
    expect(formatDateKey(vn(24, 6, 30))).toBe('2026-11-24');
    expect(formatDateKey(vn(23, 8, 0))).toBe('2026-11-23');
  });

  it('00:00-03:59 còn tính là ngày hôm trước, 04:00 là ngày mới', () => {
    expect(formatDateKey(vn(24, 3, 59))).toBe('2026-11-23');
    expect(formatDateKey(vn(24, 0, 5))).toBe('2026-11-23');
    expect(formatDateKey(vn(24, 4, 0))).toBe('2026-11-24');
  });

  it('phiên 08:00 T2, 06:30 T3, 08:00 T4 -> count = 3, freeze không giảm', () => {
    let st = createInitialStreak();
    const freezeStart = st.freezes;
    for (const at of [vn(23, 8, 0), vn(24, 6, 30), vn(25, 8, 0)]) {
      st = updateStreak(st, formatDateKey(at)).state;
    }
    expect(st.count).toBe(3);
    expect(st.freezes).toBe(freezeStart);
    expect(st.freezeUsedDates).toEqual([]);
    expect(st.lastActiveDay).toBe('2026-11-25');
  });

  it('cộng ngày qua cuối tháng vẫn đúng (không lệch múi giờ)', () => {
    let st = createInitialStreak();
    for (const at of [vn(30, 9, 0), new Date(Date.UTC(2026, 11, 1, 2, 0, 0))]) {
      st = updateStreak(st, formatDateKey(at)).state;
    }
    expect(st.count).toBe(2);
    // bỏ 1 ngày (2/12) rồi học 3/12 -> dùng 1 freeze, ngày được bảo vệ là 2026-12-02
    const res = updateStreak(st, formatDateKey(new Date(Date.UTC(2026, 11, 3, 2, 0, 0))));
    expect(res.freezeUsed).toBe(true);
    expect(res.state.freezeUsedDates).toEqual(['2026-12-02']);
  });
});

describe('qua năm (31/12 -> 01/01) và mốc chuyển ngày kế tiếp', () => {
  // Giờ Việt Nam -> mốc UTC, theo năm/tháng/ngày tuỳ ý (tháng 1-12).
  const at = (y: number, mo: number, d: number, hh: number, mm: number) =>
    new Date(Date.UTC(y, mo - 1, d, hh - 7, mm, 0));

  it('31/12 03:59 vẫn là ngày cũ, 01/01 03:59 vẫn là 31/12, 01/01 04:00 là ngày mới', () => {
    expect(formatDateKey(at(2026, 12, 31, 3, 59))).toBe('2026-12-30');
    expect(formatDateKey(at(2027, 1, 1, 3, 59))).toBe('2026-12-31');
    expect(formatDateKey(at(2027, 1, 1, 4, 0))).toBe('2027-01-01');
  });

  it('chuỗi 30/12 -> 31/12 -> 01/01 03:00 -> 01/01 09:00 = 3, không mất freeze', () => {
    let st = createInitialStreak();
    const freezeStart = st.freezes;
    for (const t of [at(2026, 12, 30, 9, 0), at(2026, 12, 31, 9, 0), at(2027, 1, 1, 3, 0), at(2027, 1, 1, 9, 0)]) {
      st = updateStreak(st, formatDateKey(t)).state;
    }
    expect(st.count).toBe(3);
    expect(st.freezes).toBe(freezeStart);
    expect(st.lastActiveDay).toBe('2027-01-01');
  });

  it('msUntilNextDay: đến đúng 04:00, kể cả qua năm', () => {
    expect(msUntilNextDay(at(2026, 12, 31, 3, 59))).toBe(60_000);
    expect(msUntilNextDay(at(2026, 12, 31, 4, 0))).toBe(24 * 3_600_000);
    expect(msUntilNextDay(at(2026, 12, 31, 23, 0))).toBe(5 * 3_600_000);
    expect(formatDateKey(new Date(at(2026, 12, 31, 3, 59).getTime() + msUntilNextDay(at(2026, 12, 31, 3, 59))))).toBe('2026-12-31');
  });
});

describe('displayStreakCount', () => {
  it('chuỗi gãy hiện 0, chuỗi còn sống hiện số thật', async () => {
    const { displayStreakCount } = await import('./streak');
    const st = { count: 12, longest: 12, lastActiveDay: '2026-11-18', freezes: 0, freezeUsedDates: [] };
    expect(displayStreakCount(st, vn(23, 9, 0))).toBe(0); // 5 ngày trước
    expect(displayStreakCount({ ...st, lastActiveDay: '2026-11-22' }, vn(23, 9, 0))).toBe(12);
    expect(displayStreakCount({ ...st, lastActiveDay: '2026-11-23' }, vn(23, 9, 0))).toBe(12);
    expect(displayStreakCount({ ...st, lastActiveDay: null }, vn(23, 9, 0))).toBe(0);
  });
});
