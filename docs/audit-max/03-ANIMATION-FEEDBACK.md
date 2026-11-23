# 03 · ANIMATION, ÂM THANH VÀ PHẢN HỒI ("JUICE")

> Đọc sau `00-DOC-TRUOC.md`. Luật cứng liên quan: `LUAT.md` mục **J** (juice), **K** (asset), **B7** (exam không juice).
> Định hướng giữ nguyên tinh thần `docs/08-DESIGN-SYSTEM.md` §1 **"Focus Arcade: arcade ở viền, tập trung ở giữa"**, nhưng nâng phần "arcade ở viền" từ mức *web app có animation* lên mức *game indie thật*.

## 1. Chẩn đoán hiện trạng

**Điểm hiện tại: 4/10.** Nền tảng đúng (preset `src/design/motion.ts` khớp `docs/10` §1; sprite SFX Kenney CC0 54 KB; `sfx.ts` chặn SFX khi audio học phát và ở exam), nhưng lớp "juice" mỏng và rời rạc.

| # | Hiện trạng | Bằng chứng | Mức |
|---|---|---|---|
| A1 | Đo bằng `document.getAnimations()` sau 900 ms ở 20 route × 4 độ rộng: **0 animation đang chạy** ở 17/20 màn khi người chơi chưa thao tác (V1 1–5, V3 1). Màn "chết" khi chờ | `anh-hien-trang/do-dac-tu-dong.json` cột `anims` | P2 |
| A2 | Sau khi chọn sai ở V1, 250 ms: chỉ có đổi màu viền + ✕; 0 animation đang chạy, panel giải thích nằm ngoài màn hình | `anh-hien-trang/play_v1-390-sai-250ms.png` | P1 |
| A3 | Số kênh phản hồi đo theo code: **phần lớn tương tác 1–2 kênh**; chỉ "đúng/sai" V1, "đúng" V2, "tick checklist" W2, "hạ boss" V1 đạt 3 kênh. L1 Juice 2/10, W1 2/10 (W1 không gọi `playSfx` lần nào) | `phu-luc/A…` §2.5, §3.5, §4.5, §5.5, §6.5; `phu-luc/B…` §2.3, §3.3, §4.3, §5.3 | P1 |
| A4 | `canvas-confetti` đã cài nhưng **0 lần gọi** ngoài `src/legacy/**`; không có hệ hạt dùng chung (V2 có 6 tia lửa tự làm, V1 có 8 mảnh boss) | grep `canvas-confetti` | P1 |
| A5 | Recap tĩnh: không đếm số, không stagger, không confetti; mặc định giả 80%/240 s | `src/design/components/RecapScreen.tsx:31-32, 38-171` | P1 |
| A6 | Combo không lên cao độ (không game nào truyền `rate` trừ W2); không có số "+XP" bay; không rung (`navigator.vibrate` 0 lần) | `phu-luc/A…` C6, C10 | P2 |
| A7 | Không có lớp reduced-motion toàn cục: không `MotionConfig`, không `@media (prefers-reduced-motion)` trong CSS, không công tắc trong Cài đặt; `Skeleton` `animate-pulse`, `Card` `hover:-translate-y-0.5`, Onboarding `transition-all` trên `width` không kiểm | `phu-luc/D…` P1-12 | P1 |
| A8 | `playSfx` gọi **bên trong updater của setState** (V2, V3, L1) → StrictMode phát đôi ở dev | `phu-luc/A…` C7; `phu-luc/B…` L1-17 | P2 |
| A9 | SFX `tap` chỉ dài 20 ms (gần như không nghe); Button không có SFX; âm lượng và mute không được lưu (mất khi reload; profile dùng thang 0–1, Provider thang 0–100) | `public/assets/sfx/sfx.json`; `AudioProvider.tsx:33-41`; `profileRepo.ts:43` | P2 |
| A10 | Không có chuyển cảnh mở game (`layoutId` thẻ → nền game), không có "thở"/nghiêng ở bất kỳ thẻ nào | `HubScreen.tsx`, `TodayDashboard.tsx` | P2 |

**Điểm mạnh giữ nguyên:** sao W2 stagger 120 ms `spring.bouncy` + SFX `correct` cao độ tăng theo số sao (`W2WritingSprints.tsx:157-191, 1215`) – đây là mẫu chuẩn để nhân rộng; ngoặc khoá mục tiêu V3 0,25 s; 6 tia lửa V2; HP boss vỡ 8 mảnh V1; búa R1; im lặng có chủ đích khi đang nghe/viết.

## 2. Học gì từ game tham khảo (chỉ học kỹ thuật, không lấy asset)

| Game | Kỹ thuật lấy | Áp vào đâu | Thông số |
|---|---|---|---|
| **Balatro** | Lá bài "sống": thở, nghiêng theo con trỏ, ánh specular, bóng đổ cứng tách khỏi lá; **đếm điểm kiểu chips × mult** từng nhịp, mỗi nhịp một tiếng tick cao dần; rung nhẹ khi điểm lớn | Thẻ từ V1/V2/V3, thẻ game ở Hub/Hôm nay, màn Recap | §5, §7 |
| **Duolingo** | Vòng bài ngắn 10–20 câu; thanh tiến độ dày có "đoạn sáng" chạy qua khi đúng; combo; nhân vật phản ứng; màn kết thúc có 3 ô thống kê bay vào lần lượt; streak có lửa và lịch tuần | Khung phiên mọi game, Recap, Hôm nay | §4, §7 |
| **Stardew Valley** | Âm thanh "giòn" cho từng hành động nhỏ; số bay lên khi nhận đồ; nhịp ngày kết thúc bằng bảng tổng kết đếm tiền | +XP bay, Recap cuối ngày ở Hôm nay | §3 |
| **Celeste** | **Hit-stop** 40–80 ms trước khi bật phản hồi lớn; squash & stretch; hạt bụi nhỏ ở điểm chạm; trợ năng (Assist Mode) rõ ràng | Đúng/sai, Cài đặt "Giảm chuyển động" | §3, §8 |
| **Undertale** | Chữ hộp thoại hiện từng ký tự kèm "blip" nhỏ, có thể bấm để hiện hết | Hộp giải thích sai (FeedbackPanel), lời nhận xét ở Recap | §3 mục 12 |
| **Pokémon** | Thanh HP/EXP chạy mượt, đổi màu theo ngưỡng; màn "lên cấp" có khung riêng, nhạc ngắn | Thanh band/level-up, BandMeter | §7 |

## 3. Bảng phản hồi bắt buộc (mỗi dòng ≥ 3 kênh, `LUAT.md` J1)

Ký hiệu cue SFX là tên trong `src/core/audio/sfx.ts`. "Hạt" dùng hệ `src/design/fx/` mới (§6). Thời gian tính từ lúc thao tác.

| # | Tương tác | Chuyển động (motion) | Âm thanh | Hạt / ánh sáng / số | Rung (mobile, tuỳ chọn) |
|---|---|---|---|---|---|
| 1 | Hover/focus nút, thẻ | nâng `y:-2px`, `scale 1.02`, `spring.snappy`; viền sáng `--color-skill` | không (tránh ồn) | bóng đổ tách xa thêm 4 px (transform của lớp bóng) | – |
| 2 | Chọn đáp án (tap) | ấn xuống `scale .97` 80 ms rồi trả `spring.snappy` | `tap` (rate 1.0) | gợn tròn (ripple) từ điểm chạm, 240 ms, opacity .25→0 | 8 ms |
| 3 | **Đúng** | hit-stop 60 ms → `scale 1→1.06→1` `spring.bouncy`; ✓ vẽ nét `pathLength 0→1` 220 ms | `correct`, rate tăng theo combo: 1.00 / 1.06 / 1.12 / 1.19 / 1.26 | 12–18 tia sáng bắn từ nút (màu `--color-correct` + `--color-skill`), số `+10 XP` bay lên 32 px trong 600 ms | 15 ms |
| 4 | **Sai** | rung ngang `x:[0,-8,8,-5,5,0]` 300 ms **chỉ trên thẻ câu**, viền `--color-wrong`; sau 200 ms đáp án đúng hiện viền nét đứt | `wrong` (−4 dB) | thẻ tối đi `brightness(.85)` 150 ms rồi trả; **không** hạt (không thưởng cái sai) | 30-40-30 ms |
| 5 | Gần đúng (dictation, chính tả) | ký tự sai gạch chân nhấp nháy 2 lần, 400 ms | `highlight` rate 0.9 | ký tự đúng loé xanh nhạt lần lượt 30 ms/ký tự | – |
| 6 | Combo lên bậc x3 / x5 / x10 | số combo pop `scale 1.4→1` 220 ms; HUD "đấm" `scale 1.06` 120 ms | `streak` rate 1.0/1.12/1.25 | lửa quanh số combo lớn dần theo bậc (3 cỡ sprite/hạt), tia sáng 24 hạt ở x10 | 20 ms |
| 7 | Combo vỡ | số combo rơi `y:+12`, mờ 300 ms | không (tránh phạt hai lần) | khói xám 6 hạt | – |
| 8 | Câu mới vào | câu cũ trượt trái + mờ, câu mới từ phải `x:24→0` (preset `questionSlideVariants`) | `flip` rate ngẫu nhiên 0.95–1.05 | thanh tiến độ phiên có "vệt sáng" chạy qua 400 ms | – |
| 9 | Lật thẻ V1 (xem nghĩa) | lật 3D `rotateY 0→180` 320 ms, `perspective 900px`, nảy cuối `spring.soft` | `flip` | specular quét chéo khi qua 90° | – |
| 10 | Highlight bằng chứng (R1) | nền vàng 30% quét trái→phải 400 ms | `highlight` | 4 lấp lánh nhỏ ở đầu/cuối span | – |
| 11 | Tìm thấy bẫy (L1) / paraphrase (V3) | vùng đỏ/vàng trên waveform/văn bản "mở" từ giữa 350 ms | `correct` + `highlight` lệch 80 ms | 10 hạt từ vị trí tìm thấy | 15 ms |
| 12 | Mở giải thích sai (FeedbackPanel) | panel trượt lên `spring.soft`; câu giải thích hiện **từng chữ** 18 ms/ký tự (bấm/Space để hiện hết) | `reveal` + "blip" rất nhỏ mỗi 3 ký tự (âm lượng 15%) | quote bằng chứng highlight dần trái→phải | – |
| 13 | Timer còn 10% | chữ đỏ, `scale 1↔1.04` mỗi giây | `tick` 40% mỗi giây (10 giây cuối) | viền khung game chuyển đỏ mờ (vignette đỏ 0→12%) | – |
| 14 | Hết giờ | khung game rung 1 lần 200 ms | `countdownEnd` | flash trắng 8% 120 ms | 60 ms |
| 15 | +XP gộp | các số `+10` gần nhau trong 1 s gộp thành 1 số lớn hơn, bay tới ô XP trên HUD theo đường cong 500 ms | `tap` rate 1.4 nhỏ khi số chạm ô | ô XP loé sáng | – |
| 16 | Xong phiên → Recap | tiêu đề rơi xuống `spring.bouncy`; 3 ô thống kê vào lần lượt 60 ms; **đếm kiểu Balatro**: "Đúng 18" × "Combo ×1.5" = "27 XP", mỗi nhịp đếm 1 tick | `tick` rate tăng 1.0→1.6 theo nhịp đếm, kết thúc `sessionDone` | confetti nhẹ 60 hạt **chỉ khi** độ chính xác ≥ 80% | 20 ms |
| 17 | Xong mục tiêu ngày | vòng ProgressRing chạy tới 100% → loé → ✓ | `sessionDone` (jingle ngắn) | confetti 120 hạt 2 màu kỹ năng | 50 ms |
| 18 | Streak +1 / mốc 7-30-100 | ngọn lửa nảy + số lật kiểu đồng hồ cơ | `levelUp` ở mốc, `streak` ngày thường | mốc: confetti 120 hạt + toast; ngày thường: 16 tàn lửa | 40 ms |
| 19 | Lên band / level mới | khung "LÊN BAND 6.5 → 7.0" phóng `scale .6→1` `spring.bouncy`, BandMeter chạy mượt 800 ms | `levelUp` | tia sáng xoay sau khung (conic-gradient xoay 8 s/vòng), confetti 120 | 60 ms |
| 20 | Item lên Mastered | thẻ nhỏ bay vào "bộ sưu tập" ở góc | `levelUp` rate 1.2 | viền thẻ ánh kim (gradient chạy 1.2 s) | – |
| 21 | Mở game từ Hub/Hôm nay | thẻ game phóng to bằng `layoutId` thành nền game 350 ms | `flip` rate 0.8 | màu kỹ năng tràn từ thẻ ra (opacity .0→.08 nền) | – |
| 22 | Ghi âm (S1/S2, khi có) | vòng ngoài scale theo RMS thật (rAF, không re-render React) | `recordStart`/`recordStop` | hào quang màu `--color-speaking` theo âm lượng | 10 ms |

**Exam mode:** chỉ dòng 13 (đổi màu, không scale, không tick) và 14 (chỉ `countdownEnd`). Tất cả dòng khác tắt (`LUAT.md` B7).

## 4. Khung phiên chơi (HUD) — làm lại cho mobile

Hiện trạng ở 390×844: HUD (tiến độ + bản đồ node + XP) chiếm ~45% chiều cao màn trước khi tới câu hỏi (ảnh `anh-hien-trang/play_v1-390.png`). Chuẩn mới:

| Thành phần | Mobile < 768 px | Desktop ≥ 1024 px |
|---|---|---|
| Thanh trên (đã có, 56 px) | nút thoát · tên game · **thanh tiến độ dày 8 px** · ô combo · ô XP · loa | như mobile, thêm tên chặng |
| Bản đồ node (RunMap V1) | **ẩn khỏi màn câu hỏi**, chỉ hiện ở màn giữa chặng (interstitial 1.2 s) và Recap | cột phải 280 px, thu nhỏ |
| Chú giải màu loại câu | bỏ khỏi màn chơi, chuyển vào tooltip "?" | tooltip |
| Nhãn "Level 1 · Training" | bỏ; thay bằng chip band "≈ 6.5" | như mobile |
| Thẻ câu hỏi | bắt đầu ở y ≤ 72 px, chiếm 60–75% chiều cao | căn giữa, rộng tối đa 720 px |
| Nút hành động chính | dính đáy (sticky bottom), cao 56 px, vùng ngón cái | trong thẻ, có `KeyHint` |

Tiêu chí ĐẠT: ở 390×844, `getBoundingClientRect().top` của câu hỏi ≤ 80 px và đáp án thứ 2 có `bottom` ≤ 844 (`KIEM-THU.md` §2 mục 9).

## 5. Hệ thẻ "sống" kiểu Balatro (chỉ cho thẻ, không cho vùng chữ dài)

Áp dụng: `VocabCard` (V1/V2/V3 lúc chưa trả lời), `GameCard` (Hub), `PlanCard` (Hôm nay), thẻ thưởng ở Recap. Component mới `src/design/components/LiveCard.tsx`.

| Lớp | Thông số |
|---|---|
| Thở | `y: 0 → -2px → 0`, `rotate: -0.4° → 0.4°`, chu kỳ 3.2 s, lệch pha ngẫu nhiên 0–1.6 s giữa các thẻ |
| Nghiêng theo con trỏ | `rotateX/rotateY` tối đa **6°**, `perspective: 900px`, lerp 0.15/frame, về 0 khi rời chuột trong `spring.soft`. Mobile: dùng `deviceorientation` nếu được cấp quyền, không thì tắt |
| Specular | lớp `radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,.16), transparent 45%)`, `mix-blend-mode: soft-light`, theo con trỏ |
| Bóng đổ | **lớp riêng** dưới thẻ (div), màu `rgba(0,0,0,.45)`, lệch `y: 8px` khi nằm, `14px` khi hover (animate `transform` của lớp bóng, không animate `box-shadow`); bóng lệch **ngược** hướng nghiêng 2–4 px |
| Viền theo kỹ năng | viền trái 3 px `--color-skill` (đã có) + viền ngoài 1 px `color-mix(--color-skill 35%)` |
| "Edition" cho thẻ hiếm | thẻ ở trạng thái *Mastered* có lớp ánh kim: `linear-gradient(115deg, transparent 30%, rgba(255,255,255,.22) 50%, transparent 70%)` chạy ngang 1.2 s mỗi 6 s |
| Tắt khi | reduced-motion, exam, đang gõ trong ô của thẻ, đã trả lời (thẻ đứng yên để đọc giải thích) |

## 5b. Nhân vật dẫn đường "Lexi" (Bang duyệt 23/11/2026 – `DECISIONS.md` mục D)

**Vai trò:** bạn đồng hành / huấn luyện viên, **không phải giám khảo**. Lexi nói việc cần làm, khen cụ thể, động viên khi sai nhiều; không bao giờ chê, không bao giờ chen vào lúc đang học. Tên mặc định "Lexi", Bang đổi được trong Cài đặt.
**Nguồn hình:** TẢI, không tự vẽ, không AI sinh (`LUAT.md` K10). Ứng viên xếp hạng ở `08-NGUON-ASSET.md` §1. Không dùng cú/chim xanh lá (tránh giống Duolingo). Ưu tiên gói có **animation sẵn** (Rive/Lottie/sprite) hơn ảnh tĩnh.

### Trạng thái (cần ≥ 6, khuyến nghị 8 – cùng một gói, cùng nét vẽ)
| `data-mascot` | Khi nào | Chuyển động | Âm |
|---|---|---|---|
| `idle` | mặc định ở màn khung | thở `scale 1↔1.02` 3 s; chớp mắt mỗi 4–6 s (nếu gói có khung chớp) | – |
| `chao` | mở app lần đầu trong ngày, onboarding bước 1 | vẫy tay / nảy `y:-8px` 2 lần, `spring.bouncy` | `blip` nhỏ |
| `co-vu` | Hôm nay khi chưa bắt đầu việc nào | nghiêng người về phía nút chính 4° | – |
| `vui` | Recap độ chính xác ≥ 70%, đạt kỷ lục nhỏ | nảy 1 lần + 6 tia sáng | `correct` rate 1.1 |
| `an-mung` | xong mục tiêu ngày, lên band/level, streak 7/30/100, item Mastered đầu tiên | nhảy `y:-16px` 2 lần, xoay 360° nếu gói có; confetti 120 hạt (dòng 17–19 bảng §3) | `levelUp` |
| `dong-vien` | Recap < 50%, streak gãy, 3 câu sai liền (hiện ở interstitial, không giữa câu) | gật đầu chậm, không rung | – |
| `suy-nghi` | đang tải dữ liệu, chờ dán kết quả chấm Claude | đong đưa nhẹ ±3° | – |
| `ngu` | empty state, hoặc mở app sau 21:00 khi hôm nay chưa học | thở chậm 4 s, "z" bay lên | – |

### Vị trí theo màn (390×844 / 1280×800)
| Màn | Vị trí | Cỡ (390 / 1280) | Bong bóng thoại (ví dụ, ≤ 12 từ, dùng số thật) |
|---|---|---|---|
| Hôm nay | góc phải thẻ "Việc tiếp theo", đứng trên mép thẻ | 96 / 140 px | "Còn 42 thẻ đến hạn, khoảng 9 phút thôi!" |
| Hub | đầu trang, cạnh tiêu đề | 72 / 110 px | "Listening đang xa mục tiêu nhất – thử Trap Detector?" |
| Thống kê | cạnh khối streak | 80 / 120 px | "12 ngày liền rồi, còn 2 ngày tới mốc 14!" |
| Recap (mọi game) | trên khung điểm, khung có `data-mascot-ok` | 120 / 160 px | "Bắt được 7/8 bẫy self-correction, hơn tuần trước 3 câu." |
| Interstitial giữa chặng V1 | giữa màn, 1,2 s | 120 / 160 px | "Nửa đường rồi – combo dài nhất 9!" |
| Onboarding | mỗi bước, bên trái nội dung | 120 / 180 px | "Chào bạn! Mỗi ngày 30 phút là đủ bắt đầu." |
| Empty state | thay/ cạnh minh họa | 120 / 160 px | "Chưa có bài viết nào – viết bài đầu tiên nhé?" |
| **Không xuất hiện** | màn chơi khi đang làm câu, vùng chữ học, Exam, lúc audio học phát/ghi âm, Cài đặt | – | – (`LUAT.md` J10) |

### Tương tác và luật
- Bấm vào Lexi: đổi sang biểu cảm ngẫu nhiên phù hợp + 1 mẹo học ngắn + `blip` + 4 tia sáng (≥ 3 kênh); tối đa 1 lần / 2 s; không bao giờ chặn thao tác.
- Lời thoại hiện kiểu Undertale (dòng 12 bảng §3), bấm để hiện hết; lời thoại lấy từ **một file dữ liệu** (vd `src/content/mascotLines.ts`) theo sự kiện, có biến số thật; cấm lời khen rỗng (`docs/08` §7).
- Đổi trạng thái: crossfade 120 ms + squash `scaleY .92→1` `spring.bouncy`.
- Reduced-motion: ảnh tĩnh đúng trạng thái, không nảy/xoay/hạt; lời thoại hiện ngay.
- Cài đặt: công tắc "Hiện nhân vật" (mặc định bật), ô đổi tên.
- Định dạng mặc định (mèo Fluent, `08` §1): trạng thái tĩnh = WebP 3D ≤ 60 KB + chuyển động bằng `motion`; trạng thái động (`chao`, `vui`, `an-mung`) = WebP động chuyển từ APNG Fluent Animated ≤ 300 KB, **tải lười**, không cần thư viện. Chỉ khi đổi sang phương án Noto Lottie/Rive mới thêm `@lottiefiles/dotlottie-react` hoặc `@rive-app/react-canvas`. Component `src/design/components/Mascot.tsx` (`<Mascot state="vui" say="…" />`), luôn gắn `data-mascot={state}`.
- Kiểm: `audit-ui.mjs` mã **M3** (có nhân vật 72–160/220 px ở màn khung), **J10** (không có trong màn chơi ngoài khung `data-mascot-ok`, không đè chữ/nút).

## 6. Hệ hạt và ánh sáng (`src/design/fx/`)

- `fxCanvas.ts`: **một** `<canvas>` cố định toàn màn, `pointer-events:none`, `z-index` trên nội dung dưới modal. `devicePixelRatio` tối đa 2. rAF chỉ chạy khi còn hạt (`LUAT.md` J5).
- `emit(kind, {x, y, count, colors})` với `kind ∈ spark | star | ember | smoke | confetti`. Texture hạt tải từ **Kenney Particle Pack** (CC0, xem bảng asset §9).
- `numberPop(text, {x, y, to?})`: số bay (DOM + motion, không canvas, để chữ sắc).
- `screenPunch(target, strength)`: rung/đấm bằng transform trên phần tử đích, không rung cả `body`.
- `canvas-confetti` (đã có) chỉ dùng cho dòng 16–19 bảng §3.
- Ngân sách: emit 40 hạt dưới 0.5 ms CPU; khung hình ≤ 16.7 ms ở CPU ×4 khi 120 hạt.

## 7. Âm thanh

| Việc | Thông số |
|---|---|
| Sprite hiện tại | `public/assets/sfx/sfx.{webm,mp3,json}` (Kenney CC0) – **giữ**, chỉ bổ sung |
| Bổ sung | `blip` (chữ hiện dần, ≤ 30 ms – tạo bằng `zzfx`), `whoosh` (chuyển cảnh, ≤ 200 ms), `coin` (+XP chạm ô, ≤ 120 ms – RPG Audio/Casino Audio), `card` (lật/đặt thẻ – Casino Audio, kiểu Balatro), `jingle_goal` (≤ 1.6 s), `jingle_levelup` (≤ 2 s) – nguồn §9 và `08` §1 |
| Cao độ động | `rate` theo combo (bảng §3 dòng 3, 6) và theo nhịp đếm Recap (1.0 → 1.6) |
| Biến thiên | mỗi lần phát `tap`/`flip` lệch rate ngẫu nhiên ±5% để không "máy móc" |
| Trộn | tối đa 2 tiếng chồng (`LUAT.md` J7); giới hạn bằng hàng đợi trong `sfx.ts` |
| Chặn | khi `trackPlayer` phát hoặc `recorder` ghi: không phát SFX (đã có cờ `blockedBySpeechOrTrack`, cần nối ở mọi game) |
| Nhạc nền | mặc định tắt; nếu bật: chỉ Hôm nay/Hub/V1, duck 20% khi có audio học (`docs/10` §3) |

## 8. Giảm chuyển động và trợ năng

- Hook mới `useMotionPref()` = `useReducedMotion()` **OR** Cài đặt "Giảm chuyển động". Mọi component fx đọc hook này, không gọi `useReducedMotion` rải rác.
- Khi bật: thở/nghiêng/hạt/số bay/rung/hit-stop **tắt**; trượt → fade 100 ms; âm thanh và đổi màu **giữ**.
- Cài đặt thêm 3 công tắc kiểu Celeste Assist: "Giảm chuyển động", "Tắt hạt", "Tắt rung".

## 9. Asset cần TẢI cho mảng này (ghi nguồn từng file theo `LUAT.md` K2)

> Bảng dưới là phần tối thiểu. **Bộ chọn mặc định đầy đủ + nơi tìm thêm: `08-NGUON-ASSET.md`** (nhân vật mèo Fluent, Lottie, nền fffuel, SFX Casino/RPG Audio, zzfx, nhạc HoliznaCC0…). Tải thoải mái, chọn cái đẹp nhất (`LUAT.md` K1).

| Nhóm | Nguồn (trang) | Giấy phép | File cần | Đích |
|---|---|---|---|---|
| Texture hạt | Kenney Particle Pack – https://kenney.nl/assets/particle-pack | CC0 | `spark_0*.png`, `star_0*.png`, `circle_0*.png`, `smoke_0*.png` (chọn 8 file, resize ≤ 64 px, PNG tối ưu) | `public/assets/fx/` |
| SFX UI bổ sung | Kenney UI Audio – https://kenney.nl/assets/ui-audio | CC0 | `click*`, `switch*` cho `blip`, `whoosh` | ghép vào sprite |
| SFX thưởng | Kenney Digital Audio – https://kenney.nl/assets/digital-audio | CC0 | `powerUp*`, `pepSound*` cho `coin` | ghép vào sprite |
| Jingle | Kenney Music Jingles – https://kenney.nl/assets/music-jingles | CC0 | 2 jingle ngắn (8-bit hoặc "pizzicato") | ghép vào sprite (≤ 400 KB tổng) |
| **Icon nội dung màu** (12 thẻ game, nhiệm vụ Hôm nay, 12 huy hiệu, Recap, empty state, Bùa) – `LUAT.md` D11, K9 | Microsoft Fluent Emoji – https://github.com/microsoft/fluentui-emoji | MIT (ghi bản quyền Microsoft trong CREDITS) | chọn **một** kiểu cho toàn app: **3D** (PNG 256 px → WebP ≤ 20 KB) hoặc Flat (SVG); ~45 hình: V1 🏃 runner, V2 ⚒️ hammer-and-anvil/🔥, V3 📡 satellite-antenna, L1 🎧 headphone, L2 ✍️ writing-hand, R1 ⚖️ balance-scale, R2 📰 newspaper, W1 📜 scroll, W2 ⏱️ stopwatch, S1 🎤 microphone, S2 ⚡ high-voltage, X1 ⏳ hourglass; huy hiệu 🏅🔥🎯📚… | `public/assets/icons/fluent/` |
| Icon game dự phòng | game-icons.net – https://game-icons.net | CC BY 3.0 (ghi tác giả từng icon) | chỉ khi Fluent không có hình hợp; tô ≥ 2 màu theo token (`public/assets/icons/games/` hiện có 12 SVG đơn sắc → thay bằng Fluent) | `public/assets/icons/games/` |
| Font hiển thị (số điểm, tiêu đề game, Recap) | Fontsource – https://fontsource.org/fonts/baloo-2 | OFL 1.1 | `@fontsource/baloo-2` 700/800, subset `latin`+`vietnamese` | npm |

Font hiển thị: chạy kiểm glyph tiếng Việt trước khi chọn (chuỗi kiểm: `ẠẢÃÀÁÂẦẤẬẨẪĂẰẮẶẲẴĐÊỀẾỆỂỄÔỒỐỘỔỖƠỜỚỢỞỠƯỪỨỰỬỮỲÝỴỶỸ` và chữ thường tương ứng). Thứ tự ứng viên: **Baloo 2 → Lexend → Be Vietnam Pro 800** (đang có, phương án cuối). Font nội dung học **không đổi** (Be Vietnam Pro, Source Serif 4, JetBrains Mono).

## 10. Tiêu chí ĐẠT của mảng
1. 22/22 dòng bảng §3 có đủ ≥ 3 kênh ở mọi game đang có (kiểm bằng `e2e/juice.spec.ts`, `KIEM-THU.md` §2 mục 11).
2. `e2e/motion.spec.ts` (reduced-motion): 0 phần tử có `transform` khác `none` sau 200 ms ở V1, R1; 0 hạt được vẽ.
3. Hiệu năng: 30 s chơi V1 ở CPU ×4 không có frame > 32 ms do animation.
4. Rubric `KIEM-THU.md` §3 mục "Juice" ≥ 9, "Chiều sâu & ánh sáng" ≥ 8.
