# 05 · FLOW NGƯỜI DÙNG: onboarding, vòng lặp học hằng ngày, tiến độ, chuỗi ngày

> Bằng chứng: chạy thật onboarding ở 390×844 (3 bước → Hôm nay), ảnh `anh-hien-trang/onboarding-390.png`, `today-390.png`, `stats-1280.png`. Chi tiết code: `phu-luc/D-ui-flow-production.md` §3, §5; `phu-luc/A-game-tu-vung-reading.md` C1–C5.
> Luật liên quan: `LUAT.md` B3, B4, B6, D9.

## 1. Điểm hiện tại: **4,5/10**

| Tiêu chí | Điểm | Một câu |
|---|---|---|
| Onboarding | 6 | 3 bước, ~60–90 giây, có thanh tiến độ, có "Bỏ qua"; thiếu bước thiết bị, thiếu lựa chọn 15 phút |
| Placement | 6 | ~27 câu (vocab 12–15, reading 6, listening 6), có kết quả từng phần; nhưng kết quả **không được game dùng** (level luôn 1) |
| Vòng lặp hằng ngày | 3 | Hôm nay có 3 việc + lý do, nhưng chơi xong **về Hub**, Recap không có "Tiếp", xong mục tiêu không có ăn mừng |
| Tiến độ hiển thị | 3 | Shell luôn "0 ngày / 0 XP"; badge, level có code nhưng chưa nối; band ước lượng chưa thay đổi theo kết quả |
| Chuỗi ngày (streak) | 4 | Có freeze tốt (1 lúc đầu, +1/7 ngày, tối đa 2) nhưng **ngày tính theo UTC** (ngày mới lúc 07:00 VN) và không báo khi dùng/gãy |
| Giữ chân (nhắc học, mục tiêu) | 2 | Không có nhắc học, không có banner "chuỗi gặp nguy", mục tiêu ngày tối thiểu 30 phút |
| An toàn tiến độ | 2 | Esc thoát ngay không hỏi; mọi game chỉ lưu ở Recap → thoát giữa phiên mất sạch |

## 2. Bản đồ flow hiện tại vs mục tiêu

```
HIỆN TẠI
Mở app ─► Hôm nay (2 khối chào) ─► [Bắt đầu] ─► Game ─► Recap ─► "Về Hôm nay" hoặc ✕/Esc ─► HUB (!)
                                               └─ Esc bất kỳ lúc nào ─► HUB, mất tiến độ (!)
Shell: 🔥0  ⭐0 XP (cứng)

MỤC TIÊU
Mở app ─► Hôm nay: "Việc tiếp theo" ở đầu, Enter = bắt đầu
            │
            ▼
         Game (lưu từng lượt) ──Esc──► Hộp "Lưu và thoát? / Chơi tiếp"
            │
            ▼
         Recap thưởng (đếm XP, streak +1, badge mới, band ↑) ─► [Tiếp: việc 2 (Enter)] ─► Game 2 …
            │                                                    └─ [Về Hôm nay]
            ▼
         Hết 3 việc ─► Hôm nay: vòng mục tiêu đầy → loé → ✓ + confetti + "Xong hôm nay · 🔥 13"
```

## 3. Danh sách vấn đề và cách sửa

| # | Vị trí | Vấn đề | Mức | Cách sửa (thông số) | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| F1 | `src/app/screens/PlayScreen.tsx:22-30` | Esc trên `window` gọi `navigate('/hub')` ngay, kể cả khi Esc đang dùng đóng Modal hoặc bỏ chọn span V3 | **P0** | Bỏ listener; `requestExit()` mở Modal xác nhận (focus mặc định "Chơi tiếp"); chỉ xử lý khi `!e.defaultPrevented`; Modal/Sheet/V3 gọi `preventDefault()` | E2E: V3 chọn span + Esc → vẫn ở `/play/v3`; Esc lúc rảnh → hộp xác nhận; "Lưu và thoát" → `db.attempts.count()` +1 |
| F2 | `src/app/App.tsx:165,177,221,224` | Streak/XP shell cứng 0 | P1 | `useLiveQuery(() => db.profile.get('me'))`; hiện `streak.count`, freeze ❄️, `xp.toLocaleString('vi-VN')` | Sau 1 phiên V1, sidebar + header mobile = số ở Hôm nay, không reload |
| F3 | `src/core/gamification/streak.ts:38-43` (cũng dùng ở `TodayDashboard.tsx`, `attemptRepo.ts:82`) | `formatDateKey` dùng `getUTC*` → ở UTC+7 ngày mới bắt đầu 07:00 | P1 | Giờ địa phương + "giờ chuyển ngày" 04:00 (`new Date(ts - 4*3600e3)`); test `TZ=Asia/Ho_Chi_Minh` | Phiên 08:00 T2, 06:30 T3, 08:00 T4 → `count=3`, freeze không giảm |
| F4 | Mọi game (V1 `V1DailyRun.tsx:281-307`, V2 `:331`, V3 `:354`, R1 `:562`, R2 `:177`; L/W xem phụ lục B) | Chỉ lưu ở Recap; V1 checkpoint còn ghi "đã ghi nhận" sai sự thật (`V1DailyRun.tsx:625`) | P1 | `attemptRepo.saveProgress(partial)` mỗi lượt (debounce 500ms) + flush ở `pagehide`; checkpoint V1 lưu thật | Trả lời 5 thẻ V1, reload → 5 review trong DB |
| F5 | `PlayScreen.tsx:61,120`, `RecapScreen.tsx:150-168` | Chơi xong về Hub; Recap không có "Tiếp" | P1 | Query `?from=today&task=<id>`; `onExit` về `/` nếu từ Hôm nay; Recap nhận `nextTask` → nút primary "Tiếp: {tên} (Enter)" | Today → task 1 → Recap → "Tiếp" → `/play/<task2>` |
| F6 | `PlayScreen.tsx:120`, `src/core/adaptive/difficulty.ts:61` | `level={1}` cứng; `adjustDifficulty` không có caller; placement ghi `skillLevels` nhưng không ai đọc | **P0** | `src/core/adaptive/sessionLevel.ts`: sau `saveSession`, 20 lượt gần nhất → `adjustDifficulty` (cửa sổ 20, cooldown 10) → `profile.skillLevels[gameId]`; PlayScreen đọc và truyền `level`; `?mode=` đọc từ URL | Sau placement `skillLevels.l1=3` → L1 nhận `level=3`; 2 phiên V3 đúng 100% → phiên 3 level tăng |
| F7 | `src/core/gamification/badges.ts:112`, `xp.ts:105` | `evaluateNewBadges`, `xpToLevel` không được gọi; Stats hiện "0/12 huy hiệu" mãi | P2 | Gọi trong transaction `saveSession`, trả `{newBadges, levelUp, streakEvent}` cho Recap để hiện toast + confetti | Phiên đầu → badge "Phiên đầu tiên" + toast |
| F8 | `attemptRepo.ts:87-89`, `TodayDashboard.tsx:275` | `freezeUsed`, `freezeEarned`, `broken` bị bỏ; Hôm nay hiện streak cũ dù đã gãy 5 ngày | P2 | Trả cờ về UI: toast "Đã dùng 1 ❄️ để giữ chuỗi 12 ngày"; hiển thị `health==='broken' ? 0 : count`; banner "Chuỗi gặp nguy" sau 18:00 nếu chưa học | lastActive = 5 ngày trước → Hôm nay "0 ngày" |
| F9 | `TodayDashboard.tsx:286+`, `ProgressRing.tsx` | Xong mục tiêu ngày: không ring-complete, không SFX `goal`, không toast | P2 | Lần đầu vượt 100% trong ngày (`kv['goal_celebrated_<date>']`): ring loé, `sessionDone`, toast, confetti 120 hạt | Toast đúng 1 lần/ngày |
| F10 | `OnboardingScreen.tsx:25-31` | Thiếu bước "Thiết bị"; phút/ngày `[30,45,60,90]`, không có 15 | P2 | Bước 3 "Thiết bị": phát 1 câu mẫu, nút thử mic, 3 dòng giải thích chấm qua Claude, nút "Bỏ qua"; lựa chọn `[15,30,45,60]`, mặc định 30 | Onboarding 4 bước, ≤ 90 giây bằng Enter liên tục |
| F11 | `TodayDashboard.tsx:116,140-143`, `OnboardingScreen.tsx:39,98` | Tên "Bang" cứng | P3 | Mặc định "bạn"; tên từ profile | Profile mới → "Chào bạn" |
| F12 | `TodayDashboard.tsx:43-89, 255-266` | Logic M1 còn sót: `READY_M1_GAMES`, `normalizePlanForM1` ép V1–V3 lên đầu; "Đổi bài" có thể ra S2 chưa sẵn sàng; không có Enter; thiếu "câu thắng gần nhất", "tuần này" | P2 | Lọc theo `isGameReady`; bỏ `normalizePlanForM1`; Enter mở việc đầu chưa xong; thêm dải 7 ngày và câu thắng | "Đổi bài" 50 lần không ra game chưa sẵn sàng |
| F13 | Toàn app | Không có nhắc học | P2 | (a) banner trong app ≥ 18:00 nếu chưa đạt mục tiêu; (b) xin `Notification` **sau** lần đầu xong mục tiêu ngày, PWA tự nhắc khi mở; (c) nút "Thêm nhắc vào lịch" xuất `.ics` lặp hằng ngày | Cài đặt có "Giờ nhắc"; banner đúng điều kiện |
| F14 | Mục tiêu ngày theo phút (30–90) | Ngày bận không có mốc nhỏ để giữ chuỗi (Duolingo: 1 bài là đủ) | P2 | Tách 2 mốc: **"Giữ chuỗi"** = 1 phiên bất kỳ ≥ 5 phút; **"Mục tiêu ngày"** = số phút đã chọn | Phiên V1 "Chế độ bận 10 thẻ" giữ được chuỗi |
| F15 | `src/test/fixtures` dùng ở `V1DailyRun.tsx:137-142` | DB rỗng → V1 ghi **thẻ test giả** vào IndexedDB thật | P1 | DB rỗng → EmptyState "Làm placement hoặc chọn chủ đề" + seed thật từ placement | Build prod không chứa `v1_fixtures`; DB rỗng không có card `source: fixture` |
| F16 | `RecapScreen.tsx:31-32` | Recap mặc định giả `accuracyPercent=80`, `durationSec=240`; V1 bịa số "tuần trước" (`v1 engine.ts:1133`) | P1 | Bỏ mặc định; câu thắng chỉ dùng số thật | Không truyền accuracy → ô bị ẩn; chuỗi "tuần trước" chỉ xuất hiện khi có dữ liệu 7 ngày trước |
| F17 | `/library` (`PlaceholderScreens.tsx:46`) | Tab "Thư viện" ngang hàng 4 tab thật nhưng là placeholder | P3 | Ẩn tới khi làm, hoặc nhãn "Sắp có"; về sau nav: Hôm nay / Luyện / Thi / Thống kê / Thêm | – |
| F18 | `backup.ts:110`, không có `navigator.storage.persist` | Khôi phục backup xoá mọi ghi âm; không xin lưu trữ bền | P1 | `persist()` sau onboarding; khôi phục giữ `audioBlob` trùng id; thêm chế độ "Gộp"; nhắc sao lưu nếu > 7 ngày | Test: restore giữ blob; Cài đặt hiện "Lưu trữ bền: Có" |

## 4. Thiết kế vòng lặp hằng ngày (chuẩn mới)

| Bước | Màn | Thời lượng | Phản hồi (file 03) |
|---|---|---|---|
| 1 | Mở app → Hôm nay | ≤ 2,5 s tới nội dung | streak lửa nảy nếu hôm qua có học |
| 2 | Bấm Enter / "Bắt đầu" việc 1 | – | dòng 21 (thẻ phóng to thành game) |
| 3 | Phiên 5–15 phút | – | dòng 2–15 |
| 4 | Recap | 4–6 s nghi thức, bấm để tua | dòng 16; streak +1 (dòng 18) nếu là phiên đầu trong ngày |
| 5 | "Tiếp: việc 2" | – | – |
| 6 | Xong 3 việc / đủ phút | – | dòng 17 (ring + confetti) |
| 7 | Cuối tuần: Thi thử X1 (khi có) | 40–60 phút | không juice (exam) |

**Quy tắc chọn việc (planner):** việc 1 luôn là V1 nếu có ≥ 10 thẻ đến hạn; việc 2 là kỹ năng có khoảng cách band–mục tiêu lớn nhất; việc 3 là kỹ năng sản xuất (W2/S2) nếu sẵn sàng, không thì kỹ năng còn lại. Không bao giờ gợi ý game chưa sẵn sàng. Lý do đề xuất phải dựa trên số thật; khi chưa có placement thì ghi "Chưa có điểm đầu vào – làm Placement 10 phút để gợi ý chính xác hơn".

## 5. Tiêu chí ĐẠT của mảng
1. E2E `e2e/daily-loop.spec.ts` (chỉ bàn phím): Onboarding → Hôm nay → Enter → V1 (10 thẻ) → Recap → Enter "Tiếp" → R1 → Recap → Hôm nay: vòng mục tiêu tăng, shell streak = 1.
2. Unit test múi giờ (F3) và adaptive (F6) xanh.
3. Thoát giữa phiên ở mọi game đã có: dữ liệu đã làm còn trong DB (F4).
4. Rubric `KIEM-THU.md` §3 "Vòng lặp hằng ngày" ≥ 9, "Cảm giác tiến bộ" ≥ 8.
