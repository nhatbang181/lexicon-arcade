# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: M0 ✅ · M1 ✅ · M2 ✅ 100% -> ĐANG CHẠY M3 · LISTENING (Đợt 1: r-data-listening ∥ r-game-l1)
- 2026-11-20 16:52: Hoàn tất **M0 · Nền móng** (`4b799f5`, `c8d287d`, `e0f13c6`, `rv-m0` PASS 0 lỗi).
- 2026-11-20 21:48: Hoàn tất **M1 · Từ vựng** (`6e5edcc`, `65a257b`, `7b587f5`, `aa75e72`, `4d18e22`, `de13f7e`, `3db3e29`).
- 2026-11-20 22:43: Hoàn tất **M2 · Reading**:
  - `r-data-reading` (`c71aeab`): 24 passages (18 training + 6 reserved, P1:8 / P2:8 / P3:8, 330 câu hỏi, đủ 8 `RQType`, `npm run validate:data` PASS 100%).
  - `rv-data-reading` (`6161539`, Claude Sonnet 5.5): Blind-solve độc lập 6 bài (84 câu) khớp **83/84 = 98.81%** (5/6 bài 100%, 1 câu đề xuất làm rõ `p2_004_q05`).
  - `r-game-r1` (`1659c73`): Shared Reading UI (`Highlighter`, `QuestionNav`, `PassageView`, `ExamFrame`) + R1 TFNG Judge (Judge + Passage/Exam, 23/23 tests pass) + `readingPlacement.ts`.
  - `r-game-r2` (`1a506fb`): R2 Headline Editor (15/15 tests pass, chunk 12.12 KB gzip), nối bước 2 Reading Placement, E2E `e2e/m2.spec.ts` PASS 1/1 (0 console error, 6 ảnh chụp `e2e/screenshots/m2/`).

## Các mốc
| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M0 | Nền móng: shell, design system, core (SRS, storage, scoring), assets | ✅ Hoàn tất 100% |
| M1 | Từ vựng V1–V3 + data vocab + audio vocab + Onboarding/Today | ✅ Hoàn tất 100% |
| M2 | Reading R1–R2 + 24 passages + blind-solve | ✅ Hoàn tất 100% (199/199 tests, blind-solve 98.81%, E2E M2 PASS, 6 ảnh) |
| M3 | Listening L1–L2 + episodes + audio (Kokoro UK/US + edge-tts AU/NZ/CA) | 🔄 Đang chạy Đợt 1 (`r-data-listening` ∥ `r-game-l1`) |
| M4 | Writing W1–W2 + chấm qua Claude chat (copy/dán, 0 đồng) | ⏳ |
| M5 | Speaking S1–S2 + speech core | ⏳ |
| M6 | Exam X1, band, thống kê, polish, PWA, deploy | ⏳ |
| M7 | Mở rộng dữ liệu tới mức đầy đủ (liên tục) | ⏳ |

## Task theo mốc
### M2 (Hoàn tất 100%)
- ✅ r-data-reading (`c71aeab`) · ✅ rv-data-reading (`6161539`, 98.81%) · ✅ r-game-r1 (`1659c73`) · ✅ r-game-r2 (`1a506fb`)

### M3 (Đang chạy)
- 🔄 r-data-listening · ✅ r-game-l1 (`5d610ad` – 28/28 tests) · 🔄 r-game-l2 · ⏳ rv-data-listening (`claude-sonnet-5-5-medium`) · ⏳ r-audio-listening (`3.8 Flash medium`)

## Lỗi đã biết
- 1 câu YNNG `p2_004_q05` hơi mơ hồ theo blind-solve (83/84) — ghi nhận để tinh chỉnh ở đợt polish M6/M7.
