/**
 * Pure Voice Activity Detection (VAD) engine on Float32Array PCM frames
 * plus a lightweight browser AnalyserNode monitor driver.
 *
 * Pure functions & VadProcessor have ZERO React and ZERO DOM dependencies
 * so they can be thoroughly unit-tested in Node/Vitest with synthetic buffers.
 */

export type VadStatus = 'idle' | 'calibrating' | 'silent' | 'speaking' | 'silence_timeout';

export type VadSegmentType = 'speech' | 'silence';
export type SilencePosition = 'leading' | 'internal' | 'trailing';

export interface VadSegment {
  type: VadSegmentType;
  startMs: number;
  endMs: number;
  durationMs: number;
  /** Present on silence segments to distinguish start latency, mid-utterance pauses, and trailing silence. */
  position?: SilencePosition;
}

export interface FrameEnergy {
  rms: number;
  dbfs: number;
  peak: number;
}

export interface VadFrameSnapshot {
  timestampMs: number;
  rms: number;
  dbfs: number;
  peak: number;
  thresholdRms: number;
  isVoicedFrame: boolean;
  isSpeaking: boolean;
  status: VadStatus;
  silenceDurationMs: number;
}

export interface VadSpeechStartEvent {
  timestampMs: number;
  startLatencyMs: number;
  rms: number;
  dbfs: number;
}

export interface VadSpeechEndEvent {
  timestampMs: number;
  segment: VadSegment;
}

export interface VadSilenceTimeoutEvent {
  timestampMs: number;
  silenceDurationMs: number;
}

export interface VadCalibrationCompleteEvent {
  noiseFloorRms: number;
  noiseFloorDbfs: number;
  thresholdRms: number;
  noisyEnvironment: boolean;
}

export interface VadCallbacks {
  onSpeechStart?: (event: VadSpeechStartEvent) => void;
  onSpeechEnd?: (event: VadSpeechEndEvent) => void;
  onSilenceTimeout?: (event: VadSilenceTimeoutEvent) => void;
  onCalibrationComplete?: (event: VadCalibrationCompleteEvent) => void;
  onFrame?: (snapshot: VadFrameSnapshot) => void;
}

export interface VadOptions extends VadCallbacks {
  /** Base minimum RMS threshold (0..1) when room is quiet. Default: 0.015 (~ -36.5 dBFS). */
  minRmsThreshold?: number;
  /** Duration of initial noise-floor auto-calibration in ms (0 disables auto-calibration). Default: 1000. */
  calibrationDurationMs?: number;
  /** Multiplier applied to calibrated ambient noise floor. Default: 2.5. */
  noiseMultiplier?: number;
  /** Fixed additive margin above scaled noise floor. Default: 0.008. */
  noiseMargin?: number;
  /** Ambient RMS above this threshold flags `noisyEnvironment = true` ("Phòng hơi ồn"). Default: 0.04. */
  noisyFloorRmsThreshold?: number;
  /** Minimum continuous voiced duration (ms) before confirming speech start. Default: 60. */
  speechOnsetMs?: number;
  /** Hangover duration (ms) of low energy before confirming speech end. Default: 200. */
  speechHangoverMs?: number;
  /** Minimum internal silence duration (ms) counted as a pause. Default: 500 (0.5s per S1 §4.1). */
  minPauseMs?: number;
  /**
   * Continuous silence duration (ms) after speech that triggers `onSilenceTimeout`.
   * Part 1: 2500ms, Part 3: 3000ms, null disables timeout. Default: 2500.
   */
  silenceTimeoutMs?: number | null;
  /**
   * Minimum elapsed session time (ms) before `onSilenceTimeout` is allowed to fire.
   * Part 2 sets 60_000 (1 minute) so candidate is not auto-stopped early. Default: 0.
   */
  minSilenceTimeoutElapsedMs?: number;
  /** Whether silence timeout can fire even if no speech was ever detected. Default: false. */
  fireTimeoutBeforeSpeech?: boolean;
}

export interface VadSummary {
  totalDurationSec: number;
  /** Speaking span from first speech onset to last speech end (excludes leading & trailing silence). */
  activeDurationSec: number;
  speechDurationSec: number;
  silenceDurationSec: number;
  internalSilenceDurationSec: number;
  /** Total silence / total duration in [0, 1]. */
  silenceRatio: number;
  /** Time from session start to first speech onset in seconds, or null if no speech detected. */
  startLatencySec: number | null;
  /** Number of internal pauses >= minPauseMs (default 0.5s). */
  pauseCount: number;
  /** Number of internal pauses in [1.0s, 2.0s]. */
  midPauseCount: number;
  /** Number of internal pauses > 2.0s. */
  longPauseCount: number;
  /** Total internal pauses >= 1.0s (midPauseCount + longPauseCount). */
  pausesOver1s: number;
  /** Longest internal pause in seconds (0 if no internal pauses). */
  longestPauseSec: number;
  noiseFloorRms: number;
  noiseFloorDbfs: number;
  thresholdRms: number;
  calibrated: boolean;
  noisyEnvironment: boolean;
  segments: VadSegment[];
  internalPauses: VadSegment[];
}

export const DEFAULT_VAD_OPTIONS = {
  minRmsThreshold: 0.015,
  calibrationDurationMs: 1000,
  noiseMultiplier: 2.5,
  noiseMargin: 0.008,
  noisyFloorRmsThreshold: 0.04,
  speechOnsetMs: 60,
  speechHangoverMs: 200,
  minPauseMs: 500,
  silenceTimeoutMs: 2500 as number | null,
  minSilenceTimeoutElapsedMs: 0,
  fireTimeoutBeforeSpeech: false,
} as const;

/**
 * Pure RMS (root mean square) amplitude calculation over a Float32Array PCM frame.
 * Values are typically in [0, 1] for normalized Web Audio samples.
 */
export function computeRms(frame: Float32Array): number {
  if (frame.length === 0) return 0;
  let sumSquares = 0;
  for (let i = 0; i < frame.length; i++) {
    const s = frame[i];
    sumSquares += s * s;
  }
  return Math.sqrt(sumSquares / frame.length);
}

/**
 * Convert linear RMS amplitude to dBFS (decibels relative to full scale).
 */
export function rmsToDbfs(rms: number, floorDbfs = -100): number {
  if (!Number.isFinite(rms) || rms <= 0) return floorDbfs;
  const db = 20 * Math.log10(rms);
  return Math.max(floorDbfs, db);
}

/**
 * Compute RMS, dBFS, and absolute peak of a Float32Array frame in a single pass.
 */
export function computeFrameEnergy(frame: Float32Array): FrameEnergy {
  if (frame.length === 0) {
    return { rms: 0, dbfs: -100, peak: 0 };
  }
  let sumSquares = 0;
  let peak = 0;
  for (let i = 0; i < frame.length; i++) {
    const sample = frame[i];
    const abs = Math.abs(sample);
    if (abs > peak) peak = abs;
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / frame.length);
  return {
    rms,
    dbfs: rmsToDbfs(rms),
    peak,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Pure stateful VAD processor operating on Float32Array frames + timestamps.
 * Accurate speech/pause boundaries: uses onset/hangover hysteresis to reject glitches,
 * while back-dating segment boundaries to the true acoustic onset and last voiced frame.
 */
export class VadProcessor {
  private readonly minRmsThreshold: number;
  private readonly calibrationDurationMs: number;
  private readonly noiseMultiplier: number;
  private readonly noiseMargin: number;
  private readonly noisyFloorRmsThreshold: number;
  private readonly speechOnsetMs: number;
  private readonly speechHangoverMs: number;
  private readonly minPauseMs: number;
  private readonly silenceTimeoutMs: number | null;
  private readonly minSilenceTimeoutElapsedMs: number;
  private readonly fireTimeoutBeforeSpeech: boolean;
  private readonly callbacks: VadCallbacks;

  private sessionStartMs: number | null = null;
  private lastTimestampMs: number | null = null;

  private calibrated = false;
  private calibrationSamples: number[] = [];
  private noiseFloorRms = 0;
  private thresholdRms: number;
  private noisyEnvironment = false;

  private isSpeaking = false;
  private status: VadStatus = 'idle';
  private pendingSpeechStartMs: number | null = null;
  private activeSpeechStartMs: number | null = null;
  private lastVoicedMs: number | null = null;
  private firstSpeechStartMs: number | null = null;
  private silenceTimeoutFiredForStretch = false;

  private speechSegments: VadSegment[] = [];

  constructor(options: VadOptions = {}) {
    this.minRmsThreshold = options.minRmsThreshold ?? DEFAULT_VAD_OPTIONS.minRmsThreshold;
    this.calibrationDurationMs = Math.max(
      0,
      options.calibrationDurationMs ?? DEFAULT_VAD_OPTIONS.calibrationDurationMs,
    );
    this.noiseMultiplier = options.noiseMultiplier ?? DEFAULT_VAD_OPTIONS.noiseMultiplier;
    this.noiseMargin = options.noiseMargin ?? DEFAULT_VAD_OPTIONS.noiseMargin;
    this.noisyFloorRmsThreshold =
      options.noisyFloorRmsThreshold ?? DEFAULT_VAD_OPTIONS.noisyFloorRmsThreshold;
    this.speechOnsetMs = Math.max(0, options.speechOnsetMs ?? DEFAULT_VAD_OPTIONS.speechOnsetMs);
    this.speechHangoverMs = Math.max(
      0,
      options.speechHangoverMs ?? DEFAULT_VAD_OPTIONS.speechHangoverMs,
    );
    this.minPauseMs = Math.max(0, options.minPauseMs ?? DEFAULT_VAD_OPTIONS.minPauseMs);
    this.silenceTimeoutMs =
      options.silenceTimeoutMs === undefined
        ? DEFAULT_VAD_OPTIONS.silenceTimeoutMs
        : options.silenceTimeoutMs;
    this.minSilenceTimeoutElapsedMs = Math.max(
      0,
      options.minSilenceTimeoutElapsedMs ?? DEFAULT_VAD_OPTIONS.minSilenceTimeoutElapsedMs,
    );
    this.fireTimeoutBeforeSpeech =
      options.fireTimeoutBeforeSpeech ?? DEFAULT_VAD_OPTIONS.fireTimeoutBeforeSpeech;
    this.callbacks = {
      onSpeechStart: options.onSpeechStart,
      onSpeechEnd: options.onSpeechEnd,
      onSilenceTimeout: options.onSilenceTimeout,
      onCalibrationComplete: options.onCalibrationComplete,
      onFrame: options.onFrame,
    };

    this.thresholdRms = this.minRmsThreshold;
    if (this.calibrationDurationMs === 0) {
      this.calibrated = true;
    }
  }

  public reset(): void {
    this.sessionStartMs = null;
    this.lastTimestampMs = null;
    this.calibrated = this.calibrationDurationMs === 0;
    this.calibrationSamples = [];
    this.noiseFloorRms = 0;
    this.thresholdRms = this.minRmsThreshold;
    this.noisyEnvironment = false;
    this.isSpeaking = false;
    this.status = 'idle';
    this.pendingSpeechStartMs = null;
    this.activeSpeechStartMs = null;
    this.lastVoicedMs = null;
    this.firstSpeechStartMs = null;
    this.silenceTimeoutFiredForStretch = false;
    this.speechSegments = [];
  }

  public getStatus(): VadStatus {
    return this.status;
  }

  public isCalibrated(): boolean {
    return this.calibrated;
  }

  public isNoisyEnvironment(): boolean {
    return this.noisyEnvironment;
  }

  public getThresholdRms(): number {
    return this.thresholdRms;
  }

  /**
   * Process a single Float32Array audio frame captured at `timestampMs` (monotonic ms).
   * Pass `frameDurationMs` when processing contiguous frames so segment end times accurately cover the frame.
   */
  public processFrame(
    frame: Float32Array,
    timestampMs: number,
    frameDurationMs = 0,
  ): VadFrameSnapshot {
    if (this.sessionStartMs === null) {
      this.sessionStartMs = timestampMs;
    }
    const frameEndMs = timestampMs + Math.max(0, frameDurationMs);
    this.lastTimestampMs = Math.max(this.lastTimestampMs ?? frameEndMs, frameEndMs);

    const energy = computeFrameEnergy(frame);
    const elapsedMs = Math.max(0, timestampMs - this.sessionStartMs);

    // Phase 1: Initial noise-floor calibration (docs/03 §6, S1 §11)
    if (!this.calibrated) {
      if (elapsedMs < this.calibrationDurationMs) {
        this.calibrationSamples.push(energy.rms);
        this.status = 'calibrating';
        const snapshot: VadFrameSnapshot = {
          timestampMs,
          rms: energy.rms,
          dbfs: energy.dbfs,
          peak: energy.peak,
          thresholdRms: this.thresholdRms,
          isVoicedFrame: false,
          isSpeaking: false,
          status: this.status,
          silenceDurationMs: 0,
        };
        this.callbacks.onFrame?.(snapshot);
        return snapshot;
      }
      this.finalizeCalibration();
    }

    // Phase 2: Voiced/unvoiced state machine with onset + hangover hysteresis
    const isVoicedFrame = energy.rms >= this.thresholdRms;

    if (isVoicedFrame) {
      this.lastVoicedMs = frameEndMs;

      if (!this.isSpeaking) {
        if (this.pendingSpeechStartMs === null) {
          this.pendingSpeechStartMs = timestampMs;
        }
        const onsetElapsed = frameEndMs - this.pendingSpeechStartMs;
        if (onsetElapsed >= this.speechOnsetMs) {
          const speechStart = this.pendingSpeechStartMs;
          this.isSpeaking = true;
          this.activeSpeechStartMs = speechStart;
          this.pendingSpeechStartMs = null;
          this.silenceTimeoutFiredForStretch = false;
          this.status = 'speaking';

          const isFirstSpeech = this.firstSpeechStartMs === null;
          if (isFirstSpeech) {
            this.firstSpeechStartMs = speechStart;
          }

          this.callbacks.onSpeechStart?.({
            timestampMs: speechStart,
            startLatencyMs: Math.max(0, speechStart - this.sessionStartMs),
            rms: energy.rms,
            dbfs: energy.dbfs,
          });
        }
      } else {
        this.status = 'speaking';
      }
    } else {
      // Unvoiced frame
      if (!this.isSpeaking) {
        this.pendingSpeechStartMs = null;
        if (this.status !== 'silence_timeout') {
          this.status = 'silent';
        }
      } else if (this.lastVoicedMs !== null) {
        const silentSinceLastVoiced = frameEndMs - this.lastVoicedMs;
        if (silentSinceLastVoiced >= this.speechHangoverMs) {
          // Close speech segment at true last voiced timestamp (eliminates hangover bias)
          const segStart = this.activeSpeechStartMs ?? this.lastVoicedMs;
          const segEnd = Math.max(segStart, this.lastVoicedMs);
          const segment: VadSegment = {
            type: 'speech',
            startMs: segStart,
            endMs: segEnd,
            durationMs: Math.max(0, segEnd - segStart),
          };
          this.speechSegments.push(segment);
          this.isSpeaking = false;
          this.activeSpeechStartMs = null;
          this.status = 'silent';
          this.callbacks.onSpeechEnd?.({ timestampMs: segEnd, segment });
        }
      }
    }

    // Phase 3: Silence timeout detection
    const silenceReferenceMs =
      this.lastVoicedMs ?? (this.fireTimeoutBeforeSpeech ? this.sessionStartMs : null);
    const silenceDurationMs =
      !this.isSpeaking && silenceReferenceMs !== null
        ? Math.max(0, frameEndMs - silenceReferenceMs)
        : 0;

    const totalElapsedFromStart = Math.max(0, frameEndMs - this.sessionStartMs);
    if (
      !this.isSpeaking &&
      this.silenceTimeoutMs !== null &&
      this.silenceTimeoutMs > 0 &&
      !this.silenceTimeoutFiredForStretch &&
      (this.firstSpeechStartMs !== null || this.fireTimeoutBeforeSpeech) &&
      totalElapsedFromStart >= this.minSilenceTimeoutElapsedMs &&
      silenceDurationMs >= this.silenceTimeoutMs
    ) {
      this.silenceTimeoutFiredForStretch = true;
      this.status = 'silence_timeout';
      this.callbacks.onSilenceTimeout?.({
        timestampMs: frameEndMs,
        silenceDurationMs,
      });
    }

    const snapshot: VadFrameSnapshot = {
      timestampMs,
      rms: energy.rms,
      dbfs: energy.dbfs,
      peak: energy.peak,
      thresholdRms: this.thresholdRms,
      isVoicedFrame,
      isSpeaking: this.isSpeaking,
      status: this.status,
      silenceDurationMs,
    };
    this.callbacks.onFrame?.(snapshot);
    return snapshot;
  }

  /**
   * Close any in-progress speech segment (e.g., when recording stops) and return summary.
   */
  public flush(endTimestampMs?: number): VadSummary {
    const finalMs = endTimestampMs ?? this.lastTimestampMs ?? this.sessionStartMs ?? 0;
    if (this.lastTimestampMs === null || finalMs > this.lastTimestampMs) {
      this.lastTimestampMs = finalMs;
    }

    if (!this.calibrated && this.calibrationSamples.length > 0) {
      this.finalizeCalibration();
    }

    if (this.isSpeaking && this.activeSpeechStartMs !== null) {
      const segEnd = Math.max(
        this.activeSpeechStartMs,
        this.lastVoicedMs ?? finalMs,
      );
      const segment: VadSegment = {
        type: 'speech',
        startMs: this.activeSpeechStartMs,
        endMs: segEnd,
        durationMs: Math.max(0, segEnd - this.activeSpeechStartMs),
      };
      this.speechSegments.push(segment);
      this.isSpeaking = false;
      this.activeSpeechStartMs = null;
      this.status = 'idle';
      this.callbacks.onSpeechEnd?.({ timestampMs: segEnd, segment });
    }

    return this.getSummary(finalMs);
  }

  /**
   * Compute full VAD timeline summary (speech duration, silence ratio, pause counts, longest pause, start latency).
   */
  public getSummary(nowMs?: number): VadSummary {
    const startMs = this.sessionStartMs ?? 0;
    const endMs = Math.max(startMs, nowMs ?? this.lastTimestampMs ?? startMs);
    const totalDurationMs = Math.max(0, endMs - startMs);

    // Include any currently active speech segment without mutating internal state
    const allSpeech: VadSegment[] = [...this.speechSegments];
    if (this.isSpeaking && this.activeSpeechStartMs !== null) {
      const activeEnd = Math.max(this.activeSpeechStartMs, this.lastVoicedMs ?? endMs);
      allSpeech.push({
        type: 'speech',
        startMs: this.activeSpeechStartMs,
        endMs: activeEnd,
        durationMs: Math.max(0, activeEnd - this.activeSpeechStartMs),
      });
    }

    // Build full ordered timeline of speech + silence segments
    const segments: VadSegment[] = [];
    const internalPauses: VadSegment[] = [];

    if (allSpeech.length === 0) {
      if (totalDurationMs > 0) {
        segments.push({
          type: 'silence',
          startMs,
          endMs,
          durationMs: totalDurationMs,
          position: 'leading',
        });
      }
    } else {
      const firstSpeech = allSpeech[0];
      if (firstSpeech.startMs > startMs) {
        segments.push({
          type: 'silence',
          startMs,
          endMs: firstSpeech.startMs,
          durationMs: firstSpeech.startMs - startMs,
          position: 'leading',
        });
      }

      for (let i = 0; i < allSpeech.length; i++) {
        const current = allSpeech[i];
        segments.push(current);

        if (i + 1 < allSpeech.length) {
          const next = allSpeech[i + 1];
          const gapMs = Math.max(0, next.startMs - current.endMs);
          if (gapMs > 0) {
            const pauseSeg: VadSegment = {
              type: 'silence',
              startMs: current.endMs,
              endMs: next.startMs,
              durationMs: gapMs,
              position: 'internal',
            };
            segments.push(pauseSeg);
            internalPauses.push(pauseSeg);
          }
        }
      }

      const lastSpeech = allSpeech[allSpeech.length - 1];
      if (endMs > lastSpeech.endMs) {
        segments.push({
          type: 'silence',
          startMs: lastSpeech.endMs,
          endMs,
          durationMs: endMs - lastSpeech.endMs,
          position: 'trailing',
        });
      }
    }

    const speechDurationMs = allSpeech.reduce((acc, s) => acc + s.durationMs, 0);
    const silenceDurationMs = Math.max(0, totalDurationMs - speechDurationMs);
    const internalSilenceDurationMs = internalPauses.reduce((acc, p) => acc + p.durationMs, 0);

    const activeDurationMs =
      allSpeech.length > 0
        ? Math.max(0, allSpeech[allSpeech.length - 1].endMs - allSpeech[0].startMs)
        : 0;

    // Count pauses against S1 §4.1 thresholds:
    // - pauseCount: >= minPauseMs (default 0.5s)
    // - midPauseCount: [1.0s, 2.0s]
    // - longPauseCount: > 2.0s
    let pauseCount = 0;
    let midPauseCount = 0;
    let longPauseCount = 0;
    let longestPauseMs = 0;

    for (const pause of internalPauses) {
      if (pause.durationMs > longestPauseMs) {
        longestPauseMs = pause.durationMs;
      }
      if (pause.durationMs >= this.minPauseMs) {
        pauseCount++;
      }
      if (pause.durationMs > 2000) {
        longPauseCount++;
      } else if (pause.durationMs >= 1000) {
        midPauseCount++;
      }
    }

    const startLatencySec =
      this.firstSpeechStartMs !== null
        ? round3(Math.max(0, this.firstSpeechStartMs - startMs) / 1000)
        : null;

    const silenceRatio =
      totalDurationMs > 0 ? round3(Math.min(1, Math.max(0, silenceDurationMs / totalDurationMs))) : 0;

    return {
      totalDurationSec: round3(totalDurationMs / 1000),
      activeDurationSec: round3(activeDurationMs / 1000),
      speechDurationSec: round3(speechDurationMs / 1000),
      silenceDurationSec: round3(silenceDurationMs / 1000),
      internalSilenceDurationSec: round3(internalSilenceDurationMs / 1000),
      silenceRatio,
      startLatencySec,
      pauseCount,
      midPauseCount,
      longPauseCount,
      pausesOver1s: midPauseCount + longPauseCount,
      longestPauseSec: round3(longestPauseMs / 1000),
      noiseFloorRms: round3(this.noiseFloorRms),
      noiseFloorDbfs: round3(rmsToDbfs(this.noiseFloorRms)),
      thresholdRms: round3(this.thresholdRms),
      calibrated: this.calibrated,
      noisyEnvironment: this.noisyEnvironment,
      segments,
      internalPauses,
    };
  }

  private finalizeCalibration(): void {
    const ambientRms = median(this.calibrationSamples);
    this.noiseFloorRms = ambientRms;
    this.thresholdRms = Math.max(
      this.minRmsThreshold,
      ambientRms * this.noiseMultiplier + this.noiseMargin,
    );
    this.noisyEnvironment = ambientRms > this.noisyFloorRmsThreshold;
    this.calibrated = true;
    this.status = 'silent';

    this.callbacks.onCalibrationComplete?.({
      noiseFloorRms: round3(this.noiseFloorRms),
      noiseFloorDbfs: round3(rmsToDbfs(this.noiseFloorRms)),
      thresholdRms: round3(this.thresholdRms),
      noisyEnvironment: this.noisyEnvironment,
    });
  }
}

/**
 * Convenience pure batch analyzer: feeds a full Float32Array audio buffer in fixed-size frames
 * through VadProcessor and returns the complete VadSummary.
 */
export function analyzeAudioBuffer(
  samples: Float32Array,
  sampleRate: number,
  options: VadOptions & { frameMs?: number } = {},
): VadSummary {
  const { frameMs = 20, ...vadOptions } = options;
  const safeRate = Math.max(1, sampleRate);
  const frameSize = Math.max(1, Math.round((safeRate * frameMs) / 1000));
  const actualFrameMs = (frameSize / safeRate) * 1000;

  const processor = new VadProcessor(vadOptions);
  let offset = 0;
  while (offset < samples.length) {
    const end = Math.min(samples.length, offset + frameSize);
    const slice = samples.subarray(offset, end);
    const startMs = (offset / safeRate) * 1000;
    const durMs = ((end - offset) / safeRate) * 1000;
    processor.processFrame(slice, startMs, durMs || actualFrameMs);
    offset = end;
  }

  const totalMs = (samples.length / safeRate) * 1000;
  return processor.flush(totalMs);
}

// ---------------------------------------------------------------------------
// Browser AnalyserNode live monitor wrapper
// ---------------------------------------------------------------------------

export interface MicVadMonitorOptions extends VadOptions {
  /** AnalyserNode FFT size (power of 2). Default: 1024. */
  fftSize?: number;
  /** Frame polling interval in ms. Default: 40 (~25 fps, light on CPU). */
  pollIntervalMs?: number;
}

export class MicVadMonitor {
  private readonly processor: VadProcessor;
  private readonly fftSize: number;
  private readonly pollIntervalMs: number;

  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frameBuffer: Float32Array<ArrayBuffer> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private startPerfMs = 0;

  constructor(options: MicVadMonitorOptions = {}) {
    const { fftSize = 1024, pollIntervalMs = 40, ...vadOptions } = options;
    this.fftSize = fftSize;
    this.pollIntervalMs = Math.max(16, pollIntervalMs);
    this.processor = new VadProcessor(vadOptions);
  }

  public start(stream: MediaStream): void {
    this.stop();
    this.processor.reset();

    const AudioCtxCtor =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;

    if (!AudioCtxCtor) {
      throw new Error('AudioContext is not supported in this browser');
    }

    const ctx = new AudioCtxCtor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = this.fftSize;
    source.connect(analyser);

    this.audioCtx = ctx;
    this.sourceNode = source;
    this.analyser = analyser;
    this.frameBuffer = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
    this.startPerfMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.running = true;

    this.timer = setInterval(() => {
      if (!this.running || !this.analyser || !this.frameBuffer) return;
      this.analyser.getFloatTimeDomainData(this.frameBuffer);
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = Math.max(0, now - this.startPerfMs);
      this.processor.processFrame(this.frameBuffer, elapsed, this.pollIntervalMs);
    }, this.pollIntervalMs);
  }

  public stop(): VadSummary {
    const elapsed = this.running
      ? Math.max(
          0,
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - this.startPerfMs,
        )
      : undefined;

    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.sourceNode = null;
    }
    this.analyser = null;
    this.frameBuffer = null;

    if (this.audioCtx) {
      const ctx = this.audioCtx;
      this.audioCtx = null;
      if (ctx.state !== 'closed') {
        void ctx.close().catch(() => undefined);
      }
    }

    return this.processor.flush(elapsed);
  }

  public getSummary(): VadSummary {
    const elapsed = this.running
      ? Math.max(
          0,
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - this.startPerfMs,
        )
      : undefined;
    return this.processor.getSummary(elapsed);
  }

  public getStatus(): VadStatus {
    return this.processor.getStatus();
  }

  public dispose(): void {
    this.stop();
  }
}

export function createVadProcessor(options?: VadOptions): VadProcessor {
  return new VadProcessor(options);
}

export function createMicVadMonitor(options?: MicVadMonitorOptions): MicVadMonitor {
  return new MicVadMonitor(options);
}
