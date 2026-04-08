import type { ReportData } from "../../lib/report/build-report-data";

interface ReportDocumentProps {
  report: ReportData;
}

function displayValue(value: string | null): string {
  if (!value) {
    return "-";
  }

  const normalized = value.trim();
  return normalized === "" ? "-" : normalized;
}

function scoreStatusColor(level: "Green" | "Amber" | "Red"): string {
  switch (level) {
    case "Green":
      return "#15803d";
    case "Amber":
      return "#d97706";
    case "Red":
      return "#dc2626";
    default:
      return "#d97706";
  }
}

export function ReportDocument({ report }: ReportDocumentProps) {
  const statusColor = scoreStatusColor(report.easeStatusLabel);

  return (
    <article className="report-paper">
      <header className="report-section report-header">
        <div className="report-brand-row">
          <img src={report.logoUrl} alt="Brand logo" width={56} height={56} />
          <div>
            <h1 className="report-title">Brainmoto Learning Skills Check-Up</h1>
            <p className="report-subtitle">Detailed Report</p>
          </div>
        </div>

        <section className="report-meta-grid">
          <p>
            <strong>Student Name:</strong> {report.childName}
          </p>
          <p>
            <strong>Grade:</strong> {displayValue(report.grade)}
          </p>
          <p>
            <strong>School Name:</strong> {displayValue(report.schoolName)}
          </p>
          <p>
            <strong>Division:</strong> {displayValue(report.division)}
          </p>
          <p>
            <strong>Housing Society:</strong> {displayValue(report.housingSocietyName)}
          </p>
        </section>
      </header>

      <section className="report-section report-score">
        <h2>Learning Ease Score</h2>
        <p className="report-score-main">
          <strong style={{ color: statusColor }}>{report.finalScore}</strong>
          <span>/100</span>
        </p>
        <p>
          <strong>Status:</strong> {report.easeStatusLabel} ({report.finalLevel})
        </p>
        <ul>
          <li>Green: Learning looks mostly smooth</li>
          <li>Amber: Some support can help</li>
          <li>Red: High-priority signs seen</li>
        </ul>
      </section>

      <section className="report-section report-snapshot">
        <h2>Your Learning Skills Snapshot</h2>
        <p>A quick view of the 8 learning areas.</p>
        <div className="report-snapshot-list">
          {report.skills.map((skill, index) => (
            <div key={skill.skillId} className="report-snapshot-row">
              <p>
                {index + 1}) {skill.skillName}
              </p>
              <p>
                {skill.level} ({skill.score}/100)
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section report-details">
        <h2>{report.detailHeading}</h2>
        {report.detailIntroLines.map((line) => (
          <p key={line} className="report-intro-line">
            {line}
          </p>
        ))}

        {report.skills.map((skill, index) => (
          <section key={skill.skillId} className="report-skill-detail">
            <h3>
              {index + 1}) {skill.detailTitle}
            </h3>
            {skill.sections.map((section) => (
              <div key={`${skill.skillId}-${section.heading}`} className="report-skill-block">
                <p className="report-skill-heading">{section.heading}</p>
                {section.body ? <p>{section.body}</p> : null}
                {section.bullets && section.bullets.length > 0 ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </section>
        ))}
      </section>

      <footer className="report-section report-footer">
        <a href="https://brainmoto.in" target="_blank" rel="noreferrer">
          Click here to understand this report better
        </a>
        <p>info@brainmoto.in | www.brainmoto.in | +91 99600 95665 | brainmoto_</p>
      </footer>
    </article>
  );
}
