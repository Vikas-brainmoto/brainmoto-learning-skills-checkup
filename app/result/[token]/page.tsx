import { LinkSourceType, ReportEmailStatus, SubmissionLevel } from "@prisma/client";
import { notFound } from "next/navigation";

import { ScoreHero } from "../../../components/report/ScoreHero";
import {
  SkillSnapshot,
  type SkillSnapshotItem,
} from "../../../components/report/SkillSnapshot";
import { ReportFooter } from "../../../components/report/ReportFooter";
import { prisma } from "../../../lib/db/prisma";
import { SKILL_DEFINITIONS, type FinalLevelLabel } from "../../../lib/scoring/types";

interface ResultPageProps {
  params: Promise<{
    token: string;
  }>;
}

const FINAL_LEVEL_LABEL_BY_ENUM: Record<SubmissionLevel, FinalLevelLabel> = {
  [SubmissionLevel.DOING_WELL]: "Doing Well",
  [SubmissionLevel.STILL_DEVELOPING]: "Still Developing",
  [SubmissionLevel.REQUIRES_SUPPORT]: "Requires Support",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFinalLevelLabel(value: unknown): value is FinalLevelLabel {
  return (
    value === "Doing Well" ||
    value === "Still Developing" ||
    value === "Requires Support"
  );
}

function getOptionalStringProperty(
  value: unknown,
  key: string,
): string | null {
  if (!isObject(value)) {
    return null;
  }

  const candidate = value[key];
  if (typeof candidate !== "string") {
    return null;
  }

  const normalized = candidate.trim();
  return normalized === "" ? null : normalized;
}

function parseSkillSnapshotItems(value: unknown): SkillSnapshotItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed: SkillSnapshotItem[] = [];

  for (const item of value) {
    if (!isObject(item)) {
      continue;
    }

    const skillId = item.skillId;
    const skillName = item.skillName;
    const level = item.level;
    const normalizedScore = item.normalizedScore;

    if (
      typeof skillId === "string" &&
      typeof skillName === "string" &&
      isFinalLevelLabel(level) &&
      typeof normalizedScore === "number" &&
      Number.isFinite(normalizedScore)
    ) {
      parsed.push({
        skillId,
        skillName,
        level,
        normalizedScore: Math.max(0, Math.min(100, Math.round(normalizedScore))),
      });
    }
  }

  return parsed;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { token } = await params;

  const submission = await prisma.submission.findUnique({
    where: { resultToken: token },
    include: {
      school: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
      report: {
        select: {
          reportToken: true,
          emailStatus: true,
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  const parsedSkillScores = parseSkillSnapshotItems(submission.skillScores);
  const skillScoreMap = new Map(parsedSkillScores.map((item) => [item.skillId, item]));
  const orderedSkillScores: SkillSnapshotItem[] = SKILL_DEFINITIONS.map((skill) => {
    const score = skillScoreMap.get(skill.id);

    if (!score) {
      return {
        skillId: skill.id,
        skillName: skill.name,
        level: "Requires Support",
        normalizedScore: 0,
      };
    }

    return {
      ...score,
      skillName: score.skillName || skill.name,
    };
  });

  const finalLevel = FINAL_LEVEL_LABEL_BY_ENUM[submission.finalLevel];
  const source = submission.sourceType === LinkSourceType.SCHOOL ? "school" : "d2c";
  const schoolName =
    source === "school"
      ? (submission.school?.name ?? submission.schoolNameAtSubmission ?? null)
      : (submission.schoolNameAtSubmission ?? null);
  const division = getOptionalStringProperty(submission, "divisionAtSubmission");
  const housingSocietyName = getOptionalStringProperty(
    submission,
    "housingSocietyNameAtSubmission",
  );
  const logoUrl =
    source === "school"
      ? (submission.school?.logoUrl ?? "/logo.webp")
      : "/logo.webp";
  const reportPath = submission.report
    ? `/report/${submission.report.reportToken}`
    : null;
  const reportDownloadPath = submission.report
    ? `/api/report/pdf/${submission.report.reportToken}`
    : null;
  const emailStatus: ReportEmailStatus | null = submission.report?.emailStatus ?? null;

  return (
    <main className="result-page-shell">
      <ScoreHero
        source={source}
        childName={submission.childName}
        grade={submission.grade}
        schoolName={schoolName}
        division={division}
        housingSocietyName={housingSocietyName}
        logoUrl={logoUrl}
        finalScore={submission.finalScore}
        finalLevel={finalLevel}
        parentEmail={submission.parentEmail}
        reportPath={reportPath}
        reportDownloadPath={reportDownloadPath}
        emailStatus={emailStatus}
      />
      <SkillSnapshot skills={orderedSkillScores} />
      <ReportFooter className="ls-result-footer" />
    </main>
  );
}
