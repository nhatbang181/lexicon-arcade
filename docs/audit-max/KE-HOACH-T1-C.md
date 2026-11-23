# KE-HOACH T1-C · Cổng production + công cụ QA

Nhánh `audit-max/T1-C` (worktree `D:\English-wt\T1-C`, đặt trên T1-B) · dev port 5203 (audit-ui) · E2E port 5213 qua `PW_PORT`. Không push, không merge (điều phối làm).

## Route và thành phần bị đụng
Không đổi giao diện. Đụng: `.github/workflows/deploy.yml`, `playwright.config.ts`, `vite.config.ts`, `vitest.config.ts`, `package.json`, `index.html`, `src/main.tsx`, `.gitignore`, `src/app/screens/LegacyScreen.tsx` + `legacyEntry.ts`, `scripts/validate/**`, `scripts/qa/**`, `e2e/{a11y,motion,perf,offline,juice}.spec.ts`, cộng `e2e/m1.spec.ts`, `e2e/screenshots.spec.ts` (điều phối giao thêm, bản vá ở HANDOFF #1, #2).

## Việc → mã
1. X2: workflow `verify` 8 bước (`npm ci`, `tsc`, `npm test`, `validate:data`, cài Chromium, Playwright, `build`, `size-budget`) + trigger `pull_request`, Node 22, job `deploy` `needs: verify` chỉ trên push master. Job `audit-ui` riêng, không chặn deploy. X3: project `chromium` + `mobile`, `PW_CHANNEL`, `PW_PORT`.
2. X4: `legacyEntry.ts` (CSS legacy lazy). X7: icon PWA 192/512/maskable, `lang:'vi'`, `globIgnores`, `runtimeCaching`. X8: font theo subset. X9: `registerType:'prompt'`. X13: CSP meta + description. X14: `host:'127.0.0.1'`. X15: `.gitignore`, tên `lexicon-arcade`. X17: vitest node env cho `src/core/**`.
3. D3: `validate:data:release`, kiểm sha256 + thời lượng audio; CI chỉ chạy khi `RELEASE_GATE=1` trên master.
4. 5 script `scripts/qa/`: `tap-targets`, `contrast`, `hardcoded-colors`, `internal-jargon`, `size-budget`.
5. E2E khung: `a11y` (axe, 2 theme), `motion`, `perf`, `offline`, `juice` (`test.fixme`).
6. X1: không push. Chạy tay 8 bước workflow ở máy, ghi kết quả.
7. Thêm: sửa `m1.spec.ts`, `screenshots.spec.ts` theo HANDOFF; đánh dấu đã xử lý.

## Rủi ro
- `registerType:'prompt'` cần UI toast (X9 phần `ErrorBoundary`, ngoài file của T1-C) → ghi HANDOFF.
- CSP có thể chặn Web Speech / blob audio: kiểm console trong E2E.
- X16 (chuyển `scripts/*.js`), X15 chuyển `.bat`: ngoài danh sách file của T1-C → HANDOFF.
- Thêm `@axe-core/playwright` (TASKS cho phép). Không thêm `size-limit` (dùng `size-budget.mjs`).

## Danh sách mọi nút/chức năng giữ nguyên
Không có UI mới. Giữ nguyên: `npm run dev|build|preview|test|validate:data|e2e|shots`; route `#/legacy` vẫn tải Legacy (CSS nạp lúc vào); PWA cài được, offline mở lại được; mọi spec e2e cũ (m1–m4, screenshots, shell-flow) chạy.

## Cách vào trạng thái khó
- Offline: `vite preview` bản build, mở V1, `context.setOffline(true)`, reload.
- Legacy CSS: `grep pixelated dist/assets/*.css`; mở `#/legacy` thấy CSS nạp qua chunk riêng.
- CI đỏ: kiểm cú pháp bằng `@action-validator/cli`, chạy tay từng bước.
