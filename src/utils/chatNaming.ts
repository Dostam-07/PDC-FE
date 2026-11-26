/**
 * Intelligent Programme Design Chat Naming Engine
 * 
 * Synthesizes concise, high-impact, professional programme design titles
 * (e.g. "Punjab FLN Literacy Acceleration", "Rajasthan Grade 2-3 Reading Fluency Mission")
 * grounded in the actual challenge, cohort, and geography being designed.
 */

export function toTitleCase(str: string): string {
  if (!str) return '';
  const lowerWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from',
    'by', 'with', 'in', 'of', 'into', 'near', 'over'
  ]);

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      // Always capitalize first word or significant words
      if (index === 0 || !lowerWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ')
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

/**
 * Cleans truncated titles with ellipses (e.g. "... and…") and completes
 * them cleanly, avoiding trailing ellipses, incomplete words, or dangling connectives.
 */
export function cleanTruncatedTitle(rawTitle: string, fullContextText?: string): string {
  if (!rawTitle) return '';
  let clean = rawTitle.replace(/^[\p{Emoji}\s\u200B-\u200D\uFE0F]+/u, '').trim();

  // If title was truncated with "..." or "…"
  const hasEllipsis = /[\u2026\.]+|\.\.\./.test(clean);
  if (hasEllipsis) {
    clean = clean.replace(/[\u2026\.]+|\.\.\./g, '').trim();
    // Remove dangling connectives left at end
    clean = clean.replace(/\s+(and|or|with|to|for|of|in|across|the|a|an|from|by)$/i, '').trim();

    // If we have full context text and the clean part appears in it, complete the clause properly!
    if (fullContextText) {
      const matchIndex = fullContextText.indexOf(clean);
      if (matchIndex >= 0) {
        const remaining = fullContextText.slice(matchIndex + clean.length);
        // Look for next natural boundary (e.g. "and reading comprehension.")
        const clauseMatch = remaining.match(/^(\s+(?:and|with)\s+[^.,\n]{3,35})/i);
        if (clauseMatch && clauseMatch[1]) {
          clean = `${clean}${clauseMatch[1]}`.trim();
        }
      }
    }
  }

  return clean;
}

/**
 * Generates an interesting, specific, and memorable program title
 * derived from the challenge, region, and target beneficiaries.
 */
export function generateSmartChatName(rawInput: string, fallbackState?: string): string {
  if (!rawInput || !rawInput.trim()) {
    return fallbackState ? `${fallbackState} Program Design` : 'New Document';
  }

  // Clean surrounding quotes and collapse whitespace
  let input = rawInput
    .replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Explicit Rename Intent (e.g. "rename this chat to X", "name this chat X", "call this X")
  const explicitMatch = input.match(
    /(?:rename\s+(?:this\s+)?(?:chat|design|session|title)?\s*(?:to|as)?|name\s+(?:this\s+)?(?:chat|design|session)\s*(?:to|as)?|call\s+(?:this\s+)?(?:chat|design|session)\s*|make\s+(?:a\s+)?chatname\s+(?:for|from)?\s*:?\s*|set\s+title\s+to)\s+["'“]?([^"'”\n\r.]+)/i
  );
  if (explicitMatch && explicitMatch[1] && explicitMatch[1].trim().length >= 3) {
    const candidate = explicitMatch[1].trim();
    if (!/^(the\s+input|input\s+i\s+give|me\s+a\s+chatname)/i.test(candidate)) {
      return toTitleCase(candidate.slice(0, 50)).trim();
    }
  }

  // 2. Known Geographic / Regional Entities in Education Interventions
  const regions = [
    'Punjab', 'Haryana', 'Rajasthan', 'Odisha', 'Orissa', 'Bihar', 'Jharkhand',
    'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu',
    'Kerala', 'Gujarat', 'West Bengal', 'Assam', 'Himachal Pradesh', 'Uttarakhand',
    'Andhra Pradesh', 'Telangana', 'Chhattisgarh', 'Delhi', 'Jammu & Kashmir',
    'Tribal Block', 'Rural', 'Urban', 'District', 'State-Wide'
  ];
  let detectedRegion = fallbackState || '';
  for (const reg of regions) {
    const regRegex = new RegExp(`\\b${reg}\\b`, 'i');
    if (regRegex.test(input)) {
      detectedRegion = reg === 'Orissa' ? 'Odisha' : reg;
      break;
    }
  }

  // 3. Known Education Stages & Student Cohorts
  const cohorts = [
    { pattern: /\b(grade\s*2\s*[-–—to]+\s*3|grades?\s*2\s*[-–—to]\s*3)\b/i, name: 'Grade 2-3' },
    { pattern: /\b(grade\s*1\s*[-–—to]+\s*3|grades?\s*1\s*[-–—to]\s*3)\b/i, name: 'Grade 1-3' },
    { pattern: /\b(grade\s*3|3rd\s*grade)\b/i, name: 'Grade 3' },
    { pattern: /\b(grade\s*4|4th\s*grade)\b/i, name: 'Grade 4' },
    { pattern: /\b(grade\s*5|5th\s*grade)\b/i, name: 'Grade 5' },
    { pattern: /\b(grade\s*6\s*[-–—to]+\s*8|middle\s*school)\b/i, name: 'Middle School' },
    { pattern: /\b(secondary\s*school|high\s*school|headmasters?|grades?\s*9\s*[-–—to]\s*10)\b/i, name: 'Secondary' },
    { pattern: /\b(primary\s*schools?|primary\s*class(?:es)?|primary\s*teachers?)\b/i, name: 'Primary' },
    { pattern: /\b(early\s*childhood|ece|anganwadi|balvatika|pre-?primary)\b/i, name: 'Early Childhood' },
    { pattern: /\bfln\b/i, name: 'FLN' }
  ];
  let detectedCohort = '';
  for (const c of cohorts) {
    if (c.pattern.test(input)) {
      detectedCohort = c.name;
      break;
    }
  }

  // 4. Known Core Focus Areas / Domains
  const domains = [
    { pattern: /\b(reading\s*fluency|oral\s*reading|orf|reading\s*comprehension|reading\s*levels?|comprehension)\b/i, name: 'Reading Fluency & Comprehension' },
    { pattern: /\b(foundational\s*literacy|early\s*reading|literacy\s*acceleration)\b/i, name: 'Literacy Acceleration' },
    { pattern: /\b(foundational\s*numeracy|math|mathematics|arithmetic|numeracy)\b/i, name: 'Foundational Numeracy' },
    { pattern: /\b(cluster\s*mentorship|continuous\s*coaching|teacher\s*coaching|coaching\s*circles?)\b/i, name: 'Teacher Coaching Circles' },
    { pattern: /\b(teacher\s*mentorship|teacher\s*training|pedagogical\s*coaching|pedagogy|tpd)\b/i, name: 'Pedagogical Mentorship' },
    { pattern: /\b(instructional\s*leadership|headmaster\s*leadership|school\s*leadership|leadership\s*roadmap)\b/i, name: 'Instructional Leadership' },
    { pattern: /\b(community\s*reading|reading\s*circle|parent\s*engagement|parental\s*involvement)\b/i, name: 'Community Reading Circles' },
    { pattern: /\b(diagnostic\s*assessment|m&e|monitoring\s*and\s*evaluation|rapid\s*learning|scorecards?)\b/i, name: 'Diagnostic Assessment & M&E' },
    { pattern: /\b(learning\s*loss|remedial|remediation|learning\s*recovery)\b/i, name: 'Remedial Learning Acceleration' },
    { pattern: /\b(digital\s*learning|micro[- ]modules?|edtech|online\s*training)\b/i, name: 'Digital Learning Innovation' },
    { pattern: /\b(stem|science\s*and\s*math|science\s*labs?)\b/i, name: 'STEM Innovation' }
  ];
  let detectedDomain = '';
  for (const d of domains) {
    if (d.pattern.test(input)) {
      detectedDomain = d.name;
      break;
    }
  }

  // Synthesize engaging program names
  if (detectedDomain) {
    const parts = [detectedRegion, detectedCohort, detectedDomain].filter(Boolean);
    const synthesized = parts.join(' ');
    if (synthesized.length >= 6) {
      return synthesized;
    }
  }

  // Clean conversational filler
  let cleaned = input
    .replace(/^(?:we\s+want\s+to\s+improve|we\s+need\s+to\s+improve|we\s+want\s+to|we\s+need\s+to|i\s+want\s+to\s+design\s+a\s+programme\s+to|i\s+want\s+to\s+design\s+a\s+programme|i\s+want\s+to\s+design|i\s+want\s+to|how\s+can\s+we|how\s+to|can\s+we|can\s+you|please\s+(?:help\s+me\s+)?(?:design|create|build)?|help\s+(?:me|us)\s+(?:design|build|create)?|looking\s+to\s+(?:design|build|create)?|design\s+a|build\s+a|create\s+a|develop\s+a|suggest\s+a|what\s+is\s+the|what\s+are\s+the|tell\s+me\s+about)\s+/i, '')
    .replace(/\s+(?:within|over|across)\s+\d+\s+(?:months?|years?|districts?|schools?)\b.*/i, '')
    .replace(/[?.!,:;]+$/, '')
    .trim();

  const stopWords = new Set([
    'a', 'an', 'the', 'of', 'and', 'for', 'in', 'on', 'with', 'to', 'at', 'by',
    'from', 'our', 'their', 'targeted', 'some', 'any', 'that', 'this', 'we', 'i', 'you'
  ]);
  const tokens = cleaned.split(/\s+/).filter(t => !stopWords.has(t.toLowerCase()));

  if (tokens.length >= 2) {
    const shortPhrase = tokens.slice(0, 5).join(' ');
    const result = toTitleCase(shortPhrase);
    if (result.length >= 5 && result.length <= 50) {
      return detectedRegion && !result.toLowerCase().includes(detectedRegion.toLowerCase())
        ? `${detectedRegion} ${result}`
        : result;
    }
  }

  return detectedRegion ? `${detectedRegion} Program Design` : 'New Document';
}
