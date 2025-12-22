# Institutional & Prestige Attribute Harvester

Command:

- `npm run harvest:schools`
- `npm run harvest:schools:nokey` (no API key; uses public Scorecard mirror + Census APIs)

Environment (recommended):

- `COLLEGESCORECARD_API_KEY` (required for a full 274-school run; `DEMO_KEY` is rate-limited)
- `CENSUS_ACS_YEAR` (default: `2022`)

CLI options:

- `--schools=<path>` input list (default: `school list.txt`)
- `--overrides=<path>` identity overrides JSON (default: `data/institutional_harvester/schools_overrides.json`)
- `--out=<dir>` output root (default: `runs`)
- `--run-id=<id>` fixed run folder name
- `--min-delay-ms=<n>` request pacing
- `--retries=<n>` request retries (default: `2`)
- `--timeout-ms=<n>` per-request timeout in ms (default: `20000`)
- `--max-schools=<n>` limit for smoke tests

No-key CLI options (`npm run harvest:schools:nokey`):

- `--mapping-pcip=<path>` PCIP→archetype map (default: `data/institutional_harvester/pcip_to_archetype.json`)
- `--min-delay-ms`, `--retries`, `--timeout-ms`, `--max-schools` also apply

Artifacts:

- Cache: `.cache/http/` (URL-hash JSON responses)
- Run outputs: `runs/<run_id>/...`

No-key sources:

- Scorecard mirror CSV: `https://data.wa.gov/api/views/wajg-ig9g/rows.csv?accessType=DOWNLOAD`
- County lookup: `https://geocoding.geo.census.gov/geocoder/geographies/coordinates`
- County ACS (population + median income): `https://api.census.gov/data/<year>/acs/acs5`

No-key fields pulled (when present):

- Identity: `INSTNM`, `CONTROL`, `LOCALE`, `MapLocation` (lat/lon + city/state)
- Enrollment: `UGDS` (undergrad)
- Academics: `PCIPxx` (program mix), `SAT_*`, `ACT*`
- Outcomes: `RET_FT4`, `C150_4_POOLED_SUPP`, `MD_EARN_WNE_P10`, `GRAD_DEBT_MDN_SUPP`
- Aid: `PCTPELL`, `PCTFLOAN`
- URLs: `INSTURL`, `NPCURL`
