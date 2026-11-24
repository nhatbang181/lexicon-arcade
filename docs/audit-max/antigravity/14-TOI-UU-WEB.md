# 14 · TỐI ƯU WEB (ưu tiên số 4)

> Nguồn: `docs/audit-max/06-PRODUCTION.md` (X1–X20, ngân sách §3), `KIEM-THU.md` §2 #11–#14. Luật: `LUAT.md` P1–P8, `04-LUAT-CUNG.md` SR-49.
> Hiện trạng sau Đợt 1: JS ở `#/` ≈ 136 KB gzip, CSS 126 KB, precache 1 436 KiB, LCP Hôm nay ≈ 1,9–2,2 s, INP ≈ 72–104 ms (đo trên máy dev). **Phải giữ được các số này khi thêm asset và juice ở Đợt 3–4.**

## 0. Tóm tắt 10 dòng
1. Ngân sách là luật: JS `#/` ≤ 250 KB gzip, CSS ≤ 130 KB, mỗi game ≤ 120 KB gzip, precache ≤ 1 500 KiB, LCP ≤ 2,5 s, INP ≤ 200 ms, 0 frame > 32 ms.
2. Đo trên **khung iPhone** (390×844, CPU ×4, Fast 4G), vì iPhone là ưu tiên 1. Laptop nhanh không phải bằng chứng.
3. Mọi route trừ Hôm nay lazy; game, asset, dữ liệu tải theo màn.
4. Dữ liệu JSON minify + tách lõi/chi tiết; tải đầu 1 game ≤ 400 KB nén.
5. Ảnh đúng cỡ (@1x/@2x/@3x), WebP/AVIF, `loading="lazy"`, `decoding="async"`, có `width/height`.
6. Font: subset latin+vietnamese, woff2, `font-display: swap`, preload đúng 1–2 file chữ chính.
7. PWA: precache chỉ shell; data `StaleWhileRevalidate`, audio `CacheFirst` + range; cập nhật bằng toast (không tự reload giữa phiên).
8. IndexedDB: truy vấn theo index, ghi theo lô, không đọc cả bảng lên React.
9. React: không re-render theo frame; memo danh sách; tách component nặng.
10. CI chặn khi vượt ngân sách (`scripts/qa/size-budget.mjs`, `e2e/perf.spec.ts`).

## 1. Ngân sách và cách đo

| Chỉ số | Ngưỡng | Lệnh / công cụ |
|---|---|---|
| JS khởi động `#/` | ≤ 250 KB gzip | `npx vite build && node scripts/qa/size-budget.mjs` |
| CSS chính | ≤ 130 KB raw | như trên |
| Chunk mỗi game | ≤ 120 KB gzip | như trên |
| Precache | ≤ 1 500 KiB | log `vite build` (workbox) |
| LCP Hôm nay | ≤ 2,5 s (mục tiêu 1,5) | `e2e/perf.spec.ts` trên `vite preview`, CDP CPU ×4 + Fast 4G, viewport 390×844 |
| INP chọn đáp án | ≤ 200 ms | như trên |
| Frame > 32 ms (30 s V1) | 0 | như trên + `13-ANIMATION.md` §6 |
| CLS | ≤ 0,05 | `PerformanceObserver` layout-shift trong `perf.spec` (thêm nếu chưa có) |
| Tải đầu dữ liệu 1 game | ≤ 400 KB nén | `read_network_requests` / `performance.getEntriesByType('resource')` |
| Bộ nhớ JS heap sau 10 phút chơi | không tăng mãi (≤ +30 MB) | `performance.memory` (Chrome) trong script perf dài, chạy 1 lần mỗi đợt |

## 2. Chia code
- Route: `React.lazy` mọi route trừ Today (đã có, X5). Game nạp khi mở.
- **Prefetch thông minh**: khi Hôm nay đã render xong và rảnh (`requestIdleCallback`), prefetch chunk của **việc tiếp theo** (1 game), không prefetch tất cả.
- `manualChunks`: `vendor` (react, react-dom, wouter), `data` (dexie, dexie-react-hooks, ts-fsrs), `zod`. Thư viện chỉ dùng ở 1 màn (canvas-confetti, d3, Lottie) để màn đó tự kéo.
- Không import cả thư viện icon: `lucide-react` import từng icon.
- Thư viện mới phải đo gzip trước khi thêm (A5); vượt ngân sách thì không thêm.

## 3. Dữ liệu
- Bản phát hành minify; bản đẹp ở `data-src` (D17).
- `words.core.json` (id, headword, ipa, meaningVi, audio, level) < 1 MB thô; chi tiết tải khi mở thẻ.
- V1 chỉ tải phần thẻ đến hạn + quota thẻ mới, không tải cả kho.
- Fetch có `cache: 'no-cache'` cho manifest (biết bản mới), còn file nội dung đặt tên có hash hoặc `rev` để cache lâu.
- Parse JSON lớn ngoài luồng chính khi > 1 MB (Web Worker) nếu đo thấy INP xấu.

## 4. Ảnh, icon, nhân vật
- Mỗi ảnh xuất @1x/@2x/@3x (iPhone là màn 3x). Dùng `srcset` + `sizes`, WebP, AVIF nếu nhỏ hơn rõ.
- `loading="lazy"` cho ảnh dưới màn đầu; ảnh hero (LCP) **không** lazy, có `fetchpriority="high"`.
- Luôn có `width`/`height` hoặc `aspect-ratio` (tránh CLS; liên quan luật crop `11` §6).
- Nhân vật động tải lười, sau khi màn khung đã render; có ảnh tĩnh hiện trước.
- SVG inline chỉ cho icon hệ thống nhỏ; minh họa lớn dùng `<img src=*.svg>` để trình duyệt cache.

## 5. Font
- Chỉ subset `latin` + `vietnamese`, woff2 (X8 đã làm cho font cũ; làm tương tự cho Baloo 2).
- `font-display: swap`; preload 1 file (Be Vietnam Pro 400 vietnamese). Font hiển thị (Baloo 2) không preload.
- Kiểm glyph tiếng Việt trước khi chọn font (chuỗi kiểm ở `03` §9).

## 6. PWA và cache
- Precache: chỉ shell (HTML, entry JS/CSS, font chính, icon PWA). Đã ≤ 1,5 MB, đừng làm phình.
- `runtimeCaching`:
  - chunk game: `CacheFirst` (đã có);
  - `/data/*.json`: `StaleWhileRevalidate`;
  - `/audio/*.mp3`: `CacheFirst` + `rangeRequests:true`, hết hạn 90 ngày, tối đa N mục;
  - `/assets/*`: `CacheFirst`.
- **Offline đầy đủ** (PB-07): nút "Tải để học offline" ở Cài đặt, tải trước chunk 9 game + dữ liệu đang học + audio của thẻ đến hạn 7 ngày tới, có thanh tiến độ và dung lượng.
- Cập nhật: `registerType:'prompt'`; toast "Có bản mới · Tải lại" chỉ hiện ngoài `/play/*` (X9); ErrorBoundary bắt lỗi chunk cũ → reload 1 lần (cờ `sessionStorage`).
- Lưu ý bẫy: hàm `urlPattern` trong `runtimeCaching` được **chép** vào `sw.js`, nên không được dùng biến ngoài hàm (`16-GHI-CHU-BAY.md` N-07).

## 7. IndexedDB (Dexie)
- Truy vấn bằng index (`where('due').below(now)`), không `toArray()` cả bảng rồi lọc.
- Ghi theo lô trong 1 transaction (`bulkPut`), đặc biệt ở `saveProgress` (debounce 500–1 000 ms do caller).
- `useLiveQuery` chỉ cho dữ liệu nhỏ hiển thị trực tiếp; số liệu nặng (Thống kê) tính một lần, cache trong `kv`.
- `navigator.storage.persist()` (F18) và hiển thị dung lượng; Safari iOS có thể xoá dữ liệu site không dùng 7 ngày nếu chưa "Thêm vào màn hình chính" → nhắc người dùng cài PWA + có sao lưu (PB-05).

## 8. React
- Không `setState` mỗi frame; dùng `MotionValue`/ref.
- Danh sách > 50 mục dùng ảo hoá hoặc phân trang.
- `memo` cho thẻ trong lưới; key ổn định.
- Tránh đo layout (`getBoundingClientRect`) trong vòng lặp; gom đọc rồi ghi.
- Không để cảnh báo React key hay `act` trong test (P6).

## 9. Safari iOS (ưu tiên 1 – bắt buộc kiểm)
| Vấn đề | Cách làm |
|---|---|
| Âm thanh chỉ phát sau thao tác người dùng | Mở khoá `AudioContext`/Howler ở lần chạm đầu (nút "Bắt đầu"); không autoplay audio học trước chạm (L1-10) |
| Chế độ im lặng (công tắc rung) | Web Audio có thể bị tắt tiếng; hiện gợi ý nhỏ "Tắt chế độ im lặng để nghe" khi phát audio học mà không có tiến trình phát |
| `100vh` sai khi thanh địa chỉ co giãn | Dùng `100dvh` / `100svh`; nút dính đáy dùng `env(safe-area-inset-bottom)` |
| Notch/Dynamic Island | `viewport-fit=cover` + padding safe-area ở header/tab |
| Bàn phím ảo che nút | `visualViewport` resize → đưa ô gõ và nút "Kiểm tra" lên trên bàn phím |
| Tự zoom khi focus ô nhập | font-size ô nhập ≥ 16 px |
| Rung | `navigator.vibrate` không có trên iOS → luôn có kênh khác (J1) |
| IndexedDB bị xoá sau 7 ngày không dùng (chưa cài PWA) | nhắc "Thêm vào màn hình chính", `persist()`, sao lưu (PB-05) |
| `backface-visibility` | cần tiền tố `-webkit-` (`13` §5.1) |
| Cuộn nảy (overscroll) kéo cả trang khi kéo trong thẻ | `overscroll-behavior: contain` ở vùng cuộn trong |
| Hover dính sau khi chạm | dùng `@media (hover: hover)` cho hiệu ứng hover |

**Kiểm:**
- Playwright `--project=webkit` (cài `npx playwright install webkit`, cần Bang đồng ý tải khoảng 100 MB; nếu chưa đồng ý thì ghi HANDOFF) chạy smoke trên iPhone 390: Hôm nay, V1 1 câu, R1 1 câu, lật thẻ.
- Ngoài ra Bang thử tay trên iPhone thật mỗi mốc (ghi checklist trong `BAO-CAO.md`).

## 10. Lệnh
```bash
npx vite build && node scripts/qa/size-budget.mjs
npx vite preview --port <preview> --strictPort &
PW_PORT=<pw> PW_CHANNEL=chrome npx playwright test e2e/perf.spec.ts e2e/offline.spec.ts
grep -l "Thư viện component\|v1_fixtures\|r1_fixtures\|TASK2_CLAUDE_RESPONSE\|pixelated" dist/assets/*   # rỗng
```
