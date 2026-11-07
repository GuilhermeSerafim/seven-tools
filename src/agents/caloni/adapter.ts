import calonService, { type CalonAnalysis } from '@/services/calonService';
import type { Attachment, ChatMessage } from '@/agents/chat';

export interface AgentContext {
  proposalId?: string;
}

export interface AgentInput {
  text: string;
  attachments: Attachment[];
  context?: AgentContext;
  history?: ChatMessage[];
}

export interface AgentResponse {
  text: string;
  payload?: unknown;
}

export interface AgentAdapter {
  send: (input: AgentInput, signal: AbortSignal) => Promise<AgentResponse>;
}

export function buildIntroFromResult(result: CalonAnalysis): string {
  const score = result.overallScore.toFixed(1);
  const label = result.overallLabel;
  return `Analisei a proposta. Score: ${score} — ${label}. Vou destacar os pontos principais abaixo.`;
}

export const caloniAdapter: AgentAdapter = {
  async send({ text: _text, attachments, context }, _signal) {
    if (context?.proposalId) {
      const result = await calonService.analyzeByProposalId(context.proposalId);
      return { text: buildIntroFromResult(result), payload: result };
    }

    const pdf = attachments.find((a) => a.type === 'pdf');
    if (pdf) {
      const result = await calonService.analyzeFile(pdf.file);
      return { text: buildIntroFromResult(result), payload: result };
    }

    return {
      text:
        'Pra eu analisar, preciso que você selecione uma proposta salva ou anexe um PDF. Use as opções no início da conversa.',
    };
  },
};
