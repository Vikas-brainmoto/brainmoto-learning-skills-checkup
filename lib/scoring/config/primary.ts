import {
  DEFAULT_ANSWER_OPTIONS,
  SKILL_DEFINITIONS,
  type QuestionDefinition,
  type ScoringConfig,
} from "../types";

export const primarySkills = SKILL_DEFINITIONS;

export const primaryQuestions: readonly QuestionDefinition[] = [
  {
    id: "pri_q1",
    skillId: "thinking_problem_solving",
    text: "When your child gets stuck (simple tasks or play), do they try a different way or immediately ask for your help?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q2",
    skillId: "thinking_problem_solving",
    text: "Does your child give up quickly when a question feels difficult (especially in maths/word problems)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q3",
    skillId: "attention_self_regulation",
    text: "Does your child get distracted easily and find it hard to stay focused on one task (like homework, reading etc.) for 10-15 minutes?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q4",
    skillId: "attention_self_regulation",
    text: "Does your child find it hard to wait for their turn or interrupts when others are speaking (at home, in class, or during play)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q5",
    skillId: "working_memory",
    text: "Does your child forget multi-step instructions and need you to repeat instructions immediately because they forget the steps? (example: Get your bottle, put the notebook in the bag, and come back)",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q6",
    skillId: "working_memory",
    text: "How often does your child forget where they kept something just a few minutes ago (pencil, eraser, bottle)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q7",
    skillId: "planning_executive_functions",
    text: "How often does your child get confused while packing their school bag (misses items or packs wrong things)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q8",
    skillId: "planning_executive_functions",
    text: "How often does your child get confused about what to wear while getting ready to go out?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q9",
    skillId: "planning_executive_functions",
    text: "Does your child delay starting homework even when they know what to do and leave homework/home tasks unfinished unless you sit and monitor?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q10",
    skillId: "posture_body_management",
    text: "How often does your child find it hard to sit steady for homework and get tired quickly during writing?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q11",
    skillId: "posture_body_management",
    text: "Does your child avoid writing or struggle to keep handwriting neat and consistent?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q12",
    skillId: "posture_body_management",
    text: "Does your child trip or fall often while playing?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q13",
    skillId: "locomotor_movement_fluency",
    text: "Does your child avoid active play (sports etc) or feel hesitant in running games (prefers to sit out or watch)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q14",
    skillId: "locomotor_movement_fluency",
    text: "Does your child get tired quickly during continuous movement (after 5-10 minutes of active play)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q15",
    skillId: "coordination_bilateral_integration",
    text: "Does your child struggle with tasks that need both hands to work in a sequence (e.g., tying shoelaces, buttoning a shirt, jacket zips - where one hand holds and the other pulls)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q16",
    skillId: "coordination_bilateral_integration",
    text: "Does your child struggle to catch a small ball with two hands (hands do not come together in time and the ball slips through)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q17",
    skillId: "coordination_bilateral_integration",
    text: "Does your child find it hard to jump in a proper rhythm (while playing hopscotch, skipping rope, or other games)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q18",
    skillId: "object_control_visual_tracking",
    text: "Does your child spill water while pouring from a jug into a glass?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q19",
    skillId: "object_control_visual_tracking",
    text: "Does your child lose track of where they are while reading (skips lines or repeats the same line)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pri_q20",
    skillId: "object_control_visual_tracking",
    text: "Does your child struggle in bat/racket games (batting in cricket, badminton, etc)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
];

export const primaryConfig: ScoringConfig = {
  flow: "primary",
  skills: primarySkills,
  questions: primaryQuestions,
};
