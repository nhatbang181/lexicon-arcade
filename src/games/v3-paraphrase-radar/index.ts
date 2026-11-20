import type { GameDefinition } from '../registry';

export const V3_GAME_DEFINITION: GameDefinition = {
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
  load: () => import('./V3ParaphraseRadar'),
};

export * from './engine';
export { default } from './V3ParaphraseRadar';
