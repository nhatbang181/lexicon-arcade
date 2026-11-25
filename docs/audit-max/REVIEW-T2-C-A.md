# REVIEW T2-C – Reviewer A (rv-t2-c) – model gemini-4-argon-medium

> **Đợt 2 · Kiểm chéo độc lập:** Builder chạy `gemini-4-neon-medium`; Reviewer (`rv-t2-c`) chạy `gemini-4-argon-medium` (khác model tác giả).
> Worktree kiểm: `D:\English-wt\T2-C` (nhánh `audit-max/T2-C`, HEAD `3a51c63`, merge-base với `master`: `251f039ebe509b76640cb074443f373c35cd9784`).
> Phần chấm mù §0 bỏ qua ở Đợt 2 theo `07-QUY-TRINH-KIEM-CHEO.md` §3–4. Toàn bộ số đo dưới đây do `rv-t2-c` tự chạy lại độc lập trên port riêng (`5228`, `5238`).

---

## 0. Chấm mù
*(Bỏ qua ở Đợt 2 theo quy định `07-QUY-TRINH-KIEM-CHEO.md` §3: Đợt 1–2 tập trung vào test, logic sư phạm, chống gian lận và diff; chấm mù thực hiện từ Đợt 3).*

---

## 1. Kết quả tự chạy lại

### 1.1. Lệnh kiểm kỹ thuật & dữ liệu (`KIEM-THU.md` §2)

| # | Lệnh tự chạy bởi `rv-t2-c` | Kết quả thật | Ghi chú / Bằng chứng |
|---|---|---|---|
| 1 | `npx tsc --noEmit -p .` | **Exit 0** (0 lỗi) | TypeScript strict sạch hoàn toàn |
| 2 | `npx vitest run src/core/grading src/games/w1-essay-lab src/games/w2-writing-sprints` | **Exit 0** · **6/6** file · **79/79** test đạt | Thời gian 4,13 s (`bands.test` 9, `parse.test` 20, `packet.test` 7, `postcheck.test` 9, `w2/engine.test` 18, `w1/engine.test` 16) |
| 3 | `npm test` | **Exit 0** · **47/47** file · **538/538** test đạt | Toàn bộ unit test repo xanh (33,88 s), trong đó `ChartRenderer.test.tsx` (27 test) đạt 100% |
| 4 | `npm run validate:data` | **Exit 0** (PASS dev) | Schema, invariant, manifest (97 file), CREDITS (95/95 file = 100%) đạt (`task2_prompts.json` 60 đề, `task1` 24 visual, `cliches.json` 50 mục) |
| 5 | `PW_PORT=5238 PW_CHANNEL=chrome npx playwright test e2e/m4.spec.ts --project=chromium` | **Exit 0** · **2/2** test đạt (1,4 phút) · **0 `console.error` / `pageerror` / network error** | (1) W1 Task 1 `ChartRenderer`, Task 2 + `GradingPanel` + `#/portfolio`, W2 Overview Sprint (kiểm W2-04 khoá mẫu trước khi xác nhận tự chấm) + 6 ảnh 3 khung `360/768/1280`; (2) W1-01 khôi phục nháp sau reload + luồng chấm §4.5 = **3 thao tác** (≤ 6) |
| 6 | `npx vite build` + kiểm rò fixture & cảnh báo Rollup | **Exit 0** (44,67 s) · **0** rò `TASK2_CLAUDE_RESPONSE` · **0** cảnh báo Rollup W1/W2 | `Select-String dist\assets\*.js -Pattern "TASK2_CLAUDE_RESPONSE\|TASK1_CLAUDE_RESPONSE\|SPRINT_CLAUDE_RESPONSE"` = **0**; chunk `w1-essay-lab` = `47.87 kB` (`12.85 kB` gzip ≤ 120 kB), `w2-writing-sprints` = `61.59 kB` (`18.47 kB` gzip ≤ 120 kB), `GradingPanel` = `41.59 kB` (`12.27 kB` gzip), `ChartRenderer` = `65.25 kB` (`20.47 kB` gzip), `PortfolioScreen` = `19.13 kB` (`5.96 kB` gzip) |
| 7 | `node scripts/qa/size-budget.mjs` | **Exit 0** | JS khởi động `#/`: `148.28 KB` gzip (≤ 250), CSS: `125.08 KB` (≤ 130), Chunk lazy max: `50.64 KB` (≤ 120), Precache PWA: `1495.13 KiB` (≤ 1500), `"TASK2_CLAUDE_RESPONSE"` = OK |
| 8 | Kiểm axe-core (`e2e/a11y.spec.ts` + script axe 3 route `play/w1`, `play/w2`, `portfolio` × `dark/light`) | **0 `label-content-name-mismatch` trong component T2-C**; **`play-w1/light` có 125 node `color-contrast` (vượt `KNOWN_DEBT` 123 ở `e2e/a11y.spec.ts` 2 node)** | Xem chi tiết Lỗi #1 ở Mục 2: builder đổi `#0B0F1A` sang `var(--color-on-accent, var(--color-bg))` làm nút active màu cam `--color-writing` ở theme `light` nhận chữ trắng `--color-bg` (`#F7F8FB`, tương phản 1,98:1) khi `T3-A` chưa định nghĩa `--color-on-accent` |

### 1.2. Kết quả `audit-ui.mjs` trên 7 khung × 2 theme (`out/rv-t2-c/`)

- Lệnh chạy:
  `BASE_URL=http://127.0.0.1:5228 node docs/audit-max/cong-cu/audit-ui.mjs --route play/w1,play/w2,portfolio --vp 390x844,375x667,430x932,820x1180,1180x820,1280x800,1366x768 --theme dark,light --out out/rv-t2-c`
- Tổng kết **42 lượt** (3 route × 7 khung × 2 theme): **`0 CHẶN · 156 NẶNG · 0 NHẸ`** (`M5:60  J9:28  M1:14  M2:14  M3:14  M4:14  D10:12` — **0 D3, 0 D4, 0 D5, 0 D7**).
  - Trên `play/w1`: **0 CHẶN**, **1–2 NẶNG/màn** (`J9` chuyển động chờ thuộc Đợt 4 + `D10` ở `<select>` lọc chủ đề) → **≤ 2 NẶNG/màn**.
  - Trên `play/w2`: **0 CHẶN**, **1 NẶNG/màn** (chỉ `J9` chuyển động chờ thuộc Đợt 4) → **≤ 2 NẶNG/màn**.
  - Trên `portfolio`: **0 CHẶN**, **4–10 NẶNG/màn** (100% là `M1..M5` mật độ hình/mascot màn khung thuộc Đợt 3 `T3-A`/`T3-C`, **0** lỗi `D3/D4/D5/D7/D10`).
- Kiểm `--reduced 1` (`prefers-reduced-motion: reduce`, `390x844` dark, xuất ra `out/rv-t2-c-reduced`): **`0 CHẶN`** (`J8` đạt: `infiniteAnims = 0`).

| Khung | Theme | Route | CHẶN | NẶNG | Tràn ngang (D5) | Chạm < 44 (D3) | Chữ < 12 (D4) | Thuật ngữ (D7) | Control gốc (D10) | Ghi chú mã NẶNG |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| 390×844 | dark | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10` (`<select>`), `J9` |
| 390×844 | dark | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 390×844 | dark | portfolio | 0 | 5 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 390×844 | light | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10` (`<select>`), `J9` |
| 390×844 | light | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 390×844 | light | portfolio | 0 | 5 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 375×667 | dark | play/w1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` *(select nằm dưới fold)* |
| 375×667 | dark | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 375×667 | dark | portfolio | 0 | 4 | 0 | 0 | 0 | 0 | 0 | `M1..M4` *(Đợt 3)* |
| 375×667 | light | play/w1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 375×667 | light | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 375×667 | light | portfolio | 0 | 4 | 0 | 0 | 0 | 0 | 0 | `M1..M4` *(Đợt 3)* |
| 430×932 | dark | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 430×932 | dark | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 430×932 | dark | portfolio | 0 | 9 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 430×932 | light | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 430×932 | light | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 430×932 | light | portfolio | 0 | 9 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 820×1180 | dark | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 820×1180 | dark | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 820×1180 | dark | portfolio | 0 | 10 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 820×1180 | light | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 820×1180 | light | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 820×1180 | light | portfolio | 0 | 10 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 1180×820 | dark | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 1180×820 | dark | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 1180×820 | dark | portfolio | 0 | 10 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 1180×820 | light | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 1180×820 | light | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 1180×820 | light | portfolio | 0 | 10 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 1280×800 | dark | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 1280×800 | dark | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 1280×800 | dark | portfolio | 0 | 10 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 1280×800 | light | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 1280×800 | light | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 1280×800 | light | portfolio | 0 | 10 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 1366×768 | dark | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 1366×768 | dark | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 1366×768 | dark | portfolio | 0 | 10 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |
| 1366×768 | light | play/w1 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | `D10`, `J9` |
| 1366×768 | light | play/w2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | `J9` |
| 1366×768 | light | portfolio | 0 | 10 | 0 | 0 | 0 | 0 | 0 | `M1..M5` *(Đợt 3)* |

### 1.3. Kiểm chống gian lận (`07-QUY-TRINH-KIEM-CHEO.md` §5 & `04-LUAT-CUNG.md`)

- `git diff --name-only $(git merge-base master HEAD)..HEAD`: 100% file nằm gọn trong phạm vi độc quyền của T2-C (`src/core/grading/postcheck.{ts,test.ts}`, `src/core/storage/repos/essayRepo.ts`, `src/features/portfolio/PortfolioScreen.tsx`, `src/games/_shared/{ChartRenderer,GradingPanel}.tsx`, `src/games/w1-essay-lab/**`, `src/games/w2-writing-sprints/**`, `e2e/m4.spec.ts`, `docs/audit-max/{KE-HOACH-T2-C,BAO-CAO-T2-C}.md`, `docs/audit-max/anh-sau/T2-C/**`).
- **0** chỉnh sửa vào `docs/audit-max/cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `DECISIONS.md`, `scripts/qa/**`, `scripts/validate/**` (`SR-11` / `Q4`).
- **0** `test.skip`, `it.skip`, `test.fixme`, `data-audit-ignore`, `navigator.webdriver`, `opacity:0` lách công cụ (`SR-12` / `Q5`).
- **0** `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` (`SR-70` / `P4`).
- **0** file rác (`dist/`, `node_modules/`, `test-results/`, `out/`, `e2e/screenshots/**`, `*.lnk`, `.env*`) bị track trong git (`SR-07` / `P7`).

---

## 2. Lỗi tìm thấy (6 lỗi: 0 CHẶN · 2 NẶNG · 4 NHẸ, xếp nặng → nhẹ)

| # | Màn / File:dòng | Khung + theme | Vị trí / Tọa độ | Mã luật | Mức | Mô tả chi tiết | Cách sửa đề xuất |
|---|---|---|---|---|---|---|---|
| 1 | `play/w1` (`src/games/w1-essay-lab/W1EssayLab.tsx:1176,1190,1230,1244,1260,1274`) & `portfolio` (`src/features/portfolio/PortfolioScreen.tsx:539`) | `390x844` light, `1280x800` light (`out/rv-t2-c/390x844-light-play_w1-loi.png`) | Tab `Task 2 · Essay (60)` `(42, 463, 165, 48)` & chip `Tất cả dạng` `(38, 697, 96, 44)` trên `390x844-light-play_w1.png` | `D2` / `D1` | **NẶNG** | Để bỏ màu hex cứng `#0B0F1A` (`D1`), builder đổi màu chữ của tab active (`Task 2 · Essay`) và chip active (`Tất cả dạng`, `Tất cả (0)`) sang `var(--color-on-accent, var(--color-bg))`. Tuy nhiên hiện tại `src/design/tokens.css` chưa có `--color-on-accent` (thuộc `T3-A`), nên ở theme `light` fallback rơi về `--color-bg` (`#F7F8FB` trắng sáng) đặt trên nền cam `--color-writing` (`#F59E0B`), làm tương phản giảm từ ~9,5:1 xuống **1,98:1** và khiến `e2e/a11y.spec.ts` (`play-w1 · light`) tăng từ 123 lên **125 node** `color-contrast` (vượt ngưỡng nợ `KNOWN_DEBT = 123` đúng 2 node). | Trước khi `T3-A` thêm `--color-on-accent` vào `tokens.css`, dùng style active giống nút chọn Chế độ ở dòng `:1208-1211` (`backgroundColor: 'var(--color-surface-2)'`, `borderColor: 'var(--color-writing)'`, `color: 'var(--color-writing)'` hoặc `'var(--color-text)'`), hoặc dùng `color-mix(in srgb, var(--color-writing) 18%, var(--color-surface))` với chữ `var(--color-text)` để vừa 0 hex cứng (`D1`) vừa đạt contrast AA ở cả `dark` và `light` (`e2e/a11y.spec.ts` xanh 100%). |
| 2 | `play/w1` (`src/games/w1-essay-lab/W1EssayLab.tsx:1284-1301`) & `portfolio` (`src/features/portfolio/PortfolioScreen.tsx:727-743`) | `390x844`, `430x932`, `820x1180`, `1180x820`, `1280x800`, `1366x768` × `dark/light` (`out/rv-t2-c/390x844-dark-play_w1-loi.png`) | `<select>` lọc chủ đề `(37, 761, 316, 44)` ở `390x844` và `(841, 419, 134, 44)` ở `1280x800` | `D10` | **NẶNG** | Thẻ `<select aria-label="Lọc theo chủ đề">` ở màn chọn đề W1 (và `<select>` chọn điểm thật trong Portfolio khi mở form) chưa có `appearance-none` (`appearance: none`) và icon mũi tên bọc theo token, nên `audit-ui.mjs` báo 1 lỗi `D10` (`control gốc <select select-one> chưa bọc`) trên 12/14 lượt chụp của `play/w1`. Ngoài ra, các checkbox tự chấm ở `W1EssayLab.tsx:2129-2136` và `W2WritingSprints.tsx:1344-1356,1637-1649` cũng là `<input type="checkbox">` gốc chưa có `appearance-none`. | Bọc `<select>` trong `<div className="relative">` có `className="appearance-none pr-8 ..."` kèm icon `<ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />`. Với checkbox tự chấm, thêm `appearance-none` hoặc chuyển sang nút/row bấm có icon `<Check />` theo token. |
| 3 | `src/games/_shared/ChartRenderer.tsx:272,300,338,358,378,561,581,603,624,806,836,1106,1188,1204` | Mọi khung khi mở đề Task 1 (`play/w1` pha viết & `play/w2` Overview Sprint) | Bên trong SVG biểu đồ (`viewBox="0 0 640 350"` / `270x270`) và badge `Cyclic/Linear process` | `D4` / `SR-41` | **NHẸ** | Trong `ChartRenderer.tsx`, badge `Cyclic process` / `Linear process` ở dòng `:1106` còn dùng class `text-[11px]` (< 12 px), và nhiều thẻ `<text>` trong SVG biểu đồ đặt `fontSize={10}`, `10.5`, `11`, `11.5`. Khi SVG `viewBox` 640 px co xuống màn iPhone 375–390 px (~320 px rộng), chữ số trục Y/X hiển thị thực tế nhỏ hơn 12 px. | Đổi `text-[11px]` ở `ChartRenderer.tsx:1106` thành `text-xs` (12 px) và nâng `fontSize` tối thiểu của `<text>` trong SVG `ChartRenderer` lên `12` (hoặc `13–14` trong hệ tọa độ `viewBox="0 0 640 350"`). |
| 4 | `src/games/w2-writing-sprints/W2WritingSprints.tsx:427-436` | Mọi khung (`play/w2` các mode Thesis, Cliché Surgery, Academic Upgrade) | `startSprint` cho `thesis`, `cliche`, `upgrade` | `W2-02` | **NHẸ** | `selectOverviewPrompts` và `selectIdeaPrompts` đã dùng `seededShuffle` + loại trừ `recentCompletedIdsRef.current` (14 ngày) rất tốt (`W2-02`). Tuy nhiên 3 sprint còn lại (`thesis`, `cliche`, `upgrade`) ở `:427-436` mới chỉ xoay vòng mảng theo `offset = seed % 12` (`slice(offset)`), chưa gọi `seededShuffle` và chưa lọc `recentCompletedIdsRef.current`, nên 2 phiên có cùng `seed % 12` sẽ ra cùng thứ tự câu. | Dùng `seededShuffle(task2Prompts, seed)` + ưu tiên đề ngoài `recentCompletedIdsRef.current` cho `thesis`, và trộn `seededShuffle` cho `cliche` / `upgrade`. |
| 5 | `play/w2` (`src/games/w2-writing-sprints/W2WritingSprints.tsx:838-846,855-857`) & `play/w1` | `390x844`, `375x667` (`out/rv-t2-c/390x844-dark-play_w2.png`) | Nút `←` quay lại `(16, 82, 44, 44)` và pill `Level 1` `(276, 73, 59, 25)` trên `390x844-dark-play_w2.png` | `U3` / `D7` / `J9` | **NHẸ** | (a) Ngay dưới thanh header của `PlayScreen` (đã có nút `✕` thoát tại `(16, 6, 44, 44)` và tiêu đề `W2`), màn chọn sprint của W2 vẫn có nút `←` quay lại trùng chức năng (`U3` — builder giữ lại để không mất nút trong `KE-HOACH-T2-C.md`) và pill `Level {level}` (`:856`, nên hiển thị theo band hoặc ẩn vì header sẽ có nhãn Band theo `B6`). (b) Cả `play/w1` và `play/w2` ở màn chọn đề đều có `anims = 0` nên `audit-ui.mjs` ghi nhận `J9` (thuộc phạm vi Đợt 4 `T4-C`). | Ở `T4-C`, bỏ nút `←` trùng với header `PlayScreen` (khi điều phối cho phép theo `U3`), đổi `Level {level}` sang nhãn thân thiện người học, và thêm tín hiệu sống nhẹ (`J9`) ngoài vùng chữ đọc. |
| 6 | `src/games/w1-essay-lab/W1EssayLab.tsx` (2208 dòng) & `src/games/w2-writing-sprints/W2WritingSprints.tsx` (2077 dòng) | Mã nguồn component | Toàn file | `W1-14` / `W2-10` | **NHẸ** | Hai file component chính vượt 1500 dòng (`W1EssayLab.tsx` 2208 dòng, `W2WritingSprints.tsx` 2077 dòng). Đây là các mục P2 (`W1-14`, `W2-10`) đã được kế hoạch ghi nhận hoãn sang Đợt 4 (`T4-C`) để giữ ổn định khi sửa logic P0/P1 ở Đợt 2. | Ở `T4-C`, tách `PromptSelector`, `EssayEditor`, `ReviewStage`, `Band8ModelViewer` (W1) và 5 round component `OverviewRound`, `IdeaRound`, `ThesisRound`, `ClicheRound`, `UpgradeRound` (W2) thành các file `< 600` dòng. |

*(Lưu ý về a11y trên `/portfolio`: axe báo 1 node `label-content-name-mismatch` tại `.gap-2.5` — đây là link logo `Lexicon Arcade` có `aria-label="Lexicon Arcade – Về Hôm nay"` nằm ở `src/app/Shell.tsx` thuộc phạm vi `T1-B`/`T3-C`, đã ghi trong `KNOWN_DEBT` của `e2e/a11y.spec.ts` và `HANDOFF.md` T1-C #6; bản thân `PortfolioScreen.tsx`, `W1EssayLab.tsx`, `W2WritingSprints.tsx`, `GradingPanel.tsx`, `ChartRenderer.tsx` có **0** lỗi `label-content-name-mismatch`).*

---

## 3. Bảng tiêu chí ĐẠT từng mã lỗi của T2-C (kèm bằng chứng thật)

*(Đợt 2 chưa chấm điểm rubric thẩm mỹ R1–R10 theo `07-QUY-TRINH-KIEM-CHEO.md` §3; thay bằng bảng nghiệm thu từng mã lỗi kỹ thuật & sư phạm của T2-C).*

| Mã lỗi / Yêu cầu | Mức gốc | Trạng thái | Bằng chứng thật (`rv-t2-c` kiểm chứng) |
|---|---|---|---|
| **W1-01** · Autosave nháp thật vào IndexedDB + khôi phục nháp sau reload | P0 | **ĐẠT** | `essayRepo.ts:70-117` lưu/đọc/xoá `w1.activeDraft` trong `db.kv` (hết hạn 24h); `W1EssayLab.tsx:414-475` dùng `elapsedSecRef` để tick đồng hồ 1s không reset debounce 1,2s; `:1135-1161` hiện banner `"Tiếp tục bài đang viết?"` + nút `"Tiếp tục viết"` / `"Xoá nháp"`. E2E `e2e/m4.spec.ts:177-202` gõ bài → chờ `"Đã lưu nháp lúc"` → `page.reload()` → bấm `"Tiếp tục viết"` → khôi phục 100% nội dung bài viết. |
| **W1-02** · Modal xác nhận trước khi bỏ bài đang viết (> 20 từ) & trước khi xoá bài trong Portfolio | P1 | **ĐẠT** | `W1EssayLab.tsx:686-692,1916-1956` mở Modal `"Bỏ bài đang viết?"` khi `wordCount > 20` với 3 lựa chọn (`Tiếp tục viết`, `Lưu nháp & chọn đề khác`, `Bỏ bài`); `PortfolioScreen.tsx:671,789-819` mở Modal `"Xoá bài viết này?"` trước khi gọi `essayRepo.remove`. |
| **W1-03** · Exam tự nộp khi hết giờ, phát `timeup`, đồng hồ không âm, 0 XP ở Exam (`SR-24`) | P1 | **ĐẠT** | `W1EssayLab.tsx:826-833` tự gọi `playSfx('timeup', { examMode: true })` và `handleSubmitEssay({ forced: true })` khi `remainingSec <= 0`; `:1522-1523` hiển thị `formatClock(Math.max(0, timerEval.remainingSec))` không âm; `:718,722,2153-2162` cho phép lưu bài < 50 từ khi hết giờ thi mà không tạo gói chấm lỗi; `engine.ts:573-583` trả `totalXp: 0` cho `mode === 'exam'` và `isRetry: true`. Unit test `w1/engine.test.ts:279-320` đạt. |
| **W1-04 / SR-73** · Nút `"Dán kết quả mẫu"` chỉ ở DEV, 0 chuỗi `TASK2_CLAUDE_RESPONSE` trong `dist/` | P0 | **ĐẠT** | `GradingPanel.tsx:491-492,736-747` chỉ render nút `"Dán kết quả mẫu (DEV)"` khi `import.meta.env.DEV && sampleResponse`; `W1EssayLab.tsx:876-892` dùng dynamic `import('../../test/fixtures/grading')` bên trong `if (!import.meta.env.DEV) return;`. Kiểm `Select-String dist\assets\*.js -Pattern "TASK2_CLAUDE_RESPONSE"` = **0** và `node scripts/qa/size-budget.mjs` báo OK. |
| **W1-05 / G-01 / G-02** · Chấm idempotent, chặn lệch `attemptId` (`blocking: true`), ẩn > 50% quote chặn band, chỉ ghi band lần chấm đầu bản v1 | P1/P2 | **ĐẠT** | `postcheck.ts:279-290` gắn `ATTEMPT_ID_MISMATCH` với `blocking: true`; `GradingPanel.tsx:478-488,534-542,780,950-972` chặn gọi `onGraded` khi `attemptIdMismatch` cho tới khi người học bấm `"Xác nhận đúng bài này & Lưu"` và khoá nút lưu khi `lastSavedRaw === pastedText.trim()`; `postcheck.ts:515-527,581-582` chặn `allowBandEvidence` khi `hiddenCount / totalChecked > 0.5`; `W1EssayLab.tsx:960-987` chỉ ghi `bandRepo.add` ở lần chấm đầu tiên của bản v1 (`revisionNumber === 0`, `!firstGradeRecordedRef.current`, `!pastedFlag`, `!isRetryPromptRef.current`). Unit test `postcheck.test.ts:148-185` đạt. |
| **W1-06** · Lưu metadata (`attemptId`, `pasted`, `mode`, `durationSec`) và mở lại `GradingPanel` trong Portfolio đúng `attemptId` | P1 | **ĐẠT** | `essayRepo.ts:16-23,120-134` lưu `w1.essayMeta.<id>`; `W1EssayLab.tsx:744-751` ghi meta ngay khi nộp; `PortfolioScreen.tsx:629-640,688-709` cho phép mở `GradingPanel` ngay trên thẻ bài `Chờ chấm` với đúng `meta.attemptId` gốc. |
| **W1-07 / W1-08 / W2-06 / PP-11** · Producer `userItemRepo.upsertWithCard` cho `err:user_*`, `col:user_*`, `err:w2_*` | P0 | **ĐẠT** | `W1EssayLab.tsx:895-915,990-993` tự động ghi mọi `srsItems` có `kind === 'error'` và khi bấm nút `+ SRS` vào `userItemRepo.upsertWithCard` đủ `{id, kind, front, back, noteVi, source: 'w1'}`; `PortfolioScreen.tsx:190-210,261-263` cũng ghi tương tự khi chấm từ Portfolio; `W2WritingSprints.tsx:344-375` ghi `err:w2_<slug>` qua `userItemRepo.upsertWithCard` với `front/back/noteVi` đầy đủ. |
| **PP-16 / SR-89** · Nhãn `"ước lượng"`, kiểm ≥ 3 nhận xét cụ thể, chỉ lần chấm đầu tính band | P0 | **ĐẠT** | `GradingPanel.tsx:908-913,936` hiển thị rõ `"Band ước lượng (AI)"` và pill `"{specificFeedbackCount} nhận xét cụ thể"`; `PortfolioScreen.tsx:584` hiển thị `"Ước lượng Claude: x.x"`; `postcheck.ts:539-582` đếm tổng `strengths + issues` đã xác minh quote và chặn `allowBandEvidence = false` kèm cảnh báo `INSUFFICIENT_SPECIFIC_FEEDBACK` khi `< 3`. Unit test `postcheck.test.ts:187-210` đạt. |
| **§4.5** · Giảm ma sát luồng chấm copy/dán xuống ≤ 6 thao tác | P1 | **ĐẠT** | `GradingPanel.tsx:431-435,502-532,634-642,754-761` có nút gộp `"Copy gói & Mở Claude"`, nút `"Dán từ clipboard"`, và tự động gọi `analyzeResponse(pasted)` ngay ở sự kiện `onPaste` khi chuỗi dán `> 200` ký tự có `{`. E2E `e2e/m4.spec.ts:204-225` đo thực tế = **3 thao tác** (≤ 6). |
| **G-03 / G-04** · `compareRevisionBands` nhận `WritingCapOptions`; `ChartRenderer` có tóm tắt a11y và chế độ bảng số liệu | P2/P3 | **ĐẠT** | `w1/engine.ts:515-550` truyền `v1CapOptions` và `v2CapOptions` vào `computeWritingTaskBand` (`w1/engine.test.ts:322-332` đạt); `ChartRenderer.tsx:1255-1262,1347-1411` có `<p className="sr-only">{buildChartAccessibleSummary(visual.chart)}</p>` và nút `"Xem dạng bảng số liệu"` (`chart-toggle-table-btn`) bung bảng `<table>` đầy đủ. |
| **W2-01** · Lưu cập nhật kết quả Claude sau Recap vào IndexedDB | P1 | **ĐẠT** | `W2WritingSprints.tsx:588,744-773` lưu `savedAttemptIdRef.current` từ lần lưu Recap đầu và gọi `attemptRepo.finalize(savedAttemptIdRef.current, { attempt: updatedAttempt })` khi dán kết quả Claude, cập nhật cả sao từng lượt và phần chênh `+20 XP` (`xpDelta` trong `writeProgress`). |
| **W2-02** · Chọn đề W2 có seed + loại trừ đề đã làm trong 14 ngày | P1 | **ĐẠT** | `w2/engine.ts:301-356,526-556` cài đặt `seededShuffle` (Mulberry32) và ưu tiên đề chưa nằm trong `excludeIds`; `W2WritingSprints.tsx:262-284,384,414-426` đọc `attemptRepo.getRecent({ gameId: 'w2', limit: 30 })` trong 14 ngày để truyền `excludeIds`. Unit test `w2/engine.test.ts:317-342` xác nhận 2 phiên liên tiếp `overlap === 0`. |
| **W2-03** · Chỉ đếm đồng hồ sau khi tải xong biểu đồ Task 1 | P2 | **ĐẠT** | `W2WritingSprints.tsx:320-333` kiểm tra `if (sprintType === 'overview' && (task1Loading || !activeTask1)) return;` trước khi chạy `setInterval` 1s. |
| **W2-04 / PP-03** · Khoá checklist tự chấm trước khi mở Overview / Idea mẫu Band 8 | P2 | **ĐẠT** | `W2WritingSprints.tsx:1347,1383-1406,1640,1670-1693` ẩn hoàn toàn `w2-overview-model` / `w2-idea-model` cho tới khi người học bấm `"Xác nhận tự chấm & xem mẫu"` (`w2-confirm-selfcheck-btn`), sau đó khoá `disabled` toàn bộ checkbox tự chấm. E2E `e2e/m4.spec.ts:160-165` kiểm chứng chặt chẽ. |
| **W2-07 / W2-08 / PP-C5** · Hết giờ Cliché/Upgrade vẫn ghi lượt 0★, phím tắt `Ctrl/Cmd+Enter` nộp bài, retry 0 XP | P3/P1 | **ĐẠT** | `W2WritingSprints.tsx:641-682` ghi lượt 0★ `responseText: '(hết giờ)'` khi timeout; `:1281-1286` hỗ trợ `Ctrl/Cmd+Enter` nộp bài; `:535,1125` đặt `xp: 0` khi `isRetrySessionRef.current === true`. |
| **TU-02 / F1 / X5** · `attemptRepo.saveProgress` + `registerProgressSaver` + `pagehide` ở cả W1 & W2; 0 cảnh báo Rollup W1/W2 | P1 | **ĐẠT** | `W1EssayLab.tsx:439-455,478-489` và `W2WritingSprints.tsx:548-575,698` lưu tiến độ giữa phiên, đăng ký `registerProgressSaver` và flush ở `pagehide`; `w1-essay-lab/index.ts` dùng `Promise.resolve({ default: W1EssayLab })` nên `npx vite build` có **0** cảnh báo Rollup ở W1/W2. |
| **SR-34 / SR-70** · Parse kết quả dán qua `zod.safeParse`, 0 `dangerouslySetInnerHTML` | P0 | **ĐẠT** | `src/core/grading/parse.ts:552` gọi `schema.safeParse(rawObject)` với schema Zod chặt (`WritingResultV1Schema`, `SpeakingResultV1Schema`, `SprintResultV1Schema`); grep toàn bộ `src/` 0 `dangerouslySetInnerHTML` / `innerHTML` / `eval`. |

---

## 4. Chức năng (đối chiếu `KE-HOACH-T2-C.md` – `LUAT.md` Q6 / `SR-80`)

Đã đối chiếu mã nguồn và chạy kiểm E2E / UI cho toàn bộ danh sách nút và chức năng trong `docs/audit-max/KE-HOACH-T2-C.md`:

- **W1 · Chọn đề:**
  - Tab `Task 2 · Essay (60)` / `Task 1 · Visual (24)` (`W1EssayLab.tsx:1167-1195`): **Còn, hoạt động**.
  - Chế độ `Luyện tập (có gợi ý)` / `Thi thử (Exam)` (`:1201-1215`): **Còn, hoạt động**.
  - Bộ lọc dạng bài Task 2 (6 dạng) / biểu đồ Task 1 (7 dạng), `<select>` chủ đề, ô tìm đề (`:1220-1322`): **Còn, hoạt động**.
  - Banner khôi phục nháp `"Tiếp tục bài đang viết?"` + nút `"Tiếp tục viết"` / `"Xoá nháp"` (`:1135-1161`): **Đã bổ sung theo W1-01, hoạt động**.
  - Nút `"Portfolio & Điểm thật"`, `"Đề gợi ý hôm nay"`, `"Viết đề này"` trên từng thẻ đề: **Còn đủ, hoạt động**.
- **W1 · Viết/Sửa:**
  - Nút `"Chọn đề khác"` (mở modal xác nhận nếu đã gõ > 20 từ theo `W1-02`): **Còn, hoạt động**.
  - Đồng hồ + nút tạm dừng/tiếp tục (ở Training), bộ đếm từ `x / 150|250 từ`: **Còn, hoạt động**.
  - Khung dàn ý nhanh & `Idea Bank` / `Key Features` (ở Training): **Còn, hoạt động**.
  - Cảnh báo Cliché thời gian thực (50 cụm + gợi ý Band 8.0), phát hiện paste > 100 ký tự, lưu nháp tự động vào IndexedDB: **Còn đủ, hoạt động**.
  - Nút `"Nộp bài & Chấm"` / `"Nộp bản sửa v2..v4"`: **Còn, hoạt động**.
- **W1 · Review/Graded:**
  - Nút `"Xem/Ẩn bài mẫu Band 8.0"` (kèm chú thích 4 tiêu chí TR/CC/LR/GRA bấm được), `"Sửa bài (v2/v3) & Chấm lại"`, `"Portfolio"`, `"Viết đề mới"`, `"Lưu & thoát về Hub"`: **Còn đủ, hoạt động**.
  - Thẻ so sánh Bản 1 vs Bản sửa (có áp `WritingCapOptions` theo `G-03`), Checklist tự chấm (+10 XP ở Training lần đầu), `GradingPanel`: **Còn đủ, hoạt động**.
- **GradingPanel:**
  - Nút `"Copy gói & Mở Claude"`, `"Copy gói chấm"`, `"Tải .md"`, link `"Mở Claude.ai"`, `"Xem trước gói chấm"`: **Còn đủ, hoạt động**.
  - Ô dán kết quả (tự phân tích khi dán > 200 ký tự có `{`), nút `"Dán từ clipboard"`, `"Phân tích & Lưu kết quả"` (idempotent), `"Xoá ô dán"`, nút `"Dán kết quả mẫu (DEV)"` (chỉ hiện ở DEV): **Còn đủ, hoạt động**.
  - Khối báo lỗi JSON + nút `"Copy lời nhắc sửa gửi lại Claude"`, cổng xác nhận khi lệch `attemptId` (`G-01`), báo cáo 4 tiêu chí / Sprint + trích dẫn + nút thêm SRS: **Còn đủ, hoạt động**.
- **W2 · Chọn sprint / Đang chơi / Recap:**
  - Màn chọn sprint: 5 thẻ bắt đầu (`Overview Sprint`, `Idea Sprint`, `Thesis Sprint`, `Cliché Surgery`, `Academic Upgrade`) + nút quay lại: **Còn đủ, hoạt động**.
  - Màn đang chơi: HUD tiến độ/giờ/streak/XP + nút thoát; Overview/Idea (nhập → nộp → tick checklist → bấm `"Xác nhận tự chấm & xem mẫu"` khoá checklist → mở mẫu Band 8 & bấm cụm highlight lưu SRS → lượt tiếp); Thesis (nhập → chấm tức thì → mẫu → lượt tiếp); Cliché/Upgrade (4 lựa chọn → giải thích + lưu SRS → lượt tiếp): **Còn đủ, hoạt động**.
  - Màn Recap: 4 thẻ tổng kết (Tổng sao, Độ chính xác, Chuỗi tốt nhất, XP nhận được), danh sách từng lượt + nút `"Lưu SRS"` cho `betterChunk`, nút `"Chơi lại"` (0 XP khi retry), `"Chọn sprint khác"`, `"Về trang chính"`, `GradingPanel` chấm gộp Claude (lưu cập nhật DB theo `W2-01`): **Còn đủ, hoạt động**.
- **Portfolio (`#/portfolio`):**
  - Nút `"Hub"`, `"Viết bài mới (W1)"`; 4 thẻ KPI; Biểu đồ tiến bộ Band; Khối hiệu chỉnh `biasOffset` + nút bật/đặt lại; 5 nút lọc (`Tất cả`, `Task 2`, `Task 1`, `Đã chấm`, `Chờ chấm`); Từng bài: `"Chấm với Claude"` (mở `GradingPanel` inline đúng `attemptId`), `"Nhập/Sửa điểm thật"` (form + Lưu/Huỷ), `"Xem bài"`, nút `"Xoá bài viết"` (mở modal xác nhận): **Còn đủ, hoạt động**.

→ **0 chức năng cũ bị mất** (`SR-80` / `Q6` đạt).

---

## 5. So với tham chiếu

1. **`play/w1` – Màn chọn đề & Phòng viết Academic (`out/rv-t2-c/390x844-dark-play_w1.png`, `1280x800-dark-play_w1.png`, `test-results/m4/w1-360.png`):**
   - *Giống công cụ luyện viết học thuật chuẩn & Duolingo ở:* bố cục rõ ràng, bộ lọc dạng bài/biểu đồ đầy đủ, vùng chạm đạt 100% ≥ 44 px, 0 tràn ngang trên mọi khung từ 360/375/390 đến 1366, có banner khôi phục nháp thật từ IndexedDB và cảnh báo Cliché theo thời gian thực.
   - *Còn kém ở:* thẻ `<select>` lọc chủ đề chưa bọc `appearance: none` (`D10`), và ở theme `light` nút/tab đang chọn màu cam dùng chữ `--color-bg` sáng làm giảm tương phản (Lỗi #1, #2).
2. **`play/w2` – Màn chọn Sprint & Overview Sprint (`out/rv-t2-c/390x844-dark-play_w2.png`, `1280x800-dark-play_w2.png`, `test-results/m4/w2-360.png`):**
   - *Giống Balatro / Duolingo ở:* chia kỹ năng viết lớn thành 5 bài tập ngắn 60–180 giây có nhịp độ nhanh, sao bung stagger 120 ms kèm âm thanh tăng pitch theo số sao, thanh giờ chỉ animate `scaleX` và khoá tự chấm trước khi mở mẫu Band 8 (`W2-04`).
   - *Còn kém ở:* màn chọn sprint chưa có chuyển động nghỉ nhẹ (`J9`, thuộc Đợt 4 `T4-C`) và chưa có icon màu Fluent Emoji (`T3-A`).
3. **`portfolio` – Hồ sơ bài viết & Hiệu chỉnh Điểm thật (`out/rv-t2-c/390x844-dark-portfolio-loi.png`, `1280x800-dark-portfolio-loi.png`):**
   - *Giống dashboard theo dõi học tập có chủ đích ở:* tách bạch rõ `"Ước lượng Claude"` với `"Điểm thật"`, tự động tính độ lệch trung bình để gợi ý `biasOffset` khi đủ ≥ 5 bài đối chiếu, và cho phép mở lại `GradingPanel` chấm bài `Chờ chấm` ngay tại chỗ.
   - *Còn kém ở:* là màn khung nên khi chưa có nhân vật Lexi và bộ icon màu của Đợt 3 (`T3-A`/`T3-C`), công cụ `audit-ui.mjs` báo các mã mật độ hình `M1..M5`.

---

## 6. Luật script chưa đo, đã kiểm bằng cách nào

| Mã luật | Nội dung luật | Cách `rv-t2-c` đã kiểm | Kết quả |
|---|---|---|---|
| **SR-34 / SR-70 / P4** | Dữ liệu dán từ Claude qua `zod.safeParse`; cấm `dangerouslySetInnerHTML`, `innerHTML`, `eval` | Đọc `src/core/grading/parse.ts:551-565` & `schemas.ts`; quét `Select-String` trên toàn bộ diff `src/` | **ĐẠT** |
| **SR-73 / P3 / W1-04** | Nút mẫu và fixture `TASK*_CLAUDE_RESPONSE` chỉ ở bản DEV, không lọt vào bundle prod | Đọc `GradingPanel.tsx:491,736`, `W1EssayLab.tsx:876-892`, `W2WritingSprints.tsx:1152`; chạy `npx vite build`, `node scripts/qa/size-budget.mjs` và grep `dist/assets/*.js` (= 0) | **ĐẠT** |
| **PP-16 / SR-89** | Band LLM luôn gắn nhãn `"ước lượng"`, kiểm ≥ 3 nhận xét cụ thể, chỉ lần chấm đầu tính band | Kiểm `postcheck.ts:539-583`, `GradingPanel.tsx:908-945`, `W1EssayLab.tsx:960-987`, `PortfolioScreen.tsx:236-260,584`; chạy `postcheck.test.ts` & E2E `m4.spec.ts` | **ĐẠT** |
| **PP-03 / SR-23 / W2-04** | Không lộ bài mẫu trước khi người học nộp bài (W1) và xác nhận tự chấm (W2) | Kiểm `W1EssayLab.tsx:2000-2007,2176` (chỉ ở stage `review`/`graded`) và `W2WritingSprints.tsx:1383-1406,1670-1693`; chạy E2E `e2e/m4.spec.ts:160-165` | **ĐẠT** |
| **B7 / SR-24 / PP-C5** | Exam mode 0 XP, 0 SFX trừ `timeup`; retry 0 XP | Kiểm `w1/engine.ts:572-584`, `W1EssayLab.tsx:761-798,826-847,996`, `W2WritingSprints.tsx:535,765,1125`; chạy unit test `w1/engine.test.ts:279-320` | **ĐẠT** |
| **PP-11 / X-01** | Producer ghi `userItemRepo.upsertWithCard` cho `err:user_*`, `col:user_*`, `err:w2_*` | Kiểm `W1EssayLab.tsx:895-915`, `PortfolioScreen.tsx:190-210`, `W2WritingSprints.tsx:344-375` | **ĐẠT** |
| **TU-02 / F1** | Lưu tiến độ giữa phiên `attemptRepo.saveProgress` + `registerProgressSaver` + `pagehide` | Kiểm `W1EssayLab.tsx:419-489` và `W2WritingSprints.tsx:548-575` | **ĐẠT** |
| **J8 / SR-48** | Tôn trọng `prefers-reduced-motion: reduce` | Chạy `audit-ui.mjs --route play/w1,play/w2 --vp 390x844 --theme dark --reduced 1` (0 CHẶN, `infiniteAnims = 0`) + kiểm `useReducedMotion()` trong `GradingPanel.tsx`, `W2WritingSprints.tsx` | **ĐẠT** |

---

## 7. Phán quyết: **ĐẠT**

- **Số lỗi:** **0 CHẶN** · **2 NẶNG** (Lỗi #1 contrast nút active màu cam ở theme `light` khi chưa có `--color-on-accent`; Lỗi #2 thẻ `<select>` lọc chủ đề W1 chưa có `appearance: none` `D10`) · **4 NHẸ**.
- **Đánh giá theo ngưỡng Đợt 2:**
  - `play/w1`: **0 CHẶN**, **1–2 NẶNG/màn** (≤ 2 NẶNG/màn).
  - `play/w2`: **0 CHẶN**, **1 NẶNG/màn** (≤ 2 NẶNG/màn).
  - `portfolio`: **0 CHẶN**, **0 NẶNG kỹ thuật/layout** (`0 D3, 0 D4, 0 D5, 0 D7, 0 D10`; chỉ còn `M1..M5` mật độ hình/mascot màn khung thuộc Đợt 3 `T3-A`/`T3-C`).
  - Toàn bộ yêu cầu P0/P1 của T2-C (`W1-01..08`, `W2-01..04,06..08`, `G-01..04`, `PP-03`, `PP-11`, `PP-16`/`SR-89`, `TU-02`, `X5/X6`, `§4.5` ≤ 6 thao tác) đều đã hoàn thành, có unit test (79/79) + E2E (`e2e/m4.spec.ts` 2/2, 3 thao tác chấm) chứng minh, `TASK2_CLAUDE_RESPONSE` trong `dist` = **0**, và **0** vi phạm chống gian lận.
- **Khuyến nghị ghi `HANDOFF.md` / sửa nhẹ ở Đợt 3–4:**
  1. Khi `T3-A` thêm token `--color-on-accent` (chữ tối trên nền cam `--color-writing`) vào `src/design/tokens.css`, hoặc đổi nút tab/chip active ở `W1EssayLab.tsx:1176,1190,1230,1244,1260,1274` sang nền `var(--color-surface-2)` + viền/chữ `var(--color-writing)`, 2 node `color-contrast` vượt nợ ở `play-w1/light` sẽ tự động về ≤ 123 (Lỗi #1).
  2. Bọc `appearance-none` + icon `ChevronDown` cho `<select>` lọc chủ đề ở `W1EssayLab.tsx:1284` và `<select>` điểm thật ở `PortfolioScreen.tsx:727` để đóng hoàn toàn mã `D10` (Lỗi #2).
