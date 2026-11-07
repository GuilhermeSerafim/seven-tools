import { createElement } from 'react';

import { CaloniResultCard } from '@/agents/caloni/CaloniResultCard';
import type { AgentAdapter } from '@/agents/caloni/adapter';
import type { AgentConfig } from '@/agents/registry';
import type { CalonAnalysis } from '@/services/calonService';
import { ProposalDraftPreviewCard } from './ProposalDraftPreviewCard';
import type { ProposalToolResult } from './types';

export const PROPOSAL_AGENT = {
  id: 'proposta-comercial-smart',
  name: 'Caloni',
  subtitle: 'Decisor Comercial — Proposta',
  avatarSrc: '/caloni-photo.jpg.jpg',
  mission:
    'Converse comigo pra criar, editar ou validar uma proposta. Posso analisar PDFs e te ajudar a refinar o pitch.',
} as const;

const runtimeInjectedAdapter: AgentAdapter = {
  async send() {
    throw new Error('proposal adapter must be injected at runtime');
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCalonAnalysis(value: unknown): value is CalonAnalysis {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.overallScore === 'number' &&
    typeof value.overallLabel === 'string' &&
    Array.isArray(value.strongPoints) &&
    Array.isArray(value.weakPoints) &&
    Array.isArray(value.criteria) &&
    Array.isArray(value.suggestions)
  );
}

export const proposalAgentConfig: AgentConfig = {
  id: PROPOSAL_AGENT.id,
  name: PROPOSAL_AGENT.name,
  subtitle: PROPOSAL_AGENT.subtitle,
  avatarSrc: PROPOSAL_AGENT.avatarSrc,
  mission: PROPOSAL_AGENT.mission,
  suggestions: [
    { label: 'Começar proposta nova', action: { kind: 'prefill', text: 'Quero montar uma proposta comercial nova' } },
    { label: 'Editar a última', action: { kind: 'prefill', text: 'Quero ajustar a última proposta que salvei' } },
    { label: 'Validar proposta', action: { kind: 'open-proposal-picker' } },
  ],
  adapter: runtimeInjectedAdapter,
  renderResult: (payload) => {
    if (!isRecord(payload) || typeof payload.kind !== 'string') {
      return null;
    }

    switch (payload.kind) {
      case 'proposal_draft_patch':
        if (!isRecord(payload.patch) || !Array.isArray(payload.missing_required)) {
          return null;
        }

        return createElement(ProposalDraftPreviewCard, {
          patch: payload.patch as Extract<ProposalToolResult, { kind: 'proposal_draft_patch' }>['patch'],
          missingRequired: payload.missing_required.filter((field): field is string => typeof field === 'string'),
          extractedFromPdf: false,
        });
      case 'proposal_validation_report':
        if (!isCalonAnalysis(payload.report)) {
          return null;
        }

        return createElement(CaloniResultCard, { result: payload.report });
      case 'proposal_save_request':
      case 'proposal_update_request':
      case 'proposal_open_existing':
      default:
        return null;
    }
  },
};
