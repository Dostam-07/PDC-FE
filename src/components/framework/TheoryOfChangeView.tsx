import React from 'react';
import { LFAMatrix } from '../../types/lfa';
import { ArrowRight, AlertTriangle, Layers, Target, CheckCircle2, Box, Cpu, Sparkles } from 'lucide-react';

interface TheoryOfChangeViewProps {
  matrix?: LFAMatrix | null;
  onEdit?: () => void;
}

export const TheoryOfChangeView: React.FC<TheoryOfChangeViewProps> = ({ matrix }) => {
  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-semibold text-blue-950">Theory of Change (ToC) Causal Chain</h4>
          <p className="text-xs text-purple-800/80 mt-0.5 leading-relaxed">
            Visualizes the hypothesis of how inputs and activities transform into direct outputs, institutional behavior changes, and sustainable systemic impact without logical leaps.
          </p>
        </div>
      </div>

      {/* Causal Stream Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        
        {/* Step 1: Challenge / Root Problem */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-[11px] uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" /> 1. Root Problem
            </div>
            <p className="text-xs text-gray-800 font-serif leading-relaxed">
              {matrix?.challengeStatement || "Low grade-appropriate reading fluency and student engagement in primary grades."}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
            Baseline deficit identified
          </div>
        </div>

        {/* Step 2: Inputs & Enablers */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-purple-600 font-semibold text-[11px] uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" /> 2. Inputs & Enablers
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {(matrix?.resources || []).length > 0
                ? matrix?.resources.slice(0, 2).join(', ')
                : "Graded readers, teacher mentoring modules, digital observation checklists."}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
            Dedicated human & budget resources
          </div>
        </div>

        {/* Step 3: Outputs (Direct Products) */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-[11px] uppercase tracking-wider mb-2">
              <Box className="w-3.5 h-3.5" /> 3. Direct Outputs
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {(matrix?.outputs || []).length > 0
                ? matrix?.outputs[0].statement
                : "1,200 teachers trained; learning materials in 100% target classrooms."}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
            Deliverables within direct control
          </div>
        </div>

        {/* Step 4: Intermediate Outcomes */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px] uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> 4. Outcomes
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {(matrix?.outcomes || []).length > 0
                ? matrix?.outcomes[0].statement
                : "Teachers adopt daily 90-min reading circles and formative tracking."}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
            Practices & behavior changes
          </div>
        </div>

        {/* Step 5: Systemic Impact */}
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-xs bg-purple-50/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[11px] uppercase tracking-wider mb-2">
              <Target className="w-3.5 h-3.5" /> 5. Systemic Impact
            </div>
            <p className="text-xs text-gray-900 font-serif font-medium leading-relaxed">
              {matrix?.impact?.statement || matrix?.goal || "60% of students attain grade-level oral reading fluency independently."}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-purple-100 text-[10px] text-purple-600 font-medium">
            Sustainable long-term goal
          </div>
        </div>

      </div>

      {/* Causal Verification Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Causal Logic Hypotheses & Safeguards
        </h4>
        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80">
            <span className="font-semibold text-gray-800 block mb-1">“If-Then” Program Hypothesis</span>
            <p className="text-gray-600 leading-relaxed">
              <strong>IF</strong> cluster mentors (CRCs) conduct fortnightly structured observation rubrics and teachers run weekly reading circles, 
              <strong> THEN</strong> classroom pedagogy shifts from rote memorization to diagnostic coaching, 
              <strong> LEADING TO</strong> dramatic gains in oral reading fluency.
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80">
            <span className="font-semibold text-gray-800 block mb-1">Core Safeguards Against Fallacy</span>
            <p className="text-gray-600 leading-relaxed">
              Avoids the common <em>“Training = Learning”</em> fallacy by linking teacher capacity directly to observable classroom practice rubrics and periodic student reading spot checks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
