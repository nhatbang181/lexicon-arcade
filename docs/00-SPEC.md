# 00 · SPEC 1 trang – Lexicon Arcade V3 "Lộ trình 8.0"

> Đây là spec cấp sản phẩm (chế độ "cả sản phẩm" của `/dieu-phoi`). Bang duyệt spec này một lần.
> Chi tiết nằm trong các file `docs/01…13` và `docs/games/*.md`. Khi có mâu thuẫn, file chi tiết thắng spec này, `DECISIONS.md` thắng tất cả.

## 1. Mục tiêu
Đưa **Bang** từ khoảng **IELTS 6.0 overall** (chưa rõ điểm từng kỹ năng, nền khá) lên **8.0 Academic**.
- Listening ≥ 35/40, Reading ≥ 35/40.
- Writing ≥ 7.5, Speaking ≥ 7.5–8.0.

App phải làm được 3 việc, theo thứ tự ưu tiên:
1. **Học được nhiều:** mỗi phút trong app là một phút luyện đúng kỹ năng mà bài thi chấm.
2. **Dễ học:** mở app là biết hôm nay học gì, không phải tự quyết định.
3. **Muốn học tiếp:** thấy rõ mình tiến bộ, phiên học ngắn, có nhịp hằng ngày, phản hồi tức thì.

## 2. Người dùng
- Một người dùng chính là Bang. Dùng trên PC Windows (Chrome hoặc Edge), có micro và tai nghe. Có thể mở thêm trên điện thoại.
- Học khoảng 45–90 phút mỗi ngày, chia thành các phiên 5–20 phút.
- Không có giáo viên. Writing và Speaking được chấm bằng **Claude chat theo cách copy và dán** (app tạo "gói chấm", Bang dán vào Claude rồi dán kết quả lại). **App không gọi API, không tốn tiền.**

## 3. Sản phẩm gồm gì
**12 chế độ, chia 6 nhóm.** Không làm thêm game ngoài danh sách này nếu Bang chưa đồng ý.

| Nhóm | Mã | Tên | Một câu mô tả |
|---|---|---|---|
| Từ vựng | V1 | **Daily Run** | Ôn thẻ đến hạn theo lịch FSRS dưới dạng "chạy màn": tự nhớ ra, gõ ra, nghe ra |
| Từ vựng | V2 | **Collocation Forge** | Tự gõ ra collocation học thuật, bắt collocation "kiểu Việt" sai |
| Từ vựng | V3 | **Paraphrase Radar** | Tìm cụm paraphrase trong văn bản trước khi hết giờ, cầu nối sang Reading/Listening |
| Listening | L1 | **Trap Detector** | Mini-section đúng format đề Part 1–4, bẫy được cài và giải thích, tua lại đúng chỗ bẫy |
| Listening | L2 | **Dictation Ladder** | Chép chính tả cả câu, tốc độ và giọng tăng dần, phân tích lỗi nối âm, âm cuối |
| Reading | R1 | **TFNG Judge** | Phải highlight câu làm bằng chứng mới được phán True/False/Not Given hoặc Yes/No/Not Given |
| Reading | R2 | **Headline Editor** | Matching Headings: tìm ý chính, loại tiêu đề bẫy |
| Writing | W1 | **Essay Lab** | Viết Task 1/Task 2 → tự chấm checklist + bài mẫu → gói chấm cho Claude → dán kết quả 4 tiêu chí có trích dẫn → sửa → chấm lại |
| Writing | W2 | **Writing Sprints** | Overview Sprint (Task 1, 90 giây) và Idea Sprint (Task 2, 3 phút) |
| Speaking | S1 | **Mock Examiner** | Thi thử Part 1–2–3 với giọng giám khảo thu sẵn, ghi âm, transcript, chỉ số fluency; gói chấm cho Claude để có 4 tiêu chí |
| Speaking | S2 | **3-Second Rule** | Phải bắt đầu nói trong vòng 3 giây, khung Answer → Reason → Example, phá thói quen dịch |
| Thi thử | X1 | **Exam Room** | Mô phỏng bài thi trên máy tính (Listening 4 part, Reading 3 passage), tính band ước lượng |

**Hệ thống dùng chung:**
- Kho item và bộ não FSRS chung: mọi từ, cụm từ, bẫy, lỗi sai đều là một thẻ.
- Bài kiểm tra đầu vào (placement).
- Trang "Hôm nay" với kế hoạch học tự động.
- Đồng hồ band ước lượng cho từng kỹ năng.
- Thống kê, chuỗi ngày học (streak), XP.
- Cài đặt (âm thanh, giọng đọc, mục tiêu), sao lưu và khôi phục.

## 4. Không làm (non-goals)
- Không có leaderboard, chế độ nhiều người chơi, tài khoản đăng nhập hay server riêng. App tĩnh, dữ liệu nằm trên máy.
- Không làm game hành động mà kỹ năng điều khiển không liên quan tới tiếng Anh. Ví dụ rắn ăn đáp án, bắn quái: giỏi điều khiển không làm giỏi tiếng Anh.
- Không làm General Training. Chỉ làm Academic.
- Không đưa nội dung có bản quyền (Cambridge IELTS 1–20, sách giáo trình) vào repo.

## 5. Anti-goals: những điều làm sản phẩm thất bại dù vẫn chạy được
- Bang chơi nhiều nhưng band thi thử không tăng sau 8 tuần. Nguyên nhân thường là game chỉ luyện nhận diện và thiếu phần tự sản xuất ngôn ngữ.
- Dữ liệu sai: đáp án TFNG mơ hồ, collocation không tự nhiên, IPA sai, audio đọc sai. **Một item sai làm hỏng niềm tin vào cả app.**
- Cơ chế phạt làm Bang bỏ ngang: game over giữa chừng, mất streak vì một ngày bận.
- Giao diện đẹp nhưng chậm, giật, hoặc không giống giao diện thi trên máy khi ở chế độ thi.

## 6. Tiêu chí "xong" của cả sản phẩm
1. Đi hết luồng chính trên Chrome desktop không có lỗi console:
   Onboarding → Placement → Hôm nay → mỗi chế độ 1 phiên → Kết quả → Thống kê → Sao lưu/Khôi phục.
2. Mỗi chế độ đạt **"Definition of Done"** trong `docs/13-QA-AND-POLISH.md`: build, test, validator dữ liệu, ảnh chụp ở 3 độ rộng, ngân sách hiệu năng.
3. Dữ liệu đạt số lượng tối thiểu trong `docs/05-DATA-PIPELINE.md` §6 và qua đủ các cổng chất lượng.
4. App **không có chi phí vận hành**: không API key, không dịch vụ trả phí. Mọi chế độ chạy được ngay. W1/S1/W2/S2 có luồng gói chấm và dán kết quả hoạt động với fixture câu trả lời Claude thật.
5. Deploy lên GitHub Pages trả về HTTP 200. Có PWA cài được và chạy offline (trừ nhận dạng giọng nói của trình duyệt).

## 7. Mốc
M0 Nền móng → M1 Từ vựng → M2 Reading → M3 Listening → M4 Writing → M5 Speaking → M6 Thi thử, band và polish.
Chi tiết xem `docs/12-MASTER-PLAN.md`.
