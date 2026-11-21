/**
 * Audio recorder wrapper around MediaRecorder for IELTS Speaking (S1/S2).
 * Selects the best supported MIME type (audio/webm;codecs=opus -> audio/webm -> audio/mp4),
 * returns Blob + durationMs, and guarantees clean MediaStream track cleanup.
 * Pure TypeScript (no React, no DOM manipulation).
 */

export const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
] as const;

export type PreferredAudioMimeType = (typeof AUDIO_MIME_CANDIDATES)[number];

export type RecorderStatus =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error';

export type RecorderErrorCode =
  | 'not_supported'
  | 'permission_denied'
  | 'no_device'
  | 'recording_failed';

export interface RecorderError {
  code: RecorderErrorCode;
  messageVi: string;
  cause?: unknown;
}

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  durationSec: number;
  sizeBytes: number;
  startedAt: number;
  endedAt: number;
}

export interface RecorderState {
  status: RecorderStatus;
  mimeType: string;
  startedAt: number | null;
  durationMs: number;
  error: RecorderError | null;
}

export interface MediaStreamTrackLike {
  stop(): void;
  readyState?: string;
  kind?: string;
}

export interface MediaStreamLike {
  getTracks(): MediaStreamTrackLike[];
  getAudioTracks?(): MediaStreamTrackLike[];
}

export interface MediaRecorderDataEventLike {
  data: Blob;
}

export interface MediaRecorderLike {
  readonly state: 'inactive' | 'recording' | 'paused';
  readonly mimeType: string;
  ondataavailable: ((event: MediaRecorderDataEventLike) => void) | null;
  onstop: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  start(timeslice?: number): void;
  stop(): void;
  pause?(): void;
  resume?(): void;
}

export interface AudioRecorderOptions {
  /** Preferred bitrate in bps. Default 48_000 (keeps ~12 min mock around 3-6 MB in opus). */
  audioBitsPerSecond?: number;
  /** Optional timeslice in ms for periodic dataavailable chunks. Default 250. */
  timesliceMs?: number;
  /** Constraints passed to getUserMedia({ audio }). */
  audioConstraints?: MediaTrackConstraints | boolean;
  /**
   * Whether stop() should also stop MediaStream tracks.
   * Defaults to true when the recorder acquired the stream itself, and false when an external stream was passed in.
   */
  stopStreamOnStop?: boolean;
  /** Injectable MIME support checker for unit testing. */
  isTypeSupported?: (mimeType: string) => boolean;
  /** Injectable MediaRecorder factory for unit testing. */
  mediaRecorderFactory?: (
    stream: MediaStreamLike,
    options: { mimeType?: string; audioBitsPerSecond?: number },
  ) => MediaRecorderLike;
  /** Injectable getUserMedia implementation for unit testing. */
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStreamLike>;
  /** Injectable clock (ms) for deterministic duration calculation in tests. */
  now?: () => number;
}

export type RecorderStateListener = (state: RecorderState) => void;

/**
 * Select the highest-priority supported audio MIME type for MediaRecorder.
 * Priority: audio/webm;codecs=opus -> audio/webm -> audio/mp4 -> '' (browser default).
 */
export function selectBestAudioMimeType(
  isTypeSupported?: (mimeType: string) => boolean,
): string {
  const checker =
    isTypeSupported ??
    (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
      ? (mime: string) => MediaRecorder.isTypeSupported(mime)
      : undefined);

  if (!checker) return '';

  for (const candidate of AUDIO_MIME_CANDIDATES) {
    try {
      if (checker(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore probe error and try next fallback
    }
  }
  return '';
}

/**
 * Check whether the current runtime can record audio via MediaRecorder + getUserMedia.
 */
export function isAudioRecordingSupported(): boolean {
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const hasGetUserMedia =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function';
  return hasMediaRecorder && hasGetUserMedia;
}

/**
 * Safely stop all tracks on a MediaStream.
 */
export function stopMediaStream(stream: MediaStreamLike | null | undefined): void {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      try {
        track.stop();
      } catch {
        // Ignore individual track stop failures
      }
    }
  } catch {
    // Ignore stream cleanup failures
  }
}

function classifyMicError(err: unknown): RecorderError {
  const name =
    err && typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return {
      code: 'permission_denied',
      messageVi:
        'Trình duyệt chưa được cấp quyền micro. Hãy mở biểu tượng ổ khoá trên thanh địa chỉ, cho phép Microphone rồi thử lại.',
      cause: err,
    };
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      code: 'no_device',
      messageVi: 'Không tìm thấy thiết bị micro nào. Hãy kiểm tra tai nghe hoặc micro của máy.',
      cause: err,
    };
  }

  return {
    code: 'recording_failed',
    messageVi: 'Không thể bắt đầu ghi âm. Hãy kiểm tra quyền micro và thử lại.',
    cause: err,
  };
}

function defaultMediaRecorderFactory(
  stream: MediaStreamLike,
  options: { mimeType?: string; audioBitsPerSecond?: number },
): MediaRecorderLike {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is unavailable in this environment');
  }
  const init: MediaRecorderOptions = {};
  if (options.mimeType) init.mimeType = options.mimeType;
  if (options.audioBitsPerSecond) init.audioBitsPerSecond = options.audioBitsPerSecond;
  return new MediaRecorder(stream as unknown as MediaStream, init) as unknown as MediaRecorderLike;
}

function defaultGetUserMedia(constraints: MediaStreamConstraints): Promise<MediaStreamLike> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    return Promise.reject(new Error('getUserMedia is unavailable'));
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}

export class AudioRecorder {
  private readonly audioBitsPerSecond: number;
  private readonly timesliceMs: number;
  private readonly audioConstraints: MediaTrackConstraints | boolean;
  private readonly stopStreamOnStopOverride?: boolean;
  private readonly isTypeSupported?: (mimeType: string) => boolean;
  private readonly mediaRecorderFactory: (
    stream: MediaStreamLike,
    options: { mimeType?: string; audioBitsPerSecond?: number },
  ) => MediaRecorderLike;
  private readonly getUserMediaFn: (constraints: MediaStreamConstraints) => Promise<MediaStreamLike>;
  private readonly now: () => number;

  private stream: MediaStreamLike | null = null;
  private ownsStream = false;
  private recorder: MediaRecorderLike | null = null;
  private chunks: Blob[] = [];
  private state: RecorderState;
  private listeners = new Set<RecorderStateListener>();
  private pausedAccumMs = 0;
  private pausedAtMs: number | null = null;
  private stopPromise: Promise<RecordingResult> | null = null;
  private disposed = false;

  constructor(options: AudioRecorderOptions = {}) {
    this.audioBitsPerSecond = options.audioBitsPerSecond ?? 48_000;
    this.timesliceMs = options.timesliceMs ?? 250;
    this.audioConstraints = options.audioConstraints ?? {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };
    this.stopStreamOnStopOverride = options.stopStreamOnStop;
    this.isTypeSupported = options.isTypeSupported;
    this.mediaRecorderFactory = options.mediaRecorderFactory ?? defaultMediaRecorderFactory;
    this.getUserMediaFn = options.getUserMedia ?? defaultGetUserMedia;
    this.now = options.now ?? (() => Date.now());

    this.state = {
      status: 'idle',
      mimeType: selectBestAudioMimeType(this.isTypeSupported),
      startedAt: null,
      durationMs: 0,
      error: null,
    };
  }

  public getState(): RecorderState {
    return {
      ...this.state,
      durationMs: this.computeElapsedMs(),
    };
  }

  public getStream(): MediaStreamLike | null {
    return this.stream;
  }

  public onStateChange(listener: RecorderStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Start audio recording. Reuses `existingStream` if supplied; otherwise requests microphone access.
   * Returns the active MediaStream so callers can share it with VAD/AnalyserNode.
   */
  public async start(existingStream?: MediaStreamLike): Promise<MediaStreamLike> {
    if (this.disposed) {
      throw new Error('AudioRecorder has been disposed');
    }
    if (this.recorder && this.recorder.state !== 'inactive') {
      throw new Error('AudioRecorder is already recording');
    }

    const canRecord =
      Boolean(this.optionsHasCustomFactory()) || typeof MediaRecorder !== 'undefined';
    if (!canRecord) {
      const error: RecorderError = {
        code: 'not_supported',
        messageVi: 'Trình duyệt không hỗ trợ MediaRecorder để ghi âm.',
      };
      this.updateState({ status: 'error', error });
      throw new Error(error.messageVi);
    }

    let streamToUse: MediaStreamLike;
    if (existingStream) {
      streamToUse = existingStream;
      this.ownsStream = false;
    } else {
      this.updateState({ status: 'requesting_permission', error: null });
      try {
        streamToUse = await this.getUserMediaFn({ audio: this.audioConstraints });
        this.ownsStream = true;
      } catch (err) {
        const error = classifyMicError(err);
        this.updateState({ status: 'error', error });
        throw err;
      }
    }

    this.stream = streamToUse;
    this.chunks = [];
    this.pausedAccumMs = 0;
    this.pausedAtMs = null;

    const chosenMime = selectBestAudioMimeType(this.isTypeSupported);
    try {
      const rec = this.mediaRecorderFactory(streamToUse, {
        mimeType: chosenMime || undefined,
        audioBitsPerSecond: this.audioBitsPerSecond,
      });

      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          this.chunks.push(ev.data);
        }
      };

      rec.onerror = (ev) => {
        const error: RecorderError = {
          code: 'recording_failed',
          messageVi: 'Đã xảy ra lỗi trong lúc ghi âm.',
          cause: ev,
        };
        this.updateState({ status: 'error', error });
      };

      const startedAt = this.now();
      this.recorder = rec;
      rec.start(this.timesliceMs > 0 ? this.timesliceMs : undefined);

      const activeMime = rec.mimeType || chosenMime || 'audio/webm';
      this.updateState({
        status: 'recording',
        mimeType: activeMime,
        startedAt,
        durationMs: 0,
        error: null,
      });

      return streamToUse;
    } catch (err) {
      if (this.ownsStream) {
        stopMediaStream(this.stream);
        this.stream = null;
        this.ownsStream = false;
      }
      const error: RecorderError = {
        code: 'recording_failed',
        messageVi: 'Không thể khởi tạo bộ ghi âm trên trình duyệt này.',
        cause: err,
      };
      this.updateState({ status: 'error', error });
      throw err;
    }
  }

  public pause(): void {
    if (!this.recorder || this.recorder.state !== 'recording') return;
    if (typeof this.recorder.pause === 'function') {
      this.recorder.pause();
      this.pausedAtMs = this.now();
      this.updateState({ status: 'paused', durationMs: this.computeElapsedMs() });
    }
  }

  public resume(): void {
    if (!this.recorder || this.recorder.state !== 'paused') return;
    if (typeof this.recorder.resume === 'function') {
      if (this.pausedAtMs !== null) {
        this.pausedAccumMs += Math.max(0, this.now() - this.pausedAtMs);
        this.pausedAtMs = null;
      }
      this.recorder.resume();
      this.updateState({ status: 'recording', durationMs: this.computeElapsedMs() });
    }
  }

  /**
   * Stop recording, finalize Blob + durationMs, and clean up owned MediaStream tracks.
   */
  public stop(): Promise<RecordingResult> {
    if (this.stopPromise) return this.stopPromise;

    const rec = this.recorder;
    if (!rec || rec.state === 'inactive') {
      const now = this.now();
      const startedAt = this.state.startedAt ?? now;
      const mimeType = this.state.mimeType || 'audio/webm';
      const blob = new Blob(this.chunks, { type: mimeType });
      this.maybeReleaseStreamOnStop();
      this.updateState({ status: 'stopped', durationMs: 0 });
      return Promise.resolve({
        blob,
        mimeType,
        durationMs: 0,
        durationSec: 0,
        sizeBytes: blob.size,
        startedAt,
        endedAt: now,
      });
    }

    this.updateState({ status: 'stopping' });

    this.stopPromise = new Promise<RecordingResult>((resolve, reject) => {
      const finish = () => {
        const endedAt = this.now();
        const startedAt = this.state.startedAt ?? endedAt;
        const durationMs = this.computeElapsedMs(endedAt);
        const mimeType = rec.mimeType || this.state.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });

        this.recorder = null;
        this.stopPromise = null;
        this.pausedAtMs = null;
        this.maybeReleaseStreamOnStop();

        this.updateState({
          status: 'stopped',
          mimeType,
          durationMs,
        });

        resolve({
          blob,
          mimeType,
          durationMs,
          durationSec: Number((durationMs / 1000).toFixed(3)),
          sizeBytes: blob.size,
          startedAt,
          endedAt,
        });
      };

      rec.onstop = finish;
      rec.onerror = (ev) => {
        this.recorder = null;
        this.stopPromise = null;
        this.maybeReleaseStreamOnStop();
        const error: RecorderError = {
          code: 'recording_failed',
          messageVi: 'Lỗi khi dừng ghi âm.',
          cause: ev,
        };
        this.updateState({ status: 'error', error });
        reject(new Error(error.messageVi));
      };

      try {
        rec.stop();
      } catch (err) {
        this.recorder = null;
        this.stopPromise = null;
        this.maybeReleaseStreamOnStop();
        const error: RecorderError = {
          code: 'recording_failed',
          messageVi: 'Không thể dừng bộ ghi âm.',
          cause: err,
        };
        this.updateState({ status: 'error', error });
        reject(err);
      }
    });

    return this.stopPromise;
  }

  /**
   * Abort recording immediately and release owned MediaStream tracks.
   */
  public cancel(): void {
    const rec = this.recorder;
    this.recorder = null;
    this.stopPromise = null;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null;
      rec.ondataavailable = null;
      rec.onerror = null;
      try {
        rec.stop();
      } catch {
        // Ignore abort errors
      }
    }
    this.chunks = [];
    this.pausedAccumMs = 0;
    this.pausedAtMs = null;
    this.maybeReleaseStreamOnStop();
    this.updateState({
      status: 'idle',
      startedAt: null,
      durationMs: 0,
      error: null,
    });
  }

  /**
   * Explicitly stop and release the underlying MediaStream tracks.
   */
  public releaseStream(): void {
    if (this.stream) {
      stopMediaStream(this.stream);
      this.stream = null;
      this.ownsStream = false;
    }
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancel();
    if (this.ownsStream) {
      this.releaseStream();
    }
    this.listeners.clear();
  }

  private optionsHasCustomFactory(): boolean {
    return this.mediaRecorderFactory !== defaultMediaRecorderFactory;
  }

  private maybeReleaseStreamOnStop(): void {
    const shouldStop =
      this.stopStreamOnStopOverride !== undefined
        ? this.stopStreamOnStopOverride
        : this.ownsStream;
    if (shouldStop && this.stream) {
      stopMediaStream(this.stream);
      this.stream = null;
      this.ownsStream = false;
    }
  }

  private computeElapsedMs(referenceNowMs = this.now()): number {
    if (this.state.startedAt === null) return this.state.durationMs;
    if (this.state.status === 'stopped' || this.state.status === 'idle') {
      return this.state.durationMs;
    }
    const effectiveNow = this.pausedAtMs ?? referenceNowMs;
    return Math.max(0, effectiveNow - this.state.startedAt - this.pausedAccumMs);
  }

  private updateState(patch: Partial<RecorderState>): void {
    this.state = { ...this.state, ...patch };
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export function createAudioRecorder(options?: AudioRecorderOptions): AudioRecorder {
  return new AudioRecorder(options);
}
