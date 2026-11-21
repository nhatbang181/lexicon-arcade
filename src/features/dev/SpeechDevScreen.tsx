import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileText,
  Mic,
  RotateCcw,
  Square,
  Volume2,
} from 'lucide-react';
import { Button, Card, Pill, type PillTone } from '../../design/components';
import {
  AsrController,
  AudioRecorder,
  BAND8_SPEAKING_BENCHMARKS,
  MicVadMonitor,
  computeSpeechMetrics,
  evaluateMetricsAgainstBand8,
  isAudioRecordingSupported,
  selectBestAudioMimeType,
  type AsrState,
  type AsrStatus,
  type BenchmarkStatus,
  type RecordingResult,
  type VadFrameSnapshot,
  type VadStatus,
  type VadSummary,
} from '../../core/speech';

const SAMPLE_TRANSCRIPT =
  'Um, I believe that sustainable urban transport is, you know, basically essential for modern cities. Honestly, when commuters rely on reliable metro lines rather than private vehicles, air pollution declines noticeably and daily travel becomes far more predictable. Actually, investing in cycling lanes also encourages healthier lifestyles across all age groups.';

const SAMPLE_ASR_SEGMENTS = [
  {
    text: 'Um, I believe that sustainable urban transport is, you know, basically essential for modern cities.',
    confidence: 0.91,
    timestampMs: 1000,
    isLowConfidence: false,
  },
  {
    text: 'Honestly, when commuters rely on reliable metro lines rather than private vehicles, air pollution declines noticeably and daily travel becomes far more predictable.',
    confidence: 0.69,
    timestampMs: 2000,
    isLowConfidence: true,
  },
  {
    text: 'Actually, investing in cycling lanes also encourages healthier lifestyles across all age groups.',
    confidence: 0.94,
    timestampMs: 3000,
    isLowConfidence: false,
  },
];

function asrStatusTone(status: AsrStatus): PillTone {
  switch (status) {
    case 'listening':
      return 'correct';
    case 'restarting':
      return 'partial';
    case 'error':
      return 'wrong';
    case 'unsupported':
      return 'partial';
    case 'supported':
      return 'info';
    default:
      return 'neutral';
  }
}

function vadStatusTone(status: VadStatus): PillTone {
  switch (status) {
    case 'speaking':
      return 'correct';
    case 'calibrating':
      return 'info';
    case 'silence_timeout':
      return 'partial';
    default:
      return 'neutral';
  }
}

function benchmarkTone(status: BenchmarkStatus): PillTone {
  switch (status) {
    case 'target':
      return 'correct';
    case 'near':
      return 'partial';
    case 'below':
      return 'wrong';
    default:
      return 'neutral';
  }
}

function formatSec(sec: number | null): string {
  if (sec === null || !Number.isFinite(sec)) return '—';
  return `${sec.toFixed(1)}s`;
}

export const SpeechDevScreen: React.FC = () => {
  const recorderRef = useRef<AudioRecorder | null>(null);
  const vadRef = useRef<MicVadMonitor | null>(null);
  const asrRef = useRef<AsrController | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [lang, setLang] = useState<'en-GB' | 'en-US'>('en-GB');
  const [silenceTimeoutMs, setSilenceTimeoutMs] = useState<number | null>(2500);
  const [micError, setMicError] = useState<string | null>(null);

  const [liveFrame, setLiveFrame] = useState<VadFrameSnapshot | null>(null);
  const [vadSummary, setVadSummary] = useState<VadSummary | null>(null);
  const [silenceTimeoutCount, setSilenceTimeoutCount] = useState(0);

  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [asrState, setAsrState] = useState<AsrState>(() => {
    const probe = new AsrController({ lang: 'en-GB' });
    const initial = probe.getState();
    probe.destroy();
    return initial;
  });

  const [manualText, setManualText] = useState('');
  const [manualDurationSec, setManualDurationSec] = useState(25);
  const [sampleSegments, setSampleSegments] = useState<typeof SAMPLE_ASR_SEGMENTS | null>(null);

  const bestMime = useMemo(() => selectBestAudioMimeType() || '(browser default)', []);
  const recordingSupported = useMemo(() => isAudioRecordingSupported(), []);

  const cleanupAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);
  }, []);

  const stopSession = useCallback(async () => {
    setIsActive(false);

    if (asrRef.current) {
      asrRef.current.stop({ commitInterim: true });
      const finalAsr = asrRef.current.getState();
      setAsrState(finalAsr);
      if (finalAsr.finalTranscript) {
        setManualText(finalAsr.finalTranscript);
      }
      asrRef.current.destroy();
      asrRef.current = null;
    }

    if (vadRef.current) {
      const summary = vadRef.current.stop();
      setVadSummary(summary);
      vadRef.current.dispose();
      vadRef.current = null;
    }

    if (recorderRef.current) {
      try {
        const res = await recorderRef.current.stop();
        setRecording(res);
        cleanupAudioUrl();
        if (res.sizeBytes > 0) {
          const url = URL.createObjectURL(res.blob);
          audioUrlRef.current = url;
          setAudioUrl(url);
        }
      } catch (err) {
        setMicError(err instanceof Error ? err.message : 'Lỗi khi dừng ghi âm.');
      } finally {
        recorderRef.current.dispose();
        recorderRef.current = null;
      }
    }
  }, [cleanupAudioUrl]);

  const startSession = useCallback(async () => {
    setMicError(null);
    setSampleSegments(null);
    setSilenceTimeoutCount(0);
    setVadSummary(null);
    setRecording(null);
    cleanupAudioUrl();

    const recorder = new AudioRecorder();
    recorderRef.current = recorder;

    try {
      const stream = await recorder.start();

      const vad = new MicVadMonitor({
        calibrationDurationMs: 1000,
        silenceTimeoutMs,
        onFrame: (snap) => {
          setLiveFrame(snap);
        },
        onSilenceTimeout: () => {
          setSilenceTimeoutCount((c) => c + 1);
        },
        onCalibrationComplete: () => {
          setVadSummary(vad.getSummary());
        },
      });
      vadRef.current = vad;
      vad.start(stream as unknown as MediaStream);

      const asr = new AsrController({
        lang,
        autoRestart: true,
      });
      asr.onStateChange((next) => {
        setAsrState(next);
        if (next.combinedTranscript) {
          setManualText(next.combinedTranscript);
        }
      });
      asrRef.current = asr;
      asr.start({ resetTranscript: true });
      setAsrState(asr.getState());
      setIsActive(true);
    } catch (err) {
      recorder.dispose();
      recorderRef.current = null;
      const stateErr = recorder.getState().error?.messageVi;
      setMicError(
        stateErr ?? (err instanceof Error ? err.message : 'Không thể mở micro trên thiết bị này.'),
      );
      setIsActive(false);
    }
  }, [cleanupAudioUrl, lang, silenceTimeoutMs]);

  const handleReset = useCallback(() => {
    void stopSession();
    cleanupAudioUrl();
    setMicError(null);
    setLiveFrame(null);
    setVadSummary(null);
    setRecording(null);
    setSilenceTimeoutCount(0);
    setManualText('');
    setSampleSegments(null);
  }, [cleanupAudioUrl, stopSession]);

  const handleLoadSample = useCallback(() => {
    setManualText(SAMPLE_TRANSCRIPT);
    setManualDurationSec(22);
    setSampleSegments(SAMPLE_ASR_SEGMENTS);
  }, []);

  // Poll live VAD summary smoothly while active
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      if (vadRef.current) {
        setVadSummary(vadRef.current.getSummary());
      }
    }, 250);
    return () => clearInterval(id);
  }, [isActive]);

  // Clean up all streams/handles on unmount
  useEffect(() => {
    return () => {
      if (asrRef.current) {
        asrRef.current.destroy();
        asrRef.current = null;
      }
      if (vadRef.current) {
        vadRef.current.dispose();
        vadRef.current = null;
      }
      if (recorderRef.current) {
        recorderRef.current.dispose();
        recorderRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  const activeTranscript = isActive ? asrState.combinedTranscript : manualText;
  const activeSegments = sampleSegments ?? asrState.segments;
  const effectiveDurationInput =
    recording && recording.durationSec > 0
      ? recording.durationSec
      : vadSummary && vadSummary.totalDurationSec > 0
        ? vadSummary.totalDurationSec
        : manualDurationSec;

  const metrics = useMemo(
    () =>
      computeSpeechMetrics({
        transcript: activeTranscript,
        durationSec: effectiveDurationInput,
        vadSummary,
        asrSegments: activeSegments,
      }),
    [activeSegments, activeTranscript, effectiveDurationInput, vadSummary],
  );

  const comparison = useMemo(() => evaluateMetricsAgainstBand8(metrics), [metrics]);

  // Map RMS (0..0.35) to 0..100% bar width for visual mic meter
  const rmsPercent = Math.min(100, Math.round(((liveFrame?.rms ?? 0) / 0.25) * 100));
  const thresholdPercent = Math.min(
    100,
    Math.round(((liveFrame?.thresholdRms ?? 0.015) / 0.25) * 100),
  );

  return (
    <div className="space-y-6 pb-12" data-testid="dev-speech-screen">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Pill tone="speaking">M5 · Speech Core Sandbox (#/dev/speech)</Pill>
          <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            Kiểm thử Mic · VAD · ASR Auto-Restart · Speech Metrics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Ghi âm MediaRecorder ({bestMime}), đo RMS/dBFS và khoảng ngừng bằng VAD thuần, nhận
            dạng Web Speech API tự khởi động lại, hoàn toàn không gọi API AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isActive ? 'danger' : 'primary'}
            skill="speaking"
            leftIcon={isActive ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            onClick={() => (isActive ? void stopSession() : void startSession())}
            data-testid="speech-dev-toggle-mic"
          >
            {isActive ? 'Dừng ghi & phân tích' : 'Bắt đầu test Mic'}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={handleLoadSample}
            data-testid="speech-dev-load-sample"
          >
            Nạp mẫu transcript
          </Button>
          <Button
            variant="ghost"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={handleReset}
          >
            Đặt lại
          </Button>
        </div>
      </div>

      {/* Controls & Capabilities */}
      <Card padding="md" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={recordingSupported ? 'correct' : 'wrong'}>
            MediaRecorder: {recordingSupported ? 'Hỗ trợ' : 'Không hỗ trợ'}
          </Pill>
          <Pill tone={asrStatusTone(asrState.status)} data-testid="speech-dev-asr-status">
            ASR: {asrState.status}
          </Pill>
          <Pill tone={vadStatusTone(liveFrame?.status ?? 'idle')} data-testid="speech-dev-vad-status">
            VAD: {liveFrame?.status ?? 'idle'}
          </Pill>
          <Pill tone="neutral" data-testid="speech-dev-restart-count">
            Auto-restart: {asrState.restartCount}
          </Pill>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5" style={{ color: 'var(--color-text-dim)' }}>
            <span>Ngôn ngữ ASR:</span>
            <select
              value={lang}
              disabled={isActive}
              onChange={(e) => setLang(e.target.value as 'en-GB' | 'en-US')}
              className="rounded-[var(--radius-sm)] border px-2 py-1 text-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="en-GB">en-GB (UK)</option>
              <option value="en-US">en-US (US)</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5" style={{ color: 'var(--color-text-dim)' }}>
            <span>Ngưỡng im lặng:</span>
            <select
              value={silenceTimeoutMs === null ? 'off' : String(silenceTimeoutMs)}
              disabled={isActive}
              onChange={(e) =>
                setSilenceTimeoutMs(e.target.value === 'off' ? null : Number(e.target.value))
              }
              className="rounded-[var(--radius-sm)] border px-2 py-1 text-xs"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="2500">2.5s (Part 1)</option>
              <option value="3000">3.0s (Part 3)</option>
              <option value="off">Tắt tự dừng</option>
            </select>
          </label>
        </div>
      </Card>

      {/* Error / Unsupported Fallback banners */}
      {micError && (
        <Card
          padding="md"
          style={{ borderColor: 'var(--color-wrong)' }}
          className="flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-wrong)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-wrong)' }}>
              Lỗi Micro / Ghi âm
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              {micError}
            </p>
          </div>
        </Card>
      )}

      {!asrState.isSupported && asrState.fallbackMessageVi && (
        <Card
          padding="md"
          style={{ borderColor: 'var(--color-partial)' }}
          className="flex items-start gap-3"
        >
          <AlertTriangle
            className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: 'var(--color-partial)' }}
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-partial)' }}>
              Chế độ dự phòng (Không có Web Speech API)
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              {asrState.fallbackMessageVi}
            </p>
          </div>
        </Card>
      )}

      {/* Row 1: Real-time RMS Meter + VAD Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Activity className="w-4 h-4" style={{ color: 'var(--color-speaking)' }} />
              Mức âm thanh &amp; VAD Real-time
            </h2>
            {vadSummary?.noisyEnvironment && (
              <Pill tone="partial">Phòng hơi ồn (nền cao)</Pill>
            )}
          </div>

          {/* RMS Level Bar with adaptive threshold marker */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono tabular-nums" style={{ color: 'var(--color-text-dim)' }}>
              <span>RMS: {(liveFrame?.rms ?? 0).toFixed(4)}</span>
              <span>dBFS: {(liveFrame?.dbfs ?? -100).toFixed(1)} dB</span>
              <span>Ngưỡng: {(liveFrame?.thresholdRms ?? 0.015).toFixed(3)}</span>
            </div>
            <div
              className="relative h-4 w-full rounded-full overflow-hidden border"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${rmsPercent}%`,
                  backgroundColor: liveFrame?.isSpeaking
                    ? 'var(--color-correct)'
                    : 'var(--color-info)',
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5"
                style={{
                  left: `${thresholdPercent}%`,
                  backgroundColor: 'var(--color-speaking)',
                }}
                title="Ngưỡng VAD tự hiệu chỉnh"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <StatBox label="Thời gian nói" value={formatSec(vadSummary?.speechDurationSec ?? null)} />
            <StatBox
              label="Tỉ lệ im lặng"
              value={vadSummary ? `${Math.round(vadSummary.silenceRatio * 100)}%` : '—'}
            />
            <StatBox
              label="Độ trễ bắt đầu"
              value={formatSec(vadSummary?.startLatencySec ?? null)}
            />
            <StatBox label="Ngừng ≥ 0.5s" value={String(vadSummary?.pauseCount ?? 0)} />
            <StatBox
              label="Ngừng dài nhất"
              value={formatSec(vadSummary?.longestPauseSec ?? null)}
            />
            <StatBox label="Lần timeout im lặng" value={String(silenceTimeoutCount)} />
          </div>

          {/* Playback recorded blob */}
          {audioUrl && recording && (
            <div
              className="rounded-[var(--radius-md)] border p-3 space-y-2"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                  <Volume2 className="w-4 h-4" style={{ color: 'var(--color-speaking)' }} />
                  Bản ghi gần nhất ({recording.durationSec.toFixed(1)}s)
                </span>
                <span className="font-mono" style={{ color: 'var(--color-text-faint)' }}>
                  {recording.mimeType} · {(recording.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </div>
              <audio controls src={audioUrl} className="w-full h-9" />
            </div>
          )}
        </Card>

        {/* Transcript & ASR Live / Fallback Input */}
        <Card padding="lg" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Transcript (ASR Live / Nhập tay dự phòng)
            </h2>
            {!isActive && (
              <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-dim)' }}>
                <span>Thời lượng giả lập (s):</span>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={manualDurationSec}
                  onChange={(e) => setManualDurationSec(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-mono tabular-nums"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </label>
            )}
          </div>

          {isActive ? (
            <div
              className="min-h-[150px] rounded-[var(--radius-md)] border p-3 text-sm leading-relaxed"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <span>{asrState.finalTranscript}</span>
              {asrState.interimTranscript && (
                <span className="italic ml-1" style={{ color: 'var(--color-text-dim)' }}>
                  {asrState.interimTranscript}
                </span>
              )}
              {!asrState.combinedTranscript && (
                <span style={{ color: 'var(--color-text-faint)' }}>
                  Đang lắng nghe ({lang})... Hãy nói tiếng Anh vào micro.
                </span>
              )}
            </div>
          ) : (
            <textarea
              rows={6}
              value={manualText}
              onChange={(e) => {
                setManualText(e.target.value);
                setSampleSegments(null);
              }}
              placeholder="Nói bằng micro phía trên, bấm 'Nạp mẫu transcript', hoặc tự dán transcript tiếng Anh vào đây để xem các chỉ số Speech Metrics..."
              className="w-full rounded-[var(--radius-md)] border p-3 text-sm leading-relaxed resize-y"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              data-testid="speech-dev-transcript-input"
            />
          )}

          {asrState.error && (
            <p className="text-xs" style={{ color: 'var(--color-partial)' }}>
              Ghi chú ASR ({asrState.error.code}): {asrState.error.messageVi}
            </p>
          )}
        </Card>
      </div>

      {/* Row 2: Speech Metrics & Indirect Pronunciation Proxy */}
      <Card padding="lg" className="space-y-5" data-testid="speech-dev-metrics-panel">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            Speech Metrics (thuần, đối chiếu tham chiếu Band 8 · S1 §4.1)
          </h2>
          <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
            Thời lượng tính tốc độ: {metrics.effectiveDurationSec.toFixed(1)}s
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="WPM (từ/phút)"
            value={metrics.wpm.toFixed(1)}
            target={`${BAND8_SPEAKING_BENCHMARKS.wpmMin}–${BAND8_SPEAKING_BENCHMARKS.wpmMax}`}
            tone={benchmarkTone(comparison.wpm)}
          />
          <MetricCard
            label="Tổng số từ"
            value={String(metrics.wordCount)}
            target={`Unique: ${metrics.lexicalDiversity.uniqueWordCount}`}
            tone="neutral"
          />
          <MetricCard
            label="Fillers"
            value={`${metrics.fillerCount} (${metrics.fillersPerMin.toFixed(1)}/ph)`}
            target={`≤ ${BAND8_SPEAKING_BENCHMARKS.maxFillersPerMin}/ph`}
            tone={benchmarkTone(comparison.fillersPerMin)}
          />
          <MetricCard
            label="Lexical MATTR / Guiraud"
            value={`${metrics.lexicalDiversity.mattr.toFixed(2)} / ${metrics.lexicalDiversity.guiraud.toFixed(1)}`}
            target={`MATTR ≥ ${BAND8_SPEAKING_BENCHMARKS.minMattr}`}
            tone={benchmarkTone(comparison.mattr)}
          />
          <MetricCard
            label="Mean Run Length"
            value={`${metrics.pauseMetrics.meanRunLength.toFixed(1)} từ`}
            target={`≥ ${BAND8_SPEAKING_BENCHMARKS.minMeanRunLength} từ`}
            tone={benchmarkTone(comparison.meanRunLength)}
          />
          <MetricCard
            label="Mid pauses (1–2s)"
            value={`${metrics.pauseMetrics.midPausesPerMin.toFixed(1)}/ph`}
            target={`≤ ${BAND8_SPEAKING_BENCHMARKS.maxMidPausesPerMin}/ph`}
            tone={benchmarkTone(comparison.midPausesPerMin)}
          />
          <MetricCard
            label="Long pauses (>2s)"
            value={`${metrics.pauseMetrics.longPausesPerMin.toFixed(1)}/ph`}
            target={`≤ ${BAND8_SPEAKING_BENCHMARKS.maxLongPausesPerMin}/ph`}
            tone={benchmarkTone(comparison.longPausesPerMin)}
          />
          <MetricCard
            label="TTR (tỉ lệ từ đa dạng)"
            value={metrics.lexicalDiversity.ttr.toFixed(2)}
            target={`Window ${metrics.lexicalDiversity.mattrWindow} từ`}
            tone="neutral"
          />
        </div>

        {/* Fillers breakdown */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              Fillers phát hiện:
            </span>
            {metrics.fillerList.length === 0 ? (
              <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                Không có
              </span>
            ) : (
              metrics.fillerList.map((f) => (
                <Pill key={f.phrase} tone="partial">
                  &ldquo;{f.phrase}&rdquo; × {f.count}
                </Pill>
              ))
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            {metrics.fillerReliabilityNoteVi}
          </p>
        </div>

        {/* Indirect Pronunciation Proxy */}
        <div
          className="rounded-[var(--radius-md)] border p-4 space-y-2"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                Pronunciation Proxy
              </span>
              <Pill tone="info">Ước tính gián tiếp</Pill>
            </div>
            <span className="font-mono text-sm font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
              {metrics.pronunciationProxy.estimatedClarityPct !== null
                ? `${metrics.pronunciationProxy.estimatedClarityPct}% (ASR confidence TB)`
                : 'Chưa có dữ liệu ASR confidence'}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            {metrics.pronunciationProxy.disclaimerVi}
          </p>
          {metrics.pronunciationProxy.lowConfidenceWords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                Từ độ tin cậy thấp:
              </span>
              {metrics.pronunciationProxy.lowConfidenceWords.slice(0, 10).map((item) => (
                <Pill key={item.word} tone="wrong">
                  {item.word} ({Math.round(item.confidence * 100)}%)
                </Pill>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    className="rounded-[var(--radius-sm)] border p-2.5"
    style={{
      backgroundColor: 'var(--color-surface-2)',
      borderColor: 'var(--color-border)',
    }}
  >
    <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
      {label}
    </p>
    <p className="font-mono text-base font-bold tabular-nums mt-0.5" style={{ color: 'var(--color-text)' }}>
      {value}
    </p>
  </div>
);

const MetricCard: React.FC<{
  label: string;
  value: string;
  target: string;
  tone: PillTone;
}> = ({ label, value, target, tone }) => (
  <div
    className="rounded-[var(--radius-md)] border p-3 space-y-1"
    style={{
      backgroundColor: 'var(--color-surface-2)',
      borderColor: 'var(--color-border)',
    }}
  >
    <div className="flex items-center justify-between gap-1">
      <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
        {label}
      </span>
      <Pill tone={tone} size="sm">
        {target}
      </Pill>
    </div>
    <p className="font-mono text-lg font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
      {value}
    </p>
  </div>
);
