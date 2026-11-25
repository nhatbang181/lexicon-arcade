# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: Audit-Max Đợt 1 ✅ (G0) · Đợt 2 ✅ (M-Đ2) · Đợt 3 ✅ (M-Đ3) · **Đợt 4: Cổng G3 ĐẠT ✅ (`audit-max-G3`, 9.03 & 9.07)** · Đang chạy tiếp Đợt 4 (`T4-B` → `T4-A` V2–R2 → `T4-C` → Bùa → G4) & Đợt PB
- 2026-11-25 16:30 · **Audit-Max Đợt 4 · CỔNG G3 ĐẠT ✅ (`audit-max-G3`)**:
  - `T4-A` Chặng 1 (V1 + Recap V1, `r-t4-a` Neon High + Fixer V1 → `rv-g3-a` Opus 5.5→Hydrogen **ĐẠT 9.03/10**, chấm mù **+3.46** & `rv-g3-b` Argon High **ĐẠT 9.07/10**, chấm mù **+4.82**): HUD mobile 78 px (từ 356 px), Sảnh Khởi Chạy V1 (0 J9), juice High ≥ 3 kênh (L-7 0 hạt khi sai, SR-45 lật 3D WebKit-safe, 0 Lexi lúc làm câu), Ngã ba run (`Enter`/`→`), 3 Luật Boss (SR-22), `words.core.json` (521 KB) + lazy `words.detail.json`, công thức Recap Balatro minh bạch + thoại Lexi theo số thật, **42/42 `audit-ui` 0/0/0**, 616/616 vitest, 7/7 `e2e/juice` V1 (gồm 30s CPU ×4).
  - Vá vỏ dùng chung trước G3: `--z-sheet=50`, `Pill nowrap`, `Today` 1 primary + hết bóp chữ 390, `Hub` eager icon + wrap chip + bỏ skeleton chặn, `vite.config.ts` `server.fs.allow` hết 403 worktree.
- 2026-11-25 12:47 · **Audit-Max Đợt 3 · HOÀN TẤT M-Đ3 (`milestone-dot-3`)**:
  - `T3-A` (A5–A6 + Cổng G2, `r-t3-a` Neon High → `rv-t3-a-a` Argon High **ĐẠT 8.80** & `rv-t3-a-b` Hydrogen High **ĐẠT 8.88**): `LiveCard` bỏ sibling shadow M5 + `h-full`, `tokens.css` `@source not` kéo CSS chính xuống **69 KB**, `RecapScreen` Balatro tally + `nextTask`, `Card` U16, `sfx` hàng đợi ≤ 2, `AudioProvider` lưu volume/muted, `/dev/components` 14/14 lượt 0/0/0 + 17/17 E2E `a11y+motion`, 0 rò bundle.
  - `T3-C` (`r-t3-c` Neon Medium + Fixer V1 → `rv-t3-c-a` Argon High **ĐẠT 8.90**, chấm mù **+4.77**, `settings +4.31` & `rv-t3-c-b` Hydrogen High **ĐẠT 8.70**, chấm mù **+4.39**): **70/70 lượt `audit-ui` 0 CHẶN · 0 NẶNG · 0 NHẸ**, 611/611 vitest, 5/5 E2E `daily-loop`, PB-05 backup Gộp/Thay thế + zod, PB-09 `persist()` + cảnh báo Safari→PWA iPhone, Four Strands, Mastered + 7 ngày probe, streak freeze, X9 toast SW.
- 2026-11-25 10:55 · **Audit-Max Đợt 3 · T3-A merge sớm A1–A4 ✅ (`fec3f28`, CI xanh `45540768261`) + T3-C xong C1–C5 (`63eb2de`)**:
  - `T3-A` A1–A4 (`r-t3-a` Neon High + `rv-t3-a-early` Claude Sonnet 5.5 ĐẠT): tokens AA 3 theme (144/144), 153 asset Fluent 3D + Lexi 8 trạng thái + Kenney particles + unDraw SVG + Baloo 2, `fx/` (`useMotionPref`, `useFxTier`, `screenPunch` L-7, `fxCanvas`, `celebrate`, `haptic`), `Mascot`, `LiveCard` (3D WebKit-safe).
  - `T3-C` (`r-t3-c` Neon Medium, `D:\English-wt\T3-C` @ `63eb2de`, chờ review 2 người): PB-05 backup Gộp + zod + nhắc > 7 ngày, PB-09 `persist()` + cảnh báo Safari→PWA iPhone, Four Strands, Mastered + 7 ngày probe, streak freeze, toast SW X9, gắn Lexi/LiveCard/Fluent 3D lên 5 màn khung, 604/604 vitest, 5/5 E2E `daily-loop`, 0 CHẶN audit-ui (40 lượt). Tạm dừng ở cổng vì bể Gemini còn 8% (reset 14:19 giờ VN).
- 2026-11-25 10:11 · **Audit-Max Đợt 3 · T3-B ✅ ĐẠT & merge `master` + G1 ✅ ĐẠT**:
  - `T3-B` (`r-t3-b` Neon Medium + `rv-data-d5d8` Claude Sonnet 5.5 ĐẠT): 32/32 listening MP3 + 320/320 D4, 2.207/2.207 vocab MP3, 700/700 dictation MP3 (L1–10), D5 2.069/2.069, D8 732/747, D10 213/231 (94,4% sharesLemma), D14 2 bộ ExamTest, D17 `words.core.json`, `xac_minh.md`, `public/audio` 86,91 MB (< 400 MB), `validate:data` exit 0.
  - `G1` (`r-t3-a` Neon High): `contrast.mjs` 144/144 (0 lỗi 3 theme), `assets_credits.mjs` 153/153 (0 lỗi), 10 contact sheet duyệt mắt đạt; sang Chặng 2 (A3–A4 merge sớm `fx/LiveCard/Mascot`) song song `T3-C`.
- 2026-11-25 09:24 · **Audit-Max Đợt 2 · FX-0/FX-2 ✅ & T2-C ✅ merge `master` (ĐÓNG M-Đ2)**:
  - `FX-0/FX-2` (`r-fx` Neon Medium + `rv-fx` Claude Sonnet 5.5 ĐẠT 0/0): `listen_spell` lọc MP3 thật (`SR-22`), van tải thẻ mới 15/ngày (giảm khi < 80%, dừng khi > 150), vòng phục hồi ≤ 50 thẻ sau ≥ 3 ngày vắng, từ mới theo khối chủ đề, `registerProgressSaver` V1, vá dứt điểm regex `listeningAnswer.ts` (381/381 đáp án pass).
  - `T2-C` (`r-t2-c-2` Neon Medium + `rv-t2-c` Argon Medium ĐẠT + fixer `d8c28cf`): W1 autosave/khôi phục/Exam tự nộp/DEV-only mẫu (`TASK2_CLAUDE_RESPONSE` = 0 trong dist), PP-16 nhãn "ước lượng" + chỉ lần chấm đầu, giảm ma sát 3 thao tác ≤ 6, W2 lưu Claude sau Recap/seed/khoá tự chấm trước mẫu, Portfolio xác nhận xoá + `userItems` SRS, `a11y.spec.ts` `play-w1` 2/2 pass.
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
