# 10c · XU HƯỚNG RA ĐỀ · đọc, đo, đón đầu (dữ liệu mức max)

> Mục tiêu: kho đề và nội dung **nhiều nhất, đúng nhất, hay nhất**, và **đi trước** xu hướng đề thật một quý.
> Mọi kết luận "xu hướng" phải có **số đếm** từ nguồn ghi rõ. Phần dự báo ghi nhãn **[Dự báo]** và kiểm lại mỗi quý. Không chép đề; chỉ đếm **nhãn chủ đề, dạng câu, đặc điểm**.

## 1. Bốn nguồn tín hiệu (hợp pháp)
| Nguồn | Đếm cái gì | Tần suất | Ghi vào |
|---|---|---|---|
| **Gói riêng Cambridge 1–21** (Bang đã mua, `10b`) | Mỗi đề: chủ đề passage/section, dạng câu từng câu, độ dài, giọng, loại bẫy, dạng Task 1/Task 2, chủ đề Task 2 | Một lần mỗi cuốn mới (IELTS 21 ra 7/2026) | `data-src/trends/cambridge_stats.json` (chỉ **số đếm + nhãn**, không có văn bản đề). File thống kê này được commit vì không chứa nội dung |
| **Forecast Speaking theo quý** (IELTS Bro, IELTS Fighter, ielts-mentor, IPP…) | Nhãn chủ đề P1/P2/P3, chủ đề mới so với quý trước | Đầu mỗi quý (tháng 1, 5, 9 là các đợt đổi đề phổ biến) | `data-src/trends/speaking_topics_<quý>.json` |
| **Thí sinh kể lại đề trên MXH** (Threads/Facebook/TikTok, `03`) | Nhãn chủ đề Task 1/Task 2/Reading/Listening, dạng câu "lạ", phản ánh thi máy | Hằng tháng | `data-src/trends/recall_<tháng>.json` (nhãn + link nguồn + ngày) |
| **Tin chính thức** (ielts.org news, BC/IDP) | Thay đổi format, thi máy, OSR, chính sách | Hằng tháng | `data-src/trends/official_changes.md` |

## 2. Đo xu hướng (script `scripts/data2/trends/`)
- `topic_matrix.py`: ma trận chủ đề × kỹ năng × năm/quý. Đếm, tính tần suất, phát hiện chủ đề **tăng** (độ dốc 4 quý > 0) và chủ đề **đã lâu chưa ra** (khả năng quay lại).
- `type_distribution.py`: phân bố dạng câu Reading/Listening theo bộ Cambridge (vd tỷ lệ TFNG/YNNG/Headings, MCQ nhiều đáp án ở Part 3). Pool luyện và mock **khớp phân bố gần nhất**, có cộng trọng số cho dạng người học hay sai.
- `task2_types.py`: tỷ lệ 5 dạng Task 2 và chủ đề theo năm; chỉ ra dạng ghép (two-part + opinion).
- `speaking_rotation.py`: chủ đề P2 giữ qua nhiều quý và chủ đề mới; P1 "chủ đề cố định" (work/study, hometown, accommodation).
- **Đầu ra:** `public/data/v2/trends/weights.json`, trọng số chọn chủ đề/dạng cho bộ sinh đề (NC-2) và cho Hôm nay.

## 3. Đón đầu (nội dung **[Dự báo]**)
Nguyên tắc: IELTS chọn chủ đề **phổ thông, gắn đời sống và xã hội đương đại, không chính trị nhạy cảm**. Vì vậy đón đầu = chuẩn bị chủ đề đang **lên** trong đời sống 2025–2027 mà chưa phủ trong kho.

**Danh sách đón đầu khởi điểm** (mỗi chủ đề cần: 3 passage, 2 episode, 2 đề Task 2, 1 Task 1, 4 câu P3, 10 ý Idea Bank, 30 collocation):
1. AI trong giáo dục và việc làm (tự động hoá, kỹ năng tương lai, đạo đức).
2. Làm việc từ xa, làm việc kết hợp, kinh tế gig.
3. Biến đổi khí hậu **thích ứng** (đảo nhiệt đô thị, nhà chống nóng, nông nghiệp chịu hạn).
4. Già hoá dân số, chăm sóc người cao tuổi, lương hưu.
5. Tin giả, kỹ năng truyền thông, thuật toán mạng xã hội, thời gian dùng màn hình.
6. Sức khoẻ tinh thần, giấc ngủ, mạng xã hội với giới trẻ.
7. Du lịch quá tải, du lịch bền vững.
8. Thương mại vũ trụ, rác vũ trụ.
9. Chỉnh sửa gen, y học cá thể hoá.
10. Năng lượng tái tạo, xe điện, pin, khoáng sản.
11. Thực phẩm tương lai (thịt nuôi cấy, côn trùng), lãng phí thực phẩm.
12. Thành phố 15 phút, giao thông công cộng, xe đạp.
13. Bảo tồn ngôn ngữ, di sản văn hoá, bảo tàng số.
14. Kinh tế chia sẻ, tiêu dùng tối giản, thời trang nhanh.
15. Học suốt đời, chứng chỉ ngắn hạn, giáo dục trực tuyến.

Cập nhật mỗi quý bằng §2:
- chủ đề có tín hiệu từ ≥ 2 nguồn → nâng lên "đang ra";
- chủ đề 4 quý không có tín hiệu → giảm trọng số (không xoá).

**Đón đầu format (thi máy):**
- luyện highlight/ghi chú trên màn;
- Listening chỉ 2 phút soát;
- gõ Writing có đếm từ;
- giới hạn từ chặt.

Các thay đổi format lớn lấy **chỉ** từ nguồn chính thức (§1 dòng 4). Không tự đoán.

## 4. Quy mô mức max (thay mục tiêu ở `10` §0 khi đủ năng lực render và soát)
| Loại | Mục tiêu `10` §0 | **Mức max** (đích cuối) | Cách đạt |
|---|---|---|---|
| Lemma đầy đủ | 12.000 | **15.000** | CEFR-J + Octanove + NAWL + từ chủ đề đón đầu |
| Collocation | 4.000 | **8.000** | kaikki + Word Atlas + sinh/kiểm theo chủ đề |
| Câu học có nguồn | 20.000 | **50.000** | Tatoeba CC0/CC BY + VOA + câu sinh có kiểm |
| Reading passage luyện | 90 | **300** (25 chủ đề × 3 Part × 4) | Kênh C từ eLife/PLOS/Wikipedia + The Conversation nguyên văn |
| Câu hỏi Reading | 1.400 | **4.500** (mỗi passage 2 bộ câu hỏi) | Biến thể |
| Listening episode | 90 | **250** + TED Part 4 nguyên văn ≥ 100 đoạn | TTS đa giọng + TED (NC-ND, không sửa) |
| Dictation | 2.000 | **5.000** | Câu từ episode + Tatoeba |
| Clip người thật | 3.000 | **10.000** | LibriSpeech/VCTK/Lingua Libre/VOA/TED |
| Task 1 | 56 | **140** (7 dạng × 20) | OWID + SVG process/map |
| Task 2 | 60 | **200** (5 dạng × 40, phủ 25 chủ đề) | Sinh theo ma trận chủ đề |
| Speaking | P1 160 / P2 60 / P3 240 | **P1 400 / P2 150 / P3 600**, cập nhật quý | Forecast nhãn + sinh biến thể |
| Mock | 8 L/R + 4 W + 4 S | **20 L/R + 10 W + 10 S** + toàn bộ Cambridge trong gói riêng | Dành riêng |
| Idea Bank | 12 × 10 | **25 chủ đề × 15 ý** | Có dữ kiện + nguồn |

**Năng lực cần có:**
- **Audio:** 250 episode × ~2,5 MB ≈ 625 MB, **vượt trần 400 MB của site công khai**. Phương án (`10b` §0):
  - opus 32 kbps (nhẹ hơn khoảng 2×);
  - gói audio tải theo unit, không đưa vào build;
  - audio người thật để ở **gói riêng/local**.
- **Soi chất lượng ở quy mô lớn:** mỗi lô 100 item đi qua: model khác hãng kiểm 100% → bộ kiểm tự động (`10` §1) → soi mẫu 10%. Tốc độ mục tiêu: 300–500 item soát xong/ngày/làn.
- **Ưu tiên khi chưa đủ năng lực:**
  1. đủ mục tiêu `10` §0;
  2. rồi chủ đề đón đầu;
  3. rồi mức max theo thứ tự Writing/Speaking (người Việt yếu nhất) → Reading → Listening.

## 5. Task (thêm vào `02` NC-2)
| Task | File | Việc | Done |
|---|---|---|---|
| **NC2-T** Xu hướng | `scripts/data2/trends/**`, `data-src/trends/**`, `public/data/v2/trends/**` | 4 script ở §2; nhập thống kê gói riêng (chỉ số đếm); đọc forecast + MXH theo `03`; xuất `weights.json`; cập nhật danh sách đón đầu | Ma trận chủ đề ≥ 21 bộ Cambridge (nếu Bang có) + 4 quý forecast; weights dùng được bởi bộ sinh; báo cáo xu hướng 1 trang mỗi quý |
