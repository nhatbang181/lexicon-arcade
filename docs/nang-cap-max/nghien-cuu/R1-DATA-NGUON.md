# R1 — Nguồn dữ liệu cho Lexicon Arcade V3 (IELTS 6.0 → 8.0)

Ngày kiểm: 2026-11-25. Phương pháp: mở trực tiếp trang gốc (GitHub API / raw LICENSE / README, HuggingFace API + dataset card, trang chủ dự án, Dataverse API, Wikimedia Commons API). Cái nào không mở được trang gốc thì ghi **(CHƯA KIỂM)**.

Giả định của app: phát hành công khai trên static host, miễn phí, **không thương mại** (không quảng cáo, không thu phí). Nếu sau này có quảng cáo / donate-gated / bán gói thì mọi nguồn có NC phải xét lại.

Quy ước cột "Ship trong app?":
- **Có**: được đóng gói nguyên văn hoặc đã sửa vào bundle/IndexedDB seed (kèm ghi công đúng license).
- **Có (SA)**: được ship, nhưng phần dữ liệu dẫn xuất phải phát hành cùng license CC BY-SA (để trong `/data/LICENSE-*.md` + trang Credits). Không ảnh hưởng license code của app nếu tách file dữ liệu.
- **Có (NC)**: chỉ hợp lệ khi app vẫn phi thương mại.
- **Chỉ số liệu dẫn xuất**: chỉ dùng offline để tính thống kê / hiệu chỉnh / đánh giá; không ship văn bản/âm thanh gốc.
- **Không**: không ship, không đưa vào pipeline sinh nội dung.

---

## 1. Từ vựng (frequency / level / từ điển / IPA / ví dụ / collocation / gloss Việt / audio)

| Nguồn | URL | License (đã kiểm) | Quy mô | Dùng để | Ship trong app? | Rủi ro |
|---|---|---|---|---|---|---|
| NGSL 1.2 (New General Service List) | https://www.newgeneralservicelist.com/new-general-service-list | CC BY-SA 4.0 (trang chủ ghi "Word lists released under Creative Commons"; bài "NGSL Wordlist Update" và trang NAWL ghi rõ CC BY-SA 4.0). Bản 1.2 ra 04/2023 | 2.809 từ (trang chủ) | Lớp nền "từ phổ thông" để loại khỏi deck 8.0, xác định độ phủ văn bản | Có (SA) | Thấp. Phải ghi công Browne, Culligan, Phillips |
| NAWL 1.2 (New Academic Word List) | https://www.newgeneralservicelist.com/new-academic-word-list | CC BY-SA 4.0 (trích nguyên văn trang NAWL) | 957 từ | Thay AWL làm xương sống deck học thuật | Có (SA) | Thấp. Tốt hơn AWL về license |
| Danh sách khác cùng nhà (TSL, BSL, NGSL-Spoken) | https://www.newgeneralservicelist.com/ | "Released under Creative Commons" (NGSL-Spoken ghi CC BY-SA) | TSL 1.250 từ; số từ BSL/Spoken (CHƯA KIỂM) | BSL (Business) cho chủ đề kinh tế; Spoken cho Speaking | Có (SA) | Version license từng list chưa ghi riêng (CHƯA KIỂM chi tiết) |
| AWL — Coxhead 2000 | https://www.wgtn.ac.nz/lals/resources/academicwordlist | Không tìm thấy license công khai; trang wgtn trả 403 khi tải. Tiền lệ: tác giả khác phải xin phép Coxhead để in lại | 570 word families, 10 sublists (theo bài báo gốc; trang không mở được) | Chỉ đối chiếu | Không (dùng NAWL thay) | Coi như "giữ mọi quyền" (CHƯA KIỂM điều khoản) |
| CEFR-J Wordlist 1.6 (Tono Lab, TUFS) | https://www.cefr-j.org/download.html | "Can be used for both research and commercial purposes with a proper acknowledgement of the source"; được sửa nhưng phải trích dẫn. Bản quyền thuộc Tono Lab. Bản mirror 1.5 trên GitHub: openlanguageprofiles/olp-en-cefrj | ~7.800 mục A1–B2 (CHƯA KIỂM con số chính xác) | Gán nhãn CEFR A1–B2 cho mọi từ | Có (kèm trích dẫn) | Trang không nói rõ việc phân phối lại; tư vấn thương mại thì phải hỏi. Rủi ro thấp với app phi thương mại |
| Octanove Vocabulary Profile C1/C2 1.0 | https://github.com/openlanguageprofiles/olp-en-cefrj | CC BY-SA 4.0 (README) | danh sách C1/C2 (CHƯA KIỂM số lượng) | Nhãn C1/C2 → đúng vùng 7.0–8.0 | Có (SA) | Thấp |
| Oxford 3000 / 5000 (OUP) | https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000 | Không có license mở. Trang chỉ nói người học có thể "browse… and download" để học; trang FAQ trả 403 | 3.000 / 5.000 từ + CEFR | Chỉ đối chiếu cá nhân | Không | Bản quyền OUP. Repo GitHub chép lại (ittuann/The-Oxford-5000-Word-Lists) không có giấy phép của OUP |
| English Vocabulary Profile (Cambridge) | https://englishprofile.org/ | Không đọc được ToS (trang là app JS; /wordlists/evp trả 404) (CHƯA KIỂM). Nguồn thứ cấp: miễn phí, phải đăng ký, chỉ dùng phi thương mại | ~6.700 mục A1–C2 (CHƯA KIỂM) | Tra tay để kiểm nghĩa theo cấp độ | Không | Cambridge giữ bản quyền; không được cào/phân phối lại |
| SUBTLEX-US | https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus | Mâu thuẫn: file license LexOPS ghi CC BY-NC-ND 3.0; NOTICE của wordfreq ghi tác giả cho phép qua email "for any purpose". Trang Ghent không đọc được (CHƯA KIỂM) | ~74k từ, Zipf | Tần suất khẩu ngữ (Speaking/Listening) | Không trực tiếp; lấy qua wordfreq | Dùng wordfreq để có sẵn quyền phân phối |
| wordfreq (rspeer) | https://github.com/rspeer/wordfreq | Code Apache-2.0; dữ liệu có phần CC BY-SA 4.0 (README). **Đã đóng băng**: SUNSET.md (2024) nói dữ liệu dừng ở 2021 và sẽ không cập nhật vì văn bản sinh bởi AI làm bẩn dữ liệu. 1.773★, push 2025-01-04 | Zipf cho hàng trăm nghìn từ tiếng Anh | Tính Zipf → độ khó từ, chọn distractor cùng tần suất | Có (SA) — xuất bảng Zipf thu gọn kèm credit | README nói rõ xuất CSV mà không ghi credit là vi phạm CC BY-SA |
| COCA / wordfrequency.info / AVL (Gardner & Davies) | https://www.wordfrequency.info/ , https://www.academicvocabulary.info/ | AVL "completely free" để tải (trang AVL) nhưng không có điều khoản phân phối lại/dùng trong app. Dữ liệu COCA đầy đủ là thương mại (CHƯA KIỂM chi tiết) | AVL 3.000 lemma; COCA top 5k/60k | Đối chiếu | Không (chỉ số liệu dẫn xuất nội bộ) | Không có license mở |
| kaikki.org — English Wiktionary (wiktextract) | https://kaikki.org/dictionary/rawdata.html | Dữ liệu từ Wiktionary: dual **CC BY-SA 4.0 + GFDL** (trang Wiktionary:Copyrights). Trang kaikki không ghi license, chỉ xin trích dẫn Tatu Ylonen. Code wiktextract: MIT | JSONL 24,8 GB (2,9 GB .gz); dump enwiktionary 2026-10-01, trích 2026-10-30; cập nhật hằng tuần | Định nghĩa, IPA UK/US, ví dụ, từ đồng/trái nghĩa, dạng từ, nhãn (formal/informal), **translations → tiếng Việt** | Có (SA) — chỉ lọc tập con (~10–15k từ mục tiêu) | Chất lượng ví dụ không đều; phải ghi nguồn + link |
| kaikki.org — **Vietnamese Wiktionary** (viwiktionary) | https://kaikki.org/viwiktionary/ | Wiktionary → CC BY-SA (+GFDL) | "Tiếng Anh (190.917 senses)" có gloss tiếng Việt; JSONL 273 MB (32,8 MB .gz); dump 2026-10-02 | **Gloss Anh→Việt** có license dùng được | Có (SA) | Phần lớn mục tiếng Anh trên vi.wiktionary có vẻ được bot nhập từ từ điển cũ (nghi là FVDP/Hồ Ngọc Đức, GPL) (CHƯA KIỂM): nghĩa cổ, thiếu nghĩa học thuật → cần lọc |
| OVDP / Free Vietnamese Dictionary Project | https://sourceforge.net/projects/ovdp/ | SourceForge ghi GPLv2. Từng database có thể có license riêng (file 00-database-info) (CHƯA KIỂM) | ~100k mục (CHƯA KIỂM) | Dự phòng cho gloss Việt | Có thể (GPL, file dữ liệu tách riêng + nguồn) | Dữ liệu cũ (~2004); copyleft GPL trên dữ liệu khá khó xử lý → ưu tiên viwiktionary |
| Open English WordNet 2025 | https://github.com/globalwordnet/english-wordnet , https://en-word.net/ | **CC BY 4.0** + điều khoản Princeton WordNet (LICENSE.md). 924★, push 2026-11-13 | Bản 2025 (phát hành 31/12/2025), có JSON; ~120k synset (CHƯA KIỂM số) | Từ đồng nghĩa / hypernym cho mode Paraphrase; kiểm đáp án paraphrase | Có | Thấp. Ghi công Princeton + OEWN |
| CMUdict | https://github.com/cmusphinx/cmudict | Kiểu BSD-2 (Copyright CMU, cho phép phân phối lại nếu giữ notice) | ~135k từ, ARPAbet, giọng Mỹ (CHƯA KIỂM số) | Trọng âm, đếm âm tiết, map phoneme cho chấm phát âm | Có | Chỉ giọng Mỹ |
| ipa-dict (en_UK RP, en_US GA) | https://github.com/open-dict-data/ipa-dict | **MIT** (LICENSE). 827★ | en_UK: 65.119 dòng (đã đếm) | Hiển thị IPA giọng Anh (RP) cho thẻ từ | Có | IPA sinh tự động, có lỗi lẻ tẻ; nguồn gốc dữ liệu en_UK không ghi trong README (CHƯA KIỂM) |
| Tatoeba | https://tatoeba.org/en/downloads | Câu: **CC BY 2.0 FR**; có export **CC0 1.0** cho một phần câu (có tiếng Anh). Audio: license theo từng người đóng góp; "nếu trống thì không được dùng ngoài Tatoeba" | >1,9 triệu câu tiếng Anh (CHƯA KIỂM số) | Câu ví dụ, dictation, cặp câu Anh–Việt | Có (ưu tiên tập CC0; CC BY phải ghi công từng câu) | Chất lượng/văn phong không đều; cần lọc theo độ dài + CEFR |
| Academic Collocation List (Ackermann & Chen 2013, Pearson) | https://www.pearsonpte.com/research/Pages/CollocationList.aspx | **Không có license mở.** Footer: "All rights reserved, including those for text and data mining and training of artificial intelligence" | 2.469 collocation (PDF + xlsx) | Chỉ đọc tay để tham khảo | **Không** | Cấm khai thác văn bản/dữ liệu (TDM); đừng cào, đừng đưa vào LLM để sinh lại |
| Word Atlas (designfuchen/word-atlas) | https://github.com/designfuchen/word-atlas | Code MIT; **nội dung CC BY 4.0** (CONTENT_LICENSE.md): danh sách từ, nghĩa, ví dụ, collocation, word family, đồng/trái nghĩa, CEFR, tranh minh hoạ, **audio UK/US**. 5.282★, push 2026-11-13 | 7.298 từ IELTS, audio UK (ElevenLabs "Alice") + US ("Sarah") | Bộ seed deck IELTS gồm sẵn collocation + audio UK | Có (ghi "Word Atlas contributors — CC BY 4.0") | Nội dung **do AI sinh, không duyệt tay từng mục** (họ tự ghi); giải thích bằng tiếng Trung → phải lấy phần tiếng Anh; license audio chỉ "to the extent of rights the maintainers can grant" (phụ thuộc ToS ElevenLabs) |
| ECDICT (skywind3000) | https://github.com/skywind3000/ECDICT | Ghi MIT. 8.664★ | ~770k mục Anh–Trung; cột collins/oxford/tag/bnc/frq | Đối chiếu thứ hạng BNC/COCA | Chỉ số liệu dẫn xuất (cẩn trọng) | Nguồn gốc dữ liệu hỗn hợp (sao từ Collins/Oxford/COCA) → license MIT đáng nghi |
| Lingua Libre (Wikimedia Commons) | https://commons.wikimedia.org/wiki/Category:Lingua_Libre_pronunciation-eng | Theo từng file; mẫu 5 file: 4 file CC0, 1 file CC BY-SA 4.0 (Commons API) | **110.802 file** phát âm tiếng Anh (Commons API) | Audio phát âm người thật (đủ giọng) cho từ khó | Có (lọc CC0/CC BY-SA, giữ credit từng file) | Không rõ giọng vùng nào; site lingualibre.org đã chuyển sang archive.lingualibre.org (không truy cập được) |

## 2. Reading (văn bản nguồn, độ khó, sinh câu hỏi)

| Nguồn | URL | License (đã kiểm) | Quy mô | Dùng để | Ship trong app? | Rủi ro |
|---|---|---|---|---|---|---|
| Wikipedia / Simple English Wikipedia | https://en.wikipedia.org/wiki/Wikipedia:Copyrights | **CC BY-SA 4.0** (+GFDL trừ khi ghi khác). Phải ghi công (link/URL) và ghi rõ "đã sửa"; bản sửa phải CC BY-SA 4.0 | Hàng triệu bài | Nguồn sự kiện để viết lại thành passage IELTS (khoa học, lịch sử, xã hội) | Có (SA) — passage dẫn xuất + câu hỏi đi kèm phát hành CC BY-SA | Văn Wikipedia khô, khác giọng IELTS → cần LLM viết lại; vẫn là bản dẫn xuất nên giữ SA |
| PLOS (ONE, Biology…) | https://journals.plos.org/plosone/s/licenses-and-copyright | **CC BY 4.0**; nội dung bên thứ ba cũng phải tương thích CC BY | >300k bài (CHƯA KIỂM) | Phần "Author summary" ≈ văn phong IELTS Reading; số liệu cho Writing Task 1 | Có | Văn chuyên ngành sâu; phải ghi trích dẫn |
| eLife (bài + **eLife Digest**) | https://elifesciences.org/terms | **CC BY 4.0** "unless otherwise indicated" | Hàng nghìn digest (CHƯA KIỂM) | Digest phổ thông ~400–600 từ: rất hợp làm passage 1–2 | Có | Kiểm từng mục xem có ghi chú ngoại lệ không |
| OpenStax | https://help.openstax.org/s/article/Commercial-use-under-the-Creative-Commons-License | **Đã đổi**: hiện "publishes its books under CC BY-NC-SA". Trước đây phần lớn là CC BY (Wikipedia/OpenStax). Bài "An update on OpenStax licensing" chưa đọc được (CHƯA KIỂM ngày đổi) | ~70 giáo trình | Văn bản học thuật chuẩn (sinh học, tâm lý, kinh tế…) | Có (NC + SA) | Bản tải trước khi đổi vẫn giữ CC BY (CC không thu hồi được) nhưng phải chứng minh được bản/ngày → coi như NC-SA |
| Project Gutenberg | https://www.gutenberg.org/policy/permission.html | Phần lớn là public domain tại Mỹ; "Project Gutenberg" là nhãn hiệu → bỏ toàn bộ header/license PG khi tái sử dụng. Trang license trả 503 (kiểm qua search) | ~75k sách | Văn bản thế kỷ 19 (Darwin, Mill…) cho câu hỏi Yes/No/Not Given dạng quan điểm | Có (sau khi bỏ dấu PG) | Ngôn ngữ cổ, khác IELTS; PD ở Mỹ chưa chắc PD ở VN (thường vẫn ổn vì tác giả mất >50–70 năm) |
| VOA Learning English | https://learningenglish.voanews.com/p/6861.html | "Learning English texts, MP3s, photos and videos are in the **public domain**… reprint for educational and commercial purposes, with credit"; **trừ** nội dung AP/Reuters/AFP | Hàng nghìn bài + MP3 + transcript | Reading dễ–trung bình; dùng chéo cho Listening | Có (credit learningenglish.voanews.com) | Lọc bỏ bài có ảnh/văn bản hãng tin; giọng Mỹ, tốc độ chậm (<IELTS) |
| The Conversation | https://theconversation.com/republishing-guidelines | **CC BY-ND 4.0**; "You can't edit our material"; dịch hay sửa lớn phải được tác giả duyệt | Rất nhiều bài báo học thuật phổ thông | — | **Không** (ND chặn việc cắt/viết lại thành passage) | Chỉ link ra ngoài |
| CLEAR corpus (CommonLit) | https://github.com/scrosseye/CLEAR-Corpus | **CC BY-NC-SA 4.0** (README) | ~5.000 đoạn trích, điểm readability do giáo viên chấm (lớp 3–12) | Huấn luyện/hiệu chỉnh công thức độ khó passage (BT-easiness) | Chỉ số liệu dẫn xuất (ship đoạn trích được theo NC-SA nhưng không cần) | Thang lớp 3–12 Mỹ, không phải IELTS → chỉ dùng tương đối |
| OneStopEnglish corpus | https://github.com/nishkalavallabhi/OneStopEnglishCorpus | Repo ghi **CC BY-SA 4.0**. 75★ | 189 bài × 3 cấp độ (CHƯA KIỂM số từ README) | Cặp văn bản cùng nội dung ở 3 cấp → học mô hình "nâng/hạ độ khó" passage | Chỉ số liệu dẫn xuất (khuyên) | Bài gốc từ Guardian/Macmillan; quyền thượng nguồn không rõ dù repo ghi CC BY-SA |
| CEFR-SP (Arase et al. 2022) | https://github.com/yukiar/CEFR-SP | Theo nguồn: phần Wiki-Auto **CC BY-SA 3.0**; SCoRE **CC BY-NC-SA 4.0**; Newsela-Auto phải xin Newsela | 17k câu gán CEFR bởi chuyên gia | Chấm CEFR cấp câu → lọc câu ví dụ / kiểm độ khó passage | Có (phần Wiki-Auto, SA); phần SCoRE: NC-SA | Đừng đụng phần Newsela |
| RACE | https://huggingface.co/datasets/ehovy/race | "available for **non-commercial research purpose only**"; passage lấy từ Internet, CMU không sở hữu | ~28k passage, ~100k câu hỏi | Tham khảo cách ra distractor | **Không** | Quyền thượng nguồn không rõ (đề thi Trung Quốc) |
| Newsela corpus | https://newsela.com/legal/data | Phải ký **NDA** sau khi được duyệt dự án | — | — | **Không** | NDA |
| FEVER | https://fever.ai/dataset/fever.html | Chú thích theo license Wikipedia, dự phòng **CC BY-SA 3.0** (trang license); HF tag cc-by-sa-3.0 + gpl-3.0 | 185.445 claim: SUPPORTS / REFUTES / NOT ENOUGH INFO | Mẫu sinh câu **True/False/Not Given**: NEI ≈ NG; học cách "đổi một chi tiết" để tạo False | Có (SA) nếu ship claim; thực tế chỉ dùng làm few-shot | Claim gắn với câu Wikipedia, ngắn hơn câu IELTS |
| SQuAD 1.1 / 2.0 | https://huggingface.co/datasets/rajpurkar/squad | **CC BY-SA 4.0** (HF tag) | ~100k / 150k câu hỏi | Sentence completion / short answer (SQuAD 2.0 có câu không trả lời được ≈ NG) | Có (SA) | Dạng extractive, dễ hơn IELTS |
| BoolQ | https://huggingface.co/datasets/google/boolq | **CC BY-SA 3.0** (HF tag) | ~16k câu hỏi yes/no | Mẫu cho câu Yes/No | Có (SA) | Không có nhãn NG |
| MultiNLI / SNLI | https://huggingface.co/datasets/nyu-mll/multi_nli | MNLI: nhiều license (cc-by-3.0, cc-by-sa-3.0, mit, other); SNLI: CC BY-SA 4.0 | 433k / 570k cặp câu | entailment/contradiction/neutral ≈ T/F/NG → **train hoặc kiểm tra bộ kiểm TFNG** | Chỉ số liệu dẫn xuất | Câu ngắn; ANLI là CC BY-NC (tránh) |
| irfanhossainsust/ielts-style-reading-passage3 | https://huggingface.co/datasets/irfanhossainsust/ielts-style-reading-passage3 | **MIT** (card) | 1.051 bài Passage 3 (800–950 từ), 14.188 câu hỏi có đáp án + trích dẫn bằng chứng + giải thích | Bộ seed reading có sẵn; mẫu JSON schema | Có | **Do Claude sinh**, "background facts… not fact-checked" → phải kiểm sự kiện; không phải đề thật |

## 3. Listening (giọng nói, accent, TTS)

| Nguồn | URL | License (đã kiểm) | Quy mô | Dùng để | Ship trong app? | Rủi ro |
|---|---|---|---|---|---|---|
| LibriSpeech | https://www.openslr.org/12/ | **CC BY 4.0** | ~1.000 giờ đọc sách (LibriVox) | Clip đọc thật, dictation dài | Có (chọn lọc clip) | Đa số giọng Mỹ, văn cổ |
| LibriVox (gốc) | https://librivox.org | Public domain (theo model card Piper "cori": "License: public domain") | Hàng chục nghìn audiobook, có nhiều người đọc giọng Anh | Nguồn giọng Anh/Úc thật (lọc theo người đọc) | Có | Phải tự lọc giọng; chất lượng thu âm không đều |
| VCTK (CSTR Edinburgh) | https://huggingface.co/datasets/CSTR-Edinburgh/vctk | **CC BY 4.0** (HF tag) | 110 người, nhiều giọng vùng UK/Ireland/Scotland (+ vài Úc/NZ/Canada — CHƯA KIỂM phân bố) | Clip ngắn luyện nghe accent; mini-game "đoán giọng" | Có | Câu báo chí ngắn, đọc rời |
| Common Voice (Mozilla Data Collective) | https://mozilladatacollective.com/datasets/cmko7havo02f5nw07rbwwhowe | **CC0-1.0**, NHƯNG điều khoản nền tảng: "forbidden to re-host or re-share this dataset" và cấm nhận dạng người nói. Có tập con en-AU (55.673 dòng, 1,92 GB); Scripted 25.0 có nhãn accent (England 203k clip) | Hàng nghìn giờ | Chọn giọng mẫu / benchmark ASR theo accent | Chỉ số liệu dẫn xuất (an toàn); ship vài clip là vùng xám | Nhãn accent tự khai, không chuẩn hoá |
| TED-LIUM 3 | https://lium.univ-lemans.fr/?p=22550 | **CC BY-NC-ND 3.0**; talk thuộc TED | 2.351 talk, 452 giờ | — | **Không** | ND + bản quyền TED |
| People's Speech (MLCommons) | https://huggingface.co/datasets/MLCommons/peoples_speech | Hỗn hợp CC BY 2.0–4.0 / CC BY-SA 3.0–4.0 (HF tag) | ~30.000 giờ (CHƯA KIỂM) | Giọng tự nhiên, đa dạng | Có (theo license từng clip) | Đa số giọng Mỹ, chất lượng không đều |
| Kokoro-82M (đang dùng) | https://huggingface.co/hexgrad/Kokoro-82M | **Apache-2.0** (13,6 triệu lượt tải); bản ONNX cho transformers.js: onnx-community/Kokoro-82M-v1.0-ONNX (Apache-2.0) | British: 4F 4M. Điểm: bf_emma **B-**, bf_isabella C, bm_george C, bm_fable C, bm_lewis D+, còn lại D | TTS giọng Anh cho bài nghe | Có | Không có giọng Úc/NZ/Canada; giọng Anh điểm thấp → nên dùng bf_emma làm chính |
| Piper voices en_GB | https://huggingface.co/rhasspy/piper-voices | Engine: rhasspy/piper MIT (**đã archive**), bản tiếp là OHF-Voice/piper1-gpl **GPL-3.0**. License voice theo dataset trong MODEL_CARD: **vctk-medium (109 người) CC BY 4.0**, alba CC BY 4.0, aru (12 người, Liverpool) CC BY 4.0, cori (high) public domain, northern_english_male / southern_english_female CC BY-SA 4.0, **semaine CC BY-NC-SA 4.0**, alan / jenny_dioco "See URL" | 11 voice en_GB; **không có en_AU/en_NZ/en_CA** trong voices.json | Sinh audio offline nhiều giọng vùng UK (vctk 109 speaker) | Có (audio đã render; tránh semaine, kiểm alan/jenny) | Engine GPL chỉ dùng ở bước build, không bundle → không dính GPL |
| Giọng Úc/NZ/Canada mở | — | Không tìm thấy voice TTS mở có license rõ (MeloTTS EN-AU chỉ thấy qua site thương mại) (CHƯA KIỂM) | — | — | — | **Lỗ hổng**: IELTS có giọng Úc. Phương án: clip người thật CC (LibriVox người đọc Úc, VCTK, Common Voice chỉ để tham chiếu) |

## 4. Writing (essay có điểm, GEC, công cụ)

| Nguồn | URL | License (đã kiểm) | Quy mô | Dùng để | Ship trong app? | Rủi ro |
|---|---|---|---|---|---|---|
| ELLIPSE corpus | https://github.com/scrosseye/ELLIPSE-Corpus | **CC BY 4.0** (README). Zip có mật khẩu công khai trong README (`ellipse_test`, `ellipse_raw_data`). 37★, push 2026-10-27 | ~6.500 bài của học sinh ELL lớp 8–12, điểm holistic + 6 điểm phân tích (cohesion, syntax, vocabulary, phraseology, grammar, conventions); bản thô ~9.000 bài + điểm từng giám khảo | **Hiệu chỉnh prompt chấm của Claude** (so tương quan); bài mẫu "đây là lỗi điển hình" | Có (trích đoạn) | Không phải IELTS, đề kiểu Mỹ K-12; map thang điểm sang band chỉ là xấp xỉ |
| PERSUADE 2.0 | https://github.com/scrosseye/persuade_corpus_2.0 | **CC BY 4.0** (README) | >25.000 bài nghị luận lớp 6–12 (người bản ngữ + ELL), điểm holistic + nhãn discourse element | Dạy cấu trúc luận điểm (claim/evidence/counterclaim/rebuttal) cho Task 2 | Có (trích đoạn) | Trình độ thấp hơn IELTS 7–8 |
| ASAP (Kaggle 2012) / ASAP 2.0 / ASAP++ | https://www.kaggle.com/c/asap-aes | Luật Kaggle không đọc được (trang JS) (CHƯA KIỂM). ASAP 2.0: bài báo CC BY-NC; license dataset (CHƯA KIỂM) | ~13k / ~25k bài | Không cần thiết | Không | Học sinh Mỹ; license không rõ |
| ICNALE | https://language.sakura.ne.jp/icnale/ | "It is **prohibited to reproduce and/or redistribute** a part or the whole of the ICNALE data" | Written Essays 5.600 bài; Global Rating Archives (140 bài × 80 người chấm); có người học Việt Nam (CHƯA KIỂM) | Chỉ phân tích offline (lỗi điển hình của người châu Á) | Chỉ số liệu dẫn xuất | Cấm phân phối lại |
| EFCAMDAT | https://ef-lab.mmll.cam.ac.uk/EFCAMDAT.html | Chỉ cho người nghiên cứu có affiliation học thuật, admin duyệt; User Agreement PDF (CHƯA KIỂM) | 1,18 triệu bài, 174.743 người học, 16 cấp (≈CEFR) | — | Không | Không đủ điều kiện truy cập |
| Write & Improve Corpus 2024 (CUP&A) | https://researchdatasets.cambridge.org/datasets/write-and-improve-corpus-2024 | Chỉ "non-commercial research and educational purposes"; **cấm đưa (toàn phần/một phần) cho bất kỳ ai, kể cả lên GitHub/HF**; **cấm công bố mô hình hoặc thống kê dẫn xuất khi chưa được CUP&A duyệt**; trích dẫn <100 từ; **chỉ dùng với LLM chạy local hoặc API không lưu dữ liệu**; luật Anh | 5.050 bộ bài, 766 người học, ~23k bài có nhãn CEFR + chú thích lỗi | Tự đọc để hiểu thang CEFR | **Không** | Quy trình "dán vào Claude chat" có thể vi phạm điều khoản LLM; cấm thống kê dẫn xuất |
| W&I+LOCNESS v2.1 / FCE v2.1 (BEA-2019) | https://www.cl.cam.ac.uk/research/nl/bea2019st/ | "may only be used for **non-commercial** purposes"; tải trực tiếp | ~3.600 bài W&I (CHƯA KIỂM) | Benchmark offline cho bộ kiểm lỗi (Harper vs. Claude) | Chỉ số liệu dẫn xuất | Điều khoản phân phối lại chi tiết (CHƯA KIỂM) → đừng ship |
| JFLEG | https://github.com/keisks/jfleg | **CC BY-NC-SA 4.0** (README) | 1.501 câu × 4 bản sửa trôi chảy | Bài "sửa câu cho tự nhiên" (fluency edit) | Có (NC + SA) | Câu ngắn trình độ thấp |
| CoNLL-2014 / NUCLE | https://www.comp.nus.edu.sg/~nlp/conll14st.html | NUCLE phải ký form license; test set không ghi license (CHƯA KIỂM) | ~1.400 bài sinh viên Singapore | — | Không | |
| Dataset "IELTS" trên HuggingFace (crawl từ Writing9) — chillies/ielts-writing-task2-essays | https://huggingface.co/datasets/chillies/ielts-writing-task2-essays | Card ghi CC BY 4.0, nhưng dữ liệu crawl từ writing9.com mà **ToS Writing9 cấm "Reproduce, duplicate or copy material" và "Redistribute content"** | 8.049 bài, 128 đề, band tổng + 4 tiêu chí + feedback GPT | — | **Không** | License không hợp lệ; band trên Writing9 (CHƯA KIỂM nguồn gốc — trang không nói AI hay người chấm), nhiều khả năng là máy chấm |
| ndtran0101/writing9-ielts-essays | https://huggingface.co/datasets/ndtran0101/writing9-ielts-essays | license: unknown | 163.575 bài + 2.500 bài band 9 **tổng hợp bằng LLM** | Tối đa: số liệu offline về phân bố band | Không | Như trên + nhãn band nhiễu (card thừa nhận) |
| chillies/IELTS-writing-task-2-evaluation, hai2131/IELTS-essays-task-1, TraTacXiMuoi/Ielts_writing_task1_academic | các trang HF tương ứng | Không có license | 10k–14k bài | — | Không | Không rõ nguồn gốc/cách chấm |
| Jackrong/IELTS-writing-feedback-reasoning | https://huggingface.co/datasets/Jackrong/IELTS-writing-feedback-reasoning | Apache-2.0 (card) | 1k–10k mẫu; **điểm và feedback do GLM-4.7 sinh** | Mẫu định dạng feedback | Chỉ tham khảo | Điểm tổng hợp, không phải giám khảo; nguồn bài viết không rõ |
| Harper (harper.js) | https://github.com/Automattic/harper | **Apache-2.0**; 17.948★, push 2026-11-25; npm harper.js 3.2.0 (2026-11-13). Chạy **WebAssembly trong trình duyệt**, có enum `Dialect { British, Australian, Canadian, Indian }` | Binary inline ~27 MB (chưa nén) | Kiểm ngữ pháp/chính tả **client-side, offline** trong mode Writing (chính tả Anh-Anh) | Có | Bắt lỗi nông hơn LanguageTool; nặng → lazy-load |
| LanguageTool | https://github.com/languagetool-org/languagetool | **LGPL-2.1**; 15.297★ | 25+ ngôn ngữ | — | Không chạy client-side (cần Java server; tài liệu yêu cầu "Java 8 or later") | API công cộng có giới hạn và gửi dữ liệu ra ngoài |
| ERRANT | https://github.com/chrisjbryant/errant | **MIT**; 472★ | Python | Offline: phân loại lỗi (bài gốc vs. bản Claude sửa) → thống kê loại lỗi cá nhân | Chỉ ở pipeline build (Python) | Không chạy trong trình duyệt |

## 5. Speaking (phát âm, ASR trong trình duyệt)

| Nguồn | URL | License (đã kiểm) | Quy mô | Dùng để | Ship trong app? | Rủi ro |
|---|---|---|---|---|---|---|
| speechocean762 | https://www.openslr.org/101/ | **CC BY 4.0** (OpenSLR); bản HF mispeech/speechocean762 ghi apache-2.0; README GitHub: "free… for both commercial and non-commercial purposes" | 5.000 câu, 250 người học (L1 tiếng Trung), 520 MB; điểm câu/từ/phoneme do 5 chuyên gia chấm | Hiệu chỉnh thang điểm phát âm trong app (chuyển GOP → 0–10) | Chỉ số liệu dẫn xuất (ship được nhưng không cần) | L1 Trung, không phải Việt |
| L2-ARCTIC v5 | https://psi.engr.tamu.edu/l2-arctic-corpus/ | **CC BY-NC 4.0** | 24 người, 6 L1 **gồm tiếng Việt** (4 người); ~150 câu/người có chú thích lỗi phoneme | Danh sách lỗi phát âm điển hình người Việt (dùng sinh bài minimal pair) | Có (NC) — nhưng chủ yếu dùng số liệu dẫn xuất | NC |
| Speak & Improve Corpus 2025 (CUP&A) | https://researchdatasets.cambridge.org/datasets/speak-and-improve-corpus-2025 | Cùng khung với W&I: non-commercial research/education, cấm chia sẻ, cấm công bố thống kê/mô hình khi chưa duyệt, chỉ LLM local | ~315 giờ, >45k utterance, nhãn CEFR toàn bài | — | **Không** | Như W&I |
| Dataset "IELTS speaking" trên HF (Amanafif554/*, qwertyuiopasdfg/IELTs-Speaking-answer…) | https://huggingface.co/datasets?search=ielts | Phần lớn không có license; vài bộ Apache-2.0 nhưng không rõ nguồn | <1k mẫu | — | Không | Không tìm thấy bộ speaking chấm band IELTS nào hợp pháp |
| Whisper (OpenAI) / whisper.cpp | https://github.com/openai/whisper , https://github.com/ggml-org/whisper.cpp | MIT / MIT; whisper.cpp có ví dụ **WebAssembly**; model tiny 75 MiB, base 142 MiB | — | ASR trong trình duyệt cho Speaking mock / 3-second reflex | Có (tải model khi cần, cache ở OPFS/Cache API) | tiny/base sai nhiều với giọng L2; ASR tự sửa lỗi phát âm → không dùng chấm phát âm được |
| transformers.js | https://github.com/huggingface/transformers.js | **Apache-2.0**; npm @huggingface/transformers 4.3.2; WASM (CPU) mặc định, `device: 'webgpu'` | Model ONNX: onnx-community/whisper-base, whisper-tiny.en (Apache-2.0), moonshine-base-ONNX (MIT) | Một runtime cho cả ASR + Kokoro TTS + phoneme model | Có | Tải model 40–150 MB; WebGPU chưa có trên mọi máy |
| wav2vec2 phoneme (espeak) | https://huggingface.co/facebook/wav2vec2-lv-60-espeak-cv-ft | **Apache-2.0** (cả bản xlsr-53-espeak-cv-ft) | ~1,2 GB (large) | Nhận dạng phoneme → tính GOP / so khớp phoneme cho chấm phát âm | Không trong trình duyệt (quá nặng); bản ONNX nhỏ như onnx-community/wavlm-large-english-phoneme-ONNX (CHƯA KIỂM license/kích thước) | Nặng; bản trên HF train từ L2-ARCTIC (mrrubino/…) kế thừa nghi vấn NC |
| GOPT (YuanGongND/gopt) | https://github.com/YuanGongND/gopt | **BSD-3-Clause**; 235★, push 2023-02 | Code + recipe speechocean762 | Tham khảo thuật toán GOP đa tầng | Chỉ ở build | Cũ, cần Kaldi |
| OpenPronounce | https://github.com/OpenPronounce/OpenPronounce | **AGPL-3.0**; 248★, push 2026-11-23 | Python + 2 checkpoint wav2vec2 1,2 GB; báo cáo tương quan trên speechocean762 | Tham khảo cách tính điểm | Không (AGPL + server) | AGPL lan sang code nếu nhúng |
| Pronunciada (moglearn) | https://github.com/moglearn/pronunciada | **Apache-2.0**; push 2026-11-24; dựa trên ZIPA (MIT) | Model 71 MB (bản nhỏ), ~40 ms/câu trên CPU; tương quan câu 0,792 trên speechocean762 | Ứng viên tốt nhất để port sang trình duyệt (ONNX) cho chấm phát âm | Chưa (hiện chỉ có Python/CLI/HTTP) | Repo mới (13★); cần tự port |
| Mimora | https://github.com/vikonix/Mimora | MIT; 38★ | App desktop, model ~4 GB | Tham khảo UX | Không | Quá nặng |

## 6. Tài liệu IELTS chính thức / tham chiếu

| Nguồn | URL | License / Terms (đã kiểm) | Nội dung | Dùng hợp lệ như thế nào | Ship trong app? | Rủi ro |
|---|---|---|---|---|---|---|
| IELTS Writing band descriptors (public) + key assessment criteria | https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-writing-band-descriptors.pdf | "Updated May 2023"; công bố 03/05/2023. Không thấy bản sửa đổi mới hơn (tìm đến 11/2026) | Mô tả band 0–9 cho Task 1/2, 4 tiêu chí | Dựa vào để viết **rubric riêng bằng lời của mình** cho prompt chấm; trỏ link tới PDF chính thức | **Không ship nguyên văn**; chỉ link + bản tóm tắt tự viết | ielts.org copyright notice |
| Speaking band descriptors (public) | https://ielts.org (mục Speaking) | Bản public; ngày cập nhật (CHƯA KIỂM) | 4 tiêu chí FC/LR/GRA/P | Như trên | Không (link) | |
| ielts.org — copyright notice | https://ielts.org/legal/ielts-copyright-and-trade-mark-statement | "made available to you for your **personal and non-commercial use only**"; không được "republish any material on another website", không được "modify the material in any way" khi chưa có "written permission" | Sample test (Academic/GT), đáp án | Làm thử cá nhân; ghi **thống kê cấu trúc** (số câu theo dạng, độ dài passage, số từ, thời gian) bằng lời của mình | Không | "IELTS" là nhãn hiệu → không dùng logo/tên gây hiểu nhầm là chính thức; ghi "not affiliated" |
| British Council — takeielts free practice tests | https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests | Trang và terms bị timeout (CHƯA KIỂM) | Bài test luyện tập miễn phí | Tự luyện; ghi số liệu cấu trúc | Không | Mặc định giữ mọi quyền |
| IDP IELTS (ielts.idp.com) | https://ielts.idp.com/…/legal-notices | Legal notice theo từng quốc gia (CHƯA KIỂM nội dung) | Sample, mẹo | Như trên | Không | |
| ieltsonlinetests.com | https://ieltsonlinetests.com/ | Có trang Terms & Conditions; /terms-of-use trả 404 (CHƯA KIỂM). Công ty Việt Nam (Hà Nội), bán khoá học | Mock test online | Hiệu chỉnh độ khó bằng cảm nhận cá nhân | Không | Nhiều đề có thể dựa trên sách Cambridge (CHƯA KIỂM) |
| IELTS Liz | https://www.ieltsliz.com/ | "Copyright © Elizabeth Ferguson, 2014 – 2026", All rights reserved; có chặn copy | Bài học, topic list Speaking, 100 đề essay | Đọc để hiểu phân bố chủ đề; **danh sách chủ đề tự viết lại** | Không | |
| IELTS Simon | https://ielts-simon.com/ | "© IELTS Simon 2026"; blog cũ **đóng cuối 09/2025**, chuyển sang site trả phí ielts-simon.study | Bài mẫu band 9 (lưu trữ) | Học phong cách viết (không chép) | Không | |
| mini-ielts.com | https://mini-ielts.com/ | Không thấy copyright notice; có link Terms (CHƯA KIỂM) | 6 listening + 6 reading mới, nhãn "Recent Actual Tests" | — | **Không** | Có tiêu đề trùng sách Cambridge IELTS (vd. "William Gilbert and Magnetism") → nghi sao chép (CHƯA KIỂM) |

**Cách dùng hợp pháp tài liệu chính thức (không sao chép):**
1. Ghi bảng thống kê (tự gõ, không chép văn bản): dạng câu hỏi theo từng section, số câu, độ dài passage (từ), phân bố T/F/NG, tỷ lệ paraphrase so với keyword đề, tốc độ nói (wpm) trong Listening, độ dài phần trả lời. Số liệu/sự kiện thì không có bản quyền.
2. Dùng làm "đề kiểm tra mù" cho chính bạn để hiệu chỉnh: điểm của bạn trên đề app vs. trên sample chính thức → chỉnh độ khó.
3. Rubric: viết lại descriptor bằng lời của mình, trỏ link PDF gốc. Không nhúng PDF.

## 7. GitHub repos đáng dùng (số liệu GitHub API ngày 2026-11-25)

| Repo | ★ | Push gần nhất | License | Dùng cụ thể |
|---|---|---|---|---|
| open-spaced-repetition/ts-fsrs | 891 | 2026-11-22 | MIT (npm 6.0.1) | Đang dùng; giữ |
| open-spaced-repetition/fsrs4anki | 4.148 | 2026-08-14 | MIT | Tham khảo tối ưu tham số FSRS từ log của chính người học |
| Automattic/harper | 17.948 | 2026-11-25 | Apache-2.0 | Kiểm ngữ pháp WASM, dialect British |
| huggingface/transformers.js | 16.455 | 2026-11-25 | Apache-2.0 | Whisper/Moonshine ASR + Kokoro trong trình duyệt |
| ggml-org/whisper.cpp | 55.496 | 2026-11-24 | MIT | Phương án ASR WASM thay thế |
| hexgrad/kokoro | 10.353 | 2025-08-06 | Apache-2.0 | TTS (đang dùng) |
| OHF-Voice/piper1-gpl (kế nhiệm rhasspy/piper, đã archive, MIT) | 6.391 | 2026-11-24 | GPL-3.0 | Render audio giọng UK đa dạng ở bước build |
| tatuylonen/wiktextract | 1.304 | 2026-11-23 | MIT (code); dữ liệu Wiktionary CC BY-SA | Không cần chạy; tải JSONL kaikki |
| globalwordnet/english-wordnet | 924 | 2026-11-13 | CC BY 4.0 (+ WordNet License) | Đồng nghĩa cho Paraphrase |
| cmusphinx/cmudict | 835 | 2025-10-24 | BSD-2 style | Trọng âm/âm tiết |
| open-dict-data/ipa-dict | 827 | 2026-10-22 | MIT | IPA RP |
| chrisjbryant/errant | 472 | 2026-05-28 | MIT | Phân loại lỗi offline |
| languagetool-org/languagetool | 15.297 | 2026-11-24 | LGPL-2.1 | Chỉ nếu tự host server (không hợp static) |
| designfuchen/word-atlas | 5.282 | 2026-11-13 | MIT code + CC BY 4.0 nội dung | Seed 7.298 từ IELTS + audio UK |
| openlanguageprofiles/olp-en-cefrj | 231 | 2020-03-25 | Không có SPDX; README: CEFR-J free kể cả thương mại khi trích dẫn; Octanove CC BY-SA 4.0 | Nhãn CEFR |
| scrosseye/ELLIPSE-Corpus | 37 | 2026-10-27 | CC BY 4.0 (dữ liệu) | Hiệu chỉnh chấm Writing |
| scrosseye/persuade_corpus_2.0 | (CHƯA KIỂM) | (CHƯA KIỂM) | CC BY 4.0 (dữ liệu) | Cấu trúc nghị luận |
| scrosseye/CLEAR-Corpus | 26 | 2024-04-17 | CC BY-NC-SA 4.0 | Công thức độ khó passage |
| nishkalavallabhi/OneStopEnglishCorpus | 75 | 2024-02-15 | CC BY-SA 4.0 | Mô hình 3 cấp độ khó |
| yukiar/CEFR-SP | 62 | 2024-09-17 | Theo nguồn (CC BY-SA 3.0 / CC BY-NC-SA 4.0) | CEFR cấp câu |
| jimbozhang/speechocean762 | 206 | 2025-10-26 | CC BY 4.0 (OpenSLR) | Thang chấm phát âm |
| YuanGongND/gopt | 235 | 2023-02-13 | BSD-3-Clause | Thuật toán GOP |
| moglearn/pronunciada | 13 | 2026-11-24 | Apache-2.0 | Ứng viên port chấm phát âm |
| OpenPronounce/OpenPronounce | 248 | 2026-11-23 | AGPL-3.0 | Chỉ tham khảo |
| duolingo/halflife-regression | 585 | 2026-11-10 | MIT (code); dữ liệu CC BY-NC 4.0 | Hiệu chỉnh độ khó từ |
| riiid/ednet | 388 | 2020-10-21 | Dữ liệu CC BY-NC 4.0 | Mô hình độ khó item (IRT) |
| awslabs/fever | 130 | 2026-02-20 | Apache-2.0 (code) | Mẫu TFNG |
| Luxshan2000/ielts-prep (BandReady) | 22 | 2026-11-08 | MIT | App IELTS offline tương tự (Electron) — tham khảo kiến trúc, rubric prompt |
| ucatal/awesome-ielts | 1.047 | 2026-10-30 | Không có license | Danh sách link — chỉ đọc |
| cuixueshe/earthworm | 11.263 | 2026-11-24 | AGPL-3.0 | Tham khảo UX gõ câu (không copy code) |
| RealKai42/qwerty-learner | 23.894 | 2026-11-24 | GPL-3.0 | Tham khảo UX; file từ điển bên trong có nguồn gốc giáo trình → đừng lấy |
| hefengxian/my-ielts, zeeklog/IELTS, EthanLin-TWer/ielts | 4.414 / 875 / 769 | — | Không có license / chứa đề Cambridge | **Không dùng** (đề thật có bản quyền) |

## 8. Log người học / độ khó item

| Nguồn | URL | License (đã kiểm) | Quy mô | Dùng để | Ship trong app? | Rủi ro |
|---|---|---|---|---|---|---|
| Duolingo Half-Life Regression | https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/N8XJME | **CC BY-NC 4.0** (Dataverse API termsOfUse) | 13 triệu learning trace, 379 MB .gz | Fit offline: đặc trưng từ (độ dài, tần suất, loại từ) → độ khó/half-life ban đầu cho thẻ mới (prior trước khi FSRS có dữ liệu) | Chỉ số liệu dẫn xuất (bảng hệ số) | Người học là người dùng Duolingo nói nhiều ngôn ngữ; lexeme có nhãn của Duolingo |
| Duolingo SLAM 2018 | https://sharedtask.duolingo.com/2018.html , Dataverse doi:10.7910/DVN/8SWHNO | **CC BY-NC 4.0** (Dataverse API) | 3 track (en_es 46,9 MB, es_en, fr_en); >2 triệu token trả lời của >6k người học trong 30 ngày đầu | Track en_es (người học tiếng Anh nói tiếng Tây Ban Nha): token nào hay sai → ưu tiên bẫy | Chỉ số liệu dẫn xuất | Trình độ người mới bắt đầu |
| EdNet (Riiid, TOEIC) | https://github.com/riiid/ednet | **CC BY-NC 4.0** "for research purposes" | 131 triệu tương tác (theo paper; CHƯA KIỂM) | Mẫu ước lượng IRT độ khó item và thời gian trả lời theo phần L/R | Chỉ số liệu dẫn xuất | Chỉ có ID câu hỏi, không có nội dung câu; TOEIC ≠ IELTS |
| Anki Revlogs 10K / FSRS-Anki-20k | https://huggingface.co/datasets/open-spaced-repetition/anki-revlogs-10k | LICENSE riêng: dùng nghiên cứu về trí nhớ; "Please **do not redistribute** the data publicly"; dùng ngữ cảnh khác phải xin phép. Gated | 727 triệu review, 10k người dùng | Không cần (ts-fsrs đã có tham số mặc định train trên dữ liệu này) | Không | |

---

## Khuyến nghị dùng ngay (top 15, xếp theo giá trị)

1. **NGSL 1.2 + NAWL 1.2 (CC BY-SA 4.0)**: xương sống phân tầng từ (từ phổ thông → học thuật). Thay AWL.
2. **kaikki.org English Wiktionary JSONL (CC BY-SA/GFDL)**: định nghĩa, IPA UK/US, ví dụ, đồng/trái nghĩa, nhãn register, dạng từ cho ~10–15k từ mục tiêu. Một nguồn thay nhiều nguồn.
3. **kaikki.org Vietnamese Wiktionary (190.917 senses tiếng Anh có gloss Việt, CC BY-SA)**: gloss Anh→Việt hợp pháp duy nhất có quy mô lớn. Cần lọc nghĩa cổ.
4. **CEFR-J 1.6 + Octanove C1/C2**: nhãn CEFR A1–C2 (C1/C2 là vùng 7.0–8.0). Trích dẫn đúng mẫu của Tono Lab.
5. **Word Atlas (CC BY 4.0 nội dung, 7.298 từ IELTS, audio UK)**: seed deck nhanh nhất có sẵn collocation + audio giọng Anh. Bắt buộc QA (nội dung AI, không duyệt tay).
6. **Harper / harper.js (Apache-2.0, WASM, Dialect.British)**: feedback ngữ pháp/chính tả ngay trong trình duyệt, offline, trước khi dán bài vào Claude.
7. **Open English WordNet 2025 (CC BY 4.0)**: kho đồng nghĩa để sinh và kiểm đáp án mode Paraphrase.
8. **ipa-dict en_UK (MIT, 65k) + CMUdict (BSD)**: IPA RP + trọng âm/âm tiết.
9. **Tatoeba (ưu tiên tập CC0; còn lại CC BY 2.0 FR)**: câu ví dụ + dictation ngắn + cặp Anh–Việt.
10. **ELLIPSE (CC BY 4.0, ~6.500 bài có 6 điểm phân tích) + PERSUADE 2.0 (CC BY 4.0)**: bộ hiệu chỉnh cho prompt chấm Writing của Claude (đo tương quan, phát hiện chấm lệch); ví dụ lỗi thật.
11. **VOA Learning English (public domain, text + MP3)**: audio người thật + transcript, dùng chung cho Listening và Reading (loại bài AP/Reuters/AFP).
12. **Giọng Anh cho TTS**: Kokoro bf_emma (B-) làm giọng chính + Piper en_GB-vctk-medium (109 người, CC BY 4.0), alba, aru, cori (PD) render ở bước build → nhiều giọng vùng UK. VCTK (CC BY 4.0) cho clip người thật.
13. **Văn bản nguồn cho Reading**: eLife Digest + PLOS Author Summary (CC BY 4.0, không bị SA) > Wikipedia (CC BY-SA 4.0) > Gutenberg (PD). Sinh passage bằng LLM *từ sự kiện*, ghi nguồn.
14. **FEVER (CC BY-SA 3.0) + SNLI/MNLI**: mẫu cho bộ sinh TFNG (NEI ≈ Not Given) và để test bộ kiểm "câu hỏi có đúng 1 đáp án" trước khi ship.
15. **Duolingo HLR (CC BY-NC 4.0) + speechocean762 (CC BY 4.0)**: hiệu chỉnh offline: prior độ khó từ cho FSRS; thang điểm phát âm 0–10. Không ship dữ liệu thô.

Bonus đáng thử: **irfanhossainsust/ielts-style-reading-passage3 (MIT, 1.051 bài, 14.188 câu)** làm seed Passage 3 sau khi fact-check; **Pronunciada (Apache-2.0, 71 MB)** để port ONNX nếu muốn chấm phát âm thật.

## Không dùng / cấm

- **Sách/đề Cambridge IELTS và mọi repo/site chép lại** (hefengxian/my-ielts, zeeklog/IELTS, EthanLin-TWer/ielts "Cambridge authentic examination papers", mini-ielts nghi chép): vi phạm bản quyền trực tiếp.
- **Oxford 3000/5000, OALD, English Vocabulary Profile**: không có license mở; chỉ tra tay. Không ship nhãn CEFR của họ.
- **AWL (Coxhead)**: không có license công khai, tiền lệ phải xin phép → dùng NAWL.
- **Pearson Academic Collocation List**: "All rights reserved, including… text and data mining and training of artificial intelligence". Không cào, không đưa cho LLM sinh lại.
- **The Conversation**: CC BY-ND 4.0, không được sửa/cắt → không dùng làm passage.
- **Write & Improve 2024 / Speak & Improve 2025 (CUP&A)**: cấm chia sẻ, cấm công bố thống kê dẫn xuất khi chưa duyệt, giới hạn LLM (quy trình dán vào Claude chat có thể vi phạm).
- **Dataset IELTS crawl từ Writing9 trên HF** (chillies/ielts-writing-task2-essays ghi CC BY 4.0 sai; ndtran0101/writing9-ielts-essays license unknown): ToS Writing9 cấm sao chép/phân phối lại; band không phải giám khảo IELTS.
- **Các bộ IELTS HF không license / điểm do LLM** (chillies/IELTS-writing-task-2-evaluation, hai2131/…, Jackrong/… dùng làm "ground truth"): nguồn gốc không rõ hoặc điểm tổng hợp. Không dùng làm chuẩn chấm.
- **RACE** (chỉ nghiên cứu phi thương mại, passage không thuộc CMU), **Newsela** (NDA), **TED-LIUM** (NC-ND, của TED), **ICNALE** (cấm phân phối lại), **EFCAMDAT** (chỉ học thuật), **Anki revlogs** (cấm phân phối lại), **COCA full data**.
- **Piper en_GB-semaine** (CC BY-NC-SA, không cần thiết) và en_GB-alan / jenny_dioco (license "See URL" chưa rõ) → tránh.
- **Nội dung ielts.org / British Council / IDP / IELTS Liz / IELTS Simon / ieltsonlinetests**: chỉ dùng cá nhân; không đăng lại, không sửa, không nhúng. Không dùng logo/tên "IELTS" kiểu gây hiểu nhầm là chính thức; ghi rõ "not affiliated".
- **OpenPronounce (AGPL)**, LanguageTool server công cộng: không nhúng (AGPL lan sang code / dữ liệu người dùng gửi ra ngoài).
- **Lưu ý (không cấm)**: OpenStax nay là **CC BY-NC-SA** (đổi năm 2026, xem help.openstax.org). Vẫn dùng được cho app phi thương mại nhưng dính SA + NC.

## Chưa kiểm được

- Điều khoản chính xác: AWL (wgtn 403), Oxford 3000/5000 (FAQ 403), EVP (site JS, URL cũ 404), SUBTLEX-US (trang Ghent; hai nguồn thứ cấp mâu thuẫn), COCA/AVL (quyền phân phối lại).
- Kaggle ASAP / ASAP 2.0 / ASAP++ (trang luật dùng JS), EFCAMDAT User Agreement PDF, test set CoNLL-2014, phân phối lại W&I+LOCNESS ngoài câu "non-commercial".
- Bài "An update on OpenStax licensing" (ngày đổi, bản cũ có còn CC BY không).
- Trang license Project Gutenberg (503; đã kiểm qua search + trang permission).
- Terms của takeielts.britishcouncil.org (timeout), ieltsonlinetests.com (/terms-of-use 404), mini-ielts.com; nguồn đề của mini-ielts/ieltsonlinetests.
- Nguồn gốc gloss tiếng Việt trên vi.wiktionary (nghi bot nhập từ FVDP GPL); license riêng từng database OVDP.
- Số liệu: số câu tiếng Anh Tatoeba, số mục CEFR-J/Octanove, số synset OEWN 2025, số từ BSL/NGSL-Spoken, phân bố accent VCTK, quy mô People's Speech, số bài W&I trong BEA-2019, kích thước harper.js sau nén.
- Cách Writing9 tạo band (trang không nói AI hay người).
- License/kích thước onnx-community/wavlm-large-english-phoneme-ONNX; giọng TTS mở Úc/NZ/Canada (không tìm thấy voice mở có license rõ).
- Ngày cập nhật bản public Speaking band descriptors.
