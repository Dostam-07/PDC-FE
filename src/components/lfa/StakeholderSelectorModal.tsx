import React, { useState, useEffect } from 'react';
import { 
  X, Check, Plus, Trash2, Users, Sparkles, Filter, 
  HelpCircle, CheckCircle2, ArrowRight, RotateCcw, Building2
} from 'lucide-react';
import { LFAMatrix, LFAPersona } from '../../types/lfa';
import { useChat } from '../../context/ChatContext';
import { findStakeholderDef } from '../../utils/conversationRefinement';

interface StakeholderSelectorModalProps {
  matrix: LFAMatrix;
  isOpen: boolean;
  onClose: () => void;
}

interface CandidateStakeholder {
  id: string;
  role: string;
  category: 'School Level' | 'Cluster & Block' | 'District & State' | 'Community & Families' | 'Learners & Beneficiaries';
  responsibilities: string;
  institutionalTier: string;
}

const RECOMMENDED_STAKEHOLDERS_LIBRARY: CandidateStakeholder[] = [
  // District & State Level
  {
    id: 'stk-diet',
    role: 'District Institute of Education and Training (DIET)',
    category: 'District & State',
    institutionalTier: 'District Tier',
    responsibilities: 'Conducts monthly cluster academic reviews, analyzes low-performing school data, and mentors CRPs/ARPs on observation and feedback routines.'
  },
  {
    id: 'stk-scert',
    role: 'State Council of Educational Research & Training (SCERT)',
    category: 'District & State',
    institutionalTier: 'State Tier',
    responsibilities: 'Establishes foundational learning benchmarks, develops structured teacher toolkits, and conducts state-level learning assessments.'
  },
  {
    id: 'stk-deo',
    role: 'District Education Officer (DEO / DPO)',
    category: 'District & State',
    institutionalTier: 'District Governance',
    responsibilities: 'Oversees district administrative resources, enforces compliance with state learning directives, and reviews term-end achievement milestones.'
  },

  // Cluster & Block Level
  {
    id: 'stk-crp',
    role: 'Cluster Resource Persons (CRPs)',
    category: 'Cluster & Block',
    institutionalTier: 'Cluster Delivery Tier',
    responsibilities: 'Conducts bi-weekly classroom observation spot-checks, models phrased reading, and supports primary teachers with in-class pedagogical routines.'
  },
  {
    id: 'stk-arp',
    role: 'Academic Resource Persons (ARPs)',
    category: 'Cluster & Block',
    institutionalTier: 'Block Mentoring Tier',
    responsibilities: 'Holds block-level coaching registers, trains educators on foundational literacy routines, and supports teachers flagged for remedial instruction.'
  },
  {
    id: 'stk-beo',
    role: 'Block Education Officers (BEOs)',
    category: 'Cluster & Block',
    institutionalTier: 'Block Administration',
    responsibilities: 'Enforces timetable allocation for dedicated literacy blocks, monitors block-level student attendance, and chairs monthly principal review meetings.'
  },

  // School Level
  {
    id: 'stk-leader',
    role: 'School Leaders (HTs/HMs)',
    category: 'School Level',
    institutionalTier: 'School Leadership',
    responsibilities: 'Protects dedicated daily literacy blocks in school timetables, conducts regular classroom walk-throughs, and reviews class reading fluency registers.'
  },
  {
    id: 'stk-teacher',
    role: 'Primary School Teachers (Grades 1-5)',
    category: 'School Level',
    institutionalTier: 'Classroom Delivery Tier',
    responsibilities: 'Delivers structured daily oral reading routines, tracks individual student fluency benchmarks, and groups emerging readers for leveled practice.'
  },
  {
    id: 'stk-special-educator',
    role: 'Special Educators & Remedial Tutors',
    category: 'School Level',
    institutionalTier: 'Inclusive Learning Tier',
    responsibilities: 'Provides individualized literacy interventions for students requiring phonetic accommodations or multi-sensory reading aids.'
  },

  // Learners & Beneficiaries
  {
    id: 'stk-students',
    role: 'Students & Learners (Grades 1-5)',
    category: 'Learners & Beneficiaries',
    institutionalTier: 'Target Beneficiaries',
    responsibilities: 'Engages in daily connected-text oral reading practice, recognizes sight words automatically, and builds fluency toward grade-level mastery.'
  },

  // Community & Families
  {
    id: 'stk-parents',
    role: 'Parents & SMC Members',
    category: 'Community & Families',
    institutionalTier: 'Community Accountability',
    responsibilities: 'Reinforces 15-minute daily reading habits at home, attends termly school performance reviews, and monitors school attendance.'
  },
  {
    id: 'stk-volunteers',
    role: 'Community Reading Volunteers / Shiksha Mitras',
    category: 'Community & Families',
    institutionalTier: 'Grassroots Support',
    responsibilities: 'Facilitates after-school reading circles, assists struggling readers with leveled storybooks, and supports library book distribution.'
  }
];

export const StakeholderSelectorModal: React.FC<StakeholderSelectorModalProps> = ({
  matrix,
  isOpen,
  onClose,
}) => {
  const { updateLFAMatrix } = useChat();

  // Staged personas list
  const [stagedPersonas, setStagedPersonas] = useState<LFAPersona[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'current' | 'custom'>('library');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom stakeholder form state
  const [customRole, setCustomRole] = useState('');
  const [customCategory, setCustomCategory] = useState<'School Level' | 'Cluster & Block' | 'District & State' | 'Community & Families' | 'Learners & Beneficiaries'>('School Level');
  const [customResponsibilities, setCustomResponsibilities] = useState('');

  // Sync staged personas with matrix on modal open
  useEffect(() => {
    if (isOpen && matrix?.personas) {
      setStagedPersonas(JSON.parse(JSON.stringify(matrix.personas)));
    } else if (isOpen) {
      setStagedPersonas([]);
    }
  }, [isOpen, matrix]);

  if (!isOpen) return null;

  // Helper to check if a role is selected in staged personas
  const isSelected = (roleName: string) => {
    const norm = roleName.toLowerCase().trim();
    return stagedPersonas.some(p => {
      const pNorm = p.role.toLowerCase().trim();
      return pNorm === norm || 
        (norm.includes('diet') && pNorm.includes('diet')) ||
        (norm.includes('crp') && pNorm.includes('crp')) ||
        (norm.includes('arp') && pNorm.includes('arp')) ||
        (norm.includes('student') && pNorm.includes('student') && !norm.includes('teacher')) ||
        (norm.includes('teacher') && pNorm.includes('teacher') && !norm.includes('head') && !norm.includes('leader')) ||
        (norm.includes('leader') && pNorm.includes('leader'));
    });
  };

  // Toggle selection from library
  const toggleStakeholder = (candidate: CandidateStakeholder) => {
    if (isSelected(candidate.role)) {
      // Remove
      setStagedPersonas(prev => prev.filter(p => {
        const pNorm = p.role.toLowerCase().trim();
        const cNorm = candidate.role.toLowerCase().trim();
        return pNorm !== cNorm && 
          !(cNorm.includes('diet') && pNorm.includes('diet')) &&
          !(cNorm.includes('crp') && pNorm.includes('crp')) &&
          !(cNorm.includes('arp') && pNorm.includes('arp')) &&
          !(cNorm.includes('student') && pNorm.includes('student')) &&
          !(cNorm.includes('teacher') && pNorm.includes('teacher') && !cNorm.includes('head')) &&
          !(cNorm.includes('leader') && pNorm.includes('leader'));
      }));
    } else {
      // Add
      const newPersona: LFAPersona = {
        role: candidate.role,
        responsibilities: candidate.responsibilities
      };
      setStagedPersonas(prev => [...prev, newPersona]);
    }
  };

  // Remove directly from current list
  const handleRemovePersona = (index: number) => {
    setStagedPersonas(prev => prev.filter((_, i) => i !== index));
  };

  // Add custom stakeholder
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRole.trim()) return;

    const newPersona: LFAPersona = {
      role: customRole.trim(),
      responsibilities: customResponsibilities.trim() || 'Facilitates structured program pedagogy routines and monitoring fidelity.'
    };

    setStagedPersonas(prev => [...prev, newPersona]);
    setCustomRole('');
    setCustomResponsibilities('');
    setActiveTab('current');
  };

  // Apply changes to matrix
  const handleApplyChanges = () => {
    const originalRoles = (matrix.personas || []).map(p => p.role.toLowerCase().trim());
    const newAdded = stagedPersonas.filter(p => !originalRoles.includes(p.role.toLowerCase().trim()));

    // Synthesize a few default outcomes, activities, and outputs for newly added stakeholders
    const nextOutcomes = [...(matrix.outcomes || [])];
    const nextActivities = [...(matrix.activities || [])];
    const nextOutputs = [...(matrix.outputs || [])];

    newAdded.forEach((p, idx) => {
      const def = findStakeholderDef(p.role);
      const outcomeStmt = def?.outcomeStmt || `${p.role} execute structured delivery routines and maintain pedagogical fidelity.`;
      const indA = def?.indicatorA || `% of ${p.role} completing scheduled review and coaching routines with fidelity`;
      nextOutcomes.push({
        id: `outcome-${Date.now()}-${idx}`,
        statement: outcomeStmt,
        indicator: indA,
        meansOfVerification: 'District monitoring portal registers & supervisory spot-check records.'
      });

      const actDesc = def?.activityDesc || `Institutional capacity building, orientation, and coaching review routines for ${p.role}.`;
      const metric = def?.activityMetric || 'Operationalized across all targeted schools';
      nextActivities.push({
        id: `act-${Date.now()}-${idx}`,
        description: actDesc,
        metric
      });

      const opStmt = def?.outputStmt || `Monitoring logs, session attendance records, and review registers for ${p.role} published.`;
      nextOutputs.push({
        id: `out-${Date.now()}-${idx}`,
        statement: opStmt
      });
    });

    const diff = stagedPersonas.length - (matrix.personas?.length || 0);
    let changeSummaryNote: string | undefined = undefined;
    if (newAdded.length > 0) {
      changeSummaryNote = `Added stakeholder: ${newAdded.map(a => `**${a.role}**`).join(', ')}`;
    } else if (diff < 0) {
      changeSummaryNote = `Streamlined stakeholders by removing ${Math.abs(diff)} role(s).`;
    }

    updateLFAMatrix(
      {
        ...matrix,
        personas: stagedPersonas,
        outcomes: nextOutcomes,
        activities: nextActivities,
        outputs: nextOutputs,
      },
      changeSummaryNote,
      true
    );
    onClose();
  };

  // Filter library stakeholders
  const filteredLibrary = RECOMMENDED_STAKEHOLDERS_LIBRARY.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = 
      item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.responsibilities.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.institutionalTier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'District & State':
        return 'bg-purple-100/80 text-purple-800 border-purple-200';
      case 'Cluster & Block':
        return 'bg-amber-100/80 text-amber-800 border-amber-200';
      case 'School Level':
        return 'bg-emerald-100/80 text-emerald-800 border-emerald-200';
      case 'Learners & Beneficiaries':
        return 'bg-purple-100/80 text-purple-800 border-purple-200';
      case 'Community & Families':
        return 'bg-rose-100/80 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-gray-900 leading-tight">
                Manage Stakeholders & Personas
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Select, add, or prune delivery actors and target personas for your program.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0 bg-white">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'library'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Recommended Library</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'current'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <span>Current in Framework</span>
              <span className="font-mono px-1.5 py-0.2 rounded-full text-[10.5px] bg-indigo-100 text-indigo-800 font-bold">
                {stagedPersonas.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Custom Role</span>
            </button>
          </div>

          {/* Quick search input (visible in Library tab) */}
          {activeTab === 'library' && (
            <input
              type="text"
              placeholder="Search roles (e.g. DIET, CRP, Teacher)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
            />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: RECOMMENDED LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['All', 'District & State', 'Cluster & Block', 'School Level', 'Learners & Beneficiaries', 'Community & Families'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[11.5px] px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-gray-900 text-white font-semibold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Items List */}
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredLibrary.map((item) => {
                  const checked = isSelected(item.role);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleStakeholder(item)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        checked
                          ? 'border-indigo-400 bg-indigo-50/50 shadow-2xs ring-1 ring-indigo-400/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-[13px] text-gray-900 leading-snug">
                            {item.role}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}} // handled by parent div onClick
                            className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer shrink-0"
                          />
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getCategoryColor(item.category)}`}>
                            {item.institutionalTier}
                          </span>
                          {checked && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Selected
                            </span>
                          )}
                        </div>

                        <p className="text-[11.5px] text-gray-600 leading-relaxed">
                          {item.responsibilities}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">{item.category}</span>
                        <span className={`font-medium ${checked ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {checked ? 'Click to Remove' : '+ Click to Add'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CURRENT IN FRAMEWORK */}
          {activeTab === 'current' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">
                  {stagedPersonas.length} Stakeholder(s) in Current Framework Snapshot
                </span>
                <span className="text-[11px] text-gray-400">
                  Click the trash icon to remove any role.
                </span>
              </div>

              {stagedPersonas.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-xs">No stakeholders defined yet.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    Select from Recommended Library
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {stagedPersonas.map((persona, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-2xs flex flex-col justify-between hover:border-gray-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-gray-900 text-[13px] leading-snug">
                            {persona.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePersona(idx)}
                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0"
                            title="Remove role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11.5px] text-gray-600 leading-relaxed">
                          {persona.responsibilities || 'Facilitates structured program pedagogy routines and monitoring fidelity.'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Role #{idx + 1}</span>
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM STAKEHOLDER FORM */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-4 max-w-lg mx-auto py-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Role Title / Organization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. District Education Officer (DEO), Gram Panchayat"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Institutional Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="School Level">School Level</option>
                  <option value="Cluster & Block">Cluster & Block</option>
                  <option value="District & State">District & State</option>
                  <option value="Community & Families">Community & Families</option>
                  <option value="Learners & Beneficiaries">Learners & Beneficiaries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Core Responsibilities & Delivery Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the institutional responsibilities, coaching routines, or oversight provided by this persona..."
                  value={customResponsibilities}
                  onChange={(e) => setCustomResponsibilities(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!customRole.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Role to Framework</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Apply CTA */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">{stagedPersonas.length}</span> stakeholder roles selected
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyChanges}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
