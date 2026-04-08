import {
  GradeBand,
  LinkSourceType,
  SubmissionLevel,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../db/prisma";
import { SKILL_DEFINITIONS, type FinalLevelLabel } from "../scoring/types";
import {
  PREPRIMARY_FLOW_CONTENT,
  PRIMARY_FLOW_CONTENT,
  type FlowNarrativeContent,
  type ReportNarrativeSection,
} from "./content";

export interface ReportSkillData {
  skillId: string;
  skillName: string;
  detailTitle: string;
  score: number;
  level: FinalLevelLabel;
  sections: ReportNarrativeSection[];
}

export interface ReportData {
  reportToken: string;
  reportUrlPath: string;
  resultToken: string;
  source: "d2c" | "school";
  childName: string;
  grade: string;
  gradeBand: "preprimary" | "primary";
  schoolName: string | null;
  division: string | null;
  housingSocietyName: string | null;
  logoUrl: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string | null;
  finalScore: number;
  finalLevel: FinalLevelLabel;
  easeStatusLabel: "Green" | "Amber" | "Red";
  detailHeading: string;
  detailIntroLines: string[];
  skills: ReportSkillData[];
}

interface ParsedSkillScore {
  skillId: string;
  skillName: string;
  normalizedScore: number;
  level: FinalLevelLabel;
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

function mapGradeBand(value: GradeBand): "preprimary" | "primary" {
  return value === GradeBand.PREPRIMARY ? "preprimary" : "primary";
}

function mapEaseStatusLabel(level: FinalLevelLabel): "Green" | "Amber" | "Red" {
  switch (level) {
    case "Doing Well":
      return "Green";
    case "Still Developing":
      return "Amber";
    case "Requires Support":
      return "Red";
    default:
      return "Amber";
  }
}

function getFlowNarrativeContent(flow: "preprimary" | "primary"): FlowNarrativeContent {
  return flow === "preprimary" ? PREPRIMARY_FLOW_CONTENT : PRIMARY_FLOW_CONTENT;
}

function parseSkillScores(value: Prisma.JsonValue): ParsedSkillScore[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed: ParsedSkillScore[] = [];

  for (const item of value) {
    if (!isObject(item)) {
      continue;
    }

    const skillId = item.skillId;
    const skillName = item.skillName;
    const normalizedScore = item.normalizedScore;
    const level = item.level;

    if (
      typeof skillId === "string" &&
      typeof skillName === "string" &&
      typeof normalizedScore === "number" &&
      Number.isFinite(normalizedScore) &&
      isFinalLevelLabel(level)
    ) {
      parsed.push({
        skillId,
        skillName,
        normalizedScore: Math.max(0, Math.min(100, Math.round(normalizedScore))),
        level,
      });
    }
  }

  return parsed;
}

export async function buildReportData(reportToken: string): Promise<ReportData | null> {
  const report = await prisma.report.findUnique({
    where: { reportToken },
    include: {
      submission: {
        include: {
          school: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  });

  if (!report) {
    return null;
  }

  const submission = report.submission;
  const flow = mapGradeBand(submission.gradeBand);
  const narrativeContent = getFlowNarrativeContent(flow);
  const parsedSkillScores = parseSkillScores(submission.skillScores);
  const parsedSkillScoreMap = new Map(
    parsedSkillScores.map((skillScore) => [skillScore.skillId, skillScore]),
  );
  const narrativeSkillMap = new Map(
    narrativeContent.skillNarratives.map((skillNarrative) => [skillNarrative.skillId, skillNarrative]),
  );
  const finalLevel = FINAL_LEVEL_LABEL_BY_ENUM[submission.finalLevel];

  const skills: ReportSkillData[] = SKILL_DEFINITIONS.map((skillDefinition) => {
    const score = parsedSkillScoreMap.get(skillDefinition.id);
    const narrative = narrativeSkillMap.get(skillDefinition.id);

    return {
      skillId: skillDefinition.id,
      skillName: skillDefinition.name,
      detailTitle: narrative?.detailTitle ?? skillDefinition.name,
      score: score?.normalizedScore ?? 0,
      level: score?.level ?? "Requires Support",
      sections: narrative?.sections ?? [],
    };
  });

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

  return {
    reportToken: report.reportToken,
    reportUrlPath: report.reportUrlPath,
    resultToken: submission.resultToken,
    source,
    childName: submission.childName,
    grade: submission.grade,
    gradeBand: flow,
    schoolName,
    division,
    housingSocietyName,
    logoUrl,
    parentName: submission.parentName,
    parentEmail: submission.parentEmail,
    parentWhatsapp: submission.parentWhatsapp,
    finalScore: submission.finalScore,
    finalLevel,
    easeStatusLabel: mapEaseStatusLabel(finalLevel),
    detailHeading: narrativeContent.detailHeading,
    detailIntroLines: narrativeContent.detailIntroLines,
    skills,
  };
}
