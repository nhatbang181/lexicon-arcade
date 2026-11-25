# REVIEW T3-C – Reviewer B – model Gemini 4 Hydrogen High

> Đánh giá độc lập chấm mù trên worktree `D:\English-wt\T3-C` (nhánh `audit-max/T3-C` @ `b39423c`, đã merge `T3-A`). Không đọc `REVIEW-T3-C-A.md`, không sửa mã nguồn.

## 0. Chấm mù (làm ĐẦU TIÊN, trước khi mở `key.json`)

- Bộ ảnh mới chụp bằng: `BASE_URL=http://localhost:5249 node docs/audit-max/cong-cu/audit-ui.mjs --route today,hub,stats,settings,onboarding --vp 390x844,1280x800 --theme dark,light --fmt jpg --no-loi 1 --out out/rv-t3-c-b/blind-new`
- Trộn với `docs/audit-max/anh-goc` bằng `tron-anh.mjs` → **20 cặp / 40 ảnh** `shuffle-001.jpg`..`shuffle-040.jpg`.
- Toàn bộ điểm R2, R4, R5, R6 được chấm và ghi đầy đủ vào `out/rv-t3-c-b/cham-mu/PHIEU-CHAM.md` **trước** khi mở `out/rv-t3-c-b/cham-mu/key.json`.

### Tổng hợp giải mã (`Mới − Gốc`)

| Màn (`route`) | Số cặp | TB Ảnh Gốc | TB Ảnh Mới | Chênh lệch (`Mới − Gốc`) | Ngưỡng (`≥ +3.0`) |
|---|---|---|---|---|---|
| `today` | 4 | 3.56 *(4.42 nếu bỏ 1 ảnh gốc trắng)* | 8.59 | **+5.03** *(+4.17)* | Đạt |
| `hub` | 4 | 4.25 | 8.66 | **+4.41** | Đạt |
| `stats` | 4 | 4.25 | 8.75 | **+4.50** | Đạt |
| `settings` | 4 | 4.31 | 8.38 | **+4.06** | Đạt |
| `onboarding` | 4 | 4.81 | 8.78 | **+3.97** | Đạt |
| **Trung bình chung** | **20** | **4.24** | **8.63** | **+4.39** | **Đạt** |

---

## 1. Kết quả tự chạy lại

### 1.1 `audit-ui.mjs` (7 khung `390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768` × 2 theme × 5 route = **70 lượt**, lưu tại `out/rv-t3-c-b/full`)
- **Tổng:** **`0 CHẶN · 0 NẶNG · 0 NHẸ`** trên **70/70 lượt** (kể cả `LiveCard` sau khi merge `T3-A` không còn lỗi `M5`).
- Các màn khung (`today`, `hub`, `stats`, `onboarding`): `tràn = 0`, `chạm < 44 = 0`, `chữ < 12 = 0`, `icon màu ≥ 6` (`6–12`), `hình lớn ≥ 1`, `nhân vật = 1`, `chuyển động = 1`.
- Lưu ý trên `settings` (không thuộc tập `FRAME` trong `audit-ui.mjs`): `chuyển động = 0` trên 14/14 lượt, `icon màu = 4` ở 3 khung mobile, `hình lớn = 0` ở `820x1180` và `1180x820`.
- Kiểm `reduced-motion` (`--vp 390x844 --theme dark --reduced 1`, lưu tại `out/rv-t3-c-b/reduced`): **`0 CHẶN`** (`0` lỗi `J8` infiniteAnims; 4 báo `M4` do hiệu ứng đã dừng đúng theo `prefers-reduced-motion`).

### 1.2 Cổng kỹ thuật (`KIEM-THU.md` §2) & chống gian lận (`07` §5)
| Kiểm | Lệnh | Kết quả thật |
|---|---|---|
| Chống gian lận `git diff` | `git diff --name-only master...HEAD` & kiểm file cấm | Chỉ chạm file của T3-C (`App.tsx`, `HubScreen.tsx`, `TodayDashboard.tsx`, `StatsScreen.tsx`, `SettingsScreen.tsx`, `OnboardingScreen.tsx`, `PlacementScreen.tsx`, `core/**`, `e2e/daily-loop.spec.ts`, `docs/audit-max/**`); **0** thay đổi trong `docs/audit-max/cong-cu`, `LUAT.md`, `KIEM-THU.md`, `scripts/qa`, `scripts/validate`. |
| Kiểu TypeScript | `npx tsc --noEmit -p .` | **0 lỗi** |
| Unit & Component test | `npm test` | **57/57 file pass, 611/611 test pass** (`14.51s`) |
| Dữ liệu (dev) | `npm run validate:data` | **PASS (dev)** — 0 lỗi schema/invariant, `153/153` asset credited (100%). |
| Spot check `sha256` manifest | Đối chiếu 10 dòng đầu `scripts/assets/assets.manifest.json` | **10/10 khớp sha256** (`153` mục trong manifest). |
| E2E vòng lặp ngày | `PW_PORT=5259 PW_CHANNEL=chrome npx playwright test e2e/daily-loop.spec.ts --project=chromium` | **5/5 pass** (`31.4s`), **0** `console.error`. |
| Bundle & rò dev/test | `npx vite build && node scripts/qa/size-budget.mjs` | **0 vượt, 0 chuỗi rò** — JS `#/`: **214.76 KB gzip** (≤ 250), CSS chính (raw): **69 KB** (≤ 130), Chunk lazy lớn nhất: `legacyEntry` **45.3 KB gzip** (≤ 120), Precache PWA (121 file): **1 351.64 KiB** (≤ 1 500). |
| Thuật ngữ nội bộ | `node scripts/qa/internal-jargon.mjs` | **0 chỗ** trong các file thuộc T3-C (2 chỗ còn lại nằm ở `src/games/v1-daily-run/*`). |
| Màu cứng | `node scripts/qa/hardcoded-colors.mjs` | **0 chỗ** trong các file thuộc T3-C (7 chỗ còn lại ở `PortfolioScreen.tsx` & `W1EssayLab.tsx`). |

---

## 2. Lỗi tìm thấy (6 điểm cụ thể, xếp nặng → nhẹ)

| # | Màn/route | Khung + theme | Vị trí (`x,y,w,h` trên ảnh) / File | Mã luật | Mức | Mô tả | Cách sửa đề xuất |
|---|---|---|---|---|---|---|---|
| 1 | Hôm nay (`#/`) | `1366x768` tối (`1366x768-dark-today.png`) | `(987,293,185,44)` & `(350,738,280,44)` (`TodayDashboard.tsx:677,750,979,1010`) | **D6** | **NẶNG** | Có **2 nút `variant="primary"`** (xanh dương) cùng xuất hiện trên màn đầu: `"Bắt đầu thiết lập →"` ở banner trên và `"Khám phá 12 Chế độ (Hub) →"` ở `EmptyState` dưới. Khi có kế hoạch ngày, cả nút `"Bắt đầu ngay"` ở thẻ `"Việc tiếp theo"` và nút `"Bắt đầu"` ở nhiệm vụ #1 cũng cùng dùng `variant="primary"`. | Giữ đúng 1 nút `primary` trên toàn màn Hôm nay: đổi nút `EmptyState` thành `secondary` khi banner Onboarding đang hiện, và đổi nút `"Bắt đầu"` trong danh sách nhiệm vụ thành `secondary` vì thẻ `"Việc tiếp theo"` phía trên đã là `primary`. |
| 2 | Cài đặt (`#/settings`) | Mọi khung (`SettingsScreen.tsx:688,839`) | Hàng chọn `15/30/45/60/90 phút` (`variant="primary"`) & nút `"Sao lưu trước khi cài"` (`variant="primary"`) | **D6** | **NẶNG** | Trên cùng trang Cài đặt có đồng thời **2 nút `variant="primary"`** (nút thời lượng mục tiêu đang chọn và nút `"Sao lưu trước khi cài"`). | Giữ `"Sao lưu trước khi cài"` làm nút `primary` duy nhất của trang, còn chip thời lượng đang chọn dùng style active viền/nền nhạt giống 3 thẻ chọn theme. |
| 3 | Hub (`#/hub`) + Sheet | `390x844` tối (`390x844-dark-hub-sheet.png`, `390x844-daily-loop.webm` @ `00:04`) | `(0,784,390,60)` (`App.tsx:317` `z-40` vs `tokens.css:107` `--z-sheet: 30`) | **R5** | **NHẸ** | Khi mở `Sheet` chọn chế độ trên mobile (`390x844`), thanh Bottom Tab Bar (`z-40`) nằm đè lên mép dưới của `Sheet` (`--z-sheet: 30`), che viền dưới thẻ `"Thi"` và sát mép nút `"Bắt đầu · Thi ▷"`. | Hạ thanh điều hướng đáy trong `App.tsx:317` xuống `z-20` (dưới `--z-sheet: 30`) hoặc tăng `--z-sheet` và thêm `pb-20 sm:pb-6` cho nội dung `Sheet`. |
| 4 | Hôm nay (`#/`) | `375x667` tối (`375x667-dark-today.png`) | `(42,602,200,7)` | **R5** | **NHẸ** | Trên màn iPhone SE `375x667`, phần Hero + 3 chip thông số đẩy nút CTA chính `"Bắt đầu thiết lập →"` xuống sát mép thanh điều hướng đáy, bị cắt chỉ còn lộ ~7px đỉnh nút trong màn đầu. | Giảm nhẹ `min-h` Hero trên `< 390px` hoặc xếp 3 chip mục tiêu/chuỗi/XP gọn hơn để nút `"Bắt đầu thiết lập"` nằm trọn trên thanh nav. |
| 5 | Cài đặt (`#/settings`) | `375x667` & `1366x768` sáng (`375x667-light-settings.png`, `1366x768-light-settings.png`) | `(950,415,120,28)` trên `1366x768-light-settings.png`; thanh range (`SettingsScreen.tsx:782`) | **R2 / R4** | **NHẸ** | Màn Cài đặt có `anims = 0` trên 14/14 lượt đo (yên tĩnh hoàn toàn), `bigPictures = 0` ở `820x1180` & `1180x820`, `input[type=range]` gộp cả `min-h-[44px]` và `h-2` trực tiếp trên thẻ `<input>`. (Pill `"Đang dùng: Tối"` ở ảnh sáng là do script test đổi trực tiếp `data-theme` trên `<html>`). | Thêm chuyển động nhẹ cho Hero/icon ở Cài đặt (tôn trọng `reduced-motion`), nâng `md:min-h-[190px]` cho Hero và đặt `input[type=range]` cao `h-2` bọc trong vùng bấm `min-h-[44px]`. |
| 6 | Hub (`#/hub`) & Planner (`today.ts`) | `390x844` tối (`390x844-dark-hub.png`) & `today.ts:586-590` | `(340,415,50,44)` trên `390x844-dark-hub.png`; `HubScreen.tsx:151`; `390x844-daily-loop.webm` @ `00:07` | **R1 / R5** | **NHẸ** | (a) Dải tab lọc trên `390x844` tràn ngang cắt mép phải không có fade gợi ý cuộn; (b) `line-clamp-3` có thể cắt `…` mô tả dài (như `S1`); (c) `today.ts:586-590` nhánh `PP-10` ưu tiên `['s2', 's1']` (game `coming_soon`) nên phụ thuộc `ensureReadyTasks` ở caller; (d) video `390x844-daily-loop.webm` ghi thoại cũ `"Tuỳ chỉnh giao diện"` ở Settings. | Thêm mask/fade mép phải tablist mobile, lọc game ready trong `today.ts` hoặc ưu tiên `w2` trước `s2`, và quay lại video sau bản sửa cuối. |

---

## 3. Rubric (`KIEM-THU.md` §3)

| Tiêu chí | Trọng số | Điểm | Lý do (dẫn tên ảnh) |
|---|---|---|---|
| R1 · Sư phạm | 15% | **9.0** | Đạt mốc 7→10: đủ Four Strands (`PP-06`), việc sản xuất ngày ≥ 20p (`PP-10`), Từ vững `≥ 21 ngày & ≥ 3 đúng` (`PP-16`), giữ nhớ `≥ 7 ngày` (`PP-07`) thể hiện rõ trên `1366x768-dark-stats.png` và `1366x768-dark-today.png`; trừ nhẹ vì `buildTodayPlan` còn gợi ý `s1/s2` trước lớp lọc `ensureReadyTasks`. |
| R2 · Cảm giác game | 15% | **8.5** | Vượt mốc 7 rõ rệt: thẻ `LiveCard`, Hero có chiều sâu minh họa + Lexi + icon 3D Fluent + Sheet chọn chế độ trên `390x844-dark-hub.png` và `1366x768-light-hub.png`; chưa đạt 10 do vài khối Cài đặt vẫn giống thẻ form và `390x844-dark-hub-sheet.png` chạm mép nav đáy. |
| R3 · Juice | 10% | **8.5** | `TodayDashboard` có `celebrate('dailyGoal')`, thẻ `LiveCard`, `Mascot` phản ứng trạng thái (`375x667-dark-today.png`), 3 công tắc motion nối `useMotionPref` (`out/rv-t3-c-b/reduced` đạt 0 `J8`); trừ nhẹ vì màn Cài đặt tĩnh (`anims=0`). |
| R4 · Mật độ hình & nhân vật | 10% | **9.0** | Gần mốc 10: toàn bộ 4 màn khung (`today`, `hub`, `stats`, `onboarding`) ở `375x667`, `390x844`, `1280x800`, `1366x768` đều có Hero ≥ 15%, Lexi 76px không đè chữ, 6–12 icon 3D Fluent riêng biệt (`375x667-dark-stats.png`, `1366x768-light-hub.png`), 0 `M1–M7`. |
| R5 · Thứ bậc & bố cục | 10% | **8.0** | Đạt 8.5 ở phân cấp 2 cột, đưa `"Việc tiếp theo"` lên đầu, đẩy `"Sắp có"` xuống cuối (`1366x768-light-hub.png`, `375x667-dark-onboarding.png`), nhưng **trừ 0.5** lỗi NẶNG `D6` (2 nút `primary` đồng thời trên `1366x768-dark-today.png` và `SettingsScreen`). |
| R6 · Đọc & truy cập | 10% | **9.0** | Hai theme sáng/tối tương phản rõ (`1366x768-light-settings.png`, `375x667-dark-stats.png`), `0 D3`, `0 D4`, `0 D5`, `0 D10`, phím `Enter` mở việc đầu (`TodayDashboard.tsx`), `ScreenErrorState` khi lỗi DB, `0 J8` khi `reduced-motion`. |
| R7 · Độ khó thích ứng | 10% | **8.5** | Hiển thị band ước lượng trực quan qua `BandMeter` 4 kỹ năng (`1366x768-dark-today.png`) và `Band ≈ 4.0` trên thẻ Hub (`1366x768-light-hub.png`), sạch hoàn toàn thuật ngữ nội bộ `FSRS` / `Mốc M1`. |
| R8 · Thưởng & tiến bộ | 5% | **9.0** | Cấp độ XP (`Cấp 1 · 0/100 XP lên cấp 2`), Từ vững `≥ 21 ngày`, tỷ lệ giữ nhớ `≥ 7 ngày`, lưới 12 huy hiệu Fluent 3D và lượt đóng băng chuỗi hiển thị đầy đủ trên `375x667-dark-stats.png` & `1366x768-dark-stats.png`. |
| R9 · Vòng lặp hằng ngày | 10% | **9.0** | Luồng Onboarding 4 bước → Placement → Hôm nay (`Việc tiếp theo` + `Ngày bận` + `Giữ chuỗi 5p` + `.ics`) → Hub → Stats → Settings khép kín, `e2e/daily-loop.spec.ts` **5/5 pass**, đổi ngày theo 04:00 địa phương (`today.ts`). |
| R10 · Nhất quán & tin cậy | 5% | **8.5** | `backup.ts` kiểm `zod.safeParse` + Gộp/Thay thế + `QuotaExceededError` + nhắc > 7 ngày, cảnh báo Safari→PWA iPhone + `persist()`, toast SW `X9`, bundle JS `214.76 KB`, CSS `69 KB`, `57/57` test files pass; trừ nhẹ vì Sheet `z-index` lệch shell ở `390x844-dark-hub-sheet.png` và video quay trước Vòng 1. |
| **Tổng có trọng số** | **100%** | **8.70 / 10** | Không tiêu chí nào `< 7.0` (thấp nhất: `R5 = 8.0`). |

---

## 4. Chức năng & Luật P0 (`KE-HOACH-T3-C.md` · `SR-90`)

- **Hôm nay (`#/`):** Giữ đủ Banner Onboarding, Thanh chào (tên tùy biến mặc định `"bạn"`, pill Band đầu vào, Streak + freeze, XP), Mục tiêu ngày + ProgressRing, Danh sách nhiệm vụ ("Đổi bài", "Bắt đầu"/"Chơi lại", phím Enter), EmptyState 2 nút, BandMeter 4 kỹ năng + Overall; bổ sung `"Việc tiếp theo"` ở đầu (`U6`), `"Giữ chuỗi 5 phút"` & `"Ngày bận (~10p)"` (`F14`), `.ics` (`F13`), 4 mạch (`PP-06`), ăn mừng mục tiêu ngày (`F9`), toast cứu chuỗi (`F8`).
- **Hub (`#/hub`, `#/practice`):** Giữ đủ 7 tab lọc và 12 thẻ chế độ; thêm `Sheet` chọn chế độ Luyện/Thi/Nhanh (`U5`) và đẩy 3 chế độ `Sắp có` (`S1, S2, X1`) xuống cuối (`U11`).
- **Thống kê (`#/stats`):** Giữ đủ 4 KPI, thanh & 5 ô phân bố bậc thẻ (không dùng chữ `"FSRS"`), lịch sử phiên + nút EmptyState, lưới 12 huy hiệu Fluent 3D; bổ sung Cấp độ XP (`F7`), Từ vững (`PP-16`) & giữ nhớ ≥ 7 ngày (`PP-07`), 4 mạch (`PP-06`).
- **Cài đặt (`#/settings`):** Giữ đủ 3 theme, Band L/R/W/S, thời lượng `15/30/45/60/90p`, tắt tiếng & âm lượng SFX `0–100%`, xuất/nhập `.json` + Modal xác nhận, Kho lưu trữ V1/V2; bổ sung đổi tên, 3 công tắc motion + `"Hiện nhân vật"`, giờ nhắc + `.ics`, ước lượng dung lượng + `persist()`, cảnh báo iPhone Safari→PWA + `"Sao lưu trước khi cài"` (`PB-09`), khôi phục Gộp/Thay thế (`PB-05`), xoá 2 bước giữ ghi âm (`PB-12`), Quyền riêng tư & Ghi công (`PB-13`).
- **Onboarding (`#/onboarding`):** Giữ đủ 4 bước + Enter, kiểm tra dữ liệu cũ V1/V2, Band + ngày thi `dd/mm/yyyy`, thử loa + thử micro, đi tiếp Placement hoặc bỏ qua về Hôm nay.
- **Placement (`#/placement`):** Bỏ import barrel `_shared` (giữ gọn bundle), giữ đủ 3 chặng Từ vựng (15 câu) / Đọc / Nghe.
- **Toast cập nhật SW (`App.tsx` · `X9`):** Đã kiểm qua E2E `daily-loop.spec.ts` test #5 — hiện `sw-update-toast` ở `#/` và ẩn ở `#/play/v1`.

---

## 5. So với tham chiếu

1. **Hôm nay (`390x844-dark-today.png`, `1366x768-dark-today.png`):** Gần tinh thần Duolingo ở phần Hero có nhân vật Lexi + bong bóng thoại + cụm chip Streak/XP/Mục tiêu và nút hành động chính đặt trên cùng; còn kém ở chỗ lúc chưa thiết lập có 2 nút `primary` cùng màu cạnh tranh thị giác.
2. **Hub (`1366x768-light-hub.png`, `390x844-dark-hub-sheet.png`):** Gần Duolingo/Arcade ở bộ 12 icon 3D Fluent phân nhóm màu rõ ràng, thẻ nổi `LiveCard` và Sheet chọn chế độ Luyện/Thi; còn kém ở thanh bottom nav `z-40` đè viền dưới Sheet trên `390x844`.
3. **Thống kê (`1366x768-dark-stats.png`, `375x667-dark-stats.png`):** Gần ứng dụng học gamified ở thẻ Hero có Lexi + KPI icon 3D + 4 mạch học Paul Nation + lưới 12 huy hiệu; còn kém ở phần phân bố độ vững thẻ vẫn dùng các ô chữ số phẳng hơn so với biểu đồ trực quan.

---

## 6. Luật script chưa đo, đã kiểm bằng mắt & code

- **D6 (1 nút chính):** Phát hiện bằng mắt trên `1366x768-dark-today.png` & rà `TodayDashboard.tsx` / `SettingsScreen.tsx` (đã ghi thành lỗi #1, #2).
- **J3 / J10 (không động sau chữ học, nhân vật đúng chỗ):** Không áp đặt lên vùng chữ học ở 5 route khung; Lexi chỉ nằm ở vùng Hero, `h = 76 px`, không đè chữ/nút (`375x667-dark-today.png`, `375x667-dark-stats.png`, `375x667-dark-onboarding.png`).
- **J8 (`reduced-motion`):** Kiểm bằng `audit-ui.mjs --reduced 1` (`0` infiniteAnims) và E2E `daily-loop.spec.ts` test #4 (công tắc lưu vào IndexedDB & bật/tắt `[data-mascot]`).
- **K* (asset & `CREDITS.md`):** `validate:data` xác nhận `153/153` file; kiểm ngẫu nhiên 10 file đầu `assets.manifest.json` khớp `sha256` `10/10`.
- **P0 (`PB-05`, `PB-09`, `PP-06/07/10/16`, `X9`):** Đã đọc trực tiếp `backup.ts`, `mastery.ts`, `today.ts`, `App.tsx`, `SettingsScreen.tsx`, `TodayDashboard.tsx` và đối chiếu pass của `57/57` file Vitest + `5/5` E2E.

---

## 7. Phán quyết: **ĐẠT**

- **0 lỗi CHẶN**, **≤ 2 lỗi NẶNG mỗi màn** (0 NẶNG từ `audit-ui.mjs`, 1 NẶNG `D6` trên `today` và `settings` qua soi mắt — không vượt ngưỡng), **tổng rubric 8.70 / 10** (≥ 8.5), **tiêu chí thấp nhất 8.0** (≥ 7.0), **chênh lệch chấm mù +4.39** (≥ +3.0), toàn bộ cổng kỹ thuật (`tsc`, `npm test`, `validate:data`, `daily-loop.spec.ts`, `size-budget.mjs`) đều xanh.
- Đề nghị Builder xử lý nhanh 2 mục `D6` (nút `primary` kép ở Today & Settings) và `z-index` của `Sheet` trên `390x844` trước hoặc cùng đợt polish tổng thể.
