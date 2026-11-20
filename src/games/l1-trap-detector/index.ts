import type { GameDefinition } from '../registry';

export const L1_GAME_DEFINITION: GameDefinition = {
  id: 'l1',
  code: 'L1',
  skill: 'listening',
  skillLabelVi: 'Listening',
  title: 'Trap Detector',
  subtitleVi:
    'Mini-section đúng format đề Part 1–4, bẫy được cài và giải thích, tua lại đúng chỗ bẫy.',
  milestone: 'M3',
  estMinutes: [8, 15],
  requires: { audio: true },
  modes: ['training', 'exam'],
  load: () => import('./L1TrapDetector'),
};

export * from './engine';
export * from './listeningLoader';
export { default, L1TrapDetector } from './L1TrapDetector';
