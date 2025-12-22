# SWEETSIXTEEN

Vite + React app.

## Run locally

**Prerequisites:** Node.js + npm

1. Install dependencies:
   - `npm ci` (recommended)
   - or `npm install`
2. Start the dev server:
   - `npm run dev`
3. Open the app at `http://localhost:5173`

## Other useful commands

- Run tests (some are currently failing): `npm test`
- Build: `npm run build`
- Preview the production build: `npm run preview`

## Institutional Attribute Harvester (NCAA D1)

- Run: `npm run harvest:schools`
- Input: `school list.txt` (one school per line)
- Output: `runs/<run_id>/schools_attributes.json`, `runs/<run_id>/schools_attributes.csv`, `runs/<run_id>/sources_index.json`, `runs/<run_id>/qa_report.md`
- Optional: set `COLLEGESCORECARD_API_KEY` in `.env.local` to run the full 274 reliably (the default `DEMO_KEY` is rate-limited)

No-key version (public datasets only):

- Run: `npm run harvest:schools:nokey`
