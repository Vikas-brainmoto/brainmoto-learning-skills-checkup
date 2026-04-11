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

function getStatusClass(level: FinalLevelLabel): string {
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

export function SkillSnapshot({ skills }: SkillSnapshotProps) {
  return (
    <section aria-label="Skill labels" className="ls-snapshot-card">
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
          {skills.map((skill, index) => (
            <tr key={skill.skillId}>
              <td>
                {index + 1}) {skill.skillName}
              </td>
              <td>
                <span className={getStatusClass(skill.level)}>{skill.level}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
