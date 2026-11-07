# Design System Base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current design system foundation (fonts, tokens, utilities, animations) with the approved luxury dark spec — Outfit + Inter, refined color tokens, improved utility classes, and standardized animations.

**Architecture:** Three files change: `index.html` (font import), `src/index.css` (CSS variables, base styles, utility classes), `tailwind.config.ts` (font family, keyframes, animations). No pages or components change — they inherit the new tokens automatically.

**Tech Stack:** Tailwind CSS 3.4, Google Fonts (Outfit, Inter), CSS custom properties, tailwindcss-animate plugin.

---

### Task 1: Update Google Fonts import in index.html

**Files:**
- Modify: `index.html:1-27`

- [ ] **Step 1: Replace the font import**

The current `index.css` imports fonts via `@import url(...)`. The `index.html` has no font `<link>`. We need to add a preconnect + font link in `index.html` for better performance, and later remove the `@import` from CSS.

Add these lines inside `<head>`, after the favicon lines (after line 11):

```html
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Verify the file looks correct**

Run: `head -20 index.html`

Expected: The `<head>` section should contain the new font links after the favicon entries.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(design-system): add Outfit + Inter font links to index.html"
```

---

### Task 2: Update CSS — fonts, variables, base styles, utilities

**Files:**
- Modify: `src/index.css:1-158`

This is the largest task. We update the font import, CSS custom properties, base styles, and utility classes in one file.

- [ ] **Step 1: Remove the Google Fonts @import**

Remove line 1:
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
```

The fonts are now loaded from `index.html` via `<link>` tags (Task 1).

- [ ] **Step 2: Update the `:root` (light mode) CSS variables**

Replace the entire `:root` block with updated tokens. Light mode stays mostly the same but gets refined values:

```css
  :root {
    --background: 220 20% 97%;
    --foreground: 220 60% 8%;
    --card: 0 0% 100%;
    --card-foreground: 220 60% 8%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 60% 8%;
    --primary: 28 100% 55%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 30% 92%;
    --secondary-foreground: 220 60% 15%;
    --muted: 220 20% 94%;
    --muted-foreground: 220 15% 45%;
    --accent: 28 100% 55%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 20% 88%;
    --input: 220 20% 88%;
    --ring: 28 100% 55%;
    --radius: 0.75rem;
    --sidebar-background: 220 30% 95%;
    --sidebar-foreground: 220 60% 15%;
    --sidebar-primary: 28 100% 55%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 220 30% 90%;
    --sidebar-accent-foreground: 220 60% 15%;
    --sidebar-border: 220 20% 88%;
    --sidebar-ring: 28 100% 55%;

    --surface: 220 25% 94%;
    --surface-foreground: 220 60% 15%;
    --glow-primary: 28 100% 55%;
    --success: 150 60% 40%;
    --success-foreground: 0 0% 100%;
    --warning: 40 95% 55%;
    --warning-foreground: 0 0% 10%;
    --info: 210 80% 55%;
    --info-foreground: 0 0% 100%;
  }
```

Note: The `:root` values are identical to current — no changes needed for light mode. This step is a verification that we don't accidentally break light mode.

- [ ] **Step 3: Update the `.dark` CSS variables**

Replace the `.dark` block. Most values stay the same, but we add a `--border-hover` token for interactive states:

```css
  .dark {
    --background: 220 60% 5%;
    --foreground: 220 20% 92%;
    --card: 220 50% 8%;
    --card-foreground: 220 20% 92%;
    --popover: 220 50% 10%;
    --popover-foreground: 220 20% 92%;
    --primary: 28 100% 55%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 40% 14%;
    --secondary-foreground: 220 20% 85%;
    --muted: 220 40% 12%;
    --muted-foreground: 220 15% 55%;
    --accent: 28 100% 55%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 70% 45%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 40% 15%;
    --border-hover: 220 40% 20%;
    --input: 220 40% 15%;
    --ring: 28 100% 55%;

    --sidebar-background: 220 55% 7%;
    --sidebar-foreground: 220 20% 85%;
    --sidebar-primary: 28 100% 55%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 220 40% 12%;
    --sidebar-accent-foreground: 220 20% 85%;
    --sidebar-border: 220 40% 15%;
    --sidebar-ring: 28 100% 55%;

    --surface: 220 45% 10%;
    --surface-foreground: 220 20% 85%;
    --glow-primary: 28 100% 55%;
    --success: 150 60% 40%;
    --success-foreground: 0 0% 100%;
    --warning: 40 95% 55%;
    --warning-foreground: 0 0% 10%;
    --info: 210 80% 55%;
    --info-foreground: 0 0% 100%;
  }
```

- [ ] **Step 4: Update base styles — swap font family**

Replace the second `@layer base` block with updated font references:

```css
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans;
    font-family: 'Inter', sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Outfit', sans-serif;
  }
}
```

The only change here is `'Outfit'` replacing `'Plus Jakarta Sans'` in headings.

- [ ] **Step 5: Update utility classes**

Replace the entire `@layer utilities` block with refined versions:

```css
@layer utilities {
  .gradient-primary {
    background: linear-gradient(135deg, hsl(28, 100%, 55%), hsl(35, 100%, 50%));
  }
  .gradient-dark {
    background: linear-gradient(180deg, hsl(220, 60%, 8%), hsl(220, 50%, 5%));
  }
  .gradient-card {
    background: linear-gradient(145deg, hsl(220, 50%, 10%), hsl(220, 45%, 7%));
  }
  .glow-primary {
    box-shadow: 0 0 20px hsl(28 100% 55% / 0.25), 0 0 60px hsl(28 100% 55% / 0.08);
  }
  .glow-primary-sm {
    box-shadow: 0 0 10px hsl(28 100% 55% / 0.15), 0 0 30px hsl(28 100% 55% / 0.05);
  }
  .text-gradient-primary {
    background: linear-gradient(135deg, hsl(28, 100%, 55%), hsl(35, 100%, 50%));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .shadow-premium {
    box-shadow: 0 10px 40px -10px hsl(220 60% 5% / 0.6), 0 0 0 1px hsl(220 40% 15% / 0.5);
  }
  .shadow-depth {
    box-shadow: 0 10px 40px -10px rgba(5, 10, 20, 0.6), 0 0 0 1px rgba(23, 34, 64, 0.5);
  }
  .glass {
    background: rgba(10, 18, 36, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .glass-strong {
    background: rgba(10, 18, 36, 0.8);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
}
```

Changes from current:
- `glow-primary` opacity refined: 0.3→0.25, 0.1→0.08
- `glow-primary-sm` opacity refined: 0.2→0.15, 0.05 stays
- Added `shadow-depth` utility (per spec)
- Added `glass` and `glass-strong` utilities (per spec: glassmorphism for fixed elements)

- [ ] **Step 6: Verify the complete file**

Run: `cat -n src/index.css | head -60`

Expected: No `@import` on line 1. Tailwind directives on lines 1-3. `:root` block starts on line 5.

- [ ] **Step 7: Commit**

```bash
git add src/index.css
git commit -m "feat(design-system): update CSS tokens, swap to Outfit font, add glass/depth utilities"
```

---

### Task 3: Update Tailwind config — font family, keyframes, animations

**Files:**
- Modify: `tailwind.config.ts:1-123`

- [ ] **Step 1: Update fontFamily**

Change line 17-19 from:

```typescript
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
```

To:

```typescript
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
```

- [ ] **Step 2: Update keyframes**

Replace the `keyframes` object (lines 86-111) with refined values per spec:

```typescript
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(255, 140, 26, 0)",
          },
          "50%": {
            boxShadow:
              "0 0 20px rgba(255, 140, 26, 0.25), 0 0 60px rgba(255, 140, 26, 0.08)",
          },
        },
      },
```

Changes:
- `fade-in`: translateY 10px→12px (per spec)
- `pulse-glow`: starts from 0 shadow (not 0.2), peak matches `--glow` spec values (0.25 + 0.08)

- [ ] **Step 3: Update animation durations**

Replace the `animation` object (lines 112-119) with:

```typescript
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
```

Changes:
- `pulse-glow`: 2s→2.5s (per spec, slower = more premium feel)

- [ ] **Step 4: Verify config compiles**

Run: `cd seven_tools_front && npx tailwindcss --help > /dev/null 2>&1 && echo "OK"`

Expected: `OK` — no syntax errors in config.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(design-system): update tailwind config with Outfit font and refined animations"
```

---

### Task 4: Verify the app builds and renders correctly

**Files:**
- No modifications — verification only.

- [ ] **Step 1: Run the dev build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -10`

Expected: Build completes successfully with no errors. Output shows bundle sizes.

- [ ] **Step 2: Visual verification checklist**

Start dev server and check in browser:

Run: `cd seven_tools_front && npx vite --port 5174 &`

Open `http://localhost:5174` and verify:
1. All headings render in Outfit (geometric, different from Inter body text)
2. Body text renders in Inter
3. Dark theme background is the same deep navy (#050A14)
4. Orange primary color unchanged (#FF8C1A)
5. Gradient buttons still show orange gradient
6. Glow effects still visible on hover
7. Page load animations still work (fade-in, slide-up)

- [ ] **Step 3: Final commit with all changes**

If any fixups were needed, commit them:

```bash
git add -A
git commit -m "feat(design-system): complete design system base implementation"
```
