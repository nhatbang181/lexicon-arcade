# 04 · Data Spec: schema và luật bất biến cho mọi nội dung

> Mỗi interface dưới đây phải có zod schema tương ứng trong `src/core/content/schemas.ts`.
> Validator `npm run validate:data` kiểm tra **schema + mọi luật bất biến [INV-…]**. Chỉ cần sai 1 luật là FAIL (exit code ≠ 0).
> ID phải ổn định vĩnh viễn: không đổi ID của item đã phát hành, vì SRS của người học gắn vào ID.

## 1. Bản đồ file
```
public/data/
  manifest.json
  roadmap.json                 tips.json (từ ielts_strategies.json)
  vocab/words.json             vocab/collocations.json      vocab/paraphrases.json
  vocab/placement_vocab.json   vocab/error_patterns.json
  listening/index.json         listening/episodes/<id>.json  listening/dictation.json
  reading/index.json           reading/passages/<id>.json
  writing/task2_prompts.json   writing/task1/index.json      writing/task1/<id>.json
  writing/cliches.json         # ≥ 40 cụm sáo rỗng cho checklist W1
  speaking/part1.json          speaking/part2.json           speaking/part3.json
  speaking/phrases.json
  exam/tests.json
public/audio/
  vocab/<slug>.uk.mp3          dictation/<id>.mp3            listening/<episodeId>.mp3
  speaking/<qid>.mp3           sfx/ (xem 10-MOTION-AND-SOUND)
```
**Dữ liệu cũ** (`anki_vocab.json`, `ielts_4skills.json`, `ielts_strategies.json`) **giữ nguyên** cho code legacy. Script chuyển đổi đọc từ chúng để sinh dữ liệu V3 (xem `05` §3).

## 2. Kiểu dùng chung
```ts
type Topic = 'education'|'environment'|'technology'|'health'|'urban'|'work'|'crime'|'media'|
  'globalisation'|'culture'|'science'|'transport'|'family'|'economy'|'tourism'|'food'|
  'government'|'arts'|'sport'|'animals'|'history'|'psychology'|'space'|'energy'|'language';
type CEFR = 'B1'|'B2'|'C1'|'C2';
interface Provenance {
  createdBy: 'human'|'llm'|'llm+review'|'import';
  source: string;            // 'anki:<deck>' | 'llm:<model>@<date>' | 'wikipedia:<url>' | 'nawl' | ...
  license: string;           // 'own'|'CC-BY-SA-4.0'|'CC-BY-ND-4.0'|'Apache-2.0'|...
  attribution?: string;
  qa: { schema: 'pass'; verifier?: 'pass'|'fixed'; blindSolve?: 'pass'|'na'; humanSpotCheck?: string /*ISO date*/ };
}
```
**[INV-PROV]** Mọi item cấp gốc đều có `provenance`. `qa.verifier` phải là `'pass'` hoặc `'fixed'` với mọi item có `createdBy` chứa `llm`.

## 3. Từ vựng
```ts
interface VocabItem {
  id: `vocab:${string}`;            // slug: chữ thường, '_' thay khoảng trắng: vocab:rote_learning
  headword: string;                 // "rote learning"
  pos: Array<'n'|'v'|'adj'|'adv'|'phr'|'phr_v'|'idiom'|'prep'|'conj'>;
  ipa: { uk: string; us?: string }; // dạng /.../
  syllables?: string;               // "cur·ric·u·lum" + trọng âm: "cur·RIC·u·lum"
  meaningVi: string;                // ≤ 12 từ
  definitionEn: string;             // tự viết, ≤ 20 từ, không chép từ điển
  examples: Array<{ en: string; vi?: string; ieltsContext?: 'W2'|'W1'|'S'|'R'|'L';
                    clozeAccepted?: string[] }>; // ≥2, mỗi câu 10–30 từ; clozeAccepted sinh bởi build_cloze_accept.mjs (V1)
  family?: Array<{ form: string; pos: string }>;         // economy/economic/economical/economically
  synonyms?: Array<{ word: string; noteVi?: string }>;   // kèm khác biệt sắc thái
  collocationIds: string[];         // trỏ tới col:* (có thể rỗng với từ không phải danh/động/tính từ)
  register: 'neutral'|'formal'|'informal';
  topics: Topic[];
  lists: Array<'AWL1'|'AWL2'|'AWL3'|'AWL4'|'AWL5'|'AWL6'|'AWL7'|'AWL8'|'AWL9'|'AWL10'|'NAWL'|'NGSL'|'ANKI'|'TOPIC'>;
  freqZipf?: number;                // wordfreq zipf (en)
  cefr?: CEFR;
  vnTrap?: string;                  // lỗi người Việt hay mắc, ≤ 25 từ
  audio: { uk: string; us?: string }; // đường dẫn tương đối dưới public/
  provenance: Provenance;
}
```
- **[INV-V1]** `id` không trùng. `headword` không trùng nếu chuẩn hoá về chữ thường.
- **[INV-V2]** `ipa.uk` khớp regex `^/.+/$` và không chứa chữ CJK.
- **[INV-V3]** Mỗi `examples[i].en` chứa headword hoặc một dạng trong `family`. Kiểm tra bằng lemma đơn giản: so khớp không phân biệt hoa thường, cho phép thêm -s/-es/-ed/-ing/-ies.
- **[INV-V4]** File audio trong `audio.uk` tồn tại và dài 0,3–4 giây.
- **[INV-V5]** Mọi `collocationIds` trỏ tới item có thật.

```ts
interface Collocation {
  id: `col:${string}`;              // col:exert_influence_on
  headwordId: `vocab:${string}`;    // từ trung tâm
  pattern: 'V+N'|'ADJ+N'|'N+N'|'N+PREP'|'V+PREP'|'ADJ+PREP'|'ADV+ADJ'|'V+ADV'|'N+of+N'|'PHRASE';
  phrase: string;                   // "exert an influence on"
  gaps: Array<{ display: string; answers: string[]; primary: string }>; // "___ an influence on" → ["exert","have"]
  meaningVi: string;
  example: string;                  // câu Task 2 / học thuật 15–30 từ chứa phrase nguyên văn
  register: 'neutral'|'formal';
  bandTarget: 7|8|9;                // độ "ăn điểm"
  l1Traps: Array<{ wrong: string; whyVi: string }>; // "make an influence" – dịch từ "tạo ảnh hưởng"
  topics: Topic[];
  provenance: Provenance;
}
```
- **[INV-C1]** `example` chứa `phrase` nguyên văn, hoặc biến thể chia động từ khai báo trong `gaps`.
- **[INV-C2]** Mọi `gaps[i].answers` chứa `primary`. Ghép `display` với `primary` phải ra `phrase`.
- **[INV-C3]** `l1Traps[*].wrong` ≠ phrase và không nằm trong `answers`.

```ts
interface ParaphraseItem {
  id: `para:${string}`;
  level: 1|2|3|4;   // 1 synonym từ, 2 đổi dạng từ, 3 đổi cấu trúc (bị động, danh từ hoá, mệnh đề), 4 bẫy gần nghĩa
  questionPhrase: string;           // cụm trong câu hỏi
  relation: 'equivalent'|'not_equivalent';
  context: string;                  // đoạn 40–120 từ
  target: { text: string; start: number; end: number };   // cụm đúng trong context (relation equivalent)
  decoys: Array<{ text: string; start: number; end: number; whyVi: string }>; // 1–3 cụm gây nhiễu trong context
  explanationVi: string;
  topics: Topic[];
  provenance: Provenance;
}
```
- **[INV-P1]** `context.slice(start,end) === text` với `target` và mọi `decoys`.
- **[INV-P2]** Các span không giao nhau.
- **[INV-P3]** Nếu `relation==='not_equivalent'` thì `target` là cụm *trông giống* đáp án nhất. Game sẽ yêu cầu bấm "Không có trong đoạn".

```ts
interface ErrorPattern {
  id: `err:${string}`;
  tag: 'article'|'plural'|'sva'|'tense'|'word_form'|'preposition'|'run_on'|'fragment'|'l1_collocation'|'register'|'spelling';
  wrong: string; correct: string;   // 1 câu
  errorSpan: { start: number; end: number }; // trong wrong
  ruleVi: string;                   // ≤ 25 từ
  provenance: Provenance;
}
```
- **[INV-E1]** `wrong ≠ correct`. `errorSpan` nằm trong độ dài của `wrong`.

```ts
interface PlacementVocab { items: Array<{ id: string; headword: string; band: 1|2|3|4|5|6; checkMeaningVi: string; foilsVi: [string,string,string] }> }
```
`band` là dải tần suất: 1 = NGSL top 1k … 6 = AWL/NAWL hiếm. **[INV-PV1]** Mỗi band có ≥ 20 item.

## 4. Listening
```ts
type ListeningTrap = 'self_correction'|'changed_plan'|'distractor_number'|'spelling_out'|'double_letter'|
  'negation_shift'|'option_mentioned_rejected'|'synonym_paraphrase'|'plural_singular'|'word_limit'|
  'homophone_minimal_pair'|'signpost_skip'|'map_direction';
type QType = 'form_completion'|'note_completion'|'table_completion'|'flowchart_completion'|'sentence_completion'|
  'summary_completion'|'short_answer'|'mcq_single'|'mcq_multi'|'matching'|'map_labelling'|'diagram_labelling';

interface ListeningEpisode {
  id: `lep:${string}`;              // lep:p1_017
  part: 1|2|3|4;
  reserved?: boolean;               // thuộc đề thi thử X1
  title: string; contextEn: string; // "A man phones a sports centre to book a course."
  difficulty: number;               // 1–10
  speakers: Array<{ id: string; name: string; role: string; voice: string; accent: 'uk'|'us'|'au'|'nz'|'ca' }>;
  channel?: 'normal'|'phone';
  script: Array<{ lineId: string; speakerId: string; text: string; ttsText?: string; start: number; end: number; pauseAfter?: number }>;
  audio: { path: string; durationSec: number; sha256: string; loudnessLUFS: number };
  questionGroups: Array<{
    groupId: string; type: QType;
    instructions: string;           // nguyên văn kiểu đề, vd "Write ONE WORD AND/OR A NUMBER for each answer."
    wordLimit?: { words: 1|2|3; allowNumber: boolean };
    previewSec: number;             // thời gian đọc trước (thường 30)
    template?: FormTemplate;        // cho form/note/table/flowchart
    map?: MapSpec;                  // cho map_labelling
    options?: Array<{ key: string; text: string }>; // MCQ/matching
    questions: Array<{
      qid: string; number: number;  // number 1–10 trong episode
      prompt: string;
      answer: { accepted: string[]; keys?: string[] }; // accepted: biến thể chính tả/viết số hợp lệ; keys: cho MCQ
      evidence: { lineId: string; start: number; end: number }; // giây
      traps: Array<{ type: ListeningTrap; lineId: string; start: number; end: number; decoy?: string; explanationVi: string }>;
    }>;
  }>;
  provenance: Provenance;
}
interface FormTemplate { title: string; rows: Array<{ label: string; value?: string; blankQid?: string; suffix?: string }> }
interface MapSpec {
  viewBox: string;                  // "0 0 800 560"
  shapes: Array<{ id: string; kind: 'building'|'road'|'path'|'water'|'park'|'parking'|'entrance'|'label';
                  d?: string; x?: number; y?: number; w?: number; h?: number; label?: string }>;
  compass: boolean; youAreHere?: { x: number; y: number };
  slots: Array<{ key: string; x: number; y: number }>; // A–I
}
```
- **[INV-L1]** Mỗi episode có **đúng 10 câu**. Part 1 và Part 4 có ≥ 6 câu completion.
- **[INV-L2]** Mọi đáp án completion tuân thủ `wordLimit`: đếm token, số tính là "a number".
- **[INV-L3]** Mỗi `accepted[i]`, sau khi chuẩn hoá, xuất hiện trong `script` của dòng `evidence.lineId`. Với số: dạng chữ hoặc dạng số đều được. Với tên đánh vần: transcript chứa chuỗi chữ cái đánh vần.
- **[INV-L4]** Mỗi episode có ≥ 3 trap. Part 1 có ≥ 1 `self_correction` hoặc `distractor_number`, và ≥ 1 `spelling_out`.
- **[INV-L5]** Timestamp tăng dần và nằm trong `durationSec`. `audio.sha256` khớp file. `loudnessLUFS` trong khoảng −17…−15.
- **[INV-L6]** Thời lượng: Part 1 4–6 phút, Part 2 4–6, Part 3 4–6, Part 4 5–7.
- **[INV-L7]** `blindSolve === 'pass'`: model kiểm chỉ đọc transcript và câu hỏi, không có đáp án, phải ra đúng 10/10. Xem `05` §5.

```ts
interface DictationItem {
  id: `dict:${string}`;
  text: string;                     // 6–28 từ
  level: number;                    // 1–10 (05 §6.4)
  accent: 'uk'|'us'|'au'; voice: string; wpm: number;
  features: Array<'linking'|'weak_form'|'final_consonant'|'elision'|'numbers'|'names'|'academic'|'contraction'>;
  focus: Array<{ tokenIndex: number; feature: string; tipVi: string; ipaConnected?: string }>;
  audio: string;                    // public/audio/dictation/<id>.mp3
  acceptedVariants?: string[];      // cách viết khác được chấp nhận cho cả câu (tên riêng, số)
  sourceEpisodeId?: string;
  provenance: Provenance;
}
```
**[INV-D1]** `wpm` của audio thực tế (số từ / thời lượng không tính khoảng lặng đầu và cuối) lệch ≤ 10% so với khai báo.

## 5. Reading
```ts
type ReadingTrap = 'qualifier'|'comparison'|'causation'|'time_sequence'|'number_date'|'opinion_vs_fact'|
  'partial_match'|'keyword_echo'|'extra_claim';
type RQType = 'tfng'|'ynng'|'headings'|'mcq_single'|'mcq_multi'|'matching_info'|'matching_features'|'sentence_endings'|
  'sentence_completion'|'summary_completion'|'summary_wordlist'|'table_completion'|'flowchart_completion'|
  'diagram_labelling'|'short_answer';
interface Span { paragraph: string; start: number; end: number; quote: string } // start/end tính trong paragraph.text

interface Passage {
  id: `rp:${string}`;               // rp:p2_031
  level: 'P1'|'P2'|'P3';            // độ khó kiểu passage 1/2/3
  mini?: boolean;                   // bài ngắn import từ V2 – chỉ dùng ở R1 Judge level 1–2, miễn [INV-R2][INV-R3]
  reserved?: boolean;               // thuộc đề thi thử X1
  title: string; subtitle?: string; topic: Topic;
  paragraphs: Array<{ label: string; text: string }>; // A, B, C...
  wordCount: number;
  glossary?: Array<{ term: string; meaningVi: string }>; // chỉ hiện ở training
  questionGroups: Array<{
    groupId: string; type: RQType; instructions: string;
    wordLimit?: { words: 1|2|3; allowNumber: boolean };
    options?: Array<{ key: string; text: string }>;     // MCQ, features, endings, wordlist
    headings?: Array<{ key: string; text: string }>;    // i, ii, iii...
    summaryText?: string;                               // có [Qn] làm chỗ trống
    questions: Array<{
      qid: string; number: number; prompt: string;
      answer: { accepted?: string[]; key?: string; keys?: string[] }; // TFNG: key ∈ TRUE|FALSE|NOT GIVEN
      evidence: Span[];             // NOT GIVEN: span "gần nhất" mà bài có nhắc chủ đề (có thể rỗng)
      trapType?: ReadingTrap;
      headingDistractors?: Array<{ key: string; type: 'detail_only'|'too_broad'|'keyword_match'|'adjacent_paragraph'|'opposite_stance'; whyVi: string }>;
      mainIdeaSpan?: Span;          // headings: câu chủ đề / ý chính
      explanationVi: string;        // ≤ 2 câu
      steps?: string[];             // các bước suy luận, tiếng Việt, 2–4 bước
    }>;
  }>;
  provenance: Provenance;
}
```
- **[INV-R1]** Mọi `Span.quote === paragraphs[label].text.slice(start,end)`.
- **[INV-R2]** `wordCount` khớp số từ thực tế ±2%. Theo level: P1 650–850, P2 750–900, P3 800–950 từ.
- **[INV-R3]** Mỗi passage có 13 hoặc 14 câu, ≥ 2 nhóm dạng khác nhau.
- **[INV-R4]** Nhóm TFNG/YNNG có đủ cả 3 loại đáp án. Không loại nào chiếm > 50% trong nhóm.
- **[INV-R5]** Headings: `headings.length ≥ paragraphsAsked + 2`. Mỗi câu có ≥ 2 `headingDistractors` thuộc ≥ 2 type khác nhau.
- **[INV-R6]** Đáp án completion nằm nguyên văn trong bài và đúng `wordLimit`.
- **[INV-R7]** Readability: Flesch–Kincaid Grade P1 10–12, P2 11–13, P3 12–15. Tỷ lệ từ thuộc AWL/NAWL ≥ 6%.
- **[INV-R8]** `blindSolve === 'pass'` (xem `05` §5).

## 6. Writing
```ts
type EssayType = 'opinion'|'discussion'|'adv_disadv'|'problem_solution'|'two_part'|'positive_negative';
interface Task2Prompt {
  id: `w2:${string}`; essayType: EssayType; topic: Topic; difficulty: number;
  prompt: string;                   // văn phong đề thật, tự viết mới
  partsToAddress: string[];         // "state the extent of agreement", "discuss view A", ...
  ideaBank: Array<{ side: 'for'|'against'|'cause'|'solution'|'neutral'; idea: string; develop: string }>; // ≥ 6
  band8Model: { text: string; wordCount: number; notes: Array<{ start: number; end: number; noteVi: string; criterion: 'TR'|'CC'|'LR'|'GRA' }> };
  usefulCollocationIds: string[];
  provenance: Provenance;
}
type ChartKind = 'bar'|'line'|'pie'|'table'|'mixed'|'process'|'map';
interface Task1Visual {
  id: `w1:${string}`; kind: ChartKind; topic: Topic; difficulty: number;
  prompt: string;                   // "The chart below shows… Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
  chart?: { title: string; unit: string; xLabel?: string; yLabel?: string;
            categories: string[]; series: Array<{ name: string; values: number[] }>; pie?: boolean };
  table?: { title: string; columns: string[]; rows: Array<Array<string|number>> };
  process?: { title: string; steps: Array<{ id: string; label: string; icon?: string }>; edges: Array<[string,string]>; cyclic: boolean };
  maps?: { before: MapSpec & { year: string }; after: MapSpec & { year: string } };
  keyFeatures: Array<{ id: string; kind: 'overall_trend'|'highest'|'lowest'|'comparison'|'change'|'stage'|'grouping'; textEn: string; mustMention: boolean }>;
  overviewModels: string[];         // 2–3 câu overview mẫu band 8
  overviewKeyPhrases?: string[];    // cụm cần highlight trong mẫu (W2)
  band8Model: { text: string; wordCount: number };
  provenance: Provenance;
}
```
- **[INV-W1]** `band8Model.wordCount`: Task 2 nằm trong 270–320, Task 1 trong 160–200, khớp thực tế ±2.
- **[INV-W2]** Task 1 có ≥ 3 `keyFeatures`, trong đó ≥ 1 có `kind:'overall_trend'` hoặc `kind:'grouping'` và `mustMention:true`.
- **[INV-W3]** Số liệu trong `band8Model` phải khớp `chart`/`table`. Validator trích mọi số trong văn bản rồi kiểm tra mỗi số có tồn tại trong dữ liệu (cho phép làm tròn ±1 đơn vị nhỏ nhất, hoặc là phép tính hiệu/tỷ lệ ghi trong `notes`).
- **[INV-W4]** Có ≥ 15 prompt cho mỗi `essayType`. Mỗi `kind` Task 1 có ≥ 6 visual.

## 7. Speaking
```ts
interface Part1Topic { id: `s1t:${string}`; topic: string; rotation: string; evergreen: boolean;
  questions: Array<{ qid: string; text: string; audio: string; ideaHintsEn: string[]; areSample?: { answer: string; reason: string; example: string } }> }
interface Part2CueCard { id: `s2c:${string}`; rotation: string; evergreen: boolean;
  category: 'person'|'place'|'object'|'event'|'experience'|'media'|'activity';
  prompt: string; bullets: string[]; finalBullet: string; audio: string;
  linkedPart3Id: `s3s:${string}`;
  sampleNotes: string[];            // ≤ 10 từ khoá, mẫu ghi chú 1 phút
  band8Sample: { text: string; estSeconds: number };   // 250–330 từ ≈ 2 phút
  roundingOffQs: string[]; }
interface Part3Set { id: `s3s:${string}`; linkedCueCardId: `s2c:${string}`;
  questions: Array<{ qid: string; text: string; type: 'compare'|'predict'|'evaluate'|'cause'|'solution'|'opinion'|'hypothetical'; audio: string;
                     followUps: Array<{ text: string; audio: string }> }> }   // 2–3 follow-up thu sẵn cho S1
interface SpeakingPhrase { id: `sph:${string}`; function: 'buy_time'|'opinion'|'contrast'|'example'|'speculate'|'conclude'|'clarify'|'generalise';
  phrase: string; ipa?: string; band6Equivalent: string; usageVi: string; example: string; audio: string }
```
- **[INV-S1]** Mỗi `Part2CueCard.linkedPart3Id` tồn tại và trỏ ngược lại đúng thẻ.
- **[INV-S2]** `rotation` khớp `^\d{4}-(Q1|Q2|Q3)$`, với Q1 = tháng 1–4, Q2 = 5–8, Q3 = 9–12.
- **[INV-S3]** Có ≥ 40% thẻ `evergreen`. Mỗi rotation đang hoạt động có ≥ 30 thẻ Part 2.

## 8. Thi thử
```ts
interface ExamTest { id: `xt:${string}`; title: string;
  listening: [`lep:${string}`, `lep:${string}`, `lep:${string}`, `lep:${string}`]; // part 1..4
  reading: [`rp:${string}`, `rp:${string}`, `rp:${string}`];                        // P1, P2, P3
  reserved: true }                  // nội dung dành riêng cho thi thử, không xuất hiện ở training
```
**[INV-X1]** Item thuộc `reserved` không xuất hiện trong pool training của L1/R1/R2. Loader phải lọc ra.

## 9. Manifest
Script `scripts/data/build_manifest.mjs` sinh `manifest.json`:
- `sha256` và `count` của mỗi file
- tổng số item theo loại
- ngày build

**[INV-M1]** Mọi file trong `public/data/**/*.json` (trừ file legacy) đều có trong manifest.
