#!/usr/bin/env node
/**
 * Generator for data-src/writing/batches/t2_03_disc_twopart.json
 * Produces w2:041..w2:050 (discussion) and w2:051..w2:060 (two_part)
 * with exact wordCount and verified character offsets for notes.
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
  // DISCUSSION ESSAYS: w2:041 .. w2:050 (difficulties 5 .. 10)
  // =========================================================================
  {
    id: 'w2:041',
    essayType: 'discussion',
    topic: 'government',
    difficulty: 5,
    prompt:
      'Some people argue that governments should allocate the majority of public health budgets to preventive healthcare programmes, whereas others believe funding should prioritise advanced hospital equipment and acute treatment. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Examine the case for prioritising preventive healthcare programmes in public budgets',
      'Examine the case for prioritising advanced hospital equipment and acute clinical care',
      'Present and justify a clear personal position on how public funds should be balanced',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Preventive initiatives lower the long-term incidence of costly chronic illnesses.',
        develop:
          'Community screening, vaccination drives, and subsidised nutrition counselling catch metabolic and cardiovascular risks early, sparing public systems decades of expensive inpatient management.',
      },
      {
        side: 'for',
        idea: 'Population-wide prevention delivers broader equity across income groups.',
        develop:
          'Clean-air standards, maternal clinics, and school-based health education reach low-income neighbourhoods where residents often delay hospital visits until conditions become critical.',
      },
      {
        side: 'for',
        idea: 'Healthier working-age citizens sustain national productivity and tax revenues.',
        develop:
          'When preventable conditions such as type-two diabetes are curtailed early, fewer adults leave the labour force prematurely, protecting the fiscal base that finances health services.',
      },
      {
        side: 'against',
        idea: 'Modern diagnostic and surgical equipment saves lives that prevention alone cannot protect.',
        develop:
          'Trauma victims, premature infants, and patients with genetic cancers rely on high-resolution scanners and robotic surgical suites regardless of how healthy their lifestyles have been.',
      },
      {
        side: 'against',
        idea: 'Investing in hospital technology shortens recovery times and reduces bed occupancy.',
        develop:
          'Minimally invasive surgical instruments allow patients to return home within days rather than weeks, easing bottlenecks across overstretched public wards.',
      },
      {
        side: 'against',
        idea: 'Preventive outcomes take decades to materialise, whereas acute clinical demand is immediate.',
        develop:
          'Ageing populations already presenting with complex heart and neurological disorders require well-equipped regional hospitals today rather than promises of lower morbidity twenty years hence.',
      },
    ],
    modelText: `Public health ministries face persistent tension over whether limited tax revenue is better spent preventing illness before it arises or equipping hospitals with cutting-edge clinical technology. While both approaches safeguard public health in distinct ways, I contend that governments should direct a larger share of incremental funding towards prevention while preserving essential investment in acute care.

Advocates of advanced hospital equipment rightly emphasise that many life-threatening conditions cannot be prevented through lifestyle or screening alone. Accident trauma, congenital disorders, and aggressive malignancies demand rapid diagnostic imaging, well-equipped operating theatres, and specialist intensive-care units. Furthermore, upgraded medical devices often raise clinical efficiency rather than merely inflating departmental costs. Minimally invasive surgical systems, for instance, reduce postoperative complications and shorten inpatient stays, freeing beds for subsequent patients. Neglecting hospital infrastructure would therefore leave ageing populations dangerously vulnerable precisely when specialist medical intervention is most urgent.

Nevertheless, an excessive focus on high-technology treatment addresses symptoms downstream while allowing avoidable demand to overwhelm wards. Preventive measures such as routine cancer screening, immunisation campaigns, and local primary-care clinics intercept disease at a fraction of the expense of late-stage intervention. In a mid-sized municipal district, funding blood-pressure monitoring and smoking-cessation support costs far less than financing emergency cardiac surgery and lifelong rehabilitation for hundreds of residents. Beyond fiscal prudence, prevention narrows social inequalities by reaching lower-income households long before unmanaged conditions force them out of stable employment.

In conclusion, advanced hospital equipment remains indispensable for acute emergencies and complex pathologies, yet treating illness solely after it escalates is financially unsustainable. Governments should therefore anchor health budgets in preventive care, ensuring that modern hospitals remain available for patients whose conditions genuinely cannot be forestalled.`,
    noteSpecs: [
      {
        quote:
          'I contend that governments should direct a larger share of incremental funding towards prevention while preserving essential investment in acute care.',
        noteVi:
          'Câu luận điểm (thesis) nêu lập trường rõ ràng và có sắc thái cân bằng ngay cuối mở bài, đáp ứng trực tiếp yêu cầu Task Response.',
        criterion: 'TR',
      },
      {
        quote: 'Advocates of advanced hospital equipment rightly emphasise that',
        noteVi:
          'Cụm mở đoạn thân bài 1 dẫn vào quan điểm đối lập một cách khách quan, tự nhiên mà không dùng khuôn mẫu cứng nhắc.',
        criterion: 'CC',
      },
      {
        quote: 'congenital disorders, and aggressive malignancies',
        noteVi:
          'Từ vựng học thuật y khoa chính xác và tự nhiên, thể hiện vốn từ rộng ở mức Band 8+.',
        criterion: 'LR',
      },
      {
        quote: 'freeing beds for subsequent patients.',
        noteVi:
          'Mệnh đề phân từ hiện tại (present participle clause) rút gọn kết quả gọn gàng, tăng độ đa dạng cấu trúc câu.',
        criterion: 'GRA',
      },
      {
        quote: 'Nevertheless, an excessive focus on high-technology treatment addresses symptoms downstream',
        noteVi:
          'Từ nối chuyển ý tương phản mạnh kết hợp phép ẩn dụ học thuật "addresses symptoms downstream" giúp mạch lập luận liền lạc.',
        criterion: 'CC',
      },
      {
        quote: 'Beyond fiscal prudence, prevention narrows social inequalities',
        noteVi:
          'Cụm danh từ học thuật "fiscal prudence" mở rộng luận điểm từ kinh tế sang công bằng xã hội một cách thuyết phục.',
        criterion: 'LR',
      },
      {
        quote: 'whose conditions genuinely cannot be forestalled.',
        noteVi:
          'Mệnh đề quan hệ sở hữu kết hợp bị động với động từ học thuật "forestalled" chốt bài sắc nét.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:funding_allocate_funding_to',
      'col:prevention_invest_in_prevention',
      'col:health_safeguard_public_health',
      'col:measure_preventive_measures',
      'col:priority_competing_priorities',
    ],
  },

  {
    id: 'w2:042',
    essayType: 'discussion',
    topic: 'science',
    difficulty: 6,
    prompt:
      'Some people believe that governments should invest heavily in deep-space exploration, while others argue that scientific funding would be better spent on conserving the Earth\'s oceans. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Discuss the arguments supporting public investment in deep-space exploration',
      'Discuss the arguments favouring scientific funding for ocean conservation',
      'State and defend a clear opinion on how funding priorities should be set',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Deep-space missions drive technological breakthroughs with terrestrial benefits.',
        develop:
          'Engineering probes for extreme radiation and scarce power yields advances in satellite Earth observation, autonomous robotics, and lightweight materials later adopted in medicine and clean energy.',
      },
      {
        side: 'for',
        idea: 'Exploring other planetary bodies answers foundational scientific questions.',
        develop:
          'Studying atmospheric evolution on neighbouring worlds helps climatologists verify models of greenhouse warming and long-term planetary habitability.',
      },
      {
        side: 'for',
        idea: 'Space programmes inspire future generations of scientists and engineers.',
        develop:
          'Ambitious interplanetary missions stimulate university enrolment in physics, computing, and aerospace disciplines, strengthening a nation\'s research base.',
      },
      {
        side: 'against',
        idea: 'Healthy oceans directly regulate global climate and sustain food security.',
        develop:
          'Marine ecosystems absorb vast quantities of excess atmospheric heat and carbon while supplying primary protein for hundreds of millions of coastal residents.',
      },
      {
        side: 'against',
        idea: 'Large expanses of the deep sea remain poorly mapped yet face mounting human threats.',
        develop:
          'Ocean acidification, plastic accumulation, and seabed mining threaten fragile coral reefs and undiscovered species with potentially invaluable biochemical compounds.',
      },
      {
        side: 'against',
        idea: 'Ocean conservation yields faster, measurable ecological returns per unit of funding.',
        develop:
          'Financing marine protected zones, fisheries monitoring, and coastal wetland restoration mitigates storm surges and revives fish stocks within a single decade.',
      },
    ],
    modelText: `Public debate over scientific budgets frequently pits the ambition of deep-space exploration against the urgency of safeguarding marine ecosystems. Although interplanetary research offers genuine intellectual and technological dividends, I believe governments should give clear priority to ocean conservation given humanity\'s immediate dependence on marine stability.

Supporters of deep-space exploration point out that ambitious missions rarely confine their benefits to astronomy alone. Designing spacecraft capable of operating millions of kilometres from Earth demands breakthroughs in miniaturised sensors, closed-loop water recycling, and autonomous navigation. Many of these innovations subsequently improve terrestrial industries, including precision climate satellites that monitor deforestation, agricultural drought, and polar ice loss in near real time. In addition, studying how harsh atmospheres evolve on distant planets sharpens scientific understanding of planetary warming, while high-profile exploratory missions inspire young learners to pursue demanding scientific and engineering careers.

Critics, however, argue convincingly that allocating billions of public funds to outer space while Earth\'s seas deteriorate reflects misplaced national priorities. Oceans regulate global temperatures, absorb substantial carbon emissions, and provide primary nutrition and dependable livelihoods for coastal populations across every continent. Despite this vital role, vast stretches of the deep sea remain unexplored even as warming waters, overfishing, and chemical runoff push marine biodiversity towards collapse. Directing public funding towards marine sanctuaries, seabed mapping, and reef restoration produces tangible ecological protection that directly shields coastal towns from severe weather and preserves fisheries for future generations.

In conclusion, deep-space research remains a valuable catalyst for long-term innovation and should continue through modest, internationally shared budgets. Nonetheless, because collapsing marine ecosystems threaten food supply and climate stability within our own lifetimes, conserving Earth\'s oceans warrants the greater share of public scientific investment.`,
    noteSpecs: [
      {
        quote:
          'I believe governments should give clear priority to ocean conservation given humanity\'s immediate dependence on marine stability.',
        noteVi:
          'Lập trường cá nhân nêu dứt khoát kèm lý do cốt lõi ngay mở bài, định hướng rõ cho toàn bài luận.',
        criterion: 'TR',
      },
      {
        quote: 'rarely confine their benefits to astronomy alone.',
        noteVi:
          'Cách diễn đạt phủ định mềm học thuật ("rarely confine... alone") tinh tế hơn nhiều so với "not only".',
        criterion: 'LR',
      },
      {
        quote: 'Designing spacecraft capable of operating millions of kilometres from Earth demands breakthroughs',
        noteVi:
          'Chủ ngữ là cụm danh động từ (gerund phrase) kèm cụm tính từ mở rộng giúp câu học thuật giàu thông tin.',
        criterion: 'GRA',
      },
      {
        quote: 'Critics, however, argue convincingly that',
        noteVi:
          'Trạng từ chuyển ý "however" đặt xen giữa câu tạo nhịp điệu chuyển đoạn tự nhiên sang quan điểm thứ hai.',
        criterion: 'CC',
      },
      {
        quote: 'Despite this vital role, vast stretches of the deep sea remain unexplored even as',
        noteVi:
          'Kết hợp giới từ nhượng bộ "Despite" và liên từ thời gian-tương phản "even as" thể hiện độ kiểm soát ngữ pháp Band 8+.',
        criterion: 'GRA',
      },
      {
        quote: 'push marine biodiversity towards collapse.',
        noteVi:
          'Collocation chuẩn xác về sinh thái biển, diễn tả mức độ cấp bách mà không dùng cụm sáo rỗng.',
        criterion: 'LR',
      },
      {
        quote: 'should continue through modest, internationally shared budgets.',
        noteVi:
          'Giải pháp dung hòa thực tế trong kết bài giúp quan điểm không bị cực đoan và tăng chiều sâu Task Response.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:research_fund_research',
      'col:research_groundbreaking_research',
      'col:biodiversity_marine_biodiversity',
      'col:ecosystem_marine_ecosystems',
      'col:resource_allocate_resources',
    ],
  },

  {
    id: 'w2:043',
    essayType: 'discussion',
    topic: 'crime',
    difficulty: 6,
    prompt:
      'Some people argue that courts should hand down rehabilitative community sentences for non-violent offences, whereas others insist that longer prison terms are necessary to deter crime. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Explain the arguments favouring rehabilitative community sentences for non-violent offenders',
      'Explain the arguments favouring longer prison sentences as a deterrent',
      'Articulate and justify a clear personal judgement on sentencing policy',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Community sentences preserve family ties and employment that reduce reoffending.',
        develop:
          'Offenders who complete supervised public work and skills training while remaining in work are far less likely to drift into chronic criminality than those released from prison with no income.',
      },
      {
        side: 'for',
        idea: 'Non-custodial penalties relieve prison overcrowding and cut public expenditure.',
        develop:
          'Housing a single inmate costs taxpayers tens of thousands each year, whereas structured probation and restitution orders channel funds towards victim support and crime prevention.',
      },
      {
        side: 'for',
        idea: 'Short prison stays often expose minor offenders to hardened criminal networks.',
        develop:
          'Placing first-time shoplifters or fraudsters alongside violent repeat offenders frequently teaches new illicit techniques rather than fostering genuine remorse.',
      },
      {
        side: 'against',
        idea: 'Severe custodial sentences signal that the justice system takes property and financial offences seriously.',
        develop:
          'When white-collar fraud or serial burglary destroys household savings, victims expect proportionate deprivation of liberty rather than a brief community placement.',
      },
      {
        side: 'against',
        idea: 'Incapacitation physically prevents persistent offenders from committing further crimes.',
        develop:
          'For habitual thieves who repeatedly breach probation conditions, custodial confinement provides immediate protection to local shopkeepers and residents.',
      },
      {
        side: 'against',
        idea: 'Weakly monitored community orders can erode public confidence in the rule of law.',
        develop:
          'If citizens perceive non-custodial sanctions as lenient, frustration may grow and compliance with everyday legal standards could weaken.',
      },
    ],
    modelText: `How justice systems should punish non-violent offenders remains a divisive policy question. While proponents of custodial punishment maintain that lengthier prison terms are indispensable for deterring unlawful behaviour, I agree with those who favour structured community sentences for most non-violent offences, reserving imprisonment for persistent or large-scale offenders.

Those who advocate tougher incarceration rely on both deterrence and public reassurance. From this perspective, the prospect of losing one\'s liberty discourages opportunistic theft, deliberate vandalism, and sophisticated financial fraud far more effectively than unpaid community work. Furthermore, imprisonment delivers immediate incapacitation: while a serial burglar is behind bars, local neighbourhoods and small businesses are temporarily spared further material losses. Victims of major financial scams may also feel that non-custodial penalties trivialise the severe emotional and economic harm inflicted upon their households, potentially eroding public trust in the criminal courts.

Nonetheless, empirical evidence consistently suggests that longer prison sentences rarely curb reoffending among minor offenders and often worsen long-term outcomes. Custodial facilities are exceptionally costly to maintain, and incarcerating non-violent individuals alongside hardened inmates can turn a single lapse into an entrenched criminal career. By contrast, well-supervised community sentences address root causes directly. Requiring an offender to repair public spaces, attend addiction counselling, or complete vocational training allows them to retain lawful employment and repay victims financially. Such measures uphold accountability without severing the social and family anchors that help former offenders reintegrate constructively.

In conclusion, extended imprisonment retains a legitimate role for repeat offenders who flout court orders or orchestrate severe financial harm. For the majority of non-violent crimes, however, rigorous community-based rehabilitation protects taxpayers, reduces recidivism, and delivers more durable public safety than expanding prison capacity.`,
    noteSpecs: [
      {
        quote:
          'I agree with those who favour structured community sentences for most non-violent offences, reserving imprisonment for persistent or large-scale offenders.',
        noteVi:
          'Luận điểm chính rõ ràng kèm điều kiện phân loại hợp lý, tránh lập luận cực đoan và thể hiện tư duy pháp lý chặt chẽ.',
        criterion: 'TR',
      },
      {
        quote: 'rely on both deterrence and public reassurance.',
        noteVi:
          'Cặp danh từ trừu tượng chính xác trong lĩnh vực hình sự giúp câu chủ đề súc tích và học thuật.',
        criterion: 'LR',
      },
      {
        quote: 'imprisonment delivers immediate incapacitation: while a serial burglar is behind bars,',
        noteVi:
          'Dùng dấu hai chấm để giải thích trực tiếp thuật ngữ chuyên ngành "incapacitation", tăng độ rõ ràng và đa dạng dấu câu.',
        criterion: 'GRA',
      },
      {
        quote: 'Nonetheless, empirical evidence consistently suggests that',
        noteVi:
          'Liên kết tương phản mượt mà kèm cụm từ học thuật có rào chắn (hedging) "consistently suggests".',
        criterion: 'CC',
      },
      {
        quote: 'turn a single lapse into an entrenched criminal career.',
        noteVi:
          'Sự đối lập từ vựng sắc nét giữa "a single lapse" và "an entrenched criminal career" nâng cao điểm Lexical Resource.',
        criterion: 'LR',
      },
      {
        quote: 'Requiring an offender to repair public spaces, attend addiction counselling, or complete vocational training allows them',
        noteVi:
          'Cấu trúc song song gồm ba cụm động từ làm chủ ngữ danh động từ phức hợp, chính xác tuyệt đối về ngữ pháp.',
        criterion: 'GRA',
      },
      {
        quote: 'without severing the social and family anchors that help former offenders reintegrate constructively.',
        noteVi:
          'Lập luận chỉ rõ cơ chế tác động xã hội giúp giải thích vì sao cải tạo cộng đồng giảm tái phạm, tăng chiều sâu TR.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:crime_deter_crime',
      'col:crime_petty_crime',
      'col:crime_the_crime_rate',
      'col:prevention_prevention_strategies',
      'col:evidence_empirical_evidence',
    ],
  },

  {
    id: 'w2:044',
    essayType: 'discussion',
    topic: 'education',
    difficulty: 7,
    prompt:
      'Some educators argue that secondary schools should maintain a broad multidisciplinary curriculum until graduation, while others contend that students should specialise early in vocational subjects linked to employment. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Analyse the benefits of maintaining a broad multidisciplinary secondary curriculum',
      'Analyse the benefits of early vocational specialisation for secondary students',
      'Provide a clear and well-supported personal stance on secondary curriculum design',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'A broad curriculum builds adaptable analytical skills for a shifting labour market.',
        develop:
          'Because automation reshapes entire industries within a decade, graduates grounded in mathematics, literacy, science, and humanities adapt far more easily than peers trained narrowly for one trade.',
      },
      {
        side: 'for',
        idea: 'Adolescents rarely have sufficient self-knowledge at fourteen to choose a lifelong career.',
        develop:
          'Delaying specialisation prevents premature tracking that can trap capable teenagers from disadvantaged backgrounds into lower-paid sectors before their academic interests mature.',
      },
      {
        side: 'for',
        idea: 'Multidisciplinary study strengthens civic literacy and cross-field creativity.',
        develop:
          'Combining historical reasoning, scientific inquiry, and artistic expression prepares citizens to evaluate public debates critically and connect ideas across domains.',
      },
      {
        side: 'against',
        idea: 'Early vocational pathways engage practically minded learners who struggle in purely academic classes.',
        develop:
          'Hands-on training in electrical engineering, culinary arts, or healthcare assistance reduces truancy and gives students tangible pride in mastering real-world craft.',
      },
      {
        side: 'against',
        idea: 'Vocational specialisation eases youth unemployment and fills acute skills shortages.',
        develop:
          'Apprenticeship-linked school tracks enable graduates to enter well-paid technical roles at eighteen without incurring university debt.',
      },
      {
        side: 'against',
        idea: 'Starting technical training earlier allows deeper mastery of complex trades.',
        develop:
          'Fields such as precision manufacturing and renewable-energy installation require thousands of supervised practice hours that short post-school courses cannot easily replicate.',
      },
    ],
    modelText: `Secondary education systems worldwide struggle to balance general intellectual formation against direct preparation for the workplace. While early vocational specialisation offers clear advantages for practically oriented teenagers and employers facing technical shortages, I believe schools should preserve a broad multidisciplinary core throughout secondary study, introducing vocational options only as flexible electives in the final two years.

Advocates of early specialisation make a pragmatic case rooted in student motivation and labour-market demand. Not every adolescent thrives in abstract academic lessons, and forcing disaffected pupils through purely theoretical coursework often leads to chronic disengagement or early school dropout. Allowing fifteen-year-olds to focus on carpentry, software maintenance, electrical engineering, or nursing support can ignite genuine purpose while addressing persistent regional shortages in skilled technical trades. Graduates of structured technical streams also frequently enter stable employment sooner than university peers, avoiding heavy tuition debt while acquiring practical experience valued by regional employers.

However, channelling teenagers into narrow occupational tracks too early carries serious long-term risks. Modern economies evolve rapidly, meaning that specific technical procedures taught at school may become obsolete well before a graduate reaches mid-career. A well-rounded education encompassing languages, quantitative reasoning, natural sciences, and social studies equips young adults with transferable skills—such as critical analysis, structured writing, and quantitative literacy—that remain durable across multiple career shifts. Equally importantly, adolescents\' aptitudes develop unevenly; delaying rigid specialisation ensures that late bloomers are not prematurely closed off from higher education or emerging interdisciplinary professions.

In conclusion, practical training deserves respected status within secondary schooling, particularly for students approaching graduation. Yet keeping a multidisciplinary foundation intact until late adolescence best safeguards both individual career mobility and the adaptability of the wider workforce.`,
    noteSpecs: [
      {
        quote:
          'I believe schools should preserve a broad multidisciplinary core throughout secondary study, introducing vocational options only as flexible electives in the final two years.',
        noteVi:
          'Quan điểm cá nhân cụ thể, khả thi và rõ giới hạn thời điểm áp dụng, vượt xa kiểu nêu ý chung chung.',
        criterion: 'TR',
      },
      {
        quote: 'make a pragmatic case rooted in student motivation and labour-market demand.',
        noteVi:
          'Cụm động từ-danh từ học thuật "make a pragmatic case rooted in..." tóm gọn hai trục lập luận của đoạn một cách sắc nét.',
        criterion: 'LR',
      },
      {
        quote: 'avoiding heavy tuition debt while acquiring practical experience valued by regional employers.',
        noteVi:
          'Kết hợp hai mệnh đề phân từ song song giúp nén hai hệ quả kinh tế-giáo dục vào một câu mạch lạc.',
        criterion: 'GRA',
      },
      {
        quote: 'However, channelling teenagers into narrow occupational tracks too early carries serious long-term risks.',
        noteVi:
          'Câu chủ đề chuyển hướng lập luận sắc bén bằng động từ "channelling", liên kết trực tiếp với đoạn trước.',
        criterion: 'CC',
      },
      {
        quote: 'equips young adults with transferable skills—such as critical analysis, structured writing, and quantitative literacy—that remain durable',
        noteVi:
          'Sử dụng dấu gạch ngang (em-dashes) chèn ví dụ minh họa gọn giữa mệnh đề chính và mệnh đề quan hệ.',
        criterion: 'GRA',
      },
      {
        quote: 'Equally importantly, adolescents\' aptitudes develop unevenly;',
        noteVi:
          'Trạng từ nối kết hợp dấu chấm phẩy dẫn sang luận điểm bổ sung về tâm lý phát triển lứa tuổi rất tự nhiên.',
        criterion: 'CC',
      },
      {
        quote: 'not prematurely closed off from higher education or emerging interdisciplinary professions.',
        noteVi:
          'Collocation chính xác ("prematurely closed off", "interdisciplinary professions") nâng tầm văn phong học thuật.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:curriculum_a_broad_curriculum',
      'col:education_vocational_education',
      'col:skill_transferable_skills',
      'col:skill_vocational_skills',
      'col:education_a_well_rounded_education',
    ],
  },

  {
    id: 'w2:045',
    essayType: 'discussion',
    topic: 'environment',
    difficulty: 7,
    prompt:
      'Some people argue that curbing carbon emissions depends primarily on individuals changing their daily lifestyles, whereas others maintain that only strict government regulation of industry can achieve meaningful reductions. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Examine the argument that individual lifestyle changes are central to reducing emissions',
      'Examine the argument that strict industrial regulation is necessary for meaningful cuts',
      'State and substantiate a clear personal view on the primary driver of emissions reduction',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Aggregated household choices account for a substantial share of consumption-based emissions.',
        develop:
          'When millions of families reduce red-meat consumption, insulate homes, and switch from short-haul flights to rail, cumulative demand for carbon-intensive goods falls noticeably.',
      },
      {
        side: 'for',
        idea: 'Shifting consumer norms creates market and political pressure for greener production.',
        develop:
          'Visible public commitment to low-carbon habits signals to manufacturers and elected leaders that cleaner technologies enjoy commercial demand and electoral backing.',
      },
      {
        side: 'for',
        idea: 'Individual action can begin immediately without waiting for slow legislative cycles.',
        develop:
          'Households can curb electricity waste and adjust travel habits today, whereas international regulatory treaties frequently stall for years.',
      },
      {
        side: 'against',
        idea: 'Heavy industry, power generation, and freight produce the overwhelming bulk of emissions.',
        develop:
          'Steelmaking, cement production, and coal-fired utilities operate at scales that voluntary consumer boycotts cannot realistically decarbonise without binding emission standards.',
      },
      {
        side: 'against',
        idea: 'Ordinary citizens cannot adopt green habits when affordable low-carbon infrastructure is absent.',
        develop:
          'A suburban commuter cannot abandon petrol cars if public transport is unreliable and housing near workplaces remains unaffordable.',
      },
      {
        side: 'against',
        idea: 'Statutory rules prevent environmentally responsible firms from being undercut by polluters.',
        develop:
          'Carbon pricing and mandatory efficiency thresholds create a level competitive field so companies that invest in clean manufacturing are rewarded rather than penalised.',
      },
    ],
    modelText: `Disagreement persists over whether responsibility for combating climate change rests primarily with individual citizens adjusting their daily habits or with governments imposing stringent regulations on polluting industries. Although personal lifestyle shifts help build cultural momentum, I contend that binding industrial regulation is the decisive force capable of cutting emissions at the speed and scale required.

Proponents of individual responsibility rightly note that household consumption ultimately underpins much commercial activity. When large numbers of citizens eat less beef, minimise domestic food waste, and choose public transport over private vehicles, aggregate energy demand declines. Equally significant is the signalling effect: shifting consumption patterns encourage supermarkets, airlines, and appliance makers to offer greener alternatives, while demonstrating to elected officials that ambitious climate policies command genuine public support. Without citizen engagement, even well-designed environmental laws risk facing political backlash.

Nevertheless, placing the main burden on voluntary personal virtue overlooks the structural realities of modern emissions. Heavy manufacturing, electricity generation, and global shipping account for the vast majority of greenhouse gases, and individual consumers exercise little direct control over how steel is smelted or how national grids are powered. Moreover, green choices are frequently constrained by income and infrastructure; residents in car-dependent towns cannot simply cycle to work if safe lanes and regional rail do not exist. Strict statutory measures—such as carbon pricing, mandatory clean-energy quotas, and tough industrial emission standards—tackle pollution at its source and make low-carbon options the affordable default for everyone.

In conclusion, conscientious personal habits reinforce climate action and foster wider political will, yet voluntary restraint alone cannot decarbonise heavy economies. Governments must therefore lead with enforceable industrial regulations that transform energy and manufacturing systems from the top down.`,
    noteSpecs: [
      {
        quote:
          'Although personal lifestyle shifts help build cultural momentum, I contend that binding industrial regulation is the decisive force',
        noteVi:
          'Câu luận điểm dùng mệnh đề nhượng bộ để thừa nhận vai trò cá nhân trước khi khẳng định vai trò quyết định của luật pháp.',
        criterion: 'TR',
      },
      {
        quote: 'Equally significant is the signalling effect:',
        noteVi:
          'Đảo ngữ với tính từ đứng đầu câu ("Equally significant is...") giúp nhấn mạnh ý và thể hiện cấu trúc ngữ pháp Band 8+.',
        criterion: 'GRA',
      },
      {
        quote: 'command genuine public support.',
        noteVi:
          'Collocation chuẩn xác và trang trọng ("command support") thay cho cách viết phổ thông "get support".',
        criterion: 'LR',
      },
      {
        quote: 'Nevertheless, placing the main burden on voluntary personal virtue overlooks the structural realities',
        noteVi:
          'Chuyển đoạn mượt mà, phản biện trực tiếp điểm yếu cốt lõi của quan điểm trước bằng khái niệm "structural realities".',
        criterion: 'CC',
      },
      {
        quote: 'individual consumers exercise little direct control over how steel is smelted or how national grids are powered.',
        noteVi:
          'Ví dụ cụ thể về ngành luyện thép và lưới điện làm rõ lý do hành vi cá nhân bị giới hạn, thuyết phục cao về TR.',
        criterion: 'TR',
      },
      {
        quote: 'tackle pollution at its source and make low-carbon options the affordable default for everyone.',
        noteVi:
          'Kết hợp collocation học thuật với cụm "the affordable default" diễn đạt sắc sảo tác động chính sách.',
        criterion: 'LR',
      },
      {
        quote: 'residents in car-dependent towns cannot simply cycle to work if safe lanes and regional rail do not exist.',
        noteVi:
          'Câu điều kiện loại 1 kết hợp dẫn chứng thực tế về hạ tầng làm rõ rào cản cấu trúc.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:emission_curb_carbon_emissions',
      'col:regulation_stringent_regulations',
      'col:consumption_consumption_patterns',
      'col:pollution_tackle_pollution_at_its_source',
      'col:climate_combat_climate_change',
    ],
  },

  {
    id: 'w2:046',
    essayType: 'discussion',
    topic: 'culture',
    difficulty: 8,
    prompt:
      'Some people argue that cities should preserve historic building facades at all costs, whereas others believe older structures should be demolished to make way for high-density, energy-efficient housing. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Discuss why preserving historic building facades is considered valuable by many citizens',
      'Discuss the case for demolishing older structures to construct energy-efficient housing',
      'Offer a clear, well-reasoned position on how cities should resolve this architectural tension',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Historic streetscapes anchor local identity and collective memory.',
        develop:
          'Distinctive stonework, courtyards, and vernacular roofs differentiate one city from another, countering architectural homogenisation and fostering residents\' civic pride.',
      },
      {
        side: 'for',
        idea: 'Heritage districts sustain cultural tourism and independent local commerce.',
        develop:
          'Walkable historic quarters attract visitors and small craft businesses, generating recurring municipal revenue that generic tower blocks rarely match.',
      },
      {
        side: 'for',
        idea: 'Retaining existing structures avoids the massive embodied carbon released during demolition.',
        develop:
          'Tearing down sturdy masonry buildings and pouring fresh concrete generates substantial upfront emissions that can take decades of operational energy savings to offset.',
      },
      {
        side: 'against',
        idea: 'Older buildings are frequently poorly insulated and expensive to heat or cool.',
        develop:
          'Single-glazed windows and uninsulated brick walls leak thermal energy, inflating household bills and hindering municipal targets for energy efficiency.',
      },
      {
        side: 'against',
        idea: 'Acute urban housing shortages require higher residential density near transit hubs.',
        develop:
          'Replacing low-rise, derelict buildings near city centres with modern apartment blocks expands affordable housing and curbs suburban sprawl.',
      },
      {
        side: 'against',
        idea: 'Preserving every ageing facade freezes cities in the past and inflates property prices.',
        develop:
          'Overly rigid heritage restrictions can turn central districts into exclusive enclaves affordable only to wealthy buyers, pricing out working families.',
      },
    ],
    modelText: `Rapidly growing cities frequently confront a sharp conflict between protecting architectural heritage and meeting urgent demands for affordable, low-carbon housing. While both preservationists and advocates of redevelopment raise compelling concerns, I argue that municipalities should neither preserve every ageing structure indiscriminately nor resort to wholesale demolition; instead, they should protect genuinely significant facades while retrofitting interiors and redeveloping unremarkable sites.

Those who favour clearing older buildings emphasise housing affordability and operational energy efficiency. Many nineteenth-century tenements and low-rise warehouses suffer from damp masonry, inadequate insulation, and inefficient layouts that waste heating fuel and accommodate relatively few households. In cities experiencing severe housing shortages, replacing dilapidated blocks near railway stations with compact, well-insulated apartments enables more families to live close to employment while curbing car-dependent urban sprawl. From this viewpoint, treating every historic street as untouchable risks turning living neighbourhoods into costly open-air museums.

Conversely, defenders of cultural heritage highlight values that new construction cannot replicate. Historic facades embody regional craftsmanship, architectural evolution, and visual continuity, giving urban residents a tangible sense of place that generic glass-and-steel towers seldom provide. Well-preserved historic quarters also underpin thriving independent pedestrian commerce and year-round cultural tourism. Crucially, modern life-cycle sustainability assessments complicate the case for demolition: destroying durable stone or timber buildings wastes the embodied carbon already locked within their materials, whereas deep thermal retrofitting—adding internal insulation, heat pumps, and discreet double glazing—can dramatically cut energy use while keeping historic exteriors intact.

In conclusion, absolute preservation is as imprudent as indiscriminate demolition. By selectively safeguarding buildings of genuine architectural merit through modern retrofitting, while permitting dense, energy-efficient housing on degraded or low-value plots, cities can honour their past without compromising present-day liveability.`,
    noteSpecs: [
      {
        quote:
          'I argue that municipalities should neither preserve every ageing structure indiscriminately nor resort to wholesale demolition; instead, they should protect genuinely significant facades',
        noteVi:
          'Câu luận điểm dùng cấu trúc "neither... nor...; instead..." thể hiện quan điểm sắc sảo, có tiêu chí phân định rõ ràng.',
        criterion: 'TR',
      },
      {
        quote: 'suffer from damp masonry, inadequate insulation, and inefficient layouts',
        noteVi:
          'Từ vựng kiến trúc - đô thị chính xác và giàu hình ảnh cụ thể, giúp lập luận thuyết phục.',
        criterion: 'LR',
      },
      {
        quote: 'treating every historic street as untouchable risks turning living neighbourhoods into costly open-air museums.',
        noteVi:
          'Cách diễn đạt súc tích với hình ảnh "open-air museums" truyền tải rõ hệ quả xã hội của việc bảo tồn cứng nhắc.',
        criterion: 'LR',
      },
      {
        quote: 'Conversely, defenders of cultural heritage highlight values that new construction cannot replicate.',
        noteVi:
          'Trạng từ "Conversely" mở đầu đoạn phản đề gọn gàng, duy trì mạch tương phản rõ nét giữa hai thân bài.',
        criterion: 'CC',
      },
      {
        quote: 'whereas deep thermal retrofitting—adding internal insulation, heat pumps, and discreet double glazing—can dramatically cut energy use',
        noteVi:
          'Cấu trúc mệnh đề đối lập kết hợp phần giải thích kỹ thuật trong dấu gạch ngang thể hiện ngữ pháp và tri thức Band 8+.',
        criterion: 'GRA',
      },
      {
        quote: 'wastes the embodied carbon already locked within their materials,',
        noteVi:
          'Đưa khái niệm "embodied carbon" để phản biện góc độ môi trường của phe phá dỡ giúp lập luận đạt chiều sâu xuất sắc.',
        criterion: 'TR',
      },
      {
        quote: 'By selectively safeguarding buildings of genuine architectural merit through modern retrofitting, while permitting dense, energy-efficient housing',
        noteVi:
          'Cấu trúc giới từ + danh động từ song song tổng hợp giải pháp hài hòa cho toàn bài ở kết luận.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:heritage_cultural_heritage',
      'col:heritage_preserve_heritage',
      'col:efficiency_energy_efficiency',
      'col:housing_affordable_housing',
      'col:development_sustainable_development',
    ],
  },

  {
    id: 'w2:047',
    essayType: 'discussion',
    topic: 'economy',
    difficulty: 8,
    prompt:
      'Some economists argue that developing countries should focus on attracting multinational corporations through tax incentives, while others believe governments should prioritise nurturing domestic small and medium-sized enterprises. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Examine the economic rationale for attracting multinational corporations with tax incentives',
      'Examine the case for prioritising domestic small and medium-sized enterprises',
      'Present and justify a clear personal position on national development strategy',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Multinational corporations inject large-scale capital and advanced production technology quickly.',
        develop:
          'Foreign manufacturing plants introduce modern supply-chain standards, management expertise, and export channels that resource-constrained domestic firms could take decades to build alone.',
      },
      {
        side: 'for',
        idea: 'Large foreign investors generate immediate formal employment and workforce training.',
        develop:
          'Assembly hubs and regional engineering centres absorb thousands of young graduates, equipping local technicians with globally recognised skills.',
      },
      {
        side: 'for',
        idea: 'Anchor multinationals can stimulate clusters of local component suppliers.',
        develop:
          'When foreign electronics or automotive firms establish plants in a region, domestic logistics, packaging, and parts providers frequently expand around them.',
      },
      {
        side: 'against',
        idea: 'Small and medium-sized enterprises circulate wealth more reliably within local communities.',
        develop:
          'Unlike multinational firms that repatriate profits to overseas headquarters, domestic businesses typically reinvest earnings into local wages, regional banks, and neighbourhood services.',
      },
      {
        side: 'against',
        idea: 'Heavy reliance on tax holidays erodes public revenue and invites footloose investment.',
        develop:
          'Once temporary tax breaks expire or wages rise, multinational corporations frequently relocate factories to cheaper jurisdictions, leaving behind stranded workers and depleted treasuries.',
      },
      {
        side: 'against',
        idea: 'A diverse domestic enterprise sector builds long-term economic resilience.',
        develop:
          'Supporting hundreds of independent agri-processors, software studios, and craft manufacturers diversifies exports and shields the economy from shocks hitting a single foreign conglomerate.',
      },
    ],
    modelText: `Policymakers in emerging economies often debate whether rapid industrialisation is best pursued by courting multinational corporations with generous tax breaks or by investing public support in domestic small and medium-sized enterprises. While foreign corporations can accelerate capital inflows and technical transfer in the short run, I believe sustainable national prosperity depends primarily on cultivating a resilient domestic enterprise sector.

Supporters of attracting foreign investment emphasise speed and global integration. Developing countries frequently lack the capital reserves, patented technologies, and international distribution networks needed to compete in high-value export markets. By offering reduced corporate tax rates and streamlined customs zones, governments can entice global manufacturers to build factories, immediately creating formal jobs and training local engineers in modern quality-control standards. In favourable cases, such anchor investments also stimulate domestic subcontracting networks in logistics and component supply.

Yet relying excessively on tax incentives for foreign conglomerates entails considerable structural fragility. Preferential tax holidays deprive treasuries of funds required for roads, grids, and public schools, while fostering an uneven playing field in which local firms shoulder heavier fiscal burdens than wealthy overseas rivals. Furthermore, multinational corporations are inherently mobile: when incentives lapse or neighbouring nations offer lower wages, plants can relocate abruptly, leaving regional workforces exposed. By contrast, nurturing domestic small enterprises through affordable credit, technical advisory centres, and fair procurement rules builds enduring economic roots. Local owners are far more inclined to reinvest profits domestically, diversify regional economies, and remain committed during downturns.

In conclusion, attracting selective foreign investment makes sense when coupled with clear requirements for local training and supplier partnerships. Ultimately, however, governments should place domestic small and medium-sized enterprises at the core of industrial policy so that growth remains inclusive, self-sustaining, and less vulnerable to external corporate shifts.`,
    noteSpecs: [
      {
        quote:
          'While foreign corporations can accelerate capital inflows and technical transfer in the short run, I believe sustainable national prosperity depends primarily on cultivating a resilient domestic enterprise sector.',
        noteVi:
          'Câu luận điểm cân bằng ngắn hạn - dài hạn rất rõ, thiết lập khung lập luận vững chắc cho toàn bài.',
        criterion: 'TR',
      },
      {
        quote: 'entice global manufacturers to build factories, immediately creating formal jobs',
        noteVi:
          'Động từ "entice" giàu sắc thái kết hợp mệnh đề phân từ chỉ hệ quả trực tiếp làm câu gọn và tự nhiên.',
        criterion: 'GRA',
      },
      {
        quote: 'Yet relying excessively on tax incentives for foreign conglomerates entails considerable structural fragility.',
        noteVi:
          'Từ nối tương phản "Yet" kết hợp cụm học thuật "entails considerable structural fragility" tạo lực phản biện mạnh.',
        criterion: 'LR',
      },
      {
        quote: 'fostering an uneven playing field in which local firms shoulder heavier fiscal burdens',
        noteVi:
          'Mệnh đề quan hệ trang trọng "in which" cùng collocation "shoulder heavier fiscal burdens" thể hiện kiểm soát Band 8+.',
        criterion: 'GRA',
      },
      {
        quote: 'By contrast, nurturing domestic small enterprises through affordable credit, technical advisory centres, and fair procurement rules',
        noteVi:
          'Liên kết tương phản dẫn sang giải pháp chính sách cụ thể thay vì nói chung chung "support small businesses".',
        criterion: 'CC',
      },
      {
        quote: 'builds enduring economic roots.',
        noteVi:
          'Diễn đạt cô đọng tương phản trực tiếp với tính di động ("inherently mobile") của tập đoàn đa quốc gia ở câu trước.',
        criterion: 'CC',
      },
      {
        quote: 'when coupled with clear requirements for local training and supplier partnerships.',
        noteVi:
          'Kết bài đề xuất điều kiện ràng buộc thực tế thay vì bác bỏ hoàn toàn FDI, tăng điểm sâu sắc của Task Response.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:investment_attract_foreign_investment',
      'col:growth_sustained_economic_growth',
      'col:growth_inclusive_growth',
      'col:economy_diversify_the_economy',
      'col:stimulate_stimulate_job_creation',
    ],
  },

  {
    id: 'w2:048',
    essayType: 'discussion',
    topic: 'animals',
    difficulty: 9,
    prompt:
      'Some people contend that modern conservation zoos play a vital role in protecting endangered species, whereas others argue that wildlife funding should be directed exclusively towards wild habitat reserves. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Evaluate the conservation and educational arguments for maintaining modern zoos',
      'Evaluate the ecological and ethical arguments for investing solely in wild habitat reserves',
      'Justify a clear personal position on how wildlife conservation funding should be distributed',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Accredited conservation zoos operate captive-breeding programmes that rescue species from extinction.',
        develop:
          'When wild populations collapse due to poaching or disease, coordinated genetic studbooks across zoos maintain viable assurance colonies capable of eventual reintroduction.',
      },
      {
        side: 'for',
        idea: 'Zoos enable controlled veterinary and behavioural research difficult to conduct in remote forests.',
        develop:
          'Close observation allows biologists to develop vaccines, reproductive techniques, and dietary protocols that directly assist threatened wild counterparts.',
      },
      {
        side: 'for',
        idea: 'Direct encounters with live animals cultivate urban public sympathy and charitable donations for conservation.',
        develop:
          'City-dwelling children who observe endangered amphibians or big cats up close often develop stronger environmental empathy than those who only view documentaries.',
      },
      {
        side: 'against',
        idea: 'Wild reserves protect entire interdependent ecosystems rather than isolated charismatic species.',
        develop:
          'Preserving a tropical watershed safeguards thousands of insects, fungi, plants, and predators simultaneously, maintaining ecological balance that enclosures cannot imitate.',
      },
      {
        side: 'against',
        idea: 'Captivity inevitably compromises the welfare of wide-ranging and socially complex animals.',
        develop:
          'Even thoughtfully landscaped enclosures restrict natural foraging, migration, and hunting instincts in species such as elephants and marine mammals, often inducing repetitive stress behaviours.',
      },
      {
        side: 'against',
        idea: 'Captive-bred animals frequently struggle to survive if released into degraded or shrinking habitats.',
        develop:
          'Without secure, connected wild territory and local anti-poaching enforcement, breeding animals in captivity treats a symptom while habitat destruction continues unchecked.',
      },
    ],
    modelText: `As biodiversity loss accelerates across every continent, conservationists increasingly debate whether modern zoos justify their substantial running costs or whether scarce resources should be devoted exclusively to wild habitat reserves. While preserving intact natural ecosystems must clearly receive the vast majority of funding, I contend that strictly accredited conservation zoos retain an indispensable supplementary role that should not be abandoned entirely.

Opponents of captivity advance powerful ecological and ethical arguments. Unlike artificial enclosures, protected wilderness reserves safeguard complete food webs—from soil microbes and pollinators to apex predators—rather than a handful of crowd-pleasing mammals. Moreover, even well-financed zoos struggle to meet the spatial and psychological needs of wide-ranging species such as elephants or polar bears, raising serious animal-welfare concerns. Critics also observe that captive breeding achieves little if cleared forests and polluted rivers leave nowhere viable for animals to return; consequently, funding anti-poaching patrols, wildlife corridors, and community-led land stewardship addresses habitat destruction at its root.

Nevertheless, an exclusive reliance on wild reserves overlooks emergencies in which field protection alone arrives too late. Several critically endangered amphibians, birds, and ungulates have survived sudden disease outbreaks or civil conflict only because accredited zoos maintained genetically managed assurance populations ready for later reintroduction. In addition, veterinary scientists in zoological centres pioneer reproductive treatments and disease diagnostics that subsequently guide field teams working in remote regions. Properly reformed zoos that phase out poorly suited megafauna and focus on threatened regional species also channel visitor revenue directly into overseas habitat conservation.

In conclusion, wild reserves must anchor global efforts to preserve biodiversity, as no enclosure can replace a functioning ecosystem. Rather than eliminating zoos altogether, however, conservation policy should allocate primary funding to habitat protection while supporting high-welfare zoological centres dedicated genuinely to breeding, research, and reintroduction.`,
    noteSpecs: [
      {
        quote:
          'While preserving intact natural ecosystems must clearly receive the vast majority of funding, I contend that strictly accredited conservation zoos retain an indispensable supplementary role',
        noteVi:
          'Mở bài định vị rõ thứ tự ưu tiên ("vast majority" vs "supplementary role") và giới hạn đối tượng ("strictly accredited").',
        criterion: 'TR',
      },
      {
        quote: 'safeguard complete food webs—from soil microbes and pollinators to apex predators—rather than a handful of crowd-pleasing mammals.',
        noteVi:
          'Từ vựng sinh thái học sắc bén kết hợp cấu trúc chêm bằng dấu gạch ngang làm nổi bật sự đối lập giữa hệ sinh thái và loài trưng bày.',
        criterion: 'LR',
      },
      {
        quote: 'consequently, funding anti-poaching patrols, wildlife corridors, and community-led land stewardship addresses habitat destruction at its root.',
        noteVi:
          'Kết nối nguyên nhân-kết quả rõ ràng bằng "consequently" cùng loạt giải pháp thực địa cụ thể.',
        criterion: 'CC',
      },
      {
        quote: 'overlooks emergencies in which field protection alone arrives too late.',
        noteVi:
          'Mệnh đề quan hệ có giới từ "in which" dùng chính xác để chỉ ra giới hạn thực tiễn của phe đối lập.',
        criterion: 'GRA',
      },
      {
        quote: 'genetically managed assurance populations ready for later reintroduction.',
        noteVi:
          'Thuật ngữ bảo tồn học thuật chính xác ("assurance populations", "reintroduction") chứng tỏ độ tinh tế Band 8-9 về LR.',
        criterion: 'LR',
      },
      {
        quote: 'Properly reformed zoos that phase out poorly suited megafauna and focus on threatened regional species',
        noteVi:
          'Mệnh đề quan hệ định nghĩa nêu rõ điều kiện cải tổ vườn thú, nối khéo léo với lo ngại phúc lợi động vật ở thân bài 1.',
        criterion: 'TR',
      },
      {
        quote: 'Rather than eliminating zoos altogether, however, conservation policy should allocate primary funding',
        noteVi:
          'Cấu trúc tương phản "Rather than + V-ing" đặt đầu câu kết tạo điểm nhấn dứt khoát và mạch lạc.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:conservation_wildlife_conservation',
      'col:conservation_habitat_conservation',
      'col:biodiversity_preserve_biodiversity',
      'col:habitat_natural_habitat',
      'col:welfare_safeguard_animal_welfare',
    ],
  },

  {
    id: 'w2:049',
    essayType: 'discussion',
    topic: 'media',
    difficulty: 9,
    prompt:
      'Some people argue that governments should introduce strict statutory regulation to control harmful content on social media platforms, whereas others believe technology companies should remain responsible for self-regulation. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Examine the arguments for strict statutory government regulation of social media platforms',
      'Examine the arguments for allowing technology companies to self-regulate',
      'Present and defend a clear opinion on the most effective governance model',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Commercial engagement models create a built-in conflict of interest for self-regulation.',
        develop:
          'Because advertising revenue rises when users stay emotionally provoked online, platforms face persistent financial pressure to tolerate polarising falsehoods unless legally compelled to act.',
      },
      {
        side: 'for',
        idea: 'Statutory standards ensure transparent accountability and consistent protection for vulnerable users.',
        develop:
          'Independent regulators can audit algorithmic amplification, enforce age-safety safeguards, and impose meaningful penalties when platforms fail to remove illegal harassment or fraud.',
      },
      {
        side: 'for',
        idea: 'Democratic oversight is preferable to leaving speech rules in the hands of unelected executives.',
        develop:
          'When content policies are debated openly in parliament and tested in courts, citizens gain clear rights of appeal rather than facing opaque private suspensions.',
      },
      {
        side: 'against',
        idea: 'Technology companies possess the engineering capacity to respond rapidly to emerging threats.',
        develop:
          'Platform teams can update automated detection tools within hours as new scam tactics or synthetic media appear, whereas parliamentary statutes often take years to amend.',
      },
      {
        side: 'against',
        idea: 'State control over online speech carries severe risks of political censorship.',
        develop:
          'Broadly drafted government laws may be abused to suppress legitimate journalism, satirical commentary, or peaceful civic dissent under the pretext of curbing misinformation.',
      },
      {
        side: 'against',
        idea: 'Fragmented national statutes can stifle innovation and burden smaller digital platforms.',
        develop:
          'Complex local compliance regimes favour dominant incumbents with huge legal departments while discouraging independent community forums from launching.',
      },
    ],
    modelText: `As social media platforms have become primary arenas for news, commerce, and political debate, governments and industry leaders have clashed over how online harm should be policed. While critics of state intervention raise valid warnings about censorship and bureaucratic slowness, I believe independent statutory regulation focused on platform systems—rather than purely voluntary self-regulation—is essential to curb misinformation and protect users.

Supporters of industry self-regulation emphasise technical agility and the preservation of free expression. Digital threats such as coordinated financial scams and synthetic videos evolve far faster than legislative timetables; consequently, engineers operating inside platforms are often best placed to deploy detection tools rapidly. Equally important is the constitutional concern that granting state ministries direct authority over individual posts invites political overreach, potentially intimidating journalists or prompting cautious self-censorship among ordinary citizens. From this perspective, flexible industry codes allow platforms to moderate content across borders without fragmenting the open internet.

However, a decade of voluntary governance has exposed a fundamental structural flaw: platform business models rely on maximising user attention, which frequently rewards outrage and sensational falsehoods. Leaving companies to police themselves therefore asks executives to undermine their own short-term advertising revenue, producing inconsistent enforcement whenever public scrutiny fades. Well-crafted statutory frameworks need not turn governments into arbiters of truth. Instead, legislation can target systemic duties—mandating independent risk audits, transparent appeal mechanisms, verifiable age protections, and meaningful fines for persistent negligence—while leaving individual speech disputes subject to judicial safeguards.

In conclusion, technology firms must retain operational responsibility for day-to-day moderation tools, yet unsupervised self-regulation has proved unequal to commercial incentives. Clear statutory oversight centred on transparency and systemic safety offers the most reliable way to safeguard public discourse without compromising democratic freedoms.`,
    noteSpecs: [
      {
        quote:
          'I believe independent statutory regulation focused on platform systems—rather than purely voluntary self-regulation—is essential',
        noteVi:
          'Luận điểm chính tinh tế: phân biệt rõ giữa quản lý cấp hệ thống (platform systems) với kiểm duyệt nội dung đơn lẻ.',
        criterion: 'TR',
      },
      {
        quote: 'evolve far faster than legislative timetables; consequently, engineers operating inside platforms are often best placed',
        noteVi:
          'Dấu chấm phẩy nối trạng từ liên kết "consequently" cùng cụm phân từ tạo câu ghép mạch lạc, chuẩn mực.',
        criterion: 'GRA',
      },
      {
        quote: 'invites political overreach, potentially intimidating journalists or prompting cautious self-censorship',
        noteVi:
          'Từ vựng chính trị - truyền thông chính xác ("political overreach", "self-censorship") thể hiện chiều sâu LR.',
        criterion: 'LR',
      },
      {
        quote: 'However, a decade of voluntary governance has exposed a fundamental structural flaw:',
        noteVi:
          'Câu chuyển đoạn phản biện trực diện vào động cơ kinh tế cốt lõi, tạo liên kết lập luận chặt chẽ.',
        criterion: 'CC',
      },
      {
        quote: 'Well-crafted statutory frameworks need not turn governments into arbiters of truth.',
        noteVi:
          'Cấu trúc tình thái trang trọng "need not + V" phản bác trực tiếp lo ngại kiểm duyệt ở thân bài 1.',
        criterion: 'GRA',
      },
      {
        quote: 'mandating independent risk audits, transparent appeal mechanisms, verifiable age protections, and meaningful fines',
        noteVi:
          'Chuỗi bốn cụm danh từ song song nêu cơ chế quản lý cụ thể, giúp lập luận thuyết phục và thực tế về TR.',
        criterion: 'TR',
      },
      {
        quote: 'has proved unequal to commercial incentives.',
        noteVi:
          'Cấu trúc học thuật sắc sảo ("proved unequal to") diễn tả sự bất lực của cơ chế tự điều chỉnh rất gọn.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:misinformation_combat_misinformation',
      'col:framework_a_regulatory_framework',
      'col:regulation_enforce_regulations',
      'col:censorship_self_censorship',
      'col:influence_curb_the_influence_of',
    ],
  },

  {
    id: 'w2:050',
    essayType: 'discussion',
    topic: 'energy',
    difficulty: 10,
    prompt:
      'Some energy experts argue that expanding nuclear power is essential to achieve a reliable zero-emission electricity grid, while others contend that nations should rely exclusively on wind and solar power paired with battery storage. Discuss both views and give your own opinion.',
    partsToAddress: [
      'Analyse the arguments supporting nuclear expansion for a reliable zero-emission grid',
      'Analyse the arguments favouring an exclusively wind, solar, and battery-storage transition',
      'Present and defend a clear personal judgement on the optimal low-carbon power mix',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Nuclear reactors provide weather-independent baseload power with minimal land footprint.',
        develop:
          'During prolonged winter wind droughts or overcast weeks, nuclear plants sustain continuous high-density output without requiring vast stretches of countryside or enormous storage reserves.',
      },
      {
        side: 'for',
        idea: 'Existing grid transmission infrastructure integrates firm nuclear output more smoothly.',
        develop:
          'Concentrated dispatchable plants stabilise grid frequency and reduce the need to overbuild long-distance power lines across rural regions.',
      },
      {
        side: 'for',
        idea: 'Decarbonising heavy industry and round-the-clock data centres demands steady zero-carbon power.',
        develop:
          'High-temperature manufacturing and continuous industrial processes face severe cost spikes if electricity reliability falters during seasonal renewable lulls.',
      },
      {
        side: 'against',
        idea: 'Wind and solar projects can be deployed far faster and more cheaply than new nuclear stations.',
        develop:
          'Utility-scale renewables often come online within two to three years at falling capital costs, whereas nuclear reactors frequently suffer decade-long delays and severe budget overruns.',
      },
      {
        side: 'against',
        idea: 'Nuclear power entails unresolved radioactive waste burdens and rare but catastrophic risks.',
        develop:
          'Long-term geological storage of spent fuel remains politically contentious and expensive, while decommissioning ageing reactors commits taxpayers to multi-generational liabilities.',
      },
      {
        side: 'against',
        idea: 'Rapidly advancing storage and interconnected grids increasingly mitigate renewable intermittency.',
        develop:
          'Combining utility batteries, pumped-hydro reservoirs, smart demand management, and cross-regional interconnectors smooths daily fluctuations without nuclear hazards.',
      },
    ],
    modelText: `Decarbonising national electricity grids while preserving uninterrupted supply poses one of the defining engineering dilemmas of the energy transition. While advocates of an exclusively renewable system rightly highlight the tumbling cost and rapid deployment of wind, solar, and battery storage, I maintain that retaining and selectively expanding nuclear capacity alongside renewables provides a more dependable path to zero emissions.

Proponents of a renewables-only grid present a compelling economic and environmental case. Over the past fifteen years, the capital cost of solar panels, wind turbines, and lithium-ion batteries has fallen sharply, allowing regions to add clean capacity within just a few years rather than waiting a decade or more for a nuclear station to clear licensing and construction. Moreover, renewables avoid the thorny problems of long-term radioactive waste disposal, enormous decommissioning bills, and public anxiety over severe reactor accidents. When paired with smart demand shifting, pumped-hydro storage, and cross-border transmission links, wind and solar can supply the majority of annual electricity affordably.

Nevertheless, relying exclusively on weather-dependent generation encounters steep technical and financial hurdles during extended seasonal lulls. Batteries excel at bridging daily peaks, yet storing enough electricity to power an entire industrial economy through two calm, overcast winter weeks would require vast overbuilding of turbines, transmission corridors, and storage facilities—driving up system-wide costs and land-use conflicts. Nuclear power directly offsets this vulnerability by delivering continuous, weather-independent electricity from a remarkably compact footprint, stabilising grid frequency and supporting energy-intensive manufacturing even during prolonged winter anticyclones.

In conclusion, wind and solar paired with modern storage should serve as the fast-growing backbone of global decarbonisation. Yet excluding nuclear power altogether makes the final stretch to zero emissions far costlier and riskier; a balanced portfolio combining rapid renewable expansion with firm nuclear baseload best guarantees both climate ambition and energy security.`,
    noteSpecs: [
      {
        quote:
          'I maintain that retaining and selectively expanding nuclear capacity alongside renewables provides a more dependable path to zero emissions.',
        noteVi:
          'Luận điểm chính rõ ràng và thực tế về mặt kỹ thuật lưới điện, bám sát trục tranh luận "độc quyền tái tạo" vs "kết hợp hạt nhân".',
        criterion: 'TR',
      },
      {
        quote: 'the tumbling cost and rapid deployment of wind, solar, and battery storage,',
        noteVi:
          'Cụm danh từ học thuật súc tích với phân từ "tumbling" chính xác hơn hẳn cách viết "decreasing very fast".',
        criterion: 'LR',
      },
      {
        quote: 'When paired with smart demand shifting, pumped-hydro storage, and cross-border transmission links,',
        noteVi:
          'Mệnh đề trạng ngữ rút gọn (reduced adverbial clause) giúp nén các giải pháp kỹ thuật mượt mà và chính xác.',
        criterion: 'GRA',
      },
      {
        quote: 'Nevertheless, relying exclusively on weather-dependent generation encounters steep technical and financial hurdles',
        noteVi:
          'Chuyển đoạn tương phản trực tiếp vào điểm nghẽn kỹ thuật ("extended seasonal lulls") của hệ thống thuần tái tạo.',
        criterion: 'CC',
      },
      {
        quote: 'driving up system-wide costs and land-use conflicts.',
        noteVi:
          'Phân tích chi phí ở cấp độ toàn hệ thống ("system-wide costs") chứ không chỉ chi phí đơn lẻ thể hiện tư duy sâu sắc cho TR.',
        criterion: 'TR',
      },
      {
        quote: 'delivering continuous, weather-independent electricity from a remarkably compact footprint,',
        noteVi:
          'Từ vựng chuyên ngành năng lượng chính xác và giàu tính đối chiếu ("compact footprint", "grid frequency").',
        criterion: 'LR',
      },
      {
        quote: 'Yet excluding nuclear power altogether makes the final stretch to zero emissions far costlier and riskier;',
        noteVi:
          'Dùng dấu chấm phẩy kết hợp so sánh kép và chốt bằng giải pháp tổng hợp "balanced portfolio" giúp kết bài gọn sắc.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:energy_renewable_energy',
      'col:energy_energy_security',
      'col:energy_energy_transition',
      'col:emission_zero_emissions',
      'col:investment_long_term_investment',
    ],
  },
];

RAW_ITEMS.push(
  // =========================================================================
  // TWO-PART ESSAYS: w2:051 .. w2:060 (difficulties 5 .. 10)
  // =========================================================================
  {
    id: 'w2:051',
    essayType: 'two_part',
    topic: 'psychology',
    difficulty: 5,
    prompt:
      'Perfectionism and fear of failure appear to be rising steadily among university students. Why is this trend occurring, and how can higher education institutions respond effectively?',
    partsToAddress: [
      'Explain the main academic, economic, and social causes behind rising perfectionism among university students',
      'Propose concrete, practical ways universities can respond to protect student well-being',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Intense competition for graduate jobs makes every module grade feel decisive.',
        develop:
          'When employers screen entry-level applicants using rigid degree-classification cut-offs, undergraduates treat a single imperfect mark as a threat to their financial future.',
      },
      {
        side: 'cause',
        idea: 'Social media amplifies constant comparison against curated academic and personal achievements.',
        develop:
          'Seeing peers publicise scholarships, internships, and spotless study routines fosters an unrealistic benchmark that turns ordinary setbacks into personal shame.',
      },
      {
        side: 'cause',
        idea: 'Rising tuition fees heighten pressure to justify family sacrifice with flawless results.',
        develop:
          'Students carrying substantial loans or parental expectations often equate academic excellence with moral obligation, leaving little room for intellectual risk-taking.',
      },
      {
        side: 'solution',
        idea: 'Universities can reform assessment design to reward iterative improvement rather than single high-stakes exams.',
        develop:
          'Low-stakes drafts, formative tutor feedback, and pass-fail foundational modules teach students that revision and error are normal parts of scholarly growth.',
      },
      {
        side: 'solution',
        idea: 'Expanding accessible campus counselling and peer-mentoring normalises asking for help early.',
        develop:
          'Embedding brief cognitive-behavioural workshops within first-year induction programmes reaches perfectionistic students before chronic stress escalates into burnout.',
      },
      {
        side: 'solution',
        idea: 'Lecturers can model intellectual resilience by discussing failed experiments and rejected drafts openly.',
        develop:
          'Hearing respected academics explain how rough early work evolved into published research directly challenges prevailing attitudes that equate competence with effortless perfection.',
      },
    ],
    modelText: `An increasing proportion of university undergraduates report debilitating perfectionism, viewing even minor academic setbacks as proof of personal inadequacy. This trend stems chiefly from intensified economic competition and continuous social comparison, and universities can counter it most effectively by redesigning assessment practices alongside strengthening campus psychological support.

Several interlocking pressures explain why perfectionistic habits have deepened among young adults. First, tighter graduate labour markets and escalating living costs place immense pressure on students to secure top degree classifications, leading many to believe that a single mediocre essay could permanently derail their career prospects. Where families have invested substantial savings in tuition, undergraduates often internalise an acute fear of letting relatives down. Compounding these material anxieties is the pervasive culture of curated online profiles: students are routinely exposed to peers announcing prestigious internships and scholarships while rarely witnessing the rejections behind those milestones. Under such conditions, striving for high standards easily mutates into chronic stress and avoidance.

Higher education institutions are well positioned to interrupt this cycle through both pedagogical and pastoral reform. Academically, departments should reduce reliance on single, all-or-nothing final examinations and expand formative, staged assessments in which students revise drafts after constructive feedback. When grading structures explicitly reward intellectual iteration rather than flawless first attempts, learners become more willing to tackle challenging ideas. Complementing curriculum reform, universities should fund timely counselling services and embed evidence-based stress-management workshops into first-year orientation. Having senior academics speak candidly about rejected grant proposals and flawed early research can further challenge prevailing attitudes that treat mistakes as disqualifying failures.

In conclusion, rising student perfectionism reflects both harsh economic signalling and relentless peer comparison. By pairing fairer, growth-oriented assessment systems with proactive mental well-being support, universities can uphold academic rigour without sacrificing their students\' resilience.`,
    noteSpecs: [
      {
        quote:
          'This trend stems chiefly from intensified economic competition and continuous social comparison, and universities can counter it most effectively by redesigning assessment practices alongside strengthening campus psychological support.',
        noteVi:
          'Câu luận điểm trả lời trọn vẹn cả hai vế đề bài (nguyên nhân + giải pháp của trường đại học) ngay cuối mở bài.',
        criterion: 'TR',
      },
      {
        quote: 'Several interlocking pressures explain why perfectionistic habits have deepened among young adults.',
        noteVi:
          'Câu chủ đề mạch lạc, sử dụng tính từ "interlocking" cho thấy các nguyên nhân tác động cộng hưởng nhau.',
        criterion: 'CC',
      },
      {
        quote: 'Compounding these material anxieties is the pervasive culture of curated online profiles:',
        noteVi:
          'Cấu trúc đảo ngữ với hiện tại phân từ ("Compounding... is...") giúp nối mượt hai nguyên nhân kinh tế và mạng xã hội.',
        criterion: 'GRA',
      },
      {
        quote: 'striving for high standards easily mutates into chronic stress and avoidance.',
        noteVi:
          'Động từ "mutates into" diễn tả chính xác sự biến chất từ cầu toàn lành mạnh sang căng thẳng mãn tính.',
        criterion: 'LR',
      },
      {
        quote: 'through both pedagogical and pastoral reform.',
        noteVi:
          'Cặp tính từ học thuật giáo dục chuẩn Anh ("pedagogical and pastoral") gói gọn hai trụ cột giải pháp của đoạn.',
        criterion: 'LR',
      },
      {
        quote: 'in which students revise drafts after constructive feedback.',
        noteVi:
          'Mệnh đề quan hệ trang trọng "in which" giải thích rõ cơ chế chấm điểm quá trình, tăng độ cụ thể cho Task Response.',
        criterion: 'GRA',
      },
      {
        quote: 'Having senior academics speak candidly about rejected grant proposals and flawed early research',
        noteVi:
          'Biện pháp văn hóa học thuật thực tế và giàu tính sáng tạo, giúp giải pháp không bị sáo mòn.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:well_being_mental_well_being',
      'col:stress_chronic_stress',
      'col:pressure_place_immense_pressure_on',
      'col:attitude_challenge_prevailing_attitudes',
      'col:evaluate_evaluate_academic_performance',
    ],
  },

  {
    id: 'w2:052',
    essayType: 'two_part',
    topic: 'urban',
    difficulty: 6,
    prompt:
      'Many cities have spent substantial public funds building cycle lanes, yet daily bicycle commuting remains low. Why does cycling infrastructure often remain underused, and what measures most effectively encourage residents to commute by bike?',
    partsToAddress: [
      'Identify the infrastructural, safety, and practical reasons why cycle lanes remain underused',
      'Explain the urban planning and policy measures that genuinely encourage everyday bicycle commuting',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Painted lanes without physical barriers fail to protect riders from fast motor traffic.',
        develop:
          'Stripes painted along kerbside parking leave cyclists exposed to opening car doors and aggressive overtaking, deterring families, older riders, and less confident commuters.',
      },
      {
        side: 'cause',
        idea: 'Fragmented networks break down abruptly at busy roundabouts and major junctions.',
        develop:
          'A cycle route is only as safe as its weakest intersection; when protected tracks vanish into multi-lane traffic halfway to the business district, residents revert to driving.',
      },
      {
        side: 'cause',
        idea: 'Lack of secure parking and workplace facilities discourages practical everyday trips.',
        develop:
          'Rampant bicycle theft near train stations and the absence of showers or lockers at offices turn a ten-minute ride into an inconvenient logistical chore.',
      },
      {
        side: 'solution',
        idea: 'Cities should construct continuous, physically segregated cycle networks with protected junctions.',
        develop:
          'Kerb-separated tracks and dedicated cyclist traffic signals create predictable, low-stress corridors connecting residential suburbs seamlessly to schools, shops, and transit hubs.',
      },
      {
        side: 'solution',
        idea: 'Expanding theft-resistant parking and integrating cycling with public transport broadens reach.',
        develop:
          'Guarded indoor bike hubs at suburban railway stations allow commuters living far from the city centre to combine short rides with fast regional trains.',
      },
      {
        side: 'solution',
        idea: 'Traffic-calming policies and e-bike subsidies remove physical and cultural barriers.',
        develop:
          'Lowering residential speed limits while subsidising electric-assist bicycles helps older commuters and residents in hilly towns cultivate a daily cycling habit.',
      },
    ],
    modelText: `Although numerous municipal authorities have invested visibly in cycle lanes to alleviate traffic congestion and curb urban pollution, ridership in many cities remains disappointingly modest. This shortfall usually reflects fragmented, poorly protected infrastructure rather than public apathy, and boosting daily commuting requires building genuinely connected, low-stress networks supported by practical end-of-trip facilities.

The principal reason newly installed cycle lanes sit empty is that many prioritise cosmetic paint over physical safety. Narrow strips wedged between moving lorries and parked cars expose riders to abrupt door openings and hazardous overtaking, leaving only highly confident cyclists willing to use them. Equally damaging is network discontinuity: even an attractive riverside path attracts few commuters if it terminates abruptly at a multi-lane junction two kilometres from major workplaces. Beyond road design, everyday practicalities frequently tip the balance back towards private vehicles. Residents living in flats without ground-floor storage or working in offices lacking secure racks and showers naturally hesitate to risk bicycle theft or arrive dishevelled.

Encouraging sustained modal shift therefore demands treating cycling as a serious component of the wider transport network. Municipal planners must build continuous, kerb-separated tracks that remain physically protected across busy intersections, paired with lower speed limits on neighbouring residential streets. Simultaneously, local governments can multiply commuter adoption by installing guarded bicycle parking hubs at suburban rail interchanges, allowing residents in outer districts to combine cycling seamlessly with public transport. Targeted purchase subsidies for electric-assist bicycles and employer tax incentives for workplace lockers further lower barriers for older commuters and those living in hilly neighbourhoods.

In conclusion, underused cycle lanes are rarely evidence that citizens refuse to cycle; rather, they reveal incomplete safety and missing conveniences. When cities deliver unbroken protected routes alongside secure storage and transit integration, everyday bike commuting grows steadily across all age groups.`,
    noteSpecs: [
      {
        quote:
          'This shortfall usually reflects fragmented, poorly protected infrastructure rather than public apathy, and boosting daily commuting requires building genuinely connected, low-stress networks supported by practical end-of-trip facilities.',
        noteVi:
          'Mở bài chẩn đoán đúng bản chất vấn đề ("fragmented infrastructure" thay vì đổ lỗi cho người dân) và tóm gọn hướng giải quyết.',
        criterion: 'TR',
      },
      {
        quote: 'prioritise cosmetic paint over physical safety.',
        noteVi:
          'Cụm đối lập ngắn gọn, sắc bén ("cosmetic paint" vs "physical safety") thể hiện vốn từ chính xác Band 8+.',
        criterion: 'LR',
      },
      {
        quote: 'Equally damaging is network discontinuity: even an attractive riverside path attracts few commuters if it terminates abruptly',
        noteVi:
          'Đảo ngữ tính từ kết hợp câu điều kiện và dấu hai chấm giải thích cụ thể khiến đoạn phân tích rất chặt chẽ.',
        criterion: 'GRA',
      },
      {
        quote: 'Beyond road design, everyday practicalities frequently tip the balance back towards private vehicles.',
        noteVi:
          'Cụm chuyển tiếp "Beyond road design" mở rộng từ yếu tố đường sá sang tiện ích điểm đến mượt mà.',
        criterion: 'CC',
      },
      {
        quote: 'Encouraging sustained modal shift therefore demands treating cycling as a serious component of the wider transport network.',
        noteVi:
          'Thuật ngữ quy hoạch giao thông "modal shift" nâng cao sắc thái chuyên môn học thuật.',
        criterion: 'LR',
      },
      {
        quote: 'installing guarded bicycle parking hubs at suburban rail interchanges, allowing residents in outer districts to combine cycling seamlessly with public transport.',
        noteVi:
          'Giải pháp kết nối xe đạp - tàu ngoại ô thực tế, dùng mệnh đề phân từ chỉ hệ quả gọn gàng.',
        criterion: 'GRA',
      },
      {
        quote: 'underused cycle lanes are rarely evidence that citizens refuse to cycle; rather, they reveal incomplete safety and missing conveniences.',
        noteVi:
          'Cấu trúc đối lập "rarely...; rather..." chốt lại nguyên nhân gốc rễ đầy sức thuyết phục.',
        criterion: 'CC',
      },
    ],
    usefulCollocationIds: [
      'col:infrastructure_transport_infrastructure',
      'col:infrastructure_inadequate_infrastructure',
      'col:congestion_alleviate_traffic_congestion',
      'col:transport_transport_network',
      'col:habit_cultivate_a_habit',
    ],
  },

  {
    id: 'w2:053',
    essayType: 'two_part',
    topic: 'work',
    difficulty: 6,
    prompt:
      'Employee turnover is persistently high in entry-level service roles such as hospitality and retail. What are the main causes of this high turnover, and would raising wages alone be sufficient to solve the problem?',
    partsToAddress: [
      'Explain the key structural, financial, and workplace factors driving high turnover in entry-level service roles',
      'Evaluate clearly whether higher wages alone can resolve turnover, and identify what else is required',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Unpredictable shift schedules disrupt personal lives, childcare, and study commitments.',
        develop:
          'Zero-hour contracts and last-minute rota changes prevent hospitality and retail workers from budgeting reliably or arranging family care, prompting rapid exits.',
      },
      {
        side: 'cause',
        idea: 'Emotional exhaustion and high physical strain erode employee well-being.',
        develop:
          'Front-line staff routinely absorb customer frustration during understaffed peak hours without adequate rest breaks or supportive supervision.',
      },
      {
        side: 'cause',
        idea: 'Limited training and flat organisational hierarchies offer bleak career prospects.',
        develop:
          'When entry-level employees see no credible path towards supervisory roles or recognised qualifications, they treat service jobs strictly as temporary stopgaps.',
      },
      {
        side: 'for',
        idea: 'Raising hourly pay eases immediate financial stress and makes service work more competitive.',
        develop:
          'Living wages reduce the incentive for trained baristas or sales assistants to jump to neighbouring employers for marginal pay bumps.',
      },
      {
        side: 'against',
        idea: 'Higher pay cannot offset toxic management, chronic understaffing, or chaotic scheduling.',
        develop:
          'Even well-paid staff resign quickly if rosters are issued two days in advance or managers fail to protect them from abusive patrons.',
      },
      {
        side: 'against',
        idea: 'Durable retention requires predictable hours, respectful leadership, and clear progression pathways.',
        develop:
          'Service firms that publish rotas weeks ahead, fund supervisory apprenticeships, and staff shifts adequately retain experienced teams far more reliably than those relying on pay alone.',
      },
    ],
    modelText: `Hospitality venues, supermarkets, and call centres routinely struggle with rapid staff attrition, spending substantial sums recruiting and retraining replacements each quarter. This chronic churn stems from a combination of modest pay, erratic working hours, and scarce advancement opportunities; consequently, while raising wages is a necessary foundation, pay increases alone cannot deliver lasting retention.

High turnover in entry-level service roles reflects structural features of how these workplaces are organised. Naturally, near-minimum hourly rates leave workers vulnerable to rising rents, encouraging them to leave as soon as a slightly better-paid vacancy opens nearby. Yet non-financial pressures are equally decisive. Many retail and catering employers rely on precarious contracts with fluctuating weekly hours and late-notice rotas, making it exceedingly difficult for employees to coordinate childcare, university study, or monthly bills. Add to this the emotional strain of handling impatient customers during chronically understaffed shifts—combined with limited promotion prospects—and it becomes clear why workers treat such positions as temporary stopgaps rather than viable careers.

For these reasons, higher hourly wages would ease attrition only partially. Improved pay undoubtedly signals respect and helps employers attract a wider pool of reliable applicants, reducing immediate exits driven by financial hardship. However, financial incentives cannot compensate indefinitely for exhaustion or disrespect. A hotel receptionist earning a respectable wage is still likely to resign within months if shift patterns remain chaotic, managers overlook workplace harassment, and no structured training exists to build supervisory skills. Genuine retention therefore requires pairing fair pay with predictable advance scheduling, safe staffing ratios, and accredited internal progression ladders.

In conclusion, entry-level service turnover is driven as much by unstable schedules and emotional burnout as by low earnings. Raising wages is an essential first step, yet sustainable workforce stability depends equally on dignified management and credible long-term prospects.`,
    noteSpecs: [
      {
        quote:
          'while raising wages is a necessary foundation, pay increases alone cannot deliver lasting retention.',
        noteVi:
          'Câu luận điểm trả lời dứt khoát câu hỏi thứ hai ("whether higher wages alone solve it") với thái độ cân bằng, có trọng tâm.',
        criterion: 'TR',
      },
      {
        quote: 'rapid staff attrition,',
        noteVi:
          'Từ vựng chuyên ngành nhân sự chính xác ("staff attrition", "chronic churn") giúp tránh lặp cụm "employee turnover".',
        criterion: 'LR',
      },
      {
        quote: 'making it exceedingly difficult for employees to coordinate childcare, university study, or monthly bills.',
        noteVi:
          'Cấu trúc phân từ với chủ ngữ giả "it" chỉ rõ hệ quả đời sống cụ thể của lịch làm việc thất thường.',
        criterion: 'GRA',
      },
      {
        quote: 'Add to this the emotional strain of handling impatient customers during chronically understaffed shifts—combined with limited promotion prospects—and it becomes clear why',
        noteVi:
          'Cấu trúc mệnh lệnh tu từ học thuật ("Add to this... and it becomes clear") tạo độ đa dạng cú pháp ấn tượng.',
        criterion: 'GRA',
      },
      {
        quote: 'For these reasons, higher hourly wages would ease attrition only partially.',
        noteVi:
          'Câu chủ đề đoạn thân bài 2 liên kết chặt nguyên nhân ở đoạn trước với đánh giá giới hạn của giải pháp tăng lương.',
        criterion: 'CC',
      },
      {
        quote: 'pairing fair pay with predictable advance scheduling, safe staffing ratios, and accredited internal progression ladders.',
        noteVi:
          'Liệt kê ba cải cách quản trị thực tiễn làm tròn vế giải pháp bổ trợ, tăng giá trị lập luận cho TR.',
        criterion: 'TR',
      },
      {
        quote: 'is driven as much by unstable schedules and emotional burnout as by low earnings.',
        noteVi:
          'Cấu trúc so sánh ngang bằng "as much by... as by..." tổng kết hai nhóm nguyên nhân súc tích ở phần kết.',
        criterion: 'CC',
      },
    ],
    usefulCollocationIds: [
      'col:employment_precarious_employment',
      'col:prospect_career_prospects',
      'col:well_being_employee_well_being',
      'col:stress_work_related_stress',
      'col:incentive_financial_incentives',
    ],
  },

  {
    id: 'w2:054',
    essayType: 'two_part',
    topic: 'history',
    difficulty: 7,
    prompt:
      'Local historical archives and small regional museums often struggle to attract younger visitors. Why do these institutions appeal so little to young people, and how can local heritage remain relevant to future generations?',
    partsToAddress: [
      'Analyse why local historical archives and regional museums struggle to engage younger audiences',
      'Propose practical ways to keep local heritage accessible, engaging, and relevant for future generations',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Static, text-heavy displays fail to engage audiences accustomed to interactive digital media.',
        develop:
          'Glass cases packed with faded deeds and dense captions rarely convey the human drama behind local artefacts, making visits feel passive and remote.',
      },
      {
        side: 'cause',
        idea: 'Restrictive weekday opening hours and intimidating entry procedures deter casual young visitors.',
        develop:
          'Many municipal archives close before five o\'clock on weekdays and require advance reader permits, excluding students and young workers who have free time mainly at weekends.',
      },
      {
        side: 'cause',
        idea: 'Narrow curatorial narratives often overlook everyday working-class and diverse community histories.',
        develop:
          'When exhibits focus solely on civic dignitaries or distant centuries, teenagers struggle to see how local history connects to their own streets, families, and contemporary identity.',
      },
      {
        side: 'solution',
        idea: 'Digitising collections and creating interactive storytelling brings archives into everyday digital spaces.',
        develop:
          'Searchable street-map timelines, short documentary podcasts, and augmented-reality walking tours allow young residents to explore historic photographs on the exact corners where events occurred.',
      },
      {
        side: 'solution',
        idea: 'Co-curating exhibitions with local schools and youth groups builds active ownership.',
        develop:
          'Inviting secondary students to record oral histories from elderly neighbours turns passive visitors into contributors who value intangible heritage.',
      },
      {
        side: 'solution',
        idea: 'Linking historical themes to contemporary local issues makes past records immediately meaningful.',
        develop:
          'Exhibitions tracing how a town previously navigated flood defences, housing shifts, or industrial transitions spark lively debate among young citizens.',
      },
    ],
    modelText: `Across many towns and regional centres, municipal archives and small historical museums preserve irreplaceable records of community life yet welcome remarkably few visitors under thirty. This disengagement arises largely from outdated presentation styles, inconvenient access, and narratives that feel detached from contemporary concerns; keeping local heritage alive therefore requires combining thoughtful digital outreach with active community participation.

Young residents rarely avoid local archives out of indifference to the past itself; rather, traditional institutional formats erect unnecessary barriers. Many regional repositories operate only during weekday office hours, require formal registration to inspect fragile folders, and present exhibits through static glass cabinets accompanied by dense, specialist labels. For a generation fluent in visual and interactive storytelling, such environments can feel austere and exclusionary. Equally problematic is curatorial focus: when collections emphasise administrative treaties or elite portraits while neglecting everyday working lives, migration stories, and recent decades, younger citizens struggle to recognise any link between archived material and the neighbourhoods they inhabit today.

Ensuring that cultural heritage remains relevant demands meeting younger audiences both technologically and socially. First, archives can harness technology to liberate collections from basement reading rooms—building open-access digital maps that layer century-old street photographs over current town layouts, or producing concise audio walking tours narrated by local voices. Second, museums should shift from unilateral display to co-creation. Partnering with secondary schools and youth clubs to record oral histories from older residents or curate exhibitions on local music, sport, and urban change transforms teenagers from reluctant spectators into active custodians. Extending evening hours and hosting informal workshops can further recast archives as welcoming civic hubs.

In conclusion, low youth attendance reflects rigid access and distant storytelling rather than declining curiosity about history. By digitising records creatively and inviting young people to help document living community memory, regional institutions can preserve heritage meaningfully for future generations.`,
    noteSpecs: [
      {
        quote:
          'keeping local heritage alive therefore requires combining thoughtful digital outreach with active community participation.',
        noteVi:
          'Câu luận điểm nêu rõ cả nguyên nhân lẫn hai trụ cột giải pháp (công nghệ số + sự đồng tham gia cộng đồng).',
        criterion: 'TR',
      },
      {
        quote: 'Young residents rarely avoid local archives out of indifference to the past itself; rather, traditional institutional formats erect unnecessary barriers.',
        noteVi:
          'Mở đoạn bằng cách bác bỏ giả định phổ biến rồi nêu nguyên nhân cấu trúc, tạo góc nhìn phân tích sắc sảo.',
        criterion: 'CC',
      },
      {
        quote: 'such environments can feel austere and exclusionary.',
        noteVi:
          'Cặp tính từ học thuật chính xác ("austere and exclusionary") diễn tả cảm giác xa cách tốt hơn nhiều so với "boring".',
        criterion: 'LR',
      },
      {
        quote: 'liberate collections from basement reading rooms—building open-access digital maps that layer century-old street photographs over current town layouts,',
        noteVi:
          'Ví dụ công nghệ cụ thể và giàu tính thực tế kết hợp mệnh đề phân từ và mệnh đề quan hệ mượt mà.',
        criterion: 'GRA',
      },
      {
        quote: 'transforms teenagers from reluctant spectators into active custodians.',
        noteVi:
          'Cặp danh từ tương phản học thuật ("reluctant spectators" vs "active custodians") nâng cao điểm Lexical Resource.',
        criterion: 'LR',
      },
      {
        quote: 'Extending evening hours and hosting informal workshops can further recast archives as welcoming civic hubs.',
        noteVi:
          'Chủ ngữ cụm danh động từ ghép gọn gàng, đưa ra giải pháp hành chính bổ trợ sát thực tế.',
        criterion: 'GRA',
      },
      {
        quote: 'inviting young people to help document living community memory,',
        noteVi:
          'Chạm đúng khía cạnh di sản sống ("living community memory") gắn kết trực tiếp với câu hỏi "how heritage can stay relevant".',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:heritage_cultural_heritage',
      'col:heritage_preserve_heritage',
      'col:heritage_intangible_heritage',
      'col:technology_harness_technology',
      'col:awareness_foster_awareness_among',
    ],
  },

  {
    id: 'w2:055',
    essayType: 'two_part',
    topic: 'technology',
    difficulty: 7,
    prompt:
      'Consumers frequently replace smartphones, laptops, and household appliances even while their existing devices still function. Why does this rapid replacement occur, and what policies can governments adopt to promote repairability?',
    partsToAddress: [
      'Explain the commercial, technical, and psychological factors driving premature replacement of electronics',
      'Detail concrete public policies that promote device repairability and extend product lifespans',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Hardware design choices make minor repairs expensive or technically impractical.',
        develop:
          'Glued batteries, proprietary screws, and soldered memory modules mean a worn power cell often costs nearly as much to replace as buying a discounted newer model.',
      },
      {
        side: 'cause',
        idea: 'Short software-support cycles render physically sound devices insecure or incompatible.',
        develop:
          'When manufacturers halt operating-system security patches after just three years, banking apps stop working and cautious users feel forced to upgrade.',
      },
      {
        side: 'cause',
        idea: 'Aggressive annual marketing and contract upgrades normalise constant novelty.',
        develop:
          'Telecom instalments bundled with annual trade-in offers obscure the true purchase price and frame two-year-old devices as socially outdated.',
      },
      {
        side: 'solution',
        idea: 'Enacting binding right-to-repair laws guarantees spare parts and diagnostic manuals.',
        develop:
          'Requiring manufacturers to supply affordable replacement batteries, screens, and schematics to independent repair shops for at least seven years restores healthy competition.',
      },
      {
        side: 'solution',
        idea: 'Mandating minimum software-support durations and modular design standards extends longevity.',
        develop:
          'Clear statutory rules on user-replaceable batteries and multi-year security updates prevent premature digital obsolescence.',
      },
      {
        side: 'solution',
        idea: 'Introducing visible repairability scores and tax relief on repair services shifts consumer behaviour.',
        develop:
          'Labelling products with an official durability index alongside lowering value-added tax on licensed repairs rewards manufacturers who build lasting goods.',
      },
    ],
    modelText: `Modern households discard functioning smartphones, tablets, and domestic appliances at an accelerating pace, fuelling a mounting global stream of electronic waste. This premature turnover is driven less by genuine mechanical breakdown than by deliberate design constraints, curtailed software support, and persuasive upgrade marketing; accordingly, governments should intervene with binding right-to-repair regulations and targeted fiscal incentives.

Several commercial practices actively steer buyers towards replacement over maintenance. Manufacturers increasingly seal devices with industrial adhesives, proprietary fasteners, and serialised components that prevent independent technicians from fitting generic spare parts. Consequently, replacing a degraded battery or cracked screen at an authorised centre can approach half the cost of a new appliance, making disposal appear economically rational to budget-conscious families. Equally significant is software-driven obsolescence: when companies cease issuing security patches after three or four years, perfectly serviceable electronics become vulnerable or incompatible with essential applications. Reinforced by telecom contracts that bundle biennial upgrades into monthly tariffs, these hurdles train consumers to regard electronics as disposable consumables.

To cultivate a circular economy, policymakers must alter incentives across both design and retail stages. Crucially, governments can implement strict regulations mandating modular, user-accessible batteries, minimum seven-year availability of reasonably priced spare parts, and guaranteed multi-year security updates. Opening technical manuals and diagnostic software to independent local repairers would immediately curb repair costs and stimulate skilled neighbourhood trades. Complementing these legal duties, mandatory point-of-sale repairability labels—paired with reduced tax rates or repair vouchers for households—would empower shoppers to reward durable engineering while pressuring brands to compete on longevity rather than annual cosmetic tweaks.

In conclusion, consumers replace working electronics largely because industry design and pricing make keeping them needlessly difficult. Through enforceable right-to-repair standards, extended software mandates, and transparent durability labelling, governments can dramatically prolong device lifespans and curb electronic waste.`,
    noteSpecs: [
      {
        quote:
          'This premature turnover is driven less by genuine mechanical breakdown than by deliberate design constraints, curtailed software support, and persuasive upgrade marketing;',
        noteVi:
          'Câu luận điểm dùng cấu trúc so sánh "less by... than by..." chẩn đoán sắc nét ba nguyên nhân hệ thống ngay mở bài.',
        criterion: 'TR',
      },
      {
        quote: 'industrial adhesives, proprietary fasteners, and serialised components',
        noteVi:
          'Thuật ngữ kỹ thuật sản phẩm chính xác và cụ thể, tăng mạnh độ thuyết phục và điểm Lexical Resource.',
        criterion: 'LR',
      },
      {
        quote: 'making disposal appear economically rational to budget-conscious families.',
        noteVi:
          'Mệnh đề phân từ giải thích vì sao người tiêu dùng lý trí vẫn chọn vứt bỏ, nối nhân-quả rất chặt.',
        criterion: 'GRA',
      },
      {
        quote: 'Equally significant is software-driven obsolescence:',
        noteVi:
          'Đảo ngữ chuyển sang nguyên nhân thứ hai (lỗi thời phần mềm) mạch lạc, tránh dùng "Secondly" máy móc.',
        criterion: 'CC',
      },
      {
        quote: 'Reinforced by telecom contracts that bundle biennial upgrades into monthly tariffs, these hurdles train consumers',
        noteVi:
          'Mệnh đề phân từ quá khứ đầu câu kết hợp mệnh đề quan hệ gộp khéo léo yếu tố hợp đồng viễn thông.',
        criterion: 'GRA',
      },
      {
        quote: 'Opening technical manuals and diagnostic software to independent local repairers would immediately curb repair costs and stimulate skilled neighbourhood trades.',
        noteVi:
          'Chỉ ra lợi ích kép (giảm giá sửa + tạo việc làm tay nghề địa phương) giúp chính sách đề xuất giàu sức nặng về TR.',
        criterion: 'TR',
      },
      {
        quote: 'compete on longevity rather than annual cosmetic tweaks.',
        noteVi:
          'Sự đối lập từ vựng tinh tế ("longevity" vs "annual cosmetic tweaks") làm nổi bật tác động thị trường của chính sách.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:waste_electronic_waste',
      'col:technology_obsolete_technology',
      'col:behaviour_modify_consumer_behaviour',
      'col:economy_a_circular_economy',
      'col:implement_implement_strict_regulations',
    ],
  },

  {
    id: 'w2:056',
    essayType: 'two_part',
    topic: 'globalisation',
    difficulty: 8,
    prompt:
      'Despite the dominance of inexpensive mass-produced goods, traditional artisanal crafts continue to survive in many economies. Why do these handmade crafts endure, and should governments subsidise traditional artisans?',
    partsToAddress: [
      'Explain the cultural, aesthetic, and economic reasons why artisanal crafts survive alongside mass production',
      'Evaluate whether governments should provide subsidies to traditional artisans and justify a clear stance',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Factory standardisation fuels consumer desire for authenticity and individuality.',
        develop:
          'As global retail chains sell identical mass-manufactured items across continents, discerning buyers willingly pay premiums for hand-thrown ceramics or woven textiles carrying visible human skill.',
      },
      {
        side: 'cause',
        idea: 'Artisanal goods embody local cultural heritage, provenance, and durable craftsmanship.',
        develop:
          'Traditional joinery, leatherwork, and hand-dyed fabrics frequently outlast cheap synthetic alternatives while connecting owners and tourists to regional stories.',
      },
      {
        side: 'cause',
        idea: 'Digital marketplaces enable rural craftspeople to reach niche global buyers directly.',
        develop:
          'Online storefronts and direct shipping bypass costly retail intermediaries, allowing small workshops to sustain viable margins without scaling up to industrial volume.',
      },
      {
        side: 'for',
        idea: 'Targeted public support prevents irreplaceable technical skills from disappearing permanently.',
        develop:
          'Funding master-apprentice stipends helps safeguard centuries-old weaving, masonry, or lacquerware techniques that cannot be reconstructed once the last generation of elders retires.',
      },
      {
        side: 'against',
        idea: 'Open-ended cash subsidies can shield uncompetitive workshops from adapting to modern tastes.',
        develop:
          'Permanent operational handouts drain public budgets needed for healthcare or schools and may encourage dependency rather than creative evolution.',
      },
      {
        side: 'neutral',
        idea: 'Indirect structural backing—such as apprenticeships and geographical indications—outperforms direct handouts.',
        develop:
          'Protecting regional craft trademarks, offering shared studio equipment, and funding training grants preserves heritage while keeping artisans responsive to real market demand.',
      },
    ],
    modelText: `Economic globalisation has flooded retail markets with affordable, factory-made products, yet handwoven textiles, studio pottery, and traditional metalwork continue to endure across both industrialised and developing nations. These crafts survive primarily because mass standardisation sharpens appetite for authenticity and durability, and while governments should not hand out open-ended operating subsidies, targeted public investment in apprenticeships and legal protection is well justified.

Ironically, the very success of industrial manufacturing helps sustain a loyal niche for handmade work. As multinational chains distribute identical clothing and furniture from one continent to another, the homogenising effect of globalisation leaves many consumers seeking objects with distinct provenance, tactile quality, and ethical transparency. Handcrafted goods often outlast disposable factory substitutes and serve as tangible expressions of regional cultural heritage, prized by both local households and international travellers. Simultaneously, digital commerce has lowered geographic barriers: a woodcarver in a remote mountain valley can now market directly to collectors worldwide without relying on exploitative middlemen, rendering small-scale production far more viable than in previous decades.

Whether taxpayers should subsidise artisans, however, requires careful distinction between preserving living skills and propping up unviable businesses. Granting permanent cash subsidies simply to cover workshop losses risks fostering dependency and diverting scarce public funds from essential services such as education or infrastructure. Instead, governments should deploy selective, capacity-building support. Financing master-apprentice stipends ensures that intricate techniques are transmitted before ageing craftspeople retire, while enforcing geographical-indication trademarks shields authentic local wares from factory imitations. Shared municipal workshops and export-marketing clinics can further help artisans adapt traditional forms to contemporary uses without insulating them from consumer demand.

In conclusion, artisanal crafts persist because human craftsmanship offers meaning and longevity that assembly lines cannot replicate. Rather than paying indefinite subsidies, states should invest in training, trademark protection, and market access so that traditional skills remain both culturally vibrant and commercially self-reliant.`,
    noteSpecs: [
      {
        quote:
          'while governments should not hand out open-ended operating subsidies, targeted public investment in apprenticeships and legal protection is well justified.',
        noteVi:
          'Câu luận điểm phân tách rõ giữa trợ cấp trực tiếp kéo dài (không nên) và đầu tư có mục tiêu (nên), nâng chiều sâu Task Response.',
        criterion: 'TR',
      },
      {
        quote: 'Ironically, the very success of industrial manufacturing helps sustain a loyal niche for handmade work.',
        noteVi:
          'Trạng từ bình luận "Ironically" mở đầu thân bài 1 sắc sảo, chỉ ra nghịch lý kinh tế-văn hóa hấp dẫn.',
        criterion: 'CC',
      },
      {
        quote: 'objects with distinct provenance, tactile quality, and ethical transparency.',
        noteVi:
          'Chuỗi cụm danh từ học thuật tinh tế ("provenance", "tactile quality") mô tả chính xác giá trị thủ công mỹ nghệ.',
        criterion: 'LR',
      },
      {
        quote: 'rendering small-scale production far more viable than in previous decades.',
        noteVi:
          'Mệnh đề phân từ dùng động từ "render + O + adj" học thuật gọn gàng và chuẩn xác ngữ pháp.',
        criterion: 'GRA',
      },
      {
        quote: 'Whether taxpayers should subsidise artisans, however, requires careful distinction between preserving living skills and propping up unviable businesses.',
        noteVi:
          'Mệnh đề danh từ làm chủ ngữ ("Whether...") chuyển sang câu hỏi thứ hai tự nhiên và chặt chẽ.',
        criterion: 'GRA',
      },
      {
        quote: 'enforcing geographical-indication trademarks shields authentic local wares from factory imitations.',
        noteVi:
          'Đề xuất công cụ pháp lý "geographical-indication trademarks" cực kỳ xác đáng cho bài về toàn cầu hóa và làng nghề.',
        criterion: 'TR',
      },
      {
        quote: 'remain both culturally vibrant and commercially self-reliant.',
        noteVi:
          'Cặp tính từ đối xứng chốt bài mạch lạc, gói gọn hai mục tiêu văn hóa và kinh tế.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:globalisation_the_homogenising_effect_of_globalisation',
      'col:globalisation_economic_globalisation',
      'col:heritage_cultural_heritage',
      'col:subsidy_grant_subsidies_to',
      'col:diversity_preserve_diversity',
    ],
  },

  {
    id: 'w2:057',
    essayType: 'two_part',
    topic: 'health',
    difficulty: 8,
    prompt:
      'Access to urban green spaces is widely linked to stronger mental resilience among city residents. Why do parks and planted areas have this psychological benefit, and how should urban planners prioritise greenery in densely populated districts?',
    partsToAddress: [
      'Explain the psychological, physiological, and social mechanisms through which urban green spaces boost mental resilience',
      'Outline realistic planning strategies for integrating and prioritising greenery within dense urban districts',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Natural environments restore depleted cognitive attention and lower physiological stress.',
        develop:
          'Tree canopies, birdsong, and soft visual textures quiet the constant sensory vigilance required by traffic and crowds, helping reduce cortisol levels and mental fatigue.',
      },
      {
        side: 'cause',
        idea: 'Accessible parks encourage casual physical activity and restorative social contact.',
        develop:
          'Shaded footpaths and community gardens prompt daily walking and informal neighbourhood exchanges, buffering isolated flat-dwellers against anxiety and loneliness.',
      },
      {
        side: 'cause',
        idea: 'Urban vegetation cools overheated streets and dampens disruptive noise.',
        develop:
          'By moderating summer heat islands and buffering traffic roar, planted corridors improve sleep quality and daily emotional equilibrium.',
      },
      {
        side: 'solution',
        idea: 'Planners can weave pocket parks and shaded linear corridors into underused street space.',
        develop:
          'Converting surplus tarmac intersections, canal embankments, and redundant surface car parks into small green squares brings nature within a five-minute walk without demolishing housing.',
      },
      {
        side: 'solution',
        idea: 'Requiring green roofs, planted courtyards, and street trees in new developments embeds greenery vertically.',
        develop:
          'Binding municipal zoning rules ensure high-density apartment blocks contribute shared vegetated terraces rather than sealing every square metre in concrete.',
      },
      {
        side: 'solution',
        idea: 'Public budgets must prioritise equitable green investment in lower-income dense neighbourhoods.',
        develop:
          'Mapping tree-canopy deficits lets councils direct planting funds towards overcrowded districts with the least private garden space rather than embellishing already leafy suburbs.',
      },
    ],
    modelText: `As metropolitan populations concentrate into high-rise neighbourhoods, urban parks and tree-lined streets are increasingly recognised as essential public-health assets rather than ornamental luxuries. Natural spaces strengthen mental resilience by easing sensory overload and nurturing everyday social connection, and planners in dense districts can prioritise them effectively through distributed pocket parks, green building mandates, and equity-led investment.

The psychological value of urban greenery operates through both biological and social pathways. Dense cities demand relentless directed attention as residents navigate noisy traffic, crowded pavements, and constant digital alerts; stepping beneath a leafy canopy interrupts this strain, allowing overstimulated minds to recover and measurably alleviating stress. Vegetation also moderates urban heat and softens mechanical noise, indirectly supporting calmer moods and better sleep. Equally vital is the civic dimension: unlike commercial venues that require spending money, public gardens offer inclusive neutral ground where neighbours exercise, watch children play, and exchange brief greetings. Over time, these low-key encounters counter urban isolation and build the emotional resilience needed to weather personal setbacks.

Delivering these benefits inside tightly packed districts where vacant land is scarce requires creative spatial planning rather than waiting for vast central parks. Instead of relying solely on large flagship reserves, councils should stitch together a fine-grained network of pocket parks, reclaimed parking bays, and planted pedestrian corridors so every household lives within a short walk of trees. Zoning codes for new high-density housing can simultaneously mandate shared green courtyards, vegetated rooftops, and continuous street-tree planting. Crucially, municipal budgets should target tree-canopy gaps in lower-income wards first, ensuring equitable access to restorative greenery where residents seldom possess private gardens.

In conclusion, urban nature fortifies mental health by calming physiological stress and anchoring neighbourhood belonging. By repurposing compact street spaces, enforcing green building standards, and prioritising underserved districts, planners can achieve sustainable urbanisation without sacrificing psychological well-being.`,
    noteSpecs: [
      {
        quote:
          'Natural spaces strengthen mental resilience by easing sensory overload and nurturing everyday social connection, and planners in dense districts can prioritise them effectively through distributed pocket parks, green building mandates, and equity-led investment.',
        noteVi:
          'Câu luận điểm trả lời đầy đủ cả hai vế đề bài với cấu trúc rõ ràng, báo trước mạch nội dung hai thân bài.',
        criterion: 'TR',
      },
      {
        quote: 'rather than ornamental luxuries.',
        noteVi:
          'Cụm danh từ học thuật súc tích đối lập hiệu quả với "public-health assets" ngay câu mở đầu.',
        criterion: 'LR',
      },
      {
        quote: 'stepping beneath a leafy canopy interrupts this strain, allowing overstimulated minds to recover and measurably alleviating stress.',
        noteVi:
          'Dùng chủ ngữ danh động từ kết hợp hai cụm phân từ song song miêu tả cơ chế giảm căng thẳng mượt mà.',
        criterion: 'GRA',
      },
      {
        quote: 'Equally vital is the civic dimension: unlike commercial venues that require spending money, public gardens offer inclusive neutral ground',
        noteVi:
          'Đảo ngữ nhấn mạnh góc nhìn xã hội ("civic dimension") kèm so sánh đối chiếu sắc nét với không gian thương mại.',
        criterion: 'CC',
      },
      {
        quote: 'stitch together a fine-grained network of pocket parks, reclaimed parking bays, and planted pedestrian corridors',
        noteVi:
          'Động từ hình ảnh học thuật "stitch together" kết hợp từ vựng quy hoạch đô thị chính xác giải bài toán thiếu đất.',
        criterion: 'LR',
      },
      {
        quote: 'target tree-canopy gaps in lower-income wards first, ensuring equitable access to restorative greenery',
        noteVi:
          'Đề xuất tiêu chí ưu tiên theo công bằng xã hội ("tree-canopy gaps in lower-income wards") giải quyết trực diện từ khóa "prioritise".',
        criterion: 'TR',
      },
      {
        quote: 'By repurposing compact street spaces, enforcing green building standards, and prioritising underserved districts,',
        noteVi:
          'Cấu trúc song song ba cụm danh động từ tổng kết gọn gàng ba chiến lược quy hoạch ở kết bài.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:health_mental_health',
      'col:stress_alleviate_stress',
      'col:well_being_promote_well_being',
      'col:urbanisation_sustainable_urbanisation',
      'col:access_equitable_access_to',
    ],
  },

  {
    id: 'w2:058',
    essayType: 'two_part',
    topic: 'transport',
    difficulty: 9,
    prompt:
      'Overnight sleeper trains are experiencing a notable revival across several regions after decades of decline. Why are night trains regaining popularity, and what factors still limit their wider expansion?',
    partsToAddress: [
      'Explain the environmental, practical, and experiential reasons behind the revival of overnight rail travel',
      'Analyse the infrastructural, financial, and operational barriers that limit broader expansion of night trains',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Growing climate awareness pushes travellers to seek low-carbon alternatives to short-haul flights.',
        develop:
          'Electric sleeper services emit a small fraction of the carbon generated by regional aviation, appealing to environmentally conscious holidaymakers and corporate sustainability policies.',
      },
      {
        side: 'cause',
        idea: 'Overnight city-centre-to-city-centre travel saves daytime hours and hotel costs.',
        develop:
          'Passengers avoid lengthy suburban airport transfers and security queues, waking rested in the heart of a destination city without forfeiting a productive workday.',
      },
      {
        side: 'cause',
        idea: 'Modernised cabins and slower travel culture enhance comfort and appeal.',
        develop:
          'Private mini-cabins, quieter carriages, and reliable onboard connectivity have transformed sleeper rail from a cramped budget option into a restorative experience.',
      },
      {
        side: 'against',
        idea: 'High rolling-stock costs and low daily utilisation squeeze operator profitability.',
        develop:
          'Unlike daytime express trains that complete several return trips daily, sleeper carriages make only one revenue-earning journey every twenty-four hours while carrying fewer passengers per coach.',
      },
      {
        side: 'against',
        idea: 'Night trains compete for track slots with freight services and overnight engineering maintenance.',
        develop:
          'Railways rely heavily on nocturnal hours to move cargo and repair ageing tracks, creating bottlenecks that cause delays or restrict route frequency.',
      },
      {
        side: 'against',
        idea: 'Cross-border technical incompatibilities and aviation tax advantages complicate expansion.',
        develop:
          'Differing signalling systems, voltage standards, and fragmented ticketing across borders raise costs, while untaxed jet fuel keeps budget flights artificially cheaper.',
      },
    ],
    modelText: `After shrinking steadily for decades in the face of budget airlines and daytime high-speed rail, overnight sleeper trains are enjoying a striking revival across several continents. This renewed appeal reflects rising climate consciousness alongside the practical convenience of city-centre overnight travel, yet substantial economic, infrastructural, and regulatory hurdles continue to constrain wider expansion.

Several converging shifts explain why passengers are returning to night trains. Foremost is environmental concern: electric rail produces far lower emissions per kilometre than regional aviation, prompting both leisure travellers and employers with strict carbon budgets to substitute sleeper routes for short-haul flights. Practical efficiency reinforces this green motivation. Boarding a train in one city centre at dusk and stepping out in another shortly after dawn eliminates suburban airport transfers, early-morning security queues, and a night\'s hotel expenditure. Meanwhile, newly refurbished carriages featuring private sleeping pods and calmer interiors have shed the cramped reputation of older stock, attracting travellers who value unhurried comfort.

Despite surging demand, scaling sleeper networks remains remarkably difficult. Financially, night trains face an inherent utilisation disadvantage: whereas a daytime intercity train can run multiple high-capacity trips daily, a sleeper set earns revenue on just one overnight run while accommodating far fewer passengers per carriage. Operational bottlenecks compound these margins. Nocturnal tracks are heavily contested by essential freight corridors and vital engineering maintenance, leaving limited capacity for reliable passenger timetables. On international routes, operators must also navigate mismatched signalling equipment, different electrical voltages, and fragmented booking platforms—all while competing against budget airlines that still benefit from tax-exempt aviation fuel.

In conclusion, night trains are regaining favour because they align low-carbon mobility with seamless overnight convenience. Expanding them from niche showcase routes into a mainstream transport network, however, will require coordinated cross-border standards, upgraded track capacity, and fairer tax parity with short-haul aviation.`,
    noteSpecs: [
      {
        quote:
          'This renewed appeal reflects rising climate consciousness alongside the practical convenience of city-centre overnight travel, yet substantial economic, infrastructural, and regulatory hurdles continue to constrain wider expansion.',
        noteVi:
          'Mở bài tóm gọn rõ ràng hai vế của đề (động lực hồi sinh + ba nhóm rào cản mở rộng), tạo định hướng mạch lạc.',
        criterion: 'TR',
      },
      {
        quote: 'Foremost is environmental concern:',
        noteVi:
          'Đảo ngữ ngắn gọn kết hợp dấu hai chấm dẫn trực tiếp vào nguyên nhân hàng đầu, văn phong trang trọng chuẩn Band 8+.',
        criterion: 'GRA',
      },
      {
        quote: 'have shed the cramped reputation of older stock,',
        noteVi:
          'Động từ "shed" kết hợp thuật ngữ đường sắt "stock" (toa xe/đoàn tàu) thể hiện độ chính xác cao về từ vựng.',
        criterion: 'LR',
      },
      {
        quote: 'Despite surging demand, scaling sleeper networks remains remarkably difficult.',
        noteVi:
          'Câu chủ đề đoạn thân bài 2 tạo nhịp chuyển tương phản mượt từ nhu cầu tăng mạnh sang giới hạn thực tế.',
        criterion: 'CC',
      },
      {
        quote: 'an inherent utilisation disadvantage: whereas a daytime intercity train can run multiple high-capacity trips daily, a sleeper set earns revenue on just one overnight run',
        noteVi:
          'Phân tích mô hình kinh tế vận hành rất sắc bén ("utilisation disadvantage") với mệnh đề tương phản "whereas".',
        criterion: 'TR',
      },
      {
        quote: 'mismatched signalling equipment, different electrical voltages, and fragmented booking platforms—all while competing against budget airlines that still benefit from tax-exempt aviation fuel.',
        noteVi:
          'Liệt kê rào cản kỹ thuật xuyên biên giới kèm cụm "all while..." liên kết thêm yếu tố bất cân xứng thuế hàng không.',
        criterion: 'GRA',
      },
      {
        quote: 'fairer tax parity with short-haul aviation.',
        noteVi:
          'Cụm danh từ học thuật chính xác ("tax parity") khép lại bài bằng điều kiện chính sách cụ thể.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:transport_public_transport',
      'col:transport_transport_links',
      'col:infrastructure_ageing_infrastructure',
      'col:infrastructure_upgrade_infrastructure',
      'col:emission_curb_carbon_emissions',
    ],
  },

  {
    id: 'w2:059',
    essayType: 'two_part',
    topic: 'food',
    difficulty: 9,
    prompt:
      'Plant-based diets are expanding noticeably in many countries, yet adoption varies sharply across different age groups. Why does uptake differ so markedly by generation, and what factors most strongly shape long-term dietary habits?',
    partsToAddress: [
      'Analyse why adoption of plant-based diets varies significantly between younger and older age groups',
      'Explain the core cultural, economic, and environmental factors that determine lasting dietary habits',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Younger generations encounter climate and animal-welfare arguments earlier through digital media and schooling.',
        develop:
          'University students and young professionals more frequently link livestock farming to carbon emissions and explore diverse meat-free cuisines online.',
      },
      {
        side: 'cause',
        idea: 'Older adults often hold deeply ingrained culinary routines and traditional notions of nourishment.',
        develop:
          'Generations raised during periods when meat symbolised prosperity and strength are more hesitant to abandon familiar family recipes and protein staples.',
      },
      {
        side: 'cause',
        idea: 'Life-stage environments expose young urbanites to wider plant-based retail options.',
        develop:
          'Campus cafeterias and metropolitan restaurants routinely feature varied vegetarian menus, whereas smaller towns with older populations offer narrower choices.',
      },
      {
        side: 'neutral',
        idea: 'Early household food culture and practical cooking skills anchor lifelong habits.',
        develop:
          'People rarely sustain a dietary change purely through willpower; knowing how to season legumes, grains, and vegetables affordably makes healthy eating effortless.',
      },
      {
        side: 'neutral',
        idea: 'Affordability, convenience, and local retail availability outweigh abstract intentions.',
        develop:
          'When fresh produce and well-priced plant proteins are stocked prominently in neighbourhood supermarkets and workplace canteens, consumers maintain new patterns long after initial enthusiasm fades.',
      },
      {
        side: 'neutral',
        idea: 'Social norms within families and peer circles strongly reinforce or erode food choices.',
        develop:
          'Shared meals carry cultural belonging; diets endure far more reliably when friends, colleagues, and public institutions treat them as normal rather than restrictive.',
      },
    ],
    modelText: `Although plant-based eating has moved beyond niche circles in many countries, surveys reveal a pronounced generational divide, with adults under thirty-five adopting meat-free or flexitarian patterns far more readily than older cohorts. This gap reflects contrasting upbringings, information channels, and food environments, while long-term dietary habits are anchored less by trends than by early culinary skills, affordability, and everyday social norms.

Generational differences stem from how distinct cohorts relate to food and environmental information. Younger citizens have grown up amidst constant discussion of climate change and livestock farming, encountering plant-based recipes daily through social media and campus dining halls. Because their domestic routines are still forming, experimenting with lentils or oat milk carries little friction. By contrast, older generations often hold deeply ingrained habits forged when regular meat consumption signified prosperity and adequate nutrition. Having spent decades perfecting familiar traditional dishes, many retirees understandably view unfamiliar plant-based substitutes with scepticism—particularly in smaller towns where supermarkets stock limited alternatives.

Sustaining any dietary shift over decades, however, depends on far sturdier forces than generational idealism. First, practical competence matters enormously: individuals who acquire basic cooking skills and nutrition education early in life can prepare satisfying, affordable meals from simple whole ingredients rather than relying on costly processed meat analogues. Second, the surrounding food environment quietly dictates routine choices. When workplace canteens, schools, and local grocers make nutritious plant-rich options both prominent and competitively priced, healthier consumption patterns become the effortless default. Finally, eating is inherently social; habits endure when shared family meals and peer networks validate them rather than treating dietary choices as isolating sacrifices.

In conclusion, plant-based diets spread unevenly across age groups because younger adults face lower cultural inertia and broader exposure to new food norms. Over the long term, lasting dietary habits are forged primarily through practical cooking confidence, accessible pricing, and supportive everyday environments.`,
    noteSpecs: [
      {
        quote:
          'This gap reflects contrasting upbringings, information channels, and food environments, while long-term dietary habits are anchored less by trends than by early culinary skills, affordability, and everyday social norms.',
        noteVi:
          'Câu luận điểm trả lời đầy đủ cả hai vế câu hỏi, đối chiếu sắc sảo giữa xu hướng nhất thời và nhân tố tạo thói quen bền vững.',
        criterion: 'TR',
      },
      {
        quote: 'a pronounced generational divide, with adults under thirty-five adopting meat-free or flexitarian patterns far more readily than older cohorts.',
        noteVi:
          'Cấu trúc "with + N + V-ing" mở rộng thông tin nhân khẩu học mượt mà và từ vựng học thuật chính xác ("cohorts", "flexitarian").',
        criterion: 'GRA',
      },
      {
        quote: 'Having spent decades perfecting familiar traditional dishes, many retirees understandably view unfamiliar plant-based substitutes with scepticism',
        noteVi:
          'Phân từ hoàn thành đầu câu ("Having spent...") diễn đạt quan hệ thời gian - nhân quả tinh tế và giàu sự đồng cảm khách quan.',
        criterion: 'GRA',
      },
      {
        quote: 'Sustaining any dietary shift over decades, however, depends on far sturdier forces than generational idealism.',
        noteVi:
          'Câu chuyển đoạn sắc nét, tách bạch hiện tượng theo lứa tuổi ở thân bài 1 với yếu tố bền vững dài hạn ở thân bài 2.',
        criterion: 'CC',
      },
      {
        quote: 'costly processed meat analogues.',
        noteVi:
          'Thuật ngữ thực phẩm học thuật chính xác ("processed meat analogues") tạo tương phản rõ với "simple whole ingredients".',
        criterion: 'LR',
      },
      {
        quote: 'eating is inherently social; habits endure when shared family meals and peer networks validate them rather than treating dietary choices as isolating sacrifices.',
        noteVi:
          'Phân tích chiều sâu tâm lý - xã hội của ẩm thực giúp trả lời câu hỏi thứ hai toàn diện hơn là chỉ nói về giá cả.',
        criterion: 'TR',
      },
      {
        quote: 'face lower cultural inertia and broader exposure to new food norms.',
        noteVi:
          'Cụm ẩn dụ học thuật "cultural inertia" (sức ì văn hóa) cô đọng nguyên nhân chênh lệch thế hệ rất ấn tượng.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:habit_ingrained_habits',
      'col:habit_lifelong_habits',
      'col:nutrition_nutrition_education',
      'col:consumption_consumption_patterns',
      'col:attitude_shape_public_attitudes_towards',
    ],
  },

  {
    id: 'w2:060',
    essayType: 'two_part',
    topic: 'government',
    difficulty: 10,
    prompt:
      'In many democracies, voter turnout among citizens under thirty consistently lags behind that of older age groups. Why do young adults participate less frequently in elections, and how can civic education strengthen democratic engagement?',
    partsToAddress: [
      'Examine the structural, political, and practical causes of lower electoral turnout among citizens under thirty',
      'Explain how substantive civic education can foster durable democratic participation among young adults',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Frequent residential mobility creates administrative friction in voter registration.',
        develop:
          'Students and early-career renters relocate regularly for courses or short-term contracts, often missing registration deadlines or remaining listed in their parents\' constituencies.',
      },
      {
        side: 'cause',
        idea: 'Young citizens often feel that mainstream policy debates neglect their most urgent concerns.',
        develop:
          'Because older cohorts vote reliably, political parties skew manifestos towards pensions and property values rather than affordable housing or youth employment, creating a self-reinforcing cycle of alienation.',
      },
      {
        side: 'cause',
        idea: 'Polarised online discourse and broken campaign pledges erode institutional trust.',
        develop:
          'Constant exposure to partisan cynicism convinces many first-time voters that casting a single ballot makes little tangible difference to public policy.',
      },
      {
        side: 'solution',
        idea: 'Practice-oriented civic classes demystify how local and national institutions affect daily life.',
        develop:
          'Teaching pupils how municipal budgets, transport planning, and legislative scrutiny actually operate turns abstract constitutional theory into concrete personal relevance.',
      },
      {
        side: 'solution',
        idea: 'Structured classroom debates and mock elections build media literacy and deliberative confidence.',
        develop:
          'Practising how to evaluate competing manifestos and spot online misinformation equips first-time voters to navigate campaigns thoughtfully rather than withdrawing in confusion.',
      },
      {
        side: 'solution',
        idea: 'Linking school civic projects with real local consultation fosters a durable habit of participation.',
        develop:
          'When teenagers present evidence to town councils on youth parks or bus routes—and see tangible responses—they internalise civic responsibility before reaching voting age.',
      },
    ],
    modelText: `Across numerous established democracies, citizens under thirty cast ballots at markedly lower rates than older generations, raising serious concerns about representative fairness. This persistent turnout gap arises from residential mobility, perceived policy neglect, and eroded institutional trust rather than simple apathy, and revitalised, practice-oriented civic education can play a pivotal role in building lifelong democratic participation.

Lower youth turnout reflects mutually reinforcing practical and political barriers. Unlike settled homeowners, students and young renters move frequently for university courses or early employment, creating administrative friction around voter registration and constituency deadlines. Beyond logistics lies a deeper representational feedback loop: because older voters turn out dependably, political parties disproportionately tailor policies towards pensions and homeownership while sidelining issues vital to young adults, such as affordable rents, precarious entry-level work, and long-term climate risk. Seeing few candidates address their lived realities—and encountering relentless partisan hostility on social platforms—many young citizens conclude that electoral politics is unresponsive, further undermining public trust.

Thoughtfully designed civic education can help break this cycle well before young people reach voting age. Conventional civics lessons that merely require memorising parliamentary structures seldom inspire engagement; instead, schools should revise the curriculum to focus on applied democratic literacy. Analysing real municipal budgets, evaluating competing party manifestos, and testing online political claims against independent evidence equip adolescents to navigate elections with confidence rather than cynicism. Equally effective is experiential participation: enabling secondary students to organise school assemblies, run mock ballots, and submit reasoned proposals to local councils demonstrates concretely how collective action shapes public decisions. When paired with simplified automatic registration, such early habits translate strongly into first-time voting.

In conclusion, lagging youth turnout stems chiefly from administrative hurdles and a sense of political marginalisation. By replacing dry textbook civics with critical media literacy and hands-on community deliberation, schools can cultivate informed, resilient civic responsibility across emerging generations.`,
    noteSpecs: [
      {
        quote:
          'This persistent turnout gap arises from residential mobility, perceived policy neglect, and eroded institutional trust rather than simple apathy,',
        noteVi:
          'Mở bài phân tích chính xác bản chất nguyên nhân (cấu trúc & đại diện thay vì quy chụp giới trẻ thờ ơ), tạo chiều sâu TR.',
        criterion: 'TR',
      },
      {
        quote: 'Beyond logistics lies a deeper representational feedback loop:',
        noteVi:
          'Cấu trúc đảo ngữ trạng ngữ nơi chốn ("Beyond logistics lies...") kết hợp khái niệm "representational feedback loop" cực kỳ sắc bén.',
        criterion: 'GRA',
      },
      {
        quote: 'Seeing few candidates address their lived realities—and encountering relentless partisan hostility on social platforms—many young citizens conclude',
        noteVi:
          'Cấu trúc phân từ kép với phần chêm dấu gạch ngang nối mượt nguyên nhân chính sách và truyền thông mạng.',
        criterion: 'GRA',
      },
      {
        quote: 'Thoughtfully designed civic education can help break this cycle well before young people reach voting age.',
        noteVi:
          'Câu chủ đề liên kết chặt cụm "break this cycle" với vòng lặp luẩn quẩn vừa phân tích ở thân bài 1.',
        criterion: 'CC',
      },
      {
        quote: 'Conventional civics lessons that merely require memorising parliamentary structures seldom inspire engagement; instead, schools should revise the curriculum to focus on applied democratic literacy.',
        noteVi:
          'Đối lập cách dạy lý thuyết khô khan với giáo dục công dân ứng dụng ("applied democratic literacy") làm giải pháp rất thuyết phục.',
        criterion: 'TR',
      },
      {
        quote: 'When paired with simplified automatic registration, such early habits translate strongly into first-time voting.',
        noteVi:
          'Kết nối giải pháp giáo dục với cải cách thủ tục đăng ký cử tri (đã nêu ở thân bài 1) giúp toàn bài khép kín hoàn hảo.',
        criterion: 'CC',
      },
      {
        quote: 'political marginalisation.',
        noteVi:
          'Danh từ học thuật khoa học chính trị chuẩn xác ("political marginalisation", "community deliberation") đạt tầm Band 8.5–9.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:responsibility_civic_responsibility',
      'col:undermine_undermine_public_trust',
      'col:curriculum_revise_the_curriculum',
      'col:policy_a_coherent_policy',
      'col:awareness_foster_awareness_among',
    ],
  },
);

// Build and self-check every item before writing JSON
function countWords(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

const out = [];
const errors = [];
for (const raw of RAW_ITEMS) {
  const text = raw.modelText.trim();
  const wc = countWords(text);
  if (wc < 275 || wc > 315) {
    errors.push(`${raw.id}: wordCount=${wc} outside strict target [275, 315]`);
  }
  const paragraphs = text.split('\n\n');
  if (paragraphs.length !== 4) {
    errors.push(`${raw.id}: expected 4 paragraphs, got ${paragraphs.length}`);
  }
  if (raw.ideaBank.length !== 6) {
    errors.push(`${raw.id}: expected 6 ideaBank items, got ${raw.ideaBank.length}`);
  }
  if (raw.noteSpecs.length < 6 || raw.noteSpecs.length > 8) {
    errors.push(`${raw.id}: expected 6-8 notes, got ${raw.noteSpecs.length}`);
  }

  const criteriaSeen = new Set();
  const notes = raw.noteSpecs.map((ns, idx) => {
    const start = text.indexOf(ns.quote);
    if (start === -1) {
      errors.push(`${raw.id}: note[${idx}] quote not found verbatim: ${ns.quote}`);
      return { start: 0, end: 1, noteVi: ns.noteVi, criterion: ns.criterion };
    }
    const end = start + ns.quote.length;
    criteriaSeen.add(ns.criterion);
    return {
      start,
      end,
      noteVi: ns.noteVi,
      criterion: ns.criterion,
    };
  });

  for (const crit of ['TR', 'CC', 'LR', 'GRA']) {
    if (!criteriaSeen.has(crit)) {
      errors.push(`${raw.id}: missing criterion ${crit} in notes`);
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
      wordCount: wc,
      notes,
    },
    usefulCollocationIds: raw.usefulCollocationIds,
    provenance: PROVENANCE,
  });
}

if (errors.length > 0) {
  console.error(`Generator found ${errors.length} issue(s):`);
  for (const e of errors) console.error(' -', e);
  console.log(out.map((it) => `  ${it.id}: ${it.band8Model.wordCount}w`).join('\n'));
  process.exit(1);
}

const outPath = path.join(process.cwd(), 'data-src', 'writing', 'batches', 't2_03_disc_twopart.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(
  `Generated ${out.length} items -> ${outPath}\n` +
    out.map((it) => `  ${it.id} (${it.essayType}, ${it.topic}, d=${it.difficulty}): ${it.band8Model.wordCount}w, ${it.band8Model.notes.length} notes`).join('\n')
);
