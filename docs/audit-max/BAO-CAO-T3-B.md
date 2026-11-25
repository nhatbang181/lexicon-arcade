# BÁO CÁO TASK T3-B (Dữ liệu & Audio — Lexicon Arcade V3)

> Nhánh: `audit-max/T3-B` (`D:\English-wt\T3-B`, đã merge `master` sạch) · Ngày cập nhật: 25/11/2026.

## 1. Kết quả các bước đã hoàn tất

| Bước | Mã lỗi | Kết quả đo được | Commit |
|---|---|---|---|
| B1 | D1 Listening | **32/32** MP3 listening (64 kbps, 24 kHz, mono, −16 LUFS, 50,52 MB), khớp frame MP3 & `sha256` 100%, 0 `end == 0` | `c1c3500` |
| B2 | D12 | Đủ `audioProvenance` cho 100% audio đã render (32 listening, 700 dictation, 2 207 vocab) + `public/audio/CREDITS.md` | `73f4eb3`, `c330df1`, `258741d` |
| D4 | INV-L7 | `40_compare_blind.mjs`: 320/320 (100%) → đồng bộ `provenance.qa.blindSolve: "pass"` cho 32/32 episode | `a758c99` |
| B3 | D1 Vocab, INV-V4 | Render đủ **2 207/2 207** MP3 vocab (48 kbps, −16 LUFS, 11,84 MB; giữ nguyên 537 file cũ, 0 lỗi) | `c330df1` |
| B4–B6 | D5, D6, D8, D9, D19 | D6 (`words.json` provenance 1 944 mục), D19 (IPA Anh-Anh 648 mục), D9 (15 cặp collocation trùng → `deprecated:true` + `aliasOf`), D5 (2 069/2 069 câu ví dụ mới do `claude-sonnet-5.5` kiểm chéo), D8 (732/747 bẫy L1 mới do `claude-sonnet-5.5` kiểm chéo, ghi `REVIEW_LOG.md`) | `73f4eb3`, `14e4330` |
| B6 (D10) | D10 Paraphrase | Sinh 8 lô **231/231** item ở `data-src/paraphrases/d10/out/gen_0001..0008.json` + script `scripts/data/74_d10_apply.mjs` (dry-run cơ học: 213/231 áp được, nâng tỷ lệ chung lemma lên **302/320 = 94,4%** ≥ 90%), chờ verifier khác hãng (`claude-sonnet-5.5`) kiểm chéo trước khi áp | Chặng cuối |
| B7/B8 | D2, D14 | Tạo `public/data/exam/tests.json` (`xt:set_001`, `xt:set_002`); thêm 400 câu dictation L7–10 (100/level, 12–28 từ) + render đủ **700/700** MP3 dictation (24,55 MB) | `258741d` |
| B9 | D17 | Tách `words.core.json` (**521,1 KB** minified < 1 MB) + `words.detail.json` (2 208,7 KB) qua `85_build_words_core.mjs`, giữ `words.json` song song; ghi `HANDOFF.md` để chủ loader chuyển | `2aedc55` |
| §5 Plan | Nguồn & bản quyền | Ghi `docs/audit-max/research_notes/Nghiên cứu plan game học IELTS/xac_minh.md`; 0 nguồn chưa xác minh được import | Chặng cuối |

## 2. Kiểm chứng cổng & ngân sách

- `npm run validate:data`: **PASS (exit 0)** — 100/100 file trong `public/data/manifest.json` khớp SHA-256 & số lượng; 95/95 asset credits PASS.
- `npm run validate:data:release`: giảm từ **2 835 → 841 lỗi**, 100% là `[INV-S4]=841` (`public/audio/speaking/**` thuộc M5, bị cấm đụng theo SR-05; đã ghi `HANDOFF.md`).
- Dung lượng `public/audio`: **86,91 MB** / ngưỡng dừng 400 MB (`listening` 50,52 MB · `dictation` 24,55 MB · `vocab` 11,84 MB).
- `grep` chuỗi `cambridge ielts|official ielts` trong `public/`: chỉ còn `public/data/ielts_4skills.json` legacy (giữ nguyên chờ Bang theo SR-06).
- `npx tsc --noEmit -p .`: 0 lỗi.

## 3. Hiện trạng độ phủ band & mục chuyển tiếp (`HANDOFF.md`)

- **Vocab (2 207):** đủ L1–10 (`L1:26, L2:113, L3:245, L4:295, L5:319, L6:290, L7:323, L8:272, L9:204, L10:120`).
- **Dictation (700):** đủ L1–10 (`L1–6: 50/level`, `L7–10: 100/level`).
- **Collocations (747 hoạt động + 15 deprecated):** L7:203, L8:411, L9:84, L10:49. Band 4–6 đang bị khoá bởi `CollocationItemSchema.bandTarget` (`7|8|9` trong `src/core/content/schemas.ts:170`, ngoài phạm vi file T3-B) → đã ghi `HANDOFF.md`.
- **Writing (D15):** đạt ngưỡng MVP (`60` Task 2 = 10/dạng, `24` Task 1 = 3–4/dạng, 0 lỗi validator); mở rộng lên 15/dạng & 6/dạng cần kiểm chéo khác hãng ở vòng sau.
- **Speaking (D16):** hiện có 40 thẻ `2026-Q3` (50% evergreen, hợp lệ tới 31/12/2026); bổ sung `2027-Q1` cần ghép đôi Part 3 (`INV-S1`) và audio M5 (`INV-S4`) → đã ghi `HANDOFF.md`.
