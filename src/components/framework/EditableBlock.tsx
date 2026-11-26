import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, Check, X, RotateCcw, ChevronLeft, ChevronRight, 
  Send, History, CornerDownLeft, Edit2
} from 'lucide-react';
import { DIRECTIONAL_PROMPT_PRESETS, generateBlockVariants } from '../../utils/blockRegeneration';

interface EditableBlockProps {
  id: string;
  blockType: 'outcome_statement' | 'outcome_indicator' | 'outcome_mov' | 'activity_description' | 'activity_metric' | 'output' | 'challenge' | 'impact';
  value: string;
  onChange: (newValue: string, isRestore?: boolean) => void;
  className?: string;
  textClassName?: string;
  multiline?: boolean;
  label?: string;
}

interface BlockHistoryItem {
  text: string;
  timestamp: number;
  source: 'edit' | 'regenerate';
  prompt?: string;
}

export const EditableBlock: React.FC<EditableBlockProps> = ({
  id,
  blockType,
  value,
  onChange,
  className = '',
  textClassName = '',
  multiline = false,
  label
}) => {
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Regeneration popup state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 420 });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Variants state (< 1 / 3 >)
  const [variants, setVariants] = useState<string[]>([]);
  const [variantIndex, setVariantIndex] = useState(0);

  // History state for Granular Undo / Version History
  const [history, setHistory] = useState<BlockHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    setEditDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Handle direct inline edit commit
  const commitEdit = () => {
    const trimmed = editDraft.trim();
    if (trimmed && trimmed !== value) {
      setHistory(prev => [
        { text: value, timestamp: Date.now(), source: 'edit' },
        ...prev
      ]);
      onChange(trimmed);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditDraft(value);
    setIsEditing(false);
  };

  // Trigger regeneration with optional custom prompt
  const handleRegenerate = (promptToUse?: string) => {
    const finalPrompt = promptToUse ?? customPrompt;
    setIsThinking(true);

    setTimeout(() => {
      const generated = generateBlockVariants(blockType, value, finalPrompt);
      setVariants(generated);
      setVariantIndex(0);
      setIsThinking(false);
    }, 450);
  };

  // Flip through variants (< 1 / 3 >)
  const handleNextVariant = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (variants.length === 0) return;
    setVariantIndex(prev => (prev + 1) % variants.length);
  };

  const handlePrevVariant = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (variants.length === 0) return;
    setVariantIndex(prev => (prev - 1 + variants.length) % variants.length);
  };

  // Apply selected variant
  const applyVariant = (textToApply: string) => {
    setHistory(prev => [
      { text: value, timestamp: Date.now(), source: 'regenerate', prompt: customPrompt || undefined },
      ...prev
    ]);
    onChange(textToApply);
    setIsRegenerating(false);
    setVariants([]);
    setCustomPrompt('');
  };

  // Undo / Restore from history
  const restoreVersion = (entry: BlockHistoryItem) => {
    setHistory(prev => [
      { text: value, timestamp: Date.now(), source: 'edit' },
      ...prev.filter(h => h.timestamp !== entry.timestamp)
    ]);
    onChange(entry.text, true);
    setIsHistoryOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative group/editable transition-all ${className}`}>
      
      {/* 1. Direct Inline Rich-Text Editing Mode */}
      {isEditing ? (
        <div className="bg-white border-2 border-purple-600 rounded-lg p-2 shadow-md relative z-30 animate-scale-in">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === 'Escape') {
                  cancelEdit();
                }
              }}
              rows={3}
              className="w-full text-xs text-gray-900 bg-transparent resize-none border-none outline-none font-sans leading-relaxed"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitEdit();
                } else if (e.key === 'Escape') {
                  cancelEdit();
                }
              }}
              className="w-full text-xs text-gray-900 bg-transparent border-none outline-none font-sans"
            />
          )}

          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-100 text-[10.5px]">
            <span className="text-gray-400 font-mono">
              Press {multiline ? '⌘+Enter' : 'Enter'} to save, Esc to cancel
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={cancelEdit}
                className="px-2 py-0.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={commitEdit}
                className="px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Normal View with Hover Regeneration (Pen Icon) & Edit Triggers */
        <div className="relative">
          
          {/* Text display with click-to-edit capability */}
          <div 
            onClick={() => setIsEditing(true)}
            className={`cursor-text rounded hover:bg-purple-50/50 transition-colors py-0.5 px-1 -mx-1 whitespace-pre-line group-hover/editable:outline group-hover/editable:outline-1 group-hover/editable:outline-purple-200 ${textClassName}`}
            title="Click to edit directly in-place"
          >
            {value}
          </div>

          {/* Hover Floating Action Bar: Regenerate Pen Icon + Edit Icon + History/Undo Button */}
          <div className="absolute -top-3 right-0 opacity-0 group-hover/editable:opacity-100 transition-opacity flex items-center gap-1 z-20 bg-white/95 backdrop-blur-xs border border-purple-200/90 rounded-full px-1.5 py-0.5 shadow-xs">
            
            {/* Direct Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 hover:bg-purple-50 rounded-full text-gray-500 hover:text-purple-700 transition-colors cursor-pointer"
              title="Edit directly in-place"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            {/* Regenerate Action (RotateCcw / Refresh Icon) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect && typeof window !== 'undefined') {
                  const popWidth = Math.min(430, window.innerWidth - 24);
                  const clampedLeft = Math.max(12, Math.min(rect.left, window.innerWidth - popWidth - 12));
                  const spaceBelow = window.innerHeight - rect.bottom;
                  const estHeight = 360;
                  const topPos = spaceBelow < estHeight && rect.top > estHeight
                    ? Math.max(12, rect.top - estHeight - 8)
                    : Math.min(rect.bottom + 8, window.innerHeight - estHeight - 12);
                  setPopoverPos({ top: topPos, left: clampedLeft, width: popWidth });
                }
                setIsRegenerating(prev => !prev);
                if (!variants.length) {
                  handleRegenerate();
                }
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
              title="Regenerate this item with AI suggestions"
            >
              <RotateCcw className="w-3 h-3 text-purple-600" />
              <span>Regenerate</span>
            </button>

            {/* Granular Undo / History Icon (if history exists) */}
            {history.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHistoryOpen(prev => !prev);
                }}
                className="p-1 hover:bg-purple-50 rounded-full text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
                title={`Restore previous version (${history.length} saved)`}
              >
                <History className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* 3. Regenerate & Custom Directional Prompt Floating Popover (Portaled so parent overflow-hidden never clips it) */}
      {isRegenerating && typeof document !== 'undefined' && createPortal(
        <div
          style={{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px`, width: `${popoverPos.width}px` }}
          className="fixed z-50 bg-white border border-purple-200/90 rounded-2xl shadow-2xl p-3.5 text-xs font-sans space-y-3 animate-fade-in max-h-[calc(100vh-24px)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-purple-950 font-semibold text-[12px]">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Regenerate {label || 'Item'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRegenerating(false)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alternative Variant Selector (< 1 / 3 >) */}
          {variants.length > 0 && (
            <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                  Alternative Variant
                </span>
                <div className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-full px-2 py-0.5 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevVariant}
                    className="p-0.5 hover:bg-purple-50 rounded-full text-purple-700 cursor-pointer"
                    title="Previous alternative"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[10.5px] font-semibold text-purple-900 whitespace-nowrap px-0.5">
                    {variantIndex + 1} / {variants.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextVariant}
                    className="p-0.5 hover:bg-purple-50 rounded-full text-purple-700 cursor-pointer"
                    title="Next alternative"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Variant Content preview */}
              <p className="text-[12.5px] text-gray-800 leading-relaxed font-serif bg-white p-2.5 rounded-lg border border-purple-100/90">
                {variants[variantIndex]}
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegenerating(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => applyVariant(variants[variantIndex])}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Check className="w-3 h-3" /> Apply Variant {variantIndex + 1}
                </button>
              </div>
            </div>
          )}

          {/* Custom Directional Prompt Box */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-semibold text-gray-500 tracking-wide">
              Directional Instruction / Prompt
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRegenerate();
                  }
                }}
                placeholder='e.g. "Make this more focused on primary grade phonics"'
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-[12px] text-gray-900 outline-none"
              />
              <button
                type="button"
                onClick={() => handleRegenerate()}
                disabled={isThinking}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11.5px] flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors shrink-0 shadow-2xs whitespace-nowrap"
              >
                {isThinking ? (
                  <span className="inline-block animate-spin">✦</span>
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>{variants.length > 0 ? "Re-prompt" : "Generate"}</span>
              </button>
            </div>

            {/* Quick Directional Prompt Presets */}
            <div className="pt-0.5">
              <span className="text-[10px] text-gray-400 block mb-1">Suggested Directions:</span>
              <div className="flex flex-wrap gap-1">
                {DIRECTIONAL_PROMPT_PRESETS.slice(0, 3).map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setCustomPrompt(prompt);
                      handleRegenerate(prompt);
                    }}
                    className="text-[10.5px] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-purple-50 text-gray-700 hover:text-purple-800 border border-gray-200 hover:border-purple-200 transition-colors cursor-pointer text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Granular Version History / Restore Popup */}
      {isHistoryOpen && history.length > 0 && (
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-xl shadow-lg relative z-30 animate-fade-in text-xs font-sans">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-[11.5px]">
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>Version History ({history.length} previous versions)</span>
            </div>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {history.map((entry, hIdx) => (
              <div 
                key={hIdx}
                className="p-2 rounded-lg bg-gray-50 border border-gray-200/80 hover:bg-purple-50/40 hover:border-purple-200 transition-colors flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-0.5">
                    <span className="uppercase font-semibold text-purple-700">
                      {entry.source === 'regenerate' ? '✦ AI Regenerated' : '✎ Direct Edit'}
                    </span>
                    <span>•</span>
                    <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    {entry.prompt && (
                      <span className="text-gray-500 italic truncate max-w-[120px]" title={entry.prompt}>
                        ("{entry.prompt}")
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-gray-800 font-serif leading-snug line-clamp-2">
                    {entry.text}
                  </p>
                </div>

                <button
                  onClick={() => restoreVersion(entry)}
                  className="px-2 py-1 rounded bg-white hover:bg-purple-600 hover:text-white border border-gray-200 hover:border-purple-600 text-gray-700 text-[10.5px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-2xs"
                  title="Restore this previous version"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Restore</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
