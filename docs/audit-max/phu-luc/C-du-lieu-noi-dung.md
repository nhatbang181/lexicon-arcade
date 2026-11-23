# Audit dữ liệu và nội dung: Lexicon Arcade V3 (D:\English)

- Ngày audit: 2026-11-23. Chỉ đọc, không sửa file nào trong `D:\English`.
- Script tạm (nằm ở thư mục tạm của phiên audit, **không** có trong repo; task T3-B viết lại các phép đếm này thành `scripts/validate/**` hoặc `scripts/qa/**`):
  - `count.mjs`: đếm, phân bố, trùng lặp, provenance → `counts.json`
  - `sample.mjs`: lấy mẫu ngẫu nhiên, seed 20261123
  - `audio.mjs`: đối chiếu audio được tham chiếu với file thật
  - `ipa.mjs`: kiểm IPA UK
  - `repro/`: bản sao để chạy lại pipeline
- Kết quả validator: `validate_out.txt` (mặc định) và `validate_strict.txt` (`--require-audio --require-blind`).
- Mức độ:
  - **P0**: chức năng cốt lõi hỏng, hoặc rủi ro pháp lý ngay
  - **P1**: sai cổng chất lượng hoặc dữ liệu sai hàng loạt
  - **P2**: thiếu so với spec, hoặc rủi ro bản quyền/giấy phép
  - **P3**: vệ sinh, nhất quán

---

## 0. Tóm tắt điều hành

`npm run validate:data` báo **PASS (exit 0)**, nhưng đó là "xanh giả":
- Toàn bộ cổng audio và blind-solve chỉ là `[NOTE]`.
- Khi bật đủ cờ (`--require-audio --require-blind`), validator trả **exit 1 với 2.835 lỗi**.

Năm vấn đề nặng nhất:

1. **[P0] Audio gần như chưa có.**
   - 4/32 episode Listening có MP3. 28 episode còn lại có `sha256:"pending"`, mọi `script[].start/end = 0` và `durationSec` ước lượng.
   - Dictation có 60/300 file. Speaking có 0/841. Vocab có 537/2.207.
   - Tổng cộng: 601/3.380 file được tham chiếu (17,8%).
2. **[P1] Cổng G3 (blind-solve) chỉ chạy một phần, nhưng dữ liệu vẫn nằm trong `public/data`.**
   - Reading: 6/24 passage. Listening: 4/32 episode.
   - Không item nào có `qa.blindSolve:'pass'`.
3. **[P1] Ví dụ vocab sinh bằng template.**
   - 1.396/2.207 từ (63%) có ít nhất 1 câu ví dụ là câu khuôn đúc kiểu "Across developed and developing nations alike, debates continue regarding … in everyday life."
   - ≥ 72 câu sai ngữ pháp, ví dụ "the role of suffer from brain drain", "Careful investment in suffer from burnout".
   - 490 câu ví dụ thứ nhất bị nối đuôi vô nghĩa.
   - Các câu này là nguồn cho cloze của V1.
4. **[P1] Provenance khai sai.**
   - 832 từ do LLM sinh (nhúng base64 trong `scripts/expand_anki_vocab.py`) và 1.112 bản làm giàu do LLM sinh đều ghi `createdBy:'import'`, `source:'anki:*'`, `license:'own'`.
   - `qa.verifier:'pass'` được đóng dấu cho 2.148 từ, trong khi verifier chỉ soi 35 từ (1,6%; G4 yêu cầu 10%).
   - `cefr` thực chất là ngưỡng zipf chứ không phải CEFR.
5. **[P2] Bản quyền và giấy phép chưa sạch.**
   - File legacy `ielts_4skills.json` nằm trong `public/` với nhãn "Cambridge IELTS 8.0 curated expansion" và 12 bài đọc phỏng theo tin thật. Không có code V3 nào dùng file này.
   - Audio edge-tts mang giấy phép ghi "personal use" nhưng sẽ deploy công khai.
   - Icon CC BY 3.0 không được ghi công trong app (chỉ có ở màn dev).
   - 6 hình minh hoạ tự sinh nhưng CREDITS gán cho unDraw/Katerina Limpitsouni.
   - Không có CREDITS cho dữ liệu (wordfreq/NGSL/NAWL là CC BY-SA).

---

## 1. Số lượng so với ngưỡng (đếm thật)

### 1.1 Bảng độ phủ nội dung

Ngưỡng MVP và Đầy đủ lấy từ `docs/05` §6. Các luật INV lấy từ `docs/04`.

| Loại | Thực tế | MVP | Đầy đủ | % Đầy đủ | Ghi chú |
|---|---:|---:|---:|---:|---|
| VocabItem | 2.207 | 2.000 | 3.500 | 63% | 2.152 import + 55 LLM |
| Collocation | 762 | 600 | 1.500 | 51% | 127 headword × đúng 6; 15 cặp trùng phrase |
| ParaphraseItem | 320 | 300 | 800 | 40% | L1:L2:L3:L4 = 96:96:96:32 (đúng 3:3:3:1) |
| ErrorPattern | 230 | 200 | 400 | 58% | 11 tag, mỗi tag ≥ 20 (word_form 30) |
| PlacementVocab | 150 | ≥ 20/band | – | – | 25 × 6 band |
| Listening episode training | 24 | 24 | 80 | 30% | 6 mỗi part |
| Listening episode reserved | 8 | 8 | 32 | 25% | 2 mỗi part |
| Dictation | 300 | 300 | 1.000 | 30% | **chỉ level 1–6, 0 câu level 7–10** |
| Passage training | 18 | 18 | 60 | 30% | 6 mỗi level P1/P2/P3 |
| Passage reserved | 6 | 6 | 24 | 25% | |
| Task 2 prompt | 60 | 60 | 150 | 40% | 10/dạng; **[INV-W4] yêu cầu ≥ 15/dạng → thiếu 30** |
| Task 1 visual | 24 | 24 | 60 | 40% | bar 4, line 4, mixed 4, pie 3, table 3, process 3, map 3; **[INV-W4] yêu cầu ≥ 6/kind → thiếu 18** |
| Cliché | 50 | ≥ 40 | – | – | |
| Part 1 topic | 30 (121 câu) | 30 | 60 | 50% | |
| Part 2 cue card / Part 3 set | 40 / 40 | 40 | 90 | 44% | chỉ có rotation 2026-Q3 |
| SpeakingPhrase | 80 | 80 | 150 | 53% | 10 mỗi function |
| **ExamTest** | **0** (không có `exam/tests.json`) | 2 | 8 | 0% | reserved đã có nhưng chưa ghép thành đề |
| Tips | 62 | – | – | – | không code V3 nào tải `tips.json` |
| Roadmap | 4 phase | – | – | – | không code V3 nào tải `roadmap.json` |

### 1.2 Bảng độ phủ audio (`audio.mjs`)

| Thư mục | Được tham chiếu | Có file | Thiếu | Độ phủ | Dung lượng thật |
|---|---:|---:|---:|---:|---:|
| `audio/vocab` | 2.207 | 537 | 1.670 | 24,3% | 2,76 MB (≈ 5,1 KB/file) |
| `audio/dictation` | 300 | 60 | 240 | 20,0% | 1,82 MB (≈ 30 KB/file) |
| `audio/listening` | 32 | 4 (p1_001, p2_001, p3_001, p4_001) | 28 | 12,5% | 6,60 MB (≈ 1,65 MB/file) |
| `audio/speaking` | 841 | 0 (thư mục chưa có) | 841 | 0% | 0 |
| **Tổng** | **3.380** | **601** | **2.779** | **17,8%** | **11,19 MB** (`du` báo 13M vì block) |

- Không có file audio mồ côi (0 file không được tham chiếu). Không có file < 1 KB.
- Ước tính khi đủ audio ở mức "Đầy đủ" (3.500 vocab, 1.000 dictation, 112 episode, khoảng 2.000 câu speaking): khoảng 18 + 30 + 185 + 50 ≈ **280 MB**.
  - Vẫn dưới ngưỡng 400 MB, nhưng PWA không thể precache hết.

### 1.3 Phân bố band/level (đếm thật)

Không có item nào gắn nhãn "band 4–6" trực tiếp. Các trường có ý nghĩa độ khó:

| Trường | Phân bố |
|---|---|
| Vocab `cefr` | B1 32 · B2 389 · C1 1.412 · C2 374 |
| Vocab `freqZipf` (làm tròn xuống) | 1:62 · 2:326 · 3:878 · 4:836 · 5:104 · 6:1 |
| Collocation `bandTarget` | 7: 248 · 8: 465 · 9: 49 (không có 4–6) |
| Dictation `level` (1–10) | 1–6: 50 mỗi level · **7–10: 0** |
| Dictation accent | uk 200 · us 70 · au 30 |
| Episode `difficulty` (1–10) | 2:1 · 3:2 · 4:4 · 5:5 · 6:5 · 7:5 · 8:7 · 9:3 |
| Passage level | P1 8 · P2 8 · P3 8 |
| Task 2 `difficulty` | 1:2 · 2:4 · 3:6 · 4:8 · 5:10 · 6:10 · 7:8 · 8:6 · 9:4 · 10:2 |
| Task 1 `difficulty` | 1:1 · 2:3 · 3:1 · 4:4 · 5:5 · 6:3 · 7:1 · 8:3 · 9:2 · 10:1 |

Nhận xét:
- **`cefr` bị suy từ zipf, không phải CEFR thật.**
  - Bảng chéo cho thấy zipf ≥ 5 → B1/B2, 4–5 → B2/C1, 3–4 → C1 (878/878), < 3 → C2 (374/388).
  - Ví dụ sai rõ: `vocab:suburb` C1 (thực tế B1), `vocab:invest` C1 (B1/B2), `vocab:inevitable` C1 (B2).
- Task 2 `difficulty` gắn theo dạng bài: mọi đề `discussion`/`two_part` đều ≥ 5, mọi đề `opinion` đều ≤ 6. Đây là gán máy móc.
- Với mục tiêu L 8.5, thiếu dictation level 7–10 (165–185+ wpm, câu Part 3/4) là lỗ hổng lớn nhất về độ khó.

### 1.4 Phủ chủ đề (vocab / collocation)

- Vocab theo topic: sport 6 · space 15 · tourism 13 · language 19 · history 21 · arts 23. Các topic lớn như education có 361, economy 254.
- Collocation: **0** cho sport, arts, tourism, space, language. Spec yêu cầu "≥ 4 mỗi headword trung tâm của 25 topic".
- Passage: 24 passage phủ 24/25 topic (thiếu `family`).

### 1.5 Trùng lặp và trường thiếu

| Kiểm tra | Kết quả |
|---|---|
| Trùng `id` (mọi loại) | 0 |
| Trùng headword vocab (chuẩn hoá) | 0 |
| Trùng `phrase` collocation | **15 cặp** (xem P2-4) |
| Trùng context paraphrase / cặp questionPhrase+target | 0 / 0 |
| Trùng `wrong` error pattern | 0 |
| Trùng text dictation | 0 |
| Trùng prompt Task 2 / cue card / tiêu đề passage | 0 / 0 / 0 |
| Thiếu `provenance` | 0 |
| LLM mà không có verifier | 0 (nhưng xem P1-4 về độ thật của dấu này) |
| `provenance.attribution` | 0 item |
| `qa.humanSpotCheck` | 0 item |
| `qa.blindSolve` trên passage/episode | **0/24, 0/32** (trường không tồn tại) |

Trường tuỳ chọn của vocab (trên 2.207 từ):

| Trường | Số từ có |
|---|---:|
| `ipa.us` | 0 |
| `syllables` | 0 |
| `examples[].vi` | 0 |
| `family` | 614 |
| `synonyms` | 2.152 |
| `vnTrap` | 123 |
| `collocationIds` không rỗng | 127 |
| `audio.uk` khai báo | 2.207 (file thật 537) |

Thêm:
- 7 từ có `meaningVi` > 12 từ: `vocab:comparative_advantage`, `vocab:economies_of_scale`, `vocab:diminishing_returns`, `vocab:market_failure`, `vocab:regressive_taxation`, `vocab:capital_flight`, `vocab:macroeconomic`.

### 1.6 Schema `src/core/content/schemas.ts` so với spec và dữ liệu

- **Khớp:** validator import đúng schema zod từ `schemas.ts`. Mọi file V3 qua schema với 0 lỗi.
- **Lệch hoặc lỏng:**
  - `ListeningEpisodeSchema.audio.sha256: z.string().min(1)` (khoảng dòng 426) chấp nhận chuỗi `"pending"`. Nên dùng `/^[a-f0-9]{64}$/`.
  - `Provenance` của 4 schema Speaking là `.optional()` (dòng 767, 787, 818, 840). Điều này trái [INV-PROV] "mọi item cấp gốc đều có provenance". Dữ liệu hiện vẫn có đủ.
  - Không có schema trong core cho `tips.json`, `roadmap.json`, `cliches.json`. Schema cliché bị khai lặp trong game: `ClicheEntrySchema` ở `w1-essay-lab/writingLoader.ts`, `SprintClicheSchema` ở `w2`.
  - Docs §1 có `exam/tests.json` và `ExamTestSchema` đã có (dòng 848), nhưng chưa có file dữ liệu.
  - Không có trường lưu nguồn audio (giọng, giấy phép TTS). Hiện đang nhét vào `provenance.license` của text (`"edge-tts (personal use)"`, ở 8 episode và 30 dictation).

---

## 2. Validator (`npm run validate:data`)

- Chạy sau khi `node_modules` đã có (Node v24.16.0). **Exit 0**, 97 file manifest khớp SHA, assets 95/95 có credit.
- Có 6 `[NOTE]`: V4 1.670 audio thiếu, R8 24/24 chưa blind, L5 28/32 chưa có MP3, L7 32/32 chưa blind, D1 240/300 chưa có MP3, speaking 841 audio chưa render.
- `node scripts/validate/run_all.mjs --require-audio --require-blind`: **exit 1, 2.835 lỗi**. Chi tiết ở `validate_strict.txt` (chỉ in 40 lỗi đầu).

Lỗ hổng của validator (P1-1), so với `scripts/validate/run_all.mjs`:

| INV | Spec yêu cầu | Validator thực tế |
|---|---|---|
| L5 | `audio.sha256` khớp file, LUFS trong −17…−15 | Chỉ kiểm file tồn tại (dòng ~1332). Không so sha (chuỗi `pending` lọt). Không đo LUFS |
| L6 | Thời lượng P1–P3 4–6 phút, P4 5–7 phút | **Không kiểm**. `p2_001` = 233,9 s (< 240), `p4_001` = 289,2 s (< 300) đều vi phạm |
| V4 | Audio vocab dài 0,3–4 giây | Chỉ kiểm tồn tại/khác rỗng |
| D1 | WPM thực lệch ≤ 10% | Không đo |
| W4 | ≥ 15 prompt/dạng, ≥ 6 visual/kind | Hạ xuống 10 và 3 (dòng 1724, 1936) theo quyết định M4. Hợp lệ theo `DECISIONS.md` D, nhưng thông báo PASS không nói rõ |
| R8 / L7 | blind-solve pass | Chỉ là cảnh báo khi không có cờ |

---

## 3. Độ đúng: soi mẫu ngẫu nhiên (seed 20261123)

### 3.1 Vocab: 15 từ

| id | IPA UK | meaningVi | Ví dụ | Kết luận |
|---|---|---|---|---|
| `vocab:complicity` | /kəmˈplɪs.ə.ti/ ✓ | ✓ | ex2 khuôn: "the role of tacit complicity in shaping long-term public outcomes" (sáo, vô nghĩa) | Sửa ex2 |
| `vocab:colloquium` | ✓ | ✓ | ex2 khuôn: "role of academic colloquium in shaping…" (thiếu mạo từ) | Sửa ex2 |
| `vocab:inevitable` | ✓ | ✓ | ex2: "draw close attention to the inevitable consequence in contemporary public life" (lủng củng) | cefr C1 → B2 |
| `vocab:extracurricular` | /ˌekstrəkəˈrɪkjələ(r)/ ✓ | ✓ | ex1 ổn; ex2 khuôn | |
| `vocab:invest` | ✓ | ✓ | ex1: "Governments should invest more in public transport when national authorities design long-term public policies" (đuôi nối thừa) | cefr C1 sai |
| `vocab:spectroscopy` | ✓ | ✓ | ex2 khuôn | |
| `vocab:suburb` | ✓ | ✓ | ex1 "…for more space across congested urban commuter networks worldwide" (đuôi vô nghĩa); **ex2 sai ngữ pháp: "frequently emphasise live in the suburbs"** | **Lỗi** |
| `vocab:brain_drain` | ✓ | ✓ | **ex2 sai ngữ pháp: "debates continue regarding the role of suffer from brain drain"** | **Lỗi** |
| `vocab:allegory` | /ˈæl.ɪ.ɡər.i/ ✓ (ký hiệu chấm kiểu Cambridge Dictionary) | ✓ | ex2 khuôn | |
| `vocab:postgraduate` | ✓ | pos chỉ `adj` nhưng nghĩa có cả danh từ | ex1 "research posts across modern secondary schools and universities" (vô lý: postgraduate ở trường trung học) | Sửa |
| `vocab:burnout` | ✓ | ✓ | **ex2 sai: "Careful investment in suffer from burnout remains a central priority"** | **Lỗi** |
| `vocab:journalistic_ethics` | ✓ | ✓ | **ex2 sai nghĩa: "highlight the urgent need to breach journalistic ethics"** (khuyến khích vi phạm đạo đức) | **Lỗi**; tag `AWL9` cho cụm 2 từ là gượng |
| `vocab:enrolment` | ✓ | ✓ | ổn | Đạt |
| `vocab:freedom_of_speech` | ✓ | ✓ | **ex2 sai: "the role of defend freedom of speech"** | **Lỗi** |
| `vocab:menial` | ✓ | "(việc) đơn giản, lương thấp" chưa đủ sắc thái (nên là "chân tay, tầm thường") | ex1 đuôi nối "during periods of sustained fiscal pressure and inflation" | Sửa nghĩa |

Kết quả mẫu:
- IPA đúng 15/15.
- Nghĩa tiếng Việt đúng 13/15, cần chỉnh 2.
- **Câu ví dụ: 5/15 từ có câu sai ngữ pháp hoặc sai nghĩa, 13/15 có ít nhất 1 câu khuôn.**

Đo toàn bộ (script):
- 1.028 câu dùng khuôn chỗ trống danh từ ("the role of X…").
- ≥ 72 câu trong đó có chỗ trống bắt đầu bằng động từ (sai ngữ pháp). Ví dụ:
  - `vocab:hypertension`, `vocab:malnutrition`, `vocab:depression`, `vocab:therapy`, `vocab:poverty`
  - `vocab:tariff` ("investment in impose tariffs on")
  - `vocab:budget_surplus`, `vocab:fraud`, `vocab:offence`, `vocab:bribery`, `vocab:parole`, `vocab:nepotism`, `vocab:invasion_of_privacy`
  - `vocab:desertification`, `vocab:environmental_impact_assessment`, `vocab:data_breach`, `vocab:information_overload`, `vocab:zero_hours_contract`
- 490 câu ví dụ thứ nhất có đuôi khuôn nối thêm.
- Nguồn lỗi: `scripts/data/10_convert_legacy.mjs` dòng ~470–560 (hàm sinh ví dụ, các mảng `frames`, ví dụ dòng 533).

IPA toàn bộ (`ipa.mjs`):
- 40 IPA "UK" có âm r sau nguyên âm kiểu Mỹ, ví dụ:
  - `vocab:tenure` /ˈten.jər/
  - `vocab:aquifer` /ˈæk.wɪ.fər/
  - `vocab:malware` /ˈmæl.weər/
  - `vocab:slander` /ˈslɑːn.dər/
  - `vocab:polymer` /ˈpɒl.ɪ.mər/
  - `vocab:corridor` /ˈkɒr.ɪ.dɔːr/
  - `vocab:connoisseur` /ˌkɒn.əˈsɜːr/
- Ký hiệu không đồng nhất: 524 IPA có dấu chấm âm tiết (kiểu Cambridge Dictionary), 111 IPA có "(r)" (kiểu Oxford), số còn lại để trơn.
- Mọi IPA đa âm tiết đều có dấu trọng âm (0 thiếu).

### 3.2 Collocation: 6 mẫu

| id | Đánh giá |
|---|---|
| `col:innovation_foster_innovation` | Đúng. Trap "grow innovation" hợp lý |
| `col:policy_formulate_a_policy` | Phrase đúng. **Trap "create up a policy" là lỗi bịa**, người Việt không mắc. Spec §4.2 cấm "bịa lỗi vô lý" |
| `col:alleviate_alleviate_traffic_congestion` | Phrase đúng, nhưng gap ẩn "traffic" (phần dễ) thay vì động từ; answers "urban/road congestion" chấp nhận được. Trap "cool down traffic congestion" gượng. **Trùng với** `col:congestion_alleviate_traffic_congestion` |
| `col:impact_assess_the_impact_of` | Đúng. **Trùng với** `col:assess_assess_the_impact_of` |
| `col:potential_assess_the_potential_risks` | Đúng |
| `col:standard_set_standards` | Đúng. Answer "enforce" khác nghĩa ("thi hành" ≠ "đặt ra"), không tương đương |

Kiểm thêm các item đã bị reject ở M1:
- `col:revenue_generate_revenue` có trap "do revenue" (bịa).
- `col:mitigate_mitigate_the_severity_of` có trap "lessen heavy of" (vô nghĩa, không phải cụm tiếng Anh).
- Kết luận: các bản "fix" thay trap tự nhiên bằng trap vô nghĩa.

### 3.3 Paraphrase: 5 mẫu

| id | Đánh giá |
|---|---|
| `para:l2b_010` ("observe behaviour unobtrusively" ↔ "unobtrusive behavioural observation") | Đúng L2 |
| `para:l3a_002` ("because global temperatures rose" ↔ "as a consequence of warming temperatures") | Đúng L3 |
| `para:l3a_015` ("so that local inns benefit directly" ↔ "in order to channel spending directly to family guesthouses") | Gần đúng. "inns" ≈ "guesthouses" chấp nhận được |
| `para:l1a_011` ("repeat offenders" ↔ "recidivist criminals") | Đúng |
| `para:l1b_040` ("damaging beauty spots" ↔ "degrading scenic natural landscapes") | Chấp nhận được ("beauty spots" là điểm cụ thể, hơi rộng) |

Lỗi chung (P2): **decoy yếu**.
- Decoy là các cụm danh từ không có từ khoá chung với questionPhrase, nên không gây nhiễu thật. Ví dụ "mountain glacier basins" cho "because global temperatures rose", "nocturnal forest mammals".
- Spec §4.3 yêu cầu decoy "có từ khoá giống questionPhrase".
- Giải thích tiếng Việt đúng ở 5/5.

### 3.4 Reading: 2 passage

**`rp:p2_002` "Thermal Sand Batteries…" (P2, 799 từ)**
- TFNG Q1 T, Q2 F, Q3 T, Q4 F, Q5 NG, Q6 NG: **cả 6 bảo vệ được**. Phân bố 2/2/2 đạt [INV-R4].
- Headings Q7–11 (i, ii, iii, iv, v) đúng. Distractor vi/vii/viii có lý do sai rõ.
- Sentence completion Q12 "steel pipes", Q14 "crushed soapstone" đúng.
- Q13 "timber kilns" đúng, nhưng prompt gán "According to Prof Martin Kowalski" cho câu là lời tác giả (câu sau câu trích Kowalski). Đây là gán ý kiến mơ hồ (P3).
- Nội dung đoạn E bám rất sát dự án có thật (Polar Night Energy: Kankaanpää 2022, silo 100 tấn, 7 m × 4 m; Pornainen dùng đá xà phòng nghiền). Bài ghi "a rural municipal utility in northern Europe" và thêm số liệu "30% peak January load, 450 homes" không kiểm chứng.
  - Không vi phạm "gán phát hiện bịa cho tổ chức thật" vì đã ẩn danh. Nhưng nên viết rõ là giả định (P3).
- Passage này **chưa qua blind-solve**.

**`rp:p1_002` "The Driftwood Boatbuilders…" (P1, 671 từ)**
- TFNG Q1 T, Q2 F, Q3 NG, Q4 T, Q5 F, Q6 NG: **cả 6 bảo vệ được**.
  - Q4 (nguyên nhân "high transport costs") dựa trên "brought in by trading sloops, making them far too costly". Suy luận chấp nhận được.
- Headings đúng. Completion "symbols", "42", "tallow" đúng giới hạn từ.
- **Chưa qua blind-solve**.

Đã biết từ trước: `p2_004_q05` (YNNG) mơ hồ (`PROGRESS.md`) và vẫn chưa sửa.

### 3.5 Listening: 2 episode

**`lep:p2_005` "Redgum Heritage Farm Park Tour" (Part 2, map)**
- Q1–2 (B, D) đúng. Bẫy car park/cafe/railway được nêu rồi loại.
- Q3–4 (B, C) đúng. Bẫy overshoes (A) đổi kế hoạch, rail-leaning (E) được phép.
- Q5–10 map G/F/H/A/C/D: lời chỉ đường nhất quán. Chưa đối chiếu toạ độ MapSpec.
- **Không có MP3, mọi timestamp = 0** nên L1 không phát được và không tua tới evidence được.

**`lep:p1_002` "Willow Creek Holiday Cottage Booking" (Part 1)**
- Q1–10: Aldridge, Heather, 19 June, 6, 07834912055, 720, debit card, shed, 3:30, Wednesday. **Cả 10 bảo vệ được.**
- Bẫy self-correction/distractor đặt ngay trước đáp án, đúng §5.1.
- Lỗi nhỏ:
  - Q5 chỉ chấp nhận số không có dấu cách (`07834912055`). Người làm bài viết "07834 912 055" sẽ bị chấm sai (lỗi đã biết ở `PROGRESS.md`, chưa sửa).
  - Lời thoại thiếu rút gọn ("it is", "Let us book", "I am calling"), không tự nhiên như spec §4.5 yêu cầu ("um", "right"…).
- **Không có MP3, timestamp = 0.**

### 3.6 Dictation: 5 câu

| id | Text / level | Đánh giá |
|---|---|---|
| `dict:0116` | L3 uk 130 wpm | Câu đúng; tokenIndex 4 = "cite" ✓. Feature khai `final_consonant` nhưng tip nói về đồng âm cite/site/sight (lệch nhãn) |
| `dict:0017` | L1 | ✓. IPA /ˈseprət/ ✓ |
| `dict:0256` | L6 au 160 wpm "…colour and behaviour retain the letter u" | Đúng. Thiếu `acceptedVariants` cho "color/behavior" dù spec cho phép cả hai chính tả trong Listening |
| `dict:0002` | L1 | ✓. IPA /ˌbaɪəʊdaɪˈvɜːsəti/ ✓ |
| `dict:0211` | L5 au | Feature khai `linking` nhưng tip là chính tả "curriculum" (lệch nhãn) |

Đo toàn bộ:
- 104/367 focus tip là mẹo **chính tả**, 78 trong số đó từ import legacy.
- **58 tip khai là hiện tượng nối âm (linking/weak_form/elision/final_consonant/contraction) nhưng nội dung là chính tả.**
- 25 câu dài lệch bảng §6.4, ví dụ `dict:0054`, `dict:0058`, `dict:0060`, `dict:0061` ở L2 có 13 từ (> 12).
- 240/300 câu chưa có MP3.

### 3.7 Writing: 4 Task 2 + 1 Task 1

- `w2:024` (problem_solution), `w2:004` (opinion), `w2:052` (two_part), `w2:001` (opinion):
  - Đề tự viết, văn phong đúng kiểu đề.
  - Bài mẫu đạt band 8: lập trường rõ, phát triển ý, collocation chính xác, chính tả UK ("subsidise", "prioritise", "kerb").
  - **Đạt 4/4.**
- `w1:017` (mixed pie + table):
  - Số liệu keyFeatures khớp dữ liệu: 42 = 24 + 18 ✓, chênh 1,4/0,6 GBP ✓.
  - **Đạt.**

---

## 4. Nguồn gốc và bản quyền

### 4.1 Nguồn theo loại (đếm từ `provenance`)

| Loại | createdBy / source / license | Số item |
|---|---|---:|
| vocab | import / `anki:<realm>` / own | 2.152 |
| vocab | llm+review / `llm:gemini@2026-11-20` / own | 55 |
| col, para | llm+review / gemini / own | 762, 320 |
| err | import `ielts_4skills` 108 + llm 122 / own | 230 |
| dict | import legacy 160 (30 ghi license "edge-tts (personal use)") + llm 140 | 300 |
| lep | llm+review gemini-4-neon (8 ghi "edge-tts (personal use)") | 32 |
| rp | llm+review gemini-4-neon-high / own | 24 |
| w1, w2, cliché | llm+review gemini-4-neon / own | 24, 60, 50 |
| speaking (s1t, s2c, s3s, sph) | llm+review gemini / own | 30, 40, 40, 80 |
| tip | import ielts_strategies / own | 62 |

- **Wikipedia: 0 item. The Conversation: 0 item.** Không có item V3 nào cần ghi công CC BY-SA hay CC BY-ND, và `attribution` = 0 là đúng với hiện trạng.
- **Cambridge:** grep "Cambridge" trong `public/data` ra 2 chỗ, đều ở `public/data/ielts_4skills.json`:
  - `metadata.source: "Anki IELTS 8.0 sub-decks + Cambridge IELTS 8.0 curated expansion"`
  - một `explanationVi` có cụm "chuẩn Cambridge Band 8.0" (gần `wup_050`)
- Không thấy "Cambridge IELTS 1–20", "Test 1–4", "Official Guide", "Road to IELTS".
- "economist" (86 lần) là nhân vật hư cấu trong passage (ví dụ "Professor David Okafor"), không phải tạp chí The Economist.

### 4.2 Các vấn đề

**P1-4. Provenance vocab khai sai.**
- `scripts/expand_anki_vocab.py` nhúng 2 khối base64:
  - `EXPANSION_WORDS_B64` = **832 từ** do LLM viết ("AWL Sublists 3-10 + C1/C2 Academic Lexicon")
  - `ENRICHMENTS_B64` = **1.112** bản làm giàu nghĩa/IPA/ví dụ cho mục Anki
- Kết quả là trong 2.152 từ `createdBy:'import', source:'anki:*', license:'own'`, khoảng 832 không phải của Bang, và hầu hết nội dung đã bị LLM viết lại.
- `qa.verifier:'pass'` có trên 2.148 từ, trong khi `data-src/verdict_m1_vocab.json` chỉ soi 35 từ với kết luận `CONDITIONAL_PASS`.

**P2-1. File legacy do LLM sinh vẫn nằm trong `public/`.**
- `public/data/ielts_4skills.json` (0,56 MB) **không được code nào trong `src/` tải** (chỉ `scripts/data/10_convert_legacy.mjs` đọc).
- File được sinh bởi `scripts/build_4skills_data.py` (3.629 dòng dữ liệu viết tay của LLM).
- Có 12 bài đọc `rd_a01…a12` phỏng theo tin thật, ví dụ:
  - `rd_a03` "Lessons From Australia's Four-Day Work Week Trial" (nhắc Keynes)
  - `rd_a04` "Ultra-Processed Foods and Bowel Cancer"
- Đây là dạng bài kiểu The Conversation/báo chí, có thể là bản viết lại từ bài báo có bản quyền hoặc CC BY-ND (cấm sửa). Không có nguồn ghi kèm.
- `anki_vocab.json` (1,59 MB) và `ielts_strategies.json` vẫn được legacy app tải: `src/legacy/App.tsx:40`, `src/legacy/components/StrategyHandbook.tsx:31`.

**P2-2. Giấy phép audio TTS.**
- Theo DECISIONS D:
  - vocab 537 file: edge-tts `en-GB-SoniaNeural`
  - dictation 30 file AU: edge-tts
  - 8 episode AU/NZ/CA: edge-tts
- Dữ liệu tự ghi license là "edge-tts (personal use)", nhưng kế hoạch `r-pwa-deploy` là deploy GitHub Pages công khai.
- edge-tts gọi endpoint Read Aloud của Microsoft, không phải API có giấy phép phân phối lại.
- Không có CREDITS hay ghi chú cho audio học.

**P2-3. Ghi công asset sai hoặc thiếu.**
- `public/assets/CREDITS.md` gán 6 file `illustrations/*.svg` cho "unDraw · Katerina Limpitsouni". Thực tế chúng do `scripts/assets/fetch_assets.py` (`build_undraw_illustrations`, dòng 137) **tự sinh** ("unDraw-style"). Đây là ghi công sai tác giả.
- 24 icon game-icons.net có giấy phép **CC BY 3.0**, phải ghi công cho người dùng cuối. Hiện chỉ hiện ở `src/app/screens/DevComponentsScreen.tsx:432/465` (màn dev), không có màn "Giấy phép" trong app.
- File asset ở gốc `public/` nằm ngoài CREDITS:
  - `public/roguelike_sheet.png` (96 KB, legacy dùng ở `src/legacy/game/canvasRenderer.ts:10` với đường dẫn tuyệt đối `/roguelike_sheet.png`, sẽ vỡ dưới base `/lexicon-arcade/`)
  - `public/dungeon_tilemap.png` (không ai dùng)
  - `app_icon.*`, `favicon.ico`, `pwa-*.png`, `maskable-512.png`
- Không có `public/data/CREDITS.md` cho dữ liệu, dù:
  - `freqZipf` lấy từ **wordfreq (data CC BY-SA 4.0)**
  - nhãn `NGSL`/`NAWL` từ CC BY-SA 4.0 (`data-src/wordlists/LICENSE.md` có, nhưng không được phát hành kèm)

---

## 5. Audio: chi tiết

- `public/audio` = 11,19 MB thật, 601 file. Bảng độ phủ xem §1.2.
- 4 episode đã render có sha256 khớp file thật (đã kiểm), LUFS −16,5…−16,7.
- 28 episode còn lại:
  - `audio.sha256 = "pending"`
  - `durationSec` là số tròn ước lượng (22/32 là bội số của 5 giây)
  - **mọi `script[].start/end` và `evidence.start/end` = 0**
- Vi phạm INV-L6 trên chính file đã render: `p2_001` 233,9 s (Part 2 cần 240–360 s), `p4_001` 289,2 s (Part 4 cần 300–420 s).
- Máy hiện không có `ffmpeg`/`ffprobe` trong PATH. Pipeline `scripts/audio/*.py` (cần ffmpeg) không chạy lại được trên môi trường này nếu không cài thêm.
- Vocab audio: 537/2.207 (24,3%) có thật. Validator yêu cầu tối thiểu 537 "priority" (`run_all.mjs:233`).
- Speaking: 841 đường dẫn, 0 file. M5 đang chạy nên là trạng thái dự kiến, nhưng dữ liệu đã nằm trong `public/data` và manifest.

---

## 6. Kích thước và cách tải

| File | Thô | gzip | brotli | Bỏ khoảng trắng |
|---|---:|---:|---:|---:|
| `vocab/words.json` | 3,51 MB | 0,46 MB | 0,31 MB | 2,25 MB |
| `anki_vocab.json` (legacy) | 1,59 MB | 0,34 MB | 0,24 MB | 1,02 MB |
| `vocab/collocations.json` | 0,80 MB | 0,11 MB | 0,08 MB | 0,53 MB |
| `ielts_4skills.json` (legacy, không dùng) | 0,56 MB | 0,13 MB | 0,10 MB | 0,40 MB |
| `vocab/paraphrases.json` | 0,47 MB | 0,10 MB | 0,07 MB | 0,35 MB |
| `writing/task2_prompts.json` | 0,44 MB | 0,13 MB | 0,10 MB | 0,37 MB |
| `listening/dictation.json` | 0,26 MB | 0,04 MB | 0,03 MB | 0,18 MB |
| **Tổng `public/data`** | **9,87 MB** | | | |

- **Tải lười: có.** `src/core/content/loaders.ts` dùng `fetch` theo từng file, có cache trong bộ nhớ (`contentCache`). Episode, passage và Task 1 tải theo id qua `index.json`.
  - Nhưng V1 (`src/games/v1-daily-run/V1DailyRun.tsx:79–91`) tải cùng lúc 5 file (≈ 5,3 MB thô, ≈ 0,75 MB gzip).
  - Placement (`src/features/placement/placementData.ts:347, 457`) tải cả `words.json` 3,5 MB.
  - Mỗi item còn được parse zod riêng.
- **Nén:** JSON pretty-print (thụt 2 dấu cách) làm tốn khoảng 36% dung lượng thô. Không có bản `.json.gz`/`.br` dựng sẵn; dựa vào nén HTTP của host.
- `words.json`: `examples` chiếm 854 KB, `provenance` lặp 227 KB/2.207 item.
- **PWA:** `vite.config.ts` có `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']` nên **không precache JSON hay MP3**, và không có `runtimeCaching`. Dữ liệu học không dùng được khi offline (trái mục tiêu `r-pwa-deploy`).
- Dữ liệu không ai dùng: `tips.json`, `roadmap.json`, `speaking/*.json` (chưa có game S1/S2), `ielts_4skills.json`.

---

## 7. Pipeline

- **Tái lập được.** Đã chép `data-src/`, `scripts/`, `public/data`, `public/audio`, `src/core/content` sang `scratchpad/repro`, tạo junction node_modules, rồi chạy lần lượt:
  - `scripts/data/50_merge.mjs`
  - `data-src/reading/build_passages.mjs`
  - `data-src/listening/build_listening.mjs`
  - `data-src/dictation/build_dictation.mjs`
  - `data-src/writing/build_writing_data.mjs`
  - `data-src/speaking/build_speaking_data.mjs`
  - `scripts/data/60_build_manifest.mjs`

  Tất cả exit 0. So với `D:\English\public\data`:
  - **36 file giống hệt byte**
  - 64 file chỉ khác CRLF/LF
  - 1 file khác nội dung: `manifest.json` (chỉ khác `builtAt`)
- Không chạy lại `10_convert_legacy.mjs`, `00_fetch_wordlists.py`, `20_tag_lists_freq.py`, `30_ipa_check.py` (cần mạng/Python/wordfreq).
- **P3:** không có lệnh gộp (`npm run data:build`). Mỗi loại có build script riêng nằm rải trong `data-src/<x>/`, trái sơ đồ `docs/05` §7 (tất cả nằm trong `scripts/data/`).
- `scripts/validate/run_all.mjs` import `data-src/writing/_verify_batch.mjs` và `data-src/listening/_ielts_tokens.mjs`. Validator phụ thuộc code trong data-src.
- **Script rác legacy ở `scripts/` (P2/P3):**

| File | Dòng | Nguy cơ |
|---|---:|---|
| `fix_cjk_entries.js` | 177 | **Ghi đè** `public/data/anki_vocab.json` |
| `refine_vocab_dataset.js` | 112 | **Ghi đè** `anki_vocab.json` + `ielts_strategies.json` |
| `expand_anki_vocab.py` | 3.247 | **Ghi đè** `anki_vocab.json`; chứa 832 từ LLM base64; hard-code đường dẫn Anki cá nhân |
| `build_4skills_data.py` | 3.629 | **Ghi đè** `ielts_4skills.json`; nhãn "Cambridge" |
| `extract_anki.py`, `test_extract.py` | 199, 48 | Đọc Anki/legacy |
| `validate_all_data.js` | 203 | Validator cũ (docs/03 §43 nói sẽ thay) |
| `simulate_gameplay.js`, `test_combat.js`, `test_dungeon.js`, `test_ioe_engine.js`, `test_sprites.js`, `test_store.js` | 21–96 | Test thủ công game legacy, không nằm trong Vitest |
| `download_soul_knight_assets.py`, `download_ui_assets.py`, `generate_app_icon.py` | 35–114 | Tải asset legacy ngoài `fetch_assets.py` |

Chạy nhầm 4 script đầu sẽ đổi đầu vào của `10_convert_legacy.mjs` mà không có cảnh báo.

---

## 8. Asset

| Mục | Số liệu | Vấn đề |
|---|---|---|
| `public/assets/**` | 95 file, 318 KB; CREDITS 95/95 (validator PASS) | Ghi công sai 6 illustration (P2-3) |
| Không ai tham chiếu trong `src` | `public/dungeon_tilemap.png`, `public/pwa-192.png`, `public/pwa-512.png`, `public/maskable-512.png` (manifest PWA dùng `app_icon.png` 4 KB cho cả 192 và 512), `assets/ui/uipack_sheet.png` (40 KB), `assets/ui/frame_{brown,grey,tan}_inlay.png`, `assets/illustrations/{devices,empty-cards,offline}.svg` | Có thể dọn (xoá legacy cần hỏi Bang) |
| Icon game `icons/games/*.svg` | Chỉ màn dev dùng | Màn chính chưa dùng |
| Thư mục rỗng | `public/assets/soul_knight/elf/` (và `wizard/`) | P3 |
| `scripts/assets/assets.manifest.json` | Allowlist 11 domain; khai icon, badge, illustration, sfx | Illustration khai nguồn undraw.co nhưng nội dung tự sinh |
| SFX | `sfx.{json,mp3,webm}` 54 KB, Kenney CC0 | Đạt |

---

## 9. Danh sách vấn đề và cách sửa

| # | Mức | Vị trí | Vấn đề | Cách sửa cụ thể | Tiêu chí ĐẠT (đo được) |
|---|---|---|---|---|---|
| P0-1 | P0 | `public/data/listening/episodes/*` (28 file trừ `*_001`); `public/audio/listening/` | 28/32 episode không có MP3, `sha256:"pending"`, mọi timestamp = 0. L1 không phát được và không tua tới evidence được | Chạy `python scripts/audio/render_episode.py --all` (sau khi cài ffmpeg vào PATH), ghi lại `start/end/sha256/durationSec/loudnessLUFS`; tạm thời cho loader lọc episode `sha256==='pending'` khỏi pool | `node scripts/validate/run_all.mjs --require-audio` có 0 lỗi INV-L5; 32/32 sha khớp file; 0 dòng script có `end==0` |
| P0-2 | P0/P1 | `public/data/listening/dictation.json`; `public/audio/dictation` | 240/300 dictation không có MP3 nhưng V1/L2 vẫn tải | `python scripts/audio/render_dictation.py --all`; trong lúc chờ, lọc item thiếu audio ở `dictationLoader.ts` | 300/300 file tồn tại; WPM thực lệch ≤ 10% (INV-D1, cần thêm đo vào validator) |
| P1-1 | P1 | `scripts/validate/run_all.mjs:65–66, 1332, 1483–1488, 1573`; `package.json` script `validate:data` | Validator báo PASS dù 2.835 lỗi khi bật đủ cổng; không kiểm sha256 (L5), thời lượng (L6), độ dài audio vocab (V4), WPM (D1) | Thêm script `validate:data:release` = `run_all.mjs --require-audio --require-blind`; thêm kiểm `sha256 === sha256(file)`, khoảng thời lượng theo part, 0,3–4 s cho vocab (đọc header MP3 bằng `music-metadata`, MIT); in tóm tắt "N cổng bị hoãn" màu vàng thay vì "PASS 100%" | `validate:data:release` exit 0 trước M6; `p2_001`, `p4_001` bị bắt lỗi L6 |
| P1-2 | P1 | `public/data/reading/passages/*` (24), `listening/episodes/*` (32); `data-src/*/blind_answers.json` | Blind-solve chỉ có 6/24 passage và 4/32 episode; không item nào có `qa.blindSolve` | Chạy rv-data-reading/listening cho 18 passage + 28 episode còn lại bằng `40_compare_blind.mjs`; ghi `provenance.qa.blindSolve='pass'`; sửa `rp:p2_004` q05 | 24/24 và 32/32 có `qa.blindSolve:'pass'`; tỷ lệ khớp 100% sau khi sửa câu mơ hồ |
| P1-3 | P1 | `public/data/vocab/words.json` (1.396 từ); nguồn `scripts/data/10_convert_legacy.mjs` ≈ 470–560 | Câu ví dụ khuôn; ≥ 72 câu sai ngữ pháp (VP vào chỗ NP); 490 câu ex1 nối đuôi vô nghĩa; một số sai nghĩa (`vocab:journalistic_ethics`) | Bỏ các mảng `frames` khuôn; sinh lại `examples[1]` (và cắt đuôi ex1) theo template §4.1 (LLM, 12–28 từ, tự nhiên), batch 100 từ, verifier khác hãng; giữ ID; chạy lại `build_cloze_accept.mjs` | Grep 11 cụm khuôn ("developed and developing nations alike", "remains a central priority for", "in shaping long-term public outcomes"…) = 0 lần; soi 10% (221 từ) có tỷ lệ lỗi < 5% |
| P1-4 | P1 | `words.json` `provenance`; `data-src/verdict_m1_vocab.json` | 832 từ LLM + 1.112 enrichment ghi `import/anki/own`; verifier pass cho 2.148 từ dù chỉ soi 35 | Gắn lại: từ thuộc `EXPANSION_WORDS_B64` thành `createdBy:'llm'`, `source:'llm:<model>@2026-11-20 via expand_anki_vocab.py'`; enrichment thành `llm+review`; xoá `qa.verifier` cho item chưa thực sự được soi, hoặc soi đủ 10% | `qa.verifier` chỉ có trên item có verdict trong `data-src/**/verdict_*.json`; 0 item LLM mang `source:'anki:*'` |
| P1-5 | P1 | `words.json` trường `cefr` | CEFR suy từ zipf (B1 32, C1 1.412); sai rõ ở `vocab:suburb`, `vocab:invest`, `vocab:inevitable` | Đổi tên thành `freqBand`, hoặc gán CEFR từ nguồn mở (ví dụ CEFR-J Wordlist, giấy phép tự do cho mục đích học) và ghi `cefrSource` | Lấy mẫu 50 từ: ≥ 90% khớp nguồn tham chiếu |
| P2-1 | P2 | `public/data/ielts_4skills.json` | File LLM, không dùng trong `src`, nhãn "Cambridge IELTS 8.0 curated expansion", 12 bài phỏng tin thật không ghi nguồn | (Hỏi Bang theo AGENTS §6) Chuyển sang `data-src/legacy/ielts_4skills.json`, sửa `10_convert_legacy.mjs` đọc từ đó; bỏ chữ "Cambridge" khỏi metadata và `build_4skills_data.py:4,345,3584` | `grep -ri cambridge public/` = 0; `public/data` không còn file legacy không được `src` tải |
| P2-2 | P2 | Audio edge-tts: vocab 537, dict 30, lep 8 | Giấy phép "personal use" nhưng deploy công khai; provenance text bị dùng để ghi license audio | Thêm trường `audioProvenance:{engine,voice,license}` vào schema; quyết định trong DECISIONS: (a) render lại bằng Kokoro (Apache-2.0) cho bản public, hoặc (b) deploy riêng tư; ghi `public/audio/CREDITS.md` | 100% file audio có engine/license; nếu deploy public thì 0 file edge-tts, hoặc Bang ký duyệt rủi ro trong DECISIONS |
| P2-3 | P2 | `public/assets/CREDITS.md` (6 dòng illustration); app thiếu màn Giấy phép | Ghi công sai unDraw; CC BY 3.0 (24 icon) không hiện cho người dùng; `roguelike_sheet.png`/`dungeon_tilemap.png` không có credit | Đổi 6 dòng thành "own (generated by fetch_assets.py)"; thêm route `#/credits` render CREDITS (icon + data + audio); thêm 2 PNG gốc vào CREDITS hoặc chuyển vào `public/assets/legacy/` | `assets_credits.mjs` quét cả `public/*.png`; route credits có tên Lorc/Delapouite/Carl Olsen + CC BY 3.0 |
| P2-4 | P2 | `vocab/collocations.json`: 15 cặp trùng phrase, ví dụ `col:impact_assess_the_impact_of` / `col:assess_assess_the_impact_of`, `col:foster_foster_innovation` / `col:innovation_foster_innovation`… | Cùng cụm xuất hiện 2 thẻ SRS; vi phạm tinh thần INV-V1 | Không đổi ID: đánh dấu bản sau `deprecated:true` + `aliasOf`, loader lọc; thêm kiểm trùng phrase vào validator | Validator: 0 phrase trùng trong pool hoạt động |
| P2-5 | P2 | `collocations.json` `l1Traps` (ví dụ `col:policy_formulate_a_policy` "create up a policy", `col:revenue_generate_revenue` "do revenue", `col:mitigate_mitigate_the_severity_of` "lessen heavy of") | Trap bịa, không phải lỗi người Việt thật (trái §4.2) | Verifier rà 762 trap với câu hỏi "có phải lỗi người Việt thực sự mắc?"; thay bằng dịch-sát thật (ví dụ "make policy" hợp lệ thì bỏ trap) | Soi 15% (115 trap): ≥ 95% là lỗi thật và sai tiếng Anh |
| P2-6 | P2 | `vocab/paraphrases.json` decoys | Decoy không chung từ khoá với questionPhrase, không gây nhiễu | Sinh lại decoy theo §4.3 (bắt buộc ≥ 1 decoy chia sẻ ≥ 1 lemma với questionPhrase); thêm kiểm vào validator | ≥ 90% item có ≥ 1 decoy chung lemma |
| P2-7 | P2 | `listening/dictation.json` | 0 câu level 7–10; 58 focus tip khai nối âm nhưng nói chính tả; 25 câu lệch độ dài; thiếu `acceptedVariants` US/UK | Sinh 400 câu L7–10 (100/level, nguồn 1: cắt từ script episode đã QA); gắn lại `feature` cho 104 tip chính tả (`feature:'spelling'` hoặc viết tip nối âm mới); thêm `acceptedVariants` cho câu chứa -our/-ise | Level 7–10 mỗi level ≥ 50 (MVP+) hoặc 100 (đầy đủ); 0 tip lệch nhãn; 0 câu lệch bảng §6.4 |
| P2-8 | P2 | `writing/task2_prompts.json`, `writing/task1/*` | [INV-W4] thiếu: 10/dạng (cần 15), 3–4/kind (cần 6) | M7 thêm 30 Task 2 (5 × 6 dạng) + 18 Task 1 (pie 3, table 3, process 3, map 3, bar 2, line 2, mixed 2); trả validator về ngưỡng spec | Validator với ngưỡng 15/6 exit 0 |
| P2-9 | P2 | `public/data/exam/tests.json` (không có) | ExamTest 0/2; X1 không có dữ liệu dù 8 episode + 6 passage reserved đã có | Tạo 2 `xt:` ghép `lep:p{1..4}_res_00{1,2}` + `rp:p{1..3}_res_00{1,2}`, schema `ExamTestSchema`; đưa vào manifest | 2 test qua schema; INV-X1: loader training lọc 100% id reserved (có test) |
| P2-10 | P2 | `speaking/part2.json` | Chỉ có rotation `2026-Q3` (hết hạn 31/12/2026); provenance không ghi nguồn forecast | Trước 01/2027 thêm ≥ 30 thẻ `2027-Q1`; ghi `provenance.source` gồm URL forecast | INV-S3 cho rotation đang hoạt động khi ngày hệ thống ≥ 2027-01-01 |
| P2-11 | P2 | `words.json` topics / `collocations.json` | sport 6 từ / 0 col; tourism 13/0; space 15/0; language 19/0; arts 23/0 | M7 thêm ≥ 40 từ và ≥ 24 collocation mỗi topic thiếu | Mỗi topic ≥ 40 từ và ≥ 24 collocation |
| P2-12 | P2 | `scripts/fix_cjk_entries.js`, `refine_vocab_dataset.js`, `expand_anki_vocab.py`, `build_4skills_data.py`, `test_*.js`, `simulate_gameplay.js`, `validate_all_data.js` | Script legacy có thể ghi đè đầu vào pipeline; rác | (Hỏi Bang) chuyển sang `scripts/legacy/`, thêm guard `if (!process.env.ALLOW_LEGACY_WRITE) exit(1)` ở đầu 4 script ghi | `scripts/` gốc chỉ còn thư mục `assets/ audio/ data/ validate/` |
| P2-13 | P2 | `vite.config.ts` workbox | JSON/MP3 không được cache nên không học offline được | Thêm `runtimeCaching` StaleWhileRevalidate cho `/data/**/*.json`, CacheFirst + range cho `/audio/**` theo gói tải offline | Lighthouse offline: V1 chạy được sau 1 lần mở; `caches.keys()` có data cache |
| P3-1 | P3 | `words.json` IPA (40 từ, ví dụ `vocab:tenure`, `vocab:aquifer`, `vocab:malware`, `vocab:polymer`) | IPA "UK" có r sau nguyên âm; ký hiệu lẫn 3 kiểu (524 dấu chấm, 111 "(r)") | Chuẩn hoá: bỏ dấu chấm, bỏ r sau nguyên âm (giữ r nối khi có ghi chú), đổi "(r)" thành dạng trơn; kiểm bằng `30_ipa_check.py` với Britfone | `ipa.mjs` báo 0; 0 IPA chứa "." |
| P3-2 | P3 | `words.json` 7 từ `meaningVi` > 12 từ (liệt kê ở §1.5); `vocab:menial`, `vocab:postgraduate` | Vượt giới hạn hoặc thiếu nghĩa | Rút gọn hoặc sửa | 0 `meaningVi` > 12 từ |
| P3-3 | P3 | `src/core/content/schemas.ts` | `sha256` nhận "pending"; provenance Speaking optional; thiếu schema Tip/Roadmap/Cliche trong core | Regex hex 64; bỏ `.optional()`; chuyển `ClicheEntrySchema` vào core | `npm test` + `validate:data` exit 0 |
| P3-4 | P3 | `public/data/**/*.json` | Pretty-print +36%; V1 tải ~5,3 MB thô | Ghi minified khi build (`JSON.stringify(x)`), giữ bản đẹp trong data-src; tách `words.json` thành `words.core.json` (id/headword/ipa/meaningVi/audio) + `words.detail.json` | `words.json` (hoặc core) < 1 MB thô; V1 tải ban đầu < 1,5 MB thô |
| P3-5 | P3 | `data-src/*/build_*.mjs` | Không có lệnh gộp | Thêm `npm run data:build` chạy 50_merge → build_* → 60_build_manifest | Một lệnh tái tạo; diff với repo chỉ khác `builtAt` |
| P3-6 | P3 | Episode `lep:p1_002`, `lep:p2_005`… | Lời thoại thiếu rút gọn, thiếu "um/right" | Khi render lại audio, thêm `ttsText` có rút gọn | Soi 4 episode: ≥ 3 rút gọn/phút |
| P3-7 | P3 | `listeningAnswer.ts`; `lep:p1_002` q05, `lep:p1_001` q03 | Số điện thoại có dấu cách bị chấm sai | Chuẩn hoá bỏ khoảng trắng giữa các nhóm chữ số trước khi so | Test unit: "07834 912 055" khớp "07834912055" |
| P3-8 | P3 | Asset không dùng (liệt kê ở §8); thư mục rỗng `soul_knight/elf`, `wizard` | Thừa | (Hỏi Bang nếu thuộc legacy) dọn | Script không-tham-chiếu báo 0 |
| P3-9 | P3 | `rp:p2_002` Q13; đoạn E | Gán ý kiến cho Kowalski mơ hồ; số liệu dự án thật bị ẩn danh pha bịa | Sửa prompt "According to the writer…"; thêm "hypothetical figures" vào `explanationVi` hoặc dùng địa danh hư cấu rõ | Verifier pass |

---

## 10. Ghi chú môi trường

- Lúc đầu `node_modules` trống, coordinator đang chạy `npm ci`. Tôi đợi `node_modules/.bin/vitest` xuất hiện rồi mới chạy `npm run validate:data`, và không chạy npm install/ci.
- Junction `scratchpad/repro/node_modules` trỏ tới `D:\English\node_modules`. Junction chỉ để chạy pipeline trong bản sao, không ghi gì vào `D:\English`.
- Không có `ffmpeg`/`ffprobe` trong PATH nên không đo lại được thời lượng/LUFS của MP3. Số liệu thời lượng lấy từ JSON đã được xác nhận sha khớp.
