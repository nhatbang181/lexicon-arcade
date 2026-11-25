import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { State } from 'ts-fsrs';
import { LexiconV3DB } from '../../core/storage/db';
import { createNewCard, type SRSCard } from '../../core/srs/fsrsAdapter';
import {
  createV1Run,
  getActiveNode,
  recordNodeAudioPlay,
  refundNodeAudioPlay,
  startPlayingFromMap,
} from './engine';
import { audioFileExists, loadV1Content, loadV1Extras } from './extras';

const NOW = new Date('2026-11-20T09:00:00Z');

/** fetch giả đọc thư mục public/; HEAD cũng đi qua đây (mp3 có thật mới trả 200). */
const fakeFetch = (async (input: RequestInfo | URL) => {
  const url = String(input).replace(/^\/+/, '');
  const file = path.resolve(process.cwd(), 'public', url);
  if (!fs.existsSync(file)) return new Response('not found', { status: 404 });
  return new Response(url.endsWith('.mp3') ? 'ID3' : fs.readFileSync(file, 'utf8'), { status: 200 });
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

describe('thẻ nghe không có MP3 thật (G1, L1-01)', () => {
  let db: LexiconV3DB;
  beforeEach(async () => {
    db = new LexiconV3DB(`AudioMissing_${Math.random().toString(36).slice(2)}`);
    await db.open();
  });
  afterEach(async () => {
    await db.delete();
  });

  const load = async (cards: SRSCard[], fetchOverride: typeof fetch = fakeFetch) => {
    const content = await loadV1Content({ fetchImpl: fakeFetch, baseUrl: '/' });
    const extras = await loadV1Extras(cards, {
      fetchImpl: fetchOverride,
      baseUrl: '/',
      database: db,
      now: NOW,
      dictations: content.dictations,
      vocab: content.vocab,
    });
    return { content: { ...content, extras }, extras };
  };

  it('ltrap_replay thiếu MP3: bỏ node, log lý do missing_audio, không có review/FSRS', async () => {
    const cards = [dueCard('ltrap:p1_002_lep_p1_002_q01', 'ltrap_replay')];
    const { content, extras } = await load(cards);
    expect(extras.listening['ltrap:p1_002_lep_p1_002_q01']).toBeUndefined();
    expect(extras.missingAudio).toEqual(['ltrap:p1_002_lep_p1_002_q01']);
    const run = createV1Run({ cards, content, now: NOW });
    expect(run.nodes).toHaveLength(0);
    expect(run.reviews).toHaveLength(0);
    expect(run.missingItems).toEqual([
      {
        cardId: 'ltrap:p1_002_lep_p1_002_q01#ltrap_replay',
        itemId: 'ltrap:p1_002_lep_p1_002_q01',
        face: 'ltrap_replay',
        reason: 'missing_audio',
      },
    ]);
  });

  it('ltrap_replay CÓ MP3: giữ nguyên node và nội dung', async () => {
    const cards = [dueCard('ltrap:p1_001_lep_p1_001_q01', 'ltrap_replay')];
    const { content, extras } = await load(cards);
    expect(extras.missingAudio).toEqual([]);
    const run = startPlayingFromMap(createV1Run({ cards, content, now: NOW }));
    const node = getActiveNode(run)!;
    expect(node.face).toBe('ltrap_replay');
    expect(run.missingItems).toHaveLength(0);
  });

  it('dict_full thiếu audio: bỏ node, không ghi review (không Again), có audio thì giữ', async () => {
    const cards = [dueCard('dict:0011', 'dict_full'), dueCard('dict:0001', 'dict_full')];
    const { content, extras } = await load(cards);
    expect(extras.missingAudio).toEqual(['dict:0011']);
    const run = createV1Run({ cards, content, now: NOW });
    expect(run.nodes.map((n) => n.card.itemId)).toEqual(['dict:0001']);
    expect(run.reviews).toHaveLength(0);
    expect(run.missingItems).toEqual([
      expect.objectContaining({ itemId: 'dict:0011', reason: 'missing_audio' }),
    ]);
  });

  it('chỉ có dict thiếu audio: run rỗng, không node nào để chấm', async () => {
    const cards = [dueCard('dict:0012', 'dict_full')];
    const { content } = await load(cards);
    const run = createV1Run({ cards, content, now: NOW });
    expect(run.nodes).toHaveLength(0);
    expect(run.attemptItems).toHaveLength(0);
  });

  it('audioFileExists: 404 và 200 kèm HTML (SPA fallback) đều là "không có"; lỗi mạng không bỏ thẻ', async () => {
    const html = (async () =>
      new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } })) as typeof fetch;
    const net = (async () => {
      throw new TypeError('offline');
    }) as typeof fetch;
    expect(await audioFileExists('audio/dictation/dict_0001.mp3', { fetchImpl: fakeFetch, baseUrl: '/' })).toBe(true);
    expect(await audioFileExists('audio/dictation/dict_0011.mp3', { fetchImpl: fakeFetch, baseUrl: '/' })).toBe(false);
    expect(await audioFileExists('audio/x.mp3', { fetchImpl: html, baseUrl: '/' })).toBe(false);
    expect(await audioFileExists('audio/x.mp3', { fetchImpl: net, baseUrl: '/' })).toBe(true);
  });

  it('refundNodeAudioPlay trả lại lượt nghe khi audio không phát được, chỉ cho đúng node', async () => {
    const cards = [dueCard('dict:0001', 'dict_full')];
    const { content } = await load(cards);
    const run = startPlayingFromMap(createV1Run({ cards, content, now: NOW }));
    const node = getActiveNode(run)!;
    const played = recordNodeAudioPlay(run);
    expect(getActiveNode(played.state)!.audioPlaysUsed).toBe(1);
    expect(getActiveNode(refundNodeAudioPlay(played.state, node.nodeId))!.audioPlaysUsed).toBe(0);
    expect(getActiveNode(refundNodeAudioPlay(played.state, 'node-khac'))!.audioPlaysUsed).toBe(1);
    expect(getActiveNode(refundNodeAudioPlay(run, node.nodeId))!.audioPlaysUsed).toBe(0);
  });

  it('FX-0 (SR-22): vocab listen_spell thiếu MP3 thật → không bao giờ ra listen_spell, hạ sang recall_meaning và log missing_audio', async () => {
    const baseContent = await loadV1Content({ fetchImpl: fakeFetch, baseUrl: '/' });
    const firstWord = baseContent.vocab[0];
    const cards = [dueCard(firstWord.id, 'listen_spell')];
    // Giả lập mọi file MP3 trả 404 (chưa render)
    const missingMp3Fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('.mp3')) return new Response('not found', { status: 404 });
      return fakeFetch(input, init);
    }) as typeof fetch;

    const { content, extras } = await load(cards, missingMp3Fetch);
    expect(extras.missingAudio).toContain(firstWord.id);
    const run = startPlayingFromMap(createV1Run({ cards, content, now: NOW }));
    expect(run.nodes).toHaveLength(1);
    expect(run.nodes[0].face).toBe('recall_meaning');
    expect(run.nodes[0].prompt.face).toBe('recall_meaning');
    expect(run.nodes.some((n) => n.face === 'listen_spell')).toBe(false);
    expect(run.missingItems).toEqual([
      expect.objectContaining({
        cardId: `${firstWord.id}#listen_spell`,
        itemId: firstWord.id,
        face: 'listen_spell',
        reason: 'missing_audio',
      }),
    ]);
  });

  it('FX-0 (SR-22): vocab listen_spell CÓ MP3 thật → giữ nguyên mặt listen_spell, không log missing_audio', async () => {
    const baseContent = await loadV1Content({ fetchImpl: fakeFetch, baseUrl: '/' });
    const firstWord = baseContent.vocab[0];
    const cards = [dueCard(firstWord.id, 'listen_spell')];
    const presentMp3Fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('.mp3')) {
        return new Response('ID3', { status: 200, headers: { 'content-type': 'audio/mpeg' } });
      }
      return fakeFetch(input, init);
    }) as typeof fetch;

    const { content, extras } = await load(cards, presentMp3Fetch);
    expect(extras.missingAudio).not.toContain(firstWord.id);
    const run = startPlayingFromMap(createV1Run({ cards, content, now: NOW }));
    expect(run.nodes).toHaveLength(1);
    expect(run.nodes[0].face).toBe('listen_spell');
    expect(run.missingItems).toHaveLength(0);
  });

  it('FX-0 (SR-22): dict listen_spell thiếu MP3 thật → bỏ node, 0 review, log missing_audio', async () => {
    const cards = [dueCard('dict:0011', 'listen_spell'), dueCard('dict:0001', 'listen_spell')];
    const { content, extras } = await load(cards);
    expect(extras.missingAudio).toEqual(['dict:0011']);
    const run = createV1Run({ cards, content, now: NOW });
    expect(run.nodes.map((n) => n.card.itemId)).toEqual(['dict:0001']);
    expect(run.nodes[0].face).toBe('listen_spell');
    expect(run.reviews).toHaveLength(0);
    expect(run.missingItems).toEqual([
      expect.objectContaining({ itemId: 'dict:0011', face: 'listen_spell', reason: 'missing_audio' }),
    ]);
  });
});
