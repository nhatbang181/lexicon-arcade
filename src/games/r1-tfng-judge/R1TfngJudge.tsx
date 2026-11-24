import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  Gavel,
  HelpCircle,
  Lightbulb,
  Plus,
  RotateCcw,
  Scale,
  SearchX,
  ShieldAlert,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type {
  ReadingPassage,
  ReadingQuestionGroup,
  ReadingTrap,
  Span,
} from '../../core/content/schemas';
import { playSfx } from '../../core/audio/sfx';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import {
  AnswerInput,
  Button,
  Card,
  ChoiceButton,
  EmptyState,
  KeyHint,
  Pill,
  QuestionNav,
  RecapScreen,
  Skeleton,
  formatSeconds,
  type QuestionNavItem,
  type RecapMistakeItem,
  type TextSpan,
} from '../../design/components';
import { feedbackSlideVariants, reducedRouteVariants } from '../../design/motion';
import { registerProgressSaver } from '../../core/adaptive/progressSaver';
import { userItemRepo } from '../../core/storage/repos/userItemRepo';
import { ExamFrame, PassageView, type PassageMobileTab } from '../_shared';
import type { GameProps } from '../registry';
import { createProgressSaver } from './progressSaver';
import {
  READING_TRAP_LABELS_VI,
  buildJudgeWinStatement,
  buildR1JudgeProgressSnapshot,
  canSubmitJudgeVerdict,
  createEmptyConfusionMatrix,
  createJudgeRetrySession,
  createJudgeSession,
  createParaphraseSrsCard,
  createPassageSession,
  getCurrentJudgeItem,
  getFalseVsNgStats,
  isPassageAnswerFilled,
  mergeConfusionMatrices,
  nextJudgeQuestion,
  selectJudgeEvidence,
  selectPassageQuestion,
  selectR1Passage,
  setPassageAnswer,
  setPassageEvidence,
  submitJudgeVerdict,
  submitPassageSession,
  toggleJudgeNoDirectInfo,
  togglePassageFlag,
  useJudgeParagraphHint,
  type ConfusionMatrix3x3,
  type JudgeSessionState,
  type JudgeVerdict,
  type ParaphraseSuggestion,
  type PassageSessionState,
  type VerdictSlot,
} from './engine';
import {
  getR1Kv,
  loadReadingCatalog,
  loadReadingPassage,
  setR1Kv,
  type PassageCatalogItem,
} from './readingLoader';

type R1ActiveMode = 'judge' | 'passage_training' | 'passage_exam';

const CONFUSION_KV_KEY = 'r1_confusion_history_v1';
const R1_RECENT_PASSAGES_KV_KEY = 'r1_recent_passages_v1';
const R1_RECENT_TTL_MS = 14 * 86_400_000;
const CIRCLED_STEPS = ['①', '②', '③', '④', '⑤'] as const;
const VERDICT_SLOTS: readonly VerdictSlot[] = ['TRUE', 'FALSE', 'NOT GIVEN'];
const SLOT_SHORT_LABELS: Record<VerdictSlot, string> = {
  TRUE: 'T / Y',
  FALSE: 'F / N',
  'NOT GIVEN': 'NG',
};

interface RecentPassageEntry {
  id: string;
  ts: number;
}

interface ConfusionHistoryEntry {
  ts: number;
  matrix: ConfusionMatrix3x3;
}

function isTextInputFocused(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function build30DayMatrix(history: readonly ConfusionHistoryEntry[], nowMs: number): ConfusionMatrix3x3 {
  const cutoff = nowMs - 30 * 86_400_000;
  let total = createEmptyConfusionMatrix();
  for (const entry of history) {
    if (entry.ts >= cutoff) {
      total = mergeConfusionMatrices(total, entry.matrix);
    }
  }
  return total;
}

const ConfusionMatrixCard: React.FC<{
  title: string;
  matrix: ConfusionMatrix3x3;
  subtitle?: string;
}> = ({ title, matrix, subtitle }) => {
  const fnStats = getFalseVsNgStats(matrix);

  return (
    <Card padding="md" className="space-y-3" data-testid="confusion-matrix-3x3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {fnStats.total > 0 && (
          <Pill tone={fnStats.confusedCount === 0 ? 'correct' : 'partial'}>
            Phân biệt F/NG: {fnStats.correct}/{fnStats.total}
            {fnStats.confusedCount > 0 ? ` · Nhầm F↔NG: ${fnStats.confusedCount}` : ''}
          </Pill>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr>
              <th
                className="p-2 text-left border font-semibold"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-2)',
                  color: 'var(--color-text-dim)',
                }}
              >
                Đáp án ↓ / Bạn chọn →
              </th>
              {VERDICT_SLOTS.map((col) => (
                <th
                  key={col}
                  className="p-2 text-center border font-semibold"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-2)',
                    color: 'var(--color-text)',
                  }}
                >
                  {SLOT_SHORT_LABELS[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VERDICT_SLOTS.map((row) => (
              <tr key={row}>
                <th
                  className="p-2 text-left border font-semibold"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-2)',
                    color: 'var(--color-text)',
                  }}
                >
                  {SLOT_SHORT_LABELS[row]}
                </th>
                {VERDICT_SLOTS.map((col) => {
                  const val = matrix[row][col];
                  const isDiag = row === col;
                  const isFnConfusion =
                    (row === 'FALSE' && col === 'NOT GIVEN') ||
                    (row === 'NOT GIVEN' && col === 'FALSE');
                  let bg = 'var(--color-surface)';
                  let color = 'var(--color-text-faint)';
                  if (val > 0) {
                    if (isDiag) {
                      bg = 'color-mix(in srgb, var(--color-correct) 18%, var(--color-surface))';
                      color = 'var(--color-correct)';
                    } else if (isFnConfusion) {
                      bg = 'color-mix(in srgb, var(--color-wrong) 18%, var(--color-surface))';
                      color = 'var(--color-wrong)';
                    } else {
                      bg = 'color-mix(in srgb, var(--color-partial) 16%, var(--color-surface))';
                      color = 'var(--color-partial)';
                    }
                  }
                  return (
                    <td
                      key={col}
                      className="p-2 text-center border font-bold tabular-nums"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: bg,
                        color,
                      }}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Passage Mode Question Input Renderer (supports all 15 ReadingQType)
// ---------------------------------------------------------------------------

interface PassageQuestionInputProps {
  group: ReadingQuestionGroup;
  qid: string;
  questionNumber: number;
  prompt: string;
  value: string | string[] | undefined;
  disabled: boolean;
  onChange: (value: string | string[]) => void;
}

const PassageQuestionInput: React.FC<PassageQuestionInputProps> = ({
  group,
  qid,
  questionNumber,
  prompt,
  value,
  disabled,
  onChange,
}) => {
  const stringValue = typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : '';
  const arrayValue = Array.isArray(value) ? value : value ? [value] : [];

  if (group.type === 'tfng' || group.type === 'ynng') {
    const choices =
      group.type === 'tfng'
        ? [
            { key: 'TRUE', label: 'TRUE' },
            { key: 'FALSE', label: 'FALSE' },
            { key: 'NOT GIVEN', label: 'NOT GIVEN' },
          ]
        : [
            { key: 'YES', label: 'YES' },
            { key: 'NO', label: 'NO' },
            { key: 'NOT GIVEN', label: 'NOT GIVEN' },
          ];
    return (
      <div className="space-y-3">
        <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {prompt}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {choices.map((c) => (
            <ChoiceButton
              key={c.key}
              indexLabel={c.key === 'NOT GIVEN' ? 'NG' : c.key[0]}
              label={c.label}
              state={stringValue === c.key ? 'selected' : 'idle'}
              disabled={disabled}
              onClick={() => onChange(c.key)}
              data-testid={`passage-q-${questionNumber}-opt-${c.key}`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (group.type === 'headings' && group.headings) {
    return (
      <div className="space-y-3">
        <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          Chọn tiêu đề cho {prompt}:
        </p>
        <div className="space-y-2">
          {group.headings.map((h) => (
            <ChoiceButton
              key={h.key}
              indexLabel={h.key}
              label={h.text}
              state={stringValue.toLowerCase() === h.key.toLowerCase() ? 'selected' : 'idle'}
              disabled={disabled}
              onClick={() => onChange(h.key)}
              data-testid={`passage-q-${questionNumber}-heading-${h.key}`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (group.type === 'mcq_multi' && group.options) {
    const toggleKey = (key: string) => {
      const exists = arrayValue.includes(key);
      const next = exists ? arrayValue.filter((k) => k !== key) : [...arrayValue, key];
      onChange(next);
    };
    return (
      <div className="space-y-3">
        <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {prompt}
        </p>
        <div className="space-y-2">
          {group.options.map((opt) => (
            <ChoiceButton
              key={opt.key}
              indexLabel={opt.key}
              label={opt.text}
              state={arrayValue.includes(opt.key) ? 'selected' : 'idle'}
              disabled={disabled}
              onClick={() => toggleKey(opt.key)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (
    (group.type === 'mcq_single' ||
      group.type === 'matching_info' ||
      group.type === 'matching_features' ||
      group.type === 'sentence_endings' ||
      group.type === 'summary_wordlist') &&
    group.options
  ) {
    return (
      <div className="space-y-3">
        <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {prompt}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {group.options.map((opt) => (
            <ChoiceButton
              key={opt.key}
              indexLabel={opt.key}
              label={opt.text}
              state={stringValue.toUpperCase() === opt.key.toUpperCase() ? 'selected' : 'idle'}
              disabled={disabled}
              onClick={() => onChange(opt.key)}
              data-testid={`passage-q-${questionNumber}-opt-${opt.key}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Completion & short_answer types
  return (
    <div className="space-y-3">
      {group.summaryText && (
        <div
          className="p-3.5 rounded-[var(--radius-md)] border text-sm leading-relaxed"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          {group.summaryText.split(/(\[Q\d+\])/g).map((part, i) => {
            const isCurrentSlot = part === `[Q${questionNumber}]`;
            if (/^\[Q\d+\]$/.test(part)) {
              return (
                <span
                  key={`${qid}-slot-${i}`}
                  className="inline-block px-1.5 py-0.5 mx-0.5 rounded font-bold text-xs"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: isCurrentSlot
                      ? 'color-mix(in srgb, var(--color-info) 22%, var(--color-surface))'
                      : 'var(--color-surface)',
                    border: `1px solid ${isCurrentSlot ? 'var(--color-info)' : 'var(--color-border)'}`,
                    color: 'var(--color-text)',
                  }}
                >
                  {isCurrentSlot && stringValue ? `${part}: ${stringValue}` : part}
                </span>
              );
            }
            return <React.Fragment key={`${qid}-txt-${i}`}>{part}</React.Fragment>;
          })}
        </div>
      )}

      <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-text)' }}>
        {prompt}
      </p>

      <AnswerInput
        value={stringValue}
        onChange={(v) => onChange(v)}
        disabled={disabled}
        wordLimit={group.wordLimit?.words}
        label={`Đáp án câu ${questionNumber}`}
        helperText={
          group.wordLimit
            ? `Tối đa ${group.wordLimit.words} từ${group.wordLimit.allowNumber ? ' và/hoặc 1 số' : ' (không dùng số)'} — chép đúng chính tả từ bài đọc.`
            : 'Nhập đáp án chính xác từ bài đọc.'
        }
        data-testid={`passage-q-${questionNumber}-input`}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main R1 · TFNG Judge Component
// ---------------------------------------------------------------------------

export const R1TfngJudge: React.FC<GameProps> = ({ mode, level, onExit }) => {
  const prefersReduced = useReducedMotion();

  const [catalog, setCatalog] = useState<PassageCatalogItem[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeMode, setActiveMode] = useState<R1ActiveMode>(
    mode === 'exam' ? 'passage_exam' : 'judge',
  );
  const [mobileTab, setMobileTab] = useState<PassageMobileTab>('passage');
  const [clickSelectsSentence, setClickSelectsSentence] = useState(false);

  // Judge mode state
  const [judgeState, setJudgeState] = useState<JudgeSessionState | null>(null);
  const judgeStateRef = useRef<JudgeSessionState | null>(null);
  judgeStateRef.current = judgeState;
  const [questionElapsedSec, setQuestionElapsedSec] = useState(0);
  const [gavelHitVerdict, setGavelHitVerdict] = useState<JudgeVerdict | null>(null);
  const [addedParaphraseIds, setAddedParaphraseIds] = useState<Record<string, boolean>>({});
  const [rolling30DayMatrix, setRolling30DayMatrix] = useState<ConfusionMatrix3x3 | null>(null);
  const judgeSavedRef = useRef(false);
  const judgeSaverRef = useRef(
    createProgressSaver({
      saveProgress: (payload) => attemptRepo.saveProgress(payload),
      finalize: (attemptId, payload) => attemptRepo.finalize(attemptId, payload),
    }),
  );

  const persistJudgeSnapshot = useCallback(
    (target: JudgeSessionState | null, final: boolean) => {
      if (!target) return Promise.resolve();
      const snap = buildR1JudgeProgressSnapshot(target, Date.now());
      if (!snap) return judgeSaverRef.current.persist(null, final);
      const before =
        snap.items.length > 0
          ? async () => {
              for (const item of snap.items) {
                await userItemRepo.upsertWithCard(item, 'tfng_retry', { cardSource: 'user' });
              }
            }
          : undefined;
      return judgeSaverRef.current.persist(snap.progress, final, before);
    },
    [],
  );

  // Đăng ký lưu tiến độ cho nút "Lưu và thoát" của PlayScreen (TU-02)
  useEffect(() => {
    return registerProgressSaver(() => persistJudgeSnapshot(judgeStateRef.current, false));
  }, [persistJudgeSnapshot]);

  // Passage mode (training / exam) state
  const [passageState, setPassageState] = useState<PassageSessionState | null>(null);
  const [passageRequireEvidence, setPassageRequireEvidence] = useState(false);
  const [examHighlightsByPara, setExamHighlightsByPara] = useState<Record<string, TextSpan[]>>({});
  const [reviewFocusQid, setReviewFocusQid] = useState<string | null>(null);
  const passageSavedRef = useRef(false);

  // Load passage catalog once & chọn bài theo level + tránh lặp 14 ngày (R1-1, PP-05)
  useEffect(() => {
    let active = true;
    void (async () => {
      const now = Date.now();
      const [items, recentRaw] = await Promise.all([
        loadReadingCatalog(),
        getR1Kv<RecentPassageEntry[]>(R1_RECENT_PASSAGES_KV_KEY, []),
      ]);
      if (!active) return;
      setCatalog(items);
      const recentIds = (Array.isArray(recentRaw) ? recentRaw : [])
        .filter((e) => now - e.ts < R1_RECENT_TTL_MS)
        .map((e) => e.id);
      const preferred = selectR1Passage(items, level, {
        recentIds,
        seed: `r1:${level}:${now}:${Math.random().toString(36).slice(2, 8)}`,
      });
      if (preferred) {
        setSelectedCatalogId(preferred.id);
      } else {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [level]);

  // Load selected passage & initialize sessions
  useEffect(() => {
    if (!selectedCatalogId || catalog.length === 0) return;
    const item = catalog.find((c) => c.id === selectedCatalogId);
    if (!item) return;

    let active = true;
    setLoading(true);
    void (async () => {
      const loaded = await loadReadingPassage(item);
      if (!active) return;
      setPassage(loaded);
      judgeSaverRef.current.reset();
      const jSession = createJudgeSession(loaded, { level });
      judgeStateRef.current = jSession;
      setJudgeState(jSession);
      setQuestionElapsedSec(0);
      setAddedParaphraseIds({});
      judgeSavedRef.current = false;

      // Ghi nhận passage vừa mở vào lịch sử 14 ngày để phiên sau không lặp (R1-1)
      const now = Date.now();
      const prevRecent = await getR1Kv<RecentPassageEntry[]>(R1_RECENT_PASSAGES_KV_KEY, []);
      const nextRecent = [
        ...(Array.isArray(prevRecent) ? prevRecent : []).filter(
          (e) => e.id !== loaded.id && now - e.ts < R1_RECENT_TTL_MS,
        ),
        { id: loaded.id, ts: now },
      ];
      void setR1Kv(R1_RECENT_PASSAGES_KV_KEY, nextRecent);

      const pSession = createPassageSession(loaded, {
        mode: activeMode === 'passage_exam' ? 'exam' : 'training',
        requireEvidence: passageRequireEvidence,
      });
      setPassageState(pSession);
      setExamHighlightsByPara({});
      setReviewFocusQid(null);
      passageSavedRef.current = false;

      // If passage has no TFNG/YNNG questions and we're in judge mode, switch to passage training
      if (jSession.items.length === 0 && activeMode === 'judge') {
        setActiveMode('passage_training');
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCatalogId, catalog, level]);

  const switchMode = useCallback(
    (nextMode: R1ActiveMode) => {
      if (!passage) return;
      setActiveMode(nextMode);
      setMobileTab('passage');
      setReviewFocusQid(null);
      if (nextMode === 'judge') {
        judgeSaverRef.current.reset();
        const fresh = createJudgeSession(passage, { level });
        judgeStateRef.current = fresh;
        setJudgeState(fresh);
        setQuestionElapsedSec(0);
        setAddedParaphraseIds({});
        judgeSavedRef.current = false;
      } else {
        setPassageState(
          createPassageSession(passage, {
            mode: nextMode === 'passage_exam' ? 'exam' : 'training',
            requireEvidence: nextMode === 'passage_training' ? passageRequireEvidence : false,
          }),
        );
        setExamHighlightsByPara({});
        passageSavedRef.current = false;
      }
    },
    [level, passage, passageRequireEvidence],
  );

  const startJudgeRetry = useCallback(() => {
    const cur = judgeStateRef.current;
    if (!cur) return;
    const retry = createJudgeRetrySession(cur, Date.now());
    if (!retry) {
      switchMode('judge');
      return;
    }
    judgeSaverRef.current.reset();
    judgeSavedRef.current = false;
    judgeStateRef.current = retry;
    setJudgeState(retry);
    setQuestionElapsedSec(0);
  }, [switchMode]);

  // Elapsed question stopwatch for Judge mode
  useEffect(() => {
    if (activeMode !== 'judge' || !judgeState || judgeState.finished || judgeState.lastResult) {
      return;
    }
    const id = window.setInterval(() => {
      setQuestionElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeMode, judgeState]);

  // Finalize Judge session when finished (idempotent qua progressSaver; bỏ qua nếu retry - C3)
  useEffect(() => {
    if (activeMode !== 'judge' || !judgeState?.finished || judgeSavedRef.current) return;
    if (judgeState.results.length === 0) return;
    judgeSavedRef.current = true;

    const nowMs = judgeState.finishedAt ?? Date.now();

    void (async () => {
      try {
        await persistJudgeSnapshot(judgeState, true);

        if (!judgeState.isRetry) {
          const existingHistory = await getR1Kv<ConfusionHistoryEntry[]>(CONFUSION_KV_KEY, []);
          const cutoff = nowMs - 30 * 86_400_000;
          const updatedHistory = [
            ...existingHistory.filter((h) => h.ts >= cutoff),
            { ts: nowMs, matrix: judgeState.confusionMatrix },
          ];
          await setR1Kv(CONFUSION_KV_KEY, updatedHistory);
          setRolling30DayMatrix(build30DayMatrix(updatedHistory, nowMs));
        } else {
          setRolling30DayMatrix(judgeState.confusionMatrix);
        }
      } catch {
        setRolling30DayMatrix(judgeState.confusionMatrix);
      }
      playSfx('sessionDone');
    })();
  }, [activeMode, judgeState, persistJudgeSnapshot]);

  // Persist Passage session when submitted
  useEffect(() => {
    if (
      activeMode === 'judge' ||
      !passageState?.submitted ||
      !passageState.summary ||
      passageSavedRef.current
    ) {
      return;
    }
    passageSavedRef.current = true;
    const summary = passageState.summary;
    const nowMs = passageState.submittedAt ?? Date.now();

    void (async () => {
      try {
        await attemptRepo.saveSession({
          attempt: {
            gameId: 'r1',
            mode: passageState.mode,
            startedAt: passageState.startedAt,
            endedAt: nowMs,
            score: summary.score,
            total: summary.total,
            xp: summary.xp,
            items: summary.grades.map((g) => ({
              itemId: g.qid,
              correct: g.scoreResult.correct,
              trapType: g.trapType,
            })),
          },
          updatedCards: summary.retryCards,
          bandEvidence: [
            {
              skill: 'R',
              mode: passageState.mode,
              ts: nowMs,
              correct: summary.score,
              total: summary.total,
              band: summary.estimatedBand,
              sourceGameId: 'r1',
            },
          ],
        });
      } catch {
        // Ignore storage errors in constrained environments
      }
      if (passageState.mode === 'training') {
        playSfx('sessionDone');
      }
    })();
  }, [activeMode, passageState]);

  // Judge mode handlers
  const handleSelectEvidence = useCallback(
    (span: Span) => {
      if (activeMode === 'judge') {
        setJudgeState((prev) => (prev ? selectJudgeEvidence(prev, span) : prev));
        playSfx('highlight');
      } else if (activeMode === 'passage_training' && passageState) {
        setPassageState((prev) => (prev ? setPassageEvidence(prev, prev.currentQid, span) : prev));
        playSfx('highlight');
      }
    },
    [activeMode, passageState],
  );

  const handleJudgeVerdict = useCallback(
    (verdict: JudgeVerdict) => {
      if (!judgeState || !canSubmitJudgeVerdict(judgeState, verdict)) return;
      // Gavel drop animation + low-pitched tap SFX (R1 §10: rate 0.85)
      setGavelHitVerdict(verdict);
      playSfx('tap', { rate: 0.85 });
      window.setTimeout(() => setGavelHitVerdict(null), 160);

      const next = submitJudgeVerdict(judgeState, verdict, questionElapsedSec * 1000);
      judgeStateRef.current = next;
      setJudgeState(next);
      void persistJudgeSnapshot(next, false);

      if (next.lastResult) {
        if (next.lastResult.outcome === 'perfect') {
          playSfx('correct');
        } else if (next.lastResult.outcome === 'lucky') {
          playSfx('reveal');
        } else {
          playSfx('wrong');
        }
      }
    },
    [judgeState, questionElapsedSec, persistJudgeSnapshot],
  );

  const handleJudgeNext = useCallback(() => {
    setJudgeState((prev) => (prev ? nextJudgeQuestion(prev) : prev));
    setQuestionElapsedSec(0);
    playSfx('flip');
  }, []);

  const handleAddParaphraseSrs = useCallback(async (suggestion: ParaphraseSuggestion) => {
    const card = createParaphraseSrsCard(suggestion);
    try {
      await cardRepo.upsert(card);
    } catch {
      // Ignore storage error
    }
    setAddedParaphraseIds((prev) => ({ ...prev, [suggestion.id]: true }));
    playSfx('tap');
  }, []);

  // Keyboard shortcuts for Judge mode: T/F/N (TFNG), Y/N/G (YNNG), Enter (Next)
  useEffect(() => {
    if (activeMode !== 'judge' || !judgeState || judgeState.finished) return;
    const current = getCurrentJudgeItem(judgeState);
    if (!current) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextInputFocused(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;

      if (judgeState.lastResult) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleJudgeNext();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (current.groupType === 'tfng') {
        if (key === 't' || key === '1') handleJudgeVerdict('TRUE');
        else if (key === 'f' || key === '2') handleJudgeVerdict('FALSE');
        else if (key === 'n' || key === '3') handleJudgeVerdict('NOT GIVEN');
      } else {
        if (key === 'y' || key === '1') handleJudgeVerdict('YES');
        else if (key === 'n' || key === '2') handleJudgeVerdict('NO');
        else if (key === 'g' || key === '3') handleJudgeVerdict('NOT GIVEN');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMode, handleJudgeNext, handleJudgeVerdict, judgeState]);

  // Exam highlight handlers
  const handleAddExamHighlight = useCallback((paragraph: string, span: TextSpan) => {
    setExamHighlightsByPara((prev) => ({
      ...prev,
      [paragraph]: [...(prev[paragraph] ?? []), span],
    }));
  }, []);

  const handleUpdateExamNote = useCallback((paragraph: string, spanId: string, note: string) => {
    setExamHighlightsByPara((prev) => ({
      ...prev,
      [paragraph]: (prev[paragraph] ?? []).map((sp) => (sp.id === spanId ? { ...sp, note } : sp)),
    }));
  }, []);

  const handleRemoveExamHighlight = useCallback((paragraph: string, spanId: string) => {
    setExamHighlightsByPara((prev) => ({
      ...prev,
      [paragraph]: (prev[paragraph] ?? []).filter((sp) => sp.id !== spanId),
    }));
  }, []);

  const passageNavItems: QuestionNavItem[] = useMemo(() => {
    if (!passageState) return [];
    return passageState.questions.map((q) => {
      const grade = passageState.summary?.grades.find((g) => g.qid === q.qid);
      return {
        qid: q.qid,
        number: q.number,
        answered: isPassageAnswerFilled(passageState.answers[q.qid]),
        flagged: passageState.flaggedQids.includes(q.qid),
        result: grade ? (grade.scoreResult.correct ? 'correct' : 'wrong') : null,
      };
    });
  }, [passageState]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <Skeleton lines={10} />
          </div>
          <div className="lg:col-span-5">
            <Skeleton lines={6} />
          </div>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <EmptyState
          title="Chưa có bài đọc Reading"
          description="Không tải được dữ liệu bài đọc cho R1 TFNG Judge."
          action={
            <Button variant="primary" skill="reading" onClick={() => onExit()}>
              Quay lại Hub
            </Button>
          }
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Mode 3: Passage Exam Mode (ExamFrame, data-theme="exam", 20 min)
  // -------------------------------------------------------------------------
  if (activeMode === 'passage_exam' && passageState) {
    const activeQuestion =
      passageState.questions.find((q) => q.qid === passageState.currentQid) ??
      passageState.questions[0];

    const reviewGrade =
      passageState.submitted && reviewFocusQid
        ? passageState.summary?.grades.find((g) => g.qid === reviewFocusQid)
        : undefined;

    return (
      <ExamFrame
        title={`IELTS Academic Reading · ${passage.level} — ${passage.title}`}
        subtitle={`1 passage · ${passageState.questions.length} câu hỏi · Tự nộp khi hết 20 phút`}
        durationSec={passageState.durationSec}
        submitted={passageState.submitted}
        navItems={passageNavItems}
        currentQid={passageState.currentQid}
        onSelectQuestion={(qid) => {
          setPassageState((prev) => (prev ? selectPassageQuestion(prev, qid) : prev));
          if (passageState.submitted) setReviewFocusQid(qid);
        }}
        onToggleFlag={(qid) =>
          setPassageState((prev) => (prev ? togglePassageFlag(prev, qid) : prev))
        }
        onSubmit={(reason) =>
          setPassageState((prev) => (prev ? submitPassageSession(prev, reason) : prev))
        }
        onExit={() => switchMode('judge')}
      >
        <PassageView
          passage={passage}
          highlighterMode={passageState.submitted ? 'readonly' : 'exam'}
          allowGlossary={false}
          answerEvidence={reviewGrade ? reviewGrade.goldEvidence : []}
          examHighlightsByPara={examHighlightsByPara}
          onAddExamHighlight={handleAddExamHighlight}
          onUpdateExamNote={handleUpdateExamNote}
          onRemoveExamHighlight={handleRemoveExamHighlight}
          activeMobileTab={mobileTab}
          onMobileTabChange={setMobileTab}
          passageHeading={`${passage.level} · ${passage.wordCount} từ · Chuột phải để bôi sáng`}
          questionTabLabel="Câu hỏi"
          questionTabBadge={`${passageState.questions.findIndex((q) => q.qid === passageState.currentQid) + 1}/${passageState.questions.length}`}
        >
          {passageState.submitted && passageState.summary ? (
            <div className="space-y-4" data-testid="exam-results-panel">
              <Card padding="md" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-dim)' }}>
                      {passageState.summary.submitReason === 'timeout'
                        ? 'Hết giờ · Bài đã được tự nộp'
                        : 'Kết quả Passage Exam'}
                    </div>
                    <div
                      className="text-3xl font-extrabold tabular-nums mt-1"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
                    >
                      {passageState.summary.score}/{passageState.summary.total} · Band{' '}
                      {passageState.summary.estimatedBand.toFixed(1)}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => switchMode('judge')}
                  >
                    Về Judge Mode
                  </Button>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Nhấn từng câu bên dưới để tự cuộn tới vật chứng bôi vàng trong bài đọc.
                </p>
              </Card>

              <div className="space-y-2">
                {passageState.summary.grades.map((g) => (
                  <button
                    key={g.qid}
                    type="button"
                    onClick={() => {
                      setReviewFocusQid(g.qid);
                      setPassageState((prev) => (prev ? selectPassageQuestion(prev, g.qid) : prev));
                    }}
                    className="w-full text-left p-3 rounded-[var(--radius-md)] border space-y-1 cursor-pointer"
                    style={{
                      backgroundColor:
                        reviewFocusQid === g.qid ? 'var(--color-surface-2)' : 'var(--color-surface)',
                      borderColor: g.scoreResult.correct
                        ? 'var(--color-correct)'
                        : 'var(--color-wrong)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-bold">
                      <span>
                        Câu {g.number} ({g.groupType})
                      </span>
                      <span
                        style={{
                          color: g.scoreResult.correct
                            ? 'var(--color-correct)'
                            : 'var(--color-wrong)',
                        }}
                      >
                        {g.scoreResult.correct ? 'Đúng' : 'Sai'}
                      </span>
                    </div>
                    <div className="text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                      Bạn chọn: <strong>{g.userAnswer || '(bỏ trống)'}</strong> · Đáp án:{' '}
                      <strong>{g.expectedAnswer}</strong>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                      {g.explanationVi}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : activeQuestion ? (
            <Card padding="md" className="space-y-4">
              <div
                className="pb-3 border-b space-y-1"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-bold uppercase"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                  >
                    Câu {activeQuestion.number} / {passageState.questions.length}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-text-dim)' }}
                  >
                    {activeQuestion.group.type}
                  </span>
                </div>
                <p className="text-xs italic" style={{ color: 'var(--color-text-dim)' }}>
                  {activeQuestion.group.instructions}
                </p>
              </div>

              <PassageQuestionInput
                group={activeQuestion.group}
                qid={activeQuestion.qid}
                questionNumber={activeQuestion.number}
                prompt={activeQuestion.question.prompt}
                value={passageState.answers[activeQuestion.qid]}
                disabled={passageState.submitted}
                onChange={(val) =>
                  setPassageState((prev) =>
                    prev ? setPassageAnswer(prev, activeQuestion.qid, val) : prev,
                  )
                }
              />

              <div
                className="flex items-center justify-between gap-2 pt-3 border-t"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activeQuestion.number <= 1}
                  onClick={() => {
                    const idx = passageState.questions.findIndex(
                      (q) => q.qid === activeQuestion.qid,
                    );
                    if (idx > 0) {
                      setPassageState((prev) =>
                        prev
                          ? selectPassageQuestion(prev, passageState.questions[idx - 1].qid)
                          : prev,
                      );
                    }
                  }}
                >
                  Câu trước
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activeQuestion.number >= passageState.questions.length}
                  onClick={() => {
                    const idx = passageState.questions.findIndex(
                      (q) => q.qid === activeQuestion.qid,
                    );
                    if (idx >= 0 && idx + 1 < passageState.questions.length) {
                      setPassageState((prev) =>
                        prev
                          ? selectPassageQuestion(prev, passageState.questions[idx + 1].qid)
                          : prev,
                      );
                    }
                  }}
                >
                  Câu tiếp
                </Button>
              </div>
            </Card>
          ) : null}
        </PassageView>
      </ExamFrame>
    );
  }

  // -------------------------------------------------------------------------
  // Top Mode & Passage Control Bar (shared by Judge & Passage Training)
  // -------------------------------------------------------------------------
  const topControlBar = (
    <div
      className="px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex items-center p-1 rounded-[var(--radius-md)] border gap-1"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
          role="tablist"
          aria-label="Chọn chế độ R1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'judge'}
            onClick={() => switchMode('judge')}
            data-testid="r1-mode-judge"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor:
                activeMode === 'judge' ? 'var(--color-reading)' : 'transparent',
              color:
                activeMode === 'judge' ? 'var(--color-bg)' : 'var(--color-text-dim)',
            }}
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Judge Mode</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'passage_training'}
            onClick={() => switchMode('passage_training')}
            data-testid="r1-mode-passage-training"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor:
                activeMode === 'passage_training' ? 'var(--color-reading)' : 'transparent',
              color:
                activeMode === 'passage_training' ? 'var(--color-bg)' : 'var(--color-text-dim)',
            }}
          >
            <BookOpenText className="w-3.5 h-3.5" />
            <span>Passage (Luyện)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={() => switchMode('passage_exam')}
            data-testid="r1-mode-passage-exam"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-text-dim)',
            }}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Passage Exam (20p)</span>
          </button>
        </div>

        {/* Passage selector */}
        <select
          aria-label="Chọn bài đọc"
          value={selectedCatalogId}
          onChange={(e) => setSelectedCatalogId(e.target.value)}
          data-testid="r1-passage-select"
          className="min-h-[36px] px-3 py-1.5 rounded-[var(--radius-sm)] border text-xs font-medium max-w-[280px] sm:max-w-[360px]"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          {catalog.map((c) => (
            <option key={c.id} value={c.id}>
              [{c.level}] {c.title} ({c.questionCount} câu)
            </option>
          ))}
        </select>
      </div>

      {/* Live Judge HUD */}
      {activeMode === 'judge' && judgeState && !judgeState.finished && (
        <div className="flex flex-wrap items-center gap-2.5 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          <Pill tone="reading">
            {judgeState.currentIndex + 1}/{judgeState.items.length}
          </Pill>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] border tabular-nums font-semibold"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor:
                judgeState.difficulty.warnOverSec &&
                questionElapsedSec > judgeState.difficulty.warnOverSec
                  ? 'var(--color-wrong)'
                  : 'var(--color-border)',
              color:
                judgeState.difficulty.warnOverSec &&
                questionElapsedSec > judgeState.difficulty.warnOverSec
                  ? 'var(--color-wrong)'
                  : judgeState.difficulty.targetSecPerQuestion &&
                      questionElapsedSec > judgeState.difficulty.targetSecPerQuestion
                    ? 'var(--color-partial)'
                    : 'var(--color-text)',
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatSeconds(questionElapsedSec)}</span>
          </span>
          <span
            className="font-bold tabular-nums px-2 py-1 rounded-[var(--radius-sm)]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-correct) 14%, var(--color-surface))',
              color: 'var(--color-correct)',
            }}
          >
            +{judgeState.totalXp} XP
          </span>
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------------------
  // Mode 2: Passage Training Mode (all 13-14 questions, all RQTypes)
  // -------------------------------------------------------------------------
  if (activeMode === 'passage_training' && passageState) {
    const activeQuestion =
      passageState.questions.find((q) => q.qid === passageState.currentQid) ??
      passageState.questions[0];

    const currentUserEv = passageState.evidenceByQid[passageState.currentQid];
    const currentUserEvList: Span[] =
      currentUserEv && currentUserEv.paragraph
        ? [
            {
              paragraph: currentUserEv.paragraph,
              start: currentUserEv.start,
              end: currentUserEv.end,
              quote: currentUserEv.quote ?? '',
            },
          ]
        : [];

    const reviewGrade =
      passageState.submitted && reviewFocusQid
        ? passageState.summary?.grades.find((g) => g.qid === reviewFocusQid)
        : undefined;

    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col">
        {topControlBar}
        <div className="flex-1 p-4 sm:p-5 max-w-[1440px] w-full mx-auto space-y-4">
          {!passageState.submitted && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer" style={{ color: 'var(--color-text-dim)' }}>
                <input
                  type="checkbox"
                  checked={passageRequireEvidence}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPassageRequireEvidence(checked);
                    setPassageState((prev) =>
                      prev ? { ...prev, requireEvidence: checked } : prev,
                    );
                  }}
                />
                <span>Yêu cầu trình vật chứng cho mọi câu (Training)</span>
              </label>
              <Button
                variant="primary"
                skill="reading"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() =>
                  setPassageState((prev) => (prev ? submitPassageSession(prev, 'manual') : prev))
                }
                data-testid="passage-training-submit-btn"
              >
                Chấm cả bài ({passageNavItems.filter((i) => i.answered).length}/{passageNavItems.length})
              </Button>
            </div>
          )}

          <PassageView
            passage={passage}
            highlighterMode={passageState.submitted ? 'readonly' : 'evidence'}
            allowGlossary={level <= 2}
            defaultShowGlossary={level <= 2}
            userEvidence={passageState.submitted ? [] : currentUserEvList}
            answerEvidence={reviewGrade ? reviewGrade.goldEvidence : []}
            onSelectEvidence={handleSelectEvidence}
            clickSelectsSentence={clickSelectsSentence}
            onToggleClickSelectsSentence={setClickSelectsSentence}
            activeMobileTab={mobileTab}
            onMobileTabChange={setMobileTab}
            passageHeading={`PASSAGE TRAINING · ${passage.level} (${passage.wordCount} từ)`}
          >
            {passageState.submitted && passageState.summary ? (
              <div className="space-y-4">
                <RecapScreen
                  scoreLabel={`${passageState.summary.score}/${passageState.summary.total}`}
                  xpEarned={passageState.summary.xp}
                  accuracyPercent={Math.round(passageState.summary.accuracy * 100)}
                  durationSec={Math.max(
                    1,
                    Math.round(
                      ((passageState.submittedAt ?? Date.now()) - passageState.startedAt) / 1000,
                    ),
                  )}
                  winStatement={`Band Reading ước lượng phiên này: ${passageState.summary.estimatedBand.toFixed(1)} (${Math.round(passageState.summary.accuracy * 100)}% chính xác).`}
                  mistakes={passageState.summary.grades
                    .filter((g) => !g.scoreResult.correct)
                    .map((g) => ({
                      id: g.qid,
                      prompt: `Câu ${g.number}: ${g.prompt}`,
                      userAnswer: g.userAnswer || '(bỏ trống)',
                      correctAnswer: g.expectedAnswer,
                      note: g.explanationVi,
                    }))}
                  onRetryMistakes={() => switchMode('passage_training')}
                  onGoToday={() => onExit(passageState.summary)}
                />

                <Card padding="md" className="space-y-2">
                  <div className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>
                    Bấm số câu để soi vật chứng bôi vàng trên bài đọc:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {passageState.summary.grades.map((g) => (
                      <button
                        key={g.qid}
                        type="button"
                        onClick={() => setReviewFocusQid(g.qid)}
                        className="px-2.5 py-1 rounded-[var(--radius-sm)] border text-xs font-bold cursor-pointer"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          borderColor: g.scoreResult.correct
                            ? 'var(--color-correct)'
                            : 'var(--color-wrong)',
                          backgroundColor:
                            reviewFocusQid === g.qid
                              ? 'color-mix(in srgb, var(--color-partial) 24%, var(--color-surface))'
                              : 'var(--color-surface-2)',
                          color: 'var(--color-text)',
                        }}
                      >
                        Q{g.number}
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            ) : activeQuestion ? (
              <Card padding="md" className="space-y-4">
                <div
                  className="pb-3 border-b space-y-1"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Pill tone="reading">
                      Câu {activeQuestion.number}/{passageState.questions.length}
                    </Pill>
                    <Pill tone="neutral">{activeQuestion.group.type}</Pill>
                  </div>
                  <p className="text-xs italic" style={{ color: 'var(--color-text-dim)' }}>
                    {activeQuestion.group.instructions}
                  </p>
                </div>

                {passageState.requireEvidence && (
                  <div
                    className="p-2.5 rounded-[var(--radius-sm)] border text-xs"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-info) 10%, var(--color-surface-2))',
                      borderColor: 'color-mix(in srgb, var(--color-info) 35%, var(--color-border))',
                      color: 'var(--color-text)',
                    }}
                  >
                    {currentUserEv ? (
                      <span>
                        Vật chứng đã chọn (đoạn {currentUserEv.paragraph}): “{currentUserEv.quote}”
                      </span>
                    ) : (
                      <span>Bôi câu bằng chứng trong bài đọc cho câu {activeQuestion.number}.</span>
                    )}
                  </div>
                )}

                <PassageQuestionInput
                  group={activeQuestion.group}
                  qid={activeQuestion.qid}
                  questionNumber={activeQuestion.number}
                  prompt={activeQuestion.question.prompt}
                  value={passageState.answers[activeQuestion.qid]}
                  disabled={false}
                  onChange={(val) =>
                    setPassageState((prev) =>
                      prev ? setPassageAnswer(prev, activeQuestion.qid, val) : prev,
                    )
                  }
                />

                <div
                  className="pt-3 border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <QuestionNav
                    items={passageNavItems}
                    currentQid={passageState.currentQid}
                    onSelect={(qid) =>
                      setPassageState((prev) => (prev ? selectPassageQuestion(prev, qid) : prev))
                    }
                    onToggleFlag={(qid) =>
                      setPassageState((prev) => (prev ? togglePassageFlag(prev, qid) : prev))
                    }
                    compact={true}
                  />
                </div>
              </Card>
            ) : null}
          </PassageView>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Mode 1: Judge Mode (Default · TFNG / YNNG with mandatory Evidence Step)
  // -------------------------------------------------------------------------
  if (!judgeState) return null;

  if (judgeState.finished) {
    const total = judgeState.results.length;
    const correctCount = judgeState.results.filter((r) => r.answerCorrect).length;
    const perfectCount = judgeState.results.filter((r) => r.outcome === 'perfect').length;
    const accuracyPercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const durationSec = Math.max(
      1,
      Math.round(((judgeState.finishedAt ?? Date.now()) - judgeState.startedAt) / 1000),
    );
    const mistakes: RecapMistakeItem[] = judgeState.results
      .filter((r) => r.outcome !== 'perfect')
      .map((r) => ({
        id: r.qid,
        prompt: `Câu ${r.number} (${r.outcomeLabelVi}): ${r.prompt}`,
        userAnswer: r.userVerdict,
        correctAnswer: r.expectedVerdict,
        note: r.diagnosisVi,
      }));

    const trapEntries = Object.entries(judgeState.trapStats) as Array<
      [ReadingTrap, { total: number; wrong: number }]
    >;

    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col">
        {topControlBar}
        <div className="max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-5" data-testid="r1-judge-recap">
          <RecapScreen
            scoreLabel={`${perfectCount}/${total} chuẩn`}
            xpEarned={judgeState.totalXp}
            winStatement={buildJudgeWinStatement(judgeState)}
            accuracyPercent={accuracyPercent}
            durationSec={durationSec}
            mistakes={mistakes}
            onRetryMistakes={startJudgeRetry}
            onGoToday={() =>
              onExit({
                gameId: 'r1',
                mode: 'training',
                score: correctCount,
                total,
                xp: judgeState.totalXp,
              })
            }
          />

          <ConfusionMatrixCard
            title="Ma trận nhầm lẫn 3×3 (Phiên này)"
            subtitle="Theo dõi nhầm lẫn giữa FALSE/NO và NOT GIVEN — nguyên nhân mất điểm nhiều nhất ở band 6–7"
            matrix={judgeState.confusionMatrix}
          />

          {rolling30DayMatrix && (
            <ConfusionMatrixCard
              title="Ma trận nhầm lẫn 3×3 (30 ngày gần nhất)"
              matrix={rolling30DayMatrix}
            />
          )}

          {trapEntries.length > 0 && (
            <Card padding="md" className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                Thống kê loại bẫy gặp trong phiên
              </h3>
              <div className="flex flex-wrap gap-2">
                {trapEntries.map(([trap, stat]) => (
                  <Pill key={trap} tone={stat.wrong > 0 ? 'wrong' : 'correct'}>
                    {trap}: đúng {stat.total - stat.wrong}/{stat.total}
                  </Pill>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const currentItem = getCurrentJudgeItem(judgeState);
  if (!currentItem) return null;

  const lastResult = judgeState.lastResult;
  const userEvidenceList: Span[] = judgeState.selectedSpan ? [judgeState.selectedSpan] : [];
  const answerEvidenceList: Span[] = lastResult ? [...lastResult.goldEvidence] : [];

  const verdictOptions: Array<{ verdict: JudgeVerdict; label: string; hotkey: string }> =
    currentItem.groupType === 'tfng'
      ? [
          { verdict: 'TRUE', label: 'TRUE', hotkey: 'T' },
          { verdict: 'FALSE', label: 'FALSE', hotkey: 'F' },
          { verdict: 'NOT GIVEN', label: 'NOT GIVEN', hotkey: 'N' },
        ]
      : [
          { verdict: 'YES', label: 'YES', hotkey: 'Y' },
          { verdict: 'NO', label: 'NO', hotkey: 'N' },
          { verdict: 'NOT GIVEN', label: 'NOT GIVEN', hotkey: 'G' },
        ];

  const evidenceReady = Boolean(judgeState.selectedSpan) || judgeState.noDirectInfo;

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {topControlBar}

      <div className="flex-1 p-4 sm:p-5 max-w-[1440px] w-full mx-auto">
        <PassageView
          passage={passage}
          highlighterMode={lastResult ? 'readonly' : 'evidence'}
          userEvidence={userEvidenceList}
          answerEvidence={answerEvidenceList}
          onSelectEvidence={handleSelectEvidence}
          allowGlossary={judgeState.difficulty.level <= 2}
          defaultShowGlossary={judgeState.difficulty.glossaryDefaultOn}
          hintedParagraph={judgeState.hintedParagraph}
          clickSelectsSentence={clickSelectsSentence}
          onToggleClickSelectsSentence={setClickSelectsSentence}
          activeMobileTab={mobileTab}
          onMobileTabChange={setMobileTab}
          passageHeading={`HỒ SƠ (Passage ${passage.level})`}
          questionTabLabel="Lời khai"
          questionTabBadge={`${judgeState.currentIndex + 1}/${judgeState.items.length}`}
        >
          <div className="space-y-4">
            {/* Statement ("LỜI KHAI") Card */}
            <Card skillAccent="reading" padding="md" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4" style={{ color: 'var(--color-reading)' }} />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-reading)' }}
                  >
                    LỜI KHAI #{currentItem.question.number}
                  </span>
                </div>
                <Pill tone="neutral">
                  {currentItem.groupType === 'tfng'
                    ? 'TRUE / FALSE / NOT GIVEN'
                    : 'YES / NO / NOT GIVEN'}
                </Pill>
              </div>

              <blockquote
                className="text-lg sm:text-xl font-medium leading-snug p-4 rounded-[var(--radius-md)] border"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                data-testid="r1-judge-statement"
              >
                “{currentItem.question.prompt}”
              </blockquote>

              {/* STEP ①: PRESENT EVIDENCE */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
                    ① Trình vật chứng (Bắt buộc)
                  </span>
                  {judgeState.difficulty.allowParagraphHint && !lastResult && !judgeState.hintUsedForCurrent && (
                    <button
                      type="button"
                      onClick={() => {
                        setJudgeState((prev) => (prev ? useJudgeParagraphHint(prev) : prev));
                        playSfx('tap');
                      }}
                      data-testid="r1-hint-para-btn"
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-partial)',
                      }}
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Gợi ý đoạn (−50% XP)</span>
                    </button>
                  )}
                </div>

                {judgeState.selectedSpan ? (
                  <div
                    className="p-3 rounded-[var(--radius-md)] border flex items-start justify-between gap-2 text-sm"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-info) 14%, var(--color-surface))',
                      borderColor: 'var(--color-info)',
                      color: 'var(--color-text)',
                    }}
                    data-testid="r1-selected-evidence-box"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: 'var(--color-info)' }}>
                        Vật chứng đã trình · Đoạn {judgeState.selectedSpan.paragraph}
                      </div>
                      <p className="italic text-xs sm:text-sm line-clamp-3">
                        “{judgeState.selectedSpan.quote}”
                      </p>
                    </div>
                    {!lastResult && (
                      <button
                        type="button"
                        onClick={() => setJudgeState((prev) => (prev ? selectJudgeEvidence(prev, null) : prev))}
                        className="p-1 rounded cursor-pointer shrink-0"
                        style={{ color: 'var(--color-text-dim)' }}
                        aria-label="Xoá vật chứng đã chọn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className="p-3 rounded-[var(--radius-md)] border border-dashed text-xs leading-relaxed flex items-center gap-2"
                    style={{
                      borderColor: judgeState.noDirectInfo ? 'var(--color-partial)' : 'var(--color-border)',
                      backgroundColor: judgeState.noDirectInfo
                        ? 'color-mix(in srgb, var(--color-partial) 10%, var(--color-surface-2))'
                        : 'var(--color-surface-2)',
                      color: 'var(--color-text-dim)',
                    }}
                  >
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {judgeState.noDirectInfo
                        ? 'Đã chọn "Không tìm thấy thông tin trực tiếp" — chỉ được tuyên FALSE/NO hoặc NOT GIVEN.'
                        : 'Bôi đen câu làm bằng chứng trong hồ sơ bên trái (hoặc bật "Chọn câu" để chạm chọn cả câu).'}
                    </span>
                  </div>
                )}

                {!lastResult && (
                  <button
                    type="button"
                    onClick={() => {
                      setJudgeState((prev) => (prev ? toggleJudgeNoDirectInfo(prev) : prev));
                      playSfx('tap');
                    }}
                    aria-pressed={judgeState.noDirectInfo}
                    data-testid="r1-no-direct-info-btn"
                    className="w-full min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] border text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: judgeState.noDirectInfo
                        ? 'color-mix(in srgb, var(--color-partial) 18%, var(--color-surface))'
                        : 'var(--color-surface-2)',
                      borderColor: judgeState.noDirectInfo
                        ? 'var(--color-partial)'
                        : 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <SearchX className="w-4 h-4" />
                    <span>Không tìm thấy thông tin trực tiếp trong bài</span>
                  </button>
                )}
              </div>

              {/* STEP ②: VERDICT (Gavel animation scale 1 -> 0.92 -> 1, 0.12s) */}
              <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
                    ② Tuyên án
                  </span>
                  {!evidenceReady && !lastResult && (
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                      Hoàn thành bước ① để mở khoá
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {verdictOptions.map((opt) => {
                    const allowed = canSubmitJudgeVerdict(judgeState, opt.verdict);
                    const isGavelAnimating = gavelHitVerdict === opt.verdict && !prefersReduced;
                    const isChosen = lastResult?.userVerdict === opt.verdict;
                    const isExpected = lastResult?.expectedVerdict === opt.verdict;

                    let bg = 'var(--color-surface-2)';
                    let border = 'var(--color-border)';
                    let color = 'var(--color-text)';

                    if (lastResult) {
                      if (isExpected) {
                        bg = 'color-mix(in srgb, var(--color-correct) 18%, var(--color-surface))';
                        border = 'var(--color-correct)';
                      } else if (isChosen && !lastResult.answerCorrect) {
                        bg = 'color-mix(in srgb, var(--color-wrong) 18%, var(--color-surface))';
                        border = 'var(--color-wrong)';
                      }
                    } else if (allowed) {
                      bg = 'color-mix(in srgb, var(--color-reading) 12%, var(--color-surface))';
                      border = 'color-mix(in srgb, var(--color-reading) 45%, var(--color-border))';
                    }

                    return (
                      <motion.button
                        key={opt.verdict}
                        type="button"
                        disabled={!allowed}
                        animate={
                          isGavelAnimating
                            ? { scale: [1, 0.92, 1] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.12 }}
                        onClick={() => handleJudgeVerdict(opt.verdict)}
                        data-testid={`r1-verdict-${opt.verdict.replace(/\s+/g, '_')}`}
                        className="min-h-[48px] px-2.5 py-2.5 rounded-[var(--radius-md)] border text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        style={{ backgroundColor: bg, borderColor: border, color }}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <Gavel className="w-3.5 h-3.5 shrink-0" />
                          <span>{opt.label}</span>
                        </div>
                        <KeyHint keyName={opt.hotkey} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* JUDGE FEEDBACK PANEL (quote bôi vàng + trapType pill + steps + explanationVi + paraphrase SRS) */}
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  key={lastResult.qid}
                  variants={prefersReduced ? reducedRouteVariants : feedbackSlideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="rounded-[var(--radius-lg)] border p-5 space-y-4"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor:
                      lastResult.outcome === 'perfect'
                        ? 'var(--color-correct)'
                        : lastResult.outcome === 'lucky'
                          ? 'var(--color-partial)'
                          : 'var(--color-wrong)',
                    borderTopWidth: '3px',
                    boxShadow: 'var(--shadow-card)',
                  }}
                  role="region"
                  aria-live="polite"
                  data-testid="r1-feedback-panel"
                >
                  {/* Outcome header */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {lastResult.outcome === 'perfect' ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--color-correct)' }} />
                      ) : lastResult.outcome === 'lucky' ? (
                        <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-partial)' }} />
                      ) : (
                        <XCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-wrong)' }} />
                      )}
                      <div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                          {lastResult.outcomeLabelVi} — Đáp án: {lastResult.expectedVerdict}
                          {!lastResult.answerCorrect ? ` (bạn chọn ${lastResult.userVerdict})` : ''}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                          {lastResult.diagnosisVi}
                        </p>
                      </div>
                    </div>

                    <Pill
                      tone={
                        lastResult.outcome === 'perfect'
                          ? 'correct'
                          : lastResult.outcome === 'lucky'
                            ? 'partial'
                            : 'wrong'
                      }
                    >
                      +{lastResult.xpEarned} XP
                    </Pill>
                  </div>

                  {/* trapType pill */}
                  {lastResult.trapType && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="partial" icon={<ShieldAlert className="w-3.5 h-3.5" />}>
                        Bẫy: {lastResult.trapType}
                      </Pill>
                      <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                        {READING_TRAP_LABELS_VI[lastResult.trapType]}
                      </span>
                    </div>
                  )}

                  {/* Gold evidence quote (synced with yellow auto-scroll highlight in PassageView) */}
                  {lastResult.goldEvidence.length > 0 && (
                    <div
                      className="p-3 rounded-[var(--radius-sm)] border-l-4 text-sm italic reading-prose"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-partial) 12%, var(--color-surface-2))',
                        borderLeftColor: 'var(--color-partial)',
                        color: 'var(--color-text)',
                      }}
                    >
                      <div
                        className="text-xs font-sans font-bold not-italic mb-1"
                        style={{ color: 'var(--color-partial)' }}
                      >
                        Vật chứng chuẩn · Đoạn {lastResult.goldEvidence[0].paragraph}
                      </div>
                      “{lastResult.goldEvidence[0].quote}”
                    </div>
                  )}

                  {/* Vietnamese explanation */}
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                    {currentItem.question.explanationVi}
                  </p>

                  {/* Reasoning steps (2–4 steps) */}
                  {currentItem.question.steps && currentItem.question.steps.length > 0 && (
                    <div
                      className="p-3 rounded-[var(--radius-md)] border space-y-1.5"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <div className="text-xs font-bold" style={{ color: 'var(--color-text-dim)' }}>
                        Các bước suy luận:
                      </div>
                      <ol className="space-y-1 text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>
                        {currentItem.question.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span
                              className="font-bold shrink-0"
                              style={{ color: 'var(--color-reading)' }}
                            >
                              {CIRCLED_STEPS[i] ?? `${i + 1}.`}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Paraphrase SRS suggestions */}
                  {lastResult.paraphraseSuggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-info)' }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Cụm paraphrase đáng nhớ (thêm vào SRS):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lastResult.paraphraseSuggestions.map((s) => {
                          const added = Boolean(addedParaphraseIds[s.id]);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={added}
                              onClick={() => void handleAddParaphraseSrs(s)}
                              data-testid={`add-para-srs-${s.id}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] border text-xs cursor-pointer disabled:opacity-75"
                              style={{
                                backgroundColor: added
                                  ? 'color-mix(in srgb, var(--color-correct) 14%, var(--color-surface))'
                                  : 'var(--color-surface-2)',
                                borderColor: added ? 'var(--color-correct)' : 'var(--color-border)',
                                color: 'var(--color-text)',
                              }}
                            >
                              {added ? (
                                <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-correct)' }} />
                              ) : (
                                <Plus className="w-3.5 h-3.5" style={{ color: 'var(--color-info)' }} />
                              )}
                              <span>
                                “{s.sourcePhrase}” ↔ “{s.targetPhrase}”
                              </span>
                              <span
                                className="font-semibold"
                                style={{ color: added ? 'var(--color-correct)' : 'var(--color-info)' }}
                              >
                                {added ? 'Đã thêm' : '+ Ôn tập'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Retry card notice */}
                  {lastResult.retryCard && (
                    <div className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-dim)' }}>
                      <RotateCcw className="w-3 h-3" />
                      <span>
                        Đã tạo thẻ ôn lại <code style={{ fontFamily: 'var(--font-mono)' }}>{lastResult.retryCard.itemId}</code> (tự nghỉ sau 3 lần ôn đúng).
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      variant="primary"
                      skill="reading"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={handleJudgeNext}
                      data-testid="r1-next-question-btn"
                    >
                      {judgeState.currentIndex + 1 === judgeState.items.length
                        ? 'Xem tổng kết (Enter)'
                        : 'Câu tiếp theo (Enter)'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PassageView>
      </div>
    </div>
  );
};

export default R1TfngJudge;
