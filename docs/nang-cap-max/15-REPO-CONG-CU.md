# 15 · REPO VÀ CÔNG CỤ · theo phase (đã kiểm sao, commit, license ngày 25/11/2026)

> Chi tiết đánh giá từng repo: `nghien-cuu/R4-REPO-PRODUCTION.md`. Số sao không phải thước đo chất lượng; **kiểm owner và ngày tạo trước khi clone** (vd `RVC-Boss/GPT-SoVITS` là repo mới 18 sao, repo gốc là `bilibili/GPT-SoVITS`).

## 1. 21 repo Bang gửi (`C:\Users\nhatb\Downloads\Repo Khá nổi`): kết luận
| Repo | Kết luận | Dùng vào |
|---|---|---|
| **pbakaus/impeccable** | **DÙNG** | Soát UI: 62 luật tất định, `npx impeccable detect src/` chạy trong CI; có hỗ trợ Antigravity + Claude Code (`/impeccable init`, `critique`, `polish`, `audit`) |
| **ggml-org/whisper.cpp** | **DÙNG** | QA audio TTS (WER), timestamp cho audio người thật |
| Comfy-Org/ComfyUI | CÓ THỂ (công cụ local) | Sinh hình minh hoạ/nền. **Không** dùng cho nhân vật Lexi (luật K10) |
| excalidraw | CÓ THỂ | Wireframe, flow, giao cho agent; không nhúng vào app |
| VoltAgent/awesome-design-md | CÓ THỂ | Học format để viết `DESIGN.md` riêng; không chép DESIGN.md của thương hiệu |
| Leonxlnx/taste-skill | CÓ THỂ | Chỉ cho landing page, không dùng cho UI game |
| jamiepine/voicebox | CÓ THỂ | Phòng nghe thử giọng (Kokoro, LuxTTS…) trước khi chốt |
| heygen-com/hyperframes | CÓ THỂ (NC-8) | Video giới thiệu từ chính UI |
| debpalash/VoiceStudio | Thấp (AGPL, weights NC) | Chỉ nếu cần thiết kế giọng |
| openai/whisper | BỎ (dùng bản port) | → whisper.cpp / transformers.js |
| VoxCPM | BỎ (cần ~8 GB VRAM; máy có 4 GB) | – |
| tensorflow, pytorch, LLMs-from-scratch, ML/GenAI-for-beginners, prompts.chat, open-design, OpenMontage, GPT-SoVITS, RVC | BỎ | Không khớp nhu cầu hoặc quá nặng |

## 2. Stack theo phase
**Dữ liệu (Python, venv cục bộ `scripts/data2/.venv`):**
- spaCy (lemma/POS), textstat, LexicalRichness, wordfreq, pandas, ERRANT;
- LanguageTool server (Java 17, QA câu);
- CEFR-J/Octanove (`openlanguageprofiles/olp-en-cefrj`), kaikki JSONL, OEWN, ipa-dict, CMUdict, Tatoeba export.

**Audio (render offline):**
- `kokoro` + `kokoro-onnx` (giọng chính, có timestamp từng từ);
- `piper-tts` (OHF-Voice/piper1-gpl, chỉ dùng lúc build, không bundle);
- MeloTTS EN-AU (Docker/WSL);
- whisper.cpp (QA);
- ffmpeg qua `imageio-ffmpeg`;
- tuỳ chọn F5-TTS/Chatterbox clone giọng từ mẫu có đồng ý.

**Gói riêng:** Tesseract hoặc PaddleOCR (cục bộ) để OCR sách đã mua; ffmpeg cắt audio.

**Trình duyệt (lazy, Web Worker):**
- `@huggingface/transformers` (Moonshine/Whisper ASR; wav2vec2 phoneme ở pha 2);
- `@ricky0123/vad-web`;
- `harper.js`.
- **Không** dùng `kokoro-js` trong trình duyệt (kéo transformers v3, lệch bản v4).

**UI / animation:**
- giữ `motion`, `canvas-confetti`, `howler`, `lucide-react`, `zzfx`;
- thêm `@formkit/auto-animate` (danh sách);
- font `@fontsource-variable/baloo-2`, `lexend`, `nunito` (có subset vietnamese; **tránh Fredoka**).

**QA / hiệu năng:**
- `@lhci/cli`, `web-vitals`, `rollup-plugin-visualizer`;
- `@axe-core/playwright` (đã có);
- `@ladle/react` (duyệt component nhẹ);
- `npx impeccable detect`.

**PWA:** `vite-plugin-pwa` + workbox:
- audio `CacheFirst` + **`RangeRequestsPlugin`** + `ExpirationPlugin`;
- model ONNX dùng cache riêng theo phiên bản.

## 3. Lệnh cài
```bash
# dữ liệu (PowerShell: chạy trong scripts\data2)
python -m venv .venv ; .\.venv\Scripts\pip install -U spacy textstat lexicalrichness wordfreq pandas errant ; .\.venv\Scripts\python -m spacy download en_core_web_sm
# audio
.\.venv\Scripts\pip install -U "kokoro>=0.9.4" kokoro-onnx soundfile piper-tts imageio-ffmpeg
# app
npm i @huggingface/transformers @ricky0123/vad-web harper.js @formkit/auto-animate web-vitals
npm i -D @lhci/cli rollup-plugin-visualizer @ladle/react impeccable
```
Mỗi thư viện mới phải: đo gzip trước, ghi 1 dòng `DECISIONS.md`, nằm trong dynamic `import()` nếu > 50 KB.

## 4. Không dùng
- Repo/dataset chứa đề Cambridge hoặc đề crawl.
- OpenMoji (share-alike lên asset).
- `lottie-web` (đứng yên; nếu cần Lottie thì dùng dotlottie).
- vosk-browser (bỏ hoang).
- LanguageTool API công cộng (gửi dữ liệu ra ngoài).
- OpenPronounce nhúng vào app (AGPL).
