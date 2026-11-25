# 00 · ĐỌC ĐẦU TIÊN · Bộ hồ sơ điều phối cho Antigravity

> Viết ngày 25/11/2026 bởi phiên Claude điều phối Đợt 1–2. Thư mục này dành cho **agent điều phối trong Antigravity** (và agent con mà nó giao việc).
> Bang muốn **kết quả**, không muốn bị hỏi. Chạy hết 4 đợt; **không dừng chờ duyệt ở cổng**; chỉ dừng ở các điểm ghi trong `04-LUAT-CUNG.md` §9; báo một lần ở cuối (và một dòng mỗi khi xong một đợt).

## 0. Ba yêu cầu gốc của Bang (25/11/2026), áp cho mọi quyết định

1. **Thứ tự ưu tiên: 1 Dữ liệu → 2 Phương pháp học** (dựa trên phương pháp nổi tiếng: FSRS/Anki, retrieval practice, Nation, Krashen, Lexical Approach…) **→ 3 UI/UX → 4 Tối ưu web → 5 Animation.**
   - Thiếu thời gian hay quota thì cắt từ dưới lên: animation trước.
   - Một hiệu ứng làm hỏng việc học = lỗi CHẶN.
   - Chi tiết: `09-PHUONG-PHAP-HOC.md`, `10-DATA.md`.
2. **Thiết bị: iPhone là ưu tiên 1**; iPad và laptop là ưu tiên 2. Mọi màn làm và đo ở iPhone 390/375 trước (`02-KE-HOACH.md` §0).
3. **Giữ công đã làm.**
   - Game và màn cũ đang ổn thì **cải thiện tại chỗ**, không xoá, không viết lại, không bỏ chức năng.
   - Game mới (S1, S2, X1) và hệ mới (Bùa) làm **sau** khi game cũ đạt ngưỡng.
   - Chi tiết: `04-LUAT-CUNG.md` §10.

## 1. Thư mục này là gì

Bộ tài liệu audit-max gốc (`docs/audit-max/*.md`) đã mô tả **cái gì** phải đạt. Thư mục này bổ sung phần **vận hành**:
- ai làm,
- làm theo thứ tự nào,
- chạy song song ra sao trên máy 16 GB RAM,
- dùng model nào cho task nào,
- cách gộp nhánh mà không vỡ,
- những bẫy đã gặp thật trong Đợt 1–2,
- những việc production mà prompt gốc chưa nói tới.

Thư mục này **không thay thế** tài liệu gốc. Khi mâu thuẫn, thứ tự ưu tiên vẫn là:
`DECISIONS.md` > `docs/audit-max/LUAT.md` > `docs/audit-max/01…08`, `TASKS.md`, `KIEM-THU.md` > **thư mục này** > `docs/games/*.md`, `docs/01…13` > `docs/00-SPEC.md` > code.

Ngoại lệ duy nhất là phần **quy trình vận hành**: cổng chạy liên tục, cổng thay cho duyệt tay, port, worktree, model. Ở phần này, thư mục này thắng `PROMPT-BAN-GIAO.md`, vì Bang đã đổi yêu cầu sau khi prompt đó được viết: không dừng ở cổng.

## 2. Danh sách file

| File | Nội dung | Ai đọc |
|---|---|---|
| `00-DOC-DAU-TIEN.md` | File này: mục đích, thứ tự đọc, vai trò | Mọi agent |
| `01-TRANG-THAI.md` | Ảnh chụp trạng thái thật lúc bàn giao: nhánh, worktree, commit, file dở | Điều phối (đọc đầu phiên) |
| `02-KE-HOACH.md` | Kế hoạch còn lại: đợt, làn, phụ thuộc, đường găng, song song, mốc | Điều phối |
| `03-CAC-BUOC.md` | Quy trình từng bước (SOP): mở phiên, nối lại việc dở, giao task, review, fixer, merge, push, đóng đợt, xử lý sự cố | Điều phối |
| `04-LUAT-CUNG.md` | Luật cứng không được vi phạm (đánh số `SR-xx`) + điểm DỪNG hỏi Bang | Mọi agent |
| `05-DO-KHO-TASK.md` | Độ khó, rủi ro, model, cách chia nhỏ từng task còn lại | Điều phối |
| `06-PROMPT-MAU.md` | Prompt mẫu điền sẵn: builder, reviewer (1 người / 2 người chấm mù), fixer, nối lại việc dở, worker dữ liệu, worker asset | Điều phối (dán cho agent con) |
| `07-PLAN-TONG.md` | **PLAN TỔNG dựa trên nghiên cứu** (thị trường, IOE, phương pháp học, 4 kỹ năng, nguồn dữ liệu và đề thi, UI/VFX/SFX, PWA iPhone): ánh xạ vào task + 12 quyết định khi lệch luật. Plan đầy đủ có nguồn: `docs/audit-max/reports/Nghiên cứu plan game học IELTS.md` | Điều phối (đọc ngay sau 01) |
| `09-PHUONG-PHAP-HOC.md` | **Phương pháp học** (ưu tiên 2): 18 phương pháp nổi tiếng → luật đo được → game; luật sư phạm cứng PP-C1..C6 | Mọi agent làm game, dữ liệu, reviewer |
| `10-DATA.md` | Dữ liệu và nội dung: luật, bước, kiểm, ưu tiên | Agent làm T3-B và mọi task đụng `public/data` |
| `11-ASSET.md` | Asset: tìm, tải, chọn, xử lý, crop ảnh, ngân sách, CREDITS | Agent làm T3-A, T3-C, T4-* |
| `12-UI-UX.md` | UI/UX: bố cục, token, chữ, mật độ hình, trạng thái, truy cập, giọng văn | Agent làm T3-A, T3-C, T4-* |
| `13-ANIMATION.md` | Animation và juice: bậc ưu tiên hiệu ứng, thang hạ cấp khi lag, lỗi cấm (chữ lật ngược, phóng to giật, crop lung tung) | Agent làm T3-A, T4-* |
| `14-TOI-UU-WEB.md` | Tối ưu web: ngân sách, chia chunk, ảnh, font, dữ liệu, PWA, React, đo đạc | Mọi builder + reviewer |
| `15-PRODUCTION-BO-SUNG.md` | Việc production ngoài prompt gốc (phát hành, rollback, sao lưu, giám sát, iOS, bảo mật…) có mức ưu tiên và nơi gắn vào | Điều phối |
| `16-GHI-CHU-BAY.md` | Ghi chú và bẫy đã gặp thật trong Đợt 1–2 | Mọi agent |

## 3. Thứ tự đọc

**Agent điều phối** (Antigravity, phiên chính):
1. `docs/audit-max/BAN-GIAO-AGENT.md` (toàn cảnh 15 mục)
2. Thư mục này theo thứ tự: 00 → 01 → **07 (plan tổng) + báo cáo nghiên cứu** → 04 → 02 → 03 → 05 → 09 → 10 → 16 → 15
3. `docs/audit-max/TASKS.md` (mục của đợt sắp chạy), `LUAT.md`, `07-QUY-TRINH-KIEM-CHEO.md`, `KIEM-THU.md`
4. `D:\English\DECISIONS.md` (đặc biệt mục D và các dòng ngày 24/11)
5. File 10–14 chỉ đọc lướt mục §0 "Tóm tắt 10 dòng" để biết giao cho ai

**Agent con (builder, reviewer, fixer)**: đọc **1 gói ngữ cảnh** `docs/audit-max/goi/<TASK>-<vai>.md` (từ 25/11/2026), cộng `AGENTS.md` và file riêng của task (KE-HOACH, BAO-CAO, REVIEW).
- Điều phối tạo gói bằng `node docs/audit-max/cong-cu/goi-ngu-canh.mjs <TASK> <vai>` trước khi giao (`03-CAC-BUOC.md` §4).
- Gói chép **nguyên văn** (không tóm tắt): toàn bộ `04-LUAT-CUNG.md`, `16-GHI-CHU-BAY.md`, phạm vi task trong `TASKS.md`, bước con trong `05`, mọi mã lỗi và mục mà task trích, mục mặc định của file mảng (10–14), rubric cho reviewer, HANDOFF liên quan.
- Mã được trích mà không có trong tài liệu gốc → script dừng, không tạo gói thiếu.
- Lý do: danh sách đọc cũ là 16–18 file (220–275 KB). Ngữ cảnh dài làm loãng sự chú ý vào tiêu chí của task; luật lặp ở nhiều file với lời hơi khác nhau dễ gây hiểu sai.

## 4. Vai trò (giữ nguyên `07-QUY-TRINH-KIEM-CHEO.md` §1, thêm chi tiết vận hành)

| Vai | Làm | Không được làm |
|---|---|---|
| **Điều phối (AD)** | Tạo worktree, giao task, giữ port, giới hạn song song, tự kiểm lại báo cáo agent con (`git log`, `git diff --stat`, chạy cổng), merge, push, xem CI, cập nhật `01-TRANG-THAI.md`, `DECISIONS.md`, `BAO-CAO.md`, `PROGRESS.md`. Là người **duy nhất** sửa `LUAT.md`, `KIEM-THU.md`, `cong-cu/**`, ngưỡng | Viết code tính năng; tự viết review; tin báo cáo agent con mà không kiểm |
| **Builder** | Làm 1 task trong 1 worktree, đúng file độc quyền | Tự chấm đẹp; sửa luật/công cụ/ngưỡng; push/merge; sửa `DECISIONS.md` (ghi vào BAO-CAO mục "Quyết định", AD gộp) |
| **Reviewer** | Agent mới, **khác model** với builder, xem được ảnh; chạy lại mọi kiểm; ghi `REVIEW-<task>-<X>.md` | Sửa code; chép số liệu builder |
| **Fixer** | Sửa đúng danh sách lỗi của review, tối đa 3 vòng | Thêm tính năng; đổi phần đã được khen |

## 5. Năm điều phải nhớ nếu chỉ nhớ được năm điều

1. **Một file, một người viết.** Mỗi task chỉ sửa file độc quyền của nó trong `TASKS.md`. Hai agent cùng lúc không bao giờ sửa chung một file.
2. **Mỗi task một worktree + port riêng**: `D:\English-wt\<task>`, port theo bảng ở `03-CAC-BUOC.md` §3. Thiếu port riêng thì E2E sẽ chạy nhầm code của worktree khác. Bẫy này đã xảy ra thật.
3. **Người làm không chấm.** Agent con báo "xong" thì điều phối tự chạy `git log`, `git diff --stat`, cổng của task, rồi mới giao reviewer khác model.
4. **Không bao giờ reset, xoá hay ghi đè** phần dở trong worktree. Việc dở luôn được nối tiếp (`03-CAC-BUOC.md` §2).
5. **Dữ liệu đúng và phương pháp học đúng đứng trên mọi thứ**; hiệu năng là luật, không phải tuỳ chọn. Hiệu ứng có bậc ưu tiên. Máy yếu hoặc có lag thì hạ bậc tự động (`13-ANIMATION.md` §3). Không có hiệu ứng nào được làm chữ ngược, ảnh méo hay khung hình > 32 ms.
