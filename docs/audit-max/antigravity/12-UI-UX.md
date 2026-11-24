# 12 · UI/UX (ưu tiên số 3: sau dữ liệu và phương pháp học)

> Nguồn chi tiết: `docs/audit-max/02-UI-UX.md` (U1–U19, bảng màu đã đo, thang chữ, bố cục), `05-FLOW.md` (F1–F18), `docs/08-DESIGN-SYSTEM.md`. Luật: `LUAT.md` D, M, B5; `04-LUAT-CUNG.md` SR-40..43, SR-46.
> **Thiết bị**: iPhone là ưu tiên 1; iPad và laptop là ưu tiên 2 (`02-KE-HOACH.md` §0).
> **Giữ công đã làm**: màn và game hiện có được **cải thiện tại chỗ**, không viết lại từ đầu, không bỏ chức năng (`04-LUAT-CUNG.md` SR-90).

## 0. Tóm tắt 10 dòng
1. Thiết kế **iPhone 390 trước**, kiểm 375 (SE) và 430 (Pro Max); rồi iPad dọc/ngang; rồi laptop 1280/1366.
2. Hướng **Focus Arcade**: viền là game, vùng chữ học sạch (không động, không hình, không nhân vật).
3. Một bộ token: màu, chữ, khoảng cách, bo góc, bóng, thời gian. Không giá trị cứng.
4. Mỗi màn đúng 1 nút chính; nút chính ở vùng ngón cái (đáy) trên iPhone.
5. Màn chơi: câu hỏi `top` ≤ 80 px, 2 đáp án đầu trong màn đầu ở 375×667 và 390×844.
6. Màn khung giàu hình: hero ≥ 15%, Lexi đúng trạng thái, ≥ 6 icon màu khác nhau, không hộp chỉ chữ, 1 vật sống.
7. Chữ ≥ 12 px, nội dung học 17–18 px, AA ở 2 theme, chơi hết bằng bàn phím, vùng chạm ≥ 44 px.
8. Mọi trạng thái được thiết kế: idle, hover, active, focus, disabled, loading, rỗng, lỗi, offline, đúng, sai.
9. Lời trên UI là lời người học: "Ôn 20 thẻ đến hạn", "Band ≈ 6.5". Không có thuật ngữ nội bộ.
10. Safari iOS: safe-area, `100dvh`, bàn phím ảo, không zoom khi focus ô nhập (font ô nhập ≥ 16 px).

## 1. Khung thiết kế theo thiết bị

| Khung | Shell | Màn chơi | Bài đọc (R1, R2, X1) | Màn khung |
|---|---|---|---|---|
| **iPhone 375–430** (ưu tiên 1) | header 56 px + tab đáy 64 px + `env(safe-area-inset-bottom)` | thẻ câu bắt đầu ≤ 72 px; nút chính dính đáy 56 px trên safe-area; HUD 1 dòng (tiến độ 8 px · combo · XP · thoát) | tab "Bài đọc / Câu hỏi"; nút tab cố định | 1 cột; hero full-bleed; Lexi 72–120 px |
| **iPad dọc 768–834** (ưu tiên 2) | tab đáy; nội dung `max-w-[720px]` giữa | thẻ câu `max-w-[640px]`; HUD 1 dòng | tab (dưới 900 px) | 2 cột cho thẻ (Hub 2–3 cột) |
| **iPad ngang 1024–1180** (ưu tiên 2) | sidebar 240 px | thẻ câu `max-w-[720px]`; RunMap cột phải | 2 cột 55/45 | lưới 3 cột |
| **Laptop 1280–1440** (ưu tiên 2) | sidebar 240 px; nội dung `max-w-[1200px]` | như iPad ngang; `KeyHint` hiện | 2 cột 55/45 | lưới 3–4 cột |
| **Laptop thấp 1366×768** | như trên | ca khó: câu hỏi + 2 đáp án vẫn trong màn đầu → HUD gọn, khoảng cách theo `clamp()` | 2 cột, cột câu hỏi cuộn riêng | hero thấp hơn (≥ 15% vẫn đúng) |

Điểm gãy (breakpoint) Tailwind: dùng `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Dùng **container query** cho thẻ khi được, để một thẻ đúng ở mọi lưới.

## 2. Token (T3-A sở hữu `src/design/tokens.css`)
- **Màu**: theme tối (vá 3 token) + theme sáng đầy đủ theo `02` §3. Thêm `--color-on-accent`, `--color-border-strong`, `--color-text-faint` đã đo. Đo lại bằng `scripts/qa/contrast.mjs` (tính cả viền, không giấu).
- **Chữ**: thang `--text-display/h1/h2/question/reading/body/caption` (`02` §4). Ô nhập ≥ 16 px trên iOS để Safari **không tự zoom**.
- **Khoảng cách**: thang 4 px (4, 8, 12, 16, 24, 32, 48, 64). Khoảng cách dọc chính dùng `clamp()` để vừa 375×667 và 1366×768.
- **Bo góc**: 8 (nhỏ), 14 (thẻ), 22 (thẻ lớn/sheet), 999 (pill).
- **Bóng/độ sâu**: 3 mức, làm bằng lớp riêng animate `transform` (không animate `box-shadow`).
- **Thời gian/easing**: xem `13-ANIMATION.md` §2. UI dùng token, không số rời.
- **Z-index**: thang cố định (nội dung 0, HUD 10, fx canvas 20, sheet 30, modal 40, toast 50).

## 3. Màn chơi (vùng học)
- Thứ tự từ trên xuống: (HUD gọn) → **câu hỏi** → đáp án/ô nhập → nút chính (dính đáy trên iPhone).
- Ở 375×667 (iPhone SE) phải đạt B5. Nếu không vừa: thu HUD, giảm khoảng cách theo `clamp()`, chuyển giải thích dài sang sheet. **Không** giảm chữ dưới ngưỡng D4.
- Bàn phím ảo iOS: khi focus ô gõ, cuộn ô vào giữa vùng còn thấy (`visualViewport`), nút "Kiểm tra" nằm ngay trên bàn phím. Không để nút chính bị bàn phím che.
- Bài đọc: Source Serif 18/1.7 (17 trên iPhone), ≤ 68 ký tự mỗi dòng, không có gì động phía sau.
- FeedbackPanel (câu sai): đáp án + lý do + bằng chứng + "lần sau để ý" (`09` PP-03); mở dạng sheet từ đáy trên iPhone, panel bên phải trên laptop.

## 4. Màn khung (Hôm nay, Hub, Thống kê, Thư viện, Portfolio, Onboarding, Recap, empty/error)
- Luật M1–M7 + D11 (`LUAT.md`), bảng theo màn ở `02` §6b.
- **Hôm nay**:
  - việc tiếp theo ở đầu, Enter là bắt đầu (F12, U6);
  - 3 thẻ nhiệm vụ như lá bài lệch nhau;
  - vòng mục tiêu ngày; lửa streak;
  - Lexi `co-vu` có câu nói kèm số thật.
- **Hub**:
  - bộ sưu tập thẻ game 12 icon riêng;
  - game "Sắp có" xếp cuối;
  - không còn dãy 12 nút "Mở" giống nhau (D6).
- **Recap** (T3-A):
  - đếm số kiểu Balatro;
  - "Tiếp" đi tới việc kế tiếp (`nextTask`);
  - Lexi đúng trạng thái theo kết quả.
- **Empty / lỗi / offline**:
  - minh họa + Lexi `ngu`/`suy-nghi` + 1 hành động rõ;
  - mã lỗi ngắn + "Thử lại" + "Về Hôm nay" (X10, X11).

## 5. Trạng thái bắt buộc cho mọi thành phần tương tác (kiểm ở `#/dev/components`, cổng G2)
`idle · hover (chỉ con trỏ) · active/pressed · focus-visible (vòng 2 px tương phản ≥ 3:1) · disabled (không chỉ đổi mờ, có lý do nếu cần) · loading (skeleton đúng hình, không spinner giữa trang) · correct · wrong · partial · empty · error · offline`.
iPhone không có hover: mọi thông tin chỉ hiện khi hover phải có cách khác để thấy (nhấn giữ, nút "?").

## 6. Truy cập (a11y)
- axe-core 0 serious/critical ở 2 theme trên Hôm nay, Hub, Cài đặt, V1, R1, W1, cộng mọi màn task đụng.
- Chơi hết bằng bàn phím trên laptop/iPad có bàn phím: Tab, Enter, Space, phím số 1–4 chọn đáp án, Esc mở hộp thoát. Mỗi phím tắt có `KeyHint`.
- VoiceOver iOS: nút có nhãn; kết quả đúng/sai đọc qua `aria-live="polite"`; không giấu chữ bằng `aria-hidden` để qua công cụ (SR-12).
- Không truyền tải thông tin chỉ bằng màu: đúng/sai có thêm icon ✓/✕ và chữ.
- Chữ phóng to 200% (Dynamic Type/zoom trình duyệt): bố cục không vỡ, không chữ bị cắt.

## 7. Giọng văn (copy)
- Tiếng Việt tự nhiên, ngắn, xưng "bạn". Lexi nói ≤ 12 từ, có số thật, không khen rỗng, không chê.
- Cấm chữ nội bộ: "Mốc M1", "Level 1 · Training", "FSRS", "Node", "INV-", "Δ band", "gói copy/dán" (D7). `scripts/qa/internal-jargon.mjs` phải 0.
- Số: định dạng Việt (`1.234`, `6,5` hay `6.5`: chọn **một**, ghi `DECISIONS.md`; band IELTS quen viết `6.5` → giữ dấu chấm cho band, dấu phẩy cho số thập phân khác).

## 8. Giữ công đã làm
- Màn và game hiện có (V1, V2, V3, R1, R2, L1, L2, W1, W2) **giữ cơ chế và chức năng**. Cải thiện bố cục, token, thành phần, trạng thái tại chỗ.
- Viết lại một màn từ đầu chỉ khi AD đồng ý **và** KE-HOACH liệt kê đủ chức năng cũ để reviewer bấm thử (Q6).
- Game mới (S1, S2, X1, Bùa) làm **sau** khi game cũ đạt ngưỡng (`02-KE-HOACH.md`).

## 9. Kiểm (builder chạy trước khi báo xong)
```bash
node docs/audit-max/cong-cu/audit-ui.mjs --route <routes> --vp 390x844,375x667,820x1180,1280x800 --theme dark,light --out docs/audit-max/anh-sau/<task>
# reviewer thêm: --vp 430x932,1180x820,1366x768
PW_PORT=<pw> PW_CHANNEL=chrome npx playwright test e2e/a11y.spec.ts
node scripts/qa/tap-targets.mjs ; node scripts/qa/contrast.mjs ; node scripts/qa/hardcoded-colors.mjs ; node scripts/qa/internal-jargon.mjs
```
Mở xem **mọi** ảnh `-loi.png` của iPhone 390 và 375 bằng mắt. Chụp ảnh sau tương tác: trả lời đúng + sai, mở sheet giải thích, mở bàn phím ảo (focus ô gõ) ở 390, cuộn cuối, vào Recap.
