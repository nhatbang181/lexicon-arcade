# 11 · Assets: nguồn miễn phí, license, cách tải

> Worker **được phép tự tải** asset từ các nguồn trong danh sách dưới. Phải tuân thủ cả 4 điều:
> 1. Chỉ tải từ **domain trong danh sách**. Domain khác thì hỏi Bang.
> 2. Mỗi gói tải về đặt vào **thư mục tạm riêng** `scripts/assets/_downloads/<pack>/`, nằm trong `.gitignore`. **Không chạy file thực thi** trong gói. Chỉ copy file media cần dùng sang `public/assets/...`.
> 3. Ghi mỗi file đã dùng vào `public/assets/CREDITS.md` gồm: tên, nguồn, URL, license, tác giả, có sửa hay không.
> 4. Tối ưu trước khi commit:
>    - SVG qua `svgo`
>    - PNG qua `oxipng` hoặc chuyển sang WebP
>    - Audio theo `10` §3

## 1. Danh sách nguồn được phép

| Loại | Nguồn | License | Dùng cho |
|---|---|---|---|
| Icon UI | lucide.dev (`lucide-react`, đã cài) | ISC | Toàn bộ icon UI |
| Icon game | **game-icons.net** | CC BY 3.0, **phải ghi credit** tác giả và site | Icon 12 game, huy hiệu |
| UI kit, hình nền game | **kenney.nl** (UI Pack, UI Pack Space, Game Icons) | CC0 | Khung, nút hoạ tiết nếu cần, icon phụ |
| SFX | **kenney.nl**: Interface Sounds, UI Audio, Digital Audio, Impact Sounds | CC0 | `10` §3 |
| SFX dự phòng | freesound.org (**chỉ file CC0**), pixabay.com/sound-effects | CC0 / Pixabay Content License | Chỉ khi Kenney thiếu |
| Nhạc nền (tuỳ chọn) | pixabay.com/music, freepd.com | Pixabay License / Public Domain | 2–3 bản lofi |
| Minh hoạ | **undraw.co** | unDraw License (miễn phí, không cần ghi nguồn; kiểm điều khoản hiện hành) | Onboarding, empty state |
| Emoji/biểu tượng phụ | openmoji.org | CC BY-SA 4.0, ghi credit | Huy hiệu (tuỳ chọn) |
| Font | `@fontsource/*` (npm) từ Google Fonts | SIL OFL 1.1 | Be Vietnam Pro, Source Serif 4, JetBrains Mono |
| Animation Lottie (tuỳ chọn) | lottiefiles.com (chỉ file "Free" theo Lottie Simple License) | Lottie Simple License | 1–2 animation onboarding. **Ưu tiên tự làm bằng motion** |
| Wordlist | newgeneralservicelist.com | CC BY-SA 4.0 | Data (`05` §2) |
| TTS model | huggingface.co/hexgrad/Kokoro-82M | Apache-2.0 | Audio (`06`) |

**Cấm:**
- Asset từ Freepik, Flaticon (bắt buộc ghi nguồn phức tạp, có gói trả phí).
- Ảnh chụp có người thật.
- Logo hay giao diện của IELTS, British Council, IDP, Cambridge.
- Asset "free for personal use only" (vì app được deploy public).

## 2. Asset cần có (checklist cho worker `r-assets`)
```
public/assets/
  icons/games/{v1,v2,v3,l1,l2,r1,r2,w1,w2,s1,s2,x1}.svg   # từ game-icons.net, 1 màu currentColor, viewBox 0 0 512 512
  icons/badges/*.svg                                        # 12 huy hiệu (streak 7/30/100, 1k thẻ, band milestones...)
  illustrations/{welcome,goals,devices,placement,empty-cards,offline}.svg  # unDraw, đổi màu chủ đạo #3B82F6
  sfx/sfx.webm  sfx/sfx.mp3  sfx/sfx.json
  music/ (tuỳ chọn)  lofi-1.mp3 ...
  CREDITS.md
public/
  app_icon.png / favicon.ico  (giữ cái hiện có; nếu làm mới → scripts/generate_app_icon.py)
  pwa-192.png, pwa-512.png, maskable-512.png               # sinh từ icon app
```

## 3. Script tải: `scripts/assets/fetch_assets.py`
- Danh sách tải khai báo trong `scripts/assets/assets.manifest.json`: `{ name, url, license, files: [{ from, to }] }`.
- Script làm các bước sau:
  1. Kiểm domain có trong allowlist.
  2. Tải về `_downloads/`, ghi lại sha256.
  3. Giải nén zip **bằng thư viện Python** (`zipfile`). Chặn path traversal: bỏ qua entry có `..` hoặc đường dẫn tuyệt đối.
  4. Chỉ copy file có đuôi `.svg .png .webp .ogg .wav .mp3`.
  5. Sinh và cập nhật `CREDITS.md`.
- **Icon game-icons.net:** tải SVG từng icon theo đường dẫn `https://game-icons.net/icons/ffffff/000000/1x1/<author>/<name>.svg`, hoặc từ repo GitHub của dự án. Đổi `fill` sang `currentColor`.
- **Chạy lại không tải lại** nếu sha256 khớp.

## 4. Cổng
- `public/assets/CREDITS.md` liệt kê **100%** file trong `public/assets/**` (trừ CREDITS.md). Script `scripts/validate/assets_credits.mjs` kiểm việc này.
- Tổng `public/assets` (không tính `sfx/`, `music/`) ≤ 2 MB.
- Mỗi SVG minh hoạ ≤ 30 KB, mỗi icon ≤ 8 KB.
