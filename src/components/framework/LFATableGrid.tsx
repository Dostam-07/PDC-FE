import React, { useState, useMemo } from 'react';
import { LFAMatrix, LFAOutcome, LFAActivity } from '../../types/lfa';
import { 
  Copy, Check, Table2, Target, CheckCircle2, 
  Users, Sparkles, BookOpen, Layers
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface LFATableGridProps {
  matrix: LFAMatrix;
  onEdit?: () => void;
  highlightedRowId?: string;
}

interface CausalRowItem {
  id: string;
  originalIndex: number;
  actor: string;
  outcome: LFAOutcome;
  indicator: string;
  activity: string;
  input: string;
}

export const LFATableGrid: React.FC<LFATableGridProps> = ({ matrix, highlightedRowId }) => {
  const { setHighlightedRowId } = useChat();
  const [copied, setCopied] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>('all');

  // Auto-scroll to highlighted row when triggered
  React.useEffect(() => {
    if (highlightedRowId && highlightedRowId !== 'all-updated') {
      const el = document.getElementById(`row-${highlightedRowId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [highlightedRowId]);

  const outcomes = matrix.outcomes || [];
  const activities = matrix.activities || [];
  const personas = matrix.personas || [];
  const resources = matrix.resources || [];

  // Canonical list of stakeholders
  const stakeholdersList = useMemo(() => {
    if (personas.length > 0) {
      return personas.map(p => p.role);
    }
    return ['Students', 'Teachers', 'School Leaders (HTs/HMs)', 'Cluster Resource Persons (CRPs)', 'Academic Resource Persons (ARPs)'];
  }, [personas]);

  const getStakeholderBadgeColor = (role: string, idx: number) => {
    const roleLower = (role || '').toLowerCase();
    if (roleLower.includes('student') || roleLower.includes('child')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (roleLower.includes('teacher') || roleLower.includes('educator')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (roleLower.includes('leader') || roleLower.includes('head') || roleLower.includes('ht') || roleLower.includes('hm') || roleLower.includes('principal')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (roleLower.includes('cluster') || roleLower.includes('crp') || roleLower.includes('crc')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (roleLower.includes('academic') || roleLower.includes('arp') || roleLower.includes('diet') || roleLower.includes('brc')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (roleLower.includes('block') || roleLower.includes('beo')) {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    if (roleLower.includes('district') || roleLower.includes('deo') || roleLower.includes('dpo')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
    if (roleLower.includes('parent') || roleLower.includes('smc') || roleLower.includes('community') || roleLower.includes('volunteer')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    const colors = [
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-sky-50 text-sky-700 border-sky-200',
      'bg-pink-50 text-pink-700 border-pink-200',
      'bg-lime-50 text-lime-700 border-lime-200',
    ];
    return colors[idx % colors.length];
  };

  // Helper to find the best-matching actor for any text (outcome statement, activity description, etc.)
  const getActorForText = (text: string, fallbackIdx: number): string => {
    const lower = (text || '').toLowerCase().trim();
    if (!lower) {
      if (stakeholdersList.length > 0) {
        return stakeholdersList[fallbackIdx % stakeholdersList.length];
      }
      return 'Target Delivery Actor';
    }

    // 1. Direct match with any stakeholder role name or acronym in stakeholdersList
    for (const pRole of stakeholdersList) {
      const pLower = pRole.toLowerCase().trim();
      const cleanRole = pLower.replace(/\s*\([^)]*\)/g, '').trim();
      const parenMatch = pRole.match(/\(([^)]+)\)/);
      const acronym = parenMatch ? parenMatch[1].toLowerCase().trim() : '';

      if (lower.includes(pLower) || (cleanRole.length > 2 && lower.includes(cleanRole))) {
        return pRole;
      }
      if (acronym && acronym.length >= 2 && (lower.includes(` ${acronym} `) || lower.includes(`(${acronym})`) || lower.startsWith(`${acronym} `) || lower.endsWith(` ${acronym}`))) {
        return pRole;
      }
      const words = cleanRole.split(/[\s/&-]+/).filter(w => w.length > 3 && !['school', 'level', 'primary', 'target', 'delivery', 'systemic', 'routine'].includes(w));
      if (words.length > 0 && words.some(w => lower.includes(w))) {
        return pRole;
      }
    }

    // 2. Specialized educational cadre domain mapping
    for (const pRole of stakeholdersList) {
      const pLower = pRole.toLowerCase();
      if (pLower.includes('cluster') || pLower.includes('crp') || pLower.includes('crc')) {
        if (lower.includes('cluster') || lower.includes('crp') || lower.includes('crc') || lower.includes('mentor') || lower.includes('bi-weekly coaching') || lower.includes('coaching visit')) return pRole;
      }
      if (pLower.includes('academic') || pLower.includes('arp') || pLower.includes('diet') || pLower.includes('brc')) {
        if (lower.includes('arp') || lower.includes('academic resource') || lower.includes('diet') || lower.includes('brc') || lower.includes('block resource')) return pRole;
      }
      if (pLower.includes('block') || pLower.includes('beo')) {
        if (lower.includes('block education') || lower.includes('beo') || lower.includes('block level')) return pRole;
      }
      if (pLower.includes('district') || pLower.includes('deo') || pLower.includes('dpo')) {
        if (lower.includes('district') || lower.includes('deo') || lower.includes('dpo')) return pRole;
      }
      if (pLower.includes('leader') || pLower.includes('head') || pLower.includes('ht') || pLower.includes('hm') || pLower.includes('principal')) {
        if (lower.includes('school leader') || lower.includes('head teacher') || lower.includes('headmaster') || lower.includes('ht') || lower.includes('hm') || lower.includes('principal') || lower.includes('walk-through')) return pRole;
      }
      if (pLower.includes('parent') || pLower.includes('smc') || pLower.includes('community') || pLower.includes('volunteer')) {
        if (lower.includes('parent') || lower.includes('smc') || lower.includes('community') || lower.includes('volunteer') || lower.includes('home reading') || lower.includes('reading circle')) return pRole;
      }
      if (pLower.includes('teacher') || pLower.includes('educator')) {
        if (lower.includes('teacher') || lower.includes('educator') || lower.includes('classroom instruction') || lower.includes('pedagogical routine') || lower.includes('lesson plan')) return pRole;
      }
      if (pLower.includes('student') || pLower.includes('learner') || pLower.includes('child')) {
        if (lower.includes('student') || lower.includes('learner') || lower.includes('child') || lower.includes('reading fluency') || lower.includes('oral reading') || lower.includes('benchmark wpm')) return pRole;
      }
    }

    // 3. Fallback distributing evenly across stakeholders
    if (stakeholdersList.length > 0) {
      const itemsPerActor = Math.max(1, Math.ceil(outcomes.length / stakeholdersList.length));
      const blockActorIdx = Math.min(stakeholdersList.length - 1, Math.floor(fallbackIdx / itemsPerActor));
      return stakeholdersList[blockActorIdx];
    }
    return 'Target Delivery Actor';
  };

  // Club outcomes & activities by Actor so EVERY stakeholder, outcome, and activity is guaranteed to be reflected
  const clubbedByActor = useMemo(() => {
    // 1. Group outcomes by actor
    const actorOutcomesMap: Record<string, LFAOutcome[]> = {};
    const actorActivitiesMap: Record<string, LFAActivity[]> = {};

    stakeholdersList.forEach(role => {
      actorOutcomesMap[role] = [];
      actorActivitiesMap[role] = [];
    });

    outcomes.forEach((out, idx) => {
      const actor = getActorForText(out.statement, idx);
      if (!actorOutcomesMap[actor]) {
        actorOutcomesMap[actor] = [];
      }
      actorOutcomesMap[actor].push(out);
    });

    // 2. Group activities by actor
    activities.forEach((act, idx) => {
      const actor = getActorForText(act.description, idx);
      if (!actorActivitiesMap[actor]) {
        actorActivitiesMap[actor] = [];
      }
      actorActivitiesMap[actor].push(act);
    });

    // 3. Build CausalRowItems for each stakeholder in stakeholdersList (NEVER filter out an active stakeholder!)
    const result: Array<{ actor: string; items: CausalRowItem[] }> = [];

    stakeholdersList.forEach((role, actorIdx) => {
      const actorOutcomes = actorOutcomesMap[role] || [];
      const actorActivities = actorActivitiesMap[role] || [];
      const personaObj = personas.find(p => p.role.toLowerCase().trim() === role.toLowerCase().trim());

      const rowCount = Math.max(actorOutcomes.length, actorActivities.length, 1);
      const items: CausalRowItem[] = [];

      for (let i = 0; i < rowCount; i++) {
        // Outcome
        const out = actorOutcomes[i] || actorOutcomes[0] || {
          id: `out-gen-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i}`,
          statement: personaObj?.responsibilities || `${role} execute structured delivery routines and maintain pedagogical fidelity.`,
          indicator: `% of ${role} completing scheduled review and coaching routines with fidelity`,
          meansOfVerification: 'District monitoring portal registers & supervisory spot-check records.',
        };

        // Activity
        const act = actorActivities[i] || actorActivities[0] || {
          id: `act-gen-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i}`,
          description: `Institutional capacity building, orientation, and coaching review routines for ${role}.`,
          metric: 'Operationalized across all targeted schools',
        };

        // Input / resource
        const resourceIdx = (actorIdx * 2 + i) % (resources.length || 1);
        const relatedInput = resources[resourceIdx] || resources[0] || 'Leveled pedagogical toolkits & review registers';

        items.push({
          id: `${out.id || `out-${actorIdx}-${i}`}-${act.id || `act-${i}`}`,
          originalIndex: actorIdx * 10 + i,
          actor: role,
          outcome: out,
          indicator: out.indicator || '% of targeted actors executing reading routine with fidelity',
          activity: act.description,
          input: relatedInput,
        });
      }

      result.push({
        actor: role,
        items,
      });
    });

    return result;
  }, [outcomes, activities, resources, stakeholdersList, personas]);

  // Filtered groups according to selected stakeholder filter pill
  const visibleGroups = useMemo(() => {
    if (selectedStakeholder === 'all') return clubbedByActor;
    return clubbedByActor.filter(g => g.actor === selectedStakeholder);
  }, [clubbedByActor, selectedStakeholder]);

  // Flatten rows with actor rowSpan calculation
  const tableRows = useMemo(() => {
    const result: Array<{
      id: string;
      actor: string;
      actorIndex: number;
      isFirstInActor: boolean;
      actorRowCount: number;
      outcome: LFAOutcome;
      indicator: string;
      activity: string;
      input: string;
    }> = [];

    visibleGroups.forEach((group, gIdx) => {
      group.items.forEach((item, itemIdx) => {
        result.push({
          id: item.id,
          actor: group.actor,
          actorIndex: gIdx,
          isFirstInActor: itemIdx === 0,
          actorRowCount: group.items.length,
          outcome: item.outcome,
          indicator: item.indicator,
          activity: item.activity,
          input: item.input,
        });
      });
    });

    return result;
  }, [visibleGroups]);

  // Parse Impact Indicators into clean list
  const parsedImpactIndicators = useMemo(() => {
    if (!matrix.impact?.indicators?.trim()) return [];
    return matrix.impact.indicators
      .split('\n')
      .map(s => s.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean);
  }, [matrix.impact?.indicators]);

  const handleCopyMarkdown = () => {
    let md = `
# Logical Framework Analysis (LFA)
**Challenge:** ${matrix.challengeStatement || 'Grounded education challenge'}
**Impact Statement:** ${matrix.impact?.statement || 'N/A'}
**Impact Indicators:** ${matrix.impact?.indicators || 'N/A'}

---
### Logical Framework Matrix

| Impact Statement | Impact Indicators | Stake Holder | Outcomes | Outcome Indicators | Activities | Inputs |
|---|---|---|---|---|---|---|
`;

    tableRows.forEach((r, idx) => {
      const impactCell = idx === 0 ? (matrix.impact?.statement || '').replace(/\n+/g, ' ') : '"';
      const impactIndCell = idx === 0 ? parsedImpactIndicators.join('; ') : '"';
      const actorCell = r.isFirstInActor ? r.actor : '"';
      md += `| ${impactCell} | ${impactIndCell} | **${actorCell}** | ${r.outcome.statement} | ${r.indicator} | ${r.activity} | ${r.input} |\n`;
    });

    navigator.clipboard.writeText(md.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const totalRowCount = tableRows.length;

  return (
    <div className="bg-white border border-gray-200/90 rounded-xl overflow-hidden shadow-2xs font-sans space-y-3 p-3 sm:p-4">
      
      {/* 1. Grounded Challenge Banner (shown how we have right now) */}
      <div className="border border-purple-200/90 rounded-xl bg-purple-50/40 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between text-[10.5px] font-bold tracking-wider uppercase text-purple-800 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            1. The Challenge
          </span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[9.5px] font-semibold border border-purple-200">
            Grounded Challenge
          </span>
        </div>
        <p className="text-[13.5px] text-gray-800 font-serif leading-relaxed">
          {matrix.challengeStatement || "Foundational learning gaps in early grades requiring systematic reading fluency routines."}
        </p>
      </div>

      {/* 2. Header Bar with Actions & Stakeholder Filters (No 4x4 CTA) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-0.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Table2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-gray-900 leading-tight">
              Logical Framework Matrix
            </h4>
            <span className="text-[11px] text-gray-500">
              Tabular Results Chain: Impact, Outcomes, Activities & Inputs
            </span>
          </div>
        </div>

        {/* Stakeholder Filter & Copy Button */}
        <div className="flex items-center gap-2">
          {stakeholdersList.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedStakeholder('all')}
                className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition-all shrink-0 cursor-pointer ${
                  selectedStakeholder === 'all'
                    ? 'bg-purple-700 text-white shadow-2xs font-semibold'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                All Stakeholders ({stakeholdersList.length})
              </button>
              {stakeholdersList.map((role, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedStakeholder(role)}
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition-all border shrink-0 cursor-pointer ${
                    selectedStakeholder === role
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-semibold'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Copy entire LFA matrix in Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 3. Full Tabular Format: Impact, Impact Indicators, Stake Holder, Outcomes, Outcome Indicators, Activities, Inputs */}
      <div className="overflow-x-auto rounded-xl border border-gray-200/90 shadow-2xs">
        <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200/90 text-gray-700 uppercase tracking-wider text-[10px] font-bold">
              <th className="py-3 px-3.5 border-r border-gray-200/80 w-[16%]">
                <div className="flex items-center gap-1.5 text-purple-800">
                  <Target className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Impact Statement</span>
                </div>
              </th>
              <th className="py-3 px-3.5 border-r border-gray-200/80 w-[17%]">
                <div className="flex items-center gap-1.5 text-purple-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Impact Indicators</span>
                </div>
              </th>
              <th className="py-3 px-3.5 border-r border-gray-200/80 w-[14%]">
                <div className="flex items-center gap-1.5 text-indigo-800">
                  <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Stake Holder</span>
                </div>
              </th>
              <th className="py-3 px-3.5 border-r border-gray-200/80 w-[19%]">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Outcomes</span>
                </div>
              </th>
              <th className="py-3 px-3.5 border-r border-gray-200/80 w-[14%]">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Outcome Indicators</span>
                </div>
              </th>
              <th className="py-3 px-3.5 border-r border-gray-200/80 w-[12%]">
                <div className="flex items-center gap-1.5 text-blue-800">
                  <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Activities</span>
                </div>
              </th>
              <th className="py-3 px-3.5 w-[8%]">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Inputs</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/80 font-sans">
            {totalRowCount > 0 ? (
              tableRows.map((row, rIdx) => (
                <tr key={`${row.id}-${rIdx}`} className="hover:bg-purple-50/15 transition-colors">
                  
                  {/* 1. Impact (rowspan across all rows) */}
                  {rIdx === 0 && (
                    <td
                      rowSpan={totalRowCount}
                      className="py-3.5 px-3.5 border-r border-gray-200/80 align-top bg-purple-50/20 text-gray-900 font-serif text-[12.5px] leading-relaxed"
                    >
                      <p>
                        {matrix.impact?.statement || matrix.goal || "Grade 2-3 primary students achieve benchmark oral reading fluency (45+ WPM) and reading comprehension."}
                      </p>
                    </td>
                  )}

                  {/* 2. Impact Indicators (rowspan across all rows) */}
                  {rIdx === 0 && (
                    <td
                      rowSpan={totalRowCount}
                      className="py-3.5 px-3.5 border-r border-gray-200/80 align-top bg-purple-50/10 text-xs"
                    >
                      {parsedImpactIndicators.length > 0 ? (
                        <div className="space-y-1.5">
                          {parsedImpactIndicators.map((ind, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-800 bg-white/95 p-1.5 rounded-lg border border-purple-100 shadow-2xs">
                              <span className="font-mono text-[9.5px] font-bold text-purple-700 shrink-0 mt-0.5">I{i + 1}.</span>
                              <span className="leading-snug">{ind}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">No impact indicators configured yet</span>
                      )}
                    </td>
                  )}

                  {/* 3. Stake Holder (rowspan per stakeholder group) */}
                  {row.isFirstInActor && (
                    <td
                      rowSpan={row.actorRowCount}
                      className="py-3.5 px-3.5 border-r border-gray-200/80 align-top bg-gray-50/40"
                    >
                      <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-semibold border ${getStakeholderBadgeColor(row.actor, row.actorIndex)}`}>
                        {row.actor}
                      </span>
                    </td>
                  )}

                  {/* 4. Outcomes */}
                  <td className="py-3.5 px-3.5 border-r border-gray-200/80 align-top text-gray-900 text-xs leading-relaxed">
                    <div className="font-medium text-[12px] text-gray-900">
                      {row.outcome.statement}
                    </div>
                  </td>

                  {/* 5. Outcome Indicators */}
                  <td className="py-3.5 px-3.5 border-r border-gray-200/80 align-top text-gray-700 text-xs leading-relaxed">
                    <div className="text-[11.5px] text-gray-700 font-medium">
                      {row.indicator}
                    </div>
                    {row.outcome.meansOfVerification && (
                      <div className="mt-1.5 pt-1 border-t border-gray-100 text-[10px] text-gray-500 font-sans">
                        <span className="font-semibold text-gray-600">MoV: </span>
                        {row.outcome.meansOfVerification}
                      </div>
                    )}
                  </td>

                  {/* 6. Activities */}
                  <td className="py-3.5 px-3.5 border-r border-gray-200/80 align-top text-gray-800 text-xs leading-relaxed">
                    <div className="text-[11.5px] text-gray-700">
                      {row.activity}
                    </div>
                  </td>

                  {/* 7. Inputs */}
                  <td className="py-3.5 px-3.5 align-top text-gray-700 text-xs leading-relaxed bg-slate-50/30">
                    <div className="text-[11px] text-gray-600">
                      {row.input}
                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-400 text-xs italic">
                  Framework synthesizing... Complete preceding sections to populate the Logical Framework table.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
