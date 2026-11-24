import { Howl } from 'howler';

export type CanonicalSfxCue =
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'streak'
  | 'sessionDone'
  | 'levelUp'
  | 'tick'
  | 'countdownEnd'
  | 'flip'
  | 'highlight'
  | 'recordStart'
  | 'recordStop';

export type AliasSfxCue =
  | 'combo'
  | 'reveal'
  | 'timeup'
  | 'goal'
  | 'levelup'
  | 'record_start'
  | 'record_stop'
  | 'page';

export type SfxName = CanonicalSfxCue | AliasSfxCue;

export type SfxSpriteMap = Record<string, [number, number]>;

export interface SfxCueMetadata {
  name: CanonicalSfxCue;
  alias?: AliasSfxCue;
  label: string;
  descriptionVi: string;
}

export const CANONICAL_SFX_CUES: readonly SfxCueMetadata[] = [
  { name: 'tap', label: 'tap', descriptionVi: 'Bấm nút, chọn đáp án (≤ 60ms)' },
  { name: 'correct', label: 'correct', descriptionVi: 'Đáp án đúng, 2 nốt sáng' },
  { name: 'wrong', label: 'wrong', descriptionVi: 'Đáp án sai, trầm mềm (-4 dB)' },
  { name: 'streak', alias: 'combo', label: 'streak', descriptionVi: 'Chuỗi combo x3 / x5' },
  { name: 'sessionDone', alias: 'goal', label: 'sessionDone', descriptionVi: 'Hoàn thành phiên / mục tiêu ngày' },
  { name: 'levelUp', alias: 'levelup', label: 'levelUp', descriptionVi: 'Lên level / mốc lớn' },
  { name: 'tick', label: 'tick', descriptionVi: 'Đếm ngược 10 giây cuối (40%)' },
  { name: 'countdownEnd', alias: 'timeup', label: 'countdownEnd', descriptionVi: 'Hết giờ làm bài' },
  { name: 'flip', alias: 'page', label: 'flip', descriptionVi: 'Lật thẻ FSRS, chuyển câu' },
  { name: 'highlight', alias: 'reveal', label: 'highlight', descriptionVi: 'Highlight bằng chứng / hiện đáp án' },
  { name: 'recordStart', alias: 'record_start', label: 'recordStart', descriptionVi: 'Bắt đầu ghi âm Speaking' },
  { name: 'recordStop', alias: 'record_stop', label: 'recordStop', descriptionVi: 'Dừng ghi âm Speaking' },
] as const;

export const DEFAULT_SFX_SPRITE: SfxSpriteMap = {
  tap: [0, 20],
  correct: [132, 260],
  wrong: [512, 104],
  streak: [736, 320],
  combo: [736, 320],
  sessionDone: [1176, 490],
  goal: [1176, 490],
  levelUp: [1787, 412],
  levelup: [1787, 412],
  tick: [2319, 27],
  countdownEnd: [2465, 120],
  timeup: [2465, 120],
  flip: [2705, 140],
  page: [2705, 140],
  highlight: [2965, 240],
  reveal: [2965, 240],
  recordStart: [3325, 150],
  record_start: [3325, 150],
  recordStop: [3595, 150],
  record_stop: [3595, 150],
};

export interface PlaySfxOptions {
  rate?: number;
  examMode?: boolean;
  blockedBySpeechOrTrack?: boolean;
}

function getBaseUrl(): string {
  const base = import.meta.env?.BASE_URL ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

class SfxEngine {
  private howl: Howl | null = null;
  private spriteMap: SfxSpriteMap = { ...DEFAULT_SFX_SPRITE };
  private volumePercent = 60; // 0..100, default 60% per docs/10-MOTION-AND-SOUND.md §3
  private muted = false;
  private examMode = false;
  private blocked = false;
  private manifestPromise: Promise<SfxSpriteMap> | null = null;

  private buildHowl(): Howl | null {
    const base = getBaseUrl();
    try {
      return new Howl({
        src: [`${base}assets/sfx/sfx.webm`, `${base}assets/sfx/sfx.mp3`],
        sprite: this.spriteMap,
        volume: this.muted ? 0 : this.volumePercent / 100,
        preload: true,
        html5: false,
      });
    } catch {
      return null;
    }
  }

  public init(): void {
    if (this.howl) return;
    // The first cue must be playable at once, so build with the built-in offsets,
    // then rebuild if `sfx.json` turns out to differ (X-04).
    this.howl = this.buildHowl();
    void this.syncManifest();
  }

  public syncManifest(): Promise<SfxSpriteMap> {
    if (!this.manifestPromise) this.manifestPromise = this.loadManifest();
    return this.manifestPromise;
  }

  private async loadManifest(): Promise<SfxSpriteMap> {
    const base = getBaseUrl();
    try {
      if (typeof fetch !== 'function') return this.spriteMap;
      const resp = await fetch(`${base}assets/sfx/sfx.json`);
      if (!resp.ok) return this.spriteMap;
      const data = (await resp.json()) as { sprite?: SfxSpriteMap };
      if (data && data.sprite && typeof data.sprite === 'object') {
        const merged: SfxSpriteMap = { ...DEFAULT_SFX_SPRITE, ...data.sprite };
        const changed = JSON.stringify(merged) !== JSON.stringify(this.spriteMap);
        this.spriteMap = merged;
        // A Howl keeps the sprite map it was constructed with: rebuild it so new offsets take effect.
        if (changed && this.howl) {
          const stale = this.howl;
          this.howl = this.buildHowl();
          try {
            stale.unload();
          } catch {
            // Ignore: the stale instance is being discarded anyway
          }
        }
      }
    } catch {
      // Fallback to built-in DEFAULT_SFX_SPRITE if offline or in unit test
    }
    return this.spriteMap;
  }

  public getSpriteMap(): SfxSpriteMap {
    return this.spriteMap;
  }

  public setVolume(percent: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    this.volumePercent = clamped;
    if (this.howl) {
      this.howl.volume(this.muted ? 0 : clamped / 100);
    }
  }

  public getVolume(): number {
    return this.volumePercent;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.howl) {
      this.howl.mute(muted);
      this.howl.volume(muted ? 0 : this.volumePercent / 100);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setExamMode(exam: boolean): void {
    this.examMode = exam;
  }

  public setBlocked(blocked: boolean): void {
    this.blocked = blocked;
  }

  public play(name: SfxName, options?: PlaySfxOptions): number | null {
    if (this.muted || this.volumePercent <= 0) return null;
    if (this.blocked || options?.blockedBySpeechOrTrack) return null;

    const isExam = this.examMode || options?.examMode;
    // docs/10-MOTION-AND-SOUND.md §3: Exam mode tắt mọi SFX trừ timeup / countdownEnd
    if (isExam && name !== 'timeup' && name !== 'countdownEnd') {
      return null;
    }

    if (!this.howl) {
      this.init();
    }
    if (!this.howl) return null;

    const cueKey = name in this.spriteMap ? name : 'tap';
    try {
      const soundId = this.howl.play(cueKey);
      if (options?.rate && options.rate > 0 && typeof soundId === 'number') {
        this.howl.rate(options.rate, soundId);
      }
      return typeof soundId === 'number' ? soundId : null;
    } catch {
      return null;
    }
  }
}

export const sfxEngine = new SfxEngine();

export function playSfx(name: SfxName, options?: PlaySfxOptions): number | null {
  return sfxEngine.play(name, options);
}
