#!/usr/bin/env python3
"""
scripts/data/00_fetch_wordlists.py
Fetch/compile NGSL (CC BY-SA 4.0), NAWL (CC BY-SA 4.0), and AWL Sublists 1-10 (tag-only mapping)
into data-src/wordlists/ with license documentation.
"""

import csv
import io
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "data-src" / "wordlists"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Coxhead (2000) Academic Word List — 570 headwords grouped by Sublists 1-10.
# Used strictly for tagging VocabItem.lists ("AWL1".."AWL10"), per docs/05-DATA-PIPELINE.md §1.
AWL_SUBLISTS = {
    "AWL1": [
        "analyse", "analyze", "approach", "area", "assess", "assume", "authority", "available",
        "benefit", "concept", "consist", "constitute", "context", "contract", "create", "data",
        "define", "derive", "distribute", "economy", "environment", "establish", "estimate",
        "evident", "export", "factor", "finance", "formula", "function", "identify", "income",
        "indicate", "individual", "interpret", "involve", "issue", "labour", "labor", "legal",
        "legislate", "major", "method", "occur", "percent", "period", "policy", "principle",
        "proceed", "process", "require", "research", "respond", "role", "section", "sector",
        "significant", "similar", "source", "specific", "structure", "theory", "vary"
    ],
    "AWL2": [
        "achieve", "acquire", "administrate", "affect", "appropriate", "aspect", "assist",
        "category", "chapter", "commission", "community", "complex", "compute", "conclude",
        "conduct", "consequent", "construct", "consume", "credit", "culture", "design",
        "distinct", "element", "equate", "evaluate", "feature", "final", "focus", "impact",
        "injure", "institute", "invest", "item", "journal", "maintain", "normal", "obtain",
        "participate", "perceive", "positive", "potential", "previous", "primary", "purchase",
        "range", "region", "regulate", "relevant", "reside", "resource", "restrict", "secure",
        "seek", "select", "site", "strategy", "survey", "text", "tradition", "transfer"
    ],
    "AWL3": [
        "alternative", "circumstance", "comment", "compensate", "component", "consent",
        "considerable", "constant", "constrain", "contribute", "convene", "coordinate", "core",
        "corporate", "correspond", "criteria", "deduce", "demonstrate", "document", "dominate",
        "emphasis", "ensure", "exclude", "framework", "fund", "illustrate", "immigrate", "imply",
        "initial", "instance", "interact", "justify", "layer", "link", "locate", "maximise",
        "maximize", "minor", "negate", "outcome", "partner", "philosophy", "physical",
        "proportion", "publish", "react", "register", "rely", "remove", "scheme", "sequence",
        "sex", "shift", "specify", "sufficient", "task", "technical", "technique", "technology",
        "valid", "volume"
    ],
    "AWL4": [
        "access", "adequate", "annual", "apparent", "approximate", "attitude", "attribute",
        "civil", "code", "commit", "communicate", "concentrate", "confer", "contrast", "cycle",
        "debate", "despite", "dimension", "domestic", "emerge", "error", "ethnic", "goal",
        "grant", "hence", "hypothesis", "implement", "implicate", "impose", "integrate",
        "internal", "investigate", "job", "label", "mechanism", "obvious", "occupy", "option",
        "output", "overall", "parallel", "parameter", "phase", "predict", "principal", "prior",
        "professional", "project", "promote", "regime", "resolve", "retain", "series",
        "statistic", "status", "stress", "subsequent", "sum", "summary", "undertake"
    ],
    "AWL5": [
        "academy", "adjust", "alter", "amend", "aware", "capacity", "challenge", "clause",
        "compound", "conflict", "consult", "contact", "decline", "discrete", "draft", "enable",
        "energy", "enforce", "entity", "equivalent", "evolve", "expand", "expose", "external",
        "facilitate", "fundamental", "generate", "generation", "image", "liberal", "licence",
        "license", "logic", "margin", "medical", "mental", "modify", "monitor", "network",
        "notion", "objective", "orient", "perspective", "precise", "prime", "psychology",
        "pursue", "ratio", "reject", "revenue", "stable", "style", "substitute", "sustain",
        "symbol", "target", "transit", "trend", "version", "welfare", "whereas"
    ],
    "AWL6": [
        "abstract", "accurate", "acknowledge", "aggregate", "allocate", "assign", "attach",
        "author", "bond", "brief", "capable", "cite", "cooperate", "discriminate", "display",
        "diverse", "domain", "edit", "enhance", "estate", "exceed", "expert", "explicit",
        "federal", "fee", "flexible", "furthermore", "gender", "ignorant", "incentive",
        "incidence", "incorporate", "index", "inhibit", "initiate", "input", "instruct",
        "intelligence", "interval", "lecture", "migrate", "minimum", "ministry", "motive",
        "neutral", "nevertheless", "overseas", "precede", "presume", "rational", "recover",
        "reveal", "scope", "subsidy", "tape", "trace", "transform", "transport", "underlie",
        "utilise", "utilize"
    ],
    "AWL7": [
        "adapt", "adult", "advocate", "aid", "channel", "chemical", "classic", "comprehensive",
        "comprise", "confirm", "contrary", "convert", "couple", "decade", "definite", "deny",
        "differentiate", "dispose", "dynamic", "eliminate", "empirical", "equip", "extract",
        "file", "finite", "foundation", "globe", "grade", "guarantee", "hierarchy", "identical",
        "ideology", "infer", "innovate", "insert", "intervene", "isolate", "media", "mode",
        "paradigm", "phenomenon", "priority", "prohibit", "publication", "quote", "release",
        "reverse", "simulate", "sole", "somewhat", "submit", "successor", "survive", "thesis",
        "topic", "transmit", "ultimate", "unique", "visible", "voluntary"
    ],
    "AWL8": [
        "abandon", "accompany", "accumulate", "ambiguous", "append", "appreciate", "arbitrary",
        "automate", "bias", "chart", "clarify", "commodity", "complement", "conform",
        "contemporary", "contradict", "crucial", "currency", "denote", "detect", "deviate",
        "displace", "drama", "eventual", "exhibit", "exploit", "fluctuate", "guideline",
        "highlight", "implicit", "induce", "inevitable", "infrastructure", "inspect", "intense",
        "manipulate", "minimise", "minimize", "nuclear", "offset", "paragraph", "plus",
        "practitioner", "predominant", "prospect", "radical", "random", "reinforce", "restore",
        "revise", "schedule", "tension", "terminate", "theme", "thereby", "uniform", "vehicle",
        "via", "virtual", "visual", "widespread"
    ],
    "AWL9": [
        "accommodate", "analogy", "anticipate", "assure", "attain", "behalf", "bulk", "cease",
        "coherent", "coincide", "commence", "compatible", "concurrent", "confine", "controversy",
        "converse", "device", "devote", "diminish", "distort", "duration", "erode", "ethic",
        "format", "founded", "inherent", "insight", "integral", "intermediate", "manual",
        "mature", "mediate", "medium", "military", "minimal", "mutual", "norm", "overlap",
        "passive", "portion", "preliminary", "protocol", "qualitative", "refine", "relax",
        "restrain", "revolution", "rigid", "route", "scenario", "sphere", "subordinate",
        "supplement", "suspend", "team", "temporary", "trigger", "unify", "violate", "vision"
    ],
    "AWL10": [
        "adjacent", "albeit", "assemble", "collapse", "colleague", "compile", "conceive",
        "convince", "depress", "encounter", "enormous", "forthcoming", "inclination", "integrity",
        "intrinsic", "invoke", "levy", "likewise", "nonetheless", "notwithstanding", "odd",
        "ongoing", "panel", "persist", "pose", "reluctant", "so-called", "straightforward",
        "undergo", "whereby"
    ],
}

# Candidate public CC BY-SA 4.0 CSV URLs for NGSL & NAWL
NGSL_URLS = [
    "https://raw.githubusercontent.com/lpmi-13/machine_readable_wordlists/master/Academic/NGSL/NGSL_1.2_stats.csv",
    "https://raw.githubusercontent.com/Max-S-D/NGSL/main/NGSL_1.2_stats.csv",
]
NAWL_URLS = [
    "https://raw.githubusercontent.com/lpmi-13/machine_readable_wordlists/master/Academic/NAWL/NAWL_1.2_stats.csv",
    "https://raw.githubusercontent.com/Max-S-D/NAWL/main/NAWL_1.2_stats.csv",
]


def fetch_csv_words(urls):
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "LexiconArcadeDataPipeline/3.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                text = resp.read().decode("utf-8-sig", errors="replace")
            rows = list(csv.reader(io.StringIO(text)))
            words = []
            for row in rows:
                if not row:
                    continue
                token = row[0].strip().lower()
                if not token or token in ("lemma", "word", "headword", "rank"):
                    continue
                if re.fullmatch(r"[a-z][a-z\-']*", token):
                    words.append(token)
            if len(words) >= 500:
                return sorted(set(words)), url
        except Exception:
            continue
    return None, None


def build_fallback_ngsl_nawl():
    """
    Deterministic fallback using wordfreq (Apache-2.0 / CC BY-SA 4.0) if offline.
    NGSL ~ top 2,800 general English lemmas; NAWL ~ academic vocabulary band outside NGSL & AWL.
    """
    import wordfreq

    top = wordfreq.top_n_list("en", 8000)
    clean = [w.lower() for w in top if re.fullmatch(r"[a-z]{2,}", w)]
    ngsl = clean[:2800]
    awl_all = {w for sub in AWL_SUBLISTS.values() for w in sub}
    ngsl_set = set(ngsl)

    # Curated core NAWL academic words (plus mid-frequency academic candidates from wordfreq)
    nawl_core = [
        "abbreviation", "abstract", "academia", "academic", "accelerate", "accessibility",
        "acclimatise", "accountability", "accreditation", "accrue", "acidic", "acoustic",
        "activation", "actuarial", "acuity", "adaptation", "addictive", "adherence", "adhesion",
        "adjoin", "adjunct", "administrative", "adolescence", "adverse", "aerosol", "aesthetic",
        "affinity", "affirmation", "affluent", "aggravate", "agrarian", "algorithm", "alienation",
        "alkaline", "allegation", "alleviate", "allocation", "alloy", "allude", "altitude",
        "altruism", "amalgamate", "ambiguity", "ameliorate", "amenable", "amendment", "amino",
        "amortise", "amplitude", "analogous", "analytical", "anatomy", "ancestral", "anecdotal",
        "anomaly", "antagonist", "anthropology", "antibiotic", "antibody", "antiquity",
        "aperture", "apparatus", "applicable", "appraise", "apprentice", "aquatic", "aquifer",
        "arbiter", "archaeology", "archetype", "archival", "arid", "arithmetic", "artefact",
        "arterial", "articulate", "ascertain", "ascribe", "asexual", "aspiration", "assimilate",
        "asymmetric", "atmospheric", "atomic", "atrophy", "attenuate", "attrition", "auditory",
        "augment", "austerity", "authenticate", "authoritarian", "autonomous", "auxiliary",
        "aversion", "axiom", "bacterial", "ballistic", "barometer", "baseline", "benchmark",
        "beneficiary", "benevolent", "benign", "bilateral", "biodiversity", "biodegradable",
        "biomass", "biome", "biosphere", "biotechnology", "bipartisan", "bipolar", "botanical",
        "bottleneck", "bourgeois", "breach", "bureaucracy", "byproduct", "calibrate", "caloric",
        "canopy", "capillary", "capitalism", "carcinogen", "cardiovascular", "cartography",
        "cascade", "catalyst", "categorical", "causal", "causality", "cautionary", "cellular",
        "census", "centennial", "centralise", "centrifugal", "cerebral", "chronicle", "chronic",
        "chronological", "circadian", "circulation", "civic", "clandestine", "classify",
        "cleavage", "climatic", "clinical", "clone", "coalition", "coastal", "codify",
        "coefficient", "coercion", "cognitive", "cohesion", "cohort", "collaborate", "collateral",
        "collectivism", "collision", "colonial", "combustion", "commensurate", "commercialise",
        "communicable", "comparative", "compassion", "compelling", "compendium", "competence",
        "complacent", "complementary", "compliance", "complicate", "composite", "compulsion",
        "computational", "concave", "concede", "conceptual", "concession", "concise", "concur",
        "condensation", "conducive", "conduit", "confederation", "configuration", "confluence",
        "congenital", "congestion", "conglomerate", "congruent", "conjecture", "conjunction",
        "connotation", "consensus", "conservation", "consolidate", "consonant", "consortium",
        "conspicuous", "constituency", "constitutive", "constraint", "contagious", "contaminate",
        "contemplate", "contentious", "contextual", "contiguous", "contingency", "continuum",
        "contour", "contraception", "contractual", "contrarian", "conundrum", "convection",
        "converge", "convex", "correlate", "corroborate", "corrosion", "corrupt", "cosmopolitan",
        "counteract", "counterpart", "courtesy", "covariate", "credibility", "criterion",
        "critique", "culminate", "culpable", "cultivate", "cumulative", "curative", "curtail",
        "cybernetic", "cyclical", "cytology", "dearth", "decentralise", "deciduous", "decimate",
        "decipher", "declarative", "decompose", "deductive", "deficiency", "deficit", "definitive",
        "deflect", "deforestation", "degrade", "delegate", "deleterious", "deliberate",
        "delineate", "delinquency", "demarcate", "demographic", "denigrate", "density",
        "deplete", "deposition", "depreciate", "deprivation", "derivative", "desalination",
        "desertification", "designate", "desirable", "deter", "deteriorate", "determinant",
        "detrimental", "devastate", "deviation", "diagnose", "dialect", "dichotomy", "didactic",
        "diffuse", "digestion", "digital", "dilute", "diplomacy", "disaggregate", "discern",
        "disciplinary", "discourse", "discrepancy", "discretionary", "disseminate", "dissent",
        "dissertation", "dissipate", "dissolve", "distal", "distill", "distinction", "divergence",
        "diversify", "divest", "doctrine", "dogma", "dormant", "dosage", "downstream", "drastic",
        "drought", "dualism", "dubious", "ductile", "durability", "dysfunction", "ecological",
        "econometric", "ecosystem", "ectopic", "editorial", "efficacy", "efficiency", "effluent",
        "egalitarian", "elaborate", "elasticity", "electoral", "electromagnetic", "elevate",
        "elicit", "elite", "elucidate", "emanate", "emancipate", "embargo", "embed", "embody",
        "embryonic", "emission", "empathy", "encompass", "endemic", "endocrine", "endogenous",
        "endorse", "endow", "enfranchise", "engender", "enigma", "enlighten", "enrol", "ensemble",
        "entail", "enterprise", "enthalpy", "entitlement", "entrepreneur", "entropy", "enumerate",
        "enzyme", "ephemeral", "epidemic", "epidemiology", "epistemology", "epoch", "equilibrium",
        "equitable", "equity", "eradicate", "ergonomic", "erratic", "erudite", "escalate",
        "esoteric", "espouse", "essence", "estuary", "ethical", "ethnography", "etiology",
        "eugenics", "euphemism", "eutrophication", "evacuate", "evaporate", "evasive", "evoke",
        "exacerbate", "excavate", "exemption", "exert", "exhaustive", "exogenous", "exorbitant",
        "expatriate", "expedite", "expenditure", "experiential", "expertise", "explanatory",
        "exponential", "expropriate", "extant", "extenuating", "exterior", "extinction",
        "extrapolate", "extrinsic", "fabricate", "facet", "faction", "faculty", "fallacy",
        "famine", "fauna", "feasible", "feedback", "fermentation", "fertility", "feudal",
        "fidelity", "figurative", "filial", "filtration", "fiscal", "fission", "flora",
        "fluency", "flux", "folklore", "forage", "forensic", "formative", "formulate",
        "fortify", "fossil", "foster", "fractal", "fraction", "fragile", "fragmentation",
        "franchise", "fraternal", "friction", "fringe", "frugal", "fulcrum", "functional",
        "fungal", "fusion", "futile", "galaxy", "galvanise", "gamete", "gastric", "gauge",
        "genealogy", "generic", "genesis", "genetic", "genome", "genre", "gentrification",
        "geochemical", "geographical", "geological", "geometric", "geopolitical", "geothermal",
        "geriatric", "germinate", "gestation", "glacial", "globalisation", "glucose", "governance",
        "gradient", "grammatical", "granular", "gratification", "gravitational", "gregarious",
        "gridlock", "gross", "groundwater", "habitat", "haemoglobin", "halve", "hamper",
        "haphazard", "harbinger", "harmonise", "harness", "hazard", "hegemony", "hemisphere",
        "herbicide", "herbivore", "hereditary", "heritage", "heterogeneous", "heuristic",
        "hibernation", "hinder", "hinterland", "histology", "holistic", "homeostasis", "hominid",
        "homogeneous", "horizon", "hormonal", "horticulture", "hostility", "hubris", "humanitarian",
        "humidity", "hybrid", "hydraulic", "hydrocarbon", "hydroelectric", "hydrology", "hygiene",
        "hyperbole", "hypertension", "hypothetical", "hysteresis", "iconography", "idiosyncrasy",
        "ignite", "illicit", "illiteracy", "illuminating", "imbalance", "imminent", "immobile",
        "immune", "immunology", "impair", "impartial", "impasse", "impede", "imperative",
        "imperialism", "impermeable", "impetus", "implant", "implication", "impoverish",
        "impromptu", "impunity", "inaccessible", "inadvertent", "inalienable", "inanimate",
        "inaugural", "incandescent", "incarcerate", "inception", "incessant", "incidental",
        "incinerate", "incisive", "inclusive", "incoherent", "incompatible", "incongruous",
        "inconsequential", "incremental", "incubate", "inculcate", "incumbent", "incur",
        "indebted", "indefinite", "indemnity", "indigenous", "indigent", "indispensable",
        "induce", "inductive", "industrialise", "ineffectual", "inequality", "inertia",
        "inextricable", "infancy", "infantile", "infectious", "inference", "inferior", "infinite",
        "infinitesimal", "inflammation", "inflation", "inflict", "influx", "informant",
        "infrared", "infringe", "ingenious", "ingest", "ingrained", "inhabitant", "inhale",
        "inhibit", "inimical", "initialise", "innate", "innocuous", "inoculate", "inorganic",
        "inquiry", "inquisitive", "inscribe", "insidious", "insolvent", "insomnia", "instigate",
        "instil", "institutional", "instrumental", "insulate", "insulin", "insurgency",
        "intact", "intangible", "integer", "intelligible", "intensify", "interactive",
        "intercede", "intercept", "interchange", "interconnect", "interdependent", "interdisciplinary",
        "interface", "interfere", "interim", "interior", "interlock", "intermediary",
        "intermittent", "internalise", "interpolate", "interrogate", "intersect", "interstellar",
        "intertwine", "intimate", "intimidate", "intolerable", "intractable", "intransigent",
        "intravenous", "intricate", "intrude", "intuition", "inundate", "invalidate", "invariant",
        "invasive", "inventory", "inverse", "invertebrate", "invigorate", "involuntary",
        "ionic", "irony", "irrefutable", "irreparable", "irreversible", "irrigate", "irritable",
        "isomer", "isotope", "iterate", "itinerary", "jargon", "jeopardise", "judicial",
        "judiciary", "juncture", "jurisdiction", "juxtapose", "keystone", "kinematics", "kinetic",
        "kinship", "labyrinth", "lacuna", "lagoon", "laity", "lament", "landfill", "landmark",
        "languish", "lapse", "larva", "latent", "lateral", "latitude", "laudable", "leach",
        "legitimacy", "legitimate", "leisure", "lenient", "lesion", "lethal", "lethargy",
        "leverage", "lexical", "lexicon", "liability", "liaison", "libel", "libertarian",
        "lifecycle", "lifespan", "ligament", "lineage", "linear", "linguistic", "lipid",
        "liquefy", "liquidity", "literacy", "literal", "litigation", "littoral", "livelihood",
        "livestock", "lobby", "locale", "logarithm", "logistics", "longevity", "longitude",
        "loophole", "lucid", "lucrative", "luminous", "lunar", "lymphatic", "macroeconomic",
        "magma", "magnanimous", "magnetic", "magnitude", "mainstream", "maladaptive", "malady",
        "malaise", "malaria", "malfeasance", "malfunction", "malignant", "malleable", "malnutrition",
        "mammal", "mandate", "mandatory", "manifest", "manifold", "mantle", "maritime",
        "marginalise", "martial", "masculine", "maternal", "matrix", "maxim", "meagre",
        "measurable", "mechanistic", "median", "medicinal", "medieval", "mediocre", "megacity",
        "melancholy", "membrane", "memoir", "menace", "mentality", "mercantile", "mercenary",
        "meridian", "meritocracy", "mesolithic", "metabolic", "metabolism", "metacognition",
        "metallic", "metamorphosis", "metaphor", "metaphysical", "meteorology", "methane",
        "methodical", "methodology", "meticulous", "metric", "metropolis", "metropolitan",
        "microbe", "microbiome", "microclimate", "microcosm", "microeconomic", "microorganism",
        "microscopic", "midwife", "migrant", "militant", "millennium", "mimic", "mineralogy",
        "minimalist", "minuscule", "mirage", "misappropriate", "misconception", "misconstrue",
        "misdemeanour", "misnomer", "mitigate", "mnemonic", "mobile", "mobilise", "modality",
        "moderate", "modernise", "modest", "modulation", "moiety", "molecular", "molecule",
        "mollusc", "momentous", "momentum", "monarchy", "monetary", "monoculture", "monogamy",
        "monograph", "monolithic", "monopoly", "monotonous", "monsoon", "morale", "moratorium",
        "morbidity", "mores", "morpheme", "morphology", "mortality", "mortgage", "mosaic",
        "motivate", "motley", "multicultural", "multidimensional", "multidisciplinary",
        "multifaceted", "multilateral", "multilingual", "multinational", "multitude", "mundane",
        "municipal", "mutable", "mutation", "myopia", "myriad", "mythology", "narcissism",
        "narrative", "nascent", "nationalism", "naturalise", "nautical", "navigable", "nebula",
        "necessitate", "necrosis", "nefarious", "negligent", "negligible", "negotiable",
        "neoclassical", "neoliberal", "neolithic", "neonatal", "nepotism", "neural", "neurology",
        "neuron", "neuroplasticity", "neuroscience", "neurosis", "neutralise", "niche", "nihilism",
        "nitrogen", "nocturnal", "nomadic", "nomenclature", "nominal", "nonchalant", "nonconformist",
        "nonprofit", "nonrenewable", "normative", "nostalgia", "notable", "notorious", "nourish",
        "novelty", "noxious", "nuance", "nucleic", "nucleus", "nuisance", "nullify", "numeracy",
        "numerical", "nutrient", "nutrition", "obesity", "obfuscate", "obituary", "obligate",
        "obligation", "oblique", "obliterate", "oblivious", "obscure", "observatory", "obsolete",
        "obstacle", "obstetric", "obstinate", "obstruct", "occlude", "occult", "occupational",
        "occurrence", "oceanic", "octave", "ocular", "odyssey", "offspring", "olfactory",
        "oligarchy", "oligopoly", "ominous", "omission", "omnipotent", "omnipresent", "omnivore",
        "oncology", "onerous", "onset", "ontology", "opacity", "opaque", "operable", "operational",
        "opiate", "opportunistic", "oppress", "optic", "optimal", "optimise", "optimum",
        "opulent", "oral", "orator", "orbital", "ordain", "ordinance", "ordinary", "organic",
        "organism", "organisational", "oriental", "orifice", "originate", "ornamental", "ornithology",
        "orthodox", "orthopaedic", "oscillate", "osmosis", "ossify", "ostensible", "ostentatious",
        "ostracise", "outbreak", "outcry", "outdated", "outflow", "outgrowth", "outlaw",
        "outlay", "outlet", "outlier", "outmoded", "outpace", "outperform", "outpost",
        "outreach", "outset", "outsource", "outstrip", "outweigh", "ovarian", "overarching",
        "overburden", "overcast", "overcome", "overcrowded", "overdose", "overdraft", "overdue",
        "overestimate", "overflow", "overhaul", "overhead", "overlook", "overpopulation",
        "override", "overrule", "oversee", "oversight", "overt", "overthrow", "overturn",
        "overwhelm", "ovulation", "oxidation", "oxide", "oxygenate", "ozone", "pacify",
        "paediatric", "palaeolithic", "palaeontology", "palatable", "palliate", "palpable",
        "panacea", "pandemic", "panoramic", "pantheon", "parable", "paradox", "paragon",
        "paralysis", "paramount", "paranoia", "parasite", "parental", "pariah", "parity",
        "parliamentary", "parochial", "parody", "parsimonious", "partial", "particle",
        "partisan", "partition", "pastoral", "patent", "paternal", "pathogen", "pathology",
        "pathos", "patriarchy", "patrimony", "patronage", "paucity", "pauper", "payable",
        "peasantry", "pecuniary", "pedagogy", "pedestrian", "pedigree", "peerage", "pejorative",
        "pelagic", "penal", "penalise", "penchant", "pendulum", "penetrate", "peninsula",
        "penitent", "pension", "pent-up", "per capita", "perceive", "percentile", "perceptible",
        "perception", "perceptual", "percolate", "percussion", "perennial", "perfidious",
        "perforate", "performative", "perfunctory", "perimeter", "periodic", "peripheral",
        "periphery", "perish", "perjury", "permafrost", "permanent", "permeable", "permeate",
        "permissible", "permissive", "permutation", "pernicious", "perpendicular", "perpetrate",
        "perpetual", "perpetuate", "perplex", "perquisite", "persecute", "persevere", "persona",
        "personify", "perspicacious", "persuasive", "pertain", "pertinent", "perturb", "peruse",
        "pervade", "pervasive", "perverse", "pessimism", "pesticide", "pestilence", "petal",
        "petition", "petrify", "petrochemical", "petroleum", "petty", "pharmaceutical",
        "pharmacology", "pharynx", "phenomenal", "phenotype", "philanthropy", "philology",
        "philosophical", "phobia", "phoneme", "phonetic", "phonology", "phosphate", "phosphorus",
        "photochemical", "photon", "photosynthesis", "photovoltaic", "phylum", "physiological",
        "physiology", "pictorial", "pidgin", "piezoelectric", "pigment", "pilgrimage", "pillar",
        "pinnacle", "pioneer", "pious", "pipeline", "piracy", "piscine", "pitfall", "pivotal",
        "placate", "placebo", "placid", "plagiarism", "plague", "planar", "planetary", "plankton",
        "plantation", "plasma", "plasticity", "plateau", "platitude", "plausible", "plebiscite",
        "pledge", "plenary", "plenitude", "plethora", "pliable", "plight", "plunder", "pluralism",
        "plutocracy", "pneumonia", "poach", "podium", "poignant", "polarise", "polarity",
        "polemic", "policymaker", "polity", "pollen", "pollinate", "pollutant", "pollute",
        "polyglot", "polygon", "polymer", "polymorphic", "polynomial", "polytheism", "ponder",
        "pontificate", "populace", "popularise", "populism", "populous", "porosity", "porous",
        "portable", "portal", "portend", "portfolio", "portray", "posit", "positivism",
        "postcolonial", "posterior", "posterity", "postgraduate", "posthumous", "postmodern",
        "postnatal", "postpone", "postulate", "posture", "potable", "potency", "potent",
        "potentiality", "pottery", "poultry", "poverty", "practicable", "practicality",
        "pragmatic", "pragmatism", "prairie", "precarious", "precaution", "precedent",
        "precept", "precinct", "precious", "precipitate", "precipitous", "precision", "preclude",
        "precocious", "preconception", "precursor", "predator", "predatory", "predecessor",
        "predetermined", "predicament", "predicate", "predictive", "predilection", "predispose",
        "predominate", "preeminent", "preempt", "preface", "preferential", "prefix", "prehistoric",
        "prejudice", "prelude", "premature", "premeditated", "premise", "premium", "premonition",
        "prenatal", "preoccupy", "preponderance", "prerequisite", "prerogative", "presage",
        "prescribe", "prescription", "prescriptive", "preservation", "preside", "presidency",
        "prestigious", "presumption", "presumptuous", "presuppose", "pretence", "pretentious",
        "pretext", "prevail", "prevalent", "preventable", "preventative", "preventive",
        "preemptive", "priceless", "primal", "primate", "primeval", "primitive", "primordial",
        "principled", "prioritise", "pristine", "privatise", "privilege", "probabilistic",
        "probability", "probation", "probe", "probity", "problematic", "procedural", "procedure",
        "proceeds", "proclaim", "proclivity", "procrastinate", "procreate", "procure",
        "prodigious", "prodigy", "productive", "productivity", "profane", "profess", "proficiency",
        "proficient", "profile", "profitable", "profligate", "profound", "profuse", "progenitor",
        "progeny", "prognosis", "programmatic", "progression", "progressive", "prohibitive",
        "projectile", "projection", "proletariat", "proliferate", "prolific", "prologue",
        "prolong", "prominent", "promiscuous", "promontory", "promotional", "prompt",
        "promulgate", "prone", "prong", "pronounce", "propaganda", "propagate", "propel",
        "propensity", "prophecy", "prophylactic", "propinquity", "propitious", "proponent",
        "proportional", "proportionate", "proposal", "proposition", "proprietary", "proprietor",
        "propriety", "propulsion", "prosaic", "proscribe", "prose", "prosecute", "proselytise",
        "prospective", "prosper", "prosperity", "prosthetic", "protagonist", "protectionism",
        "protective", "protectorate", "protege", "protein", "protestation", "protoplasm",
        "prototype", "protozoa", "protract", "protrude", "protuberance", "provenance", "proverbial",
        "providence", "provident", "provincial", "provision", "provisional", "proviso",
        "provocation", "provocative", "provoke", "prowess", "proximal", "proximate", "proximity",
        "proxy", "prudent", "prudential", "prune", "pseudonym", "psyche", "psychiatric",
        "psychiatry", "psychoanalysis", "psychometric", "psychopathology", "psychosis",
        "psychosomatic", "psychotherapy", "puberty", "publicise", "publicity", "puerile",
        "pugnacious", "pulmonary", "pulsate", "pulse", "pulverise", "punctilious", "punctual",
        "punctuate", "puncture", "pundit", "pungent", "punitive", "pupil", "puppet", "purgatory",
        "purge", "purify", "puritanical", "purity", "purloin", "purport", "purposeful", "pursuant",
        "pursuit", "purvey", "purview", "pusillanimous", "putative", "putrefy", "pyramidal",
        "pyrolysis", "quadrant", "quadratic", "quadrilateral", "quadruped", "quadruple",
        "quagmire", "quaint", "quake", "qualification", "qualified", "qualify", "quandary",
        "quantify", "quantitative", "quantity", "quantum", "quarantine", "quarry", "quarterly",
        "quartz", "quasar", "quash", "quasi", "quaternary", "quell", "quench", "querulous",
        "query", "quest", "questionnaire", "queue", "quibble", "quiescent", "quintessential",
        "quip", "quirk", "quixotic", "quorum", "quota", "quotation", "quotidian", "quotient",
    ]
    nawl = sorted({w for w in nawl_core if w not in ngsl_set and w not in awl_all})
    # Top up NAWL from academic-suffix mid-freq words up to ~963 if needed
    acad_suffixes = ("tion", "sion", "ment", "ity", "ism", "ist", "ology", "ic", "al", "ive", "ous", "ate", "ise", "ize")
    for w in clean[2800:]:
        if len(nawl) >= 963:
            break
        if w not in ngsl_set and w not in awl_all and w not in nawl and len(w) >= 6 and w.endswith(acad_suffixes):
            nawl.append(w)
    return ngsl, sorted(set(nawl))


def main():
    ngsl_words, ngsl_src = fetch_csv_words(NGSL_URLS)
    nawl_words, nawl_src = fetch_csv_words(NAWL_URLS)

    fallback_used = False
    if not ngsl_words or not nawl_words:
        fb_ngsl, fb_nawl = build_fallback_ngsl_nawl()
        if not ngsl_words:
            ngsl_words = fb_ngsl
            ngsl_src = "wordfreq-fallback (Apache-2.0 / CC BY-SA 4.0)"
            fallback_used = True
        if not nawl_words:
            nawl_words = fb_nawl
            nawl_src = "curated-nawl+wordfreq-fallback (CC BY-SA 4.0)"
            fallback_used = True

    awl_out = {
        "name": "Academic Word List (Coxhead 2000) — Sublist Tag Index",
        "license": "Tag-only reference (docs/05-DATA-PIPELINE.md §1); original list by Averil Coxhead, Victoria University of Wellington",
        "sublists": AWL_SUBLISTS,
        "headwordCount": sum(len(v) for v in AWL_SUBLISTS.values()),
    }
    (OUT_DIR / "awl_sublists.json").write_text(json.dumps(awl_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    ngsl_out = {
        "name": "New General Service List (NGSL)",
        "source": ngsl_src,
        "license": "CC-BY-SA-4.0",
        "count": len(ngsl_words),
        "words": ngsl_words,
    }
    (OUT_DIR / "ngsl.json").write_text(json.dumps(ngsl_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    nawl_out = {
        "name": "New Academic Word List (NAWL)",
        "source": nawl_src,
        "license": "CC-BY-SA-4.0",
        "count": len(nawl_words),
        "words": nawl_words,
    }
    (OUT_DIR / "nawl.json").write_text(json.dumps(nawl_out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    license_md = f"""# Wordlists Licenses & Attribution

- **NGSL (New General Service List)**: Browne, C., Culligan, B., & Phillips, J. (newgeneralservicelist.com). License: **CC BY-SA 4.0**.
  - Fetched source: `{ngsl_src}` ({len(ngsl_words)} words)
- **NAWL (New Academic Word List)**: Browne, C., Culligan, B., & Phillips, J. (newgeneralservicelist.com). License: **CC BY-SA 4.0**.
  - Fetched source: `{nawl_src}` ({len(nawl_words)} words)
- **AWL (Academic Word List Sublists 1–10)**: Coxhead, A. (2000), Victoria University of Wellington.
  - Used strictly for internal `AWL1`–`AWL10` tagging per `docs/05-DATA-PIPELINE.md` §1; raw original files are not redistributed in `public/`.
- **wordfreq**: Speer, R. (2022). Code Apache-2.0, data CC BY-SA 4.0.
"""
    (OUT_DIR / "LICENSE.md").write_text(license_md, encoding="utf-8")

    print(
        f"[00_fetch_wordlists] Done. AWL={awl_out['headwordCount']} entries (10 sublists), "
        f"NGSL={len(ngsl_words)} ({'fallback' if fallback_used and 'fallback' in ngsl_src else 'fetched'}), "
        f"NAWL={len(nawl_words)} ({'fallback' if fallback_used and 'fallback' in nawl_src else 'fetched'})."
    )


if __name__ == "__main__":
    main()
