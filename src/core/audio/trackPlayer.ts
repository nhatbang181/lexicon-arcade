import { resolveAssetUrl } from '../content/loaders';

export const ALLOWED_PLAYBACK_RATES = [0.75, 0.9, 1, 1.25] as const;
export type PlaybackRate = (typeof ALLOWED_PLAYBACK_RATES)[number];

export type TrackStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'audio_missing'
  | 'error';

export interface SegmentBounds {
  startSec: number;
  endSec: number;
  label?: string;
}

export interface TrackPlayerState {
  url: string | null;
  status: TrackStatus;
  currentTime: number;
  duration: number;
  rate: PlaybackRate;
  volume: number;
  muted: boolean;
  examLocked: boolean;
  examStarted: boolean;
  activeSegment: SegmentBounds | null;
  simulatedMode: boolean;
  errorMessage: string | null;
  /** Browser refused to start playback without a user gesture (NotAllowedError). The file itself is fine (L1-10). */
  autoplayBlocked: boolean;
}

export interface AudioElementLike {
  src: string;
  currentTime: number;
  readonly duration: number;
  playbackRate: number;
  volume: number;
  muted: boolean;
  preload: string;
  paused: boolean;
  /** HTMLMediaElement.readyState (0–4). Optional so test doubles stay small. */
  readyState?: number;
  /** HTMLMediaElement.error (non-null after a failed load). */
  error?: unknown;
  play(): Promise<void> | void;
  pause(): void;
  load(): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface LoadTrackOptions {
  /** Fallback duration in seconds if audio file is missing or metadata hasn't loaded yet. */
  durationHintSec?: number;
  /** Lock playback to single-pass exam rules (no pause, no seek, rate locked to 1.0x). */
  examLocked?: boolean;
  /** Base URL override for relative asset paths. */
  baseUrl?: string;
}

export interface TrackPlayerOptions {
  /** Injectable factory for unit testing without real browser audio decoding. */
  audioFactory?: () => AudioElementLike;
  /** Initial volume in [0, 1]. Default: 1. */
  initialVolume?: number;
  /** Initial playback rate. Default: 1. */
  initialRate?: PlaybackRate;
  /** Interval in ms for segment boundary polling & simulated playback. Default: 50. */
  tickIntervalMs?: number;
  /**
   * Allow the silent timer-driven "simulated playback" when the MP3 is missing. OFF by default: a listening
   * session must never run without sound (L1-01). Only dev fixtures and unit tests turn it on.
   */
  allowSimulation?: boolean;
}

export function createIdleTrackState(): TrackPlayerState {
  return {
    url: null,
    status: 'idle',
    currentTime: 0,
    duration: 0,
    rate: 1,
    volume: 1,
    muted: false,
    examLocked: false,
    examStarted: false,
    activeSegment: null,
    simulatedMode: false,
    errorMessage: null,
    autoplayBlocked: false,
  };
}

export type TimeListener = (currentTime: number, duration: number) => void;
export type StateListener = (state: TrackPlayerState) => void;

export function formatTrackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function isAbsoluteOrSpecialUrl(url: string): boolean {
  return /^(?:https?:|blob:|data:|\/)/i.test(url);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function defaultAudioFactory(): AudioElementLike {
  if (typeof Audio === 'function') {
    return new Audio();
  }
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    return document.createElement('audio');
  }
  throw new Error('HTMLAudioElement is unavailable in this environment');
}

/**
 * Clean wrapper around HTMLAudioElement for IELTS Listening tracks.
 * NEVER uses Web Speech synthesis (`speechSynthesis`).
 * Supports:
 * - play / pause / seek / rewind / playback rate (0.75 | 0.9 | 1 | 1.25)
 * - playSegment(startSec, endSec) with automatic stop at endSec for Debrief replays
 * - examLocked single-pass mode (no pause, no seek, rate locked to 1x, play once)
 * - graceful `audio_missing` fallback with simulated timer progression when MP3 is absent
 */
export class TrackPlayerController {
  private audio: AudioElementLike | null = null;
  private readonly audioFactory: () => AudioElementLike;
  private readonly tickIntervalMs: number;
  private readonly allowSimulation: boolean;

  private state: TrackPlayerState;
  private timeListeners = new Set<TimeListener>();
  private stateListeners = new Set<StateListener>();
  private boundListeners: Array<{ type: string; fn: () => void }> = [];
  private segmentTimer: ReturnType<typeof setInterval> | null = null;
  private simTimer: ReturnType<typeof setInterval> | null = null;
  private lastSimTickMs = 0;
  private preloadedAudio: AudioElementLike | null = null;
  private preloadedUrl: string | null = null;
  private destroyed = false;

  constructor(options: TrackPlayerOptions = {}) {
    this.audioFactory = options.audioFactory ?? defaultAudioFactory;
    this.tickIntervalMs = Math.max(20, options.tickIntervalMs ?? 50);
    this.allowSimulation = options.allowSimulation === true;
    this.state = {
      url: null,
      status: 'idle',
      currentTime: 0,
      duration: 0,
      rate: options.initialRate ?? 1,
      volume: clamp(options.initialVolume ?? 1, 0, 1),
      muted: false,
      examLocked: false,
      examStarted: false,
      activeSegment: null,
      simulatedMode: false,
      errorMessage: null,
      autoplayBlocked: false,
    };
  }

  public getState(): TrackPlayerState {
    return {
      ...this.state,
      activeSegment: this.state.activeSegment ? { ...this.state.activeSegment } : null,
    };
  }

  public onTime(listener: TimeListener): () => void {
    this.timeListeners.add(listener);
    return () => {
      this.timeListeners.delete(listener);
    };
  }

  public onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public load(url: string, options: LoadTrackOptions = {}): void {
    if (this.destroyed) return;

    this.stopTimers();
    this.detachAudio();

    const resolvedUrl = isAbsoluteOrSpecialUrl(url)
      ? url
      : resolveAssetUrl(url, options.baseUrl);
    const examLocked = Boolean(options.examLocked);
    const durationHint =
      options.durationHintSec !== undefined && Number.isFinite(options.durationHintSec)
        ? Math.max(0, options.durationHintSec)
        : 0;

    this.updateState({
      url: resolvedUrl,
      status: 'loading',
      currentTime: 0,
      duration: durationHint,
      rate: examLocked ? 1 : this.state.rate,
      examLocked,
      examStarted: false,
      activeSegment: null,
      simulatedMode: false,
      errorMessage: null,
      autoplayBlocked: false,
    });

    try {
      // X-05: reuse the element that `preload()` already fetched for this exact URL.
      const preloaded = this.takePreloaded(resolvedUrl);
      const audio = preloaded ?? this.audioFactory();
      audio.preload = 'auto';
      audio.volume = this.state.volume;
      audio.muted = this.state.muted;
      audio.playbackRate = this.state.rate;
      if (!preloaded) audio.src = resolvedUrl;

      this.audio = audio;
      this.attachAudioListeners(audio);
      if (preloaded) {
        this.syncPreloadedState(audio);
      } else {
        audio.load();
      }
    } catch {
      this.enterAudioMissing('Không thể khởi tạo trình phát audio.');
    }
  }

  public preload(url: string, baseUrl?: string): void {
    if (this.destroyed || !url) return;
    const resolvedUrl = isAbsoluteOrSpecialUrl(url) ? url : resolveAssetUrl(url, baseUrl);
    if (this.preloadedAudio && this.preloadedUrl === resolvedUrl) return;
    try {
      const next = this.audioFactory();
      next.preload = 'auto';
      next.src = resolvedUrl;
      next.load();
      this.preloadedAudio = next;
      this.preloadedUrl = resolvedUrl;
    } catch {
      // Preload is best-effort only
    }
  }

  /** Hand the preloaded element over to `load()` when the URL matches (X-05); otherwise leave it alone. */
  private takePreloaded(resolvedUrl: string): AudioElementLike | null {
    if (!this.preloadedAudio || this.preloadedUrl !== resolvedUrl) return null;
    const audio = this.preloadedAudio;
    this.preloadedAudio = null;
    this.preloadedUrl = null;
    return audio;
  }

  /** A reused element may already have fired `loadedmetadata`/`error` before we attached listeners. */
  private syncPreloadedState(audio: AudioElementLike): void {
    if (audio.error) {
      this.enterAudioMissing('Không tải được file audio.');
      return;
    }
    if (typeof audio.readyState === 'number' && audio.readyState >= 1) {
      const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : this.state.duration;
      this.updateState({ duration: dur, status: 'ready', simulatedMode: false });
      this.emitTime();
    }
  }

  public setExamLocked(locked: boolean): void {
    if (this.destroyed) return;
    const nextRate: PlaybackRate = locked ? 1 : this.state.rate;
    if (this.audio && locked) {
      this.audio.playbackRate = 1;
    }
    this.updateState({
      examLocked: locked,
      rate: nextRate,
    });
  }

  public async play(): Promise<void> {
    if (this.destroyed || !this.state.url) return;

    // Exam mode: strictly single pass. Cannot restart once ended.
    if (this.state.examLocked && this.state.examStarted && this.state.status === 'ended') {
      return;
    }

    // L1-10: exam never starts until the whole track is ready (spec §11, "preload 100%").
    if (this.state.examLocked && !this.state.examStarted && this.state.status !== 'ready') {
      return;
    }

    if (this.state.status === 'audio_missing' || this.state.simulatedMode) {
      // No file to play: never fake a listening session. The UI shows an error + retry (L1-01).
      if (this.allowSimulation) this.startSimulatedPlayback();
      return;
    }

    if (!this.audio) {
      this.enterAudioMissing('File audio chưa sẵn sàng.');
      if (this.allowSimulation) this.startSimulatedPlayback();
      return;
    }

    try {
      if (this.state.examLocked) {
        this.audio.playbackRate = 1;
      } else {
        this.audio.playbackRate = this.state.rate;
      }

      const playResult = this.audio.play();
      if (playResult && typeof (playResult as Promise<void>).then === 'function') {
        await playResult;
      }

      if (this.destroyed) return;

      this.updateState({
        status: 'playing',
        examStarted: this.state.examLocked ? true : this.state.examStarted,
        errorMessage: null,
        autoplayBlocked: false,
      });

      if (this.state.activeSegment) {
        this.startSegmentWatcher();
      }
    } catch (err) {
      if (this.destroyed) return;
      const name = (err as { name?: string } | null)?.name;
      if (name === 'NotAllowedError') {
        // Autoplay policy, not a missing file: stay playable and let the learner press Play (L1-10).
        const keep: TrackStatus = this.state.status === 'loading' ? 'loading' : 'ready';
        this.updateState({ status: keep, autoplayBlocked: true, errorMessage: null, activeSegment: null });
        return;
      }
      if (name === 'AbortError') {
        // play() interrupted by pause()/load(): nothing is wrong with the file.
        return;
      }
      this.enterAudioMissing('Không phát được file audio này.');
      if (this.allowSimulation) this.startSimulatedPlayback();
    }
  }

  public pause(): void {
    if (this.destroyed) return;
    // Exam mode forbids pausing while listening
    if (this.state.examLocked && this.state.status === 'playing') {
      return;
    }

    this.stopTimers();

    if (this.audio && !this.state.simulatedMode) {
      try {
        this.audio.pause();
      } catch {
        // Ignore pause error on uninitialized media
      }
    }

    if (this.state.status === 'playing') {
      this.updateState({
        status: 'paused',
        activeSegment: null,
      });
    } else if (this.state.activeSegment) {
      this.updateState({ activeSegment: null });
    }
  }

  public seek(sec: number): void {
    if (this.destroyed) return;
    if (this.state.examLocked) return;

    const maxDur = this.state.duration > 0 ? this.state.duration : Number.POSITIVE_INFINITY;
    const clamped = clamp(Number.isFinite(sec) ? sec : 0, 0, maxDur);

    if (this.audio && !this.state.simulatedMode) {
      try {
        this.audio.currentTime = clamped;
      } catch {
        // Ignore seek errors when metadata not yet ready
      }
    }

    const nextStatus: TrackStatus =
      this.state.status === 'ended' && clamped < maxDur ? 'paused' : this.state.status;

    this.updateState({
      currentTime: clamped,
      status: nextStatus,
      activeSegment: null,
    });
    this.emitTime();
  }

  public rewind(seconds = 5): void {
    if (this.destroyed || this.state.examLocked) return;
    const delta = Math.max(0, seconds);
    this.seek(Math.max(0, this.state.currentTime - delta));
  }

  public setRate(rate: PlaybackRate): void {
    if (this.destroyed) return;
    if (this.state.examLocked) return;
    if (!ALLOWED_PLAYBACK_RATES.includes(rate)) return;

    if (this.audio) {
      this.audio.playbackRate = rate;
    }
    this.updateState({ rate });
  }

  public setVolume(volume: number): void {
    if (this.destroyed) return;
    const clamped = clamp(Number.isFinite(volume) ? volume : 1, 0, 1);
    if (this.audio) {
      this.audio.volume = clamped;
    }
    this.updateState({ volume: clamped });
  }

  public setMuted(muted: boolean): void {
    if (this.destroyed) return;
    if (this.audio) {
      this.audio.muted = muted;
    }
    this.updateState({ muted });
  }

  /**
   * Play a specific timestamp window [startSec, endSec] and automatically stop at endSec.
   * Used in Debrief to replay exact evidence or trap clips.
   */
  public async playSegment(
    startSec: number,
    endSec: number,
    label?: string,
  ): Promise<void> {
    if (this.destroyed || this.state.examLocked || !this.state.url) return;

    const safeStart = Math.max(0, startSec);
    const safeEnd = Math.max(safeStart + 0.1, endSec);

    this.stopTimers();

    if (this.audio && !this.state.simulatedMode) {
      try {
        this.audio.currentTime = safeStart;
      } catch {
        // Ignore if metadata not loaded
      }
    }

    this.updateState({
      currentTime: safeStart,
      activeSegment: { startSec: safeStart, endSec: safeEnd, label },
    });
    this.emitTime();

    await this.play();
  }

  /**
   * Explicitly mark the current track as missing audio so UI can switch into
   * simulated transcript mode without waiting for a failed network fetch.
   */
  public markAudioMissing(message = 'File audio chưa có sẵn trên thiết bị.'): void {
    if (this.destroyed) return;
    this.enterAudioMissing(message);
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopTimers();
    this.detachAudio();
    this.preloadedAudio = null;
    this.preloadedUrl = null;
    this.timeListeners.clear();
    this.stateListeners.clear();
  }

  private attachAudioListeners(audio: AudioElementLike): void {
    const onLoadedMetadata = () => {
      if (this.destroyed || this.audio !== audio) return;
      const dur =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : this.state.duration;
      const nextStatus: TrackStatus =
        this.state.status === 'loading' ? 'ready' : this.state.status;
      this.updateState({
        duration: dur,
        status: nextStatus,
        simulatedMode: false,
      });
      this.emitTime();
    };

    const onCanPlay = () => {
      if (this.destroyed || this.audio !== audio) return;
      if (this.state.status === 'loading') {
        this.updateState({ status: 'ready', simulatedMode: false });
      }
    };

    const onTimeUpdate = () => {
      if (this.destroyed || this.audio !== audio || this.state.simulatedMode) return;
      const t = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const dur =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : this.state.duration;

      this.state = {
        ...this.state,
        currentTime: t,
        duration: dur,
      };
      this.emitTime();
      this.checkSegmentBoundary(t);
    };

    const onEnded = () => {
      if (this.destroyed || this.audio !== audio) return;
      this.stopTimers();
      const finalTime = this.state.duration > 0 ? this.state.duration : this.state.currentTime;
      this.updateState({
        status: 'ended',
        currentTime: finalTime,
        activeSegment: null,
      });
      this.emitTime();
    };

    const onError = () => {
      if (this.destroyed || this.audio !== audio) return;
      this.enterAudioMissing('Không tải được file audio.');
    };

    const pairs: Array<{ type: string; fn: () => void }> = [
      { type: 'loadedmetadata', fn: onLoadedMetadata },
      { type: 'canplay', fn: onCanPlay },
      { type: 'timeupdate', fn: onTimeUpdate },
      { type: 'ended', fn: onEnded },
      { type: 'error', fn: onError },
    ];

    for (const p of pairs) {
      audio.addEventListener(p.type, p.fn);
    }
    this.boundListeners = pairs;
  }

  private detachAudio(): void {
    if (!this.audio) return;
    try {
      this.audio.pause();
    } catch {
      // Ignore
    }
    for (const p of this.boundListeners) {
      this.audio.removeEventListener(p.type, p.fn);
    }
    this.boundListeners = [];
    this.audio = null;
  }

  private enterAudioMissing(message: string): void {
    this.stopTimers();
    this.detachAudio();
    const fallbackDuration = this.state.duration > 0 ? this.state.duration : 120;
    this.updateState({
      status: 'audio_missing',
      simulatedMode: true,
      duration: fallbackDuration,
      errorMessage: message,
      autoplayBlocked: false,
    });
  }

  private startSimulatedPlayback(): void {
    this.stopTimers();
    const duration = this.state.duration > 0 ? this.state.duration : 120;
    let startTime = this.state.currentTime;
    if (startTime >= duration && !this.state.activeSegment) {
      startTime = 0;
    }

    this.lastSimTickMs = Date.now();
    this.updateState({
      status: 'playing',
      simulatedMode: true,
      duration,
      currentTime: startTime,
      examStarted: this.state.examLocked ? true : this.state.examStarted,
    });
    this.emitTime();

    this.simTimer = setInterval(() => {
      if (this.destroyed) {
        this.stopTimers();
        return;
      }
      const now = Date.now();
      const elapsedSec = Math.max(0, (now - this.lastSimTickMs) / 1000) * this.state.rate;
      this.lastSimTickMs = now;

      const nextTime = Math.min(this.state.duration, this.state.currentTime + elapsedSec);
      this.state = { ...this.state, currentTime: nextTime };
      this.emitTime();

      if (this.checkSegmentBoundary(nextTime)) {
        return;
      }

      if (nextTime >= this.state.duration) {
        this.stopTimers();
        this.updateState({
          status: 'ended',
          currentTime: this.state.duration,
          activeSegment: null,
        });
        this.emitTime();
      }
    }, this.tickIntervalMs);
  }

  private startSegmentWatcher(): void {
    if (this.segmentTimer) clearInterval(this.segmentTimer);
    this.segmentTimer = setInterval(() => {
      if (this.destroyed || !this.audio || !this.state.activeSegment) {
        if (this.segmentTimer) {
          clearInterval(this.segmentTimer);
          this.segmentTimer = null;
        }
        return;
      }
      const t = Number.isFinite(this.audio.currentTime)
        ? this.audio.currentTime
        : this.state.currentTime;
      this.state = { ...this.state, currentTime: t };
      this.emitTime();
      this.checkSegmentBoundary(t);
    }, this.tickIntervalMs);
  }

  private checkSegmentBoundary(currentSec: number): boolean {
    const seg = this.state.activeSegment;
    if (!seg) return false;
    if (currentSec >= seg.endSec) {
      this.stopTimers();
      if (this.audio && !this.state.simulatedMode) {
        try {
          this.audio.pause();
          this.audio.currentTime = seg.endSec;
        } catch {
          // Ignore
        }
      }
      this.updateState({
        status: 'paused',
        currentTime: seg.endSec,
        activeSegment: null,
      });
      this.emitTime();
      return true;
    }
    return false;
  }

  private stopTimers(): void {
    if (this.segmentTimer) {
      clearInterval(this.segmentTimer);
      this.segmentTimer = null;
    }
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  private updateState(patch: Partial<TrackPlayerState>): void {
    this.state = { ...this.state, ...patch };
    const snapshot = this.getState();
    for (const cb of this.stateListeners) {
      cb(snapshot);
    }
  }

  private emitTime(): void {
    const { currentTime, duration } = this.state;
    for (const cb of this.timeListeners) {
      cb(currentTime, duration);
    }
  }
}

export function createTrackPlayer(options?: TrackPlayerOptions): TrackPlayerController {
  return new TrackPlayerController(options);
}
