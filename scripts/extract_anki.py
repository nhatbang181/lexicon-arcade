import sqlite3
import os
import shutil
import re
import html
import json
import sys

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    # Replace <br>, <div> with space or newline
    text = re.sub(r'<\s*br\s*/?>', ' ', raw_html, flags=re.IGNORECASE)
    text = re.sub(r'</\s*div\s*>', ' ', text, flags=re.IGNORECASE)
    text = re.sub(r'<\s*div[^>]*>', ' ', text, flags=re.IGNORECASE)
    # Strip all other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Unescape entities like &nbsp;, &amp;, etc.
    text = html.unescape(text)
    # Normalize multiple whitespace
    text = re.sub(r'[ \t\r\f\v]+', ' ', text).strip()
    return text

def parse_list_field(field_text: str) -> list[str]:
    cleaned = clean_html(field_text)
    if not cleaned:
        return []
    # Split by ·, ;, or comma if appropriate
    parts = re.split(r'[·;\n]+', cleaned)
    items = []
    for p in parts:
        item = p.strip()
        if item and item.lower() not in ['thẻ mẫu', 'none', '-']:
            items.append(item)
    return items

def extract():
    src = os.path.expandvars(r'%APPDATA%\Anki2\Người dùng 1\collection.anki2')
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'anki_vocab.json')
    
    tmp_db = os.path.join(os.path.dirname(__file__), 'temp_anki.db')
    shutil.copy2(src, tmp_db)
    
    conn = sqlite3.connect(tmp_db)
    conn.create_collation('unicase', lambda a, b: 0 if a==b else (1 if a>b else -1))
    cur = conn.cursor()

    # Get deck mapping
    cur.execute('SELECT id, name FROM decks')
    decks = {row[0]: row[1].replace('\x1f', ' > ') for row in cur.fetchall()}

    # Get notetypes
    cur.execute('SELECT id, name FROM notetypes')
    notetypes = {row[0]: row[1] for row in cur.fetchall()}

    # Map cards to decks and notes
    # card -> note_id, deck_id
    cur.execute('''
        SELECT c.id, c.nid, c.did, n.mid, n.flds, n.tags
        FROM cards c
        JOIN notes n ON c.nid = n.id
    ''')
    cards_data = cur.fetchall()
    print(f"Total cards fetched: {len(cards_data)}")

    # Realm definitions
    realm_defs = [
        {"id": "education", "name": "The Scholastic Citadel", "desc": "Master academic vocabulary from the halls of learning.", "theme": "education", "key": "01 · Education", "icon": "GraduationCap", "accent": "#3b82f6"},
        {"id": "environment", "name": "The Primordial Wilds", "desc": "Brave nature, ecology, and climate terminology.", "theme": "environment", "key": "02 · Environment", "icon": "Trees", "accent": "#10b981"},
        {"id": "technology", "name": "The Cyber Foundry", "desc": "Conquer AI, computing, and technological innovation.", "theme": "technology", "key": "03 · Technology", "icon": "Cpu", "accent": "#8b5cf6"},
        {"id": "health", "name": "The Sanctuary of Vitae", "desc": "Heal ailments with medicine, diet, and wellness terms.", "theme": "health", "key": "04 · Health", "icon": "HeartPulse", "accent": "#ef4444"},
        {"id": "economy", "name": "The Merchant Metropolis", "desc": "Trade in global markets, finance, and career vocabs.", "theme": "economy", "key": "05 · Work & Economy", "icon": "Coins", "accent": "#f59e0b"},
        {"id": "society", "name": "The Shadow Underworld", "desc": "Investigate crime, legal systems, and societal ethics.", "theme": "society", "key": "06 · Society & Crime", "icon": "ShieldAlert", "accent": "#64748b"},
        {"id": "media", "name": "The Broadcasting Spire", "desc": "Decode mass media, advertising, and digital communication.", "theme": "media", "key": "07 · Media", "icon": "Radio", "accent": "#06b6d4"},
        {"id": "transport", "name": "The Steam Transit Hub", "desc": "Navigate urban planning, infrastructure, and mobility.", "theme": "transport", "key": "08 · Urban & Transport", "icon": "TrainFront", "accent": "#14b8a6"},
        {"id": "science", "name": "The Astral Observatory", "desc": "Uncover the secrets of scientific methodology and research.", "theme": "science", "key": "09 · Science & Research", "icon": "Telescope", "accent": "#a855f7"},
        {"id": "culture", "name": "The Global Pantheon", "desc": "Celebrate heritage, tourism, traditions, and globalization.", "theme": "culture", "key": "10 · Culture & Globalisation", "icon": "Globe2", "accent": "#ec4899"},
        {"id": "awl", "name": "The Spire of Erudition", "desc": "Essential Academic Word List (AWL) for IELTS 8.0+ writing.", "theme": "awl", "key": "Academic Word List", "icon": "BookOpenCheck", "accent": "#eab308"},
        {"id": "mastery", "name": "The Collocation Arena", "desc": "Master natural idioms, paraphrasing, speaking, and spelling.", "theme": "mastery", "key": "Speaking", "icon": "Sparkles", "accent": "#f97316"}
    ]

    realms_dict = {r['id']: {**r, "words": []} for r in realm_defs}
    seen_words = set()

    for cid, nid, did, mid, flds, tags in cards_data:
        deck_name = decks.get(did, "")
        nt_name = notetypes.get(mid, "")
        fields = flds.split('\x1f')

        # Determine realm
        assigned_realm_id = None
        for r in realm_defs:
            if r['key'] in deck_name:
                assigned_realm_id = r['id']
                break
        
        if not assigned_realm_id:
            # Fallback based on deck keywords
            if 'Writing' in deck_name or 'Collocation' in deck_name or 'Paraphrase' in deck_name or 'Chính tả' in deck_name:
                assigned_realm_id = 'mastery'
            elif 'Kiến thức cốt lõi' in deck_name:
                assigned_realm_id = 'education'
            else:
                assigned_realm_id = 'education'

        word_text = ""
        ipa = ""
        pos = ""
        meaning = ""
        definition = ""
        collocations = []
        example = ""
        synonyms = []

        if nt_name == 'IELTS Vocab 8.0' and len(fields) >= 8:
            word_text = clean_html(fields[0])
            ipa = clean_html(fields[1])
            pos = clean_html(fields[2])
            meaning = clean_html(fields[3])
            definition = clean_html(fields[4])
            collocations = parse_list_field(fields[5])
            example = clean_html(fields[6])
            synonyms = parse_list_field(fields[7])
        elif nt_name == 'IELTS Cloze 8.0' and len(fields) >= 2:
            raw_text = clean_html(fields[0])
            # extract word from cloze {{c1::word}}
            m = re.search(r'\{\{c\d+::([^:}]+)(?:::([^}]+))?\}\}', raw_text)
            if m:
                word_text = m.group(1).strip()
                example = re.sub(r'\{\{c\d+::([^:}]+)(?:::([^}]+))?\}\}', r'______', raw_text)
            else:
                word_text = raw_text[:30]
                example = raw_text
            meaning = clean_html(fields[1])
            definition = meaning
        elif nt_name == 'IELTS Spelling 8.0' and len(fields) >= 2:
            word_text = clean_html(fields[0])
            meaning = clean_html(fields[1])
            definition = meaning
            example = f"Practice spelling: {word_text}"
        elif nt_name == 'IELTS Q&A 8.0' and len(fields) >= 2:
            word_text = clean_html(fields[0])
            meaning = clean_html(fields[1])
            definition = clean_html(fields[2]) if len(fields) > 2 else meaning
            example = f"Key query: {word_text}"
        else:
            word_text = clean_html(fields[0])
            meaning = clean_html(fields[1]) if len(fields) > 1 else word_text
            definition = meaning
            example = f"Study item: {word_text}"

        if not word_text or word_text in seen_words:
            continue
        
        seen_words.add(word_text)

        # Fallbacks for missing example / definition
        if not definition:
            definition = meaning
        if not example:
            example = f"It is essential to understand the concept of {word_text} in academic context."

        vocab_item = {
            "id": f"w_{nid}_{cid}",
            "word": word_text,
            "ipa": ipa,
            "pos": pos,
            "meaning": meaning,
            "definition": definition,
            "collocations": collocations,
            "example": example,
            "synonyms": synonyms,
            "realmId": assigned_realm_id
        }

        realms_dict[assigned_realm_id]["words"].append(vocab_item)

    conn.close()
    if os.path.exists(tmp_db):
        os.remove(tmp_db)

    output = {
        "metadata": {
            "source": "Anki 2.1 Collection (IELTS 8.0)",
            "totalWords": len(seen_words),
            "totalRealms": len(realm_defs)
        },
        "realms": list(realms_dict.values())
    }

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {out_file} with {len(seen_words)} unique words across {len(realm_defs)} realms.")

if __name__ == '__main__':
    extract()
