import { PdfStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "../../../../../lib/db/prisma";
import {
  generateReportPdf,
  storeReportPdfInBlob,
} from "../../../../../lib/report/pdf";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

function getPdfUploadFailureMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "PDF upload failed unexpectedly.";

  if (message.includes("This store does not exist")) {
    return "Vercel Blob store is not available for the current BLOB_READ_WRITE_TOKEN. Create/connect a Blob store in Vercel, generate a new read-write token, and update BLOB_READ_WRITE_TOKEN in .env.local.";
  }

  return message;
}

function getAppBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) {
    return "http://localhost:3000";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const report = await prisma.report.findUnique({
    where: { reportToken: token },
    select: {
      id: true,
      reportToken: true,
      reportUrlPath: true,
      submission: {
        select: {
          childName: true,
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json(
      { message: "Report not found for provided token." },
      { status: 404 },
    );
  }

  const reportUrl = `${getAppBaseUrl()}${report.reportUrlPath}`;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateReportPdf({ reportUrl });
  } catch (error) {
    await prisma.report.update({
      where: { id: report.id },
      data: {
        pdfStatus: PdfStatus.FAILED,
      },
    });

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "PDF generation failed unexpectedly.",
      },
      { status: 500 },
    );
  }

  let blobUrl: string;
  try {
    blobUrl = await storeReportPdfInBlob({
      reportToken: report.reportToken,
      pdfBytes: pdfBuffer,
    });
  } catch (error) {
    await prisma.report.update({
      where: { id: report.id },
      data: {
        pdfStatus: PdfStatus.FAILED,
      },
    });

    return NextResponse.json(
      {
        message: getPdfUploadFailureMessage(error),
      },
      { status: 500 },
    );
  }

  await prisma.report.update({
    where: { id: report.id },
    data: {
      pdfStatus: PdfStatus.GENERATED,
      pdfBlobUrl: blobUrl,
      pdfGeneratedAt: new Date(),
    },
  });

  const safeChildName = report.submission.childName
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const filename = safeChildName
    ? `${safeChildName}_Learning_Skills_Checkup.pdf`
    : "Learning_Skills_Checkup_Report.pdf";

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Report-Pdf-Blob-Url": blobUrl,
    },
  });
}
