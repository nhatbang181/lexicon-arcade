# 10b · CHẾ ĐỘ DÙNG RIÊNG (local) + GÓI ĐỀ RIÊNG · tối ưu cho 1 người dùng

> Quyết định của Bang (25/11/2026): **app chỉ mình Bang dùng** → được phép dùng tài liệu mà Bang có quyền dùng **cá nhân** (đề Cambridge đã mua, sample IELTS.org cho phép "personal and non-commercial use", đề BC/IDP familiarisation, đề Bang tự làm trên web khác…).
> Ràng buộc kỹ thuật duy nhất: repo `nhatbang181/lexicon-arcade` và site GitHub Pages đang **công khai**. Vì vậy tài liệu có bản quyền **không bao giờ** được commit, build hay deploy. Giải pháp: **Gói riêng (`.lexpack`)** build trên máy, nhập thẳng vào IndexedDB của từng thiết bị.
> AD ghi `DECISIONS.md` mục D: "Chế độ dùng riêng + Gói riêng; tài liệu cá nhân không vào repo/public".

## 1. Kiến trúc

```
D:\English-private\               ← NGOÀI repo (không git, hoặc git riêng tư không push lên public)
  sources\                        ← file Bang có quyền dùng cá nhân: PDF/ảnh/audio Cambridge đã mua, sample IELTS.org đã tải, ghi chép của Bang
  work\                           ← trích xuất trung gian (OCR, căn audio)
  packs\cambridge-18.lexpack      ← đầu ra: 1 file zip (json + audio opus) theo đúng schema public/data/v2
  build.ps1                       ← gọi scripts/data2/private/* trong repo (code public, DỮ LIỆU private)

Repo D:\English (public):
  scripts/data2/private/          ← CODE build gói (OCR, cắt audio, gắn đáp án, xuất .lexpack) – không chứa dữ liệu
  src/features/library/import/    ← màn "Nhập gói riêng" (đọc .lexpack → IndexedDB, Cache Storage cho audio)
  .gitignore                      ← chặn *.lexpack, /private/, D:\English-private không nằm trong repo
```

**Đưa sang iPhone/iPad:**
1. Copy `.lexpack` vào iCloud Drive hoặc AirDrop sang thiết bị.
2. Trong app: Cài đặt → "Nhập gói riêng" → chọn file (input file nhận `.lexpack`/`.zip`).
3. Dữ liệu nằm trong IndexedDB + Cache Storage của app đã cài (PWA standalone).

Lưu ý iOS (`docs/audit-max/antigravity/14` §9):
- Nhập **sau khi** đã "Thêm vào màn hình chính" (tab Safari không chia sẻ dữ liệu với app đã cài).
- Bật `persist()`.
- Giữ file `.lexpack` gốc để nhập lại khi cần.

**Không cần server, không cần tắt site công khai.** Site public chỉ chạy dữ liệu mở (`10`). Gói riêng chỉ có trên thiết bị của Bang.
- Nếu Bang muốn bỏ hẳn site public (deploy chỉ local hoặc qua mạng LAN/Tailscale tới iPhone), đó là đổi cài đặt GitHub/CI. **Bang tự quyết**, AD không tự tắt.

## 2. Gói riêng chứa gì (nguồn Bang có quyền dùng cá nhân)

| Gói | Nguồn | Cách đưa vào | Ghi chú |
|---|---|---|---|
| `cambridge-<n>` | Sách Cambridge IELTS Academic Bang **đã mua** (bản giấy/ebook + audio kèm sách) | OCR passage/câu hỏi (Tesseract/PaddleOCR cục bộ) hoặc gõ tay; cắt audio theo Part; nhập đáp án + transcript cuối sách | Đề thật chất lượng cao nhất (R6 §I: "học kỹ bộ Cambridge trước khi mua đề dự đoán"). **Mua sách = tốn tiền → hỏi Bang trước** |
| `ielts-org-samples` | Sample test questions + familiarisation test (ielts.org, BC, IDP) | Tải bản Bang được phép dùng cá nhân; trích xuất như trên | Điều khoản cho phép dùng cá nhân, phi thương mại; vẫn **không đăng lại** |
| `my-tests` | Đề Bang làm trên ieltsonlinetests, YouPass, Study4, DOL… | **Chỉ nhập kết quả**: số câu, dạng câu, câu sai, lý do sai, từ mới. Không chép nguyên đề | Điều khoản các trang này cấm sao chép; dùng tay cho mục đích chữa bài cá nhân, **không cào tự động** |
| `my-writing` | Bài Writing của Bang có điểm thi thật hoặc giáo viên chấm | Nhập văn bản + điểm | **Anchor quý nhất** cho hiệu chỉnh chấm (`12`) |
| `my-speaking` | Bản ghi Speaking của Bang + điểm (nếu có) | Ghi âm trong app | Anchor Speaking |
| `teacher-material` | Tài liệu từ khoá học Bang đã trả phí | Theo điều khoản khoá học | Chỉ dùng cá nhân |

**Vẫn không làm:**
- tải đề lậu (PDF Cambridge trôi nổi, repo GitHub chứa đề);
- cào web trái điều khoản;
- đưa bất kỳ phần nào của gói riêng vào repo, CI, Pages, artifact, hay gửi cho dịch vụ bên ngoài.

Riêng việc **dán bài viết của Bang vào Claude chat để chấm** vẫn được, vì đó là bài của Bang.

## 3. Tối ưu "level max" cho 1 người

1. **Chấm đề thật đúng quy ước:**
   - Gói Cambridge có đáp án chính thức, có cả biến thể chấp nhận được.
   - Bộ chấm L/R (plan cũ T2-B) đọc `accepted[]`.
   - Mọi câu sai đi vào **Mổ đề** (`13`) và thẻ FSRS có ngữ cảnh gốc.
2. **Mock có giờ, không lặp:**
   - Mỗi đề Cambridge chỉ tính band **lần làm đầu**; lần sau chỉ để chữa.
   - Ước lượng band = trung bình 3 mock gần nhất ± sai số (`18`).
3. **"Học ngược" trên đề thật** (R6 §C), áp vào chính đề Cambridge:
   - mở transcript trước;
   - xem đáp án rồi tìm bằng chứng;
   - nối cặp paraphrase → tự động thành thẻ **"cặp paraphrase"** cho V3.
4. **Error Boss từ bài thật:** lỗi trong bài Writing/Speaking của Bang được gắn mã lỗi; lỗi lặp lại thì thành Boss.
5. **Hiệu chỉnh chấm bằng chính Bang:**
   - Bài có điểm thi thật là anchor.
   - Mỗi lần Bang thi thật hoặc được chấm, nhập điểm, hàm hiệu chỉnh tự cập nhật.
6. **FSRS optimizer cá nhân** sau khoảng 1.000 lượt ôn.
   - Elo theo kỹ năng con dựa trên đề thật: biết chính xác dạng câu nào kéo điểm xuống.
7. **Đồng bộ nhiều thiết bị không cần server:**
   - Xuất/nhập sao lưu (đã có ở plan cũ) mang cả tiến độ lẫn gói riêng.
   - Tuỳ chọn file sync qua iCloud Drive, do Bang tự chép.
8. **Riêng tư:**
   - Bản ghi âm và bài viết chỉ ở máy.
   - Không analytics.
   - Nút "Xoá gói riêng" có xác nhận.

## 4. Task (thêm vào `02`)

| Task | File độc quyền | Việc | Done |
|---|---|---|---|
| **NC1-P** Gói riêng (code) | `scripts/data2/private/**`, `src/features/library/import/**`, `.gitignore` (chỉ thêm dòng chặn) | Định dạng `.lexpack` (manifest + json theo schema v2 + audio opus); script build từ thư mục ngoài repo (OCR cục bộ, cắt audio bằng ffmpeg/imageio-ffmpeg, khớp đáp án); màn nhập/xoá gói; kiểm tra schema bằng zod; audio vào Cache Storage | Nhập gói mẫu (dữ liệu giả) trên iPhone standalone chạy được offline; `git status` không bao giờ thấy file gói; test chặn: build CI fail nếu thấy `*.lexpack` hoặc thư mục private trong repo |
| **NC1-Q** Nhập kết quả đề ngoài | `src/features/library/external/**` | Form nhanh: tên đề, nguồn, điểm từng phần, danh sách câu sai (dạng câu, lý do theo nhãn Mổ đề, từ mới) → Trap Log, Elo, FSRS | Nhập 1 đề ≤ 3 phút; dữ liệu vào đúng thống kê |

**Bước Bang tự làm** (agent không làm thay):
- mua sách (nếu muốn);
- đặt file nguồn vào `D:\English-private\sources\`;
- chạy `build.ps1`;
- chép `.lexpack` sang iPhone;
- quyết định có tắt site public hay không.
