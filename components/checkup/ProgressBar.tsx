interface ProgressBarProps {
  currentQuestionNumber: number;
  answeredCount: number;
  unansweredCount: number;
  totalCount: number;
}

export function ProgressBar({
  currentQuestionNumber,
  answeredCount,
  unansweredCount,
  totalCount,
}: ProgressBarProps) {
  const percent = totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100);
  const safeQuestionNumber =
    totalCount === 0 ? 0 : Math.min(totalCount, Math.max(1, currentQuestionNumber));

  return (
    <section aria-label="Progress bar" className="checkup-progress">
      <div className="checkup-progress-head">
        <p className="checkup-progress-label">
          Question {safeQuestionNumber} of {totalCount} • {answeredCount}/{totalCount} answered
        </p>
        <span className="checkup-unanswered-chip">Unanswered: {Math.max(0, unansweredCount)}</span>
      </div>
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
