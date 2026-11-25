# KẾ HOẠCH T3-C · Hôm nay, Hub, Thống kê, Cài đặt, Backup P0 & iPhone PWA P0

## 1. Route & file chính
- `#/` (`TodayScreen.tsx`, `src/features/today/**`), `#/hub`, `#/practice` (`HubScreen.tsx`), `#/stats` (`StatsScreen.tsx`), `#/settings` (`SettingsScreen.tsx`), `#/onboarding` (`OnboardingScreen.tsx`), `#/placement` (`PlacementScreen.tsx`, `placementData.ts`), shell SW toast (`App.tsx`).
- Lõi: `attemptRepo.ts`, `profileRepo.ts`, `backup.ts`, `src/core/gamification/**`, `src/core/planner/today.ts`, `src/games/registry.ts`.

## 2. Danh sách nút & chức năng hiện có phải giữ nguyên (SR-80, SR-90)
- **Hôm nay (`#/`)**: Banner Onboarding ("Bắt đầu thiết lập", "Vào Hub chơi thử"); Thanh chào (tên hiển thị, pill Band đầu vào, badge Streak + số freeze, badge Tổng XP + XP hôm nay); Thẻ Mục tiêu ngày (số phút/mục tiêu, số phiên, vòng tiến độ); Danh sách nhiệm vụ (số thứ tự/tick, badge game, phút, "Đổi bài", "Bắt đầu"/"Chơi lại", phím Enter mở việc đầu); EmptyState ("Khám phá 12 Chế độ (Hub)", "Làm bài kiểm tra đầu vào"); Cột Band ước lượng 4 kỹ năng (L/R/W/S, Overall, số thẻ ôn).
- **Hub (`#/hub`, `#/practice`)**: Tab lọc 7 nhóm (Tất cả, Từ vựng, Listening, Reading, Writing, Speaking, Thi thử); 12 thẻ chế độ (bấm thẻ/nút vào game, pill yêu cầu Claude/micro/chế độ, thời lượng).
- **Thống kê (`#/stats`)**: 4 KPI (Streak hiện tại + freeze, Kỷ lục Streak, Tổng XP + số phiên, Tổng thẻ + số thẻ vững); Thanh & 5 ô phân bố bậc thẻ; Lịch sử phiên gần nhất (EmptyState có nút "Chơi V1 Daily Run ngay"); Lưới 12 huy hiệu.
- **Cài đặt (`#/settings`)**: Chọn 3 giao diện (Sáng, Tối, Thi máy); Chọn mục tiêu Band L/R/W/S (6.0–9.0); Chọn thời lượng ngày (15/30/45/60/90p); Tắt tiếng & thanh âm lượng SFX (0–100%); Xuất sao lưu `.json`, Khôi phục từ file + Modal xác nhận; Kho lưu trữ V1/V2 ("Mở Kho lưu trữ V1/V2").
- **Onboarding (`#/onboarding`)**: 4 bước + phím Enter (B1 tên + "Kiểm tra dữ liệu cũ" + "Tiếp tục"; B2 tăng/giảm Band L/R/W/S, chọn 15/30/45/60p, nhập ngày thi `dd/mm/yyyy`, "Quay lại"/"Tiếp tục"; B3 "Nghe câu mẫu", "Thử micro", "Quay lại"/"Bỏ qua"/"Tiếp tục"; B4 "Quay lại"/"Bỏ qua để vào Hôm nay ngay"/"Bắt đầu định vị").
- **Placement (`#/placement`)**: 3 chặng Từ vựng (15 câu + nạp 15 thẻ khởi đầu), Đọc (6 câu, tuỳ chọn), Nghe (6 câu, tuỳ chọn); chọn đáp án, nộp, chuyển chặng/về Hôm nay.

## 3. Kế hoạch Chặng 1 (C1–C4) & Chặng 2 (C5)
- **C1 (Lõi & P0):** `saveSession`/`finalize` trả `{newBadges, levelUp, streakEvent}` + lưu loại lượt (`PP-02`); Mastered (`PP-16`) & giữ nhớ ≥ 7 ngày (`PP-07`); `sfxVolume` 0–100; `backup.ts` đủ bảng + chế độ Gộp/Thay thế + `zod.safeParse` + nhắc > 7 ngày + xử lý `QuotaExceededError`; `persist()` + dung lượng + cảnh báo Safari→PWA; `planner/today.ts` bỏ UTC, thêm Four Strands (`PP-06`), việc sản xuất ngày ≥ 20p (`PP-10`), ngày bận ~10p & giữ chuỗi 5p (`F14`); `registry.ts` bỏ "FSRS" + thêm props `from/nextTask/onNextTask`; `PlacementScreen` bỏ import `_shared` barrel kéo `v2v3_fixtures`; `App.tsx` toast `lexicon:sw-update` ngoài `/play/*`; `useAsyncData` + màn lỗi (`X11`).
- **C2 (Hôm nay):** Đưa "Việc tiếp theo" lên đầu (`U6`), banner ăn mừng mục tiêu ngày (`F9`), nút "Giữ chuỗi 5 phút" (`F14`) & Ngày bận, nhắc lịch học + xuất `.ics` (`F13`), tóm tắt Four Strands, bỏ thuật ngữ nội bộ (`D7`).
- **C3 (Hub):** Bộ sưu tập thẻ giàu thông tin (slot icon sẵn cho C5), `Sheet` chọn chế độ Luyện/Thi/Nhanh, đẩy "Sắp có" (S1/S2/X1) xuống cuối (`U5`, `U11`).
- **C4 (Thống kê & Cài đặt):** Thống kê nối badge/level thật (`F7`), "Từ vững" & giữ nhớ ≥ 7 ngày (`PP-07`), Four Strands (`PP-06`), toast cứu chuỗi (`F8`); Cài đặt thêm đổi tên, 3 công tắc motion (`pref.reducedMotion`/`particlesOff`/`hapticsOff`), `pref.showMascot`, giờ nhắc học + `.ics`, dung lượng + `persist()`, sao lưu chế độ Gộp/Thay thế + cảnh báo iPhone Safari→PWA, xác nhận xoá dữ liệu (`PB-12`), Ghi công (`PB-13`).
- **C5 (Chặng 2, chờ T3-A merge):** Gắn `Mascot` (Lexi), `LiveCard`, `celebrate`, icon Fluent 3D và chạy `audit-ui.mjs` 390/375/820/1280.
