# 10 · Chuyển động và âm thanh

> Mục tiêu: **giòn, nhanh, có nghĩa**. Mỗi animation hay âm thanh phải báo một điều gì đó: đúng, sai, tiến bộ, chuyển cảnh.
> Không trang trí liên tục ở vùng chữ. Không có hiệu ứng nào làm chậm lượt chơi kế tiếp quá 400 ms.

## 1. Thông số chung (`src/design/motion.ts`)
```ts
export const dur = { instant: 0.08, fast: 0.15, base: 0.22, slow: 0.35, celebrate: 0.6 } as const; // giây
export const ease = { out: [0.16, 1, 0.3, 1], inOut: [0.65, 0, 0.35, 1], in: [0.4, 0, 1, 1] } as const;
export const spring = { snappy: { type: 'spring', stiffness: 520, damping: 32 },
                        soft:   { type: 'spring', stiffness: 260, damping: 26 },
                        bouncy: { type: 'spring', stiffness: 420, damping: 14 } } as const;
```
Thư viện: `motion/react` (`motion.div`, `AnimatePresence`, `LayoutGroup`). Chỉ animate `transform` và `opacity`. **Cấm animate width, height, top, left** trong vòng lặp game.

## 2. Bảng animation chuẩn

| Sự kiện | Animation | Thời lượng | Ghi chú |
|---|---|---|---|
| Chuyển route | fade + dịch y 12 px → 0 | base, ease.out | Thoát: fade 0,15 |
| Mở game (vào toàn màn hình) | Thẻ game phóng to (shared layout `layoutId`) → nền game | slow | Từ Hub hoặc Hôm nay |
| Câu hỏi mới vào | Câu cũ trượt trái và mờ, câu mới từ phải vào (x 24 → 0) | base | Đảo chiều nếu "quay lại" |
| **Đáp án đúng** | Ô hoặc nút: scale 1 → 1.05 → 1 (spring.bouncy), viền + `shadow-glow-ok`, icon ✓ vẽ nét (pathLength 0 → 1) | 0,3 | Kèm SFX `correct` |
| **Đáp án sai** | Rung ngang `x: [0,-6,6,-4,4,0]`, viền đỏ, sau đó hiện đáp án đúng với viền xanh nét đứt | 0,3 | Kèm SFX `wrong` (nhẹ, không chói) |
| Gần đúng (partial) | Viền vàng, ký tự sai trong ô gõ nhấp nháy gạch chân 2 lần | 0,4 | Dictation, spelling |
| +XP | Số "+20" bay lên 24 px rồi mờ, ở góc nút vừa bấm | 0,6 | Gộp lại nếu nhiều lần trong 1 s |
| Combo tăng | Số combo pop (scale 1.3 → 1), lửa 🔥 lớn dần theo bậc x2/x3/x5 | fast | Combo vỡ: số rơi xuống mờ, không có âm báo lỗi riêng |
| FeedbackPanel | Trượt lên (mobile) hoặc từ phải (desktop) bằng spring.soft. Quote bằng chứng được highlight dần trái → phải | base | |
| Highlight bằng chứng (R1) | Nền vàng 30% quét từ trái sang phải trên span | 0,4 | Cuộn tới span trước (smooth) |
| Waveform vùng bẫy (L1) | Vùng đỏ "mở" từ giữa ra hai bên, nhấp nháy 1 lần | 0,35 | |
| Timer còn 10% | Chữ đỏ, scale 1 ↔ 1.04 mỗi giây | lặp | **Tắt ở exam mode** (chỉ đổi màu) |
| Mic đang nghe | Vòng ngoài scale theo RMS thực (0 → 1,25), làm mượt bằng lerp 0,2 mỗi frame | realtime | requestAnimationFrame, không re-render React |
| Ring mục tiêu ngày đầy | Vòng chạy tới 100% → loé sáng → ✓ | celebrate | Kèm SFX `goal` |
| **Lên level / item lên Mastered / streak mốc 7-30-100** | Confetti nhẹ (canvas-confetti, 80 hạt, 2 màu kỹ năng) + toast | celebrate | **Chỉ ở các mốc này.** Không bao giờ theo từng câu |
| Recap | Số điểm đếm lên (0 → N trong 0,8 s, easeOut), các thẻ thống kê vào lần lượt cách nhau 60 ms | | |
| Skeleton tải | Shimmer gradient 1,2 s lặp | | |

## 3. Âm thanh (SFX)
- **Nguồn:** **Kenney "Interface Sounds"** và **"UI Audio"** (CC0, https://kenney.nl/assets/interface-sounds, https://kenney.nl/assets/ui-audio). Bổ sung từ **Kenney "Digital Audio"** hoặc **"Impact Sounds"** (CC0) nếu cần.
  - Chỉ dùng Pixabay hay Freesound khi thật sự thiếu. Ghi license từng file. Freesound chỉ lấy file CC0.
- Script `scripts/assets/build_sfx_sprite.py`: chọn file theo bảng dưới, cắt và chuẩn hoá về −20 LUFS, ghép thành sprite `public/assets/sfx/sfx.webm` + `sfx.mp3`, sinh `sfx.json` (tên → [offsetMs, durationMs]).

| Tên | Khi nào | Tính chất mong muốn | Gợi ý file Kenney (worker nghe và chọn) |
|---|---|---|---|
| `tap` | Bấm nút, chọn đáp án | Click ngắn ≤ 60 ms | `click_00x`, `select_00x` |
| `correct` | Đúng | 2 nốt đi lên, sáng, ≤ 250 ms | `confirmation_00x` |
| `wrong` | Sai | Trầm, mềm, ≤ 200 ms, **không** buzz chói | `error_00x` (chọn cái nhẹ nhất), giảm 4 dB |
| `combo` | Combo x3 / x5 | Nốt cao hơn `correct`, cao độ tăng theo bậc | `confirmation` + pitch shift ở runtime (howler `rate` 1.0/1.12/1.25) |
| `reveal` | Hiện đáp án hoặc feedback | Whoosh nhẹ | `swoosh` / `maximize` |
| `tick` | Timer 10 giây cuối (training) | Tick nhỏ, âm lượng 40% | `tick_00x` |
| `timeup` | Hết giờ | Chuông 2 tiếng | `bong_001` / `glass` |
| `goal` | Xong mục tiêu ngày | Hợp âm 3 nốt | `jingles` (chọn 1 cái ngắn) |
| `levelup` | Lên level, mốc lớn | Fanfare ngắn ≤ 1,2 s | |
| `record_start` / `record_stop` | Bắt đầu và dừng ghi âm | Bíp lên / bíp xuống | `switch_00x` |
| `page` | Lật thẻ, chuyển câu | Giấy nhẹ | `drop` / `scroll` |

**Luật âm thanh:**
- Âm lượng SFX mặc định 60%.
- **Exam mode tắt mọi SFX** trừ `timeup`.
- Đang phát audio bài nghe hoặc đang ghi âm thì **chặn mọi SFX**.
- **Nhạc nền:** mặc định tắt. Nếu bật thì chỉ phát ở Hôm nay, Hub và V1. Chọn 2–3 bản lofi CC0 hoặc Pixabay Music, ghi license. Tự giảm còn 20% (duck) khi có audio học. **Không bao giờ** phát nhạc trong L1, L2, S1, S2 và exam.

## 4. Giảm chuyển động
Nếu `prefers-reduced-motion: reduce` hoặc người dùng bật trong Cài đặt:
- Mọi chuyển động dịch hoặc scale đổi thành fade 0,1 s.
- Không rung, không confetti, timer không đập.
- Waveform vẫn vẽ nhưng không animate vùng bẫy.

Dùng hook `useReducedMotion()` của `motion`, cộng thêm setting riêng.

## 5. Cổng đo được
- `e2e/motion.spec.ts`: bật emulate reduced-motion, chạy 1 lượt V1 và 1 lượt R1, kiểm không có element nào có `transform` khác `none` sau 200 ms.
- Profile 30 giây chơi V1 (Chrome Performance, CPU throttle 4×): không có frame > 32 ms do animation.
- SFX sprite: tổng ≤ 400 KB. Phát lần đầu không giật (preload khi vào app).
