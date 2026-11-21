import type { SpeakingAttemptInput } from '../../../core/grading/packet';

export const SPEAKING_FIXTURE_ATTEMPT: SpeakingAttemptInput = {
  attemptId: 'att-s1-mock-001',
  kind: 'speaking',
  date: '2026-11-21',
  mode: 'exam',
  durationSec: 695,
  learnerContext: {
    currentBand: 6.0,
    targetBand: 7.5,
  },
  cueCard: {
    prompt: 'Describe a quiet place you like to go to relax or concentrate.',
    bullets: [
      'where it is',
      'how often you go there',
      'what you usually do there',
    ],
    finalBullet: 'and explain why you find this place relaxing.',
    notes: 'small library rooftop, weekend mornings, read books + review notes, breezy and quiet',
  },
  metrics: {
    wpm: 128,
    longPausesPerMin: 1.6,
    midPausesPerMin: 4.2,
    meanRunLength: 7.8,
    medianStartLatencySec: 1.9,
    fillersPerMin: 3.4,
    part2DurationSec: 102,
    mattr: 0.56,
  },
  lowConfidenceWords: [
    { word: 'concentrate', confidence: 0.62, context: 'hard to concentrate' },
    { word: 'atmosphere', confidence: 0.58, context: 'peaceful atmosphere' },
  ],
  turns: [
    {
      part: '1',
      question: 'Do you prefer studying in the morning or at night?',
      durationSec: 24,
      startLatencySec: 1.7,
      transcript:
        'Honestly, I prefer studying in the morning because my mind feels much fresher after a good sleep. For example, I usually wake up at six and review English vocabulary for thirty minutes before breakfast.',
    },
    {
      part: '2',
      question: 'Describe a quiet place you like to go to relax or concentrate.',
      durationSec: 102,
      startLatencySec: 1.8,
      transcript:
        'A quiet place I really enjoy visiting is a small reading room on the top floor of my district library. I try to go there every Saturday morning when the streets are still calm. Usually I bring my laptop and a notebook to read articles and practice IELTS essays. What makes it special is the large glass windows overlooking a small park, so there is plenty of natural light. Last month I finish two whole books there without checking my phone once. Overall, I find this place deeply relaxing because it gives me a peaceful atmosphere where it is easy to concentrate.',
    },
    {
      part: '3',
      question: 'Why do you think modern cities have fewer quiet spaces than in the past?',
      durationSec: 46,
      startLatencySec: 2.3,
      transcript:
        'Well, I think the main reason is rapid urbanisation. As more people move to big cities for work, local authorities tend to prioritise commercial buildings and highways over parks or public libraries. As a result, noise from traffic and construction is almost everywhere, which makes quiet areas quite rare nowadays.',
    },
  ],
};

export const SPEAKING_FIXTURE_SOURCE_TEXT = SPEAKING_FIXTURE_ATTEMPT.turns
  .map((t) => t.transcript)
  .join('\n');

export const SPEAKING_CLAUDE_RESPONSE = `**Part A – Nhận xét**

Bài thi thử Speaking ước tính **Band 6.5** (FC 6.5 · LR 6.5 · GRA 6.5 · P 6.0 — *lưu ý: Pronunciation là ước tính gián tiếp vì Claude không nghe được audio*).

**Điểm mạnh nổi bật:** Part 3 bạn giải thích nguyên nhân – hệ quả rất rõ ràng (*"local authorities tend to prioritise commercial buildings and highways over parks..."*) với từ vựng học thuật tự nhiên.

**3 ưu tiên để nâng lên Band 7.5:**
1. **GRA:** Sửa lỗi quên chia thì quá khứ đơn khi kể trải nghiệm cụ thể (*"Last month I finish"* → *"Last month I finished"*).
2. **FC:** Giảm độ trễ khởi động ở Part 3 (2.3s → ≤ 1.5s) bằng cụm mua thời gian tự nhiên và kéo dài Part 2 sát mốc 1:50–2:00.
3. **P:** Chú ý bật rõ âm cuối \`-ed\` và trọng âm từ nhiều âm tiết (*concentrate*, *atmosphere* có độ tin cậy ASR thấp).

\`\`\`json
{
  "attemptId": "att-s1-mock-001",
  "promptVersion": "s-1.0",
  "kind": "speaking",
  "criteria": {
    "FC": {
      "band": 6.5,
      "summaryVi": "Tốc độ nói 128 WPM khá ổn, Part 2 đạt 1:42 và mạch ý rõ; còn ngừng dài 1.6 lần/phút và độ trễ Part 3 hơi cao.",
      "strengths": [
        {
          "quote": "Honestly, I prefer studying in the morning because my mind feels much fresher after a good sleep.",
          "whyVi": "Mở câu trực diện bằng khung Answer–Reason tự nhiên, không ngập ngừng."
        }
      ],
      "issues": [
        {
          "quote": "Well, I think the main reason is rapid urbanisation.",
          "problemVi": "Độ trễ khởi động Part 3 là 2.3s và mở câu khá quen thuộc ('Well, I think').",
          "fix": "I'd say the biggest driver behind that shift is rapid urbanisation.",
          "errorTag": "repetition",
          "severity": "low"
        }
      ]
    },
    "LR": {
      "band": 6.5,
      "summaryVi": "Dùng tốt các từ chủ đề đô thị ('rapid urbanisation', 'prioritise') nhưng Part 2 từ vựng mô tả cảm giác còn đơn giản.",
      "strengths": [
        {
          "quote": "local authorities tend to prioritise commercial buildings and highways over parks or public libraries.",
          "whyVi": "Cấu trúc 'prioritise A over B' chuẩn xác và tự nhiên trong văn nói Part 3."
        }
      ],
      "issues": [
        {
          "quote": "I find this place deeply relaxing because it gives me a peaceful atmosphere",
          "problemVi": "Cụm 'peaceful atmosphere' đúng nhưng khá phổ thông; có thể nâng bằng diễn đạt tự nhiên hơn.",
          "fix": "it offers a calm, distraction-free setting where I can genuinely unwind",
          "errorTag": "register",
          "severity": "low"
        }
      ]
    },
    "GRA": {
      "band": 6.5,
      "summaryVi": "Dùng được câu phức có 'which', 'when', 'as' tương đối tốt nhưng còn lỗi quên chia quá khứ đơn đặc trưng L1.",
      "strengths": [
        {
          "quote": "noise from traffic and construction is almost everywhere, which makes quiet areas quite rare nowadays.",
          "whyVi": "Dùng mệnh đề quan hệ không xác định 'which makes...' chính xác khi nói ứng biến."
        }
      ],
      "issues": [
        {
          "quote": "Last month I finish two whole books there without checking my phone once.",
          "problemVi": "Thiếu đuôi quá khứ đơn '-ed' với mốc thời gian 'Last month' (lỗi bỏ âm cuối phổ biến ở người Việt).",
          "fix": "Last month I finished two whole books there without checking my phone once.",
          "errorTag": "tense",
          "severity": "high"
        }
      ]
    },
    "P": {
      "band": 6.0,
      "summaryVi": "Ước tính gián tiếp từ ASR: đa số câu nhận dạng tốt nhưng các từ nhiều âm tiết ('concentrate', 'atmosphere') và đuôi '-ed' cần luyện thêm.",
      "strengths": [],
      "issues": [
        {
          "quote": "peaceful atmosphere where it is easy to concentrate.",
          "problemVi": "ASR ghi nhận độ tin cậy thấp ở 'atmosphere' và 'concentrate' — có khả năng rơi trọng âm chưa rõ.",
          "fix": "Practice primary stress: /ˈætməsfɪə/ and /ˈkɒnsəntreɪt/.",
          "errorTag": "pronunciation",
          "severity": "medium"
        }
      ]
    }
  },
  "partNotes": [
    { "part": "1", "noteVi": "Trả lời đủ cấu trúc A-R-E, độ dài 24 giây rất hợp lý." },
    { "part": "2", "noteVi": "Đủ 4 ý cue card trong 1:42; chú ý chia đúng thì quá khứ khi kể ví dụ cá nhân." },
    { "part": "3", "noteVi": "Lập luận trừu tượng tốt; có thể thêm 1 ví dụ thành phố cụ thể để kéo dài câu trả lời." }
  ],
  "pronunciationConfidence": "low",
  "topPriorities": [
    {
      "criterion": "GRA",
      "titleVi": "Bắt buộc chia quá khứ đơn khi kể kỷ niệm",
      "actionVi": "Khi nói các mốc 'last month / yesterday', luôn bật rõ đuôi -ed ('finished', 'visited')."
    },
    {
      "criterion": "P",
      "titleVi": "Luyện trọng âm từ 3 âm tiết hay bị ASR nhầm",
      "actionVi": "Nghe mẫu và nhại lại 'concentrate' (/ˈkɒnsəntreɪt/) và 'atmosphere' (/ˈætməsfɪə/)."
    },
    {
      "criterion": "FC",
      "titleVi": "Giảm ngập ngừng đầu câu Part 3",
      "actionVi": "Dùng chunk tự nhiên như 'I'd say the main driver is...' để khởi động dưới 1.5 giây."
    }
  ],
  "upgrades": [
    {
      "original": "Last month I finish two whole books there without checking my phone once.",
      "upgraded": "Just last month, I managed to get through two entire books there without glancing at my phone even once.",
      "criterion": "LR",
      "noteVi": "Cụm 'get through two entire books' nghe rất tự nhiên trong văn nói band 8."
    }
  ],
  "srsItems": [
    {
      "kind": "error",
      "front": "Last month I finish two whole books",
      "back": "Last month I finished two whole books",
      "noteVi": "Chia quá khứ đơn và bật rõ âm cuối /t/ của 'finished'."
    },
    {
      "kind": "vocab",
      "front": "a ___ setting (môi trường không bị xao nhãng)",
      "back": "a distraction-free setting",
      "noteVi": "Thay cho 'peaceful atmosphere' trong Speaking Part 2."
    }
  ],
  "confidence": "medium"
}
\`\`\`
`;
