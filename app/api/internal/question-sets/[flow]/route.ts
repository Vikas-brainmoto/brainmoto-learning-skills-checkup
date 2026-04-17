import { QuestionSetVersionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  getDefaultQuestionSetContentForFlow,
  parseFlowParam,
  parseQuestionSetPayload,
} from "../../../../../lib/content/question-set-store";
import { ensureInternalAdminAuthorized } from "../../../../../lib/content/internal-admin";
import { prisma } from "../../../../../lib/db/prisma";

interface Params {
  params: Promise<{
    flow: string;
  }>;
}

function parseNumberParam(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
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

  const set = await prisma.questionSet.findUnique({
    where: {
      flow: flow === "preprimary" ? "PREPRIMARY" : "PRIMARY",
    },
    include: {
      versions: {
        orderBy: {
          versionNumber: "desc",
        },
        select: {
          versionNumber: true,
          status: true,
          notes: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!set) {
    const defaults = getDefaultQuestionSetContentForFlow(flow);
    return NextResponse.json(
      {
        flow,
        source: "fallback",
        publishedVersionNumber: null,
        versions: [],
        content: {
          questionConfig: defaults.questionConfig,
          reportContent: defaults.reportContent,
        },
      },
      { status: 200 },
    );
  }

  const url = new URL(request.url);
  const requestedVersionNumber =
    parseNumberParam(url.searchParams.get("version")) ??
    set.publishedVersionNumber ??
    null;

  let content = null;
  if (requestedVersionNumber) {
    const version = await prisma.questionSetVersion.findUnique({
      where: {
        questionSetId_versionNumber: {
          questionSetId: set.id,
          versionNumber: requestedVersionNumber,
        },
      },
      select: {
        versionNumber: true,
        status: true,
        questionConfig: true,
        reportContent: true,
      },
    });

    if (version) {
      try {
        const payload = parseQuestionSetPayload(
          version.questionConfig,
          version.reportContent,
          flow,
        );

        content = {
          versionNumber: version.versionNumber,
          status: version.status,
          ...payload,
        };
      } catch {
        content = null;
      }
    }
  }

  return NextResponse.json(
    {
      flow,
      source: "db",
      publishedVersionNumber: set.publishedVersionNumber,
      versions: set.versions.map((version) => ({
        ...version,
        isPublished: version.status === QuestionSetVersionStatus.PUBLISHED,
      })),
      content,
    },
    { status: 200 },
  );
}
