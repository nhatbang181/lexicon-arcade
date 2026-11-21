# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: M0 ✅ · M1 ✅ · M2 ✅ · M3 ✅ 100% -> ĐANG CHẠY M4 · WRITING (Đợt 1: r-grading-core ∥ r-data-writing)
- 2026-11-20 16:52: Hoàn tất **M0 · Nền móng** (`4b799f5`, `c8d287d`, `e0f13c6`, `rv-m0` PASS 0 lỗi).
- 2026-11-20 21:48: Hoàn tất **M1 · Từ vựng** (`6e5edcc`, `65a257b`, `7b587f5`, `aa75e72`, `4d18e22`, `de13f7e`, `3db3e29`).
- 2026-11-20 22:43: Hoàn tất **M2 · Reading** (`c71aeab`, `6161539`, `1659c73`, `1a506fb`).
- 2026-11-21 07:06: Hoàn tất **M3 · Listening**:
  - `r-data-listening` (`d51376d`): 32 episodes (24 training + 8 reserved, 6 MapSpecs, 25% giọng AU/NZ/CA) + 300 dictation items, `validate:data` PASS 100%.
  - `rv-data-listening` (`cc57f4a`, Claude Sonnet 5.5): Blind-solve 40 câu (P1–P4) khớp **39/40 = 97.5%** (0 lỗi dữ liệu).
  - `r-game-l1` (`5d610ad`): `TrackPlayer`, `Waveform`, `MapView`, L1 Trap Detector (28/28 tests pass), `listeningPlacement.ts`.
  - `r-game-l2` (`59b2f25`): L2 Dictation Ladder (24/24 tests pass), nối bước 3 Listening Placement, E2E `e2e/m3.spec.ts` PASS 1/1 + 6 ảnh chụp (`e2e/screenshots/m3/`).
  - `r-audio-listening` (`8583912`): `render_episode.py`, `render_dictation.py`, `qa_audio.py`, 4 episode MP3 (6.30 MB) + 60 dictation MP3 (1.74 MB), tổng `public/audio` = **10.67 MB / 400 MB**, QA 4/4 PASS, `validate:data` PASS 100%.

## Các mốc
| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M0 | Nền móng: shell, design system, core (SRS, storage, scoring), assets | ✅ Hoàn tất 100% |
| M1 | Từ vựng V1–V3 + data vocab + audio vocab + Onboarding/Today | ✅ Hoàn tất 100% |
| M2 | Reading R1–R2 + 24 passages + blind-solve | ✅ Hoàn tất 100% |
| M3 | Listening L1–L2 + 32 episodes + 300 dictation + audio | ✅ Hoàn tất 100% (251/251 tests, blind-solve 97.5%, audio 10.67 MB, E2E M3 PASS) |
| M4 | Writing W1–W2 + chấm qua Claude chat (copy/dán, 0 đồng) | 🔄 Đang chạy Đợt 1 (`r-grading-core` ∥ `r-data-writing`) |
| M5 | Speaking S1–S2 + speech core | ⏳ |
| M6 | Exam X1, band, thống kê, polish, PWA, deploy | ⏳ |
| M7 | Mở rộng dữ liệu tới mức đầy đủ (liên tục) | ⏳ |

## Task theo mốc
### M3 (Hoàn tất 100%)
- ✅ r-data-listening (`d51376d`) · ✅ rv-data-listening (`cc57f4a`, 97.5%) · ✅ r-game-l1 (`5d610ad`) · ✅ r-game-l2 (`59b2f25`) · ✅ r-audio-listening (`8583912`)

### M4 (Đang chạy)
- ✅ r-grading-core (`f3accaa` – 43/43 tests) · ✅ r-data-writing (`8f1c8ca` – 60 T2 + 24 T1 + 50 cliches) · 🔄 r-chart · 🔄 r-game-w1 · ⏳ r-game-w2

## Lỗi đã biết
- 1 câu YNNG `p2_004_q05` hơi mơ hồ theo blind-solve M2 (83/84) — tinh chỉnh ở M6/M7.
- Gợi ý từ `rv-data-listening`: cân nhắc chuẩn hóa số điện thoại có dấu cách (`07741 829 360`) trong `listeningAnswer.ts`.
