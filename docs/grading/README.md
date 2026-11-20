# Chấm bài bằng Claude: hướng dẫn cho Bang

Không cần API key, không tốn thêm tiền. Dùng gói Claude bạn đang có.

## Cách 1: từ trong app (khuyên dùng)
1. Làm bài trong W1 (Essay Lab), S1 (Mock Examiner), hoặc kết thúc một phiên W2/S2.
2. Bấm **📋 Copy gói chấm**.
3. Mở Claude (claude.ai hoặc app Claude, chọn model mạnh nhất bạn có). Dán vào và gửi.
4. Copy **toàn bộ** câu trả lời của Claude, quay lại app, bấm **📥 Dán kết quả**, dán vào.
5. App hiện báo cáo, lưu vào Portfolio, tạo thẻ ôn tập từ lỗi của bạn.

Nếu app báo "JSON chưa đúng", bấm **📋 Copy lời nhắc sửa**, gửi cho Claude, rồi dán lại câu trả lời mới.

## Cách 2: không qua app
Trong phiên Claude Code mở ở thư mục này, gõ:
```
Chấm bài Writing Task 2 này theo docs/grading/WRITING.md.
Đề: <dán đề>
Bài: <dán bài>
```
Speaking thì dùng `docs/grading/SPEAKING.md`, kèm transcript.

## Mẹo để chấm ổn định
- Mỗi bài chấm trong **một cuộc trò chuyện mới**, để bài trước không ảnh hưởng điểm bài sau.
- Không sửa nội dung gói chấm. Gói đã có sẵn rubric và định dạng.
- Có điểm thật (thi thật, giáo viên chấm) thì nhập vào Portfolio. App sẽ tính Claude chấm lệch bao nhiêu so với thực tế.
