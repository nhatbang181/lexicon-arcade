# KẾ HOẠCH · T4-A Chặng 1 (Cổng G3: V1 Daily Run + Recap V1)

- **Nhánh / worktree:** `audit-max/T4-A` (`D:\English-wt\T4-A`), cổng riêng `vite 5261`, `PW_PORT 5271`, `preview 4201`.
- **Phạm vi file:** `src/games/v1-daily-run/**`, `e2e/juice.spec.ts` (mở các dòng V1), `docs/audit-max/{KE-HOACH-T4-A.md,BAO-CAO-T4-A.md,anh-sau/T4-A/**,HANDOFF.md}`.
- **Ưu tiên thiết bị:** iPhone (`390×844`, `375×667`, `430×932`) số 1; iPad (`820×1180`, `1180×820`) và laptop (`1280×800`, `1366×768`) số 2.

## 1. Danh sách chức năng & nút hiện có của V1 + Recap V1 (bắt buộc giữ nguyên — SR-80/SR-90)
- **Màn rỗng / lỗi / đã ôn xong:** nút `Tải lại trang`, `Về Hôm nay`, `Bắt đầu với 15 từ khởi động` (tạo 15 thẻ thật), link `Làm placement` (`#/placement`).
- **Màn bản đồ mở đầu (`map_intro`):** `RunMap`, nhãn phục hồi (`v1-recovery-badge`), thông báo van tải thẻ mới (`v1-new-card-valve-notice`), tiêu đề `Lượt chạy hôm nay: N thẻ`, nút đổi `Chế độ bận (10 thẻ)` / `Tiêu chuẩn`, nút `Bắt đầu (Enter)` + phím `Enter`.
- **Màn chơi (`playing` / `boss`, 13 mặt thẻ):** `data-testid="v1-node"`, `data-item-id`, `data-face`; phím `1–4`, `H` / `Alt+H` (Gợi ý), `Enter`; nút `Nghe phát âm` (kiểm MP3 thật + quota lượt nghe + hoàn lượt khi lỗi), `Tôi biết rồi (Kiểm ngay)`, `Đã xem (Enter)`, `Gợi ý (H)`, `Không nhớ`, `Nộp (Enter)`.
- **Phản hồi tức thì:** đúng tự chuyển ≤ 1,2 s hoặc `Enter` + collocation nổi bật; sai/gần đúng có `CharDiffBox` + `FeedbackPanel` + chờ `Enter`.
- **Checkpoint & Lưu tiến độ:** lưu `saveProgress` debounce 500 ms (0 ms ở checkpoint), flush `pagehide`/`visibilitychange`/`registerProgressSaver`, nút `Lưu & Dừng tại đây`, `Đi tiếp (Enter)`.
- **Boss & Recap V1:** 5 thẻ khó nhất, HP 100→0 vỡ 8 mảnh, sai đẩy xuống cuối Boss; Recap có 4 thẻ số V1 (Tổng số thẻ, Đúng lượt đầu, Lên Mature/Mastered, Dự báo ngày mai) + `RecapScreen`, nút `Ôn ngay N câu sai` (≤ 5 thẻ, 0 XP, 0 FSRS), `Về Hôm nay`.

## 2. Hạng mục nâng cấp Chặng 1 (G3)
1. **HUD mobile V1 (`U1`, `B5`, `SR-42`):** `< 768px` chỉ dùng thanh mảnh `≤ 20px` (tiến độ 8px có vệt sáng chạy qua + chip combo + chip XP + `Band ≈ X.X`), bỏ `RunMap` khỏi màn câu hỏi, đưa chú giải màu vào tooltip `?` (≥ 44px), `[data-testid="v1-node"]` có `top ≤ 80px`, đáp án 2 có `bottom ≤ 844px`, nút chính dính đáy `min-h-[52px]`; desktop `≥ 1024px` thẻ câu giữa `max-w-[720px]` + `RunMap` cột phải `280px`.
2. **Juice mức High (`13-ANIMATION`, `03 §3`, `useFxTier`, tắt khi `exam`):**
   - Chọn đáp án: `scale .97` 80ms + ripple + `playSfx('tap')` + `haptic('tap')`.
   - Đúng (≥ 3 kênh): hit-stop 55ms (chỉ `full`) → pop `1→1.06→1` + ✓ vẽ nét + `playSfx('correct', { rate: computeComboRate(combo) })` + `emit('spark', 12..16)` + `numberPop` + `haptic('correct')`.
   - Sai (≥ 3 kênh, 0 hạt, không rung cả màn hình): `screenPunch` `wrong-card` ±6px/300ms chỉ trên thẻ + viền `--color-wrong` + tối nhẹ `brightness(.85)` 150ms + sau 200ms viền nét đứt đáp án đúng + `playSfx('wrong')` + `haptic('wrong')`.
   - Combo x3/x5/x10 (`scale 1.4→1`, HUD punch `1.06`, `streak` SFX, `ember`) & vỡ combo (rơi `+12px` mờ 300ms + 6 `smoke`, không tiếng phạt).
   - Câu mới vào (`questionSlideVariants` + `flip` + vệt sáng thanh tiến độ), lật thẻ 3D WebKit-safe `<LiveCard>` ở `intro` (crossfade 120ms khi reduced), `FeedbackPanel` truyền `nextTipVi` + chữ hiện dần 18ms/ký tự (bấm/Space hiện hết).
   - Interstitial chuyển chặng/Boss (1,2 s) & Checkpoint/Recap hiện `RunMap` + `<Mascot>` trong `data-mascot-ok="true"` (0 Lexi lúc đang làm câu); Recap nối `RecapScreen` chuẩn T3-A (`correctCount`, `baseXp`, `comboMultiplier`, `nextTask`, `onNextTask`, confetti chỉ khi ≥ 80%).
3. **Kinh tế XP (`01-GAME §5`) & Vui thật (`01-GAME §6.3`):**
   - Gợi nhớ `10 XP × combo`, sản xuất/gõ `15 XP × combo` (combo ×1 / ×1,5 ở 5 / ×2 ở 10, trần ×2), hoàn thành phiên `+20` lần đầu ngày / `+5` lần sau, retry / Đã xem / Exam = `0 XP`.
   - **Ngã ba run** tại checkpoint: `Enter` = `Đường an toàn` (thẻ đến hạn chuẩn), `→` = `Đường gai` (5 thẻ retrievability thấp nhất, thưởng ×1,5 XP có trần).
   - **Luật Boss V1:** ngẫu nhiên `Không gợi ý` / `Phải gõ` / `Chỉ nghe` (thiếu MP3 thật tự hạ về `Không gợi ý` theo `SR-22`); hạ Boss có hit-stop 50ms + `screenPunch` ≤ 8px + hạt vỡ khiên + `levelUp`.
4. **Tối ưu dữ liệu `D17`:** `extras.ts` nạp `words.core.json` (521 KB) làm nguồn chính (fallback `words.json`), nạp lười `words.detail.json` khi cần chi tiết/ví dụ.
5. **Kiểm chứng:** unit test mới + mở `e2e/juice.spec.ts` (V1 + HUD `390×844` + 30s CPU ×4), chạy `tsc`, `npm test`, Playwright (`juice/m1/a11y/motion/perf/v1-srs`), `audit-ui`, chụp ảnh các trạng thái + quay `390x844-v1-demo.webm`, `size-budget`, `hardcoded-colors`.
