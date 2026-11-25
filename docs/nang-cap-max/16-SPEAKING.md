# 16 · SPEAKING · pipeline trong trình duyệt (kỹ năng yếu nhất của người Việt: 5.61)

> Nguồn: R2 §A2/§C, R3 A.2/S1/S2/N5, R4 §2b. Hiện có `src/core/speech/` (M5): recorder, VAD, ASR dùng **Web Speech API** (auto-restart, ghép transcript), metrics. **Giữ API cũ, bổ sung provider mới.**
> Ràng buộc A3 của plan cũ: `src/games/s1-*`, `s2-*`, `public/audio/speaking/**` thuộc M5. Chỉ làm khi M5 đã merge hoặc Bang cho tiếp quản.

## 1. Hạ tầng (NC5-A)
| Lớp | Hiện có | Bổ sung | Lý do |
|---|---|---|---|
| Ghi âm | `recorder.ts` | Lưu bản ghi (opus/webm) vào IndexedDB, giới hạn 300 bản mới nhất, nút xoá; iOS: `audioSession.type='play-and-record'` khi vừa phát vừa ghi | Nghe lại và so delta |
| VAD | `vad.ts` | `@ricky0123/vad-web` (Silero, ISC) chạy trong Worker nếu tốt hơn bản hiện có (đo trước khi thay) | Cắt câu, đo pause chính xác |
| ASR | Web Speech API (Chrome gửi âm thanh lên máy chủ Google; Safari/iOS hỗ trợ kém) | **Provider on-device**: Moonshine base (MIT) qua `@huggingface/transformers` (WASM, `device:'webgpu'` nếu có), dự phòng Whisper base.en; chạy Web Worker; model cache Cache Storage, tải khi bật lần đầu (~100–150 MB, có thanh tiến độ, nút xoá) | Riêng tư + chạy được trên iPhone |
| Chọn provider | – | Mặc định on-device trên iOS và khi offline; Web Speech chỉ khi người dùng chọn (ghi rõ "gửi âm thanh tới dịch vụ nhận dạng của trình duyệt") | Minh bạch |
| Transcript | ghép đoạn | **Người học sửa được transcript** trước khi chấm (Praktika bị chê vì STT sai, R2 §D) | Chấm công bằng |
| Số đo | `metrics.ts` | wpm; pause > 1 s, phân loại **giữa cụm** (pause rơi vào giữa cụm danh từ hay động từ, theo POS hoặc heuristic) và **giữa ý** (sau dấu câu hoặc discourse marker); độ dài nói liền mạch; lặp từ; discourse marker kiểu nói | FC band 7 ↔ 8 |

**Ngân sách:** model chỉ tải khi vào Speaking. Inference ≤ 1,5× độ dài câu trên iPhone (đo thật). Nếu chậm hơn → dùng Moonshine tiny hoặc chấm sau khi nói xong (batch).

## 2. S1 Mock Examiner (NC5-B)
- 3 Part đúng thời lượng; giám khảo đọc câu hỏi bằng TTS render sẵn (Kokoro/Piper); P2 có 1' chuẩn bị + ghi chú trên màn, nói tới 2'.
- Sau phiên: transcript có đánh dấu lỗi (`12` §5); số đo FC; Phrase Harvest; cảnh báo học thuộc; gói chấm Claude FC/LR/GRA + P proxy → khoảng band.
- Câu hỏi biến thể từ ngân hàng `11` §6, trọng số theo `topic_trends`.

## 3. S2 3-Second Rule (NC5-C)
- Bắt đầu nói ≤ 3 s; thưởng nói **liền mạch** 30/60/90 s (không thưởng tốc độ).
- Khung ý PEEL nói, 4 "trục lái"; Commute Monologue 60" chỉ ghi âm, không chấm.
- Vòng nói lại ngay sau khi xem transcript; điểm là **delta** giữa 2 lần nói.

## 4. N5 Prosody Lab (NC5-C)
- **Minimal pairs** cho lỗi người Việt (L2-ARCTIC cho danh sách, R1):
  - âm cuối /t d k s z/;
  - cụm /st kt ks nd/;
  - -s/-ed;
  - /ʃ ʒ tʃ dʒ/;
  - /θ ð/.
  - Mỗi cặp ≥ 4 giọng (HVPT).
- **Nhận diện trước, sản xuất sau:** nghe chọn → nói → ASR có nhận đúng từ mục tiêu không (proxy).
- **Stress Tap:** chạm âm tiết mang trọng âm cho từ học thuật (CMUdict / ipa-dict).
- **Shadowing** câu có vạch ngắt cụm; so nhịp bằng năng lượng và thời lượng âm tiết. Không chấm "giọng bản xứ".
- **Pha 2 (tuỳ chọn):** chấm âm vị bằng `wav2vec2-lv-60-espeak-cv-ft` ONNX (~240 MB, chỉ tải khi bật), hiệu chỉnh thang bằng speechocean762. Luôn ghi "gợi ý, không phải điểm band".

## 5. Kiểm (cổng NC-G5)
- iPhone thật, app đã cài: ghi âm ổn định 2' liên tục; ASR on-device chạy; công tắc im lặng không chặn phát câu hỏi; mất mạng vẫn chạy.
- Pause phân loại đúng trên 20 câu mẫu đã gắn nhãn tay (≥ 80%).
- Mọi điểm P ghi rõ là proxy.
