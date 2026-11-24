# 13 · ANIMATION VÀ JUICE (ưu tiên số 5: làm sau cùng, cắt đầu tiên khi thiếu thời gian/hiệu năng)

> Nguồn chi tiết: `docs/audit-max/03-ANIMATION-FEEDBACK.md` (bảng 22 tương tác × ≥ 3 kênh, HUD, LiveCard, Lexi, hạt, âm, reduced-motion). Luật: `LUAT.md` J1–J10, `04-LUAT-CUNG.md` SR-44..50.
> **Nguyên tắc của Bang (25/11/2026):** giảm bớt hiệu ứng theo **mức ưu tiên** nếu có nguy cơ lag. Không để lỗi hình ảnh: chữ lật ngược khi mở lá bài, phần tử "lớn lên" giật hay vượt khung, ảnh bị cắt lung tung.
> Animation **phục vụ** việc học: báo đúng/sai rõ hơn, thưởng nỗ lực, dẫn mắt. Không có hiệu ứng nào được che chữ học, làm chậm nhịp học, hay thưởng câu sai.

> **Cập nhật 25/11 sau nghiên cứu** (plan UX-06..UX-10):
> - Juice dừng ở mức **High, không Extreme**. Nghiên cứu Kao 2020 (N = 3 018): cả không có hiệu ứng lẫn hiệu ứng cực mạnh đều làm hiệu suất và động lực kém hơn mức vừa/cao.
> - Thông số khởi điểm:
>   - nhấn: `scale .96` / 80 ms, nhả bằng spring ≤ 1.03;
>   - đúng: pop 1 → 1.08 → 1 trong 220 ms + 8–12 hạt / 500 ms + SFX;
>   - boss/lên bậc: rung ≤ 8 px, ≤ 300 ms, hit-stop 50 ms;
>   - không animation nào chặn thao tác > 400 ms;
>   - đếm điểm kiểu Balatro có nhãn lý do và nút tua.
> - SFX: pitch tăng 1 bán cung mỗi combo (tối đa +12 rồi về lại), jitter ±4%.
> - Haptic trên iOS chỉ là phần thêm, có công tắc tắt (Safari không có `vibrate`).
> - Lật thẻ trên Safari: **không** đặt `overflow`, `opacity`, `filter` trên phần tử `preserve-3d` (WebKit bug 71624).
> - Các con số trên là kinh nghiệm từ blog, không phải nghiên cứu. Chỉnh lại trên iPhone thật.

## 0. Tóm tắt 10 dòng
1. Mỗi hiệu ứng có **bậc ưu tiên** E0–E3 (§1). Thiếu thời gian hoặc máy yếu thì cắt từ E3 xuống, **không bao giờ cắt E0**.
2. **Thang hạ cấp tự động** (`useFxTier`) theo FPS đo thật + thiết bị + cài đặt (§3).
3. Chỉ animate `transform`/`opacity` (+`filter` ngắn). Không đổi layout trong animation.
4. Thẻ lật 3D: **2 mặt riêng**, `backface-visibility:hidden`, mặt sau xoay sẵn 180°. Không bao giờ thấy chữ ngược (§5.1).
5. Phóng to: `scale` ≤ 1,06 cho phần tử có chữ (trừ khung "LÊN BAND" có spring tắt dần, ≤ 1,15). Không phóng phần tử làm nó tràn khung hoặc đẩy bố cục (§5.2).
6. Ảnh trong animation giữ tỉ lệ + `object-fit` đúng (`11-ASSET.md` §6).
7. Không chuyển động sau/trên vùng chữ học; im lặng khi nghe/viết; Exam không có juice.
8. Phản hồi đầu ≤ 100 ms; đúng → câu kế ≤ 1,2 s; sai → chờ người học bấm Tiếp.
9. Reduced-motion + 3 công tắc Cài đặt ("Giảm chuyển động", "Tắt hạt", "Tắt rung").
10. Đo: 30 s V1 ở CPU ×4 trên khung iPhone, 0 frame > 32 ms; `juice.spec` 22/22 dòng ≥ 3 kênh ở bậc E-đầy-đủ.

## 1. Bậc ưu tiên hiệu ứng

| Bậc | Gồm | Vì sao | Khi nào được cắt |
|---|---|---|---|
| **E0 · Phản hồi học (bắt buộc)** | đổi màu + icon ✓/✕ đúng/sai; rung ngang thẻ khi sai (300 ms); hiện đáp án đúng; SFX `correct`/`wrong`; focus/pressed của nút; tiến độ phiên | Không có thì người học không biết kết quả | **Không bao giờ**. Reduced-motion: thay rung bằng đổi màu viền |
| **E1 · Nhịp và chuyển cảnh** | câu mới trượt vào; panel giải thích trượt lên; số `+XP` bay; combo pop; Recap đếm số; vòng mục tiêu chạy | Tạo nhịp, cho thấy tiến bộ | Máy yếu: thay trượt bằng fade 100 ms, đếm số nhanh (≤ 600 ms) |
| **E2 · Trang trí sống** | thẻ thở/nghiêng (LiveCard), specular, bóng tách; Lexi chuyển động; lửa streak; hạt tia sáng ≤ 40 | Cảm giác "game", không mang thông tin | Bậc "Vừa": tắt nghiêng + specular; hạt ≤ 16 |
| **E3 · Lễ hội** | confetti 60–120 hạt; tia sáng xoay sau khung; ánh kim Mastered; Lottie mốc lớn; nhạc nền | Chỉ ở mốc lớn | Bậc "Thấp": tắt hết, giữ 1 ảnh tĩnh/Lexi `an-mung` tĩnh |

**Khi lên kế hoạch thời gian:** làm E0 cho mọi game trước, rồi E1, rồi E2, rồi E3. Không làm E3 cho game nào khi còn game chưa có đủ E0–E1.

## 2. Token chuyển động (T3-A khai báo trong `src/design/motion.ts`)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `dur.instant` | 80 ms | pressed, ripple bắt đầu |
| `dur.fast` | 160 ms | hover, đổi màu, fade reduced-motion (100 ms) |
| `dur.base` | 240 ms | trượt câu, panel |
| `dur.slow` | 400 ms | highlight bằng chứng, vòng mục tiêu |
| `dur.celebrate` | 800–1 200 ms | Recap, lên band |
| `spring.snappy` | stiffness 500, damping 32 | nút, chọn đáp án |
| `spring.soft` | stiffness 220, damping 26 | panel, thẻ trở về |
| `spring.bouncy` | stiffness 380, damping 14 (vượt tối đa ~6%) | đúng, combo, Lexi nảy |
| `ease.out` | `cubic-bezier(.2,.8,.2,1)` | vào màn |
| `ease.in` | `cubic-bezier(.4,0,1,1)` | rời màn |

Không dùng số rời trong component.

## 3. Thang hạ cấp tự động (`useFxTier()`, T3-A viết trong `src/design/fx/`)

| Bậc FX | Điều kiện vào | Bật |
|---|---|---|
| **Đầy đủ** | mặc định trên laptop/iPad đời mới | E0–E3 |
| **Vừa** | thiết bị `hardwareConcurrency ≤ 4` **hoặc** `deviceMemory ≤ 4` **hoặc** đang dùng pin yếu (nếu API có) **hoặc** đo FPS trung bình < 50 trong 3 s gần nhất | E0, E1, E2 rút gọn (không nghiêng/specular, hạt ≤ 16, `devicePixelRatio` canvas ≤ 1.5), E3 rút gọn (confetti ≤ 40) |
| **Thấp** | FPS < 40 trong 3 s **hoặc** có ≥ 3 frame > 50 ms trong 5 s **hoặc** Cài đặt "Tắt hạt" | E0, E1 dạng fade; không canvas hạt; Lexi tĩnh |
| **Giảm chuyển động** | `prefers-reduced-motion` **hoặc** Cài đặt "Giảm chuyển động" | E0 (không rung, chỉ màu/icon), E1 = fade 100 ms; âm thanh giữ |
| **Exam** | `mode === 'exam'` | chỉ đổi màu timer + `timeup` (B7) |

- Đo FPS bằng 1 vòng rAF nhẹ chỉ chạy khi đang có animation (không chạy nền mãi). Hạ bậc ngay; nâng bậc lại chỉ sau 30 s ổn định (tránh nhảy qua lại).
- iPhone ở chế độ Nguồn điện thấp sẽ giới hạn 30 fps → tự vào bậc "Vừa"/"Thấp" nhờ đo FPS; không cần nhận diện riêng.
- Mọi component fx đọc **một** hook (`useFxTier`), không tự kiểm `useReducedMotion` rải rác.

## 4. Bảng 22 tương tác (rút gọn theo bậc; bản đầy đủ `03` §3)

| # | Tương tác | Bậc | Ghi chú hiệu năng |
|---|---|---|---|
| 2 | chọn đáp án | E0 | `scale .97` 80 ms; ripple là E1 |
| 3 | đúng | E0 (màu, ✓, SFX) + E1 (`+XP`, scale 1.06) + E2 (12–18 tia) | hit-stop 60 ms chỉ ở bậc Đầy đủ |
| 4 | sai | E0 (lắc thẻ câu ±6 px × 3 trong 300 ms, viền đỏ, icon ✗, đáp án đúng nét đứt) | **không hạt, không rung màn hình** (plan UX-06, Kao 2020) |
| 8 | câu mới vào | E1 | trượt 24 px, không trượt cả màn |
| 9 | lật thẻ V1 | E1 | **theo §5.1** |
| 12 | mở giải thích | E1 | chữ hiện dần 18 ms/ký tự, bấm để hiện hết; reduced-motion hiện ngay |
| 16 | Recap | E1 (đếm) + E3 (confetti khi ≥ 80%) | đếm ≤ 1,5 s, Enter để bỏ qua |
| 17–19 | mục tiêu ngày, streak mốc, lên band | E3 | 1 lần/sự kiện; không lặp khi mở lại màn |
| 21 | mở game | E1 | `layoutId` 350 ms; máy yếu: fade |

## 5. Lỗi hình ảnh bị cấm (đã gặp hoặc rất hay gặp)

### 5.1 Chữ bị ngược khi lật thẻ / mở lá bài đặc biệt
**Nguyên nhân:** xoay `rotateY(180deg)` cả phần tử chứa chữ; hoặc mặt trước và mặt sau dùng chung một phần tử; hoặc thiếu `backface-visibility`, nên trình duyệt vẽ mặt trước bị lật gương.
**Cách đúng:**
```tsx
<div class="card" style={{ perspective: 900 }}>
  <motion.div class="card-inner" style={{ transformStyle: 'preserve-3d' }} animate={{ rotateY: flipped ? 180 : 0 }}>
    <div class="face front" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>…</div>
    <div class="face back"  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>…</div>
  </motion.div>
</div>
```
- Hai mặt `position:absolute; inset:0` trong `.card-inner`. Mặt sau **xoay sẵn** 180°, nên khi lật xong chữ mặt sau đọc xuôi.
- Safari iOS **bắt buộc** có cả `-webkit-backface-visibility`.
- `.card-inner` (phần tử `preserve-3d`) **không được** có `overflow`, `filter`, `opacity < 1`, `clip-path`, `mask`. Các thuộc tính đó làm phẳng 3D trên Safari (WebKit bug 71624), khiến hai mặt lộ cùng lúc hoặc chữ ngược. Bo góc và cắt ảnh đặt **trong từng mặt thẻ**, không đặt trên `.card-inner`. Đặt `perspective: 1000px` trên khung ngoài.
- Reduced-motion/bậc Thấp: **không lật**, crossfade 120 ms giữa 2 mặt.
- Test E2E: sau khi lật, `getComputedStyle` mặt sau có ma trận xoay tổng 360°/0° (chữ xuôi). Thêm ảnh chụp sau lật ở iPhone 390 (Safari WebKit nếu có trong Playwright: `--project=webkit`).

### 5.2 Phần tử "lớn lên" giật, vượt khung, đẩy bố cục
**Nguyên nhân:**
- animate `width`/`height`/`font-size`;
- `scale` lớn trên phần tử có chữ, làm chữ nhoè và tràn khung;
- `layout` animation làm các phần tử khác nhảy;
- spring vượt quá nhiều (damping thấp).

**Cách đúng:**
- Chỉ `transform: scale()`, đặt `transform-origin` hợp lý (giữa thẻ, hoặc góc neo của popup).
- Phần tử có chữ: `scale` tối đa 1,06. Riêng khung "LÊN BAND" được `.6 → 1` (vào màn), nhưng **không vượt 1,0 quá 6%** (`spring.bouncy`).
- Phóng mà không đẩy bố cục: phần tử phóng nằm trong khung có `overflow: visible` và chừa đệm, hoặc dùng lớp phủ (portal) cho hiệu ứng phóng.
- Không animate `font-size`. Muốn chữ "to lên" thì scale cả khối chữ trong ≤ 200 ms rồi trả về 1.
- `will-change: transform` chỉ bật trong lúc animate, gỡ sau đó (giữ mãi tốn bộ nhớ GPU trên iPhone).
- Kiểm: reviewer xem video 3–5 s ở iPhone 390; không có khung nào bị tràn, chữ không nhoè sau khi dừng (scale cuối = 1).

### 5.3 Ảnh bị cắt lung tung trong hiệu ứng gom ảnh / bộ sưu tập
- Theo `11-ASSET.md` §6: khung tỉ lệ cố định, `contain` cho ảnh quan trọng, `cover` + `diem_nhan` cho ảnh nền.
- Khi animate ảnh bay vào lưới (`layoutId`), ảnh đầu và ảnh cuối phải **cùng tỉ lệ khung**. Nếu khác tỉ lệ thì animate khung ngoài, còn ảnh trong giữ `object-fit`. Không animate `width/height` của `<img>`.

### 5.4 Các lỗi khác cấm
- Hiệu ứng chạy sau hoặc trên vùng chữ học (J3).
- Confetti/hạt che nút hoặc chữ đang cần đọc (hạt dưới modal, `pointer-events:none`, tự tắt ≤ 1,5 s).
- Âm thanh chồng > 2 tiếng; SFX khi audio học đang phát (J7).
- Animation lặp vô hạn trên màn chơi khi người học đang đọc câu hỏi (chỉ tín hiệu sống nhẹ ngoài vùng chữ, J9).
- Lexi xuất hiện trong lúc làm câu (J10).

## 6. Hiệu năng animation
- Một canvas hạt duy nhất toàn app, `devicePixelRatio` ≤ 2 (≤ 1.5 ở bậc Vừa), rAF dừng khi hết hạt (J5).
- Không re-render React mỗi frame: giá trị liên tục (FPS, RMS ghi âm, vị trí con trỏ nghiêng thẻ) đi qua `MotionValue`/ref, không qua `useState`.
- Danh sách dài (Thư viện, Portfolio) không animate từng mục khi cuộn; chỉ animate mục mới vào khung nhìn, tối đa 12 mục.
- Đo:
  - `e2e/perf.spec.ts` trên `vite preview`, CDP CPU ×4, khung 390×844: 30 s V1, 0 frame > 32 ms;
  - `e2e/motion.spec.ts` cho reduced-motion;
  - thêm test bậc "Thấp": giả lập FPS thấp → hook trả bậc Thấp → không có canvas.

## 7. Thứ tự làm juice trong Đợt 4 (khớp ưu tiên)
1. V1 (cổng G3): E0 → E1 → E2 → E3, đo hiệu năng sau mỗi bậc.
2. Áp mẫu V1 cho V2, V3, R1, R2 (T4-A), L1, L2 (T4-B, im lặng lúc nghe), W1, W2 (T4-C, không động lúc viết).
3. Hết thời gian/quota: dừng ở E1 cho game còn lại. Ghi `HANDOFF.md` phần E2/E3 chưa làm. **Không** làm E3 trước E1.
