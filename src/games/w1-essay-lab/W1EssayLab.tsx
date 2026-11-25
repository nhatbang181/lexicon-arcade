import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  FileEdit,
  FolderKanban,
  Lightbulb,
  Pause,
  Play,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import type {
  ChartKind,
  EssayType,
  Topic,
  WritingTask1Prompt,
  WritingTask2Prompt,
} from '../../core/content/schemas';
import {
  isWritingResult,
  type PreviousIssueRef,
  type SrsFeedbackItem,
  type WritingCapOptions,
  type WritingCriteriaBands,
  type WritingResult,
} from '../../core/grading';
import { playSfx } from '../../core/audio/sfx';
import { registerProgressSaver } from '../../core/adaptive/progressSaver';
import type { EssayRecord } from '../../core/storage/db';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { bandRepo } from '../../core/storage/repos/bandRepo';
import { essayRepo, type EssayDraftRecord } from '../../core/storage/repos/essayRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import { userItemRepo } from '../../core/storage/repos/userItemRepo';
import { Button, Card, EmptyState, Modal, Pill, Skeleton, Toast } from '../../design/components';
import { ChartRenderer, GradingPanel, type GradingPanelGradedPayload } from '../_shared';
import type { GameProps } from '../registry';
import {
  advanceLifecycle,
  buildTask1Checklist,
  buildTask2Checklist,
  canReviseEssay,
  compareRevisionBands,
  computeEssayXp,
  createInitialLifecycle,
  createWritingPacketInput,
  detectPasteEvent,
  evaluateTimerWarning,
  evaluateWordCount,
  extractPreviousIssues,
  filterTask1Entries,
  filterTask2Prompts,
  formatClock,
  getMinWords,
  MAX_REVISIONS_PER_ESSAY,
  pickSuggestedTask2,
  scanCliches,
  type EssayLifecycleState,
  type EssayMode,
  type RevisionComparison,
  type WritingTaskType,
} from './engine';
import {
  loadCliches,
  loadTask1Index,
  loadTask1Prompt,
  loadTask2Prompts,
  type ClicheEntry,
  type Task1IndexEntry,
} from './writingLoader';

// ---------------------------------------------------------------------------
// Labels & Constants
// ---------------------------------------------------------------------------

const ESSAY_TYPE_LABELS: Record<EssayType, string> = {
  opinion: 'Opinion',
  discussion: 'Discussion',
  adv_disadv: 'Adv / Disadv',
  problem_solution: 'Problem / Solution',
  two_part: 'Two-part',
  positive_negative: 'Pos / Neg',
};

const CHART_KIND_LABELS: Record<ChartKind, string> = {
  bar: 'Bar chart',
  line: 'Line graph',
  pie: 'Pie chart',
  table: 'Table',
  mixed: 'Mixed',
  process: 'Process',
  map: 'Map',
};

const NOTE_CRITERION_COLOR: Record<'TR' | 'CC' | 'LR' | 'GRA', string> = {
  TR: 'var(--color-writing)',
  CC: 'var(--color-info)',
  LR: 'var(--color-vocab)',
  GRA: 'var(--color-correct)',
};

function makeSimpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

// ---------------------------------------------------------------------------
// Band 8.0 Model Viewer with Highlighted Notes
// ---------------------------------------------------------------------------

const Band8ModelViewer: React.FC<{
  taskType: WritingTaskType;
  task1Prompt: WritingTask1Prompt | null;
  task2Prompt: WritingTask2Prompt | null;
}> = ({ taskType, task1Prompt, task2Prompt }) => {
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);

  if (taskType === 'task1' && task1Prompt) {
    return (
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Award className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
            Bài mẫu Band 8.0 · Task 1 ({task1Prompt.band8Model.wordCount} từ)
          </h3>
        </div>

        <div
          className="rounded-[var(--radius-sm)] p-3 space-y-1.5 border"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-writing)' }}>
            Gợi ý câu Overview mẫu
          </p>
          {task1Prompt.overviewModels.map((ov, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
              {i + 1}. {ov}
            </p>
          ))}
        </div>

        <div
          className="reading-prose text-sm sm:text-base leading-relaxed whitespace-pre-line"
          style={{ color: 'var(--color-text)' }}
        >
          {task1Prompt.band8Model.text}
        </div>
      </Card>
    );
  }

  if (taskType === 'task2' && task2Prompt) {
    const { text, notes, wordCount } = task2Prompt.band8Model;
    const sortedNotes = [...notes].sort((a, b) => a.start - b.start);

    const segments: Array<{ text: string; noteIdx: number | null }> = [];
    let cursor = 0;
    sortedNotes.forEach((n, idx) => {
      const start = Math.max(cursor, Math.min(n.start, text.length));
      const end = Math.max(start, Math.min(n.end, text.length));
      if (start > cursor) {
        segments.push({ text: text.slice(cursor, start), noteIdx: null });
      }
      if (end > start) {
        segments.push({ text: text.slice(start, end), noteIdx: idx });
        cursor = end;
      }
    });
    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), noteIdx: null });
    }

    return (
      <Card padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Award className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
            Bài mẫu Band 8.0 · Task 2 ({wordCount} từ)
          </h3>
          <div className="flex items-center gap-2 text-xs">
            {(['TR', 'CC', 'LR', 'GRA'] as const).map((c) => (
              <span
                key={c}
                className="font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: NOTE_CRITERION_COLOR[c],
                  backgroundColor: 'var(--color-surface-2)',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div
            className="lg:col-span-8 reading-prose text-sm sm:text-base leading-relaxed whitespace-pre-line"
            style={{ color: 'var(--color-text)' }}
          >
            {segments.map((seg, i) => {
              if (seg.noteIdx === null) {
                return <React.Fragment key={i}>{seg.text}</React.Fragment>;
              }
              const note = sortedNotes[seg.noteIdx];
              const isSelected = activeNoteIdx === seg.noteIdx;
              const color = NOTE_CRITERION_COLOR[note.criterion];
              return (
                <mark
                  key={i}
                  onClick={() => setActiveNoteIdx(isSelected ? null : seg.noteIdx)}
                  className="cursor-pointer rounded px-0.5 transition-opacity"
                  style={{
                    backgroundColor: isSelected ? color : 'var(--color-surface-2)',
                    color: isSelected ? 'var(--color-bg)' : 'var(--color-text)',
                    borderBottom: `2px solid ${color}`,
                  }}
                  title={`[${note.criterion}] ${note.noteVi}`}
                >
                  {seg.text}
                </mark>
              );
            })}
          </div>

          <div className="lg:col-span-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-dim)' }}>
              Chú thích 4 tiêu chí ({sortedNotes.length})
            </p>
            {sortedNotes.map((note, idx) => {
              const isSelected = activeNoteIdx === idx;
              const color = NOTE_CRITERION_COLOR[note.criterion];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveNoteIdx(isSelected ? null : idx)}
                  className="w-full text-left p-2.5 rounded-[var(--radius-sm)] border text-xs space-y-1 cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? 'var(--color-surface-2)' : 'var(--color-surface)',
                    borderColor: isSelected ? color : 'var(--color-border)',
                    borderLeftWidth: '3px',
                    borderLeftColor: color,
                  }}
                >
                  <span className="font-mono font-bold" style={{ color }}>
                    {note.criterion}
                  </span>
                  <p style={{ color: 'var(--color-text-dim)' }}>{note.noteVi}</p>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }

  return null;
};

// ---------------------------------------------------------------------------
// Main Component: W1 Essay Lab
// ---------------------------------------------------------------------------

export const W1EssayLab: React.FC<GameProps> = ({ mode: initialMode, level, onExit }) => {
  const [, navigate] = useLocation();

  // Content state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [task2Prompts, setTask2Prompts] = useState<WritingTask2Prompt[]>([]);
  const [task1Entries, setTask1Entries] = useState<Task1IndexEntry[]>([]);
  const [cliches, setCliches] = useState<ClicheEntry[]>([]);
  const [completedPromptIds, setCompletedPromptIds] = useState<Set<string>>(new Set());

  // Selection & Filter state
  const [taskType, setTaskType] = useState<WritingTaskType>('task2');
  const [essayMode, setEssayMode] = useState<EssayMode>(
    initialMode === 'exam' ? 'exam' : 'training',
  );
  const [essayTypeFilter, setEssayTypeFilter] = useState<EssayType | 'all'>('all');
  const [chartKindFilter, setChartKindFilter] = useState<ChartKind | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState<Topic | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active writing session state
  const [lifecycle, setLifecycle] = useState<EssayLifecycleState>(() => createInitialLifecycle());
  const [activeTask1, setActiveTask1] = useState<WritingTask1Prompt | null>(null);
  const [activeTask2, setActiveTask2] = useState<WritingTask2Prompt | null>(null);
  const [loadingTask1Detail, setLoadingTask1Detail] = useState(false);

  const [essayText, setEssayText] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [showPlan, setShowPlan] = useState(false);
  const [showHelperBank, setShowHelperBank] = useState(false);
  const [showModel, setShowModel] = useState(false);

  // Timer & autosave
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<EssayDraftRecord | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pastedFlag, setPastedFlag] = useState(false);
  const [pasteWarning, setPasteWarning] = useState<string | null>(null);

  // Grading & Revision state
  const [attemptId, setAttemptId] = useState('');
  const [savedEssayId, setSavedEssayId] = useState<number | null>(null);
  const [v1EssayId, setV1EssayId] = useState<number | null>(null);
  const [v1Criteria, setV1Criteria] = useState<WritingCriteriaBands | null>(null);
  const [latestResult, setLatestResult] = useState<WritingResult | null>(null);
  const [previousIssues, setPreviousIssues] = useState<PreviousIssueRef[]>([]);
  const [revisionComparison, setRevisionComparison] = useState<RevisionComparison | null>(null);
  const [improvedRevisionsCount, setImprovedRevisionsCount] = useState(0);
  const [forcedShortSubmit, setForcedShortSubmit] = useState(false);
  const [devSampleResponse, setDevSampleResponse] = useState<string | undefined>(undefined);

  // Checklist & Toast
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [checklistAwarded, setChecklistAwarded] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const sessionStartRef = useRef<number>(Date.now());
  const elapsedSecRef = useRef<number>(0);
  const progressAttemptIdRef = useRef<number | null>(null);
  const firstGradeRecordedRef = useRef(false);
  const isRetryPromptRef = useRef(false);
  const examAutoSubmittedRef = useRef(false);
  const v1CapOptionsRef = useRef<WritingCapOptions | undefined>(undefined);
  const activeTask1FileRef = useRef<string | undefined>(undefined);

  // Sync mode when PlayScreen passes mode prop
  useEffect(() => {
    setEssayMode(initialMode === 'exam' ? 'exam' : 'training');
  }, [initialMode]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  // Load initial data + recoverable draft (W1-01)
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setLoadError(null);
      try {
        const [t2, t1Idx, clicheList, existingEssays, savedDraft] = await Promise.all([
          loadTask2Prompts(),
          loadTask1Index(),
          loadCliches(),
          essayRepo.list(),
          essayRepo.loadDraft(),
        ]);
        if (cancelled) return;
        setTask2Prompts(t2);
        setTask1Entries(t1Idx);
        setCliches(clicheList);
        setCompletedPromptIds(new Set(existingEssays.map((e) => e.promptId)));
        setPendingDraft(savedDraft);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Không tải được dữ liệu Writing.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Timer tick during writing / revising
  useEffect(() => {
    if (lifecycle.stage !== 'write' && lifecycle.stage !== 'revise') return;
    if (timerPaused && essayMode === 'training') return;

    const timer = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lifecycle.stage, timerPaused, essayMode]);

  // Derived values
  const wordEval = useMemo(() => evaluateWordCount(taskType, essayText), [taskType, essayText]);
  const timerEval = useMemo(
    () => evaluateTimerWarning(taskType, elapsedSec, essayMode),
    [taskType, elapsedSec, essayMode],
  );
  const clicheMatches = useMemo(() => scanCliches(essayText, cliches), [essayText, cliches]);

  // Keep latest elapsedSec in ref so autosave debounce isn't reset every 1s tick (W1-01)
  useEffect(() => {
    elapsedSecRef.current = elapsedSec;
  }, [elapsedSec]);

  // Helper: persist draft + in_progress attempt (W1-01, TU-02, F1)
  const persistDraftNow = useCallback(async () => {
    if (lifecycle.stage !== 'write' && lifecycle.stage !== 'revise') return;
    const promptId = taskType === 'task1' ? activeTask1?.id : activeTask2?.id;
    if (!promptId || !essayText.trim()) return;
    await essayRepo.saveDraft({
      taskType,
      promptId,
      task1File: activeTask1FileRef.current,
      mode: essayMode,
      text: essayText,
      planNotes,
      elapsedSec: elapsedSecRef.current,
      revisionNumber: lifecycle.revisionNumber,
      v1EssayId,
    });
    const now = new Date();
    setLastSavedTime(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
    );
    try {
      const res = await attemptRepo.saveProgress({
        attemptId: progressAttemptIdRef.current ?? undefined,
        attempt: {
          gameId: 'w1',
          mode: essayMode,
          startedAt: sessionStartRef.current,
          endedAt: Date.now(),
          score: 0,
          total: 1,
          xp: 0,
          items: [{ itemId: promptId, correct: false }],
        },
      });
      progressAttemptIdRef.current = res.attemptId;
    } catch {
      // Non-blocking progress fallback
    }
  }, [
    lifecycle.stage,
    lifecycle.revisionNumber,
    taskType,
    activeTask1,
    activeTask2,
    essayMode,
    essayText,
    planNotes,
    v1EssayId,
  ]);

  // Real debounced autosave into IndexedDB (W1-01)
  useEffect(() => {
    if ((lifecycle.stage !== 'write' && lifecycle.stage !== 'revise') || !essayText.trim()) return;
    const handle = window.setTimeout(() => {
      void persistDraftNow();
    }, 1200);
    return () => window.clearTimeout(handle);
  }, [essayText, planNotes, lifecycle.stage, persistDraftNow]);

  // Register progress saver for PlayScreen Esc modal + pagehide flush (TU-02, F1)
  useEffect(() => {
    if (lifecycle.stage !== 'write' && lifecycle.stage !== 'revise') return;
    const unregister = registerProgressSaver(() => persistDraftNow());
    const onPageHide = () => {
      void persistDraftNow();
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      unregister();
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [lifecycle.stage, persistDraftNow]);

  const checklistItems = useMemo(() => {
    if (taskType === 'task1' && activeTask1) {
      return buildTask1Checklist(activeTask1, essayText, clicheMatches);
    }
    if (taskType === 'task2' && activeTask2) {
      return buildTask2Checklist(activeTask2, essayText, clicheMatches);
    }
    return [];
  }, [taskType, activeTask1, activeTask2, essayText, clicheMatches]);

  const manualChecklistDone = useMemo(() => {
    const manual = checklistItems.filter((item) => !item.autoChecked);
    return manual.length > 0 && manual.every((item) => Boolean(checkedIds[item.id]));
  }, [checklistItems, checkedIds]);

  const availableTopics = useMemo(() => {
    const set = new Set<Topic>();
    if (taskType === 'task2') {
      task2Prompts.forEach((p) => set.add(p.topic));
    } else {
      task1Entries.forEach((e) => set.add(e.topic));
    }
    return Array.from(set).sort();
  }, [taskType, task2Prompts, task1Entries]);

  const filteredTask2 = useMemo(
    () =>
      filterTask2Prompts(task2Prompts, {
        essayType: essayTypeFilter,
        topic: topicFilter,
        search: searchQuery,
      }),
    [task2Prompts, essayTypeFilter, topicFilter, searchQuery],
  );

  const filteredTask1 = useMemo(
    () =>
      filterTask1Entries(task1Entries, {
        kind: chartKindFilter,
        topic: topicFilter,
        search: searchQuery,
      }),
    [task1Entries, chartKindFilter, topicFilter, searchQuery],
  );

  // Start a Task 2 prompt
  const startTask2 = useCallback((prompt: WritingTask2Prompt) => {
    setTaskType('task2');
    setActiveTask2(prompt);
    setActiveTask1(null);
    activeTask1FileRef.current = undefined;
    setEssayText('');
    setPlanNotes('');
    setElapsedSec(0);
    setTimerPaused(false);
    setLastSavedTime(null);
    setPastedFlag(false);
    setPasteWarning(null);
    setSavedEssayId(null);
    setV1EssayId(null);
    setV1Criteria(null);
    setLatestResult(null);
    setPreviousIssues([]);
    setRevisionComparison(null);
    setImprovedRevisionsCount(0);
    setForcedShortSubmit(false);
    setCheckedIds({});
    setChecklistAwarded(false);
    setShowModel(false);
    setShowHelperBank(false);
    setShowPlan(false);
    setAttemptId(`att-${prompt.id.replace(':', '-')}-${Date.now().toString(36)}`);
    sessionStartRef.current = Date.now();
    progressAttemptIdRef.current = null;
    firstGradeRecordedRef.current = false;
    isRetryPromptRef.current = completedPromptIds.has(prompt.id);
    examAutoSubmittedRef.current = false;
    v1CapOptionsRef.current = undefined;
    setLifecycle(advanceLifecycle(createInitialLifecycle(), 'start_writing'));
  }, [completedPromptIds]);

  // Start a Task 1 prompt
  const startTask1 = useCallback(async (entry: Task1IndexEntry) => {
    setLoadingTask1Detail(true);
    try {
      const fullPrompt = await loadTask1Prompt(entry.file);
      setTaskType('task1');
      setActiveTask1(fullPrompt);
      setActiveTask2(null);
      activeTask1FileRef.current = entry.file;
      setEssayText('');
      setPlanNotes('');
      setElapsedSec(0);
      setTimerPaused(false);
      setLastSavedTime(null);
      setPastedFlag(false);
      setPasteWarning(null);
      setSavedEssayId(null);
      setV1EssayId(null);
      setV1Criteria(null);
      setLatestResult(null);
      setPreviousIssues([]);
      setRevisionComparison(null);
      setImprovedRevisionsCount(0);
      setForcedShortSubmit(false);
      setCheckedIds({});
      setChecklistAwarded(false);
      setShowModel(false);
      setShowHelperBank(false);
      setShowPlan(false);
      setAttemptId(`att-${fullPrompt.id.replace(':', '-')}-${Date.now().toString(36)}`);
      sessionStartRef.current = Date.now();
      progressAttemptIdRef.current = null;
      firstGradeRecordedRef.current = false;
      isRetryPromptRef.current = completedPromptIds.has(fullPrompt.id);
      examAutoSubmittedRef.current = false;
      v1CapOptionsRef.current = undefined;
      setLifecycle(advanceLifecycle(createInitialLifecycle(), 'start_writing'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không tải được đề Task 1.');
    } finally {
      setLoadingTask1Detail(false);
    }
  }, [completedPromptIds, showToast]);

  // Resume saved draft (W1-01)
  const handleResumeDraft = useCallback(async () => {
    if (!pendingDraft) return;
    try {
      if (pendingDraft.taskType === 'task2') {
        const prompt = task2Prompts.find((p) => p.id === pendingDraft.promptId);
        if (!prompt) {
          showToast('Không tìm thấy đề Task 2 của bản nháp.');
          return;
        }
        setTaskType('task2');
        setActiveTask2(prompt);
        setActiveTask1(null);
        activeTask1FileRef.current = undefined;
      } else {
        const entry =
          task1Entries.find((e) => e.id === pendingDraft.promptId) ??
          (pendingDraft.task1File
            ? task1Entries.find((e) => e.file === pendingDraft.task1File)
            : undefined);
        const fileToLoad = pendingDraft.task1File ?? entry?.file;
        if (!fileToLoad) {
          showToast('Không tìm thấy đề Task 1 của bản nháp.');
          return;
        }
        setLoadingTask1Detail(true);
        const fullPrompt = await loadTask1Prompt(fileToLoad);
        setTaskType('task1');
        setActiveTask1(fullPrompt);
        setActiveTask2(null);
        activeTask1FileRef.current = fileToLoad;
      }

      setEssayMode(pendingDraft.mode);
      setEssayText(pendingDraft.text);
      setPlanNotes(pendingDraft.planNotes);
      setElapsedSec(pendingDraft.elapsedSec);
      setTimerPaused(false);
      setPastedFlag(false);
      setPasteWarning(null);
      setV1EssayId(pendingDraft.v1EssayId ?? null);
      setForcedShortSubmit(false);
      setAttemptId(`att-${pendingDraft.promptId.replace(':', '-')}-${Date.now().toString(36)}`);
      sessionStartRef.current = Date.now();
      progressAttemptIdRef.current = null;
      firstGradeRecordedRef.current = false;
      isRetryPromptRef.current = completedPromptIds.has(pendingDraft.promptId);
      examAutoSubmittedRef.current = false;
      setLifecycle({
        stage: pendingDraft.revisionNumber > 0 ? 'revise' : 'write',
        status: 'draft',
        revisionNumber: pendingDraft.revisionNumber,
        canReviseAgain: canReviseEssay(pendingDraft.revisionNumber),
      });
      setPendingDraft(null);
      showToast('Đã khôi phục bài nháp đang viết.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không khôi phục được bản nháp.');
    } finally {
      setLoadingTask1Detail(false);
    }
  }, [pendingDraft, task2Prompts, task1Entries, completedPromptIds, showToast]);

  const handleDiscardDraft = useCallback(async () => {
    await essayRepo.clearDraft();
    setPendingDraft(null);
    showToast('Đã xoá bản nháp cũ.');
  }, [showToast]);

  // Confirm before leaving editor with >20 words (W1-02)
  const handleRequestBackToSelect = useCallback(() => {
    if (wordEval.wordCount > 20) {
      setShowLeaveModal(true);
      return;
    }
    setLifecycle(createInitialLifecycle());
  }, [wordEval.wordCount]);

  const handleStartSuggested = useCallback(() => {
    if (taskType === 'task2') {
      const picked = pickSuggestedTask2(task2Prompts, completedPromptIds, level);
      if (picked) startTask2(picked);
    } else if (task1Entries.length > 0) {
      const unwritten = task1Entries.find((e) => !completedPromptIds.has(e.id)) ?? task1Entries[0];
      void startTask1(unwritten);
    }
  }, [taskType, task2Prompts, task1Entries, completedPromptIds, level, startTask2, startTask1]);

  // Handle paste detection in editor
  const handleEditorPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    const result = detectPasteEvent(pasted);
    if (result.isSuspiciousPaste) {
      setPastedFlag(true);
      setPasteWarning(result.warningVi);
    }
  }, []);

  // Submit essay (v1 or revision)
  const handleSubmitEssay = useCallback(async (options?: { forced?: boolean }) => {
    const promptId = taskType === 'task1' ? activeTask1?.id : activeTask2?.id;
    if (!promptId) return;
    if (!options?.forced && !wordEval.canGrade) return;

    const now = Date.now();
    const isRevision = lifecycle.revisionNumber > 0;
    const isForcedShort = Boolean(options?.forced && !wordEval.canGrade);
    setForcedShortSubmit(isForcedShort);

    const activeAttemptId = isRevision
      ? `att-${promptId.replace(':', '-')}-r${lifecycle.revisionNumber}-${now.toString(36)}`
      : attemptId || `att-${promptId.replace(':', '-')}-${now.toString(36)}`;
    if (isRevision) {
      setAttemptId(activeAttemptId);
    }

    const record: Omit<EssayRecord, 'id'> = {
      taskType,
      promptId,
      text: essayText.trim(),
      wordCount: wordEval.wordCount,
      revisionOfId: isRevision && v1EssayId ? v1EssayId : undefined,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const newId = await essayRepo.save(record);
      await essayRepo.saveMeta({
        essayId: newId,
        attemptId: activeAttemptId,
        pasted: pastedFlag,
        mode: essayMode,
        durationSec: elapsedSec,
        gradedFirstTime: false,
      });
      await essayRepo.clearDraft();
      setPendingDraft(null);
      setSavedEssayId(newId);
      if (!isRevision) {
        setV1EssayId(newId);
      }
      setCompletedPromptIds((prev) => new Set([...prev, promptId]));

      // Finalize session XP on initial submit (Exam = 0 XP, retry = 0 XP)
      if (!isRevision) {
        const xpBreakdown = computeEssayXp({
          meetsMinimum: wordEval.meetsMinimum,
          checklistCompleted: false,
          claudeGraded: false,
          improvedRevisionsCount: 0,
          mode: essayMode,
          onTime: !timerEval.isOvertime,
          pasted: pastedFlag,
          isRetry: isRetryPromptRef.current,
        });
        const sessionAttempt = {
          gameId: 'w1' as const,
          mode: essayMode,
          startedAt: sessionStartRef.current,
          endedAt: now,
          score: wordEval.meetsMinimum ? 1 : 0,
          total: 1,
          xp: xpBreakdown.totalXp,
          items: [{ itemId: promptId, correct: wordEval.meetsMinimum }],
        };
        if (progressAttemptIdRef.current !== null) {
          await attemptRepo.finalize(progressAttemptIdRef.current, { attempt: sessionAttempt });
        } else {
          await attemptRepo.saveSession({ attempt: sessionAttempt });
        }
        progressAttemptIdRef.current = null;
        if (essayMode === 'exam') {
          showToast(
            isForcedShort
              ? 'Đã hết giờ thi. Bài viết dưới 50 từ đã được lưu.'
              : 'Đã nộp bài thi. Tiếp tục tự chấm & nhờ Claude chấm.',
          );
        } else if (xpBreakdown.totalXp > 0) {
          showToast(`Đã lưu bài viết (+${xpBreakdown.totalXp} XP). Tiếp tục tự chấm & nhờ Claude chấm!`);
        } else {
          showToast('Đã lưu bài viết lại (0 XP). Tiếp tục tự chấm & nhờ Claude chấm!');
        }
      } else {
        showToast(`Đã lưu bản sửa v${lifecycle.revisionNumber + 1}. Copy gói chấm lại cho Claude!`);
      }

      setLifecycle((prev) =>
        advanceLifecycle(prev, isRevision ? 'submit_revision' : 'submit_draft'),
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi lưu bài vào IndexedDB.');
    }
  }, [
    taskType,
    activeTask1,
    activeTask2,
    lifecycle.revisionNumber,
    attemptId,
    essayText,
    wordEval,
    v1EssayId,
    essayMode,
    elapsedSec,
    timerEval.isOvertime,
    pastedFlag,
    showToast,
  ]);

  // Exam mode auto-submit on timeout (W1-03, SR-24)
  useEffect(() => {
    if (essayMode !== 'exam') return;
    if (lifecycle.stage !== 'write' && lifecycle.stage !== 'revise') return;
    if (timerEval.remainingSec > 0 || examAutoSubmittedRef.current) return;
    examAutoSubmittedRef.current = true;
    playSfx('timeup', { examMode: true });
    void handleSubmitEssay({ forced: true });
  }, [essayMode, lifecycle.stage, timerEval.remainingSec, handleSubmitEssay]);

  // Checklist completion bonus (Training only, non-retry only: SR-24, PP-C5)
  useEffect(() => {
    if (manualChecklistDone && !checklistAwarded && lifecycle.stage === 'review') {
      setChecklistAwarded(true);
      if (essayMode !== 'exam' && !isRetryPromptRef.current) {
        void profileRepo.getOrCreate().then((p) =>
          profileRepo.update({ xp: p.xp + 10 }),
        );
        showToast('Hoàn thành checklist tự chấm (+10 XP)!');
      } else {
        showToast('Đã hoàn thành checklist tự chấm.');
      }
    }
  }, [manualChecklistDone, checklistAwarded, lifecycle.stage, essayMode, showToast]);

  // Build grading packet input for GradingPanel
  const packetInput = useMemo(() => {
    return createWritingPacketInput({
      attemptId: attemptId || `att-w1-${Date.now()}`,
      taskType,
      mode: essayMode,
      essayText,
      durationSec: elapsedSec,
      task1Prompt: activeTask1,
      task2Prompt: activeTask2,
      previousIssues,
      revisionNumber: lifecycle.revisionNumber,
    });
  }, [
    attemptId,
    taskType,
    essayMode,
    essayText,
    elapsedSec,
    activeTask1,
    activeTask2,
    previousIssues,
    lifecycle.revisionNumber,
  ]);

  // DEV-only sample Claude response (W1-04, SR-73: tree-shaken out of production bundle)
  useEffect(() => {
    if (!import.meta.env.DEV) {
      setDevSampleResponse(undefined);
      return;
    }
    let cancelled = false;
    void import('../../test/fixtures/grading').then((mod) => {
      if (cancelled) return;
      const base = taskType === 'task1' ? mod.TASK1_CLAUDE_RESPONSE : mod.TASK2_CLAUDE_RESPONSE;
      setDevSampleResponse(
        base.replace(/"attemptId"\s*:\s*"[^"]+"/, `"attemptId": "${packetInput.attemptId}"`),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [taskType, packetInput.attemptId]);

  // Add SRS card + userItem content from GradingPanel feedback (W1-07, PP-11)
  const upsertWritingSrsItem = useCallback(async (item: SrsFeedbackItem) => {
    const isError = item.kind === 'error';
    const prefix = isError ? 'err' : 'col';
    const face = isError ? 'err_fix' : 'col_gap';
    const itemId = `${prefix}:user_${makeSimpleHash(item.front + item.back)}`;
    await userItemRepo.upsertWithCard(
      {
        id: itemId,
        kind: isError ? 'error' : 'collocation',
        front: item.front,
        back: item.back,
        noteVi: item.noteVi ?? (isError ? 'Lỗi Writing từ Claude feedback' : 'Cụm từ học thuật từ bài viết'),
        source: 'w1',
      },
      face,
      {
        unlocked: true,
        cardSource: 'essay_feedback',
      },
    );
  }, []);

  const handleAddSrsItem = useCallback(
    async (item: SrsFeedbackItem) => {
      await upsertWritingSrsItem(item);
      showToast(`Đã thêm "${item.front}" vào hàng đợi ôn tập SRS!`);
    },
    [upsertWritingSrsItem, showToast],
  );

  // Handle Claude result pasted & validated in GradingPanel (W1-05, W1-08, G-01..G-03, PP-16)
  const handleGraded = useCallback(
    async (payload: GradingPanelGradedPayload) => {
      const result = payload.postcheck.cleanedResult;
      if (!isWritingResult(result)) return;

      const criteriaBands: WritingCriteriaBands = {
        TR_TA: result.criteria.TR_TA.band,
        CC: result.criteria.CC.band,
        LR: result.criteria.LR.band,
        GRA: result.criteria.GRA.band,
      };
      const overallBand = payload.postcheck.computedOverallBand ?? 6.0;
      const currentCapOptions: WritingCapOptions = {
        kind: taskType,
        wordCount: payload.postcheck.appWordCount,
        relevance: result.relevance,
        overviewPresent: result.task1?.overviewPresent ?? true,
      };

      setLatestResult(result);

      // Persist Claude result to essayRepo
      if (savedEssayId) {
        await essayRepo.update(savedEssayId, {
          claudeResult: {
            overallBand,
            criteria: criteriaBands,
            promptVersion: result.promptVersion,
            rawJson: JSON.stringify(result),
          },
        });
      }

      // Record band evidence ONLY on first grading of v1, non-pasted, non-retry, and postcheck allowed (W1-05, PP-16 / SR-89)
      const canRecordBand =
        !pastedFlag &&
        payload.postcheck.allowBandEvidence &&
        lifecycle.revisionNumber === 0 &&
        !firstGradeRecordedRef.current &&
        !isRetryPromptRef.current;

      if (canRecordBand) {
        firstGradeRecordedRef.current = true;
        await bandRepo.add({
          skill: 'W',
          mode: essayMode === 'exam' ? 'exam' : 'training',
          ts: Date.now(),
          band: overallBand,
          taskType,
          sourceGameId: 'w1',
        });
        if (savedEssayId) {
          await essayRepo.saveMeta({
            essayId: savedEssayId,
            attemptId: packetInput.attemptId,
            pasted: pastedFlag,
            mode: essayMode,
            durationSec: elapsedSec,
            gradedFirstTime: true,
          });
        }
      }

      // Auto-add error SRS items into userItems + cards (W1-08, PP-11)
      const errorItems = result.srsItems.filter((item) => item.kind === 'error');
      for (const errItem of errorItems) {
        await upsertWritingSrsItem(errItem);
      }

      // Compare v1 vs v2 with capOptions (G-03)
      let bonusXp = essayMode === 'exam' || isRetryPromptRef.current ? 0 : 20;
      if (lifecycle.revisionNumber === 0) {
        setV1Criteria(criteriaBands);
        v1CapOptionsRef.current = currentCapOptions;
      } else if (v1Criteria) {
        const comp = compareRevisionBands(
          v1Criteria,
          criteriaBands,
          taskType,
          v1CapOptionsRef.current,
          currentCapOptions,
        );
        setRevisionComparison(comp);
        if (comp.improvedCount > 0) {
          setImprovedRevisionsCount((c) => c + 1);
          if (essayMode !== 'exam' && !isRetryPromptRef.current) {
            bonusXp += 30;
          }
        }
      }

      if (bonusXp > 0) {
        const profile = await profileRepo.getOrCreate();
        await profileRepo.update({ xp: profile.xp + bonusXp });
      }

      setLifecycle((prev) => advanceLifecycle(prev, 'grade_received'));
      showToast(
        bonusXp > 0
          ? `Đã lưu kết quả ước lượng Band ${overallBand.toFixed(1)} (+${bonusXp} XP)!`
          : `Đã lưu kết quả ước lượng Band ${overallBand.toFixed(1)}.`,
      );
    },
    [
      savedEssayId,
      pastedFlag,
      essayMode,
      taskType,
      lifecycle.revisionNumber,
      v1Criteria,
      packetInput.attemptId,
      elapsedSec,
      upsertWritingSrsItem,
      showToast,
    ],
  );

  // Start Revision (v2 / v3)
  const handleStartRevision = useCallback(() => {
    if (!canReviseEssay(lifecycle.revisionNumber)) return;
    if (latestResult) {
      setPreviousIssues(extractPreviousIssues(latestResult));
    }
    setElapsedSec(0);
    setTimerPaused(false);
    setLifecycle((prev) => advanceLifecycle(prev, 'start_revision'));
  }, [lifecycle.revisionNumber, latestResult]);

  // -------------------------------------------------------------------------
  // Render: Loading / Error
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <EmptyState
          title="Không tải được kho đề Essay Lab"
          description={loadError}
          action={
            <Button variant="primary" skill="writing" onClick={() => onExit()}>
              Quay lại Hub
            </Button>
          }
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render Stage 1: Prompt Selector
  // -------------------------------------------------------------------------

  if (lifecycle.stage === 'select') {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill tone="writing" size="sm">
                W1 · Essay Lab
              </Pill>
              <Pill tone="neutral" size="sm">
                {task2Prompts.length} Task 2 · {task1Entries.length} Task 1
              </Pill>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Phòng luyện viết Academic & Chấm Claude
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
              Viết dưới áp lực giờ thi, bắt cụm sáo rỗng theo thời gian thực, sao chép gói chấm gửi Claude và sửa bài để xem mức tăng điểm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<FolderKanban className="w-4 h-4" />}
              onClick={() => navigate('/portfolio')}
            >
              Portfolio & Điểm thật
            </Button>
            <Button
              variant="primary"
              skill="writing"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleStartSuggested}
            >
              Đề gợi ý hôm nay
            </Button>
          </div>
        </div>

        {/* Draft Recovery Banner (W1-01) */}
        {pendingDraft && (
          <Card padding="md" className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="writing" size="sm">
                  Nháp chưa nộp
                </Pill>
                <span className="text-xs font-mono" style={{ color: 'var(--color-text-dim)' }}>
                  {pendingDraft.taskType === 'task1' ? 'Task 1' : 'Task 2'} · {pendingDraft.promptId} ·{' '}
                  {evaluateWordCount(pendingDraft.taskType, pendingDraft.text).wordCount} từ ·{' '}
                  {formatClock(pendingDraft.elapsedSec)}
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Tiếp tục bài đang viết?
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" skill="writing" size="sm" onClick={() => void handleResumeDraft()}>
                Tiếp tục viết
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void handleDiscardDraft()}>
                Xoá nháp
              </Button>
            </div>
          </Card>
        )}

        {/* Task & Mode Switcher */}
        <Card padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex flex-wrap rounded-[var(--radius-md)] p-1 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <button
                type="button"
                onClick={() => {
                  setTaskType('task2');
                  setTopicFilter('all');
                }}
                className="min-h-[44px] px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: taskType === 'task2' ? 'var(--color-writing)' : 'transparent',
                  color: taskType === 'task2' ? 'var(--color-on-accent, #0f172a)' : 'var(--color-text-dim)',
                }}
              >
                Task 2 · Essay ({task2Prompts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaskType('task1');
                  setTopicFilter('all');
                }}
                className="min-h-[44px] px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: taskType === 'task1' ? 'var(--color-writing)' : 'transparent',
                  color: taskType === 'task1' ? 'var(--color-on-accent, #0f172a)' : 'var(--color-text-dim)',
                }}
              >
                Task 1 · Visual ({task1Entries.length})
              </button>
            </div>

            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                Chế độ:
              </span>
              {(['training', 'exam'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEssayMode(m)}
                  className="min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold border cursor-pointer"
                  style={{
                    backgroundColor: essayMode === m ? 'var(--color-surface-2)' : 'transparent',
                    borderColor: essayMode === m ? 'var(--color-writing)' : 'var(--color-border)',
                    color: essayMode === m ? 'var(--color-writing)' : 'var(--color-text-dim)',
                  }}
                >
                  {m === 'training' ? 'Luyện tập (có gợi ý)' : 'Thi thử (Exam)'}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            {taskType === 'task2' ? (
              <>
                <button
                  type="button"
                  onClick={() => setEssayTypeFilter('all')}
                  className="min-h-[44px] px-3 py-2 rounded-full text-xs font-medium border cursor-pointer"
                  style={{
                    backgroundColor: essayTypeFilter === 'all' ? 'var(--color-writing)' : 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: essayTypeFilter === 'all' ? 'var(--color-on-accent, #0f172a)' : 'var(--color-text-dim)',
                  }}
                >
                  Tất cả dạng
                </button>
                {(Object.keys(ESSAY_TYPE_LABELS) as EssayType[]).map((et) => (
                  <button
                    key={et}
                    type="button"
                    onClick={() => setEssayTypeFilter(et)}
                    className="min-h-[44px] px-3 py-2 rounded-full text-xs font-medium border cursor-pointer"
                    style={{
                      backgroundColor: essayTypeFilter === et ? 'var(--color-writing)' : 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                      color: essayTypeFilter === et ? 'var(--color-on-accent, #0f172a)' : 'var(--color-text-dim)',
                    }}
                  >
                    {ESSAY_TYPE_LABELS[et]}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setChartKindFilter('all')}
                  className="min-h-[44px] px-3 py-2 rounded-full text-xs font-medium border cursor-pointer"
                  style={{
                    backgroundColor: chartKindFilter === 'all' ? 'var(--color-writing)' : 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: chartKindFilter === 'all' ? 'var(--color-on-accent, #0f172a)' : 'var(--color-text-dim)',
                  }}
                >
                  Tất cả biểu đồ
                </button>
                {(Object.keys(CHART_KIND_LABELS) as ChartKind[]).map((ck) => (
                  <button
                    key={ck}
                    type="button"
                    onClick={() => setChartKindFilter(ck)}
                    className="min-h-[44px] px-3 py-2 rounded-full text-xs font-medium border cursor-pointer"
                    style={{
                      backgroundColor: chartKindFilter === ck ? 'var(--color-writing)' : 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                      color: chartKindFilter === ck ? 'var(--color-on-accent, #0f172a)' : 'var(--color-text-dim)',
                    }}
                  >
                    {CHART_KIND_LABELS[ck]}
                  </button>
                ))}
              </>
            )}

            <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value as Topic | 'all')}
                  className="appearance-none min-h-[44px] w-full sm:w-auto text-xs pl-3 pr-9 py-2 rounded-[var(--radius-sm)] border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Lọc theo chủ đề"
                >
                  <option value="all">Mọi chủ đề</option>
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-4 h-4 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-dim)' }}
                  aria-hidden="true"
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-faint)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm đề..."
                  className="min-h-[44px] text-xs pl-9 pr-3 py-2 rounded-[var(--radius-sm)] border w-full sm:w-48"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Prompt Grid */}
        {loadingTask1Detail && (
          <div className="text-xs font-mono" style={{ color: 'var(--color-writing)' }}>
            Đang tải chi tiết biểu đồ Task 1...
          </div>
        )}

        {taskType === 'task2' ? (
          filteredTask2.length === 0 ? (
            <EmptyState
              title="Không có đề Task 2 khớp bộ lọc"
              description="Thử xoá từ khoá tìm kiếm hoặc chọn lại dạng bài."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTask2.map((p) => {
                const done = completedPromptIds.has(p.id);
                return (
                  <Card key={p.id} padding="md" className="flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-text-faint)' }}>
                          {p.id}
                        </span>
                        <Pill tone="writing" size="sm">
                          {ESSAY_TYPE_LABELS[p.essayType]}
                        </Pill>
                        <Pill tone="neutral" size="sm">
                          {p.topic}
                        </Pill>
                        <Pill tone="neutral" size="sm">
                          Lv.{p.difficulty}
                        </Pill>
                        {done && (
                          <Pill tone="correct" size="sm">
                            Đã viết
                          </Pill>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                        {p.prompt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                        ≥ 250 từ · 40 phút
                      </span>
                      <Button
                        variant="primary"
                        skill="writing"
                        size="md"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={() => startTask2(p)}
                      >
                        Viết đề này
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        ) : filteredTask1.length === 0 ? (
          <EmptyState
            title="Không có đề Task 1 khớp bộ lọc"
            description="Thử xoá từ khoá hoặc chọn lại loại biểu đồ."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTask1.map((entry) => {
              const done = completedPromptIds.has(entry.id);
              return (
                <Card key={entry.id} padding="md" className="flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-text-faint)' }}>
                        {entry.id}
                      </span>
                      <Pill tone="writing" size="sm">
                        {CHART_KIND_LABELS[entry.kind]}
                      </Pill>
                      <Pill tone="neutral" size="sm">
                        {entry.topic}
                      </Pill>
                      <Pill tone="neutral" size="sm">
                        Lv.{entry.difficulty}
                      </Pill>
                      {done && (
                        <Pill tone="correct" size="sm">
                          Đã viết
                        </Pill>
                      )}
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                      {entry.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                      {entry.promptPreview}...
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                      ≥ 150 từ · 20 phút · {entry.keyFeatureCount} key features
                    </span>
                    <Button
                      variant="primary"
                      skill="writing"
                      size="md"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => void startTask1(entry)}
                    >
                      Viết đề này
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {toastMsg && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Toast title={toastMsg} tone="info" onDismiss={() => setToastMsg(null)} />
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render Stage 2: Write / Revise Workspace
  // -------------------------------------------------------------------------

  const currentPromptText =
    taskType === 'task1' ? (activeTask1?.prompt ?? '') : (activeTask2?.prompt ?? '');
  const minWords = getMinWords(taskType);

  const wordColor =
    wordEval.status === 'ok'
      ? 'var(--color-correct)'
      : wordEval.status === 'under_min'
        ? 'var(--color-partial)'
        : 'var(--color-text-faint)';

  const timerColor =
    timerEval.warningLevel === 'overtime' || timerEval.warningLevel === 'one_min'
      ? 'var(--color-wrong)'
      : timerEval.warningLevel === 'five_min'
        ? 'var(--color-partial)'
        : 'var(--color-text)';

  if (lifecycle.stage === 'write' || lifecycle.stage === 'revise') {
    const isRevising = lifecycle.stage === 'revise';
    return (
      <div
        className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4"
        data-mode={essayMode === 'exam' ? 'exam' : undefined}
      >
        {/* Top Editorial Toolbar */}
        <div
          className="rounded-[var(--radius-md)] border px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={handleRequestBackToSelect}
            >
              Chọn đề khác
            </Button>
            <Pill tone="writing" size="sm">
              {taskType === 'task1' ? 'Task 1' : 'Task 2'}
            </Pill>
            <Pill tone={essayMode === 'exam' ? 'wrong' : 'info'} size="sm">
              {essayMode === 'exam' ? 'Exam' : 'Training'}
            </Pill>
            {isRevising && (
              <Pill tone="vocab" size="sm">
                Bản sửa v{lifecycle.revisionNumber + 1}/{MAX_REVISIONS_PER_ESSAY + 1}
              </Pill>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: timerColor }} />
              <span
                className="font-mono text-sm font-bold tabular-nums"
                style={{ color: timerColor }}
                title={timerEval.messageVi ?? undefined}
              >
                {essayMode === 'exam'
                  ? formatClock(Math.max(0, timerEval.remainingSec))
                  : `${formatClock(elapsedSec)} / ${formatClock(timerEval.recommendedSec)}`}
              </span>
              {essayMode === 'training' && (
                <button
                  type="button"
                  onClick={() => setTimerPaused((p) => !p)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-dim)',
                  }}
                  aria-label={timerPaused ? 'Tiếp tục đồng hồ' : 'Tạm dừng đồng hồ'}
                >
                  {timerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Live Word Counter */}
            <div
              className="px-3 py-1 rounded-[var(--radius-sm)] border font-mono text-sm font-bold tabular-nums"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: wordEval.meetsMinimum ? 'var(--color-correct)' : 'var(--color-border)',
                color: wordColor,
              }}
            >
              {wordEval.wordCount} / {minWords} từ
            </div>
          </div>
        </div>

        {/* Warnings */}
        {timerEval.messageVi && (
          <div
            className="rounded-[var(--radius-sm)] border px-3 py-2 text-xs flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: timerColor,
              color: timerColor,
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{timerEval.messageVi}</span>
          </div>
        )}

        {pasteWarning && (
          <div
            className="rounded-[var(--radius-sm)] border px-3 py-2 text-xs flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              borderColor: 'var(--color-wrong)',
              color: 'var(--color-wrong)',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{pasteWarning}</span>
          </div>
        )}

        {/* Revision guidance banner */}
        {isRevising && previousIssues.length > 0 && (
          <Card padding="sm" className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-writing)' }}>
              Các lỗi từ bản trước cần sửa ({previousIssues.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {previousIssues.slice(0, 6).map((iss, idx) => (
                <div
                  key={idx}
                  className="text-xs p-2.5 rounded-[var(--radius-sm)] border space-y-1"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="font-mono font-semibold" style={{ color: 'var(--color-wrong)' }}>
                    [{iss.criterion}] &ldquo;{iss.quote}&rdquo;
                  </div>
                  <div style={{ color: 'var(--color-text-dim)' }}>{iss.problemVi}</div>
                  <div className="font-mono" style={{ color: 'var(--color-correct)' }}>
                    → {iss.fix}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Main Writing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left pane: Task 1 Visual or Task 2 Prompt */}
          <div className={taskType === 'task1' ? 'lg:col-span-5 space-y-4' : 'lg:col-span-8 space-y-4'}>
            <Card padding="md" className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-writing)' }}>
                  Đề bài ({taskType === 'task1' ? activeTask1?.id : activeTask2?.id})
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                  Write at least {minWords} words.
                </span>
              </div>
              <p className="text-sm sm:text-base leading-relaxed font-medium" style={{ color: 'var(--color-text)' }}>
                {currentPromptText}
              </p>
            </Card>

            {taskType === 'task1' && activeTask1 && (
              <ChartRenderer visual={activeTask1} kind={activeTask1.kind} compact />
            )}

            {/* Task 2 Editor sits here inside the 8-col main area */}
            {taskType === 'task2' && (
              <div className="space-y-3">
                {essayMode === 'training' && showPlan && (
                  <Card padding="sm" className="space-y-2">
                    <label
                      htmlFor="w1-plan-box"
                      className="text-xs font-bold uppercase tracking-wide block"
                      style={{ color: 'var(--color-info)' }}
                    >
                      Khung dàn ý nhanh (Position → Body 1 → Body 2 → Conclusion)
                    </label>
                    <textarea
                      id="w1-plan-box"
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                      rows={3}
                      placeholder="Position: ...&#10;Body 1: ... (Example: ...)&#10;Body 2: ..."
                      className="w-full rounded-[var(--radius-sm)] border p-2.5 text-xs font-mono resize-y"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </Card>
                )}

                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  onPaste={handleEditorPaste}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  rows={16}
                  placeholder="Bắt đầu viết bài Task 2 tại đây (tối thiểu 250 từ)..."
                  className="w-full rounded-[var(--radius-md)] border p-5 text-[17px] leading-relaxed resize-y focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-ui)',
                  }}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                    {lastSavedTime ? `Đã lưu nháp lúc ${lastSavedTime}` : 'Tự động lưu nháp khi gõ'}
                  </span>
                  <div className="flex items-center gap-2">
                    {essayMode === 'training' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPlan((v) => !v)}
                        >
                          {showPlan ? 'Ẩn dàn ý' : 'Khung dàn ý'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Lightbulb className="w-4 h-4" />}
                          onClick={() => setShowHelperBank((v) => !v)}
                        >
                          {showHelperBank ? 'Ẩn Idea Bank' : 'Idea Bank'}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="primary"
                      skill="writing"
                      disabled={!wordEval.canGrade}
                      onClick={() => void handleSubmitEssay()}
                    >
                      {isRevising
                        ? `Nộp bản sửa v${lifecycle.revisionNumber + 1}`
                        : 'Nộp bài & Chấm'}
                    </Button>
                  </div>
                </div>
                {!wordEval.canGrade && (
                  <p className="text-xs text-right" style={{ color: 'var(--color-text-faint)' }}>
                    Cần ít nhất {wordEval.minGradingWords} từ để tạo gói chấm.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right pane: Task 1 Editor OR Task 2 Cliché + Idea Bank sidebar */}
          <div className={taskType === 'task1' ? 'lg:col-span-7 space-y-4' : 'lg:col-span-4 space-y-4'}>
            {taskType === 'task1' && (
              <div className="space-y-3">
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  onPaste={handleEditorPaste}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  rows={14}
                  placeholder="Bắt đầu viết báo cáo Task 1 tại đây (Introduction → Overview → Body 1 & 2, tối thiểu 150 từ)..."
                  className="w-full rounded-[var(--radius-md)] border p-5 text-[17px] leading-relaxed resize-y focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-ui)',
                  }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                    {lastSavedTime ? `Đã lưu nháp lúc ${lastSavedTime}` : 'Tự động lưu nháp khi gõ'}
                  </span>
                  <div className="flex items-center gap-2">
                    {essayMode === 'training' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Lightbulb className="w-4 h-4" />}
                        onClick={() => setShowHelperBank((v) => !v)}
                      >
                        {showHelperBank ? 'Ẩn Key Features' : 'Key Features'}
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      skill="writing"
                      disabled={!wordEval.canGrade}
                      onClick={() => void handleSubmitEssay()}
                    >
                      {isRevising
                        ? `Nộp bản sửa v${lifecycle.revisionNumber + 1}`
                        : 'Nộp bài & Chấm'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Cliché Warning Panel */}
            <Card padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <AlertTriangle
                    className="w-4 h-4"
                    style={{
                      color:
                        clicheMatches.length > 0
                          ? 'var(--color-partial)'
                          : 'var(--color-correct)',
                    }}
                  />
                  Cảnh báo Cliché
                </h3>
                <Pill tone={clicheMatches.length > 0 ? 'partial' : 'correct'} size="sm">
                  {clicheMatches.length === 0 ? 'Sạch' : `${clicheMatches.length} cụm`}
                </Pill>
              </div>

              {clicheMatches.length === 0 ? (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                  Chưa phát hiện cụm sáo rỗng nào. Trình quét kiểm tra tự động {cliches.length} cụm mẫu bị giám khảo trừ điểm.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {clicheMatches.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-[var(--radius-sm)] border p-2.5 space-y-1.5"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor:
                          m.severity === 'high' ? 'var(--color-wrong)' : 'var(--color-partial)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-wrong)' }}>
                          &ldquo;{m.matchedText}&rdquo;
                        </span>
                        {m.count > 1 && (
                          <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
                            ×{m.count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                        {m.whyAvoidVi}
                      </p>
                      <div className="space-y-1 pt-1">
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-correct)' }}>
                          Gợi ý Band 8.0:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {m.betterAlternatives.map((alt) => (
                            <span
                              key={alt}
                              className="text-xs font-mono px-1.5 py-0.5 rounded border"
                              style={{
                                backgroundColor: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text)',
                              }}
                            >
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Idea Bank (Task 2) / Key Features (Task 1) in Training Mode */}
            {essayMode === 'training' && showHelperBank && (
              <Card padding="md" className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <Lightbulb className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
                  {taskType === 'task2' ? 'Idea Bank (Ngân hàng ý)' : 'Key Features cần nêu'}
                </h3>

                {taskType === 'task2' && activeTask2 && (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {activeTask2.ideaBank.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-[var(--radius-sm)] border p-2.5 space-y-1 text-xs"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        <Pill tone={item.side === 'against' ? 'partial' : 'info'} size="sm">
                          {item.side}
                        </Pill>
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                          {item.idea}
                        </p>
                        <p style={{ color: 'var(--color-text-dim)' }}>{item.develop}</p>
                      </div>
                    ))}
                  </div>
                )}

                {taskType === 'task1' && activeTask1 && (
                  <div className="space-y-2">
                    {activeTask1.keyFeatures.map((kf) => (
                      <div
                        key={kf.id}
                        className="rounded-[var(--radius-sm)] border p-2.5 space-y-1 text-xs"
                        style={{
                          backgroundColor: 'var(--color-surface-2)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Pill tone={kf.mustMention ? 'writing' : 'neutral'} size="sm">
                            {kf.kind}
                          </Pill>
                          {kf.mustMention && (
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-writing)' }}>
                              Bắt buộc
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--color-text)' }}>{kf.textEn}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        <Modal
          open={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          title="Bỏ bài đang viết?"
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
              Bạn đã viết {wordEval.wordCount} từ. Bạn có thể lưu nháp để viết tiếp sau hoặc bỏ bài này.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowLeaveModal(false)}>
                Tiếp tục viết
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await persistDraftNow();
                  const latest = await essayRepo.loadDraft();
                  setPendingDraft(latest);
                  setShowLeaveModal(false);
                  setLifecycle(createInitialLifecycle());
                }}
              >
                Lưu nháp & chọn đề khác
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  await essayRepo.clearDraft();
                  setPendingDraft(null);
                  setShowLeaveModal(false);
                  setLifecycle(createInitialLifecycle());
                }}
              >
                Bỏ bài
              </Button>
            </div>
          </div>
        </Modal>

        {toastMsg && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Toast title={toastMsg} tone="info" onDismiss={() => setToastMsg(null)} />
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render Stage 3: Review, Checklist, GradingPanel, v1 vs v2 Comparison & Model
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="writing" size="sm">
              {taskType === 'task1' ? 'Task 1' : 'Task 2'}
            </Pill>
            <Pill tone={wordEval.meetsMinimum ? 'correct' : 'partial'} size="sm">
              {wordEval.wordCount} từ
            </Pill>
            <Pill tone="neutral" size="sm">
              {formatClock(elapsedSec)}
            </Pill>
            {lifecycle.revisionNumber > 0 && (
              <Pill tone="vocab" size="sm">
                Bản sửa v{lifecycle.revisionNumber + 1}
              </Pill>
            )}
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {lifecycle.stage === 'graded'
              ? 'Báo cáo chấm bài & Nâng cấp'
              : 'Đã nộp bài · Tự chấm & Chấm với Claude'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={showModel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            onClick={() => setShowModel((v) => !v)}
          >
            {showModel ? 'Ẩn bài mẫu Band 8.0' : 'Xem bài mẫu Band 8.0'}
          </Button>
          {lifecycle.stage === 'graded' && canReviseEssay(lifecycle.revisionNumber) && (
            <Button
              variant="primary"
              skill="writing"
              size="sm"
              leftIcon={<FileEdit className="w-4 h-4" />}
              onClick={handleStartRevision}
            >
              Sửa bài (v{lifecycle.revisionNumber + 2}) & Chấm lại
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FolderKanban className="w-4 h-4" />}
            onClick={() => navigate('/portfolio')}
          >
            Portfolio
          </Button>
        </div>
      </div>

      {/* v1 vs v2 Comparison Card */}
      {revisionComparison && (
        <Card padding="md" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-correct)' }} />
              So sánh Bản 1 vs Bản {lifecycle.revisionNumber + 1}
            </h3>
            <Pill
              tone={
                revisionComparison.overallDelta > 0
                  ? 'correct'
                  : revisionComparison.overallDelta < 0
                    ? 'wrong'
                    : 'neutral'
              }
              size="sm"
            >
              Overall: {revisionComparison.overallV1.toFixed(1)} →{' '}
              {revisionComparison.overallV2.toFixed(1)} (
              {revisionComparison.overallDelta >= 0 ? '+' : ''}
              {revisionComparison.overallDelta.toFixed(1)})
            </Pill>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-correct)' }}>
            {revisionComparison.winMessageVi}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['TR_TA', 'CC', 'LR', 'GRA'] as const).map((key) => {
              const d = revisionComparison.criteriaDeltas[key];
              const deltaColor =
                d.delta > 0
                  ? 'var(--color-correct)'
                  : d.delta < 0
                    ? 'var(--color-wrong)'
                    : 'var(--color-text-dim)';
              return (
                <div
                  key={key}
                  className="rounded-[var(--radius-sm)] border p-3 text-center space-y-1"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: d.delta > 0 ? 'var(--color-correct)' : 'var(--color-border)',
                  }}
                >
                  <div className="text-xs font-mono font-bold" style={{ color: 'var(--color-text-dim)' }}>
                    {key === 'TR_TA' ? (taskType === 'task1' ? 'TA' : 'TR') : key}
                  </div>
                  <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {d.v1.toFixed(1)} → {d.v2.toFixed(1)}
                  </div>
                  <div className="font-mono text-xs font-bold" style={{ color: deltaColor }}>
                    {d.delta > 0 ? `+${d.delta.toFixed(1)}` : d.delta.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Step 1: Self-Check Checklist */}
      <Card padding="md" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-writing)' }} />
            ① Checklist tự chấm nhanh (không cần Claude)
          </h3>
          {manualChecklistDone && (
            <Pill tone="correct" size="sm">
              {essayMode === 'exam' || isRetryPromptRef.current ? 'Đã hoàn thành' : 'Đã hoàn thành (+10 XP)'}
            </Pill>
          )}
        </div>

        <div className="space-y-2">
          {checklistItems.map((item) => {
            const isChecked = item.autoChecked ? Boolean(item.autoPassed) : Boolean(checkedIds[item.id]);
            return (
              <label
                key={item.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-[var(--radius-sm)] border text-xs ${
                  item.autoChecked ? '' : 'cursor-pointer'
                }`}
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: isChecked ? 'var(--color-correct)' : 'var(--color-border)',
                }}
              >
                {item.autoChecked ? (
                  <span
                    className="mt-0.5 shrink-0 font-bold"
                    style={{
                      color: item.autoPassed ? 'var(--color-correct)' : 'var(--color-partial)',
                    }}
                  >
                    {item.autoPassed ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </span>
                ) : (
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      setCheckedIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                    }
                    className="mt-0.5 shrink-0 accent-[var(--color-writing)]"
                  />
                )}
                <div className="space-y-0.5">
                  <div style={{ color: 'var(--color-text)' }}>{item.labelVi}</div>
                  {item.detailEn && (
                    <div className="font-mono text-xs" style={{ color: 'var(--color-text-dim)' }}>
                      {item.detailEn}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Step 2: Claude Grading Panel (0 VND, Copy/Paste) */}
      {forcedShortSubmit ? (
        <Card padding="md" className="space-y-2">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-partial)' }}>
            <AlertTriangle className="w-4 h-4" />
            Đã hết giờ thi · Bài viết dưới 50 từ
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Hệ thống đã tự lưu bài viết ({wordEval.wordCount} từ) vào Portfolio nhưng không tạo gói chấm Claude vì chưa đủ 50 từ tối thiểu.
          </p>
        </Card>
      ) : (
        <GradingPanel
          key={packetInput.attemptId}
          packetInput={packetInput}
          sourceText={essayText}
          sampleResponse={import.meta.env.DEV ? devSampleResponse : undefined}
          skill="writing"
          onGraded={(payload) => void handleGraded(payload)}
          onAddSrsItem={(item) => void handleAddSrsItem(item)}
        />
      )}

      {/* Step 3: Band 8.0 Model Essay (Unlocked after submission) */}
      {showModel && (
        <Band8ModelViewer
          taskType={taskType}
          task1Prompt={activeTask1}
          task2Prompt={activeTask2}
        />
      )}

      {/* Footer navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<BookOpen className="w-4 h-4" />}
          onClick={() => setLifecycle(createInitialLifecycle())}
        >
          Viết đề mới
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onExit()}>
          Lưu & thoát về Hub
        </Button>
      </div>

      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Toast title={toastMsg} tone="info" onDismiss={() => setToastMsg(null)} />
        </div>
      )}
    </div>
  );
};

export default W1EssayLab;
