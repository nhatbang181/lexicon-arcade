import { describe, expect, it } from 'vitest';
import { createNewCard, makeCardId } from '../../core/srs/fsrsAdapter';
import {
  V2_FIXTURE_COLLOCATIONS,
  V2_FIXTURE_VOCAB,
} from '../../test/fixtures/v2v3_fixtures';
import {
  V2_NUNG_PREVIEW_COUNT,
  V2_RETRY_MAX_ITEMS,
  advanceFromNung,
  buildHeadwordForges,
  buildNungChoices,
  buildToiRounds,
  buildV2ProgressSnapshot,
  confirmToiSpot,
  createV2RetrySession,
  createV2Session,
  detectUsedCollocations,
  getComboMultiplier,
  makeL1ErrorItemId,
  nextDapQuestion,
  nextToiRound,
  selectToiCard,
  submitDapAnswer,
  submitSprintAnswer,
  submitToiFix,
  toggleToiCard,
} from './engine';

const NOW = 1_800_000_000_000;

function impactForge() {
  const forges = buildHeadwordForges(V2_FIXTURE_COLLOCATIONS, V2_FIXTURE_VOCAB);
  return forges.find((f) => f.headword === 'impact')!;
}

describe('V2-1/V2-5 · Nung không lộ đáp án và vị trí bẫy xáo theo seed', () => {
  it('câu nhận diện KHÁC câu ở màn xem mẫu (không còn "bấm 1+3 là thắng")', () => {
    const forge = impactForge();
    const previewSentences = new Set(
      forge.collocations.slice(0, V2_NUNG_PREVIEW_COUNT).map((c) => c.example),
    );
    for (let i = 0; i < 20; i++) {
      const choices = buildNungChoices(forge, `seed-${i}`);
      const fresh = choices.filter((c) => c.isCorrect);
      expect(fresh).toHaveLength(2);
      for (const c of fresh) expect(previewSentences.has(c.sentence)).toBe(false);
    }
  });

  it('20 phiên seed khác nhau: câu bẫy xuất hiện ở cả 3 vị trí', () => {
    const forge = impactForge();
    const positions = new Set<number>();
    for (let i = 0; i < 20; i++) {
      const trapIdx = buildNungChoices(forge, `seed-${i}`).findIndex((c) => !c.isCorrect);
      positions.add(trapIdx);
    }
    expect([...positions].sort()).toEqual([0, 1, 2]);
  });

  it('cùng seed cho cùng kết quả', () => {
    const forge = impactForge();
    expect(buildNungChoices(forge, 'abc')).toEqual(buildNungChoices(forge, 'abc'));
  });

  it('vòng Tôi: thẻ bẫy không luôn ở cùng vị trí', () => {
    const forge = impactForge();
    const seen = new Set<number>();
    for (let i = 0; i < 20; i++) {
      for (const round of buildToiRounds(forge, 2, `s${i}`)) {
        seen.add(round.cards.findIndex((c) => c.isTrap));
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

describe('V2-3 · XP sprint theo bậc combo, có trần', () => {
  it('getComboMultiplier: ×1 / ×2 (5 đúng liền) / ×3 (10 đúng liền)', () => {
    expect(getComboMultiplier(4)).toBe(1);
    expect(getComboMultiplier(5)).toBe(2);
    expect(getComboMultiplier(10)).toBe(3);
    expect(getComboMultiplier(99)).toBe(3);
  });

  it('30 câu đúng liền cho XP ≤ 900 (thay vì 4650)', () => {
    const forge = impactForge();
    let state = createV2Session({
      mode: 'sprint',
      forge,
      allCollocations: V2_FIXTURE_COLLOCATIONS,
      nowMs: NOW,
    });
    for (let i = 0; i < 30; i++) {
      const q = state.sprintQuestions[state.sprintIndex % state.sprintQuestions.length];
      state = submitSprintAnswer(state, q.gap.primary, 1500, NOW + i * 2000).state;
    }
    expect(state.correctCount).toBe(30);
    expect(state.xp).toBeLessThanOrEqual(900);
    expect(state.xp).toBe(4 * 10 + 5 * 20 + 21 * 30); // combo 1–4 ×1, 5–9 ×2, 10–30 ×3
  });
});

describe('V2-7 · Sprint chỉ chấm FSRS mỗi thẻ 1 lần', () => {
  it('pool 10 thẻ, 40 câu đúng: reviews ≤ 10 nhưng XP vẫn cộng đủ', () => {
    const forge = impactForge();
    const cols = V2_FIXTURE_COLLOCATIONS.slice(0, 10);
    const cards = cols.map((c) => createNewCard(c.id, 'col_gap', { now: new Date(NOW) }));
    let state = createV2Session({
      mode: 'sprint',
      forge,
      allCollocations: cols,
      existingCards: cards,
      nowMs: NOW,
    });
    for (let i = 0; i < 40; i++) {
      const q = state.sprintQuestions[state.sprintIndex % state.sprintQuestions.length];
      state = submitSprintAnswer(state, q.gap.primary, 1500, NOW + i * 1000).state;
    }
    expect(state.reviews.length).toBeLessThanOrEqual(10);
    expect(state.reviews.length).toBeGreaterThan(0);
    expect(state.xp).toBeGreaterThan(0);
  });

  it('pool sprint ưu tiên thẻ col_gap đã có, mỗi cụm chỉ xuất hiện một lần trong 1 vòng', () => {
    const forge = impactForge();
    const cols = V2_FIXTURE_COLLOCATIONS;
    const cards = cols.slice(0, 7).map((c) => createNewCard(c.id, 'col_gap', { now: new Date(NOW) }));
    const state = createV2Session({
      mode: 'sprint',
      forge,
      allCollocations: cols,
      existingCards: cards,
      nowMs: NOW,
    });
    const ids = state.sprintQuestions.map((q) => q.collocation.id);
    expect(new Set(ids).size).toBe(ids.length);
    const owned = new Set(cards.map((c) => c.itemId));
    expect(ids.slice(0, 7).every((id) => owned.has(id))).toBe(true);
  });
});

describe('V2-6 · câu Đập sai quay lại 1 lần, không tính điểm lần 2', () => {
  it('sai câu 1: câu đó xuất hiện lại ở cuối hàng; trả lời lại không XP/FSRS thêm', () => {
    const forge = impactForge();
    let state = createV2Session({ forge, level: 2, nowMs: NOW });
    state = advanceFromNung(state).state;
    const total = state.dapQuestions.length;
    const firstCol = state.dapQuestions[0].collocation.id;

    state = submitDapAnswer(state, 'zzzz', 3000, NOW).state;
    expect(state.dapQuestions).toHaveLength(total + 1);
    expect(state.dapQuestions[total].collocation.id).toBe(firstCol);
    expect(state.dapQuestions[total].isRequeue).toBe(true);
    const reviewsAfterWrong = state.reviews.length;
    state = nextDapQuestion(state).state;

    // làm hết các câu còn lại đúng, tới câu chèn lại
    while (state.dapIndex < total) {
      state = submitDapAnswer(state, state.dapQuestions[state.dapIndex].gap.primary, 3000, NOW).state;
      state = nextDapQuestion(state).state;
    }
    const xpBefore = state.xp;
    const reviewsBefore = state.reviews.length;
    expect(state.dapQuestions[state.dapIndex].isRequeue).toBe(true);
    state = submitDapAnswer(state, state.dapQuestions[state.dapIndex].gap.primary, 3000, NOW).state;
    expect(state.xp).toBe(xpBefore);
    expect(state.reviews).toHaveLength(reviewsBefore);
    expect(reviewsAfterWrong).toBeGreaterThan(0);
    expect(state.mistakes.filter((m) => m.stage === 'dap')).toHaveLength(1);
    state = nextDapQuestion(state).state;
    expect(state.stage).toBe('toi');
  });
});

describe('V2-4/V2-8 · vòng Tôi nhiều bẫy và gộp review', () => {
  function toiStateWithTwoTraps() {
    const forge = impactForge();
    let state = createV2Session({ forge, level: 5, nowMs: NOW });
    const round = state.toiRounds.find((r) => r.trapCount >= 2);
    expect(round).toBeDefined();
    const idx = state.toiRounds.indexOf(round!);
    state = { ...state, stage: 'toi', toiIndex: idx };
    return { state, round: round! };
  }

  it('level ≥ 4 có vòng 2 bẫy', () => {
    const { round } = toiStateWithTwoTraps();
    expect(round.cards.filter((c) => c.isTrap)).toHaveLength(2);
    expect(round.cards).toHaveLength(4);
  });

  it('chọn đúng cả 2 bẫy thì +20 XP; chọn 1 thì +10 XP và đánh dấu bẫy bị sót', () => {
    const { state, round } = toiStateWithTwoTraps();
    const [t1, t2] = round.cards.filter((c) => c.isTrap);

    let both = toggleToiCard(state, t1.index).state;
    both = toggleToiCard(both, t2.index).state;
    const bothRes = confirmToiSpot(both, NOW);
    expect(bothRes.state.xp - state.xp).toBe(20);
    expect(bothRes.state.toiRounds[state.toiIndex].spotCorrect).toBe(true);
    expect(bothRes.state.toiRounds[state.toiIndex].missedTrapIndices).toEqual([]);

    const one = toggleToiCard(state, t1.index).state;
    const oneRes = confirmToiSpot(one, NOW);
    expect(oneRes.state.xp - state.xp).toBe(10);
    const r = oneRes.state.toiRounds[state.toiIndex];
    expect(r.spotCorrect).toBe(false);
    expect(r.missedTrapIndices).toEqual([t2.index]);
    expect(r.step).toBe('type_fix');
    // bẫy bị sót có thẻ lỗi để ôn lại
    expect(oneRes.state.srsCards[makeCardId(makeL1ErrorItemId(t2.collocationId), 'err_fix')]).toBeDefined();
  });

  it('bấm 1 thẻ ở vòng nhiều bẫy chỉ bật/tắt chọn, chưa chấm', () => {
    const { state, round } = toiStateWithTwoTraps();
    const res = selectToiCard(state, round.cards[0].index);
    expect(res.state.xp).toBe(state.xp);
    expect(res.state.toiRounds[state.toiIndex].step).toBe('spot');
    expect(res.state.toiRounds[state.toiIndex].selectedIndices).toEqual([round.cards[0].index]);
  });

  it('bấm sai thẻ rồi gõ sửa sai: chỉ 1 review Again cho thẻ lỗi (không đôi)', () => {
    const forge = impactForge();
    let state = createV2Session({ forge, level: 2, nowMs: NOW });
    state = { ...state, stage: 'toi' };
    const round = state.toiRounds[0];
    const valid = round.cards.find((c) => !c.isTrap)!;
    state = selectToiCard(state, valid.index, NOW).state;
    state = submitToiFix(state, 'sai bet', NOW + 1000).state;
    const errCard = makeCardId(
      makeL1ErrorItemId(round.cards.find((c) => c.isTrap)!.collocationId),
      'err_fix',
    );
    expect(state.reviews.filter((r) => r.cardId === errCard)).toHaveLength(1);
  });
});

describe('V2-2/G4 · Ôn lại câu sai', () => {
  function finishedWithMistakes() {
    const forge = impactForge();
    let state = createV2Session({ forge, level: 2, nowMs: NOW });
    state = advanceFromNung(state).state;
    // sai 7 câu Đập liên tiếp
    for (let i = 0; i < 7 && state.stage === 'dap'; i++) {
      state = submitDapAnswer(state, 'zzzz', 2000, NOW + i).state;
      state = nextDapQuestion(state, NOW + i).state;
    }
    return state;
  }

  it('phiên retry có tối đa 5 câu, XP 0, 0 review, không tạo thẻ, không ghi attempt', () => {
    const prev = finishedWithMistakes();
    expect(prev.mistakes.length).toBeGreaterThan(V2_RETRY_MAX_ITEMS);
    let retry = createV2RetrySession(prev, NOW + 10_000);
    expect(retry.isRetry).toBe(true);
    expect(retry.dapQuestions.length + retry.toiRounds.length).toBeLessThanOrEqual(V2_RETRY_MAX_ITEMS);

    while (retry.stage === 'dap') {
      retry = submitDapAnswer(retry, retry.dapQuestions[retry.dapIndex].gap.primary, 2000, NOW).state;
      retry = nextDapQuestion(retry, NOW).state;
    }
    while (retry.stage === 'toi') {
      const round = retry.toiRounds[retry.toiIndex];
      const trap = round.cards.find((c) => c.isTrap)!;
      retry = selectToiCard(retry, trap.index, NOW).state;
      retry = submitToiFix(retry, trap.correctPhrase, NOW).state;
      retry = nextToiRound(retry, NOW).state;
    }
    expect(retry.stage).toBe('recap');
    expect(retry.xp).toBe(0);
    expect(retry.reviews).toHaveLength(0);
    expect(Object.keys(retry.srsCards)).toHaveLength(0);
    expect(buildV2ProgressSnapshot(retry)).toBeNull();
  });

  it('phiên retry sai thêm cũng không ghi review / thẻ lỗi', () => {
    const prev = finishedWithMistakes();
    let retry = createV2RetrySession(prev, NOW + 10_000);
    retry = submitDapAnswer(retry, 'zzzz', 2000, NOW).state;
    expect(retry.reviews).toHaveLength(0);
    expect(retry.dapQuestions).toHaveLength(createV2RetrySession(prev, NOW + 10_000).dapQuestions.length);
  });
});

describe('V2-10 · Tự viết phải chứa cả cụm', () => {
  const targets = [
    V2_FIXTURE_COLLOCATIONS.find((c) => c.id === 'col:profound_impact_on')!,
    V2_FIXTURE_COLLOCATIONS.find((c) => c.id === 'col:detrimental_impact_on')!,
  ];

  it('chỉ có từ gap ("have", "make") thì chưa tính là dùng cụm', () => {
    expect(detectUsedCollocations('I have a dog and make tea every day.', targets)).toEqual([]);
  });

  it('chứa đủ cụm (bỏ mạo từ, cho biến hình động từ) thì tính', () => {
    expect(
      detectUsedCollocations('Plastic bags had a profound impact on marine life.', targets),
    ).toEqual([targets[0].phrase]);
    expect(
      detectUsedCollocations('Cars have a detrimental impact on city air.', targets),
    ).toEqual([targets[1].phrase]);
  });
});

describe('G3/G1 · ảnh chụp tiến độ để ghi xuống DB', () => {
  it('chỉ gồm thẻ đã đổi và nội dung thẻ lỗi err:l1col_* (producer)', () => {
    const forge = impactForge();
    let state = createV2Session({ forge, level: 2, nowMs: NOW });
    expect(buildV2ProgressSnapshot(state)).toBeNull();
    state = advanceFromNung(state).state;
    state = submitDapAnswer(state, 'make', 2000, NOW).state; // bẫy kiểu Việt của "have a profound impact on"
    const snap = buildV2ProgressSnapshot(state, NOW + 5)!;
    expect(snap.progress.attempt.gameId).toBe('v2');
    expect(snap.progress.reviews).toHaveLength(state.reviews.length);
    expect(snap.progress.updatedCards!.length).toBeLessThanOrEqual(state.reviews.length);
    const errId = makeL1ErrorItemId(state.dapQuestions[0].collocation.id);
    expect(snap.items.map((i) => i.id)).toContain(errId);
    const item = snap.items.find((i) => i.id === errId)!;
    expect(item.kind).toBe('collocation');
    expect(item.back).toBe(state.dapQuestions[0].collocation.phrase);
    expect(item.front.length).toBeGreaterThan(0);
  });
});
