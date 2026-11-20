# S1 · Mock Examiner: thi thử Speaking, chấm qua Claude chat

## 1. Mục đích
- Speaking cần đạt ≥ 7.5. Người Việt yếu ở:
  - hồi hộp Part 1
  - hết ý ở Part 2 sau 40–60 giây
  - tư duy trừu tượng ở Part 3
  - dịch trong đầu nên chậm
  - phát âm âm cuối và trọng âm (`01` §5.2)
- S1 mô phỏng **trọn buổi thi 11–14 phút**, đúng nhịp: câu hỏi phát bằng giọng examiner, có 1 phút chuẩn bị Part 2, Part 3 có follow-up dựa trên câu trả lời.
- Sau buổi thi có **bản ghi, transcript, chỉ số fluency và nhận xét 4 tiêu chí**.

## 2. Vì sao hiệu quả
- **Giống thi thật** (P7): giảm lo âu nhờ quen dần với tình huống thi.
- **Nghe lại chính mình + transcript:** người học tự phát hiện lỗi (tự giám sát). Kết hợp nhận xét có trích dẫn (P6).
- **Chỉ số đo được theo thời gian** (WPM, số lần ngừng dài, độ trễ bắt đầu): thấy fluency tiến bộ qua các buổi.
- **Portfolio ghi âm:** nghe lại bản tháng 1 và tháng 6 là động lực cực mạnh.

## 3. Core loop
```
Chọn: Full mock (P1→P2→P3) | Chỉ Part 2+3 | Chỉ Part 1
→ Kiểm tra mic (mức âm, 3 giây)
→ PART 1: examiner hỏi 4–5 câu (2 topic) → mỗi câu: nghe → tự nói (tự dừng khi im lặng 2.5s hoặc bấm Xong; tối đa 45s)
→ PART 2: cue card hiện + 60s chuẩn bị (ô ghi chú) → nói tối đa 2 phút (tự dừng ở 2:00; nhắc khi < 1:00 nếu dừng sớm) → 1 rounding-off question
→ PART 3: 4–5 câu; sau câu 2 và 4 có 1 follow-up lấy từ ngân hàng follow-up của câu đó (audio đã render sẵn) → nói tối đa 75s/câu
→ KẾT THÚC → transcript + metrics → Báo cáo tự động (metrics, transcript, nghe lại)
→ (tuỳ chọn) 📋 Copy gói chấm → Claude chat → 📥 Dán kết quả → band 4 tiêu chí + nhận xét
```

## 4. Luật chơi
- **Ghi âm từng câu** (`recorder.ts`) chạy song song với ASR (`asr.ts`) và VAD (`vad.ts`).
- **Tự dừng** khi VAD báo im lặng liên tục:
  - Part 1: 2,5 giây
  - Part 3: 3,0 giây
  - Part 2: không tự dừng trước 1:00
  - Luôn có nút "Xong" (Space).
- **Độ trễ bắt đầu** = thời gian từ khi examiner hỏi xong tới khi VAD phát hiện tiếng nói. Ghi lại cho từng câu.
- **Không cho nghe lại câu hỏi**, giống thi thật. Ở training cho phép 1 lần "Could you repeat the question?" bằng nút R, có ghi lại.
- **XP:** hoàn thành full mock +80, chỉ Part 2+3 +50, chỉ Part 1 +25. Dán kết quả Claude thì +20.
- **Gói chấm Speaking** (`07` §3, `docs/grading/SPEAKING.md`) gồm:
  - transcript theo từng câu hỏi
  - bảng metrics
  - danh sách từ ASR có confidence thấp

  **Không** gửi audio.

### 4.1 Chỉ số (`core/speech/metrics.ts`)

| Chỉ số | Định nghĩa | Tham chiếu band 8 (chỉ để định hướng, không chấm máy móc) |
|---|---|---|
| WPM | Số từ transcript / thời gian nói (không tính lặng đầu và cuối) | 130–170 |
| Long pauses | Số lần ngừng > 2 s / phút | ≤ 1 |
| Mid pauses | Số lần ngừng 1–2 s / phút | ≤ 4 |
| Mean run length | Số từ trung bình giữa 2 lần ngừng > 0,5 s | ≥ 8 |
| Start latency | Trung vị độ trễ bắt đầu | ≤ 1,5 s |
| Fillers | "um, uh, er, like, you know" / phút (ASR có thể bỏ sót, ghi chú độ tin cậy) | ≤ 4 |
| Part 2 length | Thời lượng nói Part 2 | ≥ 1:40 |
| Lexical variety | Type-token ratio trên 100 từ (MATTR) | ≥ 0,55 |

Metrics hiện ở báo cáo dưới dạng thanh so với dải tham chiếu, kèm sparkline 10 buổi gần nhất.

## 5. Độ khó và chọn đề
- **Đợt chủ đề:** mặc định đợt hiện tại (`rotation` khớp ngày hôm nay) với 70% đề, 30% evergreen. Cài đặt có "Ôn đợt kế tiếp" khi gần ngày thi.
- Level ảnh hưởng tới Part 3: level cao thì nhiều câu `hypothetical`/`evaluate`, follow-up dồn sâu hơn ("Is that always true?", "What about in developing countries?").

## 6. Flow màn hình và wireframe
```
┌ ✕ Mock Examiner · Part 2 ───────────────────────────────────── ◷ 1:12 / 2:00 ┐
│                                                                              │
│   ┌── CUE CARD ──────────────────────────────┐   ┌── GHI CHÚ (60s chuẩn bị) ┐  │
│   │ Describe a time you helped someone.      │   │ - neighbour, moving day  │  │
│   │ You should say:                          │   │ - heavy boxes, rain      │  │
│   │  • who you helped                        │   │ - felt useful            │  │
│   │  • what the situation was                │   └──────────────────────────┘  │
│   │  • how you helped                        │                                 │
│   │ and explain how you felt about it.       │          ( ◉ )  ← MicButton     │
│   └──────────────────────────────────────────┘     vòng sáng theo âm lượng     │
│                                                       [Xong · Space]          │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Part 1/3:** chỉ hiện "Examiner" (avatar trung tính: vòng tròn sóng âm, **không** dùng ảnh người) + câu hỏi dạng chữ **ẩn** (giống thi thật). Ở training có nút "Hiện chữ" (ghi lại).
- **Live transcript:** ẩn khi đang nói, vì nhìn chữ làm mất tập trung. Cài đặt có thể bật.
- **Báo cáo:**
  - band 4 tiêu chí (sau khi dán kết quả Claude) + độ tin cậy. Trước khi dán thì hiện metrics + checklist tự đánh giá (trả lời đủ dài? có lý do và ví dụ? Part 2 đủ 4 ý cue card?)
  - **Pronunciation** luôn có nhãn "ước tính gián tiếp"
  - metrics
  - 3 ưu tiên
  - transcript theo từng câu: ▶ phát lại đoạn của mình, quote lỗi bôi màu, nút "Nói lại câu này"
  - mẫu band 8 cho Part 2 (`band8Sample`)

## 7. Feedback và câu thắng
- Chấm: `07`, `docs/grading/SPEAKING.md`.
- **"Nói lại câu này":** ghi một bản mới cho câu đó, so metrics trước và sau (chỉ metrics, không cần Claude).
- **Câu thắng** dựa trên metrics so với trung bình 3 buổi trước:
  - "Part 2 nói được 1:52 (lần trước 1:10)".
  - "Ngừng dài giảm từ 3,1 xuống 1,2 lần/phút".

## 8. SRS
- `srsItems` trong kết quả Claude (collocation, từ thay thế từ lặp, lỗi ngữ pháp) thành item, giống W1 (cần bấm "+ Thêm" với vocab, tự thêm với error).
- Từ bị ASR nhận sai nhiều lần (confidence thấp ở cùng từ ≥ 2 buổi) thì đề xuất thẻ phát âm: V1 face `listen_spell` + nút 🔊 nghe mẫu. Có nhãn "kiểm tra phát âm từ này".

## 9. Data
- `speaking/part1.json`, `part2.json`, `part3.json` (`04` §7) + audio examiner (`06`). MVP 30 topic Part 1, 40 cue card, 40 set Part 3. Đầy đủ 60/90/90.
- **Follow-up:** mỗi câu Part 3 có `followUps: Array<{ text, audio }>` (2–3 câu, vd "Why do you think that is?", "Is that always the case?", "What about older people?"). Câu hỏi và follow-up đều dùng audio đã render sẵn. **Không có TTS live.**

## 10. UI, motion, sound riêng
- Trong lúc thi: **không SFX, không XP, không animation thưởng**. Chỉ có MicButton phản hồi âm lượng thật và đồng hồ.
- Chuyển part có màn chuyển 1,5 giây, chữ "Part 2" và câu hướng dẫn chuẩn của giám khảo (audio có sẵn).
- Báo cáo có animation như Recap chuẩn.

## 11. Edge cases
- **Không cho quyền mic:** màn hướng dẫn cấp quyền (Chrome/Edge) + nút thử lại.
- **Trình duyệt không có `SpeechRecognition`** (Firefox, Safari cũ): vẫn ghi âm + VAD + metrics thời gian (pause, latency, độ dài). Transcript trống nên không tạo được gói chấm. Báo rõ và gợi ý dùng Chrome/Edge.
- **ASR cắt giữa chừng** (Chrome dừng sau khoảng 60 giây im lặng hoặc giới hạn phiên): `asr.ts` tự khởi động lại phiên liền mạch và nối transcript. Có test với mock.
- **Ồn nền:** VAD tự hiệu chỉnh ngưỡng trong 1 giây đầu. Nếu tạp âm cao (RMS nền > ngưỡng) thì cảnh báo "Phòng hơi ồn".
- **Dung lượng:** mỗi mock khoảng 3–6 MB (opus). Áp dụng giới hạn ở `03` §4.

## 12. Cổng nghiệm thu
- Unit test `metrics.ts` với timeline VAD giả: WPM, pause, run length, latency, MATTR.
- Unit test `vad.ts` với buffer tổng hợp (sin + im lặng + nhiễu).
- E2E dùng `--use-fake-device-for-media-stream` + file wav giả và ASR mock: full mock chạy hết, báo cáo có metrics, portfolio có bản ghi phát được.
- Ảnh chụp 3 độ rộng: Part 1 (examiner), Part 2 (cue card + ghi chú), báo cáo.

## 13. Không làm
- Không chấm phát âm bằng mô hình âm học, không dùng dịch vụ trả phí (Azure…). Không gọi API AI.
- Không dùng avatar người hay video.
