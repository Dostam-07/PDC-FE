import React, { useState } from 'react';
import { Download, FileSpreadsheet, X, Check, ArrowDownToLine, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LFAMatrix } from '../../types/lfa';

interface ExportModalProps {
  matrix: LFAMatrix;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ matrix, isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Excel (.xlsx) Workbook Export
  const handleExportExcel = () => {
    setIsDownloading(true);

    setTimeout(() => {
      try {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Logical Framework (LFA)
        const lfaRows: (string | undefined)[][] = [
          ['Programme Title', matrix.title || matrix.goal || 'Programme Design Framework'],
          ['Programme Goal', matrix.goal || 'N/A'],
          ['Challenge / Context', matrix.challengeStatement || 'N/A'],
          ['Generated On', new Date().toLocaleDateString()],
          [],
          [
            'Hierarchy Level',
            'Narrative Statement / Deliverable',
            'Objectively Verifiable Indicator',
            'Means of Verification',
            'Critical Assumptions & Risks',
          ],
          [
            '1. Goal / Impact',
            matrix.impact?.statement || matrix.goal || '',
            matrix.impact?.indicators || '',
            'State evaluation survey & third-party assessment data',
            matrix.assumptions?.[0] || 'System policy continuity',
          ],
          ...(matrix.outcomes || []).map((o, idx) => [
            `2. Outcome ${idx + 1}`,
            o.statement,
            o.indicator,
            o.meansOfVerification,
            matrix.risks?.[idx]?.risk
              ? `Risk: ${matrix.risks[idx].risk} (Mitigation: ${matrix.risks[idx].mitigation})`
              : '',
          ]),
          ...(matrix.outputs || []).map((op, idx) => [
            `3. Output ${idx + 1}`,
            op.statement,
            '100% distribution & training completion targets',
            'Training logs, delivery receipts & platform dashboards',
            'Vendor delivery timelines adhere to scheduled dates',
          ]),
          ...(matrix.activities || []).map((act, idx) => [
            `4. Activity ${idx + 1}`,
            act.description,
            act.metric || 'Milestone progress targets',
            'District PMU registers & timesheets',
            idx === 0 ? `Resources: ${(matrix.resources || []).join(', ') || 'Standard training & diagnostic materials'}` : '',
          ]),
          ...(matrix.assumptions || []).map((a, idx) => [
            `5. Assumption ${idx + 1}`,
            a,
            '',
            '',
            '',
          ]),
        ];

        const lfaSheet = XLSX.utils.aoa_to_sheet(lfaRows);
        lfaSheet['!cols'] = [
          { wch: 22 },
          { wch: 48 },
          { wch: 40 },
          { wch: 36 },
          { wch: 38 },
        ];
        XLSX.utils.book_append_sheet(workbook, lfaSheet, 'Logical Framework');

        // Sheet 2: Stakeholder Personas
        const stakeholderRows: string[][] = [
          ['Stakeholder / Delivery Role', 'Core Responsibilities & Cadence'],
          ...(matrix.personas || []).map((p) => [p.role, p.responsibilities]),
        ];
        const stakeholderSheet = XLSX.utils.aoa_to_sheet(stakeholderRows);
        stakeholderSheet['!cols'] = [{ wch: 34 }, { wch: 68 }];
        XLSX.utils.book_append_sheet(workbook, stakeholderSheet, 'Stakeholders');

        const fileName = (matrix.title || 'Programme_Design_LFA').replace(/[\s\W]+/g, '_');
        XLSX.writeFile(workbook, `${fileName}.xlsx`);

        setDownloadSuccess(true);
      } catch (err) {
        console.error('Excel (.xlsx) export error:', err);
      } finally {
        setIsDownloading(false);
        setTimeout(() => setDownloadSuccess(false), 2500);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Download Programme Design</h3>
              <p className="text-[11px] text-gray-500">Export your complete LFA as an Excel (.xlsx) workbook</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Single Excel (.xlsx) Export Card */}
        <div className="my-5">
          <div
            onClick={handleExportExcel}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
              downloadSuccess
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30 shadow-2xs hover:shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-gray-900">Excel Workbook (.xlsx)</div>
                <div className="text-[11.5px] text-gray-500 mt-1 leading-relaxed">
                  Multi-sheet Microsoft Excel workbook containing your complete Logical Framework Matrix, Outcomes, Activities, Outputs, and Stakeholder Personas.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  downloadSuccess ? 'text-emerald-700' : 'text-emerald-700 group-hover:text-emerald-800'
                }`}
              >
                {isDownloading ? (
                  'Generating Excel (.xlsx)...'
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Downloaded (.xlsx)
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Download Excel (.xlsx)
                  </>
                )}
              </span>
              <span className="text-[10.5px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">.xlsx</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[11px] text-gray-400">
          <div className="flex items-center gap-1 text-emerald-700 font-medium text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Client-side export
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
