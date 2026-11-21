/**
 * Web Speech API (SpeechRecognition / webkitSpeechRecognition) wrapper with:
 * - Seamless auto-restart when Chrome cuts off mid-session (~60s limit)
 * - Boundary-overlap deduplication when stitching transcripts across restarts
 * - Confidence capture for indirect pronunciation proxy (0 AI APIs)
 * - Graceful fallback for unsupported browsers (Firefox / Safari) with manual transcript input
 *
 * Pure TypeScript wrapper (no React, no DOM rendering, NEVER uses speechSynthesis).
 */

export type AsrStatus =
  | 'supported'
  | 'unsupported'
  | 'listening'
  | 'restarting'
  | 'stopped'
  | 'error';

export type AsrErrorCode =
  | 'unsupported'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'audio-capture'
  | 'network'
  | 'no-speech'
  | 'aborted'
  | 'unknown';

export interface AsrError {
  code: AsrErrorCode;
  fatal: boolean;
  messageVi: string;
}

export interface AsrTranscriptSegment {
  text: string;
  /** Recognition confidence in [0, 1], or null if browser did not report confidence (0 or omitted). */
  confidence: number | null;
  timestampMs: number;
  isLowConfidence: boolean;
}

export interface AsrState {
  status: AsrStatus;
  isSupported: boolean;
  lang: string;
  finalTranscript: string;
  interimTranscript: string;
  /** Clean combined transcript (final + interim). */
  combinedTranscript: string;
  restartCount: number;
  segments: AsrTranscriptSegment[];
  error: AsrError | null;
  fallbackMessageVi: string | null;
}

export interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
  readonly confidence?: number;
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionResultListLike {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultLike;
}

export interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionFactory = () => SpeechRecognitionLike;

export interface AsrControllerOptions {
  /** BCP-47 language tag. Default: 'en-GB' (docs/03 §6). */
  lang?: string;
  /** Auto-restart when browser cuts recognition while listening. Default: true. */
  autoRestart?: boolean;
  /** Delay before restarting after premature onend (ms). Default: 120. */
  restartDelayMs?: number;
  /** Max consecutive failed start() attempts before giving up with error. Default: 5. */
  maxConsecutiveFailures?: number;
  /** Confidence threshold below which a segment is flagged as low confidence. Default: 0.75. */
  lowConfidenceThreshold?: number;
  /**
   * Injectable factory for tests. Pass `null` explicitly to simulate an unsupported browser (Firefox/Safari).
   * Omit to auto-detect window.SpeechRecognition / window.webkitSpeechRecognition.
   */
  recognitionFactory?: SpeechRecognitionFactory | null;
  /** Injectable clock (ms) for deterministic tests. */
  now?: () => number;
}

export type AsrStateListener = (state: AsrState) => void;

export const UNSUPPORTED_ASR_FALLBACK_VI =
  'Trình duyệt này (ví dụ Firefox hoặc Safari) không hỗ trợ Web Speech API nhận dạng giọng nói trực tiếp. Bạn vẫn ghi âm bình thường và có thể tự nhập hoặc dán transcript để tính chỉ số.';

const FATAL_ASR_ERRORS = new Set<string>([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
]);

/**
 * Detect SpeechRecognition constructor in the current browser environment.
 */
export function getNativeSpeechRecognitionFactory(): SpeechRecognitionFactory | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  if (typeof Ctor !== 'function') return null;
  return () => new Ctor();
}

export function isSpeechRecognitionSupported(): boolean {
  return getNativeSpeechRecognitionFactory() !== null;
}

function normalizeTokenForOverlap(token: string): string {
  return token
    .toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
}

function splitWhitespaceTokens(text: string): string[] {
  return text.trim().split(/\s+/).filter((t) => t.length > 0);
}

/**
 * Pure helper to merge an incoming ASR transcript segment onto an existing committed transcript
 * without duplicating overlapping boundary words (common when Chrome auto-restarts or replays tail words).
 */
export function mergeTranscriptSegments(
  committed: string,
  incoming: string,
  maxOverlapWords = 12,
): string {
  const left = committed.trim();
  const right = incoming.trim();
  if (!right) return left;
  if (!left) return right;

  const leftTokens = splitWhitespaceTokens(left);
  const rightTokens = splitWhitespaceTokens(right);
  if (leftTokens.length === 0) return right;
  if (rightTokens.length === 0) return left;

  const leftNorm = leftTokens.map(normalizeTokenForOverlap);
  const rightNorm = rightTokens.map(normalizeTokenForOverlap);

  // Check if the entire incoming chunk is already a suffix of committed text
  if (rightNorm.length <= leftNorm.length) {
    const tailStart = leftNorm.length - rightNorm.length;
    let exactTail = true;
    for (let i = 0; i < rightNorm.length; i++) {
      if (leftNorm[tailStart + i] !== rightNorm[i]) {
        exactTail = false;
        break;
      }
    }
    if (exactTail) {
      return left;
    }
  }

  // Find longest suffix of `leftNorm` matching prefix of `rightNorm`
  const maxCheck = Math.min(maxOverlapWords, leftNorm.length, rightNorm.length);
  let overlapLen = 0;

  for (let len = maxCheck; len >= 1; len--) {
    let matches = true;
    const leftOffset = leftNorm.length - len;
    for (let i = 0; i < len; i++) {
      const l = leftNorm[leftOffset + i];
      const r = rightNorm[i];
      if (!l || l !== r) {
        matches = false;
        break;
      }
    }
    if (matches) {
      overlapLen = len;
      break;
    }
  }

  const remainingRight = rightTokens.slice(overlapLen);
  if (remainingRight.length === 0) {
    return left;
  }

  return `${left} ${remainingRight.join(' ')}`.trim();
}

function classifyAsrError(rawCode: string): AsrError {
  const code = rawCode || 'unknown';
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        code,
        fatal: true,
        messageVi: 'Trình duyệt từ chối quyền nhận dạng giọng nói. Hãy cấp quyền Micro và thử lại.',
      };
    case 'audio-capture':
      return {
        code: 'audio-capture',
        fatal: true,
        messageVi: 'Không thể thu âm từ micro để nhận dạng giọng nói.',
      };
    case 'network':
      return {
        code: 'network',
        fatal: false,
        messageVi: 'Kết nối dịch vụ nhận dạng giọng nói bị gián đoạn. Đang thử tự khởi động lại...',
      };
    case 'no-speech':
      return {
        code: 'no-speech',
        fatal: false,
        messageVi: 'Chưa nghe rõ tiếng nói; đang tiếp tục lắng nghe...',
      };
    case 'aborted':
      return {
        code: 'aborted',
        fatal: false,
        messageVi: 'Phiên nhận dạng tạm ngắt.',
      };
    default:
      return {
        code: 'unknown',
        fatal: false,
        messageVi: `Lỗi nhận dạng giọng nói (${code}).`,
      };
  }
}

export class AsrController {
  private readonly autoRestart: boolean;
  private readonly restartDelayMs: number;
  private readonly maxConsecutiveFailures: number;
  private readonly lowConfidenceThreshold: number;
  private readonly recognitionFactory: SpeechRecognitionFactory | null;
  private readonly now: () => number;

  private recognition: SpeechRecognitionLike | null = null;
  private shouldBeListening = false;
  private fatalErrorOccurred = false;
  private consecutiveFailures = 0;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private lastProcessedResultIndex = -1;
  private destroyed = false;

  private state: AsrState;
  private listeners = new Set<AsrStateListener>();

  constructor(options: AsrControllerOptions = {}) {
    this.autoRestart = options.autoRestart ?? true;
    this.restartDelayMs = Math.max(0, options.restartDelayMs ?? 120);
    this.maxConsecutiveFailures = Math.max(1, options.maxConsecutiveFailures ?? 5);
    this.lowConfidenceThreshold = options.lowConfidenceThreshold ?? 0.75;
    this.recognitionFactory =
      options.recognitionFactory === undefined
        ? getNativeSpeechRecognitionFactory()
        : options.recognitionFactory;
    this.now = options.now ?? (() => Date.now());

    const isSupported = this.recognitionFactory !== null;
    this.state = {
      status: isSupported ? 'supported' : 'unsupported',
      isSupported,
      lang: options.lang ?? 'en-GB',
      finalTranscript: '',
      interimTranscript: '',
      combinedTranscript: '',
      restartCount: 0,
      segments: [],
      error: null,
      fallbackMessageVi: isSupported ? null : UNSUPPORTED_ASR_FALLBACK_VI,
    };
  }

  public getState(): AsrState {
    return {
      ...this.state,
      segments: this.state.segments.map((s) => ({ ...s })),
      error: this.state.error ? { ...this.state.error } : null,
    };
  }

  public onStateChange(listener: AsrStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setLang(lang: string): void {
    if (!lang.trim()) return;
    this.updateState({ lang: lang.trim() });
  }

  /**
   * Start listening via Web Speech API.
   * Returns `true` if started, or `false` gracefully when browser is unsupported.
   */
  public start(options?: { resetTranscript?: boolean }): boolean {
    if (this.destroyed) return false;

    if (!this.recognitionFactory) {
      this.updateState({
        status: 'unsupported',
        isSupported: false,
        fallbackMessageVi: UNSUPPORTED_ASR_FALLBACK_VI,
      });
      return false;
    }

    if (options?.resetTranscript) {
      this.clearTranscriptState();
    }

    this.clearRestartTimer();
    this.shouldBeListening = true;
    this.fatalErrorOccurred = false;
    this.consecutiveFailures = 0;

    return this.startSession(false);
  }

  /**
   * Manually stop listening (prevents auto-restart) and commit any remaining interim text if requested.
   */
  public stop(options?: { commitInterim?: boolean }): void {
    this.shouldBeListening = false;
    this.clearRestartTimer();

    if (options?.commitInterim && this.state.interimTranscript.trim()) {
      const merged = mergeTranscriptSegments(
        this.state.finalTranscript,
        this.state.interimTranscript,
      );
      this.state = {
        ...this.state,
        finalTranscript: merged,
        interimTranscript: '',
        combinedTranscript: merged,
      };
    } else if (this.state.interimTranscript) {
      this.state = {
        ...this.state,
        interimTranscript: '',
        combinedTranscript: this.state.finalTranscript,
      };
    }

    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // Ignore stop error if already stopped
      }
    }

    if (this.state.isSupported) {
      this.updateState({ status: 'stopped' });
    } else {
      this.updateState({ status: 'unsupported' });
    }
  }

  /**
   * Reset transcript, segments, restart count, and errors without destroying listeners.
   */
  public reset(): void {
    this.stop();
    this.clearTranscriptState();
    this.updateState({
      status: this.state.isSupported ? 'supported' : 'unsupported',
      restartCount: 0,
      error: null,
    });
  }

  /**
   * Fallback & editing API: allow users (especially on Firefox/Safari) to manually enter or paste a transcript.
   */
  public setManualTranscript(transcript: string): void {
    const clean = transcript.trim();
    this.updateState({
      finalTranscript: clean,
      interimTranscript: '',
      combinedTranscript: clean,
    });
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    this.listeners.clear();
  }

  private clearTranscriptState(): void {
    this.state = {
      ...this.state,
      finalTranscript: '',
      interimTranscript: '',
      combinedTranscript: '',
      segments: [],
      restartCount: 0,
      error: null,
    };
  }

  private startSession(isRestart: boolean): boolean {
    if (!this.recognitionFactory || this.destroyed) return false;

    this.detachRecognition();
    this.lastProcessedResultIndex = -1;

    try {
      const rec = this.recognitionFactory();
      rec.lang = this.state.lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        if (this.destroyed || this.recognition !== rec) return;
        this.consecutiveFailures = 0;
        this.updateState({
          status: 'listening',
          error: null,
        });
      };

      rec.onresult = (event) => {
        if (this.destroyed || this.recognition !== rec) return;
        this.handleResult(event);
      };

      rec.onerror = (event) => {
        if (this.destroyed || this.recognition !== rec) return;
        const parsed = classifyAsrError(event.error);
        if (parsed.fatal || FATAL_ASR_ERRORS.has(event.error)) {
          this.fatalErrorOccurred = true;
          this.shouldBeListening = false;
          this.clearRestartTimer();
          this.updateState({
            status: 'error',
            error: parsed,
          });
        } else {
          // Non-fatal error (e.g. 'no-speech' or transient 'network'): record error, allow onend auto-restart
          this.updateState({ error: parsed });
        }
      };

      rec.onend = () => {
        if (this.destroyed || this.recognition !== rec) return;
        this.recognition = null;

        // Commit any dangling interim text before restarting or stopping?
        // Only clear interim; finalized results are already committed.
        if (this.shouldBeListening && this.autoRestart && !this.fatalErrorOccurred) {
          this.scheduleRestart();
        } else if (!this.fatalErrorOccurred) {
          this.updateState({
            status: 'stopped',
            interimTranscript: '',
            combinedTranscript: this.state.finalTranscript,
          });
        }
      };

      this.recognition = rec;
      rec.start();

      // If mock/implementation does not immediately fire onstart synchronously, reflect state cleanly
      if (this.state.status !== 'listening') {
        this.updateState({
          status: isRestart ? 'restarting' : 'listening',
        });
      }
      return true;
    } catch {
      this.consecutiveFailures++;
      if (this.shouldBeListening && this.autoRestart && this.consecutiveFailures < this.maxConsecutiveFailures) {
        this.scheduleRestart();
        return false;
      }
      this.shouldBeListening = false;
      this.fatalErrorOccurred = true;
      this.updateState({
        status: 'error',
        error: {
          code: 'unknown',
          fatal: true,
          messageVi: 'Không thể khởi động lại bộ nhận dạng giọng nói sau nhiều lần thử.',
        },
      });
      return false;
    }
  }

  private scheduleRestart(): void {
    this.clearRestartTimer();
    const nextRestartCount = this.state.restartCount + 1;
    this.updateState({
      status: 'restarting',
      restartCount: nextRestartCount,
      interimTranscript: '',
      combinedTranscript: this.state.finalTranscript,
    });

    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.destroyed || !this.shouldBeListening || this.fatalErrorOccurred) return;
      this.startSession(true);
    }, this.restartDelayMs);
  }

  private handleResult(event: SpeechRecognitionEventLike): void {
    let nextFinal = this.state.finalTranscript;
    let interimParts: string[] = [];
    const newSegments: AsrTranscriptSegment[] = [];

    const startIdx = Math.max(0, event.resultIndex ?? 0);
    for (let i = startIdx; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result || result.length === 0) continue;
      const alt = result[0];
      const text = (alt?.transcript ?? '').trim();
      if (!text) continue;

      if (result.isFinal) {
        if (i <= this.lastProcessedResultIndex) {
          continue;
        }
        this.lastProcessedResultIndex = i;
        const prevFinal = nextFinal;
        nextFinal = mergeTranscriptSegments(nextFinal, text);

        // Only record a new confidence segment if text actually contributed or is first segment
        if (nextFinal !== prevFinal || this.state.segments.length === 0) {
          const rawConf = typeof alt.confidence === 'number' ? alt.confidence : 0;
          const confidence = rawConf > 0 && Number.isFinite(rawConf) ? Math.min(1, rawConf) : null;
          newSegments.push({
            text,
            confidence,
            timestampMs: this.now(),
            isLowConfidence: confidence !== null && confidence < this.lowConfidenceThreshold,
          });
        }
      } else {
        interimParts.push(text);
      }
    }

    const interim = interimParts.join(' ').trim();
    const combined = interim
      ? mergeTranscriptSegments(nextFinal, interim)
      : nextFinal;

    this.updateState({
      status: 'listening',
      finalTranscript: nextFinal,
      interimTranscript: interim,
      combinedTranscript: combined,
      segments:
        newSegments.length > 0
          ? [...this.state.segments, ...newSegments]
          : this.state.segments,
      error: null,
    });
  }

  private detachRecognition(): void {
    if (!this.recognition) return;
    const prev = this.recognition;
    this.recognition = null;
    prev.onstart = null;
    prev.onresult = null;
    prev.onerror = null;
    prev.onend = null;
    try {
      prev.abort();
    } catch {
      // Ignore abort errors
    }
  }

  private clearRestartTimer(): void {
    if (this.restartTimer !== null) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
  }

  private updateState(patch: Partial<AsrState>): void {
    this.state = { ...this.state, ...patch };
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export function createAsrController(options?: AsrControllerOptions): AsrController {
  return new AsrController(options);
}
