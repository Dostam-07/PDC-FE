import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';

interface PanelSplitterProps {
  id: string;
  isDragging: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  label?: string;
  currentWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export const PanelSplitter: React.FC<PanelSplitterProps> = ({
  id,
  isDragging,
  onResizeStart,
  onDoubleClick,
  label = "Drag to resize panels",
  currentWidth,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      id={id}
      onMouseDown={onResizeStart}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`hidden lg:flex relative items-center justify-center shrink-0 select-none cursor-col-resize z-20 transition-colors w-px h-full self-stretch ${
        isDragging ? 'bg-purple-600' : isHovered ? 'bg-purple-400' : 'bg-gray-200/80'
      } ${className}`}
      title={`${label}${onDoubleClick ? ' • Double-click to reset' : ''}`}
    >
      {/* Invisible expanded grab hit-target for seamless drag experience */}
      <div className="absolute -inset-x-1.5 inset-y-0 cursor-col-resize z-10" />

      {/* Tactile Grab Handle Pill / Notch - clearly visible affordance */}
      <div
        className={`absolute z-20 flex items-center justify-center rounded-full py-1.5 px-0.5 border transition-all duration-150 pointer-events-none ${
          isDragging
            ? 'bg-purple-600 border-purple-700 text-white scale-110 shadow-md opacity-100 ring-2 ring-purple-300'
            : isHovered
            ? 'bg-purple-600 border-purple-600 text-white scale-105 shadow-sm opacity-100'
            : 'bg-white border-gray-300 text-gray-400 shadow-2xs opacity-90'
        }`}
      >
        <GripVertical className="w-2.5 h-3.5 stroke-[2.2]" />
      </div>

      {/* Interactive Tooltip Badge during active drag */}
      {isDragging && currentWidth && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none animate-fade-in flex items-center gap-1.5 border border-gray-700">
          <span>{currentWidth}px</span>
        </div>
      )}
    </div>
  );
};
