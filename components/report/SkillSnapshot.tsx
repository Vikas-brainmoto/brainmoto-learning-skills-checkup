import type { FinalLevelLabel } from "../../lib/scoring/types";

export interface SkillSnapshotItem {
  skillId: string;
  skillName: string;
  level: FinalLevelLabel;
  normalizedScore: number;
}

interface SkillSnapshotProps {
  skills: readonly SkillSnapshotItem[];
}

export function SkillSnapshot({ skills }: SkillSnapshotProps) {
  return (
    <section aria-label="Skill labels" style={{ maxWidth: "760px" }}>
      <h2>Skill Summary</h2>
      <ul>
        {skills.map((skill) => (
          <li key={skill.skillId} style={{ marginBottom: "0.5rem", wordBreak: "break-word" }}>
            <strong>{skill.skillName}:</strong> {skill.level} ({skill.normalizedScore}/100)
          </li>
        ))}
      </ul>
    </section>
  );
}
