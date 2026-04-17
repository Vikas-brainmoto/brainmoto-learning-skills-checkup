import { NextResponse } from "next/server";

import { parseFlowParam } from "../../../../../../../../lib/content/question-set-store";
import { ensureInternalAdminAuthorized } from "../../../../../../../../lib/content/internal-admin";
import { prisma } from "../../../../../../../../lib/db/prisma";

interface Params {
  params: Promise<{
    flow: string;
    version: string;
  }>;
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
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

  const target = await prisma.questionSetVersion.findUnique({
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
  if (!target) {
    return NextResponse.json(
      { message: `Version ${versionNumber} not found.` },
      { status: 404 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.questionSetVersion.updateMany({
      where: {
        questionSetId: set.id,
        status: "PUBLISHED",
      },
      data: {
        status: "ARCHIVED",
      },
    });

    await tx.questionSetVersion.update({
      where: {
        questionSetId_versionNumber: {
          questionSetId: set.id,
          versionNumber,
        },
      },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    await tx.questionSet.update({
      where: {
        id: set.id,
      },
      data: {
        publishedVersionNumber: versionNumber,
      },
    });
  });

  return NextResponse.json(
    {
      message: `Version ${versionNumber} published for ${flow}.`,
      flow,
      versionNumber,
    },
    { status: 200 },
  );
}
