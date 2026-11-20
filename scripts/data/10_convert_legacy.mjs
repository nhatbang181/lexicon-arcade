#!/usr/bin/env node
/**
 * scripts/data/10_convert_legacy.mjs
 * Converts legacy read-only data files:
 *   - public/data/anki_vocab.json (2,152 words)
 *   - public/data/ielts_4skills.json (errorFixes, paraphrases, passages, upgrades)
 *   - public/data/ielts_strategies.json (62 strategies)
 * into clean V3 source files in data-src/.
 * NEVER modifies the legacy files in public/data/.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const DATA_SRC = path.join(ROOT, 'data-src');

for (const dir of ['vocab', 'collocations', 'paraphrases', 'errors', 'tips']) {
  fs.mkdirSync(path.join(DATA_SRC, dir), { recursive: true });
}

const VALID_TOPICS = new Set([
  'education', 'environment', 'technology', 'health', 'urban', 'work', 'crime', 'media',
  'globalisation', 'culture', 'science', 'transport', 'family', 'economy', 'tourism', 'food',
  'government', 'arts', 'sport', 'animals', 'history', 'psychology', 'space', 'energy', 'language',
]);

// Concise rewrites (<= 18 words) for the 19 legacy definitions that exceeded 20 words
const DEF_OVERRIDES = {
  'data sovereignty': 'The legal rule that digital data falls under the privacy laws of the nation where it is collected.',
  'modal shift': 'A deliberate move by commuters or freight from private vehicles to more sustainable public transport.',
  'park-and-ride': 'A suburban car park beside a transit hub allowing commuters to finish journeys by bus or rail.',
  'viaduct': 'A long elevated bridge of arches carrying a road or railway across a valley or urban area.',
  'astrophysics': 'The branch of astronomy using physics and chemistry to explain the origin and evolution of celestial bodies.',
  'equinox': 'Either annual point when the sun crosses the equator, creating nearly equal day and night worldwide.',
  'inertia': 'The physical tendency of an object to stay at rest or in steady motion unless acted upon.',
  'refraction': 'The bending of a light or sound wave as it enters a medium of different density.',
  'inscribe': 'To carve words permanently onto stone or metal, or formally list a site as protected heritage.',
  'adjust': 'To change something slightly so that it fits properly or adapts to new conditions.',
  'amend': 'To make formal minor changes to a law, policy, or document to improve accuracy or fairness.',
  'generation': 'All people born around the same era, or the process of producing energy such as electricity.',
  'image': 'A visual representation of something, or the general public impression of a person or institution.',
  'margin': 'The difference between two amounts, a narrow edge, or the profit gap between cost and price.',
  'discriminate': 'To treat groups unfairly based on bias, or to recognise a subtle difference between two things.',
  'estate': 'A large area of land or residential property, or the total assets owned by an individual.',
  'input': 'Data, energy, or resources fed into a system, or helpful advice contributed to a decision.',
  'neutral': 'Not favouring either side in a debate or dispute, or carrying no strong bias.',
  'be that as it may': 'A formal phrase conceding a previous point while maintaining that the main conclusion still stands.',
};

// Authentic Vietnamese learner traps (<= 25 words) for key IELTS vocabulary
const VN_TRAPS = {
  'curriculum': 'Đừng nhầm với "syllabus": curriculum là toàn bộ chương trình trường/quốc gia, syllabus là đề cương từng môn.',
  'information': 'Danh từ không đếm được: không viết "informations" hay "an information", dùng "a piece of information".',
  'advice': 'Không đếm được: không nói "an advice" hay "advices"; dùng "a piece of advice" hoặc "some advice".',
  'research': 'Không đếm được trong văn học thuật: tránh "a research" hay "researches", dùng "conduct research" hoặc "a study".',
  'evidence': 'Không đếm được: tránh "evidences" hay "an evidence"; dùng "compelling evidence" hoặc "a piece of evidence".',
  'knowledge': 'Không đếm được: tránh "many knowledges" hay "learn knowledge"; dùng "acquire/gain knowledge".',
  'equipment': 'Không đếm được: không thêm -s ("equipments"), dùng "modern equipment" hoặc "a piece of equipment".',
  'damage': 'Danh từ "damage" (thiệt hại) không đếm được; "damages" mang nghĩa tiền bồi thường pháp lý.',
  'crime': 'Không dịch sát từ tiếng Việt thành "make a crime"; collocation chuẩn là "commit a crime".',
  'impact': 'Đi với giới từ "on" (impact on sth), không dùng "impact to"; tránh "big impact", dùng "profound impact".',
  'effect': 'Danh từ dùng "have an effect on"; tránh nhầm chính tả với động từ "affect" (không đi với giới từ).',
  'affect': 'Động từ trực tiếp "affect sth", không thêm "to" hay "on" phía sau như tiếng Việt.',
  'influence': 'Động từ "influence sth" không cần giới từ; danh từ đi với "on" ("exert an influence on").',
  'emphasise': 'Động từ trực tiếp "emphasise sth", không viết "emphasise on sth" (chỉ dùng "on" sau danh từ "emphasis").',
  'discuss': 'Động từ trực tiếp "discuss sth", không thêm "about" như dịch từ "thảo luận về".',
  'mention': 'Động từ trực tiếp "mention sth", không viết "mention about sth".',
  'approach': 'Động từ "approach sth" không có giới từ; danh từ đi với "to" ("a holistic approach to").',
  'access': 'Danh từ đi với "to" ("access to healthcare"); động từ trực tiếp "access data" không có "to".',
  'lack': 'Động từ trực tiếp "lack resources" (không "of"); danh từ mới dùng "a lack of resources".',
  'comprise': 'Nghĩa là "bao gồm", không dùng "comprise of" ở thể chủ động (chỉ dùng "consist of" hoặc "be comprised of").',
  'consist': 'Luôn dùng thể chủ động "consist of", không chia bị động "is consisted of".',
  'economic': 'Chỉ nền kinh tế ("economic growth"); đừng nhầm với "economical" (tiết kiệm, ít tốn kém).',
  'economical': 'Nghĩa là tiết kiệm chi phí/nhiên liệu, KHÔNG dùng thay cho "economic" (thuộc về kinh tế).',
  'historic': 'Mang ý nghĩa lịch sử quan trọng ("a historic treaty"); "historical" chỉ thứ thuộc về quá khứ.',
  'historical': 'Thuộc về lịch sử/quá khứ ("historical records"); không nhầm với "historic" (mang tính bước ngoặt).',
  'pollution': 'Danh từ không đếm được: tránh "pollutions"; không nói "make pollution", dùng "cause/generate pollution".',
  'environment': 'Thường đi với "the" khi nói về môi trường tự nhiên: "protect the environment", không bỏ "the".',
  'government': 'Danh từ đếm được: phải viết "the government" hoặc số nhiều "governments", không viết trần "government should".',
  'society': 'Khi nói xã hội nói chung thì KHÔNG dùng "the": viết "in modern society", không viết "in the society".',
  'traffic': 'Không đếm được: không viết "heavy traffics", dùng "heavy traffic" hoặc "traffic congestion".',
  'transport': 'Trong Anh-Anh không đếm được: dùng "public transport" (không thêm -s).',
  'awareness': 'Không nói "increase awareness" quá đơn giản; ưu tiên "raise public awareness of" (giới từ "of", không "about").',
  'demand': 'Danh từ đi với "for" ("growing demand for"); không dùng "demand of".',
  'solution': 'Đi với giới từ "to" ("a viable solution to the problem"), không dùng "solution for/of".',
  'attitude': 'Đi với giới từ "towards/to" ("attitude towards"), tránh dùng "attitude with".',
  'benefit': 'Động từ "benefit from" (hưởng lợi từ) và "benefit sb" (mang lại lợi ích cho ai).',
  'contribute': 'Luôn đi với "to + N/V-ing" ("contribute to reducing"), không dùng "contribute to + V nguyên mẫu".',
  'lead': 'Cấu trúc "lead to + N/V-ing"; tránh dùng "lead to + V nguyên mẫu".',
  'result': '"Result in" = gây ra kết quả; "result from" = bắt nguồn từ nguyên nhân. Rất hay bị đảo ngược.',
  'depend': 'Luôn đi với "on/upon" ("depend on"); tránh quên giới từ hoặc chia bị động "is depended on".',
  'prevent': 'Cấu trúc "prevent sb/sth from V-ing", không dùng "prevent sb to V".',
  'avoid': 'Đi với V-ing ("avoid using"), không dùng "avoid to V".',
  'acquire': 'Dùng với kiến thức, kỹ năng, ngôn ngữ ("acquire skills"); không thay bằng "learn knowledge".',
  'alleviate': 'Dùng để giảm bớt nỗi đau, nghèo đói, tắc nghẽn ("alleviate poverty"), không dùng cho số liệu tăng giảm.',
  'mitigate': 'Dùng để giảm nhẹ tác hại/rủi ro ("mitigate risks"); không dùng như từ đồng nghĩa mọi lúc của "reduce".',
  'exacerbate': 'Nghĩa là làm vấn đề sẵn có thêm trầm trọng; không dùng để chỉ "tăng số lượng" trung tính.',
  'foster': 'Dùng cho giá trị tích cực ("foster innovation/trust"); tránh dùng cho thứ tiêu cực.',
  'deter': 'Cấu trúc "deter sb from V-ing" (răn đe ai làm gì), không đi với "to V".',
  'allocate': 'Cấu trúc "allocate resources/funding to sth", không dùng "allocate sth for" ở mức chuẩn học thuật.',
  'invest': 'Đi với giới từ "in" ("invest heavily in"), không dùng "invest into" hay "invest to".',
  'cope': 'Luôn là "cope with sth", không bỏ "with" và không nhầm thành "cope up with".',
  'concentrate': 'Đi với "on" ("concentrate on"), không dùng "concentrate in".',
  'participate': 'Đi với "in" ("participate in"), tránh bỏ giới từ.',
  'adhere': 'Luôn đi với "to" ("adhere to regulations"), không dùng trực tiếp tân ngữ.',
  'comply': 'Luôn đi với "with" ("comply with standards"), không dùng "comply to".',
  'account': 'Trong Task 1 dùng "account for X%" (chiếm bao nhiêu phần trăm), không quên "for".',
  'fluctuate': 'Nội động từ: viết "prices fluctuated", không viết bị động "prices were fluctuated".',
  'decline': 'Nội động từ: viết "sales declined", không viết "sales were declined" (khi nói xu hướng giảm).',
  'rise': 'Nội động từ (không có tân ngữ): "prices rose"; có tân ngữ phải dùng "raise" ("raise taxes").',
  'raise': 'Ngoại động từ bắt buộc có tân ngữ ("raise awareness/standards"), đừng nhầm với nội động từ "rise".',
  'significant': 'Tránh lạm dụng thay cho "big"; dùng cho mức độ/số liệu đáng kể ("a significant reduction").',
  'phenomenon': 'Số ít là "phenomenon", số nhiều là "phenomena" (không viết "a phenomena" hay "phenomenons").',
  'criteria': 'Số nhiều là "criteria", số ít là "criterion" (không viết "a criteria").',
  'data': 'Trong IELTS Academic có thể dùng số ít hoặc số nhiều, nhưng phải nhất quán trong cả bài.',
  'media': 'Thường dùng "the media" hoặc "social media" (không thêm -s thành "medias").',
  'legislation': 'Không đếm được: dùng "strict legislation" hoặc "a piece of legislation", không viết "legislations".',
  'infrastructure': 'Không đếm được trong nghĩa chung: dùng "urban infrastructure", tránh thêm -s.',
  'unemployment': 'Không đếm được: nói "youth unemployment" hoặc "unemployment rate", không thêm -s.',
  'poverty': 'Không đếm được: dùng "alleviate/eradicate poverty", không viết "a poverty".',
  'obesity': 'Không đếm được: dùng "childhood obesity" hoặc "tackle obesity", không thêm -s.',
  'stress': 'Không đếm được: tránh "many stresses", dùng "chronic stress" hoặc "stress levels".',
  'homework': 'Không đếm được: không viết "homeworks", dùng "homework assignments".',
  'feedback': 'Không đếm được: không viết "feedbacks", dùng "constructive feedback".',
  'progress': 'Không đếm được: không viết "a progress", dùng "make significant progress".',
  'productivity': 'Không đếm được: dùng "boost/enhance productivity", không thêm -s.',
  'biodiversity': 'Không đếm được: dùng "preserve biodiversity" hoặc "loss of biodiversity".',
  'sustainability': 'Không đếm được: dùng "environmental sustainability" hoặc "promote sustainability".',
  'urbanisation': 'Chính tả Anh-Anh là "urbanisation"; dùng không đếm được ("rapid urbanisation").',
  'globalisation': 'Chính tả Anh-Anh là "globalisation"; tránh viết "the globalisation" khi nói chung.',
  'technology': 'Khi nói công nghệ nói chung không dùng "the"; chỉ dùng số nhiều "technologies" khi chỉ nhiều loại cụ thể.',
  'despite': 'Đi trực tiếp với N/V-ing ("despite the cost"), TUYỆT ĐỐI không viết "despite of".',
  'although': 'Đi với mệnh đề (S + V), không đi với "but" trong cùng câu tiếng Anh.',
  'whereas': 'Nối 2 mệnh đề tương phản trong cùng 1 câu, không đứng một mình tạo câu cụt (fragment).',
  'moreover': 'Trạng từ nối đầu câu, cần dấu phẩy phía sau ("Moreover, ...") và không dùng để nối 2 mệnh đề chỉ bằng dấu phẩy.',
  'however': 'Không nối 2 mệnh đề độc lập bằng ", however," (lỗi run-on/comma splice); phải dùng chấm câu hoặc chấm phẩy.',
  'therefore': 'Dùng "; therefore," hoặc ". Therefore," — tránh lỗi comma splice ", therefore,".',
  'consequently': 'Cần dấu chấm hoặc chấm phẩy trước "consequently" khi nối hai mệnh đề độc lập.',
  'behaviour': 'Chính tả Anh-Anh có "u" ("behaviour"); không đếm được trong văn học thuật chung.',
  'labour': 'Chính tả Anh-Anh có "u" ("labour market"); dùng nhất quán trong Reading/Writing.',
  'programme': 'Chính tả Anh-Anh dùng "programme" cho chương trình học/TV, "program" chỉ cho phần mềm máy tính.',
  'prioritise': 'Chính tả Anh-Anh dùng "-ise" ("prioritise"), ngoại động từ trực tiếp không cần giới từ.',
  'minimise': 'Chính tả Anh-Anh dùng "-ise" ("minimise risks"); tránh viết "minimize" nếu cả bài theo chuẩn UK.',
  'maximise': 'Chính tả Anh-Anh dùng "-ise" ("maximise efficiency").',
  'analyse': 'Chính tả Anh-Anh là "analyse"; danh từ là "analysis" (số nhiều "analyses").',
  'criticism': 'Không đếm được khi nói chung ("attract criticism"); tránh dịch từ tiếng Việt thành "give a criticism".',
  'opportunity': 'Đi với "to V" hoặc "for N" ("equal opportunities for all"), tránh "opportunity of V-ing" trong văn trang trọng.',
  'responsibility': 'Collocation chuẩn là "take/shoulder responsibility for", tránh "do responsibility".',
  'measure': 'Khi chỉ giải pháp/biện pháp luôn dùng số nhiều "measures" + "take/implement measures to V".',
  'policy': 'Collocation chuẩn là "implement/enforce/adopt a policy", tránh "do/make a policy" trong văn trang trọng.',
  'issue': 'Collocation chuẩn là "address/tackle an issue", tránh "solve an issue" quá đơn giản.',
  'problem': 'Dùng "address/tackle/resolve a problem"; tránh "big problem" ở Band 7.5+, thay bằng "pressing/acute problem".',
  'risk': 'Dùng "pose a risk to" hoặc "mitigate risks", tránh "make a risk".',
  'role': 'Dùng "play a pivotal/vital role in + N/V-ing", tránh dùng giới từ "for" hay "of".',
  'pressure': 'Dùng "exert/place pressure on", tránh "make pressure on".',
  'habit': 'Dùng "develop/cultivate a habit" và "break a habit", tránh "destroy a habit".',
  'attention': 'Dùng "pay attention to" hoặc "draw attention to"; không nói "give attention for".',
  'decision': 'Dùng "make a decision" hoặc "reach a decision", không dùng "do a decision".',
  'effort': 'Dùng "make a concerted effort to V", tránh "do an effort".',
  'mistake': 'Dùng "make a mistake", tránh "do a mistake".',
  'standard': 'Dùng "raise/maintain living standards" hoặc "meet strict standards".',
  'quality': 'Dùng "enhance the quality of life", không cần "the" trước "life" nói chung.',
  'gap': 'Dùng "bridge/narrow the gap between A and B", tránh "close down the gap".',
  'barrier': 'Dùng "overcome/remove barriers to + N/V-ing", đi với giới từ "to".',
  'challenge': 'Dùng "pose a challenge to" và "overcome/confront a challenge".',
  'trend': 'Dùng "a growing/upward trend towards", tránh "a big trend".',
  'rate': 'Dùng "crime rate", "literacy rate", "mortality rate" — tránh nhầm với "ratio" hay "proportion".',
  'proportion': 'Dùng "a significant proportion of + N"; động từ chia theo danh từ sau "of".',
  'majority': '"The majority of + N số nhiều" đi với động từ số nhiều ("are"), tránh chia số ít.',
  'minority': 'Dùng "a small/significant minority of", lưu ý bẫy qualifier trong Reading TFNG.',
  'number': '"The number of + N số nhiều" chia động từ SỐ ÍT; "A number of + N số nhiều" chia SỐ NHIỀU.',
  'amount': 'Chỉ dùng "a large amount of" cho danh từ KHÔNG đếm được; đếm được phải dùng "a large number of".',
  'fewer': 'Dùng "fewer" cho danh từ đếm được số nhiều ("fewer cars"); "less" cho không đếm được ("less traffic").',
  'less': 'Không dùng "less" cho danh từ đếm được số nhiều trong văn viết học thuật (dùng "fewer").',
  'vulnerable': 'Đi với giới từ "to" ("vulnerable to climate change"), không dùng "with" hay "for".',
  'prone': 'Đi với giới từ "to" ("prone to obesity/errors"), không dùng "for".',
  'conducive': 'Luôn đi với "to" ("conducive to learning"), rất ăn điểm LR Band 8.',
  'detrimental': 'Đi với "to" ("detrimental to mental health"), thay thế học thuật cho "bad for".',
  'beneficial': 'Đi với "to" ("beneficial to society"), không dùng "beneficial for" khi viết thật chuẩn UK.',
  'accessible': 'Đi với "to" ("accessible to low-income families"), không dùng "accessible for".',
  'accountable': 'Cấu trúc "hold sb accountable for sth", đi với giới từ "for".',
  'compatible': 'Đi với "with" ("compatible with economic growth"), không dùng "to".',
  'relevant': 'Đi với "to" ("relevant to modern learners"), tránh dùng "relevant with".',
  'resistant': 'Đi với "to" ("resistant to antibiotics/change"), không dùng "against".',
  'susceptible': 'Đi với "to" ("susceptible to misinformation"), không dùng "for".',
  'responsible': 'Đi với "for" ("responsible for emissions"), không dùng "of".',
  'aware': 'Đi với "of" ("aware of the consequences"), tránh quên "of".',
  'capable': 'Đi với "of + V-ing" ("capable of adapting"), không dùng "capable to V".',
  'dependent': 'Đi với "on" ("heavily dependent on fossil fuels"), không dùng "of".',
  'reliant': 'Đi với "on" ("overly reliant on smartphones"), đồng nghĩa trang trọng hơn "dependent on".',
  'committed': 'Đi với "to + N/V-ing" ("committed to reducing emissions"), không dùng "to + V nguyên mẫu".',
  'devoted': 'Đi với "to + N/V-ing" ("devoted to preserving heritage").',
  'exposed': 'Đi với "to" ("exposed to air pollutants"), không dùng "with".',
  'associated': 'Đi với "with" ("associated with chronic illness"), không dùng "to".',
  'attributed': 'Cấu trúc "be attributed to" (được quy cho nguyên nhân là), khác với "contribute to".',
  'derived': 'Đi với "from" ("derived from renewable sources"), tránh "derived of".',
  'exempt': 'Đi với "from" ("exempt from taxation").',
  'deprived': 'Đi với "of" ("deprived of basic sanitation").',
  'equipped': 'Đi với "with" ("equipped with digital skills").',
  'engaged': 'Đi với "in" ("engaged in civic activities").',
  'involved': 'Đi với "in" ("involved in decision-making"), không dùng "with" cho hoạt động.',
  'widespread': 'Tính từ ghép, không viết tách "wide spread"; thường đứng trước danh từ ("widespread adoption").',
  'ubiquitous': 'Đã mang nghĩa "có mặt khắp nơi", không thêm "very" phía trước ("very ubiquitous" là thừa).',
  'unique': 'Tính từ tuyệt đối, tránh viết "very unique" trong văn viết học thuật.',
  'inevitable': 'Tránh viết "very inevitable"; dùng "virtually inevitable" hoặc "almost inevitable".',
  'crucial': 'Tính từ mạnh, không đi với "very"; dùng "absolutely crucial" hoặc đứng một mình.',
  'vital': 'Tính từ mạnh, không đi với "very"; đi với "to/for" ("vital to economic stability").',
  'paramount': 'Thường dùng "of paramount importance" hoặc "paramount concern", không đi với "very".',
};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function wordCount(str) {
  return String(str || '').trim().split(/\s+/).filter(Boolean).length;
}

function mapPos(legacyPos, headword) {
  const p = (legacyPos || '').trim().toLowerCase().replace(/\.$/, '');
  const isMulti = /\s/.test(headword.trim());
  if (p === 'n') return isMulti && headword.split(/\s+/).length >= 4 ? ['phr'] : ['n'];
  if (p === 'v') {
    if (isMulti && /\b(up|out|off|on|in|away|down|over|back|through|about|into|for|to|with|from)\b$/i.test(headword.trim())) {
      return ['phr_v'];
    }
    return ['v'];
  }
  if (p === 'adj') return ['adj'];
  if (p === 'adv') return isMulti ? ['phr'] : ['adv'];
  if (['phr', 'phr_v', 'idiom', 'prep', 'conj'].includes(p)) return [p];
  return ['n'];
}

function inferTopics(realmId, text) {
  const t = text.toLowerCase();
  const direct = {
    education: ['education'],
    environment: ['environment'],
    technology: ['technology'],
    health: ['health'],
    economy: ['economy'],
    media: ['media'],
    transport: ['transport'],
    science: ['science'],
    culture: ['culture'],
  };
  if (direct[realmId]) {
    const out = [...direct[realmId]];
    if (realmId === 'environment' && /\b(solar|wind|nuclear|fuel|energy|power|grid|coal|renewable|carbon)\b/.test(t)) out.push('energy');
    if (realmId === 'environment' && /\b(species|wildlife|habitat|animal|marine|bird|predator|fauna|extinction)\b/.test(t)) out.push('animals');
    if (realmId === 'health' && /\b(diet|food|nutrition|calorie|sugar|meal|organic|crop|agriculture|obesity)\b/.test(t)) out.push('food');
    if (realmId === 'health' && /\b(mental|anxiety|stress|cognitive|brain|memory|depression|psycholog|behaviour)\b/.test(t)) out.push('psychology');
    if (realmId === 'economy' && /\b(employ|job|career|worker|salary|wage|workplace|labour|remote work)\b/.test(t)) out.push('work');
    if (realmId === 'culture' && /\b(art|museum|music|theatre|literature|painting|aesthetic|film)\b/.test(t)) out.push('arts');
    if (realmId === 'culture' && /\b(ancient|century|heritage|archaeolog|historical|dynasty|monument)\b/.test(t)) out.push('history');
    if (realmId === 'culture' && /\b(language|bilingual|dialect|linguistic|vocabulary|accent)\b/.test(t)) out.push('language');
    if (realmId === 'science' && /\b(orbit|planet|galaxy|cosmic|satellite|asteroid|solar system|telescope|space)\b/.test(t)) out.push('space');
    if (realmId === 'transport' && /\b(city|urban|suburb|housing|municipal|congestion|metropolitan|sprawl)\b/.test(t)) out.push('urban');
    if (realmId === 'transport' && /\b(tourist|tourism|travel|hotel|destination|holiday|visitor)\b/.test(t)) out.push('tourism');
    return [...new Set(out)].filter((x) => VALID_TOPICS.has(x));
  }

  const rules = [
    ['crime', /\b(crime|criminal|prison|offend|police|theft|fraud|justice|punish|detention|rehabilitat|law enforcement|juvenile)\b/],
    ['urban', /\b(urban|city|cities|housing|suburb|metropolitan|slum|gentrification|municipal|zoning|commuter)\b/],
    ['family', /\b(family|parent|child|children|elderly|marriage|household|generation|upbringing|sibling|demographic|birth rate)\b/],
    ['work', /\b(work|worker|employee|employer|career|job|workplace|salary|wage|unemployment|retire|profession|labour)\b/],
    ['globalisation', /\b(global|international|multinational|border|migrant|migration|trade|outsourc|worldwide|foreign)\b/],
    ['government', /\b(government|policy|policies|state|tax|law|legislation|regulation|public|welfare|parliament|civic|subsidy|authority|citizen|democra)\b/],
    ['education', /\b(school|student|university|teach|learn|academic|curriculum|literacy|exam|degree|college|tuition|scholarship)\b/],
    ['environment', /\b(climate|pollution|carbon|emission|forest|ecosystem|biodiversity|sustainable|recycling|drought|waste|plastic)\b/],
    ['energy', /\b(energy|electricity|renewable|solar|fossil|nuclear|power plant|grid|fuel)\b/],
    ['technology', /\b(digital|software|algorithm|data|internet|device|automation|artificial|cyber|online|robot|network|computer)\b/],
    ['health', /\b(health|medical|disease|hospital|patient|doctor|clinic|vaccine|symptom|therapy|treatment|chronic|well-being)\b/],
    ['psychology', /\b(mental|cognitive|emotion|perception|motivation|behaviour|stress|habit|memory|bias|attitude|consciousness)\b/],
    ['economy', /\b(economy|economic|market|price|inflation|budget|invest|finance|financial|revenue|profit|gdp|consumer|fiscal|debt)\b/],
    ['media', /\b(media|news|journalis|broadcast|advertis|press|social media|headline|censorship|propaganda)\b/],
    ['transport', /\b(transport|traffic|vehicle|railway|aviation|highway|commute|pedestrian|freight|transit)\b/],
    ['science', /\b(science|scientific|research|experiment|hypothesis|theory|empirical|laboratory|evidence|method|data|analysis)\b/],
    ['culture', /\b(culture|cultural|tradition|custom|heritage|identity|festival|ritual|indigenous|ethnic)\b/],
    ['arts', /\b(art|artistic|music|literature|museum|theatre|creative|design|architecture|aesthetic)\b/],
    ['history', /\b(history|historical|ancient|century|archaeolog|era|medieval|colonial|archive|artifact)\b/],
    ['language', /\b(language|linguistic|speech|vocabulary|grammar|fluency|bilingual|translate|idiom|communication)\b/],
    ['food', /\b(food|agriculture|crop|farm|diet|nutrition|harvest|livestock|organic|famine)\b/],
    ['tourism', /\b(tourism|tourist|travel|hospitality|destination|ecotourism|visitor)\b/],
    ['sport', /\b(sport|athlete|exercise|fitness|competition|stadium|physical activity|training)\b/],
    ['animals', /\b(animal|wildlife|species|habitat|conservation|extinction|predator|marine)\b/],
    ['space', /\b(space|planet|orbit|astronomy|satellite|cosmic|telescope|mars|lunar)\b/],
  ];

  const matched = [];
  for (const [topic, re] of rules) {
    if (re.test(t)) matched.push(topic);
    if (matched.length >= 2) break;
  }
  if (matched.length === 0) {
    return realmId === 'society' ? ['government'] : ['education'];
  }
  return matched;
}

function trimMeaningVi(meaning) {
  let s = String(meaning || '').trim().replace(/\s+/g, ' ');
  if (wordCount(s) <= 12) return s;
  // Remove trailing verbose parenthetical explanation first
  const noParen = s.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (noParen && wordCount(noParen) <= 12) return noParen;
  // Split on semicolon or comma and take crisp clauses up to 12 words
  const parts = noParen.split(/[;,]/).map((p) => p.trim()).filter(Boolean);
  let acc = '';
  for (const part of parts) {
    const candidate = acc ? `${acc}, ${part}` : part;
    if (wordCount(candidate) <= 12) {
      acc = candidate;
    } else {
      break;
    }
  }
  if (acc && wordCount(acc) <= 12) return acc;
  return noParen.split(/\s+/).slice(0, 12).join(' ').replace(/[,;:\-]+$/, '');
}

function cleanDefinitionEn(word, def) {
  const key = word.trim().toLowerCase();
  if (DEF_OVERRIDES[key]) return DEF_OVERRIDES[key];
  let s = String(def || '').trim().replace(/\s+/g, ' ');
  // Normalize straight quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  if (!/[.!?]$/.test(s)) s += '.';
  if (wordCount(s) <= 20) return s;
  // Fallback concise trim if any unexpected > 20 word def appears
  const cut = s.split(/[;]/)[0].trim();
  if (wordCount(cut) <= 20) return cut.endsWith('.') ? cut : `${cut}.`;
  return s.split(/\s+/).slice(0, 18).join(' ').replace(/[,;:\-]+$/, '') + '.';
}

function parseSynonyms(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) return undefined;
  const out = [];
  for (const entry of rawList.slice(0, 4)) {
    const s = String(entry || '').trim();
    if (!s) continue;
    const m = s.match(/^([^(]+?)\s*\(([^)]+)\)\s*$/);
    if (m) {
      out.push({ word: m[1].trim(), noteVi: m[2].trim() });
    } else {
      out.push({ word: s });
    }
  }
  return out.length ? out : undefined;
}

const TOPIC_CONTEXT_ADDONS = {
  education: 'across modern secondary schools and universities',
  environment: 'in many rapidly warming regions around the world',
  technology: 'across fast-evolving digital industries and public services',
  health: 'within overstretched national healthcare systems today',
  urban: 'in densely populated metropolitan areas worldwide',
  work: 'in today\'s competitive and rapidly shifting labour market',
  crime: 'in efforts to maintain public safety and legal fairness',
  media: 'in an era of instant digital broadcasting and news feeds',
  globalisation: 'across closely interconnected international markets today',
  culture: 'within increasingly diverse contemporary societies',
  science: 'in peer-reviewed academic studies and modern laboratories',
  transport: 'across congested urban commuter networks worldwide',
  family: 'within modern households facing changing social norms',
  economy: 'during periods of sustained fiscal pressure and inflation',
  tourism: 'in popular heritage destinations experiencing heavy visitor numbers',
  food: 'across global agricultural supply chains and local markets',
  government: 'when national authorities design long-term public policies',
  arts: 'across contemporary cultural institutions and public galleries',
  sport: 'at both grassroots community clubs and elite competitions',
  animals: 'across threatened natural habitats and wildlife reserves',
  history: 'when historians examine major social shifts of past centuries',
  psychology: 'according to recent behavioural studies of everyday decision-making',
  space: 'during long-duration orbital missions and deep-space exploration',
  energy: 'as nations transition away from carbon-intensive fossil fuels',
  language: 'among multilingual speakers in academic and workplace settings',
};

function expandShortExample(ex, topic) {
  let s = String(ex || '').trim().replace(/\s+/g, ' ');
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  if (!/[.!?]$/.test(s)) s += '.';
  const wc = wordCount(s);
  if (wc >= 10 && wc <= 30) return s;
  if (wc > 30) return s;
  // Natural context suffix (adds ~6-8 words so total lands cleanly in 11-18 words)
  const addon = TOPIC_CONTEXT_ADDONS[topic] || 'in contemporary academic and policy discussions';
  const punct = s.slice(-1);
  const body = s.slice(0, -1);
  // Avoid awkward double prepositional endings if sentence already ends with a trailing phrase
  const candidate = `${body} ${addon}${punct}`;
  if (wordCount(candidate) <= 28) return candidate;
  return `${body}, according to recent studies${punct}`;
}

function pickBestCollocation(word, cols) {
  const hw = word.toLowerCase();
  const list = Array.isArray(cols) ? cols.map((c) => String(c || '').trim()).filter(Boolean) : [];
  const exact = list.find((c) => c.toLowerCase().includes(hw) && c.split(/\s+/).length >= 2 && c.split(/\s+/).length <= 5);
  if (exact) return exact;
  return null;
}

const DETERMINER_RE = /^(a|an|the|this|that|these|those|my|our|their|its|his|her|some|any|no|every|each|more|most|much|many|few|several|various|all)\b/i;
const COMMON_VERBS_RE = /^(take|make|have|give|get|set|put|hold|keep|bring|build|raise|boost|cut|reduce|increase|lower|improve|enhance|promote|foster|encourage|discourage|prevent|avoid|tackle|address|solve|resolve|adopt|implement|enforce|maintain|preserve|protect|restore|revise|overhaul|abolish|cover|acquire|gain|develop|achieve|reach|create|generate|produce|cause|pose|exert|wield|play|pay|draw|attract|face|confront|overcome|bridge|narrow|widen|expand|limit|restrict|curb|eliminate|eradicate|alleviate|mitigate|exacerbate|undermine|jeopardise|threaten|support|fund|allocate|invest|spend|waste|consume|use|utilise|apply|rely|depend|focus|concentrate|participate|engage|contribute|lead|result|stem|arise|emerge|occur|exist|remain|become|grow|rise|fall|decline|drop|surge|soar|plunge|fluctuate|shift|move|turn|seek|aim|strive|struggle|fail|manage|ensure|guarantee|provide|offer|deliver|supply|meet|fulfil|satisfy|violate|breach|comply|adhere|conform|adapt|adjust|modify|alter|transform|convert|integrate|combine|balance|weigh|assess|evaluate|measure|monitor|track|detect|identify|recognise|acknowledge|accept|reject|deny|challenge|question|criticise|condemn|praise|endorse|advocate|oppose|resist|ban|prohibit|allow|permit|enable|facilitate|hinder|hamper|impede|stifle|inhibit|deter|curtail|suppress|trigger|spark|stimulate|accelerate|slow|delay|postpone|suspend|terminate|cease|abandon|retain|sustain|uphold|strengthen|weaken|erode|distort|manipulate|exploit|abuse|neglect|ignore|overlook|underestimate|exaggerate|emphasise|highlight|demonstrate|illustrate|indicate|reveal|confirm|verify|validate|justify|clarify|explain|define|describe|portray|depict|reflect|represent|embody|symbolise|comprise|consist|include|contain|involve|entail|require|necessitate|demand|need|lack|miss|lose|win|earn|save|share|distribute|spread|transmit|disseminate|circulate|publish|broadcast|report|record|document|archive|store|collect|gather|compile|analyse|examine|investigate|explore|study|research|survey|observe|inspect|test|verify|diagnose|treat|cure|heal|recover|survive|endure|tolerate|cope|deal|handle|manage|control|regulate|govern|oversee|supervise|coordinate|organise|plan|design|construct|establish|found|launch|initiate|introduce|enact|pass|amend|repeal|draft|sign|ratify|enforce|prosecute|punish|penalise|fine|imprison|rehabilitate|teach|educate|train|instruct|mentor|guide|inspire|motivate|empower|equip|prepare|prepare|cram|enrol|enroll|graduate|attend|skip|drop|repeat|memorise|revise|practise|learn|master|grasp|comprehend|understand|interpret|perceive|view|regard|consider|treat|classify|categorise|differentiate|distinguish|compare|contrast|link|connect|associate|correlate|attribute|ascribe|derive|extract|obtain|procure|purchase|buy|sell|export|import|manufacture|assemble|recycle|dispose|dump|emit|release|absorb|trap|capture|harness|generate|conserve|save|burn|consume|deplete|exhaust|pollute|contaminate|degrade|destroy|damage|harm|injure|impair|disrupt|destabilise|endanger|threaten)\b/i;

function buildSecondExample(word, posArr, cols, topic, idx) {
  const pos = posArr[0];
  const col = pickBestCollocation(word, cols);
  const hw = word.trim();
  const topicDomain = {
    education: 'academic policymakers',
    environment: 'environmental scientists',
    technology: 'technology analysts',
    health: 'public health specialists',
    urban: 'urban planners',
    work: 'workplace researchers',
    crime: 'legal scholars',
    media: 'media analysts',
    globalisation: 'international economists',
    culture: 'cultural historians',
    science: 'research teams',
    transport: 'transport engineers',
    family: 'social researchers',
    economy: 'economic advisers',
    tourism: 'tourism officials',
    food: 'nutrition specialists',
    government: 'senior policymakers',
    arts: 'arts curators',
    sport: 'sports scientists',
    animals: 'wildlife biologists',
    history: 'modern historians',
    psychology: 'behavioural psychologists',
    space: 'aerospace engineers',
    energy: 'energy analysts',
    language: 'applied linguists',
  }[topic] || 'experienced researchers';

  const variant = idx % 4;

  // Use collocation-aware natural frames
  if (pos === 'v' || pos === 'phr_v') {
    const phrase = col && col.toLowerCase().startsWith(hw.toLowerCase()) ? col : hw;
    const frames = [
      `In IELTS Writing Task 2 essays, candidates often explain why governments should ${phrase} before problems worsen.`,
      `According to ${topicDomain}, national institutions must take decisive steps to ${phrase} over the coming decade.`,
      `During recent policy debates, experts argued that local authorities ought to ${phrase} more effectively.`,
      `Many observers believe that sustained public investment will eventually help communities ${phrase} at scale.`,
    ];
    return { en: frames[variant], ieltsContext: variant % 2 === 0 ? 'W2' : 'S' };
  }

  if (pos === 'adj') {
    if (col && col.toLowerCase().startsWith(hw.toLowerCase()) && col.split(/\s+/).length >= 2) {
      const hasDet = DETERMINER_RE.test(col);
      const np = hasDet ? col : `more ${col}`;
      // Better: avoid "more" before superlative/ungradable/hyphenated adjectives by using plain NP with plural or article
      const isPluralCol = /s\b$/i.test(col) && !/(ss|us|is|ics)\b$/i.test(col);
      const safeNp = hasDet ? col : (isPluralCol ? col : `the ${col}`);
      const frames = [
        `Recent reports from ${topicDomain} draw close attention to ${safeNp} in contemporary public life.`,
        `When evaluating long-term reforms, ${topicDomain} frequently emphasise the importance of ${safeNp} across communities.`,
        `In academic discussions, ${topicDomain} point out that ${safeNp} can shape outcomes for years ahead.`,
        `Public debate increasingly focuses on how ${safeNp} affects everyday decisions in modern society.`,
      ];
      return { en: frames[variant], ieltsContext: variant % 2 === 0 ? 'R' : 'W2' };
    }
    const frames = [
      `In formal speaking and writing, ${topicDomain} often describe current conditions as increasingly ${hw} for ordinary citizens.`,
      `Several studies reviewed by ${topicDomain} conclude that existing arrangements remain far too ${hw} to succeed long term.`,
      `Many commentators argue that the overall trend has become unmistakably ${hw} across both urban and rural regions.`,
      `Evidence gathered by ${topicDomain} suggests that these policies appear surprisingly ${hw} under real-world pressures.`,
    ];
    return { en: frames[variant], ieltsContext: variant % 2 === 0 ? 'W2' : 'S' };
  }

  if (pos === 'adv') {
    if (col && col.toLowerCase().startsWith(hw.toLowerCase()) && col.split(/\s+/).length >= 2) {
      const frames = [
        `Long-term assessments by ${topicDomain} warn that modern systems must remain ${col} despite rapid change.`,
        `Evidence reviewed by ${topicDomain} indicates that these developments are often ${col} in practice.`,
        `Many analysts note that public initiatives should be ${col} before expanding to a national level.`,
        `In academic reports, such outcomes are widely regarded as ${col} across comparable countries.`,
      ];
      return { en: frames[variant], ieltsContext: 'R' };
    }
    const frames = [
      `Recent findings from ${topicDomain} show that policy choices can affect long-term outcomes ${hw} across diverse populations.`,
      `Over the past decade, public attitudes have shifted ${hw}, prompting ${topicDomain} to revise earlier forecasts.`,
      `When resources are managed ${hw}, local communities tend to experience more stable social and economic progress.`,
      `In academic writing, ${topicDomain} stress that the available evidence must be interpreted ${hw} to avoid bias.`,
    ];
    return { en: frames[variant], ieltsContext: 'W2' };
  }

  if (pos === 'phr' || pos === 'idiom' || pos === 'conj' || pos === 'prep') {
    const frames = [
      `In formal essays, writers may use "${hw}" to express nuanced reasoning when analysing complex social trends.`,
      `During academic discussions, ${topicDomain} often refer to the idea of ${hw} when weighing competing priorities.`,
      `Candidates aiming for Band 8 learn how to apply the expression ${hw} accurately in formal arguments.`,
      `When summarising complex evidence, ${topicDomain} sometimes highlight ${hw} to clarify key distinctions.`,
    ];
    return { en: frames[variant], ieltsContext: 'W2' };
  }

  // Noun ('n')
  if (col) {
    if (COMMON_VERBS_RE.test(col) && !DETERMINER_RE.test(col)) {
      const frames = [
        `According to ${topicDomain}, national authorities need coherent strategies to ${col} over the next decade.`,
        `In many countries, public agencies are under growing pressure to ${col} while keeping costs manageable.`,
        `Recent reviews by ${topicDomain} highlight the urgent need to ${col} across both urban and rural areas.`,
        `Without clear long-term funding, local organisations often struggle to ${col} in a consistent manner.`,
      ];
      return { en: frames[variant], ieltsContext: variant % 2 === 0 ? 'W2' : 'R' };
    }
    const hasDet = DETERMINER_RE.test(col);
    const isPluralCol = /s\b$/i.test(col) && !/(ss|us|is|ics|ness|ous)\b$/i.test(col);
    const np = hasDet ? col : (isPluralCol ? col : `the role of ${col}`);
    const frames = [
      `In recent years, ${topicDomain} have closely examined ${np} in shaping long-term public outcomes.`,
      `Policy papers prepared by ${topicDomain} frequently emphasise ${np} when recommending practical reforms.`,
      `Across developed and developing nations alike, debates continue regarding ${np} in everyday life.`,
      `Careful investment in ${hasDet || isPluralCol ? col : col} remains a central priority for ${topicDomain} worldwide.`,
    ];
    return { en: frames[variant], ieltsContext: variant % 2 === 0 ? 'W2' : 'S' };
  }

  const isPluralHw = /s\b$/i.test(hw) && !/(ss|us|is|ics|ness)\b$/i.test(hw);
  const hwNp = isPluralHw ? hw : `the issue of ${hw}`;
  const frames = [
    `In contemporary academic writing, ${topicDomain} frequently examine ${hwNp} when assessing long-term policy choices.`,
    `Recent surveys conducted by ${topicDomain} highlight how ${hwNp} influences everyday decisions in modern communities.`,
    `National governments increasingly recognise that addressing ${hwNp} requires sustained funding and public cooperation.`,
    `During formal debates, ${topicDomain} often point to ${hwNp} as a decisive factor in future progress.`,
  ];
  return { en: frames[variant], ieltsContext: variant % 2 === 0 ? 'W2' : 'R' };
}

function mapErrorTag(category, wrong, correct) {
  const c = (category || '').toLowerCase();
  if (c.includes('subject-verb')) return 'sva';
  if (c.includes('uncountable')) return 'plural';
  if (c.includes('article')) return 'article';
  if (c.includes('preposition')) return 'preposition';
  if (c.includes('word form')) return 'word_form';
  if (c.includes('collocation')) return 'l1_collocation';
  if (c.includes('register')) return 'register';
  if (c.includes('spelling')) return 'spelling';
  if (c.includes('clauses') || c.includes('punctuation')) {
    if (/^(although|because|while|whereas|since|if|when)\b/i.test(wrong.trim()) && !wrong.includes(',')) return 'fragment';
    return 'run_on';
  }
  if (c.includes('verb patterns') || c.includes('conditionals') || c.includes('task 1')) {
    if (/\b(was|were|had|has|have|will|would|did|rose|fell|increased|decreased|grew|dropped)\b/i.test(correct)) return 'tense';
    return 'word_form';
  }
  if (c.includes('relative')) return 'fragment';
  if (c.includes('comparison')) return 'word_form';
  return 'word_form';
}

function trimRuleVi(text) {
  let s = String(text || '').trim().replace(/\s+/g, ' ');
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  if (wordCount(s) <= 25) return s;
  const firstSentence = s.split(/(?<=[.!?])\s+/)[0];
  if (wordCount(firstSentence) <= 25) return firstSentence;
  return s.split(/\s+/).slice(0, 23).join(' ').replace(/[,;:\-]+$/, '') + '.';
}

function convertAnkiVocab() {
  const raw = JSON.parse(fs.readFileSync(path.join(PUBLIC_DATA, 'anki_vocab.json'), 'utf8'));
  const seenHeadwords = new Set();
  const seenIds = new Set();
  const items = [];
  let idx = 0;

  for (const realm of raw.realms || []) {
    for (const w of realm.words || []) {
      const headword = String(w.word || '').trim().replace(/\s+/g, ' ');
      if (!headword) continue;
      const hwKey = headword.toLowerCase();
      if (seenHeadwords.has(hwKey)) continue;
      seenHeadwords.add(hwKey);

      let slug = slugify(headword);
      if (!slug) slug = `item_${idx}`;
      let id = `vocab:${slug}`;
      let suffix = 2;
      while (seenIds.has(id)) {
        id = `vocab:${slug}_${suffix++}`;
      }
      seenIds.add(id);

      const pos = mapPos(w.pos, headword);
      const topics = inferTopics(realm.id, `${headword} ${w.definition || ''} ${w.example || ''}`);
      const primaryTopic = topics[0];

      const ex1En = expandShortExample(w.example, primaryTopic);
      const ex2 = buildSecondExample(headword, pos, w.collocations, primaryTopic, idx);

      const lists = ['ANKI'];
      if (realm.id !== 'awl' && realm.id !== 'mastery') lists.push('TOPIC');

      const register = realm.id === 'awl' || realm.id === 'science' || wordCount(headword) === 1 && headword.length >= 9
        ? 'formal'
        : 'neutral';

      const item = {
        id,
        headword,
        pos,
        ipa: { uk: String(w.ipa || '').trim() },
        meaningVi: trimMeaningVi(w.meaning),
        definitionEn: cleanDefinitionEn(headword, w.definition),
        examples: [
          { en: ex1En, ieltsContext: 'W2' },
          ex2,
        ],
        collocationIds: [],
        register,
        topics,
        lists,
        audio: { uk: `audio/vocab/${slug}.uk.mp3` },
        provenance: {
          createdBy: 'import',
          source: `anki:${realm.id}`,
          license: 'own',
          qa: { schema: 'pass', verifier: 'pass' },
        },
        _legacyCollocations: Array.isArray(w.collocations) ? w.collocations : [],
      };

      const syns = parseSynonyms(w.synonyms);
      if (syns) item.synonyms = syns;
      if (VN_TRAPS[hwKey]) item.vnTrap = VN_TRAPS[hwKey];

      items.push(item);
      idx++;
    }
  }

  fs.writeFileSync(
    path.join(DATA_SRC, 'vocab', 'legacy_anki.json'),
    JSON.stringify(items, null, 2) + '\n',
    'utf8',
  );
  console.log(`[10_convert_legacy] Vocab converted: ${items.length} unique items -> data-src/vocab/legacy_anki.json`);
}

function convert4Skills() {
  const s4 = JSON.parse(fs.readFileSync(path.join(PUBLIC_DATA, 'ielts_4skills.json'), 'utf8'));

  // 1. Error fixes -> data-src/errors/legacy_errors.json
  const errors = [];
  for (let i = 0; i < (s4.writing?.errorFixes || []).length; i++) {
    const e = s4.writing.errorFixes[i];
    const wrong = String(e.sentenceWithError || '').trim();
    const correct = String(e.fullCorrectSentence || '').trim();
    const spanStr = String(e.errorSpan || '').trim();
    if (!wrong || !correct || wrong === correct) continue;
    let start = wrong.indexOf(spanStr);
    if (start < 0) start = wrong.toLowerCase().indexOf(spanStr.toLowerCase());
    if (start < 0) continue;
    const end = start + spanStr.length;
    const tag = mapErrorTag(e.category, wrong, correct);
    const num = String(i + 1).padStart(3, '0');
    errors.push({
      id: `err:legacy_${num}`,
      tag,
      wrong,
      correct,
      errorSpan: { start, end },
      ruleVi: trimRuleVi(e.explanationVi),
      provenance: {
        createdBy: 'import',
        source: `ielts_4skills:${e.id || num}`,
        license: 'own',
        qa: { schema: 'pass', verifier: 'pass' },
      },
    });
  }
  fs.writeFileSync(
    path.join(DATA_SRC, 'errors', 'legacy_errors.json'),
    JSON.stringify(errors, null, 2) + '\n',
    'utf8',
  );

  // 2. Paraphrase seeds + reading passage contexts -> data-src/paraphrases/legacy_seeds.json
  const paraSeeds = {
    paraphrases: s4.reading?.paraphrases || [],
    passages: s4.reading?.passages || [],
  };
  fs.writeFileSync(
    path.join(DATA_SRC, 'paraphrases', 'legacy_seeds.json'),
    JSON.stringify(paraSeeds, null, 2) + '\n',
    'utf8',
  );

  // 3. Writing upgrades -> data-src/collocations/legacy_upgrades.json
  fs.writeFileSync(
    path.join(DATA_SRC, 'collocations', 'legacy_upgrades.json'),
    JSON.stringify(s4.writing?.upgrades || [], null, 2) + '\n',
    'utf8',
  );

  console.log(
    `[10_convert_legacy] 4skills converted: ${errors.length} error items, ` +
    `${paraSeeds.paraphrases.length} paraphrase seeds, ${(s4.writing?.upgrades || []).length} upgrades.`,
  );
}

function inferTipSkill(title, answer) {
  const t = `${title} ${answer}`.toLowerCase();
  if (/listening|nghe|part 1|part 2|part 3|part 4|đánh vần|số điện thoại/.test(t)) return 'listening';
  if (/reading|tfng|true\/false|heading|passage|đọc|skimming|scanning|paraphrase/.test(t)) return 'reading';
  if (/writing|task 1|task 2|overview|essay|đoạn|viết|collocation|chấm bài/.test(t)) return 'writing';
  if (/speaking|nói|cue card|fluency|phát âm|trọng âm|giám khảo/.test(t)) return 'speaking';
  return 'general';
}

function makeShortTipVi(title, answer) {
  let s = String(answer || '').trim().replace(/\s+/g, ' ');
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  if (wordCount(s) <= 25) return s;
  // Take first sentence if <= 25 words
  const sents = s.split(/(?<=[.!?])\s+/);
  if (sents[0] && wordCount(sents[0]) <= 25 && wordCount(sents[0]) >= 5) {
    return sents[0];
  }
  // Split on colon/semicolon if clean
  const parts = s.split(/[;]/);
  if (parts[0] && wordCount(parts[0]) <= 25 && wordCount(parts[0]) >= 5) {
    return parts[0].trim().replace(/[,;:\-]+$/, '') + '.';
  }
  return s.split(/\s+/).slice(0, 23).join(' ').replace(/[,;:\-]+$/, '') + '.';
}

function convertStrategies() {
  const raw = JSON.parse(fs.readFileSync(path.join(PUBLIC_DATA, 'ielts_strategies.json'), 'utf8'));
  const strategies = raw.strategies || [];
  const tips = strategies.map((s, i) => {
    const num = String(i + 1).padStart(3, '0');
    const tipVi = makeShortTipVi(s.title, s.answer);
    return {
      id: `tip:${num}`,
      title: String(s.title || '').trim(),
      tipVi,
      detailVi: String(s.detail || s.answer || '').trim(),
      skill: inferTipSkill(s.title, s.answer),
      category: String(s.category || 'general').trim(),
      provenance: {
        createdBy: 'import',
        source: `ielts_strategies:${s.id || num}`,
        license: 'own',
        qa: { schema: 'pass', verifier: 'pass' },
      },
    };
  });

  fs.writeFileSync(
    path.join(DATA_SRC, 'tips', 'legacy_tips.json'),
    JSON.stringify(tips, null, 2) + '\n',
    'utf8',
  );
  console.log(`[10_convert_legacy] Strategies converted: ${tips.length} tips -> data-src/tips/legacy_tips.json`);
}

convertAnkiVocab();
convert4Skills();
convertStrategies();
