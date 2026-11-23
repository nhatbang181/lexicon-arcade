# 07 · QUY TRÌNH VÀ KIỂM CHÉO

> Học từ đợt v5 của dự án anh em `D:\Booking\date-planner` (23/11/2026): ở đó agent làm **tự chấm 9,5/10** trong khi thực tế khoảng 4/10, vì chỉ kiểm lỗi kỹ thuật (0 lỗi console, 0 tràn ngang) và không ai so với ảnh thật. Ở repo này cũng đã có đúng kiểu lỗi đó: `PROGRESS.md` ghi "M3 ✅ 100%" trong khi Listening mới có audio 4/32 bài, `validate:data` báo PASS trong khi bật đủ cổng có 2 835 lỗi.
> Vì vậy từ đợt audit-max: **người làm không chấm**, mọi nhận định "đạt" phải đến từ **số đo của công cụ không ai được sửa** và **2 reviewer độc lập chấm mù**.

## 1. Vai trò

| Vai | Ai | Được làm | Không được làm |
|---|---|---|---|
| **Điều phối (AD)** | Phiên Claude chính hoặc Bang | Giao task, duyệt cổng G1–G4, quyết tranh chấp, sửa luật/ngưỡng/công cụ (ghi `DECISIONS.md`) | Viết code tính năng |
| **Builder** | Agent làm task (`PROMPT-BAN-GIAO.md` Prompt 2) | Code, tải asset, chạy kiểm, ghi KE-HOACH và BAO-CAO | **Tự chấm thẩm mỹ**; sửa `docs/audit-max/cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, ngưỡng; sửa file ngoài task |
| **Reviewer A** | Agent mới, **khác model với builder**, xem được ảnh | Chấm mù, chạy lại mọi kiểm, liệt kê lỗi có tọa độ | Sửa code; đọc review B trước khi nộp |
| **Reviewer B** | Agent mới, khác model với builder **và** với A nếu được, xem được ảnh | Như A, độc lập | Như A |
| **Fixer** | Builder cũ của task | Sửa **đúng** danh sách lỗi của 2 review | Thêm tính năng, đổi phần đã được khen |

Model chỉ đọc chữ (không xem được ảnh) **không** được làm reviewer.

## 2. Cổng (không qua cổng thì không làm bước sau)

| Cổng | Khi nào | Nội dung | Ai duyệt | Bằng chứng |
|---|---|---|---|---|
| **G0 Móng** | Hết đợt 1 | CI 8 bước xanh; production `<title>` V3; P0 của G1, G2, G3 (`01-GAME.md`) và F1–F3 đã đóng | AD | log CI, `curl` production, test |
| **G1 Asset** | Giữa đợt 3 (T3-A, sau khi tải) | Đủ gói asset `03` §9; **contact sheet** (ảnh ghép mọi asset theo nhóm, trên nền tối và sáng) ở `docs/audit-max/bang-asset/`; CREDITS + manifest đủ 8 trường; sha256 khớp | AD | contact sheet, `node scripts/validate/assets_credits.mjs` |
| **G2 Bộ thành phần** | Cuối đợt 3 (T3-A) | `#/dev/components` hiện đủ mọi thành phần × mọi trạng thái (idle, hover, active, focus, disabled, loading, correct, wrong) × theme tối/sáng; `LiveCard`, Recap mới, hạt, số bay chạy được | AD + 2 reviewer | ảnh full-page `/dev/components` ở 390 và 1280 × 2 theme, video 5 s |
| **G3 Màn mẫu** | Ngày đầu đợt 4: T4-A làm **V1 trước**, T3-C đã xong Hôm nay, Hub | 4 màn mẫu **Hôm nay, Hub, V1 (đang chơi), Recap của V1** đạt rubric ≥ 9,0 từ **cả 2 reviewer**, hơn ảnh gốc ≥ 3 điểm chấm mù | AD | ảnh, 2 review, báo cáo `audit-ui.mjs` |
| **G4 Toàn bộ** | Hết đợt 4 | Mọi màn đạt ngưỡng `KIEM-THU.md` §3; `KIEM-THU.md` §2 đạt 25/25 | AD rồi Bang | `BAO-CAO.md` |

**Luật cổng:** G3 trượt thì **dừng** juice các game khác, quay lại sửa bộ thành phần (G2) – lỗi gốc thường nằm ở thành phần dùng chung, sửa từng màn là phí công.

## 3. Vòng đời một task

```
1. Builder đọc tài liệu → ghi docs/audit-max/KE-HOACH-<task>.md (≤ 40 dòng):
     màn/route nào, thành phần nào, asset nào, rủi ro,
     DANH SÁCH MỌI NÚT/CHỨC NĂNG hiện có của từng màn bị đụng (để reviewer bấm thử, không được mất chức năng nào),
     lệnh mở trạng thái khó vào (vd: seed profile, mở modal, vào Recap nhanh bằng ?seed=…).
2. Builder làm → chạy KIEM-THU.md §2 + audit-ui.mjs cho route của task → MỞ XEM ảnh khoanh lỗi (-loi.png) và ảnh thường
     bằng mắt → sửa tới khi 0 lỗi CHẶN, ≤ 2 lỗi NẶNG mỗi màn.
3. Builder ghi docs/audit-max/BAO-CAO-<task>.md: đã làm gì, file đã sửa, asset mới (nguồn + giấy phép),
     số đo trước → sau (dán tóm tắt audit-ui), chức năng đã giữ.
     CẤM ghi điểm thẩm mỹ, CẤM chữ "đẹp", "hoàn hảo", "production-ready", "đạt chuẩn" (LUAT Q1).
4. Điều phối giao Reviewer A và B SONG SONG (prompt-reviewer.txt), mỗi người agent mới, không chung ngữ cảnh.
5. Tổng hợp: lấy ĐIỂM THẤP HƠN của 2 reviewer cho từng tiêu chí; gộp danh sách lỗi (trùng thì lấy mức nặng hơn).
6. ĐẠT (ngưỡng KIEM-THU §3, 0 CHẶN) → AD duyệt → merge.
   TRẢ VỀ → Fixer (prompt-fixer.txt) sửa CHẶN → NẶNG → NHẸ, thêm mục "Vòng N" vào BAO-CAO → quay lại bước 2.
   Tối đa 3 vòng; vòng 3 vẫn trượt → AD can thiệp (đổi hướng thiết kế hoặc tách task).
```

Đợt 1–2 (sửa logic, ít đổi giao diện): bước 4 chỉ cần **1 reviewer** tập trung vào test và diff; rubric thẩm mỹ chưa chấm. Từ đợt 3: đủ 2 reviewer + chấm mù.

## 4. Mẫu REVIEW (bắt buộc đúng mẫu)

```markdown
# REVIEW <task> – Reviewer <A|B> – model <tên>
## 0. Chấm mù (làm ĐẦU TIÊN)
(bảng điểm R1–R10 cho từng ảnh shuffle-*, TRƯỚC khi mở key.json; sau đó giải mã: điểm gốc vs mới, chênh lệch)
## 1. Kết quả tự chạy lại
(tóm tắt audit-ui.mjs: CHẶN/NẶNG theo mã và theo màn; KIEM-THU §2 các dòng liên quan với số đo thật)
## 2. Lỗi tìm thấy (≥ 5, xếp nặng → nhẹ)
| # | Màn/route | Khung + theme | Vị trí (x,y,w,h trên ảnh) | Mã luật | Mức | Mô tả | Cách sửa đề xuất |
## 3. Rubric (KIEM-THU §3) – mỗi điểm có 1 câu lý do dẫn TÊN ẢNH, dùng mốc 4/7/10
| Tiêu chí | Điểm | Lý do (ảnh) |
## 4. Chức năng
(bấm thử từng mục trong KE-HOACH: còn / hỏng / mất)
## 5. So với tham chiếu
3 màn đại diện: "giống <Balatro|Duolingo|Stardew…> ở…, còn kém ở…"
## 6. Luật script chưa đo, đã kiểm bằng cách nào
(B2, B5 câu hỏi trong màn đầu, J1 ≥ 3 kênh, J3 không động sau chữ, D6 1 nút chính, K* asset…)
## 7. Phán quyết: ĐẠT / TRẢ VỀ
```

**Review không hợp lệ** (bỏ, giao reviewer khác chạy lại) khi: ít hơn 5 lỗi cụ thể; chấm điểm không có lý do dẫn ảnh; không tự chạy lại công cụ; chép số liệu của builder; không chấm mù trước.

## 5. Chống gian lận

1. Reviewer xem `git diff --stat master...` – builder có sửa `docs/audit-max/cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, ngưỡng trong `scripts/qa/**` hay `scripts/validate/**` (khi không phải task được giao) không. Có → TRẢ VỀ ngay.
2. File sửa phải nằm trong danh sách độc quyền của task (`TASKS.md`).
3. Mở ngẫu nhiên 10 dòng `public/assets/CREDITS.md` / manifest, so `sha256` với file thật.
4. Tìm cách lách đếm: `data-audit-ignore` (cấm, công cụ báo `Q5`), icon 1 px, ảnh `opacity:0`, `aria-hidden` để giấu chữ nhỏ, đổi `font-size` chỉ khi có `navigator.webdriver`, animation giả chỉ để công cụ thấy "đang chuyển động" mà mắt không thấy.
5. Chụp ảnh **sau tương tác**: trả lời 1 câu đúng + 1 câu sai, mở 1 modal, cuộn tới cuối, vào Recap – chặn kiểu "chỉ đẹp ở màn đầu".
6. Test không được bị `skip`/`fixme` mới so với `master` (trừ `juice.spec.ts` đến hết đợt 3).

## 6. Tranh chấp
Builder không đồng ý một lỗi → ghi `docs/audit-max/HANDOFF.md` mục **"Tranh chấp"**: mã lỗi, review nào, lý do, ảnh. AD quyết. Trong lúc chờ, builder vẫn sửa các lỗi còn lại.
Cần sửa file của task khác → ghi `HANDOFF.md` mục **"Cần chủ sở hữu file khác"** (thay cho mục cùng tên trong BAO-CAO ở bản trước).

## 7. Ảnh nộp bắt buộc (mỗi màn bị đụng)
- Do `audit-ui.mjs` chụp (không chụp tay chọn góc đẹp): 390 tối, 390 sáng, 1280 tối, 1280 sáng, 820 tối.
- 1 ảnh **sau tương tác** (§5 mục 5).
- 1 **video 3–5 s** cho màn chính của task (V1 trả lời đúng + combo, Recap đếm số, Hôm nay → mở game) quay bằng Playwright `recordVideo`.
- Đặt ở `docs/audit-max/anh-sau/<task>/`, ảnh gốc cùng tên lấy ở `docs/audit-max/anh-goc/`.
