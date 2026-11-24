import { State } from 'ts-fsrs';
import type {
  CollocationItem,
  DictationItem,
  ErrorItem,
  ParaphraseItem,
  Provenance,
  VocabItem,
} from '../../core/content/schemas';
import { createNewCard, type SRSCard } from '../../core/srs/fsrsAdapter';
import type { Face } from '../../core/srs/faces';
import type { V1ContentBundle } from '../../games/v1-daily-run/content';

const FIXTURE_PROVENANCE: Provenance = {
  createdBy: 'human',
  source: 'lexicon_v3_v1_fixtures',
  license: 'CC0-1.0',
  qa: {
    schema: 'pass',
    verifier: 'pass',
    blindSolve: 'na',
  },
};

export const V1_FIXTURE_VOCAB: VocabItem[] = [
  {
    id: 'vocab:curriculum',
    headword: 'curriculum',
    pos: ['n'],
    ipa: { uk: '/kəˈrɪkjələm/', us: '/kəˈrɪkjələm/' },
    syllables: 'cur·ric·u·lum',
    meaningVi: 'chương trình giảng dạy',
    definitionEn: 'the subjects that are studied in a school, college, or university course',
    examples: [
      {
        en: 'Coding and critical thinking have been integrated into the national curriculum.',
        vi: 'Lập trình và tư duy phản biện đã được tích hợp vào chương trình giảng dạy quốc gia.',
        ieltsContext: 'W2',
        clozeAccepted: ['curriculum', 'curricula', 'curriculums'],
      },
      {
        en: 'Many educators argue that the school curriculum places excessive emphasis on rote testing.',
        vi: 'Nhiều nhà giáo dục cho rằng chương trình học ở trường đặt quá nhiều trọng tâm vào thi cử học vẹt.',
        ieltsContext: 'S',
        clozeAccepted: ['curriculum', 'curricula'],
      },
    ],
    family: [
      { form: 'curricula', pos: 'n' },
      { form: 'curricular', pos: 'adj' },
      { form: 'extracurricular', pos: 'adj' },
    ],
    synonyms: [
      { word: 'syllabus', noteVi: 'Đề cương chi tiết của một môn học cụ thể' },
      { word: 'coursework', noteVi: 'Khối lượng bài tập/học phần trong khóa học' },
    ],
    collocationIds: ['col:curriculum_reform', 'col:overhaul_curriculum'],
    register: 'formal',
    topics: ['education'],
    lists: ['AWL1', 'ANKI'],
    freqZipf: 4.6,
    cefr: 'C1',
    vnTrap: 'Chú ý gấp đôi chữ "r" (cur-ric-u-lum), không dùng "study program" trong văn phong IELTS Task 2.',
    audio: { uk: 'audio/vocab/uk/curriculum.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:mitigate',
    headword: 'mitigate',
    pos: ['v'],
    ipa: { uk: '/ˈmɪtɪɡeɪt/', us: '/ˈmɪtɪɡeɪt/' },
    syllables: 'mit·i·gate',
    meaningVi: 'giảm nhẹ, làm dịu bớt tác hại',
    definitionEn: 'to make something less harmful, serious, or painful',
    examples: [
      {
        en: 'Reforestation schemes can help mitigate the devastating effects of climate change.',
        vi: 'Các chương trình trồng rừng có thể giúp giảm nhẹ tác động tàn phá của biến đổi khí hậu.',
        ieltsContext: 'W2',
        clozeAccepted: ['mitigate', 'mitigates', 'mitigated', 'mitigating'],
      },
      {
        en: 'Governments introduced emergency subsidies to mitigate financial hardship among low-income households.',
        vi: 'Chính phủ đã đưa ra trợ cấp khẩn cấp để giảm nhẹ khó khăn tài chính cho các hộ thu nhập thấp.',
        ieltsContext: 'R',
        clozeAccepted: ['mitigate', 'mitigated', 'mitigating'],
      },
    ],
    family: [
      { form: 'mitigation', pos: 'n' },
      { form: 'mitigated', pos: 'v' },
      { form: 'mitigating', pos: 'v' },
      { form: 'mitigates', pos: 'v' },
    ],
    synonyms: [
      { word: 'alleviate', noteVi: 'Làm dịu nỗi đau hoặc gánh nặng xã hội' },
      { word: 'attenuate', noteVi: 'Làm suy yếu cường độ (văn phong khoa học)' },
    ],
    collocationIds: ['col:mitigate_impact', 'col:mitigate_risk'],
    register: 'formal',
    topics: ['environment', 'government'],
    lists: ['AWL3'],
    freqZipf: 4.1,
    cefr: 'C1',
    vnTrap: 'Mitigate đi trực tiếp với tân ngữ (mitigate risks), KHÔNG dùng "mitigate for" hay "mitigate on".',
    audio: { uk: 'audio/vocab/uk/mitigate.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:proliferate',
    headword: 'proliferate',
    pos: ['v'],
    ipa: { uk: '/prəˈlɪfəreɪt/', us: '/prəˈlɪfəreɪt/' },
    syllables: 'pro·lif·er·ate',
    meaningVi: 'sinh sôi, gia tăng nhanh chóng',
    definitionEn: 'to increase rapidly in numbers or spread quickly',
    examples: [
      {
        en: 'Short-form video platforms have proliferated across global markets over the past decade.',
        vi: 'Các nền tảng video ngắn đã gia tăng nhanh chóng trên khắp các thị trường toàn cầu trong thập kỷ qua.',
        ieltsContext: 'W2',
        clozeAccepted: ['proliferate', 'proliferated', 'proliferates', 'proliferating'],
      },
      {
        en: 'Digital misinformation tends to proliferate during periods of political uncertainty.',
        vi: 'Thông tin sai lệch trên mạng có xu hướng lan nhanh trong những giai đoạn bất ổn chính trị.',
        ieltsContext: 'R',
        clozeAccepted: ['proliferate', 'proliferated', 'proliferates'],
      },
    ],
    family: [
      { form: 'proliferation', pos: 'n' },
      { form: 'proliferated', pos: 'v' },
      { form: 'proliferating', pos: 'v' },
    ],
    synonyms: [
      { word: 'mushroom', noteVi: 'Mọc lên như nấm (dùng cho doanh nghiệp/đô thị)' },
      { word: 'burgeon', noteVi: 'Phát triển bùng nổ' },
    ],
    collocationIds: ['col:curriculum_reform'],
    register: 'formal',
    topics: ['technology', 'media'],
    lists: ['NAWL'],
    freqZipf: 3.6,
    cefr: 'C2',
    vnTrap: 'Proliferate là nội động từ (intransitive), không chia bị động "be proliferated".',
    audio: { uk: 'audio/vocab/uk/proliferate.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:ubiquitous',
    headword: 'ubiquitous',
    pos: ['adj'],
    ipa: { uk: '/juːˈbɪkwɪtəs/', us: '/juːˈbɪkwɪtəs/' },
    syllables: 'u·biq·ui·tous',
    meaningVi: 'phổ biến khắp nơi, có mặt ở mọi nơi',
    definitionEn: 'seeming to be everywhere or in several places at the same time',
    examples: [
      {
        en: 'Smartphones have become ubiquitous in modern academic and professional life.',
        vi: 'Điện thoại thông minh đã trở nên phổ biến khắp nơi trong đời sống học thuật và công việc hiện đại.',
        ieltsContext: 'W2',
        clozeAccepted: ['ubiquitous', 'ubiquity'],
      },
      {
        en: 'Single-use plastics remain ubiquitous despite widespread environmental campaigns.',
        vi: 'Nhựa dùng một lần vẫn hiện diện khắp nơi bất chấp các chiến dịch môi trường rộng khắp.',
        ieltsContext: 'S',
        clozeAccepted: ['ubiquitous'],
      },
    ],
    family: [
      { form: 'ubiquity', pos: 'n' },
      { form: 'ubiquitously', pos: 'adv' },
    ],
    synonyms: [
      { word: 'omnipresent', noteVi: 'Hiện diện khắp mọi nơi' },
      { word: 'pervasive', noteVi: 'Lan tỏa sâu rộng (thường mang sắc thái tiêu cực)' },
    ],
    collocationIds: ['col:mitigate_impact'],
    register: 'formal',
    topics: ['technology', 'culture'],
    lists: ['NAWL'],
    freqZipf: 3.9,
    cefr: 'C1',
    vnTrap: 'Phát âm bắt đầu bằng /juː/ (như "you"), nên đi với mạo từ "a ubiquitous device" chứ không phải "an".',
    audio: { uk: 'audio/vocab/uk/ubiquitous.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:disparity',
    headword: 'disparity',
    pos: ['n'],
    ipa: { uk: '/dɪˈspærəti/', us: '/dɪˈspærəti/' },
    syllables: 'dis·par·i·ty',
    meaningVi: 'sự chênh lệch, bất bình đẳng lớn',
    definitionEn: 'a noticeable and often unfair difference between people or things',
    examples: [
      {
        en: 'Targeted investment is needed to bridge the growing disparity between urban and rural schools.',
        vi: 'Cần đầu tư có mục tiêu để thu hẹp sự chênh lệch ngày càng tăng giữa trường học thành thị và nông thôn.',
        ieltsContext: 'W2',
        clozeAccepted: ['disparity', 'disparities'],
      },
      {
        en: 'The report highlighted stark wage disparities across different socioeconomic groups.',
        vi: 'Báo cáo nhấn mạnh sự chênh lệch tiền lương rõ rệt giữa các nhóm kinh tế xã hội khác nhau.',
        ieltsContext: 'W1',
        clozeAccepted: ['disparities', 'disparity'],
      },
    ],
    family: [
      { form: 'disparities', pos: 'n' },
      { form: 'disparate', pos: 'adj' },
    ],
    synonyms: [
      { word: 'discrepancy', noteVi: 'Sự sai khác giữa hai con số hoặc báo cáo' },
      { word: 'inequality', noteVi: 'Sự bất bình đẳng nói chung' },
    ],
    collocationIds: ['col:bridge_disparity'],
    register: 'formal',
    topics: ['economy', 'government'],
    lists: ['AWL8'],
    freqZipf: 4.0,
    cefr: 'C1',
    vnTrap: 'Dùng giới từ "disparity between A and B" hoặc "disparity in income".',
    audio: { uk: 'audio/vocab/uk/disparity.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:exacerbate',
    headword: 'exacerbate',
    pos: ['v'],
    ipa: { uk: '/ɪɡˈzæsəbeɪt/', us: '/ɪɡˈzæsərbeɪt/' },
    syllables: 'ex·ac·er·bate',
    meaningVi: 'làm trầm trọng thêm (vấn đề, tình huống xấu)',
    definitionEn: 'to make a bad situation, problem, or illness worse',
    examples: [
      {
        en: 'Rapid urbanisation has exacerbated housing shortages in major metropolitan areas.',
        vi: 'Đô thị hóa nhanh chóng đã làm trầm trọng thêm tình trạng thiếu nhà ở tại các đô thị lớn.',
        ieltsContext: 'W2',
        clozeAccepted: ['exacerbate', 'exacerbated', 'exacerbates', 'exacerbating'],
      },
      {
        en: 'Unregulated industrial logging continues to exacerbate soil erosion along river basins.',
        vi: 'Việc khai thác gỗ công nghiệp không kiểm soát tiếp tục làm trầm trọng thêm xói mòn đất dọc lưu vực sông.',
        ieltsContext: 'R',
        clozeAccepted: ['exacerbate', 'exacerbated', 'exacerbates'],
      },
    ],
    family: [
      { form: 'exacerbation', pos: 'n' },
      { form: 'exacerbated', pos: 'v' },
      { form: 'exacerbating', pos: 'v' },
    ],
    synonyms: [
      { word: 'aggravate', noteVi: 'Làm nặng thêm vấn đề/căn bệnh' },
      { word: 'compound', noteVi: 'Cộng hưởng làm tình hình tồi tệ hơn' },
    ],
    collocationIds: ['col:mitigate_impact', 'col:bridge_disparity'],
    register: 'formal',
    topics: ['environment', 'urban'],
    lists: ['NAWL'],
    freqZipf: 3.8,
    cefr: 'C2',
    vnTrap: 'Chỉ dùng exacerbate cho vấn đề tiêu cực (exacerbate poverty/congestion), không dùng cho điều tích cực.',
    audio: { uk: 'audio/vocab/uk/exacerbate.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:organise',
    headword: 'organise',
    pos: ['v'],
    ipa: { uk: '/ˈɔːɡənaɪz/', us: '/ˈɔːrɡənaɪz/' },
    syllables: 'or·gan·ise',
    meaningVi: 'tổ chức, sắp xếp có hệ thống',
    definitionEn: 'to make arrangements for something to happen or structure elements systematically',
    examples: [
      {
        en: 'Local authorities should organise community workshops to promote recycling habits.',
        vi: 'Chính quyền địa phương nên tổ chức các buổi hội thảo cộng đồng để thúc đẩy thói quen tái chế.',
        ieltsContext: 'W2',
        clozeAccepted: ['organise', 'organize', 'organised', 'organized', 'organising', 'organizing'],
      },
      {
        en: 'Students who organise their study schedules effectively tend to experience lower exam anxiety.',
        vi: 'Những học sinh sắp xếp lịch học hiệu quả thường ít bị lo âu thi cử hơn.',
        ieltsContext: 'S',
        clozeAccepted: ['organise', 'organize', 'organised', 'organized'],
      },
    ],
    family: [
      { form: 'organisation', pos: 'n' },
      { form: 'organization', pos: 'n' },
      { form: 'organised', pos: 'adj' },
      { form: 'organized', pos: 'adj' },
    ],
    synonyms: [
      { word: 'coordinate', noteVi: 'Điều phối nhiều bộ phận cùng hoạt động' },
      { word: 'structure', noteVi: 'Cấu trúc hóa' },
    ],
    collocationIds: ['col:curriculum_reform'],
    register: 'neutral',
    topics: ['education', 'work'],
    lists: ['NGSL'],
    freqZipf: 4.9,
    cefr: 'B2',
    vnTrap: 'Cả biến thể Anh-Anh (organise) và Anh-Mỹ (organize) đều được chấp nhận, nhưng nên thống nhất 1 kiểu trong bài viết.',
    audio: { uk: 'audio/vocab/uk/organise.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:rote_learning',
    headword: 'rote learning',
    pos: ['n'],
    ipa: { uk: '/rəʊt ˈlɜːnɪŋ/', us: '/roʊt ˈlɜːrnɪŋ/' },
    syllables: 'rote learn·ing',
    meaningVi: 'học vẹt, học thuộc lòng máy móc',
    definitionEn: 'a memorisation technique based on repetition without deep comprehension',
    examples: [
      {
        en: 'Modern pedagogy shifts away from rote learning towards collaborative problem-solving.',
        vi: 'Phương pháp sư phạm hiện đại chuyển dịch khỏi lối học vẹt sang giải quyết vấn đề theo nhóm.',
        ieltsContext: 'W2',
        clozeAccepted: ['rote learning', 'rote-learning'],
      },
      {
        en: 'Over-reliance on rote learning stifles creativity among secondary school pupils.',
        vi: 'Sự phụ thuộc quá mức vào học vẹt kìm hãm sự sáng tạo ở học sinh trung học.',
        ieltsContext: 'S',
        clozeAccepted: ['rote learning', 'rote-learning'],
      },
    ],
    family: [{ form: 'rote-learning', pos: 'n' }],
    synonyms: [
      { word: 'mechanical memorisation', noteVi: 'Ghi nhớ máy móc' },
      { word: 'cramming', noteVi: 'Học nhồi nhét trước kỳ thi' },
    ],
    collocationIds: ['col:curriculum_reform', 'col:overhaul_curriculum'],
    register: 'formal',
    topics: ['education'],
    lists: ['TOPIC'],
    freqZipf: 3.5,
    cefr: 'C1',
    vnTrap: 'Viết là "rote learning" (r-o-t-e), đừng nhầm với "root learning".',
    audio: { uk: 'audio/vocab/uk/rote_learning.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:accommodate',
    headword: 'accommodate',
    pos: ['v'],
    ipa: { uk: '/əˈkɒmədeɪt/', us: '/əˈkɑːmədeɪt/' },
    syllables: 'ac·com·mo·date',
    meaningVi: 'đáp ứng, chứa được, cung cấp chỗ ở',
    definitionEn: 'to provide enough space for somebody or adapt to meet diverse requirements',
    examples: [
      {
        en: 'Public transport infrastructure must expand to accommodate the influx of daily commuters.',
        vi: 'Cơ sở hạ tầng giao thông công cộng phải mở rộng để đáp ứng lượng người đi làm hằng ngày đổ về.',
        ieltsContext: 'W2',
        clozeAccepted: ['accommodate', 'accommodates', 'accommodated', 'accommodating'],
      },
      {
        en: 'The newly renovated lecture hall can accommodate up to four hundred undergraduates.',
        vi: 'Giảng đường mới được cải tạo có thể chứa tới bốn trăm sinh viên đại học.',
        ieltsContext: 'L',
        clozeAccepted: ['accommodate', 'accommodates', 'accommodated'],
      },
    ],
    family: [
      { form: 'accommodation', pos: 'n' },
      { form: 'accommodated', pos: 'v' },
      { form: 'accommodating', pos: 'adj' },
    ],
    synonyms: [
      { word: 'cater for', noteVi: 'Đáp ứng nhu cầu của một nhóm đối tượng' },
      { word: 'house', noteVi: 'Cung cấp chỗ ở/chứa' },
    ],
    collocationIds: ['col:allocate_funding'],
    register: 'formal',
    topics: ['urban', 'transport'],
    lists: ['AWL9'],
    freqZipf: 4.3,
    cefr: 'C1',
    vnTrap: 'Bẫy chính tả kinh điển trong IELTS Listening: phải có 2 chữ "c" VÀ 2 chữ "m" (ac-com-mo-date).',
    audio: { uk: 'audio/vocab/uk/accommodate.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:environment',
    headword: 'environment',
    pos: ['n'],
    ipa: { uk: '/ɪnˈvaɪrənmənt/', us: '/ɪnˈvaɪrənmənt/' },
    syllables: 'en·vi·ron·ment',
    meaningVi: 'môi trường tự nhiên hoặc môi trường làm việc/học tập',
    definitionEn: 'the natural world or the conditions in which a person, animal, or plant lives and operates',
    examples: [
      {
        en: 'Stricter carbon taxes are essential to preserve the natural environment for future generations.',
        vi: 'Thuế carbon nghiêm ngặt hơn là điều thiết yếu để bảo tồn môi trường tự nhiên cho các thế hệ tương lai.',
        ieltsContext: 'W2',
        clozeAccepted: ['environment', 'environments', 'environmental'],
      },
      {
        en: 'A supportive classroom environment fosters intellectual curiosity and student engagement.',
        vi: 'Một môi trường lớp học giàu tính hỗ trợ sẽ nuôi dưỡng sự tò mò trí tuệ và sự gắn kết của học sinh.',
        ieltsContext: 'S',
        clozeAccepted: ['environment', 'environments'],
      },
    ],
    family: [
      { form: 'environmental', pos: 'adj' },
      { form: 'environmentally', pos: 'adv' },
      { form: 'environmentalist', pos: 'n' },
    ],
    synonyms: [
      { word: 'ecosystem', noteVi: 'Hệ sinh thái tự nhiên' },
      { word: 'surroundings', noteVi: 'Môi trường/khung cảnh xung quanh' },
    ],
    collocationIds: ['col:mitigate_impact'],
    register: 'neutral',
    topics: ['environment', 'education'],
    lists: ['AWL1'],
    freqZipf: 5.3,
    cefr: 'B2',
    vnTrap: 'Chú ý âm câm "n" đứng trước "m" (en-vi-roN-ment), rất dễ gõ thiếu thành "enviroment".',
    audio: { uk: 'audio/vocab/uk/environment.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:allocate',
    headword: 'allocate',
    pos: ['v'],
    ipa: { uk: '/ˈæləkeɪt/', us: '/ˈæləkeɪt/' },
    syllables: 'al·lo·cate',
    meaningVi: 'phân bổ (ngân sách, nguồn lực, thời gian)',
    definitionEn: 'to officially give a share of money, time, or resources for a particular purpose',
    examples: [
      {
        en: 'Policymakers should allocate a greater proportion of the national budget to preventive healthcare.',
        vi: 'Các nhà hoạch định chính sách nên phân bổ tỷ trọng ngân sách quốc gia lớn hơn cho y tế dự phòng.',
        ieltsContext: 'W2',
        clozeAccepted: ['allocate', 'allocated', 'allocates', 'allocating'],
      },
      {
        en: 'Municipalities have allocated emergency funds to upgrade ageing water treatment facilities.',
        vi: 'Chính quyền thành phố đã phân bổ quỹ khẩn cấp để nâng cấp các cơ sở xử lý nước đã xuống cấp.',
        ieltsContext: 'R',
        clozeAccepted: ['allocated', 'allocate', 'allocates'],
      },
    ],
    family: [
      { form: 'allocation', pos: 'n' },
      { form: 'allocated', pos: 'v' },
      { form: 'allocating', pos: 'v' },
    ],
    synonyms: [
      { word: 'earmark', noteVi: 'Dành riêng một khoản ngân sách cho mục đích cụ thể' },
      { word: 'apportion', noteVi: 'Chia phần theo tỷ lệ' },
    ],
    collocationIds: ['col:allocate_funding'],
    register: 'formal',
    topics: ['government', 'economy'],
    lists: ['AWL6'],
    freqZipf: 4.3,
    cefr: 'C1',
    vnTrap: 'Chú ý chữ đôi "ll" (al-lo-cate) và cấu trúc "allocate something TO somebody/something".',
    audio: { uk: 'audio/vocab/uk/allocate.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'vocab:scrutinise',
    headword: 'scrutinise',
    pos: ['v'],
    ipa: { uk: '/ˈskruːtənaɪz/', us: '/ˈskruːtənaɪz/' },
    syllables: 'scru·ti·nise',
    meaningVi: 'xem xét kỹ lưỡng, thẩm tra, soi xét',
    definitionEn: 'to examine someone or something very carefully in order to discover detailed information',
    examples: [
      {
        en: 'Consumers should scrutinise online health claims before purchasing dietary supplements.',
        vi: 'Người tiêu dùng nên xem xét kỹ lưỡng các tuyên bố sức khỏe trực tuyến trước khi mua thực phẩm bổ sung.',
        ieltsContext: 'W2',
        clozeAccepted: ['scrutinise', 'scrutinize', 'scrutinised', 'scrutinized', 'scrutinising', 'scrutinizing'],
      },
      {
        en: 'Independent auditors were appointed to scrutinise the corporation financial statements.',
        vi: 'Các kiểm toán viên độc lập đã được chỉ định để thẩm tra báo cáo tài chính của tập đoàn.',
        ieltsContext: 'R',
        clozeAccepted: ['scrutinise', 'scrutinize', 'scrutinised', 'scrutinized'],
      },
    ],
    family: [
      { form: 'scrutiny', pos: 'n' },
      { form: 'scrutinize', pos: 'v' },
      { form: 'scrutinised', pos: 'v' },
      { form: 'scrutinized', pos: 'v' },
    ],
    synonyms: [
      { word: 'inspect', noteVi: 'Kiểm tra, thanh tra' },
      { word: 'probe', noteVi: 'Điều tra sâu' },
    ],
    collocationIds: ['col:mitigate_risk'],
    register: 'formal',
    topics: ['media', 'science'],
    lists: ['NAWL'],
    freqZipf: 3.7,
    cefr: 'C1',
    vnTrap: 'Chấp nhận cả "scrutinise" (UK) và "scrutinize" (US). Danh từ tương ứng là "under close scrutiny".',
    audio: { uk: 'audio/vocab/uk/scrutinise.mp3' },
    provenance: FIXTURE_PROVENANCE,
  },
];

export const V1_FIXTURE_COLLOCATIONS: CollocationItem[] = [
  {
    id: 'col:curriculum_reform',
    headwordId: 'vocab:curriculum',
    pattern: 'V+N',
    phrase: 'implement curriculum reform',
    gaps: [
      {
        display: '___ curriculum reform',
        answers: ['implement', 'introduce', 'initiate', 'pursue'],
        primary: 'implement',
      },
    ],
    meaningVi: 'thực hiện cải cách chương trình giảng dạy',
    example: 'The Ministry of Education decided to implement curriculum reform to emphasise digital literacy.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'do curriculum reform',
        whyVi: 'Tránh dùng động từ đa năng "do/make" với "reform"; hãy dùng "implement", "introduce" hoặc "initiate".',
      },
    ],
    topics: ['education', 'government'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'col:overhaul_curriculum',
    headwordId: 'vocab:curriculum',
    pattern: 'V+N',
    phrase: 'overhaul the national curriculum',
    gaps: [
      {
        display: '___ the national curriculum',
        answers: ['overhaul', 'revamp', 'modernise', 'modernize'],
        primary: 'overhaul',
      },
    ],
    meaningVi: 'cải tổ toàn diện chương trình giảng dạy quốc gia',
    example: 'Policymakers were urged to overhaul the national curriculum to prepare graduates for automation.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'fix the national curriculum',
        whyVi: '"Fix" quá khẩu ngữ cho Task 2; "overhaul" hoặc "revamp" diễn tả sự cải tổ toàn diện chuẩn Band 8.',
      },
    ],
    topics: ['education'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'col:mitigate_impact',
    headwordId: 'vocab:mitigate',
    pattern: 'V+N',
    phrase: 'mitigate the adverse impact of',
    gaps: [
      {
        display: 'mitigate the ___ impact of',
        answers: ['adverse', 'negative', 'detrimental', 'harmful'],
        primary: 'adverse',
      },
    ],
    meaningVi: 'giảm nhẹ tác động bất lợi của',
    example: 'Coastal barriers were constructed to mitigate the adverse impact of rising sea levels.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'mitigate the bad impact of',
        whyVi: 'Thay "bad impact" bằng cụm học thuật "adverse impact" hoặc "detrimental impact".',
      },
    ],
    topics: ['environment'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'col:mitigate_risk',
    headwordId: 'vocab:mitigate',
    pattern: 'V+N',
    phrase: 'mitigate financial risks',
    gaps: [
      {
        display: '___ financial risks',
        answers: ['mitigate', 'minimise', 'minimize', 'reduce'],
        primary: 'mitigate',
      },
    ],
    meaningVi: 'giảm thiểu rủi ro tài chính',
    example: 'Diversifying energy imports helps nations mitigate financial risks during supply crises.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'lower financial risks',
        whyVi: 'Trong văn viết học thuật, "mitigate risks" hoặc "minimise risks" tự nhiên hơn "lower risks".',
      },
    ],
    topics: ['economy'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'col:allocate_funding',
    headwordId: 'vocab:allocate',
    pattern: 'V+N',
    phrase: 'allocate public funding to',
    gaps: [
      {
        display: '___ public funding to',
        answers: ['allocate', 'channel', 'direct'],
        primary: 'allocate',
      },
    ],
    meaningVi: 'phân bổ nguồn vốn công cho',
    example: 'Authorities should allocate public funding to renewable energy research rather than fossil fuel subsidies.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'give public funding to',
        whyVi: 'Thay "give money/funding" bằng "allocate public funding to" để nâng điểm Lexical Resource.',
      },
    ],
    topics: ['government', 'economy'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'col:bridge_disparity',
    headwordId: 'vocab:disparity',
    pattern: 'V+N',
    phrase: 'bridge the socioeconomic disparity',
    gaps: [
      {
        display: '___ the socioeconomic disparity',
        answers: ['bridge', 'narrow', 'reduce', 'address'],
        primary: 'bridge',
      },
    ],
    meaningVi: 'thu hẹp khoảng cách chênh lệch kinh tế - xã hội',
    example: 'Universal access to high-speed internet can help bridge the socioeconomic disparity between regions.',
    register: 'formal',
    bandTarget: 8,
    l1Traps: [
      {
        wrong: 'delete the socioeconomic disparity',
        whyVi: 'Không dùng "delete disparity"; hãy dùng ẩn dụ học thuật "bridge / narrow the disparity".',
      },
    ],
    topics: ['government', 'economy'],
    provenance: FIXTURE_PROVENANCE,
  },
];

export const V1_FIXTURE_PARAPHRASES: ParaphraseItem[] = [
  {
    id: 'para:0001',
    level: 2,
    questionPhrase: 'a rapid increase in urban population',
    relation: 'equivalent',
    context: 'Over the last three decades, a demographic surge in metropolitan areas has strained municipal infrastructure.',
    target: {
      text: 'demographic surge in metropolitan areas',
      start: 28,
      end: 67,
    },
    decoys: [
      {
        text: 'gradual decline in rural employment',
        start: 0,
        end: 35,
        whyVi: 'Ngược nghĩa (decline vs increase) và khác đối tượng (rural employment vs urban population).',
      },
      {
        text: 'strained municipal infrastructure',
        start: 72,
        end: 105,
        whyVi: 'Đây là hệ quả (hạ tầng quá tải), không phải cụm đồng nghĩa với sự gia tăng dân số đô thị.',
      },
      {
        text: 'stagnant population growth in suburbs',
        start: 0,
        end: 37,
        whyVi: '"Stagnant" nghĩa là trì trệ/đứng yên, trái ngược với "rapid increase" (surge).',
      },
    ],
    explanationVi: '"Demographic surge" = "rapid increase in population", và "metropolitan areas" = "urban".',
    topics: ['urban'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'para:0002',
    level: 2,
    questionPhrase: 'strict government regulations on emissions',
    relation: 'equivalent',
    context: 'Without stringent state controls over carbon output, global temperatures will continue to climb.',
    target: {
      text: 'stringent state controls over carbon output',
      start: 8,
      end: 51,
    },
    decoys: [
      {
        text: 'voluntary corporate pledges on energy',
        start: 0,
        end: 37,
        whyVi: '"Voluntary corporate pledges" là cam kết tự nguyện của doanh nghiệp, không phải quy định bắt buộc của chính phủ.',
      },
      {
        text: 'financial incentives for green startups',
        start: 0,
        end: 39,
        whyVi: 'Nói về ưu đãi tài chính chứ không phải quy định kiểm soát khí thải.',
      },
      {
        text: 'lenient policies regarding industrial waste',
        start: 0,
        end: 43,
        whyVi: '"Lenient" (lỏng lẻo/khoan dung) trái nghĩa với "strict / stringent" (nghiêm ngặt).',
      },
    ],
    explanationVi: '"Stringent" = "strict", "state controls" = "government regulations", "carbon output" = "emissions".',
    topics: ['environment', 'government'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'para:0003',
    level: 3,
    questionPhrase: 'harmful effects on biodiversity',
    relation: 'equivalent',
    context: 'Intensive monoculture farming has had detrimental consequences for ecological variety across the continent.',
    target: {
      text: 'detrimental consequences for ecological variety',
      start: 38,
      end: 85,
    },
    decoys: [
      {
        text: 'beneficial outcomes for agricultural yield',
        start: 0,
        end: 42,
        whyVi: '"Beneficial" (có lợi) trái nghĩa với "harmful / detrimental" (có hại).',
      },
      {
        text: 'intensive monoculture farming',
        start: 0,
        end: 29,
        whyVi: 'Đây là nguyên nhân (canh tác độc canh), không phải cụm paraphrase cho tác động có hại lên đa dạng sinh học.',
      },
      {
        text: 'negligible impact on marine habitats',
        start: 0,
        end: 36,
        whyVi: '"Negligible" nghĩa là không đáng kể, khác với "harmful / detrimental".',
      },
    ],
    explanationVi: '"Detrimental consequences" = "harmful effects", và "ecological variety" = "biodiversity".',
    topics: ['environment'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'para:0004',
    level: 2,
    questionPhrase: 'financial support from the state',
    relation: 'equivalent',
    context: 'Many cultural institutions rely heavily on public subsidies allocated by authorities to remain operational.',
    target: {
      text: 'public subsidies allocated by authorities',
      start: 43,
      end: 84,
    },
    decoys: [
      {
        text: 'private donations from wealthy patrons',
        start: 0,
        end: 38,
        whyVi: '"Private donations" là quyên góp tư nhân, không phải hỗ trợ từ nhà nước ("from the state").',
      },
      {
        text: 'commercial revenue from ticket sales',
        start: 0,
        end: 36,
        whyVi: 'Doanh thu bán vé thương mại khác với trợ cấp tài chính công.',
      },
      {
        text: 'tax penalties imposed on corporations',
        start: 0,
        end: 37,
        whyVi: 'Tiền phạt thuế đánh vào doanh nghiệp không phải là khoản hỗ trợ tài chính.',
      },
    ],
    explanationVi: '"Public subsidies" = "financial support", và "authorities" = "the state".',
    topics: ['government', 'economy'],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'para:0005',
    level: 3,
    questionPhrase: 'traditional teaching methods based on memorisation',
    relation: 'equivalent',
    context: 'Reforming schools requires moving beyond conventional pedagogy reliant on rote learning.',
    target: {
      text: 'conventional pedagogy reliant on rote learning',
      start: 41,
      end: 87,
    },
    decoys: [
      {
        text: 'innovative curricula focused on critical inquiry',
        start: 0,
        end: 48,
        whyVi: '"Innovative" và "critical inquiry" trái ngược với truyền thống và học thuộc lòng.',
      },
      {
        text: 'digital assessment tools in higher education',
        start: 0,
        end: 44,
        whyVi: 'Đề cập công cụ đánh giá kỹ thuật số chứ không phải phương pháp giảng dạy truyền thống.',
      },
      {
        text: 'extracurricular activities for primary pupils',
        start: 0,
        end: 45,
        whyVi: 'Hoạt động ngoại khóa không đồng nghĩa với phương pháp dạy học dựa trên ghi nhớ.',
      },
    ],
    explanationVi: '"Conventional pedagogy" = "traditional teaching methods", và "rote learning" = "memorisation".',
    topics: ['education'],
    provenance: FIXTURE_PROVENANCE,
  },
];

export const V1_FIXTURE_ERRORS: ErrorItem[] = [
  {
    id: 'err:article_0001',
    tag: 'article',
    wrong: 'The education plays a pivotal role in economic growth.',
    correct: 'Education plays a pivotal role in economic growth.',
    errorSpan: { start: 0, end: 13 },
    ruleVi: 'Danh từ trừu tượng không đếm được chỉ khái niệm chung ("Education") không dùng mạo từ "The" ở đầu câu.',
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'err:article_0002',
    tag: 'article',
    wrong: 'Governments must protect environment from industrial pollution.',
    correct: 'Governments must protect the environment from industrial pollution.',
    errorSpan: { start: 25, end: 36 },
    ruleVi: 'Danh từ chỉ môi trường tự nhiên nói chung luôn cần mạo từ xác định: "the environment".',
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'err:article_0003',
    tag: 'article',
    wrong: 'A number of private cars has risen dramatically.',
    correct: 'The number of private cars has risen dramatically.',
    errorSpan: { start: 0, end: 8 },
    ruleVi: 'Khi động từ chia số ít ("has risen") chỉ con số tổng thể, phải dùng "The number of" chứ không phải "A number of".',
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'err:preposition_0001',
    tag: 'preposition',
    wrong: 'Excessive screen time has a negative impact to children.',
    correct: 'Excessive screen time has a negative impact on children.',
    errorSpan: { start: 44, end: 46 },
    ruleVi: 'Danh từ "impact / effect / influence" đi với giới từ "on" (impact on somebody/something), không đi với "to".',
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'err:l1_collocation_0001',
    tag: 'l1_collocation',
    wrong: 'Students need to learn knowledge from practical experience.',
    correct: 'Students need to acquire knowledge from practical experience.',
    errorSpan: { start: 17, end: 32 },
    ruleVi: 'Lỗi dịch từng chữ tiếng Việt "học kiến thức": tiếng Anh không nói "learn knowledge" mà dùng "acquire / gain knowledge".',
    provenance: FIXTURE_PROVENANCE,
  },
];

export const V1_FIXTURE_DICTATION: DictationItem[] = [
  {
    id: 'dict:0001',
    text: 'Universities must accommodate students from diverse socioeconomic backgrounds.',
    level: 5,
    accent: 'uk',
    voice: 'bf_emma',
    wpm: 135,
    features: ['academic'],
    focus: [
      {
        tokenIndex: 2,
        feature: 'double_letter',
        tipVi: 'Từ "accommodate" có 2 chữ "c" và 2 chữ "m" (ac-com-mo-date).',
      },
    ],
    audio: 'audio/vocab/uk/accommodate.mp3',
    acceptedVariants: [
      'Universities must accommodate students from diverse socioeconomic backgrounds.',
    ],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'dict:0002',
    text: 'The government pledged to protect the natural environment from degradation.',
    level: 4,
    accent: 'uk',
    voice: 'bm_george',
    wpm: 130,
    features: ['elision', 'academic'],
    focus: [
      {
        tokenIndex: 1,
        feature: 'silent_letter',
        tipVi: 'Từ "government" và "environment" đều có âm "n" câm đứng trước chữ "m".',
      },
    ],
    audio: 'audio/vocab/uk/environment.mp3',
    acceptedVariants: [
      'The government pledged to protect the natural environment from degradation.',
    ],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'dict:0003',
    text: 'Policymakers should scrutinise the long-term implications of automation.',
    level: 6,
    accent: 'uk',
    voice: 'bf_emma',
    wpm: 140,
    features: ['academic'],
    focus: [
      {
        tokenIndex: 2,
        feature: 'spelling_variant',
        tipVi: 'Chấp nhận cả hai cách viết "scrutinise" (Anh-Anh) và "scrutinize" (Anh-Mỹ).',
      },
    ],
    audio: 'audio/vocab/uk/scrutinise.mp3',
    acceptedVariants: [
      'Policymakers should scrutinise the long-term implications of automation.',
      'Policymakers should scrutinize the long-term implications of automation.',
    ],
    provenance: FIXTURE_PROVENANCE,
  },
  {
    id: 'dict:0004',
    text: 'Adequate funding is required to overhaul the national curriculum.',
    level: 5,
    accent: 'uk',
    voice: 'bm_george',
    wpm: 135,
    features: ['academic', 'linking'],
    focus: [
      {
        tokenIndex: 8,
        feature: 'double_letter',
        tipVi: 'Từ "curriculum" có chữ đôi "rr" ở âm tiết thứ hai (cur-ric-u-lum).',
      },
    ],
    audio: 'audio/vocab/uk/curriculum.mp3',
    acceptedVariants: [
      'Adequate funding is required to overhaul the national curriculum.',
    ],
    provenance: FIXTURE_PROVENANCE,
  },
];

export type { V1ContentBundle };

export const V1_FIXTURE_CONTENT: V1ContentBundle = {
  vocab: V1_FIXTURE_VOCAB,
  collocations: V1_FIXTURE_COLLOCATIONS,
  paraphrases: V1_FIXTURE_PARAPHRASES,
  errors: V1_FIXTURE_ERRORS,
  dictations: V1_FIXTURE_DICTATION,
};

/**
 * Create a rich default deck of SRS cards covering all 8 V1 faces and all 5 item types,
 * ready for immediate play when IndexedDB is empty or in tests.
 */
export function buildV1FixtureCards(now: Date = new Date()): SRSCard[] {
  const nowMs = now.getTime();
  const cards: SRSCard[] = [];

  const addDueCard = (
    itemId: string,
    face: Face,
    opts: {
      stability: number;
      overdueHours: number;
      reps?: number;
      lapses?: number;
      streak?: number;
      state?: State;
      starred?: boolean;
    },
  ) => {
    const base = createNewCard(itemId, face, {
      now,
      unlocked: true,
      starred: opts.starred ?? false,
      source: 'fixture',
    });
    const elapsedDays = Math.max(1, Math.round(opts.overdueHours / 24));
    cards.push({
      ...base,
      state: opts.state ?? State.Review,
      stability: opts.stability,
      difficulty: 5.5,
      elapsed_days: elapsedDays,
      scheduled_days: Math.max(1, Math.round(opts.stability)),
      reps: opts.reps ?? 3,
      lapses: opts.lapses ?? 0,
      streak: opts.streak ?? 2,
      last_review: nowMs - elapsedDays * 86_400_000,
      due: nowMs - opts.overdueHours * 3_600_000,
    });
  };

  const addNewCard = (itemId: string, face: Face, starred = false, indexOffset = 0) => {
    const base = createNewCard(itemId, face, {
      now: new Date(nowMs - (100 - indexOffset) * 60_000),
      unlocked: true,
      starred,
      source: 'fixture',
    });
    cards.push(base);
  };

  // Due vocab cards across recog, recall_meaning, recall_cloze, listen_spell
  addDueCard('vocab:curriculum', 'recall_meaning', { stability: 6, overdueHours: 48, reps: 4 });
  addDueCard('vocab:mitigate', 'recall_cloze', { stability: 5, overdueHours: 36, reps: 3 });
  addDueCard('vocab:proliferate', 'recog', { stability: 2.5, overdueHours: 72, reps: 2 });
  addDueCard('vocab:disparity', 'recall_meaning', { stability: 8, overdueHours: 24, reps: 4 });
  addDueCard('vocab:organise', 'recall_meaning', { stability: 7, overdueHours: 30, reps: 3 });
  addDueCard('vocab:rote_learning', 'recall_meaning', { stability: 5, overdueHours: 40, reps: 3 });
  addDueCard('vocab:accommodate', 'listen_spell', { stability: 12, overdueHours: 60, reps: 5 });
  addDueCard('vocab:environment', 'listen_spell', { stability: 14, overdueHours: 50, reps: 5 });
  addDueCard('vocab:allocate', 'recall_cloze', { stability: 6, overdueHours: 28, reps: 3 });
  addDueCard('vocab:scrutinise', 'recall_meaning', { stability: 9, overdueHours: 20, reps: 4 });

  // Due collocation cards (col_gap)
  addDueCard('col:curriculum_reform', 'col_gap', { stability: 4, overdueHours: 44, reps: 2 });
  addDueCard('col:overhaul_curriculum', 'col_gap', { stability: 5, overdueHours: 22, reps: 3 });
  addDueCard('col:mitigate_impact', 'col_gap', { stability: 3.5, overdueHours: 52, reps: 2 });
  addDueCard('col:mitigate_risk', 'col_gap', { stability: 6, overdueHours: 18, reps: 3 });
  addDueCard('col:allocate_funding', 'col_gap', { stability: 4.5, overdueHours: 32, reps: 2 });
  addDueCard('col:bridge_disparity', 'col_gap', { stability: 5.5, overdueHours: 26, reps: 3 });

  // Due paraphrase cards (para_match)
  addDueCard('para:0001', 'para_match', { stability: 4, overdueHours: 38, reps: 2 });
  addDueCard('para:0002', 'para_match', { stability: 5, overdueHours: 25, reps: 3 });
  addDueCard('para:0003', 'para_match', { stability: 3, overdueHours: 64, reps: 2 });
  addDueCard('para:0004', 'para_match', { stability: 6, overdueHours: 16, reps: 3 });
  addDueCard('para:0005', 'para_match', { stability: 4.5, overdueHours: 29, reps: 2 });

  // Due error fix cards (err_fix)
  addDueCard('err:article_0001', 'err_fix', { stability: 3, overdueHours: 56, reps: 2 });
  addDueCard('err:article_0002', 'err_fix', { stability: 3.5, overdueHours: 42, reps: 2 });
  addDueCard('err:article_0003', 'err_fix', { stability: 4, overdueHours: 34, reps: 2 });
  addDueCard('err:preposition_0001', 'err_fix', { stability: 5, overdueHours: 20, reps: 3 });
  addDueCard('err:l1_collocation_0001', 'err_fix', { stability: 4.5, overdueHours: 27, reps: 3 });

  // Due dictation listen_spell cards
  addDueCard('dict:0001', 'listen_spell', { stability: 11, overdueHours: 46, reps: 4 });
  addDueCard('dict:0002', 'listen_spell', { stability: 10, overdueHours: 35, reps: 4 });

  // New vocab cards (will start with 'intro' face in V1 run)
  addNewCard('vocab:ubiquitous', 'recog', true, 1);
  addNewCard('vocab:exacerbate', 'recog', false, 2);

  return cards;
}
