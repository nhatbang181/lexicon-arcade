# Cơ chế game thương mại thành công: điều gì giữ chân người chơi, và mượn gì cho game học IELTS (Lexicon Arcade)

> Ngày nghiên cứu: 25/11/2026. Ghi chú bằng tiếng Việt, trích dẫn giữ tiếng Anh. Mỗi số liệu đều ghi năm của dữ liệu khi có.
> Lưu ý chất lượng nguồn: nhiều phân tích về Balatro, Slay the Spire và Hades là trang phân tích của fan (ví dụ saschb2b.github.io, blakecrosley.com). Các trang này được đánh dấu "nguồn thứ cấp" và không được coi là ý định của nhà phát triển.

## 1. Balatro: điều gì tạo ra cảm giác "thêm một run nữa", và phần nào chuyển được sang bài luyện từ vựng/đọc/nghe?

### Takeaway
Lõi của Balatro là một phép tính đơn giản (Chips × Mult) để vượt qua mức điểm yêu cầu tăng dần. Lá Joker ("passive item") là nơi tạo ra combo và quyết định build. Hiệu ứng đếm điểm theo từng lớp (từng lá bài, từng Joker lần lượt "nổ") biến phép tính thành một màn trình diễn. Phần chuyển được sang game học là: (a) mục tiêu điểm tăng dần theo "blind", (b) modifier thụ động tạo synergy với *hành động học* (ví dụ "+Mult nếu trả lời đúng collocation"), và (c) phần đếm điểm có juice sau khi trả lời. Ngẫu nhiên và quản lý rủi ro là cốt lõi, nhưng chính LocalThunk thừa nhận game có thể quá ngẫu nhiên.

### Cited Findings
- LocalThunk mô tả cơ chế trung tâm: "The central mechanic is to score as many chips as possible to defeat an ever rising required score." Ông gọi game là "my modern indie take on solitaire with a poker coat of paint!" — [Rogueliker interview](https://www.rogueliker.com/balatro-interview/)
- Joker được thêm vào *sau*, như "a kind of 'passive' item", vì bản đầu chỉ có shop nâng cấp lá bài và cảm giác còn thiếu — [Rogueliker](https://www.rogueliker.com/balatro-interview/)
- Về ngẫu nhiên: "There is a lot of randomness, possibly too much." Ông nói chiến lược cấp cao (metastrategy) là "mitigating risk", và người chơi ngày càng bàn về việc giảm rủi ro, xây một run khó bị khắc chế — [Rogueliker](https://www.rogueliker.com/balatro-interview/)
- Cân bằng game "by feel", và "almost all balance changes can be made by changing a number." — [Rogueliker](https://www.rogueliker.com/balatro-interview/)
- Nguồn cảm hứng: bài Big 2 và các video về Luck Be a Landlord. Thiết kế "evolved naturally" qua quá trình khám phá — [TouchArcade, 03/2024](https://toucharcade.com/2024/03/18/balatro-interview-mobile-port-localthunk-dlc-plans-updates-new-jokers-demo-feedback/)
- Joker được chọn làm nguồn ngẫu nhiên kiểu roguelike, lấy cảm hứng từ Luck Be A Landlord và The Binding of Isaac. Lúc bắt đầu, LocalThunk chưa từng chơi roguelike deckbuilder nào — [Edge (qua Readly), 11/2023](https://gb.readly.com/magazines/edge/2023-11-02/653ef958ba55e12cc8d91128); [GamesHub](https://www.gameshub.com/news/features/balatro-roguelike-deckbuilder-2637397)
- Dự kiến ban đầu là 120 Joker. Publisher nhắc "150 Jokers" và LocalThunk "just made 30 more" — [PC Gamer](https://www.pcgamer.com/games/card-games/balatro-was-only-supposed-to-have-120-jokers-but-instead-of-correcting-a-publisher-mistake-localthunk-just-made-30-more-of-them/)
- Ông nhận ra game "đặc biệt" khi một người bạn kể đã chơi 20, 30 hoặc 40 giờ — [PC Gamer](https://pcgamer.com/games/roguelike/localthunk-had-made-hobby-games-in-the-past-but-realized-balatro-was-something-special-when-a-friend-revealed-he-had-played-it-for-20-30-or-40-hours)
- Joker tính điểm trải từ đơn giản (Jolly Joker: "+8 Mult if hand contains a Pair") tới phức tạp nhiều lớp (Obelisk: "×0.25 Mult per consecutive hand played"). Điểm của một tay bài = Chips × Mult — [saschb2b, nguồn thứ cấp](https://saschb2b.github.io/game-mechanics/games/balatro/poker-scoring)
- Phân tích thứ cấp: Balatro xếp chồng nhiều kênh phản hồi trên mỗi sự kiện tính điểm, "they stack multiplicatively, just like the game's scoring". Tổng chip "lăn" lên (khoảng 300ms, tuần tự) thay vì hiện ngay, và screen shake tỉ lệ với độ lớn điểm. *Tác giả tự dựng lại các thông số, chưa được xác minh từ game* — [blakecrosley.com, nguồn thứ cấp](https://blakecrosley.com/guides/design/balatro)
- Review nhắc tới "chorus of accelerating victory chirps" khi đếm điểm, tức âm thanh tăng tốc góp phần lớn vào cảm giác thỏa mãn — [AV Club, "Balatro Hones the Art of Making Numbers Go Up"](https://www.avclub.com/balatro-hones-the-art-of-making-numbers-go-up)
- Balatro khớp với checklist "Juice It or Lose It", vì vòng lõi của nó vốn chỉ là số học — [PSU](https://www.psu.com/news/why-winning-feels-so-good-reward-design-from-arcades-to-balatro/)

### Inferences
- Công thức "thêm một run" của Balatro gồm 4 lớp: (1) mỗi run ngắn, có mục tiêu điểm rõ, (2) mỗi lựa chọn ở shop thay đổi cách tính điểm (quyết định có hậu quả), (3) đếm điểm tuần tự có juice nên khoảnh khắc payoff kéo dài và dễ đọc, (4) ngẫu nhiên cho mỗi run một khác biệt. Lớp (2) quan trọng nhất cho sư phạm: modifier phải thưởng cho *hành vi học* (ví dụ trả lời đúng từ có hậu tố -tion, nghe đúng số liệu trong Listening), không thưởng cho may mắn.
- Bài học từ thất bại của Duolingo (mục 3) hợp với Balatro: cơ chế chỉ có ý nghĩa khi người chơi có *quyết định chiến lược*. Vì vậy "joker" trong game học phải buộc người chơi chọn (ví dụ chọn bộ từ chủ đề nào để "build"), không chỉ là buff tự động.
- Đếm điểm tuần tự là một cách *dạy* tốt: mỗi bước +Chips/+Mult có thể gắn với một mục kiến thức (từ đúng, collocation đúng, tốc độ). Người học thấy được *vì sao* mình được điểm.

### Gaps
- Không tìm được trích dẫn gốc nào của LocalThunk về "one more run", juice hay âm thanh. Các thông số animation (300ms, shake theo độ lớn) chỉ đến từ phân tích thứ cấp.
- Không có dữ liệu thời lượng run trung bình hay tỉ lệ thắng từ nguồn chính thức.

## 2. Cấu trúc run kiểu roguelite (Slay the Spire, Hades, Vampire Survivors): meta-progression và run progression, nhánh rẽ, rủi ro/phần thưởng, boss

### Takeaway
Ba game này dùng chung một khung: run ngắn có tiến trình nội bộ (nhặt bài, boon, vũ khí), bản đồ hoặc lựa chọn rẽ nhánh với rủi ro/phần thưởng rõ (Elite đổi máu lấy relic), boss cuối mỗi tầng, và một lớp tiến trình vĩnh viễn để thất bại vẫn "có lãi". Hades cho thấy meta-progression cộng với câu chuyện có thể biến thất bại thành điều đáng mong chờ. God Mode là van an toàn cho người chơi yếu.

### Cited Findings
- Slay the Spire: lead designer Anthony Giovannetti nói bản đồ rẽ nhánh lấy cảm hứng từ FTL, và việc đi bản đồ thêm một lớp "risk, reward, and planning" — [Game Developer, Road to the IGF](https://gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-)
- Mỗi tầng là chuỗi encounter theo cấu trúc rẽ nhánh, kết thúc bằng boss — [Wikipedia](https://wikipedia.com/wiki/Slay_the_Spire)
- Elite: mất máu bây giờ để lấy relic. Phân tích fan coi rủi ro/phần thưởng là chủ đề xuyên suốt — [saschb2b, nguồn thứ cấp](https://saschb2b.github.io/game-mechanics/games/slay-the-spire/design-tensions)
- Mega Crit dùng thiết kế dựa trên metrics từ sớm, rồi cân bằng bằng dữ liệu trong suốt early access (GDC 2019, "Metrics Driven Design and Balance") — [GDC Vault](https://gdcvault.com/play/1025731/contactUs); [Edge qua PressReader, 06/2019](https://www.pressreader.com/australia/edge/20190620/282351156287993)
- Slay the Spire 2 làm lại event để buộc người chơi đưa ra "difficult decisions" — [PCGamesN](https://www.pcgamesn.com/slay-the-spire-2/events-redesign). Một ý tưởng sớm là thu nhỏ card pool, nhưng người chơi phản đối: "We need new stuff!" — [PC Gamer](https://www.pcgamer.com/uk/games/roguelike/slay-the-spire-2-dev-says-an-early-idea-was-to-actually-reduce-the-card-pool-but-players-hated-it-we-need-new-stuff/)
- Hades: Mirror of Night dùng Darkness để mua nâng cấp vĩnh viễn (thêm máu, dash, reroll). Phân tích cho rằng nó "ease some of the frustration" của thể loại — [Collider](https://collider.com/hades-gameplay-mechanics/); [techbloat](https://www.techbloat.com/what-is-a-roguelite-hades-progression-explained.html)
- Phần lớn nâng cấp Mirror/Arcana thay đổi *cách chơi* (ví dụ revive một lần), không chỉ tăng chỉ số — [saschb2b, nguồn thứ cấp](https://saschb2b.github.io/game-mechanics/games/hades/meta-progression)
- Cân bằng giữa tiến trình và câu chuyện "makes failure desirable": mỗi lần chết lại có thêm thoại và câu chuyện ở House of Hades — [AV Club](https://www.avclub.com/hades-and-failure)
- God Mode: kháng sát thương tăng dần sau mỗi lần thua, là lựa chọn "guilt-free" cho người muốn tập trung vào câu chuyện — [GameSpot](https://gamespot.com/articles/hades-changes-what-it-means-to-be-a-roguelike/1100-6483420/); [Kotaku](https://kotaku.com/hades-the-kotaku-review-1845204803)
- Hades II bị chê "glut of meaningless resources" và đường độ khó giữa game gây khó chịu, tức meta-currency quá nhiều sẽ phản tác dụng — [GamesRadar, 2025](https://www.gamesradar.com/games/roguelike/hades-2-review-2025)
- Vampire Survivors: nhịp xen kẽ giữa giai đoạn áp đảo và đợt căng thẳng, đáp ứng nhu cầu competence và autonomy. Build "tends to come together within a few minutes or not at all" — [Portsmouth/The Conversation](https://corporate-governance.docstore.port.ac.uk/news-events-and-blogs/blogs/popular-culture/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game)
- Level-up và mở rương trong Vampire Survivors là khoảnh khắc "dopamine-driven" — [Epic Games Store](https://store.epicgames.com/news/how-vampires-crawlers-does-and-doesn-t-reinvent-the-deckbuilder-wheel?lang=en-US). Tiêu đề bài PC Gamer nói game này "saved its creator from working on mobile gambling games" — [PC Gamer](https://pcgamer.com/vampire-survivors-saved-its-creator-from-working-on-mobile-gambling-games)
- Luca Galante từng nghĩ không ai chơi quá 2 giờ, và nói "short games rule" — [GamesRadar](https://www.gamesradar.com/games/roguelike/on-steam-alone-i-probably-have-3-000-hours-nobody-loves-vampire-survivors-more-than-its-creator-who-once-thought-nobody-would-play-it-for-more-than-two-hours-and-ironically-says-short-games-rule)

### Inferences
- Map rẽ nhánh hợp với IELTS: các nút như "Elite = đoạn Reading band 7+, phần thưởng relic hiếm", "Rest = ôn SRS các thẻ sắp quên", "Shop = chọn bộ từ chủ đề", "Boss = mini-test tổng hợp kỹ năng của tầng". Người học tự chọn độ khó, đây là autonomy có nghĩa.
- Meta-progression nên là *mở rộng lựa chọn* (mở thêm loại câu hỏi, chủ đề, chế độ), không phải *tăng chỉ số* làm bài dễ đi. Nếu buff làm bài dễ hơn, kết quả sẽ không còn phản ánh năng lực thật.
- Vai trò "thất bại có lãi" như Hades có thể là: mỗi run thua vẫn ghi lại các từ đã sai vào hàng SRS và mở thêm một mẩu giải thích/câu chuyện. Thất bại trở thành dữ liệu học.
- God Mode là mẫu tốt cho người học yếu: hỗ trợ tăng dần (thêm gợi ý, thêm thời gian) sau mỗi lần thua, bật/tắt tùy ý, không bị phạt.

### Gaps
- Không truy cập được nội dung đầy đủ của talk GDC 2019 của Mega Crit (cần đăng nhập), nên không có số liệu về metrics bản đồ hay elite.
- Không có phỏng vấn trực tiếp của Supergiant về lý do thiết kế Mirror/God Mode, cũng không có trích dẫn trực tiếp của poncle về độ dài run 30 phút.

## 3. Vòng engagement của Duolingo: streak, streak freeze, league, XP, quest, notification, tranh cãi hearts/energy

### Takeaway
Dữ liệu công khai cho thấy các yếu tố đẩy retention mạnh nhất là: tập trung vào một chỉ số (CURR, tỉ lệ giữ chân người dùng hiện tại), leaderboard/league (+17% thời gian học), và một chuỗi cải tiến nhỏ quanh streak (streak-saver notification, freeze, wager +14% D7, animation +1.7% D7). Một thử nghiệm game hóa kiểu Gardenscapes thất bại hoàn toàn vì bài học Duolingo không có quyết định chiến lược. Việc chuyển từ hearts sang energy (07/2025) cho thấy rủi ro khi cơ chế phạt bị coi là kiếm tiền, không phải hỗ trợ học. Đến Q3/2026, DAU vẫn tăng tốc.

### Cited Findings
- Trong 4 năm trước IPO, DAU tăng 4.5 lần. Đến giữa 2018, tăng trưởng DAU chỉ còn một chữ số mỗi năm. CURR tăng 21%, tương ứng churn hằng ngày của nhóm người dùng tốt nhất giảm hơn 40%. Tỉ lệ DAU có streak 7+ ngày gần gấp 3, lên hơn một nửa DAU — [Jorge Mazal, Lenny's Newsletter, 2022/2023](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- Mô phỏng: khi mỗi tỉ lệ tăng 2%/quý trong 3 năm, CURR có tác động lên DAU khoảng 5 lần đòn bẩy đứng thứ hai. CURR "had not moved in years" trước đó — [Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- **Thất bại:** bộ đếm số lượt kiểu Gardenscapes: "the result of all that effort was completely neutral". Bài học là bài học Duolingo thiếu quyết định chiến lược nên cơ chế này vô nghĩa. Referral kiểu Uber chỉ tăng 3% người dùng mới — [Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- **Leaderboards:** tổng thời gian học +17%, số người học rất tích cực (≥1 giờ/ngày, 5 ngày/tuần) tăng gấp 3, D1 và D7 retention cải thiện có ý nghĩa — [Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- **Notification:** nguyên tắc "protect the channel". Muốn tăng số lượng thông báo phải có lý do mạnh và CEO duyệt. Tối ưu thời điểm, template, copy bằng A/B test và bandit algorithm cho ra "dozens of small- and medium-size wins". Ví dụ cảnh báo: Groupon gửi tới 5 email/ngày và "basically destroyed" kênh email — [Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth). Nếu gửi nhắc nhở cả tuần mà người dùng không quay lại thì dừng gửi — [Lenny's](https://lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- **Streak:** chiến thắng lớn đầu tiên là streak-saver notification. Sau đó là calendar view, animation, streak freeze, streak reward, tất cả "generated substantial improvements to retention" (không công bố số) — [Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- Blog Duolingo (31/01/2022): hơn 6 triệu người có streak ≥7 ngày. Animation streak mới giúp người học mới còn dùng sau 7 ngày +1.7%. Cho trang bị tối đa 2 Streak Freeze làm DAU tương đối +0.38% và không khiến người học nghỉ nhiều hơn. Người đạt streak 7 ngày có khả năng hoàn thành khóa học cao gấp 3.6 lần. Nền tảng lý thuyết: lặp lại trong cùng ngữ cảnh tạo tự động hóa (APA 1998), và cho "slack" (linh hoạt) có thể tạo động lực tốt hơn luật cứng (Penn/UCLA 2018) — [Duolingo Blog, Osman Mansur](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- Tách daily goal khỏi streak: D14 retention +3.3%, DAU tổng +1%. Streak Wager: D7 +14%. Người có streak 7 ngày có khả năng quay lại hôm sau cao gấp 2.4 lần (tương quan) — [Duolingo Blog, "Improving the streak"](https://blog.duolingo.com/improving-the-streak); [making.duolingo.com](https://making.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals)
- **Hearts → Energy (07/2025):** người dùng miễn phí chuyển từ 5 tim (chỉ mất khi sai) sang 25 energy, trừ dần theo *mỗi* bài tập. Energy nạp lại bằng quảng cáo hoặc gem, và có thưởng thêm khi làm bài hoàn hảo. Lý do Duolingo đưa ra: mất tim khi sai "was not the most effective way to support learning", và "We're already seeing learners do more in the Energy system than they were with Hearts." — [Duolingo Blog](https://blog.duolingo.com/duolingo-energy/)
- Phản ứng: bài làm đúng vẫn bị trừ energy, bị gọi là "cash grab". Có petition trên change.org (07/09/2025) và một người dùng bỏ app sau streak hơn 700 ngày — [Android Authority](https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/); [change.org](https://www.change.org/p/duolingo-hearts-not-energy). *Lưu ý: petition và blog là nguồn vận động, không đại diện cho số đông.*
- **Q3/2026 (công bố 11/2026):** DAU 64.9 triệu (+29% YoY, tăng tốc từ +23% Q2 và +21% Q1). Doanh thu 309 triệu USD (+14%). 13.1 triệu người trả phí (+14%). CEO Luis von Ahn nói tăng bookings "in ways that preserve the quality of our free experience" — [Investing News](https://investingnews.com/duolingo-reports-third-quarter-2026-results/); [Finviz](https://finviz.com/news/414652/duolingo-reports-third-quarter-2026-results); [Customer Experience Dive](https://www.customerexperiencedive.com/news/duolingo-ceo-monetize-without-degrading-free-user-experience/873877/?.tsrc=rss)
- Tóm tắt cuộc gọi Q3/2026 (tiếng Nhật) cho rằng tăng tốc đến từ hệ thống "Green Machine" chạy hàng trăm A/B test mỗi tuần để tăng retention, hợp tác với game (Blossom, Eggy Party), và khóa cờ vua đạt 10 triệu DAU — [Business Insider Japan](https://www.businessinsider.jp/article/2611-earnings-duolingo-inc-q3-2026-earnings-call-summary/). *Nguồn tóm tắt, chưa đối chiếu với thư cổ đông gốc.*

### Inferences
- Với một app đơn người chơi, không có backend xã hội lớn, bài học chuyển được là: streak cộng với streak freeze (tính linh hoạt), animation ở các mốc, và một nhắc nhở duy nhất khi streak sắp mất (không spam). League cần người thật, nên thay bằng "ghost league" (đua với chính các lần chơi trước) hoặc mục tiêu tuần cá nhân. Đây là suy luận, chưa có dữ liệu.
- Bài học Gardenscapes là cảnh báo trực tiếp cho Lexicon Arcade: gắn vỏ game lên bài drill không có quyết định thì vô dụng. Hành động chơi phải là hành động học, và phải có lựa chọn.
- Bài học hearts/energy: phạt người học vì *làm đúng* hoặc khóa việc học sau paywall/ads làm mất lòng tin. Nếu có giới hạn, nó nên là giới hạn sư phạm (ví dụ "đã đủ thẻ mới hôm nay, quay lại ôn mai"), có lý do minh bạch.
- Cần lưu ý các số liệu streak (2.4x, 3.6x) phần lớn là *tương quan*, có selection bias (Mazal tự thừa nhận).

### Gaps
- Không tìm thấy số liệu A/B riêng cho bản Streak Freeze đầu tiên (chỉ có số +0.38% cho thay đổi "trang bị 2 freeze").
- Không có số liệu công khai về tác động của Quests/Friends Quests, hay về thay đổi retention sau khi chuyển sang energy.
- Thư cổ đông Q3/2026 gốc chưa được đọc trực tiếp. Số liệu lấy qua báo chí.

## 4. Cơ chế sưu tầm/gacha nhẹ làm có đạo đức, và phê phán dark pattern

### Takeaway
Khung phân tích chuẩn là "Dark Patterns in the Design of Games" (Zagal, Björk, Lewis 2013): 7 loại trong 3 nhóm (thời gian, tiền, vốn xã hội), sau được mở rộng thêm nhóm tâm lý. "Playing by appointment" (bắt đăng nhập hằng ngày) là dark pattern về thời gian, điều trực tiếp liên quan đến streak/daily quest. Ngay chính khái niệm này cũng bị phê bình là phụ thuộc ngữ cảnh. Với game học không bán vật phẩm, rủi ro chính là thao túng thời gian và FOMO, không phải tiền.

### Cited Findings
- Zagal, Björk, Lewis (2013) định nghĩa "dark game design patterns" gồm 7 loại trong 3 nhóm: temporal, monetary, social capital-based. Bản web sau đó thêm nhóm psychological — [Chalmers research](https://research.chalmers.se/en/publication/177148); [Deceptive.design](https://deceptive.design/articles/dark-patterns-in-the-design-of-games); [arXiv 2412.05039 (2024)](https://arxiv.org/pdf/2412.05039)
- Dark pattern về thời gian là chiến lược kéo dài hoặc rút ngắn chuỗi tương tác trái với kỳ vọng người chơi. Ví dụ: "playing by appointment", tức các quest buộc chơi mỗi ngày — [arXiv 2412.05039, "Level Up or Game Over"](https://arxiv.org/pdf/2412.05039)
- Phê bình: bài DiGRA 2020 cho rằng khái niệm này mâu thuẫn nội tại. Nó nhấn mạnh tính chủ quan và ngữ cảnh nhưng vẫn gọi các pattern là "dark" tự thân, và chính văn bản 2013 gọi nhiều pattern là "value-neutral" — [DiGRA 2020](https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf)
- Vampire Survivors bị phân tích là dùng "gambling psychology" (rương, slot) dù không bán gì, và tác giả từng làm game cờ bạc trên mobile — [Portsmouth blog](https://corporate-governance.docstore.port.ac.uk/news-events-and-blogs/blogs/popular-culture/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game); [PC Gamer](https://pcgamer.com/vampire-survivors-saved-its-creator-from-working-on-mobile-gambling-games)
- Ví dụ thực tế về cơ chế bị coi là dark: Duolingo energy bị gọi là "cash grab" vì người trả phí có energy không giới hạn — [Android Authority](https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/)

### Inferences
- Sưu tầm có đạo đức cho Lexicon Arcade: mỗi "thẻ" trong bộ sưu tập là *một từ/collocation đã thực sự thuộc* (vượt qua một ngưỡng SRS). Bộ sưu tập là bản đồ năng lực, không phải phần thưởng ngẫu nhiên. "Edition" (foil/holo kiểu Balatro) gắn với độ thuộc: thẻ thường → foil (đúng 3 lần cách ngày) → holo (dùng đúng trong câu tự viết).
- Có thể dùng phần thưởng ngẫu nhiên nhưng chỉ cho *cosmetic* (theme, khung thẻ). Không bao giờ dùng ngẫu nhiên cho *nội dung học* hay quyền truy cập bài học. Không có tiền tệ mua được bằng tiền thật.
- Tránh "playing by appointment" cứng: streak phải có freeze/slack, daily quest không biến mất kèm hình phạt, không có đồng hồ đếm ngược FOMO cho nội dung giới hạn thời gian.

### Gaps
- Không tìm được nghiên cứu định lượng về tác động của huy hiệu/sưu tầm cosmetic lên retention trong app học (ngoài meta-analysis gamification ở mục 5).
- Không tìm được tài liệu chính về loot box/FOMO gắn trực tiếp vào taxonomy của Zagal. Cần đọc paper gốc.

## 5. Nghiên cứu hình thành thói quen áp dụng vào app (Fogg, Hooked, variable reward) và các phê phán; bằng chứng gamification trong giáo dục

### Takeaway
Fogg: hành vi xảy ra khi Động lực, Khả năng và Lời nhắc (prompt) hội tụ cùng lúc. Đòn bẩy rẻ nhất là làm hành vi thật dễ, rồi "ăn mừng" ngay để củng cố. Hooked (Eyal): Trigger → Action → Variable reward → Investment. Variable reward bị phê phán là gần với cơ chế casino, và không bắt buộc (Google, Uber thành công với phần thưởng *ổn định*). Meta-analysis Sailer & Homner (2020) cho thấy gamification có hiệu ứng nhỏ đến vừa và dương lên kết quả nhận thức (g=.49), động lực (g=.36) và hành vi (g=.25). Chỉ hiệu ứng nhận thức vững khi lọc theo nghiên cứu chặt chẽ.

### Cited Findings
- Fogg Behavior Model (2007): hành vi xảy ra khi "sufficient convergence of Motivation, Ability, and Prompts" — [Maine DOT worksheet](https://www.maine.gov/mdot/challengeme/topics/docs/2020/0920FoggWorksheet.pdf); [Stanford GSB, 04/2023](https://gsb.stanford.edu/insights/building-habits-key-lasting-behavior-change)
- Fogg: nếu hành vi rất dễ thì không cần động lực cao. Vì động lực không lúc nào cũng cao, hãy làm hành vi thật dễ. Tiny Habits gắn hành vi nhỏ vào một thói quen có sẵn (anchor), sau đó "celebration" (bắn ra cảm xúc tích cực) là bước tự củng cố — [Stanford GSB](https://gsb.stanford.edu/insights/building-habits-key-lasting-behavior-change); [NPR 2020](https://www.npr.org/2020/02/25/809256398/tiny-habits-are-the-key-to-behavioral-change)
- Fogg cho rằng không cần 21 ngày để tạo thói quen. Đây là phát biểu phổ thông, không phải nghiên cứu bình duyệt — [TED Ideas](https://ideas.ted.com/?p=114805)
- Hook Model 4 bước: trigger, action, variable reward, investment — [Penguin sample](https://cdn.penguin.co.uk/dam-assets/books/9780241184837/9780241184837-sample.pdf)
- Phê phán: mô hình "nearly identical to that used by casinos", và Eyal né dùng từ "addiction-inducing" — [ThoughtWorks](https://www.thoughtworks.com/en-us/insights/blog/addicted-industry-matures). Google thắng nhờ *giảm* độ biến thiên của phần thưởng, và Uber không dùng variable reward — [Big Think](https://bigthink.com/?p=54491). Mâu thuẫn với nghiên cứu cờ bạc của Schüll — [SD Times](https://sdtimes.com/addiction/ethics-addiction-and-dark-patterns/); [Axbom](https://axbom.com/nir-eyal-habit-danger/). *Đây là bài quan điểm.*
- Sailer & Homner (2020), *Educational Psychology Review* 32(1):77–112: nhận thức g=.49 [0.30, 0.69] (k=19, N=1686), động lực g=.36 [0.18, 0.54] (k=16, N=2246), hành vi g=.25 [0.04, 0.46] (k=9, N=951). Hiệu ứng nhận thức vững trong nhóm nghiên cứu chặt chẽ, còn động lực và hành vi kém ổn định hơn. Game fiction và social interaction là moderator có ý nghĩa cho kết quả hành vi. Cạnh tranh kết hợp hợp tác có thể có lợi cho động lực — [Springer](https://link.springer.com/article/10.1007/s10648-019-09498-w); [bản mở OPUS Augsburg](https://opus.bibliothek.uni-augsburg.de/opus4/files/109056/109056.pdf)

### Inferences
- Theo Fogg, "Ability" là đòn bẩy chính cho người học IELTS bận rộn: một run tối thiểu phải rất nhỏ (ví dụ 1 blind ≈ 90 giây) để giữ streak ngày lười. "Celebration" chính là juice ở cuối mỗi câu đúng.
- Variable reward nên đặt ở *hình thức* phần thưởng (joker nào xuất hiện ở shop, cosmetic), còn *phản hồi đúng/sai* phải ổn định, tức thì, dự đoán được. Đây là điều kiện để học hiệu quả, và trùng với lập luận "Google giảm biến thiên" ở trên.
- Kết quả meta-analysis: game fiction (câu chuyện/chủ đề) là moderator, nên khoác lớp chủ đề (arcade, vũ trụ từ vựng) có cơ sở. Nhưng hiệu ứng động lực kém vững, nên không được kỳ vọng gamification thay thế được nội dung tốt.

### Gaps
- Chưa có meta-analysis mới hơn (2023–2026) được xác minh trong đợt này. Kết quả tìm kiếm có nhắc một bài Springer 2023 (s11423-023-10337-7) và SAGE 2026 nhưng chưa đọc.
- Không tìm được nghiên cứu bình duyệt đo trực tiếp Hook Model trong app học ngôn ngữ.

## 6. Thời lượng phiên và nhịp chơi trên mobile; onboarding/FTUE

### Takeaway
Theo GameAnalytics (dữ liệu 2024, báo cáo 2025), phiên chơi mobile trung vị chỉ khoảng 5–6 phút, nhóm top 25% khoảng 8–9 phút. Vì vậy vòng chơi lõi 3–8 phút là sát thực tế. Số liệu của các nhà cung cấp khác nhau rất xa vì khác phương pháp (Adjust báo trung bình khoảng 30.75 phút). Về onboarding, đợt này không tìm được nguồn sơ cấp có số liệu.

### Cited Findings
- Phiên mobile trung vị 5–6 phút. Top 25% dự án đạt 8–9 phút (dữ liệu 2024). Châu Đại Dương dài nhất (6.85 phút), châu Phi và châu Á khoảng 5 phút. Thể loại Board/Card/Puzzle có retention ngắn hạn và dài hạn cao nhất — [GameAnalytics 2025 Mobile Gaming Benchmarks (PDF)](https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf); [GameDev Reports tóm tắt](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
- Adjust: độ dài phiên game trung bình 2024 là 30.75 phút. Báo cáo 2026 (dữ liệu 2025): độ dài phiên casual +15%, hypercasual +13% — [Adjust blog](https://www.adjust.com/blog/first-ever-mobile-benchmarks/); [GameDev Reports, Adjust 2026](https://gamedevreports.substack.com/p/adjust-gaming-app-insights-report). *Mâu thuẫn với GameAnalytics, có lẽ do khác cách tính (trung bình và trung vị, mẫu khác nhau).*
- Có báo cáo GameAnalytics 2026 (Mobile + PC) nhưng chưa đọc chi tiết — [GameDev Reports](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game)

### Inferences
- Thiết kế một "run" chuẩn khoảng 5–7 phút (3 blind + 1 boss), có thể dừng sau mỗi blind (khoảng 90 giây), tự lưu giữa chừng. Khớp với cả trung vị ngành lẫn nguyên tắc "Ability" của Fogg.
- Trên iPhone/PWA, nên cho chơi xong một vòng đầu tiên trong vòng 60 giây trước khi hỏi đăng ký/mục tiêu band. Đây là suy luận từ Fogg và từ bài học Duolingo không đặt rào cản trước giá trị, chưa có số liệu.

### Gaps
- Không tìm được số liệu session length riêng cho puzzle hay ứng dụng học.
- Không tìm được nguồn sơ cấp có số liệu về best practice onboarding/FTUE (ví dụ tỉ lệ rớt ở tutorial). Cần nghiên cứu bổ sung.

## 7. Kinh điển về "game feel"/juice: Nijman, Jonasson & Purho, Swink, và bằng chứng thực nghiệm

### Takeaway
Swink định nghĩa game feel là "real-time control of virtual objects in a simulated space", gồm 3 phần: điều khiển thời gian thực, không gian mô phỏng, và polish. Nijman (2013) trình diễn khoảng 30 chỉnh sửa nhỏ biến một game bắn súng nhạt thành "đã tay" (đạn to hơn, hit pause, permanence, camera kick, screenshake tắt nhanh). Bằng chứng thực nghiệm quan trọng nhất là Kao (2020, N=3018): juice có dạng chữ U ngược. Không juice và juice "Extreme" đều *kém* mức Medium/High về thời gian chơi, động lực nội tại và *cả hiệu suất*. Với game học, đây là ràng buộc cứng: juice quá mức hại việc học.

### Cited Findings
- Swink: game feel = "real-time control of virtual objects in a simulated space", với các tương tác được nhấn mạnh bởi polish. Ba thành phần: real-time control, simulated space, polish. Không có polish thì chức năng không đổi nhưng trải nghiệm "less perceptually convincing" — [Wikiwand: Game feel](https://www.wikiwand.com/en/articles/Game_feel); [GameFeel Chap1 PDF](https://puccjogos.github.io/balanceamento-2017-1s/materiais/GameFeel_Chap1.pdf); [Game Developer, "Principles of Virtual Sensation"](https://www.gamedeveloper.com/design/principles-of-virtual-sensation)
- Nijman, "The Art of Screenshake" (2013, INDIGO Classes): bắt đầu từ một game bắn súng side-scroll nhạt rồi demo 30 tweak nhỏ — [Game Developer](https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games). Các bước được liệt kê trong bản dựng lại: tăng kích thước đạn, permanence (vỏ đạn/xác vẫn còn), hit pause, nổ to hơn, khói, slow motion — [DK Liao devlog](https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog/451576/quick-breakdown-of-all-the-effects); [slide Đại học Bayreuth](https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf). Ví dụ súng lục trong Nuclear Throne: camera bị đẩy lùi vài pixel, screenshake tăng rồi "degenerates quickly" — [infovore](https://infovore.org/?p=5275). *Danh sách 30 bước là từ bản dựng lại thứ cấp, không phải transcript gốc.*
- Kao (2020), *Entertainment Computing*, DOI 10.1016/j.entcom.2020.100359: 4 phiên bản ARPG (None/Medium/High/Extreme), N=3018. Bản None và Extreme có thời gian chơi, trải nghiệm, động lực nội tại và *hiệu suất* thấp hơn có ý nghĩa so với Medium và High — [X-MOL abstract](https://www.x-mol.com/paper/1307980428882448384)
- Nghiên cứu sau (CHI 2024, Kao và cộng sự): phản hồi khuếch đại lại "unexpectedly reduced players' motives", có thể do làm giảm cảm giác chủ động (agency). Phản hồi quá tải cản trở cảm giác năng lực — [KIT](https://publikationen.bibliothek.kit.edu/1000171104/152952099). Ballou et al. (2021) kiểm định juice qua curiosity, competence, effectance — [MIT PDF](https://people.csail.mit.edu/dkao/pdf/ballou2021effectance.pdf); [Imperial](https://spiral.imperial.ac.uk/entities/publication/253c32f5-d124-4a23-88b5-9aaaf114608d)
- Bằng chứng trái chiều: Juul & Begy (2016) cho kết quả null. Một nghiên cứu arXiv 2025 cho thấy chữ tượng thanh có juice cộng particle tăng trải nghiệm mà không làm giảm hiệu suất — [KIT](https://publikationen.bibliothek.kit.edu/1000171104/152952099); [arXiv 2512.13695](https://arxiv.org/html/2512.13695)
- Một nghiên cứu 2025 so sánh infographic "juicy" và "dry" về mức tương tác *và mức ghi nhớ thông tin*, rất sát với game học — [arXiv 2506.17011](https://arxiv.org/pdf/2506.17011) (*chưa đọc kết quả*)

### Inferences
- Bộ juice tối thiểu cho Lexicon Arcade: (1) đếm điểm tuần tự kiểu Balatro với âm thanh tăng cao độ, (2) hit pause khoảng 50–100ms khi chọn đúng, (3) rung nhẹ (Haptics chỉ có trên Safari iOS hạn chế, cần kiểm chứng) hoặc screen shake *tỉ lệ* với combo, (4) permanence: thẻ từ đã thuộc "dán" lên bộ sưu tập. Kao (2020) cho thấy nên dừng ở mức "High", có tùy chọn giảm hiệu ứng (reduced motion).
- Juice phải *mang thông tin* (thẻ nào được điểm, vì sao), không chỉ trang trí. Như vậy nó vừa là celebration (Fogg) vừa là feedback sư phạm.
- Juice không được che mất phản hồi sửa lỗi: khi sai, hiển thị đáp án đúng rõ ràng, nhanh, không có hiệu ứng ồn ào làm phân tâm.

### Gaps
- Không truy xuất được danh sách kỹ thuật cụ thể của talk "Juice it or lose it" (Jonasson & Purho, GDC Europe 2012) từ nguồn có thể trích dẫn. Theo kiến thức nền, *chưa xác minh trong đợt này*, talk dùng một bản clone Breakout và thêm tweening/easing, squash-and-stretch, particle, âm thanh, screen shake... Cần xem video gốc.
- Không có nguồn xác minh về "6 thành phần" trong sách Swink. Chỉ xác nhận được 3 phần cốt lõi.
- PDF arXiv 2011.09201 (khảo sát về game feel) tải được nhưng không trích được văn bản.

## Áp dụng cho Lexicon Arcade

Nguyên tắc chung: *hành động chơi = hành động học*. Mọi điểm số, combo, phần thưởng chỉ phát sinh từ việc nhận diện, nhớ lại, nghe hoặc dùng đúng ngôn ngữ. Bài học Gardenscapes ([Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)): không có quyết định chiến lược thì cơ chế vô nghĩa.

| # | Cơ chế (nguồn cảm hứng) | Hành động học được gắn vào | Rủi ro cần tránh |
|---|---|---|---|
| 1 | **Blind với điểm mục tiêu tăng dần** (Balatro) | Mỗi blind là một loạt 8–12 câu (chọn nghĩa, điền collocation, nghe chép số liệu). Điểm = Chips (số câu đúng × độ khó band) × Mult (combo, tốc độ, chất lượng). | Thưởng tốc độ quá nặng khiến người học đoán bừa. Giới hạn hệ số tốc độ, và trả lời sai thì reset combo, không chỉ trừ điểm. |
| 2 | **Joker là modifier thụ động có synergy** (Balatro) | Joker thưởng *loại kiến thức*: "+3 Mult với mỗi từ đúng có hậu tố -tion", "×1.5 nếu đúng cả từ đồng nghĩa trong Reading", "+Chips khi nghe đúng tên riêng/số". Người học buộc phải để ý cấu tạo từ để build. | Joker thưởng may mắn hoặc thao tác UI thay vì kiến thức. Joker nào cũng phải điều kiện trên một hành vi ngôn ngữ đo được. |
| 3 | **Đếm điểm tuần tự có juice** (Balatro, Kao 2020) | Sau mỗi câu, từng nguồn điểm "nổ" lần lượt kèm nhãn ("collocation đúng +20", "đúng lần 3 cách ngày ×1.2"), giúp người học thấy vì sao mình giỏi. | Juice mức "Extreme" làm giảm hiệu suất ([Kao 2020](https://www.x-mol.com/paper/1307980428882448384)). Giữ ở mức Medium/High, có nút tua nhanh và chế độ reduced motion. |
| 4 | **Bản đồ rẽ nhánh: Elite/Rest/Shop/Boss** (Slay the Spire) | Elite là đoạn Reading/Listening band cao hơn, thưởng joker hiếm. Rest là ôn SRS các thẻ sắp quên. Shop là chọn gói từ chủ đề (Environment, Education...). Boss là mini-test kỹ năng tổng hợp của tầng. | Người học né mãi nút khó. Yêu cầu tối thiểu một Elite mỗi tầng, hoặc thưởng boss tăng theo số Elite đã qua. |
| 5 | **Meta-progression mở rộng lựa chọn, không buff chỉ số** (Hades Mirror) | Mỗi run (kể cả thua) cho "mực" để mở dạng bài mới (paraphrase, matching headings), chủ đề mới, joker mới vào pool. | Buff làm bài dễ hơn thì điểm không còn phản ánh năng lực, và quá nhiều loại tài nguyên gây rối ([Hades II review](https://www.gamesradar.com/games/roguelike/hades-2-review-2025)). Dùng tối đa 1–2 loại tiền tệ. |
| 6 | **Thất bại có lãi** (Hades) | Khi thua, tất cả từ sai được đưa vào hàng ôn SRS và mở một "ghi chú giải thích" (ví dụ phân biệt affect/effect). Màn hình thua là màn hình học. | Màn hình thua mang tính trừng phạt hoặc mất tiến trình. Không bao giờ xóa thẻ đã thuộc khi thua. |
| 7 | **God Mode / trợ lực tăng dần** (Hades) | Sau mỗi run thua, có thể bật trợ lực: thêm 1 gợi ý chữ cái đầu, thêm 20% thời gian nghe, phát lại audio thêm 1 lần. | Trợ lực ẩn hoặc tự bật khiến người học hiểu sai trình độ của mình. Ghi rõ trên kết quả "chơi với trợ lực". |
| 8 | **Streak + Streak Freeze + run tối thiểu nhỏ** (Duolingo, Fogg) | Streak tính khi hoàn thành ≥1 blind (khoảng 90 giây). Freeze kiếm được bằng chơi (ví dụ 1 freeze mỗi 7 ngày, giữ tối đa 2), dựa trên số liệu Freeze tối đa 2 cho DAU +0.38% mà không làm tăng ngày nghỉ ([Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit)). | Streak thành "playing by appointment" gây lo âu ([Zagal et al.](https://research.chalmers.se/en/publication/177148)). Phải có slack, không hiện thông báo dằn vặt, và cho phép "kỳ nghỉ" dài. |
| 9 | **Một thông báo "cứu streak" duy nhất** (Duolingo streak-saver, "protect the channel") | Một push/nhắc PWA buổi tối kèm 1 từ đang sắp quên trong SRS ("'mitigate' sắp trôi, 90 giây để giữ nó?"). | Spam làm hỏng kênh (ví dụ Groupon). Tự động ngừng nhắc nếu 7 ngày không phản hồi ([Lenny's](https://lennysnewsletter.com/p/how-duolingo-reignited-user-growth)). Lưu ý (kiến thức nền, chưa xác minh trong đợt này): web push trên iOS chỉ chạy khi PWA đã được thêm vào Home Screen. |
| 10 | **Streak wager / cược tự tin** (Duolingo Streak Wager +14% D7) | Trước câu khó, người học "cược" độ tự tin (chắc/không chắc). Đúng mà chắc thì Mult cao. Sai mà chắc thì thẻ được ôn sớm hơn. Đây là luyện metacognition. | Cược bằng tài nguyên khó kiếm hoặc mất streak, tức là thành cờ bạc. Chỉ cược điểm trong run, không cược thứ có giá trị lâu dài. |
| 11 | **Ghost league / đua với chính mình** (Duolingo leaderboards +17% thời gian học) | League tuần với "bóng ma" là các run trước của chính mình, hoặc mục tiêu XP tuần tự đặt. Xếp hạng theo *số từ mới đạt mức thuộc*, không theo XP thô. | XP thô thúc farm câu dễ (suy luận; chưa tìm được nguồn số liệu về việc cày XP trong league Duolingo). Tính điểm league theo tiến bộ có ý nghĩa và giới hạn XP từ nội dung đã thuộc. |
| 12 | **Bộ sưu tập thẻ từ với edition** (Balatro foil/holo/polychrome, sưu tầm có đạo đức) | Thẻ thường khi đúng lần đầu. Foil khi đúng 3 lần cách ngày (SRS). Holo khi dùng đúng trong câu tự viết hoặc nói. Bộ sưu tập chính là bản đồ vốn từ IELTS theo chủ đề. | Biến sưu tập thành gacha ngẫu nhiên. Edition chỉ đến từ thành thạo, không bao giờ từ rút thăm, không bán. |
| 13 | **Phần thưởng biến thiên chỉ ở cosmetic/joker shop** (Hooked, có giới hạn) | Shop giữa blind ngẫu nhiên 3 joker để chọn (quyết định build). Rương cosmetic (theme Hello Kitty-style, khung thẻ) sau boss. | Ngẫu nhiên hóa *phản hồi đúng/sai* hoặc quyền truy cập bài. Phản hồi phải tức thì, ổn định ([Big Think](https://bigthink.com/?p=54491): giảm biến thiên mới thắng). |
| 14 | **Vòng 5–7 phút, dừng được sau mỗi blind** (GameAnalytics trung vị 5–6 phút) | 1 run = 3 blind + 1 boss ≈ 6 phút, tự lưu giữa chừng, tiếp tục được trên iPhone khi bị gián đoạn. | Run dài 20–30 phút trên mobile gây bỏ dở. Tránh "chỉ lưu khi xong run". |
| 15 | **Nhịp áp đảo, rồi căng thẳng** (Vampire Survivors) | Trong một blind: 3–4 câu ôn dễ (từ đã thuộc, tạo flow và cảm giác mạnh), rồi 1–2 câu "sóng lớn" (từ mới/band cao). Đây là xen kẽ ôn tập (interleaving). | Toàn câu dễ thì chán, không học. Toàn câu khó thì nản. Đặt một tỉ lệ đúng mục tiêu (ví dụ khoảng 80–85%, con số giả định chưa có nguồn trong đợt này) và điều chỉnh thích ứng. |
| 16 | **Celebration ngay sau hành vi** (Fogg Tiny Habits) | Mỗi câu đúng có micro-celebration (âm thanh tăng cao độ, rung nhẹ), mốc streak có animation riêng (Duolingo: +1.7% D7 cho người mới). | Celebration cả khi đoán bừa đúng. Có thể tăng thưởng khi đúng nhanh *và* đúng trước đó (mức tự tin). |
| 17 | **Event có quyết định khó** (Slay the Spire 2 events) | Event giữa map: "Đổi 1 joker lấy 5 từ học thuật khó, nếu đúng hết được joker hiếm". Người học cân nhắc rủi ro bằng chính kiến thức của mình. | Event chỉ là may rủi, không dùng kiến thức. |
| 18 | **Cân bằng dựa trên dữ liệu** (Mega Crit metrics-driven; Duolingo A/B) | Log ẩn danh cục bộ: tỉ lệ chọn và tỉ lệ thắng mỗi joker, tỉ lệ đúng mỗi từ, để chỉnh độ khó và loại joker "chết". | Tối ưu cho thời gian dùng app thay vì học. Chỉ số chính nên là "số từ đạt mức thuộc/tuần" và retention, không phải phút trên app. |

**Ghi chú về rủi ro tổng thể:**
- Thất bại Gardenscapes của Duolingo là rủi ro số 1: mỗi cơ chế ở trên phải có *lựa chọn có hậu quả* liên quan tới ngôn ngữ.
- Bài học hearts → energy: không bao giờ phạt việc làm đúng hay khóa việc học vì lý do kinh tế. Mọi giới hạn phải có lý do sư phạm minh bạch.
- Bằng chứng gamification (Sailer & Homner 2020) cho thấy hiệu ứng có thật nhưng khiêm tốn. Game fiction và chủ đề có giúp, nhưng nội dung IELTS chất lượng và SRS vẫn là lõi.
