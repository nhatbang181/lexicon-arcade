import type { Monster } from '../types/game.ts';

interface MonsterTemplate {
  name: string;
  title: string;
  avatar: string;
  quote: string;
  isBoss?: boolean;
}

const REALM_MONSTERS: Record<string, MonsterTemplate[]> = {
  education: [
    { name: "The Rote Golem", title: "Automaton of Mindless Repetition", avatar: "🗿", quote: "Knowledge without comprehension is mere clay!" },
    { name: "Pedagogy Spectre", title: "Spirit of Ancient Examinations", avatar: "👻", quote: "Your methodology will be tested to its limits." },
    { name: "Curriculum Drake", title: "Beast of Strict Syllabi", avatar: "🐉", quote: "Can your intellect span across the disciplines?" },
    { name: "Chancellor Examiel", title: "High Proctor of Band 9.0", avatar: "👑", quote: "None shall pass without flawless lexical cohesion!", isBoss: true }
  ],
  environment: [
    { name: "Carbon Chimera", title: "Beast of Greenhouse Vapors", avatar: "💨", quote: "The climate shifts; your doom draws near!" },
    { name: "Deforestation Goliath", title: "Crusher of Ancient Canopy", avatar: "🦣", quote: "Tear down the habitats! Scatter the wild!" },
    { name: "Toxic Mire Elemental", title: "Pollution given Flesh", avatar: "☣️", quote: "Every ecosystem shall dissolve into acidic slime." },
    { name: "Titan of Anthropocene", title: "Lord of Planetary Crisis", avatar: "🌋", quote: "Nature's vengeance will not be bargained with!", isBoss: true }
  ],
  technology: [
    { name: "Malware Revenant", title: "Ghost in the Machine", avatar: "👾", quote: "Your neural pathways are being overridden." },
    { name: "Quantum Automaton", title: "Calculated Destruction", avatar: "🤖", quote: "Probability of your survival approaches zero." },
    { name: "Algorithmic Wyrm", title: "Devourer of Raw Data", avatar: "🐍", quote: "Consuming your lexical cache bit by bit!" },
    { name: "Arch-Singularity Overlord", title: "Omniscient Cyber Sovereign", avatar: "🔮", quote: "I have calculated every possible vocabulary countermeasure!", isBoss: true }
  ],
  health: [
    { name: "Pathogen Stalker", title: "Harbinger of Contagion", avatar: "🦠", quote: "No immune system can withstand this virulence." },
    { name: "Sedentary Phantom", title: "Curse of Modern Lethargy", avatar: "💀", quote: "Rest your limbs... sink into chronic decline." },
    { name: "Malnutrition Behemoth", title: "Scourge of Vitality", avatar: "🧟", quote: "Empty calories make for hollow strength!" },
    { name: "Pandemic Leviathan", title: "Apex Vector of Disease", avatar: "🧬", quote: "Even the sharpest medical jargon cannot purge me!", isBoss: true }
  ],
  economy: [
    { name: "Inflation Hound", title: "Devourer of Purchasing Power", avatar: "🐕", quote: "Your assets evaporate into worthless paper!" },
    { name: "Monopoly Colossus", title: "Titan of Market Dominance", avatar: "🏦", quote: "Competition is extinguished beneath my tread." },
    { name: "Fiscal Spectre", title: "Ghost of Deficit and Debt", avatar: "⚖️", quote: "The ledger demands payment in blood and gold!" },
    { name: "Magnate of the Black Exchange", title: "Sovereign of Global Capital", avatar: "💎", quote: "Everything has a price, including your lexical survival!", isBoss: true }
  ],
  society: [
    { name: "Underworld Enforcer", title: "Shadow of Organized Crime", avatar: "🗡️", quote: "Laws are made to be shattered in the dark." },
    { name: "Corruption Shade", title: "Venom in the Judiciary", avatar: "🕯️", quote: "Justice is easily blinded by silver." },
    { name: "Anarchy Berserker", title: "Incarnation of Civil Discord", avatar: "💣", quote: "Burn down the institutions and watch society crumble!" },
    { name: "The Sovereign Outlaw", title: "Lord of the Lawless Reaches", avatar: "👺", quote: "The social contract is null and void before my blade!", isBoss: true }
  ],
  media: [
    { name: "Clickbait Banshee", title: "Wailing Voice of Misinformation", avatar: "📢", quote: "Shocking truths will paralyze your judgment!" },
    { name: "Sensationalist Wyvern", title: "Feeder on Mass Panic", avatar: "🦅", quote: "Truth is boring; hysteria sells!" },
    { name: "Propaganda Automaton", title: "Relentless Broadcast Machine", avatar: "📺", quote: "Repeat the message until it becomes absolute reality." },
    { name: "Arch-Media Mogul", title: "Controller of Public Narrative", avatar: "🎙️", quote: "I dictate what the world believes and speaks!", isBoss: true }
  ],
  transport: [
    { name: "Gridlock Behemoth", title: "Slumbering Roadblock of Steel", avatar: "🚛", quote: "Motion ceases. All momentum is snuffed out." },
    { name: "Locomotive Drake", title: "Iron Steamer of the Rails", avatar: "🚂", quote: "Full throttle into structural disaster!" },
    { name: "Transit Phantom", title: "Ghost of Derelict Commutes", avatar: "🚋", quote: "Stuck in perpetual delay for eternity." },
    { name: "Urban Overlord", title: "Master of Metropolitan Infrastructure", avatar: "🏗️", quote: "A billion commuters obey the rhythm of my labyrinth!", isBoss: true }
  ],
  science: [
    { name: "Hypothesis Shade", title: "Phantom of Unproven Theory", avatar: "🧪", quote: "Can empirical evidence dispel this illusion?" },
    { name: "Entropy Golem", title: "Law of Inevitable Decay", avatar: "☄️", quote: "All order dissolves into supreme chaos!" },
    { name: "Astral Horror", title: "Entity Beyond Observability", avatar: "🌌", quote: "The cosmos cares nothing for your human definitions." },
    { name: "Arch-Astronomer", title: "Keeper of Celestial Equations", avatar: "🔭", quote: "You stand before the grand mathematical architecture of reality!", isBoss: true }
  ],
  culture: [
    { name: "Homogenizer Drake", title: "Easer of Ancient Traditions", avatar: "🎭", quote: "All unique customs must be crushed into uniformity!" },
    { name: "Heritage Wraith", title: "Mourner of Lost Dialects", avatar: "🪕", quote: "Remember the ancestral tongues before they vanish." },
    { name: "Globalist Sphinx", title: "Riddle of Cultural Diffusion", avatar: "🗿", quote: "What crosses oceans yet changes everything it touches?" },
    { name: "The Pantheon Empress", title: "Matron of Civilizations", avatar: "🏛️", quote: "A thousand cultures converge in my eternal temple!", isBoss: true }
  ],
  awl: [
    { name: "Lexical Gargoyle", title: "Guardian of High Academia", avatar: "🗿", quote: "Only formal register will pierce this hide!" },
    { name: "Discourse Viper", title: "Twister of Complex Syntactic Clauses", avatar: "🐍", quote: "One dangling modifier and you are undone!" },
    { name: "The Lexicographer", title: "Arbiter of Band 9 Vocabulary", avatar: "📖", quote: "Show me precision, nuances, and scholarly mastery!", isBoss: true }
  ],
  mastery: [
    { name: "Collocation Sphinx", title: "Tester of Natural Phrasing", avatar: "🦁", quote: "Which verb embraces this noun? Hesitate and perish!" },
    { name: "Paraphrase Doppelganger", title: "Mirror of Equivalent Meanings", avatar: "🪞", quote: "Say the exact same thing in higher register!" },
    { name: "The Grand Examiner", title: "Final Gatekeeper of Band 9.0", avatar: "⚔️", quote: "Demonstrate spontaneous fluency or face eternal retake!", isBoss: true }
  ]
};

export function generateMonster(realmId: string, playerLevel: number, floorIndex: number = 1): Monster {
  const templates = REALM_MONSTERS[realmId] || REALM_MONSTERS.education;
  
  // Choose boss every 5th floor or if last template
  const isBossFight = floorIndex % 5 === 0;
  let template: MonsterTemplate;
  
  if (isBossFight) {
    template = templates.find(t => t.isBoss) || templates[templates.length - 1];
  } else {
    const regularPool = templates.filter(t => !t.isBoss);
    template = regularPool[Math.floor(Math.random() * regularPool.length)];
  }

  const baseHp = 70 + playerLevel * 25 + floorIndex * 15;
  const hpMultiplier = template.isBoss ? 2.2 : 1.0;
  const finalHp = Math.round(baseHp * hpMultiplier);

  const baseAttack = 12 + playerLevel * 3 + floorIndex * 2;
  const finalAttack = Math.round(baseAttack * (template.isBoss ? 1.5 : 1.0));

  const expReward = Math.round((40 + playerLevel * 10 + floorIndex * 8) * (template.isBoss ? 2.5 : 1.0));
  const goldReward = Math.round((25 + playerLevel * 6 + floorIndex * 5) * (template.isBoss ? 2.5 : 1.0));

  return {
    id: `mob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: template.name,
    title: template.title,
    realmId,
    avatar: template.avatar,
    hp: finalHp,
    maxHp: finalHp,
    attack: finalAttack,
    isBoss: !!template.isBoss,
    expReward,
    goldReward,
    quote: template.quote
  };
}
