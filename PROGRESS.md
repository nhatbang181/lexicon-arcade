# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: M0 HOÀN TẤT 100% (PASS MỌI CỔNG) -> ĐANG CHẠY M1 ĐỢT 1 (r-m1-data-vocab ∥ r-game-v1)
- 2026-11-20: Hoàn tất M0 (`r-shell` `4b799f5`, `r-core` `c8d287d`, `rv-m0` PASS 0 lỗi, `r-assets` `e0f13c6`).

## Các mốc
| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M0 | Nền móng: shell, design system, core (SRS, storage, scoring), assets | ✅ Hoàn tất (116/116 tests, 95.76% cov, 160 KB gzip, 13 ảnh chụp) |
| M1 | Từ vựng V1–V3 + data vocab + Onboarding/Today | 🔄 Đang chạy Đợt 1 (`r-m1-data-vocab` ∥ `r-game-v1`) |
| M2 | Reading R1–R2 + passages | ⏳ |
| M3 | Listening L1–L2 + episodes + audio (Kokoro UK/US + edge-tts AU/NZ/CA) | ⏳ |
| M4 | Writing W1–W2 + chấm qua Claude chat (copy/dán, 0 đồng) | ⏳ |
| M5 | Speaking S1–S2 + speech core | ⏳ |
| M6 | Exam X1, band, thống kê, polish, PWA, deploy | ⏳ |
| M7 | Mở rộng dữ liệu tới mức đầy đủ (liên tục) | ⏳ |

## Task theo mốc
Worker cập nhật bảng này: ✅ xong / 🔄 đang làm / ⏳ chờ / ⚠️ lỗi.

### M0 (Hoàn tất)
- ✅ r-shell (`4b799f5`) · ✅ r-core (`c8d287d`) · ✅ r-assets (`e0f13c6`) · ✅ rv-m0 (0 lỗi)

### M1
- 🔄 r-m1-data-vocab · ⏳ rv-data-vocab · ⏳ r-audio-vocab · 🔄 r-game-v1 · ⏳ r-game-v2v3 · ⏳ r-today

## Lỗi đã biết
- MCP `anki` (AnkiConnect) không kết nối được (ECONNREFUSED). Không chặn M1 vì đã có JSON xuất sẵn (`public/data/anki_vocab.json`, `public/data/ielts_4skills.json`).

## Hiệu quả học
Bang ghi sau mỗi 4 tuần dùng thật (`docs/13` §4).
