@echo off
title Lexicon Quest - IELTS 8.0 RPG
cd /d "%~dp0"

echo ========================================================
echo        LEXICON QUEST: The Realm of IELTS 8.0 RPG
echo ========================================================
echo.

if not exist "public\data\anki_vocab.json" (
    echo [1/3] Extracting IELTS 8.0 vocabulary from Anki...
    python scripts\extract_anki.py
) else (
    echo [1/3] Anki vocabulary dataset ready!
)

if not exist "node_modules" (
    echo [2/3] Installing dependencies...
    call npm install
) else (
    echo [2/3] Dependencies verified!
)

echo [3/3] Launching Lexicon Quest RPG...
echo.
echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

call npm run dev
