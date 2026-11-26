import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, RotateCcw, Pencil, Check, X, Search, FileText, 
  CheckCircle2, Sparkles, FolderOpen, PanelLeftClose, Clock, Languages, LogOut, ChevronsUpDown, User
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../utils/i18n';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface SidebarProps {
  isOpen: boolean;
  width?: number;
  onClose: () => void;
  onToggleOpen?: () => void;
  onOpenProfile: () => void;
  onOpenSearch?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  width = 240, 
  onClose, 
  onToggleOpen,
  onOpenProfile,
  onOpenSearch
}) => {
  const { 
    conversations, 
    activeConversation, 
    selectConversation, 
    startNewChat, 
    deleteConversation, 
    renameConversation, 
    resetAllExamples 
  } = useChat();
  const { user, updateProfile, logout } = useAuth();
  const currentLang = (user?.language || 'English') as SupportedLanguage;
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleSelectConv = (id: string) => {
    selectConversation(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleStartNew = () => {
    startNewChat();
    setSearchQuery('');
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    if (editingId && editTitle.trim()) {
      renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  // Filter conversations in real-time by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter(c => 
      c.title.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Collapsed Slim Navigation Rail (Desktop when isOpen is false) */}
      {!isOpen && (
        <aside className="hidden lg:flex w-14 shrink-0 bg-white border-r border-gray-200/90 flex-col items-center justify-between py-3 select-none z-30 transition-all duration-200">
          
          {/* Top Zone: Action Icons (New Chat, Search, Recents) */}
          <div className="flex flex-col items-center gap-2.5 w-full pt-1">
            {/* Quick New Conversation (+) Button */}
            <button
              type="button"
              onClick={handleStartNew}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-700 bg-purple-50 hover:bg-purple-100/80 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              title="New Conversation"
            >
              <Plus className="w-4 h-4 stroke-[2.4]" />
            </button>

            {/* Quick Search Button (Opens Command Palette / Modal Search) */}
            <button
              type="button"
              onClick={onOpenSearch || onToggleOpen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer active:scale-95 group relative"
              title="Search & Commands (Ctrl+K)"
            >
              <Search className="w-4 h-4 stroke-[1.8]" />
            </button>

            {/* Quick Recents / History Icon */}
            <button
              type="button"
              onClick={onToggleOpen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer relative active:scale-95"
              title={`Recents (${conversations.length} designs)`}
            >
              <Clock className="w-4 h-4 stroke-[1.8]" />
              {conversations.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 absolute top-2 right-2" />
              )}
            </button>
          </div>

          {/* Bottom Zone: Language Selector Popover & User Avatar */}
          <div className="flex flex-col items-center gap-3 w-full relative">
            
            {/* Collapsed Language Selector Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer active:scale-95"
                title={`Language: ${currentLang}`}
              >
                <Languages className="w-4 h-4 stroke-[1.8]" />
              </button>

              {/* Language Selection Popup when collapsed */}
              {isLangMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div className="absolute bottom-0 left-full ml-2 z-50 bg-white border border-gray-200/90 rounded-2xl shadow-xl ring-1 ring-black/5 p-1.5 w-52 animate-fade-in text-xs">
                    {/* Clean Header */}
                    <div className="px-2.5 py-1.5 border-b border-gray-100 flex items-center justify-between text-gray-400 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Select Language</span>
                      <Languages className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    {/* Scrollable Language List */}
                    <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5">
                      {Object.entries(SUPPORTED_LANGUAGES).map(([key, def]) => {
                        const isSelected = key === currentLang;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              updateProfile({ language: key });
                              setIsLangMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-purple-50 text-purple-900 font-semibold border border-purple-200/70 shadow-2xs'
                                : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-purple-600 stroke-[2.5] shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="text-[13px] tracking-tight truncate">
                                {def.nativeLabel}
                              </span>
                            </div>
                            <span
                              className={`text-[10.5px] px-1.5 py-0.5 rounded-md shrink-0 ml-2 ${
                                isSelected
                                  ? 'bg-purple-100/80 text-purple-700 font-medium'
                                  : 'text-gray-400 group-hover:text-gray-600'
                              }`}
                            >
                              {def.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Avatar Circle */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center shadow-2xs transition-transform active:scale-95 cursor-pointer"
              title={`${user?.name || 'User'} profile`}
            >
              <User className="w-4 h-4 text-white" />
            </button>
          </div>

        </aside>
      )}

      {/* Full Expanded Sidebar */}
      <aside
        style={{
          width: typeof window !== 'undefined' && window.innerWidth >= 1024
            ? (isOpen ? `${width}px` : '0px')
            : undefined
        }}
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-white flex flex-col shrink-0 transition-all duration-200 ease-in-out select-none overflow-hidden ${
          isOpen
            ? 'translate-x-0 w-64 lg:w-auto border-r border-gray-200/90 opacity-100'
            : 'hidden w-0 border-r-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Header: Mobile Close button only if on mobile, clean flush top for desktop */}
        <div className="lg:hidden flex items-center justify-end px-3 pt-2">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-md transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action Button: "+ New Conversation" & Search */}
        <div className="p-3 pt-3 lg:pt-3.5 pb-2 space-y-2">
          <button
            onClick={handleStartNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[13.5px] font-semibold transition-all shadow-xs hover:shadow active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Conversation</span>
          </button>

          {/* Search / Filter Input - Always accessible */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-12 py-1.5 text-xs bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200/90 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
            />
            {onOpenSearch && !searchQuery && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="absolute right-2 px-1.5 py-0.5 text-[9.5px] font-mono text-gray-400 hover:text-purple-700 bg-gray-100 hover:bg-purple-50 rounded border border-gray-200/80 transition-colors cursor-pointer"
                title="Open Command Palette (Ctrl+K)"
              >
                Ctrl K
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Recents Section Header */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
            Recents
          </span>
        </div>

        {/* Content list or empty state */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 space-y-1.5 animate-fade-in">
              <FolderOpen className="w-6 h-6 mx-auto text-gray-300 stroke-[1.5]" />
              <p className="font-medium text-gray-500">
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </p>
              <p className="text-[11px] text-gray-400 leading-normal">
                {searchQuery ? `Try clearing "${searchQuery}"` : 'Click "+ New Conversation" to start.'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              const isEditing = editingId === conv.id;
              
              const formatCleanTitle = (raw: string) => {
                let t = raw.replace(/^[\p{Emoji}\s\u200B-\u200D\uFE0F]+/u, '').trim();
                t = t.replace(/[\u2026\.]+|\.\.\./g, '').trim();
                t = t.replace(/\s+(and|or|with|to|for|of|in|across|the|a|an|from|by)$/i, '').trim();
                if (!t || /^(new\s+)?programme\s+design(\s+session)?$|^(new\s+)?program\s+design$|^education\s+programme\s+framework$|^new\s+document$|^foundational\s+learning(\s+initiatives?)?$/i.test(t)) {
                  return 'New Document';
                }
                return t;
              };
              const cleanTitle = formatCleanTitle(conv.title);

              if (isEditing) {
                return (
                  <div
                    key={conv.id}
                    className="w-full bg-purple-50/90 border border-purple-300 rounded-xl p-2 text-xs flex items-center gap-1.5 shadow-2xs animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename();
                        if (e.key === 'Escape') handleCancelRename(e as any);
                      }}
                      className="flex-1 bg-white border border-purple-300 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveRename}
                      className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                      title="Save name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCancelRename}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={conv.id}
                  className={`w-full group rounded-xl px-2.5 py-2 transition-all flex items-center justify-between cursor-pointer border relative overflow-hidden ${
                    isActive
                      ? 'bg-purple-50/80 border-purple-200 text-purple-950 font-medium'
                      : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => handleSelectConv(conv.id)}
                  title={`Click to open "${cleanTitle}"`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1 group-hover:pr-14 transition-all duration-150">
                    {/* Clock Icon matching reference UI */}
                    <div className="shrink-0">
                      <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    </div>

                    {/* Title extending all the way to the end */}
                    <div 
                      className={`text-[12.5px] leading-snug truncate transition-colors flex-1 min-w-0 ${
                        isActive ? 'text-purple-950 font-medium' : 'text-gray-600'
                      }`}
                      onDoubleClick={(e) => handleStartRename(e, conv.id, conv.title)}
                    >
                      <span className="truncate block">{cleanTitle}</span>
                    </div>
                  </div>

                  {/* Hover Quick Action Buttons: floating on hover right over the end */}
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto bg-white/95 border border-gray-200/90 shadow-2xs rounded-lg p-0.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(e, conv.id, conv.title)}
                      className="p-1 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                      title="Rename conversation"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConvToDelete({ id: conv.id, title: cleanTitle });
                      }}
                      className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Utility Bar: Language Selector & User Profile matching Reference UI */}
        <div className="p-3 border-t border-gray-100 space-y-3">
          
          {/* Custom Stylized Language Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-gray-50/90 hover:bg-gray-100/80 border border-gray-200/70 transition-all cursor-pointer group text-left"
              title="Change application language"
            >
              <div className="flex items-center gap-2 text-gray-600">
                <Languages className="w-4 h-4 text-gray-500 stroke-[1.7]" />
                <span className="text-[11.5px] font-medium tracking-normal text-gray-600">
                  {SUPPORTED_LANGUAGES[currentLang]?.nativeLabel || 'Language'}
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  ({SUPPORTED_LANGUAGES[currentLang]?.label || currentLang})
                </span>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 shrink-0" />
            </button>

            {/* Custom Dropdown Menu Popup (Opens above) */}
            {isLangMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLangMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-white border border-gray-200/90 rounded-2xl shadow-xl ring-1 ring-black/5 p-1.5 animate-fade-in text-xs">
                  {/* Clean Header */}
                  <div className="px-2.5 py-1.5 border-b border-gray-100 flex items-center justify-between text-gray-400 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Select Language</span>
                    <Languages className="w-3.5 h-3.5 text-gray-400" />
                  </div>

                  {/* Scrollable Language List */}
                  <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5">
                    {Object.entries(SUPPORTED_LANGUAGES).map(([key, def]) => {
                      const isSelected = key === currentLang;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            updateProfile({ language: key });
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-purple-50 text-purple-900 font-semibold border border-purple-200/70 shadow-2xs'
                              : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-purple-600 stroke-[2.5] shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="text-[13px] tracking-tight truncate">
                              {def.nativeLabel}
                            </span>
                          </div>
                          <span
                            className={`text-[10.5px] px-1.5 py-0.5 rounded-md shrink-0 ml-2 ${
                              isSelected
                                ? 'bg-purple-100/80 text-purple-700 font-medium'
                                : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          >
                            {def.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile & Logout Row */}
          <div className="flex items-center justify-between px-1.5 pt-0.5">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 text-left hover:opacity-85 transition-opacity cursor-pointer min-w-0"
              title="View profile & preferences"
            >
              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-[13.5px] font-semibold text-gray-900 truncate">
                {user?.name ? user.name.split(' ')[0] : 'Dostam'}
              </span>
            </button>

            {/* Logout Action */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-[12px] font-medium transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-gray-100"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2]" />
              <span>Logout</span>
            </button>
          </div>

        </div>

      </aside>

      {/* In-app Delete Confirmation Modal */}
      {convToDelete && (
        <DeleteConfirmModal
          isOpen={!!convToDelete}
          title={convToDelete.title}
          onConfirm={() => {
            deleteConversation(convToDelete.id);
            setConvToDelete(null);
          }}
          onClose={() => setConvToDelete(null)}
        />
      )}
    </>
  );
};
