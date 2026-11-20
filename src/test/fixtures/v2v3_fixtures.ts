import type {
  CollocationItem,
  ParaphraseItem,
  Provenance,
  Topic,
  VocabItem,
} from '../../core/content/schemas';

export const V2V3_FIXTURE_PROVENANCE: Provenance = {
  createdBy: 'human',
  source: 'lexicon_v3_v2v3_fixtures',
  license: 'CC0-1.0',
  qa: {
    schema: 'pass',
    verifier: 'pass',
    blindSolve: 'pass',
  },
};

// ---------------------------------------------------------------------------
// V2 · Collocation Forge Fixtures (4 full forges: impact, issue, knowledge, policy)
// Each headword has >= 6 collocations and >= 2 l1Traps.
// ---------------------------------------------------------------------------

export const V2_FIXTURE_VOCAB: VocabItem[] = [
  {
    id: 'vocab:impact',
    headword: 'impact',
    pos: ['n', 'v'],
    ipa: { uk: '/ˈɪmpækt/', us: '/ˈɪmpækt/' },
    syllables: 'IM·pact',
    meaningVi: 'tác động, ảnh hưởng mạnh mẽ',
    definitionEn: 'a powerful effect that something, especially something new, has on a situation or person',
    examples: [
      {
        en: 'Urban sprawl can have a profound impact on local wildlife habitats and biodiversity.',
        vi: 'Sự bành trướng đô thị có thể có ảnh hưởng sâu sắc tới môi trường sống của động vật hoang dã.',
        ieltsContext: 'W2',
        clozeAccepted: ['impact', 'impacts'],
      },
      {
        en: 'Stringent environmental regulations helped mitigate the adverse impact of industrial emissions.',
        vi: 'Các quy định môi trường nghiêm ngặt đã giúp giảm nhẹ tác động bất lợi của khí thải công nghiệp.',
        ieltsContext: 'R',
        clozeAccepted: ['impact', 'impacts'],
      },
    ],
    family: [
      { form: 'impacts', pos: 'n' },
      { form: 'impacted', pos: 'v' },
      { form: 'impactful', pos: 'adj' },
    ],
    synonyms: [
      { word: 'influence', noteVi: 'Ảnh hưởng âm thầm, kéo dài lên hành vi hoặc suy nghĩ' },
      { word: 'repercussion', noteVi: 'Hệ lụy gián tiếp, thường mang sắc thái tiêu cực' },
    ],
    collocationIds: [
      'col:profound_impact_on',
      'col:detrimental_impact_on',
      'col:mitigate_the_impact',
      'col:far_reaching_impact',
      'col:assess_the_impact_of',
      'col:disproportionate_impact_on',
      'col:cushion_the_impact_of',
    ],
    register: 'formal',
    topics: ['environment', 'urban', 'economy'],
    lists: ['AWL2', 'ANKI'],
    freqZipf: 5.2,
    cefr: 'B2',
    vnTrap: 'Người Việt hay dịch "tạo ra ảnh hưởng lớn" thành "make a big impact"; trong Task 2 phải dùng "have/exert a profound impact on".',
    audio: { uk: 'audio/vocab/impact.uk.mp3' },
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:issue',
    headword: 'issue',
    pos: ['n', 'v'],
    ipa: { uk: '/ˈɪʃuː/', us: '/ˈɪʃuː/' },
    syllables: 'IS·sue',
    meaningVi: 'vấn đề đáng quan tâm, tranh luận',
    definitionEn: 'an important topic or problem for debate or discussion in society',
    examples: [
      {
        en: 'Affordable housing has become a pressing issue for young families in metropolitan areas.',
        vi: 'Nhà ở giá phải chăng đã trở thành một vấn đề cấp bách đối với các gia đình trẻ ở đô thị lớn.',
        ieltsContext: 'W2',
        clozeAccepted: ['issue', 'issues'],
      },
      {
        en: 'Policymakers often evade the underlying issue rather than enacting structural reforms.',
        vi: 'Các nhà hoạch định chính sách thường né tránh vấn đề cốt lõi thay vì ban hành cải cách cấu trúc.',
        ieltsContext: 'S',
        clozeAccepted: ['issue', 'issues'],
      },
    ],
    family: [
      { form: 'issues', pos: 'n' },
      { form: 'issued', pos: 'v' },
    ],
    synonyms: [
      { word: 'dilemma', noteVi: 'Tình thế tiến thoái lưỡng nan phải chọn giữa hai hướng khó' },
      { word: 'matter', noteVi: 'Vấn đề chung cần lưu tâm xử lý' },
    ],
    collocationIds: [
      'col:address_an_issue',
      'col:pressing_issue',
      'col:contentious_issue',
      'col:raise_an_issue',
      'col:cloud_the_issue',
      'col:evade_the_issue',
    ],
    register: 'formal',
    topics: ['government', 'urban', 'education'],
    lists: ['AWL1', 'ANKI'],
    freqZipf: 5.5,
    cefr: 'B2',
    vnTrap: 'Tránh dịch "vấn đề nóng bỏng" thành "hot issue" hay "làm vấn đề" thành "make an issue"; hãy dùng "pressing/contentious issue".',
    audio: { uk: 'audio/vocab/issue.uk.mp3' },
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:knowledge',
    headword: 'knowledge',
    pos: ['n'],
    ipa: { uk: '/ˈnɒlɪdʒ/', us: '/ˈnɑːlɪdʒ/' },
    syllables: 'KNOWL·edge',
    meaningVi: 'kiến thức, sự hiểu biết chuyên sâu',
    definitionEn: 'information, understanding, and skills gained through education or experience',
    examples: [
      {
        en: 'University courses enable undergraduates to acquire in-depth knowledge of their chosen discipline.',
        vi: 'Các khóa học đại học giúp sinh viên tiếp thu kiến thức chuyên sâu về ngành học đã chọn.',
        ieltsContext: 'W2',
        clozeAccepted: ['knowledge'],
      },
      {
        en: 'Public libraries play a vital role in disseminating scientific knowledge to ordinary citizens.',
        vi: 'Thư viện công cộng đóng vai trò thiết yếu trong việc phổ biến kiến thức khoa học tới người dân.',
        ieltsContext: 'R',
        clozeAccepted: ['knowledge'],
      },
    ],
    family: [
      { form: 'knowledgeable', pos: 'adj' },
      { form: 'acknowledge', pos: 'v' },
    ],
    synonyms: [
      { word: 'expertise', noteVi: 'Kiến thức và kỹ năng chuyên môn cao trong một lĩnh vực' },
      { word: 'erudition', noteVi: 'Sự uyên bác học thuật' },
    ],
    collocationIds: [
      'col:acquire_knowledge',
      'col:disseminate_knowledge',
      'col:in_depth_knowledge_of',
      'col:prior_knowledge_of',
      'col:broaden_ones_knowledge',
      'col:accumulate_knowledge',
    ],
    register: 'formal',
    topics: ['education', 'science', 'technology'],
    lists: ['NGSL', 'ANKI'],
    freqZipf: 5.4,
    cefr: 'B2',
    vnTrap: 'Lỗi kinh điển của người Việt là "learn knowledge" (học kiến thức) hoặc số nhiều "knowledges". Knowledge không đếm được và đi với "acquire/gain".',
    audio: { uk: 'audio/vocab/knowledge.uk.mp3' },
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:policy',
    headword: 'policy',
    pos: ['n'],
    ipa: { uk: '/ˈpɒləsi/', us: '/ˈpɑːləsi/' },
    syllables: 'POL·i·cy',
    meaningVi: 'chính sách, đường lối quản lý',
    definitionEn: 'a plan of action agreed or chosen by a government, political party, or business',
    examples: [
      {
        en: 'Central banks decided to implement a stringent policy to curb runaway inflation.',
        vi: 'Các ngân hàng trung ương đã quyết định thực thi một chính sách nghiêm ngặt để kiềm chế lạm phát phi mã.',
        ieltsContext: 'W2',
        clozeAccepted: ['policy', 'policies'],
      },
      {
        en: 'The administration pledged to formulate coherent policies on renewable energy transition.',
        vi: 'Chính quyền cam kết xây dựng các chính sách mạch lạc về chuyển dịch năng lượng tái tạo.',
        ieltsContext: 'R',
        clozeAccepted: ['policies', 'policy'],
      },
    ],
    family: [{ form: 'policies', pos: 'n' }],
    synonyms: [
      { word: 'regulation', noteVi: 'Quy định cụ thể có tính bắt buộc pháp lý' },
      { word: 'strategy', noteVi: 'Chiến lược dài hạn để đạt mục tiêu' },
    ],
    collocationIds: [
      'col:implement_a_policy',
      'col:formulate_a_policy',
      'col:stringent_policy',
      'col:short_sighted_policy',
      'col:reverse_a_policy',
      'col:adhere_to_a_policy',
    ],
    register: 'formal',
    topics: ['government', 'economy', 'environment'],
    lists: ['AWL1', 'ANKI'],
    freqZipf: 5.5,
    cefr: 'B2',
    vnTrap: 'Không dùng "do a policy" hay "open a policy"; hãy dùng "formulate / enact / implement a policy".',
    audio: { uk: 'audio/vocab/policy.uk.mp3' },
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
];

export const V2_FIXTURE_COLLOCATIONS: CollocationItem[] = [
  // --- Forge 1: vocab:impact (7 collocations) ---
  {
    id: 'col:profound_impact_on',
    headwordId: 'vocab:impact',
    pattern: 'V+N',
    phrase: 'have a profound impact on',
    gaps: [
      {
        display: '___ a profound impact on',
        answers: ['have', 'exert', 'exercise'],
        primary: 'have',
      },
      {
        display: 'have a ___ impact on',
        answers: ['profound', 'far-reaching', 'significant', 'substantial'],
        primary: 'profound',
      },
    ],
    meaningVi: 'có ảnh hưởng sâu sắc tới',
    example: 'Urban sprawl can have a profound impact on local wildlife habitats and water quality.',
    register: 'formal',
    bandTarget: 7,
    l1Traps: [
      {
        wrong: 'make a profound impact on',
        whyVi: 'Người Việt hay dịch "tạo ra ảnh hưởng" thành "make an impact", nhưng chuẩn học thuật đi với động từ "have" hoặc "exert".',
      },
      {
        wrong: 'give a big impact to',
        whyVi: 'Không dùng "give an impact to"; phải dùng "have/exert a profound impact on".',
      },
    ],
    topics: ['urban', 'environment'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:detrimental_impact_on',
    headwordId: 'vocab:impact',
    pattern: 'ADJ+N',
    phrase: 'a detrimental impact on',
    gaps: [
      {
        display: 'a ___ impact on',
        answers: ['detrimental', 'deleterious', 'devastating', 'harmful', 'adverse'],
        primary: 'detrimental',
      },
      {
        display: 'a detrimental impact ___',
        answers: ['on', 'upon'],
        primary: 'on',
      },
    ],
    meaningVi: 'tác động có hại lên',
    example: 'Excessive screen time during early childhood can exert a detrimental impact on cognitive development.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'a bad impact for',
        whyVi: '"Bad impact" quá khẩu ngữ và dùng sai giới từ "for"; trong Task 2 dùng "a detrimental impact on".',
      },
    ],
    topics: ['health', 'technology'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:mitigate_the_impact',
    headwordId: 'vocab:impact',
    pattern: 'V+N',
    phrase: 'mitigate the impact of',
    gaps: [
      {
        display: '___ the impact of',
        answers: ['mitigate', 'alleviate', 'minimise', 'minimize', 'lessen'],
        primary: 'mitigate',
      },
    ],
    meaningVi: 'giảm nhẹ tác động của',
    example: 'Coastal mangrove forests help mitigate the impact of severe tropical storms on fishing villages.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'down the impact of',
        whyVi: '"Down" không dùng như ngoại động từ với "impact"; phải dùng "mitigate / alleviate the impact of".',
      },
    ],
    topics: ['environment'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:far_reaching_impact',
    headwordId: 'vocab:impact',
    pattern: 'ADJ+N',
    phrase: 'a far-reaching impact on',
    gaps: [
      {
        display: 'a ___ impact on',
        answers: ['far-reaching', 'profound', 'lasting', 'long-term'],
        primary: 'far-reaching',
      },
    ],
    meaningVi: 'tác động sâu rộng, lan tỏa lâu dài lên',
    example: 'Artificial intelligence is projected to have a far-reaching impact on white-collar employment.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'a wide impact on',
        whyVi: 'Dịch từng chữ "ảnh hưởng rộng" thành "wide impact" không tự nhiên; tiếng Anh học thuật dùng "a far-reaching / widespread impact on".',
      },
    ],
    topics: ['technology', 'work'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:assess_the_impact_of',
    headwordId: 'vocab:impact',
    pattern: 'V+N',
    phrase: 'assess the impact of',
    gaps: [
      {
        display: '___ the impact of',
        answers: ['assess', 'evaluate', 'measure', 'gauge'],
        primary: 'assess',
      },
    ],
    meaningVi: 'đánh giá mức độ tác động của',
    example: 'Independent researchers were commissioned to assess the impact of congestion charges on air quality.',
    register: 'formal',
    bandTarget: 7,
    l1Traps: [
      {
        wrong: 'check the impact of',
        whyVi: '"Check" mang sắc thái kiểm tra lỗi vặt; để đánh giá quy mô tác động trong học thuật phải dùng "assess / evaluate the impact of".',
      },
    ],
    topics: ['transport', 'environment'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:disproportionate_impact_on',
    headwordId: 'vocab:impact',
    pattern: 'ADJ+N',
    phrase: 'a disproportionate impact on',
    gaps: [
      {
        display: 'a ___ impact on',
        answers: ['disproportionate', 'unequal', 'severe'],
        primary: 'disproportionate',
      },
    ],
    meaningVi: 'tác động nặng nề không tương xứng lên (nhóm yếu thế)',
    example: 'Consumption taxes often have a disproportionate impact on low-income households.',
    register: 'formal',
    bandTarget: 9,
    l1Traps: [
      {
        wrong: 'an unfair-sized impact on',
        whyVi: 'Để diễn tả tác động giáng nặng hơn lên một nhóm yếu thế, thuật ngữ chuẩn Band 8–9 là "a disproportionate impact on".',
      },
    ],
    topics: ['economy', 'government'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:cushion_the_impact_of',
    headwordId: 'vocab:impact',
    pattern: 'V+N',
    phrase: 'cushion the impact of',
    gaps: [
      {
        display: '___ the impact of',
        answers: ['cushion', 'soften', 'buffer', 'mitigate'],
        primary: 'cushion',
      },
    ],
    meaningVi: 'đỡ đòn, làm giảm nhẹ cú sốc tác động của',
    example: 'Targeted unemployment benefits can cushion the impact of sudden economic recessions on vulnerable workers.',
    register: 'formal',
    bandTarget: 9,
    l1Traps: [
      {
        wrong: 'hold back the impact of',
        whyVi: 'Không dùng "hold back the impact"; ẩn dụ chuẩn Band 9 cho chính sách an sinh giảm sốc là "cushion / buffer the impact of".',
      },
    ],
    topics: ['economy', 'work'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },

  // --- Forge 2: vocab:issue (6 collocations) ---
  {
    id: 'col:address_an_issue',
    headwordId: 'vocab:issue',
    pattern: 'V+N',
    phrase: 'address the issue of',
    gaps: [
      {
        display: '___ the issue of',
        answers: ['address', 'tackle', 'confront', 'resolve'],
        primary: 'address',
      },
    ],
    meaningVi: 'giải quyết, xử lý vấn đề về',
    example: 'Municipal authorities must urgently address the issue of affordable housing in city centres.',
    register: 'formal',
    bandTarget: 7,
    l1Traps: [
      {
        wrong: 'fix the issue of',
        whyVi: '"Fix" phù hợp cho sửa máy móc; với vấn đề xã hội trong IELTS Writing cần dùng "address / tackle / resolve the issue of".',
      },
    ],
    topics: ['urban', 'government'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:pressing_issue',
    headwordId: 'vocab:issue',
    pattern: 'ADJ+N',
    phrase: 'a pressing issue',
    gaps: [
      {
        display: 'a ___ issue',
        answers: ['pressing', 'urgent', 'critical', 'burning'],
        primary: 'pressing',
      },
    ],
    meaningVi: 'vấn đề cấp bách',
    example: 'Youth unemployment remains a pressing issue across many developing economies today.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'a hot issue',
        whyVi: 'Dịch "vấn đề nóng" thành "hot issue" là văn phong báo chí thông tục; trong bài luận học thuật dùng "a pressing / burning issue".',
      },
    ],
    topics: ['economy', 'work'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:contentious_issue',
    headwordId: 'vocab:issue',
    pattern: 'ADJ+N',
    phrase: 'a contentious issue',
    gaps: [
      {
        display: 'a ___ issue',
        answers: ['contentious', 'controversial', 'thorny', 'divisive'],
        primary: 'contentious',
      },
    ],
    meaningVi: 'vấn đề gây nhiều tranh cãi',
    example: 'Whether governments should subsidise private tuition has long been a contentious issue.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'an arguing issue',
        whyVi: 'Không dùng "arguing issue" để dịch "vấn đề tranh cãi"; phải dùng tính từ "contentious" hoặc "controversial".',
      },
    ],
    topics: ['education', 'government'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:raise_an_issue',
    headwordId: 'vocab:issue',
    pattern: 'V+N',
    phrase: 'raise the issue of',
    gaps: [
      {
        display: '___ the issue of',
        answers: ['raise', 'highlight', 'broach'],
        primary: 'raise',
      },
    ],
    meaningVi: 'nêu lên vấn đề về',
    example: 'Environmental campaigners continue to raise the issue of plastic waste in marine ecosystems.',
    register: 'formal',
    bandTarget: 7,
    l1Traps: [
      {
        wrong: 'bring up high the issue of',
        whyVi: 'Để nói "nêu lên vấn đề", tiếng Anh chuẩn dùng "raise the issue of", không ghép "bring up high".',
      },
    ],
    topics: ['environment'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:cloud_the_issue',
    headwordId: 'vocab:issue',
    pattern: 'V+N',
    phrase: 'cloud the issue',
    gaps: [
      {
        display: '___ the issue',
        answers: ['cloud', 'confuse', 'obscure', 'complicate'],
        primary: 'cloud',
      },
    ],
    meaningVi: 'làm lu mờ, gây nhiễu loạn bản chất vấn đề',
    example: 'Sensationalist media coverage tends to cloud the issue rather than inform the public.',
    register: 'formal',
    bandTarget: 9,
    l1Traps: [
      {
        wrong: 'make dark the issue',
        whyVi: 'Dịch "làm mờ vấn đề" thành "make dark the issue" sai ngữ pháp và collocation; cụm chuẩn Band 9 là "cloud / obscure the issue".',
      },
    ],
    topics: ['media'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:evade_the_issue',
    headwordId: 'vocab:issue',
    pattern: 'V+N',
    phrase: 'evade the issue',
    gaps: [
      {
        display: '___ the issue',
        answers: ['evade', 'sidestep', 'dodge', 'avoid'],
        primary: 'evade',
      },
    ],
    meaningVi: 'né tránh, lảng tránh vấn đề',
    example: 'Corporate spokespersons often evade the issue when questioned about supply chain emissions.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'run away the issue',
        whyVi: '"Run away" không đi trực tiếp với tân ngữ và quá khẩu ngữ; hãy dùng "evade / sidestep the issue".',
      },
    ],
    topics: ['environment', 'work'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },

  // --- Forge 3: vocab:knowledge (6 collocations) ---
  {
    id: 'col:acquire_knowledge',
    headwordId: 'vocab:knowledge',
    pattern: 'V+N',
    phrase: 'acquire knowledge',
    gaps: [
      {
        display: '___ knowledge',
        answers: ['acquire', 'gain', 'obtain', 'absorb'],
        primary: 'acquire',
      },
    ],
    meaningVi: 'tiếp thu, lĩnh hội kiến thức',
    example: 'Interactive laboratories allow students to acquire knowledge through hands-on experimentation.',
    register: 'formal',
    bandTarget: 7,
    l1Traps: [
      {
        wrong: 'learn knowledge',
        whyVi: 'Lỗi L1 kinh điển của người Việt: dịch "học kiến thức" thành "learn knowledge". Trong tiếng Anh, ta "learn a skill/subject" nhưng phải "acquire / gain knowledge".',
      },
      {
        wrong: 'study knowledge',
        whyVi: 'Không nói "study knowledge"; phải dùng "acquire / gain knowledge".',
      },
    ],
    topics: ['education'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:disseminate_knowledge',
    headwordId: 'vocab:knowledge',
    pattern: 'V+N',
    phrase: 'disseminate knowledge',
    gaps: [
      {
        display: '___ knowledge',
        answers: ['disseminate', 'spread', 'share', 'transmit'],
        primary: 'disseminate',
      },
    ],
    meaningVi: 'phổ biến, truyền bá tri thức',
    example: 'Open-access academic journals help disseminate knowledge to researchers in developing nations.',
    register: 'formal',
    bandTarget: 9,
    l1Traps: [
      {
        wrong: 'give out knowledge',
        whyVi: '"Give out" dùng cho phát tờ rơi/vật phẩm; để nói phổ biến tri thức học thuật cần dùng "disseminate / transmit knowledge".',
      },
    ],
    topics: ['education', 'science'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:in_depth_knowledge_of',
    headwordId: 'vocab:knowledge',
    pattern: 'ADJ+N',
    phrase: 'in-depth knowledge of',
    gaps: [
      {
        display: '___ knowledge of',
        answers: ['in-depth', 'profound', 'comprehensive', 'thorough', 'detailed'],
        primary: 'in-depth',
      },
      {
        display: 'in-depth knowledge ___',
        answers: ['of', 'about'],
        primary: 'of',
      },
    ],
    meaningVi: 'kiến thức chuyên sâu về',
    example: 'Medical specialists require in-depth knowledge of genetics to design personalised treatments.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'deep knowledge for',
        whyVi: 'Người Việt hay dịch "kiến thức sâu cho..." thành "deep knowledge for"; cụm chuẩn là "in-depth / profound knowledge of".',
      },
    ],
    topics: ['health', 'science'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:prior_knowledge_of',
    headwordId: 'vocab:knowledge',
    pattern: 'ADJ+N',
    phrase: 'prior knowledge of',
    gaps: [
      {
        display: '___ knowledge of',
        answers: ['prior', 'previous', 'background', 'first-hand'],
        primary: 'prior',
      },
    ],
    meaningVi: 'kiến thức nền tảng có trước về',
    example: 'The introductory coding workshop assumes no prior knowledge of computer science.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'before knowledge of',
        whyVi: '"Before" là giới từ/liên từ, không đứng trước danh từ làm tính từ; phải dùng "prior knowledge of".',
      },
    ],
    topics: ['education', 'technology'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:broaden_ones_knowledge',
    headwordId: 'vocab:knowledge',
    pattern: 'V+N',
    phrase: 'broaden their knowledge of',
    gaps: [
      {
        display: '___ their knowledge of',
        answers: ['broaden', 'expand', 'enrich', 'deepen', 'widen'],
        primary: 'broaden',
      },
    ],
    meaningVi: 'mở rộng vốn hiểu biết về',
    example: 'Studying abroad encourages young adults to broaden their knowledge of diverse cultures.',
    register: 'formal',
    bandTarget: 7,
    l1Traps: [
      {
        wrong: 'open their knowledge of',
        whyVi: 'Dịch "mở mang kiến thức" thành "open knowledge" là lỗi dịch từng chữ từ tiếng Việt; phải dùng "broaden / expand their knowledge".',
      },
    ],
    topics: ['education', 'culture'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:accumulate_knowledge',
    headwordId: 'vocab:knowledge',
    pattern: 'V+N',
    phrase: 'accumulate knowledge',
    gaps: [
      {
        display: '___ knowledge',
        answers: ['accumulate', 'amass', 'build up'],
        primary: 'accumulate',
      },
    ],
    meaningVi: 'tích lũy kiến thức qua thời gian',
    example: 'Indigenous communities accumulate knowledge about local biodiversity over countless generations.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'save up knowledge',
        whyVi: '"Save up" chỉ dùng cho tiết kiệm tiền bạc; để nói tích lũy tri thức theo thời gian, dùng "accumulate knowledge".',
      },
    ],
    topics: ['culture', 'environment'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },

  // --- Forge 4: vocab:policy (6 collocations) ---
  {
    id: 'col:implement_a_policy',
    headwordId: 'vocab:policy',
    pattern: 'V+N',
    phrase: 'implement a policy',
    gaps: [
      {
        display: '___ a policy',
        answers: ['implement', 'enact', 'enforce', 'introduce', 'adopt'],
        primary: 'implement',
      },
    ],
    meaningVi: 'thực thi một chính sách',
    example: 'Several European capitals have decided to implement a policy restricting diesel vehicles.',
    register: 'formal',
    bandTarget: 7,
    l1Traps: [
      {
        wrong: 'do a policy',
        whyVi: 'Không dùng "do a policy"; để nói thực hiện chính sách, dùng "implement / enact / enforce a policy".',
      },
    ],
    topics: ['government', 'transport'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:formulate_a_policy',
    headwordId: 'vocab:policy',
    pattern: 'V+N',
    phrase: 'formulate a policy',
    gaps: [
      {
        display: '___ a policy',
        answers: ['formulate', 'devise', 'shape', 'draft'],
        primary: 'formulate',
      },
    ],
    meaningVi: 'hoạch định, xây dựng chính sách',
    example: 'Health ministries must formulate a policy that balances preventive care with hospital funding.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'build up a policy',
        whyVi: 'Dịch "xây dựng chính sách" thành "build up a policy" không tự nhiên; từ chuẩn Band 8 là "formulate / devise a policy".',
      },
    ],
    topics: ['government', 'health'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:stringent_policy',
    headwordId: 'vocab:policy',
    pattern: 'ADJ+N',
    phrase: 'a stringent policy on',
    gaps: [
      {
        display: 'a ___ policy on',
        answers: ['stringent', 'strict', 'rigorous', 'tough'],
        primary: 'stringent',
      },
    ],
    meaningVi: 'chính sách nghiêm ngặt về',
    example: 'The government enforced a stringent policy on industrial waste disposal near rivers.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'a hard policy on',
        whyVi: '"Hard policy" không tự nhiên khi nói về quy định khắt khe; hãy dùng "a stringent / strict / rigorous policy on".',
      },
    ],
    topics: ['environment', 'government'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:short_sighted_policy',
    headwordId: 'vocab:policy',
    pattern: 'ADJ+N',
    phrase: 'a short-sighted policy',
    gaps: [
      {
        display: 'a ___ policy',
        answers: ['short-sighted', 'myopic', 'counterproductive', 'misguided'],
        primary: 'short-sighted',
      },
    ],
    meaningVi: 'chính sách thiển cận, thiếu tầm nhìn dài hạn',
    example: 'Cutting funding for basic scientific research is widely criticised as a short-sighted policy.',
    register: 'formal',
    bandTarget: 9,
    l1Traps: [
      {
        wrong: 'a near-look policy',
        whyVi: 'Để dịch "chính sách thiển cận/ngắn hạn", tiếng Anh dùng tính từ ghép "a short-sighted / myopic policy".',
      },
    ],
    topics: ['science', 'government'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:reverse_a_policy',
    headwordId: 'vocab:policy',
    pattern: 'V+N',
    phrase: 'reverse a policy',
    gaps: [
      {
        display: '___ a policy',
        answers: ['reverse', 'overturn', 'abandon', 'repeal'],
        primary: 'reverse',
      },
    ],
    meaningVi: 'đảo ngược, bãi bỏ một chính sách cũ',
    example: 'Public pressure eventually forced the council to reverse a policy that reduced bus routes.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'turn back a policy',
        whyVi: 'Không dùng "turn back a policy"; phải dùng "reverse / overturn / abandon a policy".',
      },
    ],
    topics: ['government', 'transport'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
  {
    id: 'col:adhere_to_a_policy',
    headwordId: 'vocab:policy',
    pattern: 'V+PREP',
    phrase: 'adhere to a policy',
    gaps: [
      {
        display: '___ to a policy',
        answers: ['adhere', 'conform', 'stick'],
        primary: 'adhere',
      },
      {
        display: 'adhere ___ a policy',
        answers: ['to'],
        primary: 'to',
      },
    ],
    meaningVi: 'tuân thủ chặt chẽ một chính sách',
    example: 'All multinational contractors must adhere to a policy of zero tolerance towards child labour.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'follow with a policy',
        whyVi: '"Follow" không đi với "with", còn trong văn phong trang trọng nên dùng "adhere to / comply with a policy".',
      },
    ],
    topics: ['work', 'government'],
    provenance: V2V3_FIXTURE_PROVENANCE,
  },
];

// ---------------------------------------------------------------------------
// V3 · Paraphrase Radar Fixtures (18 items across L1..L4 with exact spans)
// [INV-P1] context.slice(start, end) === text for target and every decoy.
// [INV-P2] Spans do not overlap.
// [INV-P3] For not_equivalent (L4), target is the closest-looking trap phrase.
// ---------------------------------------------------------------------------

interface RawParaphraseSeed {
  id: `para:${string}`;
  level: 1 | 2 | 3 | 4;
  questionPhrase: string;
  relation: 'equivalent' | 'not_equivalent';
  context: string;
  targetText: string;
  decoys: Array<{ text: string; whyVi: string }>;
  explanationVi: string;
  topics: Topic[];
}

function buildVerifiedParaphraseItem(seed: RawParaphraseSeed): ParaphraseItem {
  const findSpan = (sub: string) => {
    const start = seed.context.indexOf(sub);
    if (start === -1) {
      throw new Error(`[v2v3_fixtures] Substring "${sub}" not found in context of ${seed.id}`);
    }
    return { text: sub, start, end: start + sub.length };
  };

  const target = findSpan(seed.targetText);
  const decoys = seed.decoys.map((d) => ({
    ...findSpan(d.text),
    whyVi: d.whyVi,
  }));

  // Verify [INV-P2] non-overlapping spans
  const allSpans = [target, ...decoys].sort((a, b) => a.start - b.start);
  for (let i = 1; i < allSpans.length; i++) {
    if (allSpans[i].start < allSpans[i - 1].end) {
      throw new Error(
        `[v2v3_fixtures] Overlapping spans in ${seed.id}: "${allSpans[i - 1].text}" and "${allSpans[i].text}"`,
      );
    }
  }

  return {
    id: seed.id,
    level: seed.level,
    questionPhrase: seed.questionPhrase,
    relation: seed.relation,
    context: seed.context,
    target,
    decoys,
    explanationVi: seed.explanationVi,
    topics: seed.topics,
    provenance: V2V3_FIXTURE_PROVENANCE,
  };
}

const RAW_V3_SEEDS: RawParaphraseSeed[] = [
  // --- LEVEL 1: Direct lexical synonyms (5 items) ---
  {
    id: 'para:v3_001',
    level: 1,
    questionPhrase: 'a significant drop in birth rates',
    relation: 'equivalent',
    context:
      'Across much of Europe, fertility has declined markedly since the late 1970s. Although average birth weights in maternity wards remain fairly stable, the number of children born per woman now sits well below the replacement threshold required to sustain the workforce.',
    targetText: 'fertility has declined markedly',
    decoys: [
      {
        text: 'birth weights in maternity wards',
        whyVi: 'Bẫy keyword_echo: lặp từ "birth" nhưng nói về cân nặng trẻ sơ sinh (birth weights), không phải tỷ lệ sinh.',
      },
      {
        text: 'remain fairly stable',
        whyVi: 'Ngược nghĩa: "remain fairly stable" (khá ổn định) trái với "a significant drop" (giảm mạnh).',
      },
    ],
    explanationVi: 'L1 (Synonym): "fertility" = "birth rates", "declined markedly" = "a significant drop".',
    topics: ['family', 'society' as Topic].filter((t): t is Topic => t === 'family'),
  },
  {
    id: 'para:v3_002',
    level: 1,
    questionPhrase: 'mandatory recycling rules for households',
    relation: 'equivalent',
    context:
      'To curb landfill overflow, municipal councils have introduced compulsory waste-sorting regulations for domestic residents. While voluntary recycling initiatives in local schools received praise, officials concluded that legal obligations were essential to transform everyday habits.',
    targetText: 'compulsory waste-sorting regulations for domestic residents',
    decoys: [
      {
        text: 'voluntary recycling initiatives in local schools',
        whyVi: 'Bẫy keyword_echo: lặp từ "recycling" nhưng là "voluntary" (tự nguyện) ở trường học, không phải "mandatory" (bắt buộc) cho hộ gia đình.',
      },
      {
        text: 'curb landfill overflow',
        whyVi: 'Đây là mục đích (giảm quá tải bãi rác), không phải quy định tái chế bắt buộc.',
      },
    ],
    explanationVi: 'L1 (Synonym): "compulsory" = "mandatory", "waste-sorting regulations" = "recycling rules", "domestic residents" = "households".',
    topics: ['environment', 'government'],
  },
  {
    id: 'para:v3_003',
    level: 1,
    questionPhrase: 'unaffordable prices of urban housing',
    relation: 'equivalent',
    context:
      'Young professionals are increasingly migrating to satellite towns because prohibitive property costs in metropolitan centres prevent them from buying a home. Even though construction prices for suburban roads have fallen, city apartments remain out of reach.',
    targetText: 'prohibitive property costs in metropolitan centres',
    decoys: [
      {
        text: 'construction prices for suburban roads',
        whyVi: 'Bẫy keyword_echo: lặp từ "prices" nhưng nói về chi phí làm đường ngoại ô, không phải giá nhà ở đô thị.',
      },
      {
        text: 'migrating to satellite towns',
        whyVi: 'Đây là hệ quả (di cư ra đô thị vệ tinh), không phải giá nhà đắt đỏ.',
      },
    ],
    explanationVi: 'L1 (Synonym): "prohibitive" = "unaffordable" (đắt đỏ tới mức không mua nổi), "property costs" = "prices of housing", "metropolitan centres" = "urban".',
    topics: ['urban', 'economy'],
  },
  {
    id: 'para:v3_004',
    level: 1,
    questionPhrase: 'protecting endangered species from extinction',
    relation: 'equivalent',
    context:
      'International treaties play a decisive role in safeguarding vulnerable wildlife against total disappearance. While commercial breeding of common species generates tourism revenue, conservationists warn that habitat destruction still threatens fragile ecosystems.',
    targetText: 'safeguarding vulnerable wildlife against total disappearance',
    decoys: [
      {
        text: 'commercial breeding of common species',
        whyVi: 'Bẫy keyword_echo: lặp từ "species" nhưng nói về nhân giống thương mại các loài phổ biến (common species), không phải loài nguy cấp.',
      },
      {
        text: 'generates tourism revenue',
        whyVi: 'Nói về doanh thu du lịch, không liên quan tới việc bảo vệ loài khỏi tuyệt chủng.',
      },
    ],
    explanationVi: 'L1 (Synonym): "safeguarding" = "protecting", "vulnerable wildlife" = "endangered species", "total disappearance" = "extinction".',
    topics: ['animals', 'environment'],
  },
  {
    id: 'para:v3_005',
    level: 1,
    questionPhrase: 'a shortage of skilled workers',
    relation: 'equivalent',
    context:
      'High-tech manufacturing firms frequently report a scarcity of qualified personnel capable of operating automated assembly lines. Although unskilled seasonal workers are abundant in agricultural provinces, engineering roles remain vacant for months.',
    targetText: 'a scarcity of qualified personnel',
    decoys: [
      {
        text: 'unskilled seasonal workers are abundant',
        whyVi: 'Bẫy keyword_echo: lặp từ "workers" nhưng là lao động thời vụ không có tay nghề (unskilled) và dồi dào (abundant), ngược hẳn câu hỏi.',
      },
      {
        text: 'operating automated assembly lines',
        whyVi: 'Mô tả công việc vận hành dây chuyền tự động, không phải sự thiếu hụt nhân sự.',
      },
    ],
    explanationVi: 'L1 (Synonym): "scarcity" = "shortage", "qualified personnel" = "skilled workers".',
    topics: ['work', 'economy'],
  },

  // --- LEVEL 2: Word-form shifts (5 items) ---
  {
    id: 'para:v3_006',
    level: 2,
    questionPhrase: 'rapid expansion of cities',
    relation: 'equivalent',
    context:
      'As metropolitan areas expand rapidly into surrounding farmland, local ecosystems face unprecedented fragmentation. City planners who once celebrated tall expansion bridges now acknowledge that uncontrolled outward growth erodes agricultural self-sufficiency.',
    targetText: 'metropolitan areas expand rapidly',
    decoys: [
      {
        text: 'celebrated tall expansion bridges',
        whyVi: 'Bẫy keyword_echo: lặp nguyên từ "expansion" và "City" gần đó nhưng nói về cầu mở rộng (expansion bridges), không phải sự mở rộng của các thành phố.',
      },
      {
        text: 'erodes agricultural self-sufficiency',
        whyVi: 'Đây là hậu quả đối với nông nghiệp, không phải bản thân sự mở rộng đô thị.',
      },
    ],
    explanationVi: 'L2 (Đổi dạng từ): danh từ "rapid expansion of cities" chuyển thành mệnh đề động từ + trạng từ "metropolitan areas expand rapidly".',
    topics: ['urban', 'environment'],
  },
  {
    id: 'para:v3_007',
    level: 2,
    questionPhrase: 'accurate prediction of earthquakes',
    relation: 'equivalent',
    context:
      'Despite decades of geological monitoring, seismologists still cannot predict seismic events accurately before tremors strike. Early earthquake drills in coastal schools save lives, yet forecasting the exact moment of rupture remains scientifically elusive.',
    targetText: 'predict seismic events accurately',
    decoys: [
      {
        text: 'earthquake drills in coastal schools',
        whyVi: 'Bẫy keyword_echo: lặp từ "earthquake" nhưng nói về diễn tập phòng chống động đất ở trường học, không phải dự báo động đất.',
      },
      {
        text: 'decades of geological monitoring',
        whyVi: 'Nói về quá trình quan trắc địa chất, không phải việc dự đoán chính xác động đất.',
      },
    ],
    explanationVi: 'L2 (Đổi dạng từ): "accurate prediction" (adj + n) → "predict ... accurately" (v + adv); "earthquakes" → "seismic events".',
    topics: ['science'],
  },
  {
    id: 'para:v3_008',
    level: 2,
    questionPhrase: 'excessive reliance on fossil fuels',
    relation: 'equivalent',
    context:
      'Industrialised nations that rely excessively on coal and petroleum expose their economies to volatile global energy markets. While fossilised plant specimens in museum collections attract geologists, burning carbon-heavy reserves accelerates climate instability.',
    targetText: 'rely excessively on coal and petroleum',
    decoys: [
      {
        text: 'fossilised plant specimens in museum collections',
        whyVi: 'Bẫy keyword_echo: lặp gốc từ "fossil" nhưng nói về mẫu thực vật hóa thạch trong bảo tàng, hoàn toàn không phải nhiên liệu hóa thạch.',
      },
      {
        text: 'volatile global energy markets',
        whyVi: 'Đây là thị trường năng lượng biến động, không phải sự phụ thuộc quá mức vào nhiên liệu hóa thạch.',
      },
    ],
    explanationVi: 'L2 (Đổi dạng từ): "excessive reliance on" (adj + n) → "rely excessively on" (v + adv); "fossil fuels" → "coal and petroleum".',
    topics: ['energy', 'environment'],
  },
  {
    id: 'para:v3_009',
    level: 2,
    questionPhrase: 'significant improvement in academic performance',
    relation: 'equivalent',
    context:
      'When secondary schools banned smartphones during lessons, students improved their scholastic outcomes significantly within two semesters. By contrast, expensive performance stages built for school theatres had no measurable effect on literacy scores.',
    targetText: 'improved their scholastic outcomes significantly',
    decoys: [
      {
        text: 'performance stages built for school theatres',
        whyVi: 'Bẫy keyword_echo: lặp từ "performance" và "school" nhưng mang nghĩa sân khấu biểu diễn (performance stages), không phải kết quả học tập.',
      },
      {
        text: 'banned smartphones during lessons',
        whyVi: 'Đây là biện pháp (cấm điện thoại), không phải sự cải thiện kết quả học tập.',
      },
    ],
    explanationVi: 'L2 (Đổi dạng từ): "significant improvement" (adj + n) → "improved ... significantly" (v + adv); "academic performance" → "scholastic outcomes".',
    topics: ['education'],
  },
  {
    id: 'para:v3_010',
    level: 2,
    questionPhrase: 'regular consumption of processed food',
    relation: 'equivalent',
    context:
      'Epidemiological surveys confirm that individuals who consume ultra-processed meals regularly face a heightened risk of metabolic disorders. Even when food processing factories adopt cleaner packaging, high sodium and refined sugar levels remain hazardous.',
    targetText: 'consume ultra-processed meals regularly',
    decoys: [
      {
        text: 'food processing factories adopt cleaner packaging',
        whyVi: 'Bẫy keyword_echo: lặp cả "food" và "processing" nhưng nói về nhà máy chế biến thực phẩm đổi bao bì, không phải việc ăn đồ chế biến sẵn thường xuyên.',
      },
      {
        text: 'heightened risk of metabolic disorders',
        whyVi: 'Đây là hậu quả sức khỏe (rối loạn chuyển hóa), không phải hành vi tiêu thụ thực phẩm chế biến sẵn.',
      },
    ],
    explanationVi: 'L2 (Đổi dạng từ): "regular consumption" (adj + n) → "consume ... regularly" (v + adv); "processed food" → "ultra-processed meals".',
    topics: ['food', 'health'],
  },

  // --- LEVEL 3: Structural transformations (passive, nominalisation, clause shifts) (5 items) ---
  {
    id: 'para:v3_011',
    level: 3,
    questionPhrase: 'advertising persuades people to buy unnecessary things',
    relation: 'equivalent',
    context:
      'Modern digital marketing employs psychological triggers whereby consumers are induced by commercial campaigns to purchase non-essential goods. Although people often claim that product labels simply buy them time at supermarkets, impulse spending continues to rise.',
    targetText: 'consumers are induced by commercial campaigns to purchase non-essential goods',
    decoys: [
      {
        text: 'product labels simply buy them time',
        whyVi: 'Bẫy keyword_echo: lặp từ "people" và "buy" nhưng trong thành ngữ "buy them time" (tiết kiệm thời gian), không phải mua hàng hóa không cần thiết.',
      },
      {
        text: 'employs psychological triggers',
        whyVi: 'Chỉ mới nêu thủ thuật tâm lý nói chung, chưa diễn đạt đủ ý thuyết phục người tiêu dùng mua đồ không cần thiết.',
      },
      {
        text: 'impulse spending continues to rise',
        whyVi: 'Nêu xu hướng chi tiêu bốc đồng tăng lên, thiếu tác nhân quảng cáo thuyết phục.',
      },
    ],
    explanationVi: 'L3 (Đổi cấu trúc chủ động → bị động): "advertising persuades people to buy..." → "consumers are induced by commercial campaigns to purchase non-essential goods".',
    topics: ['media', 'economy'],
  },
  {
    id: 'para:v3_012',
    level: 3,
    questionPhrase: 'trees are cut down to create space for cattle',
    relation: 'equivalent',
    context:
      'In tropical river basins, the clearance of forest cover to make way for livestock grazing accounts for over seventy percent of habitat loss. While fallen trees near cattle fences are occasionally harvested for firewood, industrial ranching remains the primary driver.',
    targetText: 'the clearance of forest cover to make way for livestock grazing',
    decoys: [
      {
        text: 'fallen trees near cattle fences',
        whyVi: 'Bẫy keyword_echo: lặp nguyên từ "trees" và "cattle" nhưng chỉ nói về cây đổ sẵn gần hàng rào gia súc, không phải chặt phá rừng để lấy đất chăn nuôi.',
      },
      {
        text: 'occasionally harvested for firewood',
        whyVi: 'Nói về việc thu gom củi đun, không phải phá rừng làm đồng cỏ chăn nuôi.',
      },
      {
        text: 'seventy percent of habitat loss',
        whyVi: 'Đây là con số thống kê hậu quả mất môi trường sống.',
      },
    ],
    explanationVi: 'L3 (Danh từ hoá / Nominalisation): mệnh đề bị động "trees are cut down to create space for cattle" → cụm danh từ "the clearance of forest cover to make way for livestock grazing".',
    topics: ['environment', 'animals'],
  },
  {
    id: 'para:v3_013',
    level: 3,
    questionPhrase: 'children who grow up in bilingual families',
    relation: 'equivalent',
    context:
      'Neuroimaging studies indicate that being raised in a household where two languages are spoken enhances executive control in early adolescence. Conversely, children who attend family summer camps abroad for two weeks show no lasting neurological changes.',
    targetText: 'being raised in a household where two languages are spoken',
    decoys: [
      {
        text: 'children who attend family summer camps',
        whyVi: 'Bẫy keyword_echo: lặp từ "children" và "family" nhưng nói về trại hè gia đình ngắn hạn, không phải lớn lên trong gia đình song ngữ.',
      },
      {
        text: 'enhances executive control in early adolescence',
        whyVi: 'Đây là tác động lên não bộ (tăng khả năng điều hành), không phải đối tượng trẻ lớn lên trong gia đình song ngữ.',
      },
    ],
    explanationVi: 'L3 (Đổi cấu trúc mệnh đề quan hệ → danh động từ bị động + mệnh đề): "children who grow up in bilingual families" → "being raised in a household where two languages are spoken".',
    topics: ['language', 'family', 'psychology'],
  },
  {
    id: 'para:v3_014',
    level: 3,
    questionPhrase: 'governments should fund public transport instead of building more roads',
    relation: 'equivalent',
    context:
      'Urban economists argue that state investment ought to be redirected from highway expansion towards mass transit networks. Although road building crews frequently use public buses to reach construction sites, adding extra lanes merely induces further traffic congestion.',
    targetText: 'state investment ought to be redirected from highway expansion towards mass transit networks',
    decoys: [
      {
        text: 'road building crews frequently use public buses',
        whyVi: 'Bẫy keyword_echo: lặp từ "road building" và "public" nhưng nói về công nhân làm đường đi xe buýt, hoàn toàn sai ý chính sách đầu tư.',
      },
      {
        text: 'adding extra lanes merely induces further traffic congestion',
        whyVi: 'Đây là lý giải vì sao mở thêm làn đường gây tắc nghẽn, không phải mệnh đề kiến nghị chuyển vốn đầu tư.',
      },
    ],
    explanationVi: 'L3 (Đổi cấu trúc chủ động "A should fund B instead of C" → bị động "state investment ought to be redirected from C towards B").',
    topics: ['transport', 'government'],
  },
  {
    id: 'para:v3_015',
    level: 3,
    questionPhrase: 'employees work less efficiently when they lack sleep',
    relation: 'equivalent',
    context:
      'Occupational health research demonstrates that sleep deprivation results in a marked decline in workplace productivity. Even when tired employees sleep on commuter trains after work, cognitive fatigue during office hours leads to costly operational errors.',
    targetText: 'sleep deprivation results in a marked decline in workplace productivity',
    decoys: [
      {
        text: 'tired employees sleep on commuter trains after work',
        whyVi: 'Bẫy keyword_echo: lặp từ "employees", "sleep", "work" nhưng nói về việc ngủ trên tàu sau giờ làm, không phải thiếu ngủ làm giảm hiệu suất.',
      },
      {
        text: 'costly operational errors',
        whyVi: 'Chỉ là một ví dụ hậu quả cụ thể, không bao quát cả mối quan hệ nhân quả giữa thiếu ngủ và giảm năng suất.',
      },
    ],
    explanationVi: 'L3 (Nominalisation + đảo mệnh đề điều kiện thành nhân quả): "when they lack sleep" → "sleep deprivation"; "employees work less efficiently" → "a marked decline in workplace productivity".',
    topics: ['work', 'health'],
  },

  // --- LEVEL 4: not_equivalent traps (Learner must press "KHÔNG CÓ TRONG ĐOẠN (N)") (3 items) ---
  {
    id: 'para:v3_016',
    level: 4,
    questionPhrase: 'eliminating tuition fees for all university students',
    relation: 'not_equivalent',
    context:
      'To widen access to higher education, the ministry proposed deferring tuition fee repayments for low-income university students until their post-graduation salary exceeds a living threshold. Meanwhile, administrative registration charges for campus libraries were abolished last autumn.',
    targetText: 'deferring tuition fee repayments for low-income university students',
    decoys: [
      {
        text: 'administrative registration charges for campus libraries were abolished',
        whyVi: 'Bẫy keyword_echo + đánh tráo đối tượng: có từ "abolished" (= eliminating) nhưng là bỏ phí đăng ký thư viện, KHÔNG phải bỏ học phí đại học.',
      },
      {
        text: 'widen access to higher education',
        whyVi: 'Đây là mục tiêu mở rộng tiếp cận giáo dục đại học, không nói về việc xóa bỏ hoàn toàn học phí.',
      },
    ],
    explanationVi: 'L4 (KHÔNG CÓ TRONG ĐOẠN): Bài chỉ nói "deferring tuition fee repayments for low-income university students" (hoãn trả học phí cho sinh viên thu nhập thấp), hoàn toàn KHÔNG phải xóa bỏ học phí cho mọi sinh viên ("eliminating ... for all").',
    topics: ['education', 'government'],
  },
  {
    id: 'para:v3_017',
    level: 4,
    questionPhrase: 'a complete ban on private cars in the city centre',
    relation: 'not_equivalent',
    context:
      'Under the revised metropolitan transport charter, private vehicles entering the historic city centre during peak weekday mornings are subject to a congestion levy. Only unlicensed street vendors were subject to a complete ban around central plazas.',
    targetText: 'private vehicles entering the historic city centre during peak weekday mornings are subject to a congestion levy',
    decoys: [
      {
        text: 'unlicensed street vendors were subject to a complete ban',
        whyVi: 'Bẫy keyword_echo: lặp nguyên cụm "a complete ban" nhưng áp dụng cho người bán hàng rong không phép, KHÔNG phải xe hơi cá nhân.',
      },
      {
        text: 'revised metropolitan transport charter',
        whyVi: 'Chỉ là tên bản quy chế giao thông đô thị sửa đổi.',
      },
    ],
    explanationVi: 'L4 (KHÔNG CÓ TRONG ĐOẠN): Xe cá nhân vào trung tâm giờ cao điểm chỉ bị thu phí tắc nghẽn ("subject to a congestion levy"), chứ KHÔNG bị cấm hoàn toàn ("a complete ban").',
    topics: ['transport', 'urban'],
  },
  {
    id: 'para:v3_018',
    level: 4,
    questionPhrase: 'replacing human doctors with artificial intelligence',
    relation: 'not_equivalent',
    context:
      'Modern diagnostic algorithms assist hospital physicians by flagging subtle anomalies on radiological scans far faster than the human eye. At the same time, hospitals have replaced outdated paper record systems with encrypted cloud databases to streamline patient care.',
    targetText: 'diagnostic algorithms assist hospital physicians by flagging subtle anomalies',
    decoys: [
      {
        text: 'replaced outdated paper record systems with encrypted cloud databases',
        whyVi: 'Bẫy keyword_echo: lặp động từ "replaced ... with" nhưng là thay sổ giấy bằng cơ sở dữ liệu đám mây, KHÔNG phải thay bác sĩ bằng AI.',
      },
      {
        text: 'faster than the human eye',
        whyVi: 'Bẫy keyword_echo: lặp từ "human" nhưng chỉ so sánh tốc độ quét hình ảnh với mắt người.',
      },
    ],
    explanationVi: 'L4 (KHÔNG CÓ TRONG ĐOẠN): Đoạn văn chỉ nói thuật toán AI hỗ trợ bác sĩ ("assist hospital physicians"), hoàn toàn KHÔNG nói AI thay thế bác sĩ con người ("replacing human doctors").',
    topics: ['health', 'technology'],
  },
];

export const V3_FIXTURE_PARAPHRASES: ParaphraseItem[] = RAW_V3_SEEDS.map(buildVerifiedParaphraseItem);
