import React, { useState } from 'react';
import { Edit3, Download, RefreshCw, Layers, CheckCircle2, ShieldAlert, Users, Target, FileText } from 'lucide-react';
import { LFAMatrix } from '../../types/lfa';
import { SectionEditorModal } from './SectionEditorModal';
import { ExportModal } from './ExportModal';
import { useChat } from '../../context/ChatContext';

interface LFAMatrixViewProps {
  matrix: LFAMatrix;
}

export const LFAMatrixView: React.FC<LFAMatrixViewProps> = ({ matrix }) => {
  const { sendMessage } = useChat();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="my-4 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-slate-900 p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" /> {matrix.frameworkType || 'Logical Framework Analysis'}
          </div>
          <h3 className="text-lg font-bold text-white leading-snug">{matrix.goal}</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-brand-400" /> Edit
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>

          <button
            onClick={() => sendMessage("Regenerate the complete Logical Framework Matrix with refined indicators.")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Regenerate Framework"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="p-6 space-y-6 divide-y divide-slate-800/80">
        
        {/* 1. Impact Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" /> 1. Impact & Endline Goal
          </h4>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 grid sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Impact Statement</span>
              <p className="text-xs text-slate-200 leading-relaxed">{matrix.impact?.statement}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Impact Indicators</span>
              <p className="text-xs text-emerald-300 leading-relaxed font-medium">{matrix.impact?.indicators}</p>
            </div>
          </div>
        </div>

        {/* 2. Outcomes Section */}
        <div className="pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4" /> 2. Outcomes & Indicators
          </h4>
          <div className="space-y-3">
            {(matrix.outcomes || []).map((out, idx) => (
              <div key={out.id || idx} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-white mb-2">{out.statement}</p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-400 font-semibold">Indicator:</span>{' '}
                    <span className="text-slate-300">{out.indicator}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Means of Verification:</span>{' '}
                    <span className="text-slate-300">{out.meansOfVerification}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Outputs & Key Activities Section */}
        <div className="pt-6 grid sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" /> 3. Concrete Outputs
            </h4>
            <div className="space-y-2.5">
              {(matrix.outputs || []).map((op, idx) => (
                <div key={op.id || idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200">
                  {op.statement}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4" /> 4. Key Activities & Process Metrics
            </h4>
            <div className="space-y-2.5">
              {(matrix.activities || []).map((act, idx) => (
                <div key={act.id || idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1">
                  <div className="text-white font-medium">{act.description}</div>
                  <div className="text-[11px] text-amber-300 font-mono italic">{act.metric}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Personas, Risks & Assumptions */}
        <div className="pt-6 grid sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-brand-400" /> Personas
            </h5>
            <div className="space-y-2 text-xs">
              {(matrix.personas || []).map((p, idx) => (
                <div key={idx} className="border-b border-slate-800/60 pb-1.5 last:border-0">
                  <span className="font-semibold text-brand-300 block">{p.role}</span>
                  <span className="text-slate-400 text-[11px]">{p.responsibilities}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Risks & Mitigations
            </h5>
            <div className="space-y-2 text-xs">
              {(matrix.risks || []).map((r, idx) => (
                <div key={idx} className="text-slate-300">
                  <span className="text-rose-300 font-medium">Risk:</span> {r.risk}
                  <div className="text-[11px] text-slate-400 mt-0.5">Mitigation: {r.mitigation}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Assumptions & Resources
            </h5>
            <div className="text-xs text-slate-300 space-y-2">
              <div>
                <span className="text-slate-400 font-semibold">Assumptions:</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{(matrix.assumptions || []).join('; ')}</p>
              </div>
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 font-semibold">Resources Needed:</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{(matrix.resources || []).join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SectionEditorModal matrix={matrix} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
      <ExportModal matrix={matrix} isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};
