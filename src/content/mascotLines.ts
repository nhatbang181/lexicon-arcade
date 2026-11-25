export type MascotState =
  | 'idle'
  | 'chao'
  | 'co-vu'
  | 'vui'
  | 'an-mung'
  | 'dong-vien'
  | 'suy-nghi'
  | 'ngu';

export interface MascotContext {
  dueCount?: number;
  estMinutes?: number;
  streakDays?: number;
  nextMilestoneDays?: number;
  accuracyPct?: number;
  combo?: number;
  weakSkillVi?: string;
  dailyGoalMin?: number;
  bandFrom?: number;
  bandTo?: number;
}

export const MASCOT_STATES: readonly MascotState[] = [
  'idle',
  'chao',
  'co-vu',
  'vui',
  'an-mung',
  'dong-vien',
  'suy-nghi',
  'ngu',
] as const;

export const MASCOT_STATE_ALT_VI: Record<MascotState, string> = {
  idle: 'đang sẵn sàng đồng hành',
  chao: 'đang vẫy tay chào bạn',
  'co-vu': 'đang cổ vũ bạn bắt đầu',
  vui: 'đang vui vì tiến bộ của bạn',
  'an-mung': 'đang ăn mừng cột mốc mới',
  'dong-vien': 'đang động viên bạn tiếp tục',
  'suy-nghi': 'đang suy nghĩ cùng bạn',
  ngu: 'đang nghỉ ngơi nhẹ nhàng',
};

/** Lời thoại mặc định (≤ 12 từ, tiếng Việt tự nhiên, không thuật ngữ nội bộ). */
export const MASCOT_DEFAULT_LINES: Record<MascotState, string> = {
  idle: 'Hôm nay bạn muốn khởi động kỹ năng nào trước?',
  chao: 'Chào bạn! Sẵn sàng làm một lượt ngắn hôm nay nhé.',
  'co-vu': 'Bắt đầu 5 phút trước, vào nhịp sẽ nhanh thôi.',
  vui: 'Nhịp trả lời hôm nay rất chắc tay rồi đó!',
  'an-mung': 'Chạm mốc mới rồi! Bạn giữ đà quá tốt.',
  'dong-vien': 'Câu khó là chuyện bình thường, xem lại đáp án nhé.',
  'suy-nghi': 'Chờ chút, mình đang sắp xếp bài tiếp theo cho bạn.',
  ngu: 'Hết thẻ hôm nay rồi, nghỉ ngơi cho nhớ sâu nhé.',
};

/** Mẹo học ngắn khi người học chạm vào Lexi (≤ 12 từ, không sến). */
export const MASCOT_TAP_TIPS: readonly string[] = [
  'Đọc to từ mới một lần sẽ nhớ mặt chữ nhanh hơn.',
  'Khi nghe bẫy, để ý các từ đảo ý như "however" và "actually".',
  'Đừng đoán vội ở bài đọc, luôn đối chiếu đúng câu bằng chứng.',
  'Mỗi ngày 15 phút đều đặn hiệu quả hơn dồn cuối tuần.',
  'Gặp cụm từ hay sai, tự gõ lại một lần để nhớ lâu.',
  'Học xong một lượt nhớ xem lại câu sai trước khi đóng nhé.',
] as const;

export function getMascotLine(state: MascotState, ctx?: MascotContext): string {
  if (!ctx) return MASCOT_DEFAULT_LINES[state];

  switch (state) {
    case 'chao':
      if (ctx.dailyGoalMin) {
        return `Chào bạn! Mỗi ngày ${ctx.dailyGoalMin} phút là đủ giữ đà.`;
      }
      return MASCOT_DEFAULT_LINES.chao;

    case 'co-vu':
      if (typeof ctx.dueCount === 'number' && ctx.dueCount > 0) {
        const mins = Math.max(1, ctx.estMinutes ?? Math.ceil(ctx.dueCount * 0.25));
        return `Còn ${ctx.dueCount} thẻ đến hạn, khoảng ${mins} phút thôi!`;
      }
      if (ctx.weakSkillVi) {
        return `${ctx.weakSkillVi} còn dư địa tăng điểm — thử một lượt nhé?`;
      }
      return MASCOT_DEFAULT_LINES['co-vu'];

    case 'vui':
      if (typeof ctx.accuracyPct === 'number') {
        return `Đạt ${Math.round(ctx.accuracyPct)}% chính xác — giữ nhịp này nhé!`;
      }
      if (typeof ctx.streakDays === 'number' && ctx.streakDays > 0) {
        if (ctx.nextMilestoneDays && ctx.nextMilestoneDays > ctx.streakDays) {
          const left = ctx.nextMilestoneDays - ctx.streakDays;
          return `${ctx.streakDays} ngày liền rồi, còn ${left} ngày tới mốc ${ctx.nextMilestoneDays}!`;
        }
        return `Chuỗi ${ctx.streakDays} ngày đều đặn, rất ổn định!`;
      }
      return MASCOT_DEFAULT_LINES.vui;

    case 'an-mung':
      if (typeof ctx.bandFrom === 'number' && typeof ctx.bandTo === 'number') {
        return `Lên band ${ctx.bandFrom.toFixed(1)} → ${ctx.bandTo.toFixed(1)}! Cột mốc rất xứng đáng.`;
      }
      if (typeof ctx.combo === 'number' && ctx.combo >= 5) {
        return `Chuỗi đúng ${ctx.combo} câu liền! Bứt tốc quá gọn.`;
      }
      return MASCOT_DEFAULT_LINES['an-mung'];

    case 'dong-vien':
      if (typeof ctx.accuracyPct === 'number') {
        return `${Math.round(ctx.accuracyPct)}% lượt này — xem lại câu sai sẽ nhớ rất chắc.`;
      }
      return MASCOT_DEFAULT_LINES['dong-vien'];

    case 'idle':
      if (ctx.weakSkillVi) {
        return `${ctx.weakSkillVi} đang xa mục tiêu nhất — luyện nhẹ một ván?`;
      }
      return MASCOT_DEFAULT_LINES.idle;

    case 'suy-nghi':
    case 'ngu':
    default:
      return MASCOT_DEFAULT_LINES[state];
  }
}

export function getMascotTapTip(seed = 0): string {
  const idx = Math.abs(Math.floor(seed)) % MASCOT_TAP_TIPS.length;
  return MASCOT_TAP_TIPS[idx];
}
