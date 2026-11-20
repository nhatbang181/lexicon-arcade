# 08 · Design System: giao diện, màu, chữ, component

## 1. Định hướng thẩm mỹ: "Focus Arcade"
- **Arcade ở viền, tập trung ở giữa.** Khung game có cảm giác chơi: nền tối sâu, điểm sáng màu theo kỹ năng, số liệu nảy, âm thanh giòn. Vùng **nội dung học** (câu hỏi, bài đọc, ô gõ) thì **sạch, chữ to, tương phản cao**, không có hiệu ứng nền phía sau chữ.
- **Bỏ phong cách pixel/cyber cũ** (font pixel, chữ cắt `...`, viền neon dày). Lý do: đọc lâu mỏi mắt, trông giống đồ chơi.
- **Exam mode đổi sang giao diện "thi trên máy":** nền trắng, chữ đen, xám trung tính, không màu kỹ năng, không animation thưởng. Mục đích là tập quen giao diện thật.
- **Mobile-first nhưng tối ưu desktop:**
  - Bố cục chính ở 1280×800.
  - Hỗ trợ tới 360 px.
  - Reading và Exam ở dưới 900 px chuyển sang tab "Bài đọc / Câu hỏi".

## 2. Design tokens (`src/design/tokens.css`, Tailwind v4 `@theme`)
```css
@theme {
  /* nền & bề mặt — dark mặc định */
  --color-bg: #0B0F1A;         --color-surface: #121829;    --color-surface-2: #1A2238;
  --color-border: #26304A;     --color-text: #E8ECF5;       --color-text-dim: #9AA5BE;  --color-text-faint: #6B7690;
  /* kỹ năng */
  --color-vocab: #8B5CF6;      --color-listening: #06B6D4;  --color-reading: #10B981;
  --color-writing: #F59E0B;    --color-speaking: #F43F5E;   --color-exam: #94A3B8;
  /* trạng thái */
  --color-correct: #22C55E;    --color-wrong: #EF4444;      --color-partial: #EAB308;   --color-info: #3B82F6;
  /* chữ */
  --font-ui: "Be Vietnam Pro", system-ui, sans-serif;
  --font-reading: "Source Serif 4", Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  /* bo góc, bóng, khoảng cách */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px;
  --shadow-card: 0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px rgba(0,0,0,.35);
  --shadow-glow-ok: 0 0 0 2px var(--color-correct), 0 0 24px rgba(34,197,94,.35);
}
[data-theme="light"] { --color-bg:#F7F8FB; --color-surface:#FFFFFF; --color-surface-2:#F1F3F8; --color-border:#E2E6EF;
  --color-text:#0F172A; --color-text-dim:#475569; --color-text-faint:#94A3B8; }
[data-mode="exam"] { /* luôn sáng, trung tính */ --color-bg:#FFFFFF; --color-surface:#FFFFFF; --color-text:#111111; --color-border:#C9CED6; }
```

**Màu kỹ năng** dùng cho: viền trái thẻ game, icon, progress ring, nút chính trong game đó.
- **Không** dùng màu kỹ năng làm nền phía sau chữ dài.
- Nền vùng chữ chỉ có 2 lựa chọn: `--color-surface`, hoặc `--color-skill` pha 8% (dùng `color-mix`).

**Tương phản (cổng đo được):**
- Chữ nội dung đạt **WCAG AA ≥ 4,5:1** trên nền của nó.
- Chữ lớn (≥ 24 px) đạt ≥ 3:1.
- Kiểm bằng axe-core trong Playwright (`e2e/a11y.spec.ts`).

## 3. Chữ

| Vai | Font | Cỡ (desktop/mobile) | Line-height |
|---|---|---|---|
| Display (số điểm, band) | Be Vietnam Pro 800 | 48/36 | 1.1 |
| H1 | Be Vietnam Pro 700 | 28/24 | 1.25 |
| H2 | Be Vietnam Pro 600 | 20/18 | 1.3 |
| Body UI | Be Vietnam Pro 400/500 | 16/15 | 1.5 |
| **Câu hỏi / prompt** | Be Vietnam Pro 500 | **20/18** | 1.45 |
| **Bài đọc (Reading, passage, transcript)** | **Source Serif 4 400** | **18/17** | **1.7**, độ rộng tối đa 68ch |
| Ô gõ đáp án | JetBrains Mono 500 | 20/18 | 1.3 |
| Timer, số đếm | JetBrains Mono 600, `tabular-nums` | 16–32 | 1 |
| Chú thích | Be Vietnam Pro 400 | 13/12 | 1.4 |

- Tiếng Việt có dấu phải hiển thị đúng. Đó là lý do chọn **Be Vietnam Pro**.
- IPA hiển thị bằng font hệ thống có đủ glyph IPA (`"Segoe UI", "Noto Sans"`). Chèn `font-family` riêng cho class `.ipa`.

## 4. Bố cục
- **Shell desktop ≥ 1024 px:** sidebar trái 240 px gồm logo, các mục Hôm nay, Luyện tập, Thi thử, Thống kê, Thư viện, Cài đặt; streak và XP ở đáy. Nội dung chiếm phần còn lại, rộng tối đa 1200 px.
- **Mobile < 1024 px:** thanh tab dưới gồm 5 mục: Hôm nay, Luyện, Thi, Thống kê, Thêm.
- **Trong game:** **ẩn shell**, toàn màn hình để tập trung. Thanh trên cao 56 px gồm:
  - nút thoát (Esc)
  - tên game, chấm màu kỹ năng
  - tiến độ phiên (thanh mảnh, hoặc số "7/20")
  - combo, XP
  - âm lượng
- **Lưới 8 px.** Padding thẻ 20–24 px. Khoảng cách giữa các khối 16/24/32.
- **Vùng chạm** ≥ 44×44 px. Phím tắt hiện trên nút bằng `<KeyHint>`.

## 5. Thư viện component (`src/design/components/`)
Mỗi component có story mẫu trong `/dev/components` (route chỉ có ở chế độ dev) để chụp ảnh kiểm tra.

| Component | Ghi chú hành vi |
|---|---|
| `Button` | Biến thể `primary` (màu kỹ năng) / `secondary` / `ghost` / `danger`, cỡ `sm`/`md`/`lg`. Có trạng thái loading (spinner thay icon, giữ nguyên độ rộng). Prop `hotkey` hiện `<KeyHint>` |
| `ChoiceButton` | Đáp án MCQ: số hoặc chữ ở trái (1–4 / A–D). Trạng thái: idle, hover, selected, correct, wrong, reveal-correct (viền xanh nét đứt), disabled |
| `AnswerInput` | Ô gõ font mono, tự focus. Enter để nộp. Hiện đếm từ khi có `wordLimit`. Khi đúng hoặc sai thì đổi màu viền và rung theo `10` |
| `Pill` / `Badge` | Nhãn POS, trapType, band, level |
| `ProgressRing` | Vòng tiến độ mục tiêu ngày, mastery |
| `BandMeter` | Thanh 4.0–9.0, có vạch mục tiêu, mũi tên xu hướng, đoạn mờ thể hiện độ tin cậy |
| `Timer` | Đếm ngược. Đổi màu ở 25% (vàng) và 10% (đỏ, nhịp đập nhẹ). Ở exam mode chỉ đổi chữ sang đỏ, không đập |
| `AudioButton` | Nút phát nhỏ (cho từ, câu). Trạng thái đang phát có sóng 3 vạch |
| `TrackPlayer` | Player bài nghe: waveform, nút phát/dừng, thanh thời gian. **Training:** tua, tốc độ 0.75/1/1.25, nút "tua lại 5 s". **Exam:** chỉ có nút bắt đầu, không dừng hay tua |
| `Waveform` | Canvas vẽ sóng. Đánh dấu vùng bẫy (đỏ), vùng đáp án (xanh) sau khi chấm |
| `Highlighter` | Bôi đen văn bản thành span `{start,end}` theo đoạn. Hỗ trợ chuột, cảm ứng, bàn phím (Shift + mũi tên). Cùng component cho R1 evidence và highlight trong exam |
| `PassageView` | Bài đọc chia đoạn A, B, C. Nhãn đoạn dính bên lề. Hỗ trợ highlight, ghi chú, và cuộn tới span |
| `QuestionNav` | Thanh số câu kiểu đề máy: đã làm, chưa làm, cờ, đang chọn |
| `FeedbackPanel` | Panel trượt lên từ dưới (mobile) hoặc từ phải (desktop). Chứa: đúng/sai, đáp án, vì sao, bằng chứng (quote hoặc nút nghe đoạn), nút "Tiếp (Enter)" |
| `RecapScreen` | Màn kết phiên: điểm lớn, 1 câu thắng, biểu đồ nhỏ, danh sách sai, nút ôn lại và nút về Hôm nay |
| `EssayEditor` | Textarea lớn cho W1. Đếm từ trực tiếp, đồng hồ, tự lưu nháp mỗi 5 giây. Tắt spellcheck (`spellcheck=false`, giống thi thật) |
| `RubricCard` | Hiện kết quả chấm (dán từ Claude): band từng tiêu chí, issue có quote bấm được (cuộn tới đoạn đó trong bài, highlight vàng) |
| `GradingPanel` | Luồng chấm qua Claude (`07`): nút 📋 Copy gói chấm (đổi thành ✓ trong 2 s), ⬇ Tải .md, ↗ Mở Claude, ô dán lớn tự focus khi quay lại tab, 📥 Đọc kết quả, khung lỗi định dạng + 📋 Copy lời nhắc sửa. Dùng chung cho W1, W2, S1, S2 |
| `ChartRenderer` | Vẽ Task 1 dạng bar, line, pie, table, process, map từ JSON. Phong cách đề thi: đen trắng, lưới mảnh |
| `MapView` | Vẽ `MapSpec` (L1 map và Task 1 map). Các ô A–I là đích kéo thả hoặc chọn |
| `MicButton` | Nút ghi âm lớn. Vòng sáng theo âm lượng thực, trạng thái đang nghe, có bộ đếm thời gian |
| `Modal`, `Sheet`, `Toast`, `Tooltip`, `Skeleton`, `EmptyState` | Chuẩn, dùng `motion` theo `10` |

## 6. Iconography và hình minh hoạ
- **Icon UI:** `lucide-react`, nét 1,75 px, cỡ 20 hoặc 24.
- **Icon gắn với từng kỹ năng:**

  | Kỹ năng | Icon lucide |
  |---|---|
  | Vocab | `BookA` |
  | Listening | `Headphones` |
  | Reading | `BookOpenText` |
  | Writing | `PenLine` |
  | Speaking | `Mic` |
  | Exam | `Timer` |

- **Icon game** (trên thẻ ở Hub): kết hợp lucide với icon từ **game-icons.net** (CC BY 3.0, ghi credit), tô 1 màu kỹ năng.

  | Game | Icon gợi ý |
  |---|---|
  | V1 | `run` / `sprint` |
  | V2 | `anvil` |
  | V3 | `radar-sweep` |
  | L1 | `trap-mask` / `sonic-shout` |
  | L2 | `quill-ink` |
  | R1 | `gavel` |
  | R2 | `newspaper` |
  | W1 | `scroll-quill` |
  | W2 | `stopwatch` |
  | S1 | `podium` |
  | S2 | `lightning` |
  | X1 | `hourglass` |

- **Minh hoạ empty state và onboarding:** dùng unDraw (giấy phép riêng của unDraw, không cần ghi nguồn, kiểm lại điều khoản). Đổi màu chủ đạo sang `--color-info`. Tối đa 6 hình, SVG tối ưu bằng SVGO ≤ 30 KB mỗi hình.
- **Không** dùng mascot. Không dùng hình giống Duolingo hay các app khác.

## 7. Giọng văn UI (microcopy)
- Tiếng Việt thân thiện, ngắn, xưng **"bạn"**. Thuật ngữ IELTS giữ tiếng Anh.
- Nút hành động là động từ: "Bắt đầu", "Nộp", "Nghe lại đoạn này", "Ôn 5 câu sai".
- **Không** dùng lời khen rỗng ("Tuyệt vời!!!"). Thay bằng lời cụ thể: "Đúng, bạn bắt được bẫy self-correction."
- Lời báo sai không trách móc: "Chưa đúng. Bài nói *some*, câu hỏi nói *most* → FALSE."
