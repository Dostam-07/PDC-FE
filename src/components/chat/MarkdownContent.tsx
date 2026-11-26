import React from 'react';
import { SourceCitation } from '../../types/chat';

interface MarkdownContentProps {
  content: string;
  sources?: SourceCitation[];
  selectedCitationNum?: number | null;
  onSelectCitationNum?: (num: number | null) => void;
  onSelectSources?: (sources: SourceCitation[]) => void;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  sources,
  selectedCitationNum,
  onSelectCitationNum,
  onSelectSources,
}) => {
  // Parse inline elements: **bold**, *italic*, and [1] citations
  const renderInline = (text: string) => {
    // Split by citations [1], [2], etc., or bold **text**, or italic *text*
    const tokens = text.split(/(\[\d+\]|\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return tokens.map((token, i) => {
      // 1. Citation [N]
      const citationMatch = token.match(/^\[(\d+)\]$/);
      if (citationMatch) {
        const num = parseInt(citationMatch[1], 10);
        const isSelected = selectedCitationNum === num;
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (sources && onSelectSources) onSelectSources(sources);
              if (onSelectCitationNum) onSelectCitationNum(num);
            }}
            className={`inline-flex items-center justify-center px-1.5 py-0.2 mx-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
              isSelected
                ? 'bg-amber-300 text-amber-950 ring-2 ring-amber-400 scale-105'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
            title={`View evidence citation [${num}]`}
          >
            [{num}]
          </button>
        );
      }

      // 2. Bold **text**
      if (token.startsWith('**') && token.endsWith('**')) {
        const inner = token.slice(2, -2);
        return (
          <strong key={i} className="font-semibold text-gray-900">
            {inner}
          </strong>
        );
      }

      // 3. Italic *text*
      if (token.startsWith('*') && token.endsWith('*')) {
        const inner = token.slice(1, -1);
        return (
          <em key={i} className="italic text-gray-800">
            {inner}
          </em>
        );
      }

      return <span key={i}>{token}</span>;
    });
  };

  // Split content into paragraph / block segments
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 space-y-1 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[13.5px] text-gray-800 leading-relaxed">
              <span className="text-purple-500 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[13.5px] text-gray-800 leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    // 1. Stage Badges e.g. "🎯 **Stage 01: Goal Synthesis**"
    if (line.includes('**Stage ') || line.includes('Stage 0') || line.includes('🔍 **AI Self-Review Analysis:**')) {
      flushList();
      blocks.push(
        <div key={`stage-${i}`} className="my-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50/80 border border-purple-200/70 text-purple-800 font-medium text-[11.5px]">
          <span>{renderInline(line)}</span>
        </div>
      );
      continue;
    }

    // 2. Blockquotes e.g. "> **Programme Goal:** *...*"
    if (line.startsWith('>')) {
      flushList();
      const quoteText = line.replace(/^>\s*/, '');
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="my-2.5 border-l-2 border-purple-500 bg-slate-50/90 rounded-r-lg px-3.5 py-2.5 text-[13px] text-gray-800 leading-relaxed font-sans"
        >
          {renderInline(quoteText)}
        </blockquote>
      );
      continue;
    }

    // 3. Bullet points e.g. "• Item" or "- Item"
    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('* ')) {
      const itemText = line.replace(/^[•\-*]\s*/, '');
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      }
      continue;
    }

    // 4. Numbered list e.g. "1. Item"
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const itemText = numMatch[2];
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ol', items: [itemText] };
      }
      continue;
    }

    // Regular paragraph
    flushList();
    blocks.push(
      <p key={`p-${i}`} className="my-1.5 text-[13.5px] text-gray-800 leading-relaxed font-sans">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{blocks}</div>;
};
