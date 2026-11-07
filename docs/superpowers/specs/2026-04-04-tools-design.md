# SEVEN Tools — Ferramentas

**Sub-projeto 4 de 7** do redesign UI/UX completo.

## Escopo

6 arquivos: `Tools.tsx`, `ToolDetail.tsx`, `ToolCard.tsx`, `CategoryBadge.tsx`, `FavoriteButton.tsx`, `StatusBadge.tsx`.

## Tools.tsx
- Activity banner: `border-primary/15` (era `/20`), adicionar `shadow-depth`
- Grid animations: `y: 12` (era `y: 20`), `delay: i * 0.08` (era `i * 0.1`)

## ToolCard.tsx
- Borda: `border-border/30` (era `/50`)
- Adicionar `shadow-depth` default
- Hover: adicionar `hover:-translate-y-0.5`
- Tags: `bg-surface` em vez de `bg-muted`

## ToolDetail.tsx
- Breadcrumbs: `hover:text-primary duration-200` (era `hover:text-foreground`)
- Icon container: adicionar `shadow-[0_0_20px_rgba(255,140,26,0.1)]`
- Info cards (3x): `border-border/30` (era `/50`), adicionar `shadow-depth`
- Activity block: `border-border/30` (era `/50`)
- Latest proposal card: `border-border/30` (era `/40`)
- CTAs primary: adicionar `hover:-translate-y-0.5 transition-all`
- Animacao entrada: `y: 12` (era `y: 15`)
- Tags: `bg-surface` em vez de `bg-muted`

## CategoryBadge.tsx
- `bg-surface` em vez de `bg-muted`

## FavoriteButton.tsx
- Quando favoritado + hover: `hover:drop-shadow-[0_0_4px_rgba(255,140,26,0.3)]`

## StatusBadge.tsx
- Sem mudanca
