import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowRight,
  Award,
  BookA,
  BookOpenText,
  CheckCircle2,
  Headphones,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Button,
  Card,
  ChoiceButton,
  Pill,
  Skeleton,
  type ChoiceState,
} from '../../design/components';
import { questionSlideVariants, reducedRouteVariants } from '../../design/motion';
import { PassageView } from '../../games/_shared';
import { db } from '../../core/storage/db';
import { bandRepo } from '../../core/storage/repos/bandRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { profileRepo } from '../../core/storage/repos/profileRepo';
import {
  buildStarterVocabCards,
  evaluateVocabPlacement,
  loadPlacementVocabQuestions,
  type PlacementEvaluation,
  type PlacementVocabQuestion,
} from './placementData';
import {
  READING_PLACEMENT_PASSAGE,
  READING_PLACEMENT_QUESTIONS,
  evaluateReadingPlacement,
  type ReadingPlacementEvaluation,
} from './readingPlacement';
import {
  LISTENING_PLACEMENT_QUESTIONS,
  evaluateListeningPlacement,
  type ListeningPlacementEvaluation,
} from './listeningPlacement';
import { scoreListeningAnswer } from '../../core/scoring/listeningAnswer';

const INDEX_LABELS = ['A', 'B', 'C', 'D'] as const;

export const PlacementScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const prefersReduced = useReducedMotion();

  const [questions, setQuestions] = useState<PlacementVocabQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedForCurrent, setSelectedForCurrent] = useState<number | null>(null);
  const [result, setResult] = useState<PlacementEvaluation | null>(null);
  const [seededCount, setSeededCount] = useState(0);
  const [savingResult, setSavingResult] = useState(false);

  // Step 2 (optional): Reading Placement (6 questions from readingPlacement.ts)
  const [step, setStep] = useState<
    'vocab' | 'reading' | 'reading_result' | 'listening' | 'listening_result'
  >('vocab');
  const [readingIndex, setReadingIndex] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [selectedReadingKey, setSelectedReadingKey] = useState<string | null>(null);
  const [readingResult, setReadingResult] = useState<ReadingPlacementEvaluation | null>(null);
  const [savingReading, setSavingReading] = useState(false);

  // Step 3 (optional): Listening Placement (6 questions from listeningPlacement.ts)
  const [listeningIndex, setListeningIndex] = useState(0);
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [listeningDraft, setListeningDraft] = useState('');
  const [selectedListeningAnswer, setSelectedListeningAnswer] = useState<string | null>(null);
  const [listeningResult, setListeningResult] = useState<ListeningPlacementEvaluation | null>(null);
  const [savingListening, setSavingListening] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const qs = await loadPlacementVocabQuestions();
      if (!active) return;
      setQuestions(qs);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const finishPlacement = useCallback(
    async (finalAnswers: number[], qs: PlacementVocabQuestion[]) => {
      setSavingResult(true);
      try {
        const evalResult = evaluateVocabPlacement(qs, finalAnswers);
        const now = new Date();
        const nowMs = now.getTime();

        const currentProfile = await profileRepo.getOrCreate();
        await profileRepo.update({
          placementDoneAt: nowMs,
          skillLevels: {
            ...currentProfile.skillLevels,
            v1: evalResult.recommendedLevel,
            v2: evalResult.recommendedLevel,
            v3: evalResult.recommendedLevel,
          },
        });

        await bandRepo.add({
          skill: 'R',
          mode: 'training',
          ts: nowMs,
          correct: evalResult.correct,
          total: evalResult.total,
          band: evalResult.estimatedBand,
          sourceGameId: 'v1',
        });

        const starterCards = await buildStarterVocabCards(now);
        await cardRepo.bulkUpsert(starterCards);
        await db.kv.bulkPut([
          { key: 'onboarding_done', value: true },
          { key: 'onboarding_skipped', value: false },
          { key: 'placement_vocab_band', value: evalResult.estimatedBand },
          { key: 'placement_vocab_size', value: evalResult.estimatedVocabSize },
        ]);

        setSeededCount(starterCards.length);
        setResult(evalResult);
      } finally {
        setSavingResult(false);
      }
    },
    [],
  );

  const handleSelectChoice = useCallback(
    (choiceIdx: number) => {
      if (selectedForCurrent !== null || result) return;
      setSelectedForCurrent(choiceIdx);
    },
    [selectedForCurrent, result],
  );

  const handleNext = useCallback(() => {
    if (selectedForCurrent === null || savingResult) return;
    const nextAnswers = [...answers, selectedForCurrent];
    setAnswers(nextAnswers);
    setSelectedForCurrent(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      void finishPlacement(nextAnswers, questions);
    }
  }, [answers, currentIndex, finishPlacement, questions, savingResult, selectedForCurrent]);

  const finishReadingPlacement = useCallback(
    async (finalAnswers: Record<string, string>) => {
      setSavingReading(true);
      try {
        const evalReading = evaluateReadingPlacement(finalAnswers, READING_PLACEMENT_QUESTIONS);
        const nowMs = Date.now();
        const currentProfile = await profileRepo.getOrCreate();

        await profileRepo.update({
          estimatedBands: {
            ...currentProfile.estimatedBands,
            R: evalReading.estimatedBand,
          },
          skillLevels: {
            ...currentProfile.skillLevels,
            r1: evalReading.recommendedLevel,
            r2: evalReading.recommendedLevel,
          },
        });

        await bandRepo.add({
          skill: 'R',
          mode: 'training',
          ts: nowMs,
          correct: evalReading.correct,
          total: evalReading.total,
          band: evalReading.estimatedBand,
          sourceGameId: 'r1',
        });

        await db.kv.put({ key: 'placement_reading_band', value: evalReading.estimatedBand });

        setReadingResult(evalReading);
        setStep('reading_result');
      } finally {
        setSavingReading(false);
      }
    },
    [],
  );

  const handleSelectReadingChoice = useCallback(
    (choiceKey: string) => {
      if (selectedReadingKey !== null || step !== 'reading') return;
      setSelectedReadingKey(choiceKey);
    },
    [selectedReadingKey, step],
  );

  const handleNextReading = useCallback(() => {
    if (selectedReadingKey === null || savingReading) return;
    const currentReadingQ = READING_PLACEMENT_QUESTIONS[readingIndex];
    const nextAnswers = {
      ...readingAnswers,
      [currentReadingQ.id]: selectedReadingKey,
    };
    setReadingAnswers(nextAnswers);
    setSelectedReadingKey(null);

    if (readingIndex + 1 < READING_PLACEMENT_QUESTIONS.length) {
      setReadingIndex((i) => i + 1);
    } else {
      void finishReadingPlacement(nextAnswers);
    }
  }, [finishReadingPlacement, readingAnswers, readingIndex, savingReading, selectedReadingKey]);

  const startReadingPlacement = useCallback(() => {
    setReadingIndex(0);
    setReadingAnswers({});
    setSelectedReadingKey(null);
    setReadingResult(null);
    setStep('reading');
  }, []);

  const finishListeningPlacement = useCallback(
    async (finalAnswers: Record<string, string>) => {
      setSavingListening(true);
      try {
        const evalListening = evaluateListeningPlacement(
          finalAnswers,
          LISTENING_PLACEMENT_QUESTIONS,
        );
        const nowMs = Date.now();
        const currentProfile = await profileRepo.getOrCreate();

        await profileRepo.update({
          estimatedBands: {
            ...currentProfile.estimatedBands,
            L: evalListening.estimatedBand,
          },
          skillLevels: {
            ...currentProfile.skillLevels,
            l1: evalListening.recommendedLevel,
            l2: evalListening.recommendedLevel,
          },
        });

        await bandRepo.add({
          skill: 'L',
          mode: 'training',
          ts: nowMs,
          correct: evalListening.correct,
          total: evalListening.total,
          band: evalListening.estimatedBand,
          sourceGameId: 'l1',
        });

        await db.kv.put({
          key: 'placement_listening_band',
          value: evalListening.estimatedBand,
        });

        setListeningResult(evalListening);
        setStep('listening_result');
      } finally {
        setSavingListening(false);
      }
    },
    [],
  );

  const startListeningPlacement = useCallback(() => {
    setListeningIndex(0);
    setListeningAnswers({});
    setListeningDraft('');
    setSelectedListeningAnswer(null);
    setListeningResult(null);
    setStep('listening');
  }, []);

  const handleSelectListeningChoice = useCallback(
    (choiceKey: string) => {
      if (selectedListeningAnswer !== null || step !== 'listening') return;
      setSelectedListeningAnswer(choiceKey);
    },
    [selectedListeningAnswer, step],
  );

  const handleCheckListeningCompletion = useCallback(() => {
    if (selectedListeningAnswer !== null || step !== 'listening') return;
    setSelectedListeningAnswer(listeningDraft.trim());
  }, [listeningDraft, selectedListeningAnswer, step]);

  const handleNextListening = useCallback(() => {
    if (selectedListeningAnswer === null || savingListening) return;
    const currentListeningQ = LISTENING_PLACEMENT_QUESTIONS[listeningIndex];
    const nextAnswers = {
      ...listeningAnswers,
      [currentListeningQ.id]: selectedListeningAnswer,
    };
    setListeningAnswers(nextAnswers);
    setListeningDraft('');
    setSelectedListeningAnswer(null);

    if (listeningIndex + 1 < LISTENING_PLACEMENT_QUESTIONS.length) {
      setListeningIndex((i) => i + 1);
    } else {
      void finishListeningPlacement(nextAnswers);
    }
  }, [
    finishListeningPlacement,
    listeningAnswers,
    listeningIndex,
    savingListening,
    selectedListeningAnswer,
  ]);

  // Keyboard shortcuts: 1-4 to pick, Enter to continue (both Step 1 Vocab & Step 2 Reading)
  useEffect(() => {
    if (loading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (step === 'vocab' && !result) {
        if (e.key >= '1' && e.key <= '4' && selectedForCurrent === null) {
          const idx = Number(e.key) - 1;
          handleSelectChoice(idx);
        } else if (e.key === 'Enter' && selectedForCurrent !== null) {
          e.preventDefault();
          handleNext();
        }
      } else if (step === 'reading') {
        const currentReadingQ = READING_PLACEMENT_QUESTIONS[readingIndex];
        if (!currentReadingQ) return;
        if (e.key >= '1' && e.key <= '4' && selectedReadingKey === null) {
          const idx = Number(e.key) - 1;
          const choice = currentReadingQ.choices[idx];
          if (choice) handleSelectReadingChoice(choice.key);
        } else if (e.key === 'Enter' && selectedReadingKey !== null) {
          e.preventDefault();
          handleNextReading();
        }
      } else if (step === 'listening') {
        const currentListeningQ = LISTENING_PLACEMENT_QUESTIONS[listeningIndex];
        if (!currentListeningQ) return;
        const target = e.target as HTMLElement | null;
        const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
        if (
          currentListeningQ.kind !== 'completion' &&
          !isInput &&
          e.key >= '1' &&
          e.key <= '4' &&
          selectedListeningAnswer === null
        ) {
          const idx = Number(e.key) - 1;
          const choice = currentListeningQ.choices?.[idx];
          if (choice) handleSelectListeningChoice(choice.key);
        } else if (e.key === 'Enter' && selectedListeningAnswer !== null) {
          e.preventDefault();
          handleNextListening();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleNext,
    handleNextListening,
    handleNextReading,
    handleSelectChoice,
    handleSelectListeningChoice,
    handleSelectReadingChoice,
    listeningIndex,
    loading,
    readingIndex,
    result,
    selectedForCurrent,
    selectedListeningAnswer,
    selectedReadingKey,
    step,
  ]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton lines={5} />
      </div>
    );
  }

  const motionVariants = prefersReduced ? reducedRouteVariants : questionSlideVariants;

  // Step 3 Result: Listening Placement Evaluation
  if (step === 'listening_result' && listeningResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10" data-testid="placement-listening-result">
        <Card skillAccent="listening" padding="lg" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Pill tone="listening" icon={<Headphones className="w-3.5 h-3.5" />}>
              Hoàn tất Bước 3 · Định vị Listening
            </Pill>
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              Đúng {listeningResult.correct}/{listeningResult.total} câu (
              {Math.round(listeningResult.accuracy * 100)}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-[var(--radius-md)] border space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                Ước lượng Band Listening
              </span>
              <div
                className="text-3xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-listening)' }}
                data-testid="placement-listening-band"
              >
                Band {listeningResult.estimatedBand.toFixed(1)}
              </div>
            </div>

            <div
              className="p-4 rounded-[var(--radius-md)] border space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                Phân rã 4 Part Listening
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                {([1, 2, 3, 4] as const).map((part) => (
                  <Pill key={part} tone="neutral">
                    Part {part}: {listeningResult.byPart[part].correct}/
                    {listeningResult.byPart[part].total}
                  </Pill>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {listeningResult.summaryVi}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate('/play/l1')}>
              Luyện L1 Trap Detector
            </Button>
            <Button variant="secondary" onClick={() => navigate('/play/l2')}>
              Luyện L2 Dictation Ladder
            </Button>
            <Button
              variant="primary"
              skill="listening"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/')}
              data-testid="placement-go-today"
            >
              Về trang Hôm nay
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 3 Active: Listening Placement (6 questions spanning Parts 1–4)
  if (step === 'listening') {
    const currentListeningQ = LISTENING_PLACEMENT_QUESTIONS[listeningIndex];
    const lProgressPct = Math.round(
      ((listeningIndex + 1) / LISTENING_PLACEMENT_QUESTIONS.length) * 100,
    );
    const isAnswered = selectedListeningAnswer !== null;
    const isCorrect =
      isAnswered &&
      (currentListeningQ.kind === 'completion'
        ? scoreListeningAnswer(
            selectedListeningAnswer,
            currentListeningQ.acceptedAnswers ?? [],
            { wordLimit: currentListeningQ.wordLimit },
          ).correct
        : selectedListeningAnswer === currentListeningQ.correctKey);

    return (
      <div className="max-w-2xl mx-auto space-y-5 pb-10" data-testid="placement-listening-step">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Pill tone="listening" icon={<Headphones className="w-3.5 h-3.5" />}>
                Bước 3 · Placement Listening
              </Pill>
              <Pill tone="neutral">Part {currentListeningQ.part}</Pill>
              <Pill tone="neutral">Band {currentListeningQ.bandTier.toFixed(1)}</Pill>
            </div>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              Câu {listeningIndex + 1} / {LISTENING_PLACEMENT_QUESTIONS.length}
            </span>
          </div>

          <div
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-2)' }}
            role="progressbar"
            aria-valuenow={listeningIndex + 1}
            aria-valuemin={1}
            aria-valuemax={LISTENING_PLACEMENT_QUESTIONS.length}
          >
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${lProgressPct}%`,
                backgroundColor: 'var(--color-listening)',
              }}
            />
          </div>
        </div>

        <Card skillAccent="listening" padding="lg" className="space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold" style={{ color: 'var(--color-listening)' }}>
              {currentListeningQ.contextEn}
            </div>
            <div
              className="p-3.5 rounded-[var(--radius-md)] border text-sm leading-relaxed italic"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              {currentListeningQ.transcriptSnippet}
            </div>
            <p className="text-base font-semibold leading-snug pt-1" style={{ color: 'var(--color-text)' }}>
              {currentListeningQ.prompt}
            </p>
          </div>

          {currentListeningQ.kind === 'completion' ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  disabled={isAnswered}
                  value={listeningDraft}
                  onChange={(e) => setListeningDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAnswered) {
                      e.preventDefault();
                      handleCheckListeningCompletion();
                    }
                  }}
                  placeholder="Gõ đáp án ngắn theo giới hạn từ..."
                  data-testid="listening-placement-input"
                  className="flex-1 min-h-[44px] px-3.5 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
                {!isAnswered && (
                  <Button
                    variant="secondary"
                    onClick={handleCheckListeningCompletion}
                    data-testid="listening-placement-check-btn"
                  >
                    Kiểm tra
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(currentListeningQ.choices ?? []).map((choice, idx) => {
                let state: ChoiceState = 'idle';
                if (isAnswered) {
                  if (choice.key === currentListeningQ.correctKey) {
                    state =
                      choice.key === selectedListeningAnswer ? 'correct' : 'reveal-correct';
                  } else if (choice.key === selectedListeningAnswer) {
                    state = 'wrong';
                  }
                }
                return (
                  <ChoiceButton
                    key={choice.key}
                    indexLabel={String(idx + 1)}
                    label={choice.text}
                    state={state}
                    disabled={isAnswered}
                    onClick={() => handleSelectListeningChoice(choice.key)}
                    data-testid={`listening-placement-choice-${idx}`}
                  />
                );
              })}
            </div>
          )}

          {isAnswered && (
            <div
              className="p-3.5 rounded-[var(--radius-md)] border space-y-1.5"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
              aria-live="polite"
            >
              <div
                className="text-xs font-semibold"
                style={{
                  color: isCorrect ? 'var(--color-correct)' : 'var(--color-wrong)',
                }}
              >
                {isCorrect
                  ? 'Chính xác!'
                  : `Đáp án đúng: ${
                      currentListeningQ.kind === 'completion'
                        ? (currentListeningQ.acceptedAnswers?.[0] ?? '')
                        : (currentListeningQ.correctKey ?? '')
                    }`}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                {currentListeningQ.explanationVi}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Bỏ qua, về Hôm nay
            </Button>
            <Button
              variant="primary"
              skill="listening"
              hotkey="Enter"
              disabled={!isAnswered || savingListening}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleNextListening}
              data-testid="listening-placement-next-btn"
            >
              {listeningIndex + 1 === LISTENING_PLACEMENT_QUESTIONS.length
                ? savingListening
                  ? 'Đang tính kết quả...'
                  : 'Xem kết quả Listening'
                : 'Câu tiếp theo'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 2 Result: Reading Placement Evaluation
  if (step === 'reading_result' && readingResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10" data-testid="placement-reading-result">
        <Card skillAccent="reading" padding="lg" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Pill tone="reading" icon={<BookOpenText className="w-3.5 h-3.5" />}>
              Hoàn tất Bước 2 · Định vị Reading
            </Pill>
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              Đúng {readingResult.correct}/{readingResult.total} câu ({Math.round(readingResult.accuracy * 100)}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-[var(--radius-md)] border space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                Ước lượng Band Reading
              </span>
              <div
                className="text-3xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-reading)' }}
                data-testid="placement-reading-band"
              >
                Band {readingResult.estimatedBand.toFixed(1)}
              </div>
            </div>

            <div
              className="p-4 rounded-[var(--radius-md)] border space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                Phân rã 3 kỹ năng Reading
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                <Pill tone="neutral">
                  TFNG: {readingResult.bySkill.tfng.correct}/{readingResult.bySkill.tfng.total}
                </Pill>
                <Pill tone="neutral">
                  Paraphrase: {readingResult.bySkill.paraphrase.correct}/{readingResult.bySkill.paraphrase.total}
                </Pill>
                <Pill tone="neutral">
                  Inference: {readingResult.bySkill.inference.correct}/{readingResult.bySkill.inference.total}
                </Pill>
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {readingResult.summaryVi}
          </p>

          <div
            className="p-4 rounded-[var(--radius-md)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-listening) 8%, var(--color-surface-2))',
              borderColor: 'color-mix(in srgb, var(--color-listening) 45%, var(--color-border))',
            }}
          >
            <div className="space-y-0.5">
              <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                <Headphones className="w-4 h-4" style={{ color: 'var(--color-listening)' }} />
                <span>Bước 3 (tuỳ chọn): Định vị kỹ năng Listening</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                6 câu ngắn phủ đủ Part 1–4 (Completion, MCQ, Map) để định vị level L1 &amp; L2.
              </p>
            </div>
            <Button
              variant="primary"
              skill="listening"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={startListeningPlacement}
              data-testid="placement-start-listening"
            >
              Làm bước 3 Listening
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate('/play/r1')}>
              Luyện R1 TFNG Judge
            </Button>
            <Button variant="secondary" onClick={() => navigate('/play/r2')}>
              Luyện R2 Headline Editor
            </Button>
            <Button
              variant="primary"
              skill="reading"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/')}
              data-testid="placement-go-today"
            >
              Về trang Hôm nay
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Step 2 Active: Reading Placement (Mini-passage + 6 questions)
  if (step === 'reading') {
    const currentReadingQ = READING_PLACEMENT_QUESTIONS[readingIndex];
    const rProgressPct = Math.round(
      ((readingIndex + 1) / READING_PLACEMENT_QUESTIONS.length) * 100,
    );
    const showEvidence = selectedReadingKey !== null ? [currentReadingQ.evidence] : [];

    return (
      <div className="max-w-6xl mx-auto space-y-4 pb-10" data-testid="placement-reading-step">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Pill tone="reading" icon={<BookOpenText className="w-3.5 h-3.5" />}>
                Bước 2 · Placement Reading
              </Pill>
              <Pill tone="neutral">Band {currentReadingQ.bandTier.toFixed(1)}</Pill>
            </div>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              Câu {readingIndex + 1} / {READING_PLACEMENT_QUESTIONS.length}
            </span>
          </div>

          <div
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-2)' }}
            role="progressbar"
            aria-valuenow={readingIndex + 1}
            aria-valuemin={1}
            aria-valuemax={READING_PLACEMENT_QUESTIONS.length}
          >
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${rProgressPct}%`,
                backgroundColor: 'var(--color-reading)',
              }}
            />
          </div>
        </div>

        <PassageView
          passage={{
            title: READING_PLACEMENT_PASSAGE.title,
            subtitle: READING_PLACEMENT_PASSAGE.subtitle,
            level: 'P2',
            paragraphs: [...READING_PLACEMENT_PASSAGE.paragraphs],
            wordCount: READING_PLACEMENT_PASSAGE.wordCount,
          }}
          highlighterMode="readonly"
          answerEvidence={showEvidence}
          passageHeading={`Đoạn văn kiểm tra · ${READING_PLACEMENT_PASSAGE.wordCount} từ`}
          questionTabBadge={`${readingIndex + 1}/${READING_PLACEMENT_QUESTIONS.length}`}
        >
          <Card padding="lg" className="space-y-5">
            <div className="space-y-2">
              <Pill tone="reading">
                {currentReadingQ.skill === 'tfng'
                  ? 'True / False / Not Given'
                  : currentReadingQ.skill === 'paraphrase'
                    ? 'Paraphrase'
                    : 'Inference'}
              </Pill>
              <p className="text-base font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
                {currentReadingQ.prompt}
              </p>
            </div>

            <div className="space-y-2.5">
              {currentReadingQ.choices.map((choice, idx) => {
                let state: ChoiceState = 'idle';
                if (selectedReadingKey !== null) {
                  if (choice.key === currentReadingQ.correctKey) {
                    state = choice.key === selectedReadingKey ? 'correct' : 'reveal-correct';
                  } else if (choice.key === selectedReadingKey) {
                    state = 'wrong';
                  }
                }
                return (
                  <ChoiceButton
                    key={choice.key}
                    indexLabel={String(idx + 1)}
                    label={choice.text}
                    state={state}
                    disabled={selectedReadingKey !== null}
                    onClick={() => handleSelectReadingChoice(choice.key)}
                    data-testid={`reading-placement-choice-${idx}`}
                  />
                );
              })}
            </div>

            {selectedReadingKey !== null && (
              <div
                className="p-3.5 rounded-[var(--radius-md)] border space-y-1.5"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
                aria-live="polite"
              >
                <div className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                  {selectedReadingKey === currentReadingQ.correctKey
                    ? 'Chính xác!'
                    : `Đáp án đúng: ${currentReadingQ.correctKey}`}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                  {currentReadingQ.explanationVi}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Bỏ qua, về Hôm nay
              </Button>
              <Button
                variant="primary"
                skill="reading"
                hotkey="Enter"
                disabled={selectedReadingKey === null || savingReading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleNextReading}
                data-testid="reading-placement-next-btn"
              >
                {readingIndex + 1 === READING_PLACEMENT_QUESTIONS.length
                  ? savingReading
                    ? 'Đang tính kết quả...'
                    : 'Xem kết quả Reading'
                  : 'Câu tiếp theo'}
              </Button>
            </div>
          </Card>
        </PassageView>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10" data-testid="placement-result">
        <Card skillAccent="vocab" padding="lg" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Pill tone="vocab" icon={<Award className="w-3.5 h-3.5" />}>
              Hoàn tất định vị từ vựng
            </Pill>
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              Đúng {result.correct}/{result.total} câu ({Math.round(result.accuracy * 100)}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-[var(--radius-md)] border space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                Ước lượng Band từ vựng ban đầu
              </span>
              <div
                className="text-3xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-vocab)' }}
                data-testid="placement-estimated-band"
              >
                Band {result.estimatedBand.toFixed(1)}
              </div>
            </div>

            <div
              className="p-4 rounded-[var(--radius-md)] border space-y-1"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
              }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-dim)' }}>
                Vốn từ học thuật chủ động ước tính
              </span>
              <div
                className="text-3xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
              >
                ≈ {result.estimatedVocabSize.toLocaleString('vi-VN')} từ
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {result.summaryVi}
          </p>

          <div
            className="p-3.5 rounded-[var(--radius-md)] border flex items-center gap-3 text-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-correct) 10%, var(--color-surface-2))',
              borderColor: 'var(--color-correct)',
              color: 'var(--color-text)',
            }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--color-correct)' }} />
            <span>
              Đã nạp <strong>{seededCount} thẻ khởi đầu</strong> vào kho FSRS để{' '}
              <strong>V1 Daily Run</strong> sẵn sàng luyện ngay hôm nay (Level đề xuất:{' '}
              {result.recommendedLevel}).
            </span>
          </div>

          <div
            className="p-4 rounded-[var(--radius-md)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-reading) 8%, var(--color-surface-2))',
              borderColor: 'color-mix(in srgb, var(--color-reading) 45%, var(--color-border))',
            }}
          >
            <div className="space-y-0.5">
              <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                <BookOpenText className="w-4 h-4" style={{ color: 'var(--color-reading)' }} />
                <span>Bước 2 (tuỳ chọn): Định vị kỹ năng Reading</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                1 mini-passage + 6 câu (TFNG, Paraphrase, Inference) để tinh chỉnh level R1 & R2.
              </p>
            </div>
            <Button
              variant="primary"
              skill="reading"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={startReadingPlacement}
              data-testid="placement-start-reading"
            >
              Làm bước 2 Reading
            </Button>
          </div>

          <div
            className="p-4 rounded-[var(--radius-md)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-listening) 8%, var(--color-surface-2))',
              borderColor: 'color-mix(in srgb, var(--color-listening) 45%, var(--color-border))',
            }}
          >
            <div className="space-y-0.5">
              <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                <Headphones className="w-4 h-4" style={{ color: 'var(--color-listening)' }} />
                <span>Bước 3 (tuỳ chọn): Định vị kỹ năng Listening</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                6 câu ngắn phủ đủ Part 1–4 để ước lượng Band Listening và tinh chỉnh level L1 &amp; L2.
              </p>
            </div>
            <Button
              variant="primary"
              skill="listening"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={startListeningPlacement}
              data-testid="placement-start-listening-from-vocab"
            >
              Làm bước 3 Listening
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <Button
              variant="secondary"
              onClick={() => navigate('/play/v1')}
            >
              Vào V1 Daily Run ngay
            </Button>
            <Button
              variant="primary"
              skill="vocab"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/')}
              data-testid="placement-go-today"
            >
              Về trang Hôm nay
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header + Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pill tone="vocab" icon={<BookA className="w-3.5 h-3.5" />}>
              Placement Từ vựng
            </Pill>
            <Pill tone="neutral">Band {currentQuestion.bandTier.toFixed(1)}</Pill>
          </div>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            Câu {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div
          className="h-2 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-2)' }}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
        >
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progressPct}%`,
              backgroundColor: 'var(--color-vocab)',
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          variants={motionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Card padding="lg" className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-dim)' }}>
                {currentQuestion.promptVi}
              </p>
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {currentQuestion.word}
                </h1>
                {currentQuestion.ipa && (
                  <span
                    className="text-sm"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                  >
                    {currentQuestion.ipa}
                  </span>
                )}
              </div>
              <p
                className="text-sm italic px-3.5 py-2.5 rounded-[var(--radius-md)] border"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                “{currentQuestion.contextEn}”
              </p>
            </div>

            <div className="space-y-2.5">
              {currentQuestion.choices.map((choice, idx) => {
                let state: ChoiceState = 'idle';
                if (selectedForCurrent !== null) {
                  if (idx === currentQuestion.correctIndex) {
                    state = idx === selectedForCurrent ? 'correct' : 'reveal-correct';
                  } else if (idx === selectedForCurrent) {
                    state = 'wrong';
                  }
                }
                return (
                  <ChoiceButton
                    key={idx}
                    indexLabel={INDEX_LABELS[idx]}
                    label={choice}
                    state={state}
                    disabled={selectedForCurrent !== null}
                    onClick={() => handleSelectChoice(idx)}
                    data-testid={`placement-choice-${idx}`}
                  />
                );
              })}
            </div>

            {selectedForCurrent !== null && (
              <div
                className="p-3.5 rounded-[var(--radius-md)] border space-y-2"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
                aria-live="polite"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Sparkles
                    className="w-4 h-4"
                    style={{
                      color:
                        selectedForCurrent === currentQuestion.correctIndex
                          ? 'var(--color-correct)'
                          : 'var(--color-partial)',
                    }}
                  />
                  <span style={{ color: 'var(--color-text)' }}>
                    {selectedForCurrent === currentQuestion.correctIndex
                      ? 'Chính xác!'
                      : 'Ghi chú nhanh:'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                  {currentQuestion.explanationVi}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Bỏ qua, về Hôm nay
              </Button>
              <Button
                variant="primary"
                skill="vocab"
                hotkey="Enter"
                disabled={selectedForCurrent === null || savingResult}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleNext}
                data-testid="placement-next-btn"
              >
                {currentIndex + 1 === questions.length
                  ? savingResult
                    ? 'Đang tính kết quả...'
                    : 'Xem kết quả'
                  : 'Câu tiếp theo'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
