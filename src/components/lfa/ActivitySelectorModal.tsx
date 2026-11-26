import React, { useState, useEffect } from 'react';
import { 
  X, Check, Plus, Trash2, ClipboardCheck, Sparkles, Filter, 
  HelpCircle, CheckCircle2, ArrowRight, RotateCcw, Box, Layers
} from 'lucide-react';
import { LFAMatrix, LFAActivity } from '../../types/lfa';
import { useChat } from '../../context/ChatContext';

interface ActivitySelectorModalProps {
  matrix: LFAMatrix;
  isOpen: boolean;
  onClose: () => void;
}

interface CandidateActivity {
  id: string;
  category: 'Pedagogy & Training' | 'School Leadership' | 'Cluster & Block Mentoring' | 'District Oversight' | 'Community & Parents';
  description: string;
  metric: string;
  actor: string;
}

const RECOMMENDED_ACTIVITIES_LIBRARY: CandidateActivity[] = [
  // Pedagogy & Training
  {
    id: 'act-pedagogy-1',
    category: 'Pedagogy & Training',
    actor: 'Teachers',
    description: 'Train Grade 2-3 classroom teachers on running daily structured oral reading routines and redirecting word-by-word reading back to whole-phrase reading.',
    metric: '100% of target primary teachers trained & certified on oral reading routines'
  },
  {
    id: 'act-pedagogy-2',
    category: 'Pedagogy & Training',
    actor: 'Teachers',
    description: 'Distribute graded connected-text reader sets, leveled storycards, and passage-based meaning-check question kits to all Grade 2-3 classrooms.',
    metric: 'Classroom reading kits delivered and verified in 100% of participating schools'
  },
  {
    id: 'act-pedagogy-3',
    category: 'Pedagogy & Training',
    actor: 'Teachers',
    description: 'Coach Grade 2-3 teachers during existing literacy lessons on timing and recording 1-minute oral reading pace and word accuracy records.',
    metric: 'Student reading pace and accuracy records maintained by ≥90% of observed teachers'
  },
  {
    id: 'act-pedagogy-4',
    category: 'Pedagogy & Training',
    actor: 'Teachers',
    description: 'Establish leveled peer-reading corners in multi-grade classrooms with daily 15-minute paired reading routines.',
    metric: 'Peer reading corners functional and utilized at least 4 times per week'
  },

  // School Leadership
  {
    id: 'act-leadership-1',
    category: 'School Leadership',
    actor: 'School Leaders (HTs/HMs)',
    description: 'Coach school leaders to establish and protect a dedicated 45-minute daily literacy block in the official school timetable.',
    metric: 'Timetable literacy blocks verified in 100% of school walk-through inspections'
  },
  {
    id: 'act-leadership-2',
    category: 'School Leadership',
    actor: 'School Leaders (HTs/HMs)',
    description: 'Train school leaders to observe literacy periods bi-weekly and conduct termly student pace review meetings with teachers.',
    metric: '≥2 documented lesson observation feedback notes per teacher per term'
  },
  {
    id: 'act-leadership-3',
    category: 'School Leadership',
    actor: 'School Leaders (HTs/HMs)',
    description: 'School leaders convene monthly academic review circles to discuss fluency progress and allocate remedial assistance.',
    metric: 'Monthly school academic review minutes and remedial registers maintained'
  },

  // Cluster & Block Mentoring
  {
    id: 'act-cluster-1',
    category: 'Cluster & Block Mentoring',
    actor: 'Cluster Resource Persons (CRPs)',
    description: 'Conduct practice-based workshops for CRPs on modeling expressive, phrased reading and delivering actionable classroom feedback.',
    metric: '100% of cluster resource persons complete demonstration practicum'
  },
  {
    id: 'act-cluster-2',
    category: 'Cluster & Block Mentoring',
    actor: 'Cluster Resource Persons (CRPs)',
    description: 'Compile school-by-school reading pace counts to rank teachers and schedule prioritized bi-weekly cluster coaching visits.',
    metric: 'Cluster coaching visit roster updated monthly for high-need classrooms'
  },
  {
    id: 'act-cluster-3',
    category: 'Cluster & Block Mentoring',
    actor: 'Academic Resource Persons (ARPs)',
    description: 'Coach Academic Resource Persons to establish block-level pace and accuracy registers and provide diagnostic support to struggling schools.',
    metric: 'One block-level coaching priority list maintained and reviewed each month'
  },

  // District Oversight & DIET Mentoring
  {
    id: 'act-district-1',
    category: 'District Oversight',
    actor: 'District Institute of Education and Training (DIET)',
    description: 'DIET faculty convene monthly cluster review meetings to analyze district-wide oral reading fluency datasets and spot-check accuracy.',
    metric: 'Monthly district review registers & cluster follow-up action plans published'
  },
  {
    id: 'act-district-2',
    category: 'District Oversight',
    actor: 'District Institute of Education and Training (DIET)',
    description: 'Conduct quarterly district reading clinics to analyze low-performing schools and deploy targeted remediation toolkits.',
    metric: 'Quarterly district clinic attendance exceeds 90% across flagged clusters'
  },

  // Community & Parents
  {
    id: 'act-community-1',
    category: 'Community & Parents',
    actor: 'Parents & SMC Members',
    description: 'Organize termly SMC and parent workshops demonstrating simple 15-minute daily home reading support routines.',
    metric: 'Parent attendance above 75% across enrolled Grade 2-3 cohorts'
  },
  {
    id: 'act-community-2',
    category: 'Community & Parents',
    actor: 'Community Reading Volunteers',
    description: 'Deploy community library reading boxes managed by Shiksha Mitras and volunteers for weekend reading practice.',
    metric: 'Community reading corners active in 100% of target village centers'
  }
];

export const ActivitySelectorModal: React.FC<ActivitySelectorModalProps> = ({
  matrix,
  isOpen,
  onClose,
}) => {
  const { updateLFAMatrix } = useChat();

  // Staged activities list
  const [stagedActivities, setStagedActivities] = useState<LFAActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'current' | 'custom'>('library');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom activity form state
  const [customDescription, setCustomDescription] = useState('');
  const [customMetric, setCustomMetric] = useState('');

  // Sync staged activities with matrix on modal open
  useEffect(() => {
    if (isOpen && matrix?.activities) {
      setStagedActivities(JSON.parse(JSON.stringify(matrix.activities)));
    } else if (isOpen) {
      setStagedActivities([]);
    }
  }, [isOpen, matrix]);

  if (!isOpen) return null;

  // Helper to check if an activity is selected
  const isSelected = (desc: string) => {
    const norm = desc.toLowerCase().trim();
    return stagedActivities.some(a => a.description.toLowerCase().trim() === norm);
  };

  // Toggle selection from library
  const toggleActivity = (candidate: CandidateActivity) => {
    if (isSelected(candidate.description)) {
      setStagedActivities(prev => prev.filter(a => a.description.toLowerCase().trim() !== candidate.description.toLowerCase().trim()));
    } else {
      const newAct: LFAActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        description: candidate.description,
        metric: candidate.metric
      };
      setStagedActivities(prev => [...prev, newAct]);
    }
  };

  // Remove directly from current list
  const handleRemoveActivity = (index: number) => {
    setStagedActivities(prev => prev.filter((_, i) => i !== index));
  };

  // Add custom activity
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDescription.trim()) return;

    const newAct: LFAActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: customDescription.trim(),
      metric: customMetric.trim() || 'Tracked via session registers & observation logs'
    };

    setStagedActivities(prev => [...prev, newAct]);
    setCustomDescription('');
    setCustomMetric('');
    setActiveTab('current');
  };

  // Apply changes to matrix
  const handleApplyChanges = () => {
    const originalCount = matrix.activities?.length || 0;
    const newCount = stagedActivities.length;
    const diff = newCount - originalCount;
    
    let changeSummaryNote = `Updated activities & workstreams: now ${newCount} operational routines (${diff >= 0 ? `+${diff}` : diff}).`;
    if (diff > 0) {
      changeSummaryNote = `Added ${diff} new operational activity routine(s) to the workstream delivery plan.`;
    } else if (diff < 0) {
      changeSummaryNote = `Streamlined activities by removing ${Math.abs(diff)} routine(s).`;
    }

    updateLFAMatrix(
      {
        ...matrix,
        activities: stagedActivities,
      }
    );
    onClose();
  };

  // Filter library activities
  const filteredLibrary = RECOMMENDED_ACTIVITIES_LIBRARY.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.metric.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.actor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Pedagogy & Training':
        return 'bg-purple-100/80 text-purple-800 border-purple-200';
      case 'School Leadership':
        return 'bg-purple-100/80 text-purple-800 border-purple-200';
      case 'Cluster & Block Mentoring':
        return 'bg-amber-100/80 text-amber-800 border-amber-200';
      case 'District Oversight':
        return 'bg-rose-100/80 text-rose-800 border-rose-200';
      case 'Community & Parents':
        return 'bg-emerald-100/80 text-emerald-800 border-emerald-200';
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
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-gray-900 leading-tight">
                Manage Activities & Workstreams
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Select, add, or prune operational implementation routines and delivery steps.
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
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Recommended Library</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'current'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <span>Current in Framework</span>
              <span className="font-mono px-1.5 py-0.2 rounded-full text-[10.5px] bg-amber-100 text-amber-800 font-bold">
                {stagedActivities.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>Add Custom Routine</span>
            </button>
          </div>

          {/* Quick search input (visible in Library tab) */}
          {activeTab === 'library' && (
            <input
              type="text"
              placeholder="Search routines (e.g. Training, Timetable, DIET)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-gray-50/50"
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
                {['All', 'Pedagogy & Training', 'School Leadership', 'Cluster & Block Mentoring', 'District Oversight', 'Community & Parents'].map((cat) => (
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
                  const checked = isSelected(item.description);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleActivity(item)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        checked
                          ? 'border-amber-400 bg-amber-50/50 shadow-2xs ring-1 ring-amber-400/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}} // handled by parent div onClick
                        className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                          <span className="text-[10.5px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                            Actor: {item.actor}
                          </span>
                          {checked && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Included
                            </span>
                          )}
                        </div>

                        <p className="font-medium text-[12.5px] text-gray-900 leading-snug">
                          {item.description}
                        </p>

                        <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                          <span className="font-semibold text-gray-600 uppercase text-[9.5px]">Metric / Deliverable:</span>
                          <span className="italic">{item.metric}</span>
                        </div>
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
                  {stagedActivities.length} Activity Routine(s) in Current Framework Snapshot
                </span>
                <span className="text-[11px] text-gray-400">
                  Click the trash icon to remove any activity.
                </span>
              </div>

              {stagedActivities.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-xs">No activities defined yet.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="mt-2 text-xs text-amber-600 font-semibold hover:underline"
                  >
                    Select from Recommended Library
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {stagedActivities.map((act, idx) => (
                    <div 
                      key={act.id || idx}
                      className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs flex items-start justify-between gap-3 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-baseline gap-2 min-w-0 flex-1">
                        <span className="font-mono text-gray-400 text-xs font-semibold shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-[12.5px] leading-snug">
                            {act.description}
                          </p>
                          {act.metric && (
                            <p className="text-[11px] text-gray-500 mt-1 italic">
                              Metric: {act.metric}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(idx)}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer shrink-0 mt-0.5"
                        title="Remove activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM ACTIVITY FORM */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-4 max-w-lg mx-auto py-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Activity Description & Routine <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the operational action, training workshop, or routine to be carried out..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Verifiable Metric / Output Milestone
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% of target primary teachers trained & registers maintained"
                  value={customMetric}
                  onChange={(e) => setCustomMetric(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!customDescription.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Routine to Framework</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Apply CTA */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">{stagedActivities.length}</span> activities selected
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
