# REVIEW-FX-0-A — rv-fx (kiểm chéo FX-0 + FX-2 + vá regex T2-B)

**Phán quyết: ĐẠT** (0 CHẶN, 0 NẶNG).

## Phạm vi diff
- 13 file, +728/−64, toàn bộ nằm trong danh sách cấp (`v1-daily-run/**`, `core/srs/**`, `listeningAnswer.{ts,normalize.test.ts}`, 2 doc FX-0).
- 0 sửa `cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, `scripts/**`. Không có `test.skip`/`@ts-ignore`/`eslint-disable` mới.

## Cổng chạy
- `npx tsc --noEmit -p .`: sạch, 0 lỗi.
- `vitest run src/core/srs src/core/scoring src/games/v1-daily-run`: 11 file / 183 test pass. `listeningAnswer.dataset.test.ts` pass 3/3, gồm bộ 381 đáp án.

## Logic
- **FX-0 (SR-22)**: `extras.ts:254-270` kiểm MP3 bằng `audioFileExists` (`audioAvailability`) và gom `missingAudio`. `engine.ts:920` hạ `listen_spell` thiếu MP3 xuống `recall_meaning`, nên không chấm FSRS trên thẻ không nghe được. `createV1Run` ghi `missing_item` với `reason:'missing_audio'`.
- **FX-2**: `queue.ts` `computeEffectiveNewCardsLimit` mặc định 15. Giảm còn 10 khi retention 7 ngày 70–79%, còn 5 khi <70%. Bằng 0 khi `dueCount>150`. Nhãn `reasonVi` không phạt, hiển thị ở `V1DailyRun.tsx:762`.
- **Vòng phục hồi**: `isRecoveryRoundEligible` yêu cầu vắng ≥3 ngày và due>50, giới hạn phiên 50 (`RECOVERY_SESSION_CAP`). `retention7d` và `absenceDays` được nối từ `V1DailyRun.tsx:179-199`.
- **Gom chủ đề (L-5)**: `groupNewCardsByTopic` chỉ áp cho thẻ mới. Lượt ôn không bị gom.
- **Vá nợ**: `registerProgressSaver` có ở `V1DailyRun.tsx:320` (TU-02). `index.ts` đổi sang import tĩnh, hết cảnh báo Rollup (X5). Regex ở `listeningAnswer.ts:408` đổi thành `(\d),(?=\d{3}\b)`, và `:708` sửa `am|pm\b` (thêm `\\b`). Có 20 dòng test mới.

## Lưu ý NHẸ (không chặn)
- Hạ mặt `listen_spell` còn dùng `!vocab.audio?.uk` bên cạnh `missingAudio`. Hành vi đúng, nhưng nếu dữ liệu chỉ có `audio.us` thì thẻ bị hạ thừa. Nên xác nhận khi có dữ liệu thật.
- Chưa chạy `vite build` để xác nhận cảnh báo Rollup đã hết. Tôi chỉ xác nhận bằng cách đọc diff.
