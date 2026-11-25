# KẾ HOẠCH T3-A · Hệ thiết kế, Asset & Nền tảng FX

## 1. Token & Theme (`src/design/tokens.css`, `src/design/motion.ts`)
- Hoàn thiện 3 theme (`dark`, `light`, `exam`) đạt WCAG AA (`scripts/qa/contrast.mjs` = 0 lỗi): vá `--color-text-faint`, `--color-border`, màu nhấn theme sáng/exam; thêm `--color-on-accent`, `--color-border-strong`, `--color-boss-dim`, `--color-backdrop`.
- Thêm thang chữ `--text-display/h1/h2/question/reading/body/caption` (input ≥ 16 px chống zoom iOS), lưới 4 px (`--space-*`), bo góc (`8/14/22/999`), bóng 3 mức, z-index (`0/10/20/30/40/50`), font `--font-display` (`Baloo 2` + fallback), token motion `dur/spring/ease` (`13-ANIMATION.md` §2).
- Bỏ toàn bộ màu cứng trong `src/design/**` (`D1`; giữ danh sách hex game ghi `HANDOFF.md` cho Đợt 4).

## 2. Nhóm Asset thật (`public/assets/**`, `scripts/assets/**`, `CREDITS.md`) — Cổng G1
- **Nhân vật Lexi (K10/L-1):** 8 trạng thái (`idle, chao, co-vu, vui, an-mung, dong-vien, suy-nghi, ngu`) tải từ Fluent Emoji mèo (MIT, nền trong suốt, WebP ≤ 60 KB/file tĩnh; không tự vẽ/AI sinh).
- **Icon màu (K9/D11):** 12 icon game khác nhau + 24 icon nhiệm vụ/huy hiệu/trạng thái từ Fluent Emoji 3D (MIT, WebP 96/192 px, ≤ 20 KB/file); giữ nguyên 24 SVG cũ (`SR-06`, `assets_credits.mjs`).
- **Minh họa SVG (D13):** thay 6 SVG vẽ tay (`welcome, goals, devices, placement, empty-cards, offline`) bằng SVG mở đã kiểm nguồn/license (SVGO ≤ 30 KB, giữ `#3B82F6` theo validator).
- **Hạt & Font & SFX:** 8 texture hạt Kenney Particle Pack (CC0, PNG ≤ 64 px); font `Baloo 2` (OFL, woff2 `latin`+`vietnamese`); giữ/nâng cấp SFX sprite tương thích 100% 12 cue chuẩn + alias (`≤ 250 KB`).
- Cập nhật `CREDITS.md` + `assets.manifest.json` đủ 10 trường + `ti_le_khung, object_fit, diem_nhan`; sửa D13 & `url_tai` `soul_knight` (X20). Xuất contact sheet `docs/audit-max/bang-asset/<nhom>-{dark,light}.png` duyệt G1.

## 3. Thành phần Design & Chặn nợ HANDOFF
- **Chặng 1 (A1):** `KeyHint` ≥ 12 px (`text-xs`, đóng D4); `AnswerInput` + `FeedbackPanel` kiểm chip ≥ 12 px và `--color-border-strong`; `Modal` & `Sheet` thêm `e.preventDefault()` khi đóng bằng Esc, `useId()`, focus trap, trả focus (`U15`), dùng `var(--color-backdrop)` thay `bg-black/60`; `Button` dùng `--color-on-accent` (tương thích `contrast.mjs`).
- **Chặng 2 (A3–A6, sau G1):** `src/design/fx/**` (`useFxTier`, `fxCanvas`, `emit`, `numberPop`, `screenPunch`, `celebrate`, `haptic`, `useMotionPref`), `Mascot` + `src/content/mascotLines.ts`, `LiveCard`, `RecapScreen` (`nextTask`/`onNextTask`), `Button`/`ChoiceButton`/`Card` states (`U14`, `U16`), `sfx.ts` hàng đợi ≤ 2 tiếng & biến thiên `rate`, `AudioProvider` lưu cấu hình.

## 4. Chức năng cũ bắt buộc giữ (`SR-80`, `SR-90`)
- Giữ 100% export và props cũ của 21 component trong `src/design/components/` (`Button`, `Card`, `Pill`/`Badge`, `ProgressRing`, `BandMeter`, `Timer`, `Modal`, `Sheet`, `Toast`, `AnswerInput`, `ChoiceButton`, `KeyHint`, `AudioButton`, `FeedbackPanel`, `RecapScreen`, `EmptyState`, `Skeleton`, `Highlighter`, `QuestionNav`, `TrackPlayer`, `Waveform`, `MapView`).
- Nút/tương tác giữ nguyên: `Button` (primary/secondary/ghost/danger, loading, hotkey, icons), `Modal`/`Sheet` (nút đóng ✕, bấm nền đóng, Esc đóng, footer), `FeedbackPanel` (nút "Báo item sai", đáp án chuẩn, giải thích, trích dẫn, nút "Tiếp" phím Enter), `AnswerInput` (đếm từ, Enter nộp, trạng thái idle/correct/wrong/partial), `ChoiceButton` (5 trạng thái, icon ✓/✕).
- Providers & Audio giữ nguyên: `ThemeProvider` (`dark`/`light`/`exam`, `targetBands`, `dailyGoalMin`), `AudioProvider` (`sfxVolume`, `muted`, `toggleMute`, `playSfx`, `lastPlayedCue`), `sfx.ts` (12 cue chuẩn + 8 alias, tắt khi exam trừ `timeup`/`countdownEnd`, `unlock`/`resumeAudioContext` iOS).
- Asset cũ giữ nguyên (`SR-06`): `public/assets/soul_knight/**`, `public/assets/ui/**`, `public/assets/icons/{games,badges}/*.svg`, `public/pwa-*.png`, `public/maskable-512.png`.

## 5. Cổng kiểm chứng Chặng 1
- `node scripts/qa/contrast.mjs` (0 lỗi ở 3 theme), `node scripts/qa/hardcoded-colors.mjs` (0 lỗi trong `src/design/**`), `npx tsc --noEmit -p .`, `npx vitest run src/design`.
- `node scripts/validate/assets_credits.mjs` (exit 0), kiểm mắt contact sheet `bang-asset/*.png`, `npx vite build && node scripts/qa/size-budget.mjs` (precache ≤ 1 500 KiB, `public/assets` non-audio ≤ 2 048 KiB).
