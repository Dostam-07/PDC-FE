import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Sparkles } from 'lucide-react';

const THINKING_STEPS = [
  'Analyzing your programme context and state administrative structure...',
  'Reviewing aligned learning benchmarks and delivery roles...',
  'Structuring causal logic across outcomes, activities, and indicators...',
  'Formulating clear next steps for your Logical Framework...',
];

export const ThinkingBubble: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < THINKING_STEPS.length - 1 ? prev + 1 : prev));
    }, 950);

    const secTimer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(secTimer);
    };
  }, []);

  return (
    <div className="w-full my-2.5 animate-fade-in font-sans">
      {/* Claude-style minimal collapsible thinking toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-gray-800 transition-colors cursor-pointer py-1 select-none group"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse shrink-0" />
        <span className="font-medium animate-pulse">
          Thinking{elapsedSeconds > 0 ? ` (${elapsedSeconds}s)` : '...'}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        )}
      </button>

      {/* Subtle Claude-style left-bordered reasoning stream when expanded */}
      {isExpanded && (
        <div className="mt-1.5 ml-1.5 pl-3 border-l-2 border-gray-200/90 space-y-1.5 py-0.5 max-w-xl animate-fade-in">
          {THINKING_STEPS.slice(0, currentStepIndex + 1).map((stepText, idx) => {
            const isCurrent = idx === currentStepIndex;
            return (
              <p
                key={idx}
                className={`text-[12px] leading-relaxed ${
                  isCurrent ? 'text-gray-600 animate-pulse' : 'text-gray-400'
                }`}
              >
                {stepText}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};
