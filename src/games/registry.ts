import type React from 'react';

export type GameId =
  | 'v1'
  | 'v2'
  | 'v3'
  | 'l1'
  | 'l2'
  | 'r1'
  | 'r2'
  | 'w1'
  | 'w2'
  | 's1'
  | 's2'
  | 'x1';

export type GameSkill = 'vocab' | 'listening' | 'reading' | 'writing' | 'speaking' | 'exam';

export interface GameProps {
  mode: string;
  level: number;
  onExit: (result?: unknown) => void;
}

export interface GameDefinition {
  id: GameId;
  code: string;
  skill: GameSkill;
  skillLabelVi: string;
  title: string;
  subtitleVi: string;
  milestone: string;
  estMinutes: [number, number];
  requires: { ai?: boolean; mic?: boolean; audio?: boolean };
  modes: Array<'training' | 'exam' | 'sprint'>;
  load: () => Promise<{ default: React.ComponentType<GameProps> }>;
}

type GameMeta = Omit<GameDefinition, 'load'>;

const GAME_METAS: GameMeta[] = [
  {
    id: 'v1',
    code: 'V1',
    skill: 'vocab',
    skillLabelVi: 'Từ vựng',
    title: 'Daily Run',
    subtitleVi: 'Ôn thẻ đến hạn theo lịch FSRS dưới dạng "chạy màn": tự nhớ ra, gõ ra, nghe ra.',
    milestone: 'M1',
    estMinutes: [8, 12],
    requires: { audio: true },
    modes: ['training', 'sprint'],
  },
  {
    id: 'v2',
    code: 'V2',
    skill: 'vocab',
    skillLabelVi: 'Từ vựng',
    title: 'Collocation Forge',
    subtitleVi: 'Tự gõ ra collocation học thuật, bắt collocation "kiểu Việt" sai.',
    milestone: 'M1',
    estMinutes: [6, 10],
    requires: {},
    modes: ['training', 'sprint'],
  },
  {
    id: 'v3',
    code: 'V3',
    skill: 'vocab',
    skillLabelVi: 'Từ vựng',
    title: 'Paraphrase Radar',
    subtitleVi: 'Tìm cụm paraphrase trong văn bản trước khi hết giờ, cầu nối sang Reading/Listening.',
    milestone: 'M1',
    estMinutes: [5, 10],
    requires: {},
    modes: ['training', 'sprint'],
  },
  {
    id: 'l1',
    code: 'L1',
    skill: 'listening',
    skillLabelVi: 'Listening',
    title: 'Trap Detector',
    subtitleVi: 'Mini-section đúng format đề Part 1–4, bẫy được cài và giải thích, tua lại đúng chỗ bẫy.',
    milestone: 'M3',
    estMinutes: [8, 15],
    requires: { audio: true },
    modes: ['training', 'exam'],
  },
  {
    id: 'l2',
    code: 'L2',
    skill: 'listening',
    skillLabelVi: 'Listening',
    title: 'Dictation Ladder',
    subtitleVi: 'Chép chính tả cả câu, tốc độ và giọng tăng dần, phân tích lỗi nối âm, âm cuối.',
    milestone: 'M3',
    estMinutes: [6, 12],
    requires: { audio: true },
    modes: ['training'],
  },
  {
    id: 'r1',
    code: 'R1',
    skill: 'reading',
    skillLabelVi: 'Reading',
    title: 'TFNG Judge',
    subtitleVi: 'Phải highlight câu làm bằng chứng mới được phán True/False/Not Given hoặc Yes/No/Not Given.',
    milestone: 'M2',
    estMinutes: [10, 15],
    requires: {},
    modes: ['training', 'exam'],
  },
  {
    id: 'r2',
    code: 'R2',
    skill: 'reading',
    skillLabelVi: 'Reading',
    title: 'Headline Editor',
    subtitleVi: 'Matching Headings: tìm ý chính, loại tiêu đề bẫy.',
    milestone: 'M2',
    estMinutes: [10, 15],
    requires: {},
    modes: ['training', 'exam'],
  },
  {
    id: 'w1',
    code: 'W1',
    skill: 'writing',
    skillLabelVi: 'Writing',
    title: 'Essay Lab',
    subtitleVi: 'Viết Task 1/Task 2 → tự chấm checklist + bài mẫu → gói chấm cho Claude → dán kết quả 4 tiêu chí có trích dẫn → sửa → chấm lại.',
    milestone: 'M4',
    estMinutes: [20, 40],
    requires: { ai: true },
    modes: ['training', 'exam'],
  },
  {
    id: 'w2',
    code: 'W2',
    skill: 'writing',
    skillLabelVi: 'Writing',
    title: 'Writing Sprints',
    subtitleVi: 'Overview Sprint (Task 1, 90 giây) và Idea Sprint (Task 2, 3 phút).',
    milestone: 'M4',
    estMinutes: [5, 10],
    requires: { ai: true },
    modes: ['sprint', 'training'],
  },
  {
    id: 's1',
    code: 'S1',
    skill: 'speaking',
    skillLabelVi: 'Speaking',
    title: 'Mock Examiner',
    subtitleVi: 'Thi thử Part 1–2–3 với giọng giám khảo thu sẵn, ghi âm, transcript, chỉ số fluency; gói chấm cho Claude để có 4 tiêu chí.',
    milestone: 'M5',
    estMinutes: [12, 18],
    requires: { audio: true, mic: true, ai: true },
    modes: ['training', 'exam'],
  },
  {
    id: 's2',
    code: 'S2',
    skill: 'speaking',
    skillLabelVi: 'Speaking',
    title: '3-Second Rule',
    subtitleVi: 'Phải bắt đầu nói trong vòng 3 giây, khung Answer → Reason → Example, phá thói quen dịch.',
    milestone: 'M5',
    estMinutes: [5, 8],
    requires: { mic: true, ai: true },
    modes: ['sprint', 'training'],
  },
  {
    id: 'x1',
    code: 'X1',
    skill: 'exam',
    skillLabelVi: 'Thi thử',
    title: 'Exam Room',
    subtitleVi: 'Mô phỏng bài thi trên máy tính (Listening 4 part, Reading 3 passage), tính band ước lượng.',
    milestone: 'M6',
    estMinutes: [30, 60],
    requires: { audio: true },
    modes: ['exam'],
  },
];

export const GAME_REGISTRY: GameDefinition[] = GAME_METAS.map((meta) => ({
  ...meta,
  load: () =>
    import('../app/GamePlaceholder').then((m) => ({
      default: m.createGamePlaceholder(meta),
    })),
}));

export function getGameById(id: string): GameDefinition | undefined {
  const normalized = id.toLowerCase();
  return GAME_REGISTRY.find((g) => g.id === normalized || g.code.toLowerCase() === normalized);
}
