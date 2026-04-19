"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  validateAnswersAgainstConfig,
  validateChildDetails,
  type ChildDetailsValues,
} from "../../lib/checkup/validation";
import type { AnswerOptionLabel, ScoringConfig, SubmittedAnswers } from "../../lib/scoring/types";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";

type CheckupSource = "d2c" | "school";

interface ChildDetailsErrors {
  parentName?: string;
  parentEmail?: string;
  parentWhatsapp?: string;
  childName?: string;
  grade?: string;
  schoolName?: string;
  division?: string;
  housingSocietyName?: string;
}

interface QuestionValidationIssue {
  message: string;
  questionNumber: number | null;
  kind: "missing" | "invalid" | "other";
}

interface ChildDetailsFormProps {
  source: CheckupSource;
  schoolSlug?: string;
  presetSchoolName?: string;
  allowedGrades: readonly string[];
  logoUrl?: string;
}

function toFieldErrors(messages: string[]): ChildDetailsErrors {
  const errors: ChildDetailsErrors = {};

  for (const message of messages) {
    if (message.startsWith("Parent name")) {
      errors.parentName = message;
    } else if (message.startsWith("Parent email")) {
      errors.parentEmail = message;
    } else if (message.startsWith("WhatsApp")) {
      errors.parentWhatsapp = message;
    } else if (message.startsWith("Child name")) {
      errors.childName = message;
    } else if (message.startsWith("Grade") || message.startsWith("Selected grade")) {
      errors.grade = message;
    } else if (message.startsWith("School name")) {
      errors.schoolName = message;
    } else if (message.startsWith("Division")) {
      errors.division = message;
    } else if (message.startsWith("Housing society")) {
      errors.housingSocietyName = message;
    }
  }

  return errors;
}

function formatQuestionValidationErrors(
  messages: string[],
  questionConfig: ScoringConfig,
): string[] {
  const questionNumberById = new Map(
    questionConfig.questions.map((question, index) => [question.id, index + 1]),
  );

  const formatted: string[] = [];

  for (const message of messages) {
    const missingAnswerMatch = message.match(/Missing answer for question "([^"]+)"/i);
    if (missingAnswerMatch) {
      const questionNumber = questionNumberById.get(missingAnswerMatch[1]);
      if (questionNumber) {
        formatted.push(`Missing answer for question ${questionNumber}.`);
        continue;
      }
    }

    const invalidAnswerMatch = message.match(/Invalid answer value for question "([^"]+)"/i);
    if (invalidAnswerMatch) {
      const questionNumber = questionNumberById.get(invalidAnswerMatch[1]);
      if (questionNumber) {
        formatted.push(`Invalid answer for question ${questionNumber}.`);
        continue;
      }
    }

    formatted.push(message);
  }

  return formatted;
}

function toQuestionValidationIssues(messages: string[]): QuestionValidationIssue[] {
  return messages.map((message) => {
    const questionMatch = message.match(/question\s+(\d+)/i);
    const normalized = message.toLowerCase();
    const kind = normalized.startsWith("missing answer")
      ? "missing"
      : normalized.startsWith("invalid answer")
        ? "invalid"
        : "other";
    return {
      message,
      questionNumber: questionMatch ? Number(questionMatch[1]) : null,
      kind,
    };
  });
}

export function ChildDetailsForm({
  source,
  schoolSlug,
  presetSchoolName,
  allowedGrades,
  logoUrl,
}: ChildDetailsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ChildDetailsValues>({
    source,
    parentName: "",
    parentEmail: "",
    parentWhatsapp: "",
    childName: "",
    grade: "",
    schoolName: presetSchoolName ?? "",
    division: "",
    housingSocietyName: "",
  });
  const [detailErrors, setDetailErrors] = useState<ChildDetailsErrors>({});
  const [questionErrors, setQuestionErrors] = useState<string[]>([]);
  const [questionConfig, setQuestionConfig] = useState<ScoringConfig | null>(null);
  const [answers, setAnswers] = useState<SubmittedAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSchoolFlow = source === "school";
  const gradeOptions = useMemo(
    () =>
      allowedGrades.filter(
        (gradeOption) => gradeOption.trim().toUpperCase() !== "UKG",
      ),
    [allowedGrades],
  );
  const currentQuestion = questionConfig?.questions[currentQuestionIndex] ?? null;
  const currentQuestionNumber = currentQuestion ? currentQuestionIndex + 1 : 0;

  const answeredCount = useMemo(() => {
    if (!questionConfig) {
      return 0;
    }

    return questionConfig.questions.reduce((count, question) => {
      return answers[question.id] ? count + 1 : count;
    }, 0);
  }, [answers, questionConfig]);
  const unansweredCount = questionConfig
    ? Math.max(0, questionConfig.questions.length - answeredCount)
    : 0;

  const canSubmit =
    questionConfig !== null && answeredCount === questionConfig.questions.length;
  const isOnLastQuestion =
    questionConfig !== null &&
    currentQuestionIndex >= questionConfig.questions.length - 1;

  const questionIssues = useMemo(
    () => toQuestionValidationIssues(questionErrors),
    [questionErrors],
  );
  const submitIssues = useMemo(() => toQuestionValidationIssues(submitErrors), [submitErrors]);

  function jumpToQuestion(questionNumber: number) {
    if (!questionConfig) {
      return;
    }

    const nextIndex = Math.max(0, Math.min(questionConfig.questions.length - 1, questionNumber - 1));
    setCurrentQuestionIndex(nextIndex);
  }

  function jumpToFirstMissingQuestion() {
    if (!questionConfig) {
      return;
    }

    const firstMissingIndex = questionConfig.questions.findIndex((question) => !answers[question.id]);
    if (firstMissingIndex >= 0) {
      setCurrentQuestionIndex(firstMissingIndex);
      setQuestionErrors([]);
      setSubmitErrors([]);
    }
  }

  function updateValue(field: keyof ChildDetailsValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setDetailErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateChildDetails(values, gradeOptions);
    if (!validation.isValid) {
      setDetailErrors(toFieldErrors(validation.errors));
      return;
    }

    try {
      const response = await fetch(
        `/api/checkup/config?grade=${encodeURIComponent(values.grade)}`,
      );
      const payload = (await response.json()) as {
        message?: string;
        questionConfig?: ScoringConfig;
      };

      if (!response.ok || !payload.questionConfig) {
        setDetailErrors((current) => ({
          ...current,
          grade: payload.message ?? "Unable to load questions for selected grade.",
        }));
        return;
      }

      setQuestionConfig(payload.questionConfig);
      setCurrentQuestionIndex(0);
      setQuestionErrors([]);
      setSubmitErrors([]);
    } catch {
      setDetailErrors((current) => ({
        ...current,
        grade: "Unable to load questions due to a network or server issue.",
      }));
    }
  }

  function handleAnswerChange(answer: AnswerOptionLabel) {
    if (!currentQuestion) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: answer,
    }));
    setQuestionErrors([]);
    setSubmitErrors([]);
  }

  async function handleSubmitCheckup() {
    if (!questionConfig) {
      return;
    }

    const answerValidation = validateAnswersAgainstConfig(questionConfig, answers);
    if (!answerValidation.isValid) {
      setQuestionErrors(formatQuestionValidationErrors(answerValidation.errors, questionConfig));
      return;
    }

    setIsSubmitting(true);
    setSubmitErrors([]);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          schoolSlug: isSchoolFlow ? schoolSlug : undefined,
          parentName: values.parentName,
          parentEmail: values.parentEmail,
          parentWhatsapp: values.parentWhatsapp,
          childName: values.childName,
          grade: values.grade,
          schoolName: values.schoolName,
          division: values.division,
          housingSocietyName: values.housingSocietyName,
          answers,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        errors?: string[];
        resultPath?: string;
      };

      if (!response.ok) {
        const backendErrors =
          Array.isArray(data.errors) && data.errors.length > 0
            ? formatQuestionValidationErrors(data.errors, questionConfig)
            : null;
        setSubmitErrors(
          backendErrors && backendErrors.length > 0
            ? backendErrors
            : [data.message ?? "Submission failed."],
        );
        return;
      }

      if (!data.resultPath) {
        setSubmitErrors(["Submission completed but result path is missing."]);
        return;
      }

      router.push(data.resultPath);
    } catch {
      setSubmitErrors(["Submission failed due to a network or server issue."]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-label="Child details form" className="checkup-shell">
      <div className="checkup-panel">
        <header className="checkup-header">
          <div className="checkup-title-row">
            <h1 className="checkup-title-main">Learning Skills Check-Up</h1>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={isSchoolFlow ? `${values.schoolName || "School"} logo` : "Brainmoto logo"}
                width={136}
                height={72}
                className="checkup-brand-logo"
              />
            ) : null}
          </div>
        </header>

        {!questionConfig ? (
          <form onSubmit={handleDetailsSubmit} noValidate className="checkup-form">
            <div className="checkup-form-grid">
              <div className="checkup-field">
                <label htmlFor="childName">Child Name</label>
                <input
                  id="childName"
                  name="childName"
                  type="text"
                  value={values.childName}
                  onChange={(event) => updateValue("childName", event.target.value)}
                />
                {detailErrors.childName ? (
                  <p className="checkup-field-error">{detailErrors.childName}</p>
                ) : null}
              </div>

              <div className="checkup-field">
                <label htmlFor="grade">Grade</label>
                <select
                  id="grade"
                  name="grade"
                  value={values.grade}
                  onChange={(event) => updateValue("grade", event.target.value)}
                >
                  <option value="">Select grade</option>
                  {gradeOptions.map((gradeOption) => (
                    <option key={gradeOption} value={gradeOption}>
                      {gradeOption}
                    </option>
                  ))}
                </select>
                {detailErrors.grade ? (
                  <p className="checkup-field-error">{detailErrors.grade}</p>
                ) : null}
              </div>

              <div className="checkup-field">
                <label htmlFor="parentName">Parent Name</label>
                <input
                  id="parentName"
                  name="parentName"
                  type="text"
                  value={values.parentName}
                  onChange={(event) => updateValue("parentName", event.target.value)}
                />
                {detailErrors.parentName ? (
                  <p className="checkup-field-error">{detailErrors.parentName}</p>
                ) : null}
              </div>

              <div className="checkup-field">
                <label htmlFor="parentEmail">Parent Email</label>
                <input
                  id="parentEmail"
                  name="parentEmail"
                  type="email"
                  value={values.parentEmail}
                  onChange={(event) => updateValue("parentEmail", event.target.value)}
                />
                {detailErrors.parentEmail ? (
                  <p className="checkup-field-error">{detailErrors.parentEmail}</p>
                ) : null}
              </div>

              <div className="checkup-field">
                <label htmlFor="parentWhatsapp">WhatsApp Number (Optional)</label>
                <input
                  id="parentWhatsapp"
                  name="parentWhatsapp"
                  type="tel"
                  value={values.parentWhatsapp}
                  onChange={(event) => updateValue("parentWhatsapp", event.target.value)}
                />
                {detailErrors.parentWhatsapp ? (
                  <p className="checkup-field-error">{detailErrors.parentWhatsapp}</p>
                ) : null}
              </div>

              <div className="checkup-contact-note checkup-field-span">
                <p>
                  We use email and WhatsApp only to send your detailed report and practical feedback
                  for your child.
                </p>
              </div>

              {isSchoolFlow ? (
                <>
                  <div className="checkup-field">
                    <label htmlFor="schoolName">School Name</label>
                    <input
                      id="schoolName"
                      name="schoolName"
                      type="text"
                      value={values.schoolName}
                      onChange={(event) => updateValue("schoolName", event.target.value)}
                      readOnly
                    />
                    {detailErrors.schoolName ? (
                      <p className="checkup-field-error">{detailErrors.schoolName}</p>
                    ) : null}
                  </div>

                  <div className="checkup-field">
                    <label htmlFor="division">Division</label>
                    <input
                      id="division"
                      name="division"
                      type="text"
                      value={values.division}
                      onChange={(event) => updateValue("division", event.target.value)}
                      placeholder="Example: A"
                    />
                    {detailErrors.division ? (
                      <p className="checkup-field-error">{detailErrors.division}</p>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="checkup-field">
                    <label htmlFor="housingSocietyName">Housing Society Name</label>
                    <input
                      id="housingSocietyName"
                      name="housingSocietyName"
                      type="text"
                      value={values.housingSocietyName}
                      onChange={(event) => updateValue("housingSocietyName", event.target.value)}
                    />
                    {detailErrors.housingSocietyName ? (
                      <p className="checkup-field-error">{detailErrors.housingSocietyName}</p>
                    ) : null}
                  </div>

                  <div className="checkup-field">
                    <label htmlFor="schoolName">School Name (Optional)</label>
                    <input
                      id="schoolName"
                      name="schoolName"
                      type="text"
                      value={values.schoolName}
                      onChange={(event) => updateValue("schoolName", event.target.value)}
                    />
                    {detailErrors.schoolName ? (
                      <p className="checkup-field-error">{detailErrors.schoolName}</p>
                    ) : null}
                  </div>

                  <div className="checkup-field">
                    <label htmlFor="division">Division (Optional)</label>
                    <input
                      id="division"
                      name="division"
                      type="text"
                      value={values.division}
                      onChange={(event) => updateValue("division", event.target.value)}
                    />
                    {detailErrors.division ? (
                      <p className="checkup-field-error">{detailErrors.division}</p>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            <div className="checkup-actions checkup-actions-primary">
              <button type="submit" className="checkup-btn checkup-btn-primary">
                Continue To Questions
              </button>
            </div>
          </form>
        ) : (
          <section aria-label="Question step" className="checkup-step">
            <ProgressBar
              currentQuestionNumber={currentQuestionNumber}
              answeredCount={answeredCount}
              unansweredCount={unansweredCount}
              totalCount={questionConfig.questions.length}
            />
            {unansweredCount > 0 ? (
              <button
                type="button"
                className="checkup-btn checkup-btn-secondary checkup-btn-quick-jump"
                onClick={jumpToFirstMissingQuestion}
              >
                Go to first missing
              </button>
            ) : null}

            {currentQuestion ? (
              <QuestionCard
                question={currentQuestion}
                value={answers[currentQuestion.id] as AnswerOptionLabel | undefined}
                onChange={handleAnswerChange}
              />
            ) : null}

            <div className="checkup-actions checkup-actions-row">
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                disabled={currentQuestionIndex === 0}
                className="checkup-btn checkup-btn-secondary"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((index) =>
                    Math.min(questionConfig.questions.length - 1, index + 1),
                  )
                }
                disabled={currentQuestionIndex >= questionConfig.questions.length - 1}
                className="checkup-btn checkup-btn-secondary"
              >
                Next
              </button>
              {canSubmit || isOnLastQuestion ? (
                <button
                  type="button"
                  onClick={handleSubmitCheckup}
                  disabled={isSubmitting}
                  className="checkup-btn checkup-btn-primary"
                >
                  {isSubmitting ? "Submitting..." : "Submit Check-Up"}
                </button>
              ) : null}
            </div>

            {questionErrors.length > 0 ? (
              <section
                aria-label="Question validation errors"
                className="checkup-alert checkup-alert-error"
              >
                <p>Please answer all questions before submitting.</p>
                <ul>
                  {questionIssues.map((issue, index) => (
                    <li key={`${issue.message}-${index}`}>
                      {issue.questionNumber !== null ? (
                        <>
                          <span>
                            {issue.kind === "missing"
                              ? "Missing answer for question "
                              : issue.kind === "invalid"
                                ? "Invalid answer for question "
                                : "Question "}
                          </span>
                          <button
                            type="button"
                            className="checkup-inline-link"
                            onClick={() => jumpToQuestion(issue.questionNumber!)}
                          >
                            {issue.questionNumber}
                          </button>
                          <span>.</span>
                        </>
                      ) : (
                        <span>{issue.message}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {submitErrors.length > 0 ? (
              <section aria-label="Details submit preview" className="checkup-alert">
                <section
                  aria-label="Submission errors"
                  className="checkup-alert checkup-alert-error"
                >
                  <p>Submission failed. Please fix these issues:</p>
                  <ul>
                    {submitIssues.map((issue, index) => (
                      <li key={`${issue.message}-${index}`}>
                      {issue.questionNumber !== null ? (
                        <>
                            <span>
                              {issue.kind === "missing"
                                ? "Missing answer for question "
                                : issue.kind === "invalid"
                                  ? "Invalid answer for question "
                                  : "Question "}
                            </span>
                            <button
                              type="button"
                              className="checkup-inline-link"
                              onClick={() => jumpToQuestion(issue.questionNumber!)}
                            >
                              {issue.questionNumber}
                            </button>
                            <span>.</span>
                          </>
                        ) : (
                          <span>{issue.message}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              </section>
            ) : null}
          </section>
        )}
      </div>
    </section>
  );
}
