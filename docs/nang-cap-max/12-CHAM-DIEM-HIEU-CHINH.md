# 12 · CHẤM ĐIỂM VÀ HIỆU CHỈNH

> Bối cảnh:
> - LLM chấm essay có xu hướng **nén điểm về giữa thang**: chấm thấp bài mạnh, chấm cao bài yếu (R3 §3.4).
> - Một nghiên cứu nội bộ của ielts.international giảm MAE từ 0,84 xuống 0,52 nhờ 4 việc: một rubric chung, bắt dẫn chứng trước khi cho điểm, bỏ con số band trong ví dụ, temperature 0 (R2 §D).
> - Người học Việt thấy các web lệch ±1 band; chấm 2 lần ra 2 điểm (R6 §A).
> Ràng buộc: **không API AI trả phí**. Chấm bằng **gói copy/dán qua Claude chat** (DECISIONS B3), cộng các công cụ chạy cục bộ.

## 1. Nguyên tắc
1. Chấm theo **checklist các cụm trong descriptor** rồi mới suy ra band. Không hỏi thẳng "band mấy".
2. Bắt **trích câu từ bài** làm bằng chứng trước khi cho điểm từng tiêu chí.
3. **Chấm 2 lần** (2 lượt dán, hoặc 2 phần trong cùng một gói). Lệch > 0,5 thì báo "độ tin cậy thấp".
4. Kết quả = **khoảng đã hiệu chỉnh** (vd "W 7.0–7.5 · tin cậy ~70%"), kèm **tiêu chí kéo xuống nhiều nhất** và **1–3 việc ưu tiên để lên nửa band**.
5. Có chế độ **"nghiêm"** do người học chọn: hiển thị cận dưới (R6: có người thích chấm gắt để "bớt ảo tưởng").
6. Không bao giờ hiện một con số band trơ trọi. Mọi điểm W/S đều gắn nhãn "ước lượng".

## 2. Gói chấm Writing (Claude chat)
- **App tạo gói** gồm:
  - đề;
  - bài (đã đánh số câu);
  - checklist JSON theo descriptor (bản tóm tắt bằng lời của mình, **không chép PDF**);
  - hướng dẫn trả về **JSON đúng schema**.
- Checklist theo tiêu chí:
  - **TR/TA:** trả lời đủ các phần đề? quan điểm rõ và phát triển? luận điểm nào over-generalise (trích)? mỗi body có ví dụ cụ thể? (Task 1: overview có xu hướng chính + so sánh? dữ liệu gom nhóm?)
  - **CC:** tiến triển logic? reference/substitution? từ nối/100 từ? đoạn có 1 ý trung tâm?
  - **LR:** từ ít phổ biến dùng đúng (trích)? collocation sai (trích + sửa)? lặp từ đề? chính tả?
  - **GRA:** đếm **câu không lỗi / tổng câu**; danh sách lỗi theo **mã** (`§5`); lỗi nào **lặp ≥ 2 lần** (hệ thống)?
- **JSON trả về** cho từng tiêu chí: `band_raw`, `evidence[]`, `cap_reason` (đặc điểm tiêu cực nào chặn trần), `errors[]{code, sentence_id, fix}`, `priorities[3]`.
- **App parse bằng zod.** Sai schema thì hiện nút "dán lại".
- Feedback **2 nấc** (Lyster & Saito: prompt > recast):
  - lượt 1 chỉ gạch chân + mã lỗi để người học tự sửa;
  - lượt 2 mới hiện bản sửa.
- **Rewrite round:** chỉ sửa câu bị gắn cờ, chấm lại, hiển thị delta.

## 3. Gói chấm Speaking
- **Đầu vào:** transcript (ASR on-device, người học sửa được), số liệu đo cục bộ:
  - wpm;
  - số pause > 1 s, phân theo **giữa cụm** (tìm ngôn ngữ, band 7) và **giữa ý** (nội dung, band 8);
  - độ dài nói liền mạch;
  - lặp từ;
  - discourse marker.
- **Checklist FC/LR/GRA** như Writing, trên transcript.
- **P (phát âm):** chỉ là **proxy**:
  - tỷ lệ ASR nhận đúng câu mục tiêu;
  - tỷ lệ rơi âm cuối/-s/-ed trong transcript;
  - (pha sau) điểm âm vị từ wav2vec2 phoneme.
  - Ghi rõ "không phải điểm Pronunciation".
- **Cảnh báo học thuộc:** trùng ≥ 60% n-gram với câu mẫu đã xem (MX-08, R5).

## 4. Hiệu chỉnh (calibration)
- **Anchor:**
  - (a) bài của Bang có điểm thi thật hoặc giáo viên chấm (gói riêng, `10b`), quý nhất;
  - (b) sample chính thức có điểm, chỉ dùng **cá nhân, offline** trong gói riêng;
  - (c) ELLIPSE/PERSUADE (CC BY): xếp hạng tương đối, phát hiện nén điểm;
  - (d) bài mẫu band 6/7/8/9 tự soạn đã qua 2 model kiểm.
- **Quy trình** (`scripts/data2/calib/`):
  1. Chấm mỗi anchor 3 lần.
  2. Đo bias theo band và MAE.
  3. Fit **isotonic** (raw → band hiệu chỉnh) riêng cho W và S.
  4. Xuất bảng vào `public/data/v2/calib/*.json`. Bảng chỉ chứa hệ số, không chứa bài.
- **Cập nhật:** mỗi lần có điểm thật mới; mỗi 6–8 tuần chấm lại 5 anchor + 2 bài cũ để đo drift. Drift > 0,5 thì fit lại.
- **Cổng NC-G3:**
  - MAE ≤ 0,5 trên anchor (a+b+d);
  - SD giữa các lần chấm ≤ 0,25;
  - khoảng phủ đúng điểm thật ≥ 80% số anchor.

## 5. Hệ mã lỗi (dùng chung W1, W2, S1, Error Boss, sổ lỗi)
Mã ngắn, map sang ERRANT khi thống kê offline:
- **ART-** mạo từ:
  - `ART-zero-countable` (thiếu a/an với danh từ đếm được số ít);
  - `ART-the-generic` (thừa *the* với nghĩa chung);
  - `ART-the-unique`.
- **NUM-** số ít/nhiều, danh từ không đếm được (`NUM-uncountable-s`: informations, advices…).
- **SVA-** hoà hợp chủ–vị.
- **TNS-** thì (hiện tại hoàn thành vs quá khứ đơn; tương lai trong mệnh đề thời gian).
- **WF-** dạng từ (economy/economic/economical).
- **PREP-** giới từ theo collocation.
- **COL-** collocation (adj+noun, verb+noun; lỗi dịch sát kiểu Việt).
- **REL-** mệnh đề quan hệ.
- **PUNC-** dấu câu (comma splice, run-on).
- **REF-** tham chiếu mơ hồ.
- **CONN-** từ nối sai, thừa hoặc thiếu.
- **REG-** văn phong (thân mật trong Writing; văn viết trong Speaking).
- **GEN-** over-generalise (TR).
- **CLICHE-** cụm khuôn/template.
- **PRON-** (Speaking):
  - `PRON-final` (âm cuối);
  - `PRON-s-ed`;
  - `PRON-stress`;
  - `PRON-cluster`;
  - `PRON-th`;
  - `PRON-sh-ch`.

**Quy tắc lỗi hệ thống:** một mã xuất hiện ≥ 2 lần trong 1 bài, hoặc trong ≥ 2 bài liên tiếp, là lỗi **hệ thống** và sinh **Boss** (`13` N1).

## 6. Công cụ cục bộ hỗ trợ chấm
- **Harper.js** (Apache, WASM, Dialect.British):
  - gạch lỗi chính tả/văn phong ngay khi gõ, trước khi tạo gói chấm;
  - lazy-load chỉ ở màn Writing;
  - bỏ sót lỗi thì/mạo từ → không thay Claude.
- **LanguageTool server** (Java, chạy cục bộ ở pipeline): QA câu mẫu và đáp án sinh ra. Không ship.
- **ERRANT** (Python, offline): phân loại lỗi giữa bài gốc và bài sửa để thống kê loại lỗi theo tuần.

## 7. Chấm Listening/Reading
- Đáp án chấp nhận `accepted[]`; chuẩn hoá số, giờ, tiền, chính tả UK/US, giới hạn từ (plan cũ T2-B đã làm).
- **Quy đổi band** theo bảng chính thức (L: 16/23/30/35 → 5/6/7/8; R Academic: 15/23/30/35). Hiển thị **khoảng** và "sát ngưỡng" khi cách ngưỡng ≤ 1 câu.
- **Ngân sách lỗi:** mục tiêu 8.0 là ≤ 5 lỗi/40 câu, 8.5 là ≤ 3. Hiện bằng 5 viên ngọc.
- Band L/R **chỉ** tính từ mock đầy đủ, lần làm đầu. Drill ngắn chỉ cập nhật Elo kỹ năng con.
