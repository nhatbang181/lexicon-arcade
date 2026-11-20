export interface BadgeStats {
  totalSessions: number;
  streakCount: number;
  matureItemsCount: number;
  masteredItemsCount: number;
  trapsCaughtCount: number;
  essaysRevisedCount: number;
  mockExamsCompleted: number;
  rareCardsSolved: number;
  bestTfngSessionAccuracy: number; // 0..1
  estimatedOverallBand: number | null;
}

export interface BadgeDefinition {
  id: string;
  titleVi: string;
  descriptionVi: string;
  category: 'habit' | 'vocab' | 'listening' | 'reading' | 'writing' | 'exam';
  check: (stats: BadgeStats) => boolean;
}

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    id: 'first_step',
    titleVi: 'Khởi hành',
    descriptionVi: 'Hoàn thành phiên học đầu tiên.',
    category: 'habit',
    check: (s) => s.totalSessions >= 1,
  },
  {
    id: 'streak_7',
    titleVi: 'Nhịp 7 ngày',
    descriptionVi: 'Duy trì chuỗi học 7 ngày liên tiếp.',
    category: 'habit',
    check: (s) => s.streakCount >= 7,
  },
  {
    id: 'streak_30',
    titleVi: 'Thói quen bền bỉ',
    descriptionVi: 'Duy trì chuỗi học 30 ngày liên tiếp.',
    category: 'habit',
    check: (s) => s.streakCount >= 30,
  },
  {
    id: 'vocab_100_mature',
    titleVi: '100 từ chắc gốc',
    descriptionVi: 'Đưa 100 item lên mức Mature (stability ≥ 21 ngày).',
    category: 'vocab',
    check: (s) => s.matureItemsCount >= 100,
  },
  {
    id: 'vocab_600_mature',
    titleVi: 'Nền tảng G1',
    descriptionVi: 'Đạt 600 item mức Mature — hoàn thành mục tiêu giai đoạn G1.',
    category: 'vocab',
    check: (s) => s.matureItemsCount >= 600,
  },
  {
    id: 'rare_hunter',
    titleVi: 'Săn thẻ hiếm',
    descriptionVi: 'Giải đúng 5 thẻ hiếm ở mức Mastered.',
    category: 'vocab',
    check: (s) => s.rareCardsSolved >= 5,
  },
  {
    id: 'trap_hunter',
    titleVi: 'Thợ săn bẫy nghe',
    descriptionVi: 'Bắt trúng 20 bẫy Listening (self-correction, distractor...).',
    category: 'listening',
    check: (s) => s.trapsCaughtCount >= 20,
  },
  {
    id: 'tfng_sharp',
    titleVi: 'Thẩm phán TFNG',
    descriptionVi: 'Đạt độ chính xác ≥ 90% trong một phiên TFNG Judge.',
    category: 'reading',
    check: (s) => s.bestTfngSessionAccuracy >= 0.9,
  },
  {
    id: 'essay_reviser',
    titleVi: 'Sửa bài lên band',
    descriptionVi: 'Hoàn thành vòng sửa bài Writing sau khi nhận góp ý.',
    category: 'writing',
    check: (s) => s.essaysRevisedCount >= 1,
  },
  {
    id: 'first_mock',
    titleVi: 'Phòng thi thật',
    descriptionVi: 'Hoàn thành bài thi thử đầu tiên ở Exam Room (X1).',
    category: 'exam',
    check: (s) => s.mockExamsCompleted >= 1,
  },
  {
    id: 'band_7_0',
    titleVi: 'Cột mốc 7.0',
    descriptionVi: 'Band ước lượng Overall đạt từ 7.0 trở lên.',
    category: 'exam',
    check: (s) => s.estimatedOverallBand !== null && s.estimatedOverallBand >= 7.0,
  },
  {
    id: 'band_8_0',
    titleVi: 'Đích đến 8.0',
    descriptionVi: 'Band ước lượng Overall chạm mốc 8.0 Academic.',
    category: 'exam',
    check: (s) => s.estimatedOverallBand !== null && s.estimatedOverallBand >= 8.0,
  },
];

/**
 * Evaluate which badges are newly earned given current stats and already unlocked badge IDs.
 */
export function evaluateNewBadges(
  stats: BadgeStats,
  alreadyUnlockedIds: readonly string[],
): BadgeDefinition[] {
  const unlocked = new Set(alreadyUnlockedIds);
  return BADGE_DEFINITIONS.filter((b) => !unlocked.has(b.id) && b.check(stats));
}
