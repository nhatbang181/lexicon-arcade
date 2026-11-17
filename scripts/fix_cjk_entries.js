import fs from 'fs';

const raw = fs.readFileSync('public/data/anki_vocab.json', 'utf8');
const data = JSON.parse(raw);

const cleanEntries = {
  embrace: {
    meaning: 'đón nhận, chấp nhận và ủng hộ nhiệt tình',
    definition: 'If you embrace a change, political system, or idea, you accept it and start supporting it or believing in it.',
    example: 'He eagerly embraces the new information age and its technological innovations.',
    pos: 'verb',
    collocations: ['eagerly embrace', 'embrace change'],
    synonyms: ['adopt', 'welcome', 'accept'],
  },
  incorporated: {
    meaning: 'sáp nhập, kết hợp, bao gồm nhiều yếu tố',
    definition: 'If one thing incorporates another thing, it includes it as part of a whole.',
    example: 'The new design will incorporate a number of major technological improvements.',
    pos: 'verb',
    collocations: ['incorporate features', 'fully incorporated'],
    synonyms: ['integrate', 'include', 'assimilate'],
  },
  rehabilitation: {
    meaning: 'sự phục hồi chức năng, phục hồi sức khỏe hoặc tái hòa nhập cộng đồng',
    definition: 'The process of helping someone to live a healthy, useful, or normal life again after being ill or in prison.',
    example: 'Considerable efforts have been made to support the rehabilitation of injured patients.',
    pos: 'noun',
    collocations: ['rehabilitation programme', 'physical rehabilitation'],
    synonyms: ['recovery', 'restoration', 'reintegration'],
  },
  brisk: {
    meaning: 'nhanh nhẹn, lẹ làng, sôi nổi',
    definition: 'Quick, energetic, and active.',
    example: 'Taking a brisk walk in the morning can often induce a feeling of well-being.',
    pos: 'adjective',
    collocations: ['brisk walk', 'brisk pace'],
    synonyms: ['quick', 'energetic', 'lively'],
  },
  spatial: {
    meaning: 'thuộc về không gian, định vị không gian',
    definition: 'Relating to the position, area, and size of things in space.',
    example: 'The researcher studied the spatial distribution of urban population in metropolitan areas.',
    pos: 'adjective',
    collocations: ['spatial distribution', 'spatial awareness'],
    synonyms: ['geographical', 'dimensional', 'locational'],
  },
  rampant: {
    meaning: 'lan tràn, hoành hành mất kiểm soát (tệ nạn, lạm phát, dịch bệnh)',
    definition: 'Existing or spreading everywhere in a way that is very difficult to control.',
    example: 'Rampant inflation and high unemployment have severely damaged the local economy.',
    pos: 'adjective',
    collocations: ['rampant inflation', 'rampant corruption'],
    synonyms: ['uncontrolled', 'widespread', 'unchecked'],
  },
  regime: {
    meaning: 'chế độ chính trị, chính thể cai trị',
    definition: 'A method or system of government, especially an authoritarian one.',
    example: 'The authoritarian regime imposed strict restrictions on freedom of the press.',
    pos: 'noun',
    collocations: ['authoritarian regime', 'regime change'],
    synonyms: ['government', 'administration', 'authority'],
  },
  daunting: {
    meaning: 'nản lòng, gây thoái chí, đầy thử thách khó khăn',
    definition: 'Making you feel slightly afraid or worried about dealing with something difficult.',
    example: 'They were faced with the daunting task of restoring the historic cathedral after the fire.',
    pos: 'adjective',
    collocations: ['daunting task', 'daunting prospect'],
    synonyms: ['intimidating', 'challenging', 'formidable'],
  },
  breakneck: {
    meaning: 'nhanh đến chóng mặt, tốc độ nguy hiểm',
    definition: 'Extremely fast and dangerous.',
    example: 'Modern technology has developed at breakneck speed over the past two decades.',
    pos: 'adjective',
    collocations: ['breakneck speed', 'breakneck pace'],
    synonyms: ['rapid', 'lightning-fast', 'headlong'],
  },
  integrity: {
    meaning: 'sự chính trực, liêm khiết, vẹn toàn đạo đức',
    definition: 'The quality of being honest and having strong moral principles.',
    example: 'He is widely respected throughout the academic community for his intellectual integrity.',
    pos: 'noun',
    collocations: ['high integrity', 'moral integrity'],
    synonyms: ['honesty', 'uprightness', 'probity'],
  },
  puree: {
    meaning: 'thức ăn nghiền nhuyễn, xúp đặc',
    definition: 'Food that has been crushed or blended until it forms a smooth, thick liquid.',
    example: 'Push the cooked vegetables through a sieve to make a smooth puree.',
    pos: 'noun',
    collocations: ['tomato puree', 'vegetable puree'],
    synonyms: ['paste', 'mash', 'coulis'],
  },
  plums: {
    meaning: 'quả mận',
    definition: 'A small, sweet fruit with smooth purple or red skin and a hard stone inside.',
    example: 'Ripe plums were harvested from the orchard during the late summer.',
    pos: 'noun',
    collocations: ['ripe plums', 'plum orchard'],
    synonyms: ['fruit', 'stone fruit'],
  },
  slender: {
    meaning: 'thon thả, mảnh mai, thanh thoát',
    definition: 'Attractively thin, graceful, or slight in build.',
    example: 'She had a slender figure and elegant posture that drew admiration.',
    pos: 'adjective',
    collocations: ['slender figure', 'slender build'],
    synonyms: ['slim', 'lean', 'graceful'],
  },
  insemination: {
    meaning: 'sự thụ tinh, đưa tinh trùng vào cơ quan sinh sản',
    definition: 'The introduction of semen into a female reproductive organ to cause pregnancy.',
    example: 'Artificial insemination is widely used in modern agriculture to breed livestock.',
    pos: 'noun',
    collocations: ['artificial insemination'],
    synonyms: ['fertilization', 'impregnation'],
  },
  strut: {
    meaning: 'bước đi vênh váo, dáng đi nghênh ngang kiêu hãnh',
    definition: 'To walk in a proud, confident way, with your chest out and head held high.',
    example: 'He struts around the conference room as if he owns the entire corporation.',
    pos: 'verb',
    collocations: ['strut confidently', 'strut around'],
    synonyms: ['stride', 'swagger', 'parade'],
  },
  contender: {
    meaning: 'đối thủ cạnh tranh, ứng cử viên tiềm năng',
    definition: 'A person or team with a chance of winning a competition or election.',
    example: 'Her coach believes she will be a strong contender for an Olympic medal this year.',
    pos: 'noun',
    collocations: ['strong contender', 'leading contender'],
    synonyms: ['competitor', 'candidate', 'challenger'],
  },
  electrocution: {
    meaning: 'sự điện giật gây tử vong hoặc chấn thương nghiêm trọng',
    definition: 'Death or severe injury caused by an electric shock.',
    example: 'Safety regulations were introduced to prevent accidental electrocution on construction sites.',
    pos: 'noun',
    collocations: ['accidental electrocution', 'risk of electrocution'],
    synonyms: ['electric shock', 'fatal shock'],
  },
  recurrence: {
    meaning: 'sự tái phát, sự xảy ra lặp lại',
    definition: 'An occasion when something unpleasant happens again.',
    example: 'Doctors monitored the patient closely to prevent any recurrence of the illness.',
    pos: 'noun',
    collocations: ['prevent a recurrence', 'frequent recurrence'],
    synonyms: ['repetition', 'relapse', 'reappearance'],
  },
};

let replacedCount = 0;
data.realms.forEach((realm) => {
  realm.words.forEach((w) => {
    const key = w.word.trim().toLowerCase();
    if (cleanEntries[key]) {
      const entry = cleanEntries[key];
      w.meaning = entry.meaning;
      w.definition = entry.definition;
      w.example = entry.example;
      w.pos = entry.pos;
      w.collocations = entry.collocations;
      w.synonyms = entry.synonyms;
      replacedCount++;
    }
  });
});

fs.writeFileSync('public/data/anki_vocab.json', JSON.stringify(data, null, 2), 'utf8');
console.log(`Replaced ${replacedCount} entries with pristine Vietnamese and English definitions!`);

// Double-check for any remaining CJK characters
const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u30ff]/g;
const recheck = fs.readFileSync('public/data/anki_vocab.json', 'utf8');
const remaining = recheck.match(cjkRegex) || [];
console.log(`Verification: Remaining CJK characters = ${remaining.length}`);
