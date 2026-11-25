// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  FX_KV_KEYS,
  destroyFxCanvasForTest,
  emit,
  haptic,
  reportFrameSample,
  resetFxTierForTest,
  resetMotionPrefForTest,
  screenPunch,
  setMotionPref,
  useFxTier,
  useMotionPref,
} from './fx';
import { Mascot } from './components/Mascot';
import { LiveCard } from './components/LiveCard';
import {
  MASCOT_DEFAULT_LINES,
  MASCOT_STATES,
  getMascotLine,
} from '../content/mascotLines';

beforeEach(() => {
  resetMotionPrefForTest();
  resetFxTierForTest('full');
  destroyFxCanvasForTest();
});

afterEach(() => {
  cleanup();
  destroyFxCanvasForTest();
  vi.restoreAllMocks();
});

describe('T3-A A3 · FX engine (useMotionPref, useFxTier, screenPunch, haptic, emit)', () => {
  it('useMotionPref export đủ khoá kv cho T3-C và cập nhật phản ứng tức thì', () => {
    expect(FX_KV_KEYS.REDUCED_MOTION).toBe('pref:reducedMotion');
    expect(FX_KV_KEYS.DISABLE_PARTICLES).toBe('pref:disableParticles');
    expect(FX_KV_KEYS.DISABLE_HAPTIC).toBe('pref:disableHaptic');
    expect(FX_KV_KEYS.SHOW_MASCOT).toBe('pref:showMascot');

    function Probe() {
      const pref = useMotionPref();
      return (
        <div>
          <span data-testid="rm">{String(pref.reducedMotion)}</span>
          <span data-testid="np">{String(pref.disableParticles)}</span>
          <span data-testid="nh">{String(pref.disableHaptic)}</span>
        </div>
      );
    }

    render(<Probe />);
    expect(screen.getByTestId('rm').textContent).toBe('false');

    act(() => {
      setMotionPref({ prefReducedMotion: true, disableParticles: true, disableHaptic: true });
    });
    expect(screen.getByTestId('rm').textContent).toBe('true');
    expect(screen.getByTestId('np').textContent).toBe('true');
    expect(screen.getByTestId('nh').textContent).toBe('true');
  });

  it('useFxTier tự động hạ bậc xuống low khi FPS thấp (< 40 fps) hoặc >= 3 frame > 50 ms và giữ E0', () => {
    function TierProbe({ examMode = false }: { examMode?: boolean }) {
      const fx = useFxTier({ examMode });
      return (
        <div>
          <span data-testid="tier">{fx.tier}</span>
          <span data-testid="e0">{String(fx.allowE0)}</span>
          <span data-testid="particles">{String(fx.allowParticles)}</span>
          <span data-testid="maxp">{fx.maxParticles}</span>
        </div>
      );
    }

    render(<TierProbe />);
    expect(screen.getByTestId('tier').textContent).toBe('full');
    expect(screen.getByTestId('particles').textContent).toBe('true');

    // Giả lập 8 khung hình chậm 36 ms (~27.7 FPS < 40 FPS)
    act(() => {
      for (let i = 0; i < 8; i++) {
        reportFrameSample(36, 1000 + i * 36);
      }
    });

    expect(screen.getByTestId('tier').textContent).toBe('low');
    expect(screen.getByTestId('e0').textContent).toBe('true');
    expect(screen.getByTestId('particles').textContent).toBe('false');
    expect(screen.getByTestId('maxp').textContent).toBe('0');

    // Bậc Thấp: emit() không tạo canvas hạt (13-ANIMATION §6)
    const spawned = emit('spark', { x: 100, y: 100, count: 12 });
    expect(spawned).toBe(0);
    expect(document.getElementById('lexicon-fx-canvas')).toBeNull();
  });

  it('useFxTier trả exam khi examMode=true và reduced khi bật Giảm chuyển động', () => {
    function TierProbe({ examMode = false }: { examMode?: boolean }) {
      const fx = useFxTier({ examMode });
      return (
        <div>
          <span data-testid="tier">{fx.tier}</span>
          <span data-testid="shake">{String(fx.allowShake)}</span>
          <span data-testid="e0">{String(fx.allowE0)}</span>
        </div>
      );
    }

    const { rerender } = render(<TierProbe examMode />);
    expect(screen.getByTestId('tier').textContent).toBe('exam');
    expect(screen.getByTestId('shake').textContent).toBe('false');

    rerender(<TierProbe examMode={false} />);
    act(() => {
      setMotionPref({ prefReducedMotion: true });
    });
    expect(screen.getByTestId('tier').textContent).toBe('reduced');
    expect(screen.getByTestId('shake').textContent).toBe('false');
    expect(screen.getByTestId('e0').textContent).toBe('true');
  });

  it('screenPunch cấm rung màn hình (body/html) khi trả lời sai (L-7) nhưng lắc thẻ câu hợp lệ', () => {
    const card = document.createElement('div');
    const animateSpy = vi.fn();
    card.animate = animateSpy;

    expect(screenPunch(document.body, { mode: 'wrong-card' })).toBe(false);
    expect(screenPunch(document.documentElement, { mode: 'wrong-card' })).toBe(false);
    expect(screenPunch(card, { mode: 'wrong-card' })).toBe(true);
    expect(animateSpy).toHaveBeenCalledTimes(1);

    // Khi reduced-motion bật: không lắc thẻ
    setMotionPref({ prefReducedMotion: true });
    expect(screenPunch(card, { mode: 'wrong-card' })).toBe(false);
  });

  it('haptic an toàn trên iOS không có navigator.vibrate và tôn trọng công tắc tắt rung + Exam', () => {
    const origVibrate = navigator.vibrate;
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
    expect(haptic('tap')).toBe(false);

    const vibrateSpy = vi.fn(() => true);
    Object.defineProperty(navigator, 'vibrate', { value: vibrateSpy, configurable: true });
    expect(haptic('correct')).toBe(true);
    expect(vibrateSpy).toHaveBeenCalledWith(15);

    // Exam mode: chặn mọi rung trừ timeup
    expect(haptic('correct', { examMode: true })).toBe(false);
    expect(haptic('timeup', { examMode: true })).toBe(true);

    // Công tắc Tắt rung
    setMotionPref({ disableHaptic: true });
    expect(haptic('tap')).toBe(false);

    Object.defineProperty(navigator, 'vibrate', { value: origVibrate, configurable: true });
  });
});

describe('T3-A A4 · Mascot, mascotLines và LiveCard 3D an toàn Safari', () => {
  it('Mascot render đủ 8 trạng thái với data-mascot, WebP lazy, object-contain và ẩn khi tắt/Exam', () => {
    for (const st of MASCOT_STATES) {
      expect(MASCOT_DEFAULT_LINES[st].length).toBeGreaterThan(0);
      expect(MASCOT_DEFAULT_LINES[st]).not.toMatch(/FSRS|Node|Mốc M\d|Δ band/i);
    }

    const dynamicLine = getMascotLine('co-vu', { dueCount: 18, estMinutes: 5 });
    expect(dynamicLine).toContain('18');
    expect(dynamicLine).toContain('5');

    const { rerender } = render(<Mascot state="vui" say="Đạt 90% rồi!" size={96} />);
    const root = document.querySelector('[data-mascot="vui"]');
    expect(root).not.toBeNull();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('assets/mascot/lexi-vui.webp');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.className).toContain('object-contain');

    // Exam mode: ẩn hoàn toàn (SR-24, SR-50)
    rerender(<Mascot state="vui" examMode />);
    expect(document.querySelector('[data-mascot]')).toBeNull();

    // Công tắc "Hiện nhân vật" = false: ẩn hoàn toàn
    rerender(<Mascot state="idle" examMode={false} />);
    expect(document.querySelector('[data-mascot="idle"]')).not.toBeNull();
    act(() => {
      setMotionPref({ showMascot: false });
    });
    expect(document.querySelector('[data-mascot]')).toBeNull();
  });

  it('LiveCard 3D tách 2 mặt riêng backface-visibility:hidden, mặt sau rotateY(180deg), không đặt overflow/opacity/filter lên preserve-3d (SR-45)', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <LiveCard
        skill="vocab"
        flipped={false}
        backContent={<div>Nghĩa mặt sau</div>}
        onClick={onClick}
        ariaLabel="Thẻ từ vựng"
      >
        <div>Từ mặt trước</div>
      </LiveCard>,
    );

    const flipper = document.querySelector('[data-live-card-flipper="3d"]') as HTMLElement;
    expect(flipper).not.toBeNull();
    expect(flipper.style.transformStyle).toBe('preserve-3d');
    // WebKit bug 71624: không overflow/opacity/filter trên phần tử preserve-3d
    expect(flipper.style.overflow).toBe('');
    expect(flipper.style.filter).toBe('');
    expect(flipper.className).not.toContain('overflow-hidden');

    const front = document.querySelector('[data-face="front"]') as HTMLElement;
    const back = document.querySelector('[data-face="back"]') as HTMLElement;
    expect(front.style.backfaceVisibility).toBe('hidden');
    expect(back.style.backfaceVisibility).toBe('hidden');
    expect(back.style.transform).toContain('rotateY(180deg)');

    // Bàn phím Enter/Space kích hoạt onClick (U16)
    const btn = screen.getByRole('button', { name: 'Thẻ từ vựng' });
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);

    // Khi reduced-motion bật: chuyển sang crossfade, không xoay 3D
    act(() => {
      setMotionPref({ prefReducedMotion: true });
    });
    rerender(
      <LiveCard skill="vocab" flipped backContent={<div>Nghĩa mặt sau</div>}>
        <div>Từ mặt trước</div>
      </LiveCard>,
    );
    expect(document.querySelector('[data-live-card-flipper="crossfade"]')).not.toBeNull();
    expect(screen.getByText('Nghĩa mặt sau')).toBeTruthy();
  });
});
