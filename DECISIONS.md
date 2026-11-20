# DECISIONS.md – Lexicon Arcade V3 "Lộ trình 8.0"

> File này ưu tiên cao nhất khi có mâu thuẫn (xem `AGENTS.md` §1). Mỗi dòng gồm: ngày · ai · quyết định · lý do.
> Quyết định V2.0 cũ nằm ở `docs/archive/v1-2026-11-17/DECISIONS-v2.md` và **đã bị thay thế**.

## A. Quyết định sản phẩm (2026-11-20 · Claude Code brainstorm cùng Bang)
1. **Chuyển từ "nhiều game arcade" sang 12 chế độ chất lượng cao** (V1–V3, L1–L2, R1–R2, W1–W2, S1–S2, X1).
   - Lý do: Bang muốn ít game nhưng game nào cũng thật chất lượng.
   - Nghiên cứu cho thấy gamification chỉ tăng động lực, không tăng trí nhớ. Vì vậy cơ chế chơi phải chính là hành động học.
2. **Bỏ** các game mà kỹ năng điều khiển không liên quan tới tiếng Anh (Snake, Defusal, Soul Knight…). Chuyển chúng vào `src/legacy/`, ẩn sau Cài đặt. **Không xoá** khi Bang chưa đồng ý.
3. **Điểm xuất phát:** Bang khoảng 6.0 overall, chưa rõ từng kỹ năng. Do đó có placement, và target mặc định L 8.5 / R 8.5 / W 7.5 / S 7.5 (profile A ở `docs/01` §1).
4. **Chỉ làm Academic.** Đề 2026 chỉ đổi sang thi trên máy, không đổi nội dung. Exam mode mô phỏng giao diện thi máy.
5. **Một bộ não SRS chung (FSRS, `ts-fsrs`) cho mọi item.** Thay cho Mistake Bank cũ. Retention 0,90, khoảng cách tối đa 365 ngày.
6. **Không game over trong chế độ luyện.** Streak có lượt đóng băng.
7. **Lộ trình nói thật:** 9–18 tháng để lên 8.0.

## B. Quyết định kỹ thuật
1. **Lưu trữ:** IndexedDB qua Dexie. Router: wouter (hash). Animation: motion. SFX: howler. Schema: zod. Test: Vitest + Playwright.
2. **Audio học:** render offline bằng Kokoro-82M (Apache-2.0). **Cấm** dùng `speechSynthesis` cho nội dung học. Encode MP3 mono 48 kbps. Ngưỡng `public/audio` ≤ 400 MB.
3. **Chấm bài: không API, 0 đồng** (Bang quyết định, 2026-11-20). App tạo "gói chấm" (rubric + đề + bài). Bang dán vào Claude chat, rồi dán kết quả JSON lại. App kiểm bằng zod và hậu kiểm.
   - Prompt chuẩn ở `docs/grading/*.md`, có `PROMPT_VERSION`.
   - Bỏ các bước tốn tiền: API key, SDK, hiệu chỉnh trả phí, TTS live.
   - Độ chính xác được kiểm dần bằng điểm thật Bang nhập vào (`07` §6).
   - Những chỗ trước dự định "AI chấm nhanh" (W2, S2, V1 `use`, V2 level cao) chuyển sang checklist tự chấm + bài mẫu, có gói chấm gộp tuỳ chọn.
4. **Phát âm trong Speaking** chỉ ước tính gián tiếp (transcript và ASR). Không dùng dịch vụ trả phí.
5. **Dữ liệu V2 cũ** (`anki_vocab.json`, `ielts_4skills.json`, `ielts_strategies.json`) giữ nguyên cho legacy. Dùng làm đầu vào chuyển đổi, phải qua verifier vì phần lớn do LLM sinh.
6. **Công cụ miễn phí:** Bang duyệt chung (2026-11-20) "cái nào miễn phí tốt thì cứ dùng". Worker tự chọn công cụ hoặc thư viện miễn phí, ghi 1 dòng ở mục D. Thứ tốn tiền hay cần tài khoản trả phí thì vẫn phải hỏi.
7. **Giọng Úc/NZ/Canada:** dùng `edge-tts` cho khoảng 25% episode Listening và khoảng 20% dictation level ≥ 5 (`docs/06` §2.1). Bang đã duyệt 2026-11-20.
8. **Bản quyền:** không dùng nội dung Cambridge IELTS. Passage và episode tự sinh và qua blind-solve. Wikipedia được chỉnh sửa (CC BY-SA). The Conversation chỉ dùng nguyên văn.

## C. Đang chờ Bang
- [ ] Ngày thi dự kiến (để planner đếm ngược, không bắt buộc)

## D. Nhật ký quyết định nhỏ (worker ghi tiếp bên dưới)
- 2026-11-20 · claude-code · Chuyển docs V1/V2 vào `docs/archive/v1-2026-11-17/` · gom tài liệu, tránh worker làm theo plan cũ.
