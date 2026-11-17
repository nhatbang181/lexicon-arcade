import json
import os
import sys

def test_vocab_extraction():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'anki_vocab.json')
    assert os.path.exists(json_path), f"File not found: {json_path}"
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    assert 'realms' in data, "Missing 'realms' key in JSON"
    realms = data['realms']
    assert len(realms) >= 10, f"Expected at least 10 realms, got {len(realms)}"
    
    total_words = 0
    clean_check_passed = True
    
    for realm in realms:
        assert 'id' in realm and realm['id'], "Realm missing id"
        assert 'name' in realm and realm['name'], "Realm missing name"
        assert 'words' in realm, "Realm missing words list"
        words = realm['words']
        assert len(words) > 0, f"Realm {realm['name']} has 0 words"
        total_words += len(words)
        
        for w in words:
            assert 'id' in w, "Word missing id"
            assert 'word' in w and len(w['word']) > 0, "Word missing text"
            assert 'meaning' in w, "Word missing meaning"
            assert 'definition' in w, "Word missing definition"
            assert 'example' in w, "Word missing example"
            assert 'collocations' in w and isinstance(w['collocations'], list), "Collocations must be a list"
            assert 'synonyms' in w and isinstance(w['synonyms'], list), "Synonyms must be a list"
            
            # Check for dirty HTML tags
            for field in ['word', 'ipa', 'meaning', 'definition', 'example']:
                val = w.get(field, '')
                if '<br>' in val or '<div>' in val or '&nbsp;' in val or '\x1f' in val:
                    print(f"Dirty tag detected in {w['word']}: {val}")
                    clean_check_passed = False
                    
    assert clean_check_passed, "Found uncleaned HTML tags or delimiters in vocab data"
    assert total_words >= 1000, f"Expected >= 1000 words, got {total_words}"
    print(f"Extraction test passed successfully! Total realms: {len(realms)}, Total words: {total_words}")

if __name__ == '__main__':
    test_vocab_extraction()
