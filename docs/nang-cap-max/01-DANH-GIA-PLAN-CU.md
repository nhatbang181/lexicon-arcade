# 01 · ĐÁNH GIÁ PLAN CŨ (`docs/audit-max/`) · đã có gì, thiếu gì

> Đối chiếu plan cũ (TASKS 4 đợt, `antigravity/` 15 file, báo cáo nghiên cứu 25/11) với nghiên cứu mới R1–R6.
> Mức thiếu: **Lớn** = ảnh hưởng trực tiếp tới việc đạt 8.0 · **Vừa** = ảnh hưởng chất lượng luyện · **Nhỏ** = tiện ích.

## 1. Plan cũ làm tốt (giữ nguyên, không làm lại)

| Mảng | Đã có |
|---|---|
| Quy trình | Worktree/port riêng; review khác model và khác hãng; cổng G0–G4 đo được; chấm mù so ảnh gốc; luật chống lách công cụ |
| Sư phạm nền | FSRS 0.90, truy xuất trước, feedback có đáp án + lý do + bằng chứng, độ khó thích ứng 80–85%, không phạt việc học, band chỉ ghi khi đủ điều kiện |
| Dữ liệu nền | Audio đủ (32 episode, 2.207 từ, 700 câu dictation); blind-solve 24 passage + 32 episode; câu ví dụ D5; trap D8; decoy D10; ExamTest 2 bộ |
| Sản phẩm | Shell, Esc, streak giờ VN, lazy route, CI 8 bước, PWA, token, asset, Lexi, LiveCard, fx, hạ cấp hiệu ứng, iPhone ưu tiên 1 |
| Production | Sao lưu, rollback, smoke production, iOS audio/storage |

## 2. Mười bốn lỗ hổng

| # | Lỗ hổng | Mức | Bằng chứng (nghiên cứu) | Xử lý ở |
|---|---|---|---|---|
| L1 | **Quy mô dữ liệu quá nhỏ cho 8.0**. Hiện chỉ có:<br>• 2.207 từ;<br>• 24 passage (mỗi Part 8);<br>• 32 episode;<br>• Writing 10 đề mỗi dạng.<br>Người 8.0 cần 8–9k word family cho đọc; không lặp passage trong 14 ngày cần ≥ 15 passage mỗi band | **Lớn** | R3 §A.3 (Nation, Milton 58% phương sai); plan nghiên cứu DL-04 | `10`, `11` |
| L2 | **Nguồn dữ liệu chưa tận dụng nguồn mở lớn**. Chưa dùng:<br>• NGSL/NAWL, CEFR-J/Octanove;<br>• Wiktionary (kaikki) cho định nghĩa/IPA/ví dụ, viwiktionary cho gloss Việt;<br>• OEWN đồng nghĩa;<br>• Tatoeba câu, VOA audio thật;<br>• eLife/PLOS văn bản CC BY;<br>• Word Atlas 7.298 từ IELTS có audio UK | **Lớn** | R1 top 15 | `10` |
| L3 | **Không có Writing Task 1 riêng** (1/3 điểm Writing). Thiếu: overview, gom nhóm, từ theo ngành cho process | **Lớn** | R3 §A.4, R5 `aestivarium`, R6 | `13` N2, `11` §4 |
| L4 | **Không có Error Boss**: chưa có cơ chế diệt **lỗi lặp có hệ thống**. Đây là ranh giới GRA 7 → 8 | **Lớn** | R2 A2, R3 N1 | `13`, `12` §5 |
| L5 | **Chấm Writing/Speaking chưa hiệu chỉnh**. LLM "nén điểm về giữa" (chấm thấp bài mạnh, cao bài yếu); người học thấy lệch ±1 band và 2 lần chấm ra 2 điểm. Chưa có:<br>• anchor;<br>• checklist descriptor;<br>• báo khoảng;<br>• chấm 2 lần | **Lớn** | R2 §D (ielts.international MAE 0.84 → 0.52), R3 §3.4, R6 §A | `12` |
| L6 | **Speaking chưa có pipeline**. Thiếu:<br>• ghi âm, VAD, ASR trong trình duyệt;<br>• phân tích ngập ngừng giữa cụm hay giữa ý (FC 7 vs 8);<br>• Prosody Lab (âm cuối, trọng âm, nhịp) cho người Việt | **Lớn** (S là kỹ năng yếu nhất của người Việt: 5.61) | R2 §C, R3 A.2, R4 §2b | `16`, `13` N5 |
| L7 | **Chưa có phương pháp của người đạt 8–9**. Thiếu:<br>• "Học ngược" 4 kỹ năng;<br>• "Mổ đề" gắn nhãn nguyên nhân cho cả câu đúng-không-chắc;<br>• "Mọi đáp án sai cho tới khi chứng minh";<br>• thang thời gian 3 nấc;<br>• dịch ngược (Lampariello);<br>• Second-encounter capture;<br>• narrow input 70–80% | **Lớn** | R3 §B, R5 MX-01..12, R6 §C, H | `13` |
| L8 | **Đề "giống thật" chưa có đặc tả**: chưa phủ đủ 11 dạng Reading, các dạng Listening, 7 dạng Task 1, các dạng Task 2, 3 Part Speaking. Mock chưa đúng giao diện thi máy (2 phút soát Listening, gõ phím, đếm từ) | **Lớn** | R2 §A1 (từ 2026 chỉ thi máy) | `11` |
| L9 | **Đo lường tiến bộ còn thô**. Thiếu:<br>• Elo theo kỹ năng con;<br>• FSRS optimizer cá nhân;<br>• "ngân sách lỗi" L/R;<br>• % câu không lỗi;<br>• tỷ lệ lỗi tái xuất;<br>• band trajectory;<br>• calibration tự dự đoán;<br>• tự thí nghiệm | Vừa | R3 §3, §6 | `18` |
| L10 | **Thiếu input dài và fluency**. Plan cũ nặng phần học có chủ đích về ngôn ngữ (V1–V3, R1, R2); chưa có Graded Input Garden và Commute Monologue | Vừa | R3 §B.2 (Four Strands), R6 D1 (input giải trí vẫn có giá trị) | `13` N4, S2 |
| L11 | **Idea Bank và Speaking theo chủ đề chưa có**. Người học band cao nói "đủ ý + từ đúng chủ đề" quan trọng hơn từ hiếm. Cần idea bank tái dùng khoảng 50% | Vừa | R5 (`chippp_p`, `_tnnhln07_`), R6 G2 | `11` §5–6 |
| L12 | **Repo/công cụ production chưa chọn**: Harper (kiểm ngữ pháp WASM), transformers.js + Moonshine (ASR), vad-web, whisper.cpp (QA audio), Piper/MeloTTS (giọng UK vùng/Úc), impeccable (soát UI), LHCI, Ladle | Vừa | R4 | `15` |
| L13 | **Giọng Úc/NZ thiếu** trong audio Listening (đề thật có). Kokoro không có giọng Úc | Vừa | R1 §3, R4 §2a | `10` §5 |
| L14 | **Kênh MXH chưa vận hành định kỳ**. Xu hướng đề và cách học đổi theo quý; người học ghét seeding | Nhỏ | R5, R6 | `03` |

## 3. Những điểm plan cũ cần **sửa nhẹ** khi chạy bộ này (AD ghi `DECISIONS.md`)

1. Ngưỡng "≥ 6 passage mỗi Part" là sàn của cổng cũ. Mục tiêu mới:
   - **≥ 15 passage mỗi dải band**;
   - 0 lặp trong 14 ngày;
   - phủ đủ 11 dạng câu, mỗi dạng ≥ 30 câu.
2. Nhãn CEFR: chuyển hẳn sang `cefr_source` (CEFR-J/Octanove), bỏ CEFR suy từ zipf (đã quyết trong `antigravity/07` L-9).
3. R2 Headline Editor: thêm lớp **"chức năng đoạn"** (IMRaD, R6 §B) trước khi chọn heading.
4. L2 Dictation: thêm **"Shadow thay vì chép"** cho câu sai (R6 D1).
5. W1: thêm Plan Gate 5 phút và feedback 2 nấc (gợi ý → sửa mẫu) (R3 W1).

## 4. Kết luận

Plan cũ là **móng tốt**. Bộ này xây **tầng học thật** lên trên, theo thứ tự:
- dữ liệu và đề (NC-1, NC-2);
- chấm và đo (NC-3, NC-6);
- cơ chế band 8 (NC-4);
- Speaking (NC-5);
- polish (NC-7).

Không xoá, không viết lại game cũ.
