import { Conversation, ChatMessage, SourceCitation } from '../types/chat';
import { LFAMatrix } from '../types/lfa';
import { getDefaultSources } from '../utils/sourceCitations';
import { findStakeholderDef } from '../utils/conversationRefinement';

const ACTOR_STORAGE_KEY = 'pdc.actor.v1';

export function getOrCreateActorId(): string {
  if (typeof window === 'undefined') return 'default-actor';
  let actorId = localStorage.getItem(ACTOR_STORAGE_KEY);
  if (!actorId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      actorId = crypto.randomUUID();
    } else {
      actorId = 'actor-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    }
    localStorage.setItem(ACTOR_STORAGE_KEY, actorId);
  }
  return actorId;
}

export interface RealStakeholderGroup {
  level: string;
  stakeholders: string[];
}

export interface RealStakeholdersResponse {
  groups: RealStakeholderGroup[];
  proposed: string[];
}

export interface ScopeQuestion {
  id: string;
  quote?: string;
  question: string;
  dimension?: string;
  why_it_matters?: string;
  suggested_answer?: string;
}

export interface ImpactReview {
  impacts: Array<{
    statement: string;
    indicators: string[];
    origin?: string;
    resolution?: string;
    source_intents?: string[];
  }>;
  confirmed: boolean;
  scope_questions?: ScopeQuestion[];
}

export interface RealMessageBody {
  text?: string;
  scope_intro?: string;
  impact_review?: ImpactReview;
  suggested_stakeholders?: string[];
  run_id?: string;
  draft_id?: string;
  theme?: string;
  impacts?: string[];
  scope_choices?: Array<{ question: string; answer: string; answered: boolean }>;
  stakeholders?: Array<{ name: string; role_title: string | null; responsibilities: string | null }>;
  sources?: SourceCitation[];
}

export interface RealMessage {
  id?: string;
  seq?: number;
  role: 'user' | 'assistant' | 'system';
  kind: 'text' | 'question' | 'answer' | 'draft_ref';
  body: RealMessageBody;
  created_at?: string;
}

export interface RealConversation {
  id: string;
  state: 'awaiting_challenge' | 'awaiting_impact' | 'reviewing_impact' | 'confirming_stakeholders' | 'generating' | 'complete' | string;
  title: string;
  draft_id?: string | null;
  created_at: string;
  updated_at: string;
  messages?: RealMessage[];
}

export interface RealDraft {
  id?: string;
  theme?: { name: { value: string; origin: string } };
  title?: { value: string };
  impacts?: Array<{
    statement: { value: string; origin: string };
    indicators?: Array<{ text: { value: string; origin: string } }>;
  }>;
  stakeholders?: Array<{
    name: { value: string; origin: string };
    role_title?: { value: string | null; origin: string };
    responsibilities?: { value: string | null; origin: string };
  }>;
  outcomes?: Array<{
    id?: string;
    stakeholder?: string;
    statement: { value: string; origin: string };
    indicators?: Array<{
      text: { value: string; origin: string };
      mov?: { value: string; origin: string };
    }>;
    activity?: {
      statement: { value: string; origin: string };
      metric?: { value: string; origin: string };
    };
    output?: {
      statement: { value: string; origin: string };
    };
  }>;
  inputs?: Array<{
    name?: { value: string };
    statement?: { value: string };
    value?: string;
  } | string>;
  assumptions?: {
    text: { value: string; origin: string };
  };
}

class PdcApiService {
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-PDC-Actor': getOrCreateActorId(),
    };
  }

  // List all conversations for the active actor
  async listConversations(): Promise<RealConversation[]> {
    try {
      const res = await fetch('/api/v1/conversations', {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to list conversations`);
      const data = await res.json();
      return data.conversations || [];
    } catch (err) {
      console.error('[PdcApiService] listConversations error:', err);
      return [];
    }
  }

  // Create a brand new conversation on real backend
  async createConversation(): Promise<RealConversation> {
    const res = await fetch('/api/v1/conversations', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create conversation`);
    return await res.json();
  }

  // Fetch full conversation details including messages and state
  async getConversation(id: string): Promise<RealConversation | null> {
    try {
      const res = await fetch(`/api/v1/conversations/${id}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('[PdcApiService] getConversation error:', err);
      return null;
    }
  }

  // Rename conversation title
  async patchTitle(id: string, title: string): Promise<void> {
    try {
      await fetch(`/api/v1/conversations/${id}/title`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ title }),
      });
    } catch (err) {
      console.error('[PdcApiService] patchTitle error:', err);
    }
  }

  // Attempt to delete conversation on backend (if supported)
  async deleteConversation(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/conversations/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch (err) {
      console.warn('[PdcApiService] deleteConversation error/unsupported:', err);
      return false;
    }
  }

  // Post a user message to the conversation
  async postMessage(
    id: string,
    payload: {
      text: string;
      client_msg_id?: string;
      stakeholders?: Array<{ name: string; role_title?: string; responsibilities?: string }> | string[];
    }
  ): Promise<{
    conversation: RealConversation;
    assistant_message?: RealMessage;
    impact_review?: ImpactReview | null;
    stakeholders?: RealStakeholdersResponse | null;
    run_id?: string | null;
    draft?: RealDraft | null;
  }> {
    const client_msg_id = payload.client_msg_id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const body: Record<string, any> = {
      text: payload.text,
      client_msg_id,
    };
    if (payload.stakeholders && payload.stakeholders.length > 0) {
      // Backend expects stakeholders to be an array of objects: [{ name: "..." }]
      body.stakeholders = payload.stakeholders.map((s: any) =>
        typeof s === 'string' ? { name: s } : s
      );
    }

    const res = await fetch(`/api/v1/conversations/${id}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok && res.status !== 202) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    return await res.json();
  }

  // Confirm impact when in reviewing_impact state
  async confirmImpact(
    id: string,
    options?: {
      scope_answers?: Array<{ id: string; answer?: string | null }>;
    }
  ): Promise<{
    conversation: RealConversation;
    assistant_message?: RealMessage;
    stakeholders?: RealStakeholdersResponse | null;
  }> {
    const client_msg_id = `msg-${Date.now()}-confirm`;
    const body: Record<string, any> = { client_msg_id };
    if (options?.scope_answers && options.scope_answers.length > 0) {
      body.scope_answers = options.scope_answers.map(sa => ({
        id: sa.id,
        answer: sa.answer !== undefined ? sa.answer : null,
      }));
    }

    const res = await fetch(`/api/v1/conversations/${id}/impact/confirm`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    return await res.json();
  }

  // Fetch available system stakeholders
  async getStakeholders(): Promise<RealStakeholdersResponse> {
    try {
      const res = await fetch('/api/v1/stakeholders', {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to get stakeholders`);
      return await res.json();
    } catch (err) {
      console.error('[PdcApiService] getStakeholders error:', err);
      return { groups: [], proposed: [] };
    }
  }

  // Poll run status
  async getRun(runId: string): Promise<{
    id: string;
    status: 'running' | 'ok' | 'error';
    draft_id?: string | null;
    error?: any;
  }> {
    const res = await fetch(`/api/v1/runs/${runId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to get run status`);
    return await res.json();
  }

  // Get run detail with live pipeline steps
  async getRunDetail(runId: string): Promise<{
    run: { id: string; status: string; draft_id?: string | null };
    calls?: Array<{ step: string; validation_outcome?: string }>;
  }> {
    try {
      const res = await fetch(`/api/v1/runs/${runId}/detail`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return { run: { id: runId, status: 'running' } };
      return await res.json();
    } catch (err) {
      return { run: { id: runId, status: 'running' } };
    }
  }

  // Fetch generated or updated draft LFA
  async getDraft(draftId: string): Promise<RealDraft | null> {
    try {
      const res = await fetch(`/api/v1/drafts/${draftId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('[PdcApiService] getDraft error:', err);
      return null;
    }
  }

  // Convert real draft object to LFAMatrix for LogicalFrameworkPanel
  mapDraftToMatrix(draft: RealDraft, challengeStatement?: string): LFAMatrix {
    const themeName = draft.theme?.name?.value || 'Logical Framework Analysis (LFA)';
    const title = draft.title?.value || challengeStatement || 'Education Programme Framework';
    const impactStatement = draft.impacts?.[0]?.statement?.value || '';
    const impactIndicator = draft.impacts?.[0]?.indicators?.[0]?.text?.value || '';

    // Map stakeholders to personas (NO "Primary Actors" tag!)
    const personas = (draft.stakeholders || []).map((s) => ({
      role: s.name?.value || '',
      responsibilities: s.responsibilities?.value || 'Facilitates core program pedagogy routines and monitoring fidelity.',
    }));

    // Map outcomes, activities, outputs
    const outcomes: LFAMatrix['outcomes'] = [];
    const activities: LFAMatrix['activities'] = [];
    const outputs: LFAMatrix['outputs'] = [];

    (draft.outcomes || []).forEach((out, idx) => {
      const outcomeId = out.id || `outcome-${idx + 1}`;
      outcomes.push({
        id: outcomeId,
        statement: out.statement?.value || '',
        indicator: out.indicators?.[0]?.text?.value || 'Classroom observation checklist fidelity rate ≥ 85%',
        meansOfVerification: out.indicators?.[0]?.mov?.value || 'Cluster resource monitoring records & monthly spot-checks',
      });

      if (out.activity?.statement?.value) {
        activities.push({
          id: `act-${idx + 1}`,
          description: out.activity.statement.value,
          metric: out.activity.metric?.value || 'Operationalized across all targeted schools',
        });
      }

      if (out.output?.statement?.value) {
        outputs.push({
          id: `out-${idx + 1}`,
          statement: out.output.statement.value,
        });
      }
    });

    // Ensure all stakeholder personas have corresponding outcomes, activities, and outputs populated
    personas.forEach((p, idx) => {
      const role = p.role;
      const def = findStakeholderDef(role);
      const hasOut = outcomes.some(o => o.statement?.toLowerCase().includes(role.toLowerCase()) || (def && o.statement?.toLowerCase().includes(def.shortKey)));
      if (!hasOut) {
        const outcomeStmt = def?.outcomeStmt || `${role} execute structured delivery routines: ${p.responsibilities}`;
        const indA = def?.indicatorA || `% of ${role} completing scheduled review and coaching routines with fidelity`;
        outcomes.push({
          id: `synth-out-${idx + 1}`,
          statement: outcomeStmt,
          indicator: indA,
          meansOfVerification: 'District monitoring portal registers & supervisory spot-check records.'
        });
      }

      const hasAct = activities.some(a => a.description?.toLowerCase().includes(role.toLowerCase()) || (def && a.description?.toLowerCase().includes(def.shortKey)));
      if (!hasAct) {
        const actDesc = def?.activityDesc || `Institutional capacity building, orientation, and coaching review routines for ${role}.`;
        const metric = def?.activityMetric || 'Operationalized across all targeted schools';
        activities.push({
          id: `synth-act-${idx + 1}`,
          description: actDesc,
          metric
        });
      }

      const hasOp = outputs.some(o => o.statement?.toLowerCase().includes(role.toLowerCase()) || (def && o.statement?.toLowerCase().includes(def.shortKey)));
      if (!hasOp) {
        const opStmt = def?.outputStmt || `Monitoring logs, session attendance records, and review meeting registers for ${role} verified.`;
        outputs.push({
          id: `synth-out-${idx + 1}`,
          statement: opStmt
        });
      }
    });

    // Map inputs / resources
    const resources: string[] = [];
    if (draft.inputs && Array.isArray(draft.inputs)) {
      draft.inputs.forEach((inp) => {
        if (typeof inp === 'string') {
          resources.push(inp);
        } else if (inp && typeof inp === 'object') {
          const val = inp.name?.value || inp.statement?.value || inp.value;
          if (val) resources.push(val);
        }
      });
    }

    // Map assumptions & risks
    const assumptions: string[] = [];
    if (draft.assumptions?.text?.value) {
      assumptions.push(draft.assumptions.text.value);
    }

    return {
      title,
      frameworkType: themeName,
      challengeStatement: challengeStatement || '',
      impact: {
        statement: impactStatement,
        indicators: impactIndicator,
      },
      goal: impactStatement,
      personas,
      outcomes,
      activities,
      outputs,
      resources,
      assumptions,
      risks: [],
    };
  }

  // Convert real messages to frontend ChatMessage[]
  mapRealMessagesToChat(realMessages: RealMessage[], lfaMatrix?: LFAMatrix): ChatMessage[] {
    const total = realMessages.length;
    return realMessages.map((m, idx) => {
      const isUser = m.role === 'user';
      let text = m.body?.text || '';

      if (m.kind === 'answer' && m.body?.stakeholders) {
        text = m.body.stakeholders.map((s) => s.name).join(', ');
      }

      const timestamp = m.created_at
        ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Just now';

      const msgSources = (m.body as any)?.sources;
      const shouldAttachDefaultSources =
        !isUser &&
        !(Array.isArray(msgSources) && msgSources.length > 0) &&
        (m.kind === 'draft_ref' || (idx === total - 1 && Boolean(lfaMatrix)));

      const chatMsg: ChatMessage = {
        id: m.id || `msg-${m.seq || idx}`,
        sender: isUser ? 'user' : 'ai',
        text,
        timestamp,
        sources: Array.isArray(msgSources) && msgSources.length > 0
          ? msgSources
          : shouldAttachDefaultSources
          ? getDefaultSources('State', lfaMatrix?.frameworkType || 'Foundational Literacy')
          : undefined,
      };

      // Attach real matrix to draft_ref message or the final message
      if ((m.kind === 'draft_ref' || idx === total - 1) && lfaMatrix) {
        chatMsg.lfaMatrix = lfaMatrix;
      }

      // Attach interactive cards ONLY to the latest/most recent relevant assistant message,
      // so historical messages remain clean text without repeating old interactive cards!
      const isLatestAssistantMessage = (idx === total - 1) || (idx === total - 2 && realMessages[total - 1].role === 'user');

      if (isLatestAssistantMessage) {
        if (m.body?.suggested_stakeholders) {
          chatMsg.specificOutput = {
            type: 'confirming_stakeholders',
            suggestedStakeholders: m.body.suggested_stakeholders,
          };
        } else if (m.body?.run_id) {
          chatMsg.specificOutput = {
            type: 'generating',
            runId: m.body.run_id,
          };
        }
      }

      return chatMsg;
    });
  }
}

export const pdcApiService = new PdcApiService();
