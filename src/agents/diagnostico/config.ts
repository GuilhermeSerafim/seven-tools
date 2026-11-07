import { createElement } from 'react';

import type { AgentAdapter, AgentInput } from '@/agents/caloni/adapter';
import type { ChatMessage } from '@/agents/chat';
import type { AgentConfig } from '@/agents/registry';
import { CommercialDiagnosisReportCard } from './CommercialDiagnosisReportCard';
import type { CommercialDiagnosisToolResult } from './types';
import type { CommercialDiagnosisMessage } from './useCommercialDiagnosisChatAdapter';
import { createCommercialDiagnosisChatAdapter } from './useCommercialDiagnosisChatAdapter';

export const COMMERCIAL_DIAGNOSIS_AGENT = {
  id: 'diagnostico-comercial-caloni',
  name: 'Raio-X Comercial',
  subtitle: 'Diagnostico comercial',
  avatarSrc: '/caloni-photo.jpg.jpg',
  mission:
    'Converse comigo para diagnosticar sua operacao comercial, encontrar gargalos do funil e fechar um plano prioritario.',
} as const;

const commercialDiagnosisChatAdapter = createCommercialDiagnosisChatAdapter();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isCommercialDiagnosisToolResult(value: unknown): value is CommercialDiagnosisToolResult {
  if (!isRecord(value) || value.kind !== 'commercial_diagnosis_report' || !isRecord(value.report)) {
    return false;
  }

  const report = value.report;

  return (
    typeof report.cenario === 'string' &&
    typeof report.gargalo_principal === 'string' &&
    typeof report.etapa_critica_funil === 'string' &&
    isStringArray(report.sintomas) &&
    typeof report.causa_provavel === 'string' &&
    typeof report.acao_recomendada === 'string' &&
    isStringArray(report.plano_prioritario)
  );
}

function getMessageContent(message: ChatMessage): string {
  return typeof message.content === 'string' ? message.content : '';
}

function buildMessages(input: AgentInput): CommercialDiagnosisMessage[] {
  const historyMessages = input.history
    ?.map((message): CommercialDiagnosisMessage | null => {
      const content = getMessageContent(message).trim();

      if (!content || (message.role !== 'user' && message.role !== 'assistant' && message.role !== 'system')) {
        return null;
      }

      return {
        role: message.role,
        content,
      };
    })
    .filter((message): message is CommercialDiagnosisMessage => message !== null);

  if (historyMessages && historyMessages.length > 0) {
    return historyMessages;
  }

  return [{ role: 'user', content: input.text }];
}

export const commercialDiagnosisAdapter: AgentAdapter = {
  async send(input, signal) {
    const result = await commercialDiagnosisChatAdapter.send(buildMessages(input), signal);

    return {
      text: result.reply,
      ...(result.toolResult ? { payload: result.toolResult } : {}),
    };
  },
};

export const commercialDiagnosisAgentConfig: AgentConfig = {
  id: COMMERCIAL_DIAGNOSIS_AGENT.id,
  name: COMMERCIAL_DIAGNOSIS_AGENT.name,
  subtitle: COMMERCIAL_DIAGNOSIS_AGENT.subtitle,
  avatarSrc: COMMERCIAL_DIAGNOSIS_AGENT.avatarSrc,
  mission: COMMERCIAL_DIAGNOSIS_AGENT.mission,
  suggestions: [
    { label: 'Diagnosticar operacao', action: { kind: 'prefill', text: 'Quero diagnosticar minha operacao comercial' } },
    { label: 'Encontrar gargalo', action: { kind: 'prefill', text: 'Quero encontrar o principal gargalo do meu funil' } },
    { label: 'Fechar plano', action: { kind: 'prefill', text: 'Quero fechar um plano prioritario de acao' } },
  ],
  adapter: commercialDiagnosisAdapter,
  renderResult: (payload) => {
    if (!isCommercialDiagnosisToolResult(payload)) {
      return null;
    }

    return createElement(CommercialDiagnosisReportCard, { report: payload.report });
  },
};
