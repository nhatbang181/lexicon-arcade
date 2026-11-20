# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: TẠM DỪNG ĐÚNG HẸN 17:26 ĐỂ BANG ĐI VỀ (M0 ✅ 100% · M1 V1 ✅ 100% · Đã lưu WIP của M1 Data & V2/V3)
- 2026-11-20 16:52: Hoàn tất 100% **M0 · Nền móng** (`r-shell` `4b799f5`, `r-core` `c8d287d` 95.76% coverage, `rv-m0` PASS 0 lỗi, `r-assets` `e0f13c6` 95/95 credits + SFX sprite + 13 ảnh chụp 3 độ rộng).
- 2026-11-20 17:14: Hoàn tất 100% **V1 · Daily Run** (`r-game-v1` `6e5edcc`, 21/21 unit tests pass, 8 faces, RunMap, Boss 8 mảnh vỡ, Recap, 32 fixtures).
- 2026-11-20 17:26: Tạm dừng đúng mốc 10 phút Bang hẹn. Đã cứu hộ & lưu toàn bộ file đang làm dở của `r-m1-data-vocab` (`data-src/`, `scripts/data/`, `scripts/validate/`) và `r-game-v2v3` (`src/games/v2-collocation-forge/`, `src/games/_shared/`, `src/test/fixtures/v2v3_fixtures.ts`) vào nhánh `master` trước khi tắt worker.

## Cách chạy tiếp khi Bang mở máy lại
```text
/dieu-phoi Chạy tiếp Lexicon Arcade V3 từ PROGRESS.md (hoàn tất nốt M1 rồi chạy tiếp M2→M6). Chạy luôn.
```

## Các mốc
| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M0 | Nền móng: shell, design system, core (SRS, storage, scoring), assets | ✅ Hoàn tất 100% (116/116 tests, 95.76% cov, 160 KB gzip, 13 ảnh chụp) |
| M1 | Từ vựng V1–V3 + data vocab + Onboarding/Today | ⏸️ Tạm dừng (V1 ✅ xong; Data Vocab & V2/V3 đã lưu WIP 70%) |
| M2 | Reading R1–R2 + passages | ⏳ |
| M3 | Listening L1–L2 + episodes + audio (Kokoro UK/US + edge-tts AU/NZ/CA) | ⏳ |
| M4 | Writing W1–W2 + chấm qua Claude chat (copy/dán, 0 đồng) | ⏳ |
| M5 | Speaking S1–S2 + speech core | ⏳ |
| M6 | Exam X1, band, thống kê, polish, PWA, deploy | ⏳ |
| M7 | Mở rộng dữ liệu tới mức đầy đủ (liên tục) | ⏳ |

## Task theo mốc
Worker cập nhật bảng này: ✅ xong / 🔄 đang làm / ⏸️ tạm dừng (đã lưu WIP) / ⏳ chờ / ⚠️ lỗi.

### M0 (Hoàn tất 100%)
- ✅ r-shell (`4b799f5`) · ✅ r-core (`c8d287d`) · ✅ r-assets (`e0f13c6`) · ✅ rv-m0 (0 lỗi)

### M1 (Đang chạy)
- ✅ r-game-v1 (`6e5edcc` – 21/21 tests pass)
- ✅ r-game-v2v3 (`65a257b` – V2 + V3 24/24 tests pass)
- 🔄 r-m1-data-vocab-2 · 🔄 r-today · ⏳ rv-data-vocab · ⏳ r-audio-vocab

## Lỗi đã biết
- MCP `anki` (AnkiConnect) không kết nối được (ECONNREFUSED). Không chặn M1 vì đã có JSON xuất sẵn (`public/data/anki_vocab.json`, `public/data/ielts_4skills.json`).

## Hiệu quả học
Bang ghi sau mỗi 4 tuần dùng thật (`docs/13` §4).
