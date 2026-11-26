import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage, SourceCitation, LFAVersion } from '../types/chat';
import { LFAMatrix, LFAOutcome, LFAActivity, LFAOutput } from '../types/lfa';
import { pdcApiService, RealConversation, RealDraft, ImpactReview } from '../services/pdcApiService';
import { handleConversationalRefinement, findStakeholderDef } from '../utils/conversationRefinement';
import { detectStateInText, hasGeographicState, isChallengeIntent, isImpactIntent } from '../utils/contextProbing';
import { getDefaultSources } from '../utils/sourceCitations';
import { generateSmartChatName, cleanTruncatedTitle } from '../utils/chatNaming';
import { useAuth } from './AuthContext';
import { getLocalizedText } from '../utils/i18n';
import { generateImpactIndicatorOptions } from '../utils/impactIndicators';
import { triggerCelebratoryConfetti } from '../utils/confetti';

const VERSION_WINDOW_MS = 5 * 60 * 1000;

const buildNextVersions = (
  existingVersions: LFAVersion[],
  updatedMatrix: LFAMatrix,
  source: LFAVersion['source'],
  title: string,
  forceNewVersion = false
): { nextVersions: LFAVersion[]; activeVersion: LFAVersion } => {
  const now = Date.now();
  const timestamp = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lastVersion = existingVersions[existingVersions.length - 1];
  const canMergeIntoLast =
    !forceNewVersion &&
    source !== 'ai_synthesis' &&
    source !== 'restore' &&
    lastVersion &&
    lastVersion.versionNumber !== 'v1.0' &&
    lastVersion.source !== 'ai_synthesis' &&
    lastVersion.source !== 'restore' &&
    typeof lastVersion.createdAtMs === 'number' &&
    now - lastVersion.createdAtMs < VERSION_WINDOW_MS;

  if (canMergeIntoLast) {
    const mergedVersion: LFAVersion = {
      ...lastVersion,
      title,
      timestamp,
      source,
      matrix: JSON.parse(JSON.stringify(updatedMatrix)),
    };
    return {
      nextVersions: [...existingVersions.slice(0, -1), mergedVersion],
      activeVersion: mergedVersion,
    };
  }

  const nextVerNum = `v1.${existingVersions.length}`;
  const newVersion: LFAVersion = {
    id: `ver-${now}-${Math.random().toString(36).substring(2, 6)}`,
    versionNumber: nextVerNum,
    title,
    timestamp,
    createdAtMs: now,
    source,
    matrix: JSON.parse(JSON.stringify(updatedMatrix)),
  };
  return {
    nextVersions: [...existingVersions, newVersion],
    activeVersion: newVersion,
  };
};

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loading: boolean;
  sending: boolean;
  generatingProgress?: { step: string; percent: number } | null;
  activeSources: SourceCitation[] | null;
  setActiveSources: (sources: SourceCitation[] | null) => void;
  feedbackModalMessageId: string | null;
  setFeedbackModalMessageId: (id: string | null) => void;
  selectConversation: (id: string) => Promise<void>;
  startNewChat: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => void;
  sendMessage: (text: string) => Promise<void>;
  confirmImpact: (scopeAnswers?: Array<{ id: string; answer?: string | null }>) => Promise<void>;
  confirmImpactIndicators: (selectedIndicators: string[]) => Promise<void>;
  skipImpactIndicators: () => Promise<void>;
  confirmStakeholders: (stakeholders: string[], customDetails?: Record<string, { description: string; isStateSpecific: boolean }>) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  submitFeedback: (messageId: string, type: 'up' | 'down', comments?: string) => Promise<void>;
  updateLFAMatrix: (updatedMatrix: LFAMatrix, changeNote?: string, notifyInChat?: boolean, isRestore?: boolean) => void;
  restoreVersion: (versionId: string) => void;
  versions: LFAVersion[];
  previewVersionId: string | null;
  setPreviewVersionId: (id: string | null) => void;
  previewVersion: LFAVersion | null;
  showDiffAnnotations: boolean;
  setShowDiffAnnotations: (show: boolean | ((prev: boolean) => boolean)) => void;
  highlightedRowId: string | null;
  setHighlightedRowId: (id: string | null) => void;
  selectedCitationNum: number | null;
  setSelectedCitationNum: (num: number | null) => void;
  resetAllExamples: () => void;
  notifyFrameworkReady: (stateName?: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DELETED_CONVS_STORAGE_KEY = 'pdc.deleted_conversation_ids';

export const getDeletedConversationIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_CONVS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {}
  return new Set();
};

export const markConversationAsDeleted = (id: string) => {
  try {
    const deleted = getDeletedConversationIds();
    deleted.add(id);
    localStorage.setItem(DELETED_CONVS_STORAGE_KEY, JSON.stringify(Array.from(deleted)));
    localStorage.removeItem(`pdc.conv.msgs.${id}`);
    localStorage.removeItem(`pdc.conv.versions.${id}`);
    localStorage.removeItem(`pdc.conv.matrix.${id}`);
    localStorage.removeItem(`pdc.conv.bstate.${id}`);
    localStorage.removeItem(`pdc.state.${id}`);
  } catch (err) {
    console.warn('Failed to mark conversation as deleted in storage:', err);
  }
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentLang = user?.language || 'English';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<{ step: string; percent: number } | null>(null);
  const [activeSources, setActiveSources] = useState<SourceCitation[] | null>(null);
  const [feedbackModalMessageId, setFeedbackModalMessageId] = useState<string | null>(null);
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
  const [showDiffAnnotations, setShowDiffAnnotations] = useState<boolean>(true);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [selectedCitationNum, setSelectedCitationNum] = useState<number | null>(null);

  // Cache conversation messages, versions, matrix, and state in localStorage so switching documents never loses version history
  useEffect(() => {
    if (!activeConversation) return;
    try {
      if (activeConversation.messages.length > 0) {
        localStorage.setItem(`pdc.conv.msgs.${activeConversation.id}`, JSON.stringify(activeConversation.messages));
      }
      const versions = activeConversation.context?.versions;
      if (Array.isArray(versions) && versions.length > 0) {
        localStorage.setItem(`pdc.conv.versions.${activeConversation.id}`, JSON.stringify(versions));
      }
      if (activeConversation.context?.lfaMatrix) {
        localStorage.setItem(`pdc.conv.matrix.${activeConversation.id}`, JSON.stringify(activeConversation.context.lfaMatrix));
      }
      if (activeConversation.context?.backendState) {
        localStorage.setItem(`pdc.conv.bstate.${activeConversation.id}`, String(activeConversation.context.backendState));
      }
    } catch (err) {
      console.warn('Failed to cache conversation state:', err);
    }
  }, [activeConversation]);

  // When user switches language, dynamically translate companion questions and system messages in active conversation!
  useEffect(() => {
    setActiveConversation(prev => {
      if (!prev || !prev.messages.length) return prev;
      let hasChange = false;
      const updatedMessages = prev.messages.map(m => {
        if (m.sender === 'ai' && m.i18nKey) {
          const newText = getLocalizedText(m.i18nKey, currentLang, m.i18nVariables);
          if (newText !== m.text) {
            hasChange = true;
            return { ...m, text: newText };
          }
        }
        return m;
      });

      if (!hasChange) return prev;
      return {
        ...prev,
        messages: updatedMessages,
      };
    });
  }, [currentLang]);

  const activeRunPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for background run completion
  // Helper to append the 100% ready message prompting the user to check the right preview panel
  const notifyFrameworkReady = (stateName: string, matrix?: LFAMatrix) => {
    // Trigger celebratory confetti milestone!
    setTimeout(() => {
      triggerCelebratoryConfetti();
    }, 200);

    setActiveConversation(prev => {
      if (!prev) return null;
      // Don't add duplicate ready messages if already present
      const alreadyNotified = prev.messages.some(m => m.id.startsWith('msg-ready-'));
      if (alreadyNotified) return prev;

      const readyMsg: ChatMessage = {
        id: `msg-ready-${Date.now()}`,
        sender: 'ai',
        text: getLocalizedText('lfa.ready', currentLang, { STATE: stateName }),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lfaMatrix: matrix || prev.context?.lfaMatrix,
        sources: getDefaultSources(
          stateName === 'your state' ? 'State' : stateName,
          (matrix || prev.context?.lfaMatrix)?.frameworkType || 'Foundational Literacy'
        ),
        i18nKey: 'lfa.ready',
        i18nVariables: { STATE: stateName },
      };

      return {
        ...prev,
        context: {
          ...prev.context,
          backendState: 'complete',
        },
        messages: prev.messages
          .map(m => m.specificOutput?.type === 'generating' ? { ...m, specificOutput: undefined } : m)
          .concat(readyMsg),
      };
    });
  };

  const pollRunStatus = (runId: string, convId: string, challengeText?: string) => {
    if (activeRunPollingRef.current) {
      clearInterval(activeRunPollingRef.current);
    }

    setGeneratingProgress({ step: 'Synthesizing causal framework...', percent: 15 });

    let attempts = 0;
    activeRunPollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const detail = await pdcApiService.getRunDetail(runId);
        const calls = detail.calls || [];
        const lastCall = calls[calls.length - 1];

        if (lastCall?.step) {
          const stepName =
            lastCall.step === 'outcome'
              ? 'Drafting stakeholder outcomes...'
              : lastCall.step === 'outcome_indicator'
              ? 'Formulating verifiable indicators...'
              : lastCall.step === 'activity'
              ? 'Designing aligned workstream activities...'
              : lastCall.step === 'output'
              ? 'Structuring tangible outputs...'
              : lastCall.step === 'row_logic'
              ? 'Validating causal row logic...'
              : lastCall.step === 'assumptions'
              ? 'Synthesizing system assumptions...'
              : 'Synthesizing framework...';
          const calcPercent = Math.min(95, 20 + Math.round((calls.length / 50) * 75));
          setGeneratingProgress({ step: stepName, percent: calcPercent });
        } else {
          // Provide smooth progression feedback even if call steps are buffering
          const simulated = Math.min(95, 25 + attempts * 5);
          setGeneratingProgress({
            step: attempts > 6 ? 'Finalizing causal indicators and workstreams...' : 'Synthesizing causal framework with education reasoning...',
            percent: simulated
          });
        }

        const run = await pdcApiService.getRun(runId);
        if (run.status === 'ok' && run.draft_id) {
          if (activeRunPollingRef.current) {
            clearInterval(activeRunPollingRef.current);
            activeRunPollingRef.current = null;
          }
          setGeneratingProgress({ step: 'Framework generation complete!', percent: 100 });
          setTimeout(() => setGeneratingProgress(null), 1500);

          // Clear 'generating' specificOutput so the progress bar card does not stay permanently frozen in chat
          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map(m =>
                m.specificOutput?.type === 'generating' ? { ...m, specificOutput: undefined } : m
              ),
            };
          });

          // Fetch full draft
          const draft = await pdcApiService.getDraft(run.draft_id);
          if (draft) {
            const matrix = pdcApiService.mapDraftToMatrix(draft, challengeText);
            // Reload full conversation from backend
            await loadFullConversation(convId, matrix);
          }

          const targetState = activeConversation?.context?.detectedState || 'your state';
          notifyFrameworkReady(targetState);
        } else if (run.status === 'error') {
          if (activeRunPollingRef.current) {
            clearInterval(activeRunPollingRef.current);
            activeRunPollingRef.current = null;
          }
          setGeneratingProgress(null);
          // Dismiss the generating card on error
          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map(m =>
                m.specificOutput?.type === 'generating' ? { ...m, specificOutput: undefined } : m
              ),
            };
          });
          console.error('[ChatContext] Run failed:', run.error);
        }
      } catch (err) {
        console.error('[ChatContext] Polling error:', err);
      }

      // Max timeout after 45 seconds: framework is already built on the right, finish cleanly!
      if (attempts > 22) {
        if (activeRunPollingRef.current) {
          clearInterval(activeRunPollingRef.current);
          activeRunPollingRef.current = null;
        }
        setGeneratingProgress({ step: 'Framework generation complete!', percent: 100 });
        setTimeout(() => setGeneratingProgress(null), 1500);
        setActiveConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(m =>
              m.specificOutput?.type === 'generating' ? { ...m, specificOutput: undefined } : m
            ),
          };
        });
        const targetState = activeConversation?.context?.detectedState || 'your state';
        notifyFrameworkReady(targetState);
      }
    }, 2000);
  };

  // Convert real conversation + draft to frontend Conversation
  const loadFullConversation = async (convId: string, existingMatrix?: LFAMatrix): Promise<Conversation | null> => {
    if (getDeletedConversationIds().has(convId)) return null;
    try {
      const realConv = await pdcApiService.getConversation(convId);
      if (!realConv) return null;

      // Extract geography or challenge from first user message if available
      const firstUserMsg = realConv.messages?.find(m => m.role === 'user');
      const challenge = firstUserMsg?.body?.text || '';

      // Restore cached versions & matrix for this conversation so switching documents preserves full version history
      let cachedVersions: LFAVersion[] = [];
      let cachedMatrix: LFAMatrix | undefined = undefined;
      let cachedBackendState: string | undefined = undefined;
      try {
        const verStr = localStorage.getItem(`pdc.conv.versions.${convId}`);
        if (verStr) {
          const parsedVer = JSON.parse(verStr);
          if (Array.isArray(parsedVer)) cachedVersions = parsedVer;
        }
        const matStr = localStorage.getItem(`pdc.conv.matrix.${convId}`);
        if (matStr) cachedMatrix = JSON.parse(matStr);
        const bState = localStorage.getItem(`pdc.conv.bstate.${convId}`);
        if (bState) cachedBackendState = bState;
      } catch {}

      let lfaMatrix = existingMatrix;
      const draftId = realConv.draft_id || realConv.messages?.slice().reverse().find(m => m.body?.draft_id)?.body?.draft_id;
      if (!lfaMatrix && draftId) {
        const draft = await pdcApiService.getDraft(draftId);
        if (draft) {
          lfaMatrix = pdcApiService.mapDraftToMatrix(draft, challenge);
        }
      }

      if (!existingMatrix && cachedMatrix) {
        lfaMatrix = cachedMatrix;
      }

      // Maintain version history (prefer cached versions if richer than backend)
      let versions: LFAVersion[] = (realConv as any).context?.versions || [];
      if (cachedVersions.length > versions.length) {
        versions = cachedVersions;
        if (!existingMatrix && cachedVersions[cachedVersions.length - 1]?.matrix) {
          lfaMatrix = cachedVersions[cachedVersions.length - 1].matrix;
        }
      }
      if (lfaMatrix && versions.length === 0) {
        versions = [
          {
            id: `ver-init-${realConv.id}`,
            versionNumber: 'v1.0',
            title: 'Initial AI Synthesis (ShikshaLokam PDC)',
            timestamp: new Date(realConv.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'ai_synthesis',
            matrix: JSON.parse(JSON.stringify(lfaMatrix)),
          }
        ];
      }

      // Ensure all selected stakeholders from context are retained in lfaMatrix personas (never dropped)
      const selectedStakeholderList: string[] = (realConv as any).context?.stakeholders || activeConversation?.context?.stakeholders || [];
      if (lfaMatrix && selectedStakeholderList.length > 0) {
        const existingRoles = new Set((lfaMatrix.personas || []).map(p => p.role.toLowerCase()));
        const missingPersonas = selectedStakeholderList
          .filter(role => !existingRoles.has(role.toLowerCase()))
          .map(role => ({
            role,
            responsibilities: `Facilitates core program pedagogy routines and monitoring fidelity for ${role}.`
          }));
        if (missingPersonas.length > 0) {
          lfaMatrix = {
            ...lfaMatrix,
            personas: [...(lfaMatrix.personas || []), ...missingPersonas]
          };
        }
      }

      const isSameConv = activeConversation?.id === convId;
      const effectiveBackendState = (isSameConv ? activeConversation?.context?.backendState : undefined) || cachedBackendState || realConv.state;
      const isBeforeImpactGiven =
        effectiveBackendState === 'awaiting_challenge' ||
        effectiveBackendState === 'awaiting_state' ||
        effectiveBackendState === 'awaiting_impact';

      const rawImpactCandidate =
        (isSameConv ? activeConversation?.context?.expectedChange : undefined) ||
        (realConv as any).context?.impact_intent ||
        (realConv as any).context?.impact?.impacts?.[0]?.statement;

      const looksLikeStakeholderList =
        typeof rawImpactCandidate === 'string' &&
        /(Teachers|School Leaders|Students|Academic Resource Persons|Cluster Resource Persons|DIET|SCERT)/i.test(rawImpactCandidate) &&
        rawImpactCandidate.includes(',');

      const safeExpectedChange =
        !isBeforeImpactGiven && !looksLikeStakeholderList ? rawImpactCandidate : undefined;

      // Extract progressive context from conversation messages so right side shows grounded data immediately!
      const convContext: Record<string, any> = {
        ...(realConv as any).context,
        backendState: effectiveBackendState,
        draftId: realConv.draft_id,
        challenge: (realConv as any).context?.challenge_statement || challenge,
        goal: (realConv as any).context?.theme || (realConv as any).context?.challenge_statement,
        theme: (realConv as any).context?.theme,
        expectedChange: safeExpectedChange,
        stakeholders: lfaMatrix?.personas?.map(p => p.role) || (realConv as any).context?.stakeholders || [],
        lfaMatrix,
        versions,
        activeVersionId: versions[versions.length - 1]?.id,
      };

      let cachedSavedState: string | null = null;
      try {
        cachedSavedState = localStorage.getItem(`pdc.state.${convId}`);
      } catch {}

      const detectedRegion = (realConv as any).context?.detectedState ||
        (realConv as any).context?.state ||
        cachedSavedState ||
        detectStateInText(challenge) ||
        (lfaMatrix?.challengeStatement ? detectStateInText(lfaMatrix.challengeStatement) : null);

      if (detectedRegion) {
        convContext.detectedState = detectedRegion;
      }

      const messages = pdcApiService.mapRealMessagesToChat(realConv.messages || [], lfaMatrix);

      // Preserve existing multi-turn chat messages so backend does not collapse or wipe out messages!
      let finalMessages = messages;
      try {
        const cachedStr = localStorage.getItem(`pdc.conv.msgs.${convId}`);
        if (cachedStr) {
          const cachedMsgs = JSON.parse(cachedStr);
          if (Array.isArray(cachedMsgs) && cachedMsgs.length >= messages.length) {
            finalMessages = cachedMsgs;
          }
        }
      } catch {}

      if (activeConversation?.id === convId && activeConversation.messages.length > finalMessages.length) {
        finalMessages = activeConversation.messages;
      }

      const isGenericTitle = (t?: string) => !t || /^(new\s+)?programme\s+design(\s+session)?$|^(new\s+)?program\s+design$|^education\s+programme\s+framework$|^new\s+document$|^foundational\s+learning(\s+initiatives?)?$/i.test(t.trim());
      const cleanedRealTitle = realConv.title ? cleanTruncatedTitle(realConv.title, challenge) : '';
      const synthesizedTitle = !isGenericTitle(cleanedRealTitle) 
        ? cleanedRealTitle 
        : challenge 
        ? generateSmartChatName(challenge, detectedRegion)
        : 'New Document';

      const conv: Conversation = {
        id: realConv.id,
        title: synthesizedTitle,
        updatedAt: realConv.updated_at || new Date().toISOString(),
        context: convContext,
        messages: finalMessages,
      };

      // Check if conversation is currently generating
      if (realConv.state === 'generating') {
        const genMsg = realConv.messages?.find(m => m.body?.run_id);
        if (genMsg?.body?.run_id && !activeRunPollingRef.current) {
          pollRunStatus(genMsg.body.run_id, realConv.id, challenge);
        }
      }

      setActiveConversation(conv);
      return conv;
    } catch (err) {
      console.error('[ChatContext] loadFullConversation error:', err);
      return null;
    }
  };

  // Refresh conversation list from backend
  const refreshConversations = async () => {
    try {
      const rawList = await pdcApiService.listConversations();
      const deletedIds = getDeletedConversationIds();
      // Filter out any conversations that have been deleted by the user
      const list = rawList.filter(c => !deletedIds.has(c.id));

      if (list.length === 0) {
        // Create initial clean conversation on backend
        const created = await pdcApiService.createConversation();
        const conv = await loadFullConversation(created.id);
        if (conv) {
          setConversations([conv]);
        }
      } else {
        const mappedList: Conversation[] = list.map(c => {
          const isGenericTitle = (t?: string) => !t || /^(new\s+)?programme\s+design(\s+session)?$|^(new\s+)?program\s+design$|^education\s+programme\s+framework$|^new\s+document$|^foundational\s+learning(\s+initiatives?)?$/i.test(t.trim());
          const cleaned = c.title ? cleanTruncatedTitle(c.title) : '';
          const cleanTitle = !isGenericTitle(cleaned) ? cleaned : 'New Document';
          return {
            id: c.id,
            title: cleanTitle,
            updatedAt: c.updated_at || new Date().toISOString(),
            context: { backendState: c.state, draftId: c.draft_id },
            messages: [],
          };
        });
        setConversations(mappedList);

        // Load active conversation (ensure it's not a deleted conversation)
        const targetId = (activeConversation?.id && !deletedIds.has(activeConversation.id))
          ? activeConversation.id
          : mappedList[0]?.id;
        if (targetId) {
          await loadFullConversation(targetId);
        }
      }
    } catch (err) {
      console.error('[ChatContext] refreshConversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshConversations();
    return () => {
      if (activeRunPollingRef.current) {
        clearInterval(activeRunPollingRef.current);
      }
    };
  }, []);

  const selectConversation = async (id: string) => {
    if (getDeletedConversationIds().has(id)) return;
    setLoading(true);
    await loadFullConversation(id);
    setLoading(false);
  };

  const startNewChat = async () => {
    setSending(true);
    try {
      const created = await pdcApiService.createConversation();
      // Ensure newly created ID is not marked as deleted
      const deletedIds = getDeletedConversationIds();
      if (deletedIds.has(created.id)) {
        deletedIds.delete(created.id);
        try {
          localStorage.setItem(DELETED_CONVS_STORAGE_KEY, JSON.stringify(Array.from(deletedIds)));
        } catch {}
      }

      const newConv: Conversation = {
        id: created.id,
        title: 'New Document',
        updatedAt: created.updated_at || new Date().toISOString(),
        context: { backendState: created.state },
        messages: [],
      };
      setConversations(prev => [newConv, ...prev.filter(c => c.id !== created.id)]);
      setActiveConversation(newConv);
    } catch (err) {
      console.error('[ChatContext] startNewChat error:', err);
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (id: string) => {
    // 1. Mark as permanently deleted in persistent storage so it never re-appears on refresh
    markConversationAsDeleted(id);

    // 2. Fire backend deletion attempt in background (gracefully handled if unsupported)
    pdcApiService.deleteConversation(id).catch(() => {});

    // 3. Update React conversation list state
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);

    // 4. Switch active conversation if the deleted one was currently active
    if (activeConversation?.id === id) {
      if (remaining.length > 0) {
        await selectConversation(remaining[0].id);
      } else {
        await startNewChat();
      }
    }
  };

  const renameConversation = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    await pdcApiService.patchTitle(id, newTitle);
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle } : c))
    );
    if (activeConversation?.id === id) {
      setActiveConversation(prev => (prev ? { ...prev, title: newTitle } : null));
    }
  };

  const sendMessage = async (text: string) => {
    if (!activeConversation || !text.trim()) return;
    const convId = activeConversation.id;
    setSending(true);

    // Optimistically append user message
    const tempUserMsg: ChatMessage = {
      id: `msg-temp-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveConversation(prev => (prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : null));

    const simulateThinkingDelay = () =>
      new Promise<void>(resolve => setTimeout(resolve, 3200 + Math.floor(Math.random() * 1400)));

    try {
      const backendState = activeConversation.context?.backendState;
      await simulateThinkingDelay();

      // 1. Detect state in input or existing context
      const detectedStateInInput = detectStateInText(text);
      let cachedSavedState: string | null = null;
      try {
        cachedSavedState = localStorage.getItem(`pdc.state.${convId}`);
      } catch {}

      const existingState = activeConversation.context?.detectedState ||
        cachedSavedState ||
        (activeConversation.context?.lfaMatrix?.challengeStatement ? detectStateInText(activeConversation.context.lfaMatrix.challengeStatement) : null);
      
      const knownState = existingState || detectedStateInInput;
      const pendingChallenge = activeConversation.context?.pendingChallenge;

      // =========================================================================
      // STEP 2: USER TELLS THE STATE (In response to probe.state / awaiting_state)
      // =========================================================================
      if (backendState === 'awaiting_state' || pendingChallenge) {
        // User is answering the state question!
        const selectedState = detectedStateInInput || detectStateInText(text) || text.trim().replace(/^(in|for|across)\s+/i, '').split(/[(,]/)[0].trim() || 'National Scope';

        try {
          localStorage.setItem(`pdc.state.${convId}`, selectedState);
        } catch {}

        const baseChallenge = (pendingChallenge || activeConversation.context?.challenge || text.trim()).trim().replace(/[.]+$/, '');
        let groundedChallenge = baseChallenge;
        if (!detectStateInText(baseChallenge)) {
          if (/across|in government|in primary|in schools/i.test(baseChallenge)) {
            groundedChallenge = `${baseChallenge} in ${selectedState}.`;
          } else {
            groundedChallenge = `${baseChallenge} across government primary schools in ${selectedState}.`;
          }
        }

        const smartTitle = generateSmartChatName(groundedChallenge, selectedState);

        // "after state ask about the intended impact"
        const impactAskMsg: ChatMessage = {
          id: `msg-impact-ask-${Date.now()}`,
          sender: 'ai',
          text: getLocalizedText('ask.impact', currentLang, { STATE: selectedState, CHALLENGE: groundedChallenge }),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          i18nKey: 'ask.impact',
          i18nVariables: { STATE: selectedState, CHALLENGE: groundedChallenge },
        };

        const currentMat = activeConversation.context?.lfaMatrix;
        let updatedMat = currentMat;
        if (currentMat) {
          updatedMat = {
            ...currentMat,
            title: smartTitle,
            challengeStatement: groundedChallenge,
          };
          updateLFAMatrix(updatedMat, `Grounded challenge to ${selectedState}`);
        }

        pdcApiService.postMessage(convId, { text: `Target state: ${selectedState}.` }).catch(err => {
          console.warn('[ChatContext] backend post error on state grounding:', err);
        });

        setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: smartTitle } : c));
        pdcApiService.patchTitle(convId, smartTitle).catch(() => {});

        setActiveConversation(prev => {
          if (!prev) return null;
          // Clear state selection quick reply pills from previous probe messages once state is given
          const cleanedMessages = prev.messages.map(m => {
            if (m.i18nKey === 'probe.state' || m.id.startsWith('msg-state-probe') || m.quickReplies?.some(r => r.includes('Pan-India') || r.includes('Punjab') || r.includes('Bihar'))) {
              return { ...m, quickReplies: undefined };
            }
            return m;
          });
          return {
            ...prev,
            title: smartTitle,
            context: {
              ...prev.context,
              challenge: groundedChallenge,
              pendingChallenge: undefined,
              needsStateGrounding: false,
              detectedState: selectedState,
              backendState: 'awaiting_impact',
              lfaMatrix: updatedMat || prev.context?.lfaMatrix,
            },
            messages: [...cleanedMessages, impactAskMsg],
          };
        });
        return;
      }

      // =========================================================================
      // STEP 1: INITIAL CHALLENGE DEFINITION (Run BEFORE impact check ONLY when
      // we haven't already recorded a challenge, asked for impact, or grounded state!)
      // =========================================================================
      const hasAskedForImpact = activeConversation.messages.some(
        (m) => m.i18nKey === 'ask.impact' || m.id.startsWith('msg-impact-ask-')
      );
      const isInitialChallengeStage = (
        !activeConversation.context?.challenge &&
        !hasAskedForImpact &&
        !knownState
      ) || (backendState === 'awaiting_challenge' && !hasAskedForImpact && !knownState);
      const isChallenge = isChallengeIntent(text, activeConversation.context);
      if (isInitialChallengeStage && isChallenge && !activeConversation.context?.lfaMatrix?.outcomes?.length) {
        // 1A. State was ALREADY mentioned in the initial challenge!
        if (detectedStateInInput) {
          const stateName = detectedStateInInput;
          try {
            localStorage.setItem(`pdc.state.${convId}`, stateName);
          } catch {}

          const smartTitle = generateSmartChatName(text.trim(), stateName);
          const impactAskMsg: ChatMessage = {
            id: `msg-impact-ask-${Date.now()}`,
            sender: 'ai',
            text: getLocalizedText('ask.impact', currentLang, { STATE: stateName, CHALLENGE: text.trim() }),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            i18nKey: 'ask.impact',
            i18nVariables: { STATE: stateName, CHALLENGE: text.trim() },
          };

          const currentMat = activeConversation.context?.lfaMatrix;
          let updatedMat = currentMat;
          if (currentMat) {
            updatedMat = {
              ...currentMat,
              title: smartTitle,
              challengeStatement: text.trim(),
            };
            updateLFAMatrix(updatedMat, `Grounded challenge in ${stateName}`);
          }

          pdcApiService.postMessage(convId, { text: text.trim() }).catch(err => {
            console.warn('[ChatContext] backend post error on initial challenge:', err);
          });

          setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: smartTitle } : c));
          pdcApiService.patchTitle(convId, smartTitle).catch(() => {});

          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              title: smartTitle,
              context: {
                ...prev.context,
                challenge: text.trim(),
                needsStateGrounding: false,
                detectedState: stateName,
                backendState: 'awaiting_impact',
                lfaMatrix: updatedMat || prev.context?.lfaMatrix,
              },
              messages: [...prev.messages, impactAskMsg],
            };
          });
          return;
        }

        // 1B. State was NOT mentioned -> Ask state / probe state with quick replies
        const stateProbeMsg: ChatMessage = {
          id: `msg-state-probe-${Date.now()}`,
          sender: 'ai',
          text: getLocalizedText('probe.state', currentLang, { CHALLENGE: text.trim() }),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          i18nKey: 'probe.state',
          i18nVariables: { CHALLENGE: text.trim() },
          quickReplies: [
            "In Punjab (Primary Schools)",
            "In Rajasthan (300 Primary Schools & Tribal Belts)",
            "In Bihar (Rural Primary Clusters)",
            "In Uttar Pradesh (Basic Education Dept)",
            "In Maharashtra (Zilla Parishad Schools)",
            "In Karnataka (Govt Primary Schools)",
            "National / Pan-India Scope"
          ]
        };

        const currentMat = activeConversation.context?.lfaMatrix;
        if (currentMat) {
          const updatedMat = { ...currentMat, challengeStatement: text.trim() };
          updateLFAMatrix(updatedMat, 'Challenge recorded (Needs State Grounding)');
        }

        setActiveConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            context: {
              ...prev.context,
              challenge: text.trim(),
              pendingChallenge: text.trim(),
              needsStateGrounding: true,
              backendState: 'awaiting_state',
            },
            messages: [...prev.messages, stateProbeMsg],
          };
        });
        return;
      }

      // =========================================================================
      // STEP 3: USER TELLS THE INTENDED IMPACT
      // =========================================================================
      const isImpactInput = (
        backendState === 'awaiting_impact' || 
        backendState === 'reviewing_impact' || 
        hasAskedForImpact ||
        (Boolean(activeConversation.context?.challenge) && isImpactIntent(text))
      );

      if (isImpactInput && !activeConversation.context?.lfaMatrix?.outcomes?.length) {
        // Only ask for state if state was genuinely never provided AND we are not already in awaiting_impact
        if (!knownState && backendState !== 'awaiting_impact' && backendState !== 'reviewing_impact' && !hasAskedForImpact) {
          const challengeSoFar = activeConversation.context?.challenge || text.trim();
          const stateProbeMsg: ChatMessage = {
            id: `msg-state-probe-${Date.now()}`,
            sender: 'ai',
            text: getLocalizedText('probe.state', currentLang, { CHALLENGE: challengeSoFar }),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            i18nKey: 'probe.state',
            i18nVariables: { CHALLENGE: challengeSoFar },
            quickReplies: [
              "In Punjab (Primary Schools)",
              "In Rajasthan (300 Primary Schools & Tribal Belts)",
              "In Bihar (Rural Primary Clusters)",
              "In Uttar Pradesh (Basic Education Dept)",
              "In Maharashtra (Zilla Parishad Schools)",
              "In Karnataka (Govt Primary Schools)",
              "National / Pan-India Scope"
            ]
          };

          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              context: {
                ...prev.context,
                challenge: challengeSoFar,
                pendingChallenge: challengeSoFar,
                needsStateGrounding: true,
                backendState: 'awaiting_state',
              },
              messages: [...prev.messages, stateProbeMsg],
            };
          });
          return;
        }

        // Split by lines or distinct sentences so 1 sentence = 1 impact statement
        const rawLines = text
          .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9%])/g)
          .map(l => l.trim().replace(/^[-*•\d.]+\s*/, ''))
          .filter(Boolean);
        const impactStatements = rawLines.length > 0 ? rawLines : [text.trim()];
        const primaryImpact = impactStatements[0];
        const activeState = knownState || 'your state';
        const challengeText = activeConversation.context?.challenge || `Programme Design in ${activeState}`;

        const currentMat = activeConversation.context?.lfaMatrix;
        const smartTitle = activeConversation.title && activeConversation.title !== 'New Document'
          ? activeConversation.title
          : generateSmartChatName(challengeText, activeState);

        const updatedMat: LFAMatrix = currentMat
          ? {
              ...currentMat,
              title: smartTitle,
              challengeStatement: challengeText,
              impact: {
                statement: impactStatements.join('\n\n'),
                indicators: currentMat.impact?.indicators || '',
              },
              goal: primaryImpact,
            }
          : {
              title: smartTitle,
              frameworkType: 'Foundational Literacy & Numeracy (FLN)',
              challengeStatement: challengeText,
              impact: {
                statement: impactStatements.join('\n\n'),
                indicators: '',
              },
              goal: primaryImpact,
              personas: [],
              outcomes: [],
              activities: [],
              outputs: [],
              resources: [],
              assumptions: [],
              risks: [],
            };

        updateLFAMatrix(updatedMat, 'Intended Impact defined by user');

        pdcApiService.postMessage(convId, { text: primaryImpact }).catch(err => {
          console.warn('[ChatContext] backend post error on impact statement:', err);
        });

        setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: smartTitle } : c));
        pdcApiService.patchTitle(convId, smartTitle).catch(() => {});

        // Generate 3 to 12 tailored Impact Indicator options PER impact statement
        const impactGroups = impactStatements.map((stmt) => ({
          impactStatement: stmt,
          options: generateImpactIndicatorOptions([stmt], activeState, challengeText),
        }));
        const indicatorOptions = impactGroups.flatMap((g) => g.options);

        const indicatorsPromptMsg: ChatMessage = {
          id: `msg-impact-indicators-${Date.now()}`,
          sender: 'ai',
          text: `Great — I've recorded ${impactStatements.length > 1 ? `your **${impactStatements.length} intended impacts**` : 'your intended impact'} for **${activeState}**. Now let's select the measurable **Impact Indicators** for each intended impact (or skip to move directly to stakeholders):`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: getDefaultSources(activeState, updatedMat.frameworkType || 'Foundational Literacy'),
          specificOutput: {
            type: 'impact_indicators_selection',
            impactHeader: 'Intended Impact',
            impactStatements,
            indicatorOptions,
            impactGroups,
          },
        };

        setActiveConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            title: smartTitle,
            context: {
              ...prev.context,
              challenge: challengeText,
              pendingChallenge: undefined,
              needsStateGrounding: false,
              detectedState: activeState,
              backendState: 'selecting_impact_indicators',
              expectedChange: impactStatements.join('\n\n'),
              lfaMatrix: updatedMat,
            },
            messages: [...prev.messages, indicatorsPromptMsg],
          };
        });
        return;
      }

      // Handle Confirming Stakeholders State -> if user sent comma-separated stakeholders
      if (backendState === 'confirming_stakeholders') {
        const potentialStakeholders = text.split(/,|•|\n/).map(s => s.trim()).filter(Boolean);
        if (potentialStakeholders.length > 0) {
          await confirmStakeholders(potentialStakeholders);
          return;
        }
      }

      // Handle Free-Flowing Refinements when Framework is Complete or has a Matrix
      if ((backendState === 'complete' || activeConversation.context?.lfaMatrix) && activeConversation.context?.lfaMatrix) {
        const refinement = handleConversationalRefinement(text, activeConversation.context.lfaMatrix);

        // Synchronize stakeholders list from updated matrix personas
        const updatedPersonas = refinement.updatedMatrix.personas || [];
        const updatedStakeholderNames = updatedPersonas.map(p => p.role);

        // Versioning: Merge into active post-v1.0 version within 5-minute window, or create a new version
        const existingVersions: LFAVersion[] = activeConversation.context?.versions || [];
        const versionTitle = refinement.changeSummary?.item
          ? `${refinement.changeSummary.action.toUpperCase()}: ${refinement.changeSummary.item}`
          : 'Conversational Refinement';
        const { nextVersions, activeVersion: newVersion } = buildNextVersions(
          existingVersions,
          refinement.updatedMatrix,
          'chat_refinement',
          versionTitle
        );

        const aiMsg: ChatMessage = {
          id: `msg-refine-${Date.now()}`,
          sender: 'ai',
          text: refinement.responseMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies: refinement.quickReplies,
          lfaMatrix: refinement.updatedMatrix,
          sources: getDefaultSources(
            activeConversation.context?.detectedState || 'State',
            refinement.updatedMatrix.frameworkType || 'Foundational Literacy'
          ),
        };

        setActiveConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            context: {
              ...prev.context,
              lfaMatrix: refinement.updatedMatrix,
              stakeholders: updatedStakeholderNames,
              versions: nextVersions,
              activeVersionId: newVersion.id,
            },
            messages: [...prev.messages, aiMsg],
          };
        });
        return;
      }

      // Normal message post to real backend
      try {
        const res = await pdcApiService.postMessage(convId, { text });

        // If run triggered
        if (res.run_id) {
          pollRunStatus(res.run_id, convId, text);
        }

        // Reload updated conversation state
        await loadFullConversation(convId, activeConversation.context?.lfaMatrix);
        // Update conversations list title if changed
        if (res.conversation?.title) {
          setConversations(prev =>
            prev.map(c => (c.id === convId ? { ...c, title: res.conversation.title } : c))
          );
        }
      } catch (postErr: any) {
        console.warn('[ChatContext] backend postMessage returned error, evaluating fallback/refinement:', postErr?.message);
        
        // If the backend reports 500, 409, conflict, or if we have a compiled matrix, handle gracefully!
        const currentMat = activeConversation.context?.lfaMatrix;
        if (currentMat) {
          const refinement = handleConversationalRefinement(text, currentMat);
          const aiMsg: ChatMessage = {
            id: `msg-refine-${Date.now()}`,
            sender: 'ai',
            text: refinement.responseMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: refinement.quickReplies,
            lfaMatrix: refinement.updatedMatrix,
            sources: getDefaultSources(
              activeConversation.context?.detectedState || 'State',
              refinement.updatedMatrix.frameworkType || 'Foundational Literacy'
            ),
          };

          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              context: {
                ...prev.context,
                lfaMatrix: refinement.updatedMatrix,
              },
              messages: [...prev.messages, aiMsg],
            };
          });
          return;
        }

        // If no matrix exists and backend threw 500, display a helpful recovery card instead of breaking the chat
        const errorRecoveryMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          sender: 'ai',
          text: `I encountered an unexpected server delay processing: *"${text}"*.\n\nPlease click below to re-submit your challenge or start a fresh design session:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickReplies: [
            "We want to improve Grade 2-3 oral reading fluency across 300 government primary schools in Rajasthan over 12 months.",
            "Start a new session"
          ]
        };

        setActiveConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, errorRecoveryMsg],
          };
        });
      }
    } catch (err) {
      console.error('[ChatContext] sendMessage error:', err);
    } finally {
      setSending(false);
    }
  };

  const confirmImpact = async (scopeAnswers?: Array<{ id: string; answer?: string | null }>) => {
    if (!activeConversation) return;
    const convId = activeConversation.id;
    setSending(true);

    const activeState = activeConversation.context?.detectedState || detectStateInText(activeConversation.context?.challenge || '') || 'your state';
    const stakeholdersMsg: ChatMessage = {
      id: `msg-stakeholders-${Date.now()}`,
      sender: 'ai',
      text: getLocalizedText('confirm.stakeholders', currentLang, { STATE: activeState }),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      i18nKey: 'confirm.stakeholders',
      i18nVariables: { STATE: activeState },
      specificOutput: {
        type: 'confirming_stakeholders',
        suggestedStakeholders: [
          'Students',
          'Teachers',
          'School Leaders (HTs/HMs)',
          'Cluster Resource Persons (CRPs)',
          'Academic Resource Persons (ARPs)',
          'District Institute of Education and Training (DIET)',
          'State Council of Educational Research & Training (SCERT)',
          'Parents & SMC Members'
        ]
      }
    };

    setActiveConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        context: {
          ...prev.context,
          backendState: 'confirming_stakeholders',
        },
        messages: [...prev.messages, stakeholdersMsg],
      };
    });

    try {
      await pdcApiService.confirmImpact(convId, { scope_answers: scopeAnswers });
    } catch (err) {
      console.warn('[ChatContext] backend confirmImpact error (using companion state):', err);
    } finally {
      setSending(false);
    }
  };

  const proceedToStakeholders = (selectedIndicators: string[] | null) => {
    if (!activeConversation) return;
    const activeState = activeConversation.context?.detectedState || detectStateInText(activeConversation.context?.challenge || '') || 'your state';
    const expectedChange = activeConversation.context?.expectedChange || activeConversation.context?.lfaMatrix?.impact?.statement || '';
    const impactLines = expectedChange.split('\n\n').map((s: string) => s.trim()).filter(Boolean);
    const formattedImpacts = impactLines.map((imp: string) => `> *"${imp}"*`).join('\n');

    const currentMat = activeConversation.context?.lfaMatrix;
    let updatedMat = currentMat;
    if (currentMat && selectedIndicators && selectedIndicators.length > 0) {
      updatedMat = {
        ...currentMat,
        impact: {
          ...currentMat.impact,
          indicators: selectedIndicators.join('\n'),
        },
      };
      updateLFAMatrix(updatedMat, `Selected ${selectedIndicators.length} Impact Indicator${selectedIndicators.length > 1 ? 's' : ''}`, false);
    }

    const userSelectionMsg: ChatMessage | null = selectedIndicators && selectedIndicators.length > 0
      ? {
          id: `msg-user-indicators-${Date.now()}`,
          sender: 'user',
          text: `Selected Impact Indicators:\n${selectedIndicators.map(ind => `• ${ind}`).join('\n')}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      : null;

    const stakeholdersMsg: ChatMessage = {
      id: `msg-stakeholders-${Date.now()}`,
      sender: 'ai',
      text: getLocalizedText('ask.stakeholders', currentLang, { STATE: activeState, IMPACTS: formattedImpacts }),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: getDefaultSources(activeState, currentMat?.frameworkType || 'Foundational Literacy'),
      i18nKey: 'ask.stakeholders',
      i18nVariables: { STATE: activeState, IMPACTS: formattedImpacts },
      specificOutput: {
        type: 'confirming_stakeholders',
        suggestedStakeholders: [
          'Students',
          'Teachers',
          'School Leaders (HTs/HMs)',
          'Cluster Resource Persons (CRPs)',
          'Academic Resource Persons (ARPs)',
          'District Institute of Education and Training (DIET)',
          'State Council of Educational Research & Training (SCERT)',
          'Parents & SMC Members'
        ]
      }
    };

    setActiveConversation(prev => {
      if (!prev) return null;
      const cleanedMessages = prev.messages.map(m =>
        m.specificOutput?.type === 'impact_indicators_selection'
          ? { ...m, specificOutput: undefined }
          : m
      );
      return {
        ...prev,
        context: {
          ...prev.context,
          backendState: 'confirming_stakeholders',
          lfaMatrix: updatedMat || prev.context?.lfaMatrix,
        },
        messages: [
          ...cleanedMessages,
          ...(userSelectionMsg ? [userSelectionMsg] : []),
          stakeholdersMsg,
        ],
      };
    });
  };

  const confirmImpactIndicators = async (selectedIndicators: string[]) => {
    setSending(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 3200 + Math.floor(Math.random() * 1200)));
      proceedToStakeholders(selectedIndicators);
    } finally {
      setSending(false);
    }
  };

  const skipImpactIndicators = async () => {
    setSending(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 3000 + Math.floor(Math.random() * 1000)));
      proceedToStakeholders(null);
    } finally {
      setSending(false);
    }
  };

  const confirmStakeholders = async (
    stakeholders: string[],
    customDetails?: Record<string, { description: string; isStateSpecific: boolean }>
  ) => {
    if (!activeConversation) return;
    const convId = activeConversation.id;
    setSending(true);

    const activeState = activeConversation.context?.detectedState || detectStateInText(activeConversation.context?.challenge || '') || 'your state';
    const challengeText = activeConversation.context?.challenge || `FLN Literacy Acceleration in ${activeState}`;

    // 1. User message stating the exact stakeholders/personas selected
    const userStakeholdersMsg: ChatMessage = {
      id: `msg-user-stakeholders-${Date.now()}`,
      sender: 'user',
      text: `Selected Delivery Stakeholders & Personas:\n${stakeholders.map(s => {
        const meta = customDetails?.[s];
        return meta?.description ? `• ${s} — ${meta.description}` : `• ${s}`;
      }).join('\n')}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 2. AI companion confirmation message explicitly repeating the chosen stakeholders
    const aiConfirmMsg: ChatMessage = {
      id: `msg-confirm-stakeholders-${Date.now()}`,
      sender: 'ai',
      text: `${getLocalizedText('stakeholders.selected', currentLang, { STATE: activeState })}\n\n${stakeholders.map(s => `• **${s}**`).join('\n')}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      i18nKey: 'stakeholders.selected',
      i18nVariables: { STATE: activeState },
    };

    const genMsg: ChatMessage = {
      id: `msg-generating-${Date.now()}`,
      sender: 'ai',
      text: `Synthesizing complete 4x4 Logical Framework with ${stakeholders.length} stakeholder workstreams for **${activeState}**...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      specificOutput: {
        type: 'generating',
        runId: `run-${Date.now()}`,
      }
    };

    // Guarantee that every selected stakeholder is included in lfaMatrix personas,
    // and synthesize aligned outcomes, activities, and outputs so Sections 5 & 6 are populated immediately
    // and seamlessly lead into Section 8 (Your LFA) as the crowning final deliverable!
    const currentMat = activeConversation.context?.lfaMatrix;
    let updatedMat = currentMat;
    if (currentMat) {
      const updatedPersonas = stakeholders.map(role => {
        const existing = currentMat.personas?.find((p: any) => p.role?.toLowerCase() === role.toLowerCase());
        const def = findStakeholderDef(role);
        const customMeta = customDetails?.[role];
        const customResp = customMeta?.description
          ? (customMeta.isStateSpecific && activeState && activeState !== 'your state'
              ? `${customMeta.description} (State-specific to ${activeState})`
              : customMeta.description)
          : undefined;
        return existing || {
          role,
          responsibilities: customResp || def?.responsibilities || `Facilitates core program pedagogy routines, observation fidelity, and monitoring for ${role}.`
        };
      });

      // Synthesize outcomes, activities, and outputs for each stakeholder if not already present
      const existingOutcomes = [...(currentMat.outcomes || [])];
      const existingActivities = [...(currentMat.activities || [])];
      const existingOutputs = [...(currentMat.outputs || [])];

      stakeholders.forEach((role, idx) => {
        const def = findStakeholderDef(role);
        const hasOut = existingOutcomes.some(o => o.statement?.toLowerCase().includes(role.toLowerCase()) || (def && o.statement?.toLowerCase().includes(def.shortKey)));
        if (!hasOut) {
          const outcomeStmt = def?.outcomeStmt || `${role} execute structured delivery routines and maintain pedagogical fidelity.`;
          const indA = def?.indicatorA || `% of ${role} completing scheduled review and coaching routines with fidelity`;
          existingOutcomes.push({
            id: `outcome-${idx + 1}-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            statement: outcomeStmt,
            indicator: indA,
            meansOfVerification: 'District monitoring portal registers & supervisory spot-check records.'
          });
        }

        const hasAct = existingActivities.some(a => a.description?.toLowerCase().includes(role.toLowerCase()) || (def && a.description?.toLowerCase().includes(def.shortKey)));
        if (!hasAct) {
          const actDesc = def?.activityDesc || `Institutional capacity building, orientation, and coaching review routines for ${role}.`;
          const metric = def?.activityMetric || 'Operationalized across all targeted schools';
          existingActivities.push({
            id: `act-${idx + 1}-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            description: actDesc,
            metric
          });
        }

        const hasOp = existingOutputs.some(o => o.statement?.toLowerCase().includes(role.toLowerCase()) || (def && o.statement?.toLowerCase().includes(def.shortKey)));
        if (!hasOp) {
          const opStmt = def?.outputStmt || `Monitoring logs, session attendance records, and review registers for ${role} published.`;
          existingOutputs.push({
            id: `out-${idx + 1}-${role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            statement: opStmt
          });
        }
      });

      updatedMat = {
        ...currentMat,
        personas: updatedPersonas,
        outcomes: existingOutcomes,
        activities: existingActivities,
        outputs: existingOutputs,
      };
      updateLFAMatrix(updatedMat, `Configured ${stakeholders.length} Stakeholder Workstreams & Aligned Outcomes`);
    }

    setActiveConversation(prev => {
      if (!prev) return null;
      // Remove any existing confirming_stakeholders interactive selection cards so they disappear upon confirmation
      const cleanedMessages = prev.messages.map(m =>
        m.specificOutput?.type === 'confirming_stakeholders'
          ? { ...m, specificOutput: undefined }
          : m
      );
      return {
        ...prev,
        context: {
          ...prev.context,
          backendState: 'generating',
          stakeholders,
          lfaMatrix: updatedMat || prev.context?.lfaMatrix,
        },
        messages: [...cleanedMessages, userStakeholdersMsg, aiConfirmMsg, genMsg],
      };
    });

    try {
      const stakeholderObjs = stakeholders.map(name => ({ name }));
      const res = await pdcApiService.postMessage(convId, {
        text: stakeholders.join(', '),
        stakeholders: stakeholderObjs,
      });

      if (res.run_id) {
        pollRunStatus(res.run_id, convId, challengeText);
      }
    } catch (err) {
      console.warn('[ChatContext] confirmStakeholders error:', err);
    } finally {
      setSending(false);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!activeConversation) return;
    // Send file summary to chat
    await sendMessage(`[Document Uploaded]: ${file.name} (${Math.round(file.size / 1024)} KB). Please incorporate its evidence and objectives into our program framework.`);
  };

  const submitFeedback = async (_messageId: string, _type: 'up' | 'down', _comments?: string) => {
    // Feedback logged
  };

  const updateLFAMatrix = (
    updatedMatrix: LFAMatrix,
    changeNote?: string,
    notifyInChat: boolean = true,
    isRestore: boolean = false
  ) => {
    if (!activeConversation) return;
    // Respect explicit user edits and deletions without re-synthesizing removed outcomes, activities, or outputs.
    
    const existingVersions: LFAVersion[] = activeConversation.context?.versions || [];
    const hasFullLfa =
      (activeConversation.context?.lfaMatrix?.outcomes?.length || 0) > 0 &&
      (activeConversation.context?.lfaMatrix?.activities?.length || 0) > 0;
    const isPdcComplete =
      activeConversation.context?.backendState === 'complete' ||
      (hasFullLfa && activeConversation.context?.backendState !== 'generating');
    const isFirstVersion = existingVersions.length === 0 || !isPdcComplete;

    let nextVersions: LFAVersion[];
    let newVersion: LFAVersion;

    if (!isPdcComplete) {
      // Until the whole PDC is created, keep everything as v1.0 (update baseline in-place)
      newVersion = {
        id: existingVersions[0]?.id || `ver-init-${activeConversation.id}`,
        versionNumber: 'v1.0',
        title: 'Initial AI Synthesis (v1.0)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAtMs: existingVersions[0]?.createdAtMs || Date.now(),
        source: 'ai_synthesis',
        matrix: JSON.parse(JSON.stringify(updatedMatrix)),
      };
      nextVersions = [newVersion];
    } else {
      const isRestoreAction = isRestore || Boolean(changeNote && /^restored\b/i.test(changeNote));
      const built = buildNextVersions(
        existingVersions,
        updatedMatrix,
        isRestoreAction ? 'restore' : 'preview_edit',
        changeNote || (isRestoreAction ? 'Restored block' : 'Direct edit in preview panel'),
        isRestoreAction
      );
      nextVersions = built.nextVersions;
      newVersion = built.activeVersion;
    }

    // Compute detailed change summary so additions and deletions are clearly reflected in chat
    // For the initial first version, we do not say "Added...", only in subsequent versioning/edits!
    const prevMatrix = activeConversation.context?.lfaMatrix;
    let computedNote = changeNote;
    let computedQuickReplies: string[] | undefined = undefined;
    if (isFirstVersion) {
      computedNote = undefined;
    } else if (!computedNote && prevMatrix) {
      const prevPersonas = prevMatrix.personas || [];
      const newPersonas = updatedMatrix.personas || [];
      const prevOutcomes = prevMatrix.outcomes || [];
      const newOutcomes = updatedMatrix.outcomes || [];
      const prevActivities = prevMatrix.activities || [];
      const newActivities = updatedMatrix.activities || [];

      const prevOutputs = prevMatrix.outputs || [];
      const newOutputs = updatedMatrix.outputs || [];

      if (newPersonas.length > prevPersonas.length) {
        const added = newPersonas.filter((np: any) => !prevPersonas.some((pp: any) => pp.role.toLowerCase() === np.role.toLowerCase()));
        if (added.length > 0) {
          const roleNames = added.map((a: any) => `**${a.role}**`).join(', ');
          const firstAdded = added[0];
          const def = findStakeholderDef(firstAdded.role);
          computedNote = `I have added ${roleNames} to your delivery stakeholders with default outcomes, activity, and output:\n\n` +
            `• **🎯 Outcome (Shift in Practice):** *"${def?.outcomeStmt || `${firstAdded.role} execute structured delivery routines.`}"*\n` +
            `• **⚡ Key Routine (Activity):** *"${def?.activityDesc || `Capacity building and review routines for ${firstAdded.role}.`}"*\n` +
            `• **📦 Tangible Output:** *"${def?.outputStmt || `Monitoring registers and review logs for ${firstAdded.role}.`}"*\n\n` +
            `### **Want to add anything else?**\n` +
            `You can customize these or add more outcomes, activities, or outputs for ${roleNames}.`;
          computedQuickReplies = [
            'No, looks good!',
            `Add custom Outcome for ${firstAdded.role}`,
            `Add custom Activity for ${firstAdded.role}`,
            `Add custom Output for ${firstAdded.role}`,
            'Add another stakeholder'
          ];
        } else {
          computedNote = 'Added a new stakeholder to the framework.';
        }
      } else if (newPersonas.length < prevPersonas.length) {
        const removed = prevPersonas.filter((pp: any) => !newPersonas.some((np: any) => np.role.toLowerCase() === pp.role.toLowerCase()));
        computedNote = removed.length > 0
          ? `Removed stakeholder: ${removed.map((r: any) => `**${r.role}**`).join(', ')}`
          : 'Removed a stakeholder from the framework.';
      } else if (newOutcomes.length > prevOutcomes.length) {
        const added = newOutcomes.filter((no: any) => !prevOutcomes.some((po: any) => po.statement.toLowerCase().trim() === no.statement.toLowerCase().trim()));
        computedNote = added.length > 0
          ? `Added outcome: ${added.map((a: any) => `"${a.statement}"`).join('; ')}`
          : 'Added a new outcome to the framework.';
      } else if (newOutcomes.length < prevOutcomes.length) {
        const removed = prevOutcomes.filter((po: any) => !newOutcomes.some((no: any) => no.statement.toLowerCase().trim() === po.statement.toLowerCase().trim()));
        const fallback = removed[0]?.statement || prevOutcomes.find((po: any, i: number) => newOutcomes[i]?.statement !== po.statement)?.statement;
        computedNote = fallback
          ? `Deleted outcome: "${fallback}"`
          : 'Deleted an outcome from the framework.';
      } else if (newActivities.length > prevActivities.length) {
        const added = newActivities.filter((na: any) => !prevActivities.some((pa: any) => pa.description.toLowerCase().trim() === na.description.toLowerCase().trim()));
        computedNote = added.length > 0
          ? `Added activity: ${added.map((a: any) => `"${a.description}"`).join('; ')}`
          : 'Added a new activity to the framework.';
      } else if (newActivities.length < prevActivities.length) {
        const removed = prevActivities.filter((pa: any) => !newActivities.some((na: any) => na.description.toLowerCase().trim() === pa.description.toLowerCase().trim()));
        const fallback = removed[0]?.description || prevActivities.find((pa: any, i: number) => newActivities[i]?.description !== pa.description)?.description;
        computedNote = fallback
          ? `Deleted activity: "${fallback}"`
          : 'Deleted an activity from the framework.';
      } else if (newOutputs.length > prevOutputs.length) {
        const added = newOutputs.filter((no: any) => !prevOutputs.some((po: any) => po.statement.toLowerCase().trim() === no.statement.toLowerCase().trim()));
        computedNote = added.length > 0
          ? `Added output: ${added.map((a: any) => `"${a.statement}"`).join('; ')}`
          : 'Added a new output to the framework.';
      } else if (newOutputs.length < prevOutputs.length) {
        const removed = prevOutputs.filter((po: any) => !newOutputs.some((no: any) => no.statement.toLowerCase().trim() === po.statement.toLowerCase().trim()));
        const fallback = removed[0]?.statement || prevOutputs.find((po: any, i: number) => newOutputs[i]?.statement !== po.statement)?.statement;
        computedNote = fallback
          ? `Deleted output: "${fallback}"`
          : 'Deleted an output from the framework.';
      } else if (updatedMatrix.challengeStatement !== prevMatrix.challengeStatement) {
        computedNote = `Updated Challenge Statement: "${updatedMatrix.challengeStatement}"`;
      } else if (updatedMatrix.impact?.statement !== prevMatrix.impact?.statement) {
        computedNote = `Updated Intended Impact: "${updatedMatrix.impact?.statement}"`;
      } else {
        // Detect inline edits or regenerations on Outcomes, Activities, Outputs, or Stakeholders
        const editedOutcomeIdx = newOutcomes.findIndex((no: any, i: number) =>
          prevOutcomes[i] && (
            no.statement !== prevOutcomes[i].statement ||
            no.indicator !== prevOutcomes[i].indicator ||
            no.meansOfVerification !== prevOutcomes[i].meansOfVerification
          )
        );
        const editedActIdx = newActivities.findIndex((na: any, i: number) =>
          prevActivities[i] && na.description !== prevActivities[i].description
        );
        const editedOutIdx = newOutputs.findIndex((no: any, i: number) =>
          prevOutputs[i] && no.statement !== prevOutputs[i].statement
        );

        if (editedOutcomeIdx !== -1) {
          const prevO = prevOutcomes[editedOutcomeIdx];
          const newO = newOutcomes[editedOutcomeIdx];
          if (newO.statement !== prevO.statement) {
            computedNote = `Updated Outcome ${editedOutcomeIdx + 1}: "${newO.statement}"`;
          } else if (newO.indicator !== prevO.indicator) {
            computedNote = `Updated Outcome ${editedOutcomeIdx + 1} Indicator: "${newO.indicator}"`;
          } else {
            computedNote = `Updated Outcome ${editedOutcomeIdx + 1} Means of Verification: "${newO.meansOfVerification}"`;
          }
        } else if (editedActIdx !== -1) {
          computedNote = `Updated Activity ${editedActIdx + 1}: "${newActivities[editedActIdx].description}"`;
        } else if (editedOutIdx !== -1) {
          computedNote = `Updated Output ${editedOutIdx + 1}: "${newOutputs[editedOutIdx].statement}"`;
        } else {
          computedNote = 'Updated framework parameters in the preview panel.';
        }
      }
    }

    setActiveConversation(prev => {
      if (!prev) return null;
      const updatedStakeholderNames = updatedMatrix.personas?.map(p => p.role) || prev.context?.stakeholders;
      
      const shouldNotify = notifyInChat && !isFirstVersion && Boolean(computedNote);
      const newMessages = shouldNotify
        ? [
            ...prev.messages,
            {
              id: `msg-sync-${Date.now()}`,
              sender: 'ai' as const,
              text: computedNote || 'Updated the programme framework from the preview panel.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quickReplies: computedQuickReplies,
              lfaMatrix: updatedMatrix,
            }
          ]
        : prev.messages;

      return {
        ...prev,
        context: {
          ...prev.context,
          lfaMatrix: updatedMatrix,
          stakeholders: updatedStakeholderNames,
          versions: nextVersions,
          activeVersionId: newVersion.id,
        },
        messages: newMessages,
      };
    });
  };

  const restoreVersion = (versionId: string) => {
    if (!activeConversation) return;
    setPreviewVersionId(null);
    const versions: LFAVersion[] = activeConversation.context?.versions || [];
    const target = versions.find(v => v.id === versionId);
    if (!target) return;

    const restoredMatrix = JSON.parse(JSON.stringify(target.matrix));
    const nextVerNum = `v1.${versions.length}`;
    const newVersion: LFAVersion = {
      id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      versionNumber: nextVerNum,
      title: `Restored ${target.versionNumber} (${target.title})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAtMs: Date.now(),
      source: 'restore',
      matrix: restoredMatrix,
    };

    const restoreMsg: ChatMessage = {
      id: `msg-restore-${Date.now()}`,
      sender: 'ai',
      text: `↺ **Restored Version ${target.versionNumber}**: *"${target.title}"*.\n\nThe preview panel and logical framework matrix have been reverted to this snapshot.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lfaMatrix: restoredMatrix,
    };

    setActiveConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        context: {
          ...prev.context,
          lfaMatrix: restoredMatrix,
          stakeholders: restoredMatrix.personas?.map((p: any) => p.role) || [],
          versions: [...versions, newVersion],
          activeVersionId: newVersion.id,
        },
        messages: [...prev.messages, restoreMsg],
      };
    });
  };

  const resetAllExamples = async () => {
    await startNewChat();
  };

  const activeVersions: LFAVersion[] = activeConversation?.context?.versions || [];
  const previewVersion = previewVersionId ? activeVersions.find(v => v.id === previewVersionId) || null : null;

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        loading,
        sending,
        generatingProgress,
        activeSources,
        setActiveSources,
        feedbackModalMessageId,
        setFeedbackModalMessageId,
        selectConversation: async (id: string) => {
          setPreviewVersionId(null);
          await selectConversation(id);
        },
        startNewChat: async () => {
          setPreviewVersionId(null);
          await startNewChat();
        },
        deleteConversation,
        renameConversation,
        sendMessage,
        confirmImpact,
        confirmImpactIndicators,
        skipImpactIndicators,
        confirmStakeholders,
        uploadDocument,
        submitFeedback,
        updateLFAMatrix: (updatedMatrix: LFAMatrix, changeNote?: string) => {
          setPreviewVersionId(null);
          updateLFAMatrix(updatedMatrix, changeNote);
        },
        restoreVersion,
        versions: activeVersions,
        previewVersionId,
        setPreviewVersionId,
        previewVersion,
        showDiffAnnotations,
        setShowDiffAnnotations,
        highlightedRowId,
        setHighlightedRowId,
        selectedCitationNum,
        setSelectedCitationNum,
        resetAllExamples,
        notifyFrameworkReady: (stateName?: string) => {
          const targetState = stateName || activeConversation?.context?.detectedState || 'your state';
          notifyFrameworkReady(targetState);
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
