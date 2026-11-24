import { beforeEach, describe, expect, it, vi } from 'vitest';
import { audioFileExists, clearAudioAvailabilityCache, filterByAudioFile } from './audioAvailability';

function res(ok: boolean, type = 'audio/mpeg') {
  return { ok, headers: { get: () => type } } as unknown as Response;
}

describe('audioAvailability · kiểm file audio thật (L1-01, L2-01)', () => {
  beforeEach(() => clearAudioAvailabilityCache());

  it('200 + audio/mpeg → có; 404 → thiếu', async () => {
    const fetchImpl = vi.fn(async (url: RequestInfo | URL) =>
      String(url).includes('p1_001') ? res(true) : res(false),
    ) as unknown as typeof fetch;
    expect(await audioFileExists('audio/listening/p1_001.mp3', { fetchImpl, baseUrl: '/' })).toBe(true);
    expect(await audioFileExists('audio/listening/p1_002.mp3', { fetchImpl, baseUrl: '/' })).toBe(false);
  });

  it('SPA fallback trả 200 + text/html cho file không tồn tại → thiếu', async () => {
    const fetchImpl = vi.fn(async () => res(true, 'text/html; charset=utf-8')) as unknown as typeof fetch;
    expect(await audioFileExists('audio/listening/none.mp3', { fetchImpl, baseUrl: '/' })).toBe(false);
  });

  it('lỗi mạng → không đủ bằng chứng để ẩn (coi là có)', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await audioFileExists('audio/x.mp3', { fetchImpl, baseUrl: '/' })).toBe(true);
  });

  it('đường dẫn rỗng → thiếu', async () => {
    expect(await audioFileExists('')).toBe(false);
  });

  it('filterByAudioFile giữ thứ tự và chỉ giữ mục có file', async () => {
    const fetchImpl = vi.fn(async (url: RequestInfo | URL) =>
      /a\.mp3|c\.mp3/.test(String(url)) ? res(true) : res(false),
    ) as unknown as typeof fetch;
    const items = [{ p: 'a.mp3' }, { p: 'b.mp3' }, { p: 'c.mp3' }, { p: undefined }];
    const kept = await filterByAudioFile(items, (i) => i.p, { fetchImpl, baseUrl: '/' });
    expect(kept.map((i) => i.p)).toEqual(['a.mp3', 'c.mp3']);
  });
});
