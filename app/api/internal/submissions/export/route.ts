import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 5000;
const MAX_OFFSET = 1_000_000;
const DISPLAY_TIME_ZONE = "Asia/Kolkata";

interface ExportRow {
  submissionId: string;
  createdAtUtc: string;
  createdAtIst: string;
  sourceType: string;
  checkupSlug: string;
  contextName: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string | null;
  grade: string;
  gradeBand: string;
  schoolName: string | null;
  division: string | null;
  housingSocietyName: string | null;
  finalScore: number;
  finalLevel: string;
  retakeNumber: number;
  resultToken: string;
  resultUrl: string;
  reportToken: string | null;
  reportUrl: string | null;
  downloadReportUrl: string | null;
  emailStatus: string | null;
  emailSentAtUtc: string | null;
  pdfStatus: string | null;
  pdfBlobUrl: string | null;
}

function getConfiguredAdminKey(): string | null {
  const value = process.env.INTERNAL_ADMIN_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

function getAppBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) {
    return "http://localhost:3000";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeLimit(value: string | null): number {
  if (!value) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.trunc(parsed), MAX_LIMIT);
}

function normalizeOffset(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(Math.trunc(parsed), MAX_OFFSET);
}

function formatDateTimeIst(value: Date): string {
  return `${new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(value)} IST`;
}

function prettifySubmissionLevel(level: string): string {
  switch (level) {
    case "DOING_WELL":
      return "Doing Well";
    case "STILL_DEVELOPING":
      return "Still Developing";
    case "REQUIRES_SUPPORT":
      return "Requires Support";
    default:
      return level;
  }
}

function csvEscape(value: string | number | null): string {
  if (value === null) {
    return "";
  }

  const str = String(value);
  if (!/[",\n]/.test(str)) {
    return str;
  }

  return `"${str.replace(/"/g, "\"\"")}"`;
}

function toCsv(rows: ExportRow[]): string {
  const header: Array<keyof ExportRow> = [
    "submissionId",
    "createdAtUtc",
    "createdAtIst",
    "sourceType",
    "checkupSlug",
    "contextName",
    "childName",
    "parentName",
    "parentEmail",
    "parentWhatsapp",
    "grade",
    "gradeBand",
    "schoolName",
    "division",
    "housingSocietyName",
    "finalScore",
    "finalLevel",
    "retakeNumber",
    "resultToken",
    "resultUrl",
    "reportToken",
    "reportUrl",
    "downloadReportUrl",
    "emailStatus",
    "emailSentAtUtc",
    "pdfStatus",
    "pdfBlobUrl",
  ];

  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((column) => csvEscape(row[column])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

export async function GET(request: Request): Promise<NextResponse> {
  const configuredAdminKey = getConfiguredAdminKey();
  if (!configuredAdminKey) {
    return NextResponse.json(
      { message: "INTERNAL_ADMIN_KEY is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const providedKey =
    request.headers.get("x-admin-key")?.trim() ??
    url.searchParams.get("key")?.trim() ??
    "";

  if (providedKey !== configuredAdminKey) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const limit = normalizeLimit(url.searchParams.get("limit"));
  const offset = normalizeOffset(url.searchParams.get("offset"));
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();
  const sinceRaw = url.searchParams.get("since");

  let sinceDate: Date | undefined;
  if (sinceRaw) {
    const parsed = new Date(sinceRaw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { message: `Invalid since value "${sinceRaw}". Use ISO timestamp.` },
        { status: 400 },
      );
    }
    sinceDate = parsed;
  }

  const submissions = await prisma.submission.findMany({
    where: sinceDate
      ? {
          createdAt: {
            gte: sinceDate,
          },
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    skip: offset,
    take: limit,
    include: {
      checkupLink: {
        select: {
          slug: true,
        },
      },
      school: {
        select: {
          name: true,
        },
      },
      report: {
        select: {
          reportToken: true,
          reportUrlPath: true,
          emailStatus: true,
          emailSentAt: true,
          pdfStatus: true,
          pdfBlobUrl: true,
        },
      },
    },
  });

  const appBaseUrl = getAppBaseUrl();

  const rows: ExportRow[] = submissions.map((submission) => {
    const contextName =
      submission.sourceType === "SCHOOL"
        ? submission.school?.name ??
          submission.schoolNameAtSubmission ??
          submission.checkupLink.slug
        : submission.housingSocietyNameAtSubmission ?? "-";

    const reportUrl =
      submission.report?.reportUrlPath != null
        ? `${appBaseUrl}${submission.report.reportUrlPath}`
        : null;
    const downloadReportUrl =
      submission.report?.reportToken != null
        ? `${appBaseUrl}/api/report/pdf/${submission.report.reportToken}`
        : null;

    return {
      submissionId: submission.id,
      createdAtUtc: submission.createdAt.toISOString(),
      createdAtIst: formatDateTimeIst(submission.createdAt),
      sourceType: submission.sourceType,
      checkupSlug: submission.checkupLink.slug,
      contextName,
      childName: submission.childName,
      parentName: submission.parentName,
      parentEmail: submission.parentEmail,
      parentWhatsapp: submission.parentWhatsapp,
      grade: submission.grade,
      gradeBand: submission.gradeBand,
      schoolName: submission.schoolNameAtSubmission,
      division: submission.divisionAtSubmission,
      housingSocietyName: submission.housingSocietyNameAtSubmission,
      finalScore: submission.finalScore,
      finalLevel: prettifySubmissionLevel(submission.finalLevel),
      retakeNumber: submission.retakeNumber,
      resultToken: submission.resultToken,
      resultUrl: `${appBaseUrl}/result/${submission.resultToken}`,
      reportToken: submission.report?.reportToken ?? null,
      reportUrl,
      downloadReportUrl,
      emailStatus: submission.report?.emailStatus ?? null,
      emailSentAtUtc: submission.report?.emailSentAt?.toISOString() ?? null,
      pdfStatus: submission.report?.pdfStatus ?? null,
      pdfBlobUrl: submission.report?.pdfBlobUrl ?? null,
    };
  });
  const hasMore = rows.length === limit;
  const nextOffset = hasMore ? offset + rows.length : null;

  if (format === "csv") {
    return new NextResponse(toCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="brainmoto-submissions-export.csv"',
      },
    });
  }

  return NextResponse.json(
    {
      count: rows.length,
      offset,
      limit,
      hasMore,
      nextOffset,
      since: sinceDate?.toISOString() ?? null,
      rows,
    },
    { status: 200 },
  );
}
