import type { ProposalDraft } from './useProposalDraft';
import type { ProposalAssistantResponse, ProposalToolResult } from './types';
import { API_BASE_URL, getStoredToken } from '@/lib/apiClient';

export interface ProposalChatAdapterDeps {
  authToken: string;
  getDraft: () => ProposalDraft | null;
  getCurrentProposalId: () => string | null;
  getLastSavedProposalId: () => string | null;
  getIntentHint: () => 'create' | 'validate' | 'edit' | null;
  apiBaseUrl?: string;
}

export interface AdapterSendInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: Array<{
    filename: string;
    mime_type: string;
    size_bytes: number;
    text_content?: string | null;
  }>;
}

export interface AdapterSendResult {
  reply: string;
  toolResult: ProposalToolResult | null;
}

export interface ProposalChatAdapter {
  send(
    messages: AdapterSendInput[],
    signal: AbortSignal,
    selectedProposalId?: string | null,
  ): Promise<AdapterSendResult>;
}

function removeTrailingSlashes(value: string): string {
  let endIndex = value.length;

  while (endIndex > 0 && value[endIndex - 1] === '/') {
    endIndex -= 1;
  }

  return value.slice(0, endIndex);
}

function removeLeadingSlashes(value: string): string {
  let startIndex = 0;

  while (startIndex < value.length && value[startIndex] === '/') {
    startIndex += 1;
  }

  return value.slice(startIndex);
}

function buildApiUrl(baseUrl: string, path: string): string {
  return `${removeTrailingSlashes(baseUrl)}/${removeLeadingSlashes(path)}`;
}

function removeCombiningMarks(value: string): string {
  let result = '';

  for (const character of value.normalize('NFD')) {
    const charCode = character.charCodeAt(0);

    if (charCode < 0x0300 || charCode > 0x036f) {
      result += character;
    }
  }

  return result;
}

function normalizeIntentText(text: string): string {
  return removeCombiningMarks(text).toLowerCase();
}

function isNewProposalRequest(messages: AdapterSendInput[]): boolean {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');

  if (!latestUserMessage) {
    return false;
  }

  const normalized = normalizeIntentText(latestUserMessage.content);
  return normalized.includes('proposta') && normalized.includes('nova');
}

export function createProposalChatAdapter(deps: ProposalChatAdapterDeps): ProposalChatAdapter {
  return {
    async send(
      messages: AdapterSendInput[],
      signal: AbortSignal,
      selectedProposalId?: string | null,
    ): Promise<AdapterSendResult> {
      const authToken = deps.authToken || getStoredToken() || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(buildApiUrl(deps.apiBaseUrl ?? API_BASE_URL, '/ai/proposal-assistant'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          current_draft: isNewProposalRequest(messages) ? null : deps.getDraft(),
          current_proposal_id: selectedProposalId ?? deps.getCurrentProposalId(),
          last_saved_proposal_id: deps.getLastSavedProposalId(),
          intent_hint: deps.getIntentHint(),
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Proposal assistant request failed with status ${response.status}`);
      }

      const data = (await response.json()) as ProposalAssistantResponse;

      return {
        reply: data.reply,
        toolResult: data.tool_result,
      };
    },
  };
}
