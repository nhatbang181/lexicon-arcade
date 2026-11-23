# TASKS · Chia việc cho 2–3 agent chạy song song

> Mỗi **đợt** gồm tối đa 3 task (làn A, B, C) chạy **song song**. Đợt sau chỉ bắt đầu khi **mọi task của đợt trước Done và đã merge vào `master`**.
> Danh sách file của mỗi task là **độc quyền** trong đợt đó (`LUAT.md` A1). Glob `**` = mọi file con. File không có trong danh sách nào của đợt = **không ai được sửa** trong đợt đó.
> Mã lỗi (V1-1, G1, F3, X2, D5…) tra ở các file `01…06` và `phu-luc/`.
> **Không đụng M5** (`LUAT.md` A3): `src/games/s1-*`, `src/games/s2-*`, `public/audio/speaking/**`, nhánh `swarm-*`.

## Vòng đời mỗi task (`07-QUY-TRINH-KIEM-CHEO.md` §3)
1. Ghi `docs/audit-max/KE-HOACH-<task>.md` (≤ 40 dòng, có **danh sách mọi nút/chức năng** của màn bị đụng – `LUAT.md` Q6).
2. Làm → chạy lệnh kiểm chung + lệnh riêng → mở xem ảnh khoanh lỗi → sửa tới khi 0 CHẶN, ≤ 2 NẶNG mỗi màn.
3. Ghi `docs/audit-max/BAO-CAO-<task>.md` (chỉ việc đã làm + số đo trước → sau; **không tự chấm**, `LUAT.md` Q1).
4. Reviewer: đợt 1–2 **1 reviewer** (test + diff); đợt 3–4 **2 reviewer chấm mù** (`prompt-reviewer.txt`). Trượt → `prompt-fixer.txt`, tối đa 3 vòng.
5. Cần file của task khác / không đồng ý lỗi → `docs/audit-max/HANDOFF.md`.

## Lệnh kiểm chung (mọi task phải chạy trước khi báo Done)
```
npx tsc --noEmit -p .
npm test
npm run validate:data
npm run e2e -- <spec của task>
npx vite --port 5199 --strictPort        # cửa sổ riêng
node docs/audit-max/cong-cu/audit-ui.mjs --route <route,route> --vp 390x844,820x1180,1280x800 --out docs/audit-max/anh-sau/<task>
```
`audit-ui.mjs` và `tron-anh.mjs` là công cụ của AD: **không task nào được sửa** (`LUAT.md` Q4).

---

## ĐỢT 1 · Sửa móng (P0) — 3 làn · kết thúc bằng **cổng G0** (`07` §2)

### T1-A · Kho thẻ SRS có nội dung + V1 đúng (G1, G3 phần V1, V1-1..V1-16)
- **File độc quyền:** `src/core/storage/**` (gồm `db.ts`, `repos/**`, migrate Dexie), `src/core/srs/**`, `src/games/v1-daily-run/**`, `src/test/fixtures/v1_fixtures.ts`
- **Việc:**
  1. Bảng `userItems {id, kind, front, back, noteVi, audioClip?{src,start,end}, source, createdAt}`; tăng version Dexie + hàm migrate + test migrate từ DB cũ có dữ liệu (`LUAT.md` P8).
  2. API mới: `userItemRepo.upsertWithCard(item, cardFace)` (1 transaction); `attemptRepo.saveProgress(partial)` (debounce do caller) + `attemptRepo.finalize(attemptId)`.
  3. V1: renderer `tfng_retry`, `head_retry`, `ltrap_replay`, `dict_full`, `err_user`; **bỏ mọi `?? content.X[0]`** → không tìm thấy thì bỏ node + `eventRepo.log('missing_item')`.
  4. V1-1 (intro loop), V1-3 (không ghi fixture vào DB thật), V1-4/V1-5 (distractor + vị trí có seed), V1-6 (không bịa "tuần trước"), V1-7 (checkpoint lưu thật), V1-9 (quota thẻ mới theo ngày).
- **Kiểm thử:** `npx vitest run src/core/storage src/core/srs src/games/v1-daily-run`; E2E mới `e2e/v1-srs.spec.ts`: trả lời 5 thẻ → reload → 5 review; DB rỗng → EmptyState, 0 card `source:fixture`.
- **Done khi:** mọi tiêu chí ĐẠT của G1 (phần V1), V1-1..V1-9 trong `phu-luc/A…` §2.6 đạt; `grep -rn "?? content\.[a-z]*\[0\]" src/games` = 0; `grep -l v1_fixtures dist/assets/*.js` rỗng sau build.

### T1-B · Shell, vòng lặp ngày, độ khó thích ứng (F1–F3, F5, F6, F11, F12, U2, U4, U17, U18, X5, X6, X10)
- **File độc quyền:** `src/app/**` **trừ** `src/app/screens/LegacyScreen.tsx`; `src/core/adaptive/**`; `src/core/gamification/**`; `src/features/today/**`; `src/features/onboarding/**`
- **Việc:**
  1. F1: bỏ Esc toàn cục ở `PlayScreen.tsx:22-30`; Modal "Lưu và thoát / Chơi tiếp"; tôn trọng `e.defaultPrevented`.
  2. F2/U18: shell đọc streak/XP thật (`useLiveQuery`). F3: ngày địa phương + giờ chuyển ngày 04:00 (test `TZ=Asia/Ho_Chi_Minh`).
  3. F6/G2: `src/core/adaptive/sessionLevel.ts`; PlayScreen đọc `profile.skillLevels[gameId]`, `?mode=` từ URL; truyền `level`, `mode`; nhãn "Band ≈ x.x · Luyện/Thi" (U4).
  4. F5: `?from=today&task=`; Recap nhận `nextTask` (phối hợp: Recap thuộc T3-A, ở đợt này chỉ truyền prop qua `PlayScreen` → game; nếu game chưa nhận prop thì bỏ qua).
  5. X5/X6: lazy mọi route trừ Today; route `/dev/*` chỉ khi `import.meta.env.DEV`; X10: `ErrorBoundary key={location}`.
  6. U2 nút header 44px; U17 nav dùng link; F10 onboarding 4 bước + `[15,30,45,60]`; F11 bỏ tên cứng; F12 bỏ logic M1 + Enter mở việc đầu.
- **Kiểm thử:** `npx vitest run src/core/adaptive src/core/gamification`; E2E mới `e2e/shell-flow.spec.ts` (Esc 3 trường hợp; shell = Today; Today → V1 → về `#/`).
- **Done khi:** tiêu chí ĐẠT F1, F2, F3, F6, X5 (JS ở `#/` ≤ 250 KB gzip), X6, X10 đạt; onboarding 4 bước ≤ 90 s chỉ bằng Enter.

### T1-C · Cổng production + công cụ QA (X1–X4, X7–X9, X13–X17, D3 phần script)
- **File độc quyền:** `.github/**`, `playwright.config.ts`, `vite.config.ts`, `vitest.config.ts`, `package.json`, `package-lock.json`, `index.html`, `src/main.tsx`, `.gitignore`, `src/app/screens/LegacyScreen.tsx`, `src/app/screens/legacyEntry.ts` (mới), `scripts/validate/**`, `scripts/qa/**` (mới), `e2e/a11y.spec.ts`, `e2e/motion.spec.ts`, `e2e/perf.spec.ts`, `e2e/offline.spec.ts`, `e2e/juice.spec.ts` (mới, khung). **Không** gồm `docs/audit-max/cong-cu/**` (công cụ của AD, `LUAT.md` Q4)
- **Việc:**
  1. X2: workflow `verify` (8 bước `LUAT.md` P1) + trigger `pull_request`; Node 22. X3: project `chromium` + `mobile`.
  2. X4: CSS legacy lazy qua `legacyEntry.ts`. X7: icon PWA, `lang:'vi'`, `globIgnores`, `runtimeCaching` data/audio. X8: font theo subset. X9: `registerType:'prompt'`. X13: CSP meta + description. X14: `host:'127.0.0.1'`. X15: `.gitignore` (`*.lnk`, `e2e/screenshots/`, `test-results/`), `"name":"lexicon-arcade"`. X17: vitest node env cho `src/core/**`.
  3. D3: `validate:data:release` (`--require-audio --require-blind`), kiểm sha256/thời lượng; chạy ở CI nhánh `master` **chỉ khi** biến `RELEASE_GATE=1` (bật sau T3-B).
  4. Script QA (dùng ở `KIEM-THU.md` §2): `scripts/qa/tap-targets.mjs`, `scripts/qa/contrast.mjs`, `scripts/qa/hardcoded-colors.mjs`, `scripts/qa/internal-jargon.mjs`, `scripts/qa/size-budget.mjs` (hoặc `size-limit`). Vùng chạm, chữ nhỏ, tràn ngang, thuật ngữ nội bộ, mật độ hình đã có trong `docs/audit-max/cong-cu/audit-ui.mjs` → script QA chỉ bổ sung phần công cụ này chưa đo (tương phản, màu cứng, ngân sách bundle) và chạy `audit-ui.mjs` trong CI (job riêng, không chặn deploy tới hết đợt 3).
  5. E2E khung: `a11y.spec.ts` (axe, 2 theme), `motion.spec.ts`, `perf.spec.ts`, `offline.spec.ts`; `juice.spec.ts` để `test.fixme` cho tới đợt 4.
  6. X1: khi CI xanh trên nhánh → merge → `git push origin master` (Bang đã giao quyền trong prompt; nếu agent không có quyền push thì ghi BAO-CAO và dừng ở bước này).
- **Kiểm thử:** `npx playwright test --project=chromium`; `npx vite build` không cảnh báo chunk > 500 KB (sau khi T1-B xong lazy route; nếu T1-B chưa merge thì chỉ kiểm phần của mình).
- **Done khi:** X1, X2, X3, X4, X7 đạt; production `<title>` V3; precache ≤ 1,5 MB; 5 script QA chạy được và in số liệu.

---

## ĐỢT 2 · Đúng và công bằng trong từng game (P1) — 3 làn

### T2-A · V2, V3, R1, R2 (G3, G4 phần các game này; V2-1..V2-11, V3-1..V3-8, R1-1..R1-6, R2-1..R2-7, U3, U7)
- **File độc quyền:** `src/games/v2-collocation-forge/**`, `src/games/v3-paraphrase-radar/**`, `src/games/r1-tfng-judge/**`, `src/games/r2-headline-editor/**`, `src/games/_shared/PassageView.tsx`, `src/games/_shared/ExamFrame.tsx`, `src/design/components/Highlighter.tsx`, `src/test/fixtures/v2v3_fixtures.ts`, `src/test/fixtures/r1_fixtures.ts`, `e2e/m1.spec.ts`, `e2e/m2.spec.ts`
- **Việc:** lưu từng lượt (`attemptRepo.saveProgress`), retry 0 XP; nhận `level`/`mode` từ props; producer ghi `userItemRepo.upsertWithCard` (V2 `err:l1col_*`, R1 `tfng:*`, R2 `head:*`); bỏ header/nút thoát trùng (U3); R2 hết tràn ngang (U7); Highlighter dùng pointer + bàn phím (R1-5); V3 bàn phím listbox (V3-5); bỏ side-effect trong updater (C7).
- **Kiểm thử:** `npx vitest run src/games/v2-collocation-forge src/games/v3-paraphrase-radar src/games/r1-tfng-judge src/games/r2-headline-editor`; `npx playwright test e2e/m1.spec.ts e2e/m2.spec.ts`; `node scripts/qa/tap-targets.mjs --routes /play/v2,/play/v3,/play/r1,/play/r2`
- **Done khi:** mọi lỗi P0/P1 của 4 game trong `phu-luc/A…` có ✅; 0 tràn ngang ở 360; 2 phiên liên tiếp khác item (V3 ≤ 2 trùng, R1/R2 khác passage).

### T2-B · L1, L2, chấm đáp án Listening, trình phát (L1-01..L1-22, L2-*, X-04, X-05, G3/G4 phần L)
- **File độc quyền:** `src/games/l1-trap-detector/**`, `src/games/l2-dictation-ladder/**`, `src/core/scoring/**`, `src/core/audio/**`, `src/core/content/listeningLoader.ts`, `src/core/content/dictationLoader.ts`, `src/design/components/TrackPlayer.tsx`, `src/design/components/Waveform.tsx`, `src/design/components/MapView.tsx`, `src/design/components/AnswerInput.tsx`, `src/test/fixtures/l1_fixtures.ts`, `e2e/m3.spec.ts`
- **Việc:** L1-01 lọc episode thiếu audio + cấm transcript ở Exam + 0 band từ phiên mô phỏng; chuẩn hoá đáp án L1-02..06 (≥ 12 test mới); retry/exam L1-08/09; autoplay L1-10; L2 lọc câu thiếu audio + chọn câu có seed; producer ghi `userItems` (`ltrap:*` kèm `audioClip`, `dict:*`); sửa SFX khởi tạo sau manifest (X-04).
- **Kiểm thử:** `npx vitest run src/core/scoring src/core/audio src/games/l1-trap-detector src/games/l2-dictation-ladder`; `npx playwright test e2e/m3.spec.ts`
- **Done khi:** mọi lỗi P0/P1 của L1, L2 trong `phu-luc/B…` có ✅; 381 đáp án trong data vẫn 0 tự trượt; sai Q4 L1 → V1 phát đúng đoạn bẫy (E2E chéo với T1-A).

### T2-C · W1, W2, hệ chấm Claude (W1-01..W1-15, W2-01..W2-10, G-01..G-04, §4.5 ma sát chấm)
- **File độc quyền:** `src/games/w1-essay-lab/**`, `src/games/w2-writing-sprints/**`, `src/games/_shared/GradingPanel.tsx`, `src/games/_shared/ChartRenderer.tsx`, `src/core/grading/**`, `src/core/storage/repos/essayRepo.ts`, `src/features/portfolio/**`, `src/test/fixtures/grading/**`, `e2e/m4.spec.ts`
- **Việc:** autosave thật + khôi phục (W1-01); xác nhận trước khi xoá bài (W1-02); exam tự nộp (W1-03); nút mẫu chỉ ở DEV (W1-04); chấm idempotent + chặn lệch attemptId (W1-05, G-01); lưu kết quả Claude sau Recap (W2-01); chọn đề có seed (W2-02); khoá tự chấm trước khi xem mẫu (W2-04); producer ghi `userItems`; giảm luồng chấm ≤ 6 thao tác (§4.5).
- **Kiểm thử:** `npx vitest run src/core/grading src/games/w1-essay-lab src/games/w2-writing-sprints`; `npx playwright test e2e/m4.spec.ts`; E2E mới đếm thao tác chấm.
- **Done khi:** mọi P0/P1 của W1, W2, G trong `phu-luc/B…` có ✅; `grep -c "TASK2_CLAUDE_RESPONSE" dist/assets/*.js` = 0.

---

## ĐỢT 3 · Hệ thiết kế, juice nền tảng, dữ liệu — 3 làn

### T3-A · Design system + FX + Recap (file 02 §3–§4, file 03 §5–§8, A4–A10, U12–U16, G5)
- **File độc quyền:** `src/design/**` (toàn bộ, kể cả các component đợt 2 đã sửa như Highlighter, TrackPlayer — đợt 2 đã xong nên không chồng); `src/design/fx/**` (mới), `src/design/components/LiveCard.tsx` (mới), `src/design/components/Mascot.tsx` (mới), `src/content/mascotLines.ts` (mới), `src/app/providers/**`, `public/assets/**`, `scripts/assets/**`, `public/assets/CREDITS.md`
- **Việc:**
  1. Token: theme sáng (02 §3), `--color-on-accent`, `--color-text-faint`, `--color-border-strong`, thang chữ (02 §4); thay 13 hex cứng (D1) — **chỉ trong `src/design/**`**; hex trong game ghi vào `HANDOFF.md` để đợt 4 sửa.
  2. Tải asset theo 03 §9 **và danh mục `08-NGUON-ASSET.md`** – tải nhiều, chọn cái đẹp nhất (`LUAT.md` K1) (Kenney Particle Pack, UI Audio, Digital Audio, Music Jingles; **Fluent Emoji** cho icon nội dung theo `LUAT.md` K9/D11 – 12 icon game, ~20 icon nhiệm vụ/huy hiệu/empty; font hiển thị sau kiểm glyph) → `_downloads` → duyệt → `public/assets/fx/`, `public/assets/icons/`, sprite SFX mới (≤ 400 KB). Ghi CREDITS + manifest đủ 8 trường + `kich_thuoc_goc`, `so_mau` (K2, K8). Sửa 6 dòng illustration (D13), `url_tai` soul_knight (X20).
     → **Cổng G1**: xuất contact sheet (ảnh ghép mọi asset theo nhóm, nền tối + sáng) vào `docs/audit-max/bang-asset/`, chờ AD duyệt rồi mới làm bước 4.
  3. `fx/`: `fxCanvas`, `emit`, `numberPop`, `screenPunch`, `celebrate`, `haptic`; `useMotionPref()`; `MotionConfig` + CSS reduced-motion toàn cục; Cài đặt 3 công tắc (công tắc nằm ở `src/features/settings/**` → phối hợp: T3-A export hook + key `kv`, T3-C gắn UI).
  4. `Mascot.tsx` (03 §5b): tải gói nhân vật ứng viên số 1 ở `08-NGUON-ASSET.md` §1 (đủ ≥ 6 trạng thái, nằm trong contact sheet G1), component `<Mascot state say />` gắn `data-mascot`, lời thoại `src/content/mascotLines.ts` (mới, thuộc T3-A), Recap có khung `data-mascot-ok`.
  5. `LiveCard` (03 §5); `RecapScreen` mới (03 §3 dòng 16, bỏ mặc định giả, nhận `nextTask`); `Button`/`ChoiceButton` hover/active/focus/disabled (U14); Modal/Sheet focus trap (U15); Card bấm được bằng phím (U16); `sfx.ts` hàng đợi ≤ 2 tiếng, `rate` biến thiên, lưu âm lượng (A9) – `AudioProvider` đọc/ghi qua API `profileRepo` sẵn có; đổi mặc định `sfxVolume` sang thang 0–100 trong `profileRepo.ts:43` thuộc T3-C (T3-A ghi yêu cầu vào `HANDOFF.md`).

> Lưu ý: `src/core/audio/sfx.ts` thuộc T2-B ở đợt 2; ở đợt 3 thuộc **T3-A** (thêm `src/core/audio/sfx.ts` vào danh sách độc quyền của T3-A; `trackPlayer.ts` không ai sửa ở đợt 3).
- **Kiểm thử:** `npx vitest run src/design`; `npx playwright test e2e/a11y.spec.ts e2e/motion.spec.ts`; `node scripts/qa/contrast.mjs`; `node scripts/validate/assets_credits.mjs`
- **Done khi:** axe 0 serious/critical ở 2 theme trên 6 route; reduced-motion spec pass; asset 100% có CREDITS 8 trường; SFX sprite ≤ 400 KB; **cổng G2** đạt: `#/dev/components` hiện mọi thành phần × mọi trạng thái × 2 theme (ảnh full-page 390 và 1280 + video 5 s), 2 reviewer duyệt.

### T3-B · Dữ liệu và audio (D1–D19, file 04 §3)
- **File độc quyền:** `public/data/**`, `public/audio/**` **trừ** `public/audio/speaking/**`, `data-src/**`, `scripts/data/**`, `scripts/audio/**`, `scripts/legacy/**` (mới, chỉ di chuyển sau khi Bang đồng ý), `REVIEW_LOG.md`
- **Việc:** render 28 episode + 240 dictation (D1, D2); blind-solve 18 passage + 28 episode (D4); sinh lại câu ví dụ (D5); sửa provenance (D6); `level` cho vocab/collocation + 360 collocation band 4–6 (§3); trap thật (D8); trùng (D9); decoy (D10); 400 dictation L7–10; ExamTest 2 bộ (D14); minify + tách `words.core.json` (D17); `audioProvenance` (D12).
- **Ghi chú:** làn này **độc lập hoàn toàn với code** → được phép chạy sớm từ đợt 1 nếu có agent thứ 4 rảnh. Việc LLM sinh/verify nội dung có thể giao Gemini theo `GEMINI.md`.
- **Kiểm thử:** `npm run validate:data`; `npm run validate:data:release`; soi mẫu theo 04 §6 ghi `REVIEW_LOG.md`.
- **Done khi:** `validate:data:release` exit 0; bảng 04 §3 đạt ngưỡng; bật `RELEASE_GATE=1` trong CI.

### T3-C · Hub, Hôm nay, Thống kê, Cài đặt (U5, U6, U8–U11, F7–F9, F13, F14, F17, F18, X11, X12)
- **File độc quyền:** `src/features/**` **trừ** `src/features/portfolio/**`; `src/app/screens/HubScreen.tsx`, `src/app/screens/PlaceholderScreens.tsx`, `src/app/screens/TodayScreen.tsx`; `src/core/storage/backup.ts`; `src/core/storage/repos/attemptRepo.ts`, `src/core/storage/repos/profileRepo.ts` (để `saveSession` trả `{newBadges, levelUp, streakEvent}` cho F7/F8); `src/core/gamification/**`
- **Việc:** đặt Lexi lên Hôm nay, Hub, Thống kê, Onboarding, empty state đúng trạng thái và vị trí `03` §5b; công tắc "Hiện nhân vật" + đổi tên ở Cài đặt; Hub dạng bộ sưu tập thẻ + Sheet chọn chế độ, "Sắp có" xếp cuối (U5, U11); Hôm nay "việc tiếp theo" lên đầu (U6), ăn mừng mục tiêu ngày (F9), "giữ chuỗi" 5 phút (F14), banner nhắc + `.ics` (F13); Thống kê nối badge/level (F7), toast freeze (F8); Cài đặt 3 công tắc motion + giờ nhắc + `persist()` + dung lượng (F18); `useAsyncData` + màn lỗi (X11); backup schema thật + chế độ Gộp + giữ ghi âm (X12, F18).
- **Phụ thuộc:** dùng `LiveCard`, `celebrate`, `useMotionPref` của T3-A → **làm phần dữ liệu/logic trước, gắn hiệu ứng sau khi T3-A merge** (cùng đợt, T3-A ưu tiên merge sớm phần `fx/` + `LiveCard`).
- **Kiểm thử:** `npx playwright test e2e/daily-loop.spec.ts` (mới); `node scripts/qa/tap-targets.mjs --routes /,/hub,/stats,/settings`
- **Done khi:** tiêu chí ĐẠT của 05 §5 mục 1, 3; 02 §7 cho 4 route này; `audit-ui.mjs --route today,hub,stats,library,onboarding` 0 lỗi M1, M2, M3, M5, M7, J10 (mật độ hình + nhân vật ở màn khung).

---

## ĐỢT 4 · Juice từng game + "vui thật" — 3 làn (cùng chia file như đợt 2)

| Task | File độc quyền | Việc |
|---|---|---|
| T4-A | như T2-A + `src/games/v1-daily-run/**` | Bảng 03 §3 cho V1, V2, V3, R1, R2 (≥ 3 kênh mỗi dòng); HUD mobile 03 §4 cho V1 (U1); ngã ba run + luật boss V1, đặt cược V3, con dấu R1, tít bay R2 (01 §6.3); hex cứng trong game → token |
| T4-B | như T2-B | Bảng 03 §3 cho L1, L2 (pha nghe vẫn im lặng); Debrief/Recap động; dự đoán loại đáp án được chấm (L1-07); thang leo trong phiên L2 |
| T4-C | như T2-C + `src/games/_shared/**` còn lại | Bảng 03 §3 cho W1, W2; Δ band động + confetti khi ≥ +0,5 (W1-10); combo W2 (W2-09); 3 mục tiêu nhỏ W1; **hệ Bùa** (01 §6.2) đặt ở `src/games/_shared/charms/**` + hook đọc trong 9 game qua 1 API `useCharms()` (làn A, B chỉ gọi API sau khi T4-C merge phần API — merge API trước ngày đầu tiên) |
- **Cổng G3 trước tiên:** ngày đầu đợt 4, T4-A chỉ làm **V1** (+ Recap của V1). 4 màn mẫu Hôm nay, Hub, V1, Recap V1 phải đạt rubric ≥ 9,0 từ cả 2 reviewer và hơn ảnh gốc ≥ 3 điểm chấm mù. Trượt → dừng cả đợt 4, quay lại sửa bộ thành phần (T3-A). Đạt → T4-A làm tiếp V2–R2, T4-B và T4-C bắt đầu.
- **Kiểm thử chung:** `npx playwright test e2e/juice.spec.ts` (bỏ `fixme`); profile 30 s V1 ở CPU ×4 (0 frame > 32 ms); `audit-ui.mjs` 0 CHẶN, ≤ 2 NẶNG mỗi màn; rubric `KIEM-THU.md` §3 do 2 reviewer chấm mù.
- **Done khi:** cổng **G4** (`07-QUY-TRINH-KIEM-CHEO.md` §2): mọi màn đạt ngưỡng `KIEM-THU.md` §3, `KIEM-THU.md` §2 đạt 25/25, Bang duyệt.

## ĐỢT 5 · Speaking và Thi thử (phối hợp M5/M6, không thuộc audit-max)
S2 → S1 → X1 theo `phu-luc/B…` §8 và `docs/12-MASTER-PLAN.md` M5–M6. Khi làm, áp dụng toàn bộ `LUAT.md` và bảng 03 §3 dòng 22.

## Kiểm chồng file (điều phối làm trước khi giao mỗi đợt)
So tay cột "File độc quyền" của các task cùng đợt: không file/glob nào xuất hiện ở 2 task. Sau mỗi task, `git diff --name-only master...audit-max/<task>` phải nằm gọn trong danh sách độc quyền (`07` §5 mục 2).
