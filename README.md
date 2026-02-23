# Alicia-Zakaria
For Gemini Live Agent Challenge

## Live Demo
- Landing (FR): https://alicia-zakaria.web.app/
- Landing (EN): https://alicia-zakaria.web.app/en/
- App (FR): https://alicia-zakaria.web.app/app/?lang=fr
- App (EN): https://alicia-zakaria.web.app/app/?lang=en

## How Judges Can Test
1. Open the app in English:
   - https://alicia-zakaria.web.app/app/?lang=en
2. Authorize with:
   - Access code: `12345`
   - First name: any value
3. Click **Talk with Alicia** and allow microphone permission.
4. Speak in English (example):  
   - “Hi Alicia, how are you today?”
5. Expected result:
   - Alicia answers in English (Gemini Live native audio).
   - Voice stream remains active while speaking/listening.

## Quick FR/EN Validation
1. Switch language from the top bar (`FR` / `EN`).
2. Start a new voice session each time after switching.
3. Expected:
   - `FR` => Alicia/Zakaria respond in Quebec French.
   - `EN` => Alicia/Zakaria respond in English.

## Family Portal Test
1. Open:
   - https://alicia-zakaria.web.app/app/?mode=family&lang=en
2. Enter:
   - Resident access code: `12345`
   - Name: any value
3. Click **Link my phone**.
4. Expected:
   - Device links successfully and can receive call notifications.

## Architecture Diagram
- Mermaid source: `docs/architecture-diagram-hackathon.mmd`
- PNG (submission-ready): `docs/architecture-diagram-hackathon.png`
- SVG: `docs/architecture-diagram-hackathon.svg`
