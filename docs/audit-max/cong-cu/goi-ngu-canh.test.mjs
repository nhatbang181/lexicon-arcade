// Chạy: node --test docs/audit-max/cong-cu/goi-ngu-canh.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandCodes, extractSection, findCodeDefs, taskText, sectionRefs, handoffItems } from './goi-ngu-canh.mjs';

test('expandCodes bung dải mã các kiểu', () => {
  const c = expandCodes('V1-1..V1-3, F1–F3, L1-02..04, PP-C1..C3, A4–A6, X13–X15');
  for (const x of ['V1-1', 'V1-2', 'V1-3', 'F1', 'F2', 'F3', 'L1-02', 'L1-03', 'L1-04', 'PP-C1', 'PP-C2', 'PP-C3', 'A4', 'A5', 'A6', 'X13', 'X14', 'X15']) {
    assert.ok(c.includes(x), `thiếu ${x} trong ${c}`);
  }
});

test('expandCodes không coi tên game, mã task là mã luật', () => {
  const c = expandCodes('Bảng 03 §3 cho V1, V2, V3, R1, R2; task T4-A; bậc E0→E3; HUD (U1); làm tiếp V2–R2; S1–S2');
  assert.deepEqual(c, ['U1']);
});

test('expandCodes: "cổng G3" là cổng, "G3 phần V1" là mã lỗi', () => {
  assert.ok(!expandCodes('Cổng G3 trước tiên').includes('G3'));
  assert.ok(!expandCodes('kết thúc bằng **cổng G0**').includes('G0'));
  assert.ok(expandCodes('(G1, G3 phần V1)').includes('G3'));
});

test('expandCodes wildcard, không nhầm chữ đậm markdown', () => {
  const c = expandCodes('L2-*, K*');
  assert.ok(c.includes('*L2-'));
  assert.ok(c.includes('*K'));
  const d = expandCodes('T4-A chỉ làm **V1** (+ Recap); cổng **G4** (`07` §2); **T3-A** merge');
  assert.ok(!d.some((x) => x.startsWith('*')), `wildcard giả: ${d}`);
});

test('expandCodes: "D11 – 12 icon" không phải dải', () => {
  const c = expandCodes('`LUAT.md` K9/D11 – 12 icon game');
  assert.ok(c.includes('D11'));
  assert.ok(!c.includes('D110') && !c.includes('D12'));
});

test('extractSection lấy 6.3 không lấn sang 6.4, bỏ qua tiêu đề trong khối code', () => {
  const md = ['## 6. A', '### 6.3 Ba', 'nội dung 6.3', '```', '## 9. giả', '```', 'vẫn 6.3', '### 6.4 Bốn', 'nội dung 6.4'].join('\n');
  const s = extractSection(md, '6.3');
  assert.ok(s.includes('nội dung 6.3'));
  assert.ok(s.includes('vẫn 6.3'));
  assert.ok(!s.includes('6.4'));
  assert.equal(extractSection(md, '7'), null);
});

test('extractSection mục 5b', () => {
  const md = '## 5. X\nx\n## 5b. Lexi\nlexi\n## 6. Y';
  assert.equal(extractSection(md, '5b'), '## 5b. Lexi\nlexi');
  assert.equal(extractSection(md, '5'), '## 5. X\nx');
});

test('findCodeDefs: dòng bảng và gạch đầu dòng, mã trùng lấy hết', () => {
  const sources = [
    { file: 'LUAT.md', lines: ['| D5 | 0 px cuộn ngang |', '| D50 | khác |'] },
    { file: '04-DATA.md', lines: ['| D5 | câu ví dụ |'] },
    { file: '16.md', lines: ['- **N-01 · E2E chạy nhầm.** dòng 1', '  tiếp dòng 2', '- **N-02 · khác**'] },
  ];
  assert.equal(findCodeDefs('D5', sources).length, 2);
  const n = findCodeDefs('N-01', sources);
  assert.equal(n.length, 1);
  assert.ok(n[0].text.includes('tiếp dòng 2'));
  assert.equal(findCodeDefs('*D', sources).length, 3);
  assert.equal(findCodeDefs('ZZ9', sources).length, 0);
});

test('sectionRefs nhận các kiểu trích', () => {
  const r = sectionRefs('Bảng 03 §3; (`07` §2); file 02 §3–§4; `KIEM-THU.md` §3; `phu-luc/A…` §2.6; 01 §6.3');
  const s = r.map((x) => `${x.key}:${x.sec}`);
  for (const x of ['03:3', '07:2', '02:3', '02:4', 'KIEM-THU.md:3', 'A:2.6', '01:6.3']) assert.ok(s.includes(x), `thiếu ${x} trong ${s}`);
});

test('taskText: task dạng bảng (Đợt 4) lấy cả mục đợt và file "như T2-A"', () => {
  const md = [
    '# TASKS', 'đầu', '## ĐỢT 2 · x',
    '### T2-A · V2', '- **File độc quyền:** `src/games/v2-x/**`', '- **Việc:** làm',
    '## ĐỢT 4 · Juice',
    '| Task | File | Việc |', '|---|---|---|',
    '| T4-A | như T2-A + `src/games/v1-daily-run/**` | Bảng 03 §3 (U1) |',
    '| T4-B | như T2-B | L1-07 |',
    '- **Cổng G3 trước tiên:** ngày đầu',
    '## ĐỢT 5 · S',
  ].join('\n');
  const t = taskText(md, 'T4-A');
  assert.ok(t.text.includes('Cổng G3 trước tiên'));
  assert.ok(t.codeText.includes('U1'));
  assert.ok(!t.codeText.includes('L1-07'), 'không dò mã của task khác cùng đợt');
  assert.deepEqual(t.nhu, ['T2-A']);
  assert.ok(t.nhuFiles[0].includes('src/games/v2-x'));
  assert.ok(t.preamble.includes('đầu'));
  assert.equal(taskText(md, 'T9-Z'), null);
});

test('handoffItems lọc theo từ khoá', () => {
  const md = ['## Từ T1-A', '- sửa `src/games/v1-daily-run/x.ts` giúp', '- việc của W1', '## Từ T3-C', '- nợ nhỏ cho Đợt 4'].join('\n');
  const h = handoffItems(md, ['src/games/v1-daily-run', 'Đợt 4']);
  assert.ok(h.includes('v1-daily-run'));
  assert.ok(h.includes('nợ nhỏ'));
  assert.ok(!h.includes('W1'));
});
