# Xác minh nguồn & giấy phép (theo `07-PLAN-TONG.md` §5)

> Cập nhật: 25/11/2026 (T3-B). Luật áp dụng: `04-LUAT-CUNG.md` SR-30, SR-88; `07-PLAN-TONG.md` §5 — **nguồn nào chưa xác minh trực tiếp từ trang gốc thì CHƯA import vào `public/data/`**.

## 1. Bảng trạng thái xác minh

| # | Mục cần xác minh | Trạng thái | Ghi chú / Quy tắc áp dụng trong T3-B |
|---|---|---|---|
| 1 | Nguyên văn descriptor Writing band 6/7/8 (PDF chính thức IELTS.org) | **Chưa xác minh trực tiếp PDF gốc — chưa import nguyên văn** | Không trích nguyên văn descriptor chính thức; các nhận xét/tiêu chí TR/CC/LR/GRA trong `writing/` được tự diễn đạt bằng tiếng Việt & tiếng Anh gốc. |
| 2 | Điều khoản IELTS Test T&C về bảo mật đề | **Chưa xác minh bản PDF T&C mới nhất — áp dụng mức chặt nhất** | Tuân thủ tuyệt đối SR-30 & SR-88: cấm chép/chuyển thể đề thật từ IELTS.org/BC/IDP/Cambridge/ieltsonlinetests; 100% đề trong app là đề luyện tập tự biên soạn. |
| 3 | License NAWL / TSL / BSL | **Chưa xác minh trang gốc — chưa import** | Chưa import NAWL/TSL/BSL vào `words.json`. Chỉ giữ danh sách đã có trong pipeline hiện hành. |
| 4 | License NGSL 1.2 & CEFR-J / Octanove | **Chưa xác minh trực tiếp repo/trang gốc trong phiên này — chưa import mới** | `07-PLAN-TONG.md` §3 L-9 ghi nhận hướng CEFR-J (Tono Lab, TUFS) + Octanove (CC BY-SA 4.0); T3-B chưa import file mới từ các nguồn này cho tới khi lưu đủ bản sao LICENSE & attribution. |
| 5 | License Wikipedia / Wikinews (CC BY-SA 4.0) | **Chưa xác minh từng bài cụ thể — chưa import** | Không dùng văn bản trích từ Wikipedia/Wikinews trong T3-B; toàn bộ 24 bài đọc và 32 bài nghe là nội dung tự biên soạn (`license: "own"`). |
| 6 | License CMUdict (BSD-2-Clause) & Britfone (Apache-2.0, repo gốc) | **Chưa xác minh trực tiếp commit/LICENSE repo gốc — chưa import dữ liệu thô** | Chuẩn hoá IPA D19 (`83_ipa_normalize.mjs`) chỉ áp quy tắc ngữ âm Anh-Anh (bỏ `/r/` sau nguyên âm trước phụ âm/cuối từ), không import bảng từ điển ngoài. |
| 7 | License Common Voice / LibriVox / TED / Gutenberg / Google Ngram | **Chưa xác minh từng bộ dữ liệu — chưa import** | Audio học hiện dùng `edge-tts` (chủ dự án duyệt ngày 23/11/2026, `DECISIONS.md` mục D) và ghi đầy đủ trong `public/audio/CREDITS.md` + `audioProvenance`. |
| 8 | EVP / Oxford 3000-5000 / AWL / COCA / SUBTLEX | **Bản quyền thương mại / hạn chế — CẤM import nguyên văn** | Không chép nhãn CEFR Oxford/EVP hay dữ liệu COCA; chỉ dùng độ phổ biến tần suất nội bộ hiện có. |
| 9 | Kenney CC0 trên trang gốc | **Thuộc phạm vi asset (T3-A)** | Để T3-A xác minh trực tiếp khi tải gói và ghi vào `public/assets/CREDITS.md` + `assets.manifest.json` (SR-60). |
| 10 | Ngưỡng quy đổi 23/40 ≈ band 6.0 | **Chưa xác minh bảng quy đổi chính thức mới nhất** | Không gắn nhãn "chính thức" cho bảng quy đổi điểm; mọi ước lượng band trong app ghi rõ "ước lượng" (SR-89). |

## 2. Kết luận cho T3-B
- **0 nguồn ngoài chưa xác minh được import** trong toàn bộ quá trình T3-B.
- 100% dữ liệu sinh mới/chỉnh sửa trong T3-B (`words.json`, `collocations.json`, `dictation.json`, `exam/tests.json`, `listening/episodes/*.json`, nháp `paraphrases/d10`) đều có `license: "own"` (tự biên soạn + kiểm chéo khác hãng) và `audioProvenance` minh bạch.
