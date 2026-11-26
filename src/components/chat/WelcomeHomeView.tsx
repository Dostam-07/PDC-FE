import React, { useState } from 'react';
import { CornerDownRight, Lightbulb } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { InputBar } from './InputBar';
import { DocumentUploadModal } from '../document/DocumentUploadModal';

const QUICK_START_SUGGESTIONS = [
  {
    label: 'Foundational Literacy & Oral Reading Fluency',
    prompt: 'We want to design a programme to improve Grade 2-3 reading fluency and comprehension.',
  },
  {
    label: 'Foundational Numeracy & Math Concepts',
    prompt: 'Design a foundational numeracy intervention to build early arithmetic and problem solving skills.',
  },
  {
    label: 'Seasonal Migration & Middle School Retention',
    prompt: 'Help me design an intervention targeting student retention and seasonal migration dropouts.',
  },
  {
    label: 'Secondary Instructional Leadership',
    prompt: 'Design an instructional leadership roadmap for secondary school headmasters.',
  },
];

export const WelcomeHomeView: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage, sending } = useChat();
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || '';
  const welcomeHeading = firstName ? `Welcome, ${firstName}!` : 'Welcome!';

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#fafafb] flex flex-col items-center justify-center px-4 sm:px-8 py-10 animate-fade-in">
      <div className="w-full max-w-[820px] flex flex-col items-center">
        {/* Personalized Greeting */}
        <h1 className="text-[26px] sm:text-[32px] font-bold text-gray-900 tracking-tight text-center leading-tight">
          {welcomeHeading}
        </h1>
        <p className="text-[13.5px] sm:text-[15px] text-gray-600 font-sans mt-2 text-center sm:whitespace-nowrap leading-relaxed">
          Hi! I&apos;m your Programme Design Companion, I can help you with Designing programs
        </p>

        {/* Centered Pill Input Bar */}
        <div className="w-full max-w-[740px] mt-7">
          <InputBar
            variant="welcome"
            onOpenDocumentUpload={() => setIsDocModalOpen(true)}
          />
        </div>

        {/* Quick Start Suggestions */}
        <div className="w-full max-w-[820px] mt-6">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700 mb-3 px-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Quick start suggestions</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {QUICK_START_SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(item.prompt)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-gray-200/90 hover:border-purple-300 hover:bg-purple-50/50 text-[12px] font-medium text-gray-700 hover:text-purple-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                title={item.prompt}
              >
                <CornerDownRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />
    </div>
  );
};
