import type { GameDefinition } from '../registry';
import L2DictationLadder from './L2DictationLadder';

export const L2_GAME_DEFINITION: GameDefinition = {
  id: 'l2',
  code: 'L2',
  skill: 'listening',
  skillLabelVi: 'Listening',
  title: 'Dictation Ladder',
  subtitleVi:
    'Chép chính tả cả câu, tốc độ và giọng tăng dần, phân tích lỗi nối âm, âm cuối.',
  milestone: 'M3',
  estMinutes: [6, 12],
  requires: { audio: true },
  modes: ['training'],
  load: () => Promise.resolve({ default: L2DictationLadder }),
};

export * from './engine';
export * from './dictationLoader';
export { L2DictationLadder };
export default L2DictationLadder;
