import { preprimaryConfig } from "./config/preprimary";
import { primaryConfig } from "./config/primary";
import type { ScoringConfig } from "./types";

export const PREPRIMARY_GRADES = ["Nursery", "Jr KG", "Sr KG", "UKG"] as const;
export const PRIMARY_GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
] as const;
export const ALL_GRADES = [...PREPRIMARY_GRADES, ...PRIMARY_GRADES] as const;

export type GradeBandFlow = "preprimary" | "primary";

export function resolveFlowFromGrade(grade: string): GradeBandFlow | null {
  if (PREPRIMARY_GRADES.includes(grade as (typeof PREPRIMARY_GRADES)[number])) {
    return "preprimary";
  }

  if (PRIMARY_GRADES.includes(grade as (typeof PRIMARY_GRADES)[number])) {
    return "primary";
  }

  return null;
}

export function getQuestionConfigForGrade(grade: string): ScoringConfig {
  const flow = resolveFlowFromGrade(grade);

  if (flow === "preprimary") {
    return preprimaryConfig;
  }

  if (flow === "primary") {
    return primaryConfig;
  }

  throw new Error(`Unsupported grade "${grade}" for question branching.`);
}
