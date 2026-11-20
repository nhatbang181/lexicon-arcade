import type { GameDefinition } from '../registry';

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
  load: () => import('./R2HeadlineEditor'),
};

export * from './engine';
export * from './readingLoader';
export { default, R2HeadlineEditor } from './R2HeadlineEditor';
