# 10 · DỮ LIỆU VÀ NỘI DUNG (ưu tiên số 1)

> **Dữ liệu là ưu tiên cao nhất** (Bang, 25/11/2026). Một app đẹp với đáp án sai, audio thiếu hay câu ví dụ máy móc là app dạy sai.
> Chi tiết lỗi gốc: `docs/audit-max/04-DATA-NOI-DUNG.md` (D1–D19), `phu-luc/C-du-lieu-noi-dung.md`. Luật: `LUAT.md` C1–C6, `04-LUAT-CUNG.md` SR-30..34. Phương pháp chọn và sắp xếp nội dung: `09-PHUONG-PHAP-HOC.md`.
> Task sở hữu dữ liệu: **T3-B**. File độc quyền: `public/data/**`, `public/audio/**` (trừ `speaking/**`), `data-src/**`, `scripts/data/**`, `scripts/audio/**`, `REVIEW_LOG.md`.

## 0. Tóm tắt 10 dòng
1. Mọi item phát hành phải có `provenance` đủ trường, `review.verdict == "pass"` do model **khác hãng** với model sinh, và `rev`.
2. Không đổi ID; sửa nội dung thì tăng `rev`; item bỏ thì `deprecated:true` (+`aliasOf` nếu trùng), không xoá.
3. Nguồn thật ở `data-src/`, script ở `scripts/data/`, bản phát hành ở `public/data/` (minify); không sửa tay `public/data` khi đã có script sinh.
4. Audio: edge-tts giọng đa vùng (UK mặc định, có AU/NZ/CA/US), −16 LUFS, đỉnh ≤ −1 dBTP, im lặng đầu/cuối ≤ 80 ms, sha256 + thời lượng thật.
5. Đáp án đọc/nghe phải qua blind-solve khớp 100% (đã xong D4 cho 24 passage + 32 episode, giữ nguyên khi sửa).
6. Cổng: `npm run validate:data:release` exit 0 + soi mẫu ghi `REVIEW_LOG.md`.
7. Độ phủ band 4.0–9.0 cho mọi loại item theo bảng §5.
8. Không nội dung Cambridge/sách thương mại; nội dung tự viết hoặc nguồn mở có ghi công.
9. Ngân sách: `public/audio` ≤ 400 MB (vượt → hỏi Bang), JSON tải đầu của 1 game ≤ 400 KB nén.
10. Thứ tự việc: audio thiếu → đáp án/bẫy đúng → câu ví dụ → độ phủ band → tối ưu kích thước.

## 1. Bản đồ dữ liệu (lúc bàn giao, `public/data` = 9,6 MB, `public/audio` = 64 MB ở nhánh T3-B)

| File | Game dùng | Ghi chú chất lượng |
|---|---|---|
| `vocab/words.json` | V1, placement | 2 207 từ; câu ví dụ khuôn (D5); provenance sai (D6); CEFR suy từ zipf (D7); IPA lỗi (D19); 1 670 từ thiếu MP3 |
| `vocab/collocations.json` | V2, V1 | band 4–6 = 0 item (§5); trap kiểu Việt bịa (D8); 15 cặp trùng (D9) |
| `vocab/paraphrases.json` | V3 | decoy yếu (D10); `level` trộn với "tương đương" (lộ đáp án V3-1) |
| `vocab/error_patterns.json` | V1 `err_*` | kiểm ví dụ đúng/sai rõ ràng |
| `vocab/placement_vocab.json` | Placement | không phụ thuộc fixture test (đã gỡ ở Đợt 1) |
| `listening/episodes/*.json` + `audio/listening/` | L1 | 32 episode; đang render dở (§3); blind-solve 32/32 ✅ |
| `listening/dictation.json` + `audio/dictation/` | L2, V1 `dict_full` | 300/300 MP3 ✅; L7–10 = 0 câu (D2) |
| `reading/passages/*.json` | R1, R2, X1 | 24 passage; blind-solve 24/24 ✅ |
| `writing/task2_prompts.json`, `writing/task1/*` | W1, W2 | thiếu đề theo dạng (D15) |
| `writing/cliches.json` | W1/W2 | – |
| `speaking/part1-3.json`, `phrases.json` | S1, S2 (M5) | chỉ thêm dữ liệu 2027-Q1 (D16); **không** đụng code S1/S2 |
| `anki_vocab.json`, `ielts_4skills.json`, `ielts_strategies.json` | **không game V3 nào được đọc** (C6) | `ielts_4skills.json` có chữ "Cambridge" (D11): chuyển đi phải **hỏi Bang** |
| `manifest.json`, `*/index.json` | loader | sinh lại bằng `scripts/data/60_build_manifest.mjs` sau mỗi thay đổi |
| `tips.json`, `roadmap.json` | Hôm nay/Thống kê | kiểm không còn chữ nội bộ (D7 giao diện) |

## 2. Chuẩn một item (mọi item mới hoặc sửa)

```jsonc
{
  "id": "vocab:mitigate",            // KHÔNG đổi
  "rev": 3,                           // +1 mỗi lần sửa nội dung
  "level": 6,                         // 1–10 ↔ band (L1≈4.0, L3≈5.0, L5≈6.0, L7≈7.0, L9≈8.0, L10≈8.5+)
  "provenance": {
    "source": "authored-llm",         // | authored-human | wikipedia-ccbysa | theconversation-ccbynd | wordlist:<tên>
    "createdBy": "llm:<model>@2026-11-25",
    "license": "own",                 // | "CC BY-SA 4.0" | ...
    "attribution": "<tác giả, URL>"   // bắt buộc khi CC BY*
  },
  "review": { "by": "llm:<model KHÁC HÃNG>", "date": "2026-11-25", "verdict": "pass" },
  "audio": { "src": "audio/vocab/mitigate.mp3", "sha256": "…", "durationSec": 0.82,
             "audioProvenance": { "engine": "edge-tts", "voice": "en-GB-SoniaNeural", "license": "edge-tts (Bang chấp nhận 23/11)" } },
  "deprecated": false, "aliasOf": null
}
```
- `review.verdict` ∈ `pass | fix | reject`. Chỉ `pass` mới vào pool (C2).
- Model kiểm phải **khác hãng** với model sinh. Ví dụ: Gemini sinh thì Claude kiểm, và ngược lại. Ghi tên model thật.

## 3. Audio

| Thông số | Giá trị |
|---|---|
| Engine | edge-tts (Bang chấp nhận deploy công khai 23/11); Kokoro-82M là phương án dự phòng offline |
| Giọng | UK mặc định (`en-GB-SoniaNeural`, `en-GB-RyanNeural`); Listening episode phải trộn giọng **UK, AU, NZ, CA, US** như đề thật (đã map ở `scripts/audio/common.py`); hội thoại 2 người dùng 2 giọng khác giới |
| Tốc độ | Vocab 1.0; dictation theo level (L1–3: 0.9, L4–7: 1.0, L8–10: 1.05–1.1); episode 1.0 |
| Chuẩn hoá | −16 LUFS, true peak ≤ −1,0 dBTP, im lặng đầu/cuối ≤ 80 ms (`common.py`) |
| Định dạng | MP3 mono; vocab/dictation 48 kbps (giọng nói đủ rõ, nhẹ); episode 64 kbps; 24 kHz |
| Ghi | `sha256`, `durationSec` **đo từ file thật** (frame MP3, không tin header — bài học `audio_meta.mjs`), timestamp `start/end` từng câu cho episode |
| Cache | `data-src/audio_cache.json` theo sha256(text+voice+speed) → không render lại thứ đã có |
| Mạng chập chờn | Retry 3 lần, backoff 2/5/15 s; render theo lô 20 file; mỗi lô xong commit checkpoint |
| Ngân sách | Tổng `public/audio` ≤ 400 MB. Ước: vocab 2 207 × ~10 KB ≈ 22 MB; dictation 700 × ~25 KB ≈ 18 MB; episode 32 × ~2,5 MB ≈ 80 MB → dư. **Vượt 400 MB → dừng, hỏi Bang** |
| Kiểm | `node scripts/validate/audio_meta.mjs` + `validate:data:release`; nghe ngẫu nhiên 5 file/loại, ghi `REVIEW_LOG.md` (đúng chữ, không cắt cụt, không đọc nhầm ký hiệu như "e.g.", "%", số năm) |

**Tiền xử lý chữ trước TTS (lỗi hay gặp):**
- Số năm đọc như năm ("1990" → "nineteen ninety").
- Số điện thoại đọc từng chữ số.
- "%" thành "per cent" (kiểu UK).
- Viết tắt "e.g." → "for example", "etc." → "et cetera".
- Đơn vị "km" → "kilometres".
- Đánh vần tên (Listening Part 1) phải có ngắt giữa các chữ: dùng dấu phẩy hoặc SSML nếu engine hỗ trợ.

## 4. Thứ tự việc (theo mức ảnh hưởng tới việc học)

| # | Việc | Mã | Vì sao trước | Done khi |
|---|---|---|---|---|
| 1 | Kiểm + commit MP3 listening dở; render nốt 32/32 | D1 | L1 lọc bài thiếu audio → hiện chỉ 4–18 bài chơi được | 32/32 sha khớp, 0 `end==0` |
| 2 | Render vocab thiếu (1 670) | D1 | V1 `listen_spell` và thẻ từ cần nghe | ≥ 99% từ trong pool có MP3 |
| 3 | `audioProvenance` + `public/audio/CREDITS.md` | D12 | minh bạch nguồn | 100% file |
| 4 | Câu ví dụ tự nhiên | D5 | V1 cloze dùng câu này; câu khuôn dạy sai | grep 11 cụm khuôn = 0; soi 10% lỗi < 5% |
| 5 | Trap collocation thật, decoy paraphrase thật | D8, D10 | sai bẫy = dạy sai | soi 15% ≥ 95% thật; ≥ 90% decoy chung lemma |
| 6 | Trùng, provenance, CEFR, IPA | D9, D6, D7, D19 | độ tin cậy | validator 0 lỗi nhóm này |
| 7 | Độ phủ band (§5) | C5 | độ khó thích ứng cần nội dung mọi bậc | bảng §5 đạt |
| 8 | ExamTest 2 bộ, Writing đề, Speaking 2027-Q1 | D14–D16 | X1, W1/W2, S1/S2 | validator ngưỡng |
| 9 | Minify + `words.core.json` | D17 | V1 tải đầu 5,3 MB → < 1,5 MB | `words.core.json` < 1 MB thô |
| 10 | `validate:data:release` exit 0 → AD bật `RELEASE_GATE=1` | D3 | cổng cứng | CI chạy bản release ở master |

## 5. Độ phủ band (ngưỡng tối thiểu; nguồn `04` §3)

| Loại | Trường | Ngưỡng mỗi dải |
|---|---|---|
| Vocab | `level` 1–10 (từ `freqZipf` + danh sách thật NGSL/AWL, ghi `levelSource`) | L1–3: 400 · L4–6: 800 · L7–8: 800 · L9–10: 400 |
| Collocation | `level` | mỗi dải L1–3, L4–6, L7–8, L9–10 ≥ 120 (thêm 360 band 4–6) |
| Paraphrase | `level` 1–4 (độ xa) tách khỏi `equivalent` | mỗi bậc ≥ 60; `not_equivalent` rải đều bậc 2–4 |
| Dictation | `level` 1–10 | ≥ 50/level (MVP+), 100/level (đầy đủ); L7–10 cắt từ script episode đã QA |
| Episode | `difficulty` 1–10 | ≥ 2 mỗi level mỗi Part có thể |
| Passage | P1/P2/P3 | ≥ 6 mỗi P (đạt) |
| Task 1 / Task 2 | `difficulty` theo độ trừu tượng | mỗi dạng ≥ 3 mức |
| Topic | 25 topic | mỗi topic ≥ 40 từ, ≥ 24 collocation |

## 6. Quy trình sinh nội dung bằng LLM (không API trả phí: agent tự viết trong phiên)

1. **Đặc tả trước**: mỗi lô 50–100 item có prompt cố định ghi trong `scripts/data/prompts/<loại>.md`. Prompt gồm band mục tiêu, độ dài, cấm cụm khuôn, cấm nội dung Cambridge, chủ đề IELTS (giáo dục, môi trường, công nghệ, sức khoẻ, đô thị, văn hoá…).
2. **Sinh** bằng model A → `data-src/<loại>/draft-<lô>.json`.
3. **Kiểm** bằng model B **khác hãng**. Model B nhận item, **không** nhận lý do của A, và ghi `review` cho từng item: `pass` / `fix` (kèm bản sửa) / `reject`.
4. **Gộp** bằng script `scripts/data/50_merge.mjs`. Script giữ ID, tăng `rev`, sinh lại manifest.
5. **Soi mẫu** do người kiểm thứ ba hoặc AD (§7). Ghi `REVIEW_LOG.md`.
6. **Validator** chạy cả 2 bản `validate:data` và `validate:data:release`.

**Tiêu chí câu ví dụ tốt** (D5, PP-08):
- 12–28 từ, ngữ cảnh học thuật hoặc đời sống IELTS.
- Dùng đúng collocation thật.
- Không mở đầu bằng khuôn ("In today's world", "It is widely believed").
- Không lặp cấu trúc giữa các từ cùng lô.
- Nghĩa của từ suy ra được từ ngữ cảnh: để làm cloze, ngữ cảnh phải đủ gợi.

**Tiêu chí bẫy (trap) tốt** (D8, PP-14):
- Lỗi thật người Việt hay mắc: dịch sát, sai giới từ, sai mạo từ, động từ đi kèm sai.
- Mỗi trap có `whyVi` 1 câu.

## 7. Soi mẫu (bắt buộc, ghi `REVIEW_LOG.md`)

| Loại | Tỷ lệ soi | Ngưỡng lỗi |
|---|---|---|
| Vocab câu ví dụ | 10% (≥ 221) | < 5% |
| Collocation trap | 15% (≥ 115) | < 5% |
| Paraphrase decoy | 10% | < 10% decoy yếu |
| Dictation | 5 câu/level | 0 câu đọc sai |
| Episode | 2 episode/Part: nghe hết, so transcript và timestamp | 0 lệch > 0,5 s |
| Passage | 2 passage: giải lại câu hỏi | 0 sai |

Mẫu một dòng `REVIEW_LOG.md`: `2026-11-25 · vocab D5 lô 3 · soi 25/250 · lỗi 1 (vocab:x: collocation sai) · đã sửa rev 4 · người soi: <model>`.

## 8. Lệnh

```bash
npm run validate:data                   # dev, phải exit 0 mọi lúc
npm run validate:data:release           # cổng phát hành: --require-audio --require-blind
node scripts/data/40_compare_blind.mjs  # blind-solve
node scripts/data/60_build_manifest.mjs # sinh lại manifest sau thay đổi
python scripts/audio/render_episode.py --all
python scripts/audio/render_dictation.py --all
python scripts/audio/render_vocab.py --missing
python scripts/audio/qa_audio.py        # đo LUFS, peak, silence
du -sh public/audio                     # ≤ 400 MB
grep -ril "cambridge ielts\|official ielts" public/   # 0
```
(Tên cờ của script có thể khác; chạy `--help` trước. Nếu script chưa có cờ cần dùng thì thêm cờ vào script trong `scripts/audio`/`scripts/data`, vì đó là file độc quyền của T3-B.)

## 9. Bẫy dữ liệu đã gặp
- **Validator "xanh giả"** (`npm run validate:data` PASS nhưng bản release 2 835 lỗi) → chỉ tin bản release.
- **Header MP3 nói đủ dài nhưng file bị cắt**: đo bằng frame thật (`audio_meta.mjs` đã sửa ở T1-C).
- **`sha256:"pending"` và timestamp 0** trong JSON vẫn qua validator dev.
- **Game lọc theo trường JSON thay vì file thật** → thẻ không có audio vẫn bị chấm (đã sửa `ltrap_replay`, `dict_full`; còn `listen_spell` = FX-0).
- Script legacy ở gốc `scripts/` (`expand_anki_vocab.py`, `build_4skills_data.py`) **ghi đè** đầu vào pipeline: **không chạy** (D18).
- `scripts/__pycache__/` không commit.
- Merge master vào nhánh T3-B khi có file dở vẫn được (không chồng file). Nhưng **không** `git stash` trên đó.
