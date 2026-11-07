# Layout & Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Header and BottomNav components to match the luxury dark design system — glassmorphism on fixed elements, refined hover states, cleaner layout.

**Architecture:** Two component files change. Header gets glass background, simplified layout (greeting removed), refined search/nav/avatar interactions. BottomNav gets glass background, active pill indicator, iOS safe area.

**Tech Stack:** React, Tailwind CSS, Lucide icons, Radix UI primitives (DropdownMenu, Sheet). Uses `glass-strong` utility class from design system base (sub-project 1).

---

### Task 1: Update Header — glass background, remove greeting, refine borders

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Update header container classes**

Change line 242 from:
```tsx
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
```
to:
```tsx
    <header className="sticky top-0 z-50 w-full border-b border-border/30 glass-strong">
```

- [ ] **Step 2: Remove the greeting text**

Remove the greeting `<span>` block. Change lines 286-292 from:
```tsx
            <div className="hidden md:flex items-center gap-2">
              {company && (
                <span className="text-sm text-muted-foreground">
                  Olá,{' '}
                  <span className="font-medium text-foreground">{company.name}</span>
                </span>
              )}
              <DropdownMenu>
```
to:
```tsx
            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
```

- [ ] **Step 3: Remove `company` from useAuth destructuring**

Change line 233 from:
```tsx
  const { user, company, logout } = useAuth();
```
to:
```tsx
  const { user, logout } = useAuth();
```

Note: `company` is still used inside the mobile Sheet menu (line 336). We need to keep it accessible there. Actually, let me check — yes, the mobile sheet shows `company.name`. So we need to keep `company` in the destructuring.

Revert this step — keep the line as:
```tsx
  const { user, company, logout } = useAuth();
```

- [ ] **Step 4: Verify build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

---

### Task 2: Update Header — refine nav links and avatar hover

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Update desktop nav link hover classes**

Change lines 258-261 from:
```tsx
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
```
to:
```tsx
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
              }`}
```

Changes: `hover:bg-muted` → `hover:bg-primary/5`, added `duration-200`.

- [ ] **Step 2: Update avatar hover effect**

Change lines 296-301 from:
```tsx
                  <button className="focus-visible:outline-none rounded-full">
                    <UserAvatar
                      name={user.name}
                      avatarUrl={user.avatarUrl}
                      size="md"
                      className="hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                    />
                  </button>
```
to:
```tsx
                  <button className="focus-visible:outline-none rounded-full">
                    <UserAvatar
                      name={user.name}
                      avatarUrl={user.avatarUrl}
                      size="md"
                      className="hover:shadow-[0_0_12px_rgba(255,140,26,0.2)] transition-all duration-200 cursor-pointer"
                    />
                  </button>
```

Change: ring → glow shadow.

- [ ] **Step 3: Verify build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

---

### Task 3: Update Header — refine search input and dropdown

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Update search input classes**

Change line 206 from:
```tsx
        className={`w-full h-9 pl-9 pr-8 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors ${inputClassName ?? ''}`}
```
to:
```tsx
        className={`w-full h-9 pl-9 pr-8 rounded-xl bg-surface border border-border/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors ${inputClassName ?? ''}`}
```

Changes: `rounded-lg` → `rounded-xl`, `bg-muted/50` → `bg-surface`, `primary/40` → `primary/30` (both ring and border).

- [ ] **Step 2: Update search results dropdown — no results state**

Change line 91 from:
```tsx
      <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl p-4 z-50">
```
to:
```tsx
      <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border/30 glass-strong shadow-xl p-4 z-50">
```

- [ ] **Step 3: Update search results dropdown — results container**

Change line 103 from:
```tsx
    <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl overflow-hidden z-50">
```
to:
```tsx
    <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border/30 glass-strong shadow-xl overflow-hidden z-50">
```

- [ ] **Step 4: Update mobile sheet background**

Change line 332 from:
```tsx
            <SheetContent side="right" className="bg-background border-border w-72">
```
to:
```tsx
            <SheetContent side="right" className="bg-card border-border/30 w-72">
```

- [ ] **Step 5: Update mobile nav link hover classes**

Change lines 351-354 from:
```tsx
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
```
to:
```tsx
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      location.pathname === link.to
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                    }`}
```

- [ ] **Step 6: Update mobile profile link hover classes**

Change lines 362-365 from:
```tsx
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
```
to:
```tsx
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    location.pathname === '/profile'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                  }`}
```

- [ ] **Step 7: Verify build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

---

### Task 4: Update BottomNav — glass, active pill, safe area

**Files:**
- Modify: `src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Replace the entire BottomNav component**

Replace the full content of `src/components/layout/BottomNav.tsx` with:

```tsx
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Search, User } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/tools', label: 'Ferramentas', icon: LayoutGrid },
  { to: '/tools?search=', label: 'Busca', icon: Search },
  { to: '/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/30 glass-strong pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              className="flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors duration-200"
            >
              <div
                className={`p-1.5 rounded-xl transition-colors duration-200 ${
                  isActive ? 'bg-primary/10' : ''
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              </div>
              <span
                className={
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

Changes from original:
- Container: `glass-strong` + `border-border/30` + `pb-[env(safe-area-inset-bottom)]`
- Active icon wrapped in pill: `bg-primary/10 rounded-xl p-1.5`
- Active label: `text-primary font-medium`
- Added `duration-200` to transitions
- Removed inline conditional from Link className (moved to child elements)

- [ ] **Step 2: Verify build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

---

### Task 5: Final verification

**Files:**
- No modifications — verification only.

- [ ] **Step 1: Run full build**

Run: `cd seven_tools_front && npx vite build 2>&1 | tail -10`
Expected: Build completes with no errors.

- [ ] **Step 2: Visual checklist**

Start dev server and verify in browser:
1. Header has glass/blur effect (slightly transparent, content scrolls behind it)
2. Header border is subtle (border-border/30)
3. No greeting text visible next to avatar (desktop)
4. Nav links show orange-tinted hover (`bg-primary/5`)
5. Avatar shows orange glow on hover (not solid ring)
6. Search input has rounded-xl corners
7. Search dropdown has glass effect
8. BottomNav (mobile) has glass effect
9. Active BottomNav item has pill behind icon
10. BottomNav respects safe area on iPhone
