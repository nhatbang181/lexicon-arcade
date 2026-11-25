# UI/UX, visual design, VFX/SFX, animation & nguồn asset miễn phí cho game học mobile-first (web/PWA, iPhone trước)

> Ngày nghiên cứu: 25/11/2026. Ký hiệu: **[đã kiểm chứng gốc]** = tự đọc file/endpoint gốc trong phiên này (curl LICENSE trên GitHub, Google Fonts CSS API, MDN browser-compat-data). Phần lớn còn lại lấy từ kết quả tìm kiếm/trang thứ cấp, đã ghi rõ. Nhiều con số "juice" là khuyến nghị kinh nghiệm từ blog, không phải nghiên cứu, nên chỉ coi là điểm khởi đầu để tinh chỉnh.

## 1. UI/UX của app/game học hàng đầu: layout màn quiz, thumb zone, một hành động chính, HUD, màn thưởng/recap, onboarding, mascot

### Takeaway
Duolingo là hình mẫu được tài liệu hóa tốt nhất: ngôn ngữ hình khối tròn, màu tươi, nút bo tròn; motion tập trung vào khoảnh khắc thưởng (kết thúc bài, streak, leaderboard) theo nguyên tắc "vào thẳng vấn đề, đừng chôn phần thưởng"; nhân vật dựng bằng Rive với state machine (tư thế + miệng/viseme riêng). Về Brilliant, Khan Academy Kids, Balatro và Headspace, tôi không tìm được nguồn gốc trong phiên này.

### Cited Findings
- Phong cách minh họa của Duolingo chuyển từ hình phẳng, góc nhọn, màu trầm sang **tròn hơn, tươi hơn**. Bản redesign app năm 2018 đi cùng hướng với nút bo tròn trên nền trắng — [Duolingo blog: Shape language](https://blog.duolingo.com/shape-language-duolingos-art-style/)
- Nguyên tắc thiết kế: "tối giản tốt nhưng không được đánh đổi sự rõ ràng"; thiết kế tốt là quyết định bỏ gì, giữ gì — [Duolingo blog: Core tabs redesign](https://blog.duolingo.com/core-tabs-redesign)
- Motion designer của Duolingo làm các khoảnh khắc như streak update, hoàn thành bài, thay đổi leaderboard, toast; nguyên tắc là vào thẳng vấn đề, không chôn phần thưởng — [Duolingo blog: Design hub](https://blog.duolingo.com/hub/design) (qua tóm tắt kết quả tìm kiếm)
- Duolingo ra animation mới cho mốc streak, Friend Streak và **màn kết thúc bài** — [Duolingo product highlights](https://blog.duolingo.com/product-highlights/)
- Home 2022: thay icon vuông bằng **lộ trình tuyến tính** gồm các vòng tròn hình viên sỏi (path) — [Duolingo blog: New home screen](https://blog.duolingo.com/new-duolingo-home-screen-design)
- Duo là yếu tố hình ảnh quan trọng nhất của thương hiệu; nhân vật mới phải "giống họ" với Duo — [Duolingo blog: Building character](https://blog.duolingo.com/building-character/)
- Lip-sync: mỗi nhân vật có bộ hình miệng (viseme) riêng hợp tính cách. Animator dựng một state cho tư thế chung trong bài và **state riêng chỉ cho miệng** — [Duolingo blog: World character visemes](https://blog.duolingo.com/world-character-visemes)
- Duolingo dùng Rive **đầu tiên cho animation phần thưởng** (rương rung, gem bật ra), sau đó cho lip-sync khi trải nghiệm tiến gần video game — [Rive blog: Creative technologists at Duolingo](https://rive.app/blog/creative-technologists-duolingo-s-solution-to-the-designer-to-developer-handoff)
- Phản hồi trong bài: đúng thì pop-up xanh "Correct!", sai thì pop-up đỏ "Incorrect" — [Duolingo blog: Explain My Answer](https://blog.duolingo.com/explain-my-answer-now-free)
- Phản hồi thời gian: dưới 0,1 s cảm giác tức thời như thao tác trực tiếp, chỉ cần hiển thị kết quả. Đến 1 s người dùng vẫn giữ mạch suy nghĩ nhưng nhận ra độ trễ; quá mức này phải báo đang xử lý. 10 s là giới hạn giữ chú ý, quá nữa cần % tiến độ và nút hủy — [NN/g: Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/)
- Âm "đúng" có thể gây khó chịu lâu dài: một người dùng Khan Academy xin tùy chọn tắt âm thanh khi trả lời đúng — [Khan Academy community](https://support.khanacademy.org/hc/da/community/posts/115001640051/comments/360008380852)
- Một bài phân tích (bên thứ ba) cho rằng chime thưởng từ 2016 của Duolingo đã thành tín hiệu điều kiện hóa cho tiến bộ — [The Cognitive Load (Substack)](https://thecognitiveload.substack.com/p/a-40-day-duolingo-streak) — *nguồn phân tích, không phải Duolingo*

### Inferences
- Bố cục màn drill nên theo mẫu Duolingo: thanh tiến độ mỏng trên cùng (kèm nút thoát và tim/combo), đề ở giữa, đáp án dạng thẻ lớn ở nửa dưới (vùng ngón cái), **một nút chính full-width ở đáy** (Kiểm tra → Tiếp tục). Phản hồi đúng/sai hiện bằng tấm trượt từ dưới lên, đổi màu và tái dùng chính nút đó, nên người chơi không phải dời tay.
- Phản hồi khi chạm phải xuất hiện dưới 100 ms (NN/g). Mọi animation chấm điểm chạy *sau* phản hồi tức thời, không chặn input.
- Màn thưởng/recap: payoff (XP, combo, từ mới thuộc) phải lên đầu. Animation thưởng có thể bỏ qua bằng tap. Nên có nút mute âm thanh riêng (bài học từ Khan Academy).
- Mascot nên dùng tiết chế: xuất hiện ở onboarding, empty state, màn kết thúc bài và lúc streak, không đứng trên mọi màn drill để khỏi phân tán đọc hiểu.

### Gaps
- Chưa tìm được nguồn gốc (blog/GDC) về UI của Brilliant, Khan Academy Kids, Balatro và Headspace (mascot, empty state, onboarding) trong phiên này. Report writer không nên trích dẫn chi tiết về các app này nếu chưa có nguồn.
- Không có số liệu chính thức của Duolingo về thời lượng animation, easing hay âm thanh (sound spec).
- Không tìm được nguồn về pitfall khi dùng mascot (ví dụ "guilt-trip" notifications) trong phiên này.

## 2. Khả năng đọc & accessibility cho nội dung học (cỡ chữ, độ dài dòng, tương phản WCAG 2.2, dyslexia, font tiếng Việt, dark/light)

### Takeaway
Vùng chạm: WCAG 2.2 AA tối thiểu 24×24 CSS px, AAA/Apple/Material ở mức 44–48. Nên thiết kế ở 44–48 px. Đã kiểm chứng trực tiếp qua Google Fonts API: **Baloo 2, Be Vietnam Pro, Lexend, Lexend Deca, Nunito, Quicksand đều có subset `vietnamese`**. **Fredoka và Atkinson Hyperlegible Next KHÔNG có** subset tiếng Việt.

### Cited Findings
- WCAG 2.2 SC 2.5.8 (AA): mục tiêu chạm ≥ 24×24 CSS px, hoặc có khoảng cách offset 24 px tới mục tiêu lân cận; link inline trong văn bản được miễn. SC 2.5.5 (AAA) yêu cầu 44×44 CSS px. Apple HIG dùng 44 pt, Material 48 dp — [Smashing Magazine](https://smashingmagazine.com/2024/07/getting-bottom-minimum-wcag-conformant-interactive-element-size/); [Deque axe target-size](https://dequeuniversity.com/rules/axe/4.8/target-size); [frontendchecklist](https://frontendchecklist.io/rules/accessibility/touch-targets)
- Subset tiếng Việt theo Google Fonts CSS2 API (curl với UA iPhone, 25/11/2026) **[đã kiểm chứng gốc]** — [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro):
  - Baloo 2: devanagari, **vietnamese**, latin-ext, latin
  - Be Vietnam Pro: **vietnamese**, latin-ext, latin
  - Lexend / Lexend Deca: **vietnamese**, latin-ext, latin
  - Nunito: cyrillic(-ext), **vietnamese**, latin-ext, latin
  - Quicksand: **vietnamese**, latin-ext, latin
  - Fredoka: hebrew, latin-ext, latin (**không có vietnamese**)
  - Atkinson Hyperlegible Next: latin-ext, latin (**không có vietnamese**)
- Be Vietnam Pro dùng license SIL OFL 1.1, có 9 weight (100–900) kèm italic thật. Nhà thiết kế có tinh chỉnh dấu tiếng Việt ("adaptive forms") — [Fontsource: Be Vietnam Pro](https://fontsource.org/fonts/be-vietnam-pro/about); [RightFont](https://rightfontapp.com/family/be+vietnam+pro)

### Inferences
- Theo chuẩn WCAG đã biết (không fetch lại trong phiên này): tương phản chữ thường ≥ 4.5:1, chữ lớn ≥ 3:1, thành phần UI ≥ 3:1. Không truyền đạt đúng/sai **chỉ bằng màu**: thêm icon ✓/✗ và chữ.
- Gợi ý typography cho iPhone: thân bài ≥ 17 px (tương đương Body của iOS); từ vựng chính hiển thị 28–40 px; độ dài dòng 45–75 ký tự cho đoạn giải thích; line-height 1.4–1.6 cho tiếng Việt vì dấu chồng (ví dụ "ộ", "ỗ") cần khoảng trên. Đây là kinh nghiệm phổ biến, chưa có nguồn trích trong phiên này.
- Dyslexia: Lexend được thiết kế quanh khả năng đọc (độ rộng chữ). Lexend có tiếng Việt nên có thể dùng làm font đọc/giải thích, còn Baloo 2 làm font tiêu đề vui. Tránh nghiêng, tránh justify, tránh chữ hoa toàn bộ cho đoạn dài.
- Dark mode: dùng token màu ngữ nghĩa (`--surface`, `--text`, `--success`, `--danger`), không đảo màu thuần. Màu xanh/đỏ của feedback cần kiểm tra lại tương phản riêng trên nền tối.

### Gaps
- Chưa trích nguồn gốc cho: WCAG 1.4.3 contrast, khuyến nghị độ dài dòng (Baymard/NN/g), nghiên cứu hiệu quả Lexend với dyslexia. Report writer nên gắn nhãn đây là "chuẩn phổ biến".
- Chưa kiểm tra kỹ chất lượng render dấu tiếng Việt của Baloo 2 ở weight 800 (dấu có bị dính hay cắt line-height không). Cần test thực tế trên Safari iOS.

## 3. Juice/feedback: thông số timing, easing, squash & stretch, hit-stop, screen shake, particle; sound UI; haptics trên iOS web

### Takeaway
Các con số "juice" chủ yếu là khuyến nghị kinh nghiệm: hit-stop/flash 40–100 ms, shake 0,1–0,3 s theo mô hình "trauma" (Eiserloh), và VFX + SFX + shake phải cùng khung hình. Trên iOS Safari **không có `navigator.vibrate`**. Mẹo duy nhất là `<input type="checkbox" switch>` (iOS 17.4/18+) tạo haptic khi toggle, nhưng đây là hành vi phụ, có thể bị Apple gỡ.

### Cited Findings
- Mô hình trauma shake: giá trị trauma 0–1 cộng dồn khi va chạm và giảm dần mỗi frame; độ dời = trauma² nhân với Perlin noise (do Squirrel Eiserloh phổ biến) — [gamejuice: Screen shake guide](https://gamejuice.pages.dev/articles/screen-shake-guide) — *nguồn thứ cấp, chưa xem talk GDC gốc*
- Shake ngắn, khoảng 0,1–0,3 s tối đa, tỉ lệ với quy mô sự kiện. VFX, âm thanh và shake phải trúng **cùng một frame**, lệch vài frame đã thấy sai — [gamejuice: Screen shake guide](https://gamejuice.pages.dev/articles/screen-shake-guide)
- Hit-stop 40–60 ms cho sát thương/chuyển pha — [molbv: Juice that matters](https://molbv.github.io/blog/2025-06-24-juice-polish.html); flash trắng khi trúng 50–100 ms — [eastondev: Game feedback feel](https://eastondev.com/blog/en/posts/dev/20260521-game-feedback-feel/) (hai nguồn khác nhau, không mâu thuẫn lớn)
- Hit-stop: dừng update loop/đóng băng animation của đối tượng liên quan, không đóng băng toàn bộ thế giới — [molbv: Juice that matters](https://molbv.github.io/blog/2025-06-24-juice-polish.html)
- Material 3 motion token: Short1 = 50 ms … ExtraLong4 = 1000 ms; emphasized-decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)` cho phần tử đi vào, emphasized-accelerate `cubic-bezier(0.3, 0, 0.8, 0.15)` cho phần tử đi ra — [Material Components Android: Motion.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md); [bevy_material_ui tokens](https://docs.rs/crate/bevy_material_ui/latest/source/src/motion.rs)
- iOS Safari chưa bao giờ hỗ trợ Vibration API; WebKit phản đối API này — [WebKit Bugzilla 285120](https://bugs.webkit.org/show_bug.cgi?id=285120); [il.ly blog](https://il.ly/blog/vibrate-mobile-phone-web-vibration-api). MDN BCD: `Navigator.vibrate` trên safari_ios là "mirror" của Safari desktop, còn Chrome Android hỗ trợ từ v32 và từ v60 trở đi cần user gesture **[đã kiểm chứng gốc]** — [MDN BCD Navigator.json](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json)
- Mẹo iOS: `<input type="checkbox" switch>` kích hoạt Taptic Engine khi toggle. Nguồn không thống nhất về phiên bản (17.4 hay 18.0). Các thư viện `ios-haptics` và `web-haptics` dùng switch ẩn trên iOS và fallback `navigator.vibrate()` trên Android — [ios-haptics README](https://unpkg.com/ios-haptics@3.1.1/README.md); [web-haptics browser support](https://www.mintlify.com/lochie/web-haptics/advanced/browser-support); [azukiazusa: iOS Safari WebHaptics](https://azukiazusa.dev/blog/ios-safari-web-haptics.md)
- Rủi ro: kỹ thuật dựa vào tác dụng phụ, Apple có thể gỡ — [web-haptic-engine platform support](https://sumitsahoo.github.io/web-haptic-engine/docs/guide/platform-support.html)
- ZzFX (generator SFX siêu nhẹ) dùng license MIT **[đã kiểm chứng gốc]** — [ZzFX LICENSE](https://github.com/KilledByAPixel/ZzFX/blob/master/LICENSE)

### Inferences
- Thông số đề xuất cho game học (cần tinh chỉnh thực tế):
  - Nhấn nút: scale 0.96 trong 60–80 ms, nhả bằng spring (overshoot nhẹ khoảng 1.03), tổng ≤ 200 ms.
  - Đúng: pop thẻ scale 1 → 1.08 → 1 trong 180–250 ms, burst 8–16 particle (emoji/sao) sống 400–600 ms, kèm âm "ding".
  - Sai: lắc ngang ±6–8 px, 3–4 chu kỳ trong khoảng 300 ms; **không** shake toàn màn hình khi sai (dễ gây cảm giác trừng phạt và say chuyển động).
  - Combo: pitch âm "đúng" tăng một bán cung mỗi lần đúng liên tiếp (playbackRate × 2^(n/12)), giới hạn khoảng +7–12 bán cung rồi reset. Thêm biến thiên ngẫu nhiên ±3–5% pitch để tránh lặp nhàm.
  - Screen shake chỉ dành cho sự kiện lớn (boss/level up), biên độ ≤ 8 px, ≤ 300 ms, và tắt khi `prefers-reduced-motion`.
  - Squash & stretch cho thẻ/mascot: bảo toàn thể tích (scaleX 1.1 thì scaleY khoảng 0.9).
- Âm thanh: cue UI ngắn 50–300 ms, chuẩn hóa loudness đồng đều giữa các cue (ví dụ khoảng −16 đến −20 LUFS cho SFX ngắn trên mobile; con số này là kinh nghiệm, chưa có nguồn trong phiên). Dùng Web Audio API với AudioBuffer giải mã sẵn để latency thấp. iOS yêu cầu unlock AudioContext bằng thao tác chạm đầu tiên.
- Haptics: coi là "bonus" trên iOS. Chỉ gắn vào câu đúng/sai và level-up, có toggle tắt. Không thiết kế feedback phụ thuộc vào haptic.

### Gaps
- Chưa truy cập được slide/talk gốc của Eiserloh ("Juicing Your Cameras With Math", GDC 2016, theo trí nhớ, chưa xác minh) hay Jonasson & Purho ("Juice it or lose it").
- Không tìm được nguồn chính thức về mức LUFS chuẩn cho SFX UI trên mobile, hay nghiên cứu về pitch tăng theo combo (đây là thực hành phổ biến, ví dụ trong Peggle, nhưng chưa trích được nguồn).
- Không tìm được nguồn đáng tin về số particle tối ưu trên iPhone.

## 4. Card flip / 3D transform: best practice & bug thường gặp; scale không gây layout shift; crop ảnh trong collage

### Takeaway
Bug flip trên Safari phần lớn đến từ việc **`overflow` khác `visible` (hoặc thuộc tính "grouping") trên phần tử `preserve-3d` làm phẳng ngữ cảnh 3D**, nên mặt sau lộ hoặc bị ẩn sai. Safari hỗ trợ `backface-visibility` không prefix từ **15.4**, trước đó cần `-webkit-`.

### Cited Findings
- MDN BCD: `backface-visibility` trên Safari không prefix từ 15.4, có prefix `-webkit-` từ 5.1; Safari iOS là "mirror" của Safari **[đã kiểm chứng gốc]** — [MDN BCD backface-visibility.json](https://github.com/mdn/browser-compat-data/blob/main/css/properties/backface-visibility.json)
- Trong WebKit, `overflow` buộc làm phẳng (flattening) và tắt `preserve-3d` — [WebKit Bug 71624](https://bugs.webkit.org/show_bug.cgi?id=71624) (giải thích của người báo lỗi)
- `overflow: hidden` ở phần tử cha làm hỏng `backface-visibility: hidden` của con. Một bình luận cho biết WebKit, Blink và Gecko đều có hành vi này — [WebKit Bug 79661](https://bugs.webkit.org/show_bug.cgi?id=79661)
- Firefox: `overflow: hidden` trên wrapper vô hiệu hóa `preserve-3d` — [Mozilla Bug 1201471](https://bugzilla.mozilla.org/show_bug.cgi?id=1201471)
- Mặt thẻ dựng bằng pseudo-element với `backface-visibility: hidden` có thể "tan biến" phần nằm trước mặt phẳng màn hình — [WebKit Bug 263255](https://bugs.webkit.org/show_bug.cgi?id=263255)
- Spec: overflow ≠ visible là "grouping property", buộc làm phẳng — [CSS Transform Spec Fixes explainer (W3C)](https://lists.w3.org/Archives/Public/www-archive/2019Mar/att-0002/___CSS_Transform_Spec_Fixes____Explainer.html)
- Workaround cho bo góc + overflow trên Safari: thêm `backface-visibility: hidden` và `transform: translate3d(0,0,0)` — [gist agantelin](https://gist.github.com/agantelin/1c7b32d47e7aabf2654c7d70afa07ad7)

### Inferences
- Công thức flip an toàn:
  - `.scene { perspective: 800–1200px }` (không có overflow).
  - `.card { transform-style: preserve-3d; transition: transform 400–500ms }` (không có overflow, filter, opacity < 1, hay clip-path trên chính `.card`).
  - `.face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden }`.
  - `.back { transform: rotateY(180deg) }`, nhờ vậy chữ mặt sau **không bị ngược** (lỗi "mirrored text" xảy ra khi quên xoay sẵn mặt sau 180°).
  - Bo góc và crop ảnh đặt trong **từng `.face`** (overflow:hidden trên face là được), không đặt trên `.card`.
- Tránh `opacity`/`filter` trên phần tử preserve-3d, vì đó cũng là thuộc tính grouping gây flatten. Muốn mờ thì làm mờ từng face.
- Scale/grow không gây layout shift: dùng `transform: scale()` thay cho width/height; giữ chỗ bằng kích thước cố định hoặc `aspect-ratio`. Khi cần đổi layout thật thì dùng FLIP (mục 5).
- Collage ảnh: `object-fit: cover` + `object-position: <x%> <y%>` lưu theo focal point của từng ảnh trong data. Đặt `aspect-ratio` trên khung để tránh CLS khi ảnh tải.

### Gaps
- Chưa xác minh trạng thái hiện tại (iOS 18/26) của bug 263255 và bug 79661.
- Chưa có nguồn chính thức về `object-position` focal point. Đây là kiến thức CSS chuẩn (MDN), nhưng chưa fetch trong phiên này.

## 5. Animation tối ưu hiệu năng: compositor-only, FLIP, Motion (framer-motion), Lottie vs Rive vs sprite vs CSS, reduced motion

### Takeaway
Chỉ animate `transform` và `opacity`; dùng `will-change` dè dặt. Ví dụ đo của web.dev: animate `top/left` rớt 50% frame, còn `transform` chỉ rớt 1%. Rive (binary, có state machine) phù hợp mascot tương tác. Lottie/dotLottie hợp micro-animation tuyến tính. Chưa có benchmark độc lập nghiêm túc, số liệu chủ yếu từ vendor.

### Cited Findings
- Giới hạn animation ở `transform` và `opacity` để ở lại tầng compositing; thuộc tính kích hoạt layout/paint sẽ không mượt. Đo được: `top/left` mất 37 ms rendering + 79 ms painting và rớt 50% frame, còn `transform` gần 0 và rớt 1% — [web.dev: Animations guide](https://web.dev/articles/animations-guide)
- `will-change`: chỉ dùng khi đã gặp vấn đề hiệu năng. Với phần tử thay đổi thỉnh thoảng, thêm bằng JS ngay trước khi đổi và gỡ sau khi xong — [web.dev: Animations guide](https://web.dev/articles/animations-guide)
- Rive tự nhận file nhỏ hơn Lottie 10–15 lần (ví dụ 240 KB Lottie thành 16 KB Rive) — [Rive blog: Rive as a Lottie alternative](https://rive.app/blog/rive-as-a-lottie-alternative) — *nguồn vendor*
- Ngược lại, một case study của LottieFiles kể rằng file Rive phình to khi độ phức tạp tăng nên team chuyển về Lottie — [LottieFiles case study: Dub](https://lottiefiles.com/de/case-studies/dub) — *nguồn vendor đối thủ*. Motion The Agency đánh giá Lottie nhẹ hơn và Rive hợp UI tương tác — [Motion The Agency](https://www.motiontheagency.com/blog/lottie-vs-rive)
- Callstack đo được Lottie JSON 46,2 KB so với GIF 164,5 KB — [Callstack: Lottie vs Rive](https://callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)
- Rive khuyên test trên thiết bị thật bạn ship; so sánh file import chưa tối ưu là sai cách — [Rive blog: Why importing Lotties isn't the workflow](https://rive.app/blog/why-importing-lotties-isn-t-the-workflow-rive-was-built-for)
- dotLottie (.lottie) nén zip JSON và asset để giảm dung lượng — [LottieFiles: LottieFiles or Rive](https://lottiefiles.com/blog/working-with-lottie-animations/lottiefiles-or-rive)

### Inferences
- Thứ tự chi phí trên iPhone (ước lượng, cần đo): CSS transform/opacity < sprite sheet (một ảnh, đổi background-position theo `steps()`) < animated PNG/WebP < Rive (WASM runtime khoảng vài trăm KB, tải một lần) ≈ Lottie (lottie-web khoảng 250 KB+, parse JSON). Với PWA nhỏ: dùng CSS/Motion cho UI, APNG Fluent Emoji cho reaction, Rive chỉ khi cần mascot có state machine.
- FLIP (First, Last, Invert, Play): đo vị trí trước và sau khi đổi layout, áp transform nghịch rồi animate về 0, nhờ đó mọi chuyển động layout vẫn compositor-only. Motion (framer-motion) dùng `layout` prop theo đúng kỹ thuật này. Nên dùng `LazyMotion` + `m` component để giảm bundle (theo docs Motion, chưa fetch trong phiên).
- Reduced motion: dùng `@media (prefers-reduced-motion: reduce)` (trong Motion là `useReducedMotion`/`MotionConfig reducedMotion="user"`). Thay translate/scale/shake bằng fade ngắn (≤ 150 ms), tắt parallax và particle, nhưng **giữ** phản hồi màu, icon và âm thanh.
- Pause animation lặp khi tab ẩn (`visibilitychange`) để tiết kiệm pin iPhone.

### Gaps
- Không có benchmark độc lập (CPU/GPU, FPS, pin) so sánh Lottie, Rive, CSS trên iPhone; mọi số liệu file size đều từ vendor.
- Chưa fetch docs Motion (motion.dev) về kích thước bundle hiện tại (late 2026) và API reduced motion.

## 6. Nguồn asset miễn phí & license

### Takeaway
An toàn nhất cho sản phẩm thương mại, không cần ghi công: **Fluent Emoji (MIT, cả bản animated), Kenney (CC0, chưa xác minh trực tiếp), Pixabay (Pixabay Content License), Sonniss GDC bundle, ZzFX (MIT), unDraw, Blush, Google Fonts (OFL)**. Cần ghi công: Twemoji graphics và Noto animated emoji (CC BY 4.0). Cần share-alike: OpenMoji (CC BY-SA 4.0). LottieFiles free dùng Lottie Simple License, cho phép thương mại.

### Cited Findings
- **Fluent Emoji (Microsoft)**: file LICENSE là MIT, "Copyright (c) Microsoft Corporation" **[đã kiểm chứng gốc]** — [microsoft/fluentui-emoji LICENSE](https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE)
- **Fluent Emoji Animated**: cũng MIT **[đã kiểm chứng gốc]**. Là APNG 256×256 px, không phải emoji nào cũng có bản động; repo khoảng 5 GB qua Git LFS, nên chỉ tải file cần dùng — [microsoft/fluentui-emoji-animated](https://github.com/microsoft/fluentui-emoji-animated)
- **Noto animated emoji**: artwork theo CC BY 4.0 — [Google Developers Blog 2022](https://developers.googleblog.com/2022/09/updates-to-emoji-new-characters-animation-colors-and-more.html). Font Noto Color Emoji tĩnh dùng Apache 2.0 — [allsvgicons](https://www.allsvgicons.com/collections/emoji/)
- **Twemoji**: graphics CC BY 4.0, code MIT. Emojipedia ghi khác (MIT) nên các nguồn mâu thuẫn; ưu tiên LICENSE-GRAPHICS của repo — [Emojipedia: Emoji Set Licenses](https://shop.emojipedia.org/pages/licenses)
- **OpenMoji**: CC BY-SA 4.0; bản phái sinh phải phát hành lại cùng license — [OpenMoji FAQ](https://openmoji.org/faq)
- **LottieFiles free**: mọi animation free công khai thuộc Lottie Simple License, dùng cá nhân và thương mại miễn phí. Không được gom lại làm dịch vụ cạnh tranh, không thêm DRM. Riêng **công cụ** của LottieFiles ở gói Free/Individual chỉ cho dùng phi thương mại — [LottieFiles help: commercial use](https://help.lottiefiles.com/hc/en-us/articles/900002438343-Can-I-use-a-free-animation-on-Lottiefiles-for-commercial-business-use); [LottieFiles Commercial Use Policies](https://help.lottiefiles.com/commercial-use-guide). Có mâu thuẫn về việc có bắt buộc ghi công hay không — [lilachbullock](https://www.lilachbullock.com/where-to-get-free-lottie-animations/)
- **Pixabay** (ảnh, vector, nhạc, SFX): dùng thương mại, được sửa, không cần ghi công. Không được phân phối lại file gốc như của mình. Từ 2019 dùng "Pixabay Content License" (không phải CC0). Một số track có đăng ký Content ID — [Pixabay FAQ](https://pixabay.com/service/faq/); [Wikipedia: Pixabay](https://en.wikipedia.org/wiki/Pixabay)
- **Sonniss GameAudioGDC bundle** (phát hành hằng năm, có bản 2026): royalty-free, dùng thương mại, không cần ghi công, không giới hạn số dự án; không được re-upload nguyên trạng. License từng năm có thể khác — [80.lv](https://80.lv/articles/the-gameaudiogdc-bundle-by-sonniss); [Bedroom Producers Blog 2026](https://bedroomproducersblog.com/2026/03/16/sonniss-gdc-2026-bundle/); [Freesound forum](https://freesound.org/forum/legal-help-and-attribution-questions/42190)
- **unDraw**: dùng thương mại và cá nhân, không cần ghi công. Cấm gom thành gói hay dịch vụ cạnh tranh, cấm dùng để huấn luyện AI/ML — [unDraw license](https://undraw.co/license)
- **Blush**: minh họa free dùng được, không cần ghi công. SVG và PNG chất lượng cao cần gói Pro — [Blush license docs](https://docs.blush.design/welcome-to-blush/blush-license); [muz.li 2026](https://muz.li/blog/best-free-illustration-libraries-for-designers-2026/)
- **Storyset**: theo muz.li, bản free yêu cầu ghi công (chưa xác minh trên trang gốc) — [muz.li 2026](https://muz.li/blog/best-free-illustration-libraries-for-designers-2026/)
- **ZzFX**: MIT **[đã kiểm chứng gốc]** — [ZzFX](https://github.com/KilledByAPixel/ZzFX)
- **Be Vietnam Pro**: SIL OFL 1.1 — [Fontsource](https://fontsource.org/fonts/be-vietnam-pro/about)

### Inferences
- Fluent Emoji 3D/APNG cho phong cách "cute, bóng bẩy" gần Duolingo nhất mà vẫn MIT, nên là lựa chọn số 1 cho icon, reaction và particle.
- Rive community files: cần kiểm tra license từng file (thường CC BY), không mặc định là free thương mại.
- Freesound: license khác nhau theo từng file (CC0, CC BY, CC BY-NC). Chỉ lọc CC0 để khỏi phải quản lý ghi công.
- Lưu `ASSETS_LICENSES.md` trong repo: tên asset, nguồn, URL, license, có cần ghi công không. Màn "Credits" trong app hiển thị phần CC BY.

### Gaps
- **Kenney (CC0)**: curl trang kenney.nl/support không trả text license. Chưa xác minh trực tiếp trong phiên này, dù được biết rộng rãi là CC0.
- **OpenGameArt, itch.io free packs, fffuel, jsfxr, Rive community, Freesound**: chưa fetch trang license. Đây là các nguồn có license theo từng asset, cần kiểm tra khi chọn.
- Chưa xác minh license của repo `googlefonts/noto-emoji-animation` (chỉ có blog Google).

---

## Áp dụng cho Lexicon Arcade

Checklist ưu tiên cho iPhone (P0 = bắt buộc trước khi ra mắt, P1 = nên có, P2 = polish). Các thông số motion và âm thanh là điểm khởi đầu (xem Inferences mục 3) và cần tinh chỉnh bằng test trên máy thật.

### A. Màn hình (P0 → P2)
- [ ] **P0 Drill/Quiz**: thanh tiến độ trên cùng (cao 12–16 px, bo tròn) + nút X + combo/tim. Đề ở giữa. 2–4 thẻ đáp án ở nửa dưới (cao ≥ 56 px). **Một nút chính full-width ở đáy** (cao 52–56 px, cách `env(safe-area-inset-bottom)` + 16 px). Feedback sheet trượt lên từ đáy, tái dùng nút đó cho "Tiếp tục".
- [ ] **P0 Recap/Thưởng**: payoff lên đầu (XP, độ chính xác, combo cao nhất, từ mới). Tap để bỏ qua animation. Có danh sách từ sai để ôn.
- [ ] **P0 Onboarding**: tối đa 3 bước (mục tiêu band IELTS → thời gian/ngày → chơi thử 1 drill ngay). Đăng ký tài khoản để sau.
- [ ] **P1 Home/Path**: lộ trình node tròn kiểu "pebble", node hiện tại nổi bật và có CTA "Chơi".
- [ ] **P1 Empty state**: mascot + 1 câu + 1 CTA (ví dụ "Chưa có từ sai nào. Chơi 1 vòng nhé!").
- [ ] **P1 Settings**: âm thanh (tách SFX và nhạc), haptic, giảm chuyển động (mặc định theo hệ thống), theme sáng/tối/hệ thống, cỡ chữ.
- [ ] **P2 Credits**: liệt kê asset CC BY.

### B. Design tokens
- [ ] Font: **Baloo 2** (tiêu đề, số XP, 600–800) + **Lexend** hoặc **Be Vietnam Pro** (nội dung, giải thích). Cả ba đều có subset vietnamese, đã kiểm chứng. **Không dùng Fredoka hay Atkinson Hyperlegible Next cho text tiếng Việt** vì thiếu subset. Dùng `font-display: swap` và preload weight chính.
- [ ] Cỡ chữ: body 17 px, từ khóa 32 px, tiêu đề 24–28 px, line-height 1.5 (tiếng Việt), đoạn giải thích tối đa khoảng 60ch.
- [ ] Vùng chạm ≥ 44×44 px (WCAG 2.2 AA chỉ cần 24 px, nhưng thiết kế theo 44–48).
- [ ] Màu ngữ nghĩa: `--success`, `--danger`, `--warning`, `--primary`, `--surface-1/2`, `--text-1/2`, mỗi token có biến thể light và dark. Tương phản chữ ≥ 4.5:1. Đúng/sai luôn kèm icon và chữ, không chỉ màu.
- [ ] Bo góc: 16 px (thẻ), 999 px (pill/nút). Nút "3D" kiểu Duolingo: `box-shadow: 0 4px 0 <màu đậm>`; khi nhấn thì `translateY(4px)` và shadow 0.
- [ ] Motion token: `--dur-xs: 80ms; --dur-s: 160ms; --dur-m: 240ms; --dur-l: 400ms; --ease-out: cubic-bezier(0.05,0.7,0.1,1); --ease-in: cubic-bezier(0.3,0,0.8,0.15)` (theo M3 emphasized) + một spring cho pop.

### C. Thông số motion
- [ ] Nhấn: scale 0.96 / 80 ms. Nhả: spring về 1 (overshoot ≤ 1.03).
- [ ] Đúng: thẻ pop 1 → 1.08 → 1 trong 220 ms + viền xanh + burst 8–12 particle (Fluent emoji/sao) 500 ms + SFX + haptic.
- [ ] Sai: lắc ngang ±6 px × 3 chu kỳ / 300 ms + viền đỏ + SFX trầm. **Không** shake màn hình.
- [ ] Combo ≥ 3: số combo bump scale 1.2 / 150 ms. Mỗi mốc 5/10 thêm flash 60–100 ms.
- [ ] Level-up/boss: được dùng screen shake (trauma, ≤ 8 px, ≤ 300 ms) + hit-stop 50 ms, VFX, SFX và haptic cùng frame.
- [ ] Card flip: perspective 1000 px, `rotateY` 450 ms ease-out. Mặt sau `rotateY(180deg)`. Có `-webkit-backface-visibility`. **Không** đặt overflow/opacity/filter trên phần tử preserve-3d.
- [ ] Chỉ animate `transform`/`opacity`; FLIP (Motion `layout`) cho sắp xếp lại thẻ. Dùng `will-change` tạm thời.
- [ ] `prefers-reduced-motion`: chuyển hết sang fade ≤ 150 ms, tắt shake, particle và parallax, giữ màu, icon và âm.
- [ ] Phản hồi chạm < 100 ms (NN/g). Không có animation nào chặn input quá 400 ms.

### D. Danh sách âm thanh (Web Audio, preload AudioBuffer, unlock ở lần chạm đầu)
- [ ] `tap` (20–60 ms, click mềm) · `select` (pop nhẹ) · `correct` (ding 2 nốt, khoảng 250 ms; pitch +1 bán cung mỗi combo, tối đa +12 rồi reset; jitter ±4%) · `wrong` (buzz trầm mềm khoảng 250 ms, không chói) · `combo_milestone` (arpeggio 3 nốt) · `level_up`/`lesson_complete` (fanfare 1–2 s) · `xp_tick` (tick nhanh khi đếm XP, giới hạn tần suất) · `flip` (whoosh ngắn) · `streak` · `unlock`.
- [ ] Nguồn: tạo `tap/select/correct/wrong/xp_tick` bằng **ZzFX (MIT)** vì gần như 0 KB. Fanfare và whoosh lấy từ **Sonniss GDC bundle** hoặc **Pixabay** (không cần ghi công) hoặc Kenney audio packs (CC0, chưa xác minh trong phiên).
- [ ] Chuẩn hóa loudness đồng đều giữa các cue (mục tiêu khoảng −18 LUFS, cần test). Có toggle tắt SFX (bài học từ Khan Academy).

### E. Haptics (iPhone)
- [ ] Android: `navigator.vibrate(10–20)` cho đúng, `[30,40,30]` cho sai (yêu cầu user gesture).
- [ ] iOS: thư viện `ios-haptics`/`web-haptics` (switch ẩn, iOS 17.4/18+). Coi là bonus, có toggle, có feature-detect, không phụ thuộc vào nó.

### F. Asset picks + license
| Nhu cầu | Chọn | License | Ghi công? |
|---|---|---|---|
| Emoji/icon/particle/reaction (tĩnh + động APNG) | **Microsoft Fluent Emoji + Fluent Emoji Animated** | MIT (đã kiểm chứng) | Giữ notice MIT |
| Emoji động dự phòng | Noto Animated Emoji | CC BY 4.0 | Có |
| Minh họa empty state/onboarding | unDraw (đổi màu theo brand) hoặc Blush | Free, không cần ghi công | Không (unDraw cấm dùng train AI) |
| Micro-animation (loading, confetti) | LottieFiles free (dotLottie) | Lottie Simple License | Khuyến khích |
| Mascot tương tác | Tự làm bằng Rive (state: idle/happy/sad/cheer) | Tự sở hữu | — |
| UI kit/âm thanh game | Kenney | CC0 (cần xác minh trang gốc) | Không |
| SFX | ZzFX (MIT), Sonniss GDC, Pixabay SFX | MIT / royalty-free / Pixabay CL | Không |
| Font | Baloo 2, Lexend, Be Vietnam Pro, Nunito | SIL OFL 1.1 | Không |
| Tránh/hạn chế | OpenMoji (CC BY-SA, share-alike), Storyset free (cần ghi công), Freesound ngoài CC0, Rive community chưa rõ license | — | — |

- [ ] Tạo `ASSETS_LICENSES.md` + màn Credits. Chỉ tải từng file Fluent animated cần dùng (repo khoảng 5 GB) và nén APNG sang WebP/AVIF animated nếu Safari target hỗ trợ.
