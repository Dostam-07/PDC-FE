// Intent Classification & Routing Engine

export const classifyIntent = (message, activeContext = {}) => {
  const text = message.trim().toLowerCase();

  // Out of scope detection
  const outOfScopeKeywords = ["recipe", "movie", "football match", "weather forecast", "crypto", "bitcoin", "joke", "song lyrics"];
  if (outOfScopeKeywords.some(kw => text.includes(kw))) {
    return {
      intent: "OUT_OF_SCOPE",
      deflectionMessage: "I'm designed to help with programme design, education-related knowledge, and programme planning. I'd be happy to help you design a programme, explore frameworks, or answer questions related to education and programme implementation."
    };
  }

  // UC3: Context-Aware Entry / Specific Component Request Detection
  const specificOutputTriggers = [
    "list outcomes", "generate outcomes", "create outcomes",
    "list activities", "generate activities", "create activities",
    "list indicators", "generate metrics", "create indicators",
    "create persona", "define stakeholders", "write assumptions",
    "give me outputs", "draft indicators", "generate persona map"
  ];

  if (specificOutputTriggers.some(trigger => text.includes(trigger))) {
    // Determine which LFA level is requested
    let targetComponent = "Outcomes";
    if (text.includes("activity") || text.includes("activities")) targetComponent = "Activities";
    else if (text.includes("indicator") || text.includes("metric")) targetComponent = "Outcome Indicators";
    else if (text.includes("output")) targetComponent = "Outputs";
    else if (text.includes("persona") || text.includes("stakeholder")) targetComponent = "Personas & Stakeholders";
    else if (text.includes("assumption") || text.includes("risk")) targetComponent = "Assumptions & Risks";

    return {
      intent: "CONTEXT_AWARE_ENTRY",
      targetComponent,
      extractedPrompt: message
    };
  }

  // UC2: Guided Programme Design triggers
  const challengeTriggers = [
    "we want to improve", "how do i solve", "facing a problem",
    "challenge in", "need to design a program", "planning an intervention",
    "we need to address", "improve student engagement", "low learning levels",
    "teacher absenteeism", "school dropouts"
  ];

  if (challengeTriggers.some(trigger => text.includes(trigger))) {
    return {
      intent: "GUIDED_DESIGN",
      stage: "PROBLEM_IDENTIFIED",
      challengeText: message
    };
  }

  // UC1: Knowledge Seeker triggers
  const knowledgeTriggers = [
    "what is", "how is", "show me examples", "tell me about",
    "explain", "what does", "best practices", "case study",
    "monitoring frameworks", "leadership resources"
  ];

  if (knowledgeTriggers.some(trigger => text.includes(trigger)) || text.endsWith("?")) {
    return {
      intent: "KNOWLEDGE_SEEKER",
      queryText: message
    };
  }

  // Default to Guided Design if active design session exists, else Knowledge query
  if (activeContext && activeContext.inDesignWorkflow) {
    return {
      intent: "GUIDED_DESIGN_FOLLOWUP",
      userResponse: message
    };
  }

  return {
    intent: "KNOWLEDGE_SEEKER",
    queryText: message
  };
};
