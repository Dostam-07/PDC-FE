import React from 'react';
import { SourceCitation } from '../../types/chat';

interface SourceCitationPillProps {
  sources: SourceCitation[];
  onClick?: () => void;
  className?: string;
}

/**
 * 3 Overlapping Institutional Source Logos matching reference UI:
 * 1. Starburst / Bodh Shiksha / National Mission emblem
 * 2. Institutional seal with rising sun, book & laurel wreath
 * 3. Ministry of Education / NCERT globe & open book seal
 */
export const SourceCitationPill: React.FC<SourceCitationPillProps> = ({
  sources,
  onClick,
  className = '',
}) => {
  const count = sources.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white hover:bg-gray-50 border border-gray-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group select-none active:scale-98 ${className}`}
      title={`View ${count} grounded evidence sources & citations`}
    >
      {/* 3 Overlapping Avatar Discs */}
      <div className="flex items-center -space-x-2 shrink-0">
        
        {/* Avatar 1: Multi-color Starburst Emblem */}
        <div className="w-[22px] h-[22px] rounded-full bg-white border-2 border-white ring-1 ring-gray-200/90 shadow-2xs flex items-center justify-center overflow-hidden z-10">
          <svg viewBox="0 0 32 32" className="w-full h-full p-0.5" fill="none">
            {/* Center circle */}
            <circle cx="16" cy="16" r="1.5" fill="#4B5563" />
            {/* Multi-color spokes */}
            <line x1="16" y1="16" x2="26" y2="10" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="27" y2="15" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="22" y2="6" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="16" y2="5" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="10" y2="6" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="6" y2="11" stroke="#9333EA" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="5" y2="16" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="7" y2="22" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="11" y2="26" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="16" y2="27" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="21" y2="25" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="16" x2="25" y2="21" stroke="#9333EA" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Avatar 2: SCERT / Institutional Seal with Rising Sun & Book */}
        <div className="w-[22px] h-[22px] rounded-full bg-white border-2 border-white ring-1 ring-gray-200/90 shadow-2xs flex items-center justify-center overflow-hidden z-20">
          <svg viewBox="0 0 32 32" className="w-full h-full p-0.5" fill="none">
            {/* Outer Blue Ring */}
            <circle cx="16" cy="16" r="14" stroke="#1E3A8A" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="11.5" stroke="#1E3A8A" strokeWidth="0.6" strokeDasharray="1 1" />
            {/* Rising Sun */}
            <circle cx="16" cy="12" r="3.5" fill="#F59E0B" />
            <path d="M12 9L11 8M20 9L21 8M16 6V4M10 12H8M22 12H24" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
            {/* Open Book */}
            <path d="M11 19C13 18 15 18.5 16 20C17 18.5 19 18 21 19V14C19 13.2 17 13.5 16 15C15 13.5 13 13.2 11 14V19Z" fill="#1E3A8A" />
            <path d="M16 15V20" stroke="#FFFFFF" strokeWidth="0.8" />
            {/* Laurel base */}
            <path d="M9 22C11 25 15 26 16 26C17 26 21 25 23 22" stroke="#16A34A" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Avatar 3: NCERT / Education Globe & Book Seal */}
        <div className="w-[22px] h-[22px] rounded-full bg-white border-2 border-white ring-1 ring-gray-200/90 shadow-2xs flex items-center justify-center overflow-hidden z-30">
          <svg viewBox="0 0 32 32" className="w-full h-full p-0.5" fill="none">
            {/* Green laurel wreath on left and right */}
            <path d="M6 16C5.5 12 8 8 11 6M6 16C6.5 20 9 23 12 25" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M26 16C26.5 12 24 8 21 6M26 16C25.5 20 23 23 20 25" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" />
            {/* Globe on top */}
            <circle cx="16" cy="10" r="4.5" fill="#0284C7" />
            <ellipse cx="16" cy="10" rx="2" ry="4.5" stroke="#FFFFFF" strokeWidth="0.6" fill="none" />
            <line x1="11.5" y1="10" x2="20.5" y2="10" stroke="#FFFFFF" strokeWidth="0.6" />
            {/* Open Book on bottom */}
            <path d="M11 21C13 20 15 20.3 16 21.5C17 20.3 19 20 21 21V16C19 15.2 17 15.5 16 16.5C15 15.5 13 15.2 11 16V21Z" fill="#DC2626" />
            <path d="M16 16.5C17 15.5 19 15.2 21 16V21C19 20 17 20.3 16 21.5V16.5Z" fill="#16A34A" />
            <path d="M16 16.5V21.5" stroke="#FFFFFF" strokeWidth="0.8" />
            {/* Bottom holding curve */}
            <path d="M10 23C13 26 19 26 22 23" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

      </div>

      {/* Label Text: Source (N) matching reference font and color */}
      <span className="text-[13px] font-sans font-medium text-gray-700 group-hover:text-gray-950 transition-colors">
        Source ({count})
      </span>
    </button>
  );
};
