import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Copy, ThumbsUp, ThumbsDown, Volume2, Check, ArrowDown } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { MessageItem } from './MessageItem';
import { InputBar } from './InputBar';
import { StakeholderBottomDock } from './StakeholderBottomDock';
import { ImpactIndicatorsCard } from './ImpactIndicatorsCard';
import { ThinkingBubble } from './ThinkingBubble';
import { Toast } from '../common/Toast';
import { DocumentUploadModal } from '../document/DocumentUploadModal';
import { getLocalizedText } from '../../utils/i18n';

export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const {
    activeConversation,
    activeSources,
    setActiveSources,
    feedbackModalMessageId,
    setFeedbackModalMessageId,
    sending,
    sendMessage,
    selectedCitationNum,
    setSelectedCitationNum,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevConvIdRef = useRef<string | undefined>(undefined);
  const prevMsgCountRef = useRef<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [welcomeCopied, setWelcomeCopied] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 160;
    setIsAtBottom(atBottom);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setIsAtBottom(true);
  };

  const scrollToMessageTop = (msgId: string, smooth = true) => {
    const container = scrollContainerRef.current;
    const targetEl = messageRefs.current[msgId];
    if (container && targetEl) {
      const topPos = Math.max(0, targetEl.offsetTop - 16);
      container.scrollTo({
        top: topPos,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setTimeout(handleScroll, smooth ? 350 : 50);
    }
  };

  useEffect(() => {
    const convId = activeConversation?.id;
    const msgs = activeConversation?.messages || [];
    const prevConvId = prevConvIdRef.current;
    const prevCount = prevMsgCountRef.current;

    const isConvSwitch = convId !== prevConvId;
    const hasNewMessages = msgs.length > prevCount;

    prevConvIdRef.current = convId;
    prevMsgCountRef.current = msgs.length;

    if (msgs.length === 0) return;

    const newestMsg = msgs[msgs.length - 1];

    // ChatGPT-style scroll behavior:
    // - When a new AI reply arrives (or switching to a chat ending in an AI reply),
    //   scroll to the TOP of the generated AI message so the user reads from the beginning.
    // - When the user sends a message or AI is actively thinking, scroll down to show the prompt & thinking bubble.
    if (isConvSwitch || hasNewMessages) {
      if (newestMsg.sender === 'ai') {
        requestAnimationFrame(() => {
          scrollToMessageTop(newestMsg.id, !isConvSwitch);
        });
      } else {
        scrollToBottom(!isConvSwitch);
      }
      return;
    }

    if (sending && isAtBottom) {
      scrollToBottom(true);
    }
  }, [activeConversation?.id, activeConversation?.messages, sending]);

  const lastMessage = activeConversation?.messages[activeConversation.messages.length - 1];
  const transparency = lastMessage?.transparency;
  const hasMessages = (activeConversation?.messages && activeConversation.messages.length > 0);
  const isConfirmingStakeholders = activeConversation?.context?.backendState === 'confirming_stakeholders';
  const stakeholderMsg = [...(activeConversation?.messages || [])]
    .reverse()
    .find(m => m.specificOutput?.type === 'confirming_stakeholders');
  const suggestedStakeholders = stakeholderMsg?.specificOutput?.type === 'confirming_stakeholders'
    ? stakeholderMsg.specificOutput.suggestedStakeholders
    : undefined;

  const isSelectingImpactIndicators = activeConversation?.context?.backendState === 'selecting_impact_indicators';
  const impactIndicatorsMsg = [...(activeConversation?.messages || [])]
    .reverse()
    .find(m => m.specificOutput?.type === 'impact_indicators_selection');

  const userName = user?.name ? user.name.split(' ')[0] : 'Dostam';

  const welcomeText = `Hi ${userName}! I'm your Programme Design Companion.

I can help you:
1. Design an Education Programme (Guided 8-stage LFA matrix creation)
2. Ask a Knowledge or Pedagogy Question (Grounded in education research & state manuals)
3. Generate Specific Components (Outcomes, metrics, personas, or assessment rubrics)

What challenge or question would you like to explore today?`;

  const handleCopyWelcome = async () => {
    try {
      await navigator.clipboard.writeText(welcomeText);
      setWelcomeCopied(true);
      setToastMessage("Copied to clipboard!");
      setTimeout(() => setWelcomeCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      
      {/* Messages Stream Container - Editorial Chat Canvas */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-2 relative"
      >
        {hasMessages ? (
          activeConversation?.messages.map((msg) => (
            <div
              key={msg.id}
              ref={(el) => {
                messageRefs.current[msg.id] = el;
              }}
            >
              <MessageItem
                message={msg}
                selectedCitationNum={selectedCitationNum}
                onSelectCitationNum={(num) => setSelectedCitationNum(num)}
                onOpenFeedback={(msgId) => setFeedbackModalMessageId(msgId)}
                onToast={(msg) => setToastMessage(msg)}
              />
            </div>
          ))
        ) : (
          /* Welcome Card + Curated Starter Challenges - compact, perfectly proportioned to fit in one view */
          <div className="h-full flex flex-col justify-center items-center py-2 px-3 sm:px-4 max-w-lg mx-auto animate-fade-in space-y-3">
            <div className="w-full bg-[#f8fafc]/95 hover:bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/70 text-[10.5px] font-medium mb-2.5">
                <span>New Design Workspace</span>
              </div>
              <h3 className="text-[20px] sm:text-[22px] font-serif font-normal text-gray-900 leading-snug tracking-tight">
                {getLocalizedText('welcome.title', user?.language || 'English')}
              </h3>
              <p className="text-[12.5px] text-gray-600 font-sans mt-1.5 leading-relaxed">
                {getLocalizedText('welcome.subtitle', user?.language || 'English')}
              </p>
            </div>

            {/* Quick Explore Options to choose from */}
            <div className="w-full space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block px-1">
                Explore an education challenge:
              </span>
              <div className="grid gap-1.5">
                {[
                  {
                    title: "Foundational Literacy & Oral Reading Fluency",
                    desc: "Grade 2–3 reading gaps, guided phonics routines & teacher coaching",
                    prompt: "We want to design a programme to improve Grade 2-3 reading fluency and comprehension."
                  },
                  {
                    title: "Seasonal Migration & Middle School Retention",
                    desc: "Attendance dropouts, bridge schooling, and community tracking",
                    prompt: "Help me design an intervention targeting student retention and seasonal migration dropouts."
                  },
                  {
                    title: "Secondary Instructional Leadership",
                    desc: "Headmaster coaching scorecards, classroom observations & review cadences",
                    prompt: "Design an instructional leadership roadmap for secondary school headmasters."
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(item.prompt)}
                    className="text-left w-full px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50/60 border border-gray-200 hover:border-purple-200 transition-all shadow-2xs hover:shadow-xs group cursor-pointer active:scale-[0.99]"
                  >
                    <div className="text-[12px] font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[10.5px] text-gray-500 mt-0.5 line-clamp-1">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Thinking Indicator */}
        {sending && <ThinkingBubble />}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Pill (Appears when user scrolls up to review prior turns) */}
      {!isAtBottom && hasMessages && (
        <div className="absolute bottom-[108px] right-6 z-20 animate-fade-in pointer-events-auto">
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-white text-purple-700 shadow-md shadow-purple-950/10 border border-purple-200/90 hover:border-purple-300 hover:bg-purple-50/60 text-[11.5px] font-semibold transition-all cursor-pointer group active:scale-95 whitespace-nowrap"
            title="Scroll to latest message"
          >
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:translate-y-0.5 transition-transform">
              <ArrowDown className="w-3 h-3 stroke-[2.6]" />
            </span>
            <span>Latest message</span>
          </button>
        </div>
      )}

      {/* Bottom Input Slot: Claude-style Interactive Docks OR Normal Input Bar */}
      {isSelectingImpactIndicators && impactIndicatorsMsg?.specificOutput ? (
        <div className="p-3 bg-white border-t border-gray-100">
          <ImpactIndicatorsCard
            impactHeader={impactIndicatorsMsg.specificOutput.impactHeader}
            impactStatements={impactIndicatorsMsg.specificOutput.impactStatements || []}
            options={impactIndicatorsMsg.specificOutput.indicatorOptions || []}
            impactGroups={impactIndicatorsMsg.specificOutput.impactGroups}
          />
        </div>
      ) : isConfirmingStakeholders ? (
        <StakeholderBottomDock suggestedStakeholders={suggestedStakeholders} />
      ) : (
        <InputBar onOpenDocumentUpload={() => setIsDocModalOpen(true)} />
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
