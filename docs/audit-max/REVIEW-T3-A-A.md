# REVIEW T3-A (Reviewer A · Cổng G2)

- **Reviewer:** `rv-t3-a-a` (`Gemini 4 Argon High` — độc lập hoàn toàn với Builder `Gemini 4 Neon High`)
- **Worktree & Nhánh:** `D:\English-wt\T3-A` (`audit-max/T3-A`, HEAD `85b758e`)
- **Phạm vi kiểm:** `T3-A` (A1–A6: `src/design/**`, `src/content/mascotLines.ts`, `src/core/audio/sfx.ts`, `src/app/providers/{ThemeProvider,AudioProvider}.tsx`, `src/app/screens/DevComponentsScreen.tsx`, `public/assets/**`, `scripts/assets/**`, `docs/audit-max/{BAO-CAO-T3-A.md,anh-sau/T3-A/**,bang-asset/**}`)
- **Cổng riêng đã dùng:** Vite `5246`, Playwright `PW_PORT=5256` (đã tắt sạch 100% tiến trình sau khi đo)
- **Phán quyết:** **ĐẠT** (0 CHẶN · 0 NẶNG · 5 NHẸ/góp ý cụ thể · Tổng Rubric có trọng số: **8.80 / 10**, tiêu chí thấp nhất: **8.5 / 10**)

---

## 1. Kiểm chống gian lận & Phạm vi Git (`SR-01`, `SR-05`, `SR-06`, `SR-11`, `SR-12`)

- `git -C D:\English-wt\T3-A diff --name-only master...HEAD` & toàn chuỗi commit `11f193d..85b758e`:
  - **0 file ngoài phạm vi** được phép của T3-A.
  - **0 sửa đổi** vào `scripts/qa/**`, `scripts/validate/**`, `docs/audit-max/cong-cu/**`, `docs/audit-max/LUAT.md`, `docs/audit-max/KIEM-THU.md`, `src/legacy/**`, `docs/archive/**`, `src/games/s1-*`, `src/games/s2-*`.
  - **0 hành vi lách công cụ (`SR-12` / `Q5`):** 0 `data-audit-ignore`, 0 `test.skip`/`it.skip`/`fixme` mới, không hạ trần nợ `KNOWN_DEBT` trong `e2e/a11y.spec.ts` hay `e2e/motion.spec.ts`.

---

## 2. Kết quả tự chạy lại toàn bộ cổng kỹ thuật

| Cổng kiểm | Lệnh reviewer tự chạy | Kết quả thực đo | Phán quyết |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit -p .` | **0 lỗi** (`exit 0`) | ✅ ĐẠT |
| Unit test (Vitest) | `npm test` | **55/55 file · 602/602 test xanh** (12.60s; gồm `designA1.test.tsx` 5/5, `fxA3A4.test.tsx` 7/7, `designA5.test.tsx` 7/7, `sfx.test.ts` 4/4) | ✅ ĐẠT |
| Tương phản WCAG AA | `node scripts/qa/contrast.mjs` | **144/144 cặp đạt AA, 0 dưới ngưỡng** (`dark` 48/0, `light` 48/0, `exam` 48/0) | ✅ ĐẠT |
| Asset & CREDITS (`SR-60`, `SR-46`) | `node scripts/validate/assets_credits.mjs` | **153/153 asset (100%)** khớp SHA-256 & đủ trường; non-audio **377.48 KB / 2048.00 KB**; SFX **54.24 KB / 250.00 KB** | ✅ ĐẠT |
| Màu cứng (`SR-43` / `D1`) | `node scripts/qa/hardcoded-colors.mjs` | **0 chỗ trong toàn bộ phạm vi T3-A** (còn 7 chỗ ngoài phạm vi tại `PortfolioScreen.tsx` & `W1EssayLab.tsx`) | ✅ ĐẠT |
| E2E A11y & Reduced Motion | `PW_PORT=5256 PW_CHANNEL=chrome npx playwright test e2e/a11y.spec.ts e2e/motion.spec.ts --project=chromium` | **17/17 test xanh** (`e2e/a11y.spec.ts` 12/12, `e2e/motion.spec.ts` 5/5) | ✅ ĐẠT |
| Build & Ngân sách & Rò chuỗi (`SR-49`, `SR-73`) | `npx vite build && node scripts/qa/size-budget.mjs` | JS `#/` gzip: **150.37 KB / 250 KB** · CSS chính raw: **67.77 KB / 130 KB** · Chunk lazy lớn nhất: `motion-*.js` **50.6 KB / 120 KB** · Precache PWA: **1311.73 KiB / 1500 KiB** · **0 chuỗi rò** (kể cả `"Thư viện component"`) | ✅ ĐẠT |
| Đo UI tự động 7 khung × 2 theme | `BASE_URL=http://localhost:5246 node docs/audit-max/cong-cu/audit-ui.mjs --route /dev/components --vp 390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768 --theme dark,light --out out/rv-t3-a-a/full` | **0 CHẶN · 0 NẶNG · 0 NHẸ** trên cả 14/14 lượt (`tràn=0`, `chạm<44=0`, `chữ<12=0`, `jargon=0`, `JS error=0`) | ✅ ĐẠT |
| Đo UI tự động `--reduced 1` | `BASE_URL=http://localhost:5246 node docs/audit-max/cong-cu/audit-ui.mjs --route /dev/components --vp 390x844,1280x800 --theme dark,light --reduced 1 --out out/rv-t3-a-a/reduced` | **0 CHẶN · 0 NẶNG · 0 NHẸ**, `chuyển động = 0` trên cả 4/4 lượt | ✅ ĐẠT |

### Bảng chi tiết `audit-ui.mjs` 7 khung × 2 theme (`out/rv-t3-a-a/full/BAO-CAO.md`)

| Khung | Theme | Route | CHẶN | NẶNG | tràn | chạm<44 | chữ<12 | icon màu | icon nét | hình lớn | nhân vật | chuyển động |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844 | dark | dev/components | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 1 |
| 390x844 | light | dev/components | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 1 |
| 375x667 | dark | dev/components | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 1 |
| 375x667 | light | dev/components | 0 | 0 | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 1 |
| 430x932 | dark | dev/components | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 1 |
| 430x932 | light | dev/components | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 1 |
| 820x1180 | dark | dev/components | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 |
| 820x1180 | light | dev/components | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 |
| 1180x820 | dark | dev/components | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 |
| 1180x820 | light | dev/components | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 |
| 1280x800 | dark | dev/components | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 |
| 1280x800 | light | dev/components | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 |
| 1366x768 | dark | dev/components | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 |
| 1366x768 | light | dev/components | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 |

---

## 3. Kiểm tra Luật cứng T3-A trên mã nguồn & ảnh chụp

1. **`LiveCard.tsx` + `tokens.css` (`M5`, `h-full`, `SR-44`, `SR-45`):**
   - Đã xoá hoàn toàn `<div>` bóng sibling rỗng từng gây lỗi `M5`; thay bằng pseudo-element `.live-card-depth::before` (`src/design/tokens.css:255-268`) chỉ dịch chuyển bằng `transform: translate3d(var(--lc-sx, 0px), var(--lc-sy, 6px), 0) scale(0.98)` qua ref (`src/design/components/LiveCard.tsx:74-86`, 0 re-render, đúng `SR-44`).
   - Đã gắn `h-full` cho `<motion.div>` và các mặt thẻ (`src/design/components/LiveCard.tsx:136,156,162,186,201,206,216`) để giãn khít 100% chiều cao ô lưới.
   - Lật 3D tuân thủ nghiêm ngặt `SR-45` và WebKit bug 71624 (`src/design/components/LiveCard.tsx:150-196`): phần tử `data-live-card-flipper="3d"` giữ `transformStyle: 'preserve-3d'` **không** đặt `overflow`, `opacity`, `filter`, `clip-path`, `mask`; 2 mặt `data-face="front"` và `data-face="back"` tách riêng với `backfaceVisibility: 'hidden'` + `WebkitBackfaceVisibility: 'hidden'`, mặt sau xoay sẵn `rotateY(180deg)`. Xem video `docs/audit-max/anh-sau/T3-A/dev-components-390-demo.webm` (00:04): chữ mặt sau `mitigate (v): giảm nhẹ, làm dịu bớt` đọc xuôi 100%, sắc nét.
   - Khi bật `reduced-motion`, bậc `low` hoặc `examMode`: hạ bậc về `data-live-card-flipper="crossfade"` (`duration: 0.12`, không xoay 3D, `src/design/components/LiveCard.tsx:197-213`).
2. **`Card.tsx` (`U16`, chống `nested-interactive`), `Button.tsx` (`SR-41`, `U14`), `KeyHint.tsx` (`D4`), `Modal.tsx`/`Sheet.tsx` (`U15`):**
   - `src/design/components/Card.tsx:23-85`: hỗ trợ `Enter`/`Space` (`U16`) và có `hasNestedInteractive(children)` để không gắn `role="button"` chồng lên thẻ chứa `<Button>` con.
   - `src/design/components/Button.tsx:46-50`: cả 3 kích thước `sm`, `md`, `lg` đều có `min-h-[44px]` (riêng `lg` là `min-h-[48px]`); lớp `.design-btn` và `.design-choice` (`src/design/tokens.css:238-252`) gói `:hover` trong `@media (hover: hover)` và nén `:active` `scale(0.96)` trong `80ms` (`U14`).
   - `src/design/components/KeyHint.tsx:11` và `src/design/components/Highlighter.tsx:553`: dùng `text-xs` (`12px`), không còn `text-[11px]` (`D4`).
   - `src/design/components/Modal.tsx:27-30`, `src/design/components/Sheet.tsx:27-30`, `src/design/components/focusTrap.ts:26-103`: dùng `useId()` cho `aria-labelledby`, bẫy focus `Tab`/`Shift+Tab`, gọi `e.preventDefault()` khi nhấn `Escape` và trả focus về nút kích hoạt khi đóng.
3. **`RecapScreen.tsx`, `FeedbackPanel.tsx`, `sfx.ts`, `AudioProvider.tsx`, `src/design/fx/**`:**
   - `src/design/components/RecapScreen.tsx:33-34,61-79`: đã bỏ mặc định giả `80%`/`240s`; nhận `nextTask` + `onNextTask` với nút chính `"Tiếp: {nextTask.title}"` (`RecapScreen.tsx:370-377`), gắn `data-mascot-ok="true"` (`RecapScreen.tsx:172`), ẩn `<Mascot>` và số đếm XP khi `examMode` (`RecapScreen.tsx:195,290`), đếm điểm kiểu Balatro kèm nút `"Tua nhanh"` / phím `Enter` (`RecapScreen.tsx:92-129,204-218`).
   - `src/design/components/FeedbackPanel.tsx:15,130-144`: hỗ trợ `nextTipVi` ("Lần sau để ý:") và nút báo lỗi `min-h-[44px]`.
   - `src/core/audio/sfx.ts:87-98,273-296`: giới hạn `MAX_CONCURRENT_VOICES = 2` bằng hàng đợi FIFO (dừng giọng cũ nhất khi giọng thứ 3 vào, `J7`), `computeComboRate(combo)` tăng +1 bán cung mỗi bậc tới +12 rồi quay về `1.0x`, jitter `±4%` cho `tap`/`flip`/`page`.
   - `src/app/providers/AudioProvider.tsx:23-130`: lưu bền `sfxVolume` (`0..100`) và `muted` vào `localStorage` + `profileRepo.update(...)`, tự chuẩn hoá thang cũ `0..1` qua `normalizeVolumeScale()` (`A9`).
   - `src/design/fx/{fxTier,fxCanvas,emit,numberPop,screenPunch,celebrate,haptic,motionPref}.ts`: hạ bậc tự động theo FPS (`SR-47`, giữ `allowE0: true`), `screenPunch` khoá `wrong-card` ở `±6px / 300ms` và chặn rung `document.body`/`document.documentElement` (`L-7`), tắt toàn bộ hạt/confetti/Lexi ở `examMode` và `reduced-motion` (`SR-24`, `SR-48`, `SR-50`).
4. **Kiểm 3 chỉ thị `@source not` trong `src/design/tokens.css:2-4`:**
   - Loại trừ `../legacy`, `../../docs`, `../../scripts` khỏi bộ quét lớp Tailwind v4 giúp giảm CSS chính từ `130.58 KB` xuống `67.77 KB` mà không làm mất bất kỳ utility nào của `src/app/**`, `src/design/**`, `src/features/**`, `src/games/**`, `src/core/**` (đã xác nhận qua 14 ảnh chụp `/dev/components` và 17 test E2E trên `today`, `hub`, `settings`, `play/v1`, `play/r1`, `play/w1`; phần `legacy` vẫn tạo bundle `dist/assets/legacyEntry-*.css` `109.69 kB` riêng biệt).

---

## 4. Checklist soi ảnh (`KIEM-THU.md` §4)

Đã mở xem trực tiếp bằng `read_file`:
- Bộ ảnh reviewer tự chụp (`out/rv-t3-a-a/full/`): `390x844-dark`, `390x844-light`, `375x667-dark`, `375x667-light`, `430x932-dark`, `430x932-light`, `820x1180-light`, `1180x820-light`, `1280x800-light`, `1366x768-dark`, `1366x768-light`.
- Bộ ảnh nộp của builder (`docs/audit-max/anh-sau/T3-A/`): `390x844-dark/light`, `375x667-dark/light`, `820x1180-dark/light`, `1280x800-dark/light`, video `dev-components-390-demo.webm`.
- Bộ contact sheet G1 (`docs/audit-max/bang-asset/`): `lexi-dark.png`, `games-light.png`, `illustrations-dark.png`, `badges-ui-dark.png`.

- [x] Không tràn ngang (`overflowX = 0` ở cả 7 khung × 2 theme), không chữ bị cắt `…` trong vùng nội dung học.
- [x] Không có thuật ngữ nội bộ (`Mốc M1..M7`, `Level 1 · Training`, `Node`, `FSRS`, `Δ band`).
- [x] Nhân vật Lexi 8 trạng thái sắc nét, `object-contain` tỉ lệ 1/1 không cắt mặt/tai (`SR-46`), không đè chữ; 40 icon màu Fluent 3D và 6 minh hoạ unDraw đồng bộ phong cách.
- [x] Có chuyển động sống (`LiveCard` thở nhẹ) ngoài vùng chữ học khi ở chế độ thường, và về `0` chuyển động khi `--reduced 1`.
- [x] Không có hiệu ứng chuyển động sau/trên vùng chữ học (`J3`); `RecapScreen` trên `/dev/components` đặt `autoCelebrate={false}` nên confetti không bắn đè chữ lúc mở trang.
- [x] Theme sáng đọc rõ, tương phản cao (nền `#F7F8FB`/`#FFFFFF`, chữ `#0F172A`, nút kỹ năng đậm `#5B21B6`/`#155E75`/`#065F46` với chữ trắng `--color-on-accent`).
- [x] Video tương tác `dev-components-390-demo.webm` chứng minh lật thẻ 3D chữ mặt sau đọc xuôi (`SR-45`), bắn hạt +XP, lắc thẻ sai và đổi sang Theme Light.

---

## 5. Danh sách phát hiện cụ thể (0 CHẶN · 0 NẶNG · 5 NHẸ / Góp ý)

### [NHẸ-1] `Pill.tsx:40` & `DevComponentsScreen.tsx:258-263` — Pill `"Đã bấm: 0"` bị ép gãy thành 3 dòng dọc trên khung iPhone `430×932`
- **Bằng chứng:** Xem ảnh `out/rv-t3-a-a/full/430x932-dark-dev_components.png` và `out/rv-t3-a-a/full/430x932-light-dev_components.png` (cuối mục 1, bên phải thẻ `Card tương tác (Tab tới đây rồi bấm Enter hoặc Space · U16)`).
- **Chi tiết:** `src/design/components/Pill.tsx:40` định nghĩa `inline-flex items-center gap-1.5 font-medium rounded-full border` nhưng thiếu `shrink-0 whitespace-nowrap`. Ở khung `430×932`, dòng chữ hướng dẫn bên trái chiếm phần lớn chiều ngang container flex khiến `<Pill tone="info">Đã bấm: 0</Pill>` bị bóp hẹp và ngắt dòng thành 3 hàng dọc (`Đã` / `bấm:` / `0`) trong một khung bo tròn cao.
- **Đề xuất:** Thêm `shrink-0 whitespace-nowrap` vào class mặc định của `Pill` tại `src/design/components/Pill.tsx:40`.

### [NHẸ-2] `ThemeProvider.tsx:60-77` — State React `theme` không đồng bộ khi công cụ kiểm thử đổi thuộc tính `data-theme` trực tiếp trên `<html>`
- **Bằng chứng:** Xem tất cả ảnh chụp theme sáng (`out/rv-t3-a-a/full/390x844-light-dev_components.png`, `375x667-light-dev_components.png`, `430x932-light-dev_components.png`, `820x1180-light-dev_components.png`, `1280x800-light-dev_components.png` và bộ ảnh `docs/audit-max/anh-sau/T3-A/*-light-dev_components.png`). Dù giao diện đã đổi sang bảng màu Light, nút `Theme Dark` trên thanh tiêu đề vẫn đang ở trạng thái kích hoạt (`variant="primary"`, nền xanh đậm) còn nút `Theme Light` ở trạng thái `secondary`.
- **Chi tiết:** `audit-ui.mjs:168` và `e2e/a11y.spec.ts:41` chuyển theme bằng `document.documentElement.setAttribute('data-theme', t)`. `src/app/providers/ThemeProvider.tsx:60-77` chỉ ghi một chiều từ state React `theme` (khởi tạo cứng `'dark'`) ra DOM mà không lắng nghe `MutationObserver` trên `document.documentElement` (`attributeFilter: ['data-theme']`).
- **Đề xuất:** Thêm `MutationObserver` nhẹ trong `ThemeProvider.tsx` để đồng bộ state `theme` khi `data-theme` trên `document.documentElement` được công cụ kiểm thử hoặc mã bên ngoài thay đổi.

### [NHẸ-3] `DevComponentsScreen.tsx:296-328` — Bố cục lưới 2 cột mục 2 làm thẻ `LiveCard` 2D bên trái bị kéo giãn dư ~150px khoảng trống trên iPad & Laptop
- **Bằng chứng:** Xem ảnh `out/rv-t3-a-a/full/820x1180-light-dev_components.png`, `1180x820-light-dev_components.png`, `1280x800-light-dev_components.png`, `1366x768-dark-dev_components.png` (và `docs/audit-max/anh-sau/T3-A/820x1180-dark-dev_components.png`).
- **Chi tiết:** Việc thêm `h-full` vào `LiveCard.tsx:136,216` để các thẻ trong lưới nhiều cột cao bằng nhau là đúng yêu cầu A5. Tuy nhiên tại `src/app/screens/DevComponentsScreen.tsx:296`, container `grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch` đặt cột trái chỉ có 1 `<LiveCard>`, trong khi cột phải (`DevComponentsScreen.tsx:328`) là `<div className="space-y-3">` chứa `<LiveCard>` 3D cộng thêm dãy 4 nút thử FX và hộp `Khung câu hỏi mẫu`. Do đó thẻ `LiveCard` 2D bên trái bị kéo dài bằng tổng chiều cao cả cụm bên phải, tạo khoảng trống lớn dưới đáy thẻ.
- **Đề xuất:** Đặt 2 thẻ `LiveCard` (2D và 3D) ngang hàng nhau trong `grid-cols-1 md:grid-cols-2 gap-6 items-stretch`, và tách dãy 4 nút thử FX + hộp lắc mẫu xuống một khối riêng bên dưới.

### [NHẸ-4] `LiveCard.tsx:113-121` vs `Card.tsx:23-67` — `LiveCard` chưa kiểm tra `hasNestedInteractive()` trước khi gắn `role="button"`
- **Bằng chứng:** Đối chiếu `src/design/components/Card.tsx:23-67` và `src/design/components/LiveCard.tsx:113-121`.
- **Chi tiết:** `Card.tsx` đã có hàm `hasNestedInteractive(children)` để tự động bỏ `role="button"` và `tabIndex={0}` trên thẻ cha nếu bên trong có `<Button>` hoặc phần tử tương tác con (tránh lỗi axe `nested-interactive`). Ngược lại, `LiveCard.tsx:113-121` gắn cứng `role="button"` và `tabIndex={0}` mỗi khi truyền `onClick`. Hiện tại chưa gây lỗi trên `/dev/components`, nhưng nếu T3-C gắn cả `onClick` lẫn `<Button>` con vào `LiveCard` trên Hub/Hôm nay sẽ có nguy cơ vi phạm `nested-interactive`.
- **Đề xuất:** Tách `hasNestedInteractive` thành helper dùng chung cho cả `Card.tsx` và `LiveCard.tsx`.

### [NHẸ-5] `tokens.css:57,83` & `BAO-CAO-T3-A.md:61` — Khai báo trùng biến `--space-section` và mô tả dư bước quay video
- **Bằng chứng:** `src/design/tokens.css:57` & `src/design/tokens.css:83`; `docs/audit-max/BAO-CAO-T3-A.md:61` vs `scripts/assets/record_g2_video.mjs:27-54` & `docs/audit-max/anh-sau/T3-A/dev-components-390-demo.webm`.
- **Chi tiết:**
  1. Trong `:root` của `src/design/tokens.css`, dòng 57 và dòng 83 khai báo lặp lại cùng một biến `--space-section: clamp(12px, 2.4vh, 24px);`.
  2. `BAO-CAO-T3-A.md:61` ghi kịch bản video gồm cả "chuyển trạng thái Lexi, đóng mở Modal/Sheet", nhưng thực tế `record_g2_video.mjs:27-54` và video `dev-components-390-demo.webm` chỉ quay 4 bước ở mục 1–2 (cuộn tới mục 2 → lật thẻ 3D → bắn hạt `+15 XP` & lắc thẻ sai → đổi sang `Theme Light` & lật thẻ lại). Đáng chú ý, tại giây `00:05` của video, sau khi bắn hạt trong trình duyệt headless quay video, bộ đo FPS `SR-47` (`fxTier.ts:81`) đã tự động hạ bậc từ `Hệ FX (full)` xuống `Hệ FX (low)` đúng như thiết kế.

---

## 6. Chấm Rubric 10 tiêu chí (`KIEM-THU.md` §3.1)

> Phán quyết tự động: **0 CHẶN · 0 NẶNG** trên 7 khung × 2 theme → đủ điều kiện chấm Rubric. Không có lỗi NẶNG nên không có điểm trừ `-0.5`.

| # | Tiêu chí | Trọng số | Điểm (1–10) | Điểm có trọng số | Lý do theo mốc mô tả & dẫn chứng cụ thể |
|---|---|---|---|---|---|
| R1 | **Sư phạm** | 15% | **9.0** | 1.350 | Vượt mốc 7, tiệm cận 10: `FeedbackPanel.tsx:15,130-144` bổ sung khe `nextTipVi` ("Lần sau để ý:"), giữ đủ đáp án chuẩn, lý do tiếng Việt, trích dẫn bằng chứng và nút "Báo item sai" ≥ 44px (`FeedbackPanel.tsx:77-91`); `RecapScreen.tsx:33-34,316-348` bỏ hoàn toàn mặc định giả `80%/240s`, hiện danh sách câu sai kèm đối chiếu và nút ôn lại câu sai (`designA5.test.tsx:79-149`). |
| R2 | **Cảm giác game** | 15% | **8.5** | 1.275 | Vượt xa mốc 7: `LiveCard.tsx:125-233` có bóng chiều sâu `.live-card-depth::before` (`tokens.css:255-267`), thở nhẹ lệch pha, nghiêng theo con trỏ, ánh kim bản `mastered`, lật 3D 2 mặt tách biệt (`SR-45`), font hiển thị `Baloo 2` Bold (`bang-asset/illustrations-dark.png`). Trừ 0.5 do ở `out/rv-t3-a-a/full/820x1180-light-dev_components.png` và `1280x800-light-dev_components.png`, thẻ `LiveCard` 2D cột trái bị kéo giãn dư khoảng trống dưới đáy (`[NHẸ-3]`). |
| R3 | **Juice** | 10% | **9.0** | 0.900 | Đa kênh đồng bộ ≤ 100ms: nút `.design-btn`/`.design-choice` nén `scale(0.96)/80ms` (`tokens.css:238-245`), canvas hạt 8 texture Kenney (`fxCanvas.ts:107-191`), số bay `+15 XP` (`numberPop.ts:35-82`), lắc thẻ sai `±6px/300ms` không rung màn hình (`screenPunch.ts:21-75`), đếm XP kiểu Balatro kèm tick tăng cao độ (`RecapScreen.tsx:92-129`), `computeComboRate` +1 bán cung/bậc và hàng đợi FIFO ≤ 2 giọng (`sfx.ts:87-98,273-283`), xác nhận trên `dev-components-390-demo.webm` (00:03–00:05). |
| R4 | **Mật độ & chất lượng hình + nhân vật** | 10% | **9.0** | 0.900 | Bộ asset thật đồng bộ: 8 trạng thái mèo Lexi Fluent Emoji 3D (MIT) nền trong suốt `1/1 object-contain` (`bang-asset/lexi-dark.png`, `Mascot.tsx:156-166`), 12 icon game + 12 huy hiệu + 16 icon UI (`bang-asset/games-light.png`, `bang-asset/badges-ui-dark.png`), 6 minh hoạ unDraw SVG (`bang-asset/illustrations-dark.png`), 153/153 file khớp SHA-256 trong `assets_credits.mjs`. |
| R5 | **Thứ bậc & bố cục** | 10% | **8.5** | 0.850 | 0px tràn ngang (`D5=0`), 0 vùng chạm < 44px (`D3=0`), 0 thuật ngữ nội bộ (`D7=0`) trên toàn bộ 14 lượt `audit-ui.mjs` (`out/rv-t3-a-a/full/BAO-CAO.md`). Trừ 0.5 do trên `out/rv-t3-a-a/full/430x932-dark-dev_components.png` và `430x932-light-dev_components.png`, pill `"Đã bấm: 0"` (`Pill.tsx:40`) thiếu `shrink-0 whitespace-nowrap` nên bị ép gãy thành 3 dòng dọc (`[NHẸ-1]`). |
| R6 | **Đọc & truy cập** | 10% | **9.0** | 0.900 | Đạt chuẩn mốc 10 ở hệ thiết kế: `contrast.mjs` 144/144 cặp đạt AA trên 3 theme (`dark/light/exam`), `KeyHint.tsx:11` & `Highlighter.tsx:553` ≥ 12px (`D4=0`), `Card.tsx:23-85` hỗ trợ `Enter/Space` (`U16`) + `hasNestedInteractive`, `Modal.tsx`/`Sheet.tsx`/`focusTrap.ts` bẫy focus + `Escape` `preventDefault()`, `e2e/a11y.spec.ts` (12/12) & `e2e/motion.spec.ts` (5/5) xanh, `out/rv-t3-a-a/reduced/BAO-CAO.md` 0 chuyển động. |
| R7 | **Độ khó thích ứng** | 10% | **8.5** | 0.850 | Trong phạm vi nền tảng thiết kế/FX: `BandMeter` hiển thị rõ band hiện tại, mục tiêu, độ tự tin và xu hướng (`DevComponentsScreen.tsx:480-496`); `fxTier.ts:66-102` tự động thích ứng bậc hiệu ứng (`full` → `medium` → `low`) theo FPS thực đo và phần cứng (`SR-47`), bảo toàn phản hồi học `E0` (`fxA3A4.test.tsx:67-100`). |
| R8 | **Thưởng & tiến bộ** | 5% | **9.0** | 0.450 | `RecapScreen.tsx:222-243` hiển thị công thức thưởng kiểu Balatro (`Đúng {n} câu × Thưởng chuỗi ×{m} = +{xp} XP`), bỏ số giả mặc định, tự bắn confetti khi chính xác ≥ 80% và tắt hoàn toàn XP/combo/confetti/Lexi ở Exam (`designA5.test.tsx:94-149`); 12 huy hiệu Fluent 3D và thẻ `mastered` ánh kim đã sẵn sàng. |
| R9 | **Vòng lặp hằng ngày** | 10% | **9.0** | 0.900 | `RecapScreen.tsx:42-43,140-165,361-388` đóng dứt điểm lỗi đứt vòng lặp ở Recap: nhận `nextTask` + `onNextTask`, hiển thị nút chính `"Tiếp: {nextTask.title}"` kèm phím tắt `Enter` (bấm lần 1 tua nhanh đếm XP, bấm lần 2 vào thẳng bài kế tiếp hoặc về Hôm nay, kiểm chứng tại `designA5.test.tsx:112-135`). |
| R10 | **Nhất quán & độ tin cậy** | 5% | **8.5** | 0.425 | 21 component giữ nguyên 100% tương thích ngược (`SR-90`), `AudioProvider.tsx:26-119` lưu bền âm lượng và tương thích thang cũ `0..1` (`A9`), `tokens.css:2-4` giảm CSS chính còn `67.77 KB` và precache còn `1311.73 KiB`, 0 rò chuỗi dev vào prod (`size-budget.mjs`). Trừ 0.5 do `ThemeProvider.tsx:60-77` chưa đồng bộ ngược khi `data-theme` đổi từ DOM (`[NHẸ-2]`) và `LiveCard.tsx:113-121` chưa dùng `hasNestedInteractive` (`[NHẸ-4]`). |
| — | **TỔNG CỘNG** | **100%** | — | **8.80 / 10** | **Thấp nhất: 8.5 / 10 (≥ 7.0) · Tổng: 8.80 / 10 (≥ 8.5) → ĐẠT CỔNG G2** |

---

## 7. Kết luận nghiệm thu Cổng G2 (`T3-A`)

- **Phán quyết cuối cùng:** **ĐẠT**
- **Điều kiện qua cổng:** 0 lỗi CHẶN (yêu cầu = 0), 0 lỗi NẶNG (yêu cầu ≤ 2), Tổng điểm Rubric có trọng số **8.80 / 10** (yêu cầu ≥ 8.5), tiêu chí thấp nhất **8.5 / 10** (yêu cầu ≥ 7.0).
- 5 điểm `[NHẸ-1..5]` ở Mục 5 là góp ý hoàn thiện nhỏ, không chặn mở khoá Cổng G2 cho `T3-C` và Đợt 4.
