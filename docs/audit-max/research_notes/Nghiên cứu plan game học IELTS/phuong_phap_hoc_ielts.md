# Phương pháp học ngoại ngữ dựa trên bằng chứng & cách luyện từng kỹ năng IELTS Academic (người Việt, band ~6.0 → 8.0)

> Ghi chú cho người tổng hợp: Mỗi nhận định có nguồn đi kèm. Mức bằng chứng ghi là **[MẠNH]** (meta-analysis/benchmark lớn/tài liệu chính thức), **[TRUNG BÌNH]** (nghiên cứu đơn lẻ, review tường thuật, số liệu từ nguồn thứ cấp), **[YẾU]** (blog, ý kiến giáo viên, suy luận). Những gì chưa xác minh được trong phiên nghiên cứu này nằm ở mục "Gaps". Không bịa số liệu.

## 1. Spaced repetition: SM-2 hay FSRS, retention mục tiêu, số thẻ mới/ngày, cách thiết kế thẻ

### Takeaway
FSRS (mô hình DSR: độ khó, độ ổn định, khả năng nhớ lại) dự đoán việc quên chính xác hơn SM-2 với đa số người dùng trong benchmark khoảng 10.000 bộ sưu tập Anki. Anki khuyến nghị desired retention mặc định 0.90, không nên vượt 0.97. Cứ 20 thẻ mới/ngày thì có khoảng 200 lượt ôn/ngày. Thẻ nên theo "minimum information principle" của Wozniak: mỗi thẻ chỉ hỏi một ý tối thiểu, ưu tiên cloze.

### Cited Findings
- **[MẠNH]** Benchmark srs-benchmark: đánh giá trên 9.999 collection (không tính ôn trong cùng ngày) = 349.923.850 lượt ôn, và 10.000 collection (có tính ôn trong ngày) = 519.296.315 lượt ôn. Bộ dữ liệu gốc là 10k user, khoảng 727 triệu lượt ôn; còn có bộ 20k user, khoảng 1,7 tỷ lượt ôn — [open-spaced-repetition/srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark)
- **[MẠNH]** Kết quả benchmark (không tính ôn trong ngày; Log Loss↓ / RMSE(bins)↓ / AUC↑): FSRS-7 recency (100 epochs) 0.3363 / 0.0576 / 0.724; FSRS-6 0.3460 / 0.0653 / 0.703; FSRS-5 0.3561 / 0.0742 / 0.701; FSRS v4 0.3726 / 0.0838 / 0.685; baseline AVG 0.3945 / 0.1034 / 0.500. Mô hình mạng nơ-ron RWKV-Instant tốt nhất (Log Loss 0.2773), nhưng FSRS là thuật toán nhẹ, dễ cài vào game — [srs-benchmark](https://github.com/open-spaced-repetition/srs-benchmark)
- **[TRUNG BÌNH]** Trang srs-benchmark (bản đã fetch) **không** in kết quả của SM-2 dưới dạng văn bản (bảng "superiority" là ảnh). Nguồn thứ cấp nói FSRS-6 với tham số mặc định tốt hơn SM-2 ở khoảng 99,5% người dùng, và FSRS-5 tốt hơn "SM-2 trainable" ở 97,4% trường hợp. Một dev Anki lưu ý rằng việc báo cáo theo "% người dùng" mới có gần đây; trước đó chỉ so log loss/RMSE trung bình — [Expertium Benchmark](https://expertium.github.io/Benchmark.html); [DEV Community](https://dev.to/palachdigital_20fd679f5fe/why-fsrs-is-better-than-sm-2-2m17); [Anki forum](https://forums.ankiweb.net/t/has-anyone-done-a-live-comparison-of-fsrs-and-sm2-as-implemented-in-anki-it-looks-like-no-so-can-anyone-help-me-set-it-up/34996)
- **[TRUNG BÌNH]** SM-2 là thuật toán duy nhất trong benchmark vốn không được thiết kế để dự đoán xác suất nhớ, nên người làm benchmark phải thêm công thức để chấm nó — [Expertium Benchmark](https://expertium.github.io/Benchmark.html)
- **[TRUNG BÌNH]** Có báo cáo trên forum rằng FSRS ≥5 bị thoái lui ở một nhóm nhỏ người dùng bấm "Again" nhiều với thẻ mới hoặc thẻ đang học — [Anki forum](https://forums.ankiweb.net/t/fsrs-5-is-a-significant-regression-for-a-minority-of-users-who-use-again-a-lot-on-new-and-learn-cards/66593)
- **[MẠNH – tài liệu chính thức]** Anki manual nói desired retention mặc định 90% "offers a good balance of retention and workload". Trên 90% thì khối lượng ôn "increases very quickly"; trên 97% thì có thể "overwhelming". Retention cao hơn đồng nghĩa với khoảng ôn ngắn hơn và nhiều lượt ôn mỗi ngày hơn — [Anki Manual – Deck Options](https://docs.ankiweb.net/deck-options.html)
- **[MẠNH – tài liệu chính thức]** Anki: học 20 thẻ mới/ngày thì dự kiến khoảng 200 lượt ôn/ngày. Nếu gánh ôn quá nặng thì giảm số thẻ mới. Với FSRS nên dùng ít learning step và các step ngắn hơn 1 ngày ("10m or 30m are good") — [Anki Manual](https://docs.ankiweb.net/deck-options.html)
- **[TRUNG BÌNH – chuyên gia, không peer-review]** Wozniak, "Twenty rules of formulating knowledge" (1999): các quy tắc xếp theo mức quan trọng. Rule 4, minimum information principle, yêu cầu mỗi lần ôn chỉ truy xuất một lượng thông tin tối thiểu. Cloze deletion được khuyên dùng để chuyển kiến thức trong sách thành thẻ SRS — [SuperMemo – 20 rules](https://www.supermemo.com/en/archives1990-2015/articles/20rules); [bản lưu gwern](https://www.gwern.net/docs/www/www.supermemo.com/b8dff5897e857f429b8d60f585a60003b38a831d.html)
- **[TRUNG BÌNH]** Ví dụ áp dụng: tách một câu hỏi "kể tên 3 nước" thành 3 thẻ cloze, mỗi thẻ hỏi 1 nước — [nishio Scrapbox](https://scrapbox.io/nishio-en/(3.5.4)_The_20_rules_to_structure_knowledge)

### Inferences
- Lexicon Arcade nên dùng FSRS (FSRS-6 trở lên; có thư viện mã nguồn mở `ts-fsrs`/`py-fsrs` của open-spaced-repetition) thay vì SM-2. Đặt desired retention mặc định 0.90, cho phép chỉnh trong khoảng 0.85–0.95. Riêng giai đoạn nước rút 2–4 tuần trước thi có thể nâng lên 0.93–0.95 cho bộ từ "core IELTS".
- Thẻ mới/ngày: theo tỷ lệ của Anki (~10 lượt ôn cho mỗi thẻ mới, ở trạng thái ổn định), người đi làm có 20–30 phút SRS/ngày nên giữ 10–20 thẻ mới/ngày. Nên có "van tự động": khi hàng đợi ôn quá khoảng 150–200 thẻ thì tạm dừng thẻ mới.
- Thẻ từ vựng cho band 7–8 nên là cloze trong collocation/câu ngắn (ví dụ "___ a significant role" → *play*), không phải thẻ cặp "từ ↔ nghĩa tiếng Việt". Làm vậy thì vừa đúng minimum information principle, vừa luyện được collocation.

### Gaps
- Chưa lấy được con số chính thức "% user FSRS > SM-2" từ bảng ảnh của srs-benchmark; con số 99,5%/97,4% là từ nguồn thứ cấp.
- Trang wiki "ABC of FSRS" đã chuyển chỗ (sang awesome-fsrs), nên chưa đọc được trang "The Optimal Retention" của Jarrett Ye (có tính retention tối ưu theo workload). Các bài KDD 2022 / IEEE TKDE của Jarrett Ye (MaiMemo) mới chỉ thấy được tham chiếu, chưa đọc.
- Chưa xác minh toàn văn 20 quy tắc của Wozniak (mới thấy trích đoạn).

## 2. Khoa học học tập: retrieval practice, spacing, interleaving, desirable difficulties, feedback, elaboration/dual coding

### Takeaway
Hai kỹ thuật có bằng chứng mạnh nhất là practice testing và distributed practice (Dunlosky 2013, "high utility"). Interleaving có hiệu ứng trung bình (g = 0.42) nhưng **bất lợi với tài liệu dạng từ vựng** (g = −0.39); nó chỉ có lợi khi trộn các loại dễ nhầm với nhau. Feedback có hiệu ứng trung bình (d = 0.48) và phụ thuộc mạnh vào nội dung thông tin của feedback.

### Cited Findings
- **[MẠNH]** Dunlosky, Rawson, Marsh, Nathan & Willingham (2013, *Psychological Science in the Public Interest*) đánh giá 10 kỹ thuật. Hai kỹ thuật **high utility** là practice testing và distributed practice. **Moderate**: elaborative interrogation, self-explanation, interleaved practice. **Low**: summarization, highlighting, keyword mnemonic, imagery for text, rereading. "Low utility" nghĩa là bằng chứng còn hạn chế qua các điều kiện, không có nghĩa là vô dụng — [APS – Learning techniques](https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html); [PubMed 26173288](https://www.pubmed.gov/26173288/); [Kent State](https://www.kent.edu/kent/news/success/all-study-strategies-not-created-equal-according-kent-state-researchers)
- **[MẠNH]** Roediger & Karpicke (2006, *Psychological Science*): ở bài test sau 5 phút, đọc lại (restudy) cho kết quả tốt hơn. Ở bài test trễ (2 ngày, 1 tuần), nhóm được làm test trước đó nhớ tốt hơn hẳn, dù việc đọc lại làm người học *tự tin* hơn. Thông cáo báo chí của WashU ghi sau 1 tuần là 61% ở nhóm test lặp lại, so với 40% ở nhóm chỉ học. Con số này lấy từ thông cáo, chưa đối chiếu với bảng trong bài báo — [PubMed 16507066](https://pubmed.ncbi.nlm.nih.gov/16507066/); [WashU Source](https://source.washu.edu/2006/03/repeated-testtaking-better-for-retention-than-repeated-studying-research-shows/); [PDF bài báo](https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf)
- **[MẠNH]** Adesope, Trevisan & Sundararajan (2017, *Review of Educational Research* 87(3), 659–701) là meta-analysis về practice testing: có 272 effect size độc lập và 15.472 người tham gia; practice test tốt hơn restudy. **Có mâu thuẫn về con số:** một review trên PMC dẫn Hedges' g = 0.70; con số g = 0.61 (hay được trích) chưa được xác minh. Số bài báo gộp cũng lệch nhau giữa các nguồn (118 hay 188) — [WSU repository](https://rex.libraries.wsu.edu/esploro/outputs/journalArticle/Rethinking-the-Use-of-Tests-A/99900601154801842); [PMC10409703](https://pmc.ncbi.nlm.nih.gov/articles/PMC10409703); [Edmentum](https://edmentum.com/articles/5-proven-ways-to-get-the-most-out-of-practice-testing)
- **[MẠNH]** Cepeda et al. (2008, *Psychological Science* 19(11)) có hơn 1.350 người tham gia, khoảng cách ôn tới 3,5 tháng, test trễ tới 1 năm. Kéo dài khoảng cách ôn ban đầu làm tăng điểm, sau đó giảm dần. Khoảng cách tối ưu tăng theo thời gian tới bài test, nhưng tính theo *tỷ lệ* thì giảm: khoảng 20–40% nếu thi sau 1 tuần, khoảng 5–10% nếu thi sau 1 năm — [PubMed 19076480](https://pubmed.ncbi.nlm.nih.gov/19076480/); [eScholarship PDF](https://escholarship.org/uc/item/1n15d7xr.pdf)
- **[MẠNH]** Brunmair & Richter (2019, *Psychological Bulletin*) gộp 59 nghiên cứu, 238 effect size, cho hiệu ứng interleaving tổng thể **g = 0.42**. Riêng toán g = 0.34. Văn bản thuyết minh cho kết quả không rõ ràng. **Tài liệu dạng từ (word lists) nghiêng về học theo khối (blocking): g = −0.39.** Interleaving hiệu quả hơn khi các loại *giống nhau giữa các nhóm*, *khác nhau trong cùng nhóm*, và khi tài liệu phức tạp. I² = 77% — [PubMed 31556629](https://pubmed.ncbi.nlm.nih.gov/31556629/); [PDF tác giả](https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf)
- **[MẠNH]** Wisniewski, Zierer & Hattie (2020, *Frontiers in Psychology*) gộp 435 nghiên cứu, k = 994, N > 61.000, cho hiệu ứng feedback **d = 0.48** (trung bình), với dị biệt lớn. Tác động phụ thuộc mạnh vào *nội dung thông tin* của feedback, và lớn hơn với mục tiêu nhận thức/kỹ năng vận động so với động lực/hành vi. Các tổng hợp Visible Learning trước đó báo 0.70–0.79 (cao hơn) — [Frontiers](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.03087/full); [PMC6987456](https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456)

### Inferences
- Game nên lấy **truy xuất** (gõ/nói đáp án) làm mặc định, tránh "lật thẻ xem". Hiệu ứng testing mạnh nhất ở test trễ, nên cần đo tiến bộ bằng các bài kiểm tra trễ (sau 1 tuần) thay vì điểm trong phiên.
- Với kỳ thi cách khoảng 3–6 tháng, theo Cepeda thì khoảng ôn tối ưu cho tài liệu chưa vào SRS (ví dụ bộ đề, cấu trúc bài viết) là khoảng 1–3 tuần (suy luận từ tỷ lệ 5–20%).
- **Interleaving:** không nên trộn ngẫu nhiên từ vựng mới khi mới học (blocking tốt hơn với word lists). Nên interleave *các dạng câu hỏi dễ nhầm* như TRUE/FALSE/NOT GIVEN với YES/NO/NOT GIVEN, Matching Headings với Matching Information, và các dạng biểu đồ Task 1, vì đây là "giống giữa nhóm" đúng như moderator của Brunmair & Richter.
- **Feedback** phải là "task-level + process-level": chỉ ra lỗi cụ thể và cách sửa. Điểm số hay huy hiệu thuần túy ít giá trị thông tin.
- "Desirable difficulties" (Bjork): bằng chứng gián tiếp nằm ở testing, spacing và interleaving nói trên. Từ đó suy ra mục tiêu vùng thành công khoảng 80–90% ở SRS (khớp retention 0.85–0.90).

### Gaps
- Chưa đọc trực tiếp nguồn Bjork về "desirable difficulties", Hattie & Timperley (2007, mô hình 4 cấp feedback), hay nghiên cứu dual coding (Paivio/Mayer). Tôi biết chúng qua kiến thức nền nhưng chưa xác minh trong phiên này, nên không đưa effect size cụ thể.
- Con số g chính xác của Adesope 2017 (0.61 hay 0.70) cần kiểm tra bảng tổng trong toàn văn.
- "Vùng 85%" (Wilson et al. 2019, "Eighty Five Percent Rule") chưa được xác minh trong phiên này, nên chỉ coi là gợi ý.

## 3. SLA: Four Strands, ngưỡng từ vựng, input/output/noticing, lexical approach, extensive reading/listening, shadowing, dictation

### Takeaway
Khung cân bằng nhất là Four Strands của Nation, mỗi strand khoảng ¼ thời gian. Ngưỡng hiểu văn bản: 98% coverage là "đủ" và 95% là "tối thiểu"; đọc cần khoảng 8.000–9.000 word families, nghe khoảng 6.000–7.000. Extensive reading có hiệu ứng nhỏ–trung bình và mạnh hơn ở người lớn/EFL. Shadowing có bằng chứng cho phát âm và độ trôi chảy, nhưng bằng chứng cho nghe hiểu chủ yếu là nghiên cứu nhỏ ở Nhật. Chưa tìm được meta-analysis nào về dictation.

### Cited Findings
- **[MẠNH – khung lý thuyết có ảnh hưởng]** Nation (2007), Four Strands: meaning-focused input (nghe/đọc hiểu nghĩa), meaning-focused output (nói/viết), language-focused learning (học có chủ đích về từ, ngữ pháp, phát âm), fluency development. Các strand có lượng thời gian "roughly equal"; một số nguồn coi language-focused learning là trần không quá ¼. Fluency development đòi hỏi người học đã biết gần như toàn bộ từ vựng trong tài liệu — [Nation 2007 (core.ac.uk)](https://core.ac.uk/download/357330216.pdf); [Cambridge excerpt](https://assets.cambridge.org/97810090/98359/excerpt/9781009098359_excerpt.pdf); [Sinosplice](https://sinosplice.com/life/archives/2019/06/12/the-four-strands-of-a-balanced-language-course)
- **[MẠNH]** Hu & Nation (2000) thử các mức coverage 80/90/95/100% trên văn bản hư cấu. Một số người đọc hiểu đủ ở 95%, nhưng đa số cần 98%. Laufer & Ravenhorst-Kalovski (2010) đề xuất 98% = sufficient và 95% = minimal (khả thi khi có hỗ trợ như từ điển). Nation (2006) cho rằng để đạt 98% cần khoảng 8.000–9.000 word families khi đọc và khoảng 6.000–7.000 khi nghe — [Nation 2006 PDF](https://www.wgtn.ac.nz/__data/assets/pdf_file/0018/1626120/2006-How-large-a-vocab.pdf); [Cambridge – replication](https://www.cambridge.org/core/journals/language-teaching/article/how-much-vocabulary-is-needed-to-use-english-replication-of-van-zeeland-schmitt-2012-nation-2006-and-cobb-2007/1D217A56A2E0056E67802A6A8360FDDE); [ERIC EJ887877](https://files.eric.ed.gov/fulltext/EJ887877.pdf)
- **[MẠNH]** Jeon & Day (2016), meta-analysis về extensive reading: 49 nghiên cứu, 71 mẫu, 5.919 người tham gia, hiệu ứng nhỏ–trung bình. Hiệu ứng mạnh hơn ở người lớn, ở bối cảnh EFL (so với ESL), và với truyện trên web (so với sách giấy). **Phản biện:** Hamada (2020) cho rằng hiệu ứng có thể bị thổi phồng; ước lượng đọc hiểu d = 0.55 hạ còn khoảng 0.37 sau khi hiệu chỉnh selection bias — [ScholarSpace – Jeon & Day](https://scholarspace.manoa.hawaii.edu/items/b52a5591-ec04-4026-816f-434361a4e899); [NFLRC](https://nflrc.hawaii.edu/rfl/item-detail/354); [Frontiers 2020](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.00617/full)
- **[TRUNG BÌNH]** Shadowing: một systematic review của Oxford (2024) tổng hợp tường thuật 44 nghiên cứu, không gộp effect size. Shadowing giúp comprehensibility, intelligibility, accentedness, fluency và prosody; kết quả ở mức âm đoạn (segmental) chưa kết luận được — [ORA Oxford](https://ora.ox.ac.uk/objects/uuid:3104cae1-3a6b-400a-b173-de44384238d2)
- **[TRUNG BÌNH]** Hamada (2018, *RELC Journal*): chưa có review tổng hợp nào về shadowing. Theo tác giả, shadowing chủ yếu cải thiện xử lý bottom-up (nhận diện âm, từ); các case study về nghe hiểu phần lớn làm ở Nhật — [SAGE RELC](https://journals.sagepub.com/doi/10.1177/0033688218771380)
- **[MẠNH – kỹ thuật lân cận]** Meta-analysis 2025 trên 79 nghiên cứu về High Variability Phonetic Training (HVPT), tức luyện nghe phân biệt âm với nhiều giọng/người nói, cho thấy hiệu quả với khả năng tri giác âm L2 — [SSLA – HVPT meta-analysis](https://www.cambridge.org/core/product/6ABB8C1F32D88D53EA8D05A4565E76F6/core-reader)

### Inferences
- Người học band 6.0 thường đang ở vùng khoảng 4.000–6.000 word families (suy luận, chưa có nguồn đo cho người Việt). Bài đọc IELTS học thuật có thể dưới mức 95% coverage, nên cần vừa mở rộng từ (SRS) vừa đọc rộng ở mức 98% coverage (graded/semi-authentic).
- Phân bổ theo Four Strands: SRS + sửa lỗi + luyện phát âm (language-focused) ≤ 25%; nghe/đọc lượng lớn (input) khoảng 25%; nói/viết có feedback (output) khoảng 25%; fluency (đọc nhanh, nói lại chủ đề quen) khoảng 25%.
- HVPT (nghe nhiều giọng, chọn đáp án tối thiểu) có bằng chứng mạnh hơn shadowing thuần, nên rất hợp làm mini-game minimal pairs cho âm cuối tiếng Việt.

### Gaps
- **Chưa xác minh trong phiên này** (không có nguồn đã fetch, nên report writer không nên khẳng định chi tiết): Krashen Input Hypothesis và các phê bình (McLaughlin 1987, White 1987...), Swain Output Hypothesis (1985/1995), Schmidt Noticing Hypothesis (1990), Lewis Lexical Approach (1993) và nghiên cứu collocation (ví dụ Boers, Webb). Đây là lý thuyết nền nổi tiếng nhưng tôi chưa thu thập trích dẫn kiểm chứng được.
- Không tìm được meta-analysis về **dictation** cho nghe hiểu, và không có dữ liệu về **narrow listening** (Krashen 1996).
- Không tìm được meta-analysis về extensive listening.

## 4. Đặc thù IELTS: band descriptors (bản 2023), quy đổi điểm, khác biệt 6/7/8, giờ học mỗi band

### Takeaway
Writing được chấm theo 4 tiêu chí ngang trọng số (Task 1: TA/CC/LR/GRA; Task 2: TR/CC/LR/GRA). Bản descriptor cập nhật từ tháng 5/2023 diễn đạt lại rõ hơn, không thay tiêu chí. Listening/Reading: 30/40 ≈ band 7, 35/40 ≈ band 8. **Không tìm thấy** hướng dẫn chính thức nào kiểu "~200 giờ/band".

### Cited Findings
- **[MẠNH – chính thức]** IELTS rà soát Writing scales; descriptor điều chỉnh được dùng chính thức từ 5/2023. Trước khi triển khai, một nghiên cứu chấm 1.000 bài theo cả hai bản và không thấy vấn đề đáng lo — [IELTS research summary (Clark et al. 2023)](https://ielts.org/researchers/our-research/research-reports/ielts-writing-scales-review-and-update-summary-overview); [PDF](https://ielts.org/cdn/Research/ielts-writing-scales-review-and-update-summary-overview-clark-et-al-2023.pdf)
- **[MẠNH – chính thức]** IELTS công bố toàn bộ assessment scales, gồm band descriptors và key assessment criteria chi tiết. Bốn tiêu chí Writing ngang trọng số; Task 2 dùng Task Response, Task 1 dùng Task Achievement — [IELTS – Writing band descriptors & key assessment criteria](https://ielts.org/news-and-insights/ielts-writing-band-descriptors-and-key-assessment-criteria); [PDF descriptors](https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-writing-band-descriptors.pdf)
- **[YẾU – ý kiến người luyện thi]** Bản 2023 chủ yếu dùng tiếng Anh dễ hiểu hơn; bốn Key Assessment Criteria không đổi — [e2language](https://www.e2language.com/blogs/ielts/changes-to-ielts-writing-assessment-criteria)
- **[MẠNH – chính thức, qua bản sao]** Speaking band 7 Fluency: "speaks at length without noticeable effort or loss of coherence", có thể còn chút do dự hoặc tự sửa. Band 7 Pronunciation: kiểm soát linh hoạt trọng âm và ngữ điệu ở phát ngôn dài, thỉnh thoảng lỗi; giọng (accent) ảnh hưởng tối thiểu tới mức dễ hiểu. Band 8 Pronunciation: dùng đầy đủ các đặc điểm phát âm một cách chính xác và tinh tế, duy trì suốt bài, nghe "effortless to understand". Band 8 Fluency: chỉ rất thỉnh thoảng lặp hoặc tự sửa. Lưu ý các bản sao không hoàn toàn khớp nhau, nên kiểm tra PDF ở ielts.org — [IELTS Speaking descriptors PDF](https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-speaking-band-descriptors.pdf); [Seedhouse et al. 2014 – IELTS research](https://ielts.org/cdn/Research/relationship-between-speaking-features-and-band-descriptors-seedhouse-et-al-2014.pdf)
- **[MẠNH – chính thức]** Reading Academic: 30 câu đúng ≈ band 7, 35 ≈ band 8. Listening: 30 ≈ 7, 35 ≈ 8. Ngưỡng chính xác dao động nhẹ giữa các đề — [IELTS – How IELTS is scored](https://ielts.org/for-test-takers/how-ielts-is-scored); [IELTS scoring in detail](https://ielts.org/organisations/ielts-for-organisations/ielts-scoring-in-detail)
- **[YẾU]** Không có nguồn chính thức IELTS/Cambridge nào nêu số giờ học cho mỗi band trong các tài liệu tìm được (Guide for Teachers, Guide for Organisations, Scores guide). Con số "130 guided learning hours" của Cambridge là của IGCSE, không áp dụng cho IELTS — [IELTS Guide for Teachers](https://ielts.org/cdn/ielts-guides/ielts-guide-for-teachers.pdf); [Cambridge IGCSE hours](https://help.cambridgeinternational.org/hc/en-gb/articles/203558501-What-are-the-recommended-number-of-teaching-hours-for-Cambridge-IGCSE)

### Inferences
- Lên 6.0 → 7.0 ở Listening/Reading nghĩa là từ khoảng 23 câu đúng (ước lượng; band 6 thường ở khoảng 23/40 theo các bảng quy đổi) lên 30/40. Lên 8.0 cần 35/40, tức là chỉ được sai ≤ 5 câu, nên **giảm lỗi bất cẩn** (chính tả, số ít/số nhiều, giới hạn số từ) quan trọng không kém tăng hiểu.
- Speaking 6→7 chủ yếu là: nói dài không gắng sức, dùng được từ ít phổ biến và idiomatic (dù còn sai), câu phức đa dạng với nhiều câu không lỗi, và phát âm dễ hiểu suốt bài. 7→8 là: lỗi hiếm và không hệ thống, phát âm "effortless to understand".
- Cụm "~200 giờ có hướng dẫn mỗi band" có thể bắt nguồn từ hướng dẫn CEFR "guided learning hours" của Cambridge English (khoảng 180–260 giờ cho mỗi cấp CEFR). **Chưa xác minh**, nên không dùng như dữ kiện.

### Gaps
- Không trích xuất được nguyên văn descriptor Writing band 6/7/8 (PDF bị nén, trang British Council bị timeout). Report writer nên đọc trực tiếp PDF chính thức. Các cụm khác biệt hay được nhắc ("frequent error-free sentences" ở band 7 so với "majority error-free" ở band 8, "less common lexical items" ở band 7, "uncommon lexical items" ở band 8, "clear position throughout" ở band 7 TR) là kiến thức nền **chưa xác minh** trong phiên này.
- Danh sách dạng câu hỏi Listening/Reading (multiple choice, matching, plan/map/diagram labelling, form/note/table/flow-chart/summary completion, sentence completion, short answer; Reading thêm TFNG/YNNG, matching headings/information/features/sentence endings) là kiến thức nền, chưa fetch nguồn chính thức (Cambridge test format page có trong kết quả tìm kiếm: [cambridgeenglish.org/exams/ielts/test-format](https://www.cambridgeenglish.org/exams/ielts/test-format/)).
- Không tìm được nguồn chính thức về giờ học cho mỗi band.

## 5. Phương pháp luyện từng kỹ năng (Listening, Reading, Writing, Speaking)

### Takeaway
Bằng chứng nghiên cứu *riêng cho IELTS* rất mỏng; phần lớn mẹo luyện thi là [YẾU]. Cách an toàn là gắn mỗi kỹ năng vào các cơ chế có bằng chứng mạnh: truy xuất + spacing (từ vựng), input lượng lớn ở 95–98% coverage, feedback có nội dung (writing/speaking), HVPT/shadowing (phát âm, nghe bottom-up).

### Cited Findings
- **Listening – [TRUNG BÌNH]** Shadowing cải thiện xử lý bottom-up và prosody/fluency, nhưng bằng chứng cho nghe hiểu chủ yếu là case study ở Nhật — [Hamada 2018](https://journals.sagepub.com/doi/10.1177/0033688218771380); [Oxford review 2024](https://ora.ox.ac.uk/objects/uuid:3104cae1-3a6b-400a-b173-de44384238d2)
- **Listening – [MẠNH, kỹ thuật lân cận]** Luyện tri giác với nhiều giọng/người nói (HVPT) hiệu quả theo meta-analysis 79 nghiên cứu, phù hợp mục tiêu "accent exposure" (IELTS dùng nhiều giọng Anh/Úc/Mỹ...) — [SSLA HVPT](https://www.cambridge.org/core/product/6ABB8C1F32D88D53EA8D05A4565E76F6/core-reader)
- **Listening – [TRUNG BÌNH]** Hướng dạy phát âm ở Việt Nam thường chỉ tập trung vào *sản xuất* âm mà bỏ qua vấn đề *tri giác*; cần luyện nghe phân biệt — [UT Austin report](https://repositories.lib.utexas.edu/handle/2152/ETD-UT-2009-08-245?show=full)
- **Reading – [MẠNH]** Ngưỡng 95–98% coverage, khoảng 8.000–9.000 word families để đọc thoải mái; ER có hiệu ứng nhỏ–trung bình ở người lớn EFL — [Nation 2006](https://www.wgtn.ac.nz/__data/assets/pdf_file/0018/1626120/2006-How-large-a-vocab.pdf); [Jeon & Day 2016](https://scholarspace.manoa.hawaii.edu/items/b52a5591-ec04-4026-816f-434361a4e899)
- **Reading – [MẠNH]** Interleaving có lợi khi các loại dễ nhầm với nhau (giống giữa nhóm), nên trộn các dạng câu hỏi tương tự (TFNG/YNNG) là có cơ sở — [Brunmair & Richter 2019](https://pubmed.ncbi.nlm.nih.gov/31556629/)
- **Writing – [MẠNH]** Feedback d = 0.48, mạnh khi giàu thông tin; tác động lớn hơn với kỹ năng nhận thức — [Wisniewski et al. 2020](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.03087/full)
- **Writing – [TRUNG BÌNH]** Lỗi viết của người Việt có tính hệ thống (word form, mạo từ, giới từ, đại từ, sở hữu cách), nên "error log" theo loại lỗi là có cơ sở — [Vu – ESP/EAP Journal](https://espeap.junis.ni.ac.rs/index.php/espeap/article/view/594)
- **Speaking – [MẠNH – chính thức]** Band 7 đòi nói dài không gắng sức và kiểm soát trọng âm/ngữ điệu ở phát ngôn dài; band 8 là phát âm "effortless to understand" — [IELTS Speaking descriptors](https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-speaking-band-descriptors.pdf)
- **Speaking – [TRUNG BÌNH]** Seedhouse et al. (2014, báo cáo nghiên cứu IELTS) phân tích quan hệ giữa đặc điểm lời nói thực tế và band descriptors — [IELTS research report](https://ielts.org/cdn/Research/relationship-between-speaking-features-and-band-descriptors-seedhouse-et-al-2014.pdf)
- **Speaking – [MẠNH]** Có meta-analysis về Automatic Speech Recognition (ASR) trong luyện phát âm ESL/EFL (ReCALL) — [ReCALL – ASR meta-analysis](https://www.cambridge.org/core/journals/recall/article/effectiveness-of-automatic-speech-recognition-in-eslefl-pronunciation-a-metaanalysis/A915444CF252B61D14961D2FE733822D)

### Inferences
- **Listening:** dictation theo cấp độ (từ → cụm → câu → đoạn) là công cụ chẩn đoán lỗi bottom-up rất tốt (lỗi âm cuối, -s/-ed, từ nối), dù chưa có meta-analysis. Kết hợp prediction (đoán loại từ/số trước khi nghe) và nhận diện "distractor" (người nói tự sửa: "on Monday... no, actually Tuesday") là mẹo luyện thi [YẾU] nhưng khớp đặc thù đề.
- **Reading:** luyện TFNG/NG như kỹ năng suy luận. NOT GIVEN = văn bản không đủ thông tin để khẳng định hay phủ định; FALSE = văn bản mâu thuẫn trực tiếp. Luyện nhận diện paraphrase (đề dùng từ đồng nghĩa và đổi cấu trúc) bằng thẻ cặp paraphrase. Đọc rộng ở 98% coverage để tăng tốc độ.
- **Writing:** chu trình viết → feedback theo 4 tiêu chí → sửa (revision) → ghi error log → đưa lỗi lặp lại vào SRS. Học từ bài mẫu theo cách "phân tích cấu trúc rồi viết lại từ dàn ý", không chép thuộc.
- **Speaking:** ghi âm, nghe lại, đếm lỗi; lặp lại cùng chủ đề trong thời gian giảm dần (kỹ thuật 4/3/2 của Nation thuộc fluency strand; chưa xác minh nguồn trong phiên này); Part 2 lập dàn ý 1 phút.

### Gaps
- Không thu thập được nguồn đã kiểm chứng cho: tốc độ đọc mục tiêu (wpm), kỹ thuật 4/3/2, mẹo của IELTS Liz/Simon/DC IELTS. Đây là [YẾU] nếu đưa vào báo cáo mà không có nguồn.
- Không có nghiên cứu thực nghiệm nào chứng minh "skimming/scanning training" nâng band IELTS.
- Chưa đọc toàn văn meta-analysis ASR (ReCALL) nên chưa có effect size.

## 6. Lỗi phổ biến của người học Việt Nam

### Takeaway
Lỗi ngữ pháp hệ thống do chuyển di từ L1 gồm mạo từ, word form, giới từ, đại từ, sở hữu cách, thì động từ và số nhiều. Về phát âm, các lỗi chính là bỏ phụ âm cuối và cụm phụ âm cuối, bỏ /s/ /z/ cuối, trọng âm phẳng (do tiếng Việt là ngôn ngữ âm tiết – syllable-timed), và nhầm /ʃ ʒ tʃ dʒ/.

### Cited Findings
- **[TRUNG BÌNH]** Vu: phân tích lỗi bài luận có giới hạn thời gian của 15 sinh viên đại học Việt Nam, tìm thấy chuyển di tiêu cực ở word forms, articles, prepositions, pronouns, possessive case, gây ra underproduction, overproduction và production errors — [ESP/EAP Journal – Vu](https://espeap.junis.ni.ac.rs/index.php/espeap/article/view/594)
- **[TRUNG BÌNH]** Thiếu mạo từ và dùng sai thì là lỗi thường gặp, gắn với việc tiếng Việt không có các phạm trù ngữ pháp này. Lỗi bỏ mạo từ hay xuất hiện cùng các câu có cấu trúc "tham vọng" — [TCI Thai Journal – L1 negative transfer](https://so05.tci-thaijo.org/index.php/reflections/article/view/275268); [oapub](https://oapub.org/edu/index.php/ejfl/article/download/6979/9599)
- **[TRUNG BÌNH]** Nguyen Thi Quyen (2018, VNU Journal of Foreign Studies): người học có L1 không có mạo từ dao động giữa hai giá trị của Article Choice Parameter (definiteness và specificity) — [VNU JFS](https://js.vnu.edu.vn/FS/article/view/4248/3953)
- **[TRUNG BÌNH]** Trong một nghiên cứu viết học thuật của sinh viên chuyên Anh, lỗi misformation chiếm 48,36% và omission 19,07% (tính trên mọi loại lỗi) — [jst.tnu.edu.vn](https://jst.tnu.edu.vn/jst/article/download/10966/pdf)
- **[TRUNG BÌNH]** Phụ âm cuối: tiếng Việt chỉ cho phép ít phụ âm cuối nên người học thường bỏ hoặc biến đổi phụ âm cuối tiếng Anh. Có các nghiên cứu ở ĐH Mekong Delta (2019), ĐH Tây Đô, và Can Tho University (2022, 39 người học, lỗi cụm phụ âm) — [ICHUSO 2019](https://hs.kku.ac.th/ichuso/2019/034-ICHUSO-2019.pdf); [CTU Journal](https://ctujs.ctu.edu.vn/index.php/ctujs/article/download/448/610/3089)
- **[TRUNG BÌNH]** Disney & Le (2024, *Languages*) dùng 16 bài thuyết trình để nghiên cứu việc bỏ /s/ /z/ cuối từ. Họ lập luận rằng nghiên cứu trước quá quy cho chuyển di L1, và contrastive analysis dự đoán sai một số lỗi — [MDPI Languages 9(10):327](https://mdpi.com/2226-471X/9/10/327); [Marjon repository](https://marjon.repository.guildhe.ac.uk/id/eprint/17895/1/Word-Final%20s-z%20Omission%20in%20Vietnamese%20English.pdf)
- **[TRUNG BÌNH]** Ba vùng lỗi phát âm chính: trọng âm từ, bỏ âm giữa trong từ nhiều âm tiết, và phụ âm cuối. Tiếng Việt là syllable-timed, âm tiết kết thúc đơn giản. Nhầm /ʃ/, /ʒ/, /tʃ/, /dʒ/ — [VNU JFS – Common Pronunciation Problems](https://js.vnu.edu.vn/FS/article/view/2072); [VNU JFS 2233](https://js.vnu.edu.vn/FS/article/view/2233/2129); [HPU TESOL Working Papers 2023](https://www.hpu.edu/research-publications/tesol-working-papers/2023/1_trang_pham.pdf)
- **[YẾU]** Người học hoặc nói không có trọng âm, hoặc nhấn đều mọi âm tiết theo kiểu tiếng Việt — [talk.edu blog](https://blog.talk.edu/?p=26351)

### Inferences
- Ưu tiên cho game: (1) âm cuối + -s/-ed (ảnh hưởng cả Speaking P lẫn Listening/Writing chính tả); (2) mạo từ/số nhiều/word form (ảnh hưởng GRA và LR); (3) trọng âm từ học thuật (ví dụ *ECOnomy/ecoNOmic*, *PHOtograph/phoTOgraphy*); (4) collocation sai do dịch từ tiếng Việt.

### Gaps
- Chưa tìm được nội dung từ ZIM/DOL (tìm kiếm không trả về). Danh sách collocation sai do dịch từ tiếng Việt (ví dụ "make a crime", "learn knowledge") là kiến thức nền **chưa xác minh** bằng nguồn.
- Không có nguồn đã kiểm chứng về lỗi ngữ điệu (intonation) đặc thù của người Việt.
- Chưa có dữ liệu định lượng về tần suất từng loại lỗi trong bài thi IELTS của thí sinh Việt.

## 7. Áp dụng cho Lexicon Arcade

### Takeaway
Thiết kế game nên xoay quanh 4 trụ có bằng chứng mạnh: (1) SRS dùng FSRS, retention 0.90; (2) truy xuất chủ động thay cho nhận diện thụ động; (3) feedback giàu thông tin theo tiêu chí IELTS; (4) input lượng lớn ở 95–98% coverage. Chỉ interleave những thứ *dễ nhầm*, không trộn ngẫu nhiên từ mới.

### Cited Findings
- Retention 0.90 mặc định, không vượt 0.97; khoảng 10 lượt ôn cho mỗi thẻ mới — [Anki Manual](https://docs.ankiweb.net/deck-options.html)
- Testing > restudy ở test trễ — [Roediger & Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/)
- Word lists: blocking > interleaving (g = −0.39); interleave khi các loại giống nhau giữa nhóm — [Brunmair & Richter 2019](https://pubmed.ncbi.nlm.nih.gov/31556629/)
- Feedback d = 0.48, phụ thuộc nội dung thông tin — [Wisniewski et al. 2020](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.03087/full)
- 98% coverage cho đọc/nghe thoải mái — [Nation 2006](https://www.wgtn.ac.nz/__data/assets/pdf_file/0018/1626120/2006-How-large-a-vocab.pdf)
- 30/40 ≈ band 7, 35/40 ≈ band 8 (Listening/Reading) — [IELTS scoring](https://ielts.org/for-test-takers/how-ielts-is-scored)

### Inferences
(Toàn bộ mục này là đề xuất thiết kế suy luận từ các nguồn trên, không phải kết quả nghiên cứu.)

**Khung tổng/ngày (~90–120 phút, theo Four Strands):** SRS 20–25' (language-focused) · Input nghe/đọc 25–30' · Output nói/viết có feedback 25–30' · Fluency 15–20'. Số thẻ mới mặc định 15/ngày; tạm dừng thẻ mới khi hàng đợi ôn > 200.

**Từ vựng (lõi chung)**
- Routine: 15 thẻ mới, ôn hết thẻ đến hạn. Thẻ mới học theo khối chủ đề (blocking), thẻ ôn thì trộn.
- Cơ chế: (1) **Collocation Cloze Blaster**: cloze 1 chỗ trống trong cụm, phải gõ hoặc nói đáp án; FSRS retention 0.90. (2) **Word-Form Forge**: cho gốc từ, điền đúng dạng (economy/economic/economical/economically) trong câu. (3) **Confusables Duel**: chỉ trộn các cặp dễ nhầm (affect/effect, rise/raise). (4) **Coverage Meter**: báo % coverage của từng bài đọc so với vốn từ đã "mature" (stability > 21 ngày), mục tiêu ≥ 95% (tối thiểu) và 98% (lý tưởng).
- Chỉ số: retention thực tế 0.87–0.92; số thẻ "mature"; vốn word families ước lượng (mục tiêu 8.000 cho Reading 8.0).

**Listening**
- Routine (25'): 5' dictation + 10' một section đề (accent luân phiên) + 5' shadowing đoạn đã dictation + 5' minimal pairs.
- Cơ chế: (1) **Dictation Ladder** 4 cấp: L1 từ khóa/số → L2 cụm 3–5 từ → L3 câu → L4 đoạn 30s. Lên cấp khi word accuracy ≥ 90% ở 3 phiên liên tiếp; tự động gắn nhãn lỗi (thiếu -s/-ed, âm cuối, mạo từ). (2) **Ending Sound Sniper** (kiểu HVPT): phân biệt *rice/rise/rices*, *walk/walked*, nhiều giọng (UK/AU/US/NZ), ≥ 4 người nói cho mỗi cặp; mục tiêu ≥ 90%. (3) **Distractor Trap**: đoạn hội thoại có người nói tự sửa ý; điểm thưởng cho chọn đáp án cuối. (4) **Predict-then-Listen**: đoán loại từ/đơn vị cho chỗ trống trước khi nghe; đo độ chính xác dự đoán. (5) **Spelling Gate**: đáp án phải đúng chính tả, số ít/số nhiều, giới hạn từ (lỗi bất cẩn quyết định 35/40).
- Chỉ số: section score; mục tiêu 30/40 rồi 35/40 ở mock test; tỷ lệ lỗi bất cẩn < 1 câu/đề.

**Reading**
- Routine (30'): 10' đọc rộng (98% coverage, đo wpm) + 15' một passage có giới hạn giờ (20') + 5' review lỗi.
- Cơ chế: (1) **TFNG Court**: mỗi câu phải chọn T/F/NG *và* bấm vào câu bằng chứng (NG = không có câu bằng chứng); interleave TFNG với YNNG. (2) **Paraphrase Match**: ghép cụm trong đề với cụm trong bài (thẻ paraphrase đưa vào SRS). (3) **Heading Hunter**: chọn heading cho đoạn trong thời gian giới hạn, luyện đọc ý chính. (4) **Speed Run**: đọc rộng có đồng hồ wpm và 3 câu hỏi hiểu; chỉ tính wpm khi hiểu ≥ 80%.
- Chỉ số: accuracy theo dạng câu hỏi; thời gian/passage ≤ 20'; wpm (theo dõi xu hướng; chưa có mục tiêu đã kiểm chứng).

**Writing**
- Routine: 3–4 bài/tuần (luân phiên Task 1 và Task 2); mỗi ngày 20' viết hoặc sửa + 5' ôn error log.
- Cơ chế: (1) **Criterion Feedback Loop**: bài viết được chấm theo 4 tiêu chí (TR/TA, CC, LR, GRA) với ghi chú *cụ thể* từng lỗi, kèm yêu cầu viết lại đoạn bị chấm thấp. (2) **Error Log → SRS**: mỗi lỗi lặp lại ≥ 2 lần thành một thẻ cloze sửa câu. (3) **Overview First (Task 1)**: mini-game viết câu overview cho biểu đồ trong 3', chấm có/không nêu xu hướng chính. (4) **Essay Skeleton Builder (Task 2)**: lắp dàn ý (position, 2 main ideas, ví dụ) trong 5'. (5) **Model Essay Reverse**: xem bài mẫu → ẩn → viết lại từ dàn ý → so diff.
- Chỉ số: số lỗi/100 từ (mục tiêu band 7: đa số câu không lỗi); tỷ lệ "error-free sentences"; band ước lượng theo tiêu chí.

**Speaking**
- Routine (20'): 5' minimal pairs/trọng âm + 10' Part 2 (1' chuẩn bị, 2' nói, ghi âm) + 5' nghe lại và đánh dấu lỗi.
- Cơ chế: (1) **Cue Card Countdown**: 60s lập dàn ý 4 ý rồi nói 2'; đo thời gian nói liên tục, số lần ngập ngừng dài hơn 1s, words/minute. (2) **4/3/2 Replay**: nói cùng chủ đề 3 lần với thời lượng giảm dần (fluency strand). (3) **Stress Tap**: chạm vào âm tiết mang trọng âm của từ học thuật; có cả trọng âm câu. (4) **Shadow Echo**: shadowing đoạn 20–30s, ASR chấm âm cuối và -s/-ed. (5) **Self-Review Bingo**: nghe lại bản ghi, tick các lỗi trong checklist người Việt (âm cuối, -s/-ed, mạo từ, thì).
- Chỉ số: thời gian nói liên tục ≥ 1'45" ở Part 2; tỷ lệ âm cuối được ASR nhận đúng ≥ 90%; số lỗi ngữ pháp/phút giảm dần.

**Tham số chung cho cả game**
- Vùng thành công: 80–90% cho bài luyện (khớp retention 0.85–0.90); nếu < 70% thì hạ cấp, nếu > 95% ở 3 phiên thì lên cấp.
- Đo tiến bộ bằng **kiểm tra trễ** (lặp lại item sau ≥ 7 ngày), không dùng điểm trong phiên.
- Mock test đầy đủ mỗi 2–3 tuần; quy đổi 30/40 → 7, 35/40 → 8.

### Gaps
- Các ngưỡng "lên/xuống cấp" (90%, 70%, 95%), thời lượng routine và mục tiêu wpm là đề xuất thiết kế, chưa có nguồn thực nghiệm riêng. Cần A/B test trong game.
- Chưa có bằng chứng về độ chính xác của ASR khi chấm âm cuối cho giọng Việt.
