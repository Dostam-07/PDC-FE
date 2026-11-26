import React, { useState } from 'react';
import { Volume2, Mic, Compass, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { speakText, createSpeechRecognition } from '../../services/speech';

export const ConversationalOnboarding: React.FC = () => {
  const { user, completeOnboarding } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: user?.name || 'Dostam A.',
    role: user?.role || 'Program Manager',
    state: user?.state || 'Punjab',
    focusArea: user?.focusArea || 'Foundational Literacy & Numeracy (FLN)',
    language: user?.language || 'English',
  });

  const [currentInput, setCurrentInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const questions = [
    {
      field: 'name',
      question: "Welcome to the Programme Design Companion! Let's get to know you. What is your name?",
      options: ['Dostam A.', 'Rajesh Gupta', 'Ananya Varma'],
    },
    {
      field: 'role',
      question: 'What is your primary role or designation in education programme design?',
      options: ['Program Manager', 'State Education Leader', 'District Education Officer', 'Academic Consultant'],
    },
    {
      field: 'focusArea',
      question: 'What is your main Programme Focus Area?',
      options: [
        'Foundational Literacy & Numeracy (FLN)',
        'Teacher Professional Development (TPD)',
        'School Leadership',
        'Secondary Education Reform',
      ],
    },
    {
      field: 'language',
      question: 'What is your preferred language for responses and outputs?',
      options: ['English', 'Hindi', 'Hinglish', 'Tamil'],
    },
  ];

  if (!user || user.onboarded) return null;

  const currentQ = questions[step];

  const handleNext = (value: string) => {
    const val = value || currentInput;
    if (!val) return;

    const newAnswers = { ...answers, [currentQ.field]: val };
    setAnswers(newAnswers);
    setCurrentInput('');

    if (step < questions.length - 1) {
      setStep(prev => prev + 1);
    } else {
      // Completed all questions
      completeOnboarding(newAnswers);
    }
  };

  const handleVoiceInput = () => {
    const recognition = createSpeechRecognition((text) => {
      setCurrentInput(text);
      setIsListening(false);
    }, (err) => {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    });

    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
              <Compass className="w-4 h-4" /> Program Setup Navigator
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Step {step + 1} of {questions.length}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Chat Question Display */}
        <div className="flex-1 flex flex-col justify-center space-y-6 my-4">
          <div className="flex items-start gap-4">
            <img src="/pdc-logo-mark.png" alt="PDC" className="h-10 w-auto object-contain shrink-0" />

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 text-slate-100 text-base leading-relaxed relative group shadow-sm">
              {currentQ.question}

              <button
                onClick={() => speakText(currentQ.question)}
                title="Listen to question"
                className="mt-3 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
              >
                <Volume2 className="w-3.5 h-3.5" /> Listen (TTS)
              </button>
            </div>
          </div>

          {/* Quick Reply Chips */}
          <div className="flex flex-wrap gap-2 pl-14 pt-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleNext(opt)}
                className="px-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-brand-500 hover:bg-brand-500/10 text-xs font-medium text-slate-200 hover:text-brand-300 transition-all flex items-center gap-1.5"
              >
                {opt} <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={handleVoiceInput}
            title="Voice Input"
            className={`p-3 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext(currentInput)}
            placeholder="Type your response..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />

          <button
            onClick={() => handleNext(currentInput)}
            disabled={!currentInput}
            className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
