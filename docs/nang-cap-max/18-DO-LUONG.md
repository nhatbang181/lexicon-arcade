# 18 · ĐO LƯỜNG · tiến bộ thật, band estimator, tự thí nghiệm 1 người

> Nguồn: R3 §3, §6. Mọi dữ liệu chỉ lưu cục bộ (không analytics bên ngoài).

## 1. Chỉ số (NC6-A ghi log sự kiện, NC6-C hiển thị)
| Nhóm | Chỉ số | Mục tiêu band 8 |
|---|---|---|
| Ghi nhớ | Recall thật 7/30 ngày so với recall FSRS dự đoán; stability trung vị | Lệch ≤ 3% so với desired retention |
| Lỗi | **Tái xuất mã lỗi** / 1.000 từ (W) và / 10' nói (S); số Boss đang sống / đã hạ | Lỗi hệ thống → 0 |
| GRA | **% câu không lỗi** (W1, S1) | > 50% rồi > 70% |
| TR | Câu over-generalise / bài; % luận điểm có ví dụ cụ thể | ≤ 1; 100% |
| CC | Từ nối / 100 từ; lỗi tham chiếu | 3–6 |
| FC | Pause giữa cụm / phút; nói liền mạch trung vị | Giảm; tăng |
| L/R | Raw /40 (mock đầy đủ); lỗi theo mã bẫy/dạng câu; ngân sách lỗi còn | ≥ 35; ≤ 5 lỗi |
| Band | Khoảng band theo kỹ năng; **trajectory** (độ dốc 4 tuần); calibration (dự đoán − thực tế) | Dốc dương; lệch ≤ 0,5 |
| Grader | MAE/bias so với anchor; SD giữa các lần chấm | ≤ 0,5; ≤ 0,25 |
| Hành vi | Phút/ngày theo 4 mạch; ngày hoạt động/tuần; tỷ lệ phiên kết thúc tự nhiên | Cân bằng; ≥ 5 ngày |

## 2. Thích ứng (NC6-B)
- **Elo theo kỹ năng con:** TFNG, YNNG, Headings, MCQ-L, map, form, collocation, mạo từ, thì…
  - Độ khó item lấy prior từ đặc trưng (Zipf, độ dài, dạng, loại bẫy, tốc độ nói) rồi cập nhật on-the-fly (Pelánek 2016).
  - K-factor giảm dần theo số quan sát.
  - Chọn item có P(đúng) ≈ 0,85 khi luyện; mock thì theo phân bố đề thật.
- **FSRS optimizer cá nhân:** khi ≥ 1.000–2.000 review, chạy trong Worker (bản JS của optimizer FSRS, hoặc fit offline bằng script Python rồi nạp tham số). Desired retention theo nhóm (lõi 0,90; phụ 0,85; 2–4 tuần cuối trước thi lõi 0,93–0,95).
- **Mã lỗi là thẻ FSRS** (Error Boss).
- **BKT tuỳ chọn** cho "skill gate" nhị phân (phân biệt NG/F).

## 3. Band estimator
- L/R: trung bình 3 mock đầy đủ gần nhất (lần làm đầu) ± sai số; hiển thị "sát ngưỡng".
- W/S: khoảng đã hiệu chỉnh (`12` §4); cận dưới dùng cho Band Gate.
- Overall: trung bình 4 kỹ năng, làm tròn nửa band; hiện **tiêu chí kéo xuống nhiều nhất**.

## 4. Tự thí nghiệm (1 người)
1. **Ngẫu nhiên theo item:** từ/collocation mới chia 2 điều kiện (vd generate-first vs recognize-first), đo recall 7/30 ngày. Khoảng 100 item mỗi nhóm; phân tích beta-binomial.
2. **ABAB theo tuần** cho thay đổi cấp phiên (juice bật/tắt, interleave hay block cho TFNG). Mỗi pha ≥ 1 tuần, ≥ 2 chu kỳ.
3. **Feedback ngay hay sau 24 h** cho W2: đo tái xuất lỗi ở bài kế.
4. **Kiểm grader mỗi tháng:** chấm lại 5 anchor + 2 bài cũ.
5. **Ghi trước giả thuyết** trong app (1 dòng).
6. **Mốc ngoài mỗi 6–8 tuần:** 1 đề Cambridge đầy đủ điều kiện thật (gói riêng); nếu có thể, 1 lần người thật chấm W/S.

## 5. Kiểm tự động mới (thêm vào bảng KIEM-THU §2, AD sửa)
- `validate:data:v2`: spec, coverage, provenance, license, blind-solve 100%, WER ≤ 8%.
- `e2e/nang-cap-*.spec.ts`: Error Boss (lỗi W1 → Boss → drill → hạ sau 3 bài); Mổ đề → Elo; nhập `.lexpack` mẫu → chơi offline.
- `grader-calib` (script): MAE/SD trên anchor; fail nếu vượt ngưỡng.
