import fs from 'node:fs';
import path from 'node:path';

const PROVENANCE = {
  createdBy: 'llm+review',
  source: 'llm:gemini-4-neon@2026-11-21',
  license: 'own',
  qa: { schema: 'pass', verifier: 'pass', blindSolve: 'na' },
};

const RAW_ITEMS_PART1 = [
  // =========================================================================
  // w2:021 - environment - problem_solution (diff 3)
  // =========================================================================
  {
    id: 'w2:021',
    essayType: 'problem_solution',
    topic: 'environment',
    difficulty: 3,
    prompt:
      'Many fast-growing cities are experiencing significantly higher temperatures than their surrounding rural areas, a phenomenon known as the urban heat island effect. What are the main causes of this problem, and what measures can municipalities take to address it?',
    partsToAddress: [
      'Explain the primary causes of rising temperatures inside fast-growing cities',
      'Propose practical, specific measures that municipal authorities can implement to cool urban districts',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Dark, heat-absorbing surfaces replace natural soil and tree cover during rapid construction.',
        develop:
          'Asphalt roads and concrete tower blocks store solar radiation throughout the afternoon and release it slowly overnight, preventing streets from cooling down before dawn.',
      },
      {
        side: 'cause',
        idea: 'Waste heat from dense road traffic and air-conditioning units compounds ambient warmth.',
        develop:
          'During peak summer afternoons, mechanical cooling systems expel warm air directly into narrow streets, creating a self-reinforcing loop of higher indoor demand and hotter outdoor pavements.',
      },
      {
        side: 'cause',
        idea: 'High-rise clusters block natural wind corridors that would otherwise disperse trapped heat.',
        develop:
          'When planners permit continuous walls of glass skyscrapers along riverfronts or coastlines, cooling breezes can no longer penetrate inner-city residential blocks.',
      },
      {
        side: 'solution',
        idea: 'Mandate reflective roofing materials and permeable pavements across new developments.',
        develop:
          'Light-coloured roof coatings bounce a substantial share of sunlight back into the atmosphere, cutting rooftop surface temperatures and easing strain on building cooling systems.',
      },
      {
        side: 'solution',
        idea: 'Expand connected urban tree canopies, pocket parks, and vegetated rooftops.',
        develop:
          'Strategically planted street trees shade pedestrian corridors while cooling nearby air through evapotranspiration, offering measurable relief for lower-income neighbourhoods.',
      },
      {
        side: 'solution',
        idea: 'Enforce ventilation-corridor zoning and invest in district cooling coupled with public transit.',
        develop:
          'Preserving open sightlines for prevailing winds alongside electric bus networks curbs tailpipe heat emissions and improves summer air quality simultaneously.',
      },
    ],
    text: `Rapid urbanisation has transformed skylines across the globe, yet it has also trapped intense heat inside metropolitan centres, pushing city temperatures several degrees above nearby countryside. This warming stems primarily from heat-retaining building materials and concentrated mechanical waste heat, and municipalities can counter it effectively through reflective architecture and expanded green infrastructure.

Two structural features of fast-growing cities drive the urban heat island effect. First, developers routinely replace vegetated soil with vast expanses of dark asphalt and dense concrete, surfaces that absorb solar radiation throughout the day and release it slowly after sunset. Consequently, night-time temperatures remain elevated, denying residents physiological recovery during summer heatwaves. Compounding this thermal storage is anthropogenic waste heat emitted by congested motor traffic and air-conditioning compressors. When thousands of cooling units vent hot exhaust into narrow street canyons, outdoor air becomes warmer still, prompting households to run air conditioners even harder in a damaging feedback loop.

Municipalities possess practical planning tools to mitigate the effects of urban warming without halting growth. In the near term, city councils should revise building codes to mandate high-albedo, light-coloured roofs and permeable paving on public roads, since reflective coatings deflect sunlight rather than storing it. Equally vital is restoring biological cooling by weaving native tree canopies, shaded transit corridors, and pocket parks into densely built districts. Because street trees lower surrounding temperatures through both shade and moisture evaporation, prioritising green cover in low-income neighbourhoods protects vulnerable elderly residents while strengthening long-term climate resilience.

In summary, excess urban heat is an avoidable consequence of impervious surfaces and concentrated energy use. By combining reflective building standards with targeted urban forestry, municipal authorities can build cooler, more liveable cities even as their populations expand.`,
    notes: [
      {
        quote:
          'This warming stems primarily from heat-retaining building materials and concentrated mechanical waste heat, and municipalities can counter it effectively through reflective architecture and expanded green infrastructure.',
        noteVi:
          'Câu luận điểm (thesis) trả lời thẳng cả hai vế nguyên nhân và giải pháp một cách khái quát nhưng cụ thể, định hướng rõ cho hai đoạn thân bài.',
        criterion: 'TR',
      },
      {
        quote: 'denying residents physiological recovery during summer heatwaves',
        noteVi:
          'Mệnh đề phân từ hiện tại (participle clause) rút gọn hệ quả tự nhiên và dùng cụm từ học thuật chính xác thay vì cách nói chung chung.',
        criterion: 'GRA',
      },
      {
        quote: 'Compounding this thermal storage is anthropogenic waste heat',
        noteVi:
          'Đảo ngữ (inversion) với phân từ ở đầu câu giúp tăng độ linh hoạt ngữ pháp (GRA) và liên kết mượt với ý trước đó (CC).',
        criterion: 'GRA',
      },
      {
        quote: 'in a damaging feedback loop',
        noteVi:
          'Diễn đạt chính xác cơ chế nhân quả khép kín bằng thuật ngữ khoa học phù hợp văn phong Academic.',
        criterion: 'LR',
      },
      {
        quote: 'Municipalities possess practical planning tools to mitigate the effects of urban warming',
        noteVi:
          'Câu chủ đề đoạn 2 chuyển mạch tự nhiên từ nguyên nhân sang giải pháp và lồng ghép collocation học thuật chuẩn.',
        criterion: 'CC',
      },
      {
        quote: 'mandate high-albedo, light-coloured roofs and permeable paving',
        noteVi:
          'Từ vựng chuyên ngành đô thị và môi trường rất sát chủ đề, nâng cao độ chính xác của tiêu chí Lexical Resource.',
        criterion: 'LR',
      },
      {
        quote:
          'prioritising green cover in low-income neighbourhoods protects vulnerable elderly residents while strengthening long-term climate resilience',
        noteVi:
          'Phát triển giải pháp tới tác động xã hội cụ thể thay vì dừng ở khẩu hiệu, thể hiện chiều sâu lập luận Band 8.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:urbanisation_rapid_urbanisation',
      'col:climate_climate_resilience',
      'col:mitigate_mitigate_the_effects_of',
      'col:infrastructure_resilient_infrastructure',
      'col:sustainability_environmental_sustainability',
    ],
  },

  // =========================================================================
  // w2:022 - health - problem_solution (diff 4)
  // =========================================================================
  {
    id: 'w2:022',
    essayType: 'problem_solution',
    topic: 'health',
    difficulty: 4,
    prompt:
      'Chronic sleep deprivation has become increasingly common among secondary school pupils in many countries. Why is this happening, and what can schools and families do to resolve the problem?',
    partsToAddress: [
      'Identify the main causes behind chronic sleep deprivation in adolescents',
      'Explain actionable steps that both schools and families can take to improve teenage sleep',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Early secondary school start times clash directly with adolescent circadian biology.',
        develop:
          "During puberty, melatonin secretion shifts later by roughly two hours, so requiring teenagers to board buses before seven o'clock forces them to wake during their deepest sleep phase.",
      },
      {
        side: 'cause',
        idea: 'Late-night smartphone scrolling and social messaging delay bedtime and fragment rest.',
        develop:
          'Short-wavelength screen light suppresses sleep hormones while algorithmic video feeds keep teenagers mentally alert long after lights are meant to be out.',
      },
      {
        side: 'cause',
        idea: 'Heavy evening homework loads and competitive extra tuition compress free time.',
        develop:
          'Pupils who spend three hours after school at private coaching centres frequently finish assignments past midnight, leaving insufficient time for recovery.',
      },
      {
        side: 'solution',
        idea: 'Schools should delay morning bell times to align with teenage biological rhythms.',
        develop:
          'Shifting the first lesson from 7:30 to 8:30 allows pupils to gain an extra hour of restorative sleep, consistently improving daytime attention and emotional stability.',
      },
      {
        side: 'solution',
        idea: 'Families can establish device-free bedrooms and consistent weeknight wind-down routines.',
        develop:
          'Placing phones in a shared hallway charging station an hour before bed removes late-night notifications without requiring constant parental policing.',
      },
      {
        side: 'solution',
        idea: 'Teachers should coordinate assignment deadlines across subjects to curb evening overload.',
        develop:
          'A shared departmental calendar prevents multiple essays and tests from landing in the same week, reducing chronic stress and late-night cramming.',
      },
    ],
    text: `Across many education systems, secondary pupils routinely obtain far less than the eight to ten hours of nightly rest required for healthy adolescent development. This shortfall arises chiefly from the collision between early school schedules, evening academic pressure, and bedroom screen habits, yet coordinated reforms by schools and parents can substantially restore healthy sleep.

Adolescent sleep loss is rarely a matter of mere indiscipline; rather, biological and institutional pressures reinforce one another. During puberty, a natural shift in circadian rhythms delays the release of melatonin, making teenagers biologically predisposed to fall asleep later and wake later than younger children. Despite this physiological reality, many secondary schools still begin lessons before eight in the morning, cutting off the final, cognitively vital phase of morning sleep. Meanwhile, intense competition for university places drives pupils into late-evening tuition and heavy homework loads, after which they unwind on smartphones whose bright displays and endless notifications further postpone rest and undermine well-being.

Reversing this pattern demands practical adjustments on both sides of the school gate. Education authorities should first delay secondary start times by at least forty-five minutes and coordinate homework schedules across departments so that assignments do not cluster into midnight marathons. Such structural changes signal that educational outcomes depend on cognitive alertness rather than sheer exhaustion. Within the home, parents can curb bad habits more effectively through shared routines than through punitive lectures. Charging all mobile devices in a communal room before bedtime, coupled with modelling calm screen-free evenings themselves, removes the primary source of nocturnal distraction while easing chronic stress.

Ultimately, teenage sleep deprivation reflects poorly aligned timetables and unchecked digital intrusion. When schools synchronise opening hours with adolescent biology and families protect screen-free nights, pupils regain both the rest and the mental health essential for thriving.`,
    notes: [
      {
        quote:
          'This shortfall arises chiefly from the collision between early school schedules, evening academic pressure, and bedroom screen habits, yet coordinated reforms by schools and parents can substantially restore healthy sleep.',
        noteVi:
          'Mở bài trả lời trọn vẹn cả 2 đối tượng trong đề (nhà trường và gia đình) cùng nguyên nhân cốt lõi, tạo khung lập luận mạch lạc.',
        criterion: 'TR',
      },
      {
        quote: 'Adolescent sleep loss is rarely a matter of mere indiscipline; rather, biological and institutional pressures reinforce one another.',
        noteVi:
          'Sử dụng dấu chấm phẩy kết hợp trạng từ "rather" tạo câu ghép phản biện sắc bén, thể hiện kiểm soát ngữ pháp Band 8.',
        criterion: 'GRA',
      },
      {
        quote: 'a natural shift in circadian rhythms delays the release of melatonin',
        noteVi:
          'Dùng từ vựng sinh học chính xác và tự nhiên ("circadian rhythms", "release of melatonin") giúp giải thích nguyên nhân sâu sắc.',
        criterion: 'LR',
      },
      {
        quote: 'Reversing this pattern demands practical adjustments on both sides of the school gate.',
        noteVi:
          'Câu chuyển đoạn giàu hình ảnh học thuật, dẫn dắt mượt mà sang hai nhóm giải pháp của trường học và gia đình.',
        criterion: 'CC',
      },
      {
        quote: 'educational outcomes depend on cognitive alertness rather than sheer exhaustion',
        noteVi:
          'Kết hợp collocation học thuật ("educational outcomes") với cấu trúc đối lập ngắn gọn, thuyết phục.',
        criterion: 'LR',
      },
      {
        quote: 'Charging all mobile devices in a communal room before bedtime, coupled with modelling calm screen-free evenings themselves, removes',
        noteVi:
          'Cụm danh động từ làm chủ ngữ đi kèm phân từ "coupled with" cho thấy độ đa dạng cấu trúc câu phức tạp.',
        criterion: 'GRA',
      },
      {
        quote: 'When schools synchronise opening hours with adolescent biology and families protect screen-free nights',
        noteVi:
          'Kết bài tổng hợp đúng hai giải pháp trọng tâm đã nêu, không đưa ý mới và giữ vững văn phong trang trọng.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:health_mental_health',
      'col:well_being_undermine_well_being',
      'col:habit_curb_bad_habits',
      'col:stress_chronic_stress',
      'col:outcome_educational_outcomes',
    ],
  },

  // =========================================================================
  // w2:023 - urban - problem_solution (diff 5)
  // =========================================================================
  {
    id: 'w2:023',
    essayType: 'problem_solution',
    topic: 'urban',
    difficulty: 5,
    prompt:
      'In many major cities, essential public-sector workers such as nurses, teachers, and firefighters can no longer afford to rent homes near their workplaces. What are the causes of this problem, and what solutions should governments adopt?',
    partsToAddress: [
      'Analyse the economic and planning causes behind unaffordable urban rents for key workers',
      'Propose targeted government policies to restore housing access near urban workplaces',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Speculative real-estate investment and short-term tourist lets shrink the long-term rental pool.',
        develop:
          'When corporate landlords and holiday-let platforms bid up inner-city flats, housing costs detach from local public-sector salaries.',
      },
      {
        side: 'cause',
        idea: 'Restrictive zoning rules prevent medium-density apartment construction near transit hubs.',
        develop:
          'Preserving low-density single-family zones around urban rail stations chokes supply precisely where employment growth is strongest.',
      },
      {
        side: 'cause',
        idea: 'Public-sector pay scales rarely keep pace with metropolitan living expenses.',
        develop:
          'Because national wage bands often overlook sharp regional rent disparities, a hospital nurse in a capital city spends over half of net income on basic accommodation.',
      },
      {
        side: 'solution',
        idea: 'Build dedicated publicly owned rental housing reserved for key workers on municipal land.',
        develop:
          'Developing mixed-income apartment blocks above public clinics or rail depots links rent directly to a capped share of take-home pay.',
      },
      {
        side: 'solution',
        idea: 'Regulate short-term holiday rentals and tax vacant investment properties.',
        develop:
          'Limiting the annual nights an entire flat may be let to tourists returns thousands of units to the resident market and curbs speculative hoarding.',
      },
      {
        side: 'solution',
        idea: 'Combine inclusionary zoning with rapid commuter transport and targeted rent allowances.',
        develop:
          'Requiring private developers to allocate a fixed quota of affordable housing alongside faster suburban rail lines shortens commutes while easing central rent pressure.',
      },
    ],
    text: `Across major metropolitan centres, nurses, classroom teachers, and emergency responders are increasingly priced out of the very districts they serve, facing gruelling commutes or leaving public service altogether. This housing crisis stems largely from constrained urban land supply and speculative property markets, and governments must respond with both supply-side construction and firmer rental regulation.

Two market distortions explain why housing costs have outstripped public-sector wages. First, restrictive zoning laws in many established neighbourhoods block medium-density flats near job hubs, leaving construction far behind population inflows. Second, residential property has increasingly been treated as a financial asset rather than a civic necessity. Institutional investors and short-term holiday-let platforms compete directly with local tenants for central apartments, bidding up rents to levels that salaried hospital staff or municipal firefighters cannot match. Because public wage scales are typically set nationally and adjust slowly, essential workers bear the brunt of this widening affordability gap.

Addressing the imbalance requires sustained public intervention rather than temporary rent vouchers alone, which landlords often absorb through higher asking prices. Governments should first unlock publicly owned land near hospitals, schools, and transport infrastructure to build non-profit rental flats reserved for key workers, with rents pegged to a modest proportion of household income. Simultaneously, planning ministries ought to permit gentle density around rail corridors and enforce strict annual caps on whole-home tourist lets, backed by vacancy levies on empty investment units. Pairing new affordable housing with targeted market rules alleviates housing shortages without distorting private incentives excessively.

In conclusion, the displacement of essential workers reflects under-supplied urban land and unchecked housing speculation. By expanding dedicated public rental stock while curbing speculative conversions, governments can keep cities both socially mixed and operationally resilient.`,
    notes: [
      {
        quote:
          'This housing crisis stems largely from constrained urban land supply and speculative property markets, and governments must respond with both supply-side construction and firmer rental regulation.',
        noteVi:
          'Luận điểm mở bài ngắn gọn, bao quát chính xác hai trụ cột nguyên nhân và hai nhóm giải pháp chính sách sẽ triển khai.',
        criterion: 'TR',
      },
      {
        quote: 'priced out of the very districts they serve, facing gruelling commutes or leaving public service altogether',
        noteVi:
          'Cụm động từ "priced out of" và tính từ "gruelling" diễn tả tự nhiên thực trạng đời sống công chức đô thị.',
        criterion: 'LR',
      },
      {
        quote: 'Because public wage scales are typically set nationally and adjust slowly, essential workers bear the brunt of this widening affordability gap.',
        noteVi:
          'Mệnh đề trạng ngữ nguyên nhân kết hợp thành ngữ học thuật trang trọng "bear the brunt of" làm sắc nét phân tích kinh tế.',
        criterion: 'GRA',
      },
      {
        quote: 'Addressing the imbalance requires sustained public intervention rather than temporary rent vouchers alone, which landlords often absorb through higher asking prices.',
        noteVi:
          'Mệnh đề quan hệ không xác định (non-defining relative clause) phản biện luôn giải pháp yếu hơn, nâng chiều sâu tư duy phê phán.',
        criterion: 'TR',
      },
      {
        quote: 'Simultaneously, planning ministries ought to permit gentle density around rail corridors and enforce strict annual caps on whole-home tourist lets',
        noteVi:
          'Liên kết ý mạch lạc bằng "Simultaneously" và dùng thuật ngữ quy hoạch đô thị chính xác ("gentle density", "annual caps").',
        criterion: 'CC',
      },
      {
        quote: 'Pairing new affordable housing with targeted market rules alleviates housing shortages',
        noteVi:
          'Lồng ghép tự nhiên hai collocation mục tiêu ("affordable housing", "alleviates housing shortages") trong câu tổng kết đoạn.',
        criterion: 'LR',
      },
      {
        quote: 'keep cities both socially mixed and operationally resilient',
        noteVi:
          'Cấu trúc song song (parallelism) gọn và giàu sắc thái để khép lại bài luận một cách thuyết phục.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:housing_affordable_housing',
      'col:housing_housing_costs',
      'col:alleviate_alleviate_housing_shortages',
      'col:crisis_a_housing_crisis',
      'col:infrastructure_transport_infrastructure',
    ],
  },

  // =========================================================================
  // w2:024 - work - problem_solution (diff 6)
  // =========================================================================
  {
    id: 'w2:024',
    essayType: 'problem_solution',
    topic: 'work',
    difficulty: 6,
    prompt:
      'Rapid technological change is making the professional skills of many mid-career workers obsolete far earlier than in previous generations. What are the main problems this trend creates, and how can governments and employers address them?',
    partsToAddress: [
      'Examine the key economic and social problems caused by mid-career skills obsolescence',
      'Outline realistic solutions involving both governments and employers',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Displaced workers in their forties and fifties face prolonged unemployment and steep income drops.',
        develop:
          'With mortgages and family dependants to support, mid-career staff laid off from automated roles often cannot afford years out of the workforce to earn a new degree.',
      },
      {
        side: 'cause',
        idea: 'Widespread skills mismatch slows national productivity while inflating welfare expenditure.',
        develop:
          'When firms struggle to fill technical vacancies at the same time as experienced clerical or factory staff remain idle, tax revenues fall and public budgets come under strain.',
      },
      {
        side: 'cause',
        idea: 'Forced career disruption erodes professional identity and mental health.',
        develop:
          'Workers who spent two decades mastering a specialised craft frequently experience anxiety and social withdrawal when their expertise loses market value overnight.',
      },
      {
        side: 'solution',
        idea: 'Governments should fund modular retraining accounts linked to paid study leave.',
        develop:
          'Portable individual learning credits allow adults to complete short, accredited courses in growing fields without sacrificing household income.',
      },
      {
        side: 'solution',
        idea: 'Employers should receive tax incentives to reskill existing staff rather than relying on redundancies.',
        develop:
          'Offering corporate tax relief for internal apprenticeships encourages firms to transition experienced employees into adjacent digital or supervisory roles.',
      },
      {
        side: 'solution',
        idea: 'Public employment agencies and universities should co-design industry-recognised micro-credentials.',
        develop:
          'Aligning concise technical certificates with verified employer demand ensures retraining translates into genuine employment prospects rather than dead-end workshops.',
      },
    ],
    text: `Automation and software advances now overhaul entire industries within a single decade, leaving many workers in their forties and fifties with qualifications that employers no longer value. This accelerated skills obsolescence inflicts severe financial hardship on households while depressing broader economic output, yet coordinated retraining policies from governments and firms can greatly soften the transition.

The consequences of mid-career displacement extend well beyond individual redundancy. Unlike recent graduates, workers in mid-life typically shoulder mortgages, school fees, or eldercare costs, meaning that even a brief spell of unemployment can wipe out household savings. When disruptive technology eliminates routine clerical, manufacturing, or analytical posts, displaced staff often slide into low-paid precarious work because they lack the time or capital to pursue multi-year university degrees. At a macroeconomic level, this mismatch creates a costly paradox: companies report acute vacancies in technical fields while experienced, disciplined adults remain under-employed, shrinking tax receipts and expanding welfare demands.

Tackling this challenge requires shifting education from a front-loaded youth model to a lifelong system supported by both states and businesses. Governments should establish portable individual training accounts that subsidise short, industry-certified courses alongside partial wage replacement during study leave, enabling workers to acquire essential skills without risking insolvency. Employers, for their part, must look beyond short-term layoffs by investing in internal redeployment. Financial incentives such as payroll tax credits for certified upskilling programmes would encourage firms to retrain long-serving employees—who already possess institutional knowledge and transferable skills—for emerging operational roles.

Under myopic hiring practices, mid-career workers are treated as disposable whenever tools evolve. However, if governments finance accessible modular retraining and companies prioritise internal reskilling, societies can protect household livelihoods while sustaining a productive, adaptable workforce.`,
    notes: [
      {
        quote:
          'This accelerated skills obsolescence inflicts severe financial hardship on households while depressing broader economic output, yet coordinated retraining policies from governments and firms can greatly soften the transition.',
        noteVi:
          'Câu thesis làm rõ cả hai tầng hệ quả (cá nhân/hộ gia đình và kinh tế vĩ mô) đồng thời giới thiệu giải pháp phối hợp giữa nhà nước và doanh nghiệp.',
        criterion: 'TR',
      },
      {
        quote: 'Unlike recent graduates, workers in mid-life typically shoulder mortgages, school fees, or eldercare costs',
        noteVi:
          'So sánh tương phản giúp lập luận cụ thể về lý do nhóm lao động trung niên dễ tổn thương hơn nhóm mới ra trường.',
        criterion: 'CC',
      },
      {
        quote: 'creates a costly paradox: companies report acute vacancies in technical fields while experienced, disciplined adults remain under-employed',
        noteVi:
          'Dùng dấu hai chấm giải thích "costly paradox" cực kỳ gãy gọn, nâng điểm mạch lạc và ngữ pháp.',
        criterion: 'GRA',
      },
      {
        quote: 'shifting education from a front-loaded youth model to a lifelong system',
        noteVi:
          'Cụm ẩn dụ học thuật "front-loaded youth model" sắc nét, thể hiện vốn từ Band 8+ tự nhiên.',
        criterion: 'LR',
      },
      {
        quote: 'enabling workers to acquire essential skills without risking insolvency',
        noteVi:
          'Kết hợp collocation chuẩn ("acquire essential skills") và từ kinh tế chính xác ("insolvency").',
        criterion: 'LR',
      },
      {
        quote: 'retrain long-serving employees—who already possess institutional knowledge and transferable skills—for emerging operational roles',
        noteVi:
          'Mệnh đề quan hệ chen giữa dấu gạch ngang bổ sung lý do kinh tế thuyết phục cho phía doanh nghiệp.',
        criterion: 'GRA',
      },
      {
        quote: 'if governments finance accessible modular retraining and companies prioritise internal reskilling',
        noteVi:
          'Câu điều kiện loại 1 ở kết bài tóm lược đúng vai trò của hai chủ thể theo yêu cầu đề bài.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:skill_acquire_essential_skills',
      'col:skill_transferable_skills',
      'col:employment_employment_prospects',
      'col:technology_disruptive_technology',
      'col:incentive_financial_incentives',
    ],
  },

  // =========================================================================
  // w2:025 - crime - problem_solution (diff 5)
  // =========================================================================
  {
    id: 'w2:025',
    essayType: 'problem_solution',
    topic: 'crime',
    difficulty: 5,
    prompt:
      'Online financial fraud targeting older adults has risen sharply in recent years, often stripping retirees of their life savings. Why are older people particularly vulnerable to such crimes, and what measures can protect them effectively?',
    partsToAddress: [
      'Explain the specific reasons why older adults are disproportionately targeted and deceived by online scammers',
      'Propose concrete legal, technical, and educational safeguards to protect older citizens',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Criminals deliberately target retirees because they hold accumulated pensions and savings.',
        develop:
          "From a fraudster's perspective, older households represent higher financial rewards than younger adults with modest balances, justifying sophisticated impersonation tactics.",
      },
      {
        side: 'cause',
        idea: "Rapidly evolving digital banking tools and voice-cloning scams outpace many seniors' digital literacy.",
        develop:
          'Individuals who adopted online banking late in life may struggle to spot spoofed email headers, cloned bank websites, or synthetic voice calls posing as relatives.',
      },
      {
        side: 'cause',
        idea: 'Social isolation makes lonely retirees more susceptible to manipulative persuasion.',
        develop:
          'Scammers exploit emotional trust over weeks via messaging apps, leaving isolated victims with nobody nearby to sanity-check an urgent transfer request.',
      },
      {
        side: 'solution',
        idea: 'Banks should enforce mandatory cooling-off delays and trusted-contact alerts on large transfers.',
        develop:
          'Holding unusually large payments to new recipients for twenty-four hours gives customers and nominated family members time to detect deception before funds vanish abroad.',
      },
      {
        side: 'solution',
        idea: 'Governments must enact tighter legislation holding telecoms and social platforms liable for scam adverts.',
        develop:
          'Imposing substantial fines on platforms that profit from fraudulent investment promotions compels firms to verify advertisers rigorously.',
      },
      {
        side: 'solution',
        idea: 'Community centres and libraries should run practical, hands-on digital literacy workshops for older residents.',
        develop:
          'Practising how to verify official phone numbers and recognise phishing messages builds lasting confidence without shaming victims.',
      },
    ],
    text: `As everyday banking and shopping have migrated onto smartphones, older citizens have become prime targets for sophisticated digital scams that can erase decades of pension savings within minutes. Their heightened vulnerability reflects a combination of financial attractiveness, uneven digital literacy, and social isolation, meaning effective protection demands stronger banking safeguards alongside tougher platform regulation.

Older adults face disproportionate risk for both economic and behavioural reasons. Criminals systematically profile retirees because they tend to hold larger liquid savings and home equity than younger age groups, making each successful deception far more lucrative. Moreover, many seniors entered digital finance later in life, leaving them less familiar with subtle warning signs such as spoofed web domains, urgent phishing texts, or artificial voice calls impersonating bank officials. Compounding this technical gap is social isolation: retirees living alone often lack an immediate confidant to question an implausible investment pitch or a fabricated family emergency before money is wired overseas.

Because individual vigilance alone cannot outsmart organised criminal syndicates, institutions must shoulder far greater responsibility to combat crime online. First, financial regulators should enforce consumer protection rules requiring banks to introduce automatic cooling-off periods for unusually large transfers to unverified accounts, coupled with optional trusted-contact alerts that notify a nominated relative prior to settlement. Second, legislators ought to enact tighter legislation imposing financial liability on telecommunications carriers and social-media platforms that fail to block spoofed caller identities or fraudulent investment advertisements. Finally, municipalities can pair these technical security measures with stigma-free community workshops where older residents practise spotting common scam scripts in a supportive setting.

In summary, digital fraud preys on retirees' wealth, unfamiliarity with evolving deception techniques, and occasional isolation. Only by combining friction-based banking controls, strict platform accountability, and practical senior education can societies safeguard older citizens' savings.`,
    notes: [
      {
        quote:
          'Their heightened vulnerability reflects a combination of financial attractiveness, uneven digital literacy, and social isolation, meaning effective protection demands stronger banking safeguards alongside tougher platform regulation.',
        noteVi:
          'Câu thesis chỉ ra đúng 3 nguyên nhân then chốt và định hướng giải pháp đa tầng (ngân hàng + pháp lý), bám sát hai vế câu hỏi.',
        criterion: 'TR',
      },
      {
        quote: 'making each successful deception far more lucrative',
        noteVi:
          'Dùng từ vựng chính xác về động cơ tội phạm tài chính ("deception", "lucrative") với cấu trúc phân từ chỉ kết quả.',
        criterion: 'LR',
      },
      {
        quote: 'Compounding this technical gap is social isolation:',
        noteVi:
          'Mở câu bằng cấu trúc đảo ngữ kết hợp dấu hai chấm giải thích tạo nhịp văn học thuật tự nhiên và liên kết chặt với câu trước.',
        criterion: 'GRA',
      },
      {
        quote: 'Because individual vigilance alone cannot outsmart organised criminal syndicates, institutions must shoulder far greater responsibility to combat crime online.',
        noteVi:
          'Câu chủ đề đoạn 2 giải thích rõ nguyên lý vì sao giải pháp phải mang tính hệ thống thay vì chỉ khuyên nạn nhân cẩn thận.',
        criterion: 'CC',
      },
      {
        quote: 'enforce consumer protection rules requiring banks to introduce automatic cooling-off periods',
        noteVi:
          'Giải pháp cụ thể, khả thi và tích hợp collocation học thuật chuẩn ("enforce consumer protection").',
        criterion: 'TR',
      },
      {
        quote: 'enact tighter legislation imposing financial liability on telecommunications carriers',
        noteVi:
          'Từ vựng pháp lý chính xác ("enact tighter legislation", "imposing financial liability") nâng rõ điểm Lexical Resource.',
        criterion: 'LR',
      },
      {
        quote: "Only by combining friction-based banking controls, strict platform accountability, and practical senior education can societies safeguard older citizens' savings.",
        noteVi:
          'Câu kết dùng đảo ngữ với "Only by..." nhấn mạnh tính đồng bộ của các giải pháp một cách tự nhiên, không sáo rỗng.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:crime_combat_crime',
      'col:enforce_enforce_consumer_protection',
      'col:legislation_tighter_legislation',
      'col:literacy_digital_literacy',
      'col:security_security_measures',
    ],
  },

  // =========================================================================
  // w2:026 - food - problem_solution (diff 4)
  // =========================================================================
  {
    id: 'w2:026',
    essayType: 'problem_solution',
    topic: 'food',
    difficulty: 4,
    prompt:
      'In wealthy cities, a large proportion of edible food is thrown away by households every week, even as food prices and environmental concerns rise. What causes such high levels of domestic food waste, and what steps can be taken to reduce it?',
    partsToAddress: [
      'Explain why households in affluent cities discard large amounts of edible food',
      'Recommend practical measures by retailers, governments, and consumers to minimise waste',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Supermarket bulk promotions encourage shoppers to buy more perishable items than they can finish.',
        develop:
          'Multi-buy discounts on bagged salad or bakery goods shift surplus inventory from supermarket shelves straight into domestic rubbish bins.',
      },
      {
        side: 'cause',
        idea: 'Confusing date labels lead cautious consumers to bin safe, nutritious food.',
        develop:
          'Many shoppers mistake advisory best-before dates—which reflect peak flavour rather than safety—for strict use-by deadlines and discard unopened yoghurt or bread unnecessarily.',
      },
      {
        side: 'cause',
        idea: 'Busy urban schedules undermine meal planning and encourage impulsive grocery runs.',
        develop:
          'When professionals order takeaway after long workdays, fresh vegetables bought earlier in the week spoil untouched at the back of oversized refrigerators.',
      },
      {
        side: 'solution',
        idea: 'Regulators should standardise food date labels and remove best-before stamps from long-life produce.',
        develop:
          'Restricting hard expiry dates to genuinely high-risk items such as raw meat empowers households to rely on smell and appearance for staple goods.',
      },
      {
        side: 'solution',
        idea: 'Supermarkets should replace multi-buy deals on perishables with straightforward unit-price discounts.',
        develop:
          'Selling single portions at fair per-kilogram rates enables smaller households to buy only what they actually cook.',
      },
      {
        side: 'solution',
        idea: 'Municipalities can introduce pay-as-you-throw waste charges alongside public awareness campaigns on food storage.',
        develop:
          'Charging for residual bin weight makes wasted groceries financially visible, motivating families to freeze leftovers and organise weekly menus.',
      },
    ],
    text: `In affluent metropolitan areas, households routinely discard substantial quantities of completely edible groceries, squandering both family budgets and the water, energy, and land required to produce them. Domestic food waste is driven mainly by misleading date labelling, retail bulk promotions, and disorganised shopping habits, and curbing it requires aligned reforms from regulators, supermarkets, and city councils.

Several everyday features of urban consumption patterns encourage households to overbuy and over-discard. Foremost among these is widespread confusion over packaging dates. Because many consumers conflate advisory best-before guidance with strict safety deadlines, perfectly wholesome dairy products, bread, and dry staples are thrown away the moment a printed date passes. Retail marketing amplifies this error: multi-buy discounts on perishable fruit and vegetables entice shoppers into purchasing excess quantities that spoil before busy workweeks allow them to be cooked. Furthermore, when food represents a relatively small fraction of disposable income in wealthy cities, the financial pain of binning forgotten leftovers rarely feels urgent enough to alter routines.

Meaningful progress therefore depends on restructuring the retail and municipal environment to modify consumer behaviour. Governments should first standardise packaging rules by removing best-before labels from low-risk produce and reserving clear expiry warnings solely for items posing genuine microbiological hazards. Retailers, meanwhile, can minimise waste by replacing buy-one-get-one offers on fresh goods with lower single-unit pricing and selling loose produce in flexible amounts. At the local level, municipalities that couple pay-as-you-throw residual bin fees with campaigns to raise public awareness of basic freezing and meal-planning techniques make the true cost of discarded food visible, motivating households to conserve resources more consistently.

In conclusion, domestic food waste persists not out of deliberate indifference, but because commercial incentives and confusing labels nudge families toward excess. Clearer labelling laws, fairer retail pricing, and smart municipal charging together offer a practical route to markedly leaner household bins.`,
    notes: [
      {
        quote:
          'Domestic food waste is driven mainly by misleading date labelling, retail bulk promotions, and disorganised shopping habits, and curbing it requires aligned reforms from regulators, supermarkets, and city councils.',
        noteVi:
          'Câu luận điểm nêu rõ 3 nguyên nhân thực tế và 3 tác nhân thực thi giải pháp, giúp người đọc nắm ngay bố cục toàn bài.',
        criterion: 'TR',
      },
      {
        quote: 'Foremost among these is widespread confusion over packaging dates.',
        noteVi:
          'Mở ý chính bằng cấu trúc đảo ngữ ngắn gọn ("Foremost among these is...") thay cho chuỗi liệt kê máy móc "Firstly/Secondly".',
        criterion: 'CC',
      },
      {
        quote: 'conflate advisory best-before guidance with strict safety deadlines',
        noteVi:
          'Động từ học thuật "conflate A with B" diễn đạt cực chuẩn hiện tượng nhầm lẫn giữa hai khái niệm hạn sử dụng.',
        criterion: 'LR',
      },
      {
        quote: 'entice shoppers into purchasing excess quantities that spoil before busy workweeks allow them to be cooked',
        noteVi:
          'Câu phức kết hợp mệnh đề quan hệ và mệnh đề thời gian với thể bị động ("to be cooked") mạch lạc, chính xác.',
        criterion: 'GRA',
      },
      {
        quote: 'restructuring the retail and municipal environment to modify consumer behaviour',
        noteVi:
          'Lồng ghép tự nhiên collocation mục tiêu ("modify consumer behaviour") ngay ở câu chủ đề đoạn giải pháp.',
        criterion: 'LR',
      },
      {
        quote: 'municipalities that couple pay-as-you-throw residual bin fees with campaigns to raise public awareness of basic freezing and meal-planning techniques',
        noteVi:
          'Giải pháp cụ thể kết hợp cơ chế tài chính và truyền thông giáo dục, kèm mệnh đề quan hệ xác định dài nhưng kiểm soát tốt.',
        criterion: 'GRA',
      },
      {
        quote: 'persists not out of deliberate indifference, but because commercial incentives and confusing labels nudge families toward excess',
        noteVi:
          'Cấu trúc tương phản "not out of..., but because..." tổng kết nguyên nhân gốc rễ sắc sảo và đúng tinh thần học thuật.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:waste_minimise_waste',
      'col:consumption_consumption_patterns',
      'col:behaviour_modify_consumer_behaviour',
      'col:awareness_raise_public_awareness_of',
      'col:resource_conserve_resources',
    ],
  },

  // =========================================================================
  // w2:027 - energy - problem_solution (diff 7)
  // =========================================================================
  {
    id: 'w2:027',
    essayType: 'problem_solution',
    topic: 'energy',
    difficulty: 7,
    prompt:
      'During increasingly hot summers, many national electricity grids suffer severe congestion and localised blackouts when demand spikes in the late afternoon. What are the root causes of this grid strain, and what solutions should energy planners pursue?',
    partsToAddress: [
      'Identify the infrastructural and demand-side causes of late-afternoon summer electricity grid congestion',
      'Propose concrete technical and policy solutions for energy planners to stabilise summer supply',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Synchronised air-conditioning surges coincide with falling solar output in the late afternoon.',
        develop:
          "As commuters return home around six o'clock during heatwaves, millions of cooling units switch on simultaneously just as rooftop solar panels lose sunlight.",
      },
      {
        side: 'cause',
        idea: 'Ageing transmission lines lack both thermal capacity and cross-regional interconnections.',
        develop:
          'Substations designed decades ago overheat in extreme weather and cannot import spare electricity quickly from cooler neighbouring regions.',
      },
      {
        side: 'cause',
        idea: 'Flat electricity tariffs give households no financial signal to shift appliance use off-peak.',
        develop:
          'When power costs the same at five in the afternoon as at two in the morning, residents run dishwashers, dryers, and electric vehicle chargers during peak hours.',
      },
      {
        side: 'solution',
        idea: 'Deploy utility-scale battery storage alongside upgraded regional transmission corridors.',
        develop:
          'Storing cheap midday solar surplus in grid-scale batteries allows utilities to discharge clean power smoothly during early-evening peaks.',
      },
      {
        side: 'solution',
        idea: 'Introduce time-of-use pricing and automated smart-appliance demand response.',
        develop:
          'Offering lower overnight rates and modest rebates for smart thermostats that pre-cool homes before peak hours flattens demand spikes painlessly.',
      },
      {
        side: 'solution',
        idea: 'Tighten building insulation and air-conditioner energy efficiency standards.',
        develop:
          'Better-insulated walls and high-efficiency heat pumps cut total cooling loads at source, reducing the capital needed to expand transmission lines.',
      },
    ],
    text: `As summer heatwaves intensify, electricity networks in many countries are buckling under sharp late-afternoon demand spikes, resulting in voltage drops and rolling blackouts. This seasonal congestion stems from synchronised cooling loads meeting ageing transmission lines under outdated pricing rules, and energy planners can resolve it only by pairing grid storage upgrades with smarter demand management.

The vulnerability of modern power grids during hot spells reflects a mismatch between how electricity is generated, delivered, and priced. Late in the afternoon, commercial cooling overlaps with millions of returning commuters switching on domestic air conditioners and kitchen appliances, creating an abrupt surge in peak demand precisely as solar generation begins to taper off. Meanwhile, much of the underlying transmission network consists of decades-old cables and transformers whose physical carrying capacity actually drops in extreme heat. Compounding these physical limits, flat retail tariffs conceal real-time scarcity from consumers, offering households little incentive to delay charging electric vehicles or running heavy appliances until overnight hours.

Stabilising summer grids therefore requires coordinated long-term investment on both the supply and demand sides. On the supply side, utilities must upgrade infrastructure by expanding cross-regional transmission links and installing grid-scale battery storage capable of capturing abundant midday solar output for evening release. Equally decisive, however, are demand-side reforms that shave peak loads before expensive new power stations are needed. Introducing transparent time-of-use tariffs, combined with voluntary smart-thermostat programmes that pre-cool buildings during cheaper afternoon windows, can smooth overall energy consumption without sacrificing comfort. Reinforcing these measures with stricter building insulation and appliance energy efficiency standards further lowers baseline cooling requirements permanently.

In summary, summer grid congestion is driven by concentrated cooling demand, dated networks, and rigid pricing. By uniting battery storage and modernised lines with flexible tariffs and efficient buildings, planners can ensure dependable electricity even during severe heatwaves.`,
    notes: [
      {
        quote:
          'This seasonal congestion stems from synchronised cooling loads meeting ageing transmission lines under outdated pricing rules, and energy planners can resolve it only by pairing grid storage upgrades with smarter demand management.',
        noteVi:
          'Câu thesis tổng hợp sắc nét cả yếu tố kỹ thuật lẫn cơ chế giá, mở ra lập luận chuyên sâu chuẩn Band 8 cho đề độ khó cao.',
        criterion: 'TR',
      },
      {
        quote: 'creating an abrupt surge in peak demand precisely as solar generation begins to taper off',
        noteVi:
          'Lồng ghép collocation "peak demand" cùng cụm động từ chính xác "taper off" mô tả đúng hiện tượng hụt điện mặt trời cuối chiều.',
        criterion: 'LR',
      },
      {
        quote: 'whose physical carrying capacity actually drops in extreme heat',
        noteVi:
          'Mệnh đề quan hệ sở hữu "whose..." bổ sung chi tiết kỹ thuật chân thực, tăng độ thuyết phục và đa dạng ngữ pháp.',
        criterion: 'GRA',
      },
      {
        quote: 'Stabilising summer grids therefore requires coordinated long-term investment on both the supply and demand sides.',
        noteVi:
          'Câu chủ đề đoạn 2 dùng khung kinh tế học cung–cầu (supply and demand sides) giúp cấu trúc giải pháp cực kỳ chặt chẽ.',
        criterion: 'CC',
      },
      {
        quote: 'upgrade infrastructure by expanding cross-regional transmission links and installing grid-scale battery storage',
        noteVi:
          'Giải pháp kỹ thuật cụ thể đi kèm collocation chuẩn ("upgrade infrastructure") thay vì chỉ nói chung chung "xây thêm nhà máy điện".',
        criterion: 'TR',
      },
      {
        quote: 'Equally decisive, however, are demand-side reforms that shave peak loads before expensive new power stations are needed.',
        noteVi:
          'Đảo ngữ tính từ "Equally decisive, however, are..." kết hợp động từ chuyên ngành "shave peak loads" rất ấn tượng.',
        criterion: 'GRA',
      },
      {
        quote: 'building insulation and appliance energy efficiency standards further lowers baseline cooling requirements permanently',
        noteVi:
          'Dùng cụm "energy efficiency standards" và "baseline cooling requirements" thể hiện độ chính xác từ vựng học thuật cao.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:demand_peak_demand',
      'col:energy_energy_consumption',
      'col:infrastructure_upgrade_infrastructure',
      'col:efficiency_energy_efficiency',
      'col:investment_long_term_investment',
    ],
  },

  // =========================================================================
  // w2:028 - science - problem_solution (diff 8)
  // =========================================================================
  {
    id: 'w2:028',
    essayType: 'problem_solution',
    topic: 'science',
    difficulty: 8,
    prompt:
      'Public distrust of peer-reviewed scientific research appears to be growing in several societies, complicating responses to health and environmental challenges. What are the main causes of this scepticism, and how can trust in science be rebuilt?',
    partsToAddress: [
      'Analyse the deeper causes behind growing public distrust of peer-reviewed science',
      'Propose credible institutional, communicative, and educational steps to restore public confidence',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Social-media algorithms amplify sensational counter-claims faster than nuanced scientific explanations.',
        develop:
          'Outrage-driven feeds reward confident falsehoods, whereas cautious researchers who state error margins and caveats sound hesitant to lay audiences.',
      },
      {
        side: 'cause',
        idea: 'Visible funding conflicts and high-profile retractions damage institutional credibility.',
        develop:
          'When corporate-sponsored studies later face correction or fail replication, citizens understandably question whether published findings serve public welfare or commercial interests.',
      },
      {
        side: 'cause',
        idea: 'Journalistic oversimplification turns provisional findings into contradictory headlines.',
        develop:
          'Reporting a single small trial as a definitive breakthrough—only to reverse the headline months later—makes the normal self-correcting nature of science look like incompetence.',
      },
      {
        side: 'solution',
        idea: 'Journals and universities should enforce open data, preregistered methods, and full funding disclosure.',
        develop:
          'Making raw datasets and sponsorship ties freely inspectable deters selective reporting and lets independent analysts verify empirical evidence rapidly.',
      },
      {
        side: 'solution',
        idea: 'Scientists and media outlets should communicate uncertainty transparently in plain language.',
        develop:
          'Explaining what a scientific consensus currently shows, and why guidance evolves as fresh data arrives, inoculates citizens against bad-faith distortion.',
      },
      {
        side: 'solution',
        idea: 'Secondary curricula should emphasise scientific method and statistical literacy over rote memorisation.',
        develop:
          'Pupils taught to distinguish correlation from causation and check sample sizes grow into adults far less likely to be misled by viral pseudo-science.',
      },
    ],
    text: `Despite extraordinary medical and technological breakthroughs, scepticism towards peer-reviewed research has deepened across several democracies, hindering coordinated action on public health and climate policy. This erosion of confidence stems from commercial conflicts of interest, distorted media incentives, and widespread misunderstanding of how science works, and rebuilding credibility demands rigorous research transparency alongside stronger public science literacy.

Public doubt does not arise solely from irrationality; institutional shortcomings and information ecosystems both play decisive parts. High-profile cases of industry-funded studies yielding favourable results, combined with replication failures in competitive academic publishing, have understandably fed suspicions that research can be steered by money or careerism. Outside laboratories, the proliferation of misinformation on digital platforms magnifies every genuine flaw. Because engagement-driven algorithms favour emotionally charged certainty over careful nuance, baseless counter-claims spread rapidly, while sensationalist news headlines that portray single provisional trials as absolute truth leave citizens bewildered whenever scientific consensus legitimately evolves.

Restoring durable trust therefore requires reform both inside academia and across public communication. Research institutions and journals must first strengthen integrity by mandating open datasets, pre-registered study protocols, and prominent disclosure of commercial funding, ensuring that empirical evidence can be independently audited rather than taken on faith. Equally important is changing how researchers disseminate research findings. Rather than speaking solely through technical jargon or defensive pronouncements, scientists and public broadcasters should explain clearly how peer review weeds out errors over time. Over the longer term, embedding statistical reasoning and critical evaluation of sources into secondary curricula will equip citizens to recognise trustworthy methodology and resist manipulative claims that undermine public trust.

In conclusion, waning faith in science reflects both institutional blind spots and an information landscape biased towards outrage. Through radical research openness, candid communication of uncertainty, and better science education, societies can mend the bridge between laboratories and the public.`,
    notes: [
      {
        quote: 'Public doubt does not arise solely from irrationality; institutional shortcomings and information ecosystems both play decisive parts.',
        noteVi:
          'Câu chủ đề cực kỳ sắc sảo và cân bằng, tránh đổ lỗi phiến diện cho công chúng, nâng rõ độ tinh tế của Task Response.',
        criterion: 'TR',
      },
      {
        quote: 'combined with replication failures in competitive academic publishing, have understandably fed suspicions that research can be steered by money or careerism',
        noteVi:
          'Dùng thuật ngữ học thuật chính xác ("replication failures", "careerism") chỉ thẳng gốc rễ khủng hoảng niềm tin trong giới nghiên cứu.',
        criterion: 'LR',
      },
      {
        quote: 'Because engagement-driven algorithms favour emotionally charged certainty over careful nuance, baseless counter-claims spread rapidly, while sensationalist news headlines',
        noteVi:
          'Câu ghép phức nhiều mệnh đề nhưng mạch lạc tuyệt đối, đối lập rõ cơ chế thuật toán với bản chất thận trọng của khoa học.',
        criterion: 'GRA',
      },
      {
        quote: 'Restoring durable trust therefore requires reform both inside academia and across public communication.',
        noteVi:
          'Câu chuyển đoạn gọn gàng, gắn chặt nhóm giải pháp với đúng hai nhóm nguyên nhân đã phân tích ở đoạn trên.',
        criterion: 'CC',
      },
      {
        quote: 'mandating open datasets, pre-registered study protocols, and prominent disclosure of commercial funding',
        noteVi:
          'Giải pháp cụ thể ở mức chính sách khoa học thực tế ("pre-registered study protocols", "open datasets"), rất thuyết phục.',
        criterion: 'TR',
      },
      {
        quote: 'Rather than speaking solely through technical jargon or defensive pronouncements, scientists and public broadcasters should explain clearly',
        noteVi:
          'Cấu trúc tương phản "Rather than + V-ing" tạo sự đa dạng ngữ pháp và nâng tính liên kết giữa phê phán và đề xuất.',
        criterion: 'GRA',
      },
      {
        quote: 'equip citizens to recognise trustworthy methodology and resist manipulative claims that undermine public trust',
        noteVi:
          'Lồng ghép mượt collocation "undermine public trust" và chốt đoạn giải pháp bằng tác động dài hạn qua giáo dục.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:undermine_undermine_public_trust',
      'col:consensus_scientific_consensus',
      'col:misinformation_the_proliferation_of_misinformation',
      'col:research_disseminate_research_findings',
      'col:evidence_empirical_evidence',
    ],
  },

  // =========================================================================
  // w2:029 - psychology - problem_solution (diff 6)
  // =========================================================================
  {
    id: 'w2:029',
    essayType: 'problem_solution',
    topic: 'psychology',
    difficulty: 6,
    prompt:
      'Chronic loneliness is increasingly reported among young adults who live alone in large cities, despite constant online connectivity. What causes this sense of isolation, and what can cities and communities do to alleviate it?',
    partsToAddress: [
      'Explain why young adults living alone in big cities experience chronic loneliness despite digital connectivity',
      'Suggest practical civic and community-level solutions to foster meaningful social ties',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Frequent job relocation and transient rental leases fracture local friendship networks.',
        develop:
          'Young professionals who move cities for career progression and shift flats every year struggle to invest the sustained time required for deep friendships.',
      },
      {
        side: 'cause',
        idea: 'Passive online interaction replaces face-to-face community rituals without delivering genuine belonging.',
        develop:
          'Scrolling through curated social feeds or chatting via brief text messages offers an illusion of closeness while exacerbating feelings of exclusion.',
      },
      {
        side: 'cause',
        idea: 'Commercialised urban design leaves few affordable, non-transactional places to linger and meet neighbours.',
        develop:
          'When parks are scarce and cafes expect rapid turnover, single residents retreat to studio flats after remote workdays with almost no casual civic contact.',
      },
      {
        side: 'solution',
        idea: 'Cities should invest in accessible third places such as public libraries, community kitchens, and sports clubs.',
        develop:
          'Free evening clubs, tool libraries, and recreational leagues create repeated low-pressure encounters through which acquaintances naturally become friends.',
      },
      {
        side: 'solution',
        idea: 'Urban planners can promote co-living developments with generous shared lounges and courtyards.',
        develop:
          'Designing apartment blocks around communal gardens and shared study rooms preserves private bedrooms while encouraging daily neighbourly conversation.',
      },
      {
        side: 'solution',
        idea: 'Employers and local councils should support civic volunteering and structured workplace social groups.',
        develop:
          'Paid volunteering days and municipal newcomer networks help recent arrivals build purposeful relationships rooted in shared local projects.',
      },
    ],
    text: `Although young adults in major cities remain perpetually reachable through messaging applications, surveys consistently show that solo urban dwellers suffer some of the highest rates of chronic loneliness. This paradox arises from transient living patterns, the shallow nature of digital substitutes, and the disappearance of affordable gathering spaces, yet thoughtful urban design and active civic programming can substantially restore everyday belonging.

Modern urban life often strips away the casual, repeated contact on which lasting friendships depend. Driven by competitive job markets, young professionals frequently relocate away from family networks and cycle through short-term studio rentals, leaving little continuity for neighbourly trust to take root. Remote and hybrid work arrangements, while convenient, have further pared back informal office conversations. Meanwhile, digital connectivity rarely fills the void: passive social-media browsing encourages unfavourable self-comparison rather than genuine intimacy, and brief online exchanges fail to supply the emotional reassurance of shared physical presence. Left unchecked, this chronic problem can exacerbate mental health issues such as anxiety and depression.

Because loneliness is shaped by physical environments as well as personal habits, cities and communities can take tangible steps to alleviate loneliness at scale. Municipal planners should first protect and fund non-commercial third places—including evening-access public libraries, neighbourhood sports pitches, and community arts workshops—where young residents can meet regularly without spending heavily. In housing policy, incentivising well-designed co-living blocks with communal kitchens and landscaped courtyards encourages effortless daily interaction while preserving individual privacy. Alongside spatial reforms, local councils and employers can foster social cohesion by sponsoring civic volunteering schemes and newcomer welcome groups, giving solo residents structured reasons to collaborate around shared local goals.

Ultimately, urban isolation among young adults reflects mobile lifestyles and environments built for consumption rather than connection. By reviving accessible public gathering spaces and shared residential design, cities can transform solitary living into vibrant community life and protect residents' mental well-being.`,
    notes: [
      {
        quote: 'Although young adults in major cities remain perpetually reachable through messaging applications, surveys consistently show that solo urban dwellers suffer some of the highest rates of chronic loneliness.',
        noteVi:
          'Mở bài dùng mệnh đề nhượng bộ (concessive clause) nêu bật nghịch lý của đề bài ngay từ câu đầu tiên.',
        criterion: 'GRA',
      },
      {
        quote: 'strips away the casual, repeated contact on which lasting friendships depend',
        noteVi:
          'Cấu trúc giới từ + đại từ quan hệ ("on which...") trang trọng và định vị trúng cơ chế tâm lý hình thành tình bạn.',
        criterion: 'GRA',
      },
      {
        quote: 'passive social-media browsing encourages unfavourable self-comparison rather than genuine intimacy',
        noteVi:
          'Giải thích sâu sắc vì sao kết nối mạng không thay thế được giao tiếp trực tiếp, tránh lối nói sáo về mạng xã hội.',
        criterion: 'TR',
      },
      {
        quote: 'Left unchecked, this chronic problem can exacerbate mental health issues such as anxiety and depression.',
        noteVi:
          'Mệnh đề phân từ quá khứ "Left unchecked" rút gọn điều kiện tinh tế, kết hợp mượt hai collocation mục tiêu.',
        criterion: 'LR',
      },
      {
        quote: 'Because loneliness is shaped by physical environments as well as personal habits, cities and communities can take tangible steps to alleviate loneliness at scale.',
        noteVi:
          'Câu chuyển đoạn kết nối chặt nguyên nhân không gian đô thị với giải pháp quy hoạch và cộng đồng.',
        criterion: 'CC',
      },
      {
        quote: 'non-commercial third places—including evening-access public libraries, neighbourhood sports pitches, and community arts workshops',
        noteVi:
          'Thuật ngữ xã hội học đô thị ("non-commercial third places") kèm ví dụ cụ thể tạo sức nặng học thuật cao.',
        criterion: 'LR',
      },
      {
        quote: 'giving solo residents structured reasons to collaborate around shared local goals',
        noteVi:
          'Chỉ rõ cơ chế vì sao hoạt động tình nguyện giúp giảm cô đơn (hợp tác có mục đích chung), hoàn thiện chiều sâu giải pháp.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:alleviate_alleviate_loneliness',
      'col:well_being_mental_well_being',
      'col:exacerbate_exacerbate_mental_health_issues',
      'col:foster_foster_social_cohesion',
      'col:problem_a_chronic_problem',
    ],
  },

  // =========================================================================
  // w2:030 - education - problem_solution (diff 7)
  // =========================================================================
  {
    id: 'w2:030',
    essayType: 'problem_solution',
    topic: 'education',
    difficulty: 7,
    prompt:
      'Many rural secondary schools struggle to recruit and retain qualified teachers, especially in science and mathematics, widening the educational gap with urban areas. What causes this shortage, and what measures can governments take to overcome it?',
    partsToAddress: [
      'Explain the professional, financial, and lifestyle factors driving rural teacher shortages',
      'Propose sustained government measures to attract and retain qualified rural educators',
    ],
    ideaBank: [
      {
        side: 'cause',
        idea: 'Modest salaries combined with professional isolation deter specialist graduates from rural posts.',
        develop:
          'Science and mathematics graduates can earn far higher pay in urban tech firms, and rural postings often lack mentoring networks or specialist laboratory facilities.',
      },
      {
        side: 'cause',
        idea: 'Limited local amenities and partner employment options shorten how long teachers stay.',
        develop:
          'Even idealistic newly qualified teachers frequently transfer back to cities after two years when their spouses struggle to find work or healthcare access is distant.',
      },
      {
        side: 'cause',
        idea: 'Small rural schools often force staff to teach outside their trained specialisms with heavy administrative loads.',
        develop:
          'Asking a single chemistry teacher to cover physics, biology, and pastoral duties without laboratory technicians accelerates burnout.',
      },
      {
        side: 'solution',
        idea: 'Offer targeted rural salary stipends, housing subsidies, and student-loan forgiveness tied to multi-year service.',
        develop:
          'Compensating relocation costs and forgiving tuition debt after five years in a rural school makes country postings financially competitive.',
      },
      {
        side: 'solution',
        idea: 'Recruit and train local residents through regional university scholarships and remote mentoring.',
        develop:
          'Educators who already have family ties in rural counties are far more likely to remain long term than urban graduates sent out temporarily.',
      },
      {
        side: 'solution',
        idea: 'Allocate funding to rural school infrastructure, specialist labs, and shared regional teaching hubs.',
        develop:
          'Pairing well-equipped classrooms with hybrid specialist seminars enables rural staff to collaborate with peers and keeps educational outcomes equitable.',
      },
    ],
    text: `While metropolitan secondary schools often attract dozens of applicants for every vacancy, rural districts routinely struggle to fill specialist posts in mathematics and the sciences, leaving country teenagers at a lasting academic disadvantage. This recruitment shortfall reflects a mix of uncompetitive compensation, professional isolation, and scarce local amenities, and governments can overcome it only by combining targeted financial incentives with home-grown training pathways.

Recruiting and retaining specialist educators in remote areas is difficult because rural postings impose both economic and career penalties. Graduates with strong quantitative backgrounds already command lucrative salaries in urban finance or technology firms; asking them to accept standard public-school pay in towns with limited housing or partner job prospects makes rural vacancies an unattractive proposition. Moreover, once teachers arrive, small school budgets often force them to teach unfamiliar subjects across multiple year groups with minimal laboratory support or peer mentoring. Faced with heavy workloads and few visible avenues for promotion, many young educators treat country schools merely as temporary stepping stones before transferring back to cities.

Closing this divide demands that ministries invest in education with policies tailored specifically to rural realities. In the short term, governments should allocate funding to retention packages—such as subsidised housing, rural pay allowances, and tuition-debt forgiveness tied to five-year service—to offset relocation sacrifices. Equally vital, however, is building a local talent pipeline. Offering bursaries for rural school-leavers and teaching assistants to qualify through blended regional degrees cultivates educators who already possess deep community roots and therefore stay far longer. Upgrading rural broadband and shared regional science hubs can further cut isolation, letting staff exchange resources and coaching without leaving their districts.

In summary, rural teacher shortages stem from inadequate incentives, workplace strain, and reliance on short-stay urban recruits. By uniting financial retention support with local teacher training and modernised facilities, governments can bridge the gap between rural and urban educational outcomes.`,
    notes: [
      {
        quote:
          'This recruitment shortfall reflects a mix of uncompetitive compensation, professional isolation, and scarce local amenities, and governments can overcome it only by combining targeted financial incentives with home-grown training pathways.',
        noteVi:
          'Thesis phân biệt rõ hai khía cạnh của đề ("recruit and retain") và đề xuất hai trụ cột giải pháp vừa ngắn hạn vừa bền vững.',
        criterion: 'TR',
      },
      {
        quote: 'command lucrative salaries in urban finance or technology firms; asking them to accept standard public-school pay',
        noteVi:
          'Collocation nâng cao "command lucrative salaries" và câu ghép có dấu chấm phẩy diễn đạt thuyết phục chi phí cơ hội của giáo viên giỏi.',
        criterion: 'LR',
      },
      {
        quote: 'Faced with heavy workloads and few visible avenues for promotion, many young educators treat country schools merely as temporary stepping stones',
        noteVi:
          'Mệnh đề phân từ quá khứ đầu câu tạo sự súc tích ngữ pháp, đồng thời mô tả đúng nguyên nhân không giữ chân được giáo viên.',
        criterion: 'GRA',
      },
      {
        quote: 'Closing this divide demands that ministries invest in education with policies tailored specifically to rural realities.',
        noteVi:
          'Câu chủ đề đoạn 2 dùng cấu trúc giả định thức trang trọng ("demands that ministries invest...") kết hợp collocation mục tiêu.',
        criterion: 'GRA',
      },
      {
        quote: 'Equally vital, however, is building a local talent pipeline.',
        noteVi:
          'Chuyển ý tự nhiên giữa giải pháp đãi ngộ tài chính ngắn hạn và chiến lược đào tạo nguồn nhân lực tại chỗ dài hạn.',
        criterion: 'CC',
      },
      {
        quote: 'cultivates educators who already possess deep community roots and therefore stay far longer',
        noteVi:
          'Giải thích rõ cơ chế vì sao đào tạo người địa phương giải quyết được bài toán giữ chân (retention) mà trợ cấp đơn thuần không làm hết.',
        criterion: 'TR',
      },
      {
        quote: 'bridge the gap between rural and urban educational outcomes',
        noteVi:
          'Kết bài tích hợp mượt hai collocation học thuật ("bridge the gap between", "educational outcomes") bám sát câu hỏi gốc.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:outcome_educational_outcomes',
      'col:funding_allocate_funding_to',
      'col:incentive_financial_incentives',
      'col:bridge_bridge_the_gap_between',
      'col:education_invest_in_education',
    ],
  },
];

const RAW_ITEMS_PART2 = [
  // =========================================================================
  // w2:031 - globalisation - positive_negative (diff 6)
  // =========================================================================
  {
    id: 'w2:031',
    essayType: 'positive_negative',
    topic: 'globalisation',
    difficulty: 6,
    prompt:
      'In many regions, local and regional languages are gradually giving way to a single global language for commerce, higher education, and diplomacy. Is this a positive or negative development?',
    partsToAddress: [
      'Take a clear evaluative stance on whether the shift toward a single global business tongue is positive or negative overall',
      'Weigh both the practical economic benefits and the cultural or social drawbacks with developed reasoning',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'A shared commercial tongue lowers transaction costs and accelerates cross-border trade.',
        develop:
          'When engineers, exporters, and regulators negotiate in one common language, firms avoid expensive translation bottlenecks and enter international supply chains far more easily.',
      },
      {
        side: 'for',
        idea: 'Common academic language speeds up global scientific collaboration and knowledge access.',
        develop:
          'Researchers from smaller economies can publish findings to a worldwide audience and draw immediately upon medical or climate breakthroughs produced abroad.',
      },
      {
        side: 'for',
        idea: 'Fluency in a global lingua franca widens career mobility for young graduates.',
        develop:
          'Workers from provincial towns gain access to remote international contracts and postgraduate fellowships once reserved for elites.',
      },
      {
        side: 'against',
        idea: 'Language displacement erodes intangible cultural heritage and local identity.',
        develop:
          'Every regional tongue encodes distinct ecological knowledge, oral literature, and historical idioms that vanish permanently once younger generations stop speaking it at home.',
      },
      {
        side: 'against',
        idea: 'Monolingual dominance deepens socio-economic inequality between fluent elites and rural communities.',
        develop:
          'Citizens who cannot afford private language tuition risk exclusion from higher education, judicial proceedings, and senior management posts within their own country.',
      },
      {
        side: 'against',
        idea: 'Linguistic uniformity narrows cognitive and artistic diversity across public life.',
        develop:
          'When cinema, journalism, and university debate converge on one dominant tongue, local nuance and distinct regional perspectives gradually fade.',
      },
    ],
    text: `As international trade and university research have become tightly integrated, a single global language has increasingly displaced regional tongues across boardrooms, lecture halls, and diplomatic summits. Although a common lingua franca brings undeniable practical efficiency, I believe that allowing regional languages to fade in its wake is a predominantly negative development because the cultural and social losses are largely irreversible.

Supporters of linguistic convergence rightly highlight its economic utility. Conducting contracts, aviation safety protocols, and scientific conferences in one shared medium eliminates costly translation delays and helps bridge cultural differences among trading partners. For smaller nations, proficiency in a global business language can boost the economy by attracting multinational investment and allowing local scholars to participate directly in international research networks. Viewed purely through the lens of commerce, a universal working tongue streamlines cooperation across borders.

Nevertheless, the homogenising effect of globalisation extracts a far steeper long-term price when commercial convenience gradually crowds out regional languages from schools and daily life. A language is not merely a neutral code for exchanging invoices; it is the living archive of a community's history, humour, and local ecological knowledge. Once parents stop passing a regional tongue to their children in pursuit of employability, that linguistic ecosystem collapses within two generations, eroding cultural heritage that cannot later be reconstructed. Equally troubling is the domestic inequality this shift breeds. When university admission and high-value employment depend heavily on fluency in an imported global language, rural and lower-income citizens become linguistic outsiders in their own homeland, undermining cultural diversity and civic participation alike.

In conclusion, while a shared global tongue is a valuable tool for international commerce, letting it supplant regional languages is overwhelmingly harmful. Societies should cultivate multilingualism—using a global language for external trade while actively safeguarding regional tongues as vital pillars of identity.`,
    notes: [
      {
        quote:
          'Although a common lingua franca brings undeniable practical efficiency, I believe that allowing regional languages to fade in its wake is a predominantly negative development because the cultural and social losses are largely irreversible.',
        noteVi:
          'Mở bài thể hiện quan điểm đánh giá rõ ràng, tinh tế ("predominantly negative") ngay trong câu thesis và lý giải ngắn gọn lý do cốt lõi.',
        criterion: 'TR',
      },
      {
        quote: 'helps bridge cultural differences among trading partners',
        noteVi:
          'Sử dụng tự nhiên collocation học thuật ("bridge cultural differences") khi thừa nhận điểm mạnh của xu hướng.',
        criterion: 'LR',
      },
      {
        quote: 'Viewed purely through the lens of commerce, a universal working tongue streamlines cooperation across borders.',
        noteVi:
          'Mệnh đề phân từ quá khứ "Viewed purely through..." vừa tinh gọn ngữ pháp vừa khép lại đoạn nhượng bộ để chuẩn bị phản biện.',
        criterion: 'GRA',
      },
      {
        quote: 'Nevertheless, the homogenising effect of globalisation extracts a far steeper long-term price when commercial convenience gradually crowds out regional languages',
        noteVi:
          'Chuyển đoạn mạnh mẽ bằng "Nevertheless", lồng ghép collocation dài "the homogenising effect of globalisation" rất mượt.',
        criterion: 'CC',
      },
      {
        quote: 'A language is not merely a neutral code for exchanging invoices; it is the living archive of a community\'s history, humour, and local ecological knowledge.',
        noteVi:
          'Câu ghép đối lập giàu hình ảnh học thuật giúp lập luận về giá trị văn hóa sâu sắc, tránh sáo rỗng.',
        criterion: 'LR',
      },
      {
        quote: 'When university admission and high-value employment depend heavily on fluency in an imported global language, rural and lower-income citizens become linguistic outsiders in their own homeland',
        noteVi:
          'Bổ sung tầng hệ quả xã hội (bất bình đẳng nội địa) bên cạnh tầng văn hóa, nâng chiều sâu lập luận lên Band 8+.',
        criterion: 'TR',
      },
      {
        quote: 'Societies should cultivate multilingualism—using a global language for external trade while actively safeguarding regional tongues as vital pillars of identity.',
        noteVi:
          'Kết bài khẳng định lại lập trường kèm hướng dung hòa hợp lý bằng cấu trúc gạch ngang và phân từ cân đối.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:globalisation_the_homogenising_effect_of_globalisation',
      'col:diversity_cultural_diversity',
      'col:heritage_erode_cultural_heritage',
      'col:bridge_bridge_cultural_differences',
      'col:economy_boost_the_economy',
    ],
  },

  // =========================================================================
  // w2:032 - media - positive_negative (diff 4)
  // =========================================================================
  {
    id: 'w2:032',
    essayType: 'positive_negative',
    topic: 'media',
    difficulty: 4,
    prompt:
      'Many people now rely primarily on short-form vertical videos on social-media platforms rather than long-form articles or news broadcasts to stay informed about current affairs. Is this a positive or negative development?',
    partsToAddress: [
      'Give a clear overall judgement on whether replacing long-form journalism with short-form video news is positive or negative',
      'Assess both the accessibility advantages and the informational or democratic drawbacks',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Brief visual clips engage younger audiences who rarely read traditional newspapers.',
        develop:
          'Dynamic captions and concise graphics lower entry barriers, prompting busy commuters or students to notice civic issues they might otherwise ignore.',
      },
      {
        side: 'for',
        idea: 'Mobile eyewitness footage brings breaking events from remote areas to global attention instantly.',
        develop:
          'Local residents can document floods or transport disruptions in real time before conventional broadcast crews arrive on site.',
      },
      {
        side: 'for',
        idea: 'Short explainers can serve as a gateway that directs curious viewers toward deeper reporting.',
        develop:
          'Reputable public broadcasters increasingly use sixty-second summaries with embedded links to guide viewers to full investigative features.',
      },
      {
        side: 'against',
        idea: 'Thirty-second formats strip away historical context, nuance, and competing evidence.',
        develop:
          'Complex policy debates such as healthcare financing or trade treaties cannot be evaluated responsibly in a few punchy soundbites.',
      },
      {
        side: 'against',
        idea: 'Algorithmic feeds prioritise emotional outrage over verification, accelerating misinformation.',
        develop:
          'Clips edited out of context or narrated with fabricated statistics generate far more shares than sober fact-checks, distorting public judgement.',
      },
      {
        side: 'against',
        idea: 'Diverting advertising revenue from newsrooms weakens investigative journalism.',
        develop:
          'When audiences consume repackaged summaries on video apps instead of subscribing to newspapers, original reporters lose the funding required to hold institutions accountable.',
      },
    ],
    text: `There is a growing trend towards consuming current affairs through thirty-second vertical clips on mobile feeds rather than through full-length articles or evening news programmes. While bite-sized video undeniably widens immediate reach, I consider its replacement of long-form journalism to be an overwhelmingly negative development that degrades public understanding and weakens accountability.

To its credit, short-form video has lowered barriers to initial news engagement. Younger citizens and time-pressed commuters who seldom purchase print newspapers or sit through hour-long bulletins are nonetheless exposed to major economic, environmental, and civic developments while scrolling on their phones. Moreover, rapid eyewitness clips uploaded directly from storm-hit towns or public demonstrations can alert audiences to unfolding crises far sooner than traditional broadcast schedules permit. Used strictly as an entry point, concise visual summaries can spark curiosity among previously disengaged groups.

However, when brief clips replace deeper reporting altogether, the informational costs become severe. First, a format engineered for instant retention cannot accommodate the historical background, statistical caveats, or counter-arguments needed to evaluate public policy; intricate issues such as pension reform or energy pricing are routinely compressed into polarising slogans that shape public attitudes towards simplification rather than analysis. Second, recommendation algorithms exert an influence on news habits by rewarding outrage and speed over verification, making it effortless for unverified rumours to spread misinformation faster than corrections can travel. Equally damaging is the commercial toll: as viewers stay inside video platforms instead of funding original newsrooms, long-term investigative reporting loses revenue, steadily undermining public trust in credible journalism.

In conclusion, although short-form video offers convenience and rapid visual alerts, relying on it as a primary news source leaves citizens poorly informed and vulnerable to distortion. Healthy public debate still depends on sustained, thoroughly verified long-form reporting.`,
    notes: [
      {
        quote:
          'While bite-sized video undeniably widens immediate reach, I consider its replacement of long-form journalism to be an overwhelmingly negative development that degrades public understanding and weakens accountability.',
        noteVi:
          'Câu mở đầu lập trường rõ ràng, dứt khoát ("overwhelmingly negative") đồng thời nêu hai trục phân tích chính ở thân bài.',
        criterion: 'TR',
      },
      {
        quote: 'Used strictly as an entry point, concise visual summaries can spark curiosity among previously disengaged groups.',
        noteVi:
          'Mệnh đề phân từ quá khứ giúp giới hạn chính xác phạm vi lợi ích của video ngắn, tạo nền tảng khách quan trước khi phản bác.',
        criterion: 'GRA',
      },
      {
        quote: 'However, when brief clips replace deeper reporting altogether, the informational costs become severe.',
        noteVi:
          'Chuyển đoạn dứt khoát từ lợi ích sang mặt trái và giữ trọng tâm đúng vào chữ "replacing" trong đề bài.',
        criterion: 'CC',
      },
      {
        quote: 'a format engineered for instant retention cannot accommodate the historical background, statistical caveats, or counter-arguments needed to evaluate public policy',
        noteVi:
          'Từ vựng chuyên ngành truyền thông và lập luận cực kỳ chính xác ("engineered for instant retention", "statistical caveats").',
        criterion: 'LR',
      },
      {
        quote: 'exert an influence on news habits by rewarding outrage and speed over verification, making it effortless for unverified rumours to spread misinformation',
        noteVi:
          'Tích hợp tự nhiên hai collocation mục tiêu ("exert an influence on", "spread misinformation") trong cấu trúc câu phức mượt mà.',
        criterion: 'LR',
      },
      {
        quote: 'Equally damaging is the commercial toll: as viewers stay inside video platforms instead of funding original newsrooms',
        noteVi:
          'Đảo ngữ kết hợp dấu hai chấm mở ra khía cạnh kinh tế báo chí—một góc nhìn sâu sắc vượt xa lập luận thông thường.',
        criterion: 'GRA',
      },
      {
        quote: 'Healthy public debate still depends on sustained, thoroughly verified long-form reporting.',
        noteVi:
          'Câu kết ngắn gọn, cô đọng, củng cố luận điểm mà không lặp từ máy móc hay dùng khẩu hiệu sáo.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:misinformation_spread_misinformation',
      'col:influence_exert_an_influence_on',
      'col:undermine_undermine_public_trust',
      'col:trend_a_growing_trend_towards',
      'col:attitude_shape_public_attitudes_towards',
    ],
  },

  // =========================================================================
  // w2:033 - work - positive_negative (diff 5)
  // =========================================================================
  {
    id: 'w2:033',
    essayType: 'positive_negative',
    topic: 'work',
    difficulty: 5,
    prompt:
      'In many industries, project-based freelance careers are gradually replacing traditional long-term employment with a single company. Do you think this is a positive or negative development?',
    partsToAddress: [
      'Present a clear evaluative position on the rise of project-based freelance careers over long-term employment',
      'Analyse both the flexibility gains and the security or career-development drawbacks',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Project-based work grants skilled professionals genuine autonomy over schedules and client selection.',
        develop:
          'Designers, translators, and software consultants can arrange hours around childcare or further study rather than adhering to rigid office attendance.',
      },
      {
        side: 'for',
        idea: 'Moving across varied assignments accelerates the acquisition of transferable skills.',
        develop:
          "Exposure to diverse teams and commercial problems prevents career stagnation and expands a freelancer's professional network rapidly.",
      },
      {
        side: 'for',
        idea: 'Businesses gain agility by hiring specialist expertise without carrying permanent overhead.',
        develop:
          'Small enterprises can commission high-level cybersecurity or marketing audits for three months without committing to a full-time executive salary.',
      },
      {
        side: 'against',
        idea: 'Freelance contracts strip away job security, paid leave, and employer pension contributions.',
        develop:
          'Without sick pay or severance protection, a single unexpected illness or client cancellation can push independent workers into immediate debt.',
      },
      {
        side: 'against',
        idea: 'Volatile monthly earnings complicate long-term life planning such as securing a mortgage.',
        develop:
          'Banks routinely treat irregular invoice income sceptically, delaying home ownership and family formation for younger contract workers.',
      },
      {
        side: 'against',
        idea: 'Firms underinvest in mentoring and formal training when staff are treated as temporary contractors.',
        develop:
          'Entry-level workers in fragmented gig sectors often miss structured apprenticeships, weakening national skills pipelines over time.',
      },
    ],
    text: `Across creative, technical, and advisory sectors, workers are increasingly assembling careers from sequential freelance contracts rather than spending decades on a single company payroll. Although independent project work offers real autonomy to established specialists, I believe its spread as a replacement for stable employment is on balance a negative development because it transfers disproportionate financial risk onto ordinary workers.

The appeal of freelance careers is easy to understand for both sides of the labour market. Skilled professionals who operate independently can choose clients selectively, decline pointless office routines, and organise working hours around family commitments or personal projects. Moving between varied briefs also builds transferable skills and broad commercial judgement far faster than repeating narrow duties inside one bureaucracy. For smaller businesses, meanwhile, contracting specialists on demand creates employment opportunities for niche talent while keeping fixed payroll costs manageable during uncertain quarters.

Yet these advantages accrue mainly to high-demand experts with strong bargaining power; for the broader workforce, the shift frequently breeds precarious employment. Unlike permanent staff, most project-based contractors receive no paid sick leave, holiday entitlement, or employer-matched pensions, forcing them to shoulder every economic shock alone. Irregular billing cycles also undermine job security and make essentials such as securing a housing mortgage or planning parental leave substantially harder. Equally concerning is the hidden loss of workplace mentorship: when companies rely heavily on short-term contractors, they have little incentive to invest in structured training for junior entrants, gradually hollowing out long-term professional development.

In conclusion, while project-based freelancing rewards autonomy and adaptability for top specialists, eroding permanent employment leaves too many workers financially exposed and under-supported. Without portable social benefits and stronger contract protections, this trend weakens rather than strengthens modern working life.`,
    notes: [
      {
        quote:
          'Although independent project work offers real autonomy to established specialists, I believe its spread as a replacement for stable employment is on balance a negative development because it transfers disproportionate financial risk onto ordinary workers.',
        noteVi:
          'Lập trường có sắc thái phân tầng rõ ràng (tốt cho chuyên gia đầu ngành nhưng bất lợi cho số đông), thể hiện tư duy phân tích Band 8.',
        criterion: 'TR',
      },
      {
        quote: 'builds transferable skills and broad commercial judgement far faster than repeating narrow duties inside one bureaucracy',
        noteVi:
          'Dùng collocation "transferable skills" kết hợp đối lập sinh động làm rõ điểm mạnh thực sự của làm tự do.',
        criterion: 'LR',
      },
      {
        quote: 'Yet these advantages accrue mainly to high-demand experts with strong bargaining power; for the broader workforce, the shift frequently breeds precarious employment.',
        noteVi:
          'Câu chuyển đoạn mẫu mực: dùng "Yet" kết hợp động từ học thuật "accrue to" và collocation "precarious employment" để lật vấn đề thuyết phục.',
        criterion: 'CC',
      },
      {
        quote: 'Unlike permanent staff, most project-based contractors receive no paid sick leave, holiday entitlement, or employer-matched pensions, forcing them to shoulder every economic shock alone.',
        noteVi:
          'Mệnh đề phân từ chỉ hệ quả ("forcing them to...") đi kèm dẫn chứng quyền lợi cụ thể giúp lập luận chắc chắn.',
        criterion: 'GRA',
      },
      {
        quote: 'Equally concerning is the hidden loss of workplace mentorship:',
        noteVi:
          'Đảo ngữ kết hợp dấu hai chấm mở ra luận điểm mới về đào tạo nhân sự trẻ—khía cạnh chiều sâu rất ăn điểm TR và GRA.',
        criterion: 'GRA',
      },
      {
        quote: 'gradually hollowing out long-term professional development',
        noteVi:
          'Cụm động từ học thuật "hollowing out" diễn đạt chính xác sự suy yếu dần từ bên trong của hệ thống đào tạo nghề.',
        criterion: 'LR',
      },
      {
        quote: 'Without portable social benefits and stronger contract protections, this trend weakens rather than strengthens modern working life.',
        noteVi:
          'Câu kết đưa điều kiện chính sách cụ thể để chốt đánh giá, tạo cảm giác hoàn chỉnh và khách quan.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:employment_stable_employment',
      'col:employment_precarious_employment',
      'col:security_job_security',
      'col:skill_transferable_skills',
      'col:opportunity_employment_opportunities',
    ],
  },

  // =========================================================================
  // w2:034 - urban - positive_negative (diff 7)
  // =========================================================================
  {
    id: 'w2:034',
    essayType: 'positive_negative',
    topic: 'urban',
    difficulty: 7,
    prompt:
      'In many cities, declining suburban shopping malls are being converted into e-commerce distribution and logistics hubs. Do you think this is a positive or negative development?',
    partsToAddress: [
      'State clearly whether converting suburban shopping malls into logistics hubs is positive or negative overall',
      'Weigh the economic reuse and delivery benefits against traffic, environmental, and civic drawbacks',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Repurposing vacant malls revives derelict land and restores municipal tax revenue.',
        develop:
          'Empty retail complexes otherwise decay into eyesores that depress nearby property values, whereas logistics tenants fund site upkeep and pay local business rates.',
      },
      {
        side: 'for',
        idea: 'Placing fulfilment centres near suburbs shortens last-mile delivery routes and generates local jobs.',
        develop:
          'Shorter delivery trips cut fuel burn per parcel and provide steady warehouse, maintenance, and fleet-dispatch employment for suburban residents.',
      },
      {
        side: 'for',
        idea: 'Adaptive reuse avoids the heavy carbon footprint of demolishing concrete structures and clearing farmland.',
        develop:
          'Converting existing paved sites spares greenbelt meadows on the urban fringe from industrial sprawl.',
      },
      {
        side: 'against',
        idea: 'Round-the-clock heavy lorry movements exacerbate congestion, air pollution, and noise.',
        develop:
          'Suburban avenues designed for daytime family cars deteriorate quickly under constant articulated trucks, disrupting adjacent housing estates and school runs.',
      },
      {
        side: 'against',
        idea: 'Converting malls into closed warehouses permanently eliminates vital suburban civic spaces.',
        develop:
          'For older residents and teenagers alike, shopping centres historically served as weather-protected social hubs that fenced logistics depots cannot replace.',
      },
      {
        side: 'against',
        idea: 'Opportunity cost is high when prime transit-adjacent land could instead become mixed-use housing and parks.',
        develop:
          'Locking vast suburban plots into single-use industrial sheds forfeits a rare chance to build walkable apartments, clinics, and green squares.',
      },
    ],
    text: `As online retailing has hollowed out traditional department stores, property developers in many metropolitan regions have begun converting vacant suburban shopping malls into e-commerce fulfilment and logistics hubs. Although adaptive reuse offers short-term fiscal relief, I regard this transformation as largely negative overall because it introduces heavy freight disruption into residential neighbourhoods while squandering rare sites suited for mixed-use housing.

Advocates of warehouse conversions point to pragmatic economic and environmental gains. Left empty, sprawling suburban malls rapidly deteriorate, eroding municipal tax bases and blighting surrounding streets. Repurposing these already paved structures into parcel distribution centres can boost the economy locally by creating dispatch and maintenance jobs without bulldozing greenbelt farmland further outside the city. Positioning storage closer to dense consumer populations can also shorten last-mile delivery trips, potentially curbing van mileage if fleets transition to electric vehicles.

Even so, inserting industrial freight operations into residential suburbs carries heavy civic costs. Suburban road networks and transport infrastructure were rarely engineered for continuous streams of articulated lorries; diverting freight onto neighbourhood boulevards tends to exacerbate congestion, degrade local air quality, and generate persistent noise pollution near schools and housing estates. Just as significant is the permanent loss of public life. Whereas shopping centres once functioned as climate-controlled gathering spaces for elderly residents and young families, fenced distribution depots turn active corners into sterile dead zones. Worse still, locking large, well-connected parcels into single-use logistics forfeits an irreplaceable opportunity for sustainable development—namely, redeveloping dead malls into affordable apartments, community clinics, and planted parks that genuinely serve local residents.

In conclusion, while converting empty malls into logistics hubs prevents immediate commercial blight, the resulting freight nuisance and lost civic potential outweigh those gains. Cities would achieve far greater long-term value by reimagining obsolete retail sites as liveable mixed-use neighbourhoods.`,
    notes: [
      {
        quote:
          'Although adaptive reuse offers short-term fiscal relief, I regard this transformation as largely negative overall because it introduces heavy freight disruption into residential neighbourhoods while squandering rare sites suited for mixed-use housing.',
        noteVi:
          'Luận điểm mở bài vừa thẳng thắn vừa giàu tầm nhìn quy hoạch đô thị (so sánh chi phí cơ hội với nhà ở hỗn hợp).',
        criterion: 'TR',
      },
      {
        quote: 'Left empty, sprawling suburban malls rapidly deteriorate, eroding municipal tax bases and blighting surrounding streets.',
        noteVi:
          'Kết hợp mệnh đề phân từ quá khứ đầu câu với cặp phân từ hiện tại song song ("eroding... and blighting...") rất mượt và giàu hình ảnh.',
        criterion: 'GRA',
      },
      {
        quote: 'Even so, inserting industrial freight operations into residential suburbs carries heavy civic costs.',
        noteVi:
          'Cụm chuyển tiếp "Even so" gọn gàng, đưa trọng tâm thẳng vào mâu thuẫn công năng giữa kho bãi công nghiệp và khu dân cư.',
        criterion: 'CC',
      },
      {
        quote: 'tends to exacerbate congestion, degrade local air quality, and generate persistent noise pollution',
        noteVi:
          'Chuỗi động từ song song kết hợp hai collocation mục tiêu ("exacerbate congestion", "noise pollution") với hedging tự nhiên ("tends to").',
        criterion: 'LR',
      },
      {
        quote: 'Whereas shopping centres once functioned as climate-controlled gathering spaces for elderly residents and young families, fenced distribution depots turn active corners into sterile dead zones.',
        noteVi:
          'Câu phức đối lập bằng "Whereas" khắc họa sắc nét sự mất mát không gian cộng đồng ("sterile dead zones").',
        criterion: 'GRA',
      },
      {
        quote: 'forfeits an irreplaceable opportunity for sustainable development—namely, redeveloping dead malls into affordable apartments, community clinics, and planted parks',
        noteVi:
          'Phân tích chi phí cơ hội đất đai (opportunity cost) giúp lập luận vượt trội về chiều sâu và tính thuyết phục.',
        criterion: 'TR',
      },
      {
        quote: 'prevents immediate commercial blight',
        noteVi:
          'Từ vựng đô thị học thuật ("commercial blight", "adaptive reuse", "greenbelt farmland") nâng rõ điểm Lexical Resource.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:infrastructure_transport_infrastructure',
      'col:congestion_exacerbate_congestion',
      'col:pollution_noise_pollution',
      'col:economy_boost_the_economy',
      'col:development_sustainable_development',
    ],
  },

  // =========================================================================
  // w2:035 - education - positive_negative (diff 3)
  // =========================================================================
  {
    id: 'w2:035',
    essayType: 'positive_negative',
    topic: 'education',
    difficulty: 3,
    prompt:
      'An increasing number of school-leavers choose to spend a year in paid employment before starting university instead of entering higher education straight after secondary school. Is this a positive or negative development?',
    partsToAddress: [
      'State a clear judgement on whether working for a year before university is a positive or negative trend',
      'Evaluate both the personal/academic benefits and the potential risks of delaying enrolment',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Workplace experience builds emotional maturity, self-discipline, and interpersonal skills.',
        develop:
          'Teenagers who manage real shift schedules, customers, and budgets arrive on campus far better equipped to handle independent study than sheltered school-leavers.',
      },
      {
        side: 'for',
        idea: 'Earning an income before enrolment eases student debt and clarifies degree choices.',
        develop:
          'Working inside an office, clinic, or workshop helps young adults test whether a prospective profession truly suits them before committing three years of tuition fees.',
      },
      {
        side: 'for',
        idea: 'A structured break from exams prevents academic burnout and renews motivation.',
        develop:
          'After years of intensive secondary testing, twelve months of practical work restores curiosity and often improves first-year university retention.',
      },
      {
        side: 'against',
        idea: 'Extended time away from classrooms can erode quantitative and essay-writing habits.',
        develop:
          'Students entering demanding fields such as engineering or pure mathematics may find rusty calculus skills harder to revive after twelve months out of study.',
      },
      {
        side: 'against',
        idea: 'Some young workers become accustomed to a steady paycheque and abandon degree plans altogether.',
        develop:
          'Short-term financial independence in entry-level retail or hospitality roles can tempt capable applicants to forgo qualifications that yield higher lifetime earnings.',
      },
      {
        side: 'against',
        idea: 'Low-skilled temporary jobs may offer limited career relevance if poorly chosen.',
        develop:
          'Without clear goals or savings targets, a working gap year can drift into repetitive minimum-wage shifts that neither fund study nor sharpen career direction.',
      },
    ],
    text: `Rather than moving straight from secondary exams into university lecture theatres, a growing share of school-leavers now spend twelve months in full-time employment before commencing their degrees. Although pausing formal study carries minor academic risks, I consider this trend to be a decidedly positive development that produces more focused, resilient, and financially prepared undergraduates.

Critics of a working gap year raise two understandable concerns. First, stepping away from structured classrooms for twelve months can blunt technical study habits, particularly in cumulative disciplines such as physics or mathematics where regular problem-solving matters. Second, once eighteen-year-olds experience the immediate freedom of a monthly wage, a small proportion lose momentum and defer tertiary education indefinitely, potentially settling for low-ceiling jobs that restrict their long-term career prospects.

Nevertheless, for the great majority of structured applicants, the tangible benefits of a pre-university working year comfortably outweigh these drawbacks. Managing real deadlines, collaborating with older colleagues, and navigating workplace disagreements cultivate interpersonal skills and personal accountability that secondary schools seldom teach. Equally valuable is the clarity that practical employment brings to degree selection. A prospective architecture or healthcare student who spends a year assisting in a design studio or community pharmacy gains realistic insight into daily working life, dramatically reducing the risk of costly mid-degree dropouts. Financially, too, earning and saving before enrolment cushions living costs, easing dependence on high-interest loans and allowing undergraduates to concentrate more fully on coursework once lectures begin.

In conclusion, while a year away from textbooks requires discipline to avoid losing academic momentum, working before university yields a favourable outcome for most young adults. By fostering maturity, clearer career direction, and modest financial independence, paid pre-university experience enriches higher education rather than undermining it.`,
    notes: [
      {
        quote:
          'Although pausing formal study carries minor academic risks, I consider this trend to be a decidedly positive development that produces more focused, resilient, and financially prepared undergraduates.',
        noteVi:
          'Câu thesis khẳng định quan điểm rõ ràng ("decidedly positive") và gói gọn ba giá trị cốt lõi sẽ chứng minh ở thân bài.',
        criterion: 'TR',
      },
      {
        quote: 'blunt technical study habits, particularly in cumulative disciplines such as physics or mathematics',
        noteVi:
          'Cách diễn đạt chính xác ("blunt... habits", "cumulative disciplines") cho thấy lập luận phản biện có chiều sâu học thuật.',
        criterion: 'LR',
      },
      {
        quote: 'settling for low-ceiling jobs that restrict their long-term career prospects',
        noteVi:
          'Tích hợp collocation "career prospects" cùng tính từ ghép giàu nghĩa "low-ceiling jobs" rất tự nhiên.',
        criterion: 'LR',
      },
      {
        quote: 'Nevertheless, for the great majority of structured applicants, the tangible benefits of a pre-university working year comfortably outweigh these drawbacks.',
        noteVi:
          'Chuyển đoạn rõ ràng, giữ lập trường nhất quán và liên kết trực tiếp với các rủi ro vừa thừa nhận ở đoạn trên.',
        criterion: 'CC',
      },
      {
        quote: 'Managing real deadlines, collaborating with older colleagues, and navigating workplace disagreements cultivate interpersonal skills',
        noteVi:
          'Ba cụm danh động từ song song làm chủ ngữ tạo nhịp điệu trang trọng và kiểm soát tốt hòa hợp chủ–vị.',
        criterion: 'GRA',
      },
      {
        quote: 'A prospective architecture or healthcare student who spends a year assisting in a design studio or community pharmacy gains realistic insight into daily working life, dramatically reducing the risk of costly mid-degree dropouts.',
        noteVi:
          'Ví dụ minh họa cụ thể, sát thực tế đi kèm mệnh đề phân từ chỉ hệ quả giúp lập luận cực kỳ thuyết phục.',
        criterion: 'TR',
      },
      {
        quote: 'By fostering maturity, clearer career direction, and modest financial independence, paid pre-university experience enriches higher education rather than undermining it.',
        noteVi:
          'Kết bài cân đối, dùng cấu trúc "rather than + V-ing" khép lại bài viết chặt chẽ và tự nhiên.',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:education_tertiary_education',
      'col:skill_interpersonal_skills',
      'col:prospect_career_prospects',
      'col:benefit_tangible_benefits',
      'col:outcome_a_favourable_outcome',
    ],
  },

  // =========================================================================
  // w2:036 - health - positive_negative (diff 8)
  // =========================================================================
  {
    id: 'w2:036',
    essayType: 'positive_negative',
    topic: 'health',
    difficulty: 8,
    prompt:
      "Private companies now sell direct-to-consumer genetic testing kits that claim to predict individuals' risks of developing hereditary diseases without a doctor's involvement. Is this a positive or negative development?",
    partsToAddress: [
      'Take a clear, nuanced evaluative position on unregulated direct-to-consumer genetic health kits',
      'Examine both preventive health benefits and clinical, psychological, or privacy risks',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Early awareness of hereditary predispositions can motivate proactive lifestyle changes and screening.',
        develop:
          'Discovering an elevated genetic risk for cardiovascular disease or specific cancers can prompt adults to quit smoking, adjust diets, and request routine clinical check-ups earlier.',
      },
      {
        side: 'for',
        idea: 'Affordable home kits widen access to screening beyond patients who already show severe symptoms.',
        develop:
          'People without detailed family medical histories—such as adoptees—can uncover actionable genetic markers that standard public clinics rarely test routinely.',
      },
      {
        side: 'for',
        idea: 'Aggregated voluntary genetic databases can accelerate biomedical discovery when properly consented.',
        develop:
          'Large anonymised cohorts help researchers identify rare risk variants faster than small hospital studies alone.',
      },
      {
        side: 'against',
        idea: 'Probabilistic risk scores received without clinical counselling trigger severe anxiety or false reassurance.',
        develop:
          'Lay consumers frequently misread a slightly raised relative risk as an inevitable diagnosis, or conversely treat a clean commercial report as licence to ignore symptoms.',
      },
      {
        side: 'against',
        idea: 'Commercial storage of intimate DNA records poses serious data privacy and insurance-discrimination threats.',
        develop:
          'Unlike a stolen password, a leaked genetic profile cannot be reset, and corporate bankruptcies or weak laws risk exposing sensitive traits of entire biological families.',
      },
      {
        side: 'against',
        idea: 'Inconsistent test panels burden public health systems with unnecessary follow-up appointments.',
        develop:
          'When anxious buyers bring imprecise commercial reports to public doctors for re-testing, overstretched clinics divert scarce diagnostic capacity from urgent patients.',
      },
    ],
    text: `Commercial biotechnology firms now market mail-order genetic testing kits directly to the public, promising insights into hereditary disease risks without clinical supervision. While wider access to personal biological data holds genuine promise for disease prevention, I argue that the rapid expansion of unregulated direct-to-consumer testing is a largely negative development because clinical misinterpretation and irreversible privacy risks currently outweigh its benefits.

Proponents rightly note that democratising genetic screening can encourage proactive care. Individuals with incomplete family medical histories, for example, may uncover high-risk hereditary markers early enough to pursue timely specialist monitoring or adopt protective dietary and exercise habits. In specific cases where a well-established genetic variant warrants earlier screening, private kits can empower motivated consumers to engage with healthcare services before symptoms emerge, contributing modestly to broader public health goals.

Yet bypassing trained clinicians exposes an inherent drawback of commercial health genetics: raw probabilistic data is notoriously easy to misread. Without a genetic counsellor to explain penetrance, environmental factors, and test limitations, buyers can suffer acute psychological distress over marginal statistical elevations—or, just as dangerously, derive false reassurance from narrow test panels that omit common mutations. Furthermore, frightened customers routinely seek confirmatory scans from overstretched public hospitals, diverting clinical resources from higher-need patients. Equally alarming is the threat to data privacy. Because DNA uniquely identifies not only the buyer but also blood relatives who never consented, a corporate security breach or commercial sale of genetic archives can pose a serious risk to long-term employability and insurance fairness, with damage that—unlike a compromised credit card—can never be undone.

In conclusion, although home genetic kits can occasionally prompt welcome preventive habits, marketing complex medical risk predictions without clinical oversight and airtight privacy law does more harm than good. Genetic health testing belongs within regulated medical pathways rather than impulse retail.`,
    notes: [
      {
        quote:
          'While wider access to personal biological data holds genuine promise for disease prevention, I argue that the rapid expansion of unregulated direct-to-consumer testing is a largely negative development because clinical misinterpretation and irreversible privacy risks currently outweigh its benefits.',
        noteVi:
          'Luận điểm mở bài sắc bén, đặt đúng trọng tâm vào yếu tố "không có sự giám sát y khoa" (unregulated / without clinical supervision) của đề bài.',
        criterion: 'TR',
      },
      {
        quote: 'bypassing trained clinicians exposes an inherent drawback of commercial health genetics: raw probabilistic data is notoriously easy to misread.',
        noteVi:
          'Câu chủ đề đoạn phản biện súc tích, lồng collocation "an inherent drawback" cùng dấu hai chấm giải thích chính xác bản chất thống kê của xét nghiệm gen.',
        criterion: 'CC',
      },
      {
        quote: 'Without a genetic counsellor to explain penetrance, environmental factors, and test limitations, buyers can suffer acute psychological distress over marginal statistical elevations—or, just as dangerously, derive false reassurance',
        noteVi:
          'Lập luận hai chiều cực sâu (lo âu quá mức lẫn chủ quan sai lầm) cùng thuật ngữ y sinh chuẩn ("genetic counsellor", "false reassurance").',
        criterion: 'LR',
      },
      {
        quote: 'diverting clinical resources from higher-need patients',
        noteVi:
          'Chỉ ra tác động ngoại ứng lên hệ thống y tế công—một luận điểm cấp Band 8 rất thuyết phục.',
        criterion: 'TR',
      },
      {
        quote: 'Because DNA uniquely identifies not only the buyer but also blood relatives who never consented',
        noteVi:
          'Cấu trúc tương quan "not only... but also..." kết hợp mệnh đề quan hệ làm nổi bật chiều sâu đạo đức quyền riêng tư.',
        criterion: 'GRA',
      },
      {
        quote: 'with damage that—unlike a compromised credit card—can never be undone',
        noteVi:
          'So sánh ẩn dụ học thuật sắc gọn kẹp giữa hai dấu gạch ngang tăng mạnh độ ấn tượng của lập luận và ngữ pháp.',
        criterion: 'GRA',
      },
      {
        quote: 'Genetic health testing belongs within regulated medical pathways rather than impulse retail.',
        noteVi:
          'Câu chốt hàm súc, đối lập từ vựng sắc nét ("regulated medical pathways" vs "impulse retail").',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:prevention_disease_prevention',
      'col:privacy_data_privacy',
      'col:risk_pose_a_serious_risk_to',
      'col:health_public_health',
      'col:drawback_an_inherent_drawback',
    ],
  },

  // =========================================================================
  // w2:037 - economy - positive_negative (diff 6)
  // =========================================================================
  {
    id: 'w2:037',
    essayType: 'positive_negative',
    topic: 'economy',
    difficulty: 6,
    prompt:
      'More companies are shifting from selling products outright to offering them exclusively through recurring subscription models, ranging from software and cars to household appliances. Is this a positive or negative development?',
    partsToAddress: [
      'State clearly whether replacing outright ownership with recurring subscriptions is positive or negative overall',
      'Weigh lower upfront costs and maintenance convenience against cumulative expense and loss of consumer autonomy',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Monthly fees lower upfront barriers to high-value tools and equipment.',
        develop:
          'Start-ups and modest-income households can access professional software suites or energy-efficient appliances immediately without depleting emergency savings.',
      },
      {
        side: 'for',
        idea: 'Retention-based business models can incentivise manufacturers to build durable, repairable hardware.',
        develop:
          'When a washing-machine maker retains ownership and pays for repairs under a subscription, designing longer-lasting parts becomes directly profitable.',
      },
      {
        side: 'for',
        idea: 'Predictable recurring income helps firms fund continuous security updates and customer support.',
        develop:
          'Steady cash flow allows software developers to patch vulnerabilities and refine features steadily rather than relying on erratic launch cycles.',
      },
      {
        side: 'against',
        idea: 'Cumulative subscription fees cost consumers substantially more over a product lifespan than buying once.',
        develop:
          'Paying indefinitely for basic software or already-installed car features extracts permanent rent from households without building any resale equity.',
      },
      {
        side: 'against',
        idea: 'Companies can raise prices unilaterally or disable features remotely once buyers are locked in.',
        develop:
          'When essential work files or smart-home devices stop functioning the moment a payment lapses, consumers lose genuine control over tools they rely on daily.',
      },
      {
        side: 'against',
        idea: 'Subscription fatigue and complex cancellation hurdles exploit consumer inertia.',
        develop:
          'Dozens of overlapping auto-renewing charges quietly drain family budgets and obscure true monthly spending.',
      },
    ],
    text: `From creative software and digital media to vehicles and domestic appliances, businesses are increasingly abandoning outright sales in favour of recurring subscription plans. When we weigh the benefits against the drawbacks of this shift in consumption patterns, the spread of mandatory subscriptions appears predominantly negative because it steadily erodes consumer ownership and inflates lifetime household costs.

There are, admittedly, circumstances where subscription access serves both buyers and firms well. Lower upfront fees allow small businesses and young households to use sophisticated design software or modern heat-pump systems without large initial loans, while providing companies with a predictable revenue stream to finance continuous maintenance and security updates. In hardware sectors specifically, leasing models can theoretically encourage manufacturers to build more repairable machines, since the provider—rather than the customer—absorbs repair expenses when poorly engineered components fail prematurely.

In practice, however, replacing outright ownership entirely shifts bargaining power overwhelmingly towards corporations. Over several years of ordinary use, recurring charges almost always exceed a single purchase price, turning one-off necessities into perpetual monthly bills that leave households with zero resale value. Even more troubling is the loss of consumer autonomy. Once customers become dependent on proprietary cloud tools or subscription-locked vehicle features, providers can impose steep fee hikes or alter terms unilaterally, knowing that switching carries high disruption. Meanwhile, deliberate friction in cancellation procedures exploits human inertia, allowing dozens of auto-renewing fees to drain budgets unnoticed unless regulators actively enforce consumer protection.

In conclusion, while optional subscriptions can usefully reduce upfront barriers for specialised services, making recurring payments the sole route to everyday goods is largely detrimental. Preserving the right to buy products outright remains essential for fair pricing, household thrift, and genuine consumer independence.`,
    notes: [
      {
        quote:
          'When we weigh the benefits against the drawbacks of this shift in consumption patterns, the spread of mandatory subscriptions appears predominantly negative because it steadily erodes consumer ownership and inflates lifetime household costs.',
        noteVi:
          'Câu mở đầu lập trường tích hợp mượt hai collocation mục tiêu ("weigh the benefits against the drawbacks", "consumption patterns") và nêu rõ trọng tâm phản biện.',
        criterion: 'TR',
      },
      {
        quote: 'providing companies with a predictable revenue stream to finance continuous maintenance and security updates',
        noteVi:
          'Lồng ghép tự nhiên collocation "a revenue stream" để phân tích khách quan động cơ kinh tế phía doanh nghiệp.',
        criterion: 'LR',
      },
      {
        quote: 'since the provider—rather than the customer—absorbs repair expenses when poorly engineered components fail prematurely',
        noteVi:
          'Sử dụng cụm chen giữa hai dấu gạch ngang tạo nhấn mạnh rõ cơ chế kinh tế tuần hoàn trong thuê bao thiết bị.',
        criterion: 'GRA',
      },
      {
        quote: 'In practice, however, replacing outright ownership entirely shifts bargaining power overwhelmingly towards corporations.',
        noteVi:
          'Chuyển đoạn mượt từ giả thuyết lý tưởng ("theoretically") sang thực tế thị trường ("In practice, however").',
        criterion: 'CC',
      },
      {
        quote: 'turning one-off necessities into perpetual monthly bills that leave households with zero resale value',
        noteVi:
          'Diễn đạt sắc nét bản chất tài chính của mô hình thuê bao (mất tài sản có thể bán lại) bằng ngôn ngữ kinh tế chuẩn.',
        criterion: 'LR',
      },
      {
        quote: 'Once customers become dependent on proprietary cloud tools or subscription-locked vehicle features, providers can impose steep fee hikes or alter terms unilaterally, knowing that switching carries high disruption.',
        noteVi:
          'Câu phức kết hợp mệnh đề thời gian "Once..." và phân từ "knowing that..." phân tích sâu hiệu ứng khóa chân khách hàng (lock-in).',
        criterion: 'GRA',
      },
      {
        quote: 'while optional subscriptions can usefully reduce upfront barriers for specialised services, making recurring payments the sole route to everyday goods is largely detrimental.',
        noteVi:
          'Kết bài phân biệt rành mạch giữa thuê bao tự chọn và thuê bao độc quyền, thể hiện lập luận tinh tế chuẩn Band 8.',
        criterion: 'TR',
      },
    ],
    usefulCollocationIds: [
      'col:consumption_consumption_patterns',
      'col:revenue_a_revenue_stream',
      'col:benefit_weigh_the_benefits_against_the_drawbacks',
      'col:behaviour_modify_consumer_behaviour',
      'col:enforce_enforce_consumer_protection',
    ],
  },

  // =========================================================================
  // w2:038 - family - positive_negative (diff 5)
  // =========================================================================
  {
    id: 'w2:038',
    essayType: 'positive_negative',
    topic: 'family',
    difficulty: 5,
    prompt:
      'In many developed economies, couples are increasingly choosing to delay having their first child until their mid- or late thirties. Do you think this is a positive or negative development?',
    partsToAddress: [
      'Express a clear overall judgement on the trend toward later parenthood',
      'Weigh emotional and financial readiness against medical, familial, and demographic challenges',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Older parents generally bring stronger financial stability and secure housing to family life.',
        develop:
          'Having spent a decade establishing careers and savings, couples in their thirties can absorb childcare expenses and mortgage payments with far less acute economic anxiety.',
      },
      {
        side: 'for',
        idea: 'Greater emotional maturity often fosters calmer, more deliberate parenting.',
        develop:
          'Adults who have already travelled, lived independently, and resolved early career uncertainty tend to feel less resentment over the sacrifices child-rearing entails.',
      },
      {
        side: 'for',
        idea: 'Delaying parenthood allows women and men alike to consolidate qualifications and career prospects.',
        develop:
          'Reaching senior or flexible roles before taking parental leave makes returning to skilled work more sustainable for both partners.',
      },
      {
        side: 'against',
        idea: 'Fertility declines significantly in the late thirties alongside higher obstetric health risks.',
        develop:
          'Couples who postpone family planning may encounter unexpected conception difficulties or require expensive, emotionally taxing medical assistance.',
      },
      {
        side: 'against',
        idea: 'Later parenthood can create a sandwich-generation squeeze between young children and ageing parents.',
        develop:
          'Adults raising toddlers in their forties frequently find themselves caring simultaneously for frail grandparents in their seventies, straining time and energy.',
      },
      {
        side: 'against',
        idea: 'Widespread postponement lowers overall national birth rates and accelerates workforce ageing.',
        develop:
          'Smaller family sizes shrink the future tax base needed to fund public pensions and healthcare systems.',
      },
    ],
    text: `Across most industrialised societies, there is a growing trend towards postponing parenthood until the mid- or late thirties, a marked departure from earlier generations who started families in their early twenties. Although delaying childbirth introduces genuine biological and demographic complications, I believe that for individual families the benefits generally outweigh the drawbacks, provided adults have realistic information about reproductive health.

At the household level, waiting until the thirties equips couples far better to shoulder responsibility for raising children. By that stage of adulthood, partners have typically completed higher education, established durable career prospects, and accumulated modest savings or secure housing. Financial stability does more than pay for nursery fees; it markedly alleviates the pressure on daily family life, shielding children from the chronic stress that often accompanies early-career precarity. Equally important is emotional readiness. Adults who have spent their twenties developing personal independence and stable partnerships often approach child-rearing with greater patience and deliberate commitment, viewing parenthood as a conscious choice rather than an unexpected interruption.

Nevertheless, this demographic shift is not without serious personal and societal costs. Medically, female fertility declines appreciably after thirty-five and pregnancy complications become more frequent, leaving some couples who wait too long facing costly fertility treatments or involuntary childlessness. Socially, starting a family later compresses caregiving duties: parents in their forties may simultaneously care for primary-age children and frail elderly relatives, while grandparents themselves have less stamina to assist with childcare. At a national scale, delayed first births also tend to result in fewer children overall, accelerating population ageing and straining public pension budgets.

In conclusion, while later parenthood carries undeniable medical risks and wider demographic pressures, the stronger financial security and emotional maturity older parents bring generally create healthier home environments. Supporting young families with affordable housing and childcare, however, would ensure couples delay by genuine preference rather than economic necessity.`,
    notes: [
      {
        quote:
          'Although delaying childbirth introduces genuine biological and demographic complications, I believe that for individual families the benefits generally outweigh the drawbacks, provided adults have realistic information about reproductive health.',
        noteVi:
          'Câu luận điểm cân bằng, có điều kiện đi kèm ("provided adults have...") thể hiện tư duy chín chắn, chuẩn mực Band 8.',
        criterion: 'TR',
      },
      {
        quote: 'equips couples far better to shoulder responsibility for raising children',
        noteVi:
          'Tích hợp collocation mục tiêu ("shoulder responsibility for") rất tự nhiên ngay ở câu chủ đề đoạn thân bài 1.',
        criterion: 'LR',
      },
      {
        quote: 'Financial stability does more than pay for nursery fees; it markedly alleviates the pressure on daily family life, shielding children from the chronic stress',
        noteVi:
          'Câu ghép có dấu chấm phẩy kết hợp mệnh đề phân từ hiện tại ("shielding...") phát triển sâu hệ quả tâm lý cho trẻ em.',
        criterion: 'GRA',
      },
      {
        quote: 'Nevertheless, this demographic shift is not without serious personal and societal costs.',
        noteVi:
          'Câu chuyển đoạn tinh tế với cấu trúc phủ định kép trang trọng ("is not without") dẫn vào ba tầng thách thức (y tế, gia đình, dân số).',
        criterion: 'CC',
      },
      {
        quote: 'starting a family later compresses caregiving duties: parents in their forties may simultaneously care for primary-age children and frail elderly relatives',
        noteVi:
          'Đưa ra góc nhìn thực tế về thế hệ kẹp giữa (sandwich generation) với từ vựng chuẩn xác ("compresses caregiving duties", "frail elderly relatives").',
        criterion: 'TR',
      },
      {
        quote: 'accelerating population ageing and straining public pension budgets',
        noteVi:
          'Mở rộng phân tích từ cấp hộ gia đình lên cấp vĩ mô bằng cặp phân từ song song gọn gàng.',
        criterion: 'GRA',
      },
      {
        quote: 'would ensure couples delay by genuine preference rather than economic necessity',
        noteVi:
          'Câu kết nâng tầm vấn đề khi phân biệt trì hoãn do lựa chọn tự nguyện với trì hoãn vì áp lực kinh tế.',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:responsibility_shoulder_responsibility_for',
      'col:prospect_career_prospects',
      'col:trend_a_growing_trend_towards',
      'col:pressure_alleviate_the_pressure_on',
      'col:benefit_outweigh_the_drawbacks',
    ],
  },

  // =========================================================================
  // w2:039 - technology - positive_negative (diff 4)
  // =========================================================================
  {
    id: 'w2:039',
    essayType: 'positive_negative',
    topic: 'technology',
    difficulty: 4,
    prompt:
      'An increasing number of primary schools are introducing artificial-intelligence tutoring software to give young pupils personalised exercises and instant feedback. Do you think this is a positive or negative development?',
    partsToAddress: [
      'Take a clear evaluative stance on using AI-assisted tutoring in primary classrooms',
      'Assess both the personalised learning gains and the developmental or pedagogical risks for young children',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: "Adaptive software tailors practice difficulty to each pupil's pace inside large mixed-ability classes.",
        develop:
          'Children who struggle with fractions or phonics receive patient, private reinforcement while faster learners advance without waiting idly.',
      },
      {
        side: 'for',
        idea: 'Automated marking frees primary teachers to focus on emotional care and small-group coaching.',
        develop:
          'Delegating routine spelling drills and arithmetic checks to software gives teachers more time to diagnose deeper comprehension blocks face to face.',
      },
      {
        side: 'for',
        idea: 'Affordable school-licensed tools can bridge the digital divide for families who cannot hire private tutors.',
        develop:
          'Public classrooms equipped with adaptive literacy apps narrow achievement gaps between affluent and lower-income pupils.',
      },
      {
        side: 'against',
        idea: 'Over-reliance on screen tutors can weaken face-to-face social skills and classroom discussion.',
        develop:
          'Primary years are crucial for learning turn-taking, empathy, and collaborative play, none of which occur when children stare individually into tablets.',
      },
      {
        side: 'against',
        idea: 'Instant automated hints may undermine productive struggle and independent critical thinking.',
        develop:
          'If software supplies step-by-step prompts the moment a child hesitates, pupils may grow dependent on digital scaffolding rather than building mental stamina.',
      },
      {
        side: 'against',
        idea: 'Collecting behavioural learning data from young children raises serious privacy concerns.',
        develop:
          'Commercial education platforms that track every keystroke and mistake risk profiling minors unless schools enforce strict data safeguards.',
      },
    ],
    text: `Primary schools in many countries are adopting artificial-intelligence tutoring software capable of adjusting arithmetic and reading exercises to each child's level in real time. Provided that such systems support rather than supplant classroom teachers, I view this shift as a predominantly positive development because adaptive practice can raise foundational mastery while freeing educators for richer human mentorship.

The chief advantage of AI-assisted tutoring lies in solving a longstanding constraint of primary education: wide ability gaps within a single classroom. Even the most dedicated teacher responsible for thirty eight-year-olds cannot deliver continuous one-to-one feedback to every desk. Adaptive platforms enhance the learning experience by diagnosing specific errors—such as misread phonics patterns or recurring subtraction mistakes—and generating targeted, stigma-free drills immediately. Crucially, when deployed through public schools, these tools help bridge the digital divide by offering personalised reinforcement once accessible only to families able to afford private tutors. Meanwhile, offloading repetitive exercise marking gives teachers valuable time to lead group storytelling, check emotional wellbeing, and work closely with pupils who need encouragement.

Nevertheless, enthusiastic adoption must be tempered against real developmental risks for young learners. Primary education is not merely the rapid transfer of syllabus facts; it is where children learn to cooperate, debate respectfully, and tolerate initial confusion. An over-reliance on technology—especially screen-based drills that supply instant hints at the first pause—could erode perseverance and fail to foster critical thinking if pupils spend hours working silently alone. Schools must also guard against opaque commercial platforms that harvest sensitive children's learning data without robust oversight.

In conclusion, AI tutoring in primary schools is a constructive innovation so long as it remains a tightly bounded supplement. When paired with strong human teaching, peer collaboration, and strict privacy standards, adaptive software can meaningfully strengthen early educational outcomes.`,
    notes: [
      {
        quote:
          'Provided that such systems support rather than supplant classroom teachers, I view this shift as a predominantly positive development because adaptive practice can raise foundational mastery while freeing educators for richer human mentorship.',
        noteVi:
          'Câu thesis dùng liên từ điều kiện trang trọng "Provided that..." để đặt ranh giới lập trường sắc sảo ngay từ mở bài.',
        criterion: 'GRA',
      },
      {
        quote: 'solving a longstanding constraint of primary education: wide ability gaps within a single classroom',
        noteVi:
          'Chạm đúng thực tiễn sư phạm tiểu học (lớp đông, trình độ lệch nhau), giúp luận điểm cực kỳ thuyết phục.',
        criterion: 'TR',
      },
      {
        quote: 'enhance the learning experience by diagnosing specific errors—such as misread phonics patterns or recurring subtraction mistakes—and generating targeted, stigma-free drills immediately',
        noteVi:
          'Kết hợp collocation mục tiêu với ví dụ cụ thể ở bậc tiểu học ("phonics patterns", "subtraction mistakes") rất tự nhiên.',
        criterion: 'LR',
      },
      {
        quote: 'help bridge the digital divide by offering personalised reinforcement once accessible only to families able to afford private tutors',
        noteVi:
          'Nêu bật khía cạnh công bằng giáo dục (equity) và dùng collocation "bridge the digital divide" hợp ngữ cảnh.',
        criterion: 'TR',
      },
      {
        quote: 'Nevertheless, enthusiastic adoption must be tempered against real developmental risks for young learners.',
        noteVi:
          'Câu chuyển đoạn tinh tế với cụm động từ học thuật "be tempered against" mở sang đoạn phân tích rủi ro.',
        criterion: 'CC',
      },
      {
        quote: 'An over-reliance on technology—especially screen-based drills that supply instant hints at the first pause—could erode perseverance and fail to foster critical thinking',
        noteVi:
          'Lồng ghép tự nhiên hai collocation ("over-reliance on technology", "foster critical thinking") cùng câu phức có mệnh đề chen mạch lạc.',
        criterion: 'GRA',
      },
      {
        quote: 'opaque commercial platforms that harvest sensitive children\'s learning data without robust oversight',
        noteVi:
          'Bổ sung góc nhìn bảo mật dữ liệu trẻ em bằng từ vựng chính xác ("opaque", "harvest", "robust oversight").',
        criterion: 'LR',
      },
    ],
    usefulCollocationIds: [
      'col:enhance_enhance_the_learning_experience',
      'col:technology_over_reliance_on_technology',
      'col:foster_foster_critical_thinking',
      'col:bridge_bridge_the_digital_divide',
      'col:outcome_educational_outcomes',
    ],
  },

  // =========================================================================
  // w2:040 - culture - positive_negative (diff 7)
  // =========================================================================
  {
    id: 'w2:040',
    essayType: 'positive_negative',
    topic: 'culture',
    difficulty: 7,
    prompt:
      'International streaming platforms are increasingly financing and distributing locally made films and television dramas in non-English-speaking countries. Is this a positive or negative development for local culture?',
    partsToAddress: [
      'State a clear overall judgement on international streaming platforms funding local cinema and drama',
      'Evaluate both the creative, financial, and global-visibility gains and the risks of cultural homogenisation or loss of local ownership',
    ],
    ideaBank: [
      {
        side: 'for',
        idea: 'Substantial foreign budgets allow local filmmakers to tackle ambitious historical and social stories.',
        develop:
          'Directors who previously struggled to secure domestic backing can now hire skilled crews, build authentic sets, and preserve heritage narratives at high production quality.',
      },
      {
        side: 'for',
        idea: 'Global distribution introduces regional languages, music, and cinema to international audiences.',
        develop:
          'Subtitled dramas from smaller film industries now attract millions of overseas viewers, strengthening cultural prestige and stimulating film tourism.',
      },
      {
        side: 'for',
        idea: 'Sustained commissioning upgrades technical talent and fosters innovation across domestic studios.',
        develop:
          'Local sound engineers, editors, and screenwriters gain year-round work rather than migrating abroad to foreign film capitals.',
      },
      {
        side: 'against',
        idea: 'Algorithmic commissioning can pressure writers to smooth away local idioms for international palatability.',
        develop:
          'To maximise global clicks, executives may favour familiar thriller formulas over subtle regional storytelling, gradually flattening cultural diversity.',
      },
      {
        side: 'against',
        idea: 'Foreign platforms often retain perpetual intellectual property rights, weakening local independent cinemas.',
        develop:
          'When streaming giants keep full copyright and bypass theatrical releases, domestic studios lose long-term licensing revenue and neighbourhood cinemas struggle to survive.',
      },
      {
        side: 'against',
        idea: 'Inflated studio wages paid by global streamers can price out public broadcasters and indie producers.',
        develop:
          'Smaller national broadcasters may find themselves unable to afford experienced camera crews or lead actors, reducing space for niche community drama.',
      },
    ],
    text: `Global subscription streaming services have become major patrons of cinema and drama outside the English-speaking world, funding local-language productions and releasing them simultaneously across dozens of territories. Although foreign commissioning carries real risks of creative standardisation and lost copyright, I believe this trend is on balance a positive development for local culture because it revitalises domestic storytelling and projects regional voices onto a global stage.

The cultural gains of international backing are substantial and visible. In many smaller economies, domestic broadcasters and state arts funds lack the capital needed for ambitious period pieces, regional documentaries, or complex social dramas. Substantial investment in local studios allows national directors to work in their own languages without sacrificing technical craft, while stable commissioning trains local cinematographers, composers, and editors who might otherwise emigrate. Equally significant is global reach: subtitled series rooted in specific neighbourhoods, cuisines, and historical memories now travel effortlessly across borders, allowing smaller cultures to benefit from globalisation by inspiring genuine curiosity abroad and helping preserve heritage that younger domestic viewers might once have dismissed as old-fashioned.

Still, these creative opportunities come with caveats that policymakers cannot afford to ignore. Because multinational platforms answer to global subscriber metrics, commissioning executives can subtly nudge screenwriters towards universally recognisable genre formulas—such as fast-paced crime thrillers—at the expense of quiet, culturally specific cinema, risking a gradual narrowing of cultural diversity. Furthermore, buyout contracts that transfer permanent intellectual property to foreign corporations, combined with minimal theatrical runs, can weaken independent local cinemas and deprive domestic producers of long-term royalties.

In conclusion, despite legitimate worries over algorithmic conformity and copyright control, international streaming finance has overwhelmingly broadened the vitality and reach of local cinema. If national regulators safeguard fair copyright sharing and theatrical windows, global platforms can foster innovation while keeping local artistic voices distinctly their own.`,
    notes: [
      {
        quote:
          'Although foreign commissioning carries real risks of creative standardisation and lost copyright, I believe this trend is on balance a positive development for local culture because it revitalises domestic storytelling and projects regional voices onto a global stage.',
        noteVi:
          'Câu thesis bám sát cụm từ khóa "for local culture" trong đề, cân bằng giữa rủi ro thương mại hóa và giá trị hồi sinh văn hóa địa phương.',
        criterion: 'TR',
      },
      {
        quote: 'Substantial investment in local studios allows national directors to work in their own languages without sacrificing technical craft',
        noteVi:
          'Tích hợp collocation "Substantial investment in" mở đầu lập luận rõ ràng về nâng cấp năng lực sản xuất phim nội địa.',
        criterion: 'LR',
      },
      {
        quote: 'allowing smaller cultures to benefit from globalisation by inspiring genuine curiosity abroad and helping preserve heritage that younger domestic viewers might once have dismissed as old-fashioned',
        noteVi:
          'Cấu trúc phân từ mở rộng mượt mà, chỉ ra tác động kép cả ở khán giả quốc tế lẫn giới trẻ trong nước—rất sâu sắc.',
        criterion: 'GRA',
      },
      {
        quote: 'Still, these creative opportunities come with caveats that policymakers cannot afford to ignore.',
        noteVi:
          'Chuyển đoạn gọn gàng bằng "Still" kết hợp danh từ học thuật "caveats", giữ giọng văn khách quan và chừng mực.',
        criterion: 'CC',
      },
      {
        quote: 'commissioning executives can subtly nudge screenwriters towards universally recognisable genre formulas—such as fast-paced crime thrillers—at the expense of quiet, culturally specific cinema',
        noteVi:
          'Phân tích sát cơ chế ngành phim trực tuyến ("commissioning executives", "genre formulas") với ví dụ đối chiếu cụ thể.',
        criterion: 'LR',
      },
      {
        quote: 'deprive domestic producers of long-term royalties',
        noteVi:
          'Đề cập cụ thể vấn đề sở hữu trí tuệ và tiền bản quyền ("intellectual property", "royalties") thể hiện kiến thức thực tế Band 8.',
        criterion: 'TR',
      },
      {
        quote: 'If national regulators safeguard fair copyright sharing and theatrical windows, global platforms can foster innovation while keeping local artistic voices distinctly their own.',
        noteVi:
          'Câu điều kiện ở kết bài chốt lại giải pháp giữ bản sắc tự nhiên, đồng thời lồng mượt collocation "foster innovation".',
        criterion: 'GRA',
      },
    ],
    usefulCollocationIds: [
      'col:diversity_cultural_diversity',
      'col:heritage_preserve_heritage',
      'col:investment_substantial_investment_in',
      'col:globalisation_benefit_from_globalisation',
      'col:foster_foster_innovation',
    ],
  },
];

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const ALL_RAW = [...RAW_ITEMS_PART1, ...RAW_ITEMS_PART2];

const BUILT = ALL_RAW.map((raw) => {
  const wc = countWords(raw.text);
  const notes = raw.notes.map((n, idx) => {
    const start = raw.text.indexOf(n.quote);
    if (start === -1) {
      throw new Error(`${raw.id} note[${idx}] quote not found: "${n.quote}"`);
    }
    const end = start + n.quote.length;
    return {
      start,
      end,
      noteVi: n.noteVi,
      criterion: n.criterion,
    };
  });

  if (wc < 275 || wc > 315) {
    console.warn(`WARN ${raw.id}: wordCount=${wc} (target 275-315)`);
  }

  return {
    id: raw.id,
    essayType: raw.essayType,
    topic: raw.topic,
    difficulty: raw.difficulty,
    prompt: raw.prompt,
    partsToAddress: raw.partsToAddress,
    ideaBank: raw.ideaBank,
    band8Model: {
      text: raw.text,
      wordCount: wc,
      notes,
    },
    usefulCollocationIds: raw.usefulCollocationIds,
    provenance: PROVENANCE,
  };
});

const outPath = path.resolve('data-src/writing/batches/t2_02_prob_posneg.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(BUILT, null, 2) + '\n', 'utf8');

console.log(`Generated ${BUILT.length} items to ${outPath}`);
for (const item of BUILT) {
  console.log(
    `  ${item.id} [${item.essayType}/${item.topic}/d${item.difficulty}] wc=${item.band8Model.wordCount} notes=${item.band8Model.notes.length} ideas=${item.ideaBank.length} cols=${item.usefulCollocationIds.length}`
  );
}
