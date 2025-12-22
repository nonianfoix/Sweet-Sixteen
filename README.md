<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1LTfqV0u8ZOx7FEvZT7qvwSVn3WUzr5db

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Institutional Attribute Harvester (NCAA D1)

- Run: `npm run harvest:schools`
- Input: `school list.txt` (one school per line)
- Output: `runs/<run_id>/schools_attributes.json`, `runs/<run_id>/schools_attributes.csv`, `runs/<run_id>/sources_index.json`, `runs/<run_id>/qa_report.md`
- Set `COLLEGESCORECARD_API_KEY` to run the full 274 reliably (the default `DEMO_KEY` is rate-limited)

No-key version (public datasets only):

- Run: `npm run harvest:schools:nokey`
