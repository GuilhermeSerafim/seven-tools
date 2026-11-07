# Orbital Loader Rollout

**Date:** 2026-04-23
**Scope:** Replace the application's main screen and state loaders with the remote `orbital-loader` component from 21st.dev via shadcn

## Objective

Standardize the application's most visible loading moments around a single, branded loader experience without changing micro-interactions that already work well with `Loader2` or `Skeleton`.

The new loader should appear in places where the user is blocked waiting for an entire screen, route, or major content state to resolve.

## Decision

Use `npx shadcn@latest add https://21st.dev/r/molecule-lab-rushil/orbital-loader` to install the remote component, then wrap it in a local shared component such as `AppLoader`.

The wrapper becomes the only application-facing API for these loading states. This keeps the external component isolated, makes text/layout consistent, and gives the frontend one place to adjust sizing, spacing, copy, or fallback behavior later.

## Non-goals

- Do not replace `Loader2` inside buttons, inline actions, or compact pending states
- Do not replace `Skeleton` placeholders used to preserve card/list layout during loading
- Do not redesign unrelated page layouts while introducing the new loader
- Do not change backend behavior, data fetching flow, or route structure

## Scope

### In scope

Main route or page-level loading states:

- `src/App.tsx` `RouteFallback`
- `src/auth/AuthBootScreen.tsx`
- `src/features/comercial/caloniAnalysisUi.tsx` `CaloniLoadingState`
- `src/pages/admin/MembershipReviewsPage.tsx` initial `pendingReviewsQuery.isLoading`
- `src/pages/tools/PropostaComercial/ProposalList.tsx` full-page list loading
- `src/pages/tools/PropostaComercial/ProposalView.tsx` full-page detail loading
- `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx` initial queue loading
- `src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx` initial config loading
- `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx` initial lead loading

### Out of scope

Compact or action-local loading states that should keep `Loader2`:

- form submit buttons in auth/profile/proposal flows
- row-level pending actions in `MembershipReviewsPage`
- admin bell loading in `AdminPendingReviewsBell`
- any inline action spinner in tool pages or chat controls

Layout-preserving loading placeholders that should keep `Skeleton`:

- `src/pages/Index.tsx`
- `src/pages/ModulePage.tsx`
- shared shadcn skeleton usage in `src/components/ui/sidebar.tsx`

## Design

Create a shared component in `src/components/ui`, expected shape:

```tsx
<AppLoader
  label="Carregando seu acesso..."
  description="Estamos preparando o hub para voce."
  size="md"
  fullscreen
/>
```

### Responsibilities

- Render the imported orbital loader
- Accept optional `label` and `description`
- Support at least two presentation modes:
  - `fullscreen` for route/auth boot states
  - `section` for in-page screen states
- Expose a small size API (`sm | md | lg`) or equivalent class-based variant
- Preserve accessible loading semantics with `role="status"`, `aria-live="polite"`, and `aria-busy="true"` where appropriate

### Visual rules

- Use the orbital animation only where the loader is the primary focal point of the waiting state
- Center the loader and copy for blocked states
- Keep existing page background and typography tokens aligned with the current design system
- Do not introduce decorative wrapper cards inside existing framed surfaces unless the page already needs one

## Integration approach

1. Install the remote component through shadcn.
2. Inspect generated files and keep only the dependencies actually needed by the frontend.
3. Build `AppLoader` as a local wrapper around the generated orbital loader.
4. Replace the in-scope loading states with `AppLoader`.
5. Leave `Loader2` in buttons and inline actions unchanged.
6. Leave all skeleton-based loading states unchanged.

## File changes

### Expected new files

| File | Responsibility |
|---|---|
| `src/components/ui/app-loader.tsx` | Shared wrapper used by application loaders |
| `src/components/ui/orbital-loader.tsx` or generated equivalent | Remote component added by shadcn/21st.dev |

### Expected modified files

| File | Change |
|---|---|
| `src/App.tsx` | Replace `RouteFallback` body with `AppLoader` |
| `src/auth/AuthBootScreen.tsx` | Replace text-only boot screen with fullscreen `AppLoader` |
| `src/features/comercial/caloniAnalysisUi.tsx` | Replace central `Loader2` with orbital-based loading presentation while keeping current Caloni context copy |
| `src/pages/admin/MembershipReviewsPage.tsx` | Replace initial screen loader row with `AppLoader` in section mode |
| `src/pages/tools/PropostaComercial/ProposalList.tsx` | Replace page-level loading block |
| `src/pages/tools/PropostaComercial/ProposalView.tsx` | Replace page-level loading block |
| `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx` | Replace page-level loading copy-only state |
| `src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx` | Replace page-level loading copy-only state |
| `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx` | Replace page-level loading copy-only state |

## Copy strategy

Preserve existing page-specific copy whenever it gives context:

- `Carregando seu acesso...`
- `Estamos preparando o hub para voce.`
- `Carregando fila...`
- `Carregando configuracao...`
- `Carregando lead...`
- `Carregando proposta...`
- `Carregando propostas...`
- `Carregando revisoes pendentes...`
- `Caloni esta analisando...`

The wrapper should make this copy consistent without flattening domain-specific wording.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The remote component introduces styles or dependencies that do not match the current app | Isolate usage behind `AppLoader` and adapt classes locally instead of spreading the raw component |
| Orbital loader feels too heavy in small spaces | Restrict rollout to main screen and blocked-state loaders only |
| Replacing loaders changes layout rhythm on some pages | Keep `section` mode dimensions predictable and avoid touching skeleton-based card states |
| Accessibility regresses during the visual upgrade | Preserve `role`, `aria-live`, and text labels in the wrapper |

## Testing

### Automated

- `npm run build`
- `npm run test`

### Manual

Verify each in-scope loading state:

1. lazy route fallback displays the new loader while route chunks resolve
2. auth restore shows fullscreen loader with the existing access copy
3. Caloni analysis loading keeps the current contextual text and surrounding composition
4. proposal list and proposal detail show the new loader without shifting unrelated layout
5. lead qualification queue/form/detail use the new loader for initial blocked states
6. admin membership review page uses the new loader only for full-page initial loading
7. buttons and inline actions still use compact spinners
8. skeleton card placeholders remain unchanged

## Success criteria

1. All in-scope page or route loading states use the orbital loader through a shared local wrapper
2. No button-level or inline `Loader2` usage is replaced
3. No skeleton-based loading state is replaced
4. Existing loading copy remains contextual to each screen
5. The frontend builds and tests pass after the rollout
