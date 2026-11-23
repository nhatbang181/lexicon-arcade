# 02 · UI/UX: bố cục, thứ bậc thị giác, khả năng đọc, truy cập, responsive

> Bằng chứng: ảnh trong `docs/audit-max/anh-hien-trang/` (chụp ngày 23/11/2026, dev server, profile trống) và số đo tự động `anh-hien-trang/do-dac-tu-dong.json` (20 route × 4 độ rộng 360/390/820/1280).
> Chi tiết đầy đủ từng lỗi: `phu-luc/D-ui-flow-production.md` §3, §4.
> Luật liên quan: `LUAT.md` D1–D9, B5, J3.

## 1. Điểm hiện tại: **5,5/10**

| Tiêu chí | Điểm | Một câu |
|---|---|---|
| Token và màu (theme tối) | 8 | Chỉ 13 mã hex ngoài `tokens.css`; chữ chính 14,9:1, chữ phụ 7,2:1 |
| Theme sáng | 2 | Nút primary 2,0–3,5:1, Pill 1,75–3,15:1, màu kỹ năng trên trắng đều trượt AA |
| Thứ bậc thị giác trên mobile | 4 | Ở màn chơi, HUD chiếm ~45% chiều cao trước khi tới câu hỏi; Hôm nay có 2 khối chào trước việc chính |
| Khả năng đọc | 6 | Bài đọc Source Serif 18px rất tốt; nhưng `text-xs` (12px) dùng 407 lần, 11px ở thanh tab, 10px ở bản đồ node V1 |
| Vùng chạm | 4 | Nút thoát/âm lượng của mọi game chỉ **29–35 px** ở 390px; filter chip 38px; select 33px |
| Truy cập (bàn phím, focus, aria) | 5 | Nhiều game chơi được bằng phím; nhưng Modal không bẫy focus, Card không bấm được bằng phím, V3 có 120 điểm Tab |
| Responsive | 6 | 0 tràn ngang ở 19/20 route; **R2 tràn 106px ở 360px, 76px ở 390px** |
| Cảm giác "game" của giao diện | 3 | Trông như dashboard web tối: 12 thẻ Hub giống hệt nhau, không minh hoạ, không chiều sâu, 0 animation chạy khi đứng yên |

## 2. Chẩn đoán theo màn (bằng chứng ảnh)

| # | Màn / ảnh | Vấn đề | Mức | Cách sửa (thông số) | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| U1 | Mọi game, `play_v1-390.png` | HUD 2 khối (tiến độ + bản đồ 30 node + chú giải 5 màu + "Node 1/30") đẩy thẻ câu hỏi xuống `y≈370px`; đáp án 4 nằm sát mép dưới; sau khi trả lời sai, phần giải thích nằm **dưới màn hình** (`play_v1-390-sai-250ms.png`) | P1 | Theo `03-ANIMATION-FEEDBACK.md` §4: ẩn RunMap và chú giải khỏi màn câu hỏi ở < 768px; thanh tiến độ 8px gộp vào header 56px; FeedbackPanel là bottom sheet `max-height: 55vh` | Ở 390×844: `top` câu hỏi ≤ 80px; đáp án 2 `bottom` ≤ 844; FeedbackPanel hiện trong viewport không cần cuộn |
| U2 | `src/app/screens/PlayScreen.tsx:62,98` | Nút thoát và loa `w-9 h-9` bị co còn 29–35px rộng ở 360/390 vì header flex không có `shrink-0` | P1 | `w-11 h-11 shrink-0` (44px); tên game `min-w-0 truncate` | Đo `boundingBox` ≥ 44×44 ở 360px |
| U3 | V2, V3, L1, L2 (`play_v3-390.png`, `play_l1-390.png`) | **Hai header chồng nhau**: header PlayScreen (✕, tên, loa) + header riêng của game có thêm nút ✕/"Quay lại" thứ hai | P2 | Game không tự vẽ nút thoát; dùng slot `headerExtra` của PlayScreen cho timer/combo | Mỗi màn chơi có đúng 1 nút thoát (`getAllByRole('button',{name:/thoát/i}).length===1`) |
| U4 | `PlayScreen.tsx:92`, `HubScreen.tsx:148` | Nhãn cứng "Level 1 · Training", "Level 1 · Mốc M1" là thuật ngữ nội bộ, sai sự thật (level không đổi) | P1 | Hiện chip band ước lượng "≈ 6.5" + chế độ "Luyện"/"Thi" bằng tiếng Việt; bỏ "Mốc M…" | grep `Mốc M\|Level 1 ·` trong `src/app` = 0 |
| U5 | `hub-1280.png` | 12 thẻ cùng cỡ, cùng bố cục, cùng nút "Mở" (vi phạm `LUAT.md` D6); không icon game riêng (chỉ icon kỹ năng lucide); không cho biết đã chơi chưa, level, lần chơi cuối | P1 | Thẻ game dùng `LiveCard` (§5 file 03) + icon màu Fluent Emoji 64–96 px riêng từng game (`LUAT.md` D11, K9); dòng trạng thái "Lần cuối: hôm qua · Band 6.5"; bấm cả thẻ mở **Sheet chọn chế độ** (`docs/09` §5); bỏ nút "Mở"; thẻ chưa sẵn sàng (S1, S2, X1) xám + nhãn "Sắp có", xếp cuối | Ảnh Hub 1280: 0 nút "Mở"; 3 thẻ "Sắp có" ở cuối |
| U6 | `today-390.png` | Lần đầu: 2 khối chào ("Thiết lập lần đầu" + "Chào Bang · Hôm nay học gì?") trước khi tới việc chính; copy kỹ thuật "Không tốn tiền API, chấm bài qua Claude gói copy/dán" (`TodayDashboard.tsx:351`) | P2 | Profile trống → chỉ 1 thẻ CTA "Thiết lập 90 giây"; đã có profile → ẩn khối chào, đưa "Việc tiếp theo" lên đầu (y ≤ 120px ở 390) | Ảnh Today 390: thẻ việc đầu tiên `top` ≤ 160px |
| U7 | `play_r2-360.png` | **Tràn ngang 106px** ở 360, 76px ở 390 (select bài đọc `w=449px`, dãy nút level) | P1 | Select `w-full max-w-full`; hàng công cụ `flex-wrap`; kiểm `min-w-0` các con flex | `scrollWidth - clientWidth == 0` ở 360/390 |
| U8 | `App.tsx` thanh tab đáy, `play_l2-390.png`, `play_v1-390.png` | Chữ 11px (tab đáy, mô tả level L2), 10px (số node V1, `RunMap.tsx`) | P2 | Tab đáy 12px + icon 22px; nội dung ≥ 14px; bỏ `text-[10px]`/`text-[11px]` | 0 phần tử chữ < 12px (`do-dac` cột `tiny`) |
| U9 | `settings-360.png` | 4 `select` band cao 33px; slider âm lượng cao 16px | P2 | `min-h-11`; slider vùng chạm 44px (`::-webkit-slider-thumb` 24px + padding) | đo ≥ 44px |
| U10 | `play_w1-390.png` | Màn vào W1 là trang duyệt danh sách đề (75 phần tử tương tác < 44px), 2 nút vàng ngang hàng, chữ "Δ band", "Chấm Claude" | P2 | Màn vào W1: 1 nút chính "Viết đề hôm nay" + 1 liên kết "Chọn đề khác"; bộ lọc chuyển vào Sheet | 1 primary/màn; 0 chữ "Δ" |
| U11 | `play_s1-390.png`, `play_s2-390.png`, `exam-1280.png` | S1, S2, X1 là màn placeholder nhưng vẫn đứng ngang hàng game thật trên Hub và Hôm nay | P2 | Xem U5; Today không bao giờ gợi ý game chưa sẵn sàng (`TodayDashboard.tsx:43-89`) | – |
| U12 | `src/design/tokens.css:68-77` | Theme sáng giữ màu kỹ năng của theme tối → trượt tương phản (bảng §3) | P1 | Bộ màu Tailwind 800 cho theme sáng (§3) + token `--color-on-accent` | axe 0 lỗi `color-contrast` ở 2 theme |
| U13 | `tokens.css:11,64` | `--color-text-faint #6B7690` = 3,89:1 trên surface; viền `#26304A` = 1,35:1 (input không thấy biên) | P2 | `--color-text-faint:#8792AB` (5,66:1); thêm `--color-border-strong:#56627F` cho input/ô đáp án | script contrast ≥ 4,5 cho chữ, ≥ 3 cho viền input |
| U14 | `Button.tsx:86`, `ChoiceButton.tsx:192` | Hover chỉ `opacity-90`; ChoiceButton không có hover; disabled chỉ `opacity-50`; phần lớn style inline nên không gắn được `:hover` | P2 | Class dùng biến: `hover:bg-[color-mix(in_srgb,var(--accent)_88%,white)] active:scale-[0.97] transition-[transform,background-color] duration-150`; focus-visible vòng 2px `--color-info` offset 2px | Ảnh 4 trạng thái khác nhau rõ (diff pixel > 2%) |
| U15 | `Modal.tsx:39-44`, `Sheet.tsx` | Không bẫy focus, không trả focus, `id="modal-title"` cố định | P2 | `useId()`; focus trap; trả focus; hoặc `<dialog>.showModal()` | Tab 10 lần vẫn trong dialog; axe 0 lỗi |
| U16 | `Card.tsx:257-261`, `HubScreen.tsx:99` | Thẻ tương tác là `div` + onClick, không role, không tabIndex | P2 | Render `<button>` hoặc `<a href>` | Tab tới thẻ, Enter vào game |
| U17 | `App.tsx` NAV | Điều hướng chính dùng `<button onClick=navigate>` (không mở tab mới, không là link với trình đọc màn hình) | P3 | `<a href="#/…">` (wouter `Link`) | `getAllByRole('link')` trong nav = 5 |
| U18 | `App.tsx:165,177,221,224` | Streak/XP shell cứng "0 ngày", "0 XP" | P1 | `useLiveQuery` profile (xem `05-FLOW.md` F2) | Số shell = số Today |
| U19 | `src/app/screens/LegacyScreen.tsx:5` | CSS legacy vào bundle chính → `body{image-rendering:pixelated}` + font legacy đè lên V3 | P1 | Lazy-load CSS legacy (xem `06-PRODUCTION.md` X4) | `grep -c pixelated dist/assets/index-*.css` = 0 |

## 3. Bảng màu sửa (đã đo)

**Theme tối – giữ, chỉ vá 3 token:**

| Token | Cũ | Mới | Tỷ lệ mới |
|---|---|---|---|
| `--color-text-faint` | `#6B7690` (3,89) | `#8792AB` | 5,66 trên surface, 5,06 trên surface-2 |
| `--color-border-strong` (mới) | – | `#56627F` | 2,90 (dùng cho input, ô đáp án) |
| Pill vocab chữ | `#8B5CF6` (3,57) | `#A78BFA` | 7,03 |

**Theme sáng – thêm vào `[data-theme="light"]`:**
```css
--color-vocab:#5B21B6; --color-listening:#155E75; --color-reading:#065F46; --color-writing:#92400E;
--color-speaking:#9F1239; --color-correct:#166534; --color-wrong:#991B1B; --color-partial:#854D0E;
--color-info:#1E40AF; --color-text-faint:#5B6478; --color-on-accent:#FFFFFF;
```
Theme tối thêm `--color-on-accent:#0B0F1A`. Mọi `'#0B0F1A'` cứng trong W1 (×6), R2 (×4), Portfolio, V1 đổi sang `var(--color-on-accent)`.

## 4. Thang chữ (thêm vào `@theme` của `src/design/tokens.css`)

| Token | Desktop / Mobile | Line-height | Dùng cho |
|---|---|---|---|
| `--text-display` | 48 / 36 px, 800 | 1.1 | điểm Recap, band |
| `--text-h1` | 28 / 24 px, 700 | 1.25 | tiêu đề màn |
| `--text-h2` | 20 / 18 px, 600 | 1.3 | tiêu đề khối |
| `--text-question` | 20 / 18 px, 500 | 1.45 | câu hỏi, prompt |
| `--text-reading` | 18 / 17 px Source Serif 4 | 1.7, ≤ 68ch | bài đọc, transcript |
| `--text-body` | 16 / 15 px | 1.5 | UI |
| `--text-caption` | 13 / 12 px | 1.4 | chú thích (tối thiểu) |

Font hiển thị mới (tiêu đề game, số điểm, Recap): theo `03-ANIMATION-FEEDBACK.md` §9 (Baloo 2 nếu qua kiểm glyph tiếng Việt). Font nội dung giữ nguyên.

## 5. Bố cục chuẩn theo độ rộng

| Độ rộng | Shell | Màn chơi | Bài đọc (R1, R2, X1) |
|---|---|---|---|
| 360–389 | header 56px + tab đáy 64px (chữ 12px) | header 56px, thẻ câu bắt đầu ≤ 72px, nút chính sticky đáy 56px | tab "Bài đọc / Câu hỏi" (đã có) |
| 390–767 | như trên | như trên | như trên |
| 768–1023 (820 tablet) | tab đáy; nội dung `max-w-[720px]` căn giữa | thẻ câu `max-w-[640px]`; HUD gọn 1 dòng | 2 cột nếu ≥ 900px, không thì tab |
| ≥ 1024 (1280) | sidebar 240px; nội dung `max-w-[1200px]` | thẻ câu `max-w-[720px]`; RunMap cột phải 280px | 2 cột 55/45 (đã có ở R1) |

## 6. Hướng nâng cấp "trông như game" (không phá Focus Arcade)

1. **Hub = bộ sưu tập thẻ game**: `LiveCard` có thở/nghiêng/bóng tách (file 03 §5), icon game riêng tô màu kỹ năng, dải màu kỹ năng ở đỉnh thẻ 6px, ảnh nền thẻ là gradient 2 màu kỹ năng + hoa văn noise SVG 4% (code, không phải asset).
2. **Hôm nay = "bảng nhiệm vụ"**: 3 thẻ nhiệm vụ xếp như lá bài lệch nhau 4px/–1.5°, thẻ đầu nổi (D3 depth); vòng mục tiêu ngày to 96px bên phải; streak có ngọn lửa động (asset hạt `ember`) và lịch 7 ô.
3. **Nền có chiều sâu nhẹ**: `--color-bg` thêm radial-gradient mờ (màu kỹ năng của màn hiện tại, opacity 6%) ở góc trên phải + vignette 4 góc 18%. **Không** đặt sau vùng chữ học (luật J3) — gradient nằm ngoài khung nội dung.
4. **Recap = màn thưởng**: theo file 03 §3 dòng 16 (đếm kiểu Balatro).
5. **Minh hoạ empty state**: dùng 6 SVG unDraw đã có (`public/assets/illustrations/`), đổi màu theo token kỹ năng.

## 6b. Mật độ hình ở màn khung (áp dụng bài học date-planner v5, `LUAT.md` M1–M7, D11)

Số đo nền (`anh-goc-loi/BAO-CAO.md`, 390 tối): 6/6 màn khung (Hôm nay, Onboarding, Hub, Thống kê, Thư viện, Portfolio) **không có hình lớn nào**, **0–1 icon màu**, **9–16 icon nét đơn sắc** (lucide), 1–5 "hộp chỉ có chữ", 0 vật chuyển động. Đây chính là lời chê "ít ảnh, ít icon, nhìn đơn giản" ở dự án anh em.

| Màn khung | Hero ≥ 15% khung nhìn (M1) | Nhân vật Lexi (M3, `03` §5b) | ≥ 6 icon màu khác nhau (M2, M7) | Vật chuyển động (M4) |
|---|---|---|---|---|
| Hôm nay | vòng mục tiêu ngày 96 px + dải lửa streak + minh họa `goals.svg` đổi màu theo kỹ năng | `co-vu` 96 px trên mép thẻ "Việc tiếp theo" + bong bóng thoại | 3 icon nhiệm vụ (icon game), 🔥 streak, ⭐ XP, 🎯 mục tiêu, 📅 tuần | lửa streak, thẻ nhiệm vụ thở, Lexi thở |
| Hub | hàng "đề xuất hôm nay" là thẻ lớn có ảnh nền gradient + icon 96 px | `idle` 72 px cạnh tiêu đề | 12 icon game riêng (Fluent) | thẻ `LiveCard` thở |
| Thống kê | biểu đồ band 4 kỹ năng (đã là "hình lớn" khi có dữ liệu); khi trống dùng `empty-cards.svg` | `vui`/`dong-vien` 80 px cạnh khối streak | 12 huy hiệu màu (mờ khi chưa mở), icon mastery | thanh mastery chạy khi vào màn |
| Recap | khung điểm lớn + tia sáng xoay | `vui`/`an-mung`/`dong-vien` 120 px trên khung điểm | icon game, 🔥, ⭐, 🎯, huy hiệu mới | đếm số kiểu Balatro |
| Onboarding | `welcome.svg`, `placement.svg`, `devices.svg` | `chao` 120 px mỗi bước | icon 4 kỹ năng + icon phút/ngày | thanh tiến độ |
| Empty state | minh họa unDraw đã có (đổi màu theo kỹ năng) | `ngu`/`suy-nghi` 120 px | 1 icon hành động | minh họa nhịp nhẹ |

Icon nét `lucide` chỉ còn cho glyph hệ thống (`LUAT.md` D11). Vùng chữ học (bài đọc, câu hỏi, ô gõ) **không** áp luật này.

## 7. Tiêu chí ĐẠT của mảng (tổng hợp, kiểm ở `KIEM-THU.md`)
- `audit-ui.mjs` mọi route: 0 CHẶN; màn khung 0 lỗi M1, M2, M5, M7.
- 0 tràn ngang, 0 phần tử tương tác < 44px (trừ chữ trong bài đọc), 0 chữ < 12px trên 20 route × 4 độ rộng.
- axe-core 0 vi phạm serious/critical ở theme tối **và** sáng cho Hôm nay, Hub, Cài đặt, V1, R1, W1.
- Ở 390×844, mọi game: câu hỏi `top` ≤ 80px và 2 đáp án đầu trong viewport.
- Mỗi màn đúng 1 nút primary; 0 chuỗi thuật ngữ nội bộ (`LUAT.md` D7).
- Rubric `KIEM-THU.md` §3: "Thứ bậc thị giác" ≥ 8, "Khả năng đọc" ≥ 9, "Cảm giác game" ≥ 8.
