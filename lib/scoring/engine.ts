import { mapScoreToFinalLevel } from "./thresholds";
import type {
  QuestionDefinition,
  ScoringConfig,
  ScoreResult,
  SkillScoreResult,
  SubmittedAnswers,
} from "./types";

function getPointsFromAnswer(
  question: QuestionDefinition,
  answerLabel: string | undefined,
): number {
  if (!answerLabel) {
    throw new Error(`Missing answer for question: ${question.id}`);
  }

  const option = question.options.find((candidate) => candidate.label === answerLabel);
  if (!option) {
    throw new Error(`Invalid answer "${answerLabel}" for question: ${question.id}`);
  }

  return option.points;
}

function validateScoringConfig(config: ScoringConfig): void {
  if (config.skills.length === 0) {
    throw new Error("Scoring config must define at least one skill.");
  }

  const skillIdSet = new Set(config.skills.map((skill) => skill.id));
  if (skillIdSet.size !== config.skills.length) {
    throw new Error("Scoring config has duplicate skill IDs.");
  }

  const questionIdSet = new Set<string>();
  for (const question of config.questions) {
    if (!skillIdSet.has(question.skillId)) {
      throw new Error(
        `Question "${question.id}" is mapped to unknown skill "${question.skillId}".`,
      );
    }

    if (questionIdSet.has(question.id)) {
      throw new Error(`Scoring config has duplicate question ID "${question.id}".`);
    }

    questionIdSet.add(question.id);

    if (question.options.length === 0) {
      throw new Error(`Question "${question.id}" must define answer options.`);
    }
  }
}

export function calculateCheckupScores(
  config: ScoringConfig,
  answers: SubmittedAnswers,
): ScoreResult {
  validateScoringConfig(config);

  const skillScoreResults: SkillScoreResult[] = config.skills.map((skill) => {
    const skillQuestions = config.questions.filter((question) => question.skillId === skill.id);

    if (skillQuestions.length === 0) {
      throw new Error(`Skill "${skill.id}" has no mapped questions.`);
    }

    let earnedPoints = 0;
    let maxPoints = 0;

    for (const question of skillQuestions) {
      const answerLabel = answers[question.id];
      const points = getPointsFromAnswer(question, answerLabel);
      const questionMaxPoints = Math.max(...question.options.map((option) => option.points));

      earnedPoints += points;
      maxPoints += questionMaxPoints;
    }

    const normalizedScore = Math.round((earnedPoints / maxPoints) * 100);

    return {
      skillId: skill.id,
      skillName: skill.name,
      earnedPoints,
      maxPoints,
      normalizedScore,
      level: mapScoreToFinalLevel(normalizedScore),
    };
  });

  const finalScore = Math.round(
    skillScoreResults.reduce((sum, skillScore) => sum + skillScore.normalizedScore, 0) /
      skillScoreResults.length,
  );

  return {
    flow: config.flow,
    skillScores: skillScoreResults,
    finalScore,
    finalLevel: mapScoreToFinalLevel(finalScore),
  };
}
