import { NextResponse } from "next/server";

import { getPublishedQuestionSetContentForGrade } from "../../../../lib/content/question-set-store";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const grade = (url.searchParams.get("grade") ?? "").trim();

  if (!grade) {
    return NextResponse.json(
      { message: 'Missing required query param "grade".' },
      { status: 400 },
    );
  }

  try {
    const content = await getPublishedQuestionSetContentForGrade(grade);
    return NextResponse.json(
      {
        grade,
        flow: content.flow,
        source: content.source,
        versionNumber: content.versionNumber,
        questionConfig: content.questionConfig,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to resolve question config for grade.",
      },
      { status: 400 },
    );
  }
}
