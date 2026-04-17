import crypto from "node:crypto";

import {
  GradeBand,
  LinkSourceType,
  Prisma,
  ReportEmailStatus,
  SubmissionLevel,
  type CheckupLink,
} from "@prisma/client";
import { NextResponse } from "next/server";

import {
  validateAnswersAgainstConfig,
  validateChildDetails,
} from "../../../lib/checkup/validation";
import { evaluateRetakeEligibility } from "../../../lib/checkup/retake";
import { getPublishedQuestionSetContentForGrade } from "../../../lib/content/question-set-store";
import { prisma } from "../../../lib/db/prisma";
import { sendReportEmail } from "../../../lib/email/resend";
import { calculateCheckupScores } from "../../../lib/scoring/engine";
import {
  ALL_GRADES,
  resolveFlowFromGrade,
} from "../../../lib/scoring/flow";
import type { SubmittedAnswers } from "../../../lib/scoring/types";

interface SubmitPayload {
  source: "d2c" | "school";
  schoolSlug?: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
  childName: string;
  grade: string;
  schoolName: string;
  division: string;
  housingSocietyName: string;
  answers: Record<string, string>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseAllowedGrades(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...ALL_GRADES];
  }

  const gradeSet = new Set<string>(ALL_GRADES);
  const grades = value.filter(
    (grade): grade is string =>
      typeof grade === "string" && gradeSet.has(grade),
  );
  return grades.length > 0 ? grades : [...ALL_GRADES];
}

function mapFinalLevelToSubmissionLevel(level: string): SubmissionLevel {
  switch (level) {
    case "Doing Well":
      return SubmissionLevel.DOING_WELL;
    case "Still Developing":
      return SubmissionLevel.STILL_DEVELOPING;
    case "Requires Support":
      return SubmissionLevel.REQUIRES_SUPPORT;
    default:
      throw new Error(`Unknown final level "${level}".`);
  }
}

function mapFlowToGradeBand(flow: string): GradeBand {
  if (flow === "preprimary") {
    return GradeBand.PREPRIMARY;
  }

  if (flow === "primary") {
    return GradeBand.PRIMARY;
  }

  throw new Error(`Unsupported grade band flow "${flow}".`);
}

function generateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function getAppBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) {
    return "http://localhost:3000";
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function resolveSubmissionLink(
  source: "d2c" | "school",
  schoolSlug?: string,
): Promise<CheckupLink & { school?: { id: string; name: string | null } | null }> {
  if (source === "d2c") {
    const d2cLink = await prisma.checkupLink.findFirst({
      where: {
        slug: "d2c-public",
        sourceType: LinkSourceType.D2C,
        isActive: true,
      },
      include: { school: true },
    });

    if (!d2cLink) {
      throw new Error("Active D2C link is not configured.");
    }

    return d2cLink;
  }

  if (!schoolSlug) {
    throw new Error("School slug is required for school flow.");
  }

  const schoolLink = await prisma.checkupLink.findFirst({
    where: {
      slug: schoolSlug,
      sourceType: LinkSourceType.SCHOOL,
      isActive: true,
    },
    include: { school: true },
  });

  if (!schoolLink) {
    throw new Error(`Active school link not found for slug "${schoolSlug}".`);
  }

  return schoolLink;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isObject(payload)) {
    return NextResponse.json(
      { message: "Request body must be an object." },
      { status: 400 },
    );
  }

  const typedPayload = payload as Partial<SubmitPayload>;

  if (typedPayload.source !== "d2c" && typedPayload.source !== "school") {
    return NextResponse.json(
      { message: 'Source must be either "d2c" or "school".' },
      { status: 400 },
    );
  }

  if (!typedPayload.grade || !isObject(typedPayload.answers)) {
    return NextResponse.json(
      {
        message:
          "Missing required fields. Required: grade and answers, along with parent and child details.",
      },
      { status: 400 },
    );
  }

  let link;
  try {
    link = await resolveSubmissionLink(
      typedPayload.source,
      typedPayload.source === "school" ? typedPayload.schoolSlug : undefined,
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to resolve submission link.",
      },
      { status: 400 },
    );
  }

  const allowedGrades = parseAllowedGrades(link.allowedGrades);
  const grade = typedPayload.grade;
  const answers = typedPayload.answers as Record<string, string>;
  const normalizedParentName = (typedPayload.parentName ?? "").trim();
  const normalizedParentEmail = (typedPayload.parentEmail ?? "").trim().toLowerCase();
  const normalizedParentWhatsapp = (typedPayload.parentWhatsapp ?? "").trim() || null;
  const normalizedChildName = (typedPayload.childName ?? "").trim();
  const normalizedSchoolName = (typedPayload.schoolName ?? "").trim();
  const normalizedDivision = (typedPayload.division ?? "").trim();
  const normalizedHousingSocietyName = (typedPayload.housingSocietyName ?? "").trim();

  const detailValidation = validateChildDetails(
    {
      source: typedPayload.source,
      parentName: typedPayload.parentName ?? "",
      parentEmail: typedPayload.parentEmail ?? "",
      parentWhatsapp: typedPayload.parentWhatsapp ?? "",
      childName: typedPayload.childName ?? "",
      grade: typedPayload.grade ?? "",
      schoolName: typedPayload.schoolName ?? "",
      division: typedPayload.division ?? "",
      housingSocietyName: typedPayload.housingSocietyName ?? "",
    },
    allowedGrades,
  );

  const sourceErrors: string[] = [];
  if (typedPayload.source === "school" && (!typedPayload.schoolSlug || typedPayload.schoolSlug.trim() === "")) {
    sourceErrors.push("School slug is required for school flow.");
  }

  if (!detailValidation.isValid || sourceErrors.length > 0) {
    return NextResponse.json(
      {
        message: "Submission validation failed.",
        errors: [...detailValidation.errors, ...sourceErrors],
      },
      { status: 400 },
    );
  }

  let publishedContent;
  try {
    publishedContent = await getPublishedQuestionSetContentForGrade(grade);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : `Unsupported grade "${grade}" for submission.`,
      },
      { status: 400 },
    );
  }

  const answerValidation = validateAnswersAgainstConfig(
    publishedContent.questionConfig,
    answers,
  );
  if (!answerValidation.isValid) {
    return NextResponse.json(
      {
        message: "Submission validation failed.",
        errors: answerValidation.errors,
      },
      { status: 400 },
    );
  }

  const flow = publishedContent.flow;
  if (!resolveFlowFromGrade(grade)) {
    return NextResponse.json(
      { message: `Unsupported grade "${grade}" for submission.` },
      { status: 400 },
    );
  }

  // Prevent accidental duplicate submissions from rapid repeated clicks.
  const duplicateWindowStart = new Date(Date.now() - 60 * 1000);
  const recentSubmission = await prisma.submission.findFirst({
    where: {
      checkupLinkId: link.id,
      parentEmail: normalizedParentEmail,
      childName: normalizedChildName,
      grade,
      createdAt: {
        gte: duplicateWindowStart,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (recentSubmission) {
    return NextResponse.json(
      {
        message: "Duplicate submission prevented. Returning existing result.",
        token: recentSubmission.resultToken,
        resultPath: `/result/${recentSubmission.resultToken}`,
      },
      { status: 200 },
    );
  }

  const submissionHistory = await prisma.submission.findMany({
    where: {
      parentEmail: normalizedParentEmail,
      childName: normalizedChildName,
    },
    select: {
      id: true,
      createdAt: true,
      retakeNumber: true,
      previousSubmissionId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const retakeDecision = evaluateRetakeEligibility({
    submissions: submissionHistory,
  });

  if (retakeDecision.type === "TOO_EARLY") {
    return NextResponse.json(
      {
        message: `Retake is available 30 days after first submission. Next eligible date: ${retakeDecision.nextEligibleAt.toISOString().slice(0, 10)}.`,
        retake: {
          isEligible: false,
          reason: "WAIT_PERIOD",
          nextEligibleAt: retakeDecision.nextEligibleAt.toISOString(),
          daysRemaining: retakeDecision.daysRemaining,
        },
      },
      { status: 409 },
    );
  }

  if (retakeDecision.type === "RETAKE_LIMIT_REACHED") {
    return NextResponse.json(
      {
        message: "Retake limit reached. Only one retake is allowed in V1.",
        retake: {
          isEligible: false,
          reason: "LIMIT_REACHED",
        },
      },
      { status: 409 },
    );
  }

  const scoreConfig = publishedContent.questionConfig;
  const scoreResult = calculateCheckupScores(
    scoreConfig,
    answers as SubmittedAnswers,
  );
  const resolvedSchoolName =
    (link.school?.name ?? normalizedSchoolName).trim();
  const schoolNameAtSubmission =
    typedPayload.source === "school"
      ? (resolvedSchoolName || null)
      : (normalizedSchoolName || null);
  const divisionAtSubmission = normalizedDivision || null;
  const housingSocietyNameAtSubmission = normalizedHousingSocietyName || null;

  const resultToken = generateToken();
  const reportToken = generateToken();

  try {
    const createdSubmission = await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          resultToken,
          sourceType:
            typedPayload.source === "d2c" ? LinkSourceType.D2C : LinkSourceType.SCHOOL,
          checkupLinkId: link.id,
          schoolId: link.schoolId,
          parentName: normalizedParentName,
          parentEmail: normalizedParentEmail,
          parentWhatsapp: normalizedParentWhatsapp,
          childName: normalizedChildName,
          grade,
          gradeBand: mapFlowToGradeBand(flow),
          schoolNameAtSubmission,
          divisionAtSubmission,
          housingSocietyNameAtSubmission,
          answers: answers as Prisma.InputJsonValue,
          skillScores: scoreResult.skillScores as unknown as Prisma.InputJsonValue,
          finalScore: scoreResult.finalScore,
          finalLevel: mapFinalLevelToSubmissionLevel(scoreResult.finalLevel),
          retakeNumber: retakeDecision.retakeNumber,
          previousSubmissionId: retakeDecision.previousSubmissionId,
        },
      });

      await tx.report.create({
        data: {
          submissionId: submission.id,
          reportToken,
          reportUrlPath: `/report/${reportToken}`,
        },
      });

      return submission;
    });

    const reportUrl = `${getAppBaseUrl()}/report/${reportToken}`;
    const downloadReportUrl = `${getAppBaseUrl()}/api/report/pdf/${reportToken}`;
    try {
      const emailResult = await sendReportEmail({
        toEmail: normalizedParentEmail,
        parentName: normalizedParentName,
        childName: normalizedChildName,
        reportUrl,
        downloadReportUrl,
      });

      if (emailResult.ok) {
        await prisma.report.update({
          where: { reportToken },
          data: {
            emailStatus: ReportEmailStatus.SENT,
            emailProviderMessageId: emailResult.providerMessageId ?? null,
            emailError: null,
            emailSentAt: new Date(),
          },
        });
      } else {
        await prisma.report.update({
          where: { reportToken },
          data: {
            emailStatus: ReportEmailStatus.FAILED,
            emailError: emailResult.error ?? "Email delivery failed.",
          },
        });
      }
    } catch (emailError) {
      const message =
        emailError instanceof Error
          ? emailError.message
          : "Email delivery failed unexpectedly.";

      await prisma.report.update({
        where: { reportToken },
        data: {
          emailStatus: ReportEmailStatus.FAILED,
          emailError: message,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Submission saved successfully.",
        token: createdSubmission.resultToken,
        resultPath: `/result/${createdSubmission.resultToken}`,
        retakeNumber: createdSubmission.retakeNumber,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to save submission and report data.",
      },
      { status: 500 },
    );
  }
}
