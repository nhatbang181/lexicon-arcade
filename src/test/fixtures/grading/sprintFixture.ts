import type { SprintAttemptInput } from '../../../core/grading/packet';

export const SPRINT_OVERVIEW_FIXTURE_ATTEMPT: SprintAttemptInput = {
  attemptId: 'att-w2-ov-001',
  kind: 'w2_overview',
  date: '2026-11-21',
  mode: 'sprint',
  durationSec: 235,
  items: [
    {
      ref: 'w1:bar_001',
      prompt: 'Renewable electricity generation share across 4 countries (2010–2024).',
      keyFeatures: [
        'All four countries increased renewable share.',
        'Norway stayed highest by a wide margin.',
      ],
      response:
        'Overall, renewable electricity share rose in all four nations, with Norway consistently remaining the clear leader.',
      durationSec: 72,
    },
    {
      ref: 'w1:line_002',
      prompt: 'Library visits vs e-book downloads (2012–2022).',
      keyFeatures: [
        'E-book downloads surged while physical visits fell.',
        'E-books overtook physical visits in 2018.',
      ],
      response:
        'Overall, e-book downloads increased sharply from 20000 to 95000 while physical visits went down.',
      durationSec: 81,
    },
    {
      ref: 'w1:pie_003',
      prompt: 'Household water consumption by category in 2000 and 2020.',
      keyFeatures: [
        'Bathrooms and toilets took the largest share in both years.',
        'Garden irrigation shrank noticeably by 2020.',
      ],
      response:
        'Overall, bathroom use accounted for the biggest proportion in both years, whereas garden watering dropped significantly.',
      durationSec: 82,
    },
  ],
};

export const SPRINT_OVERVIEW_SOURCE_TEXT = SPRINT_OVERVIEW_FIXTURE_ATTEMPT.items
  .map((i) => i.response)
  .join('\n');

export const SPRINT_OVERVIEW_CLAUDE_RESPONSE = `**Part A – Nhận xét nhanh**
Phiên Overview Sprint rất tốt (2/3 lượt đạt 3 sao)! Bạn nắm vững cấu trúc nhóm xu hướng đối lập với *Overall, ... whereas/with ...*.
Chỉ cần lưu ý lượt 2 (\`w1:line_002\`): không đưa số liệu cụ thể (20000, 95000) vào câu overview và nên nhắc mốc e-book vượt lượt đến thư viện.

\`\`\`json
{
  "attemptId": "att-w2-ov-001",
  "promptVersion": "sp-1.0",
  "kind": "w2_overview",
  "items": [
    {
      "ref": "w1:bar_001",
      "stars": 3,
      "checks": {
        "overallTrend": true,
        "keyComparison": true,
        "noDetail": true,
        "accurate": true
      },
      "tipVi": "Rất gọn, nêu đủ xu hướng chung lẫn nước dẫn đầu mà không nhồi số.",
      "betterChunk": null
    },
    {
      "ref": "w1:line_002",
      "stars": 1,
      "checks": {
        "overallTrend": true,
        "keyComparison": false,
        "noDetail": false,
        "accurate": true
      },
      "tipVi": "Bỏ số liệu cụ thể khỏi overview và thêm ý e-book đã vượt lượt đến trực tiếp.",
      "betterChunk": {
        "original": "increased sharply from 20000 to 95000 while physical visits went down",
        "better": "surged to overtake physical visits, which declined steadily over the period"
      }
    },
    {
      "ref": "w1:pie_003",
      "stars": 3,
      "checks": {
        "overallTrend": true,
        "keyComparison": true,
        "noDetail": true,
        "accurate": true
      },
      "tipVi": "So sánh đối lập rất tự nhiên, đủ ý cho band 8.",
      "betterChunk": {
        "original": "accounted for the biggest proportion",
        "better": "constituted the largest share"
      }
    }
  ]
}
\`\`\`
`;
