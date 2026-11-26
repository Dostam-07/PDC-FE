// Inline Regeneration and Editing Types & Helpers

export interface BlockHistoryEntry {
  text: string;
  timestamp: number;
  source: 'initial' | 'edited' | 'regenerated';
  prompt?: string;
}

export interface BlockState {
  currentText: string;
  history: BlockHistoryEntry[];
  alternatives: string[];
  activeVariantIndex: number; // 0-based, e.g. 0 of 2
}

// Preset directional prompts
export const DIRECTIONAL_PROMPT_PRESETS = [
  "Make this more focused on primary grade phonics",
  "Make this a lighter-touch, scalable model",
  "Shift focus from administrative review to classroom pedagogy",
  "Make indicators more measurable with clear percentage targets",
  "Emphasize teacher agency and participatory coaching",
  "Add strict quarterly milestone cadences"
];

// Helper to generate 3 realistic contextual variations based on user prompt & original text
export function generateBlockVariants(
  blockType: 'outcome_statement' | 'outcome_indicator' | 'outcome_mov' | 'activity_description' | 'activity_metric' | 'output' | 'challenge' | 'impact',
  currentText: string,
  prompt?: string
): [string, string, string] {
  const p = (prompt || '').toLowerCase();

  if (blockType.startsWith('outcome_statement') || blockType === 'impact') {
    if (p.includes('phonics') || p.includes('primary grade')) {
      return [
        `Grade 2-3 students master foundational phonemic decoding and oral blending through structured daily 30-minute decodable storybook sessions.`,
        `Target primary classrooms achieve 70% threshold in early grade reading letter-sound correspondence and sight-word fluency.`,
        `Students transition from syllable recognition to fluent expressive paragraph reading using vernacular phonics primers.`
      ];
    }
    if (p.includes('light-touch') || p.includes('scalable')) {
      return [
        `Cluster-level peer learning cohorts adopt low-cost print diagnostic flashcards to track pupil reading progress bi-weekly without external staff.`,
        `Existing school headmasters institutionalize a 15-minute weekly reading check using WhatsApp-distributed bite-sized assessment rubrics.`,
        `Community volunteer reading circles reinforce grade-level paragraph comprehension at zero incremental state fiscal overhead.`
      ];
    }
    if (p.includes('pedagogy') || p.includes('classroom')) {
      return [
        `Teachers transition from lecture-heavy textbook delivery to responsive guided-reading circles and active student comprehension checks.`,
        `Classrooms exhibit high student engagement with teacher-facilitated phonics drills replacing passive rote choral repetition.`,
        `Educators utilize weekly formative reading error logs to dynamically regroup children based on phonological mastery.`
      ];
    }
    return [
      `Accelerate foundational literacy proficiency through structured pedagogical routines across targeted primary school classrooms.`,
      `Establish high-fidelity instructional time and participatory oral reading routines, improving pupil reading benchmarks by 25%.`,
      `Empower school clusters with rapid formative reading diagnostics, ensuring 80% of Grade 3 learners achieve baseline reading fluency.`
    ];
  }

  if (blockType.startsWith('outcome_indicator')) {
    if (p.includes('phonics') || p.includes('primary grade')) {
      return [
        `% of Grade 2-3 students reading 45+ Words Per Minute (WPM) with 80% reading comprehension on standardized ASER/FLN test kits.`,
        `Average increase of 18 correct letter-sounds recognized per minute among struggling readers on monthly spot audits.`,
        `Proportion of primary classrooms completing daily 30-minute structured phonics routines exceeds 85% by Term 2.`
      ];
    }
    if (p.includes('light-touch') || p.includes('scalable')) {
      return [
        `% of schools submitting verified monthly peer-monitored reading scores via automated interactive voice response/mobile forms (>75%).`,
        `Adoption rate of free state open-source decodable readers across 90% of participating schools within 6 months.`,
        `Cost-per-student benchmark maintained below $1.80/year while sustaining 65% student grade-level oral reading fluency.`
      ];
    }
    return [
      `65% of Grade 3 students achieve grade-level foundational reading fluency benchmark on endline third-party assessment.`,
      `80% of targeted teachers score 3.5+ on the five-point classroom instructional practice & phonics fidelity rubric.`,
      `Classroom observation fidelity rating improves from 42% at baseline to 85% by end-of-year cluster walkthroughs.`
    ];
  }

  if (blockType.startsWith('activity')) {
    if (p.includes('phonics') || p.includes('primary grade')) {
      return [
        `Conduct hands-on weekend phonemic awareness and decodable primer micro-workshops for 1,200 primary grade language teachers.`,
        `Distribute leveled classroom reading corners equipped with graded phonetic storybooks and student tracking charts across targeted primary schools.`,
        `Facilitate weekly 45-minute teacher peer study circles focused exclusively on diagnosing vowel-consonant blending barriers.`
      ];
    }
    if (p.includes('pedagogy') || p.includes('coaching')) {
      return [
        `Cluster Resource Coordinators conduct bi-weekly non-punitive, rubric-guided classroom observation and 1-on-1 pedagogical feedback sessions.`,
        `Implement 30-minute co-teaching walkthroughs where mentors model responsive guided reading pedagogy in live Grade 2 classrooms.`,
        `Host monthly block-level reflective pedagogy review sessions analyzing live classroom video recordings and student work samples.`
      ];
    }
    if (p.includes('light-touch') || p.includes('scalable')) {
      return [
        `Deploy asynchronous 3-minute WhatsApp audio coaching clips and illustrated pedagogical prompt cards directly to teacher handsets.`,
        `Establish school-level teacher pairs who exchange weekly 15-minute peer observations using a simple 4-check rubric.`,
        `Host monthly tele-mentoring radio/webcast clinics addressing common foundational reading misconceptions with zero travel expenses.`
      ];
    }
    return [
      `Implement bi-weekly pedagogical walkthroughs and actionable teacher coaching cadences across all target cluster primary schools.`,
      `Design and roll out 3-tiered formative diagnostic assessments with monthly student progress data aggregation meetings.`,
      `Deliver intensive practical micro-workshops on structured literacy instruction and evidence-based remediation strategies.`
    ];
  }

  // Generic fallback
  return [
    `${currentText} (Enhanced with evidence-based pedagogical benchmarks)`,
    `Streamlined variant: ${currentText} optimized for rapid statewide cluster scaling`,
    `Remediated alternative: targeted foundational instruction with weekly milestone tracking`
  ];
}
