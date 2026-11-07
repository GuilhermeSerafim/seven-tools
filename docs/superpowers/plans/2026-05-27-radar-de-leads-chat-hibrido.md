# Radar de Leads Chat Hibrido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o Radar de Leads (`qualificacao-de-leads`) em uma ferramenta conversacional com IA para interpretar texto livre, score deterministico, fila priorizada e historico persistente.

**Architecture:** O backend recebe o historico do chat, usa o profile Caloni `lead_qualification` para interpretar leads via tool-calling e cria leads reais pelo service deterministico existente. O frontend registra um agent real para Radar, chama o novo endpoint, renderiza o payload `lead_qualification_queue` e usa a infra existente `ToolChatShell`/`ToolChatSidebar` para novo chat, busca, recentes e reabertura sem nova chamada de IA.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, PostgreSQL, pytest, React 18, TypeScript, Vite, Vitest, shadcn/ui, TailwindCSS.

---

## Scope Check

Esta spec toca backend e frontend, mas os subsistemas sao sequenciais e acoplados por um contrato pequeno: `LeadQualificationAssistantResponse` e o payload `lead_qualification_queue`. O plano deve ser executado em dois repositorios git independentes:

- Backend: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api`
- Frontend: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front`

Nao alterar `sales-copilot-caloni-core`.

## File Structure

Backend:

- Create: `app/modules/ai/prompts/lead_qualification_assistant.py` - regras do assistente de Radar de Leads.
- Modify: `app/modules/ai/schemas.py` - request/response e payload tipado do Radar.
- Modify: `app/modules/ai/tools.py` - tool `qualify_leads`.
- Modify: `app/modules/ai/service.py` - orquestracao hibrida: IA extrai, service deterministico cria e pontua.
- Modify: `app/modules/ai/router.py` - endpoint `POST /api/v1/ai/lead-qualification-assistant`.
- Test: `tests/test_lead_qualification_assistant_dispatch.py` - dispatch/service sem HTTP.
- Test: `tests/test_lead_qualification_assistant_endpoint.py` - rota HTTP e mapeamento de erros.

Frontend:

- Create: `src/agents/leads/types.ts` - tipos e normalizacao do payload.
- Create: `src/agents/leads/adapter.ts` - adapter que chama `/ai/lead-qualification-assistant`.
- Create: `src/agents/leads/LeadQualificationQueueCard.tsx` - card/fila priorizada renderizavel.
- Create: `src/agents/leads/config.ts` - config do agent do Radar.
- Create: `src/agents/leads/index.ts` - barrel export.
- Modify: `src/agents/registry.ts` - registrar config real do Radar.
- Modify: `src/pages/ChatToolPage.tsx` - patch opcional de metadata `lead_ids` quando o Radar criar leads.
- Test: `src/agents/leads/__tests__/adapter.test.ts`
- Test: `src/agents/leads/__tests__/LeadQualificationQueueCard.test.tsx`
- Test: `src/agents/__tests__/registry.test.tsx`
- Test: `src/pages/__tests__/ChatToolPage.sessions.test.tsx`

---

### Task 1: Backend Schemas, Tool Contract, and Prompt

**Files:**
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\app\modules\ai\schemas.py`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\app\modules\ai\tools.py`
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\app\modules\ai\prompts\lead_qualification_assistant.py`
- Test: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\tests\test_lead_qualification_assistant_dispatch.py`

- [ ] **Step 1: Write the failing schema/tool test**

Create `tests/test_lead_qualification_assistant_dispatch.py` with this initial test:

```python
import json
import uuid

from app.models.lead_qualification import LeadAction, LeadQualificationConfig
from app.modules.ai.schemas import LeadQualificationAssistantRequest
from app.modules.ai.service import lead_qualification_assistant_turn


def _mock_completion(reply="ok", tool_name=None, tool_args=None):
    tool_calls = []
    if tool_name:
        tool_calls = [
            {
                "id": "call_1",
                "type": "function",
                "function": {
                    "name": tool_name,
                    "arguments": json.dumps(tool_args or {}),
                },
            }
        ]
    return {"content": reply, "tool_calls": tool_calls}


def _request(content="Qualifique este lead"):
    return LeadQualificationAssistantRequest(
        messages=[{"role": "user", "content": content}],
    )


def _create_config(db, company_id):
    config = LeadQualificationConfig(
        id=uuid.uuid4(),
        company_id=company_id,
        ideal_segments=["Tech", "SaaS"],
        ideal_company_sizes=["11-50", "51-200"],
        ideal_roles=["Founder", "Head of Growth"],
        weight_segment=20,
        weight_company_size=15,
        weight_role=15,
        weight_urgency=20,
        weight_timing=15,
        weight_pain_level=15,
        bronze_max=25,
        silver_max=50,
        gold_max=75,
        bronze_action=LeadAction.nutrir,
        silver_action=LeadAction.revisar_manualmente,
        gold_action=LeadAction.abordar_agora,
        diamond_action=LeadAction.abordar_agora,
    )
    db.add(config)
    db.commit()
    return config


def test_lead_assistant_uses_lead_profile_and_tool_contract(db, sample_user, monkeypatch):
    _create_config(db, sample_user.company_id)
    captured = {}

    def fake_load(profile):
        captured["profile"] = profile
        return "LEAD KNOWLEDGE"

    def fake_call(messages, tools):
        captured["messages"] = messages
        captured["tools"] = tools
        return _mock_completion(reply="Me envie os dados do lead.")

    monkeypatch.setattr("app.modules.ai.service.load_caloni_knowledge", fake_load)
    monkeypatch.setattr("app.modules.ai.service.call_ai_provider_with_tools", fake_call)

    response = lead_qualification_assistant_turn(db, sample_user, _request())

    assert captured["profile"] == "lead_qualification"
    assert captured["messages"][0] == {"role": "system", "content": "LEAD KNOWLEDGE"}
    assert captured["tools"][0]["function"]["name"] == "qualify_leads"
    assert response.reply == "Me envie os dados do lead."
    assert response.tool_result is None
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pytest tests/test_lead_qualification_assistant_dispatch.py::test_lead_assistant_uses_lead_profile_and_tool_contract -v
```

Expected: FAIL with an import error for `LeadQualificationAssistantRequest` or `lead_qualification_assistant_turn`.

- [ ] **Step 3: Add schemas**

In `app/modules/ai/schemas.py`, add this import near the existing imports:

```python
from app.models.lead_qualification import LeadAction, LeadTier
```

Then add this block after `ProposalAssistantResponse`:

```python
class LeadQualificationAssistantRequest(BaseModel):
    messages: list[ChatMessageIn]


class LeadQualificationLeadExtract(BaseModel):
    contact_name: str
    company_name: str
    contact_role: str
    segment: str
    company_size: str
    urgency: str
    timing: str
    pain_level: str
    notes: Optional[str] = None
    qualification_reason: str
    risk: str
    recommended_next_step: str


class LeadQualificationQueueSummary(BaseModel):
    total_leads: int
    highest_score: Optional[int] = None
    primary_action: Optional[LeadAction] = None


class LeadQualificationLeadResult(BaseModel):
    lead_id: str
    company_name: str
    contact_name: str
    contact_role: str
    segment: str
    company_size: str
    urgency: str
    timing: str
    pain_level: str
    notes: Optional[str] = None
    score: int
    tier: LeadTier
    recommended_action: LeadAction
    qualification_reason: str
    risk: str
    recommended_next_step: str


class LeadQualificationQueueResult(BaseModel):
    kind: Literal["lead_qualification_queue"]
    summary: LeadQualificationQueueSummary
    leads: list[LeadQualificationLeadResult]


class LeadQualificationAssistantResponse(BaseModel):
    reply: str
    tool_result: Optional[LeadQualificationQueueResult] = None
```

- [ ] **Step 4: Add the lead qualification tool contract**

In `app/modules/ai/tools.py`, add this block after `PROPOSAL_TOOLS`:

```python
LEAD_QUALIFICATION_LEAD_PROPERTIES = {
    "contact_name": {"type": "string"},
    "company_name": {"type": "string"},
    "contact_role": {"type": "string"},
    "segment": {"type": "string"},
    "company_size": {"type": "string", "enum": ["1-10", "11-50", "51-200", "200+"]},
    "urgency": {"type": "string", "enum": ["alta", "media", "baixa"]},
    "timing": {"type": "string", "enum": ["imediato", "30_dias", "45_dias", "mais_tarde"]},
    "pain_level": {"type": "string", "enum": ["alta", "media", "baixa"]},
    "notes": {"type": "string"},
    "qualification_reason": {"type": "string"},
    "risk": {"type": "string"},
    "recommended_next_step": {"type": "string"},
}

LEAD_QUALIFICATION_REQUIRED_FIELDS = [
    "contact_name",
    "company_name",
    "contact_role",
    "segment",
    "company_size",
    "urgency",
    "timing",
    "pain_level",
    "qualification_reason",
    "risk",
    "recommended_next_step",
]

LEAD_QUALIFICATION_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "qualify_leads",
            "description": (
                "Extrai um ou mais leads completos de texto livre para o backend "
                "criar leads reais e calcular score deterministico. Use somente "
                "quando todos os campos obrigatorios de cada lead estiverem claros."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "leads": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": LEAD_QUALIFICATION_LEAD_PROPERTIES,
                            "required": LEAD_QUALIFICATION_REQUIRED_FIELDS,
                            "additionalProperties": False,
                        },
                        "minItems": 1,
                    }
                },
                "required": ["leads"],
                "additionalProperties": False,
            },
        },
    }
]
```

- [ ] **Step 5: Add the assistant rules prompt**

Create `app/modules/ai/prompts/lead_qualification_assistant.py`:

```python
LEAD_QUALIFICATION_ASSISTANT_RULES = """
Voce e o assistente do Radar de Leads da SEVEN.

Objetivo:
- Interpretar texto livre colado pelo usuario.
- Extrair um ou varios leads completos.
- Usar a ferramenta qualify_leads somente quando os campos obrigatorios estiverem claros.
- Nunca inventar dados essenciais para conseguir chamar a ferramenta.

Campos obrigatorios para cada lead:
- contact_name
- company_name
- contact_role
- segment
- company_size
- urgency
- timing
- pain_level
- qualification_reason
- risk
- recommended_next_step

Valores controlados:
- company_size: "1-10", "11-50", "51-200", "200+"
- urgency: "alta", "media", "baixa"
- timing: "imediato", "30_dias", "45_dias", "mais_tarde"
- pain_level: "alta", "media", "baixa"

Regras:
- Se faltar empresa, contato, cargo, segmento, porte, urgencia, timing ou nivel de dor, responda pedindo os campos faltantes.
- Se houver mais de um lead, chame qualify_leads com todos os leads completos no mesmo tool call.
- Nao atribua score. O backend calcula score, faixa e acao recomendada.
- qualification_reason deve explicar o fit comercial observado.
- risk deve apontar a principal incerteza antes da abordagem.
- recommended_next_step deve ser uma acao curta e operacional para o SDR.
- Mantenha linguagem direta, comercial e sem jargao tecnico.
""".strip()
```

- [ ] **Step 6: Add a minimal service skeleton**

In `app/modules/ai/service.py`, add these imports:

```python
from app.modules.ai.prompts.lead_qualification_assistant import LEAD_QUALIFICATION_ASSISTANT_RULES
from app.modules.ai.tools import LEAD_QUALIFICATION_TOOLS, PROPOSAL_TOOLS
```

Replace the existing import line `from app.modules.ai.tools import PROPOSAL_TOOLS` with the combined import above.

Add this function near `_build_proposal_assistant_messages`:

```python
def _build_lead_qualification_messages(req: LeadQualificationAssistantRequest) -> list[dict]:
    knowledge = load_caloni_knowledge("lead_qualification")
    history = req.messages[-20:]
    return [
        {"role": "system", "content": knowledge},
        {"role": "system", "content": LEAD_QUALIFICATION_ASSISTANT_RULES},
        *_provider_history_messages(history),
    ]
```

Add this temporary function at the end of `service.py`:

```python
def lead_qualification_assistant_turn(
    db: DbSession,
    user,
    req: LeadQualificationAssistantRequest,
) -> LeadQualificationAssistantResponse:
    messages = _build_lead_qualification_messages(req)
    completion = call_ai_provider_with_tools(messages, LEAD_QUALIFICATION_TOOLS)
    return LeadQualificationAssistantResponse(reply=completion.get("content") or "")
```

Also extend the `app.modules.ai.schemas` import list in `service.py` with:

```python
    LeadQualificationAssistantRequest,
    LeadQualificationAssistantResponse,
```

- [ ] **Step 7: Run the test to verify it passes**

Run:

```bash
pytest tests/test_lead_qualification_assistant_dispatch.py::test_lead_assistant_uses_lead_profile_and_tool_contract -v
```

Expected: PASS.

- [ ] **Step 8: Commit backend task 1**

Run from `seven_tools_api`:

```bash
git add app/modules/ai/schemas.py app/modules/ai/tools.py app/modules/ai/prompts/lead_qualification_assistant.py app/modules/ai/service.py tests/test_lead_qualification_assistant_dispatch.py
git commit -m "feat: add lead qualification assistant contract"
```

---

### Task 2: Backend Hybrid Dispatch and Deterministic Lead Creation

**Files:**
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\app\modules\ai\service.py`
- Test: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\tests\test_lead_qualification_assistant_dispatch.py`

- [ ] **Step 1: Add failing tests for no config, deterministic score, and multi-lead sorting**

Append these tests to `tests/test_lead_qualification_assistant_dispatch.py`:

```python
def test_lead_assistant_requires_company_config_without_calling_provider(db, sample_user, monkeypatch):
    def fail_provider(messages, tools):
        raise AssertionError("provider should not be called without lead qualification config")

    monkeypatch.setattr("app.modules.ai.service.call_ai_provider_with_tools", fail_provider)

    response = lead_qualification_assistant_turn(db, sample_user, _request())

    assert response.tool_result is None
    assert "configure" in response.reply.lower()
    assert "radar de leads" in response.reply.lower()


def test_lead_assistant_creates_real_lead_and_ignores_model_score(db, sample_user, monkeypatch):
    _create_config(db, sample_user.company_id)
    monkeypatch.setattr(
        "app.modules.ai.service.call_ai_provider_with_tools",
        lambda messages, tools: _mock_completion(
            reply="Qualifiquei o lead e organizei a prioridade.",
            tool_name="qualify_leads",
            tool_args={
                "leads": [
                    {
                        "contact_name": "Ana Silva",
                        "company_name": "ACME Ltda",
                        "contact_role": "Founder",
                        "segment": "Tech",
                        "company_size": "11-50",
                        "urgency": "alta",
                        "timing": "imediato",
                        "pain_level": "alta",
                        "notes": "Inbound quente",
                        "qualification_reason": "Tem fit com ICP, decisor claro e dor urgente.",
                        "risk": "Validar budget antes da proposta.",
                        "recommended_next_step": "Abordar agora com diagnostico objetivo.",
                        "score": 3,
                    }
                ]
            },
        ),
    )

    response = lead_qualification_assistant_turn(db, sample_user, _request())

    assert response.reply == "Qualifiquei o lead e organizei a prioridade."
    assert response.tool_result.kind == "lead_qualification_queue"
    assert response.tool_result.summary.total_leads == 1
    assert response.tool_result.summary.highest_score == 100
    assert response.tool_result.summary.primary_action == LeadAction.abordar_agora
    lead = response.tool_result.leads[0]
    assert lead.company_name == "ACME Ltda"
    assert lead.score == 100
    assert lead.tier.value == "diamond"
    assert lead.recommended_action == LeadAction.abordar_agora
    assert lead.qualification_reason == "Tem fit com ICP, decisor claro e dor urgente."
    assert lead.risk == "Validar budget antes da proposta."
    assert lead.recommended_next_step == "Abordar agora com diagnostico objetivo."
    assert uuid.UUID(lead.lead_id)


def test_lead_assistant_returns_multiple_leads_sorted_by_score(db, sample_user, monkeypatch):
    _create_config(db, sample_user.company_id)
    monkeypatch.setattr(
        "app.modules.ai.service.call_ai_provider_with_tools",
        lambda messages, tools: _mock_completion(
            reply="Montei a fila priorizada.",
            tool_name="qualify_leads",
            tool_args={
                "leads": [
                    {
                        "contact_name": "Bruno Baixo",
                        "company_name": "Loja Delta",
                        "contact_role": "Analista",
                        "segment": "Varejo",
                        "company_size": "1-10",
                        "urgency": "baixa",
                        "timing": "mais_tarde",
                        "pain_level": "baixa",
                        "notes": "Lead frio",
                        "qualification_reason": "Poucos sinais de fit com o ICP configurado.",
                        "risk": "Pode consumir tempo comercial sem prioridade real.",
                        "recommended_next_step": "Nutrir com conteudo e revisar depois.",
                    },
                    {
                        "contact_name": "Carla Forte",
                        "company_name": "SaaS Forte",
                        "contact_role": "Founder",
                        "segment": "SaaS",
                        "company_size": "51-200",
                        "urgency": "alta",
                        "timing": "30_dias",
                        "pain_level": "alta",
                        "notes": "Pedido veio por indicacao",
                        "qualification_reason": "Fit alto, decisora e problema urgente.",
                        "risk": "Confirmar processo de decisao e verba.",
                        "recommended_next_step": "Abordar agora e agendar diagnostico.",
                    },
                ]
            },
        ),
    )

    response = lead_qualification_assistant_turn(db, sample_user, _request("Tenho dois leads"))

    assert [lead.company_name for lead in response.tool_result.leads] == ["SaaS Forte", "Loja Delta"]
    assert [lead.score for lead in response.tool_result.leads] == [100, 0]
    assert response.tool_result.summary.total_leads == 2
    assert response.tool_result.summary.highest_score == 100
    assert response.tool_result.summary.primary_action == LeadAction.abordar_agora
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pytest tests/test_lead_qualification_assistant_dispatch.py -v
```

Expected: FAIL because the service skeleton does not check config, parse tool calls, create leads, or return a queue payload.

- [ ] **Step 3: Implement hybrid dispatch**

In `app/modules/ai/service.py`, add these imports:

```python
from app.modules.lead_qualification.service import create_lead, get_config_by_company_id
```

Extend the schemas import with:

```python
    LeadQualificationLeadExtract,
    LeadQualificationLeadResult,
    LeadQualificationQueueResult,
    LeadQualificationQueueSummary,
```

Add these helper functions before `lead_qualification_assistant_turn`:

```python
def _lead_config_missing_reply() -> str:
    return (
        "Antes de qualificar leads no Radar de Leads, configure o metodo da empresa: "
        "ICP, pesos, faixas e acoes recomendadas."
    )


def _lead_missing_data_reply() -> str:
    return (
        "Para qualificar com seguranca, preciso de empresa, contato, cargo, segmento, "
        "porte, urgencia, timing e nivel de dor de cada lead."
    )


def _lead_extract_to_create_payload(lead: LeadQualificationLeadExtract) -> dict:
    return {
        "contact_name": lead.contact_name,
        "company_name": lead.company_name,
        "contact_role": lead.contact_role,
        "segment": lead.segment,
        "company_size": lead.company_size,
        "urgency": lead.urgency,
        "timing": lead.timing,
        "pain_level": lead.pain_level,
        "notes": lead.notes,
    }


def _lead_result_from_created(
    created,
    extracted: LeadQualificationLeadExtract,
) -> LeadQualificationLeadResult:
    return LeadQualificationLeadResult(
        lead_id=str(created.id),
        company_name=created.company_name,
        contact_name=created.contact_name,
        contact_role=created.contact_role,
        segment=created.segment,
        company_size=created.company_size,
        urgency=created.urgency,
        timing=created.timing,
        pain_level=created.pain_level,
        notes=created.notes,
        score=created.score,
        tier=created.tier,
        recommended_action=created.recommended_action,
        qualification_reason=extracted.qualification_reason,
        risk=extracted.risk,
        recommended_next_step=extracted.recommended_next_step,
    )


def _parse_lead_extracts(args: dict) -> list[LeadQualificationLeadExtract]:
    raw_leads = args.get("leads")
    if not isinstance(raw_leads, list):
        return []

    leads: list[LeadQualificationLeadExtract] = []
    for raw_lead in raw_leads:
        if not isinstance(raw_lead, dict):
            continue
        try:
            leads.append(LeadQualificationLeadExtract(**raw_lead))
        except ValidationError:
            continue
    return leads


def _lead_queue_reply(reply: str, total: int) -> str:
    if reply.strip():
        return reply
    if total == 1:
        return "Qualifiquei o lead e montei a prioridade abaixo."
    return f"Qualifiquei {total} leads e montei a fila priorizada abaixo."
```

Replace the temporary `lead_qualification_assistant_turn` with:

```python
def lead_qualification_assistant_turn(
    db: DbSession,
    user,
    req: LeadQualificationAssistantRequest,
) -> LeadQualificationAssistantResponse:
    if user.company_id is None or get_config_by_company_id(db, user.company_id) is None:
        return LeadQualificationAssistantResponse(reply=_lead_config_missing_reply())

    messages = _build_lead_qualification_messages(req)
    completion = call_ai_provider_with_tools(messages, LEAD_QUALIFICATION_TOOLS)
    reply = completion.get("content") or ""
    parsed_tool_call = _parse_tool_call(completion.get("tool_calls") or [])

    if parsed_tool_call is None:
        return LeadQualificationAssistantResponse(reply=reply)

    tool_name, args = parsed_tool_call
    if tool_name != "qualify_leads":
        return LeadQualificationAssistantResponse(reply=reply)

    extracted_leads = _parse_lead_extracts(args)
    if not extracted_leads:
        return LeadQualificationAssistantResponse(reply=reply or _lead_missing_data_reply())

    created_results = [
        _lead_result_from_created(
            create_lead(db, user, _lead_extract_to_create_payload(extracted)),
            extracted,
        )
        for extracted in extracted_leads
    ]
    created_results.sort(key=lambda lead: lead.score, reverse=True)
    top_lead = created_results[0] if created_results else None
    queue = LeadQualificationQueueResult(
        kind="lead_qualification_queue",
        summary=LeadQualificationQueueSummary(
            total_leads=len(created_results),
            highest_score=top_lead.score if top_lead is not None else None,
            primary_action=top_lead.recommended_action if top_lead is not None else None,
        ),
        leads=created_results,
    )
    return LeadQualificationAssistantResponse(
        reply=_lead_queue_reply(reply, len(created_results)),
        tool_result=queue,
    )
```

- [ ] **Step 4: Run backend dispatch tests**

Run:

```bash
pytest tests/test_lead_qualification_assistant_dispatch.py -v
```

Expected: PASS for all tests in this file.

- [ ] **Step 5: Run existing lead qualification tests**

Run:

```bash
pytest tests/test_lead_qualification.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit backend task 2**

Run from `seven_tools_api`:

```bash
git add app/modules/ai/service.py tests/test_lead_qualification_assistant_dispatch.py
git commit -m "feat: qualify leads through hybrid assistant"
```

---

### Task 3: Backend HTTP Endpoint

**Files:**
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\app\modules\ai\router.py`
- Test: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\tests\test_lead_qualification_assistant_endpoint.py`

- [ ] **Step 1: Write failing endpoint tests**

Create `tests/test_lead_qualification_assistant_endpoint.py`:

```python
import httpx
import uuid
from unittest.mock import patch

from app.models.lead_qualification import LeadAction, LeadQualificationConfig


def _provider_error(status_code, headers=None):
    request = httpx.Request("POST", "https://provider.test")
    return httpx.HTTPStatusError(
        "provider error",
        request=request,
        response=httpx.Response(status_code, headers=headers or {}, request=request),
    )


def _create_config(db, company_id):
    db.add(
        LeadQualificationConfig(
            id=uuid.uuid4(),
            company_id=company_id,
            ideal_segments=["Tech"],
            ideal_company_sizes=["11-50"],
            ideal_roles=["Founder"],
            weight_segment=20,
            weight_company_size=15,
            weight_role=15,
            weight_urgency=20,
            weight_timing=15,
            weight_pain_level=15,
            bronze_max=25,
            silver_max=50,
            gold_max=75,
            bronze_action=LeadAction.nutrir,
            silver_action=LeadAction.revisar_manualmente,
            gold_action=LeadAction.abordar_agora,
            diamond_action=LeadAction.abordar_agora,
        )
    )
    db.commit()


def test_lead_qualification_assistant_endpoint_requires_auth(client):
    response = client.post(
        "/api/v1/ai/lead-qualification-assistant",
        json={"messages": [{"role": "user", "content": "Lead ACME"}]},
    )

    assert response.status_code == 401


def test_lead_qualification_assistant_endpoint_returns_reply(client, db, sample_user, auth_headers):
    _create_config(db, sample_user.company_id)
    body = {"messages": [{"role": "user", "content": "Lead ACME incompleto"}]}

    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        return_value={"content": "Preciso do porte e timing.", "tool_calls": []},
    ):
        response = client.post(
            "/api/v1/ai/lead-qualification-assistant",
            json=body,
            headers=auth_headers,
        )

    assert response.status_code == 200
    assert response.json() == {"reply": "Preciso do porte e timing.", "tool_result": None}


def test_lead_qualification_assistant_endpoint_maps_provider_503(client, db, sample_user, auth_headers):
    _create_config(db, sample_user.company_id)
    with patch(
        "app.modules.ai.service.call_ai_provider_with_tools",
        side_effect=_provider_error(503),
    ):
        response = client.post(
            "/api/v1/ai/lead-qualification-assistant",
            json={"messages": [{"role": "user", "content": "Lead ACME"}]},
            headers=auth_headers,
        )

    assert response.status_code == 504
    assert response.json()["detail"] == "provider_unavailable"
```

- [ ] **Step 2: Run endpoint tests to verify they fail**

Run:

```bash
pytest tests/test_lead_qualification_assistant_endpoint.py -v
```

Expected: FAIL with 404 for `/api/v1/ai/lead-qualification-assistant`.

- [ ] **Step 3: Add endpoint to router**

In `app/modules/ai/router.py`, extend imports:

```python
from app.modules.ai.schemas import (
    LeadQualificationAssistantRequest,
    LeadQualificationAssistantResponse,
    ProposalAssistantRequest,
    ProposalAssistantResponse,
)
from app.modules.ai.service import diagnose, lead_qualification_assistant_turn, proposal_assistant_turn
```

Keep existing imports that are still used.

Add this route after `proposal_assistant_endpoint`:

```python
@router.post(
    "/lead-qualification-assistant",
    response_model=LeadQualificationAssistantResponse,
    dependencies=[Depends(_require_authorization_header)],
    responses={
        429: {"description": "Provider rate limit reached"},
        502: {"description": "Provider authentication or gateway error"},
        504: {"description": "Provider timeout or unavailable"},
    },
)
def lead_qualification_assistant_endpoint(
    req: LeadQualificationAssistantRequest,
    db: DbSession = Depends(get_db),
    user: User = Depends(get_current_approved_user),
) -> LeadQualificationAssistantResponse:
    try:
        return lead_qualification_assistant_turn(db, user, req)
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code
        if status_code == 429:
            raise HTTPException(
                status_code=429,
                detail={
                    "detail": "rate_limited",
                    "retry_after_s": _parse_retry_after_seconds(
                        exc.response.headers.get("retry-after"),
                    ),
                },
            )
        if status_code in (401, 403):
            raise HTTPException(status_code=502, detail="provider_error")
        if status_code >= 500:
            raise HTTPException(status_code=504, detail="provider_unavailable")
        raise HTTPException(status_code=status_code, detail="provider_error")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="provider_unavailable")
```

- [ ] **Step 4: Run endpoint tests**

Run:

```bash
pytest tests/test_lead_qualification_assistant_endpoint.py -v
```

Expected: PASS.

- [ ] **Step 5: Run proposal assistant endpoint regression tests**

Run:

```bash
pytest tests/test_proposal_assistant_endpoint.py tests/test_proposal_assistant_dispatch.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit backend task 3**

Run from `seven_tools_api`:

```bash
git add app/modules/ai/router.py tests/test_lead_qualification_assistant_endpoint.py
git commit -m "feat: expose lead qualification assistant endpoint"
```

---

### Task 4: Frontend Lead Adapter and Payload Types

**Files:**
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\leads\types.ts`
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\leads\adapter.ts`
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\leads\index.ts`
- Test: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\leads\__tests__\adapter.test.ts`

- [ ] **Step 1: Write failing adapter test**

Create `src/agents/leads/__tests__/adapter.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createLeadQualificationChatAdapter } from '../adapter';

describe('createLeadQualificationChatAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('posts chat history to the lead qualification assistant endpoint', async () => {
    localStorage.setItem('seventools_token', 'token-leads');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reply: 'Fila priorizada pronta.',
          tool_result: {
            kind: 'lead_qualification_queue',
            summary: {
              total_leads: 1,
              highest_score: 100,
              primary_action: 'abordar_agora',
            },
            leads: [
              {
                lead_id: 'lead-1',
                company_name: 'ACME',
                contact_name: 'Ana',
                contact_role: 'Founder',
                segment: 'Tech',
                company_size: '11-50',
                urgency: 'alta',
                timing: 'imediato',
                pain_level: 'alta',
                notes: 'Inbound',
                score: 100,
                tier: 'diamond',
                recommended_action: 'abordar_agora',
                qualification_reason: 'Fit alto.',
                risk: 'Validar budget.',
                recommended_next_step: 'Abordar agora.',
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = createLeadQualificationChatAdapter({
      apiBaseUrl: 'http://api.test/api/v1',
    });

    const response = await adapter.send(
      {
        text: 'Ana da ACME',
        attachments: [],
        history: [
          { id: 'm1', role: 'user', content: 'Ana da ACME', createdAt: 1 },
        ],
      },
      new AbortController().signal,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/ai/lead-qualification-assistant',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-leads',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Ana da ACME', attachments: [] }],
        }),
      }),
    );
    expect(response.text).toBe('Fila priorizada pronta.');
    expect(response.payload).toEqual(expect.objectContaining({ kind: 'lead_qualification_queue' }));
  });

  it('throws when the endpoint returns an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 503 })));
    const adapter = createLeadQualificationChatAdapter({
      apiBaseUrl: 'http://api.test/api/v1',
    });

    await expect(
      adapter.send({ text: 'Lead', attachments: [] }, new AbortController().signal),
    ).rejects.toThrow('Lead qualification assistant request failed with status 503');
  });
});
```

- [ ] **Step 2: Run adapter test to verify it fails**

Run from `seven_tools_front`:

```bash
npm run test -- src/agents/leads/__tests__/adapter.test.ts
```

Expected: FAIL because `src/agents/leads/adapter.ts` does not exist.

- [ ] **Step 3: Add lead payload types**

Create `src/agents/leads/types.ts`:

```ts
export type LeadQualificationAction =
  | 'abordar_agora'
  | 'revisar_manualmente'
  | 'nutrir'
  | 'descartar';

export type LeadQualificationTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LeadQualificationQueueSummary {
  totalLeads: number;
  highestScore: number | null;
  primaryAction: LeadQualificationAction | null;
}

export interface LeadQualificationQueueLead {
  leadId: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  segment: string;
  companySize: string;
  urgency: string;
  timing: string;
  painLevel: string;
  notes: string | null;
  score: number;
  tier: LeadQualificationTier;
  recommendedAction: LeadQualificationAction;
  qualificationReason: string;
  risk: string;
  recommendedNextStep: string;
}

export interface LeadQualificationQueuePayload {
  kind: 'lead_qualification_queue';
  summary: LeadQualificationQueueSummary;
  leads: LeadQualificationQueueLead[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, snakeKey: string, camelKey: string): string {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === 'string' ? value : '';
}

function readNullableString(record: Record<string, unknown>, snakeKey: string, camelKey: string): string | null {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === 'string' && value.trim() ? value : null;
}

function readNumber(record: Record<string, unknown>, snakeKey: string, camelKey: string): number {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readNullableNumber(record: Record<string, unknown>, snakeKey: string, camelKey: string): number | null {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeAction(value: string): LeadQualificationAction {
  if (
    value === 'abordar_agora' ||
    value === 'revisar_manualmente' ||
    value === 'nutrir' ||
    value === 'descartar'
  ) {
    return value;
  }
  return 'revisar_manualmente';
}

function normalizeTier(value: string): LeadQualificationTier {
  if (value === 'bronze' || value === 'silver' || value === 'gold' || value === 'diamond') {
    return value;
  }
  return 'bronze';
}

export function normalizeLeadQualificationQueuePayload(
  payload: unknown,
): LeadQualificationQueuePayload | null {
  if (!isRecord(payload) || payload.kind !== 'lead_qualification_queue') {
    return null;
  }

  const rawSummary = isRecord(payload.summary) ? payload.summary : {};
  const rawLeads = Array.isArray(payload.leads) ? payload.leads : [];
  const leads = rawLeads.filter(isRecord).map((lead) => ({
    leadId: readString(lead, 'lead_id', 'leadId'),
    companyName: readString(lead, 'company_name', 'companyName'),
    contactName: readString(lead, 'contact_name', 'contactName'),
    contactRole: readString(lead, 'contact_role', 'contactRole'),
    segment: readString(lead, 'segment', 'segment'),
    companySize: readString(lead, 'company_size', 'companySize'),
    urgency: readString(lead, 'urgency', 'urgency'),
    timing: readString(lead, 'timing', 'timing'),
    painLevel: readString(lead, 'pain_level', 'painLevel'),
    notes: readNullableString(lead, 'notes', 'notes'),
    score: readNumber(lead, 'score', 'score'),
    tier: normalizeTier(readString(lead, 'tier', 'tier')),
    recommendedAction: normalizeAction(readString(lead, 'recommended_action', 'recommendedAction')),
    qualificationReason: readString(lead, 'qualification_reason', 'qualificationReason'),
    risk: readString(lead, 'risk', 'risk'),
    recommendedNextStep: readString(lead, 'recommended_next_step', 'recommendedNextStep'),
  }));

  return {
    kind: 'lead_qualification_queue',
    summary: {
      totalLeads: readNumber(rawSummary, 'total_leads', 'totalLeads') || leads.length,
      highestScore: readNullableNumber(rawSummary, 'highest_score', 'highestScore'),
      primaryAction: normalizeAction(readString(rawSummary, 'primary_action', 'primaryAction')),
    },
    leads,
  };
}
```

- [ ] **Step 4: Add adapter**

Create `src/agents/leads/adapter.ts`:

```ts
import type { AgentAdapter, AgentInput } from '@/agents/caloni/adapter';
import { API_BASE_URL, getStoredToken } from '@/lib/apiClient';

interface LeadQualificationChatAdapterDeps {
  apiBaseUrl?: string;
}

interface AssistantMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: Array<{
    filename: string;
    mime_type: string;
    size_bytes: number;
    text_content?: string | null;
  }>;
}

interface LeadQualificationAssistantResponse {
  reply: string;
  tool_result: unknown | null;
}

function removeTrailingSlashes(value: string): string {
  let endIndex = value.length;
  while (endIndex > 0 && value[endIndex - 1] === '/') {
    endIndex -= 1;
  }
  return value.slice(0, endIndex);
}

function removeLeadingSlashes(value: string): string {
  let startIndex = 0;
  while (startIndex < value.length && value[startIndex] === '/') {
    startIndex += 1;
  }
  return value.slice(startIndex);
}

function buildApiUrl(baseUrl: string, path: string): string {
  return `${removeTrailingSlashes(baseUrl)}/${removeLeadingSlashes(path)}`;
}

function attachmentToAssistantInput(attachment: AgentInput['attachments'][number]) {
  const fileWithText = attachment.file as File & { textContent?: string };
  return {
    filename: attachment.name,
    mime_type: attachment.file.type || 'application/octet-stream',
    size_bytes: attachment.sizeBytes,
    text_content: fileWithText.textContent ?? null,
  };
}

function messageToAssistantInput(
  message: NonNullable<AgentInput['history']>[number],
  attachments: AssistantMessageInput['attachments'] = [],
): AssistantMessageInput {
  return {
    role: message.role,
    content: typeof message.content === 'string' ? message.content : String(message.content ?? ''),
    attachments,
  };
}

function buildMessages(input: AgentInput): AssistantMessageInput[] {
  const latestAttachments = input.attachments.map(attachmentToAssistantInput);
  const history = input.history ?? [];
  if (!history.length) {
    return [
      {
        role: 'user',
        content: input.text,
        attachments: latestAttachments,
      },
    ];
  }

  return history.map((message, index) =>
    messageToAssistantInput(
      message,
      index === history.length - 1 && message.role === 'user' ? latestAttachments : [],
    ),
  );
}

export function createLeadQualificationChatAdapter(
  deps: LeadQualificationChatAdapterDeps = {},
): AgentAdapter {
  return {
    async send(input, signal) {
      const authToken = getStoredToken() || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(
        buildApiUrl(deps.apiBaseUrl ?? API_BASE_URL, '/ai/lead-qualification-assistant'),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: buildMessages(input) }),
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Lead qualification assistant request failed with status ${response.status}`);
      }

      const data = (await response.json()) as LeadQualificationAssistantResponse;
      return {
        text: data.reply,
        ...(data.tool_result !== null ? { payload: data.tool_result } : {}),
      };
    },
  };
}
```

- [ ] **Step 5: Add barrel export**

Create `src/agents/leads/index.ts`:

```ts
export * from './adapter';
export * from './types';
```

- [ ] **Step 6: Run adapter tests**

Run:

```bash
npm run test -- src/agents/leads/__tests__/adapter.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit frontend task 4**

Run from `seven_tools_front`:

```bash
git add src/agents/leads
git commit -m "feat: add lead qualification chat adapter"
```

---

### Task 5: Frontend Queue Card and Agent Config

**Files:**
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\leads\LeadQualificationQueueCard.tsx`
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\leads\config.ts`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\leads\index.ts`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\registry.ts`
- Test: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\leads\__tests__\LeadQualificationQueueCard.test.tsx`
- Test: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\__tests__\registry.test.tsx`

- [ ] **Step 1: Write failing card tests**

Create `src/agents/leads/__tests__/LeadQualificationQueueCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LeadQualificationQueueCard } from '../LeadQualificationQueueCard';

const snakePayload = {
  kind: 'lead_qualification_queue',
  summary: {
    total_leads: 1,
    highest_score: 100,
    primary_action: 'abordar_agora',
  },
  leads: [
    {
      lead_id: 'lead-1',
      company_name: 'ACME',
      contact_name: 'Ana Silva',
      contact_role: 'Founder',
      segment: 'Tech',
      company_size: '11-50',
      urgency: 'alta',
      timing: 'imediato',
      pain_level: 'alta',
      notes: 'Inbound',
      score: 100,
      tier: 'diamond',
      recommended_action: 'abordar_agora',
      qualification_reason: 'Fit alto com ICP e timing curto.',
      risk: 'Validar budget.',
      recommended_next_step: 'Abordar agora.',
    },
  ],
};

const camelPayload = {
  kind: 'lead_qualification_queue',
  summary: {
    totalLeads: 1,
    highestScore: 75,
    primaryAction: 'revisar_manualmente',
  },
  leads: [
    {
      leadId: 'lead-2',
      companyName: 'Beta',
      contactName: 'Bruno',
      contactRole: 'Head of Growth',
      segment: 'SaaS',
      companySize: '51-200',
      urgency: 'media',
      timing: '45_dias',
      painLevel: 'media',
      notes: null,
      score: 75,
      tier: 'gold',
      recommendedAction: 'revisar_manualmente',
      qualificationReason: 'Boa aderencia, mas timing menos urgente.',
      risk: 'Confirmar prioridade interna.',
      recommendedNextStep: 'Revisar manualmente.',
    },
  ],
};

describe('LeadQualificationQueueCard', () => {
  it('renders snake_case payload returned directly by the assistant', () => {
    render(<LeadQualificationQueueCard payload={snakePayload} />);

    expect(screen.getByTestId('lead-qualification-queue-card')).toBeInTheDocument();
    expect(screen.getByText('Fila priorizada')).toBeInTheDocument();
    expect(screen.getByText('ACME')).toBeInTheDocument();
    expect(screen.getByText('100/100')).toBeInTheDocument();
    expect(screen.getByText('Diamante')).toBeInTheDocument();
    expect(screen.getByText('Abordar agora')).toBeInTheDocument();
    expect(screen.getByText('Fit alto com ICP e timing curto.')).toBeInTheDocument();
    expect(screen.getByText('Validar budget.')).toBeInTheDocument();
  });

  it('renders camelCase payload rehydrated from persisted history', () => {
    render(<LeadQualificationQueueCard payload={camelPayload} />);

    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
    expect(screen.getByText('Ouro')).toBeInTheDocument();
    expect(screen.getByText('Revisar manualmente')).toBeInTheDocument();
    expect(screen.getByText('Confirmar prioridade interna.')).toBeInTheDocument();
  });

  it('returns null for invalid payloads', () => {
    const { container } = render(<LeadQualificationQueueCard payload={{ kind: 'other' }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run card test to verify it fails**

Run:

```bash
npm run test -- src/agents/leads/__tests__/LeadQualificationQueueCard.test.tsx
```

Expected: FAIL because `LeadQualificationQueueCard.tsx` does not exist.

- [ ] **Step 3: Implement queue card**

Create `src/agents/leads/LeadQualificationQueueCard.tsx`:

```tsx
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ACTION_LABELS, TIER_LABELS } from '@/features/comercial/leadQualificationLabels';
import { getLeadQualificationDetailPath } from '@/features/comercial/toolRoutes';
import { normalizeLeadQualificationQueuePayload } from './types';

interface LeadQualificationQueueCardProps {
  payload: unknown;
}

export function LeadQualificationQueueCard({ payload }: LeadQualificationQueueCardProps) {
  const queue = normalizeLeadQualificationQueuePayload(payload);
  if (!queue) {
    return null;
  }

  return (
    <section
      data-testid="lead-qualification-queue-card"
      className="mt-4 overflow-hidden rounded-lg border border-border/30 bg-card"
    >
      <div className="border-b border-border/30 bg-background/60 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Fila priorizada</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {queue.summary.totalLeads} lead{queue.summary.totalLeads === 1 ? '' : 's'} qualificado
              {queue.summary.highestScore !== null ? ` · maior score ${queue.summary.highestScore}/100` : ''}
            </p>
          </div>
          {queue.summary.primaryAction ? (
            <Badge variant="outline">{ACTION_LABELS[queue.summary.primaryAction]}</Badge>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {queue.leads.map((lead) => (
          <article key={lead.leadId || `${lead.companyName}-${lead.contactName}`} className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display text-lg font-semibold text-foreground">{lead.companyName}</h4>
                  <Badge variant="secondary">{TIER_LABELS[lead.tier]}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lead.contactName} · {lead.contactRole} · {lead.segment}
                </p>
              </div>
              <div className="shrink-0 text-left lg:text-right">
                <p className="text-2xl font-semibold text-foreground">{lead.score}/100</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {ACTION_LABELS[lead.recommendedAction]}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border/30 bg-background/60 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Motivo</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{lead.qualificationReason}</p>
              </div>
              <div className="rounded-md border border-border/30 bg-background/60 p-3">
                <p className="flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Risco
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">{lead.risk}</p>
              </div>
              <div className="rounded-md border border-border/30 bg-background/60 p-3">
                <p className="flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Proxima acao
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">{lead.recommendedNextStep}</p>
              </div>
            </div>

            {lead.leadId ? (
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={getLeadQualificationDetailPath(lead.leadId)}>
                    Abrir lead
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add agent config**

Create `src/agents/leads/config.ts`:

```tsx
import { createElement } from 'react';

import type { AgentConfig } from '@/agents/registry';
import { LeadQualificationQueueCard } from './LeadQualificationQueueCard';
import { createLeadQualificationChatAdapter } from './adapter';
import { normalizeLeadQualificationQueuePayload } from './types';

export const leadQualificationAgentConfig: AgentConfig = {
  id: 'qualificacao-de-leads',
  name: 'Radar de Leads',
  subtitle: 'Qualificacao e prioridade comercial',
  avatarSrc: '/caloni-photo.jpg.jpg',
  mission:
    'Cole dados de um ou varios leads. Eu organizo a fila, calculo a prioridade pelo metodo configurado e aponto risco e proxima acao.',
  suggestions: [
    {
      label: 'Qualificar lead',
      action: {
        kind: 'prefill',
        text: 'Quero qualificar este lead: ',
      },
    },
    {
      label: 'Priorizar lista',
      action: {
        kind: 'prefill',
        text: 'Tenho estes leads para priorizar: ',
      },
    },
    {
      label: 'Ver dados necessários',
      action: {
        kind: 'prefill',
        text: 'Quais dados voce precisa para qualificar um lead?',
      },
    },
  ],
  adapter: createLeadQualificationChatAdapter(),
  renderResult: (payload) => {
    if (!normalizeLeadQualificationQueuePayload(payload)) {
      return null;
    }
    return createElement(LeadQualificationQueueCard, { payload });
  },
};
```

Update `src/agents/leads/index.ts`:

```ts
export * from './adapter';
export * from './config';
export * from './LeadQualificationQueueCard';
export * from './types';
```

- [ ] **Step 5: Update registry tests first**

In `src/agents/__tests__/registry.test.tsx`, replace the test named `contem placeholders para as ferramentas ainda nao migradas` with:

```tsx
  it('contem placeholder apenas para diagnostico e config real para Radar de Leads', () => {
    expect(agentRegistry['diagnostico-comercial-caloni']).toBeDefined();
    expect(agentRegistry['diagnostico-comercial-caloni'].name).toBe('Raio-X Comercial');

    const radar = agentRegistry['qualificacao-de-leads'];
    expect(radar).toBeDefined();
    expect(radar.id).toBe('qualificacao-de-leads');
    expect(radar.name).toBe('Radar de Leads');
    expect(radar.subtitle).toContain('Qualificacao');
    expect(radar.suggestions.length).toBeGreaterThan(0);
  });
```

Replace the last test `placeholders retornam mensagem de nao migrado sem chamar backend` with:

```tsx
  it('placeholder de diagnostico retorna mensagem de nao migrado sem chamar backend', async () => {
    const cfg = agentRegistry['diagnostico-comercial-caloni'];
    const ctrl = new AbortController();
    const res = await cfg.adapter.send({ text: 'oi', attachments: [] }, ctrl.signal);
    expect(res.text).toMatch(/nao foi migrada|construcao|fluxo antigo/i);
  });
```

Add this test before `mantem configs validas sem onToolResult`:

```tsx
  it('renderiza payload de fila do Radar de Leads', () => {
    const cfg = agentRegistry['qualificacao-de-leads'];

    render(
      <div>
        {cfg.renderResult?.({
          kind: 'lead_qualification_queue',
          summary: {
            total_leads: 1,
            highest_score: 100,
            primary_action: 'abordar_agora',
          },
          leads: [
            {
              lead_id: 'lead-1',
              company_name: 'ACME',
              contact_name: 'Ana Silva',
              contact_role: 'Founder',
              segment: 'Tech',
              company_size: '11-50',
              urgency: 'alta',
              timing: 'imediato',
              pain_level: 'alta',
              score: 100,
              tier: 'diamond',
              recommended_action: 'abordar_agora',
              qualification_reason: 'Fit alto.',
              risk: 'Validar budget.',
              recommended_next_step: 'Abordar agora.',
            },
          ],
        })}
      </div>,
    );

    expect(screen.getByTestId('lead-qualification-queue-card')).toBeInTheDocument();
    expect(screen.getByText('ACME')).toBeInTheDocument();
  });
```

- [ ] **Step 6: Replace Radar registry config**

In `src/agents/registry.ts`, add:

```ts
import { leadQualificationAgentConfig } from '@/agents/leads/config';
```

Replace the current `'qualificacao-de-leads'` object with:

```ts
  'qualificacao-de-leads': leadQualificationAgentConfig,
```

- [ ] **Step 7: Run frontend agent tests**

Run:

```bash
npm run test -- src/agents/leads/__tests__/LeadQualificationQueueCard.test.tsx src/agents/__tests__/registry.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit frontend task 5**

Run from `seven_tools_front`:

```bash
git add src/agents/leads src/agents/registry.ts src/agents/__tests__/registry.test.tsx
git commit -m "feat: register radar de leads chat agent"
```

---

### Task 6: Frontend Chat Session Integration for Radar

**Files:**
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\pages\ChatToolPage.tsx`
- Test: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\pages\__tests__\ChatToolPage.sessions.test.tsx`

- [ ] **Step 1: Add failing ChatToolPage integration test**

Append this test to `src/pages/__tests__/ChatToolPage.sessions.test.tsx`:

```tsx
  it('creates a Radar de Leads chat session, persists queue payload, and rehydrates without calling adapter', async () => {
    const radarSession: ToolChatSession = {
      id: 's_radar',
      userId: 'u1',
      toolSlug: 'qualificacao-de-leads',
      title: 'Lead ACME',
      metadata: {},
      createdAt: '2026-05-27T10:00:00Z',
      updatedAt: '2026-05-27T10:00:00Z',
    };
    service.listSessions.mockResolvedValue({
      items: [radarSession],
      total: 1,
      page: 1,
      perPage: 30,
    });
    service.createSession.mockResolvedValue({ ...radarSession, id: 's_radar_created' });
    service.getSession.mockResolvedValue(radarSession);
    service.listMessages.mockResolvedValueOnce([
      {
        id: 'm_radar_user',
        sessionId: 's_radar',
        role: 'user',
        content: 'Ana da ACME, founder, SaaS com 30 pessoas, dor alta e imediato.',
        createdAt: '2026-05-27T10:01:00Z',
      },
      {
        id: 'm_radar_assistant',
        sessionId: 's_radar',
        role: 'assistant',
        content: 'Fila priorizada pronta.',
        payload: {
          kind: 'lead_qualification_queue',
          summary: {
            totalLeads: 1,
            highestScore: 100,
            primaryAction: 'abordar_agora',
          },
          leads: [
            {
              leadId: 'lead-1',
              companyName: 'ACME',
              contactName: 'Ana',
              contactRole: 'Founder',
              segment: 'SaaS',
              companySize: '11-50',
              urgency: 'alta',
              timing: 'imediato',
              painLevel: 'alta',
              notes: null,
              score: 100,
              tier: 'diamond',
              recommendedAction: 'abordar_agora',
              qualificationReason: 'Fit alto.',
              risk: 'Validar budget.',
              recommendedNextStep: 'Abordar agora.',
            },
          ],
        },
        createdAt: '2026-05-27T10:02:00Z',
      },
    ]);

    renderPage('/tools/qualificacao-de-leads/app/chat');

    expect(await screen.findAllByText('Radar de Leads')).not.toHaveLength(0);
    expect(service.listSessions).toHaveBeenCalledWith({
      toolSlug: 'qualificacao-de-leads',
      q: '',
      page: 1,
      perPage: 30,
    });

    fireEvent.click(await screen.findByRole('button', { name: /Lead ACME/i }));

    expect(await screen.findByText('Fila priorizada pronta.')).toBeInTheDocument();
    expect(screen.getByTestId('lead-qualification-queue-card')).toBeInTheDocument();
    expect(screen.getByText('ACME')).toBeInTheDocument();
    expect(screen.getByText('100/100')).toBeInTheDocument();
  });
```

Add this second test to the same file:

```tsx
  it('patches Radar session metadata with created lead ids after a new assistant queue payload', async () => {
    service.listSessions.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 30,
    });
    service.createSession.mockResolvedValue({
      id: 's_radar_created',
      userId: 'u1',
      toolSlug: 'qualificacao-de-leads',
      title: 'Novo chat',
      metadata: {},
      createdAt: '2026-05-27T10:00:00Z',
      updatedAt: '2026-05-27T10:00:00Z',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            reply: 'Fila priorizada pronta.',
            tool_result: {
              kind: 'lead_qualification_queue',
              summary: {
                total_leads: 1,
                highest_score: 100,
                primary_action: 'abordar_agora',
              },
              leads: [
                {
                  lead_id: 'lead-1',
                  company_name: 'ACME',
                  contact_name: 'Ana',
                  contact_role: 'Founder',
                  segment: 'SaaS',
                  company_size: '11-50',
                  urgency: 'alta',
                  timing: 'imediato',
                  pain_level: 'alta',
                  notes: null,
                  score: 100,
                  tier: 'diamond',
                  recommended_action: 'abordar_agora',
                  qualification_reason: 'Fit alto.',
                  risk: 'Validar budget.',
                  recommended_next_step: 'Abordar agora.',
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    renderPage('/tools/qualificacao-de-leads/app/chat');
    await sendPrompt('Ana da ACME, founder, SaaS com 30 pessoas, dor alta e imediato.');

    await waitFor(() => {
      expect(service.createMessage).toHaveBeenCalledWith(
        's_radar_created',
        expect.objectContaining({
          role: 'assistant',
          payload: expect.objectContaining({ kind: 'lead_qualification_queue' }),
        }),
      );
    });
    await waitFor(() => {
      expect(service.patchSession).toHaveBeenCalledWith('s_radar_created', {
        metadata: { lead_ids: ['lead-1'] },
      });
    });
  });
```

- [ ] **Step 2: Run integration tests to verify the metadata test fails**

Run:

```bash
npm run test -- src/pages/__tests__/ChatToolPage.sessions.test.tsx
```

Expected: at least the metadata patch test FAILS because `ChatToolPage` does not patch `lead_ids` for Radar payloads.

- [ ] **Step 3: Add lead payload side effect helpers to ChatToolPage**

In `src/pages/ChatToolPage.tsx`, add:

```ts
import { normalizeLeadQualificationQueuePayload } from '@/agents/leads';
```

Add near the existing constants:

```ts
const LEAD_QUALIFICATION_AGENT_ID = 'qualificacao-de-leads';
```

Inside `ConfiguredChatToolPage`, add after `isProposalAgent`:

```ts
  const isLeadQualificationAgent = config.id === LEAD_QUALIFICATION_AGENT_ID;
```

Add this effect after the existing proposal payload effect:

```tsx
  useEffect(() => {
    if (!isLeadQualificationAgent) {
      return;
    }

    for (const message of messages) {
      if (
        message.role !== 'assistant' ||
        message.payload === undefined ||
        processedAssistantMessageIds.current.has(message.id)
      ) {
        continue;
      }

      const queue = normalizeLeadQualificationQueuePayload(message.payload);
      if (!queue) {
        continue;
      }

      processedAssistantMessageIds.current.add(message.id);
      const leadIds = queue.leads.map((lead) => lead.leadId).filter(Boolean);
      if (leadIds.length > 0) {
        sessions.patchActiveSessionMetadata({ lead_ids: leadIds }).catch(() => undefined);
      }
    }
  }, [isLeadQualificationAgent, messages, sessions]);
```

In `applySessionMessages`, keep the existing loop that marks hydrated assistant messages as processed. That loop prevents metadata patching when a conversation is reopened.

- [ ] **Step 4: Run integration tests**

Run:

```bash
npm run test -- src/pages/__tests__/ChatToolPage.sessions.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run route bootstrap regression for Radar chat path**

Add this test to `src/App.test.tsx`:

```tsx
  it("routes Radar de Leads chat path to the shared chat page", async () => {
    mockAuthContext({
      useAuth: () => createApprovedMemberAuthState(),
    });
    mockFavoritesContext();
    mockLayout();
    mockPage("@/pages/ChatToolPage.tsx", "Chat tool page");
    mockPage("@/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx", "Lead detail page");

    setPath("/tools/qualificacao-de-leads/app/chat");
    await renderApp();

    expect(await screen.findByText("Chat tool page")).toBeInTheDocument();
    expect(screen.queryByText("Lead detail page")).not.toBeInTheDocument();
  });
```

Run:

```bash
npm run test -- src/App.test.tsx
```

Expected: PASS. If this fails because the detail route captures `chat`, move `<Route path="/tools/:slug/app/chat" element={withSuspense(<ChatToolPage />)} />` above the lead app route in `src/App.tsx`; it is already above it in the current file, so this test should pass.

- [ ] **Step 6: Commit frontend task 6**

Run from `seven_tools_front`:

```bash
git add src/pages/ChatToolPage.tsx src/pages/__tests__/ChatToolPage.sessions.test.tsx src/App.test.tsx
git commit -m "feat: persist radar lead metadata from chat"
```

---

### Task 7: Full Verification

**Files:**
- No planned file edits.

- [ ] **Step 1: Run focused backend tests**

Run from `seven_tools_api`:

```bash
pytest tests/test_lead_qualification_assistant_dispatch.py tests/test_lead_qualification_assistant_endpoint.py tests/test_lead_qualification.py tests/test_tool_chat.py -v
```

Expected: PASS.

- [ ] **Step 2: Run focused frontend tests**

Run from `seven_tools_front`:

```bash
npm run test -- src/agents/leads/__tests__/adapter.test.ts src/agents/leads/__tests__/LeadQualificationQueueCard.test.tsx src/agents/__tests__/registry.test.tsx src/pages/__tests__/ChatToolPage.sessions.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run from `seven_tools_front`:

```bash
npm run build
```

Expected: PASS with Vite build output and no TypeScript errors.

- [ ] **Step 4: Run backend smoke suite if PostgreSQL test DB is available**

Run from `seven_tools_api`:

```bash
pytest
```

Expected: PASS. If PostgreSQL is not running, start the test database with:

```bash
docker-compose up -d db
pytest
```

- [ ] **Step 5: Inspect git status in both repos**

Run:

```bash
git -C C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api status --short --branch
git -C C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front status --short --branch
```

Expected: only intentional commits ahead of `origin/main`; no unstaged implementation files.

---

## Self-Review Notes

Spec coverage:

- ChatGPT-like UX: Tasks 4, 5, 6.
- New chat, recentes, busca: existing shell validated in Task 6 for Radar slug.
- IA with Caloni `.md`: Tasks 1 and 2 assert `lead_qualification` profile.
- Deterministic score: Task 2 ignores model-provided score and checks deterministic score.
- Multi-lead queue: Task 2 multi-lead test and Task 5 card.
- Persisted structured payload: Tasks 5 and 6.
- Reopen without IA: Task 6 rehydration test renders persisted payload and does not send a prompt.
- No separate sidebar: no new sidebar files; `ChatToolPage` keeps `ToolChatShell`.
- Existing flows protected: Task 7 regression tests include proposal, tool-chat, lead qualification and app routing.

Type consistency:

- Backend response key is `tool_result`, matching proposal assistant pattern.
- Payload kind is exactly `lead_qualification_queue`.
- Backend direct response uses snake_case.
- Frontend normalizer accepts snake_case and camelCase because persisted history passes through Axios key conversion.
