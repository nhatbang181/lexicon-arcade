import { describe, expect, it } from 'vitest';
import {
  buildGradingPacket,
  buildPacket,
  canBuildWritingPacket,
  PACKET_CLOSING_INSTRUCTION,
  PROMPT_VERSIONS,
  RAW_PROMPTS,
  sanitizePacketFilename,
} from './packet';
import {
  SPEAKING_FIXTURE_ATTEMPT,
  SPRINT_OVERVIEW_FIXTURE_ATTEMPT,
  TASK1_FIXTURE_ATTEMPT,
  TASK2_FIXTURE_ATTEMPT,
} from '../../test/fixtures/grading';

describe('grading/packet', () => {
  it('loads single-source-of-truth prompts via ?raw and parses PROMPT_VERSION', () => {
    expect(PROMPT_VERSIONS.writing).toBe('w-1.0');
    expect(PROMPT_VERSIONS.speaking).toBe('s-1.0');
    expect(PROMPT_VERSIONS.sprint).toBe('sp-1.0');
    expect(RAW_PROMPTS.writing).toContain('IELTS ACADEMIC WRITING');
    expect(RAW_PROMPTS.speaking).toContain('IELTS SPEAKING');
    expect(RAW_PROMPTS.sprint).toContain('QUICK SPRINT CHECK');
  });

  it('builds a Task 2 packet with prompt, BÀI CẦN CHẤM, attemptId, word count, and closing instruction', () => {
    const built = buildGradingPacket(TASK2_FIXTURE_ATTEMPT);
    expect(built.promptVersion).toBe('w-1.0');
    expect(built.filename).toBe('cham_att-w2-community-001.md');
    expect(built.wordCount).toBeGreaterThanOrEqual(250);
    expect(built.markdown).toContain('PROMPT_VERSION: w-1.0');
    expect(built.markdown).toContain('## BÀI CẦN CHẤM');
    expect(built.markdown).toContain('`att-w2-community-001`');
    expect(built.markdown).toContain('`task2`');
    expect(built.markdown).toContain('`exam`');
    expect(built.markdown).toContain(TASK2_FIXTURE_ATTEMPT.promptText);
    expect(built.markdown).toContain('less likely to make a crime');
    expect(built.markdown.trim().endsWith(PACKET_CLOSING_INSTRUCTION)).toBe(true);
  });

  it('builds a Task 1 packet including Markdown data table and keyFeatures list', () => {
    const md = buildPacket('task1', {
      attemptId: TASK1_FIXTURE_ATTEMPT.attemptId,
      date: TASK1_FIXTURE_ATTEMPT.date,
      mode: TASK1_FIXTURE_ATTEMPT.mode,
      durationSec: TASK1_FIXTURE_ATTEMPT.durationSec,
      promptText: TASK1_FIXTURE_ATTEMPT.promptText,
      essayText: TASK1_FIXTURE_ATTEMPT.essayText,
      task1Visual: TASK1_FIXTURE_ATTEMPT.task1Visual,
      keyFeatures: TASK1_FIXTURE_ATTEMPT.keyFeatures,
    });
    expect(md).toContain('### Dữ liệu biểu đồ (Markdown)');
    expect(md).toContain('| Danh mục | Private car | Public bus | Rail / Metro | Cycling |');
    expect(md).toContain('| 2005 | 54 | 26 | 12 | 8 |');
    expect(md).toContain('`kf_overall`');
    expect(md).toContain('`kf_rail_double`');
    expect(md.trim().endsWith(PACKET_CLOSING_INSTRUCTION)).toBe(true);
  });

  it('includes previous issues section when building a re-grade (revision) packet', () => {
    const built = buildGradingPacket({
      ...TASK2_FIXTURE_ATTEMPT,
      attemptId: 'att-w2-community-001-rev1',
      revisionNumber: 1,
      previousIssues: [
        {
          criterion: 'LR',
          quote: 'less likely to make a crime',
          problemVi: 'Collocation sai',
          fix: 'less likely to commit a crime',
        },
      ],
    });
    expect(built.markdown).toContain('Chấm lại – Danh sách lỗi lần trước (Lần sửa #1)');
    expect(built.markdown).toContain('revision.resolvedIssueQuotes');
    expect(built.markdown).toContain('less likely to make a crime');
  });

  it('builds a Speaking packet with cue card, fluency metrics table, ASR low-confidence words, and part turns', () => {
    const built = buildGradingPacket(SPEAKING_FIXTURE_ATTEMPT);
    expect(built.promptVersion).toBe('s-1.0');
    expect(built.markdown).toContain('PROMPT_VERSION: s-1.0');
    expect(built.markdown).toContain('### Part 2 Cue Card');
    expect(built.markdown).toContain('### Chỉ số Fluency (đo từ audio)');
    expect(built.markdown).toContain('128 từ/phút');
    expect(built.markdown).toContain('`concentrate` (62%)');
    expect(built.markdown).toContain('#### Part 1');
    expect(built.markdown).toContain('#### Part 2');
    expect(built.markdown).toContain('#### Part 3');
  });

  it('builds a Sprint packet with all item refs and responses', () => {
    const built = buildGradingPacket(SPRINT_OVERVIEW_FIXTURE_ATTEMPT);
    expect(built.promptVersion).toBe('sp-1.0');
    expect(built.markdown).toContain('PROMPT_VERSION: sp-1.0');
    expect(built.markdown).toContain('ref: `w1:bar_001`');
    expect(built.markdown).toContain('ref: `w1:line_002`');
    expect(built.markdown).toContain('ref: `w1:pie_003`');
    expect(built.markdown.trim().endsWith(PACKET_CLOSING_INSTRUCTION)).toBe(true);
  });

  it('validates minimum 50 words for writing packet and sanitizes download filenames', () => {
    expect(canBuildWritingPacket('Too short essay here.').ok).toBe(false);
    expect(canBuildWritingPacket(TASK2_FIXTURE_ATTEMPT.essayText).ok).toBe(true);
    expect(sanitizePacketFilename('att/w2: 001')).toBe('cham_att_w2_001.md');
  });
});
