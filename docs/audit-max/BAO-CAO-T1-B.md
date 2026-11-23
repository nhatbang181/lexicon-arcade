# BAO-CAO T1-B · Shell, vòng lặp ngày, độ khó thích ứng

Nhánh `audit-max/T1-B` (worktree `D:\English-wt\T1-B`), 23/11/2026. Báo cáo chỉ ghi việc đã làm và số đo; không có điểm tự chấm.

## 1. Mã lỗi

| Mã | Trạng thái | Việc đã làm / lý do chưa xong | Bằng chứng |
|---|---|---|---|
| F1 | ✅ (một phần ⏳) | Bỏ Esc toàn cục. `PlayScreen` mở hộp "Thoát phiên này?" (mặc định focus "Chơi tiếp"); bỏ qua Esc khi `defaultPrevented`, khi đang có hộp thoại khác, khi gõ trong ô nhập, khi IME. ⏳ "Lưu và thoát" chỉ ghi được tiến độ khi game đăng ký `registerProgressSaver`; chưa game nào đăng ký (file của chủ khác, `HANDOFF.md` #5) nên nhãn hiện "Thoát" và nói rõ chưa lưu | `e2e/shell-flow.spec.ts` test 1–4 |
| F2, U18 | ✅ | Shell (sidebar + header mobile) đọc `profile.streak`, `profile.xp` bằng `useLiveQuery`; cập nhật sống không cần reload | e2e "shell đọc streak/XP thật" (5 ngày, 1.234 XP, đổi sang 2.000 XP) |
| F3 | ✅ (một phần ⏳) | `formatDateKey` theo giờ địa phương, chuyển ngày 04:00; `attemptRepo`, `planner/today.ts` dùng chung hàm nên đúng theo. ⏳ `isWeekend` trong `planner/today.ts` còn `getUTCDay()` (file chủ khác, `HANDOFF.md` #6) | `streak.tz.test.ts`: 08:00 T2, 06:30 T3, 08:00 T4 → `count=3`, freeze không giảm |
| F5 | ✅ phần PlayScreen · ⏳ Recap | Today mở `#/play/<game>?from=today&task=<id>[&mode=]`; `onExit` về `#/` nếu từ Hôm nay, về Hub nếu từ Hub; PlayScreen tính `nextTask` từ kế hoạch ngày và truyền `from`, `nextTask`, `onNextTask` vào game. ⏳ Nút "Tiếp" trong Recap thuộc T3-A (`HANDOFF.md` #3, #4) | e2e "Hôm nay -> game -> về #/" |
| F6, G2 | ✅ phần PlayScreen và core · ⏳ game tiêu thụ | `core/adaptive/sessionLevel.ts` + `applySessionLevel.ts`: cửa sổ 20 lượt, ≥ 90% +1, ≤ 65% −1, cooldown 10, exam bỏ qua; ghi `profile.skillLevels[game]`; PlayScreen đọc level và `?mode=`, truyền `level`, `mode`. `l2` tự quản level riêng và `x1` là thi nên không áp. ⏳ Chưa có E2E "V3 phiên 3 `timeLimitSec` giảm" vì cần chơi trọn phiên; đã có test DB: 2 phiên V3 đúng 100% → level 3 → 4 | `sessionLevel.test.ts` (14 test), e2e chip `Band ≈ 6.0 · Luyện` / `Tốc độ` |
| U4 | ✅ | Chip "Band ≈ x.x · Luyện/Thi/Tốc độ"; Hub hiện chế độ thay "Level 1 · Mốc M1"; `GamePlaceholder` hết "Level N" | `grep -rn "Mốc M\|Level 1 ·" src/app` = 0 |
| U2 | ✅ | Nút thoát, nút âm, logo/link header `w-11 h-11 shrink-0` (44 px), tên game `min-w-0 truncate` | e2e đo `boundingBox` ≥ 44 ở 360 px |
| U17 | ✅ | Logo + 5 mục nav (sidebar và tab bar) là `Link` → `<a href="#/…">` | e2e: 5 link sidebar, 5 link mobile, `href="#/hub"` |
| X5 | ✅ | `React.lazy` mọi route trừ Hôm nay + `Suspense` skeleton | mục 3 |
| X6 | ✅ phần route dev · ⏳ fixture | `/dev/components`, `/dev/speech` chỉ khi `import.meta.env.DEV`; bản build không còn chunk `SpeechDevScreen`/`DevComponentsScreen`, `grep -l "Thư viện component" dist/assets/*.js` rỗng. ⏳ `v1_fixtures` còn trong chunk V1 (file của T1-A) | build |
| X10 | ✅ | `ErrorBoundary key={location}`; màn lỗi có mã `ERR_UI_BOUNDARY`, "Thử lại", "Về Hôm nay" | `routes.test.tsx`: lỗi ở Thống kê → sang `/` hiển thị bình thường |
| F10 | ✅ | Onboarding 4 bước (Chào mừng, Mục tiêu, Thiết bị, Định vị), lựa chọn `[15, 30, 45, 60]` mặc định 30, Enter đi tiếp mọi bước, bước Thiết bị có nghe câu mẫu, thử micro, 3 dòng giải thích Claude chấm, "Bỏ qua" | e2e Enter ×4 (toàn test ≈ 3 s, giới hạn 90 s) |
| F11 | ✅ | Tên mặc định "bạn", chỉ dùng tên người học nhập; bỏ trống thì xoá `kv.display_name` | e2e "Chào bạn · Hôm nay học gì?" |
| F12 | ✅ phần chính · ⏳ dải 7 ngày | Bỏ `READY_M1_GAMES`, `normalizePlanForM1`; kế hoạch (cả bản đã lưu) được lọc `isGameReady`; "Đổi bài" chỉ chọn game sẵn sàng chưa dùng; Enter mở việc đầu chưa xong. ⏳ "dải 7 ngày", "câu thắng gần nhất" thuộc thiết kế lại Hôm nay (T3-C), không nằm trong 6 việc của T1-B | `readyPlan.test.ts` (50 lần đổi), e2e 12 lần đổi |

## 2. File sửa (`git diff --name-only master...HEAD`)
`src/app/{App,ErrorBoundary,GamePlaceholder,routes}.tsx`, `src/app/screens/{HubScreen,PlaceholderScreens,PlayScreen}.tsx`; mới: `src/app/{hashRouter,playTask,useShellStats}.ts`, `src/app/routes.test.tsx`; `src/core/adaptive/{difficulty,index}.ts`, mới `sessionLevel.ts`, `applySessionLevel.ts`, `progressSaver.ts`, `sessionLevel.test.ts`; `src/core/gamification/streak.ts`, mới `streak.tz.test.ts`; `src/features/today/TodayDashboard.tsx`, mới `readyPlan.ts`, `readyPlan.test.ts`; `src/features/onboarding/OnboardingScreen.tsx`; `e2e/shell-flow.spec.ts`; `docs/audit-max/{KE-HOACH-T1-B,BAO-CAO-T1-B,HANDOFF}.md`, `docs/audit-max/anh-sau/T1-B/**`. Không thêm thư viện. `playwright.t1b.config.ts` không commit.

## 3. Số đo trước → sau

| Phép đo | Trước | Sau |
|---|---|---|
| JS chunk vào ở `#/` (gzip, báo cáo `vite build`) | `index` 343,02 KB (1 120,64 KB thô) | `index` 139,31 KB (445,26 KB thô) |
| JS thực tải ở `#/` (gzip -9, đo bằng Chrome trên `vite preview`) | 334,4 KB | 135,9 KB |
| Cảnh báo chunk > 500 KB | có | không |
| `npx tsc --noEmit -p .` | 0 lỗi | 0 lỗi |
| `npm test` | 377 (số của audit) | 399 test, 35 file, xanh |
| `TZ=Asia/Ho_Chi_Minh vitest run src/core/adaptive src/core/gamification` | – | 24 test, xanh (cũng xanh với `TZ=UTC`) |
| `npm run validate:data` | PASS | PASS |
| `e2e/shell-flow.spec.ts` | – | 9/9 |
| `e2e/m2`, `m3`, `m4`, `screenshots` (legacy) | – | xanh |
| `e2e/m1.spec.ts`, `e2e/screenshots.spec.ts` (Today) | xanh | đỏ do onboarding 4 bước và "Chào bạn" (file ngoài quyền, đã ghi bản vá ở `HANDOFF.md` #1, #2) |

`audit-ui` (route today, hub, onboarding, play/v1; 390×844 + 1280×800; dark + light = 16 lượt; nền lấy từ `anh-goc-loi/report.json`; công cụ nền chưa có mã M3 nên M3 tách riêng):

| Mã | Trước | Sau |
|---|---|---|
| D3 vùng chạm < 44 | 62 | 2 (đều ở V1) |
| D4 chữ < 12 px | 59 | 11 (đều ở bản đồ node V1) |
| D5 tràn ngang | 0 | 1 (bản đồ node V1, lúc có lúc không) |
| D7 thuật ngữ nội bộ | 38 | 6 (Hub, chữ "FSRS" lấy từ `registry.ts`) |
| J9 | 4 | 2 (V1) |
| M1 / M2 / M4 / M5 | 12 / 12 / 12 / 38 | 12 / 12 / 12 / 42 (mật độ hình, việc của T3-C) |
| M3 | không đo | 12 (chưa có nhân vật, T3-C) |
| CHẶN tổng | 59 | 12 (toàn bộ ở `play/v1`, file của T1-A) |
| NẶNG tổng (không tính M3) | 178 | 88 |

Ảnh: `docs/audit-max/anh-sau/T1-B/` (`<khung>-<theme>-<route>.png`, `*-loi.png`, `BAO-CAO.md`, `report.json` cho cả 820×1180), ảnh sau tương tác `sau-tuong-tac-1…4-*.png` (Hôm nay với streak/XP thật, vào game từ Hôm nay, hộp Esc, quay về `#/`), video `video-esc-hoi-thoat-390.webm`. Đã mở xem các ảnh `*-loi.png` của today, hub, onboarding, play/v1.

Trên today/hub/onboarding (3 khung × 2 theme) không còn mã nào ngoài M1–M5 và D7 của Hub.

## 4. Chức năng giữ nguyên (đối chiếu `KE-HOACH-T1-B.md`)
Shell: logo → Hôm nay, 5 mục nav ở sidebar và tab bar, đánh dấu mục đang mở, ẩn shell ở `/play/*`, `/legacy`, `/exam`. PlayScreen: nút thoát, tên game + chấm kỹ năng, bật/tắt âm, màn "Không tìm thấy chế độ", skeleton khi tải. Hub: 7 tab lọc, 12 thẻ (bấm thẻ hoặc "Mở"). Hôm nay: banner onboarding, streak + freeze, XP, vòng mục tiêu, danh sách việc, Đổi bài, Bắt đầu/Chơi lại, EmptyState, 4 BandMeter, ô overall, ô kho thẻ. Onboarding: tên, kiểm tra dữ liệu cũ, 4 select band, thời lượng ngày, ngày thi, Quay lại/Tiếp tục, Bỏ qua, Làm Placement. ErrorBoundary: Thử lại. Mới thêm: hộp thoát, thử loa/micro, "Về Hôm nay". Đã bấm thử bằng E2E: Esc ×3 trường hợp, X, nav, Today → game → `#/`, Đổi bài, onboarding Enter; m2/m3/m4 (R1, R2, L1, L2, W1, W2, Portfolio) vẫn xanh. Chưa bấm thử bằng tay: nút "Thử micro" (cần cấp quyền trình duyệt), "Kiểm tra dữ liệu cũ".

## 5. Quyết định (chưa ghi `DECISIONS.md`, để điều phối gộp)
- 23/11 · T1-B · `formatDateKey` theo giờ địa phương, chuyển ngày 04:00 (`DAY_ROLLOVER_HOUR`); khoá ngày lưu trong DB trước đó theo UTC có thể lệch tối đa 1 ngày ở lần đầu sau nâng cấp; không migrate.
- 23/11 · T1-B · Ngưỡng độ khó theo LUAT B6: `>= 0.9` lên, `<= 0.65` xuống (trước `> 0.9`, `< 0.7`); thang chung level 1–10 ↔ band 4.0–8.5.
- 23/11 · T1-B · `applySessionLevel` chạy khi mở PlayScreen và khi thoát; nhớ attempt đã tính ở `kv['adaptive:<gameId>']`; `l2` (thang bậc riêng) và `x1` (thi) bỏ qua.
- 23/11 · T1-B · Router của app (`src/app/hashRouter.ts`) đặt query trong hash (`#/play/v1?from=today`) thay vì `location.search` để cờ không dính sang màn khác; không đổi cú pháp URL cũ không có query.
- 23/11 · T1-B · "Lưu giữa phiên" qua đăng ký `registerProgressSaver` ở `core/adaptive/progressSaver.ts` (không tạo attempt rỗng, vì Hôm nay coi mọi attempt trong ngày là việc đã xong).
- 23/11 · T1-B · Bỏ `KeyHint` (11 px, vi phạm D4) khỏi Hôm nay, thay bằng nhãn "Enter" 12 px.

## Vòng fixer 1 (23/11/2026)

Nguồn: `REVIEW-T1-B-A.md`. Không tự chấm điểm. Chỉ sửa file độc quyền T1-B.

| Mã lỗi (review) | Đã sửa thế nào | File | Test chứng minh |
|---|---|---|---|
| NẶNG #1 – chip "Band ≈" sai thang, "Band ≈ 4.0" ở profile mới, Exam hiện nhãn luyện (B6, D7) | Một cặp `bandToLevel`/`levelToBand` duy nhất trong `sessionLevel.ts`. `applySessionLevel` lấy band định vị (`estimatedBands` L/R/W/S; từ vựng: bản ghi band mới nhất của `v1`) và đặt level bằng `bandToLevel(band)`, đặt lại khi placement đổi band (nhớ `seedBand` trong kv `adaptive:<game>`); trả thêm `calibrated`. Chip dùng chung `playChipLabel`: thi chỉ "Thi", chưa định vị chỉ "Luyện" (không bịa số), đã định vị "Band ≈ x.x · Luyện". Hệ quả cần biết: level truyền cho game theo placement nay là thang chung 1–10 (band 8.0 → 9), thay cho số `recommendedLevel` theo thang riêng của từng placement | `core/adaptive/sessionLevel.ts`, `applySessionLevel.ts`, `app/screens/PlayScreen.tsx`, `app/GamePlaceholder.tsx` | `sessionLevel.test.ts` (placement 8.0 với level lệch 8/5 → "Band ≈ 8.0 · Luyện"; v3 từ bản ghi v1; profile mới → "Luyện"; exam → "Thi"; đặt lại khi band đổi), e2e shell-flow #6 (chip theo `estimatedBands.R = 8.0`, `#/exam` không có "Band ≈" hay "Luyện") |
| NẶNG #3 – select gốc và ô "mm/dd/yyyy" (D10) | Bước 2: 4 `select` thành stepper − / giá trị / + (nút 44 px, tab được, Enter/Space), ô ngày thành ô chữ `dd/mm/yyyy` tự chèn dấu `/`, báo lỗi khi ngày không có trên lịch; lưu ISO như cũ | `features/onboarding/OnboardingScreen.tsx` | `examDate.test.ts`, e2e shell-flow #10 (0 `select`, 0 `input[type=date]`, stepper, mặt nạ ngày, báo lỗi), e2e "Enter x4" vẫn 2,8 s (≤ 90 s) |
| NHẸ #5 – tiêu đề bước 2–3 bị header che; nút "Tiếp tục" rớt 2 dòng | Bỏ `autoFocus` ở bước 2–4; đổi bước thì cuộn về đầu rồi `focus({preventScroll:true})` vào nút chính của đúng bước; hàng nút bước 3 `flex-wrap` + `whitespace-nowrap` | `OnboardingScreen.tsx` | e2e shell-flow #10 (tiêu đề bước 2 và 3 nằm dưới header ở 390×844, nút bước 3 được focus, cao < 60 px); ảnh `anh-sau/T1-B/sau-vong1-onb-buoc2-390-dark.png`, `sau-vong1-onb-buoc3-390-dark.png` |
| NHẸ #6 – `playTask.ts` thiếu `&mode=` | `playPath(gameId, origin, taskId, mode)` thêm `mode` khi khác `training`; `findNextTask` và nút "Bắt đầu" dùng chung | `app/playTask.ts`, `features/today/TodayDashboard.tsx` | `app/playTask.test.ts` |
| NHẸ #7 – `todayKey` của Hôm nay đứng yên qua 04:00 | `todayKey` thành state; hẹn giờ tới mốc 04:00 kế tiếp (`msUntilNextDay`), kiểm lại khi `focus`/`visibilitychange`; đổi ngày thì nạp lại kế hoạch | `features/today/TodayDashboard.tsx`, `core/gamification/streak.ts` | `streak.tz.test.ts` (`msUntilNextDay` 03:59 → 60 s, 04:00 → 24 h, qua năm) |
| NHẸ #8 – thiếu test qua năm | Thêm: 31/12 03:59 → `2026-12-30`; 01/01 03:59 → `2026-12-31`; 01/01 04:00 → `2027-01-01`; chuỗi 30/12 → 01/01 09:00 = 3, freeze không giảm | `core/gamification/streak.tz.test.ts` | chạy với `TZ=Asia/Ho_Chi_Minh` |
| NHẸ #4 – Esc trong ô gõ | Không sửa (theo chỉ đạo): `PlayScreen` đã tôn trọng `defaultPrevented`; người chơi bàn phím ở ô gõ dùng Tab tới nút X. Ghi nhận để T1-A/T2-* quyết định nếu muốn Esc 2 bước | – | – |

Số đo sau vòng 1: `npx tsc --noEmit -p .` 0 lỗi; `npm test` 412/412 (37 file); `TZ=Asia/Ho_Chi_Minh vitest run src/core/adaptive src/core/gamification` xanh; `playwright test -c playwright.t1b.config.ts e2e/shell-flow.spec.ts` 10/10; `audit-ui --route today,onboarding --vp 390x844,1280x800` (dark + light): 0 CHẶN, 50 NẶNG toàn bộ M1–M5 (mật độ hình, việc của T3-C), không còn D3/D4/D5/D7/D10. Báo cáo và ảnh của lần chạy này: `anh-sau/T1-B/BAO-CAO-vong1.md`, `report-vong1.json`, `*-loi.png`. Chưa đổi `e2e/m1.spec.ts`, `e2e/screenshots.spec.ts` (đã giao T1-C).
