# 00 · ĐỌC ĐẦU TIÊN · Bộ plan "nâng cấp max" (chạy SAU khi audit-max xong)

> Viết 25/11/2026. Bộ này là **phần tiếp theo** của `docs/audit-max/` (plan cũ). Plan cũ đưa app từ ≈ 3,7 lên ≥ 8,7/10 về **chất lượng sản phẩm** (đúng, sạch, đẹp, juice). Bộ này đưa app lên mức **"luyện được tới IELTS 8.0 thật"**: dữ liệu đủ rộng và hợp pháp, phương pháp học của người đạt band cao, chấm Writing/Speaking có hiệu chỉnh, cơ chế game bám đúng tiêu chí band 8.
> Cùng cách vận hành với `docs/audit-max/antigravity/` (worktree, port, model, review khác model, cổng đo được). File này chỉ ghi phần **khác** và phần **mới**.

## 0. Ba câu trả lời ngắn

1. **Plan cũ đã "level max" chưa?** Về chất lượng sản phẩm thì gần đủ. Về **khả năng đưa người học lên 8.0** thì chưa. Còn thiếu 14 mảng, liệt kê ở `01-DANH-GIA-PLAN-CU.md`. Lớn nhất là:
   - dữ liệu mới chỉ ~2.200 từ và 24 bài đọc;
   - không có Task 1, Idea Bank, Error Boss;
   - chấm Writing/Speaking chưa hiệu chỉnh;
   - Speaking chưa có pipeline;
   - chưa dùng cách học của người đạt 8–9.
2. **Chạy khi nào?**
   - Khi plan cũ đạt cổng **G4**.
   - Nếu plan cũ còn kẹt quota: được chạy sớm các phase **chỉ đụng dữ liệu, script, Python**, vì chúng không chồng file code của plan cũ. Đó là NC-0, NC-1 và phần dữ liệu của NC-2 (xem `02-KE-HOACH.md` §1).
3. **Thứ tự ưu tiên (Bang, giữ nguyên):**
   1. Dữ liệu và đề thi.
   2. Phương pháp học, game design theo band 8 và theo cách người giỏi học.
   3. Chấm điểm, đo lường.
   4. UI/UX, asset, animation, tối ưu.

## 1. Tư duy nền (mọi agent phải hiểu trước khi làm)

- **Band 8 trước, game sau.** Mỗi cơ chế phải trỏ được vào một cụm trong descriptor band 8 hoặc một ngưỡng điểm thô. Cơ chế không trỏ được thì bỏ.
  - Cụm descriptor ví dụ: *"majority of sentences are error-free"*, *"non-systematic errors"*, *"precise meanings"*, *"well extended and supported"*, *"hesitation … content related"*, *"sustain appropriate rhythm"*.
  - Ngưỡng điểm thô: Listening/Reading **35/40 = 8.0**, nghĩa là chỉ được sai 5 câu.
  - Nguồn: R2, R3.
- **Người Việt yếu Speaking (5.61) và Writing (6.06) nhất** (dữ liệu chính thức ielts.org 2024–25), trong khi Listening/Reading đã ≈ 6.4–6.5 (R2 §C). Phân bổ nội dung và thời gian **nghiêng về S và W**.
- **Người đạt 8–9 học bằng:** thời gian dài, **chữa kỹ hơn làm nhiều**, log lỗi/bẫy, bám rubric, input lớn theo sở thích, "học ngược" từ bài mẫu, ghi âm rồi nghe lại, không học thuộc (R3 §B, R5, R6). App biến từng thói quen đó thành vòng chơi.
- **Dữ liệu phải hợp pháp và ghi công được.** Không chép đề Cambridge/IELTS.org/ieltsonlinetests. Đề "giống thật" được soạn theo **đặc tả format**, bằng nguồn mở có license (R1).
- **Chấm bằng AI luôn có khoảng và có hiệu chỉnh.** Người học Việt đã quen việc web AI lệch ±1 band và chấm 2 lần ra 2 điểm (R6 §A). Lợi thế của app là **minh bạch + ổn định + chỉ ra lỗi cụ thể**, không phải một con số "chính xác".

## 2. Danh sách file

| File | Nội dung |
|---|---|
| `00-DOC-DAU-TIEN.md` | File này |
| `01-DANH-GIA-PLAN-CU.md` | Plan cũ có gì, thiếu gì (14 lỗ hổng), giữ gì |
| `02-KE-HOACH.md` | 9 phase NC-0 → NC-8, task, phụ thuộc, song song, cổng |
| `03-NGHIEN-CUU-MXH.md` | Giao thức đọc mạng xã hội (có đăng nhập) để bổ sung định kỳ + mẫu ghi chép + cách loại seeding |
| `04-LUAT-CUNG.md` | Luật cứng mới (`NC-SR-xx`), cộng thêm vào luật của plan cũ |
| `05-DO-KHO-TASK.md` | Độ khó, rủi ro, model, giờ, bước con của từng task |
| `06-PROMPT-MAU.md` | Prompt mẫu riêng cho các loại việc mới (import dữ liệu, sinh đề, hiệu chỉnh chấm, mode mới) |
| `10-DATA-PIPELINE.md` | **Quan trọng nhất**: nguồn, schema, pipeline `scripts/data2`, số lượng mục tiêu, QA, license |
| `10b-GOI-RIENG-LOCAL.md` | **Chế độ dùng riêng**: Gói đề riêng `.lexpack` (đề Cambridge đã mua, sample chính thức, đề tự làm) build ngoài repo, nhập vào iPhone/PC; không bao giờ vào repo/public |
| `10c-XU-HUONG-DE.md` | **Xu hướng ra đề**: 4 nguồn tín hiệu, script đo ma trận chủ đề/dạng câu, 15 chủ đề đón đầu, quy mô dữ liệu **mức max** |
| `11-DE-THI-NOI-DUNG.md` | Đặc tả từng dạng câu của 4 kỹ năng, cách soạn đề gốc hợp pháp, mock test, Idea Bank, ngân hàng Speaking |
| `12-CHAM-DIEM-HIEU-CHINH.md` | Chấm Writing/Speaking: checklist descriptor, gói chấm Claude, anchor, hiệu chỉnh, khoảng band; chấm L/R |
| `13-THIET-KE-GAME-BAND8.md` | Game design: nâng cấp 12 mode + 6 mode mới + cơ chế chung, theo thứ tự band 8 → người giỏi → IOE/app → game design chung |
| `14-LO-TRINH-HOC.md` | Lộ trình 6.0 → 8.0: ngày, tuần, giai đoạn, theo kỹ năng; vai trò màn Hôm nay |
| `15-REPO-CONG-CU.md` | Repo/thư viện dùng ở từng phase (gồm đánh giá 21 repo Bang gửi), lệnh cài, cái cấm |
| `16-SPEAKING.md` | Pipeline Speaking trong trình duyệt: ghi âm, VAD, ASR, phân tích ngập ngừng, Prosody Lab, riêng tư, iOS |
| `17-UI-ASSET-TOI-UU.md` | Phần UI/UX, asset, animation, tối ưu **mới** so với plan cũ (DESIGN.md, impeccable, ngân sách model ML…) |
| `18-DO-LUONG.md` | Chỉ số học thật, band estimator, Elo/FSRS optimizer, tự thí nghiệm 1 người |
| `19-BAY-GHI-CHU.md` | Bẫy đã biết (dữ liệu, license, seeding, model, iOS) |
| `nghien-cuu/R1…R6` | Báo cáo nghiên cứu gốc có nguồn (đọc khi cần chi tiết) |

## 3. Thứ tự đọc

**Điều phối:**
1. `00`
2. `01`
3. `02`
4. `04`
5. `05`
6. `10`
7. `13`
8. `19`
9. Lướt các file còn lại.
10. Đọc lại `docs/audit-max/antigravity/03-CAC-BUOC.md`: cách tạo worktree, port, review, merge **giữ nguyên**.

**Agent con:** đọc theo prompt mẫu `06`. Luôn đọc `00`, `04`, `19` và file mảng của task.

## 4. Quan hệ với plan cũ

| Nội dung | Plan cũ (`docs/audit-max`) | Bộ này |
|---|---|---|
| Vận hành (worktree, port, merge, review khác model, quota) | **Dùng nguyên** `antigravity/03`, `04` | Chỉ thêm luật `NC-SR` |
| Luật CHẶN/NẶNG/NHẸ, `audit-ui.mjs`, `KIEM-THU.md` | **Dùng nguyên** | Thêm kiểm mới ở `18` |
| 9 game đang có | Sửa đúng, juice, UI | **Nâng cấp cơ chế học** (giữ công đã làm, SR-90) |
| Dữ liệu | Sửa lỗi D1–D19, audio đủ | **Mở rộng quy mô**, nguồn mới, đề gốc theo đặc tả |
| S1/S2/X1 | Đợt 5, phối hợp M5 | **Thiết kế đầy đủ** ở `13`, `16`, `11` |

Khi bộ này mâu thuẫn với `DECISIONS.md` hoặc `docs/audit-max/LUAT.md` thì hai file đó thắng. Agent ghi mâu thuẫn vào `docs/nang-cap-max/HANDOFF.md`, AD quyết rồi ghi `DECISIONS.md`.
