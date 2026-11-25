import type { GameDefinition } from '../registry';
import V2CollocationForge from './V2CollocationForge';

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
  load: async () => ({ default: V2CollocationForge }),
};

export * from './engine';
export default V2CollocationForge;
