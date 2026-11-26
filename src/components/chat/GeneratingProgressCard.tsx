import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, ArrowRight, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface GeneratingProgressCardProps {
  runId?: string;
}

const REASONING_STEPS = [
  { label: 'Grounding education challenge statement & student target group', percent: 25 },
  { label: 'Synthesizing stakeholder roles & intermediate shifts in practice', percent: 50 },
  { label: 'Formulating dual verification indicators (Action & Classroom Effect)', percent: 75 },
  { label: 'Structuring delivery activities, verifiable outputs & inputs', percent: 90 },
  { label: 'Finalizing 4x4 Logical Framework Analysis (LFA) Matrix', percent: 100 },
];

export const GeneratingProgressCard: React.FC<GeneratingProgressCardProps> = () => {
  const { generatingProgress, notifyFrameworkReady } = useChat();
  const [isExpanded, setIsExpanded] = useState(true);

  // Self-advancing local progression if global generatingProgress is delayed
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    if (generatingProgress) {
      const idx = REASONING_STEPS.findIndex(s => s.percent >= generatingProgress.percent);
      if (idx !== -1) setCurrentStepIdx(idx);
      if (generatingProgress.percent === 100) {
        notifyFrameworkReady();
      }
      return;
    }

    // Auto-advance progress through atomic reasoning stages
    const interval = setInterval(() => {
      setCurrentStepIdx(prev => {
        if (prev < REASONING_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            notifyFrameworkReady();
          }, 600);
          return prev;
        }
      });
    }, 1600);

    return () => clearInterval(interval);
  }, [generatingProgress, notifyFrameworkReady]);

  const activeStep = REASONING_STEPS[currentStepIdx] || REASONING_STEPS[0];
  const percent = generatingProgress?.percent || activeStep.percent;
  const isComplete = percent >= 100;

  return (
    <div className="my-3.5 border border-purple-200/90 rounded-xl bg-white shadow-2xs text-gray-800 overflow-hidden max-w-xl animate-fade-in font-sans">
      
      {/* Header Bar */}
      <div className="p-3 bg-purple-50/50 border-b border-purple-100/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
              ✓
            </span>
          ) : (
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
          )}
          <div>
            <div className="text-[12.5px] font-semibold text-gray-900 leading-tight">
              {isComplete ? 'Framework Generation Complete' : 'Synthesizing Logical Framework (LFA)'}
            </div>
            <p className="text-[10.5px] text-gray-500 font-sans mt-0.5">
              {isComplete ? 'All 8 matrix dimensions aligned and validated' : activeStep.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded">
            {percent}%
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-purple-100/50 rounded transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse reasoning steps' : 'Expand reasoning steps'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Thin Progress Track */}
      <div className="w-full bg-purple-100/60 h-1 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${isComplete ? 'bg-emerald-600' : 'bg-purple-600'}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Collapsible Atomic Reasoning Trace (Claude Code style) */}
      {isExpanded && (
        <div className="p-3 bg-white space-y-2 text-xs">
          {REASONING_STEPS.map((s, idx) => {
            const stepDone = idx < currentStepIdx || isComplete;
            const stepActive = idx === currentStepIdx && !isComplete;

            return (
              <div key={idx} className="flex items-start gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0 ${
                  stepDone
                    ? 'bg-emerald-100 text-emerald-700'
                    : stepActive
                    ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300 animate-pulse'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {stepDone ? '✓' : idx + 1}
                </span>
                <span className={`text-[11.5px] leading-tight ${
                  stepDone ? 'text-gray-700' : stepActive ? 'font-medium text-purple-950' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed CTA: Direct Dual-Pane Anchor */}
      {isComplete && (
        <div className="p-2.5 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between text-[11px]">
          <span className="text-emerald-900 font-medium">Ready for review on the working canvas</span>
          <a
            href="#section-your-lfa"
            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <span>Inspect Table</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
