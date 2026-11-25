# KẾ HOẠCH T2-C · W1, W2, Hệ chấm Claude, Portfolio

- **Route:** `/play/w1`, `/play/w2`, `/portfolio`.
- **Thành phần chính:** `W1EssayLab`, `W2WritingSprints`, `GradingPanel`, `ChartRenderer`, `PortfolioScreen`, `src/core/grading/**`, `essayRepo.ts`.
- **Rủi ro:** (1) Lộ fixture `TASK*_CLAUDE_RESPONSE` vào bundle prod; (2) Chấm lặp cộng XP/band sai hoặc bỏ qua lệch `attemptId`; (3) Mất bài viết khi reload/thoát hoặc hết giờ Exam; (4) W2 lộ mẫu trước khi xác nhận tự chấm; (5) Lỗi contrast/touch-target/chữ < 12px/tràn ngang trên iPhone 375/390.
- **Mục tiêu:** Đóng W1-01..08, W2-01..04/06..08, G-01..04, PP-03, PP-11, PP-16 (SR-89), TU-02, X5/X6, §4.5 (≤ 6 thao tác chấm).

## Danh sách mọi nút & chức năng giữ nguyên (SR-80, SR-90)
- **W1 · Chọn đề:** Tab Task 2 / Task 1; Chế độ Training / Exam; Bộ lọc dạng bài/biểu đồ, chủ đề, ô tìm đề; Nút "Portfolio & Điểm thật", "Đề gợi ý hôm nay", "Viết đề này" trên từng thẻ.
- **W1 · Viết/Sửa:** Nút "Chọn đề khác" (thêm modal xác nhận nếu > 20 từ); Đồng hồ + nút tạm dừng (Training); Bộ đếm từ; Khung dàn ý & Idea Bank / Key Features (Training); Cảnh báo Cliché realtime; Phát hiện paste > 100 ký tự; Lưu nháp tự động (thật vào IndexedDB + khôi phục); Nút "Nộp bài & Chấm" / "Nộp bản sửa".
- **W1 · Review/Graded:** Nút "Xem/Ẩn bài mẫu Band 8.0" (chú thích 4 tiêu chí), "Sửa bài (v2/v3) & Chấm lại", "Portfolio", "Viết đề mới", "Lưu & thoát về Hub"; So sánh Δ Bản 1 vs Bản sửa; Checklist tự chấm (+10 XP ở Training); `GradingPanel`.
- **GradingPanel:** Nút "Copy gói & Mở Claude" (và "Copy gói chấm", "Tải .md", "Mở Claude.ai", "Xem trước gói chấm"); Ô dán kết quả + tự phân tích khi dán + nút "Dán từ clipboard" + "Phân tích & Lưu kết quả" + "Xoá ô dán"; Nút "Dán kết quả mẫu" (CHỈ ở DEV); Lỗi parse + "Copy lời nhắc sửa gửi lại Claude"; Báo cáo 4 tiêu chí / Sprint + trích dẫn + nút thêm SRS.
- **W2 · Chọn sprint:** 5 nút bắt đầu (Overview, Idea, Thesis, Cliché Surgery, Academic Upgrade) + nút quay lại.
- **W2 · Đang chơi:** HUD tiến độ/giờ/streak/XP + nút thoát sprint; Overview/Idea (nhập → nộp → tự chấm checklist → xác nhận khoá → mở bài mẫu & bấm cụm highlight lưu SRS → lượt tiếp); Thesis (nhập → chấm tức thì → mẫu → lượt tiếp); Cliché/Upgrade (4 lựa chọn → giải thích + lưu SRS → lượt tiếp).
- **W2 · Recap:** Tóm tắt sao/chính xác/streak/XP, danh sách từng lượt + lưu `betterChunk` vào SRS, nút "Chơi lại" (0 XP khi retry), "Chọn sprint khác", "Về trang chính", `GradingPanel` chấm gộp Claude (lưu cập nhật DB).
- **Portfolio:** Nút "Hub", "Viết bài mới (W1)"; 4 KPI; Biểu đồ tiến bộ; Khối hiệu chỉnh `biasOffset` + nút bật/đặt lại; 5 nút lọc (Tất cả, Task 2, Task 1, Đã chấm, Chờ chấm); Từng bài: "Nhập/Sửa điểm thật" (form + Lưu/Huỷ), "Xem bài", mở lại chấm bài chờ chấm, nút Xoá (thêm modal xác nhận).

## Cách vào trạng thái khó để kiểm thử
- **Draft recovery W1:** Mở `/play/w1` → chọn đề → gõ > 20 từ → chờ 1,5 s → reload → banner khôi phục.
- **Grading ≤ 6 thao tác:** Nộp bài W1 → bấm "Copy gói & Mở Claude" → dán JSON vào ô dán (tự phân tích) → hiện báo cáo.
- **Exam hết giờ W1:** Vào `/play/w1?mode=exam`, dùng fake timer (Vitest) hoặc clock vượt 20/40 phút → tự nộp.
- **W2 Recap + Claude:** Hoàn thành 1 phiên Overview/Idea → dán SprintResult JSON → reload kiểm DB.
