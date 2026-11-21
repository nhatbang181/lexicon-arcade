#!/usr/bin/env node
/**
 * Generator for data-src/writing/batches/t2_01_opinion_adv.json
 * Produces 20 IELTS Academic Writing Task 2 items (w2:001..w2:020)
 * with exact wordCount and verified 0-based note character offsets.
 */
import fs from 'node:fs';
import path from 'node:path';

const PROVENANCE = {
  createdBy: 'llm+review',
  source: 'llm:gemini-4-neon@2026-11-21',
  license: 'own',
  qa: { schema: 'pass', verifier: 'pass', blindSolve: 'na' },
};

const RAW_ITEMS = [
  // =========================================================================
  // w2:001 — opinion — education (compulsory coding in secondary schools)
  // =========================================================================
  {
    id: 'w2:001',
    essayType: 'opinion',
    topic: 'education',
    difficulty: 2,
    prompt:
      'Some educators argue that computer coding should become a compulsory subject for all secondary school students, alongside mathematics and languages. To what extent do you agree or disagree?',
    partsToAddress: [
      'State clearly whether and to what extent you agree or disagree with making coding compulsory',
      'Develop reasons supporting your position with specific explanations and consequences',
      'Address the competing perspective on curriculum breadth and student diversity',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Early exposure to coding cultivates structured problem-solving habits applicable across disciplines.',
        develop:
          'Breaking a complex task into logical steps trains pupils to debug errors systematically, a method that strengthens analytical writing and scientific enquiry alike.',
      },
      {
        side: 'for',
        idea: 'Compulsory instruction narrows socio-economic disparities in digital literacy.',
        develop:
          'When coding is offered only as an after-school club, students from affluent households dominate enrolment, whereas universal classes ensure equal foundational access.',
      },
      {
        side: 'for',
        idea: 'Understanding how software operates prepares citizens to evaluate automated systems critically.',
        develop:
          'Teenagers who grasp basic algorithms are less likely to accept biased online recommendations or opaque data collection practices uncritically.',
      },
      {
        side: 'against',
        idea: 'Mandating full programming courses risks crowding out arts, humanities, and physical education.',
        develop:
          'Because timetable hours are finite, adding another examined core subject often forces schools to trim music, history, or studio art, undermining a well-rounded education.',
      },
      {
        side: 'against',
        idea: 'Many secondary schools lack qualified specialist teachers and up-to-date computing laboratories.',
        develop:
          'In underfunded districts, compelling non-specialist staff to deliver technical syllabuses can produce dry, repetitive lessons that alienate learners from technology.',
      },
      {
        side: 'against',
        idea: 'Rapid advances in automated software generation may render specific coding languages obsolete.',
        develop:
          'Spending years drilling syntax in one language offers limited long-term value compared with teaching broader mathematical reasoning and adaptable communication skills.',
      },
    ],
    text: [
      'Debate over secondary school timetables increasingly centres on whether computer coding warrants the same mandatory status as mathematics and languages. While I agree that introductory computational thinking should be compulsory in the early secondary years, I contend that advanced programming ought to remain an elective rather than a universal requirement.',
      'Integrating basic coding into the lower secondary curriculum delivers clear academic and civic benefits. Learning how to decompose a complex problem into logical sequences fosters analytical rigour that transfers readily to science, economics, and structured writing. Equally important is social equity: when technical instruction is restricted to optional clubs or fee-paying holiday workshops, pupils from lower-income families are disproportionately excluded from rapidly expanding career pathways. Requiring every twelve- to fourteen-year-old to complete foundational modules equips all adolescents with essential digital literacy, enabling them to scrutinise automated tools rather than merely consume them.',
      'Nevertheless, elevating full software development to a compulsory examined subject throughout secondary schooling would prove counterproductive. School timetables are finite, and forcing reluctant learners to master intricate syntax inevitably narrows the curriculum at the expense of literature, visual arts, and practical vocational crafts. Moreover, specialist computing teachers remain scarce in many state systems; where schools in regional districts are obliged to staff mandatory courses without trained educators or reliable hardware, instruction quickly deteriorates into mechanical drills. Given that programming languages evolve swiftly, coercing students with strengths in nursing, carpentry, or music into prolonged technical training misallocates scarce instructional hours.',
      'In conclusion, secondary systems should strike a calibrated balance. Making foundational coding compulsory during initial secondary years secures equitable digital competence, whereas keeping advanced programming optional thereafter preserves the breadth of a well-rounded education.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'While I agree that introductory computational thinking should be compulsory in the early secondary years, I contend that advanced programming ought to remain an elective rather than a universal requirement.',
        criterion: 'TR',
        noteVi: 'Mở bài nêu lập trường có sắc thái (đồng ý một phần có điều kiện) rõ ràng ngay câu luận điểm.',
      },
      {
        quote: 'Equally important is social equity:',
        criterion: 'GRA',
        noteVi: 'Dùng đảo ngữ với tính từ ở đầu mệnh đề kết hợp dấu hai chấm để nhấn mạnh luận điểm công bằng xã hội.',
      },
      {
        quote: 'enabling them to scrutinise automated tools rather than merely consume them.',
        criterion: 'LR',
        noteVi: 'Cặp động từ đối lập chuẩn học thuật "scrutinise ... rather than merely consume" sắc nét, đúng chính tả Anh.',
      },
      {
        quote: 'Nevertheless, elevating full software development to a compulsory examined subject throughout secondary schooling would prove counterproductive.',
        criterion: 'CC',
        noteVi: 'Câu chủ đề chuyển hướng lập luận mượt mà bằng "Nevertheless" và cụm danh động từ tóm gọn ý đối lập.',
      },
      {
        quote: 'narrows the curriculum at the expense of literature, visual arts, and practical vocational crafts.',
        criterion: 'LR',
        noteVi: 'Kết hợp collocation "narrow the curriculum" với cụm "at the expense of" diễn đạt hệ quả đánh đổi chính xác.',
      },
      {
        quote: 'Given that programming languages evolve swiftly, coercing students with strengths in nursing, carpentry, or music into prolonged technical training misallocates scarce instructional hours.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề phân từ nguyên nhân ("Given that...") nối với chủ ngữ danh động từ dài mà vẫn giữ cấu trúc câu chặt chẽ.',
      },
      {
        quote: 'strike a calibrated balance',
        criterion: 'TR',
        noteVi: 'Kết bài tổng hợp lại lập trường cân bằng một cách nhất quán mà không đưa thêm ý mới.',
      },
    ],
    usefulCollocationIds: [
      'col:curriculum_integrate_coding_into_the_curriculum',
      'col:education_a_well_rounded_education',
      'col:skill_transferable_skills',
      'col:literacy_digital_literacy',
      'col:curriculum_narrow_the_curriculum',
    ],
  },

  // =========================================================================
  // w2:002 — opinion — environment (carbon tax on domestic flights)
  // =========================================================================
  {
    id: 'w2:002',
    essayType: 'opinion',
    topic: 'environment',
    difficulty: 3,
    prompt:
      'Governments should impose a substantial carbon tax on domestic flights to discourage short-distance air travel and fund cleaner rail networks. To what extent do you agree or disagree?',
    partsToAddress: [
      'Take a clear position on imposing a carbon tax on domestic aviation',
      'Evaluate how the tax affects passenger choices and clean rail investment',
      'Consider potential drawbacks such as regional isolation or equity for lower-income travellers',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Short-haul flights emit far more carbon per passenger-kilometre than electrified rail.',
        develop:
          'Because aircraft burn a disproportionate share of fuel during take-off and climb, shifting journeys under five hundred kilometres onto trains curbs transport emissions rapidly.',
      },
      {
        side: 'for',
        idea: 'Pricing carbon corrects a market distortion that currently favours aviation over rail.',
        develop:
          'Aviation fuel has long enjoyed tax exemptions in many jurisdictions, leaving budget airfares artificially cheaper than train tickets despite higher environmental costs.',
      },
      {
        side: 'for',
        idea: 'Hypothecated tax receipts can finance high-speed rail upgrades and lower ticket prices.',
        develop:
          'Channelling aviation levies directly into track electrification and modern rolling stock creates a virtuous cycle that makes rail faster and more dependable.',
      },
      {
        side: 'against',
        idea: 'Remote island and mountainous communities often lack any viable rail alternative.',
        develop:
          'Residents travelling from peripheral towns to regional hospitals or universities would face punitive travel bills without a feasible low-carbon substitute.',
      },
      {
        side: 'against',
        idea: 'Flat ticket levies disproportionately burden modest-income households.',
        develop:
          'Whereas wealthy corporate travellers absorb higher fares easily, families visiting distant relatives might be priced out of occasional domestic trips.',
      },
      {
        side: 'against',
        idea: 'Sharply reduced domestic schedules could weaken regional tourism and business links.',
        develop:
          'Smaller airports that rely on short commuter routes might lose commercial viability before rail corridors are completed, slowing local economic activity.',
      },
    ],
    text: [
      'Short-distance aviation accounts for a disproportionately high share of transport emissions, as aircraft consume substantial fuel during take-off and ascent. I largely agree that governments should levy a significant carbon tax on domestic flights to curb avoidable air travel and finance cleaner rail services, provided that remote regions without viable alternatives are protected.',
      'The strongest argument for taxing domestic aviation rests on both environmental pricing and public finance. In many nations, jet fuel remains lightly taxed compared with road petrol or rail electricity, creating a perverse market signal in which a one-hour flight costs less than an equivalent train journey. Imposing a meaningful carbon charge compels airlines and passengers to internalise these ecological costs, encouraging travellers on busy intercity corridors to switch to rail. Crucially, earmarking the revenue for rail modernisation ensures the policy does not merely penalise mobility; instead, it accelerates track electrification, expands seating capacity, and lowers off-peak train fares.',
      'Critics rightly observe that a uniform levy risks penalising citizens in geographically isolated areas, such as archipelago communities or rural basins separated by mountain ranges, where rail construction is prohibitively expensive. Flat surcharges can also fall heavily on low-income households visiting family. Yet these concerns argue for thoughtful design rather than abandonment of the tax. Authorities can exempt essential lifeline routes lacking fast rail connections and structure the levy progressively so that frequent flyers and business-class cabins contribute the largest share, thereby mitigating social inequity without diluting the environmental incentive.',
      'In summary, a well-calibrated carbon tax on domestic flights represents a practical fiscal lever for cutting aviation emissions and upgrading rail infrastructure. When accompanied by targeted exemptions for underserved regions, its environmental and economic gains clearly justify its adoption.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'I largely agree that governments should levy a significant carbon tax on domestic flights to curb avoidable air travel and finance cleaner rail services, provided that remote regions without viable alternatives are protected.',
        criterion: 'TR',
        noteVi: 'Lập trường đồng ý kèm điều kiện rõ ràng ngay cuối mở bài, trả lời trực tiếp cả hai vế của đề.',
      },
      {
        quote: 'creating a perverse market signal in which a one-hour flight costs less than an equivalent train journey.',
        criterion: 'LR',
        noteVi: 'Cụm từ kinh tế học chính xác ("perverse market signal", "internalise these ecological costs") nâng điểm Lexical Resource.',
      },
      {
        quote: 'Crucially, earmarking the revenue for rail modernisation ensures the policy does not merely penalise mobility; instead, it accelerates track electrification, expands seating capacity, and lowers off-peak train fares.',
        criterion: 'CC',
        noteVi: 'Liên kết ý nhân quả chặt chẽ giữa hai vế tương phản bằng dấu chấm phẩy và "instead", kèm cấu trúc song song ba động từ.',
      },
      {
        quote: 'such as archipelago communities or rural basins separated by mountain ranges, where rail construction is prohibitively expensive.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề quan hệ không xác định với "where" kết hợp cụm phân từ quá khứ "separated by..." thể hiện cấu trúc câu đa dạng.',
      },
      {
        quote: 'Yet these concerns argue for thoughtful design rather than abandonment of the tax.',
        criterion: 'CC',
        noteVi: 'Câu bản lề ngắn gọn phản biện lập luận trái chiều và nối tự nhiên sang phần giải pháp thiết kế chính sách.',
      },
      {
        quote: 'thereby mitigating social inequity without diluting the environmental incentive.',
        criterion: 'LR',
        noteVi: 'Dùng "thereby + V-ing" cùng cặp động từ học thuật "mitigating ... without diluting" rất tự nhiên.',
      },
      {
        quote: 'When accompanied by targeted exemptions for underserved regions, its environmental and economic gains clearly justify its adoption.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề trạng ngữ rút gọn ("When accompanied by...") giúp câu kết cô đọng và học thuật.',
      },
    ],
    usefulCollocationIds: [
      'col:emission_curb_carbon_emissions',
      'col:revenue_generate_revenue',
      'col:infrastructure_transport_infrastructure',
      'col:incentive_financial_incentives',
      'col:mitigate_mitigate_environmental_damage',
    ],
  },

  // =========================================================================
  // w2:003 — opinion — technology (banning smartphones in classrooms)
  // =========================================================================
  {
    id: 'w2:003',
    essayType: 'opinion',
    topic: 'technology',
    difficulty: 1,
    prompt:
      'Secondary schools should enforce a complete ban on personal smartphones during classroom lessons. Do you agree or disagree with this view?',
    partsToAddress: [
      'Express a clear stance on banning personal smartphones during lessons',
      'Explain how smartphone presence or absence affects focus, behaviour, and academic results',
      'Address arguments for educational use or parent-student communication',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Even silent notifications fragment teenage concentration during demanding lessons.',
        develop:
          'Glancing repeatedly at incoming messages forces learners to reset their working memory, reducing comprehension of complex explanations in mathematics or literature.',
      },
      {
        side: 'for',
        idea: 'Removing personal devices helps maintain classroom discipline and curbs covert bullying.',
        develop:
          'Without phones on desks, pupils are far less able to record classmates or teachers without consent and share embarrassing clips online.',
      },
      {
        side: 'for',
        idea: 'A uniform ban reduces peer pressure linked to owning expensive handset models.',
        develop:
          'Students from modest backgrounds are spared daily status comparisons when every device remains locked away until the end of lessons.',
      },
      {
        side: 'against',
        idea: 'Smartphones can act as convenient research and polling tools during interactive lessons.',
        develop:
          'Teachers in schools with limited tablet budgets sometimes use mobile quizzes or language dictionaries to check understanding rapidly.',
      },
      {
        side: 'against',
        idea: 'Outright prohibition may miss an opportunity to teach adolescents responsible self-regulation.',
        develop:
          'Opponents contend that young people eventually enter universities and workplaces where they must manage constant notifications independently.',
      },
      {
        side: 'against',
        idea: 'Some parents prefer direct contact with their children for safety or logistical changes.',
        develop:
          'Families juggling shifting work hours argue that quick text updates about after-school collection provide practical reassurance.',
      },
    ],
    text: [
      'Personal smartphones have become ubiquitous among adolescents, prompting intense debate over their place in secondary classrooms. I firmly agree that schools should enforce a complete ban on personal handsets during lessons, as their presence undermines sustained concentration and classroom order while offering no educational benefit that dedicated school equipment cannot deliver better.',
      'The primary justification for prohibition lies in the cognitive cost of constant distraction. Even when switched to silent mode, a phone resting on a desk competes for a teenager\'s attention through vibrating alerts and the habit of checking social feeds. Interruptions lasting only seconds disrupt working memory, making it markedly harder for pupils to follow multi-step proofs or sustained textual analysis. Equally concerning is the social friction phones introduce: covert filming of classmates or staff erodes mutual trust and complicates teachers\' efforts to maintain discipline. Removing devices to secure lockers at the start of lessons restores a calm, focused environment that supports stronger educational outcomes, particularly for students who already struggle with study habits.',
      'Admittedly, opponents argue that allowing phones teaches young people self-regulation and provides convenient access to dictionaries or interactive quizzes. Yet expecting adolescents to resist applications engineered specifically to capture attention is unrealistic during high-stakes instructional time; self-management is more sensibly practised outside lesson hours. Similarly, digital tasks are far better supported by school-owned tablets or laptops that restrict off-task platforms and guarantee identical hardware for every learner. As for urgent family messages, school reception desks have reliably handled emergency contact for decades.',
      'In conclusion, banning personal smartphones during classroom lessons is a proportionate and evidence-backed measure. Far from rejecting digital literacy, it protects the deep attention that meaningful learning requires while leaving technology use to purposeful, school-managed tools.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'I firmly agree that schools should enforce a complete ban on personal handsets during lessons, as their presence undermines sustained concentration and classroom order while offering no educational benefit that dedicated school equipment cannot deliver better.',
        criterion: 'TR',
        noteVi: 'Quan điểm đồng ý hoàn toàn được nêu dứt khoát kèm tóm tắt hai trụ cột lập luận chính.',
      },
      {
        quote: 'The primary justification for prohibition lies in the cognitive cost of constant distraction.',
        criterion: 'CC',
        noteVi: 'Câu chủ đề định hướng rõ trọng tâm đoạn thân bài 1 (chi phí nhận thức của sự xao nhãng) mà không dùng từ nối máy móc.',
      },
      {
        quote: 'covert filming of classmates or staff erodes mutual trust and complicates teachers\' efforts to maintain discipline.',
        criterion: 'LR',
        noteVi: 'Collocation tự nhiên ("erodes mutual trust", "maintain discipline") cùng từ vựng chính xác "covert filming".',
      },
      {
        quote: 'Admittedly, opponents argue that allowing phones teaches young people self-regulation and provides convenient access to dictionaries or interactive quizzes.',
        criterion: 'CC',
        noteVi: 'Dùng "Admittedly" để nhượng bộ có kiểm soát trước khi phản bác từng ý bằng "Yet" và "Similarly".',
      },
      {
        quote: 'expecting adolescents to resist applications engineered specifically to capture attention is unrealistic during high-stakes instructional time;',
        criterion: 'GRA',
        noteVi: 'Chủ ngữ danh động từ kết hợp mệnh đề phân từ bị động rút gọn ("engineered specifically to...") gọn gàng, chính xác.',
      },
      {
        quote: 'Far from rejecting digital literacy, it protects the deep attention that meaningful learning requires',
        criterion: 'GRA',
        noteVi: 'Cấu trúc "Far from + V-ing" ở kết bài giúp bác bỏ hiểu lầm phổ biến một cách thanh lịch.',
      },
      {
        quote: 'proportionate and evidence-backed measure',
        criterion: 'LR',
        noteVi: 'Cụm tính từ ghép học thuật chuẩn xác ("proportionate", "evidence-backed") nâng chất lượng từ vựng kết bài.',
      },
    ],
    usefulCollocationIds: [
      'col:implement_implement_a_ban',
      'col:discipline_maintain_discipline',
      'col:outcome_educational_outcomes',
      'col:enhance_enhance_the_learning_experience',
      'col:technology_over_reliance_on_technology',
    ],
  },

  // =========================================================================
  // w2:004 — opinion — health (sugar levy on soft drinks)
  // =========================================================================
  {
    id: 'w2:004',
    essayType: 'opinion',
    topic: 'health',
    difficulty: 2,
    prompt:
      'Imposing a government levy on sugar-sweetened soft drinks is the most effective way to reduce diet-related illness in the population. To what extent do you agree or disagree?',
    partsToAddress: [
      'Evaluate the claim that a sugar levy is the SINGLE most effective policy',
      'Explain how a beverage tax works on both manufacturers and consumers',
      'Compare the levy with complementary public health strategies',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Tiered sugar levies prompt beverage companies to reformulate recipes swiftly.',
        develop:
          'When higher sugar thresholds attract steeper tax bands, producers lower sucrose content across entire product lines to protect retail margins, cutting population intake automatically.',
      },
      {
        side: 'for',
        idea: 'Higher retail prices discourage impulsive purchases among price-sensitive youths.',
        develop:
          'Teenagers with limited pocket money are especially responsive to price increases at corner shops and vending machines, reducing habitual consumption of sugary sodas.',
      },
      {
        side: 'for',
        idea: 'Revenue collected from the levy can fund preventive health and school sports.',
        develop:
          'Allocating tax proceeds to school kitchens and community exercise facilities multiplies the policy\'s protective effect on childhood obesity.',
      },
      {
        side: 'against',
        idea: 'Liquid sugar represents only one component of an unhealthy modern diet.',
        develop:
          'Consumers who cut back on carbonated drinks may still ingest excessive calories and refined carbohydrates from ultra-processed snacks, confectionery, and fast food.',
      },
      {
        side: 'against',
        idea: 'Taxation alone does not improve access to affordable fresh produce.',
        develop:
          'In low-income neighbourhoods where fresh fruit and vegetables remain costly or scarce, penalising soft drinks without subsidising nutritious food yields modest health gains.',
      },
      {
        side: 'against',
        idea: 'Lasting dietary change requires nutrition education and stricter marketing curbs.',
        develop:
          'Clear front-of-pack warning labels and bans on junk-food advertising aimed at children reshape lifelong eating habits more deeply than a single product tax.',
      },
    ],
    text: [
      'Rising rates of type two diabetes and dental decay have prompted many governments to introduce fiscal levies on sugar-sweetened beverages. While I agree that such taxation is a proven tool for curbing sugar intake, I disagree that it is the single most effective means of reducing diet-related illness across an entire population.',
      'A tiered sugar levy certainly delivers rapid, measurable benefits that voluntary industry pledges rarely achieve. By taxing drinks more heavily above specific gram-per-litre thresholds, authorities give manufacturers a compelling commercial motive to reformulate recipes rather than pass higher prices onto shoppers. Consequently, total sugar consumption drops even among consumers who never alter their purchasing habits. At the same time, noticeable price increases deter habitual purchases among price-sensitive adolescents, while the resulting revenue can be directed towards preventive healthcare and school meal upgrades.',
      'Nevertheless, treating a beverage tax as the paramount solution overlooks the wider nutritional environment driving chronic disease. Soft drinks account for only a fraction of excess calorie intake; ultra-processed snacks, ready meals, and sugary baked goods contribute heavily to obesity yet remain untouched by a narrow drinks levy. Furthermore, taxation merely penalises unhealthy choices without removing the barriers to balanced eating. If fresh vegetables, lean proteins, and clean drinking water remain expensive or inconvenient in deprived districts, families will simply substitute untaxed sweet snacks. Enduring reductions in diet-related illness therefore depend on a comprehensive package combining clear front-of-pack labelling, restrictions on junk-food advertising to minors, subsidies for fresh produce, and practical nutrition education.',
      'In conclusion, a sugar levy on soft drinks is a valuable catalyst for reformulation and reduced consumption, but it is far from sufficient on its own. Safeguarding public health most effectively requires embedding fiscal measures within broader food-system reforms.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'While I agree that such taxation is a proven tool for curbing sugar intake, I disagree that it is the single most effective means of reducing diet-related illness across an entire population.',
        criterion: 'TR',
        noteVi: 'Xử lý chính xác từ khóa so sánh nhất "the most effective" trong đề bài bằng lập trường phản biện sắc bén.',
      },
      {
        quote: 'By taxing drinks more heavily above specific gram-per-litre thresholds, authorities give manufacturers a compelling commercial motive to reformulate recipes',
        criterion: 'LR',
        noteVi: 'Từ vựng chính sách công và dinh dưỡng chính xác ("tiered sugar levy", "gram-per-litre thresholds", "reformulate recipes").',
      },
      {
        quote: 'Consequently, total sugar consumption drops even among consumers who never alter their purchasing habits.',
        criterion: 'CC',
        noteVi: 'Liên từ hệ quả "Consequently" nối trực tiếp cơ chế cải tiến công thức của hãng với tác động ở cấp độ dân số.',
      },
      {
        quote: 'Nevertheless, treating a beverage tax as the paramount solution overlooks the wider nutritional environment driving chronic disease.',
        criterion: 'TR',
        noteVi: 'Chuyển sang thân bài 2 bằng lập luận trực diện vào giới hạn phạm vi của thuế đồ uống có đường.',
      },
      {
        quote: 'If fresh vegetables, lean proteins, and clean drinking water remain expensive or inconvenient in deprived districts, families will simply substitute untaxed sweet snacks.',
        criterion: 'GRA',
        noteVi: 'Câu điều kiện loại 1 kết hợp cụm danh từ đồng đẳng rõ ràng để minh họa hiệu ứng thay thế ngoài ý muốn.',
      },
      {
        quote: 'a comprehensive package combining clear front-of-pack labelling, restrictions on junk-food advertising to minors, subsidies for fresh produce, and practical nutrition education.',
        criterion: 'GRA',
        noteVi: 'Cụm danh từ mở rộng bằng phân từ hiện tại ("combining...") liệt kê bốn giải pháp song song mạch lạc.',
      },
      {
        quote: 'Safeguarding public health most effectively requires embedding fiscal measures within broader food-system reforms.',
        criterion: 'LR',
        noteVi: 'Sử dụng collocation "safeguard public health" kết hợp động từ "embedding ... within" tự nhiên và chuẩn Band 8.',
      },
    ],
    usefulCollocationIds: [
      'col:health_safeguard_public_health',
      'col:obesity_tackle_obesity',
      'col:behaviour_modify_consumer_behaviour',
      'col:nutrition_nutrition_education',
      'col:consumption_curb_consumption',
    ],
  },

  // =========================================================================
  // w2:005 — opinion — urban (car-free historic city centres)
  // =========================================================================
  {
    id: 'w2:005',
    essayType: 'opinion',
    topic: 'urban',
    difficulty: 3,
    prompt:
      'Municipal authorities should permanently ban private cars from historic city centres, even if this causes inconvenience for local commuters and businesses. To what extent do you agree or disagree?',
    partsToAddress: [
      'State clearly your stance on permanently banning private vehicles from historic cores',
      'Discuss environmental, heritage, and liveability benefits of pedestrianisation',
      'Weigh the short-term inconvenience to commuters and merchants and how it can be managed',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Narrow medieval or colonial street grids were never engineered for private motor traffic.',
        develop:
          'Removing cars eliminates severe bottlenecks and protects fragile stone facades from exhaust particulates and heavy vibration.',
      },
      {
        side: 'for',
        idea: 'Pedestrianised centres significantly improve local air quality and street safety.',
        develop:
          'Lower nitrogen dioxide and noise levels transform central squares into welcoming civic spaces for children, older residents, and outdoor dining.',
      },
      {
        side: 'for',
        idea: 'Retail footfall frequently increases once streets become pleasant to walk along.',
        develop:
          'Although shopkeepers initially fear losing motorists, calmer streets encourage pedestrians to linger, browse independent stores, and spend more at cafes.',
      },
      {
        side: 'against',
        idea: 'Suburban commuters face longer journeys when direct driving access is removed.',
        develop:
          'Without park-and-ride hubs and frequent buses on the perimeter, workers from outer suburbs experience frustrating transfers and lost productivity.',
      },
      {
        side: 'against',
        idea: 'Small merchants rely on dependable van access for stock deliveries and waste collection.',
        develop:
          'Strict blanket restrictions can raise logistics costs for independent grocers and restaurants if off-peak freight windows are poorly planned.',
      },
      {
        side: 'against',
        idea: 'Older residents and people with mobility impairments may become isolated.',
        develop:
          'Elderly citizens living in central flats who cannot walk long distances to tram stops need exemptions for electric shuttles or blue-badge vehicles.',
      },
    ],
    text: [
      'Historic city centres were laid out centuries before the private automobile, yet many remain choked by congested lanes and kerbside parking. I strongly agree that municipal authorities should permanently exclude private cars from these districts, as the long-term gains in air quality, heritage preservation, and commercial vitality far outweigh the transitional inconvenience.',
      'Reclaiming central streets from motor traffic directly safeguards both human health and irreplaceable architecture. Vehicle exhaust accelerates the chemical erosion of historic stonework while exposing pedestrians to hazardous fine particulates and persistent noise pollution. Once private cars are removed, councils can allocate urban space to shaded walkways, cycle lanes, and public seating, turning cramped thoroughfares into thriving civic hubs. Contrary to the common fear that banning motorists devastates local trade, pedestrianised quarters often enjoy stronger retail turnover because visitors move at a slower pace and spend more readily in independent shops and street-side cafes.',
      'The objections raised by suburban commuters and shopkeepers deserve practical mitigation rather than capitulation. An abrupt ban imposed without alternative mobility options would understandably frustrate workers from outlying towns and complicate stock deliveries. However, well-planned cities resolve these bottlenecks by constructing peripheral park-and-ride facilities, expanding frequent electric bus loops, and permitting commercial vans to enter during early-morning windows. Equally vital are targeted permits for residents with mobility impairments and emergency vehicles, ensuring that a car-free core remains genuinely accessible to every citizen rather than only the able-bodied.',
      'In conclusion, preserving private car access in narrow historic quarters sacrifices public health and architectural heritage for an inefficient mode of urban travel. Provided councils pair permanent restrictions with reliable public transport and sensible logistics exemptions, car-free centres offer a demonstrably superior model for contemporary cities.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'I strongly agree that municipal authorities should permanently exclude private cars from these districts, as the long-term gains in air quality, heritage preservation, and commercial vitality far outweigh the transitional inconvenience.',
        criterion: 'TR',
        noteVi: 'Khẳng định lập trường dứt khoát và cân nhắc trực tiếp yếu tố "inconvenience" được nêu trong đề bài.',
      },
      {
        quote: 'Vehicle exhaust accelerates the chemical erosion of historic stonework while exposing pedestrians to hazardous fine particulates and persistent noise pollution.',
        criterion: 'LR',
        noteVi: 'Từ vựng chuyên sâu về đô thị và môi trường ("chemical erosion", "fine particulates", "noise pollution") rất chính xác.',
      },
      {
        quote: 'Contrary to the common fear that banning motorists devastates local trade, pedestrianised quarters often enjoy stronger retail turnover',
        criterion: 'CC',
        noteVi: 'Dùng cụm tương phản "Contrary to..." để lật lại giả định phổ biến về tác hại kinh doanh một cách thuyết phục.',
      },
      {
        quote: 'The objections raised by suburban commuters and shopkeepers deserve practical mitigation rather than capitulation.',
        criterion: 'LR',
        noteVi: 'Cặp danh từ trừu tượng đối lập "practical mitigation rather than capitulation" nâng sắc thái nghị luận lên Band 8+.',
      },
      {
        quote: 'Equally vital are targeted permits for residents with mobility impairments and emergency vehicles, ensuring that a car-free core remains genuinely accessible',
        criterion: 'GRA',
        noteVi: 'Đảo ngữ ("Equally vital are...") kết hợp mệnh đề phân từ hệ quả ("ensuring that...") đa dạng hóa cấu trúc ngữ pháp.',
      },
      {
        quote: 'Provided councils pair permanent restrictions with reliable public transport and sensible logistics exemptions,',
        criterion: 'GRA',
        noteVi: 'Mệnh đề điều kiện trang trọng với "Provided..." giúp kết bài chặt chẽ và có chiều sâu thực tiễn.',
      },
      {
        quote: 'allocate urban space to shaded walkways, cycle lanes, and public seating',
        criterion: 'CC',
        noteVi: 'Triển khai cụ thể hóa collocation "allocate urban space" bằng ba ví dụ trực quan, giúp đoạn văn có sức thuyết phục.',
      },
    ],
    usefulCollocationIds: [
      'col:congestion_alleviate_traffic_congestion',
      'col:quality_air_quality',
      'col:heritage_preserve_heritage',
      'col:transport_public_transport',
      'col:allocate_allocate_urban_space',
    ],
  },

  // =========================================================================
  // w2:006 — opinion — work (four-day working week)
  // =========================================================================
  {
    id: 'w2:006',
    essayType: 'opinion',
    topic: 'work',
    difficulty: 4,
    prompt:
      'Employers should transition to a standard four-day working week with no reduction in pay, as shorter hours lead to happier and more productive staff. To what extent do you agree or disagree?',
    partsToAddress: [
      'State to what extent you agree with adopting a four-day week on full pay',
      'Examine how reduced hours affect employee wellbeing, focus, and productivity',
      'Evaluate sectoral constraints where shorter weeks raise staffing or cost pressures',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Rested employees concentrate more deeply and waste less time on low-value tasks.',
        develop:
          'Knowing that weekly output must fit into four days encourages teams to trim redundant meetings and protect uninterrupted blocks for complex problem-solving.',
      },
      {
        side: 'for',
        idea: 'An extra weekday off markedly lowers burnout and costly staff turnover.',
        develop:
          'Workers can handle medical appointments, caregiving, and rest without exhausting annual leave, reducing absenteeism and recruitment expenses for employers.',
      },
      {
        side: 'for',
        idea: 'Shorter commuting schedules yield secondary environmental and household savings.',
        develop:
          'Cutting one weekday of office travel trims transport emissions and lowers weekly childcare or commuting outlays for working families.',
      },
      {
        side: 'against',
        idea: 'Frontline services requiring continuous staffing cannot simply compress hours without hiring more people.',
        develop:
          'Hospital wards, primary schools, and care homes depend on physical presence across fixed shifts, meaning a four-day standard on full pay would inflate wage bills sharply.',
      },
      {
        side: 'against',
        idea: 'Small businesses with tight profit margins may struggle to maintain client coverage.',
        develop:
          'A five-person engineering workshop or local pharmacy cannot easily stagger rotas without delaying orders or losing customers to seven-day competitors.',
      },
      {
        side: 'against',
        idea: 'Compressing five days of workload into four can inadvertently intensify daily stress.',
        develop:
          'Where managers fail to redesign workflows, employees end up working ten-hour stretches that impair cognitive accuracy and strain family evenings.',
      },
    ],
    text: [
      'Growing concern over workplace burnout has led numerous companies to trial a four-day working week while maintaining full salaries. Although I agree that shorter weeks can substantially enhance wellbeing and output in many office-based industries, I disagree that employers across every sector should adopt this model as a universal standard.',
      'In knowledge-intensive fields such as software design, publishing, and financial analysis, productivity is governed by mental sharpness rather than hours spent at a desk. When staff receive a guaranteed third day of rest without financial penalty, work-related stress falls and voluntary resignations decline, saving firms substantial recruitment costs. Moreover, the constraint of a four-day schedule often prompts beneficial organisational discipline: managers eliminate unnecessary meetings, clarify priorities, and automate repetitive reporting so that teams deliver comparable output in fewer hours. Employees also gain time for family care and personal errands, fostering higher morale and sustained engagement.',
      'Applying a one-size-fits-all approach across the wider economy, however, encounters rigid operational limits. Essential services such as emergency wards, public transport, and primary schools cannot compress human presence into thirty-two hours without either reducing service hours or hiring roughly twenty per cent more staff—an expense many public budgets and thin-margin small firms cannot absorb. Even in commercial offices, poorly managed transitions risk backfiring: if workloads remain untouched, employees simply endure exhausting ten-hour shifts that erode the very wellbeing the reform sought to protect.',
      'In conclusion, a full-pay four-day week is a compelling innovation for sectors where output can be decoupled from attendance through smarter workflows. Rather than mandating it universally, policymakers and business leaders should encourage flexible trials alongside alternative arrangements, such as staggered shifts or hybrid schedules, suited to each industry\'s realities.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'Although I agree that shorter weeks can substantially enhance wellbeing and output in many office-based industries, I disagree that employers across every sector should adopt this model as a universal standard.',
        criterion: 'TR',
        noteVi: 'Lập trường phân hóa rõ theo ngành nghề ngay mở bài, thể hiện tư duy sắc sảo thay vì đồng ý/phản đối cực đoan.',
      },
      {
        quote: 'productivity is governed by mental sharpness rather than hours spent at a desk.',
        criterion: 'LR',
        noteVi: 'Diễn đạt tự nhiên, chính xác về bản chất năng suất lao động trí óc ("governed by mental sharpness").',
      },
      {
        quote: 'Moreover, the constraint of a four-day schedule often prompts beneficial organisational discipline:',
        criterion: 'CC',
        noteVi: 'Dùng dấu hai chấm mở ra ba ví dụ cụ thể giải thích trực tiếp cơ chế tăng hiệu suất.',
      },
      {
        quote: 'Applying a one-size-fits-all approach across the wider economy, however, encounters rigid operational limits.',
        criterion: 'CC',
        noteVi: 'Đặt "however" ở giữa câu chủ đề thân bài 2 tạo nhịp chuyển mượt và tự nhiên hơn đặt ở đầu câu.',
      },
      {
        quote: 'without either reducing service hours or hiring roughly twenty per cent more staff',
        criterion: 'GRA',
        noteVi: 'Cấu trúc "without either V-ing or V-ing" chính xác, diễn tả rõ thế lưỡng nan chi phí nhân sự.',
      },
      {
        quote: 'employees simply endure exhausting ten-hour shifts that erode the very wellbeing the reform sought to protect.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề quan hệ rút gọn kép ("the very wellbeing [that] the reform sought to protect") rất tinh tế.',
      },
      {
        quote: 'output can be decoupled from attendance through smarter workflows.',
        criterion: 'LR',
        noteVi: 'Cụm động từ học thuật "decoupled from" diễn đạt ngắn gọn cốt lõi điều kiện thành công của tuần làm việc 4 ngày.',
      },
    ],
    usefulCollocationIds: [
      'col:productivity_boost_productivity',
      'col:well_being_employee_well_being',
      'col:stress_work_related_stress',
      'col:approach_a_one_size_fits_all_approach',
      'col:capacity_operate_at_full_capacity',
    ],
  },

  // =========================================================================
  // w2:007 — opinion — media (public funding for independent journalism)
  // =========================================================================
  {
    id: 'w2:007',
    essayType: 'opinion',
    topic: 'media',
    difficulty: 5,
    prompt:
      'As advertising revenue declines across traditional newspapers, governments should provide direct public funding to sustain independent journalism. To what extent do you agree or disagree?',
    partsToAddress: [
      'Take a clear stance on state financial support for independent news organisations',
      'Explain why the collapse of commercial journalism threatens civic accountability',
      'Address the risk of political interference and how editorial independence can be protected',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Investigative reporting performs a public-interest audit that commercial markets now underfund.',
        develop:
          'Long-term scrutiny of municipal contracts, courts, and environmental breaches requires months of salaried reporting that click-driven online advertising rarely covers.',
      },
      {
        side: 'for',
        idea: 'Sustaining credible local newsrooms helps combat rampant online misinformation.',
        develop:
          'When regional papers shut down, residents turn to unverified social media groups, leaving communities more susceptible to rumours and polarising falsehoods.',
      },
      {
        side: 'for',
        idea: 'Arm\'s-length trusts can disburse subsidies without compromising editorial autonomy.',
        develop:
          'Independent boards allocating grants on transparent circulation or reporting criteria—or citizen voucher schemes—separate funding decisions from cabinet ministers.',
      },
      {
        side: 'against',
        idea: 'Financial dependence on the state creates a structural risk of subtle self-censorship.',
        develop:
          'Editors aware that next year\'s budget rests with ruling politicians may soften critical coverage of government scandals to avoid funding cuts.',
      },
      {
        side: 'against',
        idea: 'Direct subsidies may undermine public trust by making outlets appear partisan.',
        develop:
          'Even if newsrooms remain impartial, sceptical readers may dismiss state-backed reporting as official propaganda, weakening journalism\'s credibility.',
      },
      {
        side: 'against',
        idea: 'Taxpayer funds could prop up inefficient legacy papers unable to adapt to digital habits.',
        develop:
          'Channeling public money to declining print operations may distort competition and crowd out agile subscriber-funded or non-profit digital start-ups.',
      },
    ],
    text: [
      'The migration of advertising budgets to global technology platforms has hollowed out traditional newspapers, leaving many towns without professional reporters. I agree that governments should provide public funding to sustain independent journalism, but only if subsidies are channelled through strict arm\'s-length mechanisms that insulate newsrooms from political pressure.',
      'The case for public intervention rests on the reality that rigorous reporting is a public good whose civic value exceeds its commercial profitability. Uncovering procurement fraud, tracking local court proceedings, or verifying public health claims demands trained journalists and months of patient enquiry—expenses that short-attention online advertising can no longer support. Where regional newspapers fold, civic oversight weakens and communities become far more vulnerable to rampant misinformation circulating unchecked on social networks. Just as societies finance public libraries and universities because markets alone underprovide knowledge, modest public investment in news reporting safeguards informed democratic participation.',
      'Nevertheless, direct grants administered by government ministries carry an undeniable danger: financial dependency can invite undue influence or quiet self-censorship. Should editors fear that probing a minister\'s policy might jeopardise next year\'s subsidy, the core purpose of a free press would be defeated, and public trust would quickly erode. Avoiding this pitfall requires institutional safeguards rather than laissez-faire neglect. Funding can be distributed by an autonomous statutory council governed by multi-year budgets, or via taxpayer journalism vouchers that let individual citizens direct public support to accredited outlets of their choice, thereby keeping politicians entirely removed from editorial selection.',
      'In conclusion, allowing independent journalism to wither under digital market failure poses a serious risk to democratic accountability. Public funding is therefore warranted, provided it operates within a robust, depoliticised framework that protects editorial freedom above all else.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'I agree that governments should provide public funding to sustain independent journalism, but only if subsidies are channelled through strict arm\'s-length mechanisms that insulate newsrooms from political pressure.',
        criterion: 'TR',
        noteVi: 'Lập trường đồng ý có điều kiện rất sắc nét, nêu ngay giải pháp thể chế ("arm\'s-length mechanisms") để giữ độc lập báo chí.',
      },
      {
        quote: 'rigorous reporting is a public good whose civic value exceeds its commercial profitability.',
        criterion: 'LR',
        noteVi: 'Dùng thuật ngữ kinh tế công ("public good", "commercial profitability") cực kỳ trúng chủ đề và học thuật.',
      },
      {
        quote: 'Just as societies finance public libraries and universities because markets alone underprovide knowledge, modest public investment in news reporting safeguards informed democratic participation.',
        criterion: 'GRA',
        noteVi: 'Cấu trúc so sánh tương đồng ("Just as..., ...") làm sáng rõ lý do tài trợ công một cách tự nhiên.',
      },
      {
        quote: 'Should editors fear that probing a minister\'s policy might jeopardise next year\'s subsidy, the core purpose of a free press would be defeated,',
        criterion: 'GRA',
        noteVi: 'Đảo ngữ câu điều kiện loại 1/2 với "Should..." tạo giọng văn trang trọng chuẩn Band 8–9.',
      },
      {
        quote: 'Avoiding this pitfall requires institutional safeguards rather than laissez-faire neglect.',
        criterion: 'CC',
        noteVi: 'Câu chuyển nội đoạn ngắn gọn, kết nối trực tiếp rủi ro can thiệp chính trị với cơ chế phòng ngừa.',
      },
      {
        quote: 'via taxpayer journalism vouchers that let individual citizens direct public support to accredited outlets of their choice,',
        criterion: 'TR',
        noteVi: 'Ví dụ chính sách cụ thể và khả thi (phiếu báo chí do công dân phân bổ) giúp lập luận sâu sắc hơn hẳn các bài chung chung.',
      },
      {
        quote: 'a robust, depoliticised framework that protects editorial freedom above all else.',
        criterion: 'LR',
        noteVi: 'Collocation "a robust framework" kết hợp tính từ học thuật "depoliticised" khép lại bài viết chặt chẽ.',
      },
    ],
    usefulCollocationIds: [
      'col:funding_public_funding',
      'col:misinformation_combat_misinformation',
      'col:undermine_undermine_public_trust',
      'col:influence_undue_influence',
      'col:framework_a_robust_framework',
    ],
  },

  // =========================================================================
  // w2:008 — opinion — transport (free municipal bus networks)
  // =========================================================================
  {
    id: 'w2:008',
    essayType: 'opinion',
    topic: 'transport',
    difficulty: 4,
    prompt:
      'Cities should abolish fares on municipal bus networks and finance the service entirely through local taxation. To what extent do you agree or disagree?',
    partsToAddress: [
      'State clearly whether you agree or disagree with making municipal buses completely free',
      'Assess the social and mobility advantages of abolishing bus fares',
      'Evaluate fiscal trade-offs and whether free fares actually reduce car congestion',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Zero-fare buses immediately relieve living costs for low-income commuters and students.',
        develop:
          'Workers on minimum wages spend a sizeable fraction of disposable income on daily travel, so free transit widens access to jobs, clinics, and evening classes.',
      },
      {
        side: 'for',
        idea: 'Eliminating ticket inspection speeds up boarding and cuts administrative overheads.',
        develop:
          'Passengers can board through all doors simultaneously, trimming dwell times at busy stops while freeing councils from maintaining costly ticketing hardware.',
      },
      {
        side: 'for',
        idea: 'Universal free transit removes stigma and simplifies daily mobility across the city.',
        develop:
          'Tourists, casual riders, and elderly residents no longer navigate confusing zone tariffs, encouraging spontaneous off-peak trips that support local high streets.',
      },
      {
        side: 'against',
        idea: 'Abolishing fares rarely persuades committed motorists to abandon private cars.',
        develop:
          'Car owners prioritise speed, punctuality, and route frequency over a modest bus fare, so free services mostly attract people who previously walked or cycled.',
      },
      {
        side: 'against',
        idea: 'Losing farebox revenue can starve municipal operators of funds needed to upgrade fleets.',
        develop:
          'When local budgets tighten, a fully tax-funded network faces political pressure to cut routes or delay electric bus purchases, degrading service quality.',
      },
      {
        side: 'against',
        idea: 'Targeted fare concessions achieve equity at a much lower fiscal cost.',
        develop:
          'Offering free passes to pensioners, students, and low-income earners while charging affluent commuters preserves capital for dedicated bus lanes and higher frequency.',
      },
    ],
    text: [
      'Several municipalities have experimented with abolishing bus fares in an effort to curb congestion and broaden mobility. While I recognise the social appeal of zero-fare transit, I largely disagree with funding municipal buses entirely through local taxation, because service reliability—not ticket price—is the decisive barrier keeping drivers off public transport.',
      'Proponents rightly highlight the immediate relief free buses bring to financially stretched households. For shift workers and students, daily fares consume a meaningful share of weekly income, and removing them guarantees equitable access to employment and healthcare. Abolishing ticket collection also allows all-door boarding, which trims stop delays and eliminates the expense of maintaining card readers and enforcement staff. In compact towns with light ridership, these administrative savings can offset a noticeable portion of lost ticket revenue.',
      'In larger cities, however, eliminating fares across the board often fails to achieve its primary environmental goal. Most private motorists avoid buses not because a single ticket is unaffordable, but because infrequent schedules, indirect routes, and peak-hour congestion make journeys unpredictable. Consequently, zero-fare schemes tend to divert pedestrians and cyclists onto buses while leaving commuter car traffic largely intact. Worse still, surrendering farebox revenue places heavy strain on municipal tax revenue; during economic downturns, councils may be forced to postpone fleet electrification, trim evening services, or freeze route expansion. Investing public funds instead in dedicated bus lanes, real-time timetable displays, and targeted free passes for low-income citizens, students, and pensioners delivers far greater social and environmental returns.',
      'In conclusion, although free municipal buses carry clear symbolic and equitable value, universal abolition of fares misallocates scarce transport budgets. Cities achieve cleaner streets and fairer mobility more effectively by pairing targeted fare concessions with sustained investment in fast, dependable networks.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'I largely disagree with funding municipal buses entirely through local taxation, because service reliability—not ticket price—is the decisive barrier keeping drivers off public transport.',
        criterion: 'TR',
        noteVi: 'Nêu rõ lập trường phản đối phần lớn và chỉ thẳng nguyên nhân cốt lõi (độ tin cậy dịch vụ quan trọng hơn giá vé).',
      },
      {
        quote: 'Proponents rightly highlight the immediate relief free buses bring to financially stretched households.',
        criterion: 'CC',
        noteVi: 'Thân bài 1 mở đầu bằng sự thừa nhận công bằng ưu điểm của phía ủng hộ trước khi đối chiếu với giới hạn thực tế ở thân bài 2.',
      },
      {
        quote: 'Most private motorists avoid buses not because a single ticket is unaffordable, but because infrequent schedules, indirect routes, and peak-hour congestion make journeys unpredictable.',
        criterion: 'GRA',
        noteVi: 'Cấu trúc "not because..., but because..." phân tích chính xác động cơ hành vi của người đi ô tô.',
      },
      {
        quote: 'Consequently, zero-fare schemes tend to divert pedestrians and cyclists onto buses while leaving commuter car traffic largely intact.',
        criterion: 'LR',
        noteVi: 'Từ vựng giao thông đô thị chuẩn xác ("zero-fare schemes", "divert ... onto", "largely intact").',
      },
      {
        quote: 'Worse still, surrendering farebox revenue places heavy strain on municipal tax revenue;',
        criterion: 'CC',
        noteVi: 'Dùng "Worse still" nâng cấp lập luận từ kém hiệu quả sang rủi ro tài khóa, giữ mạch logic leo thang chặt chẽ.',
      },
      {
        quote: 'Investing public funds instead in dedicated bus lanes, real-time timetable displays, and targeted free passes for low-income citizens, students, and pensioners delivers far greater social and environmental returns.',
        criterion: 'GRA',
        noteVi: 'Chủ ngữ danh động từ mở rộng ("Investing public funds instead in...") đi kèm động từ số ít "delivers" chuẩn xác.',
      },
      {
        quote: 'pairing targeted fare concessions with sustained investment in fast, dependable networks.',
        criterion: 'TR',
        noteVi: 'Kết bài chốt phương án thay thế tối ưu nhất quán với lập luận xuyên suốt bài viết.',
      },
    ],
    usefulCollocationIds: [
      'col:transport_subsidise_public_transport',
      'col:congestion_peak_hour_congestion',
      'col:revenue_tax_revenue',
      'col:infrastructure_upgrade_infrastructure',
      'col:access_equitable_access_to',
    ],
  },

  // =========================================================================
  // w2:009 — opinion — economy (wealth tax on luxury properties)
  // =========================================================================
  {
    id: 'w2:009',
    essayType: 'opinion',
    topic: 'economy',
    difficulty: 6,
    prompt:
      'Introducing an annual wealth tax on high-value luxury properties is a fair and practical method for narrowing economic inequality. To what extent do you agree or disagree?',
    partsToAddress: [
      'Evaluate both the fairness and the practicality of taxing high-value luxury properties',
      'Analyse how property-based wealth taxation affects housing markets and public revenue',
      'Address potential objections regarding liquidity, valuation, and investment deterrence',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Real estate is immobile and visible, making it far harder to shelter offshore than financial capital.',
        develop:
          'Unlike shares or digital assets that can be shifted across jurisdictions overnight, luxury mansions and penthouses remain tied to land registries, ensuring high compliance.',
      },
      {
        side: 'for',
        idea: 'Taxing unearned capital gains in prime real estate promotes fiscal fairness.',
        develop:
          'Luxury home values frequently surge due to public infrastructure and neighbourhood amenities rather than owner effort, so capturing a modest annual share is equitable.',
      },
      {
        side: 'for',
        idea: 'Levies on ultra-high-value dwellings cool speculative demand and fund affordable housing.',
        develop:
          'Discouraging investors from hoarding vacant luxury units eases upward pressure on urban land prices while generating steady revenue for social housing construction.',
      },
      {
        side: 'against',
        idea: 'Asset-rich, cash-poor owners such as retirees may face liquidity hardship.',
        develop:
          'Long-standing residents whose modest homes appreciated steeply over decades might lack the disposable income to pay recurring annual bills based on current market value.',
      },
      {
        side: 'against',
        idea: 'Regular, accurate valuation of unique luxury properties creates administrative friction.',
        develop:
          'Bespoke estates sell infrequently, inviting costly legal disputes and appeals over official assessments that absorb part of the tax yield.',
      },
      {
        side: 'against',
        idea: 'Excessive property levies could deter residential construction and foreign capital.',
        develop:
          'If set too steeply, recurring charges might reduce high-end redevelopment projects that employ skilled tradespeople and contribute stamp duties.',
      },
    ],
    text: [
      'Widening gaps between wage earners and property owners have revived interest in taxing accumulated wealth rather than relying predominantly on income and consumption levies. I largely agree that an annual wealth tax on high-value luxury properties is both fair and practical for narrowing economic inequality, provided sensible liquidity safeguards are built into its design.',
      'From an administrative perspective, luxury real estate overcomes the flaw that has undermined broader wealth taxes: capital flight. Financial portfolios can be restructured across offshore jurisdictions with relative ease, whereas penthouses and landed estates are physically immobile and recorded on public title deeds. Consequently, a progressive annual charge on properties exceeding a high threshold is difficult to evade and yields predictable fiscal revenue. It is equally defensible on grounds of fairness. Much of the appreciation in prime urban housing stems from publicly funded transport, parks, and zoning scarcity rather than productive enterprise; channelling a fraction of those unearned windfalls into affordable housing and state schools directly counteracts intergenerational wealth concentration while discouraging speculative hoarding of vacant luxury units.',
      'Critics nonetheless highlight legitimate practical obstacles. Keeping valuations current for unique high-end homes can trigger costly appeals, and steep rates risk deterring residential investment if calibrated poorly. A more sympathetic concern involves retired homeowners whose family residences have risen sharply in price despite modest pension incomes. Yet modern fiscal policy can resolve these tensions straightforwardly: automated land-registry bands reduce valuation disputes, while deferral clauses allow cash-constrained retirees to settle accrued charges upon the eventual sale or inheritance of the estate rather than forcing premature relocation.',
      'In conclusion, taxing luxury property combines high enforceability with strong redistributive logic. When paired with transparent thresholds and deferral options for older residents, it offers an equitable and workable tool for moderating extreme wealth disparities.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'I largely agree that an annual wealth tax on high-value luxury properties is both fair and practical for narrowing economic inequality, provided sensible liquidity safeguards are built into its design.',
        criterion: 'TR',
        noteVi: 'Trả lời trực diện cả hai tiêu chí "fair" và "practical" của đề bài, đồng thời đặt điều kiện thanh khoản rất thực tế.',
      },
      {
        quote: 'From an administrative perspective, luxury real estate overcomes the flaw that has undermined broader wealth taxes: capital flight.',
        criterion: 'CC',
        noteVi: 'Định khung góc nhìn hành chính ngay đầu đoạn và dùng dấu hai chấm tạo điểm nhấn thuyết phục cho cụm "capital flight".',
      },
      {
        quote: 'whereas penthouses and landed estates are physically immobile and recorded on public title deeds.',
        criterion: 'LR',
        noteVi: 'Từ vựng kinh tế - pháp lý chính xác ("offshore jurisdictions", "landed estates", "public title deeds", "unearned windfalls").',
      },
      {
        quote: 'channelling a fraction of those unearned windfalls into affordable housing and state schools directly counteracts intergenerational wealth concentration',
        criterion: 'GRA',
        noteVi: 'Cụm danh động từ làm chủ ngữ đi kèm hai động từ tác động ("counteracts ... while discouraging") mượt mà, chặt chẽ.',
      },
      {
        quote: 'A more sympathetic concern involves retired homeowners whose family residences have risen sharply in price despite modest pension incomes.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề quan hệ sở hữu "whose..." kết hợp cụm nhượng bộ "despite..." diễn tả sắc thái đối tượng bị ảnh hưởng chính xác.',
      },
      {
        quote: 'deferral clauses allow cash-constrained retirees to settle accrued charges upon the eventual sale or inheritance of the estate',
        criterion: 'LR',
        noteVi: 'Thuật ngữ tài khóa nâng cao ("deferral clauses", "cash-constrained", "accrued charges") thể hiện vốn từ Band 8–9.',
      },
      {
        quote: 'combines high enforceability with strong redistributive logic.',
        criterion: 'TR',
        noteVi: 'Kết bài tổng kết gọn hai tiêu chí "practical" (enforceability) và "fair" (redistributive logic) theo đúng yêu cầu đề.',
      },
    ],
    usefulCollocationIds: [
      'col:inequality_narrow_inequality',
      'col:policy_fiscal_policy',
      'col:housing_affordable_housing',
      'col:raise_raise_revenue',
      'col:investment_deter_investment',
    ],
  },

  // =========================================================================
  // w2:010 — opinion — government (mandatory voting in national elections)
  // =========================================================================
  {
    id: 'w2:010',
    essayType: 'opinion',
    topic: 'government',
    difficulty: 5,
    prompt:
      'Voting in national elections should be legally compulsory for all eligible citizens, with modest fines imposed on those who fail to participate. To what extent do you agree or disagree?',
    partsToAddress: [
      'Present a clear view on legally mandating voter turnout with modest fines',
      'Analyse how compulsory voting affects representation, policy priorities, and legitimacy',
      'Examine civil-liberty concerns and the risk of uninformed ballot casting',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Universal turnout ensures governments serve the whole electorate rather than only vocal blocs.',
        develop:
          'When voting is voluntary, younger and lower-income citizens turn out at lower rates, prompting parties to tailor policies disproportionately towards wealthier older voters.',
      },
      {
        side: 'for',
        idea: 'Compulsory participation dampens political polarisation by rewarding centrist persuasion.',
        develop:
          'Rather than spending vast sums mobilising extreme partisan bases, candidates must appeal to moderate, undecided citizens to win a majority.',
      },
      {
        side: 'for',
        idea: 'Treating voting as a civic duty comparable to jury service strengthens democratic legitimacy.',
        develop:
          'High participation gives elected parliaments a clear mandate to enact long-term reforms on healthcare or infrastructure.',
      },
      {
        side: 'against',
        idea: 'Forcing citizens to the polls infringes upon the freedom to abstain as a form of protest.',
        develop:
          'In a liberal democracy, the right to vote logically encompasses the right to withhold consent when no candidate represents one\'s principles.',
      },
      {
        side: 'against',
        idea: 'Reluctant voters may cast random or poorly informed ballots merely to avoid a penalty.',
        develop:
          'Citizens who follow public affairs minimally might tick the top name on the paper, introducing arbitrary noise into close constituencies.',
      },
      {
        side: 'against',
        idea: 'Modest fines can still fall unfairly on citizens facing work shifts, illness, or administrative errors.',
        develop:
          'Even small penalties burden casual workers or homeless residents unless registration is automatic and weekend or postal voting is widely available.',
      },
    ],
    text: [
      'Declining voter turnout in many established democracies has renewed debate over whether casting a ballot should be treated as a legal obligation rather than a voluntary privilege. I largely agree that compulsory voting backed by modest fines strengthens democratic representation, provided citizens retain the option to submit a blank or formal abstention ballot.',
      'The chief merit of mandatory participation lies in correcting the socio-economic skew inherent in voluntary elections. Where attendance is optional, older, wealthier, and more highly educated residents vote in far higher proportions than young adults or low-wage workers. Rational political parties respond by concentrating manifesto promises on the groups most likely to reach the polling station, leaving housing affordability, youth employment, and entry-level wages underprioritised. Requiring universal attendance shifts electoral incentives: candidates can no longer rely solely on inflaming partisan minorities and must instead formulate policies capable of attracting broad consensus across every demographic.',
      'Opponents reasonably contend that compelling reluctant citizens to vote curtails personal liberty and increases the share of uninformed ballots. Forcing someone who distrusts every party to endorse a candidate would indeed compromise freedom of conscience. Yet this objection is readily addressed by distinguishing compulsory attendance from compulsory endorsement: if ballot papers include a recognised "none of the above" box and voting takes place on weekends with accessible postal options, citizens remain free to register principled dissent without facing unfair logistical hurdles. Moreover, empirical experience in countries with mandatory turnout indicates that knowing one must participate encourages citizens to pay closer attention to civic affairs rather than disengaging permanently.',
      'In conclusion, legally mandatory voting—when paired with effortless access and an explicit abstention choice—reinforces civic responsibility and produces governments accountable to the entire public. Rather than eroding liberty, a light-touch obligation protects the equal voice on which democracy depends.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'I largely agree that compulsory voting backed by modest fines strengthens democratic representation, provided citizens retain the option to submit a blank or formal abstention ballot.',
        criterion: 'TR',
        noteVi: 'Lập trường đồng ý kèm cơ chế bảo vệ quyền tự do biểu đạt ("formal abstention ballot") ngay trong câu luận điểm.',
      },
      {
        quote: 'correcting the socio-economic skew inherent in voluntary elections.',
        criterion: 'LR',
        noteVi: 'Cụm danh từ học thuật súc tích ("socio-economic skew inherent in...") tóm gọn vấn đề bất bình đẳng cử tri.',
      },
      {
        quote: 'candidates can no longer rely solely on inflaming partisan minorities and must instead formulate policies capable of attracting broad consensus across every demographic.',
        criterion: 'LR',
        noteVi: 'Kết hợp collocation "formulate policies" và "broad consensus" tự nhiên, đối lập sắc bén với "inflaming partisan minorities".',
      },
      {
        quote: 'Forcing someone who distrusts every party to endorse a candidate would indeed compromise freedom of conscience.',
        criterion: 'CC',
        noteVi: 'Nhượng bộ thực chất bằng trạng từ nhấn mạnh "indeed" trước khi tách bạch khái niệm ở câu kế tiếp.',
      },
      {
        quote: 'distinguishing compulsory attendance from compulsory endorsement:',
        criterion: 'TR',
        noteVi: 'Phân biệt khái niệm rất sắc (bắt buộc đi bầu vs. bắt buộc chọn ứng viên), hóa giải trực tiếp lập luận phản đối về tự do.',
      },
      {
        quote: 'knowing one must participate encourages citizens to pay closer attention to civic affairs rather than disengaging permanently.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề danh động từ lồng ghép ("knowing one must participate") làm chủ ngữ giúp câu mạch lạc, giàu học thuật.',
      },
      {
        quote: 'protects the equal voice on which democracy depends.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề quan hệ trang trọng với giới từ đứng trước đại từ ("on which democracy depends") kết bài ấn tượng.',
      },
    ],
    usefulCollocationIds: [
      'col:responsibility_civic_responsibility',
      'col:policy_formulate_a_policy',
      'col:legislation_enforce_legislation',
      'col:consensus_broad_consensus',
      'col:undermine_undermine_public_trust',
    ],
  },
];

RAW_ITEMS.push(
  // =========================================================================
  // w2:011 — adv_disadv — technology (algorithmic hiring in large firms)
  // =========================================================================
  {
    id: 'w2:011',
    essayType: 'adv_disadv',
    topic: 'technology',
    difficulty: 5,
    prompt:
      'Many large corporations now rely on automated algorithms to screen job applications and shortlist candidates. Do the advantages of this practice outweigh the disadvantages?',
    partsToAddress: [
      'Examine the operational advantages of algorithmic screening for large employers',
      'Analyse the ethical, fairness, and accuracy disadvantages for applicants and firms',
      'Reach a clear judgement on whether the benefits outweigh the drawbacks',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Automated tools process thousands of applications within minutes, lowering recruitment overheads.',
        develop:
          'When a multinational receives five thousand submissions for an entry-level vacancy, software filters basic qualification criteria far faster than human recruiters.',
      },
      {
        side: 'for',
        idea: 'Standardised scoring can reduce fatigue-driven inconsistency among human reviewers.',
        develop:
          'Unlike overworked hiring panels whose attention wanes late in the afternoon, an algorithm applies identical threshold rules to the first and last curriculum vitae.',
      },
      {
        side: 'for',
        idea: 'Structured skill matching can widen pools beyond prestigious university names.',
        develop:
          'When tuned to verify portfolio tasks and technical certifications, screening systems can surface capable self-taught applicants whom traditional recruiters might overlook.',
      },
      {
        side: 'against',
        idea: 'Models trained on historical hiring records frequently reproduce entrenched demographic bias.',
        develop:
          'If past promotions favoured a particular gender or educational background, machine-learning filters inadvertently penalise qualified candidates from underrepresented groups.',
      },
      {
        side: 'against',
        idea: 'Keyword-based filtering rewards cynical optimisation rather than genuine capability.',
        develop:
          'Candidates who stuff applications with software-friendly jargon advance ahead of skilled problem-solvers who describe unconventional career paths in plain language.',
      },
      {
        side: 'against',
        idea: 'Opaque rejection decisions erode applicant trust and expose firms to legal risk.',
        develop:
          'Because proprietary models rarely explain why an individual was excluded, rejected jobseekers have no meaningful recourse to challenge flawed assessments.',
      },
    ],
    text: [
      'Facing thousands of online applications for every advertised vacancy, major corporations increasingly deploy automated algorithms to filter curricula vitae and rank prospective hires. Although algorithmic recruitment delivers undeniable gains in speed and administrative efficiency, I believe its disadvantages currently outweigh its advantages whenever opaque systems operate without rigorous human oversight.',
      'The operational appeal of automated screening is easy to appreciate. Manually reviewing massive applicant pools is labour-intensive, costly, and vulnerable to recruiter fatigue, which often causes strong submissions read late in the day to be skimmed superficially. Well-designed software can verify mandatory credentials, schedule assessments, and apply uniform baseline criteria within seconds, freeing human-resources specialists to spend more time conducting substantive interviews. In principle, anonymised skill scoring can also curb conscious prejudice by concealing names, ages, and prestigious institutional labels during initial shortlisting.',
      'In practice, however, algorithmic hiring introduces an inherent drawback that undermines both fairness and talent quality. Predictive models trained on historical employment records routinely inherit and scale past inequalities: if a firm\'s earlier senior hires came predominantly from one demographic group or narrow career trajectory, the system learns to penalise career breaks, non-traditional degrees, and underrepresented applicants. Equally troubling is the opacity of proprietary scoring tools, which pose serious ethical questions when rejected candidates receive no explanation and cannot contest factual errors. Furthermore, reliance on rigid keyword matching encourages cynical formatting tricks while filtering out adaptable thinkers whose experience does not fit narrow templates.',
      'In conclusion, while automation can usefully assist with logistical sorting, handing decisive shortlisting authority to unaudited algorithms risks institutionalising bias and forfeiting genuine talent. Until independent audits and transparent appeal rights become standard within a binding regulatory framework, the drawbacks of algorithmic hiring outweigh its efficiency gains.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'Although algorithmic recruitment delivers undeniable gains in speed and administrative efficiency, I believe its disadvantages currently outweigh its advantages whenever opaque systems operate without rigorous human oversight.',
        criterion: 'TR',
        noteVi: 'Trả lời trực tiếp câu hỏi "outweigh" ngay câu luận điểm với điều kiện cụ thể ("opaque systems ... without rigorous human oversight").',
      },
      {
        quote: 'vulnerable to recruiter fatigue, which often causes strong submissions read late in the day to be skimmed superficially.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề quan hệ không xác định kết hợp cụm phân từ quá khứ rút gọn ("read late in the day") và bị động nguyên mẫu ("to be skimmed").',
      },
      {
        quote: 'In practice, however, algorithmic hiring introduces an inherent drawback that undermines both fairness and talent quality.',
        criterion: 'CC',
        noteVi: 'Tương phản khéo léo giữa "In principle" (cuối đoạn 2) và "In practice, however" (đầu đoạn 3), tạo liên kết xuyên đoạn xuất sắc.',
      },
      {
        quote: 'Predictive models trained on historical employment records routinely inherit and scale past inequalities:',
        criterion: 'LR',
        noteVi: 'Cụm động từ chính xác cho chủ đề AI ("inherit and scale past inequalities", "proprietary scoring tools").',
      },
      {
        quote: 'Equally troubling is the opacity of proprietary scoring tools, which pose serious ethical questions when rejected candidates receive no explanation',
        criterion: 'GRA',
        noteVi: 'Đảo ngữ với tính từ ("Equally troubling is...") kết hợp collocation "pose serious ethical questions" rất tự nhiên.',
      },
      {
        quote: 'filtering out adaptable thinkers whose experience does not fit narrow templates.',
        criterion: 'LR',
        noteVi: 'Diễn đạt sắc nét về hạn chế của lọc từ khóa ("cynical formatting tricks", "narrow templates").',
      },
      {
        quote: 'Until independent audits and transparent appeal rights become standard within a binding regulatory framework, the drawbacks of algorithmic hiring outweigh its efficiency gains.',
        criterion: 'TR',
        noteVi: 'Kết bài chốt lại phán quyết rõ ràng, nhất quán tuyệt đối với mở bài và toàn bộ phân tích ở thân bài.',
      },
    ],
    usefulCollocationIds: [
      'col:efficiency_enhance_efficiency',
      'col:pose_pose_ethical_questions',
      'col:drawback_an_inherent_drawback',
      'col:opportunity_equal_opportunities',
      'col:framework_a_regulatory_framework',
    ],
  },

  // =========================================================================
  // w2:012 — adv_disadv — work (permanent remote work for office staff)
  // =========================================================================
  {
    id: 'w2:012',
    essayType: 'adv_disadv',
    topic: 'work',
    difficulty: 2,
    prompt:
      'An increasing number of organisations now allow office employees to work remotely on a permanent basis rather than commuting to a central workplace. Do the advantages of this shift outweigh the disadvantages?',
    partsToAddress: [
      'Analyse the personal, organisational, and urban advantages of permanent remote work',
      'Examine drawbacks such as social isolation, weaker mentoring, and blurred boundaries',
      'State a clear overall evaluation of whether benefits exceed drawbacks',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Eliminating daily commutes reclaims substantial time and lowers household living costs.',
        develop:
          'Employees save up to two hours each weekday previously lost to congested trains or motorways, reducing travel bills and freeing energy for exercise and family life.',
      },
      {
        side: 'for',
        idea: 'Location-independent roles widen talent pools and revitalise regional towns.',
        develop:
          'Firms can recruit specialists regardless of postcode, while workers no longer need to pay inflated metropolitan rents, channelling spending into smaller communities.',
      },
      {
        side: 'for',
        idea: 'Quieter home workspaces often boost individual focus on analytical tasks.',
        develop:
          'Without the constant chatter of open-plan offices, staff writing code, reports, or financial models complete deep work more efficiently.',
      },
      {
        side: 'against',
        idea: 'Permanent remoteness can weaken informal mentoring and stall junior staff development.',
        develop:
          'Recent graduates lose the chance to observe senior colleagues handle negotiations or ask quick clarifying questions across a desk, slowing professional growth.',
      },
      {
        side: 'against',
        idea: 'Prolonged solitary work risks eroding team cohesion and employee mental health.',
        develop:
          'Employees living alone in small flats may experience chronic isolation and feel disconnected from organisational culture when every interaction becomes a scheduled video call.',
      },
      {
        side: 'against',
        idea: 'Working from home frequently blurs the boundary between paid hours and personal rest.',
        develop:
          'Without a physical departure from an office, conscientious workers often answer evening messages, increasing fatigue and strain on domestic relationships.',
      },
    ],
    text: [
      'Advances in cloud software and video conferencing have enabled many firms to replace mandatory office attendance with permanent remote contracts. While full-time home working presents genuine hurdles for team cohesion and junior mentoring, I consider that its overall advantages outweigh its disadvantages for both employees and wider society.',
      'The most tangible gains stem from the abolition of the daily commute and the geographic freedom remote work unlocks. Reclaiming one to two hours every weekday lowers commuting expenses, relieves work-related stress, and gives parents and carers greater flexibility to balance domestic obligations with professional duties. For employers, removing postcode restrictions broadens recruitment beyond expensive capital cities while trimming commercial real-estate overheads. At a wider civic level, fewer peak-hour commuters ease pressure on strained transport networks and allow professionals to relocate to more affordable regional towns, dispersing economic activity beyond overcrowded metropolitan cores.',
      'Nevertheless, permanent remoteness carries notable drawbacks that organisations cannot afford to ignore. Spontaneous collaboration—the brief corridor conversations that spark creative solutions—rarely translates seamlessly into scheduled video calls. Newly hired graduates feel this loss most acutely, as they miss the informal observation and rapid feedback through which workplace judgement is ordinarily absorbed. In addition, employees sharing cramped flats or living alone risk persistent loneliness and an "always-on" culture in which professional messages intrude well into the evening. Yet these liabilities are largely manageable through deliberate management practices: clear disconnection policies, dedicated home-office stipends, structured mentoring pairs, and quarterly in-person retreats can preserve cultural cohesion without restoring wasteful daily commutes.',
      'In conclusion, permanent remote work does require more intentional leadership to safeguard collaboration and mental wellbeing. Provided companies invest in those human routines, its substantial gains in time, affordability, and labour-market inclusion clearly outweigh its limitations.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'While full-time home working presents genuine hurdles for team cohesion and junior mentoring, I consider that its overall advantages outweigh its disadvantages for both employees and wider society.',
        criterion: 'TR',
        noteVi: 'Nêu rõ lập trường đánh giá lợi ích lớn hơn bất lợi ngay mở bài, đồng thời báo trước hai mặt phân tích ở thân bài.',
      },
      {
        quote: 'At a wider civic level, fewer peak-hour commuters ease pressure on strained transport networks and allow professionals to relocate to more affordable regional towns, dispersing economic activity beyond overcrowded metropolitan cores.',
        criterion: 'GRA',
        noteVi: 'Mở rộng góc nhìn từ cá nhân, doanh nghiệp lên cấp độ đô thị với cụm phân từ kết quả ("dispersing economic activity...").',
      },
      {
        quote: 'Spontaneous collaboration—the brief corridor conversations that spark creative solutions—rarely translates seamlessly into scheduled video calls.',
        criterion: 'LR',
        noteVi: 'Giải thích trực quan khái niệm "spontaneous collaboration" bằng cụm đồng vị cụ thể và động từ "translates seamlessly into".',
      },
      {
        quote: 'as they miss the informal observation and rapid feedback through which workplace judgement is ordinarily absorbed.',
        criterion: 'GRA',
        noteVi: 'Cấu trúc "through which + bị động" diễn đạt chính xác cơ chế học hỏi phi chính thức nơi công sở.',
      },
      {
        quote: 'Yet these liabilities are largely manageable through deliberate management practices:',
        criterion: 'CC',
        noteVi: 'Câu bản lề cân bằng lại nhược điểm bằng nhóm giải pháp thực tế, giữ mạch lập luận đồng nhất với kết luận "outweigh".',
      },
      {
        quote: 'clear disconnection policies, dedicated home-office stipends, structured mentoring pairs, and quarterly in-person retreats',
        criterion: 'TR',
        noteVi: 'Bốn biện pháp quản trị cụ thể giúp lập luận không bị chung chung, chứng minh các bất lợi hoàn toàn có thể khắc phục.',
      },
      {
        quote: 'its substantial gains in time, affordability, and labour-market inclusion clearly outweigh its limitations.',
        criterion: 'LR',
        noteVi: 'Tổng kết bằng ba danh từ trừu tượng đắt giá ("affordability", "labour-market inclusion") đúng chuẩn văn phong học thuật.',
      },
    ],
    usefulCollocationIds: [
      'col:productivity_boost_productivity',
      'col:stress_alleviate_stress',
      'col:enhance_enhance_collaboration',
      'col:alleviate_alleviate_loneliness',
      'col:well_being_employee_well_being',
    ],
  },

  // =========================================================================
  // w2:013 — adv_disadv — education (modular online university degrees)
  // =========================================================================
  {
    id: 'w2:013',
    essayType: 'adv_disadv',
    topic: 'education',
    difficulty: 3,
    prompt:
      'Many universities are replacing traditional multi-year campus programmes with flexible, modular online degrees that students can complete at their own pace. Do the advantages of this trend outweigh the disadvantages?',
    partsToAddress: [
      'Discuss how modular online degrees expand access, affordability, and lifelong learning',
      'Evaluate what is lost if traditional campus programmes are replaced outright',
      'Deliver a balanced verdict on whether the advantages outweigh the disadvantages',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Self-paced modular degrees widen access to tertiary education for working adults and carers.',
        develop:
          'Learners who cannot pause full-time employment or relocate to a university town can accumulate recognised credits incrementally as their schedule allows.',
      },
      {
        side: 'for',
        idea: 'Online delivery sharply reduces tuition, accommodation, and relocation expenses.',
        develop:
          'By removing student-hall rents and commuting costs, digital degrees prevent many first-generation graduates from entering adulthood burdened by heavy debt.',
      },
      {
        side: 'for',
        idea: 'Stackable modules allow syllabuses to be updated quickly alongside shifting industries.',
        develop:
          'Mid-career professionals can enrol in targeted data-ethics or clean-energy units without committing to an inflexible three-year residential timetable.',
      },
      {
        side: 'against',
        idea: 'Fully online study removes the face-to-face community that nurtures interpersonal skills.',
        develop:
          'Late-night seminar debates, student societies, and shared studio projects teach persuasion, empathy, and teamwork far more richly than asynchronous discussion boards.',
      },
      {
        side: 'against',
        idea: 'Self-paced formats suffer from lower completion rates due to heavy demands on self-discipline.',
        develop:
          'Without fixed lecture routines and visible peer momentum, students facing work stress or domestic disruption frequently defer modules indefinitely.',
      },
      {
        side: 'against',
        idea: 'Practical disciplines and rigorous assessment are difficult to replicate remotely.',
        develop:
          'Chemistry laboratories, clinical placements, and supervised examinations cannot be fully digitised without risking diluted academic standards or undetected misconduct.',
      },
    ],
    text: [
      'Higher education institutions are increasingly unbundling three-year campus degrees into flexible, modular online qualifications that learners can pace around work and family commitments. While digital modular courses offer valuable flexibility when offered alongside conventional study, I believe the disadvantages outweigh the advantages if universities replace residential campus programmes altogether.',
      'The strengths of modular online degrees lie primarily in widening access to tertiary education. For mid-career adults seeking to retrain, parents with caregiving responsibilities, or residents of rural towns far from major campuses, studying one credit-bearing unit at a time removes formidable financial and geographical barriers. Eliminating relocation and accommodation costs also curbs graduate debt, while modular design allows institutions to refresh technical units rapidly so that curricula remain aligned with evolving workplace standards. As a complementary route for lifelong learning, this format is undeniably progressive.',
      'Replacing traditional campus programmes wholesale, however, would forfeit essential dimensions of university education that screen-based modules cannot replicate. First, self-paced online pathways place an immense burden on individual self-discipline; without regular in-person seminars, structured cohorts, and immediate faculty check-ins, dropout rates tend to climb sharply, particularly among younger or less confident learners. Second, higher education is more than content transfer. Laboratory experimentation, clinical workshops, and spontaneous intellectual debate across diverse student societies cultivate interpersonal skills, critical challenge, and enduring professional networks. Finally, remote assessment remains vulnerable to identity fraud and automated essay generation, potentially eroding employer confidence in rigorous academic standards.',
      'In conclusion, modular online degrees excel as an accessible supplement for working learners and specialist reskilling. Nonetheless, because wholesale replacement of campus study compromises completion rates, practical training, and intellectual community, the drawbacks of abandoning residential programmes outweigh the gains.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'While digital modular courses offer valuable flexibility when offered alongside conventional study, I believe the disadvantages outweigh the advantages if universities replace residential campus programmes altogether.',
        criterion: 'TR',
        noteVi: 'Bắt rất sát động từ "replacing" trong đề bài để đưa ra phán quyết tinh tế: hữu ích khi bổ sung, bất lợi vượt trội nếu thay thế hoàn toàn.',
      },
      {
        quote: 'unbundling three-year campus degrees into flexible, modular online qualifications',
        criterion: 'LR',
        noteVi: 'Động từ học thuật hiện đại "unbundling" diễn tả chính xác xu hướng chia nhỏ bằng cấp thành các học phần độc lập.',
      },
      {
        quote: 'studying one credit-bearing unit at a time removes formidable financial and geographical barriers.',
        criterion: 'LR',
        noteVi: 'Cụm từ chuyên ngành giáo dục đại học ("credit-bearing unit", "formidable ... barriers", "graduate debt") chuẩn xác.',
      },
      {
        quote: 'Replacing traditional campus programmes wholesale, however, would forfeit essential dimensions of university education that screen-based modules cannot replicate.',
        criterion: 'CC',
        noteVi: 'Chuyển đoạn chặt chẽ bằng "however" chen giữa và nhấn mạnh chữ "wholesale" khớp hoàn toàn với luận điểm mở bài.',
      },
      {
        quote: 'without regular in-person seminars, structured cohorts, and immediate faculty check-ins, dropout rates tend to climb sharply,',
        criterion: 'GRA',
        noteVi: 'Cụm giới từ điều kiện phủ định ("without...") liệt kê ba yếu tố song song dẫn tới hệ quả rõ ràng.',
      },
      {
        quote: 'higher education is more than content transfer.',
        criterion: 'CC',
        noteVi: 'Câu đơn ngắn gọn tạo nhịp nhấn sắc sảo trước câu giải thích mở rộng về kỹ năng giao tiếp và môi trường học thuật.',
      },
      {
        quote: 'potentially eroding employer confidence in rigorous academic standards.',
        criterion: 'GRA',
        noteVi: 'Cụm phân từ hiện tại kết hợp trạng từ hedging ("potentially eroding...") tránh khẳng định cực đoan.',
      },
    ],
    usefulCollocationIds: [
      'col:access_widen_access_to',
      'col:education_tertiary_education',
      'col:discipline_self_discipline',
      'col:skill_interpersonal_skills',
      'col:standard_rigorous_standards',
    ],
  },

  // =========================================================================
  // w2:014 — adv_disadv — urban (high-rise mixed-use neighbourhoods)
  // =========================================================================
  {
    id: 'w2:014',
    essayType: 'adv_disadv',
    topic: 'urban',
    difficulty: 4,
    prompt:
      'In response to urban population growth, many cities are constructing high-rise mixed-use neighbourhoods that combine apartments, offices, and shops within the same blocks. What are the advantages and disadvantages of this approach to urban planning?',
    partsToAddress: [
      'Explain the principal planning, environmental, and social advantages of high-rise mixed-use blocks',
      'Identify the major liveability, infrastructure, and affordability disadvantages',
      'Conclude with a concise synthesis of both sides',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Concentrating homes, workplaces, and shops curbs urban sprawl and preserves green belts.',
        develop:
          'Building vertically on brownfield sites accommodates growing populations without paving over surrounding farmland and wildlife corridors.',
      },
      {
        side: 'for',
        idea: 'Mixed-use proximity shortens daily trips and supports walkable, low-carbon living.',
        develop:
          'When groceries, clinics, and offices sit downstairs or one tram stop away, residents walk or cycle for routine errands rather than relying on private cars.',
      },
      {
        side: 'for',
        idea: 'Active ground-floor retail creates lively, safer streets throughout the day and evening.',
        develop:
          'Unlike single-use office districts that empty after dusk, blended blocks maintain steady footfall and natural surveillance across varied hours.',
      },
      {
        side: 'against',
        idea: 'Dense vertical towers can strain local utilities, schools, and green space if under-planned.',
        develop:
          'Adding thousands of residents to a compact footprint without expanding water mains, primary school places, and neighbourhood parks degrades everyday liveability.',
      },
      {
        side: 'against',
        idea: 'High-rise living often brings noise, limited daylight, and weaker suitability for larger families.',
        develop:
          'Commercial deliveries, late-night eateries, and shaded courtyards can compromise sleep quality and leave young children with few safe outdoor play areas.',
      },
      {
        side: 'against',
        idea: 'New mixed-use towers carry high construction and service-charge costs that push up rents.',
        develop:
          'Expensive lift maintenance, fire-safety systems, and prime land prices frequently turn vertical regeneration zones into enclaves unaffordable for modest earners.',
      },
    ],
    text: [
      'As metropolitan populations expand, urban planners increasingly favour high-rise mixed-use developments that stack residential flats above offices, clinics, and ground-floor retail. This compact planning model delivers clear environmental and mobility benefits, yet it also poses tangible challenges for infrastructure capacity and everyday liveability.',
      'The foremost advantage of high-rise mixed-use neighbourhoods is land efficiency. Accommodating thousands of residents vertically curbs urban sprawl, shielding surrounding agricultural land and natural habitats from low-density suburban expansion. Equally significant is the shift in daily travel habits: when workplaces, supermarkets, and childcare centres lie within walking distance of apartments, households depend far less on private cars, reducing both commuting time and per-capita carbon emissions. Meanwhile, blending commercial activity with residential life ensures that streets remain populated from morning until evening, fostering local enterprise and enhancing perceived public safety compared with sterile business districts that empty after office hours.',
      'Nevertheless, intense vertical density carries distinct drawbacks whenever design and civic investment lag behind construction. Concentrating large numbers of households within a narrow footprint can rapidly strain existing water networks, sewage lines, primary schools, and public clinics unless councils upgrade infrastructure concurrently. At the building level, living directly above restaurants and delivery bays exposes residents to persistent street noise, odours, and reduced natural sunlight, while tall towers rarely provide the affordable multi-bedroom layouts or private outdoor play space that families with young children value. Furthermore, high engineering standards and recurring lift and facade maintenance fees often inflate rents and service charges, risking the displacement of lower-income communities.',
      'In summary, high-rise mixed-use neighbourhoods offer a powerful blueprint for sustainable urbanisation by shortening journeys and containing sprawl. Their long-term success, however, hinges on pairing vertical housing density with acoustic design, generous pocket parks, upgraded public services, and mandatory affordable units.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'This compact planning model delivers clear environmental and mobility benefits, yet it also poses tangible challenges for infrastructure capacity and everyday liveability.',
        criterion: 'TR',
        noteVi: 'Mở bài bám sát dạng đề "What are the advantages and disadvantages" bằng cách khái quát cân bằng hai mặt ưu - nhược.',
      },
      {
        quote: 'curbs urban sprawl, shielding surrounding agricultural land and natural habitats from low-density suburban expansion.',
        criterion: 'LR',
        noteVi: 'Collocation chuẩn "curbs urban sprawl" kết hợp mệnh đề phân từ "shielding..." mô tả lợi ích môi trường sắc nét.',
      },
      {
        quote: 'compared with sterile business districts that empty after office hours.',
        criterion: 'LR',
        noteVi: 'Tính từ giàu hình ảnh học thuật "sterile business districts" tạo đối lập sống động với khu phức hợp nhộn nhịp.',
      },
      {
        quote: 'unless councils upgrade infrastructure concurrently.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề điều kiện phủ định với "unless" và trạng từ học thuật "concurrently" nêu rõ điều kiện tránh quá tải hạ tầng.',
      },
      {
        quote: 'At the building level, living directly above restaurants and delivery bays exposes residents to persistent street noise, odours, and reduced natural sunlight,',
        criterion: 'CC',
        noteVi: 'Chuyển mạch phân tích mạch lạc từ cấp độ hạ tầng đô thị xuống cấp độ sinh hoạt trong tòa nhà ("At the building level").',
      },
      {
        quote: 'while tall towers rarely provide the affordable multi-bedroom layouts or private outdoor play space that families with young children value.',
        criterion: 'GRA',
        noteVi: 'Cấu trúc đối chiếu bằng "while" kết hợp mệnh đề quan hệ xác định chỉ rõ tác động lên nhóm gia đình có con nhỏ.',
      },
      {
        quote: 'hinges on pairing vertical housing density with acoustic design, generous pocket parks, upgraded public services, and mandatory affordable units.',
        criterion: 'TR',
        noteVi: 'Kết bài tổng hợp cân bằng cả hai mặt và chỉ ra bốn điều kiện quy hoạch thiết yếu để mô hình vận hành bền vững.',
      },
    ],
    usefulCollocationIds: [
      'col:housing_housing_density',
      'col:curb_curb_urban_sprawl',
      'col:infrastructure_strain_infrastructure',
      'col:quality_the_quality_of_life',
      'col:urbanisation_sustainable_urbanisation',
    ],
  },

  // =========================================================================
  // w2:015 — adv_disadv — food (vertical indoor farming in cities)
  // =========================================================================
  {
    id: 'w2:015',
    essayType: 'adv_disadv',
    topic: 'food',
    difficulty: 4,
    prompt:
      'Some cities are investing in vertical indoor farms that grow crops in stacked, climate-controlled layers inside urban buildings. Do the advantages of urban vertical farming outweigh the disadvantages?',
    partsToAddress: [
      'Examine the resource, climate-resilience, and supply-chain benefits of vertical indoor farms',
      'Evaluate economic and ecological drawbacks, especially electricity use and crop limitations',
      'Provide a nuanced judgement on whether the advantages outweigh the disadvantages',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Closed-loop hydroponic and aeroponic systems drastically conserve water and eliminate run-off.',
        develop:
          'Recirculating nutrient mists use a small fraction of the water required by open-field irrigation while preventing chemical pesticides from leaching into rivers.',
      },
      {
        side: 'for',
        idea: 'Year-round indoor cultivation shields urban fresh-produce supply from extreme weather.',
        develop:
          'Droughts, unseasonal frosts, and floods cannot wipe out harvests inside climate-regulated warehouses, stabilising local availability and prices for salads and herbs.',
      },
      {
        side: 'for',
        idea: 'Growing produce close to supermarkets trims refrigerated freight distances and food spoilage.',
        develop:
          'Harvesting greens within the city cuts transit times from days to hours, preserving nutritional freshness and minimising post-harvest waste.',
      },
      {
        side: 'against',
        idea: 'Artificial LED lighting and climate control demand substantial electrical energy.',
        develop:
          'Replacing free sunlight with continuous indoor lighting can actually generate a larger carbon footprint than field farming wherever local power grids still rely on fossil fuels.',
      },
      {
        side: 'against',
        idea: 'Vertical farms are economically viable for only a narrow range of fast-growing crops.',
        develop:
          'Calorie-dense staples such as wheat, rice, maize, and potatoes require too much space and energy indoors, meaning urban towers cannot replace rural agriculture.',
      },
      {
        side: 'against',
        idea: 'High start-up capital and urban real-estate costs make indoor produce expensive.',
        develop:
          'Expensive sensors, racking, and city warehouse leases push retail prices above conventional produce, restricting access primarily to affluent shoppers.',
      },
    ],
    text: [
      'Faced with volatile weather and elongated food supply chains, several municipalities have supported vertical indoor farms that cultivate crops in stacked, climate-controlled towers. In my view, the advantages of urban vertical farming outweigh its disadvantages only when it is deployed selectively for high-value perishable greens powered by renewable energy, rather than treated as a wholesale substitute for conventional agriculture.',
      'Within that focused niche, indoor farming yields impressive ecological and logistical gains. Closed-loop hydroponic systems recycle nutrient water continuously, conserving resources by consuming far less water than open-field irrigation and eliminating agricultural pesticide run-off into local rivers. Because temperature, humidity, and light cycles are regulated year-round, harvests remain insulated from droughts, hailstorms, and heatwaves, bolstering urban food security for delicate crops. Locating production inside repurposed urban warehouses also slashes refrigerated transport distances; leafy vegetables reach neighbourhood grocers within hours of harvest, improving nutritional freshness and minimising spoilage along the supply chain.',
      'Outside that niche, however, severe economic and environmental constraints emerge. Substituting free natural sunlight with intensive artificial lighting and ventilation entails heavy energy consumption; unless electricity comes predominantly from low-carbon sources, the resulting emissions can easily exceed those of imported field-grown produce. Moreover, high capital costs for urban real estate, sensors, and automation keep unit prices elevated, often putting vertically farmed goods beyond the reach of modest-income households. Most fundamentally, vertical structures remain unsuited to calorie-rich staples such as rice, wheat, maize, and pulses, which form the backbone of global human nutrition.',
      'In conclusion, vertical indoor farming is neither a silver bullet for world hunger nor a flawed novelty. When paired with clean electricity and confined to perishable urban greens, its resource and resilience advantages outweigh its limitations—provided policymakers continue investing primarily in sustainable rural farming for staple crops.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'In my view, the advantages of urban vertical farming outweigh its disadvantages only when it is deployed selectively for high-value perishable greens powered by renewable energy, rather than treated as a wholesale substitute for conventional agriculture.',
        criterion: 'TR',
        noteVi: 'Đưa ra đánh giá "outweigh" có điều kiện cực kỳ thuyết phục, phân định rõ phạm vi cây trồng và nguồn điện.',
      },
      {
        quote: 'Closed-loop hydroponic systems recycle nutrient water continuously, conserving resources by consuming far less water than open-field irrigation',
        criterion: 'LR',
        noteVi: 'Từ vựng nông nghiệp đô thị chính xác ("Closed-loop hydroponic systems", "agricultural pesticide run-off", "bolstering urban food security").',
      },
      {
        quote: 'Locating production inside repurposed urban warehouses also slashes refrigerated transport distances; leafy vegetables reach neighbourhood grocers within hours of harvest, improving nutritional freshness and minimising spoilage',
        criterion: 'GRA',
        noteVi: 'Câu ghép tinh tế dùng dấu chấm phẩy và cụm phân từ hiện tại kép ("improving ... and minimising ...") nối nhân quả mượt mà.',
      },
      {
        quote: 'Outside that niche, however, severe economic and environmental constraints emerge.',
        criterion: 'CC',
        noteVi: 'Cụm đối chiếu trực tiếp với "Within that focused niche" ở đầu thân bài 1, tạo bố cục song hành rõ rệt.',
      },
      {
        quote: 'unless electricity comes predominantly from low-carbon sources, the resulting emissions can easily exceed those of imported field-grown produce.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề điều kiện "unless" kết hợp đại từ thay thế "those of..." tránh lặp từ "emissions" chuẩn xác.',
      },
      {
        quote: 'Most fundamentally, vertical structures remain unsuited to calorie-rich staples such as rice, wheat, maize, and pulses, which form the backbone of global human nutrition.',
        criterion: 'TR',
        noteVi: 'Chạm tới giới hạn cốt lõi nhất về an ninh lương thực (không trồng được cây lương thực thiết yếu giàu năng lượng).',
      },
      {
        quote: 'neither a silver bullet for world hunger nor a flawed novelty.',
        criterion: 'LR',
        noteVi: 'Cấu trúc "neither ... nor ..." với cụm từ sắc thái cân bằng giúp kết bài đọng lại ấn tượng học thuật cao.',
      },
    ],
    usefulCollocationIds: [
      'col:security_food_security',
      'col:energy_energy_consumption',
      'col:resource_conserve_resources',
      'col:nutrition_improve_nutrition',
      'col:waste_minimise_waste',
    ],
  },

  // =========================================================================
  // w2:016 — adv_disadv — health (wearable continuous health monitors)
  // =========================================================================
  {
    id: 'w2:016',
    essayType: 'adv_disadv',
    topic: 'health',
    difficulty: 3,
    prompt:
      'Consumer wearable devices capable of continuously tracking heart rate, sleep quality, and blood oxygen levels have become widely available. Do the advantages of continuous personal health monitoring outweigh the disadvantages?',
    partsToAddress: [
      'Analyse the preventive and behavioural benefits of consumer health wearables',
      'Assess risks involving false alarms, health anxiety, and biometric data privacy',
      'State a clear judgement on whether the benefits outweigh the drawbacks',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Continuous biometric tracking can detect silent irregularities before emergencies occur.',
        develop:
          'Alerts for irregular heart rhythms or sudden nocturnal oxygen drops prompt users to seek clinical evaluation early, catching conditions that occasional annual check-ups miss.',
      },
      {
        side: 'for',
        idea: 'Immediate feedback helps individuals cultivate healthier daily exercise and sleep routines.',
        develop:
          'Visualising step totals, resting heart trends, and sleep consistency motivates sedentary adults to sustain gradual lifestyle improvements over months.',
      },
      {
        side: 'for',
        idea: 'Longitudinal home readings enrich consultations and reduce unnecessary clinic visits.',
        develop:
          'Sharing several weeks of baseline heart-rate logs gives doctors richer context than a single five-minute measurement taken under stressful surgery conditions.',
      },
      {
        side: 'against',
        idea: 'Constant self-tracking can trigger obsessive health anxiety and unnecessary medical tests.',
        develop:
          'Minor sensor fluctuations or imperfect sleep scores may alarm healthy wearers into booking repeated appointments, adding strain to already stretched primary-care clinics.',
      },
      {
        side: 'against',
        idea: 'Commercial handling of intimate biometric records creates serious data-privacy hazards.',
        develop:
          'Without strict legal safeguards, private technology firms could monetise sensitive physiological profiles or share them with insurers to adjust premiums unfairly.',
      },
      {
        side: 'against',
        idea: 'Consumer-grade sensors can produce inaccurate readings that foster a false sense of security.',
        develop:
          'Users who rely on wrist-based readings instead of formal clinical screening might ignore genuine warning symptoms simply because a device displays normal metrics.',
      },
    ],
    text: [
      'Smartwatches and biometric rings now enable ordinary citizens to monitor heart rhythms, sleep cycles, and blood oxygen levels throughout every day and night. Although constant self-tracking brings valid concerns over anxiety and data privacy, I believe the advantages of wearable health monitors outweigh their disadvantages when devices are backed by sensible privacy rules and clinical literacy.',
      'The chief benefit of continuous monitoring lies in shifting healthcare towards earlier disease prevention and personal agency. Traditional medical check-ups capture only a brief snapshot once a year, frequently missing intermittent heart arrhythmias or subtle declines in sleep quality. By logging longitudinal trends passively, consumer wearables can flag persistent anomalies early enough for timely clinical intervention, potentially averting strokes or chronic deterioration. Beyond early detection, real-time behavioural feedback helps sedentary individuals cultivate healthier habits: seeing measurable drops in resting heart rate after weeks of brisk walking or earlier bedtimes reinforces motivation far more effectively than abstract medical advice.',
      'Critics nonetheless identify genuine drawbacks that merit careful regulation. Consumer sensors are less accurate than hospital instruments, and benign fluctuations or false alerts can trigger acute health anxiety among otherwise well users, prompting unnecessary clinic appointments that add pressure on overstretched health services. Conversely, misplaced faith in normal wrist readings may lull symptomatic individuals into delaying proper diagnosis. Equally pressing is data privacy: intimate physiological logs collected by commercial manufacturers could be breached, sold to advertisers, or exploited by private insurers unless strict statutory protections restrict secondary use. Even so, these hazards stem primarily from weak governance and poor user guidance rather than flaws inherent in preventive monitoring itself.',
      'In conclusion, wearable health monitors offer a practical bridge between everyday habits and proactive medicine. Provided lawmakers enforce stringent biometric privacy standards and clinicians educate patients on interpreting alerts calmly, their preventive benefits clearly outweigh their drawbacks.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'Although constant self-tracking brings valid concerns over anxiety and data privacy, I believe the advantages of wearable health monitors outweigh their disadvantages when devices are backed by sensible privacy rules and clinical literacy.',
        criterion: 'TR',
        noteVi: 'Mở bài trả lời trực tiếp câu hỏi "outweigh" kèm hai điều kiện thực tế (quy định bảo mật và hiểu biết y tế).',
      },
      {
        quote: 'Traditional medical check-ups capture only a brief snapshot once a year, frequently missing intermittent heart arrhythmias or subtle declines in sleep quality.',
        criterion: 'LR',
        noteVi: 'Từ vựng y học chính xác nhưng tự nhiên ("intermittent heart arrhythmias", "longitudinal trends", "timely clinical intervention").',
      },
      {
        quote: 'seeing measurable drops in resting heart rate after weeks of brisk walking or earlier bedtimes reinforces motivation far more effectively than abstract medical advice.',
        criterion: 'GRA',
        noteVi: 'Cụm danh động từ dài làm chủ ngữ kết hợp so sánh hơn nhấn mạnh ("far more effectively than...") rõ ràng, mạch lạc.',
      },
      {
        quote: 'Conversely, misplaced faith in normal wrist readings may lull symptomatic individuals into delaying proper diagnosis.',
        criterion: 'CC',
        noteVi: 'Dùng "Conversely" đối chiếu sắc nét hai thái cực rủi ro: lo âu thái quá (câu trước) và chủ quan bỏ qua triệu chứng (câu sau).',
      },
      {
        quote: 'intimate physiological logs collected by commercial manufacturers could be breached, sold to advertisers, or exploited by private insurers unless strict statutory protections restrict secondary use.',
        criterion: 'GRA',
        noteVi: 'Chuỗi bị động song song ba động từ ("breached, sold..., or exploited...") kèm mệnh đề điều kiện "unless".',
      },
      {
        quote: 'Even so, these hazards stem primarily from weak governance and poor user guidance rather than flaws inherent in preventive monitoring itself.',
        criterion: 'CC',
        noteVi: 'Câu bản lề cuối thân bài 2 tách bạch lỗi quản trị với bản chất công nghệ, củng cố vững chắc lập trường lợi ích vượt trội.',
      },
      {
        quote: 'a practical bridge between everyday habits and proactive medicine.',
        criterion: 'LR',
        noteVi: 'Ẩn dụ học thuật chừng mực, sáng ý ("a practical bridge ... proactive medicine") khép bài tự nhiên không sáo rỗng.',
      },
    ],
    usefulCollocationIds: [
      'col:prevention_disease_prevention',
      'col:privacy_data_privacy',
      'col:habit_cultivate_a_habit',
      'col:pressure_alleviate_the_pressure_on',
      'col:stress_trigger_stress',
    ],
  },

  // =========================================================================
  // w2:017 — adv_disadv — transport (autonomous delivery vehicles on pavements)
  // =========================================================================
  {
    id: 'w2:017',
    essayType: 'adv_disadv',
    topic: 'transport',
    difficulty: 5,
    prompt:
      'Retailers in several cities have begun deploying small autonomous delivery robots that travel along public pavements to bring groceries and parcels to doorsteps. Do the advantages of this development outweigh the disadvantages?',
    partsToAddress: [
      'Assess the commercial, emissions, and convenience benefits of pavement delivery robots',
      'Examine spatial, accessibility, safety, and labour drawbacks on public footpaths',
      'Reach a well-reasoned conclusion on whether advantages outweigh disadvantages',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Electric pavement robots can replace short diesel van trips for small local deliveries.',
        develop:
          'Substituting lightweight battery-powered units for half-empty delivery vans reduces local exhaust fumes, engine noise, and kerbside double-parking.',
      },
      {
        side: 'for',
        idea: 'Automated last-mile fulfilment lowers operating costs and eases courier shortages.',
        develop:
          'Supermarkets and pharmacies can dispatch urgent medicines or groceries during evenings without depending solely on scarce gig-economy drivers.',
      },
      {
        side: 'for',
        idea: 'On-demand doorstep robots offer practical independence for housebound residents.',
        develop:
          'Elderly citizens or people recovering from surgery can receive small daily food orders reliably at predictable times.',
      },
      {
        side: 'against',
        idea: 'Commercial robots encroach on narrow footpaths meant for pedestrians and disabled users.',
        develop:
          'Wheelchair users, parents pushing prams, and visually impaired residents relying on guide dogs face unexpected obstacles and collision hazards on already crowded walkways.',
      },
      {
        side: 'against',
        idea: 'Private corporations effectively privatise public civic infrastructure without paying rent.',
        develop:
          'Municipal taxpayers fund and maintain pavements for human mobility, yet large logistics firms capture commercial savings by crowding footpaths with fleets of machines.',
      },
      {
        side: 'against',
        idea: 'Widespread automation risks displacing accessible entry-level courier employment.',
        develop:
          'Local delivery riders, many of whom rely on flexible hours to support families or studies, face declining earnings if automated fleets dominate short-distance drops.',
      },
    ],
    text: [
      'Small wheeled delivery robots are an increasingly familiar sight on city footpaths, ferrying groceries and takeaway parcels directly to residential doorsteps. Although these electric units promise lower emissions and operating savings for retailers, I contend that on dense urban pavements their disadvantages currently outweigh their advantages.',
      'Proponents advance a plausible environmental and logistical case. Short-distance parcel runs performed by diesel vans contribute disproportionately to street-level air pollution, traffic delays, and illegal kerbside parking. Replacing such trips with compact, battery-powered robots can curb local exhaust emissions and reduce operating costs for supermarkets and pharmacies struggling with courier shortages. For housebound older residents or parents with sick children, dependable doorstep delivery of small essentials also brings genuine everyday convenience without putting another heavy vehicle onto residential roads.',
      'Yet shifting commercial freight onto public pavements solves one transport problem by creating a more acute spatial inequity. Footpaths in most established cities are already narrow and cluttered with street furniture; introducing fleets of knee-high autonomous machines poses a serious risk to wheelchair users, visually impaired pedestrians navigating with canes, and parents pushing prams, particularly at junctions or during peak commuting hours. Equally questionable is the governance principle at stake: pavements are publicly funded sanctuaries for human movement, and allowing private corporations to monopolise them for profit effectively transfers private logistics burdens onto ordinary walkers. Beyond accessibility, rapid deployment threatens entry-level courier livelihoods while inviting vandalism and stalled units that block crossings whenever sensors misread winter weather or uneven kerbs.',
      'In conclusion, autonomous delivery robots may serve a modest role on wide suburban walkways or enclosed university campuses under stringent regulations. Across bustling urban pavements, however, compromising pedestrian safety and equitable access to public space represents too steep a price for faster parcel convenience.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'Although these electric units promise lower emissions and operating savings for retailers, I contend that on dense urban pavements their disadvantages currently outweigh their advantages.',
        criterion: 'TR',
        noteVi: 'Lập trường rõ ràng ngay mở bài, đồng thời xác định bối cảnh không gian cụ thể ("dense urban pavements").',
      },
      {
        quote: 'Proponents advance a plausible environmental and logistical case.',
        criterion: 'CC',
        noteVi: 'Câu mở thân bài 1 ngắn gọn, khách quan giới thiệu nhóm lập luận ủng hộ trước khi phân tích sâu.',
      },
      {
        quote: 'Yet shifting commercial freight onto public pavements solves one transport problem by creating a more acute spatial inequity.',
        criterion: 'LR',
        noteVi: 'Thuật ngữ quy hoạch đô thị sắc bén ("commercial freight", "spatial inequity") tóm trọn mấu chốt vấn đề.',
      },
      {
        quote: 'introducing fleets of knee-high autonomous machines poses a serious risk to wheelchair users, visually impaired pedestrians navigating with canes, and parents pushing prams,',
        criterion: 'TR',
        noteVi: 'Liệt kê cụ thể các nhóm người đi bộ dễ tổn thương giúp lập luận an toàn trở nên sống động và thuyết phục.',
      },
      {
        quote: 'Equally questionable is the governance principle at stake:',
        criterion: 'GRA',
        noteVi: 'Đảo ngữ kết hợp dấu hai chấm mở ra phân tích sâu về công bằng hạ tầng công - tư, vượt lên mức liệt kê thông thường.',
      },
      {
        quote: 'while inviting vandalism and stalled units that block crossings whenever sensors misread winter weather or uneven kerbs.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề phân từ bổ sung kết hợp mệnh đề quan hệ và mệnh đề thời gian ("whenever...") mượt mà, giàu chi tiết thực tế.',
      },
      {
        quote: 'compromising pedestrian safety and equitable access to public space represents too steep a price for faster parcel convenience.',
        criterion: 'LR',
        noteVi: 'Cụm diễn đạt kết bài tự nhiên và chuẩn Band 8 ("too steep a price for...") đánh giá trực diện cán cân lợi - hại.',
      },
    ],
    usefulCollocationIds: [
      'col:congestion_alleviate_traffic_congestion',
      'col:reduce_reduce_operating_costs',
      'col:pose_pose_a_serious_risk',
      'col:regulation_stringent_regulations',
      'col:allocate_allocate_urban_space',
    ],
  },

  // =========================================================================
  // w2:018 — adv_disadv — economy (cashless retail payments)
  // =========================================================================
  {
    id: 'w2:018',
    essayType: 'adv_disadv',
    topic: 'economy',
    difficulty: 1,
    prompt:
      'In many countries, shops and restaurants are rapidly moving towards cashless payment systems using cards and mobile wallets. Do the advantages of a cashless retail economy outweigh the disadvantages?',
    partsToAddress: [
      'Explain the practical, security, and fiscal advantages of cashless retail transactions',
      'Consider financial inclusion, privacy, and technical resilience disadvantages',
      'Conclude clearly on whether the advantages outweigh the disadvantages',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Contactless payments speed up checkouts and lower cash-handling costs for retailers.',
        develop:
          'Shops save staff hours previously spent counting tills, ordering change, and paying armoured couriers to transport banknotes to banks.',
      },
      {
        side: 'for',
        idea: 'Reducing physical cash on premises bolsters security and improves tax compliance.',
        develop:
          'Cafes and corner stores holding minimal banknotes become less attractive targets for robbery, while electronic trails curb underreported cash income.',
      },
      {
        side: 'for',
        idea: 'Digital records help consumers track everyday spending automatically.',
        develop:
          'Mobile banking applications categorise grocery and transport purchases instantly, making monthly household budgeting simpler than keeping paper receipts.',
      },
      {
        side: 'against',
        idea: 'Refusing banknotes restricts access for elderly, low-income, and unbanked citizens.',
        develop:
          'People without smartphones, bank accounts, or digital confidence can be locked out of basic shops, pharmacies, and public car parks.',
      },
      {
        side: 'against',
        idea: 'Fully electronic commerce leaves daily trade vulnerable to power or network failures.',
        develop:
          'A regional banking outage or severe storm disrupting internet lines can halt food and fuel purchases instantaneously when no physical currency backup exists.',
      },
      {
        side: 'against',
        idea: 'Universal digital payments heighten privacy concerns and expose merchants to card fees.',
        develop:
          'Every minor purchase generates a permanent data trail accessible to payment processors, while small independent traders lose a slice of each sale to transaction charges.',
      },
    ],
    text: [
      'Contactless bank cards and smartphone wallets have swiftly displaced banknotes across shops, cafes, and transport kiosks in many economies. On balance, I believe the advantages of a largely cashless retail sector outweigh its disadvantages, provided governments protect the legal right to pay in cash at essential services.',
      'The move towards electronic payments delivers compelling efficiency gains for businesses, consumers, and public finances alike. At busy checkouts, tapping a card or phone clears queues rapidly and frees small shopkeepers from counting registers, storing safes, and paying security firms to bank physical takings. Holding negligible cash on the premises also bolsters security by deterring opportunistic till theft. For governments, verifiable digital records narrow the shadow economy, helping authorities collect due tax revenue without raising headline rates. Meanwhile, shoppers benefit from instant spending summaries inside banking applications, making household budgeting considerably more transparent than tracking loose coins and paper receipts.',
      'Nevertheless, a headlong rush towards a completely cash-free society entails serious social and operational risks. Most pressing is financial exclusion: elderly citizens accustomed to physical money, migrants lacking formal bank accounts, and low-income earners who budget weekly in banknotes can find themselves turned away from ordinary grocers or buses. Beyond equity, complete dependence on electronic rails introduces systemic fragility; when telecom networks fail during storms or banking software suffers an outage, cashless tills freeze instantly. Equally valid are privacy concerns, as routine purchases create detailed behavioural logs held by private intermediaries that also levy processing fees on independent merchants.',
      'In conclusion, digital retail payments offer undeniable gains in speed, safety, and fiscal transparency that outweigh their limitations for the majority of citizens. Even so, preserving cash acceptance for essential goods and capping merchant card fees remain vital to ensure convenience never comes at the cost of inclusion or resilience.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'On balance, I believe the advantages of a largely cashless retail sector outweigh its disadvantages, provided governments protect the legal right to pay in cash at essential services.',
        criterion: 'TR',
        noteVi: 'Lập trường cân bằng, rõ ràng: lợi ích vượt trội nhưng cần giữ quyền dùng tiền mặt cho dịch vụ thiết yếu.',
      },
      {
        quote: 'At busy checkouts, tapping a card or phone clears queues rapidly and frees small shopkeepers from counting registers, storing safes, and paying security firms to bank physical takings.',
        criterion: 'GRA',
        noteVi: 'Cấu trúc song song ba cụm danh động từ ("counting..., storing..., and paying...") giàu chi tiết thực tế và chuẩn xác.',
      },
      {
        quote: 'verifiable digital records narrow the shadow economy, helping authorities collect due tax revenue without raising headline rates.',
        criterion: 'LR',
        noteVi: 'Thuật ngữ kinh tế tài chính chính xác ("shadow economy", "due tax revenue", "headline rates").',
      },
      {
        quote: 'Nevertheless, a headlong rush towards a completely cash-free society entails serious social and operational risks.',
        criterion: 'CC',
        noteVi: 'Câu chủ đề thân bài 2 mở ra hai nhóm rủi ro (xã hội và vận hành) được triển khai lần lượt đúng trình tự trong đoạn.',
      },
      {
        quote: 'complete dependence on electronic rails introduces systemic fragility; when telecom networks fail during storms or banking software suffers an outage, cashless tills freeze instantly.',
        criterion: 'LR',
        noteVi: 'Cụm từ học thuật hiện đại ("electronic rails", "systemic fragility", "cashless tills freeze") diễn tả rủi ro công nghệ sắc nét.',
      },
      {
        quote: 'as routine purchases create detailed behavioural logs held by private intermediaries that also levy processing fees on independent merchants.',
        criterion: 'GRA',
        noteVi: 'Kết hợp mệnh đề nguyên nhân, cụm phân từ bị động ("held by...") và mệnh đề quan hệ xác định trong một câu mạch lạc.',
      },
      {
        quote: 'to ensure convenience never comes at the cost of inclusion or resilience.',
        criterion: 'TR',
        noteVi: 'Kết bài cô đọng, gói gọn toàn bộ trục đánh đổi giữa tiện lợi, hòa nhập xã hội và khả năng chống chịu hệ thống.',
      },
    ],
    usefulCollocationIds: [
      'col:efficiency_efficiency_gains',
      'col:privacy_privacy_concerns',
      'col:access_restrict_access_to',
      'col:security_bolster_security',
      'col:revenue_tax_revenue',
    ],
  },

  // =========================================================================
  // w2:019 — adv_disadv — family (multigenerational households in cities)
  // =========================================================================
  {
    id: 'w2:019',
    essayType: 'adv_disadv',
    topic: 'family',
    difficulty: 2,
    prompt:
      'Rising housing costs and longer life expectancy have led more urban families to live in multigenerational households, where grandparents, parents, and children share one home. What are the advantages and disadvantages of this living arrangement?',
    partsToAddress: [
      'Explore the financial, caregiving, and emotional advantages of multigenerational urban homes',
      'Examine the spatial, privacy, and interpersonal disadvantages of shared family living',
      'Summarise both sides clearly in a balanced conclusion',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Pooling incomes and household bills eases steep urban housing and utility costs.',
        develop:
          'Sharing one mortgage or rent alongside heating and grocery expenses frees young adults to build savings while protecting retired grandparents from inflation.',
      },
      {
        side: 'for',
        idea: 'Mutual caregiving lowers childcare bills and alleviates elderly loneliness.',
        develop:
          'Grandparents can help with school runs and after-school supervision while enjoying daily companionship and prompt practical support as they age.',
      },
      {
        side: 'for',
        idea: 'Daily contact across three generations strengthens family bonds and cultural continuity.',
        develop:
          'Children naturally absorb family stories, home languages, and culinary traditions through everyday meals rather than occasional holiday visits.',
      },
      {
        side: 'against',
        idea: 'Typical city apartments are rarely spacious enough to give three generations adequate privacy.',
        develop:
          'Sharing a single bathroom or living room creates friction over noise, study space, and differing daily timetables between teenagers and older relatives.',
      },
      {
        side: 'against',
        idea: 'Generational disagreements over parenting, finances, and domestic chores can generate tension.',
        develop:
          'Grandparents and parents often hold contrasting views on discipline or screen time, while unpaid caregiving expectations can fall unevenly on adult daughters.',
      },
      {
        side: 'against',
        idea: 'Co-residence may limit young adults\' career mobility and sense of personal independence.',
        develop:
          'Feeling obliged to remain in the family home to assist ageing relatives can deter working-age adults from accepting promotions in other cities.',
      },
    ],
    text: [
      'Steep metropolitan property prices and rising longevity have prompted a growing number of city households to bring grandparents, working parents, and children together under one roof. While multigenerational living offers substantial financial relief and mutual emotional support, it also introduces notable pressures on privacy, domestic harmony, and personal autonomy.',
      'The most immediate benefits are economic and practical. Pooling incomes across two adult generations spreads housing costs, utility bills, and food expenditure far more efficiently than maintaining separate urban flats, enabling younger couples to save while shielding older relatives from rising living expenses. Equally valuable is the reciprocal network of care such homes foster. Retired grandparents often assist with school collections and home-cooked meals, reducing costly nursery fees for working parents; in return, older family members gain daily companionship that alleviates loneliness and ensures prompt help during minor illnesses. Children raised in these households also tend to develop stronger empathy and a richer connection to family language and traditions.',
      'Yet sharing compact urban housing across three age groups entails undeniable friction. Most modern city flats were designed for nuclear families rather than extended households, leaving teenagers, remote-working parents, and early-rising elders competing for quiet rooms and shared bathrooms. Without clear boundaries, differing attitudes towards child-rearing, household spending, and domestic chores frequently spark quiet resentment. Moreover, informal caregiving duties rarely divide equally; adult women in particular often shoulder disproportionate responsibility for both young children and frail elders while holding paid jobs, eroding their overall wellbeing. Co-residence can likewise restrict career mobility when younger adults hesitate to relocate for stronger employment prospects.',
      'In conclusion, urban multigenerational households combine meaningful economic resilience and intergenerational warmth with real constraints on space, privacy, and individual independence. Whether the arrangement flourishes ultimately depends on adaptable housing design and explicit agreements regarding finances, boundaries, and shared domestic responsibilities.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'While multigenerational living offers substantial financial relief and mutual emotional support, it also introduces notable pressures on privacy, domestic harmony, and personal autonomy.',
        criterion: 'TR',
        noteVi: 'Mở bài bao quát đầy đủ hai mặt lợi và hại theo đúng yêu cầu dạng đề "What are the advantages and disadvantages".',
      },
      {
        quote: 'Equally valuable is the reciprocal network of care such homes foster.',
        criterion: 'LR',
        noteVi: 'Cụm từ "reciprocal network of care" (mạng lưới chăm sóc hai chiều) kết hợp đảo ngữ rất tự nhiên và giàu ý nghĩa.',
      },
      {
        quote: 'reducing costly nursery fees for working parents; in return, older family members gain daily companionship that alleviates loneliness',
        criterion: 'CC',
        noteVi: 'Dùng "; in return," thể hiện chính xác quan hệ tương hỗ hai chiều giữa cha mẹ trẻ và ông bà.',
      },
      {
        quote: 'leaving teenagers, remote-working parents, and early-rising elders competing for quiet rooms and shared bathrooms.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề phân từ hệ quả ("leaving + O + V-ing") mô tả sống động xung đột không gian giữa ba thế hệ.',
      },
      {
        quote: 'adult women in particular often shoulder disproportionate responsibility for both young children and frail elders while holding paid jobs, eroding their overall wellbeing.',
        criterion: 'LR',
        noteVi: 'Collocation chuẩn "shoulder ... responsibility for" kết hợp "overall wellbeing" chỉ rõ khía cạnh bình đẳng giới trong gia đình.',
      },
      {
        quote: 'Co-residence can likewise restrict career mobility when younger adults hesitate to relocate for stronger employment prospects.',
        criterion: 'CC',
        noteVi: 'Dùng "likewise" bổ sung gọn một hệ lụy dài hạn về nghề nghiệp mà không cần dùng các cụm liệt kê cứng nhắc.',
      },
      {
        quote: 'Whether the arrangement flourishes ultimately depends on adaptable housing design and explicit agreements regarding finances, boundaries, and shared domestic responsibilities.',
        criterion: 'GRA',
        noteVi: 'Mệnh đề danh ngữ bắt đầu bằng "Whether..." làm chủ ngữ tạo câu kết sắc sảo và cân bằng.',
      },
    ],
    usefulCollocationIds: [
      'col:responsibility_shoulder_responsibility_for',
      'col:housing_housing_costs',
      'col:alleviate_alleviate_loneliness',
      'col:pressure_alleviate_the_pressure_on',
      'col:well_being_overall_well_being',
    ],
  },

  // =========================================================================
  // w2:020 — adv_disadv — culture (digitising museum collections for virtual tours)
  // =========================================================================
  {
    id: 'w2:020',
    essayType: 'adv_disadv',
    topic: 'culture',
    difficulty: 6,
    prompt:
      'Major museums are increasingly digitising their collections and offering free virtual tours to global online audiences. Do the advantages of this development outweigh the disadvantages?',
    partsToAddress: [
      'Evaluate the educational, accessibility, and conservation advantages of museum digitisation',
      'Examine concerns regarding diminished physical experience, funding pressure, and digital inequality',
      'Make a clear final judgement on whether benefits outweigh drawbacks',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Free virtual tours democratise access to world heritage regardless of wealth or geography.',
        develop:
          'Students in rural towns or low-income countries who could never afford international flights can examine rare manuscripts, sculptures, and paintings in fine detail.',
      },
      {
        side: 'for',
        idea: 'High-resolution three-dimensional scans create vital preservation records against disaster.',
        develop:
          'Should fire, flood, or armed conflict damage fragile artefacts, detailed digital archives assist future conservationists and historians in reconstructing lost heritage.',
      },
      {
        side: 'for',
        idea: 'Online portals reveal vast reserve collections that never fit inside physical galleries.',
        develop:
          'Major museums typically display only a small fraction of their holdings at once, so searchable digital catalogues unlock tens of thousands of stored objects for researchers.',
      },
      {
        side: 'against',
        idea: 'Screen-based viewing cannot replicate the physical scale, texture, and atmosphere of real artefacts.',
        develop:
          'Standing before an original canvas or ancient stonework conveys spatial presence and brushwork subtleties that flat monitors inevitably flatten.',
      },
      {
        side: 'against',
        idea: 'Digitising large archives consumes substantial budgets while potentially softening ticket revenue.',
        develop:
          'Smaller regional museums may struggle to fund specialist scanning equipment and server maintenance if free virtual access reduces casual visitor footfall.',
      },
      {
        side: 'against',
        idea: 'Online tours still exclude communities lacking reliable broadband or capable devices.',
        develop:
          'Without offline school kits or public library access, high-bandwidth virtual galleries risk widening cultural gaps between connected and underserved regions.',
      },
    ],
    text: [
      'Leading cultural institutions are investing heavily in high-resolution photography and three-dimensional scanning to publish collections online through free virtual tours. Despite valid worries about funding pressures and the sensory limits of screens, I consider that the advantages of digitising museum holdings decisively outweigh the disadvantages.',
      'The most compelling benefit is widening access to shared cultural heritage. Historically, experiencing iconic artefacts required costly travel to major capitals, excluding citizens on modest incomes, rural pupils, and people with mobility impairments. Free online galleries erase those barriers while unlocking reserve collections: since large museums display only a small fraction of their holdings in public rooms, searchable digital catalogues open vast archives of manuscripts, textiles, and ceramics to global scholars and learners alike. Equally critical is preservation. Detailed digital scans create an enduring archival record that lets historians study fragile objects without repeated handling and provides a vital blueprint should fire, flood, or conflict ever damage the originals.',
      'Critics rightly note that a backlit screen cannot reproduce the tactile texture, monumental scale, or quiet reverence of encountering an original sculpture in person. There is also a financial concern: digitisation demands sustained spending on specialist imaging and software, and some curators fear free portals might erode ticket income. Yet viewing virtual tours as a rival to physical attendance misreads visitor behaviour. Much as recorded music expands demand for live concerts, engaging digital exhibitions frequently spark curiosity that motivates in-person visits, membership, and international exhibition loans. Directing a modest share of cultural grants towards digitisation also helps institutions maintain online access without neglecting gallery conservation.',
      'In conclusion, although virtual tours cannot substitute for the sensory richness of walking through a physical museum, they need not do so to prove valuable. By democratising education, promoting cultural understanding, and safeguarding heritage for future generations, museum digitisation yields benefits that far exceed its drawbacks.',
    ].join('\n\n'),
    noteSpecs: [
      {
        quote:
          'Despite valid worries about funding pressures and the sensory limits of screens, I consider that the advantages of digitising museum holdings decisively outweigh the disadvantages.',
        criterion: 'TR',
        noteVi: 'Mở bài khẳng định lập trường mạnh mẽ ("decisively outweigh") đồng thời thừa nhận hai mối lo chính của phía phản đối.',
      },
      {
        quote: 'since large museums display only a small fraction of their holdings in public rooms, searchable digital catalogues open vast archives of manuscripts, textiles, and ceramics',
        criterion: 'TR',
        noteVi: 'Đưa ra khía cạnh chuyên sâu ít người nghĩ tới (kho lưu trữ hiện vật không trưng bày), làm lập luận sâu sắc chuẩn Band 8+.',
      },
      {
        quote: 'provides a vital blueprint should fire, flood, or conflict ever damage the originals.',
        criterion: 'GRA',
        noteVi: 'Đảo ngữ điều kiện với "should..." đặt mượt mà ở cuối câu giúp câu văn trang trọng và linh hoạt.',
      },
      {
        quote: 'a backlit screen cannot reproduce the tactile texture, monumental scale, or quiet reverence of encountering an original sculpture in person.',
        criterion: 'LR',
        noteVi: 'Chuỗi cụm danh từ giàu sắc thái mỹ học ("tactile texture", "monumental scale", "quiet reverence") thể hiện vốn từ rất rộng.',
      },
      {
        quote: 'Yet viewing virtual tours as a rival to physical attendance misreads visitor behaviour.',
        criterion: 'CC',
        noteVi: 'Câu bản lề ngắn gọn đảo ngược lập luận lo ngại sụt giảm doanh thu vé, nối sang phép so sánh tương đồng ngay sau.',
      },
      {
        quote: 'Much as recorded music expands demand for live concerts, engaging digital exhibitions frequently spark curiosity that motivates in-person visits, membership, and international exhibition loans.',
        criterion: 'GRA',
        noteVi: 'Cấu trúc so sánh tương đồng học thuật "Much as..., ..." cực kỳ tự nhiên và thuyết phục.',
      },
      {
        quote: 'By democratising education, promoting cultural understanding, and safeguarding heritage for future generations,',
        criterion: 'LR',
        noteVi: 'Chuỗi ba động từ học thuật mạnh kết hợp collocation ("promoting cultural understanding", "safeguarding heritage") khép bài ấn tượng.',
      },
    ],
    usefulCollocationIds: [
      'col:heritage_cultural_heritage',
      'col:heritage_preserve_heritage',
      'col:access_widen_access_to',
      'col:revenue_dwindling_revenue',
      'col:promote_promote_cultural_understanding',
    ],
  },
);

function buildBatch() {
  const out = [];
  for (const raw of RAW_ITEMS) {
    const text = raw.text.trim();
    const paras = text.split('\n\n');
    if (paras.length !== 4) {
      throw new Error(`${raw.id}: expected 4 paragraphs, got ${paras.length}`);
    }
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < 275 || wordCount > 315) {
      console.warn(`[WC WARN] ${raw.id}: wordCount=${wordCount} (target 275-315)`);
    }

    const notes = raw.noteSpecs.map((ns, idx) => {
      const start = text.indexOf(ns.quote);
      if (start === -1) {
        throw new Error(`${raw.id}: note[${idx}] quote not found: ${JSON.stringify(ns.quote)}`);
      }
      const second = text.indexOf(ns.quote, start + 1);
      if (second !== -1) {
        throw new Error(`${raw.id}: note[${idx}] quote appears multiple times: ${JSON.stringify(ns.quote)}`);
      }
      return {
        start,
        end: start + ns.quote.length,
        noteVi: ns.noteVi,
        criterion: ns.criterion,
      };
    });

    const criteria = new Set(notes.map((n) => n.criterion));
    for (const req of ['TR', 'CC', 'LR', 'GRA']) {
      if (!criteria.has(req)) {
        throw new Error(`${raw.id}: missing criterion ${req} in notes`);
      }
    }

    out.push({
      id: raw.id,
      essayType: raw.essayType,
      topic: raw.topic,
      difficulty: raw.difficulty,
      prompt: raw.prompt,
      partsToAddress: raw.partsToAddress,
      ideaBank: raw.ideaBank,
      band8Model: {
        text,
        wordCount,
        notes,
      },
      usefulCollocationIds: raw.usefulCollocationIds,
      provenance: PROVENANCE,
    });
  }
  return out;
}

const batch = buildBatch();
const outPath = path.resolve('data-src/writing/batches/t2_01_opinion_adv.json');
fs.writeFileSync(outPath, JSON.stringify(batch, null, 2) + '\n', 'utf8');
console.log(`Wrote ${batch.length} items to ${outPath}`);
for (const item of batch) {
  console.log(
    `  ${item.id} | ${item.essayType.padEnd(10)} | ${item.topic.padEnd(11)} | d=${item.difficulty} | wc=${item.band8Model.wordCount} | notes=${item.band8Model.notes.length} | ideas=${item.ideaBank.length} | cols=${item.usefulCollocationIds.length}`
  );
}
