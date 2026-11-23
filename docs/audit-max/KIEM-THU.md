# KIỂM THỬ & NGHIỆM THU · audit-max

> Hai lớp: **(1) kiểm tự động** – 0 lỗi CHẶN mới được chấm rubric; **(2) rubric 10 tiêu chí** – 2 reviewer độc lập, khác model, **chấm mù** so với ảnh gốc, lấy điểm **thấp hơn** (`07-QUY-TRINH-KIEM-CHEO.md`).
> Công cụ của AD (không ai khác được sửa, `LUAT.md` Q4): `docs/audit-max/cong-cu/audit-ui.mjs` (đo + chụp + khoanh lỗi), `docs/audit-max/cong-cu/tron-anh.mjs` (trộn ảnh chấm mù). Script `scripts/qa/**` do task T1-C viết bổ sung phần công cụ chưa đo.
> Số "hiện tại" đo ngày 23/11/2026 trên bản `29ecf64`.

## 1. Chuẩn bị môi trường
```
cd D:\English
npm ci
npx playwright install chromium
npx vite --port 5199 --strictPort          # cửa sổ riêng
```
Profile sạch: mỗi lượt đo mở context Playwright mới (IndexedDB trống). Lượt "có dữ liệu" seed bằng `e2e/fixtures/seed-profile.ts` (T1-A viết).

## 2. Kiểm tự động (cổng cứng)

### 2.1 Số đo nền (mốc để so, giống "3 846 lỗi CHẶN của v4" bên date-planner)
`node docs/audit-max/cong-cu/audit-ui.mjs --vp 390x844,820x1180,1280x800 --theme dark,light --fmt jpg` trên 20 route × 3 khung × 2 theme (**120 lượt**):

| | Giá trị nền 23/11 | Ngưỡng ĐẠT |
|---|---|---|
| Tổng lỗi | **326 CHẶN · 1 258 NẶNG** | **0 CHẶN**, ≤ 2 NẶNG mỗi màn |
| Theo mã | D3 vùng chạm 758 · D4 chữ < 12 px 324 · D7 thuật ngữ nội bộ 142 · M5 hộp chỉ chữ 134 · J9 màn chơi đứng yên 72 · D10 control gốc 44 · M1 không hình lớn 36 · M2 thiếu icon màu 36 · M4 không chuyển động 36 · D5 tràn ngang 2 | 0 mỗi mã CHẶN; NẶNG theo ngưỡng trên |
| 6 màn khung ở 390 tối | **6/6 không có hình lớn**, icon màu 0–1/màn (cần ≥ 6), icon nét đơn sắc 9–16/màn, 6/6 không có gì chuyển động | M1, M2, M4 = 0 |
| 12 màn chơi | **12/12 đứng yên hoàn toàn** khi chờ người chơi | J9 = 0 |
| Bổ sung sau đo nền | Luật **M3** (nhân vật ở màn khung) thêm sau lượt đo: hiện 0 nhân vật → thêm **36 lỗi NẶNG** (6 màn khung × 6 khung/theme). Tổng nền tính lại: **326 CHẶN · 1 294 NẶNG** | M3 = 0; J10 = 0 |
| Bằng chứng | `anh-goc/` (100 ảnh jpg) · `anh-goc-loi/` (ảnh khoanh lỗi 390 + 1280 tối, `report.json`, `BAO-CAO.md`) | |

### 2.2 Bảng kiểm

| # | Kiểm | Lệnh | Hiện tại | Ngưỡng ĐẠT |
|---|---|---|---|---|
| 1 | Kiểu | `npx tsc --noEmit -p .` | 0 lỗi | 0 lỗi (sau khi bật `noUnusedLocals`, X18) |
| 2 | Unit | `npm test` | 377/377, 23 s | 100% pass, ≤ 12 s; test mới cho mọi lỗi P0/P1 đã sửa |
| 3 | Dữ liệu (dev) | `npm run validate:data` | PASS (xanh giả) | PASS |
| 4 | Dữ liệu (phát hành) | `npm run validate:data:release` | **2 835 lỗi** | 0 lỗi |
| 5 | Giao diện định lượng | `node docs/audit-max/cong-cu/audit-ui.mjs --route <route> --vp 390x844,820x1180,1280x800` (đo D3, D4, D5, D7, D10, M1, M2, M3, M4, M5, M7, J9, J10, Q5, lỗi JS) | §2.1 | 0 CHẶN, ≤ 2 NẶNG mỗi màn |
| 6 | Màu cứng | `node scripts/qa/hardcoded-colors.mjs` (grep `#[0-9a-fA-F]{3,8}\b` và `rgb(` trong `src/**` trừ `legacy`, `tokens.css`, dữ liệu ChartRenderer) | 13 chỗ / 5 file | 0 |
| 7 | Câu hỏi trong màn đầu (390×844) | `scripts/qa/fold.mjs`: `top` câu hỏi ≤ 80 px; đáp án 2 `bottom` ≤ 844 | V1: thẻ câu bắt đầu y≈370, giải thích sai nằm ngoài màn | đạt ở V1, V2, V3, R1 (tab Câu hỏi), L2 |
| 8 | Tương phản + a11y | `npx playwright test e2e/a11y.spec.ts` (axe, theme tối + sáng; Hôm nay, Hub, Cài đặt, V1, R1, W1) | chưa có; theme sáng nút 2,0–3,5:1 | 0 vi phạm serious/critical |
| 9 | Juice ≥ 3 kênh | `npx playwright test e2e/juice.spec.ts`: mỗi dòng bảng `03` §3, thao tác rồi trong 600 ms kiểm (a) có `transform`/`opacity` đang animate, (b) spy `sfxEngine.play` đúng cue, (c) spy `fx.emit`/`numberPop`/`celebrate` | phần lớn 1–2 kênh | 22/22 dòng ≥ 3 kênh (dòng áp dụng) |
| 10 | Reduced motion | `npx playwright test e2e/motion.spec.ts` + `audit-ui.mjs --reduced 1` (J8) | chưa có | 0 `transform` khác `none` sau 200 ms ở Hôm nay, V1, R1; 0 animation lặp vô hạn; 0 lần `fx.emit` |
| 11 | Bundle | `npx vite build` + `node scripts/qa/size-budget.mjs` | entry 343 KB gzip, CSS 251 KB | JS ở `#/` ≤ 250 KB gzip; CSS ≤ 130 KB; mỗi game ≤ 120 KB gzip; precache ≤ 1 500 KiB |
| 12 | Không rò dev/test vào prod | `grep -l "Thư viện component\|v1_fixtures\|r1_fixtures\|TASK2_CLAUDE_RESPONSE\|pixelated" dist/assets/*` | có cả 5 | rỗng |
| 13 | Hiệu năng | `npx playwright test e2e/perf.spec.ts` trên `vite preview` (CDP: CPU ×4, Fast 4G) | chưa đo | LCP Hôm nay ≤ 2,5 s; INP chọn đáp án ≤ 200 ms; 30 s V1: 0 frame > 32 ms |
| 14 | Offline | `npx playwright test e2e/offline.spec.ts`: mở V1 1 lần → `setOffline(true)` → reload → chơi 3 thẻ | không chạy được | chơi được |
| 15 | Vòng lặp ngày (bàn phím) | `npx playwright test e2e/daily-loop.spec.ts` (`05` §5 mục 1) | không có | pass |
| 16 | Lưu giữa phiên | `npx playwright test e2e/v1-srs.spec.ts e2e/shell-flow.spec.ts` + test W1 autosave | mất dữ liệu | pass |
| 17 | Console sạch | mọi spec E2E gắn listener `console`/`pageerror`; `audit-ui.mjs` mã JS | 0 lúc đo tĩnh | 0 `console.error`, 0 unhandled rejection |
| 18 | Asset có nguồn | `node scripts/validate/assets_credits.mjs` (mở rộng: 8 trường + `kich_thuoc_goc` + `so_mau`, sha256 khớp, quét `public/*.png`) | 95/95 nhưng sai 6 dòng, thiếu `url_tai` thật | 100% |
| 19 | Bản quyền nội dung | `grep -ril "cambridge ielts\|official ielts" public/data` | 1 file | 0 |
| 20 | Production sống | `curl -s https://<user>.github.io/lexicon-arcade/ \| grep -o "<title>[^<]*"` + `git rev-list --left-right --count origin/master...master` | title "IOE ARENA…"; lệch 0/49 | title V3; `0 0` |
| 21 | CI chặn lỗi | mở PR thử có 1 test đỏ | CI không chạy test | check đỏ, không deploy |
| 22 | Không sửa công cụ/luật | `git diff --stat master... -- docs/audit-max/cong-cu docs/audit-max/LUAT.md docs/audit-max/KIEM-THU.md` (trong nhánh task) | – | rỗng (trừ commit của AD) |
| 23 | Không lách công cụ | `audit-ui.mjs` mã Q5 + reviewer soi (`07` §5) | – | 0 |
| 24 | Chức năng giữ nguyên | reviewer bấm từng mục trong `KE-HOACH-<task>.md` | – | 100% còn |
| 25 | Ảnh nộp đủ | `07` §7: 5 khung/theme + sau tương tác + video | – | đủ |

**Quy tắc:** một dòng không đạt = task chưa Done. Báo cáo dán số đo thật (không viết "đạt" suông).

## 3. Rubric (10 tiêu chí, có trọng số và mốc mô tả)

### 3.1 Bảng chấm
Mỗi tiêu chí 1–10. **Phải dùng mốc mô tả**, mỗi điểm có 1 câu lý do dẫn tên ảnh. Mỗi lỗi NẶNG chưa sửa trừ 0,5 vào tiêu chí tương ứng. Còn lỗi CHẶN thì không chấm.

| # | Tiêu chí | Trọng số | 4 điểm trông như | 7 điểm trông như | 10 điểm trông như | Hiện tại (ước) |
|---|---|---|---|---|---|---|
| R1 | **Sư phạm** | 15% | Câu sai chỉ có ✕; thẻ ôn hiện sai item; lộ đáp án | Có đáp án + lý do, thiếu bằng chứng ở vài game | Mọi câu sai: đáp án + lý do + bằng chứng bấm được; SRS đúng item; ≥ 70% lượt là gợi nhớ/sản xuất | 5 |
| R2 | **Cảm giác game** | 15% | Dashboard web tối, thẻ giống hệt nhau | Rõ là app học dạng game nhưng còn vài khối như web | Đặt cạnh ảnh Duolingo/Balatro không lạc quẻ: thẻ sống, chiều sâu, nghi thức thưởng, chuyển cảnh | 3 |
| R3 | **Juice** | 10% | Gần như tĩnh, 1–2 kênh | Có motion + âm, thiếu hạt/số bay hoặc thiếu ở vài game | Mọi tương tác ≥ 3 kênh ≤ 100 ms, cao độ theo combo, Recap đếm kiểu Balatro; im lặng đúng lúc khi nghe/viết | 4 |
| R4 | **Mật độ & chất lượng hình + nhân vật (màn khung)** | 10% | Icon nét đơn sắc, không minh họa, hộp chỉ chữ | Có icon màu và minh họa nhưng vài chỗ trống hoặc lẫn kiểu | Mỗi màn khung có hero + Lexi đúng trạng thái, có hồn + ≥ 6 icon màu đúng nghĩa, sắc, cùng một bộ | 2 |
| R5 | **Thứ bậc & bố cục** | 10% | HUD che nửa màn, nhiều nút cùng cỡ, thuật ngữ nội bộ | Rõ nhưng còn rườm ở vài màn | 1 chủ thể, 1 nút chính, câu hỏi trong màn đầu ở 390, điều hướng như game | 4 |
| R6 | **Đọc & truy cập** | 10% | Chữ 10–11 px, theme sáng không đọc được | AA ở theme tối, còn lỗi ở theme sáng/bàn phím | Chữ ≥ ngưỡng D4, AA 2 theme, chơi hết bằng bàn phím, reduced-motion đủ | 5 |
| R7 | **Độ khó thích ứng** | 10% | Level cố định, item lặp | Có thích ứng ở vài game | Mọi game đổi bậc theo 20 lượt, hiện band, đủ nội dung band 4–9 | 3 |
| R8 | **Thưởng & tiến bộ** | 5% | XP lạm phát hoặc số giả, không level/huy hiệu | Có XP, combo, thiếu level/huy hiệu/bộ sưu tập | XP công bằng có trần, level, huy hiệu, sổ Mastered, band tăng thấy được | 4 |
| R9 | **Vòng lặp hằng ngày** | 10% | Không biết làm gì tiếp, mất tiến độ, streak sai giờ | Có việc tiếp theo nhưng vòng bị đứt ở Recap | Mở app → Enter → học → Recap → "Tiếp" → xong ngày có ăn mừng; streak giờ VN; không mất tiến độ | 3 |
| R10 | **Nhất quán & độ tin cậy** | 5% | 3 phong cách trộn; production lỗi thời; audio thiếu | 1–2 chỗ lạc; audio đủ ở phần lớn | Một bộ token/icon/âm; §2 đạt 25/25; production cập nhật; offline chạy | 3 |

**Tổng có trọng số hiện tại ≈ 3,7.**

**Ngưỡng ĐẠT** (lấy điểm thấp hơn của 2 reviewer cho từng tiêu chí):
- Mỗi màn được đụng: tổng có trọng số ≥ **8,5**, **không tiêu chí nào < 7**.
- Màn mẫu cổng G3 (Hôm nay, Hub, V1, Recap V1): ≥ **9,0**.
- Toàn sản phẩm (G4): trung bình ≥ **8,7**, §2 đạt 25/25.
- **Hơn ảnh gốc ≥ 3 điểm** trung bình khi chấm mù (§3.2) với mọi màn có đổi giao diện – dù điểm tuyệt đối cao vẫn trượt nếu không hơn đủ.

### 3.2 Chấm mù (reviewer làm **ĐẦU TIÊN**, trước khi xem bất kỳ ảnh mới nào)
1. Ảnh gốc ở `docs/audit-max/anh-goc/` (chụp 23/11/2026, jpg, tên `<khung>-<theme>-<route>.jpg`, **không kèm khoanh lỗi**). Bộ này là mốc cố định; không chụp lại.
2. Reviewer chụp bản mới **cùng định dạng**: `audit-ui.mjs --route <…> --vp 390x844,1280x800 --theme dark,light --fmt jpg --no-loi 1 --out out/review-<task>-<X>`, **chưa mở ảnh**.
3. `node docs/audit-max/cong-cu/tron-anh.mjs docs/audit-max/anh-goc out/review-<task>-<X> out/cham-mu-<task>-<X>` → ảnh `shuffle-NNN.jpg` + `PHIEU-CHAM.md` + `key.json`.
4. Chấm R2, R4, R5, R6 (các tiêu chí nhìn được trên ảnh) cho từng ảnh trộn vào `PHIEU-CHAM.md`, **rồi** mới mở `key.json`. Ghi chênh lệch mới − gốc theo từng màn vào REVIEW §0.

### 3.3 Rubric con từng game (đợt 2 và 4)
Chấm 6 cột như `01-GAME.md` §1 (Cơ chế, Độ vui, Sư phạm, Độ khó, Thưởng, Juice). Ngưỡng: Cơ chế ≥ 8, Độ vui ≥ 8, Sư phạm ≥ 9, Độ khó ≥ 8, Thưởng ≥ 8, Juice ≥ 9. Game chưa có (S1, S2, X1) không chấm trong audit-max.

## 4. Checklist soi ảnh (mỗi route × 390 và 1280, đánh dấu trong REVIEW)
- [ ] Không tràn ngang, không chữ bị cắt `…` trong vùng nội dung học
- [ ] Đúng 1 nút primary; không dãy ≥ 3 nút giống hệt
- [ ] Ở màn chơi: câu hỏi + 2 đáp án đầu trong màn đầu (390)
- [ ] Không thuật ngữ nội bộ (Mốc, Level 1 · Training, Node, FSRS, Δ)
- [ ] Màn khung: có Lexi 72–160 px đúng trạng thái, không đè chữ; có hero ≥ 15%, ≥ 6 icon màu khác nhau, không hộp chỉ chữ
- [ ] Có ít nhất 1 thứ đang sống ngoài vùng chữ (trừ exam/reduced-motion)
- [ ] Không có hiệu ứng chuyển động sau/trên vùng chữ học (`LUAT.md` J3); hạt/confetti không che chữ hay nút
- [ ] Theme sáng đọc được
- [ ] Streak/XP ở shell khớp Hôm nay
- [ ] Ảnh **sau tương tác** (trả lời đúng + sai, mở modal, cuộn cuối, Recap) cũng đạt các mục trên

## 5. Kiểm thử học tập (sau 4 tuần dùng thật – giữ từ `docs/13` §4)
- Tỷ lệ nhớ lượt đầu V1 ≥ 85% (< 80% → giảm thẻ mới/ngày).
- Band ước lượng L/R tăng hoặc giữ; ghi `PROGRESS.md` mục "Hiệu quả học".
- Số ngày bỏ trong 28 ngày ≤ 4; nếu nhiều hơn → xem lại độ dài phiên và mốc "giữ chuỗi".

## 6. Báo cáo
- Mỗi task: `docs/audit-max/KE-HOACH-<task>.md`, `BAO-CAO-<task>.md` (builder, không điểm), `REVIEW-<task>-A.md`, `REVIEW-<task>-B.md` (reviewer), ảnh ở `docs/audit-max/anh-sau/<task>/`.
- Mỗi đợt: AD thêm 1 mục vào `docs/audit-max/BAO-CAO.md`: task đã xong (mã, commit, nhánh) · bảng §2 các dòng liên quan "trước / sau" · tổng `audit-ui.mjs` so với §2.1 · rubric (điểm thấp hơn của 2 reviewer, tên model) · asset mới (rút gọn CREDITS) · việc còn thiếu · tranh chấp đã quyết.
