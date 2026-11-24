# REVIEW T1-B – Reviewer A – model Claude Opus 5.5

Nhánh `audit-max/T1-B` @ `00165f9`, worktree `D:\English-wt\T1-B`, 23/11/2026. Đây là review đợt 1 (1 reviewer, `07` §3): tập trung vào test, diff và chức năng. Mọi số dưới đây do reviewer tự chạy lại, không lấy số của builder. Log và ảnh để ở `out/` (không commit).

## 0. Chấm mù
Không áp dụng ở đợt 1 (`07` §3: "rubric thẩm mỹ chưa chấm"). Không mở `key.json`, không chấm R1–R10.

## 1. Kết quả tự chạy lại

| Lệnh | Kết quả thật | Log |
|---|---|---|
| `npx tsc --noEmit -p .` | exit 0, 0 lỗi | `out/tsc.txt` |
| `npm test` | 35 file, **399/399** xanh, 0 skip | `out/test.txt` |
| `npm run validate:data` | PASS, exit 0 | `out/validate.txt` |
| `TZ=Asia/Ho_Chi_Minh npx vitest run src/core/adaptive src/core/gamification` | 4 file, **24/24** xanh | `out/tz.txt` |
| `npx playwright test -c playwright.t1b.config.ts e2e/shell-flow.spec.ts` | **9/9** xanh (42,5 s) | `out/e2e-shell.txt` |
| `npx playwright test … e2e/m1.spec.ts e2e/screenshots.spec.ts` (thêm, để kiểm hồi quy) | **2 đỏ**, 1 xanh: m1 chờ heading 'Định vị nhanh…' ngay sau bước 2; screenshots chờ 'Chào Bang…' | `out/e2e-m1.txt` |
| `npx vite build` | exit 0; **không** có cảnh báo chunk > 500 KB; còn 8 cảnh báo "dynamic import will not move module" (do `src/games/*/index.ts`, không phải file T1-B) | `out/build.txt` |
| JS tải thật ở `#/` (vite preview + Chrome, gzip -9, chặn SW) | **135,9 KB gzip** (435,0 KB thô): `index-BHxVeG-7.js` + `registerSW.js`; CSS 37,2 KB gzip; 0 lỗi console. Ngưỡng 250 KB → đạt | `out/measure-js.json`, `out/measure-js.mjs` |
| `#/dev/components` trên bản build | rơi về Hôm nay ("Chào bạn · Hôm nay học gì?"); `dist/assets` không có chunk Dev/Speech; `grep "Thư viện component"` rỗng | như trên |
| `audit-ui --route today,hub,onboarding --vp 390x844,820x1180,1280x800 --theme dark,light` | **0 CHẶN · 146 NẶNG** trên 18 lượt: M5 68, M1 18, M2 18, M3 18, M4 18, D7 6 (D7 chỉ ở Hub). 0 tràn ngang, 0 vùng chạm < 44, 0 chữ < 12 ở cả 3 route | `out/review-T1-B-loi/BAO-CAO.md` |

Theo màn: today 7–8 NẶNG/lượt, hub 8–14, onboarding 5, tất cả là M1–M5 (mật độ hình, việc của T3-C) cộng D7 "FSRS" ở thẻ V1 của Hub (chuỗi nằm trong `src/games/registry.ts`, không phải file T1-B, đã ghi `HANDOFF.md` #3). Đã mở xem `390x844-dark-today-loi.png`, `390x844-light-onboarding-loi.png`, `1280x800-dark-hub-loi.png`: khung khoanh khớp mô tả, không thấy lỗi bị giấu.

Biên ngày (reviewer tự chạy `out/year-check.ts` bằng `vite-node`, `TZ=Asia/Ho_Chi_Minh`): 31/12 03:59 → `2026-12-30`; 01/01 03:59 → `2026-12-31`; 01/01 04:00 → `2027-01-01`; 01/03/2028 02:00 → `2028-02-29`; chuỗi 30/12 → 31/12 → 01/01 03:00 (vẫn là 31/12) → 01/01 09:00 = 3, không mất freeze; `displayStreakCount` lúc 04/01 03:59 = 3, lúc 04/01 04:00 = 0. Đúng cả khi qua năm.

## 2. Lỗi tìm thấy (xếp nặng → nhẹ)

| # | Màn/route | Khung + theme | Vị trí | Mã luật | Mức | Mô tả | Cách sửa đề xuất |
|---|---|---|---|---|---|---|---|
| 1 | `#/play/*` (chip), `#/exam` (GamePlaceholder) | mọi khung | `src/app/screens/PlayScreen.tsx:203`, `src/app/GamePlaceholder.tsx:23`, thang ở `src/core/adaptive/sessionLevel.ts:23-34` | B6, D7 (nhãn sai sự thật, U4) | **NẶNG** | Chip "Band ≈ x.x" dùng thang level 1–10 ↔ band 4.0–8.5, nhưng placement ghi level theo **thang khác**: từ vựng/reading band 8.0 → level 5 (`placementData.ts:419-428`, `readingPlacement.ts:289`), listening band 8.0 → level 8 (`listeningPlacement.ts:234`). Đã kiểm thật: placement 8.0 → V3 hiện **"Band ≈ 6.0"**, L1 hiện **"Band ≈ 7.5"**. Profile mới (level mặc định 1) hiện **"Band ≈ 4.0"** ở mọi game, kể cả `#/exam` ("Chế độ: Thi · Band ≈ 4.0") – người học ~6.0 thấy số sai. `HANDOFF.md` không nhắc lệch thang này | Thống nhất một thang: hoặc ghi `HANDOFF.md` để chủ `src/features/placement/**` đổi `recommendedLevel` sang `bandToLevel(estimatedBand)`, hoặc chip đọc `profile.estimatedBands[skill]` khi có; khi chưa có placement thì không hiện số band (vd "Luyện · chưa định vị"). Thêm test: placement 8.0 → chip "Band ≈ 8.0" |
| 2 | E2E chung | – | `e2e/m1.spec.ts:61` (chờ heading 'Định vị nhanh vốn từ học thuật' ngay sau `onboarding-next-2`), `e2e/screenshots.spec.ts:12` (chờ 'Chào Bang · Hôm nay học gì?') | P1, P6 | **NẶNG** (điều kiện merge) | Thay đổi F10/F11 làm 2 spec cũ đỏ; reviewer chạy lại xác nhận 2 failed. File không thuộc T1-B nên builder đúng khi không sửa và đã ghi bản vá cụ thể ở `HANDOFF.md` #1, #2. Nhưng nếu merge mà chưa áp bản vá thì bước `npm run e2e` của CI đỏ, và hành trình m1 (Placement → V1/V2/V3 → Stats) không còn được E2E kiểm trên nhánh này | AD áp bản vá `HANDOFF.md` #1, #2 (hoặc giao chủ file) **trước khi merge**, chạy lại m1 xanh |
| 3 | Onboarding bước 2 | 390×844 dark (`out/review-flow/onb-step2-390.png`, vùng ~ x40,y225,w310,h375) | `src/features/onboarding/OnboardingScreen.tsx:421` (`<select>`), `:483` (`type="date"`) | D10 | NẶNG (có từ trước, không do T1-B gây ra) | 4 `select` band và ô ngày thi là control gốc trình duyệt: mũi tên hệ thống, ô ngày hiện "mm/dd/yyyy" kiểu Mỹ trong app tiếng Việt. Công cụ không bắt vì chỉ chụp bước 1 | Bọc `appearance:none` + giao diện theo token, ô ngày theo định dạng `dd/mm/yyyy` (hoặc chọn tháng thi). Có thể để T3-A/T3-C, nhưng file thuộc T1-B nên cần ghi rõ chủ |
| 4 | `#/play/w1` (và mọi game tự focus ô gõ) | 1280×800 | `src/app/screens/PlayScreen.tsx:23,29` | F1 (an toàn tiến độ), bàn phím | NHẸ | Esc khi focus đang ở `input/textarea` bị bỏ qua hoàn toàn. Đã kiểm: W1 focus INPUT → Esc **không** mở hộp thoát. Với game tự focus ô gõ (V1 bước gõ, V2, L2) người chơi bàn phím không có cách mở hộp thoát bằng Esc, phải Tab tới nút X. Hành vi Esc-thoát cũ bị mất ở các màn này (không có trong tiêu chí F1, nhưng là chức năng cũ) | Cho Esc trong ô gõ mở hộp khi ô rỗng, hoặc Esc lần 1 bỏ focus ô, lần 2 mở hộp; vẫn giữ `defaultPrevented` |
| 5 | `#/onboarding` bước 2–3 | 390×844 dark (`onb-step2-390.png` y≈55–110; `onb-step3-390.png` y≈55–85, nút y≈660–725) | `OnboardingScreen.tsx` (autoFocus nút Tiếp tục ở bước 2/3) | D-, B5 tinh thần | NHẸ | Khi đi tiếp bằng Enter, `autoFocus` nút "Tiếp tục" cuộn trang xuống, tiêu đề bước bị header che mất nửa ("Chọn mục tiêu Band &", "Thử loa và micro"). Ở bước 3, 3 nút "Quay lại / Bỏ qua / Tiếp tục" xuống 2 dòng chữ ("Tiếp\ntục") | Đổi bước thì `scrollTo({top:0})` rồi `focus({preventScroll:true})`; nút "Bỏ qua" bước 3 chuyển thành link chữ nhỏ hoặc xếp dọc ở < 400 px |
| 6 | Recap "Tiếp" (F5) | – | `src/app/playTask.ts:45` | F5 | NHẸ | `findNextTask` tạo `path` không kèm `&mode=`, trong khi `TodayDashboard.startTask` có kèm `task.mode` khi khác `training`. Khi Recap nối nút "Tiếp" (T3-A), việc kế tiếp có `mode` exam/sprint sẽ mở sai chế độ | `path: playPath(...) + (next.mode !== 'training' ? '&mode='+next.mode : '')`, thêm test |
| 7 | `#/` để mở qua 04:00 | – | `src/features/today/TodayDashboard.tsx:194` (`useMemo(..., [])`), `:80` | F3 | NHẸ | `todayKey` chỉ tính một lần khi mount; để tab Hôm nay mở qua 04:00 thì phút hôm nay/việc đã xong vẫn theo ngày cũ tới khi reload. Shell (`useShellStats`) thì tính lại mỗi render nên hai nơi có thể lệch nhau | Tính lại theo `visibilitychange`/timer tới mốc 04:00 kế tiếp |
| 8 | test F3 | – | `src/core/gamification/streak.tz.test.ts` | F3 | NHẸ | Có biên 03:59/04:00 và qua tháng, **không** có test qua năm (31/12 → 01/01 trước/sau 04:00). Reviewer đã kiểm tay: đúng (mục 1), nhưng nên khoá bằng test | Thêm 3 assert qua năm như `out/year-check.ts` |

Ghi chú không tính lỗi:
- `src/core/adaptive/difficulty.ts:146-147` còn nhánh `fastMastery` (≥ 85% + nhanh) và `slowStruggle` (≤ 75% + chậm) ngoài luật B6; hiện **không kích hoạt** vì `applySessionLevel` không truyền `expectedTimeMs`. Nếu sau này game ghi `expectedTimeMs` thì ngưỡng sẽ lệch B6 – nên bỏ hoặc ghi `DECISIONS.md`.
- `replayLevelFromAttempts` chỉ xét đổi bậc ở cuối mỗi attempt (không theo từng lượt), nên một phiên 20 lượt đổi tối đa 1 bậc. Không trái B6 (cooldown là tối thiểu), chỉ ghi nhận.
- Hub còn 12 nút "Mở" cùng kiểu (D6) và mật độ hình M1–M5 – thuộc thiết kế lại Hub ở T3-C, có từ trước.
- Dữ liệu streak cũ khoá theo UTC có thể lệch 1 ngày một lần sau nâng cấp – builder đã ghi ở BAO-CAO §5, chấp nhận.

## 3. Rubric
Không chấm ở đợt 1.

## 3b. Tiêu chí ĐẠT từng mã lỗi T1-B

| Mã | P | Tiêu chí ĐẠT (nguồn) | Kết quả | Bằng chứng reviewer |
|---|---|---|---|---|
| F1 | P0 | V3 chọn span + Esc → vẫn ở `/play/v3`; Esc rảnh → hộp xác nhận; "Lưu và thoát" → `attempts.count()` +1 | **Đạt phần của T1-B**; phần "+1 attempt" ⏳ hợp lệ | e2e 1–4 xanh; tự bấm V1 390: Esc → hộp, focus "Chơi tiếp", Enter ở lại, Esc lần 2 đóng hộp, "Thoát" → `#/`. Code: bỏ listener cũ, capture + `setTimeout` đọc `defaultPrevented`, bỏ qua khi có `aria-modal` khác. Xác nhận: `grep registerProgressSaver src/games` = 0, game thuộc T1-A/T2-* → không thể lưu thật, hộp ghi trung thực "Thoát" + "chưa được lưu" |
| F2 / U18 / D9 | P1 | Số shell = số Hôm nay, không reload | Đạt | e2e 5 (1.234 → 2.000 XP sống); tự kiểm: streak gãy (`lastActiveDay=null`, count 4) hiện 0 ở shell, XP 340 |
| F3 | P1 (Done) | 08:00 T2, 06:30 T3, 08:00 T4 → `count=3`, freeze không giảm; `TZ=Asia/Ho_Chi_Minh` | Đạt; `isWeekend` UTC ⏳ hợp lệ | 24/24 test TZ; tự kiểm qua năm; `planner/today.ts:330 getUTCDay()` đúng là file chủ khác |
| F5 | P1 | Today → task 1 → Recap → "Tiếp" → `/play/<task2>` | Phần PlayScreen đạt; Recap ⏳ hợp lệ (T3-A) | Today → V1 mang `?from=today&task=`, thoát về `#/`; Hub → thoát về `/hub`. Lỗi #6 |
| F6 / G2 | P0 | `skillLevels.l1=3` → L1 nhận 3; 2 phiên V3 100% → phiên 3 tăng; cửa sổ 20, ≥ 90% +1, ≤ 65% −1, cooldown 10, exam giữ | Đạt (logic); **nhãn band sai thang – lỗi #1** | `sessionLevel.test.ts` 14 test; đọc code: `HIGH_ACCURACY=0.9` (`>=`), `LOW_ACCURACY=0.65` (`<=`), `windowSize=20`, `cooldownTurns=10`, `minSamples=10`, exam `continue`, idempotent qua `kv adaptive:<id>`; V3/R1 engine nhận level 1–10 |
| U4 | P1 | `grep "Mốc M\|Level 1 ·" src/app` = 0 | Đạt (grep = 0) nhưng số band sai – lỗi #1 | – |
| U2 | P1 | nút ≥ 44×44 ở 360 | Đạt | e2e 4; audit-ui 0 D3 |
| U17 | P3 | 5 link nav | Đạt | e2e 5; tự bấm 4 link sidebar, `aria-current` đúng |
| X5 | P1 (Done) | JS ở `#/` ≤ 250 KB gzip, không cảnh báo > 500 KB | **Đạt: 135,9 KB** | `out/measure-js.json`, `out/build.txt` |
| X6 | P2 (Done) | `grep -l "Thư viện component\|v1_fixtures" dist` rỗng | Route dev đạt; `v1_fixtures` ⏳ hợp lệ | Không chunk Dev/Speech, `#/dev/components` build → Hôm nay. `v1_fixtures` do `V1DailyRun.tsx`/`engine.ts` (T1-A) và `placementData.ts` import; không file T1-B nào import fixture |
| X10 | P2 (Done) | Lỗi ở Stats → sang Hôm nay hiển thị bình thường | Đạt | `routes.tsx:60 <ErrorBoundary key={location}>` (location = path, không gồm query nên không remount khi đổi query), màn lỗi có mã, "Thử lại", "Về Hôm nay" (44 px); `routes.test.tsx` xanh |
| F10 | P2 (Done) | 4 bước ≤ 90 s chỉ bằng Enter; `[15,30,45,60]`, mặc định 30 | **Đạt: 5,3 s** (script reviewer), 2,9 s (e2e) | `out/review-flow.mjs`: 4 heading đúng thứ tự, kết thúc `#/placement`, `dailyGoalMin=30`, `onboarding_done=true`, 0 lỗi console. Bước 3 có nghe mẫu, thử micro, 3 dòng giải thích, "Bỏ qua" |
| F11 | P3 | Profile mới → "Chào bạn" | Đạt | e2e 6; tự kiểm tên "Minh" → "Chào Minh" |
| F12 | P2 | "Đổi bài" 50 lần không ra game chưa sẵn sàng; Enter mở việc đầu | Đạt phần chính; dải 7 ngày ⏳ (T3-C) | `readyPlan.test.ts`, e2e 8; tự kiểm Enter trên nút "Đổi bài" chỉ đổi bài, không mở game |

## 4. Chức năng (bấm thử theo KE-HOACH, `out/review-flow.mjs`, `out/review-flow/*.png`, video `out/review-flow/video/*.webm`)
- Shell: logo, 5 mục nav sidebar (Thống kê, Thư viện, Cài đặt, Hôm nay đã bấm), tab bar mobile (e2e đếm 5 link), streak/XP thật, đánh dấu mục đang mở – **còn**. Ẩn shell ở `/play/*` – còn.
- PlayScreen: nút X (hỏi trước), tên game, chip, nút âm (44 px), "Không tìm thấy chế độ "zzz"" + "Quay lại Hub" – **còn**; skeleton khi tải – còn. Esc trong ô gõ – **đổi hành vi** (lỗi #4).
- Hub: 7 tab lọc (lọc Listening → 2 thẻ), nút "Mở" → `/play/v1`, thoát về `/hub` – **còn**.
- Hôm nay: kế hoạch 3 việc (l1, r1, w2 với profile mới), "Bắt đầu" mang cờ `from=today`, "Đổi bài", Enter mở việc đầu – **còn**. Banner onboarding, streak/XP badge – còn.
- Onboarding: tên, Quay lại (giữ tên), chọn 15 phút, Tiếp tục, bước Thiết bị (Nghe câu mẫu phát được, Thử micro, Bỏ qua), "Bỏ qua để vào Hôm nay ngay" → `#/` lưu 15 phút + tên – **còn**. Chưa bấm: "Kiểm tra dữ liệu cũ", "Thử micro" (cần quyền).
- ErrorBoundary: chỉ kiểm qua `routes.test.tsx` (không gây lỗi được trên UI thật).
- `#/exam`: hiện placeholder X1 "Sắp có…", chip band sai (lỗi #1).
- 0 lỗi console trong mọi luồng reviewer chạy.

## 5. So với tham chiếu
Không áp dụng đợt 1 (chưa chấm thẩm mỹ).

## 6. Luật script chưa đo, đã kiểm bằng cách nào
- **A1 / Q4 / Q5 (git diff):** `git diff --name-only master...HEAD` = 82 file, tất cả trong danh sách độc quyền T1-B (`src/app/**` không gồm `LegacyScreen.tsx`, `src/core/adaptive/**`, `src/core/gamification/**`, `src/features/today/**`, `src/features/onboarding/**`, `e2e/shell-flow.spec.ts`, `docs/audit-max/{KE-HOACH,BAO-CAO}-T1-B.md`, `HANDOFF.md`, `anh-sau/T1-B/**`). Không đụng `cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `scripts/qa|validate/**`, `package.json`. Diff không thêm `test.skip/fixme/only`, `data-audit-ignore`, `navigator.webdriver`, `opacity:0`. Có 1 `aria-hidden` trên nhãn "Enter" 12 px trong nút "Bắt đầu" (gợi ý phím trùng nghĩa, chữ ≥ 12 px) – không phải giấu chữ nhỏ.
- **D6:** hộp thoát có 1 nút primary ("Chơi tiếp"). Hôm nay giữ 1 nút primary cho việc kế tiếp.
- **Q1:** BAO-CAO-T1-B không có điểm tự chấm, không có chữ cấm.
- **P3:** kiểm trên `dist/` (mục 1).
- **B6:** đọc code + test (mục 3b F6).
- **J/M/K:** không thuộc phạm vi T1-B, không chấm.

## 7. Phán quyết: **ĐẠT** (kèm điều kiện merge)
Không có lỗi CHẶN. Các mã P0/Done của T1-B (F1, F2, F3, F6, X5, X6, X10, onboarding 4 bước ≤ 90 s bằng Enter) đều đạt phần thuộc file của T1-B; các phần ⏳ (lưu giữa phiên cần game đăng ký saver, `isWeekend` ở planner, nút "Tiếp" trong Recap, `v1_fixtures` trong chunk V1, dải 7 ngày) đã xác nhận đúng là file của task khác.
Điều kiện trước khi merge: (1) áp bản vá `HANDOFF.md` #1, #2 để `e2e/m1.spec.ts`, `e2e/screenshots.spec.ts` xanh lại (lỗi #2); (2) sửa lỗi #1 (chip band sai thang) trong 1 vòng fixer hoặc chuyển thành mục `HANDOFF.md` có chủ cho placement. Lỗi #3–#8 sửa trước khi merge theo mức NHẸ/NẶNG của `LUAT.md` §Z.
