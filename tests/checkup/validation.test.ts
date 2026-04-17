import { describe, expect, it } from "vitest";

import { preprimaryConfig } from "../../lib/scoring/config/preprimary";
import { primaryConfig } from "../../lib/scoring/config/primary";
import type { AnswerOptionLabel, ScoringConfig, SubmittedAnswers } from "../../lib/scoring/types";
import {
  validateAnswersForGrade,
  validateChildDetails,
  validateSubmissionPayload,
} from "../../lib/checkup/validation";

function buildAnswers(config: ScoringConfig, option: AnswerOptionLabel): SubmittedAnswers {
  const answers: SubmittedAnswers = {};
  for (const question of config.questions) {
    answers[question.id] = option;
  }
  return answers;
}

describe("checkup validation", () => {
  it("accepts valid child details for pre-primary flow", () => {
    const result = validateChildDetails(
      {
        source: "school",
        parentName: "Parent One",
        parentEmail: "parent@example.com",
        parentWhatsapp: "",
        childName: "Child One",
        grade: "Sr KG",
        schoolName: "Sunrise Kids Academy",
        division: "A",
        housingSocietyName: "",
      },
      ["Nursery", "Jr KG", "Sr KG"],
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing required school-flow details and invalid email", () => {
    const result = validateChildDetails(
      {
        source: "school",
        parentName: "",
        parentEmail: "invalid-email",
        parentWhatsapp: "abc",
        childName: "",
        grade: "",
        schoolName: "",
        division: "",
        housingSocietyName: "",
      },
      ["Grade 1"],
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Parent name is required.");
    expect(result.errors).toContain("Parent email is invalid.");
    expect(result.errors).toContain("WhatsApp number is invalid.");
    expect(result.errors).toContain("Child name is required.");
    expect(result.errors).toContain("Grade is required.");
    expect(result.errors).toContain("School name is required.");
    expect(result.errors).toContain("Division is required.");
  });

  it("requires housing society in d2c flow while keeping school/division optional", () => {
    const result = validateChildDetails(
      {
        source: "d2c",
        parentName: "Parent One",
        parentEmail: "parent@example.com",
        parentWhatsapp: "",
        childName: "Child One",
        grade: "Grade 1",
        schoolName: "",
        division: "",
        housingSocietyName: "",
      },
      ["Grade 1", "Grade 2"],
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Housing society name is required.");
    expect(result.errors).not.toContain("School name is required.");
    expect(result.errors).not.toContain("Division is required.");
  });

  it("rejects grade outside allowed list", () => {
    const result = validateChildDetails(
      {
        source: "school",
        parentName: "Parent One",
        parentEmail: "parent@example.com",
        parentWhatsapp: "",
        childName: "Child One",
        grade: "Grade 1",
        schoolName: "Sunrise Kids Academy",
        division: "A",
        housingSocietyName: "",
      },
      ["Nursery", "Jr KG", "Sr KG"],
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Selected grade is not allowed for this link.");
  });

  it("accepts complete answers for pre-primary and primary question sets", () => {
    const preResult = validateAnswersForGrade(
      "Nursery",
      buildAnswers(preprimaryConfig, "Never"),
    );
    const primaryResult = validateAnswersForGrade(
      "Grade 5",
      buildAnswers(primaryConfig, "Sometimes"),
    );

    expect(preResult.isValid).toBe(true);
    expect(primaryResult.isValid).toBe(true);
  });

  it("rejects when one required answer is missing", () => {
    const answers = buildAnswers(preprimaryConfig, "Never");
    delete answers.pre_q20;

    const result = validateAnswersForGrade("Sr KG", answers);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing answer for question "pre_q20".');
  });

  it("rejects invalid answer option values", () => {
    const answers = buildAnswers(primaryConfig, "Never") as SubmittedAnswers;
    answers.pri_q1 = "Always" as unknown as AnswerOptionLabel;

    const result = validateAnswersForGrade("Grade 1", answers);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid answer value for question "pri_q1".');
  });

  it("validates full submission payload with details plus answers", () => {
    const result = validateSubmissionPayload(
      {
        source: "d2c",
        parentName: "Parent One",
        parentEmail: "parent@example.com",
        parentWhatsapp: "",
        childName: "Child One",
        grade: "Grade 2",
        schoolName: "",
        division: "",
        housingSocietyName: "Palm Residency",
        answers: buildAnswers(primaryConfig, "Often"),
      },
      ["Grade 1", "Grade 2", "Grade 3"],
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
