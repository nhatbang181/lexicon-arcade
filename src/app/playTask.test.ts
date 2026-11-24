import { describe, expect, it } from 'vitest';
import { playPath } from './playTask';

describe('playPath (F5)', () => {
  it('từ Hub: không query khi luyện, có mode khi thi/tốc độ', () => {
    expect(playPath('v1', 'hub')).toBe('/play/v1');
    expect(playPath('v1', 'hub', undefined, 'training')).toBe('/play/v1');
    expect(playPath('x1', 'hub', undefined, 'exam')).toBe('/play/x1?mode=exam');
  });

  it('từ Hôm nay: mang from, task và mode (khớp nút Bắt đầu)', () => {
    expect(playPath('r1', 'today', 't1')).toBe('/play/r1?from=today&task=t1');
    expect(playPath('r1', 'today', 't1', 'training')).toBe('/play/r1?from=today&task=t1');
    expect(playPath('r1', 'today', 't 1', 'sprint')).toBe('/play/r1?from=today&task=t%201&mode=sprint');
    expect(playPath('r1', 'today', undefined, 'exam')).toBe('/play/r1?from=today&mode=exam');
  });
});
