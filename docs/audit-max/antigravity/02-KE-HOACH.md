# 02 · KẾ HOẠCH CÒN LẠI (Đợt 2 → Đợt 4, cộng việc bổ sung)

> Nguồn gốc: `docs/audit-max/TASKS.md` (file độc quyền, việc, Done của từng task). File này **không đổi phạm vi** task. Nó thêm: thứ tự chạy, song song, phụ thuộc, model, mốc, cách xử lý quota, và các bước con cho task lớn.
> Bang yêu cầu **chạy liên tục tới hết Đợt 4**: cổng vẫn phải ĐO và phải ĐẠT, nhưng không chờ Bang bấm duyệt. AD tự quyết theo số đo; trượt thì fixer, không dừng cả dây chuyền.

## 0a. Thứ tự ưu tiên nội dung (Bang, 25/11/2026)

**1 Dữ liệu → 2 Phương pháp học → 3 UI/UX → 4 Tối ưu web → 5 Animation.** Hệ quả cho kế hoạch:
- **T3-B (dữ liệu, audio) chạy liên tục từ bây giờ** như một làn riêng (làn nhẹ), không chờ đợt.
  - Khi có làn nặng rảnh, ưu tiên giao việc dữ liệu (worker dữ liệu `06` §6) trước việc giao diện.
  - Thứ tự việc trong T3-B: `10-DATA.md` §4.
- Việc phương pháp học (`09-PHUONG-PHAP-HOC.md` §3) được **gắn vào task có file tương ứng** và làm **trước** phần giao diện của task đó.
  - Ví dụ: T3-C làm planner bù mạch học (PP-05/06) trước khi làm Hub đẹp.
  - Ví dụ: T4-A làm trộn loại thẻ V1 (PP-05) và quota thẻ mới tự giảm (PP-C4) trước juice.
- Đợt 2 (đúng và công bằng) **là việc sư phạm**, nên giữ ưu tiên cao: hoàn thành Đợt 2 trước khi mở phần giao diện của T3-A.
  - Riêng T3-A bước A1–A2 (token, tải asset) được mở sớm như đã nêu ở §1.
- Đợt 4 (juice): làm theo bậc E0 → E1 → E2 → E3 (`13-ANIMATION.md` §1). Hết thời gian thì dừng ở E1, không cắt việc dữ liệu hay sư phạm.
- **Giữ công đã làm** (`04-LUAT-CUNG.md` §10):
  - cải thiện 9 game đang có trước;
  - Bùa (T4-C) làm sau khi 9 game đạt ngưỡng juice E0–E1;
  - S1, S2, X1 (Đợt 5) làm sau cùng.

## 0. Ưu tiên thiết bị (Bang, 25/11/2026)

| Ưu tiên | Thiết bị | Khung đo bắt buộc (`--vp`) | Ghi chú |
|---|---|---|---|
| **1 (cao nhất)** | **iPhone** (Safari iOS, cầm dọc) | `390x844` (iPhone 13–15), `375x667` (SE, màn nhỏ nhất), `430x932` (Pro Max) | Mọi màn phải **hoàn hảo** ở 390 trước tiên. Lỗi chỉ có ở iPhone vẫn tính đủ mức |
| 2 | **iPad** (dọc + ngang) | `820x1180` (iPad Air dọc), `1180x820` (ngang), `768x1024` (mini dọc) | Không được chỉ là "điện thoại phóng to": dùng bố cục 2 cột khi ≥ 900 px (`12-UI-UX.md` §1) |
| 2 | **Laptop** | `1280x800`, `1366x768` (laptop phổ thông, chiều cao thấp), `1440x900` | Chiều cao 768 là ca khó: câu hỏi + 2 đáp án vẫn phải trong màn đầu |

**Hệ quả với kế hoạch:**
- Mỗi task UI làm **iPhone 390 trước**, chụp và sửa tới 0 CHẶN, rồi mới tới iPad và laptop.
- Bộ khung đo mặc định của builder: `--vp 390x844,375x667,820x1180,1280x800`.
- Bộ khung đo của reviewer: thêm `430x932,1180x820,1366x768`.
- Khi thời gian hoặc quota thiếu, cắt việc ở iPad/laptop trước, **không cắt iPhone**.
- Hành vi riêng Safari iOS (âm thanh, IndexedDB, `100vh`, safe-area, bàn phím ảo) là **việc bắt buộc**, không phải tuỳ chọn: `14-TOI-UU-WEB.md` §9, `15-PRODUCTION-BO-SUNG.md` PB-09 (PWA trên iPhone), PB-10 (kiểm WebKit).

## 1. Bản đồ phụ thuộc

```
ĐỢT 1 (xong, G0 ĐẠT)
   │
   ├── ĐỢT 2 · Đúng và công bằng (đang dở)
   │     T2-A  V2,V3,R1,R2 ─┐
   │     T2-B  L1,L2,chấm ──┼─→ merge từng task khi qua review (không chờ nhau)
   │     T2-C  W1,W2,chấm Claude ┘
   │     + FX-0  fixer nhỏ "listen_spell kiểm audio" (V1) – chen vào ngay, xem §4
   │
   ├── T3-B · Dữ liệu + audio (chạy song song từ bây giờ, độc lập code)
   │
   └── ĐỢT 3 · Hệ thiết kế + juice nền + màn khung
         T3-A  token, asset, fx/, LiveCard, Mascot, Recap ──→ cổng G1 (contact sheet) giữa task
         │                                                └─→ cổng G2 (#/dev/components) cuối task
         T3-C  Hub, Hôm nay, Thống kê, Cài đặt (phần dữ liệu/logic trước; gắn hiệu ứng SAU khi T3-A merge fx/ + LiveCard)
         │
         └── ĐỢT 4 · Juice + vui thật
               Ngày 1: T4-A chỉ V1 (+Recap V1) ──→ cổng G3 (Hôm nay, Hub, V1, Recap ≥ 9,0)
               └── T4-A V2–R2 · T4-B L1,L2 · T4-C W1,W2 ──→ 9 game đạt E0–E1
                     └── T4-C Bùa (API useCharms() → gắn 9 game) ──→ cổng G4
                           (giữ công đã làm: cải thiện game cũ trước, hệ mới sau – SR-92)
```

**Đường găng** (chuỗi dài nhất quyết định ngày xong): T3-A (asset + fx + Mascot) → G2 → T4-A V1 → G3 → T4-A V2–R2 → G4.
→ **T3-A phải được mở sớm nhất có thể.** Ngay khi Đợt 2 còn ≤ 1 làn đang chạy, mở T3-A bước 1–2 (token + tải asset). Lý do an toàn: file độc quyền của T3-A (`src/design/**`, `public/assets/**`, `scripts/assets/**`, `src/app/providers/**`) **không chồng** với T2-A/B/C, trừ 4 component sau:
- `src/design/components/Highlighter.tsx` (T2-A)
- `TrackPlayer.tsx`, `Waveform.tsx`, `MapView.tsx`, `AnswerInput.tsx` (T2-B)

Vì vậy T3-A **không được đụng 5 file đó** cho tới khi T2-A, T2-B đã merge. Ghi điều này vào brief của T3-A.

## 2. Thứ tự chạy cụ thể (máy 16 GB RAM: tối đa **2 làn nặng** + 1 làn nhẹ)

"Làn nặng" là làn chạy vite + Playwright + audit-ui. "Làn nhẹ" là việc dữ liệu chạy script hoặc render qua mạng (T3-B). Reviewer tính là nửa làn nặng.

| Bước | Làn nặng 1 | Làn nặng 2 | Làn nhẹ | Điều kiện sang bước sau |
|---|---|---|---|---|
| S1 | **T2-A** nối lại (`06` prompt "nối lại việc dở") | **T2-B** nối lại | **T3-B** nối lại | – |
| S2 | khi T2-A hoặc T2-B xong → **review** task đó | **T2-C** bắt đầu | T3-B | review ĐẠT → merge ngay |
| S3 | **FX-0** (listen_spell, nhỏ, < 1 giờ) | task Đợt 2 còn lại / fixer | T3-B | – |
| S4 | **T3-A bước 1–2** (token, theme sáng, tải asset, contact sheet G1); **cấm** đụng 5 component đang thuộc T2-A/B | review / fixer T2-* | T3-B | Đợt 2 merge hết |
| S5 | **T3-A bước 3–5** (fx, Mascot, LiveCard, Recap, Button/Modal…) | **T3-C** phần dữ liệu/logic | T3-B | T3-A merge **sớm** phần `fx/` + `LiveCard` + `Mascot` (merge giữa task được phép, xem `03-CAC-BUOC.md` §7.4) |
| S6 | review 2 người T3-A (G2) | T3-C gắn hiệu ứng | T3-B kết thúc → review | G2 ĐẠT, T3-C ĐẠT, `validate:data:release` exit 0 |
| S7 | **T4-A chỉ V1 + Recap V1** | việc dữ liệu/sư phạm còn lại (T3-B, PP gắn vào V1) | – | G3: Hôm nay, Hub, V1, Recap V1 ≥ 9,0 từ 2 reviewer, hơn ảnh gốc ≥ 3 |
| S8 | **T4-A** V2→V3→R1→R2 | **T4-B** L1, L2 | T4-C W1, W2 (juice); **Bùa chỉ sau khi 9 game đạt E0–E1** (SR-92) | – |
| S9 | review 2 người từng task | fixer | – | **G4**: mọi màn ≥ 8,5 (không tiêu chí < 7), toàn sản phẩm ≥ 8,7, `KIEM-THU` §2 25/25 |
| S10 | **Đợt bổ sung PB** (`15-PRODUCTION-BO-SUNG.md`): các việc P0/P1 chưa gắn được vào task nào | | | Báo cáo cuối cho Bang |

**Nếu G3 trượt:** dừng T4-A V2–R2, T4-B, T4-C phần juice. Quay lại sửa bộ thành phần T3-A (fixer T3-A) theo lỗi của review G3, đo lại G3. Đúng luật cổng ở `07` §2.

## 3. Model theo task (tóm tắt; chi tiết và lý do ở `05-DO-KHO-TASK.md`)

Tầng model trong Antigravity (kiểm lại tên đúng trong danh sách model hiện có trước khi giao):
- **Mạnh**: Claude Opus 5.5 · Gemini 4 Argon (High).
- **Vừa**: Claude Sonnet 5.5 · Gemini 4 Neon · Gemini 4 Argon (Medium).
- **Rẻ**: dòng Flash.

| Task | Builder | Reviewer A | Reviewer B (đợt 3–4) |
|---|---|---|---|
| T2-A, T2-B, T2-C | Vừa (high effort) | Mạnh, **khác hãng** builder nếu được | – |
| FX-0 | Vừa | Mạnh (soi diff + test là đủ) | – |
| T3-A | **Mạnh** (thiết kế hệ thống, ảnh hưởng mọi màn) | Mạnh khác hãng | Vừa khác hãng với A |
| T3-B | Vừa; phần blind-solve và soi mẫu **phải khác model sinh** (C4) | Mạnh | – (dữ liệu: 1 reviewer + soi mẫu) |
| T3-C | Vừa | Mạnh | Vừa khác hãng |
| T4-A V1 (G3) | **Mạnh** | Mạnh khác hãng | Mạnh khác hãng với A |
| T4-A V2–R2, T4-B, T4-C | Vừa (high) | Mạnh | Vừa khác hãng |
| Script, đo, chụp ảnh, dọn dẹp | Rẻ | – | – |

**Luật quota:**
- Bể của một hãng còn < 25% thì chỉ chạy 1 worker hãng đó. Còn < 10% thì dừng ở cổng gần nhất, ghi `01-TRANG-THAI.md` §6, chuyển việc sang hãng còn lại (vẫn giữ luật reviewer khác model với builder).
- Lúc bàn giao, bể Claude trong Antigravity báo 0% tới 27/11. Vì vậy Gemini làm builder, còn reviewer chọn Gemini khác dòng hoặc chờ Claude.

## 4. Việc chen thêm (không có trong TASKS.md, AD đã quyết)

| Mã | Việc | Lý do | File được sửa | Khi nào |
|---|---|---|---|---|
| **FX-0** | `listen_spell` trong V1: bỏ node khi từ không có MP3 thật (giống cách đã sửa `ltrap_replay`, `dict_full`) + test | Chấm FSRS khi người học không nghe được gì = vi phạm B2/B3 (CHẶN) | `src/games/v1-daily-run/**` (không task Đợt 2 nào sở hữu) | Bước S3. Ghi 1 dòng `DECISIONS.md` |
| **FX-1** | Chip `↵` 11 px → ≥ 12 px trong `AnswerInput` | D4 CHẶN | Thuộc T2-B: **thêm vào brief T2-B** | Trong T2-B |
| **PB-*** | Việc production bổ sung | `15-PRODUCTION-BO-SUNG.md` | Gắn vào task có file tương ứng; không gắn được → đợt PB cuối | Theo bảng ở file 15 |

## 5. Mốc và ước lượng (máy hiện tại, 2 làn nặng)

| Mốc | Gồm | Ước lượng thời gian máy |
|---|---|---|
| M-Đ2 | T2-A, T2-B, T2-C merge + FX-0 | 1,5–2,5 ngày |
| M-G1 | Contact sheet asset duyệt (AD tự duyệt theo checklist `11-ASSET.md` §8) | +0,5–1 ngày sau khi mở T3-A |
| M-G2 | `#/dev/components` đủ thành phần × trạng thái × 2 theme × 4 khung | +2 ngày |
| M-Đ3 | T3-A, T3-B, T3-C merge; `validate:data:release` exit 0; bật `RELEASE_GATE=1` | +1–2 ngày |
| M-G3 | 4 màn mẫu ≥ 9,0 | +1 ngày (+1 nếu trượt) |
| M-G4 | Toàn bộ | +3–4 ngày |
| M-PB | Việc production bổ sung còn lại + báo cáo cuối | +1 ngày |

Sau mỗi mốc: push master (CI xanh), kiểm production, ghi một dòng vào `01-TRANG-THAI.md` §6 và `docs/audit-max/BAO-CAO.md`.

## 6. Định nghĩa "XONG TẤT CẢ" (báo Bang khi đạt)

1. G0–G4 đều ĐẠT theo số đo. Mỗi cổng có REVIEW tương ứng nằm trong `docs/audit-max/`.
2. `KIEM-THU.md` §2: 25/25. `audit-ui.mjs` mọi route × 7 khung (`390x844, 375x667, 430x932, 820x1180, 1180x820, 1280x800, 1366x768`) × 2 theme: 0 CHẶN, ≤ 2 NẶNG mỗi màn.
3. Rubric: toàn sản phẩm ≥ 8,7, mọi màn ≥ 8,5, hơn ảnh gốc ≥ 3 khi chấm mù.
4. `validate:data:release` exit 0; `RELEASE_GATE=1` trên CI.
5. `master` = `origin/master`, CI xanh, production cập nhật.
6. Các mục P0/P1 trong `15-PRODUCTION-BO-SUNG.md` xong.
7. `BAO-CAO.md` cuối có bảng `task | model | cổng | kết quả` và ghi rõ phần chỉ soi mẫu, chưa kiểm.
