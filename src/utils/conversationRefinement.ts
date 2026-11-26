import { LFAMatrix, LFAPersona, LFAOutcome, LFAActivity, LFAOutput } from '../types/lfa';

export interface RefinementResult {
  updatedMatrix: LFAMatrix;
  responseMessage: string;
  quickReplies?: string[];
  changeSummary: {
    action: 'add' | 'remove' | 'modify' | 'compound' | 'explain';
    section: 'stakeholders' | 'outcomes' | 'activities' | 'outputs' | 'impact' | 'challenge' | 'inputs' | 'general';
    item: string;
    missingDependencies?: string[];
  };
}

export interface StakeholderDefinition {
  canonicalName: string;
  shortKey: string;
  level: string;
  responsibilities: string;
  outcomeStmt: string;
  indicatorA: string;
  indicatorB: string;
  activityDesc: string;
  activityMetric: string;
  outputStmt: string;
}

export const KNOWN_STAKEHOLDERS: StakeholderDefinition[] = [
  {
    canonicalName: 'Students',
    shortKey: 'student',
    level: 'School Level',
    responsibilities: 'Participates in 45-minute daily guided and independent oral reading practice using leveled reader kits.',
    outcomeStmt: 'Grade 2-3 primary students read grade-level decodable and narrative texts with accuracy, fluency, and comprehension.',
    indicatorA: '≥75% of Grade 2-3 students achieving grade-level oral reading fluency benchmarks (≥45 words per minute).',
    indicatorB: '≥70% of enrolled students demonstrating reading comprehension on end-of-term diagnostic checks.',
    activityDesc: 'Provide daily structured classroom reading blocks, paired reading sessions, and graded reading corner kits.',
    activityMetric: 'Daily 45-minute literacy block held across all targeted schools.',
    outputStmt: 'Student leveled reading cards, classroom reading corners established, and reading fluency tracking charts.'
  },
  {
    canonicalName: 'Teachers',
    shortKey: 'teacher',
    level: 'School Level',
    responsibilities: 'Delivers daily structured oral reading fluency practice using consistent pedagogical routine steps.',
    outcomeStmt: 'Primary teachers run daily structured oral reading practice with Grade 2-3 students using consistent pedagogical steps and formative tracking.',
    indicatorA: 'Share of sampled teachers observed whose oral reading sessions use consistent routine steps with ≥85% fidelity.',
    indicatorB: 'Share of Grade 2-3 students reading fluently at 45 or more words per minute.',
    activityDesc: 'Train and coach regular class teachers to run fixed oral reading routines and record student reading rates.',
    activityMetric: 'Weekly classroom practice observed across all targeted classrooms.',
    outputStmt: 'Teacher coaching sessions held and reading fluency assessment records maintained.'
  },
  {
    canonicalName: 'School Leaders (HTs/HMs)',
    shortKey: 'head teacher',
    level: 'School Level',
    responsibilities: 'Ensures scheduled reading timetable slots are protected and reviews class-level reading rate logs weekly.',
    outcomeStmt: 'School leaders keep a fixed oral reading slot in the school timetable and protect it when other demands on class time arise.',
    indicatorA: 'Number of School Leaders whose timetable holds a fixed oral reading slot and whose records show the slot was kept.',
    indicatorB: '% of school leaders conducting weekly reading log reviews with Grade 2-3 teachers.',
    activityDesc: 'Coach school leaders to timetable and protect daily oral reading slots and conduct weekly review meetings.',
    activityMetric: '100% of school leaders complete instructional leadership orientation.',
    outputStmt: 'Protected school timetable schedules and weekly reading log review trackers.'
  },
  {
    canonicalName: 'Parents & SMC Members',
    shortKey: 'parent',
    level: 'Community Level',
    responsibilities: 'Encourages 15-minute daily home oral reading habits and reviews reading progress during quarterly SMC meetings.',
    outcomeStmt: 'Parents and SMC members actively support 15-minute daily home reading habits and participate in termly reading progress reviews.',
    indicatorA: 'Share of sampled parents confirming 15-minute daily home reading support with verified reading cards.',
    indicatorB: '≥75% of targeted families maintain verified home reading logs and participate in SMC reviews.',
    activityDesc: 'Organize quarterly community SMC reading melas and distribute home reading companion cards.',
    activityMetric: 'Quarterly SMC reading meetings convened.',
    outputStmt: 'Home reading companion cards distributed and SMC meeting minutes logged.'
  },
  {
    canonicalName: 'Cluster Head Teachers (CHTs)',
    shortKey: 'cht',
    level: 'Cluster Level',
    responsibilities: 'Leads cluster-level administrative review of timetable adherence, teacher attendance, and resource allocations.',
    outcomeStmt: 'Cluster Head Teachers monitor school timetable fidelity and conduct peer reviews of foundational literacy blocks.',
    indicatorA: '100% of cluster schools inspected for protected literacy timetable compliance by CHTs.',
    indicatorB: 'Reduction in reported multi-grade timetable disruptions across cluster schools.',
    activityDesc: 'Convene monthly CHT cluster administrative reviews and timetable audits.',
    activityMetric: 'Monthly CHT cluster reviews conducted.',
    outputStmt: 'Cluster timetable compliance logs and administrative review registers.'
  },
  {
    canonicalName: 'Cluster Resource Persons (CRPs)',
    shortKey: 'crp',
    level: 'Cluster Level',
    responsibilities: 'Conducts regular classroom observation routines, reviews reading records, and coaches teachers on foundational pedagogy.',
    outcomeStmt: 'CRPs observe the Grade 2-3 oral reading routine during cluster school visits and give each class teacher specific feedback.',
    indicatorA: 'Share of CRPs who observe Grade 2-3 oral reading routines and provide structured pedagogical feedback.',
    indicatorB: '% of visited classrooms demonstrating increased student reading engagement and routine fidelity.',
    activityDesc: 'Train CRPs on standardized fluency-band templates and classroom observation protocols.',
    activityMetric: 'Cluster observation visits held bi-weekly.',
    outputStmt: 'Cluster observation reports and teacher feedback debrief summaries.'
  },
  {
    canonicalName: 'Academic Resource Persons (ARPs)',
    shortKey: 'arp',
    level: 'Cluster/Block Level',
    responsibilities: 'Provides pedagogical coaching in FLN, conducts teacher circle meetings, and addresses classroom instruction gaps.',
    outcomeStmt: 'ARPs facilitate bi-weekly teacher study circles focusing on oral reading fluency diagnostic grouping.',
    indicatorA: 'Participation rate of Grade 2-3 teachers in ARP-led study circles exceeds 85%.',
    indicatorB: 'Demonstrated teacher adoption of differentiated reading practice groups.',
    activityDesc: 'Deliver ARP coaching modules on foundational reading diagnostics and micro-improvement projects.',
    activityMetric: 'Bi-weekly study circles convened per cluster.',
    outputStmt: 'Study circle session plans and teacher diagnostic grouping worksheets.'
  },
  {
    canonicalName: 'Block Education Officers (BEOs) & BRPs',
    shortKey: 'beo',
    level: 'Block Level',
    responsibilities: 'Monitors cluster-level training compliance and resolves school-level operational bottlenecks.',
    outcomeStmt: 'Block leadership reviews monthly reading progress summaries and reallocates instructional resources to lagging clusters.',
    indicatorA: '100% of block monthly review agendas include foundational literacy progress monitoring.',
    indicatorB: 'Resolution rate of cluster-level resource and staffing bottlenecks exceeds 90%.',
    activityDesc: 'Conduct monthly block-level review and monitoring sessions with CRPs and head teachers.',
    activityMetric: 'Monthly block review sessions conducted.',
    outputStmt: 'Block review minutes and resource reallocation orders issued.'
  },
  {
    canonicalName: 'District Institute of Education and Training (DIET)',
    shortKey: 'diet',
    level: 'District Level',
    responsibilities: 'Leads academic mentoring design, conducts district spot-checks, and reviews cluster pedagogical data monthly.',
    outcomeStmt: 'DIET faculty conduct monthly pedagogical reviews of cluster reading data and mentor CRPs on observation feedback routines.',
    indicatorA: '100% of DIET academic mentors complete monthly cluster data reviews and spot-check visits.',
    indicatorB: 'Identified remedial clusters show quarter-on-quarter improvement in student reading fluency.',
    activityDesc: 'Convene monthly cluster academic reviews and run district reading clinics for low-performing schools.',
    activityMetric: 'Monthly review forums conducted across all target districts.',
    outputStmt: 'District review registers and remedial action plans published.'
  },
  {
    canonicalName: 'District Education Officers (DEO) / DPO',
    shortKey: 'deo',
    level: 'District Level',
    responsibilities: 'Ensures administrative accountability, timetable protection, and resource allocations for high-need clusters.',
    outcomeStmt: 'District administration ensures timetable protection for literacy blocks and allocates administrative resources to high-need clusters.',
    indicatorA: '100% of district administrative reviews inspect school timetable compliance.',
    indicatorB: 'Zero unscheduled reassignments of Grade 2-3 literacy periods reported across target blocks.',
    activityDesc: 'Convene quarterly district coordination meetings and monitor administrative fidelity.',
    activityMetric: 'Quarterly district coordination meetings conducted.',
    outputStmt: 'District administrative directives and compliance audit reports issued.'
  },
  {
    canonicalName: 'State Council of Educational Research & Training (SCERT)',
    shortKey: 'scert',
    level: 'State Level',
    responsibilities: 'Validates foundational literacy curriculum, approves assessment tools, and issues state academic circulars.',
    outcomeStmt: 'SCERT establishes state foundational learning benchmarks and provides standardized pedagogical toolkits and formative rubrics.',
    indicatorA: '100% of target districts receive verified curriculum packages and assessment standards.',
    indicatorB: 'Standardized assessment criteria applied consistently across all district evaluations.',
    activityDesc: 'Formulate state foundational literacy guidelines, teacher lesson plans, and observation rubrics.',
    activityMetric: 'State curriculum directives and teacher guidance manuals published.',
    outputStmt: 'Notified state reading assessment guidelines and revised teacher manuals.'
  }
];

export function findStakeholderDef(term: string): StakeholderDefinition | null {
  const clean = term.toLowerCase().trim();
  for (const def of KNOWN_STAKEHOLDERS) {
    if (
      clean.includes(def.shortKey) || 
      clean.includes(`${def.shortKey}s`) || 
      def.canonicalName.toLowerCase().includes(clean)
    ) {
      return def;
    }
  }
  // Check common aliases with word boundaries
  if (/\b(student|students|child|children|learner|learners)\b/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'student') || null;
  }
  if (/\bdiet\b|\bdiets\b|district institute/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'diet') || null;
  }
  if (/\bcht\b|\bchts\b|cluster head/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'cht') || null;
  }
  if (/\bcrp\b|\bcrps\b|\bcrcc\b|cluster resource/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'crp') || null;
  }
  if (/\barp\b|\barps\b|\babrc\b|academic resource/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'arp') || null;
  }
  if (/\b(ht|hm|hts|hms|headmaster|school leader|head teacher)\b/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'head teacher') || null;
  }
  if (/\b(teacher|teachers|educator|educators)\b/i.test(clean) && !/head/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'teacher') || null;
  }
  if (/\b(beo|brp|brcc|block)\b/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'beo') || null;
  }
  if (/\b(parent|parents|smc|community)\b/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'parent') || null;
  }
  if (/\b(deo|dpo|district education officer)\b/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'deo') || null;
  }
  if (/\b(scert|dsert|state council)\b/i.test(clean)) {
    return KNOWN_STAKEHOLDERS.find(s => s.shortKey === 'scert') || null;
  }
  return null;
}

/**
 * Handles conversational updates and refinements to the LFA framework
 * with full compound clause support (e.g. "Add DIETs and remove CRPs").
 */
export function handleConversationalRefinement(
  userText: string,
  currentMatrix: LFAMatrix
): RefinementResult {
  const lower = userText.toLowerCase().trim();
  const matrix: LFAMatrix = JSON.parse(JSON.stringify(currentMatrix));

  if (!matrix.personas) matrix.personas = [];
  if (!matrix.outcomes) matrix.outcomes = [];
  if (!matrix.activities) matrix.activities = [];
  if (!matrix.outputs) matrix.outputs = [];
  if (!matrix.resources) matrix.resources = [];

  // =========================================================================
  // 0. QUICK ACCEPT / CONFIRMATION OF SUGGESTED WORKSTREAM
  // =========================================================================
  if (
    lower.startsWith('accept') || 
    lower.includes('accept suggested') || 
    lower.includes('accept suggestion') ||
    lower.includes('looks good') ||
    lower.includes('no, looks good') ||
    lower === 'no' ||
    lower === 'nothing else' ||
    lower === 'keep these' ||
    lower === 'keep suggested'
  ) {
    const recentActor = matrix.personas[matrix.personas.length - 1]?.role || 'Stakeholder';
    return {
      updatedMatrix: matrix,
      responseMessage: `✅ **Confirmed!** The workstream for **${recentActor}** is locked into your Logical Framework:\n\n` +
        `• **🎯 Outcome:** Tracked in Section 4 (Outcomes)\n` +
        `• **⚡ Activity:** Scheduled in Section 5 (Activities)\n` +
        `• **📦 Output:** Countable deliverable in Section 6 (Outputs)\n` +
        `• **📊 Tabular View:** Synchronized into Section 7 (Your LFA Table)\n\n` +
        `Everything is saved and ready!`,
      quickReplies: [
        'Add another stakeholder',
        'Review Your LFA Table',
        'Download framework (.xlsx)'
      ],
      changeSummary: {
        action: 'modify',
        section: 'general',
        item: `Confirmed workstream for ${recentActor}`
      }
    };
  }

  // =========================================================================
  // 1. COMPOUND OR MULTI-STAKEHOLDER INTENT DETECTION
  // e.g. "Add DIETs in stakeholder please and remove CRPs"
  // e.g. "Replace CRPs with DIETs"
  // e.g. "Remove CRP and add DIET"
  // =========================================================================
  const mentionsStakeholderContext = 
    lower.includes('stakeholder') || 
    lower.includes('actor') || 
    lower.includes('persona') ||
    KNOWN_STAKEHOLDERS.some(s => lower.includes(s.shortKey) || lower.includes(`${s.shortKey}s`));

  if (mentionsStakeholderContext) {
    const addsToPerform: StakeholderDefinition[] = [];
    const removesToPerform: StakeholderDefinition[] = [];

    // Check "replace X with Y" pattern
    const replaceMatch = lower.match(/replace\s+([a-z\s()/-]+?)\s+with\s+([a-z\s()/-]+)/i);
    if (replaceMatch) {
      const fromDef = findStakeholderDef(replaceMatch[1]);
      const toDef = findStakeholderDef(replaceMatch[2]);
      if (fromDef) removesToPerform.push(fromDef);
      if (toDef) addsToPerform.push(toDef);
    } else {
      // Split into clauses across conjunctions: and, also, as well as, but, while, ;, comma
      const clauses = lower.split(/\band\b|\balso\b|\bas well as\b|\bwhile\b|;|,/gi);

      for (const rawClause of clauses) {
        const clause = rawClause.trim();
        if (!clause) continue;

        const isClauseAdd = 
          clause.includes('add') || 
          clause.includes('include') || 
          clause.includes('incorporate') || 
          clause.includes('introduce') ||
          clause.includes('bring in');

        const isClauseRemove = 
          clause.includes('remove') || 
          clause.includes('delete') || 
          clause.includes('drop') || 
          clause.includes('exclude') ||
          clause.includes('take out');

        for (const def of KNOWN_STAKEHOLDERS) {
          const mentioned = clause.includes(def.shortKey) || clause.includes(`${def.shortKey}s`);
          if (mentioned) {
            if (isClauseRemove) {
              if (!removesToPerform.some(r => r.shortKey === def.shortKey)) {
                removesToPerform.push(def);
              }
            } else if (isClauseAdd) {
              if (!addsToPerform.some(a => a.shortKey === def.shortKey)) {
                addsToPerform.push(def);
              }
            } else {
              // If clause doesn't explicitly have verb, check overall text
              if (lower.includes('remove') && !lower.includes('add')) {
                if (!removesToPerform.some(r => r.shortKey === def.shortKey)) removesToPerform.push(def);
              } else {
                if (!addsToPerform.some(a => a.shortKey === def.shortKey)) addsToPerform.push(def);
              }
            }
          }
        }
      }
    }

    // Fallback if clauses didn't separate them cleanly
    if (addsToPerform.length === 0 && removesToPerform.length === 0) {
      const isRemoveGlobal = lower.includes('remove') || lower.includes('delete') || lower.includes('drop') || lower.includes('exclude');
      for (const def of KNOWN_STAKEHOLDERS) {
        if (lower.includes(def.shortKey) || lower.includes(`${def.shortKey}s`)) {
          if (isRemoveGlobal) removesToPerform.push(def);
          else addsToPerform.push(def);
        }
      }
    }

    // Check if user is asking to add a custom/unspecified stakeholder
    // e.g. "Add Parents to stakeholders", "Add SMC as a stakeholder", "Add Community Volunteers", "Add Panchayats"
    if (addsToPerform.length === 0 && (lower.includes('add') || lower.includes('include') || lower.includes('bring in'))) {
      const addMatch = userText.match(/(?:add|include|bring in)\s+([^,\n.]+?)\s+(?:as\s+(?:a\s+)?|to\s+(?:the\s+)?|in\s+(?:the\s+)?|into\s+(?:the\s+)?)(?:delivery\s+)?(?:stakeholders?|actors?|personas?)/i)
        || userText.match(/(?:add|include|bring in)\s+(?:a\s+)?(?:new\s+)?(?:delivery\s+)?(?:stakeholder|actor|persona)\s*(?::|called|named|-)?\s*([^,\n.]+)/i);

      if (addMatch && addMatch[1]) {
        const rawRole = addMatch[1].trim();
        const foundDef = findStakeholderDef(rawRole);
        if (foundDef) {
          addsToPerform.push(foundDef);
        } else {
          const canonicalName = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
          addsToPerform.push({
            canonicalName,
            shortKey: canonicalName.toLowerCase(),
            level: 'Ecosystem Partner',
            responsibilities: `Coordinates with schools, communities, and local education teams to support student learning and accountability.`,
            outcomeStmt: `${canonicalName} actively participate in monitoring and support routines to improve student learning outcomes.`,
            indicatorA: `≥80% of targeted ${canonicalName} actively participating in scheduled routines and progress reviews.`,
            indicatorB: `Verified engagement of ${canonicalName} documented in school and community records.`,
            activityDesc: `Organize orientation sessions and regular review meetings for ${canonicalName}.`,
            activityMetric: `Regular coordination and review meetings conducted with ${canonicalName}.`,
            outputStmt: `${canonicalName} orientation materials distributed and meeting records maintained.`
          });
        }
      }
    }

    // Execute additions and removals if detected!
    if (addsToPerform.length > 0 || removesToPerform.length > 0) {
      const responseParts: string[] = [];

      // 1. Process Removals
      for (const remDef of removesToPerform) {
        // Remove from personas
        matrix.personas = matrix.personas.filter(p => 
          !p.role.toLowerCase().includes(remDef.shortKey) &&
          !p.role.toLowerCase().includes(remDef.canonicalName.toLowerCase())
        );

        // Prune orphaned outcomes
        matrix.outcomes = matrix.outcomes.filter(o => 
          !o.statement.toLowerCase().includes(remDef.shortKey) &&
          !o.statement.toLowerCase().includes(remDef.canonicalName.toLowerCase())
        );

        // Prune orphaned activities
        matrix.activities = matrix.activities.filter(a => 
          !a.description.toLowerCase().includes(remDef.shortKey) &&
          !a.description.toLowerCase().includes(remDef.canonicalName.toLowerCase())
        );

        responseParts.push(
          `• **Removed Role:** ${remDef.canonicalName} (${remDef.level})\n` +
          `  - Pruned associated monitoring outcomes and activities to keep causal chain clean.`
        );
      }

      // 2. Process Additions
      for (const addDef of addsToPerform) {
        // Check if already in personas
        const exists = matrix.personas.some(p => 
          p.role.toLowerCase().includes(addDef.shortKey) || 
          p.role.toLowerCase().includes(addDef.canonicalName.toLowerCase())
        );

        if (!exists) {
          matrix.personas.push({
            role: addDef.canonicalName,
            responsibilities: addDef.responsibilities
          });
        }

        // Add aligned outcome
        const newOutcome: LFAOutcome = {
          id: `outcome-${addDef.shortKey}-${Date.now()}`,
          statement: addDef.outcomeStmt,
          indicator: addDef.indicatorA,
          meansOfVerification: 'District review registers & monitoring portal dashboards.'
        };
        matrix.outcomes.push(newOutcome);

        // Add aligned activity
        const newActivity: LFAActivity = {
          id: `act-${addDef.shortKey}-${Date.now()}`,
          description: addDef.activityDesc,
          metric: addDef.activityMetric
        };
        matrix.activities.push(newActivity);

        // Add aligned output
        const newOutput: LFAOutput = {
          id: `out-${addDef.shortKey}-${Date.now()}`,
          statement: addDef.outputStmt
        };
        matrix.outputs.push(newOutput);

        responseParts.push(
          `• **Added Role:** ${addDef.canonicalName} (${addDef.level})\n` +
          `  - **Core Responsibility:** ${addDef.responsibilities}`
        );
      }

      let summaryTitle = 'I have updated your Logical Framework based on your instruction';
      if (addsToPerform.length > 0 && removesToPerform.length > 0) {
        summaryTitle = `I have updated your framework by adding **${addsToPerform.map(a => a.canonicalName).join(', ')}** and removing **${removesToPerform.map(r => r.canonicalName).join(', ')}**`;
      } else if (addsToPerform.length > 0) {
        summaryTitle = `I have added **${addsToPerform.map(a => a.canonicalName).join(', ')}** to your delivery stakeholders`;
      } else {
        summaryTitle = `I have removed **${removesToPerform.map(r => r.canonicalName).join(', ')}** from your framework`;
      }

      // Active prompt to define or refine Outcomes, Activity, and Output for the added stakeholder
      let promptBlock = '';
      let quickReplies: string[] | undefined = undefined;

      if (addsToPerform.length > 0) {
        const primaryAdd = addsToPerform[0];
        const addedNames = addsToPerform.map(a => a.canonicalName).join(', ');

        promptBlock = `\n\n---\n\n` +
          `I have added default outcomes, activity, and output for **${addedNames}**:\n` +
          addsToPerform.map(addDef => (
            `• **🎯 Outcome (Shift in Practice):** *"${addDef.outcomeStmt}"*\n` +
            `  *(Indicator: "${addDef.indicatorA}")*\n` +
            `• **⚡ Key Activity:** *"${addDef.activityDesc}"*\n` +
            `  *(Benchmark: "${addDef.activityMetric}")*\n` +
            `• **📦 Tangible Output:** *"${addDef.outputStmt}"*`
          )).join('\n\n') +
          `\n\n### **Want to add anything else?**\n` +
          `You can customize these or add more outcomes, activities, or outputs for **${addedNames}**. What would you like to do?`;

        quickReplies = [
          'No, looks good!',
          `Add custom Outcome for ${primaryAdd.canonicalName}`,
          `Add custom Activity for ${primaryAdd.canonicalName}`,
          `Add custom Output for ${primaryAdd.canonicalName}`,
          'Add another stakeholder'
        ];
      }

      const responseMessage = `${summaryTitle}:\n\n` +
        responseParts.join('\n\n') +
        promptBlock +
        `\n\n✨ **Live Synchronization:** All changes have been updated in **Section 3 (Stakeholders)**, **Section 4 (Outcomes)**, **Section 5 (Activities)**, and in **Section 7 (Your LFA Table)** on the right preview panel.`;

      return {
        updatedMatrix: matrix,
        responseMessage,
        quickReplies,
        changeSummary: {
          action: addsToPerform.length > 0 && removesToPerform.length > 0 ? 'compound' : addsToPerform.length > 0 ? 'add' : 'remove',
          section: 'stakeholders',
          item: addsToPerform.concat(removesToPerform).map(d => d.canonicalName).join(', ')
        }
      };
    }
  }

  // =========================================================================
  // 2. INTELLIGENT OUTCOMES ROUTING
  // =========================================================================
  if (lower.includes('outcome') || lower.includes('indicator') || lower.includes('practice') || lower.includes('behavior')) {
    const isRemove = lower.includes('remove') || lower.includes('delete') || lower.includes('drop') || lower.includes('exclude');
    if (isRemove) {
      const removed = matrix.outcomes.pop();
      return {
        updatedMatrix: matrix,
        responseMessage: `I have removed the outcome: *"${removed?.statement || 'Last outcome'}"* from your framework.\n\n⚠️ **Notice:** Dependent activities have been retained but may need realignment.`,
        changeSummary: {
          action: 'remove',
          section: 'outcomes',
          item: removed?.statement || 'Outcome',
          missingDependencies: ['Check remaining outcomes to ensure comprehensive coverage.']
        }
      };
    }

    const cleanStmt = userText.replace(/add\s+(an?\s+)?outcome(\s*:\s*|\s+that\s+|\s+to\s+)?/i, '').trim();
    const newOutcome: LFAOutcome = {
      id: `outcome-${Date.now()}`,
      statement: cleanStmt.charAt(0).toUpperCase() + cleanStmt.slice(1),
      indicator: 'Demonstrated practice fidelity across ≥80% of observed classroom cohorts.',
      meansOfVerification: 'Cluster resource monitoring records & periodic spot-check audits.'
    };
    matrix.outcomes.push(newOutcome);

    return {
      updatedMatrix: matrix,
      responseMessage: `I have added your proposed outcome to **Section 5 (Outcomes)** and updated the LFA matrix:\n\n` +
        `• **Outcome Statement:** *"${newOutcome.statement}"*\n` +
        `• **Verifiable Indicator:** *"${newOutcome.indicator}"*\n` +
        `• **Means of Verification:** *"${newOutcome.meansOfVerification}"*\n\n` +
        `✨ *Added to your LFA chain on the right panel.*`,
      changeSummary: {
        action: 'add',
        section: 'outcomes',
        item: newOutcome.statement,
      }
    };
  }

  // =========================================================================
  // 3. INTELLIGENT ACTIVITIES ROUTING
  // =========================================================================
  if (lower.includes('activity') || lower.includes('activities') || lower.includes('training') || lower.includes('workshop')) {
    const isRemove = lower.includes('remove') || lower.includes('delete') || lower.includes('drop');
    if (isRemove) {
      const removed = matrix.activities.pop();
      return {
        updatedMatrix: matrix,
        responseMessage: `I have removed the activity: *"${removed?.description || 'Last activity'}"* from Section 6.`,
        changeSummary: {
          action: 'remove',
          section: 'activities',
          item: removed?.description || 'Activity',
        }
      };
    }

    const cleanAct = userText.replace(/add\s+(an?\s+)?activity(\s*:\s*|\s+that\s+|\s+to\s+)?/i, '').trim();
    const newActivity: LFAActivity = {
      id: `act-${Date.now()}`,
      description: cleanAct.charAt(0).toUpperCase() + cleanAct.slice(1),
      metric: 'Conducted across 100% of target clusters per agreed academic schedule.'
    };
    matrix.activities.push(newActivity);

    return {
      updatedMatrix: matrix,
      responseMessage: `I have added your activity to **Section 6 (Activities)**:\n\n` +
        `• **Activity:** *"${newActivity.description}"*\n` +
        `• **Performance Benchmark:** *"${newActivity.metric}"*\n\n` +
        `✨ *Synced to your Logical Framework matrix.*`,
      changeSummary: {
        action: 'add',
        section: 'activities',
        item: newActivity.description,
      }
    };
  }

  // =========================================================================
  // 4. INTELLIGENT OUTPUTS ROUTING
  // =========================================================================
  if (lower.includes('output') || lower.includes('toolkit') || lower.includes('handbook') || lower.includes('manual')) {
    const cleanOp = userText.replace(/add\s+(an?\s+)?output(\s*:\s*|\s+that\s+|\s+to\s+)?/i, '').trim();
    const newOutput: LFAOutput = {
      id: `out-${Date.now()}`,
      statement: cleanOp.charAt(0).toUpperCase() + cleanOp.slice(1),
    };
    matrix.outputs.push(newOutput);

    return {
      updatedMatrix: matrix,
      responseMessage: `I have added your output to **Section 7 (Outputs & Deliverables)**:\n\n` +
        `• **Output:** *"${newOutput.statement}"*\n\n` +
        `✨ *This countable deliverable is now linked to your workstream.*`,
      changeSummary: {
        action: 'add',
        section: 'outputs',
        item: newOutput.statement,
      }
    };
  }

  // =========================================================================
  // 5. GENERAL / FALLBACK
  // =========================================================================
  return {
    updatedMatrix: matrix,
    responseMessage: `I have reviewed your instruction: *"${userText}"*.\n\n` +
      `To ensure strict causal alignment, please specify which section you want to target (e.g., *"add DIET to stakeholders"*, *"add home reading practice to outcomes"*, or *"add monthly review workshops to activities"*).`,
    changeSummary: {
      action: 'explain',
      section: 'general',
      item: userText,
    }
  };
}
