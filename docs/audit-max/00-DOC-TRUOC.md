# 00 · ĐỌC TRƯỚC · Audit toàn bộ Lexicon Arcade V3 và kế hoạch nâng lên mức tốt nhất

Thư mục: `D:\English\docs\audit-max\` · Ngày audit: **23/11/2026** · Bản được audit: `master` @ `29ecf64` (M0–M4 xong, M5 đang chạy ở worktree khác).
Phạm vi: 9 game đang chơi được (V1–V3, R1–R2, L1–L2, W1–W2), 3 chế độ chưa có (S1, S2, X1), UI/UX, animation và phản hồi, dữ liệu, flow, production.
Cách làm: đọc code + docs, chạy `tsc`, `vitest`, `vite build`, `validate:data` (cả chế độ nghiêm), chạy app thật, chụp **20 route × 4 độ rộng (360/390/820/1280)** bằng script đo tự động, chơi thử V1 và onboarding, soi mẫu dữ liệu ngẫu nhiên. **Không sửa code ở bước này.**

## 1. Hiện trạng một đoạn
Phần móng kỹ thuật **tốt hơn mức thường gặp**: TypeScript strict 0 lỗi, **377/377 test** xanh, engine game thuần có test, token màu kỷ luật, không `innerHTML`/`eval`, pipeline dữ liệu tái lập được, đáp án Reading/Listening soi mẫu đều bảo vệ được. Nhưng **các dây nối giữa các phần bị đứt** (thẻ ôn tập không có nội dung, độ khó không bao giờ đổi, tiến độ chỉ lưu ở cuối phiên), **phần lớn audio chưa có** (L1 có 4/32 bài), **bản đang chạy trên mạng vẫn là bản cũ** (49 commit chưa push), và **lớp "game"** mới ở mức bài tập có hiệu ứng: phần lớn tương tác chỉ 1–2 kênh phản hồi, không có hạt/confetti, Recap đứng yên, HUD che gần nửa màn điện thoại.

## 2. Điểm hiện tại theo mảng (/10)

| Mảng | File | Điểm | Một câu |
|---|---|---|---|
| Game luyện IELTS | `01-GAME.md` | **4,8** (9 game có) · S1/S2/X1 = 0 | R1, W2, L2 tốt nhất (~5,2–5,3); V1 có 2 lỗi P0 làm hỏng ôn tập |
| UI/UX | `02-UI-UX.md` | **5,5** | Theme tối đẹp, đọc tốt; theme sáng trượt tương phản; HUD mobile quá dày; vùng chạm 29–36 px |
| Animation & phản hồi | `03-ANIMATION-FEEDBACK.md` | **4** | Preset đúng, SFX tốt; nhưng 0 confetti, Recap tĩnh, 17/20 màn đứng yên hoàn toàn |
| Dữ liệu & nội dung | `04-DATA-NOI-DUNG.md` | **4,5** | Số lượng text đạt MVP; audio 17,8%; 63% câu ví dụ vocab khuôn đúc; validator "xanh giả" (2 835 lỗi khi bật đủ cổng) |
| Flow người dùng | `05-FLOW.md` | **4,5** | Onboarding gọn; nhưng Esc thoát không hỏi, chơi xong về Hub, streak theo giờ UTC, shell luôn "0 ngày / 0 XP" |
| Production | `06-PRODUCTION.md` | **4** | Test xanh nhưng CI không chạy test; bundle 343 KB gzip (ngân sách 250); production lỗi thời 4 ngày |
| **Tổng sản phẩm** (rubric `KIEM-THU.md` §3) | | **≈ 3,7** | Mục tiêu ĐẠT: trung bình ≥ **8,7**, không tiêu chí nào dưới ngưỡng |

## 3. Năm vấn đề lớn nhất

1. **Production lỗi thời và không có cổng chặn.** `origin/master` dừng ở 19/11, **49 commit V3 chưa push**; URL GitHub Pages vẫn hiện bản cũ "IOE ARENA". CI deploy thẳng mà không chạy test, validate hay E2E. → `06` X1, X2.
2. **Vòng ôn tập SRS bị đứt (P0).** L1, L2, W1, W2, V2, R1, R2 tạo thẻ ôn chỉ có ID, không có nội dung → V1 hiện **một từ/lỗi không liên quan** rồi chấm FSRS thẻ thật bằng câu trả lời đó; riêng V1 còn ép mọi từ mới thành thẻ giới thiệu nên **từ mới không bao giờ tới bước tự gõ**. → `01` G1, V1-1.
3. **"Listening" phần lớn là đọc, và cổng dữ liệu báo xanh giả (P0).** 28/32 bài L1 không có MP3 → app chạy "mô phỏng im lặng" + cho đọc kịch bản **kể cả ở chế độ thi**, vẫn ghi band Listening; L2 chỉ 60/300 câu có audio, không có level 7–10; 63% câu ví dụ vocab là khuôn đúc (≥ 72 câu sai ngữ pháp); `validate:data` báo PASS trong khi bật đủ cổng có 2 835 lỗi. → `04` D1–D5, `01` L1-01.
4. **Không có độ khó thích ứng, tiến độ dễ mất (P0).** Mọi game nhận cứng `level=1`; Esc thoát game ngay không hỏi; mọi game chỉ lưu ở màn Recap; "tự lưu nháp" của W1 là giả (mất bài 40 phút); streak tính theo UTC (ở VN ngày mới bắt đầu 07:00). → `01` G2, G3; `05` F1–F6.
5. **Chưa có cảm giác game thật, và Speaking chưa có chỗ luyện.** Phần lớn tương tác chỉ 1–2 kênh phản hồi, `canvas-confetti` cài rồi nhưng không game nào gọi, Recap tĩnh có số giả mặc định, HUD chiếm ~45% màn 390 px, 12 thẻ Hub giống hệt nhau, theme sáng nút chỉ 2,0–3,5:1. S1, S2, X1 vẫn là màn "sắp có" (lỗ hổng lớn nhất so với mục tiêu Speaking ≥ 7,5). → `02`, `03`, `01` §6.

## 4. Thứ tự đọc (bắt buộc đọc hết trước khi sửa)

| # | File | Nội dung |
|---|---|---|
| 0 | `BAN-GIAO-AGENT.md` | **Đọc đầu tiên**: toàn cảnh, vai, bước, luật cấm/phải, ngưỡng chất lượng, lệnh, bẫy đã biết, checklist xong |
| 1 | `00-DOC-TRUOC.md` | File này |
| 2 | `LUAT.md` | Luật có mã A/B/C/D/M/J/K/P/Q, mức **CHẶN / NẶNG / NHẸ** và cách kiểm (bảng §Z) |
| 3 | `01-GAME.md` | Điểm 12 chế độ, 5 gốc rễ chung, top lỗi từng game, độ khó, kinh tế XP, hướng "vui thật" |
| 4 | `02-UI-UX.md` | Bố cục, thứ bậc, đọc, truy cập, responsive; bảng màu đã đo |
| 5 | `03-ANIMATION-FEEDBACK.md` | Chẩn đoán juice, học gì từ Balatro/Duolingo/Stardew/Celeste/Undertale/Pokémon, **bảng 22 tương tác × ≥ 3 kênh**, hệ thẻ sống, hệ hạt, âm thanh, asset cần tải |
| 6 | `04-DATA-NOI-DUNG.md` | Độ phủ, audio, độ đúng, nguồn, band 4–9, bản quyền |
| 7 | `05-FLOW.md` | Onboarding, vòng lặp ngày, streak, tiến độ |
| 8 | `06-PRODUCTION.md` | CI, deploy, bundle, PWA, bảo mật, quản lý asset |
| 9 | `07-QUY-TRINH-KIEM-CHEO.md` | Vai trò (AD, Builder, 2 Reviewer, Fixer), cổng G0–G4, vòng đời task, mẫu review, chống gian lận, tranh chấp |
| 10 | `08-NGUON-ASSET.md` | Danh mục nguồn asset (nhân vật, icon màu, minh họa, Lottie/Rive/GIF, hạt, SFX, nhạc, font), thư viện juice, tài liệu game feel, công cụ xử lý |
| 11 | `TASKS.md` | 4 đợt × tối đa 3 làn song song, file độc quyền, lệnh kiểm, Done, cổng |
| 12 | `KIEM-THU.md` | Số đo nền, 25 kiểm tự động, rubric 10 tiêu chí có trọng số + mốc 4/7/10, chấm mù |
| 13 | `PROMPT-BAN-GIAO.md` | Prompt Điều phối + Builder; `prompt-reviewer.txt`, `prompt-fixer.txt` |

**Phụ lục** (danh sách lỗi đầy đủ, mỗi lỗi có file:dòng, mức, cách sửa, tiêu chí ĐẠT):
- `phu-luc/A-game-tu-vung-reading.md` – V1, V2, V3, R1, R2, `_shared`
- `phu-luc/B-game-listening-writing-speaking.md` – L1, L2, W1, W2, chấm Claude, Speaking, X1, audio
- `phu-luc/C-du-lieu-noi-dung.md` – 30 vấn đề dữ liệu, bảng đếm, soi mẫu từng item
- `phu-luc/D-ui-flow-production.md` – design system, bảng tương phản WCAG đầy đủ, flow so với Duolingo, production

**Bằng chứng:**
- `anh-goc/`: **mốc cố định cho chấm mù**, 100 ảnh jpg = 20 route × (390 tối/sáng, 1280 tối/sáng, 820 tối), chụp 23/11/2026. Không chụp lại.
- `anh-goc-loi/`: ảnh khoanh lỗi (390 và 1280 tối) + `report.json` + `BAO-CAO.md` của lượt đo nền: **326 lỗi CHẶN, 1 258 lỗi NẶNG** trên 120 lượt.
- `anh-hien-trang/`: 21 ảnh chọn lọc dùng trong các file 01–06 (kèm ảnh V1 250 ms sau khi trả lời sai) + `do-dac-tu-dong.json` (lượt đo đầu).

**Công cụ (của AD, không ai khác được sửa – `LUAT.md` Q4):**
- `cong-cu/audit-ui.mjs`: đo định lượng + chụp + khoanh lỗi, mã thoát 1 nếu có lỗi CHẶN.
- `cong-cu/tron-anh.mjs`: trộn ảnh gốc/mới để chấm mù.

## 4b. Bài học lấy từ đợt v5 của dự án anh em (date-planner, 23/11/2026)
Ở đó, bản trước bị chê "ít ảnh, ít icon, nhìn đơn giản, chưa ra game" dù agent **tự chấm 9,5/10**; công cụ đo khách quan đếm ra 3 846 lỗi CHẶN. Repo này có cùng triệu chứng (`PROGRESS.md` ghi "M3 100%" khi audio Listening 4/32; validator xanh giả). Đã áp dụng:
1. **Người làm không tự chấm** – báo cáo chỉ có số đo (`LUAT.md` Q1).
2. **Công cụ đo cố định có mức CHẶN/NẶNG/NHẸ + ảnh khoanh lỗi** (`audit-ui.mjs`) và **số đo nền** để so (`KIEM-THU.md` §2.1).
3. **2 reviewer độc lập, khác model, chấm mù** so với ảnh gốc; phải hơn gốc ≥ 3 điểm (`07`, `KIEM-THU.md` §3.2).
4. **Rubric có trọng số và mốc mô tả 4/7/10** thay vì cảm tính.
5. **Cổng G0–G4**: màn mẫu phải đạt trước khi nhân rộng (`07` §2).
6. **KE-HOACH liệt kê mọi chức năng** để reviewer bấm thử; **HANDOFF.md** cho tranh chấp; tối đa 3 vòng sửa.
7. **Mật độ hình ở màn khung** (M1–M7) và **icon màu thay icon nét đơn sắc** cho nội dung (D11, K9: Fluent Emoji, MIT) – đúng lời chê "ít ảnh, ít icon, icon kiểu app văn phòng". Vùng chữ học vẫn giữ sạch (Focus Arcade).
8. **Đo chất lượng asset, không chỉ đếm nguồn** (K8: kích thước gốc, số màu).
9. **Không để control gốc trình duyệt lộ ra** (D10).

Không áp dụng (khác bản chất dự án): pixel art, phóng nguyên lần, 9-slice sprite cho mọi nút, nền tối/sáng kiểu "Ngày/Đêm" cảnh vẽ, bắt buộc nhân vật trên **mọi** màn (ở đây nhân vật chỉ ở màn khung, xem §7).

## 5. Thông tin cố định

| Mục | Giá trị |
|---|---|
| Repo | `D:\English` · remote `origin` (GitHub Pages, base `/lexicon-arcade/`) |
| Stack | React 19, TypeScript strict, Tailwind 4, motion, howler, Dexie, ts-fsrs, zod, wouter, Vite 6, Vitest, Playwright |
| Người dùng | 1 người (Bang), IELTS ~6.0 → 8.0 Academic; PC Chrome/Edge + điện thoại |
| Nguyên tắc không đổi | Không API AI, không tốn tiền (`DECISIONS.md` B3); không `speechSynthesis` cho nội dung học; không nội dung Cambridge; **Focus Arcade**: arcade ở viền, vùng chữ học sạch |
| Không đụng | `src/legacy/**`, `docs/archive/**`, việc M5 ở worktree `swarm-*` |
| Thứ tự ưu tiên khi mâu thuẫn | `DECISIONS.md` > `docs/audit-max/LUAT.md` > `docs/games/*`, `docs/01…13` > `docs/00-SPEC.md` > code |
| Lệnh chạy | `npm ci` · `npx vite --port 5199` · `npm test` · `npm run validate:data` · `npm run e2e` |

## 6. Ghi chú môi trường lúc audit
- `node_modules` **trống** khi bắt đầu; đã chạy `npm ci` (327 gói, theo `package-lock.json`, không đổi file tracked).
- `PROGRESS.md` ghi "M3 ✅ 100%" nhưng audio Listening mới 4/32 – cần sửa cách nghiệm thu mốc (`phu-luc/B…` §7 X-06; cổng `validate:data:release` ở `04` D3).
- Hai worktree M5 đang mở: `swarm-r-game-s1-*`, `swarm-r-audio-speaking-*` (`LUAT.md` A3).

## 7. Quyết định của Bang trong lúc audit (23/11/2026, đã ghi `DECISIONS.md` mục D)
1. **Audio edge-tts**: chấp nhận rủi ro, được deploy công khai (`04` D12).
2. **Có nhân vật dẫn đường "Lexi"**: tải từ gói miễn phí, chỉ ở màn khung + Recap/interstitial, không bao giờ ở vùng chữ học hay Exam (`03` §5b, `LUAT.md` M3, J10, K10). Thay quy định "không mascot" cũ ở `docs/08-DESIGN-SYSTEM.md` §6.
3. **Asset thoải mái** (phi lợi nhuận): mọi asset/animation/GIF/SFX/nhạc/font/UI kit miễn phí đều dùng được, tìm ở bất kỳ đâu; chỉ cấm bản lậu gói trả phí và rip từ game thương mại (`LUAT.md` K1, K3; danh mục `08-NGUON-ASSET.md`).
