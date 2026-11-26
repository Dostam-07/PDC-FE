import React from 'react';
import { useChat } from '../../context/ChatContext';
import { BookOpen, Users, School, BarChart3, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

interface StarterBlueprintsProps {
  onSelectPrompt?: (text: string) => void;
}

export const StarterBlueprints: React.FC<StarterBlueprintsProps> = ({ onSelectPrompt }) => {
  const { conversations, selectConversation, sendMessage } = useChat();

  const blueprints = [
    {
      id: "conv-punjab-fln",
      icon: BookOpen,
      tag: "Foundational Literacy",
      tagColor: "bg-purple-50 text-purple-700 border-purple-200/80",
      title: "Punjab FLN Literacy Acceleration",
      description: "Scale Grade 2-3 Oral Reading Fluency (ORF) benchmarks across 450 government primary schools.",
      metrics: "60% reading fluency • 1,200 teachers • 90 CRCC mentors",
      prompt: "Showcase the Punjab FLN Literacy intervention framework with full outcomes, indicators, and persona responsibilities."
    },
    {
      id: "conv-knowledge-rag",
      icon: Users,
      tag: "Teacher Mentorship",
      tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      title: "Continuous Teacher Coaching Circles",
      description: "Transform cluster resource coordinators into pedagogical coaches with bi-weekly classroom rubrics.",
      metrics: "85% classroom adoption • Bi-weekly feedback loops",
      prompt: "Let's review the Teacher Mentorship and Professional Development framework."
    },
    {
      id: "conv-school-leadership-lcf",
      icon: School,
      tag: "School Leadership",
      tagColor: "bg-purple-50 text-purple-700 border-purple-200/80",
      title: "Secondary Headmaster Leadership",
      description: "Empower 200 secondary school headmasters with school improvement scorecards and coaching cadences.",
      metrics: "200 schools • 4 key leadership competencies",
      prompt: "Open the School Leadership and Headmaster Development companion."
    },
    {
      id: "conv-metrics-rapid",
      icon: BarChart3,
      tag: "M&E Diagnostic",
      tagColor: "bg-amber-50 text-amber-700 border-amber-200/80",
      title: "State M&E Rapid Learning Cadence",
      description: "Real-time student diagnostic assessment tracking and monthly block data review meetings.",
      metrics: "100% block coverage • Monthly telemetry cadence",
      prompt: "Review the State M&E Rapid Learning framework."
    }
  ];

  const handleSelectBlueprint = async (bp: typeof blueprints[0]) => {
    // If a conversation matching this blueprint exists, select it
    const existing = conversations.find(c => c.id === bp.id);
    if (existing) {
      await selectConversation(existing.id);
    } else {
      // Otherwise send prompt to build it
      if (onSelectPrompt) {
        onSelectPrompt(bp.prompt);
      } else {
        await sendMessage(bp.prompt);
      }
    }
  };

  return (
    <div className="mt-8 space-y-6">
      
      {/* Blueprint Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-md bg-purple-100/80 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[12px] font-semibold text-gray-800 uppercase tracking-wider">
            Jumpstart with a Pre-Built Program Blueprint
          </span>
        </div>
        <p className="text-xs text-gray-500 font-normal">
          Explore complete, research-backed education frameworks with outcomes, indicators, and persona matrices.
        </p>
      </div>

      {/* Blueprint Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3.5">
        {blueprints.map((bp) => {
          const Icon = bp.icon;
          return (
            <div
              key={bp.id}
              onClick={() => handleSelectBlueprint(bp)}
              className="p-4 bg-white hover:bg-slate-50/60 border border-gray-200/90 hover:border-purple-400/90 rounded-xl cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-sm group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${bp.tagColor}`}>
                    {bp.tag}
                  </span>
                  <div className="w-6 h-6 rounded-md bg-gray-50 group-hover:bg-purple-50 text-gray-400 group-hover:text-purple-600 flex items-center justify-center transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h4 className="text-[13px] font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {bp.title}
                </h4>
                <p className="text-[11.5px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {bp.description}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-gray-500 truncate max-w-[200px]">{bp.metrics}</span>
                <span className="font-semibold text-purple-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                  Explore <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Starter Prompts */}
      <div className="pt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mb-2.5">
          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
          <span>Click any prompt to ask the AI Companion in chat:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "We want to improve grade 3 reading fluency in 3 districts of Punjab",
            "Design a cluster mentorship program for 150 primary school teachers",
            "Build a 12-month instructional leadership roadmap for secondary headmasters",
            "Create a community reading circle framework with parent engagement"
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => {
                if (onSelectPrompt) onSelectPrompt(promptText);
              }}
              className="text-left px-3 py-1.5 rounded-full bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 text-xs border border-gray-200/90 hover:border-purple-300 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 group"
            >
              <span className="text-purple-500 font-medium">“</span>
              <span>{promptText}</span>
              <span className="text-purple-500 font-medium">”</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
