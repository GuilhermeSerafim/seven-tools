import { API_BASE_URL, getStoredToken } from '@/lib/apiClient';
import type { CommercialDiagnosisAssistantResponse, CommercialDiagnosisToolResult } from './types';

export interface CommercialDiagnosisMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CommercialDiagnosisChatAdapterDeps {
  apiBaseUrl?: string;
}

export interface CommercialDiagnosisAdapterSendResult {
  reply: string;
  toolResult: CommercialDiagnosisToolResult | null;
}

export interface CommercialDiagnosisChatAdapter {
  send(
    messages: CommercialDiagnosisMessage[],
    signal: AbortSignal,
  ): Promise<CommercialDiagnosisAdapterSendResult>;
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

export function createCommercialDiagnosisChatAdapter(
  deps: CommercialDiagnosisChatAdapterDeps = {},
): CommercialDiagnosisChatAdapter {
  return {
    async send(
      messages: CommercialDiagnosisMessage[],
      signal: AbortSignal,
    ): Promise<CommercialDiagnosisAdapterSendResult> {
      const authToken = getStoredToken() || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(
        buildApiUrl(deps.apiBaseUrl ?? API_BASE_URL, '/ai/commercial-diagnosis-assistant'),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages }),
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Commercial diagnosis assistant request failed with status ${response.status}`);
      }

      const data = (await response.json()) as CommercialDiagnosisAssistantResponse;

      return {
        reply: data.reply,
        toolResult: data.tool_result ?? null,
      };
    },
  };
}
