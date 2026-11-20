import type { GameDefinition } from '../registry';

export const V2_GAME_DEFINITION: GameDefinition = {
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
  load: () => import('./V2CollocationForge'),
};

export * from './engine';
export { default } from './V2CollocationForge';
