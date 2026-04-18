import type { FinalLevelLabel } from "../../lib/scoring/types";

interface ScoreHeroProps {
  source: "d2c" | "school";
  childName: string;
  grade: string;
  schoolName: string | null;
  division: string | null;
  housingSocietyName: string | null;
  logoUrl: string;
  finalScore: number;
  finalLevel: FinalLevelLabel;
  parentEmail: string;
  reportPath?: string | null;
  reportDownloadPath?: string | null;
  emailStatus?: "PENDING" | "SENT" | "FAILED" | null;
}

function displayValue(value: string | null): string {
  if (!value) {
    return "-";
  }

  const normalized = value.trim();
  return normalized === "" ? "-" : normalized;
}

function getStatusColorClass(level: FinalLevelLabel): string {
  switch (level) {
    case "Doing Well":
      return "ls-badge-green";
    case "Still Developing":
      return "ls-badge-amber";
    case "Requires Support":
      return "ls-badge-red";
    default:
      return "ls-badge-amber";
  }
}

function getScoreToneClass(level: FinalLevelLabel): string {
  switch (level) {
    case "Doing Well":
      return "ls-score-tone-green";
    case "Still Developing":
      return "ls-score-tone-amber";
    case "Requires Support":
      return "ls-score-tone-red";
    default:
      return "ls-score-tone-amber";
  }
}

export function ScoreHero({
  source,
  childName: _childName,
  grade,
  schoolName,
  division,
  housingSocietyName,
  logoUrl,
  finalScore,
  finalLevel,
  parentEmail,
  reportPath,
  reportDownloadPath,
  emailStatus = null,
}: ScoreHeroProps) {
  const statusClassName = getStatusColorClass(finalLevel);
  const scoreToneClassName = getScoreToneClass(finalLevel);

  return (
    <section className="ls-overview-block" aria-label="Score hero">
      <header className="ls-brand-header ls-brand-header-report ls-brand-header-result">
        <img src={logoUrl} alt="Brainmoto logo" className="ls-brand-logo" />
        <h1 className="ls-title-pill ls-title-pill-result">
          <span className="ls-title-pill-leading">Learning Skills</span>
          <span className="ls-title-pill-trailing">Check-Up</span>
        </h1>
      </header>

      <section className="ls-meta-grid">
        <p className="ls-meta-cell">
          <strong>Student Name:</strong> {displayValue(_childName)}
        </p>
        <p className="ls-meta-cell">
          <strong>Grade:</strong> {displayValue(grade)}
        </p>
        <p className="ls-meta-cell">
          <strong>School Name:</strong> {displayValue(schoolName)}
        </p>
        <p className="ls-meta-cell">
          <strong>Division:</strong> {displayValue(division)}
        </p>
        {source === "d2c" ? (
          <p className="ls-meta-cell ls-meta-cell-wide">
            <strong>Housing Society:</strong> {displayValue(housingSocietyName)}
          </p>
        ) : null}
      </section>

      <section className="ls-score-card">
        <div className="ls-score-left">
          <h2>Learning Ease Score</h2>
          <p className={`ls-score-number ${scoreToneClassName}`}>
            <strong>{finalScore}</strong>
            <span>/ 100</span>
          </p>
          <p className="ls-score-caption">
            Higher score = smoother day-to-day learning readiness
          </p>
        </div>
        <div className="ls-score-divider" />
        <div className="ls-score-right">
          <div className="ls-legend-row">
            <span className="ls-badge-green ls-legend-badge">Green</span>
            <span className="ls-legend-copy">Learning looks mostly smooth</span>
          </div>
          <div className="ls-legend-row">
            <span className="ls-badge-amber ls-legend-badge">Amber</span>
            <span className="ls-legend-copy">Some support can help</span>
          </div>
          <div className="ls-legend-row">
            <span className="ls-badge-red ls-legend-badge">Red</span>
            <span className="ls-legend-copy">High-priority signs seen</span>
          </div>
        </div>
      </section>

      <section className="ls-result-note">
        <div className="ls-result-note-grid">
          <div className="ls-result-note-copy">
            <p>
              <strong>Overall Support Status:</strong>{" "}
              <span className={statusClassName}>{finalLevel}</span>
            </p>
            <p>
              {emailStatus === "SENT" ? (
                <>
                  Detailed report link has been sent to <strong>{parentEmail}</strong>.
                </>
              ) : emailStatus === "FAILED" ? (
                "We could not send the report email right now. You can still use the report links below."
              ) : (
                <>
                  We are sending the detailed report link to{" "}
                  <strong>{parentEmail}</strong>.
                </>
              )}
            </p>
          </div>
          {reportPath || reportDownloadPath ? (
            <div className="ls-link-actions">
              {reportPath ? (
                <a className="ls-link-btn" href={reportPath}>
                  Open Full Report
                </a>
              ) : null}
              {reportDownloadPath ? (
                <a
                  className="ls-link-btn"
                  href={reportDownloadPath}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download Full Report
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
