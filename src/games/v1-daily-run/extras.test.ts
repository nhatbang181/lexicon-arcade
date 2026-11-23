import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import { LexiconV3DB } from '../../core/storage/db';
import { cardRepo, userItemRepo } from '../../core/storage/repos';
import { createNewCard, scheduleCard, type SRSCard } from '../../core/srs/fsrsAdapter';
import { loadV1Content, loadV1Extras } from './extras';
import { createV1Run, getActiveNode, startPlayingFromMap } from './engine';

const NOW = new Date('2026-11-20T09:00:00Z');

/** fetch giả đọc thẳng thư mục public/ (cùng dữ liệu app thật sẽ tải). */
const fakeFetch = (async (input: RequestInfo | URL) => {
  const url = String(input).replace(/^\/+/, '');
  const file = path.resolve(process.cwd(), 'public', url);
  if (!fs.existsSync(file)) return new Response('not found', { status: 404 });
  return new Response(fs.readFileSync(file, 'utf8'), { status: 200 });
}) as typeof fetch;

function dueCard(itemId: string, face: SRSCard['face']): SRSCard {
  return {
    ...createNewCard(itemId, face, { now: NOW, unlocked: true }),
    state: State.Review,
    stability: 4,
    reps: 2,
    last_review: NOW.getTime() - 2 * 86_400_000,
    due: NOW.getTime() - 3_600_000,
  };
}

describe('loadV1Extras + loadV1Content (dữ liệu thật)', () => {
  let db: LexiconV3DB;
  beforeEach(async () => {
    db = new LexiconV3DB(`ExtrasT1A_${Math.random().toString(36).slice(2)}`);
    await db.open();
  });
  afterEach(async () => {
    await db.delete();
  });

  it('nạp 5 tập từ vựng thật, không rơi về fixture', async () => {
    const content = await loadV1Content({ fetchImpl: fakeFetch, baseUrl: '/' });
    expect(content.vocab.length).toBeGreaterThan(2000);
    expect(content.collocations.length).toBeGreaterThan(500);
    expect(content.vocab.some((v) => v.id === 'vocab:curriculum')).toBe(true);
  });

  it('thiếu file dữ liệu thì ném lỗi (không dùng fixture ngầm)', async () => {
    const broken = (async () => new Response('x', { status: 500 })) as typeof fetch;
    await expect(loadV1Content({ fetchImpl: broken, baseUrl: '/', bypassCache: true })).rejects.toThrow();
  });

  it('dựng ref cho tfng/head/ltrap từ passage + episode thật và đọc userItems', async () => {
    await userItemRepo.upsertWithCard(
      {
        id: 'err:user_q1',
        kind: 'error',
        front: 'He go to school',
        back: 'He goes to school',
        noteVi: 'Chia động từ ngôi 3 số ít',
        source: 'essay_feedback',
      },
      'err_fix',
      { now: NOW },
      db,
    );
    const cards = [
      dueCard('tfng:p1_001_q01', 'tfng_retry'),
      dueCard('head:p1_001_q07', 'head_retry'),
      dueCard('ltrap:p1_001_lep_p1_001_q01', 'ltrap_replay'),
      dueCard('err:user_q1', 'err_fix'),
      dueCard('tfng:p9_999_q01', 'tfng_retry'),
    ];
    const extras = await loadV1Extras(cards, {
      fetchImpl: fakeFetch,
      baseUrl: '/',
      database: db,
      now: NOW,
    });
    expect(Object.keys(extras.reading).sort()).toEqual(['head:p1_001_q07', 'tfng:p1_001_q01']);
    expect(extras.reading['tfng:p1_001_q01'].correctAnswer).toBe('TRUE');
    expect(extras.reading['head:p1_001_q07'].paragraphLabel).toBe('B');
    expect(Object.keys(extras.listening)).toEqual(['ltrap:p1_001_lep_p1_001_q01']);
    expect(extras.listening['ltrap:p1_001_lep_p1_001_q01'].audioPath).toBe('audio/listening/p1_001.mp3');
    expect(Object.keys(extras.userItems)).toEqual(['err:user_q1']);
  });

  it('chuỗi hoàn chỉnh: thẻ do game khác tạo → V1 hiện đúng nội dung và ghi FSRS đúng thẻ', async () => {
    const content = await loadV1Content({ fetchImpl: fakeFetch, baseUrl: '/' });
    const cards = [dueCard('tfng:p1_001_q01', 'tfng_retry')];
    const extras = await loadV1Extras(cards, { fetchImpl: fakeFetch, baseUrl: '/', database: db, now: NOW });
    const run = startPlayingFromMap(createV1Run({ cards, content: { ...content, extras }, now: NOW }));
    const node = getActiveNode(run)!;
    expect(node.face).toBe('tfng_retry');
    expect(node.card.id).toBe('tfng:p1_001_q01#tfng_retry');
    expect(node.prompt.face === 'tfng_retry' && node.prompt.statement).toContain('Elevated soil salt');
  });
});

describe('cardRepo.countNewCardsStartedSince (V1-9)', () => {
  let db: LexiconV3DB;
  beforeEach(async () => {
    db = new LexiconV3DB(`QuotaT1A_${Math.random().toString(36).slice(2)}`);
    await db.open();
  });
  afterEach(async () => {
    await db.delete();
  });

  it('chỉ đếm thẻ có review đầu tiên (prevState New) từ mốc thời gian, mỗi thẻ 1 lần', async () => {
    const day = NOW.getTime();
    const mk = (id: string, ts: number, prev: State) => ({
      cardId: id,
      rating: Rating.Good,
      correct: true,
      hintUsed: false,
      durationMs: 1000,
      ts,
      gameId: 'v1' as const,
      prevState: prev,
    });
    const c1 = scheduleCard(createNewCard('vocab:a', 'recog', { now: NOW }), Rating.Good, NOW).card;
    await cardRepo.upsert(c1, db);
    await db.reviews.bulkAdd([
      mk('vocab:a#recog', day + 10, State.New),
      mk('vocab:a#recog', day + 20, State.New),
      mk('vocab:b#recog', day + 30, State.New),
      mk('vocab:c#recog', day + 40, State.Review),
      mk('vocab:d#recog', day - 5000, State.New),
    ]);
    expect(await cardRepo.countNewCardsStartedSince(day, db)).toBe(2);
    expect(await cardRepo.countNewCardsStartedSince(day + 25, db)).toBe(1);
  });
});
