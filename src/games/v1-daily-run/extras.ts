import { State } from 'ts-fsrs';
import {
  CollocationItemSchema,
  DictationItemSchema,
  ErrorItemSchema,
  ListeningEpisodeSchema,
  ParaphraseItemSchema,
  ReadingPassageSchema,
  VocabItemSchema,
  type DictationItem,
  type ListeningEpisode,
  type ReadingPassage,
} from '../../core/content/schemas';
import {
  loadContent,
  loadContentArray,
  resolveAssetUrl,
  type LoadContentOptions,
} from '../../core/content/loaders';
import type { SRSCard } from '../../core/srs/fsrsAdapter';
import { userItemRepo } from '../../core/storage/repos/userItemRepo';
import type { LexiconV3DB } from '../../core/storage/db';
import {
  EMPTY_V1_EXTRAS,
  type V1ContentBundle,
  type V1ExtraContent,
  type V1ListeningRef,
  type V1ReadingRef,
} from './content';

export interface LoadV1Options {
  fetchImpl?: LoadContentOptions['fetchImpl'];
  baseUrl?: string;
  bypassCache?: boolean;
  database?: LexiconV3DB;
  now?: Date;
  /** Danh sách câu dictation (để kiểm file audio của thẻ `dict:*`). Không truyền = không kiểm. */
  dictations?: readonly DictationItem[];
}

const audioExistsCache = new Map<string, Promise<boolean>>();

/**
 * Kiểm file audio có thật không (HEAD). Dev server/SPA trả 200 + HTML cho đường dẫn không tồn tại
 * nên coi `text/html` là "không có". Lỗi mạng (offline) → coi là có: không đủ bằng chứng để bỏ thẻ.
 */
export function audioFileExists(
  relativePath: string,
  options: Pick<LoadV1Options, 'fetchImpl' | 'baseUrl'> = {},
): Promise<boolean> {
  const url = resolveAssetUrl(relativePath, options.baseUrl);
  const key = options.fetchImpl ? `${url}#custom` : url;
  const cached = !options.fetchImpl ? audioExistsCache.get(key) : undefined;
  if (cached) return cached;
  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  const probe = (async () => {
    if (typeof fetchFn !== 'function') return true;
    try {
      const res = await fetchFn(url, { method: 'HEAD' });
      if (!res.ok) return false;
      const type = res.headers?.get?.('content-type') ?? '';
      return !/text\/html/i.test(type);
    } catch {
      return true;
    }
  })();
  if (!options.fetchImpl) audioExistsCache.set(key, probe);
  return probe;
}

const silent = { isDev: false, onError: () => undefined };

/**
 * Nạp 5 tập nội dung từ vựng THẬT. Không có fallback sang fixture: nếu thiếu/ hỏng thì ném lỗi
 * để màn chơi hiện lỗi rõ ràng thay vì chơi bằng dữ liệu giả (V1-3).
 */
export async function loadV1Content(options: LoadV1Options = {}): Promise<V1ContentBundle> {
  const base = {
    ...silent,
    fetchImpl: options.fetchImpl,
    baseUrl: options.baseUrl,
    bypassCache: options.bypassCache,
  };
  const [vocab, collocations, paraphrases, errors, dictations] = await Promise.all([
    loadContentArray('data/vocab/words.json', VocabItemSchema, base),
    loadContentArray('data/vocab/collocations.json', CollocationItemSchema, base),
    loadContentArray('data/vocab/paraphrases.json', ParaphraseItemSchema, base),
    loadContentArray('data/vocab/error_patterns.json', ErrorItemSchema, base),
    loadContentArray('data/listening/dictation.json', DictationItemSchema, base),
  ]);
  if (vocab.length === 0) {
    throw new Error('Không có dữ liệu từ vựng (data/vocab/words.json rỗng).');
  }
  return { vocab, collocations, paraphrases, errors, dictations };
}

function isEligibleNow(card: SRSCard, nowMs: number): boolean {
  return card.unlocked && card.face !== 'intro' && (card.state === State.New || card.due <= nowMs);
}

const READING_QID = /^(.+)_q\d+$/;
const LISTENING_ITEM = /^ltrap:([a-z0-9]+_\d+)_(.+)$/;

const TFNG_OPTIONS = ['TRUE', 'FALSE', 'NOT GIVEN'];
const YNNG_OPTIONS = ['YES', 'NO', 'NOT GIVEN'];

export function buildReadingRef(
  itemId: string,
  passage: ReadingPassage,
  qid: string,
): V1ReadingRef | null {
  if (passage.reserved === true) return null; // [INV-X1] đề thi giữ riêng không vào ôn tập
  for (const group of passage.questionGroups) {
    const q = group.questions.find((x) => x.qid === qid);
    if (!q) continue;

    if (group.type === 'tfng' || group.type === 'ynng') {
      const evidence = q.evidence[0];
      const paragraph = passage.paragraphs.find((p) => p.label === evidence?.paragraph);
      const key = q.answer.key;
      if (!key || !paragraph) return null;
      return {
        kind: 'tfng',
        passageId: passage.id,
        passageTitle: passage.title,
        paragraphLabel: paragraph.label,
        paragraphText: paragraph.text,
        statement: q.prompt,
        qType: group.type,
        correctAnswer: key,
        options: group.type === 'ynng' ? YNNG_OPTIONS : TFNG_OPTIONS,
        evidenceQuote: evidence?.quote,
        explanationVi: q.explanationVi,
      };
    }

    if (group.type === 'headings' && group.headings) {
      const key = q.answer.key;
      const correct = group.headings.find((h) => h.key === key);
      const label = q.mainIdeaSpan?.paragraph ?? q.evidence[0]?.paragraph;
      const paragraph = passage.paragraphs.find((p) => p.label === label);
      if (!correct || !paragraph) return null;
      const decoyReasons: Record<string, string> = {};
      const pool: string[] = [];
      for (const d of q.headingDistractors ?? []) {
        const h = group.headings.find((x) => x.key === d.key);
        if (h && h.key !== correct.key) {
          decoyReasons[h.text] = d.whyVi;
          pool.push(h.text);
        }
      }
      for (const h of group.headings) {
        if (pool.length >= 3) break;
        if (h.key !== correct.key && !pool.includes(h.text)) pool.push(h.text);
      }
      return {
        kind: 'head',
        passageId: passage.id,
        passageTitle: passage.title,
        paragraphLabel: paragraph.label,
        paragraphText: paragraph.text,
        statement: q.prompt,
        qType: 'headings',
        correctAnswer: correct.text,
        options: [correct.text, ...pool],
        decoyReasons,
        evidenceQuote: q.mainIdeaSpan?.quote ?? q.evidence[0]?.quote,
        explanationVi: q.explanationVi,
      };
    }
  }
  void itemId;
  return null;
}

export function buildListeningRef(
  episode: ListeningEpisode,
  qid: string,
): V1ListeningRef | null {
  if (episode.reserved === true) return null;
  for (const group of episode.questionGroups) {
    const q = group.questions.find((x) => x.qid === qid || x.qid.endsWith(qid));
    if (!q) continue;
    const trap = q.traps[0];
    const clip = trap ?? { ...q.evidence, type: undefined, decoy: undefined, explanationVi: '' };
    const line = episode.script.find((l) => l.lineId === clip.lineId);
    return {
      episodeId: episode.id,
      qid: q.qid,
      questionPrompt: q.prompt,
      acceptedAnswers: q.answer.accepted,
      audioPath: episode.audio.path,
      clipStart: clip.start,
      clipEnd: clip.end,
      transcriptLine: line?.text,
      trapType: trap?.type,
      decoy: trap?.decoy,
      trapExplanationVi:
        trap?.explanationVi || 'Nghe lại đoạn này và để ý chỗ người nói đổi ý hoặc nhấn mạnh.',
    };
  }
  return null;
}

/**
 * Nạp nội dung thật cho các thẻ do game khác tạo (G1): `userItems` trong Dexie và, với `tfng:`/`head:`/
 * `ltrap:`, đúng passage/episode chứa câu hỏi. Chỉ nạp cho thẻ đang đến hạn/ mới để run nhanh.
 */
export async function loadV1Extras(
  cards: readonly SRSCard[],
  options: LoadV1Options = {},
): Promise<V1ExtraContent> {
  const nowMs = (options.now ?? new Date()).getTime();
  const eligible = cards.filter((c) => isEligibleNow(c, nowMs));
  const wantsItem = (id: string) =>
    /^(err:|col:|dict:|tfng:|head:|ltrap:)/.test(id);

  const itemIds = [...new Set(eligible.map((c) => c.itemId).filter(wantsItem))];
  if (itemIds.length === 0) return EMPTY_V1_EXTRAS;

  const userItems = await userItemRepo.getMany(itemIds, options.database).catch(() => ({}));
  const reading: Record<string, V1ReadingRef> = {};
  const listening: Record<string, V1ListeningRef> = {};
  const missingAudio: string[] = [];
  const dictById = new Map<string, DictationItem>((options.dictations ?? []).map((d) => [d.id, d]));
  const loadOpts = { ...silent, fetchImpl: options.fetchImpl, baseUrl: options.baseUrl };

  const passageCache = new Map<string, Promise<ReadingPassage | null>>();
  const episodeCache = new Map<string, Promise<ListeningEpisode | null>>();
  const getPassage = (slug: string) => {
    if (!passageCache.has(slug)) {
      passageCache.set(
        slug,
        loadContent(`data/reading/passages/${slug}.json`, ReadingPassageSchema, loadOpts).catch(
          () => null,
        ),
      );
    }
    return passageCache.get(slug)!;
  };
  const getEpisode = (slug: string) => {
    if (!episodeCache.has(slug)) {
      episodeCache.set(
        slug,
        loadContent(`data/listening/episodes/${slug}.json`, ListeningEpisodeSchema, loadOpts).catch(
          () => null,
        ),
      );
    }
    return episodeCache.get(slug)!;
  };

  await Promise.all(
    itemIds.map(async (id) => {
      if (id.startsWith('tfng:') || id.startsWith('head:')) {
        const qid = id.slice(id.indexOf(':') + 1);
        const slug = READING_QID.exec(qid)?.[1];
        if (!slug) return;
        const passage = await getPassage(slug);
        const ref = passage ? buildReadingRef(id, passage, qid) : null;
        if (ref) reading[id] = ref;
      } else if (id.startsWith('ltrap:')) {
        const m = LISTENING_ITEM.exec(id);
        if (!m) return;
        const episode = await getEpisode(m[1]);
        const ref = episode ? buildListeningRef(episode, m[2]) : null;
        if (!ref) return;
        // Thiếu MP3 thì không dựng thẻ nghe: chữ kịch bản chứa đáp án, hiện ra là lộ đề (G1, L1-01).
        if (await audioFileExists(ref.audioPath, options)) listening[id] = ref;
        else missingAudio.push(id);
      } else if (id.startsWith('dict:')) {
        const dict = dictById.get(id);
        if (dict && !(await audioFileExists(dict.audio, options))) missingAudio.push(id);
      }
    }),
  );

  return { userItems, reading, listening, missingAudio };
}
