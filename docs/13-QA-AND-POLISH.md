# 13 · QA và Polish: Definition of Done, checklist

## 1. Definition of Done cho MỖI game (cổng chung, cộng thêm cổng riêng §12 của file game)
- [ ] `npm run build` 0 lỗi, 0 cảnh báo TypeScript mới.
- [ ] `npm test` pass. `engine.ts` của game có test cho mọi luật chấm điểm ghi trong §4 của file game.
- [ ] `npm run validate:data` pass (với data game dùng).
- [ ] E2E của game pass (`e2e/<gameId>.spec.ts`), **chơi được chỉ bằng bàn phím**.
- [ ] Ảnh chụp ở **360×780, 768×1024, 1280×800**, theme tối và sáng, lưu `e2e/__screenshots__/<gameId>/`. Không tràn chữ, không cuộn ngang, không chồng lấn.
- [ ] axe-core: 0 vi phạm mức serious/critical.
- [ ] Reduced motion hoạt động (`10` §4).
- [ ] Chunk của game nằm trong ngân sách (`03` §9).
- [ ] Không có `console.error` hay cảnh báo React key trong lượt E2E.
- [ ] Thoát giữa phiên vẫn lưu phần đã làm. Recap đúng số liệu.
- [ ] SessionResult ghi SRS, XP, streak, band evidence đúng (test đọc lại DB).
- [ ] Copy UI tiếng Việt có dấu đúng, theo giọng văn `08` §7.
- [ ] `DECISIONS.md` ghi mọi quyết định nhỏ đã tự chọn.

## 2. Checklist polish (chạy ở M6 bằng `r-polish`, `rv-final` soi lại)
**Cảm giác chơi:**
- Mọi nút có trạng thái hover, active, focus, disabled rõ.
- Mọi hành động có phản hồi trong ≤ 100 ms (âm thanh, hình ảnh).
- Nộp đúng → câu kế tiếp ≤ 1,2 giây (không phải chờ khi đúng). Khi sai thì chờ Enter.
- Số liệu (XP, combo, điểm) đếm hoặc nảy, không nhảy cụt.

**Chữ và nội dung:**
- Bài đọc 18 px / 1.7, tối đa 68ch. Câu hỏi ≥ 18 px.
- IPA hiển thị đúng glyph.
- Không có chữ bị cắt `...` ở vùng nội dung học.

**Trạng thái:** loading (skeleton), rỗng, lỗi, offline, bài chờ chấm, dán kết quả sai định dạng, thiếu mic. Mỗi trạng thái có ảnh chụp.

**Âm thanh:**
- SFX không chồng nhau quá 2 tiếng cùng lúc.
- Chặn SFX khi audio học đang phát.
- Âm lượng chung tuân theo Settings.

**Nhất quán:**
- Cùng component cho cùng việc: AnswerInput, ChoiceButton, FeedbackPanel, RecapScreen dùng chung.
- Phím tắt giống nhau giữa các game (`09` §6).

**Exam mode:** không có màu kỹ năng, không XP, không SFX (trừ `timeup`), giống giao diện thi máy.

## 3. Kiểm thử dữ liệu (định kỳ)
- Mỗi tuần (hoặc mỗi lần merge data): `validate:data` + lấy ngẫu nhiên 5 item mỗi loại để đọc lại, ghi `REVIEW_LOG.md`.
- **Báo lỗi trong app:** mỗi FeedbackPanel có nút "⚑ Báo item sai". Lưu vào `kv['flags']`, Thống kê hiện danh sách. Item bị flag thì tạm ẩn khỏi pool cho tới khi xử lý. Xuất ra JSON để worker sửa.

## 4. Kiểm thử học tập (sau 4 tuần dùng thật, Bang tự đánh giá)
- Band X1 L/R có tăng không?
- Tỷ lệ nhớ lượt đầu (V1) có ≥ 85% không? Nếu < 80% thì giảm thẻ mới mỗi ngày.
- Streak có giữ được không? Nếu bỏ giữa chừng nhiều thì xem lại độ dài phiên và mục tiêu ngày.
- Ghi kết quả vào `PROGRESS.md` mục "Hiệu quả học".
