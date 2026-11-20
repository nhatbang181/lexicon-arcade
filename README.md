# 🎯 Lexicon Arcade V3 "Lộ trình 8.0"

App học **IELTS Academic** dạng game, chạy trên trình duyệt, giúp đi từ khoảng **6.0 lên 8.0**. Thiết kế dựa trên:
- **Đề thi thật năm 2026:** thi trên máy, format không đổi.
- **Khoa học học tập:** tự gợi nhớ, giãn cách FSRS, sản xuất ngôn ngữ, phản hồi có bằng chứng.
- **Điểm yếu điển hình của người Việt.**

> ⚠️ V3 đang ở giai đoạn **tài liệu xong, chuẩn bị xây**. Code hiện tại trong `src/` là bản V1/V2 cũ, sẽ được chuyển vào `src/legacy/` ở mốc M0.

## 12 chế độ
| | Từ vựng | Listening | Reading | Writing | Speaking | Thi thử |
|---|---|---|---|---|---|---|
| Game | **V1** Daily Run · **V2** Collocation Forge · **V3** Paraphrase Radar | **L1** Trap Detector · **L2** Dictation Ladder | **R1** TFNG Judge · **R2** Headline Editor | **W1** Essay Lab · **W2** Writing Sprints | **S1** Mock Examiner · **S2** 3-Second Rule | **X1** Exam Room |

Chi tiết xem [docs/00-SPEC.md](docs/00-SPEC.md) và [docs/games/](docs/games/).

## Tài liệu
- Mục lục và thứ tự đọc: [docs/README.md](docs/README.md)
- Luật cho agent: [AGENTS.md](AGENTS.md)
- Kế hoạch các mốc: [docs/12-MASTER-PLAN.md](docs/12-MASTER-PLAN.md)
- Tiến độ: [PROGRESS.md](PROGRESS.md)
- Quyết định: [DECISIONS.md](DECISIONS.md)

## Chạy
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build production (base /lexicon-arcade/)
```
Hoặc bấm đúp `CHOI_GAME_TIENG_ANH.bat`.

## Xây tiếp bằng Antigravity
```
/dieu-phoi Chạy Lexicon Arcade V3 theo docs/12-MASTER-PLAN.md, bắt đầu từ M0. Đọc AGENTS.md trước. Chế độ cả sản phẩm.
```
