import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { LFAMatrix } from '../../types/lfa';
import { useAuth } from '../../context/AuthContext';
import { getLocalizedText } from '../../utils/i18n';

export interface SectionMeta {
  id: string;
  label: string;
  roomName: string;
  description?: string;
  iconName?: string;
  doneSubtitle?: string;
  pendingSubtitle?: string;
}

export const DEFAULT_SECTION_ITEMS: SectionMeta[] = [
  {
    id: 'section-challenges',
    label: 'Challenges',
    roomName: 'Challenge Room',
    description: 'Problem diagnosis & root causes',
  },
  {
    id: 'section-impact',
    label: 'Impact',
    roomName: 'Impact Lab',
    description: 'Long-term systemic goal',
  },
  {
    id: 'section-stakeholders',
    label: 'Stakeholders',
    roomName: 'Stakeholders',
    description: 'Target personas & coaching cadences',
  },
  {
    id: 'section-outcomes',
    label: 'Outcomes',
    roomName: 'Outcomes',
    description: 'Observable shifts in practices',
  },
  {
    id: 'section-activities',
    label: 'Activities',
    roomName: 'Activities',
    description: 'Key workstream actions & routines',
  },
  {
    id: 'section-outputs',
    label: 'Outputs',
    roomName: 'Outputs',
    description: 'Direct deliverables & diagnostic kits',
  },
  {
    id: 'section-your-lfa',
    label: 'Your LFA',
    roomName: 'Your LFA',
    description: 'Unified Logical Framework Matrix',
  },
];

interface VerticalNavRailProps {
  activeAnchor: string;
  onSelectAnchor: (id: string) => void;
  matrix?: LFAMatrix | null;
  conversationContext?: Record<string, any>;
  sectionsOrder?: string[];
  onReorderSections?: (newOrder: string[]) => void;
  className?: string;
}

export const VerticalNavRail: React.FC<VerticalNavRailProps> = ({
  activeAnchor,
  onSelectAnchor,
  matrix,
  conversationContext,
  sectionsOrder: externalOrder,
  onReorderSections,
  className = "",
}) => {
  const { user } = useAuth();
  const currentLang = user?.language || 'English';

  const getSectionLocalizedName = (id: string, defaultName: string) => {
    switch (id) {
      case 'section-challenges':
        return getLocalizedText('section.challenges', currentLang);
      case 'section-impact':
        return getLocalizedText('section.impact', currentLang);
      case 'section-stakeholders':
        return getLocalizedText('section.stakeholders', currentLang);
      case 'section-outcomes':
        return getLocalizedText('section.outcomes', currentLang);
      case 'section-activities':
        return getLocalizedText('section.activities', currentLang);
      case 'section-outputs':
        return getLocalizedText('section.outputs', currentLang);
      case 'section-your-lfa':
        return getLocalizedText('section.yourLfa', currentLang);
      default:
        return defaultName;
    }
  };

  // Ordered section IDs state (synced with localStorage)
  const [sectionsOrder, setSectionsOrder] = useState<string[]>(() => {
    if (externalOrder && externalOrder.length > 0) return externalOrder;
    try {
      const saved = localStorage.getItem('pdc_sections_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SECTION_ITEMS.length && !parsed.includes('section-interventions')) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_SECTION_ITEMS.map((item) => item.id);
  });

  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Status mapping for the 7 sections
  const hasChallenges = !!(matrix?.challengeStatement || conversationContext?.challenge);
  const hasImpact = !!(matrix?.impact?.statement || conversationContext?.expectedChange);
  const hasStakeholders = !!(matrix?.personas && matrix.personas.length > 0);
  const hasOutcomes = !!(matrix?.outcomes && matrix.outcomes.length > 0);
  const hasActivities = !!(matrix?.activities && matrix.activities.length > 0);
  const hasOutputs = !!(matrix?.outputs && matrix.outputs.length > 0) || !!(matrix?.resources && matrix.resources.length > 0);
  const hasYourLfa = !!(matrix?.title && (hasImpact || hasOutcomes));

  const sectionsStatus: Record<string, boolean> = {
    'section-challenges': hasChallenges,
    'section-impact': hasImpact,
    'section-stakeholders': hasStakeholders,
    'section-outcomes': hasOutcomes,
    'section-activities': hasActivities,
    'section-outputs': hasOutputs,
    'section-your-lfa': hasYourLfa,
  };

  const completedCount = Object.values(sectionsStatus).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / DEFAULT_SECTION_ITEMS.length) * 100);

  // Map of item details by ID
  const itemMap = React.useMemo(() => {
    const map = new Map<string, SectionMeta>();
    DEFAULT_SECTION_ITEMS.forEach((item) => map.set(item.id, item));
    return map;
  }, []);

  // Ordered list of section metadata
  const orderedItems = React.useMemo(() => {
    return sectionsOrder
      .map((id) => itemMap.get(id))
      .filter((item): item is SectionMeta => Boolean(item));
  }, [sectionsOrder, itemMap]);

  // Sync external order changes
  useEffect(() => {
    if (externalOrder && externalOrder.length === DEFAULT_SECTION_ITEMS.length) {
      setSectionsOrder(externalOrder);
    }
  }, [externalOrder]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const rawData = e.dataTransfer?.getData('text/plain');
    const parsedData = rawData ? parseInt(rawData, 10) : NaN;
    const sourceIndex = draggedIndex !== null ? draggedIndex : (!isNaN(parsedData) ? parsedData : null);

    if (sourceIndex === null || sourceIndex === dropIndex || sourceIndex < 0 || sourceIndex >= sectionsOrder.length) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...sectionsOrder];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setSectionsOrder(updated);
    try {
      localStorage.setItem('pdc_sections_order', JSON.stringify(updated));
    } catch {}
    onReorderSections?.(updated);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultIds = DEFAULT_SECTION_ITEMS.map((item) => item.id);
    setSectionsOrder(defaultIds);
    localStorage.setItem('pdc_sections_order', JSON.stringify(defaultIds));
    onReorderSections?.(defaultIds);
  };

  return (
    <div className={`select-none ${className}`}>
      
      {/* Light, Clean Section Header & Progress Bar (No heavy card boxes or thick borders) */}
      <div className="mb-2.5 px-0.5">
        <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
          <span>Sections</span>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold text-[11px] ${
              progressPercent === 100 ? 'text-emerald-600' : 'text-purple-700'
            }`}>
              {completedCount}/{DEFAULT_SECTION_ITEMS.length}
            </span>
            {JSON.stringify(sectionsOrder) !== JSON.stringify(DEFAULT_SECTION_ITEMS.map(i => i.id)) && (
              <button
                onClick={handleResetOrder}
                className="text-purple-600 hover:text-purple-800 ml-1"
                title="Reset order"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Slim Progress Line */}
        <div className="w-full bg-gray-200/70 h-1 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-purple-600'
            }`}
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>
      </div>

      {/* Clean Names-Only Section Navigation List */}
      <div className="space-y-0.5">
        {orderedItems.map((item, index) => {
          const isActive =
            activeAnchor === item.id ||
            (item.id === 'section-interventions' && activeAnchor === 'section-theme') ||
            (item.id === 'section-challenges' && activeAnchor === 'section-challenge');
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectAnchor(item.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                isActive
                  ? 'bg-purple-100/80 text-purple-950 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 font-normal'
              } ${isDragging ? 'opacity-40 scale-[0.98]' : ''} ${
                isDragOver ? 'border-t border-purple-500 bg-purple-50/50' : ''
              }`}
              title={`Click to jump to ${item.roomName}. Drag to reorder.`}
            >
              <span className="truncate">{getSectionLocalizedName(item.id, item.roomName)}</span>

              <GripVertical className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1.5 cursor-grab" />
            </div>
          );
        })}
      </div>

    </div>
  );
};
