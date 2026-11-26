import React, { useState, useEffect } from 'react';
import { Settings, Layers, BookOpen, AlertTriangle, BarChart3, Plus, Check, RefreshCw } from 'lucide-react';
import { adminService, AdminConfig, RepositoryDoc, SelectionLog, KnowledgeGapLog } from '../../services/adminService';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'mappings' | 'repository' | 'gaps' | 'selection'>('workflows');
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [gaps, setGaps] = useState<KnowledgeGapLog[]>([]);
  const [selectionLogs, setSelectionLogs] = useState<SelectionLog[]>([]);
  const [repositoryDocs, setRepositoryDocs] = useState<RepositoryDoc[]>([]);

  const fetchAdminData = () => {
    setConfig(adminService.getAdminConfig());
    setGaps(adminService.getKnowledgeGaps());
    setSelectionLogs(adminService.getSelectionLogs());
    setRepositoryDocs(adminService.getRepositoryDocs());
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleFrameworkActive = (frameworkId: string) => {
    if (!config) return;
    const updatedFrameworks = config.frameworks.map((f) =>
      f.id === frameworkId ? { ...f, active: !f.active } : f
    );
    const updatedConfig = { ...config, frameworks: updatedFrameworks };
    setConfig(updatedConfig);
    adminService.updateAdminConfig(updatedConfig);
  };

  return (
    <div className="flex-1 bg-gray-50 text-gray-900 overflow-y-auto p-4 sm:p-8 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-purple-600 font-semibold text-[11px] uppercase tracking-wider mb-1">
            <Settings className="w-3.5 h-3.5" /> System Administration & Workflow Configurator
          </div>
          <h2 className="text-xl font-bold text-gray-900">Program Design Companion Configuration</h2>
          <p className="text-xs text-gray-500">Manage frameworks, RAG assets, use case mappings, and analyze knowledge gap logs.</p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3 py-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-300 text-xs font-medium text-gray-700 flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'workflows', label: 'Frameworks & Stages', icon: Layers },
          { id: 'mappings', label: 'Use Case Mappings', icon: Settings },
          { id: 'repository', label: 'RAG Knowledge Base', icon: BookOpen },
          { id: 'gaps', label: 'Knowledge Gap Logs', icon: AlertTriangle },
          { id: 'selection', label: 'Selection Logs', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Frameworks & Stages */}
      {activeTab === 'workflows' && config && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {config.frameworks.map((fw) => (
              <div key={fw.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{fw.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">v{fw.version}</span>
                  </div>

                  <button
                    onClick={() => handleToggleFrameworkActive(fw.id)}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      fw.active
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                        : 'bg-gray-100 border border-gray-200 text-gray-400'
                    }`}
                  >
                    {fw.active ? <Check className="w-3 h-3" /> : null}
                    {fw.active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <p className="text-xs text-gray-600">{fw.description}</p>

                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Configured Matrix Components ({fw.components.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {fw.components.map((comp: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-700">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Mappings */}
      {activeTab === 'mappings' && config && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-semibold text-gray-900">Use Case & Challenge Mappings</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-2.5">Use Case / Theme</th>
                  <th className="p-2.5">Mapped Framework</th>
                  <th className="p-2.5">Default Fallback</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {config.mappings.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2.5 font-medium text-gray-900">{m.useCase}</td>
                    <td className="p-2.5 text-purple-600 font-semibold">{m.frameworkId.toUpperCase()}</td>
                    <td className="p-2.5">{m.isDefault ? 'Yes (Primary Default)' : 'No'}</td>
                    <td className="p-2.5 text-emerald-600">Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: RAG Knowledge Base */}
      {activeTab === 'repository' && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {repositoryDocs.map((doc) => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900">{doc.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                    {doc.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{doc.summary}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {doc.tags.map((tag: string, i: number) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Knowledge Gap Logs */}
      {activeTab === 'gaps' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Knowledge Gap Logs ({gaps.length})</h3>
            <p className="text-xs text-gray-400">Captured unanswered queries for continuous repository enrichment</p>
          </div>

          {gaps.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No knowledge gaps recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {gaps.map((gap) => (
                <div key={gap.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-amber-800">
                    <span>Query: "{gap.query}"</span>
                    <span className="text-gray-400 font-normal">{new Date(gap.detectedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-500">Category: {gap.category}</div>
                  <div className="text-emerald-700 text-[11px]">Recommendation: {gap.recommendation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Framework Selection Logs */}
      {activeTab === 'selection' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-semibold text-gray-900">Framework Selection Audit Logs ({selectionLogs.length})</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">User Query / Challenge</th>
                  <th className="p-2.5">Detected Intent</th>
                  <th className="p-2.5">Selected Framework</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-2.5 text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2.5 font-medium text-gray-900 truncate max-w-xs">{log.query}</td>
                    <td className="p-2.5 text-purple-600 font-mono">{log.intentDetected}</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">{log.frameworkSelected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
