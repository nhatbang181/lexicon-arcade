# 07 · Chấm Writing và Speaking bằng Claude chat (0 đồng, không API key)

> **Quyết định (2026-11-20, Bang):** app **không gọi API AI nào**, nên không có API key và không tốn tiền.
> Chấm Writing và Speaking theo cách **copy và dán**:
> 1. App đóng gói bài làm thành một **"Gói chấm"** (văn bản có sẵn rubric, đề, bài, định dạng trả lời).
> 2. Bang dán gói đó vào **Claude** (claude.ai, app Claude, hoặc phiên Claude Code trong repo này). Phần này nằm trong gói Claude Bang đang dùng, không mất thêm tiền.
> 3. Claude trả lời bằng nhận xét tiếng Việt kèm **một khối JSON**.
> 4. Bang copy câu trả lời, dán lại vào app ("Dán kết quả"). App kiểm tra JSON, hiển thị báo cáo, lưu vào portfolio, tạo thẻ ôn tập.
>
> Bang cũng có thể **bỏ qua app**: dán bài thẳng cho Claude kèm câu "chấm theo `docs/grading/WRITING.md`". Kết quả vẫn đúng format để dán vào app sau.

## 1. Vì sao chọn cách này
- **Không tốn tiền, không cài đặt:** không có API key, không SDK, không hiệu chỉnh tốn phí.
- **Chất lượng chấm giữ nguyên**, vì vẫn là model Claude mạnh, cộng thêm rubric chuẩn trong gói chấm.
- **Đánh đổi:** thêm 2 thao tác copy và dán, và không chấm tự động được trong lúc chơi.
  - Vì vậy những chỗ trước đây định dùng "AI chấm nhanh" (W2, S2, V1 face `use`, V2 level cao) giờ dùng **checklist tự chấm và so với bài mẫu**.
  - Riêng W2 và S2 có tuỳ chọn **gói chấm gộp cả phiên**.
- **Giới hạn đã biết:** LLM chấm IELTS khớp giám khảo ở mức trung bình đến khá ([PACLIC 2024](https://preview.aclanthology.org/moar-dois/2024.paclic-1.36.pdf), [tổng quan](https://arxiv.org/pdf/2507.19980)). App luôn ghi "band ước tính", trọng tâm là **feedback hành động được**.

## 2. Nguồn sự thật của prompt
- Prompt chuẩn nằm trong `docs/grading/`:
  - `WRITING.md`: Task 1 và Task 2
  - `SPEAKING.md`
  - `SPRINTS.md`: W2 và S2 gộp phiên
  - `README.md`: hướng dẫn cho Bang
- App **import thẳng** các file này bằng Vite `?raw`, ví dụ `import writingPrompt from '../../../docs/grading/WRITING.md?raw'`. Nhờ vậy prompt trong app và prompt Bang dùng tay **luôn là một**.
- Mỗi file có dòng `PROMPT_VERSION: w-1.0`. Phiên bản này được ghi vào kết quả (`promptVersion`) để biết bài nào chấm bằng rubric nào.

## 3. Gói chấm (`src/core/grading/packet.ts`)
`buildPacket(kind, attempt)` trả về một chuỗi Markdown gồm:
1. Nội dung file prompt tương ứng (rubric, luật chấm, định dạng output).
2. Khối `## BÀI CẦN CHẤM`:
   - `attemptId`, ngày
   - loại bài (task1, task2, speaking, w2_overview…)
   - đề bài (Task 1: kèm dữ liệu biểu đồ dạng bảng Markdown, cộng danh sách `keyFeatures`)
   - bài làm nguyên văn
   - số từ do app đếm
   - thời gian đã dùng
   - chế độ (exam/training)
   - nếu là chấm lại: danh sách issue lần trước kèm bài sửa
3. Dòng kết thúc: "Trả lời theo đúng mục OUTPUT ở trên. Khối JSON phải nằm cuối câu trả lời."

**UI:**
- Nút **"📋 Copy gói chấm"**. Copy xong hiện toast "Đã copy. Dán vào Claude rồi copy toàn bộ câu trả lời về đây".
- Nút phụ **"⬇ Tải .md"**, đặt tên file `cham_<attemptId>.md`.
- Nút **"Mở Claude"** mở `https://claude.ai/new` trong tab mới. **Không** gắn nội dung bài vào URL.

## 4. Dán kết quả (`src/core/grading/parse.ts`)
1. Ô dán lớn. Bang dán **toàn bộ** câu trả lời của Claude.
2. Parser lấy **khối ```json cuối cùng**. Không có khối nào thì thử tìm object `{…}` lớn nhất. Sau đó `JSON.parse` và `Schema.parse` bằng zod (§5).
3. Kiểm `attemptId` khớp với bài đang mở. Lệch thì cảnh báo "Kết quả này của bài khác?" và cho chọn bài đúng.
4. **Hậu kiểm** (`postcheck.ts`):
   - Mỗi `quote` phải xuất hiện trong bài hoặc transcript (so khớp mờ ≥ 0,9 sau chuẩn hoá). Quote không khớp thì bị ẩn, ghi log số lượng bị ẩn.
   - `wordCount`: app đếm và ghi đè.
   - **Band task:** code tính trung bình 4 tiêu chí, làm tròn 0,5 theo `01` §1. Band Writing tổng = `(T1 + 2×T2)/3`, rồi làm tròn.
   - **Thiếu từ:** Task 2 < 250 hoặc Task 1 < 150 thì TR_TA tối đa 5,5.
5. **Lỗi định dạng:** hiện lỗi cụ thể (thiếu trường gì) và nút **"📋 Copy lời nhắc sửa"**. Nút này copy câu: "JSON chưa đúng: <lỗi>. Gửi lại CHỈ khối JSON đúng schema ở mục OUTPUT." để Bang gửi lại cho Claude.
6. Lưu vào DB với `grader: 'claude-chat'` và `promptVersion`.

## 5. Schema kết quả (`src/core/grading/schemas.ts`, zod)
```ts
const Band = z.number().min(3).max(9).multipleOf(0.5);
const Issue = z.object({
  quote: z.string(), problemVi: z.string(), fix: z.string(),
  errorTag: z.enum(['article','plural','sva','tense','word_form','preposition','run_on','fragment','l1_collocation',
                    'register','spelling','cohesion','relevance','development','repetition','overgeneralisation','pronunciation','other']),
  severity: z.enum(['high','medium','low'])
});
const Criterion = z.object({ band: Band, summaryVi: z.string(),
  strengths: z.array(z.object({ quote: z.string(), whyVi: z.string() })).max(2),
  issues: z.array(Issue).max(6) });
const Common = {
  attemptId: z.string(), promptVersion: z.string(),
  topPriorities: z.array(z.object({ criterion: z.string(), titleVi: z.string(), actionVi: z.string() })).length(3),
  upgrades: z.array(z.object({ original: z.string(), upgraded: z.string(), criterion: z.string(), noteVi: z.string() })).max(6),
  srsItems: z.array(z.object({ kind: z.enum(['collocation','vocab','error']), front: z.string(), back: z.string(), noteVi: z.string() })).max(8),
  confidence: z.enum(['low','medium','high'])
};
export const WritingResult = z.object({ ...Common, kind: z.enum(['task1','task2']),
  criteria: z.object({ TR_TA: Criterion, CC: Criterion, LR: Criterion, GRA: Criterion }),
  relevance: z.enum(['on_topic','partly_off','off_topic']),
  task1: z.object({ overviewPresent: z.boolean(), keyFeaturesCovered: z.array(z.string()), dataErrors: z.array(Issue) }).nullable(),
  task2: z.object({ positionClear: z.boolean(),
                    partsAddressed: z.array(z.object({ part: z.string(), addressed: z.enum(['fully','partly','no']) })),
                    mainIdeas: z.array(z.object({ idea: z.string(), developed: z.enum(['well','partly','no']) })) }).nullable(),
  revision: z.object({ resolvedIssueQuotes: z.array(z.string()) }).nullable()   // chỉ khi chấm lại
});
export const SpeakingResult = z.object({ ...Common, kind: z.literal('speaking'),
  criteria: z.object({ FC: Criterion, LR: Criterion, GRA: Criterion, P: Criterion }),
  partNotes: z.array(z.object({ part: z.enum(['1','2','3']), noteVi: z.string() })),
  pronunciationConfidence: z.literal('low') });
export const SprintResult = z.object({ attemptId: z.string(), promptVersion: z.string(), kind: z.enum(['w2_overview','w2_idea','s2']),
  items: z.array(z.object({ ref: z.string(), stars: z.number().int().min(0).max(3), checks: z.record(z.boolean()), tipVi: z.string(),
                            betterChunk: z.object({ original: z.string(), better: z.string() }).nullable() })) });
```
**Bảo đảm tương thích:** schema đổi thì tăng `PROMPT_VERSION` trong file prompt và giữ parser cũ cho các bản trước (đặt `schemas/v1.ts`, `v2.ts`).

## 6. Kiểm chứng độ chính xác (miễn phí, làm dần)
- **Không có bước hiệu chỉnh tốn tiền.** Thay bằng cách này: khi Bang có **điểm thật** của một bài (thi thật, giáo viên chấm), nhập vào Portfolio ở mục "Điểm thật".
- Thống kê hiện **độ lệch trung bình Claude so với điểm thật** theo từng tiêu chí, khi có ≥ 3 mẫu.
- Khi có ≥ 5 mẫu và |độ lệch| ≥ 0,5 thì app **đề xuất** bật `biasOffset` (Bang bấm xác nhận). Offset lưu trong `kv['grading.biasOffset']`, áp vào band estimator, không sửa điểm gốc.
- **Anchor trong prompt** (bài mẫu kèm band, dùng để neo thang điểm) là **tự viết**: các đoạn ngắn band 6/7/8 trong `docs/grading/WRITING.md`. Không dùng bài của corpus có license hạn chế.

## 7. Giữ giá trị học
- **Vòng sửa W1** vẫn giữ: sửa bài, tạo **gói chấm lại** (kèm issue cũ), dán kết quả, thấy Δ band. Tối đa 3 vòng mỗi bài để tránh vòng lặp vô tận.
- Bài mẫu band 8 (từ data) chỉ mở sau khi đã nộp.
- **Chưa dán kết quả** thì bài vẫn lưu ở trạng thái `awaiting_grade`, kèm checklist tự chấm và bài mẫu để tự so. Trang Hôm nay nhắc "2 bài đang chờ chấm".
- **Pronunciation** chỉ ước tính gián tiếp từ transcript và tín hiệu ASR. Luôn ghi `pronunciationConfidence: 'low'`.
