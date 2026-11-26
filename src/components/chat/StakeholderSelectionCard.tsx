import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, Check, Plus, ArrowRight, Sparkles, X, Search, Building2, CheckCircle2, RotateCcw } from 'lucide-react';
import { pdcApiService, RealStakeholderGroup } from '../../services/pdcApiService';
import { useChat } from '../../context/ChatContext';

interface StakeholderSelectionCardProps {
  suggestedStakeholders?: string[];
  onConfirmed?: () => void;
}

// Canonical Indian Education Administrative Stakeholders
const DEFAULT_HIERARCHICAL_STAKEHOLDERS: RealStakeholderGroup[] = [
  {
    level: 'school',
    stakeholders: [
      'Students',
      'Teachers',
      'School Leaders (HTs/HMs)',
      'Parents',
      'Special Educators'
    ]
  },
  {
    level: 'cluster',
    stakeholders: [
      'Cluster Resource Persons (CRPs)',
      'Cluster Head Teachers (CHTs)',
      'Academic Resource Persons (ARPs)'
    ]
  },
  {
    level: 'block',
    stakeholders: [
      'Block Education Officers (BEOs)',
      'Block Resource Persons (BRPs)',
      'Block Programme Officers (BPOs)'
    ]
  },
  {
    level: 'district',
    stakeholders: [
      'District Institution of Education and Training (DIET)',
      'District Education Officers (DEOs)',
      'District Resource Groups (DRGs)'
    ]
  },
  {
    level: 'state',
    stakeholders: [
      'State Council of Educational Research & Training (SCERT)/ DSERT',
      'Samagra Shiksha State Project Directorate (SPD)',
      'Directorate of School Education'
    ]
  }
];

export const RECOMMENDED_STAKEHOLDER_KEYS = [
  'Students',
  'Teachers',
  'School Leaders (HTs/HMs)',
  'Parents',
  'Cluster Resource Persons (CRPs)',
  'Academic Resource Persons (ARPs)',
  'District Institution of Education and Training (DIET)',
  'State Council of Educational Research & Training (SCERT)/ DSERT'
];

/**
 * Exact & Semantic Role Matcher:
 * Ensures matching across naming variations (e.g. "Institution" vs "Institute", "Parents" vs "Parents & SMC Members")
 * Uses word boundaries so "HT" never accidentally matches "CHT" or "Teachers".
 */
export function isMatchingStakeholder(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  // DIET
  const isDietA = /\bdiet\b/i.test(a);
  const isDietB = /\bdiet\b/i.test(b);
  if (isDietA && isDietB) return true;

  // SCERT
  const isScertA = /\bscert\b/i.test(a);
  const isScertB = /\bscert\b/i.test(b);
  if (isScertA && isScertB) return true;

  // CRP (Cluster Resource Persons)
  const isCrpA = /\b(crp|crcc)\b/i.test(a) || cleanA.includes('cluster resource person');
  const isCrpB = /\b(crp|crcc)\b/i.test(b) || cleanB.includes('cluster resource person');
  if (isCrpA && isCrpB) return true;

  // ARP (Academic Resource Persons)
  const isArpA = /\barp\b/i.test(a) || cleanA.includes('academic resource person');
  const isArpB = /\barp\b/i.test(b) || cleanB.includes('academic resource person');
  if (isArpA && isArpB) return true;

  // CHT (Cluster Head Teachers)
  const isChtA = /\bcht\b/i.test(a) || cleanA.includes('cluster head teacher');
  const isChtB = /\bcht\b/i.test(b) || cleanB.includes('cluster head teacher');
  if (isChtA && isChtB) return true;

  // Parents & SMC
  const isParentA = cleanA.includes('parent') || cleanA.includes('smc');
  const isParentB = cleanB.includes('parent') || cleanB.includes('smc');
  if (isParentA && isParentB) return true;

  // School Leaders (HTs/HMs) - explicitly exclude Cluster Head Teachers
  const isSchoolLeaderA = (cleanA.includes('school leader') || /\b(hts?|hms?|headmaster|headmistress)\b/i.test(a)) && !isChtA;
  const isSchoolLeaderB = (cleanB.includes('school leader') || /\b(hts?|hms?|headmaster|headmistress)\b/i.test(b)) && !isChtB;
  if (isSchoolLeaderA && isSchoolLeaderB) return true;

  // Teachers (Regular Class Teachers) - exclude School Leaders and Cluster Head Teachers
  const isTeacherA = cleanA.includes('teacher') && !isSchoolLeaderA && !isChtA;
  const isTeacherB = cleanB.includes('teacher') && !isSchoolLeaderB && !isChtB;
  if (isTeacherA && isTeacherB) return true;

  // Students
  const isStudentA = cleanA.includes('student') || cleanA.includes('learner');
  const isStudentB = cleanB.includes('student') || cleanB.includes('learner');
  if (isStudentA && isStudentB) return true;

  return false;
}

function pickSmartStakeholders(candidates: string[], problemText: string): string[] {
  if (!candidates || candidates.length === 0) return [];
  const lowerProblem = (problemText || '').toLowerCase();

  // Score candidates by relevance to the problem statement + small random jitter so 3-4 varied, relevant actors are picked
  const scored = candidates.map((role) => {
    const r = role.toLowerCase();
    let score = Math.random() * 1.5; // slight random variation among relevant peers

    if (r.includes('teacher') && !r.includes('head') && !r.includes('leader')) {
      score += /teach|class|read|literacy|numeracy|fln|fluency|pedagog|student|learn/i.test(lowerProblem) ? 3 : 1.5;
    }
    if (r.includes('student')) {
      score += /student|read|learn|fluency|retention|attendance|dropout|grade/i.test(lowerProblem) ? 2.8 : 1;
    }
    if (r.includes('school leader') || r.includes('ht') || r.includes('hm') || r.includes('headmaster')) {
      score += /leader|headmaster|hm|ht|school|timetable|observation|supervis/i.test(lowerProblem) ? 3.2 : 1.2;
    }
    if (r.includes('crp') || r.includes('cluster')) {
      score += /cluster|coach|mentor|primary|rural|fln|reading/i.test(lowerProblem) ? 2.5 : 1;
    }
    if (r.includes('arp') || r.includes('academic resource')) {
      score += /academic|block|pedagog|training|coach|study circle/i.test(lowerProblem) ? 2.4 : 0.8;
    }
    if (r.includes('parent') || r.includes('smc')) {
      score += /parent|smc|community|retention|migration|dropout|attendance|home/i.test(lowerProblem) ? 3.4 : 0.5;
    }
    if (r.includes('diet') || r.includes('scert')) {
      score += /state|district|curriculum|assessment|diet|scert|policy|training/i.test(lowerProblem) ? 2.2 : 0.5;
    }

    return { role, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const targetCount = Math.min(candidates.length, Math.random() < 0.5 ? 3 : 4);
  return scored.slice(0, targetCount).map((item) => item.role);
}

export const StakeholderSelectionCard: React.FC<StakeholderSelectionCardProps> = ({
  suggestedStakeholders = RECOMMENDED_STAKEHOLDER_KEYS,
  onConfirmed,
}) => {
  const { activeConversation, confirmStakeholders, sending } = useChat();
  const problemContextText = [
    activeConversation?.context?.challenge,
    activeConversation?.context?.lfaMatrix?.challengeStatement,
    activeConversation?.context?.expectedChange,
  ]
    .filter(Boolean)
    .join(' ');

  const [selected, setSelected] = useState<string[]>(() =>
    pickSmartStakeholders(suggestedStakeholders, problemContextText)
  );
  const [groups, setGroups] = useState<RealStakeholderGroup[]>(DEFAULT_HIERARCHICAL_STAKEHOLDERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [customStakeholder, setCustomStakeholder] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Temporary selection inside modal before clicking Save
  const [tempSelected, setTempSelected] = useState<string[]>(selected);

  useEffect(() => {
    let isMounted = true;
    pdcApiService.getStakeholders().then(res => {
      if (isMounted && res.groups && res.groups.length > 0) {
        setGroups(res.groups);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const openModal = () => {
    setTempSelected([...selected]);
    setSearchQuery('');
    setSelectedLevelFilter('all');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const saveModalSelection = () => {
    setSelected([...tempSelected]);
    setIsModalOpen(false);
  };

  const toggleTempStakeholder = (name: string) => {
    setTempSelected(prev => {
      const isAlreadySelected = prev.some(sel => isMatchingStakeholder(sel, name));
      if (isAlreadySelected) {
        return prev.filter(sel => !isMatchingStakeholder(sel, name));
      } else {
        return [...prev, name];
      }
    });
  };

  const removeSelected = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => prev.filter(sel => !isMatchingStakeholder(sel, name)));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customStakeholder.trim();
    if (trimmed && !tempSelected.some(sel => isMatchingStakeholder(sel, trimmed))) {
      setTempSelected(prev => [...prev, trimmed]);
      setCustomStakeholder('');
    }
  };

  // Robust Reset to Recommended:
  // Maps recommended cadres to the exact available role names in groups
  const resetToRecommended = () => {
    const allAvailable = groups.flatMap(g => g.stakeholders);
    const resolvedRecommended = RECOMMENDED_STAKEHOLDER_KEYS.map(rec => {
      const match = allAvailable.find(avail => isMatchingStakeholder(avail, rec));
      return match || rec;
    });
    setTempSelected(Array.from(new Set(resolvedRecommended)));
  };

  const clearAllSelections = () => {
    setTempSelected([]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setIsSubmitted(true);
    await confirmStakeholders(selected);
    onConfirmed?.();
  };

  // Compact card chip display logic:
  // If selected <= 4, show all chips directly.
  // If selected > 4, show first 3 primary stakeholders + "+N more" badge pill.
  const displayedChips = useMemo(() => {
    if (selected.length <= 4) {
      return selected;
    }
    return selected.slice(0, 3);
  }, [selected]);

  const overflowCount = selected.length > 4 ? selected.length - 3 : 0;

  // Filtered list for the modal pop-up
  const filteredGroups = useMemo(() => {
    return groups.map(g => {
      if (selectedLevelFilter !== 'all' && g.level.toLowerCase() !== selectedLevelFilter.toLowerCase()) {
        return null;
      }
      const matched = g.stakeholders.filter(st =>
        !searchQuery.trim() || st.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matched.length === 0) return null;
      return { ...g, stakeholders: matched };
    }).filter(Boolean) as RealStakeholderGroup[];
  }, [groups, searchQuery, selectedLevelFilter]);

  const totalAvailableCount = useMemo(() => {
    let count = 0;
    groups.forEach(g => { count += g.stakeholders.length; });
    return count;
  }, [groups]);

  return (
    <>
      {/* ======================================================== */}
      {/* 1. COMPACT CHAT CARD (Minimal, Sleek ~100px Container)   */}
      {/* ======================================================== */}
      <div className="my-3.5 p-4 bg-white border border-indigo-200/90 rounded-2xl shadow-sm text-gray-800 space-y-3 max-w-xl animate-fade-in font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-indigo-100/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-[13px] block leading-tight">
                Delivery Stakeholders
              </span>
              <span className="text-[11px] text-gray-500 font-normal">
                Who needs to change what they do?
              </span>
            </div>
          </div>

          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
            {selected.length} Selected
          </span>
        </div>

        {/* Compact Chip Container with 3 Primary + "+N more" + "+ Add Stakeholders" CTA */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {displayedChips.map((name) => (
            <div
              key={name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 border border-indigo-200/90 text-indigo-950 text-[11.5px] font-medium shadow-2xs group"
            >
              <Check className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate max-w-[170px]">{name}</span>
              <button
                type="button"
                onClick={(e) => removeSelected(name, e)}
                className="text-indigo-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                title={`Remove ${name}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* "+N more" Clickable Badge */}
          {overflowCount > 0 && (
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 text-[11.5px] font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
              title={`Click to open modal and view all ${selected.length} selected stakeholders`}
            >
              <span>+{overflowCount} more</span>
            </button>
          )}

          {/* "+ Add Stakeholders" CTA Button */}
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-dashed border-indigo-300 text-[11.5px] font-medium transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Open pop-up to add or remove stakeholders across institutional tiers"
          >
            <Plus className="w-3 h-3 text-indigo-600" />
            <span>Add Stakeholders</span>
          </button>
        </div>

        {/* Submit Action Bar */}
        <div className="pt-2 flex items-center justify-between border-t border-gray-100">
          <span className="text-[11px] text-gray-500 font-normal">
            {selected.length} cadres configured
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.length === 0 || isSubmitted || sending}
            className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSubmitted ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Confirm Stakeholders & Build Framework</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TRUE FULL-SCREEN CENTERED POP-UP MODAL (via PORTAL)   */}
      {/* ======================================================== */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans select-none"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[16px] leading-tight">
                    Manage Programme Stakeholders
                  </h3>
                  <p className="text-[12.5px] text-gray-500 mt-1">
                    Select delivery cadres across institutional tiers or add custom roles
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200/70 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Tabs */}
            <div className="p-4 sm:px-6 border-b border-gray-100 space-y-3 bg-white">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cadres, roles, or administrative levels..."
                  className="w-full pl-10 pr-9 py-2 text-[13px] rounded-xl border border-gray-200/90 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-900 placeholder-gray-400 transition-all bg-gray-50/50 focus:bg-white"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Level Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
                {[
                  { id: 'all', label: `All Tiers (${totalAvailableCount})` },
                  { id: 'school', label: 'School Level' },
                  { id: 'cluster', label: 'Cluster Level' },
                  { id: 'block', label: 'Block Level' },
                  { id: 'district', label: 'District Level' },
                  { id: 'state', label: 'State Level' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedLevelFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedLevelFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Grouped Stakeholders Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No stakeholders match "{searchQuery}"
                </div>
              ) : (
                filteredGroups.map((g) => (
                  <div key={g.level} className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{g.level} Level</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {g.stakeholders.map((st) => {
                        const isChecked = tempSelected.some(sel => isMatchingStakeholder(sel, st));
                        return (
                          <div
                            key={st}
                            onClick={() => toggleTempStakeholder(st)}
                            className={`p-3 rounded-xl text-left text-xs border transition-all flex items-center justify-between cursor-pointer select-none ${
                              isChecked
                                ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 font-medium shadow-2xs ring-1 ring-indigo-400/30'
                                : 'bg-white hover:bg-gray-50/90 border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="pr-3 min-w-0">
                              <span className="font-medium text-[12.5px] block leading-snug break-words">
                                {st}
                              </span>
                              <span className="text-[10px] text-gray-400 capitalize mt-0.5 block font-normal">
                                {g.level} Cadre
                              </span>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                                  : 'border-gray-300 bg-white group-hover:border-gray-400'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.8]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Add Custom Role Section */}
              <div className="pt-4 border-t border-gray-100">
                <span className="text-[11.5px] font-semibold text-gray-700 block mb-2">
                  Add Custom Cadre or Implementation Partner:
                </span>
                <form onSubmit={handleAddCustom} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customStakeholder}
                    onChange={(e) => setCustomStakeholder(e.target.value)}
                    placeholder='e.g. "Community Literacy Volunteers", "DIET Mentors"'
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50/50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!customStakeholder.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-700 font-semibold">
                  {tempSelected.length} cadres selected
                </span>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={resetToRecommended}
                  className="text-[11.5px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                  title="Reset to 8 recommended foundational education delivery stakeholders"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Recommended (8)</span>
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={clearAllSelections}
                  className="text-[11.5px] text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
                  title="Deselect all stakeholders"
                >
                  Clear All
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveModalSelection}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Stakeholders ({tempSelected.length})</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};
