import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { LFAVersion } from '../../types/chat';
import { 
  History, RotateCcw, ChevronDown, Eye, ChevronLeft, ChevronRight, 
  Sparkles, MessageSquare, Edit3, GitCommit, Layers, X, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

interface VersionControlDropdownProps {
  className?: string;
  compact?: boolean;
}

export const VersionControlDropdown: React.FC<VersionControlDropdownProps> = ({ 
  className = '',
  compact = false 
}) => {
  const { 
    versions, 
    previewVersionId, 
    setPreviewVersionId, 
    previewVersion, 
    restoreVersion,
    showDiffAnnotations,
    setShowDiffAnnotations
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const activeVersions = versions || [];
  const latestVersion = activeVersions.length > 0 ? activeVersions[activeVersions.length - 1] : null;
  const isViewingPast = !!previewVersion && previewVersion.id !== latestVersion?.id;
  const displayedVerNumber = previewVersion 
    ? previewVersion.versionNumber 
    : (latestVersion ? latestVersion.versionNumber : 'v1.0');

  // Step back / forward across versions
  const currentPreviewIdx = previewVersion
    ? activeVersions.findIndex(v => v.id === previewVersion.id)
    : (activeVersions.length > 0 ? activeVersions.length - 1 : 0);

  const canGoOlder = currentPreviewIdx > 0;
  const canGoNewer = currentPreviewIdx < activeVersions.length - 1;

  const handleGoOlder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canGoOlder) {
      setPreviewVersionId(activeVersions[currentPreviewIdx - 1].id);
    }
  };

  const handleGoNewer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canGoNewer) {
      const nextVer = activeVersions[currentPreviewIdx + 1];
      if (currentPreviewIdx + 1 === activeVersions.length - 1) {
        // Returned to latest
        setPreviewVersionId(null);
      } else {
        setPreviewVersionId(nextVer.id);
      }
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai_synthesis':
        return <Sparkles className="w-3 h-3 text-purple-600" />;
      case 'chat_refinement':
        return <MessageSquare className="w-3 h-3 text-purple-600" />;
      case 'preview_edit':
        return <Edit3 className="w-3 h-3 text-amber-600" />;
      case 'restore':
        return <RotateCcw className="w-3 h-3 text-emerald-600" />;
      default:
        return <GitCommit className="w-3 h-3 text-gray-500" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ai_synthesis':
        return 'Initial Baseline';
      case 'chat_refinement':
        return 'Updated via Chat';
      case 'preview_edit':
        return 'Updated in Panel';
      case 'restore':
        return 'Restored';
      default:
        return 'Updated';
    }
  };

  // Compute structural delta (+added / -removed) with exact item descriptions compared to preceding version
  const computeVersionDelta = (curr: LFAVersion, prev?: LFAVersion) => {
    const addedItems: Array<{ kind: string; text: string }> = [];
    const removedItems: Array<{ kind: string; text: string }> = [];
    if (!prev) return { addedItems, removedItems, modified: false };

    const currM = curr.matrix;
    const prevM = prev.matrix;
    if (!currM || !prevM) return { addedItems, removedItems, modified: false };

    const diffArrays = (kind: string, prevArr: string[], currArr: string[]) => {
      const setPrev = new Set(prevArr.map(s => s.trim().toLowerCase()));
      const setCurr = new Set(currArr.map(s => s.trim().toLowerCase()));
      currArr.forEach(item => {
        if (item.trim() && !setPrev.has(item.trim().toLowerCase())) {
          addedItems.push({ kind, text: item.trim() });
        }
      });
      prevArr.forEach(item => {
        if (item.trim() && !setCurr.has(item.trim().toLowerCase())) {
          removedItems.push({ kind, text: item.trim() });
        }
      });
    };

    diffArrays('Stakeholder', (prevM.personas || []).map(p => p.role), (currM.personas || []).map(p => p.role));
    diffArrays('Outcome', (prevM.outcomes || []).map(o => o.statement), (currM.outcomes || []).map(o => o.statement));
    diffArrays('Activity', (prevM.activities || []).map(a => a.description), (currM.activities || []).map(a => a.description));
    diffArrays('Output', (prevM.outputs || []).map(o => o.statement), (currM.outputs || []).map(o => o.statement));

    const prevInds = (prevM.impact?.indicators || '').split('\n').map(s => s.trim()).filter(Boolean);
    const currInds = (currM.impact?.indicators || '').split('\n').map(s => s.trim()).filter(Boolean);
    diffArrays('Impact Indicator', prevInds, currInds);

    const modified =
      currM.challengeStatement !== prevM.challengeStatement ||
      currM.impact?.statement !== prevM.impact?.statement ||
      currM.goal !== prevM.goal;

    return { addedItems, removedItems, modified };
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      
      {/* Trigger Pill */}
      {isViewingPast ? (
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-md p-0.5 shadow-2xs animate-pulse-subtle">
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100/70 rounded transition-colors cursor-pointer"
            title="Previewing past version. Click to view history or step between versions"
          >
            <Eye className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="font-mono">{displayedVerNumber}</span>
            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1 py-0.2 rounded font-medium hidden sm:inline">
              Preview
            </span>
            <ChevronDown className="w-3 h-3 text-amber-600" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (previewVersion) {
                restoreVersion(previewVersion.id);
                setIsOpen(false);
              }
            }}
            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            title={`Restore ${displayedVerNumber} as the active framework`}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Restore</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewVersionId(null)}
            className="p-1 hover:bg-amber-200/60 text-amber-800 rounded transition-colors cursor-pointer"
            title="Exit preview and return to current version"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200/90 bg-white hover:bg-purple-50/60 hover:border-purple-300 text-gray-700 hover:text-purple-900 transition-all text-[11px] font-medium shadow-2xs cursor-pointer select-none group ${
            isOpen ? 'ring-2 ring-purple-500/20 border-purple-300 bg-purple-50/40' : ''
          }`}
          title="View framework version control history, compare changes, and restore past revisions"
        >
          <History className="w-3.5 h-3.5 text-purple-600 group-hover:rotate-[-20deg] transition-transform shrink-0" />
          <span className="font-mono font-bold text-gray-900 group-hover:text-purple-900">
            {displayedVerNumber}
          </span>
          {!compact && (
            <span className="text-gray-400 text-[10.5px] hidden sm:inline">
              ({activeVersions.length} {activeVersions.length === 1 ? 'version' : 'versions'})
            </span>
          )}
          <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-purple-600 transition-colors shrink-0" />
        </button>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3 animate-fade-in text-gray-900 text-left">
          
          {/* Header with Title and Stepper Controls */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-150">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-600" />
              <div>
                <h4 className="text-[12.5px] font-bold text-gray-900 leading-tight">
                  Version History
                </h4>
                <p className="text-[10px] text-gray-500">
                  Select to preview • Click restore to apply
                </p>
              </div>
            </div>

            {/* Stepper Buttons (Back & Forth) */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={handleGoOlder}
                disabled={!canGoOlder}
                className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 hover:text-purple-700 hover:bg-white rounded transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-0.5 cursor-pointer"
                title="Go to older version"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Older</span>
              </button>
              <button
                type="button"
                onClick={handleGoNewer}
                disabled={!canGoNewer}
                className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 hover:text-purple-700 hover:bg-white rounded transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-0.5 cursor-pointer"
                title="Go to newer version"
              >
                <span>Newer</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Visual Diff Annotation Toggle */}
          <div className="mb-2.5 px-2 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[11px] font-medium text-gray-700">
                Visual change diff annotations
              </span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span className="text-[10px] text-gray-500">
                {showDiffAnnotations ? 'On' : 'Off'}
              </span>
              <input
                type="checkbox"
                checked={showDiffAnnotations}
                onChange={(e) => setShowDiffAnnotations(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
              />
            </label>
          </div>

          {/* Version Timeline List */}
          <div className="max-h-80 overflow-y-auto pr-1 relative pl-4 space-y-2.5 before:content-[''] before:absolute before:left-[7px] before:top-3 before:bottom-3 before:w-[1.5px] before:bg-gray-200">
            {activeVersions.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500">
                Initial framework baseline active (v1.0).
              </div>
            ) : (
              [...activeVersions].reverse().map((ver, revIdx) => {
                const origIdx = activeVersions.length - 1 - revIdx;
                const prevVer = origIdx > 0 ? activeVersions[origIdx - 1] : undefined;
                const delta = computeVersionDelta(ver, prevVer);
                const isLatest = ver.id === latestVersion?.id;
                const isCurrentPreview = previewVersion ? ver.id === previewVersion.id : isLatest;
                const isRestore = ver.source === 'restore';
                const isBaseline = origIdx === 0;

                return (
                  <div
                    key={ver.id || revIdx}
                    onClick={() => {
                      if (isLatest) {
                        setPreviewVersionId(null);
                      } else {
                        setPreviewVersionId(ver.id);
                      }
                    }}
                    className={`relative p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      isCurrentPreview
                        ? 'bg-purple-50/70 border-purple-300 shadow-2xs ring-1 ring-purple-300'
                        : 'bg-gray-50/70 border-gray-200/80 hover:bg-white hover:border-gray-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Timeline Node Dot */}
                    <span
                      className={`absolute -left-[13px] top-3.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-2xs ${
                        isLatest
                          ? 'bg-emerald-500'
                          : isRestore
                          ? 'bg-amber-500'
                          : isBaseline
                          ? 'bg-slate-400'
                          : 'bg-purple-500'
                      }`}
                    />

                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-purple-900 text-[11px] bg-purple-100/90 px-1.5 py-0.5 rounded">
                          {ver.versionNumber}
                        </span>
                        {isLatest && (
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Current Active
                          </span>
                        )}
                        {!isBaseline && !isRestore && (
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            Updated
                          </span>
                        )}
                        {isRestore && (
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <RotateCcw className="w-2.5 h-2.5" />
                            Restored
                          </span>
                        )}
                        {previewVersion && ver.id === previewVersion.id && !isLatest && (
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> Previewing
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">{ver.timestamp}</span>
                    </div>

                    <p className="text-[11.5px] text-gray-800 leading-snug mb-1.5 font-medium">
                      {ver.title}
                    </p>

                    {/* Exact Added & Removed Items List */}
                    {!isBaseline && (delta.addedItems.length > 0 || delta.removedItems.length > 0 || delta.modified) && (
                      <div className="mb-2 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {delta.addedItems.length > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              +{delta.addedItems.length} added
                            </span>
                          )}
                          {delta.removedItems.length > 0 && (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                              -{delta.removedItems.length} removed
                            </span>
                          )}
                          {delta.addedItems.length === 0 && delta.removedItems.length === 0 && delta.modified && (
                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                              Text edited
                            </span>
                          )}
                        </div>

                        {(delta.addedItems.length > 0 || delta.removedItems.length > 0) && (
                          <div className="bg-white/80 border border-gray-200/80 rounded-md p-1.5 space-y-1 max-h-28 overflow-y-auto">
                            {delta.addedItems.map((item, aIdx) => (
                              <div key={`add-${aIdx}`} className="text-[10.5px] text-emerald-800 flex items-start gap-1 leading-snug">
                                <span className="font-bold text-emerald-600 shrink-0">+</span>
                                <span className="break-words">
                                  <span className="font-semibold">{item.kind}:</span> {item.text}
                                </span>
                              </div>
                            ))}
                            {delta.removedItems.map((item, rIdx) => (
                              <div key={`rem-${rIdx}`} className="text-[10.5px] text-rose-800 flex items-start gap-1 leading-snug">
                                <span className="font-bold text-rose-600 shrink-0">−</span>
                                <span className="break-words line-through decoration-rose-400/70">
                                  <span className="font-semibold">{item.kind}:</span> {item.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-150">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        {getSourceIcon(ver.source)}
                        <span>{getSourceLabel(ver.source)}</span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {!isCurrentPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              if (isLatest) {
                                setPreviewVersionId(null);
                              } else {
                                setPreviewVersionId(ver.id);
                              }
                            }}
                            className="text-[10.5px] text-gray-600 hover:text-purple-700 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            Preview
                          </button>
                        )}

                        {!isLatest && (
                          <button
                            type="button"
                            onClick={() => {
                              restoreVersion(ver.id);
                              setIsOpen(false);
                            }}
                            className="flex items-center gap-1 text-[10.5px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
                            title={`Restore framework back to ${ver.versionNumber}`}
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            Restore {ver.versionNumber}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
