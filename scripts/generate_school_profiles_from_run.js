import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    runDir: null,
    inputJson: null,
    outPath: path.resolve("data/institutional_harvester/school_profiles.nokey.generated.ts")
  };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const [key, rawValue] = token.includes("=") ? token.split("=", 2) : [token, null];
    const value = rawValue ?? argv[++i];
    switch (key) {
      case "--run":
        args.runDir = value;
        break;
      case "--input":
        args.inputJson = value;
        break;
      case "--out":
        args.outPath = path.resolve(value);
        break;
      default:
        throw new Error(`Unknown arg: ${key}`);
    }
  }
  return args;
}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function pickProfile(rec) {
  const market = rec.market_context ?? {};
  const derived = rec.derived_attributes ?? {};
  const facts = rec.raw_facts ?? {};

  const profile = {
    unitid: rec.unitid ?? null,
    prestigeAcademicFinal: isFiniteNumber(derived.prestige_academic_final) ? derived.prestige_academic_final : null,
    prestigeAcademicBase: isFiniteNumber(derived.prestige_academic_base) ? derived.prestige_academic_base : null,
    alumniHalo: isFiniteNumber(derived.alumni_halo) ? derived.alumni_halo : null,
    nilPotentialScore: isFiniteNumber(derived.nil_potential_score) ? derived.nil_potential_score : null,
    marketSizeScore: isFiniteNumber(derived.market_size_score) ? derived.market_size_score : null,
    affluenceScore: isFiniteNumber(derived.affluence_score) ? derived.affluence_score : null,
    archetypeWeights: derived.archetype_weights ?? null,

    undergradEnrollment: isFiniteNumber(facts.undergrad_enrollment) ? facts.undergrad_enrollment : null,
    pctPell: isFiniteNumber(facts.pct_pell) ? facts.pct_pell : null,
    pctFederalLoan: isFiniteNumber(facts.pct_federal_loan) ? facts.pct_federal_loan : null,
    retentionFt4: isFiniteNumber(facts.retention_ft4) ? facts.retention_ft4 : null,
    completionRate150pct4yr: isFiniteNumber(facts.completion_rate_150pct_4yr) ? facts.completion_rate_150pct_4yr : null,
    medianEarnings10yr: isFiniteNumber(facts.median_earnings_10yr) ? facts.median_earnings_10yr : null,
    gradDebtMedian: isFiniteNumber(facts.grad_debt_median) ? facts.grad_debt_median : null,

    cityPopulation: isFiniteNumber(market.city_population) ? market.city_population : null,
    cityMedianHouseholdIncome: isFiniteNumber(market.city_median_household_income) ? market.city_median_household_income : null,
    countyPopulation: isFiniteNumber(market.county_population) ? market.county_population : null,
    countyMedianHouseholdIncome: isFiniteNumber(market.county_median_household_income) ? market.county_median_household_income : null,
    marketBasis: market.market_basis ?? null
  };

  const hasAny = Object.values(profile).some((v) => v != null);
  return hasAny ? profile : null;
}

function stableStringify(obj) {
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  const parts = [];
  for (const k of keys) {
    parts.push(`${JSON.stringify(k)}: ${JSON.stringify(obj[k])}`);
  }
  return `{ ${parts.join(", ")} }`;
}

function writeGeneratedTs(outPath, mapping) {
  const header = [
    "/* eslint-disable */",
    "// AUTO-GENERATED. Source: runs/<run_id>/schools_attributes.json (no-key harvester).",
    "export type SchoolInstitutionalProfile = {",
    "  unitid: string | null;",
    "  prestigeAcademicFinal: number | null;",
    "  prestigeAcademicBase: number | null;",
    "  alumniHalo: number | null;",
    "  nilPotentialScore: number | null;",
    "  marketSizeScore: number | null;",
    "  affluenceScore: number | null;",
    "  archetypeWeights: Record<string, number> | null;",
    "  undergradEnrollment: number | null;",
    "  pctPell: number | null;",
    "  pctFederalLoan: number | null;",
    "  retentionFt4: number | null;",
    "  completionRate150pct4yr: number | null;",
    "  medianEarnings10yr: number | null;",
    "  gradDebtMedian: number | null;",
    "  cityPopulation: number | null;",
    "  cityMedianHouseholdIncome: number | null;",
    "  countyPopulation: number | null;",
    "  countyMedianHouseholdIncome: number | null;",
    "  marketBasis: string | null;",
    "};",
    "",
    "export const SCHOOL_INSTITUTIONAL_PROFILES: Record<string, SchoolInstitutionalProfile> = {"
  ];

  const lines = [...header];
  const names = Object.keys(mapping).sort((a, b) => a.localeCompare(b));
  for (const name of names) {
    lines.push(`  ${JSON.stringify(name)}: ${stableStringify(mapping[name])},`);
  }
  lines.push("};");
  lines.push("");

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n") + "\n");
}

function main() {
  const args = parseArgs(process.argv);
  let inputPath = args.inputJson;
  if (!inputPath) {
    if (!args.runDir) throw new Error("Provide --run <runs/<id>> or --input <path/to/schools_attributes.json>");
    inputPath = path.join(args.runDir, "schools_attributes.json");
  }

  const records = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const mapping = {};
  for (const rec of records) {
    const key = rec.school_name;
    if (!key) continue;
    if (!rec.unitid) continue;
    const profile = pickProfile(rec);
    if (!profile) continue;
    mapping[key] = profile;
  }

  writeGeneratedTs(args.outPath, mapping);
  console.log(`Wrote ${Object.keys(mapping).length} profiles to ${args.outPath}`);
}

main();

