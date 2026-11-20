# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: M0 ✅ 100% · M1 ✅ 100% (PASS MỌI CỔNG) -> ĐANG CHẠY M2 · READING (Đợt 1: r-data-reading ∥ r-game-r1)
- 2026-11-20 16:52: Hoàn tất **M0 · Nền móng** (`4b799f5`, `c8d287d`, `e0f13c6`, `rv-m0` PASS 0 lỗi).
- 2026-11-20 21:48: Hoàn tất 100% **M1 · Từ vựng (V1–V3) + Onboarding + Today + Audio Vocab**:
  - `r-game-v1` (`6e5edcc`), `r-game-v2v3` (`65a257b`), `r-m1-data-vocab` (`7b587f5`), `rv-data-vocab` (`aa75e72`, Claude Sonnet 5.5), `r-today` (`4d18e22`), `r-m1-fix` (`de13f7e` – `validate:data` exit 0, `npm test` 161/161 pass, `npm run build` 0 lỗi), `r-audio-vocab` (`3eb5abc` + `3db3e29` – 537 MP3 ưu tiên, 2.63 MB, QA 100% pass).

## Các mốc
| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M0 | Nền móng: shell, design system, core (SRS, storage, scoring), assets | ✅ Hoàn tất 100% |
| M1 | Từ vựng V1–V3 + data vocab + audio vocab + Onboarding/Today | ✅ Hoàn tất 100% (161/161 tests, `validate:data` PASS, 537 MP3 = 2.63 MB, 12 ảnh M1) |
| M2 | Reading R1–R2 + passages | 🔄 Đang chạy Đợt 1 (`r-data-reading` ∥ `r-game-r1`) |
| M3 | Listening L1–L2 + episodes + audio (Kokoro UK/US + edge-tts AU/NZ/CA) | ⏳ |
| M4 | Writing W1–W2 + chấm qua Claude chat (copy/dán, 0 đồng) | ⏳ |
| M5 | Speaking S1–S2 + speech core | ⏳ |
| M6 | Exam X1, band, thống kê, polish, PWA, deploy | ⏳ |
| M7 | Mở rộng dữ liệu tới mức đầy đủ (liên tục) | ⏳ |

## Task theo mốc
### M0 (Hoàn tất 100%)
- ✅ r-shell (`4b799f5`) · ✅ r-core (`c8d287d`) · ✅ r-assets (`e0f13c6`) · ✅ rv-m0 (0 lỗi)

### M1 (Hoàn tất 100%)
- ✅ r-game-v1 (`6e5edcc`) · ✅ r-game-v2v3 (`65a257b`) · ✅ r-m1-data-vocab (`7b587f5`) · ✅ rv-data-vocab (`aa75e72`) · ✅ r-today (`4d18e22`) · ✅ r-m1-fix (`de13f7e`) · ✅ r-audio-vocab (`3db3e29`)

### M2 (Đang chạy)
- 🔄 r-data-reading · 🔄 r-game-r1 · ⏳ rv-data-reading (`claude-sonnet-5-5-medium`) · ⏳ r-game-r2

## Lỗi đã biết
- MCP `anki` (AnkiConnect) không kết nối được (ECONNREFUSED). Không ảnh hưởng tiến độ.
