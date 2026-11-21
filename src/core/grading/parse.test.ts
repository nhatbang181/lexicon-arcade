import { describe, expect, it } from 'vitest';
import { buildRepairPrompt, parseGradingResponse } from './parse';
import {
  SPEAKING_CLAUDE_RESPONSE,
  SPRINT_OVERVIEW_CLAUDE_RESPONSE,
  TASK1_CLAUDE_RESPONSE,
  TASK2_CLAUDE_RESPONSE,
} from '../../test/fixtures/grading';

function extractJsonBody(fullFixture: string): string {
  const m = fullFixture.match(/```json\r?\n([\s\S]*?)```/);
  if (!m) throw new Error('Fixture missing ```json block');
  return m[1].trim();
}

describe('grading/parse (≥ 15 cases)', () => {
  it('1. parses clean Task 2 Claude response fixture with Part A and ```json block', () => {
    const res = parseGradingResponse(TASK2_CLAUDE_RESPONSE, {
      expectedKind: 'task2',
      expectedAttemptId: 'att-w2-community-001',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.kind).toBe('task2');
    expect(res.data.attemptId).toBe('att-w2-community-001');
    expect(res.data.criteria.LR.band).toBe(6.0);
    expect(res.extractionSource).toBe('fenced_json');
    expect(res.repairsApplied).toHaveLength(0);
    expect(res.attemptIdMismatch).toBeNull();
    expect(res.partAText).toContain('Part A');
  });

  it('2. parses clean Task 1 Claude response fixture', () => {
    const res = parseGradingResponse(TASK1_CLAUDE_RESPONSE, {
      expectedKind: 'task1',
      expectedAttemptId: 'att-w1-transport-001',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.kind).toBe('task1');
    expect(res.data.task1?.overviewPresent).toBe(true);
    expect(res.data.task1?.keyFeaturesCovered).toContain('kf_rail_double');
  });

  it('3. parses clean Speaking Claude response fixture', () => {
    const res = parseGradingResponse(SPEAKING_CLAUDE_RESPONSE, {
      expectedKind: 'speaking',
      expectedAttemptId: 'att-s1-mock-001',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.kind).toBe('speaking');
    expect(res.data.pronunciationConfidence).toBe('low');
    expect(res.data.partNotes).toHaveLength(3);
  });

  it('4. parses clean Sprint Claude response fixture (w2_overview)', () => {
    const res = parseGradingResponse(SPRINT_OVERVIEW_CLAUDE_RESPONSE, {
      expectedKind: 'w2_overview',
      expectedAttemptId: 'att-w2-ov-001',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.kind).toBe('w2_overview');
    expect(res.data.items).toHaveLength(3);
    expect(res.data.items[0].stars).toBe(3);
  });

  it('5. picks the LAST ```json block when multiple ```json blocks appear in the response', () => {
    const finalJson = extractJsonBody(TASK2_CLAUDE_RESPONSE);
    const multiBlock = [
      'Chào bạn, ví dụ định dạng nhỏ trước:',
      '```json',
      '{ "example": true, "note": "not the final grading result" }',
      '```',
      'Và đây là kết quả chấm chính thức ở cuối:',
      '```json',
      finalJson,
      '```',
    ].join('\n');

    const res = parseGradingResponse(multiBlock, { expectedKind: 'task2' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.attemptId).toBe('att-w2-community-001');
    expect(res.extractionSource).toBe('fenced_json');
  });

  it('6. handles extra Vietnamese greetings before and closing notes after the JSON fence', () => {
    const wrapped = `Xin chào Bang! Dưới đây là bài chấm chi tiết của mình nhé 😊\n\n${TASK2_CLAUDE_RESPONSE}\n\nNếu bạn muốn sửa lại thân bài 1 rồi gửi mình chấm lại thì cứ nhắn nhé!`;
    const res = parseGradingResponse(wrapped, { expectedKind: 'task2' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.attemptId).toBe('att-w2-community-001');
  });

  it('7. extracts JSON from a generic ``` fence without json language tag', () => {
    const body = extractJsonBody(TASK1_CLAUDE_RESPONSE);
    const input = `Nhận xét ngắn gọn.\n\n\`\`\`\n${body}\n\`\`\``;
    const res = parseGradingResponse(input, { expectedKind: 'task1' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.extractionSource).toBe('fenced_generic');
    expect(res.data.attemptId).toBe('att-w1-transport-001');
  });

  it('8. extracts largest balanced {...} JSON object when there are no markdown fences', () => {
    const body = extractJsonBody(SPRINT_OVERVIEW_CLAUDE_RESPONSE);
    const unfenced = `Nhận xét: lỗi nhỏ {ví dụ: không ghi số}. Kết quả JSON bên dưới:\n${body}\nChúc bạn học tốt!`;
    const res = parseGradingResponse(unfenced, { expectedKind: 'w2_overview' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.extractionSource).toBe('balanced_brace');
    expect(res.data.items).toHaveLength(3);
  });

  it('9. recovers from an unclosed trailing ```json fence', () => {
    const body = extractJsonBody(SPRINT_OVERVIEW_CLAUDE_RESPONSE);
    const unclosed = `Part A nhận xét.\n\n\`\`\`json\n${body}`;
    const res = parseGradingResponse(unclosed, { expectedKind: 'w2_overview' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.attemptId).toBe('att-w2-ov-001');
  });

  it('10. repairs trailing commas in JSON and records repair metadata', () => {
    const body = extractJsonBody(SPRINT_OVERVIEW_CLAUDE_RESPONSE).replace(
      '"accurate": true\n      }',
      '"accurate": true,\n      }',
    );
    const res = parseGradingResponse(`\`\`\`json\n${body}\n\`\`\``, {
      expectedKind: 'w2_overview',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.repairsApplied).toContain('strip_trailing_commas');
  });

  it('11. strips accidental JS comments outside strings while preserving valid string values', () => {
    const body = extractJsonBody(SPRINT_OVERVIEW_CLAUDE_RESPONSE).replace(
      '"kind": "w2_overview",',
      '"kind": "w2_overview", // sprint overview\n /* block note */',
    );
    const res = parseGradingResponse(`\`\`\`json\n${body}\n\`\`\``, {
      expectedKind: 'w2_overview',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.repairsApplied).toContain('strip_comments');
  });

  it('12. normalizes typographic smart double quotes around JSON tokens', () => {
    const body = extractJsonBody(SPRINT_OVERVIEW_CLAUDE_RESPONSE).replace(
      '"promptVersion": "sp-1.0"',
      '“promptVersion”: “sp-1.0”',
    );
    const res = parseGradingResponse(`\`\`\`json\n${body}\n\`\`\``, {
      expectedKind: 'w2_overview',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.repairsApplied).toContain('normalize_smart_quotes');
  });

  it('13. fails with EMPTY_INPUT and repairPrompt on blank input', () => {
    const res = parseGradingResponse('   \n  ', {
      expectedKind: 'task2',
      expectedAttemptId: 'att-123',
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errorCode).toBe('EMPTY_INPUT');
    expect(res.repairPrompt).toContain('JSON chưa đúng:');
    expect(res.repairPrompt).toContain('att-123');
  });

  it('14. fails with NO_JSON_FOUND when user pastes only prose feedback without JSON', () => {
    const res = parseGradingResponse(
      'Bài viết của bạn rất tốt, đạt khoảng Band 6.5. Hãy chú ý thêm về collocation.',
      { expectedKind: 'task2' },
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errorCode).toBe('NO_JSON_FOUND');
    expect(res.repairPrompt).toContain('Gửi lại CHỈ khối JSON đúng schema ở mục OUTPUT');
  });

  it('15. fails with INVALID_JSON on truncated / unrecoverable JSON syntax', () => {
    const res = parseGradingResponse('```json\n{ "attemptId": "a1", "kind": "task2", "criteria": {\n```', {
      expectedKind: 'task2',
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errorCode).toBe('INVALID_JSON');
    expect(res.repairPrompt).toContain('JSON chưa đúng:');
  });

  it('16. fails with SCHEMA_VALIDATION_FAILED when required fields are missing and names them in repairPrompt', () => {
    const obj = JSON.parse(extractJsonBody(TASK2_CLAUDE_RESPONSE));
    delete obj.criteria.LR;
    obj.topPriorities = obj.topPriorities.slice(0, 2); // must be length 3

    const res = parseGradingResponse(`\`\`\`json\n${JSON.stringify(obj)}\n\`\`\``, {
      expectedKind: 'task2',
      expectedAttemptId: 'att-w2-community-001',
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errorCode).toBe('SCHEMA_VALIDATION_FAILED');
    const paths = res.issues.map((i) => i.path);
    expect(paths).toContain('criteria.LR');
    expect(paths).toContain('topPriorities');
    expect(res.repairPrompt).toContain('criteria.LR');
    expect(res.repairPrompt).toContain('topPriorities');
  });

  it('17. rejects invalid band step (6.3), invalid errorTag, and non-low pronunciationConfidence', () => {
    const spObj = JSON.parse(extractJsonBody(SPEAKING_CLAUDE_RESPONSE));
    spObj.criteria.FC.band = 6.3;
    spObj.criteria.GRA.issues[0].errorTag = 'invented_tag';
    spObj.pronunciationConfidence = 'high';

    const res = parseGradingResponse(`\`\`\`json\n${JSON.stringify(spObj)}\n\`\`\``, {
      expectedKind: 'speaking',
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errorCode).toBe('SCHEMA_VALIDATION_FAILED');
    expect(res.issues.some((i) => i.path === 'criteria.FC.band')).toBe(true);
    expect(res.issues.some((i) => i.path === 'pronunciationConfidence')).toBe(true);
  });

  it('18. fails with KIND_MISMATCH when pasting Task 2 JSON into a Task 1 slot', () => {
    const res = parseGradingResponse(TASK2_CLAUDE_RESPONSE, { expectedKind: 'task1' });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errorCode).toBe('KIND_MISMATCH');
    expect(res.messageVi).toContain('task2');
    expect(res.messageVi).toContain('task1');
  });

  it('19. parses valid JSON and flags attemptIdMismatch when response belongs to a different attempt', () => {
    const res = parseGradingResponse(TASK2_CLAUDE_RESPONSE, {
      expectedKind: 'task2',
      expectedAttemptId: 'att-other-essay-999',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.attemptIdMismatch).toEqual({
      expected: 'att-other-essay-999',
      actual: 'att-w2-community-001',
    });
  });

  it('20. builds concise repair prompt and handles minor promptVersion bumps (w-1.1)', () => {
    const obj = JSON.parse(extractJsonBody(TASK2_CLAUDE_RESPONSE));
    obj.promptVersion = 'w-1.1';
    const res = parseGradingResponse(`\`\`\`json\n${JSON.stringify(obj)}\n\`\`\``);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.promptVersion).toBe('w-1.1');
    }

    const prompt = buildRepairPrompt(
      [{ path: 'criteria.GRA.band', message: 'phải là bội số 0.5' }],
      { expectedAttemptId: 'att-77', expectedKind: 'task2' },
    );
    expect(prompt).toContain('criteria.GRA.band');
    expect(prompt).toContain('"attemptId": "att-77"');
    expect(prompt).toContain('"kind": "task2"');
  });
});
