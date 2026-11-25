# 17 · UI/UX, ASSET, ANIMATION, TỐI ƯU · phần MỚI so với plan cũ

> Nền giữ nguyên: `docs/audit-max/antigravity/11`–`14` (token, iPhone ưu tiên 1, hiệu ứng bậc E0–E3, hạ cấp tự động, lật thẻ an toàn WebKit, crop ảnh, ngân sách, PWA iOS). File này chỉ thêm phần cho các màn và tính năng mới.

## 1. `DESIGN.md` (NC-0, gốc repo, ≤ 200 dòng)
- Mục đích: một nguồn cho cả Antigravity, Claude Code và `impeccable`.
- Nội dung:
  - tinh thần "Focus Arcade pastel" (viền game, vùng chữ sạch);
  - token màu/chữ/khoảng cách/bo góc/bóng/thời gian (trỏ `src/design/tokens.css`);
  - quy tắc màn khung và màn học;
  - quy tắc Lexi;
  - quy tắc âm thanh (cue ngắn, pitch tăng theo combo, im lặng lúc nghe/viết);
  - danh sách cấm (chữ < 12 px, hơn 1 nút chính, animate layout…).
- Học **format** từ awesome-design-md. Không chép DESIGN.md của thương hiệu thật. Không lấy hình hay tên Sanrio/Hello Kitty; chỉ lấy cảm hứng "kawaii pastel".

## 2. Màn mới cần thiết kế (iPhone 390 trước)
| Màn | Điểm khó UI | Ghi chú |
|---|---|---|
| Error Boss (N1) | Boss là **mã lỗi của chính mình**, phải thân thiện, không xấu hổ | Hình Boss là icon Fluent + máu; câu sai hiện mờ, bản sửa rõ |
| Overview Forge (N2) | Kéo dữ liệu vào nhóm trên màn hẹp | Dùng chạm chọn + nút "vào nhóm", không kéo thả bắt buộc |
| Mổ đề | 5 nhãn nguyên nhân phải chọn ≤ 2 phút | Chip lớn 44 px, phím số 1–5 trên laptop |
| Luật sư (R1/R2) | Bôi bằng chứng trên iPhone | Chạm câu để chọn (đã có bản chạm từ plan cũ) |
| Dịch ngược (N3) | Diff màu 2 đoạn văn | Diff theo cụm, không theo ký tự; theme sáng/tối đều AA |
| Vườn input (N4) | Đọc/nghe dài | Vùng chữ sạch, Source Serif 18/1.7, không hiệu ứng |
| S1/S2/N5 | Ghi âm, sóng âm, transcript sửa được | Sóng theo RMS (rAF, không re-render React); nút ghi lớn ở vùng ngón cái |
| Nhập gói riêng / nhập kết quả đề ngoài | Form nhanh | ≤ 3 phút một đề, phím tắt |
| Band trajectory, Strand Ring, Tổng kết tuần | Biểu đồ nhỏ trên iPhone | Theo skill `dataviz`: màu theo token, có số, AA |

## 3. Asset mới
- Icon cho 6 mode mới + nhãn Mổ đề + mã lỗi (Fluent Emoji 3D, cùng bộ).
- Biểu đồ Task 1: SVG tự sinh từ dữ liệu OWID (không phải asset tải).
- Process/map: SVG tự vẽ theo token.

## 4. Animation
- Hạ Boss: E1 (máu giảm) + E3 (khi chết hẳn sau 3 bài).
- Mổ đề và Luật sư: **không có hiệu ứng ở vùng chữ**.
- Daily Paraphrase: lật ô kiểu Wordle (dùng mẫu lật thẻ an toàn WebKit của plan cũ).
- Speaking: im lặng khi ghi âm; phản hồi sau khi dừng.

## 5. Tối ưu (mới)
| Tài nguyên | Ngân sách | Cách giữ |
|---|---|---|
| Model ASR (Moonshine/Whisper base) | ≤ 150 MB, tải khi bật Speaking lần đầu | Cache Storage theo phiên bản; nút xoá; tiến độ tải |
| wav2vec2 phoneme (pha 2) | ≤ 250 MB, tuỳ chọn | Chỉ tải khi bật chế độ phát âm |
| Harper WASM | đo thật, lazy ở màn Writing | Không vào entry |
| Dữ liệu v2 | Tải theo game/unit; lõi lexicon < 1 MB | Lõi + chi tiết lười (D17) |
| Audio v2 | Gói theo unit, opus 32–48 kbps | Không precache; tổng theo `10c` §4 |
| Gói riêng | Tuỳ Bang | IndexedDB + Cache Storage; hiện dung lượng ở Cài đặt |
- **CI:** thêm `@lhci/cli` (mobile, ngân sách cũ của plan cũ) + `rollup-plugin-visualizer` (bắt transformers/harper lọt vào entry) + `npx impeccable detect src/` (báo cáo, không chặn tới hết NC-7).
- **RUM cục bộ:** `web-vitals` ghi LCP/INP vào Dexie (PB-23 plan cũ).
