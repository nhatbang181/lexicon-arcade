import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scoreListeningAnswer } from './listeningAnswer';
import { scoreMCQ } from './readingAnswer';

/**
 * T2-B · "381 đáp án trong data vẫn 0 tự trượt": chấm chính từng đáp án chấp nhận
 * (và các biến thể gõ hợp lệ) bằng bộ chấm thật, với `wordLimit` của nhóm câu hỏi.
 */
const EPISODE_DIR = join(process.cwd(), 'public', 'data', 'listening', 'episodes');

interface RawQuestion {
  qid: string;
  answer: { accepted: string[]; keys?: string[] };
}
interface RawGroup {
  groupId: string;
  type: string;
  instructions?: string;
  wordLimit?: { words: number; allowNumber: boolean };
  questions: RawQuestion[];
}
interface RawEpisode {
  id: string;
  questionGroups: RawGroup[];
}

const CHOICE = new Set(['mcq_single', 'mcq_multi', 'matching', 'map_labelling', 'diagram_labelling']);

function loadEpisodes(): RawEpisode[] {
  return readdirSync(EPISODE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(EPISODE_DIR, f), 'utf8')) as RawEpisode);
}

describe('chấm đáp án Listening trên dữ liệu thật', () => {
  const episodes = loadEpisodes();

  it('đọc đủ 32 episode và 381 đáp án chấp nhận', () => {
    let answers = 0;
    for (const ep of episodes) {
      for (const g of ep.questionGroups) for (const q of g.questions) answers += q.answer.accepted.length;
    }
    expect(episodes.length).toBe(32);
    expect(answers).toBe(381);
  });

  it('mọi đáp án chấp nhận đều tự chấm là đúng (0 tự trượt)', () => {
    const failures: string[] = [];
    for (const ep of episodes) {
      for (const g of ep.questionGroups) {
        for (const q of g.questions) {
          const accepted = q.answer.accepted;
          const expected = q.answer.keys && q.answer.keys.length > 0 ? q.answer.keys : accepted;
          for (const typed of accepted) {
            if (g.type === 'mcq_multi') {
              // Chọn 2/3: engine chấm theo tập khoá (paired), từng chữ cái phải nằm trong tập khoá.
              if (!expected.map((k) => k.toUpperCase()).includes(typed.toUpperCase())) {
                failures.push(`${q.qid} [mcq_multi] "${typed}" ngoài tập khoá`);
              }
              continue;
            }
            const res = CHOICE.has(g.type)
              ? scoreMCQ(typed, expected)
              : scoreListeningAnswer(typed, accepted, { wordLimit: g.wordLimit ?? g.instructions });
            if (!res.correct) failures.push(`${q.qid} [${g.type}] "${typed}" → ${res.reason}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('đáp án đúng vẫn đúng khi gõ HOA, thừa khoảng trắng và dấu chấm cuối', () => {
    const failures: string[] = [];
    for (const ep of episodes) {
      for (const g of ep.questionGroups) {
        if (CHOICE.has(g.type)) continue;
        for (const q of g.questions) {
          const accepted = q.answer.accepted;
          const typed = `  ${accepted[0].toUpperCase().replace(/ /g, '  ')} `;
          const res = scoreListeningAnswer(typed, accepted, { wordLimit: g.wordLimit ?? g.instructions });
          if (!res.correct) failures.push(`${q.qid} "${typed.trim()}" → ${res.reason}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
