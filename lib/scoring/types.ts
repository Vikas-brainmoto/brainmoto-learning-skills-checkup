export const FINAL_LEVEL_LABELS = [
  "Doing Well",
  "Still Developing",
  "Requires Support",
] as const;

export type FinalLevelLabel = (typeof FINAL_LEVEL_LABELS)[number];

export const ANSWER_OPTION_LABELS = [
  "Never",
  "Sometimes",
  "Often",
  "Very Often",
] as const;

export type AnswerOptionLabel = (typeof ANSWER_OPTION_LABELS)[number];

export interface AnswerOption {
  label: AnswerOptionLabel;
  points: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
}

export interface QuestionDefinition {
  id: string;
  skillId: string;
  text: string;
  options: readonly AnswerOption[];
}

export interface ScoringConfig {
  flow: "preprimary" | "primary";
  skills: readonly SkillDefinition[];
  questions: readonly QuestionDefinition[];
}

export type SubmittedAnswers = Record<string, AnswerOptionLabel>;

export interface SkillScoreResult {
  skillId: string;
  skillName: string;
  earnedPoints: number;
  maxPoints: number;
  normalizedScore: number;
  level: FinalLevelLabel;
}

export interface ScoreResult {
  flow: "preprimary" | "primary";
  skillScores: SkillScoreResult[];
  finalScore: number;
  finalLevel: FinalLevelLabel;
}

export const SKILL_DEFINITIONS: readonly SkillDefinition[] = [
  { id: "thinking_problem_solving", name: "Thinking & Problem Solving" },
  { id: "attention_self_regulation", name: "Attention & Self-Regulation" },
  { id: "working_memory", name: "Working Memory" },
  {
    id: "planning_executive_functions",
    name: "Planning Skills (Executive Functions)",
  },
  { id: "posture_body_management", name: "Posture & Body Management" },
  { id: "locomotor_movement_fluency", name: "Locomotor & Movement Fluency" },
  {
    id: "coordination_bilateral_integration",
    name: "Coordination & Bilateral Integration",
  },
  { id: "object_control_visual_tracking", name: "Object Control & Visual Tracking" },
] as const;

export const DEFAULT_ANSWER_OPTIONS: readonly AnswerOption[] = [
  { label: "Never", points: 3 },
  { label: "Sometimes", points: 2 },
  { label: "Often", points: 1 },
  { label: "Very Often", points: 0 },
] as const;
