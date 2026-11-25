# BÁO CÁO · FX-0 + FX-2 + vá nợ nhỏ

- **Nhánh / worktree:** `audit-max/FX-0` (`D:\English-wt\FX-0`, tạo từ `master` `ee47416`).
- **Kế hoạch:** `docs/audit-max/KE-HOACH-FX-0.md`.

## 1. Các mục đã thực hiện

| Mục | Trạng thái | Tóm tắt kỹ thuật & file sửa |
|---|---|---|
| KE-HOACH-FX-0.md | ✅ | `docs/audit-max/KE-HOACH-FX-0.md` (20 dòng, liệt kê đủ nút/chức năng V1 giữ nguyên theo `SR-80`/`SR-90`). |
| FX-0 (`listen_spell` kiểm MP3 thật — `SR-22`, `PP-C1`) | ✅ | `src/games/v1-daily-run/extras.ts` (dùng trực tiếp `src/core/audio/audioAvailability.ts`, kiểm thêm `vocab:*` mặt `listen_spell`), `content.ts`, `engine.ts` (`resolveV1Face` hạ `vocab:*` thiếu MP3 sang `recall_meaning` và ghi `missingItems` `reason: 'missing_audio'`; `dict:*` thiếu MP3 bỏ node + ghi `missing_audio`), `V1DailyRun.tsx` (truyền `vocab` vào `loadV1Extras`), `audioMissing.test.ts` (+3 test FX-0). |
| FX-2 (Van tải thẻ mới + Vòng phục hồi + Khối chủ đề — `PP-02`, `PP-C4`, `L-5`, `L-11`, `SR-87`) | ✅ | `src/core/srs/queue.ts` (`computeEffectiveNewCardsLimit`: mặc định 15/ngày, giảm bậc 15→10→5 khi nhớ 7 ngày < 80%, dừng = 0 khi `dueCount > 150`; `computeAbsenceDays` mốc 04:00 giờ địa phương + `isRecoveryRoundEligible`: vắng ≥ 3 ngày & `dueCount > 50` → giới hạn phiên ≤ 50 thẻ; `groupNewCardsByTopic`: gom thẻ mới theo khối chủ đề); nối vào `src/games/v1-daily-run/engine.ts` (`computeRecent7DayRetention`, truyền `retention7d`/`absenceDays`/`getNewCardTopic`) và `V1DailyRun.tsx` (hiện nhãn "Vòng phục hồi · tối đa 50 thẻ" và lý do sư phạm khi van giới hạn); test ở `src/core/srs/srs.test.ts` (+3 test) và `src/games/v1-daily-run/engine.test.ts` (+1 test). |
| Vá nợ nhỏ (`TU-02`/`F1`, `X5`, `REVIEW-T2-B-A.md`) | ✅ | `src/games/v1-daily-run/V1DailyRun.tsx` (đăng ký `registerProgressSaver` khi mount, huỷ khi unmount); `src/games/v1-daily-run/index.ts` (`load: () => Promise.resolve({ default: V1DailyRun })` bỏ cảnh báo Rollup); `src/core/scoring/listeningAnswer.ts` (sửa ký tự `\x08` ở dòng 408 → `(\d),(?=\d{3}\b)` và dòng 708 → `(?:am|pm)\b`); `src/core/scoring/listeningAnswer.normalize.test.ts` (+2 test `"1,500"`/`"10,000"`/`"1,500,000"` và `"9:00 am"`). |

## 2. Kết quả kiểm bắt buộc (số đo thật)

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit -p .` | Exit 0 (0 lỗi TypeScript). |
| `npx vitest run src/core/srs src/core/scoring src/games/v1-daily-run` | Exit 0 · 11/11 file, **183/183 test pass** (gồm `srs.test.ts` 12/12, `audioMissing.test.ts` 9/9, `engine.test.ts` 22/22, `listeningAnswer.normalize.test.ts` 32/32, `listeningAnswer.dataset.test.ts` 3/3 = **381/381 đáp án pass**). |
| `npm test` | Exit 0 · 52/52 file, **579/579 test pass** (43.00s). |
| `PW_PORT=5234 PW_CHANNEL=chrome npx playwright test e2e/v1-srs.spec.ts --project=chromium` | Exit 0 · **5/5 pass** (1.4m, 0 lỗi console/pageerror). *(Lần chạy đầu song song với `npm test` + `vite build` bị timeout `page.goto` 45s ở test 1; chạy riêng 5/5 pass).* |
| `npx vite build` | Exit 0 · **0 cảnh báo Rollup ở `v1-daily-run`** (chỉ còn cảnh báo ở `w1-essay-lab` ngoài phạm vi). `v1-daily-run`: 100.61 kB (gzip 29.48 kB); `index.js`: 488.90 kB (gzip 152.24 kB); `index.css`: 128.47 kB (gzip 29.07 kB); precache: 132 entries (**1452.46 KiB** ≤ 1500 KiB). |
| `BASE_URL=http://localhost:5224 node docs/audit-max/cong-cu/audit-ui.mjs --route play/v1 --vp 390x844,375x667,1280x800 --theme dark,light --out out/fx-0` | Exit 0 · **0 CHẶN · 0 NẶNG · 0 NHẸ** (ảnh tạm lưu tại `out/fx-0`, không commit). |

## 3. Chỗ chưa chắc / cần reviewer kiểm thêm
- `audit-ui` chạy mặc định trên `play/v1` với IndexedDB trống (màn `EmptyState`); phần nhãn mới ở `map_intro` ("Vòng phục hồi · tối đa 50 thẻ" và khung lý do van thẻ mới) đã kiểm bằng unit test + `tsc`, chưa chụp riêng trạng thái seeded > 150 thẻ trong `audit-ui`.
- Với thẻ `vocab:*` mặt `listen_spell` thiếu MP3 thật: khi hạ sang `recall_meaning`, hệ thống vẫn ghi `missing_item` (`reason: 'missing_audio'`) để theo dõi dữ liệu thiếu âm thanh, đồng thời người học vẫn ôn được từ bằng gợi nhớ nghĩa (không chấm FSRS trên thẻ nghe không có âm thanh).
