import { describe, expect, it } from 'vitest';
import {
  aggregateTurnMetrics,
  computeLexicalDiversity,
  computePronunciationProxy,
  computeSpeechMetrics,
  detectFillers,
  evaluateMetricsAgainstBand8,
  toGradingSpeakingMetrics,
  toRecordingMetrics,
} from './metrics';
import type { VadSummary } from './vad';

function makeVadSummary(overrides: Partial<VadSummary> = {}): VadSummary {
  return {
    totalDurationSec: 60,
    activeDurationSec: 55,
    speechDurationSec: 48,
    silenceDurationSec: 12,
    internalSilenceDurationSec: 7,
    silenceRatio: 0.2,
    startLatencySec: 1.2,
    pauseCount: 4,
    midPauseCount: 2,
    longPauseCount: 1,
    pausesOver1s: 3,
    longestPauseSec: 2.4,
    noiseFloorRms: 0.005,
    noiseFloorDbfs: -46,
    thresholdRms: 0.02,
    calibrated: true,
    noisyEnvironment: false,
    segments: [],
    internalPauses: [],
    ...overrides,
  };
}

describe('speech/metrics detectFillers', () => {
  it('detects single and multi-word fillers without false substring matches', () => {
    const transcript =
      'Um, well, you know, I basically kind of like playing tennis, uh, and actually it is sort of relaxing, you know? My umbrella is likely outside.';
    const result = detectFillers(transcript, 60);

    // Matched: um (1), you know (2), basically (1), kind of (1), like (1), uh (1), actually (1), sort of (1) = 9
    // "umbrella" must NOT match "um"; "likely" must NOT match "like"
    expect(result.fillerCount).toBe(9);
    expect(result.fillersPerMin).toBe(9);

    const byPhrase = Object.fromEntries(result.fillerList.map((f) => [f.phrase, f.count]));
    expect(byPhrase['you know']).toBe(2);
    expect(byPhrase['um']).toBe(1);
    expect(byPhrase['uh']).toBe(1);
    expect(byPhrase['basically']).toBe(1);
    expect(byPhrase['actually']).toBe(1);
    expect(byPhrase['kind of']).toBe(1);
    expect(byPhrase['sort of']).toBe(1);
    expect(byPhrase['like']).toBe(1);
  });

  it('returns zero fillers for clean academic speech or empty string', () => {
    expect(detectFillers('', 30).fillerCount).toBe(0);
    const clean =
      'Urban green spaces significantly enhance mental wellbeing and encourage community interaction.';
    const res = detectFillers(clean, 10);
    expect(res.fillerCount).toBe(0);
    expect(res.fillerList).toEqual([]);
  });
});

describe('speech/metrics lexical diversity (TTR, MATTR, Guiraud)', () => {
  it('handles empty text safely', () => {
    const res = computeLexicalDiversity('');
    expect(res.wordCount).toBe(0);
    expect(res.uniqueWordCount).toBe(0);
    expect(res.ttr).toBe(0);
    expect(res.mattr).toBe(0);
    expect(res.guiraud).toBe(0);
  });

  it('differentiates repetitive vs lexically rich speech and computes sliding MATTR accurately', () => {
    const repetitive = Array.from({ length: 120 }, () => 'good very nice thing').slice(0, 120).join(' ');
    const repDiv = computeLexicalDiversity(repetitive, 100);
    expect(repDiv.ttr).toBeLessThan(0.1);
    expect(repDiv.mattr).toBeLessThan(0.1);

    // 120 distinct words -> TTR = 1.0, MATTR = 1.0, Guiraud = 120 / sqrt(120) ≈ 10.95
    const richWords = Array.from({ length: 120 }, (_, i) => `word${i}`).join(' ');
    const richDiv = computeLexicalDiversity(richWords, 100);
    expect(richDiv.wordCount).toBe(120);
    expect(richDiv.uniqueWordCount).toBe(120);
    expect(richDiv.ttr).toBe(1);
    expect(richDiv.mattr).toBe(1);
    expect(richDiv.guiraud).toBeCloseTo(Math.sqrt(120), 1);
  });
});

describe('speech/metrics computeSpeechMetrics', () => {
  it('handles empty transcript gracefully', () => {
    const metrics = computeSpeechMetrics({ transcript: '', durationSec: 0 });
    expect(metrics.wordCount).toBe(0);
    expect(metrics.wpm).toBe(0);
    expect(metrics.fillerCount).toBe(0);
    expect(metrics.lexicalDiversity.mattr).toBe(0);
    expect(metrics.pauseMetrics.meanRunLength).toBe(0);
    expect(metrics.pronunciationProxy.isIndirectEstimate).toBe(true);
    expect(metrics.pronunciationProxy.level).toBe('unavailable');
  });

  it('computes slow, Band-8 normal, and fast WPM accurately', () => {
    const words60 = Array.from({ length: 60 }, (_, i) => `term${i}`).join(' ');
    const words150 = Array.from({ length: 150 }, (_, i) => `term${i}`).join(' ');
    const words210 = Array.from({ length: 210 }, (_, i) => `term${i}`).join(' ');

    const slow = computeSpeechMetrics({ transcript: words60, durationSec: 60 });
    const normal = computeSpeechMetrics({ transcript: words150, durationSec: 60 });
    const fast = computeSpeechMetrics({ transcript: words210, durationSec: 60 });

    expect(slow.wpm).toBe(60);
    expect(normal.wpm).toBe(150);
    expect(fast.wpm).toBe(210);

    expect(evaluateMetricsAgainstBand8(slow).wpm).toBe('below');
    expect(evaluateMetricsAgainstBand8(normal).wpm).toBe('target');
    expect(evaluateMetricsAgainstBand8(fast).wpm).toBe('below');
  });

  it('uses VAD activeDurationSec (excluding leading/trailing silence) and computes pause metrics & mean run length', () => {
    const words = Array.from({ length: 110 }, (_, i) => `topic${i}`).join(' ');
    // Active speaking span is 44s (even though total recording was 60s with 16s leading/trailing silence)
    const vad = makeVadSummary({
      totalDurationSec: 60,
      activeDurationSec: 44,
      pauseCount: 10, // -> mean run length = 110 / (10 + 1) = 10.0 words
      midPauseCount: 2,
      longPauseCount: 1,
      longestPauseSec: 2.8,
      startLatencySec: 1.1,
    });

    const metrics = computeSpeechMetrics({
      transcript: words,
      durationSec: 60,
      vadSummary: vad,
    });

    // WPM = 110 / 44 * 60 = 150.0
    expect(metrics.effectiveDurationSec).toBe(44);
    expect(metrics.wpm).toBe(150);
    expect(metrics.pauseMetrics.meanRunLength).toBe(10);
    expect(metrics.pauseMetrics.midPausesPerMin).toBeCloseTo((2 / 44) * 60, 1);
    expect(metrics.pauseMetrics.longPausesPerMin).toBeCloseTo((1 / 44) * 60, 1);
    expect(metrics.pauseMetrics.longestPauseSec).toBe(2.8);
    expect(metrics.pauseMetrics.startLatencySec).toBe(1.1);

    const recMetrics = toRecordingMetrics(metrics);
    expect(recMetrics.wpm).toBe(150);
    expect(recMetrics.pausesOver1s).toBe(3);
    expect(recMetrics.pausesOver2s).toBe(1);
    expect(recMetrics.avgRunLength).toBe(10);

    const grading = toGradingSpeakingMetrics(metrics, { part2DurationSec: 112 });
    expect(grading.wpm).toBe(150);
    expect(grading.part2DurationSec).toBe(112);
    expect(grading.medianStartLatencySec).toBe(1.1);
  });

  it('derives indirect pronunciation proxy from ASR confidence segments and flags low-confidence words', () => {
    const proxy = computePronunciationProxy([
      { text: 'Sustainable infrastructure requires long-term planning', confidence: 0.94 },
      { text: 'especially regarding metropolitan congestion', confidence: 0.62 },
      { text: 'in rapidly expanding coastal cities', confidence: 0.89 },
    ]);

    expect(proxy.isIndirectEstimate).toBe(true);
    expect(proxy.disclaimerVi).toContain('gián tiếp');
    expect(proxy.averageConfidence).toBeCloseTo((0.94 + 0.62 + 0.89) / 3, 2);
    expect(proxy.estimatedClarityPct).toBe(Math.round(((0.94 + 0.62 + 0.89) / 3) * 100));
    expect(proxy.lowConfidenceCount).toBe(1);
    expect(proxy.lowConfidenceWords.map((w) => w.word)).toContain('metropolitan');
    expect(proxy.level).toBe('moderate');
  });

  it('aggregates multiple speaking turns with median start latency and Part 2 duration', () => {
    const agg = aggregateTurnMetrics([
      {
        part: '1',
        transcript: 'I live in Ho Chi Minh City and I enjoy its vibrant street life.',
        durationSec: 10,
        vadSummary: makeVadSummary({ activeDurationSec: 8, startLatencySec: 0.9, pauseCount: 1 }),
      },
      {
        part: '2',
        transcript: Array.from({ length: 240 }, (_, i) => `story${i}`).join(' '),
        durationSec: 110,
        vadSummary: makeVadSummary({ activeDurationSec: 105, startLatencySec: 1.4, pauseCount: 5 }),
      },
      {
        part: '3',
        transcript: 'Public transport reduces emissions substantially when networks remain reliable.',
        durationSec: 12,
        vadSummary: makeVadSummary({ activeDurationSec: 10, startLatencySec: 2.1, pauseCount: 1 }),
      },
    ]);

    expect(agg.medianStartLatencySec).toBe(1.4);
    expect(agg.part2DurationSec).toBe(105);
    expect(agg.gradingMetrics.part2DurationSec).toBe(105);
    expect(agg.gradingMetrics.medianStartLatencySec).toBe(1.4);
    expect(agg.combined.wordCount).toBeGreaterThan(250);
  });
});
