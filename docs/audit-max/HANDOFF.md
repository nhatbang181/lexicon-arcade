# HANDOFF · đợt audit-max

## Cần chủ sở hữu file khác (từ T1-B, 23/11/2026)

| # | File | Chủ | Cần làm | Vì sao |
|---|---|---|---|---|
| 1 | `e2e/m1.spec.ts` | điều phối (chưa thuộc task nào) | Sau `onboarding-next-2` thêm `await expect(page.getByRole('heading', { name: 'Thử loa và micro' })).toBeVisible(); await page.getByTestId('onboarding-next-3').click();`; đổi `'Chào Bang · Hôm nay học gì?'` thành `'Chào bạn · Hôm nay học gì?'` | Onboarding nay 4 bước (F10), tên mặc định "bạn" (F11). Đã chạy thử: hiện m1 đỏ ở bước chờ heading 'Định vị nhanh vốn từ học thuật' ngay sau `onboarding-next-2` |
| 2 | `e2e/screenshots.spec.ts` | điều phối | `expectedHeading` của `today`: `'Chào bạn · Hôm nay học gì?'` | F11 |
| 3 | `src/games/registry.ts` | chưa thuộc task nào | (a) `GameProps` thêm tuỳ chọn `from?: 'today'`, `nextTask?: { taskId; gameId; title; path }`, `onNextTask?: () => void` (PlayScreen đã truyền, hiện bỏ qua nếu game không nhận); (b) bỏ chữ "FSRS" khỏi `subtitleVi` của V1 (D7, hiện lộ ở thẻ Hub) | F5, D7 |
| 4 | `src/design/components/RecapScreen.tsx` | T3-A | Nhận `nextTask` + `onNextTask` → nút chính "Tiếp: {title} (Enter)" | F5 (T1-B chỉ truyền prop qua PlayScreen) |
| 5 | Mọi game (V1: T1-A; V2/V3/R1/R2: T2-A; L1/L2: T2-B; W1/W2: T2-C) | chủ từng game | Gọi `registerProgressSaver(() => attemptRepo.saveProgress(...))` (từ `src/core/adaptive/progressSaver`) trong `useEffect` và huỷ khi unmount | F1: hộp thoát chỉ ghi "Lưu và thoát" khi game đã đăng ký; chưa game nào đăng ký nên hiện nhãn "Thoát" + lời nhắc chưa lưu |
| 6 | `src/core/planner/today.ts` | chưa thuộc task nào | `now.getUTCDay()` (cuối tuần gợi ý X1) và `MS_PER_DAY` trừ ngày nên dùng giờ địa phương như `formatDateKey` | F3 phần còn lại; `formatDateKey` đã được sửa nên `date` và khoá "hôm qua" đúng, riêng `isWeekend` vẫn theo UTC |
| 7 | `src/design/components/KeyHint.tsx` | T3-A | `text-[11px]` vi phạm D4 (T1-B đã bỏ 2 chỗ dùng `hotkey="Enter"` ở Hôm nay) | D4 |
| 8 | `src/games/v1-daily-run/**` | T1-A | audit-ui trên `play/v1`: D3 nút "Chế độ bận (10 thẻ)" cao 26 px, "Gợi ý/Không nhớ" cao 36 px; D4 số trên bản đồ node 10 px; D7 "Node 1/30"; bản đồ node làm tràn ngang 4–8 px ở 390 (D5, lúc có lúc không) | ngoài file độc quyền của T1-B |
| 9 | `src/design/components/Modal.tsx`, `Sheet.tsx` | T3-A | Nên gọi `e.preventDefault()` khi đóng bằng Esc (hiện chưa). T1-B đã xử lý bằng cách bỏ qua Esc khi có `[role=dialog][aria-modal=true]` ngoài hộp thoát của PlayScreen; khi T3-A thêm `preventDefault()` thì PlayScreen vẫn đúng (cũng đọc `defaultPrevented`) | F1 |
