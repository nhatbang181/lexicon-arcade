export interface VocabWord {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  meaning: string;
  definition: string;
  collocations: string[];
  example: string;
  synonyms: string[];
  realmId: string;
}

export interface Realm {
  id: string;
  name: string;
  desc: string;
  theme: string;
  key: string;
  icon: string;
  accent: string;
  words: VocabWord[];
}

export interface VocabData {
  metadata: {
    source: string;
    totalWords: number;
    totalRealms: number;
  };
  realms: Realm[];
}
