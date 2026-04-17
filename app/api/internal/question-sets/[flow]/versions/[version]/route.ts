import { NextResponse } from "next/server";

import {
  parseFlowParam,
  parseQuestionSetPayload,
} from "../../../../../../../lib/content/question-set-store";
import { ensureInternalAdminAuthorized } from "../../../../../../../lib/content/internal-admin";
import { prisma } from "../../../../../../../lib/db/prisma";

interface Params {
  params: Promise<{
    flow: string;
    version: string;
  }>;
}

interface UpdateRequestBody {
  questionConfig?: unknown;
  reportContent?: unknown;
  notes?: string | null;
}

export async function PUT(request: Request, { params }: Params): Promise<NextResponse> {
  const unauthorized = ensureInternalAdminAuthorized(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { flow: flowParam, version: versionParam } = await params;
  const flow = parseFlowParam(flowParam);
  if (!flow) {
    return NextResponse.json(
      { message: `Invalid flow "${flowParam}". Use preprimary or primary.` },
      { status: 400 },
    );
  }

  const versionNumber = Number(versionParam);
  if (!Number.isInteger(versionNumber) || versionNumber < 1) {
    return NextResponse.json(
      { message: `Invalid version "${versionParam}".` },
      { status: 400 },
    );
  }

  let body: UpdateRequestBody;
  try {
    body = (await request.json()) as UpdateRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (body.questionConfig === undefined || body.reportContent === undefined) {
    return NextResponse.json(
      { message: "Both questionConfig and reportContent are required." },
      { status: 400 },
    );
  }

  const set = await prisma.questionSet.findUnique({
    where: {
      flow: flow === "preprimary" ? "PREPRIMARY" : "PRIMARY",
    },
    select: {
      id: true,
    },
  });
  if (!set) {
    return NextResponse.json(
      { message: `Question set for flow "${flow}" does not exist.` },
      { status: 404 },
    );
  }

  const existingVersion = await prisma.questionSetVersion.findUnique({
    where: {
      questionSetId_versionNumber: {
        questionSetId: set.id,
        versionNumber,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });
  if (!existingVersion) {
    return NextResponse.json(
      { message: `Version ${versionNumber} not found.` },
      { status: 404 },
    );
  }

  if (existingVersion.status !== "DRAFT") {
    return NextResponse.json(
      { message: `Only DRAFT versions can be edited. Version ${versionNumber} is ${existingVersion.status}.` },
      { status: 409 },
    );
  }

  let parsedPayload;
  try {
    parsedPayload = parseQuestionSetPayload(
      body.questionConfig,
      body.reportContent,
      flow,
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Invalid question set payload.",
      },
      { status: 400 },
    );
  }

  const normalizedNotes =
    typeof body.notes === "string" && body.notes.trim() !== ""
      ? body.notes.trim()
      : null;

  await prisma.questionSetVersion.update({
    where: {
      questionSetId_versionNumber: {
        questionSetId: set.id,
        versionNumber,
      },
    },
    data: {
      questionConfig: parsedPayload.questionConfig as unknown as object,
      reportContent: parsedPayload.reportContent as unknown as object,
      notes: normalizedNotes,
    },
  });

  return NextResponse.json(
    {
      message: `Version ${versionNumber} updated.`,
      flow,
      versionNumber,
    },
    { status: 200 },
  );
}
