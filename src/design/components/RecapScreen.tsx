import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Home, Sparkles, AlertCircle, ArrowRight, FastForward } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from './Card';
import { Button } from './Button';
import { Pill } from './Pill';
import { Mascot } from './Mascot';
import type { MascotState } from '../../content/mascotLines';
import { dur, spring } from '../motion';
import { celebrate, useFxTier } from '../fx';
import { playSfx } from '../../core/audio/sfx';

export interface RecapMistakeItem {
  id: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  note?: string;
}

export interface RecapNextTask {
  taskId?: string;
  gameId?: string;
  title: string;
  path?: string;
}

export interface RecapScreenProps {
  scoreLabel: string; // e.g. '8/10' or '7.5'
  xpEarned: number;
  winStatement: string;
  /** Bỏ mặc định giả (A5): chỉ hiển thị khi có số liệu thật từ phiên. */
  accuracyPercent?: number;
  durationSec?: number;
  /** Thống kê lý do đếm điểm kiểu Balatro (03-ANIMATION §3 dòng 16). */
  correctCount?: number;
  baseXp?: number;
  comboMultiplier?: number;
  /** Nhãn thưởng cộng thêm ngoài base × combo (vd "+50 Boss · +20 phiên") để phép tính minh bạch. */
  bonusLabel?: string;
  mistakes?: RecapMistakeItem[];
  onRetryMistakes?: () => void;
  /** F5 (HANDOFF T1-B #4): nhiệm vụ tiếp theo từ Hôm nay. */
  nextTask?: RecapNextTask | null;
  onNextTask?: () => void;
  onGoToday: () => void;
  mascotState?: MascotState;
  /** Câu thoại riêng của Lexi trên màn Recap (tránh lặp câu mở đầu màn Hôm nay). */
  mascotSay?: string;
  examMode?: boolean;
  /** Tự bắn confetti 1 lần khi độ chính xác >= 80% (mặc định true). */
  autoCelebrate?: boolean;
  className?: string;
}

function resolveMascotState(accuracyPercent?: number, explicit?: MascotState): MascotState {
  if (explicit) return explicit;
  if (typeof accuracyPercent !== 'number') return 'vui';
  if (accuracyPercent >= 85) return 'an-mung';
  if (accuracyPercent >= 70) return 'vui';
  if (accuracyPercent < 50) return 'dong-vien';
  return 'co-vu';
}

export const RecapScreen: React.FC<RecapScreenProps> = ({
  scoreLabel,
  xpEarned,
  winStatement,
  accuracyPercent,
  durationSec,
  correctCount,
  baseXp,
  comboMultiplier,
  bonusLabel,
  mistakes = [],
  onRetryMistakes,
  nextTask,
  onNextTask,
  onGoToday,
  mascotState,
  mascotSay,
  examMode = false,
  autoCelebrate = true,
  className = '',
}) => {
  const fx = useFxTier({ examMode });
  const shouldAnimateTally = !examMode && fx.allowE1Slide && xpEarned > 0;
  const [displayXp, setDisplayXp] = useState<number>(shouldAnimateTally ? 0 : xpEarned);
  const [tallyDone, setTallyDone] = useState<boolean>(!shouldAnimateTally);
  const celebratedRef = useRef(false);

  const skipTally = useCallback(() => {
    setDisplayXp(xpEarned);
    setTallyDone(true);
  }, [xpEarned]);

  // Đếm điểm kiểu Balatro (≤ 1,1 s, có thể tua nhanh bằng nút hoặc Enter)
  useEffect(() => {
    if (!shouldAnimateTally) {
      setDisplayXp(xpEarned);
      setTallyDone(true);
      return;
    }
    setDisplayXp(0);
    setTallyDone(false);

    const totalMs = Math.min(1100, Math.max(450, xpEarned * 14));
    const start = performance.now();
    let lastTickStep = -1;
    let rafId = 0;

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / totalMs);
      const eased = 1 - (1 - t) * (1 - t);
      const val = Math.round(xpEarned * eased);
      setDisplayXp(val);

      const step = Math.floor(t * 6);
      if (step > lastTickStep && step < 6) {
        lastTickStep = step;
        playSfx('tick', { rate: 1 + step * 0.1, examMode });
      }

      if (t < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        setDisplayXp(xpEarned);
        setTallyDone(true);
        playSfx('sessionDone', { examMode });
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [xpEarned, shouldAnimateTally, examMode]);

  // Confetti nhẹ 1 lần khi độ chính xác ≥ 80% và không ở Exam
  useEffect(() => {
    if (!autoCelebrate || celebratedRef.current) return;
    if (!examMode && typeof accuracyPercent === 'number' && accuracyPercent >= 80 && fx.allowE3) {
      celebratedRef.current = true;
      void celebrate('session', { examMode });
    }
  }, [autoCelebrate, accuracyPercent, examMode, fx.allowE3]);

  const hasNextTask = Boolean(nextTask && onNextTask);
  const triggerPrimary = useCallback(() => {
    if (!tallyDone) {
      skipTally();
      return;
    }
    if (hasNextTask && onNextTask) {
      onNextTask();
    } else {
      onGoToday();
    }
  }, [tallyDone, skipTally, hasNextTask, onNextTask, onGoToday]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON')) {
        return;
      }
      e.preventDefault();
      triggerPrimary();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerPrimary]);

  const resolvedMascot = resolveMascotState(accuracyPercent, mascotState);
  const resolvedBaseXp = baseXp ?? (comboMultiplier && comboMultiplier > 1 ? Math.round(xpEarned / comboMultiplier) : xpEarned);
  const showBreakdown = !examMode && xpEarned > 0 && (correctCount !== undefined || (comboMultiplier !== undefined && comboMultiplier > 1));

  return (
    <div data-mascot-ok="true" className={`max-w-2xl mx-auto ${className}`}>
      <Card padding="lg" className="space-y-6">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="space-y-2.5 min-w-0">
            <Pill tone="correct" icon={<Sparkles className="w-3.5 h-3.5" />}>
              {examMode ? 'Hoàn thành bài thi' : 'Hoàn thành phiên luyện'}
            </Pill>

            <motion.div
              initial={fx.allowE1Slide ? { opacity: 0, y: -10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={fx.allowE1Slide ? spring.bouncy : { duration: dur.fast }}
              className="flex flex-wrap items-baseline gap-3"
            >
              <span
                className="font-display text-4xl sm:text-5xl font-extrabold tabular-nums"
                style={{ color: 'var(--color-text)' }}
              >
                {scoreLabel}
              </span>
              {!examMode && (
                <span
                  data-testid="recap-xp-counter"
                  className="text-lg font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-correct)' }}
                >
                  +{displayXp.toLocaleString('vi-VN')} XP
                </span>
              )}
              {!tallyDone && (
                <button
                  type="button"
                  onClick={skipTally}
                  className="inline-flex items-center gap-1 min-h-[44px] px-3 text-xs font-medium rounded-[var(--radius-sm)] border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-dim)',
                  }}
                >
                  <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tua nhanh</span>
                </button>
              )}
            </motion.div>

            {/* Lý do đếm điểm kiểu Balatro */}
            {showBreakdown && (
              <div
                className="flex flex-wrap items-center gap-1.5 text-xs font-medium tabular-nums"
                style={{ color: 'var(--color-text-dim)' }}
              >
                {correctCount !== undefined ? (
                  <span>
                    Đúng {correctCount} câu
                    {baseXp !== undefined && baseXp > 0 ? ` (${baseXp} XP)` : ''}
                  </span>
                ) : (
                  <span>Gốc +{resolvedBaseXp} XP</span>
                )}
                {comboMultiplier !== undefined && comboMultiplier > 1 && (
                  <>
                    <span aria-hidden="true">×</span>
                    <span style={{ color: 'var(--color-writing)' }}>
                      Thưởng chuỗi ×{comboMultiplier.toFixed(1)}
                    </span>
                  </>
                )}
                {bonusLabel && (
                  <>
                    <span aria-hidden="true">+</span>
                    <span style={{ color: 'var(--color-info)' }}>{bonusLabel}</span>
                  </>
                )}
                <span aria-hidden="true">=</span>
                <strong style={{ color: 'var(--color-correct)' }}>+{xpEarned} XP</strong>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {typeof accuracyPercent === 'number' && (
              <div
                className="px-4 py-2.5 rounded-[var(--radius-md)] border text-center min-w-24"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Chính xác
                </div>
                <div
                  className="text-lg font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
                >
                  {Math.round(accuracyPercent)}%
                </div>
              </div>
            )}

            {typeof durationSec === 'number' && (
              <div
                className="px-4 py-2.5 rounded-[var(--radius-md)] border text-center min-w-24"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Thời gian
                </div>
                <div
                  className="text-lg font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
                >
                  {Math.floor(durationSec / 60)}p {durationSec % 60}s
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nhân vật Lexi trong khung data-mascot-ok (ẩn khi Exam) */}
        {!examMode && (
          <Mascot
            state={resolvedMascot}
            say={
              mascotSay ??
              (typeof accuracyPercent === 'number'
                ? accuracyPercent >= 85
                  ? `Xuất sắc! ${Math.round(accuracyPercent)}% lượt đầu (+${xpEarned} XP)!`
                  : accuracyPercent >= 50
                    ? `Xong phiên ${Math.round(accuracyPercent)}% lượt đầu (+${xpEarned} XP), giữ đà nhé!`
                    : `Đã xong phiên (+${xpEarned} XP) — ôn lại câu sai là bật lên ngay!`
                : `Hoàn thành phiên luyện (+${xpEarned} XP)!`)
            }
            context={{ accuracyPct: accuracyPercent }}
            size={88}
            examMode={examMode}
          />
        )}

        {/* Câu thắng */}
        <div
          className="p-4 rounded-[var(--radius-md)] border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-info) 10%, var(--color-surface-2))',
            borderColor: 'color-mix(in srgb, var(--color-info) 35%, var(--color-border))',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-info)' }}>
            Điểm sáng phiên này
          </p>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-text)' }}>
            {winStatement}
          </p>
        </div>

        {/* Danh sách câu sai */}
        {mistakes.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--color-wrong)' }} aria-hidden="true" />
              <span>Cần xem lại ({mistakes.length} câu)</span>
            </div>
            <div className="space-y-2">
              {mistakes.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-[var(--radius-md)] border text-sm space-y-1"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {m.prompt}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--color-wrong)' }}>Bạn gõ: {m.userAnswer}</span>
                    <span style={{ color: 'var(--color-correct)' }}>Đúng: {m.correctAnswer}</span>
                  </div>
                  {m.note && (
                    <p className="text-xs pt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                      {m.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {mistakes.length > 0 && onRetryMistakes && (
            <Button
              variant="secondary"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={onRetryMistakes}
            >
              Ôn ngay {mistakes.length} câu sai
            </Button>
          )}

          {hasNextTask && nextTask && onNextTask ? (
            <>
              <Button
                variant="secondary"
                leftIcon={<Home className="w-4 h-4" />}
                onClick={onGoToday}
              >
                Về Hôm nay
              </Button>
              <Button
                variant="primary"
                hotkey="Enter"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={onNextTask}
              >
                Tiếp: {nextTask.title}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              hotkey="Enter"
              leftIcon={<Home className="w-4 h-4" />}
              onClick={onGoToday}
            >
              Về Hôm nay
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
