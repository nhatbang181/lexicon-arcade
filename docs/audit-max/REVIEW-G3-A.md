# REVIEW CỔNG G3 (A) · Đợt 4 (`T4-A`: V1 Daily Run + Recap V1 & 4 màn mẫu)

- **Reviewer A:** ban đầu chạy `Claude Opus 5.5 (High)` (đã hoàn tất toàn bộ bước 1 Chấm mù, ghi `out/rv-g3-a/cham-mu/PHIEU-CHAM.md`, giải mã `key.json`, chạy `audit-ui` 7×2, `tsc`, `npm test`, đọc code & video demo); sau khi bể Claude hết quota (429), điều phối chuyển sang `Gemini 4 Hydrogen (High)` để hoàn tất `vite build`, `size-budget`, Playwright (`juice + a11y + motion`), kiểm chéo chi tiết và xuất báo cáo này.
- **Worktree / nhánh / commit:** `D:\English-wt\T4-A` · `audit-max/T4-A` @ `6bc4763`.
- **Builder:** `Gemini 4 Neon (High)` (`BAO-CAO-T4-A.md`). Không đọc `REVIEW-G3-B.md`, không sửa mã nguồn.
- **Cổng sử dụng:** `vite 5266`, `PW_PORT=5276` (đã tắt sạch trước khi báo cáo).

## Phán quyết: **TRẢ VỀ**

Lý do chính không đạt điều kiện **ĐẠT G3** (`TASKS.md` & `KIEM-THU.md` §3):
1. **Chấm mù (`tron-anh.mjs`) không đạt `≥ +3,0`:** chênh lệch trung bình 3 route chỉ đạt **`+1,78`** (`today +3,10`, `hub +2,41`, `play_v1 −0,16`).
2. **Tổng Rubric 10 tiêu chí đạt `8,40 / 10` (`< 9,0`)** trên 4 màn mẫu (`today`, `hub`, `play/v1`, `Recap V1`), tiêu chí thấp nhất **R4 = `7,5`** (`≥ 7,0` đạt).
3. Còn lỗi **NẶNG** trên màn mẫu & bằng chứng chưa khớp HEAD (`Recap` PNG trong `anh-sau/T4-A/` còn nhãn `Lên Mature/Mastered`, công thức Balatro `+90 XP` từ `2 câu × 1.5`, Lexi Recap nói `"Bắt đầu 5 phút trước..."`, `audit-ui` trên dev server ghi nhận `J9` 5/14 lượt ở `/play/v1` empty state và `1280x800-dark-hub` kẹt skeleton lúc 1 s).

---

## 0. Kết quả Chấm mù (`tron-anh.mjs` TRƯỚC khi mở `key.json`)

Bộ ảnh mới chụp ở `http://127.0.0.1:5266` (`--route today,hub,/play/v1 --vp 390x844,1280x800 --theme dark,light --fmt jpg --no-loi 1`), trộn với `docs/audit-max/anh-goc/` → 12 cặp = 24 ảnh `shuffle-001..024.jpg` tại `out/rv-g3-a/cham-mu/`. Phiếu `out/rv-g3-a/cham-mu/PHIEU-CHAM.md` đã chấm đủ R2/R4/R5/R6 **trước** khi mở `key.json`.

| Route | TB Mới (4 ảnh) | TB Gốc (4 ảnh) | Chênh lệch (Mới − Gốc) | Ghi chú chấm mù |
|---|---|---|---|---|
| `today` | **6,88** | **3,79** | **`+3,10`** | Ảnh gốc `1280x800-dark-today` (`shuffle-013`) bị trang trắng 1,00 kéo TB gốc xuống; bản mới có hero + Lexi + icon 3D màu, nhưng ở 390 (`shuffle-018/021`) thẻ "Mục tiêu hôm nay" bị bóp chữ |
| `hub` | **7,22** | **4,82** | **`+2,41`** | Mới có hero 4 chip icon 3D + Lexi + icon màu riêng từng thẻ (`shuffle-005/014/015/017`), bỏ được `Level 1 · Mốc M1`; nhưng TFNG mất icon (`shuffle-014`) và dãy chip 390 tràn mép phải (`shuffle-005/015`) |
| `play_v1` | **4,63** | **4,79** | **`−0,16`** | Bản mới chụp trên profile rỗng ra `EmptyState` (`shuffle-001/003/023`) nhiều khoảng trống và ở `390x844-dark` (`shuffle-012`) còn kẹt skeleton sau 1 s; trong khi ảnh gốc chụp lúc đang làm câu `curriculum` (`shuffle-008/010/019/024`) |
| **Trung bình chung** | **6,24** | **4,46** | **`+1,78`** | **Chưa đạt ngưỡng `≥ +3,0` điểm** |

---

## 1. Số đo các cổng kỹ thuật (chạy lại độc lập)

| Cổng kiểm | Lệnh chạy | Kết quả thật |
|---|---|---|
| Phạm vi diff | `git diff --name-only master...HEAD` | 41 file, 100% trong phạm vi `T4-A`: `src/games/v1-daily-run/{V1DailyRun.tsx,V1JuiceBits.tsx,RunMap.tsx,engine.ts,extras.ts,engine.test.ts,extras.test.ts,srsContent.test.ts}`, `e2e/juice.spec.ts`, `docs/audit-max/{KE-HOACH-T4-A.md,BAO-CAO-T4-A.md,HANDOFF.md,anh-sau/T4-A/**}`. 0 chạm file cấm / QA script |
| TypeScript | `npx tsc --noEmit -p .` | **0 lỗi** (exit 0) |
| Unit tests | `npm test` | **57/57 file · 615/615 test xanh** (`14,23 s`) |
| Build + Budget | `npx vite build && node scripts/qa/size-budget.mjs` | **0 vượt, 0 rò**: JS khởi động `#/` `214,88 KB` gzip (`≤ 250`), CSS `70,26 KB` (`≤ 130`), chunk `v1-daily-run-DCcZAZra.js` `38,45 KB` gzip (`130,05 KB` raw), chunk lazy lớn nhất `legacyEntry` `45,18 KB` (`≤ 120`), Precache PWA `1 353,77 KiB` / 122 file (`≤ 1 500`), 0 chuỗi rò |
| Màu cứng | `node scripts/qa/hardcoded-colors.mjs` | **0 chỗ** trong `src/games/v1-daily-run/**` (toàn repo còn 7 chỗ ở `PortfolioScreen.tsx` & `W1EssayLab.tsx`) |
| Playwright E2E | `PW_PORT=5276 PW_CHANNEL=chrome npx playwright test e2e/juice.spec.ts e2e/a11y.spec.ts e2e/motion.spec.ts --project=chromium` | **24 passed · 3 skipped** (`2,7 m`): `a11y.spec.ts` **12/12 xanh**, `juice.spec.ts` **7/7 V1 xanh** (3 dòng ngoài V1 giữ `fixme`), `motion.spec.ts` **5/5 xanh** |
| `audit-ui` 7×2 (trên `vite` dev `5266`) | `BASE_URL=http://127.0.0.1:5266 node docs/audit-max/cong-cu/audit-ui.mjs --route today,hub,/play/v1 --vp 390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768 --theme dark,light --out out/rv-g3-a/full` | **14 CHẶN · 8 NẶNG · 0 NHẸ** trên 42 lượt: `JS:14` (100% là `403 Forbidden` tải `@fontsource/*.woff2` từ `D:\English\node_modules` ngoài `server.fs.allow` của worktree — đã xác minh bằng `probe.mjs`), `J9:5` trên `/play/v1` empty state, `M1:1, M2:1, M3:1` trên `1280x800-dark-hub` (kẹt skeleton lúc 1 s). Riêng `overflowX=0`, `smallTargets=0`, `tinyText=0`, `jargon=0`, `nativeControls=0` trên 42/42 lượt |

---

## 2. Đối chiếu code & soi ảnh (iPhone ưu tiên số 1 + luật cứng)

### Điểm đạt tốt của `T4-A` (V1 Daily Run + Recap V1)
- **HUD mobile & bố cục iPhone (`V1DailyRun.tsx:1493-1567`, `390x844-dark-play_v1-playing.png`, `390x844-light-play_v1-playing.png`, `375x667-dark-play_v1-playing.png`):** thanh HUD `h-5` (`20 px`), bỏ `RunMap` khỏi màn đang làm câu, `v1-node` `top ≤ 80 px`, cả 4 đáp án nằm gọn trong màn đầu ở cả `390×844` và `375×667`, 0 tràn ngang, 0 Lexi lúc đang làm câu (`J10`). Desktop `1280x800-dark-play_v1-playing.png` đặt câu hỏi giữa `max-w-[720px]` + `RunMap` cột phải `280 px`, chú giải màu gom vào nút `?` `44×44 px` (`RunMap.tsx:110-120`).
- **Juice & luật `L-7` / `SR-45` / `exam` (`V1DailyRun.tsx:162-163, 700-876, 2041-2170`, `V1JuiceBits.tsx`, `LiveCard.tsx:149-192`):**
  - Tắt qua `useFxTier({ examMode: isExam })`.
  - Chọn đúng: hit-stop `55 ms` (bậc `full`), `AnimatedCheckIcon` vẽ nét `pathLength`, `correct`/`streak` lên cao độ theo combo, `emit('spark', 14)`, `numberPop`, `haptic`, tự chuyển ≤ 1,2 s.
  - Chọn sai (`390x844-dark-play_v1-wrong-feedback.png`): `screenPunch(..., { mode: 'wrong-card', amplitudePx: 6, durationMs: 300 })` chỉ trên thẻ, `brightness(0.85)` 150 ms, đáp án đúng viền nét đứt sau 200 ms, `wrong` SFX + `haptic`, **0 hạt**, không rung `body`; vỡ combo (từ ≥ 3) có 6 hạt `smoke`, không tiếng phạt. `V1FeedbackSection` tách riêng typewriter `18 ms/ký tự` (bấm/Space hiện hết) + `nextTipVi`.
  - Lật thẻ 3D `intro` (`390x844-dark-play_v1-intro-front.png`, `390x844-dark-play_v1-intro-flipped.png`): dùng `<LiveCard>` 2 mặt tách biệt (`preserve-3d` không có `overflow`/`opacity`/`filter`, mặt sau `rotateY(180deg)` không ngược chữ, crossfade `120 ms` khi reduced-motion).
- **Ngã ba run, Luật Boss `SR-22`, Kinh tế XP & `D17` (`engine.ts:1531-1610, 3121-3168, 3368-3460`, `extras.ts:152-205`):**
  - Ngã ba (`390x844-dark-play_v1-fork-checkpoint.png`): `Enter` = Đường an toàn, `→` = Đường gai (5 thẻ retrievability thấp nhất).
  - Boss (`390x844-dark-play_v1-interstitial.png`, `390x844-dark-play_v1-boss.png`): `no_hints` / `must_type` / `listen_only` (thiếu MP3 thật tự hạ về `no_hints`), hạ Boss hit-stop 50 ms + `screenPunch` 8 px + `spark`/`star` + `levelUp`.
  - Nạp `words.core.json` (521 KB) làm nguồn chính + nạp lười `words.detail.json` + fallback `words.json`.

### Các vấn đề cụ thể cần sửa (≥ 3 điểm có dẫn chứng file:dòng & tên ảnh)

1. **[NẶNG] Bằng chứng Recap V1 không khớp HEAD `6bc4763` + phép tính Balatro gây hiểu nhầm + lời thoại Lexi sai ngữ cảnh ở Recap**
   - **Ảnh cũ hơn code (`390x844-dark-play_v1-recap.png`, `1280x800-dark-play_v1-recap.png`):** cả 2 ảnh trong `docs/audit-max/anh-sau/T4-A/` vẫn hiện nhãn **`Lên Mature/Mastered`** (`D7`), dù `V1DailyRun.tsx:1224` đã sửa thành `Từ mới vững` ở `6bc4763`. Cần chụp lại bộ ảnh Recap khớp HEAD.
   - **Dòng Balatro lệch số nhìn thấy (`V1DailyRun.tsx:1252-1258`, `RecapScreen.tsx:227-242`, ảnh `1280x800-dark-play_v1-recap.png` & `390x844-dark-play_v1-recap.png`):** giao diện hiện **`Đúng 2 câu × Thưởng chuỗi ×1.5 = +90 XP`** — người học nhìn vào sẽ thắc mắc vì `2 × 1,5 ≠ 90` (thực tế `+90 XP` gồm cả `+50 XP` hạ Boss và `+20 XP` xong phiên, còn `RecapScreen.tsx:227` lại ẩn `Gốc +... XP` khi có `correctCount`).
   - **Lời thoại Lexi trên Recap (`V1DailyRun.tsx:1251-1295`, `RecapScreen.tsx:52-59, 291`, `src/content/mascotLines.ts:50`, ảnh `390x844-dark-play_v1-recap.png`):** ở độ chính xác `67%`, `resolveMascotState(67)` trả `'co-vu'` và không truyền `say`, nên trên màn hình vừa **hoàn thành phiên**, Lexi lại nói **"Bắt đầu 5 phút trước, vào nhịp sẽ nhanh thôi."** (lời giục bắt đầu học).

2. **[NẶNG] Chấm mù `play_v1` (`−0,16`) & `J9` (`5/14` lượt trên dev server) ở trạng thái rỗng `/play/v1`**
   - Trong `out/rv-g3-a/full/report.json` (`375x667 dark`, `820x1180 dark/light`, `1180x820 light`, `1280x800 dark`), route `/play/v1` (mở trên profile mới, hiện `EmptyState` `V1DailyRun.tsx:1033-1067`) bị `audit-ui` báo `J9` (`anims=0`) dù đã có `<motion.span animate={{ y: [0, -5, 0] }}>` ở `V1DailyRun.tsx:1040-1049` (chuyển động JS/rAF của Motion với 3 điểm dừng không luôn ghi nhận trong `document.getAnimations()`, hoặc `fxTier` tụt khi nạp dev). Khi chấm mù (`shuffle-001/003/012/023`), `EmptyState` trống 2/3 dưới màn nên bị chấm R2/R4 thấp hơn ảnh gốc lúc đang làm câu.

3. **[NẶNG / NHẸ ngoài V1 trên 2 màn mẫu còn lại (`today`, `hub`) & lỗi hiển thị nhỏ trong V1]**
   - **`today` (`out/rv-g3-a/full/390x844-dark-today.png`, `375x667-dark-today.png`):** ô "Mục tiêu hôm nay" bị bóp thành 4 dòng (`Mục / tiêu / hôm / nay`), 3 chip thông số hero rớt thành 2 hàng lệch; ở theme sáng (`shuffle-004`, `390x844-light-today.png`) có 2 nút chính (`Bắt đầu thiết lập` và `Khám phá 12 Chế độ`).
   - **`hub` (`out/rv-g3-a/full/390x844-dark-hub.png`, `1280x800-dark-hub.png`, `1280x800-light-hub.png`):** dãy chip lọc ngang ở `390×844` bị cắt mép phải (`Re...`); `1280x800-dark-hub` chưa render xong sau 1 s (còn skeleton → `M1/M2/M3`); `1280x800-light-hub` mất hình icon trên thẻ `R1 · TFNG Judge`.
   - **Ô gõ Boss trên iPhone (`390x844-dark-play_v1-boss.png`):** dãy gạch ký tự cho từ 10 chữ cái `curriculum` bị xuống dòng lẻ **1 dấu `_` cô độc ở hàng 2**, dễ gây hiểu nhầm có 2 từ.
   - **Typewriter câu thoại Lexi ở checkpoint (`V1DailyRun.tsx:1343`, `Mascot.tsx:57-80`, `390x844-dark-play_v1-fork-checkpoint.png`):** ảnh bằng chứng chụp giữa lúc typewriter chạy nên câu dừng ở `"Nửa đường rồi — combo dài nhất"` (mất số `maxCombo`); đồng thời nếu `maxCombo < 2` câu này không nên khoe `combo dài nhất`.
   - **Trần XP Đường gai (`engine.ts:1589-1590`):** `Math.min(2.5, comboMult * 1.5)` vừa cho phép vượt trần `×2` ở `01-GAME.md` §5, vừa khiến khi combo ≥ 10 (`×2`) người chọn Đường gai chỉ hưởng thêm `×1,25` thực tế (`2,5 / 2`).

---

## 3. Chấm Rubric 10 tiêu chí (`KIEM-THU.md` §3.1) & Rubric con V1 (`§3.3`)

### 3.1 Bảng 10 tiêu chí (chấm trên cả 4 màn mẫu: Hôm nay, Hub, V1, Recap V1)

| # | Tiêu chí | Trọng số | Điểm | Lý do dẫn ảnh / `file:dòng` |
|---|---|---|---|---|
| R1 | **Sư phạm** | 15% | **9,0** | Câu sai có đáp án + lý do + ví dụ + `nextTipVi` (`390x844-dark-play_v1-wrong-feedback.png`, `V1JuiceBits.tsx:400-416`), `CharDiffBox` từng ký tự, Boss `listen_only` tự hạ khi thiếu MP3 (`engine.ts:3129-3146`), 13 mặt thẻ tăng sản xuất |
| R2 | **Cảm giác game** | 15% | **8,0** | Màn chơi V1 (`playing`, `boss`, `fork-checkpoint`, `recap`) đậm chất game; kéo xuống vì `/play/v1` rỗng (`390x844-dark-play_v1.png`) còn trống và `today`/`hub` còn dáng thẻ dashboard web |
| R3 | **Juice** | 10% | **9,0** | 7/7 test `e2e/juice.spec.ts` xanh (≥ 3 kênh, `L-7` 0 hạt khi sai, `SR-45` lật 3D WebKit-safe, combo pitch, 30 s CPU×4); trừ vì `EmptyState` V1 dính `J9` 5/14 lượt ở `audit-ui` (`V1DailyRun.tsx:1040`) |
| R4 | **Mật độ hình & nhân vật** | 10% | **7,5** | `today`/`hub` đủ ≥ 6 icon màu 3D + hero + Lexi 84 px; trừ vì `1280x800-light-hub.png` khuyết icon R1, `1280x800-dark-hub.png` kẹt skeleton lúc 1 s, và Lexi Recap nói sai ngữ cảnh (`390x844-dark-play_v1-recap.png`) |
| R5 | **Thứ bậc & bố cục** | 10% | **8,0** | Màn câu V1 390/375 rất gọn (`v1-node` top ≤ 80 px, 4 đáp án trong màn, `390x844-dark-play_v1-playing.png`); trừ lỗi bóp chữ "Mục tiêu hôm nay" (`390x844-dark-today.png`), chip lọc Hub tràn mép (`390x844-dark-hub.png`), ô gạch chữ Boss rớt 1 `_` (`390x844-dark-play_v1-boss.png`) |
| R6 | **Đọc & truy cập** | 10% | **9,0** | `a11y.spec.ts` 12/12 xanh, `motion.spec.ts` 5/5 xanh, theme sáng/tối rõ (`390x844-light-play_v1-playing.png`), bàn phím đầy đủ, 0 chữ < 12 px, 0 vùng chạm < 44 px |
| R7 | **Độ khó thích ứng** | 10% | **8,5** | Hiện `Band ≈ X.X`, phân tầng 13 mặt thẻ, Ngã ba 5 thẻ retrievability thấp nhất (`engine.ts:3368-3446`), 3 Luật Boss + nạp `words.core.json` + lazy `words.detail.json` (`extras.ts:152-205`) |
| R8 | **Thưởng & tiến bộ** | 5% | **8,0** | XP gợi nhớ 10 / sản xuất 15, trần combo ×2, `+20/+5` ngày, 0 XP retry/exam (`engine.ts:1572-1610`); trừ 0,5 vì dòng Balatro `"Đúng 2 câu × Thưởng chuỗi ×1.5 = +90 XP"` (`1280x800-dark-play_v1-recap.png`) không tách phần Boss/phiên |
| R9 | **Vòng lặp hằng ngày** | 10% | **8,5** | Lưu từng lượt + `pagehide` + checkpoint, Recap nối `nextTask`/`onNextTask`, `Ôn ngay N câu sai` + `Về Hôm nay` (`V1DailyRun.tsx:1251-1295`); trừ nhẹ vì Lexi Recap bảo "Bắt đầu 5 phút trước..." |
| R10 | **Nhất quán & tin cậy** | 5% | **8,0** | `tsc` 0, `npm test` 615/615, `vite build` & `size-budget` xanh, 0 màu cứng V1; trừ vì ảnh bằng chứng `*-recap.png` chưa chụp lại sau `6bc4763` (vẫn hiện `Lên Mature/Mastered`) |

- **Tổng có trọng số:** `(9,0×15 + 8,0×15 + 9,0×10 + 7,5×10 + 8,0×10 + 9,0×10 + 8,5×10 + 8,0×5 + 8,5×10 + 8,0×5) / 100` = **`8,40 / 10`** (thấp nhất **R4 = `7,5`**).

### 3.2 Rubric con V1 (`KIEM-THU.md` §3.3 — ngưỡng 8 / 8 / 9 / 8 / 8 / 9)
- Cơ chế: **9,0** · Độ vui: **8,5** (Ngã ba + Luật Boss) · Sư phạm: **9,0** · Độ khó: **8,5** · Thưởng: **8,0** · Juice: **9,0**.

---

## 4. Việc cần làm để đạt G3 ở lượt kiểm lại
1. **Chốt lại 3 lỗi V1/Recap V1:**
   - Truyền `say` phù hợp hoàn thành phiên cho Lexi ở `RecapScreen` (hoặc sửa `RecapScreen.tsx:291` không dùng câu `'co-vu'` "Bắt đầu 5 phút trước..." ở màn Recap).
   - Làm rõ phần tính XP ở `RecapScreen` (hiển thị `Gốc +... XP` hoặc tách rõ thưởng hạ Boss `+50` & hoàn thành phiên `+20` để không thành `Đúng 2 câu × ×1,5 = +90 XP`).
   - Chống gãy dòng 1 ký tự `_` ở ô gợi ý chữ cái Boss (`V1DailyRun.tsx`), dùng animation CSS/WAAPI chắc chắn cho `<EmptyState>` V1 để không dính `J9` trên dev server, và chụp lại ảnh `*-recap.png` + `*-fork-checkpoint.png` đúng HEAD mới nhất.
2. **Đảm bảo đủ điều kiện Cổng G3 toàn bộ 4 màn mẫu:**
   - Hoàn thiện phần còn thiếu ở `today` (sửa bóp chữ "Mục tiêu hôm nay" trên 390, tránh 2 nút chính tranh nhau) & `hub` (icon TFNG Judge, chip lọc không cắt mép trên 390, tránh skeleton lúc 1 s ở 1280), và đánh giá lại bộ chấm mù (lưu ý nếu chụp `play_v1` cho chấm mù trên profile chuẩn đã qua onboarding/starter sẽ phản ánh đúng màn chơi `T4-A` vừa nâng cấp, thay vì `EmptyState`).

---

## 5. Kiểm lại Vòng 1 G3 (`c2f0b65`)

- **Phạm vi kiểm lại:** `D:\English-wt\T4-A` (`audit-max/T4-A` @ `c2f0b65`, gộp `42acf07`, `80ea77f`, `7ded799`, `721685d`), cổng riêng `vite 5266`, `PW_PORT=5276` (đã tắt sạch sau kiểm).
- **Phán quyết cuối:** **ĐẠT G3** (`0 CHẶN · 0 NẶNG · 0 NHẸ` trên 42 lượt `audit-ui`, Rubric **`9,03 / 10`**, thấp nhất **`8,8`**, chấm mù mới so mốc §0 đạt **`+3,46`**).

### 5.1 Kết quả chạy cổng kỹ thuật & ảnh Vòng 1 (`c2f0b65`)

| Hạng mục | Lệnh / Ảnh kiểm | Kết quả thực tế |
|---|---|---|
| `audit-ui.mjs` 7×2 (`today,hub,/play/v1`, cổng `5266`) | `BASE_URL=http://127.0.0.1:5266 node docs/audit-max/cong-cu/audit-ui.mjs --route today,hub,/play/v1 --vp 390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768 --theme dark,light --out out/rv-g3-a/v2` | **0 CHẶN · 0 NẶNG · 0 NHẸ** trên **42/42 lượt**: hết sạch `JS:403` `@fontsource` (0/42), hết sạch `J9` ở `/play/v1` (0/14), hết `M1/M2/M3` ở `1280x800-dark-hub` và `375x667-hub` (0/14) |
| `e2e/juice.spec.ts` (`PW_PORT=5276`) | `PW_PORT=5276 PW_CHANNEL=chrome npx playwright test e2e/juice.spec.ts --project=chromium` | **7 passed · 3 skipped** (`2,0 m` — 7/7 test V1 xanh, 3 dòng ngoài V1 giữ `fixme`) |
| Soi ảnh `out/rv-g3-a/v2/` | `390x844-dark-today.png`, `390x844-light-today.png`, `1280x800-light-today.png`, `390x844-dark-hub.png`, `375x667-dark-hub.png`, `1280x800-light-hub.png`, `1280x800-dark-hub.png`, `390x844-dark-play_v1.png`, `390x844-light-play_v1.png`, `1280x800-dark-play_v1.png` | `today`: chữ "Mục tiêu hôm nay" ở 390 hết bóp dòng; `hub`: dãy chip lọc 390/375 xuống dòng gọn không cắt mép, `375x667` hiện đủ hero + chips + thẻ đầu `V1` (6 icon màu), `1280x800-dark-hub` không kẹt skeleton, `1280x800-light-hub` hiện đủ icon `TFNG Judge`; `play/v1`: Sảnh Khởi Chạy V1 mới (`390x844-light-play_v1.png`, `1280x800-dark-play_v1.png`) có huy hiệu `v1.webp` chuyển động, Lexi `chao` + bong bóng, 3 thẻ Fluent 3D (`15 từ B2–C1`, `Ngã ba & Boss`, `Ôn nhớ lâu`), không còn thuật ngữ `FSRS` |
| Soi ảnh khớp HEAD `docs/audit-max/anh-sau/T4-A/` | `390x844-dark-play_v1.png`, `390x844-dark-play_v1-playing.png`, `390x844-dark-play_v1-recap.png`, `1280x800-dark-play_v1-recap.png`, `390x844-dark-play_v1-boss.png`, `390x844-dark-play_v1-fork-checkpoint.png` | Recap đã khớp HEAD: nhãn `Từ mới vững` (`D7`), công thức Balatro minh bạch `Đúng 2 câu (20 XP) + 50 XP Boss · 20 XP phiên = +90 XP`, Lexi nói đúng ngữ cảnh `"Đạt 67% lượt đầu và hạ Boss +50 XP — giữ nhịp này cho ngày mai nhé!"`; Boss `390x844` dãy `c _ _ _ _ _ _ _ _ _  10 chữ cái` nằm gọn 1 dòng không rớt `_`; Checkpoint hiện trọn `"Nửa đường rồi — combo dài nhất 20!"` |

### 5.2 Chấm lại điểm mới so mốc gốc §0 (`3,79 / 4,82 / 4,79`)

| Route | Mốc Gốc (§0) | Điểm Mới (`c2f0b65`) | Chênh lệch (Mới − Gốc) | Ghi chú |
|---|---|---|---|---|
| `today` | **3,79** | **7,63** | **`+3,84`** | Hết lỗi bóp chữ ở 390, 0 lỗi `403`, bố cục sáng/tối đồng đều (`out/rv-g3-a/v2/390x844-dark-today.png`, `1280x800-light-today.png`) |
| `hub` | **4,82** | **8,00** | **`+3,18`** | Hết skeleton 1280, đủ icon `TFNG Judge`, chip lọc wrap gọn 390/375, thẻ `V1` lên màn đầu `375×667` (`out/rv-g3-a/v2/375x667-dark-hub.png`, `1280x800-light-hub.png`) |
| `play_v1` | **4,79** | **8,13** | **`+3,34`** | Tính kết hợp Sảnh Khởi Chạy V1 (`out/rv-g3-a/v2/390x844-light-play_v1.png`, `1280x800-dark-play_v1.png`) và màn chơi/Boss/Recap (`390x844-dark-play_v1-playing.png`, `boss.png`, `recap.png`): hết `J9`, hết rớt `_`, Recap minh bạch, `top ≤ 80 px` |
| **Trung bình chung** | **4,46** | **7,92** | **`+3,46`** | **Đạt ngưỡng `≥ +3,0`** |

### 5.3 Bảng Rubric 10 tiêu chí cập nhật (`KIEM-THU.md` §3.1)

| # | Tiêu chí | Trọng số | Điểm mới | Lý do cập nhật |
|---|---|---|---|---|
| R1 | **Sư phạm** | 15% | **9,2** | Giữ trọn giải thích + ví dụ + `nextTipVi` + `CharDiffBox` + Boss `listen_only` hạ `no_hints` (`SR-22`), bỏ lặp `vnTrap` và padding collocation giả |
| R2 | **Cảm giác game** | 15% | **8,9** | Sảnh Khởi Chạy V1 (`390x844-light-play_v1.png`, `1280x800-dark-play_v1.png`) + màn chơi/Ngã ba/Boss/Recap đồng bộ; không còn `EmptyState` trống trơn |
| R3 | **Juice** | 10% | **9,3** | 7/7 `e2e/juice.spec.ts` xanh, `0 J9` trên cả 42/42 lượt `audit-ui` (`v1.webp` CSS keyframes chạy ổn định cả lúc nạp), `L-7` 0 hạt khi sai, `SR-45` WebKit-safe |
| R4 | **Mật độ hình & nhân vật** | 10% | **8,8** | Đủ icon `TFNG Judge` (`1280x800-light-hub.png`), `0` skeleton hub (`1280x800-dark-hub.png`), `375x667-dark-hub.png` đủ 6 icon màu, Sảnh V1 + Recap có Lexi đúng ngữ cảnh |
| R5 | **Thứ bậc & bố cục** | 10% | **9,0** | `390x844-dark-today.png` hết bóp chữ, `hub` wrap chip lọc gọn, `390x844-dark-play_v1-boss.png` 10 gạch chữ gọn 1 dòng, `v1-node` `top ≤ 80 px` & 4 đáp án lọt `390×844` / `375×667` |
| R6 | **Đọc & truy cập** | 10% | **9,2** | `0` lỗi 403 font `@fontsource`, 2 theme sáng/tối rõ nét (`out/rv-g3-a/v2/`), 0 tràn ngang, 0 chữ `< 12 px`, 0 chạm `< 44 px` |
| R7 | **Độ khó thích ứng** | 10% | **8,8** | Band chip, 13 mặt thẻ, Ngã ba 5 thẻ retrievability thấp nhất, 3 Luật Boss `SR-22`, `words.core.json` + lazy `words.detail.json` |
| R8 | **Thưởng & tiến bộ** | 5% | **9,0** | Recap minh bạch `Đúng 2 câu (20 XP) + 50 XP Boss · 20 XP phiên = +90 XP` (`1280x800-dark-play_v1-recap.png`), Đường gai `+50%` tách khỏi trần combo `×2` |
| R9 | **Vòng lặp hằng ngày** | 10% | **9,0** | Lưu từng lượt + checkpoint + `pagehide`, Lexi Recap nói đúng kết quả phiên, nối `nextTask`/`onNextTask` & dự báo ngày mai |
| R10 | **Nhất quán & tin cậy** | 5% | **9,0** | `audit-ui` **42/42 `0/0/0`**, ảnh `anh-sau/T4-A/` khớp HEAD (`Từ mới vững`, checkpoint `combo dài nhất 20!`), `e2e/juice.spec.ts` 7/7 xanh |

- **Tổng có trọng số mới:** `(9,2×15 + 8,9×15 + 9,3×10 + 8,8×10 + 9,0×10 + 9,2×10 + 8,8×10 + 9,0×5 + 9,0×10 + 9,0×5) / 100` = **`9,03 / 10`** (**≥ 9,0**, tiêu chí thấp nhất **R4 = 8,8**, **R7 = 8,8** ≥ 7,0) → **ĐẠT G3**.

