import { createElement } from 'react';

import type { AgentConfig } from '@/agents/registry';
import { LeadQualificationQueueCard } from './LeadQualificationQueueCard';
import { createLeadQualificationChatAdapter } from './adapter';
import { normalizeLeadQualificationQueuePayload } from './types';

export const leadQualificationAgentConfig: AgentConfig = {
  id: 'qualificacao-de-leads',
  name: 'Radar de Leads',
  subtitle: 'Priorizacao comercial por fit e timing',
  avatarSrc: '/caloni-photo.jpg.jpg',
  mission:
    'Converse comigo para qualificar leads, priorizar oportunidades e transformar sinais comerciais em proximas acoes claras.',
  suggestions: [
    {
      label: 'Priorizar leads',
      action: { kind: 'prefill', text: 'Quero priorizar esta lista de leads por fit e urgencia' },
    },
    {
      label: 'Qualificar inbound',
      action: { kind: 'prefill', text: 'Quero qualificar leads inbound e sugerir proxima acao' },
    },
    {
      label: 'Revisar criterios',
      action: { kind: 'prefill', text: 'Quero revisar os criterios de score antes de abordar' },
    },
  ],
  adapter: createLeadQualificationChatAdapter(),
  renderResult: (payload) => {
    if (!normalizeLeadQualificationQueuePayload(payload)) {
      return null;
    }

    return createElement(LeadQualificationQueueCard, { payload });
  },
};
