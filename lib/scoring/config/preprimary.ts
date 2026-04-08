import {
  DEFAULT_ANSWER_OPTIONS,
  SKILL_DEFINITIONS,
  type QuestionDefinition,
  type ScoringConfig,
} from "../types";

export const preprimarySkills = SKILL_DEFINITIONS;

export const preprimaryQuestions: readonly QuestionDefinition[] = [
  {
    id: "pre_q1",
    skillId: "thinking_problem_solving",
    text: "Does your child give up quickly when something feels difficult? (toy/task/activity etc.)",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q2",
    skillId: "thinking_problem_solving",
    text: "When blocks keep falling, does your child try building differently, or give up after 1-2 falls?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q3",
    skillId: "attention_self_regulation",
    text: "Does your child find it hard to stay with one activity for 5 minutes (colouring, puzzle, story, sorting)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q4",
    skillId: "attention_self_regulation",
    text: "Does your child struggle to wait for a turn during play (snatches, rushes, interrupts)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q5",
    skillId: "working_memory",
    text: "Does your child forget a simple 2-part instruction (example: Bring your red book and colour pencils and sit here)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q6",
    skillId: "working_memory",
    text: "Does your child struggle to tell you what happened in the correct order (example: what they did first, next, last)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q7",
    skillId: "planning_executive_functions",
    text: "How often does your child need a lot of help to start an activity (will not begin without you sitting with them)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q8",
    skillId: "planning_executive_functions",
    text: "Does your child move from one activity to another and leave things unfinished (half coloring, half puzzle)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q9",
    skillId: "planning_executive_functions",
    text: "How often does your child misplace everyday items (water bottle, toy, shoes) and cannot find them without help?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q10",
    skillId: "posture_body_management",
    text: "How often does your child find it hard to sit properly during table work (example: bends too close to the book, or keeps slipping/leaning and changing position again and again)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q11",
    skillId: "posture_body_management",
    text: "How often does your child stop quickly saying \"my hand is tired\" during colouring, drawing, or writing?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q12",
    skillId: "posture_body_management",
    text: "How often does your child seem clumsy (bumps into things, trips often, drops items easily)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q13",
    skillId: "locomotor_movement_fluency",
    text: "How often does your child avoid active play like running, jumping, or climbing (seems less confident, prefers to watch or stay aside)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q14",
    skillId: "locomotor_movement_fluency",
    text: "Does your child fall or lose balance during play?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q15",
    skillId: "coordination_bilateral_integration",
    text: "How often does your child find it hard to do two-hand tasks (Example 1: hold paper with one hand and colour/cut with the other hand, Example 2: pull pants/shorts up or down using both hands)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q16",
    skillId: "coordination_bilateral_integration",
    text: "How often does your child find it hard to build or fix toys that need two hands (example: one hand holds a block steady, the other hand joins another block)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q17",
    skillId: "coordination_bilateral_integration",
    text: "How often does your child struggle with action games that need timing (clapping games, catch and throw)?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q18",
    skillId: "object_control_visual_tracking",
    text: "How often does your child miss when trying to catch a big soft ball or balloon that comes towards them slowly? (for example, when you gently roll or toss it to them)",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q19",
    skillId: "object_control_visual_tracking",
    text: "How often does your child find it hard to follow your finger with their eyes when you move it slowly left to right?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
  {
    id: "pre_q20",
    skillId: "object_control_visual_tracking",
    text: "How often does your child struggle with aiming tasks like pouring water into a glass, putting objects into a small box, or colouring within space?",
    options: DEFAULT_ANSWER_OPTIONS,
  },
];

export const preprimaryConfig: ScoringConfig = {
  flow: "preprimary",
  skills: preprimarySkills,
  questions: preprimaryQuestions,
};
