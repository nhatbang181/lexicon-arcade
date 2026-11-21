# Author Guide for M4 Writing Data Batches

## Hard Rules (MUST PASS `_verify_batch.mjs` with 0 errors)
1. **100% original academic content** — NO Cambridge IELTS copying, NO fake findings attributed to real organisations or people (use fictional cities/towns/countries like "Alderbury", "Northport", "Country A / Country B" or general populations).
2. **British English spelling strictly**: `organise`, `organisation`, `programme`, `behaviour`, `colour`, `centre`, `analyse`, `prioritise`, `recognise`, `minimise`, `maximise`, `urbanisation`, `globalisation`, `emphasise`, `criticise`, `summarise`, `defence`, `labour`, `neighbour`, `travelling`, `modelling`, `fulfil`, `favour`, `realise`, `utilise`, `modernise`, `subsidise`, `standardise`, `specialise`, `characterise`, `commercialise`, `privatise`, `industrialise`, `stabilise`, `optimise`, `enrol`, `cancelled`, `fuelled`.
3. **ZERO CJK characters**, **straight ASCII double quotes `"`** inside JSON strings (use apostrophe `'` for contractions/possessives if needed, though avoid informal contractions in Band 8 Academic writing!).
4. **ZERO clichés** from `data-src/writing/cliches.json` in `band8Model.text` or `overviewModels`.
5. **Exact Provenance** on every item:
   ```json
   "provenance": {
     "createdBy": "llm+review",
     "source": "llm:gemini-4-neon@2026-11-21",
     "license": "own",
     "qa": { "schema": "pass", "verifier": "pass", "blindSolve": "na" }
   }
   ```

## Task 2 Schema (`WritingTask2PromptSchema`)
```json
{
  "id": "w2:001",
  "essayType": "opinion",
  "topic": "education",
  "difficulty": 2,
  "prompt": "...",
  "partsToAddress": ["State clearly whether and to what extent you agree or disagree", "Justify your position with developed arguments and relevant examples"],
  "ideaBank": [
    { "side": "for", "idea": "One clear point sentence.", "develop": "Specific explanation and concrete example showing consequence." }
  ],
  "band8Model": {
    "text": "Four paragraphs separated by \\n\\n, strictly 275-315 words.",
    "wordCount": 292,
    "notes": [
      { "start": 0, "end": 42, "noteVi": "Mở bài nêu lập trường rõ ngay câu cuối.", "criterion": "TR" }
    ]
  },
  "usefulCollocationIds": ["col:...", "col:...", "col:...", "col:..."],
  "provenance": { ... }
}
```
- `band8Model.text`: **275–315 words** (validator requires 270–320), 4 well-developed paragraphs (`\n\n`), clear thesis in intro, 2 developed body paragraphs with specific examples & consequences, concise conclusion, varied complex grammar, natural cohesion (no mechanical "Firstly/Secondly/Moreover/Furthermore" chains).
- `band8Model.wordCount`: **exact** `text.trim().split(/\s+/).length`.
- `band8Model.notes`: **6–8 notes** covering all 4 criteria (`TR`, `CC`, `LR`, `GRA`), with exact 0-based `start`/`end` character offsets pointing to real phrases inside `band8Model.text`! Tip: write a tiny `.mjs` generator script that computes `wordCount` and `notes` offsets via `text.indexOf(quote)` so offsets are 100% exact!
- `ideaBank`: **6 items** (`side` ∈ `'for'|'against'|'cause'|'solution'|'neutral'`), balanced 3+3 across both perspectives / causes+solutions / both parts.
- `usefulCollocationIds`: **4–6 real IDs** picked from `data-src/writing/_collocation_pool.json` matching the item's `topic` (or related academic topics if a topic has few entries).

## Task 1 Schema (`WritingTask1PromptSchema`)
```json
{
  "id": "w1:001",
  "kind": "bar",
  "topic": "energy",
  "difficulty": 2,
  "prompt": "The bar chart below shows ... Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  "chart": {
    "title": "...",
    "unit": "%",
    "xLabel": "...",
    "yLabel": "...",
    "categories": ["..."],
    "series": [{ "name": "...", "values": [10, 20, 30] }],
    "pie": false
  },
  "keyFeatures": [
    { "id": "kf1", "kind": "overall_trend", "textEn": "...", "mustMention": true },
    { "id": "kf2", "kind": "highest", "textEn": "...", "mustMention": true },
    { "id": "kf3", "kind": "comparison", "textEn": "...", "mustMention": true },
    { "id": "kf4", "kind": "lowest", "textEn": "...", "mustMention": false }
  ],
  "overviewModels": [
    "Overall, ... while ...",
    "In general, ... whereas ..."
  ],
  "overviewKeyPhrases": ["Overall,", "while", "by far the highest", "in contrast"],
  "band8Model": {
    "text": "Four short paragraphs (Intro, Overview, Body 1, Body 2), strictly 170-195 words.",
    "wordCount": 182
  },
  "provenance": { ... }
}
```
- `band8Model.text`: **170–195 words** (validator requires 165–200), 4 short paragraphs (`\n\n`): paraphrase intro, clear overview with NO specific figures, 2 body paragraphs with accurate figures & comparisons.
- **CRITICAL [INV-W3]**: For `bar`, `line`, `pie`, `table`, `mixed`, spell out small non-data counts in words ("three countries", "four age groups", "two decades", "five sectors") and use digits ONLY for chart/table data values, years/categories, and exact differences/ratios!
- **Pie**: `chart.pie = true`, and every `series[i].values` MUST sum to **exact 100**!
- **Mixed**: Include BOTH `chart` AND `table` fields!
- **Process**: `process: { title, steps: [{ id, label, icon? }], edges: [[fromId, toId]], cyclic: boolean }`, 6–9 steps, clear sequential/branching/cyclic edges.
- **Map**: `maps: { before: { year, viewBox: "0 0 800 560", compass: true, shapes: [...], slots: [] }, after: { year, viewBox: "0 0 800 560", compass: true, shapes: [...], slots: [] } }`. Every shape has `{ id, kind, x, y, w, h, label }` (`kind` ∈ `'building'|'road'|'path'|'water'|'park'|'parking'|'entrance'|'label'`), no overlapping text labels, 5–7 clear spatial changes described accurately in `keyFeatures`, `overviewModels`, and `band8Model`.
- `overviewKeyPhrases`: 4–6 phrases that appear **verbatim** (case-insensitive) inside `overviewModels`.

## Self-Verification Command (MUST PASS BEFORE REPORTING DONE)
```
node --import tsx data-src/writing/_verify_batch.mjs task2 <your-batch-file.json>
node --import tsx data-src/writing/_verify_batch.mjs task1 <your-batch-file.json>
```
