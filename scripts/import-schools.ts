import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/db/prisma";
import {
  ALL_GRADES,
  PREPRIMARY_GRADES,
  PRIMARY_GRADES,
} from "../lib/scoring/flow";

interface CsvRow {
  schoolName: string;
  slug: string | null;
  linkSlug: string | null;
  logoUrl: string | null;
  primaryColorHex: string | null;
  isActive: boolean;
  gradeBand: "preprimary" | "primary" | "all";
  allowedGrades: string[] | null;
  landingTitle: string | null;
  landingDescription: string | null;
}

interface ParsedArgs {
  filePath: string;
  dryRun: boolean;
}

function printUsage(): void {
  console.log(`Usage:
  npx tsx scripts/import-schools.ts --file <csv-path> [--dry-run]

CSV headers (case-insensitive):
  school_name (required)
  slug (optional)
  link_slug (optional, defaults to school slug)
  logo_url (optional)
  primary_color_hex (optional)
  is_active (optional: true/false, defaults to true)
  grade_band (optional: preprimary|primary|all, defaults to all)
  allowed_grades (optional, exact grade names separated by | or ,)
  landing_title (optional)
  landing_description (optional)

Example:
  npx tsx scripts/import-schools.ts --file scripts/data/schools.sample.csv --dry-run
  npx tsx scripts/import-schools.ts --file scripts/data/schools.sample.csv
`);
}

function parseArgs(argv: string[]): ParsedArgs {
  let filePath = "";
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--file") {
      filePath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  if (!filePath) {
    throw new Error('Missing required --file argument. Use "--help" for usage.');
  }

  return {
    filePath,
    dryRun,
  };
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      currentCell = "";
      if (currentRow.some((cell) => cell.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (currentRow.some((cell) => cell.trim() !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function slugify(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!normalized) {
    throw new Error(`Could not generate slug from "${value}".`);
  }

  return normalized;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value || value.trim() === "") {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value "${value}". Expected true/false.`);
}

function parseGradeBand(value: string | undefined): "preprimary" | "primary" | "all" {
  if (!value || value.trim() === "") {
    return "all";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "preprimary" || normalized === "primary" || normalized === "all") {
    return normalized;
  }

  throw new Error(
    `Invalid grade_band "${value}". Use one of: preprimary, primary, all.`,
  );
}

function splitList(value: string): string[] {
  if (value.includes("|")) {
    return value
      .split("|")
      .map((part) => part.trim())
      .filter((part) => part !== "");
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function parseAllowedGrades(value: string | undefined): string[] | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const candidate = splitList(value);
  const allowedSet = new Set<string>(ALL_GRADES);
  for (const grade of candidate) {
    if (!allowedSet.has(grade)) {
      throw new Error(
        `Invalid grade "${grade}" in allowed_grades. Allowed: ${ALL_GRADES.join(", ")}`,
      );
    }
  }

  return candidate;
}

function defaultAllowedGrades(gradeBand: "preprimary" | "primary" | "all"): string[] {
  if (gradeBand === "preprimary") {
    return [...PREPRIMARY_GRADES];
  }
  if (gradeBand === "primary") {
    return [...PRIMARY_GRADES];
  }
  return [...ALL_GRADES];
}

function defaultLandingDescription(schoolName: string, gradeBand: CsvRow["gradeBand"]): string {
  if (gradeBand === "preprimary") {
    return `School-branded check-up link for ${schoolName} parents (Pre-primary grades only).`;
  }
  if (gradeBand === "primary") {
    return `School-branded check-up link for ${schoolName} parents (Primary grades only).`;
  }
  return `School-branded check-up link for ${schoolName} parents.`;
}

function mapRows(records: Record<string, string>[]): CsvRow[] {
  return records.map((record, index) => {
    const rowNumber = index + 2;
    const schoolName = (record.school_name ?? "").trim();
    if (!schoolName) {
      throw new Error(`Row ${rowNumber}: school_name is required.`);
    }

    const gradeBand = parseGradeBand(record.grade_band);
    const parsedAllowedGrades = parseAllowedGrades(record.allowed_grades);

    return {
      schoolName,
      slug: record.slug?.trim() ? slugify(record.slug.trim()) : null,
      linkSlug: record.link_slug?.trim() ? slugify(record.link_slug.trim()) : null,
      logoUrl: record.logo_url?.trim() || null,
      primaryColorHex: record.primary_color_hex?.trim() || null,
      isActive: parseBoolean(record.is_active),
      gradeBand,
      allowedGrades: parsedAllowedGrades,
      landingTitle: record.landing_title?.trim() || null,
      landingDescription: record.landing_description?.trim() || null,
    };
  });
}

function toRecords(parsed: string[][]): Record<string, string>[] {
  if (parsed.length < 2) {
    throw new Error("CSV must have a header row and at least one data row.");
  }

  const headers = parsed[0].map(normalizeHeader);
  if (!headers.includes("school_name")) {
    throw new Error('CSV header must include "school_name".');
  }

  return parsed.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (row[index] ?? "").trim();
    });
    return record;
  });
}

function ensureNoInputDuplicates(rows: CsvRow[]): void {
  const schoolSlugSet = new Set<string>();
  const linkSlugSet = new Set<string>();

  rows.forEach((row, index) => {
    const schoolSlug = row.slug ?? slugify(row.schoolName);
    const linkSlug = row.linkSlug ?? schoolSlug;
    const rowNumber = index + 2;

    if (schoolSlugSet.has(schoolSlug)) {
      throw new Error(`Row ${rowNumber}: duplicate school slug "${schoolSlug}" in CSV.`);
    }
    schoolSlugSet.add(schoolSlug);

    if (linkSlugSet.has(linkSlug)) {
      throw new Error(`Row ${rowNumber}: duplicate link slug "${linkSlug}" in CSV.`);
    }
    linkSlugSet.add(linkSlug);
  });
}

async function main() {
  const { filePath, dryRun } = parseArgs(process.argv.slice(2));
  const absolutePath = path.resolve(process.cwd(), filePath);
  const csvText = await readFile(absolutePath, "utf8");
  const parsed = parseCsv(csvText);
  const records = toRecords(parsed);
  const rows = mapRows(records);
  ensureNoInputDuplicates(rows);

  let createdSchools = 0;
  let updatedSchools = 0;
  let createdLinks = 0;
  let updatedLinks = 0;

  for (const row of rows) {
    const schoolSlug = row.slug ?? slugify(row.schoolName);
    const linkSlug = row.linkSlug ?? schoolSlug;
    const allowedGrades = row.allowedGrades ?? defaultAllowedGrades(row.gradeBand);
    const landingTitle =
      row.landingTitle ?? `${row.schoolName} x Brainmoto Check-Up`;
    const landingDescription =
      row.landingDescription ??
      defaultLandingDescription(row.schoolName, row.gradeBand);

    const existingSchool = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true },
    });
    const existingLink = await prisma.checkupLink.findUnique({
      where: { slug: linkSlug },
      select: { id: true, schoolId: true, sourceType: true },
    });

    if (existingLink && existingLink.sourceType !== "SCHOOL") {
      throw new Error(
        `Link slug "${linkSlug}" already exists as non-school source type (${existingLink.sourceType}).`,
      );
    }

    if (dryRun) {
      console.log(
        `[DRY-RUN] school="${row.schoolName}" schoolSlug="${schoolSlug}" linkSlug="${linkSlug}" grades="${allowedGrades.join("|")}" active=${row.isActive}`,
      );
      createdSchools += existingSchool ? 0 : 1;
      updatedSchools += existingSchool ? 1 : 0;
      createdLinks += existingLink ? 0 : 1;
      updatedLinks += existingLink ? 1 : 0;
      continue;
    }

    const school = await prisma.school.upsert({
      where: { slug: schoolSlug },
      update: {
        name: row.schoolName,
        logoUrl: row.logoUrl,
        primaryColorHex: row.primaryColorHex,
        isActive: row.isActive,
      },
      create: {
        name: row.schoolName,
        slug: schoolSlug,
        logoUrl: row.logoUrl,
        primaryColorHex: row.primaryColorHex,
        isActive: row.isActive,
      },
    });

    if (existingLink && existingLink.schoolId && existingLink.schoolId !== school.id) {
      throw new Error(
        `Link slug "${linkSlug}" is already connected to another school. Resolve manually before import.`,
      );
    }

    await prisma.checkupLink.upsert({
      where: { slug: linkSlug },
      update: {
        sourceType: "SCHOOL",
        schoolId: school.id,
        landingTitle,
        landingDescription,
        allowedGrades,
        isActive: row.isActive,
      },
      create: {
        slug: linkSlug,
        sourceType: "SCHOOL",
        schoolId: school.id,
        landingTitle,
        landingDescription,
        allowedGrades,
        isActive: row.isActive,
      },
    });

    createdSchools += existingSchool ? 0 : 1;
    updatedSchools += existingSchool ? 1 : 0;
    createdLinks += existingLink ? 0 : 1;
    updatedLinks += existingLink ? 1 : 0;
  }

  console.log("");
  console.log(
    `${dryRun ? "Dry-run summary" : "Import summary"}: schools created=${createdSchools}, schools updated=${updatedSchools}, links created=${createdLinks}, links updated=${updatedLinks}.`,
  );
}

main()
  .catch((error) => {
    console.error("School import failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
