# PROGRESS.md – Lexicon Arcade V3 "Lộ trình 8.0"

## Trạng thái hiện tại: TẠM DỪNG DO BỂ GEMINI HẾT QUOTA (0% · reset lúc 21:11 VN) — M0 ✅ 100%, M1 ĐÃ XONG 90% & ĐÃ MERGE MASTER
- 2026-11-20 16:52: Hoàn tất **M0 · Nền móng** (`4b799f5`, `c8d287d`, `e0f13c6`, `rv-m0` PASS 0 lỗi).
- 2026-11-20 18:28: Hoàn tất & đã merge vào `master` gần như toàn bộ **M1 · Từ vựng**:
  - `r-game-v1` (`6e5edcc`): V1 Daily Run (21/21 tests pass).
  - `r-game-v2v3` (`65a257b`): V2 Collocation Forge + V3 Paraphrase Radar (24/24 tests pass).
  - `r-m1-data-vocab` (`7b587f5`): 2,207 vocab, 762 collocations, 320 paraphrases, 230 errors, 150 placement, 62 tips, roadmap, manifest.
  - `rv-data-vocab` (`aa75e72`, Claude Sonnet 5.5): CONDITIONAL_PASS (reject rate tất cả < 15%: collocations 11.8%, paraphrases 3.1%, vocab 11.4%, errors 2.9%; phát hiện 2 lỗi cần vá: `manifest.json` SHA-256 mismatch do CRLF Windows & `err:legacy_107` lặp đuôi).
  - `r-today` (`4d18e22`): Onboarding 3 bước, Placement vocab 15 câu, Today planner nối Dexie, Stats + 12 huy hiệu, Backup/Restore JSON thật, nối lazy-load V1/V2/V3 vào `registry.ts`, E2E `e2e/m1.spec.ts` PASS 100% + 12 ảnh chụp 3 độ rộng (`e2e/screenshots/m1/`).

## Cách chạy tiếp sau 21:11 (khi bể Gemini hồi quota)
```text
/dieu-phoi Chạy tiếp Lexicon Arcade V3 từ PROGRESS.md (vá 2 lỗi nhỏ M1 + render r-audio-vocab → chốt cổng M1 → chạy tiếp M2→M6). Chạy luôn.
```

## Các mốc
| Mốc | Nội dung | Trạng thái |
|---|---|---|
| M0 | Nền móng: shell, design system, core (SRS, storage, scoring), assets | ✅ Hoàn tất 100% |
| M1 | Từ vựng V1–V3 + data vocab + Onboarding/Today | ⏸️ Đạt 90% (V1–V3, Data, Today, E2E đã merge; còn vá `rv-data-vocab` + `r-audio-vocab`) |
| M2 | Reading R1–R2 + passages | ⏳ |
| M3 | Listening L1–L2 + episodes + audio (Kokoro UK/US + edge-tts AU/NZ/CA) | ⏳ |
| M4 | Writing W1–W2 + chấm qua Claude chat (copy/dán, 0 đồng) | ⏳ |
| M5 | Speaking S1–S2 + speech core | ⏳ |
| M6 | Exam X1, band, thống kê, polish, PWA, deploy | ⏳ |
| M7 | Mở rộng dữ liệu tới mức đầy đủ (liên tục) | ⏳ |

## Task theo mốc
### M0 (Hoàn tất 100%)
- ✅ r-shell (`4b799f5`) · ✅ r-core (`c8d287d`) · ✅ r-assets (`e0f13c6`) · ✅ rv-m0 (0 lỗi)

### M1 (Còn 2 task ngắn để đóng cổng M1)
- ✅ r-game-v1 (`6e5edcc`) · ✅ r-game-v2v3 (`65a257b`) · ✅ r-m1-data-vocab (`7b587f5`) · ✅ r-today (`4d18e22`) · ✅ rv-data-vocab (`aa75e72`)
- ⏳ **Vá hậu kiểm M1:** Sửa `err:legacy_107` + các mục ghi trong `data-src/REVIEW_LOG.md`, sửa `60_build_manifest.mjs`/`run_all.mjs` chuẩn hóa LF khi tính SHA-256 trên Windows, sửa path `placementData.ts` trỏ đúng `data/vocab/placement_vocab.json`.
- ⏳ **`r-audio-vocab`** (`3.8 Flash medium`): Xây `scripts/audio/{common.py,render_vocab.py,qa_audio.py}` và render audio offline `public/audio/vocab/**` (≤ 40 MB).

## Lỗi đã biết
- MCP `anki` (AnkiConnect) không kết nối được (ECONNREFUSED). Không chặn M1 vì đã có JSON xuất sẵn.
- `manifest.json` lệch SHA-256 trên Windows do Git chuyển LF → CRLF khi cherry-pick (sẽ sửa chuẩn hóa LF ở bước vá hậu kiểm M1).
