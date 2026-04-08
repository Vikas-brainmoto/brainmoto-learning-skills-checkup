import type { AnswerOptionLabel, QuestionDefinition } from "../../lib/scoring/types";

interface QuestionCardProps {
  question: QuestionDefinition;
  value?: AnswerOptionLabel;
  questionNumber: number;
  totalQuestions: number;
  onChange: (answer: AnswerOptionLabel) => void;
}

export function QuestionCard({
  question,
  value,
  questionNumber,
  totalQuestions,
  onChange,
}: QuestionCardProps) {
  return (
    <section aria-label={`Question ${questionNumber} of ${totalQuestions}`}>
      <p>
        Question {questionNumber} of {totalQuestions}
      </p>
      <p>{question.text}</p>

      <fieldset>
        <legend>Select one answer</legend>
        {question.options.map((option) => {
          const optionId = `${question.id}-${option.label}`;
          return (
            <label key={optionId} htmlFor={optionId}>
              <input
                id={optionId}
                type="radio"
                name={question.id}
                value={option.label}
                checked={value === option.label}
                onChange={() => onChange(option.label)}
              />
              {option.label}
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
