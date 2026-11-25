# 05 · ĐỘ KHÓ, MODEL, THỜI GIAN

> Thang và tầng model như `docs/audit-max/antigravity/05`.
> Tầng model:
> - **Mạnh:** Opus 5.5 / Gemini 4 Argon High.
> - **Vừa:** Sonnet 5.5 / Gemini 4 Neon / Argon Medium.
> - **Rẻ:** dòng Flash.
>
> Reviewer luôn khác model với builder, ưu tiên khác hãng. Với nội dung sinh bằng LLM, **model kiểm phải khác hãng model sinh**.

| Task | Độ khó | Rủi ro | Builder | Reviewer | Giờ máy | Điểm khó nhất |
|---|---|---|---|---|---|---|
| NC-0 | 1 | T | Rẻ + AD | – | 3 | REGISTER đầy đủ |
| NC1-A Lexicon lõi | 3 | C | Vừa | Mạnh | 8–12 | Lemma hoá, ghép nguồn, giữ ID cũ |
| NC1-B Làm giàu | 4 | C | Vừa (script) + Mạnh (viết câu ví dụ) | Mạnh khác hãng + soi mẫu | 16–24 | Lọc nghĩa cổ viwiktionary, QA Word Atlas |
| NC1-C Câu + audio thật | 3 | V | Vừa | Mạnh | 10–16 | License từng file, CEFR câu |
| NC1-P Gói riêng (code) | 4 | C | Mạnh | Mạnh khác hãng | 10–14 | Không lọt dữ liệu vào repo; nhập trên iOS |
| NC1-Q Nhập kết quả đề ngoài | 2 | T | Vừa | Vừa | 4–6 | Form nhanh |
| NC2-A Đặc tả | 2 | V | Mạnh | Mạnh khác hãng | 4–6 | Viết bằng lời mình, đủ dạng |
| NC2-T Xu hướng | 3 | V | Vừa | Mạnh | 6–10 | Chỉ số đếm, không văn bản |
| NC2-B Reading | **5** | C | Mạnh (soạn) | Mạnh **khác hãng** (giải mù) + NLI | 30–60 (theo quy mô) | Đáp án bảo vệ được, đúng band |
| NC2-C Listening | **5** | C | Mạnh (script) + Rẻ (render/QA) | Mạnh khác hãng | 30–60 + render đêm | Bẫy tự nhiên, đa giọng, WER |
| NC2-D Writing | 4 | C | Mạnh | Mạnh khác hãng | 20–40 | Bài mẫu không cliché, Idea Bank có dữ kiện |
| NC2-E Speaking | 3 | V | Vừa | Mạnh | 12–20 | Văn nói, biến thể |
| NC2-F Mock + Gates | 3 | C | Vừa | Mạnh | 6–10 | Phân bố đúng, không trùng pool |
| NC3-A Mã lỗi + Harper | 3 | V | Vừa | Mạnh | 8–12 | Lazy WASM, map ERRANT |
| NC3-B Chấm W/S | **5** | **C** | **Mạnh** | Mạnh khác hãng | 16–24 | Hiệu chỉnh MAE ≤ 0,5 |
| NC3-C Chấm L/R | 1 | T | Vừa | Vừa | 2 | – |
| NC4-A…E Game | 3–4 | V | Vừa high (N1, N2: Mạnh) | Mạnh + Vừa (2 người chấm mù) | 8–16 mỗi task | Cơ chế trỏ đúng band 8, không lag |
| NC5-A Hạ tầng speech | **5** | C | **Mạnh** | Mạnh khác hãng | 16–24 | ASR on-device trên iPhone |
| NC5-B/C S1, S2, N5 | 4 | V | Vừa high | Mạnh + Vừa | 12–20 mỗi task | Pause theo vị trí; proxy P |
| NC6-A/B/C Đo lường | 4 | C | Mạnh (B) / Vừa (A, C) | Mạnh | 8–16 mỗi task | Elo + FSRS optimizer đúng |
| NC7-A/B/C UI/tối ưu | 3 | V | Vừa | Mạnh + Vừa | 8–12 mỗi task | Ngân sách model |
| NC-8 MXH | 2 | T | Vừa (có trình duyệt) | – | 2–4 mỗi tháng | Đăng nhập, lọc seeding |

**Chia nhỏ bắt buộc** cho task độ khó 5: làm theo lô 50–100 item, mỗi lô một commit, review hẹp từng lô. Sai 2 lần thì nâng model.
