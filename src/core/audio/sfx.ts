import { Howl, Howler } from 'howler';
import { ensurePlaybackAudioSession } from './trackPlayer';

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
  { name: 'flip', alias: 'page', label: 'flip', descriptionVi: 'Lật thẻ từ, chuyển câu' },
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
  /** Chuỗi combo hiện tại: tăng +1 bán cung mỗi bậc, tối đa +12 rồi quay về 0 (13-ANIMATION §0). */
  combo?: number;
  /** Biến thiên ngẫu nhiên ±4% để âm không lặp máy móc (mặc định bật cho tap/flip/page). */
  jitter?: boolean;
  examMode?: boolean;
  blockedBySpeechOrTrack?: boolean;
}

const MAX_CONCURRENT_VOICES = 2;
const JITTER_CUES = new Set<SfxName>(['tap', 'flip', 'page']);

/**
 * Tính hệ số cao độ theo combo (13-ANIMATION §0):
 * tăng 1 bán cung (2^(1/12)) mỗi bậc combo, tối đa +12 bán cung (2.0x) rồi quay về 1.0x.
 */
export function computeComboRate(combo: number): number {
  if (!Number.isFinite(combo) || combo <= 0) return 1;
  const semitone = Math.floor(combo) % 13;
  return Number(Math.pow(2, semitone / 12).toFixed(4));
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
  private lifecycleBound = false;
  private activeVoices: Array<{ id: number; endsAt: number }> = [];

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

  /**
   * Safari iOS (TU-03, 14-TOI-UU-WEB §9): sau khi app quay lại từ nền hoặc ở lần chạm đầu,
   * AudioContext có thể ở trạng thái 'suspended'/'interrupted' → gọi resume() và giữ audioSession='playback'.
   */
  public resumeAudioContext(): void {
    ensurePlaybackAudioSession();
    try {
      const ctx = (Howler as { ctx?: { state?: string; resume?: () => Promise<void> } } | undefined)?.ctx;
      if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted') && typeof ctx.resume === 'function') {
        void ctx.resume().catch(() => {
          // Bỏ qua nếu chưa có thao tác chạm
        });
      }
    } catch {
      // Môi trường không có Web Audio (test node)
    }
  }

  public unlock(): void {
    this.init();
    this.resumeAudioContext();
  }

  private bindLifecycleListeners(): void {
    if (this.lifecycleBound) return;
    this.lifecycleBound = true;
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.resumeAudioContext();
        }
      });
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('pageshow', () => this.resumeAudioContext());
      window.addEventListener('touchend', () => this.resumeAudioContext(), { passive: true });
    }
  }

  public init(): void {
    ensurePlaybackAudioSession();
    this.bindLifecycleListeners();
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
          this.activeVoices = [];
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

  public getActiveVoiceCount(now = Date.now()): number {
    this.activeVoices = this.activeVoices.filter((v) => v.endsAt > now);
    return this.activeVoices.length;
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

    const now = Date.now();
    this.activeVoices = this.activeVoices.filter((v) => v.endsAt > now);

    // LUAT J7 / A9: giới hạn tối đa 2 tiếng chồng đồng thời bằng hàng đợi FIFO
    while (this.activeVoices.length >= MAX_CONCURRENT_VOICES) {
      const oldest = this.activeVoices.shift();
      if (oldest && typeof (this.howl as { stop?: (id?: number) => void }).stop === 'function') {
        try {
          (this.howl as { stop: (id?: number) => void }).stop(oldest.id);
        } catch {
          // ignore
        }
      }
    }

    const cueKey = name in this.spriteMap ? name : 'tap';
    const baseRate =
      options?.rate && options.rate > 0
        ? options.rate
        : options?.combo && options.combo > 0
        ? computeComboRate(options.combo)
        : 1;
    const useJitter =
      options?.jitter === true ||
      (options?.jitter !== false && options?.rate === undefined && options?.combo === undefined && JITTER_CUES.has(name));
    const jitterFactor = useJitter ? 0.96 + Math.random() * 0.08 : 1;
    const finalRate = Number(Math.max(0.5, Math.min(2.5, baseRate * jitterFactor)).toFixed(4));

    try {
      const soundId = this.howl.play(cueKey);
      if (typeof soundId === 'number') {
        if (finalRate !== 1) {
          this.howl.rate(finalRate, soundId);
        }
        const cueDur = this.spriteMap[cueKey]?.[1] ?? 150;
        const estMs = Math.max(40, Math.round(cueDur / finalRate));
        this.activeVoices.push({ id: soundId, endsAt: now + estMs });
        return soundId;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const sfxEngine = new SfxEngine();

export function playSfx(name: SfxName, options?: PlaySfxOptions): number | null {
  return sfxEngine.play(name, options);
}
