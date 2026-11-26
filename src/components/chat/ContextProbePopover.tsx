import React from 'react';
import { MapPin, X } from 'lucide-react';
import { ContextProbeResult } from '../../utils/contextProbing';

interface ContextProbePopoverProps {
  probeResult: ContextProbeResult;
  onSelectFacet: (statement: string) => void;
  onAppendChip: (chipText: string) => void;
  onDismiss: () => void;
}

/**
 * Claude-Style Minimalist Floating State Bar
 * Compact, single-line, discreet floating pill above the input.
 * Does not block chat or take up screen space.
 */
export const ContextProbePopover: React.FC<ContextProbePopoverProps> = ({
  onAppendChip,
  onDismiss,
}) => {
  const states = ['Punjab', 'Rajasthan', 'Bihar', 'Uttar Pradesh', 'Maharashtra', 'Karnataka'];

  return (
    <div className="absolute bottom-full left-0 mb-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-xl shadow-md z-20 animate-fade-in text-xs font-sans max-w-full flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-gray-500 font-medium shrink-0">
        <MapPin className="w-3.5 h-3.5 text-purple-600" />
        <span className="text-[11.5px] text-gray-700 font-medium">Add State:</span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
        {states.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => onAppendChip(`in ${st}`)}
            className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-transparent text-gray-700 text-[11px] font-medium transition-all cursor-pointer shrink-0 active:scale-95 whitespace-nowrap"
          >
            + {st}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors ml-auto shrink-0 cursor-pointer"
        title="Dismiss suggestion"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
