import { NextResponse } from "next/server";

import {
  getDefaultQuestionSetContentForFlow,
  parseFlowParam,
  parseQuestionSetPayload,
} from "../../../../../../lib/content/question-set-store";
import { ensureInternalAdminAuthorized } from "../../../../../../lib/content/internal-admin";
import { prisma } from "../../../../../../lib/db/prisma";

interface Params {
  params: Promise<{
    flow: string;
  }>;
}

interface DraftRequestBody {
  copyFromVersionNumber?: number;
  notes?: string;
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const unauthorized = ensureInternalAdminAuthorized(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { flow: flowParam } = await params;
  const flow = parseFlowParam(flowParam);
  if (!flow) {
    return NextResponse.json(
      { message: `Invalid flow "${flowParam}". Use preprimary or primary.` },
      { status: 400 },
    );
  }

  let body: DraftRequestBody = {};
  try {
    body = (await request.json()) as DraftRequestBody;
  } catch {
    body = {};
  }

  const notes =
    typeof body.notes === "string" && body.notes.trim() !== ""
      ? body.notes.trim()
      : null;
  const requestedVersion =
    typeof body.copyFromVersionNumber === "number" &&
    Number.isInteger(body.copyFromVersionNumber) &&
    body.copyFromVersionNumber > 0
      ? body.copyFromVersionNumber
      : null;

  const set = await prisma.questionSet.upsert({
    where: {
      flow: flow === "preprimary" ? "PREPRIMARY" : "PRIMARY",
    },
    update: {},
    create: {
      flow: flow === "preprimary" ? "PREPRIMARY" : "PRIMARY",
      title: flow === "preprimary" ? "Pre-primary Question Set" : "Primary Question Set",
    },
  });

  const latestVersion = await prisma.questionSetVersion.findFirst({
    where: {
      questionSetId: set.id,
    },
    orderBy: {
      versionNumber: "desc",
    },
    select: {
      versionNumber: true,
    },
  });

  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
  const sourceVersionNumber =
    requestedVersion ?? set.publishedVersionNumber ?? latestVersion?.versionNumber ?? null;

  let questionConfig = getDefaultQuestionSetContentForFlow(flow).questionConfig;
  let reportContent = getDefaultQuestionSetContentForFlow(flow).reportContent;

  if (sourceVersionNumber) {
    const sourceVersion = await prisma.questionSetVersion.findUnique({
      where: {
        questionSetId_versionNumber: {
          questionSetId: set.id,
          versionNumber: sourceVersionNumber,
        },
      },
      select: {
        questionConfig: true,
        reportContent: true,
      },
    });

    if (!sourceVersion) {
      return NextResponse.json(
        { message: `Version ${sourceVersionNumber} not found for flow "${flow}".` },
        { status: 404 },
      );
    }

    const parsedPayload = parseQuestionSetPayload(
      sourceVersion.questionConfig,
      sourceVersion.reportContent,
      flow,
    );
    questionConfig = parsedPayload.questionConfig;
    reportContent = parsedPayload.reportContent;
  }

  const created = await prisma.questionSetVersion.create({
    data: {
      questionSetId: set.id,
      versionNumber: nextVersionNumber,
      status: "DRAFT",
      questionConfig: questionConfig as unknown as object,
      reportContent: reportContent as unknown as object,
      notes,
    },
    select: {
      versionNumber: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      message: `Draft version ${created.versionNumber} created.`,
      flow,
      version: created,
    },
    { status: 201 },
  );
}
