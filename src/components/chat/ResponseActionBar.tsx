import React, { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, Volume2, Check } from 'lucide-react';
import { SourceCitation } from '../../types/chat';
import { speakText } from '../../services/speech';
import { useChat } from '../../context/ChatContext';
import { SourceCitationPill } from './SourceCitationPill';
import { getDefaultSources } from '../../utils/sourceCitations';

interface ResponseActionBarProps {
  messageId: string;
  text: string;
  sources?: SourceCitation[];
  onOpenFeedback: (type: 'up' | 'down') => void;
  onToast: (msg: string) => void;
}

export const ResponseActionBar: React.FC<ResponseActionBarProps> = ({
  messageId,
  text,
  sources,
  onOpenFeedback,
  onToast,
}) => {
  const { setActiveSources, activeConversation } = useChat();
  const [copied, setCopied] = useState(false);
  const [activeThumb, setActiveThumb] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onToast("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onToast("Couldn't copy response.");
    }
  };

  const handleThumb = (type: 'up' | 'down') => {
    if (activeThumb === type) {
      setActiveThumb(null);
    } else {
      setActiveThumb(type);
      onOpenFeedback(type);
    }
  };

  // Only show sources when genuine source citations are explicitly attached to this message
  const effectiveSources = (sources && sources.length > 0) ? sources : null;

  return (
    <div className="flex items-center justify-between pt-2 text-gray-400 text-xs">
      {/* Left Action Buttons: Copy, Thumbs, Audio */}
      <div className="flex items-center gap-1">
        {/* Copy Action */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          title="Copy response"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
        </button>

        {/* Thumbs Up Action */}
        <button
          onClick={() => handleThumb('up')}
          className={`p-1 rounded transition-colors cursor-pointer ${
            activeThumb === 'up'
              ? 'bg-emerald-50 text-emerald-600'
              : 'hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Beneficial response"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>

        {/* Thumbs Down Action */}
        <button
          onClick={() => handleThumb('down')}
          className={`p-1 rounded transition-colors cursor-pointer ${
            activeThumb === 'down'
              ? 'bg-rose-50 text-rose-600'
              : 'hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Needs improvement"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>

        {/* Audio TTS */}
        <button
          onClick={() => speakText(text)}
          className="p-1 rounded hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          title="Listen to response"
        >
          <Volume2 className="w-3 h-3 text-purple-600" />
        </button>
      </div>

      {/* Right Side: Exact Source (3) Pill matching reference UI */}
      {effectiveSources && effectiveSources.length > 0 && (
        <div className="shrink-0">
          <SourceCitationPill
            sources={effectiveSources}
            onClick={() => setActiveSources(effectiveSources)}
          />
        </div>
      )}
    </div>
  );
};
