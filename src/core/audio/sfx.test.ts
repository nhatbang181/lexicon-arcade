import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeHowlOptions {
  sprite: Record<string, [number, number]>;
  volume: number;
}
const created: Array<{ options: FakeHowlOptions; unloaded: boolean }> = [];

vi.mock('howler', () => {
  class FakeHowl {
    public record: { options: FakeHowlOptions; unloaded: boolean };
    constructor(options: FakeHowlOptions) {
      this.record = { options, unloaded: false };
      created.push(this.record);
    }
    play(): number {
      return 1;
    }
    rate(): void {}
    volume(): void {}
    mute(): void {}
    unload(): void {
      this.record.unloaded = true;
    }
  }
  return { Howl: FakeHowl };
});

describe('X-04 · SFX dựng Howl theo offset trong sfx.json', () => {
  beforeEach(() => {
    created.length = 0;
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('manifest khác offset mặc định → dựng lại Howl với sprite mới và huỷ bản cũ', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ sprite: { correct: [1000, 300] } }) })),
    );
    const { sfxEngine, DEFAULT_SFX_SPRITE } = await import('./sfx');
    sfxEngine.init();
    expect(created).toHaveLength(1);
    expect(created[0].options.sprite.correct).toEqual(DEFAULT_SFX_SPRITE.correct);

    await sfxEngine.syncManifest();
    expect(created).toHaveLength(2);
    expect(created[0].unloaded).toBe(true);
    expect(created[1].options.sprite.correct).toEqual([1000, 300]);
    expect(created[1].options.sprite.tap).toEqual(DEFAULT_SFX_SPRITE.tap);
  });

  it('manifest trùng offset mặc định → giữ nguyên Howl (không dựng lại)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ sprite: {} }) })),
    );
    const { sfxEngine } = await import('./sfx');
    sfxEngine.init();
    await sfxEngine.syncManifest();
    expect(created).toHaveLength(1);
    expect(created[0].unloaded).toBe(false);
  });

  it('không tải được manifest → vẫn phát bằng offset mặc định', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    const { sfxEngine } = await import('./sfx');
    sfxEngine.init();
    await sfxEngine.syncManifest();
    expect(created).toHaveLength(1);
    expect(sfxEngine.play('tap')).toBe(1);
  });
});
