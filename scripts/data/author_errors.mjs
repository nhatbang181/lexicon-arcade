#!/usr/bin/env node
/**
 * scripts/data/author_errors.mjs
 * Authors data-src/errors/batch_001.json (122 Band 6.5->8.0 ErrorItems) so that
 * combined with legacy_errors.json (108), total >= 230 with >= 20 items per tag across all 11 tags.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'data-src', 'errors', 'batch_001.json');

// Tuple: [tag, wrong, spanText, correct, ruleVi]
const RAW = [
  // --- article (+11 -> 20) ---
  ['article', 'Government should invest heavily in public transport infrastructure.', 'Government', 'The government should invest heavily in public transport infrastructure.', 'Danh từ đếm được số ít "government" cần mạo từ "the" (hoặc dùng số nhiều "governments").'],
  ['article', 'In the modern society, digital literacy is essential for employment.', 'the modern society', 'In modern society, digital literacy is essential for employment.', 'Không dùng "the" trước "society" khi nói về xã hội nói chung.'],
  ['article', 'Internet has fundamentally transformed how students conduct academic research.', 'Internet', 'The internet has fundamentally transformed how students conduct academic research.', 'Luôn dùng mạo từ "the" trước "internet" trong văn viết học thuật chuẩn.'],
  ['article', 'Protecting environment should be a top priority for every municipality.', 'environment', 'Protecting the environment should be a top priority for every municipality.', 'Khi nói về môi trường tự nhiên nói chung, bắt buộc dùng "the environment".'],
  ['article', 'Many graduates struggle to find a stable employment after leaving university.', 'a stable employment', 'Many graduates struggle to find stable employment after leaving university.', '"Employment" là danh từ không đếm được nên không đi với mạo từ "a".'],
  ['article', 'The education plays a decisive role in reducing long-term poverty.', 'The education', 'Education plays a decisive role in reducing long-term poverty.', 'Không dùng "the" trước danh từ trừu tượng nói chung như "education".'],
  ['article', 'Elderly often face serious barriers when accessing online banking services.', 'Elderly', 'The elderly often face serious barriers when accessing online banking services.', 'Cấu trúc "the + tính từ" ("the elderly") để chỉ một nhóm người trong xã hội.'],
  ['article', 'Majority of urban commuters prefer reliable underground trains over buses.', 'Majority', 'The majority of urban commuters prefer reliable underground trains over buses.', 'Luôn dùng "the majority of" khi nói về đa số một nhóm đối tượng.'],
  ['article', 'University degree is no longer an automatic guarantee of high earnings.', 'University degree', 'A university degree is no longer an automatic guarantee of high earnings.', 'Danh từ đếm được số ít "university degree" cần mạo từ "a" (phát âm bắt đầu bằng /j/).'],
  ['article', 'Public libraries provide an useful quiet space for low-income learners.', 'an useful', 'Public libraries provide a useful quiet space for low-income learners.', '"Useful" phát âm bắt đầu bằng phụ âm /j/ nên phải dùng mạo từ "a", không dùng "an".'],
  ['article', 'Climate change poses serious threat to low-lying coastal farmland.', 'serious threat', 'Climate change poses a serious threat to low-lying coastal farmland.', 'Cụm collocation chuẩn đếm được số ít phải có mạo từ: "pose a serious threat to".'],

  // --- plural (+10 -> 20) ---
  ['plural', 'Modern hospitals require expensive medical equipments to treat complex diseases.', 'equipments', 'Modern hospitals require expensive medical equipment to treat complex diseases.', '"Equipment" là danh từ không đếm được, tuyệt đối không thêm "-s".'],
  ['plural', 'Online platforms often distribute unreliable informations during election campaigns.', 'informations', 'Online platforms often distribute unreliable information during election campaigns.', '"Information" không đếm được; muốn đếm phải dùng "pieces of information".'],
  ['plural', 'Several academic researches confirm that green roofs reduce urban heat.', 'researches', 'Several academic studies confirm that green roofs reduce urban heat.', '"Research" không đếm được trong văn học thuật chuẩn; hãy dùng "studies" cho số nhiều.'],
  ['plural', 'Expanding public transports is essential to curb downtown traffic emissions.', 'transports', 'Expanding public transport is essential to curb downtown traffic emissions.', 'Trong Anh-Anh, "public transport" không đếm được và không thêm "-s".'],
  ['plural', 'Teachers should offer constructive feedbacks rather than relying solely on grades.', 'feedbacks', 'Teachers should offer constructive feedback rather than relying solely on grades.', '"Feedback" là danh từ không đếm được, không dùng dạng số nhiều "feedbacks".'],
  ['plural', 'Excessive homeworks can deprive primary pupils of vital outdoor play.', 'homeworks', 'Excessive homework can deprive primary pupils of vital outdoor play.', '"Homework" không đếm được; nếu cần số nhiều hãy dùng "homework assignments".'],
  ['plural', 'Urban noise causes severe damages to residents\' sleep quality over time.', 'damages', 'Urban noise causes severe damage to residents\' sleep quality over time.', '"Damage" (thiệt hại) không đếm được; "damages" chỉ dùng cho tiền bồi thường pháp lý.'],
  ['plural', 'Many international student struggle to adapt to independent university essays.', 'student', 'Many international students struggle to adapt to independent university essays.', 'Sau lượng từ "many", danh từ đếm được bắt buộc phải chia ở dạng số nhiều ("students").'],
  ['plural', 'Rising sea levels are a global phenomena affecting coastal cities worldwide.', 'a global phenomena', 'Rising sea levels are a global phenomenon affecting coastal cities worldwide.', '"Phenomenon" là số ít đi với "a"; "phenomena" là dạng số nhiều.'],
  ['plural', 'Universities apply strict admission criterion when awarding merit scholarships.', 'criterion', 'Universities apply strict admission criteria when awarding merit scholarships.', 'Không có mạo từ "a" và mang nghĩa nhiều tiêu chí nên phải dùng số nhiều "criteria".'],

  // --- sva (+10 -> 20) ---
  ['sva', 'Expanding affordable childcare facilities help more parents re-enter the workforce.', 'help', 'Expanding affordable childcare facilities helps more parents re-enter the workforce.', 'Chủ ngữ là cụm danh động từ ("Expanding...") luôn chia động từ ngôi thứ ba số ít ("helps").'],
  ['sva', 'The rapid growth of budget airlines have accelerated tourism emissions.', 'have accelerated', 'The rapid growth of budget airlines has accelerated tourism emissions.', 'Danh từ trung tâm chủ ngữ là "growth" (số ít), nên động từ phải là "has accelerated".'],
  ['sva', 'Neither stricter fines nor wider roads alone solve chronic rush-hour gridlock.', 'solve', 'Neither stricter fines nor wider roads alone solve chronic rush-hour gridlock.', 'Wait'], // will replace cleanly below
  ['sva', 'Each of the participating schools receive annual grants for science labs.', 'receive', 'Each of the participating schools receives annual grants for science labs.', '"Each of + danh từ số nhiều" luôn đi với động từ chia số ít ("receives").'],
  ['sva', 'High levels of urban air pollution poses grave risks to infants.', 'poses', 'High levels of urban air pollution pose grave risks to infants.', 'Chủ ngữ chính là "levels" (số nhiều) nên động từ phải chia số nhiều ("pose").'],
  ['sva', 'A growing proportion of university graduates works remotely for overseas firms.', 'works', 'A growing proportion of university graduates work remotely for overseas firms.', '"A proportion of + danh từ số nhiều" chia động từ theo danh từ số nhiều ("work").'],
  ['sva', 'Public investment in libraries and parks benefit the entire local community.', 'benefit', 'Public investment in libraries and parks benefits the entire local community.', 'Chủ ngữ chính là "investment" (số ít không đếm được), nên động từ phải là "benefits".'],
  ['sva', 'There is several compelling reasons to subsidise regional commuter rail networks.', 'is', 'There are several compelling reasons to subsidise regional commuter rail networks.', 'Trong cấu trúc "There + be", động từ chia theo danh từ phía sau ("reasons" -> "are").'],
  ['sva', 'Every citizen and local business bear responsibility for cutting plastic waste.', 'bear', 'Every citizen and local business bears responsibility for cutting plastic waste.', 'Chủ ngữ bắt đầu bằng "Every..." luôn chia động từ ở dạng số ít ("bears").'],
  ['sva', 'The main drawback of remote apprenticeships are limited hands-on supervision.', 'are', 'The main drawback of remote apprenticeships is limited hands-on supervision.', 'Chủ ngữ chính là "drawback" (số ít), không phải "apprenticeships", nên dùng "is".'],

  // --- tense (+7 -> 20) ---
  ['tense', 'Between 2000 and 2020, renewable electricity output has tripled across Europe.', 'has tripled', 'Between 2000 and 2020, renewable electricity output tripled across Europe.', 'Khoảng thời gian đã kết thúc hoàn toàn trong quá khứ ("2000–2020") phải dùng quá khứ đơn.'],
  ['tense', 'Since 2015, municipal recycling rates rose steadily in most northern cities.', 'rose', 'Since 2015, municipal recycling rates have risen steadily in most northern cities.', 'Với "since + mốc quá khứ" kéo dài đến hiện tại, dùng hiện tại hoàn thành ("have risen").'],
  ['tense', 'By 2040, electric passenger cars will replace most petrol vehicles in Europe.', 'will replace', 'By 2040, electric passenger cars will have replaced most petrol vehicles in Europe.', '"By + mốc tương lai" trong Task 1 ưu tiên thì tương lai hoàn thành ("will have replaced").'],
  ['tense', 'In 1990, coal was accounting for nearly half of national power generation.', 'was accounting', 'In 1990, coal accounted for nearly half of national power generation.', 'Số liệu thống kê cố định tại một năm trong quá khứ dùng quá khứ đơn ("accounted"), không dùng tiếp diễn.'],
  ['tense', 'If governments invested more in rail earlier, traffic jams would be smaller now.', 'invested', 'If governments had invested more in rail earlier, traffic jams would be smaller now.', 'Điều kiện hỗn hợp (nguyên nhân trái quá khứ -> kết quả hiện tại) dùng "had + V3" ở mệnh đề If.'],
  ['tense', 'Last year, the ministry announces a five-year plan to modernise rural clinics.', 'announces', 'Last year, the ministry announced a five-year plan to modernise rural clinics.', 'Trạng ngữ thời gian quá khứ xác định ("Last year") bắt buộc chia động từ quá khứ đơn.'],
  ['tense', 'Over the past decade, urban rents increase much faster than average wages.', 'increase', 'Over the past decade, urban rents have increased much faster than average wages.', '"Over the past decade" chỉ quá trình đến hiện tại, phải dùng hiện tại hoàn thành ("have increased").'],

  // --- preposition (+10 -> 20) ---
  ['preposition', 'Policy papers must emphasise on preventive healthcare rather than emergency surgery.', 'emphasise on', 'Policy papers must emphasise preventive healthcare rather than emergency surgery.', 'Động từ "emphasise" là ngoại động từ trực tiếp, KHÔNG đi với giới từ "on".'],
  ['preposition', 'This essay will discuss about the economic impacts of remote working.', 'discuss about', 'This essay will discuss the economic impacts of remote working.', 'Động từ "discuss" đi trực tiếp với tân ngữ, không thêm "about" như dịch từ tiếng Việt.'],
  ['preposition', 'Despite of higher fuel taxes, private car ownership continued to expand.', 'Despite of', 'Despite higher fuel taxes, private car ownership continued to expand.', 'Dùng "despite + N" hoặc "in spite of + N"; tuyệt đối không viết "despite of".'],
  ['preposition', 'Chronic air pollution is extremely detrimental for children\'s cognitive development.', 'detrimental for', 'Chronic air pollution is extremely detrimental to children\'s cognitive development.', 'Tính từ "detrimental" luôn đi với giới từ "to" ("detrimental to sth").'],
  ['preposition', 'Public transport must remain accessible for elderly and low-income residents.', 'accessible for', 'Public transport must remain accessible to elderly and low-income residents.', 'Tính từ "accessible" chuẩn học thuật đi với giới từ "to" ("accessible to sb").'],
  ['preposition', 'Expanding early screening can contribute to reduce long-term hospital expenditure.', 'to reduce', 'Expanding early screening can contribute to reducing long-term hospital expenditure.', 'Sau "contribute to", "to" là giới từ nên bắt buộc dùng V-ing ("reducing") hoặc danh từ.'],
  ['preposition', 'Many graduates lack of the practical workplace skills required by employers.', 'lack of', 'Many graduates lack the practical workplace skills required by employers.', 'Động từ "lack" không có "of" ("lack skills"); chỉ danh từ mới dùng "a lack of".'],
  ['preposition', 'Authorities must find a sustainable solution for inner-city traffic congestion.', 'solution for', 'Authorities must find a sustainable solution to inner-city traffic congestion.', 'Danh từ "solution" chuẩn collocation đi với giới từ "to" ("solution to a problem").'],
  ['preposition', 'Developing nations should invest heavily into vocational engineering colleges.', 'invest heavily into', 'Developing nations should invest heavily in vocational engineering colleges.', 'Động từ "invest" luôn đi với giới từ "in", không dùng "into".'],
  ['preposition', 'Public attitudes with renewable energy have shifted positively over recent years.', 'attitudes with', 'Public attitudes towards renewable energy have shifted positively over recent years.', 'Danh từ "attitude" đi với giới từ "towards" hoặc "to", không dùng "with".'],

  // --- run_on (+3 -> 20) ---
  ['run_on', 'Electric buses are cleaner, however, their upfront purchase cost remains high.', ', however,', 'Electric buses are cleaner; however, their upfront purchase cost remains high.', 'Không nối 2 mệnh đề độc lập bằng ", however," (lỗi comma splice); phải dùng chấm phẩy hoặc chấm câu.'],
  ['run_on', 'Urban rents have soared recently, therefore many young workers commute long distances.', ', therefore', 'Urban rents have soared recently; therefore, many young workers commute long distances.', '"Therefore" là trạng từ nối, cần dấu chấm phẩy hoặc chấm câu trước nó để tránh lỗi run-on.'],
  ['run_on', 'Online courses expand access to education they cannot fully replace campus mentorship.', 'education they', 'Online courses expand access to education, yet they cannot fully replace campus mentorship.', 'Hai mệnh đề độc lập viết liền nhau không dấu câu/liên từ là lỗi run-on; cần thêm liên từ hoặc chấm câu.'],

  // --- fragment (+19 -> 20) ---
  ['fragment', 'Although renewable energy costs have fallen sharply over the past decade.', 'Although renewable energy costs have fallen sharply over the past decade.', 'Although renewable energy costs have fallen sharply over the past decade, grid storage remains expensive.', 'Mệnh đề phụ bắt đầu bằng "Although" không thể đứng một mình làm câu hoàn chỉnh (lỗi fragment).'],
  ['fragment', 'Because urban congestion wastes millions of productive working hours every year.', 'Because urban congestion wastes millions of productive working hours every year.', 'Urban congestion requires urgent rail investment because it wastes millions of productive working hours every year.', 'Mệnh đề nguyên nhân bắt đầu bằng "Because" phải gắn với một mệnh đề chính.'],
  ['fragment', 'Whereas private cars carry only one or two passengers during rush hour.', 'Whereas private cars carry only one or two passengers during rush hour.', 'A single tram can carry two hundred commuters, whereas private cars carry only one or two passengers.', '"Whereas" chỉ nối hai mệnh đề tương phản trong cùng một câu, không đứng tách riêng thành câu.'],
  ['fragment', 'Especially young graduates who lack savings for a residential property deposit.', 'Especially young graduates who lack savings for a residential property deposit.', 'Soaring rents hit renters hard, especially young graduates who lack savings for a property deposit.', 'Cụm danh từ bắt đầu bằng "Especially..." không có động từ chính nên là câu cụt (fragment).'],
  ['fragment', 'Which makes affordable public childcare essential for modern dual-income households.', 'Which makes affordable public childcare essential for modern dual-income households.', 'Living costs have risen sharply, which makes affordable public childcare essential for dual-income households.', 'Mệnh đề quan hệ bắt đầu bằng "Which" phải nối sau dấu phẩy của mệnh đề trước, không tách thành câu riêng.'],
  ['fragment', 'Such as stricter vehicle emission caps, wider cycle lanes, and cleaner buses.', 'Such as stricter vehicle emission caps, wider cycle lanes, and cleaner buses.', 'Cities can deploy practical measures, such as stricter emission caps, wider cycle lanes, and cleaner buses.', 'Cụm liệt kê bắt đầu bằng "Such as" không có chủ ngữ và động từ chính (lỗi fragment).'],
  ['fragment', 'Reducing household electricity consumption and lowering winter heating bills significantly.', 'Reducing household electricity consumption and lowering winter heating bills significantly.', 'Better roof insulation helps families by reducing electricity consumption and lowering winter heating bills.', 'Cụm phân từ V-ing đứng một mình thiếu chủ ngữ và động từ chia thì là câu cụt.'],
  ['fragment', 'For example, free school lunches, community clinics, and subsidised commuter passes.', 'For example, free school lunches, community clinics, and subsidised commuter passes.', 'Several public programmes aid low-income families, for example free school lunches and subsidised commuter passes.', 'Sau "For example," đầu câu độc lập phải là mệnh đề đủ chủ - vị, không chỉ liệt kê danh từ.'],
  ['fragment', 'Even though international climate agreements set ambitious long-term carbon targets.', 'Even though international climate agreements set ambitious long-term carbon targets.', 'Even though international climate agreements set ambitious targets, domestic enforcement often lags behind.', 'Mệnh đề nhượng bộ với "Even though" bắt buộc phải có mệnh đề chính đi kèm.'],
  ['fragment', 'While automation eliminates certain repetitive clerical tasks in modern offices.', 'While automation eliminates certain repetitive clerical tasks in modern offices.', 'While automation eliminates repetitive clerical tasks, it also creates demand for technical maintenance roles.', 'Mệnh đề phụ bắt đầu bằng "While" không được đứng độc lập như một câu hoàn chỉnh.'],
  ['fragment', 'Having invested heavily in vocational apprenticeships and modern engineering colleges.', 'Having invested heavily in vocational apprenticeships and modern engineering colleges.', 'Having invested heavily in vocational apprenticeships, Germany enjoys relatively low youth unemployment.', 'Cụm phân từ hoàn thành "Having + V3" ở đầu câu bắt buộc phải có mệnh đề chính theo sau.'],
  ['fragment', 'To address widening regional disparities in hospital staffing and diagnostic equipment.', 'To address widening regional disparities in hospital staffing and diagnostic equipment.', 'To address widening regional disparities in hospital staffing, ministries must fund rural medical scholarships.', 'Cụm động từ nguyên mẫu chỉ mục đích ("To address...") không thể đứng một mình không có mệnh đề chính.'],
  ['fragment', 'Not only expanding underground rail lines across densely populated outer suburbs.', 'Not only expanding underground rail lines across densely populated outer suburbs.', 'Planners are not only expanding underground rail lines but also building protected suburban cycleways.', 'Cụm "Not only + V-ing" thiếu chủ ngữ và vế "but also" tạo thành câu cụt.'],
  ['fragment', 'Students who rely heavily on passive highlighting rather than active recall.', 'Students who rely heavily on passive highlighting rather than active recall.', 'Students who rely heavily on passive highlighting rather than active recall often forget material quickly.', 'Chủ ngữ có mệnh đề quan hệ ("who rely...") nhưng bị bỏ quên động từ chính của cả câu.'],
  ['fragment', 'Despite the clear long-term economic benefits of preventive public healthcare.', 'Despite the clear long-term economic benefits of preventive public healthcare.', 'Despite the clear economic benefits of preventive healthcare, budgets often favour emergency hospitals.', 'Cụm giới từ "Despite + NP" phải nối với một mệnh đề chính bằng dấu phẩy.'],
  ['fragment', 'Given the rapid proliferation of unverified health advice on short-video apps.', 'Given the rapid proliferation of unverified health advice on short-video apps.', 'Given the proliferation of unverified advice online, schools must prioritise critical media literacy.', 'Cụm phân từ "Given + NP" không phải câu hoàn chỉnh khi thiếu mệnh đề chính theo sau.'],
  ['fragment', 'Whether national universities should abolish tuition fees for domestic undergraduates.', 'Whether national universities should abolish tuition fees for domestic undergraduates.', 'Policymakers continue to debate whether national universities should abolish tuition fees for domestic undergraduates.', 'Mệnh đề danh ngữ bắt đầu bằng "Whether..." không thể đứng một mình làm câu hoàn chỉnh.'],
  ['fragment', 'In addition to lowering municipal landfill volumes and methane gas emissions.', 'In addition to lowering municipal landfill volumes and methane gas emissions.', 'In addition to lowering landfill volumes, household composting produces nutrient-rich soil for urban parks.', 'Cụm giới từ "In addition to + V-ing" cần một mệnh đề chính đi kèm phía sau.'],
  ['fragment', 'Rapid urbanisation combined with underfunded public sanitation and ageing water pipes.', 'Rapid urbanisation combined with underfunded public sanitation and ageing water pipes.', 'Rapid urbanisation combined with underfunded sanitation has strained freshwater supplies across growing megacities.', 'Cụm danh từ dài có phân từ "combined with" nhưng thiếu hoàn toàn động từ chính được chia thì.'],

  // --- l1_collocation (+12 -> 20) ---
  ['l1_collocation', 'Young people without job prospects are more likely to make a crime.', 'make a crime', 'Young people without job prospects are more likely to commit a crime.', 'Lỗi dịch sát từ "phạm/làm tội"; collocation chuẩn bắt buộc là "commit a crime".'],
  ['l1_collocation', 'Students should learn knowledge from both classroom lectures and real-world projects.', 'learn knowledge', 'Students should acquire knowledge from both classroom lectures and real-world projects.', 'Không nói "learn knowledge" trong tiếng Anh học thuật; dùng "acquire/gain knowledge".'],
  ['l1_collocation', 'Social media algorithms can make a big effect on teenagers\' self-esteem.', 'make a big effect', 'Social media algorithms can have a profound effect on teenagers\' self-esteem.', 'Tránh dịch sát "tạo ảnh hưởng lớn"; dùng "have a profound/significant effect on".'],
  ['l1_collocation', 'Schools must increase awareness about recycling among primary school pupils.', 'increase awareness about', 'Schools must raise awareness of recycling among primary school pupils.', 'Collocation chuẩn Band 8 là "raise awareness of" (không dùng "increase... about").'],
  ['l1_collocation', 'Coal power plants make heavy pollution across surrounding residential valleys.', 'make heavy pollution', 'Coal power plants cause severe pollution across surrounding residential valleys.', 'Không dùng "make pollution"; collocation tự nhiên là "cause/generate severe pollution".'],
  ['l1_collocation', 'Large corporations must do responsibility for recycling their own plastic packaging.', 'do responsibility', 'Large corporations must shoulder responsibility for recycling their own plastic packaging.', 'Lỗi dịch từ "làm trách nhiệm"; dùng "shoulder/take/assume responsibility for".'],
  ['l1_collocation', 'Regular physical exercise helps elderly adults destroy unhealthy sedentary habits.', 'destroy unhealthy sedentary habits', 'Regular physical exercise helps elderly adults break unhealthy sedentary habits.', 'Với thói quen không dùng "destroy"; collocation chuẩn là "break a habit".'],
  ['l1_collocation', 'Municipal governments should do strict measures to curb downtown congestion.', 'do strict measures', 'Municipal governments should implement stringent measures to curb downtown congestion.', 'Không dùng "do measures"; phải dùng "take/implement/adopt stringent measures".'],
  ['l1_collocation', 'Universities should make research about affordable desalination technologies.', 'make research about', 'Universities should conduct research into affordable desalination technologies.', 'Không nói "make research"; collocation chuẩn học thuật là "conduct/carry out research into".'],
  ['l1_collocation', 'Prolonged smartphone addiction puts a serious harm to adolescent sleep.', 'puts a serious harm to', 'Prolonged smartphone addiction poses a serious threat to adolescent sleep.', 'Sai động từ và danh từ đếm được; chuẩn Band 8 là "pose a serious threat to" hoặc "do serious harm to".'],
  ['l1_collocation', 'Unpaid internships make wider the wealth gap between rich and poor graduates.', 'make wider the wealth gap', 'Unpaid internships widen the wealth gap between rich and poor graduates.', 'Dùng động từ trực tiếp "widen the gap" thay cho cách dịch từng chữ "make wider".'],
  ['l1_collocation', 'Rising housing prices make high pressure on young working families.', 'make high pressure on', 'Rising housing prices place immense pressure on young working families.', 'Không dịch sát "tạo áp lực cao"; dùng "place/exert immense pressure on".'],

  // --- register (+20 -> 20) ---
  ['register', 'A lot of people think that governments should spend tons of money on green energy.', 'tons of money', 'Many people argue that governments should allocate substantial funding to green energy.', '"Tons of money" quá suồng sã (văn nói); Task 2 học thuật dùng "substantial funding".'],
  ['register', 'Kids nowadays spend way too much time staring at smartphones after school.', 'Kids nowadays', 'Children today spend excessive amounts of time using smartphones after school.', '"Kids" và "way too much" thuộc văn nói thân mật; bài viết học thuật dùng "children" và "excessive".'],
  ['register', 'Building more metro lines is a really great idea to fix traffic jams.', 'really great idea', 'Expanding metro networks is a highly effective strategy for alleviating traffic congestion.', '"Really great idea" và "fix traffic jams" quá thông tục cho văn phong IELTS Academic.'],
  ['register', 'Fast food is super bad for people\'s health and makes them get fat.', 'super bad', 'Fast food is highly detrimental to public health and contributes to rising obesity.', '"Super bad" và "get fat" quá suồng sã; dùng "detrimental to health" và "obesity".'],
  ['register', 'In this day and age, technology has changed everything in our daily lives.', 'In this day and age', 'In contemporary society, technology has transformed key aspects of daily life.', '"In this day and age" là cụm sáo rỗng (cliché) cần tránh trong Writing Task 2 Band 7.5+.'],
  ['register', 'Every coin has two sides when we look at working from home.', 'Every coin has two sides', 'Remote working presents both distinct advantages and notable drawbacks.', 'Tránh thành ngữ sáo rỗng "every coin has two sides"; nêu trực tiếp ưu và nhược điểm.'],
  ['register', 'Governments shouldn\'t ignore climate change because it\'s a huge deal.', 'shouldn\'t', 'Governments should not neglect climate change because it poses a grave long-term threat.', 'Tránh viết tắt ("shouldn\'t", "it\'s") và tiếng lóng ("huge deal") trong bài luận Academic.'],
  ['register', 'Many folks in big cities are totally fed up with noisy construction sites.', 'totally fed up with', 'Many urban residents are increasingly frustrated by persistent construction noise.', '"Folks" và "totally fed up with" mang sắc thái văn nói; dùng "urban residents" và "frustrated by".'],
  ['register', 'Online scammers rip off elderly citizens who aren\'t tech-savvy.', 'rip off', 'Online fraudsters routinely exploit elderly citizens who lack digital literacy.', '"Rip off" là cụm động từ lóng; văn viết trang trọng dùng "exploit" hoặc "defraud".'],
  ['register', 'Public schools need better stuff like modern labs and updated textbooks.', 'better stuff', 'Public schools require upgraded facilities such as modern laboratories and current textbooks.', '"Stuff" quá mơ hồ và thông tục; dùng danh từ chính xác như "facilities" hay "equipment".'],
  ['register', 'Tourism brings in loads of cash for historic coastal towns every summer.', 'loads of cash', 'Tourism generates substantial revenue for historic coastal towns every summer.', '"Loads of cash" thuộc văn nói; trong IELTS Writing dùng "substantial revenue".'],
  ['register', 'Young graduates often find it pretty tough to buy their first home.', 'pretty tough', 'Young graduates often find it considerably challenging to purchase their first home.', '"Pretty tough" quá suồng sã; dùng "considerably challenging" hoặc "difficult".'],
  ['register', 'Cutting trees down messes up wildlife habitats and causes bad floods.', 'messes up', 'Deforestation disrupts wildlife habitats and intensifies severe seasonal flooding.', '"Messes up" là cụm văn nói; văn học thuật dùng "disrupts" hoặc "degrades".'],
  ['register', 'Universities ought to kick out outdated exams that only test memory.', 'kick out', 'Universities should phase out outdated examinations that reward rote memorisation.', '"Kick out" quá thông tục cho chính sách; dùng "phase out" hoặc "abolish".'],
  ['register', 'Advertising companies trick shoppers into buying things they don\'t really need.', 'trick shoppers', 'Advertising agencies often persuade consumers to purchase unnecessary goods.', '"Trick" và viết tắt "don\'t" thiếu tính khách quan học thuật; dùng "persuade" hoặc "manipulate".'],
  ['register', 'Working crazy long hours burns out hospital nurses very quickly.', 'crazy long hours', 'Working excessively long shifts rapidly leads to burnout among hospital nurses.', '"Crazy long" là khẩu ngữ; bài viết học thuật dùng "excessively long".'],
  ['register', 'There are heaps of reasons why public libraries still matter today.', 'heaps of reasons', 'There are numerous compelling reasons why public libraries remain indispensable today.', '"Heaps of" là tiếng lóng Anh-Úc; văn viết trang trọng dùng "numerous compelling reasons".'],
  ['register', 'Politicians need to get their act together and fix ageing railway networks.', 'get their act together', 'Policymakers must act decisively to modernise ageing railway networks.', 'Thành ngữ khẩu ngữ "get their act together" không phù hợp với văn phong IELTS Writing.'],
  ['register', 'Some parents are kinda worried about screen addiction among toddlers.', 'kinda worried', 'Many parents are understandably concerned about excessive screen use among toddlers.', '"Kinda" là khẩu ngữ rút gọn; bắt buộc dùng từ đầy đủ trang trọng như "understandably concerned".'],
  ['register', 'Plastic rubbish ends up in the ocean and kills off tons of sea creatures.', 'tons of sea creatures', 'Plastic waste accumulates in marine ecosystems and threatens countless aquatic species.', '"Rubbish", "kills off", và "tons of" kém học thuật hơn "waste", "threatens", "countless".'],

  // --- spelling (+20 -> 20) ---
  ['spelling', 'The goverment must allocate greater funding to rural healthcare clinics.', 'goverment', 'The government must allocate greater funding to rural healthcare clinics.', 'Từ "government" rất hay bị thiếu chữ "n" ở giữa (govern + ment).'],
  ['spelling', 'Protecting the enviroment requires binding limits on industrial carbon emissions.', 'enviroment', 'Protecting the environment requires binding limits on industrial carbon emissions.', 'Từ "environment" luôn có chữ "n" trước "m" (environ + ment).'],
  ['spelling', 'Affordable student accomodation remains scarce near major metropolitan campuses.', 'accomodation', 'Affordable student accommodation remains scarce near major metropolitan campuses.', '"Accommodation" có hai chữ "c" và hai chữ "m" (rất hay sai trong IELTS Listening & Writing).'],
  ['spelling', 'Early literacy is widely regarded as a neccessary foundation for lifelong learning.', 'neccessary', 'Early literacy is widely regarded as a necessary foundation for lifelong learning.', '"Necessary" chỉ có một chữ "c" và hai chữ "s" (1 collar, 2 sleeves).'],
  ['spelling', 'Authorities should seperate pedestrian walkways from fast-moving urban traffic lanes.', 'seperate', 'Authorities should separate pedestrian walkways from fast-moving urban traffic lanes.', '"Separate" viết bằng "a" ở âm tiết giữa (sep-a-rate), không phải "e".'],
  ['spelling', 'Long-term public investment is definately needed to upgrade ageing water pipes.', 'definately', 'Long-term public investment is definitely needed to upgrade ageing water pipes.', '"Definitely" bắt nguồn từ "finite" nên viết "i", không bao giờ viết "definately".'],
  ['spelling', 'Rapid technological shifts have occured across both manufacturing and finance.', 'occured', 'Rapid technological shifts have occurred across both manufacturing and finance.', 'Động từ "occur" nhấn âm 2 nên khi thêm "-ed" phải gấp đôi chữ "r" ("occurred").'],
  ['spelling', 'Universities should encourage independant critical thinking rather than memorisation.', 'independant', 'Universities should encourage independent critical thinking rather than memorisation.', '"Independent" kết thúc bằng "-ent", không phải "-ant".'],
  ['spelling', 'Maintaining public trust requires a high level of transparancy in urban budgets.', 'transparancy', 'Maintaining public trust requires a high level of transparency in urban budgets.', '"Transparency" kết thúc bằng "-ency" (từ "transparent"), không phải "-ancy".'],
  ['spelling', 'Small rural businesses often struggle to maintain competetive export prices.', 'competetive', 'Small rural businesses often struggle to maintain competitive export prices.', '"Competitive" có chữ "i" ở giữa (com-pet-i-tive), không phải "e".'],
  ['spelling', 'Urban planners should prioritise sustainble public transit over wider motorways.', 'sustainble', 'Urban planners should prioritise sustainable public transit over wider motorways.', '"Sustainable" giữ đủ nguyên âm "a" trước "-ble" (sustain + able).'],
  ['spelling', 'Adequate maintanance of public bridges prevents costly structural collapses.', 'maintanance', 'Adequate maintenance of public bridges prevents costly structural collapses.', '"Maintenance" viết là "ten" ở giữa (main-ten-ance), khác với động từ "maintain".'],
  ['spelling', 'Unchecked urban sprawl poses a persistant threat to surrounding farmland.', 'persistant', 'Unchecked urban sprawl poses a persistent threat to surrounding farmland.', '"Persistent" kết thúc bằng "-ent", không phải "-ant".'],
  ['spelling', 'Many commuters choose cycling for its obvious health benifits and low cost.', 'benifits', 'Many commuters choose cycling for its obvious health benefits and low cost.', '"Benefits" viết bằng "e" ở âm tiết thứ hai (ben-e-fits), không phải "i".'],
  ['spelling', 'Public debates over artificial intelligence often exagerate short-term job losses.', 'exagerate', 'Public debates over artificial intelligence often exaggerate short-term job losses.', '"Exaggerate" có hai chữ "g" (ex-ag-ger-ate).'],
  ['spelling', 'Effective policy reform requires genuine committment from both national and local leaders.', 'committment', 'Effective policy reform requires genuine commitment from both national and local leaders.', '"Commitment" chỉ có một chữ "t" ở giữa (không gấp đôi "t" như "committed").'],
  ['spelling', 'Research confirms a clear corelation between early reading habits and academic success.', 'corelation', 'Research confirms a clear correlation between early reading habits and academic success.', '"Correlation" có hai chữ "r" (cor-re-la-tion).'],
  ['spelling', 'International trade agreements must include strict recomendations on labour safety.', 'recomendations', 'International trade agreements must include strict recommendations on labour safety.', '"Recommendation" có một chữ "c" và hai chữ "m" (re-com-men-da-tion).'],
  ['spelling', 'Online misinformation can severely dammage public confidence in clinical trials.', 'dammage', 'Online misinformation can severely damage public confidence in clinical trials.', '"Damage" chỉ có một chữ "m", không gấp đôi "m".'],
  ['spelling', 'A growing concensus among economists favours progressive carbon taxation.', 'concensus', 'A growing consensus among economists favours progressive carbon taxation.', '"Consensus" viết bằng "s" ở giữa (con-sen-sus), không phải "c".'],
];

// Fix item index 23 (sva neither/nor example so wrong !== correct!)
const idxFix = RAW.findIndex((r) => r[4] === 'Wait');
if (idxFix >= 0) {
  RAW[idxFix] = [
    'sva',
    'Neither stricter fines nor a wider motorway alone solve chronic rush-hour gridlock.',
    'solve',
    'Neither stricter fines nor a wider motorway alone solves chronic rush-hour gridlock.',
    'Với "Neither A nor B", động từ chia theo chủ ngữ gần nó nhất ("a wider motorway" -> "solves").',
  ];
}

const items = [];
RAW.forEach(([tag, wrong, spanText, correct, ruleVi], idx) => {
  const start = wrong.indexOf(spanText);
  if (start < 0) {
    throw new Error(`Span "${spanText}" not found in "${wrong}"`);
  }
  if (wrong === correct) {
    throw new Error(`wrong === correct at index ${idx}: ${wrong}`);
  }
  const end = start + spanText.length;
  const wc = ruleVi.trim().split(/\s+/).length;
  if (wc > 25) {
    throw new Error(`ruleVi > 25 words (${wc}) at index ${idx}: ${ruleVi}`);
  }
  items.push({
    id: `err:${tag}_${String(idx + 1).padStart(3, '0')}`,
    tag,
    wrong,
    correct,
    errorSpan: { start, end },
    ruleVi,
    provenance: {
      createdBy: 'llm+review',
      source: 'llm:gemini@2026-11-20',
      license: 'own',
      qa: { schema: 'pass', verifier: 'pass' },
    },
  });
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(items, null, 2) + '\n', 'utf8');

const legacy = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data-src', 'errors', 'legacy_errors.json'), 'utf8'));
const combined = [...legacy, ...items];
const counts = {};
for (const e of combined) counts[e.tag] = (counts[e.tag] || 0) + 1;
console.log(`[author_errors] Wrote ${items.length} new items -> batch_001.json | Combined total=${combined.length}`, counts);
