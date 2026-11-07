import type { AgentAdapter, AgentInput } from '@/agents/caloni/adapter';
import { API_BASE_URL, getStoredToken } from '@/lib/apiClient';
import { normalizeLeadQualificationQueuePayload } from './types';

interface LeadQualificationChatAdapterDeps {
  apiBaseUrl?: string;
}

interface AssistantMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  payload?: unknown;
  attachments: Array<{
    filename: string;
    mime_type: string;
    size_bytes: number;
    text_content?: string | null;
  }>;
}

interface LeadQualificationAssistantResponse {
  reply: string;
  tool_result: unknown | null;
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

async function getAttachmentTextContent(
  attachment: AgentInput['attachments'][number],
): Promise<string | null> {
  if (attachment.type !== 'text') {
    return null;
  }

  if (typeof attachment.file.text === 'function') {
    try {
      return await attachment.file.text();
    } catch {
      return null;
    }
  }

  if (typeof FileReader === 'undefined') {
    return null;
  }

  try {
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      });
      reader.addEventListener('error', () => resolve(null));
      reader.readAsText(attachment.file);
    });
  } catch {
    return null;
  }
}

async function attachmentToAssistantInput(attachment: AgentInput['attachments'][number]) {
  return {
    filename: attachment.name,
    mime_type: attachment.file.type || 'application/octet-stream',
    size_bytes: attachment.sizeBytes,
    text_content: await getAttachmentTextContent(attachment),
  };
}

function messageToAssistantInput(
  message: NonNullable<AgentInput['history']>[number],
  attachments: AssistantMessageInput['attachments'],
): AssistantMessageInput {
  const payload = payloadToAssistantInput(message.payload);
  return {
    role: message.role,
    content: typeof message.content === 'string' ? message.content : String(message.content ?? ''),
    ...(payload !== undefined ? { payload } : {}),
    attachments,
  };
}

function payloadToAssistantInput(payload: unknown): unknown | undefined {
  const queue = normalizeLeadQualificationQueuePayload(payload);
  if (!queue) {
    return undefined;
  }

  return {
    kind: 'lead_qualification_queue',
    summary: {
      total_leads: queue.summary.totalLeads,
      highest_score: queue.summary.highestScore,
      primary_action: queue.summary.primaryAction,
    },
    leads: queue.leads.map((lead) => ({
      lead_id: lead.leadId,
      company_name: lead.companyName,
      contact_name: lead.contactName,
      contact_role: lead.contactRole,
      segment: lead.segment,
      company_size: lead.companySize,
      urgency: lead.urgency,
      timing: lead.timing,
      pain_level: lead.painLevel,
      notes: lead.notes,
      score: lead.score,
      tier: lead.tier,
      recommended_action: lead.recommendedAction,
      qualification_reason: lead.qualificationReason,
      risk: lead.risk,
      recommended_next_step: lead.recommendedNextStep,
    })),
  };
}

function findLastUserMessageIndex(history: NonNullable<AgentInput['history']>): number {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].role === 'user') {
      return index;
    }
  }

  return -1;
}

async function buildMessages(input: AgentInput): Promise<AssistantMessageInput[]> {
  const latestAttachments = await Promise.all(input.attachments.map(attachmentToAssistantInput));
  const history = input.history ?? [];

  if (!history.length) {
    return [
      {
        role: 'user',
        content: input.text,
        attachments: latestAttachments,
      },
    ];
  }

  const lastUserMessageIndex = findLastUserMessageIndex(history);

  return history.map((message, index) =>
    messageToAssistantInput(message, index === lastUserMessageIndex ? latestAttachments : []),
  );
}

export function createLeadQualificationChatAdapter(
  deps: LeadQualificationChatAdapterDeps = {},
): AgentAdapter {
  return {
    async send(input, signal) {
      const authToken = getStoredToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(
        buildApiUrl(deps.apiBaseUrl ?? API_BASE_URL, '/ai/lead-qualification-assistant'),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: await buildMessages(input) }),
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Lead qualification assistant request failed with status ${response.status}`);
      }

      const data = (await response.json()) as LeadQualificationAssistantResponse;

      return {
        text: data.reply,
        ...(data.tool_result !== null ? { payload: data.tool_result } : {}),
      };
    },
  };
}
