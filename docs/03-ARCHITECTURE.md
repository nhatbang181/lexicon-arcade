# 03 · Kiến trúc kỹ thuật

## 1. Nguyên tắc
- **App tĩnh, chạy hoàn toàn trên trình duyệt.** Deploy lên GitHub Pages (`base: '/lexicon-arcade/'` ở production, đã có trong `vite.config.ts`).
- **Không có server riêng.**
  - Dữ liệu người học nằm trong **IndexedDB**.
  - Nội dung học là **JSON và audio tĩnh** trong `public/`.
- **Logic thuần nằm tách khỏi UI** (`src/core/**`, `src/games/*/engine.ts`).
  - Không import React.
  - Có unit test bằng Vitest.
- **Mỗi game là một module lazy-load.** Không game nào import trực tiếp game khác. Chỉ dùng chung qua `src/core` và `src/design`.
- **App không gọi API AI nào và không có chi phí vận hành.** Chấm Writing/Speaking bằng cách copy và dán qua Claude chat (`07-GRADING-WITH-CLAUDE.md`).

## 2. Stack (giữ cái đang có, thêm tối thiểu)

| Mục đích | Thư viện | Ghi chú |
|---|---|---|
| UI | React 19, TypeScript 5.7, Vite 6, Tailwind 4 | Đã có |
| Icon | `lucide-react` | Đã có |
| Animation | `motion` (motion.dev, MIT) | Import `motion/react` |
| Định tuyến | `wouter` + `wouter/use-hash-location` | Hash router chạy ổn trên GitHub Pages |
| State UI | `zustand` | State tạm của phiên. State bền thì lưu IndexedDB |
| Lưu trữ | `dexie` + `dexie-react-hooks` | IndexedDB |
| SRS | `ts-fsrs` | Xem `02` §3 |
| Schema | `zod` | Dùng chung cho validator dữ liệu, parse kết quả chấm dán vào và runtime dev check |
| Âm thanh UI | `howler` | SFX và nhạc nền. Audio bài nghe dùng `HTMLAudioElement` qua player riêng |
| Biểu đồ Task 1 | `d3-scale`, `d3-shape` | Tự vẽ SVG theo phong cách đề thi (đen trắng, gọn) |
| Confetti | `canvas-confetti` | Đã có. Chỉ dùng ở mốc lớn |
| Font | `@fontsource/be-vietnam-pro`, `@fontsource/source-serif-4`, `@fontsource/jetbrains-mono` | Tự host, chạy offline |
| PWA | `vite-plugin-pwa` | Cache shell, data, audio |
| Test | `vitest`, `@testing-library/react`, `jsdom`, `fake-indexeddb` | |
| E2E và ảnh chụp | `@playwright/test` | Dùng cho cổng "ảnh chụp ở 3 độ rộng" |
| TTS offline (script) | Kokoro-82M (Python, Apache-2.0) | Xem `06-AUDIO-PIPELINE.md` |

Thêm script vào `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"validate:data": "node scripts/validate/run_all.mjs",
"e2e": "playwright test",
"shots": "playwright test e2e/screenshots.spec.ts"
```
Chú ý: script cũ `scripts/validate_all_data.js` sẽ được thay bằng `scripts/validate/run_all.mjs` (dùng zod schema từ `src/core/content/schemas.ts` qua `tsx`, hoặc build schema ra JSON Schema). Worker tự chọn một cách, ghi vào DECISIONS.

## 3. Cấu trúc thư mục đích
```
src/
  main.tsx
  app/
    App.tsx                # shell: layout, nav, router, providers
    routes.tsx             # bảng route (xem 09-UX-FLOWS §2)
    providers/             # AudioProvider, ProfileProvider, ThemeProvider
  core/
    srs/                   # fsrsAdapter.ts, autoRate.ts, faces.ts, queue.ts (+ .test.ts)
    adaptive/difficulty.ts
    band/                  # tables.ts, estimator.ts
    planner/today.ts
    text/                  # normalize.ts, tokenize.ts, align.ts (word-level Levenshtein), answerMatch.ts
    scoring/               # listeningAnswer.ts (luật chấm IELTS), readingAnswer.ts, evidence.ts (IoU)
    audio/                 # sfx.ts (howler), trackPlayer.ts, waveform.ts
    speech/                # recorder.ts (MediaRecorder), vad.ts (AnalyserNode RMS), asr.ts (Web Speech), metrics.ts
    grading/               # packet.ts (tạo gói chấm), parse.ts (đọc kết quả dán), postcheck.ts, schemas.ts (+ v1, v2…), bands.ts; prompt import từ docs/grading/*.md?raw
    storage/               # db.ts (Dexie), repos/*.ts, backup.ts, migrateLegacy.ts
    content/               # schemas.ts (zod), loaders.ts, manifest.ts
    gamification/          # xp.ts, streak.ts, badges.ts
  design/
    tokens.css             # CSS variables + @theme Tailwind v4
    components/            # Button, Card, Pill, ProgressRing, Timer, Meter, Modal, Sheet, Toast,
                           # AnswerInput, ChoiceButton, KeyHint, AudioButton, Waveform, Highlighter,
                           # ExamFrame, QuestionNav, FeedbackPanel, RecapScreen, EmptyState, Skeleton
    motion.ts              # preset transitions (10-MOTION-AND-SOUND)
  features/
    onboarding/  placement/  today/  stats/  library/  settings/  portfolio/
  games/
    v1-daily-run/  v2-collocation-forge/  v3-paraphrase-radar/
    l1-trap-detector/  l2-dictation-ladder/
    r1-tfng-judge/  r2-headline-editor/
    w1-essay-lab/  w2-writing-sprints/
    s1-mock-examiner/  s2-three-second-rule/
    x1-exam-room/
    _shared/               # chỉ component dùng chung cho ≥2 game (vd PassageView, ChartRenderer)
  legacy/                  # code V1/V2 cũ (Soul Knight, IOE, arcade) — đóng băng, không sửa
public/
  data/  audio/  assets/  fonts/(nếu không dùng fontsource)
scripts/
  data/  audio/  assets/  validate/
e2e/
```

### 3.1 Hợp đồng của một game
Mỗi `src/games/<id>/index.ts` export ra:
```ts
export interface GameDefinition {
  id: 'v1'|'v2'|'v3'|'l1'|'l2'|'r1'|'r2'|'w1'|'w2'|'s1'|'s2'|'x1';
  skill: 'vocab'|'listening'|'reading'|'writing'|'speaking'|'exam';
  title: string;            // tên hiển thị (tiếng Anh, như SPEC)
  subtitleVi: string;       // 1 câu tiếng Việt
  estMinutes: [number, number];
  requires: { ai?: boolean; mic?: boolean; audio?: boolean };
  modes: Array<'training'|'exam'|'sprint'>;
  load: () => Promise<{ default: React.ComponentType<GameProps> }>; // React.lazy
}
export interface GameProps { mode: string; level: number; onExit(result?: SessionResult): void; }
```
- `src/games/registry.ts` liệt kê 12 game. Hub và Planner chỉ đọc từ registry.
- `engine.ts` của mỗi game nhận vào `content + state + input` và trả ra `state + events`. Thuần tuý, không side effect. UI chỉ render state và gửi input.
  - Ví dụ event: `{type:'answer_scored', correct, rating, cardId}`.
- `SessionResult` có dạng `{ gameId, mode, startedAt, endedAt, items: AttemptItem[], score, xp, bandEvidence? }`. Hàm `core/storage/repos/attempts.ts::saveSession()` ghi SessionResult vào DB, đồng thời cập nhật SRS, XP, streak và band evidence **trong một transaction**.

## 4. IndexedDB (Dexie): schema v1
```ts
db.version(1).stores({
  profile:    'id',                                   // 1 row: 'me'
  cards:      'id, itemId, face, due, state, starred', // id = `${itemId}#${face}`
  reviewLogs: '++id, cardId, ts, gameId',
  attempts:   '++id, gameId, mode, startedAt',
  writings:   '++id, taskType, promptId, createdAt',
  speakings:  '++id, part, promptId, createdAt',       // audio Blob lưu trực tiếp
  kv:         'key'                                    // settings, flags, grading.biasOffset, caches nhỏ
});
```
- **`profile`:**
  ```
  { id:'me', createdAt, targetBands:{L,R,W,S}, estimatedBands:{L,R,W,S,confidence},
    skillLevels:Record<gameId,number>, dailyGoalMin, newCardsPerDay,
    streak:{count,lastActiveDay,freezes}, xp, placementDoneAt, examDate?, theme, sfxVolume, musicVolume }
  ```
- **`cards`:**
  - các trường của `ts-fsrs` Card: `due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review`
  - thêm `{ itemId, face, unlocked, starred, source, createdAt }`
- **`reviewLogs`:** `{ cardId, rating, correct, hintUsed, durationMs, ts, gameId }`. Lưu đủ để sau này tối ưu FSRS.
- **Giới hạn ghi âm:** cảnh báo khi tổng Blob ghi âm > 300MB. Có nút "xoá ghi âm cũ hơn 60 ngày, giữ transcript".

## 5. Nạp nội dung
- File `public/data/manifest.json` có dạng `{ version, files: { "<path>": { sha256, count } } }`. Script dữ liệu sinh file này.
- `core/content/loaders.ts`:
  - `loadContent<T>(path, schema)` gọi fetch qua `import.meta.env.BASE_URL`, rồi parse bằng zod.
  - Ở chế độ dev thì throw nếu sai schema.
  - Ở chế độ prod thì log lỗi và bỏ qua item lỗi.
  - Có cache trong bộ nhớ.
- Data lớn chia theo module, game nào cần thì mới tải. Danh sách file xem `04-DATA-SPEC.md` §1.

## 6. Âm thanh
- **`core/audio/sfx.ts`:** dùng howler sprite từ `public/assets/sfx/sfx.webm` + `.mp3`, có map tên → offset (xem `10-MOTION-AND-SOUND.md` §3). Âm lượng lấy từ profile. Có nút tắt toàn cục.
  - Thay cho `src/audio/soundEngine.ts` cũ. Key `lexicon_quest_muted` được migrate.
- **`core/audio/trackPlayer.ts`:** bọc `HTMLAudioElement` cho bài nghe.
  - API: `load(url)`, `play()`, `pause()`, `seek(sec)`, `playSegment(start,end)`, `onTime(cb)`, `rate` (0.75–1.25, chỉ dùng ở training).
  - Preload bài kế tiếp. Exam mode **khoá** seek và rate.
- **`core/speech/*`:**
  - `recorder.ts`: MediaRecorder, xuất webm/opus.
  - `vad.ts`: RMS trên AnalyserNode, ngưỡng tự hiệu chỉnh trong 1 giây im lặng đầu. Trả về các đoạn nói và đoạn ngừng có timestamp.
  - `asr.ts`: Web Speech `SpeechRecognition` (interim + final, `lang='en-GB'`), có fallback báo "trình duyệt không hỗ trợ".
  - `metrics.ts`: WPM, số ngừng > 1s, số ngừng > 2s, độ dài run trung bình, số filler trong transcript. Xem `games/S1` §6.

## 7. Migrate dữ liệu cũ (chạy 1 lần, idempotent)
`core/storage/migrateLegacy.ts`. Chạy khi mở app lần đầu ở V3, đánh dấu `kv['migrated_v3']=true`.

| Key localStorage cũ | Xử lý |
|---|---|
| `lexicon_quest_srs_v1` (SRSMap theo wordId) | Map sang item `vocab:<word-slug>`. Item đã thuộc thì tạo card `recog` với stability ước lượng theo số lần đúng |
| `ioe_mistakes` | Mỗi từ sai thành card `recall_meaning` đến hạn ngay |
| `lexicon_quest_player_v1` | Giữ XP và streak nếu hợp lý. Bỏ các trường RPG |
| `lexicon_quest_muted` | Gán vào `profile.sfxVolume` (muted thì 0) |
| `lexicon_snake_highscore` | Bỏ qua |

**Không xoá key cũ.** Game legacy vẫn đọc được các key này.

## 8. Code legacy
- Chuyển các file sau vào `src/legacy/` bằng `git mv`, giữ nguyên import nội bộ:
  - `src/components/**`
  - `src/game/**`
  - `src/combat/**`
  - `src/ioe/**`
  - `src/store/gameStore.ts`
  - `src/types/game.ts`, `src/types/ioe.ts`
- Route `#/legacy` hiển thị hub cũ. Lối vào nằm trong Cài đặt → "Hiện game cũ (V1/V2)", mặc định tắt.
- **Không xoá code legacy** khi Bang chưa đồng ý, theo luật `/dieu-phoi`.

## 9. Ngân sách hiệu năng (cổng đo được)

| Chỉ số | Ngưỡng |
|---|---|
| JS khởi động (shell + Today), gzip | ≤ 250 KB |
| Mỗi chunk game, gzip | ≤ 150 KB |
| LCP trang Hôm nay (desktop, cache trống, `vite preview`) | ≤ 1,5 s |
| Animation | 60 fps. Không có long task > 50 ms khi đang chơi (Performance panel, 30 giây chơi) |
| Độ trễ phát SFX | ≤ 50 ms (sprite đã preload) |
| Độ trễ bắt đầu bài nghe | ≤ 300 ms (đã preload) |

Đo bằng `npx vite build` (kích thước chunk) và Playwright kết hợp `performance` API. Script đo: `e2e/perf.spec.ts`.

## 10. Bảo mật và riêng tư
- App **không lưu và không cần API key** nào.
- Gói chấm chỉ rời máy khi Bang tự copy và dán vào Claude. Nút "Mở Claude" **không** đưa nội dung bài vào URL.
- Web Speech API trên Chrome gửi audio lên dịch vụ nhận dạng của trình duyệt. Cài đặt phải ghi rõ điều này. Bản ghi âm gốc chỉ nằm trên máy.
- Không có analytics bên thứ ba.
