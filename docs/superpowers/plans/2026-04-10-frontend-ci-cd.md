# Frontend CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a required GitHub Actions quality gate to `seven_tools_front`, create the `develop` release branch, and wire Vercel preview and production behavior to `develop` and `main`.

**Architecture:** Keep deployment split by responsibility. GitHub Actions blocks bad merges with one Bun-based workflow, while Vercel remains the deploy engine. `main` stays the production branch, and `develop` becomes the homologation branch through Vercel Preview deployments with preview-scoped API environment variables.

**Tech Stack:** GitHub Actions, Bun, Vite, ESLint, Vitest, Vercel, Git.

---

> Run the shell commands below from the workspace root: `C:\Users\Guiler\Desktop\wks\seven\Seven_Tools`

### Task 1: Add the frontend CI workflow

**Files:**
- Create: `seven_tools_front/.github/workflows/frontend-ci.yml`
- Verify: `seven_tools_front/package.json`
- Verify: `seven_tools_front/vitest.config.ts`

- [ ] **Step 1: Create the workflow file**

Create `seven_tools_front/.github/workflows/frontend-ci.yml` with this content:

```yaml
name: frontend-ci

on:
  pull_request:
    branches:
      - develop
      - main
  push:
    branches:
      - develop
      - main

concurrency:
  group: frontend-ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  frontend-quality:
    name: frontend-quality
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run ESLint
        run: bun run lint

      - name: Run Vitest
        run: bun run test

      - name: Run production build
        env:
          VITE_API_BASE_URL: https://api.example.invalid/api/v1
        run: bun run build
```

- [ ] **Step 2: Confirm the workflow file is the only new code file**

Run:

```powershell
git -C ".\seven_tools_front" status --short
```

Expected: one new path under `.github/workflows/`, plus any pre-existing unrelated user changes that were already in the repo.

### Task 2: Expose the API base URL in the frontend env template

**Files:**
- Modify: `seven_tools_front/.env.example`
- Verify: `seven_tools_front/src/lib/apiClient.ts`

- [ ] **Step 1: Add the API base URL variable to the env template**

Insert this block near the top of `seven_tools_front/.env.example`, immediately below the copy instructions:

```env
# API base URL used by the axios client in local, preview, and production builds.
# Local development should keep the FastAPI default unless you intentionally proxy it.
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

- [ ] **Step 2: Verify the env template now documents the variable that `apiClient.ts` already reads**

Run:

```powershell
Get-Content ".\seven_tools_front\.env.example"
```

Expected: the file now includes `VITE_API_BASE_URL=http://localhost:8000/api/v1` and still keeps the existing Groq-related variables below it.

### Task 3: Run the local quality gate and commit the repo changes

**Files:**
- Verify: `seven_tools_front/.github/workflows/frontend-ci.yml`
- Verify: `seven_tools_front/.env.example`
- Verify: `seven_tools_front/package.json`

- [ ] **Step 1: Install dependencies exactly the way CI will**

Run:

```powershell
Push-Location .\seven_tools_front
bun install --frozen-lockfile
Pop-Location
```

Expected: exit code `0` and no lockfile rewrite.

- [ ] **Step 2: Run the lint gate**

Run:

```powershell
Push-Location .\seven_tools_front
bun run lint
Pop-Location
```

Expected: exit code `0` and no ESLint errors.

- [ ] **Step 3: Run the unit and component tests**

Run:

```powershell
Push-Location .\seven_tools_front
bun run test
Pop-Location
```

Expected: Vitest finishes green with the existing suite passing.

- [ ] **Step 4: Run the production build with an explicit API URL**

Run:

```powershell
Push-Location .\seven_tools_front
$env:VITE_API_BASE_URL='https://api.example.invalid/api/v1'
bun run build
Remove-Item Env:VITE_API_BASE_URL
Pop-Location
```

Expected: exit code `0`. If `dist/` changes because the repo tracks built artifacts, leave those files unstaged for this task.

- [ ] **Step 5: Commit the frontend CI changes**

Run:

```powershell
git -C ".\seven_tools_front" add .github/workflows/frontend-ci.yml .env.example
git -C ".\seven_tools_front" commit -m "ci: add frontend quality workflow"
```

Expected: one commit containing only the workflow file and `.env.example`.

### Task 4: Create the `develop` branch and protect the release branches

**Files:**
- Modify: GitHub branch settings for `seven_tools_front`

- [ ] **Step 1: Create and push `develop` if the repo does not already have it**

Run:

```powershell
if (git -C ".\seven_tools_front" ls-remote --exit-code --heads origin develop 2>$null) {
  git -C ".\seven_tools_front" fetch origin develop:develop
  git -C ".\seven_tools_front" switch develop
} else {
  git -C ".\seven_tools_front" switch -c develop
  git -C ".\seven_tools_front" push -u origin develop
}
```

Expected: `develop` exists locally and tracks `origin/develop`.

- [ ] **Step 2: Protect `develop` in GitHub**

In the GitHub repository for `seven_tools_front`, open `Settings -> Branches` and add a protection rule for `develop` with these exact controls:

```text
Require a pull request before merging: ON
Require status checks to pass before merging: ON
Required status checks: frontend-quality
Require branches to be up to date before merging: ON
Allow force pushes: OFF
Allow deletions: OFF
```

- [ ] **Step 3: Protect `main` with the same gate**

Repeat the same branch protection rule for `main`, again requiring the `frontend-quality` check before merge.

### Task 5: Configure Vercel for homologation and production

**Files:**
- Modify: Vercel project settings for `seven_tools_front`

- [ ] **Step 1: Confirm the production branch is `main`**

In Vercel, open the frontend project and go to `Settings -> Git`. Set:

```text
Production Branch: main
```

Expected: only pushes and merges to `main` create Production deployments.

- [ ] **Step 2: Set environment variables for Preview and Production**

In `Settings -> Environment Variables`, add the same key in two scopes:

```text
Key: VITE_API_BASE_URL
Preview value: use the full Render staging API origin and end it with /api/v1
Production value: use the full Render production API origin and end it with /api/v1
```

Expected: every Preview deployment, including `develop`, points at the staging API, while `main` points at the production API.

- [ ] **Step 3: Verify the release path end to end**

Run this release drill:

```text
1. Create a throwaway branch from develop, for example feature/ci-smoke-test
2. Open a PR into develop and wait for the frontend-quality check to pass
3. Merge into develop and confirm Vercel publishes a Preview deployment for the develop branch
4. Open a PR from develop into main and wait for the frontend-quality check to pass again
5. Merge into main and confirm Vercel publishes a Production deployment
```

Expected: PRs cannot merge without `frontend-quality`, `develop` updates the Preview deployment, and `main` updates Production.
