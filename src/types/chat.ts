import { LFAMatrix } from './lfa';

export interface SourceCitation {
  citationNum: number;
  name: string;
  domain: string;
  type: 'Websites' | 'PDFs' | 'Research Papers' | 'Government Documents' | 'Uploaded Files' | 'Internal Knowledge Base';
  snippet: string;
  highlightedPassage?: string;
  author?: string;
  date?: string;
  trustScore?: number;
  relevanceScore?: number;
  link?: string;
  pageNumber?: string;
}

export interface TransparencyMetadata {
  totalConsulted: number;
  webCount: number;
  uploadedCount: number;
  internalCount: number;
  confidenceLevel: number; // e.g. 96%
  retrievedFrom: 'RAG Repository' | 'Web Search' | 'Uploaded Documents';
  lastVerified: string;
}

export interface ProactiveSuggestion {
  id: string;
  targetSection: string;
  issue: string;
  reasoning: string;
  proposedChange: string;
  quickAction: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  sources?: SourceCitation[];
  transparency?: TransparencyMetadata;
  lfaMatrix?: LFAMatrix;
  proactiveSuggestion?: ProactiveSuggestion;
  documentData?: any;
  conflictFound?: {
    message: string;
    options: string[];
  };
  specificOutput?: any;
  i18nKey?: string;
  i18nVariables?: Record<string, string>;
}

export interface LFAVersion {
  id: string;
  versionNumber: string;
  title: string;
  timestamp: string;
  createdAtMs?: number;
  source: 'ai_synthesis' | 'chat_refinement' | 'preview_edit' | 'restore';
  matrix: LFAMatrix;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  context: Record<string, any>;
  messages: ChatMessage[];
}
