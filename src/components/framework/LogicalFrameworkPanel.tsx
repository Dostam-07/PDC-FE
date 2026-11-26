import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Download, Edit3, Copy, Check, Target, CheckCircle2, Box, 
  Maximize2, Minimize2, ChevronRight, ChevronLeft, PanelRightClose, PanelRightOpen,
  Sprout, Sparkles, Users, Landmark, ClipboardCheck, LayoutGrid, ArrowRight,
  Plus, Trash2, Lock, Play, History, RotateCcw, ChevronDown, Eye, MinusCircle, PlusCircle,
  MapPin, AlertCircle, X
} from 'lucide-react';
import { LFAMatrix, LFAOutcome, LFAActivity, LFAOutput } from '../../types/lfa';
import { ExportModal } from '../lfa/ExportModal';
import { SectionEditorModal } from '../lfa/SectionEditorModal';
import { OutcomeSelectorModal } from '../lfa/OutcomeSelectorModal';
import { StakeholderSelectorModal } from '../lfa/StakeholderSelectorModal';
import { ActivitySelectorModal } from '../lfa/ActivitySelectorModal';
import { VerticalNavRail } from './VerticalNavRail';
import { LFATableGrid } from './LFATableGrid';
import { EditableBlock } from './EditableBlock';
import { useChat } from '../../context/ChatContext';
import { detectStateInText } from '../../utils/contextProbing';
import { findStakeholderDef } from '../../utils/conversationRefinement';
import { generateSmartChatName, cleanTruncatedTitle } from '../../utils/chatNaming';
import { useAuth } from '../../context/AuthContext';
import { getLocalizedText } from '../../utils/i18n';

interface LogicalFrameworkPanelProps {
  matrix?: LFAMatrix | null;
  conversationContext?: Record<string, any>;
  onActiveSectionChange?: (sectionId: string) => void;
  onSelectPrompt?: (text: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const LogicalFrameworkPanel: React.FC<LogicalFrameworkPanelProps> = ({
  matrix,
  conversationContext,
  onActiveSectionChange,
  onSelectPrompt,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const { 
    activeConversation, 
    sendMessage, 
    updateLFAMatrix, 
    restoreVersion, 
    versions,
    previewVersion,
    previewVersionId,
    setPreviewVersionId,
    showDiffAnnotations,
    highlightedRowId,
    setHighlightedRowId
  } = useChat();
  const { user } = useAuth();
  const currentLang = user?.language || 'English';

  const isPreviewMode = !!previewVersion && previewVersion.id !== versions[versions.length - 1]?.id;
  const rawDisplayMatrix = previewVersion ? previewVersion.matrix : matrix;

  // Display the exact matrix from conversation/version state without re-synthesizing deleted items
  const displayMatrix = rawDisplayMatrix;

  // Base matrix for visual change comparison
  const diffBaseMatrix = isPreviewMode
    ? matrix
    : (versions.length >= 2 ? versions[versions.length - 2]?.matrix : null);

  const [internalActiveAnchor, setInternalActiveAnchor] = useState('section-challenges');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOutcomeSelectorOpen, setIsOutcomeSelectorOpen] = useState(false);
  const [isStakeholderSelectorOpen, setIsStakeholderSelectorOpen] = useState(false);
  const [isActivitySelectorOpen, setIsActivitySelectorOpen] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isGeneratingActivities, setIsGeneratingActivities] = useState(false);
  const [isOtherStatePopupOpen, setIsOtherStatePopupOpen] = useState(false);
  const [customStateInput, setCustomStateInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 8 Core Sections Order State (synced with Drag & Drop and LocalStorage)
  const [sectionsOrder, setSectionsOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pdc_sections_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 7 && !parsed.includes('section-interventions')) {
          return parsed;
        }
      }
    } catch {}
    return [
      'section-challenges',
      'section-impact',
      'section-stakeholders',
      'section-outcomes',
      'section-activities',
      'section-outputs',
      'section-your-lfa',
    ];
  });

  const currentBackendState = conversationContext?.backendState;
  const isBeforeImpactStage =
    currentBackendState === 'awaiting_challenge' ||
    currentBackendState === 'awaiting_state' ||
    currentBackendState === 'awaiting_impact';

  const hasStarted = !!(displayMatrix || conversationContext?.challenge || conversationContext?.goal);
  const hasChallenges = !!(displayMatrix?.challengeStatement || conversationContext?.challenge);
  const hasImpact = !isBeforeImpactStage && !!(displayMatrix?.impact?.statement || conversationContext?.expectedChange);
  const hasStakeholders = !!(displayMatrix?.personas && displayMatrix.personas.length > 0) || !!(conversationContext?.stakeholders && conversationContext.stakeholders.length > 0);
  const hasOutcomes = !!(displayMatrix?.outcomes && displayMatrix.outcomes.length > 0);
  const hasActivities = !!(displayMatrix?.activities && displayMatrix.activities.length > 0);
  const hasOutputs = !!(displayMatrix?.outputs && displayMatrix.outputs.length > 0);
  const hasInputs = !!(displayMatrix?.resources && displayMatrix.resources.length > 0) || hasActivities;
  const hasYourLfa = !!(displayMatrix?.title && (hasImpact || hasOutcomes));
  const hasAssumptions = !!(displayMatrix?.assumptions && displayMatrix.assumptions.length > 0) || !!(displayMatrix?.risks && displayMatrix.risks.length > 0);

  const statusText = displayMatrix ? (isPreviewMode ? `Previewing ${previewVersion?.versionNumber}` : "In progress") : hasStarted ? "In progress" : "Not started";

  // Clean leading emojis and any backend truncation ellipses from title for editorial display
  const rawCleanTitle = activeConversation?.title?.replace(/^[\p{Emoji}\s\u200B-\u200D\uFE0F]+/u, '').trim();
  const fullChallengeOrGoal = displayMatrix?.challengeStatement || conversationContext?.challenge || conversationContext?.goal || '';
  const cleanTitle = cleanTruncatedTitle(rawCleanTitle || '', fullChallengeOrGoal);

  // Dynamic intelligent program name synthesis:
  // Avoid generic names like "New Programme Design Session" or "Programme Design Session".
  // Avoid truncated titles with trailing ellipses ("... and…") - complete as it is important.
  const challengeText = displayMatrix?.challengeStatement || conversationContext?.challenge || '';
  const detectedRegion = detectStateInText(challengeText) || conversationContext?.detectedState;
  const isGeneric = (title?: string) => !title || /^(new\s+)?programme\s+design(\s+session)?$|^(new\s+)?program\s+design$|^education\s+intervention\s+design$/i.test(title.trim());

  let designName = '';
  if (displayMatrix?.title && !isGeneric(displayMatrix.title)) {
    designName = cleanTruncatedTitle(displayMatrix.title, fullChallengeOrGoal);
  } else if (cleanTitle && !isGeneric(cleanTitle)) {
    designName = cleanTitle;
  } else if (challengeText) {
    designName = generateSmartChatName(challengeText, detectedRegion);
  } else if (conversationContext?.goal && !isGeneric(conversationContext.goal)) {
    designName = cleanTruncatedTitle(conversationContext.goal, fullChallengeOrGoal);
  } else {
    designName = detectedRegion ? `${detectedRegion} Program Design` : "New Document";
  }

  // Ensure title never ends with ellipses or hanging connectives
  designName = cleanTruncatedTitle(designName, fullChallengeOrGoal);

  // Calculate section progress across 7 core sections
  const completedCount = [
    hasChallenges,
    hasImpact,
    hasStakeholders,
    hasOutcomes,
    hasActivities,
    hasOutputs || hasInputs,
    hasYourLfa
  ].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 7) * 100);

  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingProgrammaticallyRef = useRef(false);
  const lockedSectionRef = useRef<string | null>(null);
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Retractable Right Navigation Rail (Outline) - Default closed for clean full-width document reading
  const [isNavRailOpen, setIsNavRailOpen] = useState(false);

  // Reset scroll position to top when active conversation changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeConversation?.id]);

  // Dual-Pane Synchronization (Claude Artifacts standard):
  // Flash canvas highlight when new matrix updates arrive from chat
  const prevMatrixCountRef = useRef<number>(0);
  useEffect(() => {
    const totalItems = (displayMatrix?.outcomes?.length || 0) + (displayMatrix?.activities?.length || 0);
    if (totalItems > 0 && totalItems !== prevMatrixCountRef.current) {
      prevMatrixCountRef.current = totalItems;
      setHighlightedSection('section-your-lfa');
      const timer = setTimeout(() => {
        setHighlightedSection(null);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [displayMatrix?.outcomes?.length, displayMatrix?.activities?.length]);

  const toggleNavRail = () => {
    setIsNavRailOpen(prev => !prev);
  };

  const scrollToSection = (id: string) => {
    // 1. Immediately lock active anchor to the clicked section so it remains there
    lockedSectionRef.current = id;
    setInternalActiveAnchor(id);
    setHighlightedSection(id);
    onActiveSectionChange?.(id);

    // Cancel previous highlight timer if any
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    // Highlight for 3.2 seconds so user clearly sees the targeted section
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedSection(null);
    }, 3200);

    // 2. Lock programmatic scrolling so scroll events don't overwrite selection
    isScrollingProgrammaticallyRef.current = true;
    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = setTimeout(() => {
      isScrollingProgrammaticallyRef.current = false;
      lockedSectionRef.current = null;
    }, 2000);

    const container = scrollContainerRef.current;
    const targetElementId = id === 'section-theme' ? 'section-interventions' : id === 'section-challenge' ? 'section-challenges' : id;
    const target = document.getElementById(targetElementId) || document.getElementById(id);
    if (container && target) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      // Check if the section is already fully visible in the view
      const isFullyVisible = 
        targetRect.top >= containerRect.top + 16 && 
        targetRect.bottom <= containerRect.bottom - 16;

      // Only scroll if the section is not already visible on the screen
      if (!isFullyVisible) {
        // If it's above the viewport, align it just below the pinned header
        if (targetRect.top < containerRect.top + 16) {
          const targetScrollTop = container.scrollTop + (targetRect.top - containerRect.top) - 16;
          container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
        } else {
          // If it's below the viewport, gently bring it into view at the bottom without rolling up everything
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  };

  // Scroll listener to update active section in rail based on container relative position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const sections = sectionsOrder;

    // When user manually scrolls (mouse wheel or touch), unlock programmatic lock
    const handleManualScrollStart = () => {
      isScrollingProgrammaticallyRef.current = false;
      lockedSectionRef.current = null;
    };

    const handleScroll = () => {
      // If user navigated programmatically, keep the clicked section selected!
      if (isScrollingProgrammaticallyRef.current) {
        if (lockedSectionRef.current) {
          setInternalActiveAnchor(lockedSectionRef.current);
          onActiveSectionChange?.(lockedSectionRef.current);
        }
        return;
      }

      // 1. Bottom of page check: if scrolled to the very bottom, activate the last section!
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 35;
      if (isAtBottom) {
        const lastSection = sections[sections.length - 1];
        setInternalActiveAnchor(lastSection);
        onActiveSectionChange?.(lastSection);
        return;
      }

      // 2. Top of page check: if at the very top, activate the first section!
      if (container.scrollTop <= 40) {
        setInternalActiveAnchor(sections[0]);
        onActiveSectionChange?.(sections[0]);
        return;
      }

      // 3. Middle range: find section closest to or crossing the viewing threshold below pinned header
      const containerRect = container.getBoundingClientRect();
      const threshold = containerRect.top + 60;

      let active = sections[0];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId) || (sectionId === 'section-interventions' ? document.getElementById('section-theme') : null);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            active = sectionId;
          }
        }
      }

      setInternalActiveAnchor(active);
      onActiveSectionChange?.(active);
    };

    const handleScrollEnd = () => {
      // When smooth scroll finishes, unlock programmatic flag, but keep lockedSection if arrived
      isScrollingProgrammaticallyRef.current = false;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleManualScrollStart, { passive: true });
    container.addEventListener('touchmove', handleManualScrollStart, { passive: true });
    container.addEventListener('scrollend', handleScrollEnd, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleManualScrollStart);
      container.removeEventListener('touchmove', handleManualScrollStart);
      container.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [onActiveSectionChange, sectionsOrder]);

  const handleCopyAll = () => {
    if (!matrix && !conversationContext) return;
    const text = `
# ${matrix?.title || conversationContext?.goal || 'Program Design Framework'}
Type: ${matrix?.frameworkType || 'Logical Framework Approach (LFA)'}

## Challenge
${matrix?.challengeStatement || conversationContext?.challenge || 'Not specified'}

## Impact Statement
${matrix?.impact?.statement || conversationContext?.expectedChange || 'Not specified'}
Indicators: ${matrix?.impact?.indicators || 'N/A'}

## Outcomes
${(matrix?.outcomes || []).map((o, i) => `${i + 1}. ${o.statement}\n   Indicator: ${o.indicator}\n   MoV: ${o.meansOfVerification}`).join('\n\n')}

## Outputs
${(matrix?.outputs || []).map((op, i) => `• ${op.statement}`).join('\n')}

## Inputs & Resources
${(matrix?.resources || []).join(', ')}

## Assumptions & Risks
Assumptions: ${(matrix?.assumptions || []).join('; ')}
Risks: ${(matrix?.risks || []).map(r => `${r.risk} (Mitigation: ${r.mitigation})`).join('; ')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Renderers for the 8 Core PDC Sections (supporting dynamic drag & drop order with dynamic index)
  const renderChallengesSection = (sectionIndex: number) => {
    const challengeVal = displayMatrix?.challengeStatement || conversationContext?.challenge || '';
    const detectedState = detectStateInText(challengeVal) || conversationContext?.detectedState || null;
    const isStateGrounded = Boolean(detectedState);

    return (
      <div 
        key="section-challenges"
        id="section-challenges" 
        className={`relative group scroll-mt-6 rounded-xl transition-all duration-300 ${
          highlightedSection === 'section-challenges' || highlightedSection === 'section-challenge'
            ? 'ring-1.5 ring-purple-500 animate-canvas-pulse p-3 rounded-xl' 
            : 'p-3'
        }`}
      >
        <div className={`absolute -left-[24px] top-3.5 w-2.5 h-2.5 rounded-full border transition-colors ${
          hasChallenges ? 'border-purple-600 bg-purple-600' : 'border-gray-400 bg-white'
        }`} />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase font-sans text-purple-700 font-semibold">
            <Sprout className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>{sectionIndex + 1}. {getLocalizedText('section.challenges', currentLang)}</span>
          </div>
          {hasChallenges && isStateGrounded && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Grounded in {detectedState}
            </span>
          )}
          {hasChallenges && !isStateGrounded && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-3 h-3 text-amber-600" /> Needs State Grounding
            </span>
          )}
        </div>

        <div className="mt-1.5">
          {hasChallenges ? (
            <div className="space-y-2">
              <EditableBlock
                id="challenge-statement"
                blockType="challenge"
                value={challengeVal}
                onChange={(newVal, isRestore) => {
                  if (!isPreviewMode && matrix) {
                    updateLFAMatrix(
                      { ...matrix, challengeStatement: newVal },
                      isRestore ? 'Restored Challenge Statement' : undefined,
                      true,
                      isRestore
                    );
                  }
                }}
                textClassName="font-serif text-gray-800 text-[15px] leading-relaxed"
                multiline
                label="Challenge Statement"
              />

              {!isStateGrounded && (
                <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-200/90 rounded-xl space-y-1.5 relative">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>State / Geography missing — Ground this challenge to a State:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5 items-center">
                    {['Punjab', 'Rajasthan', 'Bihar', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Madhya Pradesh'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          const current = challengeVal.trim().replace(/[.]+$/, '');
                          const updated = `${current} across primary schools in ${st}.`;
                          if (!isPreviewMode && matrix) {
                            updateLFAMatrix({ ...matrix, challengeStatement: updated }, `Grounded challenge to ${st}`);
                          }
                          if (onSelectPrompt) {
                            onSelectPrompt(`In ${st}`);
                          } else {
                            sendMessage(`In ${st}`);
                          }
                        }}
                        className="px-2.5 py-0.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-md text-[11px] font-medium transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                      >
                        + {st}
                      </button>
                    ))}

                    {/* Others Button */}
                    <button
                      type="button"
                      onClick={() => setIsOtherStatePopupOpen(prev => !prev)}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 flex items-center gap-1 ${
                        isOtherStatePopupOpen
                          ? 'bg-amber-200 text-amber-950 border border-amber-500 ring-2 ring-amber-400/40'
                          : 'bg-amber-100/90 hover:bg-amber-200 text-amber-950 border border-amber-400'
                      }`}
                    >
                      <span>+ Others</span>
                    </button>
                  </div>

                  {/* Pop-up dialog to specify any custom State / Territory */}
                  {isOtherStatePopupOpen && (
                    <div className="mt-2 p-3 bg-white border border-amber-300/90 rounded-xl shadow-lg space-y-2.5 animate-fade-in z-20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-900">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>Specify Your Target State or Geography</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOtherStatePopupOpen(false);
                            setCustomStateInput('');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Close"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Custom State Input Bar */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={customStateInput}
                          onChange={(e) => setCustomStateInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customStateInput.trim()) {
                              e.preventDefault();
                              const selectedSt = customStateInput.trim();
                              const current = challengeVal.trim().replace(/[.]+$/, '');
                              const updated = `${current} across primary schools in ${selectedSt}.`;
                              if (!isPreviewMode && matrix) {
                                updateLFAMatrix({ ...matrix, challengeStatement: updated }, `Grounded challenge to ${selectedSt}`);
                              }
                              if (onSelectPrompt) {
                                onSelectPrompt(`In ${selectedSt}`);
                              } else {
                                sendMessage(`In ${selectedSt}`);
                              }
                              setIsOtherStatePopupOpen(false);
                              setCustomStateInput('');
                            }
                          }}
                          placeholder="Type any State, UT or district (e.g., Odisha, Assam, Delhi)..."
                          autoFocus
                          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50/50"
                        />
                        <button
                          type="button"
                          disabled={!customStateInput.trim()}
                          onClick={() => {
                            if (customStateInput.trim()) {
                              const selectedSt = customStateInput.trim();
                              const current = challengeVal.trim().replace(/[.]+$/, '');
                              const updated = `${current} across primary schools in ${selectedSt}.`;
                              if (!isPreviewMode && matrix) {
                                updateLFAMatrix({ ...matrix, challengeStatement: updated }, `Grounded challenge to ${selectedSt}`);
                              }
                              if (onSelectPrompt) {
                                onSelectPrompt(`In ${selectedSt}`);
                              } else {
                                sendMessage(`In ${selectedSt}`);
                              }
                              setIsOtherStatePopupOpen(false);
                              setCustomStateInput('');
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer shrink-0"
                        >
                          Apply State
                        </button>
                      </div>

                      {/* Quick Choice Pills for Other States & UTs */}
                      <div className="space-y-1 pt-1 border-t border-gray-100">
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">
                          Or quick-select from other Indian States / UTs:
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                          {[
                            'Assam',
                            'Delhi (NCR)',
                            'Gujarat',
                            'Haryana',
                            'Himachal Pradesh',
                            'Jharkhand',
                            'Kerala',
                            'Odisha',
                            'Tamil Nadu',
                            'Telangana',
                            'Uttarakhand',
                            'West Bengal',
                            'Jammu & Kashmir',
                            'Andhra Pradesh',
                            'Chhattisgarh',
                            'National / Pan-India',
                          ].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                const current = challengeVal.trim().replace(/[.]+$/, '');
                                const updated = `${current} across primary schools in ${st}.`;
                                if (!isPreviewMode && matrix) {
                                  updateLFAMatrix({ ...matrix, challengeStatement: updated }, `Grounded challenge to ${st}`);
                                }
                                if (onSelectPrompt) {
                                  onSelectPrompt(`In ${st}`);
                                } else {
                                  sendMessage(`In ${st}`);
                                }
                                setIsOtherStatePopupOpen(false);
                                setCustomStateInput('');
                              }}
                              className="px-2 py-0.5 bg-gray-50 hover:bg-amber-100 hover:text-amber-950 hover:border-amber-300 text-gray-700 border border-gray-200 rounded text-[10.5px] font-medium transition-colors cursor-pointer"
                            >
                              + {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <span className="font-serif text-gray-600 text-[17px] font-normal">Not written yet.</span>
          )}
        </div>
      </div>
    );
  };

  const renderImpactSection = (sectionIndex: number) => (
    <div 
      key="section-impact"
      id="section-impact" 
      className={`relative group scroll-mt-6 rounded-xl transition-all duration-300 ${
        highlightedSection === 'section-impact'
          ? 'ring-1.5 ring-purple-500 animate-canvas-pulse p-3 rounded-xl' 
          : 'p-3'
      }`}
    >
      <div className={`absolute -left-[24px] top-3.5 w-2.5 h-2.5 rounded-full border transition-colors ${
        hasImpact ? 'border-emerald-600 bg-emerald-600' : 'border-gray-400 bg-white'
      }`} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] tracking-wide font-sans text-emerald-800 font-semibold uppercase">
          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{sectionIndex + 1}. {getLocalizedText('section.impact', currentLang)}</span>
        </div>
        {hasImpact && (
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Target Set
          </span>
        )}
      </div>

      <div className="mt-1.5">
        {!isBeforeImpactStage && displayMatrix?.impact?.statement ? (
          <div className="space-y-2">
            <EditableBlock
              id="impact-statement"
              blockType="impact"
              value={displayMatrix.impact.statement
                .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9%])/g)
                .map(s => s.trim())
                .filter(Boolean)
                .join('\n')}
              onChange={(newVal, isRestore) => {
                if (!isPreviewMode && matrix) {
                  updateLFAMatrix(
                    {
                      ...matrix,
                      impact: { ...matrix.impact, statement: newVal }
                    },
                    isRestore ? 'Restored Impact Statement' : undefined,
                    true,
                    isRestore
                  );
                }
              }}
              textClassName="font-serif text-gray-800 text-[15px] leading-relaxed whitespace-pre-line space-y-1.5"
              multiline
              label="Impact Statement"
            />

            {/* Selected Impact Indicators (shown cleanly once chosen via Done) */}
            {displayMatrix.impact.indicators && displayMatrix.impact.indicators.trim() !== '' && (() => {
              const indicatorItems = displayMatrix.impact.indicators
                .split('\n')
                .map(s => s.replace(/^[•\-*]\s*/, '').trim())
                .filter(Boolean);
              if (indicatorItems.length === 0) return null;
              return (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Impact Indicators ({indicatorItems.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {indicatorItems.map((ind, indIdx) => (
                      <div
                        key={indIdx}
                        className="group/ind flex items-start justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50/90 border border-slate-200/80 text-[12.5px] text-gray-700 leading-snug"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-[10.5px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded shrink-0 mt-0.5">
                            I{indIdx + 1}
                          </span>
                          <span className="break-words">{ind}</span>
                        </div>
                        {!isPreviewMode && matrix && (
                          <button
                            type="button"
                            onClick={() => {
                              const remaining = indicatorItems.filter((_, i) => i !== indIdx);
                              updateLFAMatrix(
                                {
                                  ...matrix,
                                  impact: { ...matrix.impact, indicators: remaining.join('\n') }
                                },
                                `Deleted impact indicator: "${ind}"`
                              );
                            }}
                            className="opacity-0 group-hover/ind:opacity-100 p-1 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                            title="Remove impact indicator"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : !isBeforeImpactStage && conversationContext?.expectedChange ? (
          <div className="font-serif text-gray-800 text-[15px] leading-relaxed space-y-1.5">
            {String(conversationContext.expectedChange)
              .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9%])/g)
              .map(s => s.trim())
              .filter(Boolean)
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
        ) : (
          <span className="font-serif text-gray-600 text-[17px] font-normal">Not reached yet.</span>
        )}
      </div>
    </div>
  );

  const renderStakeholdersSection = (sectionIndex: number) => {
    const baseRoles = diffBaseMatrix?.personas?.map(p => p.role.toLowerCase().trim()) || [];
    const displayPersonas = displayMatrix?.personas || [];
    const addedRolesInLatest = isPreviewMode && showDiffAnnotations && diffBaseMatrix?.personas
      ? diffBaseMatrix.personas.filter(bp => !displayPersonas.some(dp => dp.role.toLowerCase().trim() === bp.role.toLowerCase().trim()))
      : [];

    return (
      <div 
        key="section-stakeholders"
        id="section-stakeholders" 
        className={`relative group scroll-mt-6 rounded-xl transition-all duration-300 ${
          highlightedSection === 'section-stakeholders'
            ? 'ring-1.5 ring-purple-500 animate-canvas-pulse p-3 rounded-xl' 
            : 'p-3'
        }`}
      >
        <div className={`absolute -left-[24px] top-3.5 w-2.5 h-2.5 rounded-full border transition-colors ${
          hasStakeholders ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400 bg-white'
        }`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase font-sans text-indigo-700 font-semibold">
            <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{sectionIndex + 1}. {getLocalizedText('section.stakeholders', currentLang)}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasStakeholders && displayPersonas.length > 0 && (
              <span className="text-[10px] text-indigo-600 font-medium">
                {displayPersonas.length} Target Roles
              </span>
            )}
            {displayMatrix && !isPreviewMode && (
              <button
                type="button"
                onClick={() => setIsStakeholderSelectorOpen(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                title="Select stakeholders to add or remove"
              >
                <Plus className="w-3 h-3" />
                <span>Add Stakeholder</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-2.5">
          {displayPersonas.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-2.5">
              {displayPersonas.map((persona, idx) => {
                const isRemovedInLatest = isPreviewMode && showDiffAnnotations && !baseRoles.includes(persona.role.toLowerCase().trim());
                const isAddedInCurrent = !isPreviewMode && showDiffAnnotations && diffBaseMatrix && !baseRoles.includes(persona.role.toLowerCase().trim());

                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl shadow-2xs transition-all flex flex-col justify-between overflow-hidden ${
                      isRemovedInLatest
                        ? 'border-2 border-dashed border-rose-400 bg-rose-50/40 hover:bg-rose-50/60'
                        : isAddedInCurrent
                        ? 'border-2 border-dashed border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/50'
                        : 'bg-white border border-gray-200/90 hover:border-indigo-200 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="font-semibold text-gray-900 text-[12.5px] leading-snug break-words flex-1 min-w-0">
                          {persona.role}
                        </span>

                        {isRemovedInLatest && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                            ✕ Removed in latest
                          </span>
                        )}

                        {isAddedInCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                            + Added in current
                          </span>
                        )}

                        {!isPreviewMode && !isRemovedInLatest && matrix && (
                          <button
                            onClick={() => {
                              const updatedPersonas = matrix.personas.filter((_, i) => i !== idx);
                              updateLFAMatrix(
                                { ...matrix, personas: updatedPersonas },
                                `Removed stakeholder "${persona.role}" from the preview panel.`
                              );
                            }}
                            className="text-gray-300 hover:text-red-500 p-1 -mr-1 -mt-0.5 rounded transition-colors shrink-0 cursor-pointer"
                            title={`Remove ${persona.role}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11.5px] text-gray-600 leading-snug break-words">
                        {persona.responsibilities || "Facilitates structured classroom pedagogy routines and monthly progress reviews."}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Ghost cards: Stakeholders added in latest version */}
              {addedRolesInLatest.map((ghostPersona, gIdx) => (
                <div 
                  key={`ghost-stk-${gIdx}`}
                  className="p-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/25 flex flex-col justify-between overflow-hidden select-none"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-emerald-950 text-[12.5px] leading-snug break-words flex-1 min-w-0">
                        {ghostPersona.role}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        + Added in latest
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 italic leading-snug">
                      (Active in current working framework, not present in this snapshot)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : conversationContext?.stakeholders && conversationContext.stakeholders.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
              {conversationContext.stakeholders.map((stk: string, idx: number) => (
                <div key={idx} className="p-3 bg-white border border-indigo-100 rounded-xl shadow-2xs overflow-hidden">
                  <span className="font-semibold text-indigo-950 text-[12.5px] block mb-1 break-words">{stk}</span>
                  <p className="text-[11px] text-gray-500 leading-snug break-words">
                    Targeted institutional delivery actor.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-white border border-dashed border-indigo-200 rounded-xl text-center">
              <span className="font-serif text-gray-600 text-[15px] font-normal block mb-2">
                No stakeholders mapped yet.
              </span>
              {!isPreviewMode && displayMatrix && (
                <button
                  type="button"
                  onClick={() => setIsStakeholderSelectorOpen(true)}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Select Stakeholders</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOutcomesSection = (sectionIndex: number) => {
    const baseStatements = diffBaseMatrix?.outcomes?.map(o => o.statement.toLowerCase().trim()) || [];
    const displayOutcomes = displayMatrix?.outcomes || [];
    const addedOutcomesInLatest = isPreviewMode && showDiffAnnotations && diffBaseMatrix?.outcomes
      ? diffBaseMatrix.outcomes.filter(bo => !displayOutcomes.some(doOut => doOut.statement.toLowerCase().trim() === bo.statement.toLowerCase().trim()))
      : [];

    return (
      <div 
        key="section-outcomes"
        id="section-outcomes" 
        className={`relative group scroll-mt-6 rounded-xl transition-all duration-300 ${
          highlightedSection === 'section-outcomes' 
            ? 'ring-1.5 ring-purple-500 animate-canvas-pulse p-3 rounded-xl' 
            : 'p-3'
        }`}
      >
        <div className={`absolute -left-[24px] top-3.5 w-2.5 h-2.5 rounded-full border transition-colors ${
          hasOutcomes ? 'border-purple-600 bg-purple-600' : 'border-gray-400 bg-white'
        }`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase font-sans text-purple-700 font-semibold">
            <Landmark className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>{sectionIndex + 1}. {getLocalizedText('section.outcomes', currentLang)}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasOutcomes && (
              <span className="text-[10px] text-purple-600 font-medium">
                {displayOutcomes.length} verifiable outcomes
              </span>
            )}
            {displayMatrix && !isPreviewMode && (
              <button
                type="button"
                onClick={() => setIsOutcomeSelectorOpen(true)}
                className="text-[11px] text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
                title="Select outcomes to add or remove"
              >
                <Plus className="w-3 h-3" />
                <span>Add Outcome</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-1.5">
          {hasOutcomes && displayOutcomes.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3 mt-1.5">
              {displayOutcomes.map((out, idx) => {
                const isRemovedInLatest = isPreviewMode && showDiffAnnotations && !baseStatements.includes(out.statement.toLowerCase().trim());
                const isAddedInCurrent = !isPreviewMode && showDiffAnnotations && diffBaseMatrix && !baseStatements.includes(out.statement.toLowerCase().trim());

                return (
                  <div 
                    key={out.id || idx} 
                    className={`p-3 rounded-xl shadow-2xs transition-all overflow-hidden ${
                      isRemovedInLatest
                        ? 'border-2 border-dashed border-rose-400 bg-rose-50/40 hover:bg-rose-50/60'
                        : isAddedInCurrent
                        ? 'border-2 border-dashed border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/50'
                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-[13px] text-gray-900 leading-snug flex-1 min-w-0 break-words">
                        <span className="text-purple-600 font-bold mr-1">{idx + 1}.</span>
                        <EditableBlock
                          id={`outcome-statement-${idx}`}
                          blockType="outcome_statement"
                          value={out.statement}
                          onChange={(newVal, isRestore) => {
                            if (isPreviewMode || !matrix) return;
                            const updated = [...matrix.outcomes];
                            updated[idx] = { ...updated[idx], statement: newVal };
                            updateLFAMatrix(
                              { ...matrix, outcomes: updated },
                              isRestore
                                ? `Restored Outcome ${idx + 1} statement`
                                : `Modified Outcome ${idx + 1} statement to: "${newVal}"`,
                              true,
                              isRestore
                            );
                          }}
                          textClassName="font-medium text-[13px] text-gray-900 leading-snug inline"
                          multiline
                          label={`Outcome ${idx + 1} Statement`}
                        />
                      </div>

                      {isRemovedInLatest ? (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                          ✕ Removed in latest
                        </span>
                      ) : isAddedInCurrent ? (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          + Added in current
                        </span>
                      ) : !isPreviewMode && matrix ? (
                        <button
                          onClick={() => {
                            const removedOutcome = matrix.outcomes[idx];
                            const updated = matrix.outcomes.filter((_, oIdx) => oIdx !== idx);
                            updateLFAMatrix(
                              { ...matrix, outcomes: updated },
                              removedOutcome?.statement
                                ? `Deleted outcome: "${removedOutcome.statement}"`
                                : `Deleted Outcome ${idx + 1} from the preview panel.`
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                          title={`Delete Outcome ${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 text-xs">
                      <div className="text-gray-600 min-w-0">
                        <span className="font-semibold text-gray-700 block text-[10px] uppercase mb-0.5">Indicator:</span>
                        <EditableBlock
                          id={`outcome-indicator-${idx}`}
                          blockType="outcome_indicator"
                          value={out.indicator}
                          onChange={(newVal, isRestore) => {
                            if (isPreviewMode || !matrix) return;
                            const updated = [...matrix.outcomes];
                            updated[idx] = { ...updated[idx], indicator: newVal };
                            updateLFAMatrix(
                              { ...matrix, outcomes: updated },
                              isRestore ? `Restored Outcome ${idx + 1} indicator` : undefined,
                              true,
                              isRestore
                            );
                          }}
                          textClassName="text-gray-600 text-xs"
                          label={`Outcome ${idx + 1} Indicator`}
                        />
                      </div>
                      <div className="text-gray-600 min-w-0">
                        <span className="font-semibold text-gray-700 block text-[10px] uppercase mb-0.5">Means of Verification:</span>
                        <EditableBlock
                          id={`outcome-mov-${idx}`}
                          blockType="outcome_mov"
                          value={out.meansOfVerification}
                          onChange={(newVal, isRestore) => {
                            if (isPreviewMode || !matrix) return;
                            const updated = [...matrix.outcomes];
                            updated[idx] = { ...updated[idx], meansOfVerification: newVal };
                            updateLFAMatrix(
                              { ...matrix, outcomes: updated },
                              isRestore ? `Restored Outcome ${idx + 1} MoV` : undefined,
                              true,
                              isRestore
                            );
                          }}
                          textClassName="text-gray-600 text-xs"
                          label={`Outcome ${idx + 1} MoV`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Ghost cards: Outcomes added in latest */}
              {addedOutcomesInLatest.map((ghostOut, gIdx) => (
                <div 
                  key={`ghost-out-${gIdx}`}
                  className="p-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/25 flex flex-col justify-between overflow-hidden select-none"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="font-semibold text-emerald-950 text-[12.5px] leading-snug break-words flex-1 min-w-0">
                        {ghostOut.statement}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        + Added in latest
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 italic leading-snug">
                      (Active in current working framework, not present in this snapshot)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="font-serif text-gray-600 text-[17px] font-normal">Not reached yet.</span>
          )}

          {/* Step-by-Step Gated Generation Action Bar */}
          {hasOutcomes && displayMatrix && (!displayMatrix.activities || displayMatrix.activities.length === 0) && !isPreviewMode && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-[12px] font-semibold text-gray-900 leading-tight">
                    Outcomes Review & Quality Gate
                  </h5>
                  <p className="text-[11px] text-gray-500">
                    Approve, edit, or delete outcomes above before generating organizational workstreams.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsGeneratingActivities(true);
                  const outcomeSummaries = displayMatrix.outcomes.map((o, i) => `${i + 1}. ${o.statement}`).join('\n');
                  const prompt = `Please generate corresponding organizational activities, routines, and implementation steps aligned specifically to our approved outcomes:\n${outcomeSummaries}`;
                  sendMessage(prompt).finally(() => setIsGeneratingActivities(false));
                }}
                disabled={isGeneratingActivities}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isGeneratingActivities ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>Synthesizing Aligned Activities...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Generate Activities Aligned to Outcomes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivitiesSection = (sectionIndex: number) => {
    const baseDescs = diffBaseMatrix?.activities?.map(a => a.description.toLowerCase().trim()) || [];
    const displayActivities = displayMatrix?.activities || [];
    const addedActsInLatest = isPreviewMode && showDiffAnnotations && diffBaseMatrix?.activities
      ? diffBaseMatrix.activities.filter(ba => !displayActivities.some(da => da.description.toLowerCase().trim() === ba.description.toLowerCase().trim()))
      : [];

    return (
      <div 
        key="section-activities"
        id="section-activities" 
        className={`relative group scroll-mt-6 rounded-xl transition-all duration-300 ${
          highlightedSection === 'section-activities' 
            ? 'ring-1.5 ring-purple-500 animate-canvas-pulse p-3 rounded-xl' 
            : 'p-3'
        }`}
      >
        <div className={`absolute -left-[24px] top-3.5 w-2.5 h-2.5 rounded-full border transition-colors ${
          hasActivities ? 'border-amber-600 bg-amber-600' : 'border-gray-400 bg-white'
        }`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase font-sans text-amber-700 font-semibold">
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{sectionIndex + 1}. {getLocalizedText('section.activities', currentLang)}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasActivities && displayActivities.length > 0 && (
              <span className="text-[10px] text-amber-600 font-medium">
                {displayActivities.length} Workstreams
              </span>
            )}
            {displayMatrix && !isPreviewMode && (
              <button
                type="button"
                onClick={() => setIsActivitySelectorOpen(true)}
                className="text-[11px] text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                title="Select activities to add or remove"
              >
                <Plus className="w-3 h-3" />
                <span>Add Activity</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-700">
          {displayActivities.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2.5">
              {displayActivities.map((act, idx) => {
                const isRemovedInLatest = isPreviewMode && showDiffAnnotations && !baseDescs.includes(act.description.toLowerCase().trim());
                const isAddedInCurrent = !isPreviewMode && showDiffAnnotations && diffBaseMatrix && !baseDescs.includes(act.description.toLowerCase().trim());

                return (
                  <div 
                    key={act.id || idx} 
                    className={`p-2.5 rounded-lg flex items-center justify-between gap-3 transition-all ${
                      isRemovedInLatest
                        ? 'border-2 border-dashed border-rose-400 bg-rose-50/40'
                        : isAddedInCurrent
                        ? 'border-2 border-dashed border-emerald-400 bg-emerald-50/30'
                        : 'bg-gray-50 border border-gray-200/80 hover:bg-white hover:border-gray-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-baseline gap-2 min-w-0 flex-1">
                      <span className="font-mono text-gray-400 text-xs font-semibold shrink-0">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <EditableBlock
                          id={`activity-desc-${idx}`}
                          blockType="activity_description"
                          value={act.description}
                          onChange={(newVal, isRestore) => {
                            if (isPreviewMode || !matrix) return;
                            const updated = [...matrix.activities];
                            updated[idx] = { ...updated[idx], description: newVal };
                            updateLFAMatrix(
                              { ...matrix, activities: updated },
                              isRestore ? `Restored Activity ${idx + 1} description` : undefined,
                              true,
                              isRestore
                            );
                          }}
                          textClassName="font-medium text-gray-800 text-[12px]"
                          label={`Activity ${idx + 1} Description`}
                        />
                      </div>
                    </div>
                    {isRemovedInLatest ? (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                        ✕ Removed
                      </span>
                    ) : isAddedInCurrent ? (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        + Added
                      </span>
                    ) : !isPreviewMode && matrix ? (
                      <button
                        onClick={() => {
                          const removedAct = matrix.activities[idx];
                          const updated = matrix.activities.filter((_, aIdx) => aIdx !== idx);
                          updateLFAMatrix(
                            { ...matrix, activities: updated },
                            removedAct?.description
                              ? `Deleted activity: "${removedAct.description}"`
                              : `Deleted Activity ${idx + 1} from the preview panel.`
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                        title={`Delete Activity ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                );
              })}

              {/* Ghost activities added in latest */}
              {addedActsInLatest.map((ghostAct, gIdx) => (
                <div 
                  key={`ghost-act-${gIdx}`}
                  className="p-2.5 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/25 flex items-center justify-between gap-3 select-none"
                >
                  <p className="text-[11.5px] text-emerald-950 font-medium truncate flex-1">
                    {ghostAct.description}
                  </p>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    + Added in latest
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-white border border-dashed border-amber-200 rounded-xl text-center">
              <span className="font-serif text-gray-600 text-[15px] font-normal block mb-2">
                No activities defined yet.
              </span>
              {!isPreviewMode && displayMatrix && (
                <button
                  type="button"
                  onClick={() => setIsActivitySelectorOpen(true)}
                  className="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Select Activities</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOutputsSection = (sectionIndex: number) => {
    const baseStatements = diffBaseMatrix?.outputs?.map(o => o.statement.toLowerCase().trim()) || [];
    const displayOutputs = displayMatrix?.outputs || [];
    const addedOutputsInLatest = isPreviewMode && showDiffAnnotations && diffBaseMatrix?.outputs
      ? diffBaseMatrix.outputs.filter(bo => !displayOutputs.some(doOut => doOut.statement.toLowerCase().trim() === bo.statement.toLowerCase().trim()))
      : [];

    return (
      <div 
        key="section-outputs"
        id="section-outputs" 
        className={`relative group scroll-mt-6 rounded-xl transition-all duration-300 ${
          highlightedSection === 'section-outputs' 
            ? 'ring-1.5 ring-purple-500 animate-canvas-pulse p-3 rounded-xl' 
            : 'p-3'
        }`}
      >
        <div className={`absolute -left-[24px] top-3.5 w-2.5 h-2.5 rounded-full border transition-colors ${
          hasOutputs ? 'border-emerald-600 bg-emerald-600' : 'border-gray-400 bg-white'
        }`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase font-sans text-emerald-800 font-semibold">
            <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{sectionIndex + 1}. {getLocalizedText('section.outputs', currentLang)}</span>
          </div>
          {hasOutputs && (
            <span className="text-[10px] text-emerald-600 font-medium">
              {displayOutputs.length || 3} Deliverables Verified
            </span>
          )}
        </div>

        <div className="mt-2 space-y-2.5">
          {displayOutputs.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
              {displayOutputs.map((op, idx) => {
                const isRemovedInLatest = isPreviewMode && showDiffAnnotations && !baseStatements.includes(op.statement.toLowerCase().trim());
                const isAddedInCurrent = !isPreviewMode && showDiffAnnotations && diffBaseMatrix && !baseStatements.includes(op.statement.toLowerCase().trim());

                return (
                  <div 
                    key={op.id || idx} 
                    className={`p-2.5 rounded-lg text-xs text-gray-700 flex items-start gap-2 transition-all ${
                      isRemovedInLatest
                        ? 'border-2 border-dashed border-rose-400 bg-rose-50/40'
                        : isAddedInCurrent
                        ? 'border-2 border-dashed border-emerald-400 bg-emerald-50/30'
                        : 'bg-gray-50 border border-gray-200/80 hover:bg-white hover:border-gray-300 hover:shadow-2xs'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <EditableBlock
                        id={`output-${idx}`}
                        blockType="output"
                        value={op.statement}
                        onChange={(newVal, isRestore) => {
                          if (isPreviewMode || !matrix) return;
                          const updated = [...matrix.outputs];
                          updated[idx] = { ...updated[idx], statement: newVal };
                          updateLFAMatrix(
                            { ...matrix, outputs: updated },
                            isRestore ? `Restored Output ${idx + 1}` : undefined,
                            true,
                            isRestore
                          );
                        }}
                        textClassName="leading-snug text-xs text-gray-700"
                        label={`Output ${idx + 1}`}
                      />
                    </div>
                    {isRemovedInLatest ? (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                        ✕ Removed
                      </span>
                    ) : isAddedInCurrent ? (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        + Added
                      </span>
                    ) : !isPreviewMode && matrix ? (
                      <button
                        onClick={() => {
                          const removedOutput = matrix.outputs[idx];
                          const updated = matrix.outputs.filter((_, oIdx) => oIdx !== idx);
                          updateLFAMatrix(
                            { ...matrix, outputs: updated },
                            removedOutput?.statement
                              ? `Deleted output: "${removedOutput.statement}"`
                              : `Deleted Output ${idx + 1} from the preview panel.`
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                        title={`Delete Output ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                );
              })}

              {/* Ghost outputs added in latest */}
              {addedOutputsInLatest.map((ghostOp, gIdx) => (
                <div 
                  key={`ghost-op-${gIdx}`}
                  className="p-2.5 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/25 flex items-start gap-2 select-none"
                >
                  <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-emerald-950 font-medium truncate flex-1">
                    {ghostOp.statement}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    + Added in latest
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Material & Financial Resources (Inputs) */}
          {displayMatrix?.resources && displayMatrix.resources.length > 0 && (
            <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-lg text-xs">
              <span className="font-semibold text-purple-900 block text-[10px] uppercase mb-1">
                Required Toolkits & Inputs:
              </span>
              <div className="text-gray-700">{displayMatrix.resources.join(', ')}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderYourLfaSection = (sectionIndex: number) => (
    <div 
      key="section-your-lfa"
      id="section-your-lfa" 
      className={`relative group scroll-mt-6 rounded-xl transition-all duration-300 ${
        highlightedSection === 'section-your-lfa' 
          ? 'ring-1.5 ring-purple-500 animate-canvas-pulse p-3 rounded-xl' 
          : 'p-3'
      }`}
    >
      <div className={`absolute -left-[24px] top-3.5 w-2.5 h-2.5 rounded-full border transition-colors ${
        hasYourLfa ? 'border-purple-600 bg-purple-600' : 'border-gray-400 bg-white'
      }`} />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase font-sans text-purple-700 font-semibold">
          <LayoutGrid className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>{sectionIndex + 1}. {getLocalizedText('section.yourLfa', currentLang)}</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
          Core Deliverable
        </span>
      </div>

      <div className="mt-2.5">
        {displayMatrix ? (
          <LFATableGrid 
            matrix={displayMatrix} 
            onEdit={() => setIsEditOpen(true)} 
            highlightedRowId={highlightedRowId || undefined} 
          />
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
            <h4 className="font-serif text-[17px] font-normal text-gray-900">
              Logical Framework Matrix
            </h4>
            <p className="text-[12px] text-gray-600 font-sans mt-0.5">
              Comprehensive causal chain synthesizing Impact, Outcomes, Outputs, and Activities with verified indicators.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSectionById = (id: string, sectionIndex: number) => {
    switch (id) {
      case 'section-challenges':
      case 'section-challenge':
        return renderChallengesSection(sectionIndex);
      case 'section-impact':
        return renderImpactSection(sectionIndex);
      case 'section-stakeholders':
        return renderStakeholdersSection(sectionIndex);
      case 'section-outcomes':
        return renderOutcomesSection(sectionIndex);
      case 'section-activities':
        return renderActivitiesSection(sectionIndex);
      case 'section-outputs':
      case 'section-inputs':
        return renderOutputsSection(sectionIndex);
      case 'section-your-lfa':
        return renderYourLfaSection(sectionIndex);
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafb] overflow-hidden font-sans relative">
      
      {/* 1. Top Header Bar - Pinned strictly on top with integrated Outline Toggle pill */}
      <div className={`shrink-0 min-h-[68px] bg-[#fafafb] z-20 py-2.5 border-b border-gray-200/80 flex items-center justify-between transition-all ${
        isFullscreen ? 'px-4 sm:px-8 lg:px-10' : 'px-3.5 sm:px-6 lg:px-8'
      }`}>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] tracking-wider uppercase font-sans text-gray-400 font-medium mb-0.5 flex flex-wrap items-center gap-2">
            <span>PROGRAMME DESIGN</span>
            {matrix && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {matrix?.frameworkType && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 truncate">{matrix.frameworkType}</span>
              </>
            )}
            {detectedRegion && (
              <>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50/80 border border-purple-200/80 text-purple-700 font-semibold text-[10.5px] tracking-normal normal-case">
                  <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>State: {detectedRegion}</span>
                </span>
              </>
            )}
          </div>

          {/* Program Design Name - Completed in full, not truncated with ellipsis */}
          <h2 className="text-[20px] sm:text-[22px] font-serif font-normal text-gray-900 tracking-tight leading-tight" title={designName}>
            {designName}
          </h2>

          <div className="text-[11.5px] font-sans text-gray-400 mt-0.5 font-normal flex items-center gap-2">
            <span>{statusText}</span>
          </div>
        </div>

        {/* Top-Right Action Controls: Outline Toggle */}
        <div className="shrink-0 ml-4 flex items-center gap-2">
          {/* Integrated Outline Toggle Pill */}
          <div className="hidden lg:block">
            <button
              onClick={toggleNavRail}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer text-[12px] font-medium shadow-2xs group ${
                isNavRailOpen
                  ? 'bg-purple-50 hover:bg-purple-100/70 border-purple-200 text-purple-900'
                  : 'bg-white hover:bg-purple-50/50 border-gray-200 hover:border-purple-200 text-gray-700 hover:text-purple-900'
              }`}
              title={isNavRailOpen ? "Retract section outline" : "Expand section outline"}
            >
              {isNavRailOpen ? (
                <>
                  <span className="font-semibold text-purple-950">Outline</span>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                </>
              ) : (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="font-medium">Outline</span>
                  <span className="font-mono text-[11px] text-gray-400 font-normal">
                    ({completedCount}/7)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dedicated Version Preview Subheader Bar (Cleanly pinned outside the scroll container) */}
      {isPreviewMode && previewVersion && (
        <div className={`shrink-0 bg-amber-50/90 border-b border-amber-200/90 py-2 transition-all flex flex-wrap items-center justify-between gap-3 shadow-2xs select-none z-10 ${
          isFullscreen ? 'px-4 sm:px-8 lg:px-10' : 'px-3.5 sm:px-6 lg:px-8'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-[11px] bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded">
                  Previewing {previewVersion.versionNumber}
                </span>
                <span className="font-semibold text-[12px] text-amber-950 truncate max-w-xs sm:max-w-md">
                  {previewVersion.title}
                </span>
                <span className="text-[10.5px] text-amber-700 font-mono hidden sm:inline">
                  ({previewVersion.timestamp})
                </span>
              </div>
              <p className="text-[10.5px] text-amber-800/90">
                Read-only snapshot • <span className="font-semibold text-rose-700">Red dashed border</span> = removed in latest; <span className="font-semibold text-emerald-700">Green dashed border</span> = added in latest.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => restoreVersion(previewVersion.id)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-[11.5px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title={`Restore ${previewVersion.versionNumber} as the active working framework`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore this version</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewVersionId(null)}
              className="px-2 py-1 bg-white hover:bg-gray-100 border border-amber-300 text-gray-700 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
            >
              Exit Preview
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Document Area (Full width, zero dead whitespace on scroll) */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto py-4 text-gray-900 scroll-smooth ${
          isFullscreen ? 'px-4 sm:px-8 lg:px-10' : 'px-3.5 sm:px-6 lg:px-8'
        }`}
      >
        <div className="w-full">
          {/* Main Document Area */}
          <div className="w-full transition-all duration-300 ease-in-out">
            <div className="space-y-4 animate-fade-in">
              {/* 8 Sections in Dynamic Drag & Drop Order - Always rendered so Outline clicks always scroll & highlight! */}
              <div className="relative pl-6 space-y-7 before:absolute before:left-[4.5px] before:top-2 before:bottom-3 before:w-[1px] before:bg-purple-100 pb-4">
                {sectionsOrder.map((sectionId, idx) => renderSectionById(sectionId, idx))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Section Outline Popover Card */}
      {isNavRailOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsNavRailOpen(false)} 
            aria-hidden="true" 
          />
          <div className="absolute right-4 top-16 z-40 w-64 bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-2xl rounded-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-900">Document Outline</span>
              <button
                onClick={() => setIsNavRailOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Close outline"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <VerticalNavRail
              activeAnchor={internalActiveAnchor}
              onSelectAnchor={(id) => {
                scrollToSection(id);
              }}
              matrix={displayMatrix}
              conversationContext={conversationContext}
              sectionsOrder={sectionsOrder}
              onReorderSections={(newOrder) => setSectionsOrder(newOrder)}
            />
          </div>
        </>
      )}

      {/* Modals */}
      {(displayMatrix || matrix) && (
        <>
          <ExportModal matrix={(displayMatrix || matrix)!} isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
          <SectionEditorModal matrix={(displayMatrix || matrix)!} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
          <OutcomeSelectorModal matrix={(displayMatrix || matrix)!} isOpen={isOutcomeSelectorOpen} onClose={() => setIsOutcomeSelectorOpen(false)} />
          <StakeholderSelectorModal matrix={(displayMatrix || matrix)!} isOpen={isStakeholderSelectorOpen} onClose={() => setIsStakeholderSelectorOpen(false)} />
          <ActivitySelectorModal matrix={(displayMatrix || matrix)!} isOpen={isActivitySelectorOpen} onClose={() => setIsActivitySelectorOpen(false)} />
        </>
      )}

    </div>
  );
};
