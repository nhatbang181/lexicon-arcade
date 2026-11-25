# 02 · KẾ HOẠCH · 9 phase NC-0 → NC-8

> Mã task: `NCx-y`. Mỗi task chạy theo vòng đời cũ: KE-HOACH → làm → kiểm → BAO-CAO → review khác model → fixer → merge (`docs/audit-max/antigravity/03`). Worktree `D:\English-wt\NCx-y`, nhánh `nang-cap/NCx-y`.
> **Ưu tiên:** dữ liệu/đề (NC-1, NC-2) → chấm/đo (NC-3, NC-6) → game band 8 (NC-4) → Speaking (NC-5) → UI/tối ưu (NC-7). NC-8 chạy nền.
> Báo cáo cho Bang mỗi phase (≤ 8 dòng), không dừng chờ duyệt (giống plan cũ). Điểm dừng hỏi Bang: `04-LUAT-CUNG.md` §9.

## 0. Điều kiện bắt đầu

| Phase | Được bắt đầu khi |
|---|---|
| NC-0, NC-1, NC-2 (phần dữ liệu), NC-8 | **Ngay**. Chỉ đụng `scripts/data2/**`, `data-src/**`, `public/data/v2/**` (thư mục mới) và tài liệu. Không chồng file với plan cũ đang chạy |
| NC-3 | Plan cũ đã merge T2-C (W1/W2/grading) ✅. Phần code chạy sau khi **T4-C** xong (để không chồng `src/games/w*`, `src/core/grading`) |
| NC-4, NC-6, NC-7 | Plan cũ đạt **G4** |
| NC-5 | G4 **và** việc M5 (S1/S2, worktree `swarm-*`) đã merge hoặc Bang cho phép tiếp quản (luật A3) |

## 1. Bản đồ phụ thuộc

```
NC-0 Chuẩn bị (license register, môi trường Python, DESIGN.md, HANDOFF)
  │
  ├─ NC-1 Dữ liệu nền từ vựng ───────────┐  (chạy ngay, song song plan cũ)
  │    NC1-A Lexicon lõi (danh sách + level + CEFR + zipf)
  │    NC1-B Định nghĩa / IPA / ví dụ / collocation / gloss Việt
  │    NC1-C Ngân hàng câu + audio người thật
  │                                       │
  ├─ NC-2 Đề & nội dung ◄────────────────┘  (cần lexicon để đo độ phủ/độ khó)
  │    NC2-A Đặc tả format 4 kỹ năng (làm TRƯỚC, nhanh)
  │    NC2-B Reading: passage + 11 dạng câu   NC2-C Listening: script 4 Part + audio đa giọng
  │    NC2-D Writing: Task 1 (7 dạng) + Task 2 + Idea Bank + bài mẫu
  │    NC2-E Speaking: ngân hàng P1/P2/P3 + khung ý + câu trả lời mẫu kiểu nói
  │    NC2-F Lắp đề Mock + nội dung Band Gates
  │
  ├─ NC-3 Chấm & hiệu chỉnh (Writing/Speaking/L-R)
  │    NC3-A Hệ mã lỗi + Harper.js + pipeline ERRANT
  │    NC3-B Gói chấm Claude + anchor + hàm hiệu chỉnh + khoảng band
  │    NC3-C Chấm L/R: bảng quy đổi có khoảng + ngân sách lỗi
  │
  ├─ NC-6 Đo lường & thích ứng (song song NC-4)
  │    NC6-A Nhật ký sự kiện + chỉ số     NC6-B Elo kỹ năng con + band estimator + FSRS optimizer
  │    NC6-C Hôm nay v2 (bù strand, việc từ lỗi) + tổng kết tuần
  │
  ├─ NC-4 Game band 8 (nâng cấp 9 game + mode mới)
  │    NC4-A V1/V2/V3   NC4-B R1/R2   NC4-C L1/L2   NC4-D W1/W2 + N1 Error Boss + N2 Overview Forge
  │    NC4-E N3 Dịch ngược + N4 Vườn input + N6 Học ngược
  │
  ├─ NC-5 Speaking (S1 Mock Examiner, S2 3-Second, N5 Prosody Lab, hạ tầng ghi âm/ASR on-device)
  │
  ├─ NC-7 UI/asset/animation/tối ưu cho phần mới (DESIGN.md, impeccable, ngân sách model ML)
  │
  └─ NC-8 Nền: đọc MXH định kỳ (`03`), cập nhật xu hướng chủ đề mỗi quý, video giới thiệu (tuỳ chọn)
```

**Đường găng:** NC2-A → NC2-B/C/D → NC3-B (cần bài mẫu để làm anchor) → NC4-D → cổng NC-G4.

## 2. Danh sách task (file độc quyền · việc · Done)

### NC-0 · Chuẩn bị (AD + 1 agent rẻ, ½ ngày)
- **File:** `docs/nang-cap-max/**`, `data-src/licenses/**` (mới), `scripts/data2/README.md`, `scripts/data2/requirements.txt`, `DESIGN.md` (gốc repo, mới), `docs/nang-cap-max/HANDOFF.md`.
- **Việc:**
  1. Lập `data-src/licenses/REGISTER.md`: bảng mọi nguồn sẽ dùng (tên, URL, license, ngày kiểm, phần được ship, câu ghi công). Lấy từ `10` §2.
  2. Tạo môi trường Python cục bộ `scripts/data2/.venv` (không đụng PATH hệ thống) + `requirements.txt`: spacy, textstat, lexicalrichness, wordfreq, pandas, errant.
  3. Viết `DESIGN.md` theo `17` §1.
  4. Cài `impeccable` (dev, theo `15`).
- **Done:** REGISTER đủ các dòng ở `10` §2; `python -c "import spacy, textstat, wordfreq"` chạy được trong venv; DESIGN.md ≤ 200 dòng.

### NC-1 · Dữ liệu nền từ vựng (chạy ngay)
| Task | File độc quyền | Việc | Done |
|---|---|---|---|
| **NC1-A** Lexicon lõi | `scripts/data2/lexicon/**`, `data-src/lexicon/**`, `public/data/v2/lexicon/core*.json` | Ghép NGSL 1.2, NAWL 1.2, NGSL-Spoken, CEFR-J 1.6, Octanove C1/C2, wordfreq (Zipf). Lemma hoá bằng spaCy. Gán `level 1–10`, `cefr`, `cefr_source`, `zipf`, `lists[]`, `awl_like` (NAWL). Giữ ID cũ cho 2.207 từ đang có (map `vocab:<headword>`) | ≥ 12.000 lemma có level; 100% có `cefr_source` hoặc `zipf`; 0 nhãn lấy từ Oxford/EVP; 2.207 ID cũ không đổi |
| **NC1-B** Làm giàu mục từ | `scripts/data2/enrich/**`, `data-src/enrich/**`, `public/data/v2/lexicon/detail/*.json` | Từ kaikki EN lấy định nghĩa, IPA UK, ví dụ, dạng từ, nhãn register, đồng/trái nghĩa. Từ viwiktionary lấy gloss Việt (lọc nghĩa cổ). Bổ sung: ipa-dict en_UK + CMUdict (trọng âm, âm tiết), OEWN (synset), Word Atlas (collocation + audio UK, **QA bắt buộc**). LLM viết lại câu ví dụ thiếu/khuôn theo chuẩn `docs/audit-max/antigravity/10-DATA.md` §6 | 12.000 lemma có IPA UK; ≥ 95% có gloss Việt đã soát; ≥ 90% từ band ≥ 6 có ≥ 2 collocation; soi mẫu 10% lỗi < 5% |
| **NC1-C** Câu + audio thật | `scripts/data2/sentences/**`, `data-src/sentences/**`, `public/data/v2/sentences/**`, `public/audio/v2/real/**` | Tatoeba (ưu tiên CC0), VOA Learning English (loại bài AP/Reuters/AFP), Lingua Libre (CC0/CC BY-SA), LibriSpeech/VCTK clip chọn lọc. Gán CEFR câu (heuristic lexicon + CEFR-SP Wiki-Auto), độ dài, chủ đề | ≥ 20.000 câu có nguồn; ≥ 3.000 clip người thật có license từng file; dung lượng audio mới ≤ 150 MB |

### NC-1 bổ sung (chế độ dùng riêng, `10b` §4)
- **NC1-P** Gói riêng `.lexpack`: script build ngoài repo, màn nhập/xoá gói, CI chặn file gói.
- **NC1-Q** Nhập kết quả đề làm ở web khác vào Trap Log, Elo, FSRS.
- Ưu tiên **ngay sau NC1-A**, vì mở khoá luyện đề thật (Cambridge đã mua) sớm nhất.

### NC-2 · Đề và nội dung
- Thêm **NC2-T Xu hướng đề** (`10c` §5): chạy trước NC2-B..E để có `weights.json`.
- Quy mô: làm đủ mục tiêu `10` §0 trước, rồi chủ đề đón đầu, rồi **mức max** (`10c` §4).
| Task | File độc quyền | Việc | Done |
|---|---|---|---|
| **NC2-A** Đặc tả | `data-src/specs/**`, `public/data/v2/specs/**` | `specs/<skill>/<type>.json` cho 11 dạng Reading, 6+ dạng Listening, 7 dạng Task 1, 5 dạng Task 2, 3 Part Speaking: số câu, độ dài, giới hạn từ, phân bố, bẫy điển hình, giao diện máy (`11` §1) | 100% dạng có spec; spec được viết bằng lời mình, không chép đề chính thức |
| **NC2-B** Reading | `scripts/data2/reading/**`, `data-src/reading2/**`, `public/data/v2/reading/**` | Passage gốc từ sự kiện eLife/PLOS (CC BY), Wikipedia (CC BY-SA), Gutenberg (PD). Theo khung chức năng đoạn (IMRaD hoặc lịch sử/lập luận). 11 dạng câu. Blind-solve bằng model khác hãng; kiểm TFNG bằng NLI few-shot (FEVER/SNLI mẫu) | ≥ 90 passage (3 dải band × 3 Part × ≥ 10); mỗi dạng câu ≥ 30; blind-solve khớp 100%; coverage từ theo band đạt (`10` §6) |
| **NC2-C** Listening | `scripts/data2/listening/**`, `data-src/listening2/**`, `public/data/v2/listening/**`, `public/audio/v2/listening/**` | Script 4 Part theo spec (hội thoại xã hội, độc thoại, thảo luận học thuật, bài giảng). Gắn nhãn bẫy (đổi ý, sửa số, đồng thuận 2 người, mốc thời gian, chính tả). Render đa giọng: Kokoro (bf_emma chính), Piper en_GB vctk/alba/aru/cori (giọng vùng UK), MeloTTS EN-AU (Úc). QA bằng whisper.cpp (WER ≤ 8%) | ≥ 60 episode mới (mỗi Part ≥ 15); ≥ 25% có giọng không phải RP (Úc, Scotland, Bắc Anh); 100% có timestamp + nhãn bẫy; audio mới ≤ 250 MB |
| **NC2-D** Writing | `scripts/data2/writing/**`, `data-src/writing2/**`, `public/data/v2/writing/**` | Task 1: dữ liệu OWID (CC BY) → 7 dạng (line, bar, pie, table, mixed, process, map), mỗi dạng ≥ 8 đề; process/map tự vẽ từ mô tả gốc. Task 2: 5 dạng × ≥ 12 đề, gắn chủ đề. **Idea Bank** 12 chủ đề lớn. Bài mẫu band 7/8/9 (LLM viết, model khác hãng soát theo checklist band 8, cấm cliché) | 56 đề Task 1, 60 đề Task 2; Idea Bank ≥ 12 × 10 ý có dữ kiện + nguồn; bài mẫu có `review.verdict=pass` |
| **NC2-E** Speaking | `scripts/data2/speaking/**`, `data-src/speaking2/**`, `public/data/v2/speaking/**` | P1 ≥ 40 chủ đề × 4 câu; P2 ≥ 60 cue card; P3 ≥ 60 nhóm × 4 câu trừu tượng có `level`. `topic_trends` mỗi quý (chỉ nhãn chủ đề từ forecast). Khung ý (PEEL nói, 4 "trục lái"). Câu trả lời mẫu **văn nói** (discourse marker kiểu nói, không kiểu Writing) | Đủ số lượng; 0 câu trùng nguyên văn forecast; mẫu qua checklist "văn nói" (`11` §6) |
| **NC2-F** Mock + Band Gates | `scripts/data2/mock/**`, `public/data/v2/mock/**` | Lắp ≥ 8 bộ L+R đầy đủ (40 câu, đúng phân bố dạng, đủ giọng); 4 bộ W; 4 bộ S. Dành riêng (không dùng ở luyện tập). Nội dung 4 Band Gate (6.5/7.0/7.5/8.0) | 8 bộ L/R + 4 W + 4 S; 0 item dùng chung với pool luyện; validator xanh |

### NC-3 · Chấm và hiệu chỉnh
| Task | File độc quyền | Việc | Done |
|---|---|---|---|
| **NC3-A** Mã lỗi + Harper | `src/core/errors/**` (mới), `src/core/grading/harper/**` (mới), `scripts/data2/errant/**` | Hệ mã lỗi (`12` §5) khớp ERRANT + lỗi người Việt. Tích hợp `harper.js` (Dialect.British) chạy WASM, lazy ở màn Writing. Pipeline ERRANT offline để thống kê | ≥ 40 mã lỗi; Harper gạch lỗi < 300 ms/đoạn sau khi tải; chunk Harper không vào entry |
| **NC3-B** Chấm W/S | `src/core/grading/**` (sau T4-C), `data-src/anchors/**` (không ship), `scripts/data2/calib/**` | Gói chấm Claude theo checklist descriptor, bắt trích dẫn trước khi cho điểm, chấm 2 lần, parse zod. Anchor: ELLIPSE/PERSUADE (CC BY, xếp hạng tương đối) + bài chính chủ đã có điểm thi thật của Bang + sample chính thức chỉ dùng **cá nhân, offline** để hiệu chỉnh (không ship). Hàm hiệu chỉnh isotonic; hiển thị khoảng | MAE ≤ 0,5 trên tập anchor; độ lệch 2 lần chấm ≤ 0,25; 100% kết quả có khoảng + ≥ 3 trích dẫn |
| **NC3-C** Chấm L/R | `src/core/scoring/band.ts` (mới) | Quy đổi 40 câu → band theo bảng chính thức + khoảng (R2 §A3); ngân sách lỗi theo mục tiêu | Unit test đúng bảng; UI hiện "7.0 · sát ngưỡng" |

### NC-4 · Game band 8 (chi tiết từng mode ở `13`)
| Task | File độc quyền | Trọng tâm |
|---|---|---|
| **NC4-A** | `src/games/v1-*/**`, `v2-*/**`, `v3-*/**` | Thẻ câu-cloze học thuật; thang Quizlet (nhận diện → gợi nhớ có gợi ý → tự viết → đặt câu); Second-encounter capture; generate-first ở V2; Daily Paraphrase (kiểu Wordle) ở V3; register slider |
| **NC4-B** | `src/games/r1-*/**`, `r2-*/**`, `src/games/_shared/PassageView.tsx` | Chế độ "Luật sư" (khoá đáp án phải có bằng chứng); Mổ đề (gắn nhãn nguyên nhân cả câu đúng-không-chắc); IMRaD/chức năng đoạn ở R2; thang thời gian 3 nấc; interleave TFNG↔YNNG; Trap Log |
| **NC4-C** | `src/games/l1-*/**`, `l2-*/**` | Dự đoán paraphrase trước khi nghe; loại bẫy mới; ngân sách lỗi 5 viên ngọc; Shadow thay vì chép; dictogloss; ladder giọng/tốc độ |
| **NC4-D** | `src/games/w1-*/**`, `w2-*/**`, `src/games/n1-error-boss/**`, `src/games/n2-overview-forge/**` | Plan Gate; feedback 2 nấc; % câu không lỗi; Connector Diet; Specificity Ladder; "Nâng câu"; Error Boss; Overview Forge (Task 1) |
| **NC4-E** | `src/games/n3-back-translation/**`, `n4-input-garden/**`, `n6-hoc-nguoc/**` | Dịch ngược 24–72h; Vườn input (Trôi/Đào, known-word meter); Học ngược 4 kỹ năng |
Thêm 6 game mới vào `src/games/registry.ts`: **chỉ AD sửa file này**, gom một lần trong NC4-D.

### NC-5 · Speaking (`16`)
| Task | File | Việc |
|---|---|---|
| **NC5-A** Hạ tầng | `src/core/speech/**` (mở rộng, giữ API cũ), `src/core/speech/ondevice/**` (mới) | Thêm provider ASR on-device (Moonshine qua transformers.js, chạy Web Worker) bên cạnh Web Speech hiện có; VAD bằng `@ricky0123/vad-web`; đo pause theo vị trí; lưu bản ghi cục bộ |
| **NC5-B** S1 Mock Examiner | `src/games/s1-*/**` (khi M5 xong) | 3 Part đúng thời lượng; giám khảo TTS; transcript sửa được; gói chấm FC/LR/GRA (+P proxy) |
| **NC5-C** S2 + N5 Prosody Lab | `src/games/s2-*/**`, `src/games/n5-prosody-lab/**` | Liền mạch 30/60/90 s; khung ý; Commute Monologue; minimal pairs âm cuối; shadowing chấm nhịp |

### NC-6 · Đo lường (`18`)
| Task | File | Việc |
|---|---|---|
| **NC6-A** | `src/core/telemetry/**` (mới, cục bộ) | Nhật ký sự kiện chuẩn hoá; chỉ số `18` §1 |
| **NC6-B** | `src/core/adaptive/**`, `src/core/band/**` | Elo theo kỹ năng con; band estimator (khoảng, trajectory); FSRS optimizer khi ≥ 1.000 review (chạy trong Worker) |
| **NC6-C** | `src/features/today/**`, `src/features/stats/**` | Hôm nay v2: việc theo điểm yếu + bù strand; tổng kết tuần 5 phút; vòng Strand Balance |

### NC-7 · UI/asset/tối ưu (`17`)
- **NC7-A:** soát toàn bộ màn mới bằng `impeccable` + DESIGN.md.
- **NC7-B:** ngân sách model ML/asset, LHCI.
- **NC7-C:** polish màn mới (juice theo bậc E0–E3 của plan cũ).

### NC-8 · Nền
- Đọc MXH mỗi tháng (`03`), cập nhật `topic_trends` mỗi quý.
- Tuỳ chọn: video giới thiệu bằng hyperframes (`15`).

## 3. Song song (máy 16 GB)
- **Làn dữ liệu (nhẹ, không vite):** NC1-A → NC1-B → NC2-*, chạy ngay cả khi plan cũ đang chạy 2 làn nặng.
- **Làn render audio:** NC2-C dùng CPU/GPU lâu; chạy **đêm**, một mình.
- **Làn code:** tối đa 2 làn nặng như plan cũ. NC-4 chia 5 task không chồng file → chạy 2 cùng lúc theo thứ tự A+B → C+D → E.

## 4. Cổng
| Cổng | Khi | Đo |
|---|---|---|
| **NC-G1 Dữ liệu nền** | Hết NC-1 | Số liệu Done của NC1-A/B/C; REGISTER đủ; `validate:data:release` exit 0 với dữ liệu v2 |
| **NC-G2 Đề** | Hết NC-2 | Số lượng ở §2; blind-solve 100%; WER audio ≤ 8%; spec phủ 100% dạng; soi mẫu đạt |
| **NC-G3 Chấm** | Hết NC-3 | MAE ≤ 0,5; ổn định ≤ 0,25; khoảng hiển thị; Harper lazy |
| **NC-G4 Game band 8** | Hết NC-4 + NC-6 | Mỗi mode mới/nâng cấp đạt rubric ≥ 8,5 (2 reviewer chấm mù) **và** có ≥ 1 chỉ số học (`18`) chạy được; E2E chéo: lỗi ở W1 → Error Boss → V1 |
| **NC-G5 Speaking** | Hết NC-5 | Ghi âm/ASR chạy trên iPhone thật ở chế độ cài app; pause phân loại; P chỉ là proxy, ghi rõ |
| **NC-G6 Cuối** | Hết NC-7 | Toàn bộ `KIEM-THU.md` §2 vẫn 25/25; ngân sách hiệu năng giữ; báo cáo cuối cho Bang |
