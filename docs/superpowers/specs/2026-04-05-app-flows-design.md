# SEVEN Tools — Fluxos de App (Proposta + Diagnóstico + ToolApp)

**Sub-projeto 5 de 7** do redesign UI/UX completo.

## Escopo

9 arquivos: `ProposalShell.tsx`, `ProposalList.tsx`, `ProposalForm.tsx`, `ProposalView.tsx`, `CalonValidation.tsx`, `DiagnosticoShell.tsx`, `DiagnosticoApp.tsx`, `ToolApp.tsx`.

Não muda: `ProposalPDF.tsx` (renderização PDF server-side, sem UI visível).

## ProposalShell.tsx
- Header bar sticky: `glass-strong border-border/30` (era `bg-card/80 backdrop-blur-sm border-border/50`)

## ProposalList.tsx
- Page animation: `y: 12` (era `y: 15`)
- Proposal cards: `border-border/30` (era `/50`)
- Proposal cards hover: adicionar `hover:-translate-y-0.5` para feedback tátil
- List item animation: `y: 12` (era `y: 10`)
- CTA "Nova Proposta": adicionar `hover:-translate-y-0.5 transition-all`
- Empty state icon: adicionar `shadow-[0_0_20px_rgba(255,140,26,0.1)]` para consistência com outros empty states
- **UX**: CTA "Criar primeira proposta" no empty state — adicionar `hover:-translate-y-0.5`

## ProposalForm.tsx
- Page animation: `y: 12` (era `y: 15`)
- 5 form sections: `border-border/30 shadow-depth` (era `border-border/50` sem shadow)
- Divider back button: `bg-border/40` (era `bg-border/60`) — mais sutil
- Submit CTA: adicionar `hover:-translate-y-0.5 transition-all`
- **UX**: Back button hover — `hover:text-primary` (era `hover:text-foreground`) para consistência com breadcrumbs do design system

## ProposalView.tsx
- Page animation: `y: 12` (era `y: 15`)
- Document card: `border-border/30` (era `/50`)
- HighlightCard (Valor/Prazo): `border-border/30` (era `/60`)
- Client card: `bg-surface` (era `bg-muted/30`), `border-border/30` (era `/40`)
- Scope card: `bg-surface` (era `bg-muted/20`), `border-border/30` (era `/40`)
- Notes card: `bg-surface` (era `bg-muted/10`)
- Editar CTA: adicionar `hover:-translate-y-0.5`
- Coming soon block: `border-border/30` (era `/40`)
- **UX**: Back button "Minhas propostas" — `hover:text-primary` (era implícito hover:text-foreground)
- **UX**: Export PDF button — adicionar `hover:-translate-y-0.5` para destaque

## CalonValidation.tsx
- Agent intro card: `border-border/30` (era `/50`)
- Drop zone default: `border-border/30` (era `/50`), `bg-surface` (era `bg-card/50`)
- Drop zone icon container default: `bg-surface` (era `bg-muted`)
- "O que é avaliado" card: `bg-surface` (era `bg-card/50`), `border-border/30` (era `/50`)
- File selected agent card: `border-border/30` (era `/50`)
- Loading card: `border-border/30` (era `/40`), `bg-surface` (era `bg-card/50`)
- Result criteria card: `border-border/30` (era `/50`)
- Result suggestions card: `border-border/30` (era `/50`)
- Analyze CTA: adicionar `hover:-translate-y-0.5 transition-all`
- Score bar bg: `bg-surface` (era `bg-muted`)
- **UX**: Back button — trocar `<button>` custom por `<Button variant="ghost">` consistente com todos os outros flows
- **UX**: Page header back button border `border-border/30` (era `/50`)

## DiagnosticoShell.tsx
- Header bar sticky: `glass-strong border-border/30` (era `bg-card/80 backdrop-blur-sm border-border/50`)

## DiagnosticoApp.tsx
- Intro hero card: `border-border/30` (era `/50`)
- Coverage grid card: `bg-surface` (era `bg-card/50`), `border-border/30` (era `/50`)
- Form sections (2x): `border-border/30 shadow-depth` (era `border-border/50`)
- Form animations: `y: 12` (era `y: 16`)
- Intro animation: `y: 12` (era `y: 16`)
- Generating state animation: `y: 12` (era `y: 16`)
- Error state animation: `y: 12` (era `y: 16`)
- Result TextBlock/ListBlock animations: `y: 12` (era `y: 10`)
- Result score block animation: `y: 12` (era `y: 16`)
- CTAs "Iniciar Diagnóstico" e "Gerar Diagnóstico": adicionar `hover:-translate-y-0.5 transition-all`
- Result signature bar: `border-border/30 bg-surface` (era `border-border/40 bg-card/50`)
- Métricas block: `border-border/30` (era `/50`)
- **UX**: Generating state card — standardizar a borda `border-primary/15` (era `/20`) para consistência com outros banners primary

## ToolApp.tsx
- Header bar: `glass-strong border-border/30` (era `bg-card/80 backdrop-blur-sm border-border/50`)
- Construction card: `border-border/30 shadow-depth` (era `border-border/50`)
- Page animation: `y: 12` (era `y: 20`)
- Construction icon container: adicionar `shadow-[0_0_20px_rgba(255,140,26,0.1)]` glow
- **UX**: Back button dentro do header — `hover:text-primary` (era hover:text-foreground) consistente com breadcrumbs
