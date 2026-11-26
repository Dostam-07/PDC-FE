import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface FeedbackModalProps {
  messageId: string;
  initialType?: 'up' | 'down';
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ messageId, initialType = 'up', onClose }) => {
  const { submitFeedback } = useChat();
  const [type, setType] = useState<'up' | 'down'>(initialType);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback(messageId, type, comments);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Click-outside Backdrop */}
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div 
        className="relative bg-white border border-gray-200 text-gray-900 rounded-2xl w-full max-w-sm p-5 shadow-2xl z-10 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Response Feedback"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-semibold text-gray-900">Response Feedback</h3>
        <p className="text-[11.5px] text-gray-500 mt-0.5 mb-4 leading-normal">
          Help improve AI recommendations for programme designers.
        </p>

        {submitted ? (
          <div className="py-6 text-center text-emerald-600 font-medium text-xs animate-fade-in">
            ✓ Thank you! Your feedback has been recorded.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setType('up')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'up'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Beneficial
              </button>

              <button
                type="button"
                onClick={() => setType('down')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  type === 'down'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Needs Work
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share suggestions or context..."
                rows={3}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors cursor-pointer"
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
