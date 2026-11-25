# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: Audit-Max Đợt 1 ✅ (G0 ĐẠT) · Đợt 2 đang chạy: **T2-B ✅ & T2-A ✅ đã merge `master`** · T2-C đang chạy · FX-0/FX-2 đang chạy · T3-B đang dở
- 2026-11-25 08:42 · **Audit-Max Đợt 2 · T2-A ✅ ĐẠT & merge `master`**: `r-t2-a` (Gemini 4 Neon Medium) + `rv-t2-a-2` (Gemini 4 Argon Medium) — V2/V3/R1/R2 hoàn thiện (`saveProgress` + `registerProgressSaver`, retry 0 XP, producer `err:l1col_*`/`tfng:*`/`head:*`, seeded selection + YNNG, Highlighter pointer+keyboard, R2 0 tràn ngang 360/375/390, thay `<select>` bằng Sheet), 4/4 E2E m1/m2 + R1→V1, 56 lượt audit-ui 7 khung 0 CHẶN (0 D3/D4/D5/D7/D10).
- 2026-11-25 05:16 · **Audit-Max Đợt 2 · T2-B ✅ ĐẠT & merge `master`**: `r-t2-b` (Gemini 4 Neon High) + `rv-t2-b` (Gemini 4 Argon High) — L1/L2 lọc MP3 thật, chuẩn hoá đáp án Listening (381/381 đáp án 0 tự trượt), audio Safari iOS (TU-03), FX-1 chip `↵` 12px, producer `ltrap:*`/`dict:*` + `saveProgress`, 534/534 vitest, 3/3 E2E m3 + L1→V1, 0 CHẶN/0 NẶNG/0 NHẸ audit-ui trên 7 khung × 2 theme. Tạm dừng chờ reset quota Gemini (`09:38` giờ máy = `2026-11-24T23:08:42Z`).
- 2026-11-20 16:52: Hoàn tất **M0 · Nền móng** (`4b799f5`, `c8d287d`, `e0f13c6`, `rv-m0` PASS 0 lỗi).
- 2026-11-20 21:48: Hoàn tất **M1 · Từ vựng** (`6e5edcc`, `65a257b`, `7b587f5`, `aa75e72`, `4d18e22`, `de13f7e`, `3db3e29`).
- 2026-11-20 22:43: Hoàn tất **M2 · Reading** (`c71aeab`, `6161539`, `1659c73`, `1a506fb`).
- 2026-11-21 07:06: Hoàn tất **M3 · Listening** (`d51376d`, `cc57f4a`, `5d610ad`, `59b2f25`, `8583912`).
- 2026-11-21 09:31: Hoàn tất **M4 · Writing**:
  - `r-grading-core` (`f3accaa`): `src/core/grading/**` (`schemas`, `bands`, `packet` import `docs/grading/*.md?raw`, `parse`, `postcheck`), `GradingPanel`, 4 fixtures, **43/43 tests PASS**.
  - `r-data-writing` (`8f1c8ca`): 60 Task 2 prompts (6 EssayTypes × 10), 24 Task 1 visuals (đủ 7 loại: bar/line/pie/table/mixed/process/map), 50 clichés, `[INV-W1..W4]` PASS exit 0.
  - `rv-data-writing` (Claude Sonnet 5.5, read-only): Soi mẫu 10/10 Task 2 + 24/24 Task 1 + 12/12 clichés → **100% PASS nội dung** (số liệu khớp 100%, pie=100%, 0 Cambridge, 0 bịa tổ chức).
  - `r-chart` (`2ff7398`): `ChartRenderer` phủ đủ 7 loại Task 1 VisualSpec (**27/27 tests PASS** trên 24 file thật).
  - `r-game-w1` (`fbf8587`): **W1 Essay Lab** (Task 1 & 2, pre-writing, live telemetry, cliché detector, GradingPanel, Draft→Revise) + **Writing Portfolio** (`#/portfolio` + hiệu chỉnh `biasOffset`), **15/15 tests PASS**.
  - `r-game-w2` (`810fdc9`): **W2 Writing Sprints** (5 sprint thuần local, **17/17 tests PASS**), nối `ChartRenderer` vào W1, mở `vitest.config.ts` cho `*.test.{ts,tsx}`, E2E `e2e/m4.spec.ts` PASS 1/1 + 6 ảnh (`e2e/screenshots/m4/`).

## Các mốc
| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M0 | Nền móng: shell, design system, core (SRS, storage, scoring), assets | ✅ Hoàn tất 100% |
| M1 | Từ vựng V1–V3 + data vocab + audio vocab + Onboarding/Today | ✅ Hoàn tất 100% |
| M2 | Reading R1–R2 + 24 passages + blind-solve | ✅ Hoàn tất 100% |
| M3 | Listening L1–L2 + 32 episodes + 300 dictation + audio | ✅ Hoàn tất 100% |
| M4 | Writing W1–W2 + chấm qua Claude chat (copy/dán, 0 đồng) | ✅ Hoàn tất 100% (353/353 tests, rv-data-writing 100% PASS, E2E M4 PASS + 6 ảnh) |
| M5 | Speaking S1–S2 + speech core + audio speaking | 🔄 Đang chạy Đợt 1 (`r-speech-core` ∥ `r-data-speaking`) |
| M6 | Exam X1, band, thống kê, polish, PWA, deploy | ⏳ |
| M7 | Mở rộng dữ liệu tới mức đầy đủ (liên tục) | ⏳ |

## Task theo mốc
### M4 (Hoàn tất 100%)
- ✅ r-grading-core (`f3accaa`) · ✅ r-data-writing (`8f1c8ca`) · ✅ rv-data-writing (Claude Sonnet 5.5, PASS) · ✅ r-chart (`2ff7398`) · ✅ r-game-w1 (`fbf8587`) · ✅ r-game-w2 (`810fdc9`)

### M5 (Đang chạy)
- 🔄 r-speech-core · 🔄 r-data-speaking · ⏳ r-game-s1 · ⏳ r-audio-speaking · ⏳ r-game-s2

## Lỗi đã biết
- 1 câu YNNG `p2_004_q05` hơi mơ hồ theo blind-solve M2 (83/84) — tinh chỉnh ở M6/M7.
- Gợi ý từ `rv-data-listening`: cân nhắc chuẩn hóa số điện thoại có dấu cách (`07741 829 360`) trong `listeningAnswer.ts`.
- Minor từ `rv-data-writing`: tinh chỉnh câu mô tả `w1:022` ("waterside land"), `w1:014` ("Oakridge"), và 4 cliché gợi ý (`goes_without_saying`, `with_the_advent_of`, `in_this_day_and_age`, `around_the_clock`) ở M6/M7; mở rộng số lượng Writing từ M4 (60 T2 / 24 T1) lên mức đầy đủ (90 T2 / 42 T1) ở M7.
