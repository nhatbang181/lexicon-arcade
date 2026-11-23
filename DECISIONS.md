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
- 2026-11-20 · r-shell / r-core / r-assets · Chốt M0: dùng `ts-fsrs@6.0.0`, `zod@4.6.7`, `howler` audio sprite chuẩn hóa −20 LUFS (hỗ trợ cả 12 tên cue chính lẫn 8 alias trong `docs/10`), lazy-load `src/legacy/App.tsx` tại `#/legacy`.
- 2026-11-20 · r-audio-vocab · Dùng `edge-tts` giọng UK (`en-GB-SoniaNeural`, 24 kHz mono 48 kbps, loudnorm −16 LUFS, 537 từ ưu tiên = 2.63 MB) cho audio vocab offline theo phương án công cụ miễn phí đã duyệt (B.6–B.7) để tránh phụ thuộc `espeak-ng` trên Windows.
- 2026-11-20 · r-m1-fix · Chuẩn hóa LF (`\r\n`→`\n`) khi tính SHA-256 ở `60_build_manifest.mjs` và `run_all.mjs` để `validate:data` ổn định 100% giữa Windows (CRLF) và Linux CI (LF).
- 2026-11-21 · r-audio-listening · Hoàn thành M3 listening/dictation audio: map đa speaker qua edge-tts (UK, US, AU, NZ, CA), calibrated atempo matching cho dictation WPM ([INV-D1] lệch < 1.5%), render 4 episode (p1_001..p4_001) + 60 dictation (L1–L6), tổng public/audio 10.67 MB << 400 MB.
- 2026-11-21 · coordinator · Chốt M4 dữ liệu Writing ở mức 60 Task 2 (10/loại × 6) + 24 Task 1 (đủ 7 loại) + 50 clichés theo `docs/12-MASTER-PLAN.md` M4; mở rộng lên ngưỡng đầy đủ `INV-W4` (90 Task 2 / 42 Task 1) ở M7 sau khi đủ 12 game. Mở `vitest.config.ts` include `*.test.{ts,tsx}` để tự động chạy test UI component (`ChartRenderer.test.tsx`).
- 2026-11-23 · Bang (qua audit-max) · **Chấp nhận rủi ro** deploy công khai audio do edge-tts sinh (vocab, dictation, listening; điều khoản ghi "personal use"). Không bắt buộc render lại bằng Kokoro. Vẫn ghi `audioProvenance {engine, voice, license}` cho từng file và liệt kê trong `public/audio/CREDITS.md` · Lý do: ưu tiên có đủ audio nhanh, app 1 người dùng, không thương mại.
- 2026-11-23 · Bang (qua audit-max) · **Có nhân vật dẫn đường** (thay quy định "không mascot" ở `docs/08-DESIGN-SYSTEM.md` §6). Nhân vật TẢI từ gói có giấy phép (không tự vẽ), chỉ xuất hiện ở màn khung (Hôm nay, Hub, Thống kê, Recap, Onboarding, empty state), không bao giờ ở vùng chữ học hay Exam; không dùng cú/chim xanh để khỏi giống Duolingo. Tên mặc định "Lexi" (Bang đổi được). Chi tiết: `docs/audit-max/03-ANIMATION-FEEDBACK.md` §5b, `LUAT.md` M3, K10.
- 2026-11-23 · Bang (qua audit-max) · **Giấy phép asset thoải mái** (dự án phi lợi nhuận): được tải và dùng mọi asset/animation/GIF/SFX/nhạc/font/UI kit **miễn phí** (CC0, CC-BY, CC-BY-NC, MIT, OFL, Apache, Lottie Simple License, Pixabay/Pexels license, "free for personal/non-commercial", nguồn yêu cầu tài khoản miễn phí), được sửa và ghép; được tìm thêm trên web, GitHub, itch.io, OpenGameArt… ngoài allowlist `docs/11-ASSETS.md` §1. Vẫn cấm: bản lậu gói trả phí, rip asset từ game/app thương mại, nguồn bắt buộc trả tiền. Vẫn phải ghi nguồn đủ trường (để truy nguồn và kiểm chất lượng). Danh mục nguồn: `docs/audit-max/08-NGUON-ASSET.md`.
