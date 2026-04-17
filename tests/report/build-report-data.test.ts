import {
  GradeBand,
  LinkSourceType,
  SubmissionLevel,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => {
  return {
    reportFindUnique: vi.fn(),
  };
});

vi.mock("../../lib/db/prisma", () => ({
  prisma: {
    report: {
      findUnique: prismaMocks.reportFindUnique,
    },
  },
}));

import { buildReportData } from "../../lib/report/build-report-data";

describe("buildReportData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ordered skill data and mapped labels for a pre-primary report token", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      reportToken: "report-token-1",
      reportUrlPath: "/report/report-token-1",
      submission: {
        resultToken: "result-token-1",
        sourceType: LinkSourceType.SCHOOL,
        childName: "Anshul Sharma",
        grade: "Sr KG",
        gradeBand: GradeBand.PREPRIMARY,
        schoolNameAtSubmission: "Sunbeam Suncity School",
        divisionAtSubmission: "C",
        housingSocietyNameAtSubmission: null,
        parentName: "Parent One",
        parentEmail: "parent@example.com",
        parentWhatsapp: null,
        finalScore: 58,
        finalLevel: SubmissionLevel.STILL_DEVELOPING,
        skillScores: [
          {
            skillId: "thinking_problem_solving",
            skillName: "Thinking & Problem Solving",
            normalizedScore: 75,
            level: "Doing Well",
          },
          {
            skillId: "attention_self_regulation",
            skillName: "Attention & Self-Regulation",
            normalizedScore: 55,
            level: "Still Developing",
          },
          {
            skillId: "working_memory",
            skillName: "Working Memory",
            normalizedScore: 55,
            level: "Still Developing",
          },
          {
            skillId: "planning_executive_functions",
            skillName: "Planning Skills (Executive Functions)",
            normalizedScore: 70,
            level: "Doing Well",
          },
          {
            skillId: "posture_body_management",
            skillName: "Posture & Body Management",
            normalizedScore: 40,
            level: "Requires Support",
          },
          {
            skillId: "locomotor_movement_fluency",
            skillName: "Locomotor & Movement Fluency",
            normalizedScore: 50,
            level: "Still Developing",
          },
          {
            skillId: "coordination_bilateral_integration",
            skillName: "Coordination & Bilateral Integration",
            normalizedScore: 30,
            level: "Requires Support",
          },
          {
            skillId: "object_control_visual_tracking",
            skillName: "Object Control & Visual Tracking",
            normalizedScore: 72,
            level: "Doing Well",
          },
        ],
        school: {
          name: "Sunbeam Suncity School, Varanasi",
          logoUrl: "/logo.webp",
        },
      },
    });

    const reportData = await buildReportData("report-token-1");

    expect(reportData).not.toBeNull();
    expect(reportData?.reportToken).toBe("report-token-1");
    expect(reportData?.resultToken).toBe("result-token-1");
    expect(reportData?.source).toBe("school");
    expect(reportData?.gradeBand).toBe("preprimary");
    expect(reportData?.schoolName).toBe("Sunbeam Suncity School, Varanasi");
    expect(reportData?.division).toBe("C");
    expect(reportData?.housingSocietyName).toBeNull();
    expect(reportData?.finalLevel).toBe("Still Developing");
    expect(reportData?.easeStatusLabel).toBe("Amber");
    expect(reportData?.skills).toHaveLength(8);
    expect(reportData?.skills[0].skillId).toBe("thinking_problem_solving");
    expect(reportData?.skills[7].skillId).toBe("object_control_visual_tracking");
    expect(reportData?.skills[0].sections).toHaveLength(3);
  });

  it("returns null when report token is not found", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue(null);

    const reportData = await buildReportData("missing-token");

    expect(reportData).toBeNull();
  });

  it("maps d2c context fields with optional school/division values", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      reportToken: "report-token-d2c",
      reportUrlPath: "/report/report-token-d2c",
      submission: {
        resultToken: "result-token-d2c",
        sourceType: LinkSourceType.D2C,
        childName: "Child D2C",
        grade: "Grade 2",
        gradeBand: GradeBand.PRIMARY,
        schoolNameAtSubmission: null,
        divisionAtSubmission: null,
        housingSocietyNameAtSubmission: "Palm Residency",
        parentName: "Parent D2C",
        parentEmail: "parentd2c@example.com",
        parentWhatsapp: "+91 9999999999",
        finalScore: 72,
        finalLevel: SubmissionLevel.DOING_WELL,
        skillScores: [],
        school: null,
      },
    });

    const reportData = await buildReportData("report-token-d2c");

    expect(reportData).not.toBeNull();
    expect(reportData?.source).toBe("d2c");
    expect(reportData?.schoolName).toBeNull();
    expect(reportData?.division).toBeNull();
    expect(reportData?.housingSocietyName).toBe("Palm Residency");
    expect(reportData?.easeStatusLabel).toBe("Green");
    expect(reportData?.logoUrl).toBe("/logo.webp");
  });

  it("preserves long child and school names for report rendering", async () => {
    const longChildName =
      "Aaradhya-Krishnavanshi Rao Mehta Srinivasan Fernandes";
    const longSchoolName =
      "The International Academy for Foundational Learning and Holistic Excellence";

    prismaMocks.reportFindUnique.mockResolvedValue({
      reportToken: "report-token-long",
      reportUrlPath: "/report/report-token-long",
      submission: {
        resultToken: "result-token-long",
        sourceType: LinkSourceType.SCHOOL,
        childName: longChildName,
        grade: "Grade 5",
        gradeBand: GradeBand.PRIMARY,
        schoolNameAtSubmission: longSchoolName,
        divisionAtSubmission: "Blue - Section 2",
        housingSocietyNameAtSubmission: null,
        parentName: "Parent Long",
        parentEmail: "parentlong@example.com",
        parentWhatsapp: null,
        finalScore: 68,
        finalLevel: SubmissionLevel.STILL_DEVELOPING,
        skillScores: [],
        school: {
          name: longSchoolName,
          logoUrl: "/logo.webp",
        },
      },
    });

    const reportData = await buildReportData("report-token-long");

    expect(reportData).not.toBeNull();
    expect(reportData?.childName).toBe(longChildName);
    expect(reportData?.schoolName).toBe(longSchoolName);
    expect(reportData?.division).toBe("Blue - Section 2");
    expect(reportData?.gradeBand).toBe("primary");
  });
});
