import type { WritingAttemptInput } from '../../../core/grading/packet';

export const TASK1_FIXTURE_ATTEMPT: WritingAttemptInput = {
  attemptId: 'att-w1-transport-001',
  kind: 'task1',
  date: '2026-11-21',
  mode: 'exam',
  durationSec: 1140,
  promptText:
    'The chart below shows the percentage of daily commuters using four modes of transport in a European city between 2005 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
  task1Visual: {
    chart: {
      title: 'Daily Commuter Share by Transport Mode (2005–2025)',
      unit: '%',
      categories: ['2005', '2015', '2025'],
      series: [
        { name: 'Private car', values: [54, 44, 31] },
        { name: 'Public bus', values: [26, 28, 30] },
        { name: 'Rail / Metro', values: [12, 18, 25] },
        { name: 'Cycling', values: [8, 10, 14] },
      ],
    },
  },
  keyFeatures: [
    {
      id: 'kf_overall',
      kind: 'overall_trend',
      textEn: 'Private car share fell markedly while all three sustainable modes increased.',
      mustMention: true,
    },
    {
      id: 'kf_car_leader',
      kind: 'highest',
      textEn: 'Private cars remained the single most common mode throughout, though barely ahead of buses by 2025 (31% vs 30%).',
      mustMention: true,
    },
    {
      id: 'kf_rail_double',
      kind: 'change',
      textEn: 'Rail/Metro more than doubled from 12% in 2005 to 25% in 2025.',
      mustMention: true,
    },
    {
      id: 'kf_cycling_lowest',
      kind: 'lowest',
      textEn: 'Cycling stayed the smallest share in every year, rising modestly from 8% to 14%.',
      mustMention: false,
    },
  ],
  essayText: `The bar chart illustrates the proportions of commuters choosing four different transport modes in a European city across three years: 2005, 2015, and 2025.

Overall, while private car usage experienced a substantial decline over the twenty-year period, the shares of public bus, rail, and cycling all rose steadily. Despite falling sharply, private cars remained the most popular option, although buses nearly caught up by the final year.

In 2005, private cars accounted for just over half of all daily trips at 54%, which was more than double the figure for public buses at 26%. Over the next two decades, car commuting dropped steadily to 44% in 2015 and further to 31% in 2025. By contrast, bus usage increased gradually from 26% to 30% over the same period.

Meanwhile, rail and metro saw the fastest growth among all categories, climbing from 12% in 2005 to 18% in 2015 before reaching 25% in 2025. Cycling remained the least common mode throughout the timeframe, rising from 8% initially to 14% by 2025.`,
};

export const TASK1_CLAUDE_RESPONSE = `**Part A – Nhận xét**

Bài Task 1 đạt khoảng **Band 7.0** (TA 7.5 · CC 7.0 · LR 7.0 · GRA 7.0). Bạn có đoạn overview rất rõ ràng, không nhồi số liệu vào overview và báo cáo chính xác 100% số liệu từ bảng.

**Điểm mạnh nổi bật:** Cách nhóm 2 đoạn thân bài theo 2 nhóm chính (car + bus chiếm tỉ trọng lớn; rail + cycling tăng trưởng từ mức thấp) giúp bài đọc rất dễ theo dõi.

**3 ưu tiên để chạm Band 8.0:**
1. **TA:** Nhấn mạnh thêm tương quan "gấp đôi" của Rail/Metro (12% → 25%) thay vì chỉ liệt kê từng mốc năm.
2. **LR:** Tránh lặp trạng từ *"steadily"* ở 2 đoạn liên tiếp; đa dạng hoá cách diễn đạt mức tăng/giảm.
3. **GRA:** Kết hợp thêm cấu trúc so sánh phân số hoặc mệnh đề phân từ (*"leaving only a one-percentage-point gap..."*) để tăng độ linh hoạt.

\`\`\`json
{
  "attemptId": "att-w1-transport-001",
  "promptVersion": "w-1.0",
  "kind": "task1",
  "criteria": {
    "TR_TA": {
      "band": 7.5,
      "summaryVi": "Overview rõ, đầy đủ cả 4 key features và không có lỗi số liệu; có thể nhấn sâu hơn phép so sánh tỉ lệ thay đổi của Rail.",
      "strengths": [
        {
          "quote": "Overall, while private car usage experienced a substantial decline over the twenty-year period, the shares of public bus, rail, and cycling all rose steadily.",
          "whyVi": "Overview khái quát đúng hai xu hướng đối lập mà không chèn số liệu chi tiết."
        }
      ],
      "issues": [
        {
          "quote": "climbing from 12% in 2005 to 18% in 2015 before reaching 25% in 2025.",
          "problemVi": "Liệt kê đủ số nhưng bỏ lỡ điểm so sánh nổi bật là tỉ lệ Rail/Metro tăng hơn gấp đôi.",
          "fix": "more than doubling from 12% in 2005 to 25% by 2025.",
          "errorTag": "development",
          "severity": "low"
        }
      ]
    },
    "CC": {
      "band": 7.0,
      "summaryVi": "Chia 4 đoạn rất hợp lý, nhóm số liệu thông minh và mạch lạc; vài phép chuyển ý còn đơn giản.",
      "strengths": [
        {
          "quote": "By contrast, bus usage increased gradually from 26% to 30% over the same period.",
          "whyVi": "Đặt đối chiếu trực tiếp ngay sau xu hướng giảm của xe hơi rất rõ mạch."
        }
      ],
      "issues": [
        {
          "quote": "Meanwhile, rail and metro saw the fastest growth among all categories",
          "problemVi": "Dùng 'Meanwhile' ổn nhưng có thể gắn trực tiếp với ý so sánh của đoạn trước để chuyển đoạn tự nhiên hơn.",
          "fix": "Among the remaining modes, rail and metro recorded the most pronounced expansion",
          "errorTag": "cohesion",
          "severity": "low"
        }
      ]
    },
    "LR": {
      "band": 7.0,
      "summaryVi": "Từ vựng mô tả xu hướng chính xác và tự nhiên, chỉ hơi lặp từ 'steadily' giữa overview và thân bài 1.",
      "strengths": [
        {
          "quote": "accounted for just over half of all daily trips at 54%",
          "whyVi": "Quy đổi 54% thành 'just over half' giúp báo cáo số liệu giàu sắc thái hơn."
        }
      ],
      "issues": [
        {
          "quote": "car commuting dropped steadily to 44% in 2015",
          "problemVi": "Lặp từ 'steadily' vừa dùng ở đoạn overview ngay phía trên.",
          "fix": "car commuting declined consistently to 44% in 2015",
          "errorTag": "repetition",
          "severity": "low"
        }
      ]
    },
    "GRA": {
      "band": 7.0,
      "summaryVi": "Hầu hết các câu không có lỗi ngữ pháp, kiểm soát thì quá khứ ổn; cần thêm vài cấu trúc so sánh nén để lên 8.0.",
      "strengths": [
        {
          "quote": "Despite falling sharply, private cars remained the most popular option, although buses nearly caught up by the final year.",
          "whyVi": "Kết hợp mượt mà cụm giới từ nhượng bộ 'Despite + V-ing' với mệnh đề 'although'."
        }
      ],
      "issues": [
        {
          "quote": "Cycling remained the least common mode throughout the timeframe, rising from 8% initially to 14% by 2025.",
          "problemVi": "Câu đúng ngữ pháp nhưng cấu trúc 'remained..., rising...' khá giống mẫu câu trước đó; có thể đa dạng hơn.",
          "fix": "Although cycling attracted the smallest proportion of commuters in all three years, its share nearly doubled from 8% to 14%.",
          "errorTag": "repetition",
          "severity": "low"
        }
      ]
    }
  },
  "relevance": "on_topic",
  "task1": {
    "overviewPresent": true,
    "keyFeaturesCovered": ["kf_overall", "kf_car_leader", "kf_rail_double", "kf_cycling_lowest"],
    "dataErrors": []
  },
  "task2": null,
  "revision": null,
  "topPriorities": [
    {
      "criterion": "TR_TA",
      "titleVi": "Nêu rõ tỉ lệ gấp đôi thay vì chỉ liệt kê mốc",
      "actionVi": "Dùng 'more than doubled' cho Rail/Metro và nêu khoảng cách chỉ còn 1% giữa car và bus năm 2025."
    },
    {
      "criterion": "LR",
      "titleVi": "Tránh lặp trạng từ mô tả xu hướng",
      "actionVi": "Thay một lần 'steadily' bằng 'consistently' hoặc danh từ hoá 'a steady downward trajectory'."
    },
    {
      "criterion": "GRA",
      "titleVi": "Đa dạng hoá cấu trúc so sánh số liệu",
      "actionVi": "Thêm 1–2 cấu trúc rút gọn mệnh đề hoặc tỷ lệ (e.g. 'narrowing the gap to just one percentage point')."
    }
  ],
  "upgrades": [
    {
      "original": "Meanwhile, rail and metro saw the fastest growth among all categories, climbing from 12% in 2005 to 18% in 2015 before reaching 25% in 2025.",
      "upgraded": "Of the two smaller modes, rail and metro recorded the most dramatic expansion, more than doubling their share from 12% in 2005 to a quarter of all commuters in 2025.",
      "criterion": "LR",
      "noteVi": "Kết hợp 'more than doubling' và quy đổi 25% thành 'a quarter' đúng chuẩn Task 1 band 8."
    }
  ],
  "srsItems": [
    {
      "kind": "collocation",
      "front": "account ___ just over half of (chiếm hơn một nửa)",
      "back": "account for just over half of",
      "noteVi": "Cụm mô tả tỷ trọng rất hữu ích cho Task 1."
    },
    {
      "kind": "vocab",
      "front": "narrow the gap to one ___ point",
      "back": "narrow the gap to one percentage point",
      "noteVi": "Phân biệt 'percentage point' (điểm phần trăm) với 'percent'."
    }
  ],
  "confidence": "high"
}
\`\`\`
`;
