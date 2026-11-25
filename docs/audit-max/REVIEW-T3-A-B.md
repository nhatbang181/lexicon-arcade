# REVIEW T3-A · Reviewer B Độc Lập (Cổng G2)

- **Reviewer B:** `rv-t3-a-b` (`Gemini 4 Hydrogen High`, độc lập với builder `Gemini 4 Neon High` và không đọc `REVIEW-T3-A-A.md`)
- **Worktree / Nhánh:** `D:\English-wt\T3-A` · `audit-max/T3-A` (HEAD `85b758e`)
- **Phạm vi kiểm:** `src/design/**`, `src/content/mascotLines.ts`, `src/core/audio/sfx.ts`, `src/app/providers/{ThemeProvider,AudioProvider}.tsx`, `src/app/screens/DevComponentsScreen.tsx`, `public/assets/**`, `scripts/assets/**`, `docs/audit-max/{BAO-CAO-T3-A.md,anh-sau/T3-A/**,bang-asset/**}`
- **Phán quyết:** **ĐẠT** (0 CHẶN · 1 NẶNG ≤ 2/màn · tổng có trọng số **8,88 / 10** ≥ 8,5 · tiêu chí thấp nhất **8,5 / 10** ≥ 7,0)

---

## 1. Kiểm chống gian lận & phạm vi (`SR-01`, `SR-11`, `SR-12`, `SR-13`)

- `git -C D:\English-wt\T3-A diff --stat master...HEAD -- docs/audit-max/cong-cu docs/audit-max/LUAT.md docs/audit-max/KIEM-THU.md scripts/qa scripts/validate`: **rỗng (0 file sửa)**. Kiểm tra tương tự từ `2d10b05..HEAD` (gộp trước của Đợt 3): **rỗng (0 file sửa)**.
- `git -C D:\English-wt\T3-A diff --name-only master...HEAD`: 23 file trong phạm vi `T3-A` (A5–A6) và báo cáo/bằng chứng `docs/audit-max/**`; không chạm `src/legacy/**`, `src/games/s1-*`, `src/games/s2-*`, `public/audio/speaking/**`.
- Chỉ thị `@source not "../legacy"`, `@source not "../../docs"`, `@source not "../../scripts"` trong `src/design/tokens.css:2-4`: `src/app/screens/LegacyScreen.tsx` tải `legacyEntry.ts` có `import '../../legacy/index.css'` (`@import "tailwindcss";`) riêng biệt (`dist/assets/legacyEntry-B5YLHULs.css` = 109,69 kB), nên không ảnh hưởng giao diện `legacy` hay bất kỳ màn V3 sản phẩm nào.
- Tuyến `/dev/components` được bọc `import.meta.env.DEV` tại `src/app/routes.tsx:37-41, 77`, không lọt vào bundle production.

---

## 2. Kết quả tự chạy lại cổng kỹ thuật & `audit-ui`

| Hạng mục kiểm | Lệnh tự chạy | Kết quả thực đo |
|---|---|---|
| TypeScript | `npx tsc --noEmit -p .` | **0 lỗi** (exit 0) |
| Unit test Vitest | `npm test` | **55 file · 602/602 test xanh** (15,00 s, exit 0) |
| Tương phản WCAG AA | `node scripts/qa/contrast.mjs` | **144/144 cặp, 0 dưới ngưỡng** (dark 48/0, light 48/0, exam 48/0) |
| Asset & CREDITS (`SR-60`) | `node scripts/validate/assets_credits.mjs` | **153/153 asset (100%)**, non-audio **377,48 KB / 2 048 KB**, SFX **54,24 KB / 250 KB** (exit 0) |
| Màu cứng (`D1`) | `node scripts/qa/hardcoded-colors.mjs` | **0 chỗ** trong phạm vi `T3-A` (`src/design/**`, `src/content/**`, `DevComponentsScreen.tsx`); 7 chỗ ngoài phạm vi tại `PortfolioScreen.tsx:539` & `W1EssayLab.tsx:1177..1275` |
| E2E A11y & Motion (`PW_PORT=5257`) | `PW_PORT=5257 PW_CHANNEL=chrome npx playwright test e2e/a11y.spec.ts e2e/motion.spec.ts --project=chromium` | **17/17 test xanh** (`a11y.spec.ts` 12/12 + `motion.spec.ts` 5/5, 1.3m) |
| Build prod & ngân sách (`SR-49`, `SR-73`) | `npx vite build && node scripts/qa/size-budget.mjs` | JS `#/` gzip **150,37 KB / 250 KB** · CSS chính **67,77 KB / 130 KB** · chunk lazy lớn nhất `motion-CptA27__.js` **50,6 KB / 120 KB** · Precache PWA **1 311,73 KiB / 1 500 KiB** (130 file) · **0 rò** `"Thư viện component"` / `"TASK2_CLAUDE_RESPONSE"` |
| `audit-ui` `/dev/components` (7 khung × 2 theme) | `BASE_URL=http://127.0.0.1:5247 node docs/audit-max/cong-cu/audit-ui.mjs --route dev/components --vp 390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768 --theme dark,light --out out/rv-t3-a-b/full` | **14/14 lượt: 0 CHẶN · 0 NẶNG · 0 NHẸ** (`overflowX: 0`, `smallTargets: 0`, `tinyText: 0`, `jargon: 0`) |
| `audit-ui` reduced-motion (`J8`) | `... --vp 390x844 --theme dark,light --reduced 1 --out out/rv-t3-a-b/reduced` | **2/2 lượt: 0 CHẶN · 0 NẶNG · 0 NHẸ** (`anims: 0`, `infiniteAnims: 0`) |

---

## 3. Kiểm tra code & bằng chứng trực quan (ảnh + video)

### 3.1 Ảnh & video đã mở kiểm bằng mắt
- Ảnh tự chụp (`out/rv-t3-a-b/full/`): `390x844-dark`, `390x844-light`, `375x667-dark`, `375x667-light`, `430x932-dark`, `430x932-light`, `820x1180-dark`, `1180x820-light`, `1280x800-dark`, `1366x768-light`.
- Ảnh nộp & contact sheet (`docs/audit-max/`): `anh-sau/T3-A/{390x844-dark,390x844-light,375x667-dark,375x667-light,820x1180-dark,1280x800-light}-dev_components.png`, `bang-asset/{lexi-dark,games-light,badges-ui-dark,illustrations-dark,illustrations-light,fx-dark}.png`.
- Video tương tác (`docs/audit-max/anh-sau/T3-A/dev-components-390-demo.webm`, `390×844`): xác nhận chuyển 3D front→back không ngược chữ (`00:04`), bắn hạt + số bay `+15 XP` (`00:05`), tự hạ bậc `Hệ FX (full)` → `Hệ FX (low)` khi FPS rớt trong headless Chromium (`00:04→00:05`, đúng `SR-47`), chuyển theme Light và lật lại (`00:06–00:07`).

### 3.2 Các điểm đạt luật cứng T3-A
- `LiveCard.tsx:125-196` & `tokens.css:255-267`: bỏ `<div>` bóng sibling M5, thay bằng `.live-card-depth::before` dùng biến `--lc-sx`/`--lc-sy`; `h-full` gắn trên vỏ ngoài, `<motion.div className="h-full">` và 2 mặt thẻ; mặt sau xoay sẵn `rotateY(180deg)` + `backfaceVisibility: 'hidden'` trên 2 mặt riêng (`preserve-3d` không có `overflow`/`opacity`/`filter`, đúng `SR-45`); hạ về crossfade 120 ms khi reduced-motion/Exam (`LiveCard.tsx:197-213`).
- `Card.tsx:23-95`: hỗ trợ `Enter`/`Space` (`U16`) và có `hasNestedInteractive()` tránh lỗi axe `nested-interactive`.
- `Button.tsx:46-50, 93` & `tokens.css:238-252`: mọi kích thước giữ `min-h-[44px]`, lớp `.design-btn` chỉ bật hover trong `@media (hover: hover)` (`U14`), active `scale(0.96)` trong `80 ms`.
- `KeyHint.tsx:11`: `text-xs` (12 px, đóng `D4`).
- `Modal.tsx:30`, `Sheet.tsx:30`, `focusTrap.ts:57-102`: `useId()`, bẫy `Tab`/`Shift+Tab`, `Escape` gọi `e.preventDefault()`, trả focus về phần tử mở.
- `RecapScreen.tsx:33-38, 92-129, 172, 290-297, 361-378`: bỏ mặc định giả `80%/240s`, đếm XP kiểu Balatro kèm nút `"Tua nhanh"`, có `data-mascot-ok="true"`, ẩn `<Mascot>` và XP khi `examMode`, hỗ trợ `nextTask` + `onNextTask` + `Enter`.
- `FeedbackPanel.tsx:130-144`: có khe `nextTipVi` (`"Lần sau để ý:"`).
- `sfx.ts:87, 94-98, 274-296`: hàng đợi FIFO tối đa 2 giọng đồng thời (`MAX_CONCURRENT_VOICES = 2`, `J7`), `computeComboRate` tăng +1 bán cung tới +12 rồi quay về `1.0×`, jitter ±4% cho `tap`/`flip`/`page`.

---

## 4. Danh sách phát hiện cụ thể (1 NẶNG · 5 NHẸ)

1. **[NẶNG · `D10`] Thanh trượt âm lượng SFX trong `DevComponentsScreen` là control gốc trình duyệt chưa bọc `appearance-none`:**
   - **Vị trí:** `src/app/screens/DevComponentsScreen.tsx:639-648` (`<input id="dev-sfx-vol" type="range" ... className="w-28 min-h-[44px]" />`), đồng thời `src/design/tokens.css` không đặt rule mặc định cho `input[type="range"]`.
   - **Vì sao công cụ chưa bắt:** `#dev-sfx-vol` nằm ở mục 8 (dưới nếp gấp), còn `docs/audit-max/cong-cu/audit-ui.mjs:72` chỉ kiểm tra `inView(r)`. Trong khi đó, `src/design/components/TrackPlayer.tsx:190, 260` đã bọc đầy đủ `appearance-none bg-transparent [&::-webkit-slider-runnable-track]... [&::-webkit-slider-thumb]...`.
   - **Hướng sửa:** Bọc `appearance-none` + track/thumb dùng token cho `#dev-sfx-vol` giống `TrackPlayer.tsx`.

2. **[NHẸ · UI/Responsive] `Pill` thiếu `whitespace-nowrap shrink-0` nên bị bóp thành khối tròn 3 dòng ở khung `430×932`:**
   - **Bằng chứng:** `out/rv-t3-a-b/full/430x932-dark-dev_components.png` và `out/rv-t3-a-b/full/430x932-light-dev_components.png` (góc phải `Card tương tác (Tab tới đây rồi bấm Enter hoặc Space · U16)`).
   - **Vị trí:** `src/design/components/Pill.tsx:39-40` và `src/app/screens/DevComponentsScreen.tsx:262` (`<Pill tone="info">Đã bấm: {cardKeyClicks}</Pill>`). Khi đặt cùng dòng với chuỗi mô tả dài trong `flex items-center justify-between`, `Pill` bị co ngang và ngắt `"Đã / bấm: / 0"` làm mất dáng `rounded-full`.
   - **Hướng sửa:** Thêm `whitespace-nowrap shrink-0` cho `Pill` (hoặc đặt `shrink-0` trên badge đếm).

3. **[NHẸ · `A9` / `AudioProvider`] Tắt âm rồi tải lại trang làm mất giá trị `sfxVolume` cũ khi bật âm lại:**
   - **Vị trí:** `src/app/providers/AudioProvider.tsx:71-85, 95-97, 133`.
   - **Cơ chế:** Khi `toggleMute()` chuyển sang `muted = true`, `persistVolume(vol, true)` ghi `profileRepo.update({ sfxVolume: 0 })` vào IndexedDB trong khi `localStorage` giữ `vol` cũ (vd `60` hoặc `80`). Khi tải lại app, `useEffect` đọc `profile.sfxVolume === 0` từ IndexedDB và gọi `setSfxVolumeState(0)` ghi đè mất mức âm đã lưu; sau đó bấm `"Bật âm"` (`muted = false`) vẫn bị chặn ở `playSfx` dòng 133 (`if (muted || sfxVolume <= 0) return;`).
   - **Hướng sửa:** Tách cờ `muted` khỏi `sfxVolume` hoặc không ghi đè `sfxVolumeState` bằng `0` khi `localStorage` đang giữ âm lượng hợp lệ > 0 cùng cờ `sfxMuted=true`.

4. **[NHẸ · `U16` / `Card`] `hasNestedInteractive()` trong `Card.tsx` chưa bắt các component con tự bọc nút/link:**
   - **Vị trí:** `src/design/components/Card.tsx:23-42`.
   - **Chi tiết:** Hàm chỉ nhận diện thẻ HTML gốc (`button`, `a`, ...), `type === Button`, `props.role === 'button' | 'link'` hoặc `typeof props.onClick === 'function'`. Nếu đặt `<AudioButton>` (dùng `onToggle`), `<Link>` của `wouter`, hoặc `<Mascot interactive>` bên trong `<Card interactive>`, `hasNestedInteractive()` vẫn trả `false` và gắn `role="button"` cho thẻ cha.

5. **[NHẸ · Asset & Contact sheet] Sai lệch phụ đề trên `fx-dark.png` và độ nổi nét tối ở `illustrations-dark.png`:**
   - **Bằng chứng:** `docs/audit-max/bang-asset/fx-dark.png` ghi phụ đề `64×64 compact PNG · trái: gốc trắng trên nền tối, phải: áp màu theo theme`, nhưng file thật trong `public/assets/fx/*.png` (`CREDITS.md:10-17`, `BAO-CAO-T3-A.md:34`) là `48×48` và cả hai ô xem trước đều là màu trắng. Ở `docs/audit-max/bang-asset/illustrations-dark.png`, một số nét `#2f2e41` trong `empty-cards.svg` và `offline.svg` hơi chìm trên nền `#121829`; mép dưới nhân vật trong `placement.svg` bị cắt chéo hơi gắt.

6. **[NHẸ · `DevComponentsScreen`] Nút `Theme Dark` trên `/dev/components` không đồng bộ khi công cụ ngoài đổi `data-theme`:**
   - **Bằng chứng:** `out/rv-t3-a-b/full/390x844-light-dev_components.png` và `1366x768-light-dev_components.png` đều thấy nút `Theme Dark` vẫn giữ màu primary do chỉ đọc state React `theme` (`src/app/screens/DevComponentsScreen.tsx:180-200`), còn `audit-ui.mjs` đổi thuộc tính `data-theme` trực tiếp trên `<html>`.

---

## 5. Chấm Rubric 10 tiêu chí (`KIEM-THU.md` §3)

> Lưu ý: T3-A là gói nền tảng Design System + Asset + FX + `/dev/components`, nên các tiêu chí sư phạm/thích ứng/vòng lặp được chấm theo mức độ hạ tầng UI & component mà T3-A bàn giao.

| Mã | Tiêu chí | Trọng số | Điểm | Lý do & dẫn chứng (mốc 4/7/10) |
|---|---|---:|---:|---|
| R1 | Sư phạm | 15% | **9,0** | `FeedbackPanel.tsx:130-144` có khe `nextTipVi`, `RecapScreen.tsx:33-34, 195, 290` bỏ số giả & ẩn XP/Lexi khi Exam, `mascotLines.ts` ≤ 12 từ không thuật ngữ nội bộ; chỉ là lớp hạ tầng nên chưa chấm trực tiếp trên game thật. |
| R2 | Cảm giác game | 15% | **9,0** | `LiveCard` 2D thở/nghiêng không div rỗng M5 (`LiveCard.tsx:125-149`), lật 3D 2 mặt tách biệt (`dev-components-390-demo.webm` `00:04`), font `Baloo 2` (`illustrations-light.png`), Balatro XP tally; trừ nhẹ lỗi `Pill` bị co 3 dòng ở `430x932-light-dev_components.png`. |
| R3 | Juice | 10% | **9,0** | `fxCanvas.ts` + 8 texture Kenney CC0, `screenPunch` ±6px (`L-7`), `fxTier.ts` tự hạ bậc khi tụt FPS (chứng kiến ở `dev-components-390-demo.webm` `00:04→00:05`), `sfx.ts:87, 94-98` FIFO ≤ 2 giọng + combo pitch; trừ nhẹ lỗi reload giữ `sfxVolume=0` khi muted (`AudioProvider.tsx:72-84`). |
| R4 | Mật độ & chất lượng hình + nhân vật | 10% | **8,5** | 153/153 asset có nguồn (`assets_credits.mjs`), Lexi 8 trạng thái 1/1 `object-contain` (`lexi-dark.png`), 40 icon Fluent 3D (`games-light.png`, `badges-ui-dark.png`), 6 SVG unDraw (`illustrations-light.png`); trừ nhẹ mép dưới `placement.svg`, nét tối trên `illustrations-dark.png` và phụ đề `64×64` trên `fx-dark.png`. |
| R5 | Thứ bậc & bố cục | 10% | **9,0** | 0 tràn ngang, 0 vùng chạm < 44px, 0 chữ < 12px trên 14 lượt `audit-ui` (`390x844`, `375x667`, `430x932`, `820x1180`, `1180x820`, `1280x800`, `1366x768`), lưới `LiveCard` `h-full` đều (`820x1180-dark-dev_components.png`); trừ nhẹ `Pill` co ở `430x932` và trạng thái nút `Theme Dark` ở `390x844-light-dev_components.png`. |
| R6 | Đọc & truy cập | 10% | **8,5** | Nền `9,0` (`contrast.mjs` 144/144 ở 3 theme, `a11y.spec.ts` 12/12, `motion.spec.ts` 5/5 + `audit-ui --reduced 1` 0 anims, `Modal`/`Sheet` focus trap + Esc `preventDefault()`, `KeyHint` 12px) **− 0,5** cho 1 lỗi **NẶNG `D10`** (`#dev-sfx-vol` ở `DevComponentsScreen.tsx:641` chưa bọc `appearance-none`). |
| R7 | Độ khó thích ứng | 10% | **8,5** | Không thuộc phạm vi viết engine thích ứng; cung cấp `BandMeter` (`currentBand`/`targetBand`/`trend`), `ProgressRing`, `Timer` (`DevComponentsScreen.tsx:470-496`) đạt AA và không lộ thuật ngữ nội bộ. |
| R8 | Thưởng & tiến bộ | 5% | **9,0** | `RecapScreen.tsx:195-243` hiển thị XP thật, phân tách `correctCount` × `comboMultiplier`, `autoCelebrate` đúng mốc ≥ 80%, 12 icon huy hiệu Fluent 3D (`badges-ui-dark.png`). |
| R9 | Vòng lặp hằng ngày | 10% | **9,0** | `RecapScreen.tsx:140-165, 361-378` đóng `HANDOFF` T1-B #4 với `nextTask` + `onNextTask` + phím `Enter` (`"Tiếp: {title}"`), giữ nút phụ `"Về Hôm nay"`, bỏ số liệu giả mặc định `80%/240s`. |
| R10 | Nhất quán & độ tin cậy | 5% | **9,5** | `tsc` 0 lỗi, `602/602` Vitest, `17/17` Playwright, `0` màu cứng trong phạm vi `T3-A`, `size-budget` đạt 5/5 ngưỡng và `0` rò dev/test vào `dist/`, `@source not` giữ nguyên `legacyEntry-*.css`. |

**Tổng điểm có trọng số:**
`9,0×0,15 + 9,0×0,15 + 9,0×0,10 + 8,5×0,10 + 9,0×0,10 + 8,5×0,10 + 8,5×0,10 + 9,0×0,05 + 9,0×0,10 + 9,5×0,05` = **`8,88 / 10`** (thấp nhất: **R4, R6, R7 = 8,5**).
