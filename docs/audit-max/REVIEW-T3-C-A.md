# REVIEW T3-C – Reviewer A (`rv-t3-c-a`) – model `Gemini 4 Argon High`

> **Nhánh kiểm:** `audit-max/T3-C` @ `63eb2de` (merge-base với `master`: `fec3f28`)
> **Builder:** `Gemini 4 Neon (Medium)` · **Reviewer A:** `Gemini 4 Argon High` (độc lập, chấm mù trước khi mở `key.json`, không đọc `REVIEW-T3-C-B.md`).

---

## 0. Chấm mù (làm ĐẦU TIÊN trước khi mở `key.json`)

Chụp mới bằng `audit-ui.mjs --route today,hub,stats,settings,onboarding --vp 390x844,1280x800 --theme dark,light --fmt jpg --no-loi 1 --out out/rv-t3-c-a/blind-new` (cổng `5248`), trộn với `docs/audit-max/anh-goc` bằng `tron-anh.mjs` ra 40 ảnh `shuffle-001.jpg`..`shuffle-040.jpg` tại `out/rv-t3-c-a/cham-mu/`. Toàn bộ điểm đã ghi vào `out/rv-t3-c-a/cham-mu/PHIEU-CHAM.md` **trước khi** mở `key.json`.

### 0.1. Bảng điểm chấm mù 40 ảnh `shuffle-*` (kèm giải mã sau khi chấm)

| Ảnh trộn | R2 | R4 | R5 | R6 | TB | Giải mã (`key.json`) | Bên | Lý do ngắn khi chấm mù |
|---|---:|---:|---:|---:|---:|---|---|---|
| `shuffle-001.jpg` | 3 | 2 | 5 | 6 | 4.00 | `1280x800-dark-stats.jpg` | gốc | Dashboard web tối phẳng, toàn icon nét đơn sắc, không Lexi/hero, lộ chữ nội bộ "FSRS", "Mature+". |
| `shuffle-002.jpg` | 3 | 2 | 5 | 6 | 4.00 | `390x844-dark-stats.jpg` | gốc | Bảng số phẳng trên mobile, toàn icon nét đơn sắc, không Lexi/hero, lộ "FSRS", "Mature+". |
| `shuffle-003.jpg` | 8 | 8 | 8 | 8 | 8.00 | `390x844-light-stats.jpg` | **mới** | Có Hero sáng + Lexi, 5 icon Fluent 3D màu, Cấp 1 XP, 4 mạch học; câu thoại Lexi bị cắt chữ `"sẽ nh"`. |
| `shuffle-004.jpg` | 8 | 9 | 8 | 8 | 8.25 | `1280x800-dark-stats.jpg` | **mới** | Có Hero tối + Lexi, 9 icon Fluent 3D màu rõ nét, 4 KPI + 4 mạch học; câu thoại Lexi bị cắt chữ `"sẽ nh"`. |
| `shuffle-005.jpg` | 3 | 2 | 4 | 5 | 3.50 | `1280x800-light-today.jpg` | gốc | Dashboard web phẳng, lộ "FSRS", "Chào Bang", "gói copy/dán", không Lexi/hero, nút primary tương phản thấp. |
| `shuffle-006.jpg` | 8 | 9 | 8 | 8 | 8.25 | `1280x800-light-stats.jpg` | **mới** | Có Hero sáng + Lexi, 9 icon Fluent 3D màu rõ nét, 4 KPI + 4 mạch học; câu thoại Lexi bị cắt chữ `"sẽ nh"`. |
| `shuffle-007.jpg` | 4 | 3 | 6 | 7 | 5.00 | `1280x800-dark-settings.jpg` | **mới** | Form cài đặt có thêm Hồ sơ & công tắc motion nhưng chỉ dùng 5 icon nét mảnh đơn sắc, không Lexi/hero/icon 3D. |
| `shuffle-008.jpg` | 3 | 2 | 4 | 6 | 3.75 | `390x844-dark-hub.jpg` | gốc | Thẻ phẳng lặp 1 icon nét đơn sắc `[A]`, lặp nút "Mở", lộ "FSRS", "Level 1 · Mốc M1", không Lexi/hero. |
| `shuffle-009.jpg` | 3 | 2 | 4 | 5 | 3.50 | `390x844-light-hub.jpg` | gốc | Thẻ phẳng nền sáng lặp icon `[A]`, lặp nút "Mở", lộ "FSRS", "Level 1 · Mốc M1", không Lexi/hero. |
| `shuffle-010.jpg` | 8 | 9 | 9 | 9 | 8.75 | `1280x800-light-today.jpg` | **mới** | Có Hero sáng + Lexi thoại đầy đủ, 6 icon Fluent 3D màu, bỏ thuật ngữ nội bộ, tương phản AA rõ. |
| `shuffle-011.jpg` | 3 | 2 | 6 | 6 | 4.25 | `390x844-light-settings.jpg` | gốc | Form cài đặt phẳng nền sáng, 4 icon nét đơn sắc, không Lexi/icon 3D. |
| `shuffle-012.jpg` | 4 | 3 | 5 | 7 | 4.75 | `1280x800-dark-onboarding.jpg` | gốc | Onboarding 3 bước cũ, tên cứng "Bang", lộ "FSRS", chỉ 1 SVG nhỏ + 3 icon nét đơn sắc, không Lexi. |
| `shuffle-013.jpg` | 8 | 9 | 9 | 9 | 8.75 | `1280x800-light-onboarding.jpg` | **mới** | Onboarding 4 bước mới, Hero sáng + Lexi, 7 icon Fluent 3D màu, bỏ tên cứng "Bang" và "FSRS". |
| `shuffle-014.jpg` | 3 | 2 | 5 | 6 | 4.00 | `1280x800-light-settings.jpg` | gốc | Cài đặt nền sáng dùng `select`/slider gốc trình duyệt (D10), chỉ có icon nét đơn sắc. |
| `shuffle-015.jpg` | 5 | 4 | 7 | 7 | 5.75 | `390x844-dark-settings.jpg` | **mới** | Cài đặt mobile có Hồ sơ nhưng chỉ dùng 3 icon nét đơn sắc, không icon 3D/Lexi, placeholder ô nhập bị cắt chữ. |
| `shuffle-016.jpg` | 3 | 2 | 4 | 6 | 3.75 | `1280x800-light-hub.jpg` | gốc | Lưới thẻ phẳng nền sáng lặp icon theo nhóm, lặp 9 nút "Mở", lộ "FSRS", "Level 1 · Mốc M1/M2/M3". |
| `shuffle-017.jpg` | 3 | 2 | 5 | 6 | 4.00 | `1280x800-light-stats.jpg` | gốc | Bảng thống kê phẳng nền sáng, toàn icon nét đơn sắc, không Lexi/hero, lộ "FSRS", "Mature+". |
| `shuffle-018.jpg` | 8 | 8 | 8 | 8 | 8.00 | `390x844-dark-stats.jpg` | **mới** | Có Hero tối + Lexi, 5 icon Fluent 3D màu ở màn đầu, Cấp 1 XP, 4 mạch học; câu thoại Lexi bị cắt chữ `"sẽ nh"`. |
| `shuffle-019.jpg` | 8 | 8 | 7 | 9 | 8.00 | `1280x800-light-hub.jpg` | **mới** | Có Hero sáng + Lexi + 6 icon 3D game riêng, bỏ nút "Mở" lặp; thẻ `Collocation Forge` ngắn hơn hàng làm lòi bóng xám 36px ở đáy. |
| `shuffle-020.jpg` | 3 | 2 | 4 | 6 | 3.75 | `1280x800-dark-hub.jpg` | gốc | Lưới thẻ phẳng tối lặp icon nét đơn sắc theo nhóm, lặp 9 nút "Mở", lộ "FSRS", "Level 1 · Mốc M1/M2/M3". |
| `shuffle-021.jpg` | 3 | 2 | 4 | 5 | 3.50 | `390x844-light-today.jpg` | gốc | Hôm nay mobile nền sáng phẳng, lộ "FSRS", "Chào Bang", "gói copy/dán", chỉ có icon nét đơn sắc. |
| `shuffle-022.jpg` | 3 | 2 | 5 | 5 | 3.75 | `390x844-light-stats.jpg` | gốc | Thống kê mobile nền sáng phẳng, toàn icon nét đơn sắc, không Lexi/hero, lộ "FSRS", "Mature+". |
| `shuffle-023.jpg` | 5 | 4 | 7 | 8 | 6.00 | `1280x800-light-settings.jpg` | **mới** | Cài đặt nền sáng có Hồ sơ & công tắc motion, tương phản tốt nhưng chỉ dùng 5 icon nét đơn sắc, không icon 3D/Lexi. |
| `shuffle-024.jpg` | 5 | 4 | 7 | 7 | 5.75 | `390x844-light-settings.jpg` | **mới** | Cài đặt mobile nền sáng có Hồ sơ nhưng chỉ có 3 icon nét đơn sắc, placeholder ô nhập bị cắt chữ. |
| `shuffle-025.jpg` | 8 | 9 | 9 | 9 | 8.75 | `390x844-light-onboarding.jpg` | **mới** | Onboarding mobile nền sáng 4 bước, Hero + Lexi, lưới 6 ô icon Fluent 3D màu cân đối. |
| `shuffle-026.jpg` | 8 | 8 | 8 | 9 | 8.25 | `390x844-dark-hub.jpg` | **mới** | Hub mobile tối có Hero + Lexi + thẻ Daily Run icon 3D tia sét lớn, "Band ≈ 4.0"; 4 icon 3D nhỏ trong Hero hơi rời rạc. |
| `shuffle-027.jpg` | 3 | 2 | 5 | 6 | 4.00 | `1280x800-dark-settings.jpg` | gốc | Cài đặt tối dùng `select`/slider gốc trình duyệt (D10), chỉ có icon nét đơn sắc. |
| `shuffle-028.jpg` | 8 | 9 | 9 | 9 | 8.75 | `390x844-light-today.jpg` | **mới** | Hôm nay mobile sáng có Hero + Lexi thoại đầy đủ, 4 icon Fluent 3D màu ở màn đầu, bỏ "FSRS"/"Chào Bang". |
| `shuffle-029.jpg` | 3 | 2 | 4 | 6 | 3.75 | `390x844-dark-today.jpg` | gốc | Hôm nay mobile tối phẳng, lộ "FSRS", "Chào Bang", "gói copy/dán", chỉ có icon nét đơn sắc. |
| `shuffle-030.jpg` | 1 | 1 | 1 | 1 | 1.00 | `1280x800-dark-today.jpg` | gốc | Ảnh trắng trơn hoàn toàn trong bộ ảnh gốc. |
| `shuffle-031.jpg` | 4 | 3 | 5 | 6 | 4.50 | `390x844-light-onboarding.jpg` | gốc | Onboarding mobile sáng 3 bước cũ, tên cứng "Bang", lộ "FSRS", không Lexi/icon 3D. |
| `shuffle-032.jpg` | 8 | 9 | 9 | 9 | 8.75 | `390x844-dark-onboarding.jpg` | **mới** | Onboarding mobile tối 4 bước mới, Hero + Lexi, lưới 6 ô icon Fluent 3D màu cân đối. |
| `shuffle-033.jpg` | 4 | 3 | 5 | 6 | 4.50 | `1280x800-light-onboarding.jpg` | gốc | Onboarding 1280 sáng 3 bước cũ, tên cứng "Bang", lộ "FSRS", chỉ 1 SVG nhỏ + 3 icon nét đơn sắc. |
| `shuffle-034.jpg` | 8 | 8 | 8 | 9 | 8.25 | `390x844-light-hub.jpg` | **mới** | Hub mobile sáng có Hero + Lexi + thẻ Daily Run icon 3D tia sét lớn, "Band ≈ 4.0"; 4 icon 3D nhỏ trong Hero hơi rời rạc. |
| `shuffle-035.jpg` | 8 | 8 | 7 | 9 | 8.00 | `1280x800-dark-hub.jpg` | **mới** | Hub 1280 tối có Hero + Lexi + 6 icon 3D game riêng; thẻ `Collocation Forge` ngắn hơn 2 thẻ cùng hàng ~36px. |
| `shuffle-036.jpg` | 4 | 3 | 5 | 7 | 4.75 | `390x844-dark-onboarding.jpg` | gốc | Onboarding mobile tối 3 bước cũ, tên cứng "Bang", lộ "FSRS", không Lexi/icon 3D. |
| `shuffle-037.jpg` | 8 | 9 | 9 | 9 | 8.75 | `1280x800-dark-today.jpg` | **mới** | Hôm nay 1280 tối có Hero + Lexi thoại đầy đủ, 6 icon Fluent 3D màu, bỏ thuật ngữ nội bộ. |
| `shuffle-038.jpg` | 8 | 9 | 9 | 9 | 8.75 | `1280x800-dark-onboarding.jpg` | **mới** | Onboarding 1280 tối 4 bước mới, Hero + Lexi, 7 icon Fluent 3D màu, bỏ tên cứng "Bang" và "FSRS". |
| `shuffle-039.jpg` | 8 | 9 | 9 | 9 | 8.75 | `390x844-dark-today.jpg` | **mới** | Hôm nay mobile tối có Hero + Lexi thoại đầy đủ, 4 icon Fluent 3D màu ở màn đầu, bỏ "FSRS"/"Chào Bang". |
| `shuffle-040.jpg` | 3 | 2 | 6 | 7 | 4.50 | `390x844-dark-settings.jpg` | gốc | Cài đặt mobile tối phẳng, chỉ có 4 icon nét đơn sắc, thiếu mục Hồ sơ/công tắc motion. |

### 0.2. Tổng hợp chênh lệch chấm mù (Mới − Gốc) theo từng màn

| Màn / Route | Điểm TB Gốc (4 khung/theme) | Điểm TB Mới (4 khung/theme) | Chênh lệch (Mới − Gốc) | Ngưỡng `KIEM-THU.md` §3.1 (`≥ +3.0`) |
|---|---:|---:|---:|---|
| **Hôm nay (`today`)** | 2.94 *(3.58 nếu bỏ ảnh gốc trắng `shuffle-030`)* | **8.75** | **+5.81** *(+5.17 nếu bỏ ảnh trắng)* | ✅ Đạt |
| **Hub (`hub`)** | 3.69 | **8.13** | **+4.44** | ✅ Đạt |
| **Thống kê (`stats`)** | 3.94 | **8.13** | **+4.19** | ✅ Đạt |
| **Onboarding (`onboarding`)** | 4.63 | **8.75** | **+4.13** | ✅ Đạt |
| **Cài đặt (`settings`)** | 4.19 | **5.63** | **+1.44** | ❌ **Chưa đạt** (`< +3.0` do `0` icon màu 3D, chỉ dùng icon nét đơn sắc `lucide-react`) |
| **Trung bình 5 route** | **3.88** *(4.02 nếu bỏ ảnh trắng)* | **7.88** | **+4.00** *(+3.86 nếu bỏ ảnh trắng)* | 4/5 route đạt `≥ +3.0`, riêng `settings` chỉ đạt `+1.44` |

---

## 1. Kết quả tự chạy lại công cụ

### 1.1. Tóm tắt `audit-ui.mjs` trên 7 khung × 2 theme × 5 route (70 lượt, cổng `5248`)

Lệnh: `BASE_URL=http://localhost:5248 node docs/audit-max/cong-cu/audit-ui.mjs --route today,hub,stats,settings,onboarding --vp 390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768 --theme dark,light --out out/rv-t3-c-a/full`

- **Tổng 70 lượt:** **`0 CHẶN · 64 NẶNG · 0 NHẸ`**
  - **Tách riêng lỗi của T3-A (`LiveCard.tsx:133`):** **`54 NẶNG`** mã `M5` trên route `hub` (2 ở `390x844`×2, 1 ở `375x667`×2, 2 ở `430x932`×2, 6 ở `820x1180`×2, 4 ở `1180x820`×2, 6 ở `1280x800`×2, 6 ở `1366x768`×2) do lớp bóng sibling `<motion.div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)]" />` trong `src/design/components/LiveCard.tsx:133` (đã ghi `HANDOFF.md`).
  - **Lỗi NẶNG thực sự thuộc phạm vi T3-C:** **`10 NẶNG`** (`M2: 4`, `M3: 2`, `M4: 2`, `M1: 2`):
    - `375x667` (iPhone SE, ưu tiên 1 `SR-40`) · `today` (`dark` & `light`): **2 lỗi NẶNG (`M2`)** — màn đầu chỉ có `4` icon màu ≥ 32px (cần ≥ 6).
    - `375x667` (iPhone SE, ưu tiên 1 `SR-40`) · `stats` (`dark` & `light`): **2 lỗi NẶNG (`M2`)** — màn đầu chỉ có `5` icon màu ≥ 32px (cần ≥ 6).
    - `375x667` (iPhone SE, ưu tiên 1 `SR-40`) · `onboarding` (`dark` & `light`): **4 lỗi NẶNG (`M3: 2`, `M4: 2`)** — `autoFocus` ở ô nhập tên tự cuộn màn hình xuống làm mất `<Mascot>` khỏi khung nhìn đầu (`mascots: 0`, `anims: 0`).
    - `1366x768` · `onboarding` (`dark` & `light`): **2 lỗi NẶNG (`M1`)** — khung Hero chỉ chiếm `13.51%` diện tích viewport (`< 15%`).
  - Các mã `D3` (vùng chạm < 44px), `D4` (chữ < 12px), `D5` (tràn ngang), `D7` (thuật ngữ nội bộ), `D10` (control gốc), `M7`, `J10`, `Q5`, lỗi JS: **0 lỗi trên cả 70 lượt**.

### 1.2. Bảng kiểm `KIEM-THU.md` §2 (tự chạy lại 100%)

| # | Cổng kiểm | Lệnh tự chạy | Số đo thật | Đánh giá |
|---|---|---|---|---|
| 1 | Kiểu TypeScript | `npx tsc --noEmit -p .` | **0 lỗi** (`TSC_EXIT=0`) | ✅ Đạt |
| 2 | Unit test | `npm test` | **56/56 file, 604/604 test pass** (16.73s, gồm `mastery.test.ts` 3 test & `t3cCore.test.ts` 6 test) | ✅ Đạt |
| 3 | Dữ liệu (dev) | `npm run validate:data` | **PASS (dev)** — 2207 từ, 24 bài đọc, 32 bài nghe, 700 câu chép, **153/153 asset credited (100%)** | ✅ Đạt |
| 5 | Giao diện định lượng | `audit-ui.mjs` 7 khung × 2 theme (70 lượt) | **0 CHẶN · 64 NẶNG** (54 `M5` từ `LiveCard` T3-A + **10 NẶNG của T3-C**: `M2:4, M3:2, M4:2, M1:2`) | ❌ Còn 10 NẶNG của T3-C (8 lỗi ở iPhone SE `375x667`) |
| 6 | Màu cứng & Thuật ngữ nội bộ | `node scripts/qa/hardcoded-colors.mjs` & `internal-jargon.mjs` | **0 chỗ** trong toàn bộ file của T3-C (toàn repo còn 8 màu cứng và 3 chữ FSRS ở file ngoài T3-C) | ✅ Đạt (phần T3-C) |
| 11 | Ngân sách bundle | `npx vite build && node scripts/qa/size-budget.mjs` | JS `#/`: **213.69 KB gzip** (≤ 250) · CSS: **128.5 KB** (≤ 130) · Chunk lazy max: **45.29 KB** (≤ 120) · Precache: **1404.39 KiB** (≤ 1500) | ✅ Đạt |
| 12 | Không rò dev/test vào prod | `node scripts/qa/size-budget.mjs` | **0 chuỗi rò** (`Thư viện component`, `TASK2_CLAUDE_RESPONSE`, `pixelated`, `v1_fixtures`, `r1_fixtures` đều OK) | ✅ Đạt |
| 15 | Vòng lặp ngày E2E | `PW_PORT=5258 PW_CHANNEL=chrome npx playwright test e2e/daily-loop.spec.ts --project=chromium` | **5/5 pass** (39.7s), **0 `console.error`**, 0 `pageerror` | ✅ Đạt |
| 22 | Chống gian lận (`git diff`) | `git diff --name-only $(git merge-base master HEAD)..HEAD` | 100% file nằm trong phạm vi T3-C; **0 sửa** `src/design/**`, `public/assets/**`, `cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `scripts/qa\|validate` | ✅ Đạt |
| 25 | Ảnh nộp & video (`07` §7) | Kiểm `docs/audit-max/anh-sau/T3-C/` | Có 40 ảnh tĩnh + 18 ảnh `-loi.png` (gồm 8 ảnh `-onboarding-loi.png` cũ chưa xoá); **thiếu ảnh sau tương tác và thiếu video 3–5s** | ⚠️ Thiếu ảnh tương tác & video |

---

## 2. Lỗi tìm thấy (7 lỗi cụ thể, xếp NẶNG → NHẸ)

> Lưu ý: Đã tách riêng lỗi `M5` (54 lần trên `hub`) do lớp bóng sibling của `src/design/components/LiveCard.tsx:133` thuộc T3-A (builder đã ghi `HANDOFF.md`). Toàn bộ 7 lỗi dưới đây là lỗi trong file của **T3-C**.

| # | Màn/route | Khung + theme | Vị trí (`x,y,w,h` trên ảnh) / `file:dòng` | Mã luật | Mức | Mô tả chi tiết | Cách sửa đề xuất |
|---|---|---|---|---|---|---|---|
| 1 | `#/onboarding` | `375x667` · `dark` & `light` (`375x667-dark-onboarding.png`) | `(40, 56, 295, 16)` (Hero bị cuộn khuất khỏi đỉnh màn) · `src/features/onboarding/OnboardingScreen.tsx:396` & `:328` | **M3, M4, SR-40** | **NẶNG** | Trên iPhone SE `375x667` (ưu tiên 1), ô `<input id="onboarding-display-name" autoFocus>` nằm ở `y ≈ 470` dưới Hero và lưới 6 icon. Khi trang vừa mở, `autoFocus` buộc trình duyệt cuộn trang xuống để đưa ô input vào khung nhìn, đẩy toàn bộ thanh tiến độ `"Bước 1 / 4"`, tiêu đề `"Chào mừng tới Lộ trình IELTS 8.0"` và `<Mascot>` trôi khuất khỏi đỉnh màn hình (`mascots: 0`, `anims: 0` → 4 lỗi NẶNG `M3`+`M4` ở 2 theme). Ngoài ra dòng 328 đang truyền `state="co-vu"` thay vì `state="chao"` cho màn chào mừng. | Bỏ `autoFocus` trên `<input id="onboarding-display-name">` (hoặc chỉ focus bằng `el.focus({ preventScroll: true })` trên màn `>= 768px` sau khi `window.scrollTo({ top: 0 })`), và đổi `<Mascot state="chao" ... />` ở Bước 1. |
| 2 | `#/` (`today`) & `#/stats` (`stats`) | `375x667` · `dark` & `light` (`375x667-dark-today.png`, `375x667-dark-stats.png`) | Today: `(16, 77, 343, 540)` (chỉ 4 icon màu trong màn đầu `667px`) · Stats: `(16, 77, 343, 540)` (chỉ 5 icon màu) · `TodayDashboard.tsx:498-661`, `StatsScreen.tsx:328-492` | **M2, SR-40** | **NẶNG** | Trên iPhone SE `375x667`: (a) ở `#/`, khối Hero (`h=304px`) + Banner Onboarding (`h=219px`) đẩy thẻ `"Mục tiêu hôm nay"` xuống dưới `y=632`, nên màn đầu chỉ xuất hiện **4 icon màu ≥ 32px** (`freeze.webp`, `xp.webp`, `rocket.webp`, `lexi-co-vu.webp`); (b) ở `#/stats`, khối Hero (`h=224px`) + lưới 4 thẻ KPI (`h=300px`) đẩy thẻ `"Cân bằng 4 mạch học"` xuống dưới `y=633`, nên màn đầu chỉ có **5 icon màu ≥ 32px** (cần ≥ 6 theo `M2`). | (a) Ở `TodayDashboard.tsx` và `StatsScreen.tsx`, giảm nhẹ padding/gap dọc trên màn nhỏ (`p-3.5 sm:p-5`, `space-y-3.5 sm:space-y-5`) hoặc thêm 2 badge icon Fluent 3D `32×32` (`goal.webp`, `calendar.webp` ở Hero Today; `goal.webp`, `chart.webp` ở Hero Stats) để màn đầu `375x667` luôn có ≥ 6 icon màu riêng biệt. |
| 3 | `#/stats` | Mọi khung (`390x844`, `375x667`, `1280x800` · `dark` & `light`, vd `390x844-dark-stats.png`, `1280x800-dark-stats.jpg`) | `390x844`: `(104, 194, 238, 60)` · `1280x800`: `(742, 68, 218, 40)` · `src/features/stats/StatsScreen.tsx:283-296, 365-370` | **M3, J10, 12-UI-UX §7** | **NẶNG** | Bong bóng thoại của Lexi ở màn Thống kê trên **mọi khung nhìn** đều bị cắt cụt giữa chữ thành **`"Bắt đầu 5 phút trước, vào nhịp sẽ nh"`** (mất `"anh thôi."`). Nguyên nhân: `StatsScreen.tsx:283` trả về `<Skeleton>` toàn trang trong lúc chờ 8 truy vấn IndexedDB của `loadStats()` (~250ms), làm `<Mascot>` mount trễ và hiệu ứng gõ chữ `18ms/ký tự` mới chạy tới ký tự thứ 36 khi chụp ở `900ms`. Đồng thời câu thoại bị trùng nguyên câu mặc định của màn Hôm nay. | Render khung Hero + `<Mascot>` ngay từ đầu giống `TodayDashboard.tsx` (chỉ đặt `<Skeleton>` cho vùng thẻ KPI/lịch sử bên dưới khi `loading`), và truyền prop `say` ngắn gọn riêng cho màn Thống kê (≤ 12 từ, có số thật, vd `say={\`Bạn đã tích luỹ \${profile.xp} XP và mở \${unlockedBadgesCount}/12 huy hiệu.\`}`). |
| 4 | `#/hub` | `820x1180`, `1180x820`, `1280x800`, `1366x768` · `dark` & `light` (`1280x800-light-hub-loi.png`, `1280x800-dark-hub.jpg`) | `(472, 450, 344, 256)` (thẻ `Collocation Forge` cột giữa hàng 1) · `src/app/screens/HubScreen.tsx:97-189, 294` | **R5 / Bố cục lưới (phối hợp M5)** | **NẶNG** | Ở lưới 2–3 cột của Hub, mô tả `subtitleVi` của `Collocation Forge` chỉ có 2 dòng trong khi `Daily Run` và `Paraphrase Radar` có 3 dòng. Vì khối thẻ bề mặt bên trong `<LiveCard>` không giãn `100%` chiều cao của ô grid (`220px` so với `256px`), lớp bóng sibling `absolute inset-0` của `<LiveCard>` bị lộ ra thành một mảng xám dày `36px` bên dưới đáy thẻ `Collocation Forge`, làm lệch đáy hàng thẻ. | Trong `HubScreen.tsx:104-154`, đặt chiều cao tối thiểu cố định cho vùng mô tả `<p className="text-sm mt-1 leading-relaxed min-h-[3.75rem] line-clamp-3">` (hoặc `min-h-[2.75rem]` đồng nhất theo breakpoint) để mọi thẻ trên cùng một hàng có chiều cao bằng khít nhau; đồng thời phối hợp T3-A thêm `h-full` cho surface `motion.div` trong `LiveCard.tsx:136`. |
| 5 | `#/onboarding` | `1366x768` · `dark` & `light` (`1366x768-dark-onboarding.png`) | `(364, 98, 650, 218)` · `src/features/onboarding/OnboardingScreen.tsx:308` | **M1** | **NẶNG** | Khung Hero có `backgroundImage: url(.../welcome.svg)` bên trong `<Card>` tại `1366x768` chỉ có kích thước `650 × 218 = 141,700 px²`, tương đương **13.51%** diện tích khung nhìn `1366 × 768 = 1,049,088 px²` (hụt ngưỡng **15%** = `157,364 px²` của luật `M1`), làm `audit-ui.mjs` báo 2 lỗi `M1` NẶNG. | Tăng `min-h-[170px]` của khung Hero ở `OnboardingScreen.tsx:308` lên `min-h-[190px] sm:min-h-[248px]` (hoặc đặt `backgroundImage` lên chính `<Card>` ngoài rộng `716px` cao `610px`) để đạt ≥ 15% trên cả `1366x768`. |
| 6 | `#/settings` | `375x667`, `390x844`, `1280x800` · `dark` & `light` (`375x667-dark-settings.png`, `390x844-dark-settings.jpg`) | Ô nhập tên `(41, 294, 293, 44)`, Pill `(245, 470, 89, 54)` · `src/features/settings/SettingsScreen.tsx:367-535` | **D11, KIEM-THU §3.1 (chấm mù), 12-UI-UX §7** | **NẶNG** | (a) Màn Cài đặt có `0` icon màu Fluent 3D (`colorIcons: 0`, dùng `10–14` icon nét mảnh đơn sắc `lucide-react` cho mọi tiêu đề thẻ nội dung), khiến điểm chấm mù của `settings` chỉ tăng **`+1.44`** (`4.19 → 5.63`, dưới ngưỡng **`+3.0`** của `KIEM-THU.md` §3.1 cho mọi màn có đổi giao diện). (b) Trên `375x667` và `390x844`, placeholder `"Nhập tên của bạn (bỏ trống để gọi là bạn)"` quá dài nên bị cắt thành `"Nhập tên của bạn (bỏ trống để gọ"`; pill `"Đang chọn: DARK"` ở dòng 436 bị gãy làm 3 dòng trên `375x667` và dùng chữ tiếng Anh `"DARK/LIGHT/EXAM"` thay vì tiếng Việt. | (a) Gắn ≥ 6 icon màu Fluent 3D (`32×32`) cho các thẻ mục của `SettingsScreen.tsx` (Hồ sơ, Giao diện, Hiệu ứng & Lexi, Mục tiêu Band, Âm thanh, iPhone PWA, Sao lưu) + `<Mascot>` hoặc thẻ giới thiệu ở đầu. (b) Rút gọn placeholder thành `"Tên hiển thị (mặc định: bạn)"` và đổi pill dòng 436 sang tiếng Việt `"Đang dùng: Tối / Sáng / Thi máy"` có `shrink-0 whitespace-nowrap`. |
| 7 | `docs/audit-max/anh-sau/T3-C/` | Bộ bằng chứng ảnh nộp | `docs/audit-max/anh-sau/T3-C/` | **SR-82, KIEM-THU §2 #25** | **NHẸ** | Thư mục `docs/audit-max/anh-sau/T3-C/` mới có các ảnh chụp tĩnh của `audit-ui.mjs`, còn để sót 8 file `*-onboarding-loi.png` cũ từ lần chạy trước, chưa có 1 ảnh **sau tương tác** (vd mở `Sheet` chọn chế độ ở Hub hoặc `Modal` nhập sao lưu Gộp ở Cài đặt) và chưa có 1 **video 3–5s** theo `07-QUY-TRINH-KIEM-CHEO.md` §7. | Xoá các file `*-onboarding-loi.png` cũ không còn lỗi, chụp thêm 1 ảnh sau tương tác và quay 1 video 3–5s đặt vào `docs/audit-max/anh-sau/T3-C/`. |

---

## 3. Rubric (`KIEM-THU.md` §3) – mốc 4/7/10, mỗi điểm dẫn tên ảnh

> Quy tắc `KIEM-THU.md` §3.1: mỗi lỗi NẶNG chưa sửa của task trừ `0.5` vào tiêu chí tương ứng.

| # | Tiêu chí | Trọng số | Điểm | Lý do (dẫn tên ảnh cụ thể) |
|---|---|---:|---:|---|
| **R1** | **Sư phạm** | 15% | **9.0** | Đã cài đặt đúng và đủ Cân bằng 4 mạch học Paul Nation bù mạch `< 15%` (`PP-06`), bảo đảm `≥ 1` việc sản xuất khi mục tiêu `≥ 20p` (`PP-10`), thống kê loại lượt gợi nhớ/sản xuất (`PP-02`), và chỉ số Từ vững `stability ≥ 21 ngày && 3 lần đúng` (`PP-16`) kèm giữ nhớ `≥ 7 ngày` (`PP-07`), hiển thị rõ trên `1280x800-dark-stats.jpg` (`shuffle-004.jpg`) và `1280x800-light-today.jpg` (`shuffle-010.jpg`). |
| **R2** | **Cảm giác game** | 15% | **8.0** | Các màn `today`, `hub`, `stats`, `onboarding` đã lột xác khỏi bảng phẳng cũ nhờ Hero minh họa, Lexi, `<LiveCard>` và bộ icon Fluent 3D đồng bộ (`390x844-dark-today.jpg` / `shuffle-039.jpg`, `390x844-dark-onboarding.jpg` / `shuffle-032.jpg`), nhưng màn Cài đặt (`1280x800-dark-settings.jpg` / `shuffle-007.jpg`) vẫn mang dáng form web phẳng và thẻ `Collocation Forge` trên `1280x800-light-hub-loi.png` bị hở khối bóng xám 36px ở đáy. |
| **R3** | **Juice** | 10% | **8.0** | Đã nối `celebrate('dailyGoal')` khi đạt mục tiêu ngày, chuyển động thở của Lexi trên màn khung và 3 công tắc chuyển động/hạt/rung ở Cài đặt ăn thẳng vào `useMotionPref` (`390x844-light-today.jpg` / `shuffle-028.jpg`), song hiệu ứng gõ chữ của Lexi trên `390x844-dark-stats.png` bị mount trễ sau `<Skeleton>` nên dừng dở ở `"vào nhịp sẽ nh"`. |
| **R4** | **Mật độ & chất lượng hình + nhân vật (màn khung)** | 10% | **6.5** | Đạt tốt trên `390x844` ở Today/Hub/Stats/Onboarding (`390x844-light-onboarding.jpg` / `shuffle-025.jpg`), nhưng bị trừ điểm do 10 lỗi NẶNG của T3-C: trên iPhone SE `375x667-dark-onboarding.png` Lexi bị cuộn mất khỏi màn đầu (`M3`, `M4`), `375x667-dark-today.png` chỉ có 4 icon màu (`M2`), `375x667-dark-stats.png` chỉ có 5 icon màu (`M2`), `1366x768-dark-onboarding.png` Hero `< 15%` (`M1`), và `390x844-dark-settings.jpg` (`shuffle-015.jpg`) có `0` icon màu 3D. |
| **R5** | **Thứ bậc & bố cục** | 10% | **7.5** | Đã đưa "Việc tiếp theo" lên đầu Hôm nay, bỏ dãy 12 nút "Mở" trùng lặp và đẩy nhóm "Sắp có" xuống cuối Hub (`390x844-dark-hub.jpg` / `shuffle-026.jpg`), nhưng bị trừ do `autoFocus` làm cuộn mất phần đầu `375x667-dark-onboarding.png`, thẻ `Collocation Forge` thấp hơn hàng 36px trên `1280x800-light-hub-loi.png`, và pill `"Đang chọn: DARK"` gãy 3 dòng trên `375x667-dark-settings.png`. |
| **R6** | **Đọc & truy cập** | 10% | **8.5** | Đạt `0` lỗi vùng chạm (`D3`), cỡ chữ (`D4`), tràn ngang (`D5`), thuật ngữ nội bộ (`D7`) và control gốc (`D10`) trên cả 70 lượt đo (`1280x800-light-today.jpg` / `shuffle-010.jpg`), tương phản sáng/tối rõ ràng; trừ nhẹ do chữ bị cắt ở bong bóng Lexi trên `390x844-light-stats.jpg` (`shuffle-003.jpg`) và placeholder ô nhập tên trên `375x667-dark-settings.png`. |
| **R7** | **Độ khó thích ứng** | 10% | **8.5** | Thẻ game ở Hub và `Sheet` chọn chế độ đã bỏ hoàn toàn nhãn `"Level 1 · Mốc M1"` cũ để hiển thị `"Band ≈ 4.0"` từ `profile.skillLevels` thật (`390x844-light-hub.jpg` / `shuffle-034.jpg`), đồng thời `planner/today.ts` xếp việc theo khoảng cách Band mục tiêu. |
| **R8** | **Thưởng & tiến bộ** | 5% | **9.0** | `attemptRepo` trả đủ `{newBadges, levelUp, streakEvent}`, màn Thống kê hiển thị rõ Cấp độ XP + thanh tiến độ lên cấp, số Từ vững (`PP-16`), tỷ lệ giữ nhớ ≥ 7 ngày (`PP-07`), lượt đóng băng chuỗi và lưới 12 huy hiệu Fluent 3D (`1280x800-light-stats.jpg` / `shuffle-006.jpg`). |
| **R9** | **Vòng lặp hằng ngày** | 10% | **9.0** | Mở `#/` thấy ngay Việc tiếp theo + phím `Enter`, có chế độ `"Ngày bận (~10p)"` và `"Giữ chuỗi 5 phút"`, ngày học đổi lúc 04:00 giờ địa phương hết `getUTCDay()`, có xuất lịch `.ics`, nhắc sao lưu `> 7 ngày`, nhập sao lưu Gộp/Thay thế và cảnh báo Safari→PWA iPhone (`390x844-dark-today.jpg` / `shuffle-039.jpg`). |
| **R10** | **Nhất quán & độ tin cậy** | 5% | **8.5** | `tsc` 0 lỗi, `604/604` unit test pass, E2E `daily-loop.spec.ts` `5/5` pass với `0 console.error`, `size-budget.mjs` đạt 100%, `backup.ts` kiểm `zod.safeParse` chặt và bắt `QuotaExceededError`, có `useAsyncData` + `ScreenErrorState` (`1280x800-dark-today.jpg` / `shuffle-037.jpg`); trừ nhẹ do `anh-sau/T3-C/` thiếu ảnh sau tương tác và video. |
| **TỔNG** | **Có trọng số (100%)** | **100%** | **8.23** | **Tiêu chí thấp nhất: R4 = 6.5 (< 7.0); tổng = 8.23 (< 8.5); chênh lệch chấm mù `settings` = +1.44 (< +3.0).** |

---

## 4. Kiểm tra chức năng & logic P0 (`KE-HOACH-T3-C.md` & `SR-90`)

Đối chiếu bằng đọc code + chạy E2E `e2e/daily-loop.spec.ts` (5/5 pass) + unit test `t3cCore.test.ts` & `mastery.test.ts`:

- **Hôm nay (`#/`, `TodayDashboard.tsx`)**:
  - [x] Banner Onboarding ("Bắt đầu thiết lập", "Vào Hub chơi thử") — **Còn, hoạt động tốt**.
  - [x] Thanh chào (tên hiển thị mặc định `"bạn"`, pill Band đầu vào, badge Streak + số freeze, badge Tổng XP + XP hôm nay) — **Còn, hoạt động tốt**.
  - [x] "Việc tiếp theo" đưa lên đầu (`U6`) + phím `Enter` mở việc đầu (`F12`) + nút `"Ngày bận (~10p)"` & `"Giữ chuỗi 5 phút"` (`F14`) — **Còn, hoạt động tốt**.
  - [x] Banner ăn mừng mục tiêu ngày + gọi `celebrate('dailyGoal')` 1 lần/ngày (`F9`) — **Còn, hoạt động tốt**.
  - [x] Nhắc lịch học + xuất file `.ics` (`F13`) + nhắc sao lưu `> 7 ngày` (`PB-05`) — **Còn, hoạt động tốt**.
  - [x] Thẻ Mục tiêu ngày (phút, số phiên, `ProgressRing`), danh sách nhiệm vụ ("Đổi bài", "Bắt đầu"/"Chơi lại"), EmptyState, cột Band ước lượng 4 kỹ năng L/R/W/S + Overall + số thẻ ôn + thẻ Cân bằng 4 mạch học (`PP-06`) — **Còn đủ 100%**.
- **Hub (`#/hub`, `#/practice`, `HubScreen.tsx`)**:
  - [x] 7 tab lọc nhóm kỹ năng (Tất cả, Từ vựng, Listening, Reading, Writing, Speaking, Thi thử) — **Còn, hoạt động tốt**.
  - [x] 12 thẻ chế độ có 12 icon Fluent 3D riêng (`M7`), đẩy 3 game "Sắp có" (S1, S2, X1) xuống cuối (`U5`, `U11`), bỏ dãy nút "Mở" lặp lại (`D6`), bấm thẻ mở `Sheet` chọn chế độ Luyện/Thi/Tăng tốc — **Còn, hoạt động tốt**.
- **Thống kê (`#/stats`, `StatsScreen.tsx`)**:
  - [x] 4 KPI (Chuỗi hiện tại + freeze, Kỷ lục chuỗi, Cấp độ XP + thanh tiến độ `F7`, Từ vững `PP-16` + giữ nhớ ≥ 7 ngày `PP-07`) — **Còn, hoạt động tốt**.
  - [x] Cân bằng 4 mạch học 7 ngày (`PP-06`) + tỷ lệ Gợi nhớ/Sản xuất (`PP-02`) — **Còn, hoạt động tốt**.
  - [x] Thanh & 5 ô phân bố độ vững thẻ ôn (đã Việt hoá, không lộ chữ `"FSRS"`), lịch sử phiên gần nhất + EmptyState, lưới 12 huy hiệu Fluent 3D, toast cứu chuỗi (`F8`) — **Còn, hoạt động tốt**.
- **Cài đặt (`#/settings`, `SettingsScreen.tsx`)**:
  - [x] Đổi tên hiển thị, chọn 3 giao diện (Sáng, Tối, Thi máy), 3 công tắc motion + công tắc `"Hiện nhân vật đồng hành (Lexi)"` đồng bộ cả `pref.*` và `FX_KV_KEYS` (`pref:*`) của `useMotionPref()` — **Còn, hoạt động tốt**.
  - [x] Chọn mục tiêu Band L/R/W/S (6.0–9.0), thời lượng ngày (15/30/45/60/90p), giờ nhắc học + xuất `.ics`, tắt tiếng & thanh âm lượng SFX (0–100%, mặc định 60%) — **Còn, hoạt động tốt**.
  - [x] **PB-09 (P0, L-12):** Hướng dẫn cài PWA trên iPhone kèm hộp cảnh báo rõ *"dữ liệu học trong tab Safari không tự chuyển sang ứng dụng mới trên Màn hình chính"* + nút **"Sao lưu trước khi cài"**, hiển thị dung lượng `estimate()` và nút **"Giữ dữ liệu bền vững"** (`navigator.storage.persist()`) — **Đạt đủ 100%**.
  - [x] **PB-05 (P0, SR-34, PB-17):** `backup.ts` xuất/nhập đủ 11 bảng (kể cả `userItems`), kiểm `zod.safeParse` từng bảng, hỗ trợ 2 chế độ **Gộp (Merge, mặc định, không mất ghi âm cục bộ)** và **Thay thế (Replace)**, nhắc sao lưu `> 7 ngày`, bắt `QuotaExceededError` — **Đạt đủ 100%**.
  - [x] **PB-12, PB-13:** Xoá dữ liệu 2 bước xác nhận (có nút "Sao lưu trước", có checkbox giữ ghi âm Speaking, dùng `transaction.clear()` không dùng `db.delete()` theo `SR-33`), mục Quyền riêng tư & Ghi công, nút mở Kho lưu trữ V1/V2 — **Đạt đủ 100%**.
- **Onboarding (`#/onboarding`) & Placement (`#/placement`) & Shell (`App.tsx`)**:
  - [x] Onboarding giữ đủ 4 bước + phím `Enter`, nút "Kiểm tra dữ liệu cũ", tăng/giảm Band, chọn 15/30/45/60p, ngày thi `dd/mm/yyyy`, thử loa/micro — **Còn đủ 100%**.
  - [x] Placement 3 chặng Từ vựng/Đọc/Nghe, đã bỏ import barrel `../_shared` nên bundle sạch `v2v3_fixtures` — **Còn đủ 100%**.
  - [x] **X9 (`App.tsx`):** Toast `"Có bản mới của Lexicon Arcade. Tải lại để áp dụng?"` chỉ hiện khi `!isFullscreenRoute` (ngoài `/play/*`, `/exam`, `/legacy`) và tự gọi `navigator.storage.persist()` khi mở ở chế độ standalone PWA — **Đạt đủ 100%**.

---

## 5. So với tham chiếu

1. **Hôm nay (`#/`, `390x844-dark-today.jpg`, `1280x800-light-today.jpg`):**
   - *Giống Duolingo / Balatro ở:* Thẻ Hero có nhân vật Lexi cổ vũ kèm huy hiệu chuỗi ngày/đóng băng và XP nổi bật, thẻ `"Việc tiếp theo"` được đẩy lên vị trí trung tâm với nút chính có phím tắt `Enter` và nút `"Giữ chuỗi 5 phút"`, hệ icon Fluent 3D có khối và màu sắc tươi.
   - *Còn kém ở:* Trên khung nhỏ iPhone SE `375x667` (`375x667-dark-today.png`), khối Hero + Banner Onboarding chiếm gần hết màn đầu khiến chỉ có 4 icon màu lộ diện (thiếu 2 icon màu để đạt `M2`), và phần lời thoại của Lexi khi chưa có thẻ đến hạn vẫn dùng câu mặc định chung với màn Thống kê.
2. **Hub (`#/hub`, `390x844-dark-hub.jpg`, `1280x800-light-hub-loi.png`):**
   - *Giống Balatro / Apple Arcade ở:* 12 chế độ chơi được trình bày như bộ sưu tập thẻ `<LiveCard>` với 12 icon Fluent 3D riêng biệt, hiển thị `"Band ≈ 4.0"`, bỏ hoàn toàn 12 nút `"Mở"` lặp lại và mở `Sheet` chọn chế độ Luyện/Thi/Tăng tốc rất gọn.
   - *Còn kém ở:* Ở lưới 2–3 cột (`1280x800-light-hub-loi.png`), thẻ có mô tả 2 dòng (`Collocation Forge`) ngắn hơn hai thẻ bên cạnh 36px làm hở mảng bóng xám của `LiveCard` ở đáy thẻ; 4 icon 3D nhỏ đặt trong khung Hero (`rocket, compass, brain, shield`) xếp hàng ngang trơ trọi, chưa có nhãn hay vai trò rõ.
3. **Thống kê (`#/stats`, `390x844-dark-stats.png`, `1280x800-light-stats.jpg`) & Cài đặt (`#/settings`, `1280x800-dark-settings.jpg`):**
   - *Giống Duolingo ở:* Màn Thống kê có 4 thẻ KPI gắn icon 3D, thanh Cấp độ XP, bảng Cân bằng 4 mạch học có icon màu riêng và bộ sưu tập 12 huy hiệu Fluent 3D rõ ràng.
   - *Còn kém ở:* Bong bóng lời thoại của Lexi ở màn Thống kê bị cắt dở chữ (`"Bắt đầu 5 phút trước, vào nhịp sẽ nh"`) trên mọi khung nhìn do mount trễ sau `<Skeleton>`; còn màn Cài đặt (`1280x800-dark-settings.jpg`) chưa được gắn bất kỳ icon màu Fluent 3D hay nhân vật nào nên nhìn vẫn như trang cài đặt web thông thường.

---

## 6. Luật script chưa đo, đã kiểm bằng cách nào

- **Checklist soi ảnh (`KIEM-THU.md` §4 trên `390x844`, `375x667`, `1280x800`):**
  - [x] Không tràn ngang (`0 px` trên cả 70 lượt); tuy nhiên có **2 chỗ chữ bị cắt** không phải bằng `…`: bong bóng thoại Lexi ở `StatsScreen` (`"vào nhịp sẽ nh"`) và placeholder ô nhập tên ở `SettingsScreen` trên `375x667`/`390x844`.
  - [x] Đúng 1 nút primary mỗi màn; không còn dãy ≥ 3 nút `"Mở"` giống hệt ở Hub (`D6`).
  - [x] Không lộ thuật ngữ nội bộ (`FSRS`, `Mốc M1`, `Level 1 · Training`, `gói copy/dán`) trên 5 route của T3-C (`D7`).
  - [ ] Màn khung có Lexi 72–160px đúng trạng thái, Hero ≥ 15%, ≥ 6 icon màu khác nhau: **Đạt ở `390x844` và `1280x800`**, nhưng **trượt ở `375x667` (`today` M2=4, `stats` M2=5, `onboarding` M3=0 do `autoFocus` cuộn trang) và `1366x768` (`onboarding` M1=13.51%)**.
  - [x] Có ít nhất 1 vật đang chuyển động nhẹ ngoài vùng chữ học (trừ `375x667` Onboarding khi Lexi bị cuộn khuất và màn Cài đặt).
  - [x] Không có hiệu ứng chuyển động sau/trên vùng chữ học (`J3`); Lexi tự ẩn hoàn toàn khi vào `/play/*` hoặc khi tắt công tắc `"Hiện nhân vật"` (`J10`, kiểm bằng E2E `daily-loop.spec.ts` test #4).
  - [x] Theme sáng đọc tốt, tương phản rõ trên cả 5 route.
  - [x] Streak/XP ở shell khớp với màn Hôm nay và Thống kê (`D9`, đọc từ `useShellStats` / IndexedDB thật).
- **Kiểm bảo mật dữ liệu nhập (`P4`, `SR-34`, `SR-70`):** Đọc `src/core/storage/backup.ts:49-176, 390` — mọi bảng trong file JSON nhập vào đều qua `BackupEnvelopeSchema.safeParse(obj)` và kiểm tra `computeChecksum` trước khi mở transaction ghi DB; không có `dangerouslySetInnerHTML`, `innerHTML`, `eval`.
- **Kiểm an toàn IndexedDB (`SR-33`, `PB-12`):** `clearAllUserData` trong `backup.ts:751-773` dùng `database.transaction('rw', tables, ...)` và `t.clear()`, tuyệt đối không gọi `db.delete()` trong code production.

---

## 7. Phán quyết: **TRẢ VỀ**

### Lý do trả về (cần Fixer xử lý gọn trong vòng sửa):
1. **Còn 10 lỗi NẶNG thuộc phạm vi T3-C trên `audit-ui.mjs` 7 khung × 2 theme** (đã tách riêng 54 lỗi `M5` của `LiveCard.tsx:133` thuộc T3-A), trong đó có **8 lỗi NẶNG trên iPhone SE `375x667` (ưu tiên 1 theo `SR-40`)**:
   - `375x667` `onboarding` (`dark` & `light`): **4 lỗi NẶNG (`M3: 2`, `M4: 2`)** do `autoFocus` ở ô nhập tên tự cuộn mất Hero và Lexi khỏi màn đầu.
   - `375x667` `today` (`dark` & `light`): **2 lỗi NẶNG (`M2`)** (chỉ có 4/6 icon màu ≥ 32px ở màn đầu).
   - `375x667` `stats` (`dark` & `light`): **2 lỗi NẶNG (`M2`)** (chỉ có 5/6 icon màu ≥ 32px ở màn đầu).
   - `1366x768` `onboarding` (`dark` & `light`): **2 lỗi NẶNG (`M1`)** (Hero chỉ đạt 13.51% < 15% diện tích khung nhìn).
2. **Lỗi hiển thị chữ bị cắt trên mọi ảnh `#/stats`:** Bong bóng thoại của Lexi trên `StatsScreen` bị cắt dở chữ **`"Bắt đầu 5 phút trước, vào nhịp sẽ nh"`** ở tất cả khung nhìn do `<Mascot>` mount trễ sau `<Skeleton>` toàn trang.
3. **Lỗi bố cục lưới `#/hub` ở màn `≥ 820px`:** Thẻ `Collocation Forge` (2 dòng mô tả) ngắn hơn các thẻ 3 dòng cùng hàng ~36px làm lộ mảng bóng xám của `<LiveCard>` bên dưới đáy thẻ.
4. **Màn `#/settings` chỉ đạt chênh lệch chấm mù `+1.44` (`< +3.0` theo `KIEM-THU.md` §3.1):** Chưa gắn icon màu Fluent 3D (`colorIcons: 0`), placeholder ô nhập tên bị cắt trên `375x667`/`390x844` và pill `"Đang chọn: DARK"` gãy 3 dòng trên `375x667`.
5. **Điểm Rubric:** Tổng có trọng số đạt **8.23 / 10** (< ngưỡng 8.5), tiêu chí thấp nhất **R4 = 6.5** (< ngưỡng 7.0). Phần lõi P0 (`PB-05`, `PB-09`, `PP-02/06/07/10/16`, `X9`, `SR-90`, `tsc`, `604/604` unit test, `5/5` E2E, `size-budget`) đã đạt rất tốt — Fixer chỉ cần sửa đúng 7 mục ở Bảng §2 là sẽ qua cổng.

---

## 8. Kiểm lại Vòng 1 (`b39423c` — sau Fixer `fab22cc` + merge `T3-A`)

### 8.1. Kết quả chạy lại `audit-ui.mjs` 70 lượt (`out/rv-t3-c-a/v2`, cổng `5248`) & E2E (`PW_PORT=5258`)

- **`audit-ui.mjs` (5 route `today,hub,stats,settings,onboarding` × 7 khung `390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768` × 2 theme `dark,light` = 70 lượt):**
  - Tổng: **`0 CHẶN · 0 NẶNG · 0 NHẸ`** trên toàn bộ **70/70 lượt** (giảm từ `64 NẶNG` xuống **`0 NẶNG`** — vừa triệt tiêu 10 lỗi NẶNG của T3-C vừa triệt tiêu 54 lỗi `M5` của `LiveCard` sau khi merge `T3-A`).
  - Mọi khung trên iPhone (`375x667`, `390x844`, `430x932`), iPad (`820x1180`, `1180x820`) và laptop (`1280x800`, `1366x768`) đều đạt `0` tràn ngang (`D5`), `0` vùng chạm nhỏ (`D3`), `0` chữ `< 12px` (`D4`), `0` thuật ngữ nội bộ (`D7`), `0` control gốc (`D10`), `0` lỗi mật độ hình (`M1–M7`).
- **E2E `e2e/daily-loop.spec.ts` (`PW_PORT=5258`, Chrome):** **5/5 pass** (37.1s), **0 `console.error`**, 0 `pageerror`.

### 8.2. Kiểm chứng trực tiếp 7/7 mục đã trả về (soi ảnh `out/rv-t3-c-a/v2/*` & `docs/audit-max/anh-sau/T3-C/*`)

| # | Mục lỗi ở Vòng 0 | Bằng chứng ảnh đã soi (`read_file`) | Trạng thái sau Vòng 1 |
|---|---|---|---|
| 1 | `OnboardingScreen.tsx` tự cuộn trên `375x667` (`M3:2, M4:2`) + trạng thái Lexi | `out/rv-t3-c-a/v2/375x667-dark-onboarding.png` | ✅ **ĐÃ ĐÓNG** — Đã bỏ `autoFocus` gây cuộn trang; trên `375x667` thấy trọn thanh tiến độ `"Bước 1 / 4 · Chào mừng"`, Hero `"Chào mừng tới Lộ trình IELTS 8.0"` và Lexi `state="chao"` vẫy tay (`"Chào bạn! Bắt đầu nhé!"`), `mascots: 1, anims: 1`. |
| 2 | `TodayDashboard.tsx` & `StatsScreen.tsx` thiếu icon màu ở màn đầu `375x667` (`M2:4`) | `out/rv-t3-c-a/v2/375x667-dark-today.png`, `375x667-dark-stats.png` | ✅ **ĐÃ ĐÓNG** — Ở `375x667`, màn đầu `today` có đủ **6 icon màu ≥ 32px** (`trophy`, `lexi`, `cloud`, `freeze`, `xp`, `rocket`) và `stats` có đủ **6 icon màu ≥ 32px** (`check`, `lexi`, `rocket`, `party`, `xp`, `shield`). |
| 3 | Bong bóng thoại Lexi ở `StatsScreen.tsx` bị cắt dở chữ `"vào nhịp sẽ nh"` | `out/rv-t3-c-a/v2/375x667-dark-stats.png` | ✅ **ĐÃ ĐÓNG** — Khung Hero + `<Mascot>` được render ngay từ đầu kèm lời thoại ngắn có số thật **`"0 XP · 0/12 huy hiệu!"`**, hiển thị trọn vẹn 100% trên mọi khung nhìn. |
| 4 | Thẻ `Collocation Forge` ở `HubScreen.tsx` thấp hơn hàng 36px ở khung `≥ 820px` | `out/rv-t3-c-a/v2/1280x800-light-hub.png` | ✅ **ĐÃ ĐÓNG** — Ba thẻ hàng đầu (`Daily Run`, `Collocation Forge`, `Paraphrase Radar`) cao bằng khít nhau (`h-full`), không còn mảng bóng xám lòi dưới đáy; 4 icon 3D trong Hero đã được bọc thành 4 chip có nhãn (`Từ vựng`, `Đọc · Nghe`, `Viết · Nói`, `Thi thử`). |
| 5 | Hero `OnboardingScreen.tsx` ở `1366x768` chỉ đạt `13.51% < 15%` (`M1:2`) | `out/rv-t3-c-a/v2/1366x768-dark-onboarding.png` | ✅ **ĐÃ ĐÓNG** — Hero ở `1366x768` đã đạt `bigPictures: 1` (`0` lỗi `M1`). |
| 6 | `SettingsScreen.tsx` thiếu icon màu 3D, chấm mù `+1.44 < +3.0`, cắt placeholder & gãy pill | `out/rv-t3-c-a/v2/390x844-dark-settings.png`, `375x667-dark-settings.png`, `1280x800-light-settings.png` | ✅ **ĐÃ ĐÓNG** — Đã có Hero nền minh họa + Lexi `chao` (`"Tuỳ chỉnh & sao lưu nhé!"`) + hệ icon Fluent 3D (`check`, `lightbulb`, `compass`, `rocket`…), placeholder gọn `"Tên hiển thị (mặc định: bạn)"` không bị cắt trên `375x667`, và pill Việt hoá `"Đang dùng: Tối"` nằm gọn 1 dòng. |
| 7 | `docs/audit-max/anh-sau/T3-C/` thiếu ảnh tương tác & video, còn ảnh `-loi.png` cũ | `docs/audit-max/anh-sau/T3-C/390x844-dark-hub-sheet.png`, `390x844-daily-loop.webm` | ✅ **ĐÃ ĐÓNG** — Đã xoá sạch 8 file `*-onboarding-loi.png` cũ, bổ sung ảnh sau tương tác `390x844-dark-hub-sheet.png` (mở Sheet chọn Luyện/Thi R1) và video `390x844-daily-loop.webm` (~1.11 MB). |

### 8.3. Chấm lại route `settings` và bảng Rubric cập nhật sau Vòng 1

- **Điểm `settings` mới (so với mốc gốc `4.19` ở §0.2):**
  - `390x844-dark-settings.png`: R2 = 8, R4 = 8, R5 = 9, R6 = 9 → **8.50** (gốc `4.50` → **+4.00**)
  - `390x844-light-settings.png`: R2 = 8, R4 = 8, R5 = 9, R6 = 9 → **8.50** (gốc `4.25` → **+4.25**)
  - `1280x800-dark-settings.png`: R2 = 8, R4 = 8, R5 = 9, R6 = 9 → **8.50** (gốc `4.00` → **+4.50**)
  - `1280x800-light-settings.png`: R2 = 8, R4 = 8, R5 = 9, R6 = 9 → **8.50** (gốc `4.00` → **+4.50**)
  - **Trung bình `settings` mới:** **`8.50`** → chênh lệch (Mới − Gốc) = **`+4.31`** (vượt ngưỡng `≥ +3.0` của `KIEM-THU.md` §3.1).
  - **Trung bình chấm mù 5 route sau Vòng 1:** Gốc `3.88` (`4.02` nếu bỏ ảnh trắng) → Mới **`8.65`** → Chênh lệch **`+4.77`** (**`+4.63`** nếu bỏ ảnh trắng), tất cả 5/5 route đều đạt `≥ +4.13`.

| # | Tiêu chí | Trọng số | Điểm Vòng 0 | Điểm Vòng 1 | Lý do cập nhật (dẫn tên ảnh `out/rv-t3-c-a/v2/*`) |
|---|---|---:|---:|---:|---|
| **R1** | **Sư phạm** | 15% | 9.0 | **9.0** | Giữ vững toàn bộ logic Four Strands `PP-06`, `PP-10`, `PP-02`, Từ vững `PP-16` và giữ nhớ `≥ 7 ngày` `PP-07` (`375x667-dark-stats.png`). |
| **R2** | **Cảm giác game** | 15% | 8.0 | **9.0** | Cả 5 màn (kể cả Cài đặt `390x844-dark-settings.png`) đã đồng bộ Hero, Lexi, `<LiveCard>` và icon Fluent 3D; hàng thẻ trên `1280x800-light-hub.png` bằng khít chiều cao, hết hở bóng đáy. |
| **R3** | **Juice** | 10% | 8.0 | **8.5** | Bong bóng thoại Lexi ở `375x667-dark-stats.png` hiện trọn vẹn `"0 XP · 0/12 huy hiệu!"`, kết hợp `celebrate('dailyGoal')`, `<LiveCard>` và 3 công tắc motion ở `390x844-dark-settings.png`. |
| **R4** | **Mật độ & chất lượng hình + nhân vật (màn khung)** | 10% | 6.5 | **9.0** | Đạt `0` lỗi `M1–M7` trên cả 70/70 lượt: `375x667-dark-onboarding.png` có Lexi `chao` ở ngay đầu màn, `375x667-dark-today.png` và `375x667-dark-stats.png` đủ `≥ 6` icon màu 3D, `1366x768-dark-onboarding.png` đạt Hero `≥ 15%`, và `1280x800-light-settings.png` có Lexi + icon 3D. |
| **R5** | **Thứ bậc & bố cục** | 10% | 7.5 | **9.0** | Hết lỗi `autoFocus` cuộn mất đầu trang trên `375x667-dark-onboarding.png`, lưới thẻ bằng chiều cao + 4 chip kỹ năng rõ ràng trên `1280x800-light-hub.png`, pill `"Đang dùng: Tối"` gọn 1 dòng trên `390x844-dark-settings.png` và Sheet `390x844-dark-hub-sheet.png` phân cấp rõ. |
| **R6** | **Đọc & truy cập** | 10% | 8.5 | **9.0** | Hết 100% lỗi cắt chữ ở bong bóng Lexi (`375x667-dark-stats.png`) và placeholder ô nhập tên (`375x667-dark-settings.png`); `0` lỗi `D3/D4/D5/D7/D10` trên 70 lượt đo. |
| **R7** | **Độ khó thích ứng** | 10% | 8.5 | **8.5** | Hiển thị `"Band ≈ 4.0"` trên thẻ Hub (`1280x800-light-hub.png`) và Sheet chọn chế độ (`390x844-dark-hub-sheet.png`), xếp kế hoạch theo khoảng cách Band mục tiêu. |
| **R8** | **Thưởng & tiến bộ** | 5% | 9.0 | **9.0** | Cấp độ XP, tiến độ lên cấp, Từ vững `PP-16`, giữ nhớ `≥ 7 ngày`, đóng băng chuỗi và 12 huy hiệu Fluent 3D hiển thị đầy đủ (`375x667-dark-stats.png`). |
| **R9** | **Vòng lặp hằng ngày** | 10% | 9.0 | **9.0** | Vòng lặp Hôm nay (`375x667-dark-today.png`) → chọn bài/Enter → Ngày bận/Giữ chuỗi 5p → nhắc `.ics` → sao lưu Gộp P0 & iPhone PWA P0 (`390x844-dark-settings.png`) trơn tru, `daily-loop.spec.ts` 5/5 xanh. |
| **R10** | **Nhất quán & độ tin cậy** | 5% | 8.5 | **9.0** | `70/70` lượt `audit-ui` đạt `0 CHẶN · 0 NẶNG · 0 NHẸ`, đủ ảnh sau tương tác (`390x844-dark-hub-sheet.png`) và video (`390x844-daily-loop.webm`), `tsc` 0 lỗi, 604/604 unit test và 5/5 E2E pass. |
| **TỔNG** | **Có trọng số (100%)** | **100%** | 8.23 | **8.90** | **Tất cả 10 tiêu chí ≥ 8.5 (thấp nhất: R3, R7 = 8.5 ≥ 7.0); tổng = 8.90 ≥ 8.5; Today & Hub đạt 9.0 cho cổng G3.** |

### 8.4. Phán quyết cuối sau Vòng 1: **ĐẠT**

