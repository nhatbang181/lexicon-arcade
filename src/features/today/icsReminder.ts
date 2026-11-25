/**
 * Tạo nội dung tệp lịch `.ics` (RFC 5545) nhắc học hằng ngày (F13, PP-14: tối đa 1 nhắc/ngày).
 */
export function buildDailyReminderIcs(options: {
  timeHHMM: string;
  durationMinutes: number;
  now?: Date;
}): string {
  const { timeHHMM, durationMinutes, now = new Date() } = options;
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeHHMM.trim());
  const hour = match ? Math.min(23, Math.max(0, Number(match[1]))) : 20;
  const minute = match ? Math.min(59, Math.max(0, Number(match[2]))) : 0;
  const duration = Math.max(5, Math.min(120, Math.round(durationMinutes)));

  const start = new Date(now);
  start.setHours(hour, minute, 0, 0);
  if (start.getTime() < now.getTime()) {
    start.setDate(start.getDate() + 1);
  }
  const end = new Date(start.getTime() + duration * 60_000);

  const fmtLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}${m}${day}T${h}${min}00`;
  };

  const fmtUtc = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const s = String(d.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${day}T${h}${min}${s}Z`;
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lexicon Arcade V3//Daily Study Reminder//VI',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:lexicon-arcade-daily-${fmtLocal(start)}@local`,
    `DTSTAMP:${fmtUtc(now)}`,
    `DTSTART:${fmtLocal(start)}`,
    `DTEND:${fmtLocal(end)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:Lexicon Arcade · Luyện IELTS ${duration} phút`,
    'DESCRIPTION:Giữ nhịp ôn thẻ đến hạn và luyện kỹ năng hằng ngày trên Lexicon Arcade.',
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Đến giờ luyện Lexicon Arcade rồi!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.join('\r\n')}\r\n`;
}

export function downloadDailyReminderIcs(timeHHMM: string, durationMinutes: number): void {
  const ics = buildDailyReminderIcs({ timeHHMM, durationMinutes });
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lexicon-arcade-nhac-hoc-${timeHHMM.replace(':', '')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
