# 05 · ĐỘ KHÓ TỪNG TASK, MODEL, CÁCH CHIA NHỎ

> **Độ khó (1–5):** 1 = việc lặp lại theo mẫu · 3 = nhiều file, cần hiểu luồng dữ liệu · 5 = thiết kế hệ thống, ảnh hưởng mọi màn, dễ sai âm thầm.
> **Rủi ro (T/V/C):** khả năng làm hỏng thứ khác hoặc sai mà test không bắt được. Thấp / Vừa / Cao.
> **Tầng model:** xem `02-KE-HOACH.md` §3. Luôn: reviewer khác model với builder, ưu tiên khác hãng.
> **Thời gian:** ước lượng giờ máy chạy agent, không tính chờ quota.

## 1. Bảng tổng

| Task | Độ khó | Rủi ro | Loại việc | Builder | Reviewer | Giờ | Điểm khó nhất |
|---|---|---|---|---|---|---|---|
| T2-A (V2, V3, R1, R2) | 3 | V | logic game, lưu tiến độ, bàn phím, tràn ngang | Vừa, high | Mạnh | 6–10 | 4 game một lúc; producer `userItems` phải khớp renderer V1 |
| T2-B (L1, L2, chấm) | 4 | C | chấm đáp án, audio, lọc dữ liệu | Vừa, high (chấm đáp án: cân nhắc Mạnh) | Mạnh | 6–10 | Chuẩn hoá đáp án: sai 1 quy tắc là chấm sai hàng trăm câu, test khó phủ hết |
| T2-C (W1, W2, chấm Claude) | 3 | V | autosave, idempotent, parse kết quả dán | Vừa, high | Mạnh | 5–8 | Idempotent + chặn lệch `attemptId`; parse zod chặt nhưng không làm khó người dùng |
| FX-0 (listen_spell) | 1 | T | sửa 1 renderer + test | Vừa | Mạnh (soi diff) | < 1 | Kiểm file tồn tại thật (HEAD) chứ không theo trường JSON |
| T3-A (design system, asset, fx, Mascot, Recap) | **5** | **C** | thiết kế hệ thống, asset, animation, a11y | **Mạnh** | Mạnh + Vừa (2 người, chấm mù) | 16–24 | Ảnh hưởng mọi màn; bị chặn bởi cổng G1, G2; dễ "đẹp ảnh, lag máy" |
| T3-B (dữ liệu, audio) | 3 | C | sinh/sửa nội dung, render audio, validator | Vừa; verify bằng model **khác** | Mạnh + soi mẫu | 12–20 (render chạy nền) | Sai nội dung khó thấy; khối lượng lớn; mạng edge-tts chập chờn |
| T3-C (Hub, Hôm nay, Thống kê, Cài đặt) | 4 | V | màn khung giàu hình, vòng lặp ngày, backup | Vừa, high | Mạnh + Vừa (2 người) | 10–14 | Phụ thuộc T3-A; mật độ hình M1–M7 trên iPhone mà không rối |
| T4-A V1 (cổng G3) | **5** | C | juice + HUD mobile + Recap | **Mạnh** | Mạnh × 2 khác hãng | 8–12 | Phải ≥ 9,0; 22 dòng × ≥ 3 kênh mà không lag, không đè chữ |
| T4-A V2–R2 | 4 | V | juice theo mẫu V1 | Vừa, high | Mạnh + Vừa | 10–16 | Lặp mẫu V1 nhưng đúng cơ chế riêng (con dấu R1, tít bay R2…) |
| T4-B (L1, L2 juice) | 3 | V | juice + im lặng có chủ đích lúc nghe | Vừa, high | Mạnh + Vừa | 6–10 | Không phát SFX khi audio học phát |
| T4-C (W1, W2 + Bùa) | 4 | C | hệ Bùa dùng chung 9 game | Mạnh cho API Bùa; Vừa cho W1/W2 | Mạnh + Vừa | 10–14 | Bùa làm sau cùng (SR-92), API `useCharms()` merge trước khi gắn vào 9 game; Bùa không được phá sư phạm |
| PB (production bổ sung) | 2–3 | V | cấu hình, script, tài liệu | Vừa | Mạnh (soi) | 4–8 | Xem `15-PRODUCTION-BO-SUNG.md` |

## 2. Chia nhỏ task lớn (bước con chạy **tuần tự trong cùng làn**, không thành làn song song mới)

Chia nhỏ để có checkpoint commit, để nối lại dễ khi bị dừng, và để review hẹp từng phần. **Không** tách thành task mới có danh sách file riêng, vì như vậy là đổi `TASKS.md`; chỉ điều phối được làm việc đó, và phải ghi `DECISIONS.md`.

### T2-A
| Bước | Việc | Checkpoint |
|---|---|---|
| A1 | V2 (đã commit `18f648f`) + test V2 còn dở | `vitest src/games/v2-*` xanh |
| A2 | V3: seed chọn item (≤ 2 trùng giữa 2 phiên), listbox bàn phím (V3-5), tách "bậc" khỏi "tương đương" nếu dữ liệu cho phép | test seed + E2E bàn phím |
| A3 | R1: Highlighter pointer + bàn phím (R1-5), producer `tfng:*`, khác passage giữa 2 phiên | E2E chéo R1 → V1 `tfng_retry` |
| A4 | R2: hết tràn ngang ở 375/390 (U7), producer `head:*` | audit-ui 375/390 0 D5 |
| A5 | Chung: `saveProgress` + `registerProgressSaver`, retry 0 XP, `level`/`mode`, bỏ header trùng (U3), C7 | `m1`, `m2` xanh |

### T2-B
| Bước | Việc | Checkpoint |
|---|---|---|
| B1 | (đã commit) chuẩn hoá đáp án L1-02..06, trình phát, X-04/05 | – |
| B2 | Commit 2 file `src/core/audio` đang dở; chip `↵` ≥ 12 px (FX-1) | `tsc` + test audio |
| B3 | L1-01: lọc episode **file MP3 tồn tại thật**, cấm transcript ở Exam, 0 band từ phiên mô phỏng | test + E2E |
| B4 | L1-08/09/10 retry, exam, autoplay | E2E `m3` |
| B5 | L2: lọc câu thiếu audio, chọn có seed | test |
| B6 | Producer `ltrap:*` (+`audioClip`), `dict:*`; `saveProgress` | E2E chéo L1 → V1 |
| B7 | Script "381 đáp án đúng trong data không tự trượt" | exit 0 |

### T3-A (độ khó 5: bắt buộc chia)
| Bước | Việc | Cổng / checkpoint |
|---|---|---|
| A1 | Token: theme sáng, `--color-on-accent`, `--color-text-faint`, `--color-border-strong`, thang chữ, token khoảng cách/bo góc/bóng/thời gian/easing (`12-UI-UX.md` §2, `13-ANIMATION.md` §2) | `scripts/qa/contrast.mjs` 0 lỗi cả 2 theme |
| A2 | Tải asset theo `11-ASSET.md` (tải nhiều, chọn đẹp nhất) → contact sheet `docs/audit-max/bang-asset/` | **G1** (AD tự duyệt theo `11` §8) |
| A3 | `src/design/fx/`: `fxCanvas`, `emit`, `numberPop`, `screenPunch`, `celebrate`, `haptic`, **`useMotionPref` + `useFxTier`** (thang hạ cấp `13` §3), reduced-motion toàn cục | merge sớm (`03` §7.4) |
| A4 | `Mascot.tsx` + `mascotLines.ts` (8 trạng thái), `LiveCard.tsx` | merge sớm |
| A5 | `Button`/`ChoiceButton` đủ trạng thái, Modal/Sheet focus trap, Card bàn phím, `sfx.ts` hàng đợi ≤ 2, `RecapScreen` mới (nhận `nextTask`) | – |
| A6 | `#/dev/components` mọi thành phần × trạng thái × 2 theme × 4 khung iPhone/iPad/laptop | **G2** (2 reviewer) |

### T3-B
| Bước | Việc |
|---|---|
| B1 | Kiểm + commit 25 MP3 listening dở; render nốt 32/32 (D1) |
| B2 | `audioProvenance` + `public/audio/CREDITS.md` (D12) |
| B3 | Render vocab thiếu (1 670 từ) nếu tổng ≤ 400 MB (D1 vocab) |
| B4 | D5 câu ví dụ, verifier khác hãng, soi 10% |
| B5 | D6 provenance, D7 CEFR → `freqBand`/nguồn mở, D19 IPA |
| B6 | D8 trap thật, D9 trùng (`deprecated`+`aliasOf`), D10 decoy |
| B7 | §3 độ phủ band: `level` cho vocab/collocation, 360 collocation band 4–6, 400 dictation L7–10, 4 episode L1/L10, topic thiếu |
| B8 | D14 ExamTest 2 bộ, D15 Writing đề, D16 Speaking 2027-Q1 (chỉ dữ liệu, không đụng S1/S2 code) |
| B9 | D17 minify + `words.core.json` (giữ file cũ song song; loader đổi qua HANDOFF) |
| B10 | `validate:data:release` exit 0 → AD bật `RELEASE_GATE=1` |

### T3-C
| Bước | Việc |
|---|---|
| C1 | Dữ liệu/logic: `saveSession` trả `{newBadges, levelUp, streakEvent}`, `useAsyncData` + màn lỗi (X11), backup schema thật + chế độ Gộp (X12), `persist()` (F18), `planner/today.ts` hết UTC |
| C2 | Hôm nay: việc tiếp theo lên đầu (U6), mục tiêu ngày ăn mừng (F9), giữ chuỗi 5 phút (F14), nhắc + `.ics` (F13) |
| C3 | Hub bộ sưu tập thẻ + Sheet chọn chế độ, "Sắp có" cuối (U5, U11); bỏ chữ "FSRS" |
| C4 | Thống kê (F7, F8), Cài đặt (3 công tắc motion, giờ nhắc, dung lượng, "Hiện nhân vật", đổi tên) |
| C5 | Gắn Lexi + hiệu ứng sau khi T3-A merge `fx/`, `LiveCard`, `Mascot` |

### T4-A
| Bước | Việc |
|---|---|
| V1 | Bảng 03 §3 cho V1 + HUD mobile (U1, B5) + Recap V1 + ngã ba run + luật boss → **G3** |
| V2 → V3 → R1 → R2 | Lần lượt, mỗi game 1 commit lớn có test `juice.spec`; đặt cược V3, con dấu R1, tít bay R2 (01 §6.3) |
| HEX | Hex cứng trong game → token (HANDOFF từ T3-A) |

### T4-C
| Bước | Việc |
|---|---|
| C-W | W1, W2 juice: Δ band động, confetti khi ≥ +0,5, combo W2, 3 mục tiêu nhỏ W1 (làm **trước** Bùa) |
| C-API | `src/games/_shared/charms/**` + `useCharms()` + test → merge sau khi 9 game đạt E0–E1 (SR-92); làn A, B gọi API sau đó |
| C-Bùa | Bùa (01 §6.2) gắn vào 9 game qua API; Bùa không bao giờ đổi đáp án/giảm yêu cầu học |

## 3. Dấu hiệu cần nâng model hoặc đổi cách
- Builder báo "xong" nhưng AD kiểm (`03` §5) thấy test đỏ hoặc file ngoài phạm vi **2 lần** → nâng lên tầng Mạnh.
- Reviewer trả về cùng một loại lỗi qua 2 vòng fixer (vd chữ < 12 px tái xuất) → lỗi nằm ở thành phần dùng chung → chuyển sang chủ file thành phần đó (thường T3-A), không bắt fixer vá từng màn.
- Task kéo dài > 1,5× ước lượng → AD đọc KE-HOACH và BAO-CAO, chia lại bước con, ghi nhật ký.
