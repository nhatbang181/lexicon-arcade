# Gói ngữ cảnh cho agent con · Kế hoạch thực thi

> Spec: `docs/superpowers/specs/2026-11-25-goi-ngu-canh-design.md` (Bang duyệt 25/11/2026, "làm đi, cả bên Antigravity và Claude").
> Thực thi: Claude tự làm trong phiên này (Bang đã bảo làm luôn).

**Mục tiêu:** mỗi agent con đọc một file gói, chép nguyên văn bằng script, thay cho 16–18 file. Effort đặt theo bước. Skill điều phối của cả Claude Code lẫn Antigravity biết cách làm này.

## Ràng buộc chung
- Script chép **nguyên văn**, không tóm tắt. Mã được trích mà không tìm thấy → script thoát với mã 1 và liệt kê mã thiếu.
- Mã trùng tên ở nhiều file (vd `D5` có trong LUAT.md và 04-DATA, `G3` vừa là lỗi trong 01-GAME vừa là cổng) → lấy **mọi** định nghĩa và ghi rõ file nguồn. Thà thừa còn hơn rơi luật.
- Không sửa nội dung luật, ngưỡng, rubric. Không đụng worktree đang chạy.
- Gói sinh ra không commit (`docs/audit-max/goi/*.md` ignore). Commit `them.json` và script.

## Điểm cần soi
1. Task Đợt 4 nằm trong **bảng** (`| T4-A | … |`), không có tiêu đề `###`. Script phải lấy cả mục ĐỢT 4 và dòng "File độc quyền" của task được nhắc kiểu "như T2-A".
2. Dải mã `V1-1..V1-16`, `F1–F3`, `M1–M7` phải được bung ra.
3. Mục tham chiếu `03 §3`, `01 §6.3`, `02 §3–§4`, `05 §5 mục 1` phải trỏ đúng file trong `docs/audit-max/0N-*.md`.
4. Tên game (V1, V2, V3, R1, R2, L1, L2, W1, W2, S1, S2) không bị hiểu là mã luật.
5. "cổng G3" là cổng (07 §2), không phải lỗi G3 của 01-GAME.

## Task 1 · Script + test
- Tạo `docs/audit-max/cong-cu/goi-ngu-canh.mjs`. Export các hàm thuần: `expandCodes(text) → string[]`, `extractSection(md, sec) → string|null`, `findCodeDefs(code, sources) → {file, text}[]`, `taskText(tasksMd, task) → string`.
  CLI: `node docs/audit-max/cong-cu/goi-ngu-canh.mjs <TASK> <builder|reviewer|fixer> [--root <repo>]` → ghi `docs/audit-max/goi/<TASK>-<vai>.md`, in kích thước và các mã đã lấy.
- Tạo `docs/audit-max/goi/them.json`: các mục mặc định theo vai (`all`, `builder`, `reviewer`, `fixer`), theo tiền tố task (`T4-`), danh sách `bo_qua` có lý do.
- Test `docs/audit-max/cong-cu/goi-ngu-canh.test.mjs` (`node --test`):
  - `expandCodes("V1-1..V1-3, F1–F3")` chứa `V1-1, V1-2, V1-3, F1, F2, F3`;
  - không trả tên game `V1`, `R2`;
  - "cổng G3" không trả `G3`;
  - `extractSection` lấy `### 6.3` mà không lấy sang `### 6.4`;
  - `taskText` của T4-A chứa dòng bảng T4-A và "Cổng G3 trước tiên".
- Chạy thật cho T4-A builder, T4-A reviewer, T4-B builder, T2-A builder. Gói ≤ 45 KB, nếu vượt thì cảnh báo, không dừng. Thử mã giả → thoát mã 1.

## Task 2 · Tài liệu vận hành dự án (Antigravity và Claude dùng chung)
- `antigravity/06-PROMPT-MAU.md` §1–§5: khối ĐỌC → gói. Thêm giới hạn BAO-CAO/REVIEW ≤ 10 KB và quy tắc ảnh.
- `prompt-reviewer.txt`: dòng ĐỌC → gói.
- `antigravity/03-CAC-BUOC.md`: thêm bước tạo gói trước khi giao task.
- `antigravity/00-DOC-DAU-TIEN.md` §3: danh sách đọc của agent con.
- `antigravity/02-KE-HOACH.md` §3: bảng effort theo bước.
- `DECISIONS.md`: 1 dòng. `.gitignore`: `docs/audit-max/goi/*.md`.

## Task 3 · Skill điều phối
- Claude Code: `C:\Users\nhatb\.claude\skills\dieu-phoi\SKILL.md`, thêm mục NGỮ CẢNH CHO WORKER và bảng effort.
- Antigravity: tạo `C:\Users\nhatb\.gemini\config\skills\dieu-phoi\SKILL.md`, cùng nội dung, đổi phần model cho Antigravity, không có `disable-model-invocation`.

## Task 4 · Kiểm bằng agent rẻ
- Agent haiku mới, chỉ đọc `goi/T4-A-reviewer.md`, trả lời 10 câu. Đáp án Claude lấy từ file gốc. Phải đúng ≥ 9/10; sai câu nào thì xem gói thiếu gì rồi sửa.

## Task 5 · Commit + báo điều phối
- 1 commit trên `master`: `docs(audit-max): gói ngữ cảnh cho agent con + effort theo bước`.
- Nhắn phiên điều phối: đọc lại `06-PROMPT-MAU.md`, `03-CAC-BUOC.md`; tạo gói trước khi giao reviewer G3.
