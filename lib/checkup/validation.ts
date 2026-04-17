import {
  ANSWER_OPTION_LABELS,
  type AnswerOptionLabel,
  type ScoringConfig,
} from "../scoring/types";
import { getQuestionConfigForGrade } from "../scoring/flow";

export interface ChildDetailsValues {
  source: "d2c" | "school";
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
  childName: string;
  grade: string;
  schoolName: string;
  division: string;
  housingSocietyName: string;
}

export interface ValidateSubmissionInput extends ChildDetailsValues {
  schoolSlug?: string;
  answers: Record<string, string>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidOptionalWhatsapp(value: string): boolean {
  if (value.trim() === "") {
    return true;
  }

  return /^[0-9+\-\s()]{7,20}$/.test(value);
}

export function validateChildDetails(
  values: ChildDetailsValues,
  allowedGrades: readonly string[],
): ValidationResult {
  const errors: string[] = [];

  if (values.parentName.trim() === "") {
    errors.push("Parent name is required.");
  }

  if (values.parentEmail.trim() === "") {
    errors.push("Parent email is required.");
  } else if (!isValidEmail(values.parentEmail)) {
    errors.push("Parent email is invalid.");
  }

  if (!isValidOptionalWhatsapp(values.parentWhatsapp)) {
    errors.push("WhatsApp number is invalid.");
  }

  if (values.childName.trim() === "") {
    errors.push("Child name is required.");
  }

  if (values.grade.trim() === "") {
    errors.push("Grade is required.");
  } else if (!allowedGrades.includes(values.grade)) {
    errors.push("Selected grade is not allowed for this link.");
  }

  if (values.source === "school") {
    if (values.schoolName.trim() === "") {
      errors.push("School name is required.");
    }

    if (values.division.trim() === "") {
      errors.push("Division is required.");
    }
  }

  if (values.source === "d2c" && values.housingSocietyName.trim() === "") {
    errors.push("Housing society name is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateAnswersForGrade(
  grade: string,
  answers: Record<string, string>,
): ValidationResult {
  const errors: string[] = [];
  let config;

  try {
    config = getQuestionConfigForGrade(grade);
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : "Unsupported grade."],
    };
  }

  return validateAnswersAgainstConfig(config, answers);
}

export function validateAnswersAgainstConfig(
  config: ScoringConfig,
  answers: Record<string, string>,
): ValidationResult {
  const errors: string[] = [];

  for (const question of config.questions) {
    const answer = answers[question.id];
    if (!answer) {
      errors.push(`Missing answer for question "${question.id}".`);
      continue;
    }

    if (!ANSWER_OPTION_LABELS.includes(answer as AnswerOptionLabel)) {
      errors.push(`Invalid answer value for question "${question.id}".`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateSubmissionPayload(
  payload: ValidateSubmissionInput,
  allowedGrades: readonly string[],
): ValidationResult {
  const detailValidation = validateChildDetails(payload, allowedGrades);
  const answerValidation = validateAnswersForGrade(payload.grade, payload.answers);
  const sourceErrors: string[] = [];

  if (payload.source === "school" && (!payload.schoolSlug || payload.schoolSlug.trim() === "")) {
    sourceErrors.push("School slug is required for school flow.");
  }

  return {
    isValid:
      detailValidation.isValid &&
      answerValidation.isValid &&
      sourceErrors.length === 0,
    errors: [...detailValidation.errors, ...answerValidation.errors, ...sourceErrors],
  };
}
