import { describe, expect, it, vi } from 'vitest';
import {
  analyzeAudioBuffer,
  computeFrameEnergy,
  computeRms,
  rmsToDbfs,
  VadProcessor,
  type VadSilenceTimeoutEvent,
  type VadSpeechStartEvent,
} from './vad';

const SAMPLE_RATE = 16_000;

function makeSineBuffer(durationSec: number, amplitude = 0.25, freqHz = 440): Float32Array {
  const length = Math.round(durationSec * SAMPLE_RATE);
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buf[i] = amplitude * Math.sin((2 * Math.PI * freqHz * i) / SAMPLE_RATE);
  }
  return buf;
}

function makeSilenceBuffer(durationSec: number, noiseAmp = 0): Float32Array {
  const length = Math.round(durationSec * SAMPLE_RATE);
  const buf = new Float32Array(length);
  if (noiseAmp > 0) {
    // Deterministic pseudo-noise (high-frequency alternating pattern) with RMS = noiseAmp
    for (let i = 0; i < length; i++) {
      buf[i] = i % 2 === 0 ? noiseAmp : -noiseAmp;
    }
  }
  return buf;
}

function concatBuffers(parts: Float32Array[]): Float32Array {
  const total = parts.reduce((acc, p) => acc + p.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

describe('speech/vad pure helpers', () => {
  it('computes RMS, dBFS, and peak accurately for silence and sine waves', () => {
    expect(computeRms(new Float32Array(0))).toBe(0);
    expect(computeRms(new Float32Array(160))).toBe(0);
    expect(rmsToDbfs(0)).toBe(-100);
    expect(rmsToDbfs(1)).toBeCloseTo(0, 5);
    expect(rmsToDbfs(0.1)).toBeCloseTo(-20, 3);

    // Sine wave of amplitude 0.5 has theoretical RMS = 0.5 / sqrt(2) ≈ 0.35355
    const sine = makeSineBuffer(0.1, 0.5, 440);
    const energy = computeFrameEnergy(sine);
    expect(energy.rms).toBeCloseTo(0.5 / Math.SQRT2, 2);
    expect(energy.peak).toBeCloseTo(0.5, 2);
    expect(energy.dbfs).toBeCloseTo(20 * Math.log10(0.5 / Math.SQRT2), 1);
  });
});

describe('speech/vad VadProcessor & analyzeAudioBuffer', () => {
  it('detects speech segments and pauses of 0.5s, 2.5s, and 4.0s accurately', () => {
    // Timeline:
    // 0.0 - 0.6s: leading silence (start latency = 0.6s)
    // 0.6 - 2.0s: speech 1 (1.4s)
    // 2.0 - 2.5s: internal pause 1 (0.5s)
    // 2.5 - 4.0s: speech 2 (1.5s)
    // 4.0 - 6.5s: internal pause 2 (2.5s -> long pause > 2s, triggers silenceTimeout at 2.5s)
    // 6.5 - 8.0s: speech 3 (1.5s)
    // 8.0 - 12.0s: internal pause 3 (4.0s -> long pause > 2s, longestPause = 4.0s)
    // 12.0 - 13.0s: speech 4 (1.0s)
    const buffer = concatBuffers([
      makeSilenceBuffer(0.6),
      makeSineBuffer(1.4, 0.25),
      makeSilenceBuffer(0.5),
      makeSineBuffer(1.5, 0.25),
      makeSilenceBuffer(2.5),
      makeSineBuffer(1.5, 0.25),
      makeSilenceBuffer(4.0),
      makeSineBuffer(1.0, 0.25),
    ]);

    const speechStarts: VadSpeechStartEvent[] = [];
    const silenceTimeouts: VadSilenceTimeoutEvent[] = [];

    const summary = analyzeAudioBuffer(buffer, SAMPLE_RATE, {
      calibrationDurationMs: 0,
      silenceTimeoutMs: 2500,
      onSpeechStart: (ev) => speechStarts.push(ev),
      onSilenceTimeout: (ev) => silenceTimeouts.push(ev),
    });

    // 4 distinct speech utterances
    expect(speechStarts).toHaveLength(4);
    expect(speechStarts[0].startLatencyMs).toBeCloseTo(600, -2);
    expect(summary.startLatencySec).toBeCloseTo(0.6, 1);

    // 3 internal pauses: 0.5s, 2.5s, 4.0s
    expect(summary.internalPauses).toHaveLength(3);
    expect(summary.internalPauses[0].durationMs).toBeCloseTo(500, -2);
    expect(summary.internalPauses[1].durationMs).toBeCloseTo(2500, -2);
    expect(summary.internalPauses[2].durationMs).toBeCloseTo(4000, -2);

    expect(summary.pauseCount).toBe(3); // all 3 are >= 0.5s
    expect(summary.midPauseCount).toBe(0); // none in [1.0s, 2.0s]
    expect(summary.longPauseCount).toBe(2); // 2.5s and 4.0s
    expect(summary.pausesOver1s).toBe(2);
    expect(summary.longestPauseSec).toBeCloseTo(4.0, 1);

    // Speech duration: 1.4 + 1.5 + 1.5 + 1.0 = 5.4s out of 13.0s total
    expect(summary.totalDurationSec).toBeCloseTo(13.0, 1);
    expect(summary.speechDurationSec).toBeCloseTo(5.4, 1);
    expect(summary.activeDurationSec).toBeCloseTo(12.4, 1); // 13.0 - 0.6 leading silence
    expect(summary.silenceDurationSec).toBeCloseTo(7.6, 1);
    expect(summary.silenceRatio).toBeCloseTo(7.6 / 13.0, 2);

    // Silence timeout (2.5s) fired during both the 2.5s pause and the 4.0s pause
    expect(silenceTimeouts.length).toBeGreaterThanOrEqual(2);
    expect(silenceTimeouts[0].silenceDurationMs).toBeGreaterThanOrEqual(2500);
  });

  it('distinguishes mid pauses (1-2s) from long pauses (>2s)', () => {
    const buffer = concatBuffers([
      makeSineBuffer(1.0, 0.25),
      makeSilenceBuffer(1.4), // mid pause (1.0 - 2.0s)
      makeSineBuffer(1.0, 0.25),
      makeSilenceBuffer(1.8), // mid pause (1.0 - 2.0s)
      makeSineBuffer(1.0, 0.25),
      makeSilenceBuffer(2.6), // long pause (> 2.0s)
      makeSineBuffer(1.0, 0.25),
    ]);

    const summary = analyzeAudioBuffer(buffer, SAMPLE_RATE, {
      calibrationDurationMs: 0,
      silenceTimeoutMs: null,
    });

    expect(summary.pauseCount).toBe(3);
    expect(summary.midPauseCount).toBe(2);
    expect(summary.longPauseCount).toBe(1);
    expect(summary.pausesOver1s).toBe(3);
    expect(summary.longestPauseSec).toBeCloseTo(2.6, 1);
  });

  it('auto-calibrates noise floor during first 1s and flags noisy rooms', () => {
    const onCalibrationComplete = vi.fn();

    // 1.0s loud background noise (RMS = 0.06 > noisyFloorRmsThreshold 0.04) + 1.0s loud speech (RMS ~0.35)
    const noisyBuffer = concatBuffers([
      makeSilenceBuffer(1.0, 0.06),
      makeSineBuffer(1.0, 0.5),
    ]);

    const summary = analyzeAudioBuffer(noisyBuffer, SAMPLE_RATE, {
      calibrationDurationMs: 1000,
      noisyFloorRmsThreshold: 0.04,
      onCalibrationComplete,
    });

    expect(onCalibrationComplete).toHaveBeenCalledTimes(1);
    expect(summary.calibrated).toBe(true);
    expect(summary.noisyEnvironment).toBe(true);
    expect(summary.noiseFloorRms).toBeCloseTo(0.06, 2);
    // Adaptive threshold = 0.06 * 2.5 + 0.008 = 0.158
    expect(summary.thresholdRms).toBeCloseTo(0.158, 2);
    // Speech at RMS ~0.354 still detected above 0.158
    expect(summary.speechDurationSec).toBeCloseTo(1.0, 1);
  });

  it('respects minSilenceTimeoutElapsedMs (Part 2 guard before 60s)', () => {
    const onTimeout = vi.fn();
    const processor = new VadProcessor({
      calibrationDurationMs: 0,
      silenceTimeoutMs: 2500,
      minSilenceTimeoutElapsedMs: 10_000,
      onSilenceTimeout: onTimeout,
    });

    const speechFrame = makeSineBuffer(0.02, 0.25);
    const silentFrame = makeSilenceBuffer(0.02);

    // Speak 0..1000ms
    for (let t = 0; t < 1000; t += 20) {
      processor.processFrame(speechFrame, t, 20);
    }
    // Silent 1000..5000ms (4s silence, > 2.5s timeout, but elapsed < 10s guard!)
    for (let t = 1000; t < 5000; t += 20) {
      processor.processFrame(silentFrame, t, 20);
    }
    expect(onTimeout).not.toHaveBeenCalled();

    // Continue silence past 10_000ms -> now timeout fires
    for (let t = 5000; t <= 10_100; t += 20) {
      processor.processFrame(silentFrame, t, 20);
    }
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('handles all-silence audio cleanly without NaN or false speech', () => {
    const silent = makeSilenceBuffer(3.0, 0.002);
    const summary = analyzeAudioBuffer(silent, SAMPLE_RATE, {
      calibrationDurationMs: 1000,
    });

    expect(summary.speechDurationSec).toBe(0);
    expect(summary.activeDurationSec).toBe(0);
    expect(summary.startLatencySec).toBeNull();
    expect(summary.pauseCount).toBe(0);
    expect(summary.longestPauseSec).toBe(0);
    expect(summary.silenceRatio).toBe(1);
    expect(summary.noisyEnvironment).toBe(false);
  });
});
