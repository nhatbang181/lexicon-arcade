import type { GameDefinition } from '../registry';
import W1EssayLab from './W1EssayLab';

export const W1_GAME_DEFINITION: GameDefinition = {
  id: 'w1',
  code: 'W1',
  skill: 'writing',
  skillLabelVi: 'Writing',
  title: 'Essay Lab',
  subtitleVi:
    'Viết Task 1/Task 2 → tự chấm checklist + bài mẫu → gói chấm cho Claude → dán kết quả 4 tiêu chí có trích dẫn → sửa → chấm lại.',
  milestone: 'M4',
  estMinutes: [20, 40],
  requires: { ai: true },
  modes: ['training', 'exam'],
  load: () => Promise.resolve({ default: W1EssayLab }),
};

export * from './engine';
export * from './writingLoader';
export { W1EssayLab };
export default W1EssayLab;
