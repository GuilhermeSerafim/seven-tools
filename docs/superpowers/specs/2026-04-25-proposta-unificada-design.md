# Spec — Proposta Comercial Unificada (criação + edição + validação em chat)

**Data:** 2026-04-25
**Repos afetados:** `seven_tools_front` (frontend) + `seven_tools_api` (backend)
**Status:** Design aprovado, pronto para plano de implementação
**Branches alvo:**
- Frontend: `codex/chat-tool-integration` (continuação da Fase 1)
- Backend: nova branch `feature/ai-proposal-assistant` em cima de `main`

## 1. Contexto e motivação

A Fase 1 ("Chat UI Foundation" + migração de Validação Caloni) entregou:
- Primitivos de chat (`ChatLayout`, `AgentHeader`, `MessageList`, `MessageBubble`, `PromptInputBox`, `ChatEmptyState`).
- `AgentRegistry`, `useAgentChat`, `ChatToolPage` genérica.
- **Validação Caloni** migrada pra chat em `/tools/validacao-caloni`.

A ferramenta **Proposta Comercial** ainda vive no fluxo clássico de formulários (`/tools/proposta-comercial-smart/app`). No `AgentRegistry` o slug `proposta-comercial-smart` é placeholder.

O pedido do stakeholder: **unificar criação, edição e validação de proposta numa única superfície conversacional**, com persona Caloni Decisor Comercial. Razão: a jornada real do usuário é contínua (criar → validar → ajustar → revalidar). Manter dois entrypoints separados (uma tool de criação, outra de validação) força troca de contexto e dilui o mental model "falo com o Caloni sobre proposta".

Como ainda **não há usuários ativos** na aplicação, o ataque é limpo: substituir, não adaptar. Sem redirects, sem flags de feature, sem manutenção paralela do form clássico.

## 2. Escopo desta spec

### Dentro

- **Backend novo:** endpoint `POST /ai/proposal-assistant` que orquestra criação, edição, validação e save num único turno conversacional, via tool-calling.
- **Frontend novo:** `ProposalAgent` real registrado no `AgentRegistry`, hooks (`useProposalDraft`, `useProposalChatAdapter`), 4 result cards específicos do agente.
- **Knowledge consumption:** profile curado do corpus Caloni (9 dos 17 .md) baseado no índice editorial existente.
- **Catálogo consolidado:** Validação Caloni e Proposta Comercial viram **uma entrada única** ("Proposta Comercial Caloni"). Slug `validacao-caloni` desaparece sem redirect.
- **Deleção do fluxo clássico de criação/edição** de proposta (formulários `ProposalForm` e rotas `/new`, `/:id/edit`, `/validate`).
- **Deleção da ferramenta `validacao-caloni`** (rotas, shells, redirects legados).
- **Deleção dos endpoints HTTP** `/ai/validate-proposal*` (a função service `validate_proposal_service` permanece, usada internamente pelo orquestrador).
- Testes unit + integration cobrindo orquestrador, dispatch, knowledge, hooks, cards, fluxo completo.

### Fora (deferido)

- **Composer 21st.dev (`ai-prompt-box` voice)** — Fase 2.5. Cherry-pick apenas voice recording (Whisper API). Modes (Search/Think/Canvas) descartados como UI vazia.
- **Streaming real** via `tools` API com SSE incremental — Fase 2.5 junto com voice.
- **RAG / embeddings** — corpus tem 96KB e curadoria editorial; fora até passar de ~250KB.
- **Sumarização de histórico longo** — turnos 21+ ficam truncados; sem prejuízo perceptível em conversas reais.
- **Migração de `/ai/diagnose`** pra profile curado — housekeeping fora do escopo.
- **Persistência de conversation history em DB** — segue em localStorage; sem requisito multi-device.
- **Multi-tool por turno** — backend processa o primeiro `tool_call` do array em v1.

## 3. Arquitetura

### Abordagem

**Endpoint único orquestrador + tool-calling determinístico.** Um único endpoint backend (`POST /ai/proposal-assistant`) recebe um turno completo, monta prompt com knowledge curado + draft atual + histórico, chama o provider LLM com `tools` declaradas, e despacha cada tool emitida pra ação correspondente. Validação não é gerada pelo LLM — quando o LLM emite `request_validation`, o orquestrador chama o serviço Python determinístico `validate_proposal_service` (mesmo usado anteriormente no `/ai/validate-proposal`), garantindo consistência.

**Princípios:**
- LLM decide *o quê* fazer (intenção via tool-call). Código determinístico faz *como*.
- Estado de draft em `localStorage` no frontend; backend é stateless.
- Persona Caloni interna; nunca expor nome de documentos do knowledge ao usuário.
- Provider abstraído (`call_ai_provider`); default OpenAI gpt-4o, override Groq via env.

### Diagrama de componentes

```
┌────────── FRONTEND (codex/chat-tool-integration) ──────────┐
│                                                              │
│   /tools/proposta-comercial-smart/app/chat                   │
│              │                                               │
│              ▼                                               │
│   ChatToolPage (genérica) ─► ProposalAgent (config)          │
│              │                                               │
│              ▼                                               │
│   useAgentChat ◄──► useProposalChatAdapter                   │
│              │                  │                            │
│              ▼                  ▼                            │
│   useProposalDraft       POST /ai/proposal-assistant         │
│   (localStorage)                                             │
│                                                              │
│   Result cards: SaveConfirm | Validation | DraftPreview |    │
│                 Update                                       │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────── BACKEND (main) ─────────────────────────────────────┐
│                                                                │
│   router.py: POST /ai/proposal-assistant                       │
│              │                                                 │
│              ▼                                                 │
│   service.proposal_assistant_turn (orquestrador)               │
│       ├── load_caloni_knowledge("proposal_assistant")          │
│       ├── build_messages (system × N + history + user)         │
│       ├── inject_attachment_context (pdfplumber)               │
│       ├── call_ai_provider_with_tools (httpx → AI_BASE_URL)    │
│       └── tool dispatch table:                                 │
│           • patch_draft        → Pydantic valida               │
│           • request_validation → validate_proposal_service     │
│                                  (DETERMINÍSTICO)              │
│           • request_save       → echo (frontend cria)          │
│           • request_update     → echo (frontend edita)         │
│           • open_existing      → echo (frontend navega)        │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
   OpenAI gpt-4o (default) / Groq llama-3.3-70b (override)
```

## 4. Components

### Frontend

#### 4.1 ProposalAgent config
**Arquivo:** `src/agents/proposal/config.ts` (novo)

Exports `proposalAgentConfig: AgentConfig` com:
- `slug: "proposta-comercial-smart"`
- `name: "Caloni"`
- `subtitle: "Decisor Comercial — Proposta"`
- `avatarSrc: "/caloni-photo.jpg.jpg"` — **foto real do Lucas Calone** (mesmo asset já usado em `validacao-caloni`, atualmente em `seven_tools_front/public/caloni-photo.jpg.jpg`). Renderiza no `AgentHeader` (lê `avatarSrc` em 44:`<AvatarImage src={avatarSrc} alt={name} />`) e no `ChatEmptyState`. Sem fallback de inicial "C" no caminho feliz; só aparece se a imagem falhar 404.
- `missionCopy: "Converse comigo pra criar, editar ou validar uma proposta. Posso analisar PDFs e te ajudar a refinar o pitch."`
- `initialSuggestions`: 3 pills:
  - `{ label: "Começar proposta nova", prompt: "Quero montar uma proposta comercial nova" }`
  - `{ label: "Editar a última", prompt: "Quero ajustar a última proposta que salvei" }`
  - `{ label: "Validar proposta", prompt: "Pode analisar uma proposta que recebi?" }`
- `acceptedAttachmentTypes: ["pdf", "image", "text"]`
- `adapter: useProposalChatAdapter`
- `onToolResult: (toolResult, ctx) => void` — handler que recebe `useProposalDraft` e `navigate` via `ctx`

#### 4.2 useProposalChatAdapter
**Arquivo:** `src/agents/proposal/useProposalChatAdapter.ts` (novo)

Hook stateless. Retorna `{ send }`. Dentro do `send(turns, signal)`:
- Lê `useProposalDraft.draft`, `currentProposalId` (de URL params), `lastSavedProposalId` (de state local).
- Lê `intent_hint` de `searchParams` (`?intent=validate|create|edit`).
- Empacota body:
  ```ts
  {
    messages: turns.map(t => ({ role, content, attachments })),
    current_draft: draft || null,
    current_proposal_id: proposalId,
    last_saved_proposal_id: lastSavedId,
    intent_hint: intent,
    attachments: latestUserMessage.attachments
  }
  ```
- `fetch('/ai/proposal-assistant', { method: 'POST', body: JSON.stringify(body), signal, headers: { Authorization } })` via `apiClient`.
- Retorna `{ reply, toolResult }` no formato que `useAgentChat` espera.

#### 4.3 useProposalDraft
**Arquivo:** `src/agents/proposal/useProposalDraft.ts` (novo)

Hook persistente:
- `draft: ProposalDraft | null` — lido de `localStorage["seven.proposta.draft.v1"]`.
- `patch(partial: Partial<ProposalDraft>): void` — merge raso, persiste imediatamente.
- `reset(): void` — limpa draft e localStorage.
- `isSavable: boolean` — true se `title`, `clientName`, `projectDescription` preenchidos.
- Recovery: JSON inválido no storage → trata como vazio, não throw.

#### 4.4 Result cards

##### `ProposalDraftPreviewCard`
**Arquivo:** `src/agents/proposal/ProposalDraftPreviewCard.tsx`

Renderiza dentro de uma `MessageBubble` quando `toolResult.kind === 'proposal_draft_patch'`. Mostra:
- Lista de campos preenchidos com seus valores (truncados).
- Lista de campos faltando (`missing_required`).
- Flag visual "extraído de PDF" se attachment do turno foi PDF.

##### `ProposalSaveConfirmCard`
**Arquivo:** `src/agents/proposal/ProposalSaveConfirmCard.tsx`

Renderiza quando `toolResult.kind === 'proposal_save_request'`. Mostra:
- Resumo do draft (título, cliente, valor, prazo).
- Botão **Salvar** — chama `proposalService.create(draft)`, no sucesso: `useProposalDraft.reset()` + injeta system message `"[Proposta salva como id={id}]"` no histórico + navega `/tools/proposta-comercial-smart/app/{id}`.
- Botão **Ajustar** — insere mensagem template no composer (`inputRef.current?.setValue("Quero ajustar...")`).
- Disabled durante save (race protection).

##### `ProposalUpdateCard`
**Arquivo:** `src/agents/proposal/ProposalUpdateCard.tsx`

Renderiza quando `toolResult.kind === 'proposal_update_request'`. Mostra:
- Diff visual: campos alterados, valor antes → depois.
- Botão **Aplicar** — chama `proposalService.update(proposalId, patch)`.
- Botão **Cancelar** — descarta patch.

##### `ProposalValidationCard`
**Reuso:** componente `CaloniResultCard` que **já existe** na branch `codex/chat-tool-integration` (entregue na Fase 1). Renderiza quando `toolResult.kind === 'proposal_validation_report'`.

#### 4.5 Tool result dispatcher
**Arquivo:** `src/agents/chat/AgentConfig.ts` (modificar — adicionar `onToolResult` opcional)

Refactor pequeno: `AgentConfig` ganha campo opcional `onToolResult?: (toolResult, ctx) => void`. `ChatToolPage` chama `agent.onToolResult?.(toolResult, ctx)` cegamente após cada turno. `ctx` carrega `draftHook`, `navigate`, `messageHistoryRef`. Mantém `ChatToolPage` genérica.

#### 4.6 Rota
**Arquivo:** `src/App.tsx` (modificar)

Adicionar:
```tsx
<Route
  path="/tools/proposta-comercial-smart/app/chat"
  element={withSuspense(<ChatToolPage />)}
/>
```

`ChatToolPage` lê o slug via `useParams<{ slug }>()`, então a rota `/tools/:slug/app/chat` matcha automaticamente sem precisar passar prop. O slug `proposta-comercial-smart` no URL faz o componente buscar `agentRegistry["proposta-comercial-smart"]`, que vai apontar pro `proposalAgentConfig` real (não mais o placeholder).

Remover (todas estas vão embora):
- `/tools/proposta-comercial-smart/app/new`
- `/tools/proposta-comercial-smart/app/:proposalId/edit`
- `/tools/proposta-comercial-smart/app/validate`
- Toda a sub-tree de `/tools/validacao-caloni/app`

### Backend

#### 4.7 Endpoint
**Arquivo:** `seven_tools_api/app/modules/ai/router.py` (modificar)

Novo:
```python
@router.post("/proposal-assistant", response_model=ProposalAssistantResponse)
def proposal_assistant_endpoint(
    req: ProposalAssistantRequest,
    db: DbSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return proposal_assistant_turn(db, user, req)
```

Remover (deleções):
- `POST /ai/validate-proposal`
- `POST /ai/validate-proposal/upload`
- `GET /ai/validate-proposal/from-proposal/{id}`

#### 4.8 Service orquestrador
**Arquivo:** `seven_tools_api/app/modules/ai/service.py` (modificar)

Nova função `proposal_assistant_turn(db, user, req)`. Pseudocódigo na Seção 6.

Função existente `validate_proposal` (refatorar pra `validate_proposal_service`) preservada como função interna invocada pelo orquestrador. Não mais exposta via HTTP.

#### 4.9 Pydantic models
**Arquivo:** `seven_tools_api/app/modules/ai/schemas.py` (novo)

```python
class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    attachments: list[AttachmentRef] = []

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
    report: ValidationReport  # reuso schema existente
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
    Union[DraftPatchResult, ValidationReportResult, SaveRequestResult,
          UpdateRequestResult, OpenExistingResult],
    Field(discriminator="kind"),
]

class ProposalAssistantResponse(BaseModel):
    reply: str
    tool_result: Optional[ToolResult] = None
```

#### 4.10 Tool schemas (LLM function-calling)
**Arquivo:** `seven_tools_api/app/modules/ai/tools.py` (novo)

Constante `PROPOSAL_TOOLS: list[dict]` com 5 functions: `patch_draft`, `request_validation`, `request_save`, `request_update`, `open_existing`. Schema completo na Seção 6.

#### 4.11 Knowledge profile
**Arquivo:** `seven_tools_api/app/modules/ai/knowledge.py` (modificar)

Refactor:
```python
PROFILES: dict[str, list[str] | None] = {
    "full": None,
    "proposal_assistant": ["00", "10", "11", "21", "22", "30", "32", "33", "41"],
    "diagnostic": ["00", "10", "11", "12", "13", "20", "21", "33", "40"],
}

@lru_cache(maxsize=16)
def load_caloni_knowledge(profile: str = "full") -> str:
    prefixes = PROFILES.get(profile)
    md_files = sorted(KNOWLEDGE_DIR.glob("*.md"))
    if prefixes is not None:
        md_files = [f for f in md_files if any(f.name.startswith(p + "_") for p in prefixes)]
    if not md_files:
        raise FileNotFoundError(f"No knowledge files for profile {profile}")
    return "\n\n---\n\n".join(f.read_text(encoding="utf-8") for f in md_files)
```

Profile `proposal_assistant`: ~13k tokens (vs ~25k do blob full).

#### 4.12 Prompt template
**Arquivo:** `seven_tools_api/app/modules/ai/prompts/proposal_assistant.py` (novo)

Constantes: `ASSISTANT_RULES`, `build_turn_context(req) -> str`. System prompt construído como 3 blocos:
1. `load_caloni_knowledge("proposal_assistant")` — estático, cache-friendly.
2. `ASSISTANT_RULES` — estático, cache-friendly.
3. `build_turn_context(req)` — varia por turno (draft, proposal_id, intent_hint).

Detalhes do prompt na Seção 6.

#### 4.13 Provider call com tools
**Arquivo:** `seven_tools_api/app/modules/ai/service.py` (adicionar)

Nova função `call_ai_provider_with_tools(messages, tools) -> CompletionMessage`:
- Mesmo `httpx` post, mas inclui `tools` no payload.
- Não usa `response_format: json_object` (incompatível com `tools` em alguns providers).
- Retorna mensagem com `content` (reply) e `tool_calls` (lista, possivelmente vazia).

A função existente `call_ai_provider(system_prompt, user_prompt)` permanece, usada pelo `diagnose`.

## 5. Data flow

### 5.1 Caso A — Criação progressiva (sem proposalId)

1. User digita "Quero criar proposta pra Acme, projeto SEO".
2. `useAgentChat.send` chama `useProposalChatAdapter.send(turns, signal)`.
3. Adapter monta body: `{ messages, current_draft: null, current_proposal_id: null, ... }`.
4. `POST /ai/proposal-assistant`.
5. Backend: `load_caloni_knowledge("proposal_assistant")` (cached) + `build_turn_context` + `call_ai_provider_with_tools`.
6. LLM emite `tool_call: patch_draft({clientName, title, projectDescription})` + reply textual.
7. Backend dispatch: valida patch via Pydantic, retorna `DraftPatchResult`.
8. Frontend: `agent.onToolResult` aplica `useProposalDraft.patch(patch)`. localStorage atualizado.
9. UI renderiza `MessageBubble` com reply + `ProposalDraftPreviewCard` mostrando estado.

### 5.2 Caso B — Validação via deep link

1. URL: `/tools/proposta-comercial-smart/app/chat?intent=validate&proposalId=xyz`.
2. `ChatToolPage` no mount lê params, injeta primeira mensagem auto-enviada: "Quero validar a proposta {title}".
3. Adapter envia body com `current_proposal_id: "xyz"`, `intent_hint: "validate"`.
4. LLM emite `tool_call: request_validation({proposal_id: "xyz"})` + reply.
5. Backend dispatch: chama `validate_proposal_service(proposal)` **determinístico**, retorna `ValidationReportResult` com report real.
6. Frontend renderiza `ProposalValidationCard` (reuso do `CaloniResultCard` da Fase 1).

### 5.3 Caso C — Save

1. User: "Pode salvar."
2. LLM verifica draft completo, emite `tool_call: request_save()` + reply pedindo confirmação.
3. Backend retorna `SaveRequestResult` com `draft_summary`.
4. Frontend renderiza `ProposalSaveConfirmCard`.
5. User clica **Salvar** → `proposalService.create(draft)` → sucesso.
6. Frontend: `useProposalDraft.reset()`, injeta system message no histórico, navega `/app/:newId`.
7. Próxima mensagem: estado mudou pra "edição da proposta salva". Body inclui `last_saved_proposal_id` ou `current_proposal_id` apontando pra nova proposta.

### 5.4 Caso D — Edição de proposta salva

1. URL: `/app/:proposalId/chat` ou navegação após save.
2. Adapter envia `current_proposal_id`.
3. User: "Aumenta o valor pra 25k".
4. LLM emite `tool_call: request_update({patch: {value: "R$ 25.000"}})`.
5. Frontend renderiza `ProposalUpdateCard` com diff. User clica **Aplicar**.
6. Frontend chama `proposalService.update(proposalId, patch)`.

### 5.5 Caso E — PDF de proposta concorrente

1. User anexa `concorrente.pdf` + texto.
2. Adapter envia attachments.
3. Backend `inject_attachment_context`: `pdfplumber.extract_text(pdf_bytes)` → injeta como user message extra.
4. LLM raciocina sobre PDF + knowledge → emite `patch_draft` extenso.
5. Frontend renderiza `DraftPreviewCard` com flag "extraído de PDF — confira".

### 5.6 Aborto

`AbortSignal` propaga: composer Stop → `useAgentChat` → `fetch` → backend httpx detecta disconnect → mata request do provider. Mensagem do assistant marcada `aborted: true`. Draft não muda (nenhum `tool_result` aplicado).

### 5.7 Erros

| Erro | HTTP | UX |
|---|---|---|
| Provider 5xx/timeout (60s) | 504 | Bubble de erro + botão "Tentar de novo" |
| Provider rate-limit | 429 | Mensagem com `retry_after_s` |
| Tool-call inválido | 200 | Degrada pra reply sem `tool_result`; nada quebra |
| Pydantic falha em request | 422 | Erro inline genérico |
| Proposta não existe / não é do user | 404 | Reply degradado: "Não encontrei essa proposta" |
| PDF corrompido | 200 | Reply: "Não consegui ler o PDF" + sem `tool_result` |

## 6. Backend contract — detalhes

### 6.1 Tool schemas (PROPOSAL_TOOLS)

```python
PROPOSAL_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "patch_draft",
            "description": "Atualiza campos do draft de proposta em construção. Use quando coletar dado novo do usuário, antes da proposta ser salva.",
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
            "description": "Pede análise determinística de uma proposta SALVA (precisa de proposal_id). Use quando o usuário pedir validação ou feedback sobre proposta existente.",
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
            "description": "Sinaliza que o draft está pronto e pede confirmação para persistir. Só use quando title, clientName e projectDescription estiverem preenchidos.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_update",
            "description": "Edita uma proposta JÁ SALVA. Use quando current_proposal_id estiver presente e o usuário pedir alteração de campo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patch": {"type": "object"},
                },
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

### 6.2 Orquestrador (pseudocódigo)

```python
def proposal_assistant_turn(
    db: DbSession,
    user: User,
    req: ProposalAssistantRequest,
) -> ProposalAssistantResponse:
    knowledge = load_caloni_knowledge("proposal_assistant")
    rules = ASSISTANT_RULES
    turn_context = build_turn_context(req)

    # Cap histórico: últimos 20 turnos
    history = req.messages[-20:]
    history = inject_attachment_context(history, latest_attachments=req.messages[-1].attachments)

    messages = [
        {"role": "system", "content": knowledge},
        {"role": "system", "content": rules},
        {"role": "system", "content": turn_context},
        *[m.model_dump() for m in history],
    ]

    completion = call_ai_provider_with_tools(messages, PROPOSAL_TOOLS)
    reply = completion.message.content or ""
    tool_calls = completion.message.tool_calls or []

    if not tool_calls:
        return ProposalAssistantResponse(reply=reply)

    call = tool_calls[0]
    name = call.function.name
    args = json.loads(call.function.arguments)

    if name == "patch_draft":
        patch = args.get("patch", {})
        # Filtra chaves desconhecidas (não rejeita o turno)
        valid_keys = set(ProposalDraftIn.model_fields.keys())
        clean = {k: v for k, v in patch.items() if k in valid_keys}
        # Valida tipos
        try:
            ProposalDraftIn.model_validate({**(req.current_draft.model_dump() if req.current_draft else {}), **clean})
        except ValidationError:
            return ProposalAssistantResponse(reply=reply)  # degrada
        missing = compute_missing_required(req.current_draft, clean)
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=DraftPatchResult(kind="proposal_draft_patch", patch=clean, missing_required=missing),
        )

    if name == "request_validation":
        proposal = proposal_repo.get(args["proposal_id"], user_id=user.id)
        if not proposal:
            return ProposalAssistantResponse(reply=f"Não encontrei a proposta {args['proposal_id']}.")
        report = validate_proposal_service(db, user.id, proposal_to_text(proposal), proposal.id)
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=ValidationReportResult(
                kind="proposal_validation_report",
                report=report,
                proposal_id=proposal.id,
            ),
        )

    if name == "request_save":
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=SaveRequestResult(kind="proposal_save_request", draft_summary=req.current_draft),
        )

    if name == "request_update":
        if not req.current_proposal_id:
            return ProposalAssistantResponse(reply=reply)
        patch = args.get("patch", {})
        valid_keys = set(ProposalDraftIn.model_fields.keys())
        clean = {k: v for k, v in patch.items() if k in valid_keys}
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=UpdateRequestResult(
                kind="proposal_update_request",
                proposal_id=req.current_proposal_id,
                patch=clean,
            ),
        )

    if name == "open_existing":
        return ProposalAssistantResponse(
            reply=reply,
            tool_result=OpenExistingResult(kind="proposal_open_existing", proposal_id=args["proposal_id"]),
        )

    return ProposalAssistantResponse(reply=reply)
```

### 6.3 ASSISTANT_RULES (system prompt template)

```
Você é o Caloni, decisor comercial sênior. Os documentos acima são SUA forma de
pensar e agir — não cite o nome dos arquivos ao usuário, internalize o conteúdo.

Sua função: ajudar o usuário a CRIAR, EDITAR e VALIDAR propostas comerciais via
conversa natural.

Regras de tool-calling:
1. Coletando dado novo: chame `patch_draft` com APENAS os campos que mudaram no turno.
2. Validação pedida sobre proposta salva: chame `request_validation` com proposal_id.
   Você NÃO gera o relatório — o sistema executa o serviço determinístico.
3. Draft completo (title + clientName + projectDescription presentes) e usuário sinalizando
   que está pronto: chame `request_save`.
4. `current_proposal_id` setado e usuário pede mudança: use `request_update` em vez de
   `patch_draft`.
5. Usuário menciona proposta existente por nome ou ID: pode usar `open_existing`.

Estilo:
- Português, tom profissional e direto.
- Máximo 3 frases por turno.
- Uma pergunta por vez.
- Se faltar dado obrigatório, pergunte naturalmente, sem formulário.

Campos do draft: title, clientName, clientCompany, clientEmail, clientPhone,
projectDescription, scope, value, deadline, notes.
```

### 6.4 Códigos de erro

| Caso | HTTP | Body |
|---|---|---|
| Provider timeout/5xx | 504 | `{detail: "provider_unavailable"}` |
| Provider 429 | 429 | `{detail: "rate_limited", retry_after_s: int}` |
| Pydantic falha req | 422 | padrão FastAPI |
| Proposal não pertence ao user | 200 | reply degradado, sem tool_result |
| Tool-call malformado | 200 | reply puro, sem tool_result |

## 7. Knowledge consumption

### 7.1 Profile escolhido: `proposal_assistant`

Baseado em `seven_tools_api/knowledge/caloni/99_indice_de_uso.md` linhas 42-44 ("Análise de proposta e fechamento"):

```
00_identidade_e_principios.md           3209 B
10_modelo_comercial_caloni.md           2698 B
11_fluxo_decisao_comercial.md           3033 B
21_playbook_objecoes.md                 5427 B
22_playbook_proposta_e_fechamento.md    5183 B
30_biblioteca_objecoes.md              10432 B
32_biblioteca_intervencoes.md           8806 B
33_biblioteca_antipadroes.md            5277 B
41_snippets_e_formulacoes.md            6513 B
                              total:  ~50.5 KB ≈ 13k tokens
```

vs blob full: 96 KB ≈ 25k tokens. **Redução ~48%.**

### 7.2 Prompt cache friendliness

Ordem do `messages[]`:
1. `system: KNOWLEDGE_PROPOSAL_ASSISTANT` — estático entre turnos da mesma conversa → cache hit.
2. `system: ASSISTANT_RULES` — estático → cache hit.
3. `system: turn_context` (draft, proposal_id, intent) — varia por turno.
4. `...history` — varia.
5. `user: input` — varia.

OpenAI prompt caching desconta ~90% do custo dos blocos cacheados a partir do segundo turno.

### 7.3 Cache backend

`@lru_cache(maxsize=16)` em `load_caloni_knowledge(profile)`. Leitura de disco zero após primeira chamada por profile. Re-deploy invalida (módulo recarrega).

## 8. Testing strategy

### 8.1 Backend unit (~20 testes)

**`tests/modules/ai/test_proposal_assistant_knowledge.py`** (4)
- `test_load_proposal_assistant_profile_returns_expected_files`
- `test_load_full_profile_returns_all_files`
- `test_unknown_profile_raises_value_error`
- `test_lru_cache_serves_subsequent_calls`

**`tests/modules/ai/test_proposal_assistant_dispatch.py`** (8)
- `test_patch_draft_validates_and_filters_unknown_fields`
- `test_patch_draft_with_invalid_type_degrades_to_reply_only`
- `test_request_validation_calls_deterministic_service`
- `test_request_validation_with_unowned_proposal_returns_degraded_reply`
- `test_request_save_with_complete_draft_returns_summary`
- `test_request_save_with_incomplete_draft_passes_through`
- `test_request_update_passes_proposal_id_through`
- `test_unknown_tool_call_degrades_to_reply_only`

**`tests/modules/ai/test_proposal_assistant_prompts.py`** (3)
- `test_system_prompt_includes_knowledge_block_first`
- `test_system_prompt_orders_blocks_for_cache`
- `test_history_truncation_respects_20_turn_cap`

**`tests/modules/ai/test_proposal_assistant_attachments.py`** (3)
- `test_pdf_attachment_extracted_via_pdfplumber`
- `test_corrupted_pdf_returns_graceful_reply`
- `test_image_attachment_passed_to_provider_payload`

**`tests/modules/ai/test_proposal_assistant_errors.py`** (3)
- `test_provider_timeout_returns_504`
- `test_provider_rate_limit_returns_429`
- `test_invalid_request_body_returns_422`

### 8.2 Backend integration (~5 testes, **PostgreSQL real via Docker**)

**`tests/modules/ai/test_proposal_assistant_endpoint.py`**
- `test_full_turn_persists_nothing_in_db`
- `test_validation_intent_with_real_proposal_calls_service`
- `test_unauthorized_proposal_id_returns_degraded_reply`
- `test_save_request_does_not_persist_proposal_in_backend`
- `test_concurrent_turns_share_lru_cache`

### 8.3 Frontend unit (~12 testes, Vitest + RTL)

**`useProposalChatAdapter.test.ts`** (4)
- `sends_messages_draft_and_proposal_id_in_body`
- `applies_intent_hint_from_url_searchparams`
- `propagates_abort_signal_to_fetch`
- `parses_tool_result_discriminated_union`

**`useProposalDraft.test.ts`** (5)
- `patch_merges_into_existing_draft`
- `reset_clears_localstorage`
- `is_savable_when_minimum_required_fields_present`
- `survives_page_reload_via_localstorage`
- `corrupted_localstorage_falls_back_to_empty`

**`ProposalSaveConfirmCard.test.tsx`** (3)
- `renders_draft_summary_fields`
- `disables_save_button_during_save_call`
- `clicking_adjust_inserts_template_message_into_composer`

### 8.4 Frontend integration (~3 testes, RTL com mock adapter)

**`ChatToolPage.proposal.integration.test.tsx`**
- `full_create_flow_renders_draft_preview_card`
- `validation_deep_link_triggers_first_message_auto_send`
- `save_request_card_calls_proposal_service_create_and_navigates`

### 8.5 Smoke E2E manual

Pós-implementação, checklist com login `qa.caloni@local.dev`:
1. `/tools/proposta-comercial-smart/app/chat` → criar proposta nova via conversa → salvar → aparece em `/app`.
2. `/app/:id` → "Validar via chat" → deep link → `ProposalValidationCard` com score real.
3. `/app/:id/chat` → "muda valor pra 25k" → `ProposalUpdateCard` → aplicar → reload mostra valor novo.
4. Anexar PDF → `DraftPreviewCard` com flag de extração.
5. Abortar mid-stream → composer libera, draft preserva estado anterior.

### 8.6 Coverage target

- Backend novo: ≥ 90%.
- Frontend novo: ≥ 80%.

### 8.7 O que NÃO testar

- Comportamento do LLM (não-determinístico). Mock obrigatório de `call_ai_provider_with_tools`.
- Internals do `pdfplumber`. Mock da interface.
- Componentes da Fase 1 (`useAgentChat`, `MessageBubble`, `PromptInputBox`, `ChatToolPage`).

## 9. Scope decomposition (ordem de execução)

### Fase 2A — Backend (branch `feature/ai-proposal-assistant` em `main`)

1. Refactor `knowledge.py` com profiles + testes.
2. `schemas.py` com Pydantic models.
3. `tools.py` com PROPOSAL_TOOLS.
4. `prompts/proposal_assistant.py` com ASSISTANT_RULES + build_turn_context.
5. `call_ai_provider_with_tools` em `service.py`.
6. `proposal_assistant_turn` orquestrador + dispatch.
7. `inject_attachment_context` (pdfplumber).
8. Endpoint `POST /ai/proposal-assistant` em `router.py`.
9. Testes unit + integration (Postgres real).
10. Refactor `validate_proposal` → `validate_proposal_service` (função interna).
11. **Deletar** rotas HTTP `/ai/validate-proposal*`.
12. PR → merge → deploy.

### Fase 2B — Frontend (branch `codex/chat-tool-integration`)

13. `AgentConfig` ganha `onToolResult` opcional.
14. `useProposalDraft` hook + testes.
15. `useProposalChatAdapter` + testes.
16. `ProposalDraftPreviewCard` + testes.
17. `ProposalSaveConfirmCard` + testes.
18. `ProposalUpdateCard` + testes.
19. `ProposalValidationCard` (reuso `CaloniResultCard` da Fase 1).
20. `proposalAgentConfig` em `src/agents/proposal/config.ts`.
21. Substituir placeholder no `AgentRegistry`.
22. Adicionar rota `/tools/proposta-comercial-smart/app/chat` em `App.tsx`.
23. Refactor `ProposalShell` (botão único "Nova").
24. Refactor `ProposalView` (link de validação aponta pro chat).
25. Integration test do fluxo completo.

### Fase 2C — Limpeza

26. **Deletar** `src/pages/tools/PropostaComercial/ProposalForm.tsx`.
27. **Deletar** `src/pages/tools/ValidacaoCaloni/` (diretório inteiro).
28. **Deletar** rotas órfãs em `App.tsx`:
    - `/tools/proposta-comercial-smart/app/new`
    - `/tools/proposta-comercial-smart/app/:proposalId/edit`
    - `/tools/proposta-comercial-smart/app/validate`
    - Toda sub-tree de `/tools/validacao-caloni/app`
29. **Deletar** helpers órfãos em `src/features/comercial/toolRoutes.ts` (`getCaloniValidationAppPath`, `getProposalNewPath`).
30. **Deletar** entrada `validacao-caloni` do catálogo em `Tools.tsx` / `useTools`.
31. Atualizar `AGENTS.md` e `CLAUDE.md` com novo fluxo.
32. Smoke E2E manual (5 cenários da seção 8.5).
33. PR final.

## 10. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| LLM não emite tool_calls confiavelmente em conversas longas | Fallback: `tool_result=None`, frontend trata como turno conversacional puro. Nenhum estado quebra. |
| Custo de tokens explode (knowledge × histórico) | Profile curado reduz 48%. Cap 20 turnos. Prompt cache do provider. Logs estruturados de tokens por turno. |
| Provider Groq vs OpenAI: function-calling tem dialetos sutis | Adapter normaliza em `call_ai_provider_with_tools`. Testar com ambos via env override antes de mergear. |
| Conflito com outras sessões na branch `codex/chat-tool-integration` | Worktree isolada. Comunicação antes de rebase. |
| Deletar `validacao-caloni` quebra E2E tests existentes | Auditar e atualizar/deletar testes na PR de limpeza. |
| Patch do LLM com tipos errados (ex: value como número) | Pydantic valida; turno degrada pra reply puro sem aplicar patch corrompido. |

## 11. Critérios de aceitação ("done")

1. Os 5 cenários de smoke E2E passam.
2. Coverage backend novo ≥ 90%, frontend novo ≥ 80%.
3. CI verde: lint + types + tests + build.
4. `AGENTS.md` e `CLAUDE.md` refletem o novo fluxo.
5. `/tools/validacao-caloni` retorna 404 (rota deletada).
6. `/tools/proposta-comercial-smart/app/chat` é o único entrypoint de criação/edição/validação.
7. Catálogo de Tools mostra apenas "Proposta Comercial Caloni" como entrada de proposta.
8. Form clássico de proposta (`ProposalForm.tsx`) deletado.
9. Foto real do Caloni (`/caloni-photo.jpg.jpg`) carrega no `AgentHeader` e no `ChatEmptyState` da rota `/tools/proposta-comercial-smart/app/chat`. Verificável manualmente: header mostra a foto e não o fallback de inicial "C".

## 12. Composer 21st.dev — decisão arquivada

`PromptInputBox` atual (em `src/components/ui/prompt-input-box.tsx`, ~665 linhas) é homegrown e tem features que o `easemize/ai-prompt-box` do 21st.dev **não** tem (PDF/texto upload, imperative handle, shortcut global `/`, `acceptedTypes` configurável, `validateAttachment`).

O 21st.dev tem voice recording + toggles Search/Think/Canvas. Voice tem valor real pro ICP comercial; toggles seriam UI vazia sem backend.

**Decisão:** não rodar `npx shadcn@latest add` cru. Em Fase 2.5 dedicada, cherry-pick apenas o componente de voice do 21st.dev, integrar ao nosso `PromptInputBox` via novo botão de mic, novo endpoint backend `POST /ai/transcribe` (Whisper API). Modes descartados.

Fora desta spec.

## 13. Referências

- Spec Fase 1: `docs/superpowers/specs/2026-04-22-chat-ui-foundation-design.md`
- Plano Fase 1: `docs/superpowers/plans/2026-04-23-chat-tool-integration.md`
- Specs Validação Caloni: `2026-04-24-validacao-caloni-chat-protagonist-design.md`, `-refresh.md`
- Knowledge index: `seven_tools_api/knowledge/caloni/99_indice_de_uso.md`
- Service base: `seven_tools_api/app/modules/ai/service.py`, `knowledge.py`, `router.py`
- Componente alvo deferido: `https://21st.dev/r/easemize/ai-prompt-box`
