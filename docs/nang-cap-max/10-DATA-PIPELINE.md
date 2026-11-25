# 10 · DỮ LIỆU: đủ nhiều, chuẩn, hợp pháp, lấy bằng cách nào (ưu tiên số 1)

> Nguồn nghiên cứu: `nghien-cuu/R1-DATA-NGUON.md` (license đã kiểm từng nguồn), R4 (công cụ), R5/R6 (người học dùng gì).
> **Bang (25/11): dự án phi lợi nhuận → lấy thoải mái.** Áp dụng như sau:
> - Mọi nguồn **miễn phí** đều dùng được, **kể cả NC (phi thương mại) và SA**. Đây là mở rộng so với plan cũ, ghi `DECISIONS.md`.
> - Vẫn **không** được đưa vào app công khai: nội dung **giữ mọi quyền** (đề Cambridge, IELTS.org, ieltsonlinetests, sách). Phi lợi nhuận không làm việc đăng lại công khai thành hợp pháp. Đề thật vẫn luyện được qua **kho cá nhân trên máy** (§3 kênh D).

> **Cập nhật 25/11 · App dùng riêng cho Bang:** đề thật (Cambridge đã mua, sample IELTS.org, đề Bang làm ở web khác) được dùng qua **Gói riêng `.lexpack`**, chỉ nằm trên thiết bị của Bang, không vào repo/public. Xem `10b-GOI-RIENG-LOCAL.md`. File này lo phần **dữ liệu mở** (ship được) và quy trình chung.

## 0. Đủ nhiều chưa? (mục tiêu so với hiện có)

| Loại | Hiện có (sau plan cũ) | Mục tiêu nâng cấp | Vì sao con số này |
|---|---|---|---|
| Từ vựng (lemma có level + IPA + gloss Việt) | 2.207 | **≥ 12.000** (NGSL 2,8k + NAWL 1k + CEFR-J ~7,8k + C1/C2) | Đọc band 8 cần 8–9k word family (Nation) |
| Collocation | ~760 | **≥ 4.000** (≥ 2 mỗi từ band ≥ 6) | LR band 8 "collocation" |
| Câu ví dụ / câu học (có nguồn) | ~2.200 | **≥ 20.000** | Thẻ câu-cloze, dictation, Second-encounter |
| Reading passage | 24 | **≥ 90** luyện + 24 mock | Không lặp trong 14 ngày, 3 dải band × 3 Part |
| Câu hỏi Reading | ~330 | **≥ 1.400** (11 dạng × ≥ 30 + trong passage) | Đủ để interleave và đo theo dạng |
| Listening episode | 32 | **≥ 90** luyện + 32 mock | Đủ 4 Part × giọng × độ khó |
| Dictation | 700 câu | **≥ 2.000** (thêm câu từ Tatoeba/VOA, L7–10 đủ) | Ladder 10 bậc × giọng |
| Clip người thật | ~0 | **≥ 3.000** | Làm quen giọng thật, không chỉ TTS |
| Task 1 | ~25 | **≥ 56** (7 dạng × 8) | Overview Forge |
| Task 2 | ~50 | **≥ 60** (5 dạng × 12) + Idea Bank 12 chủ đề | Plan Gate, Idea Bank |
| Speaking | P1/P2/P3 rotation 2026-Q3 | **P1 160 câu, P2 60 cue card, P3 240 câu**, cập nhật quý | Chống học thuộc, biến thể |
| Mock đầy đủ | 2 ExamTest | **8 L/R + 4 W + 4 S** (dành riêng) | Band Gate cần 2 mock liên tiếp |
| Anchor chấm (bài có điểm) | 0 | **≥ 60 Writing + ≥ 20 Speaking** | Hiệu chỉnh MAE ≤ 0,5 |

## 1. Chuẩn là gì (cổng chất lượng mọi lô)
1. **Đúng format IELTS** theo `specs/` (`11` §1): độ dài, số câu, giới hạn từ, phân bố dạng câu, giọng.
2. **Đáp án bảo vệ được:** blind-solve bởi model **khác hãng** khớp 100%; TFNG qua thêm bộ kiểm NLI; Listening qua whisper.cpp (WER ≤ 8%) và kiểm timestamp.
3. **Ngôn ngữ đúng band:** độ phủ từ đo bằng lexicon v2 (≥ 95% từ ở band mục tiêu, ≤ 5% ngoài band); textstat/LexicalRichness trong khoảng của band.
4. **Văn phong không máy móc:** cấm danh sách cụm khuôn (`writing/cliches.json` + danh sách mới); bài mẫu qua checklist band 8 (mỗi luận điểm có ví dụ cụ thể, không over-generalise).
5. **Nguồn ghi đủ:** `provenance{source, createdBy, license, attribution, url}` + `review{by, date, verdict}` + `rev`.
6. **Soi mẫu** do người hoặc agent thứ ba: 10% mỗi lô; lỗi < 5%; ghi `REVIEW_LOG.md`.

## 2. Nguồn dùng được (xếp theo giá trị; license chi tiết ở R1)

**Kênh A · Nguồn mở dùng tự do (ship được, ghi công)**
| Nguồn | Lấy gì | License | Ghi chú |
|---|---|---|---|
| NGSL 1.2, NAWL 1.2, NGSL-Spoken, BSL, TSL | Danh sách từ phổ thông/học thuật/nói/kinh tế | CC BY-SA 4.0 | Xương sống, thay AWL |
| CEFR-J 1.6 + Octanove C1/C2 | Nhãn CEFR A1–C2 | trích dẫn Tono Lab / CC BY-SA | C1/C2 = vùng 7–8 |
| kaikki.org EN Wiktionary | Định nghĩa, IPA UK/US, ví dụ, dạng từ, register, đồng/trái nghĩa | CC BY-SA + GFDL | Lọc ~15k từ mục tiêu |
| kaikki.org viwiktionary | Gloss Anh→Việt (190.917 nghĩa) | CC BY-SA | Lọc nghĩa cổ |
| Open English WordNet 2025 | Synset, đồng nghĩa cho Paraphrase | CC BY 4.0 | |
| ipa-dict en_UK, CMUdict | IPA RP, trọng âm, âm tiết | MIT / BSD | |
| Word Atlas | 7.298 từ IELTS + collocation + audio UK | CC BY 4.0 (nội dung AI) | **QA bắt buộc** |
| wordfreq | Zipf | CC BY-SA (dữ liệu) | Đóng băng 2021, vẫn đủ |
| Tatoeba | Câu ví dụ, cặp Anh–Việt | CC0 / CC BY 2.0 FR | Ưu tiên CC0 |
| VOA Learning English | Bài + MP3 + transcript | Public domain (trừ AP/Reuters/AFP) | Giọng Mỹ, chậm |
| eLife Digest, PLOS Author Summary | Văn bản học thuật phổ thông | CC BY 4.0 | Nguồn passage tốt nhất |
| Wikipedia / Simple Wikipedia | Sự kiện cho passage | CC BY-SA 4.0 | Passage dẫn xuất giữ SA |
| Project Gutenberg | Văn bản cổ (Darwin, Mill…) cho Y/N/NG quan điểm | PD | Bỏ nhãn PG |
| Our World in Data | Số liệu Task 1 | CC BY (dữ liệu của chính OWID) | Kiểm license bên thứ ba |
| LibriSpeech, LibriVox, VCTK, People's Speech, Lingua Libre | Clip người thật nhiều giọng | CC BY / PD / CC0 | Chọn clip, ghi công từng file |
| Kokoro-82M, Piper en_GB (vctk, alba, aru, cori…), MeloTTS EN-AU | TTS đa giọng UK/Úc | Apache / CC BY theo voice / MIT | Tránh semaine (NC-SA, không cần) |
| speechocean762 | Thang chấm phát âm | CC BY 4.0 | Chỉ số liệu dẫn xuất |
| ELLIPSE, PERSUADE 2.0 | Bài viết có điểm phân tích | CC BY 4.0 | Anchor tương đối cho chấm |
| FEVER, SQuAD, BoolQ, SNLI/MNLI | Mẫu sinh/kiểm TFNG, câu hỏi | CC BY-SA | Few-shot, kiểm "đúng 1 đáp án" |
| irfanhossainsust/ielts-style-reading-passage3 | 1.051 passage P3 + 14.188 câu có giải thích | MIT (do Claude sinh) | Seed; **fact-check** |

**Kênh B · Nguồn phi thương mại hoặc không-sửa (mở khoá nhờ phi lợi nhuận; mới so với plan cũ)**
| Nguồn | Lấy gì | License | Cách dùng hợp lệ |
|---|---|---|---|
| **TED / TED-LIUM 3** (2.351 talk, 452 giờ) | Bài giảng thật = **Listening Part 4** | CC BY-NC-ND | Dùng **nguyên văn** đoạn clip + transcript, không sửa; **câu hỏi do mình viết** đi kèm (tác phẩm riêng). Ghi công TED |
| **The Conversation** | Bài học thuật phổ thông = **Reading P2/P3** | CC BY-ND 4.0 | Đăng **nguyên văn đầy đủ** (không cắt, không sửa) + link + ghi công; câu hỏi mình viết tách riêng. Bài quá dài thì không dùng (cắt = sửa) |
| OpenStax (nay NC-SA) | Văn bản giáo trình (sinh học, tâm lý, kinh tế) | CC BY-NC-SA | Viết lại thành passage, giữ NC-SA |
| CLEAR corpus | 5.000 đoạn + điểm độ khó | CC BY-NC-SA | Hiệu chỉnh công thức độ khó |
| JFLEG | Câu sửa cho trôi chảy | CC BY-NC-SA | Mini-game "Nâng câu" |
| L2-ARCTIC (có 4 người Việt) | Lỗi phát âm người Việt | CC BY-NC | Danh sách minimal pair |
| Duolingo HLR, SLAM, EdNet | Log học | CC BY-NC | Prior độ khó từ/item (số liệu dẫn xuất) |
| W&I+LOCNESS, FCE (BEA-2019) | Bài có chú thích lỗi | NC | Benchmark offline cho Harper/Claude; không ship nguyên văn |
| F5-TTS weights, OmniVoice | TTS clone giọng | CC BY-NC | Tạo giọng Úc/NZ thứ hai từ mẫu **có sự đồng ý** (tự ghi âm/CC0) |

**Kênh C · Tự soạn bằng LLM từ sự kiện (vô hạn, hợp pháp, đúng điểm yếu)**
- Quy trình 8 bước (`antigravity/07` §1, `11` §2): spec → dữ kiện từ kênh A/B → model A soạn → model B **khác hãng** kiểm (đáp án, sự thật, không chép nguyên văn) → blind-solve → soi mẫu → ghi nhãn "đề luyện tập gốc".
- Dùng cho mọi dạng câu, đặc biệt dạng ít nguồn mở (Matching features, Flow-chart, Map labelling, Process).

**Kênh D · Kho đề cá nhân trên máy (cách hợp pháp để luyện ĐỀ THẬT)**
- Tính năng **"Nhập đề của tôi"**. Người học tự nhập đề mình **có quyền dùng cá nhân** vào IndexedDB trên máy:
  - bộ Cambridge IELTS đã mua (gõ hoặc dán đáp án, gắn file audio của chính mình);
  - đề làm trên ieltsonlinetests/BC/IDP (nhập **kết quả và câu sai**, không nhập nguyên đề);
  - bài Writing đã được giáo viên chấm.
- App cung cấp: khung đề (spec), bộ chấm, Mổ đề, Trap Log, Error Boss, thẻ FSRS từ câu sai.
- **Không có gì trong số này vào repo, bản build hay sao lưu công khai.** Dữ liệu cá nhân như Anki deck riêng. Ghi rõ trên UI: "chỉ lưu trên máy bạn".
- Đây là cách dùng được "đề mới nhất" mà Bang luyện ở nơi khác, đúng phương pháp "chữa kỹ hơn làm nhiều" (R6 §I).

**Kênh E · Dẫn link (không sao chép)**
- Familiarisation test thi máy (BC/IDP), sample IELTS.org, IELTS Ready, DOL Tự học, kênh YouTube (IELTS Advantage, Keith O'Hare/IELTS Daily, IELTS ASMR).
- App mở tab ngoài, khi người học quay lại thì nhập kết quả (kênh D).

**Kênh F · Dữ liệu của chính người học**
- Mọi lượt trả lời, lỗi Writing/Speaking, bản ghi âm là dữ liệu cá nhân hoá:
  - FSRS optimizer;
  - Elo kỹ năng con;
  - Error Boss;
  - anchor chấm bằng bài có điểm thi thật (khi Bang thi).

**Kênh G · Xu hướng đề (chỉ nhãn chủ đề)**
- Lấy nhãn chủ đề từ forecast Speaking mỗi quý (IELTS Bro, IELTS Fighter, ielts-mentor…) và đề Writing được thí sinh nhắc trên MXH (`03`).
- Chỉ lưu **nhãn chủ đề + quý**. Câu hỏi do mình soạn lại theo chủ đề.

**Không dùng** (giữ nguyên R1 "Không dùng / cấm"):
- Đề Cambridge/IELTS.org/IDP/BC/ieltsonlinetests trong app công khai.
- Repo GitHub chứa đề Cambridge (hefengxian/my-ielts, zeeklog/IELTS, EthanLin-TWer/ielts).
- mini-ielts "Recent Actual Tests".
- Dataset IELTS crawl Writing9.
- Pearson ACL (cấm TDM), Write & Improve 2024 / Speak & Improve 2025 (cấm chia sẻ, giới hạn LLM).
- Oxford 3000/5000 và EVP: chỉ tra tay.
- Cào dữ liệu trái điều khoản của trang (ToS): không cào ieltsonlinetests, Writing9, Facebook.

## 3. Brainstorm thêm cách lấy (đã lọc theo khả thi)
1. **TED theo chủ đề IELTS:** lọc talk 4–8 phút theo 25 chủ đề → cắt đúng đoạn hoàn chỉnh (không sửa lời) → câu hỏi Part 4 do mình viết. Nguồn bài giảng thật duy nhất có quy mô lớn.
2. **Podcast có license mở:** lọc trên Internet Archive, Free Music Archive theo CC BY; các chương trình đại học công khai CC BY. Lưu từng tập kèm license.
3. **Video YouTube gắn nhãn CC BY** (bộ lọc "Creative Commons" của YouTube): bài giảng, phỏng vấn → Listening Part 3/4. Tải bằng công cụ hợp lệ, ghi công.
4. **Hội thoại Part 1/3:** tự viết kịch bản rồi TTS 2 giọng khác giới, khác vùng. Thêm "lỗi nói" tự nhiên (ngập ngừng, tự sửa) để tạo bẫy đổi ý thật.
5. **Task 1 process/map:** tự vẽ SVG từ mô tả quy trình trong Wikipedia/OpenStax (sản xuất giấy, tái chế…), 7 dạng.
6. **Reading lịch sử/khảo cổ:** Wikipedia "Featured articles" làm nguồn sự kiện, viết lại theo khung "bối cảnh → khám phá → tranh luận → ý nghĩa".
7. **Ngân hàng lỗi người Việt:** từ L2-ARCTIC (phát âm), W&I/FCE (thống kê loại lỗi), bài viết của chính Bang (kênh F) → câu sai mô phỏng để sửa.
8. **Dữ liệu IOE-style cho khởi động:** sinh hàng nghìn câu ngắn 1 thao tác (chọn từ đúng, sửa 1 lỗi) từ Tatoeba + lexicon, dùng cho Daily Run khởi động 2 phút.
9. **Tạo biến thể vô hạn:**
   - mỗi passage sinh 2–3 bộ câu hỏi khác nhau;
   - mỗi câu Speaking sinh 3 cách hỏi;
   - mỗi đề Task 2 sinh 2 dạng (agree/disagree ↔ discuss).
   → "Làm lại" không lặp nguyên văn.
10. **Mua hợp pháp nếu Bang muốn:** sách Cambridge IELTS 18–21 (bản giấy hoặc ebook). Dùng qua kênh D. **Phải hỏi Bang** vì tốn tiền.

## 4. Pipeline `scripts/data2/` (Python, venv cục bộ)
```
scripts/data2/
  sources/        tải về theo REGISTER (script tải + sha256, không commit file thô lớn: để data-src/raw/ đã gitignore)
  lexicon/        NC1-A: 10_load_lists.py → 20_lemmatize.py → 30_assign_level.py → 40_export.py
  enrich/         NC1-B: kaikki → vi gloss → ipa → oewn → word_atlas → qa
  sentences/      NC1-C: tatoeba/voa/lingualibre → cefr_sentence → export
  reading/ listening/ writing/ speaking/ mock/   NC2-B..F: spec → facts → draft (LLM) → verify (LLM khác hãng) → blind → export
  calib/          NC3-B: anchors → chấm → fit isotonic → export bảng hiệu chỉnh
  qa/             coverage.py, readability.py, whisper_qa.py, nli_tfng.py, cliche_scan.py, license_check.py
  REGISTER sync:  license_check.py so mọi item với data-src/licenses/REGISTER.md (thiếu → fail)
```
- Đầu ra: `public/data/v2/**` (minify), file lõi nhỏ + file chi tiết tải lười (theo D17 của plan cũ).
- Mỗi file dữ liệu SA ghi license trong `public/data/v2/LICENSES.md` và trong màn Credits.
- Validator: mở rộng `scripts/validate` bằng bộ kiểm v2 (spec, coverage, provenance, license). **AD** sửa ngưỡng, theo luật Q4 cũ.

## 5. Audio
- **Mục tiêu giọng** (theo đề thật):
  - UK RP ~45%;
  - UK vùng (Scotland, Bắc Anh, Liverpool) ~15%;
  - Úc/NZ ~20%;
  - Bắc Mỹ ~20%.
- **Engine:**
  - Kokoro bf_emma (B-), af_heart (A): giọng chính;
  - Piper vctk-medium (109 giọng UK), alba, aru, northern_english_male, southern_english_female: giọng vùng;
  - MeloTTS EN-AU: giọng Úc (chạy Docker/WSL);
  - F5/Chatterbox clone từ mẫu có sự đồng ý nếu cần giọng Úc thứ hai.
- **QA:** whisper.cpp transcribe lại → WER ≤ 8%, sai thì render lại. Kokoro trả timestamp từng từ, dùng cho karaoke/dictation.
- **Ngân sách:** tổng `public/audio` ≤ **400 MB** (hiện ~87 MB). Vượt thì **hỏi Bang** (luật cũ). Phương án vượt ngưỡng: gói audio tải theo unit, không đưa vào build.

## 6. Độ phủ và độ khó (đo tự động)
- `coverage.py`: % token passage nằm trong lexicon band ≤ mục tiêu. Luyện ≥ 95%; Graded Input ≥ 98%.
- `readability.py`: FK grade, Dale-Chall, MTLD; khoảng cho từng band hiệu chỉnh bằng CLEAR + OneStopEnglish (số liệu dẫn xuất).
- Độ khó item: prior từ đặc trưng (Zipf, độ dài, dạng câu, loại bẫy, tốc độ nói), cập nhật Elo theo lượt làm (`18`).
