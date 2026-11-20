import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowRight,
  Award,
  BookA,
  CheckCircle2,
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

  // Keyboard shortcuts: 1-4 to pick, Enter to continue
  useEffect(() => {
    if (loading || result) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4' && selectedForCurrent === null) {
        const idx = Number(e.key) - 1;
        handleSelectChoice(idx);
      } else if (e.key === 'Enter' && selectedForCurrent !== null) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handleSelectChoice, loading, result, selectedForCurrent]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton lines={5} />
      </div>
    );
  }

  const motionVariants = prefersReduced ? reducedRouteVariants : questionSlideVariants;

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

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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
