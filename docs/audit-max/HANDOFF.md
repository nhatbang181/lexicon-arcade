# HANDOFF · audit-max

## Từ T1-B

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

## Từ T1-A

> Mục do từng builder ghi. Điều phối gộp khi merge (T1-A tạo file này trong nhánh `audit-max/T1-A`; nếu T1-B/T1-C cũng tạo thì gộp tay hai phần).

## Cần chủ sở hữu file khác

### Từ T1-A
| # | File (chủ sở hữu) | Cần gì | Vì sao | Ảnh hưởng nếu chưa làm |
|---|---|---|---|---|
| 1 | `src/features/placement/placementData.ts` dòng 9 và 465 (T3-C; hoặc điều phối giao T1-A sửa 2 dòng này) | Bỏ `import { V1_FIXTURE_VOCAB } …/v1_fixtures` và dùng `vocabIds` thật thôi (`[...vocabIds, ...V1_FIXTURE_VOCAB.map(...)]` → `vocabIds`) | File fixture bị kéo vào bundle entry (`dist/assets/index-*.js` chứa chuỗi `v1_fixtures`) | `grep -l v1_fixtures dist/assets/*.js` còn 1 file. Đã thử sửa tạm 2 dòng này (không commit, đã hoàn tác): grep rỗng |
| 2 | `src/design/tokens.css` (T3-A) | Thêm token `--color-boss-dim` (nền pha Boss, tối hơn nền thường ~10%, đủ 2 theme) | V1-15 bỏ `#000000` cứng; V1 dùng `var(--color-boss-dim, color-mix(… var(--color-wrong) 10% …))` nên chưa có token vẫn chạy | Nền Boss dùng màu dự phòng pha đỏ nhẹ |
| 3 | `src/design/components/KeyHint.tsx`, `AnswerInput.tsx`, `FeedbackPanel.tsx` (T3-A) | Chip phím tắt (`↵`, `H`, `Enter`) đang 11 px | `audit-ui` mã D4 (CHẶN) khi V1 có thẻ: ô gõ có chip `↵` 11 px, nút "Tiếp" có chip `Enter` 11 px. T1-A đã bỏ chip khỏi các nút của V1 (viết "(Enter)", "(H)" vào nhãn) nhưng 2 component trên là của design | D4 CHẶN ở V1 khi có thẻ (audit-ui mặc định chỉ thấy EmptyState vì DB trống nên chưa bị đếm) |
| 4 | `src/app/screens/PlayScreen.tsx` (T1-B) | Nút ✕ và nút âm thanh 35–36 px (D3); nhãn "Level 1 · Training" (D7) | 3 lỗi NẶNG còn lại của `play/v1` đều nằm ở header này (U2, U4 đã có trong task T1-B) | `play/v1` = 3 NẶNG/khung (ngưỡng ≤ 2) |
| 5 | `src/games/l1-trap-detector/**`, `l2-…`, `w1-…`, `w2-…`, `v2-…` (T2-A/B/C) | Producer ghi nội dung thẻ qua `userItemRepo.upsertWithCard(item, face, { cardSource })` | V1 chỉ hiện được thẻ có nội dung. `tfng:*`, `head:*`, `ltrap:*`, `dict:*`, `err:l1col_*` V1 đã tự dựng từ dữ liệu thật; **`err:user_*`, `err:w2_*`, `col:user_*` bắt buộc có `userItems`**, và `ltrap:*` nên kèm `audioClip` | Thẻ `err:user_*` hiện có trong DB bị V1 bỏ qua (log `missing_item`) cho tới khi producer ghi `userItems` |
| 6 | `src/games/v1-daily-run/**` HUD + RunMap (T4-A) | Ở 390×844 thẻ câu hỏi bắt đầu y = 356 px (HUD + chú thích RunMap chiếm ~300 px) | B5 / U1 không thuộc T1-A | B5 (NẶNG) |
| 7 | `e2e/m1.spec.ts` (T2-A) | Spec ghi đè ảnh trong thư mục đã track `e2e/screenshots/m1/` mỗi lần chạy | Làm bẩn working tree khi chạy | Chỉ phiền, không sai |

## Tranh chấp
(chưa có)

## Ghi chú cho điều phối
- Tiêu chí Done "`grep -l v1_fixtures dist/assets/*.js` rỗng" của T1-A **chưa đạt** chỉ vì mục 1 ở trên (file ngoài quyền). Bundle V1 và `V1DailyRun.tsx` không còn import fixture.
- `KIEM-THU.md` §1 nói T1-A viết `e2e/fixtures/seed-profile.ts`; file đó không nằm trong danh sách độc quyền của T1-A nên phần seed được viết ngay trong `e2e/v1-srs.spec.ts` (hàm `seedDueCards`). Có thể tách ra sau.
- Quy ước mới cho mọi producer: `userItemRepo.upsertWithCard` (src/core/storage/repos/userItemRepo.ts), `attemptRepo.saveProgress/finalize` (src/core/storage/repos/attemptRepo.ts). Dexie đã lên version 2.
