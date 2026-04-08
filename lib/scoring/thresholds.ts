import type { FinalLevelLabel } from "./types";

export function mapScoreToFinalLevel(score: number): FinalLevelLabel {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(`Score must be between 0 and 100. Received: ${score}`);
  }

  if (score >= 70) {
    return "Doing Well";
  }

  if (score >= 45) {
    return "Still Developing";
  }

  return "Requires Support";
}
