import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const TODAY = new Date().toISOString().slice(0, 10);
const DEFAULT_SCORECARD_API_KEY = "DEMO_KEY";

function parseArgs(argv) {
  const args = {
    schoolsPath: path.resolve("school list.txt"),
    overridesPath: path.resolve("data/institutional_harvester/schools_overrides.json"),
    mappingPath: path.resolve("data/institutional_harvester/program_percentage_to_archetype.json"),
    outDir: path.resolve("runs"),
    runId: null,
    apiKey: process.env.COLLEGESCORECARD_API_KEY || DEFAULT_SCORECARD_API_KEY,
    acsYear: process.env.CENSUS_ACS_YEAR || "2022",
    minDelayMs: 1500,
    retries: 2,
    timeoutMs: 20_000,
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
      case "--overrides":
        args.overridesPath = path.resolve(value);
        break;
      case "--mapping":
        args.mappingPath = path.resolve(value);
        break;
      case "--out":
        args.outDir = path.resolve(value);
        break;
      case "--run-id":
        args.runId = value;
        break;
      case "--api-key":
        args.apiKey = value;
        break;
      case "--acs-year":
        args.acsYear = value;
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

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function guessStateHint(inputName) {
  const match = inputName.match(/\(([A-Z]{2})\)\s*$/);
  return match ? match[1] : null;
}

function stableSchoolIdFromName(inputName) {
  const slug = normalizeName(inputName).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `school_${slug}`;
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

const PREFERRED_MATCHES = new Map([
  // Common NCAA shorthand -> flagship / intended brand
  ["california", { preferredNameIncludes: "university of california berkeley" }],
  ["miami", { preferredNameIncludes: "university of miami", preferredState: "FL" }],
  ["penn state", { preferredNameIncludes: "pennsylvania state university", preferredState: "PA" }]
]);

class HttpClient {
  constructor({ cacheDir, minDelayMs }) {
    this.cacheDir = cacheDir;
    this.minDelayMs = minDelayMs;
    this.lastRequestAt = 0;
  }

  async getJson(url, { retries = 3, timeoutMs = 30_000 } = {}) {
    ensureDir(this.cacheDir);
    const cacheKey = sha256(url);
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
    if (fs.existsSync(cachePath)) {
      return { data: JSON.parse(fs.readFileSync(cachePath, "utf8")), cachePath, cached: true };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      const now = Date.now();
      const wait = Math.max(0, this.minDelayMs - (now - this.lastRequestAt));
      if (wait > 0) await sleep(wait);
      this.lastRequestAt = Date.now();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { "User-Agent": "SweetSixteen-InstitutionalHarvester/1.0" },
          signal: controller.signal
        });
        const text = await res.text();

        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = null;
        }

        if (!res.ok) {
          const rateLimited = res.status === 429 || parsed?.error?.code === "OVER_RATE_LIMIT";
          const retryAfterHeader = res.headers.get("retry-after");
          const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
          const error = new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
          error.rateLimited = rateLimited;
          error.retryAfterMs = Number.isFinite(retryAfterMs) ? retryAfterMs : null;
          throw error;
        }

        if (parsed == null) throw new Error(`parse_failed: non-JSON response: ${text.slice(0, 200)}`);
        fs.writeFileSync(cachePath, JSON.stringify(parsed, null, 2) + "\n");
        clearTimeout(timeout);
        return { data: parsed, cachePath, cached: false };
      } catch (err) {
        clearTimeout(timeout);
        if (attempt === retries) throw err;
        const rateLimited = err?.rateLimited === true;
        const retryAfterMs = err?.retryAfterMs;
        const base = rateLimited ? 5_000 : 500;
        const cap = rateLimited ? 60_000 : 10_000;
        const backoff = Math.min(cap, base * 2 ** attempt);
        await sleep(Math.max(backoff, Number.isFinite(retryAfterMs) ? retryAfterMs : 0));
      }
    }
    throw new Error("Unreachable");
  }
}

function buildScorecardUrl({ apiKey, params }) {
  const base = "https://api.data.gov/ed/collegescorecard/v1/schools";
  const sp = new URLSearchParams({ api_key: apiKey, ...params });
  return `${base}?${sp.toString()}`;
}

function buildCensusAcsZctaUrl({ year, zcta5 }) {
  const base = `https://api.census.gov/data/${encodeURIComponent(year)}/acs/acs5`;
  const sp = new URLSearchParams({
    get: "B01003_001E,B19013_001E",
    for: `zip code tabulation area:${zcta5}`
  });
  return `${base}?${sp.toString()}`;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function safeNumber(v) {
  if (v == null) return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
}

function containsAny(haystack, needles) {
  for (const n of needles) if (haystack.includes(n)) return true;
  return false;
}

function roundInt(v) {
  if (v == null) return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return null;
  return Math.round(num);
}

function mapOwnership(code) {
  if (code === 1) return "public";
  if (code === 2) return "private_nonprofit";
  if (code === 3) return "private_for_profit";
  return null;
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

function deriveArchetypesFromProgramPercentages({ programPctByCategory, mapping }) {
  const archetypes = {
    tech_students: 0,
    law_students: 0,
    finance_business_students: 0,
    health_med_students: 0,
    education_students: 0,
    arts_media_students: 0,
    general_liberal_arts_students: 0
  };

  const missingCategories = [];
  for (const [category, archetype] of Object.entries(mapping.categoryToArchetype)) {
    const value = programPctByCategory[category];
    if (value == null) {
      missingCategories.push(category);
      continue;
    }
    archetypes[archetype] += value;
  }

  const hasAny = Object.values(archetypes).some((v) => v > 0);
  if (!hasAny) {
    return {
      weights: { ...mapping.baselineWeightsIfMissing },
      confidence: 0.15,
      method: "baseline_missing_program_percentages",
      missing_reason: "scorecard_program_percentages_missing"
    };
  }

  const sum = Object.values(archetypes).reduce((a, b) => a + b, 0);
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
  const confidence = clamp(0.55 + 0.40 * coverage - 0.10 * (missingCategories.length > 0 ? 1 : 0), 0, 1);
  return {
    weights: rounded,
    confidence,
    method: "scorecard_program_percentage_v1",
    missing_reason: missingCategories.length ? `missing_categories:${missingCategories.slice(0, 5).join(",")}` : null
  };
}

function derivePrestigeBase({ highestDegree, gradShare, admissionRate }) {
  const components = [];

  const doctoral = highestDegree != null && Number(highestDegree) >= 4 ? 1 : 0;
  components.push({ value: doctoral, weight: 0.45, present: highestDegree != null });

  const gradSharePresent = typeof gradShare === "number" && Number.isFinite(gradShare);
  components.push({ value: gradSharePresent ? clamp(gradShare, 0, 1) : null, weight: 0.35, present: gradSharePresent });

  const admissionPresent = typeof admissionRate === "number" && Number.isFinite(admissionRate);
  const selectivity = admissionPresent ? clamp(1 - admissionRate, 0, 1) : null;
  components.push({ value: selectivity, weight: 0.20, present: admissionPresent });

  const presentWeight = components.filter((c) => c.present).reduce((a, c) => a + c.weight, 0);
  if (presentWeight === 0) {
    return {
      prestige_academic_base: 50,
      prestige_base_confidence: 0.2,
      prestige_base_method: "default_midpoint_missing_proxies"
    };
  }

  const weighted = components.reduce((a, c) => a + (c.present ? c.weight * c.value : 0), 0);
  const normalized = weighted / presentWeight;
  const score = Math.round(100 * clamp(normalized, 0, 1));
  const confidence = clamp(0.35 + 0.55 * presentWeight, 0, 1);
  return {
    prestige_academic_base: score,
    prestige_base_confidence: confidence,
    prestige_base_method: "scorecard_proxies_v1"
  };
}

function computeAlumniHalo({
  totalEnrollment,
  gradShare,
  pathwaysCount,
  researchIntensityScore,
  prestigeAcademicBase01,
  marketSize01,
  archetypeBalance01
}) {
  const logEnrollment = totalEnrollment == null ? null : Math.log10(totalEnrollment + 1);
  const appPresent = logEnrollment != null && gradShare != null;
  const app = appPresent ? clamp(0.60 * (logEnrollment / Math.log10(100_000 + 1)) + 0.40 * clamp(gradShare, 0, 1), 0, 1) : null;

  const abpPresent = typeof pathwaysCount === "number";
  let abp = abpPresent ? clamp(pathwaysCount / 4, 0, 1) : null;
  if (abp != null && archetypeBalance01 != null) abp = clamp(abp * 0.75 + archetypeBalance01 * 0.25, 0, 1);

  const irPresent = researchIntensityScore != null && prestigeAcademicBase01 != null && marketSize01 != null;
  const ir = irPresent ? clamp(0.50 * researchIntensityScore + 0.30 * prestigeAcademicBase01 + 0.20 * marketSize01, 0, 1) : null;

  const parts = [
    { value: app, weight: 0.40 },
    { value: abp, weight: 0.35 },
    { value: ir, weight: 0.25 }
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

async function main() {
  const args = parseArgs(process.argv);
  const runId = args.runId ?? new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(args.outDir, runId);
  ensureDir(runDir);

  const cacheDir = path.resolve(".cache/http");
  const http = new HttpClient({ cacheDir, minDelayMs: args.minDelayMs });

  const mapping = JSON.parse(fs.readFileSync(args.mappingPath, "utf8"));
  const overridesFile = readJsonIfExists(args.overridesPath);
  const overrides = new Map();
  for (const entry of overridesFile?.overrides ?? []) overrides.set(entry.input_school_name, entry);

  const schoolLines = fs
    .readFileSync(args.schoolsPath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const selectedSchoolLines = args.maxSchools != null ? schoolLines.slice(0, args.maxSchools) : schoolLines;

  const stage1 = selectedSchoolLines.map((inputName) => ({
    school_id: stableSchoolIdFromName(inputName),
    school_name: inputName,
    common_name: inputName,
    state_hint: guessStateHint(inputName)
  }));

  const scorecardProgramFields = Object.keys(mapping.categoryToArchetype).map((k) => `latest.academics.program_percentage.${k}`);
  const scorecardFields = [
    "id",
    "school.name",
    "school.city",
    "school.state",
    "school.zip",
    "school.ownership",
    "school.locale",
    "school.degrees_awarded.highest",
    "latest.student.size",
    "latest.student.grad_students",
    "latest.admissions.admission_rate.overall",
    "latest.student.faculty_ratio",
    "location.lat",
    "location.lon",
    ...scorecardProgramFields
  ].join(",");

  const identityResults = [];
  const identityUrlBySchoolId = {};
  for (const row of stage1) {
    const override = overrides.get(row.school_name);
    if (override?.force_unitid) {
      const forcedUnitid = String(override.force_unitid);
      const url = buildScorecardUrl({ apiKey: args.apiKey, params: { id: forcedUnitid, per_page: "1", fields: scorecardFields } });
      identityUrlBySchoolId[row.school_id] = url;
      let record = null;
      try {
        const json = (await http.getJson(url, { retries: args.retries, timeoutMs: args.timeoutMs })).data;
        record = (json.results ?? [])[0] ?? null;
      } catch {
        record = null;
      }
      identityResults.push({
        ...row,
        unitid: record?.id != null ? String(record.id) : forcedUnitid,
        scorecard_record: record,
        identity_resolution: { status: "overridden", confidence: record ? 1 : 0.7, chosen_reason: "force_unitid" }
      });
      continue;
    }

    const url = buildScorecardUrl({
      apiKey: args.apiKey,
      params: {
        "school.search": row.school_name,
        per_page: "25",
        fields: scorecardFields
      }
    });
    identityUrlBySchoolId[row.school_id] = url;

    let json;
    try {
      json = (await http.getJson(url, { retries: args.retries, timeoutMs: args.timeoutMs })).data;
    } catch (err) {
      identityResults.push({
        ...row,
        unitid: null,
        identity_resolution: { status: "error", error_class: "fetch_failed", message: String(err), confidence: 0 }
      });
      continue;
    }

    const candidates = json.results ?? [];
    const inputNorm = normalizeName(row.school_name);
    const inputTokens = tokenize(inputNorm);
    const stateHint = row.state_hint;
    const isStateInput = STATE_NAME_SET.has(inputNorm);
    const preferred = PREFERRED_MATCHES.get(inputNorm) ?? null;

    const scored = candidates
      .map((c) => {
        const candName = c["school.name"] ?? "";
        const candState = c["school.state"] ?? null;
        const candNorm = normalizeName(candName);
        const candTokens = tokenize(candNorm);
        const sim = jaccardSimilarity(inputTokens, candTokens);
        const prefixBoost = candNorm.startsWith(inputNorm) || inputNorm.startsWith(candNorm) ? 0.15 : 0;
        const stateBoost = stateHint && candState === stateHint ? 0.1 : 0;
        const statePenalty = stateHint && candState && candState !== stateHint ? -0.15 : 0;

        const size = safeNumber(c["latest.student.size"]);
        const enrollmentBoost = size == null ? 0 : 0.07 * clamp(Math.log10(size + 1) / 5, 0, 1);

        const lowValuePenalty = containsAny(candNorm, ["community college", "technical college", "career", "beauty", "cosmetology"]) ? -0.35 : 0;
        const stateUniPenalty = !inputNorm.includes("state") && candNorm.includes("state university") ? -0.08 : 0;

        let flagshipBoost = 0;
        if (isStateInput) {
          const uniOf = `university of ${inputNorm}`;
          const theUniOf = `the university of ${inputNorm}`;
          if (candNorm === uniOf || candNorm === theUniOf) flagshipBoost = 0.45;
          else if (candNorm.startsWith(uniOf) || candNorm.startsWith(theUniOf)) flagshipBoost = 0.25;
          if (candNorm.startsWith(`${inputNorm} state university`) || candNorm === `${inputNorm} state university`) flagshipBoost -= 0.20;
        }

        let preferredBoost = 0;
        if (preferred?.preferredState && candState === preferred.preferredState) preferredBoost += 0.12;
        if (preferred?.preferredNameIncludes && candNorm.includes(normalizeName(preferred.preferredNameIncludes))) preferredBoost += 0.30;

        const score = sim + prefixBoost + stateBoost + statePenalty + enrollmentBoost + flagshipBoost + preferredBoost + lowValuePenalty + stateUniPenalty;
        return { c, score, candName, candState, size };
      })
      .sort((a, b) => (b.score - a.score) || ((b.size ?? 0) - (a.size ?? 0)) || String(a.c.id).localeCompare(String(b.c.id)));

    const best = scored[0];
    const second = scored[1];

    if (!best || best.score < 0.25) {
      identityResults.push({
        ...row,
        unitid: null,
        identity_resolution: {
          status: "not_found",
          confidence: 0,
          error_class: "not_found",
          candidates: scored.slice(0, 5).map((s) => ({ unitid: s.c.id, name: s.candName, state: s.candState, score: s.score }))
        }
      });
      continue;
    }

    const margin = second ? best.score - second.score : best.score;
    const confidence = clamp(0.40 + 0.60 * clamp(margin / 0.40, 0, 1), 0, 1);
    const ambiguous = second && margin < 0.08;

    identityResults.push({
      ...row,
      unitid: ambiguous ? null : String(best.c.id),
      scorecard_record: ambiguous ? null : best.c,
      identity_resolution: {
        status: ambiguous ? "ambiguous" : "resolved",
        confidence: ambiguous ? confidence * 0.5 : confidence,
        chosen: ambiguous
          ? null
          : {
              unitid: String(best.c.id),
              school_name: best.c["school.name"] ?? null,
              city: best.c["school.city"] ?? null,
              state: best.c["school.state"] ?? null
            },
        candidates: scored.slice(0, 5).map((s) => ({ unitid: s.c.id, name: s.candName, state: s.candState, score: s.score }))
      }
    });
  }

  writeJson(path.join(runDir, "resolved_identity.json"), {
    run_id: runId,
    generated_at: new Date().toISOString(),
    sources: { scorecard: "https://api.data.gov/ed/collegescorecard/v1/schools" },
    records: identityResults,
    identity_requests: identityUrlBySchoolId
  });

  const perSchool = [];
  const censusUrlById = {};

  for (const row of identityResults) {
    const sources = [];
    const missingFields = [];
    const notes = [];

    if (!row.unitid) {
      missingFields.push("unitid");
      notes.push(`identity_resolution:${row.identity_resolution?.status ?? "unknown"}`);
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

    const dataUrl = identityUrlBySchoolId[row.school_id] ?? null;
    const record = row.scorecard_record ?? null;

    if (!record) {
      missingFields.push("scorecard_record");
      perSchool.push({
        school_id: row.school_id,
        school_name: row.school_name,
        unitid: row.unitid,
        identity: { official_name: null, city: null, state: null, control: null, campus_setting: null, lat: null, lon: null, region: null },
        raw_facts: {},
        market_context: {},
        derived_attributes: {
          archetype_weights: mapping.baselineWeightsIfMissing,
          archetype_confidence: 0.15,
          archetype_method: "baseline_missing_scorecard_record",
          prestige_academic_base: 50,
          prestige_base_method: "default_midpoint_missing_scorecard_record",
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

    const officialName = record["school.name"] ?? null;
    const city = record["school.city"] ?? null;
    const state = record["school.state"] ?? null;
    const zip = record["school.zip"] ?? null;
    const ownership = safeNumber(record["school.ownership"]);
    const locale = safeNumber(record["school.locale"]);
    const lat = safeNumber(record["location.lat"]);
    const lon = safeNumber(record["location.lon"]);
    const highestDegree = safeNumber(record["school.degrees_awarded.highest"]);

    addSource(sources, { field: "identity.official_name", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "identity.city", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "identity.state", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "identity.control", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "identity.campus_setting", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "identity.lat", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "identity.lon", url: dataUrl ?? "n/a", source_tier: "reputable" });

    const totalEnrollment = safeNumber(record["latest.student.size"]);
    const gradEnrollment = safeNumber(record["latest.student.grad_students"]);
    const undergradEnrollment = totalEnrollment != null && gradEnrollment != null && totalEnrollment >= gradEnrollment ? totalEnrollment - gradEnrollment : null;
    const admissionRate = safeNumber(record["latest.admissions.admission_rate.overall"]);
    const studentFacultyRatio = safeNumber(record["latest.student.faculty_ratio"]);

    if (totalEnrollment == null) missingFields.push("raw_facts.total_enrollment");
    if (gradEnrollment == null) missingFields.push("raw_facts.grad_enrollment");
    addSource(sources, { field: "raw_facts.highest_degree_awarded", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.total_enrollment", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.grad_enrollment", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.acceptance_rate", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.student_faculty_ratio", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.program_percentages", url: dataUrl ?? "n/a", source_tier: "reputable" });
    addSource(sources, { field: "raw_facts.undergrad_enrollment", url: dataUrl ?? "n/a", source_tier: "derived" });

    const programPctByCategory = {};
    for (const category of Object.keys(mapping.categoryToArchetype)) {
      programPctByCategory[category] = safeNumber(record[`latest.academics.program_percentage.${category}`]);
    }
    const archetype = deriveArchetypesFromProgramPercentages({ programPctByCategory, mapping });
    addSource(sources, { field: "derived_attributes.archetype_weights", url: dataUrl ?? "n/a", source_tier: "derived" });

    const gradShare = totalEnrollment != null && gradEnrollment != null && totalEnrollment > 0 ? gradEnrollment / totalEnrollment : null;
    const prestigeBase = derivePrestigeBase({ highestDegree, gradShare, admissionRate });
    addSource(sources, { field: "derived_attributes.prestige_academic_base", url: dataUrl ?? "n/a", source_tier: "derived" });

    const region = regionFromState(state);
    addSource(sources, { field: "identity.region", url: "https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf", source_tier: "reputable" });

    const zcta5 = zip ? String(zip).slice(0, 5) : null;
    let zctaPopulation = null;
    let zctaIncome = null;
    if (!zcta5 || !/^[0-9]{5}$/.test(zcta5)) {
      missingFields.push("market_context.zcta_population");
      missingFields.push("market_context.zcta_median_household_income");
      notes.push("census_missing_or_invalid_zip");
    } else {
      const censusUrl = buildCensusAcsZctaUrl({ year: args.acsYear, zcta5 });
      censusUrlById[row.school_id] = censusUrl;
      try {
        const json = (await http.getJson(censusUrl, { retries: args.retries, timeoutMs: args.timeoutMs })).data;
        const row2 = Array.isArray(json) && Array.isArray(json[1]) ? json[1] : null;
        zctaPopulation = row2 ? safeNumber(row2[0]) : null;
        zctaIncome = row2 ? safeNumber(row2[1]) : null;
        if (zctaPopulation == null) missingFields.push("market_context.zcta_population");
        if (zctaIncome == null) missingFields.push("market_context.zcta_median_household_income");
        addSource(sources, { field: "market_context.*", url: censusUrl, source_tier: "reputable" });
      } catch (err) {
        notes.push(`census_fetch_failed:${String(err).slice(0, 80)}`);
      }
    }

    const control = mapOwnership(ownership);
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
        highest_degree_awarded: highestDegree,
        undergrad_enrollment: roundInt(undergradEnrollment),
        grad_enrollment: roundInt(gradEnrollment),
        total_enrollment: roundInt(totalEnrollment),
        acceptance_rate: admissionRate,
        student_faculty_ratio: studentFacultyRatio,
        program_percentages: programPctByCategory,
        professional_schools: {
          has_law_school: null,
          has_medical_school: null,
          has_business_school: null,
          has_engineering_school: null,
          has_nursing_program: null,
          missing_reason: "no_defensible_school_level_dataset_connected_in_v1"
        }
      },
      market_context: {
        zcta5,
        zcta_population: zctaPopulation,
        zcta_median_household_income: zctaIncome
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

  const populationById = {};
  const incomeById = {};
  for (const rec of perSchool) {
    populationById[rec.school_id] = rec.market_context?.zcta_population ?? null;
    incomeById[rec.school_id] = rec.market_context?.zcta_median_household_income ?? null;
  }
  const populationScores = percentileScores(populationById);
  const incomeScores = percentileScores(incomeById);

  for (const rec of perSchool) {
    const marketSizeScore = populationScores.scores[rec.school_id] ?? 50;
    const affluenceScore = incomeScores.scores[rec.school_id] ?? 50;
    const marketSize01 = marketSizeScore / 100;
    const prestigeBase01 = rec.derived_attributes.prestige_academic_base / 100;

    const totalEnrollment = rec.raw_facts.total_enrollment ?? null;
    const gradEnrollment = rec.raw_facts.grad_enrollment ?? null;
    const gradShare = totalEnrollment != null && gradEnrollment != null && totalEnrollment > 0 ? gradEnrollment / totalEnrollment : null;

    const highestDegree = rec.raw_facts.highest_degree_awarded ?? null;
    const researchIntensityScore = highestDegree != null ? (Number(highestDegree) >= 4 ? 1 : Number(highestDegree) >= 3 ? 0.6 : 0.3) : null;

    const gini = giniFromWeights(rec.derived_attributes.archetype_weights);
    const archetypeBalance01 = gini == null ? null : clamp(1 - gini, 0, 1);

    const halo = computeAlumniHalo({
      totalEnrollment,
      gradShare,
      pathwaysCount: null,
      researchIntensityScore,
      prestigeAcademicBase01: prestigeBase01,
      marketSize01,
      archetypeBalance01
    });

    const haloAdjustment = clamp((halo.alumni_halo - 50) * 0.2, -8, 10);
    const finalPrestige = clamp(Math.round(rec.derived_attributes.prestige_academic_base + haloAdjustment), 0, 100);

    const nilScore = Math.round(clamp(0.55 * marketSize01 + 0.30 * (affluenceScore / 100) + 0.15 * prestigeBase01, 0, 1) * 100);
    const nilConfidence = clamp(0.25 + 0.35 * (populationScores.n > 0 ? 1 : 0) + 0.35 * (incomeScores.n > 0 ? 1 : 0) + 0.05 * (rec.unitid ? 1 : 0), 0, 1);

    rec.derived_attributes.market_size_score = marketSizeScore;
    rec.derived_attributes.affluence_score = affluenceScore;
    rec.derived_attributes.alumni_halo = halo.alumni_halo;
    rec.derived_attributes.alumni_halo_confidence = halo.alumni_halo_confidence;
    rec.derived_attributes.alumni_halo_components = halo.alumni_halo_components;
    rec.derived_attributes.prestige_academic_final = finalPrestige;
    rec.derived_attributes.nil_potential_score = nilScore;
    rec.derived_attributes.nil_confidence = nilConfidence;

    addSource(rec.sources, { field: "derived_attributes.market_size_score", url: censusUrlById[rec.school_id] ?? "n/a", source_tier: "derived" });
    addSource(rec.sources, { field: "derived_attributes.affluence_score", url: censusUrlById[rec.school_id] ?? "n/a", source_tier: "derived" });
    addSource(rec.sources, { field: "derived_attributes.nil_potential_score", url: "derived:nil_market_affluence_prestige_v1", source_tier: "derived" });
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
    "total_enrollment",
    "grad_enrollment",
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
    const row = [
      r.school_id,
      r.school_name,
      r.unitid ?? "",
      r.identity.official_name ?? "",
      r.identity.city ?? "",
      r.identity.state ?? "",
      r.identity.control ?? "",
      r.raw_facts.total_enrollment ?? "",
      r.raw_facts.grad_enrollment ?? "",
      r.derived_attributes.market_size_score ?? "",
      r.derived_attributes.affluence_score ?? "",
      r.derived_attributes.prestige_academic_base ?? "",
      r.derived_attributes.alumni_halo ?? "",
      r.derived_attributes.prestige_academic_final ?? "",
      r.derived_attributes.nil_potential_score ?? "",
      r.derived_attributes.archetype_confidence ?? ""
    ].map((v) => `\"${String(v).replaceAll('\"', '\"\"')}\"`);
    csvLines.push(row.join(","));
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
    enrollment_present: perSchool.filter((r) => r.raw_facts?.total_enrollment != null).length,
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
  qaLines.push(`- With total_enrollment: ${totals.enrollment_present}`);
  qaLines.push(`- With archetype basis (scorecard program %): ${totals.archetype_strong_basis}`);
  qaLines.push("");
  qaLines.push("## Top Missing Fields");
  for (const [field, count] of topMissing) qaLines.push(`- ${field}: ${count}`);
  qaLines.push("");
  qaLines.push("## Notes");
  qaLines.push("- Professional school flags are null in v1 (no defensible dataset wired).");
  qaLines.push("- Market context uses ACS ZCTA estimates keyed by the institution ZIP.");
  fs.writeFileSync(path.join(runDir, "qa_report.md"), qaLines.join("\n") + "\n");

  writeJson(path.join(runDir, "run_manifest.json"), {
    run_id: runId,
    generated_at: new Date().toISOString(),
    inputs: { schoolsPath: args.schoolsPath, overridesPath: args.overridesPath, mappingPath: args.mappingPath },
    settings: { apiKeyProvided: args.apiKey !== "DEMO_KEY", acsYear: args.acsYear, minDelayMs: args.minDelayMs, retries: args.retries, timeoutMs: args.timeoutMs },
    coverage: totals
  });

  console.log(`Wrote ${perSchool.length} records to ${path.join(runDir, "schools_attributes.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
