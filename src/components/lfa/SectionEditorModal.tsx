import React, { useState } from 'react';
import { X, Edit3, Sparkles } from 'lucide-react';
import { LFAMatrix } from '../../types/lfa';
import { useChat } from '../../context/ChatContext';

interface SectionEditorModalProps {
  matrix: LFAMatrix;
  isOpen: boolean;
  onClose: () => void;
}

export const SectionEditorModal: React.FC<SectionEditorModalProps> = ({ matrix, isOpen, onClose }) => {
  const { updateLFAMatrix, sendMessage } = useChat();

  const [selectedSection, setSelectedSection] = useState<'all' | 'goal' | 'outcomes' | 'activities' | 'personas'>('all');
  const [aiInstruction, setAiInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Editable direct fields
  const [goalText, setGoalText] = useState(matrix.goal);
  const [impactText, setImpactText] = useState(matrix.impact?.statement || '');

  if (!isOpen) return null;

  const handleApplyDirectEdit = () => {
    const updated = {
      ...matrix,
      goal: goalText,
      impact: { ...matrix.impact, statement: impactText },
    };
    updateLFAMatrix(updated);
    onClose();
  };

  const handleAiEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInstruction.trim()) return;

    setIsProcessing(true);
    await sendMessage(`Edit ${selectedSection === 'all' ? 'the entire programme' : selectedSection}: "${aiInstruction}"`);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Edit Logical Framework</h3>
              <p className="text-xs text-gray-400">Direct text editing & AI-assisted natural language refinement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1.5 my-3 border-b border-gray-100 pb-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Entire Programme' },
            { id: 'goal', label: 'Programme Goal' },
            { id: 'outcomes', label: 'Outcomes' },
            { id: 'activities', label: 'Activities' },
            { id: 'personas', label: 'Personas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSection(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedSection === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* AI Refinement Input */}
          <form onSubmit={handleAiEdit} className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-purple-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Natural Language Refinement
            </div>
            <p className="text-xs text-purple-900">
              Describe how to modify {selectedSection === 'all' ? 'the programme' : selectedSection} (e.g. "Focus more on community-led reading circles").
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="Ask AI to refine this section..."
                className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600"
              />
              <button
                type="submit"
                disabled={!aiInstruction.trim() || isProcessing}
                className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                Refine
              </button>
            </div>
          </form>

          {/* Direct Fields */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Programme Goal Statement
              </label>
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                rows={2}
                className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-xs text-gray-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Impact Statement
              </label>
              <textarea
                value={impactText}
                onChange={(e) => setImpactText(e.target.value)}
                rows={2}
                className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-xs text-gray-900 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyDirectEdit}
            className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};
