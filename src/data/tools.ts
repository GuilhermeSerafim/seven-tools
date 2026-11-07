import { Tool } from './types';
import {
  DIAGNOSTICO_CALONI_TOOL_SLUG,
  LEAD_QUALIFICATION_TOOL_SLUG,
  PROPOSAL_TOOL_SLUG,
} from '../features/comercial/toolRoutes';

export const tools: Tool[] = [
  {
    id: '19',
    name: 'Caloni Propostas',
    slug: PROPOSAL_TOOL_SLUG,
    shortDescription: 'Crie, edite e valide propostas comerciais com o Caloni em uma conversa única.',
    longDescription:
      'Crie propostas comerciais profissionais, edite versões salvas e valide o material com o método Caloni em uma única superfície de chat.',
    category: 'comercial',
    status: 'new',
    tags: ['proposta', 'comercial', 'criação', 'validação', 'caloni'],
    icon: 'FileText',
    mainBenefit: 'Centraliza criação, edição e validação de propostas em um único lugar',
    accessType: 'Plataforma Web',
    howToUse: [
      'Converse com o Caloni para criar ou ajustar a proposta',
      'Salve o rascunho quando os campos principais estiverem prontos',
      'Valide a proposta no mesmo chat antes de compartilhar com o cliente',
    ],
    recommendationLevel: 5,
    popularity: 76,
    isFavorite: false,
    launchDate: '2025-01-20',
  },
  {
    id: '20',
    name: 'Raio-X Comercial',
    slug: DIAGNOSTICO_CALONI_TOOL_SLUG,
    shortDescription: 'Descubra o que está travando suas vendas com um diagnóstico direto do Caloni.',
    longDescription:
      'Converse com o Caloni sobre a sua operacao comercial, funil, conversao, propostas e objecoes. Ele aprofunda o contexto como uma IA consultiva, faz a proxima pergunta com base no historico e, quando houver informacao suficiente, consolida um diagnostico estruturado com gargalo principal, etapa critica, sintomas, causa provavel, acao recomendada e plano prioritario.',
    category: 'comercial',
    status: 'new',
    tags: ['diagnóstico', 'comercial', 'caloni', 'vendas', 'funil', 'análise'],
    icon: 'ScanSearch',
    mainBenefit: 'Diagnóstico que aponta a causa raiz real e não apenas o sintoma superficial',
    accessType: 'Plataforma Web',
    howToUse: [
      'Abra um novo chat ou continue uma conversa recente com o Caloni',
      'Conte o contexto da operacao, onde o funil trava e o que ja foi tentado',
      'Quando fizer sentido, peca uma consolidacao do diagnostico e do plano prioritario',
    ],
    recommendationLevel: 5,
    popularity: 74,
    isFavorite: false,
    launchDate: '2025-03-25',
  },
  {
    id: '22',
    name: 'Radar de Leads',
    slug: LEAD_QUALIFICATION_TOOL_SLUG,
    shortDescription: 'Transforme leads em uma fila priorizada com score, faixa e ação recomendada.',
    longDescription:
      'Configure o ICP da empresa, ajuste pesos e faixas de score e classifique leads manualmente para organizar a operação comercial em uma fila única.',
    category: 'comercial',
    status: 'new',
    tags: ['leads', 'qualificação', 'comercial', 'priorização'],
    icon: 'ListTodo',
    mainBenefit: 'Ajuda o time comercial a saber com quem falar primeiro',
    accessType: 'Plataforma Web',
    howToUse: [
      'Configure o ICP e as regras de score da empresa',
      'Cadastre leads manualmente no formulário padrão',
      'Trabalhe a fila priorizada conforme score, faixa e ação recomendada',
    ],
    recommendationLevel: 5,
    popularity: 68,
    isFavorite: false,
    launchDate: '2026-04-09',
  },
];

export const recentToolIds: string[] = ['22', '20', '19'];
export const favoriteToolIds: string[] = [];
export const recommendedToolIds: string[] = ['22', '20', '19'];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: string): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function getFeaturedTools(): Tool[] {
  return tools.filter((t) => t.status === 'featured' || t.status === 'popular' || t.status === 'new');
}

export function getNewTools(): Tool[] {
  return tools.filter((t) => t.status === 'new' || t.status === 'beta');
}

export function getPopularTools(): Tool[] {
  return [...tools].sort((a, b) => b.popularity - a.popularity);
}

export function getToolsByIds(ids: string[]): Tool[] {
  return ids.map((id) => tools.find((t) => t.id === id)).filter(Boolean) as Tool[];
}
