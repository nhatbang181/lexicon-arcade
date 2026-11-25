import type { GameDefinition } from '../registry';
import R1TfngJudge from './R1TfngJudge';

export const R1_GAME_DEFINITION: GameDefinition = {
  id: 'r1',
  code: 'R1',
  skill: 'reading',
  skillLabelVi: 'Reading',
  title: 'TFNG Judge',
  subtitleVi:
    'Phải highlight câu làm bằng chứng mới được phán True/False/Not Given hoặc Yes/No/Not Given.',
  milestone: 'M2',
  estMinutes: [10, 15],
  requires: {},
  modes: ['training', 'exam'],
  load: async () => ({ default: R1TfngJudge }),
};

export * from './engine';
export * from './readingLoader';
export { R1TfngJudge };
export default R1TfngJudge;
