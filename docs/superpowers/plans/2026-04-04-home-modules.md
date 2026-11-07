# Home + Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Home page, ModulePage, and ModuleCard to match the luxury dark design system — remove hero image, add atmospheric gradient, refine animations and borders.

**Architecture:** 3 files change: `Index.tsx` (hero, activity strip, animations), `ModulePage.tsx` (breadcrumb, icon, animations, borders), `ModuleCard.tsx` (borders, shadow, hover). SectionHeader stays unchanged.

**Tech Stack:** React, Tailwind CSS, Framer Motion, Lucide icons.

---

### Task 1: Update Index.tsx — Hero section (remove image, add gradient)

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Replace hero background**

Find the hero section (lines 36-41):
```tsx
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/home.jpg" alt="SEVEN Tools Hub" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative container py-20 md:py-28">
```

Replace with:
```tsx
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(255,140,26,0.06), transparent 60%)' }} />
        <div className="relative container py-20 md:py-28">
```

- [ ] **Step 2: Update greeting pill**

Find the greeting pill div (line 49):
```tsx
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm text-primary font-medium mb-6">
```

Replace with:
```tsx
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/15 backdrop-blur-sm px-4 py-1.5 text-sm text-primary font-medium mb-6">
```

Change: `border-primary/20` → `border-primary/15`, added `backdrop-blur-sm`.

- [ ] **Step 3: Update hero animation**

Find the motion.div (lines 42-46):
```tsx
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
```

Replace with:
```tsx
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
```

Changes: `y: 20` → `y: 12`, `duration: 0.6` → `0.5`.

- [ ] **Step 4: Add hover micro-interaction to primary CTA buttons**

Find the first primary Button (lines 76-78):
```tsx
                    className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow gap-2"
```

Replace with:
```tsx
                    className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all gap-2"
```

Find the second primary Button (lines 92-94):
```tsx
                  className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
```

Replace with:
```tsx
                  className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
```

Changes: Added `hover:-translate-y-0.5`, `transition-shadow` → `transition-all`.

- [ ] **Step 5: Verify build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

---

### Task 2: Update Index.tsx — Activity strip and sections

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Update activity strip**

Find the activity strip card (line 112):
```tsx
              <div className="group flex items-center gap-3.5 rounded-xl border border-border/50 bg-card/70 backdrop-blur-sm px-5 py-3.5 hover:border-primary/30 hover:bg-card transition-all">
```

Replace with:
```tsx
              <div className="group flex items-center gap-3.5 rounded-xl border border-border/30 bg-card px-5 py-3.5 hover:border-primary/30 hover:shadow-depth transition-all">
```

Changes: `border-border/50` → `/30`, `bg-card/70 backdrop-blur-sm` → `bg-card`, `hover:bg-card` → `hover:shadow-depth`.

- [ ] **Step 2: Update modules grid animations**

Find the modules motion.div (lines 143-148):
```tsx
            <motion.div
              key={mod.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
```

Replace with:
```tsx
            <motion.div
              key={mod.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
```

Changes: `y: 20` → `y: 12`, `delay: i * 0.1` → `i * 0.08`.

- [ ] **Step 3: Update favorites animation**

Find the favorites motion.div (lines 175-179):
```tsx
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
```

Replace with:
```tsx
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
```

Change: `y: 15` → `y: 12`.

- [ ] **Step 4: Verify build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

---

### Task 3: Update ModuleCard.tsx

**Files:**
- Modify: `src/components/home/ModuleCard.tsx`

- [ ] **Step 1: Update card classes**

Find the Link element (line 17-18):
```tsx
      className="group relative flex flex-col items-center text-center rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:scale-[1.04] hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
```

Replace with:
```tsx
      className="group relative flex flex-col items-center text-center rounded-xl border border-border/30 bg-card shadow-depth p-6 transition-all duration-300 hover:scale-[1.04] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
```

Changes: `border-border/50` → `/30`, added `shadow-depth`, added `hover:-translate-y-0.5`, `hover:border-primary/50` → `/40`.

- [ ] **Step 2: Verify build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

---

### Task 4: Update ModulePage.tsx

**Files:**
- Modify: `src/pages/ModulePage.tsx`

- [ ] **Step 1: Update breadcrumb hover**

Find the breadcrumb link (line 151):
```tsx
        <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
```

Replace with:
```tsx
        <Link to="/" className="hover:text-primary transition-colors duration-200">Início</Link>
```

- [ ] **Step 2: Update module header icon**

Find the icon container (line 159):
```tsx
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
```

Replace with:
```tsx
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,140,26,0.1)]">
```

- [ ] **Step 3: Update page enter animation**

Find the motion.div (line 156):
```tsx
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
```

Replace with:
```tsx
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
```

- [ ] **Step 4: Update tools grid animation**

Find the tools motion.div (lines 181-185):
```tsx
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
```

Replace with:
```tsx
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
```

Changes: `y: 10` → `y: 12`, `delay: i * 0.05` → `i * 0.08`.

- [ ] **Step 5: Update PropostaToolCard border**

Find the PropostaToolCard container (line 36):
```tsx
      className="group relative flex flex-col rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
```

Replace with:
```tsx
      className="group relative flex flex-col rounded-xl border border-border/30 bg-card shadow-depth p-5 transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
```

Changes: `border-border/50` → `/30`, added `shadow-depth`.

- [ ] **Step 6: Update empty state**

Find the empty state container (line 202):
```tsx
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/50 bg-card/50 py-16 text-center">
```

Replace with:
```tsx
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/30 bg-card py-16 text-center">
```

Changes: `border-border/50` → `/30`, `bg-card/50` → `bg-card`.

- [ ] **Step 7: Verify build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

---

### Task 5: Final verification

- [ ] **Step 1: Run full build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -10`
Expected: Build completes with no errors.
