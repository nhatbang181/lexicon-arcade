import type { ReadingPassage, Span } from '../../core/content/schemas';

type ParagraphItem = { label: string; text: string };

function countWords(paragraphs: readonly ParagraphItem[]): number {
  return paragraphs
    .map((p) => p.text)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function makeSpan(paragraphs: readonly ParagraphItem[], label: string, quote: string): Span {
  const para = paragraphs.find((p) => p.label === label);
  if (!para) {
    throw new Error(`Fixture paragraph "${label}" not found`);
  }
  const start = para.text.indexOf(quote);
  if (start === -1) {
    throw new Error(`Quote not found in paragraph ${label}: "${quote}"`);
  }
  return {
    paragraph: label,
    start,
    end: start + quote.length,
    quote,
  };
}

// ---------------------------------------------------------------------------
// Passage 1 (P1 · Urban Environment · ~710 words · 13 questions)
// Groups: TFNG (6) + Summary Completion (4) + Matching Info (3)
// ---------------------------------------------------------------------------

const P1_PARAGRAPHS: ParagraphItem[] = [
  {
    label: 'A',
    text: 'Across rapidly expanding metropolitan centres, dark asphalt streets and dense concrete towers absorb solar radiation throughout the afternoon and release heat well past sunset. Municipal planners have long turned to street trees as a practical counterweight to this urban heat island effect, particularly in densely built residential districts where parks are scarce. A single mature deciduous tree can lower air temperatures directly beneath its crown by several degrees through continuous shade and moisture evaporation from its leaves. In addition, urban forestry advocates note that tree-lined corridors encourage walking and cycling during warm months, softening the stark geometry of high-density neighbourhoods. Yet behind the reassuring public image of leafy avenues lies a more intricate balance of ecological benefits, ongoing maintenance obligations, and underground engineering constraints that city councils frequently underestimate during initial budgeting.',
  },
  {
    label: 'B',
    text: 'When local authorities announce ambitious tree-planting campaigns, public attention usually focuses on the headline number of saplings rather than long-term survival rates. Urban forestry surveys indicate that some cities have expanded their canopy by 10% over the past decade, though few metropolitan regions have come close to doubling overall coverage despite bold sustainability pledges. Newly planted saplings face compacted subsoil, winter road salt, severely restricted root vaults, and accidental damage from delivery vehicles or routine utility repairs. In commercial corridors with narrow pavements, nearly a third of young street trees fail to survive beyond their first five years unless dedicated irrigation and protective guards are financed from the outset.',
  },
  {
    label: 'C',
    text: 'Species selection also carries unexpected consequences for neighbourhood air quality and seasonal public comfort. Certain fast-growing evergreens and poplars emit biogenic volatile organic compounds during prolonged heatwaves; when these natural gases mix with nitrogen oxides from heavy traffic, they can accelerate the formation of ground-level ozone in stagnant summer air. Conversely, broad-leaved trees with rough or slightly waxy foliage trap airborne particulate matter far more effectively than smooth-leaved varieties, acting as living filters beside busy junctions. Planners must therefore weigh visual uniformity against biological diversity, since planting a single popular species along dozens of boulevards leaves the entire streetscape vulnerable to pest outbreaks or fungal blight.',
  },
  {
    label: 'D',
    text: 'Below ground, the quiet rivalry between expanding tree roots and buried infrastructure represents one of the costliest operational challenges for city engineers. Roots naturally migrate toward loose, damp soil, which is often found around ageing drainage pipes, district heating mains, and freshly laid broadband conduits. As roots thicken over several decades, they can lift paving slabs, create serious trip hazards for pedestrians, and crack low masonry walls bordering private gardens. Modern landscape architects increasingly address this conflict by installing structural soil cells—modular plastic crates buried beneath footpaths that bear the weight of pavements while leaving uncompacted pockets of earth for healthy root expansion.',
  },
  {
    label: 'E',
    text: 'Although pruning and inspection budgets draw frequent scrutiny from local taxpayers, economic assessments consistently demonstrate that well-managed urban forests generate substantial measurable financial returns. Shaded building facades require noticeably less mechanical cooling during summer peaks, lowering electricity demand across residential districts and reducing strain on regional power grids. In addition, mature tree canopies intercept heavy rainfall before it strikes impervious road surfaces, slowing stormwater runoff and relieving pressure on overloaded drainage networks during seasonal cloudbursts. Municipal accountants who factor in avoided flood repairs and energy savings typically find that healthy street trees return far more public value than their annual upkeep costs. Property valuations also respond positively over time: houses located on tree-lined streets routinely command higher resale prices than comparable homes situated on treeless blocks nearby.',
  },
  {
    label: 'F',
    text: 'Equitable distribution remains an unresolved social dimension of modern urban greening programmes. Satellite imagery of dozens of industrialised cities reveals that affluent residential neighbourhoods tend to enjoy markedly denser canopy cover than lower-income districts situated near expressways, rail yards, or industrial warehouses. Closing this persistent green gap demands far more than distributing free saplings to local households, because tenants in rented accommodation often lack both the legal permission from landlords and the spare time required to water and prune street trees consistently. Increasingly, urban ecologists argue that municipal trees should be funded and inspected as essential civic infrastructure, on the same footing as streetlights, bridges, and public drainage.',
  },
];

export const R1_FIXTURE_P1: ReadingPassage = {
  id: 'rp:fixture-p1-urban-trees',
  level: 'P1',
  reserved: false,
  title: 'The Hidden Cost and Value of Urban Trees',
  subtitle: 'Why building a resilient city canopy requires more than planting saplings',
  topic: 'urban',
  paragraphs: P1_PARAGRAPHS,
  wordCount: countWords(P1_PARAGRAPHS),
  glossary: [
    { term: 'deciduous', meaningVi: 'cây rụng lá theo mùa' },
    { term: 'saplings', meaningVi: 'cây non mới trồng' },
    { term: 'biogenic', meaningVi: 'có nguồn gốc sinh học (do thực vật/sinh vật tạo ra)' },
    { term: 'impervious', meaningVi: 'không thấm nước (như mặt đường nhựa)' },
    { term: 'canopy', meaningVi: 'tán cây, độ che phủ tán lá' },
  ],
  questionGroups: [
    {
      groupId: 'p1-g1-tfng',
      type: 'tfng',
      instructions:
        'Do the following statements agree with the information given in the passage? Choose TRUE, FALSE, or NOT GIVEN.',
      questions: [
        {
          qid: 'p1-q1',
          number: 1,
          prompt: 'Most cities have already doubled their tree canopy over the last ten years.',
          answer: { key: 'FALSE' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'B',
              'Urban forestry surveys indicate that some cities have expanded their canopy by 10% over the past decade, though few metropolitan regions have come close to doubling overall coverage despite bold sustainability pledges.',
            ),
          ],
          trapType: 'qualifier',
          explanationVi:
            'Bài đọc nói chỉ một số thành phố tăng 10% và rất ít nơi tiến gần mức tăng gấp đôi, mâu thuẫn trực tiếp với "Most cities have already doubled".',
          steps: [
            'Từ khoá định vị: "tree canopy", "doubled", "last ten years" ↔ "past decade".',
            'Đọc đoạn B: bài nêu "some cities have expanded their canopy by 10%" và "few... come close to doubling".',
            'So lượng từ: "most cities" ≠ "few metropolitan regions"; "doubled" ≠ "expanded by 10%".',
            'Thông tin mâu thuẫn trực tiếp → FALSE.',
          ],
        },
        {
          qid: 'p1-q2',
          number: 2,
          prompt:
            'In narrow commercial streets, inadequate early funding for watering and protection increases sapling mortality.',
          answer: { key: 'TRUE' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'B',
              'In commercial corridors with narrow pavements, nearly a third of young street trees fail to survive beyond their first five years unless dedicated irrigation and protective guards are financed from the outset.',
            ),
          ],
          trapType: 'causation',
          explanationVi:
            'Đoạn B khẳng định gần 1/3 cây non ở phố thương mại hẹp không sống qua 5 năm đầu nếu không được cấp kinh phí tưới và rào bảo vệ ngay từ đầu.',
          steps: [
            'Tìm cụm paraphrase: "narrow commercial streets" ↔ "commercial corridors with narrow pavements".',
            'So điều kiện: "inadequate early funding for watering" ↔ "unless dedicated irrigation... are financed from the outset".',
            'So hệ quả: "increases sapling mortality" ↔ "nearly a third of young street trees fail to survive".',
            'Khớp hoàn toàn cả điều kiện lẫn kết quả → TRUE.',
          ],
        },
        {
          qid: 'p1-q3',
          number: 3,
          prompt:
            'Smooth-leaved trees capture more airborne dust particles than broad-leaved species with rough foliage.',
          answer: { key: 'FALSE' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'C',
              'Conversely, broad-leaved trees with rough or slightly waxy foliage trap airborne particulate matter far more effectively than smooth-leaved varieties, acting as living filters beside busy junctions.',
            ),
          ],
          trapType: 'comparison',
          explanationVi:
            'Câu hỏi đảo ngược chiều so sánh: bài đọc nói cây lá rộng bề mặt nhám giữ bụi hiệu quả hơn hẳn cây lá nhẵn.',
          steps: [
            'Định vị đoạn C qua cụm "airborne dust particles" ↔ "airborne particulate matter".',
            'Kiểm tra chiều so sánh: bài viết "rough or slightly waxy foliage trap... far more effectively than smooth-leaved varieties".',
            'Câu hỏi đảo ngược thành cây lá nhẵn giữ nhiều hơn → mâu thuẫn rõ → FALSE.',
          ],
        },
        {
          qid: 'p1-q4',
          number: 4,
          prompt:
            'Structural soil cells are currently manufactured primarily from recycled household plastics.',
          answer: { key: 'NOT GIVEN' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'D',
              'Modern landscape architects increasingly address this conflict by installing structural soil cells—modular plastic crates buried beneath footpaths that bear the weight of pavements while leaving uncompacted pockets of earth for healthy root expansion.',
            ),
          ],
          trapType: 'extra_claim',
          explanationVi:
            'Đoạn D chỉ mô tả structural soil cells là các khung nhựa mô-đun (modular plastic crates), không hề nhắc chúng có làm từ nhựa tái chế gia dụng hay không.',
          steps: [
            'Định vị cụm "structural soil cells" ở đoạn D.',
            'Bài chỉ đề cập chất liệu là "modular plastic crates" (khung nhựa mô-đun).',
            'Chi tiết "primarily from recycled household plastics" không được nhắc tới → NOT GIVEN.',
          ],
        },
        {
          qid: 'p1-q5',
          number: 5,
          prompt:
            'Tree shade can decrease the amount of electricity needed to cool residential buildings in summer.',
          answer: { key: 'TRUE' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'E',
              'Shaded building facades require noticeably less mechanical cooling during summer peaks, lowering electricity demand across residential districts and reducing strain on regional power grids.',
            ),
          ],
          trapType: 'keyword_echo',
          explanationVi:
            'Đoạn E nêu rõ mặt tiền được che bóng cần ít làm mát cơ học hơn vào cao điểm hè, từ đó giảm nhu cầu điện ở khu dân cư.',
          steps: [
            'Định vị đoạn E: "electricity needed to cool" ↔ "mechanical cooling... lowering electricity demand".',
            'So phạm vi: "residential buildings in summer" ↔ "during summer peaks... across residential districts".',
            'Ý nghĩa đồng nhất hoàn toàn → TRUE.',
          ],
        },
        {
          qid: 'p1-q6',
          number: 6,
          prompt:
            'Several European capitals have already passed laws classifying street trees as civic infrastructure.',
          answer: { key: 'NOT GIVEN' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'F',
              'Increasingly, urban ecologists argue that municipal trees should be funded and inspected as essential civic infrastructure, on the same footing as streetlights, bridges, and public drainage.',
            ),
          ],
          trapType: 'opinion_vs_fact',
          explanationVi:
            'Đoạn F chỉ nêu đề xuất của các nhà sinh thái đô thị rằng cây xanh NÊN được xem là hạ tầng công cộng; bài không đề cập thủ đô châu Âu nào đã ban hành luật.',
          steps: [
            'Định vị cụm "civic infrastructure" ở cuối đoạn F.',
            'Bài dùng động từ "argue that municipal trees should be funded" (kiến nghị, chưa nói thành luật).',
            'Không hề có thông tin về "European capitals" hay việc ban hành luật → NOT GIVEN.',
          ],
        },
      ],
    },
    {
      groupId: 'p1-g2-summary',
      type: 'summary_completion',
      instructions:
        'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      wordLimit: { words: 2, allowNumber: false },
      summaryText:
        'Relying on just one tree species across many streets increases vulnerability to pests and [Q7]. Beneath pavements, growing roots seek moist earth near pipes and broadband conduits, potentially lifting [Q8] and damaging walls. On the other hand, mature canopies help manage urban flooding by slowing [Q9]. Because renters may lack permission or time to care for young trees, specialists suggest treating street trees like [Q10].',
      questions: [
        {
          qid: 'p1-q7',
          number: 7,
          prompt: 'Increases vulnerability to pests and [Q7]',
          answer: { accepted: ['fungal blight', 'blight'] },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'C',
              'since planting a single popular species along dozens of boulevards leaves the entire streetscape vulnerable to pest outbreaks or fungal blight.',
            ),
          ],
          explanationVi: 'Đoạn C nêu rõ trồng đơn loài khiến đường phố dễ bị sâu hại hoặc "fungal blight".',
        },
        {
          qid: 'p1-q8',
          number: 8,
          prompt: 'Potentially lifting [Q8] and damaging walls',
          answer: { accepted: ['paving slabs'] },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'D',
              'As roots thicken over several decades, they can lift paving slabs, create serious trip hazards for pedestrians, and crack low masonry walls bordering private gardens.',
            ),
          ],
          explanationVi: 'Đoạn D viết nguyên văn "they can lift paving slabs".',
        },
        {
          qid: 'p1-q9',
          number: 9,
          prompt: 'Help manage urban flooding by slowing [Q9]',
          answer: { accepted: ['stormwater runoff', 'runoff'] },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'E',
              'slowing stormwater runoff and relieving pressure on overloaded drainage networks during seasonal cloudbursts.',
            ),
          ],
          explanationVi: 'Đoạn E viết nguyên văn "slowing stormwater runoff".',
        },
        {
          qid: 'p1-q10',
          number: 10,
          prompt: 'Treating street trees like [Q10]',
          answer: { accepted: ['civic infrastructure'] },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'F',
              'urban ecologists argue that municipal trees should be funded and inspected as essential civic infrastructure',
            ),
          ],
          explanationVi: 'Đoạn F dùng cụm "civic infrastructure" (đúng giới hạn tối đa 2 từ).',
        },
      ],
    },
    {
      groupId: 'p1-g3-matching-info',
      type: 'matching_info',
      instructions:
        'Which paragraph contains the following information? Choose the correct letter, A–F.',
      options: [
        { key: 'A', text: 'Paragraph A' },
        { key: 'B', text: 'Paragraph B' },
        { key: 'C', text: 'Paragraph C' },
        { key: 'D', text: 'Paragraph D' },
        { key: 'E', text: 'Paragraph E' },
        { key: 'F', text: 'Paragraph F' },
      ],
      questions: [
        {
          qid: 'p1-q11',
          number: 11,
          prompt:
            'An explanation of how natural emissions from particular tree species interact with vehicle exhaust.',
          answer: { key: 'C' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'C',
              'Certain fast-growing evergreens and poplars emit biogenic volatile organic compounds during prolonged heatwaves; when these natural gases mix with nitrogen oxides from heavy traffic, they can accelerate the formation of ground-level ozone in stagnant summer air.',
            ),
          ],
          explanationVi:
            'Đoạn C giải thích khí sinh học từ một số loài cây tương tác với khí thải giao thông tạo ozone.',
        },
        {
          qid: 'p1-q12',
          number: 12,
          prompt:
            'Evidence of unequal canopy coverage between wealthier and lower-income urban areas.',
          answer: { key: 'F' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'F',
              'Satellite imagery of dozens of industrialised cities reveals that affluent residential neighbourhoods tend to enjoy markedly denser canopy cover than lower-income districts situated near expressways, rail yards, or industrial warehouses.',
            ),
          ],
          explanationVi:
            'Đoạn F dẫn ảnh vệ tinh cho thấy khu dân cư giàu có mật độ tán cây dày hơn rõ rệt so với khu thu nhập thấp.',
        },
        {
          qid: 'p1-q13',
          number: 13,
          prompt:
            'A description of an underground engineering device designed to protect footpaths while aiding root growth.',
          answer: { key: 'D' },
          evidence: [
            makeSpan(
              P1_PARAGRAPHS,
              'D',
              'Modern landscape architects increasingly address this conflict by installing structural soil cells—modular plastic crates buried beneath footpaths that bear the weight of pavements while leaving uncompacted pockets of earth for healthy root expansion.',
            ),
          ],
          explanationVi:
            'Đoạn D mô tả structural soil cells đặt dưới vỉa hè giúp chịu tải mà vẫn giữ đất tơi cho rễ phát triển.',
        },
      ],
    },
  ],
  provenance: {
    createdBy: 'llm+review',
    source: 'Original Lexicon Arcade V3 fixture',
    license: 'CC0-1.0',
    qa: { schema: 'pass', verifier: 'pass', blindSolve: 'pass' },
  },
};

// ---------------------------------------------------------------------------
// Passage 3 (P3 · Cognitive Psychology & Digital Archives · ~845 words · 14 questions)
// Groups: Matching Headings (5) + YNNG (6) + Sentence Completion (3)
// ---------------------------------------------------------------------------

const P3_PARAGRAPHS: ParagraphItem[] = [
  {
    label: 'A',
    text: 'Long before smartphones placed encyclopaedic databases in every pocket, human societies relied on external repositories to extend the fragile limits of biological memory. From notched tally sticks and clay accounting tablets to printed indexes, wall calendars, and municipal libraries, cognitive offloading has been an enduring hallmark of cultural evolution across nearly every documented civilisation. Anthropologists observe that without shared written records, complex trade networks, legal codes, and astronomical calendars could never have been transmitted reliably across generations. Yet contemporary critics frequently warn that instant digital search is fundamentally eroding our capacity for sustained attention and deep recall. Such anxieties echo ancient reservations about writing itself, which some classical thinkers feared would cultivate the mere illusion of wisdom while gradually weakening internal recollection. Whether networked devices represent a genuine rupture in human cognition or simply a faster, more pervasive iteration of an ancient adaptive habit remains a lively subject of debate among cognitive scientists.',
  },
  {
    label: 'B',
    text: 'Experimental research on what psychologists term transactive memory sheds considerable light on how the human brain reorganises itself when information is reliably stored elsewhere. In long-standing domestic partnerships or specialist workplaces, individuals rarely attempt to memorise every operational detail themselves; instead, they build a shared mental directory of who holds particular expertise and precisely how to retrieve it when required. Controlled laboratory studies indicate that people now treat search engines, bookmarking tools, and cloud folders in much the same collaborative way. When participants expect a digital file to be saved automatically after a task, they tend to encode the folder location rather than the verbatim text inside it. Far from demonstrating cognitive laziness, this adaptive strategy frees limited working memory for higher-order synthesis, critical judgement, and complex problem-solving.',
  },
  {
    label: 'C',
    text: 'Nevertheless, outsourcing factual storage to networked servers is not entirely cost-free, especially when retrieval feels effortless. Because modern search algorithms return fluent, plausible answers within milliseconds, learners can easily mistake rapid access for genuine personal understanding—a metacognitive distortion researchers describe as the illusion of explanatory depth. In controlled trials, volunteers permitted to look up trivia questions online subsequently rated their own unaided general knowledge significantly higher than peers who solved identical prompts without external assistance, even when asked about completely unrelated academic topics. Importantly, this inflated self-assessment persisted even when participants had merely glanced at search summaries rather than reading full reference articles. Overconfidence of this kind carries serious practical risks in fields such as clinical diagnosis, emergency response, or commercial aviation, where seasoned practitioners must occasionally make split-second decisions without consulting a screen or waiting for an unstable network signal.',
  },
  {
    label: 'D',
    text: 'Equally significant is the subtle manner in which external archives reshape what ordinary people notice and remember about lived experience. Museum studies conducted with student volunteers have shown that visitors instructed to photograph historical artefacts repeatedly later recalled fewer visual details about those objects than visitors who simply observed them attentively without electronic devices. Psychologists refer to this tendency as the photo-taking impairment effect, suggesting that clicking a shutter signals to the brain that the visual record has been safely delegated. However, follow-up experiments complicate that initial picture: when participants zoomed in on specific structural features deliberately, their subsequent memory of both zoomed and surrounding details actually improved. The decisive factor therefore appears not to be the presence of a camera or notebook, but whether recording replaces active mental engagement or guides focused attention.',
  },
  {
    label: 'E',
    text: 'Defenders of traditional memorisation contend that rich internalised knowledge still underpins genuine creative insight, because novel analogies arise only when disparate concepts collide inside a single working mind. One cannot formulate a search query for an unexpected connection between two distant disciplines without first possessing enough background familiarity to suspect that a meaningful link might exist. Historians of science note that major conceptual breakthroughs often emerged when researchers held competing theoretical frameworks simultaneously in memory rather than retrieving isolated facts one search query at a time. Consequently, educational curricula that abandon foundational recall altogether in favour of pure search skills risk leaving students agile at locating scattered fragments yet ill-equipped to evaluate whether an unfamiliar claim is internally coherent.',
  },
  {
    label: 'F',
    text: 'A more balanced and pragmatic synthesis is gradually emerging across both cognitive laboratories and forward-looking classrooms. Rather than framing biological memory and digital archives as rival systems locked in a zero-sum contest, scholars increasingly view them as complementary layers of an extended cognitive architecture. Just as musicians still internalise scales and harmonic structures even when printed scores sit open on a stand, knowledge workers benefit from anchoring core principles internally while keeping peripheral detail externally searchable. Effective thinkers cultivate a durable core of structured conceptual schemas internally while delegating volatile numbers, bibliographic citations, and procedural checklists to dependable external tools. Training learners to recognise which foundational knowledge warrants deliberate rehearsal—and which transient details can safely remain on a hard drive—may prove far more valuable than either nostalgic bans on technology or uncritical faith in constant connectivity.',
  },
];

export const R1_FIXTURE_P3: ReadingPassage = {
  id: 'rp:fixture-p3-external-memory',
  level: 'P3',
  reserved: false,
  title: 'Rethinking Human Memory in the Age of External Archives',
  subtitle: 'How digital tools reshape what we store inside our minds—and what we leave outside',
  topic: 'psychology',
  paragraphs: P3_PARAGRAPHS,
  wordCount: countWords(P3_PARAGRAPHS),
  glossary: [
    { term: 'cognitive offloading', meaningVi: 'gửi gắm bớt gánh nặng ghi nhớ ra công cụ bên ngoài' },
    { term: 'transactive memory', meaningVi: 'trí nhớ phân tán/tương tác giữa các cá nhân hoặc công cụ' },
    { term: 'verbatim', meaningVi: 'nguyên văn từng chữ một' },
    { term: 'conceptual schemas', meaningVi: 'khung khái niệm có cấu trúc trong trí nhớ' },
  ],
  questionGroups: [
    {
      groupId: 'p3-g1-headings',
      type: 'headings',
      instructions:
        'Choose the correct heading for Paragraphs A–E from the list of headings below (i–vii).',
      headings: [
        { key: 'i', text: 'How remembering where to look replaces memorising exact details' },
        { key: 'ii', text: 'Why internalised background knowledge still fuels original thinking' },
        { key: 'iii', text: 'Recurring historical fears about relying on memory aids' },
        { key: 'iv', text: 'How instant retrieval can inflate confidence in personal knowledge' },
        { key: 'v', text: 'Why digital cameras have completely replaced museum guides' },
        { key: 'vi', text: 'When documenting an experience helps or hinders visual recall' },
        { key: 'vii', text: 'Evidence that older adults outperform students in online search' },
      ],
      questions: [
        {
          qid: 'p3-q1',
          number: 1,
          prompt: 'Paragraph A',
          answer: { key: 'iii' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'A',
              'Such anxieties echo ancient reservations about writing itself, which some classical thinkers feared would cultivate the mere illusion of wisdom while gradually weakening internal recollection.',
            ),
          ],
          mainIdeaSpan: makeSpan(
            P3_PARAGRAPHS,
            'A',
            'Whether networked devices represent a genuine rupture in human cognition or simply a faster, more pervasive iteration of an ancient adaptive habit remains a lively subject of debate among cognitive scientists.',
          ),
          headingDistractors: [
            {
              key: 'i',
              type: 'adjacent_paragraph',
              whyVi: 'Tiêu đề i thuộc về đoạn B (nhớ vị trí thư mục thay vì chi tiết), không phải ý chính đoạn A.',
            },
            {
              key: 'ii',
              type: 'too_broad',
              whyVi: 'Đoạn A chưa bàn tới tư duy sáng tạo; nội dung đó nằm ở đoạn E.',
            },
          ],
          explanationVi: 'Đoạn A đặt nỗi lo về tìm kiếm số cạnh nỗi lo cổ đại về chữ viết — một nỗi sợ lặp lại trong lịch sử.',
        },
        {
          qid: 'p3-q2',
          number: 2,
          prompt: 'Paragraph B',
          answer: { key: 'i' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'B',
              'When participants expect a digital file to be saved automatically after a task, they tend to encode the folder location rather than the verbatim text inside it.',
            ),
          ],
          mainIdeaSpan: makeSpan(
            P3_PARAGRAPHS,
            'B',
            'Experimental research on what psychologists term transactive memory sheds considerable light on how the human brain reorganises itself when information is reliably stored elsewhere.',
          ),
          headingDistractors: [
            {
              key: 'iv',
              type: 'adjacent_paragraph',
              whyVi: 'Ảo giác tự tin quá mức nằm ở đoạn C, không phải đoạn B.',
            },
            {
              key: 'vii',
              type: 'keyword_match',
              whyVi: 'Đoạn B nhắc search engines nhưng không hề so sánh người lớn tuổi với sinh viên.',
            },
          ],
          explanationVi: 'Đoạn B giải thích cơ chế transactive memory: não ưu tiên nhớ vị trí lưu trữ thay vì thuộc lòng nguyên văn.',
        },
        {
          qid: 'p3-q3',
          number: 3,
          prompt: 'Paragraph C',
          answer: { key: 'iv' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'C',
              'Because modern search algorithms return fluent, plausible answers within milliseconds, learners can easily mistake rapid access for genuine personal understanding—a metacognitive distortion researchers describe as the illusion of explanatory depth.',
            ),
          ],
          mainIdeaSpan: makeSpan(
            P3_PARAGRAPHS,
            'C',
            'Because modern search algorithms return fluent, plausible answers within milliseconds, learners can easily mistake rapid access for genuine personal understanding—a metacognitive distortion researchers describe as the illusion of explanatory depth.',
          ),
          headingDistractors: [
            {
              key: 'i',
              type: 'adjacent_paragraph',
              whyVi: 'Đoạn C nói về sự tự tin thái quá, không nói về việc lưu vị trí thư mục.',
            },
            {
              key: 'vi',
              type: 'detail_only',
              whyVi: 'Việc chụp ảnh/ghi chép trải nghiệm chỉ xuất hiện ở đoạn D.',
            },
          ],
          explanationVi: 'Đoạn C tập trung vào việc tra cứu tức thì khiến người học đánh giá quá cao kiến thức tự thân của mình.',
        },
        {
          qid: 'p3-q4',
          number: 4,
          prompt: 'Paragraph D',
          answer: { key: 'vi' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'D',
              'The decisive factor therefore appears not to be the presence of a camera or notebook, but whether recording replaces active mental engagement or guides focused attention.',
            ),
          ],
          mainIdeaSpan: makeSpan(
            P3_PARAGRAPHS,
            'D',
            'The decisive factor therefore appears not to be the presence of a camera or notebook, but whether recording replaces active mental engagement or guides focused attention.',
          ),
          headingDistractors: [
            {
              key: 'v',
              type: 'opposite_stance',
              whyVi: 'Đoạn D có từ "museum" và "camera" (bẫy từ khoá), nhưng hoàn toàn không nói máy ảnh thay thế hướng dẫn viên.',
            },
            {
              key: 'iv',
              type: 'adjacent_paragraph',
              whyVi: 'Tiêu đề iv là ý chính của đoạn C.',
            },
          ],
          explanationVi: 'Đoạn D phân tích hai chiều: chụp ảnh hàng loạt làm giảm nhớ chi tiết, nhưng chủ động zoom vào chi tiết lại giúp nhớ tốt hơn.',
        },
        {
          qid: 'p3-q5',
          number: 5,
          prompt: 'Paragraph E',
          answer: { key: 'ii' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'E',
              'Defenders of traditional memorisation contend that rich internalised knowledge still underpins genuine creative insight, because novel analogies arise only when disparate concepts collide inside a single working mind.',
            ),
          ],
          mainIdeaSpan: makeSpan(
            P3_PARAGRAPHS,
            'E',
            'Defenders of traditional memorisation contend that rich internalised knowledge still underpins genuine creative insight, because novel analogies arise only when disparate concepts collide inside a single working mind.',
          ),
          headingDistractors: [
            {
              key: 'iii',
              type: 'keyword_match',
              whyVi: 'Đoạn E có nhắc "Historians of science" nhưng không bàn về nỗi sợ lặp lại trong lịch sử.',
            },
            {
              key: 'vi',
              type: 'adjacent_paragraph',
              whyVi: 'Tiêu đề vi thuộc về đoạn D.',
            },
          ],
          explanationVi: 'Đoạn E lý giải vì sao nền kiến thức được nội tâm hoá vẫn là chất liệu cho sự liên tưởng sáng tạo và đột phá khoa học.',
        },
      ],
    },
    {
      groupId: 'p3-g2-ynng',
      type: 'ynng',
      instructions:
        'Do the following statements agree with the views of the writer in the passage? Choose YES, NO, or NOT GIVEN.',
      questions: [
        {
          qid: 'p3-q6',
          number: 6,
          prompt:
            'Remembering where digital information is stored rather than its exact wording reflects mental laziness.',
          answer: { key: 'NO' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'B',
              'Far from demonstrating cognitive laziness, this adaptive strategy frees limited working memory for higher-order synthesis, critical judgement, and complex problem-solving.',
            ),
          ],
          trapType: 'opinion_vs_fact',
          explanationVi:
            'Tác giả bác bỏ thẳng quan điểm này bằng cụm "Far from demonstrating cognitive laziness" và gọi đó là chiến lược thích nghi.',
          steps: [
            'Định vị đoạn B qua cụm "mental laziness" ↔ "cognitive laziness".',
            'Chú ý tín hiệu phủ định mạnh: "Far from demonstrating cognitive laziness".',
            'Quan điểm câu hỏi trái ngược hoàn toàn với tác giả → NO.',
          ],
        },
        {
          qid: 'p3-q7',
          number: 7,
          prompt:
            'Overestimating personal knowledge due to fast internet search can be hazardous in high-pressure professions.',
          answer: { key: 'YES' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'C',
              'Overconfidence of this kind carries serious practical risks in fields such as clinical diagnosis, emergency response, or commercial aviation, where seasoned practitioners must occasionally make split-second decisions without consulting a screen or waiting for an unstable network signal.',
            ),
          ],
          trapType: 'causation',
          explanationVi:
            'Đoạn C khẳng định sự tự tin quá mức mang rủi ro thực tế trong y khoa, cấp cứu và hàng không khi cần ra quyết định tức thì không có màn hình.',
          steps: [
            'Paraphrase: "hazardous" ↔ "carries serious practical risks"; "high-pressure professions" ↔ "clinical diagnosis, emergency response, or commercial aviation".',
            'So thái độ tác giả ở đoạn C: khẳng định trực tiếp mối nguy này.',
            'Trùng khớp với quan điểm tác giả → YES.',
          ],
        },
        {
          qid: 'p3-q8',
          number: 8,
          prompt:
            'Simply bringing a camera into a museum inevitably worsens a visitor’s visual memory of every exhibit.',
          answer: { key: 'NO' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'D',
              'The decisive factor therefore appears not to be the presence of a camera or notebook, but whether recording replaces active mental engagement or guides focused attention.',
            ),
          ],
          trapType: 'qualifier',
          explanationVi:
            'Đoạn D phủ nhận việc mang máy ảnh chắc chắn làm hại trí nhớ ("not to be the presence of a camera"), thậm chí zoom có chủ đích còn cải thiện trí nhớ.',
          steps: [
            'Chú ý từ tuyệt đối "inevitably" (chắc chắn luôn luôn) và "every exhibit".',
            'Đọc đoạn D: "when participants zoomed in... subsequent memory... actually improved" và "not to be the presence of a camera".',
            'Trái ngược với kết luận của tác giả → NO.',
          ],
        },
        {
          qid: 'p3-q9',
          number: 9,
          prompt:
            'Most universities now prohibit students from using search engines during introductory science lectures.',
          answer: { key: 'NOT GIVEN' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'E',
              'Consequently, educational curricula that abandon foundational recall altogether in favour of pure search skills risk leaving students agile at locating scattered fragments yet ill-equipped to evaluate whether an unfamiliar claim is internally coherent.',
            ),
          ],
          trapType: 'extra_claim',
          explanationVi:
            'Đoạn E bàn về rủi ro của chương trình học bỏ qua ghi nhớ nền tảng, hoàn toàn không đề cập việc đa số đại học cấm công cụ tìm kiếm trong giờ giảng.',
          steps: [
            'Quét đoạn E và F tìm "universities" hoặc "prohibit".',
            'Bài chỉ bàn xu hướng chương trình học ("educational curricula") và tránh "nostalgic bans on technology".',
            'Không có thông tin về quy định của đa số trường đại học → NOT GIVEN.',
          ],
        },
        {
          qid: 'p3-q10',
          number: 10,
          prompt:
            'Teaching learners to distinguish what should be memorised from what can be stored externally is better than banning digital tools.',
          answer: { key: 'YES' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'F',
              'Training learners to recognise which foundational knowledge warrants deliberate rehearsal—and which transient details can safely remain on a hard drive—may prove far more valuable than either nostalgic bans on technology or uncritical faith in constant connectivity.',
            ),
          ],
          trapType: 'comparison',
          explanationVi:
            'Câu cuối đoạn F khẳng định rèn khả năng phân biệt cái cần học thuộc với cái nên lưu ngoài có giá trị hơn nhiều so với việc cấm công nghệ.',
          steps: [
            'Paraphrase: "distinguish what should be memorised" ↔ "recognise which foundational knowledge warrants deliberate rehearsal".',
            'So sánh: "better than banning digital tools" ↔ "far more valuable than... nostalgic bans on technology".',
            'Khớp hoàn toàn quan điểm tác giả → YES.',
          ],
        },
        {
          qid: 'p3-q11',
          number: 11,
          prompt:
            'Cognitive scientists now agree on the exact age at which children should start using digital note-taking apps.',
          answer: { key: 'NOT GIVEN' },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'F',
              'A more balanced and pragmatic synthesis is gradually emerging across both cognitive laboratories and forward-looking classrooms.',
            ),
          ],
          trapType: 'number_date',
          explanationVi:
            'Bài đọc không hề nhắc tới độ tuổi cụ thể để trẻ em bắt đầu dùng ứng dụng ghi chú số.',
          steps: [
            'Tìm từ khoá "exact age", "children", "note-taking apps" trong đoạn F và toàn bài.',
            'Bài chỉ nhắc chung "learners" và "classrooms", không bàn độ tuổi trẻ em.',
            'Không có căn cứ để khẳng định hay phủ định → NOT GIVEN.',
          ],
        },
      ],
    },
    {
      groupId: 'p3-g3-sentence-completion',
      type: 'sentence_completion',
      instructions:
        'Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.',
      wordLimit: { words: 1, allowNumber: false },
      questions: [
        {
          qid: 'p3-q12',
          number: 12,
          prompt:
            'Using external storage tools frees up working memory for tasks such as critical judgement, complex problem-solving, and higher-order ________.',
          answer: { accepted: ['synthesis'] },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'B',
              'this adaptive strategy frees limited working memory for higher-order synthesis, critical judgement, and complex problem-solving.',
            ),
          ],
          explanationVi: 'Đoạn B liệt kê ba năng lực: "higher-order synthesis, critical judgement, and complex problem-solving".',
        },
        {
          qid: 'p3-q13',
          number: 13,
          prompt:
            'Without solid background knowledge, students who excel only at search skills may struggle to judge whether a new claim is internally ________.',
          answer: { accepted: ['coherent'] },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'E',
              'risk leaving students agile at locating scattered fragments yet ill-equipped to evaluate whether an unfamiliar claim is internally coherent.',
            ),
          ],
          explanationVi: 'Đoạn E viết nguyên văn "whether an unfamiliar claim is internally coherent".',
        },
        {
          qid: 'p3-q14',
          number: 14,
          prompt:
            'Skilled thinkers keep structured concepts internally while delegating frequently changing figures, bibliographic citations, and procedural ________ to external tools.',
          answer: { accepted: ['checklists'] },
          evidence: [
            makeSpan(
              P3_PARAGRAPHS,
              'F',
              'while delegating volatile numbers, bibliographic citations, and procedural checklists to dependable external tools.',
            ),
          ],
          explanationVi: 'Đoạn F viết nguyên văn "procedural checklists" (1 từ: checklists).',
        },
      ],
    },
  ],
  provenance: {
    createdBy: 'llm+review',
    source: 'Original Lexicon Arcade V3 fixture',
    license: 'CC0-1.0',
    qa: { schema: 'pass', verifier: 'pass', blindSolve: 'pass' },
  },
};

export const R1_FIXTURE_PASSAGES: readonly ReadingPassage[] = [R1_FIXTURE_P1, R1_FIXTURE_P3];
