import React, { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { ProactiveSuggestion } from '../../types/chat';
import { useChat } from '../../context/ChatContext';

interface ProactiveImprovementCardProps {
  suggestion: ProactiveSuggestion;
}

export const ProactiveImprovementCard: React.FC<ProactiveImprovementCardProps> = ({ suggestion }) => {
  const { sendMessage } = useChat();
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');

  const handleAccept = () => {
    setStatus('accepted');
    sendMessage(`Yes, please update ${suggestion.targetSection} with the suggested improvement: "${suggestion.proposedChange}"`);
  };

  const handleDecline = () => {
    setStatus('declined');
  };

  if (status === 'declined') return null;

  return (
    <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-950 shadow-xs animate-fade-in">
      <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px] tracking-wider uppercase mb-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Proactive AI Quality Suggestion
      </div>

      <p className="text-xs font-medium text-amber-900 mb-1">
        Opportunity to strengthen <span className="font-semibold text-amber-800">{suggestion.targetSection}</span>:
      </p>

      <div className="bg-white/80 border border-amber-200/80 rounded-lg p-2.5 my-2 text-xs space-y-1.5">
        <div>
          <span className="font-semibold text-amber-900">Issue:</span> {suggestion.issue}
        </div>
        <div className="text-gray-600 text-[11px]">
          <span className="font-medium text-gray-700">Why it matters:</span> {suggestion.reasoning}
        </div>
        <div className="pt-1 border-t border-amber-100 text-emerald-800 font-medium">
          <span className="font-semibold">Proposed Fix:</span> {suggestion.proposedChange}
        </div>
      </div>

      {status === 'accepted' ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium py-0.5">
          <Check className="w-3.5 h-3.5" /> Suggestion applied to framework!
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={handleAccept}
            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors shadow-xs"
          >
            Accept Suggestion
          </button>
          <button
            onClick={handleDecline}
            className="px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-600 text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
