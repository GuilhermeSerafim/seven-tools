import type { AgentAdapter } from '@/agents/caloni/adapter';
import { commercialDiagnosisAgentConfig } from '@/agents/diagnostico/config';
import type { Suggestion } from '@/agents/chat';
import { leadQualificationAgentConfig } from '@/agents/leads/config';
import { proposalAgentConfig } from '@/agents/proposal/config';
import type { ReactNode } from 'react';

export interface AgentToolResultContext {
  navigate: (to: string) => void;
  draftHook?: unknown;
  injectSystemMessage: (content: string) => void;
}

export interface AgentConfig {
  id: string;
  name: string;
  subtitle: string;
  avatarSrc: string;
  mission: string;
  suggestions: Suggestion[];
  adapter: AgentAdapter;
  renderResult?: (payload: unknown) => ReactNode;
  onToolResult?: (toolResult: unknown, ctx: AgentToolResultContext) => void;
}

export const placeholderAdapter = (slug: string): AgentAdapter => ({
  async send() {
    return {
      text:
        'Esta ferramenta ainda não foi migrada para o novo formato de chat. ' +
        `Use o fluxo antigo em /tools/${slug}/app enquanto a migração é concluída.`,
    };
  },
});

export const agentRegistry: Record<string, AgentConfig> = {
  'proposta-comercial-smart': proposalAgentConfig,

  'diagnostico-comercial-caloni': commercialDiagnosisAgentConfig,

  'qualificacao-de-leads': leadQualificationAgentConfig,
};
