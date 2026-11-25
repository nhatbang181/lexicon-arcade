# Audio Credits & Provenance (`public/audio/`)

> Tài liệu ghi nhận nguồn và giấy phép toàn bộ file audio học trong `public/audio/` (theo `docs/audit-max/04-DATA-NOI-DUNG.md` D12 và `DECISIONS.md` mục D ngày 23/11/2026).

## Engine & Giấy phép

| Nhóm | Thư mục | Engine | Giọng (Voices) | Giấy phép / Ghi chú |
|---|---|---|---|---|
| Listening Episodes (32 file) | `public/audio/listening/*.mp3` | `edge-tts` (Microsoft Edge Neural TTS) | UK (`en-GB-SoniaNeural`, `en-GB-RyanNeural`, `en-GB-LibbyNeural`, `en-GB-ThomasNeural`), US (`en-US-JennyNeural`, `en-US-GuyNeural`, `en-US-AriaNeural`, `en-US-AndrewNeural`), AU (`en-AU-NatashaNeural`, `en-AU-WilliamNeural`), NZ (`en-NZ-MollyNeural`, `en-NZ-MitchellNeural`), CA (`en-CA-ClaraNeural`, `en-CA-LiamNeural`) | Microsoft Edge Neural TTS (personal/non-commercial). Chủ dự án đã duyệt chấp nhận rủi ro deploy công khai ngày 23/11/2026 (`DECISIONS.md` mục D). Chi tiết từng file lưu trong trường `audioProvenance` của `public/data/listening/episodes/*.json`. |
| Dictation (700 file, L1–L10) | `public/audio/dictation/*.mp3` | `edge-tts` | Đa giọng UK / US / AU theo `VOICE_POOLS` trong `scripts/audio/common.py` | Như trên. Chi tiết từng file lưu trong `audioProvenance` của `public/data/listening/dictation.json`. |
| Vocabulary (UK, 2 207/2 207 file) | `public/audio/vocab/*.uk.mp3` | `edge-tts` | `en-GB-SoniaNeural` | Như trên. Chi tiết từng file lưu trong trường `audioProvenance` của `public/data/vocab/words.json`. |
| Speaking | `public/audio/speaking/**` | (Quản lý bởi nhánh M5) | (Chưa render trong T3-B) | Không đụng trong T3-B (`LUAT.md` A3). |

## Quy chuẩn xử lý tín hiệu
- Tần số lấy mẫu: `24000 Hz`, mono, MP3 `64 kbps` (Listening Episodes) / `48 kbps` (Dictation & Vocab).
- Chuẩn hoá âm lượng: FFmpeg `loudnorm` (`-16 LUFS`, True Peak ≤ `-1.0 dBTP`, LRA `11`), cắt khoảng lặng đầu/cuối ≤ `80 ms`.
- Không sử dụng `window.speechSynthesis` cho nội dung học (`AGENTS.md` §3).
