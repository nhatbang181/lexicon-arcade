import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  Plus,
  RotateCcw,
  Scissors,
  Sparkles,
  Star,
  Target,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { WritingTask1Prompt, WritingTask2Prompt } from '../../core/content/schemas';
import { isSprintResult } from '../../core/grading';
import { playSfx } from '../../core/audio/sfx';
import { createNewCard } from '../../core/srs/fsrsAdapter';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { Button, Card, EmptyState, Pill, Skeleton, Toast } from '../../design/components';
import { dur, ease, spring } from '../../design/motion';
import { ChartRenderer, GradingPanel, type GradingPanelGradedPayload } from '../_shared';
import type { GameProps } from '../registry';
import {
  applyClaudeSprintResult,
  buildClicheDrillItems,
  buildW2SprintPacketInput,
  buildWinSentence,
  CLAUDE_SPRINT_BONUS_XP,
  computeRoundXp,
  computeSessionSummary,
  EMPTY_IDEA_CHECKLIST,
  EMPTY_IDEA_OUTLINE,
  EMPTY_OVERVIEW_CHECKLIST,
  formatIdeaOutlineText,
  formatSprintClock,
  getRoundDurationSec,
  getSprintMeta,
  getTimerTone,
  IDEA_CHECKLIST_META,
  OVERVIEW_CHECKLIST_META,
  rankIdeaBankBySimilarity,
  scoreClicheDrill,
  scoreIdeaSelfCheck,
  scoreOverviewSelfCheck,
  scoreThesisResponse,
  scoreUpgradeDrill,
  selectAcademicUpgradeItems,
  selectIdeaPrompts,
  selectOverviewPrompts,
  splitByKeyPhrases,
  SPRINT_CATALOG,
  updateSprintStreak,
  type AcademicUpgradeItem,
  type ClicheDrillItem,
  type CompletedSprintRound,
  type IdeaChecklist,
  type IdeaOutlineInput,
  type OverviewChecklist,
  type SprintClicheEntry,
  type SprintType,
} from './engine';
import {
  loadSprintCliches,
  loadSprintTask1Index,
  loadSprintTask1Prompt,
  loadSprintTask2Prompts,
  type SprintTask1IndexEntry,
} from './sprintLoader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Phase = 'select' | 'playing' | 'recap';
type RoundStage = 'input' | 'review';

function slugifyId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function buildSampleClaudeSprintResponse(
  attemptId: string,
  sprintType: 'overview' | 'idea',
  rounds: readonly CompletedSprintRound[],
): string {
  const kind = sprintType === 'overview' ? 'w2_overview' : 'w2_idea';
  const items = rounds.map((r, idx) => ({
    ref: r.ref,
    stars: r.responseText.trim().length > 20 ? 3 : 1,
    checks:
      sprintType === 'overview'
        ? {
            overallTrend: true,
            keyComparison: idx % 2 === 0,
            noDetail: true,
            accurate: true,
          }
        : {
            clearStance: true,
            allParts: true,
            relevantIdeas: true,
            developed: true,
            specificExample: idx % 2 === 0,
          },
    tipVi:
      sprintType === 'overview'
        ? 'Cấu trúc tổng quan rõ ràng; thử thêm mệnh đề đối lập với "whereas" để đẩy lên Band 8.'
        : 'Quan điểm rõ và bám đề; bổ sung số liệu/bối cảnh cụ thể hơn cho ví dụ.',
    betterChunk:
      idx === 0
        ? {
            original: r.responseText.trim().slice(0, 48) || 'went up a lot',
            better:
              sprintType === 'overview'
                ? 'experienced a pronounced upward trajectory throughout the period'
                : 'yields measurable long-term gains for lower-income households',
          }
        : null,
  }));

  return `**Part A – Nhận xét nhanh**\nPhiên ${sprintType === 'overview' ? 'Overview Sprint' : 'Idea Sprint'} hoàn thành tốt! Dưới đây là điểm sao chi tiết cho từng lượt.\n\n\`\`\`json\n${JSON.stringify(
    {
      attemptId,
      promptVersion: 'sp-1.0',
      kind,
      items,
    },
    null,
    2,
  )}\n\`\`\``;
}

const SPRINT_ICONS: Record<SprintType, React.ReactNode> = {
  overview: <Target className="w-5 h-5" />,
  idea: <Lightbulb className="w-5 h-5" />,
  thesis: <Zap className="w-5 h-5" />,
  cliche: <Scissors className="w-5 h-5" />,
  upgrade: <Sparkles className="w-5 h-5" />,
};

// ---------------------------------------------------------------------------
// Staggered 3-Star Reveal (W2-WRITING-SPRINTS.md §10: 120ms stagger)
// ---------------------------------------------------------------------------

const StarReveal: React.FC<{ stars: number; label?: string }> = ({ stars, label }) => {
  const reduced = useReducedMotion();
  return (
    <div className="inline-flex items-center gap-1.5" aria-label={`${stars} trên 3 sao`}>
      {[1, 2, 3].map((idx) => {
        const filled = idx <= stars;
        return (
          <motion.span
            key={idx}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{
              delay: reduced ? 0 : (idx - 1) * 0.12,
              ...(reduced ? { duration: dur.instant } : spring.bouncy),
            }}
            className="inline-flex"
          >
            <Star
              className="w-5 h-5"
              style={{
                color: filled ? 'var(--color-partial)' : 'var(--color-border-strong)',
                fill: filled ? 'var(--color-partial)' : 'transparent',
              }}
            />
          </motion.span>
        );
      })}
      {label && (
        <span className="text-xs font-mono ml-1" style={{ color: 'var(--color-text-dim)' }}>
          {label}
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const W2WritingSprints: React.FC<GameProps> = ({ level, onExit }) => {
  const reduced = useReducedMotion();

  // Content loading state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [task1Index, setTask1Index] = useState<SprintTask1IndexEntry[]>([]);
  const [task2Prompts, setTask2Prompts] = useState<WritingTask2Prompt[]>([]);
  const [cliches, setCliches] = useState<SprintClicheEntry[]>([]);

  // Session state
  const [phase, setPhase] = useState<Phase>('select');
  const [sprintType, setSprintType] = useState<SprintType>('overview');
  const [roundIdx, setRoundIdx] = useState(0);
  const [roundStage, setRoundStage] = useState<RoundStage>('input');
  const [remainingSec, setRemainingSec] = useState(90);
  const [totalSec, setTotalSec] = useState(90);
  const [streakState, setStreakState] = useState({ streak: 0, bestStreak: 0 });
  const [completedRounds, setCompletedRounds] = useState<CompletedSprintRound[]>([]);
  const [sessionAttemptId, setSessionAttemptId] = useState('');
  const [sessionStartedAt, setSessionStartedAt] = useState(0);
  const [claudeGraded, setClaudeGraded] = useState(false);
  const [claudeMissingRefs, setClaudeMissingRefs] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [savedPhrases, setSavedPhrases] = useState<Set<string>>(() => new Set());

  // Round-specific queues
  const [overviewQueue, setOverviewQueue] = useState<SprintTask1IndexEntry[]>([]);
  const [activeTask1, setActiveTask1] = useState<WritingTask1Prompt | null>(null);
  const [task1Loading, setTask1Loading] = useState(false);
  const [ideaQueue, setIdeaQueue] = useState<WritingTask2Prompt[]>([]);
  const [thesisQueue, setThesisQueue] = useState<WritingTask2Prompt[]>([]);
  const [clicheQueue, setClicheQueue] = useState<ClicheDrillItem[]>([]);
  const [upgradeQueue, setUpgradeQueue] = useState<AcademicUpgradeItem[]>([]);

  // Round-specific learner input state
  const [overviewInput, setOverviewInput] = useState('');
  const [overviewChecks, setOverviewChecks] = useState<OverviewChecklist>(EMPTY_OVERVIEW_CHECKLIST);
  const [activeModelIdx, setActiveModelIdx] = useState(0);

  const [ideaOutline, setIdeaOutline] = useState<IdeaOutlineInput>(EMPTY_IDEA_OUTLINE);
  const [ideaChecks, setIdeaChecks] = useState<IdeaChecklist>(EMPTY_IDEA_CHECKLIST);

  const [thesisInput, setThesisInput] = useState('');
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);

  const savedSessionRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  // Load initial content indices
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadSprintTask1Index(), loadSprintTask2Prompts(), loadSprintCliches()])
      .then(([t1, t2, cl]) => {
        if (!active) return;
        setTask1Index(t1);
        setTask2Prompts(t2);
        setCliches(cl);
        setLoadError(null);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Không thể tải dữ liệu Writing Sprints.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load full Task 1 visual JSON when overview round changes
  useEffect(() => {
    if (phase !== 'playing' || sprintType !== 'overview') return;
    const entry = overviewQueue[roundIdx];
    if (!entry) return;
    let active = true;
    setTask1Loading(true);
    loadSprintTask1Prompt(entry.file)
      .then((prompt) => {
        if (active) setActiveTask1(prompt);
      })
      .catch(() => {
        if (active) setActiveTask1(null);
      })
      .finally(() => {
        if (active) setTask1Loading(false);
      });
    return () => {
      active = false;
    };
  }, [phase, sprintType, overviewQueue, roundIdx]);

  // Countdown timer during input stage
  useEffect(() => {
    if (phase !== 'playing' || roundStage !== 'input') return;
    const id = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, roundStage, roundIdx]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (phase === 'playing' && roundStage === 'input' && remainingSec === 0) {
      playSfx('countdownEnd');
      setRoundStage('review');
    }
  }, [phase, roundStage, remainingSec]);

  // Add clicked key phrase / betterChunk to SRS (W2-WRITING-SPRINTS.md §8)
  const handleAddPhraseToSrs = useCallback(
    async (phrase: string) => {
      const cleaned = phrase.trim();
      if (!cleaned) return;
      try {
        const itemId = `err:w2_${slugifyId(cleaned)}`;
        const card = createNewCard(itemId, 'err_fix', { source: 'essay_feedback' });
        await cardRepo.upsert(card);
        setSavedPhrases((prev) => new Set(prev).add(cleaned));
        playSfx('highlight');
        showToast(`Đã lưu "${cleaned}" vào hàng đợi ôn tập SRS`);
      } catch {
        showToast('Không thể lưu vào SRS lúc này.');
      }
    },
    [showToast],
  );

  // Start a sprint session
  const startSprint = useCallback(
    (type: SprintType) => {
      const meta = getSprintMeta(type);
      const duration = getRoundDurationSec(type, level);
      const now = Date.now();
      const offset = Math.floor(now / 1000) % 12;

      setSprintType(type);
      setRoundIdx(0);
      setRoundStage('input');
      setTotalSec(duration);
      setRemainingSec(duration);
      setStreakState({ streak: 0, bestStreak: 0 });
      setCompletedRounds([]);
      setSessionAttemptId(`att-w2-${type}-${now.toString(36)}`);
      setSessionStartedAt(now);
      setClaudeGraded(false);
      setClaudeMissingRefs([]);
      savedSessionRef.current = false;

      // Reset inputs
      setOverviewInput('');
      setOverviewChecks(EMPTY_OVERVIEW_CHECKLIST);
      setActiveModelIdx(0);
      setIdeaOutline(EMPTY_IDEA_OUTLINE);
      setIdeaChecks(EMPTY_IDEA_CHECKLIST);
      setThesisInput('');
      setSelectedChoiceIdx(null);

      if (type === 'overview') {
        setOverviewQueue(selectOverviewPrompts(task1Index, level, meta.roundsPerSession));
      } else if (type === 'idea') {
        setIdeaQueue(selectIdeaPrompts(task2Prompts, level, meta.roundsPerSession));
      } else if (type === 'thesis') {
        const rotated = [
          ...task2Prompts.slice(offset % Math.max(1, task2Prompts.length)),
          ...task2Prompts.slice(0, offset % Math.max(1, task2Prompts.length)),
        ];
        setThesisQueue(rotated.slice(0, meta.roundsPerSession));
      } else if (type === 'cliche') {
        setClicheQueue(buildClicheDrillItems(cliches, meta.roundsPerSession, offset));
      } else {
        setUpgradeQueue(selectAcademicUpgradeItems(meta.roundsPerSession, offset));
      }

      playSfx('tap');
      setPhase('playing');
    },
    [cliches, level, task1Index, task2Prompts],
  );

  // Total rounds in active sprint
  const totalRounds = useMemo(() => {
    switch (sprintType) {
      case 'overview':
        return overviewQueue.length;
      case 'idea':
        return ideaQueue.length;
      case 'thesis':
        return thesisQueue.length;
      case 'cliche':
        return clicheQueue.length;
      case 'upgrade':
        return upgradeQueue.length;
    }
  }, [sprintType, overviewQueue.length, ideaQueue.length, thesisQueue.length, clicheQueue.length, upgradeQueue.length]);

  // Live computed scores for current review stage
  const currentOverviewScore = useMemo(
    () => scoreOverviewSelfCheck(overviewInput, overviewChecks),
    [overviewInput, overviewChecks],
  );

  const currentIdeaScore = useMemo(
    () => scoreIdeaSelfCheck(ideaOutline, ideaChecks),
    [ideaOutline, ideaChecks],
  );

  const currentIdeaPrompt = ideaQueue[roundIdx] ?? null;
  const rankedIdeaBank = useMemo(() => {
    if (!currentIdeaPrompt) return [];
    return rankIdeaBankBySimilarity(ideaOutline, currentIdeaPrompt.ideaBank);
  }, [currentIdeaPrompt, ideaOutline]);

  const currentThesisPrompt = thesisQueue[roundIdx] ?? null;
  const currentThesisScore = useMemo(() => {
    if (!currentThesisPrompt) return null;
    return scoreThesisResponse(thesisInput, currentThesisPrompt, cliches);
  }, [currentThesisPrompt, thesisInput, cliches]);

  const currentClicheDrill = clicheQueue[roundIdx] ?? null;
  const currentClicheScore = useMemo(() => {
    if (!currentClicheDrill || selectedChoiceIdx === null) return null;
    return scoreClicheDrill(currentClicheDrill, selectedChoiceIdx);
  }, [currentClicheDrill, selectedChoiceIdx]);

  const currentUpgradeDrill = upgradeQueue[roundIdx] ?? null;
  const currentUpgradeScore = useMemo(() => {
    if (!currentUpgradeDrill || selectedChoiceIdx === null) return null;
    return scoreUpgradeDrill(currentUpgradeDrill, selectedChoiceIdx);
  }, [currentUpgradeDrill, selectedChoiceIdx]);

  // Submit current round (for writing-based drills: overview, idea, thesis)
  const handleSubmitWritten = useCallback(() => {
    if (roundStage !== 'input') return;
    setRoundStage('review');
    if (sprintType === 'thesis' && currentThesisScore) {
      playSfx(currentThesisScore.stars >= 2 ? 'correct' : 'wrong', {
        rate: 1 + currentThesisScore.stars * 0.06,
      });
    } else {
      playSfx('flip');
    }
  }, [roundStage, sprintType, currentThesisScore]);

  // Select choice (for cliche & upgrade drills)
  const handleSelectChoice = useCallback(
    (idx: number) => {
      if (roundStage !== 'input') return;
      setSelectedChoiceIdx(idx);
      setRoundStage('review');
      const isRight =
        sprintType === 'cliche'
          ? currentClicheDrill?.correctIndex === idx
          : currentUpgradeDrill?.correctIndex === idx;
      playSfx(isRight ? 'correct' : 'wrong', { rate: isRight ? 1.12 : 1 });
    },
    [roundStage, sprintType, currentClicheDrill, currentUpgradeDrill],
  );

  // Persist finished session to IndexedDB (once per session)
  const persistSession = useCallback(
    async (rounds: readonly CompletedSprintRound[], isClaude: boolean) => {
      if (savedSessionRef.current || rounds.length === 0) return;
      savedSessionRef.current = true;
      const summary = computeSessionSummary(rounds, isClaude);
      const endedAt = Date.now();
      try {
        await attemptRepo.saveSession({
          attempt: {
            gameId: 'w2',
            mode: 'sprint',
            startedAt: sessionStartedAt || endedAt - 60_000,
            endedAt,
            score: summary.totalStars,
            total: summary.maxStars,
            xp: summary.totalXp,
            items: rounds.map((r) => ({
              itemId: r.ref,
              correct: r.stars >= 2,
              durationMs: r.durationSec * 1000,
              rating: r.stars === 3 ? 4 : r.stars === 2 ? 3 : r.stars === 1 ? 2 : 1,
            })),
          },
        });
      } catch {
        // Non-blocking storage fallback
      }
    },
    [sessionStartedAt],
  );

  // Advance to next round or recap
  const handleNextRound = useCallback(() => {
    const spentSec = Math.max(1, totalSec - remainingSec);
    let record: CompletedSprintRound | null = null;

    if (sprintType === 'overview' && activeTask1) {
      record = {
        ref: activeTask1.id,
        title: activeTask1.chart?.title ?? activeTask1.table?.title ?? activeTask1.process?.title ?? activeTask1.id,
        promptText: activeTask1.prompt,
        responseText: overviewInput.trim(),
        durationSec: spentSec,
        stars: currentOverviewScore.stars,
        checks: { ...overviewChecks },
        gradedBy: 'self',
        keyFeatures: activeTask1.keyFeatures.map((k) => k.textEn),
      };
    } else if (sprintType === 'idea' && currentIdeaPrompt) {
      record = {
        ref: currentIdeaPrompt.id,
        title: currentIdeaPrompt.prompt.slice(0, 72) + '…',
        promptText: currentIdeaPrompt.prompt,
        responseText: formatIdeaOutlineText(ideaOutline),
        durationSec: spentSec,
        stars: currentIdeaScore.stars,
        checks: { ...ideaChecks },
        gradedBy: 'self',
        partsToAddress: currentIdeaPrompt.partsToAddress,
      };
    } else if (sprintType === 'thesis' && currentThesisPrompt && currentThesisScore) {
      record = {
        ref: currentThesisPrompt.id,
        title: currentThesisPrompt.prompt.slice(0, 72) + '…',
        promptText: currentThesisPrompt.prompt,
        responseText: thesisInput.trim(),
        durationSec: spentSec,
        stars: currentThesisScore.stars,
        checks: { ...currentThesisScore.checks },
        gradedBy: 'auto',
        tipVi: currentThesisScore.tipVi,
      };
    } else if (sprintType === 'cliche' && currentClicheDrill && currentClicheScore) {
      record = {
        ref: currentClicheDrill.id,
        title: `Cliché: "${currentClicheDrill.entry.phrase}"`,
        promptText: `${currentClicheDrill.sentenceBefore}[${currentClicheDrill.entry.phrase}]${currentClicheDrill.sentenceAfter}`,
        responseText:
          selectedChoiceIdx !== null ? currentClicheDrill.options[selectedChoiceIdx] : '(hết giờ)',
        durationSec: spentSec,
        stars: currentClicheScore.stars,
        checks: { correct: currentClicheScore.correct },
        gradedBy: 'auto',
        tipVi: currentClicheScore.explanationVi,
        betterChunk: {
          original: currentClicheDrill.entry.phrase,
          better: currentClicheDrill.correctReplacement,
        },
      };
    } else if (sprintType === 'upgrade' && currentUpgradeDrill && currentUpgradeScore) {
      record = {
        ref: currentUpgradeDrill.id,
        title:
          currentUpgradeDrill.subKind === 'hedging' ? 'Hedging Upgrade' : 'Cohesive Repair',
        promptText: currentUpgradeDrill.band6Sentence,
        responseText:
          selectedChoiceIdx !== null ? currentUpgradeDrill.options[selectedChoiceIdx] : '(hết giờ)',
        durationSec: spentSec,
        stars: currentUpgradeScore.stars,
        checks: { correct: currentUpgradeScore.correct },
        gradedBy: 'auto',
        tipVi: currentUpgradeScore.explanationVi,
        betterChunk: {
          original: currentUpgradeDrill.flawHighlight,
          better: currentUpgradeDrill.keyPhrase,
        },
      };
    }

    const nextCompleted = record ? [...completedRounds, record] : completedRounds;
    if (record) {
      setCompletedRounds(nextCompleted);
      setStreakState((prev) => updateSprintStreak(prev, record.stars));
    }

    if (roundIdx + 1 >= totalRounds) {
      playSfx('sessionDone');
      setPhase('recap');
      void persistSession(nextCompleted, false);
      return;
    }

    // Move to next round
    const nextDuration = getRoundDurationSec(sprintType, level);
    setRoundIdx((i) => i + 1);
    setRoundStage('input');
    setTotalSec(nextDuration);
    setRemainingSec(nextDuration);
    setOverviewInput('');
    setOverviewChecks(EMPTY_OVERVIEW_CHECKLIST);
    setActiveModelIdx(0);
    setIdeaOutline(EMPTY_IDEA_OUTLINE);
    setIdeaChecks(EMPTY_IDEA_CHECKLIST);
    setThesisInput('');
    setSelectedChoiceIdx(null);
    playSfx('tap');
  }, [
    totalSec,
    remainingSec,
    sprintType,
    activeTask1,
    overviewInput,
    currentOverviewScore.stars,
    overviewChecks,
    currentIdeaPrompt,
    ideaOutline,
    currentIdeaScore.stars,
    ideaChecks,
    currentThesisPrompt,
    currentThesisScore,
    thesisInput,
    currentClicheDrill,
    currentClicheScore,
    selectedChoiceIdx,
    currentUpgradeDrill,
    currentUpgradeScore,
    completedRounds,
    roundIdx,
    totalRounds,
    level,
    persistSession,
  ]);

  // Handle Claude SprintResult paste at recap
  const handleClaudeGraded = useCallback(
    (payload: GradingPanelGradedPayload) => {
      if (!isSprintResult(payload.parsed.data)) return;
      const outcome = applyClaudeSprintResult(completedRounds, payload.parsed.data);
      setCompletedRounds(outcome.rounds);
      setClaudeGraded(true);
      setClaudeMissingRefs(outcome.missingRefs);
      playSfx('levelUp');
      showToast(
        outcome.missingRefs.length > 0
          ? `Claude đã chấm ${outcome.matchedRefs.length} lượt (thiếu ${outcome.missingRefs.length} lượt) · +${CLAUDE_SPRINT_BONUS_XP} XP`
          : `Claude đã cập nhật ${outcome.matchedRefs.length} lượt · +${CLAUDE_SPRINT_BONUS_XP} XP`,
      );
    },
    [completedRounds, showToast],
  );

  // Derived timer bar color
  const timerTone = getTimerTone(remainingSec, totalSec);
  const timerColor =
    timerTone === 'critical'
      ? 'var(--color-wrong)'
      : timerTone === 'warn'
        ? 'var(--color-partial)'
        : 'var(--color-writing)';
  const timerRatio = totalSec > 0 ? Math.max(0, Math.min(1, remainingSec / totalSec)) : 0;

  const liveXp = completedRounds.reduce((acc, r) => acc + computeRoundXp(r.stars), 0);
  const recapSummary = useMemo(
    () => computeSessionSummary(completedRounds, claudeGraded),
    [completedRounds, claudeGraded],
  );

  // -------------------------------------------------------------------------
  // Render: Loading / Error
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4" data-testid="w2-writing-sprints">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6" data-testid="w2-writing-sprints">
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          title="Không tải được dữ liệu Writing Sprints"
          description={loadError}
          action={
            <Button variant="secondary" onClick={() => onExit()}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: 1. Sprint Hub Selector
  // -------------------------------------------------------------------------

  if (phase === 'select') {
    return (
      <div
        className="max-w-5xl mx-auto px-4 py-5 sm:px-6 space-y-6"
        data-testid="w2-writing-sprints"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExit()}
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-xl sm:text-2xl font-bold tracking-tight"
                  style={{ color: 'var(--color-text)' }}
                >
                  W2 · Writing Sprints
                </h1>
                <Pill tone="writing" size="sm">
                  Level {level}
                </Pill>
              </div>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                Luyện từng kỹ năng con quyết định Band 7.5–8.0 trong phiên ngắn 5–10 phút, không tốn API.
              </p>
            </div>
          </div>
        </div>

        {/* 5 Sprint Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SPRINT_CATALOG.map((meta) => {
            const roundSec = getRoundDurationSec(meta.type, level);
            return (
              <Card
                key={meta.type}
                padding="md"
                className="flex flex-col justify-between gap-4 transition-transform"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)]"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-writing) 14%, transparent)',
                        color: 'var(--color-writing)',
                      }}
                    >
                      {SPRINT_ICONS[meta.type]}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <Pill tone="neutral" size="sm">
                        {meta.roundsPerSession} lượt · {formatSprintClock(roundSec)}
                      </Pill>
                      {meta.supportsClaudeBatch && (
                        <Pill tone="info" size="sm">
                          Claude gộp
                        </Pill>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                      {meta.title}
                    </h2>
                    <div
                      className="text-xs font-medium"
                      style={{ color: 'var(--color-writing)' }}
                    >
                      {meta.titleVi}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                    {meta.subtitleVi}
                  </p>
                </div>

                <Button
                  variant="primary"
                  skill="writing"
                  className="w-full"
                  data-testid={`w2-start-${meta.type}`}
                  onClick={() => startSprint(meta.type)}
                >
                  Bắt đầu {meta.title}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Info Footer */}
        <Card padding="sm" className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span style={{ color: 'var(--color-text-dim)' }}>
            Kho dữ liệu sẵn sàng: <strong style={{ color: 'var(--color-text)' }}>{task1Index.length}</strong> biểu đồ Task 1 ·{' '}
            <strong style={{ color: 'var(--color-text)' }}>{task2Prompts.length}</strong> đề Task 2 ·{' '}
            <strong style={{ color: 'var(--color-text)' }}>{cliches.length}</strong> cụm sáo rỗng.
          </span>
          <span style={{ color: 'var(--color-text-faint)' }}>
            Tối đa 3★/lượt · 10 XP/sao · +20 XP khi dán chấm gộp Claude
          </span>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: 3. Session Recap + Optional Claude Batch Grading
  // -------------------------------------------------------------------------

  if (phase === 'recap') {
    const meta = getSprintMeta(sprintType);
    const winSentence = buildWinSentence(sprintType, completedRounds);
    const canUseClaude =
      (sprintType === 'overview' || sprintType === 'idea') && completedRounds.length > 0;
    const packetInput = canUseClaude
      ? buildW2SprintPacketInput(
          sessionAttemptId,
          sprintType as 'overview' | 'idea',
          completedRounds,
        )
      : null;
    const sampleClaude = canUseClaude
      ? buildSampleClaudeSprintResponse(
          sessionAttemptId,
          sprintType as 'overview' | 'idea',
          completedRounds,
        )
      : undefined;

    return (
      <div
        className="max-w-4xl mx-auto px-4 py-5 sm:px-6 space-y-6"
        data-testid="w2-recap-screen"
      >
        <Card padding="lg" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Pill tone="writing" size="sm">
                Hoàn thành · {meta.title}
              </Pill>
              <h1
                className="text-xl sm:text-2xl font-bold mt-2"
                style={{ color: 'var(--color-text)' }}
              >
                {winSentence}
              </h1>
            </div>
            <Award className="w-10 h-10 shrink-0" style={{ color: 'var(--color-writing)' }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Tổng sao',
                value: `${recapSummary.totalStars}/${recapSummary.maxStars} ★`,
              },
              { label: 'Độ chính xác', value: `${recapSummary.accuracyPercent}%` },
              { label: 'Chuỗi tốt nhất', value: `${streakState.bestStreak}` },
              { label: 'XP nhận được', value: `+${recapSummary.totalXp} XP` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-md)] border p-3"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  {stat.label}
                </div>
                <div
                  className="text-lg font-bold font-mono tabular-nums mt-0.5"
                  style={{ color: 'var(--color-text)' }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {claudeMissingRefs.length > 0 && (
            <div
              className="rounded-[var(--radius-sm)] border p-3 text-xs flex items-start gap-2"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-partial) 12%, transparent)',
                borderColor: 'var(--color-partial)',
                color: 'var(--color-text)',
              }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-partial)' }} />
              <span>
                Kết quả Claude thiếu {claudeMissingRefs.length} lượt ({claudeMissingRefs.join(', ')}).
                Các lượt thiếu vẫn giữ nguyên điểm tự chấm.
              </span>
            </div>
          )}

          {/* Round-by-round breakdown */}
          <div className="space-y-2.5">
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              Chi tiết từng lượt
            </h2>
            {completedRounds.map((round, idx) => (
              <div
                key={`${round.ref}-${idx}`}
                className="rounded-[var(--radius-md)] border p-3 space-y-2"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: 'var(--color-writing)' }}
                    >
                      #{idx + 1} · {round.ref}
                    </span>
                    <Pill
                      tone={round.gradedBy === 'claude' ? 'info' : 'neutral'}
                      size="sm"
                    >
                      {round.gradedBy === 'claude'
                        ? 'Claude'
                        : round.gradedBy === 'auto'
                          ? 'Tự động'
                          : 'Tự chấm'}
                    </Pill>
                  </div>
                  <StarReveal stars={round.stars} label={`+${computeRoundXp(round.stars)} XP`} />
                </div>

                {round.tipVi && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                    {round.tipVi}
                  </p>
                )}

                {round.betterChunk && (
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] p-2 text-xs"
                    style={{ backgroundColor: 'var(--color-surface-2)' }}
                  >
                    <div className="min-w-0">
                      <span className="line-through mr-2" style={{ color: 'var(--color-text-faint)' }}>
                        {round.betterChunk.original}
                      </span>
                      <span className="font-semibold" style={{ color: 'var(--color-correct)' }}>
                        → {round.betterChunk.better}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={savedPhrases.has(round.betterChunk.better)}
                      onClick={() => handleAddPhraseToSrs(round.betterChunk!.better)}
                    >
                      {savedPhrases.has(round.betterChunk.better) ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" /> Đã lưu SRS
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Lưu SRS
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <Button variant="primary" skill="writing" onClick={() => startSprint(sprintType)}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Chơi lại {meta.title}
            </Button>
            <Button variant="secondary" onClick={() => setPhase('select')}>
              Chọn sprint khác
            </Button>
            <Button variant="ghost" onClick={() => onExit()}>
              Về trang chính
            </Button>
          </div>
        </Card>

        {/* Optional Claude Batch Grading Panel for Overview / Idea Sprint */}
        {packetInput && (
          <Card padding="md" className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                Chấm gộp cả phiên với Claude (tuỳ chọn · +20 XP)
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                Copy 1 gói chấm cho toàn bộ phiên, dán vào Claude chat rồi dán kết quả JSON lại để cập nhật sao và gợi ý diễn đạt Band 8.
              </p>
            </div>
            <GradingPanel
              packetInput={packetInput}
              sampleResponse={sampleClaude}
              skill="writing"
              onGraded={handleClaudeGraded}
            />
          </Card>
        )}

        {toastMsg && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Toast title={toastMsg} tone="correct" onDismiss={() => setToastMsg(null)} />
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: 2. Active Playing Screen
  // -------------------------------------------------------------------------

  const meta = getSprintMeta(sprintType);

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-4 sm:px-6 space-y-4"
      data-testid="w2-writing-sprints"
    >
      {/* Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhase('select')}
            aria-label="Thoát sprint"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-bold text-sm sm:text-base truncate" style={{ color: 'var(--color-text)' }}>
            {meta.title}
          </span>
          <Pill tone="neutral" size="sm" data-testid="w2-progress">
            {roundIdx + 1}/{Math.max(1, totalRounds)}
          </Pill>
        </div>

        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-mono tabular-nums">
          <span
            className="inline-flex items-center gap-1 font-bold"
            style={{ color: timerColor }}
            data-testid="w2-timer"
          >
            <Clock className="w-4 h-4" />
            {formatSprintClock(remainingSec)}
          </span>
          {streakState.streak > 0 && (
            <span
              className="inline-flex items-center gap-1 font-bold"
              style={{ color: 'var(--color-partial)' }}
            >
              <Flame className="w-4 h-4" />
              {streakState.streak}
            </span>
          )}
          <Pill tone="writing" size="sm">
            +{liveXp} XP
          </Pill>
        </div>
      </div>

      {/* Full-width Horizontal Timer Bar (transform scaleX only, changes at 25% & 10%) */}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-2)' }}
        role="progressbar"
        aria-valuenow={remainingSec}
        aria-valuemin={0}
        aria-valuemax={totalSec}
        aria-label="Thời gian còn lại"
      >
        <div
          className="h-full origin-left transition-transform duration-300"
          style={{
            transform: `scaleX(${timerRatio})`,
            backgroundColor: timerColor,
          }}
        />
      </div>

      {/* Main Round Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${sprintType}-${roundIdx}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: dur.base, ease: ease.out }}
          className="space-y-4"
        >
          {/* ================= 1. OVERVIEW SPRINT ================= */}
          {sprintType === 'overview' && (
            <>
              {task1Loading || !activeTask1 ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  <Card padding="md" className="space-y-3">
                    <p
                      className="text-sm leading-relaxed font-medium"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {activeTask1.prompt}
                    </p>
                    <ChartRenderer visual={activeTask1} kind={activeTask1.kind} compact />
                  </Card>

                  <Card padding="md" className="space-y-3">
                    <label
                      htmlFor="w2-overview-input"
                      className="text-xs font-bold uppercase tracking-wide block"
                      style={{ color: 'var(--color-writing)' }}
                    >
                      Viết 1–2 câu Overview (xu hướng chung + điểm nổi bật, không số liệu chi tiết)
                    </label>
                    <textarea
                      id="w2-overview-input"
                      data-testid="w2-overview-input"
                      value={overviewInput}
                      onChange={(e) => setOverviewInput(e.target.value)}
                      disabled={roundStage === 'review'}
                      rows={3}
                      placeholder="Overall, ..."
                      className="w-full rounded-[var(--radius-sm)] border p-3 text-sm leading-relaxed resize-y"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />

                    {roundStage === 'input' ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                          Gợi ý: mở bằng &ldquo;Overall,&rdquo; hoặc &ldquo;In general,&rdquo;
                        </span>
                        <Button
                          variant="primary"
                          skill="writing"
                          data-testid="w2-submit-btn"
                          onClick={handleSubmitWritten}
                        >
                          Nộp & tự chấm
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        {/* Self-check Checklist */}
                        <div className="space-y-2" data-testid="w2-selfcheck">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                              Tự chấm checklist
                            </span>
                            <StarReveal
                              stars={currentOverviewScore.stars}
                              label={`+${computeRoundXp(currentOverviewScore.stars)} XP`}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {OVERVIEW_CHECKLIST_META.map((item) => {
                              const checked = overviewChecks[item.key];
                              return (
                                <label
                                  key={item.key}
                                  className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border p-2.5 text-sm cursor-pointer"
                                  style={{
                                    backgroundColor: checked
                                      ? 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface))'
                                      : 'var(--color-surface-2)',
                                    borderColor: checked
                                      ? 'var(--color-correct)'
                                      : 'var(--color-border)',
                                    color: 'var(--color-text)',
                                    opacity: currentOverviewScore.canSelfCheck ? 1 : 0.5,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!currentOverviewScore.canSelfCheck}
                                    onChange={(e) => {
                                      const next = { ...overviewChecks, [item.key]: e.target.checked };
                                      setOverviewChecks(next);
                                      const sc = scoreOverviewSelfCheck(overviewInput, next);
                                      if (e.target.checked) {
                                        playSfx('correct', { rate: 1 + sc.stars * 0.06 });
                                      }
                                    }}
                                  />
                                  <span>{item.labelVi}</span>
                                </label>
                              );
                            })}
                          </div>

                          {currentOverviewScore.warningVi && (
                            <div
                              className="rounded-[var(--radius-sm)] border p-2.5 text-xs flex items-start gap-2"
                              style={{
                                backgroundColor:
                                  'color-mix(in srgb, var(--color-partial) 12%, transparent)',
                                borderColor: 'var(--color-partial)',
                                color: 'var(--color-text)',
                              }}
                            >
                              <AlertTriangle
                                className="w-4 h-4 shrink-0 mt-0.5"
                                style={{ color: 'var(--color-partial)' }}
                              />
                              <span>{currentOverviewScore.warningVi}</span>
                            </div>
                          )}
                        </div>

                        {/* Band 8 Model Overviews + Clickable Key Phrases */}
                        <div
                          className="rounded-[var(--radius-md)] border p-3.5 space-y-2.5"
                          style={{
                            backgroundColor: 'var(--color-surface-2)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className="text-xs font-bold uppercase tracking-wide"
                              style={{ color: 'var(--color-writing)' }}
                            >
                              Overview mẫu Band 8 (bấm cụm highlight để lưu SRS)
                            </span>
                            <div className="flex items-center gap-1">
                              {activeTask1.overviewModels.map((_, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setActiveModelIdx(idx)}
                                  className="px-2 py-0.5 rounded text-xs font-mono border cursor-pointer"
                                  style={{
                                    backgroundColor:
                                      activeModelIdx === idx
                                        ? 'var(--color-writing)'
                                        : 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    color:
                                      activeModelIdx === idx
                                        ? 'var(--color-surface)'
                                        : 'var(--color-text-dim)',
                                  }}
                                >
                                  Mẫu {idx + 1}
                                </button>
                              ))}
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                            {splitByKeyPhrases(
                              activeTask1.overviewModels[activeModelIdx] ??
                                activeTask1.overviewModels[0] ??
                                '',
                              activeTask1.overviewKeyPhrases ?? ['Overall,', 'In general,', 'while', 'whereas'],
                            ).map((seg, sIdx) =>
                              seg.isKeyPhrase && seg.phrase ? (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => handleAddPhraseToSrs(seg.phrase!)}
                                  title="Bấm để thêm cụm này vào SRS"
                                  className="inline px-1 py-0.5 mx-0.5 rounded font-semibold underline decoration-dotted cursor-pointer"
                                  style={{
                                    backgroundColor: savedPhrases.has(seg.phrase)
                                      ? 'color-mix(in srgb, var(--color-correct) 22%, transparent)'
                                      : 'color-mix(in srgb, var(--color-writing) 18%, transparent)',
                                    color: 'var(--color-text)',
                                  }}
                                >
                                  {seg.text}
                                </button>
                              ) : (
                                <React.Fragment key={sIdx}>{seg.text}</React.Fragment>
                              ),
                            )}
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="primary"
                            skill="writing"
                            data-testid="w2-next-btn"
                            onClick={handleNextRound}
                          >
                            {roundIdx + 1 >= totalRounds ? 'Xem tổng kết' : 'Biểu đồ tiếp theo'}
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </>
              )}
            </>
          )}

          {/* ================= 2. IDEA SPRINT ================= */}
          {sprintType === 'idea' && currentIdeaPrompt && (
            <Card padding="md" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill tone="writing" size="sm">
                    {currentIdeaPrompt.essayType}
                  </Pill>
                  <Pill tone="neutral" size="sm">
                    {currentIdeaPrompt.topic}
                  </Pill>
                </div>
                <p
                  className="text-sm sm:text-base font-semibold leading-relaxed"
                  style={{ color: 'var(--color-text)' }}
                >
                  {currentIdeaPrompt.prompt}
                </p>
              </div>

              {/* 4-Box Outline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'stance' as const,
                    label: '1. Quan điểm rõ (1 câu)',
                    placeholder: 'While I agree that..., I believe...',
                    testId: 'w2-idea-stance',
                  },
                  {
                    key: 'main1' as const,
                    label: '2. Ý chính 1 + 1 câu phát triển',
                    placeholder: 'Main point 1 -> reason / consequence...',
                    testId: 'w2-idea-main1',
                  },
                  {
                    key: 'main2' as const,
                    label: '3. Ý chính 2 + 1 câu phát triển',
                    placeholder: 'Main point 2 -> reason / consequence...',
                    testId: 'w2-idea-main2',
                  },
                  {
                    key: 'example' as const,
                    label: '4. Ví dụ cụ thể',
                    placeholder: 'For instance, in urban state schools...',
                    testId: 'w2-idea-example',
                  },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label
                      htmlFor={field.testId}
                      className="text-xs font-bold block"
                      style={{ color: 'var(--color-text-dim)' }}
                    >
                      {field.label}
                    </label>
                    <textarea
                      id={field.testId}
                      data-testid={field.testId}
                      value={ideaOutline[field.key]}
                      disabled={roundStage === 'review'}
                      onChange={(e) =>
                        setIdeaOutline((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      rows={2}
                      placeholder={field.placeholder}
                      className="w-full rounded-[var(--radius-sm)] border p-2.5 text-sm resize-y"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)',
                      }}
                    />
                  </div>
                ))}
              </div>

              {roundStage === 'input' ? (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    skill="writing"
                    data-testid="w2-submit-btn"
                    onClick={handleSubmitWritten}
                  >
                    Nộp khung lập ý
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  {/* Parts to Address Reminder */}
                  <div
                    className="rounded-[var(--radius-sm)] border p-3 space-y-1.5"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: 'var(--color-info)' }}>
                      Các phần bắt buộc phải trả lời (partsToAddress):
                    </div>
                    <ul className="text-xs space-y-1 list-disc pl-4" style={{ color: 'var(--color-text-dim)' }}>
                      {currentIdeaPrompt.partsToAddress.map((part, idx) => (
                        <li key={idx}>{part}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 5-item Checklist */}
                  <div className="space-y-2" data-testid="w2-selfcheck">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        Tự chấm 5 tiêu chí lập ý
                      </span>
                      <StarReveal
                        stars={currentIdeaScore.stars}
                        label={`+${computeRoundXp(currentIdeaScore.stars)} XP`}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {IDEA_CHECKLIST_META.map((item) => {
                        const checked = ideaChecks[item.key];
                        return (
                          <label
                            key={item.key}
                            className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border p-2.5 text-sm cursor-pointer"
                            style={{
                              backgroundColor: checked
                                ? 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface))'
                                : 'var(--color-surface-2)',
                              borderColor: checked
                                ? 'var(--color-correct)'
                                : 'var(--color-border)',
                              color: 'var(--color-text)',
                              opacity: currentIdeaScore.canSelfCheck ? 1 : 0.5,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!currentIdeaScore.canSelfCheck}
                              onChange={(e) => {
                                const next = { ...ideaChecks, [item.key]: e.target.checked };
                                setIdeaChecks(next);
                                const sc = scoreIdeaSelfCheck(ideaOutline, next);
                                if (e.target.checked) {
                                  playSfx('correct', { rate: 1 + sc.stars * 0.06 });
                                }
                              }}
                            />
                            <span>{item.labelVi}</span>
                          </label>
                        );
                      })}
                    </div>
                    {currentIdeaScore.warningVi && (
                      <div
                        className="rounded-[var(--radius-sm)] border p-2.5 text-xs"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-partial) 12%, transparent)',
                          borderColor: 'var(--color-partial)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {currentIdeaScore.warningVi}
                      </div>
                    )}
                  </div>

                  {/* Ranked ideaBank */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-writing)' }}>
                      Kho ý mẫu Band 8 (xếp ý gần với bạn lên đầu)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {rankedIdeaBank.slice(0, 6).map(({ item, matchedKeywords }, i) => (
                        <div
                          key={i}
                          className="rounded-[var(--radius-sm)] border p-3 space-y-1.5"
                          style={{
                            backgroundColor: 'var(--color-surface-2)',
                            borderColor:
                              matchedKeywords.length > 0
                                ? 'var(--color-writing)'
                                : 'var(--color-border)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Pill tone={item.side === 'for' ? 'correct' : 'info'} size="sm">
                              {item.side}
                            </Pill>
                            {matchedKeywords.length > 0 && (
                              <span
                                className="text-[11px] font-mono"
                                style={{ color: 'var(--color-writing)' }}
                              >
                                Khớp: {matchedKeywords.slice(0, 3).join(', ')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                            {item.idea}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                            {item.develop}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      skill="writing"
                      data-testid="w2-next-btn"
                      onClick={handleNextRound}
                    >
                      {roundIdx + 1 >= totalRounds ? 'Xem tổng kết' : 'Đề tiếp theo'}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ================= 3. THESIS SPRINT ================= */}
          {sprintType === 'thesis' && currentThesisPrompt && (
            <Card padding="md" className="space-y-4">
              <div className="space-y-2">
                <Pill tone="writing" size="sm">
                  {currentThesisPrompt.essayType} · {currentThesisPrompt.topic}
                </Pill>
                <p className="text-sm sm:text-base font-semibold leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  {currentThesisPrompt.prompt}
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="w2-thesis-input"
                  className="text-xs font-bold block"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  Viết câu luận điểm (15–45 từ, rõ lập trường, không sáo rỗng)
                </label>
                <textarea
                  id="w2-thesis-input"
                  data-testid="w2-thesis-input"
                  value={thesisInput}
                  disabled={roundStage === 'review'}
                  onChange={(e) => setThesisInput(e.target.value)}
                  rows={3}
                  placeholder="While I acknowledge that..., I contend that..."
                  className="w-full rounded-[var(--radius-sm)] border p-3 text-sm resize-y"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              {roundStage === 'input' ? (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    skill="writing"
                    data-testid="w2-submit-btn"
                    onClick={handleSubmitWritten}
                  >
                    Chấm tức thì
                  </Button>
                </div>
              ) : (
                currentThesisScore && (
                  <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StarReveal
                        stars={currentThesisScore.stars}
                        label={`${currentThesisScore.wordCount} từ · +${computeRoundXp(currentThesisScore.stars)} XP`}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { ok: currentThesisScore.checks.goodLength, label: 'Độ dài 12–55 từ' },
                        { ok: currentThesisScore.checks.clearStance, label: 'Lập trường rõ' },
                        { ok: currentThesisScore.checks.onTopic, label: 'Bám đề bài' },
                        { ok: currentThesisScore.checks.noCliche, label: 'Không sáo rỗng' },
                      ].map((chk) => (
                        <div
                          key={chk.label}
                          className="rounded-[var(--radius-sm)] border p-2 flex items-center gap-1.5"
                          style={{
                            borderColor: chk.ok ? 'var(--color-correct)' : 'var(--color-wrong)',
                            backgroundColor: chk.ok
                              ? 'color-mix(in srgb, var(--color-correct) 10%, transparent)'
                              : 'color-mix(in srgb, var(--color-wrong) 10%, transparent)',
                            color: 'var(--color-text)',
                          }}
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: chk.ok ? 'var(--color-correct)' : 'var(--color-wrong)' }}
                          />
                          <span>{chk.label}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                      {currentThesisScore.tipVi}
                    </p>

                    <div
                      className="rounded-[var(--radius-sm)] border p-3 space-y-1"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <div className="text-xs font-bold" style={{ color: 'var(--color-writing)' }}>
                        Thesis mẫu Band 8:
                      </div>
                      <p className="text-sm italic" style={{ color: 'var(--color-text)' }}>
                        &ldquo;{currentThesisScore.modelThesis}&rdquo;
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        skill="writing"
                        data-testid="w2-next-btn"
                        onClick={handleNextRound}
                      >
                        {roundIdx + 1 >= totalRounds ? 'Xem tổng kết' : 'Đề tiếp theo'}
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </Card>
          )}

          {/* ================= 4. CLICHÉ SURGERY ================= */}
          {sprintType === 'cliche' && currentClicheDrill && (
            <Card padding="md" className="space-y-4">
              <div className="space-y-2">
                <Pill tone="wrong" size="sm">
                  Cụm sáo rỗng · {currentClicheDrill.entry.category}
                </Pill>
                <p className="text-base leading-relaxed" style={{ color: 'var(--color-text)' }}>
                  {currentClicheDrill.sentenceBefore}
                  <mark
                    className="px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-wrong) 18%, transparent)',
                      color: 'var(--color-wrong)',
                    }}
                  >
                    {currentClicheDrill.entry.phrase}
                  </mark>
                  {currentClicheDrill.sentenceAfter}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Chọn cụm học thuật chuẩn Band 8 để thay thế phần tô đỏ:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {currentClicheDrill.options.map((opt, idx) => {
                  const isSelected = selectedChoiceIdx === idx;
                  const isCorrect = idx === currentClicheDrill.correctIndex;
                  const showResult = roundStage === 'review';
                  let borderColor = 'var(--color-border)';
                  let bg = 'var(--color-surface-2)';
                  if (showResult && isCorrect) {
                    borderColor = 'var(--color-correct)';
                    bg = 'color-mix(in srgb, var(--color-correct) 14%, var(--color-surface))';
                  } else if (showResult && isSelected && !isCorrect) {
                    borderColor = 'var(--color-wrong)';
                    bg = 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface))';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      data-testid={`w2-choice-${idx}`}
                      disabled={showResult}
                      onClick={() => handleSelectChoice(idx)}
                      className="text-left rounded-[var(--radius-md)] border p-3 text-sm transition-colors cursor-pointer disabled:cursor-default"
                      style={{ backgroundColor: bg, borderColor, color: 'var(--color-text)' }}
                    >
                      <span className="font-mono font-bold mr-2" style={{ color: 'var(--color-writing)' }}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {roundStage === 'review' && currentClicheScore && (
                <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StarReveal
                      stars={currentClicheScore.stars}
                      label={`+${computeRoundXp(currentClicheScore.stars)} XP`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={savedPhrases.has(currentClicheScore.keyPhrase)}
                      onClick={() => handleAddPhraseToSrs(currentClicheScore.keyPhrase)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {savedPhrases.has(currentClicheScore.keyPhrase) ? 'Đã lưu SRS' : 'Lưu cụm vào SRS'}
                    </Button>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                    {currentClicheScore.explanationVi}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      skill="writing"
                      data-testid="w2-next-btn"
                      onClick={handleNextRound}
                    >
                      {roundIdx + 1 >= totalRounds ? 'Xem tổng kết' : 'Câu tiếp theo'}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ================= 5. ACADEMIC UPGRADE (HEDGING & COHESION) ================= */}
          {sprintType === 'upgrade' && currentUpgradeDrill && (
            <Card padding="md" className="space-y-4">
              <div className="space-y-2">
                <Pill tone={currentUpgradeDrill.subKind === 'hedging' ? 'writing' : 'info'} size="sm">
                  {currentUpgradeDrill.subKind === 'hedging' ? 'Hedging Upgrade' : 'Cohesive Repair'}
                </Pill>
                <div
                  className="rounded-[var(--radius-sm)] border p-3 text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-wrong)' }}>
                    Band 6 · lỗi cần sửa: {currentUpgradeDrill.flawHighlight}
                  </div>
                  <p className="font-medium leading-relaxed">{currentUpgradeDrill.band6Sentence}</p>
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                  {currentUpgradeDrill.promptVi}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {currentUpgradeDrill.options.map((opt, idx) => {
                  const isSelected = selectedChoiceIdx === idx;
                  const isCorrect = idx === currentUpgradeDrill.correctIndex;
                  const showResult = roundStage === 'review';
                  let borderColor = 'var(--color-border)';
                  let bg = 'var(--color-surface-2)';
                  if (showResult && isCorrect) {
                    borderColor = 'var(--color-correct)';
                    bg = 'color-mix(in srgb, var(--color-correct) 14%, var(--color-surface))';
                  } else if (showResult && isSelected && !isCorrect) {
                    borderColor = 'var(--color-wrong)';
                    bg = 'color-mix(in srgb, var(--color-wrong) 14%, var(--color-surface))';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      data-testid={`w2-choice-${idx}`}
                      disabled={showResult}
                      onClick={() => handleSelectChoice(idx)}
                      className="text-left rounded-[var(--radius-md)] border p-3 text-sm leading-relaxed transition-colors cursor-pointer disabled:cursor-default"
                      style={{ backgroundColor: bg, borderColor, color: 'var(--color-text)' }}
                    >
                      <span className="font-mono font-bold mr-2" style={{ color: 'var(--color-writing)' }}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {roundStage === 'review' && currentUpgradeScore && (
                <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StarReveal
                      stars={currentUpgradeScore.stars}
                      label={`+${computeRoundXp(currentUpgradeScore.stars)} XP`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={savedPhrases.has(currentUpgradeScore.keyPhrase)}
                      onClick={() => handleAddPhraseToSrs(currentUpgradeScore.keyPhrase)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {savedPhrases.has(currentUpgradeScore.keyPhrase) ? 'Đã lưu SRS' : 'Lưu cấu trúc vào SRS'}
                    </Button>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                    {currentUpgradeScore.explanationVi}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      skill="writing"
                      data-testid="w2-next-btn"
                      onClick={handleNextRound}
                    >
                      {roundIdx + 1 >= totalRounds ? 'Xem tổng kết' : 'Câu tiếp theo'}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Toast title={toastMsg} tone="correct" onDismiss={() => setToastMsg(null)} />
        </div>
      )}
    </div>
  );
};

export default W2WritingSprints;
