import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus, Loader2, ChevronUp, UserPlus, X } from 'lucide-react';
import { pdcApiService, RealStakeholderGroup } from '../../services/pdcApiService';
import { useChat } from '../../context/ChatContext';
import { isMatchingStakeholder } from './StakeholderSelectionCard';

interface StakeholderBottomDockProps {
  suggestedStakeholders?: string[];
}

const DEFAULT_SUGGESTED = [
  'Teachers',
  'School Leaders (HTs/HMs)',
  'Cluster Resource Persons (CRPs)',
];

const LEVEL_HEADINGS: Record<string, string> = {
  school: 'At the school',
  cluster: 'At the cluster',
  block: 'At the block',
  district: 'At the district',
  state: 'At the state',
};

const FALLBACK_GROUPS: RealStakeholderGroup[] = [
  {
    level: 'school',
    stakeholders: [
      'Students',
      'Teachers',
      'School Leaders (HTs/HMs)',
      'Parents',
      'Special Educators',
    ],
  },
  {
    level: 'cluster',
    stakeholders: [
      'Cluster Head Teachers (CHTs)',
      'Cluster Resource Persons (CRPs)',
      'Academic Resource Persons (ARPs)',
    ],
  },
  {
    level: 'block',
    stakeholders: [
      'Block Resource Persons (BRPs)/Block Resource Centre Co-ordinators (BRCCs)',
      'Block Education Officers (BEOs)',
      'Block Programme Officers (BPOs)',
    ],
  },
  {
    level: 'district',
    stakeholders: [
      'District Institution of Education and Training (DIET)',
      'District Education Officers (DEOs)',
      'District Resource Groups (DRGs)',
    ],
  },
  {
    level: 'state',
    stakeholders: [
      'State Council of Educational Research & Training (SCERT)/ DSERT',
      'Samagra Shiksha State Project Directorate (SPD)',
      'Directorate of School Education',
    ],
  },
];

export const StakeholderBottomDock: React.FC<StakeholderBottomDockProps> = ({
  suggestedStakeholders,
}) => {
  const { activeConversation, confirmStakeholders, sending } = useChat();
  const activeState = activeConversation?.context?.detectedState;
  const [selected, setSelected] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [groups, setGroups] = useState<RealStakeholderGroup[]>(FALLBACK_GROUPS);
  const [customRole, setCustomRole] = useState('');

  // Centered modal state for unfamiliar/custom stakeholders
  const [unknownModalRole, setUnknownModalRole] = useState<string | null>(null);
  const [roleDescription, setRoleDescription] = useState('');
  const [isStateSpecific, setIsStateSpecific] = useState<boolean>(false);
  const [customDetailsMap, setCustomDetailsMap] = useState<
    Record<string, { description: string; isStateSpecific: boolean }>
  >({});

  // Top 3-4 concise suggested chips for the compact view
  const primarySuggestions = useMemo(() => {
    const source =
      suggestedStakeholders && suggestedStakeholders.length > 0
        ? suggestedStakeholders
        : DEFAULT_SUGGESTED;
    // Keep compact suggested bar focused (prefer Teachers, School Leaders, CRPs or first 3)
    const preferred = DEFAULT_SUGGESTED.filter(def =>
      source.some(s => isMatchingStakeholder(s, def))
    );
    return preferred.length >= 2 ? preferred : source.slice(0, 3);
  }, [suggestedStakeholders]);

  // Show suggested chips + any additional stakeholders user picked from expanded view
  const visibleCompactChips = useMemo(() => {
    const extras = selected.filter(
      sel => !primarySuggestions.some(p => isMatchingStakeholder(p, sel))
    );
    return [...primarySuggestions, ...extras];
  }, [primarySuggestions, selected]);

  useEffect(() => {
    let isMounted = true;
    pdcApiService
      .getStakeholders()
      .then(res => {
        if (isMounted && res.groups && res.groups.length > 0) {
          setGroups(res.groups);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleStakeholder = (name: string) => {
    if (sending) return;
    setSelected(prev => {
      const exists = prev.some(s => isMatchingStakeholder(s, name));
      if (exists) {
        return prev.filter(s => !isMatchingStakeholder(s, name));
      }
      return [...prev, name];
    });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customRole.trim();
    if (!trimmed) return;

    // Check if the entered role matches a familiar stakeholder in our directory
    const allKnown = groups.flatMap(g => g.stakeholders);
    const knownMatch = allKnown.find(st => isMatchingStakeholder(st, trimmed));

    if (knownMatch) {
      if (!selected.some(s => isMatchingStakeholder(s, knownMatch))) {
        setSelected(prev => [...prev, knownMatch]);
      }
      setCustomRole('');
      return;
    }

    // Unfamiliar custom role -> open centered pop-up asking what the stakeholder does & state-specific toggle
    setUnknownModalRole(trimmed);
    setRoleDescription(customDetailsMap[trimmed]?.description || '');
    setIsStateSpecific(customDetailsMap[trimmed]?.isStateSpecific ?? false);
  };

  const handleSaveUnknownStakeholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unknownModalRole || !roleDescription.trim()) return;
    const roleName = unknownModalRole;
    setCustomDetailsMap(prev => ({
      ...prev,
      [roleName]: {
        description: roleDescription.trim(),
        isStateSpecific,
      },
    }));
    if (!selected.some(s => isMatchingStakeholder(s, roleName))) {
      setSelected(prev => [...prev, roleName]);
    }
    setCustomRole('');
    setUnknownModalRole(null);
    setRoleDescription('');
  };

  const handleBuildFramework = async () => {
    if (selected.length === 0 || sending) return;
    await confirmStakeholders(selected, customDetailsMap);
  };

  const isSelected = (name: string) =>
    selected.some(s => isMatchingStakeholder(s, name));

  return (
    <div className="p-3 bg-white border-t border-gray-100 animate-fade-in">
      <div className="rounded-2xl border border-gray-200/90 bg-[#faf9f6] p-3.5 shadow-xs space-y-3">
        {/* Expanded Full List (Opens when "+ add someone else" is clicked) */}
        {isExpanded ? (
          <div className="space-y-2.5 animate-fade-in">
            <div className="max-h-[240px] overflow-y-auto rounded-xl border border-gray-200/90 bg-white p-3 space-y-3.5 pr-2">
              {groups.map(group => {
                const heading =
                  LEVEL_HEADINGS[group.level.toLowerCase()] ||
                  `At the ${group.level}`;
                return (
                  <div key={group.level} className="space-y-1.5">
                    <div className="text-[11.5px] font-medium text-gray-500">
                      {heading}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.stakeholders.map(role => {
                        const active = isSelected(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleStakeholder(role)}
                            className={`text-left px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                              active
                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                : 'bg-white text-gray-800 border-gray-300/90 hover:border-purple-400 hover:bg-purple-50/40'
                            }`}
                          >
                            {active && <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />}
                            <span>{role}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Custom Role Inline Input */}
              <form
                onSubmit={handleAddCustom}
                className="pt-2 border-t border-gray-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="Add another stakeholder role..."
                  className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:border-purple-400 text-gray-800 placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!customRole.trim()}
                  className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Compact Suggested View (Default) */
          <div className="space-y-2">
            <div className="text-[11.5px] font-medium text-gray-500">
              Suggested for this impact
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleCompactChips.map(role => {
                const active = isSelected(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleStakeholder(role)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                      active
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-gray-800 border-gray-300/80 hover:border-purple-400 hover:bg-purple-50/40'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />}
                    <span>{role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Bar: "+ add someone else" | "N people" | "Build the framework" */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="text-[12px] font-medium text-gray-700 hover:text-purple-700 transition-colors cursor-pointer flex items-center gap-1 px-1 py-1 rounded-lg hover:bg-gray-100/80"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show suggested</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>add someone else</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[12px] text-gray-500 font-medium tabular-nums">
              {selected.length} {selected.length === 1 ? 'person' : 'people'}
            </span>

            <button
              type="button"
              onClick={handleBuildFramework}
              disabled={selected.length === 0 || sending}
              className={`px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all flex items-center gap-1.5 ${
                selected.length > 0 && !sending
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer active:scale-95'
                  : 'bg-purple-300/75 text-white cursor-not-allowed'
              }`}
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building...</span>
                </>
              ) : (
                <span>Build the framework</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Subtle footer matching InputBar */}
      <div className="text-center text-[10px] text-gray-400 select-none font-sans truncate px-2 pt-1.5">
        Select the delivery cadres driving this programme • Click + add someone else for all levels
      </div>

      {/* Centered Modal Pop-up for Unfamiliar Custom Stakeholder */}
      {unknownModalRole &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
            onClick={() => setUnknownModalRole(null)}
          >
            <div
              className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 text-gray-900"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                      Tell us about "{unknownModalRole}"
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Custom stakeholder role
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUnknownModalRole(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Prompt Copy */}
              <p className="text-[13px] text-gray-700 leading-relaxed bg-purple-50/50 border border-purple-100 rounded-xl p-3">
                You wanted to add <span className="font-semibold text-gray-900">{unknownModalRole}</span>, but we are not familiar with that role. Can you help me with a description of what this stakeholder does?
              </p>

              {/* Form */}
              <form onSubmit={handleSaveUnknownStakeholder} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-gray-700">
                    What does this stakeholder do?
                  </label>
                  <textarea
                    value={roleDescription}
                    onChange={e => setRoleDescription(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder="e.g., Conducts monthly classroom observations, mentors teachers on phonics routines, and tracks reading progress..."
                    className="w-full text-[13px] px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>

                {/* State-Specific Yes / No Toggle */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200/90 bg-gray-50/60">
                  <div>
                    <div className="text-[12.5px] font-medium text-gray-800">
                      State-specific?
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {activeState
                        ? `Specific to ${activeState} or used across states`
                        : 'Is this role specific to this state?'}
                    </div>
                  </div>
                  <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsStateSpecific(true)}
                      className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                        isStateSpecific
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStateSpecific(false)}
                      className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                        !isStateSpecific
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUnknownModalRole(null)}
                    className="px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!roleDescription.trim()}
                    className="px-4 py-2 rounded-xl text-[12.5px] font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
                  >
                    Add Stakeholder
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
