# Danh mục nguồn asset hình ảnh & chuyển động: IELTS "Focus Arcade"

> Bối cảnh: React 19 + Tailwind + motion/react, giao diện tối, phong cách tham khảo Duolingo/Balatro, **không pixel art**, vùng chữ học phải sạch. Dự án phi lợi nhuận, 1 người dùng, deploy GitHub Pages công khai.
> Ngày kiểm tra: 23/11/2026. Ký hiệu: ★ = khuyến nghị số 1 của nhóm. **[đã xác minh]** = đọc trang/API thật trong phiên này. **[chưa xác minh]** = theo hiểu biết chung, chưa mở trang gốc (cần tự xem lại trước khi dùng).
> Không tải file nào, không tạo tài khoản khi lập danh mục.

## Ghi chú chung về giấy phép (đọc trước)

- **CC0 / MIT / Apache / OFL**: dùng thoải mái. MIT/Apache/OFL chỉ cần giữ file LICENSE trong repo (bỏ vào `public/licenses/` hoặc `CREDITS.md`).
- **CC BY 4.0**: bắt buộc ghi công (tên tác giả + link giấy phép + nói rõ nếu có sửa). Cách gọn nhất: một trang `/credits` + footer ghi "Credits".
- **CC BY-SA 4.0** (OpenMoji): ghi công, và **bản phái sinh** (icon bạn sửa) phải phát hành cùng giấy phép. Dùng nguyên bản thì không vướng gì.
- **Lottie Simple License** (LottieFiles): không bắt buộc ghi công, được dùng thương mại; khi phân phối lại file phải "chứa và chịu" cùng điều khoản; cấm gom file để dựng dịch vụ cạnh tranh.
- **Cấm theo yêu cầu dự án**: rip asset Duolingo/Balatro, bản lậu gói trả phí. Lưu ý thêm: tránh **cú/chim xanh** cho mascot.
- **Asset nặng**: APNG của Fluent animated khoảng 2,4 MB/emoji (đã đo `Cat face`, 256×256). Nên convert sang animated WebP/AVIF ở máy (sharp/ffmpeg), hoặc chỉ dùng animated cho khoảnh khắc ăn mừng, còn lại dùng PNG 3D tĩnh và để motion/react lo chuyển động.

---

## 1. Nhân vật dẫn đường (mascot)

### Xếp hạng 3 ứng viên

| Hạng | Ứng viên | Vì sao |
|---|---|---|
| **★ 1** | **Mèo Fluent Emoji (Microsoft): bản Animated + bản 3D tĩnh** | **MIT**, không bắt buộc ghi công. Phong cách 3D bóng mềm, sang, hợp nền tối kiểu "arcade". **9 biểu cảm mèo có sẵn bản động** (đã liệt kê từ repo): Cat face, Grinning cat, Grinning cat with smiling eyes, Cat with tears of joy, Smiling cat with heart-eyes, Cat with wry smile, Kissing cat, Weary cat, Crying cat. Bản 3D tĩnh còn thêm Pouting cat. Trạng thái "ngủ / suy nghĩ" ghép bằng emoji phụ **Zzz** và **Thinking face / Sleeping face** (cả hai có bản động) đặt cạnh mèo như bong bóng. Không phải chim, khác hẳn Duolingo. |
| 2 | **Mèo Noto Animated Emoji (Google)** | **CC BY 4.0** (bắt buộc ghi công). Có **Lottie JSON** (nhẹ, vector, nét căng ở mọi kích thước), GIF, WebP. Đủ cả **9 mặt mèo** kể cả Pouting cat; bộ animated có 881 emoji, gồm Thinking face, Sleeping face, Trophy, Fire, Sparkles, Party popper, 100, Target, Check, Cross. Phong cách 2D phẳng, vui, chuyển động nảy rõ. Hợp khi cần file nhẹ (Lottie). |
| 3 | **Mascot Rive có state machine** (vd. "Rive App Mascot – Cloud character with state machine and 6 expressions", tác giả AnggaMotion) | **CC BY** (theo trang Rive Marketplace). Thật sự là một nhân vật có **6 trạng thái** do state machine điều khiển, file `.riv` sửa được. Tương tác mượt nhất (nhìn theo con trỏ, chuyển trạng thái blend). Rủi ro: cần runtime `@rive-app/react-canvas` (~150 KB+), trang không nói rõ có miễn phí/không cần tài khoản để tải; phải mở trang xác nhận. |

Phương án dự phòng "tự ghép": **Kenney Shape Characters** (CC0, 100 file) hoặc **Open Peeps** (CC0, mặt + tư thế ghép được) rồi tự animate bằng motion/react.

### Bảng nguồn mascot

| Tên | URL | Giấy phép (trích) | Ghi công? | Cách tải | Chất lượng & phong cách | Dùng vào đâu | Rủi ro/điều kiện |
|---|---|---|---|---|---|---|---|
| ★ Fluent Emoji Animated (Microsoft) | https://github.com/microsoft/fluentui-emoji-animated | **MIT**, "Copyright (c) Microsoft Corporation" [đã xác minh] | Không (giữ LICENSE) | GitHub (Git LFS, repo ~5 GB, **không clone cả repo**); tải lẻ: `https://media.githubusercontent.com/media/microsoft/fluentui-emoji-animated/main/assets/<Tên>/animated/<tên>_animated.png` (đã thử, trả 200) | 746 emoji động, APNG 256×256, 3D mềm, cao cấp | Mascot mèo, ăn mừng, streak lửa (Fire, Heart on fire), Party popper, Thumbs up | File nặng (~2,4 MB); "Not all emoji are animated". Không có Trophy/Books bản động: dùng bản tĩnh |
| Fluent Emoji (tĩnh) | https://github.com/microsoft/fluentui-emoji | **MIT** [đã xác minh] | Không | GitHub, mỗi emoji có thư mục `3D` / `Color` / `Flat` / `High Contrast` [đã xác minh] | Bộ emoji 3D đẹp nhất hiện có | Tư thế tĩnh của mascot, icon | Tránh logo/thương hiệu MS |
| Noto Animated Emoji (Google) | https://googlefonts.github.io/noto-emoji-animation/ | **CC BY 4.0** ("The artwork is available under the CC BY 4.0 license", blog Google Developers) [đã xác minh] | **Có** | CDN: `https://fonts.gstatic.com/s/e/notoemoji/latest/<codepoint>/lottie.json`, `.../512.gif`, `.../512.webp` (đã thử 3 định dạng, trả về đúng loại); index: `https://googlefonts.github.io/noto-emoji-animation/data/api.json` (881 mục) | 2D phẳng, chuyển động nảy, nhất quán | Mascot mèo (Lottie), phản hồi đúng/sai | Không có nút tải cả bộ; nên tự host file (không hotlink) |
| Rive Community / Marketplace | https://rive.app/community/ · ví dụ: https://rive.app/marketplace/26964-50676-rive-app-mascot-cloud-character-with-state-machine-and-6-expressions | "Marketplace files are all shared under a CC BY license" (docs Rive) [đã xác minh] | **Có** (CC BY 4.0) | Nút Download/Remix trên trang file; runtime npm `@rive-app/react-canvas` | Nhân vật tương tác thật, state machine | Mascot tương tác, nút "sống" | Có thể cần tài khoản Rive miễn phí để Remix; chất lượng file không đều; giá file cụ thể cần kiểm tra |
| Kenney Shape Characters | https://kenney.nl/assets/shape-characters | **CC0** [đã xác minh] | Không | Zip từ trang (100 file, 2023) | Nhân vật hình khối đơn giản, phẳng | Tự ghép mascot hình học tối giản (hợp Balatro hơn) | Ít "hồn"; tự làm biểu cảm |
| Kenney Animal Pack Redux | https://kenney.nl/assets/animal-pack-redux | **CC0** [đã xác minh] | Không | Zip (240 file) | Đầu thú phẳng, nhiều loài | Avatar phụ, vật phẩm sưu tầm | Không có biểu cảm sẵn |
| Kenney Emotes Pack | https://kenney.nl/assets/emotes-pack | **CC0** [đã xác minh] | Không | Zip (480 file) | Bong bóng cảm xúc (tim, chấm hỏi, zzz…) | Bong bóng trạng thái trên đầu mascot (ngủ, suy nghĩ) | Kiểm tra bản có pixel hay không, chỉ lấy bản vector |
| Open Peeps (Pablo Stanley) | https://www.openpeeps.com/ | "Free for commercial and personal use under **CC0** License" [đã xác minh] | Không | Gumroad (gum.co/openpeeps, nhập giá 0 được); PNG/SVG | Người vẽ tay đen trắng, nhiều mặt cảm xúc | Mascot người (nếu không chọn mèo), empty state | Nét đen trắng: trên nền tối phải đảo màu hoặc đặt trong "thẻ sáng" |
| LottieFiles: mascot miễn phí | https://lottiefiles.com/free-animations/mascot | Lottie Simple License [đã xác minh] | Không (khuyến khích) | Tải Lottie JSON/dotLottie (thường cần tài khoản free) | Không đồng bộ giữa các tác giả | Khoảnh khắc lẻ (rocket, panda ngủ…) | **Khó tìm 6 trạng thái cùng một nhân vật**; các mascot pack trọn bộ thường là premium |
| OpenGameArt: "Xylo", "Squid" (megupets) | https://opengameart.org/content/xylo · https://opengameart.org/content/squid | **CC0** [đã xác minh qua trang] | Không | PNG rời + sprite sheet | Xylo: 400+ file, mặt Happy/Sad/Blink/Sassy/Confident/Shook/Cry, có walk cycle. Squid: Idle/Shock/Happy/Love/Angry/Shy/Woot | Mascot dự phòng có sẵn nhiều biểu cảm | Raster PNG; cần xem preview để chắc chắn không phải pixel art |

---

## 2. Icon MÀU

| Tên | URL | Giấy phép (trích) | Ghi công? | Cách tải | Chất lượng & phong cách | Dùng vào đâu | Rủi ro/điều kiện |
|---|---|---|---|---|---|---|---|
| ★ Fluent Emoji (3D / Color / Flat / High Contrast) | https://github.com/microsoft/fluentui-emoji | **MIT** [đã xác minh] | Không | GitHub (`assets/<Tên>/3D/*.png`, `Color/*.svg`, `Flat/*.svg`); npm wrapper cộng đồng (vd `@lobehub/fluent-emoji`) | 1.500+ emoji; 3D cực đẹp cho nền tối, Flat/Color là SVG | Icon kỹ năng (🎧 Listening, 📖 Reading, ✍️ Writing, 🗣️ Speaking), phần thưởng, cúp, lửa streak | PNG 3D 256px: đừng phóng quá 128px |
| Fluent Emoji Animated | https://github.com/microsoft/fluentui-emoji-animated | **MIT** [đã xác minh] | Không | Như nhóm 1 | 3D động | Icon "sống" lúc nhận thưởng | Nặng, cần convert |
| Noto Emoji (tĩnh) | https://github.com/googlefonts/noto-emoji | Ảnh: "**Apache license, version 2.0**"; font: OFL 1.1; cờ: public domain [đã xác minh] | Không (giữ LICENSE) | GitHub `png/`, `svg/` | Phẳng, tròn, vui | Icon phụ, cùng bộ với Noto animated | Phong cách khác Fluent: đừng trộn hai bộ trên một màn |
| Noto Animated Emoji | https://googlefonts.github.io/noto-emoji-animation/ | **CC BY 4.0** [đã xác minh] | **Có** | CDN Lottie/GIF/WebP | Như nhóm 1 | Icon động nhẹ (Lottie) | Ghi công |
| Twemoji (bản cộng đồng jdecked) | https://github.com/jdecked/twemoji | Đồ họa "**CC-BY 4.0**", code MIT [đã xác minh] | **Có** (README/About/footer, theo README) | jsDelivr: `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/<code>.svg`; npm `@twemoji/api` | Phẳng, nét gọn, rất rõ ở cỡ nhỏ | Emoji cỡ 16–24px trong chữ | Ghi công |
| OpenMoji | https://openmoji.org/ | **CC BY-SA 4.0**; câu ghi công gợi ý: "All emojis designed by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0" [đã xác minh] | **Có** | Zip GitHub release: `openmoji-svg-color.zip`, `openmoji-618x618-color.zip`… | Phẳng có viền đen, nhiều icon ngoài emoji | Icon chủ đề (môi trường, công nghệ, học thuật) cho đề IELTS | Share-alike với bản sửa; viền đen kém nổi trên nền tối |
| game-icons.net | https://game-icons.net/ | "**Creative Commons 3.0 BY**"; mẫu: "Icons made by {author}. Available on https://game-icons.net" [đã xác minh] | **Có** (theo từng tác giả) | SVG từng icon; studio online đổi màu/nền (khoảng 4.180 icon) | Silhouette game cổ điển (kiếm, khiên, cúp) | Huy hiệu, cấp độ, power-up kiểu Balatro | Đơn sắc gốc: tô màu/gradient bằng CSS; ghi công nhiều tác giả |
| Kenney Game Icons | https://kenney.nl/assets/game-icons | **CC0** [đã xác minh] | Không | Zip (105 file) | Icon UI game trắng/phẳng | Nút điều khiển, âm thanh, cài đặt | Bộ cũ (2014), ít màu |
| 3dicons | https://3dicons.co/ | "**CC0** - Creative Commons License" [đã xác minh] | Không | Nút "Download all V1", tải lẻ, Figma | 200 icon, 1.400+ render 3D nhiều góc/chất liệu | Icon hero lớn (cúp, lửa, sách, tên lửa) | Phong cách 3D khác Fluent: chọn một |
| Icons8 (3D Fluency, Color…) | https://icons8.com/ | Bản free: bắt buộc link "Icons by Icons8" tới icons8.com, đặt ở footer nếu dùng nhiều trang [đã xác minh qua trang trợ giúp] | **Có**, link bắt buộc | Tải PNG trên web (free giới hạn độ phân giải; SVG thường cần trả phí) [chưa xác minh] | Rất đẹp, đồng bộ | Chỉ khi thiếu icon đặc thù | Điều kiện link khắt khe; không dùng SVG free |
| Flaticon (free) | https://www.flaticon.com/ | Free: phải ghi công tác giả + link Flaticon ("Designed by Flaticon" hoặc tên tác giả) [đã xác minh qua FAQ giá] | **Có** | Tải PNG/SVG (giới hạn lượt/ngày, thường cần tài khoản free) | Kho cực lớn, chất lượng không đều | Lấp chỗ trống | Mỗi icon một tác giả: ghi công rườm rà |
| Streamline (bộ free) | https://www.streamlinehq.com/ | Bộ open source: **CC BY 4.0**; bộ còn lại: "Streamline Free License", cả hai **bắt buộc** link streamlinehq.com [đã xác minh qua help center] | **Có** | Web/Figma/Iconify (`@iconify-json/streamline*`) | Có bộ màu (Flex/Plump color, emoji) chất lượng cao | Icon UI có màu | Cấm nhúng nguyên bộ vào app builder |
| Iconoir | https://iconoir.com/ | MIT [chưa xác minh] | Không | npm `iconoir-react` | **Nét đơn sắc**, không phải icon màu | Chỉ icon chức năng (menu, đóng, back) | Ngoài phạm vi "icon màu"; nêu để so sánh |

---

## 3. Minh họa / hero / empty state

| Tên | URL | Giấy phép (trích) | Ghi công? | Cách tải | Chất lượng & phong cách | Dùng vào đâu | Rủi ro/điều kiện |
|---|---|---|---|---|---|---|---|
| ★ unDraw | https://undraw.co/ | "You do not need to ask permission from or provide credit"; dùng được thương mại [đã xác minh] | Không | SVG từng hình, **đổi màu chủ đạo ngay trên web** | Phẳng, sạch, rất nhiều chủ đề (học, đọc, nghe) | Empty state, onboarding, màn "hết bài hôm nay" | Cấm gom thành pack để phân phối lại, cấm dùng huấn luyện AI, **cấm hotlink/scrape**: phải tự host SVG |
| IRA Design (Creative Tim) | https://github.com/creativetimofficial/ira-design | **MIT** [đã xác minh] | Không | GitHub zip SVG/PNG | 36 nhân vật, 52 vật thể, 15 nền; 5 kiểu gradient, có bản outline | Hero gradient hợp nền tối | Bộ nhỏ |
| Humaaans | https://www.humaaans.com/ | **CC0**, "Free for commercial or personal use" [đã xác minh] | Không | Gumroad (gum.co/humaaans) / Blush | Người ghép kiểu lego, màu phẳng | Cảnh minh họa đề Speaking/Part 2 | Gumroad có thể yêu cầu email |
| Open Doodles | https://www.opendoodles.com/ | "Free for Commercial and Personal Use. No need to credit"; **CC0** [đã xác minh] | Không | SVG/PNG từng hình (33 hình, 4 GIF động) | Vẽ tay đen trắng vui | Loading/empty state | Nét đen: cần nền sáng hoặc đảo màu |
| Open Peeps | https://www.openpeeps.com/ | **CC0** [đã xác minh] | Không | Gumroad, PNG/SVG | Như nhóm 1 | Nhân vật trong tình huống hội thoại | Như trên |
| ManyPixels Gallery | https://www.manypixels.co/gallery | "You do not need to ask permission from or provide credit" [đã xác minh] | Không | SVG từng hình (nhiều bộ: Playstroke, Birdview, Chromablue…) | Phẳng/isometric, đồng bộ theo bộ | Hero, minh họa chủ đề đề thi | Cấm phân phối lại thành pack |
| DrawKit | https://www.drawkit.com/ | "Attribution is not required" [đã xác minh] | Không | Tải từ web (có thể cần email/tài khoản free) [chưa xác minh] | Nhiều bộ chất lượng cao, có bộ 3D/gradient | Hero, màn kết quả | Cấm dùng trong template/stock; điều khoản "có thể thay đổi" |
| Blush (bộ free) | https://blush.design/ | "You do not need to ask permission from or provide credit"; dùng thương mại được [đã xác minh] | Không | Cần tài khoản free; bản free thường chỉ PNG cỡ nhỏ, SVG là Pro [chưa xác minh] | Nhiều nghệ sĩ, tùy biến nhân vật | Minh họa nhân vật tùy biến | Giới hạn định dạng ở gói free |
| Storyset (Freepik) | https://storyset.com/ | Free với điều kiện "any use of the Storyset Content by the User is credited" [đã xác minh] | **Có** | Tải SVG/PNG, **có bản animated** (thường cần tài khoản free) | Rất đẹp, có hiệu ứng động, đổi màu | Hero có chuyển động | Điều khoản hạn chế "cho bên thứ ba dùng": web công khai vẫn phổ biến nhưng nên đọc lại; ghi công bắt buộc |
| Absurd Design | https://absurd.design/ | Free license: "**personal, educational, and other non-commercial purposes only**"; ghi công đúng câu "Illustration(s) from absurd.design" [đã xác minh] | **Có** | Tải bộ free | Siêu thực, vẽ tay độc đáo | Màn 404/lỗi vui | Chỉ phi thương mại (dự án này OK) |
| Shapefest | https://www.shapefest.com/ | Một số pack free, 512×512 px; bản 3000px trả phí [đã xác minh một phần] | Chưa rõ | Web | Hình khối 3D bóng bẩy | Trang trí nền hero | Điều khoản chi tiết ở trang riêng, chưa đọc |
| 3dicons | https://3dicons.co/ | **CC0** [đã xác minh] | Không | Như nhóm 2 | 3D | Hero 3D (cúp, sách) | — |

---

## 4. Animation & GIF

| Tên | URL | Giấy phép (trích) | Ghi công? | Cách tải | Chất lượng & phong cách | Dùng vào đâu | Rủi ro/điều kiện |
|---|---|---|---|---|---|---|---|
| ★ LottieFiles (free animations) | https://lottiefiles.com/ · giấy phép: https://lottiefiles.com/page/license | **Lottie Simple License**: "Use of Files without attributing the creator(s) of the Files is permitted", dùng thương mại được [đã xác minh] | Không (khuyến khích) | Lottie JSON / dotLottie; render bằng `@lottiefiles/dotlottie-react` hoặc `lottie-react` | Kho lớn nhất; tốt cho confetti, check, loading, trophy | Ăn mừng hoàn thành bài, combo, level-up | Thường cần tài khoản free để tải JSON; phân phối lại phải kèm cùng điều khoản; chất lượng không đều |
| Noto Animated Emoji | https://googlefonts.github.io/noto-emoji-animation/ | **CC BY 4.0** [đã xác minh] | **Có** | CDN `.../<codepoint>/lottie.json` | Lottie nhẹ, đồng bộ | Phản hồi đúng/sai, streak | Ghi công |
| Fluent Emoji Animated | https://github.com/microsoft/fluentui-emoji-animated | **MIT** [đã xác minh] | Không | APNG qua media.githubusercontent | 3D động | Ăn mừng | Nặng |
| Rive Community | https://rive.app/community/ | **CC BY** [đã xác minh] | **Có** | `.riv` + `@rive-app/react-canvas` | Tương tác, state machine | Nút, mascot, toggle | Runtime nặng hơn Lottie |
| react-useanimations | https://github.com/useAnimations/react-useanimations | **MIT**: "The code and the animations are free for personal and commercial use" [đã xác minh] | Không | `npm install react-useanimations` | 300 icon động micro-interaction, đổi màu bằng `strokeColor`/`fillColor` | Play/pause audio Listening, bookmark, menu | Đơn sắc, theo màu chữ |
| IconScout (Lottie free) | https://iconscout.com/free-lottie-animations | Free: "use without attributing the creator(s) … is permitted"; dùng thương mại được [đã xác minh] | Không | Lottie JSON; thường cần tài khoản free [chưa xác minh] | Nhiều Lottie 3D/flat | Bổ sung khi LottieFiles thiếu | Cấm bán lại/đăng lại file |
| Lordicon (free) | https://lordicon.com/ | Free: "**Author attribution (credit needed) required**"; cần tài khoản [đã xác minh] | **Có** | Tải sau khi đăng nhập; định dạng free không nêu rõ (thường GIF/Lottie giới hạn) | Icon động đẹp, có bản màu | Icon tính năng động | Bắt buộc tài khoản + ghi công; quyền tải mới mất khi xóa tài khoản |
| GIPHY | https://developers.giphy.com/ | API: phải hiển thị rõ "**Powered By GIPHY**"; key beta 100 lượt/giờ, miễn phí [đã xác minh qua docs/search] | **Có** (logo GIPHY) | API key (tài khoản dev free) hoặc nhúng | GIF meme, nội dung người dùng | Gần như không cần; có thể dùng cho "reaction" vui | API key lộ trên GitHub Pages; nội dung không kiểm soát; bản quyền GIF thuộc bên thứ ba |
| Tenor | https://tenor.com/ | **API đã bị Google tắt ngày 30/06/2026** [đã xác minh qua tin tức] | — | Không còn API | — | **Không dùng** | — |

---

## 5. Texture hạt / hiệu ứng / nền

| Tên | URL | Giấy phép (trích) | Ghi công? | Cách tải | Chất lượng & phong cách | Dùng vào đâu | Rủi ro/điều kiện |
|---|---|---|---|---|---|---|---|
| ★ fffuel.co (nnnoise, gggrain, ffflux, ssshape…) | https://www.fffuel.co/ | "You are free to use the Images for both personal and commercial projects"; "No attribution is required" [đã xác minh] | Không | Tạo trên web rồi xuất SVG/CSS | Noise/grain, gradient lỏng, blob: rất hợp "dark arcade" | Lớp grain phủ nền, gradient sau màn ăn mừng | Cấm phân phối lại ảnh như sản phẩm riêng |
| haikei.app | https://haikei.app/ | "Free, no signups"; ToS **không nêu rõ** quyền với ảnh tạo ra [đã xác minh] | Không nêu | Xuất SVG/PNG | 15 generator: layered waves, blob scene, low-poly, blurry gradient | Nền section, divider sóng | Thiếu điều khoản rõ: rủi ro thấp với dự án cá nhân |
| Hero Patterns | https://heropatterns.com/ | **CC BY 4.0** (badge trên trang) [đã xác minh] | **Có** (Steve Schoger) | Copy CSS hoặc "Download unstyled SVG" | Hoa văn lặp tinh tế, chỉnh màu/opacity | Nền thẻ bài kiểu Balatro (opacity 3–6%) | Đặt opacity thấp để vùng chữ sạch |
| Kenney Particle Pack | https://kenney.nl/assets/particle-pack | **CC0** [đã xác minh] | Không | Zip (80 file, 512×512) | Hạt VFX: sao, khói, lửa, lấp lánh | Confetti/sparkle bằng canvas, tsParticles | Kiểm tra từng file (mượt, không pixel) |
| Kenney UI Pack (v2.0) | https://kenney.nl/assets/ui-pack | **CC0** [đã xác minh] | Không | Zip (430 file, có bản UI Pack Sci-Fi, Adventure) | Nút, panel, slider phẳng | Tham khảo hình khối nút 3D "bấm lún" kiểu Duolingo | Bỏ qua "UI Pack – Pixel Adventure" (pixel art) |
| Kenney Emotes Pack | https://kenney.nl/assets/emotes-pack | **CC0** [đã xác minh] | Không | Zip (480 file) | Bong bóng cảm xúc | Hiệu ứng phản hồi | — |
| Pixabay (video/ảnh/GIF) | https://pixabay.com/ | "Use Content without having to attribute the author" [đã xác minh] | Không | Tải trực tiếp (một số độ phân giải cần tài khoản free) | Video loop trừu tượng, hạt bụi, bokeh | Nền video mờ ở màn chủ (nên tránh vì nặng) | Cấm bán/phân phối file nguyên trạng; cấm dùng làm thương hiệu |
| Pexels (video/ảnh) | https://www.pexels.com/ | "Attribution is not required" [đã xác minh] | Không | Tải trực tiếp | Video stock chất lượng cao | Như Pixabay | Không bán bản gốc; người trong ảnh không được bị miêu tả xấu |
| SVG Backgrounds | https://www.svgbackgrounds.com/ | Bản free cần ghi công [chưa xác minh, trang license chặn bot] | Có (khả năng cao) | Copy CSS/SVG | Nền SVG đa dạng | Dự phòng | Đọc lại license |

**Mẹo vùng chữ sạch**: grain/hoa văn chỉ đặt ở lớp `body`/khung ngoài; thẻ bài học dùng nền đặc `bg-zinc-900/95` + `backdrop-blur`, không chồng texture.

---

## 6. UI kit / component tham khảo (mã nguồn mở)

| Tên | URL | Giấy phép (trích) | Ghi công? | Cách lấy | Chất lượng & phong cách | Dùng vào đâu | Rủi ro/điều kiện |
|---|---|---|---|---|---|---|---|
| ★ Magic UI | https://magicui.design/ · https://github.com/magicuidesign/magicui | **MIT** [đã xác minh] | Không (giữ LICENSE) | Copy-paste / shadcn CLI; stack React + Tailwind + framer-motion | Shimmer button, number ticker, confetti, border beam, particles | Đếm XP, nút CTA lấp lánh, confetti | Import đổi `framer-motion` thành `motion/react` |
| React Bits | https://reactbits.dev/ · https://github.com/DavidHDev/react-bits | "**MIT + Commons Clause**", "free for personal and commercial use" [đã xác minh] | Không | `npx shadcn@latest add @react-bits/<Comp>-TS-TW` hoặc jsrepo; 215+ component (33 text, 38 animation, 48 component, 34 micro, 63 background) | Hiệu ứng chữ, nền động rất "wow" | Tiêu đề màn, nền động màn chủ (KHÔNG đặt sau vùng chữ học) | Commons Clause: cấm **bán** lại chính component; dùng trong app thì được |
| Animata | https://animata.design/ · https://github.com/codse/animata | "This project is licensed under the **MIT** License" [đã xác minh] | Không | Copy code + `tailwind-merge clsx tailwindcss-animate` | Card, hover, text effect | Thẻ bài, hover | — |
| shadcn/ui | https://ui.shadcn.com/ | MIT [chưa xác minh trong phiên] | Không | CLI `npx shadcn@latest` | Nền tảng component trung tính | Dialog, Tabs, Progress | Cần "game hóa" lại style |
| Aceternity UI | https://ui.aceternity.com/ | Trang licence chỉ nói về bản **Pro**: được làm sản phẩm cuối không giới hạn, cấm phân phối lại mã nguồn/template [đã xác minh] | Không nêu | Copy-paste | Spotlight, 3D card, beams | Học pattern hiệu ứng | Giấy phép bản free không rõ ràng: **chỉ học pattern, tự viết lại** |
| motion.dev examples | https://motion.dev/examples | Ví dụ chính thức của thư viện Motion [chưa xác minh giấy phép từng ví dụ] | — | Xem code ví dụ | Chuẩn API motion/react | Layout animation, gesture, spring | Một số ví dụ thuộc gói Motion+ trả phí: bỏ qua |
| CodePen "game ui" | https://codepen.io/search/pens?q=game%20ui | Pen public mặc định **MIT** (theo điều khoản CodePen) [chưa xác minh] | Nên ghi | Xem/copy | Không đều | Học nút 3D, thẻ lật, progress | Kiểm tra từng pen |
| Duolingo clone trên GitHub | Tìm `duolingo clone react` trên GitHub | Tùy repo | — | Chỉ đọc | — | Học luồng bài học, progress path | **Nhiều repo nhúng asset thật của Duolingo**: tuyệt đối không copy hình/âm thanh; chỉ học cấu trúc code |

---

## 7. Font hiển thị có subset tiếng Việt

Kiểm tra thật bằng **metadata chính thức của Google Fonts** (`fonts.google.com/metadata/fonts`), đối chiếu thêm với API Fontsource. Tất cả là **OFL 1.1** (miễn phí, không cần ghi công, giữ license). Cài: `npm i @fontsource-variable/<tên>` hoặc `@fontsource/<tên>` (tự host, hợp GitHub Pages), import subset `vietnamese` + `latin`.

### Font được yêu cầu kiểm tra

| Font | Có tiếng Việt? | Weights | Nhận xét "game-like" |
|---|---|---|---|
| ★ **Baloo 2** | ✅ Có | 400–800 | Tròn, đậm, vui: **số 1 cho tiêu đề/nút/điểm số** |
| Lexend | ✅ Có | 100–900 | Thiết kế để dễ đọc: **tốt cho vùng chữ học** |
| Nunito | ✅ Có | 200–1000 (+italic) | Bo tròn, giống cảm giác Duolingo; body/UI rất tốt |
| Quicksand | ✅ Có | 300–700 | Tròn mảnh, thanh lịch, yếu ở weight đậm |
| **Fredoka** | ❌ **Không** | 300–700 | Chỉ latin/latin-ext/hebrew: **loại** |
| Be Vietnam Pro | ✅ Có | 100–900 (+italic) | Dấu tiếng Việt chuẩn nhất; body/đề bài |
| Bricolage Grotesque | ✅ Có | 200–800 | Cá tính, hợp tiêu đề kiểu poster/Balatro |
| Paytone One | ✅ Có | 400 | Rất đậm, tròn: số điểm, badge |
| **Rubik** | ❌ **Không** | 300–900 | Không có vietnamese: **loại** |
| Mali | ✅ Có | 200–700 | Viết tay trẻ con, dễ thương |
| Itim | ✅ Có | 400 | Viết tay tròn, một weight |
| **Sniglet** | ❌ **Không** | 400, 800 | **Loại** |
| Chakra Petch | ✅ Có | 300–700 | Vuông vức kiểu sci-fi/arcade: HUD, timer |

### Font tròn/đậm "game-like" khác CÓ tiếng Việt (đã kiểm tra)

| Font | Weights | Gợi ý dùng |
|---|---|---|
| Grandstander | 100–900 | Tiêu đề vui, rất "game" |
| M PLUS Rounded 1c | 100–900 | Bo tròn sạch, body/UI |
| Varela Round | 400 | Bo tròn nhẹ, nhãn nhỏ |
| Coiny | 400 | Bong bóng đậm, logo/tiêu đề lớn |
| Gluten | 100–900 | Mềm, tròn, cực vui |
| Sigmar | 400 | Đậm kiểu poster/arcade |
| Rowdies | 300, 400, 700 | Đậm, tinh nghịch |
| Bungee | 400 | Biển hiệu/arcade (chỉ tiêu đề) |
| Dela Gothic One | 400 | Siêu đậm kiểu Nhật, combo/điểm |
| Playpen Sans | 100–800 | Viết tay dễ đọc |
| Baloo Bhai 2 / Baloo Da 2 | 400–800 | Cùng họ Baloo |
| Kanit, Mitr | 100–900 / 200–700 | Hình học, đậm đẹp |
| Comfortaa | 300–700 | Tròn hình học |
| Pangolin, Patrick Hand | 400 | Viết tay |
| Unbounded | 200–900 | Rộng, hiện đại, tiêu đề |
| Plus Jakarta Sans, Onest, Inter, Readex Pro | đa weight | Body/UI trung tính |
| JetBrains Mono | 100–800 | Số liệu, timer, thống kê |

**Không có tiếng Việt (tránh)**: Fredoka, Rubik, Sniglet, Lilita One, Titan One, Sour Gummy, Sora, Outfit, DM Sans, Figtree, Chewy, Luckiest Guy, Bagel Fat One, Jua, Mochiy Pop One, Rammetto One.

**Combo đề xuất**: **Baloo 2** (tiêu đề, nút, điểm) + **Lexend** hoặc **Be Vietnam Pro** (vùng chữ học, ưu tiên dễ đọc) + **JetBrains Mono** (timer/số liệu). Phương án arcade hơn: Grandstander/Paytone One cho tiêu đề, Chakra Petch cho HUD.

---

## Mẫu trang Credits (để dán vào app)

```
Emoji động: Noto Animated Emoji © Google, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
Emoji: Fluent Emoji © Microsoft, MIT License
Hoa văn: Hero Patterns by Steve Schoger, CC BY 4.0
Icon: game-icons.net, tác giả <tên>, CC BY 3.0
Font: Baloo 2, Lexend, Be Vietnam Pro, SIL Open Font License 1.1
Kenney assets (CC0), cảm ơn kenney.nl
```

## Nguồn đã tra cứu

- Google Developers Blog, Noto animated emoji (CC BY 4.0): https://developers.googleblog.com/updates-to-emoji-new-characters-new-animation-new-color-customization-and-more
- Noto emoji files docs (CDN, CC BY 4.0): https://googlefonts.github.io/noto-emoji-files/?view=docs
- Rive Marketplace docs (CC BY): https://rive.app/docs/community/marketplace-overview
- Icons8 hướng dẫn ghi công: https://intercom.help/icons8-7fb7577e8170/en/articles/10007917-how-to-use-the-icons8-freebie
- Flaticon pricing FAQ: https://www.flaticon.com/pricing
- Streamline free license: https://help.streamlinehq.com/en/articles/5354376-streamline-free-license
- GIPHY API docs: https://developers.giphy.com/docs/api
- Tenor API ngừng hoạt động 30/06/2026: https://9to5google.com/2026/06/30/google-tenor-api-gif-updates/
- Google Fonts metadata: https://fonts.google.com/metadata/fonts · Fontsource API: https://api.fontsource.org/v1/fonts/
