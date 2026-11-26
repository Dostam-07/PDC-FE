export interface GroundedFacet {
  title: string;
  refinedStatement: string;
  category: 'FLN' | 'Retention & Dropouts' | 'Leadership & Coaching' | 'Pedagogy' | 'Infrastructure';
  suggestedTags: string[];
}

export interface ContextProbeResult {
  isVague: boolean;
  missingState: boolean;
  detectedState: string | null;
  detectedTopic: string;
  facets: GroundedFacet[];
  guidedPromptChips: {
    label: string;
    options: string[];
  }[];
}

export const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
];

export const REGIONAL_SCOPES = [
  'National', 'Pan-India', 'All-India', 'Multi-State', 'Central'
];

export function detectStateInText(text: string): string | null {
  if (!text || !text.trim()) return null;
  const clean = text.trim();

  // 1. Full State Names
  for (const state of INDIAN_STATES_AND_UTS) {
    const escaped = state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(clean)) {
      return state;
    }
  }

  // 2. Alternate spellings & historical names
  if (/\bOrissa\b/i.test(clean)) return 'Odisha';
  if (/\bUttaranchal\b/i.test(clean)) return 'Uttarakhand';
  if (/\bPondicherry\b/i.test(clean)) return 'Puducherry';
  if (/\b(J&K|Jammu\s*(?:&|and)\s*Kashmir)\b/i.test(clean)) return 'Jammu & Kashmir';

  // 3. Strict uppercase abbreviations
  if (/\bUP\b/.test(clean) || /\bU\.P\.\b/i.test(clean)) return 'Uttar Pradesh';
  if (/\bMP\b/.test(clean) || /\bM\.P\.\b/i.test(clean)) return 'Madhya Pradesh';
  if (/\bAP\b/.test(clean) || /\bA\.P\.\b/i.test(clean)) return 'Andhra Pradesh';
  if (/\bTN\b/.test(clean) || /\bT\.N\.\b/i.test(clean)) return 'Tamil Nadu';
  if (/\bHP\b/.test(clean) || /\bH\.P\.\b/i.test(clean)) return 'Himachal Pradesh';
  if (/\bWB\b/.test(clean) || /\bW\.B\.\b/i.test(clean)) return 'West Bengal';

  // 4. Regional / National scopes
  for (const scope of REGIONAL_SCOPES) {
    const escaped = scope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(clean)) {
      return scope;
    }
  }

  return null;
}

export function hasGeographicState(text: string): boolean {
  return detectStateInText(text) !== null;
}

export function isChallengeIntent(text: string, context?: any): boolean {
  if (!text || !text.trim()) return false;
  const lower = text.toLowerCase().trim();
  
  if (lower.startsWith('/') || lower === 'start a new session' || lower.includes('restore version')) {
    return false;
  }

  // If conversation is in awaiting_challenge or no challenge has been set yet
  if (context?.backendState === 'awaiting_challenge' || !context?.challenge || context?.challenge.length < 5) {
    if (['hi', 'hello', 'hey', 'start', 'begin', 'help'].includes(lower)) {
      return false;
    }
    // Need at least a few words to be a meaningful challenge statement
    return text.split(/\s+/).filter(Boolean).length >= 3;
  }

  // Keywords indicating challenge / educational goal definition
  const challengeKeywords = [
    'challenge', 'we want to', 'our goal', 'programme to', 'program to',
    'intervention to', 'improve', 'reading fluency', 'fln', 'literacy',
    'numeracy', 'dropouts', 'absenteeism', 'attendance', 'learning loss',
    'pedagogy', 'teacher training', 'mentoring', 'headmasters', 'foundational',
    'comprehension', 'primary schools'
  ];

  return challengeKeywords.some(kw => lower.includes(kw));
}

/**
 * Claude-style context probing:
 * Only returns a result if the user is typing an education challenge AND has NOT specified a state.
 * Never displays if the state is already given or if input is empty/generic.
 */
export function probeContextualFacets(input: string): ContextProbeResult | null {
  const text = input.trim();
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Don't show if empty or very short greeting
  if (wordCount < 3) {
    return null;
  }

  const detectedState = detectStateInText(text);

  // If user already specified a State, do NOT show any pop-up!
  if (detectedState) {
    return null;
  }

  // Only trigger if typing an education problem/challenge
  const isChallenge = isChallengeIntent(text);
  const isProblemRelated = 
    lower.includes('read') || lower.includes('literacy') || lower.includes('fln') ||
    lower.includes('dropout') || lower.includes('attendance') || lower.includes('teacher') ||
    lower.includes('math') || lower.includes('numeracy') || lower.includes('student') ||
    lower.includes('school') || lower.includes('grade') || lower.includes('improve') ||
    lower.includes('programme') || lower.includes('program') || lower.includes('challenge');

  if (!isChallenge && !isProblemRelated) {
    return null;
  }

  return {
    isVague: true,
    missingState: true,
    detectedState: null,
    detectedTopic: "Select Target State",
    facets: [],
    guidedPromptChips: [
      {
        label: "Target State",
        options: ["Punjab", "Rajasthan", "Bihar", "Uttar Pradesh", "Maharashtra", "Karnataka", "Delhi"]
      }
    ]
  };
}

export function isImpactIntent(text: string): boolean {
  if (!text || !text.trim()) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('achieve') ||
    lower.includes('reduction') ||
    lower.includes('reduce') ||
    lower.includes('increase') ||
    lower.includes('wpm') ||
    lower.includes('words per minute') ||
    lower.includes('fluency') ||
    lower.includes('comprehension') ||
    lower.includes('non-reader') ||
    lower.includes('non reader') ||
    lower.includes('target') ||
    lower.includes('months') ||
    lower.includes('%') ||
    lower.includes('percent') ||
    lower.includes('benchmark') ||
    lower.includes('milestone') ||
    lower.includes('students achieve') ||
    lower.includes('proportion of') ||
    lower.includes('by at least') ||
    lower.includes('oral reading') ||
    lower.includes('reading level')
  );
}
