# REVIEW CỔNG G3 (T4-A Chặng 1: Hôm nay, Hub, V1 Daily Run & Recap V1) · Reviewer B

- **Reviewer B:** `rv-g3-b` — Model: **`Gemini 4 Argon (High)`** (kiểm độc lập, khác họ model với Builder `Gemini 4 Neon (High)` và Reviewer A `Claude Opus 5.5 (High)`).
- **Worktree / Nhánh / Commit:** `D:\English-wt\T4-A` · nhánh `audit-max/T4-A` @ `6bc4763` (nền `master` `2d41fe3`).
- **Cổng kiểm riêng:** `vite 5267`, `PW_PORT=5277` (không đụng cổng `5266/5276` hay `dist/`, đã tắt sạch mọi tiến trình trên `5267/5277` sau khi đo).
- **Cam kết độc lập:** Tuyệt đối không đọc báo cáo của Reviewer A, không sửa bất kỳ file code nguồn nào; thực hiện **chấm mù 24 ảnh (`tron-anh.mjs`) và ghi `PHIEU-CHAM.md` trước khi mở `key.json`**.

---

## Phán quyết Cổng G3: **ĐẠT G3**

| Điều kiện Cổng G3 (`TASKS.md` & `KIEM-THU.md` §3) | Ngưỡng ĐẠT | Kết quả thực đo | Đánh giá |
|---|---|---|---|
| **0. Chống gian lận Git & công cụ** | Chỉ chạm file thuộc T4-A, 0 sửa công cụ/luật | Chỉ chạm `src/games/v1-daily-run/**`, `e2e/juice.spec.ts`, `docs/audit-max/{KE-HOACH-T4-A,BAO-CAO-T4-A,HANDOFF,anh-sau/T4-A/**}` | **ĐẠT (100% sạch)** |
| **1. Chấm mù (`Mới − Gốc`)** | **≥ +3.0 điểm** trung bình và từng màn | `today`: **+5.53** (+4.71 nếu loại ảnh gốc trắng) · `hub`: **+4.88** · `/play/v1`: **+4.06** · **TB chung: +4.82** (+4.55 nếu loại ảnh gốc trắng) | **ĐẠT (vượt +1.82 điểm)** |
| **2. Rubric 10 tiêu chí (có trọng số)** | Tổng **≥ 9.0 / 10**, không tiêu chí nào `< 7.0` | Tổng có trọng số: **9.07 / 10** · Tiêu chí thấp nhất: **8.8 / 10** (R7) | **ĐẠT** |
| **3. Rubric con game V1 (6 cột)** | Cơ chế ≥ 8, Vui ≥ 8, Sư phạm ≥ 9, Độ khó ≥ 8, Thưởng ≥ 8, Juice ≥ 9 | Cơ chế **9.2** · Độ vui **9.0** · Sư phạm **9.2** · Độ khó **8.8** · Thưởng **9.0** · Juice **9.2** (TB **9.07**) | **ĐẠT** |
| **4. Ưu tiên số 1 iPhone (`390×844`, `375×667`, `430×932`)** | HUD ≤ 20px, `v1-node` `top ≤ 80px`, đáp án 2 `bottom ≤ 844`, 0 tràn, 0 Lexi lúc làm câu, 0 hạt khi sai, lật 3D WebKit-safe | HUD `20px`, `v1-node` `top = 78px`, đáp án 2 `bottom = 341px` (vừa khít cả `375×667`), `overflowX = 0`, `mascotOutsideOk = 0`, sai `0 hạt`, lật 3D `preserve-3d` không ngược chữ | **ĐẠT** |
| **5. Lỗi giao diện `audit-ui.mjs` (7 khung × 2 theme)** | **0 CHẶN** giao diện, **≤ 2 NẶNG**/màn | **0 lỗi giao diện (0 CHẶN UI · 0 NẶNG · 0 NHẸ)** trên 42/42 lượt (`today`, `hub`, `/play/v1`) | **ĐẠT** |
| **6. Các điểm cụ thể & lỗi phát hiện** | Chỉ ra ≥ 3 điểm cụ thể | **0 CHẶN · 0 NẶNG · 5 NHẸ** (có file:dòng và hướng xử lý cụ thể ở §5) | **ĐẠT** |

---

## §0. Kết quả Chấm mù (`tron-anh.mjs` TRƯỚC khi mở `key.json`)

- **Bằng chứng phiếu chấm mù:** `D:\English-wt\T4-A\out\rv-g3-b\cham-mu\PHIEU-CHAM.md` (đã ghi xong đủ 24 dòng `shuffle-001.jpg`..`shuffle-024.jpg` trước khi đọc `D:\English-wt\T4-A\out\rv-g3-b\cham-mu\key.json`).

### 0.1 Bảng đối chiếu từng cặp ảnh sau khi mở `key.json`

| Khung & Theme | Route | Ảnh Gốc (`anh-goc`) | Điểm Gốc (R2/R4/R5/R6 → TB) | Ảnh Mới (`blind-new`) | Điểm Mới (R2/R4/R5/R6 → TB) | Chênh lệch (`Mới − Gốc`) |
|---|---|---|---|---|---|---|
| `390x844` · `dark` | `today` | `shuffle-001.jpg` | 3.5 / 2.5 / 4.5 / 6.0 → **4.13** | `shuffle-002.jpg` | 8.5 / 9.0 / 8.5 / 9.0 → **8.75** | **+4.63** |
| `390x844` · `light` | `today` | `shuffle-011.jpg` | 3.5 / 2.5 / 4.5 / 5.5 → **4.00** | `shuffle-022.jpg` | 8.5 / 9.0 / 8.5 / 9.0 → **8.75** | **+4.75** |
| `1280x800` · `dark` | `today` | `shuffle-007.jpg` | 1.0 / 1.0 / 1.0 / 1.0 → **1.00** *(ảnh gốc trắng)* | `shuffle-017.jpg` | 9.0 / 9.0 / 9.0 / 9.0 → **9.00** | **+8.00** |
| `1280x800` · `light` | `today` | `shuffle-005.jpg` | 3.5 / 2.5 / 5.0 / 5.5 → **4.13** | `shuffle-006.jpg` | 8.5 / 9.0 / 9.0 / 9.0 → **8.88** | **+4.75** |
| `390x844` · `dark` | `hub` | `shuffle-010.jpg` | 3.5 / 2.5 / 4.5 / 5.5 → **4.00** | `shuffle-004.jpg` | 8.5 / 9.0 / 8.5 / 9.0 → **8.75** | **+4.75** |
| `390x844` · `light` | `hub` | `shuffle-018.jpg` | 3.5 / 2.5 / 4.5 / 5.5 → **4.00** | `shuffle-009.jpg` | 8.5 / 9.0 / 8.5 / 9.0 → **8.75** | **+4.75** |
| `1280x800` · `dark` | `hub` | `shuffle-012.jpg` | 4.0 / 2.5 / 4.5 / 6.0 → **4.25** | `shuffle-016.jpg` | 9.0 / 9.5 / 9.0 / 9.0 → **9.13** | **+4.88** |
| `1280x800` · `light` | `hub` | `shuffle-020.jpg` | 3.5 / 2.5 / 4.5 / 5.5 → **4.00** | `shuffle-015.jpg` | 9.0 / 9.5 / 9.0 / 9.0 → **9.13** | **+5.13** |
| `390x844` · `dark` | `/play/v1` | `shuffle-021.jpg` | 4.5 / 3.5 / 3.5 / 5.5 → **4.25** | `shuffle-003.jpg` | 8.0 / 7.5 / 9.0 / 9.0 → **8.38** | **+4.13** |
| `390x844` · `light` | `/play/v1` | `shuffle-008.jpg` | 4.0 / 3.5 / 3.5 / 5.0 → **4.00** | `shuffle-013.jpg` | 8.0 / 7.5 / 9.0 / 9.0 → **8.38** | **+4.38** |
| `1280x800` · `dark` | `/play/v1` | `shuffle-014.jpg` | 4.5 / 3.5 / 4.5 / 6.0 → **4.63** | `shuffle-023.jpg` | 8.0 / 7.5 / 9.0 / 9.0 → **8.38** | **+3.75** |
| `1280x800` · `light` | `/play/v1` | `shuffle-024.jpg` | 4.0 / 3.5 / 4.5 / 5.5 → **4.38** | `shuffle-019.jpg` | 8.0 / 7.5 / 9.0 / 9.0 → **8.38** | **+4.00** |

### 0.2 Tổng hợp chênh lệch theo từng màn và trung bình chung

| Màn (Route) | Điểm Gốc TB | Điểm Mới TB | Chênh lệch (`Mới − Gốc`) | Ngưỡng Cổng G3 | Kết luận |
|---|---|---|---|---|---|
| **Hôm nay (`today`)** | **3.31** *(4.08 nếu bỏ `shuffle-007` trắng)* | **8.84** | **`+5.53`** *(`+4.71` nếu bỏ `shuffle-007`)* | ≥ +3.0 | **ĐẠT** |
| **Hub (`hub`)** | **4.06** | **8.94** | **`+4.88`** | ≥ +3.0 | **ĐẠT** |
| **V1 (`/play/v1`)** | **4.31** | **8.38** | **`+4.06`** | ≥ +3.0 | **ĐẠT** |
| **Trung bình chung (12 cặp)** | **3.90** *(4.16 nếu bỏ `shuffle-007`)* | **8.72** | **`+4.82`** *(`+4.55` nếu bỏ `shuffle-007`)* | **≥ +3.0** | **ĐẠT** |

---

## §1. Số đo Cổng Kỹ thuật tự chạy

1. **Chống gian lận (`git diff --name-only master...HEAD`):**
   - Chỉ thay đổi các file trong phạm vi T4-A Chặng 1:
     - `src/games/v1-daily-run/{RunMap.tsx,V1DailyRun.tsx,V1JuiceBits.tsx,engine.ts,extras.ts,engine.test.ts,extras.test.ts,srsContent.test.ts}`
     - `e2e/juice.spec.ts`
     - `docs/audit-max/{KE-HOACH-T4-A.md,BAO-CAO-T4-A.md,HANDOFF.md,anh-sau/T4-A/**}`
   - **0** chỉnh sửa trên `docs/audit-max/cong-cu/**`, `docs/audit-max/LUAT.md`, `docs/audit-max/KIEM-THU.md`, `scripts/qa/**`.
2. **Kiểm tra kiểu (`npx tsc --noEmit -p .`):** **0 lỗi** (`EXIT=0`).
3. **Unit tests (`npm test`):** **57/57 file PASS · 615/615 test xanh** (`19.84s`), bao gồm 71 test của `v1-daily-run` (`engine.test.ts` 25 test, `srsContent.test.ts` 28 test, `audioMissing.test.ts` 9 test, `extras.test.ts` 6 test, `progressSaver.test.ts` 3 test).
4. **Playwright E2E (`PW_PORT=5277 PW_CHANNEL=chrome npx playwright test e2e/juice.spec.ts e2e/a11y.spec.ts e2e/motion.spec.ts --project=chromium`):**
   - **24/24 test hoạt động PASS** (3 test ngoài phạm vi V1 đánh dấu `fixme`):
     - `e2e/a11y.spec.ts`: **12/12 PASS** (6 màn × 2 theme `dark`/`light`, 0 vi phạm axe serious/critical mới).
     - `e2e/juice.spec.ts`: **7/7 PASS** (đúng ≥ 3 kênh; sai ≥ 3 kênh + 0 hạt + không rung body + viền nét đứt sau 200ms; combo x3 ≥ 3 kênh; lật thẻ 3D WebKit-safe `preserve-3d` không ngược chữ; Recap đếm Balatro + tự chuyển câu ≤ 1,2s; HUD mobile `390×844` & `375×667` `nodeTop ≤ 80px`, `choice2Bottom ≤ height`, `0 Lexi`; 30s V1 CPU ×4 trên bản preview đạt `p50 ≤ 24ms`, `p95 ≤ 45ms`).
     - `e2e/motion.spec.ts`: **5/5 PASS** (reduced-motion đạt 0 animation lặp vô hạn, 0 transform sau 200ms, 0 hạt canvas).
5. **Màu cứng (`node scripts/qa/hardcoded-colors.mjs`):**
   - **0 chỗ** trong toàn bộ `src/games/v1-daily-run/**` (7 chỗ còn lại trong toàn repo nằm ở `PortfolioScreen.tsx` và `W1EssayLab.tsx` thuộc làn khác).
6. **Giao diện định lượng (`audit-ui.mjs` 7 khung × 2 theme cho `today,hub,/play/v1` trên cổng `5267` → `out/rv-g3-b/full`):**
   - Khung đo: `390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768` × `dark,light` = **42 lượt**.
   - Chỉ số giao diện/DOM trên cả 42/42 lượt: **`tràn = 0` · `chạm<44 = 0` · `chữ<12 = 0` · `0 NẶNG` · `0 NHẸ`** (0 vi phạm ở tất cả các mã `D3, D4, D5, D7, D10, M1, M2, M3, M4, M5, M7, J9, J10, Q5`).
   - Trên `today`: mỗi khung/theme có `bigPictures = 1`, `mascots = 1 (co-vu, h=84)`, `colorIcons = 6..11`, `textOnlyBoxes = 0`.
   - Trên `hub`: mỗi khung/theme có `bigPictures = 1`, `mascots = 1 (co-vu, h=84)`, `colorIcons = 6..11`, `textOnlyBoxes = 0`, **0 CHẶN · 0 NẶNG · 0 NHẸ** (14/14 lượt).
   - Trên `/play/v1`: `mascots = 0` (đúng J10), `anims ≥ 1` (đúng J9), **0 CHẶN · 0 NẶNG · 0 NHẸ** (14/14 lượt).
   - *Ghi chú hạ tầng worktree:* 14 lượt `today` (route đầu tiên mở trên mỗi browser context) ghi nhận `JS: Failed to load resource: the server responded with a status of 403 (Forbidden)` do Vite 6 dev server chạy trong worktree `D:\English-wt\T4-A` chặn truy cập `@fontsource/*.woff2` nằm trong junction `D:\English\node_modules` ngoài `server.fs.allow`. Đây là giới hạn cấu hình `vite.config.ts` (file ngoài phạm vi T4-A, đã được Builder ghi nhận tại `HANDOFF.md`), hoàn toàn không xảy ra trên bản `vite preview` hoặc khi chạy từ repo chính `D:\English`.

---

## §2. Kiểm tra Luật cứng V1 & Logic Code (`V1DailyRun.tsx`, `V1JuiceBits.tsx`, `RunMap.tsx`, `engine.ts`, `extras.ts`)

1. **Ưu tiên iPhone (`390×844`, `375×667`, `430×932`) & HUD Mobile (`V1DailyRun.tsx:1494-1567`):**
   - Thanh HUD mobile (`data-testid="v1-mobile-hud"`) dùng `md:hidden h-5 px-3 flex items-center gap-2` (cao đúng `20 px`), chứa `ProgressSweepBar` dày `8 px` có vệt sáng chạy qua bằng `transform`, bộ đếm `stagePosition/stageNodes.length`, chip `Band ≈ 4.0` (hoặc `BOSS 100%`), badge combo `🔥` và chip `+XP`.
   - Đã ẩn `RunMap` khỏi màn đang làm câu trên mobile; trên desktop `≥ 1024px` (`lg:block w-[280px]`, `V1DailyRun.tsx:1889-1902`), `RunMap` đặt ở cột phải gọn gàng với nút `?` mở chú giải màu kích thước `min-w-[44px] min-h-[44px]` (`RunMap.tsx:110-127`).
   - Thực đo trên ảnh `390x844-dark-play_v1-playing.png` và `375x667-dark-play_v1-playing.png`: thẻ câu hỏi `[data-testid="v1-node"]` có `top = 78 px` (`≤ 80 px`), đáp án 2 có `bottom = 341 px` (`≤ 667 px` và `≤ 844 px`), cả 4 đáp án và thanh nút `Gợi ý (H)` / `Không nhớ` nằm trọn trong màn đầu không cần cuộn.
2. **Juice ≥ 3 kênh, `useFxTier()`, tắt khi `exam`, 0 hạt khi sai (`V1DailyRun.tsx:163,729-862`, `V1JuiceBits.tsx:96-158`):**
   - `const fx = useFxTier({ examMode: isExam })` chi phối toàn bộ motion/VFX.
   - **Chọn đáp án:** `whileTap` `scale: 0.97` (`dur.instant`) + ripple WAAPI tại tọa độ chạm + `playSfx('tap')` + `haptic('tap')` (tách vào `setTimeout(..., 0)` sau paint đầu để giữ INP thấp ở CPU ×4).
   - **Đúng:** hit-stop `55 ms` ở bậc `full` → pop thẻ `1 → 1.04 → 1` + icon ✓ vẽ nét `pathLength 0 → 1` (`220 ms`) + `playSfx('correct', { rate: computeComboRate(next.combo) })` + `emit('spark', { count: 14 })` + `numberPop` bay về toạ độ thực của chip XP + `haptic('correct')` + tự chuyển câu sau `900 ms` (`≤ 1,2 s`).
   - **Sai (`L-7` / Kao 2020):** `playSfx('wrong')` + `haptic('wrong')` + `screenPunch(cardEl, { mode: 'wrong-card', amplitudePx: 6, durationMs: 300 })` **chỉ rung thẻ câu hỏi (không rung `body`)** + `brightness(0.85)` trong `150 ms` + sau `200 ms` bật `choiceState = 'reveal-correct'` (viền nét đứt quanh đáp án đúng) + **0 hạt `spark`/`ember`**.
   - **Combo & Vỡ combo:** mốc `x3/x5/x10` có pop `scale 1.4 → 1`, HUD punch `1.06`, `playSfx('streak')`, bắn hạt `ember` (8/14/24 hạt); khi đang có chuỗi `≥ 3` mà trả lời sai thì hiện bóng rơi `+12 px` mờ dần trong `300 ms` + 6 hạt `smoke`, không phát âm thanh phạt.
3. **Lật thẻ 3D WebKit-safe (`SR-45`, `V1DailyRun.tsx:2042-2170`):**
   - Mặt `intro` dùng `<LiveCard flipped={introFlipped} backContent={backFace}>` với 2 mặt DOM tách biệt (`[data-face="front"]` và `[data-face="back"]`), container `transform-style: preserve-3d`, `overflow: visible`, `opacity: 1`, `filter: none`, `backface-visibility: hidden`. Ảnh `390x844-dark-play_v1-intro-flipped.png` và kiểm tự động trong `e2e/juice.spec.ts:327-357` xác nhận chữ mặt sau hoàn toàn xuôi, không bị ngược gương.
4. **0 Lexi trên màn đang làm câu (`J10`) & Recap Balatro (`V1DailyRun.tsx:1174-1298,1301-1458`):**
   - Trong pha `playing` và `boss` (khi `interstitial === null`), tuyệt đối không render `<Mascot>` (`mascotOutsideOk === 0`).
   - `<Mascot>` chỉ xuất hiện trong container có `data-mascot-ok="true"` ở màn `checkpoint`, `interstitial` chuyển chặng/vào Boss (1,2 s), và bên trong `RecapScreen`.
   - Màn Recap hiển thị `RunMap` trạng thái kết thúc (kèm thanh Boss vỡ 8 mảnh `ĐÃ HẠ (+50 XP)`), 4 thẻ số V1 (`Tổng số thẻ`, `Đúng lượt đầu`, `Từ mới vững`, `Dự báo ngày mai`), nối đầy đủ `RecapScreen` chuẩn T3-A (`correctCount`, `baseXp`, `comboMultiplier`, `nextTask`, `onNextTask`, `onRetryMistakes` giới hạn `≤ 5` thẻ ở chế độ `extra_practice` `0 XP / 0 FSRS`, confetti chỉ bắn khi `accuracyPercent >= 80`).
5. **Ngã ba run, 3 Luật Boss & Kinh tế XP trần `×2` (`engine.ts:1531-1613,3121-3187,3368-3449`):**
   - **Ngã ba run (`chooseCheckpointFork`):** tại Checkpoint giữa các chặng, người chơi chọn `Đường an toàn` (phím `Enter`, đi tiếp thẻ đến hạn chuẩn) hoặc `Đường gai (×1,5 XP)` (phím `→`, rút 5 thẻ có `retrievability` thấp nhất còn lại, gắn cờ `isThornyNode: true` thưởng `×1,5 XP`).
   - **3 Luật Boss (`selectBossModifier` & `buildBossNodes`):** chọn theo seed giữa `no_hints` (`Không gợi ý` — vô hiệu `applyNodeHint` và ẩn nút `Gợi ý (H)`), `must_type` (`Phải gõ` — nâng thẻ `recog` của Boss lên `recall_meaning`), và `listen_only` (`Chỉ nghe` — chuyển thẻ Boss sang `listen_spell`, nhưng kiểm tra `canUseListenOnly` để **tự động hạ về `no_hints` nếu bất kỳ thẻ Boss nào thiếu MP3 thật** theo `SR-22`).
   - **Kinh tế XP (`computeV1TurnXp`):** gợi nhớ `10 XP`, sản xuất/gõ `15 XP`, nhân hệ số combo `×1` (`<5`), `×1,5` (`5..9`), `×2` (`≥10`) với trần cứng `MAX_COMBO_MULTIPLIER = 2` (Đường gai trần `×2,5`); thưởng hoàn thành phiên `+20 XP` lần đầu trong ngày / `+5 XP` từ lần thứ 2; retry, Extra Practice, Đã xem, Exam đều `0 XP`.
6. **Tối ưu nạp dữ liệu `D17` (`extras.ts:156-235`, `V1DailyRun.tsx:244-275`):**
   - `loadV1Content()` ưu tiên nạp `data/vocab/words.core.json` (~521 KB) thay vì `words.json` (4,48 MB), có fallback an toàn về `words.json` nếu thiếu.
   - Sau khi khởi tạo run, `ensureVocabDetailsLoaded` nạp lười `data/vocab/words.detail.json` ở nền và truyền `itemIds` của riêng phiên hiện tại để chỉ parse Zod các từ đang dùng, rồi gọi `hydrateRunContent` làm giàu định nghĩa/ví dụ/collocations mà không làm gián đoạn tương tác.

---

## §3. Checklist soi ảnh (`KIEM-THU.md` §4 — đối chiếu trên `390×844`, `375×667` và `1280×800`)

- [x] Không tràn ngang (`overflowX = 0` trên toàn bộ 42/42 lượt `audit-ui`), không chữ bị cắt `…` trong vùng nội dung học.
- [x] Đúng 1 nút primary trên mỗi màn; không còn dãy ≥ 3 nút giống hệt nhau.
- [x] Ở màn chơi V1: câu hỏi (`top = 78 px ≤ 80 px`) + cả 4 đáp án (`choice2 bottom = 341 px ≤ 844 px`) nằm trọn trong màn đầu ở cả `390×844` và `375×667` (`390x844-dark-play_v1-playing.png`, `375x667-dark-play_v1-playing.png`).
- [x] Không còn thuật ngữ nội bộ (`Mốc`, `Level 1 · Training`, `Node`, `FSRS`, `Δ` → đã thay bằng `Luyện`, `Band ≈ 4.0`, `Bản đồ chặng 1`).
- [x] Màn khung (`today`, `hub`): có Lexi `84 px` (trong khoảng `72–160 px`) đúng trạng thái, không đè chữ; có Hero ≥ 15%, `6–11` icon màu 3D khác nhau, `0` hộp chỉ chữ (`390x844-dark-today.png`, `1280x800-dark-hub.png`).
- [x] Có ít nhất 1 phần tử đang sống ngoài vùng chữ ở cả màn khung và màn chơi (huy hiệu `Sparkles` nhịp thở nhẹ ở góc thẻ V1, tắt khi `exam`/`reduced-motion`).
- [x] Không có hiệu ứng chuyển động đè sau/trên vùng chữ học (`LUAT.md` J3); hạt/số bay không che chữ hay nút.
- [x] Theme sáng đọc tốt, tương phản rõ ràng (`390x844-light-today.png`, `390x844-light-hub.png`, `390x844-light-play_v1-playing.png`).
- [x] Streak/XP ở shell khớp với màn Hôm nay (`0 ngày`, `0 XP`).
- [x] Các ảnh **sau tương tác** (`intro-front`, `intro-flipped`, `playing`, `wrong-feedback`, `fork-checkpoint`, `boss`, `recap` ở `390×844` & `1280×800`) và video `390x844-v1-demo.webm` đều đạt đầy đủ các mục trên.

---

## §4. Bảng chấm Rubric 10 tiêu chí (`KIEM-THU.md` §3.1) & Rubric con V1 (`KIEM-THU.md` §3.3)

### 4.1 Rubric 10 tiêu chí (cho 4 màn mẫu Cổng G3: Hôm nay, Hub, V1, Recap V1)

| # | Tiêu chí | Trọng số | Điểm (/10) | Điểm × Trọng số | Lý do theo mốc mô tả 4/7/10 & dẫn chứng ảnh / `file:dòng` |
|---|---|---|---|---|---|
| **R1** | **Sư phạm** | 15% | **9.2** | 1.380 | Mọi câu sai/gần đúng có đáp án chuẩn + đối chiếu từng ký tự `CharDiffBox` + giải thích + câu ví dụ bằng chứng + `Lần sau để ý` (`nextTipVi`, `390x844-dark-play_v1-wrong-feedback.png`, `V1JuiceBits.tsx:391-417`); thẻ `intro` bấm "Đã xem" chèn lại `recog` sau 3–5 thẻ (`engine.ts:2667-2704`); thiếu MP3 tự hạ mặt (`SR-22`). Trừ 0.3 do lặp chuỗi `vnTrap` ở `V1JuiceBits.tsx:305-308`. |
| **R2** | **Cảm giác game** | 15% | **9.0** | 1.350 | Sảnh `today` và `hub` có chiều sâu, Hero + Lexi + icon 3D (`390x844-dark-today.png`, `1280x800-dark-hub.png`); V1 có thẻ lật 3D (`390x844-dark-play_v1-intro-flipped.png`), Ngã ba run An toàn / Đường gai ×1,5 XP (`390x844-dark-play_v1-fork-checkpoint.png`), Boss có Luật Boss + thanh HP vỡ 8 mảnh (`390x844-dark-play_v1-boss.png`) và Recap Balatro (`390x844-dark-play_v1-recap.png`). |
| **R3** | **Juice** | 10% | **9.2** | 0.920 | 7/7 test `e2e/juice.spec.ts` đạt ≥ 3 kênh: tap scale `.97` + ripple WAAPI + SFX + haptic; đúng có hit-stop 55ms + pop + ✓ vẽ nét + cao độ `computeComboRate` + 14 hạt `spark` + `numberPop` bay về chip XP (`390x844-v1-demo.webm`); sai rung thẻ ±6px + viền nét đứt sau 200ms + **0 hạt** (`V1DailyRun.tsx:812-862`). |
| **R4** | **Mật độ & chất lượng hình + nhân vật** | 10% | **9.0** | 0.900 | `today` và `hub` đạt `bigPictures=1`, `mascots=1 (84px)`, `colorIcons=6..11`, `textOnlyBoxes=0` trên cả 14/14 lượt (`out/rv-g3-b/full/BAO-CAO.md`); màn câu hỏi V1 giữ `0 Lexi` (`J10`), chỉ hiện Lexi ở Checkpoint/Interstitial/Recap trong `data-mascot-ok="true"`. |
| **R5** | **Thứ bậc & bố cục** | 10% | **9.2** | 0.920 | Ưu tiên iPhone số 1: HUD mobile `20 px`, thẻ câu `top = 78 px` (`≤ 80 px`), đáp án 2 `bottom = 341 px`, cả 4 đáp án nằm gọn trong màn đầu cả ở `390×844` và `375×667` (`375x667-dark-play_v1-playing.png`); desktop 2 cột `720px + 280px` với tooltip `?` `44×44px` (`1280x800-dark-play_v1-playing.png`). |
| **R6** | **Đọc & truy cập** | 10% | **9.2** | 0.920 | `chạm<44 = 0`, `chữ<12 = 0`, `tràn = 0` trên 42/42 lượt; `e2e/a11y.spec.ts` 12/12 xanh, `e2e/motion.spec.ts` 5/5 xanh; chơi hết bằng bàn phím (`1–4`, `H`, `Enter`, `→`, `Space`); theme sáng rõ nét (`390x844-light-play_v1-playing.png`). |
| **R7** | **Độ khó thích ứng** | 10% | **8.8** | 0.880 | Đọc `skillLevel` từ profile, hiện chip `Band ≈ 4.0`, thích ứng gợi ý chữ đầu (`skillLevel <= 3`) & lượt nghe (`skillLevel >= 7`), van tải thẻ mới 15→10→5 theo retention 7 ngày (`PP-C4`) và vòng phục hồi ≤ 50 thẻ (`PP-02`, `engine.test.ts:725-801`). |
| **R8** | **Thưởng & tiến bộ** | 5% | **9.0** | 0.450 | Kinh tế XP chuẩn `01-GAME.md` §5: gợi nhớ 10 XP, sản xuất 15 XP, combo `×1/×1,5/×2` trần `×2`, Đường gai `×1,5`, hoàn thành phiên `+20/+5 XP`, hạ Boss `+50 XP`, retry/Exam `0 XP` (`engine.ts:1531-1613`); Recap hiện 4 thẻ chỉ số FSRS thật (`1280x800-dark-play_v1-recap.png`). |
| **R9** | **Vòng lặp hằng ngày** | 10% | **9.0** | 0.900 | Luồng mở app → V1 (`Enter`) → Checkpoint Ngã ba → Boss → Recap → `nextTask` / `Ôn ngay N câu sai` / `Về Hôm nay` khép kín; lưu tiến độ giữa phiên mỗi lượt (`saveProgress` debounce 500ms + flush `pagehide`/`visibilitychange`, `V1DailyRun.tsx:447-487`). |
| **R10** | **Nhất quán & độ tin cậy** | 5% | **9.0** | 0.450 | `0` màu cứng trong V1, tối ưu `D17` nạp `words.core.json` (521 KB) + nạp lười `words.detail.json` theo `itemIds` phiên (`extras.ts:156-235`), 30s CPU ×4 mượt (`p50 ≤ 24ms`), 615/615 unit test xanh. |
| **Tổng** | **Có trọng số** | **100%** | — | **`9.07 / 10`** | **ĐẠT Cổng G3** (ngưỡng `≥ 9.0`, không tiêu chí nào `< 7.0`, thấp nhất R7 = `8.8`). |

### 4.2 Rubric con của V1 Daily Run (`KIEM-THU.md` §3.3 & `01-GAME.md` §1)

| Cột | Điểm nền (`01-GAME.md` §1) | Ngưỡng ĐẠT | Điểm sau T4-A Chặng 1 | Nhận xét ngắn |
|---|---|---|---|---|
| **Cơ chế** | 6.0 | ≥ 8.0 | **9.2** | Đủ 13 mặt thẻ, FSRS chuẩn lượt đầu, lưu tiến độ mỗi lượt, xử lý sạch thẻ thiếu MP3/nội dung. |
| **Độ vui** | 5.0 | ≥ 8.0 | **9.0** | Thêm quyết định chiến thuật thật ở Ngã ba run (An toàn vs Đường gai ×1,5 XP) và 3 Luật Boss cuối chặng. |
| **Sư phạm** | 3.0 | ≥ 9.0 | **9.2** | Không lộ đáp án, thẻ mới đi qua `intro → recog`, phản hồi có `CharDiffBox` + bằng chứng + `nextTipVi`. |
| **Độ khó thích ứng** | 3.0 | ≥ 8.0 | **8.8** | Van tải thẻ mới theo retention 7 ngày, vòng phục hồi ≤ 50 thẻ, gom khối chủ đề, gắn `skillLevel` / `Band ≈ X.X`. |
| **Phần thưởng** | 5.0 | ≥ 8.0 | **9.0** | Thang XP 10/15 công bằng có trần combo ×2, thưởng phiên +20/+5, hạ Boss +50, retry/Exam 0 XP. |
| **Juice** | 5.0 | ≥ 9.0 | **9.2** | ≥ 3 kênh mọi tương tác, hit-stop 55ms, lật 3D WebKit-safe, 0 hạt khi sai, Recap đếm số kiểu Balatro. |
| **Trung bình V1** | **4.5** | — | **`9.07`** | Tăng **+4.57 điểm** so với bản nền. |

---

## §5. Danh sách Điểm cụ thể & Góp ý kỹ thuật (0 CHẶN · 0 NẶNG · 5 NHẸ)

Không có lỗi **CHẶN** hoặc **NẶNG** nào trên V1 và Recap V1. Dưới đây là **5 điểm NHẸ cụ thể** (kèm `file:dòng` và ảnh bằng chứng) để Builder hoàn thiện thêm ở Chặng 2:

1. **[NHẸ · Copy cố định `"2 collocations"` trên mặt trước thẻ Intro]**
   - **Vị trí:** `src/games/v1-daily-run/V1DailyRun.tsx:2156` & ảnh `docs/audit-max/anh-sau/T4-A/390x844-dark-play_v1-intro-front.png` đối chiếu với `390x844-dark-play_v1-intro-flipped.png`.
   - **Chi tiết:** Mặt trước thẻ `intro` ghi cố định `"Lật mặt sau để xem ví dụ & 2 collocations"`, nhưng khi từ vựng trong dữ liệu chỉ có 1 collocation (như từ `curriculum` ở ảnh `390x844-dark-play_v1-intro-flipped.png` chỉ có 1 dòng `• the national curriculum`), mặt sau chỉ hiện 1 chip.
   - **Gợi ý sửa:** Đổi chuỗi thành động theo `prompt.collocations.length` (ví dụ: `prompt.collocations.length > 0 ? \`Lật mặt sau để xem ví dụ & ${prompt.collocations.length} collocation\` : 'Lật mặt sau để xem ví dụ'`).

2. **[NHẸ · `resolveCollocationPhrases` đệm chuỗi `"headword (pos)"` khi từ có ít hơn 2 collocation/synonym]**
   - **Vị trí:** `src/games/v1-daily-run/engine.ts:1076-1078` (`while (found.length < 2) { found.push(\`${vocab.headword} (${vocab.pos[0] ?? 'n'})\`); }`).
   - **Chi tiết:** Khi từ mới nạp từ `words.core.json` (trước khi `words.detail.json` gộp xong) hoặc từ chỉ có 1 collocation và không có synonym, hàm tự đệm thêm chuỗi kiểu `"curriculum (n)"` vào danh sách collocations. Chuỗi này không phải là một collocation thật và nếu rơi vào `found[0]` sẽ hiện ở dải xanh `Collocation: word (n)` khi trả lời đúng (`V1JuiceBits.tsx:375-383`).
   - **Gợi ý sửa:** Bỏ vòng lặp `while (found.length < 2)` đệm chuỗi giả; chỉ trả về các collocation/synonym thật tìm được (`return found.slice(0, 2)`), và chỉ hiển thị `collocationHighlight` khi có phần tử thật.

3. **[NHẸ · Lặp nội dung `vnTrap` ở cả thân `explanation` và hộp `Lần sau để ý` (`nextTipVi`) khi trả lời sai]**
   - **Vị trí:** `src/games/v1-daily-run/V1JuiceBits.tsx:305-308,413-415` và `src/games/v1-daily-run/engine.ts:3053` (xem ảnh `docs/audit-max/anh-sau/T4-A/390x844-dark-play_v1-wrong-feedback.png`).
   - **Chi tiết:** Trong `V1FeedbackSection`, `fullExplanation` nối thêm `` `${feedback.explanationVi} · Lưu ý: ${feedback.vnTrap}` ``, trong khi `buildNextTipVi` (`engine.ts:3053`) cũng trả về chính `outcome.vnTrap` cho prop `nextTipVi` (`Lần sau để ý: ...` của `FeedbackPanel`). Khi hiệu ứng typewriter chạy xong, cùng một câu lưu ý `vnTrap` xuất hiện 2 lần liên tiếp.
   - **Gợi ý sửa:** Giữ `fullExplanation = feedback.explanationVi` khi đã truyền `nextTipVi={feedback.nextTipVi}` xuống `FeedbackPanel` để tránh lặp.

4. **[NHẸ · `chooseCheckpointFork(state, 'thorny')` giữ `totalStages` cũ khi cắt hàng đợi còn 5 thẻ Đường gai]**
   - **Vị trí:** `src/games/v1-daily-run/engine.ts:3417-3438`.
   - **Chi tiết:** Khi người chơi chọn nhánh `Đường gai`, `const nextNodes = [...before, ...thornyPicked]` thay thế toàn bộ các thẻ còn lại sau `currentIndex` bằng 5 thẻ khó nhất, nhưng `totalStages` vẫn giữ `Math.max(state.currentStage + 1, state.totalStages)`. Nếu phiên chuẩn ban đầu có 3 chặng (ví dụ 45 thẻ) và người chơi rẽ vào Đường gai ở cuối Chặng 1, HUD sẽ hiển thị `Chặng 2/3` nhưng hết 5 thẻ Đường gai sẽ vào thẳng Boss mà không có Chặng 3.
   - **Gợi ý sửa:** Đặt `totalStages: state.currentStage + 1` khi chọn `thorny` (vì nhánh Đường gai gom 5 thẻ khó nhất làm chặng cuối trước Boss), hoặc nối tiếp các node của những chặng sau `currentStage` nếu muốn giữ đủ số chặng.

5. **[NHẸ · Khoảng nền dưới thẻ câu hỏi ở theme sáng trên mobile & câu thoại cố định của Lexi ở Recap]**
   - **Vị trí:** `src/games/v1-daily-run/V1DailyRun.tsx:1486,1570` (`390x844-light-play_v1-playing.png`) & `RecapScreen` (`390x844-dark-play_v1-recap.png`).
   - **Chi tiết:** (a) Ở `390x844-light-play_v1-playing.png`, vùng dưới thẻ câu hỏi xuất hiện dải nền xám đậm hơn từ khoảng `y ≈ 560px` xuống đáy khung hình do chiều cao khối con ngắn hơn viewport; (b) Ở màn Recap (`390x844-dark-play_v1-recap.png`), Lexi vẫn hiển thị câu thoại mặc định `"Bắt đầu 5 phút trước, vào nhịp sẽ nhanh thôi."` thay vì câu chúc mừng theo kết quả phiên.
   - **Gợi ý sửa:** Dùng `min-h-dvh` cho vỏ nền `bossStageRef` của V1 và truyền câu thoại động theo `accuracyPercent` / `bossDefeated` vào `RecapScreen` khi có dịp chạm component dùng chung.
