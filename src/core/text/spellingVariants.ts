import { tokenizeWords } from './tokenize';

/**
 * Curated bidirectional British (UK) <-> American (US) spelling dictionary
 * covering common IELTS Academic Listening, Reading, and Writing vocabulary.
 * Format: [uk, us].
 */
export const UK_US_SPELLING_PAIRS: ReadonlyArray<readonly [string, string]> = [
  // -our / -or
  ['colour', 'color'],
  ['colours', 'colors'],
  ['coloured', 'colored'],
  ['colourful', 'colorful'],
  ['behaviour', 'behavior'],
  ['behaviours', 'behaviors'],
  ['behavioural', 'behavioral'],
  ['favour', 'favor'],
  ['favours', 'favors'],
  ['favourable', 'favorable'],
  ['favourite', 'favorite'],
  ['favourites', 'favorites'],
  ['flavour', 'flavor'],
  ['flavours', 'flavors'],
  ['harbour', 'harbor'],
  ['harbours', 'harbors'],
  ['honour', 'honor'],
  ['honours', 'honors'],
  ['honourable', 'honorable'],
  ['humour', 'humor'],
  ['labour', 'labor'],
  ['neighbour', 'neighbor'],
  ['neighbours', 'neighbors'],
  ['neighbourhood', 'neighborhood'],
  ['odour', 'odor'],
  ['rumour', 'rumor'],
  ['tumour', 'tumor'],
  ['vapour', 'vapor'],
  ['vigour', 'vigor'],

  // -re / -er
  ['centre', 'center'],
  ['centres', 'centers'],
  ['centred', 'centered'],
  ['fibre', 'fiber'],
  ['fibres', 'fibers'],
  ['litre', 'liter'],
  ['litres', 'liters'],
  ['metre', 'meter'],
  ['metres', 'meters'],
  ['kilometre', 'kilometer'],
  ['kilometres', 'kilometers'],
  ['centimetre', 'centimeter'],
  ['centimetres', 'centimeters'],
  ['millimetre', 'millimeter'],
  ['millimetres', 'millimeters'],
  ['theatre', 'theater'],
  ['theatres', 'theaters'],
  ['calibre', 'caliber'],
  ['lustre', 'luster'],
  ['sombre', 'somber'],
  ['spectre', 'specter'],

  // -ise / -ize & -yse / -yze
  ['analyse', 'analyze'],
  ['analysed', 'analyzed'],
  ['analyses', 'analyzes'],
  ['analysing', 'analyzing'],
  ['paralyse', 'paralyze'],
  ['paralysed', 'paralyzed'],
  ['catalyse', 'catalyze'],
  ['organise', 'organize'],
  ['organised', 'organized'],
  ['organising', 'organizing'],
  ['organisation', 'organization'],
  ['organisations', 'organizations'],
  ['organisational', 'organizational'],
  ['realise', 'realize'],
  ['realised', 'realized'],
  ['realising', 'realizing'],
  ['recognise', 'recognize'],
  ['recognised', 'recognized'],
  ['recognising', 'recognizing'],
  ['apologise', 'apologize'],
  ['apologised', 'apologized'],
  ['criticise', 'criticize'],
  ['criticised', 'criticized'],
  ['emphasise', 'emphasize'],
  ['emphasised', 'emphasized'],
  ['minimise', 'minimize'],
  ['minimised', 'minimized'],
  ['maximise', 'maximize'],
  ['maximised', 'maximized'],
  ['utilise', 'utilize'],
  ['utilised', 'utilized'],
  ['utilising', 'utilizing'],
  ['utilisation', 'utilization'],
  ['specialise', 'specialize'],
  ['specialised', 'specialized'],
  ['specialising', 'specializing'],
  ['prioritise', 'prioritize'],
  ['prioritised', 'prioritized'],
  ['modernise', 'modernize'],
  ['modernisation', 'modernization'],
  ['globalisation', 'globalization'],
  ['urbanisation', 'urbanization'],
  ['industrialisation', 'industrialization'],
  ['privatisation', 'privatization'],
  ['standardise', 'standardize'],
  ['subsidise', 'subsidize'],
  ['characterise', 'characterize'],
  ['summarised', 'summarized'],
  ['summarise', 'summarize'],
  ['customise', 'customize'],
  ['visualise', 'visualize'],
  ['finalise', 'finalize'],
  ['authorise', 'authorize'],
  ['authorised', 'authorized'],
  ['civilisation', 'civilization'],
  ['colonisation', 'colonization'],
  ['commercialise', 'commercialize'],
  ['democratise', 'democratize'],
  ['harmonise', 'harmonize'],
  ['hospitalise', 'hospitalize'],
  ['memorise', 'memorize'],
  ['neutralise', 'neutralize'],
  ['optimise', 'optimize'],
  ['polarise', 'polarize'],
  ['popularise', 'popularize'],
  ['publicise', 'publicize'],
  ['rationalise', 'rationalize'],
  ['revolutionise', 'revolutionize'],
  ['stabilise', 'stabilize'],
  ['symbolise', 'symbolize'],
  ['theorise', 'theorize'],

  // Double-L / Single-L
  ['travelling', 'traveling'],
  ['travelled', 'traveled'],
  ['traveller', 'traveler'],
  ['travellers', 'travelers'],
  ['cancelling', 'canceling'],
  ['cancelled', 'canceled'],
  ['modelling', 'modeling'],
  ['modelled', 'modeled'],
  ['labelling', 'labeling'],
  ['labelled', 'labeled'],
  ['counselling', 'counseling'],
  ['counselled', 'counseled'],
  ['counsellor', 'counselor'],
  ['counsellors', 'counselors'],
  ['jewellery', 'jewelry'],
  ['marvellous', 'marvelous'],
  ['signalling', 'signaling'],
  ['signalled', 'signaled'],
  ['fuelling', 'fueling'],
  ['fuelled', 'fueled'],
  ['levelling', 'leveling'],
  ['levelled', 'leveled'],
  ['enrol', 'enroll'],
  ['enrolment', 'enrollment'],
  ['fulfil', 'fulfill'],
  ['fulfilment', 'fulfillment'],
  ['skilful', 'skillful'],
  ['wilful', 'willful'],
  ['instil', 'instill'],
  ['woollen', 'woolen'],

  // -ogue / -og
  ['catalogue', 'catalog'],
  ['catalogues', 'catalogs'],
  ['dialogue', 'dialog'],
  ['dialogues', 'dialogs'],
  ['monologue', 'monolog'],
  ['analogue', 'analog'],
  ['prologue', 'prolog'],

  // -mme / -m
  ['programme', 'program'],
  ['programmes', 'programs'],
  ['kilogramme', 'kilogram'],
  ['kilogrammes', 'kilograms'],

  // -ce / -se
  ['defence', 'defense'],
  ['defences', 'defenses'],
  ['offence', 'offense'],
  ['offences', 'offenses'],
  ['licence', 'license'],
  ['licences', 'licenses'],
  ['practise', 'practice'],
  ['pretence', 'pretense'],

  // ae/oe & miscellaneous common IELTS words
  ['ageing', 'aging'],
  ['aluminium', 'aluminum'],
  ['aeroplane', 'airplane'],
  ['aeroplanes', 'airplanes'],
  ['anaemia', 'anemia'],
  ['anaesthetic', 'anesthetic'],
  ['archaeology', 'archeology'],
  ['archaeological', 'archeological'],
  ['artefact', 'artifact'],
  ['artefacts', 'artifacts'],
  ['cheque', 'check'],
  ['cheques', 'checks'],
  ['cosy', 'cozy'],
  ['draught', 'draft'],
  ['encyclopaedia', 'encyclopedia'],
  ['grey', 'gray'],
  ['judgement', 'judgment'],
  ['acknowledgement', 'acknowledgment'],
  ['kerb', 'curb'],
  ['manoeuvre', 'maneuver'],
  ['mould', 'mold'],
  ['paediatric', 'pediatric'],
  ['plough', 'plow'],
  ['pyjamas', 'pajamas'],
  ['sceptical', 'skeptical'],
  ['scepticism', 'skepticism'],
  ['smoulder', 'smolder'],
  ['storey', 'story'],
  ['storeys', 'stories'],
  ['sulphur', 'sulfur'],
  ['tyre', 'tire'],
  ['tyres', 'tires'],
];

const UK_TO_US = new Map<string, string>();
const US_TO_UK = new Map<string, string>();

for (const [uk, us] of UK_US_SPELLING_PAIRS) {
  UK_TO_US.set(uk, us);
  US_TO_UK.set(us, uk);
}

/**
 * Convert a single lowercase word to its canonical form (US form used as internal canonical key)
 * so UK and US variants always map to the same canonical token.
 */
export function canonicalizeSpelling(word: string): string {
  const w = word.toLowerCase();
  const mapped = UK_TO_US.get(w);
  if (mapped) return mapped;
  if (US_TO_UK.has(w)) return w;

  // Fallback suffix rules for productive IELTS academic verbs/nouns (-ise/-ize, -isation/-ization)
  if (w.length >= 7 && w.endsWith('isation')) {
    return `${w.slice(0, -7)}ization`;
  }
  if (w.length >= 8 && w.endsWith('isations')) {
    return `${w.slice(0, -8)}izations`;
  }
  return w;
}

/**
 * Return the counterpart spelling (UK -> US or US -> UK) if known, otherwise null.
 */
export function getSpellingVariant(word: string): string | null {
  const w = word.toLowerCase();
  return UK_TO_US.get(w) ?? US_TO_UK.get(w) ?? null;
}

/**
 * Check whether two words or phrases are equal up to UK/US spelling variants.
 */
export function areSpellingVariants(a: string, b: string): boolean {
  const toksA = tokenizeWords(a);
  const toksB = tokenizeWords(b);
  if (toksA.length !== toksB.length || toksA.length === 0) return false;
  for (let i = 0; i < toksA.length; i++) {
    if (canonicalizeSpelling(toksA[i]) !== canonicalizeSpelling(toksB[i])) {
      return false;
    }
  }
  return true;
}
