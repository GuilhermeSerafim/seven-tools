# Landing Page SEVEN Tools — Design Spec

## Overview

Landing page pública para leads que já conhecem o Método SEVEN. Foco em mostrar as ferramentas e reforçar autoridade. 5 seções usando 3 componentes do 21st.dev adaptados à paleta SEVEN (orange #FF8C1A, dark #050A14).

## Rota e Arquitetura

- Rota: `/landing` — pública, fora do `ProtectedRoute` e do `Layout`
- Arquivo: `src/pages/LandingPage.tsx`
- Componentes reutilizados:
  - `FloatingPaths` de `@/components/ui/background-paths`
  - `ContainerScroll` de `@/components/ui/container-scroll-animation` (adaptar cores)
  - `RadialOrbitalTimeline` de `@/components/ui/radial-orbital-timeline` (adaptar cores)
  - Lógica do animated-hero (título rotativo) inline no LandingPage

## Seção 1 — Hero

**Layout:** Full-screen, centralizado vertical e horizontal.

**Background:**
- `bg-background` com `FloatingPaths` (position 1 e -1) em `text-primary/20`
- Radial glow sutil: `radial-gradient(ellipse at center, rgba(255,140,26,0.06), transparent 70%)`

**Conteúdo:**
- Logo: `<img src="/seven-logo.png">` com `drop-shadow-[0_0_12px_rgba(255,140,26,0.25)]`
- Texto SEVEN Tools: `font-display font-bold text-xl`
- Título: `font-display font-extrabold text-5xl md:text-7xl tracking-tighter text-center`
  - Linha 1: "Ferramentas comerciais"
  - Linha 2: "que são **[palavra rotativa]**"
  - Palavras rotativas: `["inteligentes", "estratégicas", "decisivas", "poderosas", "práticas"]`
  - Palavra rotativa em `text-primary`, animada com spring (mesma lógica do animated-hero.tsx)
  - Rotação a cada 2 segundos
- Subtítulo: "Hub exclusivo do ecossistema SEVEN. IAs, ferramentas e recursos organizados por área do negócio." — `text-lg md:text-xl text-muted-foreground max-w-2xl text-center`
- CTA: Botão "Acessar o Hub" → `/login` — `gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5`

**Animações:**
- Título e subtítulo: `motion.div` com `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `duration: 2`
- Palavras rotativas: spring animation com `stiffness: 50`, `damping: 25`, vertical slide (y: -150 → 0 → 150)

## Seção 2 — Produto (ContainerScroll)

**Título acima do mockup:**
- "Conheça o Hub" — `font-display font-bold text-4xl md:text-5xl`
- Subtítulo: "por dentro" — `text-primary`

**ContainerScroll adaptações:**
- Container: `bg-background` (não branco)
- Card (mockup frame): manter `bg-[#222222] border-[#6C6C6C]` — funciona no dark theme
- Dentro do mockup: composição estilizada representando o dashboard
  - Mock nav bar no topo: "SEVEN Tools" + ícones placeholder
  - Grid 2x2 com cards representando os 4 módulos (ícone + nome + cor primária)
  - Badges "Novo" em primary
  - Fundo do conteúdo: `bg-background` (dark, não gray-100)

**Scroll behavior:** rotateX 20→0, scale 1.05→1, translate vertical -100px. Mantém comportamento original.

## Seção 3 — Ferramentas

**Background:** `bg-background` com borda sutil no topo `border-t border-border/10`

**Header:**
- Título: "Ferramentas Inteligentes" — `font-display font-bold text-3xl md:text-4xl text-center`
- Subtítulo: "IAs e recursos exclusivos para cada área do negócio" — `text-muted-foreground text-center`

**Ferramentas destacadas (2 cards lado a lado):**
- Proposta Comercial Smart:
  - Ícone: `FileCheck` em `bg-primary/10 text-primary`
  - Nome, descrição curta, badge "Novo"
  - `border-border/30 bg-card shadow-depth hover:-translate-y-1 transition-all`
- Diagnóstico Comercial Caloni:
  - Ícone: `ScanSearch`
  - Mesmo padrão

**Módulos (grid 2x2 ou 4 colunas):**
- 4 cards menores: Marketing (Megaphone), Comercial (Handshake), Operação (Settings), Financeiro (DollarSign)
- Cada card: ícone + nome + descrição curta
- `border-border/30 bg-card/50 hover:border-primary/30 transition-all`

**Animações:** Staggered reveal com `motion.div`, delay incremental 0.1s.

## Seção 4 — Método SEVEN (RadialOrbitalTimeline)

**Adaptações de cor do componente:**
- Background: `bg-background` em vez de `bg-black`
- Nó central: gradiente `from-primary via-orange-400 to-amber-500` em vez de purple/blue/teal
- Órbita: `border-primary/10` em vez de `border-white/10`
- Nós ativos: `bg-primary text-primary-foreground` em vez de `bg-white text-black`
- Nós inativos: `bg-card text-foreground border-primary/40`
- Cards expandidos: `bg-card/90 backdrop-blur-lg border-primary/30`
- Texto: usar `text-foreground` e `text-muted-foreground` em vez de `text-white`

**Dados dos 4 nós:**

```typescript
const timelineData = [
  { id: 1, title: 'Marketing', date: '', content: 'Tráfego, conteúdo e conversão', category: 'modulo', icon: Megaphone, relatedIds: [2], status: 'completed', energy: 85 },
  { id: 2, title: 'Comercial', date: '', content: 'Vendas, CRM e propostas', category: 'modulo', icon: Handshake, relatedIds: [1, 3], status: 'completed', energy: 90 },
  { id: 3, title: 'Operação', date: '', content: 'Processos, equipe e eficiência', category: 'modulo', icon: Settings, relatedIds: [2, 4], status: 'in-progress', energy: 70 },
  { id: 4, title: 'Financeiro', date: '', content: 'Indicadores, custos e margem', category: 'modulo', icon: DollarSign, relatedIds: [3], status: 'pending', energy: 60 },
];
```

**Header acima:**
- "Método SEVEN" — `font-display font-bold text-3xl md:text-4xl text-center`
- Subtítulo: "Cada área do negócio conectada em um ecossistema inteligente"

## Seção 5 — CTA Final

**Background:** radial glow `radial-gradient(ellipse at center, rgba(255,140,26,0.08), transparent 60%)`

**Conteúdo centralizado:**
- Título: "Pronto para transformar sua operação comercial?" — `font-display font-bold text-3xl md:text-4xl text-center`
- Subtítulo: "Acesse o hub exclusivo do ecossistema SEVEN" — `text-muted-foreground`
- Dois botões:
  - "Acessar o Hub" → `/login` — `gradient-primary` (principal)
  - "Criar conta" → `/register` — `variant="outline"`

**Animação:** `motion.div` fade-in no mount.

## Responsividade

| Breakpoint | Comportamento |
|---|---|
| `< md` | Hero: texto menor (text-4xl). ContainerScroll: scale mobile (0.7→0.9). Ferramentas: stack vertical. Timeline orbital: funciona mas nós ficam menores. CTA: botões stack. |
| `md+` | Layout completo conforme descrito. |

## Performance

- FloatingPaths: SVG + Framer Motion (GPU-accelerated)
- ContainerScroll: useScroll + useTransform (GPU)
- RadialOrbitalTimeline: setInterval rotation + CSS transforms
- Sem libraries adicionais além do que já está no projeto

## Não muda

- Nenhum arquivo existente é alterado além de `App.tsx` (nova rota)
- Lógica de auth, ferramentas, componentes existentes — tudo intacto
