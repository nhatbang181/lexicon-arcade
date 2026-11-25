# R4 — Đánh giá repo/tool open-source cho production "Lexicon Arcade V3"

Ngày kiểm: 2026-11-25. Toàn bộ số sao, ngày commit cuối (commit mới nhất trên default branch), license, mô tả đều lấy **trực tiếp từ GitHub GraphQL/REST API** (`gh api`) và README của từng repo hôm nay; phiên bản npm lấy từ `npm view`; kích thước model ONNX lấy từ Hugging Face API. Dữ liệu thô: `scratchpad/research/r4/meta.json` và `scratchpad/research/r4/readme/*.md`.

**Máy dev (đã kiểm bằng WMI):** AMD Ryzen 5 5600H + **NVIDIA RTX 3050 Laptop (WMI báo 4 GB VRAM)**. Tức là: app phía người dùng phải coi như CPU-only (WASM), nhưng pipeline nội dung trên máy dev có CUDA nhỏ — đủ cho Kokoro/Whisper/wav2vec2, không đủ cho model TTS 2B (VoxCPM2 cần ~8 GB).

Ký hiệu: **DÙNG** = đưa vào stack · **CÓ THỂ** = dùng có điều kiện / pha sau · **BỎ** = không đáng công.

---

## 1. Đánh giá 21 repo Bang gửi

| # | Repo | Sao / commit cuối / license (đã kiểm) | Kết luận | Dùng vào việc gì cho dự án này | Pha | CPU ok? |
|---|---|---|---|---|---|---|
| 1 | tensorflow/tensorflow | 201.8k / 2026-11-25 / Apache-2.0 | **BỎ** | Framework ML tổng quát. App không train model; transformers.js/ONNX đã đủ cho inference trong trình duyệt. | – | có, nhưng không cần |
| 2 | f/prompts.chat | 178.5k / 2026-11-24 / MIT (code) + CC0 (prompt) | **BỎ** | Kho prompt ChatGPT chung chung. Prompt chấm Writing/Speaking theo band descriptor IELTS phải tự viết, kho này không giúp. | – | n/a |
| 3 | microsoft/generative-ai-for-beginners | 124.1k / 2026-11-17 / MIT | **BỎ** | Khoá học 21 bài. Tài liệu học, không phải tool. | – | n/a |
| 4 | rasbt/LLMs-from-scratch | 109.0k / 2026-11-24 / Apache-2.0 | **BỎ** | Sách/notebook tự code LLM bằng PyTorch. Không liên quan đến sản phẩm. | – | n/a |
| 5 | pytorch/pytorch | 105.7k / 2026-11-25 / BSD-3 (bản tuỳ biến, GitHub báo NOASSERTION) | **BỎ (dùng trực tiếp)** | Chỉ là dependency kéo theo của pipeline Python (kokoro, whisperX). Cài bản wheel CPU hoặc CUDA khi cần, không dùng trực tiếp. | data/audio (gián tiếp) | có |
| 6 | microsoft/ML-For-Beginners | 92.5k / 2026-11-06 / MIT | **BỎ** | Khoá học ML cổ điển. | – | n/a |
| 7 | Comfy-Org/ComfyUI | 148.5k / 2026-11-25 / **GPL-3.0** / v0.46.0 | **CÓ THỂ** | Sinh ảnh offline cho mascot, sticker, nền pastel, minh hoạ từ vựng. Chạy được trên RTX 3050 4 GB với SD1.5/SDXL ở chế độ low-VRAM; Flux thì quá nặng. GPL chỉ áp dụng cho tool, ảnh sinh ra không bị ràng buộc, **nhưng license của từng checkpoint thì có ràng buộc**. | assets | chậm trên CPU; GPU 4 GB tạm được |
| 8 | excalidraw/excalidraw | 136.3k / 2026-11-24 / MIT / v0.18.1 | **CÓ THỂ** | Vẽ wireframe, flow màn chơi, sơ đồ game loop để giao cho agent. **Không nhúng vào app** vì bundle rất nặng. | UI-UX (thiết kế) | có |
| 9 | VoltAgent/awesome-design-md | 128.9k / 2026-10-28 / MIT / 84 file DESIGN.md | **CÓ THỂ** | Mẫu định dạng `DESIGN.md` (khái niệm của Google Stitch) để agent bám một design language. Cách dùng đúng là **học format rồi tự viết DESIGN.md "pastel kawaii" cho Lexicon Arcade**. Không copy DESIGN.md của brand thật (Claude, Linear…) vì như vậy là bắt chước thương hiệu. Bộ này chủ yếu là trang SaaS/dev; không có mẫu kiểu game học tập như Duolingo. | UI-UX | n/a |
| 10 | Leonxlnx/taste-skill | 121.2k / 2026-11-24 / MIT / v2.5.1 (repo tạo 2026-02) | **CÓ THỂ** | v2.5 tập trung vào **website công ty/landing page** (deal palette, font, hero, ảnh thật, checker headless Chrome ở 5 breakpoint). Không hợp với UI game, chỉ dùng cho **landing/marketing page**. Cần Node 22+ và Chrome/Edge. Các skill cũ, tổng quát hơn (`high-end-visual-design`, `minimalist-ui`…) đã chuyển sang repo `Leonxlnx/taste-skill-classics`. | UI-UX / marketing | có |
| 11 | pbakaus/impeccable | 116.3k / 2026-11-18 / Apache-2.0 / skill-v4.11.0, npm `impeccable@4.11.0` | **DÙNG** | Hợp nhất trong cả danh sách. README ghi **hỗ trợ Google Antigravity và Claude Code**. Có 24 lệnh (`critique`, `audit`, `polish`, `bolder`, `quieter`, `typeset`, `harden`, `adapt`…) và **62 rule phát hiện "AI slop" chạy tất định, không cần LLM**, gọi bằng CLI `npx impeccable detect src/`, chạy được trong CI và xuất SARIF. Mạnh nhất khi sửa UI đã có sẵn, đúng tình huống V3. | UI-UX / QA | có |
| 12 | nexu-io/open-design | 109.3k / 2026-11-23 / Apache-2.0 | **BỎ** | Cả một workspace "AI design agent" với MCP cho nhiều agent (có Antigravity). Nặng (repo 3.6 GB), chạy BYOK API và README có quảng cáo gói credit trả phí. Trùng vai với impeccable + frontend-design và không cần cho game. | – | có |
| 13 | debpalash/VoiceStudio | 117.8k / 2026-11-23 / **AGPL-3.0** / v0.5.8 | **CÓ THỂ (ưu tiên thấp)** | GUI local kiểu "ElevenLabs": clone giọng, voice design, lồng tiếng. Có bản Windows (CUDA/CPU). **Weights mặc định OmniVoice là CC-BY-NC** (README tự ghi), chấp nhận được vì dự án phi thương mại. Chỉ đáng dùng nếu cần thiết kế giọng nhân vật; Kokoro đã đủ cho phần nghe. | audio | CPU được nhưng chậm |
| 14 | openai/whisper | 113.4k / 2026-08-31 / MIT | **BỎ (thay bằng bản port)** | Bản gốc PyTorch chậm trên CPU. Thay bằng **whisper.cpp** (CPU, WASM), **faster-whisper** hoặc **transformers.js** (trong trình duyệt). | speaking/audio | chậm |
| 15 | heygen-com/hyperframes | 89.6k / 2026-11-25 / Apache-2.0 / v0.9.93 | **CÓ THỂ (pha marketing)** | Framework mở biến HTML/CSS/JS thành MP4 tất định. Có skill cho Claude Code/Gemini CLI (`npx skills add heygen-com/hyperframes`). Hợp để làm **video giới thiệu/trailer TikTok từ chính UI React** của game. Cần Node 22+ và FFmpeg. App Studio có gói Pro $25/tháng nhưng CLI miễn phí. | video-marketing | có |
| 16 | OpenMontageInc/OpenMontage | 83.1k / 2026-11-16 / **AGPL-3.0** | **BỎ** | Pipeline video agentic phụ thuộc nhiều API trả phí (sinh ảnh/video), cài Python + Remotion. Quá nặng so với nhu cầu, hyperframes gọn hơn. | – | một phần |
| 17 | RVC-Boss/GPT-SoVITS | **18 sao / repo tạo 2026-11-23** / MIT | **BỎ** | **Bất thường:** đây là repo mới tạo lại. Repo gốc hiện ở **bilibili/GPT-SoVITS** (64.2k / 2026-11-11 / MIT). Công cụ clone giọng few-shot, cần GPU để train, tiếng Anh không phải thế mạnh. Không cần cho IELTS. | – | train cần GPU |
| 18 | jamiepine/voicebox | 61.3k / 2026-11-24 / MIT / v0.6.0 | **CÓ THỂ** | "Voice studio" local, có bản Windows MSI, gói sẵn **Kokoro, LuxTTS (README ghi 150x realtime trên CPU), Chatterbox Turbo, Qwen CustomVoice** và Whisper. Dùng như **phòng nghe thử giọng** trước khi chốt giọng cho pipeline. Không đưa vào production. | audio | có (Kokoro/LuxTTS) |
| 19 | ggml-org/whisper.cpp | 55.5k / 2026-11-24 / MIT / v1.9.6 | **DÙNG** | Pipeline: (a) QA audio TTS bằng cách transcribe lại rồi so với script để bắt lỗi đọc sai; (b) timestamp cho audio người thật. Chạy CPU tốt, có ví dụ WASM. | audio / data QA | **có, tốt** |
| 20 | OpenBMB/VoxCPM | 43.0k / 2026-11-09 / Apache-2.0 / 2.0.3 | **BỎ (hiện tại)** | VoxCPM2 2B, 30 ngôn ngữ, voice design bằng mô tả. Cần **~8 GB VRAM** (v1.5 ~6 GB), vượt mức RTX 3050 4 GB. Bản GGUF qua llama.cpp-omni chạy được CPU nhưng README ghi RTF ~1.76 ngay cả trên M4 Pro, tức rất chậm. Xem lại nếu có GPU lớn. | audio | rất chậm |
| 21 | RVC-Project/Retrieval-based-Voice-Conversion-WebUI | 39.3k / 2026-08-04 / MIT | **BỎ** | Chuyển đổi giọng (voice conversion, hay dùng cho cover nhạc). Không có use case IELTS, lại có rủi ro đạo đức nếu clone giọng người thật. | – | train cần GPU |

**Ghi chú về số sao:** nhiều repo "agent skill"/AI mới tạo năm 2026 có từ 80k đến 120k sao chỉ trong vài tháng (taste-skill, open-design, VoiceStudio, hyperframes, OpenMontage). Số fork tỉ lệ thuận nên không rõ là sao ảo, nhưng **sao không phải thước đo chất lượng**. Kết luận ở trên dựa vào nội dung README và mức độ khớp với dự án.

---

## 2. Repo phù hợp hơn theo từng pha

### 2a. TTS offline (giọng Anh–Mỹ–Úc) — pha audio

| Repo | Sao / commit cuối / license | Kết luận | Giọng/accent (đã kiểm) | CPU | Ghi chú |
|---|---|---|---|---|---|
| hexgrad/kokoro (+ Kokoro-82M) | 10.4k / 2025-08-06 / Apache-2.0 (code + weights) | **DÙNG (giữ)** | 20 giọng Mỹ, 8 giọng Anh. Tốt nhất: af_heart (A), af_bella (A-), bf_emma (B-); khá: bm_george, bm_fable, bf_isabella (C). **Không có giọng Úc.** | rất tốt | 82M tham số. Pipeline Python **trả timestamp từng từ** (`token.start_ts`/`end_ts` trong `pipeline.py`), nên có timing karaoke/dictation miễn phí, không cần forced alignment. |
| thewh1teagle/kokoro-onnx | 2.9k / 2026-09-01 / MIT | **CÓ THỂ** | như Kokoro | rất tốt | Chạy Kokoro bằng onnxruntime, không cần PyTorch. Nhẹ hơn cho script Node/Python. |
| kokoro-js (npm 1.2.1, nằm trong repo hexgrad/kokoro) | npm sửa lần cuối 2025-05 / Apache-2.0 | **CÓ THỂ** | như Kokoro | WASM | TTS trong trình duyệt cho câu do người dùng tự nhập. Model q8 ~86–92 MB. **Phụ thuộc `@huggingface/transformers` ^3.5**, lệch major với transformers.js 4.x nếu dùng chung cho ASR, nên sẽ bị 2 bản trong bundle. |
| myshell-ai/MeloTTS | 7.7k / **2024-12-24 (đứng yên ~2 năm)** / MIT | **DÙNG (chỉ để có giọng Úc)** | **EN-US, EN-BR, EN-INDIA, EN-AU, EN-Default** (mỗi accent 1 speaker) | README: "CPU real-time" | Lựa chọn open, có license thoáng, **có sẵn accent Úc** mà tôi tìm được. Cài trên Windows dễ lỗi (mecab/unidic); README khuyên Windows chạy Docker, hoặc dùng WSL. |
| OHF-Voice/piper1-gpl (kế nhiệm rhasspy/piper, repo cũ đã ARCHIVED) | 6.4k / 2026-11-23 / **GPL-3.0** / v1.8.0 | **DÙNG (đa dạng giọng vùng miền Anh)** | en_GB: alan, alba (Scotland), aru, cori, jenny_dioco, **northern_english_male**, semaine, southern_english_female, vctk (nhiều người nói). en_US: ~30 giọng. Không có en_AU. | rất nhanh | Phần IELTS Listening có nhiều accent, giọng vùng miền Anh của Piper bổ sung tốt cho Kokoro. GPL chỉ ràng buộc mã piper, file audio sinh ra thì không. **Mỗi voice có license riêng trong MODEL_CARD**, phải kiểm từng giọng. |
| resemble-ai/chatterbox | 28.1k / 2026-11-04 / MIT | **CÓ THỂ** | Clone zero-shot. Nano 110M: "3x realtime trên 8 nhân CPU" | có (Nano/Turbo) | Hai điểm cần biết: **README ghi repo giờ chỉ là archive, không còn hỗ trợ/cập nhật**, và **mọi audio đều gắn watermark Perth**. Có thể dùng để tạo thêm giọng Úc từ mẫu tham chiếu hợp pháp (tự ghi âm, hoặc nguồn CC0 có sự đồng ý). |
| SWivid/F5-TTS | 15.7k / 2026-11-03 / MIT code, **weights CC-BY-NC** | **CÓ THỂ** | Clone zero-shot | chậm trên CPU, GPU 4 GB tạm được | NC chấp nhận được vì phi thương mại; nếu sau này thương mại hoá thì không dùng được. |
| KittenML/KittenTTS | 17.1k / 2026-11-19 / Apache-2.0 code; **KittenTTS 2 weights theo "Stellon Labs Community License"** | **CÓ THỂ** | 115 giọng, model 4 MB–1.7B | rất tốt | Nhỏ, hợp chạy trong trình duyệt, nhưng **chưa kiểm** accent Anh/Úc và điều khoản license weights. |
| microsoft/VibeVoice | 57.5k / 2026-10-08 / MIT | **CÓ THỂ (sau)** | Realtime-0.5B có 11 giọng "English style" | cần GPU | Mạnh về hội thoại dài nhiều người nói (Listening Part 1/3?). Cần thử nghiệm. |
| yl4579/StyleTTS2 | 6.4k / 2024-03-07 / MIT | **BỎ** | – | – | Đứng yên từ 2024; Kokoro chính là bản kế thừa kiến trúc StyleTTS2. |
| neuphonic/neutts | 6.3k / 2026-07-22 / Apache (bản Air) + NeuTTS Open License (bản khác) | **BỎ** | clone | có | License trộn, có watermark. |
| fishaudio/fish-speech | 33.9k / 2026-10-29 / **Fish Audio Community License** | **BỎ** | – | GPU | License riêng, không phải OSI. |
| nari-labs/dia · canopyai/Orpheus-TTS | 19.4k (2025-11) · 6.4k (2025-12) / Apache-2.0 | **BỎ** | – | GPU | Nặng, cần GPU, đã chậm cập nhật. |
| idiap/coqui-ai-TTS | 2.4k / 2026-11-22 / MPL-2.0 | **BỎ** | – | – | Toolkit lớn; XTTS weights theo CPML (không thương mại). Không đáng công so với Kokoro. |
| remsky/Kokoro-FastAPI | 5.7k / 2026-11-21 / Apache-2.0 | **CÓ THỂ** | như Kokoro | có | Server API kiểu OpenAI bọc Kokoro, tiện nếu script Node gọi qua HTTP. |

**Kết luận TTS:** Kokoro làm giọng Mỹ/Anh chính (giữ nguyên), Piper en_GB cho giọng vùng miền Anh, MeloTTS EN-AU cho giọng Úc. Muốn thêm giọng Úc thứ hai thì dùng Chatterbox hoặc F5 clone từ mẫu hợp pháp. **Render sẵn file mp3/opus, không chạy TTS trong trình duyệt**, trừ tính năng "đọc câu tự nhập" thì mới dùng kokoro-js.

### 2b. ASR trong trình duyệt, chấm phát âm, forced alignment — pha speaking/audio

| Repo / model | Sao / commit / license | Kết luận | Dùng vào việc gì | CPU |
|---|---|---|---|---|
| huggingface/transformers.js (`@huggingface/transformers` 4.3.2) | 16.5k / 2026-11-23 / Apache-2.0 | **DÙNG** | Lõi inference trong trình duyệt. Mặc định chạy WASM/CPU, có tuỳ chọn `device:'webgpu'`. Dùng cho ASR (Whisper/Moonshine) và nhận dạng âm vị (wav2vec2). | có |
| moonshine-ai/moonshine (`onnx-community/moonshine-base-ONNX`) | 11.6k / 2026-11-06 / **MIT (cả model tiếng Anh)** | **DÙNG** | ASR tiếng Anh độ trễ thấp để lấy transcript bài Speaking rồi dán vào packet Claude. Decoder int8 ~42 MB. | tốt |
| Whisper base.en (`onnx-community/whisper-base.en`) | qua transformers.js / MIT | **DÙNG (dự phòng)** | ASR chính xác hơn với accent Việt. Decoder int8 ~54 MB. | được |
| `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX` (HF) | Apache-2.0 (theo base model) | **CÓ THỂ (tính năng nâng cao)** | **Nhận dạng âm vị IPA** để chấm phát âm: so chuỗi âm vị nghe được với IPA chuẩn tính sẵn ở pipeline (misaki/espeak). Bản q4 ~242 MB, bnb4 ~223 MB, nên **chỉ tải khi người dùng bật chế độ phát âm**. Bản "student" `air-air/xlsr-53-espeak-student-ONNX` chỉ ~77 MB nhưng **không được huấn luyện cho tiếng Anh** (thẻ model chỉ ghi de/es/fr/…), không dùng được. | nặng nhưng chạy được |
| OpenPronounce/OpenPronounce | 248 / 2026-11-23 / **AGPL-3.0** | **CÓ THỂ (tham chiếu/offline)** | Chấm phát âm ở mức âm vị (accuracy/fluency/prosody). Pearson 0.85 trên speechocean762 cho người lớn. Cần Python + 2 checkpoint 1.2 GB, **không chạy trên static host**. Dùng để (a) đối chiếu/hiệu chỉnh thang điểm phiên bản trình duyệt, (b) công cụ local cho chính chủ dự án. AGPL: nếu public như dịch vụ mạng thì phải công bố mã. | được (CPU wheels) |
| @ricky0123/vad-web (repo ricky0123/vad) | 2.1k / 2026-09-12 / ISC | **DÙNG** | Silero VAD trong trình duyệt: tự cắt khi người nói ngừng, đo thời gian ngập ngừng (gợi ý cho Fluency). | tốt |
| snakers4/silero-vad | 10.8k / 2026-11-24 / MIT | (model nền của vad-web) | – | – |
| ggml-org/whisper.cpp | (xem mục 1) | **DÙNG** | QA audio TTS ở pipeline. Có cờ timestamp từng từ (experimental). | tốt |
| SYSTRAN/faster-whisper | 27.0k / 2026-11-12 / MIT | **CÓ THỂ** | Thay thế whisper.cpp nếu muốn ở trong Python. | tốt |
| m-bain/whisperX | 25.7k / 2026-11-21 / BSD-2 / v3.8.6 | **CÓ THỂ** | Timestamp từng từ bằng alignment wav2vec2, **chỉ cần cho audio người thật** (podcast/bài nghe ghi âm). Audio Kokoro đã có timestamp sẵn. | được (CPU) |
| MontrealCorpusTools/Montreal-Forced-Aligner | 1.9k / 2026-11-16 / MIT | **BỎ** | Chính xác ở mức âm vị nhưng cần Kaldi/conda, quá nặng cho nhu cầu karaoke. | có |
| readbeyond/aeneas | 2.9k / **2020-05-13** / AGPL-3.0 | **BỎ** | Đứng yên từ 2020. | – |
| strob/gentle (lowerquality/gentle chuyển hướng về đây) | 1.7k / 2025-02 / MIT | **BỎ** | Kaldi, đã cũ. | – |
| k2-fsa/sherpa-onnx | 16.2k / 2026-11-24 / Apache-2.0 / v2.0.3 | **CÓ THỂ** | Một bộ ASR/TTS/VAD có build WASM. Là phương án B nếu transformers.js quá chậm. | tốt |
| alphacep/vosk-api + vosk-browser | 15.3k / 2026-10-15 / Apache-2.0; npm vosk-browser **sửa lần cuối 2022-12** | **BỎ** | Bản dành cho trình duyệt đã bỏ hoang; chất lượng kém Whisper/Moonshine. | – |
| xenova/whisper-web | 3.3k / **2023-12-07** / không có license | **BỎ** | Demo cũ, không license, chỉ để tham khảo code. | – |
| linto-ai/whisper-timestamped | 2.9k / 2026-09-28 / AGPL-3.0 | **BỎ** | whisperX hoặc whisper.cpp đã làm được việc này. | – |
| YuanGongND/gopt | 235 / 2023-02 / BSD-3 | **BỎ** | Mã nghiên cứu, không có runtime dùng được ngay. | – |

### 2c. Ngữ pháp, độ khó văn bản, CEFR — pha data

| Repo | Sao / commit / license | Kết luận | Dùng vào việc gì | CPU |
|---|---|---|---|---|
| Automattic/harper (`harper.js` 3.2.0) | 17.9k / 2026-11-24 / Apache-2.0 / v3.3.0 | **DÙNG** | Bắt lỗi ngữ pháp/chính tả **offline trong trình duyệt (WASM)** khi người dùng gõ Writing: gạch chân tức thì trước khi xuất packet sang Claude. Gói npm 96 MB khi giải nén (chứa nhiều bản build); **cần đo dung lượng wasm thực tải**. | rất nhanh |
| languagetool-org/languagetool | 15.3k / 2026-11-24 / LGPL-2.1 | **CÓ THỂ (pipeline)** | Server local bằng Java 17, bắt nhiều lỗi hơn Harper. Dùng để **QA nội dung đã sinh** (câu mẫu, đáp án) trong pipeline. Không đưa lên static host. | có (Java) |
| grammarly/gector · PrithivirajDamodaran/Gramformer | 980 (2022-10) · 1.6k (2022-12) / Apache · MIT | **BỎ** | Đứng yên từ 2022; Claude chấm bài tốt hơn. | – |
| textstat/textstat | 1.4k / 2026-10-26 / MIT / 0.7.13 | **DÙNG (pipeline Python)** | Flesch, FK grade, Dale-Chall… để gắn độ khó cho đoạn đọc/nghe. **Lưu ý:** gói npm `textstat` là một tool khác của textlint, không phải bản port. | có |
| LSYS/LexicalRichness | 116 / 2026-05-02 / MIT | **DÙNG (pipeline)** | MTLD, HD-D, TTR: đo đa dạng từ vựng (gần với tiêu chí Lexical Resource), dùng gắn nhãn đoạn mẫu. | có |
| kristopherkyle/lexical_diversity | 86 / 2023-09 / **không có license** | **BỎ** | Không có license nên không được dùng. TAALES/TAACO gốc là app desktop đóng, không có trên GitHub (chỉ thấy repo tài liệu `LCR-ADS-Lab/TAALES-doc`). | – |
| explosion/spaCy | 34.1k / 2026-11-21 / MIT | **DÙNG (pipeline)** | Lemmatize và gắn POS trước khi tra CEFR/tần suất từ. | có |
| openlanguageprofiles/olp-en-cefrj | 231 / 2020-03 / CEFR-J: miễn phí cả thương mại **nếu trích dẫn**; **Octanove C1/C2: CC BY-SA 4.0** | **DÙNG (dữ liệu)** | Nhãn CEFR A1–C2 cho từ vựng. **Cảnh báo share-alike:** file dữ liệu dẫn xuất từ Octanove phải giữ CC BY-SA. | – |
| rspeer/wordfreq | 1.8k / 2025-01 / Apache code, dữ liệu CC BY-SA / **SUNSET** | **CÓ THỂ** | Tần suất từ (Zipf) cho độ hiếm. Dữ liệu đóng băng; tác giả ghi đã ngừng phát triển (SUNSET.md). | có |
| Bộ phân loại CEFR cho văn bản | (tìm trên GitHub: chỉ có repo 0–23 sao) | **BỎ** | Không có repo đủ tin cậy. Thay bằng cách kết hợp tỉ lệ từ theo CEFR-J/Octanove, textstat và Claude kiểm tra. | – |

### 2d. UI, animation, asset, âm thanh, font — pha UI-UX/assets/animation

| Repo (gói npm) | Sao / commit / license | Kết luận | Dùng vào việc gì |
|---|---|---|---|
| motiondivision/motion (`motion` 14.14.0) | 35.5k / 2026-11-24 / MIT | **DÙNG (giữ)** | Animation chính. Có layout animation + spring, đủ cho cảm giác "snap" chuẩn. |
| formkit/auto-animate (0.11.0) | 14.0k / 2026-11-24 / MIT | **CÓ THỂ** | Một dòng là danh sách/thẻ tự animate khi thêm/xoá (deck từ, hàng đợi ôn tập). Nhẹ. |
| pmndrs/react-spring (v10.1.2) | 29.3k / 2026-11-23 / MIT | **BỎ** | Trùng vai với motion. |
| catdad/canvas-confetti (1.9.4) | 12.9k / 2025-10-25 / ISC | **DÙNG** | Pháo giấy khi lên level hoặc chuỗi đúng. Không có dependency, rất nhẹ. |
| tsparticles/tsparticles (`@tsparticles/react` 4.6.0) | 9.1k / 2026-11-18 / MIT | **CÓ THỂ** | Nền hạt lấp lánh pastel. Nặng hơn confetti nhiều, chỉ dùng bản `slim`. |
| LottieFiles/dotlottie-web (`@lottiefiles/dotlottie-react` 0.22.3) | 959 / 2026-11-18 / MIT | **CÓ THỂ** | Player Rust/WASM cho mascot/icon động. **airbnb/lottie-web đứng yên từ 2024-11**, nên chọn dotlottie. **Từng file Lottie có license riêng** (thư viện LottieFiles dùng "Lottie Simple License"), phải kiểm từng file. |
| rive-app/rive-react (`@rive-app/react-canvas` 4.41.0) | 1.2k / 2026-11-21 / MIT (runtime) | **CÓ THỂ** | Mascot có state machine (vui/buồn/cổ vũ phản ứng theo đáp án). Runtime MIT, nhưng **trình soạn Rive là freemium**. |
| lucide-icons/lucide (`lucide-react` 1.79.0) | 26.0k / 2026-11-24 / ISC | **DÙNG** | Icon UI chính, nét bo tròn hợp phong cách dễ thương. |
| phosphor-icons (`@phosphor-icons/react` 2.1.10) | core 407 / 2026-01; gói react sửa lần cuối 2025-05 / MIT | **CÓ THỂ** | Có kiểu fill/duotone mềm hơn, nhưng gói react ít cập nhật. |
| tabler/tabler-icons (3.53.0) | 22.8k / 2026-11-24 / MIT | **CÓ THỂ** | Phương án dự phòng, hơn 6.500 icon. |
| microsoft/fluentui-emoji | 10.2k / 2026-08-24 / **MIT** | **DÙNG** | Emoji 3D/flat chất lượng cao, MIT toàn bộ. Rất hợp minh hoạ thẻ từ vựng và phần thưởng. |
| jdecked/twemoji | 1.9k / 2026-06-01 / code MIT, **đồ hoạ CC-BY 4.0** | **CÓ THỂ** | Cần ghi công tác giả. |
| hfg-gmuend/openmoji | 4.6k / 2026-11-23 / **CC-BY-SA 4.0** | **BỎ** | Share-alike lan sang asset dẫn xuất. |
| elizabetdev/react-kawaii (trước là miukimiu) | 3.0k / 2025-09-28 / MIT | **CÓ THỂ (rất hợp theme)** | Component SVG "kawaii" có cảm xúc (mood props). Hợp với theme kiểu Hello Kitty cho mascot đơn giản. |
| dicebear/dicebear | 10.1k / 2026-11-25 / MIT (code) | **CÓ THỂ** | Avatar người chơi. **Mỗi style avatar có license riêng** (có style CC BY 4.0), phải chọn style CC0. |
| Kenney (kenney.nl, ví dụ "Interface Sounds") | đã kiểm trang: **CC0**, 100 file | **DÙNG** | SFX click/pop/confirm/error, không cần ghi công. |
| KilledByAPixel/ZzFX (`zzfx` 1.4.0) | 813 / 2026-11-03 / MIT | **DÙNG** | SFX sinh bằng code, chưa tới 1 KB. Không cần file asset, offline 100%, tinh chỉnh từng âm "pop" cho cảm giác ASMR. |
| chr15m/jsfxr (1.4.1) | 468 / 2026-05-05 / Unlicense | **CÓ THỂ** | Công cụ thiết kế SFX kiểu sfxr, xuất wav hoặc dùng runtime. |
| goldfire/howler.js (2.2.4) | 25.5k / commit 2025-11; **npm publish cuối 2023-09** / MIT | **DÙNG (giữ)** | Ổn định nhưng ít phát hành. Đủ cho sprite SFX và nhạc nền. |
| Font (fontsource, đã kiểm subset) | OFL-1.1 | **DÙNG** | Có subset `vietnamese`: **Nunito** (variable), **Baloo 2** (variable, tiêu đề tròn kiểu game), **Quicksand** (variable), **Lexend** (variable, dễ đọc), **Be Vietnam Pro** (static). **Fredoka không có subset vietnamese, tránh dùng.** Repo googlefonts/lexend đã ARCHIVED (font vẫn có trên Google Fonts/fontsource). |

### 2e. Performance/PWA — pha perf

| Repo (gói) | Sao / commit / license | Kết luận | Dùng vào việc gì |
|---|---|---|---|
| vite-pwa/vite-plugin-pwa (2.0.0) | 4.3k / 2026-10-09 / MIT | **DÙNG** | Peer dependency nhận vite ^3–^8, workbox ^7.4.1. Tạo service worker, precache app shell, `registerType:'prompt'` để cập nhật. |
| GoogleChrome/workbox (7.4.1) | 13.1k / 2026-09-02 / MIT | **DÙNG** | Runtime caching cho audio: `CacheFirst` + **`RangeRequestsPlugin`** (thiếu plugin này thì tua audio đã cache bị lỗi trên Safari) + `ExpirationPlugin`. Tải gói audio theo từng unit, không precache tất cả. |
| btd/rollup-plugin-visualizer (7.3.0) | 2.4k / 2026-11-24 / MIT | **DÙNG** | Soi bundle, phát hiện transformers.js/harper lọt vào chunk chính. |
| GoogleChrome/lighthouse-ci (`@lhci/cli` 0.16.1) | 7.2k / 2026-11-17 / Apache-2.0 | **DÙNG** | Đặt budget hiệu năng/PWA/a11y trong CI. |
| GoogleChrome/web-vitals (6.2.3) | 8.7k / 2026-11-09 / Apache-2.0 | **DÙNG** | Đo INP/LCP/CLS thực, ghi vào Dexie để tự xem (không gửi đi đâu). |
| dexie/Dexie.js (4.4.7) | 14.7k / 2026-11-09 / Apache-2.0 | **DÙNG (giữ)** | Dùng `bulkPut`/`bulkGet` và index compound `[deckId+due]` cho truy vấn FSRS. Lưu blob audio trong Cache Storage, không lưu trong IndexedDB. |

### 2f. QA — pha QA

| Repo (gói) | Sao / commit / license | Kết luận | Dùng vào việc gì |
|---|---|---|---|
| dequelabs/axe-core + `@axe-core/playwright` 4.14.1 | 7.9k / 2026-11-23 / MPL-2.0 | **DÙNG** | Quét a11y trong test Playwright có sẵn. MPL chỉ là dev dependency nên không ảnh hưởng. |
| Playwright `toHaveScreenshot()` (có sẵn) | – | **DÙNG** | So sánh ảnh chụp cho các màn chính ở 390/768/1440. Đặt `animations:'disabled'`. |
| tajo/ladle (`@ladle/react` 5.1.1) | 3.0k / 2026-06-28 / MIT | **DÙNG (nhẹ)** | Xem story component dựa trên Vite, khởi động nhanh. Đủ để agent và chủ dự án duyệt từng component. |
| storybookjs/storybook (10.6.8) | 91.7k / 2026-11-24 / MIT | **CÓ THỂ** | Mạnh hơn (addon vitest, docs) nhưng nặng. Chỉ nên chọn nếu cần docs component đầy đủ. |

### 2g. Agent skill cho chất lượng UI (Antigravity + Claude Code)

| Repo | Sao / commit / license | Kết luận | Ghi chú |
|---|---|---|---|
| pbakaus/impeccable | 116.3k / 2026-11-18 / Apache-2.0 | **DÙNG** | Hỗ trợ cả Antigravity và Claude Code. Quy trình: chạy `/impeccable init` (tạo PRODUCT.md), sau đó `critique`, `polish`, `audit` theo từng màn; `npx impeccable detect src/` trong CI. |
| anthropics/skills → `skills/frontend-design` | 200.0k / 2026-11-16 / license theo từng skill (`LICENSE.txt` trong thư mục skill) | **DÙNG** | Skill frontend-design chính chủ của Anthropic, cho Claude Code. Repo còn có `webapp-testing` (Playwright) và `theme-factory`. |
| nextlevelbuilder/ui-ux-pro-max-skill | 153.8k / 2026-11-24 / MIT / v2.15.0 | **CÓ THỂ** | Cơ sở dữ liệu tra cứu: 80 style, 194 palette, 74 cặp font. Có `uipro init --ai antigravity` (npm `uipro-cli` 2.2.3). Dùng một lần để chọn palette/font rồi đóng băng vào DESIGN.md. |
| Leonxlnx/taste-skill | (xem mục 1) | **CÓ THỂ** | Chỉ cho landing/marketing page. |
| VoltAgent/awesome-design-md | (xem mục 1) | **CÓ THỂ** | Học format, tự viết DESIGN.md riêng. |
| obra/superpowers | 325.9k / 2026-11-03 / MIT / v7.0.2 | (đã dùng) | Quy trình kế hoạch/TDD/review, không phải skill thiết kế. |

---

## 3. Stack khuyến nghị cuối cùng theo pha (kèm lệnh cài)

### Pha data (pipeline nội dung, Python)
- spaCy (lemma/POS), textstat (độ khó), LexicalRichness (MTLD), CEFR-J + Octanove (nhãn CEFR, **ghi rõ nguồn**), wordfreq (độ hiếm, tuỳ chọn), LanguageTool server (QA câu sinh ra).
```bash
pip install -U spacy textstat lexicalrichness wordfreq
python -m spacy download en_core_web_sm
git clone https://github.com/openlanguageprofiles/olp-en-cefrj data/cefrj   # trích dẫn CEFR-J; Octanove = CC BY-SA 4.0
# LanguageTool (Java 17): tải bản zip từ languagetool.org rồi chạy server local, ví dụ:
# java -cp languagetool-server.jar org.languagetool.server.HTTPServer --port 8081
```

### Pha audio (render sẵn, offline)
- **Kokoro** (giọng Mỹ/Anh chính + timestamp từng từ cho karaoke/dictation) → **Piper en_GB** (giọng vùng miền Anh) → **MeloTTS EN-AU** (giọng Úc, chạy Docker/WSL) → **whisper.cpp** để QA: transcribe lại, tính WER so với script, WER cao thì render lại.
- Xuất opus/mp3 theo gói từng unit kèm `timings.json` (start_ts/end_ts lấy từ Kokoro).
```bash
pip install -U "kokoro>=0.9.4" soundfile          # + espeak-ng cho fallback G2P
pip install piper-tts                              # OHF-Voice/piper1-gpl; voice tải từ HF rhasspy/piper-voices
git clone https://github.com/myshell-ai/MeloTTS && cd MeloTTS && docker build -t melotts .   # README khuyên Docker cho Windows
# whisper.cpp: tải bản Windows từ Releases v1.9.6 + model ggml-base.en.bin
# Tuỳ chọn GUI nghe thử: jamiepine/voicebox (Windows MSI)
```

### Pha speaking (trong trình duyệt, CPU/WASM, lazy-load)
- `@ricky0123/vad-web` (cắt câu, đo ngập ngừng) → **Moonshine base** qua transformers.js (transcript, fallback Whisper base.en) → transcript và số liệu (WPM, số lần ngập ngừng) đưa vào packet dán sang Claude chấm.
- Pha 2: chế độ phát âm dùng `wav2vec2-lv-60-espeak-cv-ft-ONNX` (q4 ~242 MB, chỉ tải khi bật) so với IPA chuẩn tính sẵn ở pipeline. Dùng OpenPronounce chạy local để hiệu chỉnh thang điểm.
- Tất cả model chạy trong **Web Worker**, cache bằng Cache Storage để dùng offline.
```bash
npm i @huggingface/transformers @ricky0123/vad-web
# (Pha 2, tuỳ chọn) TTS câu tự nhập: npm i kokoro-js   ← cảnh báo: kéo transformers.js v3
```

### Pha Writing (trong trình duyệt)
```bash
npm i harper.js        # gạch lỗi realtime trước khi xuất packet sang Claude; load động qua import()
```

### Pha UI-UX / assets / animation
```bash
npm i motion canvas-confetti @formkit/auto-animate lucide-react zzfx
npm i @fontsource-variable/nunito @fontsource-variable/baloo-2 @fontsource-variable/lexend
# Tuỳ chọn: npm i @lottiefiles/dotlottie-react  |  npm i @rive-app/react-canvas  |  npm i react-kawaii
# Asset: Fluent Emoji (MIT, copy SVG/PNG cần dùng vào /public), Kenney Interface Sounds (CC0)
```

### Agent skills (chất lượng UI)
```bash
npx impeccable install                 # sau đó trong agent chạy: /impeccable init
# Claude Code: cài skill frontend-design từ anthropics/skills (plugin marketplace hoặc copy skills/frontend-design vào .claude/skills)
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"   # chỉ khi làm landing page
# Tuỳ chọn: npm i -g uipro-cli && uipro init --ai antigravity
```
Viết `DESIGN.md` riêng (token màu pastel, bo góc, thời lượng/easing của motion, quy tắc âm thanh) tham khảo format của awesome-design-md, rồi trỏ cả Antigravity lẫn Claude Code vào file này.

### Pha perf / PWA
```bash
npm i -D vite-plugin-pwa workbox-window rollup-plugin-visualizer @lhci/cli
npm i web-vitals
```
Cấu hình chính: precache shell, audio dùng runtimeCaching `CacheFirst` + `RangeRequestsPlugin` + `ExpirationPlugin`, model ONNX dùng cache riêng theo phiên bản, tách transformers.js/harper vào dynamic `import()`.

### Pha QA
```bash
npm i -D @axe-core/playwright @ladle/react
npx impeccable detect src/ --json      # chạy trong CI cạnh lhci autorun
```

### Pha video-marketing (sau khi có sản phẩm)
```bash
npx skills add heygen-com/hyperframes   # cần Node 22+ và FFmpeg
npx hyperframes init promo && npx hyperframes preview && npx hyperframes render
```

---

## 4. Rủi ro license / kỹ thuật

**License**
1. **Share-alike (CC BY-SA):** Octanove C1/C2, dữ liệu wordfreq, OpenMoji. Mọi file dữ liệu dẫn xuất (ví dụ `vocab-cefr.json`) phải giữ CC BY-SA và ghi nguồn. Cách xử lý: tách thành file dữ liệu riêng, ghi rõ license.
2. **Phi thương mại (NC):** weights F5-TTS (CC-BY-NC), weights OmniVoice mặc định của VoiceStudio, XTTS (CPML). Hiện ổn vì dự án phi thương mại, nhưng **không được thương mại hoá** nếu đã dùng audio từ các model này. Kokoro (Apache), Piper (tuỳ voice), MeloTTS (MIT) thì an toàn.
3. **GPL/AGPL cho công cụ:** ComfyUI, piper1-gpl (GPL-3.0), OpenPronounce, VoiceStudio, OpenMontage (AGPL). Dùng làm công cụ local thì output không bị ràng buộc. **Không nhúng mã** vào app, và **không public OpenPronounce như dịch vụ** nếu không công bố mã nguồn.
4. **License theo từng asset:** từng voice Piper (MODEL_CARD), từng file Lottie, từng style DiceBear, từng checkpoint ComfyUI. Cần lập bảng `CREDITS.md`.
5. **CC-BY 4.0** (Twemoji graphics, một số voice Piper): bắt buộc ghi công trong màn "Credits".
6. **Watermark:** Chatterbox (Perth) và NeuTTS gắn watermark vào audio. Không ảnh hưởng tai nghe nhưng nên biết.
7. **Bắt chước thương hiệu:** không dùng nguyên DESIGN.md của brand thật hay "Hello Kitty" thật. Chỉ lấy cảm hứng "kawaii pastel" (Sanrio giữ bản quyền nhân vật).
8. **CEFR-J:** miễn phí nhưng **bắt buộc trích dẫn** (Tono Laboratory, TUFS).

**Kỹ thuật**
1. **Dung lượng model trong trình duyệt:** wav2vec2 phoneme q4 ~242 MB, Kokoro q8 ~86–92 MB, Moonshine/Whisper base ~100–200 MB tổng encoder+decoder. Phải lazy-load, có thanh tiến độ, cache theo phiên bản, và cho người dùng xoá. Trên máy yếu, inference WASM có thể mất vài giây mỗi câu.
2. **Hai bản transformers.js:** `kokoro-js` cần `@huggingface/transformers` ^3.5, trong khi ASR dùng 4.x. Bundle phình và có thể xung đột onnxruntime-web. Nếu cần TTS trong trình duyệt, cân nhắc `@mintplex-labs/piper-tts-web` (MIT, 1.0.5) hoặc gọi Kokoro ONNX trực tiếp qua transformers 4.
3. **Repo đứng yên:** MeloTTS (2024-12), StyleTTS2 (2024-03), lottie-web (2024-11), aeneas (2020), vosk-browser (2022), whisper-web (2023), GECToR (2022). Chatterbox tự tuyên bố là archive. Cài MeloTTS trên Windows dễ vỡ nên dùng Docker/WSL.
4. **harper.js:** gói 96 MB khi giải nén; cần đo dung lượng wasm thực tải và chỉ load ở màn Writing.
5. **Audio offline:** thiếu `RangeRequestsPlugin` thì audio đã cache không tua được (Safari/iOS). Quota Cache Storage trên iOS có giới hạn, nên chia gói audio theo unit.
6. **Độ tin cậy chấm phát âm:** OpenPronounce chỉ được đo trên người học Mandarin (speechocean762); với trẻ em, Pearson giảm còn 0.42–0.67. Nên hiển thị là "gợi ý", không phải điểm band.
7. **Sao không đồng nghĩa với chất lượng:** nhiều repo skill/AI năm 2026 có số sao tăng vọt. `RVC-Boss/GPT-SoVITS` là repo mới 18 sao (repo gốc đã chuyển sang `bilibili/GPT-SoVITS`), nên **kiểm owner và ngày tạo trước khi clone** để tránh repo giả mạo.

---

## 5. Chưa kiểm được

- **Chất lượng nghe thực tế** của MeloTTS EN-AU, Piper en_GB và KittenTTS 2. Chưa chạy, chưa nghe; cần nghe thử qua voicebox hoặc demo HF trước khi chốt.
- **Tốc độ thực trên máy này** (Ryzen 5 5600H / RTX 3050 4 GB): Kokoro CPU vs CUDA, Moonshine/Whisper WASM trên trình duyệt, wav2vec2 q4 trong trình duyệt. Mới dựa vào số liệu trong README.
- **VRAM thật của GPU:** WMI báo 4 GB (trường AdapterRAM có thể bị giới hạn ở 4 GB). Cần xác nhận bằng `nvidia-smi`.
- **License cụ thể từng voice Piper** (MODEL_CARD từng giọng) và **Stellon Labs Community License** của KittenTTS 2. Chưa đọc chi tiết.
- **Dung lượng wasm thực tải của harper.js** và mức độ bắt lỗi ngữ pháp kiểu học viên (Harper chủ yếu bắt chính tả/văn phong, có thể bỏ sót lỗi thì/mạo từ).
- **Tương thích vite-plugin-pwa 2.0 với cấu hình hiện tại của V3** (peer dependency có vite ^8, nhưng chưa build thử).
- **Bản phân loại CEFR mức văn bản đủ tốt:** không tìm thấy repo đáng tin (các repo tìm được có 0–23 sao).
- **Mẫu giọng Úc hợp pháp để clone** (nguồn CC0 có sự đồng ý của người nói). Chưa tìm.
- **Nội dung chi tiết skill `frontend-design` của anthropics/skills** và license trong `LICENSE.txt` của nó. Mới xác nhận skill tồn tại (SKILL.md + LICENSE.txt).
- Điều khoản sử dụng file Lottie của LottieFiles (Lottie Simple License). Chưa mở trang license.
