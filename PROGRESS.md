# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: ĐANG CHẠY M0 (r-shell ∥ r-core)
- 2026-11-20: Hoàn tất bộ tài liệu V3 (`docs/00…13`, `docs/games/*` × 12, `AGENTS.md`). Docs V1/V2 đã chuyển vào archive.
- Plan V2.0 cũ (M1 data / M2 4 game / M3 hub 12 game) **đã bị thay thế** bởi `docs/12-MASTER-PLAN.md`.
  - Data M1 cũ (2.152 từ + `ielts_4skills.json`) vẫn được dùng làm **đầu vào** chuyển đổi ở M1 mới.

## Cách chạy tiếp (gõ trong Antigravity)
```
/dieu-phoi Chạy Lexicon Arcade V3 theo docs/12-MASTER-PLAN.md, bắt đầu từ M0. Đọc AGENTS.md trước. Chế độ cả sản phẩm.
```

## Các mốc
| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M0 | Nền móng: shell, design system, core (SRS, storage, scoring), assets | ⏳ chưa bắt đầu |
| M1 | Từ vựng V1–V3 + data vocab + Onboarding/Today | ⏳ |
| M2 | Reading R1–R2 + passages | ⏳ |
| M3 | Listening L1–L2 + episodes + audio (Kokoro UK/US + edge-tts AU/NZ/CA) | ⏳ |
| M4 | Writing W1–W2 + chấm qua Claude chat (copy/dán, 0 đồng) | ⏳ |
| M5 | Speaking S1–S2 + speech core | ⏳ |
| M6 | Exam X1, band, thống kê, polish, PWA, deploy | ⏳ |
| M7 | Mở rộng dữ liệu tới mức đầy đủ (liên tục) | ⏳ |

## Task theo mốc
Worker cập nhật bảng này: ✅ xong / 🔄 đang làm / ⏳ chờ / ⚠️ lỗi.

### M0
- 🔄 r-shell · 🔄 r-core · ⏳ r-assets · ⏳ rv-m0

## Lỗi đã biết
- MCP `anki` (AnkiConnect) không kết nối được (ECONNREFUSED). Không chặn M1 vì đã có JSON xuất sẵn.

## Hiệu quả học
Bang ghi sau mỗi 4 tuần dùng thật (`docs/13` §4).
