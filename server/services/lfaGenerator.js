// Logical Framework Analysis (LFA) & Component Generator

export const generateSocraticQuestion = (currentStep, collectedContext) => {
  if (currentStep === 1) {
    return {
      step: 2,
      question: "Thank you for sharing the challenge. If this challenge is addressed successfully, what would be different? What specific change would you expect to see in people, practices, or systems?",
      quickReplies: [
        "Teachers use active pedagogy & students participate",
        "Learning outcomes improve by 20% in FLN",
        "School leaders conduct regular academic reviews"
      ]
    };
  }

  if (currentStep === 2) {
    return {
      step: 3,
      question: "Where and with whom are you working (e.g. school, cluster, district or state level, over what timeline)? Also, what have the people this program is for (teachers, students, parents) actually told you about this problem?",
      quickReplies: [
        "Primary schools in 2 districts over 2 academic years",
        "Statewide middle schools over 3 years",
        "District-level high schools for 1 year"
      ]
    };
  }

  // Step 3 completed -> Synthesize Programme Goal for Confirmation
  const challenge = collectedContext.challenge || "improving learning outcomes";
  const expectedChange = collectedContext.expectedChange || "enhanced teacher pedagogy and student active participation";
  const scope = collectedContext.scope || "district primary schools over 2 academic years";

  const synthesizedGoal = `To address "${challenge}" by achieving "${expectedChange}" across ${scope}.`;

  return {
    step: "GOAL_CONFIRMATION",
    goalSummary: synthesizedGoal,
    message: `Based on what you've shared, here is the synthesized goal for your programme:\n\n🎯 **Programme Goal:** ${synthesizedGoal}\n\nDoes this accurately reflect your goal, or would you like to modify it?`,
    quickReplies: ["Yes, that's correct", "Modify Goal"]
  };
};

export const generateFullLFA = (context) => {
  const challenge = context.challenge || "Low student engagement and foundational learning levels in primary schools";
  const change = context.expectedChange || "Teachers adopt structured lesson plans and reflective peer observations";
  const scope = context.scope || "Government middle schools across 2 districts over 2 academic years";
  const goal = context.goal || `Improve foundational learning outcomes across ${scope}`;

  const lfaMatrix = {
    title: `Logical Framework Matrix: ${goal.substring(0, 60)}...`,
    frameworkType: "LFA (Logical Framework Approach)",
    challengeStatement: challenge,
    goal: goal,
    impact: {
      statement: "Sustainable improvement in foundational literacy and numeracy (FLN) competencies among middle school students.",
      indicators: "At least 25% increase in grade-appropriate learning levels measured by independent state endline assessments."
    },
    outcomes: [
      {
        id: "out-1",
        statement: "Outcome 1: At least 80% of trained teachers demonstrate structured lesson planning aligned to the state curriculum framework, as observed in fortnightly classroom visits.",
        indicator: "% of teachers scoring >80% on standard classroom observation rubric",
        meansOfVerification: "Fortnightly observation forms logged by District Coordinators"
      },
      {
        id: "out-2",
        statement: "Outcome 2: Teachers conduct peer observation sessions at least once a fortnight and document feedback using standardized tools.",
        indicator: "Average of 2 peer observation logs submitted per teacher per month",
        meansOfVerification: "Digital peer feedback logs on teacher portal"
      },
      {
        id: "out-3",
        statement: "Outcome 3: Student learning data is used by teachers during monthly review meetings to adjust teaching approaches for struggling students.",
        indicator: "% of monthly review meetings recording data-driven action plans",
        meansOfVerification: "Monthly review meeting minutes and student spot-check logs"
      },
      {
        id: "out-4",
        statement: "Outcome 4: Trained teachers report increased confidence in subject knowledge and classroom management.",
        indicator: "Pre/post self-assessment perception survey score improvement of >30%",
        meansOfVerification: "Pre-intervention and post-intervention teacher survey"
      }
    ],
    outputs: [
      {
        id: "op-1",
        statement: "Output 1: Standardized FLN Teaching-Learning Materials (TLM) and lesson plan handbooks created and distributed to all schools."
      },
      {
        id: "op-2",
        statement: "Output 2: 50 Master Trainers and 400 Primary School Teachers trained in active learning pedagogy."
      },
      {
        id: "op-3",
        statement: "Output 3: Monthly peer observation and feedback rubrics deployed across target districts."
      }
    ],
    activities: [
      {
        id: "act-1",
        description: "Activity 1.1: Conduct 3-day experiential workshop for Master Trainers on classroom engagement strategies.",
        metric: "50 Master Trainers certified (100% target); Process Metric: 95% attendance and post-test mastery score >85%."
      },
      {
        id: "act-2",
        description: "Activity 1.2: Roll out bi-weekly cluster teacher learning circles for peer observation review.",
        metric: "24 cluster meetings conducted per district per year; Process Metric: % of target teachers attending bi-weekly meetings."
      },
      {
        id: "act-3",
        description: "Activity 1.3: Provide monthly on-ground academic support and classroom co-teaching visits.",
        metric: "Minimum 4 classroom co-teaching visits per school per term by District Mentors."
      }
    ],
    personas: [
      {
        role: "District Education Officer (DEO)",
        responsibilities: "Overarching administrative oversight, monthly progress review, allocating resources."
      },
      {
        role: "Cluster Resource Person (CRP) / Mentor",
        responsibilities: "Conducting fortnightly classroom observations, supporting peer learning circles, verifying data."
      },
      {
        role: "Primary School Teacher",
        responsibilities: "Executing structured lesson plans, participating in peer observations, submitting monthly logs."
      }
    ],
    assumptions: [
      "School leadership remains supportive of teacher release time for cluster meetings.",
      "Teacher transfer rates remain below 10% during the project implementation period."
    ],
    risks: [
      {
        risk: "Administrative burden reducing teacher time spent on instruction.",
        mitigation: "Digitize observation forms and streamline reporting into a single 5-minute mobile submission."
      }
    ],
    resources: [
      "Master Trainer honorariums, printed TLM kits, digital observation app, monthly review travel allowances."
    ]
  };

  // Proactive Improvement Suggestion Engine (Separated post-output review)
  const proactiveSuggestion = {
    id: "sug-001",
    targetSection: "Outcome 4",
    issue: "Outcome 4 relies solely on teacher self-assessment perception surveys, which can be prone to self-reporting bias.",
    reasoning: "Self-reported data is useful for perception, but easy to score high without actual behavior change in the classroom. A stronger version pairs self-assessment with structured classroom observations or student learning proxies.",
    proposedChange: "Revised Outcome 4: At least 70% of trained teachers show measurable improvement in lesson delivery quality, assessed through a structured classroom observation rubric administered at the beginning and end of the programme.",
    quickAction: "Update Outcome 4 with this version"
  };

  return { lfaMatrix, proactiveSuggestion };
};

// Generate Specific Component (UC3 Context-Aware Entry)
export const generateSpecificComponent = (componentType, userContext) => {
  const scope = userContext.scope || "District level primary school teachers across 3 districts in Rajasthan";

  if (componentType === "Outcomes") {
    return {
      componentName: "Outcomes List",
      scope,
      items: [
        {
          title: "Outcome 1: Structured Curriculum Alignment",
          text: "At least 80% of trained teachers demonstrate structured lesson planning aligned to state curriculum framework, as observed in fortnightly classroom visits."
        },
        {
          title: "Outcome 2: Peer Observation & Feedback",
          text: "Teachers conduct peer observation sessions at least once a fortnight and document feedback using a standardized observation form."
        },
        {
          title: "Outcome 3: Data-Driven Instruction",
          text: "Student learning data is used by teachers during monthly review meetings to identify struggling students and adjust teaching approaches."
        },
        {
          title: "Outcome 4: Pedagogical Confidence & Quality",
          text: "Trained teachers report increased confidence in subject knowledge and classroom management, measured through pre/post self-assessment."
        }
      ],
      proactiveSuggestion: {
        id: "sug-uc3-outcomes",
        targetSection: "Outcome 4",
        issue: "Outcome 4 relies on self-reported perception surveys.",
        reasoning: "Pairing self-assessment with an external observation rubric provides externally verifiable results rather than just perception scores.",
        proposedChange: "Revised Outcome 4: At least 70% of trained teachers show measurable improvement in lesson delivery quality, assessed through a structured classroom observation rubric administered at the beginning and end of the programme.",
        quickAction: "Update Outcome 4"
      }
    };
  }

  if (componentType === "Activities") {
    return {
      componentName: "Activities & Process Metrics",
      scope,
      items: [
        {
          title: "Activity 1: Master Trainer Capacity Building",
          text: "Conduct 4-day residential workshop for 60 Master Trainers on activity-based pedagogy.",
          metric: "Process Metric: 100% Master Trainers complete post-workshop rubric certification."
        },
        {
          title: "Activity 2: Cluster Level Teacher Learning Circles",
          text: "Facilitate monthly peer learning circles for 1,200 primary teachers across 3 districts.",
          metric: "Process Metric: % of teachers attending at least 8 out of 10 annual circle meetings."
        },
        {
          title: "Activity 3: Digital Lesson Plan Distribution",
          text: "Provide weekly digitized teaching guides via mobile app.",
          metric: "Process Metric: App active user rate >85% among target teachers."
        }
      ]
    };
  }

  if (componentType === "Outcome Indicators") {
    return {
      componentName: "Outcome Indicators & Metrics",
      scope,
      items: [
        {
          title: "Indicator 1 (Curriculum Alignment)",
          text: "% of observed teachers scoring >4 on 5-point lesson plan execution rubric during quarterly spot-checks."
        },
        {
          title: "Indicator 2 (Peer Practice)",
          text: "Average count of documented peer feedback sessions completed per school per month (Target: >=2)."
        },
        {
          title: "Indicator 3 (Student Learning Growth)",
          text: "% increase in students achieving grade-level reading fluency by end of Academic Year 2."
        }
      ]
    };
  }

  return {
    componentName: componentType,
    scope,
    items: [
      {
        title: `${componentType} Draft`,
        text: `Custom ${componentType} generated for ${scope} based on provided context.`
      }
    ]
  };
};
