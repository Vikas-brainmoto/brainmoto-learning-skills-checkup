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
  interpretation: string;
  parentEmail: string;
}

export function ScoreHero({
  source,
  childName,
  grade,
  schoolName,
  division,
  housingSocietyName,
  logoUrl,
  finalScore,
  finalLevel,
  interpretation,
  parentEmail,
}: ScoreHeroProps) {
  return (
    <section
      aria-label="Score hero"
      style={{ display: "grid", gap: "0.75rem", maxWidth: "760px" }}
    >
      <img src={logoUrl} alt={`${schoolName} logo`} width={88} height={88} />
      <h1 style={{ margin: 0, wordBreak: "break-word" }}>
        {childName}
        {"'s "}
        Learning Skills Check-Up Result
      </h1>
      <p style={{ margin: 0 }}>Grade: {grade}</p>
      <p style={{ margin: 0, wordBreak: "break-word" }}>School: {schoolName || "-"}</p>
      <p style={{ margin: 0, wordBreak: "break-word" }}>Division: {division || "-"}</p>
      {source === "d2c" ? (
        <p style={{ margin: 0, wordBreak: "break-word" }}>
          Housing Society: {housingSocietyName || "-"}
        </p>
      ) : null}
      <p style={{ margin: 0, fontWeight: 700 }}>Final Score: {finalScore}/100</p>
      <p style={{ margin: 0, fontWeight: 700 }}>Final Label: {finalLevel}</p>
      <p style={{ margin: 0 }}>{interpretation}</p>
      <p style={{ margin: 0, wordBreak: "break-word" }}>
        Detailed report link will be sent to {parentEmail}.
      </p>
    </section>
  );
}
