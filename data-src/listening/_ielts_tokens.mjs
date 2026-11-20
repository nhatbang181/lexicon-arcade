/**
 * data-src/listening/_ielts_tokens.mjs
 * Pure-JS IELTS Listening token counter, word-limit checker, and expression canonicalizer
 * so plain `node` (`npm run validate:data`) runs with zero TS-loader dependency.
 * Mirrors src/core/scoring/listeningAnswer.ts rules.
 */

const ONES = {
  zero: 0, oh: 0, nought: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19,
};
const TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES = { hundred: 100, thousand: 1000, million: 1_000_000 };
const ORDINALS = {
  first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th',
  sixth: '6th', seventh: '7th', eighth: '8th', ninth: '9th', tenth: '10th',
  eleventh: '11th', twelfth: '12th', thirteenth: '13th', fourteenth: '14th',
  fifteenth: '15th', sixteenth: '16th', seventeenth: '17th', eighteenth: '18th',
  nineteenth: '19th', twentieth: '20th', 'twenty-first': '21st', 'twenty-second': '22nd',
  'twenty-third': '23rd', 'twenty-fourth': '24th', 'twenty-fifth': '25th',
  'twenty-sixth': '26th', 'twenty-seventh': '27th', 'twenty-eighth': '28th',
  'twenty-ninth': '29th', thirtieth: '30th', 'thirty-first': '31st',
};
const MONTHS = {
  jan: 'january', january: 'january', feb: 'february', february: 'february',
  mar: 'march', march: 'march', apr: 'april', april: 'april', may: 'may',
  jun: 'june', june: 'june', jul: 'july', july: 'july', aug: 'august', august: 'august',
  sep: 'september', sept: 'september', september: 'september',
  oct: 'october', october: 'october', nov: 'november', november: 'november',
  dec: 'december', december: 'december',
};

const UK_TO_US = new Map([
  ['colour', 'color'], ['colours', 'colors'], ['coloured', 'colored'], ['colourful', 'colorful'],
  ['behaviour', 'behavior'], ['behaviours', 'behaviors'], ['behavioural', 'behavioral'],
  ['favour', 'favor'], ['favours', 'favors'], ['favourable', 'favorable'], ['favourite', 'favorite'],
  ['flavour', 'flavor'], ['flavours', 'flavors'], ['harbour', 'harbor'], ['harbours', 'harbors'],
  ['honour', 'honor'], ['honours', 'honors'], ['humour', 'humor'], ['labour', 'labor'],
  ['neighbour', 'neighbor'], ['neighbours', 'neighbors'], ['neighbourhood', 'neighborhood'],
  ['odour', 'odor'], ['rumour', 'rumor'], ['tumour', 'tumor'], ['tumours', 'tumors'],
  ['vapour', 'vapor'], ['vigour', 'vigor'],
  ['centre', 'center'], ['centres', 'centers'], ['centred', 'centered'],
  ['fibre', 'fiber'], ['fibres', 'fibers'], ['litre', 'liter'], ['litres', 'liters'],
  ['metre', 'meter'], ['metres', 'meters'], ['kilometre', 'kilometer'], ['kilometres', 'kilometers'],
  ['centimetre', 'centimeter'], ['millimetre', 'millimeter'], ['theatre', 'theater'], ['theatres', 'theaters'],
  ['modelling', 'modeling'], ['modelled', 'modeled'], ['labelling', 'labeling'], ['labelled', 'labeled'],
  ['travelling', 'traveling'], ['travelled', 'traveled'], ['traveller', 'traveler'], ['travellers', 'travelers'],
  ['cancelling', 'canceling'], ['cancelled', 'canceled'], ['signalling', 'signaling'], ['signalled', 'signaled'],
  ['counselling', 'counseling'], ['counsellor', 'counselor'], ['jewellery', 'jewelry'],
  ['enrol', 'enroll'], ['enrolment', 'enrollment'], ['fulfil', 'fulfill'], ['woollen', 'woolen'],
  ['catalogue', 'catalog'], ['catalogues', 'catalogs'], ['dialogue', 'dialog'], ['dialogues', 'dialogs'],
  ['programme', 'program'], ['programmes', 'programs'], ['kilogramme', 'kilogram'],
  ['defence', 'defense'], ['defences', 'defenses'], ['offence', 'offense'], ['offences', 'offenses'],
  ['licence', 'license'], ['licences', 'licenses'], ['practise', 'practice'],
  ['ageing', 'aging'], ['aluminium', 'aluminum'], ['archaeology', 'archeology'], ['artefact', 'artifact'],
  ['artefacts', 'artifacts'], ['cheque', 'check'], ['draught', 'draft'], ['grey', 'gray'],
  ['judgement', 'judgment'], ['mould', 'mold'], ['plough', 'plow'], ['sceptical', 'skeptical'],
  ['storey', 'story'], ['storeys', 'stories'], ['sulphur', 'sulfur'], ['tyre', 'tire'], ['tyres', 'tires'],
  ['analyse', 'analyze'], ['analysed', 'analyzed'], ['organise', 'organize'], ['organised', 'organized'],
  ['organisation', 'organization'], ['organisations', 'organizations'],
  ['realise', 'realize'], ['recognise', 'recognize'], ['emphasise', 'emphasize'],
  ['minimise', 'minimize'], ['maximise', 'maximize'], ['utilise', 'utilize'], ['specialise', 'specialize'],
  ['stabilise', 'stabilize'], ['optimise', 'optimize'], ['finalise', 'finalize'], ['standardise', 'standardize'],
  ['urbanisation', 'urbanization'], ['globalisation', 'globalization'], ['industrialisation', 'industrialization'],
  ['fertiliser', 'fertilizer'], ['fertilisers', 'fertilizers'],
]);

export function canonicalizeSpelling(word) {
  const w = String(word || '').toLowerCase();
  if (UK_TO_US.has(w)) return UK_TO_US.get(w);
  if (w.length >= 7 && w.endsWith('isation')) return `${w.slice(0, -7)}ization`;
  if (w.length >= 8 && w.endsWith('isations')) return `${w.slice(0, -8)}izations`;
  return w;
}

const NUMERIC_TOKEN_RE =
  /^[£$€¥]?\d+(?:[.,:]\d+)*(?:st|nd|rd|th|%|km|m|cm|mm|kg|g|mg|l|ml|hrs?|mins?|secs?|am|pm|a\.m\.|p\.m\.)?$/i;

function isNumberWord(tok) {
  if (tok in ONES || tok in TENS || tok in SCALES || tok in ORDINALS) return true;
  if (tok.includes('-')) {
    const [a, b] = tok.split('-');
    if (a in TENS && (b in ONES || b in ORDINALS)) return true;
  }
  return false;
}

function parseNumberWords(tokens) {
  if (tokens.length === 0) return null;
  if (tokens.length === 1 && tokens[0] in ORDINALS) return ORDINALS[tokens[0]];
  if (tokens.length === 2 && tokens[0] in TENS && tokens[1] in ORDINALS) {
    const j = `${tokens[0]}-${tokens[1]}`;
    if (j in ORDINALS) return ORDINALS[j];
  }
  const flat = [];
  for (const t of tokens) {
    if (t === 'and') continue;
    if (t.includes('-')) {
      const [a, b] = t.split('-');
      if (a in TENS && b in ONES) {
        flat.push(a, b);
        continue;
      }
      return null;
    }
    flat.push(t);
  }
  if (!flat.length) return null;
  let total = 0;
  let current = 0;
  let ok = false;
  for (const w of flat) {
    if (w in ONES) { current += ONES[w]; ok = true; }
    else if (w in TENS) { current += TENS[w]; ok = true; }
    else if (w === 'hundred') { current = (current === 0 ? 1 : current) * 100; ok = true; }
    else if (w === 'thousand') { total += (current === 0 ? 1 : current) * 1000; current = 0; ok = true; }
    else if (w === 'million') { total += (current === 0 ? 1 : current) * 1_000_000; current = 0; ok = true; }
    else return null;
  }
  return ok ? String(total + current) : null;
}

export function normalizeWordLimit(wl) {
  if (!wl) return null;
  return {
    maxWords: wl.words,
    maxNumbers: wl.allowNumber ? 1 : 0,
    mode: wl.allowNumber ? 'and_or' : 'words_only',
  };
}

export function countIeltsTokens(input) {
  const cleaned = String(input || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/[,;!?"]/g, ' ')
    .replace(/\(([^)]*)\)/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return { wordCount: 0, numberCount: 0 };

  const rawTokens = cleaned
    .split(' ')
    .map((t) => (/^(?:a\.m\.|p\.m\.)$/i.test(t) ? t : t.replace(/^\.+|\.+$/g, '')))
    .filter(Boolean);

  let wordCount = 0;
  let numberCount = 0;
  let i = 0;
  while (i < rawTokens.length) {
    const tok = rawTokens[i];
    if (NUMERIC_TOKEN_RE.test(tok)) { numberCount++; i++; continue; }
    if (/^[£$€¥]$/.test(tok) && i + 1 < rawTokens.length && NUMERIC_TOKEN_RE.test(rawTokens[i + 1])) {
      numberCount++; i += 2; continue;
    }
    if (
      isNumberWord(tok) ||
      ((tok === 'a' || tok === 'an') && i + 1 < rawTokens.length && ['hundred', 'thousand', 'million'].includes(rawTokens[i + 1]))
    ) {
      let j = i;
      const seq = [];
      if (tok === 'a' || tok === 'an') { seq.push('one'); j++; }
      while (j < rawTokens.length) {
        const cur = rawTokens[j];
        if (isNumberWord(cur)) { seq.push(cur); j++; }
        else if (cur === 'and' && j + 1 < rawTokens.length && isNumberWord(rawTokens[j + 1])) { seq.push(cur); j++; }
        else break;
      }
      if (parseNumberWords(seq) !== null) { numberCount++; i = j; continue; }
    }
    wordCount++;
    i++;
  }
  return { wordCount, numberCount };
}

export function checkWordLimit(wordCount, numberCount, limit) {
  if (!limit) return true;
  if (wordCount === 0 && numberCount === 0) return false;
  if (limit.mode === 'words_only') return wordCount <= limit.maxWords && numberCount === 0;
  return wordCount <= limit.maxWords && numberCount <= limit.maxNumbers;
}

export function canonicalizeIeltsExpression(input) {
  let s = String(input || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/(\d),(\d{3})\b/g, '$1$2')
    .replace(/[,;!?"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\ba\.m\.?/g, 'am')
    .replace(/\bp\.m\.?/g, 'pm')
    .replace(/£\s*(\d+(?:\.\d+)?)/g, '$1 pounds')
    .replace(/\$\s*(\d+(?:\.\d+)?)/g, '$1 dollars')
    .replace(/€\s*(\d+(?:\.\d+)?)/g, '$1 euros')
    .replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent')
    .replace(/\bper\s+cent\b/g, 'percent')
    .replace(/(\d+(?:\.\d+)?)\s*(km|kilometres?|kilometers?)\b/g, '$1 km')
    .replace(/(\d+(?:\.\d+)?)\s*(cm|centimetres?|centimeters?)\b/g, '$1 cm')
    .replace(/(\d+(?:\.\d+)?)\s*(mm|millimetres?|millimeters?)\b/g, '$1 mm')
    .replace(/(\d+(?:\.\d+)?)\s*(m|metres?|meters?)\b/g, '$1 m')
    .replace(/(\d+(?:\.\d+)?)\s*(kg|kilograms?|kilogrammes?|kilos?)\b/g, '$1 kg')
    .replace(/(\d+(?:\.\d+)?)\s*(mins?|minutes?)\b/g, '$1 minutes')
    .replace(/(\d+(?:\.\d+)?)\s*(hrs?|hours?)\b/g, '$1 hours')
    .replace(/(\d+(?:\.\d+)?)\s*(pounds?|gbp)\b/g, '$1 pounds')
    .replace(/(\d+(?:\.\d+)?)\s*(dollars?|usd)\b/g, '$1 dollars')
    .replace(/(\d+(?:\.\d+)?)\s*(euros?|eur)\b/g, '$1 euros')
    .replace(/(\d{1,2}):(\d{2})\s*(am|pm)?\b/g, (_, h, m, mer) => `${Number(h)}:${m}${mer ? ` ${mer}` : ''}`)
    .replace(/(\d{1,2})\.(\d{2})\s*(am|pm)\b/g, (_, h, m, mer) => `${Number(h)}:${m} ${mer}`)
    .replace(/\b(\d+)\.00\b/g, '$1');

  const rawTokens = s.split(' ').map((t) => t.replace(/^\.+|\.+$/g, '')).filter(Boolean);
  const out = [];
  let i = 0;
  while (i < rawTokens.length) {
    const tok = rawTokens[i];
    if (
      isNumberWord(tok) ||
      ((tok === 'a' || tok === 'an') && i + 1 < rawTokens.length && ['hundred', 'thousand', 'million'].includes(rawTokens[i + 1]))
    ) {
      let j = i;
      const seq = [];
      if (tok === 'a' || tok === 'an') { seq.push('one'); j++; }
      while (j < rawTokens.length) {
        const cur = rawTokens[j];
        if (isNumberWord(cur)) { seq.push(cur); j++; }
        else if (cur === 'and' && j + 1 < rawTokens.length && isNumberWord(rawTokens[j + 1])) { seq.push(cur); j++; }
        else break;
      }
      const parsed = parseNumberWords(seq);
      if (parsed !== null) { out.push(parsed); i = j; continue; }
    }
    out.push(canonicalizeSpelling(tok));
    i++;
  }

  let canonical = out.join(' ');
  const d1 = canonical.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)$/);
  if (d1 && d1[2] in MONTHS) canonical = `${Number(d1[1])} ${MONTHS[d1[2]]}`;
  else {
    const d2 = canonical.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/);
    if (d2 && d2[1] in MONTHS) canonical = `${Number(d2[2])} ${MONTHS[d2[1]]}`;
  }

  canonical = canonical
    .replace(/\b(\d+(?:\.\d+)?)\s*(pounds?|gbp)\b/g, '$1 pounds')
    .replace(/\b(\d+(?:\.\d+)?)\s*(dollars?|usd)\b/g, '$1 dollars')
    .replace(/\b(\d+(?:\.\d+)?)\s*(euros?|eur)\b/g, '$1 euros')
    .replace(/\b(\d+(?:\.\d+)?)\s*per\s+cent\b/g, '$1 percent')
    .replace(/\b(\d+(?:\.\d+)?)\s*(km|kilometres?|kilometers?)\b/g, '$1 km')
    .replace(/\b(\d+(?:\.\d+)?)\s*(m|metres?|meters?)\b/g, '$1 m')
    .replace(/\b(\d+(?:\.\d+)?)\s*(kg|kilograms?|kilogrammes?|kilos?)\b/g, '$1 kg')
    .replace(/\b(\d+(?:\.\d+)?)\s*(mins?|minutes?)\b/g, '$1 minutes')
    .replace(/\b(\d+(?:\.\d+)?)\s*(hrs?|hours?)\b/g, '$1 hours');

  return { canonical };
}
