import type { ListeningEpisode } from '../../core/content/schemas';

/**
 * Fixture 1: Part 1 — Dialogue (Sports Centre Membership Booking)
 * Includes Form Completion (Q1–Q7) + MCQ Single (Q8–Q10) with realistic IELTS traps
 * (spelling_out/double_letter, distractor_number, self_correction, changed_plan, plural_singular, negation_shift).
 */
export const L1_FIXTURE_P1: ListeningEpisode = {
  id: 'lep:fixture_p1_sports_centre',
  part: 1,
  reserved: false,
  title: 'Harbourside Leisure Centre Membership',
  contextEn:
    'You will hear a new local resident telephoning a leisure centre receptionist to enquire about an evening membership.',
  difficulty: 2,
  speakers: [
    {
      id: 'rec',
      name: 'Hannah',
      role: 'Receptionist',
      voice: 'bf_emma',
      accent: 'uk',
    },
    {
      id: 'caller',
      name: 'Owen',
      role: 'Caller',
      voice: 'bm_george',
      accent: 'uk',
    },
  ],
  channel: 'phone',
  script: [
    {
      lineId: 'l1',
      speakerId: 'rec',
      text: 'Good afternoon, Harbourside Leisure Centre, Hannah speaking. How can I help?',
      start: 0,
      end: 6,
    },
    {
      lineId: 'l2',
      speakerId: 'caller',
      text: 'Hi Hannah, I moved to the area last week and I would like to register for a membership.',
      start: 6,
      end: 13,
    },
    {
      lineId: 'l3',
      speakerId: 'rec',
      text: 'Certainly. Let me open a booking form. Could I take your surname first, please?',
      start: 13,
      end: 20,
    },
    {
      lineId: 'l4',
      speakerId: 'caller',
      text: 'Yes, it is Bramwell. People often write Bramhall, so let me spell it: B-R-A-M-W-E-double-L.',
      ttsText: 'Yes, it is Bramwell. People often write Bramhall, so let me spell it: B, R, A, M, W, E, L, L.',
      start: 20,
      end: 31,
    },
    {
      lineId: 'l5',
      speakerId: 'rec',
      text: 'Got it, Bramwell. And what is your street address?',
      start: 31,
      end: 36,
    },
    {
      lineId: 'l6',
      speakerId: 'caller',
      text: 'I used to live at 84 Station Road, sorry, that is my old flat — the new address is 48 Oak Lane.',
      start: 36,
      end: 46,
    },
    {
      lineId: 'l7',
      speakerId: 'rec',
      text: '48 Oak Lane, lovely. Now, we have three membership tiers: Peak, Off-Peak, and Weekend. Which suits you best?',
      start: 46,
      end: 56,
    },
    {
      lineId: 'l8',
      speakerId: 'caller',
      text: 'I thought about Weekend at first, but I actually work from home on weekday mornings, so Off-Peak makes much more sense.',
      start: 56,
      end: 66,
    },
    {
      lineId: 'l9',
      speakerId: 'rec',
      text: 'Off-Peak gives you access from 6.30 to 4 p.m. Monday to Friday. When would you like your pass to begin?',
      start: 66,
      end: 75,
    },
    {
      lineId: 'l10',
      speakerId: 'caller',
      text: 'Could we start on the 13th of March? Oh wait, I am away for a conference that week — let us make it the 30th of March instead.',
      start: 75,
      end: 87,
    },
    {
      lineId: 'l11',
      speakerId: 'rec',
      text: 'No problem, 30 March. Each new member can reserve one complimentary beginner studio class. Would you like yoga or spinning?',
      start: 87,
      end: 98,
    },
    {
      lineId: 'l12',
      speakerId: 'caller',
      text: 'I normally enjoy yoga, though my physiotherapist recommended pilates for my lower back, so I will book pilates.',
      start: 98,
      end: 109,
    },
    {
      lineId: 'l13',
      speakerId: 'rec',
      text: 'Great choice. The standard monthly fee is 45 pounds, but because you live within the harbour postcode, the resident rate is 38 pounds a month.',
      start: 109,
      end: 121,
    },
    {
      lineId: 'l14',
      speakerId: 'caller',
      text: 'That is very reasonable. Does that include anything extra at reception?',
      start: 121,
      end: 127,
    },
    {
      lineId: 'l15',
      speakerId: 'rec',
      text: 'Yes, fresh towels are provided free of charge on every visit, though you will need to bring your own water bottle.',
      start: 127,
      end: 136,
    },
    {
      lineId: 'l16',
      speakerId: 'caller',
      text: 'Good to know. What about parking outside the centre?',
      start: 136,
      end: 141,
    },
    {
      lineId: 'l17',
      speakerId: 'rec',
      text: 'The front car park used to be free all day, and non-members now pay two pounds an hour. Members still park free for the first two hours if you validate your ticket at reception.',
      start: 141,
      end: 155,
    },
    {
      lineId: 'l18',
      speakerId: 'caller',
      text: 'And do the changing-room lockers take coins?',
      start: 155,
      end: 159,
    },
    {
      lineId: 'l19',
      speakerId: 'rec',
      text: 'We replaced the old one-pound coin slots last month. You just tap your membership wristband now, so no deposit is needed.',
      start: 159,
      end: 170,
    },
    {
      lineId: 'l20',
      speakerId: 'caller',
      text: 'Brilliant. When should I come in for the gym induction?',
      start: 170,
      end: 175,
    },
    {
      lineId: 'l21',
      speakerId: 'rec',
      text: 'Tuesday morning is fully booked and Wednesday evening is closed for maintenance, so Thursday at 10.30 a.m. is the earliest slot available.',
      start: 175,
      end: 186,
    },
  ],
  audio: {
    path: 'audio/listening/fixture_p1_sports_centre.mp3',
    durationSec: 186,
    sha256: 'fixture-p1-placeholder',
    loudnessLUFS: -16,
  },
  questionGroups: [
    {
      groupId: 'p1_g1',
      type: 'form_completion',
      instructions: 'Complete the booking form below. Write ONE WORD AND/OR A NUMBER for each answer.',
      wordLimit: { words: 1, allowNumber: true },
      previewSec: 30,
      template: {
        title: 'HARBOURSIDE LEISURE CENTRE — MEMBERSHIP FORM',
        rows: [
          { label: 'Applicant surname', blankQid: 'fp1_q01' },
          { label: 'Street address', blankQid: 'fp1_q02', suffix: 'Oak Lane' },
          { label: 'Membership tier', blankQid: 'fp1_q03' },
          { label: 'Start date', blankQid: 'fp1_q04' },
          { label: 'Free studio class', blankQid: 'fp1_q05' },
          { label: 'Monthly resident fee', value: '£', blankQid: 'fp1_q06' },
          { label: 'Complimentary item', blankQid: 'fp1_q07', suffix: '(on every visit)' },
        ],
      },
      questions: [
        {
          qid: 'fp1_q01',
          number: 1,
          prompt: 'Applicant surname: ________',
          answer: { accepted: ['Bramwell'] },
          evidence: { lineId: 'l4', start: 20, end: 31 },
          traps: [
            {
              type: 'double_letter',
              lineId: 'l4',
              start: 20,
              end: 26,
              decoy: 'Bramhall',
              explanationVi:
                'Người nói nhắc tên hay bị viết nhầm "Bramhall" trước khi đánh vần rõ B-R-A-M-W-E-L-L (hai chữ L).',
            },
          ],
        },
        {
          qid: 'fp1_q02',
          number: 2,
          prompt: 'Street number: ________ Oak Lane',
          answer: { accepted: ['48'] },
          evidence: { lineId: 'l6', start: 41, end: 46 },
          traps: [
            {
              type: 'self_correction',
              lineId: 'l6',
              start: 36,
              end: 41,
              decoy: '84',
              explanationVi:
                'Bẫy self-correction: 84 là địa chỉ căn hộ cũ ("sorry, that is my old flat"), địa chỉ mới là 48.',
            },
          ],
        },
        {
          qid: 'fp1_q03',
          number: 3,
          prompt: 'Membership tier: ________',
          answer: { accepted: ['off-peak', 'offpeak'] },
          evidence: { lineId: 'l8', start: 60, end: 66 },
          traps: [
            {
              type: 'option_mentioned_rejected',
              lineId: 'l8',
              start: 56,
              end: 60,
              decoy: 'Weekend',
              explanationVi:
                'Người nói từng cân nhắc "Weekend" nhưng đổi sang "Off-Peak" vì làm việc tại nhà các sáng trong tuần.',
            },
          ],
        },
        {
          qid: 'fp1_q04',
          number: 4,
          prompt: 'Start date: ________',
          answer: { accepted: ['30 March', '30th March', 'March 30'] },
          evidence: { lineId: 'l10', start: 81, end: 87 },
          traps: [
            {
              type: 'self_correction',
              lineId: 'l10',
              start: 75,
              end: 81,
              decoy: '13 March',
              explanationVi:
                'Bẫy self-correction + nghe nhầm số 13/30: người nói định chọn 13 March rồi sửa sang 30 March vì đi hội thảo.',
            },
          ],
        },
        {
          qid: 'fp1_q05',
          number: 5,
          prompt: 'Free studio class: ________',
          answer: { accepted: ['pilates'] },
          evidence: { lineId: 'l12', start: 103, end: 109 },
          traps: [
            {
              type: 'changed_plan',
              lineId: 'l12',
              start: 98,
              end: 103,
              decoy: 'yoga',
              explanationVi:
                'Người nói thường tập "yoga" nhưng lần này đổi sang "pilates" theo lời khuyên chuyên gia vật lý trị liệu.',
            },
          ],
        },
        {
          qid: 'fp1_q06',
          number: 6,
          prompt: 'Monthly resident fee: £________',
          answer: { accepted: ['38', '£38', '38 pounds'] },
          evidence: { lineId: 'l13', start: 115, end: 121 },
          traps: [
            {
              type: 'distractor_number',
              lineId: 'l13',
              start: 109,
              end: 115,
              decoy: '45',
              explanationVi:
                '£45 là phí tiêu chuẩn (distractor number); phí ưu đãi cư dân tại mã bưu điện địa phương là £38.',
            },
          ],
        },
        {
          qid: 'fp1_q07',
          number: 7,
          prompt: 'Complimentary item provided on every visit: ________',
          answer: { accepted: ['towels'] },
          evidence: { lineId: 'l15', start: 127, end: 133 },
          traps: [
            {
              type: 'plural_singular',
              lineId: 'l15',
              start: 127,
              end: 136,
              decoy: 'towel',
              explanationVi:
                'Cần giữ đúng dạng số nhiều "towels" như trong bài nghe ("fresh towels are provided").',
            },
          ],
        },
      ],
    },
    {
      groupId: 'p1_g2',
      type: 'mcq_single',
      instructions: 'Choose the correct letter, A, B or C.',
      previewSec: 15,
      options: [
        { key: 'A', text: 'Free all day for all visitors' },
        { key: 'B', text: 'Free for members for the first two hours' },
        { key: 'C', text: 'Two pounds per hour for everyone' },
      ],
      questions: [
        {
          qid: 'fp1_q08',
          number: 8,
          prompt: 'What is the current parking policy for members?\nA. Free all day for all visitors\nB. Free for members for the first two hours\nC. Two pounds per hour for everyone',
          answer: { accepted: ['B'], keys: ['B'] },
          evidence: { lineId: 'l17', start: 147, end: 155 },
          traps: [
            {
              type: 'negation_shift',
              lineId: 'l17',
              start: 141,
              end: 147,
              decoy: 'A',
              explanationVi:
                '"Used to be free all day" là quy định cũ (A bị loại); hiện tại hội viên được miễn phí 2 giờ đầu (B).',
            },
          ],
        },
        {
          qid: 'fp1_q09',
          number: 9,
          prompt: 'How do the changing-room lockers work now?\nA. Members insert a refundable £1 coin\nB. Members leave a key deposit at reception\nC. Members tap their membership wristband',
          answer: { accepted: ['C'], keys: ['C'] },
          evidence: { lineId: 'l19', start: 163, end: 170 },
          traps: [
            {
              type: 'option_mentioned_rejected',
              lineId: 'l19',
              start: 159,
              end: 163,
              decoy: 'A',
              explanationVi:
                'Khe nhét xu £1 đã bị thay thế tháng trước ("replaced the old one-pound coin slots") → đáp án C.',
            },
          ],
        },
        {
          qid: 'fp1_q10',
          number: 10,
          prompt: 'When is the earliest available gym induction slot?\nA. Tuesday morning\nB. Wednesday evening\nC. Thursday morning',
          answer: { accepted: ['C'], keys: ['C'] },
          evidence: { lineId: 'l21', start: 180, end: 186 },
          traps: [
            {
              type: 'option_mentioned_rejected',
              lineId: 'l21',
              start: 175,
              end: 180,
              decoy: 'A',
              explanationVi:
                'Sáng thứ Ba đã kín chỗ và tối thứ Tư bảo trì; sáng thứ Năm lúc 10:30 là lịch sớm nhất (C).',
            },
          ],
        },
      ],
    },
  ],
  provenance: {
    createdBy: 'human',
    source: 'fixture:l1-dev',
    license: 'own',
    qa: { schema: 'pass', verifier: 'pass', blindSolve: 'pass' },
  },
};

/**
 * Fixture 2: Part 2 — Monologue (Riverside Botanical Gardens Orientation)
 * Includes Map Labelling with full SVG MapSpec (Q1–Q5), MCQ Single (Q6–Q8),
 * and MCQ Multi Choose TWO (Q9–Q10) matching r-data-listening contract #79.
 */
export const L1_FIXTURE_P2_MAP: ListeningEpisode = {
  id: 'lep:fixture_p2_botanical_gardens',
  part: 2,
  reserved: false,
  title: 'Riverside Botanical Gardens Orientation',
  contextEn:
    'You will hear a volunteer guide welcoming visitors to the newly renovated Riverside Botanical Gardens and explaining the map and weekend facilities.',
  difficulty: 5,
  speakers: [
    {
      id: 'guide',
      name: 'Claire',
      role: 'Volunteer Guide',
      voice: 'bf_alice',
      accent: 'uk',
    },
  ],
  channel: 'normal',
  script: [
    {
      lineId: 'm1',
      speakerId: 'guide',
      text: 'Welcome everyone to the newly reopened Riverside Botanical Gardens. Before you explore, please look at the map in your brochure.',
      start: 0,
      end: 10,
    },
    {
      lineId: 'm2',
      speakerId: 'guide',
      text: 'We are standing right here at the South Gate, marked "You are here", with Main Avenue running straight north in front of us.',
      start: 10,
      end: 20,
    },
    {
      lineId: 'm3',
      speakerId: 'guide',
      text: 'First, our Seed Library. Walk straight up Main Avenue and take the first footpath on your left. You will see two buildings — the western one is still used for tool storage, while the Seed Library is the building immediately to the right of the storage shed, facing the avenue.',
      start: 20,
      end: 39,
    },
    {
      lineId: 'm4',
      speakerId: 'guide',
      text: 'Next, if you keep heading north past the Central Fountain, you will reach the Alpine Glasshouse. It sits directly north of the fountain, right beside the curved northern canal.',
      start: 39,
      end: 53,
    },
    {
      lineId: 'm5',
      speakerId: 'guide',
      text: 'When you are ready for refreshments, the Herb Café has moved from its old location near the South Gate. Head east from the Central Fountain along the East Walk; it is the building tucked into the far eastern corner overlooking the pond.',
      start: 53,
      end: 70,
    },
    {
      lineId: 'm6',
      speakerId: 'guide',
      text: 'For families, the Sculpture Lawn is in the north-west corner of the park, just across the little bridge west of the canal.',
      start: 70,
      end: 82,
    },
    {
      lineId: 'm7',
      speakerId: 'guide',
      text: 'Finally, our Education Pavilion is easy to find on your way back: from the South Gate, turn immediately right along the southern border path — it is the second structure on the south-east side, just past the ticket office.',
      start: 82,
      end: 99,
    },
    {
      lineId: 'm8',
      speakerId: 'guide',
      text: 'A quick word about guided tours. We used to charge five pounds per person, but thanks to a local council grant, morning walking tours are now completely free, though you must book a place online twenty-four hours ahead.',
      start: 99,
      end: 116,
    },
    {
      lineId: 'm9',
      speakerId: 'guide',
      text: 'Please also note our photography guidelines. Tripods are no longer permitted inside the narrow glasshouses for safety reasons, even though hand-held cameras remain welcome everywhere.',
      start: 116,
      end: 130,
    },
    {
      lineId: 'm10',
      speakerId: 'guide',
      text: 'If you are visiting with children this afternoon, the pond-dipping workshop originally scheduled for two o’clock has been moved to three-thirty because of the school group visit.',
      start: 130,
      end: 144,
    },
    {
      lineId: 'm11',
      speakerId: 'guide',
      text: 'Before we set off, let me highlight two facilities that are free of charge this Sunday. Bike hire is normally free on weekdays only, and the shuttle minibus carries a small fare. However, audio guides at the front desk and the indoor children’s discovery trail are both completely complimentary all Sunday.',
      start: 144,
      end: 168,
    },
  ],
  audio: {
    path: 'audio/listening/fixture_p2_botanical_gardens.mp3',
    durationSec: 168,
    sha256: 'fixture-p2-placeholder',
    loudnessLUFS: -16,
  },
  questionGroups: [
    {
      groupId: 'p2_g1_map',
      type: 'map_labelling',
      instructions: 'Label the map below. Write the correct letter, A–H, next to Questions 1–5.',
      previewSec: 30,
      map: {
        viewBox: '0 0 600 400',
        compass: true,
        youAreHere: { x: 300, y: 355 },
        shapes: [
          { id: 'park_bg', kind: 'park', x: 20, y: 20, w: 560, h: 360 },
          { id: 'canal', kind: 'water', d: 'M 40 70 Q 300 35 560 85 L 560 112 Q 300 62 40 96 Z', label: 'Northern Canal', x: 240, y: 66 },
          { id: 'pond', kind: 'water', x: 465, y: 175, w: 95, h: 80, label: 'Lily Pond' },
          { id: 'main_ave', kind: 'road', x: 282, y: 95, w: 36, h: 255, label: 'Main Ave' },
          { id: 'west_path', kind: 'path', d: 'M 282 230 L 95 230' },
          { id: 'east_path', kind: 'path', d: 'M 318 205 L 465 205' },
          { id: 'south_path', kind: 'path', d: 'M 318 335 L 520 335' },
          { id: 'fountain', kind: 'building', x: 268, y: 185, w: 64, h: 40, label: 'Fountain' },
          { id: 'ticket', kind: 'building', x: 350, y: 305, w: 72, h: 38, label: 'Tickets' },
          { id: 'south_gate', kind: 'entrance', x: 255, y: 334, w: 90, h: 24, label: 'South Gate' },
        ],
        slots: [
          { key: 'A', x: 95, y: 120 },
          { key: 'B', x: 225, y: 240 },
          { key: 'C', x: 115, y: 240 },
          { key: 'D', x: 300, y: 132 },
          { key: 'E', x: 405, y: 150 },
          { key: 'F', x: 510, y: 270 },
          { key: 'G', x: 185, y: 315 },
          { key: 'H', x: 475, y: 325 },
        ],
      },
      options: [
        { key: 'A', text: 'A' },
        { key: 'B', text: 'B' },
        { key: 'C', text: 'C' },
        { key: 'D', text: 'D' },
        { key: 'E', text: 'E' },
        { key: 'F', text: 'F' },
        { key: 'G', text: 'G' },
        { key: 'H', text: 'H' },
      ],
      questions: [
        {
          qid: 'fp2_q01',
          number: 1,
          prompt: 'Seed Library',
          answer: { accepted: ['B'], keys: ['B'] },
          evidence: { lineId: 'm3', start: 29, end: 39 },
          traps: [
            {
              type: 'map_direction',
              lineId: 'm3',
              start: 20,
              end: 29,
              decoy: 'C',
              explanationVi:
                'Bên trái Main Avenue có 2 tòa nhà: tòa phía tây (C) là kho dụng cụ, còn Seed Library là tòa ngay bên phải kho, nhìn ra đại lộ (B).',
            },
          ],
        },
        {
          qid: 'fp2_q02',
          number: 2,
          prompt: 'Alpine Glasshouse',
          answer: { accepted: ['D'], keys: ['D'] },
          evidence: { lineId: 'm4', start: 44, end: 53 },
          traps: [
            {
              type: 'map_direction',
              lineId: 'm4',
              start: 39,
              end: 44,
              decoy: 'E',
              explanationVi:
                'Alpine Glasshouse nằm thẳng về phía Bắc đài phun nước, ngay sát kênh phía Bắc → vị trí D.',
            },
          ],
        },
        {
          qid: 'fp2_q03',
          number: 3,
          prompt: 'Herb Café',
          answer: { accepted: ['F'], keys: ['F'] },
          evidence: { lineId: 'm5', start: 60, end: 70 },
          traps: [
            {
              type: 'changed_plan',
              lineId: 'm5',
              start: 53,
              end: 60,
              decoy: 'G',
              explanationVi:
                'Quán cà phê đã chuyển khỏi vị trí cũ gần South Gate (G) sang góc xa phía Đông nhìn ra hồ (F).',
            },
          ],
        },
        {
          qid: 'fp2_q04',
          number: 4,
          prompt: 'Sculpture Lawn',
          answer: { accepted: ['A'], keys: ['A'] },
          evidence: { lineId: 'm6', start: 70, end: 82 },
          traps: [
            {
              type: 'map_direction',
              lineId: 'm6',
              start: 70,
              end: 76,
              decoy: 'C',
              explanationVi:
                'Bãi cỏ điêu khắc nằm ở góc Tây Bắc (north-west corner) phía trên kênh → vị trí A.',
            },
          ],
        },
        {
          qid: 'fp2_q05',
          number: 5,
          prompt: 'Education Pavilion',
          answer: { accepted: ['H'], keys: ['H'] },
          evidence: { lineId: 'm7', start: 89, end: 99 },
          traps: [
            {
              type: 'map_direction',
              lineId: 'm7',
              start: 82,
              end: 89,
              decoy: 'G',
              explanationVi:
                'Từ South Gate rẽ phải về phía Đông Nam, qua phòng vé là tòa nhà thứ hai → vị trí H.',
            },
          ],
        },
      ],
    },
    {
      groupId: 'p2_g2_mcq',
      type: 'mcq_single',
      instructions: 'Choose the correct letter, A, B or C.',
      previewSec: 15,
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
        { key: 'C', text: 'Option C' },
      ],
      questions: [
        {
          qid: 'fp2_q06',
          number: 6,
          prompt:
            'What is required to join a morning guided walking tour?\nA. Paying a £5 ticket fee at the gate\nB. Reserving a place online 24 hours in advance\nC. Joining a school group booking',
          answer: { accepted: ['B'], keys: ['B'] },
          evidence: { lineId: 'm8', start: 105, end: 116 },
          traps: [
            {
              type: 'negation_shift',
              lineId: 'm8',
              start: 99,
              end: 105,
              decoy: 'A',
              explanationVi:
                'Trước kia thu £5 ("used to charge"), nay hoàn toàn miễn phí nhưng phải đặt chỗ online trước 24 giờ (B).',
            },
          ],
        },
        {
          qid: 'fp2_q07',
          number: 7,
          prompt:
            'Which photography rule applies inside the glasshouses?\nA. All cameras are prohibited inside\nB. Tripods are not allowed for safety reasons\nC. Visitors must purchase a photo permit',
          answer: { accepted: ['B'], keys: ['B'] },
          evidence: { lineId: 'm9', start: 118, end: 126 },
          traps: [
            {
              type: 'synonym_paraphrase',
              lineId: 'm9',
              start: 124,
              end: 130,
              decoy: 'A',
              explanationVi:
                'Máy ảnh cầm tay vẫn được dùng bình thường; chỉ có chân máy (tripods) bị cấm bên trong nhà kính (B).',
            },
          ],
        },
        {
          qid: 'fp2_q08',
          number: 8,
          prompt:
            'What time does the afternoon pond-dipping workshop start today?\nA. 2:00 p.m.\nB. 3:00 p.m.\nC. 3:30 p.m.',
          answer: { accepted: ['C'], keys: ['C'] },
          evidence: { lineId: 'm10', start: 136, end: 144 },
          traps: [
            {
              type: 'changed_plan',
              lineId: 'm10',
              start: 130,
              end: 136,
              decoy: 'A',
              explanationVi:
                'Lịch ban đầu là 2:00 p.m. nhưng đã dời sang 3:30 p.m. vì đoàn học sinh (C).',
            },
          ],
        },
      ],
    },
    {
      groupId: 'p2_g3_multi',
      type: 'mcq_multi',
      instructions: 'Questions 9 and 10: Choose TWO letters, A–E. Which TWO facilities are free of charge this Sunday?',
      previewSec: 15,
      options: [
        { key: 'A', text: 'Bicycle hire' },
        { key: 'B', text: 'Audio guides at the front desk' },
        { key: 'C', text: 'Shuttle minibus' },
        { key: 'D', text: 'Private boat tour' },
        { key: 'E', text: 'Indoor children’s discovery trail' },
      ],
      questions: [
        {
          qid: 'fp2_q09',
          number: 9,
          prompt: 'Free Sunday facility 1 (Choose TWO from A–E)',
          answer: { accepted: ['B', 'E'], keys: ['B', 'E'] },
          evidence: { lineId: 'm11', start: 156, end: 168 },
          traps: [
            {
              type: 'option_mentioned_rejected',
              lineId: 'm11',
              start: 147,
              end: 156,
              decoy: 'A',
              explanationVi:
                'Thuê xe đạp (A) chỉ miễn phí ngày thường, xe buýt (C) có phí nhỏ; chỉ B và E miễn phí vào Chủ Nhật.',
            },
          ],
        },
        {
          qid: 'fp2_q10',
          number: 10,
          prompt: 'Free Sunday facility 2 (Choose TWO from A–E)',
          answer: { accepted: ['B', 'E'], keys: ['B', 'E'] },
          evidence: { lineId: 'm11', start: 156, end: 168 },
          traps: [
            {
              type: 'option_mentioned_rejected',
              lineId: 'm11',
              start: 151,
              end: 156,
              decoy: 'C',
              explanationVi:
                'Shuttle minibus (C) thu phí nhỏ; hai tiện ích miễn phí trọn ngày Chủ Nhật là B (audio guides) và E (discovery trail).',
            },
          ],
        },
      ],
    },
  ],
  provenance: {
    createdBy: 'human',
    source: 'fixture:l1-dev',
    license: 'own',
    qa: { schema: 'pass', verifier: 'pass', blindSolve: 'pass' },
  },
};

export const L1_FIXTURE_EPISODES: readonly ListeningEpisode[] = [
  L1_FIXTURE_P1,
  L1_FIXTURE_P2_MAP,
];
