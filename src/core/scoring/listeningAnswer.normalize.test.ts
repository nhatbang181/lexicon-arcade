import { describe, expect, it } from 'vitest';
import {
  canonicalizeIeltsExpression,
  collapseDigitGroups,
  countIeltsTokens,
  parseSpokenTime,
  scoreListeningAnswer,
} from './listeningAnswer';

const TWO_AND_NUMBER = 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.';
const TWO_WORDS = 'Write NO MORE THAN TWO WORDS for each answer.';
const ONE_WORD = 'Write ONE WORD ONLY for each answer.';
const NUMBER_ONLY = 'Write A NUMBER ONLY.';

describe('T2-B · chuẩn hoá đáp án Listening (L1-02..L1-06)', () => {
  describe('L1-02 · số điện thoại / mã gõ theo nhóm chữ số', () => {
    it('gộp nhóm chữ số cách nhau bằng dấu cách hoặc gạch nối khi ≥ 6 chữ số', () => {
      expect(collapseDigitGroups('07741 829 360')).toBe('07741829360');
      expect(collapseDigitGroups('0121-496-0123')).toBe('01214960123');
      expect(collapseDigitGroups('10 30')).toBe('10 30');
      expect(collapseDigitGroups('2024-25')).toBe('2024-25');
    });

    it('"07741 829 360" đếm là 1 số và khớp "07741829360" (không word_limit_exceeded)', () => {
      expect(countIeltsTokens('07741 829 360')).toEqual({ wordCount: 0, numberCount: 1 });
      const res = scoreListeningAnswer('07741 829 360', ['07741829360'], { wordLimit: TWO_AND_NUMBER });
      expect(res.correct).toBe(true);
      expect(res.reason).not.toBe('word_limit_exceeded');
    });

    it('đáp án chấp nhận có dấu cách vẫn khớp khi người học gõ liền một khối', () => {
      expect(scoreListeningAnswer('07741829360', ['07741 829 360'], { wordLimit: NUMBER_ONLY }).correct).toBe(true);
    });

    it('thiếu một chữ số thì vẫn sai', () => {
      expect(scoreListeningAnswer('07741 829 36', ['07741829360'], { wordLimit: TWO_AND_NUMBER }).correct).toBe(false);
    });
  });

  describe('L1-03 · giờ "9.30" = "9:30"', () => {
    it.each([
      ['9.30', '9:30'],
      ['9:30', '9:30'],
      ['9.30am', '9:30 am'],
      ['09.30', '9:30'],
      ['9.30 a.m.', '9:30 am'],
    ])('"%s" khớp "%s"', (typed, accepted) => {
      expect(scoreListeningAnswer(typed, [accepted]).correct).toBe(true);
    });

    it('giờ khác vẫn sai và số thập phân tiền không bị coi là giờ', () => {
      expect(scoreListeningAnswer('9.45', ['9:30']).correct).toBe(false);
      expect(canonicalizeIeltsExpression('£12.50').canonical).toBe('12.50 pounds');
      expect(canonicalizeIeltsExpression('3.75').canonical).toBe('3.75');
    });
  });

  describe('L1-04 · giờ nói bằng chữ', () => {
    it.each([
      ['nine thirty', '9:30'],
      ['half past nine', '9:30'],
      ['quarter to ten', '9:45'],
      ['quarter past ten', '10:15'],
      ['nine forty five', '9:45'],
      ['nine oh five', '9:05'],
      ["nine o'clock", '9:00'],
    ])('"%s" khớp %s', (typed, accepted) => {
      expect(scoreListeningAnswer(typed, [accepted]).correct).toBe(true);
    });

    it('"nine thirty" không còn bị hiểu là 39 và đếm là 1 số', () => {
      expect(scoreListeningAnswer('nine thirty', ['39']).correct).toBe(false);
      expect(countIeltsTokens('nine thirty')).toEqual({ wordCount: 0, numberCount: 1 });
      expect(parseSpokenTime(['half', 'past', 'one'], 0)).toEqual({ text: '1:30', consumed: 3 });
      expect(parseSpokenTime(['quarter', 'to', 'one'], 0)).toEqual({ text: '12:45', consumed: 3 });
    });
  });

  describe('L1-05 · đơn vị/tiền in sẵn cạnh ô trống', () => {
    it('"£12.50" = "12.50" khi có promptUnit £', () => {
      expect(scoreListeningAnswer('£12.50', ['12.50'], { promptUnit: '£' }).correct).toBe(true);
      expect(scoreListeningAnswer('12.50', ['£12.50'], { promptUnit: '£' }).correct).toBe(true);
    });

    it('không có promptUnit: người học thêm ký hiệu tiền thì vẫn đúng, số sai vẫn sai', () => {
      expect(scoreListeningAnswer('£12.50', ['12.50']).correct).toBe(true);
      expect(scoreListeningAnswer('$20', ['20']).correct).toBe(true);
      expect(scoreListeningAnswer('£12.60', ['12.50'], { promptUnit: '£' }).correct).toBe(false);
    });

    it('% và km in sẵn', () => {
      expect(scoreListeningAnswer('50%', ['50'], { promptUnit: '%' }).correct).toBe(true);
      expect(scoreListeningAnswer('5 km', ['5'], { promptUnit: 'km' }).correct).toBe(true);
      expect(scoreListeningAnswer('5', ['5 km'], { promptUnit: 'km' }).correct).toBe(true);
    });
  });

  describe('L1-06 · giới hạn từ với từ chỉ thứ tự / số bằng chữ', () => {
    it('"second floor" hợp lệ dưới "NO MORE THAN TWO WORDS"', () => {
      const res = scoreListeningAnswer('second floor', ['second floor'], { wordLimit: TWO_WORDS });
      expect(res.correct).toBe(true);
      expect(res.reason).toBe('exact');
      expect(countIeltsTokens('second floor', { numberWordsAsWords: true })).toEqual({ wordCount: 2, numberCount: 0 });
    });

    it('"first" hợp lệ dưới "ONE WORD ONLY", nhưng 3 từ vẫn vượt giới hạn', () => {
      expect(scoreListeningAnswer('first', ['first'], { wordLimit: ONE_WORD }).correct).toBe(true);
      const over = scoreListeningAnswer('the second floor', ['second floor'], { wordLimit: TWO_WORDS });
      expect(over.correct).toBe(false);
      expect(over.reason).toBe('word_limit_exceeded');
    });

    it('chữ số thật vẫn là số: "2 floor" vượt giới hạn "TWO WORDS" (không có số)', () => {
      expect(scoreListeningAnswer('2 floor', ['2 floor'], { wordLimit: TWO_WORDS }).reason).toBe('word_limit_exceeded');
    });

    it('khi cho phép số, "second floor" vẫn tính 1 số + 1 từ', () => {
      expect(scoreListeningAnswer('second floor', ['second floor'], { wordLimit: TWO_AND_NUMBER }).correct).toBe(true);
    });
  });

  describe('hoa/thường, khoảng trắng, gạch nối, biến thể chính tả', () => {
    it('bỏ qua HOA/thường, khoảng trắng thừa và dấu chấm cuối', () => {
      expect(scoreListeningAnswer('  GYM   induction. ', ['gym induction'], { wordLimit: TWO_WORDS }).correct).toBe(true);
    });

    it('từ ghép có gạch nối đếm là 1 từ và giữ nguyên khi khớp', () => {
      expect(scoreListeningAnswer('Check-In', ['check-in'], { wordLimit: ONE_WORD }).correct).toBe(true);
    });

    it('biến thể Anh/Mỹ trong cụm nhiều từ', () => {
      expect(scoreListeningAnswer('city center', ['city centre'], { wordLimit: TWO_WORDS }).correct).toBe(true);
    });

    it('số chữ ↔ số: "twenty five" khớp "25", "fifteen" khớp "15"', () => {
      expect(scoreListeningAnswer('twenty five', ['25'], { wordLimit: NUMBER_ONLY }).correct).toBe(true);
      expect(scoreListeningAnswer('15', ['fifteen'], { wordLimit: NUMBER_ONLY }).correct).toBe(true);
    });

    it('chính tả lệch 1 chữ vẫn bị tính sai (đúng luật IELTS)', () => {
      const res = scoreListeningAnswer('Wednesdy', ['Wednesday'], { wordLimit: ONE_WORD });
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('minor_spelling_error');
    });

    it('số có dấu phẩy hàng nghìn đơn lẻ ở cuối chuỗi ("1,500", "10,000", "1,500,000") đếm là 1 số dưới maxNumbers=1', () => {
      expect(countIeltsTokens('1,500')).toEqual({ wordCount: 0, numberCount: 1 });
      expect(countIeltsTokens('10,000')).toEqual({ wordCount: 0, numberCount: 1 });
      expect(countIeltsTokens('1,500,000')).toEqual({ wordCount: 0, numberCount: 1 });

      const r1 = scoreListeningAnswer('1,500', ['1500'], { wordLimit: NUMBER_ONLY });
      expect(r1.correct).toBe(true);
      expect(r1.reason).not.toBe('word_limit_exceeded');

      const r2 = scoreListeningAnswer('10,000', ['10,000'], { wordLimit: TWO_AND_NUMBER });
      expect(r2.correct).toBe(true);
      expect(r2.reason).not.toBe('word_limit_exceeded');
    });

    it('"9:00 am" ở cuối chuỗi giữ nguyên giờ kèm am/pm, không bị rút gọn thành "9 am"', () => {
      expect(canonicalizeIeltsExpression('9:00 am').canonical).toBe('9:00 am');
      expect(canonicalizeIeltsExpression('9:00 pm').canonical).toBe('9:00 pm');
      expect(canonicalizeIeltsExpression('9:00').canonical).toBe('9');
    });
  });
});
