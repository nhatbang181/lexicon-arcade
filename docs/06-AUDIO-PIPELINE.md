# 06 · Audio Pipeline: giọng đọc, render, kiểm tra

> **Cấm dùng `speechSynthesis` của trình duyệt cho nội dung học.** Giọng không ổn định giữa các máy và nghe không giống đề.
> Mọi audio học đều render **offline** bằng neural TTS rồi commit thành file tĩnh.
> Kể cả câu follow-up của S1 cũng được render sẵn (`followUps` trong Part 3). Không có TTS live.

## 1. Công cụ
- **Kokoro-82M** (Apache-2.0, https://huggingface.co/hexgrad/Kokoro-82M).
  - Cài: `pip install kokoro soundfile`. Cần `espeak-ng` cho G2P fallback; espeak-ng là GPLv3 nhưng chỉ dùng như công cụ build, không đóng gói vào app.
  - Danh sách giọng chính thức nằm ở `VOICES.md` của repo. Worker đọc file đó trước khi chọn giọng.
- **ffmpeg** để ghép, chuẩn hoá âm lượng, lọc và encode.
- **faster-whisper** (MIT) để kiểm tra vòng ngược: chạy ASR trên audio đã render rồi so với script.
- Script dùng Python 3.11+, đặt trong `scripts/audio/`, đọc JSON từ `public/data` và ghi vào `public/audio`.

## 2. Bộ giọng

| Accent | Nữ | Nam | Nguồn |
|---|---|---|---|
| UK | `bf_emma`, `bf_isabella`, `bf_alice`, `bf_lily` | `bm_george`, `bm_lewis`, `bm_daniel`, `bm_fable` | Kokoro |
| US | `af_heart`, `af_bella`, `af_nicole`, `af_sarah` | `am_adam`, `am_michael` | Kokoro (kiểm tên trong VOICES.md) |
| AU/NZ/CA | `en-AU-NatashaNeural`, `en-NZ-MollyNeural`, `en-CA-ClaraNeural` | `en-AU-WilliamNeural`, `en-NZ-MitchellNeural`, `en-CA-LiamNeural` | edge-tts (§2.1) |

- Mỗi episode dùng 2–4 giọng khác nhau rõ rệt (khác giới, hoặc khác accent).
- Không lặp cặp giọng giống nhau ở 2 episode liền kề.
- Giọng examiner cho Speaking: `bm_george` và `bf_emma` (cố định để tạo cảm giác quen thuộc).

### 2.1 Giọng Úc/NZ/Canada: dùng `edge-tts` (Bang đã duyệt 2026-11-20)
- Cài: `pip install edge-tts` (miễn phí, không cần tài khoản). Dùng cho **khoảng 25% episode** và **khoảng 20% câu dictation** từ level 5 trở lên.
- Giọng gợi ý: `en-AU-NatashaNeural`, `en-AU-WilliamNeural`, `en-NZ-MollyNeural`, `en-NZ-MitchellNeural`, `en-CA-ClaraNeural`, `en-CA-LiamNeural`.
  - Worker chạy `edge-tts --list-voices` để kiểm tên hiện hành trước khi dùng.
- Trong data ghi `voice: "edge:en-AU-NatashaNeural"` và `accent:'au'`. `provenance.license = "edge-tts (personal use)"`.
- **Tốc độ:** dùng tham số `--rate` (vd `-5%`, `+0%`, `+5%`) thay cho `speed` của Kokoro.
- Episode có giọng edge vẫn qua đủ quy trình render, chuẩn hoá loudness và QA ở §4–§5 như mọi episode khác.
- **Dự phòng:** nếu edge-tts lỗi (đổi API, bị chặn) thì render lại bằng giọng Kokoro UK. Ghi vào `DECISIONS.md`. Không dừng mốc.

## 3. Quy ước văn bản cho TTS
- Mỗi dòng script có thể có thêm `ttsText`, khác với `text` hiển thị. Trường này đã được thêm vào schema ở `04` §4: `script[i].ttsText?: string`.
- **Đánh vần:** `text: "That's S-H-A-W-E."`, `ttsText: "That's... S, H, A, W, E."`. Có dấu phẩy để ngắt từng chữ cái, ~0,35 giây.
- **Chữ đôi:** "double T" giữ nguyên như người Anh nói.
- **Số điện thoại:** đọc theo nhóm. Ví dụ `ttsText: "oh seven seven, nine three, four one two..."`. Dùng "oh" cho số 0 theo kiểu UK.
- **Tiền, ngày, giờ:** viết thành chữ trong `ttsText`, ví dụ "the thirtieth of March", "twelve pounds fifty".
- **Ngập ngừng tự nhiên:** "um", "er", "let me see" đều giữ trong `text`. Kokoro đọc được.
- **Tốc độ** (tham số `speed` của Kokoro):

| Part | speed |
|---|---|
| 1 | 0,95–1,0 |
| 2–3 | 1,0 |
| 4 | 1,0–1,05 |

- Dictation đặt `speed` theo bảng level ở `05` §6.4. Sau khi render, kiểm WPM thực tế ([INV-D1]).

## 4. Quy trình render
```
scripts/audio/
  render_vocab.py        # vocab/words.json → public/audio/vocab/<slug>.uk.mp3 (+ .us nếu có)
  render_dictation.py    # dictation.json → public/audio/dictation/<id>.mp3
  render_episode.py      # listening/episodes/*.json → public/audio/listening/<id>.mp3 + ghi start/end/duration/sha256/LUFS ngược vào JSON
  render_speaking.py     # câu hỏi Part 1/2/3 + phrases → public/audio/speaking/<qid>.mp3
  qa_audio.py            # cổng §5
  common.py              # load model 1 lần, cache theo hash(text+voice+speed)
```

**Các bước của `render_episode.py` cho mỗi episode:**
1. Synth từng dòng với giọng của speaker, ra WAV 24 kHz.
2. Cắt khoảng lặng đầu và cuối mỗi dòng xuống ≤ 80 ms. Chèn khoảng lặng giữa các dòng:
   - cùng người nói: `pauseAfter ?? 0.25 s`
   - đổi người nói: `pauseAfter ?? 0.45 s`
   - trước câu signpost ở Part 4: 0,8 s
3. Ghép lại, ghi `start` và `end` của từng dòng (giây, 2 chữ số thập phân).
4. Tuỳ chọn hiệu ứng:
   - `channel:'phone'`: bandpass 300–3400 Hz cho người ở đầu dây bên kia.
   - Room tone: pink noise ở −48 dB để bớt cảm giác phòng thu.
5. Chuẩn hoá âm lượng: `ffmpeg loudnorm I=-16:TP=-1.5:LRA=11`, chạy 2 lượt.
6. Encode **MP3 mono 48 kbps, 24 kHz**. Tính `sha256`, ghi vào JSON.

**Cache:** cùng `text + voice + speed` thì không render lại. Hash lưu ở `data-src/audio_cache.json`.

## 5. Cổng Audio QA (`qa_audio.py`), mọi tiêu chí đều đo được

| Kiểm tra | Ngưỡng |
|---|---|
| Thời lượng episode | Theo [INV-L6] |
| Âm lượng tích hợp | −17…−15 LUFS |
| True peak | ≤ −1,0 dBTP |
| Khoảng lặng dài nhất bên trong | ≤ 2,0 s (trừ khi `pauseAfter` khai báo lớn hơn) |
| **ASR vòng ngược** (faster-whisper `small.en`, beam 5) | WER so với `ttsText ?? text` ≤ 8% |
| **Đáp án nghe được** | Với mỗi câu, mọi token của `accepted[0]` (sau chuẩn hoá) có trong ASR của đoạn `evidence` (±1,5 s). Tên đánh vần: các chữ cái nhận được theo thứ tự |
| Dictation WPM | Theo [INV-D1] |
| Vocab audio | 0,3–4 s, WER = 0 với headword (cho phép ASR viết khác hoa thường hoặc gạch nối) |

- **Nghe mẫu bằng tai:** worker `rv-audio` (hoặc Bang) nghe 2 episode ngẫu nhiên mỗi part sau mỗi đợt render. Ghi vào `data-src/REVIEW_LOG.md` với các tiêu chí: tự nhiên, rõ đáp án, không méo tiếng.

## 6. Ngân sách dung lượng
- Ước tính bản đầy đủ:
  - 112 episode × khoảng 1,8 MB ≈ 200 MB
  - vocab ≈ 25 MB
  - dictation ≈ 30 MB
  - speaking ≈ 25 MB
  - **Tổng ≈ 280 MB**
- **Ngưỡng cứng:** `public/audio` ≤ 400 MB. Vượt ngưỡng thì dừng lại hỏi Bang. Hai phương án khi đó: giảm bitrate xuống 40 kbps, hoặc chuyển audio sang GitHub Releases/CDN.
- **PWA:** không precache toàn bộ audio. Dùng runtime cache (CacheFirst, tối đa 300 file). Có nút "Tải trước cho học offline" theo từng game.

## 7. Không có TTS live
Mọi audio đều là file tĩnh đã qua QA. Không dùng `kokoro-js` hay `speechSynthesis` trong app V3.
