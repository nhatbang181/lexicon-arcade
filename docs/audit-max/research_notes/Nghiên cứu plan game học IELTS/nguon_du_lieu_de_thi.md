# Nguồn dữ liệu hợp pháp & tài liệu đề thi cho nội dung IELTS Academic (app cá nhân, phi thương mại)

> Phạm vi: danh sách từ, corpus, văn bản đọc, audio/TTS, phát âm/IPA, đề thi, dữ liệu lỗi người học. Ngày nghiên cứu: 25/11/2026.
> Quy ước: mọi dữ kiện có nguồn inline. Những điều dựa trên hiểu biết nền mà **chưa kiểm chứng trong phiên này** được đưa vào mục "Gaps" và đánh dấu **[CẦN XÁC MINH]**.
> Không phải tư vấn pháp lý; app là cá nhân, phi thương mại nhưng nếu host công khai trên web thì vẫn là "phân phối/công bố lại", nên phải tuân điều khoản như một website công khai.

---

## 1. Danh sách từ vựng (NGSL/NAWL/TSL/BSL, AWL, AVL, Oxford 3000/5000, EVP, CEFR-J, wordfreq, SUBTLEX, COCA) — nguồn nào cho cấp CEFR hợp pháp?

### Takeaway
Bộ NGSL (Browne và cộng sự) dùng CC BY-SA 4.0, kể cả cho mục đích thương mại. CEFR-J Vocabulary Profile (A1–B2) cho dùng miễn phí cả nghiên cứu lẫn thương mại, chỉ cần trích dẫn. Octanove C1/C2 dùng CC BY-SA 4.0. Ghép CEFR-J với Octanove là **cách hợp pháp duy nhất đã xác minh được để có nhãn CEFR A1–C2**. EVP (Cambridge) và Oxford 3000/5000 chỉ nên dùng để *tham khảo/đối chiếu*, không chép nhãn CEFR vào database.

### Cited Findings
- **NGSL / NAWL / TSL / BSL / NGSL-Spoken:** trang chủ ghi "Free under Creative Commons, including commercial use" và "Word lists released under Creative Commons". Trang chủ không nêu phiên bản CC cho từng list — [newgeneralservicelist.com](https://www.newgeneralservicelist.com/)
- Trang NGSL 1.2 ghi license cụ thể là **Creative Commons Attribution-ShareAlike 4.0 International**. Tác giả: Browne, Culligan, Phillips — [NGSL 1.2](https://www.newgeneralservicelist.com/new-general-service-list)
- NAWL và NGSL được một gói R bên thứ ba ghi là CC BY-SA 4.0, nguồn lấy từ trang NAWL của dự án. Chưa đọc được câu license trên chính trang NAWL — [rdrr.io word.lists](https://rdrr.io/github/antdurrant/word.lists/man/list_academic.html); trang gốc: [NAWL](https://www.newgeneralservicelist.com/new-academic-word-list), [NGSL-Spoken](https://www.newgeneralservicelist.com/ngsl-spoken)
- Trang /word-lists cho biết mỗi list có bản tải "in several formats" nhưng không nêu định dạng cụ thể và không có thông tin CEFR — [Word Lists](https://www.newgeneralservicelist.com/word-lists)
- **CEFR-J Vocabulary Profile v1.5** (`cefrj-vocabulary-profile-1.5.csv`): "can be used for research and commercial purposes with no charge, provided that you cite the dataset properly". Bản quyền thuộc Tono Laboratory, TUFS — [GitHub openlanguageprofiles/olp-en-cefrj](https://github.com/openlanguageprofiles/olp-en-cefrj)
- **Octanove Vocabulary Profile C1/C2 v1.0** (`octanove-vocabulary-profile-c1c2-1.0.csv`): CC BY-SA 4.0, tác giả Octanove Labs — [GitHub olp-en-cefrj](https://github.com/openlanguageprofiles/olp-en-cefrj)
- **wordfreq:** code dùng Apache license, data dùng CC BY-SA 4.0. Data có lấy từ Google Books Ngrams, OpenSubtitles, SUBTLEX, mỗi nguồn kèm điều kiện ghi công riêng liệt kê trong README. Tần suất là "a snapshot of language usage through about 2021" và "unlikely to be updated again" (dự án đã sunset). Bản trích dẫn: v3.0.2 (Zenodo, 2022) — [GitHub rspeer/wordfreq](https://github.com/rspeer/wordfreq)
- **Academic Vocabulary List (Gardner & Davies):** trang chính thức nói hai cách truy cập đều "completely free" nhưng không nêu điều khoản tái phân phối hay license. Bài gốc đăng trên *Applied Linguistics* (8/2013) — [academicvocabulary.info](https://www.academicvocabulary.info/)
- **English Vocabulary Profile (EVP):** một bài năm 2017 cho biết EVP dùng miễn phí sau khi đăng ký tài khoản bằng email — [Kyushu Univ. PDF](https://api.lib.kyushu-u.ac.jp/opac_download_md/1932350/英語教育2017年2月号_EVP_内田_改.pdf). Wikipedia ghi EVP từng mở miễn phí trong thời gian giới hạn sau khi đăng ký, và tài liệu English Profile được cung cấp "free-of-charge for non-commercial use" — [Wikipedia: English Profile](https://en.wikipedia.org/wiki/English_Profile). Điều khoản không cho tổ chức khác quảng bá tài liệu thương mại là "English Profile informed" nếu chưa có phép bằng văn bản — [Cambridge Core](https://www.cambridge.org/core/product/418955FC7ED2455E98A499BC40C2C816)
- **Oxford 3000/5000:** trang chính thức chặn truy cập tự động (HTTP 403), nên không đọc được điều khoản — [oxfordlearnersdictionaries.com](https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000)

### Inferences
- ShareAlike (NGSL, Octanove, wordfreq data): nếu trộn các list này vào database từ vựng của app rồi công bố database đó, phần dữ liệu phái sinh phải để license tương thích CC BY-SA 4.0 và ghi công. Với app cá nhân phi thương mại thì không có xung đột. Phần code app không bị ShareAlike "lây" nếu dữ liệu được tách thành file riêng.
- Nhãn CEFR hợp pháp: dùng CEFR-J cho A1–B2 và Octanove cho C1–C2. EVP chỉ nên dùng để tra tay khi biên soạn, không scrape vào DB, vì điều khoản hiện hành chưa xác minh và các nguồn thứ cấp chỉ nói "non-commercial", "đăng ký".
- NGSL/NAWL không có CEFR. Có thể dùng thứ hạng tần suất (rank band) làm "độ khó" thay cho CEFR.
- wordfreq phù hợp làm tần suất nền cho mọi từ (Zipf), nhưng dữ liệu dừng ở khoảng năm 2021.

### Gaps
- Câu license nguyên văn trên trang NAWL, TSL, BSL, NGSL-Spoken (chỉ có dẫn chứng gián tiếp). Định dạng tải cụ thể (theo hiểu biết nền là CSV/XLSX/PDF) **[CẦN XÁC MINH]**.
- **Coxhead AWL:** trang Victoria University of Wellington trả HTTP 403. Theo hiểu biết nền, bản quyền thuộc Coxhead/VUW và list được phép dùng cho giảng dạy/nghiên cứu, nhưng không có license mở rõ ràng **[CẦN XÁC MINH]**. Khuyến nghị: không sao chép nguyên list, nếu cần thì dùng NAWL thay thế.
- Điều khoản Oxford 3000/5000. Theo hiểu biết nền, OUP giữ bản quyền và cho tải PDF để dùng cá nhân/lớp học, không cho tái phân phối **[CẦN XÁC MINH]**. Không nên chép nhãn CEFR Oxford vào DB.
- Điều khoản EVP hiện hành (2025–2026) chưa tìm thấy trên englishprofile.org (URL cũ trả 404).
- **SUBTLEX-US/UK:** chưa đọc trực tiếp license. Theo hiểu biết nền là "free for research", không có license mở chuẩn **[CẦN XÁC MINH]**. Nên dùng gián tiếp qua wordfreq (đã có attribution).
- **COCA free samples** (wordfrequency.info, top 5000 lemmas): theo hiểu biết nền, điều khoản cấm tái phân phối dữ liệu **[CẦN XÁC MINH]**. Không nên đưa vào DB.

---

## 2. Dữ liệu collocation miễn phí (BNC/COCA samples, n-gram Wikipedia, Google Books Ngram, Academic Collocation List)

### Takeaway
Academic Collocation List (ACL, Pearson) tải miễn phí dưới dạng PDF/XLSX nhưng **không có license công khai**, nên chỉ nên tham khảo khi tự soạn bài. Collocation hợp pháp nhất là tự trích từ corpus mở (Wikipedia CC BY-SA, Simple Wikipedia) hoặc dùng Google Books Ngram (qua wordfreq hoặc trực tiếp), sau đó cho LLM soạn câu ví dụ gốc.

### Cited Findings
- ACL do Pearson tạo, trích từ phần viết của Pearson International Corpus of Academic English (PICAE, hơn 25 triệu từ). Ackermann & Chen công bố trên *Journal of English for Academic Purposes* năm 2013. Pearson ghi 2.469 mục, bài báo ghi 2.468. Tải được bản PDF và .xlsx — [Pearson PTE: ACL](https://pearsonpte.com/organizations/researchers/academic-collocation-list/); [Pearson teachers page](https://www.pearsonpte.com/teachers/academic-collocation/)
- Không tìm thấy trang license/điều khoản riêng cho ACL trong kết quả tìm kiếm — [Pearson PTE: ACL](https://pearsonpte.com/organizations/researchers/academic-collocation-list/)
- wordfreq có dùng dữ liệu Google Books Ngrams, với điều kiện ghi công liệt kê trong README — [GitHub rspeer/wordfreq](https://github.com/rspeer/wordfreq)

### Inferences
- Bản thân một collocation như "conduct research" khó được bảo hộ bản quyền vì là dữ kiện ngôn ngữ. Cái được bảo hộ là *tuyển tập* (selection/arrangement) và các câu ví dụ. Vì vậy có thể dùng ACL để *kiểm tra độ phủ* của collocation tự trích, nhưng không import nguyên file vào app.
- Pipeline đề xuất: trích bigram/trigram có PMI hoặc log-Dice cao từ dump Wikipedia hoặc Simple Wikipedia (CC BY-SA), lọc theo headword NGSL/NAWL, rồi LLM viết câu ví dụ gốc và một model khác kiểm.

### Gaps
- License Google Books Ngram dataset. Theo hiểu biết nền là CC BY 3.0 **[CẦN XÁC MINH]**.
- BNC/BNC2014 và COCA: theo hiểu biết nền, đều có thỏa thuận người dùng, cấm tái phân phối văn bản hay dữ liệu n-gram đầy đủ **[CẦN XÁC MINH]**. Chưa tra trong phiên này.
- Chưa có điều khoản chính thức của ACL. Nếu muốn dùng nhiều thì nên email Pearson.

---

## 3. Văn bản đọc & dữ liệu biểu đồ (Wikipedia, The Conversation, Gutenberg, Simple Wikipedia, Wikinews, VOA, OWID, open data)

### Takeaway
Văn bản *được phép sửa/rút gọn* (điều cần cho bài đọc dạng IELTS) có từ Wikipedia/Simple Wikipedia (CC BY-SA), Gutenberg (public domain ở Mỹ) và phần VOA do chính VOA sản xuất (public domain). The Conversation và văn bản của OWID là **No-Derivatives về thực chất**: không được biên tập lại thành bài đọc IELTS, chỉ được trích đoạn đầu và link. **Biểu đồ và data của OWID là CC BY**, rất hợp cho Writing Task 1.

### Cited Findings
- **The Conversation:** dùng CC BY-ND 4.0. Chỉ được sửa để phản ánh thay đổi về thời gian, địa điểm, văn phong biên tập; sửa khác phải có tác giả duyệt. Được trích vài dòng/đoạn đầu kèm link "Read the full article on The Conversation". Phải ghi công tác giả, cơ quan và The Conversation, kèm page view counter. Ảnh cần kiểm tra license riêng. Dùng trong sách giáo khoa/tài liệu thi có thể phải trả phí (liên hệ globalrepublish@theconversation.com). Dịch cần tác giả đồng ý. Không được tái bản có hệ thống mọi bài — [The Conversation republishing guidelines](https://theconversation.com/republishing-guidelines)
- **VOA:** "All text, audio and video material produced exclusively by the Voice of America is in the public domain." Tài liệu bên thứ ba (đặc biệt là AP) không thuộc public domain. Ghi công cho voanews.com/VOA. Thương hiệu "Voice of America" không được dùng cho mục đích thương mại — [VOA Learning English terms](https://learningenglish.voanews.com/p/6021.html)
- VOA ngừng hoạt động cốt lõi vào tháng 10/2025, sau khi gần như toàn bộ nhân viên bị cho nghỉ hành chính từ tháng 3/2025 — [Dawn](https://www.dawn.com/news/1939041). Một nguồn thứ cấp cho biết voanews.com cập nhật lần cuối ngày 14/3/2025 — [Walcott Substack](https://johnwalcott.substack.com/p/americas-silenced-voice)
- **Wikinews:** Hội đồng quản trị Wikimedia Foundation công bố ngày 30/3/2026 quyết định đóng mọi phiên bản ngôn ngữ, hiệu lực từ 4/5/2026. Các trang chuyển sang read-only, nội dung vẫn truy cập được — [heise](https://heise.de/en/news/Wikimedia-Foundation-is-shutting-down-news-project-Wikinews-11249432.html?view=print); [WMF Bulletin 2026/09](https://meta.wikimedia.org/wiki/Wikimedia_Foundation_Bulletin/2026/09); [Meta: Public consultation](https://meta.wikimedia.org/wiki/Public_consultation_about_Wikinews)
- **Our World in Data:** biểu đồ do OWID làm (có logo và tem CC BY) được dùng, tái bản, phân phối tự do nếu trích nguồn, không cần xin phép. Data do OWID tạo cũng là CC BY. Văn bản OWID được tái bản nhưng không được sửa ngoài thời gian/địa điểm/văn phong. **Data từ bên thứ ba (WHO, UN, World Bank…) theo license của nhà cung cấp.** Mẫu ghi công data: "Gapminder (2015); UN IGME (2025) – processed by Our World in Data" — [OWID FAQs](https://ourworldindata.org/faqs)

### Inferences
- Bài đọc kiểu IELTS cần paraphrase, cắt, gộp đoạn, nên **chỉ nên lấy nguyên liệu từ nguồn cho phép phái sinh**: Wikipedia, Simple Wikipedia (CC BY-SA, nên bài phái sinh cũng phải CC BY-SA kèm ghi công và link lịch sử), Gutenberg, VOA tự sản xuất. The Conversation chỉ nên dùng làm "đọc mở rộng": trích đoạn đầu và link ra.
- Cách an toàn hơn: dùng các nguồn trên làm *tài liệu dữ kiện* (dữ kiện không có bản quyền), rồi cho LLM viết bài đọc mới hoàn toàn. Vẫn lưu `source_urls` để đối chiếu sự thật, không cần ShareAlike nếu không chép câu chữ.
- VOA: kho lưu trữ cũ vẫn là public domain với phần VOA tự sản xuất, nhưng sẽ không có bài mới. Phải lọc bỏ bài/ảnh gắn AP/Reuters.
- Wikinews: kho tĩnh (read-only), có thể dùng làm nguồn tin cũ.
- Writing Task 1: dùng chart/data OWID (lọc nguồn có license mở như World Bank) rồi tự vẽ lại bằng chart lib của app. Lưu chuỗi ghi công đúng mẫu OWID.

### Gaps
- Wikipedia/Simple Wikipedia: theo hiểu biết nền là CC BY-SA 4.0 cho văn bản (từ 2023) **[CẦN XÁC MINH]**. Ảnh trên Commons có license riêng.
- Wikinews: theo hiểu biết nền là CC BY 2.5 **[CẦN XÁC MINH]**.
- Project Gutenberg: theo hiểu biết nền, văn bản public domain ở Mỹ nhưng license PG hạn chế dùng thương hiệu "Project Gutenberg" khi phân phối lại. Bỏ header/footer PG là được **[CẦN XÁC MINH]**. Văn phong cổ, ít phù hợp IELTS Academic.
- Chưa kiểm license World Bank, data.gov, data.gov.uk (theo hiểu biết nền: World Bank CC BY 4.0, data.gov.uk dùng Open Government Licence) **[CẦN XÁC MINH]**.

---

## 4. Audio / TTS (edge-tts, Kokoro, Piper, Coqui XTTS, LibriVox, VOA, Common Voice, TED)

### Takeaway
**Kokoro-82M (Apache-2.0)** là lựa chọn TTS offline sạch nhất về pháp lý. Piper phụ thuộc **license dataset của từng giọng** (ví dụ en_GB-alba là CC BY 4.0). edge-tts là client không chính thức dùng dịch vụ Read Aloud của Microsoft, chủ đã chấp nhận rủi ro nhưng nên coi là vùng xám. Coqui XTTS là phi thương mại. TED là CC BY-NC-ND, chỉ link hoặc nhúng.

### Cited Findings
- **Kokoro-82M:** weights dùng Apache-2.0 ("can be deployed anywhere from production environments to personal projects"). Dữ liệu huấn luyện là audio "permissive/non-copyrighted": public domain, Apache/MIT, audio tổng hợp từ TTS đóng; có thêm SIWIS (CC BY 4.0) và Koniwa (CC BY 3.0). v1.0 có 54 giọng, 8 ngôn ngữ — [Hugging Face hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)
- **Piper:** repo rhasspy/piper đã được archive ngày 6/10/2025 (read-only). Có nhiều giọng en_GB (alan, alba, cori, jenny_dioco, northern_english_male, semaine, southern_english_female, vctk…) và en_US (amy, lessac, libritts, ljspeech, ryan…). VOICES.md không ghi license từng giọng, license nằm trong MODEL_CARD — [VOICES.md](https://github.com/rhasspy/piper/blob/master/VOICES.md)
- Ví dụ MODEL_CARD của **en_GB-alba-medium**: dataset Edinburgh DataShare 10283/3270, License CC BY 4.0 — [MODEL_CARD alba](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_GB/alba/medium/MODEL_CARD)
- **edge-tts:** repo có file `LICENSE` và `gpl-3.0.txt`, tức suy ra là GPL-3.0. README không nói gì về ToS của Microsoft. Ghi chú: "Microsoft prevents the use of any SSML that could not be generated by Microsoft Edge itself" — [GitHub rany2/edge-tts](https://github.com/rany2/edge-tts)
- **VOA audio** do VOA tự sản xuất là public domain, tài liệu bên thứ ba thì không — [VOA terms](https://learningenglish.voanews.com/p/6021.html)

### Inferences
- edge-tts gọi endpoint nội bộ của Edge, không phải Azure Speech API có hợp đồng. Rủi ro chính là Microsoft chặn hoặc đổi API (mất dịch vụ) và vi phạm ToS dịch vụ, hơn là rủi ro bản quyền đối với file audio. Cho app cá nhân phi thương mại thì chấp nhận được (chủ đã đồng ý), nhưng **nên có phương án dự phòng là Kokoro**, cache file mp3 cục bộ, và lưu `tts_engine` trong metadata để có thể render lại.
- Piper: chỉ chọn giọng có MODEL_CARD ghi CC BY / CC0 / public domain, và lưu attribution của dataset.
- Giọng Anh-Anh cho IELTS: Piper en_GB-alba (Scottish), en_GB-cori/southern_english_female. Kokoro có giọng British (tiền tố "b"), nhưng trang chính không liệt kê nên cần xem VOICES.md.

### Gaps
- Danh sách giọng British trong Kokoro VOICES.md chưa đọc.
- License dataset của các giọng Piper khác (lessac theo hiểu biết nền có điều khoản Blizzard 2013 hạn chế; ljspeech public domain) **[CẦN XÁC MINH]**. Bản fork mới OHF-Voice/piper1-gpl có thể dùng GPL-3.0 **[CẦN XÁC MINH]**.
- Coqui XTTS-v2: trang CPML trả 404 (Coqui đã đóng cửa). Theo hiểu biết nền, Coqui Public Model License chỉ cho dùng phi thương mại **[CẦN XÁC MINH]**. Không cần thiết vì đã có Kokoro.
- LibriVox (public domain dedication), Common Voice (CC0) và TED (CC BY-NC-ND 4.0) chưa được tra trong phiên này **[CẦN XÁC MINH]**. Lưu ý thêm: Common Voice là giọng đọc câu ngắn, hữu ích cho nghe accent nhưng không có ngữ cảnh IELTS. TED dạng ND thì không cắt clip được, chỉ nhúng hoặc link.

---

## 5. Phát âm / IPA (Britfone, CMUdict, Wiktionary)

### Takeaway
Britfone (MIT, IPA giọng Anh-Anh RP, hơn 16k mục) là nguồn IPA British phù hợp nhất cho IELTS. CMUdict dùng cho Mỹ hoặc làm fallback. Wiktionary (CC BY-SA) có thể tra bổ sung.

### Cited Findings
- **Britfone:** từ điển British English (RP), hơn 16.000 mục, IPA có trọng âm chính/phụ, kèm từ điển mở rộng cho dấu câu và viết tắt. Bản đầu lấy từ cmudict, phần đặc thù Anh lấy từ Wiktionary, Wikipedia và tham khảo các từ điển Collins/Oxford/Cambridge/Macmillan. License MIT (thông tin lấy qua mirror, chưa thấy trực tiếp trên GitHub) — [npm britfone](https://www.npmjs.com/package/britfone); [mirror repo JoseLlarena/Britfone](https://github-users.yhajoa.workers.dev/JoseLlarena/Britfone)
- CMUdict có repo chính thức — [GitHub cmusphinx/cmudict](https://github.com/cmusphinx/cmudict)
- ipa-dict (open-dict-data) là một nguồn IPA đa ngôn ngữ khác — [GitHub open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict)

### Inferences
- Thứ tự ưu tiên IPA: Britfone, rồi CMUdict chuyển ARPAbet sang IPA (đánh dấu `ipa_variant: "US"`), rồi Wiktionary.
- Britfone có tham khảo từ điển thương mại khi biên soạn. Đó là trách nhiệm của tác giả, còn người dùng nhận theo MIT.

### Gaps
- License CMUdict chưa tra trực tiếp. Theo hiểu biết nền là BSD-style, cho dùng tự do **[CẦN XÁC MINH]**.
- Wiktionary: theo hiểu biết nền là CC BY-SA 4.0 (kèm GFDL) **[CẦN XÁC MINH]**.
- License MIT của Britfone cần xác nhận trên github.com/JoseLlarena/Britfone.

---

## 6. Đề thi: có lấy hợp pháp được đề IELTS mới nhất không? (IELTS.org, BC/IDP, ieltsonlinetests, Cambridge IELTS, forecast, "recent actual tests")

### Takeaway
**Không có kênh hợp pháp nào để lấy "đề thi thật mới nhất" đưa vào app.** Tài liệu trên IELTS.org chỉ cho dùng cá nhân, phi thương mại, *cấm đăng lại lên website khác và cấm chỉnh sửa*. Vì vậy app chỉ được **link ra** đề mẫu chính thức. Các trang "recent actual tests"/forecast là đề do thí sinh nhớ lại hoặc biên soạn lại, nguồn gốc pháp lý đáng ngờ. Cách hợp pháp: học format và xu hướng chủ đề, rồi tự viết câu hỏi gốc.

### Cited Findings
- **IELTS.org:** "The material is made available to you for your personal and non-commercial use only", với điều kiện ghi công IELTS Partners và tuân mọi thông báo. Cấm dùng cho mục đích khác khi chưa có phép bằng văn bản, kể cả dùng thương mại, **đăng lại trên website khác**, **sửa đổi tài liệu**, hay xóa thông báo bản quyền. Xin phép qua copyright request form, nhưng việc nộp form "does not constitute a valid licence". Cấm mọi cách dùng thương hiệu IELTS — [IELTS copyright and trade mark statement](https://ielts.org/legal/ielts-copyright-and-trade-mark-statement)
- IELTS đồng sở hữu bởi British Council, IDP IELTS và Cambridge University Press & Assessment. "IELTS", logo, 雅思 là thương hiệu đã đăng ký — [IELTS copyright notice](https://www.ielts.org/policy/copyright-notice)
- **IDP:** tài liệu trên website được bảo hộ bản quyền theo luật Úc, cấm sao chép hay sửa khi chưa được phép bằng văn bản — [IDP legal notices](https://ielts.idp.com/france/legal-notices)
- **Cambridge:** bản quyền tài liệu trong dịch vụ thuộc Cambridge — [IELTS Results Service T&C](https://ielts.org/legal/ielts-results-service-terms-and-conditions)
- **ieltsonlinetests.com:** URL /terms-of-use trả 404 và tìm kiếm không ra trang điều khoản — [ieltsonlinetests.com/terms-of-use (404)](https://ieltsonlinetests.com/terms-of-use)

### Inferences
- "Personal use" ở đây là người học tự làm đề trên IELTS.org. Copy đề vào web app, kể cả app cá nhân nhưng host công khai, là "republishing on another website", và chuyển sang dạng game là "modifying". Cả hai đều bị cấm. → **Chỉ deep-link** sang trang sample test chính thức (IELTS.org, British Council "Road to IELTS"/takeielts, IDP).
- Sách Cambridge IELTS 1–20: có bản quyền đầy đủ, loại khỏi app (không scan, không trích, không chép transcript).
- Forecast (IELTS Mentor, IELTS Fighter, IPP…): một chủ đề hay ý tưởng ("Describe a time you helped someone") không được bảo hộ như *ý tưởng*, nhưng **danh sách biên soạn và cách diễn đạt câu hỏi của từng trang thì có thể được bảo hộ**. Có thể ghi nhận *chủ đề trừu tượng* (ví dụ: "người giúp đỡ", "công nghệ trong giáo dục") để thống kê xu hướng, rồi tự viết lại câu hỏi theo format Part 1/2/3. Không copy nguyên văn danh sách.
- "Recent actual tests": nội dung do thí sinh nhớ lại và tiết lộ. Nhiều khả năng vi phạm cam kết bảo mật đề của thí sinh và quyền của IELTS Partners (xem Gaps), nên nên tránh hoàn toàn.

### Gaps
- Chưa đọc trực tiếp IELTS Test Terms & Conditions ([ielts.org/legal/ielts-terms-conditions](https://ielts.org/legal/ielts-terms-conditions)). Theo hiểu biết nền, thí sinh cam kết không tiết lộ hay chia sẻ nội dung đề **[CẦN XÁC MINH]**.
- Không tìm được điều khoản sử dụng của ieltsonlinetests.com, IELTS Mentor, IELTS Fighter, IPP. Mặc định coi là "all rights reserved".
- Không có dữ liệu chính thức về "xu hướng đề" từ IELTS Partners. Forecast là suy đoán của bên thứ ba.

---

## 7. Dữ liệu lỗi ngữ pháp / learner corpora (W&I+LOCNESS, Lang-8, NUCLE) cho mẫu lỗi người Việt

### Takeaway
Cả ba corpus (W&I+LOCNESS, Lang-8, NUCLE) **chỉ cho dùng phi thương mại/nghiên cứu**, và Lang-8, NUCLE phải nộp đơn xin. Dùng nội bộ để *phân tích thống kê kiểu lỗi* và tự viết bài tập là hợp lý, **không nên đăng lại câu gốc của người học trong app**.

### Cited Findings
- Các corpus BEA-2019 "are subject to similar licences and may only be used for non-commercial purposes". W&I+LOCNESS v2.1 tải trực tiếp. Lang-8 và NUCLE cần điền form (Lang-8 gửi link qua email ngay, NUCLE gửi trong vòng 1 ngày). NUCLE gồm 1.400 bài luận của sinh viên NUS (chủ yếu người châu Á) — [BEA 2019 Shared Task](https://www.cl.cam.ac.uk/research/nl/bea2019st/)
- Hugging Face gắn tag license "other-wi-license" và "other-locness-license", không nêu nội dung — [HF bea2019st/wi_locness](https://huggingface.co/datasets/bea2019st/wi_locness/blob/main/README.md?code=true)

### Inferences
- Không corpus nào ở trên tách riêng người Việt (NUCLE là "mainly Asian", W&I có metadata L1/quốc gia tùy phiên bản). Mẫu lỗi đặc thù người Việt (mạo từ, số nhiều, thì, chủ ngữ giả, giới từ) nên biên soạn thủ công từ tài liệu nghiên cứu SLA, rồi chỉ dùng corpus để **đếm tần suất loại lỗi** (ví dụ theo nhãn ERRANT: ART, NOUN:NUM, VERB:TENSE, PREP).
- App cá nhân phi thương mại khớp với "non-commercial". Nhưng vì câu gốc là văn bản của người học và có license riêng, bài tập trong app nên là câu do LLM viết mô phỏng kiểu lỗi.

### Gaps
- Văn bản license nguyên văn của W&I, LOCNESS, NUCLE, Lang-8 chưa đọc được (nằm trong gói tải hoặc form).
- Chưa tìm được corpus người học Việt Nam có license mở.

---

## 8. Áp dụng cho Lexicon Arcade

### Takeaway
Nên lấy CEFR-J + Octanove làm xương sống CEFR, NGSL/NAWL làm danh sách headword, wordfreq làm tần suất, Britfone làm IPA, Kokoro (dự phòng cho edge-tts) làm audio, OWID làm dữ liệu cho Task 1, và văn bản CC BY-SA/PD làm nguồn dữ kiện. Mọi "đề giống thật" là nội dung gốc do LLM soạn theo format, model khác kiểm, và có link ra đề mẫu chính thức.

### Cited Findings
- Căn cứ license của từng nguồn đã dẫn ở mục 1–7: [NGSL](https://www.newgeneralservicelist.com/new-general-service-list), [CEFR-J/Octanove](https://github.com/openlanguageprofiles/olp-en-cefrj), [wordfreq](https://github.com/rspeer/wordfreq), [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), [Piper alba](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_GB/alba/medium/MODEL_CARD), [OWID](https://ourworldindata.org/faqs), [VOA](https://learningenglish.voanews.com/p/6021.html), [The Conversation](https://theconversation.com/republishing-guidelines), [IELTS.org](https://ielts.org/legal/ielts-copyright-and-trade-mark-statement), [BEA-2019](https://www.cl.cam.ac.uk/research/nl/bea2019st/)

### Inferences

**A. Nguồn nên dùng (xếp theo ưu tiên) và trường cần lưu**

| # | Nguồn | Dùng cho | License | Trường lưu trong DB (`source` / `attribution`) |
|---|---|---|---|---|
| 1 | CEFR-J Vocabulary Profile v1.5 | Nhãn CEFR A1–B2, POS | Miễn phí nghiên cứu/thương mại, phải trích dẫn | `cefr_source:"CEFR-J v1.5"`, `attribution:"CEFR-J Wordlist v1.5, Tono Laboratory, TUFS"`, `source_url` |
| 2 | Octanove Vocabulary Profile C1/C2 v1.0 | Nhãn C1–C2 | CC BY-SA 4.0 | `cefr_source:"Octanove C1C2 v1.0"`, `license:"CC BY-SA 4.0"`, `attribution:"Octanove Labs"` |
| 3 | NGSL 1.2 / NAWL / NGSL-Spoken / TSL / BSL | Headword, band tần suất, list học thuật | CC BY-SA 4.0 (NAWL/TSL/BSL cần xác nhận câu license) | `list:"NGSL 1.2"`, `rank`, `license:"CC BY-SA 4.0"`, `attribution:"Browne, C., Culligan, B., Phillips, J."` |
| 4 | wordfreq 3.x | Zipf frequency mọi từ | Data CC BY-SA 4.0, code Apache-2.0 | `zipf`, `freq_source:"wordfreq 3.0.2 (data ~2021)"`, kèm attribution nguồn con theo README |
| 5 | Britfone | IPA British | MIT (cần xác nhận) | `ipa_gb`, `ipa_source:"Britfone"`, giữ file LICENSE |
| 6 | CMUdict | IPA US/fallback | (BSD-style, cần xác minh) | `ipa_us`, `ipa_source:"CMUdict"` |
| 7 | Kokoro-82M | TTS offline, dự phòng | Apache-2.0 | `tts_engine:"kokoro-82m"`, `voice_id`, `generated_at` |
| 8 | edge-tts (chủ đã chấp nhận) | TTS chính hiện tại | Code GPL-3.0; dịch vụ Microsoft không chính thức | `tts_engine:"edge-tts"`, `voice_id`, cache mp3; cờ `re-renderable:true` |
| 9 | Piper (chỉ giọng CC BY/CC0/PD) | TTS British offline | Theo MODEL_CARD từng giọng | `voice_id`, `voice_dataset_license`, `voice_attribution` |
| 10 | OWID chart/data | Writing Task 1 | CC BY (data bên thứ ba theo license gốc) | `chart_source:"Our World in Data"`, `data_provider`, `attribution:"<Provider> (năm) – processed by Our World in Data"`, `source_url` |
| 11 | Wikipedia / Simple Wikipedia | Nguồn dữ kiện, tự trích collocation | CC BY-SA 4.0 (cần xác minh) | `fact_sources:[url, revision_id]`. Nếu chép câu chữ thì `license:"CC BY-SA 4.0"` và `attribution:"Wikipedia contributors"` |
| 12 | VOA (phần VOA tự sản xuất) | Văn bản/audio đọc-nghe, kho cũ | Public domain (loại bỏ AP/Reuters/ảnh bên thứ ba) | `source:"VOA Learning English"`, `credit:"voanews.com"`, `third_party_checked:true` |
| 13 | Wikinews (kho read-only) | Văn bản tin cũ | (CC BY 2.5, cần xác minh) | `attribution:"Wikinews contributors"`, `source_url` |
| 14 | W&I+LOCNESS / NUCLE / Lang-8 | **Chỉ phân tích nội bộ** tần suất loại lỗi | Phi thương mại/nghiên cứu | Không lưu câu gốc vào app, chỉ lưu thống kê `error_type_freq` |

**B. Chỉ tham khảo/link, không chép vào DB:** EVP (Cambridge), Oxford 3000/5000, Coxhead AWL, AVL (Gardner & Davies), Academic Collocation List (Pearson), COCA samples, SUBTLEX (dùng gián tiếp qua wordfreq), The Conversation (chỉ trích đoạn đầu và link, không biên tập), TED (chỉ nhúng/link).

**C. Tránh hoàn toàn:** sách Cambridge IELTS 1–20 và bản scan/transcript; nội dung đề mẫu IELTS.org/BC/IDP sao chép vào app; ieltsonlinetests.com (không có điều khoản công khai rõ, mặc định all rights reserved); các trang "recent actual tests"/"đề thi thật tháng X"; danh sách forecast chép nguyên văn; Coqui XTTS (phi thương mại, công ty đã đóng); giọng Piper có dataset license không rõ.

**D. Quy trình hợp pháp cho nội dung "giống đề mới nhất"**
1. **Phân tích format** từ tài liệu chính thức: đọc mô tả format và sample trên IELTS.org/BC/IDP. Chỉ ghi lại *đặc tả* (số câu, dạng câu hỏi, thời lượng, độ dài bài đọc), không chép câu hỏi.
2. **Theo dõi xu hướng chủ đề**: đọc forecast quý (IELTS Mentor, IELTS Fighter, IPP), trích **nhãn chủ đề trừu tượng** vào bảng `topic_trends(topic, quarter, n_sources)`, không lưu nguyên văn câu hỏi.
3. **Thu dữ kiện** từ nguồn mở (Wikipedia, OWID, VOA-PD, open data chính phủ) và lưu `fact_sources`.
4. **LLM A soạn đề gốc** theo đặc tả và chủ đề (bài đọc, câu hỏi T/F/NG, matching headings, Task 1 dựa trên data OWID, cue card Part 2 tự viết).
5. **LLM B kiểm**: đúng format, đáp án duy nhất, khớp sự thật với `fact_sources`, mức CEFR qua CEFR-J/Octanove, và kiểm tra chống trùng nguyên văn với nguồn (n-gram overlap thấp so với forecast và bài gốc).
6. **Audio** bằng edge-tts (dự phòng Kokoro), lưu metadata engine.
7. **Mock test thật**: nút "Làm đề mẫu chính thức" deep-link sang IELTS.org / takeielts.britishcouncil.org / ielts.idp.com, không nhúng nội dung của họ.
8. Gắn nhãn trong UI: "Đề luyện tập gốc theo format IELTS, không phải đề thi thật". Không dùng logo hay thương hiệu IELTS (IELTS.org cấm mọi cách dùng thương hiệu).

### Gaps
- Các mục **[CẦN XÁC MINH]** ở trên (Wikipedia/Wikinews license, CMUdict, Common Voice, LibriVox, TED, Gutenberg, Google Books Ngram, Oxford/EVP/AWL/COCA terms, IELTS Test T&C về bảo mật đề) nên được kiểm tra trước khi import dữ liệu thật.
- Chưa đối chiếu độ phủ giữa CEFR-J (khoảng 7.8k mục theo hiểu biết nền, **[CẦN XÁC MINH]**) với NGSL+NAWL. Có thể còn từ không có nhãn CEFR, cần fallback bằng band wordfreq.
