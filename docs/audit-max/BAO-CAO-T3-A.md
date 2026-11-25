# BÁO CÁO T3-A · Hệ thiết kế, Asset, Nền tảng FX & Cổng G2

- **Nhánh:** `audit-max/T3-A` (worktree `D:\English-wt\T3-A`, đã đồng bộ `master` sau gộp sớm A1–A4 tại `273b2b8`)
- **Phạm vi:** A1 (Token/Theme/AA) · A2 (Asset thật + CREDITS/manifest + Cổng G1) · A3 (Nền tảng FX) · A4 (Nhân vật Lexi + LiveCard) · A5 (Component polish + RecapScreen + SFX/AudioProvider) · A6 (Thư viện `/dev/components` + bằng chứng Cổng G2)

---

## 1. Số đo trước → sau

| Hạng mục kiểm | Trước T3-A (baseline T1-C) | Sau T3-A (A1–A6) | Lệnh kiểm |
|---|---|---|---|
| Tương phản WCAG AA (`dark` / `light` / `exam`) | 135 cặp, **53 dưới ngưỡng** (dark 4, light 37, exam 12) | **144/144 cặp, 0 dưới ngưỡng** (dark 48/0, light 48/0, exam 48/0) | `node scripts/qa/contrast.mjs` (exit 0) |
| Màu cứng ngoài `tokens.css` (`D1`) | Nhiều màu cứng trong `src/design/**` + `DevComponentsScreen.tsx` | **0 chỗ** trong `src/design/**`, `src/content/**`, `DevComponentsScreen.tsx` (còn 7 chỗ ngoài phạm vi tại `W1EssayLab.tsx` & `PortfolioScreen.tsx`, đã ghi `HANDOFF.md`) | `node scripts/qa/hardcoded-colors.mjs` |
| Asset & CREDITS (`SR-60`, `SR-46`) | Thiếu asset màu Fluent 3D, 6 SVG vẽ tay (`D13`), `url_tai` `soul_knight` (`X20`) | **153/153 file** khớp SHA-256 & đủ 10 trường + `ti_le_khung/object_fit/diem_nhan`; non-audio **377,48 KB / 2 048 KB**; SFX **54,24 KB / 250 KB** | `node scripts/validate/assets_credits.mjs` (exit 0) |
| Kiểm tĩnh TypeScript | — | **0 lỗi** | `npx tsc --noEmit -p .` (exit 0) |
| Unit test Vitest | Chưa có test riêng cho design A1/A3/A4/A5 | **55 file · 602/602 test xanh** (gồm `designA1.test.tsx` 5, `fxA3A4.test.tsx` 7, `designA5.test.tsx` 7, `sfx.test.ts` 4) | `npm test` (exit 0) |
| E2E A11y & Motion (`PW_PORT=5251`) | — | **17/17 test xanh** (`e2e/a11y.spec.ts` 12/12, `e2e/motion.spec.ts` 5/5) | `PW_PORT=5251 PW_CHANNEL=chrome npx playwright test e2e/a11y.spec.ts e2e/motion.spec.ts --project=chromium` |
| Ngân sách build & rò dev/test | CSS chính 130,58 KB (sát/vượt ngưỡng 130 KB); precache ~1 540 KiB | **JS khởi động `#/` gzip:** 150,37 KB / 250 KB · **CSS chính raw:** 67,77 KB / 130 KB · **Chunk lazy lớn nhất:** `motion-*.js` 50,6 KB / 120 KB · **Precache PWA:** 1 311,73 KiB / 1 500 KiB · **0 chuỗi rò** (kể cả `"Thư viện component"`) | `npx vite build && node scripts/qa/size-budget.mjs` (exit 0) |
| Kiểm UI tự động `/dev/components` (4 khung × 2 theme) | — | **0 CHẶN · 0 NẶNG · 0 NHẸ** (0 file `*-loi.png`) | `audit-ui.mjs --route /dev/components --vp 390x844,375x667,820x1180,1280x800 --theme dark,light` |

---

## 2. Tóm tắt thay đổi theo chặng (A1–A6)

### A1 · Token, 3 theme & đóng nợ `HANDOFF` design (`11f193d`)
- `src/design/tokens.css`: hoàn thiện bảng màu 3 theme (`dark`, `light`, `exam`), thêm `--color-on-accent`, `--color-text-faint`, `--color-border-strong`, `--color-boss-dim`, `--color-backdrop`; thêm thang chữ `--text-display/h1/h2/question/reading/body/caption`, `--text-input: 1rem` (chống auto-zoom iOS), lưới 4 px (`--space-*`), bo góc (`--radius-*`), bóng 3 mức, z-index, token motion `dur/spring/ease`, font `--font-display` (`Baloo 2`).
- `src/design/motion.ts`: đồng bộ hằng thời gian & spring theo `13-ANIMATION.md` §2 và L-7 (`shakeX`: `±6 px × 3 / 300 ms`).
- Đóng nợ `HANDOFF`: `KeyHint.tsx` & `Highlighter.tsx` tăng chữ từ `11 px` lên `12 px` (`text-xs`, đóng D4); `AnswerInput.tsx` dùng `--color-border-strong`; `FeedbackPanel.tsx` nâng vùng chạm nút báo lỗi ≥ 44 px; `Modal.tsx`, `Sheet.tsx`, `focusTrap.ts` thêm `e.preventDefault()` khi đóng Esc (`HANDOFF` T1-B #9), `useId()`, focus trap và trả focus khi đóng (`U15`).

### A2 · Asset thật, CREDITS/manifest & Cổng G1 (`79936fd`, `3ee71f2`, `425b7e0`)
- **Nhân vật Lexi (K10/L-1):** 8 trạng thái (`idle, chao, co-vu, vui, an-mung, dong-vien, suy-nghi, ngu`) tại `public/assets/mascot/lexi-*.webp` (Microsoft Fluent Emoji 3D, MIT, 256×256 nền trong suốt, 4,87–9,20 KB/file; trạng thái `chao` ghép tay vẫy để phân biệt rõ với `idle`).
- **40 icon màu Fluent Emoji 3D (K9/D11):** 12 game + 12 huy hiệu + 16 nhiệm vụ/UI tại `public/assets/icons/fluent/{games,badges,ui}/*.webp` (192×192 WebP ≤ 20 KB/file; `s2` dùng *Speaking head* tăng tương phản nền sáng).
- **6 minh hoạ SVG mở (D13):** `public/assets/illustrations/{welcome,goals,devices,placement,empty-cards,offline}.svg` tải từ unDraw (open license), đổi màu chủ đạo `#3B82F6`, tối ưu SVGO `--multipass -p 0` (0,90–2,33 KB/file).
- **8 texture hạt (CC0):** `public/assets/fx/*.png` từ Kenney Particle Pack (48×48 PNG bảng màu 12 mức alpha, 292–543 B/file).
- **Font `Baloo 2` Bold (OFL-1.1):** `public/assets/fonts/baloo-2-{vietnamese,latin}-700.woff2` (4,53 + 10,65 KiB), nạp qua `FontFace` API trong `ThemeProvider.tsx`.
- **Nguồn & công cụ:** `public/assets/CREDITS.md`, `scripts/assets/assets.manifest.json` (sửa `url_tai` `soul_knight` X20 & 6 dòng D13), `scripts/assets/fetch_t3a_assets.py`, `scripts/assets/build_contact_sheets.mjs`. Cổng G1 đã qua duyệt (`#40`).

### A3 · Nền tảng FX (`425b7e0`)
- `src/design/fx/{motionPref,fxTier,fxCanvas,emit,numberPop,screenPunch,celebrate,haptic,index}.ts`:
  - Phân bậc `full / medium / low / reduced` dựa trên `prefers-reduced-motion`, cấu hình người dùng (`prefReducedMotion`, `disableParticles`, `hideMascot`), chế độ Exam, `hardwareConcurrency` và FPS thực đo.
  - Canvas hạt 1 lớp toàn cục dùng 8 texture Kenney, giới hạn vòng đời và tự thu hồi; số bay `numberPop` (`+XP`), `screenPunch` (giới hạn 150 ms, tắt khi Exam/reduced), `celebrate` (confetti nhẹ theo mốc, tắt khi Exam/reduced), `haptic` an toàn trên iOS/Android.
  - `ThemeProvider.tsx`: bọc `<MotionConfig reducedMotion={...}>`, gắn cờ `data-reduced-motion` lên `<html>` để CSS toàn cục triệt tiêu animation/transform khi bật `reduced-motion`.

### A4 · Nhân vật Lexi & LiveCard (`425b7e0`, `78daaf7`)
- `src/content/mascotLines.ts`: kho thoại tiếng Việt tự nhiên cho 8 trạng thái, biến câu không lặp liên tiếp, có câu theo ngữ cảnh (không chứa ký hiệu nội bộ `Mốc M1..M7` hay từ `FSRS`).
- `src/design/components/Mascot.tsx`: hiển thị Lexi theo tỷ lệ 1/1 `object-contain` (không cắt mặt `SR-46`), ẩn khi `examMode` hoặc `hideMascot`, đóng băng hoạt ảnh khi `reduced-motion`.
- `src/design/components/LiveCard.tsx`: hỗ trợ 2D sống (`breathing`, `tilt` theo con trỏ chuột trên thiết bị hỗ trợ), bản `mastered`, lật 3D tách 2 mặt riêng (`preserve-3d` không đặt `overflow/opacity/filter` theo `SR-45` & WebKit bug 71624), hạ bậc về crossfade 120 ms khi `reduced-motion`/Exam.

### A5 · Component polish, sửa M5 LiveCard, RecapScreen & Audio (Chặng 3)
- `src/design/components/Button.tsx`: mọi kích thước (`sm/md/lg`) giữ `min-h-[44px]`, lớp `.design-btn` (`U14`: hover chỉ bật ở `@media (hover: hover)`, active `scale(0.96)` trong `80 ms`), dùng `--color-on-accent`.
- `src/design/components/ChoiceButton.tsx`: lớp `.design-choice`, `data-state`, kiểm bậc FX qua `useFxTier`, viền nghỉ `--color-border-strong`.
- `src/design/components/Card.tsx`: thêm kích hoạt bàn phím `Enter`/`Space` (`U16`) có hàm `hasNestedInteractive()` bảo vệ để thẻ bọc `<Button>` bên trong không tạo lỗi axe `nested-interactive`.
- `src/design/components/LiveCard.tsx` + `src/design/tokens.css`: xoá `<div>` bóng sibling (khắc phục 54 lỗi `M5` của `T3-C`), thay bằng pseudo-element `.live-card-depth::before` cập nhật biến CSS `--lc-sx`/`--lc-sy` qua ref (0 re-render); thêm `h-full` cho `<motion.div>` và các mặt thẻ để giãn khít 100% chiều cao ô lưới nhiều cột.
- `src/design/components/FeedbackPanel.tsx`: bổ sung prop tuỳ chọn `nextTipVi?: string` ("Lần sau để ý:", PP-03).
- `src/design/components/RecapScreen.tsx`: bỏ mặc định giả `80%`/`240s`, nhận `nextTask` + `onNextTask` (nút chính `"Tiếp: {title}"`, hỗ trợ Enter, đóng `HANDOFF` T1-B #4), gắn `data-mascot-ok="true"` + `<Mascot>` (ẩn khi Exam), đếm điểm XP kiểu Balatro (`correctCount`, `comboMultiplier`, `baseXp`) kèm nút `"Tua nhanh"` / Enter và prop `autoCelebrate` (mặc định `true`).
- `src/core/audio/sfx.ts`: hàng đợi FIFO tối đa 2 giọng đồng thời (`J7`, `getActiveVoiceCount()`), `computeComboRate(combo)` (+1 bán cung mỗi bậc tới +12 rồi quay về 1.0×), biến thiên ngẫu nhiên ±4% cho `tap`/`flip`/`page`.
- `src/app/providers/AudioProvider.tsx`: lưu bền `sfxVolume` (`0..100`) & `muted` vào `localStorage` và `profileRepo.update(...)`, tự chuẩn hoá tỷ lệ cũ `0..1` khi khôi phục (`A9`).

### A6 · Thư viện `/dev/components` & Bằng chứng Cổng G2 (Chặng 3)
- `src/app/screens/DevComponentsScreen.tsx`: trưng bày toàn bộ thành phần chuẩn V3 (Button đủ trạng thái kể cả loading/disabled, Pill, KeyHint, AudioButton, Card bàn phím U16, LiveCard 2D Mastered & 3D flip, công tắc FX/motionPref, 8 trạng thái Lexi, 40 icon Fluent 3D, 6 SVG unDraw, FeedbackPanel có `nextTipVi`, RecapScreen có Balatro tally & `nextTask`, bảng thử 12 cue SFX, GradingPanel). Bỏ chuỗi `#3B82F6`, `text-[11px]` và từ `FSRS`.
- `scripts/assets/record_g2_video.mjs`: quay video tương tác 4–5 giây ở `390×844` (chuyển theme, lật thẻ 3D, bấm hạt FX, chuyển trạng thái Lexi, đóng mở Modal/Sheet).

---

## 3. Chức năng & tài sản cũ giữ nguyên (`SR-80`, `SR-90`, `SR-06`)

- **21 component gốc trong `src/design/components/`**: giữ nguyên 100% tên export và props cũ (`Button`, `Card`, `Pill`/`Badge`, `ProgressRing`, `BandMeter`, `Timer`, `Modal`, `Sheet`, `Toast`, `AnswerInput`, `ChoiceButton`, `KeyHint`, `AudioButton`, `FeedbackPanel`, `RecapScreen`, `EmptyState`, `Skeleton`, `Highlighter`, `QuestionNav`, `TrackPlayer`, `Waveform`, `MapView`). Mọi tính năng mới (`nextTipVi`, `nextTask`, `onNextTask`, `correctCount`, `comboMultiplier`, `autoCelebrate`) đều là prop tuỳ chọn.
- **Tương tác & phím tắt cũ:** Esc đóng `Modal`/`Sheet` (nay bổ sung `e.preventDefault()` tương thích `PlayScreen`), Enter nộp `AnswerInput` và chuyển tiếp ở `FeedbackPanel`/`RecapScreen`, nút báo lỗi trong `FeedbackPanel`, 5 trạng thái của `ChoiceButton`, `AudioButton` phát/dừng.
- **Providers & SFX:** `ThemeProvider` giữ đủ `dark`/`light`/`exam`, `targetBands`, `dailyGoalMin`; `AudioProvider` giữ nguyên chữ ký context; `sfx.ts` giữ đủ 12 cue chuẩn + 8 alias, tắt SFX trong Exam trừ `countdownEnd`/`timeup`, giữ cơ chế `unlock`/`resumeAudioContext` trên Safari iOS.
- **Asset cũ giữ nguyên (`SR-06`):** `public/assets/soul_knight/**`, `public/assets/ui/**`, `public/assets/icons/{games,badges}/*.svg`, `public/pwa-*.png`, `public/maskable-512.png`, 3 font chữ gốc (`Be Vietnam Pro`, `Source Serif 4`, `JetBrains Mono`).

---

## 4. Quyết định kỹ thuật

1. **Tailwind v4 `@source not` trong `src/design/tokens.css`:** Loại bỏ `../legacy`, `../../docs`, `../../scripts` khỏi phạm vi quét lớp Tailwind v4 vì CSS production trước đó bị phình tới `130,58 KB` (vượt ngưỡng `130 KB`). Sau khi thêm 3 chỉ thị `@source not`, CSS chính giảm còn **`67,77 KB`** và precache PWA giảm còn **`1 311,73 KiB`**, mở rộng ~188 KiB dư địa cho các màn ở Đợt 3/4 mà không ảnh hưởng giao diện `legacy` (vốn dùng stylesheet riêng `legacyEntry.css`).
2. **Thay `<div>` bóng sibling của `LiveCard` bằng `.live-card-depth::before`:** Xử lý dứt điểm 54 lỗi `M5` (khối DOM rỗng trang trí) mà `T3-C` gặp khi gắn `LiveCard` lên Hub, đồng thời cập nhật vị trí bóng qua CSS custom properties `--lc-sx`/`--lc-sy` để giữ 0 re-render và tuân thủ `SR-44` (chỉ animate `transform`).
3. **Chống `nested-interactive` trong `Card.tsx` (`hasNestedInteractive`):** Các màn cũ như `HubScreen.tsx` trên `master` đặt `<Button>` bên trong `<Card interactive>`. Hàm kiểm cây con giúp giữ `role="button"` + `Enter`/`Space` (`U16`) cho thẻ tự tương tác mà không gây lỗi axe `nested-interactive` cho các thẻ bọc nút.
4. **Nạp font `Baloo 2` 700 bằng `FontFace` API + subset ASCII/Vietnamese:** Giữ tổng 2 file woff2 chỉ `15,18 KiB`, tự nạp theo `BASE_URL` (an toàn cả khi deploy dưới subpath), tránh lỗi đường dẫn tĩnh của `@font-face` trong CSS bundle.
5. **Prop `autoCelebrate` trên `RecapScreen`:** Mặc định `true` cho các game thật; truyền `autoCelebrate={false}` riêng trong `DevComponentsScreen.tsx` để ảnh chụp tĩnh `/dev/components` không bị hạt confetti bay đè lên mục 1 khi vừa mở trang, trong khi nút thử confetti riêng ở mục 2 vẫn hoạt động bình thường.

---

## 5. Đường dẫn bằng chứng

- **Contact sheets Cổng G1 (`docs/audit-max/bang-asset/`):**
  - `lexi-dark.png`, `lexi-light.png`
  - `games-dark.png`, `games-light.png`
  - `badges-ui-dark.png`, `badges-ui-light.png`
  - `illustrations-dark.png`, `illustrations-light.png`
  - `fx-dark.png`, `fx-light.png`
- **Ảnh chụp & báo cáo Cổng G2 (`docs/audit-max/anh-sau/T3-A/`):**
  - `390x844-dark-dev_components.png`, `390x844-light-dev_components.png`
  - `375x667-dark-dev_components.png`, `375x667-light-dev_components.png`
  - `820x1180-dark-dev_components.png`, `820x1180-light-dev_components.png`
  - `1280x800-dark-dev_components.png`, `1280x800-light-dev_components.png`
  - `BAO-CAO.md`, `report.json`
- **Video tương tác Cổng G2:**
  - `docs/audit-max/anh-sau/T3-A/dev-components-390-demo.webm` (1 110,3 KB, 390×844)
- **Tài liệu ghi nguồn & kế hoạch:**
  - `public/assets/CREDITS.md`, `scripts/assets/assets.manifest.json`, `docs/audit-max/KE-HOACH-T3-A.md`, `docs/audit-max/HANDOFF.md`
