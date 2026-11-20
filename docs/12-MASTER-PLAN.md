# 12 · Master Plan: các mốc, worker, cổng (dành cho `/dieu-phoi`)

> Plan này thay thế hoàn toàn plan V2.0 (M1/M2/M3 cũ trong `docs/archive/v1-2026-11-17/PROGRESS-v2.md`).
> Dữ liệu M1 cũ (2.152 từ, `ielts_4skills.json`) **không bỏ đi**: nó là đầu vào cho `10_convert_legacy.mjs`.
>
> **Luật chạy:**
> - Tối đa **2 worker song song** (RAM 16 GB).
> - Hai worker không sửa chung file.
> - Mỗi mốc phải **chạy được** khi kết thúc.
> - Chọn model cho worker theo bảng của `/dieu-phoi`. File này không quy định model.
> - Worker không thấy hội thoại. **Brief phải trỏ tới các file docs liên quan** (cột "Đọc").

## 0. Thứ tự đọc cho mọi worker
1. `AGENTS.md`
2. `docs/00-SPEC.md`
3. File docs ghi trong cột "Đọc" của task
4. `DECISIONS.md`

## M0 · Nền móng (khung chạy được từ đầu tới cuối)

| Worker | Việc | File được sửa | Đọc | Cổng |
|---|---|---|---|---|
| `r-shell` | Cài deps (`03` §2). Tokens + font + component cơ bản (Button, ChoiceButton, AnswerInput, Pill, ProgressRing, BandMeter, Timer, Modal, Sheet, Toast, FeedbackPanel, RecapScreen, Skeleton, EmptyState, KeyHint). App shell (sidebar/tab bar). Router hash (`09` §2). Hub 12 thẻ (placeholder "Sắp có"). Settings khung. ErrorBoundary. `git mv` code cũ sang `src/legacy/` + route `#/legacy`. Route dev `/dev/components`. PWA plugin | `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/app/**`, `src/design/**`, `src/features/settings/**`, `src/legacy/**`, `src/games/registry.ts`, `e2e/**` | 03, 08, 09, 10 | build 0 lỗi; ảnh chụp 3 độ rộng (360/768/1280) của Today rỗng, Hub, Settings, `/dev/components`; legacy chạy được |
| `r-core` | `src/core/**`: storage Dexie + repos + backup + migrateLegacy; srs (ts-fsrs adapter, autoRate, faces, queue); adaptive; band (tables, estimator); planner/today; text (normalize, tokenize, align, answerMatch, spellingVariants); scoring (listeningAnswer, readingAnswer, evidence IoU); gamification (xp, streak, badges); content (zod schemas toàn bộ `04`, loaders). Thiết lập Vitest | `src/core/**`, `vitest.config.ts`, `src/test/**` | 02, 03, 04, 01 §1 | `npm test` pass; coverage dòng ≥ 85% cho `srs/`, `band/`, `text/`, `scoring/`; ≥ 40 case `listeningAnswer`; migrate legacy có test với fixture localStorage |
| `r-assets` (sau r-shell) | `fetch_assets.py`, icons game, minh hoạ, SFX sprite, CREDITS, icon PWA | `scripts/assets/**`, `public/assets/**`, `public/pwa-*` | 10 §3, 11 | `assets_credits.mjs` pass; dung lượng theo `11` §4; SFX phát được ở `/dev/components` |
| `rv-m0` | Kiểm `r-core` (phần nền, rủi ro cao): đọc diff, chạy test, soi `autoRate`, `queue`, `estimator`, `migrateLegacy` | chỉ báo lỗi | 02, 03 | Báo cáo ≤ 10 dòng, 0 lỗi nghiêm trọng còn mở |

**Song song:** `r-shell` ∥ `r-core` → `r-assets` ∥ `rv-m0`.
**Cổng M0:**
- build + test pass
- mở app → Today (rỗng, không lỗi console) → Hub → Settings → Legacy
- bundle shell ≤ 250 KB gzip
- ảnh chụp

## M1 · Từ vựng (V1, V2, V3) + Onboarding + Today

| Worker | Việc | File | Đọc | Cổng |
|---|---|---|---|---|
| `r-data-vocab` | `00_fetch_wordlists.py`, `10_convert_legacy.mjs`, `20_tag_lists_freq.py`, `30_ipa_check.py`, `50_merge.mjs`, `60_build_manifest.mjs`, `validate/run_all.mjs`. Sinh, làm giàu: 2.000 vocab, 600 collocation (120 headword), 300 paraphrase, 200 error, placement_vocab | `scripts/data/**`, `scripts/validate/**`, `data-src/vocab|collocations|paraphrases|errors|wordlists/**`, `public/data/vocab/**`, `public/data/manifest.json`, `public/data/tips.json`, `public/data/roadmap.json` | 04 §1–3, 05 | `validate:data` pass; số lượng MVP; verifier reject < 15%/batch |
| `rv-data-vocab` | Verifier theo `05` §5.1. Collocation soi 15%, còn lại 10%. Ghi `REVIEW_LOG.md` | `data-src/**/verdict_*.json`, `data-src/REVIEW_LOG.md` | 05 | 0 lỗi nghiêm trọng trong mẫu |
| `r-audio-vocab` | `scripts/audio/common.py`, `render_vocab.py`, `qa_audio.py` (phần vocab). Render audio vocab + câu ví dụ collocation | `scripts/audio/**`, `public/audio/vocab/**` | 06 | QA §5 phần vocab pass; tổng ≤ 40 MB |
| `r-game-v1` | V1 Daily Run đầy đủ | `src/games/v1-daily-run/**` | games/V1, 02 §3 | Cổng V1 §12 |
| `r-game-v2v3` | V2 Collocation Forge + V3 Paraphrase Radar | `src/games/v2-*/**`, `src/games/v3-*/**`, `src/games/_shared/` (chỉ thêm file mới) | games/V2, games/V3 | Cổng V2 §12, V3 §12 |
| `r-today` | Onboarding (`09` §3), Placement phần vocab, Today + planner wiring, Recap chung, Stats tối thiểu (streak, XP, mastery) | `src/features/onboarding|placement|today|stats/**` | 02 §6–8, 09 | E2E: onboarding → placement vocab → Today hiện kế hoạch có V1 → chơi → Today cập nhật |

**Song song:**
1. `r-data-vocab` ∥ `r-game-v1`. V1 dùng fixture nhỏ trong `src/test/fixtures` cho tới khi data merge.
2. `rv-data-vocab` ∥ `r-game-v2v3`.
3. `r-audio-vocab` ∥ `r-today`.

**Cổng M1:** E2E luồng chính Onboarding → Today → V1 → V2 → V3 → Recap → Today. Validator, QA audio. Ảnh chụp. Báo cáo cho Bang kèm ảnh.

## M2 · Reading (R1, R2)

| Worker | Việc | File | Đọc | Cổng |
|---|---|---|---|---|
| `r-data-reading` | 18 passage training + 6 reserved, theo 2 bước (passage → câu hỏi). `40_compare_blind.mjs` | `data-src/reading/**`, `public/data/reading/**` | 04 §5, 05 §4.4 | [INV-R1..R7] pass |
| `rv-data-reading` | Verifier + **blind-solve** (không thấy đáp án) + soi 10% | `data-src/reading/verdict_*`, `blind_*` | 05 §5 | Blind 100% khớp; reject < 15% |
| `r-game-r1` | `_shared/PassageView`, `Highlighter`, `QuestionNav`, `ExamFrame` + R1 (Judge + Passage mode, mọi RQType) | `src/games/r1-*/**`, `src/games/_shared/{PassageView,Highlighter,QuestionNav,ExamFrame}*`, `src/design/components/{Highlighter,QuestionNav}*` | games/R1, 08 §5 | Cổng R1 §12 |
| `r-game-r2` (sau r-game-r1) | R2 Headline Editor | `src/games/r2-*/**` | games/R2 | Cổng R2 §12 |

**Song song:** `r-data-reading` ∥ `r-game-r1` (fixture) → `rv-data-reading` ∥ `r-game-r2`. Placement thêm phần Reading (`r-game-r1` làm, sửa `src/features/placement/reading*`).

## M3 · Listening (L1, L2)
Giọng Úc/NZ/Canada dùng `edge-tts` (đã duyệt, `06` §2.1).

| Worker | Việc | File | Đọc | Cổng |
|---|---|---|---|---|
| `r-data-listening` | 24 episode training + 8 reserved (script, câu hỏi, MapSpec), 300 dictation | `data-src/listening|dictation/**`, `public/data/listening/**` | 04 §4, 05 §4.5–4.6 | [INV-L1..L4] pass |
| `rv-data-listening` | Verifier + blind-solve trên transcript + soi | `data-src/listening/verdict_*` | 05 §5 | Blind 10/10 mỗi episode |
| `r-audio-listening` | `render_episode.py`, `render_dictation.py`, QA đầy đủ (ASR vòng ngược) | `scripts/audio/**`, `public/audio/listening|dictation/**` | 06 | `06` §5 pass; [INV-L5, L6, D1] |
| `r-game-l1` | `TrackPlayer`, `Waveform`, `MapView` + L1 | `src/games/l1-*/**`, `src/design/components/{TrackPlayer,Waveform,MapView}*`, `src/core/audio/trackPlayer.ts` | games/L1 | Cổng L1 §12 |
| `r-game-l2` | L2 | `src/games/l2-*/**` | games/L2 | Cổng L2 §12 |

**Song song:**
1. `r-data-listening` ∥ `r-game-l1` (fixture audio ngắn).
2. `rv-data-listening` ∥ `r-game-l2`.
3. `r-audio-listening` (cần data đã qua verifier).

Placement thêm phần Listening.

## M4 · Writing (W1, W2) + chấm qua Claude chat (0 đồng)
Không có API và không có key. Chấm bằng gói chấm copy/dán (`07-GRADING-WITH-CLAUDE.md`, `docs/grading/*`).

| Worker | Việc | File | Đọc | Cổng |
|---|---|---|---|---|
| `r-grading-core` | `src/core/grading/**`: `packet.ts`, `parse.ts` (lấy khối json cuối), `postcheck.ts` (quote, đếm từ, band, phạt thiếu từ), `schemas.ts` (Writing/Speaking/Sprint), `bands.ts`. Import prompt `docs/grading/*.md?raw`. Component chung `GradingPanel` (copy gói, tải .md, mở Claude, ô dán, lỗi + "copy lời nhắc sửa") | `src/core/grading/**`, `src/games/_shared/GradingPanel*`, `src/test/fixtures/grading/**` | 07, docs/grading/* | Unit test parse ≥ 15 case + postcheck; GradingPanel ở `/dev/components` |
| `r-data-writing` | 60 Task 2 + 24 Task 1 (đủ 7 kind) + `cliches.json` | `data-src/writing/**`, `public/data/writing/**` | 04 §6, 05 §4.7–4.8 | [INV-W1..W4] pass; verifier |
| `r-chart` | `ChartRenderer` (bar/line/pie/table/mixed/process/map) | `src/games/_shared/ChartRenderer*`, `src/design/components/MapView*` (chỉ mở rộng) | 04 §6, 08 | Ảnh chụp 24 visual MVP, ở 360 px vẫn đọc được |
| `r-game-w1` | W1 Essay Lab + Portfolio viết + nhập "Điểm thật" | `src/games/w1-*/**`, `src/features/portfolio/**` | games/W1 | Cổng W1 §12 (dán fixture) |
| `r-game-w2` | W2 Sprints | `src/games/w2-*/**` | games/W2 | Cổng W2 §12 |

**Fixture câu trả lời Claude thật:** worker (hoặc Bang) chấm 3 bài mẫu bằng Claude chat theo `docs/grading/WRITING.md`, rồi lưu toàn bộ câu trả lời vào `src/test/fixtures/grading/`. Không tốn thêm tiền.
**Song song:**
1. `r-grading-core` ∥ `r-data-writing`.
2. `r-chart` ∥ `r-game-w1`.
3. `r-game-w2`.

## M5 · Speaking (S1, S2)

| Worker | Việc | File | Đọc | Cổng |
|---|---|---|---|---|
| `r-speech-core` | `src/core/speech/**` (recorder, vad, asr với auto-restart, metrics) + test buffer tổng hợp | `src/core/speech/**` | 03 §6, games/S1 §4.1 | Unit test pass; demo ở `/dev/speech` |
| `r-data-speaking` | Tra forecast đợt hiện tại và đợt kế (`05` §4.9); 30 topic Part 1 (có `areSample`), 40 cue card + 40 Part 3 (mỗi câu có 2–3 `followUps`), 80 phrase | `data-src/speaking/**`, `public/data/speaking/**` | 04 §7, 05 §4.9 | [INV-S1..S3]; verifier |
| `r-audio-speaking` | `render_speaking.py` (câu hỏi, follow-up, mẫu ARE, phrase, câu chuyển part) | `public/audio/speaking/**`, `scripts/audio/render_speaking.py` | 06 | QA pass |
| `r-game-s1` | S1 + gói chấm Speaking (dùng `GradingPanel` của `r-grading-core`) | `src/games/s1-*/**` | games/S1, 07, docs/grading/SPEAKING.md | Cổng S1 §12 |
| `r-game-s2` | S2 | `src/games/s2-*/**` | games/S2 | Cổng S2 §12 |

**Song song:**
1. `r-speech-core` ∥ `r-data-speaking`.
2. `r-game-s1` ∥ `r-audio-speaking`.
3. `r-game-s2`.

## M6 · Thi thử, band, polish, deploy

| Worker | Việc | File | Đọc | Cổng |
|---|---|---|---|---|
| `r-game-x1` | X1 Exam Room + 2 test MVP | `src/games/x1-*/**`, `public/data/exam/**` | games/X1 | Cổng X1 §12 |
| `r-stats-library` | Band estimator nối đủ nguồn, Thống kê đầy đủ (`09` §8), Thư viện, Portfolio speaking, Placement đầy đủ (W/S tuỳ chọn), Roadmap | `src/features/{stats,library,portfolio,placement}/**` | 02 §7–9, 09 | E2E |
| `r-polish` | Motion toàn app theo `10`, a11y (axe), empty/error/offline states, reduced motion, perf budgets, nhạc nền tuỳ chọn | `src/design/**`, các file UI (**chỉ sửa style và motion**, không đổi logic) | 08, 10, 13 | Checklist `13` pass |
| `r-pwa-deploy` | PWA (precache shell + data, runtime cache audio, nút tải offline), workflow deploy, kiểm `base` | `vite.config.ts`, `.github/workflows/**`, `src/app/providers/*` (offline) | 03, 06 §6 | HTTP 200 trên Pages; Lighthouse PWA installable; offline V1 chạy |
| `rv-final` | Đi hết luồng người dùng chính (`00` §6), kiểm ngân sách, đọc DoD từng game | báo lỗi | 00, 13 | Bảng worker / cổng / kết quả |

## M7 · Mở rộng dữ liệu tới mức "Đầy đủ" (chạy nền theo batch, sau M6)
- Mỗi lượt `/dieu-phoi` mở rộng **1 loại**, theo thứ tự ưu tiên:
  1. Listening episode
  2. Reading passage
  3. Exam test
  4. Collocation
  5. Dictation
  6. Task 2
  7. Speaking (theo đợt mới)
  8. Paraphrase
  9. Vocab
- Mỗi lượt có đủ các cổng G1–G5. **Đầu mỗi đợt Speaking** (tháng 1, 5, 9): cập nhật chủ đề mới.

## Các điểm phải DỪNG HỎI BANG
1. **Bất cứ thứ gì tốn tiền hoặc cần tài khoản trả phí** (API AI, Azure, TTS trả phí, hosting trả phí…). Mặc định là **không dùng**.
2. Xoá code legacy.
3. `public/audio` > 400 MB.
4. Đổi phạm vi so với `00-SPEC.md` (thêm hoặc bớt game).
