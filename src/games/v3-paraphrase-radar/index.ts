import type { GameDefinition } from '../registry';
import V3ParaphraseRadar from './V3ParaphraseRadar';

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
  load: async () => ({ default: V3ParaphraseRadar }),
};

export * from './engine';
export default V3ParaphraseRadar;
