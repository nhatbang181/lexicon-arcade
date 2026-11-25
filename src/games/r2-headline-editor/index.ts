import type { GameDefinition } from '../registry';
import R2HeadlineEditor from './R2HeadlineEditor';

export const R2_GAME_DEFINITION: GameDefinition = {
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
  load: async () => ({ default: R2HeadlineEditor }),
};

export * from './engine';
export * from './readingLoader';
export { R2HeadlineEditor };
export default R2HeadlineEditor;
