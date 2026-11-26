import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Plus, Download, Maximize2, Minimize2, 
  User, ArrowRight, CornerDownLeft, Sparkles, 
  FileText, CheckCircle2, Target, Users, Sprout, LayoutGrid, Activity
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExport?: () => void;
  onOpenProfile?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface PaletteItem {
  id: string;
  category: 'actions' | 'sections' | 'conversations';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenExport,
  onOpenProfile,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const { conversations, activeConversation, selectConversation, startNewChat } = useChat();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on open and reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Jump helper for LFA sections
  const jumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onClose();
  };

  // Build all searchable command items
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    // Quick Actions
    items.push({
      id: 'action-new-chat',
      category: 'actions',
      title: 'New Conversation',
      subtitle: 'Start a fresh program design session',
      icon: <Plus className="w-4 h-4 text-purple-600" />,
      action: () => {
        startNewChat();
        onClose();
      }
    });

    if (onOpenExport) {
      items.push({
        id: 'action-export',
        category: 'actions',
        title: 'Export / Download Deliverable',
        subtitle: 'Export current design as PDF, DOCX, or Excel',
        icon: <Download className="w-4 h-4 text-blue-600" />,
        action: () => {
          onClose();
          onOpenExport();
        }
      });
    }

    if (onToggleFullscreen) {
      items.push({
        id: 'action-fullscreen',
        category: 'actions',
        title: isFullscreen ? 'Exit Fullscreen Preview' : 'Expand Matrix Fullscreen',
        subtitle: 'Toggle full-width workspace view',
        icon: isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-600" /> : <Maximize2 className="w-4 h-4 text-emerald-600" />,
        action: () => {
          onToggleFullscreen();
          onClose();
        }
      });
    }

    if (onOpenProfile) {
      items.push({
        id: 'action-profile',
        category: 'actions',
        title: 'User Profile & Language Settings',
        subtitle: 'Adjust language, roles, and preferences',
        icon: <User className="w-4 h-4 text-amber-600" />,
        action: () => {
          onClose();
          onOpenProfile();
        }
      });
    }

    // Sections
    const sections = [
      { id: 'section-challenges', title: 'Jump to Challenges & Core Problem', subtitle: 'Problem diagnosis & root causes', icon: <Target className="w-4 h-4 text-red-500" /> },
      { id: 'section-impact', title: 'Jump to Impact Lab', subtitle: 'Long-term systemic goal & change vision', icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
      { id: 'section-interventions', title: 'Jump to Interventions & Scope', subtitle: 'Beneficiaries, geography & methodology', icon: <Sprout className="w-4 h-4 text-emerald-500" /> },
      { id: 'section-stakeholders', title: 'Jump to Stakeholders & Personas', subtitle: 'Target actors, roles & engagement loops', icon: <Users className="w-4 h-4 text-blue-500" /> },
      { id: 'section-outcomes', title: 'Jump to Observable Outcomes', subtitle: 'Measurable behavior & policy shifts', icon: <CheckCircle2 className="w-4 h-4 text-purple-600" /> },
      { id: 'section-activities', title: 'Jump to Activities & Routines', subtitle: 'Key intervention workstreams & actions', icon: <Activity className="w-4 h-4 text-indigo-500" /> },
      { id: 'section-matrix', title: 'Jump to Logical Framework Matrix', subtitle: 'Unified tabular view with indicators & workstreams', icon: <LayoutGrid className="w-4 h-4 text-purple-700" /> }
    ];

    sections.forEach(s => {
      items.push({
        id: `section-${s.id}`,
        category: 'sections',
        title: s.title,
        subtitle: s.subtitle,
        icon: s.icon,
        action: () => jumpToSection(s.id)
      });
    });

    // Conversations
    conversations.forEach(c => {
      items.push({
        id: `conv-${c.id}`,
        category: 'conversations',
        title: c.title,
        subtitle: c.id === activeConversation?.id ? 'Current Active Design' : `Last updated ${new Date(c.updatedAt).toLocaleDateString()}`,
        icon: <FileText className={`w-4 h-4 ${c.id === activeConversation?.id ? 'text-purple-600 font-semibold' : 'text-gray-400'}`} />,
        action: () => {
          selectConversation(c.id);
          onClose();
        }
      });
    });

    return items;
  }, [conversations, activeConversation, onOpenExport, onOpenProfile, isFullscreen, onToggleFullscreen]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase().trim();
    return allItems.filter(item => 
      item.title.toLowerCase().includes(q) || 
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  // Clamp selectedIndex when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector('[data-selected="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden flex flex-col max-h-[70vh] transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 gap-3 bg-white">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search designs, sections, actions..."
            className="flex-1 text-sm bg-transparent border-0 focus:outline-none text-gray-800 placeholder-gray-400 font-normal"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 rounded">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-gray-50 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-medium text-gray-600">No matching commands or designs found</p>
              <p className="text-xs text-gray-400 mt-0.5">Try searching for "outcomes", "export", or a design name</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    data-selected={isSelected}
                    type="button"
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-purple-50/90 text-purple-900 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-purple-100/70' : 'bg-gray-100/80'}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className={`text-[11px] truncate ${isSelected ? 'text-purple-600/80' : 'text-gray-400'}`}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] text-purple-600 font-medium bg-purple-100/60 px-2 py-0.5 rounded-md">
                          Select <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white border border-gray-200 rounded text-gray-600">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white border border-gray-200 rounded text-gray-600">↵</kbd> select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-white border border-gray-200 rounded text-gray-600">esc</kbd> close
            </span>
          </div>
          <span className="text-purple-600 font-medium">
            Program Design Companion
          </span>
        </div>
      </div>
    </div>
  );
};
