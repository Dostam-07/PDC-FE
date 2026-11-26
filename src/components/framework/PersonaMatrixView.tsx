import React from 'react';
import { LFAMatrix } from '../../types/lfa';
import { Users, GraduationCap, School, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PersonaMatrixViewProps {
  matrix?: LFAMatrix | null;
}

export const PersonaMatrixView: React.FC<PersonaMatrixViewProps> = ({ matrix }) => {
  const personas = [
    {
      role: "Primary Classroom Teacher",
      icon: GraduationCap,
      color: "blue",
      currentBehavior: "Delivers textbook-based rote instruction with minimal reading diagnostic tracking.",
      desiredCompetency: "Runs daily structured 90-min reading circles and tracks tier-level student fluency movements.",
      supportAction: "Provided with graded readers, bi-weekly peer circle guides, and diagnostic assessment cards."
    },
    {
      role: "Cluster Resource Coordinator (CRCC)",
      icon: Users,
      color: "emerald",
      currentBehavior: "Conducts administrative inspections focused on registers and infrastructure checklist compliance.",
      desiredCompetency: "Acts as pedagogical mentor; conducts bi-weekly 45-min classroom observations with actionable rubrics.",
      supportAction: "Trained on observation rubrics, equipped with digital mobile monitoring app and coaching prompts."
    },
    {
      role: "School Headmaster / Principal",
      icon: School,
      color: "purple",
      currentBehavior: "Manages general administrative operations with low involvement in primary literacy pedagogy.",
      desiredCompetency: "Leads monthly school-level academic reviews and protects daily literacy instructional time blocks.",
      supportAction: "Receives monthly student learning dashboards and structured agenda templates for staff reviews."
    },
    {
      role: "District Education Officer (DEO)",
      icon: Award,
      color: "amber",
      currentBehavior: "Focuses on annual exam pass percentages with delayed feedback loops.",
      desiredCompetency: "Reviews monthly cluster-level reading tier transitions and allocates support to low-performing blocks.",
      supportAction: "Accesses state analytics dashboard highlighting cluster variances and mentor visit cadences."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
        <Users className="w-5 h-5 text-gray-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-semibold text-gray-900">
            Logical Competency Framework (LCF) & Persona Matrix
          </h4>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            Specifies the behavioral and competency shifts required for each institutional actor in the education delivery system to ensure intervention sustainability.
          </p>
        </div>
      </div>

      {/* Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personas.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div>
                <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-semibold text-gray-900">{p.role}</h5>
                    <span className="text-[10px] text-gray-400 font-medium">Key Stakeholder Tier</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 block mb-0.5">
                      Current Practice / Baseline
                    </span>
                    <p className="text-gray-600">{p.currentBehavior}</p>
                  </div>

                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800 flex items-center gap-1 mb-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Desired Competency Shift
                    </span>
                    <p className="text-emerald-950 font-medium text-[11px] leading-relaxed">
                      {p.desiredCompetency}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 block mb-0.5">
                      Systemic Enablement & Inputs
                    </span>
                    <p className="text-gray-700 text-[11px]">{p.supportAction}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
