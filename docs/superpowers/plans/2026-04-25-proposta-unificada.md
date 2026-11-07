# Proposta Comercial Unificada — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir as ferramentas separadas de **Validação Caloni** e **Proposta Comercial** por uma superfície de chat única (`/tools/proposta-comercial-smart/app/chat`) que orquestra criação, edição e validação via tool-calling do LLM, mantendo validação determinística via serviço Python.

**Architecture:**
- **Backend (`feature/ai-proposal-assistant` em `main`, repo `seven_tools_api`):** novo endpoint `POST /ai/proposal-assistant` que monta system prompts (knowledge curado + rules + turn context), chama provider com `tools` declaradas e despacha `tool_calls` para handlers Python. Validação reusa `validate_proposal_service` (refator de `validate_proposal`).
- **Frontend (`codex/chat-tool-integration` em `seven_tools_front`):** novo `proposalAgentConfig` no `AgentRegistry`, hooks `useProposalDraft` (localStorage) e `useProposalChatAdapter`, 4 result cards (Draft preview, Save confirm, Update, Validation report — este último reusa `CaloniResultCard`).
- **Limpeza:** deleção integral de `ProposalForm.tsx`, `src/pages/tools/ValidacaoCaloni/`, rotas legadas e endpoints HTTP `/ai/validate-proposal*`.

**Tech Stack:** FastAPI + Pydantic v2 + httpx + pdfplumber + PostgreSQL (testes via Docker, NUNCA SQLite); React 18 + TypeScript + Vite + Vitest + RTL + Tailwind + shadcn/ui; OpenAI/Groq compatible API via `AI_BASE_URL`/`AI_MODEL`/`AI_API_KEY`.

**Spec de referência:** `docs/superpowers/specs/2026-04-25-proposta-unificada-design.md`.

---

## Pré-condições

- [ ] **PR-0: Verificar branches**

```bash
cd /c/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration
git branch --show-current
# Esperado: codex/chat-tool-integration

cd /c/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api
git status
git checkout main && git pull --rebase
git checkout -b feature/ai-proposal-assistant
```

- [ ] **PR-1: Verificar Docker Postgres está rodando** (testes backend dependem disso)

```bash
cd /c/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api
docker compose ps
# Se não estiver up: docker compose up -d
```

---

# Fase 2A — Backend

> Tudo nesta seção: `cd /c/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_api` e branch `feature/ai-proposal-assistant`.

## Task 1: Refatorar `knowledge.py` para suportar profiles

**Files:**
- Modify: `seven_tools_api/app/modules/ai/knowledge.py`
- Test: `seven_tools_api/tests/test_proposal_assistant_knowledge.py` (novo)

- [ ] **Step 1: Escrever teste falhando**

`tests/test_proposal_assistant_knowledge.py`:
```python
import pytest

from app.modules.ai.knowledge import (
    PROFILES,
    load_caloni_knowledge,
)


def test_load_full_profile_returns_concatenated_files():
    full = load_caloni_knowledge("full")
    assert len(full) > 50_000  # corpus inteiro tem ~96KB
    assert "## CÓDIGO DAS OBJEÇÕES" in full or "OBJEÇÕES" in full


def test_load_proposal_assistant_profile_filters_by_prefix():
    body = load_caloni_knowledge("proposal_assistant")
    expected_prefixes = PROFILES["proposal_assistant"]
    assert expected_prefixes is not None
    assert len(body) > 10_000  # ~50KB de subset
    # Deve ser menor que full
    full = load_caloni_knowledge("full")
    assert len(body) < len(full)


def test_unknown_profile_raises_value_error():
    with pytest.raises(ValueError, match="unknown profile"):
        load_caloni_knowledge("nonexistent")


def test_lru_cache_returns_identical_string():
    first = load_caloni_knowledge("proposal_assistant")
    second = load_caloni_knowledge("proposal_assistant")
    assert first is second  # cache hit, mesma referência
```

- [ ] **Step 2: Rodar teste, verificar falha**

```bash
pytest tests/test_proposal_assistant_knowledge.py -v
```
Esperado: `ImportError` ou `AttributeError` em `PROFILES`.

- [ ] **Step 3: Implementar refator em `knowledge.py`**

Substituir conteúdo por:
```python
from functools import lru_cache
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).parent.parent.parent.parent / "knowledge" / "caloni"

PROFILES: dict[str, list[str] | None] = {
    "full": None,
    "proposal_assistant": ["00", "10", "11", "21", "22", "30", "32", "33", "41"],
    "diagnostic": ["00", "10", "11", "12", "13", "20", "21", "33", "40"],
}


@lru_cache(maxsize=16)
def load_caloni_knowledge(profile: str = "full") -> str:
    if profile not in PROFILES:
        raise ValueError(f"unknown profile: {profile}")
    prefixes = PROFILES[profile]
    md_files = sorted(KNOWLEDGE_DIR.glob("*.md"))
    if prefixes is not None:
        md_files = [f for f in md_files if any(f.name.startswith(p + "_") for p in prefixes)]
    if not md_files:
        raise FileNotFoundError(f"No knowledge files found for profile {profile}")
    return "\n\n---\n\n".join(f.read_text(encoding="utf-8") for f in md_files)
```

- [ ] **Step 4: Rodar teste, verificar passa**

```bash
pytest tests/test_proposal_assistant_knowledge.py -v
```
Esperado: 4 PASS.

- [ ] **Step 5: Verificar `service.py` ainda compila com import de `load_caloni_knowledge`**

```bash
pytest tests/test_ai.py -v
```
Esperado: testes de validação/diagnose ainda PASS (chamam `load_caloni_knowledge()` sem args = profile `full`).

- [ ] **Step 6: Commit**

```bash
git add app/modules/ai/knowledge.py tests/test_proposal_assistant_knowledge.py
git commit -m "feat(ai): adicionar profiles ao knowledge loader

PROFILES dict mapeia 'full', 'proposal_assistant' e 'diagnostic' para subsets
do corpus Caloni baseados em prefixos de filename. lru_cache(16) substitui o
maxsize=1 anterior.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 2: Criar `schemas.py` com Pydantic models

**Files:**
- Create: `seven_tools_api/app/modules/ai/schemas.py`
- Test: integrado nos testes seguintes (validação acontece via uso real)

- [ ] **Step 1: Criar schemas.py**

```python
from typing import Annotated, Any, Literal, Optional, Union

from pydantic import BaseModel, Field


class AttachmentRef(BaseModel):
    filename: str
    mime_type: str
    size_bytes: int
    url: Optional[str] = None
    text_content: Optional[str] = None


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    attachments: list[AttachmentRef] = Field(default_factory=list)


class ProposalDraftIn(BaseModel):
    title: Optional[str] = None
    clientName: Optional[str] = None
    clientCompany: Optional[str] = None
    clientEmail: Optional[str] = None
    clientPhone: Optional[str] = None
    projectDescription: Optional[str] = None
    scope: Optional[str] = None
    value: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None


class ProposalAssistantRequest(BaseModel):
    messages: list[ChatMessageIn]
    current_draft: Optional[ProposalDraftIn] = None
    current_proposal_id: Optional[str] = None
    last_saved_proposal_id: Optional[str] = None
    intent_hint: Optional[Literal["create", "validate", "edit"]] = None


class DraftPatchResult(BaseModel):
    kind: Literal["proposal_draft_patch"]
    patch: dict[str, Any]
    missing_required: list[str]


class ValidationReportResult(BaseModel):
    kind: Literal["proposal_validation_report"]
    report: dict[str, Any]  # ValidationReport schema, mantido genérico
    proposal_id: str


class SaveRequestResult(BaseModel):
    kind: Literal["proposal_save_request"]
    draft_summary: ProposalDraftIn


class UpdateRequestResult(BaseModel):
    kind: Literal["proposal_update_request"]
    proposal_id: str
    patch: dict[str, Any]


class OpenExistingResult(BaseModel):
    kind: Literal["proposal_open_existing"]
    proposal_id: str


ToolResult = Annotated[
    Union[
        DraftPatchResult,
        ValidationReportResult,
        SaveRequestResult,
        UpdateRequestResult,
        OpenExistingResult,
    ],
    Field(discriminator="kind"),
]


class ProposalAssistantResponse(BaseModel):
    reply: str
    tool_result: Optional[ToolResult] = None
```

- [ ] **Step 2: Smoke import**

```bash
python -c "from app.modules.ai.schemas import ProposalAssistantRequest, ProposalAssistantResponse, DraftPatchResult, ValidationReportResult, SaveRequestResult, UpdateRequestResult, OpenExistingResult; print('ok')"
```
Esperado: `ok`.

- [ ] **Step 3: Commit**

```bash
git add app/modules/ai/schemas.py
git commit -m "feat(ai): definir Pydantic schemas para proposal assistant

Discriminated union ToolResult cobre 5 kinds: proposal_draft_patch,
proposal_validation_report, proposal_save_request, proposal_update_request,
proposal_open_existing.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 3: Criar `tools.py` com schemas de function-calling

**Files:**
- Create: `seven_tools_api/app/modules/ai/tools.py`

- [ ] **Step 1: Criar tools.py**

```python
PROPOSAL_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "patch_draft",
            "description": (
                "Atualiza campos do draft de proposta em construção. "
                "Use quando coletar dado novo do usuário, antes da proposta ser salva."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "patch": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "clientName": {"type": "string"},
                            "clientCompany": {"type": "string"},
                            "clientEmail": {"type": "string"},
                            "clientPhone": {"type": "string"},
                            "projectDescription": {"type": "string"},
                            "scope": {"type": "string"},
                            "value": {"type": "string"},
                            "deadline": {"type": "string"},
                            "notes": {"type": "string"},
                        },
                    }
                },
                "required": ["patch"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_validation",
            "description": (
                "Pede análise determinística de uma proposta SALVA (precisa de proposal_id). "
                "Use quando o usuário pedir validação ou feedback sobre proposta existente."
            ),
            "parameters": {
                "type": "object",
                "properties": {"proposal_id": {"type": "string"}},
                "required": ["proposal_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_save",
            "description": (
                "Sinaliza que o draft está pronto e pede confirmação para persistir. "
                "Só use quando title, clientName e projectDescription estiverem preenchidos."
            ),
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_update",
            "description": (
                "Edita uma proposta JÁ SALVA. Use quando current_proposal_id estiver presente "
                "e o usuário pedir alteração de campo."
            ),
            "parameters": {
                "type": "object",
                "properties": {"patch": {"type": "object"}},
                "required": ["patch"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "open_existing",
            "description": "Carrega uma proposta existente pelo ID (frontend navega).",
            "parameters": {
                "type": "object",
                "properties": {"proposal_id": {"type": "string"}},
                "required": ["proposal_id"],
            },
        },
    },
]
```

- [ ] **Step 2: Commit**

```bash
git add app/modules/ai/tools.py
git commit -m "feat(ai): declarar PROPOSAL_TOOLS para function-calling

5 tools: patch_draft, request_validation, request_save, request_update,
open_existing. Schemas seguem o formato OpenAI/Groq compatível.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 4: Criar prompt template (`prompts/proposal_assistant.py`)

**Files:**
- Create: `seven_tools_api/app/modules/ai/prompts/__init__.py` (vazio)
- Create: `seven_tools_api/app/modules/ai/prompts/proposal_assistant.py`
- Test: `seven_tools_api/tests/test_proposal_assistant_prompts.py`

- [ ] **Step 1: Escrever testes falhando**

`tests/test_proposal_assistant_prompts.py`:
```python
from app.modules.ai.prompts.proposal_assistant import (
    ASSISTANT_RULES,
    build_turn_context,
)
from app.modules.ai.schemas import ProposalAssistantRequest, ProposalDraftIn


def test_assistant_rules_contains_core_directives():
    assert "patch_draft" in ASSISTANT_RULES
    assert "request_validation" in ASSISTANT_RULES
    assert "request_save" in ASSISTANT_RULES
    assert "request_update" in ASSISTANT_RULES
    assert "Caloni" in ASSISTANT_RULES


def test_build_turn_context_includes_draft_summary():
    req = ProposalAssistantRequest(
        messages=[],
        current_draft=ProposalDraftIn(title="Acme SEO", clientName="Acme"),
    )
    ctx = build_turn_context(req)
    assert "Acme SEO" in ctx
    assert "Acme" in ctx


def test_build_turn_context_signals_proposal_id_when_present():
    req = ProposalAssistantRequest(messages=[], current_proposal_id="prop_123")
    ctx = build_turn_context(req)
    assert "prop_123" in ctx
    assert "current_proposal_id" in ctx or "proposta salva" in ctx.lower()


def test_build_turn_context_includes_intent_hint():
    req = ProposalAssistantRequest(messages=[], intent_hint="validate")
    ctx = build_turn_context(req)
    assert "validate" in ctx or "validação" in ctx.lower()


def test_build_turn_context_handles_empty_request():
    req = ProposalAssistantRequest(messages=[])
    ctx = build_turn_context(req)
    assert isinstance(ctx, str)
    assert len(ctx) > 0
```

- [ ] **Step 2: Rodar teste, verificar falha**

```bash
pytest tests/test_proposal_assistant_prompts.py -v
```
Esperado: `ImportError`.

- [ ] **Step 3: Implementar prompts**

Criar `app/modules/ai/prompts/__init__.py` vazio e `app/modules/ai/prompts/proposal_assistant.py`:
```python
from app.modules.ai.schemas import ProposalAssistantRequest

ASSISTANT_RULES = """\
Você é o Caloni, decisor comercial sênior. Os documentos acima são SUA forma de
pensar e agir — não cite o nome dos arquivos ao usuário, internalize o conteúdo.

Sua função: ajudar o usuário a CRIAR, EDITAR e VALIDAR propostas comerciais via
conversa natural.

Regras de tool-calling:
1. Coletando dado novo: chame patch_draft com APENAS os campos que mudaram no turno.
2. Validação pedida sobre proposta salva: chame request_validation com proposal_id.
   Você NÃO gera o relatório — o sistema executa o serviço determinístico.
3. Draft completo (title + clientName + projectDescription presentes) e usuário sinalizando
   que está pronto: chame request_save.
4. current_proposal_id setado e usuário pede mudança: use request_update em vez de
   patch_draft.
5. Usuário menciona proposta existente por nome ou ID: pode usar open_existing.

Estilo:
- Português, tom profissional e direto.
- Máximo 3 frases por turno.
- Uma pergunta por vez.
- Se faltar dado obrigatório, pergunte naturalmente, sem formulário.

Campos do draft: title, clientName, clientCompany, clientEmail, clientPhone,
projectDescription, scope, value, deadline, notes.
"""


def build_turn_context(req: ProposalAssistantRequest) -> str:
    parts: list[str] = ["## Estado do turno"]

    if req.current_draft:
        draft_dict = req.current_draft.model_dump(exclude_none=True)
        if draft_dict:
            lines = [f"- {k}: {v}" for k, v in draft_dict.items()]
            parts.append("Draft em construção:\n" + "\n".join(lines))
        else:
            parts.append("Draft em construção: (vazio)")
    else:
        parts.append("Draft em construção: (nenhum)")

    if req.current_proposal_id:
        parts.append(f"current_proposal_id: {req.current_proposal_id} (proposta salva)")

    if req.last_saved_proposal_id and req.last_saved_proposal_id != req.current_proposal_id:
        parts.append(f"last_saved_proposal_id: {req.last_saved_proposal_id}")

    if req.intent_hint:
        parts.append(f"intent_hint: {req.intent_hint}")

    return "\n\n".join(parts)
```

- [ ] **Step 4: Rodar teste, verificar passa**

```bash
pytest tests/test_proposal_assistant_prompts.py -v
```
Esperado: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add app/modules/ai/prompts/__init__.py app/modules/ai/prompts/proposal_assistant.py tests/test_proposal_assistant_prompts.py
git commit -m "feat(ai): adicionar ASSISTANT_RULES e build_turn_context

Prompt template estático (cacheável) + builder dinâmico que serializa draft,
proposal_id e intent_hint do turno.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 5: Adicionar `call_ai_provider_with_tools` em `service.py`

**Files:**
- Modify: `seven_tools_api/app/modules/ai/service.py` (adicionar função)
- Test: `seven_tools_api/tests/test_proposal_assistant_provider.py`

- [ ] **Step 1: Escrever teste falhando**

`tests/test_proposal_assistant_provider.py`:
```python
from unittest.mock import patch as mock_patch

import httpx
import pytest

from app.modules.ai.service import call_ai_provider_with_tools


SAMPLE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "noop",
            "description": "no-op",
            "parameters": {"type": "object", "properties": {}},
        },
    }
]


def _mock_response(json_body: dict, status: int = 200):
    return httpx.Response(status_code=status, json=json_body, request=httpx.Request("POST", "https://x"))


def test_call_ai_provider_with_tools_returns_message_and_tool_calls():
    payload = {
        "choices": [
            {
                "message": {
                    "content": "ok",
                    "tool_calls": [
                        {
                            "id": "1",
                            "type": "function",
                            "function": {"name": "noop", "arguments": "{}"},
                        }
                    ],
                }
            }
        ]
    }
    with mock_patch("app.modules.ai.service.httpx.post", return_value=_mock_response(payload)) as posted:
        msg = call_ai_provider_with_tools(messages=[{"role": "user", "content": "hi"}], tools=SAMPLE_TOOLS)
    assert msg["content"] == "ok"
    assert len(msg["tool_calls"]) == 1
    assert msg["tool_calls"][0]["function"]["name"] == "noop"
    # Confirma que payload enviado inclui tools
    sent_body = posted.call_args.kwargs["json"]
    assert "tools" in sent_body
    assert sent_body["tools"] == SAMPLE_TOOLS


def test_call_ai_provider_with_tools_handles_empty_tool_calls():
    payload = {"choices": [{"message": {"content": "só texto"}}]}
    with mock_patch("app.modules.ai.service.httpx.post", return_value=_mock_response(payload)):
        msg = call_ai_provider_with_tools(messages=[{"role": "user", "content": "hi"}], tools=SAMPLE_TOOLS)
    assert msg["content"] == "só texto"
    assert msg["tool_calls"] == []


def test_call_ai_provider_with_tools_raises_on_5xx():
    with mock_patch("app.modules.ai.service.httpx.post", return_value=_mock_response({}, status=503)):
        with pytest.raises(httpx.HTTPStatusError):
            call_ai_provider_with_tools(messages=[{"role": "user", "content": "hi"}], tools=SAMPLE_TOOLS)


def test_call_ai_provider_with_tools_omits_response_format():
    payload = {"choices": [{"message": {"content": "ok"}}]}
    with mock_patch("app.modules.ai.service.httpx.post", return_value=_mock_response(payload)) as posted:
        call_ai_provider_with_tools(messages=[{"role": "user", "content": "hi"}], tools=SAMPLE_TOOLS)
    sent_body = posted.call_args.kwargs["json"]
    # response_format incompatível com tools em alguns providers
    assert "response_format" not in sent_body
```

- [ ] **Step 2: Rodar teste, verificar falha**

```bash
pytest tests/test_proposal_assistant_provider.py -v
```
Esperado: `ImportError`.

- [ ] **Step 3: Implementar `call_ai_provider_with_tools`**

Adicionar em `app/modules/ai/service.py` (no final do arquivo):
```python
def call_ai_provider_with_tools(
    messages: list[dict],
    tools: list[dict],
    timeout: float = 60.0,
) -> dict:
    """
    Chama provider compatível com OpenAI passando 'tools'. Retorna a 'message'
    do choice 0 (com 'content' e 'tool_calls'). Erros HTTP 4xx/5xx levantam
    httpx.HTTPStatusError.
    """
    body = {
        "model": settings.ai_model,
        "messages": messages,
        "tools": tools,
        "temperature": 0.3,
    }
    response = httpx.post(
        f"{settings.ai_base_url}/chat/completions",
        json=body,
        headers={
            "Authorization": f"Bearer {settings.ai_api_key}",
            "Content-Type": "application/json",
        },
        timeout=timeout,
    )
    response.raise_for_status()
    data = response.json()
    msg = data["choices"][0]["message"]
    return {
        "content": msg.get("content") or "",
        "tool_calls": msg.get("tool_calls") or [],
    }
```

- [ ] **Step 4: Rodar teste, verificar passa**

```bash
pytest tests/test_proposal_assistant_provider.py -v
```
Esperado: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add app/modules/ai/service.py tests/test_proposal_assistant_provider.py
git commit -m "feat(ai): call_ai_provider_with_tools para function-calling

Variante stateless de call_ai_provider que envia 'tools' e retorna content +
tool_calls. Não envia response_format (incompatível com tools em alguns
providers).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 6: Implementar dispatch table do orquestrador (`proposal_assistant_turn`)

**Files:**
- Modify: `seven_tools_api/app/modules/ai/service.py`
- Test: `seven_tools_api/tests/test_proposal_assistant_dispatch.py`

- [ ] **Step 1: Escrever testes falhando**

`tests/test_proposal_assistant_dispatch.py`:
```python
import json
from unittest.mock import patch

import pytest

from app.modules.ai.schemas import (
    DraftPatchResult,
    OpenExistingResult,
    ProposalAssistantRequest,
    ProposalAssistantResponse,
    ProposalDraftIn,
    SaveRequestResult,
    UpdateRequestResult,
    ValidationReportResult,
)
from app.modules.ai.service import proposal_assistant_turn


def _mock_completion(reply="ok", tool_name=None, tool_args=None):
    tool_calls = []
    if tool_name:
        tool_calls = [
            {
                "id": "c1",
                "type": "function",
                "function": {"name": tool_name, "arguments": json.dumps(tool_args or {})},
            }
        ]
    return {"content": reply, "tool_calls": tool_calls}


def test_dispatch_no_tool_call_returns_reply_only(db_session, sample_user):
    req = ProposalAssistantRequest(messages=[{"role": "user", "content": "oi"}])
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value=_mock_completion(reply="opa"),
    ):
        resp = proposal_assistant_turn(db_session, sample_user, req)
    assert resp.reply == "opa"
    assert resp.tool_result is None


def test_dispatch_patch_draft_filters_unknown_keys(db_session, sample_user):
    req = ProposalAssistantRequest(
        messages=[{"role": "user", "content": "Acme"}],
        current_draft=ProposalDraftIn(),
    )
    args = {"patch": {"clientName": "Acme", "garbage_field": "x"}}
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value=_mock_completion(tool_name="patch_draft", tool_args=args),
    ):
        resp = proposal_assistant_turn(db_session, sample_user, req)
    assert isinstance(resp.tool_result, DraftPatchResult)
    assert resp.tool_result.patch == {"clientName": "Acme"}
    assert "garbage_field" not in resp.tool_result.patch


def test_dispatch_patch_draft_with_invalid_type_degrades(db_session, sample_user):
    req = ProposalAssistantRequest(messages=[{"role": "user", "content": "x"}])
    args = {"patch": {"value": 25000}}  # int em campo str
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value=_mock_completion(reply="ok", tool_name="patch_draft", tool_args=args),
    ):
        resp = proposal_assistant_turn(db_session, sample_user, req)
    # Degrada: tool_result None, reply preservado
    assert resp.tool_result is None
    assert resp.reply == "ok"


def test_dispatch_request_save_returns_summary(db_session, sample_user):
    draft = ProposalDraftIn(
        title="Acme SEO",
        clientName="Acme",
        projectDescription="Otimização",
    )
    req = ProposalAssistantRequest(messages=[{"role": "user", "content": "salva"}], current_draft=draft)
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value=_mock_completion(tool_name="request_save"),
    ):
        resp = proposal_assistant_turn(db_session, sample_user, req)
    assert isinstance(resp.tool_result, SaveRequestResult)
    assert resp.tool_result.draft_summary.title == "Acme SEO"


def test_dispatch_request_update_passes_proposal_id(db_session, sample_user):
    req = ProposalAssistantRequest(
        messages=[{"role": "user", "content": "muda valor"}],
        current_proposal_id="prop_42",
    )
    args = {"patch": {"value": "R$ 25.000"}}
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value=_mock_completion(tool_name="request_update", tool_args=args),
    ):
        resp = proposal_assistant_turn(db_session, sample_user, req)
    assert isinstance(resp.tool_result, UpdateRequestResult)
    assert resp.tool_result.proposal_id == "prop_42"
    assert resp.tool_result.patch == {"value": "R$ 25.000"}


def test_dispatch_request_update_without_proposal_id_degrades(db_session, sample_user):
    req = ProposalAssistantRequest(messages=[{"role": "user", "content": "muda"}])
    args = {"patch": {"value": "R$ 25.000"}}
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value=_mock_completion(reply="ok", tool_name="request_update", tool_args=args),
    ):
        resp = proposal_assistant_turn(db_session, sample_user, req)
    assert resp.tool_result is None


def test_dispatch_open_existing_passes_id_through(db_session, sample_user):
    req = ProposalAssistantRequest(messages=[{"role": "user", "content": "abre"}])
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value=_mock_completion(tool_name="open_existing", tool_args={"proposal_id": "prop_99"}),
    ):
        resp = proposal_assistant_turn(db_session, sample_user, req)
    assert isinstance(resp.tool_result, OpenExistingResult)
    assert resp.tool_result.proposal_id == "prop_99"


def test_dispatch_unknown_tool_degrades(db_session, sample_user):
    req = ProposalAssistantRequest(messages=[{"role": "user", "content": "x"}])
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value=_mock_completion(reply="ok", tool_name="weird_tool"),
    ):
        resp = proposal_assistant_turn(db_session, sample_user, req)
    assert resp.tool_result is None
```

> **Nota:** `db_session` e `sample_user` são fixtures presumivelmente em `conftest.py`. Verifique antes de rodar; se faltarem, adicione em `tests/conftest.py` (lê-lo primeiro pra ver convenção).

- [ ] **Step 2: Verificar fixtures existentes**

```bash
grep -n "def db_session\|def sample_user\|@pytest.fixture" tests/conftest.py | head -30
```
Se `sample_user` não existir, criar fixture mínima:
```python
@pytest.fixture
def sample_user(db_session):
    from app.modules.users.models import User  # ajustar import conforme repo
    user = User(email="qa@local.dev", name="QA")
    db_session.add(user)
    db_session.commit()
    return user
```
(Adicionar apenas se faltar; manter convenção do repo.)

- [ ] **Step 3: Rodar teste, verificar falha**

```bash
pytest tests/test_proposal_assistant_dispatch.py -v
```
Esperado: `ImportError` em `proposal_assistant_turn`.

- [ ] **Step 4: Implementar orquestrador em `service.py`**

Adicionar no final de `app/modules/ai/service.py`:
```python
import json as _json
from pydantic import ValidationError

from app.modules.ai.knowledge import load_caloni_knowledge
from app.modules.ai.prompts.proposal_assistant import ASSISTANT_RULES, build_turn_context
from app.modules.ai.schemas import (
    DraftPatchResult,
    OpenExistingResult,
    ProposalAssistantRequest,
    ProposalAssistantResponse,
    ProposalDraftIn,
    SaveRequestResult,
    UpdateRequestResult,
    ValidationReportResult,
)
from app.modules.ai.tools import PROPOSAL_TOOLS

_REQUIRED_DRAFT_FIELDS = ("title", "clientName", "projectDescription")


def _compute_missing_required(
    current: ProposalDraftIn | None,
    patch: dict,
) -> list[str]:
    base = current.model_dump(exclude_none=True) if current else {}
    merged = {**base, **{k: v for k, v in patch.items() if v}}
    return [f for f in _REQUIRED_DRAFT_FIELDS if not merged.get(f)]


def _filter_draft_keys(patch: dict) -> dict:
    valid = set(ProposalDraftIn.model_fields.keys())
    return {k: v for k, v in patch.items() if k in valid}


def proposal_assistant_turn(
    db,
    user,
    req: ProposalAssistantRequest,
) -> ProposalAssistantResponse:
    knowledge = load_caloni_knowledge("proposal_assistant")
    turn_context = build_turn_context(req)

    history = req.messages[-20:]
    messages = [
        {"role": "system", "content": knowledge},
        {"role": "system", "content": ASSISTANT_RULES},
        {"role": "system", "content": turn_context},
        *[m.model_dump(exclude_none=True) for m in history],
    ]

    completion = call_ai_provider_with_tools(messages, PROPOSAL_TOOLS)
    reply = completion["content"] or ""
    tool_calls = completion["tool_calls"] or []

    if not tool_calls:
        return ProposalAssistantResponse(reply=reply)

    call = tool_calls[0]
    fn = call.get("function", {})
    name = fn.get("name", "")
    try:
        args = _json.loads(fn.get("arguments") or "{}")
    except _json.JSONDecodeError:
        return ProposalAssistantResponse(reply=reply)

    if name == "patch_draft":
        clean = _filter_draft_keys(args.get("patch", {}))
        try:
            base = req.current_draft.model_dump(exclude_none=True) if req.current_draft else {}
            ProposalDraftIn.model_validate({**base, **clean})
        except ValidationError:
            return ProposalAssistantResponse(reply=reply)
        missing = _compute_missing_required(req.current_draft, clean)
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=DraftPatchResult(
                kind="proposal_draft_patch", patch=clean, missing_required=missing
            ),
        )

    if name == "request_validation":
        proposal_id = args.get("proposal_id")
        if not proposal_id:
            return ProposalAssistantResponse(reply=reply)
        # Adia até refator de validate_proposal_service (Task 8)
        from app.modules.ai.service import validate_proposal_service  # type: ignore

        proposal = _load_user_proposal(db, user, proposal_id)
        if not proposal:
            return ProposalAssistantResponse(
                reply=f"Não encontrei a proposta {proposal_id}."
            )
        report = validate_proposal_service(db, user.id, _proposal_to_text(proposal), proposal.id)
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=ValidationReportResult(
                kind="proposal_validation_report",
                report=report.model_dump() if hasattr(report, "model_dump") else report,
                proposal_id=str(proposal.id),
            ),
        )

    if name == "request_save":
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=SaveRequestResult(
                kind="proposal_save_request",
                draft_summary=req.current_draft or ProposalDraftIn(),
            ),
        )

    if name == "request_update":
        if not req.current_proposal_id:
            return ProposalAssistantResponse(reply=reply)
        clean = _filter_draft_keys(args.get("patch", {}))
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=UpdateRequestResult(
                kind="proposal_update_request",
                proposal_id=req.current_proposal_id,
                patch=clean,
            ),
        )

    if name == "open_existing":
        proposal_id = args.get("proposal_id")
        if not proposal_id:
            return ProposalAssistantResponse(reply=reply)
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=OpenExistingResult(
                kind="proposal_open_existing", proposal_id=proposal_id
            ),
        )

    return ProposalAssistantResponse(reply=reply)


def _load_user_proposal(db, user, proposal_id):
    """Helper que carrega proposta validando ownership. Retorna None se não existir."""
    from app.modules.proposals import repo as proposals_repo  # ajustar import conforme repo

    return proposals_repo.get_for_user(db, proposal_id=proposal_id, user_id=user.id)


def _proposal_to_text(proposal) -> str:
    """Serializa proposta em texto pra ser revalidada pelo serviço determinístico."""
    parts = [
        f"Título: {proposal.title or ''}",
        f"Cliente: {proposal.client_name or ''}",
        f"Empresa: {proposal.client_company or ''}",
        f"Descrição: {proposal.project_description or ''}",
        f"Escopo: {proposal.scope or ''}",
        f"Valor: {proposal.value or ''}",
        f"Prazo: {proposal.deadline or ''}",
        f"Notas: {proposal.notes or ''}",
    ]
    return "\n".join(parts)
```

> **Nota:** os imports de `proposals_repo` podem precisar de ajuste conforme convenção real do repo. Use `grep` em `app/modules/proposals/` antes de fechar o import.

- [ ] **Step 5: Rodar teste, verificar passa**

```bash
pytest tests/test_proposal_assistant_dispatch.py -v
```
Esperado: 8 PASS (exceto o test de `request_validation` que ainda depende de Task 7/8 — pode ficar pendente até lá; xfail se necessário).

- [ ] **Step 6: Commit**

```bash
git add app/modules/ai/service.py tests/test_proposal_assistant_dispatch.py
git commit -m "feat(ai): orquestrador proposal_assistant_turn com dispatch table

Despacha 5 tool_calls para handlers determinísticos. patch_draft filtra
chaves desconhecidas; tipos inválidos degradam pra reply puro.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 7: Refatorar `validate_proposal` em `validate_proposal_service`

**Files:**
- Modify: `seven_tools_api/app/modules/ai/service.py`
- Test: `seven_tools_api/tests/test_ai.py` (atualizar imports), `seven_tools_api/tests/test_proposal_assistant_validation.py`

- [ ] **Step 1: Localizar `validate_proposal`**

```bash
grep -n "def validate_proposal\|def diagnose" app/modules/ai/service.py
```

- [ ] **Step 2: Renomear `validate_proposal` → `validate_proposal_service`**

Em `app/modules/ai/service.py`, renomear a função (e suas chamadas internas). Manter assinatura: `validate_proposal_service(db, user_id, text, proposal_id=None) -> ValidationReport`.

- [ ] **Step 3: Atualizar `router.py` (importação)**

Em `app/modules/ai/router.py`, substituir `from .service import validate_proposal` por `from .service import validate_proposal_service` e atualizar chamadas.

- [ ] **Step 4: Atualizar testes existentes**

`tests/test_ai.py`: substituir referências `validate_proposal` → `validate_proposal_service`.

- [ ] **Step 5: Rodar suite completa**

```bash
pytest tests/test_ai.py tests/test_proposal_assistant_dispatch.py -v
```
Esperado: tudo PASS.

- [ ] **Step 6: Commit**

```bash
git add app/modules/ai/service.py app/modules/ai/router.py tests/test_ai.py
git commit -m "refactor(ai): renomear validate_proposal -> validate_proposal_service

Função interna usada tanto pelo endpoint legado /ai/validate-proposal (a ser
deletado em task posterior) quanto pelo novo orquestrador via tool_call
request_validation.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 8: Implementar `inject_attachment_context` (PDF via pdfplumber)

**Files:**
- Modify: `seven_tools_api/app/modules/ai/service.py`
- Test: `seven_tools_api/tests/test_proposal_assistant_attachments.py`

- [ ] **Step 1: Escrever teste falhando**

`tests/test_proposal_assistant_attachments.py`:
```python
from unittest.mock import patch

from app.modules.ai.schemas import AttachmentRef, ChatMessageIn
from app.modules.ai.service import inject_attachment_context


def test_pdf_attachment_extracted_via_pdfplumber():
    msg = ChatMessageIn(
        role="user",
        content="analisa esse PDF",
        attachments=[
            AttachmentRef(filename="proposta.pdf", mime_type="application/pdf", size_bytes=1234, text_content=None)
        ],
    )
    with patch("app.modules.ai.service._extract_pdf_text", return_value="Conteúdo do PDF Acme..."):
        result = inject_attachment_context([msg], latest_attachments=msg.attachments)
    # Deve haver mensagem extra com conteúdo extraído
    assert any("Conteúdo do PDF Acme" in m.content for m in result if m.role == "user")


def test_corrupted_pdf_returns_messages_without_extra_block():
    msg = ChatMessageIn(
        role="user",
        content="x",
        attachments=[
            AttachmentRef(filename="bad.pdf", mime_type="application/pdf", size_bytes=10)
        ],
    )
    with patch("app.modules.ai.service._extract_pdf_text", side_effect=RuntimeError("parse error")):
        result = inject_attachment_context([msg], latest_attachments=msg.attachments)
    # Sobrevive: retorna ao menos a mensagem original
    assert len(result) >= 1
    assert all("parse error" not in m.content for m in result)


def test_no_pdf_attachments_returns_messages_unchanged():
    msg = ChatMessageIn(role="user", content="oi", attachments=[])
    result = inject_attachment_context([msg], latest_attachments=[])
    assert len(result) == 1
    assert result[0].content == "oi"
```

- [ ] **Step 2: Rodar teste, verificar falha**

```bash
pytest tests/test_proposal_assistant_attachments.py -v
```

- [ ] **Step 3: Implementar em `service.py`**

```python
import io as _io

import pdfplumber  # já está em requirements.txt


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    with pdfplumber.open(_io.BytesIO(pdf_bytes)) as pdf:
        return "\n\n".join((page.extract_text() or "") for page in pdf.pages)


def inject_attachment_context(
    messages: list[ChatMessageIn],
    latest_attachments: list,
) -> list[ChatMessageIn]:
    """
    Para anexos PDF do último turno, extrai texto via pdfplumber e injeta
    como user message extra logo antes do último turno. Falhas degradam:
    retorna a lista original sem bloco extra.
    """
    if not latest_attachments:
        return list(messages)

    pdf_attachments = [a for a in latest_attachments if a.mime_type == "application/pdf"]
    if not pdf_attachments:
        return list(messages)

    chunks: list[str] = []
    for att in pdf_attachments:
        if att.text_content:
            chunks.append(f"[{att.filename}]\n{att.text_content}")
            continue
        # Sem text_content nem url disponível inline → pula
    if not chunks:
        return list(messages)

    extra = ChatMessageIn(
        role="user",
        content="Conteúdo extraído de anexo(s) PDF:\n\n" + "\n\n---\n\n".join(chunks),
    )
    return list(messages[:-1]) + [extra] + list(messages[-1:])
```

> **Nota:** o frontend é responsável por extrair o texto do PDF via `pdfplumber` no client OU enviar bytes via upload endpoint separado. Se preferir extrair no backend, expandir `AttachmentRef` para carregar `bytes_b64` e descomentar o bloco. Decisão default: confiar em `text_content` enviado pelo frontend (já implementado no `PromptInputBox`).

- [ ] **Step 4: Rodar teste, verificar passa**

```bash
pytest tests/test_proposal_assistant_attachments.py -v
```

- [ ] **Step 5: Integrar `inject_attachment_context` no orquestrador**

Em `proposal_assistant_turn`, após `history = req.messages[-20:]`:
```python
latest_attachments = req.messages[-1].attachments if req.messages else []
history = inject_attachment_context(history, latest_attachments=latest_attachments)
```

- [ ] **Step 6: Rodar suite full**

```bash
pytest tests/test_proposal_assistant_dispatch.py tests/test_proposal_assistant_attachments.py -v
```

- [ ] **Step 7: Commit**

```bash
git add app/modules/ai/service.py tests/test_proposal_assistant_attachments.py
git commit -m "feat(ai): inject_attachment_context extrai PDFs no orquestrador

Confia em text_content enviado pelo frontend (já feito no PromptInputBox).
Falhas de extração degradam silenciosamente.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 9: Adicionar endpoint `POST /ai/proposal-assistant`

**Files:**
- Modify: `seven_tools_api/app/modules/ai/router.py`
- Test: `seven_tools_api/tests/test_proposal_assistant_endpoint.py`

- [ ] **Step 1: Escrever teste de integração falhando** (PostgreSQL real via fixture)

`tests/test_proposal_assistant_endpoint.py`:
```python
from unittest.mock import patch

import pytest


def test_proposal_assistant_endpoint_returns_reply(client, auth_headers):
    body = {
        "messages": [{"role": "user", "content": "Quero criar uma proposta"}],
        "current_draft": None,
        "current_proposal_id": None,
    }
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value={"content": "Beleza, qual o cliente?", "tool_calls": []},
    ):
        r = client.post("/ai/proposal-assistant", json=body, headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["reply"] == "Beleza, qual o cliente?"
    assert data["tool_result"] is None


def test_proposal_assistant_endpoint_requires_auth(client):
    r = client.post("/ai/proposal-assistant", json={"messages": []})
    assert r.status_code in (401, 403)


def test_proposal_assistant_endpoint_validates_body(client, auth_headers):
    r = client.post("/ai/proposal-assistant", json={"foo": "bar"}, headers=auth_headers)
    assert r.status_code == 422


def test_proposal_assistant_endpoint_propagates_provider_5xx(client, auth_headers):
    import httpx

    body = {"messages": [{"role": "user", "content": "x"}]}
    err = httpx.HTTPStatusError(
        "boom",
        request=httpx.Request("POST", "https://x"),
        response=httpx.Response(503, request=httpx.Request("POST", "https://x")),
    )
    with patch("app.modules.ai.service.call_ai_provider_with_tools", side_effect=err):
        r = client.post("/ai/proposal-assistant", json=body, headers=auth_headers)
    assert r.status_code == 504
    assert r.json().get("detail") == "provider_unavailable"
```

> Fixtures `client` e `auth_headers` já existem em `tests/conftest.py` (verificar `tests/test_proposals.py` pra confirmar).

- [ ] **Step 2: Rodar teste, verificar falha**

```bash
pytest tests/test_proposal_assistant_endpoint.py -v
```
Esperado: 404 ou ImportError.

- [ ] **Step 3: Adicionar endpoint em `router.py`**

```python
import httpx
from fastapi import APIRouter, Depends, HTTPException
from app.modules.ai.schemas import ProposalAssistantRequest, ProposalAssistantResponse
from app.modules.ai.service import proposal_assistant_turn
# ...imports existentes...


@router.post("/proposal-assistant", response_model=ProposalAssistantResponse)
def proposal_assistant_endpoint(
    req: ProposalAssistantRequest,
    db=Depends(get_db),
    user=Depends(get_current_user),
) -> ProposalAssistantResponse:
    try:
        return proposal_assistant_turn(db, user, req)
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status == 429:
            retry_after = exc.response.headers.get("retry-after")
            raise HTTPException(
                status_code=429,
                detail={"detail": "rate_limited", "retry_after_s": int(retry_after) if retry_after else None},
            )
        if status >= 500:
            raise HTTPException(status_code=504, detail="provider_unavailable")
        raise HTTPException(status_code=status, detail="provider_error")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="provider_unavailable")
```

- [ ] **Step 4: Rodar teste, verificar passa**

```bash
pytest tests/test_proposal_assistant_endpoint.py -v
```
Esperado: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add app/modules/ai/router.py tests/test_proposal_assistant_endpoint.py
git commit -m "feat(ai): expor POST /ai/proposal-assistant

Mapeamento de erros: provider 5xx/timeout -> 504, 429 -> 429 com retry_after_s.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 10: Deletar endpoints HTTP legados `/ai/validate-proposal*`

**Files:**
- Modify: `seven_tools_api/app/modules/ai/router.py`
- Modify: `seven_tools_api/tests/test_ai.py` (remover testes dos endpoints HTTP, manter os de `validate_proposal_service` se houver)

- [ ] **Step 1: Localizar rotas a deletar**

```bash
grep -n "validate-proposal\|validate_proposal" app/modules/ai/router.py
```

- [ ] **Step 2: Remover de `router.py`** os 3 endpoints:
  - `POST /ai/validate-proposal`
  - `POST /ai/validate-proposal/upload`
  - `GET /ai/validate-proposal/from-proposal/{id}`

Manter o import e uso interno de `validate_proposal_service` (chamado pelo orquestrador).

- [ ] **Step 3: Remover testes obsoletos em `tests/test_ai.py`**

Apagar funções de teste que batem nos endpoints HTTP `/ai/validate-proposal*`. Preservar testes que cobrem `validate_proposal_service` como função (se houver).

- [ ] **Step 4: Rodar suite completa**

```bash
pytest -v
```
Esperado: tudo PASS.

- [ ] **Step 5: Commit**

```bash
git add app/modules/ai/router.py tests/test_ai.py
git commit -m "refactor(ai): remover endpoints HTTP /ai/validate-proposal*

Função validate_proposal_service permanece como helper interno chamado pelo
orquestrador via tool_call request_validation. Sem usuários ativos -> sem
redirect/deprecation period.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 11: PR backend

- [ ] **Step 1: Push e abrir PR**

```bash
git push -u origin feature/ai-proposal-assistant
gh pr create --title "feat(ai): proposal-assistant unificado (criação + edição + validação)" --body "$(cat <<'EOF'
## Summary
- Novo endpoint `POST /ai/proposal-assistant` orquestra criação/edição/validação de proposta via tool-calling determinístico.
- Validação migra do endpoint HTTP `/ai/validate-proposal*` (deletado) para tool_call interno `request_validation` que chama `validate_proposal_service`.
- Knowledge loader ganha `PROFILES`; profile `proposal_assistant` reduz ~48% de tokens.

## Test plan
- [ ] `pytest tests/test_proposal_assistant_*.py -v` (knowledge, prompts, provider, dispatch, attachments, endpoint) tudo verde
- [ ] `pytest tests/test_ai.py -v` (legado, validate_proposal_service ainda usado internamente)
- [ ] Smoke manual via curl autenticado: 200 + reply textual

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

# Fase 2B — Frontend

> Tudo nesta seção: `cd /c/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration` e branch `codex/chat-tool-integration`.

## Task 12: Adicionar `onToolResult` opcional em `AgentConfig`

**Files:**
- Modify: `src/agents/registry.ts`
- Test: `src/agents/__tests__/registry.test.tsx`

- [ ] **Step 1: Adicionar campo opcional**

Em `src/agents/registry.ts`, no interface `AgentConfig`:
```typescript
export interface AgentConfig {
  // ...campos existentes...
  onToolResult?: (toolResult: unknown, ctx: AgentToolResultContext) => void;
}

export interface AgentToolResultContext {
  navigate: (to: string) => void;
  draftHook?: unknown; // tipado depois pelo agente proposal
  injectSystemMessage: (content: string) => void;
}
```

- [ ] **Step 2: Atualizar teste do registry**

`src/agents/__tests__/registry.test.tsx`: adicionar caso garantindo que `onToolResult` é opcional.

- [ ] **Step 3: Rodar testes**

```bash
npm run test -- src/agents/__tests__/registry.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/agents/registry.ts src/agents/__tests__/registry.test.tsx
git commit -m "feat(agents): adicionar onToolResult opcional em AgentConfig

Permite que agentes (ex: proposal) reajam a tool_results sem ChatToolPage
precisar conhecer detalhes do agente.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 13: Hook `useProposalDraft` (localStorage)

**Files:**
- Create: `src/agents/proposal/useProposalDraft.ts`
- Test: `src/agents/proposal/__tests__/useProposalDraft.test.ts`

- [ ] **Step 1: Escrever testes falhando**

```typescript
// src/agents/proposal/__tests__/useProposalDraft.test.ts
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useProposalDraft } from '../useProposalDraft';

const KEY = 'seven.proposta.draft.v1';

afterEach(() => localStorage.clear());

describe('useProposalDraft', () => {
  it('starts with null draft when storage is empty', () => {
    const { result } = renderHook(() => useProposalDraft());
    expect(result.current.draft).toBeNull();
  });

  it('patch merges into existing draft and persists', () => {
    const { result } = renderHook(() => useProposalDraft());
    act(() => result.current.patch({ clientName: 'Acme' }));
    expect(result.current.draft).toEqual({ clientName: 'Acme' });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ clientName: 'Acme' });

    act(() => result.current.patch({ title: 'SEO' }));
    expect(result.current.draft).toEqual({ clientName: 'Acme', title: 'SEO' });
  });

  it('reset clears draft and storage', () => {
    const { result } = renderHook(() => useProposalDraft());
    act(() => result.current.patch({ clientName: 'Acme' }));
    act(() => result.current.reset());
    expect(result.current.draft).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('isSavable is true when title, clientName and projectDescription present', () => {
    const { result } = renderHook(() => useProposalDraft());
    act(() => result.current.patch({ title: 'X', clientName: 'Y', projectDescription: 'Z' }));
    expect(result.current.isSavable).toBe(true);
  });

  it('isSavable is false when any required field missing', () => {
    const { result } = renderHook(() => useProposalDraft());
    act(() => result.current.patch({ title: 'X', clientName: 'Y' }));
    expect(result.current.isSavable).toBe(false);
  });

  it('survives reload via localStorage', () => {
    const { result, unmount } = renderHook(() => useProposalDraft());
    act(() => result.current.patch({ clientName: 'Acme' }));
    unmount();
    const remount = renderHook(() => useProposalDraft());
    expect(remount.result.current.draft).toEqual({ clientName: 'Acme' });
  });

  it('falls back to null when localStorage has invalid JSON', () => {
    localStorage.setItem(KEY, 'not-json');
    const { result } = renderHook(() => useProposalDraft());
    expect(result.current.draft).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar teste, verificar falha**

```bash
npm run test -- src/agents/proposal/__tests__/useProposalDraft.test.ts
```

- [ ] **Step 3: Implementar `useProposalDraft.ts`**

```typescript
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'seven.proposta.draft.v1';
const REQUIRED_FIELDS = ['title', 'clientName', 'projectDescription'] as const;

export interface ProposalDraft {
  title?: string;
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectDescription?: string;
  scope?: string;
  value?: string;
  deadline?: string;
  notes?: string;
}

function readStorage(): ProposalDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as ProposalDraft) : null;
  } catch {
    return null;
  }
}

function writeStorage(value: ProposalDraft | null): void {
  if (value === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
}

export interface UseProposalDraftReturn {
  draft: ProposalDraft | null;
  patch: (partial: Partial<ProposalDraft>) => void;
  reset: () => void;
  isSavable: boolean;
}

export function useProposalDraft(): UseProposalDraftReturn {
  const [draft, setDraft] = useState<ProposalDraft | null>(() => readStorage());

  const patch = useCallback((partial: Partial<ProposalDraft>) => {
    setDraft((current) => {
      const next = { ...(current ?? {}), ...partial };
      writeStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    writeStorage(null);
    setDraft(null);
  }, []);

  const isSavable = !!draft && REQUIRED_FIELDS.every((f) => Boolean(draft[f]?.trim()));

  return { draft, patch, reset, isSavable };
}
```

- [ ] **Step 4: Rodar testes, verificar passa**

```bash
npm run test -- src/agents/proposal/__tests__/useProposalDraft.test.ts
```
Esperado: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/agents/proposal/useProposalDraft.ts src/agents/proposal/__tests__/useProposalDraft.test.ts
git commit -m "feat(proposal): hook useProposalDraft com persistência em localStorage

JSON inválido degrada pra null, isSavable checa title+clientName+projectDescription.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 14: Hook `useProposalChatAdapter`

**Files:**
- Create: `src/agents/proposal/useProposalChatAdapter.ts`
- Create: `src/agents/proposal/types.ts` (tipos de tool result)
- Test: `src/agents/proposal/__tests__/useProposalChatAdapter.test.ts`

- [ ] **Step 1: Definir types**

`src/agents/proposal/types.ts`:
```typescript
import type { ProposalDraft } from './useProposalDraft';

export type ProposalToolResult =
  | { kind: 'proposal_draft_patch'; patch: Partial<ProposalDraft>; missing_required: string[] }
  | { kind: 'proposal_validation_report'; report: unknown; proposal_id: string }
  | { kind: 'proposal_save_request'; draft_summary: ProposalDraft }
  | { kind: 'proposal_update_request'; proposal_id: string; patch: Partial<ProposalDraft> }
  | { kind: 'proposal_open_existing'; proposal_id: string };

export interface ProposalAssistantResponse {
  reply: string;
  tool_result: ProposalToolResult | null;
}
```

- [ ] **Step 2: Escrever testes falhando**

`src/agents/proposal/__tests__/useProposalChatAdapter.test.ts`:
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createProposalChatAdapter } from '../useProposalChatAdapter';

const fetchMock = vi.fn();

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
});

afterEach(() => vi.restoreAllMocks());

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('proposalChatAdapter', () => {
  it('sends messages, current_draft, proposal_id and intent in body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ reply: 'ok', tool_result: null }));

    const adapter = createProposalChatAdapter({
      authToken: 't',
      getDraft: () => ({ clientName: 'Acme' }),
      getCurrentProposalId: () => 'prop_1',
      getLastSavedProposalId: () => null,
      getIntentHint: () => 'edit',
    });

    await adapter.send(
      [{ role: 'user', content: 'oi', attachments: [] }],
      new AbortController().signal,
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[0].content).toBe('oi');
    expect(body.current_draft).toEqual({ clientName: 'Acme' });
    expect(body.current_proposal_id).toBe('prop_1');
    expect(body.intent_hint).toBe('edit');
  });

  it('parses tool_result discriminated union', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        reply: 'feito',
        tool_result: { kind: 'proposal_draft_patch', patch: { title: 'X' }, missing_required: ['clientName'] },
      }),
    );

    const adapter = createProposalChatAdapter({
      authToken: 't',
      getDraft: () => null,
      getCurrentProposalId: () => null,
      getLastSavedProposalId: () => null,
      getIntentHint: () => null,
    });

    const result = await adapter.send([{ role: 'user', content: 'x', attachments: [] }], new AbortController().signal);
    expect(result.toolResult).toEqual({
      kind: 'proposal_draft_patch',
      patch: { title: 'X' },
      missing_required: ['clientName'],
    });
  });

  it('propagates abort signal to fetch', async () => {
    const ctrl = new AbortController();
    fetchMock.mockImplementation((_url, opts) => {
      expect(opts.signal).toBe(ctrl.signal);
      return Promise.resolve(jsonResponse({ reply: '', tool_result: null }));
    });

    const adapter = createProposalChatAdapter({
      authToken: 't',
      getDraft: () => null,
      getCurrentProposalId: () => null,
      getLastSavedProposalId: () => null,
      getIntentHint: () => null,
    });

    await adapter.send([{ role: 'user', content: 'x', attachments: [] }], ctrl.signal);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('throws on non-ok response with status code', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'rate_limited' }, 429));
    const adapter = createProposalChatAdapter({
      authToken: 't',
      getDraft: () => null,
      getCurrentProposalId: () => null,
      getLastSavedProposalId: () => null,
      getIntentHint: () => null,
    });
    await expect(
      adapter.send([{ role: 'user', content: 'x', attachments: [] }], new AbortController().signal),
    ).rejects.toThrow(/429/);
  });
});
```

- [ ] **Step 3: Rodar testes, verificar falha**

```bash
npm run test -- src/agents/proposal/__tests__/useProposalChatAdapter.test.ts
```

- [ ] **Step 4: Implementar adapter**

```typescript
// src/agents/proposal/useProposalChatAdapter.ts
import type { ProposalDraft } from './useProposalDraft';
import type { ProposalAssistantResponse, ProposalToolResult } from './types';

export interface ProposalChatAdapterDeps {
  authToken: string;
  getDraft: () => ProposalDraft | null;
  getCurrentProposalId: () => string | null;
  getLastSavedProposalId: () => string | null;
  getIntentHint: () => 'create' | 'validate' | 'edit' | null;
  apiBaseUrl?: string;
}

export interface AdapterSendInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: Array<{ filename: string; mime_type: string; size_bytes: number; text_content?: string | null }>;
}

export interface AdapterSendResult {
  reply: string;
  toolResult: ProposalToolResult | null;
}

export interface ProposalChatAdapter {
  send(messages: AdapterSendInput[], signal: AbortSignal): Promise<AdapterSendResult>;
}

export function createProposalChatAdapter(deps: ProposalChatAdapterDeps): ProposalChatAdapter {
  const baseUrl = deps.apiBaseUrl ?? '';
  return {
    async send(messages, signal) {
      const body = {
        messages,
        current_draft: deps.getDraft(),
        current_proposal_id: deps.getCurrentProposalId(),
        last_saved_proposal_id: deps.getLastSavedProposalId(),
        intent_hint: deps.getIntentHint(),
      };
      const res = await fetch(`${baseUrl}/ai/proposal-assistant`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deps.authToken}`,
        },
        signal,
      });
      if (!res.ok) {
        throw new Error(`Proposal assistant request failed: ${res.status}`);
      }
      const data = (await res.json()) as ProposalAssistantResponse;
      return { reply: data.reply, toolResult: data.tool_result };
    },
  };
}
```

- [ ] **Step 5: Rodar testes, verificar passa**

```bash
npm run test -- src/agents/proposal/__tests__/useProposalChatAdapter.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/agents/proposal/types.ts src/agents/proposal/useProposalChatAdapter.ts src/agents/proposal/__tests__/useProposalChatAdapter.test.ts
git commit -m "feat(proposal): adapter HTTP do proposal assistant

createProposalChatAdapter encapsula POST /ai/proposal-assistant com signal,
auth e parsing do tool_result discriminado.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 15: `ProposalDraftPreviewCard`

**Files:**
- Create: `src/agents/proposal/ProposalDraftPreviewCard.tsx`
- Test: `src/agents/proposal/__tests__/ProposalDraftPreviewCard.test.tsx`

- [ ] **Step 1: Escrever testes**

```tsx
// src/agents/proposal/__tests__/ProposalDraftPreviewCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProposalDraftPreviewCard } from '../ProposalDraftPreviewCard';

describe('ProposalDraftPreviewCard', () => {
  it('renders fields from patch', () => {
    render(
      <ProposalDraftPreviewCard
        patch={{ title: 'Acme SEO', clientName: 'Acme' }}
        missingRequired={['projectDescription']}
        extractedFromPdf={false}
      />,
    );
    expect(screen.getByText(/Acme SEO/)).toBeInTheDocument();
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
  });

  it('shows missing required fields', () => {
    render(
      <ProposalDraftPreviewCard
        patch={{ title: 'X' }}
        missingRequired={['clientName', 'projectDescription']}
        extractedFromPdf={false}
      />,
    );
    expect(screen.getByText(/clientName/)).toBeInTheDocument();
    expect(screen.getByText(/projectDescription/)).toBeInTheDocument();
  });

  it('shows pdf-extracted flag when applicable', () => {
    render(
      <ProposalDraftPreviewCard
        patch={{ title: 'X' }}
        missingRequired={[]}
        extractedFromPdf
      />,
    );
    expect(screen.getByText(/extraído de PDF/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar teste falhando**

```bash
npm run test -- src/agents/proposal/__tests__/ProposalDraftPreviewCard.test.tsx
```

- [ ] **Step 3: Implementar**

```tsx
// src/agents/proposal/ProposalDraftPreviewCard.tsx
import type { ProposalDraft } from './useProposalDraft';

export interface ProposalDraftPreviewCardProps {
  patch: Partial<ProposalDraft>;
  missingRequired: string[];
  extractedFromPdf: boolean;
}

export function ProposalDraftPreviewCard({
  patch,
  missingRequired,
  extractedFromPdf,
}: ProposalDraftPreviewCardProps) {
  const entries = Object.entries(patch).filter(([, v]) => v != null && String(v).trim() !== '');
  return (
    <div
      className="mt-2 rounded-lg border border-border bg-card/40 p-3 text-sm"
      data-testid="proposal-draft-preview-card"
    >
      {extractedFromPdf ? (
        <p className="mb-2 text-xs text-muted-foreground">📎 Extraído de PDF — confira os campos.</p>
      ) : null}
      <ul className="space-y-1">
        {entries.map(([key, value]) => (
          <li key={key}>
            <span className="font-semibold">{key}: </span>
            <span>{String(value).slice(0, 120)}</span>
          </li>
        ))}
      </ul>
      {missingRequired.length > 0 ? (
        <p className="mt-2 text-xs text-amber-600">
          Faltando: {missingRequired.join(', ')}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Verificar passa**

```bash
npm run test -- src/agents/proposal/__tests__/ProposalDraftPreviewCard.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/agents/proposal/ProposalDraftPreviewCard.tsx src/agents/proposal/__tests__/ProposalDraftPreviewCard.test.tsx
git commit -m "feat(proposal): ProposalDraftPreviewCard renderiza patch e campos faltantes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 16: `ProposalSaveConfirmCard`

**Files:**
- Create: `src/agents/proposal/ProposalSaveConfirmCard.tsx`
- Test: `src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx`

- [ ] **Step 1: Escrever testes**

```tsx
// src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProposalSaveConfirmCard } from '../ProposalSaveConfirmCard';

const draft = {
  title: 'Acme SEO',
  clientName: 'Acme',
  projectDescription: 'Otimização',
  value: 'R$ 12.000',
  deadline: '30 dias',
};

describe('ProposalSaveConfirmCard', () => {
  it('renders draft summary fields', () => {
    render(<ProposalSaveConfirmCard draft={draft} onSave={vi.fn()} onAdjust={vi.fn()} saving={false} />);
    expect(screen.getByText(/Acme SEO/)).toBeInTheDocument();
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 12\.000/)).toBeInTheDocument();
  });

  it('calls onSave when Salvar is clicked', () => {
    const onSave = vi.fn();
    render(<ProposalSaveConfirmCard draft={draft} onSave={onSave} onAdjust={vi.fn()} saving={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it('disables Salvar while saving', () => {
    render(<ProposalSaveConfirmCard draft={draft} onSave={vi.fn()} onAdjust={vi.fn()} saving />);
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeDisabled();
  });

  it('calls onAdjust when Ajustar is clicked', () => {
    const onAdjust = vi.fn();
    render(<ProposalSaveConfirmCard draft={draft} onSave={vi.fn()} onAdjust={onAdjust} saving={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Ajustar/i }));
    expect(onAdjust).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar teste falhando**

```bash
npm run test -- src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx
```

- [ ] **Step 3: Implementar**

```tsx
// src/agents/proposal/ProposalSaveConfirmCard.tsx
import { Button } from '@/components/ui/button';
import type { ProposalDraft } from './useProposalDraft';

export interface ProposalSaveConfirmCardProps {
  draft: ProposalDraft;
  saving: boolean;
  onSave: () => void;
  onAdjust: () => void;
}

const FIELDS: Array<keyof ProposalDraft> = ['title', 'clientName', 'value', 'deadline'];

export function ProposalSaveConfirmCard({ draft, saving, onSave, onAdjust }: ProposalSaveConfirmCardProps) {
  return (
    <div
      className="mt-2 rounded-lg border border-border bg-card/40 p-4 text-sm"
      data-testid="proposal-save-confirm-card"
    >
      <h3 className="mb-2 font-display text-base font-semibold">Pronto para salvar?</h3>
      <dl className="space-y-1">
        {FIELDS.map((f) => (
          <div key={f} className="flex gap-2">
            <dt className="font-semibold">{f}:</dt>
            <dd>{draft[f] || '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex gap-2">
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="outline" onClick={onAdjust} disabled={saving}>
          Ajustar
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar passa**

```bash
npm run test -- src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/agents/proposal/ProposalSaveConfirmCard.tsx src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx
git commit -m "feat(proposal): ProposalSaveConfirmCard com botões Salvar/Ajustar

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 17: `ProposalUpdateCard`

**Files:**
- Create: `src/agents/proposal/ProposalUpdateCard.tsx`
- Test: `src/agents/proposal/__tests__/ProposalUpdateCard.test.tsx`

- [ ] **Step 1: Escrever testes**

```tsx
// src/agents/proposal/__tests__/ProposalUpdateCard.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProposalUpdateCard } from '../ProposalUpdateCard';

describe('ProposalUpdateCard', () => {
  it('renders patch keys and values', () => {
    render(
      <ProposalUpdateCard
        proposalId="prop_1"
        patch={{ value: 'R$ 25.000' }}
        applying={false}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/value/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 25\.000/)).toBeInTheDocument();
  });

  it('calls onApply when Aplicar clicked', () => {
    const onApply = vi.fn();
    render(
      <ProposalUpdateCard
        proposalId="prop_1"
        patch={{ value: 'R$ 25.000' }}
        applying={false}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));
    expect(onApply).toHaveBeenCalled();
  });

  it('disables Aplicar while applying', () => {
    render(
      <ProposalUpdateCard
        proposalId="prop_1"
        patch={{ value: 'R$ 25.000' }}
        applying
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Aplicar/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Rodar teste falhando**

- [ ] **Step 3: Implementar**

```tsx
// src/agents/proposal/ProposalUpdateCard.tsx
import { Button } from '@/components/ui/button';
import type { ProposalDraft } from './useProposalDraft';

export interface ProposalUpdateCardProps {
  proposalId: string;
  patch: Partial<ProposalDraft>;
  applying: boolean;
  onApply: () => void;
  onCancel: () => void;
}

export function ProposalUpdateCard({ patch, applying, onApply, onCancel }: ProposalUpdateCardProps) {
  return (
    <div
      className="mt-2 rounded-lg border border-border bg-card/40 p-4 text-sm"
      data-testid="proposal-update-card"
    >
      <h3 className="mb-2 font-display text-base font-semibold">Aplicar alterações?</h3>
      <ul className="space-y-1">
        {Object.entries(patch).map(([key, value]) => (
          <li key={key}>
            <span className="font-semibold">{key}: </span>
            <span>{String(value)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Button onClick={onApply} disabled={applying}>
          {applying ? 'Aplicando...' : 'Aplicar'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={applying}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar passa**

- [ ] **Step 5: Commit**

```bash
git add src/agents/proposal/ProposalUpdateCard.tsx src/agents/proposal/__tests__/ProposalUpdateCard.test.tsx
git commit -m "feat(proposal): ProposalUpdateCard mostra patch e botão Aplicar

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 18: Registrar `proposalAgentConfig` no `AgentRegistry`

**Files:**
- Create: `src/agents/proposal/config.ts`
- Create: `src/agents/proposal/index.ts`
- Modify: `src/agents/registry.ts` (substituir placeholder)

- [ ] **Step 1: Criar `config.ts` com avatar real do Caloni**

```typescript
// src/agents/proposal/config.ts
import { createElement } from 'react';

import type { AgentConfig } from '@/agents/registry';
import { ProposalDraftPreviewCard } from './ProposalDraftPreviewCard';
import { ProposalSaveConfirmCard } from './ProposalSaveConfirmCard';
import { ProposalUpdateCard } from './ProposalUpdateCard';
import { CaloniResultCard } from '@/agents/caloni/CaloniResultCard';
import type { ProposalToolResult } from './types';

export const PROPOSAL_AGENT = {
  id: 'proposta-comercial-smart',
  name: 'Caloni',
  subtitle: 'Decisor Comercial — Proposta',
  avatarSrc: '/caloni-photo.jpg.jpg', // foto real do Lucas Calone
  mission:
    'Converse comigo pra criar, editar ou validar uma proposta. Posso analisar PDFs e te ajudar a refinar o pitch.',
} as const;

// Adapter é construído no ChatToolPage com deps reais (token, draft hook, etc).
// Aqui só configuramos a UI/render do agente.
export const proposalAgentConfig: AgentConfig = {
  id: PROPOSAL_AGENT.id,
  name: PROPOSAL_AGENT.name,
  subtitle: PROPOSAL_AGENT.subtitle,
  avatarSrc: PROPOSAL_AGENT.avatarSrc,
  mission: PROPOSAL_AGENT.mission,
  suggestions: [
    { label: 'Começar proposta nova', action: { kind: 'prefill', text: 'Quero montar uma proposta comercial nova' } },
    { label: 'Editar a última', action: { kind: 'prefill', text: 'Quero ajustar a última proposta que salvei' } },
    { label: 'Validar proposta', action: { kind: 'open-proposal-picker' } },
  ],
  // adapter é injetado em runtime por ChatToolPage (Task 20)
  adapter: { async send() { throw new Error('proposal adapter must be injected at runtime'); } },
  renderResult: (payload: unknown) => {
    const r = payload as ProposalToolResult;
    if (!r) return null;
    if (r.kind === 'proposal_draft_patch') {
      return createElement(ProposalDraftPreviewCard, {
        patch: r.patch,
        missingRequired: r.missing_required,
        extractedFromPdf: false, // ChatToolPage pode override via context
      });
    }
    if (r.kind === 'proposal_validation_report') {
      return createElement(CaloniResultCard, { result: r.report });
    }
    if (r.kind === 'proposal_save_request') {
      // Cards interativos (com handlers) são rendered no ChatToolPage via wrapper
      return null;
    }
    if (r.kind === 'proposal_update_request') {
      return null;
    }
    if (r.kind === 'proposal_open_existing') {
      return null;
    }
    return null;
  },
};
```

> **Nota:** os cards `ProposalSaveConfirmCard` e `ProposalUpdateCard` precisam de handlers (onSave/onApply) que vivem no ChatToolPage. Por isso `renderResult` retorna `null` para esses kinds, e o ChatToolPage faz o render condicional via `onToolResult` callback (Task 20). Cards puros (`DraftPreviewCard`, `ValidationReport`) ficam aqui.

- [ ] **Step 2: Criar `index.ts`**

```typescript
// src/agents/proposal/index.ts
export { proposalAgentConfig, PROPOSAL_AGENT } from './config';
export { useProposalDraft } from './useProposalDraft';
export type { ProposalDraft } from './useProposalDraft';
export type { ProposalToolResult, ProposalAssistantResponse } from './types';
export { createProposalChatAdapter } from './useProposalChatAdapter';
export { ProposalDraftPreviewCard } from './ProposalDraftPreviewCard';
export { ProposalSaveConfirmCard } from './ProposalSaveConfirmCard';
export { ProposalUpdateCard } from './ProposalUpdateCard';
```

- [ ] **Step 3: Substituir placeholder em `agentRegistry`**

`src/agents/registry.ts`:
```typescript
import { proposalAgentConfig } from '@/agents/proposal/config';

export const agentRegistry: Record<string, AgentConfig> = {
  'validacao-caloni': { /* manter por enquanto, removido em Fase 2C */ /* ... */ },
  'proposta-comercial-smart': proposalAgentConfig, // <-- substitui placeholder
  // ...resto
};
```

- [ ] **Step 4: Atualizar teste do registry**

```bash
npm run test -- src/agents/__tests__/registry.test.tsx
```
Esperado: o teste antes assertava placeholder; ajustar pra refletir o agente real.

- [ ] **Step 5: Verificar typecheck e build**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/agents/proposal/config.ts src/agents/proposal/index.ts src/agents/registry.ts src/agents/__tests__/registry.test.tsx
git commit -m "feat(proposal): registrar proposalAgentConfig substituindo placeholder

avatarSrc aponta para /caloni-photo.jpg.jpg (foto real). renderResult cobre
draft_patch e validation_report; cards interativos (save/update) ficam pro
ChatToolPage handler.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 19: Wire-up no `ChatToolPage` (handler de tool_result do proposal)

**Files:**
- Modify: `src/pages/ChatToolPage.tsx`
- Test: `src/pages/__tests__/ChatToolPage.test.tsx` (atualizar)
- Test: `src/pages/__tests__/ChatToolPage.proposal.test.tsx` (novo)

- [ ] **Step 1: Escrever teste de integração para o fluxo proposal**

`src/pages/__tests__/ChatToolPage.proposal.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ChatToolPage from '@/pages/ChatToolPage';

const fetchMock = vi.fn();

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
  localStorage.clear();
});

afterEach(() => vi.restoreAllMocks());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tools/:slug/app/chat" element={<ChatToolPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChatToolPage proposal flow', () => {
  it('renders draft preview after patch_draft tool_call', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reply: 'Anotei. Qual o cliente?',
        tool_result: {
          kind: 'proposal_draft_patch',
          patch: { title: 'Acme SEO' },
          missing_required: ['clientName', 'projectDescription'],
        },
      }),
    } as unknown as Response);

    renderAt('/tools/proposta-comercial-smart/app/chat');

    const composer = await screen.findByRole('textbox');
    await userEvent.type(composer, 'Quero criar proposta SEO Acme');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('proposal-draft-preview-card')).toBeInTheDocument();
    });
    expect(screen.getByText(/Acme SEO/)).toBeInTheDocument();
  });

  it('renders save confirm card when request_save tool_call comes back', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reply: 'Pronto pra salvar?',
        tool_result: {
          kind: 'proposal_save_request',
          draft_summary: { title: 'Acme', clientName: 'Acme', projectDescription: 'X' },
        },
      }),
    } as unknown as Response);

    renderAt('/tools/proposta-comercial-smart/app/chat');
    const composer = await screen.findByRole('textbox');
    await userEvent.type(composer, 'pode salvar');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('proposal-save-confirm-card')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar teste falhando**

```bash
npm run test -- src/pages/__tests__/ChatToolPage.proposal.test.tsx
```

- [ ] **Step 3: Modificar `ChatToolPage` para suportar agentes com `onToolResult`**

Em `src/pages/ChatToolPage.tsx`:
1. Detectar `config.id === proposalAgentConfig.id` e construir adapter dinamicamente.
2. Após cada turno, se `toolResult.kind === 'proposal_draft_patch'` → `useProposalDraft.patch(toolResult.patch)`.
3. Se `kind === 'proposal_save_request'` → renderizar `ProposalSaveConfirmCard` com handlers reais.
4. Se `kind === 'proposal_update_request'` → renderizar `ProposalUpdateCard` com handlers reais.
5. Se `kind === 'proposal_open_existing'` → `navigate(/tools/proposta-comercial-smart/app/${id})`.

Refator alvo (pseudocódigo, ajustar):
```tsx
import { useProposalDraft, createProposalChatAdapter, ProposalSaveConfirmCard, ProposalUpdateCard } from '@/agents/proposal';

// dentro de ConfiguredChatToolPage:
const draftHook = useProposalDraft();
const navigate = useNavigate();

const isProposalAgent = config.id === 'proposta-comercial-smart';

const adapter = isProposalAgent
  ? createProposalChatAdapter({
      authToken: authUser?.token ?? '',
      getDraft: () => draftHook.draft,
      getCurrentProposalId: () => searchParams.get('proposalId'),
      getLastSavedProposalId: () => /* state local */,
      getIntentHint: () => searchParams.get('intent') as any,
    })
  : config.adapter;

// no callback após cada turno:
function handleToolResult(tr: ProposalToolResult | null, message: ChatMessage) {
  if (!tr) return;
  if (tr.kind === 'proposal_draft_patch') {
    draftHook.patch(tr.patch);
  } else if (tr.kind === 'proposal_open_existing') {
    navigate(`/tools/proposta-comercial-smart/app/${tr.proposal_id}`);
  }
  // save_request e update_request renderizam cards no MessageBubble (via render abaixo)
}

// dentro do MessageBubble render:
{message.payload?.kind === 'proposal_save_request' ? (
  <ProposalSaveConfirmCard
    draft={message.payload.draft_summary}
    saving={savingState}
    onSave={() => doSave(message.payload.draft_summary)}
    onAdjust={() => inputRef.current?.setValue('Quero ajustar...')}
  />
) : message.payload?.kind === 'proposal_update_request' ? (
  <ProposalUpdateCard ... />
) : config.renderResult?.(message.payload)}
```

> Detalhamento da integração fica a cargo do implementer; teste do Step 1 valida comportamento end-to-end.

- [ ] **Step 4: Verificar testes passam**

```bash
npm run test -- src/pages/__tests__/ChatToolPage.proposal.test.tsx src/pages/__tests__/ChatToolPage.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/ChatToolPage.tsx src/pages/__tests__/ChatToolPage.proposal.test.tsx
git commit -m "feat(proposal): wire-up no ChatToolPage para agente proposta-comercial-smart

Quando o slug é proposta-comercial-smart, ChatToolPage:
- constrói adapter HTTP injetando draft hook e search params
- aplica patch_draft no useProposalDraft
- renderiza save/update cards inline com handlers reais
- navega em open_existing

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 20: Adicionar rota `/tools/proposta-comercial-smart/app/chat`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Adicionar rota**

Em `src/App.tsx`, dentro do bloco `<ProtectedContent>`/`<Layout>`, antes da rota catch-all `/:slug/app`:
```tsx
<Route
  path="/tools/proposta-comercial-smart/app/chat"
  element={withSuspense(<ChatToolPage />)}
/>
```

`ChatToolPage` lê o slug via `useParams<{ slug }>()`. URL casa com a rota `:slug/app/chat` que pode ser definida explicitamente ou genericamente; a rota explícita aqui evita ambiguidade.

- [ ] **Step 2: Smoke manual**

```bash
npm run dev
# abrir http://localhost:5173/tools/proposta-comercial-smart/app/chat
# verificar foto do Caloni no header e empty state com 3 sugestões
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routes): adicionar /tools/proposta-comercial-smart/app/chat

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 21: Atualizar `ProposalShell` e `ProposalView` para apontar pro chat

**Files:**
- Modify: `src/pages/tools/PropostaComercial/ProposalShell.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalView.tsx`

- [ ] **Step 1: `ProposalShell`** — botão "Nova proposta" navega pra `/app/chat` ao invés de `/app/new`

- [ ] **Step 2: `ProposalView`** — botão "Validar" e "Editar" navegam pra `/app/chat?proposalId={id}&intent=validate|edit`

- [ ] **Step 3: Atualizar testes existentes**

```bash
npm run test -- src/pages/tools/PropostaComercial/
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/tools/PropostaComercial/
git commit -m "feat(proposal): redirecionar Shell/View para o chat unificado

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

# Fase 2C — Limpeza

## Task 22: Deletar `ProposalForm.tsx` e rotas `/new`, `/:id/edit`, `/validate`

**Files:**
- Delete: `src/pages/tools/PropostaComercial/ProposalForm.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Apagar arquivo**

```bash
rm src/pages/tools/PropostaComercial/ProposalForm.tsx
```

- [ ] **Step 2: Remover rotas em `App.tsx`**

Remover do bloco `<Route path="/tools/proposta-comercial-smart/app">`:
- `<Route path="new" element={<ProposalForm />} />`
- `<Route path=":proposalId/edit" element={<ProposalForm />} />`
- `<Route path="validate" element={<LegacyValidationRedirect />} />`

E remover o `lazy` import de `ProposalForm` no topo do arquivo.

- [ ] **Step 3: Verificar build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/tools/PropostaComercial/
git commit -m "chore(proposal): deletar ProposalForm e rotas legadas /new, /:id/edit, /validate

Sem usuários ativos -> sem deprecation. Caminho único é /app/chat.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 23: Deletar diretório `src/pages/tools/ValidacaoCaloni/`

**Files:**
- Delete: todo o diretório
- Modify: `src/App.tsx` (remover rotas de `/tools/validacao-caloni/app`)
- Modify: `src/agents/registry.ts` (remover entrada `validacao-caloni`)

- [ ] **Step 1: Localizar arquivos**

```bash
ls src/pages/tools/ValidacaoCaloni/
```

- [ ] **Step 2: Apagar diretório**

```bash
rm -rf src/pages/tools/ValidacaoCaloni/
```

- [ ] **Step 3: Remover rotas em `App.tsx`**

Remover bloco:
```tsx
<Route path="/tools/validacao-caloni/app" element={<ValidationShell />}>
  <Route index element={<ValidationApp />} />
</Route>
```
E os `lazy` imports `ValidationShell`, `ValidationApp`, `LegacyValidationRedirect`.

- [ ] **Step 4: Remover entrada do registry**

`src/agents/registry.ts`: deletar a entrada `'validacao-caloni': { ... }`.

- [ ] **Step 5: Atualizar testes do registry**

```bash
npm run test -- src/agents/__tests__/registry.test.tsx
```

- [ ] **Step 6: Verificar typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(validacao-caloni): deletar ferramenta separada de validação

Validação foi absorvida pelo proposal-assistant via tool_call request_validation.
Sem usuários ativos -> sem redirect.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 24: Limpar helpers e catálogo

**Files:**
- Modify: `src/features/comercial/toolRoutes.ts` (se existir)
- Modify: `src/pages/Tools.tsx` ou `useTools.ts`

- [ ] **Step 1: Localizar referências órfãs**

```bash
grep -rn "validacao-caloni\|getCaloniValidationAppPath\|getProposalNewPath" src/
```

- [ ] **Step 2: Remover entradas do catálogo de Tools**

Em `Tools.tsx` ou hook `useTools`, remover entrada de `validacao-caloni`. Atualizar entrada de `proposta-comercial-smart` para apontar `appPath: '/tools/proposta-comercial-smart/app/chat'`.

- [ ] **Step 3: Remover helpers órfãos**

`src/features/comercial/toolRoutes.ts`: remover `getCaloniValidationAppPath`, `getProposalNewPath` se ainda existirem.

- [ ] **Step 4: Verificar typecheck e testes**

```bash
npm run typecheck && npm run test
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: limpar helpers órfãos pós-deleção de validacao-caloni e ProposalForm

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

## Task 25: Atualizar documentação (`AGENTS.md` e `CLAUDE.md`)

**Files:**
- Modify: `seven_tools_front/AGENTS.md`
- Modify: `seven_tools_api/AGENTS.md`

- [ ] **Step 1: Atualizar `seven_tools_front/AGENTS.md`**

- Remover qualquer menção a `/tools/validacao-caloni`.
- Documentar nova rota `/tools/proposta-comercial-smart/app/chat`.
- Mencionar `useProposalDraft` e `proposalAgentConfig` na seção de chat.

- [ ] **Step 2: Atualizar `seven_tools_api/AGENTS.md`**

- Remover endpoints `/ai/validate-proposal*`.
- Documentar `POST /ai/proposal-assistant`.
- Mencionar `PROFILES` em `knowledge.py`.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: refletir Fase 2 — proposal-assistant unificado

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

(Repetir o commit no repo `seven_tools_api` para o AGENTS.md de lá.)

## Task 26: Smoke E2E manual (5 cenários)

> Login como `qa.caloni@local.dev`. Backend rodando na branch `feature/ai-proposal-assistant`, frontend na worktree `chat-tool-integration`.

- [ ] **Step 1: Cenário A — Criação progressiva**
  1. Acesse `/tools/proposta-comercial-smart/app/chat`.
  2. Verificar foto do Caloni no header e no empty state.
  3. Mensagem: "Quero criar proposta para Acme, projeto SEO".
  4. Esperado: `ProposalDraftPreviewCard` com title/clientName preenchidos.
  5. Continuar conversa até draft ficar `isSavable`.
  6. Mensagem: "pode salvar" → `ProposalSaveConfirmCard` aparece.
  7. Clicar **Salvar** → toast de sucesso, navega pra `/app/{newId}`.

- [ ] **Step 2: Cenário B — Validação via deep link**
  1. Acesse `/app/{existing-id}/chat?intent=validate&proposalId={id}`.
  2. Esperado: chat envia mensagem inicial automaticamente.
  3. Backend retorna `ValidationReportResult` → `CaloniResultCard` renderiza score.

- [ ] **Step 3: Cenário C — Edição de proposta salva**
  1. Acesse `/app/{id}/chat`.
  2. Mensagem: "muda valor pra 25k".
  3. Esperado: `ProposalUpdateCard` com diff `value`.
  4. Clicar **Aplicar** → reload mostra valor novo.

- [ ] **Step 4: Cenário D — PDF de concorrente**
  1. No chat sem proposta, anexar PDF + texto "analisa esse PDF".
  2. Esperado: `ProposalDraftPreviewCard` com flag "extraído de PDF" e campos extraídos.

- [ ] **Step 5: Cenário E — Aborto**
  1. Mid-stream do turno, clicar **Stop**.
  2. Esperado: composer libera, draft preserva estado anterior, mensagem do assistant marcada `aborted`.

- [ ] **Step 6: Documentar resultado**

Checar/registrar quaisquer regressões. Se algo quebrar, criar tarefa de fix antes de mergear.

## Task 27: PR final frontend

- [ ] **Step 1: Push e PR**

```bash
cd /c/Users/Guiler/Desktop/wks/seven/seven_tools/seven_tools_front/.worktrees/chat-tool-integration
git push -u origin codex/chat-tool-integration
gh pr create --title "feat(chat): unificar criação/edição/validação de proposta em uma tela só" --body "$(cat <<'EOF'
## Summary
- Substituí ferramentas separadas de Validação Caloni e Proposta Comercial por uma rota única `/tools/proposta-comercial-smart/app/chat`.
- Novo `proposalAgentConfig` no AgentRegistry com foto real do Caloni, hooks `useProposalDraft` (localStorage) e `useProposalChatAdapter` (HTTP).
- 4 result cards: DraftPreview, SaveConfirm, Update, ValidationReport (reuso CaloniResultCard).
- Limpeza: deleção de `ProposalForm.tsx`, diretório `ValidacaoCaloni/`, rotas `/new`, `/:id/edit`, `/validate`, `/tools/validacao-caloni/*`.

Backend complementar em PR separado em `feature/ai-proposal-assistant` no repo `seven_tools_api`.

## Test plan
- [ ] `npm run typecheck && npm run test` tudo verde
- [ ] Smoke manual — 5 cenários da Task 26

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review do plano

- **Spec coverage:** todas as seções 4-9 do spec mapeadas em tasks 1-27. Knowledge profile (4.11) → Task 1. Schemas (4.9) → Task 2. Tools (4.10) → Task 3. Prompts (4.12) → Task 4. Provider (4.13) → Task 5. Orquestrador (4.8) → Task 6. validate_proposal_service (4.8 nota) → Task 7. PDF (5.5) → Task 8. Endpoint (4.7) → Task 9. Deleção HTTP (4.7) → Task 10. AgentConfig (4.5) → Task 12. useProposalDraft (4.3) → Task 13. Adapter (4.2) → Task 14. Cards (4.4) → Tasks 15-17. Config + Registry (4.1) → Task 18. ChatToolPage wire-up → Task 19. Rota (4.6) → Task 20. Shell/View redirect → Task 21. Deleções (Fase 2C) → Tasks 22-24. Docs → Task 25. Smoke (8.5) → Task 26. PR → Tasks 11/27.
- **Foto real do Caloni:** explícita em Task 18 (`avatarSrc: '/caloni-photo.jpg.jpg'`) e validada em Task 26 cenário A. Critério de aceitação 9 do spec.
- **Placeholders:** sem TBD/TODO. Onde import path varia ("ajustar conforme repo" em Task 6/7) está flagueado pra implementer com comando `grep` adjacente — não placeholder, é instrução de localização.
- **Type consistency:** `ProposalDraft` definido em Task 13, importado em Tasks 14-17 e 18 com mesmo nome. `ProposalToolResult` definido em Task 14, usado em 18-19. `proposalAgentConfig` exportado em Task 18, importado em Task 18 (registry) e Task 19 (ChatToolPage). Sem divergências.
- **Frequência de commits:** cada task tem 1 commit final (alguns 2 quando há refator atômico). TDD respeitado em tasks com lógica nova (5, 6, 8, 13, 14, 15, 16, 17, 19).
