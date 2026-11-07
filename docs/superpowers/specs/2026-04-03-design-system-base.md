# SEVEN Tools — Design System Base

**Sub-projeto 1 de 7** do redesign UI/UX completo.

## Decisoes

| Aspecto | Decisao |
|---------|---------|
| Direcao estetica | Luxury tech escuro |
| Cor primaria | Laranja #FF8C1A (marca, preservada) |
| Fundo | Azul-escuro #050A14 (marca, preservado) |
| Tipografia display | **Outfit** (wght 400-800) |
| Tipografia body | **Inter** (wght 400-700) |
| Animacoes | Meio-termo: page enters orquestradas, hover states com personalidade, sem scroll-triggered |
| Cards conteudo | Solido com depth (sombras, glow laranja no hover) |
| Cards navegacao/fixos | Glassmorphism (backdrop-blur, borda sutil transparente) |

## 1. Paleta de Cores

Cores da marca (intocaveis):

| Token | HSL | HEX | Uso |
|-------|-----|-----|-----|
| Primary | hsl(28, 100%, 55%) | #FF8C1A | CTAs, acentos, glow, gradientes |
| Primary gradient end | hsl(35, 100%, 50%) | #FF9500 | Final do gradiente |
| Background | hsl(220, 60%, 5%) | #050A14 | Fundo principal |
| Card | hsl(220, 50%, 8%) | #0A1224 | Cards, superficies elevadas |
| Surface | hsl(220, 45%, 10%) | #0E172B | Inputs, areas internas |
| Border | hsl(220, 40%, 15%) | #172240 | Bordas, divisores |
| Foreground | hsl(220, 20%, 92%) | #E8EBF0 | Texto principal |
| Muted | hsl(220, 15%, 55%) | #808A99 | Texto secundario |

Cores semanticas:

| Token | HEX | Uso |
|-------|-----|-----|
| Success | #34D399 | Status positivo |
| Info | #60A5FA | Informacoes, links |
| Warning | #FBBF24 | Alertas, atencao |
| Destructive | #F87171 | Erros, exclusoes |

Opacidades utilitarias do primary:
- `primary/5` — backgrounds sutis
- `primary/10` — badges, tags, hover backgrounds
- `primary/20` — bordas hover, focus rings
- `primary/25` — box-shadow glow
- `primary/30` — bordas ativas

## 2. Tipografia

### Fontes
- **Display (headings, botoes, badges, labels):** Outfit — geometrica, moderna, peso visual forte
- **Body (texto corrido, inputs, descricoes):** Inter — legibilidade excelente, neutra

### Escala

| Nivel | Fonte | Peso | Tamanho | Uso |
|-------|-------|------|---------|-----|
| H1 | Outfit | 800 | 36px (2.25rem) | Titulo principal de pagina |
| H2 | Outfit | 700 | 24px (1.5rem) | Secoes, titulos de card |
| H3 | Outfit | 600 | 18px (1.125rem) | Sub-secoes |
| Body | Inter | 400 | 15px (0.9375rem) | Texto corrido |
| Small | Inter | 500 | 13px (0.8125rem) | Metadados, timestamps |
| Label | Outfit | 600 | 11px (0.6875rem) | Labels uppercase, tracking 1.5px |

## 3. Componentes Core

### Botoes

| Variante | Background | Texto | Borda | Hover |
|----------|-----------|-------|-------|-------|
| Primary | gradient(primary → primary-end) | #050A14 | none | glow laranja + translateY(-1px) |
| Outline | transparent | foreground | 1.5px solid border | border primary/20, bg primary/5 |
| Ghost | transparent | muted | none | fg foreground, bg white/4% |

- Font: Outfit 600
- Padding: 10px 22px (default), 7px 14px (sm)
- Border-radius: 10px (default), 8px (sm)
- Transicao: all 0.25s ease

### Badges

- Font: Outfit 600, 11px
- Padding: 4px 10px
- Border-radius: 6px
- Variantes: primary (laranja/10), success (green/10), info (blue/10), warning (yellow/10), outline (border, muted text)

### Inputs

- Background: surface (#0E172B)
- Border: 1.5px solid border (#172240)
- Border-radius: 10px
- Padding: 10px 14px
- Font: Inter 400, 14px
- Focus: border primary, box-shadow 0 0 0 3px primary/10
- Placeholder: muted com 50% opacidade

## 4. Cards

### Card Solido (conteudo scrollavel)

```
background: var(--card)           // #0A1224
border: 1.5px solid var(--border) // #172240
border-radius: 16px
padding: 24px
box-shadow: shadow-depth (sombra profunda azul-escuro)

hover:
  border-color: primary/30
  box-shadow: glow-sm + shadow-depth
  transform: translateY(-2px)
  transition: all 0.3s ease
```

### Card Glass (elementos fixos: header, modals, sheets)

```
background: rgba(10, 18, 36, 0.6)   // card com 60% opacidade
backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.06)
border-radius: 14px
```

## 5. Efeitos

### Glow

```css
--glow: 0 0 20px rgba(255, 140, 26, 0.25), 0 0 60px rgba(255, 140, 26, 0.08);
--glow-sm: 0 0 10px rgba(255, 140, 26, 0.15), 0 0 30px rgba(255, 140, 26, 0.05);
```

### Shadow Depth

```css
--shadow-depth: 0 10px 40px -10px rgba(5, 10, 20, 0.6),
               0 0 0 1px rgba(23, 34, 64, 0.5);
```

### Gradiente Primary

```css
background: linear-gradient(135deg, #FF8C1A, #FF9500);
```

## 6. Animacoes

### Principios
- **Meio-termo:** page enters orquestradas + hover states com personalidade
- **Sem** scroll-triggered animations
- **Easing:** ease-out para entradas, ease-in-out para ciclos
- **Target:** 60fps sempre

### Page Enter
- Elementos entram com `opacity: 0 → 1` + `translateY: 12px → 0`
- Duracao: 0.4s ease-out
- Stagger entre filhos: 0.08s de delay
- Usar Framer Motion `motion.div` com `initial`, `animate`

### Hover States
- Cards: `scale(1.02)` + border glow + `translateY(-2px)`, 0.3s ease
- Botoes primary: glow intensifica + `translateY(-1px)`, 0.25s ease
- Botoes outline: border acende primary/20, bg primary/5
- Links/nav: color transition 0.2s

### Glow Pulse (elementos destaque)
- Box-shadow pulsa entre 0 e glow completo
- Duracao: 2.5s ease-in-out infinite
- Uso: CTAs principais, status ativo

### Keyframes Tailwind

```
fade-in: opacity 0→1 + translateY 12→0, 0.4s ease-out
scale-in: scale 0.95→1 + opacity 0→1, 0.3s ease-out
slide-up: translateY 20→0 + opacity 0→1, 0.5s ease-out
pulse-glow: box-shadow pulse, 2.5s ease-in-out infinite
```

## 7. Responsividade

Breakpoints Tailwind padrao:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- Container max: 1400px, padding 2rem, centralizado

## 8. Escopo da implementacao

### Arquivos a modificar:
1. `src/index.css` — atualizar CSS variables, trocar fontes, ajustar utility classes
2. `tailwind.config.ts` — atualizar fontFamily (Outfit), ajustar keyframes/animacoes
3. `index.html` — atualizar link do Google Fonts (trocar Plus Jakarta Sans por Outfit)

### Arquivos que NAO mudam neste sub-projeto:
- Nenhuma pagina ou componente individual
- Nenhum layout (Header, BottomNav, Layout)
- Essas mudancas ficam pros sub-projetos 2-7

### Resultado esperado:
- Toda a app muda de fonte automaticamente (display: Outfit em vez de Plus Jakarta Sans)
- Tokens de cor ficam consistentes entre light e dark mode
- Utility classes (glow, gradient, shadow) ficam mais refinadas
- Animacoes Tailwind ficam padronizadas
- Base pronta pra os sub-projetos seguintes aplicarem por pagina
