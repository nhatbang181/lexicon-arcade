# REVIEW T3-B (rv-data-d5d8, Claude Sonnet 5.5) — 2026-11-25
**Phán quyết: ĐẠT**
- `validate:data`: exit 0 (manifest 100/100).
- `validate:data:release`: chỉ còn `[INV-S4]=841` (speaking M5), không lỗi mới.
- Phạm vi: `git diff --name-only <merge-base>..HEAD` chỉ gồm docs/audit-max, data-src/**, public/data, public/audio (không speaking), scripts/data, scripts/audio, REVIEW_LOG.md → 0 sửa `src/**`, `scripts/validate/**`, `public/audio/speaking/**`, `LUAT.md`.
- grep "cambridge ielts|official ielts" trong public/: chỉ `public/data/ielts_4skills.json` (legacy).
- `public/audio` = 86,91 MB (< 400 MB).
- D5 2.069/2.069, D8 732/747, D10 213/231 áp sau kiểm chéo; reject còn lại ghi ở `data-src/*/rejects.json`.
- Lưu ý: collocations band 4–6 chưa phủ do schema `bandTarget` 7|8|9 (đã ghi HANDOFF).
