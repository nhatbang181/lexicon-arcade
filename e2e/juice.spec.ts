import { test } from '@playwright/test';

/**
 * KIEM-THU §2.2 mục 9 (J1, J2): mỗi dòng của bảng `03-ANIMATION-FEEDBACK.md` §3 phải có ≥ 3 kênh
 * phản hồi trong 600 ms sau thao tác. KHUNG cho đợt 4 (T4-A/B/C); trước đó để `test.fixme`.
 *
 * Cách làm mỗi dòng (khi đợt 4 có dữ liệu):
 *   1. vào trạng thái bằng thao tác thật (bấm đáp án, gõ đúng, hoàn thành phiên...);
 *   2. trong 600 ms kiểm: (a) có animation transform/opacity đang chạy (`document.getAnimations()`),
 *      (b) spy `sfxEngine.play` đúng cue, (c) spy `fx.emit` / `numberPop` / `celebrate`;
 *   3. đếm kênh khác nhau, đòi ≥ 3; riêng L1/L2/W1/W2 đang nghe/viết thì đòi im lặng có chủ đích (J3).
 * Không thêm `test.skip`; muốn bật dòng nào thì đổi `test.fixme` thành `test`.
 */

const INTERACTIONS = [
  'chọn đáp án đúng',
  'chọn đáp án sai',
  'combo +1',
  'thẻ lật',
  'hoàn thành phiên (Recap)',
  'lên cấp',
  'nhận huy hiệu',
  'xong việc trong ngày',
] as const;

test.describe('Juice ≥ 3 kênh (đợt 4)', () => {
  for (const name of INTERACTIONS) {
    test.fixme(`${name}: ≥ 3 kênh trong 600 ms`, async () => {
      // Bật khi có `fx/` và `sfxEngine` spy ở T3-A / T4-*.
    });
  }

  test.fixme('Recap: số đếm kiểu Balatro, ≤ 1,2 s tới câu kế sau khi đúng', async () => {
    // J2: đúng → câu kế ≤ 1,2 s.
  });
});
