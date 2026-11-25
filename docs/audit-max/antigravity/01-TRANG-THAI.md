# 01 · TRẠNG THÁI LÚC BÀN GIAO (25/11/2026)

> Đây là ảnh chụp lúc bàn giao. Đầu mỗi phiên, điều phối **phải tự đối chiếu lại** bằng các lệnh ở §5 trước khi tin file này.
> File `docs/audit-max/DIEU-PHOI-TRANG-THAI.md` cũ giờ chỉ trỏ về đây. Mọi cập nhật tiến độ từ nay ghi vào **file này** (§6 nhật ký).

## 1. Tổng quan

| Hạng mục | Trạng thái |
|---|---|
| Đợt 1 (T1-A, T1-B, T1-C) | **XONG.** Đã merge `master`, đã push. Cổng **G0 ĐẠT** |
| `master` = `origin/master` | `dba7c3a` (+ cập nhật trạng thái mở phiên Antigravity) |
| CI | Run `45319887592`: `verify (8 bước)` ✅, `audit-ui (không chặn deploy)` ✅, `deploy` ✅ |
| Production | https://nhatbang181.github.io/lexicon-arcade/ → `<title>Lexicon Arcade V3 · Lộ trình IELTS 8.0</title>` |
| Đợt 2 | **ĐANG CHẠY (tạm dừng ở cổng vì bể Gemini còn 7% < 10%, reset `09:38` giờ máy = `2026-11-24T23:08:42Z`).** **T2-B ĐẠT và đã merge `master`** (`rv-t2-b` Argon High: 0 CHẶN, 1 NẶNG, 534/534 test, 381/381 đáp án, 3/3 E2E, 0/0/0 audit-ui 7 khung). **T2-A** đã commit xong 4 game (V2/V3/R1/R2), còn 4 file sửa dở + `anh-sau/T2-A` + chưa viết `BAO-CAO-T2-A.md`. **T2-C** chưa bắt đầu |
| T3-B (chạy sớm) | **ĐANG DỞ (tạm dừng).** Có 2 checkpoint commit + nhiều file MP3/JSON chưa commit |
| Đợt 3, 4 | Chưa bắt đầu |

## 2. Worktree và nhánh

| Worktree | Nhánh | HEAD | Commit riêng (so với master) | File chưa commit | Port đã dùng (vite / playwright) | Ghi chú |
|---|---|---|---|---|---|---|
| `D:\English` | `master` | `dba7c3a` | – | `LEXICON ARCADE.lnk` (bỏ qua) | – | Chỉ điều phối merge vào đây |
| `D:\English-wt\T1-A` | `audit-max/T1-A` | `6e47564` | đã merge | – | 5201 / 5211 | **Có thể xoá worktree** (`git worktree remove`), giữ nhánh |
| `D:\English-wt\T1-B` | `audit-max/T1-B` | `2bdb87b` | đã merge | `playwright.t1b.config.ts` (rác local) | 5202 / 5212 | Có thể xoá worktree |
| `D:\English-wt\T1-C` | `audit-max/T1-C` | `341ca75` | đã merge | – | 5203 / 5213 | Có thể xoá worktree |
| `D:\English-wt\T2-A` | `audit-max/T2-A` | `6116672` | 5 commit (merge master + V2, V3, R1, R2 đủ 4 game) | 4 file sửa dở (`m2.spec.ts`, `R1TfngJudge`, `R2HeadlineEditor`, `V2CollocationForge`) + `anh-sau/T2-A/` | 5221 / 5231 | Đang ở bước chạy kiểm & viết `BAO-CAO-T2-A.md` (tạm dừng do quota < 10%) |
| `D:\English-wt\T2-B` | `audit-max/T2-B` | `b9d2d58` | **ĐÃ MERGE `master`** (`rv-t2-b` Argon High **ĐẠT**) | `REVIEW-T2-B-A.md` (đã chép sang master) + `out/` | 5222 / 5232 | **XONG.** Có thể xoá worktree sau khi push + CI xanh; giữ nợ 1 NẶNG `listeningAnswer.ts:408,708` trong `HANDOFF.md` |
| `D:\English-wt\T2-C` | `audit-max/T2-C` | `00e6cb1` | 0 | 0 | 5223 / 5233 (đã giữ chỗ) | Chưa bắt đầu |
| `D:\English-wt\T3-B` | `audit-max/T3-B` | `aee52c4` | `577b3bf` (300/300 MP3 dictation + 6 episode), `49d70b8` (blind-solve D4: 24/24 Reading, 32/32 Listening), `aee52c4` (merge master) | 71 file: 25 MP3 `public/audio/listening` + 25 JSON episode, 11 file `scripts/data`, 2 file `public/data/vocab`, `scripts/__pycache__` (**không commit**) | – | 31 file trong `public/audio/listening`; `public/audio` = **60,6 MB** (ngưỡng hỏi Bang 400 MB). Builder dừng lúc **đo baseline `validate:data:release`** |
| `C:\Users\nhatb\.gemini\antigravity\worktrees\…\swarm-r-audio-speaking-*`, `swarm-r-game-s1-*` | `swarm-*` | – | – | – | – | **Việc M5, KHÔNG ĐỤNG** (LUAT A3) |

## 3. Việc dở cụ thể khi nối lại

### T2-A (V2, V3, R1, R2)
- Đã xong (commit): V2 engine chọn câu nhận diện khác màn xem mẫu, retry 0 XP, sprint có trần, gộp review (V2-1..V2-10, builder tự báo, **chưa review**).
- Đang dở: test V2 mới; sửa V3, R1, R2 (diff chưa commit). Chưa làm: producer `userItems` (`err:l1col_*`, `tfng:*`, `head:*`), U3, U7, R1-5 Highlighter bàn phím, V3-5 listbox, C7, `saveProgress` + `registerProgressSaver`, E2E chéo R1 → V1.
- Đã có `KE-HOACH-T2-A.md`. Chưa có `BAO-CAO-T2-A.md`.

### T2-B (L1, L2, chấm Listening)
- Đã xong (commit): kế hoạch; chuẩn hoá đáp án số điện thoại / giờ / tiền / số thứ tự (L1-02..06); trình phát không giả lập, phân biệt autoplay, dùng lại preload; SFX dựng Howl sau manifest (X-04, X-05).
- Đang dở: 2 file `src/core/audio/*` chưa commit (xem diff).
- Chưa làm: L1-01 lọc episode thiếu MP3 (kiểm file thật), cấm transcript ở Exam, 0 band từ phiên mô phỏng; L1-08/09/10; L2 lọc câu thiếu audio + seed; producer `ltrap:*` (kèm `audioClip`) và `dict:*`; `saveProgress`; script "381 đáp án 0 tự trượt"; E2E chéo L1 → V1.
- **Lưu ý phụ thuộc dữ liệu:** T3-B đang render MP3 listening. T2-B phải lọc theo **file tồn tại thật**, không theo trường JSON. Vì vậy T2-B không phải chờ T3-B.

### T2-C (W1, W2, chấm Claude)
- Chưa bắt đầu. Worktree sạch.

### T3-B (dữ liệu, audio)
- Đã xong (commit): 300/300 MP3 dictation; blind-solve D4 đủ 24/24 Reading (330/330 câu) và 32/32 Listening (320/320 câu).
- Đang dở: 25 MP3 listening + 25 JSON episode chưa commit, cần kiểm từng file (MP3 hợp lệ, thời lượng thật, khớp `start/end`, sha256) rồi commit. 11 file `scripts/data` sửa dở (xem diff, thường là script sinh/sửa câu ví dụ D5).
- Chưa làm: render vocab còn thiếu (1 670/2 207 từ), D5–D19 (xem `10-DATA.md` §4).
- `validate:data:release` lần đo cuối (trước T3-B): exit 1, **2 835 lỗi**. Builder chưa đo lại sau checkpoint.

## 4. Nợ còn treo từ Đợt 1 (đã ghi `HANDOFF.md`, cần chủ file sau xử lý)

| Nợ | Chủ xử lý | Đợt |
|---|---|---|
| `listen_spell` của V1 chưa kiểm audio (1 670/2 207 từ thiếu MP3) → có thể chấm thẻ khi người học không nghe được | T4-A (file V1) hoặc AD giao fixer nhỏ ngay đầu Đợt 2 vì đây là **lỗi sư phạm** (B2/B3) | **sớm nhất có thể** |
| HUD V1 đẩy thẻ xuống y≈356 ở 390×844 (B5) | T4-A | 4 |
| Chip `↵` 11 px trong `AnswerInput`/`FeedbackPanel` (D4 < 12 px) | `AnswerInput` = T2-B; `FeedbackPanel` = T3-A | 2 / 3 |
| Chữ "FSRS" trong `registry.ts` (D7) | T3-C (Hub) | 3 |
| `GameProps` cần prop `nextTask` cho Recap | T3-A | 3 |
| X9 toast "Có bản mới" ngoài `/play/*` | T3-A (`src/app/providers/**`) hoặc AD gán | 3 |
| X16 chuyển `scripts/*.js` legacy | **hỏi Bang** (AGENTS §6) | – |
| D3 bật `RELEASE_GATE=1` trên CI | AD, khi `validate:data:release` exit 0 | 3 |
| a11y/perf "trần nợ" trong spec (`A11Y_STRICT`, `PERF_STRICT`) | AD hạ trần sau T3-A | 3 |
| Precache chỉ chứa shell; game chưa mở lần nào thì chưa chơi được offline | Xem `15-PRODUCTION-BO-SUNG.md` PB-07 | 3 |
| `planner/today.ts` dùng `getUTCDay()` cho cuối tuần (F3 phần còn lại) | T3-C (`src/features/**`) | 3 |

## 5. Lệnh đối chiếu đầu phiên (chạy trong Git Bash)

```bash
cd /d/English && git fetch -q && git status -sb && git log --oneline -3
git rev-list --left-right --count origin/master...master        # phải 0 0
gh run list -L 3
curl -s https://nhatbang181.github.io/lexicon-arcade/ | grep -o '<title>[^<]*'
git worktree list
for t in T2-A T2-B T2-C T3-B; do (cd /d/English-wt/$t && echo "== $t $(git log --oneline master..HEAD | wc -l) commit, $(git status -s | wc -l) file dở"); done
du -sh /d/English-wt/T3-B/public/audio
```

Kiểm không còn process cũ treo port (PowerShell):
```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 5199..5240 } | Select LocalPort, OwningProcess
```

## 6. Nhật ký điều phối (mới nhất ở trên; mỗi dòng ≤ 2 câu)

- 25/11 05:16 · Antigravity (Gemini 4 Neon High) · **T2-B ĐẠT và đã merge `master`** (`rv-t2-b` Argon High: 0 CHẶN, 1 NẶNG `listeningAnswer.ts:408,708` ghi HANDOFF, 534/534 vitest, 381/381 đáp án, 3/3 E2E m3+L1→V1, 0/0/0 audit-ui 7 khung). Tạm dừng điều phối vì bể Gemini còn **7% < 10%** (reset lúc **09:38 giờ máy** = `2026-11-24T23:08:42Z`; Claude 0% tới 27/11); bước kế tiếp khi mở lại: nối `r-t2-a` chốt `BAO-CAO-T2-A` → `rv-t2-a` + bắt đầu `T2-C`.
- 25/11 · Antigravity (Gemini 4 Neon High) · Mở phiên điều phối: đối chiếu thực tế (`master` = `dba7c3a`, đĩa D trống 37 GB, audio 60,6 MB, 0 port treo, Gemini 28%, Claude 0%). Push docs lên `origin/master` và chạy S1 (nối `T2-A` + `T2-B`, song song tối đa 2 theo quota).
- 25/11 · Claude · Viết thư mục `antigravity/`. Tạm dừng T2-A, T2-B, T3-B theo lệnh Bang; đã tắt mọi server và process render.
- 25/11 · Claude · Kiểm G0: đạt (push, CI xanh, title V3). Tạo worktree T2-A/B/C; merge master vào T3-B; giao T2-A, T2-B, T3-B.
- 24/11 · Antigravity · Fixer vòng 1 T1-C xong, `rv-t1-c-2` (Gemini 4 Argon Medium) ĐẠT; merge T1-C (`5a77c1d`), gộp `DECISIONS.md`, push (`00e6cb1`).
- 24/11 · Claude · Merge T1-B + T1-A vào master (`08a1ca7`, 465/465 test). Review T1-C bằng Opus → TRẢ VỀ (sw.js ReferenceError).
- 23–24/11 · Claude · Đợt 1: builder Sonnet high, reviewer Opus high; T1-B, T1-A qua fixer vòng 1.
