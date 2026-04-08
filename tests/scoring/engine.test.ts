import { describe, expect, it } from "vitest";

import { preprimaryConfig } from "../../lib/scoring/config/preprimary";
import { primaryConfig } from "../../lib/scoring/config/primary";
import { calculateCheckupScores } from "../../lib/scoring/engine";
import { mapScoreToFinalLevel } from "../../lib/scoring/thresholds";
import {
  DEFAULT_ANSWER_OPTIONS,
  type AnswerOptionLabel,
  type QuestionDefinition,
  type ScoringConfig,
  type SubmittedAnswers,
} from "../../lib/scoring/types";

function buildAnswers(
  config: ScoringConfig,
  answer:
    | AnswerOptionLabel
    | ((question: QuestionDefinition, config: ScoringConfig) => AnswerOptionLabel),
): SubmittedAnswers {
  const answers: SubmittedAnswers = {};
  for (const question of config.questions) {
    answers[question.id] =
      typeof answer === "function" ? answer(question, config) : answer;
  }
  return answers;
}

function getScoreBySkillId(
  result: ReturnType<typeof calculateCheckupScores>,
  skillId: string,
): number {
  const skillScore = result.skillScores.find((item) => item.skillId === skillId);
  if (!skillScore) {
    throw new Error(`Missing score for skill: ${skillId}`);
  }
  return skillScore.normalizedScore;
}

describe("scoring configs", () => {
  it("loads pre-primary config with 8 skills and 20 questions", () => {
    expect(preprimaryConfig.skills).toHaveLength(8);
    expect(preprimaryConfig.questions).toHaveLength(20);
  });

  it("loads primary config with 8 skills and 20 questions", () => {
    expect(primaryConfig.skills).toHaveLength(8);
    expect(primaryConfig.questions).toHaveLength(20);
  });
});

describe("threshold mapping", () => {
  it("matches required threshold boundaries", () => {
    expect(mapScoreToFinalLevel(44)).toBe("Requires Support");
    expect(mapScoreToFinalLevel(45)).toBe("Still Developing");
    expect(mapScoreToFinalLevel(69)).toBe("Still Developing");
    expect(mapScoreToFinalLevel(70)).toBe("Doing Well");
  });
});

describe("scoring engine behavior", () => {
  it("returns all-best-case result for pre-primary", () => {
    const answers = buildAnswers(preprimaryConfig, "Never");
    const result = calculateCheckupScores(preprimaryConfig, answers);

    expect(result.finalScore).toBe(100);
    expect(result.finalLevel).toBe("Doing Well");
    expect(result.skillScores.every((skill) => skill.normalizedScore === 100)).toBe(true);
  });

  it("returns all-worst-case result for pre-primary", () => {
    const answers = buildAnswers(preprimaryConfig, "Very Often");
    const result = calculateCheckupScores(preprimaryConfig, answers);

    expect(result.finalScore).toBe(0);
    expect(result.finalLevel).toBe("Requires Support");
    expect(result.skillScores.every((skill) => skill.normalizedScore === 0)).toBe(true);
  });

  it("returns all-best-case result for primary", () => {
    const answers = buildAnswers(primaryConfig, "Never");
    const result = calculateCheckupScores(primaryConfig, answers);

    expect(result.finalScore).toBe(100);
    expect(result.finalLevel).toBe("Doing Well");
    expect(result.skillScores.every((skill) => skill.normalizedScore === 100)).toBe(true);
  });

  it("normalizes 2-question and 3-question skills separately", () => {
    const answers = buildAnswers(preprimaryConfig, "Very Often");
    answers.pre_q1 = "Never";
    answers.pre_q2 = "Often";
    answers.pre_q7 = "Never";
    answers.pre_q8 = "Sometimes";
    answers.pre_q9 = "Often";

    const result = calculateCheckupScores(preprimaryConfig, answers);

    expect(getScoreBySkillId(result, "thinking_problem_solving")).toBe(67);
    expect(getScoreBySkillId(result, "planning_executive_functions")).toBe(67);
    expect(result.finalScore).toBe(17);
    expect(result.finalLevel).toBe("Requires Support");
  });

  it("equally weights all 8 normalized skill scores for final score", () => {
    const questionCountBySkill = new Map<string, number>();
    for (const question of preprimaryConfig.questions) {
      questionCountBySkill.set(
        question.skillId,
        (questionCountBySkill.get(question.skillId) ?? 0) + 1,
      );
    }

    const answers = buildAnswers(preprimaryConfig, (question) => {
      const questionCount = questionCountBySkill.get(question.skillId);
      return questionCount === 2 ? "Never" : "Very Often";
    });

    const result = calculateCheckupScores(preprimaryConfig, answers);
    expect(result.finalScore).toBe(50);
    expect(result.finalLevel).toBe("Still Developing");
  });

  it("handles mixed answers and yields still-developing final level", () => {
    const answers = buildAnswers(primaryConfig, "Sometimes");
    answers.pri_q1 = "Never";
    answers.pri_q9 = "Often";
    answers.pri_q20 = "Very Often";

    const result = calculateCheckupScores(primaryConfig, answers);
    expect(result.finalScore).toBeGreaterThanOrEqual(45);
    expect(result.finalScore).toBeLessThanOrEqual(69);
    expect(result.finalLevel).toBe("Still Developing");
  });

  it("rejects invalid skill/question mapping", () => {
    const invalidConfig: ScoringConfig = {
      ...preprimaryConfig,
      questions: [
        ...preprimaryConfig.questions,
        {
          id: "pre_q_invalid",
          skillId: "unknown_skill",
          text: "Invalid mapping test question",
          options: DEFAULT_ANSWER_OPTIONS,
        },
      ],
    };

    const answers = buildAnswers(invalidConfig, "Never");

    expect(() => calculateCheckupScores(invalidConfig, answers)).toThrow(
      'Question "pre_q_invalid" is mapped to unknown skill "unknown_skill".',
    );
  });
});
