# Tool Chat Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ChatGPT-like conversation sessions for the current chat tool, Caloni Propostas, with New Chat, search, recents, persisted messages, and replayable assistant payloads.

**Architecture:** The backend owns generic `tool_chat_sessions` and `tool_chat_messages` tables scoped by authenticated user and `tool_slug`. The frontend adds a reusable chat-session service, hook, sidebar, and shell, then wires them into `ChatToolPage` only for `proposta-comercial-smart` in this MVP. Business objects stay separate: proposals remain in `/proposals`; sessions only store conversation history and light metadata.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL JSONB, pytest, React 18, TypeScript, Vite, shadcn/ui, TailwindCSS, Vitest, React Testing Library.

---

## Scope

This plan implements the history infrastructure for the current tool route:

- `proposta-comercial-smart`, visible as Caloni Propostas.

The backend allowlist will include the three commercial tool slugs so the data model is ready, but this plan integrates the sidebar and persisted chat only into `ChatToolPage` for Caloni Propostas. Raio-X Comercial and Radar de Leads keep their current screens until their own execution plans.

## Repo Roots

- Backend: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api`
- Frontend: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration`

## Branches

- Backend branch: `feature/ai-proposal-assistant`
- Frontend branch: `codex/chat-tool-integration`

## Existing Dirty Worktree Guardrail

Before implementation, run these commands and keep unrelated changes out of commits:

```powershell
git -C C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api status --short --branch
git -C C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration status --short --branch
```

Expected current situation:

- Backend has existing modified files from AI/profile/env work.
- Frontend has existing modified files from tool naming/profile work.
- Do not revert those files.
- Each task commit must `git add` only the files listed in that task.

## File Structure

### Backend Files

- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/models/tool_chat.py`
  - SQLAlchemy models for sessions and messages.
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/models/__init__.py`
  - Register new models so `Base.metadata.create_all()` includes them in tests.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/modules/tool_chat/constants.py`
  - Slug allowlist and default title.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/schemas/tool_chat.py`
  - Pydantic request/response contracts.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/modules/tool_chat/service.py`
  - Persistence, title generation, ownership checks, serialization.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/modules/tool_chat/router.py`
  - REST endpoints under `/tool-chat`.
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/main.py`
  - Include the router.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/alembic/versions/d8c1b4a7f2e3_add_tool_chat_sessions.py`
  - Tables and indexes.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/tests/test_tool_chat.py`
  - API-level tests.
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/tests/test_migrations.py`
  - Include migration smoke coverage only if the existing test requires an expected head list.

### Frontend Files

- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/types.ts`
  - Shared TypeScript types and serializers.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/toolChatSessionService.ts`
  - API client wrapper.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/useToolChatSessions.ts`
  - Session list, active session, message loading, search, and create/open helpers.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatSearchInput.tsx`
  - Search field.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatSessionItem.tsx`
  - One sidebar row.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatSessionList.tsx`
  - Loading, empty, error, search-empty, and recent list states.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatSidebar.tsx`
  - Sidebar content shared by desktop and mobile sheet.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatShell.tsx`
  - Responsive layout wrapper with desktop sidebar and mobile Sheet.
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/index.ts`
  - Barrel exports.
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/caloni/adapter.ts`
  - Add optional `history` to `AgentInput`.
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat/useAgentChat.ts`
  - Add session persistence hooks and message hydration.
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/pages/ChatToolPage.tsx`
  - Integrate sessions, sidebar, URL `sessionId`, draft reset, payload replay, and full conversation history to the proposal assistant.
- Test: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/__tests__/toolChatSessionService.test.ts`
- Test: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/__tests__/useToolChatSessions.test.tsx`
- Test: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/__tests__/ToolChatSidebar.test.tsx`
- Modify test: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat/__tests__/useAgentChat.test.tsx`
- Create test: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/pages/__tests__/ChatToolPage.sessions.test.tsx`

---

### Task 1: Backend API Tests

**Files:**
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/tests/test_tool_chat.py`

- [ ] **Step 1: Write the failing endpoint tests**

Create `tests/test_tool_chat.py` with this content:

```python
import uuid
from datetime import datetime, timedelta, timezone

from app.models.company import Company
from app.models.session import Session as AuthSession
from app.models.user import ApprovalSource, User, ValidationStatus
from app.utils.security import generate_token, hash_password


def create_approved_user_headers(db, email: str) -> dict[str, str]:
    company = Company(id=uuid.uuid4(), name=f"Company {email}", segment="Tech", city="Sao Paulo")
    db.add(company)
    db.flush()

    user = User(
        id=uuid.uuid4(),
        company_id=company.id,
        name=f"User {email}",
        email=email,
        password_hash=hash_password("password123"),
        role="user",
        validation_status=ValidationStatus.approved,
        approval_source=ApprovalSource.seed,
    )
    db.add(user)
    db.flush()

    token = generate_token()
    db.add(
        AuthSession(
            id=uuid.uuid4(),
            user_id=user.id,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
    )
    db.commit()
    return {"Authorization": f"Bearer {token}"}


def create_session(client, headers, title="Novo chat", tool_slug="proposta-comercial-smart"):
    response = client.post(
        "/api/v1/tool-chat/sessions",
        headers=headers,
        json={"tool_slug": tool_slug, "title": title, "metadata": {"origin": "test"}},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_create_and_list_tool_chat_session(client, auth_headers):
    created = create_session(client, auth_headers, title="Proposta Aurora")

    assert created["tool_slug"] == "proposta-comercial-smart"
    assert created["title"] == "Proposta Aurora"
    assert created["metadata"] == {"origin": "test"}
    assert created["archived_at"] is None

    response = client.get(
        "/api/v1/tool-chat/sessions?tool_slug=proposta-comercial-smart",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == created["id"]
    assert data["items"][0]["title"] == "Proposta Aurora"


def test_list_filters_by_tool_slug_and_search_title(client, auth_headers):
    create_session(client, auth_headers, title="Proposta Aurora", tool_slug="proposta-comercial-smart")
    create_session(client, auth_headers, title="Diagnostico Aurora", tool_slug="diagnostico-comercial-caloni")
    create_session(client, auth_headers, title="Proposta Boreal", tool_slug="proposta-comercial-smart")

    response = client.get(
        "/api/v1/tool-chat/sessions?tool_slug=proposta-comercial-smart&q=aurora",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Proposta Aurora"
    assert data["items"][0]["tool_slug"] == "proposta-comercial-smart"


def test_messages_persist_payload_and_update_session_timestamp(client, auth_headers):
    created = create_session(client, auth_headers)

    session_before = client.get(
        f"/api/v1/tool-chat/sessions/{created['id']}",
        headers=auth_headers,
    ).json()

    user_response = client.post(
        f"/api/v1/tool-chat/sessions/{created['id']}/messages",
        headers=auth_headers,
        json={"role": "user", "content": "Quero uma proposta para a Clinica Aurora"},
    )
    assert user_response.status_code == 201, user_response.text
    assert user_response.json()["content"] == "Quero uma proposta para a Clinica Aurora"

    assistant_response = client.post(
        f"/api/v1/tool-chat/sessions/{created['id']}/messages",
        headers=auth_headers,
        json={
            "role": "assistant",
            "content": "Atualizei o rascunho.",
            "payload": {
                "kind": "proposal_draft_patch",
                "patch": {"clientName": "Maria Aurora"},
            },
            "variant": "default",
        },
    )
    assert assistant_response.status_code == 201, assistant_response.text

    messages_response = client.get(
        f"/api/v1/tool-chat/sessions/{created['id']}/messages",
        headers=auth_headers,
    )
    assert messages_response.status_code == 200
    messages = messages_response.json()
    assert [message["role"] for message in messages] == ["user", "assistant"]
    assert messages[1]["payload"]["kind"] == "proposal_draft_patch"

    session_after = client.get(
        f"/api/v1/tool-chat/sessions/{created['id']}",
        headers=auth_headers,
    ).json()
    assert session_after["title"] == "Quero uma proposta para a Clinica Aurora"
    assert session_after["updated_at"] >= session_before["updated_at"]


def test_patch_session_metadata(client, auth_headers):
    created = create_session(client, auth_headers)

    response = client.patch(
        f"/api/v1/tool-chat/sessions/{created['id']}",
        headers=auth_headers,
        json={"metadata": {"proposal_id": "p_123"}, "title": "Proposta final"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Proposta final"
    assert data["metadata"] == {"origin": "test", "proposal_id": "p_123"}


def test_user_cannot_access_other_user_session(client, db, auth_headers):
    other_headers = create_approved_user_headers(db, "other@example.com")
    created = create_session(client, other_headers, title="Conversa privada")

    get_response = client.get(
        f"/api/v1/tool-chat/sessions/{created['id']}",
        headers=auth_headers,
    )
    messages_response = client.get(
        f"/api/v1/tool-chat/sessions/{created['id']}/messages",
        headers=auth_headers,
    )

    assert get_response.status_code == 404
    assert messages_response.status_code == 404


def test_invalid_tool_slug_is_rejected(client, auth_headers):
    response = client.post(
        "/api/v1/tool-chat/sessions",
        headers=auth_headers,
        json={"tool_slug": "ferramenta-inexistente"},
    )

    assert response.status_code == 422
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api
pytest tests/test_tool_chat.py -q
```

Expected: failures with `404 Not Found` for `/api/v1/tool-chat/sessions`, because the router does not exist yet.

- [ ] **Step 3: Commit the failing tests**

```powershell
git add tests/test_tool_chat.py
git commit -m "test: cover tool chat session api"
```

---

### Task 2: Backend Models And Migration

**Files:**
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/models/tool_chat.py`
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/models/__init__.py`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/alembic/versions/d8c1b4a7f2e3_add_tool_chat_sessions.py`

- [ ] **Step 1: Add the SQLAlchemy models**

Create `app/models/tool_chat.py`:

```python
import enum
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ToolChatMessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class ToolChatSession(Base):
    __tablename__ = "tool_chat_sessions"
    __table_args__ = (
        Index("ix_tool_chat_sessions_user_tool_updated", "user_id", "tool_slug", "updated_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    tool_slug: Mapped[str] = mapped_column(String(120), index=True)
    title: Mapped[str] = mapped_column(String(255), default="Novo chat")
    extra_metadata: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, default=dict)
    archived_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)

    messages: Mapped[list["ToolChatMessage"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ToolChatMessage.created_at",
    )


class ToolChatMessage(Base):
    __tablename__ = "tool_chat_messages"
    __table_args__ = (
        Index("ix_tool_chat_messages_session_created", "session_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tool_chat_sessions.id", ondelete="CASCADE"),
        index=True,
    )
    role: Mapped[ToolChatMessageRole] = mapped_column(Enum(ToolChatMessageRole))
    content: Mapped[str] = mapped_column(Text)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    attachments: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)
    variant: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    session: Mapped[ToolChatSession] = relationship(back_populates="messages")
```

- [ ] **Step 2: Register the models**

Modify `app/models/__init__.py` by adding:

```python
from app.models.tool_chat import ToolChatMessage, ToolChatMessageRole, ToolChatSession
```

Append these names to `__all__`:

```python
    "ToolChatSession",
    "ToolChatMessage",
    "ToolChatMessageRole",
```

- [ ] **Step 3: Add the Alembic migration**

Create `alembic/versions/d8c1b4a7f2e3_add_tool_chat_sessions.py`:

```python
"""add tool chat sessions

Revision ID: d8c1b4a7f2e3
Revises: c4a7c3f9e2b1
Create Date: 2026-05-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d8c1b4a7f2e3"
down_revision: Union[str, None] = "c4a7c3f9e2b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    role_enum = sa.Enum("user", "assistant", "system", name="toolchatmessagerole")

    op.create_table(
        "tool_chat_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("tool_slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("archived_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tool_chat_sessions_user_id"), "tool_chat_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_tool_chat_sessions_tool_slug"), "tool_chat_sessions", ["tool_slug"], unique=False)
    op.create_index(
        "ix_tool_chat_sessions_user_tool_updated",
        "tool_chat_sessions",
        ["user_id", "tool_slug", "updated_at"],
        unique=False,
    )

    op.create_table(
        "tool_chat_messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("role", role_enum, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("attachments", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("variant", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["tool_chat_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tool_chat_messages_session_id"), "tool_chat_messages", ["session_id"], unique=False)
    op.create_index(
        "ix_tool_chat_messages_session_created",
        "tool_chat_messages",
        ["session_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_tool_chat_messages_session_created", table_name="tool_chat_messages")
    op.drop_index(op.f("ix_tool_chat_messages_session_id"), table_name="tool_chat_messages")
    op.drop_table("tool_chat_messages")
    op.drop_index("ix_tool_chat_sessions_user_tool_updated", table_name="tool_chat_sessions")
    op.drop_index(op.f("ix_tool_chat_sessions_tool_slug"), table_name="tool_chat_sessions")
    op.drop_index(op.f("ix_tool_chat_sessions_user_id"), table_name="tool_chat_sessions")
    op.drop_table("tool_chat_sessions")
    bind = op.get_bind()
    sa.Enum("user", "assistant", "system", name="toolchatmessagerole").drop(bind, checkfirst=True)
```

- [ ] **Step 4: Run model-backed tests**

Run:

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api
pytest tests/test_tool_chat.py -q
```

Expected: tests still fail with `404 Not Found`, but no SQLAlchemy mapping errors.

- [ ] **Step 5: Run migration smoke**

Run:

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api
pytest tests/test_migrations.py -q
```

Expected: pass. If it fails because the expected Alembic head changed, update the expected revision from `c4a7c3f9e2b1` to `d8c1b4a7f2e3` in `tests/test_migrations.py`, then rerun the same command.

- [ ] **Step 6: Commit models and migration**

```powershell
git add app/models/tool_chat.py app/models/__init__.py alembic/versions/d8c1b4a7f2e3_add_tool_chat_sessions.py tests/test_migrations.py
git commit -m "feat: add tool chat session models"
```

---

### Task 3: Backend Service, Schemas, And Router

**Files:**
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/modules/tool_chat/constants.py`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/schemas/tool_chat.py`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/modules/tool_chat/service.py`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/modules/tool_chat/router.py`
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api/app/main.py`

- [ ] **Step 1: Add constants**

Create `app/modules/tool_chat/constants.py`:

```python
DEFAULT_SESSION_TITLE = "Novo chat"

ALLOWED_TOOL_SLUGS = {
    "proposta-comercial-smart",
    "diagnostico-comercial-caloni",
    "qualificacao-de-leads",
}
```

- [ ] **Step 2: Add Pydantic schemas**

Create `app/schemas/tool_chat.py`:

```python
import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from app.modules.tool_chat.constants import ALLOWED_TOOL_SLUGS, DEFAULT_SESSION_TITLE


def validate_tool_slug(value: str) -> str:
    if value not in ALLOWED_TOOL_SLUGS:
        raise ValueError(f"Unsupported tool_slug: {value}")
    return value


class ToolChatSessionCreate(BaseModel):
    tool_slug: str
    title: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("tool_slug")
    @classmethod
    def tool_slug_must_be_known(cls, value: str) -> str:
        return validate_tool_slug(value)


class ToolChatSessionPatch(BaseModel):
    title: str | None = None
    metadata: dict[str, Any] | None = None


class ToolChatSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tool_slug: str
    title: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    archived_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PaginatedToolChatSessionResponse(BaseModel):
    items: list[ToolChatSessionResponse]
    total: int
    page: int
    per_page: int


class ToolChatMessageCreate(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    payload: dict[str, Any] | None = None
    attachments: list[dict[str, Any]] | None = None
    variant: str | None = None


class ToolChatMessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: Literal["user", "assistant", "system"]
    content: str
    payload: dict[str, Any] | None = None
    attachments: list[dict[str, Any]] | None = None
    variant: str | None = None
    created_at: datetime


def normalized_title(title: str | None) -> str:
    title = (title or "").strip()
    return title or DEFAULT_SESSION_TITLE
```

- [ ] **Step 3: Add service functions**

Create `app/modules/tool_chat/service.py`:

```python
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession

from app.models.tool_chat import ToolChatMessage, ToolChatMessageRole, ToolChatSession
from app.modules.tool_chat.constants import DEFAULT_SESSION_TITLE
from app.schemas.tool_chat import (
    ToolChatMessageCreate,
    ToolChatMessageResponse,
    ToolChatSessionCreate,
    ToolChatSessionPatch,
    ToolChatSessionResponse,
    normalized_title,
)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def title_from_message(content: str) -> str:
    compact = re.sub(r"\s+", " ", content).strip()
    if not compact:
        return DEFAULT_SESSION_TITLE
    return compact[:80]


def serialize_session(session: ToolChatSession) -> ToolChatSessionResponse:
    return ToolChatSessionResponse(
        id=session.id,
        user_id=session.user_id,
        tool_slug=session.tool_slug,
        title=session.title,
        metadata=session.extra_metadata or {},
        archived_at=session.archived_at,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


def serialize_message(message: ToolChatMessage) -> ToolChatMessageResponse:
    return ToolChatMessageResponse(
        id=message.id,
        session_id=message.session_id,
        role=message.role.value,
        content=message.content,
        payload=message.payload,
        attachments=message.attachments,
        variant=message.variant,
        created_at=message.created_at,
    )


def create_session(
    db: DbSession,
    user_id: uuid.UUID,
    body: ToolChatSessionCreate,
) -> ToolChatSessionResponse:
    session = ToolChatSession(
        id=uuid.uuid4(),
        user_id=user_id,
        tool_slug=body.tool_slug,
        title=normalized_title(body.title),
        extra_metadata=body.metadata,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return serialize_session(session)


def get_session(db: DbSession, user_id: uuid.UUID, session_id: uuid.UUID) -> ToolChatSession | None:
    return db.scalar(
        select(ToolChatSession).where(
            ToolChatSession.id == session_id,
            ToolChatSession.user_id == user_id,
            ToolChatSession.archived_at.is_(None),
        )
    )


def list_sessions(
    db: DbSession,
    user_id: uuid.UUID,
    tool_slug: str,
    q: str | None,
    page: int,
    per_page: int,
) -> tuple[list[ToolChatSessionResponse], int]:
    filters = [
        ToolChatSession.user_id == user_id,
        ToolChatSession.tool_slug == tool_slug,
        ToolChatSession.archived_at.is_(None),
    ]
    if q and q.strip():
        filters.append(ToolChatSession.title.ilike(f"%{q.strip()}%"))

    total = db.scalar(select(func.count()).select_from(ToolChatSession).where(*filters)) or 0
    sessions = db.scalars(
        select(ToolChatSession)
        .where(*filters)
        .order_by(ToolChatSession.updated_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    ).all()
    return [serialize_session(session) for session in sessions], total


def patch_session(
    db: DbSession,
    session: ToolChatSession,
    body: ToolChatSessionPatch,
) -> ToolChatSessionResponse:
    if body.title is not None:
        session.title = normalized_title(body.title)
    if body.metadata is not None:
        session.extra_metadata = {**(session.extra_metadata or {}), **body.metadata}
    session.updated_at = now_utc()
    db.add(session)
    db.commit()
    db.refresh(session)
    return serialize_session(session)


def list_messages(db: DbSession, session: ToolChatSession) -> list[ToolChatMessageResponse]:
    messages = db.scalars(
        select(ToolChatMessage)
        .where(ToolChatMessage.session_id == session.id)
        .order_by(ToolChatMessage.created_at.asc())
    ).all()
    return [serialize_message(message) for message in messages]


def create_message(
    db: DbSession,
    session: ToolChatSession,
    body: ToolChatMessageCreate,
) -> ToolChatMessageResponse:
    message = ToolChatMessage(
        id=uuid.uuid4(),
        session_id=session.id,
        role=ToolChatMessageRole(body.role),
        content=body.content,
        payload=body.payload,
        attachments=body.attachments,
        variant=body.variant,
    )
    db.add(message)
    if body.role == "user" and session.title == DEFAULT_SESSION_TITLE:
        session.title = title_from_message(body.content)
    session.updated_at = now_utc()
    db.add(session)
    db.commit()
    db.refresh(message)
    return serialize_message(message)
```

- [ ] **Step 4: Add router**

Create `app/modules/tool_chat/router.py`:

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DbSession

from app.dependencies import get_current_approved_user, get_db
from app.models.user import User
from app.modules.tool_chat.constants import ALLOWED_TOOL_SLUGS
from app.modules.tool_chat.service import (
    create_message,
    create_session,
    get_session,
    list_messages,
    list_sessions,
    patch_session,
    serialize_session,
)
from app.schemas.tool_chat import (
    PaginatedToolChatSessionResponse,
    ToolChatMessageCreate,
    ToolChatMessageResponse,
    ToolChatSessionCreate,
    ToolChatSessionPatch,
    ToolChatSessionResponse,
)

router = APIRouter(prefix="/tool-chat", tags=["tool-chat"])


def require_known_tool_slug(tool_slug: str) -> str:
    if tool_slug not in ALLOWED_TOOL_SLUGS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported tool_slug",
        )
    return tool_slug


def require_session(db: DbSession, user_id: uuid.UUID, session_id: uuid.UUID):
    session = get_session(db, user_id, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool chat session not found")
    return session


@router.post("/sessions", response_model=ToolChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_one(
    body: ToolChatSessionCreate,
    user: User = Depends(get_current_approved_user),
    db: DbSession = Depends(get_db),
):
    return create_session(db, user.id, body)


@router.get("/sessions", response_model=PaginatedToolChatSessionResponse)
def list_all(
    tool_slug: str = Query(...),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    user: User = Depends(get_current_approved_user),
    db: DbSession = Depends(get_db),
):
    require_known_tool_slug(tool_slug)
    items, total = list_sessions(db, user.id, tool_slug, q, page, per_page)
    return PaginatedToolChatSessionResponse(items=items, total=total, page=page, per_page=per_page)


@router.get("/sessions/{session_id}", response_model=ToolChatSessionResponse)
def get_one(
    session_id: uuid.UUID,
    user: User = Depends(get_current_approved_user),
    db: DbSession = Depends(get_db),
):
    session = require_session(db, user.id, session_id)
    return serialize_session(session)


@router.patch("/sessions/{session_id}", response_model=ToolChatSessionResponse)
def patch_one(
    session_id: uuid.UUID,
    body: ToolChatSessionPatch,
    user: User = Depends(get_current_approved_user),
    db: DbSession = Depends(get_db),
):
    session = require_session(db, user.id, session_id)
    return patch_session(db, session, body)


@router.get("/sessions/{session_id}/messages", response_model=list[ToolChatMessageResponse])
def list_session_messages(
    session_id: uuid.UUID,
    user: User = Depends(get_current_approved_user),
    db: DbSession = Depends(get_db),
):
    session = require_session(db, user.id, session_id)
    return list_messages(db, session)


@router.post(
    "/sessions/{session_id}/messages",
    response_model=ToolChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session_message(
    session_id: uuid.UUID,
    body: ToolChatMessageCreate,
    user: User = Depends(get_current_approved_user),
    db: DbSession = Depends(get_db),
):
    session = require_session(db, user.id, session_id)
    return create_message(db, session, body)
```

- [ ] **Step 5: Register router in app**

Modify `app/main.py`.

Add import:

```python
from app.modules.tool_chat.router import router as tool_chat_router
```

Add include after proposals:

```python
    app.include_router(tool_chat_router, prefix="/api/v1")
```

- [ ] **Step 6: Run backend tests**

Run:

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api
pytest tests/test_tool_chat.py tests/test_router_dependency_annotations.py -q
```

Expected: pass.

- [ ] **Step 7: Run migration smoke**

Run:

```powershell
pytest tests/test_migrations.py -q
```

Expected: pass.

- [ ] **Step 8: Commit backend API**

```powershell
git add app/modules/tool_chat/constants.py app/schemas/tool_chat.py app/modules/tool_chat/service.py app/modules/tool_chat/router.py app/main.py
git commit -m "feat: expose tool chat session api"
```

---

### Task 4: Frontend Session Types And API Service

**Files:**
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/types.ts`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/toolChatSessionService.ts`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/index.ts`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/__tests__/toolChatSessionService.test.ts`

- [ ] **Step 1: Write service tests**

Create `src/agents/chat-sessions/__tests__/toolChatSessionService.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toolChatSessionService } from '../toolChatSessionService';
import api from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('toolChatSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista sessoes filtradas por ferramenta e busca', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        items: [{ id: 's1', toolSlug: 'proposta-comercial-smart', title: 'Aurora' }],
        total: 1,
        page: 1,
        perPage: 30,
      },
    });

    const result = await toolChatSessionService.listSessions({
      toolSlug: 'proposta-comercial-smart',
      q: 'aurora',
      page: 1,
      perPage: 30,
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/tool-chat/sessions', {
      params: { tool_slug: 'proposta-comercial-smart', q: 'aurora', page: 1, per_page: 30 },
    });
    expect(result.items).toHaveLength(1);
  });

  it('cria sessao com titulo padrao quando nenhum titulo e informado', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { id: 's1', toolSlug: 'proposta-comercial-smart', title: 'Novo chat' },
    });

    const result = await toolChatSessionService.createSession({
      toolSlug: 'proposta-comercial-smart',
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/tool-chat/sessions', {
      toolSlug: 'proposta-comercial-smart',
      title: undefined,
      metadata: {},
    });
    expect(result.id).toBe('s1');
  });

  it('persiste mensagem com payload serializavel', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        id: 'm1',
        sessionId: 's1',
        role: 'assistant',
        content: 'ok',
        payload: { kind: 'proposal_draft_patch' },
        createdAt: '2026-05-25T10:00:00Z',
      },
    });

    const result = await toolChatSessionService.createMessage('s1', {
      role: 'assistant',
      content: 'ok',
      payload: { kind: 'proposal_draft_patch' },
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/tool-chat/sessions/s1/messages', {
      role: 'assistant',
      content: 'ok',
      payload: { kind: 'proposal_draft_patch' },
      attachments: undefined,
      variant: undefined,
    });
    expect(result.payload).toEqual({ kind: 'proposal_draft_patch' });
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration
npm run test -- src/agents/chat-sessions/__tests__/toolChatSessionService.test.ts
```

Expected: fail because the service module does not exist.

- [ ] **Step 3: Add types and serializers**

Create `src/agents/chat-sessions/types.ts`:

```ts
import type { ChatMessage, MessageRole, MessageVariant } from '@/agents/chat/types';

export interface ToolChatSession {
  id: string;
  userId: string;
  toolSlug: string;
  title: string;
  metadata: Record<string, unknown>;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedToolChatSessionResponse {
  items: ToolChatSession[];
  total: number;
  page: number;
  perPage: number;
}

export interface ToolChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  payload?: unknown;
  attachments?: Array<Record<string, unknown>>;
  variant?: MessageVariant;
  createdAt: string;
}

export interface ListToolChatSessionsParams {
  toolSlug: string;
  q?: string;
  page?: number;
  perPage?: number;
}

export interface CreateToolChatSessionInput {
  toolSlug: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface PatchToolChatSessionInput {
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateToolChatMessageInput {
  role: MessageRole;
  content: string;
  payload?: unknown;
  attachments?: Array<Record<string, unknown>>;
  variant?: MessageVariant;
}

export function chatMessageToPersistedInput(message: ChatMessage): CreateToolChatMessageInput {
  return {
    role: message.role,
    content: typeof message.content === 'string' ? message.content : String(message.content ?? ''),
    ...(message.payload !== undefined ? { payload: message.payload } : {}),
    ...(message.variant ? { variant: message.variant } : {}),
    ...(message.attachments?.length
      ? {
          attachments: message.attachments.map((attachment) => ({
            id: attachment.id,
            type: attachment.type,
            name: attachment.name,
            sizeBytes: attachment.sizeBytes,
          })),
        }
      : {}),
  };
}

export function persistedMessageToChatMessage(message: ToolChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: new Date(message.createdAt).getTime(),
    ...(message.payload !== undefined ? { payload: message.payload } : {}),
    ...(message.variant ? { variant: message.variant } : {}),
  };
}
```

- [ ] **Step 4: Add API service**

Create `src/agents/chat-sessions/toolChatSessionService.ts`:

```ts
import api from '@/lib/apiClient';
import type {
  CreateToolChatMessageInput,
  CreateToolChatSessionInput,
  ListToolChatSessionsParams,
  PaginatedToolChatSessionResponse,
  PatchToolChatSessionInput,
  ToolChatMessage,
  ToolChatSession,
} from './types';

export const toolChatSessionService = {
  async listSessions({
    toolSlug,
    q,
    page = 1,
    perPage = 30,
  }: ListToolChatSessionsParams): Promise<PaginatedToolChatSessionResponse> {
    const { data } = await api.get<PaginatedToolChatSessionResponse>('/tool-chat/sessions', {
      params: { tool_slug: toolSlug, q, page, per_page: perPage },
    });
    return data;
  },

  async createSession(input: CreateToolChatSessionInput): Promise<ToolChatSession> {
    const { data } = await api.post<ToolChatSession>('/tool-chat/sessions', {
      toolSlug: input.toolSlug,
      title: input.title,
      metadata: input.metadata ?? {},
    });
    return data;
  },

  async getSession(sessionId: string): Promise<ToolChatSession> {
    const { data } = await api.get<ToolChatSession>(`/tool-chat/sessions/${sessionId}`);
    return data;
  },

  async patchSession(
    sessionId: string,
    input: PatchToolChatSessionInput,
  ): Promise<ToolChatSession> {
    const { data } = await api.patch<ToolChatSession>(`/tool-chat/sessions/${sessionId}`, input);
    return data;
  },

  async listMessages(sessionId: string): Promise<ToolChatMessage[]> {
    const { data } = await api.get<ToolChatMessage[]>(`/tool-chat/sessions/${sessionId}/messages`);
    return data;
  },

  async createMessage(
    sessionId: string,
    input: CreateToolChatMessageInput,
  ): Promise<ToolChatMessage> {
    const { data } = await api.post<ToolChatMessage>(`/tool-chat/sessions/${sessionId}/messages`, {
      role: input.role,
      content: input.content,
      payload: input.payload,
      attachments: input.attachments,
      variant: input.variant,
    });
    return data;
  },
};
```

- [ ] **Step 5: Add barrel exports**

Create `src/agents/chat-sessions/index.ts`:

```ts
export * from './ToolChatShell';
export * from './ToolChatSidebar';
export * from './toolChatSessionService';
export * from './types';
export * from './useToolChatSessions';
```

This file will reference components and hooks created in later tasks. TypeScript will compile after those files exist.

- [ ] **Step 6: Run service tests**

```powershell
npm run test -- src/agents/chat-sessions/__tests__/toolChatSessionService.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit frontend service**

```powershell
git add src/agents/chat-sessions/types.ts src/agents/chat-sessions/toolChatSessionService.ts src/agents/chat-sessions/index.ts src/agents/chat-sessions/__tests__/toolChatSessionService.test.ts
git commit -m "feat: add tool chat session service"
```

---

### Task 5: Frontend Session Hook

**Files:**
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/useToolChatSessions.ts`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/__tests__/useToolChatSessions.test.tsx`

- [ ] **Step 1: Write hook tests**

Create `src/agents/chat-sessions/__tests__/useToolChatSessions.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toolChatSessionService } from '../toolChatSessionService';
import { useToolChatSessions } from '../useToolChatSessions';

vi.mock('../toolChatSessionService', () => ({
  toolChatSessionService: {
    listSessions: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    listMessages: vi.fn(),
    createMessage: vi.fn(),
    patchSession: vi.fn(),
  },
}));

const service = vi.mocked(toolChatSessionService);

describe('useToolChatSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.listSessions.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 30,
    });
  });

  it('carrega recentes da ferramenta atual', async () => {
    service.listSessions.mockResolvedValueOnce({
      items: [
        {
          id: 's1',
          userId: 'u1',
          toolSlug: 'proposta-comercial-smart',
          title: 'Aurora',
          metadata: {},
          createdAt: '2026-05-25T10:00:00Z',
          updatedAt: '2026-05-25T10:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      perPage: 30,
    });

    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    await waitFor(() => expect(result.current.loadingSessions).toBe(false));

    expect(service.listSessions).toHaveBeenCalledWith({
      toolSlug: 'proposta-comercial-smart',
      q: '',
      page: 1,
      perPage: 30,
    });
    expect(result.current.sessions[0].title).toBe('Aurora');
  });

  it('cria sessao nova e define como ativa', async () => {
    service.createSession.mockResolvedValueOnce({
      id: 's2',
      userId: 'u1',
      toolSlug: 'proposta-comercial-smart',
      title: 'Novo chat',
      metadata: {},
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T10:00:00Z',
    });
    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    let createdId = '';
    await act(async () => {
      createdId = (await result.current.createNewSession()).id;
    });

    expect(createdId).toBe('s2');
    expect(result.current.activeSession?.id).toBe('s2');
  });

  it('abre sessao e converte mensagens persistidas para ChatMessage', async () => {
    service.getSession.mockResolvedValueOnce({
      id: 's1',
      userId: 'u1',
      toolSlug: 'proposta-comercial-smart',
      title: 'Aurora',
      metadata: {},
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T10:00:00Z',
    });
    service.listMessages.mockResolvedValueOnce([
      {
        id: 'm1',
        sessionId: 's1',
        role: 'user',
        content: 'Oi',
        createdAt: '2026-05-25T10:01:00Z',
      },
    ]);
    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    await act(async () => {
      await result.current.openSession('s1');
    });

    expect(result.current.activeSession?.title).toBe('Aurora');
    expect(result.current.activeMessages[0]).toMatchObject({ id: 'm1', role: 'user', content: 'Oi' });
  });
});
```

- [ ] **Step 2: Run hook tests and verify they fail**

```powershell
npm run test -- src/agents/chat-sessions/__tests__/useToolChatSessions.test.tsx
```

Expected: fail because `useToolChatSessions.ts` does not exist.

- [ ] **Step 3: Implement hook**

Create `src/agents/chat-sessions/useToolChatSessions.ts`:

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ChatMessage } from '@/agents/chat/types';
import { toolChatSessionService } from './toolChatSessionService';
import { chatMessageToPersistedInput, persistedMessageToChatMessage } from './types';
import type { ToolChatSession } from './types';

interface UseToolChatSessionsResult {
  sessions: ToolChatSession[];
  activeSession: ToolChatSession | null;
  activeMessages: ChatMessage[];
  loadingSessions: boolean;
  loadingMessages: boolean;
  sessionsError: string | null;
  messagesError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshSessions: () => Promise<void>;
  createNewSession: () => Promise<ToolChatSession>;
  openSession: (sessionId: string) => Promise<ChatMessage[]>;
  persistMessage: (message: ChatMessage) => Promise<void>;
  patchActiveSessionMetadata: (metadata: Record<string, unknown>) => Promise<void>;
  clearActiveSession: () => void;
}

export function useToolChatSessions(toolSlug: string): UseToolChatSessionsResult {
  const [sessions, setSessions] = useState<ToolChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ToolChatSession | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const response = await toolChatSessionService.listSessions({
        toolSlug,
        q: searchQuery,
        page: 1,
        perPage: 30,
      });
      setSessions(response.items);
    } catch {
      setSessionsError('Nao consegui carregar as conversas');
    } finally {
      setLoadingSessions(false);
    }
  }, [searchQuery, toolSlug]);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  const createNewSession = useCallback(async () => {
    const created = await toolChatSessionService.createSession({ toolSlug });
    setActiveSession(created);
    setActiveMessages([]);
    setSessions((current) => [created, ...current.filter((session) => session.id !== created.id)]);
    return created;
  }, [toolSlug]);

  const openSession = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    setMessagesError(null);
    try {
      const [session, messages] = await Promise.all([
        toolChatSessionService.getSession(sessionId),
        toolChatSessionService.listMessages(sessionId),
      ]);
      const chatMessages = messages.map(persistedMessageToChatMessage);
      setActiveSession(session);
      setActiveMessages(chatMessages);
      setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      return chatMessages;
    } catch {
      setMessagesError('Nao consegui carregar essa conversa');
      return [];
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const persistMessage = useCallback(
    async (message: ChatMessage) => {
      if (!activeSession) {
        throw new Error('Cannot persist a message without an active session');
      }
      await toolChatSessionService.createMessage(
        activeSession.id,
        chatMessageToPersistedInput(message),
      );
      await refreshSessions();
    },
    [activeSession, refreshSessions],
  );

  const patchActiveSessionMetadata = useCallback(
    async (metadata: Record<string, unknown>) => {
      if (!activeSession) {
        return;
      }
      const updated = await toolChatSessionService.patchSession(activeSession.id, { metadata });
      setActiveSession(updated);
      setSessions((current) => [updated, ...current.filter((session) => session.id !== updated.id)]);
    },
    [activeSession],
  );

  const clearActiveSession = useCallback(() => {
    setActiveSession(null);
    setActiveMessages([]);
    setMessagesError(null);
  }, []);

  return useMemo(
    () => ({
      sessions,
      activeSession,
      activeMessages,
      loadingSessions,
      loadingMessages,
      sessionsError,
      messagesError,
      searchQuery,
      setSearchQuery,
      refreshSessions,
      createNewSession,
      openSession,
      persistMessage,
      patchActiveSessionMetadata,
      clearActiveSession,
    }),
    [
      activeMessages,
      activeSession,
      clearActiveSession,
      createNewSession,
      loadingMessages,
      loadingSessions,
      messagesError,
      openSession,
      patchActiveSessionMetadata,
      persistMessage,
      refreshSessions,
      searchQuery,
      sessions,
      sessionsError,
    ],
  );
}
```

- [ ] **Step 4: Run hook tests**

```powershell
npm run test -- src/agents/chat-sessions/__tests__/useToolChatSessions.test.tsx
```

Expected: pass.

- [ ] **Step 5: Commit hook**

```powershell
git add src/agents/chat-sessions/useToolChatSessions.ts src/agents/chat-sessions/__tests__/useToolChatSessions.test.tsx
git commit -m "feat: manage tool chat sessions in frontend"
```

---

### Task 6: Frontend Sidebar And Shell UI

**Files:**
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatSearchInput.tsx`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatSessionItem.tsx`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatSessionList.tsx`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatSidebar.tsx`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/ToolChatShell.tsx`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat-sessions/__tests__/ToolChatSidebar.test.tsx`

- [ ] **Step 1: Write sidebar tests**

Create `src/agents/chat-sessions/__tests__/ToolChatSidebar.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ToolChatSidebar } from '../ToolChatSidebar';

const baseProps = {
  sessions: [
    {
      id: 's1',
      userId: 'u1',
      toolSlug: 'proposta-comercial-smart',
      title: 'Proposta Aurora',
      metadata: {},
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T10:00:00Z',
    },
  ],
  activeSessionId: 's1',
  searchQuery: '',
  loading: false,
  error: null,
  onSearchChange: vi.fn(),
  onNewChat: vi.fn(),
  onOpenSession: vi.fn(),
};

describe('ToolChatSidebar', () => {
  it('renderiza novo chat, busca e recentes', () => {
    render(<ToolChatSidebar {...baseProps} />);

    expect(screen.getByRole('button', { name: /novo chat/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar conversas/i)).toBeInTheDocument();
    expect(screen.getByText('Recentes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proposta aurora/i })).toBeInTheDocument();
  });

  it('aciona callbacks de novo chat e abrir sessao', () => {
    const onNewChat = vi.fn();
    const onOpenSession = vi.fn();

    render(
      <ToolChatSidebar
        {...baseProps}
        onNewChat={onNewChat}
        onOpenSession={onOpenSession}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /novo chat/i }));
    fireEvent.click(screen.getByRole('button', { name: /proposta aurora/i }));

    expect(onNewChat).toHaveBeenCalledTimes(1);
    expect(onOpenSession).toHaveBeenCalledWith('s1');
  });

  it('mostra estado vazio', () => {
    render(<ToolChatSidebar {...baseProps} sessions={[]} />);

    expect(screen.getByText('Nenhuma conversa ainda')).toBeInTheDocument();
  });

  it('mostra estado de busca sem resultado', () => {
    render(<ToolChatSidebar {...baseProps} sessions={[]} searchQuery="aurora" />);

    expect(screen.getByText('Nenhuma conversa encontrada')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run sidebar tests and verify they fail**

```powershell
npm run test -- src/agents/chat-sessions/__tests__/ToolChatSidebar.test.tsx
```

Expected: fail because UI components do not exist.

- [ ] **Step 3: Implement search input**

Create `src/agents/chat-sessions/ToolChatSearchInput.tsx`:

```tsx
import { Search } from 'lucide-react';

interface ToolChatSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ToolChatSearchInput({ value, onChange }: ToolChatSearchInputProps) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar conversas"
        className="h-10 w-full rounded-md border border-border/40 bg-background/70 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
```

- [ ] **Step 4: Implement session item**

Create `src/agents/chat-sessions/ToolChatSessionItem.tsx`:

```tsx
import { MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ToolChatSession } from './types';

interface ToolChatSessionItemProps {
  session: ToolChatSession;
  active: boolean;
  onOpen: (sessionId: string) => void;
}

export function ToolChatSessionItem({ session, active, onOpen }: ToolChatSessionItemProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(session.id)}
      className={cn(
        'flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition',
        active
          ? 'bg-primary/10 text-foreground ring-1 ring-primary/30'
          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{session.title || 'Novo chat'}</span>
    </button>
  );
}
```

- [ ] **Step 5: Implement session list**

Create `src/agents/chat-sessions/ToolChatSessionList.tsx`:

```tsx
import { Clock } from 'lucide-react';

import type { ToolChatSession } from './types';
import { ToolChatSessionItem } from './ToolChatSessionItem';

interface ToolChatSessionListProps {
  sessions: ToolChatSession[];
  activeSessionId?: string | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onOpenSession: (sessionId: string) => void;
}

export function ToolChatSessionList({
  sessions,
  activeSessionId,
  loading,
  error,
  searchQuery,
  onOpenSession,
}: ToolChatSessionListProps) {
  if (loading) {
    return (
      <div className="space-y-2" aria-label="Carregando conversas">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-muted/30" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="rounded-md border border-border/40 p-3 text-sm text-muted-foreground">{error}</p>;
  }

  if (sessions.length === 0) {
    return (
      <p className="rounded-md border border-border/40 p-3 text-sm text-muted-foreground">
        {searchQuery.trim() ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Recentes
      </div>
      <div className="space-y-1">
        {sessions.map((session) => (
          <ToolChatSessionItem
            key={session.id}
            session={session}
            active={session.id === activeSessionId}
            onOpen={onOpenSession}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Implement sidebar**

Create `src/agents/chat-sessions/ToolChatSidebar.tsx`:

```tsx
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ToolChatSession } from './types';
import { ToolChatSearchInput } from './ToolChatSearchInput';
import { ToolChatSessionList } from './ToolChatSessionList';

interface ToolChatSidebarProps {
  sessions: ToolChatSession[];
  activeSessionId?: string | null;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onOpenSession: (sessionId: string) => void;
}

export function ToolChatSidebar({
  sessions,
  activeSessionId,
  searchQuery,
  loading,
  error,
  onSearchChange,
  onNewChat,
  onOpenSession,
}: ToolChatSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border/30 bg-sidebar/80 p-4">
      <Button
        type="button"
        onClick={onNewChat}
        className="h-10 w-full justify-start gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Novo chat
      </Button>

      <div className="mt-4">
        <ToolChatSearchInput value={searchQuery} onChange={onSearchChange} />
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        <ToolChatSessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          onOpenSession={onOpenSession}
        />
      </div>
    </aside>
  );
}
```

- [ ] **Step 7: Implement responsive shell**

Create `src/agents/chat-sessions/ToolChatShell.tsx`:

```tsx
import { PanelLeft } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { ToolChatSession } from './types';
import { ToolChatSidebar } from './ToolChatSidebar';

interface ToolChatShellProps {
  sessions: ToolChatSession[];
  activeSessionId?: string | null;
  searchQuery: string;
  loadingSessions: boolean;
  sessionsError: string | null;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onOpenSession: (sessionId: string) => void;
  children: ReactNode;
}

export function ToolChatShell({
  sessions,
  activeSessionId,
  searchQuery,
  loadingSessions,
  sessionsError,
  onSearchChange,
  onNewChat,
  onOpenSession,
  children,
}: ToolChatShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <ToolChatSidebar
      sessions={sessions}
      activeSessionId={activeSessionId}
      searchQuery={searchQuery}
      loading={loadingSessions}
      error={sessionsError}
      onSearchChange={onSearchChange}
      onNewChat={() => {
        onNewChat();
        setMobileOpen(false);
      }}
      onOpenSession={(sessionId) => {
        onOpenSession(sessionId);
        setMobileOpen(false);
      }}
    />
  );

  return (
    <div className="grid h-full min-h-0 bg-background md:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden min-h-0 md:block">{sidebar}</div>
      <div className="relative min-h-0">
        <div className="absolute left-4 top-4 z-20 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Abrir historico">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-border/30 bg-sidebar p-0">
              {sidebar}
            </SheetContent>
          </Sheet>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Run sidebar tests**

```powershell
npm run test -- src/agents/chat-sessions/__tests__/ToolChatSidebar.test.tsx
```

Expected: pass.

- [ ] **Step 9: Commit UI**

```powershell
git add src/agents/chat-sessions/ToolChatSearchInput.tsx src/agents/chat-sessions/ToolChatSessionItem.tsx src/agents/chat-sessions/ToolChatSessionList.tsx src/agents/chat-sessions/ToolChatSidebar.tsx src/agents/chat-sessions/ToolChatShell.tsx src/agents/chat-sessions/__tests__/ToolChatSidebar.test.tsx
git commit -m "feat: add tool chat history sidebar"
```

---

### Task 7: Agent Chat Persistence Hooks

**Files:**
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/caloni/adapter.ts`
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat/useAgentChat.ts`
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/agents/chat/__tests__/useAgentChat.test.tsx`

- [ ] **Step 1: Add tests for history and persistence callbacks**

Modify the existing test named `send adiciona user message e dispara adapter` so the adapter assertion waits for the new persistence microtask and accepts `history`:

```tsx
  it('send adiciona user message e dispara adapter', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'resposta' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('oi', []);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('oi');

    await act(async () => {
      await Promise.resolve();
    });

    expect(adapter.send).toHaveBeenCalledWith(
      {
        text: 'oi',
        attachments: [],
        context: undefined,
        history: [expect.objectContaining({ role: 'user', content: 'oi' })],
      },
      expect.any(AbortSignal),
    );
  });
```

Then add these tests inside `describe('useAgentChat', () => { ... })`:

For existing tests that manually call `resolveAdapter?.(...)` right after `result.current.send(...)`, insert this flush before calling `resolveAdapter`:

```tsx
    await act(async () => {
      await Promise.resolve();
    });
```

Apply that flush to these existing tests:

- `no primeiro tick visivel, assistant recebe o primeiro chunk e isStreaming publico volta a true`;
- `bloqueia novo send durante a transicao do assistant vazio mesmo com isStreaming publico false`;
- `stop aborta o AbortController e marca mensagem do assistant como interrupted`.

```tsx
  it('passa historico completo para o adapter incluindo a mensagem nova', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'ok' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.replaceMessages([
        { id: 'm0', role: 'assistant', content: 'Oi', createdAt: 1 },
      ]);
    });

    act(() => {
      result.current.send('nova', []);
    });

    expect(adapter.send).toHaveBeenCalledWith(
      expect.objectContaining({
        history: [
          { id: 'm0', role: 'assistant', content: 'Oi', createdAt: 1 },
          expect.objectContaining({ role: 'user', content: 'nova' }),
        ],
      }),
      expect.any(AbortSignal),
    );
  });

  it('persiste mensagem do usuario antes de chamar o adapter', async () => {
    const calls: string[] = [];
    const adapter: AgentAdapter = {
      send: vi.fn().mockImplementation(async () => {
        calls.push('adapter');
        return { text: 'ok' };
      }),
    };
    const onUserMessage = vi.fn().mockImplementation(async () => {
      calls.push('persist-user');
    });
    const { result } = renderHook(() =>
      useAgentChat(makeConfig(adapter), { onUserMessage }),
    );

    act(() => {
      result.current.send('oi', []);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });

    expect(calls).toEqual(['persist-user', 'adapter']);
  });

  it('persiste assistant com texto final e payload antes do streaming visual', async () => {
    const payload = { kind: 'proposal_draft_patch' };
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'resposta final', payload }),
    };
    const onAssistantMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAgentChat(makeConfig(adapter), { onAssistantMessage }),
    );

    act(() => {
      result.current.send('oi', []);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });

    expect(onAssistantMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'resposta final',
        payload,
      }),
    );
    expect(String(result.current.messages.find((m) => m.role === 'assistant')?.content)).toBe('');
  });
```

- [ ] **Step 2: Run hook tests and verify new tests fail**

```powershell
npm run test -- src/agents/chat/__tests__/useAgentChat.test.tsx
```

Expected: fail because `replaceMessages`, `history`, and callbacks do not exist.

- [ ] **Step 3: Extend adapter input**

Modify `src/agents/caloni/adapter.ts`.

Add import:

```ts
import type { ChatMessage } from '@/agents/chat';
```

Change `AgentInput` to:

```ts
export interface AgentInput {
  text: string;
  attachments: Attachment[];
  context?: AgentContext;
  history?: ChatMessage[];
}
```

- [ ] **Step 4: Extend useAgentChat result and options**

Modify `src/agents/chat/useAgentChat.ts`.

Add this interface near `UseAgentChatResult`:

```ts
export interface UseAgentChatOptions {
  onUserMessage?: (message: ChatMessage) => Promise<void> | void;
  onAssistantMessage?: (message: ChatMessage) => Promise<void> | void;
}
```

Change `UseAgentChatResult` to include:

```ts
  replaceMessages: (nextMessages: ChatMessage[]) => void;
```

Change the function signature:

```ts
export function useAgentChat(
  config: AgentConfig,
  options: UseAgentChatOptions = {},
): UseAgentChatResult {
```

Immediately inside the function, add:

```ts
  const { onUserMessage, onAssistantMessage } = options;
```

Add `replaceMessages` after `reset`:

```ts
  const replaceMessages = useCallback(
    (nextMessages: ChatMessage[]) => {
      clearStreamingFrame();
      abortInFlight();
      runIdRef.current += 1;
      isStreamingRef.current = false;
      assistantIdRef.current = null;
      updateMessages((prev) => {
        revokeMessagePreviews(prev);
        return nextMessages;
      });
      setIsStreaming(false);
    },
    [abortInFlight, clearStreamingFrame, updateMessages],
  );
```

- [ ] **Step 5: Sequence persistence before the adapter**

In `send`, after creating `userMessage`, compute history:

```ts
      const nextHistory = [...messagesRef.current, userMessage];
```

Replace:

```ts
      updateMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
```

with:

```ts
      updateMessages(nextHistory);
      setIsStreaming(true);
```

Replace the direct adapter call block:

```ts
      void config.adapter.send({ text, attachments, context }, controller.signal).then(
```

with:

```ts
      void Promise.resolve(onUserMessage?.(userMessage))
        .then(() =>
          config.adapter.send({ text, attachments, context, history: nextHistory }, controller.signal),
        )
        .then(
```

Keep the success handler body the same. Keep the error handler body the same. Close the added `.then(` call so TypeScript sees one promise chain.

- [ ] **Step 6: Persist assistant with final content**

Inside the success branch where `assistantMessage` is created, change the object to keep the visual streaming empty:

```ts
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          ...(settledResponse.payload !== undefined ? { payload: settledResponse.payload } : {}),
          createdAt: Date.now(),
        };
        const persistedAssistantMessage: ChatMessage = {
          ...assistantMessage,
          content: settledResponse.text,
        };
```

Before `assistantIdRef.current = assistantId;`, add:

```ts
        void Promise.resolve(onAssistantMessage?.(persistedAssistantMessage));
```

- [ ] **Step 7: Return replaceMessages**

Update the `send` callback dependency list so it includes the callback references:

```ts
    [abortInFlight, clearStreamingFrame, config, onAssistantMessage, onUserMessage, updateMessages],
```

At the end of `useAgentChat`, change:

```ts
  return { messages, isStreaming, send, stop, reset };
```

to:

```ts
  return { messages, isStreaming, send, stop, reset, replaceMessages };
```

- [ ] **Step 8: Run hook tests**

```powershell
npm run test -- src/agents/chat/__tests__/useAgentChat.test.tsx
```

Expected: pass.

- [ ] **Step 9: Commit chat hook changes**

```powershell
git add src/agents/caloni/adapter.ts src/agents/chat/useAgentChat.ts src/agents/chat/__tests__/useAgentChat.test.tsx
git commit -m "feat: persist agent chat messages"
```

---

### Task 8: Integrate Sessions Into Caloni Propostas

**Files:**
- Modify: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/pages/ChatToolPage.tsx`
- Create: `C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration/src/pages/__tests__/ChatToolPage.sessions.test.tsx`

- [ ] **Step 1: Write integration tests**

Create `src/pages/__tests__/ChatToolPage.sessions.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChatToolPage from '../ChatToolPage';
import { toolChatSessionService } from '@/agents/chat-sessions';

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' }, authToken: 'token' }),
}));

vi.mock('@/agents/chat-sessions', async () => {
  const actual = await vi.importActual<typeof import('@/agents/chat-sessions')>(
    '@/agents/chat-sessions',
  );
  return {
    ...actual,
    toolChatSessionService: {
      listSessions: vi.fn(),
      createSession: vi.fn(),
      getSession: vi.fn(),
      listMessages: vi.fn(),
      createMessage: vi.fn(),
      patchSession: vi.fn(),
    },
  };
});

vi.mock('@/agents/proposal', async () => {
  const actual = await vi.importActual<typeof import('@/agents/proposal')>('@/agents/proposal');
  return {
    ...actual,
    createProposalChatAdapter: () => ({
      send: vi.fn().mockResolvedValue({
        reply: 'Agora tenho o esqueleto. Quer editar ou confirmar?',
        toolResult: {
          kind: 'proposal_draft_patch',
          patch: {
            title: 'Proposta Aurora',
            clientName: 'Maria Aurora',
            clientCompany: 'Clinica Aurora',
            clientEmail: 'maria@aurora.local',
            clientPhone: '11999999999',
            projectDescription: 'Auditoria comercial e plano de acao.',
            scope: 'Diagnostico, plano e acompanhamento.',
            value: 'R$ 25.000',
            deadline: '90 dias',
          },
        },
      }),
    }),
  };
});

const service = vi.mocked(toolChatSessionService);

function renderPage(initialEntry = '/tools/proposta-comercial-smart/app/chat') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/tools/:slug/app/chat" element={<ChatToolPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChatToolPage sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.listSessions.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 30,
    });
    service.createSession.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      toolSlug: 'proposta-comercial-smart',
      title: 'Novo chat',
      metadata: {},
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T10:00:00Z',
    });
    service.createMessage.mockResolvedValue({
      id: 'm1',
      sessionId: 's1',
      role: 'user',
      content: 'x',
      createdAt: '2026-05-25T10:01:00Z',
    });
  });

  it('renderiza sidebar de conversas na ferramenta atual', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: /novo chat/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar conversas/i)).toBeInTheDocument();
    expect(service.listSessions).toHaveBeenCalledWith({
      toolSlug: 'proposta-comercial-smart',
      q: '',
      page: 1,
      perPage: 30,
    });
  });

  it('cria sessao antes de enviar a primeira mensagem e persiste user e assistant', async () => {
    renderPage();

    const input = await screen.findByPlaceholderText(/digite uma mensagem/i);
    fireEvent.change(input, {
      target: {
        value:
          'Titulo: Proposta Aurora. Cliente: Maria Aurora, empresa Clinica Aurora. Descricao: Auditoria comercial.',
      },
    });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(service.createSession).toHaveBeenCalledWith({
      toolSlug: 'proposta-comercial-smart',
    }));
    await waitFor(() => expect(service.createMessage).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ role: 'user' }),
    ));
    await waitFor(() => expect(service.createMessage).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({
        role: 'assistant',
        content: 'Agora tenho o esqueleto. Quer editar ou confirmar?',
        payload: expect.objectContaining({ kind: 'proposal_draft_patch' }),
      }),
    ));
  });

  it('abre conversa existente e reidrata mensagens', async () => {
    service.listSessions.mockResolvedValueOnce({
      items: [
        {
          id: 's2',
          userId: 'u1',
          toolSlug: 'proposta-comercial-smart',
          title: 'Conversa Aurora',
          metadata: {},
          createdAt: '2026-05-25T10:00:00Z',
          updatedAt: '2026-05-25T10:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      perPage: 30,
    });
    service.getSession.mockResolvedValueOnce({
      id: 's2',
      userId: 'u1',
      toolSlug: 'proposta-comercial-smart',
      title: 'Conversa Aurora',
      metadata: {},
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T10:00:00Z',
    });
    service.listMessages.mockResolvedValueOnce([
      {
        id: 'm10',
        sessionId: 's2',
        role: 'user',
        content: 'Mensagem antiga',
        createdAt: '2026-05-25T10:01:00Z',
      },
    ]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /conversa aurora/i }));

    expect(await screen.findByText('Mensagem antiga')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run integration tests and verify they fail**

```powershell
npm run test -- src/pages/__tests__/ChatToolPage.sessions.test.tsx
```

Expected: fail because `ChatToolPage` does not render `ToolChatShell` and does not persist messages.

- [ ] **Step 3: Import session utilities in ChatToolPage**

Modify `src/pages/ChatToolPage.tsx`.

Add imports:

```ts
import {
  ToolChatShell,
  chatMessageToPersistedInput,
  useToolChatSessions,
  type ToolChatSession,
} from '@/agents/chat-sessions';
```

Also import `useLocation` if needed to preserve existing query params:

```ts
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
```

- [ ] **Step 4: Add helper functions for session URL and proposal draft replay**

Add below `toPersistedProposalPatch`:

```ts
function getSessionSearchId(searchParams: URLSearchParams): string | null {
  return searchParams.get('sessionId');
}

function setSessionSearchId(searchParams: URLSearchParams, sessionId: string): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.set('sessionId', sessionId);
  return next;
}

function extractDraftFromMessages(messages: ChatMessage[]): ProposalDraft | null {
  let draft: ProposalDraft | null = null;

  for (const message of messages) {
    if (
      isProposalToolResult(message.payload) &&
      message.payload.kind === 'proposal_draft_patch'
    ) {
      draft = { ...(draft ?? {}), ...message.payload.patch };
    }
  }

  return draft;
}

function messageToAssistantInput(message: ChatMessage) {
  return {
    role: message.role,
    content: typeof message.content === 'string' ? message.content : String(message.content ?? ''),
    attachments: [],
  };
}
```

- [ ] **Step 5: Wire hook and refs inside ConfiguredChatToolPage**

In `ChatToolPage`, pass the route slug into the configured component:

```tsx
  return <ConfiguredChatToolPage key={config.id} config={config} toolSlug={slug} />;
```

Change the configured component signature:

```tsx
function ConfiguredChatToolPage({ config, toolSlug }: { config: AgentConfig; toolSlug: string }) {
```

Inside `ConfiguredChatToolPage`, after `const authToken = getAuthToken(auth);`, add:

```ts
  const location = useLocation();
  const sessionIdFromUrl = getSessionSearchId(searchParams);
  const sessions = useToolChatSessions(toolSlug);
  const activeSessionIdRef = useRef<string | null>(sessionIdFromUrl);
```

Keep `activeSessionIdRef.current` synchronized:

```ts
  useEffect(() => {
    activeSessionIdRef.current = sessions.activeSession?.id ?? sessionIdFromUrl;
  }, [sessionIdFromUrl, sessions.activeSession?.id]);
```

- [ ] **Step 6: Pass full conversation history to proposal assistant**

Inside the proposal `adapter.send`, replace the one-message array passed to `proposalAdapter.send` with:

```ts
        const historyMessages = input.history?.length
          ? input.history.map(messageToAssistantInput)
          : [
              {
                role: 'user' as const,
                content: input.text,
                attachments: input.attachments.map((attachment) => {
                  const textContent = isRecord(attachment.file)
                    ? getOptionalString(attachment.file.textContent)
                    : undefined;

                  return {
                    filename: attachment.name,
                    mime_type: attachment.file.type || 'application/octet-stream',
                    size_bytes: attachment.sizeBytes,
                    text_content: textContent,
                  };
                }),
              },
            ];

        const result = await proposalAdapter.send(
          historyMessages.slice(-20),
          signal,
          input.context?.proposalId ?? null,
        );
```

Remove the old `const result = await proposalAdapter.send([ ...single user message... ])` block.

- [ ] **Step 7: Persist chat messages from useAgentChat**

Change:

```ts
  const { messages, isStreaming, send, stop } = useAgentChat(runtimeConfig);
```

to:

```ts
  const { messages, isStreaming, send, stop, reset, replaceMessages } = useAgentChat(
    runtimeConfig,
    {
      onUserMessage: async (message) => {
        const sessionId = activeSessionIdRef.current;
        if (!sessionId) {
          throw new Error('Missing active session');
        }
        await toolChatSessionService.createMessage(sessionId, chatMessageToPersistedInput(message));
        await sessions.refreshSessions();
      },
      onAssistantMessage: async (message) => {
        const sessionId = activeSessionIdRef.current;
        if (!sessionId) {
          return;
        }
        await toolChatSessionService.createMessage(sessionId, chatMessageToPersistedInput(message));
        await sessions.refreshSessions();
      },
    },
  );
```

Add `toolChatSessionService` to the import from `@/agents/chat-sessions`.

- [ ] **Step 8: Add session open and new chat handlers**

Add these callbacks before `handlePick`:

```ts
  const applySessionMessages = useCallback(
    (nextMessages: ChatMessage[]) => {
      processedAssistantMessageIds.current.clear();
      replaceMessages(nextMessages);

      if (isProposalAgent) {
        resetProposalDraft();
        const restoredDraft = extractDraftFromMessages(nextMessages);
        if (restoredDraft) {
          patchProposalDraft(restoredDraft);
        }
      }
    },
    [isProposalAgent, patchProposalDraft, replaceMessages, resetProposalDraft],
  );

  const handleOpenSession = useCallback(
    async (sessionId: string) => {
      const loadedMessages = await sessions.openSession(sessionId);
      activeSessionIdRef.current = sessionId;
      applySessionMessages(loadedMessages);
      navigate({
        pathname: location.pathname,
        search: setSessionSearchId(searchParams, sessionId).toString(),
      });
    },
    [applySessionMessages, location.pathname, navigate, searchParams, sessions],
  );

  const handleNewChat = useCallback(async () => {
    const created = await sessions.createNewSession();
    activeSessionIdRef.current = created.id;
    reset();
    processedAssistantMessageIds.current.clear();
    if (isProposalAgent) {
      resetProposalDraft();
    }
    navigate({
      pathname: location.pathname,
      search: setSessionSearchId(searchParams, created.id).toString(),
    });
  }, [isProposalAgent, location.pathname, navigate, reset, resetProposalDraft, searchParams, sessions]);
```

- [ ] **Step 9: Open session from URL**

Add this effect before deep-link effects:

```ts
  useEffect(() => {
    if (!sessionIdFromUrl || sessions.activeSession?.id === sessionIdFromUrl) {
      return;
    }

    void handleOpenSession(sessionIdFromUrl);
  }, [handleOpenSession, sessionIdFromUrl, sessions.activeSession?.id]);
```

- [ ] **Step 10: Ensure a session exists before sending**

Replace `handleSend` with:

```ts
  const ensureActiveSession = useCallback(async (): Promise<ToolChatSession> => {
    if (sessions.activeSession) {
      activeSessionIdRef.current = sessions.activeSession.id;
      return sessions.activeSession;
    }

    const created = await sessions.createNewSession();
    activeSessionIdRef.current = created.id;
    navigate({
      pathname: location.pathname,
      search: setSessionSearchId(searchParams, created.id).toString(),
    });
    return created;
  }, [location.pathname, navigate, searchParams, sessions]);

  const handleSend = useCallback(
    (text: string, attachments: Parameters<typeof send>[1]) => {
      void ensureActiveSession().then(() => {
        if (isProposalAgent && isNewProposalRequest(text)) {
          resetProposalDraft();
        }

        send(text, attachments);
      });
    },
    [ensureActiveSession, isProposalAgent, resetProposalDraft, send],
  );
```

- [ ] **Step 11: Patch metadata when proposals are saved or opened**

In `handleSaveProposal`, after `const savedProposal = await proposalService.create(...)`, add:

```ts
        await sessions.patchActiveSessionMetadata({ proposal_id: savedProposal.id });
```

In `handleApplyProposalPatch`, after `if (updatedProposal) {`, add:

```ts
          await sessions.patchActiveSessionMetadata({ proposal_id: updatedProposal.id });
```

In the `proposal_open_existing` case inside the assistant payload effect, before `navigate(...)`, add:

```ts
          void sessions.patchActiveSessionMetadata({ proposal_id: message.payload.proposal_id });
```

- [ ] **Step 12: Wrap ChatLayout with ToolChatShell**

Replace the final `return (` root with:

```tsx
  return (
    <ToolChatShell
      sessions={sessions.sessions}
      activeSessionId={sessions.activeSession?.id ?? sessionIdFromUrl}
      searchQuery={sessions.searchQuery}
      loadingSessions={sessions.loadingSessions}
      sessionsError={sessions.sessionsError}
      onSearchChange={sessions.setSearchQuery}
      onNewChat={() => void handleNewChat()}
      onOpenSession={(sessionId) => void handleOpenSession(sessionId)}
    >
      <ChatLayout
        mode="pure"
        className="h-[calc(100dvh-9.5rem)] bg-background md:h-[calc(100dvh-4.5rem)]"
        innerClassName="max-w-[1120px]"
      >
```

Then close `</ToolChatShell>` after `</ChatLayout>`.

- [ ] **Step 13: Run integration tests**

```powershell
npm run test -- src/pages/__tests__/ChatToolPage.sessions.test.tsx
```

Expected: pass.

- [ ] **Step 14: Run focused frontend tests**

```powershell
npm run test -- src/agents/chat-sessions src/agents/chat/__tests__/useAgentChat.test.tsx src/pages/__tests__/ChatToolPage.sessions.test.tsx
```

Expected: pass.

- [ ] **Step 15: Commit integration**

```powershell
git add src/pages/ChatToolPage.tsx src/pages/__tests__/ChatToolPage.sessions.test.tsx
git commit -m "feat: add chat history to caloni propostas"
```

---

### Task 9: Verification And Manual Smoke Test

**Files:**
- No code files unless verification exposes a defect.

- [ ] **Step 1: Run backend test suite slice**

Run with Docker/Postgres available:

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api
pytest tests/test_tool_chat.py tests/test_proposal_assistant_endpoint.py tests/test_proposal_assistant_dispatch.py tests/test_migrations.py -q
```

Expected: pass.

- [ ] **Step 2: Run backend app import**

```powershell
python -m uvicorn app.main:app --reload
```

Expected:

```text
Uvicorn running on http://127.0.0.1:8000
```

Stop the server with `CTRL+C` after import succeeds.

- [ ] **Step 3: Run frontend tests and build**

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration
npm run test -- src/agents/chat-sessions src/agents/chat/__tests__/useAgentChat.test.tsx src/pages/__tests__/ChatToolPage.sessions.test.tsx
npm run build
```

Expected: tests pass and build completes.

- [ ] **Step 4: Manual browser smoke**

Start backend:

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api
python -m uvicorn app.main:app --reload
```

Start frontend:

```powershell
cd C:/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration
npm run dev
```

Open:

```text
http://localhost:8080/tools/proposta-comercial-smart/app/chat
```

Smoke checklist:

- Sidebar appears on desktop with Novo chat, Buscar conversas, and Recentes.
- Clicking Novo chat clears messages and proposal draft.
- Sending the first message creates a `sessionId` in the URL.
- Reloading the page with `sessionId` restores the messages.
- Search finds the session by title.
- Assistant payload cards reopen without calling the AI again.
- User can continue the chat after reload and the backend receives full conversation history.

- [ ] **Step 5: Commit verification fix if needed**

If verification required a code fix, return to the task that introduced the broken behavior, apply the fix in the files named by that task, rerun that task's verification command, and use that task's exact `git add` command. Then run the full verification commands in this task again.

```powershell
git status --short
```

Expected: no untracked verification artifacts. If no code fix was needed, do not create a verification-only commit.

---

## Acceptance Criteria Mapping

- Sidebar shows only the current tool conversations: Task 3 filters backend by `tool_slug`; Task 5 uses `toolSlug`; Task 8 passes the route `toolSlug`.
- New chat works: Task 5 creates sessions; Task 8 wires `handleNewChat`.
- Recent chat opens: Task 5 loads session/messages; Task 8 hydrates the chat.
- Search works: Task 3 searches title; Task 6 renders search; Task 5 refreshes on query.
- User and assistant messages persist: Task 3 message endpoint; Task 7 callbacks; Task 8 session integration.
- Payloads persist and render cards: Task 3 JSONB payload; Task 4 serializers; Task 8 rehydrates messages.
- New chat resets proposal state: Task 8 calls `resetProposalDraft`.
- Users cannot see other users sessions: Task 1 test; Task 3 ownership filter.
- Desktop and mobile UI work: Task 6 uses fixed desktop sidebar and mobile Sheet.
- Core is not proposal-specific: Task 3 backend is generic; Task 4-6 frontend session core is generic; proposal logic stays in Task 8.

## Self-Review

- Spec coverage: all MVP backend endpoints, desktop/mobile sidebar, New Chat, open session, search, message persistence, payload persistence, and Caloni Propostas draft reset are covered.
- Scope correction: integration is intentionally limited to Caloni Propostas because the current request said to plan only the current tool.
- Placeholder scan: this plan contains no `TBD`, no `TODO`, and no undefined "implement the rest" steps.
- Type consistency: backend uses `metadata` in schemas and `extra_metadata` in SQLAlchemy to avoid the reserved declarative `metadata` attribute; frontend uses camelCase because `apiClient` converts API keys.
- Risk to watch during implementation: `PromptInputBox` event behavior in the integration test may need the existing component's actual submit gesture. If the Enter key path differs, update the test to click the component's submit button while preserving the same assertion: session is created before user and assistant messages are persisted.
