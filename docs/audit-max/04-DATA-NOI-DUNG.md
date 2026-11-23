# 04 · DỮ LIỆU VÀ NỘI DUNG: độ đúng, nguồn, cấu trúc, độ phủ band 4–9, bản quyền

> Đếm thật bằng script ngày 23/11/2026; soi mẫu ngẫu nhiên seed `20261123`. Chi tiết 30 vấn đề, bảng số liệu và ví dụ từng item: `phu-luc/C-du-lieu-noi-dung.md`.
> Luật liên quan: `LUAT.md` C1–C6, K2, A6.

## 1. Điểm hiện tại: **4,5/10**

| Tiêu chí | Điểm | Một câu |
|---|---|---|
| Số lượng text | 7 | Đạt mức MVP gần hết (2 207 từ, 762 collocation, 24+8 episode, 18+6 passage, 60/24 đề viết, Speaking text đủ); ExamTest 0/2 |
| Audio | **2** | **601/3 380 file (17,8%)**: vocab 537/2 207, dictation 60/300, listening **4/32**, speaking **0/841** |
| Độ đúng đáp án | 8 | Soi mẫu: TFNG 12/12, Listening 20/20, Writing 5/5 bảo vệ được |
| Độ đúng ngôn ngữ | 4 | 1 396/2 207 từ (63%) có câu ví dụ khuôn đúc, **≥ 72 câu sai ngữ pháp**; `cefr` thực chất suy từ tần suất (sai: `suburb` C1, `invest` C1); 40 IPA lẫn kiểu |
| Cổng chất lượng | 3 | `validate:data` báo PASS nhưng bật đủ cổng (`--require-audio --require-blind`) thì **2 835 lỗi**; blind-solve mới 6/24 passage, 4/32 episode |
| Nguồn & bản quyền | 4 | 832 từ do LLM sinh ghi `import/anki/own`; `verifier:'pass'` cho 2 148 từ dù chỉ soi 35; file legacy có nhãn "Cambridge IELTS"; audio edge-tts "personal use" (Bang đã chấp nhận rủi ro, xem D12) |
| Độ phủ band 4–9 | 4 | Collocation chỉ band 7–9; dictation chỉ level 1–6 (thiếu 165–205 wpm cho mục tiêu L 8.5); 5 topic có 0 collocation |
| Cấu trúc & tải | 6 | Schema zod đầy đủ, pipeline tái lập được (diff chỉ `builtAt`); nhưng JSON pretty-print +36%, V1 tải 5,3 MB thô, placement tải `words.json` 3,5 MB |

## 2. Vấn đề nặng nhất

| # | Vị trí | Vấn đề | Mức | Cách sửa (lệnh / thông số) | Tiêu chí ĐẠT |
|---|---|---|---|---|---|
| D1 | `public/data/listening/episodes/*` (28 file trừ `*_001`), `public/audio/listening/` | 28/32 episode không có MP3, `sha256:"pending"`, mọi timestamp = 0; `p2_001` (233,9 s), `p4_001` (289,2 s) vượt khung thời lượng INV-L6 mà validator không bắt | **P0** | Cài ffmpeg vào PATH; `python scripts/audio/render_episode.py --all`; ghi `start/end/sha256/durationSec/loudnessLUFS`; trong lúc chờ: loader lọc `sha256==='pending'` (xem `01-GAME.md` L1-01) | `node scripts/validate/run_all.mjs --require-audio` 0 lỗi INV-L5/L6; 32/32 sha khớp; 0 dòng script `end==0` |
| D2 | `listening/dictation.json`, `public/audio/dictation/` | 240/300 câu không có audio; **0 câu level 7–10** | P0/P1 | `python scripts/audio/render_dictation.py --all`; sinh 400 câu L7–10 (100/level, cắt từ script episode đã QA); lọc câu thiếu audio trong `dictationLoader.ts` | 300/300 file; L7–10 mỗi level ≥ 50 (MVP+) |
| D3 | `scripts/validate/run_all.mjs:65-66, 1332, 1483-1488, 1573`; `package.json` | Validator "xanh giả": cổng audio và blind-solve chỉ in NOTE; không kiểm sha256, thời lượng, WPM | P1 | Thêm `"validate:data:release": "node scripts/validate/run_all.mjs --require-audio --require-blind"`; thêm kiểm sha256, thời lượng theo part, 0,3–4 s cho vocab (`music-metadata`, MIT); in "N cổng bị hoãn" màu vàng thay "PASS 100%" | `validate:data:release` exit 0 trước khi deploy công khai; CI chạy bản release ở nhánh `master` |
| D4 | `public/data/reading/passages/*`, `listening/episodes/*`, `data-src/*/blind_answers.json` | Blind-solve 6/24 passage, 4/32 episode; 0 item có `qa.blindSolve` | P1 | `node scripts/data/40_compare_blind.mjs` cho 18 passage + 28 episode còn lại, model khác model sinh; sửa `rp:p2_004` q05 (YNNG mơ hồ) | 24/24 + 32/32 có `qa.blindSolve:'pass'`; khớp 100% |
| D5 | `public/data/vocab/words.json`; nguồn `scripts/data/10_convert_legacy.mjs` ≈ dòng 470–560 | Câu ví dụ khuôn ("developed and developing nations alike", "remains a central priority for"…); ≥ 72 câu sai ngữ pháp (vd `vocab:brain_drain` "the role of suffer from…"), sai nghĩa (`vocab:journalistic_ethics`). Đây là nguồn cloze của V1 | P1 | Bỏ `frames` khuôn; sinh lại `examples[1]` 12–28 từ tự nhiên theo `docs/04` §4.1, batch 100, verifier khác hãng; giữ ID, tăng `rev`; chạy lại `build_cloze_accept.mjs` | Grep 11 cụm khuôn = 0; soi 10% (221 từ) lỗi < 5% |
| D6 | `words.json` `provenance`; `data-src/verdict_m1_vocab.json` | Khai nguồn sai: 832 từ LLM (base64 trong `scripts/expand_anki_vocab.py`) + 1 112 enrichment ghi `import/anki/own`; `qa.verifier` cho item chưa soi | P1 | Gắn lại `createdBy:'llm'`, `source:'llm:<model>@2026-11-20'`; enrichment `llm+review`; xoá `qa.verifier` không có verdict thật | 0 item LLM mang `source:'anki:*'`; `qa.verifier` chỉ có khi có verdict file |
| D7 | `words.json` `cefr` | CEFR suy từ zipf | P1 | Đổi thành `freqBand`, hoặc gán CEFR từ nguồn mở có giấy phép (ghi `cefrSource`) | Mẫu 50 từ ≥ 90% khớp nguồn |
| D8 | `collocations.json` `l1Traps` (vd `col:policy_formulate_a_policy` "create up a policy", `col:revenue_generate_revenue` "do revenue") | Bẫy "kiểu Việt" bịa, không phải lỗi thật | P2 | Verifier rà 762 trap; thay bằng lỗi dịch-sát thật | Soi 15% (115): ≥ 95% là lỗi thật |
| D9 | `collocations.json` | 15 cặp phrase trùng (vd `col:impact_assess_the_impact_of` / `col:assess_assess_the_impact_of`) | P2 | Không đổi ID: bản sau `deprecated:true` + `aliasOf`; loader lọc; validator kiểm trùng | 0 phrase trùng trong pool hoạt động |
| D10 | `paraphrases.json` decoys | Decoy không chung từ khoá → không gây nhiễu | P2 | Mỗi item ≥ 1 decoy chung ≥ 1 lemma với `questionPhrase` | ≥ 90% item đạt |
| D11 | `public/data/ielts_4skills.json`, `scripts/build_4skills_data.py:4,345,3584` | Không code V3 nào dùng; nhãn "Cambridge IELTS 8.0 curated expansion"; 12 bài phỏng tin thật không ghi nguồn | P2 (bản quyền) | (Hỏi Bang, AGENTS §6) chuyển sang `data-src/legacy/`; bỏ chữ "Cambridge" | `grep -ri cambridge public/` = 0 |
| D12 | Audio edge-tts: vocab 537, dictation 30, listening 8 | Điều khoản dịch vụ edge-tts ghi "personal use" | P3 | **Đã quyết (23/11/2026, `DECISIONS.md` mục D): Bang chấp nhận rủi ro, được deploy công khai, không bắt buộc render lại.** Audio mới vẫn được dùng edge-tts. Việc còn lại: thêm `audioProvenance:{engine,voice,license}` cho từng file; lập `public/audio/CREDITS.md` | 100% file audio có engine + license |
| D13 | `public/assets/CREDITS.md` (6 dòng illustration), app không có màn Giấy phép | 6 SVG tự sinh lại ghi công unDraw; icon CC BY 3.0 (Lorc, Delapouite, Carl Olsen) không hiện trong app; dữ liệu wordfreq/NGSL (CC BY-SA) không có CREDITS | P2 | Sửa 6 dòng thành "self-made (fetch_assets.py)" + `self_made_reason`; route `#/credits` render CREDITS icon + data + audio; `public/data/ATTRIBUTION.md` | `#/credits` hiện đủ tên tác giả CC BY; validator quét cả `public/*.png` |
| D14 | `public/data/exam/` (không tồn tại) | ExamTest 0/2 dù đã có 8 episode + 6 passage reserved | P2 | Tạo 2 `xt:` ghép `lep:p{1..4}_res_00{1,2}` + `rp:p{1..3}_res_00{1,2}` theo `ExamTestSchema` (chỉ sau D1 có audio reserved) | 2 test qua schema; loader training lọc 100% id reserved (test) |
| D15 | `writing/task2_prompts.json`, `writing/task1/*` | INV-W4 thiếu: 10/dạng (cần 15), 3–4/kind (cần 6) | P2 | Thêm 30 Task 2 + 18 Task 1 (pie 3, table 3, process 3, map 3, bar 2, line 2, mixed 2) | Validator ngưỡng 15/6 exit 0 |
| D16 | `speaking/part2.json` | Chỉ rotation `2026-Q3`, hết hạn 31/12/2026 | P2 | Trước 01/01/2027 thêm ≥ 30 thẻ `2027-Q1`, ghi nguồn forecast | INV-S3 đạt khi ngày ≥ 2027-01-01 |
| D17 | `public/data/**/*.json`, V1 `V1DailyRun.tsx:79-91`, `placementData.ts:347,457` | JSON pretty-print; V1 tải 5 file ≈ 5,3 MB thô; placement tải 3,5 MB | P3 | Minify khi build (giữ bản đẹp ở `data-src`); tách `words.core.json` (id, headword, ipa, meaningVi, audio) + `words.detail.json` | `words.core.json` < 1 MB thô; V1 tải đầu < 1,5 MB thô |
| D18 | `scripts/` gốc (`fix_cjk_entries.js`, `refine_vocab_dataset.js`, `expand_anki_vocab.py`, `build_4skills_data.py` **ghi đè** đầu vào pipeline) | Chạy nhầm sẽ đổi dữ liệu không cảnh báo | P2 | (Hỏi Bang) chuyển sang `scripts/legacy/`; thêm guard `if (!process.env.ALLOW_LEGACY_WRITE) process.exit(1)` | `scripts/` gốc chỉ còn `assets/ audio/ data/ validate/` |
| D19 | 40 IPA (vd `vocab:tenure`, `vocab:aquifer`) | IPA "UK" có r sau nguyên âm; 524 IPA có dấu chấm | P3 | Chuẩn hoá theo Britfone (`30_ipa_check.py`) | 0 IPA chứa "."; 0 r sau nguyên âm (trừ ghi chú) |

## 3. Độ phủ band 4.0–9.0 (ngưỡng tối thiểu, `LUAT.md` C5)

Quy đổi chung: **level 1–10 ↔ band** theo `01-GAME.md` §4 (L1≈4.0, L3≈5.0, L5≈6.0, L7≈7.0, L9≈8.0, L10≈8.5+). Mỗi loại item phải có trường `level` (1–10) – hiện chỉ dictation, episode, Task 1/2 có.

| Loại | Trường độ khó | Hiện tại | Ngưỡng tối thiểu mỗi dải | Việc cần làm |
|---|---|---|---|---|
| Vocab | `level` (mới, từ `freqZipf` + CEFR thật) | không có `level`; `cefr` sai | L1–3: 400 · L4–6: 800 · L7–8: 800 · L9–10: 400 | thêm `level`, dùng ở V1 để chọn thẻ mới |
| Collocation | `bandTarget` → `level` | 7: 248 · 8: 465 · 9: 49 · **4–6: 0** | mỗi dải L1–3, L4–6, L7–8, L9–10 ≥ 120 | thêm 360 collocation band 4–6 (cụm thông dụng: *make a decision*, *take part in*) |
| Paraphrase | `level` 1–4 hiện là "độ xa ngữ nghĩa", L4 trùng `not_equivalent` | 320 | mỗi bậc ≥ 60; `not_equivalent` rải đều bậc 2–4 | tách "bậc" khỏi "có/không tương đương" (sửa lộ đáp án V3-1) |
| Dictation | `level` 1–10 | 1–6: 50/level · **7–10: 0** | 50/level (MVP+), 100/level (đầy đủ) | D2 |
| Episode | `difficulty` 1–10 | 2:1 · 3:2 · 4:4 · 5:5 · 6:5 · 7:5 · 8:7 · 9:3 · **1, 10: 0** | ≥ 2 mỗi level 1–10 cho mỗi Part có thể | thêm 4 episode L1, L10 |
| Passage | P1/P2/P3 | 8/8/8 | ≥ 6 mỗi P (đạt) | blind-solve (D4) |
| Task 2 / Task 1 | `difficulty` | gán máy móc theo dạng đề | mỗi dạng có đề ở ≥ 3 mức (dễ/vừa/khó) | gán lại theo độ trừu tượng của đề, không theo dạng |
| Speaking | `level` (mới) | không có | Part 3 phải có câu hỏi trừu tượng cho band 7+ | gắn `level` khi làm S1/S2 |

**Phủ chủ đề:** mỗi topic trong 25 topic ≥ 40 từ và ≥ 24 collocation (hiện sport 6/0, tourism 13/0, space 15/0, language 19/0, arts 23/0).

## 4. Chuẩn nguồn & bản quyền (bắt buộc cho mọi item mới hoặc sửa)

```jsonc
"provenance": {
  "source": "authored-llm" | "authored-human" | "wikipedia-ccbysa" | "theconversation-ccbynd" | "wordlist:<tên>",
  "createdBy": "llm:<model>@<ngày>" | "human:bang",
  "license": "own" | "CC BY-SA 4.0" | "CC BY-ND 4.0" | "<khác>",
  "attribution": "<tác giả, URL>"           // bắt buộc khi license CC BY*
},
"review": { "by": "<model khác hãng | human>", "date": "YYYY-MM-DD", "verdict": "pass" | "fix" | "reject" },
"rev": 1
```
- Không `review.verdict==="pass"` → không vào pool phát hành (`LUAT.md` C2).
- Item CC BY-SA/ND: footer bài đọc hiện ghi công; `public/data/ATTRIBUTION.md` liệt kê.
- Audio: `audioProvenance {engine, voice, license}` cho từng file.

## 5. Quy trình chất lượng định kỳ
1. Mỗi lần merge data: `npm run validate:data:release` + soi ngẫu nhiên 5 item/loại → `REVIEW_LOG.md` (đã có trong `docs/13` §3, chưa ai làm).
2. Nút "⚑ Báo item sai" trong FeedbackPanel (đã có) → `kv['flags']` → item bị ẩn khỏi pool → xuất JSON cho worker sửa.
3. Trước mỗi lần deploy công khai: `grep -ri "cambridge ielts\|official ielts" public/data` = 0.

## 6. Tiêu chí ĐẠT của mảng
- `validate:data:release` exit 0 (audio 100% cho mọi item trong pool hoạt động; blind-solve 100%).
- Soi mẫu 10% vocab và 15% collocation trap: lỗi < 5%.
- Bảng §3: mọi dải đạt ngưỡng tối thiểu.
- 0 item thiếu `provenance.source` + `review`; `#/credits` hiển thị đủ.
- Rubric `KIEM-THU.md` §3 "Độ tin cậy nội dung" ≥ 9.
