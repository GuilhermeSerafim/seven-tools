# SEVEN Tools — Home + Modulos

**Sub-projeto 3 de 7** do redesign UI/UX completo.

## Escopo

4 arquivos: `Index.tsx`, `ModulePage.tsx`, `ModuleCard.tsx`, `SectionHeader.tsx`.

## Index.tsx (Home)

### Hero

- **Remover imagem de fundo** (`/home.jpg`) e o overlay gradient sobre ela
- **Substituir por** radial gradient CSS puro: `radial-gradient(ellipse at top, rgba(255,140,26,0.06), transparent 60%)` como atmosfera luxury
- **Greeting pill:** borda `border-primary/15`, adicionar `backdrop-blur-sm`
- **Botao primary:** adicionar `hover:-translate-y-0.5` para micro-interacao
- **Animacao entrada:** `y: 20` → `y: 12` (consistencia design system)

### Activity strip

- Borda: `border-border/30` (era `/50`)
- Hover: adicionar `shadow-depth` no hover
- Background: `bg-card` (era `bg-card/70 backdrop-blur-sm`)

### Modulos grid

- Stagger: `delay: i * 0.08` (era `i * 0.1`)
- Entrada: `y: 12` (era `y: 20`)

### Favoritos section

- Entrada: `y: 12` (era `y: 15`)
- Stagger: `delay: i * 0.05` (mantém)

## ModuleCard.tsx

- Borda default: `border-border/30` (era `/50`)
- Adicionar `shadow-depth` ao card por default
- Hover: manter `scale(1.04)` + `border-primary/40` + glow, adicionar `-translate-y-0.5`
- Hover shadow: `hover:shadow-primary/10` mantém

## ModulePage.tsx

- Breadcrumb hover: `hover:text-primary` (era `hover:text-foreground`)
- Module header icon container: adicionar `shadow-[0_0_20px_rgba(255,140,26,0.1)]`
- Empty state: `border-border/30` (era `/50`), `bg-card` (era `bg-card/50`)
- Animacoes: `y: 12` (era `y: 15` e `y: 10`)
- PropostaToolCard: `border-border/30` (era `/50`)

## SectionHeader.tsx

- Sem mudanca — `font-display` ja herda Outfit automaticamente do sub-projeto 1
