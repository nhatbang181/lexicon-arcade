# HANDOFF · đợt audit-max

## Cần chủ sở hữu file khác (từ T1-B, 23/11/2026)

| # | File | Chủ | Cần làm | Vì sao |
|---|---|---|---|---|
| 1 | `e2e/m1.spec.ts` | điều phối (chưa thuộc task nào) · **ĐÃ XỬ LÝ trong T1-C (24/11/2026)** | Sau `onboarding-next-2` thêm `await expect(page.getByRole('heading', { name: 'Thử loa và micro' })).toBeVisible(); await page.getByTestId('onboarding-next-3').click();`; đổi `'Chào Bang · Hôm nay học gì?'` thành `'Chào bạn · Hôm nay học gì?'` | Onboarding nay 4 bước (F10), tên mặc định "bạn" (F11). Đã chạy thử: hiện m1 đỏ ở bước chờ heading 'Định vị nhanh vốn từ học thuật' ngay sau `onboarding-next-2` |
| 2 | `e2e/screenshots.spec.ts` | điều phối · **ĐÃ XỬ LÝ trong T1-C (24/11/2026)** | `expectedHeading` của `today`: `'Chào bạn · Hôm nay học gì?'` | F11 |
| 3 | `src/games/registry.ts` | chưa thuộc task nào | (a) `GameProps` thêm tuỳ chọn `from?: 'today'`, `nextTask?: { taskId; gameId; title; path }`, `onNextTask?: () => void` (PlayScreen đã truyền, hiện bỏ qua nếu game không nhận); (b) bỏ chữ "FSRS" khỏi `subtitleVi` của V1 (D7, hiện lộ ở thẻ Hub) | F5, D7 |
| 4 | `src/design/components/RecapScreen.tsx` | T3-A | Nhận `nextTask` + `onNextTask` → nút chính "Tiếp: {title} (Enter)" | F5 (T1-B chỉ truyền prop qua PlayScreen) |
| 5 | Mọi game (V1: T1-A; V2/V3/R1/R2: T2-A; L1/L2: T2-B; W1/W2: T2-C) | chủ từng game | Gọi `registerProgressSaver(() => attemptRepo.saveProgress(...))` (từ `src/core/adaptive/progressSaver`) trong `useEffect` và huỷ khi unmount | F1: hộp thoát chỉ ghi "Lưu và thoát" khi game đã đăng ký; chưa game nào đăng ký nên hiện nhãn "Thoát" + lời nhắc chưa lưu |
| 6 | `src/core/planner/today.ts` | chưa thuộc task nào | `now.getUTCDay()` (cuối tuần gợi ý X1) và `MS_PER_DAY` trừ ngày nên dùng giờ địa phương như `formatDateKey` | F3 phần còn lại; `formatDateKey` đã được sửa nên `date` và khoá "hôm qua" đúng, riêng `isWeekend` vẫn theo UTC |
| 7 | `src/design/components/KeyHint.tsx` | T3-A | `text-[11px]` vi phạm D4 (T1-B đã bỏ 2 chỗ dùng `hotkey="Enter"` ở Hôm nay) | D4 |
| 8 | `src/games/v1-daily-run/**` | T1-A | audit-ui trên `play/v1`: D3 nút "Chế độ bận (10 thẻ)" cao 26 px, "Gợi ý/Không nhớ" cao 36 px; D4 số trên bản đồ node 10 px; D7 "Node 1/30"; bản đồ node làm tràn ngang 4–8 px ở 390 (D5, lúc có lúc không) | ngoài file độc quyền của T1-B |
| 9 | `src/design/components/Modal.tsx`, `Sheet.tsx` | T3-A | Nên gọi `e.preventDefault()` khi đóng bằng Esc (hiện chưa). T1-B đã xử lý bằng cách bỏ qua Esc khi có `[role=dialog][aria-modal=true]` ngoài hộp thoát của PlayScreen; khi T3-A thêm `preventDefault()` thì PlayScreen vẫn đúng (cũng đọc `defaultPrevented`) | F1 |

## Cần chủ sở hữu file khác (từ T1-C, 24/11/2026)

| # | File | Chủ | Cần làm | Vì sao |
|---|---|---|---|---|
| 1 | `src/app/App.tsx` (hoặc component shell) | chủ shell (T3-C) | Lắng nghe `window.addEventListener('lexicon:sw-update', …)` rồi hiện toast "Có bản mới · Tải lại" **chỉ khi không ở `/play/*`**; nút gọi `window.__lexiconApplyUpdate?.()`. `src/main.tsx` đã đăng ký service worker (`registerType:'prompt'`) và phát sự kiện | X9: chưa có UI nên bản mới chỉ áp dụng khi đóng hết tab; chunk lỗi sau deploy đã được `vite:preloadError` tải lại 1 lần (cờ `sessionStorage`) |
| 2 | `src/games/v1-daily-run/V1DailyRun.tsx` | T1-A | Chunk production còn chứa `v1_fixtures` (32 KB); chỉ import khi `import.meta.env.MODE === 'test'` hoặc dev | X6; `scripts/qa/size-budget.mjs` in "CHỜ" |
| 3 | `src/games/r1-tfng-judge/**`, `src/games/v2-collocation-forge/**`, `src/games/v3-paraphrase-radar/**` | T2-A | Chunk production còn `r1_fixtures` (36 KB) và `v2v3_fixtures` (43 KB) | X6; cùng script |
| 4 | `src/games/*/index.ts` | chủ từng game | 8 cảnh báo Rollup "dynamic import will not move module": `index.ts` vừa export tĩnh component vừa import động nó. Bỏ export tĩnh | X5 |
| 5 | tokens / màu nhấn (`src/design/tokens.css`) | T3-A | `node scripts/qa/contrast.mjs`: 135 cặp, 53 dưới ngưỡng WCAG (dark 4, light 37, exam 12). Theme sáng: nút chữ `--color-bg` trên màu nhấn 1,81–3,99:1 | D2. Ngưỡng nợ axe ghi ở `e2e/a11y.spec.ts` (`KNOWN_DEBT`); khi sửa xong hãy hạ số hoặc đặt `A11Y_STRICT=1` |
| 6 | shell, game | T3-A / T3-C | axe: `label-content-name-mismatch` ở Hôm nay/Hub/Cài đặt (1 nút), `scrollable-region-focusable` ở V1/R1 (1 vùng cuộn), `color-contrast` ở W1 (120–123 node) | D2 |
| 7 | `CHOI_GAME_TIENG_ANH.bat`, `run_game.bat`, `LEXICON ARCADE.lnk` (gốc repo) | điều phối | X15 phần chuyển vào `scripts/launch/` (cần hỏi Bang trước khi xoá `run_game.bat`). T1-C chỉ gitignore `*.lnk` và bỏ `e2e/screenshots/` khỏi git | ngoài danh sách file của T1-C |
| 8 | `scripts/*.js`, `scripts/*.py` ở gốc `scripts/` | điều phối | X16 chuyển vào `scripts/legacy/` | ngoài danh sách file của T1-C |
| 9 | `tsconfig.json` | chưa thuộc task nào | X18: bật `noUnusedLocals`, `noUnusedParameters` | không có trong danh sách T1-C |
| 10 | GitHub repo variables | điều phối / Bang | Đặt biến `RELEASE_GATE=1` (Settings > Variables) **sau T3-B** để CI chạy `validate:data:release` trên master. Hiện: 2 835 lỗi | D3 |
