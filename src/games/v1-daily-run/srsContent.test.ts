import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import { createNewCard, type SRSCard } from '../../core/srs/fsrsAdapter';
import type { UserItemRecord } from '../../core/storage/db';
import type { ReadingPassage, ListeningEpisode, VocabItem } from '../../core/content/schemas';
import {
  V1_FIXTURE_CONTENT,
  buildV1FixtureCards,
} from '../../test/fixtures/v1_fixtures';
import {
  EMPTY_V1_EXTRAS,
  type V1ContentBundle,
  type V1ExtraContent,
} from './content';
import {
  advanceAfterFeedback,
  buildPromptForCard,
  buildV1ProgressPayload,
  buildV1WinStatement,
  computeLastWeekAccuracy,
  continueFromCheckpoint,
  createV1Run,
  getActiveNode,
  resolveV1Face,
  scorePromptAnswer,
  startPlayingFromMap,
  submitIntroAction,
  submitNodeAnswer,
  type V1PromptPayload,
  type V1RunState,
} from './engine';
import { buildListeningRef, buildReadingRef } from './extras';
import { buildStarterVocabCards } from './starter';

const NOW = new Date('2026-11-20T09:00:00Z');

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public', rel), 'utf8')) as T;
}

function dueCard(itemId: string, face: SRSCard['face'], overdueHours = 24): SRSCard {
  const base = createNewCard(itemId, face, { now: NOW, unlocked: true });
  return {
    ...base,
    state: State.Review,
    stability: 5,
    difficulty: 5,
    scheduled_days: 5,
    reps: 3,
    streak: 2,
    last_review: NOW.getTime() - 3 * 86_400_000,
    due: NOW.getTime() - overdueHours * 3_600_000,
  };
}

function withExtras(extras: Partial<V1ExtraContent>): V1ContentBundle {
  return { ...V1_FIXTURE_CONTENT, extras: { ...EMPTY_V1_EXTRAS, ...extras } };
}

function userItem(partial: Partial<UserItemRecord> & { id: string }): UserItemRecord {
  return {
    kind: 'error',
    front: 'The informations are useful',
    back: 'The information is useful',
    noteVi: 'information không đếm được',
    source: 'essay_feedback',
    createdAt: NOW.getTime(),
    ...partial,
  };
}

function firstNode(state: V1RunState) {
  const node = getActiveNode(startPlayingFromMap(state));
  if (!node) throw new Error('run không có node');
  return node;
}

describe('V1-1 · thẻ mới đi qua intro đúng 1 lần rồi tới gợi nhớ', () => {
  const newCard = createNewCard('vocab:ubiquitous', 'recog', { now: NOW, unlocked: true });

  it('Đã xem: ghi introSeenAt và chèn node recog của chính thẻ đó trong cùng run', () => {
    const run = createV1Run({ cards: [newCard], content: V1_FIXTURE_CONTENT, now: NOW });
    expect(run.nodes[0].face).toBe('intro');
    const after = submitIntroAction(run, 'seen', NOW);

    const recogIdx = after.nodes.findIndex((n) => n.face === 'recog' && n.itemId === 'vocab:ubiquitous');
    expect(recogIdx).toBeGreaterThan(0);
    expect(after.nodes[recogIdx].isRetry).toBe(false);
    expect(after.nodes[recogIdx].isNewCard).toBe(true);
    expect(after.updatedCards['vocab:ubiquitous#recog'].introSeenAt).toBe(NOW.getTime());
    expect(after.events.some((e) => e.type === 'intro_seen')).toBe(true);
    // "Đã xem" chưa chấm FSRS, chưa có review
    expect(after.reviews).toHaveLength(0);
  });

  it('chuỗi đầy đủ: intro → recog (ghi FSRS, prevState New, +5 XP lần đúng đầu) → run sau không còn intro', () => {
    let state = startPlayingFromMap(
      createV1Run({ cards: [newCard], content: V1_FIXTURE_CONTENT, now: NOW }),
    );
    state = submitIntroAction(state, 'seen', NOW);
    // Chỉ còn 1 thẻ nên node recog là node kế tiếp
    const active = getActiveNode(state);
    expect(active?.face).toBe('recog');
    const prompt = active!.prompt;
    if (prompt.face !== 'recog') throw new Error('phải là recog');
    state = submitNodeAnswer(state, prompt.correctAnswer, 4000, NOW);
    expect(state.reviews).toHaveLength(1);
    expect(state.reviews[0].prevState).toBe(State.New);
    expect(state.totalXp).toBeGreaterThanOrEqual(5 + 10);
    const learned = state.updatedCards['vocab:ubiquitous#recog'];
    expect(learned.reps).toBe(1);
    expect(learned.introSeenAt).toBe(NOW.getTime());

    // Ngày sau: thẻ đã học (state ≠ New) → không intro
    const tomorrow = new Date(NOW.getTime() + 86_400_000);
    const run2 = createV1Run({
      cards: [{ ...learned, due: tomorrow.getTime() - 1000 }],
      content: V1_FIXTURE_CONTENT,
      now: tomorrow,
    });
    expect(run2.nodes[0].face).not.toBe('intro');
  });

  it('thẻ New đã introSeenAt (đóng tab giữa chừng) hiện thẳng recog, không intro lại', () => {
    const seen = { ...newCard, introSeenAt: NOW.getTime() - 1000 };
    const run = createV1Run({ cards: [seen], content: V1_FIXTURE_CONTENT, now: NOW });
    expect(run.nodes[0].face).toBe('recog');
  });

  it('mặt mở khóa recall_meaning / recall_cloze / listen_spell ở state New hiện đúng mặt của nó', () => {
    for (const face of ['recall_meaning', 'recall_cloze', 'listen_spell'] as const) {
      const card = createNewCard('vocab:curriculum', face, { now: NOW, unlocked: true });
      const run = createV1Run({ cards: [card], content: V1_FIXTURE_CONTENT, now: NOW });
      expect(run.nodes[0].face).toBe(face);
    }
  });

  it('"Tôi biết rồi" cũng đánh dấu introSeenAt cho thẻ gốc', () => {
    const run = startPlayingFromMap(
      createV1Run({ cards: [newCard], content: V1_FIXTURE_CONTENT, now: NOW }),
    );
    const after = submitIntroAction(run, 'know_already', NOW);
    expect(getActiveNode(after)?.face).toBe('recall_meaning');
    expect(after.updatedCards['vocab:ubiquitous#recog'].introSeenAt).toBe(NOW.getTime());
  });
});

describe('V1-2 · mỗi tiền tố thẻ hiển thị đúng nội dung của nó, thiếu item thì bỏ node', () => {
  const passage = readJson<ReadingPassage>('data/reading/passages/p1_001.json');
  const episode = readJson<ListeningEpisode>('data/listening/episodes/p1_001.json');

  it('tfng:<qid> → tfng_retry với đúng câu phát biểu, đoạn, đáp án', () => {
    const ref = buildReadingRef('tfng:p1_001_q01', passage, 'p1_001_q01');
    expect(ref).not.toBeNull();
    const content = withExtras({ reading: { 'tfng:p1_001_q01': ref! } });
    const card = dueCard('tfng:p1_001_q01', 'tfng_retry');
    expect(resolveV1Face(card, content)).toBe('tfng_retry');
    const prompt = buildPromptForCard('tfng:p1_001_q01', 'tfng_retry', content);
    if (prompt?.face !== 'tfng_retry') throw new Error('sai mặt');
    expect(prompt.statement).toBe(passage.questionGroups[0].questions[0].prompt);
    expect(prompt.correctAnswer).toBe('TRUE');
    expect(prompt.choices).toEqual(['TRUE', 'FALSE', 'NOT GIVEN']);
    expect(prompt.paragraphText).toContain('Standard grain crops struggle');
    const right = scorePromptAnswer(prompt, '1');
    const wrong = scorePromptAnswer(prompt, '2');
    expect(right.correct).toBe(true);
    expect(wrong.correct).toBe(false);
    expect(wrong.exampleEn).toContain('excess salt prevents roots');
  });

  it('head:<qid> → head_retry với đoạn đúng và đáp án nằm trong lựa chọn', () => {
    const ref = buildReadingRef('head:p1_001_q07', passage, 'p1_001_q07');
    expect(ref).not.toBeNull();
    const content = withExtras({ reading: { 'head:p1_001_q07': ref! } });
    const prompt = buildPromptForCard('head:p1_001_q07', 'head_retry', content);
    if (prompt?.face !== 'head_retry') throw new Error('sai mặt');
    expect(prompt.paragraphLabel).toBe('B');
    expect(prompt.choices).toHaveLength(4);
    expect(prompt.choices[prompt.correctIndex]).toBe('Early rural uses of wild marsh plants');
    expect(scorePromptAnswer(prompt, String(prompt.correctIndex + 1)).correct).toBe(true);
  });

  it('ltrap:<ep>_<qid> → ltrap_replay phát đúng đoạn bẫy của câu đó', () => {
    const qid = episode.questionGroups[0].questions[0].qid;
    const trap = episode.questionGroups[0].questions[0].traps[0];
    const ref = buildListeningRef(episode, qid);
    expect(ref).not.toBeNull();
    const itemId = `ltrap:p1_001_${qid}`;
    const content = withExtras({ listening: { [itemId]: ref! } });
    const prompt = buildPromptForCard(itemId, 'ltrap_replay', content);
    if (prompt?.face !== 'ltrap_replay') throw new Error('sai mặt');
    expect(prompt.audioUrl).toBe(episode.audio.path);
    expect(prompt.clipStart).toBe(trap.start);
    expect(prompt.clipEnd).toBe(trap.end);
    expect(prompt.acceptedAnswers).toContain('Bramwell');
    expect(scorePromptAnswer(prompt, 'bramwell').correct).toBe(true);
    expect(scorePromptAnswer(prompt, 'bramwel').correct).toBe(false);
  });

  it('dict_full → chép cả câu, sai ≥ 2 từ thì sai, đúng hoàn toàn thì đúng', () => {
    const dict = V1_FIXTURE_CONTENT.dictations[0];
    const card = dueCard(dict.id, 'dict_full');
    expect(resolveV1Face(card, V1_FIXTURE_CONTENT)).toBe('dict_full');
    const prompt = buildPromptForCard(dict.id, 'dict_full', V1_FIXTURE_CONTENT);
    if (prompt?.face !== 'dict_full') throw new Error('sai mặt');
    expect(prompt.text).toBe(dict.text);
    expect(scorePromptAnswer(prompt, dict.text).status).toBe('correct');
    expect(scorePromptAnswer(prompt, 'completely different words here').status).toBe('wrong');
    expect(scorePromptAnswer(prompt, '').status).toBe('wrong');
  });

  it('err:l1col_<col> → err_user dựng từ l1Traps của collocation (câu sai → gõ phrase)', () => {
    const col = V1_FIXTURE_CONTENT.collocations.find((c) => c.l1Traps.length > 0)!;
    const itemId = `err:l1col_${col.id.replace(/^col:/, '')}`;
    const card = dueCard(itemId, 'err_fix');
    expect(resolveV1Face(card, V1_FIXTURE_CONTENT)).toBe('err_user');
    const prompt = buildPromptForCard(itemId, 'err_user', V1_FIXTURE_CONTENT);
    if (prompt?.face !== 'err_user') throw new Error('sai mặt');
    expect(col.l1Traps.map((t) => t.wrong)).toContain(prompt.front);
    expect(prompt.back).toBe(col.phrase);
    expect(scorePromptAnswer(prompt, col.phrase).correct).toBe(true);
    expect(scorePromptAnswer(prompt, 'xyz').correct).toBe(false);
  });

  it('err:user_* có userItem → err_user hiển thị đúng câu đó; không có userItem → bị loại', () => {
    const item = userItem({ id: 'err:user_ab12' });
    const withItem = withExtras({ userItems: { [item.id]: item } });
    const card = dueCard(item.id, 'err_fix');
    expect(resolveV1Face(card, withItem)).toBe('err_user');
    const prompt = buildPromptForCard(item.id, 'err_user', withItem);
    if (prompt?.face !== 'err_user') throw new Error('sai mặt');
    expect(prompt.front).toBe('The informations are useful');
    expect(scorePromptAnswer(prompt, 'the information is useful.').correct).toBe(true);

    const missing = createV1Run({ cards: [card], content: V1_FIXTURE_CONTENT, now: NOW });
    expect(missing.nodes).toHaveLength(0);
    expect(missing.missingItems.map((m) => m.itemId)).toEqual(['err:user_ab12']);
  });

  it('không còn fallback "?? content.X[0]": id lạ → null / bỏ node, không có review nào', () => {
    expect(buildPromptForCard('vocab:khong_ton_tai', 'recog', V1_FIXTURE_CONTENT)).toBeNull();
    expect(buildPromptForCard('col:khong_ton_tai', 'col_gap', V1_FIXTURE_CONTENT)).toBeNull();
    expect(buildPromptForCard('para:khong_ton_tai', 'para_match', V1_FIXTURE_CONTENT)).toBeNull();
    expect(buildPromptForCard('err:khong_ton_tai', 'err_fix', V1_FIXTURE_CONTENT)).toBeNull();
    expect(buildPromptForCard('dict:khong_ton_tai', 'listen_spell', V1_FIXTURE_CONTENT)).toBeNull();

    const cards = [
      dueCard('vocab:khong_ton_tai', 'recall_meaning'),
      dueCard('tfng:p9_999_q01', 'tfng_retry'),
      dueCard('ltrap:p9_999_lep_p9_999_q01', 'ltrap_replay'),
      dueCard('vocab:curriculum', 'recall_meaning'),
    ];
    const run = createV1Run({ cards, content: V1_FIXTURE_CONTENT, now: NOW });
    expect(run.nodes.map((n) => n.itemId)).toEqual(['vocab:curriculum']);
    expect(run.missingItems.map((m) => m.itemId).sort()).toEqual(
      ['ltrap:p9_999_lep_p9_999_q01', 'tfng:p9_999_q01', 'vocab:khong_ton_tai'].sort(),
    );
    const answered = submitNodeAnswer(startPlayingFromMap(run), 'curriculum', 3000, NOW);
    expect(answered.reviews.map((r) => r.cardId)).toEqual(['vocab:curriculum#recall_meaning']);
  });

  it('para_match chỉ làm cho item "equivalent" (Level 4 not_equivalent không có đáp án paraphrase)', () => {
    const para = V1_FIXTURE_CONTENT.paraphrases[0];
    const notEq = {
      ...V1_FIXTURE_CONTENT,
      paraphrases: [{ ...para, id: 'para:l4_x' as const, relation: 'not_equivalent' as const }],
    };
    expect(resolveV1Face(dueCard('para:l4_x', 'para_match'), notEq)).toBeNull();
    expect(resolveV1Face(dueCard(para.id, 'para_match'), V1_FIXTURE_CONTENT)).toBe('para_match');
  });
});

describe('V1-4 / V1-5 · nhiễu và vị trí đáp án có seed', () => {
  const realVocab = readJson<VocabItem[]>('data/vocab/words.json');
  const content: V1ContentBundle = {
    vocab: realVocab,
    collocations: [],
    paraphrases: [],
    errors: [],
    dictations: [],
  };

  it('50 từ khác nhau cho ≥ 30 bộ nhiễu khác nhau, không còn chuỗi giữ chỗ', () => {
    const sets = new Set<string>();
    for (const v of realVocab.slice(0, 50)) {
      const p = buildPromptForCard(v.id, 'recog', content, 1, { seedKey: `${v.id}|0|2026-11-20` });
      if (p?.face !== 'recog') throw new Error('phải là recog');
      const distractors = p.choices.filter((_, i) => i !== p.correctIndex).sort();
      expect(distractors).toHaveLength(3);
      expect(new Set(p.choices).size).toBe(4);
      expect(p.choices.some((c) => c.includes('khái niệm học thuật khác'))).toBe(false);
      sets.add(distractors.join('|'));
    }
    expect(sets.size).toBeGreaterThanOrEqual(30);
  });

  it('nhiễu cùng từ loại và độ dài nghĩa trong ±40% khi có đủ ứng viên', () => {
    const v = realVocab.find((x) => x.pos[0] === 'v' && x.meaningVi.length >= 10)!;
    const p = buildPromptForCard(v.id, 'recog', content, 1, { seedKey: `${v.id}|0|d` });
    if (p?.face !== 'recog') throw new Error('phải là recog');
    const byMeaning = new Map(realVocab.map((x) => [x.meaningVi, x]));
    for (const [i, choice] of p.choices.entries()) {
      if (i === p.correctIndex) continue;
      const other = byMeaning.get(choice)!;
      expect(other.pos[0]).toBe('v');
      expect(Math.abs(other.meaningVi.length - v.meaningVi.length)).toBeLessThanOrEqual(
        v.meaningVi.length * 0.4 + 1,
      );
    }
  });

  it('cùng thẻ, reps 0..3 cho ≥ 2 vị trí đáp án khác nhau; cùng seed thì lặp lại y hệt', () => {
    const v = realVocab[10];
    const positions = new Set<number>();
    for (let reps = 0; reps < 4; reps++) {
      const p = buildPromptForCard(v.id, 'recog', content, 1, {
        seedKey: `${v.id}#recog|${reps}|2026-11-20|r0`,
      });
      if (p?.face !== 'recog') throw new Error('phải là recog');
      positions.add(p.correctIndex);
    }
    expect(positions.size).toBeGreaterThanOrEqual(2);

    const a = buildPromptForCard(v.id, 'recog', content, 1, { seedKey: 'same' });
    const b = buildPromptForCard(v.id, 'recog', content, 1, { seedKey: 'same' });
    expect(a).toEqual(b);
  });

  it('para_match: vị trí đáp án đổi theo seed', () => {
    const para = V1_FIXTURE_CONTENT.paraphrases[0];
    const positions = new Set<number>();
    for (let reps = 0; reps < 8; reps++) {
      const p = buildPromptForCard(para.id, 'para_match', V1_FIXTURE_CONTENT, 1, {
        seedKey: `${para.id}|${reps}|d`,
      });
      if (p?.face !== 'para_match') throw new Error('phải là para_match');
      positions.add(p.correctIndex);
      expect(p.choices[p.correctIndex]).toBe(para.target.text);
    }
    expect(positions.size).toBeGreaterThanOrEqual(2);
  });
});

describe('V1-6 · không bịa số liệu "tuần trước"', () => {
  it('lastWeekAccuracy null → câu thắng không chứa "tuần trước", có combo thật', () => {
    const text = buildV1WinStatement({
      matureOrMasteredCount: 0,
      firstAttemptAccuracy: 80,
      lastWeekAccuracy: null,
      maxCombo: 7,
    });
    expect(text).not.toContain('tuần trước');
    expect(text).toContain('80%');
    expect(text).toContain('7');
  });

  it('computeLastWeekAccuracy chỉ lấy attempt V1 đã kết thúc trong tuần liền trước', () => {
    const day = 86_400_000;
    const attempts = [
      { gameId: 'v1' as const, startedAt: NOW.getTime() - 9 * day, score: 8, total: 10, status: 'final' as const },
      { gameId: 'v1' as const, startedAt: NOW.getTime() - 10 * day, score: 6, total: 10 },
      { gameId: 'v1' as const, startedAt: NOW.getTime() - 2 * day, score: 10, total: 10 },
      { gameId: 'v2' as const, startedAt: NOW.getTime() - 9 * day, score: 1, total: 10 },
      { gameId: 'v1' as const, startedAt: NOW.getTime() - 8 * day, score: 0, total: 10, status: 'in_progress' as const },
    ];
    expect(computeLastWeekAccuracy(attempts, NOW)).toBe(70);
    expect(computeLastWeekAccuracy([], NOW)).toBeNull();
  });
});

describe('V1-8 / V1-9 / V1-10 / V1-11 / V1-12', () => {
  it('V1-9: đã học đủ thẻ mới trong ngày thì run không còn thẻ mới', () => {
    const news = [
      createNewCard('vocab:ubiquitous', 'recog', { now: NOW }),
      createNewCard('vocab:exacerbate', 'recog', { now: NOW }),
    ];
    const none = createV1Run({ cards: news, content: V1_FIXTURE_CONTENT, newCardsLimit: 15, newCardsDoneToday: 15, now: NOW });
    expect(none.nodes.filter((n) => n.isNewCard)).toHaveLength(0);
    const two = createV1Run({ cards: news, content: V1_FIXTURE_CONTENT, newCardsLimit: 15, newCardsDoneToday: 13, now: NOW });
    expect(two.nodes.filter((n) => n.isNewCard)).toHaveLength(2);
    const one = createV1Run({ cards: news, content: V1_FIXTURE_CONTENT, newCardsLimit: 15, newCardsDoneToday: 14, now: NOW });
    expect(one.nodes.filter((n) => n.isNewCard)).toHaveLength(1);
  });

  it('V1-10: gõ cụm không phải bẫy thì không gắn giải thích "kiểu Việt"', () => {
    const col = V1_FIXTURE_CONTENT.collocations.find((c) => c.l1Traps.length > 0)!;
    const prompt = buildPromptForCard(col.id, 'col_gap', V1_FIXTURE_CONTENT);
    if (prompt?.face !== 'col_gap') throw new Error('sai mặt');
    const none = scorePromptAnswer(prompt, 'xyz');
    expect(none.correct).toBe(false);
    expect(none.vnTrap).toBeUndefined();
    const trapWord = col.l1Traps[0].wrong.split(' ').find((w) => w.length >= 3)!;
    const hit = scorePromptAnswer(prompt, trapWord);
    expect(hit.vnTrap).toBe(col.l1Traps[0].whyVi);
  });

  it('V1-11: dự báo ngày mai tính tới hết ngày mai theo giờ máy', () => {
    const late = new Date(2026, 10, 20, 23, 0, 0);
    const inTomorrowEvening = createNewCard('vocab:curriculum', 'recog', { now: late });
    const dueTomorrow23 = {
      ...inTomorrowEvening,
      state: State.Review,
      due: new Date(2026, 10, 21, 22, 0, 0).getTime(),
    };
    const dueDayAfter = {
      ...createNewCard('vocab:mitigate', 'recog', { now: late }),
      state: State.Review,
      due: new Date(2026, 10, 22, 1, 0, 0).getTime(),
    };
    const start = createV1Run({
      cards: [{ ...dueDayAfter, due: late.getTime() - 1000 }, dueTomorrow23],
      content: V1_FIXTURE_CONTENT,
      now: late,
    });
    const state: V1RunState = {
      ...startPlayingFromMap(start),
      allCardsSnapshot: {
        [dueTomorrow23.id]: dueTomorrow23,
        [dueDayAfter.id]: dueDayAfter,
      },
      firstAttemptTotalCount: 1,
      currentIndex: start.nodes.length - 1,
      bossCandidateCards: [],
    };
    let finished = advanceAfterFeedback(state, late);
    while (finished.phase !== 'recap') finished = advanceAfterFeedback(finished, late);
    expect(finished.recap?.tomorrowDueForecast).toBe(1);
  });

  it('V1-12: "Đã xem" không còn +5 XP; +5 chỉ đến ở lượt recog đúng đầu tiên của thẻ mới', () => {
    const card = createNewCard('vocab:ubiquitous', 'recog', { now: NOW });
    let s = startPlayingFromMap(createV1Run({ cards: [card], content: V1_FIXTURE_CONTENT, now: NOW }));
    s = submitIntroAction(s, 'seen', NOW);
    expect(s.totalXp).toBe(0);
    const p = getActiveNode(s)!.prompt;
    if (p.face !== 'recog') throw new Error('phải là recog');
    const after = submitNodeAnswer(s, p.correctAnswer, 4000, NOW);
    expect(after.totalXp).toBe(15);
  });

  it('V1-8: retry chèn sang chặng sau không sinh checkpoint giả (chỉ 1 checkpoint cho 2 chặng)', () => {
    const cards = buildV1FixtureCards(NOW).filter((c) => c.state !== State.New);
    let state = createV1Run({ cards, content: V1_FIXTURE_CONTENT, now: NOW, newCardsLimit: 0 });
    expect(state.nodes.length).toBeGreaterThan(21);
    expect(state.totalStages).toBe(2);
    state = startPlayingFromMap(state);

    let missedOnce = false;
    let guard = 0;
    while (state.phase !== 'recap' && guard++ < 400) {
      if (state.phase === 'checkpoint') {
        state = continueFromCheckpoint(state);
        continue;
      }
      if (state.feedback) {
        state = advanceAfterFeedback(state, NOW);
        continue;
      }
      const node = getActiveNode(state);
      if (!node) break;
      if (node.face === 'intro') {
        state = submitIntroAction(state, 'seen', NOW);
        continue;
      }
      const wrongNow = !missedOnce && state.phase === 'playing' && state.currentIndex === 19;
      if (wrongNow) missedOnce = true;
      state = submitNodeAnswer(state, wrongNow ? 'zzzz' : correctAnswerOf(node.prompt), 3000, NOW);
    }
    expect(missedOnce).toBe(true);
    expect(state.phase).toBe('recap');
    expect(state.events.filter((e) => e.type === 'stage_checkpoint')).toHaveLength(1);
  });
});

function correctAnswerOf(prompt: V1PromptPayload): string {
  switch (prompt.face) {
    case 'recall_meaning':
      return prompt.headword;
    case 'recall_cloze':
    case 'col_gap':
      return prompt.primaryAnswer;
    case 'listen_spell':
      return prompt.targetWord;
    case 'err_fix':
      return prompt.expectedCorrection;
    case 'recog':
    case 'para_match':
      return prompt.correctAnswer;
    default:
      return '';
  }
}

describe('G3 · tải trọng lưu tiến độ', () => {
  it('buildV1ProgressPayload gồm thẻ đã đổi, review, XP và điểm lượt đầu', () => {
    const card = dueCard('vocab:curriculum', 'recall_meaning');
    let s = startPlayingFromMap(createV1Run({ cards: [card], content: V1_FIXTURE_CONTENT, now: NOW }));
    s = submitNodeAnswer(s, 'curriculum', 3000, NOW);
    const payload = buildV1ProgressPayload(s, new Date(NOW.getTime() + 5000));
    expect(payload.attempt.gameId).toBe('v1');
    expect(payload.attempt.score).toBe(1);
    expect(payload.attempt.endedAt).toBe(NOW.getTime() + 5000);
    expect(payload.attempt.xp).toBe(s.totalXp);
    expect(payload.reviews).toHaveLength(1);
    expect(payload.reviews[0].rating).toBeGreaterThanOrEqual(Rating.Good);
    expect(payload.updatedCards.map((c) => c.id)).toContain('vocab:curriculum#recall_meaning');
  });
});

describe('V1-3 · bộ thẻ khởi động dùng từ thật, không dùng fixture', () => {
  it('buildStarterVocabCards chọn 15 từ B2/C1 thật từ words.json, thẻ recog mới, không source fixture', () => {
    const realVocab = readJson<VocabItem[]>('data/vocab/words.json');
    const cards = buildStarterVocabCards(realVocab, NOW);
    expect(cards).toHaveLength(15);
    const ids = new Set<string>(realVocab.map((v) => v.id));
    for (const c of cards) {
      expect(ids.has(c.itemId)).toBe(true);
      expect(c.face).toBe('recog');
      expect(c.state).toBe(State.New);
      expect(c.source).not.toBe('fixture');
    }
    expect(new Set(cards.map((c) => c.itemId)).size).toBe(15);
  });
});
