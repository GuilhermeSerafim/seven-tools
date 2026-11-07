# SEVEN Tools — Layout & Navegacao

**Sub-projeto 2 de 7** do redesign UI/UX completo.

## Escopo

3 arquivos: `Header.tsx`, `BottomNav.tsx`, `Layout.tsx`. Todos em `src/components/layout/`.

## Header

### Estrutura (sem mudanca)
Logo + Nav links (desktop) + Search + Avatar/dropdown (desktop) + Mobile menu

### Mudancas visuais

**Container do header:**
- Trocar `bg-background/80 backdrop-blur-xl` por `glass-strong` (utility do sub-projeto 1)
- Borda inferior: `border-border/30` (era `border-border/50`)

**Saudacao:**
- Remover "Ola, [empresa]" do desktop
- So avatar + dropdown. Nome/empresa aparecem dentro do dropdown

**Nav links (desktop):**
- Hover: `hover:bg-primary/5 hover:text-foreground` (era `hover:bg-muted`)
- Active: `bg-primary/10 text-primary` (mantém)
- Transicao: `transition-colors duration-200`

**Search input:**
- Background: `bg-surface` (era `bg-muted/50`)
- Border radius: `rounded-xl` (era `rounded-lg`)
- Focus: `focus:ring-1 focus:ring-primary/30 focus:border-primary/30` (era `primary/40`)
- Placeholder mantém

**Search dropdown resultados:**
- Background: `glass-strong` (era `bg-background/95 backdrop-blur-xl`)
- Border: `border-border/30` (era `border-border/50`)

**Avatar (desktop):**
- Hover: `hover:shadow-[0_0_12px_rgba(255,140,26,0.2)]` (glow sutil, era ring solido)
- Remover `hover:ring-2 hover:ring-primary/40`
- Manter `transition-all`

**Mobile sheet:**
- Background: `bg-card` (era `bg-background`)
- Manter estrutura interna

## BottomNav

### Mudancas visuais

**Container:**
- Trocar `bg-background/95 backdrop-blur-xl` por `glass-strong`
- Borda superior: `border-border/30` (era `border-border/50`)

**Active state:**
- Icone: envolver em pill `bg-primary/10 rounded-xl p-1.5`
- Label: `text-primary font-medium`
- Transicao suave no icone

**Inactive state:**
- `text-muted-foreground` (mantém)

**Safe area iOS:**
- Adicionar `pb-[env(safe-area-inset-bottom)]` no container

## Layout

Sem mudancas. Estrutura `min-h-screen flex flex-col` esta correta.

## Arquivos

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/components/layout/Header.tsx` | Visual: glass, remover saudacao, refinar hover/search/avatar |
| `src/components/layout/BottomNav.tsx` | Visual: glass, active pill, safe area |
| `src/components/layout/Layout.tsx` | Sem mudanca |
