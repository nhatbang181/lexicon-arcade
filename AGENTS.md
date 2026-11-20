# AGENTS.md: luật project cho mọi agent và worker

> Project: **Lexicon Arcade V3 "Lộ trình 8.0"**, app học IELTS Academic dạng game, đưa Bang từ khoảng 6.0 lên 8.0.
> Đọc theo thứ tự: file này → `docs/00-SPEC.md` → các file docs ghi trong brief → `DECISIONS.md` → `PROGRESS.md`.

## 1. Nguồn sự thật
- **Mâu thuẫn thì xử theo thứ tự ưu tiên:** `DECISIONS.md` > `docs/games/*.md` và `docs/01…13` > `docs/00-SPEC.md` > code hiện có.
- `docs/archive/**` là lịch sử. **Không** làm theo.
- Quyết định nhỏ tự chọn (tên biến, thư viện thông dụng, bố cục phụ) thì ghi 1 dòng vào `DECISIONS.md`: ngày, ai, quyết định, lý do.

## 2. Luật code
- TypeScript strict. React 19 function component. Tailwind 4 + CSS variables trong `src/design/tokens.css`. Không hard-code màu: dùng token.
- **Logic thuần** (`src/core/**`, `src/games/*/engine.ts`) không import React và không đụng DOM. Phải có unit test (Vitest).
- Mỗi game là một module lazy-load theo hợp đồng `docs/03-ARCHITECTURE.md` §3.1. Game không import game khác. Dùng chung qua `src/core`, `src/design`, `src/games/_shared`.
- **Lưu trữ bền** dùng IndexedDB (Dexie) qua `src/core/storage/repos`. `localStorage` chỉ dùng cho code legacy.
- Animation dùng `motion/react` theo preset `src/design/motion.ts`. Chỉ animate transform và opacity.
- **Không sửa** `src/legacy/**`, trừ việc sửa đường dẫn import khi di chuyển.
- Asset tham chiếu qua `import.meta.env.BASE_URL` (app chạy dưới `/lexicon-arcade/` ở production).
- **Lệnh kiểm tra:**
  ```
  npm run build
  npm test
  npm run validate:data
  npm run e2e
  npm run shots
  ```

## 3. Luật dữ liệu
- Mọi nội dung học theo schema `docs/04-DATA-SPEC.md` và đi qua đủ quy trình `docs/05-DATA-PIPELINE.md` (G1–G5) trước khi vào `public/data`.
- **Không đổi ID** của item đã phát hành.
- **Bản quyền:** không đưa nội dung Cambridge IELTS hay sách thương mại vào repo. Không gán phát hiện bịa cho tổ chức hay người thật. Xem `05` §1.
- Audio học render offline bằng Kokoro (`docs/06-AUDIO-PIPELINE.md`). **Cấm** dùng `speechSynthesis` cho nội dung học.

## 4. Luật asset và tải file
- Chỉ tải từ allowlist `docs/11-ASSETS.md` §1. Tải vào `scripts/assets/_downloads/` (gitignore).
- Không chạy file thực thi tải về. Mọi file asset dùng trong app phải được ghi vào `public/assets/CREDITS.md`.

## 5. Chấm bài: không API, không tốn tiền
- App **không gọi bất kỳ API AI nào**, không có API key, không có SDK AI. Writing và Speaking chấm bằng gói chấm copy/dán qua Claude chat (`docs/07-GRADING-WITH-CLAUDE.md`).
- Prompt chấm chỉ có **một nguồn**: `docs/grading/*.md`, app import bằng `?raw`. Sửa prompt thì tăng `PROMPT_VERSION`.
- Không thêm dịch vụ trả phí hay cần thẻ (API, Azure, TTS trả phí…) khi Bang chưa đồng ý.
- **Công cụ miễn phí và tốt thì được tự dùng** (Bang duyệt chung 2026-11-20): thư viện mã nguồn mở, edge-tts, asset CC0… Ghi 1 dòng vào `DECISIONS.md`. Vẫn phải tuân thủ allowlist tải file ở §4 và luật bản quyền ở §3.

## 6. Khi nào DỪNG và hỏi Bang
Danh sách cuối của `docs/12-MASTER-PLAN.md`:
- bất cứ thứ gì tốn tiền hoặc cần tài khoản trả phí
- xoá legacy
- audio > 400 MB
- đổi phạm vi spec

## 7. Báo cáo của worker (≤ 10 dòng)
Gồm 4 phần:
- đã làm gì
- file nào
- cổng nào đã chạy và kết quả (dán số liệu)
- chỗ nào chưa chắc

Cập nhật `PROGRESS.md` khi xong task.

## 8. Git
- Commit nhỏ theo task, message dạng `feat(v1): …`, `data(reading): …`, `docs: …`.
- Không commit `node_modules`, `dist`, `scripts/assets/_downloads`, file `.env`.
