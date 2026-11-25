import type { GameDefinition } from '../registry';
import { V1DailyRun } from './V1DailyRun';

export * from './engine';
export * from './RunMap';
export { V1DailyRun };

export const v1GameDefinition: GameDefinition = {
  id: 'v1',
  code: 'V1',
  skill: 'vocab',
  skillLabelVi: 'Từ vựng',
  title: 'Daily Run',
  subtitleVi:
    'Ôn thẻ đến hạn theo lịch FSRS dưới dạng "chạy màn": tự nhớ ra, gõ ra, nghe ra.',
  milestone: 'M1',
  estMinutes: [8, 12],
  requires: { audio: true },
  modes: ['training', 'sprint'],
  load: () => Promise.resolve({ default: V1DailyRun }),
};

export default V1DailyRun;
