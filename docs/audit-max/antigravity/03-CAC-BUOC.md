# 03 · CÁC BƯỚC (SOP cho điều phối)

> Làm đúng thứ tự. Mỗi bước có **điều kiện vào** và **điều kiện ra** đo được. Lệnh viết cho Git Bash trên Windows (`/d/English`), chỗ nào cần PowerShell sẽ ghi rõ.

## 1. Mở phiên điều phối

1. Đọc `00-DOC-DAU-TIEN.md`, `01-TRANG-THAI.md`, `04-LUAT-CUNG.md`.
2. Chạy lệnh đối chiếu ở `01-TRANG-THAI.md` §5. Nếu thực tế lệch file → **thực tế thắng**: sửa `01-TRANG-THAI.md` trước khi làm gì khác.
3. Kiểm máy:
   - Không còn process cũ giữ port 5199–5240 (`01` §5). Còn thì tắt (§10).
   - Đĩa trống ≥ 10 GB. Mỗi worktree có `node_modules` khoảng 600 MB.
   - Quota từng hãng model. Áp luật quota ở `02-KE-HOACH.md` §3.
4. Chọn bước kế tiếp trong `02-KE-HOACH.md` §2. Ghi 1 dòng vào nhật ký `01` §6: "Mở phiên, chạy bước Sx".

## 2. Nối lại việc dở (worktree có commit/file chưa commit)

Áp dụng cho T2-A, T2-B, T3-B lúc bàn giao, và mọi lần agent bị dừng giữa chừng.

1. **Không** `git reset`, `git checkout -- .`, `git clean`, `git stash` hay xoá file. Phần dở là công đã làm.
2. Ghi lại hiện trạng vào brief:
   ```bash
   cd /d/English-wt/<task>
   git log --oneline master..HEAD
   git status -s
   git diff --stat
   ```
3. Giao agent mới bằng prompt "Nối lại việc dở" (`06-PROMPT-MAU.md` §4). Agent đó phải:
   1. đọc diff;
   2. chạy `tsc` và test của phần đang dở;
   3. sửa hoặc hoàn thiện, rồi commit thành các commit nhỏ;
   4. sau đó mới làm tiếp phần chưa làm.
4. Nếu diff dở hỏng nặng (không biên dịch được, không rõ mục đích): agent vẫn **không xoá**. Agent commit diff đó vào nhánh phụ `audit-max/<task>-dang-do` (tạo từ HEAD hiện tại) để giữ lại, quay nhánh chính về HEAD đã commit, rồi làm lại phần đó. Ghi vào BAO-CAO.

## 3. Tạo worktree và cấp port cho task mới

```bash
cd /d/English && git fetch -q && git status -sb       # master phải sạch và = origin/master
git worktree add -b audit-max/<task> ../English-wt/<task> master
cd /d/English-wt/<task> && npm ci
```

**Bảng port cố định** (mỗi task một cặp, không dùng lại cho task khác đang chạy):

| Task | vite (audit-ui) | Playwright (`PW_PORT`) | vite preview (perf/offline) |
|---|---|---|---|
| T2-A | 5221 | 5231 | 4181 |
| T2-B | 5222 | 5232 | 4182 |
| T2-C | 5223 | 5233 | 4183 |
| FX-0 | 5224 | 5234 | 4184 |
| T3-A | 5241 | 5251 | 4191 |
| T3-B | – | – | – |
| T3-C | 5243 | 5253 | 4193 |
| T4-A | 5261 | 5271 | 4201 |
| T4-B | 5262 | 5272 | 4202 |
| T4-C | 5263 | 5273 | 4203 |
| Reviewer task X | vite của X + 5 | PW của X + 5 | preview của X + 5 |
| Fixer task X | dùng port của builder X | | |

**Cách dùng port (ghi nguyên văn vào brief):**
- audit-ui: `npx vite --port <vite> --strictPort` (chạy nền), sau đó `BASE_URL=http://localhost:<vite> node docs/audit-max/cong-cu/audit-ui.mjs …`
- E2E: `PW_PORT=<pw> PW_CHANNEL=chrome npx playwright test <spec>`. `PW_CHANNEL=chrome` dùng Chrome cài sẵn trên máy; CI không đặt biến này.
- Không chạy `npm run e2e` trần (mặc định port 5173): nó có thể dùng lại server của worktree khác (`reuseExistingServer`) và đo nhầm code. **Bẫy này đã xảy ra thật** (`16-GHI-CHU-BAY.md` N-01).

## 4. Giao một task (builder)

**Điều kiện vào:**
- Task kế tiếp theo `02` §2.
- File độc quyền không chồng với task nào đang chạy. Kiểm bằng tay theo `TASKS.md` và ghi kết quả kiểm vào nhật ký.
- Worktree đã tạo, `npm ci` xong.

**Các bước:**
1. Chọn model theo `05-DO-KHO-TASK.md`.
2. Lấy prompt Builder ở `06-PROMPT-MAU.md` §1. Điền: mã task, worktree, port, file độc quyền (chép nguyên văn từ `TASKS.md`), việc chen thêm (`02` §4), file mảng phải đọc (10–14).
3. Giao, ghi nhật ký `01` §6: "Giao <task> cho <model>, port …".

**Trong lúc chờ:** không đọc transcript của agent con; chỉ nhận báo cáo cuối. Có thể chuẩn bị worktree và brief cho task kế tiếp.

## 5. Nhận báo cáo builder (AD tự kiểm, không tin suông)

Chỉ tốn khoảng 5 phút, không đọc lại toàn bộ code.

```bash
cd /d/English-wt/<task>
git status -s                                  # phải sạch (trừ file local đã biết)
git log --oneline master..HEAD
git diff --name-only $(git merge-base master HEAD)..HEAD   # mọi file phải nằm trong danh sách độc quyền
git diff --stat $(git merge-base master HEAD)..HEAD -- docs/audit-max/cong-cu docs/audit-max/LUAT.md docs/audit-max/KIEM-THU.md   # phải rỗng
grep -rn "test.skip\|it.skip\|describe.skip\|data-audit-ignore" $(git diff --name-only $(git merge-base master HEAD)..HEAD | grep -E '\.(ts|tsx|mjs)$') 2>/dev/null   # phải rỗng
npx tsc --noEmit -p . && npx vitest run 2>&1 | grep -E "Test Files|Tests "
```

- Có file ngoài danh sách độc quyền → **trả về builder** (A1, CHẶN), trừ khi đó là file AD đã cấp thêm và đã ghi `DECISIONS.md`.
- Báo cáo nói "xong" mà `git status` còn file dở hoặc test đỏ → trả về builder, không tốn lượt reviewer.

## 6. Review

**Đợt 2:** 1 reviewer, kiểm test + diff + logic + bấm thử chức năng. Prompt `06-PROMPT-MAU.md` §2.
**Đợt 3–4:** 2 reviewer **song song, độc lập**, khác model với builder; nếu được thì A và B cũng khác hãng nhau. Bắt buộc chấm mù trước. Prompt `06-PROMPT-MAU.md` §3.

**Tổng hợp:**
- Lấy **điểm thấp hơn** của 2 reviewer cho từng tiêu chí rubric.
- Gộp danh sách lỗi. Lỗi trùng thì lấy mức nặng hơn.
- Review không hợp lệ thì giao reviewer khác làm lại. Không hợp lệ khi: ít hơn 5 lỗi cụ thể, điểm không dẫn tên ảnh, không tự chạy lại công cụ, không chấm mù.

**Phán quyết:**
- ĐẠT: 0 CHẶN, ≤ 2 NẶNG mỗi màn, đạt ngưỡng rubric của đợt → bước 7 merge.
- TRẢ VỀ → bước 6.1.

### 6.1 Fixer
- Prompt `06-PROMPT-MAU.md` §5. Fixer là builder cũ, hoặc agent mới cùng model với builder.
- Thứ tự sửa: CHẶN → NẶNG → NHẸ.
- Sau fixer, AD tự chạy cổng của task (bước 5).
- **Qua cổng là dừng, không review vòng hai**. Ngoại lệ: task đợt 3–4 có đổi giao diện, hoặc lỗi gốc là CHẶN. Hai trường hợp này cần 1 reviewer xác nhận lại các lỗi đã sửa (review hẹp, chỉ kiểm danh sách lỗi cũ).
- Tối đa 3 vòng. Vòng 3 vẫn trượt → AD đổi hướng: tách task, nâng model lên tầng Mạnh, hoặc tự sửa phần nhỏ. Ghi `HANDOFF.md` "Tranh chấp" nếu cần.
- Một worker sai 2 lần cùng một việc → nâng model (luật `/dieu-phoi`).

## 7. Merge vào master

### 7.1 Trước khi merge
- Nhánh task phải chứa master mới nhất:
  ```bash
  cd /d/English-wt/<task> && git merge --no-edit master
  ```
- Xung đột thường gặp và cách giải:
  - `docs/audit-max/HANDOFF.md` (mọi task đều ghi vào): **ghép cả hai**, giữ mọi mục, thêm tiêu đề `## Từ <task>`. Không bỏ dòng nào.
  - `docs/audit-max/BAO-CAO.md`: ghép cả hai.
  - File code: **không được xung đột** nếu luật file độc quyền được giữ. Nếu có, nghĩa là đã có người vi phạm A1 → dừng lại, tìm nguyên nhân, ghi nhật ký.
- Sau merge: `npx tsc --noEmit -p .` + `npx vitest run` + spec E2E của task, chạy **trong worktree task**.

### 7.2 Merge
```bash
cd /d/English && git merge --no-ff audit-max/<task> -m "merge: <task> <mô tả ngắn> (đợt N audit-max)"
npx tsc --noEmit -p . && npx vitest run 2>&1 | grep -E "Test Files|Tests "
```
Commit message của điều phối kết thúc bằng dòng ghi công của model đang chạy, theo quy ước của Antigravity. Nếu repo đã có dòng `Co-Authored-By` thì giữ đúng định dạng đó.

### 7.3 Sau merge
- Gộp mục "Quyết định" trong `BAO-CAO-<task>.md` vào `DECISIONS.md`, mỗi quyết định 1 dòng: `- YYYY-MM-DD · <task> (audit-max Đợt N) · <quyết định>`.
- Commit `docs(audit-max): …`.
- Ghi nhật ký `01` §6.
- Cập nhật bảng worktree ở `01` §2.

### 7.4 Merge giữa task (chỉ T3-A, T4-C)
T3-A merge sớm `fx/`, `LiveCard`, `Mascot` để T3-C gắn hiệu ứng. T4-C merge sớm API `useCharms()`.
Điều kiện merge sớm:
- phần đó có test;
- `tsc` + `vitest` xanh;
- 1 reviewer soi diff phần đó (review hẹp).

Merge xong, nhánh T3-A hoặc T4-C tiếp tục làm phần còn lại.

## 8. Push và kiểm production

Push sau mỗi mốc ở `02` §5, hoặc sau mỗi 2 task merge. Không để master lệch `origin/master` quá 1 ngày (P2).
```bash
cd /d/English && git push origin master
gh run watch $(gh run list -L 1 --json databaseId -q '.[0].databaseId') --exit-status
curl -s https://nhatbang181.github.io/lexicon-arcade/ | grep -o '<title>[^<]*'
git rev-list --left-right --count origin/master...master     # 0 0
```
- CI đỏ → **không** push thêm. Đọc log (`gh run view <id> --log-failed`), giao fixer cho task gây lỗi, ưu tiên cao nhất.
- Sau deploy, mở production ở khung iPhone 390 (Playwright hoặc trình duyệt). Vào Hôm nay → mở 1 game → trả lời 1 câu → kiểm 0 lỗi console. Đây là smoke test production; ghi kết quả vào nhật ký.

## 9. Đóng một đợt / một cổng

1. Mọi task của đợt đã merge, master đã push, CI xanh.
2. Chạy toàn bộ trên master:
   - `KIEM-THU.md` §2;
   - `audit-ui.mjs` mọi route × 7 khung (`02` §0) × 2 theme → `docs/audit-max/anh-sau/dot-<N>/`.
3. Cập nhật `docs/audit-max/BAO-CAO.md` theo mẫu `KIEM-THU.md` §6.
4. Cập nhật `PROGRESS.md`. Chỉ ghi ✅ khi cổng đã đạt theo số đo (Q1).
5. Ghi một dòng cho Bang (≤ 8 dòng, tiếng Việt) vào nhật ký `01` §6. Nếu đang có kênh báo cho Bang thì gửi luôn. **Không dừng chờ duyệt**; chạy tiếp đợt sau.
6. Xoá các worktree đã merge và không còn dùng: `git worktree remove ../English-wt/<task>`. Giữ nhánh để tra lịch sử.

## 10. Xử lý sự cố

| Sự cố | Làm gì |
|---|---|
| Agent con chết/bị dừng giữa chừng | Bước 2 (nối lại). Tắt process còn treo (dưới) |
| Process treo port | PowerShell: `Get-CimInstance Win32_Process \| ? { $_.CommandLine -match 'English-wt\\<task>' } \| % { Stop-Process -Id $_.ProcessId -Force }` |
| Máy khởi động lại | Kiểm `git worktree list`, `git status` từng worktree; nối lại theo bước 2 |
| Hết quota một hãng | Áp luật `02` §3. Dừng ở cổng gần nhất, ghi nhật ký |
| CI đỏ sau push | Bước 8. Không deploy đè; nếu production hỏng nặng thì rollback theo `15-PRODUCTION-BO-SUNG.md` PB-02 |
| `validate:data:release` vẫn đỏ sau T3-B | Không bật `RELEASE_GATE`. Ghi lỗi còn lại theo nhóm, giao fixer T3-B |
| Audio vượt 400 MB | **DỪNG phần đó, hỏi Bang** (`04` §9) |
| Reviewer và builder bất đồng | `HANDOFF.md` "Tranh chấp". AD quyết theo `LUAT.md` + số đo, ghi `DECISIONS.md` |
| Phát hiện agent lách công cụ (Q5) | Trả về, ghi tên agent + model vào `HANDOFF.md`. Task đó lần sau dùng model khác |

## 11. Tạm dừng theo lệnh Bang

1. Dừng mọi agent con.
2. Tắt mọi process theo bảng §10: vite, playwright, python render, ffmpeg.
3. **Không commit thay agent** và không reset.
4. Ghi vào `01-TRANG-THAI.md`: mỗi worktree có bao nhiêu commit và bao nhiêu file dở, agent đang làm gì lúc dừng, việc tiếp theo khi nối lại.
