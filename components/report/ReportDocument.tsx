import type { ReportData } from "../../lib/report/build-report-data";
import type { FinalLevelLabel } from "../../lib/scoring/types";
import { ReportFooter } from "./ReportFooter";

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
      return "#f5ba33";
    case "Red":
      return "#dc2626";
    default:
      return "#f5ba33";
  }
}

function getSupportStatusClass(level: FinalLevelLabel): string {
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

export function ReportDocument({ report }: ReportDocumentProps) {
  const statusColor = scoreStatusColor(report.easeStatusLabel);

  return (
    <article className="report-paper ls-report-paper">
      <section className="ls-overview-block">
        <header className="ls-brand-header ls-brand-header-report">
          <img src={report.logoUrl} alt="Brainmoto logo" className="ls-brand-logo" />
          <h1 className="ls-title-pill ls-title-pill-report">
            <span className="ls-title-pill-leading">Learning Skills</span>
            <span className="ls-title-pill-trailing">Check-Up</span>
          </h1>
        </header>

        <section className="ls-meta-grid">
          <p className="ls-meta-cell">
            <strong>Student Name:</strong> {displayValue(report.childName)}
          </p>
          <p className="ls-meta-cell">
            <strong>Grade:</strong> {displayValue(report.grade)}
          </p>
          <p className="ls-meta-cell">
            <strong>School Name:</strong> {displayValue(report.schoolName)}
          </p>
          <p className="ls-meta-cell">
            <strong>Division:</strong> {displayValue(report.division)}
          </p>
          {report.source === "d2c" ? (
            <p className="ls-meta-cell ls-meta-cell-wide">
              <strong>Housing Society:</strong> {displayValue(report.housingSocietyName)}
            </p>
          ) : null}
        </section>

        <section className="ls-score-card">
          <div className="ls-score-left">
            <h2>Learning Ease Score</h2>
            <p className="ls-score-number">
              <strong style={{ color: statusColor }}>{report.finalScore}</strong>
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

        <section className="ls-snapshot-card">
          <h2 className="ls-snapshot-heading">
            <span>Your Learning Skills Snapshot</span>
            <span>A quick view of the 8 learning areas.</span>
          </h2>

          <table className="ls-snapshot-table-native">
            <thead>
              <tr>
                <th scope="col">Learning Skills</th>
                <th scope="col">Support Status</th>
              </tr>
            </thead>
            <tbody>
              {report.skills.map((skill, index) => (
                <tr key={skill.skillId}>
                  <td>
                    {index + 1}) {skill.skillName}
                  </td>
                  <td>
                    <span className={getSupportStatusClass(skill.level)}>
                      {skill.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>

      <section className="ls-details-block">
        <section className={`ls-detail-page ls-detail-page-${report.gradeBand} ls-detail-page-first`}>
          {report.gradeBand === "primary" ? (
            <div className="ls-detail-intro-primary">
              <h2>{report.detailHeading}</h2>
              {report.detailIntroLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            <div className="ls-detail-intro-preprimary">
              <h2>Learning Skills Detailed Explanation</h2>
              <p>{report.detailHeading}</p>
            </div>
          )}

          <div className="ls-detail-skill-list">
            {report.skills.map((skill, index) => {
              const skillNumber = index + 1;

              return (
                <section key={skill.skillId} className="ls-detail-skill">
                  <h3 className="ls-detail-skill-title">
                    {skillNumber}) {skill.detailTitle}
                  </h3>
                  <div className="ls-detail-skill-body">
                    {skill.sections.map((section) => (
                      <div key={`${skill.skillId}-${section.heading}`} className="ls-detail-section">
                        {report.gradeBand === "preprimary" ? (
                          section.body ? (
                            <p>
                              <strong>{section.heading}</strong>
                              {": "}
                              {section.body}
                            </p>
                          ) : (
                            <p>
                              <strong>{section.heading}</strong>
                            </p>
                          )
                        ) : (
                          <>
                            <p>
                              <strong>{section.heading}</strong>
                            </p>
                            {section.body ? <p>{section.body}</p> : null}
                          </>
                        )}
                        {section.bullets && section.bullets.length > 0 ? (
                          <ul>
                            {section.bullets.map((bullet) => (
                              <li key={bullet}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <ReportFooter />
        </section>
      </section>
    </article>
  );
}
