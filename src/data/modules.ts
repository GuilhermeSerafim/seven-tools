import type { ToolCategory } from './types';

export interface Module {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
}

export const modules: Module[] = [
  {
    slug: 'marketing',
    name: 'Marketing',
    description: 'Tráfego, conteúdo e conversão',
    icon: 'Megaphone',
    category: 'marketing',
  },
  {
    slug: 'comercial',
    name: 'Comercial',
    description: 'Vendas, CRM e propostas',
    icon: 'Handshake',
    category: 'comercial',
  },
  {
    slug: 'operacao',
    name: 'Operação',
    description: 'Processos, equipe e eficiência',
    icon: 'Settings',
    category: 'operacao',
  },
  {
    slug: 'financeiro',
    name: 'Financeiro',
    description: 'Indicadores, custos e margem',
    icon: 'DollarSign',
    category: 'financeiro',
  },
];

export function getModuleBySlug(slug: string): Module | undefined {
  return modules.find(m => m.slug === slug);
}
