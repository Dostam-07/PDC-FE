/**
 * Generates between 3 and 12 tailored, measurable Impact Indicator statements
 * grounded in the challenge statement, user's intended impacts, and target state.
 */
export function generateImpactIndicatorOptions(
  impactStatements: string[],
  stateName: string = 'the target state',
  challengeStatement: string = ''
): string[] {
  const combined = `${challengeStatement} ${impactStatements.join(' ')}`.toLowerCase();
  const stateLabel = stateName && stateName !== 'your state' ? stateName : 'target districts';

  const isLiteracy = /read|literacy|fln|fluency|wpm|comprehension|phonics|decoding|language|hindi|english|grade [1-8]/i.test(combined);
  const isNumeracy = /math|numeracy|arithmetic|calculation|number|fractions|stem|science/i.test(combined);
  const isRetention = /retention|dropout|attendance|migration|enroll|transition|absent|schooling/i.test(combined);
  const isLeadership = /leader|headmaster|hm|ht|principal|coaching|teacher|mentor|supervis|observation|diet|crp|arp/i.test(combined);

  const options: string[] = [];

  if (isLiteracy) {
    options.push(
      `Percentage of target students in ${stateLabel} reading grade-level connected text at ≥45 words per minute with ≥75% comprehension accuracy`,
      `Reduction in the share of non-readers (0–10 WPM) across targeted government schools in ${stateLabel} by at least 40% over 12 months`,
      `Percentage point increase in students achieving foundational decoding and phonemic awareness benchmarks in endline assessments`,
      `Proportion of cohort schools in ${stateLabel} where ≥80% of target-grade students meet state oral reading fluency standards`
    );
  }

  if (isNumeracy) {
    options.push(
      `Percentage of target-grade students in ${stateLabel} accurately solving grade-level foundational numeracy and word problems (≥75% score)`,
      `Reduction in students performing below basic number recognition and place-value benchmarks by at least 35% year-over-year`
    );
  }

  if (isRetention) {
    options.push(
      `Increase in average daily student attendance across targeted schools in ${stateLabel} to ≥85% across the academic year`,
      `Reduction in annual dropout and seasonal migration-linked transition loss in target grades by ≥50%`,
      `Percentage of out-of-school or irregular-attending children successfully re-enrolled and retained through bridge learning cycles`
    );
  }

  if (isLeadership) {
    options.push(
      `Percentage of schools in ${stateLabel} demonstrating sustained instructional leadership routines and protected learning blocks`,
      `Share of teachers showing measurable improvement in structured pedagogical practice on standardized classroom observation rubrics`
    );
  }

  // Add challenge/impact-specific statements
  const primaryExcerpt = impactStatements[0]?.trim().replace(/[.]+$/, '') || 'intended student learning outcomes';
  const generalPool = [
    `Percentage of target students in ${stateLabel} achieving benchmark mastery on standardized endline evaluations aligned to "${primaryExcerpt}"`,
    `Year-on-year percentile gain in composite student learning outcomes across cohort schools compared to non-intervention baseline`,
    `Narrowing of learning-outcome equity gaps between bottom-quartile and top-quartile student groups in ${stateLabel} by ≥25%`,
    `Proportion of students transitioning to the next grade level with verified readiness in core foundational competencies`,
    `Share of cohort clusters sustaining improved student proficiency scores 6 months post-intensive intervention`,
    `Net improvement in state/district NAS or SLAS cohort proficiency levels across targeted blocks in ${stateLabel}`,
    `Percentage of target schools achieving minimum composite quality and student-outcome thresholds on annual academic audits`,
    `Reduction in intra-district variance in average student achievement scores across urban, rural, and tribal clusters in ${stateLabel}`
  ];

  // Determine dynamic target count in the [3, 12] range based on challenge & impact richness
  const domainMatches = [isLiteracy, isNumeracy, isRetention, isLeadership].filter(Boolean).length;
  const desiredCount = Math.min(12, Math.max(3, 4 + domainMatches * 2 + Math.min(3, impactStatements.length)));

  for (const item of generalPool) {
    if (options.length >= desiredCount) break;
    if (!options.includes(item)) {
      options.push(item);
    }
  }

  // Guarantee strict 3..12 bounds
  return options.slice(0, 12);
}
