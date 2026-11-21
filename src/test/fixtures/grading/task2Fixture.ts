import type { WritingAttemptInput } from '../../../core/grading/packet';

export const TASK2_FIXTURE_ATTEMPT: WritingAttemptInput = {
  attemptId: 'att-w2-community-001',
  kind: 'task2',
  date: '2026-11-21',
  mode: 'exam',
  durationSec: 2292,
  promptText:
    'Some people argue that unpaid community service should be a compulsory part of secondary school programmes. To what extent do you agree or disagree? Write at least 250 words.',
  partsToAddress: [
    'State a clear position on whether unpaid community service should be compulsory in secondary school.',
    'Explain reasons supporting your stance with relevant examples.',
    'Address potential drawbacks or counterarguments.',
  ],
  learnerContext: {
    currentBand: 6.0,
    targetBand: 8.0,
    weakestCriterion: 'LR',
  },
  essayText: `In recent years, there has been a growing debate over whether secondary schools should require students to participate in unpaid community service. While some people worry that this policy could add extra pressure on teenagers, I strongly agree that making voluntary work compulsory brings lasting benefits to both young people and the society.

First of all, engaging in community activities helps adolescents develop essential life skills that cannot be easily learned from textbooks. When teenagers help elderly residents or clean up local parks, they learn how to communicate with people from different backgrounds and solve practical problems as a team. For instance, students who organise a neighbourhood recycling drive must coordinate schedules, persuade local households, and handle unexpected obstacles. Furthermore, this experience builds genuine empathy, which makes young people less likely to make a crime or ignore civic responsibilities when they become adults.

On the other hand, critics argue that forcing students to volunteer goes against the true spirit of charity and reduces time for academic study. Although heavy exam schedules are a real concern, schools can easily address this issue by limiting the requirement to around twenty hours per academic year. If the programme allows students to choose projects aligned with their personal interests, such as tutoring younger children or assisting at an animal shelter, they will feel motivated rather than resentful.

In conclusion, despite minor scheduling challenges, mandatory unpaid community service is a valuable educational tool. By integrating well-structured civic projects into high school curricula, schools can nurture more compassionate and capable citizens for the future.`,
};

export const TASK2_CLAUDE_RESPONSE = `**Part A – Nhận xét**

Bài viết đạt khoảng **Band 6.5** (TR 7.0 · CC 7.0 · LR 6.0 · GRA 6.5). Bạn trả lời rõ ràng câu hỏi "to what extent", bố cục 4 đoạn mạch lạc và có phản biện hợp lý ở thân bài 2.

**Điểm mạnh nổi bật:** Câu điều kiện ở thân bài 2 (*"If the programme allows students to choose projects aligned with their personal interests..."*) diễn đạt tự nhiên, rõ ràng và chứng minh cách giải quyết phản biện rất thuyết phục.

**3 ưu tiên để đẩy nhanh lên 7.5+:**
1. **LR:** Sửa cụm dịch từ tiếng Việt *"make a crime"* → *"commit a crime"*, đồng thời thay một số cụm quen thuộc bằng collocation học thuật sắc nét hơn.
2. **GRA:** Bỏ mạo từ *"the"* trước danh từ chung nghĩa khái quát (*"the society"* → *"society"*), tăng thêm cấu trúc mệnh đề quan hệ không xác định và đảo ngữ/phân từ.
3. **TR:** Mở rộng thêm hệ quả cụ thể ở thân bài 1 để làm rõ mối liên hệ giữa hoạt động cộng đồng và hành vi công dân sau này.

\`\`\`json
{
  "attemptId": "att-w2-community-001",
  "promptVersion": "w-1.0",
  "kind": "task2",
  "criteria": {
    "TR_TA": {
      "band": 7.0,
      "summaryVi": "Quan điểm rõ ràng xuyên suốt, giải quyết đủ cả lý do đồng ý và phản biện; lập luận cuối thân bài 1 hơi nhảy bước.",
      "strengths": [
        {
          "quote": "I strongly agree that making voluntary work compulsory brings lasting benefits to both young people and the society.",
          "whyVi": "Nêu lập trường rõ ràng ngay cuối mở bài, định hướng tốt cho toàn bài."
        }
      ],
      "issues": [
        {
          "quote": "which makes young people less likely to make a crime or ignore civic responsibilities when they become adults.",
          "problemVi": "Khẳng định cộng đồng làm giảm tội phạm hơi khái quát quá mức khi chưa có giải thích cơ chế trung gian.",
          "fix": "which fosters a stronger sense of civic accountability as they transition into adulthood.",
          "errorTag": "overgeneralisation",
          "severity": "medium"
        }
      ]
    },
    "CC": {
      "band": 7.0,
      "summaryVi": "Chia 4 đoạn hợp lý, mỗi đoạn có chủ đề trung tâm rõ; liên kết câu mượt dù còn dùng vài từ nối khá sách vở.",
      "strengths": [
        {
          "quote": "Although heavy exam schedules are a real concern, schools can easily address this issue by limiting the requirement to around twenty hours per academic year.",
          "whyVi": "Chuyển ý từ nhượng bộ sang giải pháp rất tự nhiên và logic."
        }
      ],
      "issues": [
        {
          "quote": "First of all, engaging in community activities helps adolescents develop essential life skills",
          "problemVi": "Cụm 'First of all' và 'Furthermore' dùng hơi rập khuôn; có thể liên kết trực tiếp bằng chủ ngữ ý chính.",
          "fix": "A primary advantage of community service is that it equips adolescents with practical life skills",
          "errorTag": "cohesion",
          "severity": "low"
        }
      ]
    },
    "LR": {
      "band": 6.0,
      "summaryVi": "Đủ vốn từ học thuật cơ bản nhưng mắc lỗi collocation dịch sát từ tiếng Việt ('make a crime') và một số cụm còn chung chung.",
      "strengths": [
        {
          "quote": "schools can nurture more compassionate and capable citizens for the future.",
          "whyVi": "Kết hợp động từ 'nurture' với 'compassionate and capable citizens' tự nhiên, đúng văn phong học thuật."
        }
      ],
      "issues": [
        {
          "quote": "less likely to make a crime",
          "problemVi": "Collocation sai kiểu dịch từ tiếng Việt ('gây tội' -> make a crime). Tiếng Anh phải dùng 'commit a crime'.",
          "fix": "less likely to commit a crime",
          "errorTag": "l1_collocation",
          "severity": "high"
        },
        {
          "quote": "making voluntary work compulsory",
          "problemVi": "Tự mâu thuẫn nhẹ về nghĩa ('voluntary' là tự nguyện nhưng lại 'compulsory'). Nên giữ 'unpaid community service'.",
          "fix": "making unpaid community service mandatory",
          "errorTag": "register",
          "severity": "medium"
        }
      ]
    },
    "GRA": {
      "band": 6.5,
      "summaryVi": "Kiểm soát tốt câu phức và câu điều kiện, ít lỗi cản trở nghĩa, nhưng còn lỗi mạo từ đặc trưng người Việt.",
      "strengths": [
        {
          "quote": "If the programme allows students to choose projects aligned with their personal interests, such as tutoring younger children or assisting at an animal shelter, they will feel motivated rather than resentful.",
          "whyVi": "Câu phức dài có mệnh đề phân từ rút gọn 'aligned with' chính xác và giàu nhịp điệu."
        }
      ],
      "issues": [
        {
          "quote": "brings lasting benefits to both young people and the society.",
          "problemVi": "Dùng thừa mạo từ 'the' trước 'society' khi nói về xã hội nói chung.",
          "fix": "brings lasting benefits to both young people and society as a whole.",
          "errorTag": "article",
          "severity": "high"
        }
      ]
    }
  },
  "relevance": "on_topic",
  "task1": null,
  "task2": {
    "positionClear": true,
    "partsAddressed": [
      { "part": "Stance on compulsory unpaid community service", "addressed": "fully" },
      { "part": "Supporting arguments and examples", "addressed": "fully" },
      { "part": "Counterargument and rebuttal", "addressed": "fully" }
    ],
    "mainIdeas": [
      { "idea": "Community service builds practical life skills and empathy", "developed": "well" },
      { "idea": "Scheduling and autonomy concerns can be mitigated via hour caps and choice", "developed": "well" }
    ]
  },
  "revision": null,
  "topPriorities": [
    {
      "criterion": "LR",
      "titleVi": "Loại bỏ collocation dịch từ tiếng Việt",
      "actionVi": "Thay 'make a crime' bằng 'commit a crime' và tránh ghép từ trái nghĩa 'voluntary ... compulsory'."
    },
    {
      "criterion": "GRA",
      "titleVi": "Rà lại mạo từ với danh từ khái quát",
      "actionVi": "Sửa 'the society' thành 'society'; luyện quy tắc bỏ 'the' trước danh từ không đếm được nghĩa chung."
    },
    {
      "criterion": "TR_TA",
      "titleVi": "Tránh khẳng định nhân quả quá rộng",
      "actionVi": "Thay vì nói giảm tội phạm, hãy phân tích cụ thể cách hoạt động cộng đồng tăng ý thức công dân."
    }
  ],
  "upgrades": [
    {
      "original": "In recent years, there has been a growing debate over whether secondary schools should require students to participate in unpaid community service.",
      "upgraded": "Whether unpaid community service should become a mandatory component of secondary education has sparked considerable debate in recent years.",
      "criterion": "GRA",
      "noteVi": "Đưa mệnh đề danh ngữ 'Whether...' lên làm chủ ngữ giúp câu mở bài học thuật và gọn hơn."
    },
    {
      "original": "Furthermore, this experience builds genuine empathy, which makes young people less likely to make a crime or ignore civic responsibilities when they become adults.",
      "upgraded": "Beyond practical competence, hands-on civic involvement cultivates empathy, making adolescents far more likely to uphold their social responsibilities in adulthood.",
      "criterion": "LR",
      "noteVi": "Thay 'make a crime' bằng cụm tự nhiên 'uphold their social responsibilities' và tránh lối mở 'Furthermore'."
    }
  ],
  "srsItems": [
    {
      "kind": "collocation",
      "front": "___ a crime (phạm tội)",
      "back": "commit a crime",
      "noteVi": "Không dùng 'make a crime' (lỗi dịch từ tiếng Việt)."
    },
    {
      "kind": "error",
      "front": "benefits to both young people and the society",
      "back": "benefits to both young people and society",
      "noteVi": "Bỏ 'the' trước 'society' khi nói về xã hội nói chung."
    },
    {
      "kind": "collocation",
      "front": "uphold one's ___ responsibilities",
      "back": "uphold one's civic responsibilities",
      "noteVi": "Cụm band 8 cho chủ đề giáo dục và cộng đồng."
    }
  ],
  "confidence": "high"
}
\`\`\`
`;
