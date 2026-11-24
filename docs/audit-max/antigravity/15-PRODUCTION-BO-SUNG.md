# 15 · PRODUCTION BỔ SUNG (việc tốt cho production mà prompt gốc chưa nói)

> Mỗi mục có mã `PB-xx`, mức ưu tiên, chủ file (task nào làm được mà không phá luật file độc quyền), và tiêu chí xong đo được.
> **P0** = phải có trước khi báo "xong tất cả" · **P1** = nên có, làm trong đợt PB cuối nếu chưa gắn được · **P2** = làm nếu còn thời gian.
> Gắn vào task đang có nếu file thuộc task đó. Nếu không thuộc task nào: làm ở **Đợt PB** (`02-KE-HOACH.md` S10), lúc không có task nào giữ file đó, và ghi `DECISIONS.md`.
> Không mục nào được làm trái thứ tự ưu tiên của Bang (dữ liệu → phương pháp → UI/UX → tối ưu → animation) hay luật giữ công đã làm (SR-90).

## 1. Bảng tổng

| Mã | Việc | Ưu tiên | Chủ file / thời điểm |
|---|---|---|---|
| PB-01 | Phiên bản app + nhật ký thay đổi | P0 | Đợt PB (`vite.config.ts`, `package.json`, màn Cài đặt qua T3-C) |
| PB-02 | Quy trình rollback + tag mỗi cổng | P0 | AD (git) |
| PB-03 | Kiểm production sau deploy (smoke) + hằng ngày | P0 | Đợt PB (`.github/**`) |
| PB-04 | Nhật ký lỗi cục bộ + nút "Xuất chẩn đoán" | P1 | Đợt PB (`src/app/ErrorBoundary.tsx`, `src/core/diagnostics/**` mới) + T3-C (nút ở Cài đặt) |
| PB-05 | Sao lưu chủ động: nhắc định kỳ, sao lưu trước nâng cấp DB | **P0** | T3-C (`backup.ts`, Cài đặt) + chủ `src/core/storage` khi đổi schema |
| PB-06 | Kiểm migrate bằng DB thật của mọi version cũ | P0 | Chủ `src/core/storage/**` mỗi lần đổi schema |
| PB-07 | Gói học offline đầy đủ | P1 | T3-C (Cài đặt) + Đợt PB (`vite.config.ts` nếu cần) |
| PB-08 | Bảo mật và chuỗi cung ứng phụ thuộc | P1 | Đợt PB (`.github/**`, `index.html`) |
| PB-09 | Cài đặt PWA trên iPhone (icon, splash, hướng dẫn "Thêm vào màn hình chính") | **P0** (iPhone ưu tiên 1) | T3-A (`public/assets/**` icon) + Đợt PB (`index.html`, `vite.config.ts`) + T3-C (hướng dẫn ở Cài đặt) |
| PB-10 | Kiểm Safari/WebKit tự động (smoke iPhone) | P0 | Đợt PB (`playwright.config.ts`, spec mới) — cần Bang đồng ý tải WebKit (~100 MB) |
| PB-11 | Bảng phím tắt `?` + tuyên bố trợ năng | P2 | T3-A (component) + T3-C |
| PB-12 | Quyền riêng tư: dữ liệu chỉ ở máy, "Xoá dữ liệu" có xác nhận + gợi ý sao lưu trước | P1 | T3-C |
| PB-13 | Trang `#/credits` đủ: asset, audio, dữ liệu, font, thư viện | P1 | T3-A (CREDITS) + T3-C (màn) + script sinh danh sách thư viện (`scripts/qa/licenses.mjs`) |
| PB-14 | Meta chia sẻ (description, OG image, `lang="vi"`, theme-color theo theme) | P2 | Đợt PB (`index.html`) |
| PB-15 | Ảnh so sánh hồi quy (visual regression) cho 6 màn chính ở 390 | P2 | Đợt PB (spec mới, không commit ảnh) |
| PB-16 | Cờ tính năng cục bộ (`kv.flags`) để tắt Bùa/nhạc/juice nặng mà không cần deploy | P2 | T4-C (Bùa) + T3-A (fx) |
| PB-17 | Xử lý hết dung lượng (`QuotaExceededError`) | P1 | Chủ `src/core/storage/**` + T3-C (thông báo) |
| PB-18 | Tự kiểm tính toàn vẹn dữ liệu học hằng tuần | P1 | Chủ `src/core/srs/**`/`storage` (Đợt PB) |
| PB-19 | Luồng "Báo item sai" → hàng đợi sửa dữ liệu | P1 | T3-B (pipeline nhận file) + chủ FeedbackPanel (T3-A) |
| PB-20 | CI nhanh và gọn (cache, huỷ run cũ) | P2 | Đợt PB (`.github/**`) |
| PB-21 | README chạy local + `ARCHITECTURE.md` ngắn | P1 | AD / Đợt PB |
| PB-22 | Checklist phát hành mỗi cổng | P0 | AD (file này §3) |
| PB-23 | Đo hiệu năng thật trên máy người dùng (ghi cục bộ LCP/INP) | P2 | Đợt PB (`src/core/diagnostics/**`) |
| PB-24 | Bảo vệ nhánh `master` trên GitHub | P2 | **Hỏi Bang** (đổi cài đặt tài khoản) |

## 2. Chi tiết

### PB-01 Phiên bản + nhật ký thay đổi
- `vite.config.ts` `define: { __APP_VERSION__: package.json version, __GIT_SHA__: <sha ngắn lúc build>, __BUILD_DATE__ }`.
- Cài đặt → "Phiên bản 3.1.0 (abc1234 · 25/11/2026)". Bấm 5 lần thì hiện màn chẩn đoán (PB-04).
- `CHANGELOG.md` ở gốc: mỗi cổng 1 mục, lời người học ("V1 không còn chấm thẻ thiếu âm thanh").
- Tăng `version` mỗi đợt: `3.1.0` (Đợt 1), `3.2.0` (Đợt 2)…
- **Xong khi:** Cài đặt hiện đúng sha của production; CHANGELOG có mục mỗi đợt.

### PB-02 Rollback
- Mỗi cổng đạt: `git tag -a audit-max-G<n> -m "…" && git push origin audit-max-G<n>`.
- Production hỏng nặng (trắng trang, mất dữ liệu, không vào được game) → `git revert -m 1 <merge-commit>` → push → CI deploy bản trước. **Không** `push --force`.
- Ghi quy trình vào `docs/audit-max/BAO-CAO.md` mục "Rollback".
- **Xong khi:** có tag G0 (đặt lại cho `00e6cb1`), quy trình được thử 1 lần trên nhánh nháp (không push).

### PB-03 Smoke production
- Job `smoke` chạy sau `deploy` + `schedule: cron '0 1 * * *'` (08:00 giờ VN):
  - `curl` trang chủ: 200 + `<title>` V3;
  - `manifest.webmanifest` 200;
  - 1 file `data/manifest.json` 200;
  - 1 MP3 200 với header `Range` trả 206.
- Đỏ thì GitHub gửi mail cho chủ repo theo mặc định (không cần dịch vụ ngoài).
- **Xong khi:** job xanh sau deploy, cron có trong workflow.

### PB-04 Nhật ký lỗi cục bộ
- `src/core/diagnostics/log.ts`: vòng đệm 200 mục trong `kv['diag']`. Ghi `window.onerror`, `unhandledrejection`, ErrorBoundary, lỗi Dexie, lỗi tải audio/chunk. Mỗi mục có thời gian, route, version.
- "Xuất chẩn đoán" (Cài đặt) tải file JSON gồm version, UA, kích thước màn, dung lượng lưu trữ, 200 lỗi cuối, cấu hình FX tier. **Không gửi đi đâu** (SR-72).
- **Xong khi:** gây lỗi giả trong test → mục có trong file xuất.

### PB-05 Sao lưu chủ động (P0: dữ liệu học của Bang là thứ quý nhất)
- Nhắc sao lưu mỗi 7 ngày (toast ngoài `/play/*`, tắt được).
- Trước khi Dexie nâng version, lưu snapshot JSON các bảng quan trọng (`cards`, `userItems`, `attempts`, `profile`, `kv`) vào bảng/kv `snapshots` (giữ 2 bản gần nhất); có nút "Khôi phục bản trước nâng cấp".
- Sao lưu xuất file có `schemaVersion`, sha256 nội dung; nhập dùng zod thật (X12), chế độ "Gộp" mặc định.
- **Xong khi:** test migrate có snapshot; xuất → xoá DB → nhập → dữ liệu khớp 100% (E2E).

### PB-06 Kiểm migrate bằng DB thật
- Mỗi version Dexie có 1 fixture DB **có dữ liệu thật** (`src/test/fixtures/db-v<N>.json`).
- Test mở DB vN → nâng lên version mới nhất → kiểm số bản ghi và trường bắt buộc.
- **Xong khi:** CI chạy test migrate từ mọi version cũ.

### PB-07 Gói học offline
- Cài đặt → "Tải để học offline": tải trước chunk 9 game, dữ liệu đang học, audio thẻ đến hạn 7 ngày tới. Có thanh tiến độ, dung lượng ước tính, nút xoá cache audio.
- **Xong khi:** E2E: bấm tải → offline → mở từng game lần đầu vẫn chơi được.

### PB-08 Bảo mật và phụ thuộc
- `npm audit --omit=dev --audit-level=high` trong CI (không chặn deploy lúc đầu; báo vàng).
- `npm ci` dùng lockfile; không thêm script `postinstall` lạ.
- CSP meta (đã có) + `<meta name="referrer" content="no-referrer">`. Không script bên thứ ba.
- **Xong khi:** CI có bước audit; 0 lỗ hổng high ở dependency runtime.

### PB-09 PWA trên iPhone
- `apple-touch-icon` 180 px.
- `<meta name="apple-mobile-web-app-capable" content="yes">`, `apple-mobile-web-app-status-bar-style` `black-translucent`.
- `display: standalone`; icon maskable.
- Màn khởi động (splash) hoặc màu nền khớp theme.
- Hướng dẫn 3 bước có ảnh ở Cài đặt + Lexi: Chia sẻ → Thêm vào MH chính.
- Trong chế độ standalone: tôn trọng safe-area, không có thanh địa chỉ.
- **Xong khi:** chụp ảnh standalone giả lập 390×844 không bị notch che; Lighthouse PWA không cảnh báo icon.

### PB-10 Smoke WebKit
- Project `webkit-iphone` (`devices['iPhone 13']`) chạy 4 bài: Hôm nay, V1 1 câu, R1 1 câu, lật thẻ (chữ không ngược).
- **Cần Bang đồng ý tải WebKit** (Playwright, ~100 MB, nguồn chính thức). Chưa đồng ý → ghi `HANDOFF.md` "Hỏi Bang", chạy Chromium giả lập iPhone thay thế.

### PB-12 Quyền riêng tư
- Màn "Giới thiệu/Quyền riêng tư": dữ liệu học chỉ lưu trên máy; không theo dõi; chấm Writing bằng cách tự dán vào Claude chat.
- "Xoá dữ liệu": 2 bước xác nhận, có gợi ý sao lưu trước, không xoá ghi âm khi chưa hỏi.

### PB-13 `#/credits`
- Sinh danh sách thư viện runtime + giấy phép từ `node_modules/*/package.json` bằng script (không thêm thư viện).
- Màn hiện các nhóm: asset (CREDITS), audio (engine, giọng), dữ liệu (CC BY-SA ghi công), font, thư viện.

### PB-17 Hết dung lượng
- Bắt `QuotaExceededError` ở ghi Dexie và cache audio. Thông báo "Bộ nhớ đầy" + nút "Xoá cache audio cũ". Không mất bản ghi học đang ghi: thử lại sau khi giải phóng.

### PB-18 Toàn vẹn dữ liệu học
- Mỗi tuần (lần mở app đầu tiên trong tuần, lúc rảnh) kiểm:
  - thẻ mồ côi (không có nội dung);
  - thẻ trùng;
  - `due` không hợp lệ;
  - attempt chưa `finalize` quá 24 giờ.
- Sửa an toàn: gắn `suspended`, không xoá. Ghi vào nhật ký chẩn đoán.

### PB-19 Báo item sai
- "⚑ Báo item sai" (đã có ở FeedbackPanel) ghi `kv['flags']` và ẩn item khỏi pool.
- Cài đặt → "Xuất danh sách báo lỗi" thành JSON có định dạng mà `scripts/data` đọc được, để agent dữ liệu sửa theo lô.

### PB-20 CI
- `concurrency: { group: ${{ github.ref }}, cancel-in-progress: true }`.
- Cache `~/.npm` và thư mục trình duyệt Playwright.
- Thời gian verify mục tiêu ≤ 6 phút.

### PB-21 Tài liệu
- `README.md`: chạy local, test, build, deploy, cấu trúc thư mục.
- `docs/ARCHITECTURE.md` (≤ 2 trang): luồng dữ liệu (data → loader → game → attempt → FSRS → Hôm nay), các bảng Dexie, ranh giới `core` (không React) và `features`.

### PB-23 Đo hiệu năng thật
- Ghi LCP và INP của 20 lần mở app gần nhất vào `kv['perf']`. Hiện ở màn chẩn đoán. Không gửi đi.

## 3. Checklist phát hành mỗi cổng (PB-22, AD chạy)
- [ ] `master` sạch, CI xanh, `git rev-list --left-right --count origin/master...master` = `0 0`
- [ ] Production: title, 0 lỗi console ở Hôm nay + 1 game (iPhone 390 giả lập)
- [ ] `validate:data` (và `:release` khi đã bật) exit 0
- [ ] Ngân sách `14` §1 đạt (số ghi vào BAO-CAO)
- [ ] Test migrate xanh nếu đổi schema; sao lưu → khôi phục E2E xanh
- [ ] Tag `audit-max-G<n>` đã push
- [ ] `CHANGELOG.md`, `BAO-CAO.md`, `PROGRESS.md`, `01-TRANG-THAI.md` §6 cập nhật
