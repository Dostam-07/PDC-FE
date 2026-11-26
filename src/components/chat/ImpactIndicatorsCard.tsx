import React, { useState } from 'react';
import { Target, Check, ArrowRight, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export interface ImpactIndicatorGroup {
  impactStatement: string;
  options: string[];
}

interface ImpactIndicatorsCardProps {
  impactHeader?: string;
  impactStatements: string[];
  options: string[];
  impactGroups?: ImpactIndicatorGroup[];
}

export const ImpactIndicatorsCard: React.FC<ImpactIndicatorsCardProps> = ({
  impactHeader = 'Intended Impact',
  impactStatements,
  options,
  impactGroups,
}) => {
  const { confirmImpactIndicators, skipImpactIndicators, sending } = useChat();

  const groups: ImpactIndicatorGroup[] =
    impactGroups && impactGroups.length > 0
      ? impactGroups
      : [
          {
            impactStatement: impactStatements.join(' '),
            options,
          },
        ];

  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const activeGroup = groups[currentGroupIdx] || groups[0];
  const hasMultipleGroups = groups.length > 1;
  const isLastGroup = currentGroupIdx >= groups.length - 1;

  const makeKey = (gIdx: number, oIdx: number) => `${gIdx}:${oIdx}`;

  const toggleOption = (gIdx: number, oIdx: number) => {
    const key = makeKey(gIdx, oIdx);
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const totalOptionsCount = groups.reduce((acc, g) => acc + g.options.length, 0);
  const currentGroupSelectedCount = activeGroup.options.filter((_, oIdx) =>
    selectedKeys.includes(makeKey(currentGroupIdx, oIdx))
  ).length;

  const handleDone = () => {
    if (selectedKeys.length === 0 || sending) return;
    const chosen: string[] = [];
    groups.forEach((g, gIdx) => {
      g.options.forEach((opt, oIdx) => {
        if (selectedKeys.includes(makeKey(gIdx, oIdx))) {
          chosen.push(opt);
        }
      });
    });
    confirmImpactIndicators(chosen);
  };

  const handleSkip = () => {
    if (sending) return;
    skipImpactIndicators();
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm overflow-hidden w-full animate-fade-in font-sans">
      {/* Top Header */}
      <div className="bg-slate-50/80 border-b border-gray-200/80 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[12.5px] font-semibold text-gray-900 tracking-tight block leading-tight">
              {impactHeader} & Indicators
            </span>
            <span className="text-[10.5px] text-gray-500">
              {groups.length} {groups.length === 1 ? 'intended impact' : 'intended impacts'} • Select indicators
            </span>
          </div>
        </div>
        <span className="text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0">
          {selectedKeys.length} / {totalOptionsCount} selected
        </span>
      </div>

      {/* Active Intended Impact Header with Inline Prev / Next Stepper */}
      <div className="px-4 pt-3 pb-2">
        <div className="pl-3 border-l-2 border-emerald-500 bg-emerald-50/40 rounded-r-xl py-2 px-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Intended Impact {hasMultipleGroups ? `${currentGroupIdx + 1} of ${groups.length}` : ''}
              </span>
              {currentGroupSelectedCount > 0 && (
                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  {currentGroupSelectedCount} chosen
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-gray-800 leading-snug font-serif">
              {activeGroup.impactStatement}
            </p>
          </div>

          {hasMultipleGroups && (
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              <button
                type="button"
                onClick={() => setCurrentGroupIdx((i) => Math.max(0, i - 1))}
                disabled={currentGroupIdx === 0}
                className="p-1 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous intended impact"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentGroupIdx((i) => Math.min(groups.length - 1, i + 1))}
                disabled={isLastGroup}
                className="px-2 py-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center gap-0.5 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next intended impact"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Indicators for the Active Impact Statement */}
      <div className="px-4 pb-3 space-y-1.5 max-h-[220px] overflow-y-auto">
        {activeGroup.options.map((opt, oIdx) => {
          const isSelected = selectedKeys.includes(makeKey(currentGroupIdx, oIdx));
          return (
            <button
              key={`${currentGroupIdx}-${oIdx}`}
              type="button"
              onClick={() => toggleOption(currentGroupIdx, oIdx)}
              className={`w-full text-left px-3 py-2 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer group ${
                isSelected
                  ? 'bg-purple-50/70 border-purple-400 ring-1 ring-purple-200/70 shadow-2xs'
                  : 'bg-white border-gray-200/80 hover:border-purple-300 hover:bg-gray-50/60'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10.5px] font-semibold shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-700'
                }`}
              >
                {isSelected ? <Check className="w-3 h-3 stroke-[2.6]" /> : oIdx + 1}
              </span>

              <span
                className={`text-[12px] leading-snug ${
                  isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'
                }`}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer CTAs: Skip & Next / Done */}
      <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-200/80 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSkip}
          disabled={sending}
          className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Skip</span>
        </button>

        <div className="flex items-center gap-2">
          {!isLastGroup && (
            <button
              type="button"
              onClick={() => setCurrentGroupIdx((i) => Math.min(groups.length - 1, i + 1))}
              className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[12px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Next Statement</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDone}
            disabled={selectedKeys.length === 0 || sending}
            className={`px-4 py-1.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
              selectedKeys.length > 0 && !sending
                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Done{selectedKeys.length > 0 ? ` (${selectedKeys.length})` : ''}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
