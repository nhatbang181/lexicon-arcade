# KE-HOACH T1-B · Shell, vòng lặp ngày, độ khó thích ứng

Nhánh `audit-max/T1-B` · worktree `D:\English-wt\T1-B` · dev port 5202 · E2E port 5212 (`playwright.t1b.config.ts`, không commit).

## Route và thành phần bị đụng
`#/` (Hôm nay, shell), `#/hub`, `#/onboarding`, `#/play/:gameId` (PlayScreen), `#/exam`, mọi route lazy. Thành phần: `App.tsx` (ShellLayout), `routes.tsx`, `ErrorBoundary.tsx`, `PlayScreen.tsx`, `HubScreen.tsx` (chỉ nhãn U4), `TodayDashboard.tsx` (F5, F11, F12), `OnboardingScreen.tsx`, `core/gamification/streak.ts`, `core/adaptive/*`.

## Việc → mã lỗi
1. F1: bỏ Esc toàn cục; hộp "Lưu và thoát / Chơi tiếp"; bỏ qua khi `defaultPrevented` hoặc đang có hộp thoại/ô nhập IME.
2. F2/U18/D9: shell đọc `profile.streak.count`, `xp` bằng `useLiveQuery`. F3: `formatDateKey` giờ địa phương, chuyển ngày 04:00.
3. F6/G2/U4: `sessionLevel.ts`; PlayScreen đọc `skillLevels[gameId]`, `?mode=`; chip "Band ≈ x.x · Luyện/Thi".
4. F5: `?from=today&task=`; PlayScreen truyền `nextTask`, `from` (cast, game chưa nhận thì bỏ qua); `onExit` về `#/` nếu từ Hôm nay.
5. X5/X6/X10: `React.lazy` mọi route trừ Hôm nay; `/dev/*` chỉ khi `import.meta.env.DEV`; `ErrorBoundary key={location}`.
6. U2 (nút 44 px, `shrink-0`), U17 (nav là link `<a href="#/…">`), F10 (onboarding 4 bước, `[15,30,45,60]`, mặc định 30), F11 (không tên cứng), F12 (bỏ `normalizePlanForM1`, lọc `isGameReady`, Enter mở việc đầu).

## Rủi ro
- Games do owner khác sửa: "Lưu và thoát" chỉ lưu được khi game đăng ký `registerProgressSaver` (mới, ở `core/adaptive/progressSaver.ts`); chưa game nào đăng ký → hộp ghi rõ "chưa tự lưu giữa phiên".
- L2 tự quản level riêng (`profile.skillLevels.l2`) → bỏ qua l2 trong `applySessionLevel`; x1 (thi) không đổi level.
- `e2e/m1.spec.ts`, `e2e/screenshots.spec.ts` (không thuộc T1-B) đang chờ "Chào Bang" và onboarding 3 bước → ghi `HANDOFF.md`.
- `formatDateKey` đổi sang giờ địa phương: `attemptRepo`, `planner/today.ts` dùng chung hàm nên được sửa theo, không đụng file của họ.

## Danh sách mọi nút/chức năng giữ nguyên
Shell: logo → Hôm nay; 5 mục nav (Hôm nay, 12 Chế độ, Thống kê, Thư viện, Cài đặt) sidebar >= 1024 px và tab bar dưới; streak/XP (sidebar + header mobile); đánh dấu mục đang mở; ẩn shell ở `/play/*`, `/legacy`, `/exam`.
PlayScreen: nút thoát (X), tên game + chấm kỹ năng, chip chế độ, nút bật/tắt âm, màn "Không tìm thấy chế độ" + nút về Hub, Suspense skeleton, `onExit`.
Hub: 7 tab lọc (Tất cả/Từ vựng/Listening/Reading/Writing/Speaking/Thi thử), 12 thẻ (bấm cả thẻ hoặc nút "Mở"), nhãn Claude/micro.
Hôm nay: banner onboarding (Bắt đầu thiết lập, Vào Hub chơi thử), huy hiệu streak + freeze, huy hiệu XP, vòng mục tiêu, danh sách nhiệm vụ (Đổi bài, Bắt đầu/Chơi lại), EmptyState (Khám phá Hub, Làm bài kiểm tra đầu vào), 4 BandMeter, ô overall, ô kho thẻ SRS.
Onboarding: tên hiển thị, kiểm tra dữ liệu cũ (migrate), 4 select band, nút thời lượng ngày, ngày thi, Quay lại/Tiếp tục, Bỏ qua để vào Hôm nay, Làm Placement; thêm: thử loa, thử micro, Bỏ qua bước thiết bị.
ErrorBoundary: Thử lại (thêm: Về Hôm nay).

## Cách vào trạng thái khó
- Esc: `#/play/v3` rồi chọn span (V3), `#/play/v1` rảnh, mở hộp thoát rồi Esc.
- Streak/XP: ghi `profile` bằng `db.profile.put` trong `page.evaluate` (module dev `/src/core/storage/db.ts`).
- Onboarding: xoá `kv.onboarding_done`, vào `#/onboarding`. Level: `profile.skillLevels.v3`.
- Lỗi route: ném lỗi qua `window.__T1B_THROW` không dùng; thay bằng route lỗi giả trong test đơn vị ErrorBoundary.
