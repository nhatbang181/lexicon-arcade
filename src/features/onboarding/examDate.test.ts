import { describe, expect, it } from 'vitest';
import { isoToVnDate, maskVnDate, vnDateToIso } from './OnboardingScreen';

describe('ngày thi dd/mm/yyyy (D10)', () => {
  it('chèn dấu / khi gõ số liền', () => {
    expect(maskVnDate('1')).toBe('1');
    expect(maskVnDate('150')).toBe('15/0');
    expect(maskVnDate('15032027')).toBe('15/03/2027');
    expect(maskVnDate('15/03/2027999')).toBe('15/03/2027');
  });
  it('đổi qua lại với ISO, từ chối ngày không có trên lịch', () => {
    expect(vnDateToIso('15/03/2027')).toBe('2027-03-15');
    expect(vnDateToIso('29/02/2028')).toBe('2028-02-29');
    expect(vnDateToIso('29/02/2027')).toBeNull();
    expect(vnDateToIso('31/04/2027')).toBeNull();
    expect(vnDateToIso('15/03')).toBeNull();
    expect(isoToVnDate('2027-03-15')).toBe('15/03/2027');
    expect(isoToVnDate('')).toBe('');
  });
});
