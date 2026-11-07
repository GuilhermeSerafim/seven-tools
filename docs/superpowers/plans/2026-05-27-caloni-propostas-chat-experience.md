# Caloni Propostas Chat Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Caloni Propostas feel like a specialist AI chat that collects proposal context naturally, improves the proposal skeleton with Caloni expertise, shows no partial draft card, and creates proposals only after explicit confirmation.

**Architecture:** Keep the LLM responsible for conversation and tool calls, but enforce product invariants in deterministic code. Backend prompt/tool rules prevent premature save and factual invention; frontend guards decide when artifacts render and when explicit create actions are available.

**Tech Stack:** FastAPI, pytest, React 18, TypeScript, Vitest, shadcn/ui, TailwindCSS, Lucide icons.

---

## File Structure

### Backend repo: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api`

- Modify: `app/modules/ai/prompts/proposal_assistant.py`
  - Owns the Caloni Propostas system prompt and turn context.
  - Add explicit full-checklist opening, specialist commercial behavior, allowed inference, forbidden inference, and "no form" rule.
- Modify: `app/modules/ai/tools.py`
  - Tighten `patch_draft` and `request_save` tool descriptions so the model uses them at the right time.
- Modify: `app/modules/ai/service.py`
  - Improve deterministic incomplete-save fallback wording.
  - Keep `_REQUIRED_DRAFT_FIELDS` as backend source of truth for save guardrails.
- Modify: `tests/test_proposal_assistant_prompts.py`
  - Add prompt contract tests for ChatGPT-like behavior, complete checklist, Caloni expertise, and anti-invention rules.
- Modify: `tests/test_proposal_assistant_dispatch.py`
  - Add/adjust dispatch tests for incomplete save fallback and patch behavior.

### Frontend repo: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front`

- Create: `src/agents/proposal/proposalDraftCompleteness.ts`
  - Shared proposal required-field helpers for hook, page, and tests.
- Create: `src/agents/proposal/__tests__/proposalDraftCompleteness.test.ts`
  - Unit tests for required field detection, merging, and completeness.
- Create: `src/agents/proposal/ProposalDraftReviewCard.tsx`
  - Complete-review artifact with all required fields and actions: `Criar proposta` and `Editar pelo chat`.
- Create: `src/agents/proposal/__tests__/ProposalDraftReviewCard.test.tsx`
  - Component tests for fields, CTAs, loading state, and optional notes.
- Modify: `src/agents/proposal/ProposalSaveConfirmCard.tsx`
  - Rename visible action from `Salvar` to `Criar proposta` to match product language.
- Modify: `src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx`
  - Update button assertions for new action text.
- Modify: `src/agents/proposal/useProposalDraft.ts`
  - Use shared completeness helper for `isSavable`.
- Modify: `src/agents/proposal/__tests__/useProposalDraft.test.ts`
  - Expand required-field expectations to the full skeleton.
- Modify: `src/agents/proposal/index.ts`
  - Export new helper and review card.
- Modify: `src/pages/ChatToolPage.tsx`
  - Remove duplicated required-field helpers.
  - Render no artifact for incomplete `proposal_draft_patch`.
  - Render `ProposalDraftReviewCard` for complete draft patches.
  - Keep `ProposalSaveConfirmCard` for explicit `request_save` tool calls.
  - Improve fallback copy so it sounds like a chat response, not a form.
- Modify: `src/pages/__tests__/ChatToolPage.proposal.test.tsx`
  - Update tests for complete draft review card and direct create button.
- Modify: `src/pages/__tests__/ChatToolPage.sessions.test.tsx`
  - Keep session rehydration covered with complete draft payloads.

---

## Task 1: Backend Prompt Contract

**Files:**
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\tests\test_proposal_assistant_prompts.py`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\app\modules\ai\prompts\proposal_assistant.py`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\app\modules\ai\tools.py`

- [ ] **Step 1: Write failing prompt tests**

Append these tests to `tests/test_proposal_assistant_prompts.py`:

```python
from app.modules.ai.tools import PROPOSAL_TOOLS


def _proposal_tool_description(name: str) -> str:
    for tool in PROPOSAL_TOOLS:
        function = tool["function"]
        if function["name"] == name:
            return function["description"]
    raise AssertionError(f"Tool not found: {name}")


def test_assistant_rules_start_new_proposal_with_full_natural_checklist():
    assert "Ao iniciar uma proposta nova" in ASSISTANT_RULES
    assert "texto corrido" in ASSISTANT_RULES
    assert "cliente" in ASSISTANT_RULES
    assert "empresa" in ASSISTANT_RULES
    assert "e-mail" in ASSISTANT_RULES
    assert "telefone" in ASSISTANT_RULES
    assert "problema ou oportunidade" in ASSISTANT_RULES
    assert "objetivo comercial" in ASSISTANT_RULES
    assert "escopo" in ASSISTANT_RULES
    assert "valor" in ASSISTANT_RULES
    assert "prazo" in ASSISTANT_RULES
    assert "formulario" in ASSISTANT_RULES


def test_assistant_rules_define_caloni_commercial_expertise():
    assert "especialista comercial" in ASSISTANT_RULES
    assert "playbooks" in ASSISTANT_RULES
    assert "proposta de valor" in ASSISTANT_RULES
    assert "objecoes" in ASSISTANT_RULES
    assert "posicionamento" in ASSISTANT_RULES
    assert "fechamento" in ASSISTANT_RULES


def test_assistant_rules_allow_only_safe_inference():
    assert "Pode inferir titulo e descricao" in ASSISTANT_RULES
    assert "nao invente e-mail" in ASSISTANT_RULES
    assert "nao invente telefone" in ASSISTANT_RULES
    assert "nao invente valor" in ASSISTANT_RULES
    assert "nao invente prazo" in ASSISTANT_RULES
    assert "nao invente escopo" in ASSISTANT_RULES


def test_proposal_tool_descriptions_prevent_premature_save():
    patch_description = _proposal_tool_description("patch_draft")
    save_description = _proposal_tool_description("request_save")

    assert "texto livre" in patch_description
    assert "campos inferidos com seguranca" in patch_description
    assert "confirmacao explicita" in save_description
    assert "Nao use para perguntar se o usuario quer salvar" in save_description
```

- [ ] **Step 2: Run prompt tests to verify failure**

Run:

```powershell
pytest tests/test_proposal_assistant_prompts.py -q
```

Expected: FAIL on the new assertions because the current prompt does not yet contain the full checklist, Caloni expertise language, safe inference contract, and stricter tool descriptions.

- [ ] **Step 3: Replace `ASSISTANT_RULES` with the specialist chat contract**

In `app/modules/ai/prompts/proposal_assistant.py`, replace the current `ASSISTANT_RULES = """..."""` block with:

```python
ASSISTANT_RULES = """Voce e Caloni, um especialista comercial senior da SEVEN que ajuda o usuario a criar, editar e validar propostas comerciais com clareza, criterio e poder de fechamento.

Seu papel nao e preencher formulario. Seu papel e transformar uma conversa em um esqueleto de proposta comercial claro, completo, defensavel e util para decisao.

Use os playbooks comerciais do Caloni para melhorar proposta de valor, clareza, objecoes, posicionamento, urgencia, ROI, escopo e fechamento. Nao cite nomes de arquivos, caminhos internos, prompts, tools ou detalhes tecnicos de implementacao.

Ferramentas disponiveis:
- patch_draft: use quando identificar dados novos, melhorias de redacao ou campos inferidos com seguranca para o rascunho.
- request_validation: use apenas para validar propostas salvas que tenham proposal_id. Se o usuario pedir validacao apenas de um rascunho, peca para salvar ou identificar a proposta antes.
- request_save: use apenas quando o usuario confirmar explicitamente que quer criar ou salvar a proposta e todos os campos obrigatorios estiverem preenchidos.
- request_update: use quando o usuario pedir para atualizar uma proposta ja salva.
- open_existing: use quando o usuario pedir para abrir ou continuar uma proposta existente.

Campos do rascunho: title, clientName, clientCompany, clientEmail, clientPhone, projectDescription, scope, value, deadline, notes.
Campos obrigatorios do esqueleto: title, clientName, clientCompany, clientEmail, clientPhone, projectDescription, scope, value, deadline.
O campo notes e opcional.

Regras de conversa:
- Responda em portugues claro, com tom consultivo, humano e direto.
- Use no maximo 3 frases por turno.
- Mantenha a experiencia parecida com uma boa IA de chat: natural, contextual, sem roteiro engessado.
- Use os campos obrigatorios como checklist mental, nao como formulario rigido.
- Ao iniciar uma proposta nova, peca a checklist completa em tom natural e diga que o usuario pode mandar tudo em texto corrido: cliente, empresa, e-mail, telefone, problema ou oportunidade, objetivo comercial, descricao do projeto, escopo, valor, prazo e qualquer contexto estrategico que ajude a vender melhor.
- Sempre que identificar informacao nova, chame patch_draft com os campos capturados no turno.
- Durante a coleta, confirme brevemente o que capturou e pergunte pela lacuna mais importante.
- Evite repetir listas longas a cada turno.
- Nao ofereca criar, confirmar ou salvar enquanto qualquer campo obrigatorio estiver faltando.
- Quando o esqueleto estiver completo, responda com uma confirmacao curta e pergunte se o usuario quer editar algum ponto ou criar a proposta.

Inferencia permitida:
- Pode inferir titulo e descricao quando cliente, empresa, escopo e objetivo estiverem claros.
- Pode melhorar a redacao para deixar a proposta mais comercial, objetiva e defensavel.
- Pode organizar o escopo em uma formulacao mais clara, sem criar entregas novas.
- Se fizer inferencia, trate como uma sugestao do esqueleto, nao como fato novo.

Inferencia proibida:
- nao invente e-mail.
- nao invente telefone.
- nao invente valor.
- nao invente prazo.
- nao invente escopo.
- nao invente empresa.
- nao invente condicoes comerciais, garantias ou promessas de entrega.
- Se faltar dado factual obrigatorio, pergunte diretamente.

Regras de seguranca comercial:
- Se o usuario pedir para salvar uma proposta incompleta, explique que ainda faltam campos obrigatorios.
- Se o usuario pedir validacao sem proposal_id, peca para abrir ou salvar uma proposta antes.
- Quando editar, validar ou salvar, deixe claro o proximo passo comercial sem expor detalhes internos."""
```

- [ ] **Step 4: Tighten proposal tool descriptions**

In `app/modules/ai/tools.py`, update only the descriptions for `patch_draft` and `request_save`:

```python
"description": (
    "Atualiza campos do draft de proposta em construcao a partir de texto livre. "
    "Use quando coletar dado novo do usuario ou quando melhorar titulo, descricao "
    "ou redacao comercial com campos inferidos com seguranca."
),
```

For `request_save`:

```python
"description": (
    "Sinaliza que o draft esta completo e que o usuario deu confirmacao explicita "
    "para criar ou salvar a proposta. Nao use para perguntar se o usuario quer salvar. "
    "So use quando title, clientName, clientCompany, clientEmail, clientPhone, "
    "projectDescription, scope, value e deadline estiverem preenchidos."
),
```

- [ ] **Step 5: Run prompt tests to verify pass**

Run:

```powershell
pytest tests/test_proposal_assistant_prompts.py -q
```

Expected: PASS.

- [ ] **Step 6: Commit backend prompt contract**

Run from `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api`:

```powershell
git add app/modules/ai/prompts/proposal_assistant.py app/modules/ai/tools.py tests/test_proposal_assistant_prompts.py
git commit -m "feat: refine caloni proposal assistant prompt"
```

---

## Task 2: Backend Save Guardrail Copy

**Files:**
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\tests\test_proposal_assistant_dispatch.py`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api\app\modules\ai\service.py`

- [ ] **Step 1: Update the incomplete save test to expect human chat copy**

In `tests/test_proposal_assistant_dispatch.py`, replace the assertions inside `test_dispatch_request_save_with_incomplete_draft_degrades` with:

```python
    assert resp.tool_result is None
    assert resp.reply == (
        "Ainda nao vou criar a proposta, porque falta: empresa do cliente, e-mail, "
        "telefone, descricao do projeto, escopo, valor e prazo. "
        "Me envie esses dados em texto livre para eu fechar o esqueleto."
    )
```

- [ ] **Step 2: Run dispatch test to verify failure**

Run:

```powershell
pytest tests/test_proposal_assistant_dispatch.py::test_dispatch_request_save_with_incomplete_draft_degrades -q
```

Expected: FAIL because `_missing_required_reply` still returns the old wording.

- [ ] **Step 3: Add a Portuguese list join helper**

In `app/modules/ai/service.py`, add this helper right after `_has_required_value`:

```python
def _join_pt_list(items: list[str]) -> str:
    if len(items) <= 1:
        return items[0] if items else ""
    return ", ".join(items[:-1]) + " e " + items[-1]
```

- [ ] **Step 4: Replace `_missing_required_reply`**

Replace the current `_missing_required_reply` with:

```python
def _missing_required_reply(missing: list[str]) -> str:
    labels = [_DRAFT_FIELD_LABELS.get(field, field) for field in missing]
    missing_text = _join_pt_list(labels)
    return (
        f"Ainda nao vou criar a proposta, porque falta: {missing_text}. "
        "Me envie esses dados em texto livre para eu fechar o esqueleto."
    )
```

- [ ] **Step 5: Run focused backend dispatch tests**

Run:

```powershell
pytest tests/test_proposal_assistant_dispatch.py::test_dispatch_request_save_with_incomplete_draft_degrades tests/test_proposal_assistant_dispatch.py::test_dispatch_request_save_returns_summary tests/test_proposal_assistant_dispatch.py::test_dispatch_save_confirmation_depends_on_model_tool_call -q
```

Expected: PASS.

- [ ] **Step 6: Commit backend guardrail copy**

Run from `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api`:

```powershell
git add app/modules/ai/service.py tests/test_proposal_assistant_dispatch.py
git commit -m "fix: improve incomplete proposal save guardrail"
```

---

## Task 3: Shared Frontend Draft Completeness

**Files:**
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\proposalDraftCompleteness.ts`
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\__tests__\proposalDraftCompleteness.test.ts`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\useProposalDraft.ts`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\__tests__\useProposalDraft.test.ts`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\index.ts`

- [ ] **Step 1: Write failing completeness helper tests**

Create `src/agents/proposal/__tests__/proposalDraftCompleteness.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  REQUIRED_PROPOSAL_DRAFT_FIELDS,
  getMissingRequiredProposalFields,
  isProposalDraftComplete,
  mergeProposalDrafts,
} from '../proposalDraftCompleteness';
import type { ProposalDraft } from '../useProposalDraft';

const COMPLETE_DRAFT: ProposalDraft = {
  title: 'Proposta de Auditoria Tecnica e Conteudo para Acme',
  clientName: 'Maria Acme',
  clientCompany: 'Acme',
  clientEmail: 'maria@acme.local',
  clientPhone: '11999999999',
  projectDescription: 'Realizar auditoria tecnica do ambiente digital da Acme.',
  scope: 'Auditoria tecnica, plano de conteudo e acompanhamento mensal',
  value: 'R$ 25.000',
  deadline: '90 dias',
};

describe('proposalDraftCompleteness', () => {
  it('keeps the frontend required fields aligned with the backend skeleton', () => {
    expect(REQUIRED_PROPOSAL_DRAFT_FIELDS).toEqual([
      'title',
      'clientName',
      'clientCompany',
      'clientEmail',
      'clientPhone',
      'projectDescription',
      'scope',
      'value',
      'deadline',
    ]);
  });

  it('returns no missing fields for a complete draft', () => {
    expect(getMissingRequiredProposalFields(COMPLETE_DRAFT)).toEqual([]);
    expect(isProposalDraftComplete(COMPLETE_DRAFT)).toBe(true);
  });

  it('detects empty and whitespace required fields', () => {
    expect(
      getMissingRequiredProposalFields({
        ...COMPLETE_DRAFT,
        clientEmail: '   ',
        deadline: undefined,
      }),
    ).toEqual(['clientEmail', 'deadline']);
  });

  it('merges a current draft with a patch without mutating either object', () => {
    const current: ProposalDraft = {
      title: 'Proposta inicial',
      clientName: 'Maria',
    };
    const patch: Partial<ProposalDraft> = {
      clientCompany: 'Acme',
      value: 'R$ 25.000',
    };

    expect(mergeProposalDrafts(current, patch)).toEqual({
      title: 'Proposta inicial',
      clientName: 'Maria',
      clientCompany: 'Acme',
      value: 'R$ 25.000',
    });
    expect(current).toEqual({
      title: 'Proposta inicial',
      clientName: 'Maria',
    });
  });
});
```

- [ ] **Step 2: Run the helper test to verify failure**

Run:

```powershell
npm run test -- src/agents/proposal/__tests__/proposalDraftCompleteness.test.ts
```

Expected: FAIL because `proposalDraftCompleteness.ts` does not exist.

- [ ] **Step 3: Create shared completeness helpers**

Create `src/agents/proposal/proposalDraftCompleteness.ts`:

```typescript
import type { ProposalDraft } from './useProposalDraft';

export const REQUIRED_PROPOSAL_DRAFT_FIELDS = [
  'title',
  'clientName',
  'clientCompany',
  'clientEmail',
  'clientPhone',
  'projectDescription',
  'scope',
  'value',
  'deadline',
] as const satisfies readonly (keyof ProposalDraft)[];

function hasRequiredValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function mergeProposalDrafts(
  draft: ProposalDraft | null,
  patch: Partial<ProposalDraft>,
): Partial<ProposalDraft> {
  return draft ? { ...draft, ...patch } : { ...patch };
}

export function getMissingRequiredProposalFields(draft: Partial<ProposalDraft>): string[] {
  return REQUIRED_PROPOSAL_DRAFT_FIELDS.filter((field) => !hasRequiredValue(draft[field]));
}

export function isProposalDraftComplete(draft: Partial<ProposalDraft> | null): boolean {
  return Boolean(draft) && getMissingRequiredProposalFields(draft).length === 0;
}
```

- [ ] **Step 4: Use the helper in `useProposalDraft`**

In `src/agents/proposal/useProposalDraft.ts`, remove the local `hasValue` function and add:

```typescript
import { isProposalDraftComplete } from './proposalDraftCompleteness';
```

Replace the `isSavable` memo with:

```typescript
  const isSavable = useMemo(() => isProposalDraftComplete(draft), [draft]);
```

- [ ] **Step 5: Update `useProposalDraft` tests for the full skeleton**

In `src/agents/proposal/__tests__/useProposalDraft.test.ts`, replace the `isSavable true with required fields` patch with:

```typescript
    act(() => {
      result.current.patch({
        title: 'Proposta inicial',
        clientName: 'Ana',
        clientCompany: 'Acme',
        clientEmail: 'ana@acme.local',
        clientPhone: '11999999999',
        projectDescription: 'Implantacao comercial',
        scope: 'Diagnostico e plano de acao',
        value: 'R$ 10.000',
        deadline: '30 dias',
      });
    });
```

Replace the `isSavable false when missing required` patch with:

```typescript
    act(() => {
      result.current.patch({
        title: 'Proposta inicial',
        clientName: 'Ana',
        clientCompany: 'Acme',
        clientEmail: '   ',
        clientPhone: '11999999999',
        projectDescription: 'Implantacao comercial',
        scope: 'Diagnostico e plano de acao',
        value: 'R$ 10.000',
        deadline: '30 dias',
      });
    });
```

- [ ] **Step 6: Export helper functions**

In `src/agents/proposal/index.ts`, add:

```typescript
export {
  REQUIRED_PROPOSAL_DRAFT_FIELDS,
  getMissingRequiredProposalFields,
  isProposalDraftComplete,
  mergeProposalDrafts,
} from './proposalDraftCompleteness';
```

- [ ] **Step 7: Run helper and hook tests**

Run:

```powershell
npm run test -- src/agents/proposal/__tests__/proposalDraftCompleteness.test.ts src/agents/proposal/__tests__/useProposalDraft.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit frontend completeness helpers**

Run from `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front`:

```powershell
git add src/agents/proposal/proposalDraftCompleteness.ts src/agents/proposal/__tests__/proposalDraftCompleteness.test.ts src/agents/proposal/useProposalDraft.ts src/agents/proposal/__tests__/useProposalDraft.test.ts src/agents/proposal/index.ts
git commit -m "feat: centralize proposal draft completeness"
```

---

## Task 4: Complete Draft Review Card

**Files:**
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\ProposalDraftReviewCard.tsx`
- Create: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\__tests__\ProposalDraftReviewCard.test.tsx`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\ProposalSaveConfirmCard.tsx`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\__tests__\ProposalSaveConfirmCard.test.tsx`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\agents\proposal\index.ts`

- [ ] **Step 1: Write failing review card tests**

Create `src/agents/proposal/__tests__/ProposalDraftReviewCard.test.tsx`:

```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProposalDraftReviewCard } from '../ProposalDraftReviewCard';
import type { ProposalDraft } from '../useProposalDraft';

const DRAFT: ProposalDraft = {
  title: 'Proposta de Auditoria Tecnica e Conteudo para Acme',
  clientName: 'Maria Acme',
  clientCompany: 'Acme',
  clientEmail: 'maria@acme.local',
  clientPhone: '11999999999',
  projectDescription: 'Realizar auditoria tecnica do ambiente digital da Acme.',
  scope: 'Auditoria tecnica, plano de conteudo e acompanhamento mensal',
  value: 'R$ 25.000',
  deadline: '90 dias',
  notes: 'Priorizar decisores comerciais.',
};

describe('ProposalDraftReviewCard', () => {
  it('renders every required proposal field for final review', () => {
    render(
      <ProposalDraftReviewCard
        draft={DRAFT}
        creating={false}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('proposal-draft-review-card')).toBeInTheDocument();
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Proposta de Auditoria Tecnica e Conteudo para Acme')).toBeInTheDocument();
    expect(screen.getByText('Nome do cliente')).toBeInTheDocument();
    expect(screen.getByText('Maria Acme')).toBeInTheDocument();
    expect(screen.getByText('Empresa do cliente')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('E-mail do cliente')).toBeInTheDocument();
    expect(screen.getByText('maria@acme.local')).toBeInTheDocument();
    expect(screen.getByText('Telefone do cliente')).toBeInTheDocument();
    expect(screen.getByText('11999999999')).toBeInTheDocument();
    expect(screen.getByText('Descricao do projeto')).toBeInTheDocument();
    expect(screen.getByText('Realizar auditoria tecnica do ambiente digital da Acme.')).toBeInTheDocument();
    expect(screen.getByText('Escopo')).toBeInTheDocument();
    expect(screen.getByText('Auditoria tecnica, plano de conteudo e acompanhamento mensal')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('R$ 25.000')).toBeInTheDocument();
    expect(screen.getByText('Prazo')).toBeInTheDocument();
    expect(screen.getByText('90 dias')).toBeInTheDocument();
    expect(screen.getByText('Observacoes')).toBeInTheDocument();
    expect(screen.getByText('Priorizar decisores comerciais.')).toBeInTheDocument();
  });

  it('calls onCreate from the primary CTA', () => {
    const onCreate = vi.fn();
    render(
      <ProposalDraftReviewCard
        draft={DRAFT}
        creating={false}
        onCreate={onCreate}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /criar proposta/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit from the secondary CTA', () => {
    const onEdit = vi.fn();
    render(
      <ProposalDraftReviewCard
        draft={DRAFT}
        creating={false}
        onCreate={vi.fn()}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /editar pelo chat/i }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('disables actions while creating', () => {
    render(
      <ProposalDraftReviewCard
        draft={DRAFT}
        creating
        onCreate={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /criar proposta/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /editar pelo chat/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run review card test to verify failure**

Run:

```powershell
npm run test -- src/agents/proposal/__tests__/ProposalDraftReviewCard.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Create the review card component**

Create `src/agents/proposal/ProposalDraftReviewCard.tsx`:

```typescript
import { FileCheck2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getProposalDraftEntries } from './proposalDraftFields';
import type { ProposalDraft } from './useProposalDraft';

export interface ProposalDraftReviewCardProps {
  draft: ProposalDraft;
  creating: boolean;
  onCreate: () => void;
  onEdit: () => void;
}

function getDisplayValue(value: string): string {
  return value.trim();
}

export function ProposalDraftReviewCard({
  draft,
  creating,
  onCreate,
  onEdit,
}: ProposalDraftReviewCardProps) {
  const entries = getProposalDraftEntries(draft);

  return (
    <section
      data-testid="proposal-draft-review-card"
      className={cn(
        'mt-4 overflow-hidden rounded-[28px] border border-border/30 bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5',
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0 border-b border-border/20 pb-4">
          <p className="text-sm font-semibold text-foreground">Esqueleto da proposta</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Revise os dados antes de criar a proposta.
          </p>
        </div>

        <dl className="grid gap-3">
          {entries.map(([field, value]) => (
            <div key={field} className="grid min-w-0 gap-1 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {field === 'notes' ? 'Observacoes' : field === 'title' ? 'Titulo' : field === 'clientName' ? 'Nome do cliente' : field === 'clientCompany' ? 'Empresa do cliente' : field === 'clientEmail' ? 'E-mail do cliente' : field === 'clientPhone' ? 'Telefone do cliente' : field === 'projectDescription' ? 'Descricao do projeto' : field === 'scope' ? 'Escopo' : field === 'value' ? 'Valor' : 'Prazo'}
              </dt>
              <dd className="min-w-0 break-words text-sm leading-6 text-foreground">
                {getDisplayValue(value)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col-reverse gap-2 border-t border-border/20 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={onEdit}
            disabled={creating}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar pelo chat
          </Button>
          <Button
            type="button"
            className="min-h-11"
            onClick={onCreate}
            disabled={creating}
            aria-busy={creating}
          >
            <FileCheck2 className="mr-2 h-4 w-4" />
            Criar proposta
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Simplify the label expression**

Replace the inline ternary label expression in `ProposalDraftReviewCard.tsx` with the existing label helper:

```typescript
import { getProposalDraftEntries, getProposalDraftFieldLabel } from './proposalDraftFields';
```

Then replace the `<dt>` contents with:

```tsx
                {getProposalDraftFieldLabel(field)}
```

- [ ] **Step 5: Update `ProposalSaveConfirmCard` action copy**

In `src/agents/proposal/ProposalSaveConfirmCard.tsx`, replace:

```tsx
            Salvar
```

with:

```tsx
            Criar proposta
```

Keep the `Save` icon.

- [ ] **Step 6: Update save confirm tests**

In `src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx`, replace button queries matching `/salvar/i` with `/criar proposta/i`.

Example:

```typescript
fireEvent.click(screen.getByRole('button', { name: /criar proposta/i }));
expect(screen.getByRole('button', { name: /criar proposta/i })).toBeDisabled();
```

- [ ] **Step 7: Export the review card**

In `src/agents/proposal/index.ts`, add:

```typescript
export { ProposalDraftReviewCard } from './ProposalDraftReviewCard';
```

- [ ] **Step 8: Run proposal card tests**

Run:

```powershell
npm run test -- src/agents/proposal/__tests__/ProposalDraftReviewCard.test.tsx src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit frontend review card**

Run from `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front`:

```powershell
git add src/agents/proposal/ProposalDraftReviewCard.tsx src/agents/proposal/__tests__/ProposalDraftReviewCard.test.tsx src/agents/proposal/ProposalSaveConfirmCard.tsx src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx src/agents/proposal/index.ts
git commit -m "feat: add proposal draft review card"
```

---

## Task 5: ChatToolPage Proposal Flow

**Files:**
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\pages\ChatToolPage.tsx`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\pages\__tests__\ChatToolPage.proposal.test.tsx`
- Modify: `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front\src\pages\__tests__\ChatToolPage.sessions.test.tsx`

- [ ] **Step 1: Update complete draft expectations in proposal page tests**

In `src/pages/__tests__/ChatToolPage.proposal.test.tsx`, update the test named `substitui reply generico por chamada final quando o rascunho fica completo` to assert the review card and CTAs:

```typescript
    expect(screen.getAllByTestId('proposal-draft-review-card').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('proposal-draft-preview-card')).not.toBeInTheDocument();
    expect(screen.getByText(/Fechei o esqueleto da proposta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar proposta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar pelo chat/i })).toBeInTheDocument();
    expect(screen.queryByText(/Quer adicionar algo ou salvar a proposta/i)).not.toBeInTheDocument();
```

In the test named `mostra o rascunho acumulado quando o agente retorna apenas um patch parcial`, replace `proposal-draft-preview-card` with `proposal-draft-review-card`.

- [ ] **Step 2: Add test for direct create from completed review card**

Append this test to `src/pages/__tests__/ChatToolPage.proposal.test.tsx`:

```typescript
  it('cria proposta direto pelo card completo de revisao', async () => {
    mockAssistantResponse(
      {
        kind: 'proposal_draft_patch',
        patch: {
          title: 'Proposta de Auditoria Tecnica e Conteudo para Acme',
          clientName: 'Maria Acme',
          clientCompany: 'Acme',
          clientEmail: 'maria@acme.local',
          clientPhone: '11999999999',
          projectDescription: 'Realizar auditoria tecnica do ambiente digital da Acme.',
          scope: 'Auditoria tecnica, plano de conteudo e acompanhamento mensal',
          value: 'R$ 25.000',
          deadline: '90 dias',
        },
        missing_required: [],
      },
      'Atualizei o rascunho da proposta com as informacoes identificadas. Quer adicionar algo ou salvar a proposta?',
    );

    renderAt('/tools/proposta-comercial-smart/app/chat');

    await sendPrompt('Segue tudo');
    fireEvent.click(screen.getByRole('button', { name: /criar proposta/i }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(proposalService.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        title: 'Proposta de Auditoria Tecnica e Conteudo para Acme',
        clientName: 'Maria Acme',
        clientCompany: 'Acme',
        clientEmail: 'maria@acme.local',
        clientPhone: '11999999999',
        projectDescription: 'Realizar auditoria tecnica do ambiente digital da Acme.',
        scope: 'Auditoria tecnica, plano de conteudo e acompanhamento mensal',
        value: 'R$ 25.000',
        deadline: '90 dias',
        status: 'draft',
      }),
    );
    expect(screen.getByText('Proposal app')).toBeInTheDocument();
  });
```

- [ ] **Step 3: Run proposal page tests to verify failure**

Run:

```powershell
npm run test -- src/pages/__tests__/ChatToolPage.proposal.test.tsx
```

Expected: FAIL because `ChatToolPage` still renders `ProposalDraftPreviewCard` for complete draft patches and the new create CTA does not exist there.

- [ ] **Step 4: Import shared helpers and review card in `ChatToolPage`**

In `src/pages/ChatToolPage.tsx`, update the proposal import block to include:

```typescript
  ProposalDraftReviewCard,
  getMissingRequiredProposalFields,
  mergeProposalDrafts,
```

Remove the local `REQUIRED_PROPOSAL_DRAFT_FIELDS` constant and the local `getMissingRequiredProposalFields` function.

- [ ] **Step 5: Replace local merge helper usage**

Remove the local `getMergedProposalDraft` function and replace its usages:

```typescript
getMergedProposalDraft(currentDraft, payload.patch)
```

with:

```typescript
mergeProposalDrafts(currentDraft, payload.patch)
```

And:

```typescript
getMergedProposalDraft(proposalDraft, message.payload.patch)
```

with:

```typescript
mergeProposalDrafts(proposalDraft, message.payload.patch)
```

- [ ] **Step 6: Improve proposal fallback reply copy**

In `getProposalFallbackReply`, replace the full `proposal_draft_patch` case with:

```typescript
    case 'proposal_draft_patch': {
      const missingRequired = getProposalDraftPatchMissing(payload, currentDraft);

      if (!missingRequired.length) {
        return 'Fechei o esqueleto da proposta e organizei os dados em uma versao pronta para revisao. Quer editar algum ponto ou criar a proposta?';
      }

      const captured = getPatchSummary(payload.patch);
      const missing = joinHumanList(missingRequired.map(getProposalFieldLabel));

      return captured
        ? `Anotei ${captured}. Para fechar o esqueleto, ainda preciso de: ${missing}.`
        : `Anotei. Para fechar o esqueleto, ainda preciso de: ${missing}.`;
    }
```

- [ ] **Step 7: Render the complete review card for complete draft patches**

In `renderProposalPayload`, replace the `proposal_draft_patch` branch with:

```tsx
        case 'proposal_draft_patch': {
          const mergedDraft = mergeProposalDrafts(proposalDraft, message.payload.patch);
          const missingRequired = getMissingRequiredProposalFields(mergedDraft);

          if (missingRequired.length > 0) {
            return null;
          }

          return (
            <ProposalDraftReviewCard
              draft={mergedDraft as ProposalDraft}
              creating={savingMessageId === message.id}
              onCreate={() => {
                handleSaveProposal(message.id, mergedDraft as ProposalDraft).catch(() => undefined);
              }}
              onEdit={() => {
                inputRef.current?.setValue('Quero editar essa proposta antes de criar');
                inputRef.current?.focus();
              }}
            />
          );
        }
```

- [ ] **Step 8: Keep request_save as an explicit save path**

In the `proposal_save_request` branch, keep the completeness guard and keep rendering `ProposalSaveConfirmCard`. No behavior change is needed beyond the updated button text from Task 4.

- [ ] **Step 9: Update sessions test to expect review card after hydration**

In `src/pages/__tests__/ChatToolPage.sessions.test.tsx`, inside `opens an existing session and renders persisted messages`, add:

```typescript
    expect(screen.getByTestId('proposal-draft-review-card')).toBeInTheDocument();
```

Keep the existing assertions for historical message text and proposal title.

- [ ] **Step 10: Run focused frontend proposal tests**

Run:

```powershell
npm run test -- src/pages/__tests__/ChatToolPage.proposal.test.tsx src/pages/__tests__/ChatToolPage.sessions.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Commit frontend chat flow**

Run from `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front`:

```powershell
git add src/pages/ChatToolPage.tsx src/pages/__tests__/ChatToolPage.proposal.test.tsx src/pages/__tests__/ChatToolPage.sessions.test.tsx
git commit -m "feat: improve caloni proposal chat flow"
```

---

## Task 6: Focused Regression Verification

**Files:**
- No file changes expected.

- [ ] **Step 1: Run backend proposal assistant tests**

Run from `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api`:

```powershell
pytest tests/test_proposal_assistant_prompts.py tests/test_proposal_assistant_dispatch.py tests/test_proposal_assistant_endpoint.py tests/test_proposal_assistant_provider.py -q
```

Expected: PASS.

- [ ] **Step 2: Run frontend proposal/chat tests**

Run from `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front`:

```powershell
npm run test -- src/agents/proposal/__tests__/proposalDraftCompleteness.test.ts src/agents/proposal/__tests__/ProposalDraftReviewCard.test.tsx src/agents/proposal/__tests__/ProposalSaveConfirmCard.test.tsx src/agents/proposal/__tests__/useProposalDraft.test.ts src/pages/__tests__/ChatToolPage.proposal.test.tsx src/pages/__tests__/ChatToolPage.sessions.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run from `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front`:

```powershell
npm run build
```

Expected: PASS and Vite outputs a production build without TypeScript errors.

- [ ] **Step 4: Manual smoke test locally**

Start backend:

```powershell
cd C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Start frontend in another terminal:

```powershell
cd C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front
npm run dev
```

Manual flow:

1. Login with a known local user.
2. Open `http://localhost:8080/tools/proposta-comercial-smart/app/chat`.
3. Click `Novo chat`.
4. Send: `Quero montar uma proposta comercial nova`.
5. Confirm first assistant response asks for full checklist in natural tone and says the user can send text freely.
6. Send a partial message without e-mail and phone.
7. Confirm no card appears and the assistant asks only for missing factual fields.
8. Send the missing fields plus value and prazo.
9. Confirm a complete review card appears with `Criar proposta` and `Editar pelo chat`.
10. Click `Editar pelo chat` and confirm the composer is prefilled.
11. Send an edit request and confirm the card updates after the next complete patch.
12. Click `Criar proposta` and confirm the proposal is saved and navigates to the proposal route.
13. Reopen the chat from recent sessions and confirm messages and card/artifact rehydrate.

- [ ] **Step 5: Capture final git status**

Run in both repos:

```powershell
git status --short
git log -3 --oneline
```

Expected:
- Working tree clean in `seven_tools_api`.
- Working tree clean in `seven_tools_front`.
- Recent commits match the task commits above.

---

## Implementation Notes

- Do not implement the HTML/PDF deck generation in this plan. That remains V2 after this chat flow is validated.
- Do not alter Caloni/Naka knowledge files.
- Do not remove the existing `request_save` backend guardrail. The complete review card is an additional explicit user-confirmation path in the frontend.
- Do not show `ProposalDraftPreviewCard` for incomplete proposal patches in Caloni Propostas.
- Keep each commit inside its own repo. The workspace root is not the git repo for either application.

## Spec Coverage Review

- ChatGPT-like experience: covered by existing `ToolChatShell` and Task 5 session tests.
- First turn full checklist: covered by Task 1 prompt tests.
- Free text input: covered by Task 1 prompt/tool descriptions and Task 5 page tests.
- Caloni expertise: covered by Task 1 prompt tests.
- No partial card: covered by existing and updated Task 5 tests.
- Complete card only when full skeleton exists: covered by Task 3 helpers and Task 5 render tests.
- Explicit confirmation before creation: covered by Task 4/5 `Criar proposta` button and backend `request_save` guardrail.
- Incomplete proposal cannot be saved: covered by Task 2 backend tests and Task 5 frontend guards.
- Reopen old conversation: covered by Task 5 sessions test.
- HTML/PDF V2 documented only: recorded in the spec and excluded in Implementation Notes.
