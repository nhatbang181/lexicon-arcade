# LUẬT CỨNG · Đợt nâng cấp "audit-max"

> Luật này **cộng thêm** vào `D:\English\AGENTS.md` và `D:\English\DECISIONS.md`. Khi mâu thuẫn, thứ tự ưu tiên vẫn là: `DECISIONS.md` > `docs/audit-max/LUAT.md` > `docs/games/*.md`, `docs/01…13` (kể cả `08-DESIGN-SYSTEM.md`) > `docs/00-SPEC.md` > code.
> Mỗi luật có mã. Báo cáo, commit và review phải trích mã luật, ví dụ `vi phạm J3`.
>
> **Mức độ** (bảng đầy đủ ở cuối file, §Z):
> - **CHẶN**: vi phạm 1 lỗi là trả về ngay, không chấm rubric.
> - **NẶNG**: mỗi lỗi chưa sửa trừ 0,5 điểm vào tiêu chí rubric tương ứng (`KIEM-THU.md` §3). Quá 2 lỗi NẶNG trên một màn là trả về.
> - **NHẸ**: phải sửa trước khi merge.
>
> **Cách kiểm**: **T** = công cụ `docs/audit-max/cong-cu/audit-ui.mjs` (tự đo, tự khoanh lỗi); **E** = test unit/E2E; **M** = mắt reviewer; **S** = đối chiếu `CREDITS.md`/manifest; **G** = `git diff`.

## A. Phạm vi và phối hợp (chống giẫm chân)
| # | Luật |
|---|---|
| A1 | Mỗi task trong `TASKS.md` có **danh sách file độc quyền**. Chỉ sửa file trong danh sách đó. Cần sửa file ngoài danh sách thì ghi vào `docs/audit-max/HANDOFF.md` mục "Cần chủ sở hữu file khác", **không tự sửa** |
| A2 | Không sửa `src/legacy/**`, `docs/archive/**`. Không xoá legacy khi Bang chưa đồng ý (AGENTS.md §6) |
| A3 | Không đụng vào việc của M5 đang chạy ở worktree khác: nhánh `swarm-r-game-s1-*`, `swarm-r-audio-speaking-*`. Cụ thể **không tạo/sửa** `src/games/s1-*`, `src/games/s2-*`, `public/audio/speaking/**` cho tới khi M5 merge |
| A4 | Mỗi task làm trên **nhánh riêng** `audit-max/<mã-task>` từ `master` mới nhất. Không rebase hay force-push nhánh của người khác |
| A5 | Không thêm thư viện ngoài danh sách. Được thêm trong đợt này (bộ tối thiểu ở `08-NGUON-ASSET.md` §2): `@number-flow/react`, `zzfx`, `@fontsource/baloo-2`, `@axe-core/playwright` (dev), `size-limit` (dev), `sharp`/`svgo`/`@dotlottie/dotlottie-js` (dev); **khi cần**: `@lottiefiles/dotlottie-react`, `@rive-app/react-canvas` (chỉ nếu chọn mascot Rive). Cấm thêm thư viện trùng chức năng motion/canvas-confetti/howler (react-spring, gsap, use-sound, js-confetti, tsparticles, lottie-react…). Mỗi thư viện ghi 1 dòng `DECISIONS.md` mục D |
| A6 | Không sửa ID item dữ liệu đã phát hành (AGENTS.md §3). Sửa nội dung item thì giữ ID, tăng `rev` |

## B. Luật trải nghiệm học (sư phạm đứng trên "vui")
| # | Luật |
|---|---|
| B1 | **Hành động chơi = hành động học.** Không thêm cơ chế mà kỹ năng điều khiển không liên quan tiếng Anh (bắn, né, rắn…) |
| B2 | Mỗi câu sai **phải** có: đáp án đúng, **lý do 1 câu tiếng Việt**, và **bằng chứng** (quote đoạn văn / đoạn audio có nút nghe lại / ví dụ dùng từ). Thiếu một trong ba = chưa Done |
| B3 | Mọi câu trả lời trong chế độ luyện **ghi vào FSRS** qua `src/core/srs` (không tự viết lịch ôn riêng trong game) |
| B4 | Không game over trong chế độ luyện. Sai chỉ làm mất combo, không mất tiến độ phiên |
| B5 | Thứ tự trên màn chơi: **nội dung học ở trên, HUD ở dưới hoặc thu gọn**. Ở 390×844, câu hỏi + ít nhất 2 lựa chọn đầu tiên phải nằm trong màn hình đầu tiên (không cuộn) |
| B6 | Độ khó thích ứng theo kết quả (`01-GAME.md` §4): cửa sổ 20 lượt gần nhất của game đó, đúng ≥ 90% → tăng 1 bậc; ≤ 65% → giảm 1 bậc; cooldown 10 lượt; mục tiêu vùng 80–85%; exam không đổi bậc. Bậc hiện tại hiển thị bằng band (4.0–9.0), **không** hiển thị "Level 1 · Training" kiểu mã nội bộ |
| B7 | Exam mode (X1 và các chế độ "Exam" trong game): **không** XP, **không** combo, **không** hạt, **không** SFX trừ `timeup`, giao diện thi máy (`08` §1). Mọi luật juice ở mục J **không áp dụng** cho exam mode |

## C. Luật nội dung và dữ liệu
| # | Luật |
|---|---|
| C1 | Không nội dung Cambridge IELTS 1–20, sách thương mại, đề thật bị lộ. `grep -ri "cambridge ielts\|official ielts\|ielts [0-9]\{1,2\} test" public/data` phải ra 0 dòng |
| C2 | Mỗi item có `source` (`authored-llm`, `authored-human`, `wikipedia-ccbysa`, `theconversation-ccbynd`, `wordlist:<tên>`) và `review` (`{by, date, verdict}`). Item không có `review.verdict == "pass"` **không** được vào pool phát hành |
| C3 | Item gốc CC BY-SA / CC BY-ND phải có ghi công hiển thị trong app (footer của bài đọc) và trong `public/data/ATTRIBUTION.md` |
| C4 | Mỗi đáp án TFNG/YNNG/Matching Headings phải qua **blind-solve** bởi ≥ 1 model khác model sinh, khớp 100%. Không khớp → sửa hoặc loại, không "giữ vì gần đúng" |
| C5 | Mỗi band 4.0–9.0 (bậc 0.5) phải có item cho mọi kỹ năng đã có game. Ngưỡng tối thiểu ở `04-DATA-NOI-DUNG.md` §3 |
| C6 | File dữ liệu legacy do LLM sinh (`anki_vocab.json`, `ielts_4skills.json`, `ielts_strategies.json`) **không** được game V3 đọc trực tiếp. Chỉ đi qua pipeline `scripts/data` + verifier |

## D. Luật giao diện
| # | Luật |
|---|---|
| D1 | Không hard-code màu trong `src/**` (trừ `src/legacy/**`, `src/design/tokens.css`, dữ liệu biểu đồ đề thi trong `ChartRenderer`). Kiểm bằng lệnh ở `KIEM-THU.md` §2 mục 6 |
| D2 | Tương phản: chữ nội dung ≥ **4.5:1**, chữ ≥ 24px hoặc ≥ 19px đậm ≥ **3:1**, viền thành phần tương tác ≥ **3:1** so với nền. Đo bằng axe-core, 0 vi phạm `serious`/`critical` |
| D3 | Vùng chạm ≥ **44×44 px** cho mọi `button`, `a[href]`, `[role=button]`, `input`, `select` (trừ chữ trong đoạn văn có thể highlight). Đo bằng `scripts/qa/tap-targets.mjs` (`KIEM-THU.md` §2) |
| D4 | Cỡ chữ tối thiểu: nội dung học **18px** (mobile 17px), UI **14px**, chú thích **12px**. Cấm chữ < 12px ở mọi chỗ |
| D5 | **0 px** cuộn ngang ở 360, 390, 820, 1280 px trên mọi route |
| D6 | Mỗi màn có **đúng 1 nút chính** (primary). Cấm dãy ≥ 3 nút cùng cỡ cùng kiểu cùng nhãn (vd 12 nút "Mở" trong Hub) |
| D7 | Không lộ thuật ngữ nội bộ ra UI: "Mốc M1", "Level 1 · Training", "FSRS", "Node 1/30", "INV-", "Δ band", "gói copy/dán" trong tiêu đề. Dùng lời người học: "Ôn 20 thẻ đến hạn", "Band 6.5" |
| D8 | Điều hướng chính dùng `<a href="#/...">` (hoặc `Link` của wouter), không dùng `<button onClick=navigate>` |
| D9 | Mọi số liệu trên shell (streak, XP) đọc từ dữ liệu thật (`src/core/gamification`). Cấm số cố định trong JSX |
| D10 | Không để lộ control gốc của trình duyệt chưa bọc (`select`, `input[type=range|date|time|checkbox|radio]`): phải có `appearance:none` + giao diện theo token (vd select chọn bài đọc R1/R2, select band ở Cài đặt, slider âm lượng). Ngoại lệ: Exam mode được dùng control trung tính giống đề máy |
| D11 | **Icon nội dung** (thẻ game ở Hub, thẻ nhiệm vụ Hôm nay, huy hiệu, Recap, empty state, Bùa) là **icon màu** từ **một bộ** (K9). Icon nét mảnh đơn sắc (`lucide-react`) chỉ dùng cho **glyph hệ thống**: back, close, menu, check, plus, more, play, settings, volume, search, chevron, keyboard-hint. Lý do: dự án anh em bị chê "ít ảnh, ít icon, icon kiểu app văn phòng" vì đúng lỗi này |

## M. Mật độ hình trên **màn khung** (không áp vùng học)
> Màn khung = Hôm nay, Hub, Thống kê, Thư viện, Portfolio, Onboarding, Recap, empty state. **Không** áp cho màn đang chơi/vùng chữ học (Focus Arcade, J3). Đo ở màn đầu 390×844.

| # | Luật |
|---|---|
| M1 | ≥ **1 minh họa/cảnh/hero** chiếm ≥ **15%** khung nhìn (minh họa SVG tải về, biểu đồ, thẻ game lớn có ảnh nền) |
| M2 | ≥ **6 icon màu** hiển thị ≥ 32 px |
| M3 | Có **nhân vật dẫn đường** (`03-ANIMATION-FEEDBACK.md` §5b) cao ≥ **72 px** (≤ 160 px ở 390; ≤ 220 px ở 1280), đang ở **trạng thái hợp màn** (vd ăn mừng ở Recap, cổ vũ ở Hôm nay, ngủ ở empty state buổi tối). Phần tử chứa nhân vật mang `data-mascot="<trạng-thái>"` – thuộc tính này **chỉ** đặt trên chính hình nhân vật (công cụ đếm, reviewer soi) |
| M4 | ≥ **1 vật đang chuyển động nhẹ** (thẻ thở, lửa streak, vòng mục tiêu) – trừ reduced-motion |
| M5 | Không có **hộp chỉ có chữ**: mọi thẻ/panel cao ≥ 80 px có ít nhất 1 hình (icon màu ≥ 32 px, minh họa, biểu đồ) |
| M7 | Thẻ cùng loại trong một màn phải **khác hình** (12 thẻ game = 12 icon riêng; 3 thẻ nhiệm vụ = 3 icon riêng) |

## J. Luật juice (cảm giác chơi) — chỉ áp dụng chế độ luyện
| # | Luật |
|---|---|
| J1 | Mỗi tương tác trong bảng `03-ANIMATION-FEEDBACK.md` §3 có **≥ 3 kênh phản hồi**: (1) chuyển động, (2) âm thanh, (3) hạt hoặc ánh sáng hoặc số bay. Rung (`navigator.vibrate`) là kênh thứ 4 tuỳ chọn trên mobile |
| J2 | Phản hồi đầu tiên xuất hiện ≤ **100 ms** sau thao tác. Đúng → câu kế ≤ **1 200 ms**. Sai → dừng đến khi người chơi bấm Enter/Tiếp |
| J3 | **Cấm** hiệu ứng chuyển động liên tục **phía sau hoặc trên** vùng chữ học (bài đọc, câu hỏi, ô gõ). Thẻ "thở"/nghiêng chỉ áp dụng cho thẻ từ vựng V1/V2/V3 lúc **chưa** trả lời và thẻ ở Hub/Hôm nay/Recap |
| J4 | Chỉ animate `transform`, `opacity`, `filter` (chỉ `brightness`/`drop-shadow` trong ≤ 300 ms). Cấm animate `width/height/top/left/box-shadow` trong vòng lặp |
| J5 | Hạt: tối đa **40 hạt/lần** cho phản hồi câu, **120 hạt** cho mốc lớn; một canvas toàn màn dùng chung (`src/design/fx/`), `pointer-events:none`, 60 fps, tự dừng rAF khi không còn hạt |
| J6 | Confetti lớn chỉ ở mốc: xong mục tiêu ngày, lên band, streak 7/30/100, item lên Mastered. **Không** theo từng câu |
| J7 | SFX: không quá **2 tiếng chồng nhau**; chặn mọi SFX khi audio học đang phát hoặc đang ghi âm; âm lượng theo Cài đặt; mặc định 60% |
| J8 | `prefers-reduced-motion: reduce` **hoặc** Cài đặt "Giảm chuyển động": tắt thở, nghiêng, rung, hạt, số bay, chuyển cảnh trượt (thay bằng fade 100 ms). Giữ âm thanh và đổi màu. Kiểm bằng `e2e/motion.spec.ts` |
| J9 | Không có màn chơi nào **đứng yên hoàn toàn** quá 3 giây ở trạng thái chờ người chơi (trừ reduced-motion và exam): phải có ít nhất 1 tín hiệu sống nhẹ ngoài vùng chữ (con trỏ nhấp nháy ô gõ, thẻ thở, timer, sóng âm) |
| J10 | Nhân vật **không bao giờ** xuất hiện trong vùng chữ học, trong lúc đang trả lời câu hỏi, khi audio học đang phát/ghi âm, hay ở Exam. Trong game chỉ được xuất hiện ở **Recap** và màn giữa chặng (interstitial ≤ 1,5 s). Không che chữ/nút (hộp nhân vật không giao hộp chữ). Lời thoại ≤ 12 từ, cụ thể, không khen rỗng, không chê bai (giọng văn `docs/08` §7) |

## K. Luật asset
| # | Luật |
|---|---|
| K1 | **TẢI THOẢI MÁI** (Bang 23/11/2026, dự án phi lợi nhuận – `DECISIONS.md` mục D): mọi asset, animation (Lottie, Rive, GIF), UI element, SFX, nhạc, font **miễn phí** đều dùng được – CC0, CC-BY, CC-BY-NC, MIT, OFL, Apache, Lottie Simple License, Pixabay/Pexels license, "free for personal/non-commercial", nguồn cần tài khoản **miễn phí**; được sửa, ghép, đổi màu. Nguồn tìm ở đâu cũng được (web, GitHub, itch.io, OpenGameArt…), danh mục khởi điểm ở `08-NGUON-ASSET.md`. **Tải nhiều, chọn cái ĐẸP NHẤT**. Tự vẽ/tự sinh chỉ khi tìm ≥ 15 phút không ra, ghi `self_made_reason` |
| K2 | Mỗi file asset trong `public/assets/**` có **1 dòng** trong `public/assets/CREDITS.md` và 1 mục trong `scripts/assets/assets.manifest.json`: `file, url_trang, url_tai, tac_gia, giay_phep, ngay_tai, sha256, chinh_sua`. `url_tai` phải là nơi **thực sự** tải về (không ghi nguồn gốc khác với nơi tải) |
| K3 | Chỉ cấm: (1) bản lậu/crack của gói **trả phí**; (2) asset **rip** từ game/app thương mại (Balatro, Duolingo, Stardew… chỉ học phong cách và kỹ thuật); (3) nguồn bắt buộc trả tiền hoặc nhập thẻ; (4) ảnh có watermark; (5) font không có subset `vietnamese` cho chữ tiếng Việt. Không nhập email/thông tin cá nhân của Bang vào trang tải khi chưa hỏi; gói cần tài khoản → ghi `HANDOFF.md` để Bang tự tải |
| K4 | Tải thô vào `scripts/assets/_downloads/<nhóm>/` (đã gitignore). Không chạy file thực thi tải về. Chỉ file đã duyệt mới copy vào `public/assets/<nhóm>/` |
| K5 | Mỗi nhóm (icon, SFX, texture hạt, minh hoạ) lấy từ **tối đa 2 bộ** để đồng bộ phong cách |
| K6 | Ngân sách (chất lượng trước, nhưng không làm chậm app): SFX sprite ≤ **400 KB**; mỗi ảnh ≤ **200 KB**; mỗi Lottie/dotLottie ≤ **150 KB**, mỗi GIF ≤ **400 KB** (ưu tiên WebP/AVIF động hoặc Lottie thay GIF); nhạc nền mỗi bài ≤ **1,5 MB**; tổng `public/assets` ≤ **10 MB** (không tính `soul_knight` legacy), trong đó precache ≤ 1,5 MB, phần còn lại **tải lười** theo màn; font hiển thị chỉ subset `latin`+`vietnamese`, `woff2` |
| K7 | Asset không còn được tham chiếu trong `src/**` (không tính legacy) thì chuyển sang `public/legacy-assets/` hoặc xoá **sau khi** Bang đồng ý. Không để asset chết trong precache PWA |
| K8 | **Đo chất lượng, không chỉ đếm nguồn** (bài học date-planner: "≥ 85% tải về" bị lách bằng cách cắt ô 16 px phóng to). Icon màu raster: gốc ≥ **64 px**, hiển thị ≤ gốc (không phóng to ảnh raster), ≥ 4 màu, có khối/bóng; SVG minh họa ≤ 30 KB sau SVGO. Mỗi file ghi thêm `kich_thuoc_goc` và `so_mau` trong manifest |
| K9 | Bộ icon màu mặc định: **Microsoft Fluent Emoji** (MIT, https://github.com/microsoft/fluentui-emoji), kiểu **3D** (PNG 256 px, chuyển WebP ≤ 20 KB/ảnh) hoặc **Flat** (SVG) – chọn **một** kiểu cho toàn app. Dự phòng: OpenMoji (CC BY-SA 4.0, ghi công). game-icons.net (CC BY 3.0) chỉ dùng khi Fluent không có hình phù hợp và phải tô ≥ 2 màu theo token |
| K10 | **Nhân vật dẫn đường**: TẢI từ gói miễn phí (ứng viên xếp hạng ở `08-NGUON-ASSET.md` §1, thiết kế ở `03` §5b), **cấm tự vẽ**, cấm AI sinh, cấm nhân vật thương mại (Duo của Duolingo, nhân vật Balatro…), cấm cú/chim màu xanh lá (tránh giống Duolingo). Cần ≥ **6 trạng thái** (`03` §5b bảng) lấy từ cùng một gói/cùng nét vẽ; nền trong suốt; ảnh raster gốc ≥ 2× cỡ hiển thị lớn nhất; ảnh tĩnh ≤ 60 KB/trạng thái (WebP), ảnh động (WebP/AVIF động, Lottie, Rive) ≤ 300 KB/trạng thái và **tải lười**. Ghi CREDITS 8 trường + `trang_thai` |

## P. Luật production
| # | Luật |
|---|---|
| P1 | CI (`.github/workflows/`) phải chạy theo thứ tự: `npm ci` → `npx tsc --noEmit` → `npm test` → `npm run validate:data` → `npm run build` → `npm run e2e` (Chromium) → deploy. Một bước đỏ = không deploy |
| P2 | `master` không được lệch `origin/master` quá **1 ngày làm việc**. Mỗi mốc xong phải push và kiểm URL production trả 200 + `<title>` đúng V3 |
| P3 | Route `/dev/*` chỉ tồn tại khi `import.meta.env.DEV`. Bundle production không chứa `DevComponentsScreen`, `SpeechDevScreen` |
| P4 | Không `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` với dữ liệu người dùng hoặc dữ liệu dán từ Claude. Dữ liệu nhập (backup JSON, kết quả chấm) **phải** qua `zod.safeParse` trước khi ghi DB |
| P5 | Ngân sách hiệu năng (đo bằng build production, Chrome, CPU ×4, mạng "Fast 4G"): LCP Hôm nay ≤ **2.5 s**; JS khởi động (entry + vendor) ≤ **250 KB gzip**; chunk mỗi game ≤ **120 KB gzip**; INP ≤ **200 ms**; không frame > 32 ms do animation trong 30 s chơi V1 |
| P6 | Không có `console.error`, cảnh báo React key, hay unhandled rejection trong lượt E2E |
| P7 | Không commit: `dist/`, `node_modules/`, `tsconfig.tsbuildinfo`, `*.lnk`, `scripts/assets/_downloads/`, file `.env*` |
| P8 | Mọi thay đổi schema IndexedDB (Dexie) phải tăng version + có hàm migrate + test migrate từ DB phiên bản cũ có dữ liệu |

## Q. Luật quy trình (học từ đợt v5 của date-planner – xem `07-QUY-TRINH-KIEM-CHEO.md`)
| # | Luật |
|---|---|
| Q1 | **Người làm không tự chấm thẩm mỹ.** `BAO-CAO-<task>.md` chỉ ghi việc đã làm, file đã sửa, số đo trước → sau. Cấm điểm số và các chữ "đẹp", "hoàn hảo", "production-ready", "đạt chuẩn". `PROGRESS.md` chỉ được ghi "✅" khi cổng tương ứng đã được AD duyệt |
| Q2 | Từ đợt 3, mỗi task qua **2 reviewer khác model**, xem được ảnh, chấm mù (`KIEM-THU.md` §3.2), mỗi người ≥ 5 lỗi cụ thể có tọa độ. "Không có lỗi" = review không hợp lệ |
| Q3 | Ảnh nộp do công cụ chụp (`audit-ui.mjs`, Playwright `recordVideo`), đủ bộ theo `07` §7. Không chụp tay chọn góc đẹp |
| Q4 | Không ai ngoài AD được sửa `docs/audit-max/cong-cu/**`, `LUAT.md`, `KIEM-THU.md`, ngưỡng trong `scripts/qa/**`/`scripts/validate/**` (trừ task được giao viết chúng). Thấy luật sai → ghi `HANDOFF.md` |
| Q5 | Cấm làm "cho qua công cụ": `data-audit-ignore` (cấm tuyệt đối), icon 1 px, hình `opacity:0`, `aria-hidden` để giấu chữ nhỏ, hành vi khác khi `navigator.webdriver`, animation giả mắt không thấy, `test.skip` mới. Bị phát hiện = trả về + ghi tên agent vào `HANDOFF.md` |
| Q6 | Trước khi làm, builder ghi `KE-HOACH-<task>.md` (≤ 40 dòng) gồm **danh sách mọi nút/chức năng** của màn bị đụng; reviewer bấm thử từng mục. Mất chức năng = CHẶN |
| Q7 | Tối đa **3 vòng** sửa mỗi task; tranh chấp ghi `HANDOFF.md` mục "Tranh chấp", AD quyết |

## Z. Bảng mức độ và cách kiểm (cố định – công cụ đọc theo bảng này)
| Mức | Mã |
|---|---|
| **CHẶN** | A1–A6, B1, B2, B3, B4, B7, C1, C2, C4, C6, D2, D4, D5, D9, J4, J8, J10, K10, K1, K2, K3, P1, P2, P3, P4, P6, P8, Q1–Q7, lỗi JS/console |
| **NẶNG** | B5, B6, C3, C5, D1, D3, D6, D7, D8, D10, D11, M1, M2, M3, M4, M5, M7, J1, J2, J3, J5, J6, J7, J9, K4, K5, K6, K8, K9, P5, P7 |
| **NHẸ** | K7, còn lại không liệt kê |

| Cách kiểm | Mã |
|---|---|
| **T** (`audit-ui.mjs` tự đo) | D3, D4, D5, D7, D10, M1, M2, M3 (`data-mascot`), M4, M5, M7, J8 (cờ `--reduced 1`), J9, Q5 (`data-audit-ignore`), lỗi JS |
| **E** (test) | B3, B4, B6, C1, C4, D2 (axe), D8, D9, J1 (`juice.spec`), J2, J5–J8, P1–P6, P8 |
| **M** (mắt reviewer) | B1, B2, B5, B7, D1, D6, D11, J3, J4, J10, M3 (trạng thái hợp màn), K3, K5, K8, Q1–Q7 |
| **S** (CREDITS/manifest) | C2, C3, K1, K2, K4, K6, K8, K9, K10 |
| **G** (`git diff`) | A1–A6, Q4 |
