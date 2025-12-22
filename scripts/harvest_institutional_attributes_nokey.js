import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const TODAY = new Date().toISOString().slice(0, 10);

const SOURCE_SCORECARD_WA_CSV = "https://data.wa.gov/api/views/wajg-ig9g/rows.csv?accessType=DOWNLOAD";
const SOURCE_SCORECARD_WA_DOC = "https://catalog.data.gov/dataset/most-recent-cohorts-scorecard-elements";
const SOURCE_CENSUS_REGIONS_PDF = "https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf";

function parseArgs(argv) {
  const args = {
    schoolsPath: path.resolve("school list.txt"),
    mappingPcipPath: path.resolve("data/institutional_harvester/pcip_to_archetype.json"),
    overridesPath: path.resolve("data/institutional_harvester/schools_overrides.json"),
    outDir: path.resolve("runs"),
    runId: null,
    minDelayMs: 200,
    retries: 2,
    timeoutMs: 30_000,
    maxSchools: null
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const [key, rawValue] = token.includes("=") ? token.split("=", 2) : [token, null];
    const value = rawValue ?? argv[++i];
    switch (key) {
      case "--schools":
        args.schoolsPath = path.resolve(value);
        break;
      case "--mapping-pcip":
        args.mappingPcipPath = path.resolve(value);
        break;
      case "--overrides":
        args.overridesPath = path.resolve(value);
        break;
      case "--out":
        args.outDir = path.resolve(value);
        break;
      case "--run-id":
        args.runId = value;
        break;
      case "--min-delay-ms":
        args.minDelayMs = Number(value);
        break;
      case "--retries":
        args.retries = Number(value);
        break;
      case "--timeout-ms":
        args.timeoutMs = Number(value);
        break;
      case "--max-schools":
        args.maxSchools = Number(value);
        break;
      default:
        throw new Error(`Unknown arg: ${key}`);
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function safeNumber(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s === "NULL") return null;
  if (s === "PrivacySuppressed") return null;
  if (s === "-2" || s === "-1" || s === "-3") return null;
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}

function roundInt(v) {
  if (v == null) return null;
  const num = Number(v);
  return Number.isFinite(num) ? Math.round(num) : null;
}

function normalizeName(raw) {
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\b(st)\b/g, "saint")
    .replace(/\buniv\b/g, "university")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(normalized) {
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

function jaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function stableSchoolIdFromName(inputName) {
  const slug = normalizeName(inputName).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `school_${slug}`;
}

function guessStateHint(rawName) {
  const match = String(rawName).match(/\(([A-Z]{2})\)\s*$/);
  if (match) return match[1];
  const suffix = String(rawName).trim().match(/\b([A-Z]{2})\s*$/);
  if (suffix && ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"].includes(suffix[1])) {
    return suffix[1];
  }
  return null;
}

const INPUT_ALIASES = new Map([
  ["ucla", ["university of california los angeles"]],
  ["usc", ["university of southern california"]],
  ["uconn", ["university of connecticut"]],
  ["uab", ["university of alabama at birmingham", "university of alabama birmingham"]],
  ["uic", ["university of illinois chicago", "university of illinois at chicago"]],
  ["ucf", ["university of central florida"]],
  ["unlv", ["university of nevada las vegas"]],
  ["lsu", ["louisiana state university"]],
  ["smu", ["southern methodist university"]],
  ["tcu", ["texas christian university"]],
  ["byu", ["brigham young university"]],
  ["vcu", ["virginia commonwealth university"]],
  ["umbc", ["university of maryland baltimore county"]],
  ["ole miss", ["university of mississippi"]],
  ["penn state", ["pennsylvania state university"]],
  ["nc state", ["north carolina state university"]],
  ["charleston wv", ["university of charleston"]],
  ["georgia tech", ["georgia institute of technology"]],
  ["louisville", ["university of louisville"]]
]);

const PREFERRED_CANDIDATE_INCLUDES = new Map([
  ["california", "university of california berkeley"],
  ["maryland", "university of maryland college park"],
  ["arizona state", "arizona state university tempe"],
  ["lsu", "louisiana state university and agricultural and mechanical college"],
  ["indiana", "indiana university bloomington"],
  ["georgia tech", "georgia institute of technology"],
  ["louisville", "university of louisville"]
]);

function buildInputVariants(rawInputName) {
  const variants = new Set();
  const base = normalizeName(rawInputName);
  variants.add(base);

  const alias = INPUT_ALIASES.get(base);
  if (alias) {
    for (const a of alias) variants.add(normalizeName(a));
  }

  const uc = base.match(/^uc\s+(.+)$/);
  if (uc) variants.add(normalizeName(`university of california ${uc[1]}`));

  const unc = base.match(/^unc\s+(.+)$/);
  if (unc) variants.add(normalizeName(`university of north carolina at ${unc[1]}`));

  const umass = base.match(/^umass\s+(.+)$/);
  if (umass) variants.add(normalizeName(`university of massachusetts ${umass[1]}`));

  const ut = base.match(/^ut\s+(.+)$/);
  if (ut) variants.add(normalizeName(`university of texas at ${ut[1]}`));

  return [...variants].map((norm) => ({ norm, tokens: tokenize(norm) }));
}

class CachedHttp {
  constructor({ cacheDir, minDelayMs }) {
    this.cacheDir = cacheDir;
    this.minDelayMs = minDelayMs;
    this.lastRequestAt = 0;
  }

  async getText(url, { retries = 2, timeoutMs = 30_000 } = {}) {
    ensureDir(this.cacheDir);
    const cacheKey = sha256(url);
    const cachePath = path.join(this.cacheDir, `${cacheKey}.txt`);
    if (fs.existsSync(cachePath)) return fs.readFileSync(cachePath, "utf8");

    for (let attempt = 0; attempt <= retries; attempt++) {
      const now = Date.now();
      const wait = Math.max(0, this.minDelayMs - (now - this.lastRequestAt));
      if (wait > 0) await sleep(wait);
      this.lastRequestAt = Date.now();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { headers: { "User-Agent": "SweetSixteen-InstitutionalHarvesterNoKey/1.0" }, signal: controller.signal });
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
        fs.writeFileSync(cachePath, text, "utf8");
        clearTimeout(timeout);
        return text;
      } catch (err) {
        clearTimeout(timeout);
        if (attempt === retries) throw err;
        await sleep(Math.min(20_000, 700 * 2 ** attempt));
      }
    }
    throw new Error("Unreachable");
  }

  async getJson(url, opts) {
    const text = await this.getText(url, opts);
    return JSON.parse(text);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === "\"") {
        const next = text[i + 1];
        if (next === "\"") {
          field += "\"";
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === "\"") {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field.replace(/\r$/, ""));
      field = "";
      rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseMapLocation(mapLocation) {
  if (!mapLocation) return { city: null, state: null, lat: null, lon: null };
  const text = String(mapLocation);
  const cityStateMatch = text.match(/^\s*([^\n]+?),\s*([A-Z]{2})/m);
  const coordMatch = text.match(/\(\s*([+-]?\d+(\.\d+)?)\s*,\s*([+-]?\d+(\.\d+)?)\s*\)/);
  return {
    city: cityStateMatch ? cityStateMatch[1].trim() : null,
    state: cityStateMatch ? cityStateMatch[2].trim() : null,
    lat: coordMatch ? safeNumber(coordMatch[1]) : null,
    lon: coordMatch ? safeNumber(coordMatch[3]) : null
  };
}

const STATE_NAME_SET = new Set([
  "alabama",
  "alaska",
  "arizona",
  "arkansas",
  "california",
  "colorado",
  "connecticut",
  "delaware",
  "florida",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new hampshire",
  "new jersey",
  "new mexico",
  "new york",
  "north carolina",
  "north dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode island",
  "south carolina",
  "south dakota",
  "tennessee",
  "texas",
  "utah",
  "vermont",
  "virginia",
  "washington",
  "west virginia",
  "wisconsin",
  "wyoming"
]);

const CENSUS_REGION_BY_STATE = {
  CT: "Northeast",
  ME: "Northeast",
  MA: "Northeast",
  NH: "Northeast",
  RI: "Northeast",
  VT: "Northeast",
  NJ: "Northeast",
  NY: "Northeast",
  PA: "Northeast",
  IL: "Midwest",
  IN: "Midwest",
  MI: "Midwest",
  OH: "Midwest",
  WI: "Midwest",
  IA: "Midwest",
  KS: "Midwest",
  MN: "Midwest",
  MO: "Midwest",
  NE: "Midwest",
  ND: "Midwest",
  SD: "Midwest",
  DE: "South",
  FL: "South",
  GA: "South",
  MD: "South",
  NC: "South",
  SC: "South",
  VA: "South",
  DC: "South",
  WV: "South",
  AL: "South",
  KY: "South",
  MS: "South",
  TN: "South",
  AR: "South",
  LA: "South",
  OK: "South",
  TX: "South",
  AZ: "West",
  CO: "West",
  ID: "West",
  MT: "West",
  NV: "West",
  NM: "West",
  UT: "West",
  WY: "West",
  AK: "West",
  CA: "West",
  HI: "West",
  OR: "West",
  WA: "West"
};

function regionFromState(state) {
  if (!state) return null;
  return CENSUS_REGION_BY_STATE[state.toUpperCase()] ?? null;
}

function mapLocaleToSetting(locale) {
  if (locale == null) return null;
  const numeric = Number(locale);
  if ([11, 12, 13].includes(numeric)) return "city";
  if ([21, 22, 23].includes(numeric)) return "suburb";
  if ([31, 32, 33].includes(numeric)) return "town";
  if ([41, 42, 43].includes(numeric)) return "rural";
  return null;
}

function mapOwnership(code) {
  if (code === 1) return "public";
  if (code === 2) return "private_nonprofit";
  if (code === 3) return "private_for_profit";
  return null;
}

function percentileScores(valuesById) {
  const entries = Object.entries(valuesById).filter(([, v]) => typeof v === "number" && Number.isFinite(v));
  entries.sort((a, b) => a[1] - b[1]);
  const n = entries.length;
  const scores = {};
  for (let idx = 0; idx < n; idx++) {
    const [id] = entries[idx];
    const rank = n === 1 ? 0.5 : idx / (n - 1);
    scores[id] = Math.round(100 * rank);
  }
  return { scores, n };
}

function giniFromWeights(weights) {
  const values = Object.values(weights).filter((v) => typeof v === "number" && Number.isFinite(v));
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let cumulative = 0;
  for (let i = 0; i < n; i++) cumulative += (i + 1) * sorted[i];
  return (2 * cumulative) / (n * sum) - (n + 1) / n;
}

function addSource(sources, { field, url, source_tier }) {
  sources.push({ field, url, accessed: TODAY, source_tier });
}

function deriveArchetypesFromPcip({ pcipValuesByCode, mapping }) {
  const archetypes = {
    tech_students: 0,
    law_students: 0,
    finance_business_students: 0,
    health_med_students: 0,
    education_students: 0,
    arts_media_students: 0,
    general_liberal_arts_students: 0
  };

  const missingCodes = [];
  for (const [pcipCode, archetype] of Object.entries(mapping.pcipToArchetype)) {
    const value = pcipValuesByCode[pcipCode];
    if (value == null) {
      missingCodes.push(pcipCode);
      continue;
    }
    archetypes[archetype] += value;
  }

  const sum = Object.values(archetypes).reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    return {
      weights: { ...mapping.baselineWeightsIfMissing },
      confidence: 0.15,
      method: "baseline_missing_pcip",
      missing_reason: "pcip_missing_or_zero"
    };
  }

  const normalized = {};
  for (const [k, v] of Object.entries(archetypes)) normalized[k] = v / sum;

  const weightsFloat = {};
  for (const [k, v] of Object.entries(normalized)) weightsFloat[k] = 100 * v;
  const rounded = {};
  let running = 0;
  const keys = Object.keys(weightsFloat);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const r = i === keys.length - 1 ? 100 - running : Math.round(weightsFloat[k]);
    rounded[k] = r;
    running += r;
  }

  const coverage = clamp(sum, 0, 1);
  const confidence = clamp(0.55 + 0.40 * coverage - 0.10 * (missingCodes.length > 0 ? 1 : 0), 0, 1);
  return {
    weights: rounded,
    confidence,
    method: "scorecard_pcip_v1",
    missing_reason: missingCodes.length ? `missing_pcip:${missingCodes.slice(0, 5).join(",")}` : null
  };
}

function derivePrestigeBase({ control, locale, undergradEnrollment, admissionRate }) {
  const components = [];

  const enrollmentPresent = typeof undergradEnrollment === "number" && Number.isFinite(undergradEnrollment);
  const enrollment01 = enrollmentPresent ? clamp(Math.log10(undergradEnrollment + 1) / Math.log10(60_000 + 1), 0, 1) : null;
  components.push({ value: enrollment01, weight: 0.45, present: enrollmentPresent });

  const localePresent = typeof locale === "number" && Number.isFinite(locale);
  const setting = mapLocaleToSetting(locale);
  const locale01 = !localePresent ? null : setting === "city" ? 1 : setting === "suburb" ? 0.7 : setting ? 0.4 : null;
  components.push({ value: locale01, weight: 0.15, present: locale01 != null });

  const controlPresent = typeof control === "number" && Number.isFinite(control);
  const control01 = !controlPresent ? null : control === 2 ? 0.65 : 0.5;
  components.push({ value: control01, weight: 0.15, present: control01 != null });

  const admissionPresent = typeof admissionRate === "number" && Number.isFinite(admissionRate);
  const selectivity = admissionPresent ? clamp(1 - admissionRate, 0, 1) : null;
  components.push({ value: selectivity, weight: 0.25, present: selectivity != null });

  const presentWeight = components.filter((c) => c.present).reduce((a, c) => a + c.weight, 0);
  if (presentWeight === 0) {
    return { prestige_academic_base: 50, prestige_base_confidence: 0.2, prestige_base_method: "default_midpoint_missing_proxies" };
  }

  const weighted = components.reduce((a, c) => a + (c.present ? c.weight * c.value : 0), 0);
  const normalized = weighted / presentWeight;
  return {
    prestige_academic_base: Math.round(100 * clamp(normalized, 0, 1)),
    prestige_base_confidence: clamp(0.35 + 0.55 * presentWeight, 0, 1),
    prestige_base_method: "scorecard_mirror_proxies_v1"
  };
}

function computeAlumniHalo({ undergradEnrollment, pathwaysCount, prestigeAcademicBase01, marketSize01, archetypeBalance01 }) {
  const logEnrollment = undergradEnrollment == null ? null : Math.log10(undergradEnrollment + 1);
  const appPresent = logEnrollment != null;
  const app = appPresent ? clamp(logEnrollment / Math.log10(60_000 + 1), 0, 1) : null;

  const abpPresent = typeof pathwaysCount === "number";
  let abp = abpPresent ? clamp(pathwaysCount / 4, 0, 1) : null;
  if (abp != null && archetypeBalance01 != null) abp = clamp(abp * 0.75 + archetypeBalance01 * 0.25, 0, 1);

  const irPresent = prestigeAcademicBase01 != null && marketSize01 != null;
  const ir = irPresent ? clamp(0.60 * prestigeAcademicBase01 + 0.40 * marketSize01, 0, 1) : null;

  const parts = [
    { value: app, weight: 0.45 },
    { value: abp, weight: 0.25 },
    { value: ir, weight: 0.30 }
  ];
  const presentWeight = parts.filter((p) => p.value != null).reduce((a, p) => a + p.weight, 0);
  const confidence = clamp(0.20 + 0.75 * presentWeight, 0, 1);
  if (presentWeight === 0) {
    return {
      alumni_halo: 50,
      alumni_halo_confidence: 0.2,
      alumni_halo_method: "synthetic_signals_v1",
      alumni_halo_components: { APP: null, ABP: null, IR: null }
    };
  }
  const combined = parts.reduce((a, p) => a + (p.value == null ? 0 : p.weight * p.value), 0) / presentWeight;
  return {
    alumni_halo: Math.round(100 * clamp(combined, 0, 1)),
    alumni_halo_confidence: confidence,
    alumni_halo_method: "synthetic_signals_v1",
    alumni_halo_components: { APP: app, ABP: abp, IR: ir }
  };
}

function buildCensusGeocoderUrl({ lat, lon }) {
  const base = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
  const sp = new URLSearchParams({
    x: String(lon),
    y: String(lat),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json"
  });
  return `${base}?${sp.toString()}`;
}

function buildAcsCountyUrl({ year, stateFips, countyFips }) {
  const base = `https://api.census.gov/data/${encodeURIComponent(year)}/acs/acs5`;
  const sp = new URLSearchParams({
    get: "B01003_001E,B19013_001E",
    for: `county:${countyFips}`,
    in: `state:${stateFips}`
  });
  return `${base}?${sp.toString()}`;
}

function buildAcsPlaceUrl({ year, stateFips, placeFips }) {
  const base = `https://api.census.gov/data/${encodeURIComponent(year)}/acs/acs5`;
  const sp = new URLSearchParams({
    get: "B01003_001E,B19013_001E",
    for: `place:${placeFips}`,
    in: `state:${stateFips}`
  });
  return `${base}?${sp.toString()}`;
}

function extractCountyFromGeocoder(geoJson) {
  const county = geoJson?.result?.geographies?.Counties?.[0];
  const state = geoJson?.result?.geographies?.States?.[0];
  const stateFips = state?.STATE ?? null;
  const countyFips = county?.COUNTY ?? null;
  return { stateFips, countyFips, countyName: county?.NAME ?? null };
}

function extractPlaceFromGeocoder(geoJson) {
  const place = geoJson?.result?.geographies?.["Incorporated Places"]?.[0];
  const state = geoJson?.result?.geographies?.States?.[0];
  const stateFips = state?.STATE ?? null;
  const placeFips = place?.PLACE ?? null;
  const placeName = place?.NAME ?? null;
  return { stateFips, placeFips, placeName };
}

async function loadScorecardMirrorRecords(http, { retries, timeoutMs }) {
  const csvText = await http.getText(SOURCE_SCORECARD_WA_CSV, { retries, timeoutMs });
  const rows = parseCsv(csvText);
  const header = rows[0] ?? [];
  const idxByName = new Map();
  header.forEach((h, i) => idxByName.set(h, i));

  const records = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const unitid = row[idxByName.get("UNITID")] ?? null;
    const instnm = row[idxByName.get("INSTNM")] ?? null;
    const stabbr = row[idxByName.get("STABBR")] ?? null;
    if (!unitid || !instnm || !stabbr) continue;

    const locale = safeNumber(row[idxByName.get("LOCALE")]);
    const control = safeNumber(row[idxByName.get("CONTROL")]);
    const ugds = safeNumber(row[idxByName.get("UGDS")]);
    const insturl = row[idxByName.get("INSTURL")] ?? null;
    const npcurl = row[idxByName.get("NPCURL")] ?? null;
    const pctpell = safeNumber(row[idxByName.get("PCTPELL")]);
    const pctfloan = safeNumber(row[idxByName.get("PCTFLOAN")]);
    const retentionFt4 = safeNumber(row[idxByName.get("RET_FT4")]);
    const completion150_4yr = safeNumber(row[idxByName.get("C150_4_POOLED_SUPP")]);
    const medianEarnings10yr = safeNumber(row[idxByName.get("MD_EARN_WNE_P10")]);
    const gradDebtMedian = row[idxByName.get("GRAD_DEBT_MDN_SUPP")] ?? null;
    const satAvg = safeNumber(row[idxByName.get("SAT_AVG")]) ?? safeNumber(row[idxByName.get("SAT_AVG_ALL")]);
    const actCompositeMid = safeNumber(row[idxByName.get("ACTCMMID")]);
    const satVerbalMid = safeNumber(row[idxByName.get("SATVRMID")]);
    const satMathMid = safeNumber(row[idxByName.get("SATMTMID")]);
    const mapLocation = row[idxByName.get("MapLocation")] ?? null;
    const { city, state, lat, lon } = parseMapLocation(mapLocation);

    const pcip = {};
    for (const [name, idx] of idxByName.entries()) {
      if (!name.startsWith("PCIP")) continue;
      pcip[name] = safeNumber(row[idx]);
    }

    records.push({
      unitid: String(unitid),
      instnm: String(instnm),
      stabbr: String(stabbr),
      locale,
      control,
      ugds,
      insturl,
      npcurl,
      pctpell,
      pctfloan,
      retentionFt4,
      completion150_4yr,
      medianEarnings10yr,
      gradDebtMedian,
      satAvg,
      actCompositeMid,
      satVerbalMid,
      satMathMid,
      city,
      state: state ?? String(stabbr),
      lat,
      lon,
      pcip
    });
  }
  return records;
}

function scoreCandidate({ inputNorm, inputTokens, candidateNorm, candidateTokens, isStateInput, ugds }) {
  const sim = jaccardSimilarity(inputTokens, candidateTokens);
  const prefixBoost = candidateNorm.startsWith(inputNorm) || inputNorm.startsWith(candidateNorm) ? 0.15 : 0;
  const enrollmentBoost = ugds == null ? 0 : 0.07 * clamp(Math.log10(ugds + 1) / 5, 0, 1);

  let flagshipBoost = 0;
  if (isStateInput) {
    const uniOf = `university of ${inputNorm}`;
    const theUniOf = `the university of ${inputNorm}`;
    if (candidateNorm === uniOf || candidateNorm === theUniOf) flagshipBoost = 0.45;
    else if (candidateNorm.startsWith(uniOf) || candidateNorm.startsWith(theUniOf)) flagshipBoost = 0.25;
    if (candidateNorm.startsWith(`${inputNorm} state university`) || candidateNorm === `${inputNorm} state university`) flagshipBoost -= 0.20;
  }

  return sim + prefixBoost + enrollmentBoost + flagshipBoost;
}

async function main() {
  const args = parseArgs(process.argv);
  const runId = args.runId ?? new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(args.outDir, runId);
  ensureDir(runDir);

  const http = new CachedHttp({ cacheDir: path.resolve(".cache/http"), minDelayMs: args.minDelayMs });
  const mapping = JSON.parse(fs.readFileSync(args.mappingPcipPath, "utf8"));

  const overridesFile = readJsonIfExists(args.overridesPath);
  const overrides = new Map();
  for (const entry of overridesFile?.overrides ?? []) overrides.set(entry.input_school_name, entry);

  const schoolLines = fs
    .readFileSync(args.schoolsPath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const selectedSchoolLines = args.maxSchools != null ? schoolLines.slice(0, args.maxSchools) : schoolLines;

  const scorecardRecords = await loadScorecardMirrorRecords(http, { retries: args.retries, timeoutMs: args.timeoutMs });
  const candidates = scorecardRecords.map((r) => ({
    ...r,
    norm: normalizeName(r.instnm),
    tokens: tokenize(normalizeName(r.instnm))
  }));

  const identityResults = [];
  for (const inputName of selectedSchoolLines) {
    const school_id = stableSchoolIdFromName(inputName);
    const override = overrides.get(inputName);
    if (override?.force_unitid) {
      const match = candidates.find((c) => c.unitid === String(override.force_unitid)) ?? null;
      identityResults.push({
        school_id,
        school_name: inputName,
        unitid: match?.unitid ?? String(override.force_unitid),
        record: match,
        identity_resolution: { status: match ? "overridden" : "overridden_not_found", confidence: match ? 1 : 0.5, chosen_reason: "force_unitid" }
      });
      continue;
    }

    const stateHint = guessStateHint(inputName);
    const variants = buildInputVariants(inputName);
    const baseNorm = variants[0]?.norm ?? normalizeName(inputName);
    const isStateInput = STATE_NAME_SET.has(baseNorm);
    const preferredIncludes = PREFERRED_CANDIDATE_INCLUDES.get(baseNorm) ?? null;

    const scored = candidates
      .map((c) => {
        let bestScore = -999;
        for (const v of variants) {
          const s = scoreCandidate({
            inputNorm: v.norm,
            inputTokens: v.tokens,
            candidateNorm: c.norm,
            candidateTokens: c.tokens,
            isStateInput,
            ugds: c.ugds
          });
          if (s > bestScore) bestScore = s;
        }
        const preferredBoost = preferredIncludes && c.norm.includes(preferredIncludes) ? 0.8 : 0;
        const stateBoost = stateHint && c.stabbr === stateHint ? 0.12 : 0;
        const statePenalty = stateHint && c.stabbr && c.stabbr !== stateHint ? -0.18 : 0;
        return { c, score: bestScore + preferredBoost + stateBoost + statePenalty };
      })
      .sort((a, b) => (b.score - a.score) || ((b.c.ugds ?? 0) - (a.c.ugds ?? 0)) || a.c.unitid.localeCompare(b.c.unitid));

    const best = scored[0];
    const second = scored[1];
    if (!best || best.score < 0.25) {
      identityResults.push({
        school_id,
        school_name: inputName,
        unitid: null,
        record: null,
        identity_resolution: {
          status: "not_found",
          confidence: 0,
          error_class: "not_found",
          candidates: scored.slice(0, 5).map((s) => ({ unitid: s.c.unitid, name: s.c.instnm, state: s.c.stabbr, score: s.score }))
        }
      });
      continue;
    }

    const margin = second ? best.score - second.score : best.score;
    const confidence = clamp(0.40 + 0.60 * clamp(margin / 0.40, 0, 1), 0, 1);
    const ambiguous = second && margin < 0.08;

    identityResults.push({
      school_id,
      school_name: inputName,
      unitid: ambiguous ? null : best.c.unitid,
      record: ambiguous ? null : best.c,
      identity_resolution: {
        status: ambiguous ? "ambiguous" : "resolved",
        confidence: ambiguous ? confidence * 0.5 : confidence,
        candidates: scored.slice(0, 5).map((s) => ({ unitid: s.c.unitid, name: s.c.instnm, state: s.c.stabbr, score: s.score }))
      }
    });
  }

  writeJson(path.join(runDir, "resolved_identity.json"), {
    run_id: runId,
    generated_at: new Date().toISOString(),
    sources: { scorecard_mirror: SOURCE_SCORECARD_WA_DOC },
    records: identityResults
  });

  const perSchool = [];
  const marketPopulationById = {};
  const marketIncomeById = {};
  const marketUrlById = {};

  for (const row of identityResults) {
    const sources = [];
    const missingFields = [];
    const notes = [];

    const record = row.record ?? null;
    if (!record || !row.unitid) {
      missingFields.push("unitid");
      perSchool.push({
        school_id: row.school_id,
        school_name: row.school_name,
        unitid: null,
        identity: { official_name: null, city: null, state: null, control: null, campus_setting: null, lat: null, lon: null, region: null },
        raw_facts: {},
        market_context: {},
        derived_attributes: {
          archetype_weights: mapping.baselineWeightsIfMissing,
          archetype_confidence: 0.15,
          archetype_method: "baseline_missing_unitid",
          prestige_academic_base: 50,
          prestige_base_method: "default_midpoint_missing_unitid",
          prestige_base_confidence: 0.2,
          alumni_halo: 50,
          alumni_halo_confidence: 0.2,
          alumni_halo_method: "synthetic_signals_v1",
          alumni_halo_components: { APP: null, ABP: null, IR: null },
          prestige_academic_final: 50,
          market_size_score: 50,
          affluence_score: 50,
          nil_potential_score: 50,
          nil_confidence: 0.1
        },
        sources,
        qa: { missing_fields: missingFields, notes }
      });
      continue;
    }

    const dataUrl = SOURCE_SCORECARD_WA_CSV;
    const officialName = record.instnm ?? null;
    const state = record.stabbr ?? null;
    const city = record.city ?? null;
    const lat = record.lat ?? null;
    const lon = record.lon ?? null;
    const locale = record.locale ?? null;
    const controlNumeric = record.control ?? null;
    const undergradEnrollment = record.ugds ?? null;
    const pcipValuesByCode = record.pcip ?? {};
    const schoolUrl = record.insturl ?? null;
    const netPriceCalculatorUrl = record.npcurl ?? null;
    const pctPell = record.pctpell ?? null;
    const pctFederalLoan = record.pctfloan ?? null;
    const retentionFt4 = record.retentionFt4 ?? null;
    const completion150_4yr = record.completion150_4yr ?? null;
    const medianEarnings10yr = record.medianEarnings10yr ?? null;
    const gradDebtMedian = safeNumber(record.gradDebtMedian);
    const satAvg = record.satAvg ?? null;
    const actCompositeMid = record.actCompositeMid ?? null;
    const satVerbalMid = record.satVerbalMid ?? null;
    const satMathMid = record.satMathMid ?? null;

    addSource(sources, { field: "identity.official_name", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "identity.state", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "identity.city", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "identity.lat", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "identity.lon", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "identity.control", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "identity.campus_setting", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.undergrad_enrollment", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.pcip_program_shares", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.school_url", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.net_price_calculator_url", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.pct_pell", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.pct_federal_loan", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.retention_ft4", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.completion_rate_150pct_4yr", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.median_earnings_10yr", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.grad_debt_median", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.sat_avg", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.act_composite_mid", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.sat_verbal_mid", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.sat_math_mid", url: dataUrl, source_tier: "reputable" });
    addSource(sources, { field: "identity.region", url: SOURCE_CENSUS_REGIONS_PDF, source_tier: "reputable" });

    const archetype = deriveArchetypesFromPcip({ pcipValuesByCode, mapping });
    addSource(sources, { field: "derived_attributes.archetype_weights", url: dataUrl, source_tier: "derived" });

    const prestigeBase = derivePrestigeBase({ control: controlNumeric, locale, undergradEnrollment, admissionRate: null });
    addSource(sources, { field: "derived_attributes.prestige_academic_base", url: "derived:scorecard_mirror_proxies_v1", source_tier: "derived" });

    const region = regionFromState(state);

    let cityPopulation = null;
    let cityIncome = null;
    let countyPopulation = null;
    let countyIncome = null;
    let stateFips = null;
    let countyFips = null;
    let placeFips = null;
    if (lat == null || lon == null) {
      missingFields.push("market_context.city_population");
      missingFields.push("market_context.city_median_household_income");
      missingFields.push("market_context.county_population");
      missingFields.push("market_context.county_median_household_income");
      notes.push("missing_lat_lon_for_geocoder");
    } else {
      const geoUrl = buildCensusGeocoderUrl({ lat, lon });
      try {
        const geoJson = await http.getJson(geoUrl, { retries: args.retries, timeoutMs: args.timeoutMs });
        const extractedPlace = extractPlaceFromGeocoder(geoJson);
        const extractedCounty = extractCountyFromGeocoder(geoJson);

        stateFips = extractedPlace.stateFips ?? extractedCounty.stateFips;
        placeFips = extractedPlace.placeFips;
        countyFips = extractedCounty.countyFips;

        if (stateFips && placeFips) {
          const placeUrl = buildAcsPlaceUrl({ year: "2022", stateFips, placeFips });
          marketUrlById[row.school_id] = placeUrl;
          const acs = await http.getJson(placeUrl, { retries: args.retries, timeoutMs: args.timeoutMs });
          const row2 = Array.isArray(acs) && Array.isArray(acs[1]) ? acs[1] : null;
          cityPopulation = row2 ? safeNumber(row2[0]) : null;
          cityIncome = row2 ? safeNumber(row2[1]) : null;
          addSource(sources, { field: "market_context.city_population", url: placeUrl, source_tier: "reputable" });
          addSource(sources, { field: "market_context.city_median_household_income", url: placeUrl, source_tier: "reputable" });
        } else {
          notes.push("geocoder_missing_place");
        }

        if (stateFips && countyFips) {
          const countyUrl = buildAcsCountyUrl({ year: "2022", stateFips, countyFips });
          if (!marketUrlById[row.school_id]) marketUrlById[row.school_id] = countyUrl;
          const acs = await http.getJson(countyUrl, { retries: args.retries, timeoutMs: args.timeoutMs });
          const row2 = Array.isArray(acs) && Array.isArray(acs[1]) ? acs[1] : null;
          countyPopulation = row2 ? safeNumber(row2[0]) : null;
          countyIncome = row2 ? safeNumber(row2[1]) : null;
          addSource(sources, { field: "market_context.county_population", url: countyUrl, source_tier: "reputable" });
          addSource(sources, { field: "market_context.county_median_household_income", url: countyUrl, source_tier: "reputable" });
        } else {
          notes.push("geocoder_missing_county");
        }
      } catch (err) {
        notes.push(`market_context_fetch_failed:${String(err).slice(0, 120)}`);
      }
    }

    marketPopulationById[row.school_id] = cityPopulation ?? countyPopulation;
    marketIncomeById[row.school_id] = cityIncome ?? countyIncome;

    const control = mapOwnership(controlNumeric);
    const campusSetting = mapLocaleToSetting(locale);

    perSchool.push({
      school_id: row.school_id,
      school_name: row.school_name,
      unitid: row.unitid,
      identity: {
        official_name: officialName,
        city,
        state,
        control,
        campus_setting: campusSetting,
        lat,
        lon,
        region
      },
      raw_facts: {
        undergrad_enrollment: roundInt(undergradEnrollment),
        grad_enrollment: null,
        total_enrollment: null,
        school_url: schoolUrl,
        net_price_calculator_url: netPriceCalculatorUrl,
        pct_pell: pctPell,
        pct_federal_loan: pctFederalLoan,
        retention_ft4: retentionFt4,
        completion_rate_150pct_4yr: completion150_4yr,
        median_earnings_10yr: medianEarnings10yr,
        grad_debt_median: gradDebtMedian,
        sat_avg: satAvg,
        act_composite_mid: actCompositeMid,
        sat_verbal_mid: satVerbalMid,
        sat_math_mid: satMathMid,
        program_percentages: pcipValuesByCode,
        professional_schools: {
          has_law_school: null,
          has_medical_school: null,
          has_business_school: null,
          has_engineering_school: null,
          has_nursing_program: null,
          missing_reason: "no_defensible_school_level_dataset_connected_in_nokey_v1"
        }
      },
      market_context: {
        market_basis: cityPopulation != null ? "city" : countyPopulation != null ? "county" : null,
        city_state_fips: stateFips,
        city_place_fips: placeFips,
        city_population: cityPopulation,
        city_median_household_income: cityIncome,
        county_state_fips: stateFips,
        county_fips: countyFips,
        county_population: countyPopulation,
        county_median_household_income: countyIncome
      },
      derived_attributes: {
        archetype_weights: archetype.weights,
        archetype_confidence: archetype.confidence,
        archetype_method: archetype.method,
        prestige_academic_base: prestigeBase.prestige_academic_base,
        prestige_base_method: prestigeBase.prestige_base_method,
        prestige_base_confidence: prestigeBase.prestige_base_confidence,
        alumni_halo: null,
        alumni_halo_confidence: null,
        alumni_halo_method: "synthetic_signals_v1",
        alumni_halo_components: { APP: null, ABP: null, IR: null },
        prestige_academic_final: null,
        market_size_score: null,
        affluence_score: null,
        nil_potential_score: null,
        nil_confidence: null
      },
      sources,
      qa: { missing_fields: missingFields, notes }
    });
  }

  const populationScores = percentileScores(marketPopulationById);
  const incomeScores = percentileScores(marketIncomeById);

  for (const rec of perSchool) {
    const marketSizeScore = populationScores.scores[rec.school_id] ?? 50;
    const affluenceScore = incomeScores.scores[rec.school_id] ?? 50;
    const marketSize01 = marketSizeScore / 100;
    const prestigeBase01 = rec.derived_attributes.prestige_academic_base / 100;

    const undergradEnrollment = rec.raw_facts.undergrad_enrollment ?? null;
    const gini = giniFromWeights(rec.derived_attributes.archetype_weights);
    const archetypeBalance01 = gini == null ? null : clamp(1 - gini, 0, 1);

    const halo = computeAlumniHalo({
      undergradEnrollment,
      pathwaysCount: null,
      prestigeAcademicBase01: prestigeBase01,
      marketSize01,
      archetypeBalance01
    });

    const haloAdjustment = clamp((halo.alumni_halo - 50) * 0.2, -8, 10);
    const finalPrestige = clamp(Math.round(rec.derived_attributes.prestige_academic_base + haloAdjustment), 0, 100);

    const nilScore = Math.round(clamp(0.60 * marketSize01 + 0.25 * (affluenceScore / 100) + 0.15 * prestigeBase01, 0, 1) * 100);
    const nilConfidence = clamp(0.25 + 0.35 * (populationScores.n > 0 ? 1 : 0) + 0.35 * (incomeScores.n > 0 ? 1 : 0) + 0.05 * (rec.unitid ? 1 : 0), 0, 1);

    rec.derived_attributes.market_size_score = marketSizeScore;
    rec.derived_attributes.affluence_score = affluenceScore;
    rec.derived_attributes.alumni_halo = halo.alumni_halo;
    rec.derived_attributes.alumni_halo_confidence = halo.alumni_halo_confidence;
    rec.derived_attributes.alumni_halo_components = halo.alumni_halo_components;
    rec.derived_attributes.prestige_academic_final = finalPrestige;
    rec.derived_attributes.nil_potential_score = nilScore;
    rec.derived_attributes.nil_confidence = nilConfidence;

    addSource(rec.sources, { field: "derived_attributes.market_size_score", url: marketUrlById[rec.school_id] ?? "n/a", source_tier: "derived" });
    addSource(rec.sources, { field: "derived_attributes.affluence_score", url: marketUrlById[rec.school_id] ?? "n/a", source_tier: "derived" });
    addSource(rec.sources, { field: "derived_attributes.nil_potential_score", url: "derived:nil_market_affluence_prestige_nokey_v1", source_tier: "derived" });
    addSource(rec.sources, { field: "derived_attributes.alumni_halo", url: "derived:synthetic_signals_v1", source_tier: "derived" });
    addSource(rec.sources, { field: "derived_attributes.prestige_academic_final", url: "derived:base_plus_halo_adjustment_v1", source_tier: "derived" });
  }

  writeJson(path.join(runDir, "schools_attributes.json"), perSchool);

  const csvHeaders = [
    "school_id",
    "school_name",
    "unitid",
    "official_name",
    "city",
    "state",
    "control",
    "undergrad_enrollment",
    "market_size_score",
    "affluence_score",
    "prestige_academic_base",
    "alumni_halo",
    "prestige_academic_final",
    "nil_potential_score",
    "archetype_confidence"
  ];
  const csvLines = [csvHeaders.join(",")];
  for (const r of perSchool) {
    const rowVals = [
      r.school_id,
      r.school_name,
      r.unitid ?? "",
      r.identity.official_name ?? "",
      r.identity.city ?? "",
      r.identity.state ?? "",
      r.identity.control ?? "",
      r.raw_facts.undergrad_enrollment ?? "",
      r.derived_attributes.market_size_score ?? "",
      r.derived_attributes.affluence_score ?? "",
      r.derived_attributes.prestige_academic_base ?? "",
      r.derived_attributes.alumni_halo ?? "",
      r.derived_attributes.prestige_academic_final ?? "",
      r.derived_attributes.nil_potential_score ?? "",
      r.derived_attributes.archetype_confidence ?? ""
    ].map((v) => `\"${String(v).replaceAll('\"', '\"\"')}\"`);
    csvLines.push(rowVals.join(","));
  }
  fs.writeFileSync(path.join(runDir, "schools_attributes.csv"), csvLines.join("\n") + "\n");

  const sourcesIndex = [];
  const seen = new Set();
  for (const rec of perSchool) {
    for (const s of rec.sources) {
      const key = `${s.field}|${s.url}|${s.accessed}|${s.source_tier}`;
      if (seen.has(key)) continue;
      seen.add(key);
      sourcesIndex.push(s);
    }
  }
  writeJson(path.join(runDir, "sources_index.json"), sourcesIndex.sort((a, b) => (a.field + a.url).localeCompare(b.field + b.url)));

  const totals = {
    schools_total: perSchool.length,
    unitid_present: perSchool.filter((r) => r.unitid).length,
    enrollment_present: perSchool.filter((r) => r.raw_facts?.undergrad_enrollment != null).length,
    archetype_strong_basis: perSchool.filter((r) => String(r.derived_attributes?.archetype_method ?? "").startsWith("scorecard_")).length
  };

  const missingCounts = {};
  for (const rec of perSchool) for (const f of rec.qa.missing_fields) missingCounts[f] = (missingCounts[f] ?? 0) + 1;
  const topMissing = Object.entries(missingCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);

  const qaLines = [];
  qaLines.push(`# QA Report: ${runId}`);
  qaLines.push("");
  qaLines.push(`- Generated: ${new Date().toISOString()}`);
  qaLines.push(`- Schools: ${totals.schools_total}`);
  qaLines.push(`- With UNITID: ${totals.unitid_present}`);
  qaLines.push(`- With undergrad_enrollment (UGDS): ${totals.enrollment_present}`);
  qaLines.push(`- With archetype basis (PCIP): ${totals.archetype_strong_basis}`);
  qaLines.push("");
  qaLines.push("## Sources");
  qaLines.push(`- Scorecard mirror CSV: ${SOURCE_SCORECARD_WA_CSV}`);
  qaLines.push(`- Dataset landing page: ${SOURCE_SCORECARD_WA_DOC}`);
  qaLines.push("");
  qaLines.push("## Top Missing Fields");
  for (const [field, count] of topMissing) qaLines.push(`- ${field}: ${count}`);
  qaLines.push("");
  qaLines.push("## Notes");
  qaLines.push("- This no-key pipeline uses a public Scorecard mirror for UNITID/UGDS/PCIP and Census geocoder+ACS for market context.");
  fs.writeFileSync(path.join(runDir, "qa_report.md"), qaLines.join("\n") + "\n");

  writeJson(path.join(runDir, "run_manifest.json"), {
    run_id: runId,
    generated_at: new Date().toISOString(),
    inputs: { schoolsPath: args.schoolsPath, mappingPcipPath: args.mappingPcipPath, overridesPath: args.overridesPath },
    settings: { minDelayMs: args.minDelayMs, retries: args.retries, timeoutMs: args.timeoutMs },
    coverage: totals
  });

  console.log(`Wrote ${perSchool.length} records to ${path.join(runDir, "schools_attributes.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
