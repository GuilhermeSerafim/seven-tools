# Auth Hero Split-Screen Design

## Overview

Redesign das páginas Login e Register com layout split-screen: hero visual animado à esquerda, formulário limpo à direita. Mobile-first: hero hidden em telas pequenas.

## Layout

Grid `grid-cols-2` no desktop (`md+`). Mobile: hero `hidden md:flex`, form ocupa tela inteira.

### Lado esquerdo — Hero (50%)

**Background:**
- Base: `bg-background`
- Grid de linhas CSS: `background-image` com dois `linear-gradient` cruzados (horizontal + vertical), cor `rgba(255,140,26,0.06)`, tamanho `60px 60px`
- Glow radial animado: `div` absoluto centralizado, `radial-gradient(circle, rgba(255,140,26,0.15), transparent 70%)`, ~400px de diâmetro
  - Animação Framer Motion: `scale: [1, 1.15, 1]`, `opacity: [0.6, 1, 0.6]`, loop infinito, duração 4s, ease `easeInOut`

**Conteúdo (centralizado vertical):**
1. Logo SEVEN: `<img>` com `drop-shadow-[0_0_12px_rgba(255,140,26,0.25)]`, fallback para text logo
2. Tagline: "Hub de Ferramentas Comerciais Inteligentes" — `font-display font-bold text-3xl leading-tight`
3. Features list (4 items) com ícones Lucide:
   - `FileCheck` — "Propostas comerciais profissionais em minutos"
   - `ScanSearch` — "Diagnóstico comercial com IA integrada"
   - `Zap` — "Ferramentas inteligentes para fechar negócios"
   - `Shield` — "Seus dados seguros e organizados"
   - Cada item: ícone `text-primary` + texto `text-muted-foreground text-sm`
4. Badge: "Método SEVEN" — `border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider`

**Animações do conteúdo:**
- Staggered reveal no mount: logo → tagline → features → badge
- Cada item: `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`
- Delay incremental: 0.1s entre cada grupo

### Lado direito — Form (50%)

**Background:**
- Sólido `bg-background`, sem card/borda visível
- Mobile fallback: `radial-gradient(ellipse at top, rgba(255,140,26,0.04), transparent 60%)` via inline style

**Layout:**
- Conteúdo centralizado vertical e horizontal
- `max-w-sm w-full px-6`
- `motion.div` com `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`

**Conteúdo (Login):**
- Título: "Bem-vindo de volta" — `font-display font-bold text-2xl`
- Subtítulo: "Acesse sua conta para entrar no hub" — `text-sm text-muted-foreground mb-6`
- Campos: email, password (com toggle eye)
- Server error box: `bg-destructive/10 border-destructive/20`
- CTA: "Entrar" — `gradient-primary hover:-translate-y-0.5 transition-all w-full`
- Link: "Não tem conta? Cadastre-se" — `text-primary hover:underline`

**Conteúdo (Register):**
- Título: "Criar sua conta"
- Subtítulo: "Junte-se ao ecossistema SEVEN"
- Campos: nome, empresa, email, senha, confirmar senha
- Mesmo CTA/error pattern
- Link: "Já tem conta? Entrar"

## Arquitetura

### Novo componente: `src/components/auth/AuthLayout.tsx`

Componente wrapper que recebe `children` (formulário) e renderiza o split-screen completo.

```tsx
interface AuthLayoutProps {
  children: React.ReactNode;
}
```

Responsável por: grid split, hero com grid/glow/conteúdo/animações, container do form.

### Modificações em Login.tsx e Register.tsx

- Remover o wrapper `div.min-h-screen` e o bloco de logo
- Envolver o conteúdo do form em `<AuthLayout>`
- Manter toda a lógica de form/validation/submit inalterada

## Responsividade

| Breakpoint | Comportamento |
|---|---|
| `< md` (mobile) | Hero hidden. Form full-screen com gradient sutil no background. |
| `md+` (desktop) | Split-screen 50/50. Hero visível à esquerda. |

## Performance

- Grid: CSS puro (`background-image`), zero JS
- Glow: uma `div` com Framer Motion animate (GPU-accelerated via transform)
- Sem canvas, sem partículas, sem libraries externas
- Stagger animations: CSS-only delays via Framer Motion `transition.delay`

## Não muda

- Lógica de autenticação (useAuth, schemas Zod, react-hook-form)
- Componentes shadcn/ui (Button, Input, Label)
- Rotas
- ProposalPDF.tsx ou qualquer outro arquivo
