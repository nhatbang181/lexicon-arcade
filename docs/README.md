# Tài liệu Lexicon Arcade V3 "Lộ trình 8.0"

## Đọc theo thứ tự
| # | File | Nội dung |
|---|---|---|
| – | [../AGENTS.md](../AGENTS.md) | Luật cho mọi agent và worker |
| 00 | [00-SPEC.md](00-SPEC.md) | Spec 1 trang: mục tiêu, 12 chế độ, non-goals, tiêu chí xong |
| 01 | [01-IELTS-EXAM-BRIEF.md](01-IELTS-EXAM-BRIEF.md) | Đề thi 2026, bảng quy đổi band, bẫy L/R, band 7 so với 8, điểm yếu người Việt |
| 02 | [02-LEARNING-DESIGN.md](02-LEARNING-DESIGN.md) | Nguyên tắc học, động lực, FSRS, độ khó, planner, band estimator, placement, lộ trình |
| 03 | [03-ARCHITECTURE.md](03-ARCHITECTURE.md) | Stack, thư mục, hợp đồng game, IndexedDB, audio/speech, migrate, ngân sách hiệu năng |
| 04 | [04-DATA-SPEC.md](04-DATA-SPEC.md) | Schema và luật bất biến [INV-*] cho mọi nội dung |
| 05 | [05-DATA-PIPELINE.md](05-DATA-PIPELINE.md) | Bản quyền, nguồn, template sinh, cổng QA G1–G5, số lượng mục tiêu |
| 06 | [06-AUDIO-PIPELINE.md](06-AUDIO-PIPELINE.md) | Kokoro TTS, giọng, render, QA audio (ASR vòng ngược), dung lượng |
| 07 | [07-GRADING-WITH-CLAUDE.md](07-GRADING-WITH-CLAUDE.md) | Chấm Writing/Speaking bằng Claude chat (copy/dán, 0 đồng): gói chấm, dán kết quả, schema, kiểm chứng |
| 08 | [08-DESIGN-SYSTEM.md](08-DESIGN-SYSTEM.md) | Định hướng thẩm mỹ, tokens, chữ, bố cục, component |
| 09 | [09-UX-FLOWS.md](09-UX-FLOWS.md) | Route, onboarding, Hôm nay, Hub, phiên, Recap, Thống kê, Cài đặt (có wireframe) |
| 10 | [10-MOTION-AND-SOUND.md](10-MOTION-AND-SOUND.md) | Thông số animation, bảng hiệu ứng, SFX, reduced motion |
| 11 | [11-ASSETS.md](11-ASSETS.md) | Nguồn asset miễn phí, license, script tải, credits |
| 12 | [12-MASTER-PLAN.md](12-MASTER-PLAN.md) | Mốc M0–M7, worker, file, cổng, điểm dừng hỏi Bang |
| 13 | [13-QA-AND-POLISH.md](13-QA-AND-POLISH.md) | Definition of Done, checklist polish, kiểm thử dữ liệu và hiệu quả học |

## Prompt chấm bài (`grading/`)
| File | Dùng cho |
|---|---|
| [grading/README.md](grading/README.md) | Hướng dẫn Bang chấm bài qua Claude |
| [grading/WRITING.md](grading/WRITING.md) | Writing Task 1/Task 2 (W1) |
| [grading/SPEAKING.md](grading/SPEAKING.md) | Speaking mock (S1) |
| [grading/SPRINTS.md](grading/SPRINTS.md) | Gói gộp W2/S2 |

## Tài liệu từng game (`games/`)
| Mã | File | Kỹ năng |
|---|---|---|
| V1 | [V1-DAILY-RUN.md](games/V1-DAILY-RUN.md) | Từ vựng: ôn SRS hằng ngày |
| V2 | [V2-COLLOCATION-FORGE.md](games/V2-COLLOCATION-FORGE.md) | Từ vựng: collocation, lỗi kiểu Việt |
| V3 | [V3-PARAPHRASE-RADAR.md](games/V3-PARAPHRASE-RADAR.md) | Từ vựng → Reading/Listening: paraphrase |
| L1 | [L1-TRAP-DETECTOR.md](games/L1-TRAP-DETECTOR.md) | Listening: đúng format, bẫy |
| L2 | [L2-DICTATION-LADDER.md](games/L2-DICTATION-LADDER.md) | Listening: chép chính tả, nối âm, âm cuối |
| R1 | [R1-TFNG-JUDGE.md](games/R1-TFNG-JUDGE.md) | Reading: TFNG/YNNG có bằng chứng + Passage mode |
| R2 | [R2-HEADLINE-EDITOR.md](games/R2-HEADLINE-EDITOR.md) | Reading: Matching Headings |
| W1 | [W1-ESSAY-LAB.md](games/W1-ESSAY-LAB.md) | Writing: viết, Claude chấm (copy/dán), sửa, chấm lại |
| W2 | [W2-WRITING-SPRINTS.md](games/W2-WRITING-SPRINTS.md) | Writing: overview và lập ý nhanh |
| S1 | [S1-MOCK-EXAMINER.md](games/S1-MOCK-EXAMINER.md) | Speaking: thi thử, metrics, chấm qua Claude |
| S2 | [S2-THREE-SECOND-RULE.md](games/S2-THREE-SECOND-RULE.md) | Speaking: phản xạ, khung ARE |
| X1 | [X1-EXAM-ROOM.md](games/X1-EXAM-ROOM.md) | Thi thử L/R trên máy |

## Lưu trữ
- [archive/v1-2026-11-17/](archive/v1-2026-11-17/): spec và plan V1/V2 cũ (RPG, Survivors, IOE Arena, Arcade 4 kỹ năng). Chỉ để tham khảo.
