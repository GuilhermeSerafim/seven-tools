# Sales Copilot Caloni Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Sales Copilot Caloni core inside the Comercial module, with manual or replay transcript ingestion, live strategic guidance, and post-call review for the seller.

**Architecture:** Keep the Chrome Meet extension out of this plan. Build the core product first: canonical Caloni runtime in the API, session and transcript persistence, deterministic state plus decision scaffolding, Groq on the live path, GPT-4o on the post-call path, and a web UI with a live workspace, replay input, and review screens.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Pydantic, httpx, pytest, React 18, TypeScript, Vitest, React Router, shadcn/ui.

---

> Run the shell commands below from the workspace root: `C:\Users\Guiler\Desktop\wks\seven\Seven_Tools`

## Scope Cut

This plan implements the **core Sales Copilot tool only**.

Do not build the Google Meet Chrome extension in this plan.

The first supported inputs are:
- manual transcript chunks
- replay transcript chunks

The first supported outputs are:
- live stage and risk reading
- next-move recommendation
- short utterance suggestion
- post-call review for the seller

## File Map

### Backend knowledge and runtime

- Create: `seven_tools_api/app/modules/sales_copilot/__init__.py`
  - Own the new Sales Copilot backend module namespace.
- Create: `seven_tools_api/app/modules/sales_copilot/knowledge_runtime.py`
  - Load only the approved structured Caloni corpus and expose a runtime manifest.
- Modify: `seven_tools_api/app/modules/ai/knowledge.py`
  - Make the existing AI module read the canonical ordered Caloni files instead of blindly concatenating every markdown file in the folder.
- Modify or create canonical knowledge files in `seven_tools_api/knowledge/caloni/*.md`
  - Promote the structured Caloni corpus into the main repo so `.worktrees` content is no longer the runtime dependency.
- Create: `seven_tools_api/tests/test_sales_copilot_runtime.py`
  - Lock the runtime manifest shape and canonical file ordering.

### Backend domain and transport

- Create: `seven_tools_api/app/models/sales_copilot.py`
  - Store call sessions and transcript chunks.
- Modify: `seven_tools_api/app/models/__init__.py`
  - Export Sales Copilot models and enums.
- Create: `seven_tools_api/app/schemas/sales_copilot.py`
  - Define API contracts for sessions, chunks, live updates, and reviews.
- Create: `seven_tools_api/app/modules/sales_copilot/service.py`
  - Persist sessions and chunks, read reviews, and orchestrate updates.
- Create: `seven_tools_api/app/modules/sales_copilot/router.py`
  - Expose authenticated REST endpoints for the core tool.
- Modify: `seven_tools_api/app/main.py`
  - Register the Sales Copilot router.
- Create: `seven_tools_api/alembic/versions/9c4b5d2f8e11_add_sales_copilot_tables.py`
  - Create the new tables.
- Create: `seven_tools_api/tests/test_sales_copilot_api.py`
  - Lock the session lifecycle and review API behavior.

### Backend AI routing and analysis

- Modify: `seven_tools_api/app/config.py`
  - Add dedicated Groq and OpenAI settings for Sales Copilot while keeping existing generic AI settings intact.
- Modify: `seven_tools_api/.env.example`
  - Document the new Sales Copilot provider variables.
- Create: `seven_tools_api/app/modules/sales_copilot/providers.py`
  - Provide explicit live-path and post-call-path JSON calls.
- Create: `seven_tools_api/app/modules/sales_copilot/analysis.py`
  - Build deterministic defaults, prompt inputs, provider routing, and persisted live and review artifacts.
- Modify: `seven_tools_api/app/modules/sales_copilot/service.py`
  - Trigger live analysis on chunk ingestion and post-call analysis on session completion.
- Create: `seven_tools_api/tests/test_sales_copilot_analysis.py`
  - Lock provider routing, state updates, and review persistence without hitting the network.

### Frontend tool registration and UI

- Modify: `seven_tools_front/src/features/comercial/toolRoutes.ts`
  - Add the Sales Copilot slug and path helpers.
- Modify: `seven_tools_front/src/data/tools.ts`
  - Register the Sales Copilot tool in the Comercial module catalog.
- Modify: `seven_tools_front/src/App.tsx`
  - Register the nested Sales Copilot routes.
- Create: `seven_tools_front/src/services/salesCopilotService.ts`
  - Wrap the new API endpoints with front-end friendly types.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotShell.tsx`
  - Shared navigation shell for live, replay, and reviews.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotWorkspace.tsx`
  - Live workspace for incremental chunk submission and intervention display.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReplay.tsx`
  - Bulk replay textarea that converts pasted transcript lines into chunks.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviews.tsx`
  - Review list for completed calls.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.tsx`
  - Review detail view with summary and transcript.
- Create: `seven_tools_front/src/features/comercial/salesCopilotRoutes.test.ts`
  - Lock route helpers.
- Create: `seven_tools_front/src/data/tools.salesCopilot.test.ts`
  - Lock tool registration.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotShell.test.tsx`
  - Lock shell navigation.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotWorkspace.test.tsx`
  - Lock the live workspace behavior.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviews.test.tsx`
  - Lock the review list.
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.test.tsx`
  - Lock the review detail rendering.

### Verification

- Reuse: `seven_tools_api/tests/...`
- Reuse: `seven_tools_front/package.json`
- Reuse: `seven_tools_front/vite.config.*` and Vitest setup already present in the repo

### Future work that must stay out of this plan

- Chrome Meet extension
- live caption bridge protocol
- audio capture
- STT hot path
- manager and team analytics

### Task 1: Promote the canonical Caloni runtime into the main API repo

**Files:**
- Create: `seven_tools_api/app/modules/sales_copilot/__init__.py`
- Create: `seven_tools_api/app/modules/sales_copilot/knowledge_runtime.py`
- Modify: `seven_tools_api/app/modules/ai/knowledge.py`
- Modify: `seven_tools_api/knowledge/caloni/00_identidade_e_principios.md`
- Modify: `seven_tools_api/knowledge/caloni/01_voz_linguagem_e_conducao.md`
- Modify: `seven_tools_api/knowledge/caloni/10_modelo_comercial_caloni.md`
- Modify: `seven_tools_api/knowledge/caloni/11_fluxo_decisao_comercial.md`
- Modify: `seven_tools_api/knowledge/caloni/12_estagios_da_reuniao.md`
- Modify: `seven_tools_api/knowledge/caloni/13_sinais_riscos_e_lacunas.md`
- Modify: `seven_tools_api/knowledge/caloni/20_playbook_reuniao_de_vendas.md`
- Modify: `seven_tools_api/knowledge/caloni/21_playbook_objecoes.md`
- Modify: `seven_tools_api/knowledge/caloni/30_biblioteca_objecoes.md`
- Modify: `seven_tools_api/knowledge/caloni/31_biblioteca_perguntas.md`
- Modify: `seven_tools_api/knowledge/caloni/32_biblioteca_intervencoes.md`
- Modify: `seven_tools_api/knowledge/caloni/33_biblioteca_antipadroes.md`
- Modify: `seven_tools_api/knowledge/caloni/41_snippets_e_formulacoes.md`
- Modify: `seven_tools_api/knowledge/caloni/99_indice_de_uso.md`
- Test: `seven_tools_api/tests/test_sales_copilot_runtime.py`

- [ ] **Step 1: Write the failing runtime tests**

Create `seven_tools_api/tests/test_sales_copilot_runtime.py` with this content:

```python
from app.modules.sales_copilot.knowledge_runtime import (
    build_caloni_runtime_manifest,
    list_canonical_caloni_files,
)


def test_list_canonical_caloni_files_uses_only_the_structured_sales_copilot_corpus():
    names = [path.name for path in list_canonical_caloni_files()]

    assert names == [
        "00_identidade_e_principios.md",
        "01_voz_linguagem_e_conducao.md",
        "10_modelo_comercial_caloni.md",
        "11_fluxo_decisao_comercial.md",
        "12_estagios_da_reuniao.md",
        "13_sinais_riscos_e_lacunas.md",
        "20_playbook_reuniao_de_vendas.md",
        "21_playbook_objecoes.md",
        "30_biblioteca_objecoes.md",
        "31_biblioteca_perguntas.md",
        "32_biblioteca_intervencoes.md",
        "33_biblioteca_antipadroes.md",
        "41_snippets_e_formulacoes.md",
        "99_indice_de_uso.md",
    ]


def test_build_caloni_runtime_manifest_exposes_decision_first_sections():
    manifest = build_caloni_runtime_manifest()

    assert "identidade" in manifest["identity"].lower()
    assert "voz" in manifest["voice"].lower()
    assert "fluxo" in manifest["decision_flow"].lower()
    assert "estag" in manifest["stage_taxonomy"].lower()
    assert "sinais" in manifest["signal_taxonomy"].lower()
    assert "playbook" in manifest["meeting_playbook"].lower()
    assert "objec" in manifest["objection_playbook"].lower()
    assert "intervenc" in manifest["intervention_library"].lower()
    assert "snippet" in manifest["utterance_library"].lower()
```

- [ ] **Step 2: Run the new runtime tests and confirm they fail**

Run:

```powershell
Push-Location .\seven_tools_api
python -m pytest .\tests\test_sales_copilot_runtime.py -q
Pop-Location
```

Expected: FAIL with `ModuleNotFoundError` for `app.modules.sales_copilot` or `ImportError` for missing runtime functions.

- [ ] **Step 3: Copy the approved structured Caloni corpus into the canonical knowledge folder**

Run:

```powershell
$approvedCorpus = 'C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\.worktrees\caloni-knowledge-base\knowledge\caloni'
$targetCorpus = '.\seven_tools_api\knowledge\caloni'
$files = @(
  '00_identidade_e_principios.md',
  '01_voz_linguagem_e_conducao.md',
  '10_modelo_comercial_caloni.md',
  '11_fluxo_decisao_comercial.md',
  '12_estagios_da_reuniao.md',
  '13_sinais_riscos_e_lacunas.md',
  '20_playbook_reuniao_de_vendas.md',
  '21_playbook_objecoes.md',
  '30_biblioteca_objecoes.md',
  '31_biblioteca_perguntas.md',
  '32_biblioteca_intervencoes.md',
  '33_biblioteca_antipadroes.md',
  '41_snippets_e_formulacoes.md',
  '99_indice_de_uso.md'
)
$files | ForEach-Object {
  Copy-Item -LiteralPath (Join-Path $approvedCorpus $_) -Destination (Join-Path $targetCorpus $_) -Force
}
```

Expected: the main repo knowledge folder now contains the structured corpus files used in the approved design.

- [ ] **Step 4: Add the runtime loader and switch the legacy AI knowledge loader to canonical order**

Create `seven_tools_api/app/modules/sales_copilot/__init__.py` with this content:

```python
__all__ = []
```

Create `seven_tools_api/app/modules/sales_copilot/knowledge_runtime.py` with this content:

```python
from __future__ import annotations

from functools import lru_cache
from pathlib import Path


KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "knowledge" / "caloni"
CANONICAL_FILENAMES = (
    "00_identidade_e_principios.md",
    "01_voz_linguagem_e_conducao.md",
    "10_modelo_comercial_caloni.md",
    "11_fluxo_decisao_comercial.md",
    "12_estagios_da_reuniao.md",
    "13_sinais_riscos_e_lacunas.md",
    "20_playbook_reuniao_de_vendas.md",
    "21_playbook_objecoes.md",
    "30_biblioteca_objecoes.md",
    "31_biblioteca_perguntas.md",
    "32_biblioteca_intervencoes.md",
    "33_biblioteca_antipadroes.md",
    "41_snippets_e_formulacoes.md",
    "99_indice_de_uso.md",
)


def list_canonical_caloni_files() -> list[Path]:
    files = [KNOWLEDGE_DIR / name for name in CANONICAL_FILENAMES]
    missing = [path.name for path in files if not path.exists()]
    if missing:
        raise FileNotFoundError(
            f"Missing canonical Caloni knowledge files: {', '.join(missing)}"
        )
    return files


@lru_cache(maxsize=1)
def build_caloni_runtime_manifest() -> dict[str, str]:
    parts = {
        path.stem: path.read_text(encoding="utf-8")
        for path in list_canonical_caloni_files()
    }
    return {
        "identity": parts["00_identidade_e_principios"],
        "voice": parts["01_voz_linguagem_e_conducao"],
        "commercial_model": parts["10_modelo_comercial_caloni"],
        "decision_flow": parts["11_fluxo_decisao_comercial"],
        "stage_taxonomy": parts["12_estagios_da_reuniao"],
        "signal_taxonomy": parts["13_sinais_riscos_e_lacunas"],
        "meeting_playbook": parts["20_playbook_reuniao_de_vendas"],
        "objection_playbook": parts["21_playbook_objecoes"],
        "objection_library": parts["30_biblioteca_objecoes"],
        "question_library": parts["31_biblioteca_perguntas"],
        "intervention_library": parts["32_biblioteca_intervencoes"],
        "anti_pattern_library": parts["33_biblioteca_antipadroes"],
        "utterance_library": parts["41_snippets_e_formulacoes"],
        "usage_index": parts["99_indice_de_uso"],
    }
```

Replace the body of `seven_tools_api/app/modules/ai/knowledge.py` with this content:

```python
from functools import lru_cache

from app.modules.sales_copilot.knowledge_runtime import list_canonical_caloni_files


@lru_cache(maxsize=1)
def load_caloni_knowledge() -> str:
    parts = [path.read_text(encoding="utf-8") for path in list_canonical_caloni_files()]
    return "\n\n---\n\n".join(parts)
```

- [ ] **Step 5: Run the runtime tests again and confirm they pass**

Run:

```powershell
Push-Location .\seven_tools_api
python -m pytest .\tests\test_sales_copilot_runtime.py -q
Pop-Location
```

Expected: PASS with 2 passing tests.

- [ ] **Step 6: Commit the canonical runtime promotion**

Run:

```powershell
git -C ".\seven_tools_api" add knowledge/caloni app/modules/ai/knowledge.py app/modules/sales_copilot/__init__.py app/modules/sales_copilot/knowledge_runtime.py tests/test_sales_copilot_runtime.py
git -C ".\seven_tools_api" commit -m "feat: add canonical sales copilot runtime"
```

Expected: one commit that promotes the structured Caloni corpus and the runtime loader.

### Task 2: Add Sales Copilot sessions, transcript persistence, and the first API contract

**Files:**
- Create: `seven_tools_api/app/models/sales_copilot.py`
- Modify: `seven_tools_api/app/models/__init__.py`
- Create: `seven_tools_api/app/schemas/sales_copilot.py`
- Create: `seven_tools_api/app/modules/sales_copilot/service.py`
- Create: `seven_tools_api/app/modules/sales_copilot/router.py`
- Modify: `seven_tools_api/app/main.py`
- Create: `seven_tools_api/alembic/versions/9c4b5d2f8e11_add_sales_copilot_tables.py`
- Test: `seven_tools_api/tests/test_sales_copilot_api.py`

- [ ] **Step 1: Write the failing API lifecycle tests**

Create `seven_tools_api/tests/test_sales_copilot_api.py` with this content:

```python
from datetime import datetime, timezone


def test_sales_copilot_session_lifecycle(client, auth_headers):
    create_response = client.post(
        "/api/v1/sales-copilot/sessions",
        headers=auth_headers,
        json={"title": "Call de replay", "source": "manual_replay"},
    )

    assert create_response.status_code == 201
    session_id = create_response.json()["id"]
    assert create_response.json()["status"] == "active"
    assert create_response.json()["transcript_count"] == 0

    append_response = client.post(
        f"/api/v1/sales-copilot/sessions/{session_id}/chunks",
        headers=auth_headers,
        json={
            "items": [
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "speaker_label": "lead",
                    "text": "Gostei da proposta, mas preciso pensar com calma",
                },
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "speaker_label": "seller",
                    "text": "Claro, o que ainda nao ficou seguro para voce?",
                },
            ]
        },
    )

    assert append_response.status_code == 200
    assert append_response.json()["ingested_chunks"] == 2
    assert append_response.json()["session"]["transcript_count"] == 2
    assert append_response.json()["review"]["stage_journey"] == []

    complete_response = client.post(
        f"/api/v1/sales-copilot/sessions/{session_id}/complete",
        headers=auth_headers,
    )

    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "completed"

    review_response = client.get(
        f"/api/v1/sales-copilot/sessions/{session_id}/review",
        headers=auth_headers,
    )

    assert review_response.status_code == 200
    assert len(review_response.json()["transcript"]) == 2
    assert review_response.json()["session"]["status"] == "completed"


def test_sales_copilot_list_sessions_filters_by_status(client, auth_headers):
    first = client.post(
        "/api/v1/sales-copilot/sessions",
        headers=auth_headers,
        json={"title": "Ativa", "source": "manual_replay"},
    )
    second = client.post(
        "/api/v1/sales-copilot/sessions",
        headers=auth_headers,
        json={"title": "Concluida", "source": "manual_replay"},
    )

    client.post(
        f"/api/v1/sales-copilot/sessions/{second.json()['id']}/complete",
        headers=auth_headers,
    )

    active_response = client.get(
        "/api/v1/sales-copilot/sessions?status=active",
        headers=auth_headers,
    )
    completed_response = client.get(
        "/api/v1/sales-copilot/sessions?status=completed",
        headers=auth_headers,
    )

    assert active_response.status_code == 200
    assert [item["id"] for item in active_response.json()] == [first.json()["id"]]
    assert completed_response.status_code == 200
    assert [item["id"] for item in completed_response.json()] == [second.json()["id"]]
```

- [ ] **Step 2: Run the API lifecycle tests and confirm they fail**

Run:

```powershell
Push-Location .\seven_tools_api
python -m pytest .\tests\test_sales_copilot_api.py -q
Pop-Location
```

Expected: FAIL with `404 Not Found` for `/api/v1/sales-copilot/...`.

- [ ] **Step 3: Add the Sales Copilot models and migration**

Create `seven_tools_api/app/models/sales_copilot.py` with this content:

```python
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SalesCopilotSessionStatus(str, enum.Enum):
    active = "active"
    completed = "completed"


class SalesCopilotSource(str, enum.Enum):
    manual_replay = "manual_replay"
    google_meet_caption = "google_meet_caption"


class SalesCopilotSession(Base):
    __tablename__ = "sales_copilot_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(255))
    source: Mapped[SalesCopilotSource] = mapped_column(
        Enum(SalesCopilotSource),
        nullable=False,
        default=SalesCopilotSource.manual_replay,
    )
    status: Mapped[SalesCopilotSessionStatus] = mapped_column(
        Enum(SalesCopilotSessionStatus),
        nullable=False,
        default=SalesCopilotSessionStatus.active,
    )
    live_state: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False, default=dict)
    latest_intervention: Mapped[dict[str, object] | None] = mapped_column(JSONB)
    post_call_review: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False, default=dict)
    transcript_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    company: Mapped["Company"] = relationship()
    user: Mapped["User"] = relationship()
    transcript_chunks: Mapped[list["SalesCopilotTranscriptChunk"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )


class SalesCopilotTranscriptChunk(Base):
    __tablename__ = "sales_copilot_transcript_chunks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales_copilot_sessions.id"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[SalesCopilotSource] = mapped_column(
        Enum(SalesCopilotSource),
        nullable=False,
        default=SalesCopilotSource.manual_replay,
    )
    speaker_label: Mapped[str | None] = mapped_column(String(255))
    text: Mapped[str] = mapped_column(Text, nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    session: Mapped[SalesCopilotSession] = relationship(back_populates="transcript_chunks")
```

Update `seven_tools_api/app/models/__init__.py` by adding these imports and export names:

```python
from app.models.sales_copilot import (
    SalesCopilotSession,
    SalesCopilotSessionStatus,
    SalesCopilotSource,
    SalesCopilotTranscriptChunk,
)
```

and include these names in `__all__`:

```python
    "SalesCopilotSession",
    "SalesCopilotSessionStatus",
    "SalesCopilotSource",
    "SalesCopilotTranscriptChunk",
```

Create `seven_tools_api/alembic/versions/9c4b5d2f8e11_add_sales_copilot_tables.py` with this content:

```python
"""add sales copilot tables

Revision ID: 9c4b5d2f8e11
Revises: 5f1c9d7a2a10
Create Date: 2026-04-10 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "9c4b5d2f8e11"
down_revision: Union[str, None] = "5f1c9d7a2a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    session_status = sa.Enum("active", "completed", name="salescopilotsessionstatus")
    source_type = sa.Enum("manual_replay", "google_meet_caption", name="salescopilotsource")

    op.create_table(
        "sales_copilot_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("company_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("source", source_type, nullable=False),
        sa.Column("status", session_status, nullable=False),
        sa.Column("live_state", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("latest_intervention", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("post_call_review", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("transcript_count", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sales_copilot_sessions_company_id"), "sales_copilot_sessions", ["company_id"], unique=False)
    op.create_index(op.f("ix_sales_copilot_sessions_user_id"), "sales_copilot_sessions", ["user_id"], unique=False)

    op.create_table(
        "sales_copilot_transcript_chunks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("source", source_type, nullable=False),
        sa.Column("speaker_label", sa.String(length=255), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("captured_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["sales_copilot_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_sales_copilot_transcript_chunks_session_id"),
        "sales_copilot_transcript_chunks",
        ["session_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_sales_copilot_transcript_chunks_session_id"), table_name="sales_copilot_transcript_chunks")
    op.drop_table("sales_copilot_transcript_chunks")
    op.drop_index(op.f("ix_sales_copilot_sessions_user_id"), table_name="sales_copilot_sessions")
    op.drop_index(op.f("ix_sales_copilot_sessions_company_id"), table_name="sales_copilot_sessions")
    op.drop_table("sales_copilot_sessions")
    bind = op.get_bind()
    sa.Enum("active", "completed", name="salescopilotsessionstatus").drop(bind, checkfirst=True)
    sa.Enum("manual_replay", "google_meet_caption", name="salescopilotsource").drop(bind, checkfirst=True)
```

- [ ] **Step 4: Add schemas, service, router, and wire the router into the app**

Create `seven_tools_api/app/schemas/sales_copilot.py` with this content:

```python
import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.sales_copilot import SalesCopilotSessionStatus, SalesCopilotSource


class SalesCopilotSessionCreate(BaseModel):
    title: str | None = None
    source: SalesCopilotSource = SalesCopilotSource.manual_replay


class SalesCopilotChunkInput(BaseModel):
    timestamp: datetime
    text: str
    speaker_label: str | None = None
    source: SalesCopilotSource | None = None


class SalesCopilotChunkBatch(BaseModel):
    items: list[SalesCopilotChunkInput]


class SalesCopilotLiveStateResponse(BaseModel):
    stage: str = "nao_definido"
    dominant_risk: str = "diagnostico_incompleto"
    next_goal: str = "aprofundar_diagnostico"
    seller_gaps: list[str] = []
    signals: list[str] = []
    confidence: float = 0.0


class SalesCopilotInterventionResponse(BaseModel):
    headline: str
    why_now: str
    next_move: str
    suggested_utterance: str | None = None


class SalesCopilotReviewResponse(BaseModel):
    executive_summary: str = ""
    stage_journey: list[str] = []
    objections: list[str] = []
    buy_signals: list[str] = []
    seller_gaps: list[str] = []
    next_step: str = ""


class SalesCopilotTranscriptChunkResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    chunk_index: int
    source: SalesCopilotSource
    speaker_label: str | None
    text: str
    captured_at: datetime

    model_config = {"from_attributes": True}


class SalesCopilotSessionResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    user_id: uuid.UUID
    title: str | None
    source: SalesCopilotSource
    status: SalesCopilotSessionStatus
    transcript_count: int
    started_at: datetime
    ended_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SalesCopilotLiveResponse(BaseModel):
    session: SalesCopilotSessionResponse
    live_state: SalesCopilotLiveStateResponse
    latest_intervention: SalesCopilotInterventionResponse | None = None
    review: SalesCopilotReviewResponse
    ingested_chunks: int


class SalesCopilotReviewDetailResponse(BaseModel):
    session: SalesCopilotSessionResponse
    review: SalesCopilotReviewResponse
    transcript: list[SalesCopilotTranscriptChunkResponse]
```

Create `seven_tools_api/app/modules/sales_copilot/service.py` with this content:

```python
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session as DbSession

from app.models.sales_copilot import (
    SalesCopilotSession,
    SalesCopilotSessionStatus,
    SalesCopilotSource,
    SalesCopilotTranscriptChunk,
)
from app.models.user import User


def default_live_state() -> dict[str, object]:
    return {
        "stage": "nao_definido",
        "dominant_risk": "diagnostico_incompleto",
        "next_goal": "aprofundar_diagnostico",
        "seller_gaps": [],
        "signals": [],
        "confidence": 0.0,
    }


def default_review() -> dict[str, object]:
    return {
        "executive_summary": "",
        "stage_journey": [],
        "objections": [],
        "buy_signals": [],
        "seller_gaps": [],
        "next_step": "",
    }


def require_company(user: User) -> uuid.UUID:
    if user.company_id is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User company not set")
    return user.company_id


def create_session(db: DbSession, user: User, payload: dict) -> SalesCopilotSession:
    company_id = require_company(user)
    session = SalesCopilotSession(
        id=uuid.uuid4(),
        company_id=company_id,
        user_id=user.id,
        title=payload.get("title"),
        source=payload.get("source", SalesCopilotSource.manual_replay),
        live_state=default_live_state(),
        post_call_review=default_review(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_sessions(
    db: DbSession,
    user: User,
    status_filter: SalesCopilotSessionStatus | None = None,
) -> list[SalesCopilotSession]:
    company_id = require_company(user)
    query = (
        db.query(SalesCopilotSession)
        .filter(
            SalesCopilotSession.company_id == company_id,
            SalesCopilotSession.user_id == user.id,
        )
        .order_by(SalesCopilotSession.updated_at.desc())
    )
    if status_filter is not None:
        query = query.filter(SalesCopilotSession.status == status_filter)
    return query.all()


def get_session(db: DbSession, user: User, session_id: uuid.UUID) -> SalesCopilotSession:
    company_id = require_company(user)
    session = (
        db.query(SalesCopilotSession)
        .filter(
            SalesCopilotSession.id == session_id,
            SalesCopilotSession.company_id == company_id,
            SalesCopilotSession.user_id == user.id,
        )
        .first()
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sales copilot session not found")
    return session


def append_chunks(db: DbSession, session: SalesCopilotSession, items: list[dict]) -> tuple[SalesCopilotSession, list[SalesCopilotTranscriptChunk]]:
    start_index = session.transcript_count
    created_chunks: list[SalesCopilotTranscriptChunk] = []
    for offset, item in enumerate(items):
        chunk = SalesCopilotTranscriptChunk(
            id=uuid.uuid4(),
            session_id=session.id,
            chunk_index=start_index + offset,
            source=item.get("source") or session.source,
            speaker_label=item.get("speaker_label"),
            text=item["text"],
            captured_at=item["timestamp"],
        )
        db.add(chunk)
        created_chunks.append(chunk)

    session.transcript_count = start_index + len(items)
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session, created_chunks


def complete_session(db: DbSession, session: SalesCopilotSession) -> SalesCopilotSession:
    session.status = SalesCopilotSessionStatus.completed
    session.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


def list_transcript_chunks(db: DbSession, session_id: uuid.UUID) -> list[SalesCopilotTranscriptChunk]:
    return (
        db.query(SalesCopilotTranscriptChunk)
        .filter(SalesCopilotTranscriptChunk.session_id == session_id)
        .order_by(SalesCopilotTranscriptChunk.chunk_index.asc())
        .all()
    )
```

Create `seven_tools_api/app/modules/sales_copilot/router.py` with this content:

```python
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session as DbSession

from app.dependencies import get_current_user, get_db
from app.models.sales_copilot import SalesCopilotSessionStatus
from app.models.user import User
from app.modules.sales_copilot.service import (
    append_chunks,
    complete_session,
    create_session,
    default_review,
    get_session,
    list_sessions,
    list_transcript_chunks,
)
from app.schemas.sales_copilot import (
    SalesCopilotChunkBatch,
    SalesCopilotLiveResponse,
    SalesCopilotReviewDetailResponse,
    SalesCopilotSessionCreate,
    SalesCopilotSessionResponse,
)

router = APIRouter(prefix="/sales-copilot", tags=["sales-copilot"])


@router.post("/sessions", response_model=SalesCopilotSessionResponse, status_code=status.HTTP_201_CREATED)
def post_session(
    body: SalesCopilotSessionCreate,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return create_session(db, user, body.model_dump())


@router.get("/sessions", response_model=list[SalesCopilotSessionResponse])
def get_sessions(
    status_filter: SalesCopilotSessionStatus | None = Query(None, alias="status"),
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return list_sessions(db, user, status_filter)


@router.post("/sessions/{session_id}/chunks", response_model=SalesCopilotLiveResponse)
def post_chunks(
    session_id: uuid.UUID,
    body: SalesCopilotChunkBatch,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    session = get_session(db, user, session_id)
    session, _ = append_chunks(db, session, [item.model_dump() for item in body.items])
    return SalesCopilotLiveResponse(
        session=session,
        live_state=session.live_state,
        latest_intervention=session.latest_intervention,
        review=session.post_call_review or default_review(),
        ingested_chunks=len(body.items),
    )


@router.post("/sessions/{session_id}/complete", response_model=SalesCopilotSessionResponse)
def post_complete(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    session = get_session(db, user, session_id)
    return complete_session(db, session)


@router.get("/sessions/{session_id}/review", response_model=SalesCopilotReviewDetailResponse)
def get_review(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    session = get_session(db, user, session_id)
    return SalesCopilotReviewDetailResponse(
        session=session,
        review=session.post_call_review or default_review(),
        transcript=list_transcript_chunks(db, session.id),
    )
```

Update `seven_tools_api/app/main.py` imports and router registration with this addition:

```python
from app.modules.sales_copilot.router import router as sales_copilot_router
```

and register it:

```python
    app.include_router(sales_copilot_router, prefix="/api/v1")
```

- [ ] **Step 5: Run the new API tests and confirm they pass**

Run:

```powershell
Push-Location .\seven_tools_api
alembic upgrade head
python -m pytest .\tests\test_sales_copilot_api.py -q
Pop-Location
```

Expected: PASS with 2 passing tests.

- [ ] **Step 6: Commit the Sales Copilot session API**

Run:

```powershell
git -C ".\seven_tools_api" add app/models/sales_copilot.py app/models/__init__.py app/schemas/sales_copilot.py app/modules/sales_copilot/service.py app/modules/sales_copilot/router.py app/main.py alembic/versions/9c4b5d2f8e11_add_sales_copilot_tables.py tests/test_sales_copilot_api.py
git -C ".\seven_tools_api" commit -m "feat: add sales copilot session api"
```

Expected: one commit containing the new tables, models, schemas, router, and lifecycle tests.

### Task 3: Split Groq and GPT-4o configuration and persist live and post-call analysis

**Files:**
- Modify: `seven_tools_api/app/config.py`
- Modify: `seven_tools_api/.env.example`
- Create: `seven_tools_api/app/modules/sales_copilot/providers.py`
- Create: `seven_tools_api/app/modules/sales_copilot/analysis.py`
- Modify: `seven_tools_api/app/modules/sales_copilot/service.py`
- Test: `seven_tools_api/tests/test_sales_copilot_analysis.py`

- [ ] **Step 1: Write the failing analysis tests**

Create `seven_tools_api/tests/test_sales_copilot_analysis.py` with this content:

```python
from datetime import datetime, timezone

from app.modules.sales_copilot import providers


def test_chunk_ingestion_updates_live_state_and_intervention(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        providers,
        "call_live_classification",
        lambda *_args, **_kwargs: {
            "stage": "objecoes",
            "dominant_risk": "valor_fraco",
            "next_goal": "isolar_inseguranca",
            "seller_gaps": ["defesa_reativa_preco"],
            "signals": ["inseguranca"],
            "confidence": 0.88,
            "headline": "A objecao parece inseguranca, nao rejeicao",
            "why_now": "Preco entrou antes do valor ficar consolidado",
            "next_move": "Nomeie a duvida real antes de explicar mais",
            "suggested_utterance": "O que exatamente ainda nao ficou seguro para voce?",
        },
    )

    session = client.post(
        "/api/v1/sales-copilot/sessions",
        headers=auth_headers,
        json={"title": "Live path", "source": "manual_replay"},
    ).json()

    response = client.post(
        f"/api/v1/sales-copilot/sessions/{session['id']}/chunks",
        headers=auth_headers,
        json={
            "items": [
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "speaker_label": "lead",
                    "text": "Gostei, mas preciso pensar com calma",
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json()["live_state"]["stage"] == "objecoes"
    assert response.json()["live_state"]["next_goal"] == "isolar_inseguranca"
    assert response.json()["latest_intervention"]["next_move"] == "Nomeie a duvida real antes de explicar mais"


def test_complete_session_persists_post_call_review(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        providers,
        "call_live_classification",
        lambda *_args, **_kwargs: {
            "stage": "diagnostico",
            "dominant_risk": "prioridade_difusa",
            "next_goal": "priorizar",
            "seller_gaps": ["diagnostico_raso"],
            "signals": [],
            "confidence": 0.67,
            "headline": "Falta afunilar a prioridade",
            "why_now": "O lead falou de varios problemas, mas nenhum foi eleito como principal",
            "next_move": "Peca que eleja a prioridade numero um",
            "suggested_utterance": "Entre esses pontos, qual e o que mais pesa hoje?",
        },
    )
    monkeypatch.setattr(
        providers,
        "call_post_call_review",
        lambda *_args, **_kwargs: {
            "executive_summary": "Boa conexao inicial, mas a call terminou sem compromisso claro.",
            "stage_journey": ["abertura", "diagnostico", "objecoes"],
            "objections": ["preciso pensar"],
            "buy_signals": ["gostei da proposta"],
            "seller_gaps": ["compromisso_nao_testado"],
            "next_step": "Retomar a call nomeando a inseguranca real e fechando um combinado objetivo.",
        },
    )

    session = client.post(
        "/api/v1/sales-copilot/sessions",
        headers=auth_headers,
        json={"title": "Post-call", "source": "manual_replay"},
    ).json()

    client.post(
        f"/api/v1/sales-copilot/sessions/{session['id']}/chunks",
        headers=auth_headers,
        json={
            "items": [
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "speaker_label": "lead",
                    "text": "Gostei da proposta, mas preciso pensar com calma",
                }
            ]
        },
    )

    complete_response = client.post(
        f"/api/v1/sales-copilot/sessions/{session['id']}/complete",
        headers=auth_headers,
    )
    review_response = client.get(
        f"/api/v1/sales-copilot/sessions/{session['id']}/review",
        headers=auth_headers,
    )

    assert complete_response.status_code == 200
    assert review_response.status_code == 200
    assert review_response.json()["review"]["executive_summary"].startswith("Boa conexao inicial")
    assert review_response.json()["review"]["next_step"].startswith("Retomar a call")
```

- [ ] **Step 2: Run the analysis tests and confirm they fail**

Run:

```powershell
Push-Location .\seven_tools_api
python -m pytest .\tests\test_sales_copilot_analysis.py -q
Pop-Location
```

Expected: FAIL because `app.modules.sales_copilot.providers` does not exist and the session service does not yet update live state or review artifacts.

- [ ] **Step 3: Add dedicated provider settings without breaking existing AI features**

In `seven_tools_api/app/config.py`, keep the existing generic `ai_*` settings and add this exact block below them:

```python
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_live_model: str = "llama-3.3-70b-versatile"
    groq_live_temperature: float = 0.1
    groq_live_max_tokens: int = 1200
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_strategic_model: str = "gpt-4o"
    openai_strategic_temperature: float = 0.2
    openai_strategic_max_tokens: int = 1800
    sales_copilot_live_provider: str = "groq"
    sales_copilot_postcall_provider: str = "openai"
```

Add this block to `seven_tools_api/.env.example` after the existing generic AI settings:

```env
GROQ_API_KEY=
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_LIVE_MODEL=llama-3.3-70b-versatile
GROQ_LIVE_TEMPERATURE=0.1
GROQ_LIVE_MAX_TOKENS=1200

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_STRATEGIC_MODEL=gpt-4o
OPENAI_STRATEGIC_TEMPERATURE=0.2
OPENAI_STRATEGIC_MAX_TOKENS=1800

SALES_COPILOT_LIVE_PROVIDER=groq
SALES_COPILOT_POSTCALL_PROVIDER=openai
```

- [ ] **Step 4: Add provider and analysis modules that keep decision before utterance**

Create `seven_tools_api/app/modules/sales_copilot/providers.py` with this content:

```python
from __future__ import annotations

import json

import httpx

from app.config import settings


def _call_json_model(
    *,
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    max_tokens: int,
) -> dict[str, object]:
    response = httpx.post(
        f"{base_url.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=60.0,
    )
    response.raise_for_status()
    return json.loads(response.json()["choices"][0]["message"]["content"])


def call_live_classification(system_prompt: str, user_prompt: str) -> dict[str, object]:
    return _call_json_model(
        base_url=settings.groq_base_url,
        api_key=settings.groq_api_key,
        model=settings.groq_live_model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=settings.groq_live_temperature,
        max_tokens=settings.groq_live_max_tokens,
    )


def call_post_call_review(system_prompt: str, user_prompt: str) -> dict[str, object]:
    return _call_json_model(
        base_url=settings.openai_base_url,
        api_key=settings.openai_api_key,
        model=settings.openai_strategic_model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=settings.openai_strategic_temperature,
        max_tokens=settings.openai_strategic_max_tokens,
    )
```

Create `seven_tools_api/app/modules/sales_copilot/analysis.py` with this content:

```python
from __future__ import annotations

from app.modules.sales_copilot.knowledge_runtime import build_caloni_runtime_manifest
from app.modules.sales_copilot.providers import call_live_classification, call_post_call_review


def _recent_transcript_text(chunks: list[object]) -> str:
    lines: list[str] = []
    for chunk in chunks[-4:]:
        speaker = chunk.speaker_label or "unknown"
        lines.append(f"{speaker}: {chunk.text}")
    return "\n".join(lines)


def _all_transcript_text(chunks: list[object]) -> str:
    return "\n".join(
        f"{chunk.speaker_label or 'unknown'}: {chunk.text}"
        for chunk in chunks
    )


def analyze_live_window(chunks: list[object]) -> tuple[dict[str, object], dict[str, object] | None]:
    if not chunks:
        return (
            {
                "stage": "nao_definido",
                "dominant_risk": "diagnostico_incompleto",
                "next_goal": "aprofundar_diagnostico",
                "seller_gaps": [],
                "signals": [],
                "confidence": 0.0,
            },
            None,
        )

    manifest = build_caloni_runtime_manifest()
    system_prompt = (
        f"{manifest['identity']}\n\n"
        f"{manifest['voice']}\n\n"
        f"{manifest['decision_flow']}\n\n"
        f"{manifest['stage_taxonomy']}\n\n"
        f"{manifest['signal_taxonomy']}\n\n"
        "Voce e um Sales Copilot Caloni. Leia a janela recente da call. "
        "Responda um JSON com: stage, dominant_risk, next_goal, seller_gaps, signals, confidence, "
        "headline, why_now, next_move, suggested_utterance. "
        "Decida antes de formular. Sugira fala curta apenas se houver clareza suficiente."
    )
    result = call_live_classification(system_prompt, _recent_transcript_text(chunks))
    live_state = {
        "stage": result["stage"],
        "dominant_risk": result["dominant_risk"],
        "next_goal": result["next_goal"],
        "seller_gaps": result["seller_gaps"],
        "signals": result["signals"],
        "confidence": result["confidence"],
    }
    intervention = {
        "headline": result["headline"],
        "why_now": result["why_now"],
        "next_move": result["next_move"],
        "suggested_utterance": result.get("suggested_utterance"),
    }
    return live_state, intervention


def build_post_call_review(chunks: list[object]) -> dict[str, object]:
    manifest = build_caloni_runtime_manifest()
    system_prompt = (
        f"{manifest['identity']}\n\n"
        f"{manifest['voice']}\n\n"
        f"{manifest['decision_flow']}\n\n"
        f"{manifest['meeting_playbook']}\n\n"
        f"{manifest['objection_playbook']}\n\n"
        "Voce e um revisor Caloni. Gere um JSON com: executive_summary, stage_journey, objections, "
        "buy_signals, seller_gaps, next_step. Priorize leitura estrategica antes de formulacao."
    )
    return call_post_call_review(system_prompt, _all_transcript_text(chunks))
```

- [ ] **Step 5: Update session service to persist live analysis on chunk ingestion and review on completion**

In `seven_tools_api/app/modules/sales_copilot/service.py`, add these imports:

```python
from app.modules.sales_copilot.analysis import analyze_live_window, build_post_call_review
```

Then replace the `append_chunks` and `complete_session` functions with these versions:

```python
def append_chunks(db: DbSession, session: SalesCopilotSession, items: list[dict]) -> tuple[SalesCopilotSession, list[SalesCopilotTranscriptChunk]]:
    start_index = session.transcript_count
    created_chunks: list[SalesCopilotTranscriptChunk] = []
    for offset, item in enumerate(items):
        chunk = SalesCopilotTranscriptChunk(
            id=uuid.uuid4(),
            session_id=session.id,
            chunk_index=start_index + offset,
            source=item.get("source") or session.source,
            speaker_label=item.get("speaker_label"),
            text=item["text"],
            captured_at=item["timestamp"],
        )
        db.add(chunk)
        created_chunks.append(chunk)

    session.transcript_count = start_index + len(items)
    db.flush()

    transcript = list_transcript_chunks(db, session.id)
    live_state, intervention = analyze_live_window(transcript)
    session.live_state = live_state
    session.latest_intervention = intervention
    session.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session)
    return session, created_chunks


def complete_session(db: DbSession, session: SalesCopilotSession) -> SalesCopilotSession:
    transcript = list_transcript_chunks(db, session.id)
    session.post_call_review = build_post_call_review(transcript)
    session.status = SalesCopilotSessionStatus.completed
    session.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session
```

- [ ] **Step 6: Run the analysis tests and confirm they pass**

Run:

```powershell
Push-Location .\seven_tools_api
python -m pytest .\tests\test_sales_copilot_analysis.py -q
Pop-Location
```

Expected: PASS with 2 passing tests and no network calls because the provider functions are monkeypatched.

- [ ] **Step 7: Commit the provider split and analysis pipeline**

Run:

```powershell
git -C ".\seven_tools_api" add app/config.py .env.example app/modules/sales_copilot/providers.py app/modules/sales_copilot/analysis.py app/modules/sales_copilot/service.py tests/test_sales_copilot_analysis.py
git -C ".\seven_tools_api" commit -m "feat: add sales copilot analysis pipeline"
```

Expected: one commit that introduces Groq and GPT-4o routing plus live and post-call persistence.

### Task 4: Register the Sales Copilot tool and ship the live workspace and replay UI

**Files:**
- Modify: `seven_tools_front/src/features/comercial/toolRoutes.ts`
- Modify: `seven_tools_front/src/data/tools.ts`
- Modify: `seven_tools_front/src/App.tsx`
- Create: `seven_tools_front/src/services/salesCopilotService.ts`
- Create: `seven_tools_front/src/features/comercial/salesCopilotRoutes.test.ts`
- Create: `seven_tools_front/src/data/tools.salesCopilot.test.ts`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotShell.tsx`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotWorkspace.tsx`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReplay.tsx`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviews.tsx`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.tsx`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotShell.test.tsx`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotWorkspace.test.tsx`

- [ ] **Step 1: Write the failing route, registry, shell, and workspace tests**

Create `seven_tools_front/src/features/comercial/salesCopilotRoutes.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";
import {
  SALES_COPILOT_TOOL_SLUG,
  getSalesCopilotAppPath,
  getSalesCopilotOverviewPath,
  getSalesCopilotReplayPath,
  getSalesCopilotReviewPath,
  getSalesCopilotReviewsPath,
} from "./toolRoutes";

describe("sales copilot routes", () => {
  it("builds overview, live, replay, and review paths", () => {
    expect(SALES_COPILOT_TOOL_SLUG).toBe("sales-copilot-caloni");
    expect(getSalesCopilotOverviewPath()).toBe("/tools/sales-copilot-caloni");
    expect(getSalesCopilotAppPath()).toBe("/tools/sales-copilot-caloni/app");
    expect(getSalesCopilotReplayPath()).toBe("/tools/sales-copilot-caloni/app/replay");
    expect(getSalesCopilotReviewsPath()).toBe("/tools/sales-copilot-caloni/app/reviews");
    expect(getSalesCopilotReviewPath("session-9")).toBe("/tools/sales-copilot-caloni/app/reviews/session-9");
  });
});
```

Create `seven_tools_front/src/data/tools.salesCopilot.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";

import { getToolBySlug } from "./tools";

describe("sales copilot tool registration", () => {
  it("registers the Sales Copilot Caloni tool in the catalog", () => {
    const tool = getToolBySlug("sales-copilot-caloni");

    expect(tool).toBeDefined();
    expect(tool?.name).toBe("Sales Copilot Caloni");
    expect(tool?.category).toBe("comercial");
  });
});
```

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotShell.test.tsx` with this content:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  getSalesCopilotAppPath,
  getSalesCopilotReplayPath,
  getSalesCopilotReviewsPath,
} from "@/features/comercial/toolRoutes";

import SalesCopilotShell from "./SalesCopilotShell";

describe("SalesCopilotShell", () => {
  it("renders live, replay, and review navigation", () => {
    render(
      <MemoryRouter initialEntries={[getSalesCopilotReplayPath()]}>
        <Routes>
          <Route path="/tools/sales-copilot-caloni/app" element={<SalesCopilotShell />}>
            <Route path="replay" element={<div>Replay page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /ao vivo/i })).toHaveAttribute("href", getSalesCopilotAppPath());
    expect(screen.getByRole("link", { name: /replay/i })).toHaveAttribute("href", getSalesCopilotReplayPath());
    expect(screen.getByRole("link", { name: /revisoes/i })).toHaveAttribute("href", getSalesCopilotReviewsPath());
  });
});
```

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotWorkspace.test.tsx` with this content:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/salesCopilotService", () => ({
  salesCopilotService: {
    createSession: vi.fn().mockResolvedValue({
      id: "session-1",
      companyId: "company-1",
      userId: "user-1",
      title: "Replay manual",
      source: "manual_replay",
      status: "active",
      transcriptCount: 0,
      startedAt: "2026-04-10T10:00:00Z",
      endedAt: null,
      createdAt: "2026-04-10T10:00:00Z",
      updatedAt: "2026-04-10T10:00:00Z",
    }),
    appendChunks: vi.fn().mockResolvedValue({
      session: {
        id: "session-1",
        companyId: "company-1",
        userId: "user-1",
        title: "Replay manual",
        source: "manual_replay",
        status: "active",
        transcriptCount: 1,
        startedAt: "2026-04-10T10:00:00Z",
        endedAt: null,
        createdAt: "2026-04-10T10:00:00Z",
        updatedAt: "2026-04-10T10:01:00Z",
      },
      liveState: {
        stage: "objecoes",
        dominantRisk: "valor_fraco",
        nextGoal: "isolar_inseguranca",
        sellerGaps: ["defesa_reativa_preco"],
        signals: ["inseguranca"],
        confidence: 0.88,
      },
      latestIntervention: {
        headline: "A objecao parece inseguranca",
        whyNow: "Preco entrou antes do valor ficar claro",
        nextMove: "Nomeie a duvida real",
        suggestedUtterance: "O que ainda nao ficou seguro para voce?",
      },
      review: {
        executiveSummary: "",
        stageJourney: [],
        objections: [],
        buySignals: [],
        sellerGaps: [],
        nextStep: "",
      },
      ingestedChunks: 1,
    }),
    completeSession: vi.fn().mockResolvedValue({
      id: "session-1",
      companyId: "company-1",
      userId: "user-1",
      title: "Replay manual",
      source: "manual_replay",
      status: "completed",
      transcriptCount: 1,
      startedAt: "2026-04-10T10:00:00Z",
      endedAt: "2026-04-10T10:02:00Z",
      createdAt: "2026-04-10T10:00:00Z",
      updatedAt: "2026-04-10T10:02:00Z",
    }),
  },
}));

import SalesCopilotWorkspace from "./SalesCopilotWorkspace";

describe("SalesCopilotWorkspace", () => {
  it("creates a session, ingests a chunk, and renders the latest intervention", async () => {
    render(<SalesCopilotWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: /iniciar sessao/i }));
    fireEvent.change(screen.getByLabelText(/trecho da call/i), {
      target: { value: "Gostei da proposta, mas preciso pensar com calma" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar trecho/i }));

    await waitFor(() => {
      expect(screen.getByText(/a objecao parece inseguranca/i)).toBeInTheDocument();
      expect(screen.getByText(/nomeie a duvida real/i)).toBeInTheDocument();
      expect(screen.getByText(/o que ainda nao ficou seguro para voce/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the new frontend tests and confirm they fail**

Run:

```powershell
Push-Location .\seven_tools_front
npm test -- src/features/comercial/salesCopilotRoutes.test.ts src/data/tools.salesCopilot.test.ts src/pages/tools/SalesCopilot/SalesCopilotShell.test.tsx src/pages/tools/SalesCopilot/SalesCopilotWorkspace.test.tsx
Pop-Location
```

Expected: FAIL because the new route helpers, service, shell, and workspace do not exist yet.

- [ ] **Step 3: Add route helpers, tool registration, and the service client**

In `seven_tools_front/src/features/comercial/toolRoutes.ts`, add this block near the other slug constants:

```ts
export const SALES_COPILOT_TOOL_SLUG = "sales-copilot-caloni";
```

and add these helpers:

```ts
export function getSalesCopilotOverviewPath() {
  return `/tools/${SALES_COPILOT_TOOL_SLUG}`;
}

export function getSalesCopilotAppPath() {
  return `${getSalesCopilotOverviewPath()}/app`;
}

export function getSalesCopilotReplayPath() {
  return `${getSalesCopilotAppPath()}/replay`;
}

export function getSalesCopilotReviewsPath() {
  return `${getSalesCopilotAppPath()}/reviews`;
}

export function getSalesCopilotReviewPath(sessionId: string) {
  return `${getSalesCopilotReviewsPath()}/${sessionId}`;
}
```

In `seven_tools_front/src/data/tools.ts`, add `SALES_COPILOT_TOOL_SLUG` to the import list and append this tool entry:

```ts
  {
    id: "23",
    name: "Sales Copilot Caloni",
    slug: SALES_COPILOT_TOOL_SLUG,
    shortDescription: "Conduza calls comerciais com leitura estrategica ao vivo no metodo Caloni.",
    longDescription: "Acompanhe a call em um painel silencioso, receba leitura de estagio, risco, proximo movimento e revisao pos-call para evolucao individual do vendedor.",
    category: "comercial",
    status: "new",
    tags: ["sales copilot", "caloni", "call", "comercial", "replay"],
    icon: "Headphones",
    mainBenefit: "Ajuda o vendedor a decidir o proximo movimento mais util durante e depois da reuniao.",
    accessType: "Plataforma Web",
    howToUse: [
      "Inicie uma sessao e envie trechos da call em tempo real ou em replay",
      "Acompanhe estagio, risco, proximo movimento e fala curta quando houver clareza",
      "Revise a call concluida para entender lacunas, objecoes e proximo passo",
    ],
    recommendationLevel: 5,
    popularity: 66,
    isFavorite: false,
    launchDate: "2026-04-10",
  },
```

Create `seven_tools_front/src/services/salesCopilotService.ts` with this content:

```ts
import api from "@/lib/apiClient";

export type SalesCopilotSessionStatus = "active" | "completed";
export type SalesCopilotSource = "manual_replay" | "google_meet_caption";

export interface SalesCopilotSession {
  id: string;
  companyId: string;
  userId: string;
  title: string | null;
  source: SalesCopilotSource;
  status: SalesCopilotSessionStatus;
  transcriptCount: number;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesCopilotLiveState {
  stage: string;
  dominantRisk: string;
  nextGoal: string;
  sellerGaps: string[];
  signals: string[];
  confidence: number;
}

export interface SalesCopilotIntervention {
  headline: string;
  whyNow: string;
  nextMove: string;
  suggestedUtterance: string | null;
}

export interface SalesCopilotReview {
  executiveSummary: string;
  stageJourney: string[];
  objections: string[];
  buySignals: string[];
  sellerGaps: string[];
  nextStep: string;
}

export interface SalesCopilotTranscriptChunk {
  id: string;
  sessionId: string;
  chunkIndex: number;
  source: SalesCopilotSource;
  speakerLabel: string | null;
  text: string;
  capturedAt: string;
}

export interface SalesCopilotChunkInput {
  timestamp: string;
  text: string;
  speakerLabel?: string | null;
  source?: SalesCopilotSource;
}

export interface SalesCopilotLiveResponse {
  session: SalesCopilotSession;
  liveState: SalesCopilotLiveState;
  latestIntervention: SalesCopilotIntervention | null;
  review: SalesCopilotReview;
  ingestedChunks: number;
}

export interface SalesCopilotReviewDetail {
  session: SalesCopilotSession;
  review: SalesCopilotReview;
  transcript: SalesCopilotTranscriptChunk[];
}

export const salesCopilotService = {
  async createSession(payload: { title?: string | null; source?: SalesCopilotSource }): Promise<SalesCopilotSession> {
    const { data } = await api.post<SalesCopilotSession>("/sales-copilot/sessions", payload);
    return data;
  },

  async listSessions(status?: SalesCopilotSessionStatus): Promise<SalesCopilotSession[]> {
    const { data } = await api.get<SalesCopilotSession[]>("/sales-copilot/sessions", {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async appendChunks(sessionId: string, items: SalesCopilotChunkInput[]): Promise<SalesCopilotLiveResponse> {
    const { data } = await api.post<SalesCopilotLiveResponse>(`/sales-copilot/sessions/${sessionId}/chunks`, {
      items,
    });
    return data;
  },

  async completeSession(sessionId: string): Promise<SalesCopilotSession> {
    const { data } = await api.post<SalesCopilotSession>(`/sales-copilot/sessions/${sessionId}/complete`);
    return data;
  },

  async getReview(sessionId: string): Promise<SalesCopilotReviewDetail> {
    const { data } = await api.get<SalesCopilotReviewDetail>(`/sales-copilot/sessions/${sessionId}/review`);
    return data;
  },
};
```

- [ ] **Step 4: Add the Sales Copilot shell, live workspace, replay page, and app routes**

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotShell.tsx` with this content:

```tsx
import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft, Headphones } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getSalesCopilotAppPath,
  getSalesCopilotOverviewPath,
  getSalesCopilotReplayPath,
  getSalesCopilotReviewsPath,
} from "@/features/comercial/toolRoutes";

function navLinkClassName(isActive: boolean) {
  return [
    "rounded-full px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
  ].join(" ");
}

export default function SalesCopilotShell() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      <div className="border-b border-border/30 glass-strong sticky top-20 z-40">
        <div className="container flex min-h-14 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link to={getSalesCopilotOverviewPath()}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar ao overview</span>
              </Button>
            </Link>

            <div className="h-4 w-px bg-border/60" />

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Headphones className="h-4 w-4" />
              </div>
              <span className="font-display font-semibold text-sm">Sales Copilot Caloni</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to={getSalesCopilotAppPath()} end className={({ isActive }) => navLinkClassName(isActive)}>
              Ao vivo
            </NavLink>
            <NavLink to={getSalesCopilotReplayPath()} className={({ isActive }) => navLinkClassName(isActive)}>
              Replay
            </NavLink>
            <NavLink to={getSalesCopilotReviewsPath()} className={({ isActive }) => navLinkClassName(isActive)}>
              Revisoes
            </NavLink>
          </nav>
        </div>
      </div>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
```

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotWorkspace.tsx` with this content:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getSalesCopilotReviewPath } from "@/features/comercial/toolRoutes";
import {
  type SalesCopilotIntervention,
  type SalesCopilotLiveState,
  type SalesCopilotSession,
  salesCopilotService,
} from "@/services/salesCopilotService";

const EMPTY_STATE: SalesCopilotLiveState = {
  stage: "nao_definido",
  dominantRisk: "diagnostico_incompleto",
  nextGoal: "aprofundar_diagnostico",
  sellerGaps: [],
  signals: [],
  confidence: 0,
};

export default function SalesCopilotWorkspace() {
  const navigate = useNavigate();
  const [session, setSession] = useState<SalesCopilotSession | null>(null);
  const [liveState, setLiveState] = useState<SalesCopilotLiveState>(EMPTY_STATE);
  const [intervention, setIntervention] = useState<SalesCopilotIntervention | null>(null);
  const [chunkText, setChunkText] = useState("");
  const [speakerLabel, setSpeakerLabel] = useState("lead");
  const [busy, setBusy] = useState(false);

  async function handleStartSession() {
    setBusy(true);
    try {
      const created = await salesCopilotService.createSession({
        title: "Replay manual",
        source: "manual_replay",
      });
      setSession(created);
    } finally {
      setBusy(false);
    }
  }

  async function handleSendChunk() {
    if (!session || !chunkText.trim()) return;
    setBusy(true);
    try {
      const response = await salesCopilotService.appendChunks(session.id, [
        {
          timestamp: new Date().toISOString(),
          speakerLabel,
          text: chunkText.trim(),
        },
      ]);
      setSession(response.session);
      setLiveState(response.liveState);
      setIntervention(response.latestIntervention);
      setChunkText("");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!session) return;
    setBusy(true);
    try {
      await salesCopilotService.completeSession(session.id);
      navigate(getSalesCopilotReviewPath(session.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-8 space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border/40 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-semibold">Painel ao vivo</h1>
              <p className="text-sm text-muted-foreground">Leitura, decisao e intervencao em ordem.</p>
            </div>
            <Button onClick={handleStartSession} disabled={busy || !!session}>
              {session ? "Sessao ativa" : "Iniciar sessao"}
            </Button>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Trecho da call
            <textarea
              aria-label="Trecho da call"
              value={chunkText}
              onChange={(event) => setChunkText(event.target.value)}
              className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Cole ou digite o proximo trecho da call..."
            />
          </label>

          <label className="grid gap-2 text-sm font-medium max-w-xs">
            Falante
            <select
              value={speakerLabel}
              onChange={(event) => setSpeakerLabel(event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="lead">Lead</option>
              <option value="seller">Vendedor</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSendChunk} disabled={busy || !session || !chunkText.trim()}>
              Enviar trecho
            </Button>
            <Button variant="outline" onClick={handleComplete} disabled={busy || !session}>
              Encerrar e abrir revisao
            </Button>
          </div>
        </div>

        <aside className="rounded-lg border border-border/40 bg-card p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Estagio</p>
            <p className="font-display text-lg font-semibold">{liveState.stage}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Risco dominante</p>
            <p>{liveState.dominantRisk}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Proximo movimento</p>
            <p>{liveState.nextGoal}</p>
          </div>
          {intervention && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="font-medium">{intervention.headline}</p>
              <p className="text-sm text-muted-foreground">{intervention.whyNow}</p>
              <p className="text-sm"><strong>Acao:</strong> {intervention.nextMove}</p>
              {intervention.suggestedUtterance && (
                <p className="text-sm"><strong>Fala curta:</strong> {intervention.suggestedUtterance}</p>
              )}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
```

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReplay.tsx` with this content:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getSalesCopilotReviewPath } from "@/features/comercial/toolRoutes";
import { salesCopilotService } from "@/services/salesCopilotService";

export default function SalesCopilotReplay() {
  const navigate = useNavigate();
  const [replayText, setReplayText] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleRunReplay() {
    const lines = replayText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return;

    setBusy(true);
    try {
      const session = await salesCopilotService.createSession({
        title: "Replay em lote",
        source: "manual_replay",
      });
      await salesCopilotService.appendChunks(
        session.id,
        lines.map((text, index) => ({
          timestamp: new Date(Date.now() + index * 1000).toISOString(),
          speakerLabel: index % 2 === 0 ? "lead" : "seller",
          text,
        })),
      );
      await salesCopilotService.completeSession(session.id);
      navigate(getSalesCopilotReviewPath(session.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-8 space-y-4">
      <div className="rounded-lg border border-border/40 bg-card p-5 space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold">Replay manual</h1>
          <p className="text-sm text-muted-foreground">Cole linhas de transcript para gerar uma revisao completa.</p>
        </div>

        <label className="grid gap-2 text-sm font-medium">
          Transcript em linhas
          <textarea
            value={replayText}
            onChange={(event) => setReplayText(event.target.value)}
            className="min-h-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="lead: Gostei da proposta..."
          />
        </label>

        <Button onClick={handleRunReplay} disabled={busy || !replayText.trim()}>
          Gerar revisao
        </Button>
      </div>
    </div>
  );
}
```

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviews.tsx` with this placeholder content:

```tsx
export default function SalesCopilotReviews() {
  return (
    <div className="container py-8">
      <p className="text-sm text-muted-foreground">Revisoes em construcao.</p>
    </div>
  );
}
```

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.tsx` with this placeholder content:

```tsx
export default function SalesCopilotReviewDetail() {
  return (
    <div className="container py-8">
      <p className="text-sm text-muted-foreground">Detalhe da revisao em construcao.</p>
    </div>
  );
}
```

In `seven_tools_front/src/App.tsx`, add these lazy imports:

```tsx
const SalesCopilotShell = lazy(() => import("@/pages/tools/SalesCopilot/SalesCopilotShell.tsx"));
const SalesCopilotWorkspace = lazy(() => import("@/pages/tools/SalesCopilot/SalesCopilotWorkspace.tsx"));
const SalesCopilotReplay = lazy(() => import("@/pages/tools/SalesCopilot/SalesCopilotReplay.tsx"));
const SalesCopilotReviews = lazy(() => import("@/pages/tools/SalesCopilot/SalesCopilotReviews.tsx"));
const SalesCopilotReviewDetail = lazy(() => import("@/pages/tools/SalesCopilot/SalesCopilotReviewDetail.tsx"));
```

and add this nested route block above the generic `/tools/:slug/app` route:

```tsx
                <Route
                  path="/tools/sales-copilot-caloni/app"
                  element={withSuspense(<SalesCopilotShell />)}
                >
                  <Route index element={withSuspense(<SalesCopilotWorkspace />)} />
                  <Route path="replay" element={withSuspense(<SalesCopilotReplay />)} />
                  <Route path="reviews" element={withSuspense(<SalesCopilotReviews />)} />
                  <Route path="reviews/:sessionId" element={withSuspense(<SalesCopilotReviewDetail />)} />
                </Route>
```

- [ ] **Step 5: Run the workspace tests again and confirm they pass**

Run:

```powershell
Push-Location .\seven_tools_front
npm test -- src/features/comercial/salesCopilotRoutes.test.ts src/data/tools.salesCopilot.test.ts src/pages/tools/SalesCopilot/SalesCopilotShell.test.tsx src/pages/tools/SalesCopilot/SalesCopilotWorkspace.test.tsx
Pop-Location
```

Expected: PASS with the new route helpers, tool registration, and live workspace tests green.

- [ ] **Step 6: Commit the Sales Copilot live workspace**

Run:

```powershell
git -C ".\seven_tools_front" add src/features/comercial/toolRoutes.ts src/data/tools.ts src/App.tsx src/services/salesCopilotService.ts src/features/comercial/salesCopilotRoutes.test.ts src/data/tools.salesCopilot.test.ts src/pages/tools/SalesCopilot/SalesCopilotShell.tsx src/pages/tools/SalesCopilot/SalesCopilotReplay.tsx src/pages/tools/SalesCopilot/SalesCopilotWorkspace.tsx src/pages/tools/SalesCopilot/SalesCopilotReviews.tsx src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.tsx src/pages/tools/SalesCopilot/SalesCopilotShell.test.tsx src/pages/tools/SalesCopilot/SalesCopilotWorkspace.test.tsx
git -C ".\seven_tools_front" commit -m "feat: add sales copilot workspace"
```

Expected: one frontend commit that exposes the tool and the initial live and replay surfaces.

### Task 5: Add completed-call review pages in the frontend

**Files:**
- Modify: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviews.tsx`
- Modify: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.tsx`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviews.test.tsx`
- Create: `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.test.tsx`

- [ ] **Step 1: Write the failing review list and detail tests**

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviews.test.tsx` with this content:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/salesCopilotService", () => ({
  salesCopilotService: {
    listSessions: vi.fn().mockResolvedValue([
      {
        id: "session-1",
        companyId: "company-1",
        userId: "user-1",
        title: "Call de fechamento",
        source: "manual_replay",
        status: "completed",
        transcriptCount: 6,
        startedAt: "2026-04-10T10:00:00Z",
        endedAt: "2026-04-10T10:25:00Z",
        createdAt: "2026-04-10T10:00:00Z",
        updatedAt: "2026-04-10T10:25:00Z",
      },
    ]),
  },
}));

import SalesCopilotReviews from "./SalesCopilotReviews";

describe("SalesCopilotReviews", () => {
  it("lists completed sessions with links to the review detail", async () => {
    render(
      <MemoryRouter>
        <SalesCopilotReviews />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/call de fechamento/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /abrir revisao/i })).toHaveAttribute(
        "href",
        "/tools/sales-copilot-caloni/app/reviews/session-1",
      );
    });
  });
});
```

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.test.tsx` with this content:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/salesCopilotService", () => ({
  salesCopilotService: {
    getReview: vi.fn().mockResolvedValue({
      session: {
        id: "session-1",
        companyId: "company-1",
        userId: "user-1",
        title: "Call de fechamento",
        source: "manual_replay",
        status: "completed",
        transcriptCount: 2,
        startedAt: "2026-04-10T10:00:00Z",
        endedAt: "2026-04-10T10:25:00Z",
        createdAt: "2026-04-10T10:00:00Z",
        updatedAt: "2026-04-10T10:25:00Z",
      },
      review: {
        executiveSummary: "Boa conexao, mas faltou fechar compromisso.",
        stageJourney: ["abertura", "diagnostico", "objecoes"],
        objections: ["preciso pensar"],
        buySignals: ["gostei da proposta"],
        sellerGaps: ["compromisso_nao_testado"],
        nextStep: "Retomar a call nomeando a inseguranca e fechando combinado.",
      },
      transcript: [
        {
          id: "chunk-1",
          sessionId: "session-1",
          chunkIndex: 0,
          source: "manual_replay",
          speakerLabel: "lead",
          text: "Gostei da proposta, mas preciso pensar com calma",
          capturedAt: "2026-04-10T10:10:00Z",
        },
      ],
    }),
  },
}));

import SalesCopilotReviewDetail from "./SalesCopilotReviewDetail";

describe("SalesCopilotReviewDetail", () => {
  it("renders the executive summary, next step, and transcript", async () => {
    render(
      <MemoryRouter initialEntries={["/tools/sales-copilot-caloni/app/reviews/session-1"]}>
        <Routes>
          <Route path="/tools/sales-copilot-caloni/app/reviews/:sessionId" element={<SalesCopilotReviewDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/boa conexao, mas faltou fechar compromisso/i)).toBeInTheDocument();
      expect(screen.getByText(/retomar a call nomeando a inseguranca/i)).toBeInTheDocument();
      expect(screen.getByText(/gostei da proposta, mas preciso pensar com calma/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the review tests and confirm they fail**

Run:

```powershell
Push-Location .\seven_tools_front
npm test -- src/pages/tools/SalesCopilot/SalesCopilotReviews.test.tsx src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.test.tsx
Pop-Location
```

Expected: FAIL because the placeholder review pages do not yet render completed sessions or the persisted review detail.

- [ ] **Step 3: Add the completed-call review pages**

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviews.tsx` with this content:

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getSalesCopilotReviewPath } from "@/features/comercial/toolRoutes";
import { type SalesCopilotSession, salesCopilotService } from "@/services/salesCopilotService";

export default function SalesCopilotReviews() {
  const [items, setItems] = useState<SalesCopilotSession[]>([]);

  useEffect(() => {
    salesCopilotService.listSessions("completed").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="container py-8 space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold">Revisoes</h1>
        <p className="text-sm text-muted-foreground">Calls concluidas para auto-revisao individual.</p>
      </div>

      <div className="grid gap-4">
        {items.map((session) => (
          <div key={session.id} className="rounded-lg border border-border/40 bg-card p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{session.title || "Sessao sem titulo"}</p>
              <p className="text-sm text-muted-foreground">
                {session.transcriptCount} trechos - encerrada em {new Date(session.endedAt || session.updatedAt).toLocaleString()}
              </p>
            </div>
            <Link to={getSalesCopilotReviewPath(session.id)}>
              <Button variant="outline">Abrir revisao</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Create `seven_tools_front/src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.tsx` with this content:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { salesCopilotService, type SalesCopilotReviewDetail as SalesCopilotReviewDetailData } from "@/services/salesCopilotService";

export default function SalesCopilotReviewDetail() {
  const { sessionId } = useParams();
  const [data, setData] = useState<SalesCopilotReviewDetailData | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    salesCopilotService.getReview(sessionId).then(setData).catch(() => setData(null));
  }, [sessionId]);

  if (!data) {
    return (
      <div className="container py-8">
        <p className="text-sm text-muted-foreground">Carregando revisao...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <section className="rounded-lg border border-border/40 bg-card p-5 space-y-3">
        <div>
          <h1 className="font-display text-xl font-semibold">{data.session.title || "Sessao sem titulo"}</h1>
          <p className="text-sm text-muted-foreground">Resumo estrategico da call concluida.</p>
        </div>
        <p>{data.review.executiveSummary}</p>
        <p className="text-sm"><strong>Proximo passo:</strong> {data.review.nextStep}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/40 bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Leitura da call</h2>
          <p className="text-sm"><strong>Estagios:</strong> {data.review.stageJourney.join(", ") || "Nao identificado"}</p>
          <p className="text-sm"><strong>Objecoes:</strong> {data.review.objections.join(", ") || "Nenhuma"}</p>
          <p className="text-sm"><strong>Sinais de compra:</strong> {data.review.buySignals.join(", ") || "Nenhum"}</p>
          <p className="text-sm"><strong>Lacunas:</strong> {data.review.sellerGaps.join(", ") || "Nenhuma"}</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Transcript</h2>
          <div className="space-y-3">
            {data.transcript.map((chunk) => (
              <div key={chunk.id} className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{chunk.speakerLabel || "unknown"}</p>
                <p className="text-sm">{chunk.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run the review tests again and confirm they pass**

Run:

```powershell
Push-Location .\seven_tools_front
npm test -- src/pages/tools/SalesCopilot/SalesCopilotReviews.test.tsx src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.test.tsx
Pop-Location
```

Expected: PASS with the review list and review detail tests green.

- [ ] **Step 5: Commit the Sales Copilot review UI**

Run:

```powershell
git -C ".\seven_tools_front" add src/pages/tools/SalesCopilot/SalesCopilotReviews.tsx src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.tsx src/pages/tools/SalesCopilot/SalesCopilotReviews.test.tsx src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.test.tsx src/App.tsx
git -C ".\seven_tools_front" commit -m "feat: add sales copilot reviews"
```

Expected: one frontend commit that completes the seller review loop.

### Task 6: Run full verification before starting any extension work

**Files:**
- Verify: `seven_tools_api/tests/test_sales_copilot_runtime.py`
- Verify: `seven_tools_api/tests/test_sales_copilot_api.py`
- Verify: `seven_tools_api/tests/test_sales_copilot_analysis.py`
- Verify: `seven_tools_front/src/pages/tools/SalesCopilot/*`
- Verify: `seven_tools_front/src/services/salesCopilotService.ts`

- [ ] **Step 1: Run the backend Sales Copilot suite on a migrated database**

Run:

```powershell
Push-Location .\seven_tools_api
alembic upgrade head
python -m pytest .\tests\test_sales_copilot_runtime.py .\tests\test_sales_copilot_api.py .\tests\test_sales_copilot_analysis.py -q
Pop-Location
```

Expected: PASS with all Sales Copilot backend tests green.

- [ ] **Step 2: Run the frontend Sales Copilot suite**

Run:

```powershell
Push-Location .\seven_tools_front
npm test -- src/features/comercial/salesCopilotRoutes.test.ts src/data/tools.salesCopilot.test.ts src/pages/tools/SalesCopilot/SalesCopilotShell.test.tsx src/pages/tools/SalesCopilot/SalesCopilotWorkspace.test.tsx src/pages/tools/SalesCopilot/SalesCopilotReviews.test.tsx src/pages/tools/SalesCopilot/SalesCopilotReviewDetail.test.tsx
Pop-Location
```

Expected: PASS with all Sales Copilot frontend tests green.

- [ ] **Step 3: Run the frontend production build**

Run:

```powershell
Push-Location .\seven_tools_front
npm run build
Pop-Location
```

Expected: Vite build succeeds with no TypeScript or route import errors.

- [ ] **Step 4: Smoke-test the full flow manually**

Run:

```powershell
Push-Location .\seven_tools_api
uvicorn app.main:app --reload
Pop-Location
Push-Location .\seven_tools_front
npm run dev
Pop-Location
```

Then verify this exact sequence in the browser:

```text
1. Open /tools/sales-copilot-caloni and enter the app
2. Start a session in "Ao vivo"
3. Send one lead chunk that sounds like price insecurity
4. Confirm the panel shows stage, dominant risk, next goal, and optional utterance
5. Complete the session and land on the review detail page
6. Open "Replay", paste three transcript lines, generate a second review
7. Open "Revisoes" and confirm both completed sessions appear
```

Expected: the whole manual flow works without the Chrome extension.

- [ ] **Step 5: Leave extension work for a separate plan**

Run:

```powershell
Write-Output "Core Sales Copilot MVP verified. Do not start the Meet extension in this branch without a separate plan."
```

Expected: a clear boundary remains between the core tool and the later capture bridge.
