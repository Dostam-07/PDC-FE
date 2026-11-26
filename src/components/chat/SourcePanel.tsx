import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Globe, GraduationCap, Building2, FileText, Check } from 'lucide-react';
import { SourceCitation, TransparencyMetadata } from '../../types/chat';

interface SourcePanelProps {
  sources: SourceCitation[];
  transparency?: TransparencyMetadata;
  selectedCitationNum?: number | null;
  onSelectCitationNum?: (num: number | null) => void;
  onClose: () => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  sources,
  transparency,
  selectedCitationNum,
  onSelectCitationNum,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredSources = sources.filter(src => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        src.name.toLowerCase().includes(q) ||
        src.snippet.toLowerCase().includes(q) ||
        src.domain.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'Websites': return <Globe className="w-3.5 h-3.5 text-sky-600" />;
      case 'Research Papers': return <GraduationCap className="w-3.5 h-3.5 text-purple-600" />;
      case 'Government Documents': return <Building2 className="w-3.5 h-3.5 text-amber-600" />;
      case 'PDFs': return <FileText className="w-3.5 h-3.5 text-rose-600" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Click-outside Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside 
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white border-l border-gray-200 text-gray-900 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Grounded Sources and Citations"
      >
        {/* Drawer Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-gray-900 leading-tight">Grounded Sources & Citations</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {filteredSources.length} of {sources.length} sources consulted
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Close panel (Esc)"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transparency / Grounding Stats Strip */}
        {transparency && (
          <div className="p-3 bg-gray-50/90 border-b border-gray-100 grid grid-cols-3 gap-2 text-center text-xs shrink-0">
            <div className="bg-white border border-gray-200/80 rounded-lg p-2 shadow-2xs">
              <span className="text-[10px] text-gray-400 block font-medium">Consulted</span>
              <span className="font-semibold text-purple-700 text-xs">{transparency.totalConsulted || sources.length} Sources</span>
            </div>
            <div className="bg-white border border-gray-200/80 rounded-lg p-2 shadow-2xs">
              <span className="text-[10px] text-gray-400 block font-medium">AI Confidence</span>
              <span className="font-semibold text-emerald-700 text-xs">{transparency.confidenceLevel}%</span>
            </div>
            <div className="bg-white border border-gray-200/80 rounded-lg p-2 shadow-2xs">
              <span className="text-[10px] text-gray-400 block font-medium">Repository</span>
              <span className="font-semibold text-gray-700 text-[10px] truncate block" title={transparency.retrievedFrom}>
                {transparency.retrievedFrom}
              </span>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100 bg-white shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search within source passages & guidelines..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafb]">
          {filteredSources.length > 0 ? (
            filteredSources.map((src) => {
              const isSelected = selectedCitationNum === src.citationNum;
              return (
                <div
                  key={src.citationNum}
                  onClick={() => onSelectCitationNum && onSelectCitationNum(src.citationNum)}
                  className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-200 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                      [{src.citationNum}]
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      {getSourceIcon(src.type)} {src.type}
                    </span>
                  </div>

                  <div className="font-semibold text-gray-900 text-[12.5px] leading-snug">{src.name}</div>
                  <div className="text-[11px] text-purple-600 truncate mt-0.5 font-mono">{src.domain}</div>

                  {src.highlightedPassage && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-950 font-serif text-[11px] leading-relaxed italic">
                      "{src.highlightedPassage}"
                    </div>
                  )}

                  <p className="text-gray-600 text-[11.5px] mt-2 leading-relaxed">{src.snippet}</p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-medium text-gray-600">No sources matching "{searchQuery}"</p>
              <p className="text-[11px] text-gray-400 mt-1">Try searching for state, policy, or FLN terms</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
