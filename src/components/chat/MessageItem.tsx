import React from 'react';
import { Sparkles, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { ChatMessage } from '../../types/chat';
import { ResponseActionBar } from './ResponseActionBar';
import { ProactiveImprovementCard } from '../lfa/ProactiveImprovementCard';
import { MarkdownContent } from './MarkdownContent';
import { ImpactReviewCard } from './ImpactReviewCard';
import { GeneratingProgressCard } from './GeneratingProgressCard';
import { useChat } from '../../context/ChatContext';
import { triggerCelebratoryConfetti } from '../../utils/confetti';

interface MessageItemProps {
  message: ChatMessage;
  selectedCitationNum?: number | null;
  onSelectCitationNum?: (num: number | null) => void;
  onOpenFeedback: (messageId: string, type: 'up' | 'down') => void;
  onToast: (msg: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  selectedCitationNum,
  onSelectCitationNum,
  onOpenFeedback,
  onToast,
}) => {
  const { activeConversation, setActiveSources, setHighlightedRowId, sendMessage } = useChat();
  const isUser = message.sender === 'user';
  const isReadyMsg = message.i18nKey === 'lfa.ready' || message.id.startsWith('msg-ready-') || message.text.includes('Your Logical Framework is ready');

  // Check if state has already been provided / selected
  const detectedState = activeConversation?.context?.detectedState;
  const isStateGiven = Boolean(
    detectedState &&
    detectedState !== 'State' &&
    detectedState !== 'your state' &&
    detectedState.trim().length > 0
  );

  const messages = activeConversation?.messages || [];
  const msgIndex = messages.findIndex(m => m.id === message.id);
  const hasSubsequentUserMessage = msgIndex !== -1 && messages.slice(msgIndex + 1).some(m => m.sender === 'user');

  const isStateProbe = Boolean(
    message.i18nKey === 'probe.state' ||
    message.id.startsWith('msg-state-probe') ||
    message.text?.toLowerCase().includes('select a state') ||
    message.quickReplies?.some(r => r.includes('Pan-India') || r.includes('Punjab') || r.includes('Bihar'))
  );

  // Once the State is given, or if this message has already received a user reply, hide the CTA pills
  const shouldHideQuickReplies = (isStateProbe && (isStateGiven || hasSubsequentUserMessage)) || hasSubsequentUserMessage;

  // 1. User Message: Soft neutral capsule
  if (isUser) {
    return (
      <div className="flex flex-col items-end my-3 animate-fade-in group">
        <div className="flex items-center gap-1.5 text-[10.5px] text-gray-400 mb-1 px-1 font-medium">
          <span className="font-semibold text-gray-600">Dostam A.</span>
          <span>•</span>
          <span>{message.timestamp}</span>
        </div>
        <div className="bg-[#f0f2f5] hover:bg-[#e7eaf0] transition-colors text-gray-900 rounded-2xl rounded-tr-sm px-4 py-2.5 text-[13.5px] leading-relaxed max-w-[85%] sm:max-w-md font-sans shadow-2xs">
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </div>
    );
  }

  // 2. Assistant Message: Modern Open Canvas Layout
  return (
    <div className="w-full my-4 pb-2 animate-fade-in group">
      {/* Header: Avatar, Name, Role Badge, Timestamp */}
      <div className="flex items-center gap-2 mb-2">
        <img src="/pdc-logo-mark.png" alt="PDC" className="h-5 w-auto object-contain shrink-0" />
        <span className="font-semibold text-[13px] text-gray-900 tracking-tight">
          Companion
        </span>
        <span className="text-[10px] font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
          PDC AI
        </span>
        <span className="text-gray-300 text-xs">•</span>
        <span className="text-[11px] text-gray-400 font-normal">
          {message.timestamp}
        </span>
      </div>

      {/* Message Body: Full Width without awkward left indentation */}
      <div className="text-gray-800 text-[13.5px] leading-relaxed">
        <MarkdownContent
          content={message.text}
          sources={message.sources}
          selectedCitationNum={selectedCitationNum}
          onSelectCitationNum={onSelectCitationNum}
          onSelectSources={setActiveSources}
        />

        {/* Real Backend: Impact Review Card */}
        {message.specificOutput?.type === 'impact_review' && message.specificOutput.impactReview && (
          <ImpactReviewCard impactReview={message.specificOutput.impactReview} />
        )}

        {/* Real Backend: Generating Progress Card */}
        {message.specificOutput?.type === 'generating' && (
          <GeneratingProgressCard runId={message.specificOutput.runId} />
        )}

        {/* Uploaded / Parsed Document Context Card */}
        {message.documentData && (
          <div className="my-3 p-3 bg-white border border-gray-200 rounded-xl text-xs space-y-1 shadow-2xs max-w-md">
            <div className="font-semibold text-purple-600 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> {message.documentData.documentName}
            </div>
            <div className="text-gray-500 text-[11px]">
              Size: {message.documentData.fileSize} • Processed & parsed into curriculum themes
            </div>
          </div>
        )}

        {/* Synced with Logical Framework Notification Pill (Bidirectional hover cue) */}
        {message.lfaMatrix && (
          <div 
            onMouseEnter={() => setHighlightedRowId?.('all-updated')}
            onMouseLeave={() => setHighlightedRowId?.(null)}
            className="my-3 p-3 bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/90 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs max-w-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-purple-950 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Logical Framework synthesized & synced with canvas</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isReadyMsg && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerCelebratoryConfetti();
                  }}
                  className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10.5px] font-semibold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Celebrate milestone again!"
                >
                  <span>🎉 Celebrate</span>
                </button>
              )}
              <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                Highlight in Canvas <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* Proactive Improvement Card */}
        {message.proactiveSuggestion && (
          <div className="my-3 max-w-xl">
            <ProactiveImprovementCard suggestion={message.proactiveSuggestion} />
          </div>
        )}

        {/* Interactive Quick Action Buttons directly in the message (hidden once state is given or replied to) */}
        {!shouldHideQuickReplies && message.quickReplies && message.quickReplies.length > 0 && (
          <div className="my-3 flex flex-wrap gap-1.5 animate-fade-in max-w-xl">
            {message.quickReplies.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(reply)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 hover:border-purple-300 text-[11.5px] font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              >
                <span>{reply}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Actions Row (Copy, Thumbs, TTS, Source Citation Button) */}
        <div className="pt-2.5">
          <ResponseActionBar
            messageId={message.id}
            text={message.text}
            sources={message.sources}
            onOpenFeedback={(type) => onOpenFeedback(message.id, type)}
            onToast={onToast}
          />
        </div>
      </div>
    </div>
  );
};
