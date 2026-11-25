# BÁO CÁO T3-C · Hub, Hôm nay, Thống kê, Cài đặt, Backup P0 & iPhone PWA P0

## 1. Phạm vi hoàn thành (Chặng 1 + Chặng 2)
- **B1** ✅ `docs/audit-max/KE-HOACH-T3-C.md` (26 dòng, liệt kê đầy đủ nút/chức năng hiện có của 6 màn theo SR-80, SR-90).
- **C1 (Lõi & P0)** ✅
  - `src/core/storage/repos/attemptRepo.ts`: `saveSession`/`finalize` trả `{ newBadges, levelUp, streakEvent }` (`F7`, `F8`), lưu loại lượt (`retrieval`/`production`/`recognition`, `PP-02`), lưu thông báo cứu chuỗi vào `kv`.
  - `src/core/storage/repos/profileRepo.ts`: mặc định `sfxVolume: 60` (thang 0–100) + `normalizeSfxVolume`.
  - `src/core/gamification/mastery.ts` & `streak.ts`: tính "Từ vững" (`stability ≥ 21 ngày && ≥ 3 lần đúng gần nhất`, `PP-16`), thăm dò trễ ≥ 7 ngày (`PP-07`), `toStreakEvent`.
  - `src/core/storage/backup.ts`: kiểm `zod.safeParse` từng bảng (`SR-34`), nhập 2 chế độ **Gộp (Merge)** & **Thay thế (Replace)** (`PB-05`, `X12`, `F18`), lưu `last_backup_at` + nhắc > 7 ngày, xử lý `QuotaExceededError` (`PB-17`), `requestPersistentStorage`/`estimateStorageUsage` (`PB-09`), `clearAllUserData({ keepRecordings })` (`PB-12`, không dùng `db.delete()`).
  - `src/core/planner/today.ts`: đổi sang ngày học địa phương 04:00 (`F3`), cân bằng Four Strands 7 ngày và bù mạch < 15% (`PP-06`), bảo đảm ≥ 1 việc sản xuất khi mục tiêu ≥ 20 phút (`PP-10`), `buildBusyDayPlan` (~10p) & `createKeepStreakTask` (5p, `F14`).
  - `src/games/registry.ts`: bỏ `"FSRS"` ở V1 `subtitleVi` (`D7`), thêm `from`/`nextTask`/`onNextTask` vào `GameProps` (`F5`).
  - `src/features/placement/PlacementScreen.tsx`: import trực tiếp `PassageView` (tránh kéo `v2v3_fixtures` qua barrel `_shared`).
  - `src/app/App.tsx`: lắng nghe `lexicon:sw-update` hiện toast `"Có bản mới · Tải lại"` chỉ ngoài `/play/*` và `/exam` (`X9`), tự gọi `navigator.storage.persist()` khi chạy standalone PWA (`PB-09`).
  - `src/features/shared/useAsyncData.ts` & `ScreenErrorState.tsx`: trạng thái tải/lỗi/thử lại cho Hôm nay, Hub, Thống kê (`X11`).
- **C2 (Hôm nay)** ✅ `TodayDashboard.tsx` + `icsReminder.ts`: hero ≥ 15% + `<Mascot>`, đưa "Việc tiếp theo" lên đầu (`U6`), banner ăn mừng mục tiêu ngày + `celebrate('dailyGoal')` (`F9`), "Giữ chuỗi 5 phút" & "Ngày bận (~10p)" (`F14`), nhắc học + xuất `.ics` (`F13`), cân bằng 4 mạch (`PP-06`), toast cứu chuỗi (`F8`), thẻ `<LiveCard>` + icon Fluent 3D.
- **C3 (Hub)** ✅ `HubScreen.tsx`: hero ≥ 15% + `<Mascot>`, 12 icon game Fluent 3D trong `<LiveCard>`, `Sheet` chọn chế độ Luyện/Thi/Tăng tốc (`U5`, `D6`), đẩy nhóm "Sắp có" (S1, S2, X1) xuống cuối (`U11`).
- **C4 (Thống kê & Cài đặt)** ✅
  - `StatsScreen.tsx`: hero ≥ 15% + `<Mascot>`, cấp độ XP & tiến độ (`F7`), Từ vững + giữ nhớ ≥ 7 ngày (`PP-07`), 4 mạch học (`PP-06`), 12 huy hiệu Fluent 3D (`public/assets/icons/fluent/badges/*.webp`), toast cứu chuỗi (`F8`).
  - `SettingsScreen.tsx`: đổi tên, 3 công tắc motion + "Hiện nhân vật" nối trực tiếp `useMotionPref()` (`FX_KV_KEYS` từ `src/design/fx`), giờ nhắc + `.ics`, ước lượng dung lượng + `persist()`, hướng dẫn cài PWA iPhone kèm cảnh báo dữ liệu tab Safari không tự chuyển + nút "Sao lưu trước khi cài" (`PB-09`, `L-12`), nhập sao lưu mặc định chế độ Gộp, xoá dữ liệu 2 bước có giữ ghi âm (`PB-12`), Quyền riêng tư & Ghi công (`PB-13`).
- **C5 (Onboarding & hoàn thiện)** ✅ `OnboardingScreen.tsx` gắn `<Mascot>` + hero ≥ 15% + 6 icon Fluent 3D UI, giữ nguyên 4 bước và mọi nút/testid cũ.

## 2. Số đo kiểm chứng
| Cổng kiểm | Kết quả |
|---|---|
| `npx tsc --noEmit -p .` | **0 lỗi** |
| `npm test` | **56/56 file, 604/604 test pass** (gồm 9 test mới ở `mastery.test.ts` & `t3cCore.test.ts`) |
| `npm run validate:data` | **PASS (dev)** — 0 lỗi schema/invariant, 153/153 asset credited |
| `e2e/daily-loop.spec.ts` (PW port 5253, Chrome) | **5/5 pass**, 0 `console.error` (gồm kiểm bật/tắt Lexi và sao lưu/nhập Gộp) |
| `scripts/qa/internal-jargon.mjs` | **0 chỗ** trong toàn bộ file của T3-C |
| `audit-ui.mjs` (5 route × 4 khung `390,375,820,1280` × 2 theme = 40 lượt) | Trước sửa C5: `0 CHẶN · 76 NẶNG` → Sau sửa: **`0 CHẶN · 38 NẶNG · 0 NHẸ`** (0 M1, 0 M7, 0 D3, 0 D4, 0 D5, 0 D7, 0 D10, 0 J10). Ở 390×844: Today/Stats/Settings/Onboarding = **0 NẶNG**, Hub = **2 NẶNG** (do lớp bóng sibling của `LiveCard.tsx:133` thuộc T3-A, đã ghi `HANDOFF.md`). Ở 375×667: mọi màn **0 CHẶN, ≤ 2 NẶNG**. Ảnh lưu tại `docs/audit-max/anh-sau/T3-C/`. |
| `vite build && node scripts/qa/size-budget.mjs` | **0 vượt, 0 chuỗi rò** — JS `#/`: **213.69 KB gzip** (ngưỡng 250), CSS: **128.5 KB** (ngưỡng 130), Chunk lazy max: **45.29 KB** (ngưỡng 120), Precache PWA: **1 404.39 KiB** (ngưỡng 1 500). |

## 3. Chức năng cũ giữ nguyên (SR-90)
- Toàn bộ nút, route, testid và luồng cũ liệt kê trong `KE-HOACH-T3-C.md` đều được giữ nguyên (Onboarding 4 bước + Enter, Placement 3 chặng, Today đổi bài/Enter/BandMeter, Hub 7 tab lọc, Stats 4 KPI/lịch sử/12 huy hiệu, Settings 3 theme/Band/thời lượng/SFX/Legacy).

## 4. Quyết định ghi nhận
- Không nhập trực tiếp `backup.ts` (có `zod`) trong `App.tsx` và `TodayDashboard.tsx` để giữ chunk khởi động `#/` nhỏ gọn (giảm từ 244.13 KB xuống 213.73 KB gzip).
- Tắt `breathing` trên thẻ "Việc tiếp theo" chứa nút chính ở Hôm nay để tránh làm nút di chuyển khi người dùng bấm (vẫn giữ chuyển động nền qua `<Mascot>`).
- Ghi `HANDOFF.md` cho T3-A về lớp bóng sibling trong `LiveCard.tsx:133` khiến `audit-ui.mjs` đếm M5 trên các thẻ Hub ở màn lớn.

## 5. Vòng 1 (sửa theo `REVIEW-T3-C-A.md`)
1. **`OnboardingScreen.tsx` (M1, M3, M4, SR-40):** Bỏ `autoFocus` ở ô nhập tên để không cuộn khuất Hero/Lexi trên iPhone SE `375x667`; đổi `<Mascot state="chao" say="Chào bạn! Bắt đầu nhé!" />`; tăng Hero `min-h-[190px] sm:min-h-[256px]` đạt ≥ 15% ở `1366x768`; thêm chuyển động nhẹ trên icon `rocket.webp` (tôn trọng `prefers-reduced-motion`).
2. **`TodayDashboard.tsx` & `StatsScreen.tsx` (M2, M3, J10, SR-40):** Co nhẹ padding/spacing mobile (`p-3.5 sm:p-5`), bổ sung icon màu Fluent 3D `32×32` có nghĩa rõ (`band-80.webp`, `cloud.webp` ở Hero Hôm nay; `check.webp` ở Hero Thống kê) để màn đầu `375x667` đạt ≥ 6 icon màu khác nhau; `StatsScreen` render Hero + `<Mascot>` ngay từ đầu với câu thoại ngắn có số thật (`0 XP · 0/12 huy hiệu!`), không bị cắt chữ.
3. **`HubScreen.tsx` (R5):** Thêm `className="h-full"` cho `<LiveCard>`, `min-h-[3.75rem] line-clamp-3` cho mô tả thẻ để các hàng lưới `≥ 820px` bằng khít chiều cao; biến 4 icon Hero thành 4 chip có nhãn rõ (`Từ vựng`, `Đọc · Nghe`, `Viết · Nói`, `Thi thử`).
4. **`SettingsScreen.tsx` (D11, chấm mù):** Thêm Hero đồng bộ có `<Mascot state="chao" say="Tuỳ chỉnh & sao lưu nhé!" />` + 10 icon màu Fluent 3D `32×32` riêng biệt cho các đầu mục; rút gọn placeholder ô nhập tên thành `"Tên hiển thị (mặc định: bạn)"`; đổi pill giao diện sang tiếng Việt `"Đang dùng: Tối / Sáng / Thi máy"` với `shrink-0 whitespace-nowrap`.
5. **Bằng chứng & số đo Vòng 1 (`SR-82`):**
   - `audit-ui.mjs` đủ **7 khung (`390,375,430,820,1180,1280,1366`) × 2 theme × 5 route (70 lượt):** **`0 CHẶN · 54 NẶNG · 0 NHẸ`** — **0 lỗi NẶNG thuộc T3-C** (toàn bộ 54 `M5` còn lại là từ lớp bóng `LiveCard.tsx:133` của T3-A); đã xoá 8 ảnh `*-onboarding-loi.png` cũ, bổ sung ảnh sau tương tác `390x844-dark-hub-sheet.png` và video `390x844-daily-loop.webm` tại `docs/audit-max/anh-sau/T3-C/`.
   - `npx tsc --noEmit -p .`: **0 lỗi** · `npm test`: **56/56 file, 604/604 pass** · `e2e/daily-loop.spec.ts`: **5/5 pass** (0 `console.error`) · `size-budget.mjs`: **0 vượt, 0 chuỗi rò** (JS `#/` **213.73 KB gzip**, CSS **129.31 KB**, Lazy max **45.3 KB**, Precache **1 405.91 KiB**).
