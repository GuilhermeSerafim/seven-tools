# Orbital Loader Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Roll out the 21st.dev `orbital-loader` across the app's main blocked loading states through a shared `AppLoader`, while keeping inline `Loader2` spinners and `Skeleton` placeholders unchanged.

**Architecture:** Install the remote shadcn component once, isolate it behind `src/components/ui/app-loader.tsx`, and then replace only the app's full-screen or page-blocking loading states with that wrapper. Reuse the repo's existing Vitest/RTL patterns by extending each affected feature test to assert accessible loading semantics, the shared orbital primitive, and the existing page-specific copy.

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Vitest, React Testing Library, 21st.dev remote shadcn component.

**Spec Reference:** `docs/superpowers/specs/2026-04-23-orbital-loader-design.md`

---

## File Structure Map

- `package.json`
  - Dependency manifest updated only if `npx shadcn@latest add ...` pulls new packages.
- `bun.lock`, `bun.lockb`
  - Tracked lockfiles that must stay in sync if the install step changes dependencies.
- `src/components/ui/orbital-loader.tsx`
  - Remote component added by shadcn/21st.dev and normalized as the raw orbital primitive.
- `src/components/ui/app-loader.tsx`
  - New shared wrapper that owns copy, sizing, accessibility attributes, and layout modes.
- `src/components/ui/app-loader.test.tsx`
  - New unit test for the wrapper API and accessibility semantics.
- `src/App.tsx`
  - Route `Suspense` fallback switched to `AppLoader`.
- `src/App.test.tsx`
  - Route-fallback test updated to assert the shared loader renders for unresolved lazy chunks.
- `src/auth/AuthBootScreen.tsx`
  - Auth bootstrap screen switched to `AppLoader`.
- `src/auth/AuthContext.test.tsx`
  - Existing boot-screen assertions extended to verify the orbital primitive is present.
- `src/pages/admin/MembershipReviewsPage.tsx`
  - Initial query loading state switched to `AppLoader`.
- `src/pages/admin/MembershipReviewsPage.test.tsx`
  - Loading-state test added for the admin review screen.
- `src/pages/tools/PropostaComercial/ProposalList.tsx`
  - Main proposals page loading state switched to `AppLoader`.
- `src/pages/tools/PropostaComercial/ProposalList.test.tsx`
  - New loading-state coverage for `ProposalList`.
- `src/pages/tools/PropostaComercial/ProposalView.tsx`
  - Main proposal detail loading state switched to `AppLoader`.
- `src/pages/tools/PropostaComercial/ProposalView.test.tsx`
  - Loading-state test added for the proposal detail screen.
- `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx`
  - Queue bootstrap loading state switched to `AppLoader`.
- `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx`
  - Queue loading-state test added.
- `src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx`
  - Config bootstrap loading state switched to `AppLoader`.
- `src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx`
  - Form loading-state test added.
- `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx`
  - Lead bootstrap loading state switched to `AppLoader`.
- `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx`
  - Detail loading-state test added.
- `src/features/comercial/caloniAnalysisUi.tsx`
  - Caloni's central blocked loading state switched to `AppLoader` while preserving contextual steps.
- `src/features/comercial/caloniAnalysisUi.test.tsx`
  - Loading-state test updated to assert the orbital primitive is present.

---

### Task 1: Install the remote component and create the shared `AppLoader`

**Files:**
- Create: `src/components/ui/app-loader.tsx`
- Create: `src/components/ui/app-loader.test.tsx`
- Modify: `src/components/ui/orbital-loader.tsx`
- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `bun.lockb`

- [ ] **Step 1: Write the failing wrapper test**

Create `src/components/ui/app-loader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./orbital-loader", () => ({
  OrbitalLoader: () => <div data-testid="orbital-loader" />,
}));

import { AppLoader } from "./app-loader";

describe("AppLoader", () => {
  it("renders fullscreen loading semantics, copy, and the orbital primitive", () => {
    render(
      <AppLoader
        label="Carregando seu acesso..."
        description="Estamos preparando o hub para voce."
        fullscreen
      />,
    );

    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveClass("min-h-screen");
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
    expect(screen.getByTestId("orbital-loader")).toBeInTheDocument();
    expect(screen.getByText("Carregando seu acesso...")).toBeInTheDocument();
    expect(screen.getByText("Estamos preparando o hub para voce.")).toBeInTheDocument();
  });

  it("renders section mode without fullscreen sizing and hides the description when omitted", () => {
    render(<AppLoader label="Carregando fila..." size="sm" />);

    const status = screen.getByRole("status");

    expect(status).toHaveClass("py-10");
    expect(status).not.toHaveClass("min-h-screen");
    expect(screen.getByText("Carregando fila...")).toBeInTheDocument();
    expect(screen.queryByText("Estamos preparando o hub para voce.")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run src/components/ui/app-loader.test.tsx`

Expected: FAIL with `Cannot find module './app-loader'`.

- [ ] **Step 3: Install the remote orbital loader**

Run:

```bash
npx shadcn@latest add https://21st.dev/r/molecule-lab-rushil/orbital-loader
```

Expected:
- The CLI adds the remote loader component to `src/components/ui/`.
- If the CLI creates a different filename, rename that file immediately to `src/components/ui/orbital-loader.tsx` so the app imports stay stable.

- [ ] **Step 4: Normalize dependency files after the install**

Run:

```bash
bun install
```

Expected:
- `bun.lock` and `bun.lockb` reflect any new dependency introduced by the shadcn add step.
- No new untracked lockfile becomes part of the commit.

- [ ] **Step 5: Create `src/components/ui/app-loader.tsx`**

Create the wrapper with a stable app-facing API:

```tsx
import { OrbitalLoader } from "@/components/ui/orbital-loader";
import { cn } from "@/lib/utils";

type AppLoaderSize = "sm" | "md" | "lg";

const sizeClasses: Record<AppLoaderSize, string> = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

interface AppLoaderProps {
  label: string;
  description?: string;
  size?: AppLoaderSize;
  fullscreen?: boolean;
  className?: string;
}

export function AppLoader({
  label,
  description,
  size = "md",
  fullscreen = false,
  className,
}: AppLoaderProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center px-4 text-foreground",
        fullscreen ? "min-h-screen bg-background" : "py-10",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          data-testid="app-loader-orbital"
          className={cn("flex items-center justify-center text-primary", sizeClasses[size])}
        >
          <OrbitalLoader />
        </div>

        <div className="space-y-1">
          <p className="font-medium text-foreground">{label}</p>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run the wrapper test and confirm it passes**

Run: `npx vitest run src/components/ui/app-loader.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock bun.lockb src/components/ui/orbital-loader.tsx src/components/ui/app-loader.tsx src/components/ui/app-loader.test.tsx
git commit -m "feat(ui): add shared orbital AppLoader wrapper"
```

---

### Task 2: Switch the auth boot screen and route fallback to `AppLoader`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/auth/AuthBootScreen.tsx`
- Modify: `src/auth/AuthContext.test.tsx`

- [ ] **Step 1: Add the failing tests**

In `src/App.test.tsx`, add this test inside `describe("App bootstrap", ...)`:

```tsx
  it("renders the shared route fallback while a lazy public route chunk is still pending", async () => {
    mockAuthContext();
    mockFavoritesContext();

    vi.doMock("@/pages/auth/Login.tsx", () => new Promise(() => {}));

    setPath("/login");
    await renderApp();

    const status = await screen.findByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });
```

In `src/auth/AuthContext.test.tsx`, extend the existing test `"shows a visible loading shell while restoring a stored session"` with:

```tsx
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused tests to confirm they fail**

Run:

```bash
npx vitest run src/App.test.tsx src/auth/AuthContext.test.tsx
```

Expected: FAIL because the current route fallback and auth boot screen still render text-only loading states.

- [ ] **Step 3: Replace `RouteFallback` in `src/App.tsx`**

Add the import:

```tsx
import { AppLoader } from "@/components/ui/app-loader";
```

Then replace `RouteFallback` with:

```tsx
const RouteFallback = () => <AppLoader fullscreen size="sm" label="Carregando..." />;
```

- [ ] **Step 4: Replace the auth boot screen**

Replace `src/auth/AuthBootScreen.tsx` with:

```tsx
import { AppLoader } from "@/components/ui/app-loader";

export function AuthBootScreen() {
  return (
    <AppLoader
      fullscreen
      label="Carregando seu acesso..."
      description="Estamos preparando o hub para voce."
    />
  );
}
```

- [ ] **Step 5: Re-run the tests**

Run:

```bash
npx vitest run src/App.test.tsx src/auth/AuthContext.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/auth/AuthBootScreen.tsx src/auth/AuthContext.test.tsx
git commit -m "feat(app): use AppLoader for auth boot and route fallback"
```

---

### Task 3: Replace the admin and proposal page loaders

**Files:**
- Create: `src/pages/tools/PropostaComercial/ProposalList.test.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalList.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalView.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalView.test.tsx`
- Modify: `src/pages/admin/MembershipReviewsPage.tsx`
- Modify: `src/pages/admin/MembershipReviewsPage.test.tsx`

- [ ] **Step 1: Add the failing tests**

Create `src/pages/tools/PropostaComercial/ProposalList.test.tsx`:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeferred } from "@/test/createDeferred";

const { getAllMock, navigateMock } = vi.hoisted(() => ({
  getAllMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
          React.createElement(tag, props, children),
    },
  ),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    company: { name: "SEVEN" },
    isAuthenticated: true,
    isAdmin: false,
  }),
}));

vi.mock("@/services/proposalService", () => ({
  proposalService: {
    getAll: getAllMock,
    remove: vi.fn(),
    update: vi.fn(),
  },
  STATUS_LABELS: {
    draft: "Rascunho",
    ready: "Pronta para envio",
    sent: "Enviada",
    approved: "Aprovada",
    rejected: "Recusada",
  },
  STATUS_COLORS: {
    draft: "text-muted-foreground border-border",
    ready: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    sent: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    approved: "text-green-400 border-green-400/30 bg-green-400/10",
    rejected: "text-destructive border-destructive/30 bg-destructive/10",
  },
}));

describe("ProposalList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the shared AppLoader while proposals are still loading", async () => {
    const pending = createDeferred<unknown[]>();
    getAllMock.mockReturnValue(pending.promise);

    const { default: ProposalList } = await import("./ProposalList");

    render(
      <MemoryRouter>
        <ProposalList />
      </MemoryRouter>,
    );

    const status = await screen.findByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/carregando propostas/i)).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });
});
```

In `src/pages/tools/PropostaComercial/ProposalView.test.tsx`, add this test:

```tsx
  it("shows the shared AppLoader while the proposal detail request is pending", async () => {
    const { promise } = createDeferred<unknown>();
    getByIdMock.mockReturnValue(promise);

    const { default: ProposalView } = await import("./ProposalView");

    render(
      <MemoryRouter initialEntries={["/tools/proposta-comercial-smart/app/proposal-1"]}>
        <Routes>
          <Route
            path="/tools/proposta-comercial-smart/app/:proposalId"
            element={<ProposalView />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const status = await screen.findByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/carregando proposta/i)).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });
```

Also add the missing import at the top of `src/pages/tools/PropostaComercial/ProposalView.test.tsx`:

```tsx
import { createDeferred } from "@/test/createDeferred";
```

In `src/pages/admin/MembershipReviewsPage.test.tsx`, add this test:

```tsx
  it("shows the shared AppLoader during the initial review query load", async () => {
    const pending = createDeferred<typeof existingCompanyReview[]>();
    listPendingReviewsMock.mockReturnValue(pending.promise);

    renderPage();

    const status = await screen.findByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/carregando revisoes pendentes/i)).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the focused tests to confirm they fail**

Run:

```bash
npx vitest run src/pages/tools/PropostaComercial/ProposalList.test.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/admin/MembershipReviewsPage.test.tsx
```

Expected: FAIL because the current screens still render plain text or `Loader2`.

- [ ] **Step 3: Replace the loading states**

In `src/pages/tools/PropostaComercial/ProposalList.tsx`, add:

```tsx
import { AppLoader } from "@/components/ui/app-loader";
```

Then replace the loading block with:

```tsx
        {loading && (
          <AppLoader
            label="Carregando propostas..."
            size="sm"
            className="py-20"
          />
        )}
```

In `src/pages/tools/PropostaComercial/ProposalView.tsx`, add:

```tsx
import { AppLoader } from "@/components/ui/app-loader";
```

Then replace the `if (loading)` block with:

```tsx
  if (loading) {
    return (
      <div className="container">
        <AppLoader label="Carregando proposta..." size="sm" className="py-16" />
      </div>
    );
  }
```

In `src/pages/admin/MembershipReviewsPage.tsx`, add:

```tsx
import { AppLoader } from "@/components/ui/app-loader";
```

Then replace the `pendingReviewsQuery.isLoading` block with:

```tsx
  if (pendingReviewsQuery.isLoading) {
    return (
      <div className="container py-12">
        <AppLoader label="Carregando revisoes pendentes..." size="sm" />
      </div>
    );
  }
```

- [ ] **Step 4: Re-run the focused tests**

Run:

```bash
npx vitest run src/pages/tools/PropostaComercial/ProposalList.test.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/admin/MembershipReviewsPage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tools/PropostaComercial/ProposalList.tsx src/pages/tools/PropostaComercial/ProposalList.test.tsx src/pages/tools/PropostaComercial/ProposalView.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/admin/MembershipReviewsPage.tsx src/pages/admin/MembershipReviewsPage.test.tsx
git commit -m "feat(loaders): use AppLoader in admin and proposal screens"
```

---

### Task 4: Replace the lead qualification page loaders

**Files:**
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx`

- [ ] **Step 1: Add the failing tests**

In `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx`, add:

```tsx
  it("shows the shared AppLoader while the queue bootstrap request is pending", async () => {
    getConfigMock.mockImplementation(() => new Promise(() => {}));

    const { default: LeadQualificationQueue } = await import("./LeadQualificationQueue");

    render(
      <MemoryRouter>
        <LeadQualificationQueue />
      </MemoryRouter>,
    );

    const status = await screen.findByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/carregando fila/i)).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  }, 10000);
```

In `src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx`, add:

```tsx
  it("shows the shared AppLoader while the form bootstrap request is pending", async () => {
    getConfigMock.mockImplementation(() => new Promise(() => {}));

    const { default: LeadQualificationForm } = await import("./LeadQualificationForm");

    render(
      <MemoryRouter>
        <LeadQualificationForm />
      </MemoryRouter>,
    );

    const status = await screen.findByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/carregando configuracao/i)).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  }, 10000);
```

In `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx`, add:

```tsx
  it("shows the shared AppLoader while the lead bootstrap request is pending", async () => {
    getLeadMock.mockImplementation(() => new Promise(() => {}));

    const { default: LeadQualificationDetail } = await import("./LeadQualificationDetail");

    render(
      <MemoryRouter initialEntries={["/tools/qualificacao-de-leads/app/lead-1"]}>
        <Routes>
          <Route
            path="/tools/qualificacao-de-leads/app/:leadId"
            element={<LeadQualificationDetail />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const status = await screen.findByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(/carregando lead/i)).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  }, 10000);
```

- [ ] **Step 2: Run the focused tests to confirm they fail**

Run:

```bash
npx vitest run src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx
```

Expected: FAIL because the current pages still render copy-only loading states.

- [ ] **Step 3: Replace the loading states**

In `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx`, add:

```tsx
import { AppLoader } from "@/components/ui/app-loader";
```

Then replace the `if (isLoading)` block with:

```tsx
  if (isLoading) {
    return (
      <div className="container">
        <AppLoader label="Carregando fila..." size="sm" className="py-10" />
      </div>
    );
  }
```

In `src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx`, add:

```tsx
import { AppLoader } from "@/components/ui/app-loader";
```

Then replace the `if (isLoadingConfig)` block with:

```tsx
  if (isLoadingConfig) {
    return (
      <div className="container">
        <AppLoader label="Carregando configuracao..." size="sm" className="py-10" />
      </div>
    );
  }
```

In `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx`, add:

```tsx
import { AppLoader } from "@/components/ui/app-loader";
```

Then replace the `if (isLoading)` block with:

```tsx
  if (isLoading) {
    return (
      <div className="container">
        <AppLoader label="Carregando lead..." size="sm" className="py-10" />
      </div>
    );
  }
```

- [ ] **Step 4: Re-run the focused tests**

Run:

```bash
npx vitest run src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx
git commit -m "feat(loaders): use AppLoader in lead qualification screens"
```

---

### Task 5: Replace the Caloni analysis loader

**Files:**
- Modify: `src/features/comercial/caloniAnalysisUi.tsx`
- Modify: `src/features/comercial/caloniAnalysisUi.test.tsx`

- [ ] **Step 1: Add the failing assertion**

In `src/features/comercial/caloniAnalysisUi.test.tsx`, extend the existing test `"renders the shared loading state copy for proposal and file analyses"` with:

```tsx
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
```

Keep the existing step-copy assertions intact.

- [ ] **Step 2: Run the focused test to confirm it fails**

Run: `npx vitest run src/features/comercial/caloniAnalysisUi.test.tsx`

Expected: FAIL because `CaloniLoadingState` still uses `Loader2`.

- [ ] **Step 3: Replace the central spinner with `AppLoader`**

In `src/features/comercial/caloniAnalysisUi.tsx`, add:

```tsx
import { AppLoader } from "@/components/ui/app-loader";
```

Remove `Loader2` from the `lucide-react` import list.

Then replace:

```tsx
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-display text-base font-semibold">Caloni esta analisando...</p>
      </div>
```

With:

```tsx
      <AppLoader
        label="Caloni esta analisando..."
        size="sm"
        className="py-8"
      />
```

- [ ] **Step 4: Re-run the focused test**

Run: `npx vitest run src/features/comercial/caloniAnalysisUi.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/comercial/caloniAnalysisUi.tsx src/features/comercial/caloniAnalysisUi.test.tsx
git commit -m "feat(loaders): use AppLoader in Caloni analysis state"
```

---

### Task 6: Run the full verification pass and confirm out-of-scope states stayed unchanged

**Files:** none

- [ ] **Step 1: Run the focused regression suite**

Run:

```bash
npx vitest run src/components/ui/app-loader.test.tsx src/App.test.tsx src/auth/AuthContext.test.tsx src/features/comercial/caloniAnalysisUi.test.tsx src/pages/admin/MembershipReviewsPage.test.tsx src/pages/tools/PropostaComercial/ProposalList.test.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx
```

Expected: PASS in all targeted suites.

- [ ] **Step 2: Run the full automated test suite**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 3: Build the frontend**

Run: `npm run build`

Expected: PASS with no TypeScript or bundling errors.

- [ ] **Step 4: Confirm out-of-scope files were not modified**

Run:

```bash
git diff --name-only
```

Expected:
- The diff should not include `src/pages/Index.tsx`.
- The diff should not include `src/pages/ModulePage.tsx`.
- The diff should not include `src/components/ui/sidebar.tsx`.
- The diff should not include `src/components/admin/AdminPendingReviewsBell.tsx`.

- [ ] **Step 5: Run a manual smoke test with the dev server**

Run: `npm run dev`

Manual checks:
1. Open `/login`, hard-refresh, and confirm the auth boot loader shows the orbital animation with:
   - `Carregando seu acesso...`
   - `Estamos preparando o hub para voce.`
2. Open `/hub` and navigate to a lazy route such as `/login` or `/profile`; confirm the route fallback now uses the orbital loader instead of text-only loading.
3. Open `/tools/proposta-comercial-smart/app`; with slow network throttling enabled in the browser, confirm the proposals page shows `Carregando propostas...` with the orbital loader.
4. Open one proposal detail page; with slow network throttling enabled, confirm `Carregando proposta...` shows the orbital loader.
5. Open `/tools/qualificacao-de-leads/app`, `/tools/qualificacao-de-leads/app/new`, and one lead detail route; confirm each blocked bootstrap state uses the orbital loader.
6. Open `/admin/membros-pendentes` as an admin and confirm the initial fetch uses the orbital loader.
7. Trigger a Caloni analysis and confirm the central loading state uses the orbital loader while the existing step list remains visible.
8. Confirm button-level spinners still use compact `Loader2` and card/list skeletons remain unchanged.

- [ ] **Step 6: Commit the finished rollout**

```bash
git add src/App.tsx src/App.test.tsx src/auth/AuthBootScreen.tsx src/auth/AuthContext.test.tsx src/components/ui/orbital-loader.tsx src/components/ui/app-loader.tsx src/components/ui/app-loader.test.tsx src/features/comercial/caloniAnalysisUi.tsx src/features/comercial/caloniAnalysisUi.test.tsx src/pages/admin/MembershipReviewsPage.tsx src/pages/admin/MembershipReviewsPage.test.tsx src/pages/tools/PropostaComercial/ProposalList.tsx src/pages/tools/PropostaComercial/ProposalList.test.tsx src/pages/tools/PropostaComercial/ProposalView.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx package.json bun.lock bun.lockb
git commit -m "feat(frontend): roll out orbital loader for primary loading states"
```

---

## Self-review

**1. Spec coverage**

- Install remote component through shadcn: Task 1
- Shared wrapper with label/description/size/fullscreen API: Task 1
- Route fallback: Task 2
- Auth boot screen: Task 2
- Admin membership review loading: Task 3
- Proposal list and proposal detail loading: Task 3
- Lead qualification queue/form/detail loading: Task 4
- Caloni loading state: Task 5
- Keep inline `Loader2` and `Skeleton` states unchanged: Task 6 explicit diff/manual verification
- Automated test coverage plus build verification: Task 6

**2. Placeholder scan**

- No `TODO`, `TBD`, or "implement later" instructions remain.
- Every code-changing step includes the concrete snippet to add or replace.
- Every verification step includes an exact command and expected outcome.

**3. Type consistency**

- `AppLoader` is the single app-facing API across all tasks.
- The wrapper always exposes `label`, optional `description`, `size`, `fullscreen`, and `className`.
- All tests look for the same stable test id: `app-loader-orbital`.
- All loading blocks preserve their existing per-screen copy, matching the approved spec.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-23-orbital-loader-rollout.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
