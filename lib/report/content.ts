export interface ReportNarrativeSection {
  heading: string;
  body?: string;
  bullets?: string[];
}

export interface ReportSkillNarrative {
  skillId: string;
  detailTitle: string;
  sections: ReportNarrativeSection[];
}

export interface FlowNarrativeContent {
  detailHeading: string;
  detailIntroLines: string[];
  skillNarratives: ReportSkillNarrative[];
}

export const PREPRIMARY_FLOW_CONTENT: FlowNarrativeContent = {
  detailHeading: "If not well developed you may notice:",
  detailIntroLines: [],
  skillNarratives: [
    {
      skillId: "thinking_problem_solving",
      detailTitle: "Thinking & Problem Solving",
      sections: [
        {
          heading: "At home - Parents often notice",
          body: "child giving up quickly, needing help immediately, not trying new ways.",
        },
        {
          heading: "In school - It can affect tasks like",
          body: "puzzles, matching, building blocks, simple do-it-yourself tasks.",
        },
        {
          heading: "In the classroom - It may look like",
          body: "child avoiding new activities, needing constant adult help, low confidence in learning games.",
        },
      ],
    },
    {
      skillId: "attention_self_regulation",
      detailTitle: "Attention & Self-Regulation",
      sections: [
        {
          heading: "At home - Parents often notice",
          body: "child cannot stay with one activity, needs repeated calling, big meltdowns, difficulty waiting turn.",
        },
        {
          heading: "In school - It can affect tasks like",
          body: "circle time, listening to stories, following teacher directions, sharing.",
        },
        {
          heading: "In the classroom - It may look like",
          body: "child missing instructions, frequent reminders, difficulty settling, behaviour complaints.",
        },
      ],
    },
    {
      skillId: "working_memory",
      detailTitle: "Working Memory",
      sections: [
        {
          heading: "At home - Parents often notice",
          body: "child forgets 2-step instructions, forgets mid-task, needs immediate repetition.",
        },
        {
          heading: "In school - It can affect tasks like",
          body: "take your bottle and sit, pack up and line up, action songs.",
        },
        {
          heading: "In the classroom - It may look like",
          body: "child not completing tasks, confusion in routines, slower learning of rhymes and sequences.",
        },
      ],
    },
    {
      skillId: "planning_executive_functions",
      detailTitle: "Planning Skills (Executive Functions)",
      sections: [
        {
          heading: "At home - Parents often notice",
          body: "child does not start without help, leaves tasks unfinished, misplaces items, struggles with routines.",
        },
        {
          heading: "In school - It can affect tasks like",
          body: "completing a craft, cleaning up, following daily routines.",
        },
        {
          heading: "In the classroom - It may look like",
          body: "child leaves unfinished work, messy belongings, difficulty transitioning between activities.",
        },
      ],
    },
    {
      skillId: "posture_body_management",
      detailTitle: "Posture & Body Management",
      sections: [
        {
          heading: "At home - Parents often notice",
          body: "child slouching, hand tired quickly, cannot sit steady, clumsy indoors.",
        },
        {
          heading: "In school - It can affect tasks like",
          body: "colouring, drawing, pre-writing strokes, sitting for story time.",
        },
        {
          heading: "In the classroom - It may look like",
          body: "child has low table-work stamina, messy/slow pre-writing, constant shifting on the chair.",
        },
      ],
    },
    {
      skillId: "locomotor_movement_fluency",
      detailTitle: "Locomotor and Movement Fluency",
      sections: [
        {
          heading: "At home - Parents often notice",
          body: "child avoids running/jumping, struggles with hopping/balance, tires quickly, falls often.",
        },
        {
          heading: "In school - In preschool, it can affect tasks like",
          body: "playground participation, group games, confidence in movement.",
        },
        {
          heading: "In the classroom - It may look like",
          body: "child avoiding PE/play, low confidence, difficulty with movement-based learning games.",
        },
      ],
    },
    {
      skillId: "coordination_bilateral_integration",
      detailTitle: "Coordination & Bilateral Integration",
      sections: [
        {
          heading: "At home - Parents often notice",
          body: "child struggles using two hands together, difficulty with buttons/zips/shoes, frustration in fine tasks.",
        },
        {
          heading: "In school - It can affect tasks like",
          body: "scissors, tearing/pasting, beads, opening lunch boxes, dressing independence.",
        },
        {
          heading: "In the classroom - It may look like",
          body: "child has slow craft work, difficulty managing materials, reduced independence.",
        },
      ],
    },
    {
      skillId: "object_control_visual_tracking",
      detailTitle: "Object Control and Visual Tracking",
      sections: [
        {
          heading: "At home - Parents often notice",
          body: "child having poor catching/throwing/aiming, spills, difficulty tracking books/pictures/lines.",
        },
        {
          heading: "In school - It can affect",
          body: "activities like ball play, pouring, stacking/placing tasks, early book handling and visual tracking.",
        },
        {
          heading: "In the classroom - It may look like",
          body: "child having difficulty copying simple shapes, messy colouring within space, reduced readiness for reading/writing later.",
        },
      ],
    },
  ],
};

export const PRIMARY_FLOW_CONTENT: FlowNarrativeContent = {
  detailHeading: "Learning Skills - Detailed Explanations",
  detailIntroLines: [
    "Each skill below describes abilities that are actively developing during the primary school years.",
    "These skills influence how children manage classroom learning, homework, and daily routines.",
    "Development is gradual, and children may need different levels of support at different ages.",
  ],
  skillNarratives: [
    {
      skillId: "thinking_problem_solving",
      detailTitle: "Thinking & Problem Solving",
      sections: [
        {
          heading: "What this skill means at primary age",
          body: "This skill reflects how a child approaches challenges, tries different strategies, and works through problems during learning activities.",
        },
        {
          heading: "You may notice",
          bullets: [
            "Child gives up quickly when work feels difficult",
            "Prefers immediate help rather than trying another way",
            "Struggles to apply known methods to new problems",
          ],
        },
        {
          heading: "Why this matters",
          body: "Thinking and problem-solving skills support learning across subjects, especially when tasks become more complex and less familiar.",
        },
        {
          heading: "How it is best supported",
          bullets: [
            "Encouraging children to explain their thinking",
            "Allowing time to attempt solutions before helping",
            "Praising effort and strategy use, not just correct answers",
          ],
        },
      ],
    },
    {
      skillId: "attention_self_regulation",
      detailTitle: "Attention & Self-Regulation",
      sections: [
        {
          heading: "What this skill means at primary age",
          body: "This skill reflects how well a child can stay focused, manage impulses, and regulate emotions during classroom and learning activities.",
        },
        {
          heading: "You may notice",
          bullets: [
            "Difficulty staying focused during classwork or homework",
            "Frequent distraction by surroundings or peers",
            "Emotional reactions when corrected, rushed, or challenged",
          ],
        },
        {
          heading: "Why this matters",
          body: "As academic demands increase, children are expected to sustain attention for longer periods and manage their behaviour with less adult prompting.",
        },
        {
          heading: "How it is best supported",
          bullets: [
            "Clear routines and expectations",
            "Breaking work into smaller chunks",
            "Movement breaks and calm reminders",
          ],
        },
      ],
    },
    {
      skillId: "working_memory",
      detailTitle: "Working Memory",
      sections: [
        {
          heading: "What this skill means at primary age",
          body: "This skill reflects how a child holds and uses information in mind while completing a task.",
        },
        {
          heading: "You may notice",
          bullets: [
            "Difficulty following multi-step instructions",
            "Forgetting what to do next during a task",
            "Trouble keeping track of information while reading, writing, or solving maths problems",
          ],
        },
        {
          heading: "Why this matters",
          body: "Working memory supports mental maths, reading comprehension, written expression, and following classroom instructions.",
        },
        {
          heading: "How it is best supported",
          bullets: [
            "Giving instructions in steps",
            "Encouraging note-taking or visual reminders",
            "Repeating and rephrasing information when needed",
          ],
        },
      ],
    },
    {
      skillId: "planning_executive_functions",
      detailTitle: "Planning & Organisation",
      sections: [
        {
          heading: "What this skill means at primary age",
          body: "This skill reflects how a child plans tasks, manages materials, and organises time and belongings.",
        },
        {
          heading: "You may notice",
          bullets: [
            "Difficulty starting tasks independently",
            "Leaving work incomplete or rushing through it",
            "Misplacing books, notebooks, or homework",
          ],
        },
        {
          heading: "Why this matters",
          body: "Planning and organisation become increasingly important as children manage multiple subjects, assignments, and expectations.",
        },
        {
          heading: "How it is best supported",
          bullets: [
            "Clear instructions and task timelines",
            "Checklists or visual planners",
            "Adult guidance to break tasks into steps",
          ],
        },
      ],
    },
    {
      skillId: "posture_body_management",
      detailTitle: "Posture & Body Management Skill",
      sections: [
        {
          heading: "What this skill means at primary age",
          body: "This skill reflects how well a child maintains body posture and comfort during seated classroom activities.",
        },
        {
          heading: "You may notice",
          bullets: [
            "Slouching or frequent shifting while seated",
            "Fatigue during writing or desk work",
            "Complaints of discomfort during longer tasks",
          ],
        },
        {
          heading: "Why this matters",
          body: "Good posture and body control support handwriting endurance, attention, and overall classroom participation.",
        },
        {
          heading: "How it is best supported",
          bullets: [
            "Regular movement between seated tasks",
            "Proper seating and desk height",
            "Activities that strengthen core and postural muscles",
          ],
        },
      ],
    },
    {
      skillId: "locomotor_movement_fluency",
      detailTitle: "Locomotor and Movement Fluency",
      sections: [
        {
          heading: "What this skill means at primary age",
          body: "This skill reflects how confidently and smoothly a child moves during physical activities and play.",
        },
        {
          heading: "You may notice",
          bullets: [
            "Avoidance of sports or physical games",
            "Awkward or hesitant movement patterns",
            "Low stamina during PE or outdoor play",
          ],
        },
        {
          heading: "Why this matters",
          body: "Movement confidence supports physical health, social participation, and overall alertness for learning.",
        },
        {
          heading: "How it is best supported",
          bullets: [
            "Encouraging regular physical activity",
            "Non-competitive movement opportunities",
            "Gradual exposure to varied movement experiences",
          ],
        },
      ],
    },
    {
      skillId: "coordination_bilateral_integration",
      detailTitle: "Coordination & Bilateral Integration",
      sections: [
        {
          heading: "What this skill means at primary age",
          body: "This skill reflects how well a child uses both sides of the body together in coordinated tasks.",
        },
        {
          heading: "You may notice",
          bullets: [
            "Slow or effortful handwriting",
            "Difficulty managing classroom tools (ruler, scissors, geometry instruments)",
            "Reduced speed or independence in written work",
          ],
        },
        {
          heading: "Why this matters",
          body: "Bilateral coordination supports efficient writing, tool use, and overall classroom independence.",
        },
        {
          heading: "How it is best supported",
          bullets: [
            "Hands-on activities that use both hands together",
            "Fine-motor games and craft tasks",
            "Allowing adequate time for written work",
          ],
        },
      ],
    },
    {
      skillId: "object_control_visual_tracking",
      detailTitle: "Object Control & Visual Tracking",
      sections: [
        {
          heading: "What this skill means at primary age",
          body: "This skill reflects how well a child coordinates vision with hand and body movements.",
        },
        {
          heading: "You may notice",
          bullets: [
            "Difficulty copying from the board",
            "Losing place while reading",
            "Challenges with ball games or aiming tasks",
          ],
        },
        {
          heading: "Why this matters",
          body: "Visual tracking and object control support reading fluency, copying accuracy, and participation in sports and classroom activities.",
        },
        {
          heading: "How it is best supported",
          bullets: [
            "Activities that involve tracking, aiming, and catching",
            "Reducing visual clutter during work",
            "Encouraging regular breaks during visually demanding tasks",
          ],
        },
      ],
    },
  ],
};
