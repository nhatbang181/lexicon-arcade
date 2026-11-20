import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearContentCache,
  filterTrainingPool,
  getContentCacheSize,
  loadContent,
  loadContentArray,
  resolveAssetUrl,
} from './loaders';
import { clearManifestCache, getManifestFileEntry, loadManifest } from './manifest';
import {
  CollocationItemSchema,
  DictationItemSchema,
  ErrorItemSchema,
  ExamTestSchema,
  ListeningEpisodeSchema,
  ManifestSchema,
  ParaphraseItemSchema,
  ReadingPassageSchema,
  SpeakingCueCardSchema,
  SpeakingPart1TopicSchema,
  SpeakingPart3SetSchema,
  SpeakingPhraseSchema,
  VocabItemSchema,
  WritingTask1PromptSchema,
  WritingTask2PromptSchema,
} from './schemas';

const baseProv = {
  createdBy: 'llm+review' as const,
  source: 'llm:claude@2026-11-20',
  license: 'own',
  qa: { schema: 'pass' as const, verifier: 'pass' as const },
};

describe('src/core/content', () => {
  beforeEach(() => {
    clearManifestCache();
    clearContentCache();
  });

  describe('schemas', () => {
    it('validates VocabItem, CollocationItem, ParaphraseItem, ErrorItem', () => {
      const vocab = VocabItemSchema.parse({
        id: 'vocab:curriculum',
        headword: 'curriculum',
        pos: ['n'],
        ipa: { uk: '/kəˈrɪk.jə.ləm/' },
        meaningVi: 'chương trình học',
        definitionEn: 'The subjects included in a course of study.',
        examples: [
          { en: 'The school revised its national curriculum last year.' },
          { en: 'Coding has become a core part of the modern curriculum.' },
        ],
        collocationIds: ['col:national_curriculum'],
        register: 'formal',
        topics: ['education'],
        lists: ['AWL1'],
        audio: { uk: 'audio/vocab/curriculum.uk.mp3' },
        provenance: baseProv,
      });
      expect(vocab.id).toBe('vocab:curriculum');

      // Reject CJK in IPA ([INV-V2])
      expect(
        VocabItemSchema.safeParse({ ...vocab, ipa: { uk: '/中文/' } }).success,
      ).toBe(false);

      expect(
        CollocationItemSchema.safeParse({
          id: 'col:national_curriculum',
          headwordId: 'vocab:curriculum',
          pattern: 'ADJ+N',
          phrase: 'national curriculum',
          gaps: [{ display: '___ curriculum', answers: ['national'], primary: 'national' }],
          meaningVi: 'chương trình giáo dục quốc gia',
          example: 'The ministry updated the national curriculum to include data literacy.',
          register: 'formal',
          bandTarget: 8,
          l1Traps: [{ wrong: 'country curriculum', whyVi: 'Dịch sát nghĩa từ "quốc gia".' }],
          topics: ['education'],
          provenance: baseProv,
        }).success,
      ).toBe(true);

      expect(
        ParaphraseItemSchema.safeParse({
          id: 'para:0001',
          level: 2,
          questionPhrase: 'rapid urban expansion',
          relation: 'equivalent',
          context: 'Cities have grown quickly in recent decades due to migration.',
          target: { text: 'grown quickly', start: 12, end: 25 },
          decoys: [{ text: 'recent decades', start: 29, end: 43, whyVi: 'Chỉ thời gian.' }],
          explanationVi: 'Paraphrase danh từ hoá thành động từ + trạng từ.',
          topics: ['urban'],
          provenance: baseProv,
        }).success,
      ).toBe(true);

      expect(
        ErrorItemSchema.safeParse({
          id: 'err:article_001',
          tag: 'article',
          wrong: 'Government should invest in education.',
          correct: 'The government should invest in education.',
          errorSpan: { start: 0, end: 10 },
          ruleVi: 'Dùng "the government" khi nói về chính phủ nói chung.',
          provenance: baseProv,
        }).success,
      ).toBe(true);
    });

    it('validates Listening, Dictation, Reading, Writing, Speaking, ExamTest, and Manifest schemas', () => {
      expect(
        ListeningEpisodeSchema.safeParse({
          id: 'lep:p1_001',
          part: 1,
          title: 'Sports Centre Booking',
          contextEn: 'A woman phones a sports centre.',
          difficulty: 4,
          speakers: [{ id: 's1', name: 'Tom', role: 'staff', voice: 'bm_george', accent: 'uk' }],
          script: [{ lineId: 'l1', speakerId: 's1', text: 'That is 15 pounds.', start: 0, end: 3 }],
          audio: { path: 'audio/listening/p1_001.mp3', durationSec: 240, sha256: 'abc', loudnessLUFS: -16 },
          questionGroups: [
            {
              groupId: 'g1',
              type: 'form_completion',
              instructions: 'Write ONE WORD AND/OR A NUMBER.',
              wordLimit: { words: 1, allowNumber: true },
              previewSec: 30,
              questions: [
                {
                  qid: 'q1',
                  number: 1,
                  prompt: 'Fee: ___',
                  answer: { accepted: ['£15', '15 pounds'] },
                  evidence: { lineId: 'l1', start: 0, end: 3 },
                  traps: [],
                },
              ],
            },
          ],
          provenance: baseProv,
        }).success,
      ).toBe(true);

      expect(
        DictationItemSchema.safeParse({
          id: 'dict:001',
          text: 'The lecture was postponed until Friday afternoon.',
          level: 3,
          accent: 'uk',
          voice: 'bf_emma',
          wpm: 145,
          features: ['final_consonant', 'linking'],
          focus: [{ tokenIndex: 3, feature: 'final_consonant', tipVi: 'Nghe âm cuối -ed.' }],
          audio: 'audio/dictation/dict_001.mp3',
          provenance: baseProv,
        }).success,
      ).toBe(true);

      expect(
        ReadingPassageSchema.safeParse({
          id: 'rp:p1_001',
          level: 'P1',
          title: 'Urban Forests',
          topic: 'environment',
          paragraphs: [{ label: 'A', text: 'Urban trees cool cities significantly.' }],
          wordCount: 720,
          questionGroups: [
            {
              groupId: 'rg1',
              type: 'tfng',
              instructions: 'TRUE / FALSE / NOT GIVEN',
              questions: [
                {
                  qid: 'rq1',
                  number: 1,
                  prompt: 'Trees lower city temperatures.',
                  answer: { key: 'TRUE' },
                  evidence: [{ paragraph: 'A', start: 0, end: 38, quote: 'Urban trees cool cities significantly.' }],
                  explanationVi: 'Bài nói rõ cây đô thị làm mát thành phố.',
                },
              ],
            },
          ],
          provenance: baseProv,
        }).success,
      ).toBe(true);

      expect(
        WritingTask1PromptSchema.safeParse({
          id: 'w1:bar_001',
          kind: 'bar',
          topic: 'energy',
          difficulty: 5,
          prompt: 'The chart below shows electricity generation.',
          chart: {
            title: 'Power Output',
            unit: 'TWh',
            categories: ['2010', '2020'],
            series: [{ name: 'Solar', values: [10, 80] }],
          },
          keyFeatures: [{ id: 'f1', kind: 'overall_trend', textEn: 'Solar surged.', mustMention: true }],
          overviewModels: ['Overall, solar output rose sharply over the decade.'],
          band8Model: { text: 'The bar chart illustrates...', wordCount: 175 },
          provenance: baseProv,
        }).success,
      ).toBe(true);

      expect(
        WritingTask2PromptSchema.safeParse({
          id: 'w2:op_001',
          essayType: 'opinion',
          topic: 'education',
          difficulty: 6,
          prompt: 'University education should be free for everyone. To what extent do you agree?',
          partsToAddress: ['state extent of agreement'],
          ideaBank: [{ side: 'for', idea: 'Social mobility', develop: 'Removes financial barriers.' }],
          band8Model: { text: 'Higher education...', wordCount: 290, notes: [] },
          usefulCollocationIds: ['col:national_curriculum'],
          provenance: baseProv,
        }).success,
      ).toBe(true);

      expect(
        SpeakingPart1TopicSchema.safeParse({
          id: 's1t:work',
          topic: 'Work and Study',
          rotation: '2026-Q3',
          evergreen: true,
          questions: [{ qid: 'q1', text: 'Do you work or study?', audio: 'audio/s1.mp3', ideaHintsEn: ['software'] }],
        }).success,
      ).toBe(true);

      expect(
        SpeakingCueCardSchema.safeParse({
          id: 's2c:001',
          rotation: '2026-Q3',
          evergreen: true,
          category: 'place',
          prompt: 'Describe a quiet place you like.',
          bullets: ['Where it is'],
          finalBullet: 'And explain why you like it.',
          audio: 'audio/s2.mp3',
          linkedPart3Id: 's3s:001',
          sampleNotes: ['library', 'quiet'],
          band8Sample: { text: 'One quiet place...', estSeconds: 115 },
          roundingOffQs: ['Do you go there often?'],
        }).success,
      ).toBe(true);

      expect(
        SpeakingPart3SetSchema.safeParse({
          id: 's3s:001',
          linkedCueCardId: 's2c:001',
          questions: [
            {
              qid: 'p3q1',
              text: 'Why do people seek quiet spaces?',
              type: 'cause',
              audio: 'audio/p3.mp3',
              followUps: [{ text: 'Has that changed recently?', audio: 'audio/p3f.mp3' }],
            },
          ],
        }).success,
      ).toBe(true);

      expect(
        SpeakingPhraseSchema.safeParse({
          id: 'sph:001',
          function: 'buy_time',
          phrase: 'That is an intriguing question.',
          band6Equivalent: 'Let me think.',
          usageVi: 'Mua 1-2 giây suy nghĩ ở Part 3.',
          example: 'That is an intriguing question; I would say...',
          audio: 'audio/sph.mp3',
        }).success,
      ).toBe(true);

      expect(
        ExamTestSchema.safeParse({
          id: 'xt:01',
          title: 'Academic Practice Test 1',
          listening: ['lep:p1_1', 'lep:p2_1', 'lep:p3_1', 'lep:p4_1'],
          reading: ['rp:p1_1', 'rp:p2_1', 'rp:p3_1'],
          reserved: true,
        }).success,
      ).toBe(true);
    });
  });

  describe('loaders & manifest', () => {
    it('resolves URLs using BASE_URL without duplicate slashes', () => {
      expect(resolveAssetUrl('/data/vocab/words.json', '/lexicon-arcade/')).toBe(
        '/lexicon-arcade/data/vocab/words.json',
      );
      expect(resolveAssetUrl('data/manifest.json', '/lexicon-arcade')).toBe(
        '/lexicon-arcade/data/manifest.json',
      );
    });

    it('caches manifest, filters reserved items, and validates array items in dev vs prod', async () => {
      const mockManifest = {
        version: '3.0.0',
        files: { 'vocab/words.json': { sha256: 'deadbeef', count: 2 } },
      };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockManifest,
      });

      const m1 = await loadManifest({ fetchImpl: fetchMock, baseUrl: '/lexicon-arcade/', isDev: true });
      const m2 = await loadManifest({ fetchImpl: fetchMock, baseUrl: '/lexicon-arcade/', isDev: true });
      expect(m1).toEqual(mockManifest);
      expect(m2).toEqual(mockManifest);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getManifestFileEntry(m1, 'vocab/words.json')?.count).toBe(2);
      expect(getContentCacheSize()).toBe(1);

      // Array loading: dev throws on invalid item; prod skips invalid item
      const mixedPayload = [
        { id: 'err:1', tag: 'article', wrong: 'a', correct: 'b', errorSpan: { start: 0, end: 1 }, ruleVi: 'r', provenance: baseProv },
        { id: 'bad_id' },
      ];
      const arrFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mixedPayload,
      });

      await expect(
        loadContentArray('data/err.json', ErrorItemSchema, {
          fetchImpl: arrFetch,
          isDev: true,
          bypassCache: true,
        }),
      ).rejects.toThrow(/schema validation failed/i);

      const onError = vi.fn();
      const prodItems = await loadContentArray('data/err.json', ErrorItemSchema, {
        fetchImpl: arrFetch,
        isDev: false,
        bypassCache: true,
        onError,
      });
      expect(prodItems).toHaveLength(1);
      expect(onError).toHaveBeenCalledTimes(1);

      // HTTP failure & schema errors throw
      const failFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
      await expect(
        loadContent('data/missing.json', ManifestSchema, { fetchImpl: failFetch }),
      ).rejects.toThrow(/HTTP 404/);

      const badObjFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ invalid: true }),
      });
      await expect(
        loadContent('data/bad.json', ManifestSchema, { fetchImpl: badObjFetch, isDev: true }),
      ).rejects.toThrow(/schema validation failed/i);
      const prodErr = vi.fn();
      await expect(
        loadContent('data/bad.json', ManifestSchema, {
          fetchImpl: badObjFetch,
          isDev: false,
          onError: prodErr,
        }),
      ).rejects.toThrow(/Invalid content payload/i);
      expect(prodErr).toHaveBeenCalledTimes(1);

      // Cached array hit
      const cachedArr = await loadContentArray('data/err.json', ErrorItemSchema, {
        fetchImpl: arrFetch,
        isDev: false,
      });
      expect(cachedArr).toHaveLength(1);

      // [INV-X1] reserved items filtered out of training pool
      expect(
        filterTrainingPool([{ id: '1', reserved: false }, { id: '2', reserved: true }, { id: '3' }]),
      ).toHaveLength(2);
    });
  });
});
