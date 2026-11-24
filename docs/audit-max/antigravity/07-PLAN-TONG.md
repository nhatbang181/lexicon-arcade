# 07 · PLAN TỔNG (production) – dựa trên nghiên cứu 25/11/2026

> **Plan đầy đủ, có nguồn:** `docs/audit-max/reports/Nghiên cứu plan game học IELTS.md`. Ghi chú nghiên cứu gốc (6 mảng): `docs/audit-max/research_notes/Nghiên cứu plan game học IELTS/`.
> File này **không chép lại** plan. Nó làm 3 việc:
> 1. nêu cách đọc plan;
> 2. ánh xạ mã plan (`PP-`, `DL-`, `UX-`, `TU-`) vào task trong `TASKS.md`;
> 3. **quyết các chỗ plan lệch với luật/tài liệu đã có**.
>
> Thứ tự ưu tiên của Bang: **nghiên cứu → phương pháp học + bài học thị trường → dữ liệu và đề thi → UI/UX, asset, VFX, SFX, animation, tối ưu**.

## 1. Kết luận nghiên cứu, rút gọn

1. Dây nối học tập phải đúng trước mọi hiệu ứng:
   - thẻ chấm đúng item;
   - từ mới tới bước tự gõ;
   - band chỉ ghi khi điều kiện như thi thật;
   - dữ liệu không mất khi iOS dọn bộ nhớ.
2. Bốn cơ chế có bằng chứng mạnh dẫn dắt cả 9 game:
   - FSRS ở retention 0.90;
   - truy xuất là mặc định;
   - feedback nói rõ sai ở đâu;
   - input có độ phủ từ ≥ 95–98%.
3. **Từ mới học theo khối chủ đề**, không trộn (với danh sách từ, học theo khối thắng: g = −0.39). Chỉ trộn ở lượt ôn và ở các cặp dễ nhầm (TFNG↔YNNG, Headings↔Matching Information, các dạng biểu đồ).
4. Đo tiến bộ bằng **thăm dò trễ ≥ 7 ngày**, không bằng điểm trong phiên.
5. Thị trường cho thấy người học bỏ app khi bị **phạt** (energy trừ cả khi trả lời đúng), không phải khi bị thử thách. Vỏ game không có quyết định thật thì vô hiệu: thí nghiệm Gardenscapes của Duolingo cho kết quả trung tính.
6. Juice ở mức **High**, không phải Extreme (Kao 2020).
7. **Đề thật mới nhất không lấy được hợp pháp.** Cách làm hợp pháp là:
   - đặc tả format từ tài liệu chính thức;
   - xu hướng chủ đề từ forecast (chỉ lấy nhãn chủ đề);
   - đề gốc do một LLM soạn và một LLM khác kiểm;
   - thi thử thì dẫn link sang đề mẫu chính thức;
   - ghi rõ "không phải đề thật".
8. Trên iPhone, rủi ro lớn nhất là **mất dữ liệu**. Dữ liệu ở tab Safari không tự chuyển sang app đã cài ra màn hình chính, và bộ nhớ chỉ được giữ ở mức "best-effort". Sao lưu và lưu theo từng lượt có mức P0 ngang FSRS.

## 2. Ánh xạ mã plan → task (file độc quyền theo `TASKS.md`)

| Mã plan | Nội dung | Task làm | Ghi chú |
|---|---|---|---|
| PP-01, PP-02, PP-03 | FSRS 0.90, van tải thẻ mới (dừng khi hàng ôn > 150–200), vòng phục hồi, truy xuất ngay | T4-A (V1) + chủ `src/core/srs` (FX nhỏ đầu Đợt 3 nếu cần) | Đợt 1 đã làm phần nền (T1-A); còn: van tải, vòng phục hồi |
| PP-04 | thẻ minimum information, cloze collocation | T3-B (dữ liệu) + T4-A | |
| PP-05 | trộn đúng chỗ | T4-A (V1), T2-A (R1 thêm YNNG), T4-C (W2) | **Sửa luật cũ**, xem §3 |
| PP-06 | feedback giàu thông tin + nhãn lỗi | T3-A (FeedbackPanel) + mỗi game | |
| PP-07 | thăm dò trễ, "từ vững" | T3-C (Thống kê, `attemptRepo`) | |
| PP-08 | vùng 80–85% | đã có (T1-B `sessionLevel`) | giữ |
| PP-09, PP-10 | Four Strands, Coverage Meter | T3-C (Thống kê, kế hoạch ngày) + T3-B (validator độ phủ) + T2-A/T4-A (R1, R2, V3 hiện coverage) | |
| PP-11 | sổ lỗi → SRS | T2-C (W1, W2), T2-B (L2), T2-A (V2) | P0 phần sổ lỗi → thẻ |
| PP-12 | minimal pairs nhiều giọng | T4-B (L2 mode mới) + T3-B (audio ≥ 4 giọng) | |
| PP-13, PP-17, PP-18, PP-19 | quyết định thật, thua có lãi, cược độ tự tin, ghost run | T4-A, T4-C (Bùa = joker gắn điều kiện ngôn ngữ) | làm sau cùng (SR-92) |
| PP-14 | streak có freeze (1/7 ngày, giữ tối đa 2), tối đa 1 nhắc/ngày | T3-C (gamification) | |
| PP-15 | không phạt việc học | luật toàn app → `04-LUAT-CUNG.md` SR-87 | |
| PP-16 | chấm minh bạch, "ước lượng", chỉ tính lần chấm đầu | T2-C | |
| DL-01 … DL-12 | xương sống từ vựng hợp pháp, IPA, audio, passage, Task 1 từ OWID, chủ đề Speaking, đặc tả đề, chuẩn hoá đáp án, cổng chất lượng, biến thể khi làm lại, mẫu lỗi, ghi công | **T3-B** (dữ liệu), trừ DL-08 (T2-B chấm đáp án), DL-10 (game sở hữu), DL-12 màn Credits (T3-C, PB-13) | Xem `10-DATA.md` + §3 bên dưới |
| TU-01, TU-02, TU-04, TU-05 | không mất dữ liệu, lưu từng lượt, cập nhật không vỡ ván, bố cục iPhone | TU-01 → T3-C + PB-05/06; TU-02 → T2-A/B/C (game) + T1 đã có nền; TU-04 → Đợt PB (`vite.config.ts`, `src/main.tsx`); TU-05 → T3-A + mọi game | P0 |
| TU-03 | âm thanh tin cậy trên iOS | T2-B (`src/core/audio/**`) | P0 |
| UX-01 … UX-12 | màn drill một tay, chữ Việt, màu, Recap, onboarding, juice High, reduced-motion, lật thẻ, SFX, haptic, asset, mascot tiết chế | T3-A (hệ thống), T3-C (màn khung), T4-* (game) | |
| TU-06, TU-07, TU-08 | ngân sách, build, kiểm trên iPhone thật | Đợt PB + mọi task | xem §3 về ngân sách |

## 3. Chỗ lệch giữa plan và tài liệu đã có, và quyết định (AD ghi vào `DECISIONS.md` khi bắt đầu Đợt 3)

| # | Plan nghiên cứu nói | Tài liệu/luật đã có | **Quyết định** | Lý do |
|---|---|---|---|---|
| L-1 | UX-11: "mascot tự làm" | `LUAT.md` K10 + DECISIONS mục D: Lexi tải từ gói mèo Fluent Emoji (MIT), **cấm tự vẽ/AI sinh** | **Giữ luật K10** (tải gói Fluent) | DECISIONS > báo cáo; gói Fluent Animated là MIT và đã kiểm license |
| L-2 | UX-12: mascot chỉ ở onboarding, empty, recap, streak | `LUAT.md` M3: Lexi có ở mọi màn khung (Hôm nay, Hub, Thống kê…) | **Giữ M3**, nhưng thêm ràng buộc của plan: **0 mascot trên màn đọc/drill** (đã có ở J10) | Hai bên cùng tinh thần; M3 do Bang duyệt 23/11 |
| L-3 | TU-06: JS khởi tạo ≤ 170 KB, CSS ≤ 30 KB, precache ≤ 2 MB | `LUAT.md` P5 / `KIEM-THU`: JS ≤ 250 KB, CSS ≤ 130 KB, precache ≤ 1,5 MB | **Cổng (CHẶN) theo LUAT. Số của plan là mục tiêu kéo giãn** (ghi trong BAO-CAO, không chặn). Precache giữ **≤ 1,5 MB** (chặt hơn plan) | LUAT > báo cáo; hiện đã đạt 136 KB JS nên mục tiêu 170 KB khả thi |
| L-4 | UX-05: onboarding ≤ 3 bước | T1-B đã làm 4 bước (F10, Bang chốt `[15,30,45,60]` phút) | **Giữ 4 bước** (SR-90 giữ công đã làm); thêm đo "tới câu hỏi đầu tiên ≤ 60 s" | Không phá việc đã đạt cổng |
| L-5 | PP-05: từ mới theo khối chủ đề, không interleave | `09-PHUONG-PHAP-HOC.md` PP-05 cũ: V1 trộn ≥ 3 loại thẻ | **Sửa `09`**: trộn chỉ ở lượt ôn và cặp dễ nhầm; thẻ mới theo khối chủ đề (đã sửa) | Bằng chứng mạnh (meta-analysis) |
| L-6 | TU-03: audio m4a 64 kbps mono | Pipeline hiện có: MP3 (300 dictation đã render) | **Giữ MP3** cho file đã render (SR-91); file mới vẫn MP3 48–64 kbps mono | Giữ công đã làm; Safari phát MP3 tốt |
| L-7 | UX-06: sai = lắc thẻ ±6 px ×3 / 300 ms, **không rung màn hình** | `03` §3 dòng 4: `x:[0,-8,8,-5,5,0]` 300 ms chỉ trên thẻ câu | **Theo plan: ±6 px**, không rung màn hình khi sai (đã sửa `13`) | Gần như trùng; plan chặt hơn |
| L-8 | UX-02: chữ nội dung Lexend hoặc Be Vietnam Pro | Hiện dùng Be Vietnam Pro + Source Serif 4 (bài đọc) | **Giữ Be Vietnam Pro + Source Serif 4** (cả hai có tiếng Việt); Baloo 2 cho tiêu đề/số | Giữ công đã làm |
| L-9 | DL-01: CEFR từ CEFR-J + Octanove; NGSL 1.2 | `04` D7: "CEFR suy từ zipf" | **Theo plan**: `cefr_source` bắt buộc; nguồn CEFR-J (ghi Tono Lab, TUFS) + Octanove (CC BY-SA 4.0); cấm chép nhãn Oxford/EVP | Pháp lý đã kiểm |
| L-10 | DL-04: ≥ 15 passage mỗi band 6.0–8.0 | `04` §3: ≥ 6 mỗi Part | **Theo plan** (chặt hơn) cho pool luyện; ≥ 6/Part giữ làm ngưỡng tối thiểu của cổng | Đủ đa dạng để không lặp trong 14 ngày |
| L-11 | PP-02: 15 thẻ mới/ngày, dừng khi hàng ôn > 150–200 | `09` PP-C4: 15/ngày, tự giảm khi nhớ < 80% | **Gộp cả hai** | Bổ sung nhau |
| L-12 | TU-01: `persist()` khi standalone + cảnh báo dữ liệu tab Safari không chuyển sang app | `15` PB-05, PB-09 | **Nâng PB-05 + PB-09 lên P0**, thêm cảnh báo trước khi cài (đã sửa `14`) | Nghiên cứu xác nhận iOS 17.2+ không chép IndexedDB |

## 4. Thứ tự triển khai: khớp plan với đợt đang chạy

Plan đề xuất 6 đợt: lõi học + an toàn dữ liệu → dữ liệu hợp pháp → trải nghiệm iPhone → phương pháp nâng cao + vỏ game → Speaking → polish + thi thử. Ánh xạ vào kế hoạch đang chạy (`02-KE-HOACH.md`):

| Đợt plan | Tương ứng trong audit-max | Việc thêm do plan |
|---|---|---|
| 1. Lõi học + an toàn dữ liệu | Đợt 1 (xong) + **Đợt 2 (đang dở)** + FX-0 | Thêm vào Đợt 2: PP-16 (T2-C), TU-02 lưu từng lượt cho mọi game, TU-03 (T2-B), PP-11 sổ lỗi → SRS. Thêm **FX-2**: van tải thẻ mới + vòng phục hồi (PP-02) vào V1, chen sau FX-0 |
| 2. Dữ liệu hợp pháp | **T3-B** (chạy liên tục) | DL-01, 03, 04, 09, 12 trước; rồi DL-02, 05, 06, 07, 08, 10 |
| 3. Trải nghiệm iPhone | T3-A + T3-C | UX-01, 02, TU-05 (P0) trước; PB-05, PB-09 nâng P0 |
| 4. Phương pháp nâng cao + vỏ game | T3-C (PP-07, 09, 10, 14) + Đợt 4 | joker gắn điều kiện ngôn ngữ (Bùa) làm sau cùng |
| 5. Speaking | Đợt 5 (S2 → S1) | **Prototype ghi âm/ASR trên iPhone thật trước** (chưa kiểm chứng: MediaRecorder trong PWA standalone, SpeechRecognition không API trả phí, độ chính xác ASR với giọng Việt) |
| 6. Polish + thi thử | Đợt 4 phần E2/E3 + X1 + Đợt PB | X1 chỉ dùng đề gốc + link sang đề chính thức |

## 5. Mục "cần xác minh" phải làm trước khi dùng (giao cho worker dữ liệu, model rẻ)
- Nguyên văn descriptor Writing band 6/7/8 (PDF chính thức).
- Điều khoản IELTS Test T&C về bảo mật đề.
- License NAWL/TSL/BSL; Wikipedia, Wikinews, CMUdict, Britfone (repo gốc), Common Voice, LibriVox, TED, Gutenberg, Ngram; EVP, Oxford, AWL, COCA, SUBTLEX.
- Kenney CC0 trên trang gốc.
- Ngưỡng 23/40 ≈ band 6.

Ghi kết quả vào `docs/audit-max/research_notes/Nghiên cứu plan game học IELTS/xac_minh.md`. Nguồn nào chưa xác minh thì **chưa import**.
