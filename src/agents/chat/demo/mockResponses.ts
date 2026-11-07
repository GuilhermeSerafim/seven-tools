import type { Attachment } from '../types';

export interface MockDecision {
  text: string;
  artifact?: 'proposta' | null;
  variant?: 'error';
}

const DIAGNOSTIC_LOREM = `
Analisando o contexto do seu negócio, identifico 7 frentes:

1. Posicionamento — falta uma tese clara para o segmento.
2. Ofertas — pacote único não permite teste A/B de preço.
3. Canais de aquisição — tráfego pago sem funil de nutrição.
4. Funil comercial — taxa de conversão MQL→SQL baixa, hipótese: qualificação rasa.
5. Entrega — processo reativo, sem playbook.
6. Retenção — churn concentrado no mês 2; falta onboarding.
7. Dados — KPIs soltos em planilhas; sem single source of truth.

Recomendação: priorize posicionamento + qualificação. Qual dessas frentes você quer aprofundar primeiro?
`.trim();

export function pickResponse(text: string, attachments: Attachment[]): MockDecision {
  const lower = text.toLowerCase();
  const image = attachments.find((a) => a.type === 'image');
  const pdf = attachments.find((a) => a.type === 'pdf');

  if (image) {
    return { text: `Recebi a imagem \`${image.name}\`. Descreva o que você quer que eu analise nela.` };
  }
  if (pdf) {
    return { text: `Li o PDF \`${pdf.name}\`. Me conta o contexto e o que você espera de saída.` };
  }
  if (lower.includes('diagnóstico') || lower.includes('diagnostico')) {
    return { text: DIAGNOSTIC_LOREM };
  }
  if (lower.includes('simular erro')) {
    return {
      text: 'Erro simulado: não consegui concluir esta resposta. Tente ajustar o pedido ou reenviar.',
      variant: 'error',
    };
  }
  if (lower.includes('proposta')) {
    return {
      text: 'Ok, vou começar o esqueleto da proposta no painel à direita. Enquanto isso, me conta: quem é o cliente e qual o escopo?',
      artifact: 'proposta',
    };
  }
  if (lower.includes('lead') || lower.includes('qualificar')) {
    return { text: 'Beleza. Me passa nome, empresa, cargo e o canal de origem que começamos a qualificação.' };
  }
  return { text: 'Interessante. Pode me contar mais?' };
}
