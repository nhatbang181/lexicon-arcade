// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Button } from './components/Button';
import { ChoiceButton } from './components/ChoiceButton';
import { Card } from './components/Card';
import { LiveCard } from './components/LiveCard';
import { FeedbackPanel } from './components/FeedbackPanel';
import { RecapScreen } from './components/RecapScreen';
import { resetFxTierForTest, resetMotionPrefForTest, setMotionPref } from './fx';
import { computeComboRate } from '../core/audio/sfx';

beforeEach(() => {
  resetMotionPrefForTest();
  resetFxTierForTest('full');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('T3-A A5 · Component polish, M5 fix, RecapScreen & SFX combo rate', () => {
  it('Button đảm bảo vùng chạm >= 44px cho mọi size (sm/md/lg) và class .design-btn (U14)', () => {
    render(
      <div>
        <Button size="sm">Nhỏ</Button>
        <Button size="md" disabled>
          Khoá
        </Button>
      </div>,
    );
    const smBtn = screen.getByRole('button', { name: 'Nhỏ' });
    expect(smBtn.className).toContain('min-h-[44px]');
    expect(smBtn.className).toContain('design-btn');
    const disBtn = screen.getByRole('button', { name: 'Khoá' });
    expect(disBtn).toHaveProperty('disabled', true);
  });

  it('ChoiceButton có data-state đúng và class .design-choice (U14)', () => {
    render(<ChoiceButton indexLabel="A" label="Đáp án A" state="reveal-correct" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('data-state')).toBe('reveal-correct');
    expect(btn.className).toContain('design-choice');
  });

  it('Card tương tác bấm được bằng bàn phím Enter và Space (U16)', () => {
    const onClick = vi.fn();
    render(
      <Card interactive onClick={onClick} aria-label="Thẻ học">
        Nội dung thẻ
      </Card>,
    );
    const card = screen.getByRole('button', { name: 'Thẻ học' });
    expect(card.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('LiveCard dùng lớp .live-card-depth (::before), không tạo div sibling rỗng gây lỗi M5 và giãn h-full khít ô grid', () => {
    const { container } = render(
      <LiveCard skill="vocab" className="h-full">
        <p>Thẻ nội dung</p>
      </LiveCard>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('live-card-depth');
    expect(root.className).toContain('h-full');
    // Chỉ có đúng 1 con trực tiếp (khung motion), không có div bóng sibling
    expect(root.children.length).toBe(1);
    const motionWrap = root.firstElementChild as HTMLElement;
    expect(motionWrap.className).toContain('h-full');
    const face = motionWrap.firstElementChild as HTMLElement;
    expect(face.className).toContain('h-full');
  });

  it('FeedbackPanel hiển thị khe nextTipVi (Lần sau để ý) khi được truyền (PP-03)', () => {
    render(
      <FeedbackPanel
        open
        status="wrong"
        title="Chưa đúng"
        explanation="Cần danh từ số nhiều."
        nextTipVi="Kiểm tra hậu tố -s sau lượng từ many."
        onNext={() => undefined}
      />,
    );
    expect(screen.getByText(/Lần sau để ý:/i)).toBeTruthy();
    expect(screen.getByText(/Kiểm tra hậu tố -s sau lượng từ many\./i)).toBeTruthy();
  });

  it('RecapScreen bỏ mặc định giả (80%/240s), nhận nextTask + onNextTask, có data-mascot-ok và ẩn Mascot khi Exam', () => {
    const onNext = vi.fn();
    const onToday = vi.fn();

    // Không truyền accuracyPercent / durationSec -> không tự bịa 80% hoặc 4p 0s
    const { rerender } = render(
      <RecapScreen
        scoreLabel="7/10"
        xpEarned={90}
        winStatement="Nhớ chắc 7 cụm từ học thuật."
        onGoToday={onToday}
      />,
    );
    expect(screen.queryByText('80%')).toBeNull();
    expect(screen.queryByText('4p 0s')).toBeNull();
    expect(document.querySelector('[data-mascot-ok="true"]')).not.toBeNull();
    expect(document.querySelector('[data-mascot]')).not.toBeNull();

    // Có nextTask + onNextTask -> nút chính là "Tiếp: ..."
    setMotionPref({ prefReducedMotion: true });
    rerender(
      <RecapScreen
        scoreLabel="9/10"
        xpEarned={135}
        correctCount={9}
        comboMultiplier={1.5}
        accuracyPercent={90}
        durationSec={125}
        winStatement="Vượt mốc 90% chính xác."
        nextTask={{ taskId: 't2', gameId: 'v2', title: 'V2 · Rèn cụm từ' }}
        onNextTask={onNext}
        onGoToday={onToday}
      />,
    );
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText('2p 5s')).toBeTruthy();
    expect(screen.getByText(/Thưởng chuỗi ×1\.5/i)).toBeTruthy();

    const nextBtn = screen.getByRole('button', { name: /Tiếp: V2 · Rèn cụm từ/i });
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalledTimes(1);

    // Exam mode: ẩn Mascot & không hiện XP
    rerender(
      <RecapScreen
        scoreLabel="7.0"
        xpEarned={0}
        accuracyPercent={85}
        winStatement="Hoàn thành bài thi thử."
        onGoToday={onToday}
        examMode
      />,
    );
    expect(document.querySelector('[data-mascot]')).toBeNull();
    expect(screen.queryByTestId('recap-xp-counter')).toBeNull();
  });

  it('computeComboRate tăng +1 bán cung mỗi combo, tối đa +12 (2.0x) rồi quay về 1.0x', () => {
    expect(computeComboRate(0)).toBe(1);
    expect(computeComboRate(1)).toBeCloseTo(Math.pow(2, 1 / 12), 3);
    expect(computeComboRate(12)).toBeCloseTo(2, 3);
    expect(computeComboRate(13)).toBe(1);
  });
});
