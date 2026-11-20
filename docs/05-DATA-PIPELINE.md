# 05 · Data Pipeline: lấy dữ liệu ở đâu, sinh ra sao, kiểm thế nào

> **Chất lượng dữ liệu quyết định 70% giá trị của app.** Một câu TFNG mơ hồ hay một collocation sai còn tệ hơn là không có câu đó.
> Quy trình bắt buộc: **Nguồn hợp lệ → Sinh theo template → Validator tự động → Verifier (model khác tác giả) → Blind-solve → Soi mẫu → Merge.**
> Item không qua đủ các bước thì **không được vào `public/data`**.

## 1. Luật bản quyền (cứng)

| Được dùng | Không được dùng |
|---|---|
| Nội dung **tự sinh mới** theo phong cách IELTS (LLM + kiểm) | Chép, dịch hay paraphrase sát đề **Cambridge IELTS 1–20**, sách Official Guide, Road to IELTS, đề của các trung tâm |
| Bộ thẻ Anki của Bang (`anki:*`, license `own`) | Văn bản từ báo hay tạp chí có bản quyền (Guardian, Economist, BBC…) |
| **NGSL, NAWL** (CC BY-SA 4.0) để gắn nhãn và chọn từ | Bản ghi audio đề thi thật, video YouTube |
| **Academic Word List** (Coxhead): chỉ dùng làm *nhãn danh sách* `AWLn`. Không phát hành lại file gốc | Ví dụ, định nghĩa chép từ Oxford, Cambridge hay Longman |
| **wordfreq** (code Apache-2.0, data CC BY-SA 4.0) để lấy tần suất | Dữ liệu từ app thương mại khác |
| **Wikipedia** (CC BY-SA 4.0). Được chỉnh sửa và rút gọn, phải ghi nguồn + license + "adapted" | |
| **The Conversation** (CC BY-ND 4.0): chỉ dùng **nguyên văn, không sửa**, cho bài đọc thêm. *Không* dùng làm passage có câu hỏi (cắt ngắn đã tính là sửa) | |
| Band descriptors IELTS: tự diễn đạt lại trong rubric, kèm link bản gốc | |

**Luật nội dung tự sinh:**
- Không gán phát hiện bịa cho **tổ chức hay người thật**. Dùng tên giả ("researchers at a Scandinavian university", "Dr Helen Marsh") hoặc kiến thức phổ thông đúng sự thật.
- Không có chủ đề nhạy cảm: chính trị đảng phái, tôn giáo, bạo lực, y tế gây hoang mang.
- Dùng **chính tả Anh-Anh** cho Reading và Writing (organise, colour, centre). Đáp án Listening chấp nhận cả hai.

## 2. Nguồn nền
- **NGSL và NAWL**: https://www.newgeneralservicelist.com/ (CC BY-SA 4.0). Script `scripts/data/00_fetch_wordlists.py` tải về `data-src/wordlists/`, ghi kèm license.
- **AWL sublists 1–10**: trang Victoria University of Wellington. Chỉ dùng để gắn nhãn `AWLn` (headword → sublist).
- **wordfreq**: `pip install wordfreq`, dùng `zipf_frequency(word,'en')`.
- **Phát âm UK, để đối chiếu IPA:** Britfone (https://github.com/JoseLlarena/Britfone, kiểm license trước khi dùng). Không đạt thì dùng `espeak-ng --ipa -v en-gb` làm tham chiếu thứ hai.
  - Validator **gắn cờ** (không tự sửa) khi IPA của item lệch tham chiếu quá ngưỡng (khoảng cách ký tự > 30%), rồi đưa vào hàng chờ verifier.
- **Bộ thẻ Anki của Bang:** `public/data/anki_vocab.json`, `public/data/ielts_4skills.json`, sinh từ `scripts/extract_anki.py` và `scripts/expand_anki_vocab.py`.
  - MCP `anki` hiện không kết nối được (ECONNREFUSED). Nếu cần đọc lại Anki thì nhờ Bang bật AnkiConnect. Nếu không, dùng file JSON có sẵn.

## 3. Chuyển dữ liệu cũ sang V3 (`scripts/data/10_convert_legacy.mjs`)

| Nguồn | Đích | Cách xử lý |
|---|---|---|
| `anki_vocab.json` (12 realms, 2.152 từ) | `vocab/words.json` | `realmId` → `topics`. `collocations[]` → tạo stub `col:*` cần làm giàu (§4.2). `synonyms` → `synonyms`. Định nghĩa: **viết lại** nếu nghi chép từ từ điển (verifier đánh dấu). Gắn `lists` và `freqZipf`. Loại trùng theo headword chuẩn hoá. Từ quá cơ bản (zipf > 5,5 và không thuộc AWL/NAWL) → `lists:['NGSL']` và **không** đưa vào hàng thẻ mới mặc định |
| `ielts_4skills.listening` (160 mục) | `listening/dictation.json` (câu `audioText`) + item bẫy chính tả cho V1 face `listen_spell` | Sinh lại audio bằng Kokoro (cấm dùng Web Speech) |
| `ielts_4skills.reading.passages` (12 bài ngắn) | **Không** dùng làm passage V3 vì quá ngắn | Đoạn văn được tái dùng làm `context` cho V3 (Paraphrase Radar). TFNG cũ dùng làm câu luyện ở R1 training "mini", gắn `level:'P1'` + cờ `mini:true`. Muốn dùng phải viết lại theo `04` §5 |
| `ielts_4skills.reading.paraphrases` (160) | `vocab/paraphrases.json` | Cần thêm `context`/`target`/`decoys` (§4.3) |
| `ielts_4skills.writing.upgrades` (150) | collocation hoặc vocab item + ví dụ "band 6 → band 8" cho W1 feedback | |
| `ielts_4skills.writing.errorFixes` (108) | `vocab/error_patterns.json` | Gắn `tag` |
| `ielts_4skills.speaking.*` | `speaking/phrases.json` | Khung Part 2/3 đưa vào `tips.json` |
| `ielts_strategies.json` (62) | `tips.json` | Mỗi tip ≤ 25 từ để hiện ở màn intro phiên |

**Mọi item import đều mang `createdBy:'import'`** và vẫn phải qua validator và verifier, vì dữ liệu cũ phần lớn do LLM sinh.

## 4. Template sinh nội dung (cho worker `r-data-*`)
**Cách làm trong Antigravity:** worker là LLM, tự sinh nội dung theo batch rồi ghi JSON vào `data-src/<loại>/batch_<NNN>.json`. Mỗi batch:
- 10–20 item
- có trường `provenance.source = "llm:<tên model>@<YYYY-MM-DD>"`

Script `scripts/data/50_merge.mjs` chỉ merge những item đã có verdict `pass`.

**Luật chung cho mọi template:** trả về đúng JSON theo schema ở `04`, không có văn bản ngoài JSON. Không dùng ký tự CJK. Dùng dấu ngoặc kép thẳng `"`.

### 4.1 VocabItem (làm giàu và viết lại)
```
Bạn là lexicographer cho người học IELTS 6.0→8.0 người Việt.
Cho headword: {{headword}} (topics: {{topics}}, lists: {{lists}}).
Viết VocabItem theo schema [dán schema].
- definitionEn: tự viết, ≤20 từ, dễ hiểu, KHÔNG chép từ điển nào.
- examples: 2 câu 12–28 từ; 1 câu kiểu Writing Task 2, 1 câu kiểu Speaking/Reading; đúng collocation tự nhiên.
- family: mọi dạng từ phổ biến (bỏ dạng hiếm).
- synonyms: ≤3, ghi rõ khác sắc thái bằng tiếng Việt (noteVi ≤12 từ).
- vnTrap: lỗi thực tế người Việt hay mắc với từ này (sai giới từ, đếm được/không, dịch word-by-word), hoặc bỏ trống nếu không có lỗi điển hình.
- ipa.uk theo chuẩn Cambridge/Oxford UK, có dấu trọng âm ˈ ˌ.
```

### 4.2 Collocation
```
Headword {{headword}} ({{pos}}). Liệt kê 4–8 collocation học thuật TỰ NHIÊN, hay dùng trong IELTS Writing Task 2/Speaking Part 3,
mỗi cái theo schema Collocation. Ưu tiên collocation band 7–8 (vd "exert/wield influence", "a profound impact on").
- gaps: ẩn THÀNH PHẦN khó nhớ nhất (thường là động từ hoặc tính từ đi kèm); answers liệt kê mọi lựa chọn tự nhiên tương đương.
- l1Traps: 1–2 lỗi "kiểu Việt" thật sự gặp (dịch từ tiếng Việt), whyVi ≤20 từ. KHÔNG bịa lỗi vô lý.
- example: câu 15–30 từ, chứa phrase nguyên văn.
- bandTarget: 7 nếu phổ biến trong bài band 7, 8 nếu ít phổ biến nhưng chính xác, 9 nếu rất tinh tế.
Không đưa collocation hiếm/văn chương/lỗi thời.
```
Verifier cho collocation phải trả lời 3 câu cho mỗi item:
1. Người bản xứ viết học thuật có dùng cụm này không? (yes, rare hoặc no)
2. Mọi `answers` có thực sự tự nhiên không?
3. `l1Traps` có thật sự sai không?

Chỉ giữ item `yes` và sửa hết lỗi.

### 4.3 ParaphraseItem
```
Viết 1 đoạn {{40–120}} từ phong cách bài đọc IELTS về {{topic}}.
Chọn questionPhrase (cụm sẽ xuất hiện trong câu hỏi). Đoạn văn phải chứa 1 target = paraphrase của questionPhrase ở level {{level}}:
 L1 đồng nghĩa từ (reduce ↔ cut), L2 đổi dạng từ (expand rapidly ↔ rapid expansion), L3 đổi cấu trúc (people believe ↔ it is widely held),
 L4 bẫy: cụm trông giống nhưng KHÁC nghĩa (relation=not_equivalent, vd "most" ↔ "a significant minority").
Thêm 1–3 decoys: cụm trong đoạn có từ khoá giống questionPhrase nhưng không phải paraphrase; whyVi ≤20 từ.
Ghi start/end bằng chỉ số ký tự chính xác (0-based, end exclusive).
```

### 4.4 Reading Passage + câu hỏi
**Bước A: viết passage**
```
Viết passage IELTS Academic level {{P1|P2|P3}}, chủ đề {{topic}}, {{650–950}} từ, 5–8 đoạn có nhãn A, B, C...
Văn phong: bài tạp chí khoa học phổ thông (kiểu New Scientist/Scientific American) nhưng NỘI DUNG TỰ VIẾT; chính tả Anh-Anh.
P1: mô tả/tường thuật, ít lập luận. P2: có so sánh, nguyên nhân–kết quả, nhiều số liệu. P3: lập luận, quan điểm học giả trái chiều, trừu tượng hơn.
Mỗi đoạn có 1 ý chính rõ ràng (để làm Matching Headings), nhưng câu chủ đề KHÔNG phải lúc nào cũng là câu đầu.
Đưa vào tự nhiên: 3–5 qualifier (some/most/rarely...), 2–3 so sánh, 2 quan hệ nhân quả, 1–2 ý kiến của "researchers" khác với tác giả, 4–8 con số/năm.
Không dùng tên tổ chức/người thật cho phát hiện bịa. Không có tiêu đề phụ trong thân bài.
```
**Bước B: viết câu hỏi** (worker khác hoặc lượt khác, nhận passage làm input)
```
Từ passage (đã đánh nhãn đoạn), viết 13–14 câu theo 2–3 nhóm dạng: {{vd: tfng 6, headings 5, summary_completion 3}}.
Luật TFNG: TRUE = bài khẳng định cùng ý; FALSE = bài nói ngược lại rõ ràng; NOT GIVEN = bài không đủ thông tin.
Mỗi câu TFNG gắn trapType (qualifier|comparison|causation|time_sequence|number_date|opinion_vs_fact|partial_match|keyword_echo|extra_claim).
Câu hỏi phải PARAPHRASE bài (không lặp nguyên cụm >3 từ liên tiếp trừ tên riêng/số).
evidence: trích nguyên văn (quote) + start/end trong paragraph.text. NOT GIVEN: evidence = câu gần chủ đề nhất (để giải thích vì sao chưa đủ).
Headings: số heading = số đoạn hỏi + 2..3; mỗi câu ghi ≥2 headingDistractors khác type; mainIdeaSpan = câu/cụm mang ý chính.
explanationVi ≤2 câu, chỉ ra quy luật; steps: 2–4 bước suy luận.
Phân bố đáp án TFNG: mỗi loại ≥2 trong nhóm 6 câu.
```

### 4.5 Listening Episode
```
Viết kịch bản IELTS Listening Part {{n}} ({{bối cảnh}}), độ dài khi đọc ≈ {{4–6}} phút (~{{600–850}} từ), kèm 10 câu hỏi theo dạng {{...}}.
Part 1: 2 người, giao dịch (đặt phòng, đăng ký khoá học, báo mất đồ...). Phải có: 1 tên được ĐÁNH VẦN, 1 số điện thoại/mã/postcode,
  1 self_correction, 1 distractor_number, ngày/giờ/giá.
Part 2: 1 người hướng dẫn; nếu map_labelling thì kèm MapSpec (toạ độ 800x560) và lời chỉ đường dùng opposite/next to/just past/at the end of.
Part 3: 2–3 người (sinh viên + tutor), có đồng ý/phản đối, option_mentioned_rejected cho MCQ.
Part 4: bài giảng, signpost rõ ("Let's turn now to..."), note_completion theo thứ tự xuất hiện.
Câu hỏi xếp THEO THỨ TỰ xuất hiện trong audio. Đáp án completion tuân thủ wordLimit và có NGUYÊN VĂN trong script.
Mỗi câu khai báo evidence.lineId; mỗi bẫy khai báo traps[] với lineId và decoy.
Câu nói phải tự nhiên: có "um", "right", "let me see", ngắt câu, nói chồng ý nhẹ; KHÔNG đọc như văn viết.
Speaker voices chọn trong danh sách 06-AUDIO-PIPELINE §2; ghi accent.
Chưa có timestamp → để start/end = 0, script audio sẽ điền.
```

### 4.6 DictationItem
- **Nguồn 1:** cắt câu từ script các episode đã qua QA. Đây là nguồn tốt nhất vì giọng và ngữ cảnh thật.
- **Nguồn 2:** câu mới 6–28 từ, phủ đủ các `features`.
- Mỗi câu khai báo `focus` gồm 1–3 điểm nghe khó, kèm `tipVi` và `ipaConnected`, ví dụ `"next day" → /neks deɪ/`.
- Bảng level xem §6.4.

### 4.7 Task 2 Prompt + model band 8
```
Viết đề IELTS Writing Task 2 dạng {{essayType}}, chủ đề {{topic}}, văn phong đề thật, MỚI (không chép đề đã có).
partsToAddress: liệt kê mọi phần phải trả lời. ideaBank: ≥6 ý (mỗi ý 1 câu + 1 câu phát triển).
band8Model 270–320 từ: 4–5 đoạn, quan điểm rõ từ mở bài, mỗi thân bài 1 ý chính được phát triển (giải thích → ví dụ cụ thể → hệ quả),
từ nối tự nhiên (không dồn Moreover/Furthermore), collocation chính xác, ≥5 cấu trúc phức đa dạng, KHÔNG dùng thành ngữ sáo rỗng
("In this day and age", "every coin has two sides"). notes: 6–10 chú thích chỉ ra điểm ăn band 8 theo tiêu chí.
```

### 4.8 Task 1 Visual
```
Tạo dữ liệu biểu đồ {{kind}} hợp lý (số liệu giả định nhưng có xu hướng rõ, 1–2 điểm bất thường), chủ đề {{topic}}.
keyFeatures: 3–6 đặc điểm chính mà bài band 8 PHẢI nêu (≥1 overall_trend/grouping mustMention).
overviewModels: 2–3 câu overview band 8 khác cách diễn đạt. band8Model 160–200 từ, mọi số liệu khớp dữ liệu.
Process: 6–10 bước, có/không chu trình. Map: before/after với 4–7 thay đổi.
```

### 4.9 Speaking
- **Part 1:** mỗi topic có 4–5 câu ngắn tự nhiên, kèm `ideaHintsEn` và `areSample` (Answer–Reason–Example, khoảng 35–55 từ).
- **Part 2:** cue card đúng format (You should say: … and explain …). `band8Sample` dài 250–330 từ, có chuyện kể cá nhân, cảm xúc, chi tiết cụ thể.
- **Part 3:** 5–6 câu trừu tượng theo các `type` khác nhau, nối với chủ đề Part 2. Mỗi câu có 2–3 `followUps` ngắn kiểu giám khảo ("Why is that?", "Is that always the case?", "What about…?").
- **Rotation:** worker tra **forecast của đợt đang diễn ra** trên 2–3 nguồn công khai (vd prepedu.com, engnovate.com, cathoven.com). Chỉ lấy **chủ đề và ý chính**, tự viết lại câu hỏi. Không chép nguyên văn bài mẫu của các trang.

## 5. Các cổng chất lượng

| Cổng | Ai làm | Cách làm | Đạt khi |
|---|---|---|---|
| G1 Schema + INV | Script `npm run validate:data` | zod + mọi luật `[INV-*]` ở `04` | 0 lỗi |
| G2 Verifier | Worker `rv-data-*` dùng **model khác model tác giả** | Đọc từng item theo checklist §5.1. Ghi `data-src/<loại>/verdict_<batch>.json` dạng `{id, verdict: pass|fix|reject, issues[], fixed?}` | Tỷ lệ reject < 15% mỗi batch. Nếu ≥ 15% thì batch bị trả về tác giả |
| G3 Blind-solve (Reading/Listening) | Worker kiểm, **không thấy đáp án** | Nhận passage hoặc transcript + câu hỏi, trả lời, ghi lý do. Script `scripts/data/40_compare_blind.mjs` so với đáp án | 100% khớp. Câu lệch thì xem lại câu hỏi: hoặc sửa thành rõ ràng, hoặc bỏ. **Không được sửa đáp án cho khớp blind-solver nếu chưa phân tích** |
| G4 Soi mẫu | `rv-*` hoặc Bang | Lấy ngẫu nhiên 10% (ít nhất 5 item) mỗi loại, đọc kỹ, ghi `data-src/REVIEW_LOG.md` | Không lỗi nghiêm trọng. Có 1 lỗi nghiêm trọng thì soi thêm 20% |
| G5 Audio QA | Script + nghe mẫu | `06` §5 | Như `06` |

### 5.1 Checklist cho verifier
- **Chung:**
  - Tiếng Anh tự nhiên, đúng ngữ pháp.
  - Chính tả UK.
  - Không có sự thật sai hay phát hiện bịa gán cho tổ chức thật.
  - Lời giải thích tiếng Việt đúng và ngắn.
- **TFNG:**
  - Mỗi câu chỉ có **một** đáp án bảo vệ được.
  - FALSE phải có mâu thuẫn rõ.
  - NOT GIVEN không bị suy ra được từ bài bằng suy luận thông thường.
  - Câu hỏi không lặp nguyên cụm dài từ bài.
- **Headings:**
  - Mỗi đoạn khớp đúng 1 heading.
  - Distractor hấp dẫn nhưng sai vì lý do rõ ràng.
- **Listening:**
  - Đáp án nằm sau đúng tín hiệu trong audio.
  - Bẫy xuất hiện **trước** hoặc **gần** đáp án.
  - Không có câu nào trả lời được mà không cần nghe.
  - Đúng giới hạn từ.
- **Collocation:** xem §4.2.
- **Writing model:**
  - Đạt band 8 theo `01` §4.1.
  - Số liệu Task 1 khớp dữ liệu.
  - Không có cụm sáo rỗng.

## 6. Số lượng mục tiêu

| Loại | MVP (để qua mốc) | Đầy đủ (M6) | Ghi chú |
|---|---|---|---|
| VocabItem | 2.000 (từ cũ đã làm sạch) | 3.500 | Phủ 100% AWL 1–10 headword + NAWL + topic vocab |
| Collocation | 600 | 1.500 | ≥ 4 mỗi headword trung tâm của 25 topic |
| ParaphraseItem | 300 | 800 | Level 1:2:3:4 = 3:3:3:1 |
| ErrorPattern | 200 | 400 | Mỗi `tag` có ≥ 15 |
| Listening episode (training) | 24 (6 mỗi part) | 80 (20 mỗi part) | |
| Listening episode (reserved cho X1) | 8 (2 test) | 32 (8 test) | |
| DictationItem | 300 | 1.000 | 100 mỗi level |
| Passage (training) | 18 (6 mỗi level) | 60 | |
| Passage (reserved cho X1) | 6 | 24 | |
| Task 2 prompt | 60 (10 mỗi dạng) | 150 | |
| Task 1 visual | 24 | 60 | Đủ 7 kind |
| Part 1 topic | 30 | 60 | |
| Part 2 cue card + Part 3 set | 40 | 90 | ≥ 30 thuộc đợt hiện tại |
| SpeakingPhrase | 80 | 150 | |
| ExamTest | 2 | 8 | |

### 6.4 Bảng level Dictation (L2)

| Level | WPM | Độ dài (từ) | Giọng | Đặc điểm |
|---|---|---|---|---|
| 1 | 110 | 6–10 | UK | Từ rõ, ít nối âm |
| 2 | 120 | 8–12 | UK | Số, ngày, đánh vần |
| 3 | 130 | 10–14 | UK, US | Âm cuối -s/-ed |
| 4 | 140 | 10–16 | UK, US | Âm yếu |
| 5 | 150 | 12–18 | UK, US, AU | Nối âm |
| 6 | 160 | 14–20 | UK, US, AU | Nuốt âm, contraction |
| 7 | 165 | 16–22 | mix | Từ học thuật |
| 8 | 170 | 18–24 | mix | Câu Part 4 |
| 9 | 180 | 20–26 | mix | Câu dài nhiều mệnh đề |
| 10 | 185+ | 22–28 | mix | Câu Part 3 có tự sửa |

## 7. Thư mục và script
```
data-src/                      # commit vào git, KHÔNG nằm trong public/
  wordlists/  vocab/  collocations/  paraphrases/  errors/
  listening/  dictation/  reading/  writing/  speaking/
  REVIEW_LOG.md
scripts/data/
  00_fetch_wordlists.py   10_convert_legacy.mjs   20_tag_lists_freq.py
  30_ipa_check.py         40_compare_blind.mjs    50_merge.mjs
  60_build_manifest.mjs
scripts/validate/run_all.mjs
```
- `50_merge.mjs`:
  - chỉ lấy item có verdict `pass` hoặc `fixed` (đã áp `fixed`) và blind-solve `pass`
  - cấp ID theo quy ước `04`
  - **không bao giờ đổi ID đã có**
  - ghi vào `public/data/**`
  - chạy lại manifest
