import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Headphones,
  Map as MapIcon,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Volume2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import {
  createIdleTrackState,
  createTrackPlayer,
  formatTrackTime,
  type PlaybackRate,
  type TrackPlayerController,
  type TrackPlayerState,
} from '../../core/audio/trackPlayer';
import { playSfx, sfxEngine } from '../../core/audio/sfx';
import { registerProgressSaver } from '../../core/adaptive/progressSaver';
import type {
  ListeningEpisode,
  ListeningQuestionGroup,
  ListeningTrap,
} from '../../core/content/schemas';
import { db } from '../../core/storage/db';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { userItemRepo } from '../../core/storage/repos/userItemRepo';
import {
  AnswerInput,
  Button,
  Card,
  ChoiceButton,
  MapView,
  Modal,
  Pill,
  QuestionNav,
  RecapScreen,
  Timer,
  TrackPlayer,
  Waveform,
  type AssignedMapSlotInfo,
  type QuestionNavItem,
  type RecapMistakeItem,
  type WaveformMarker,
} from '../../design/components';
import type { GameProps } from '../registry';
import {
  ALL_LISTENING_TRAPS,
  LISTENING_TRAP_LABELS_VI,
  PREDICTION_OPTIONS,
  buildL1ProgressPayload,
  buildL1SessionSavePayload,
  buildL1UserItems,
  buildL1WinStatement,
  canSubmitNow,
  createL1RetrySession,
  createL1Session,
  extractQuestionOptions,
  finishAudioListening,
  finishDebrief,
  flattenEpisodeQuestions,
  getActiveSignpostQid,
  getSelectedMultiKeys,
  isPairedMcqMultiGroup,
  resolveScriptTimings,
  setAnswer,
  setCurrentQid,
  setPrediction,
  startListeningPhase,
  submitAndGrade,
  submitTrapLabel,
  toggleFlag,
  toggleMcqMultiChoice,
  type GradedListeningQuestion,
  type L1Mode,
  type L1SessionState,
} from './engine';
import {
  hasRealScriptTimings,
  loadListeningCatalog,
  loadListeningEpisode,
  type EpisodeCatalogItem,
} from './listeningLoader';

const KV_EXAM_DONE_KEY = 'l1.examDoneEpisodeIds';

const PART_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Part 1 · Hội thoại đời sống',
  2: 'Part 2 · Độc thoại hướng dẫn',
  3: 'Part 3 · Thảo luận học thuật',
  4: 'Part 4 · Bài giảng học thuật',
};

const ERROR_CATEGORY_LABELS: Record<string, string> = {
  no_answer: 'Bỏ trống',
  word_limit: 'Vượt giới hạn từ',
  spelling: 'Sai chính tả',
  plural: 'Lỗi số nhiều (-s)',
  wrong_content: 'Sai nội dung',
};

function formatErrorBadge(cat: string): string {
  if (cat.startsWith('trap:')) {
    const key = cat.slice(5) as ListeningTrap;
    return `Bẫy: ${LISTENING_TRAP_LABELS_VI[key] ?? key}`;
  }
  return ERROR_CATEGORY_LABELS[cat] ?? cat;
}

function getTrapChoiceChips(graded: GradedListeningQuestion): ListeningTrap[] {
  const set = new Set<ListeningTrap>();
  for (const t of graded.trapTypes) {
    set.add(t);
  }
  const common: ListeningTrap[] = [
    'self_correction',
    'distractor_number',
    'changed_plan',
    'option_mentioned_rejected',
    'negation_shift',
    'map_direction',
    'plural_singular',
    'synonym_paraphrase',
    'double_letter',
  ];
  for (const c of common) {
    if (set.size >= 4) break;
    set.add(c);
  }
  return Array.from(set).sort((a, b) => ALL_LISTENING_TRAPS.indexOf(a) - ALL_LISTENING_TRAPS.indexOf(b));
}

export const L1TrapDetector: React.FC<GameProps> = ({ mode: initialMode, level: initialLevel, onExit }) => {
  const [catalog, setCatalog] = useState<EpisodeCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [lastTriedItem, setLastTriedItem] = useState<EpisodeCatalogItem | null>(null);
  const [examDoneIds, setExamDoneIds] = useState<string[]>([]);

  const [partFilter, setPartFilter] = useState<'all' | 1 | 2 | 3 | 4>('all');
  const [selectedMode, setSelectedMode] = useState<L1Mode>(
    initialMode === 'exam' ? 'exam' : 'training',
  );
  const [selectedLevel, setSelectedLevel] = useState<number>(
    Math.max(1, Math.min(10, Math.round(initialLevel || 3))),
  );

  // Đồng bộ khi props mode / level thay đổi từ PlayScreen (B4)
  useEffect(() => {
    setSelectedMode(initialMode === 'exam' ? 'exam' : 'training');
  }, [initialMode]);
  useEffect(() => {
    if (typeof initialLevel === 'number' && Number.isFinite(initialLevel) && initialLevel >= 1) {
      setSelectedLevel(Math.max(1, Math.min(10, Math.round(initialLevel))));
    }
  }, [initialLevel]);

  const [session, setSession] = useState<L1SessionState | null>(null);
  const sessionRef = useRef<L1SessionState | null>(null);
  sessionRef.current = session;

  const [previewRemaining, setPreviewRemaining] = useState(30);
  const [reviewRemaining, setReviewRemaining] = useState(30);
  const [showConfirmEarlyModal, setShowConfirmEarlyModal] = useState(false);
  const [showConfirmExitExamModal, setShowConfirmExitExamModal] = useState(false);
  const [tabHiddenWarning, setTabHiddenWarning] = useState(false);
  const [debriefFilter, setDebriefFilter] = useState<'all' | 'wrong'>('wrong');
  const [activeDebriefQid, setActiveDebriefQid] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const savedOnceRef = useRef(false);
  const attemptIdRef = useRef<number | null>(null);

  // TrackPlayer controller
  const playerRef = useRef<TrackPlayerController | null>(null);
  const [trackState, setTrackState] = useState<TrackPlayerState>(createIdleTrackState);
  const trackStateRef = useRef<TrackPlayerState>(trackState);
  trackStateRef.current = trackState;

  useEffect(() => {
    const controller = createTrackPlayer({ initialRate: 1, initialVolume: 1 });
    playerRef.current = controller;
    const unsubState = controller.onStateChange((st) => {
      setTrackState(st);
    });
    const unsubTime = controller.onTime((currentTime, duration) => {
      setTrackState((prev) => ({ ...prev, currentTime, duration }));
    });
    return () => {
      unsubState();
      unsubTime();
      controller.destroy();
      playerRef.current = null;
      sfxEngine.setBlocked(false);
      sfxEngine.setExamMode(false);
    };
  }, []);

  // Load episode catalog (chỉ bài có file MP3 thật — L1-01) và danh sách đã làm Exam (L1-09)
  const reloadCatalog = useCallback(() => {
    setLoadingCatalog(true);
    setCatalogError(null);
    loadListeningCatalog()
      .then((items) => {
        setCatalog(items);
        setLoadingCatalog(false);
      })
      .catch(() => {
        setCatalog([]);
        setCatalogError('Không tải được danh sách bài nghe. Kiểm tra kết nối và thử lại.');
        setLoadingCatalog(false);
      });
  }, []);

  useEffect(() => {
    reloadCatalog();
    db.kv
      .get(KV_EXAM_DONE_KEY)
      .then((row) => {
        if (row && Array.isArray(row.value)) {
          setExamDoneIds(row.value.filter((x): x is string => typeof x === 'string'));
        }
      })
      .catch(() => undefined);
  }, [reloadCatalog]);

  // Block SFX while audio is playing & set exam mode SFX rules
  useEffect(() => {
    const isExam = session?.mode === 'exam' && session.phase !== 'debrief' && session.phase !== 'recap';
    sfxEngine.setExamMode(isExam);
    sfxEngine.setBlocked(trackState.status === 'playing');
    return () => {
      sfxEngine.setBlocked(false);
    };
  }, [session?.mode, session?.phase, trackState.status]);

  // Exam mode tab visibility warning (L1-TRAP-DETECTOR.md §11)
  useEffect(() => {
    if (!session || session.mode !== 'exam' || session.phase !== 'listening') return;
    const onVisibility = () => {
      if (document.hidden) {
        setTabHiddenWarning(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [session]);

  // Lưu tiến độ từng lượt (TU-02) và đăng ký progressSaver cho nút Thoát của PlayScreen (F1)
  const flushProgress = useCallback(async () => {
    const cur = sessionRef.current;
    if (!cur || cur.phase === 'recap' || cur.phase === 'preview') return;
    const answeredCount = Object.values(cur.answers).filter((v) => v.trim().length > 0).length;
    if (answeredCount === 0 && cur.results.length === 0) return;
    try {
      const payload = buildL1ProgressPayload(cur);
      const res = await attemptRepo.saveProgress({
        attemptId: attemptIdRef.current ?? undefined,
        ...payload,
      });
      attemptIdRef.current = res.attemptId;
    } catch {
      // Best-effort persistence
    }
  }, []);

  useEffect(() => {
    if (!session || session.phase === 'recap') return;
    return registerProgressSaver(() => flushProgress());
  }, [session?.episode.id, session?.phase, flushProgress]);

  useEffect(() => {
    if (!session || session.phase === 'preview' || session.phase === 'recap') return;
    const timer = window.setTimeout(() => {
      void flushProgress();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [session?.answers, session?.results, session?.selfTrapLabels, session?.phase, flushProgress]);

  const startEpisode = useCallback(
    async (item: EpisodeCatalogItem) => {
      // Mở khoá audio theo thao tác chạm (TU-03 Safari iOS)
      playerRef.current?.unlock();
      sfxEngine.unlock();

      setLoadingEpisode(true);
      setEpisodeError(null);
      setLastTriedItem(item);
      savedOnceRef.current = false;
      attemptIdRef.current = null;
      setTabHiddenWarning(false);
      try {
        const ep: ListeningEpisode = await loadListeningEpisode(item);
        if (!hasRealScriptTimings(ep)) {
          setEpisodeError('Bài nghe này chưa có mốc thời gian âm thanh thật nên tạm khóa.');
          return;
        }
        const alreadyDoneExam = selectedMode === 'exam' && examDoneIds.includes(ep.id);
        const nextSession = createL1Session(ep, {
          mode: selectedMode,
          level: selectedLevel,
          alreadyDoneExam,
        });
        setSession(nextSession);
        setPreviewRemaining(nextSession.config.previewSec);
        setReviewRemaining(nextSession.config.reviewSec);

        const player = playerRef.current;
        if (player) {
          player.load(ep.audio.path, {
            durationHintSec: ep.audio.durationSec,
            examLocked: nextSession.config.examLocked,
          });
          if (!nextSession.config.examLocked) {
            player.setRate(nextSession.config.defaultRate);
          }
        }
      } catch {
        setEpisodeError(`Không tải được bài "${item.title}". Hãy thử lại.`);
      } finally {
        setLoadingEpisode(false);
      }
    },
    [selectedLevel, selectedMode, examDoneIds],
  );

  const handleBeginListening = useCallback(() => {
    const cur = sessionRef.current;
    const ts = trackStateRef.current;
    if (!cur || cur.phase !== 'preview') return;
    // L1-01 / L1-10: không bắt đầu khi thiếu MP3 hoặc Exam chưa tải xong audio (ready)
    if (ts.status === 'audio_missing' || ts.simulatedMode) return;
    if (cur.mode === 'exam' && ts.status !== 'ready') return;

    playerRef.current?.unlock();
    sfxEngine.unlock();

    const next = startListeningPhase(cur).state;
    setSession(next);
    void playerRef.current?.play();
  }, []);

  // Preview 30s countdown
  useEffect(() => {
    if (!session || session.phase !== 'preview') return;
    const id = window.setInterval(() => {
      setPreviewRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          const ts = trackStateRef.current;
          const cur = sessionRef.current;
          // L1-10: chỉ tự chạy khi audio đã sẵn sàng; nếu Exam còn đang loading hoặc thiếu file thì giữ ở preview
          if (
            cur &&
            ts.status === 'ready' &&
            !ts.simulatedMode
          ) {
            handleBeginListening();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [session?.phase, handleBeginListening]);

  // Detect audio end -> transition to Exam 30s review
  useEffect(() => {
    if (!session || session.phase !== 'listening') return;
    if (trackState.status === 'ended' && session.config.reviewSec > 0) {
      setReviewRemaining(session.config.reviewSec);
      setSession((prev) => (prev ? finishAudioListening(prev).state : prev));
    }
  }, [trackState.status, session?.phase, session?.config.reviewSec]);

  const handleGradeAndEnterDebrief = useCallback(() => {
    playerRef.current?.pause();
    playerRef.current?.setExamLocked(false);
    setShowConfirmEarlyModal(false);

    // L1-17: tính trạng thái chấm điểm ngoài updater của setSession để không chạy lặp side-effect
    const cur = sessionRef.current;
    if (!cur) return;
    const { state: graded } = submitAndGrade(cur);
    const firstWrong = graded.results.find((r) => !r.correct);
    setSession(graded);
    setDebriefFilter(firstWrong ? 'wrong' : 'all');
    setActiveDebriefQid(firstWrong?.qid ?? graded.results[0]?.qid ?? null);
    if (graded.mode === 'training') {
      playSfx(graded.correctCount >= Math.ceil(graded.totalQuestions * 0.7) ? 'correct' : 'flip');
    }
  }, []);

  // Exam Review 30s countdown -> auto-grade when 0
  useEffect(() => {
    if (!session || session.phase !== 'review') return;
    const id = window.setInterval(() => {
      setReviewRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          playSfx('countdownEnd', { examMode: true });
          handleGradeAndEnterDebrief();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [session?.phase, handleGradeAndEnterDebrief]);

  const handleRequestSubmit = useCallback(() => {
    if (!session) return;
    const audioEnded = trackState.status === 'ended';
    const check = canSubmitNow(session, audioEnded, reviewRemaining);
    if (!check.allowed) return;
    if (check.needsConfirmation) {
      setShowConfirmEarlyModal(true);
      return;
    }
    handleGradeAndEnterDebrief();
  }, [session, trackState.status, reviewRemaining, handleGradeAndEnterDebrief]);

  const handleFinishDebrief = useCallback(async () => {
    if (!session || session.phase !== 'debrief') return;
    playerRef.current?.pause();
    const endedAt = Date.now();
    const { state: recapState } = finishDebrief(session, endedAt);
    setSession(recapState);
    playSfx('sessionDone');

    if (!savedOnceRef.current) {
      savedOnceRef.current = true;
      setSavingSession(true);
      try {
        const saveOpts = {
          simulatedMode: trackStateRef.current.simulatedMode,
          audioMissing: trackStateRef.current.status === 'audio_missing',
        };
        const payload = buildL1SessionSavePayload(recapState, endedAt, saveOpts);
        if (attemptIdRef.current !== null) {
          await attemptRepo.finalize(attemptIdRef.current, payload);
        } else {
          const saved = await attemptRepo.saveSession(payload);
          attemptIdRef.current = saved.attemptId;
        }

        // B6 / PP-11: Producer ghi userItems + thẻ SRS cho các bẫy L1 kèm audioClip chính xác
        const userItemDrafts = buildL1UserItems(recapState, saveOpts);
        for (const draft of userItemDrafts) {
          await userItemRepo.upsertWithCard(draft.item, draft.cardFace, {
            now: new Date(endedAt),
            cardSource: 'listening_trap',
          });
        }

        // L1-09: đánh dấu episode đã hoàn thành Exam để lần 2 không tính band nữa
        if (payload.bandEvidence && payload.bandEvidence.length > 0) {
          const nextDone = Array.from(new Set([...examDoneIds, recapState.episode.id]));
          await db.kv.put({ key: KV_EXAM_DONE_KEY, value: nextDone });
          setExamDoneIds(nextDone);
        }
      } catch {
        // Persist best-effort even if IndexedDB is unavailable in restricted browser mode
      } finally {
        setSavingSession(false);
      }
    }
  }, [session, examDoneIds]);

  const handleReplaySegment = useCallback(
    (startSec: number, endSec: number, label: string) => {
      const player = playerRef.current;
      if (!player) return;
      player.setExamLocked(false);
      void player.playSegment(startSec, endSec, label);
    },
    [],
  );

  // Derived data for active session
  const flatQuestions = useMemo(
    () => (session ? flattenEpisodeQuestions(session.episode) : []),
    [session],
  );

  const lineTimings = useMemo(
    () => (session ? resolveScriptTimings(session.episode) : {}),
    [session],
  );

  const activeSignpostQid = useMemo(
    () => (session ? getActiveSignpostQid(session, trackState.currentTime) : null),
    [session, trackState.currentTime],
  );

  const navItems: QuestionNavItem[] = useMemo(() => {
    if (!session) return [];
    const resultMap = new Map(session.results.map((r) => [r.qid, r]));
    return flatQuestions.map(({ question }) => {
      const ans = (session.answers[question.qid] ?? '').trim();
      const graded = resultMap.get(question.qid);
      return {
        qid: question.qid,
        number: question.number,
        answered: ans.length > 0,
        flagged: session.flaggedQids.includes(question.qid),
        result: graded ? (graded.correct ? 'correct' : 'wrong') : null,
      };
    });
  }, [session, flatQuestions]);

  const waveformMarkers: WaveformMarker[] = useMemo(() => {
    if (!session || session.phase !== 'debrief') return [];
    const out: WaveformMarker[] = [];
    for (const r of session.results) {
      out.push({
        id: `ev-${r.qid}`,
        kind: 'evidence',
        startSec: r.evidence.start,
        endSec: r.evidence.end,
        label: `Q${r.number} Đáp án (${r.acceptedAnswers[0] ?? ''})`,
        qid: r.qid,
      });
      if (r.primaryTrapClip) {
        out.push({
          id: `tr-${r.qid}`,
          kind: 'trap',
          startSec: r.primaryTrapClip.start,
          endSec: r.primaryTrapClip.end,
          label: `Q${r.number} Bẫy ${r.primaryTrap ?? ''}`,
          qid: r.qid,
        });
      }
    }
    return out;
  }, [session]);

  const filteredCatalog = useMemo(() => {
    if (partFilter === 'all') return catalog;
    return catalog.filter((ep) => ep.part === partFilter);
  }, [catalog, partFilter]);

  // ---------------------------------------------------------------------------
  // VIEW 0: EPISODE PICKER
  // ---------------------------------------------------------------------------
  if (!session) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6" data-testid="l1-episode-picker">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => onExit()}
            >
              Quay lại
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Pill tone="listening" icon={<Headphones className="w-3.5 h-3.5" />}>
                  L1 · Trap Detector
                </Pill>
                <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Part 1–4 · Bắt bẫy &amp; tua lại đúng đoạn
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
                Chọn bài nghe IELTS Academic
              </h1>
            </div>
          </div>

          {/* Mode switch: Training vs Exam */}
          <div
            className="inline-flex items-center rounded-[var(--radius-md)] border p-1 gap-1"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
            }}
            role="group"
            aria-label="Chế độ luyện nghe"
          >
            <button
              type="button"
              onClick={() => setSelectedMode('training')}
              data-testid="l1-mode-training"
              className="min-h-[44px] px-3.5 rounded-[var(--radius-sm)] text-sm font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor:
                  selectedMode === 'training' ? 'var(--color-listening)' : 'transparent',
                color: selectedMode === 'training' ? 'var(--color-bg)' : 'var(--color-text-dim)',
              }}
            >
              Training
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('exam')}
              data-testid="l1-mode-exam"
              className="min-h-[44px] px-3.5 rounded-[var(--radius-sm)] text-sm font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor:
                  selectedMode === 'exam' ? 'var(--color-text)' : 'transparent',
                color: selectedMode === 'exam' ? 'var(--color-bg)' : 'var(--color-text-dim)',
              }}
            >
              Exam (tính band)
            </button>
          </div>
        </div>

        {/* Mode explanation & Training level slider */}
        <Card padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 motion-safe:animate-pulse"
                style={{ backgroundColor: 'var(--color-listening)' }}
                aria-hidden="true"
              />
              <span>
                {selectedMode === 'exam'
                  ? 'Exam Mode: Nghe 1 lần duy nhất · Khóa tua/dừng · Có 30s soát bài · Tính Band Listening'
                  : `Training Mode (Cấp ${selectedLevel}/10): ${
                      selectedLevel <= 2
                        ? 'Tốc độ 0.9× mặc định, có tín hiệu câu hỏi & đoán trước loại đáp án'
                        : selectedLevel <= 4
                          ? 'Tốc độ 1.0×, còn tín hiệu câu hỏi & đoán trước loại đáp án'
                          : selectedLevel <= 6
                            ? 'Tốc độ 1.0×, tắt tín hiệu, vẫn được dừng/tua 5s'
                            : selectedLevel <= 8
                              ? 'Không dừng, luyện bám mạch liên tục'
                              : 'Giống Exam (khóa tua/dừng) nhưng không ảnh hưởng Band'
                    }`}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Sau khi nộp bài, Debrief mở dạng sóng xanh/đỏ, highlight transcript và +5 XP khi bạn tự gắn đúng nhãn bẫy.
            </p>
          </div>

          {selectedMode === 'training' && (
            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="l1-level-range"
                className="text-xs font-medium whitespace-nowrap"
                style={{ color: 'var(--color-text-dim)' }}
              >
                Cấp độ:
              </label>
              <input
                id="l1-level-range"
                type="range"
                min={1}
                max={10}
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                className="w-28 min-h-[44px] appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[var(--color-surface-2)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-listening)]"
              />
              <span
                className="text-xs font-bold tabular-nums w-6 text-right"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-listening)' }}
              >
                {selectedLevel}
              </span>
            </div>
          )}
        </Card>

        {episodeError && (
          <Card
            padding="md"
            className="flex flex-wrap items-center justify-between gap-3 border"
            style={{
              borderColor: 'var(--color-wrong)',
              backgroundColor: 'color-mix(in srgb, var(--color-wrong) 10%, var(--color-surface))',
            }}
            data-testid="l1-episode-error"
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-wrong)' }} />
              <span>{episodeError}</span>
            </div>
            {lastTriedItem && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => void startEpisode(lastTriedItem)}
              >
                Thử lại
              </Button>
            )}
          </Card>
        )}

        {/* Part Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 1, 2, 3, 4] as const).map((p) => {
            const active = partFilter === p;
            return (
              <button
                key={String(p)}
                type="button"
                onClick={() => setPartFilter(p)}
                className="min-h-[44px] min-w-[44px] px-3.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-listening) 16%, var(--color-surface))'
                    : 'var(--color-surface)',
                  borderColor: active ? 'var(--color-listening)' : 'var(--color-border)',
                  color: active ? 'var(--color-text)' : 'var(--color-text-dim)',
                }}
              >
                {p === 'all' ? `Tất cả (${catalog.length})` : `Part ${p}`}
              </button>
            );
          })}
        </div>

        {/* Episode grid */}
        {loadingCatalog ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} padding="md" className="h-40 animate-pulse">
                <div className="h-4 w-1/3 rounded" style={{ backgroundColor: 'var(--color-surface-2)' }} />
              </Card>
            ))}
          </div>
        ) : catalogError ? (
          <Card padding="md" className="text-center space-y-3" data-testid="l1-catalog-error">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-wrong)' }}>
              {catalogError}
            </p>
            <Button variant="secondary" size="sm" onClick={reloadCatalog}>
              Tải lại danh sách
            </Button>
          </Card>
        ) : filteredCatalog.length === 0 ? (
          <Card padding="md" className="text-center space-y-2" data-testid="l1-catalog-empty">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Chưa có bài nghe nào có sẵn file MP3 trong bộ lọc này.
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Các bài chưa có audio thật đã được ẩn để đảm bảo luyện nghe đúng chuẩn.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.map((item) => {
              const doneExam = examDoneIds.includes(item.id);
              return (
              <Card
                key={item.id}
                padding="md"
                className="flex flex-col justify-between gap-4 border-l-4"
                style={{ borderLeftColor: 'var(--color-listening)' }}
                data-testid={`l1-episode-card-${item.id}`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Pill tone="listening">{PART_LABELS[item.part]}</Pill>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedMode === 'exam' && doneExam && (
                        <Pill tone="partial" data-testid={`l1-exam-done-${item.id}`}>
                          Đã làm Exam
                        </Pill>
                      )}
                      {item.hasMap && (
                        <Pill tone="info" icon={<MapIcon className="w-3 h-3" />}>
                          Bản đồ SVG
                        </Pill>
                      )}
                      <Pill tone="neutral">Độ khó {item.difficulty}/10</Pill>
                    </div>
                  </div>

                  <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                    {item.title}
                  </h2>
                  {item.contextEn && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                      {item.contextEn}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div
                    className="flex items-center gap-3 text-xs tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                  >
                    <span>{item.questionCount} câu</span>
                    <span>{formatTrackTime(item.durationSec)}</span>
                    <span>{item.accents.map((a) => a.toUpperCase()).join('/')}</span>
                  </div>

                  <Button
                    variant="primary"
                    skill={selectedMode === 'exam' ? 'exam' : 'listening'}
                    size="sm"
                    loading={loadingEpisode}
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={() => void startEpisode(item)}
                    data-testid={`l1-start-${item.id}`}
                  >
                    Bắt đầu
                  </Button>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 5: RECAP SCREEN
  // ---------------------------------------------------------------------------
  if (session.phase === 'recap') {
    const durationSec = Math.max(
      1,
      Math.round(((session.endedAt ?? Date.now()) - session.startedAt) / 1000),
    );
    const accuracyPercent =
      session.totalQuestions > 0
        ? Math.round((session.correctCount / session.totalQuestions) * 100)
        : 0;
    const mistakes: RecapMistakeItem[] = session.results
      .filter((r) => !r.correct)
      .map((r) => ({
        id: r.qid,
        prompt: `Q${r.number}. ${r.prompt.split('\n')[0]}`,
        userAnswer: r.userAnswer || '(bỏ trống)',
        correctAnswer: r.acceptedAnswers.join(' / '),
        note: `${formatErrorBadge(r.errorCategory)}${r.explanationVi ? ` — ${r.explanationVi}` : ''}`,
      }));

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4" data-testid="l1-recap">
        <RecapScreen
          scoreLabel={`${session.correctCount}/${session.totalQuestions}`}
          xpEarned={session.totalXp}
          winStatement={buildL1WinStatement(session)}
          accuracyPercent={accuracyPercent}
          durationSec={durationSec}
          mistakes={mistakes}
          onRetryMistakes={
            mistakes.length > 0
              ? () => {
                  savedOnceRef.current = false;
                  attemptIdRef.current = null;
                  // L1-08: chỉ ôn câu sai, nghe lại đúng đoạn bẫy/đáp án, 0 XP, 0 band
                  const restarted = createL1RetrySession(session);
                  setSession(restarted);
                  setPreviewRemaining(0);
                  setReviewRemaining(0);
                  playerRef.current?.load(session.episode.audio.path, {
                    durationHintSec: session.episode.audio.durationSec,
                    examLocked: false,
                  });
                }
              : undefined
          }
          onGoToday={() =>
            onExit({
              gameId: 'l1',
              mode: session.mode,
              score: session.correctCount,
              total: session.totalQuestions,
              xp: session.totalXp,
            })
          }
        />
        {savingSession && (
          <p className="text-center text-xs" style={{ color: 'var(--color-text-dim)' }}>
            Đang lưu kết quả và thẻ SRS...
          </p>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // HELPER: RENDER QUESTION GROUP (USED IN PREVIEW, LISTENING, REVIEW)
  // ---------------------------------------------------------------------------
  const isExamSurface = session.mode === 'exam' && session.phase !== 'debrief';
  const isEditable = session.phase === 'listening' || session.phase === 'review';

  const renderQuestionGroup = (group: ListeningQuestionGroup) => {
    // 1. MAP LABELLING
    if (group.type === 'map_labelling' && group.map) {
      const activeQuestion =
        group.questions.find((q) => q.qid === session.currentQid) ?? group.questions[0];
      const assignedSlots: Record<string, AssignedMapSlotInfo> = {};
      for (const q of group.questions) {
        const letter = (session.answers[q.qid] ?? '').trim().toUpperCase();
        if (letter) {
          assignedSlots[letter] = {
            questionNumber: q.number,
            label: q.prompt,
          };
        }
      }
      const selectedSlotKey = activeQuestion
        ? (session.answers[activeQuestion.qid] ?? '').trim().toUpperCase() || null
        : null;

      return (
        <Card key={group.groupId} padding="md" className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              {group.instructions}
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              Chọn câu bên phải rồi bấm trực tiếp chữ cái trên bản đồ (hoặc chọn từ danh sách chữ cái).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7">
              <MapView
                spec={group.map}
                selectedKey={selectedSlotKey}
                assignedSlots={assignedSlots}
                interactive={isEditable}
                onSelectSlot={(slotKey) => {
                  if (!isEditable || !activeQuestion) return;
                  playSfx('tap');
                  setSession((prev) => (prev ? setAnswer(prev, activeQuestion.qid, slotKey) : prev));
                }}
              />
            </div>

            <div className="lg:col-span-5 space-y-2.5">
              {group.questions.map((q) => {
                const isActive = q.qid === activeQuestion?.qid;
                const isSignpost = activeSignpostQid === q.qid;
                const val = (session.answers[q.qid] ?? '').trim().toUpperCase();
                return (
                  <div
                    key={q.qid}
                    onClick={() => setSession((prev) => (prev ? setCurrentQid(prev, q.qid) : prev))}
                    className="p-3 rounded-[var(--radius-md)] border transition-colors cursor-pointer"
                    style={{
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--color-listening) 10%, var(--color-surface))'
                        : 'var(--color-surface-2)',
                      borderColor: isSignpost
                        ? 'var(--color-listening)'
                        : isActive
                          ? 'var(--color-listening)'
                          : 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        <span
                          className="mr-1.5 font-bold tabular-nums"
                          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-listening)' }}
                        >
                          {q.number}.
                        </span>
                        {q.prompt}
                      </span>

                      <select
                        aria-label={`Chọn vị trí bản đồ cho câu ${q.number}`}
                        disabled={!isEditable}
                        value={val}
                        onChange={(e) => {
                          setSession((prev) =>
                            prev ? setAnswer(setCurrentQid(prev, q.qid), q.qid, e.target.value) : prev,
                          );
                        }}
                        className="min-w-[56px] min-h-[44px] px-3 rounded-[var(--radius-sm)] border text-sm font-bold cursor-pointer appearance-none text-center"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text)',
                        }}
                      >
                        <option value="">—</option>
                        {group.map?.slots.map((slot) => (
                          <option key={slot.key} value={slot.key.toUpperCase()}>
                            {slot.key.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      );
    }

    // 2. FORM COMPLETION WITH TEMPLATE
    if (group.type === 'form_completion' && group.template) {
      const qById = new Map(group.questions.map((q) => [q.qid, q]));
      return (
        <Card key={group.groupId} padding="md" className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              {group.instructions}
            </div>
          </div>

          <div
            className="rounded-[var(--radius-md)] border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div
              className="px-4 py-2.5 border-b text-sm font-bold tracking-wide"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {group.template.title}
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {group.template.rows.map((row, idx) => {
                const q = row.blankQid ? qById.get(row.blankQid) : undefined;
                const isSignpost = q ? activeSignpostQid === q.qid : false;

                return (
                  <div
                    key={`${group.groupId}-row-${idx}`}
                    className="px-4 py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center"
                    style={{
                      backgroundColor: isSignpost
                        ? 'color-mix(in srgb, var(--color-listening) 8%, var(--color-surface))'
                        : 'var(--color-surface)',
                    }}
                  >
                    <div className="sm:col-span-4 text-sm font-medium" style={{ color: 'var(--color-text-dim)' }}>
                      {row.label}
                    </div>
                    <div className="sm:col-span-8 space-y-2">
                      {q ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] text-xs font-bold tabular-nums shrink-0"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              backgroundColor: 'var(--color-surface-2)',
                              color: 'var(--color-listening)',
                            }}
                          >
                            {q.number}
                          </span>
                          {row.value && (
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                              {row.value}
                            </span>
                          )}
                          <div className="flex-1 min-w-[160px]">
                            <AnswerInput
                              value={session.answers[q.qid] ?? ''}
                              disabled={!isEditable}
                              wordLimit={group.wordLimit?.words}
                              hideWordCount={isExamSurface}
                              aria-label={`Câu ${q.number}: ${row.label}`}
                              placeholder={
                                session.phase === 'preview'
                                  ? 'Đọc trước câu hỏi...'
                                  : `Đáp án câu ${q.number}...`
                              }
                              onFocus={() =>
                                setSession((prev) => (prev ? setCurrentQid(prev, q.qid) : prev))
                              }
                              onChange={(val) =>
                                setSession((prev) => (prev ? setAnswer(prev, q.qid, val) : prev))
                              }
                              data-testid={`l1-input-${q.number}`}
                            />
                          </div>
                          {row.suffix && (
                            <span className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                              {row.suffix}
                            </span>
                          )}
                          {session.isRetry && session.retryClipMap[q.qid] && (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Play className="w-3.5 h-3.5" />}
                              onClick={() => {
                                const clip = session.retryClipMap[q.qid];
                                handleReplaySegment(clip.start, clip.end, `Ôn câu ${q.number}`);
                              }}
                              data-testid={`l1-retry-play-clip-${q.number}`}
                            >
                              Nghe đoạn ({formatTrackTime(session.retryClipMap[q.qid].start)}–
                              {formatTrackTime(session.retryClipMap[q.qid].end)})
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                          {row.value} {row.suffix}
                        </span>
                      )}

                      {/* Training Preview: Prediction chips */}
                      {q && session.phase === 'preview' && session.config.allowPredictions && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                            Đoán loại từ:
                          </span>
                          {PREDICTION_OPTIONS.map((opt) => {
                            const selected = session.predictions[q.qid] === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setSession((prev) =>
                                    prev
                                      ? setPrediction(prev, q.qid, selected ? null : opt.id)
                                      : prev,
                                  )
                                }
                                data-testid={`l1-pred-${q.number}-${opt.id}`}
                                className="min-h-[44px] min-w-[44px] px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors"
                                style={{
                                  backgroundColor: selected
                                    ? 'color-mix(in srgb, var(--color-listening) 18%, var(--color-surface))'
                                    : 'var(--color-surface-2)',
                                  borderColor: selected
                                    ? 'var(--color-listening)'
                                    : 'var(--color-border)',
                                  color: selected ? 'var(--color-text)' : 'var(--color-text-dim)',
                                }}
                              >
                                {opt.labelVi}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      );
    }

    // 3. PAIRED MCQ MULTI (e.g., Questions 9 & 10: Choose TWO letters A–E)
    if (isPairedMcqMultiGroup(group)) {
      const firstQ = group.questions[0];
      const maxSelect = group.questions.length;
      const selectedKeys = getSelectedMultiKeys(session, group, firstQ.qid);
      const options = group.options ?? [];

      return (
        <Card key={group.groupId} padding="md" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              {group.instructions}
            </div>
            <Pill tone="listening">
              Đã chọn {selectedKeys.length}/{maxSelect}
            </Pill>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt) => {
              const keyUpper = opt.key.toUpperCase();
              const isSelected = selectedKeys.includes(keyUpper);
              return (
                <ChoiceButton
                  key={keyUpper}
                  indexLabel={keyUpper}
                  label={opt.text}
                  disabled={!isEditable || (!isSelected && selectedKeys.length >= maxSelect)}
                  state={isSelected ? 'selected' : 'idle'}
                  onClick={() => {
                    if (!isEditable) return;
                    playSfx('tap');
                    setSession((prev) =>
                      prev ? toggleMcqMultiChoice(prev, group.groupId, firstQ.qid, keyUpper) : prev,
                    );
                  }}
                />
              );
            })}
          </div>
        </Card>
      );
    }

    // 4. MCQ SINGLE / MATCHING / STANDALONE MCQ MULTI / COMPLETION FALLBACK
    const isChoiceGroup =
      group.type === 'mcq_single' ||
      group.type === 'mcq_multi' ||
      group.type === 'matching' ||
      group.type === 'map_labelling' ||
      group.type === 'diagram_labelling';

    return (
      <Card key={group.groupId} padding="md" className="space-y-4">
        <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
          {group.instructions}
        </div>

        <div className="space-y-4">
          {group.questions.map((q) => {
            const isSignpost = activeSignpostQid === q.qid;

            if (isChoiceGroup) {
              const { stem, options } = extractQuestionOptions(q, group);
              const isMulti = group.type === 'mcq_multi';
              const selectedMulti = isMulti ? getSelectedMultiKeys(session, group, q.qid) : [];
              const selectedSingle = (session.answers[q.qid] ?? '').trim().toUpperCase();

              return (
                <div
                  key={q.qid}
                  className="p-3.5 rounded-[var(--radius-md)] border space-y-2.5"
                  style={{
                    backgroundColor: isSignpost
                      ? 'color-mix(in srgb, var(--color-listening) 8%, var(--color-surface))'
                      : 'var(--color-surface-2)',
                    borderColor: isSignpost ? 'var(--color-listening)' : 'var(--color-border)',
                  }}
                >
                  <div className="text-sm sm:text-base font-medium" style={{ color: 'var(--color-text)' }}>
                    <span
                      className="mr-2 font-bold tabular-nums"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-listening)' }}
                    >
                      Q{q.number}.
                    </span>
                    {stem}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {options.map((opt) => {
                      const k = opt.key.toUpperCase();
                      const chosen = isMulti ? selectedMulti.includes(k) : selectedSingle === k;
                      return (
                        <ChoiceButton
                          key={k}
                          indexLabel={k}
                          label={opt.text}
                          disabled={!isEditable}
                          state={chosen ? 'selected' : 'idle'}
                          onClick={() => {
                            if (!isEditable) return;
                            playSfx('tap');
                            setSession((prev) => {
                              if (!prev) return prev;
                              const focused = setCurrentQid(prev, q.qid);
                              return isMulti
                                ? toggleMcqMultiChoice(focused, group.groupId, q.qid, k)
                                : setAnswer(focused, q.qid, k);
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Completion types: note_completion, table_completion, summary_completion, sentence_completion, flowchart, short_answer
            return (
              <div
                key={q.qid}
                className="p-3.5 rounded-[var(--radius-md)] border space-y-2"
                style={{
                  backgroundColor: isSignpost
                    ? 'color-mix(in srgb, var(--color-listening) 8%, var(--color-surface))'
                    : 'var(--color-surface-2)',
                  borderColor: isSignpost ? 'var(--color-listening)' : 'var(--color-border)',
                }}
              >
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  <span
                    className="mr-2 font-bold tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-listening)' }}
                  >
                    Q{q.number}.
                  </span>
                  {q.prompt}
                </div>
                <AnswerInput
                  value={session.answers[q.qid] ?? ''}
                  disabled={!isEditable}
                  wordLimit={group.wordLimit?.words}
                  hideWordCount={isExamSurface}
                  aria-label={`Câu ${q.number}: ${q.prompt}`}
                  placeholder={
                    session.phase === 'preview' ? 'Đọc trước câu hỏi...' : `Nhập đáp án câu ${q.number}...`
                  }
                  onFocus={() => setSession((prev) => (prev ? setCurrentQid(prev, q.qid) : prev))}
                  onChange={(val) =>
                    setSession((prev) => (prev ? setAnswer(prev, q.qid, val) : prev))
                  }
                  data-testid={`l1-input-${q.number}`}
                />
                {session.isRetry && session.retryClipMap[q.qid] && (
                  <div className="pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Play className="w-3.5 h-3.5" />}
                      onClick={() => {
                        const clip = session.retryClipMap[q.qid];
                        handleReplaySegment(clip.start, clip.end, `Ôn câu ${q.number}`);
                      }}
                      data-testid={`l1-retry-play-clip-${q.number}`}
                    >
                      Nghe đoạn câu {q.number} ({formatTrackTime(session.retryClipMap[q.qid].start)}–
                      {formatTrackTime(session.retryClipMap[q.qid].end)})
                    </Button>
                  </div>
                )}
                {session.phase === 'preview' && session.config.allowPredictions && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      Đoán loại từ:
                    </span>
                    {PREDICTION_OPTIONS.map((opt) => {
                      const selected = session.predictions[q.qid] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setSession((prev) =>
                              prev ? setPrediction(prev, q.qid, selected ? null : opt.id) : prev,
                            )
                          }
                          className="min-h-[44px] min-w-[44px] px-3 py-1 rounded-full border text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: selected
                              ? 'color-mix(in srgb, var(--color-listening) 18%, var(--color-surface))'
                              : 'var(--color-surface)',
                            borderColor: selected ? 'var(--color-listening)' : 'var(--color-border)',
                            color: selected ? 'var(--color-text)' : 'var(--color-text-dim)',
                          }}
                        >
                          {opt.labelVi}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  // ---------------------------------------------------------------------------
  // VIEW 4: DEBRIEF PHASE
  // ---------------------------------------------------------------------------
  if (session.phase === 'debrief') {
    const displayedResults =
      debriefFilter === 'wrong'
        ? session.results.filter((r) => !r.correct)
        : session.results;
    const focusedResult =
      session.results.find((r) => r.qid === activeDebriefQid) ??
      displayedResults[0] ??
      session.results[0];

    const evidenceLineIds = new Set(
      focusedResult ? [focusedResult.evidence.lineId] : [],
    );
    const trapLineIds = new Set(
      focusedResult?.primaryTrapClip ? [focusedResult.primaryTrapClip.lineId] : [],
    );

    const speakerMap = new Map(session.episode.speakers.map((s) => [s.id, s]));

    return (
      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5" data-testid="l1-debrief">
        {/* Debrief Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="listening">Debrief · Phân tích bẫy</Pill>
              <Pill
                tone={
                  session.totalQuestions > 0 && session.correctCount / session.totalQuestions >= 0.8
                    ? 'correct'
                    : 'partial'
                }
              >
                {session.correctCount}/{session.totalQuestions} đúng
              </Pill>
              <Pill tone="info" icon={<Sparkles className="w-3 h-3" />}>
                +{session.totalXp} XP
              </Pill>
              {session.isRetry && (
                <Pill tone="neutral">Ôn câu sai · 0 XP</Pill>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>
              {session.episode.title}
            </h1>
          </div>

          <Button
            variant="primary"
            skill="listening"
            onClick={() => void handleFinishDebrief()}
            data-testid="l1-finish-debrief-btn"
          >
            Hoàn tất &amp; xem Recap
          </Button>
        </div>

        {/* Unlocked TrackPlayer + Interactive Waveform with green evidence & red trap regions */}
        <Card padding="md" className="space-y-3">
          <TrackPlayer
            status={trackState.status}
            currentTime={trackState.currentTime}
            duration={trackState.duration || session.episode.audio.durationSec}
            rate={trackState.rate}
            volume={trackState.volume}
            muted={trackState.muted}
            examMode={false}
            activeSegmentLabel={trackState.activeSegment?.label ?? null}
            simulatedMode={trackState.simulatedMode}
            autoplayBlocked={trackState.autoplayBlocked}
            onPlay={() => {
              playerRef.current?.unlock();
              void playerRef.current?.play();
            }}
            onPause={() => playerRef.current?.pause()}
            onSeek={(sec) => playerRef.current?.seek(sec)}
            onRewind={(s) => playerRef.current?.rewind(s)}
            onRateChange={(r: PlaybackRate) => playerRef.current?.setRate(r)}
            onVolumeChange={(v) => playerRef.current?.setVolume(v)}
            onToggleMute={() => playerRef.current?.setMuted(!trackState.muted)}
          />

          <Waveform
            seed={session.episode.id}
            durationSec={trackState.duration || session.episode.audio.durationSec}
            currentTimeSec={trackState.currentTime}
            markers={waveformMarkers}
            showMarkers={true}
            interactive={true}
            onSeek={(sec) => playerRef.current?.seek(sec)}
            onSelectMarker={(marker) => {
              if (marker.qid) setActiveDebriefQid(marker.qid);
              handleReplaySegment(marker.startSec, marker.endSec, marker.label ?? marker.kind);
            }}
          />
        </Card>

        {/* Main 2-column Debrief split: Questions on left, Highlighted Transcript on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Question cards + trap self-labeling */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDebriefFilter('wrong')}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor:
                      debriefFilter === 'wrong'
                        ? 'color-mix(in srgb, var(--color-wrong) 16%, var(--color-surface))'
                        : 'var(--color-surface)',
                    borderColor:
                      debriefFilter === 'wrong' ? 'var(--color-wrong)' : 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  Chỉ câu sai ({session.results.filter((r) => !r.correct).length})
                </button>
                <button
                  type="button"
                  onClick={() => setDebriefFilter('all')}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor:
                      debriefFilter === 'all'
                        ? 'color-mix(in srgb, var(--color-listening) 16%, var(--color-surface))'
                        : 'var(--color-surface)',
                    borderColor:
                      debriefFilter === 'all' ? 'var(--color-listening)' : 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  Tất cả ({session.results.length})
                </button>
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Gắn đúng nhãn bẫy: +5 XP / câu
              </span>
            </div>

            {displayedResults.length === 0 ? (
              <Card padding="md" className="text-center space-y-2">
                <CheckCircle2
                  className="w-8 h-8 mx-auto"
                  style={{ color: 'var(--color-correct)' }}
                />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Không có câu sai nào! Bạn có thể chuyển sang tab "Tất cả" để nghe lại từng đoạn bẫy.
                </p>
              </Card>
            ) : (
              displayedResults.map((r) => {
                const isFocused = focusedResult?.qid === r.qid;
                const selfLabel = session.selfTrapLabels[r.qid];
                const trapChips = getTrapChoiceChips(r);

                return (
                  <Card
                    key={r.qid}
                    padding="md"
                    className="space-y-3 cursor-pointer"
                    style={{
                      borderColor: isFocused
                        ? 'var(--color-listening)'
                        : r.correct
                          ? 'color-mix(in srgb, var(--color-correct) 40%, var(--color-border))'
                          : 'color-mix(in srgb, var(--color-wrong) 40%, var(--color-border))',
                    }}
                    onClick={() => setActiveDebriefQid(r.qid)}
                    data-testid={`debrief-card-${r.number}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {r.correct ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--color-correct)' }} />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-wrong)' }} />
                        )}
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                          Q{r.number}. {r.prompt.split('\n')[0]}
                        </span>
                      </div>
                      {!r.correct && (
                        <Pill tone="wrong">{formatErrorBadge(r.errorCategory)}</Pill>
                      )}
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-4 text-xs"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      <span style={{ color: r.correct ? 'var(--color-correct)' : 'var(--color-wrong)' }}>
                        Bạn ghi: <strong>{r.userAnswer || '(bỏ trống)'}</strong>
                      </span>
                      <span style={{ color: 'var(--color-correct)' }}>
                        Đáp án: <strong>{r.acceptedAnswers.join(' / ')}</strong>
                      </span>
                    </div>

                    {/* Replay Evidence & Replay Trap buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDebriefQid(r.qid);
                          handleReplaySegment(
                            r.evidence.start,
                            r.evidence.end,
                            `Q${r.number} · Đoạn đáp án`,
                          );
                        }}
                        data-testid={`debrief-play-evidence-${r.number}`}
                      >
                        Nghe đoạn đáp án ({formatTrackTime(r.evidence.start)}–{formatTrackTime(r.evidence.end)})
                      </Button>

                      {r.primaryTrapClip && (
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDebriefQid(r.qid);
                            handleReplaySegment(
                              r.primaryTrapClip!.start,
                              r.primaryTrapClip!.end,
                              `Q${r.number} · Đoạn bẫy`,
                            );
                          }}
                          data-testid={`debrief-play-trap-${r.number}`}
                        >
                          Nghe đoạn bẫy ({formatTrackTime(r.primaryTrapClip.start)}–
                          {formatTrackTime(r.primaryTrapClip.end)})
                        </Button>
                      )}
                    </div>

                    {/* Explanation */}
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                      {r.explanationVi || r.feedbackVi}
                    </p>

                    {/* Metacognition: self-label the trap on wrong answers */}
                    {!r.correct && r.trapTypes.length > 0 && (
                      <div
                        className="pt-2.5 border-t space-y-2"
                        style={{ borderColor: 'var(--color-border)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                          Bạn đã sập loại bẫy nào? (+5 XP khi nhận diện đúng)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {trapChips.map((trap) => {
                            const isChosen = selfLabel?.chosen === trap;
                            const isExpected = Boolean(selfLabel) && r.trapTypes.includes(trap);
                            let borderColor = 'var(--color-border)';
                            let bg = 'var(--color-surface-2)';

                            if (isExpected) {
                              borderColor = 'var(--color-correct)';
                              bg = 'color-mix(in srgb, var(--color-correct) 16%, var(--color-surface))';
                            } else if (isChosen && !selfLabel?.matched) {
                              borderColor = 'var(--color-wrong)';
                              bg = 'color-mix(in srgb, var(--color-wrong) 16%, var(--color-surface))';
                            }

                            return (
                              <button
                                key={trap}
                                type="button"
                                disabled={Boolean(selfLabel)}
                                onClick={() => {
                                  const cur = sessionRef.current;
                                  if (!cur) return;
                                  const res = submitTrapLabel(cur, r.qid, trap);
                                  setSession(res.state);
                                  if (res.events[0]?.matched) {
                                    playSfx('correct');
                                  }
                                }}
                                data-testid={`debrief-trap-chip-${r.number}-${trap}`}
                                className="min-h-[44px] px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer disabled:cursor-default transition-colors"
                                style={{
                                  backgroundColor: bg,
                                  borderColor,
                                  color: 'var(--color-text)',
                                }}
                              >
                                {LISTENING_TRAP_LABELS_VI[trap]}
                              </button>
                            );
                          })}
                        </div>
                        {selfLabel && (
                          <p
                            className="text-xs font-medium"
                            style={{
                              color: selfLabel.matched
                                ? 'var(--color-correct)'
                                : 'var(--color-text-dim)',
                            }}
                          >
                            {selfLabel.matched
                              ? 'Nhận diện chính xác! +5 XP siêu nhận thức.'
                              : `Nhãn bẫy chính của câu này là: ${selfLabel.expected
                                  .map((t) => LISTENING_TRAP_LABELS_VI[t])
                                  .join(', ')}.`}
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          {/* Right: Highlighted Transcript Panel */}
          <Card padding="md" className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                Transcript (Highlight Q{focusedResult?.number ?? 1})
              </h2>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-dim)' }}>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-correct)' }} />
                  Đáp án
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-wrong)' }} />
                  Bẫy
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {session.episode.script.map((line) => {
                const speaker = speakerMap.get(line.speakerId);
                const timing = lineTimings[line.lineId] ?? { start: line.start, end: line.end };
                const isEv = evidenceLineIds.has(line.lineId);
                const isTr = trapLineIds.has(line.lineId);
                const isPlayingNow =
                  trackState.currentTime >= timing.start && trackState.currentTime <= timing.end;

                let bg = 'transparent';
                let border = 'transparent';
                if (isEv) {
                  bg = 'color-mix(in srgb, var(--color-correct) 14%, var(--color-surface))';
                  border = 'var(--color-correct)';
                } else if (isTr) {
                  bg = 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface))';
                  border = 'var(--color-wrong)';
                } else if (isPlayingNow) {
                  bg = 'var(--color-surface-2)';
                }

                return (
                  <button
                    key={line.lineId}
                    type="button"
                    onClick={() =>
                      handleReplaySegment(
                        timing.start,
                        timing.end,
                        `${speaker?.name ?? line.speakerId} (${formatTrackTime(timing.start)})`,
                      )
                    }
                    className="w-full text-left p-2.5 rounded-[var(--radius-sm)] border transition-colors cursor-pointer"
                    style={{
                      backgroundColor: bg,
                      borderColor: border,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className="text-xs font-bold"
                        style={{ color: 'var(--color-listening)' }}
                      >
                        {speaker?.name ?? line.speakerId}
                      </span>
                      <span
                        className="text-xs tabular-nums"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-faint)' }}
                      >
                        {formatTrackTime(timing.start)}–{formatTrackTime(timing.end)}
                      </span>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        fontFamily: 'var(--font-reading)',
                        color: 'var(--color-text)',
                      }}
                    >
                      {line.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEWS 1–3: PREVIEW / LISTENING / EXAM REVIEW
  // ---------------------------------------------------------------------------
  const submitCheck = canSubmitNow(session, trackState.status === 'ended', reviewRemaining);
  const predictionEntries = Object.entries(session.predictions);

  return (
    <div
      data-mode={isExamSurface ? 'exam' : undefined}
      data-theme={isExamSurface ? 'exam' : undefined}
      className="min-h-[calc(100vh-56px)] flex flex-col"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
      data-testid="l1-active-session"
    >
      {/* Top Session Header */}
      <header
        className="px-4 py-3 border-b sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-6xl mx-auto space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => {
                  if (session.mode === 'exam' && session.phase !== 'debrief') {
                    setShowConfirmExitExamModal(true);
                    return;
                  }
                  playerRef.current?.pause();
                  setSession(null);
                }}
                data-testid="l1-change-episode-btn"
              >
                Đổi bài
              </Button>
              <Pill tone={isExamSurface ? 'exam' : 'listening'}>
                Part {session.episode.part} ·{' '}
                {session.isRetry
                  ? 'Ôn câu sai'
                  : session.mode === 'exam'
                    ? session.alreadyDoneExam
                      ? 'Exam (làm lại · 0 band)'
                      : 'Exam'
                    : `Cấp ${session.level}`}
              </Pill>
              <h1 className="text-sm sm:text-base font-bold truncate" style={{ color: 'var(--color-text)' }}>
                {session.episode.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {session.phase === 'preview' && (
                <>
                  <Timer
                    remainingSec={previewRemaining}
                    totalSec={session.config.previewSec}
                    examMode={isExamSurface}
                    size="sm"
                  />
                  <Button
                    variant="primary"
                    skill={isExamSurface ? 'exam' : 'listening'}
                    size="sm"
                    disabled={
                      trackState.status === 'audio_missing' ||
                      trackState.simulatedMode ||
                      (session.mode === 'exam' && trackState.status !== 'ready')
                    }
                    leftIcon={<Volume2 className="w-4 h-4" />}
                    onClick={handleBeginListening}
                    data-testid="l1-start-listening-btn"
                  >
                    {session.mode === 'exam' && trackState.status === 'loading'
                      ? 'Đang tải audio...'
                      : 'Bắt đầu nghe'}
                  </Button>
                </>
              )}

              {session.phase === 'review' && (
                <Timer
                  remainingSec={reviewRemaining}
                  totalSec={session.config.reviewSec}
                  examMode={true}
                  size="sm"
                />
              )}

              {(session.phase === 'listening' || session.phase === 'review') && (
                <Button
                  variant="primary"
                  skill={isExamSurface ? 'exam' : 'listening'}
                  size="sm"
                  disabled={!submitCheck.allowed}
                  title={submitCheck.reasonVi}
                  onClick={handleRequestSubmit}
                  data-testid="l1-submit-btn"
                >
                  Nộp bài
                </Button>
              )}
            </div>
          </div>

          {session.phase !== 'preview' && (
            <TrackPlayer
              status={trackState.status}
              currentTime={trackState.currentTime}
              duration={trackState.duration || session.episode.audio.durationSec}
              rate={trackState.rate}
              volume={trackState.volume}
              muted={trackState.muted}
              examMode={session.config.examLocked}
              disablePause={!session.config.allowPause}
              simulatedMode={trackState.simulatedMode}
              autoplayBlocked={trackState.autoplayBlocked}
              onPlay={() => {
                playerRef.current?.unlock();
                void playerRef.current?.play();
              }}
              onPause={() => playerRef.current?.pause()}
              onSeek={
                session.config.allowSeek ? (sec) => playerRef.current?.seek(sec) : undefined
              }
              onRewind={
                session.config.allowRewind ? (s) => playerRef.current?.rewind(s) : undefined
              }
              onRateChange={
                session.config.allowRateChange
                  ? (r: PlaybackRate) => playerRef.current?.setRate(r)
                  : undefined
              }
              onVolumeChange={(v) => playerRef.current?.setVolume(v)}
              onToggleMute={() => playerRef.current?.setMuted(!trackState.muted)}
              onRetryLoad={() => {
                playerRef.current?.load(session.episode.audio.path, {
                  durationHintSec: session.episode.audio.durationSec,
                  examLocked: session.config.examLocked,
                });
              }}
            />
          )}
        </div>
      </header>

      {/* Banners */}
      <div className="max-w-6xl w-full mx-auto px-4 pt-4 space-y-3">
        {session.phase === 'preview' && (
          <div
            className="p-3.5 rounded-[var(--radius-md)] border text-sm flex flex-wrap items-center justify-between gap-2"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-listening) 10%, var(--color-surface))',
              borderColor: 'color-mix(in srgb, var(--color-listening) 35%, var(--color-border))',
            }}
            data-testid="l1-preview-banner"
          >
            <div>
              <strong>Pha 1 · Đọc trước câu hỏi (30s):</strong>{' '}
              {session.config.allowPredictions
                ? 'Đọc lướt câu hỏi và bấm chip đoán loại đáp án (số, ngày, tên, danh từ số nhiều...) trước khi audio chạy.'
                : 'Đọc nhanh toàn bộ câu hỏi. Audio sẽ tự chạy khi hết 30 giây và chỉ phát 1 lần.'}
            </div>
          </div>
        )}

        {session.phase === 'review' && (
          <div
            className="p-3.5 rounded-[var(--radius-md)] border text-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-partial) 12%, var(--color-surface))',
              borderColor: 'var(--color-partial)',
            }}
            data-testid="l1-review-banner"
          >
            <strong>Pha 3 · Soát lại đáp án (30s):</strong> Kiểm tra chính tả, số nhiều (-s) và giới hạn từ trước khi hệ thống tự động nộp bài.
          </div>
        )}

        {trackState.status === 'audio_missing' && (
          <div
            className="p-3.5 rounded-[var(--radius-md)] border text-sm flex flex-wrap items-center justify-between gap-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-wrong) 12%, var(--color-surface))',
              borderColor: 'var(--color-wrong)',
            }}
            data-testid="l1-audio-missing-banner"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-wrong)' }} />
              <span>Không tải được file MP3 của bài nghe này. Không thể bắt đầu phiên khi thiếu âm thanh.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => {
                  playerRef.current?.load(session.episode.audio.path, {
                    durationHintSec: session.episode.audio.durationSec,
                    examLocked: session.config.examLocked,
                  });
                }}
              >
                Thử tải lại MP3
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  playerRef.current?.pause();
                  setSession(null);
                }}
              >
                Đổi bài khác
              </Button>
            </div>
          </div>
        )}

        {tabHiddenWarning && (
          <div
            className="p-3 rounded-[var(--radius-md)] border text-xs flex items-center gap-2"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-wrong) 12%, var(--color-surface))',
              borderColor: 'var(--color-wrong)',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-wrong)' }} />
            <span>Bạn vừa chuyển khỏi tab trong lúc Exam đang chạy — audio vẫn tiếp tục phát giống bài thi máy thật.</span>
          </div>
        )}
      </div>

      {/* Main Content Split */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          {session.episode.questionGroups.map((group) => renderQuestionGroup(group))}
        </div>

        {/* Right Sidebar: Dimmed Waveform & Prediction summary (CẤM kịch bản mô phỏng trong pha nghe/Exam — L1-01, SR-23) */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-28">
          <Card padding="md" className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
              Tiến độ bài nghe
            </div>
            <Waveform
              seed={session.episode.id}
              durationSec={trackState.duration || session.episode.audio.durationSec}
              currentTimeSec={trackState.currentTime}
              showMarkers={false}
              dimmed={true}
              interactive={session.config.allowSeek && session.phase !== 'preview'}
              onSeek={session.config.allowSeek ? (sec) => playerRef.current?.seek(sec) : undefined}
              height={54}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
              {session.episode.contextEn}
            </p>
          </Card>

          {predictionEntries.length > 0 && (
            <Card padding="md" className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
                Dự đoán trước khi nghe
              </div>
              <div className="flex flex-wrap gap-1.5">
                {predictionEntries.map(([qid, pred]) => {
                  const q = flatQuestions.find((f) => f.question.qid === qid)?.question;
                  const label = PREDICTION_OPTIONS.find((p) => p.id === pred)?.labelVi ?? pred;
                  return (
                    <Pill key={qid} tone="listening">
                      Q{q?.number}: {label}
                    </Pill>
                  );
                })}
              </div>
            </Card>
          )}
        </aside>
      </main>

      {/* Bottom QuestionNav */}
      <footer
        className="px-4 py-3 border-t sticky bottom-0 z-10"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <QuestionNav
            items={navItems}
            currentQid={session.currentQid}
            onSelect={(qid) => setSession((prev) => (prev ? setCurrentQid(prev, qid) : prev))}
            onToggleFlag={(qid) => setSession((prev) => (prev ? toggleFlag(prev, qid) : prev))}
          />
        </div>
      </footer>

      {/* Early submit confirmation modal (Training mode only) */}
      <Modal
        open={showConfirmEarlyModal}
        onClose={() => setShowConfirmEarlyModal(false)}
        title="Audio chưa phát xong — nộp bài sớm?"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Bạn vẫn đang nghe dở bài. Nếu nộp ngay bây giờ, hệ thống sẽ chấm các câu bạn đã điền và chuyển sang màn hình Debrief phân tích bẫy.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowConfirmEarlyModal(false)}>
              Nghe tiếp
            </Button>
            <Button variant="primary" skill="listening" onClick={handleGradeAndEnterDebrief}>
              Chấm bài ngay
            </Button>
          </div>
        </div>
      </Modal>
      {/* Exit Exam confirmation modal (L1-09) */}
      <Modal
        open={showConfirmExitExamModal}
        onClose={() => setShowConfirmExitExamModal(false)}
        title="Thoát giữa bài Exam?"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Bạn đang làm chế độ Exam. Nếu đổi bài bây giờ, lượt nghe này sẽ dừng và không tính Band Listening.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowConfirmExitExamModal(false)}>
              Tiếp tục làm bài
            </Button>
            <Button
              variant="primary"
              skill="exam"
              onClick={() => {
                setShowConfirmExitExamModal(false);
                playerRef.current?.pause();
                setSession(null);
              }}
              data-testid="l1-confirm-exit-exam-btn"
            >
              Thoát bài Exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default L1TrapDetector;
