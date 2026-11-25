# 10b · CHẾ ĐỘ DÙNG RIÊNG (local) + GÓI ĐỀ RIÊNG · tối ưu cho 1 người dùng

> Quyết định của Bang (25/11/2026): **app chỉ mình Bang dùng** → được phép dùng tài liệu mà Bang có quyền dùng **cá nhân** (đề Cambridge đã mua, sample IELTS.org cho phép "personal and non-commercial use", đề BC/IDP familiarisation, đề Bang tự làm trên web khác…).
> Ràng buộc kỹ thuật duy nhất: repo `nhatbang181/lexicon-arcade` và site GitHub Pages đang **công khai**. Vì vậy tài liệu có bản quyền **không bao giờ** được commit, build hay deploy. Giải pháp: **Gói riêng (`.lexpack`)** build trên máy, nhập thẳng vào IndexedDB của từng thiết bị.
> AD ghi `DECISIONS.md` mục D: "Chế độ dùng riêng + Gói riêng; tài liệu cá nhân không vào repo/public".

## 0. Quyết định 25/11/2026: **GIỮ SITE CÔNG KHAI + GÓI RIÊNG** (Bang chốt lần cuối)

- App vẫn deploy GitHub Pages công khai, chỉ chứa **dữ liệu mở** (`10`).
- Đề thật và tài liệu bản quyền chỉ đi qua **gói riêng `.lexpack`** nhập vào thiết bị (§1–§4).
- **Audio trong repo/site công khai:** giữ trần **400 MB**. GitHub Pages khuyến nghị site ≤ 1 GB, và repo lớn làm CI chậm.
  - Audio vượt trần (mức max ở `10c` §4, TED, clip người thật): đưa vào **gói audio riêng** nhập vào thiết bị như gói đề, hoặc tải theo unit nếu hợp license.
- **Chế độ chạy local** (bảng dưới) là **phương án để sau**. Chỉ làm khi Bang yêu cầu lại; khi đó AD ghi `DECISIONS.md`.

### Phương án để sau: chạy local (tham khảo, CHƯA làm)

| Hạng mục | Hiện tại | Nếu chuyển local |
|---|---|---|
| Nơi chạy app | GitHub Pages công khai | **Máy PC của Bang**, phục vụ qua mạng riêng tới iPhone/iPad |
| Truy cập trên iPhone (ưu tiên 1) | URL Pages | **Tailscale** (miễn phí cho cá nhân):<br>1. Cài Tailscale trên PC và iPhone.<br>2. `tailscale serve` cấp HTTPS cho bản build `vite preview` / server tĩnh.<br>3. iPhone mở `https://<tên-máy>.<tailnet>.ts.net` và "Thêm vào MH chính".<br>4. Sau lần tải đầu, app chạy **offline** nhờ PWA.<br>**Dự phòng:** cùng Wi-Fi qua HTTPS tự ký (mkcert). |
| Repo GitHub | Công khai | **Chuyển private** (Bang tự đổi trong Settings) hoặc giữ công khai nhưng không chứa nội dung bản quyền. CI vẫn chạy kiểm (Actions miễn phí cho repo private trong hạn mức) |
| Job `deploy` lên Pages | Bật | **Tắt** (sau khi Bang đổi). Giữ `verify` |
| Audio | Trần 400 MB | Bang đồng ý audio IELTS "nặng quá thì cân nhắc". **Trần mới: 1,5 GB cho toàn bộ audio trên PC**. Trên iPhone chỉ tải gói audio theo unit đang học (≤ 300 MB một lần, xoá được). Mặc định opus 32–48 kbps |
| Nội dung bản quyền | Không vào repo | **Vẫn không vào repo** (kể cả repo private, để không lẫn với code và không lỡ public lại). Nằm ở `D:\English-private\` + gói `.lexpack` |

**Task NC0-L (chỉ khi chuyển local; hiện KHÔNG nằm trong `02`):**
1. Script `scripts/local/serve.ps1`: build rồi serve `dist/` (cổng cố định, ví dụ 4300).
2. Hướng dẫn Tailscale trong `docs/nang-cap-max/LOCAL-SETUP.md`. Bang tự cài và đăng nhập Tailscale, vì đây là tài khoản của Bang.
3. Kiểm trên iPhone thật: cài PWA, offline, nhập gói mẫu.

Việc đổi repo sang private và tắt Pages là **cài đặt tài khoản của Bang**: agent ghi hướng dẫn, Bang tự bấm.

**Nguồn tài liệu bản quyền:**
- Agent **không tải, không tìm** bản PDF/audio lậu: không lấy từ repo GitHub hay trang chia sẻ chép đề Cambridge.
- Cách có đề thật: Bang **mua** sách/ebook chính hãng (Cambridge IELTS Academic 1–21), đặt file vào `D:\English-private\sources\`, chạy build gói.
- Bộ build đọc được PDF và ảnh chụp trang.

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
