import type { AnswerOptionLabel, QuestionDefinition } from "../../lib/scoring/types";

interface QuestionCardProps {
  question: QuestionDefinition;
  value?: AnswerOptionLabel;
  onChange: (answer: AnswerOptionLabel) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <section aria-label="Current question" className="checkup-question-card">
      <h2 className="checkup-question-text">{question.text}</h2>

      <fieldset className="checkup-option-group">
        <legend className="checkup-option-legend">Select one answer</legend>
        {question.options.map((option) => {
          const optionId = `${question.id}-${option.label}`;
          return (
            <label
              key={optionId}
              htmlFor={optionId}
              className={`checkup-option ${value === option.label ? "is-selected" : ""}`}
            >
              <input
                id={optionId}
                type="radio"
                name={question.id}
                value={option.label}
                className="checkup-option-input"
                checked={value === option.label}
                onChange={() => onChange(option.label)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
