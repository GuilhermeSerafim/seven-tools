export type ToolStatus = 'available' | 'new' | 'featured' | 'beta' | 'popular' | 'exclusive' | 'coming-soon';

export type ToolCategory = 
  | 'marketing' | 'comercial' | 'operacao' | 'financeiro'
  | 'produtividade' | 'automacao' | 'ia' | 'diagnostico'
  | 'conteudo' | 'vendas';

export interface Tool {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  category: ToolCategory;
  subcategory?: string;
  status: ToolStatus;
  tags: string[];
  icon: string;
  mainBenefit: string;
  accessType: string;
  prerequisites?: string[];
  howToUse?: string[];
  recommendationLevel: number; // 1-5
  popularity: number; // 0-100
  isFavorite: boolean;
  launchDate: string;
}

export interface CategoryInfo {
  slug: ToolCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  toolCount: number;
}

export const CATEGORY_MAP: Record<ToolCategory, CategoryInfo> = {
  marketing: { slug: 'marketing', name: 'Marketing', description: 'Ferramentas de marketing digital e estratégico', icon: 'Megaphone', color: 'hsl(28, 100%, 55%)', toolCount: 0 },
  comercial: { slug: 'comercial', name: 'Comercial', description: 'Gestão comercial e pipeline de vendas', icon: 'Handshake', color: 'hsl(210, 80%, 55%)', toolCount: 0 },
  operacao: { slug: 'operacao', name: 'Operação', description: 'Processos operacionais e eficiência', icon: 'Settings', color: 'hsl(150, 60%, 40%)', toolCount: 0 },
  financeiro: { slug: 'financeiro', name: 'Financeiro', description: 'Controle financeiro e indicadores', icon: 'DollarSign', color: 'hsl(45, 90%, 50%)', toolCount: 0 },
  produtividade: { slug: 'produtividade', name: 'Produtividade', description: 'Maximize resultados e organize tarefas', icon: 'Zap', color: 'hsl(270, 70%, 55%)', toolCount: 0 },
  automacao: { slug: 'automacao', name: 'Automação', description: 'Automatize processos repetitivos', icon: 'Bot', color: 'hsl(190, 80%, 45%)', toolCount: 0 },
  ia: { slug: 'ia', name: 'IA', description: 'Inteligência artificial aplicada ao negócio', icon: 'Brain', color: 'hsl(300, 70%, 50%)', toolCount: 0 },
  diagnostico: { slug: 'diagnostico', name: 'Diagnóstico', description: 'Análise e diagnóstico empresarial', icon: 'Search', color: 'hsl(0, 70%, 55%)', toolCount: 0 },
  conteudo: { slug: 'conteudo', name: 'Conteúdo', description: 'Criação e gestão de conteúdo', icon: 'FileText', color: 'hsl(330, 70%, 55%)', toolCount: 0 },
  vendas: { slug: 'vendas', name: 'Vendas', description: 'Técnicas e ferramentas de vendas', icon: 'TrendingUp', color: 'hsl(15, 85%, 50%)', toolCount: 0 },
};

export const STATUS_CONFIG: Record<ToolStatus, { label: string; className: string }> = {
  available: { label: 'Disponível', className: 'bg-success/20 text-success border-success/30' },
  new: { label: 'Novo', className: 'bg-info/20 text-info border-info/30' },
  featured: { label: 'Em Destaque', className: 'bg-primary/20 text-primary border-primary/30' },
  beta: { label: 'Beta', className: 'bg-warning/20 text-warning border-warning/30' },
  popular: { label: 'Mais Usado', className: 'gradient-primary text-primary-foreground border-primary/30' },
  exclusive: { label: 'Exclusivo', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'coming-soon': { label: 'Em Breve', className: 'bg-muted text-muted-foreground border-border' },
};
