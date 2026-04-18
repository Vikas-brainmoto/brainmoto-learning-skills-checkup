interface ProgressBarProps {
  currentQuestionNumber: number;
  answeredCount: number;
  totalCount: number;
}

export function ProgressBar({
  currentQuestionNumber,
  answeredCount,
  totalCount,
}: ProgressBarProps) {
  const percent = totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100);
  const safeQuestionNumber =
    totalCount === 0 ? 0 : Math.min(totalCount, Math.max(1, currentQuestionNumber));

  return (
    <section aria-label="Progress bar" className="checkup-progress">
      <p className="checkup-progress-label">
        Question {safeQuestionNumber} of {totalCount} • {answeredCount}/{totalCount} answered
      </p>
      <div className="checkup-progress-track" aria-hidden="true">
        <div
          className="checkup-progress-fill"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
      <progress className="checkup-progress-native" value={answeredCount} max={totalCount} />
    </section>
  );
}
