import { ReportEmailStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "../../../../../lib/db/prisma";
import { sendReportEmail } from "../../../../../lib/email/resend";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

interface SendReportRequestBody {
  forceResend?: boolean;
}

function getAppBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) {
    return "http://localhost:3000";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  let body: SendReportRequestBody = {};

  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = (await request.json()) as SendReportRequestBody;
    }
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const forceResend = body.forceResend === true;
  const report = await prisma.report.findUnique({
    where: { reportToken: token },
    include: {
      submission: {
        select: {
          parentEmail: true,
          parentName: true,
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

  if (report.emailStatus === ReportEmailStatus.SENT && !forceResend) {
    return NextResponse.json(
      {
        message:
          "Report email already sent. Use forceResend=true for internal/admin resend.",
      },
      { status: 409 },
    );
  }

  const reportUrl = `${getAppBaseUrl()}${report.reportUrlPath}`;
  const downloadReportUrl = `${getAppBaseUrl()}/api/report/pdf/${report.reportToken}`;
  const shouldIncrementResendCount = report.emailStatus !== ReportEmailStatus.PENDING;

  let sendResult;
  try {
    sendResult = await sendReportEmail({
      toEmail: report.submission.parentEmail,
      parentName: report.submission.parentName,
      childName: report.submission.childName,
      reportUrl,
      downloadReportUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email delivery failed unexpectedly.";

    await prisma.report.update({
      where: { id: report.id },
      data: {
        emailStatus: ReportEmailStatus.FAILED,
        emailError: message,
        resendCount: shouldIncrementResendCount ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json(
      { message },
      { status: 500 },
    );
  }

  if (!sendResult.ok) {
    await prisma.report.update({
      where: { id: report.id },
      data: {
        emailStatus: ReportEmailStatus.FAILED,
        emailError: sendResult.error ?? "Email delivery failed.",
        resendCount: shouldIncrementResendCount ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json(
      { message: sendResult.error ?? "Email delivery failed." },
      { status: 502 },
    );
  }

  await prisma.report.update({
    where: { id: report.id },
    data: {
      emailStatus: ReportEmailStatus.SENT,
      emailProviderMessageId: sendResult.providerMessageId ?? null,
      emailError: null,
      emailSentAt: new Date(),
      resendCount: shouldIncrementResendCount ? { increment: 1 } : undefined,
    },
  });

  return NextResponse.json(
    {
      message: "Report email sent successfully.",
      reportUrl,
      downloadReportUrl,
      providerMessageId: sendResult.providerMessageId ?? null,
    },
    { status: 200 },
  );
}
