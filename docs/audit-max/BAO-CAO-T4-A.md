# BÁO CÁO · T4-A Chặng 1 (Cổng G3: V1 Daily Run + Recap V1)

- **Nhánh / worktree:** `audit-max/T4-A` (`D:\English-wt\T4-A`, nền `master` `2d41fe3`).
- **Phạm vi thực hiện (chỉ Chặng 1 G3):** `src/games/v1-daily-run/{V1DailyRun.tsx,V1JuiceBits.tsx,RunMap.tsx,engine.ts,extras.ts,engine.test.ts,srsContent.test.ts,extras.test.ts}`, `e2e/juice.spec.ts`, `docs/audit-max/{KE-HOACH-T4-A.md,BAO-CAO-T4-A.md,HANDOFF.md,anh-sau/T4-A/**}`. Không sửa bất kỳ file nào ngoài danh sách được cấp (`SR-01`, `SR-05`).

## 1. Số đo Trước → Sau

| Chỉ số | Trước (nền `2d41fe3`) | Sau (T4-A Chặng 1) | Ghi chú |
|---|---|---|---|
| `v1-node` top ở `390×844` (`B5` / `SR-42`) | `356 px` | **`78 px`** (ngưỡng ≤ 80 px) | HUD mobile rút gọn còn `20 px` (`h-5`) |
| Đáp án 2 `bottom` ở `390×844` / `375×667` | > 600 px | **`341 px`** (≤ 844 / ≤ 667 px) | Cả 4 đáp án nằm trong màn đầu ở cả `390×844` & `375×667` |
| Tràn ngang (`D5`) ở mọi khung đo | 4–8 px (lúc có) | **`0 px`** | `RunMap` chuyển sang lưới `flex-wrap`, bỏ `overflow-x-auto` |
| `audit-ui.mjs` `/play/v1` (7 khung × 2 theme = 14 lượt) | 3 NẶNG/khung | **`0 CHẶN · 0 NẶNG · 0 NHẸ`** | `docs/audit-max/anh-sau/T4-A/report.json` |
| Nguồn tải từ vựng ban đầu (`D17`) | `words.json` (`4 478,3 KB`) | **`words.core.json` (`521,1 KB`)** + nạp lười `words.detail.json` theo `itemIds` phiên | Fallback tự động sang `words.json` nếu thiếu `words.core.json` |
| Số màu cứng trong `src/games/v1-daily-run/**` | 0 | **`0`** | `node scripts/qa/hardcoded-colors.mjs` (0 file trong V1) |
| Ngân sách build (`scripts/qa/size-budget.mjs`) | 0 vượt, 0 rò | **JS #/ 214,87 KB gzip (≤ 250) · CSS 70,26 KB (≤ 130) · V1 chunk 38,45 KB gzip (≤ 120) · Precache 1 353,74 KiB (≤ 1 500) · 0 rò** | `npx vite build && node scripts/qa/size-budget.mjs` |
| Unit tests (`npm test`) | 67 test V1 | **57/57 file · 615/615 test xanh** (71 test trong `v1-daily-run`) | Thêm unit test cho Run Fork, Luật Boss, XP trần ×2, `words.core.json` + `words.detail.json` |
| `e2e/juice.spec.ts` (V1) | 9 `test.fixme` | **7/7 test V1 xanh** (3 dòng ngoài V1 giữ `fixme`) | Đúng ≥ 3 kênh, sai ≥ 3 kênh + 0 hạt, combo x3 ≥ 3 kênh, lật 3D WebKit-safe, Recap Balatro + chuyển câu ≤ 1,2 s, HUD `390×844`/`375×667`, 30 s CPU ×4 preview |
| `e2e/a11y.spec.ts` & `e2e/motion.spec.ts` | Xanh | **12/12 a11y xanh · 5/5 motion xanh** | 0 nợ axe mới, 0 animation lặp / transform ở reduced-motion |
| `e2e/perf.spec.ts` (V1 INP CPU ×4 Fast 4G) | — | **V1 INP PASS · Hub INP PASS** | Đã tách layout-read, SFX và ripple sang sau frame paint đầu |

## 2. Chức năng đã bảo toàn & nâng cấp (`SR-90`)
- **Bảo toàn 100% chức năng V1 cũ:** van tải thẻ mới 15/ngày (PP-C4), vòng phục hồi ≤ 50 thẻ, kiểm MP3 thật `listen_spell` + hoàn lượt khi lỗi phát, `saveProgress` + `registerProgressSaver` + `pagehide`, đủ 13 mặt thẻ, phím `1..4` / `H` / `Enter`, `data-testid="v1-node"`, `data-item-id`, văn bản `Lượt chạy hôm nay: N thẻ`, nút `Bắt đầu`, màn rỗng + `15 từ khởi động`.
- **HUD Mobile & Desktop (`U1`, `B5`, `03 §4`):**
  - `< 768 px`: thanh HUD mảnh `20 px` gồm thanh tiến độ `8 px` có vệt sáng chạy qua (`transform`), bộ đếm thẻ, chip `Band ≈ X.X`, combo, XP; ẩn `RunMap` trên màn câu hỏi; nút hành động chính dính đáy `min-h-[52px]`.
  - `≥ 1024 px`: thẻ câu hỏi căn giữa `max-w-[720px]` + `RunMap` thu gọn cột phải `280 px`; chú giải 5 màu chuyển vào nút tooltip `?` (`min-w-[44px] min-h-[44px]`).
- **Juice V1 mức High (`13-ANIMATION`, `03 §3`, `useFxTier`, tắt khi `exam`):**
  - Tap: `scale .97` 80 ms + ripple WAAPI + `playSfx('tap')` + `haptic('tap')`.
  - Đúng: hit-stop 55 ms (bậc `full`) → pop thẻ + SVG ✓ vẽ nét `pathLength` + `playSfx('correct', { rate: computeComboRate(combo) })` + `emit('spark', 14)` + `numberPop` bay về chip XP + `haptic('correct')` + tự chuyển câu `900 ms`.
  - Sai: `screenPunch` `wrong-card` ±6 px/300 ms chỉ trên thẻ + viền `--color-wrong` + tối nhẹ `brightness(.85)` 150 ms + sau 200 ms viền nét đứt quanh đáp án đúng + `playSfx('wrong')` + `haptic('wrong')` + **0 hạt, không rung `body`**.
  - Combo x3/x5/x10 (`scale 1.4→1`, HUD punch `1.06`, `streak` SFX, hạt `ember`) và vỡ combo (rơi `+12 px` mờ 300 ms + 6 hạt `smoke`, không phát tiếng phạt).
  - Lật thẻ 3D WebKit-safe ở `intro` dùng `<LiveCard>` 2 mặt tách biệt (`preserve-3d` không có `overflow`/`opacity`/`filter`, crossfade 120 ms khi reduced-motion).
  - `FeedbackPanel` chuẩn T3-A truyền `nextTipVi` (PP-03) + chữ hiện dần 18 ms/ký tự trong component tách riêng `V1FeedbackSection` (bấm/Space hiện hết).
  - Interstitial 1,2 s & Checkpoint & Recap hiện `RunMap` + `<Mascot>` trong `data-mascot-ok="true"` (**0 Lexi** trên màn đang làm câu); Recap nối `RecapScreen` chuẩn T3-A (`correctCount`, `baseXp`, `comboMultiplier`, `nextTask`, `onNextTask`, confetti chỉ khi ≥ 80%).
- **Kinh tế XP (`01-GAME §5`) & Vui thật (`01-GAME §6.3`):**
  - Gợi nhớ `10 XP × combo`, sản xuất/gõ `15 XP × combo` (combo ×1 / ×1,5 ở 5 / ×2 ở 10, trần ×2), hoàn thành phiên `+20` lần đầu ngày / `+5` lần sau, retry / Đã xem / Exam = `0 XP`.
  - **Ngã ba run** tại checkpoint: `Enter` = `Đường an toàn` (thẻ đến hạn chuẩn), `→` = `Đường gai` (5 thẻ retrievability thấp nhất thưởng `×1,5 XP`, có trần).
  - **Luật Boss V1:** ngẫu nhiên `Không gợi ý` / `Phải gõ` / `Chỉ nghe` (thiếu MP3 thật tự hạ về `Không gợi ý` theo `SR-22`); hạ Boss có hit-stop 50 ms + `screenPunch` ≤ 8 px/300 ms + hạt vỡ khiên + `levelUp`.

## 3. Ảnh & Video bằng chứng (`docs/audit-max/anh-sau/T4-A/`)
- 14 ảnh `audit-ui` (`390x844`, `375x667`, `430x932`, `820x1180`, `1180x820`, `1280x800`, `1366x768` × `dark`/`light`) + `report.json` + `BAO-CAO.md`.
- Ảnh tương tác đã mở kiểm trực tiếp: `390x844-dark-play_v1-playing.png`, `390x844-light-play_v1-playing.png`, `375x667-dark-play_v1-playing.png`, `1280x800-dark-play_v1-playing.png`, `390x844-dark-play_v1-intro-front.png`, `390x844-dark-play_v1-intro-flipped.png`, `390x844-dark-play_v1-wrong-feedback.png`, `390x844-dark-play_v1-fork-checkpoint.png`, `390x844-dark-play_v1-boss.png`, `390x844-dark-play_v1-recap.png`, `1280x800-dark-play_v1-recap.png`.
- Video demo: `docs/audit-max/anh-sau/T4-A/390x844-v1-demo.webm` (`843,4 KB`).

## 4. Ghi chú môi trường worktree (đã ghi `HANDOFF.md`)
- Điều phối đã gộp `server.fs.allow` vào duy nhất 1 key `server` trong `vite.config.ts` (`master` `80ea77f`, đã merge vào `audit-max/T4-A`): lỗi `403 Forbidden` cho `@fontsource/*.woff2` trên dev server đã về `0` ở cả `audit-ui.mjs` lẫn `e2e/v1-srs.spec.ts`.

## 5. Fixer Vòng 1 G3 (theo phản hồi `REVIEW-G3-A` & `REVIEW-G3-B`)

| Hạng mục sửa | Chi tiết thay đổi | Kiểm chứng đo thật |
|---|---|---|
| 1. Sảnh Khởi Chạy V1 (`/play/v1` khi DB rỗng) | Thay `EmptyState` mặc định bằng thẻ Sảnh Khởi Chạy trong `data-mascot-ok="true"`: huy hiệu `assets/icons/fluent/games/v1.webp` (`loading="eager"`) có CSS `@keyframes v1-lobby-float` (tắt ở `reduced-motion`/`exam`), `<Mascot state="chao">` kèm câu chào đầy đủ ngay khung đầu, 3 thẻ tính năng dùng icon Fluent 3D (`rocket`/`xp`/`brain.webp`, không chứa từ nội bộ `FSRS`), giữ nguyên tiêu đề `"Chưa có thẻ nào để ôn"` và 2 nút `"Bắt đầu với 15 từ khởi động"` / `"Làm placement"`. Màn đang tải dùng cùng huy hiệu `v1.webp` để tránh `anims = 0` khi tải nguội. | `audit-ui.mjs` `/play/v1` 14/14 lượt (7 khung × 2 theme) trên dev server `5261`: **`0 CHẶN · 0 NẶNG · 0 NHẸ`** (`0 J9`, `0 D7`, `0 JS:403`). Trên `375×667` toàn bộ thẻ sảnh + 2 nút nằm gọn trong khung đầu (`overflowX = 0`). |
| 2. Recap V1 `bonusLabel` & `mascotSay` | Thêm `bossBonusXp` và `comboBonusXp` vào `V1RecapSummary`, tính `effectiveComboMultiplier` từ XP lượt thật (`baseXp × effectiveComboMultiplier + comboBonusXp + bossBonusXp + sessionCompletionXp === totalXp`), truyền `bonusLabel` (`50 XP Boss · 20 XP phiên`) và `mascotSay` theo số liệu thật vào `<RecapScreen>`. | Ảnh `390x844-dark-play_v1-recap.png` & `1280x800-dark-play_v1-recap.png`: hiện `Từ mới vững`, phép tính `Đúng 2 câu (20 XP) + 50 XP Boss · 20 XP phiên = +90 XP`, câu thoại Lexi đúng theo số liệu phiên. |
| 3. Chống rơi lẻ dấu `_` trên khung gõ từ dài | Thêm `PlaceholderMaskDisplay` trong `V1JuiceBits.tsx` tách theo ` · `, giữ từng từ `whitespace-nowrap` với tracking gọn trên mobile; áp dụng cho đủ 6 mặt gõ (`recall_meaning`, `recall_cloze`, `listen_spell`, `ltrap_replay`, `err_user`, `err_fix`). | Ảnh `390x844-dark-play_v1-boss.png`: từ 10 chữ cái hiển thị `Khung từ: _ _ _ _ _ _ _ _ _ _   10 chữ cái` gọn trên 1 dòng. |
| 4. Câu thoại Lexi ở Checkpoint | Dùng `getCheckpointMascotLine(maxCombo)`: chỉ báo `"Nửa đường rồi — combo dài nhất N!"` khi `maxCombo >= 2`; khi `< 2` hiện `"Xong Chặng 1 rồi — chọn nhánh tiếp theo nhé!"`. | Ảnh `390x844-dark-play_v1-fork-checkpoint.png` chụp đủ câu thoại sau khi chạy xong hiệu ứng chữ. |
| 5. 4 điểm nhẹ từ `REVIEW-G3-B` | (a) `V1DailyRun.tsx` đếm động `${prompt.collocations.length}` ở mặt trước `intro` + tăng chiều cao mặt sau `<LiveCard>` để không cắt collocation 2; (b) `engine.ts` bỏ padding giả `headword (pos)` trong `resolveCollocationPhrases`; (c) `V1JuiceBits.tsx` không lặp `vnTrap` trong `fullExplanation` khi `nextTipVi` đã chứa `vnTrap`; (d) `chooseCheckpointFork(..., 'thorny')` đặt `totalStages: state.currentStage + 1` và `computeV1TurnXp` tách thưởng Đường gai `+50%` XP gốc độc lập với trần combo `×2`. | `npx tsc --noEmit -p .`: 0 lỗi · `npm test`: **57/57 file · 616/616 test** (26 test trong `engine.test.ts`) · Playwright (`juice` + `a11y` + `motion` + `v1-srs`): **29/29 chạy xanh** (3 `fixme` ngoài V1) · `size-budget.mjs`: **JS #/ 214,88 KB gzip · CSS 70,92 KB · V1 39,98 KB gzip · Precache 1 354,74 KiB · 0 vượt · 0 rò**. |
