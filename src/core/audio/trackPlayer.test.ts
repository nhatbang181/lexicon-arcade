import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TrackPlayerController,
  createTrackPlayer,
  formatTrackTime,
  type AudioElementLike,
} from './trackPlayer';

class MockAudioElement implements AudioElementLike {
  public src = '';
  public currentTime = 0;
  public duration = 180;
  public playbackRate = 1;
  public volume = 1;
  public muted = false;
  public preload = 'none';
  public paused = true;
  public playShouldReject = false;

  private listeners = new Map<string, Set<() => void>>();

  public play(): Promise<void> {
    if (this.playShouldReject) {
      return Promise.reject(new Error('NotSupportedError'));
    }
    this.paused = false;
    return Promise.resolve();
  }

  public pause(): void {
    this.paused = true;
  }

  public load(): void {
    // No-op; test fires loadedmetadata/error manually
  }

  public addEventListener(type: string, listener: () => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  public removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  public emit(type: string): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const fn of set) {
      fn();
    }
  }
}

describe('TrackPlayerController', () => {
  let mockAudio: MockAudioElement;
  let player: TrackPlayerController;

  beforeEach(() => {
    vi.useFakeTimers();
    mockAudio = new MockAudioElement();
    player = createTrackPlayer({
      audioFactory: () => mockAudio,
      tickIntervalMs: 50,
    });
  });

  afterEach(() => {
    player.destroy();
    vi.useRealTimers();
  });

  it('formats seconds as MM:SS safely', () => {
    expect(formatTrackTime(0)).toBe('00:00');
    expect(formatTrackTime(65)).toBe('01:05');
    expect(formatTrackTime(310.9)).toBe('05:10');
    expect(formatTrackTime(-5)).toBe('00:00');
  });

  it('loads track, resolves relative asset URL, plays, pauses, and emits time updates', async () => {
    const timeSpy = vi.fn();
    player.onTime(timeSpy);

    player.load('audio/listening/p1_001.mp3', { baseUrl: '/lexicon-arcade/' });
    expect(mockAudio.src).toBe('/lexicon-arcade/audio/listening/p1_001.mp3');
    expect(player.getState().status).toBe('loading');

    mockAudio.duration = 215;
    mockAudio.emit('loadedmetadata');
    expect(player.getState().status).toBe('ready');
    expect(player.getState().duration).toBe(215);

    await player.play();
    expect(player.getState().status).toBe('playing');
    expect(mockAudio.paused).toBe(false);

    mockAudio.currentTime = 42.5;
    mockAudio.emit('timeupdate');
    expect(player.getState().currentTime).toBe(42.5);
    expect(timeSpy).toHaveBeenLastCalledWith(42.5, 215);

    player.pause();
    expect(player.getState().status).toBe('paused');
    expect(mockAudio.paused).toBe(true);
  });

  it('supports seek clamping, rewind(5), and playback rate changes (0.75, 0.9, 1, 1.25)', () => {
    player.load('/audio/test.mp3');
    mockAudio.duration = 120;
    mockAudio.emit('loadedmetadata');

    player.seek(50);
    expect(player.getState().currentTime).toBe(50);
    expect(mockAudio.currentTime).toBe(50);

    player.rewind(5);
    expect(player.getState().currentTime).toBe(45);

    player.seek(-10);
    expect(player.getState().currentTime).toBe(0);

    player.seek(500);
    expect(player.getState().currentTime).toBe(120);

    player.setRate(0.75);
    expect(player.getState().rate).toBe(0.75);
    expect(mockAudio.playbackRate).toBe(0.75);

    player.setRate(1.25);
    expect(player.getState().rate).toBe(1.25);
    expect(mockAudio.playbackRate).toBe(1.25);
  });

  it('playSegment seeks to startSec and automatically stops at endSec', async () => {
    player.load('/audio/p1.mp3');
    mockAudio.duration = 200;
    mockAudio.emit('loadedmetadata');

    await player.playSegment(24.0, 31.5, 'Đoạn đáp án Q4');
    expect(player.getState().status).toBe('playing');
    expect(mockAudio.currentTime).toBe(24.0);
    expect(player.getState().activeSegment).toEqual({
      startSec: 24.0,
      endSec: 31.5,
      label: 'Đoạn đáp án Q4',
    });

    // Advance inside segment -> keeps playing
    mockAudio.currentTime = 28.0;
    mockAudio.emit('timeupdate');
    expect(player.getState().status).toBe('playing');

    // Cross endSec -> auto-pauses and clamps to endSec
    mockAudio.currentTime = 31.6;
    mockAudio.emit('timeupdate');
    expect(player.getState().status).toBe('paused');
    expect(player.getState().currentTime).toBe(31.5);
    expect(player.getState().activeSegment).toBeNull();
    expect(mockAudio.paused).toBe(true);
  });

  it('examLocked enforces single-pass playback: blocks pause, seek, rewind, rate change, and replay after ended', async () => {
    player.load('/audio/exam.mp3', { examLocked: true });
    mockAudio.duration = 150;
    mockAudio.emit('loadedmetadata');

    await player.play();
    expect(player.getState().status).toBe('playing');
    expect(player.getState().examStarted).toBe(true);

    // Pause, seek, rewind, setRate are all ignored in examLocked mode
    player.pause();
    expect(player.getState().status).toBe('playing');

    mockAudio.currentTime = 30;
    mockAudio.emit('timeupdate');
    player.seek(10);
    expect(player.getState().currentTime).toBe(30);

    player.rewind(5);
    expect(player.getState().currentTime).toBe(30);

    player.setRate(0.75);
    expect(player.getState().rate).toBe(1);

    // Volume control IS allowed in exam mode
    player.setVolume(0.6);
    expect(player.getState().volume).toBe(0.6);
    expect(mockAudio.volume).toBe(0.6);

    // Once ended, cannot play again while examLocked
    mockAudio.emit('ended');
    expect(player.getState().status).toBe('ended');

    await player.play();
    expect(player.getState().status).toBe('ended');

    // Unlocking for Debrief allows segment replay again
    player.setExamLocked(false);
    await player.playSegment(12, 18, 'Debrief clip');
    expect(player.getState().status).toBe('playing');
    expect(mockAudio.currentTime).toBe(12);
  });

  it('gracefully transitions to audio_missing and runs simulated playback + playSegment without errors', async () => {
    player.load('/audio/missing.mp3', { durationHintSec: 60 });
    mockAudio.emit('error');

    const afterError = player.getState();
    expect(afterError.status).toBe('audio_missing');
    expect(afterError.simulatedMode).toBe(true);
    expect(afterError.duration).toBe(60);

    await player.playSegment(10, 12, 'Simulated evidence');
    expect(player.getState().status).toBe('playing');
    expect(player.getState().currentTime).toBe(10);

    // Advance 1 second -> should be ~11s and still playing
    vi.advanceTimersByTime(1000);
    expect(player.getState().currentTime).toBeGreaterThanOrEqual(10.9);
    expect(player.getState().status).toBe('playing');

    // Advance another 1.2 seconds -> hits 12s boundary and auto-pauses
    vi.advanceTimersByTime(1200);
    expect(player.getState().status).toBe('paused');
    expect(player.getState().currentTime).toBe(12);
    expect(player.getState().activeSegment).toBeNull();
  });

  it('falls back gracefully to simulated playback when audio.play() rejects', async () => {
    mockAudio.playShouldReject = true;
    player.load('/audio/unsupported.mp3', { durationHintSec: 30 });
    mockAudio.emit('loadedmetadata');

    await player.play();
    expect(player.getState().simulatedMode).toBe(true);
    expect(player.getState().status).toBe('playing');
  });
});
