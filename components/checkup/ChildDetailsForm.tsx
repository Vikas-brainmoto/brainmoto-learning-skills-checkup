"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  validateAnswersForGrade,
  validateChildDetails,
  type ChildDetailsValues,
} from "../../lib/checkup/validation";
import { getQuestionConfigForGrade } from "../../lib/scoring/flow";
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
  const [isQuestionStepComplete, setIsQuestionStepComplete] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSchoolFlow = source === "school";
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

  function updateValue(field: keyof ChildDetailsValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setDetailErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateChildDetails(values, allowedGrades);
    if (!validation.isValid) {
      setDetailErrors(toFieldErrors(validation.errors));
      return;
    }

    const config = getQuestionConfigForGrade(values.grade);
    setQuestionConfig(config);
    setCurrentQuestionIndex(0);
    setQuestionErrors([]);
    setIsQuestionStepComplete(false);
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
    setIsQuestionStepComplete(false);
    setSubmitErrors([]);
  }

  function handleCompleteQuestions() {
    if (!questionConfig) {
      return;
    }

    const validation = validateAnswersForGrade(values.grade, answers);
    if (!validation.isValid) {
      setQuestionErrors(validation.errors);
      setIsQuestionStepComplete(false);
      return;
    }

    setQuestionErrors([]);
    setIsQuestionStepComplete(true);
    setSubmitErrors([]);
  }

  async function handleSubmitCheckup() {
    if (!questionConfig) {
      return;
    }

    const answerValidation = validateAnswersForGrade(values.grade, answers);
    if (!answerValidation.isValid) {
      setQuestionErrors(answerValidation.errors);
      setIsQuestionStepComplete(false);
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
        setSubmitErrors(
          Array.isArray(data.errors) && data.errors.length > 0
            ? data.errors
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
                  {allowedGrades.map((gradeOption) => (
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

            <div className="checkup-actions">
              <button type="submit" className="checkup-btn checkup-btn-primary">
                Continue To Questions
              </button>
            </div>
          </form>
        ) : (
          <section aria-label="Question step" className="checkup-step">
            <ProgressBar
              flowLabel={questionConfig.flow === "preprimary" ? "Pre-primary" : "Primary"}
              currentQuestionNumber={currentQuestionNumber}
              answeredCount={answeredCount}
              totalCount={questionConfig.questions.length}
            />

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
              <button
                type="button"
                onClick={handleCompleteQuestions}
                className="checkup-btn checkup-btn-primary"
              >
                Complete Question Step
              </button>
            </div>

            {questionErrors.length > 0 ? (
              <section
                aria-label="Question validation errors"
                className="checkup-alert checkup-alert-error"
              >
                <p>Please answer all required questions before continuing.</p>
                <ul>
                  {questionErrors.slice(0, 5).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
                {questionErrors.length > 5 ? (
                  <p>And {questionErrors.length - 5} more issues.</p>
                ) : null}
              </section>
            ) : null}

            {isQuestionStepComplete ? (
              <section aria-label="Details submit preview" className="checkup-alert">
                <p>Details and answers are valid. Submit to generate your result.</p>
                <button
                  type="button"
                  onClick={handleSubmitCheckup}
                  disabled={isSubmitting}
                  className="checkup-btn checkup-btn-primary"
                >
                  {isSubmitting ? "Submitting..." : "Submit Check-Up"}
                </button>

                {submitErrors.length > 0 ? (
                  <section
                    aria-label="Submission errors"
                    className="checkup-alert checkup-alert-error"
                  >
                    <p>Submission failed. Please fix these issues:</p>
                    <ul>
                      {submitErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </section>
            ) : null}
          </section>
        )}
      </div>
    </section>
  );
}
