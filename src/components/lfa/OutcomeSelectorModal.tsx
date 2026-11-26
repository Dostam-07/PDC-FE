import React, { useState, useEffect } from 'react';
import { 
  X, Check, Plus, Trash2, Landmark, Sparkles, Filter, Users, 
  HelpCircle, CheckCircle2, ArrowRight, RotateCcw
} from 'lucide-react';
import { LFAMatrix, LFAOutcome } from '../../types/lfa';
import { useChat } from '../../context/ChatContext';

interface OutcomeSelectorModalProps {
  matrix: LFAMatrix;
  isOpen: boolean;
  onClose: () => void;
}

interface CandidateOutcome {
  id: string;
  stakeholder: string;
  statement: string;
  indicator: string;
  meansOfVerification: string;
  category: 'Pedagogy' | 'Leadership' | 'System Mentoring' | 'Student Learning' | 'Community';
}

const RECOMMENDED_OUTCOMES_LIBRARY: CandidateOutcome[] = [
  // DIET Mentoring
  {
    id: 'rec-diet-1',
    stakeholder: 'District Institute of Education and Training (DIET)',
    category: 'System Mentoring',
    statement: 'DIET faculty conduct monthly pedagogical reviews of cluster reading data and mentor CRPs on observation feedback routines.',
    indicator: '100% of DIET academic mentors complete monthly cluster data reviews and spot-check visits.',
    meansOfVerification: 'District review registers & monitoring portal dashboards.'
  },
  {
    id: 'rec-diet-2',
    stakeholder: 'District Institute of Education and Training (DIET)',
    category: 'System Mentoring',
    statement: 'DIET mentors establish quarterly district reading clinics to analyze low-performing schools and deploy targeted remediation.',
    indicator: 'Quarterly district reading clinic attendance exceeds 90% across flagged clusters.',
    meansOfVerification: 'DIET reading clinic records & remedial action plans.'
  },

  // Teachers
  {
    id: 'rec-teacher-1',
    stakeholder: 'Grade 2-3 Primary Teachers',
    category: 'Pedagogy',
    statement: 'Teachers run a regular oral reading routine with Grade 2-3 students during existing class time, using the same steps each session.',
    indicator: 'Share of sampled Grade 2-3 teachers observed on repeated visits whose oral reading sessions use consistent routine steps.',
    meansOfVerification: 'Cluster resource monitoring records & monthly spot-checks.'
  },
  {
    id: 'rec-teacher-2',
    stakeholder: 'Grade 2-3 Primary Teachers',
    category: 'Pedagogy',
    statement: 'Teachers record each Grade 2-3 student\'s oral reading rate and errors at least once a term and group students for leveled practice.',
    indicator: 'Share of teachers observed whose practice groups are formed from recorded reading rate and error assessments.',
    meansOfVerification: 'Classroom reading registers and term assessment sheets.'
  },
  {
    id: 'rec-teacher-3',
    stakeholder: 'Grade 2-3 Primary Teachers',
    category: 'Pedagogy',
    statement: 'Teachers utilize audio-assisted peer reading corners to support emerging readers in multi-grade classrooms.',
    indicator: '≥80% of classrooms have functional reading corners utilized at least 3 times per week.',
    meansOfVerification: 'School walk-through logs & peer reading cards.'
  },

  // School Leaders
  {
    id: 'rec-leader-1',
    stakeholder: 'School Leaders (HTs/HMs)',
    category: 'Leadership',
    statement: 'School leaders keep a fixed oral reading slot for Grade 2-3 classes in the school timetable and protect it when other demands arise.',
    indicator: 'Number of School Leaders across target schools whose timetable holds a fixed reading slot that was kept across observed weeks.',
    meansOfVerification: 'School timetable logs & classroom observation visits.'
  },
  {
    id: 'rec-leader-2',
    stakeholder: 'School Leaders (HTs/HMs)',
    category: 'Leadership',
    statement: 'School leaders review Grade 2-3 oral reading logs weekly and conduct bi-weekly classroom support walk-throughs with teachers.',
    indicator: 'Share of school leaders whose dated walk-through logs show bi-weekly observations with specific teacher feedback.',
    meansOfVerification: 'Headmaster supervisory registers & signed teacher observation sheets.'
  },

  // Students (Beneficiaries)
  {
    id: 'rec-student-1',
    stakeholder: 'Grade 2-3 Students',
    category: 'Student Learning',
    statement: 'Grade 2-3 students read age-appropriate connected Hindi text aloud at 45 or more words per minute with comprehension.',
    indicator: '70% of enrolled Grade 2-3 students achieve the benchmark fluency rate of 45+ words per minute.',
    meansOfVerification: 'Term-end oral reading fluency assessments & state FLN survey data.'
  },
  {
    id: 'rec-student-2',
    stakeholder: 'Grade 2-3 Students',
    category: 'Student Learning',
    statement: 'Students recognize sight words automatically and observe punctuation pauses during oral reading routines.',
    indicator: 'Share of students demonstrating expressive reading fluency and correct phrasing in classroom spot-checks.',
    meansOfVerification: 'Teacher formative assessment checklists.'
  },

  // Parents & Community
  {
    id: 'rec-parent-1',
    stakeholder: 'Parents & SMC Members',
    category: 'Community',
    statement: 'Parents and SMC members support 15-minute daily home reading habits and participate in termly reading progress meetings.',
    indicator: '70% of sampled parents verify daily home reading support on monthly check-ins.',
    meansOfVerification: 'Parent signature cards & SMC meeting minutes.'
  }
];

export const OutcomeSelectorModal: React.FC<OutcomeSelectorModalProps> = ({
  matrix,
  isOpen,
  onClose,
}) => {
  const { updateLFAMatrix } = useChat();

  // Staged outcomes list
  const [stagedOutcomes, setStagedOutcomes] = useState<LFAOutcome[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'library' | 'custom'>('library');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom outcome form state
  const [customStakeholder, setCustomStakeholder] = useState('');
  const [customStatement, setCustomStatement] = useState('');
  const [customIndicator, setCustomIndicator] = useState('');
  const [customMoV, setCustomMoV] = useState('');

  // Sync staged outcomes with matrix on modal open
  useEffect(() => {
    if (isOpen && matrix?.outcomes) {
      setStagedOutcomes(JSON.parse(JSON.stringify(matrix.outcomes)));
      if (matrix.personas && matrix.personas.length > 0) {
        setCustomStakeholder(matrix.personas[0].role);
      }
    }
  }, [isOpen, matrix]);

  if (!isOpen) return null;

  // Toggle selection of an outcome (add if not present, remove if present)
  const isSelected = (statement: string) => {
    return stagedOutcomes.some(o => 
      o.statement.toLowerCase().trim() === statement.toLowerCase().trim()
    );
  };

  const toggleOutcome = (cand: { statement: string; indicator: string; meansOfVerification: string; id?: string }) => {
    if (isSelected(cand.statement)) {
      setStagedOutcomes(prev => prev.filter(o => 
        o.statement.toLowerCase().trim() !== cand.statement.toLowerCase().trim()
      ));
    } else {
      const newOutcome: LFAOutcome = {
        id: cand.id || `out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        statement: cand.statement,
        indicator: cand.indicator,
        meansOfVerification: cand.meansOfVerification,
      };
      setStagedOutcomes(prev => [...prev, newOutcome]);
    }
  };

  const handleAddCustomOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStatement.trim()) return;

    const newOutcome: LFAOutcome = {
      id: `out-cust-${Date.now()}`,
      statement: customStatement.trim(),
      indicator: customIndicator.trim() || 'Demonstrated practice adherence in ≥80% of observed cohort schools.',
      meansOfVerification: customMoV.trim() || 'Monitoring observation registers and monthly spot-checks.',
    };

    setStagedOutcomes(prev => [...prev, newOutcome]);
    setCustomStatement('');
    setCustomIndicator('');
    setCustomMoV('');
    setActiveTab('current');
  };

  const handleApplyChanges = () => {
    const originalCount = matrix.outcomes?.length || 0;
    const newCount = stagedOutcomes.length;
    const diff = newCount - originalCount;
    
    let changeSummaryNote = `Updated framework outcomes: now ${newCount} verifiable outcomes (${diff >= 0 ? `+${diff}` : diff}).`;
    if (diff > 0) {
      changeSummaryNote = `Added ${diff} new outcome(s) with verified indicators from the Outcome Manager.`;
    } else if (diff < 0) {
      changeSummaryNote = `Pruned ${Math.abs(diff)} outcome(s) to streamline the causal chain.`;
    }

    updateLFAMatrix(
      {
        ...matrix,
        outcomes: stagedOutcomes,
      }
    );
    onClose();
  };

  // Filter library outcomes
  const filteredLibrary = RECOMMENDED_OUTCOMES_LIBRARY.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = 
      item.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stakeholder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.indicator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-4 animate-fade-in font-sans">
      <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#fbfbfc]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-gray-900 leading-tight">
                Manage Outcomes (Shifts in Practice)
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Select institutional outcomes grounded in your active stakeholders or define custom ones.
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
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Recommended Library</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'current'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <span>Current in Framework</span>
              <span className="font-mono px-1.5 py-0.2 rounded-full text-[10.5px] bg-purple-100 text-purple-800 font-bold">
                {stagedOutcomes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>Add Custom Outcome</span>
            </button>
          </div>

          {activeTab === 'library' && (
            <input
              type="text"
              placeholder="Search outcomes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 w-36 sm:w-48"
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
                {['All', 'System Mentoring', 'Pedagogy', 'Leadership', 'Student Learning', 'Community'].map((cat) => (
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
              <div className="space-y-2.5">
                {filteredLibrary.map((item) => {
                  const checked = isSelected(item.statement);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleOutcome(item)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        checked
                          ? 'border-purple-400 bg-purple-50/50 shadow-2xs ring-1 ring-purple-400/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}} // handled by parent div onClick
                        className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded-md">
                            {item.stakeholder}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                            {item.category}
                          </span>
                          {checked && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Included
                            </span>
                          )}
                        </div>
                        <p className="font-serif text-[13.5px] text-gray-900 leading-snug font-normal">
                          {item.statement}
                        </p>
                        <div className="mt-1.5 text-[11.5px] text-gray-500 space-y-0.5">
                          <p><strong className="text-gray-700">Indicator:</strong> {item.indicator}</p>
                          <p><strong className="text-gray-700">MoV:</strong> {item.meansOfVerification}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CURRENT OUTCOMES IN FRAMEWORK */}
          {activeTab === 'current' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 text-xs text-gray-500">
                <span>Uncheck any outcome to remove it from the final matrix:</span>
                <span className="font-semibold text-gray-800">{stagedOutcomes.length} Outcomes Selected</span>
              </div>

              {stagedOutcomes.length === 0 ? (
                <div className="p-8 text-center text-gray-400 border border-dashed rounded-xl">
                  <Landmark className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">No outcomes currently in framework.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="mt-2 text-xs text-purple-600 font-semibold hover:underline"
                  >
                    Select from library →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {stagedOutcomes.map((out, idx) => (
                    <div
                      key={out.id || idx}
                      className="p-3 bg-white border border-gray-200/90 rounded-xl shadow-2xs hover:border-gray-300 flex items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {
                          setStagedOutcomes(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer shrink-0"
                        title="Uncheck to remove this outcome"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-mono font-bold text-purple-600">
                            Outcome {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setStagedOutcomes(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors"
                            title="Remove outcome"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="font-medium text-[13px] text-gray-900 leading-snug">
                          {out.statement}
                        </p>
                        {out.indicator && (
                          <p className="text-[11px] text-gray-500 mt-1">
                            <span className="font-semibold text-gray-600">Indicator:</span> {out.indicator}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM OUTCOME BUILDER */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustomOutcome} className="space-y-4 max-w-xl mx-auto">
              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p>
                  Outcomes describe observable shifts in stakeholder capability, routine, or behavior that lead directly to the student impact.
                </p>
              </div>

              {matrix?.personas && matrix.personas.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Target Stakeholder
                  </label>
                  <select
                    value={customStakeholder}
                    onChange={(e) => setCustomStakeholder(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  >
                    {matrix.personas.map((p, idx) => (
                      <option key={idx} value={p.role}>{p.role}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Outcome Statement (What change happens?) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={customStatement}
                  onChange={(e) => setCustomStatement(e.target.value)}
                  placeholder="e.g., Teachers run a fixed daily oral reading routine and log words per minute weekly..."
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Verifiable Indicator (How is it measured?)
                </label>
                <input
                  type="text"
                  value={customIndicator}
                  onChange={(e) => setCustomIndicator(e.target.value)}
                  placeholder="e.g., % of sampled classrooms observed running reading routine with consistent fidelity."
                  className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Means of Verification (Source of proof)
                </label>
                <input
                  type="text"
                  value={customMoV}
                  onChange={(e) => setCustomMoV(e.target.value)}
                  placeholder="e.g., Cluster spot-check registers & quarterly portal uploads."
                  className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!customStatement.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Stage Custom Outcome</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 border-t border-gray-100 bg-[#fbfbfc] flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{stagedOutcomes.length}</span> outcomes selected
            {stagedOutcomes.length !== (matrix.outcomes?.length || 0) && (
              <span className="ml-1 text-purple-600 font-medium">
                ({stagedOutcomes.length - (matrix.outcomes?.length || 0) > 0 ? `+${stagedOutcomes.length - (matrix.outcomes?.length || 0)}` : stagedOutcomes.length - (matrix.outcomes?.length || 0)} change)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyChanges}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
