# Tối ưu hiệu năng & độ tin cậy PWA (React 19 + Vite 6 + Dexie + Workbox + Howler) cho iPhone Safari — trạng thái cuối 2026

> Ghi chú phương pháp: 15 lượt tra cứu/đọc nguồn (25/11/2026). Mục nào ghi "(kiến thức nền, chưa fetch lại phiên này)" là thông tin tôi biết từ trước, kèm URL nguồn gốc nhưng KHÔNG được mở lại để xác minh trong phiên này — người viết báo cáo nên coi là độ tin cậy trung bình. Các sự kiện gắn phiên bản iOS được đánh dấu [iOS x.y].

---

## 1. Trạng thái PWA trên iOS Safari / WebKit 2025–2026 (cài đặt, standalone, lưu trữ, eviction, persist, IndexedDB, service worker, nền, push)

### Takeaway
Từ iOS 26, mọi site "Add to Home Screen" mặc định mở dạng web app (standalone) và không còn yêu cầu cài đặt nào; quota lưu trữ từ iOS 17 rất rộng (đến 60% đĩa/origin) nhưng dữ liệu vẫn ở chế độ "best-effort" và có thể bị xoá — chỉ an toàn hơn khi app được mở từ Home Screen và `navigator.storage.persist()` được cấp. Không có background sync/fetch; push chỉ có cho web app đã thêm vào Home Screen (iOS 16.4+).

### Cited Findings
**Cài đặt / standalone**
- [iOS 26] Hộp thoại Share → Add to Home Screen có công tắc "Open as Web App", bật mặc định; tắt thì chỉ tạo bookmark. Không còn yêu cầu manifest/service worker để mở standalone; icon trong manifest vẫn được dùng và Safari 26 nhận thêm icon SVG và data URL — [openpwa: iOS by version](https://openpwa.net/reference/platforms/ios-by-version/) (trích [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)); [heise](https://www.heise.de/en/news/iOS-26-and-iPadOS-26-Changed-web-app-behaviour-on-the-home-screen-10749652.html)
- [iOS 26] Service worker của Home Screen app có thể inspect/pause trong menu Develop của Safari macOS — [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)
- Không có prompt cài đặt tự động (không có `beforeinstallprompt`) trên iOS; phải hướng dẫn người dùng bằng UI riêng — [openpwa iOS Add to Home Screen](https://openpwa.net/reference/installation/ios-add-to-home-screen/); [ecomize](https://ecomize.pl/en/blog/pwa-on-iphone-for-business) (nguồn thứ cấp)
- [iOS 17.2] Khi tạo Home Screen web app, cookie (gồm trạng thái đăng nhập) được copy sang; các storage khác (IndexedDB, localStorage, Cache) KHÔNG copy. Sau đó hai kho tách biệt hoàn toàn — [openpwa](https://openpwa.net/reference/platforms/ios-by-version/) (trích [WebKit 17.2](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/))
- [iOS 17.4, EU] Apple từng công bố gỡ Home Screen web app ở EU theo DMA rồi rút lại trước khi phát hành — [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)

**Quota & eviction**
- [Safari 17 / iOS 17+] Quota theo origin: app trình duyệt (Safari, có thể đặt làm trình duyệt mặc định) tới 60% tổng dung lượng đĩa; app khác (WKWebView nhúng) tới 15%. Quota tổng: 80% / 20%. Vượt quota origin → `QuotaExceededError`. Frame cross-origin có quota = 10% quota của origin chính — [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- Web app standalone trên Home Screen có cùng quota origin & quota tổng như khi mở trong trình duyệt (cài đặt không cho thêm dung lượng); từ iOS 17 không còn prompt xin thêm dung lượng — [WebKit 14403](https://webkit.org/blog/14403/updates-to-storage-policy/); [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)
- Eviction xảy ra khi vượt quota tổng, khi hệ thống thiếu dung lượng, hoặc "when the site has not been interacted with by the user for some time"; xoá theo origin, thứ tự LRU, "last use time" = lần tương tác người dùng hoặc thao tác storage gần nhất. Origin có trang đang mở hoặc ở chế độ persistent có thể được loại trừ — [WebKit 14403](https://webkit.org/blog/14403/updates-to-storage-policy/)
- Mặc định origin ở chế độ best-effort ("persistence is not guaranteed"). `navigator.storage.persist()` — "WebKit currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App"; kiểm tra bằng `navigator.storage.persisted()`. `estimate()` trả `usage`/`quota` nhưng quota có thể được làm nhiễu để chống fingerprinting — [WebKit 14403](https://webkit.org/blog/14403/updates-to-storage-policy/)
- Quy tắc ITP 7 ngày (từ Safari 13.1, 2020): xoá mọi script-writable storage (IndexedDB, localStorage, SW registration, Cache API) của site không được người dùng tương tác trong 7 ngày dùng Safari. Home Screen web app không thuộc Safari nên có bộ đếm "ngày sử dụng" riêng — tức là app chỉ bị tính ngày khi chính app được mở; trên thực tế được xem như miễn trừ — [WebKit: Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/) (kiến thức nền, chưa fetch lại phiên này); thảo luận dev: [Apple Developer Forums 710157](https://developer.apple.com/forums/thread/710157)
- Báo cáo cookie của Home Screen web app bị xoá sau 7 ngày (2022) — [WebKit bug 237350](https://bugs.webkit.org/show_bug.cgi?id=237350) (chỉ là bug report, không phải chính sách)

**Push / badging / SW**
- [iOS 16.4] Web Push cho Home Screen web app (Lock Screen, Notification Center, Apple Watch); Badging API (quyền tự cấp khi đã cho phép notification); manifest `id` được hỗ trợ — [WebKit 16.4](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/) qua [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)
- [iOS 18.4] Declarative Web Push (không cần service worker) — [WebKit 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/) qua [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)
- [iOS 27] Service Worker Static Routing API (`InstallEvent.addRoutes()`) cho phép bypass SW với một số request; registration SW bị xoá nếu script chính mất hoặc imported scripts không lấy lại được — [WebKit Features for Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/) qua [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)
- Không có Background Sync, Periodic Background Sync, Background Fetch; không Bluetooth/NFC/USB — [openpwa (Oct 2026)](https://openpwa.net/news/pwas-on-iphone-what-works-and-what-does-not-october-2026/); [ecomize](https://ecomize.pl/en/blog/pwa-on-iphone-for-business) (thứ cấp)

### Inferences
- Với app local-first (Dexie), rủi ro mất dữ liệu lớn nhất là: (a) người dùng chỉ dùng trong tab Safari và bỏ ≥7 ngày; (b) người dùng chơi trong Safari rồi mới "Add to Home Screen" — dữ liệu IndexedDB KHÔNG chuyển sang (iOS 17.2+). → Phải hướng người dùng cài sớm, và có export/import để chuyển dữ liệu giữa hai ngữ cảnh.
- Gọi `persist()` trong ngữ cảnh standalone (khi `matchMedia('(display-mode: standalone)')` hoặc `navigator.standalone === true`) có khả năng được cấp cao nhất.
- Thay đổi iOS 27 (xoá registration nếu script SW thiếu) làm tăng tầm quan trọng của việc không bao giờ đổi tên/đường dẫn `sw.js` giữa các bản deploy.

### Gaps
- Không tìm thấy tài liệu chính thức về các heuristic khác (ngoài Home Screen) để WebKit cấp `persist()`, và liệu origin persistent có miễn khỏi quy tắc 7 ngày hay không.
- Không tìm thấy dữ liệu chính thức về giới hạn thời gian sống của SW khi app ở nền trên iOS (thời gian bị suspend chính xác).
- Không xác minh được trực tiếp ghi chú phát hành Safari 26/27 (chỉ qua openpwa — một nguồn tổng hợp có trích link WebKit).
- Lỗi IndexedDB cụ thể 2025–2026 trên iOS (ví dụ kết nối IDB bị đóng khi app quay lại từ nền — lịch sử có các bug "Connection to Indexed Database server lost") không được tra cứu lại phiên này; nên coi là rủi ro cần phòng thủ (retry/reopen Dexie) thay vì sự kiện đã xác minh.

---

## 2. Âm thanh trên iOS: autoplay, mở khoá AudioContext, công tắc im lặng, Howler html5, range request & cache MP3

### Takeaway
Web Audio trên iOS mặc định thuộc loại "ambient" → bị tắt tiếng khi gạt công tắc im lặng; từ iOS 17 có thể đặt `navigator.audioSession.type = "playback"` để phát bất chấp công tắc (đổi lại sẽ ngắt nhạc của app khác). Howler mặc định dùng Web Audio và tự unlock ở lần chạm đầu; `html5: true` hợp cho file dài/stream nhưng có nhiều lỗi trên iOS, không chỉnh volume được, và nếu cache bằng SW thì bắt buộc cần RangeRequestsPlugin + cache được nạp trước.

### Cited Findings
- [iOS 17+] Kỹ sư Apple trên WebKit bug: từ iOS 17 có thể đặt audio session type là "playback"; mặc định là `ambient` nên audio bị tắt khi máy ở chế độ im lặng — [WebKit bug 237322](https://auto-bugs.webkit.org/show_bug.cgi?id=237322); [mailing list bug 237322](https://lists.webkit.org/pipermail/webkit-unassigned/2024-September/1186593.html)
- Web Audio bị iOS coi là âm "ambient" để trộn với app khác, cái giá là phải tuân theo công tắc im lặng; người dùng xác nhận `navigator.audioSession.type='playback'` hoặc `'play-and-record'` giải quyết được — [WebKit bug 251532](https://bugs.webkit.org/show_bug.cgi?id=251532)
- [iOS 17+/18] Với `audioSession.type` = `"transient"`/`"transient-solo"`, HTMLAudioElement không phát tiếng — [WebKit bug 264473](https://bugs.webkit.org/show_bug.cgi?id=264473)
- Bug "im lặng ở chế độ silent phát được audio nén nhưng không phát audio không nén" — [WebKit bug 262781](https://bugs.webkit.org/show_bug.cgi?id=262781)
- [iOS 17.0] AudioContext bị suspend khi nền (sửa ở 17.1); [iOS 17.4.1–17.5.1] Web Audio ngừng phát sau khi Safari mất focus; workaround tạm: thêm một audio element im lặng — [bug 261554](https://bugs.webkit.org/show_bug.cgi?id=261554); [bug 276016](https://bugs.webkit.org/show_bug.cgi?id=276016)
- AudioContext không được resume nhất quán khi trang quay lại foreground — [WebKit bug 263627](https://bugs.webkit.org/show_bug.cgi?id=263627)
- Web Audio context có thể im lặng sau khi PWA quay lại từ nền, trong khi phát qua HTML5 AudioElement vẫn ổn định — [WebKit bug 291892](https://bugs.webkit.org/show_bug.cgi?id=291892)
- WebAudio im lặng khi đóng một tab khác có audio — [WebKit bug 276687](https://bugs.webkit.org/show_bug.cgi?id=276687)
- Howler mặc định cố unlock bằng cách phát buffer rỗng ở sự kiện chạm đầu tiên (`touchend` ở bản mới; tắt bằng `Howler.autoUnlock = false`; bản cũ là `Howler.iOSAutoEnable`). `html5: true` phù hợp file lớn vì không phải đợi tải + decode toàn bộ — [howler README (npm)](https://npmjs.com/package/howler)
- Báo cáo `html5: true` hỏng sau cập nhật iOS, không phát khi màn hình khoá/ngủ — [howler issue 1721](https://www.github.com/goldfire/howler.js/issues/1721); [howler issue 1716](https://www.github.com/goldfire/howler.js/issues/1716); công tắc im lặng là nguyên nhân phổ biến của "không có tiếng" — [howler discussion 1652](https://www.Github.com/goldfire/howler.js/discussions/1652)
- Thư viện `unmute-ios-audio` (Feross) — kỹ thuật phát một thẻ `<audio>` im lặng để chuyển session sang "playback" cho Web Audio (trước khi có audioSession API) — [github feross/unmute-ios-audio](https://www.github.com/feross/unmute-ios-audio)
- Trên iOS, thuộc tính `volume` của HTMLMediaElement luôn bằng 1 (người dùng chỉnh bằng nút cứng), nên Howler html5 không fade/chỉnh volume được — [Apple Safari Web Content Guide: iOS-Specific Considerations](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html) (kiến thức nền, chưa fetch lại phiên này)
- Workbox: để cache audio/video cần (1) `RangeRequestsPlugin`, (2) thuộc tính `crossorigin` trên phần tử media kể cả cùng origin, (3) nạp cache trước (precache, `cache.add()`, hoặc `warmStrategyCache`), vì phát media chỉ lấy partial 206 nên route "won't populate the cache at runtime"; dùng `CacheableResponsePlugin({statuses:[200]})` — [Chrome for Developers: Serving cached audio and video](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video)

### Inferences
- Với game học từ vựng (âm thanh ngắn: phát âm từ, SFX), dùng Howler chế độ Web Audio (mặc định) là tốt nhất: độ trễ thấp, chỉnh volume được, request là fetch/XHR toàn file (200) nên CacheFirst trong SW hoạt động bình thường — không cần range request.
- Để người dùng nghe được phát âm khi máy đang gạt im lặng (rất phổ biến ở VN), đặt `navigator.audioSession.type = 'playback'` khi người dùng bật âm thanh — nhưng nên cho tuỳ chọn "Trộn với nhạc nền" (giữ `ambient`) vì `playback` sẽ dừng Spotify/YouTube Music.
- Phải tự xử lý resume AudioContext ở `visibilitychange`/`pageshow` và ở lần chạm tiếp theo, vì nhiều bug "im lặng sau khi quay lại từ nền".
- Chỉ dùng `html5: true` cho file dài (>~1 phút, ví dụ bài nghe IELTS), và khi đó phải precache + RangeRequestsPlugin.

### Gaps
- Không có tài liệu chính thức Apple/W3C rõ ràng về tương tác giữa `html5: true` (HTMLAudio) và công tắc im lặng trên iOS 26/27; theo hiểu biết chung HTMLAudio thuộc session "playback" nên không bị tắt bởi công tắc, nhưng chưa xác minh lại trong phiên này.
- Không tìm thấy trạng thái các bug audio-nền trên iOS 26/27 (đã sửa hay chưa).

---

## 3. Bố cục trên iPhone: 100vh vs dvh/svh, safe-area, viewport-fit=cover, bàn phím ảo & visualViewport, zoom khi input < 16px, overscroll, hover dính

### Takeaway
Dùng `100dvh` (hoặc `100svh` cho phần tử không được nhảy) thay `100vh`; `viewport-fit=cover` + `env(safe-area-inset-*)` cho tai thỏ/Dynamic Island/home indicator; input phải có cỡ chữ hiển thị ≥16px để tránh tự zoom; bọc hover bằng `@media (hover: hover)`.

### Cited Findings
- iOS tự zoom khi cỡ chữ hiển thị tuyệt đối của input < 16px; root font-size < 16px với đơn vị rem cũng gây ra lỗi này; ≥16px thì không zoom — [Rick Strahl: Preventing iOS Textbox Auto Zooming](https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing); [Stefan Judis](https://www.stefanjudis.com/notes/mobile-safari-doesnt-zoom-into-form-inputs-with-minimum-16px)
- Cần chữ nhỏ hơn: đặt `font-size:16px` rồi `transform: scale(target/16)` — [CSS-Tricks](https://css-tricks.com/?p=339455)
- Từ iOS 10 Safari bỏ qua `user-scalable=no`/`maximum-scale` cho mục đích trợ năng (không nên dựa vào chặn zoom) — [Apple Developer Forums 61762](https://developer.apple.com/forums/thread/61762)
- [Safari 15.4 / iOS 15.4] Hỗ trợ đơn vị viewport `svh/lvh/dvh` (và `svw`…) — [WebKit: New WebKit Features in Safari 15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/) (kiến thức nền, chưa fetch lại phiên này)
- `env(safe-area-inset-top|right|bottom|left)` chỉ khác 0 khi meta viewport có `viewport-fit=cover` — [MDN env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env) (kiến thức nền, chưa fetch lại phiên này)
- `VisualViewport` API (`resize`/`scroll` events) là cách xác định vùng nhìn thấy khi bàn phím ảo mở; trên iOS bàn phím không thu nhỏ layout viewport — [MDN Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API) (kiến thức nền, chưa fetch lại phiên này)
- `overscroll-behavior` được Safari hỗ trợ từ 16.0 — [caniuse overscroll-behavior](https://caniuse.com/css-overscroll-behavior) (kiến thức nền, chưa fetch lại phiên này)

### Inferences
- Trong standalone, status bar trong suốt khi dùng `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`, nên padding top bằng `env(safe-area-inset-top)` là bắt buộc.
- Với màn hình game cố định chiều cao, dùng `height: 100svh` (không nhảy khi thanh công cụ Safari co giãn) cho khung chính; trong standalone không có thanh công cụ nên svh≈dvh≈lvh.
- Thanh input trả lời (gõ từ) phải bám theo `visualViewport.height` để không bị bàn phím che; tránh `position: fixed; bottom: 0` thuần.
- `:hover` trên iOS "dính" sau khi chạm → bọc toàn bộ hiệu ứng hover trong `@media (hover: hover) and (pointer: fine)`.

### Gaps
- Không truy xuất được nguồn chính thức về hành vi `interactive-widget` meta (Chrome hỗ trợ; Safari theo hiểu biết của tôi chưa hỗ trợ) và hành vi bàn phím trong standalone iOS 26.
- Chưa xác minh tác động của iPhone Duo/iOS 27.1 lên viewport (openpwa ghi Viewport Segments chưa hỗ trợ trên Safari iOS — [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)).

---

## 4. Ngân sách hiệu năng & Core Web Vitals trên mobile; chia bundle Vite/Rollup; React 19; ảnh; font; preload

### Takeaway
Ngưỡng "good" ở p75: LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1 (cùng ngưỡng cho mobile & desktop). Từ Safari 26.2 (12/12/2025) iPhone đã tự đo được LCP và INP (Event Timing), nên RUM trên iOS giờ khả thi — nhưng INP của Safari còn lỗi, đôi khi cao bất thường.

### Cited Findings
- Ngưỡng CWV ở percentile 75: LCP good ≤2500 ms / poor >4000 ms; INP good ≤200 ms / poor >500 ms; CLS good ≤0,1 / poor >0,25; ngưỡng đặt theo khả năng đạt được trên mobile; chọn p75 để 3/4 lượt truy cập đạt mục tiêu và chống outlier mạng chập chờn — [web.dev: Defining CWV thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)
- Lighthouse (lab) dùng TBT thay INP — [web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [Safari 26.2, 12/12/2025] Hỗ trợ Largest Contentful Paint API và Event Timing API (để tính INP); LCP & INP thành "Baseline Newly available" — [web.dev blog](https://web.dev/blog/lcp-and-inp-are-now-baseline-newly-available); [caniuse LCP](https://caniuse.com/wf-largest-contentful-paint)
- INP trên Safari còn bug, đôi khi giá trị cao vô lý; Safari/Firefox đo LCP tới paintTime (Chrome tới presentationTime), chênh vài ms — [DebugBear](https://debugbear.com/blog/firefox-safari-web-vitals); [web.dev](https://web.dev/blog/lcp-and-inp-are-now-baseline-newly-available)
- Vite: Vite phát sự kiện `vite:preloadError` khi dynamic import lỗi; khuyến nghị `Cache-Control: no-cache` cho HTML; build mặc định (bản Vite hiện hành, v7+) nhắm Baseline Widely Available với Safari ≥16.4; Vite chỉ transform cú pháp, không polyfill; tối thiểu Safari 11.1 (ESM dynamic import). Docs hiện hành (Vite 8/Rolldown) cấu hình chia chunk qua `build.rolldownOptions.output.codeSplitting` — [Vite: Building for Production](https://vite.dev/guide/build)
- Vite 6 (phiên bản dự án dùng) có `build.target` mặc định `'modules'` = `['es2020','edge88','firefox78','chrome87','safari14']`, chia chunk qua `build.rollupOptions.output.manualChunks` — [Vite 6 build options](https://v6.vite.dev/config/build-options) (kiến thức nền, chưa fetch lại phiên này)
- Ảnh: Safari hỗ trợ WebP từ Safari 14 (iOS 14) và AVIF từ Safari 16 (iOS 16) — [WebKit Features in Safari 16.0](https://webkit.org/blog/13152/webkit-features-in-safari-16-0/) (kiến thức nền, chưa fetch lại phiên này)
- React: React Compiler 1.0 ổn định (10/2025) tự memo hoá, giảm re-render — [react.dev blog](https://react.dev/blog/2025/10/07/react-compiler-1) (kiến thức nền, chưa fetch lại phiên này)

### Inferences
- Phương pháp lab nên mô phỏng iPhone tầm trung: Lighthouse mobile mặc định (Slow 4G ~150 ms RTT/1,6 Mbps, CPU 4x) là đủ khắt khe; nhưng con số thật phải lấy từ RUM trên Safari 26.2+.
- Vì iPhone tối thiểu thực tế cho iOS 26 là iPhone 11 trở lên (A13+), có thể nâng `build.target` lên `['es2022','safari16.4']` để giảm code transpile.
- Với app một màn chơi: route-level `React.lazy` cho màn phụ (cài đặt, thống kê, backup), giữ vendor ổn định (react, react-dom, dexie, howler) thành chunk riêng để cache lâu qua các lần deploy.

### Gaps
- Không tìm thấy nguồn chính thức về cấu hình throttling Lighthouse hiện hành (phiên bản 12/13) — số liệu Slow 4G/CPU 4x ở trên là kiến thức nền.
- Chưa tra cứu: các pitfall hiệu năng cụ thể của React 19 (ví dụ thay đổi pre-render sibling của Suspense), font subsetting/`font-display`, và tình trạng hỗ trợ JPEG XL — cần bổ sung nếu báo cáo cần sâu.

---

## 5. Workbox: chiến lược cho dữ liệu/audio, luồng cập nhật (prompt vs autoUpdate), lỗi chunk cũ sau deploy, giới hạn GitHub Pages

### Takeaway
Dùng `registerType: 'prompt'` (mặc định của vite-plugin-pwa) để không reload giữa ván chơi; bắt `vite:preloadError` để tự reload một lần khi chunk cũ mất. GitHub Pages ép `Cache-Control: max-age=600` cho mọi file và không cho custom header → HTML/SW có thể cũ tới 10 phút, nên phải dựa vào cơ chế cập nhật SW thay vì header.

### Cited Findings
- vite-plugin-pwa: `prompt` là `registerType` mặc định; dùng `registerSW({ onNeedRefresh, onOfflineReady })` (React có hook `useRegisterSW` trong `virtual:pwa-register/react`), gọi `updateSW()` khi người dùng bấm "Cập nhật" để reload với nội dung mới; với `generateSW`, `cleanupOutdatedCaches` bật mặc định và tài liệu khuyến cáo mạnh không tắt — [vite-plugin-pwa: Prompt for update](https://vite-pwa-org.netlify.app/guide/prompt-for-update)
- Nguyên nhân "Failed to fetch dynamically imported module" sau deploy: tên file hash đổi, trang cũ yêu cầu chunk không còn tồn tại (version skew); host deploy nguyên tử xoá asset cũ — [Vite Troubleshooting](https://vite.dev/guide/troubleshooting); [Sentry](https://sentry.io/answers/failed-to-fetch-dynamically-imported-module-in-react); [Netlify forum](https://answers.netlify.com/t/nuxt3-and-missing-dynamically-imported-modules-that-return-404/90466)
- Xử lý: `window.addEventListener('vite:preloadError', (event) => { window.location.reload() })`; `event.preventDefault()` ngăn ném lỗi; trình duyệt cũ cache lỗi import trong module map nên cần reload — [Vite: Load Error Handling](https://vite.dev/guide/build)
- GitHub Pages: "We set the following Cache-Control header for all GitHub Pages content: Cache-Control: max-age=600" (trả lời GitHub Support, không rõ ngày); không hỗ trợ custom header; workaround là CDN (Cloudflare) phía trước hoặc chuyển Netlify/Vercel — [Stack Exchange (mirror)](https://backiee.wasmer.app/http_webapps_stackexchange_com/questions/119286/caching-assets-in-website-served-from-github-pages); [GitHub Community #54257](https://Www.GitHub.com/orgs/community/discussions/54257); [GitHub Community #4444](https://github.com/orgs/community/discussions/4444)
- Audio trong SW: CacheFirst + `CacheableResponsePlugin({statuses:[200]})` + `RangeRequestsPlugin`, nạp cache trước — [Chrome for Developers](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video)
- [iOS 27] Registration SW bị xoá nếu script SW chính bị thiếu — [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)

### Inferences
- Vì GitHub Pages deploy thay thế toàn bộ thư mục (asset cũ biến mất) và HTML cache 10 phút, rủi ro version skew là cao. Ba lớp phòng thủ: (1) precache toàn bộ JS/CSS bằng Workbox (chunk cũ vẫn phục vụ từ cache khi SW cũ còn điều khiển); (2) `vite:preloadError` → reload có chống vòng lặp (sessionStorage flag); (3) prompt cập nhật.
- Trình duyệt bỏ qua HTTP cache cho `sw.js` khi kiểm tra cập nhật (mặc định `updateViaCache: 'imports'`), nên max-age=600 chủ yếu ảnh hưởng `index.html` lần mở đầu — kiến thức nền về spec SW, chưa xác minh phiên này.
- Dữ liệu từ vựng tĩnh (JSON) nên precache (đổi theo hash), không phải runtime StaleWhileRevalidate, để tránh lệch phiên bản giữa code và dữ liệu.

### Gaps
- Không tìm được tài liệu chính thức hiện hành của GitHub về header cache (chỉ có câu trả lời Support không ghi ngày; tuyên bố "1 năm cho asset có hash" từ trang công cụ là không đáng tin).
- Trang "Automatic reload" (autoUpdate) và `useRegisterSW` không được đọc trực tiếp phiên này.

---

## 6. Kiểm thử: Playwright WebKit vs iOS thật, Lighthouse/PSI, đo người dùng thật không dùng analytics bên thứ ba

### Takeaway
Playwright WebKit không phải Safari iOS (không có công tắc im lặng, audio session, Home Screen/standalone, ITP thật, bàn phím ảo thật) — dùng cho regression logic/layout; các luồng audio, cài đặt, lưu trữ phải test trên iPhone thật qua Safari Web Inspector (Mac). RUM tự host là khả thi trên iOS từ Safari 26.2.

### Cited Findings
- Bản WebKit của Playwright là build WebKit mã nguồn mở, không phải Safari; khuyến nghị test trên thiết bị thật cho hành vi riêng của Safari — [Playwright docs: Browsers/WebKit](https://playwright.dev/docs/browsers#webkit) (kiến thức nền, chưa fetch lại phiên này)
- [iOS 26] Có thể inspect và pause service worker của Home Screen web app từ menu Develop — [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)
- Safari 26.2+ cung cấp LCP & Event Timing qua Performance API → thu được LCP/INP từ người dùng iOS; INP Safari còn bug — [web.dev](https://web.dev/blog/lcp-and-inp-are-now-baseline-newly-available); [DebugBear](https://debugbear.com/blog/firefox-safari-web-vitals)
- Lighthouse dùng TBT làm proxy lab cho INP — [web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)

### Inferences
- RUM không bên thứ ba: dùng thư viện `web-vitals` (Google, MIT) ghi vào Dexie bảng `metrics` cục bộ, hiển thị ở màn "Chẩn đoán" và cho xuất kèm file backup; không gửi đi đâu (GitHub Pages không có backend) — phù hợp quyền riêng tư.
- Ma trận test tối thiểu trên iPhone thật: (1) Safari tab, (2) Home Screen standalone, (3) gạt im lặng bật/tắt, (4) khoá màn hình 1 phút rồi mở lại, (5) chế độ máy bay, (6) deploy bản mới khi app đang mở.

### Gaps
- Không tra cứu được khác biệt cụ thể mới nhất (2026) giữa Playwright WebKit và Safari 26/27, cũng như mô phỏng iPhone trong Xcode Simulator (Simulator chạy Safari thật nhưng không có công tắc im lặng vật lý — kiến thức nền).

---

## 7. Độ bền dữ liệu cho app local-first (export/import, migration, snapshot)

### Takeaway
Trên iOS không có bảo đảm lưu trữ vĩnh viễn; cần coi IndexedDB là bộ nhớ đệm có thể mất và cung cấp backup do người dùng giữ (file JSON qua Share Sheet/Files), xin `persist()`, migration Dexie có version, và snapshot tự động cục bộ.

### Cited Findings
- Best-effort mặc định, eviction LRU, `persist()` cấp theo heuristic (Home Screen), luôn phải xử lý `QuotaExceededError` — [WebKit 14403](https://webkit.org/blog/14403/updates-to-storage-policy/)
- Dữ liệu Safari tab không chuyển sang Home Screen app (iOS 17.2+) — [openpwa](https://openpwa.net/reference/platforms/ios-by-version/)
- Dexie cung cấp addon `dexie-export-import` (export/import DB thành Blob JSON) và hướng dẫn gọi `navigator.storage.persist()` — [Dexie: StorageManager](https://dexie.org/docs/StorageManager); [Dexie export-import](https://dexie.org/docs/ExportImport/dexie-export-import) (kiến thức nền, chưa fetch lại phiên này)
- Dexie versioning: `db.version(n).stores({...}).upgrade(tx => ...)` để migrate có kiểm soát — [Dexie: Version.upgrade()](https://dexie.org/docs/Version/Version.upgrade()) (kiến thức nền, chưa fetch lại phiên này)
- Web Share API Level 2 (`navigator.share({ files })`) cho phép lưu file vào Files/AirDrop trên iOS 15+ — [MDN Navigator.share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) (kiến thức nền, chưa fetch lại phiên này)

### Inferences
- Nhắc backup định kỳ (ví dụ mỗi 7 ngày hoặc sau mỗi 200 lượt ôn) vì 7 ngày là mốc ITP; lưu `lastBackupAt` trong DB.
- Giữ 3 snapshot vòng (ring buffer) trong một bảng Dexie riêng trước mỗi migration và mỗi ngày đầu tiên mở app — rẻ với dữ liệu tiến độ học (vài trăm KB).
- Định dạng backup có `schemaVersion`, `appVersion`, `exportedAt`, checksum; import phải chạy qua cùng pipeline migration.

### Gaps
- Không tìm thấy thống kê thực tế về tỉ lệ mất dữ liệu IndexedDB trên iOS 26/27.

---

## Áp dụng cho Lexicon Arcade

Checklist cụ thể (React 19 + Vite 6 + Dexie + vite-plugin-pwa/Workbox + Howler, host GitHub Pages, ưu tiên iPhone):

### A. Ngân sách hiệu năng (đo trên iPhone tầm trung + Lighthouse mobile)
- [ ] LCP p75 ≤ **2,5 s** (mục tiêu nội bộ ≤ 2,0 s lần đầu, ≤ 1,0 s khi đã có SW); INP p75 ≤ **200 ms** (mục tiêu ≤ 100 ms cho thao tác trả lời); CLS ≤ **0,1** (mục tiêu ≤ 0,05).
- [ ] JS khởi tạo (route đầu) ≤ **170 KB gzip**; mỗi chunk lazy ≤ **50 KB gzip**; CSS ≤ **30 KB gzip**; tổng precache (không tính audio) ≤ **2 MB**.
- [ ] Lighthouse mobile ≥ **90** Performance; TBT ≤ **200 ms**.
- [ ] Không task dài > **50 ms** trong lúc chơi (chia việc chấm điểm/SRS bằng `scheduler.yield?.()` hoặc `setTimeout(0)`).

### B. Cấu hình Vite 6
```js
// vite.config.ts
export default defineConfig({
  base: '/<ten-repo>/',                // GitHub Pages project site
  build: {
    target: ['es2022', 'safari16.4'],  // iOS 16.4+ (push/badging); nâng từ default 'modules'(safari14)
    cssCodeSplit: true,
    chunkSizeWarningLimit: 200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          data: ['dexie'],
          audio: ['howler'],
        },
      },
    },
  },
});
```
- [ ] `React.lazy` cho: Thống kê, Cài đặt, Backup/Import, Hướng dẫn cài đặt.
- [ ] Bật React Compiler (babel-plugin-react-compiler) nếu đã ổn định trong dự án; nếu chưa: `memo` cho thẻ từ, tránh context lớn re-render toàn cây.

### C. Chống lỗi chunk cũ sau deploy (bắt buộc với GitHub Pages)
```js
// main.tsx — đặt trước createRoot
window.addEventListener('vite:preloadError', (e) => {
  const k = 'la-reload-at';
  const last = Number(sessionStorage.getItem(k) || 0);
  if (Date.now() - last > 10_000) {     // chống vòng lặp reload
    sessionStorage.setItem(k, String(Date.now()));
    e.preventDefault();
    location.reload();
  }
});
```
- [ ] Không đổi tên/đường dẫn `sw.js` giữa các bản (iOS 27 xoá registration nếu script SW mất).

### D. vite-plugin-pwa / Workbox
```js
VitePWA({
  registerType: 'prompt',               // không tự reload giữa ván
  injectRegister: false,
  manifest: {
    id: '/<ten-repo>/', start_url: '/<ten-repo>/', scope: '/<ten-repo>/',
    display: 'standalone', background_color: '#...', theme_color: '#...',
    icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,woff2,json}'],
    cleanupOutdatedCaches: true,        // để mặc định
    navigateFallback: 'index.html',
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    runtimeCaching: [{
      urlPattern: ({ request, url }) => request.destination === 'audio' || /\.(mp3|m4a)$/.test(url.pathname),
      handler: 'CacheFirst',
      options: {
        cacheName: 'la-audio-v1',
        expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 365, purgeOnQuotaError: true },
        cacheableResponse: { statuses: [200] },
        rangeRequests: true,            // chỉ cần nếu dùng html5:true
      },
    }],
  },
})
```
- [ ] React: `useRegisterSW({ onRegisteredSW(url, r) { r && setInterval(() => r.update(), 60 * 60 * 1000) } })`; hiện toast "Có bản mới — Cập nhật" chỉ khi KHÔNG đang trong ván; bấm → `updateServiceWorker(true)`.
- [ ] Kiểm tra cập nhật thêm khi `visibilitychange` → visible (iOS hay giữ app trong bộ nhớ lâu).
- [ ] Audio phát âm theo gói: tải trước bằng `caches.open('la-audio-v1').then(c => c.addAll(urls))` theo từng bộ 50 từ khi người dùng mở bộ đó (WiFi), không precache toàn bộ.

### E. Âm thanh (Howler)
- [ ] Dùng Web Audio (mặc định, `html5: false`) cho phát âm & SFX; định dạng **AAC .m4a 64 kbps mono** (hoặc MP3 64 kbps), mỗi file ≤ **30 KB**; SFX gộp thành **1 audio sprite**.
- [ ] Chỉ dùng `html5: true` cho bài nghe dài > 60 s (khi đó cần `rangeRequests: true` + nạp cache trước + `crossorigin`).
- [ ] Giữ `Howler.autoUnlock = true`; thêm màn "Chạm để bắt đầu" để chắc chắn có user gesture trước âm thanh đầu tiên.
- [ ] Công tắc im lặng (iOS 17+):
```js
function applyAudioSession(mixWithOthers) {
  if ('audioSession' in navigator) {
    navigator.audioSession.type = mixWithOthers ? 'ambient' : 'playback';
  }
}
// mặc định 'playback' khi người dùng bật "Âm thanh", tuỳ chọn "Trộn với nhạc nền" → 'ambient'
```
  Không dùng `'transient'`/`'transient-solo'` (bug không ra tiếng với HTMLAudio).
- [ ] Resume khi quay lại:
```js
const resume = () => { const ctx = Howler.ctx; if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); };
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && resume());
window.addEventListener('pageshow', resume);
document.addEventListener('touchend', resume, { passive: true });
```
- [ ] Nếu sau resume vẫn im lặng (bug iOS): `Howler.unload()` rồi tạo lại các `Howl` ở lần chạm kế tiếp.

### F. Bố cục iPhone
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/<ten-repo>/apple-touch-icon-180.png">
```
```css
html { font-size: 100%; -webkit-text-size-adjust: 100%; }
.app { min-height: 100svh; height: 100dvh;
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left); }
input, textarea, select { font-size: max(16px, 1rem); } /* chống auto-zoom */
html, body { overscroll-behavior: none; }                /* tắt bounce/pull-to-refresh trong khung game */
button { touch-action: manipulation; -webkit-tap-highlight-color: transparent; min-height: 44px; }
@media (hover: hover) and (pointer: fine) { .card:hover { transform: translateY(-2px); } }
```
- [ ] Thanh gõ đáp án bám bàn phím: `visualViewport.addEventListener('resize', () => root.style.setProperty('--kb', (innerHeight - visualViewport.height) + 'px'))`, đặt `bottom: var(--kb)`.
- [ ] Vùng chạm ≥ **44×44 pt**.

### G. Ảnh & font
- [ ] Ảnh minh hoạ: **AVIF** (iOS 16+) với fallback **WebP** qua `<picture>`; luôn khai báo `width`/`height` (CLS).
- [ ] Ưu tiên font hệ thống (`-apple-system, system-ui`); nếu dùng font riêng: woff2, subset Latin + Vietnamese (U+0102-0103, U+0110-0111, U+1EA0-1EF9…), ≤ **40 KB**/file, `font-display: swap`, `<link rel="preload" as="font" type="font/woff2" crossorigin>` chỉ cho 1 font chữ chính.

### H. Lưu trữ & độ bền dữ liệu (Dexie)
```js
export async function ensurePersistence() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (navigator.storage?.persist && standalone && !(await navigator.storage.persisted())) {
    await navigator.storage.persist();
  }
  const { usage = 0, quota = 0 } = (await navigator.storage?.estimate?.()) ?? {};
  return { standalone, persisted: await navigator.storage?.persisted?.(), usage, quota };
}
```
- [ ] Gọi `ensurePersistence()` lúc khởi động và sau lần trả lời đúng đầu tiên mỗi phiên; hiển thị trạng thái trong Cài đặt.
- [ ] Nếu KHÔNG standalone: banner hướng dẫn "Thêm vào Màn hình chính" + cảnh báo rõ "Dữ liệu trong Safari không tự chuyển sang app — hãy Xuất dữ liệu trước rồi Nhập lại trong app".
- [ ] Migration: `db.version(n).stores(...).upgrade(...)` — không bao giờ sửa version cũ; test migration từ mọi version đã phát hành bằng fixture.
- [ ] Snapshot: bảng `snapshots` giữ **3** bản gần nhất (tạo trước mỗi migration + mỗi ngày đầu mở app).
- [ ] Backup: `dexie-export-import` → Blob JSON `{schemaVersion, appVersion, exportedAt, checksum, data}` → `navigator.share({ files: [file] })` (fallback tải file). Nhắc backup khi `now - lastBackupAt > 7 ngày`.
- [ ] Bắt `QuotaExceededError` và `DatabaseClosedError`: tự `db.open()` lại 1 lần rồi báo lỗi thân thiện.

### I. Đo lường & kiểm thử
- [ ] RUM cục bộ: `web-vitals` (`onLCP`, `onINP`, `onCLS`) → bảng Dexie `metrics` (giữ 200 bản ghi), hiển thị p75 ở màn Chẩn đoán, kèm trong file backup; không gửi ra ngoài. Lưu ý INP Safari ≥26.2 còn bug → xem như tham khảo.
- [ ] CI: Playwright projects `webkit` + `iPhone 15` device descriptor cho logic/layout; Lighthouse CI mobile ngưỡng ở mục A.
- [ ] Trước mỗi phát hành, test tay trên iPhone thật: Safari tab / standalone / gạt im lặng / khoá màn hình 60 s / chế độ máy bay / deploy bản mới khi đang mở app / xuất-nhập backup.
