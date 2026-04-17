import {
  QuestionSetFlow,
  QuestionSetVersionStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "../db/prisma";
import {
  PREPRIMARY_FLOW_CONTENT,
  PRIMARY_FLOW_CONTENT,
  type FlowNarrativeContent,
  type ReportNarrativeSection,
  type ReportSkillNarrative,
} from "../report/content";
import { preprimaryConfig } from "../scoring/config/preprimary";
import { primaryConfig } from "../scoring/config/primary";
import { resolveFlowFromGrade, type GradeBandFlow } from "../scoring/flow";
import {
  ANSWER_OPTION_LABELS,
  type AnswerOption,
  type AnswerOptionLabel,
  type QuestionDefinition,
  type ScoringConfig,
  type SkillDefinition,
} from "../scoring/types";

export interface PublishedQuestionSetContent {
  flow: GradeBandFlow;
  questionConfig: ScoringConfig;
  reportContent: FlowNarrativeContent;
  source: "db" | "fallback";
  versionNumber: number | null;
}

export interface QuestionSetPayload {
  questionConfig: ScoringConfig;
  reportContent: FlowNarrativeContent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getFlowEnum(flow: GradeBandFlow): QuestionSetFlow {
  return flow === "preprimary"
    ? QuestionSetFlow.PREPRIMARY
    : QuestionSetFlow.PRIMARY;
}

export function parseFlowParam(value: string): GradeBandFlow | null {
  if (value === "preprimary") {
    return "preprimary";
  }

  if (value === "primary") {
    return "primary";
  }

  return null;
}

function getDefaultQuestionConfig(flow: GradeBandFlow): ScoringConfig {
  return flow === "preprimary" ? preprimaryConfig : primaryConfig;
}

function getDefaultReportContent(flow: GradeBandFlow): FlowNarrativeContent {
  return flow === "preprimary" ? PREPRIMARY_FLOW_CONTENT : PRIMARY_FLOW_CONTENT;
}

function parseSkillDefinition(value: unknown): SkillDefinition | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value.id;
  const name = value.name;
  if (typeof id !== "string" || typeof name !== "string") {
    return null;
  }

  return { id, name };
}

function parseAnswerOption(value: unknown): AnswerOption | null {
  if (!isRecord(value)) {
    return null;
  }

  const label = value.label;
  const points = value.points;
  if (
    typeof label !== "string" ||
    !ANSWER_OPTION_LABELS.includes(label as AnswerOptionLabel) ||
    typeof points !== "number" ||
    !Number.isFinite(points)
  ) {
    return null;
  }

  return {
    label: label as AnswerOptionLabel,
    points,
  };
}

function parseQuestionDefinition(value: unknown): QuestionDefinition | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value.id;
  const skillId = value.skillId;
  const text = value.text;
  const optionsRaw = value.options;

  if (
    typeof id !== "string" ||
    typeof skillId !== "string" ||
    typeof text !== "string" ||
    !Array.isArray(optionsRaw)
  ) {
    return null;
  }

  const options = optionsRaw
    .map(parseAnswerOption)
    .filter((option): option is AnswerOption => option !== null);

  if (options.length === 0) {
    return null;
  }

  return {
    id,
    skillId,
    text,
    options,
  };
}

function parseQuestionConfig(value: Prisma.JsonValue): ScoringConfig | null {
  if (!isRecord(value)) {
    return null;
  }

  const flow = value.flow;
  const skillsRaw = value.skills;
  const questionsRaw = value.questions;

  if (
    (flow !== "preprimary" && flow !== "primary") ||
    !Array.isArray(skillsRaw) ||
    !Array.isArray(questionsRaw)
  ) {
    return null;
  }

  const skills = skillsRaw
    .map(parseSkillDefinition)
    .filter((skill): skill is SkillDefinition => skill !== null);
  const questions = questionsRaw
    .map(parseQuestionDefinition)
    .filter((question): question is QuestionDefinition => question !== null);

  if (skills.length === 0 || questions.length === 0) {
    return null;
  }

  return {
    flow,
    skills,
    questions,
  };
}

function parseReportSection(value: unknown): ReportNarrativeSection | null {
  if (!isRecord(value)) {
    return null;
  }

  const heading = value.heading;
  const body = value.body;
  const bullets = value.bullets;

  if (typeof heading !== "string") {
    return null;
  }

  const parsed: ReportNarrativeSection = {
    heading,
  };

  if (typeof body === "string") {
    parsed.body = body;
  }

  if (Array.isArray(bullets)) {
    const parsedBullets = bullets.filter(
      (bullet): bullet is string => typeof bullet === "string",
    );
    if (parsedBullets.length > 0) {
      parsed.bullets = parsedBullets;
    }
  }

  return parsed;
}

function parseSkillNarrative(value: unknown): ReportSkillNarrative | null {
  if (!isRecord(value)) {
    return null;
  }

  const skillId = value.skillId;
  const detailTitle = value.detailTitle;
  const sectionsRaw = value.sections;

  if (
    typeof skillId !== "string" ||
    typeof detailTitle !== "string" ||
    !Array.isArray(sectionsRaw)
  ) {
    return null;
  }

  const sections = sectionsRaw
    .map(parseReportSection)
    .filter((section): section is ReportNarrativeSection => section !== null);

  if (sections.length === 0) {
    return null;
  }

  return {
    skillId,
    detailTitle,
    sections,
  };
}

function parseReportContent(value: Prisma.JsonValue): FlowNarrativeContent | null {
  if (!isRecord(value)) {
    return null;
  }

  const detailHeading = value.detailHeading;
  const detailIntroLines = value.detailIntroLines;
  const skillNarrativesRaw = value.skillNarratives;

  if (
    typeof detailHeading !== "string" ||
    !Array.isArray(detailIntroLines) ||
    !Array.isArray(skillNarrativesRaw)
  ) {
    return null;
  }

  const introLines = detailIntroLines.filter(
    (line): line is string => typeof line === "string",
  );
  const skillNarratives = skillNarrativesRaw
    .map(parseSkillNarrative)
    .filter((narrative): narrative is ReportSkillNarrative => narrative !== null);

  if (skillNarratives.length === 0) {
    return null;
  }

  return {
    detailHeading,
    detailIntroLines: introLines,
    skillNarratives,
  };
}

function fallbackContent(flow: GradeBandFlow): PublishedQuestionSetContent {
  return {
    flow,
    questionConfig: getDefaultQuestionConfig(flow),
    reportContent: getDefaultReportContent(flow),
    source: "fallback",
    versionNumber: null,
  };
}

export async function getPublishedQuestionSetContentForFlow(
  flow: GradeBandFlow,
): Promise<PublishedQuestionSetContent> {
  try {
    const set = await prisma.questionSet.findUnique({
      where: {
        flow: getFlowEnum(flow),
      },
      select: {
        id: true,
        publishedVersionNumber: true,
      },
    });

    if (!set || !set.publishedVersionNumber) {
      return fallbackContent(flow);
    }

    const version = await prisma.questionSetVersion.findUnique({
      where: {
        questionSetId_versionNumber: {
          questionSetId: set.id,
          versionNumber: set.publishedVersionNumber,
        },
      },
      select: {
        versionNumber: true,
        status: true,
        questionConfig: true,
        reportContent: true,
      },
    });

    if (!version || version.status !== QuestionSetVersionStatus.PUBLISHED) {
      return fallbackContent(flow);
    }

    const questionConfig = parseQuestionConfig(version.questionConfig);
    const reportContent = parseReportContent(version.reportContent);

    if (!questionConfig || !reportContent || questionConfig.flow !== flow) {
      return fallbackContent(flow);
    }

    return {
      flow,
      questionConfig,
      reportContent,
      source: "db",
      versionNumber: version.versionNumber,
    };
  } catch {
    return fallbackContent(flow);
  }
}

export async function getPublishedQuestionSetContentForGrade(
  grade: string,
): Promise<PublishedQuestionSetContent> {
  const flow = resolveFlowFromGrade(grade);
  if (!flow) {
    throw new Error(`Unsupported grade "${grade}" for question branching.`);
  }

  return getPublishedQuestionSetContentForFlow(flow);
}

export function getDefaultQuestionSetContentForFlow(
  flow: GradeBandFlow,
): PublishedQuestionSetContent {
  return fallbackContent(flow);
}

export function parseQuestionSetPayload(
  questionConfigRaw: unknown,
  reportContentRaw: unknown,
  expectedFlow: GradeBandFlow,
): QuestionSetPayload {
  const questionConfig = parseQuestionConfig(
    questionConfigRaw as Prisma.JsonValue,
  );
  if (!questionConfig) {
    throw new Error("Invalid questionConfig payload.");
  }

  if (questionConfig.flow !== expectedFlow) {
    throw new Error(
      `questionConfig.flow must be "${expectedFlow}" for this question set.`,
    );
  }

  const reportContent = parseReportContent(reportContentRaw as Prisma.JsonValue);
  if (!reportContent) {
    throw new Error("Invalid reportContent payload.");
  }

  return {
    questionConfig,
    reportContent,
  };
}
