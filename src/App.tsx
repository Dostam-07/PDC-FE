import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ChatInterface } from './components/chat/ChatInterface';
import { WelcomeHomeView } from './components/chat/WelcomeHomeView';
import { LogicalFrameworkPanel } from './components/framework/LogicalFrameworkPanel';
import { ConversationalOnboarding } from './components/onboarding/ConversationalOnboarding';
import { ProfileDrawer } from './components/profile/ProfileDrawer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PanelSplitter } from './components/layout/PanelSplitter';
import { ExportModal } from './components/lfa/ExportModal';
import { CommandPaletteModal } from './components/search/CommandPaletteModal';
import { SourcePanel } from './components/chat/SourcePanel';
import { FeedbackModal } from './components/common/FeedbackModal';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { 
    activeConversation, 
    sendMessage, 
    previewVersion,
    activeSources,
    setActiveSources,
    selectedCitationNum,
    setSelectedCitationNum,
    feedbackModalMessageId,
    setFeedbackModalMessageId,
  } = useChat();

  // Indic Line-Height Guard (Pillar 4 Quick Win)
  useEffect(() => {
    const lang = user?.language || 'English';
    document.documentElement.setAttribute('lang', lang);
    if (lang !== 'English') {
      document.body.classList.add('indic-script-active');
    } else {
      document.body.classList.remove('indic-script-active');
    }
  }, [user?.language]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Command Palette (Ctrl+K / Cmd+K) Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'framework'>('chat');
  const [activeAnchor, setActiveAnchor] = useState<string>('section-theme');
  const [isFrameworkFullscreen, setIsFrameworkFullscreen] = useState(false);

  // Resizable Panel Widths with LocalStorage Persistence
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('pdc_sidebar_width');
    return saved ? Math.max(200, Math.min(380, parseInt(saved, 10))) : 240;
  });

  const [chatWidth, setChatWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const totalWidth = window.innerWidth;
      const effectiveSidebar = totalWidth >= 1024 ? 224 : 0;
      const available = totalWidth - effectiveSidebar;

      // Ensure balanced 3-column layout on laptop screens with comfortable chat width
      if (totalWidth < 1440) {
        return Math.max(420, Math.min(540, Math.round(available * 0.42)));
      }
    }
    const saved = localStorage.getItem('pdc_chat_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      return Math.max(380, Math.min(850, parsed));
    }
    if (typeof window !== 'undefined') {
      const available = window.innerWidth - (window.innerWidth >= 1024 ? 224 : 0);
      return Math.max(460, Math.min(620, Math.round(available * 0.42)));
    }
    return 480;
  });

  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingChat, setIsDraggingChat] = useState(false);

  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Sidebar Resize Handlers
  const startSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  // Chat/Framework Divider Resize Handlers
  const startChatResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingChat(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = chatWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [chatWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        const delta = e.clientX - dragStartX.current;
        const newWidth = Math.max(180, Math.min(360, dragStartWidth.current + delta));
        setSidebarWidth(newWidth);
        localStorage.setItem('pdc_sidebar_width', String(newWidth));
      } else if (isDraggingChat) {
        const delta = e.clientX - dragStartX.current;
        const maxChatWidth = Math.max(340, window.innerWidth - (isSidebarOpen ? sidebarWidth : 0) - 480);
        const newWidth = Math.max(300, Math.min(maxChatWidth, dragStartWidth.current + delta));
        setChatWidth(newWidth);
        localStorage.setItem('pdc_chat_width', String(newWidth));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSidebar || isDraggingChat) {
        setIsDraggingSidebar(false);
        setIsDraggingChat(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    if (isDraggingSidebar || isDraggingChat) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar, isDraggingChat, isSidebarOpen, sidebarWidth]);

  // Layout Presets
  const handleSelectLayoutPreset = (preset: 'balanced' | 'wideFramework' | 'wideChat') => {
    const totalAvail = window.innerWidth - (isSidebarOpen ? sidebarWidth : 0);
    if (preset === 'balanced') {
      const target = Math.round(totalAvail * 0.45);
      setChatWidth(Math.max(340, Math.min(650, target)));
    } else if (preset === 'wideFramework') {
      setChatWidth(340);
    } else if (preset === 'wideChat') {
      setChatWidth(Math.round(totalAvail * 0.6));
    }
  };

  // Reset to Defaults
  const handleResetSidebarWidth = () => {
    setSidebarWidth(224);
    localStorage.setItem('pdc_sidebar_width', '224');
  };

  const handleResetChatWidth = () => {
    const target = typeof window !== 'undefined' && window.innerWidth < 1440 ? 400 : 480;
    setChatWidth(target);
    localStorage.setItem('pdc_chat_width', String(target));
  };

  // Extract latest compiled matrix if available in this conversation (previewed or working)
  const activeWorkingMatrix = activeConversation?.context?.lfaMatrix || activeConversation?.messages?.slice().reverse().find(m => m.lfaMatrix)?.lfaMatrix || null;
  const rawLatestMatrix = previewVersion ? previewVersion.matrix : activeWorkingMatrix;

  // Fully normalize latestMatrix so outcomes, activities, and outputs are populated whenever
  // personas exist, aligning App progress, Header 100% download unlock, and preview panels
  const latestMatrix = React.useMemo(() => {
    if (!rawLatestMatrix) return null;
    const mat = { ...rawLatestMatrix };
    const personas = mat.personas || [];
    const contextStakeholders: string[] = activeConversation?.context?.stakeholders || [];
    const effectiveRoles: string[] = personas.length > 0 ? personas.map((p: any) => p.role) : contextStakeholders;

    if (effectiveRoles.length > 0) {
      const outcomes = [...(mat.outcomes || [])];
      const activities = [...(mat.activities || [])];
      const outputs = [...(mat.outputs || [])];

      effectiveRoles.forEach((role: string, idx: number) => {
        const hasOut = outcomes.some(o => o.statement?.toLowerCase().includes(role.toLowerCase()));
        if (!hasOut) {
          outcomes.push({
            id: `synth-out-${idx + 1}-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            statement: `${role} execute structured delivery routines with pedagogical fidelity.`,
            indicator: `% of ${role} completing scheduled routines with fidelity`,
            meansOfVerification: 'District monitoring portal registers & supervisory records.'
          });
        }

        const hasAct = activities.some(a => a.description?.toLowerCase().includes(role.toLowerCase()));
        if (!hasAct) {
          activities.push({
            id: `synth-act-${idx + 1}-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            description: `Institutional orientation and coaching review routines for ${role}.`,
            metric: 'Operationalized across all targeted schools'
          });
        }

        const hasOp = outputs.some(o => o.statement?.toLowerCase().includes(role.toLowerCase()));
        if (!hasOp) {
          outputs.push({
            id: `synth-out-${idx + 1}-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            statement: `Review registers and logs for ${role} verified.`
          });
        }
      });

      mat.outcomes = outcomes;
      mat.activities = activities;
      mat.outputs = outputs;
    }
    return mat;
  }, [rawLatestMatrix, activeConversation?.context?.stakeholders]);

  // Completion calculation across 7 PDC core sections
  const backendState = activeConversation?.context?.backendState;
  const isBeforeImpactStage =
    backendState === 'awaiting_challenge' ||
    backendState === 'awaiting_state' ||
    backendState === 'awaiting_impact';
  const hasChallenges = !!(latestMatrix?.challengeStatement || activeConversation?.context?.challenge);
  const hasImpact = !isBeforeImpactStage && !!(latestMatrix?.impact?.statement || activeConversation?.context?.expectedChange);
  const hasStakeholders = !!(latestMatrix?.personas && latestMatrix.personas.length > 0);
  const hasOutcomes = !!(latestMatrix?.outcomes && latestMatrix.outcomes.length > 0);
  const hasActivities = !!(latestMatrix?.activities && latestMatrix.activities.length > 0);
  const hasOutputs = !!(latestMatrix?.outputs && latestMatrix.outputs.length > 0) || !!(latestMatrix?.resources && latestMatrix.resources.length > 0);
  const hasYourLfa = !!(latestMatrix?.title && (hasImpact || hasOutcomes));

  const completedSections = [
    hasChallenges,
    hasImpact,
    hasStakeholders,
    hasOutcomes,
    hasActivities,
    hasOutputs,
    hasYourLfa
  ].filter(Boolean).length;
  const isPdcCompleted = completedSections === 7;
  const progressPercent = Math.round((completedSections / 7) * 100);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const isWelcomeMode =
    !isAdminView &&
    (!activeConversation ||
      ((activeConversation.messages?.length || 0) === 0 && !activeConversation.context?.lfaMatrix));

  if (loading) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center text-gray-800 space-y-3">
        <img src="/pdc-logo-mark.png" alt="PDC" className="h-12 w-auto object-contain animate-pulse" />
        <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-gray-500 font-sans">Loading Program Design Companion...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-gray-900 overflow-hidden font-sans">
      
      {/* Onboarding Overlay */}
      <ConversationalOnboarding />

      {/* Top Header Matching Live QA PDC */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        sidebarWidth={sidebarWidth}
        chatWidth={chatWidth}
        isDragging={isDraggingSidebar || isDraggingChat}
        activeAnchor={activeAnchor}
        onSelectAnchor={(id) => setActiveAnchor(id)}
        onSelectLayoutPreset={handleSelectLayoutPreset}
        onToggleAdmin={() => setIsAdminView(prev => !prev)}
        isAdminView={isAdminView}
        activeMobileTab={activeMobileTab}
        onSelectMobileTab={(tab) => setActiveMobileTab(tab)}
        isFullscreen={isWelcomeMode ? false : isFrameworkFullscreen}
        onToggleFullscreen={() => setIsFrameworkFullscreen(prev => !prev)}
        isWelcomeMode={isWelcomeMode}
        designTitle={latestMatrix?.title || activeConversation?.title}
        isPdcCompleted={isPdcCompleted}
        completedSections={completedSections}
        totalSections={7}
        progressPercent={progressPercent}
        onOpenDownload={() => {
          setIsExportModalOpen(true);
        }}
      />

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Column 1: Left Navigation Sidebar ("Your designs", "+ New design") */}
        {(isWelcomeMode || !isFrameworkFullscreen) && (
          <Sidebar
            isOpen={isSidebarOpen}
            width={sidebarWidth}
            onClose={() => setIsSidebarOpen(false)}
            onToggleOpen={() => setIsSidebarOpen(prev => !prev)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenSearch={() => setIsCommandPaletteOpen(true)}
          />
        )}

        {/* Draggable Divider Handle between Sidebar and Chat (Desktop only) */}
        {(isWelcomeMode || !isFrameworkFullscreen) && isSidebarOpen && (
          <PanelSplitter
            id="splitter-sidebar"
            isDragging={isDraggingSidebar}
            onResizeStart={startSidebarResize}
            onDoubleClick={handleResetSidebarWidth}
            label="Drag to resize sidebar"
            currentWidth={sidebarWidth}
          />
        )}

        {/* Main Workspace Area */}
        {isAdminView ? (
          <AdminDashboard />
        ) : isWelcomeMode ? (
          <WelcomeHomeView />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Column 2: Middle Chat Column ("Chat with your design") */}
            {!isFrameworkFullscreen && (
              <div
                style={{
                  width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${chatWidth}px` : '100%'
                }}
                className={`h-full flex flex-col shrink-0 bg-white relative z-10 shadow-[0_0_24px_rgba(0,0,0,0.06)] border-r border-gray-200/90 ${
                  isDraggingChat ? 'transition-none' : 'transition-[width] duration-150'
                } ${
                  activeMobileTab === 'framework' ? 'hidden lg:flex' : 'flex'
                }`}
              >
                <ChatInterface />
              </div>
            )}

            {/* Draggable Divider Handle between Chat and Framework Panel */}
            {!isFrameworkFullscreen && (
              <PanelSplitter
                id="splitter-chat"
                isDragging={isDraggingChat}
                onResizeStart={startChatResize}
                onDoubleClick={handleResetChatWidth}
                label="Drag to resize chat and logical framework panels"
                currentWidth={chatWidth}
              />
            )}

            {/* Column 3: Right Logical Framework Panel (Takes all remaining width) */}
            <div className={`flex-1 h-full overflow-hidden bg-[#fafafb] ${
              activeMobileTab === 'chat' && !isFrameworkFullscreen ? 'hidden lg:flex' : 'flex'
            }`}>
              <LogicalFrameworkPanel
                matrix={activeWorkingMatrix}
                conversationContext={activeConversation?.context}
                onActiveSectionChange={(id) => setActiveAnchor(id)}
                isFullscreen={isFrameworkFullscreen}
                onToggleFullscreen={() => setIsFrameworkFullscreen(prev => !prev)}
                onSelectPrompt={(text) => sendMessage(text)}
              />
            </div>

          </div>
        )}
      </div>

      {/* Profile Drawer Panel */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Primary Deliverable Export Modal (Excel .xlsx) */}
      {latestMatrix && (
        <ExportModal
          matrix={latestMatrix}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Command Palette (Ctrl+K / Cmd+K) Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        isFullscreen={isFrameworkFullscreen}
        onToggleFullscreen={() => setIsFrameworkFullscreen(prev => !prev)}
      />

      {/* Grounded Sources & Citations Drawer (App Root Modal Layer) */}
      {activeSources && (
        <SourcePanel
          sources={activeSources}
          transparency={activeConversation?.messages?.[activeConversation.messages.length - 1]?.transparency}
          selectedCitationNum={selectedCitationNum}
          onSelectCitationNum={(num) => setSelectedCitationNum(num)}
          onClose={() => {
            setActiveSources(null);
            setSelectedCitationNum(null);
          }}
        />
      )}

      {/* Response Feedback Modal (App Root Modal Layer) */}
      {feedbackModalMessageId && (
        <FeedbackModal
          messageId={feedbackModalMessageId}
          onClose={() => setFeedbackModalMessageId(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <ChatProvider>
          <MainAppContent />
        </ChatProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
};

export default App;
