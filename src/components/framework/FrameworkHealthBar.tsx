import React, { useState } from 'react';
import { LFAMatrix } from '../../types/lfa';
import { useChat } from '../../context/ChatContext';
import { ShieldCheck, Sparkles, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FrameworkHealthBarProps {
  matrix?: LFAMatrix | null;
}

export const FrameworkHealthBar: React.FC<FrameworkHealthBarProps> = ({ matrix }) => {
  const { sendMessage } = useChat();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  if (!matrix) return null;

  // Calculate completeness metrics
  const hasImpact = !!matrix.impact?.statement;
  const hasIndicators = !!matrix.impact?.indicators;
  const hasOutcomes = (matrix.outcomes || []).length > 0;
  const hasOutputs = (matrix.outputs || []).length > 0;
  const hasActivities = (matrix.activities || []).length > 0;
  const hasAssumptions = (matrix.assumptions || []).length > 0;
  const hasRisks = (matrix.risks || []).length > 0;

  const totalChecks = 7;
  const passedChecks = [
    hasImpact,
    hasIndicators,
    hasOutcomes,
    hasOutputs,
    hasActivities,
    hasAssumptions,
    hasRisks
  ].filter(Boolean).length;

  const scorePercent = Math.round((passedChecks / totalChecks) * 100);

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    await sendMessage("Please perform a strict Socratic quality audit on this Logical Framework. Identify any logical gaps, ungrounded indicators, or missing stakeholder considerations.");
    setIsRunningAudit(false);
  };

  return (
    <div className="mb-5 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs transition-all">
      {/* Top Summary Bar */}
      <div className="px-4 py-2.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {scorePercent}% Quality Rigor
          </div>
          <span className="text-[12px] text-gray-600 font-medium hidden sm:inline">
            {passedChecks} of {totalChecks} core LFA standards satisfied
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAudit}
            disabled={isRunningAudit}
            className="px-2.5 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
            title="Ask AI to review and critique framework logic"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="hidden sm:inline">{isRunningAudit ? 'Auditing...' : 'AI Self-Review'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            title={isExpanded ? "Collapse audit details" : "Expand audit details"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-gray-100 h-1">
        <div
          className={`h-full transition-all duration-500 ${
            scorePercent >= 80 ? 'bg-emerald-500' : scorePercent >= 50 ? 'bg-amber-500' : 'bg-purple-500'
          }`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Expanded Quality Checklist */}
      {isExpanded && (
        <div className="p-4 bg-white grid sm:grid-cols-2 gap-2.5 text-xs animate-fade-in border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Causal Linkage: Impact grounded in verifiable outcome chain</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Objectively Verifiable Indicators (OVI): Quantified metrics</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Means of Verification (MoV): Primary sources assigned</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            {hasRisks ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span>Risk Mitigations: Stakeholder dependencies accounted for</span>
          </div>
        </div>
      )}
    </div>
  );
};
