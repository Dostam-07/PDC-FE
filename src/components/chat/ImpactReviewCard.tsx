import React, { useState } from 'react';
import { Target, CheckCircle2, HelpCircle, ArrowRight, Sparkles, Check, Edit2, ShieldCheck, CheckCheck } from 'lucide-react';
import { ImpactReview, ScopeQuestion } from '../../services/pdcApiService';
import { useChat } from '../../context/ChatContext';

interface ImpactReviewCardProps {
  impactReview: ImpactReview;
  onConfirmed?: () => void;
}

// Preset option choices for standard education operational dimensions
function getQuestionChoices(q: ScopeQuestion): string[] {
  const qText = q.question.toLowerCase();

  if (qText.includes('who carries') || qText.includes('who delivers') || qText.includes('class teacher') || qText.includes('volunteer')) {
    return [
      q.suggested_answer || "Regular Grade 2-3 class teachers deliver structured oral reading practice during daily class timetable slots.",
      "Dedicated school literacy volunteers or Shiksha Mitras deliver targeted reading practice.",
      "Peer-guided reading buddy pairs supported by regular class teachers."
    ];
  }

  if (qText.includes('regular class time') || qText.includes('after-school') || qText.includes('remedial session') || qText.includes('inside') || qText.includes('when')) {
    return [
      q.suggested_answer || "Inside regular daily class time during a protected 45-minute foundational reading period.",
      "As a targeted 45-minute daily remedial session before or after school hours.",
      "Integrated into bi-weekly dedicated library and foundational activity periods."
    ];
  }

  if (qText.includes('existing government') || qText.includes('cluster and block') || qText.includes('alongside') || qText.includes('parallel') || qText.includes('governance') || qText.includes('cadre') || qText.includes('who provides')) {
    return [
      q.suggested_answer || "Work through existing government cluster and block academic support structures (CRPs, BEOs, DIET mentors).",
      "Direct NGO delivery working alongside government schools with periodic reporting.",
      "Hybrid model: Joint execution with government DIET mentors supported by program field associates."
    ];
  }

  // Fallback defaults
  if (q.suggested_answer) {
    return [
      q.suggested_answer,
      "Alternative approach customized for high-need school cohorts."
    ];
  }

  return [
    "Delivered through regular school timetable and government administrative cadres.",
    "Targeted remedial delivery for lower fluency bands."
  ];
}

export const ImpactReviewCard: React.FC<ImpactReviewCardProps> = ({
  impactReview,
  onConfirmed,
}) => {
  const { confirmImpact, sending } = useChat();
  const [confirmed, setConfirmed] = useState(impactReview.confirmed || false);

  const primaryImpact = impactReview.impacts?.[0];
  const scopeQuestions = impactReview.scope_questions || [];

  // Manage user choices for operational scope questions
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    scopeQuestions.forEach(q => {
      initial[q.id] = q.suggested_answer || '';
    });
    return initial;
  });

  const [editingCustom, setEditingCustom] = useState<Record<string, boolean>>({});

  const handleSelectChoice = (questionId: string, choice: string) => {
    if (confirmed) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: choice,
    }));
  };

  const handleConfirm = async () => {
    setConfirmed(true);
    const scopeAnswers = scopeQuestions.map(q => {
      const selected = selectedAnswers[q.id];
      const isCustom = selected && selected !== q.suggested_answer;
      return {
        id: q.id,
        answer: isCustom ? selected : null,
      };
    });

    await confirmImpact(scopeAnswers);
    onConfirmed?.();
  };

  return (
    <div className="my-4 p-5 sm:p-6 bg-white border border-gray-200/90 rounded-2xl shadow-sm text-gray-800 space-y-5 max-w-xl animate-fade-in font-sans">
      
      {/* Header */}
      <div className="pb-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-[13.5px] block leading-tight">
              Synthesized Programme Impact & Indicators
            </span>
            <span className="text-[11px] text-gray-500 font-normal">
              Step 2 of 4: Formulate & Validate Impact
            </span>
          </div>
        </div>

        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          Ready for Review
        </span>
      </div>

      {/* Intended Student Impact Statement */}
      {primaryImpact && (
        <div className="space-y-3">
          
          {/* Impact Statement Box */}
          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Intended Student Impact
            </span>
            <p className="text-[14px] font-serif text-gray-950 leading-relaxed">
              "{primaryImpact.statement}"
            </p>
          </div>

          {/* Primary Verifiable Indicators */}
          {primaryImpact.indicators && primaryImpact.indicators.length > 0 && (
            <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                Primary Verifiable Indicators
              </span>
              <div className="space-y-1.5 pt-0.5">
                {primaryImpact.indicators.map((ind, iIdx) => (
                  <div key={iIdx} className="flex items-start gap-2 text-[12.5px] text-gray-800 leading-snug">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Operational Choices Grounded in Your Context */}
      {scopeQuestions.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-800 uppercase tracking-wide">
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Select Your Operational Delivery Choices</span>
            </div>
            <span className="text-[11px] text-gray-500 font-normal">
              Click options to calibrate
            </span>
          </div>

          <div className="space-y-3">
            {scopeQuestions.map((q, idx) => {
              const choices = getQuestionChoices(q);
              const currentChoice = selectedAnswers[q.id];

              return (
                <div key={q.id || idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-gray-200/90 text-xs space-y-2.5 shadow-2xs">
                  <div className="font-semibold text-gray-900 flex items-start gap-2 text-[12.5px] leading-snug">
                    <span className="text-purple-600 font-bold shrink-0">{idx + 1}.</span>
                    <span>{q.question}</span>
                  </div>

                  {/* Interactive Option Pills */}
                  <div className="space-y-2 pt-0.5">
                    {choices.map((choice, cIdx) => {
                      const isSelected = currentChoice === choice;
                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => handleSelectChoice(q.id, choice)}
                          disabled={confirmed}
                          className={`w-full text-left p-3 rounded-lg border text-[12px] leading-relaxed transition-all flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-medium shadow-2xs'
                              : 'bg-white border-gray-200/90 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="flex-1">{choice}</span>
                        </button>
                      );
                    })}

                    {/* Custom text option toggle */}
                    {editingCustom[q.id] ? (
                      <div className="pt-1.5">
                        <input
                          type="text"
                          value={currentChoice}
                          onChange={(e) => handleSelectChoice(q.id, e.target.value)}
                          placeholder="Type custom delivery model..."
                          className="w-full text-xs p-2.5 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-800"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingCustom(prev => ({ ...prev, [q.id]: true }))}
                        className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1 pt-1 cursor-pointer font-medium"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Specify custom choice...</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Actions */}
      <div className="pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
        <span className="text-[11.5px] text-gray-500 font-normal">
          {confirmed ? 'Operational context grounded & saved.' : 'Confirm choices to proceed to stakeholder mapping.'}
        </span>
        <button
          onClick={handleConfirm}
          disabled={confirmed || sending}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[12.5px] font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {confirmed ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Grounded & Confirmed</span>
            </>
          ) : (
            <>
              <span>Confirm Impact & Select Stakeholders</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
