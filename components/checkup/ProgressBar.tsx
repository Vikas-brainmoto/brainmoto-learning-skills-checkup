interface ProgressBarProps {
  answeredCount: number;
  totalCount: number;
}

export function ProgressBar({ answeredCount, totalCount }: ProgressBarProps) {
  const percent = totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100);

  return (
    <section aria-label="Progress bar">
      <p>
        Progress: {answeredCount}/{totalCount} answered ({percent}%)
      </p>
      <progress value={answeredCount} max={totalCount} />
    </section>
  );
}
