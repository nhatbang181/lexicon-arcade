import { describe, expect, it } from 'vitest';
import { parseGradingResponse } from './parse';
import { postcheckGradingResult, verifyQuoteInSource } from './postcheck';
import {
  SPEAKING_CLAUDE_RESPONSE,
  SPEAKING_FIXTURE_SOURCE_TEXT,
  SPRINT_OVERVIEW_CLAUDE_RESPONSE,
  SPRINT_OVERVIEW_SOURCE_TEXT,
  TASK1_CLAUDE_RESPONSE,
  TASK1_FIXTURE_ATTEMPT,
  TASK2_CLAUDE_RESPONSE,
  TASK2_FIXTURE_ATTEMPT,
} from '../../test/fixtures/grading';

describe('grading/postcheck', () => {
  it('verifies exact normalized quotes and fuzzy quotes >= 0.9, rejecting fabricated quotes', () => {
    const essay =
      'In recent years, secondary schools have debated whether unpaid community service benefits young people and the society.';

    // Exact normalized (different case + curly punctuation + extra spaces)
    expect(
      verifyQuoteInSource('  “unpaid   community service benefits young people” ', essay).matched,
    ).toBe(true);

    // Fuzzy >= 0.9 (1 character typo in a long phrase)
    const fuzzy = verifyQuoteInSource(
      'unpaid community service benefit young people and the society',
      essay,
    );
    expect(fuzzy.matched).toBe(true);
    expect(fuzzy.similarity).toBeGreaterThanOrEqual(0.9);

    // Hallucinated quote not in essay
    const fake = verifyQuoteInSource(
      'governments must invest heavily in renewable transport infrastructure',
      essay,
    );
    expect(fake.matched).toBe(false);
    expect(fake.similarity).toBeLessThan(0.9);
  });

  it('passes 100% of quotes with 0 anomalies on the Task 2 fixture', () => {
    const parsed = parseGradingResponse(TASK2_CLAUDE_RESPONSE, {
      expectedKind: 'task2',
      expectedAttemptId: TASK2_FIXTURE_ATTEMPT.attemptId,
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const report = postcheckGradingResult(parsed.data, {
      sourceText: TASK2_FIXTURE_ATTEMPT.essayText,
      rawObject: parsed.rawObject,
      expectedAttemptId: TASK2_FIXTURE_ATTEMPT.attemptId,
    });

    expect(report.quoteAudit.totalChecked).toBeGreaterThanOrEqual(8);
    expect(report.quoteAudit.hiddenCount).toBe(0);
    expect(report.computedOverallBand).toBe(6.5);
    expect(report.appWordCount).toBeGreaterThanOrEqual(250);
    expect(report.hasAnomalies).toBe(false);
  });

  it('passes 100% of quotes on Task 1, Speaking, and Sprint fixtures', () => {
    const t1 = parseGradingResponse(TASK1_CLAUDE_RESPONSE, { expectedKind: 'task1' });
    expect(t1.ok).toBe(true);
    if (t1.ok) {
      const r1 = postcheckGradingResult(t1.data, {
        sourceText: TASK1_FIXTURE_ATTEMPT.essayText,
      });
      expect(r1.quoteAudit.hiddenCount).toBe(0);
      expect(r1.computedOverallBand).toBe(7.0); // (7.5+7+7+7)/4 = 7.125 -> 7.0
      expect(r1.hasAnomalies).toBe(false);
    }

    const sp = parseGradingResponse(SPEAKING_CLAUDE_RESPONSE, { expectedKind: 'speaking' });
    expect(sp.ok).toBe(true);
    if (sp.ok) {
      const rSp = postcheckGradingResult(sp.data, {
        sourceText: SPEAKING_FIXTURE_SOURCE_TEXT,
      });
      expect(rSp.quoteAudit.hiddenCount).toBe(0);
      expect(rSp.computedOverallBand).toBe(6.5);
      expect(rSp.warnings.some((w) => w.code === 'PRONUNCIATION_INDIRECT')).toBe(true);
      expect(rSp.hasAnomalies).toBe(false); // info warning is not an anomaly
    }

    const spr = parseGradingResponse(SPRINT_OVERVIEW_CLAUDE_RESPONSE, {
      expectedKind: 'w2_overview',
    });
    expect(spr.ok).toBe(true);
    if (spr.ok) {
      const rSpr = postcheckGradingResult(spr.data, {
        sourceText: SPRINT_OVERVIEW_SOURCE_TEXT,
        expectedSprintRefs: ['w1:bar_001', 'w1:line_002', 'w1:pie_003'],
      });
      expect(rSpr.quoteAudit.hiddenCount).toBe(0);
      expect(rSpr.computedOverallBand).toBeNull();
      expect(rSpr.hasAnomalies).toBe(false);
    }
  });

  it('filters hallucinated quotes from strengths & issues and emits QUOTE_NOT_FOUND warning', () => {
    const parsed = parseGradingResponse(TASK2_CLAUDE_RESPONSE, { expectedKind: 'task2' });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const mutated = structuredClone(parsed.data);
    mutated.criteria.LR.issues.push({
      quote: 'This completely invented sentence never appeared in the essay.',
      problemVi: 'Trích dẫn bịa',
      fix: 'N/A',
      errorTag: 'other',
      severity: 'low',
    });

    const report = postcheckGradingResult(mutated, {
      sourceText: TASK2_FIXTURE_ATTEMPT.essayText,
    });
    expect(report.quoteAudit.hiddenCount).toBe(1);
    expect(report.quoteAudit.hiddenQuotes[0].quote).toContain('completely invented sentence');
    expect(report.cleanedResult.criteria.LR.issues).toHaveLength(
      parsed.data.criteria.LR.issues.length,
    );
    expect(report.warnings.some((w) => w.code === 'QUOTE_NOT_FOUND')).toBe(true);
    expect(report.hasAnomalies).toBe(true);
  });

  it('detects wordCount mismatch and overallBand mismatch from raw Claude object', () => {
    const parsed = parseGradingResponse(TASK2_CLAUDE_RESPONSE, { expectedKind: 'task2' });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const report = postcheckGradingResult(parsed.data, {
      sourceText: TASK2_FIXTURE_ATTEMPT.essayText,
      rawObject: {
        ...parsed.rawObject,
        wordCount: 410,
        overallBand: 7.5, // computed is 6.5
      },
    });

    expect(report.warnings.some((w) => w.code === 'WORD_COUNT_MISMATCH')).toBe(true);
    expect(report.warnings.some((w) => w.code === 'OVERALL_BAND_MISMATCH')).toBe(true);
    expect(report.computedOverallBand).toBe(6.5);
    expect(report.appWordCount).toBeLessThan(320);
  });

  it('enforces TR_TA <= 5.5 cap on under-length Task 2 essay and flags attemptId mismatch', () => {
    const parsed = parseGradingResponse(TASK2_CLAUDE_RESPONSE, { expectedKind: 'task2' });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const shortEssay =
      'I strongly agree that making voluntary work compulsory brings lasting benefits to both young people and the society. First of all, it helps students learn life skills.';

    const report = postcheckGradingResult(parsed.data, {
      sourceText: shortEssay,
      expectedAttemptId: 'att-different-id',
    });

    expect(report.cleanedResult.criteria.TR_TA.band).toBe(5.5);
    expect(report.warnings.some((w) => w.code === 'UNDER_LENGTH_CAP')).toBe(true);
    expect(report.warnings.some((w) => w.code === 'ATTEMPT_ID_MISMATCH')).toBe(true);
  });

  it('flags missing sprint item refs and strips unverified betterChunk', () => {
    const parsed = parseGradingResponse(SPRINT_OVERVIEW_CLAUDE_RESPONSE, {
      expectedKind: 'w2_overview',
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const mutated = structuredClone(parsed.data);
    mutated.items[0].betterChunk = {
      original: 'completely fabricated chunk not written by student',
      better: 'better phrasing',
    };

    const report = postcheckGradingResult(mutated, {
      sourceText: SPRINT_OVERVIEW_SOURCE_TEXT,
      expectedSprintRefs: ['w1:bar_001', 'w1:line_002', 'w1:pie_003', 'w1:map_004'],
    });

    expect(report.cleanedResult.items[0].betterChunk).toBeNull();
    expect(report.warnings.some((w) => w.code === 'MISSING_SPRINT_REFS')).toBe(true);
    expect(report.warnings.some((w) => w.code === 'QUOTE_NOT_FOUND')).toBe(true);
  });
});
