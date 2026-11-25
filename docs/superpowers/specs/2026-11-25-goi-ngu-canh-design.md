# Thiết kế · Gói ngữ cảnh cho agent con + chính sách effort

Ngày 25/11/2026. Bang chọn hướng A.

## Mục đích
Agent con (builder, reviewer, fixer) hiện đọc khoảng 220–275 KB tài liệu trước khi làm. Luật bị lặp ở 4 nơi (`LUAT.md`, `antigravity/04-LUAT-CUNG.md`, `BAN-GIAO-AGENT §8`, khối dùng chung trong prompt).
Thứ tự ưu tiên: **chất lượng sản phẩm > hiệu năng > quota > thời gian**. Ngữ cảnh gọn giúp agent tập trung đúng tiêu chí của task, nên đây là việc vì chất lượng, không chỉ vì quota.

## Mục tiêu
- Mỗi agent con đọc **1 file gói** khoảng ≤ 35 KB thay vì 16–18 file.
- Nội dung gói **chép nguyên văn bằng script**, không để LLM tóm tắt, nên không có diễn giải lệch. Builder và reviewer cùng lấy từ một nguồn gốc.
- Effort theo **bước**, không theo task. Thực thi theo kế hoạch có sẵn dùng normal.
- Skill `dieu-phoi` biết cách làm này ở mọi dự án sau.

## Không làm
- Không sửa nội dung luật, ngưỡng hay rubric. Không đổi quyền của các vai.
- Không đụng builder T4-A đang chạy hay worktree nào đang có agent.
- Không gộp hay xoá file luật gốc. Các file gốc vẫn là nguồn chuẩn.

## Phản mục tiêu (coi là hỏng dù chạy được)
- Gói làm rơi một luật mà task cần, khiến builder vi phạm mà không biết.
- Reviewer chỉ chấm theo đúng những gì gói đưa, thành ra chung điểm mù với builder.

## Cách làm

### 1. Script `docs/audit-max/cong-cu/goi-ngu-canh.mjs <TASK> <builder|reviewer|fixer>`
- Đặt trong `cong-cu/`, là công cụ của AD; agent con không được sửa (Q4).
- Đầu ra: `docs/audit-max/goi/<TASK>-<vai>.md`. Phần đầu file ghi commit master và thời điểm tạo.
- Nội dung gói, tất cả trích nguyên văn:
  1. **Luật lõi:** mọi dòng `SR-xx` của `04-LUAT-CUNG.md` (luật cứng, ai cũng phải theo), §8b thứ tự ưu tiên, §10 giữ công, §9 điểm dừng.
  2. **Mục task trong `TASKS.md`** và các bước con của task trong `05-DO-KHO-TASK.md §2`.
  3. **Mã luật và mã lỗi được trích:** script tự quét mọi mã xuất hiện ở mục 2 (vd `G3`, `V1-1..V1-16`, `J1`, `U1`, `03 §3`), rồi lấy đúng dòng bảng hoặc đúng mục từ `LUAT.md`, `01…06`, `phu-luc/`, `antigravity/09…14`.
  4. **Theo vai:**
     - builder: `KIEM-THU §2` (các dòng liên quan) và lệnh kiểm;
     - reviewer: **nguyên văn** `KIEM-THU §3` (rubric) và §4 (checklist soi ảnh), `07-QUY-TRINH-KIEM-CHEO §4–5`;
     - fixer: luật fixer và đường dẫn các file REVIEW.
  5. **Bẫy:** các dòng `N-xx` trong `16-GHI-CHU-BAY.md` khớp từ khoá của task (tên game, route, mảng), cộng mọi bẫy mục "Quy trình và agent".
  6. **Mục HANDOFF** gửi chủ file của task.
- File `docs/audit-max/goi/them.json` cho phép AD thêm hoặc bớt mã theo task, khi script quét thiếu.
- **Chống rơi luật:** mã nào được trích mà không tìm thấy trong file gốc thì script **báo lỗi và dừng**, không tạo gói thiếu. Script in ra kích thước gói và danh sách mã đã lấy.
- Cuối gói luôn có dòng: "Thiếu luật thì tra file gốc bằng cách tìm theo mã; danh sách file gốc: …".

### 2. Chống chung điểm mù (giữ chất lượng của chấm mù)
- Gói reviewer **lớn hơn** gói builder: có rubric và checklist đầy đủ nguyên văn.
- Prompt reviewer có thêm việc: soi phần **chung của màn** ngoài phạm vi gói (mất chức năng, lỗi iPhone), và được tra file gốc khi nghi ngờ.

### 3. Sửa tài liệu vận hành của dự án
- `antigravity/06-PROMPT-MAU.md`: khối "ĐỌC TRƯỚC" của §1–§5 đổi thành "Đọc `docs/audit-max/goi/<TASK>-<vai>.md` + `AGENTS.md`".
  Thêm giới hạn đầu ra:
  - BAO-CAO ≤ 10 KB;
  - REVIEW ≤ 10 KB, theo bảng cố định: lỗi / bằng chứng / rubric / phán quyết, không viết văn.
  Thêm quy tắc ảnh: đọc `report.json` trước; mở ảnh lỗi và ảnh iPhone 390/375. Phần chấm mù giữ nguyên.
- `prompt-reviewer.txt`: dòng ĐỌC đổi tương tự.
- `antigravity/03-CAC-BUOC.md`: thêm bước "chạy script tạo gói" trước khi giao task, và tạo lại gói khi master đổi.
- `antigravity/00-DOC-DAU-TIEN.md §3`: danh sách đọc của agent con trỏ về gói.
- `antigravity/02-KE-HOACH.md §3` và `05-DO-KHO-TASK.md`: thêm cột effort theo bước (bảng dưới).
- `DECISIONS.md`: 1 dòng ghi quyết định.

### 4. Chính sách effort (đưa vào cả skill lẫn tài liệu dự án)
| Bước | Effort |
|---|---|
| Thiết kế flow, chia task, quyết định ở cổng (điều phối) | cao |
| Builder viết KE-HOACH | cao |
| Builder làm theo kế hoạch; fixer sửa theo danh sách lỗi | normal |
| Kẹt: test đỏ 2 lần, lỗi khó hiểu | nâng lên cao cho riêng lần gỡ đó |
| Reviewer chấm rubric và phán quyết | vừa–cao |
| Chạy lệnh, chụp ảnh, đo, dọn dẹp | thấp, model rẻ |
Chọn model quan trọng hơn chọn effort.

### 5. Sửa skill `C:\Users\nhatb\.claude\skills\dieu-phoi\SKILL.md` (dùng chung mọi dự án)
- Thêm mục **NGỮ CẢNH CHO WORKER**:
  - worker luôn tạo mới (không fork hội thoại);
  - brief = gói trích nguyên văn (không để LLM tóm tắt), cỡ khoảng ≤ 35 KB;
  - dự án có script tạo gói thì dùng script đó;
  - builder và reviewer lấy từ cùng nguồn, reviewer có thêm rubric;
  - giới hạn độ dài báo cáo; ảnh đọc số liệu trước rồi mới mở ảnh.
- Thay câu "ghi kèm effort" bằng bảng effort theo bước ở trên.

## Kiểm tra (cổng của việc này)
- Chạy script cho `T4-A builder`, `T4-A reviewer`, `T4-B builder`:
  - mỗi gói ≤ 35 KB;
  - 100% mã được trích trong mục task có mặt trong gói;
  - script dừng có báo lỗi khi cố tình đưa vào một mã không tồn tại.
- Một agent mới (model rẻ), chỉ đọc gói T4-A reviewer, phải trả lời đúng 10 câu hỏi kiểm tra lấy từ file gốc (ngưỡng G3, J1, PP-C, file độc quyền…).

## Áp dụng
- Bắt đầu từ lượt tạo agent kế tiếp. Nếu 2 reviewer G3 chưa được tạo thì dùng gói cho họ.
- Commit thành 1 commit tài liệu và công cụ trên `master`. Sau đó báo phiên điều phối 1 tin ngắn: đã có gói, đọc lại `06-PROMPT-MAU.md`, `03-CAC-BUOC.md`.

## Quyết định do Claude tự chọn (Bang có thể sửa)
- Script đặt ở `cong-cu/` (công cụ AD) thay vì `scripts/qa/`.
- Ngưỡng gói 35 KB, giới hạn BAO-CAO và REVIEW 10 KB.
- Gói nằm trong repo (`docs/audit-max/goi/`) để worktree nào cũng đọc được sau khi merge master.
