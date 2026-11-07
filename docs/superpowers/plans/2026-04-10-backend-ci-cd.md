# Backend CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a required GitHub Actions quality gate to `seven_tools_api`, make the API compatible with Vercel Preview origins for staging, create the `develop` release branch, and configure Render to deploy `develop` to staging and `main` to production.

**Architecture:** Keep the backend deploy engine in Render and use GitHub Actions only as the merge gate. Add one small runtime change so staging can accept Vercel Preview origins through a regex-based CORS setting, then add a Postgres-backed CI workflow that runs migrations and tests on every PR and push to `develop` and `main`.

**Tech Stack:** GitHub Actions, Python 3.12, pytest, FastAPI, SQLAlchemy, Alembic, Postgres 16, Render, Git.

---

> Run the shell commands below from the workspace root: `C:\Users\Guiler\Desktop\wks\seven\Seven_Tools`

### Task 1: Add regex-based CORS support for staging preview deployments

**Files:**
- Modify: `seven_tools_api/app/config.py`
- Modify: `seven_tools_api/app/main.py`
- Modify: `seven_tools_api/.env.example`

- [ ] **Step 1: Add a dedicated regex setting to `Settings`**

In `seven_tools_api/app/config.py`, update the settings fields so the CORS section reads exactly like this:

```python
class Settings(BaseSettings):
    database_url: str

    @model_validator(mode="after")
    def fix_postgres_scheme(self):
        # Render uses postgres:// but SQLAlchemy needs postgresql://
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql://", 1)
        return self

    database_url_test: str = ""
    secret_key: str = "dev-secret-key"
    cors_origins: str = "http://localhost:8080"
    cors_origin_regex: str = ""
    ai_base_url: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-4o"
    ai_api_key: str = ""
    ai_max_tokens: int = 8192
    ai_temperature: float = 0.3
    session_ttl_days: int = 7
    login_rate_limit: str = "5/minute"

    model_config = {"env_file": ".env"}
```

- [ ] **Step 2: Refactor app creation so CORS can be tested with patched settings**

Replace the current startup code in `seven_tools_api/app/main.py` with this structure:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.modules.ai.router import router as ai_router
from app.modules.auth.router import router as auth_router
from app.modules.lead_qualification.router import router as lead_qualification_router
from app.modules.proposals.router import router as proposals_router
from app.modules.users.router import router as users_router

limiter = Limiter(key_func=get_remote_address)


def create_app() -> FastAPI:
    app = FastAPI(title="SEVEN Tools API", version="0.1.0")
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(","),
        allow_origin_regex=settings.cors_origin_regex or None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(users_router, prefix="/api/v1")
    app.include_router(proposals_router, prefix="/api/v1")
    app.include_router(lead_qualification_router, prefix="/api/v1")
    app.include_router(ai_router, prefix="/api/v1")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
```

- [ ] **Step 3: Document the new env var in the backend template**

Add this block to `seven_tools_api/.env.example` immediately below `CORS_ORIGINS=...`:

```env
# Optional regex for preview deployments in staging, for example:
# CORS_ORIGIN_REGEX=https://.*\.vercel\.app
CORS_ORIGIN_REGEX=
```

### Task 2: Add coverage for explicit and regex-based CORS origins

**Files:**
- Create: `seven_tools_api/tests/test_cors.py`
- Verify: `seven_tools_api/app/main.py`

- [ ] **Step 1: Create the CORS regression test file**

Create `seven_tools_api/tests/test_cors.py` with this content:

```python
from fastapi.testclient import TestClient

from app.config import settings
from app.main import create_app


def _preflight(origin: str):
    client = TestClient(create_app())
    return client.options(
        "/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        },
    )


def test_health_allows_explicit_origin(monkeypatch):
    monkeypatch.setattr(settings, "cors_origins", "http://localhost:5173")
    monkeypatch.setattr(settings, "cors_origin_regex", "")

    response = _preflight("http://localhost:5173")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_health_allows_vercel_preview_origin_with_regex(monkeypatch):
    monkeypatch.setattr(settings, "cors_origins", "http://localhost:5173")
    monkeypatch.setattr(settings, "cors_origin_regex", r"https://.*\.vercel\.app")

    preview_origin = "https://seven-tools-front-git-feature-ci-smoke-test.vercel.app"
    response = _preflight(preview_origin)

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == preview_origin
```

- [ ] **Step 2: Run only the new CORS tests first**

Run:

```powershell
Push-Location .\seven_tools_api
python -m pytest .\tests\test_cors.py -q
Pop-Location
```

Expected: both tests pass and confirm the API accepts explicit local origins and Vercel preview origins matched by regex.

### Task 3: Add the backend CI workflow

**Files:**
- Create: `seven_tools_api/.github/workflows/backend-ci.yml`
- Verify: `seven_tools_api/requirements.txt`
- Verify: `seven_tools_api/pytest.ini`
- Verify: `seven_tools_api/alembic.ini`

- [ ] **Step 1: Create the GitHub Actions workflow**

Create `seven_tools_api/.github/workflows/backend-ci.yml` with this content:

```yaml
name: backend-ci

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
  group: backend-ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  backend-quality:
    name: backend-quality
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: seven
          POSTGRES_PASSWORD: seven_dev
          POSTGRES_DB: seven_tools_ci
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U seven -d seven_tools_ci"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://seven:seven_dev@localhost:5432/seven_tools_ci
      DATABASE_URL_TEST: postgresql://seven:seven_dev@localhost:5432/seven_tools_ci
      SECRET_KEY: ci-secret-key
      CORS_ORIGINS: http://localhost:5173,http://localhost:8080
      CORS_ORIGIN_REGEX: ""

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run database migrations
        run: alembic upgrade head

      - name: Run pytest
        run: pytest -q
```

- [ ] **Step 2: Confirm the workflow file is the only new automation file**

Run:

```powershell
git -C ".\seven_tools_api" status --short
```

Expected: one new workflow file, one new test file, and the modified backend source and env template files.

### Task 4: Verify the backend locally and commit the repo changes

**Files:**
- Verify: `seven_tools_api/docker-compose.yml`
- Verify: `seven_tools_api/tests/test_cors.py`
- Verify: `seven_tools_api/.github/workflows/backend-ci.yml`

- [ ] **Step 1: Start the local Postgres containers used by dev and test**

Run:

```powershell
docker compose -f .\seven_tools_api\docker-compose.yml up -d db db-test
```

Expected: both Postgres services start and expose ports `5434` and `5433`.

- [ ] **Step 2: Run Alembic against the primary local database**

Run:

```powershell
git -C ".\seven_tools_api" rev-parse --show-toplevel | Out-Null
Push-Location .\seven_tools_api
alembic upgrade head
Pop-Location
```

Expected: Alembic reports `Running upgrade` and exits `0`.

- [ ] **Step 3: Run the full backend test suite**

Run:

```powershell
Push-Location .\seven_tools_api
python -m pytest .\tests -q
Pop-Location
```

Expected: the existing suite stays green and includes the new CORS test file.

- [ ] **Step 4: Stop the local Postgres containers**

Run:

```powershell
docker compose -f .\seven_tools_api\docker-compose.yml down
```

Expected: both local containers stop cleanly.

- [ ] **Step 5: Commit the backend CI and CORS changes**

Run:

```powershell
git -C ".\seven_tools_api" add app/config.py app/main.py .env.example tests/test_cors.py .github/workflows/backend-ci.yml
git -C ".\seven_tools_api" commit -m "ci: add backend quality workflow"
```

Expected: one commit containing the CORS config change, the test file, and the workflow.

### Task 5: Create the `develop` branch and protect the release branches

**Files:**
- Modify: GitHub branch settings for `seven_tools_api`

- [ ] **Step 1: Create and push `develop` if it does not already exist**

Run:

```powershell
if (git -C ".\seven_tools_api" ls-remote --exit-code --heads origin develop 2>$null) {
  git -C ".\seven_tools_api" fetch origin develop:develop
  git -C ".\seven_tools_api" switch develop
} else {
  git -C ".\seven_tools_api" switch -c develop
  git -C ".\seven_tools_api" push -u origin develop
}
```

Expected: `develop` exists locally and tracks `origin/develop`.

- [ ] **Step 2: Protect `develop` in GitHub**

In the GitHub repository for `seven_tools_api`, open `Settings -> Branches` and add a protection rule for `develop` with these exact controls:

```text
Require a pull request before merging: ON
Require status checks to pass before merging: ON
Required status checks: backend-quality
Require branches to be up to date before merging: ON
Allow force pushes: OFF
Allow deletions: OFF
```

- [ ] **Step 3: Protect `main` with the same gate**

Repeat the same branch protection rule for `main`, again requiring the `backend-quality` check before merge.

### Task 6: Configure Render for production and staging

**Files:**
- Modify: Render service settings for `seven_tools_api`

- [ ] **Step 1: Lock the existing production service to `main`**

In the Render dashboard, open the existing `seven-tools-api` service and set:

```text
Branch: main
Auto-Deploy: After CI Checks Pass
```

Expected: production deploys only from `main`, and only after the `backend-quality` check is green.

- [ ] **Step 2: Create a dedicated staging web service**

In Render, create a second web service from the same repo with these values:

```text
Service name: seven-tools-api-staging
Branch: develop
Build command: pip install -r requirements.txt && alembic upgrade head
Start command: gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
Auto-Deploy: After CI Checks Pass
```

Expected: merges into `develop` deploy only to `seven-tools-api-staging`.

- [ ] **Step 3: Create a dedicated staging database**

Create a second Postgres database for staging and attach it to `seven-tools-api-staging`. Use this rule:

```text
Production keeps the existing seven-tools-db connection
Staging gets its own database and must not share production data
If the workspace already uses the free Postgres slot for production, create the staging database on the lowest paid Postgres option available in Render or place staging in a separate workspace
```

Expected: production and staging have separate data stores.

- [ ] **Step 4: Set the staging environment variables**

Configure the staging service with these keys:

```text
DATABASE_URL=paste the connection string of the staging Postgres instance you just created
SECRET_KEY=generate a fresh value with `python -c "import secrets; print(secrets.token_urlsafe(32))"` and paste the result here
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
CORS_ORIGIN_REGEX=https://.*\.vercel\.app
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
AI_API_KEY=paste the staging Groq secret from your secret manager
AI_MAX_TOKENS=8192
AI_TEMPERATURE=0.3
```

Expected: staging accepts Vercel Preview origins and stays isolated from production secrets and data.

- [ ] **Step 5: Confirm the production environment stays strict**

On the production Render service, keep exact origins only:

```text
CORS_ORIGINS=copy the exact Vercel Production domain or custom production domain attached to the frontend project
CORS_ORIGIN_REGEX=
```

Expected: production does not allow generic preview origins.

### Task 7: Verify the backend release path end to end

**Files:**
- Verify: Render deployments for `seven-tools-api` and `seven-tools-api-staging`

- [ ] **Step 1: Run a staging release drill**

Use this sequence:

```text
1. Create a throwaway branch from develop, for example feature/backend-ci-smoke-test
2. Open a PR into develop and wait for backend-quality to pass
3. Merge into develop
4. Confirm Render deploys seven-tools-api-staging only
5. Call GET /health on the staging API and confirm {"status":"ok"}
```

Expected: staging deploys from `develop` with no production change.

- [ ] **Step 2: Run a production promotion drill**

Use this sequence:

```text
1. Open a PR from develop into main
2. Wait for backend-quality to pass again
3. Merge into main
4. Confirm Render deploys seven-tools-api
5. Call GET /health on the production API and confirm {"status":"ok"}
```

Expected: production deploys only after the `develop -> main` promotion path.
