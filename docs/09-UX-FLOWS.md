# 09 · UX Flows: màn hình, điều hướng, onboarding, các luồng chính

## 1. Bản đồ màn hình
```
Onboarding (lần đầu) ─► Placement (bỏ qua được) ─► Bản đồ 6.0→8.0 ─► Hôm nay
Hôm nay ─┬─► [Game] ─► Recap ─► Hôm nay
         ├─► Luyện tập (Hub 12 game, lọc theo kỹ năng)
         ├─► Thi thử (X1)
         ├─► Thống kê (band, streak, heatmap, lỗi hay gặp, độ lệch điểm Claude so với điểm thật)
         ├─► Thư viện (tra từ/collocation đã học, ⭐, portfolio bài viết & ghi âm)
         └─► Cài đặt (mục tiêu, chấm bài, âm thanh, giọng, theme, sao lưu, game cũ)
```

## 2. Routes (hash)

| Route | Màn |
|---|---|
| `#/` | Hôm nay |
| `#/onboarding`, `#/placement` | Lần đầu |
| `#/practice` (`?skill=listening`) | Hub luyện tập |
| `#/play/:gameId` (`?mode=training\|exam\|sprint&ref=<contentId>`) | Màn game toàn màn hình |
| `#/exam`, `#/exam/:testId` | Thi thử |
| `#/stats` | Thống kê |
| `#/library`, `#/library/word/:id`, `#/portfolio/:kind/:id` | Thư viện |
| `#/settings` | Cài đặt |
| `#/legacy` | Game cũ (ẩn) |
| `#/dev/components` | Chỉ có ở dev |

## 3. Onboarding (≤ 90 giây, 4 bước, có thanh tiến độ)
1. **Chào:** "Lexicon Arcade giúp bạn từ ~6.0 lên 8.0. Mỗi ngày 30–60 phút. Lộ trình thực tế 9–18 tháng." Nút "Bắt đầu".
2. **Mục tiêu:** chọn target band cho từng kỹ năng (mặc định L 8.5, R 8.5, W 7.5, S 7.5), ngày thi dự kiến (tuỳ chọn), thời gian mỗi ngày (15/30/45/60).
3. **Thiết bị:** kiểm tra tai nghe (phát 1 câu mẫu), micro (nói "Hello" → hiện transcript), giới thiệu 20 giây về cách chấm bài qua Claude (copy gói → dán kết quả).
4. **Placement:** "Làm bài kiểm tra đầu vào 25 phút (khuyến nghị)" hoặc "Bỏ qua, bắt đầu học luôn".
   - Bỏ qua thì estimated band = "–" và level = 3.

## 4. Trang Hôm nay (màn quan trọng nhất)
**Desktop:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Chào Bang · Thứ Sáu 20/11        🔥 12 ngày (❄️1)        ⭐ 4.230 XP        │
├───────────────────────────────┬────────────────────────────────────────────┤
│ MỤC TIÊU HÔM NAY  ◔ 18/30 phút │ BAND ƯỚC LƯỢNG                 Mục tiêu 8.0 │
│                               │ L ▓▓▓▓▓▓▓▓░░ 7.0 ↑   (8.5)                  │
│ ① Daily Run · 42 thẻ · ~9'  ▶ │ R ▓▓▓▓▓▓▓░░░ 6.5 →   (8.5)                  │
│ ② Trap Detector P1 · ~8'    ▶ │ W ▓▓▓▓▓▓░░░░ 6.0 ?   (7.5) độ tin cậy thấp  │
│   "Listening đang xa mục tiêu │ S ▓▓▓▓▓▓░░░░ 6.0 ?   (7.5)                  │
│    nhất – luyện bẫy Part 1"   │ Overall ≈ 6.5                               │
│ ③ 3-Second Rule · ~5'       ▶ │                                             │
│            [Đổi bài khác ↻]   │ TUẦN NÀY: ▢▣▣▣▣▢▢   Thi thử: Chủ nhật       │
├───────────────────────────────┴────────────────────────────────────────────┤
│ Câu thắng gần nhất: "Bắt được 7/8 bẫy self-correction (tuần trước 4/8)"    │
└────────────────────────────────────────────────────────────────────────────┘
```
- Mỗi thẻ hoạt động gồm: icon và màu kỹ năng, tên game, **lý do đề xuất** (1 dòng), thời lượng, nút ▶.
- Phím tắt: Enter = thẻ đầu tiên chưa xong.
- Thẻ đã xong có dấu ✓ và mờ đi. Hoàn thành mục tiêu ngày thì vòng ◔ đầy, có animation "ring complete" (xem `10`) và toast "Xong mục tiêu hôm nay".

## 5. Hub luyện tập
- Tab lọc: Tất cả, Từ vựng, Listening, Reading, Writing, Speaking.
- Lưới thẻ game. Mỗi thẻ gồm: icon, tên, mô tả 1 câu tiếng Việt, level hiện tại, lần chơi gần nhất, badge "Chấm qua Claude" hoặc "Cần micro" nếu có.
- Bấm vào thẻ mở **sheet chọn chế độ** (Training / Exam / Sprint), nội dung (chủ đề, Part, passage), level (gợi ý sẵn), rồi bấm "Bắt đầu".

## 6. Khung một phiên game (chung, xem `02` §5)
```
┌ ✕  Trap Detector · Part 1 ────────── ▓▓▓▓▓░░░░░ 5/10 ───── 🔥x3  +120 ┐
│                                                                       │
│                   [vùng nội dung học — sạch, chữ to]                  │
│                                                                       │
│                                        [Gợi ý (H)]  [Nộp ↵]           │
└───────────────────────────────────────────────────────────────────────┘
          ▲ FeedbackPanel trượt lên sau khi nộp (Enter để tiếp)
```
- **Thoát giữa chừng (Esc):** hộp xác nhận "Lưu phần đã làm và thoát?". Phần đã làm vẫn ghi SRS.
- **Phím tắt chung:**

  | Phím | Tác dụng |
  |---|---|
  | Enter | Nộp / Tiếp |
  | 1–4 hoặc A–D | Chọn đáp án |
  | H | Gợi ý |
  | R | Phát lại audio (khi được phép) |
  | Space | Phát/dừng (training) |
  | Esc | Thoát |
  | ? | Xem bảng phím tắt |

## 7. Recap (màn kết phiên)
- **Số lớn:** "8/10" hoặc "Band ước tính phiên 7.5" (chỉ exam mode). XP nhận được đếm lên.
- **Câu thắng** do engine của game tạo ra (luật xem file từng game).
- **Danh sách câu sai:** bấm vào để mở lại feedback.
- Nút "Ôn ngay 5 câu sai" (phiên mini).
- Nút "Về Hôm nay" (focus mặc định). Nếu còn hoạt động trong kế hoạch thì có thêm nút "Tiếp: ③ 3-Second Rule".

## 8. Thống kê
- **Band theo thời gian:** đường cho 4 kỹ năng, kèm mục tiêu.
- **Heatmap học tập** 26 tuần (kiểu GitHub). Streak dài nhất.
- **Từ vựng:** số item theo mastery (stacked bar), dự báo số thẻ đến hạn 7 ngày tới.
- **Bẫy và lỗi:**
  - Top 5 `trapType` Listening/Reading hay sai (tỷ lệ sai)
  - Top 5 `errorTag` Writing/Speaking
  - Mỗi dòng có nút "Luyện riêng" (phiên lọc theo tag)
- **Bài đang chờ chấm** (chưa dán kết quả). **Độ lệch Claude so với điểm thật** (khi có ≥ 3 điểm thật).

## 9. Thư viện và Portfolio
- **Tra từ:** ô tìm kiếm, kết quả từ, collocation, paraphrase đã gặp. Trang từ gồm: IPA, phát âm, ví dụ, collocation, trạng thái mastery các face, nút ⭐.
- **Portfolio:** danh sách bài viết (đề, ngày, band Claude, điểm thật nếu có, Δ sau sửa) và ghi âm Speaking (phát lại, transcript, band). So sánh 2 bài cùng dạng đề để thấy tiến bộ.

## 10. Cài đặt
- **Mục tiêu:** target band, phút mỗi ngày, số thẻ mới mỗi ngày, ngày thi.
- **Chấm bài:** xem phiên bản prompt (`w-1.0`, `s-1.0`…), nút "Mở hướng dẫn chấm qua Claude", xác nhận hoặc tắt `biasOffset` (khi có đủ điểm thật).
- **Âm thanh:** âm lượng SFX, nhạc nền (mặc định tắt), giọng ưu tiên cho từ vựng (UK/US), tốc độ mặc định ở training.
- **Hiển thị:** theme (tối/sáng/theo hệ thống), cỡ chữ bài đọc (16–22), giảm chuyển động (theo hệ thống hoặc bật).
- **Riêng tư:** giải thích Web Speech gửi audio lên dịch vụ nhận dạng của trình duyệt. Nút xoá ghi âm cũ.
- **Dữ liệu:**
  - Xuất sao lưu (JSON, tuỳ chọn kèm ghi âm).
  - Nhập sao lưu (gộp hoặc thay thế, có xác nhận 2 bước).
  - Xoá toàn bộ dữ liệu (xác nhận bằng cách gõ "XOA").
- **Nâng cao:** hiện game cũ (V1/V2), làm lại placement, xem phiên bản dữ liệu.

## 11. Trạng thái rỗng, lỗi, offline
- **Không có thẻ đến hạn:** "Hết thẻ hôm nay 🎉. Muốn học 10 từ mới chứ?" (nút).
- **Bài chưa chấm:** W1/S1 lưu ở `awaiting_grade`. Hôm nay hiện thẻ "N bài chờ chấm", bấm vào là mở lại màn copy và dán.
- **Thiếu micro hoặc trình duyệt không hỗ trợ ASR:** hướng dẫn cụ thể từng bước (Chrome/Edge, cấp quyền).
- **Offline:** banner nhỏ "Đang offline: nhận dạng giọng nói (S1/S2) có thể không chạy". Audio chưa tải thì hiện nút "Tải khi có mạng".
- **Lỗi tải data:** màn lỗi có nút "Thử lại" và mã lỗi. Không hiện trắng màn hình. Có ErrorBoundary ở mỗi route.

## 12. Trợ năng
- Mọi tương tác dùng được bằng bàn phím. Focus ring rõ (2 px `--color-info`).
- Có `aria-live="polite"` cho kết quả chấm. Timer **không** đọc mỗi giây, chỉ thông báo ở 5 phút, 1 phút, 10 giây.
- Tôn trọng `prefers-reduced-motion` (xem `10` §4).
- Phụ đề và transcript có ở training sau khi chấm. Ở exam mode thì không có, giống thi thật.
