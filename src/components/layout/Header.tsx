import React, { useState } from 'react';
import { Menu, Maximize2, Minimize2, Download, PanelLeftClose, PanelLeft, ChevronDown, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SupportedLanguage, getLocalizedText } from '../../utils/i18n';
import { VersionControlDropdown } from '../framework/VersionControlDropdown';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  sidebarWidth?: number;
  chatWidth?: number;
  isDragging?: boolean;
  activeAnchor?: string;
  onSelectAnchor?: (id: string) => void;
  onSelectLayoutPreset?: (preset: 'balanced' | 'wideFramework' | 'wideChat') => void;
  onToggleAdmin?: () => void;
  isAdminView?: boolean;
  activeMobileTab: 'chat' | 'framework';
  onSelectMobileTab: (tab: 'chat' | 'framework') => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isWelcomeMode?: boolean;
  designTitle?: string;
  isPdcCompleted?: boolean;
  completedSections?: number;
  totalSections?: number;
  progressPercent?: number;
  onOpenDownload?: (format?: 'pdf' | 'docx' | 'csv') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  sidebarWidth = 224,
  chatWidth = 410,
  isDragging = false,
  onSelectLayoutPreset,
  onToggleAdmin,
  isAdminView = false,
  activeMobileTab,
  onSelectMobileTab,
  isFullscreen = false,
  onToggleFullscreen,
  isWelcomeMode = false,
  designTitle,
  isPdcCompleted = false,
  completedSections = 0,
  totalSections = 7,
  progressPercent = 0,
  onOpenDownload,
}) => {
  const { user } = useAuth();
  const currentLang = (user?.language || 'English') as SupportedLanguage;
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  // Explicit Excel (.xlsx) Download CTA
  const renderDownloadCTA = () => {
    return (
      <div 
        className="flex items-center rounded-lg border border-gray-200/90 bg-white p-0.5 shadow-2xs shrink-0 select-none relative"
      >
        {/* Explicit Primary Download CTA */}
        <button
          type="button"
          onClick={() => onOpenDownload?.()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          title="Download Programme Framework as Excel (.xlsx)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download (.xlsx)</span>
        </button>

        {/* Interactive Document Completeness Checklist Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsChecklistOpen(prev => !prev)}
            className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold font-mono ml-0.5 flex items-center gap-0.5 cursor-pointer transition-colors ${
              isPdcCompleted 
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
            title="Click to view Document Completeness Checklist"
          >
            <span>{isPdcCompleted ? '100%' : `${progressPercent}%`}</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {/* Completeness Checklist Popover */}
          {isChecklistOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsChecklistOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 animate-fade-in text-left">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-semibold text-gray-900">Document Completeness</span>
                  </div>
                  <span className="text-[10.5px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                    {completedSections}/{totalSections} ({progressPercent}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 my-2.5 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Sections Checklist */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto my-2 pr-1">
                  {[
                    '1. Problem Diagnosis & Challenge',
                    '2. Long-term Impact Goal',
                    '3. Stakeholder Personas',
                    '4. Observable Outcomes',
                    '5. Activities & Routines',
                    '6. Deliverable Outputs',
                    '7. Your LFA Matrix'
                  ].map((sec, idx) => {
                    const isDone = idx < completedSections || isPdcCompleted;
                    return (
                      <div key={sec} className="flex items-center justify-between text-[11px] py-0.5">
                        <span className={`truncate ${isDone ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                          {sec}
                        </span>
                        {isDone ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium shrink-0">
                            <Clock className="w-2.5 h-2.5 text-amber-500" /> Drafting
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    Exports working draft anytime
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChecklistOpen(false);
                      onOpenDownload?.('pdf');
                    }}
                    className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[10.5px] font-semibold transition-colors cursor-pointer"
                  >
                    Export Now
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  // If in Focus / Fullscreen Mode, display unified clean bar without column dividers
  if (isFullscreen) {
    return (
      <header className="h-[46px] bg-white border-b border-gray-200/90 flex items-center justify-between px-4 sticky top-0 z-30 select-none shadow-2xs">
        <div className="flex items-center gap-2.5">
          <img src="/pdc-logo-mark.png" alt="Program Design Companion" className="h-5 w-auto object-contain shrink-0" />
          <span className="font-semibold text-[13px] text-gray-900 tracking-tight hidden sm:inline">
            Program Design Companion
          </span>
          <span className="text-gray-300">/</span>
          <span className="text-[12px] font-medium text-gray-700 truncate max-w-sm">
            {designTitle || 'Framework Focus View'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Focus Mode
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-100 text-[12px] font-medium text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Exit focus view and show Chat & Sidebar"
            >
              <Minimize2 className="w-3.5 h-3.5 text-gray-600" />
              <span>Exit Focus Mode</span>
            </button>
          )}

          {/* Primary Download CTA replacing Admin link */}
          {renderDownloadCTA()}
        </div>
      </header>
    );
  }
  return (
    <header className="h-[46px] bg-white border-b border-gray-200/90 flex items-stretch sticky top-0 z-30 select-none">
      
      {/* ======================================================== */}
      {/* A. MOBILE / PWA RESPONSIVE HEADER BAR (Screen < 1024px)   */}
      {/* ======================================================== */}
      <div className="flex lg:hidden w-full items-center justify-between px-2.5 gap-2">
        {/* Left: Sidebar toggle + Compact Brand */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-95"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-gray-700" />
            ) : (
              <PanelLeft className="w-4 h-4 text-gray-700" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <img src="/pdc-logo-mark.png" alt="Program Design Companion" className="h-5 w-auto object-contain shrink-0" />
            <span className="font-semibold text-[13px] text-gray-900 tracking-tight hidden sm:inline">
              Program Design Companion
            </span>
          </div>
        </div>

        {/* Center: Compact Mobile Segment Switcher (Chat | Framework) */}
        {!isWelcomeMode && (
          <div className="flex items-center bg-gray-100/90 p-0.5 rounded-lg text-xs shrink-0 shadow-2xs border border-gray-200/50">
            <button
              onClick={() => onSelectMobileTab('chat')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                activeMobileTab === 'chat'
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => onSelectMobileTab('framework')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                activeMobileTab === 'framework'
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Framework
            </button>
          </div>
        )}

        {/* Right: Download CTA */}
        {!isWelcomeMode && (
          <div className="shrink-0 flex items-center gap-1.5">
            {renderDownloadCTA()}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* B. DESKTOP 3-COLUMN HEADER BAR (Screen >= 1024px)        */}
      {/* ======================================================== */}
      
      {/* 1. Left Zone matching Column 1 (sidebar width) */}
      <div
        style={{
          width: typeof window !== 'undefined' && window.innerWidth >= 1024
            ? (isSidebarOpen ? `${sidebarWidth}px` : '56px')
            : undefined
        }}
        className={`${
          isSidebarOpen ? 'w-56 lg:w-auto px-3 justify-between' : 'w-14 px-0 justify-center'
        } shrink-0 border-r border-gray-200/80 hidden lg:flex items-center ${
          isDragging ? 'transition-none' : 'transition-[width] duration-150'
        }`}
      >
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <img src="/pdc-logo-mark.png" alt="Program Design Companion" className="h-6 w-auto object-contain shrink-0" />
              <span className="font-semibold text-[13px] text-gray-900 tracking-tight whitespace-nowrap truncate">
                Program Design Companion
              </span>
            </div>

            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors ml-2 cursor-pointer flex items-center justify-center active:scale-90 shrink-0"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-gray-500" />
            </button>
          </>
        ) : (
          /* When closed: ONLY the brand icon button, NO text */
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-purple-50 transition-colors cursor-pointer group active:scale-95"
            title="Expand sidebar"
          >
            <img src="/pdc-logo-mark.png" alt="PDC Icon" className="h-6 w-auto object-contain group-hover:scale-105 transition-transform" />
          </button>
        )}
      </div>

      {/* 2 & 3. Middle & Right Zones: Clean minimal bar in Welcome Mode, or full 3-panel headers */}
      {isWelcomeMode ? (
        <div className="flex-1 px-6 hidden lg:flex items-center justify-between bg-[#fafafb]" />
      ) : (
        <>
          {/* 2. Middle Zone matching Column 2 (chat width) */}
          <div
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${chatWidth}px` : undefined }}
            className={`shrink-0 border-r border-gray-200/80 px-4 sm:px-6 hidden lg:flex items-center justify-between ${
              isDragging ? 'transition-none' : 'transition-[width] duration-150'
            }`}
          >
            <span className="text-[13px] text-gray-700 font-medium">
              {getLocalizedText('chat.header', currentLang)}
            </span>
          </div>

          {/* 3. Right Zone matching Column 3 (flex-1) */}
          <div className="flex-1 px-6 sm:px-8 lg:px-10 hidden lg:flex items-center justify-between bg-white">
            <span className="text-[13px] text-gray-700 font-medium">
              {getLocalizedText('preview.header', currentLang)}
            </span>

            {/* Right header controls */}
            <div className="flex items-center gap-2">
              {completedSections > 0 && (
                <VersionControlDropdown compact />
              )}

              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="px-2.5 py-1 rounded-md border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all flex items-center gap-1.5 text-[11px] font-medium cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                  title={isFullscreen ? "Exit Focus Mode" : "Open in Focus Mode (Fullscreen)"}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-gray-500" />
                      <span>Exit Focus Mode</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
                      <span>Focus Mode</span>
                    </>
                  )}
                </button>
              )}

              {/* Primary Download CTA replacing Admin link */}
              {renderDownloadCTA()}
            </div>
          </div>
        </>
      )}

    </header>
  );
};
