# Revisao Editorial PT-BR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir ortografia, acentuacao, pontuacao, mojibake e ingles exposto ao usuario no SEVEN Tools, cobrindo frontend e mensagens do backend sem alterar o tom do produto nem os contratos de resposta.

**Architecture:** A execucao vai em quatro lotes: inventario guiado por superficie, frontend de autenticacao/conta/membership, frontend de catalogo e ferramentas, e backend de mensagens expostas. Onde ja houver testes de UI ou API, atualize os asserts primeiro para forcar falha, implemente a menor correcao possivel, rode validacao focada e faça commits pequenos dentro de cada sub-repo.

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + Testing Library no `seven_tools_front`; FastAPI + pytest + PostgreSQL no `seven_tools_api`; PowerShell `Get-ChildItem` + `Select-String` para busca textual porque `rg` nao esta executando neste ambiente.

---

## Working Conventions

- Todos os comandos do frontend rodam a partir de `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_front`.
- Todos os comandos do backend rodam a partir de `C:\Users\Guiler\Desktop\wks\seven\seven_tools\seven_tools_api`.
- `seven_tools_front/` e `seven_tools_api/` tem git separado. Nunca commitar na raiz `seven_tools/`.
- O escopo e apenas texto visivel ao usuario. Nao mexer em comentarios, nomes tecnicos, schemas internos nao exibidos ou knowledge base.
- A busca final deve eliminar duas classes de problema: mojibake (`Ã`, `Â·`, `NÃ£o`) e strings em ingles ainda visiveis ao usuario (`Other`, `Invalid email or password`, `Proposal not found`).

## File Structure

### Frontend - autenticacao, conta e membership

- Modify: `src/pages/auth/Login.tsx`
- Modify: `src/pages/auth/Register.tsx`
- Modify: `src/pages/auth/ChangePassword.tsx`
- Modify: `src/pages/auth/AwaitingValidation.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/admin/AdminPendingReviewsBell.tsx`
- Modify: `src/auth/authService.ts`
- Modify: `src/pages/profile/Profile.tsx`
- Modify: `src/pages/admin/MembershipReviewsPage.tsx`
- Test: `src/pages/auth/Register.test.tsx`
- Test: `src/components/layout/Header.test.tsx`
- Test: `src/pages/profile/Profile.test.tsx`
- Test: `src/pages/admin/MembershipReviewsPage.test.tsx`

### Frontend - shell, home e catalogo

- Modify: `src/data/modules.ts`
- Modify: `src/data/tools.ts`
- Modify: `src/pages/Index.tsx`
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/pages/Tools.tsx`
- Modify: `src/pages/ModulePage.tsx`
- Modify: `src/pages/ToolDetail.tsx`
- Modify: `src/pages/NotFound.tsx`
- Test: `src/pages/Index.test.tsx`
- Test: `src/pages/Tools.test.tsx`
- Test: `src/pages/ModulePage.test.tsx`
- Test: `src/pages/ToolDetail.test.tsx`

### Frontend - ferramentas comerciais

- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationConfig.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationShell.tsx`
- Modify: `src/pages/tools/DiagnosticoComercial/DiagnosticoApp.tsx`
- Modify: `src/pages/tools/PropostaComercial/CalonValidation.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalForm.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalList.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalPDF.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalView.tsx`
- Modify: `src/pages/tools/ValidacaoCaloni/ValidationApp.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationConfig.test.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationShell.test.tsx`
- Test: `src/pages/tools/PropostaComercial/ProposalView.test.tsx`
- Test: `src/pages/tools/ValidacaoCaloni/ValidationApp.test.tsx`
- Test: `src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.test.tsx`

### Backend - mensagens expostas ao usuario

- Modify: `app/dependencies.py`
- Modify: `app/modules/auth/router.py`
- Modify: `app/modules/ai/router.py`
- Modify: `app/modules/lead_qualification/router.py`
- Modify: `app/modules/lead_qualification/service.py`
- Modify: `app/modules/membership/service.py`
- Modify: `app/modules/proposals/router.py`
- Modify: `app/modules/users/router.py`
- Test: `tests/test_ai.py`
- Test: `tests/test_auth.py`
- Test: `tests/test_lead_qualification.py`
- Test: `tests/test_membership.py`
- Test: `tests/test_proposals.py`
- Test: `tests/test_users.py`

## Task 1: Build the editorial worklists

**Files:**
- Read-only: `seven_tools_front/src/**`
- Read-only: `seven_tools_api/app/**`

- [ ] **Step 1: Generate the frontend candidate list**

Run from `seven_tools_front/`:

```powershell
Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
  Select-String -Pattern 'Ã|Â·|Other|Nao|Configuracao|Validacao|Diagnostico|Urgencia|Observacoes|Criacao|informacoes|Invalid|Loading|Success' |
  Select-Object Path,LineNumber,Line
```

Expected: output must include files like `src/pages/auth/Register.tsx`, `src/pages/profile/Profile.tsx`, `src/data/modules.ts`, `src/pages/Index.tsx`, `src/pages/ToolDetail.tsx`, and `src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx`.

- [ ] **Step 2: Generate the backend candidate list**

Run from `seven_tools_api/`:

```powershell
Get-ChildItem app -Recurse -File -Include *.py |
  Select-String -Pattern 'detail=.*"[A-Za-z ]+"|return \{"detail": "[A-Za-z ]+"|Invalid authorization|Session expired|Proposal not found|Favorite added|Favorite removed|Company not found|User not found' |
  Select-Object Path,LineNumber,Line
```

Expected: output must include `app/dependencies.py`, `app/modules/auth/router.py`, `app/modules/users/router.py`, `app/modules/proposals/router.py`, `app/modules/lead_qualification/router.py`, and `app/modules/membership/service.py`.

- [ ] **Step 3: Run the frontend baseline tests that are most likely to move**

Run from `seven_tools_front/`:

```bash
npx vitest run src/pages/auth/Register.test.tsx src/components/layout/Header.test.tsx src/pages/profile/Profile.test.tsx src/pages/admin/MembershipReviewsPage.test.tsx src/pages/Index.test.tsx src/pages/Tools.test.tsx src/pages/ModulePage.test.tsx src/pages/ToolDetail.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationConfig.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx
```

Expected: they should pass before the string assertions are updated. Keep this output as the baseline.

- [ ] **Step 4: Bring up the backend database and run the baseline API suite**

Run from `seven_tools_api/`:

```bash
docker-compose up -d db
pytest tests/test_ai.py tests/test_auth.py tests/test_lead_qualification.py tests/test_membership.py tests/test_proposals.py tests/test_users.py -q
```

Expected: the suite should pass before PT-BR message assertions are updated.

## Task 2: Fix frontend auth, account, and membership copy

**Files:**
- Modify: `src/pages/auth/Login.tsx`
- Modify: `src/pages/auth/Register.tsx`
- Modify: `src/pages/auth/ChangePassword.tsx`
- Modify: `src/pages/auth/AwaitingValidation.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/admin/AdminPendingReviewsBell.tsx`
- Modify: `src/auth/authService.ts`
- Modify: `src/pages/profile/Profile.tsx`
- Modify: `src/pages/admin/MembershipReviewsPage.tsx`
- Test: `src/pages/auth/Register.test.tsx`
- Test: `src/components/layout/Header.test.tsx`
- Test: `src/pages/profile/Profile.test.tsx`
- Test: `src/pages/admin/MembershipReviewsPage.test.tsx`

- [ ] **Step 1: Update the failing test expectations first**

Apply these test edits:

```tsx
// src/pages/auth/Register.test.tsx
it("reveals the company name and CNPJ fields only when Outra empresa is selected", async () => {
  ...
});

it("submits the Outra empresa payload without companyId", async () => {
  ...
});
```

```tsx
// src/components/layout/Header.test.tsx
vi.mock("@/components/admin/AdminPendingReviewsBell", () => ({
  AdminPendingReviewsBell: () => <button type="button" aria-label="0 revisões pendentes">Bell</button>,
}));

expect(screen.getByRole("link", { name: /revisões pendentes/i })).toHaveAttribute(
  "href",
  "/admin/membros-pendentes",
);
expect(screen.queryByRole("button", { name: "0 revisões pendentes" })).not.toBeInTheDocument();
```

```tsx
// src/pages/admin/MembershipReviewsPage.test.tsx
actionError: "Não foi possível aprovar a revisão.",
...
actionError: "Não foi possível bloquear a revisão.",
...
expect(
  await screen.findByRole("heading", { name: /revisão de membros pendentes/i }),
).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused frontend tests and confirm they fail on the old copy**

Run from `seven_tools_front/`:

```bash
npx vitest run src/pages/auth/Register.test.tsx src/components/layout/Header.test.tsx src/pages/profile/Profile.test.tsx src/pages/admin/MembershipReviewsPage.test.tsx
```

Expected: FAIL with old strings like `Other`, `revisoes`, or `Nao foi possivel`.

- [ ] **Step 3: Apply the minimal PT-BR fixes in the auth and membership surfaces**

Implement these replacements:

```tsx
// src/components/layout/Header.tsx
<p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
  Módulos
</p>
...
<Shield className="h-4 w-4" />
Revisões pendentes
```

```tsx
// src/components/admin/AdminPendingReviewsBell.tsx
return details.join(" · ");
...
const buttonLabel = `${pendingCount} revisões pendentes`;
...
<DropdownMenuLabel className="p-0 text-sm font-semibold">
  Revisões pendentes
</DropdownMenuLabel>
...
? "Confira as novas solicitações antes de liberar o acesso."
: "Nenhuma solicitação aguarda análise no momento."
...
Carregando revisões...
...
Não foi possível carregar as revisões pendentes.
...
E mais {pendingCount - previewReviews.length} revisões aguardando análise.
...
Nenhuma revisão pendente para exibir.
```

```tsx
// src/pages/auth/Register.tsx
const OTHER_COMPANY_OPTION: RegistrationCompanyOption = {
  id: OTHER_COMPANY_ID,
  name: "Outra empresa",
};

email: z.string().email("E-mail inválido");
message: "As senhas não conferem";
setCompanyLoadError("Não foi possível carregar as empresas disponíveis.");

<p className="text-center text-sm text-muted-foreground">
  Já tem conta?{" "}
```

```tsx
// src/pages/auth/Login.tsx
email: z.string().email("E-mail inválido");

<p className="text-center text-sm text-muted-foreground">
  Não tem conta?{" "}
</p>
```

```tsx
// src/pages/auth/ChangePassword.tsx
message: "As senhas não coincidem";

<p className="text-sm text-muted-foreground mb-6">
  Por segurança, defina uma nova senha antes de continuar.
</p>
```

```tsx
// src/pages/auth/AwaitingValidation.tsx
const title = isBlocked ? "Acesso bloqueado" : "Aguardando validação";
...
<p className="mt-6 text-sm text-muted-foreground">
  Assim que a validação for concluída, seu acesso será liberado automaticamente.
</p>
```

```ts
// src/auth/authService.ts
return { success: false, error: getErrorMessage(error, "Erro ao fazer login.") };
...
return { success: false, error: getErrorMessage(error, "Erro ao registrar.") };
...
return { success: false, error: getErrorMessage(error, "Erro ao trocar senha.") };
```

```tsx
// src/pages/profile/Profile.tsx
avatarUrl: z.string().url("URL inválida").or(z.literal("")).optional();
shortDescription: z.string().max(160, "Máximo de 160 caracteres").optional();
...
<Lock className="h-3 w-3" /> E-mail (não editável)
...
<p className="text-xs text-muted-foreground">Cole a URL de uma imagem. Upload direto será disponibilizado em breve.</p>
...
<p className="text-muted-foreground mb-8">Gerencie sua conta e as informações da sua empresa</p>
...
<h2 className="font-display font-semibold text-base text-primary">Administração</h2>
```

```tsx
// src/pages/admin/MembershipReviewsPage.tsx
return partners.length > 0 ? partners.join(" · ") : "Não informado";
...
toast.success("Revisão aprovada.");
toast.error("Não foi possível aprovar a revisão.");
toast.success("Revisão bloqueada.");
toast.error("Não foi possível bloquear a revisão.");
...
<h1 className="text-2xl font-semibold text-foreground">
  Não foi possível carregar a fila de revisão
</h1>
...
<h1 className="text-3xl font-semibold tracking-tight text-foreground">
  Revisão de membros pendentes
</h1>
```

- [ ] **Step 4: Re-run the focused tests**

Run from `seven_tools_front/`:

```bash
npx vitest run src/pages/auth/Register.test.tsx src/components/layout/Header.test.tsx src/pages/profile/Profile.test.tsx src/pages/admin/MembershipReviewsPage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Smoke-test the touched routes in the browser**

Run from `seven_tools_front/`:

```bash
npm run dev
```

Open and verify:

- `http://localhost:5173/login`
- `http://localhost:5173/register`
- `http://localhost:5173/aguardando-validacao`
- `http://localhost:5173/profile`
- `http://localhost:5173/admin/membros-pendentes`

Expected: no mojibake, no `Other`, no `Nao`, no broken punctuation in the touched screens.

- [ ] **Step 6: Commit the frontend auth/membership batch**

Run from `seven_tools_front/`:

```bash
git add src/pages/auth/Login.tsx src/pages/auth/Register.tsx src/pages/auth/ChangePassword.tsx src/pages/auth/AwaitingValidation.tsx src/components/layout/Header.tsx src/components/admin/AdminPendingReviewsBell.tsx src/auth/authService.ts src/pages/profile/Profile.tsx src/pages/admin/MembershipReviewsPage.tsx src/pages/auth/Register.test.tsx src/components/layout/Header.test.tsx src/pages/profile/Profile.test.tsx src/pages/admin/MembershipReviewsPage.test.tsx
git commit -m "fix(frontend): revisa textos visiveis de autenticacao e membros"
```

## Task 3: Fix frontend shell, home, and catalog copy

**Files:**
- Modify: `src/data/modules.ts`
- Modify: `src/data/tools.ts`
- Modify: `src/pages/Index.tsx`
- Modify: `src/pages/LandingPage.tsx`
- Modify: `src/pages/Tools.tsx`
- Modify: `src/pages/ModulePage.tsx`
- Modify: `src/pages/ToolDetail.tsx`
- Modify: `src/pages/NotFound.tsx`
- Test: `src/pages/Index.test.tsx`
- Test: `src/pages/Tools.test.tsx`
- Test: `src/pages/ModulePage.test.tsx`
- Test: `src/pages/ToolDetail.test.tsx`

- [ ] **Step 1: Update the test data and assertions that already encode broken Portuguese**

Apply these edits first:

```tsx
// src/pages/ModulePage.test.tsx
title: "Proposta Gestão de Tráfego Pago",
...
expect(screen.getByText(/proposta gestão de tráfego pago/i)).toBeInTheDocument();
```

```tsx
// src/pages/ToolDetail.test.tsx
expect(await screen.findByRole("button", { name: /iniciar validação/i })).toBeInTheDocument();
```

Keep the rest of the test logic the same.

- [ ] **Step 2: Run the home/catalog tests and confirm the copy assertions now fail**

Run from `seven_tools_front/`:

```bash
npx vitest run src/pages/Index.test.tsx src/pages/Tools.test.tsx src/pages/ModulePage.test.tsx src/pages/ToolDetail.test.tsx
```

Expected: FAIL where the UI still renders mojibake or unaccented text.

- [ ] **Step 3: Fix the shared catalog and home strings**

Implement these exact replacements:

```ts
// src/data/modules.ts
description: "Tráfego, conteúdo e conversão",
...
name: "Operação",
description: "Processos, equipe e eficiência",
```

```ts
// src/data/tools.ts
name: "Criação de Proposta",
...
longDescription: "Crie propostas comerciais profissionais dentro da plataforma SEVEN, organize as informações da oportunidade e evolua o material com clareza ao longo do processo comercial. Depois de salvar, siga para Validação Caloni para revisar a proposta antes do envio ao cliente.",
...
name: "Agente de Diagnóstico Comercial Caloni",
shortDescription: "Descubra o que está travando suas vendas com um diagnóstico direto do Caloni.",
...
mainBenefit: "Diagnóstico que aponta a causa raiz real e não apenas o sintoma superficial",
...
name: "Validação Caloni",
...
shortDescription: "Transforme leads em uma fila priorizada com score, faixa e ação recomendada.",
```

```tsx
// src/pages/Index.tsx
Olá, {firstName} - Hub SEVEN
...
Ferramentas, IAs e recursos exclusivos organizados por área do negócio. Tudo em um único ambiente premium.
...
Última:
...
{latestProposal.title || "Sem título"}
...
title="Módulos do Ecossistema"
subtitle="Navegue pelas áreas do negócio e acesse as ferramentas de cada módulo"
...
subtitle="Ferramentas que você marcou como favoritas"
```

```tsx
// src/pages/LandingPage.tsx
name: "Criação de Proposta",
name: "Validação Caloni",
name: "Agente de Diagnóstico Comercial Caloni",
title: "Operação",
category: "módulo",
```

```tsx
// src/pages/Tools.tsx
subtitle="Selecione um módulo para acessar as ferramentas da área"
...
{latestProposal.title || "Sem título"}
```

```tsx
// src/pages/ModulePage.tsx
<p className="text-muted-foreground">Módulo não encontrado.</p>
...
<ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao início
...
title="Ferramentas do Módulo"
subtitle={`${moduleTools.length} ${moduleTools.length === 1 ? "ferramenta disponível" : "ferramentas disponíveis"}`}
...
<p className="font-display text-base font-semibold">Em breve</p>
<p className="mt-1 max-w-xs text-sm text-muted-foreground">
  As ferramentas do módulo {module.name} estão sendo preparadas e estarão disponíveis em breve.
</p>
```

```tsx
// src/pages/ToolDetail.tsx
<p className="text-muted-foreground font-medium">Ferramenta não encontrada.</p>
...
<ArrowLeft className="h-4 w-4" /> Voltar às ferramentas
...
<h3 className="font-display font-semibold text-sm mb-2 text-primary">Benefício Principal</h3>
...
<h3 className="font-display font-semibold text-sm mb-3 text-primary">Como Usar</h3>
...
{latestProposal.title || "Sem título"}
...
: "Cliente não informado"
...
<ScanSearch className="h-4 w-4" />
Iniciar Diagnóstico
...
Iniciar Validação
...
Abrir Ferramenta
...
title="Ferramentas Relacionadas"
```

- [ ] **Step 4: Re-run the home/catalog tests**

Run from `seven_tools_front/`:

```bash
npx vitest run src/pages/Index.test.tsx src/pages/Tools.test.tsx src/pages/ModulePage.test.tsx src/pages/ToolDetail.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the frontend shell/catalog batch**

Run from `seven_tools_front/`:

```bash
git add src/data/modules.ts src/data/tools.ts src/pages/Index.tsx src/pages/LandingPage.tsx src/pages/Tools.tsx src/pages/ModulePage.tsx src/pages/ToolDetail.tsx src/pages/NotFound.tsx src/pages/Index.test.tsx src/pages/Tools.test.tsx src/pages/ModulePage.test.tsx src/pages/ToolDetail.test.tsx
git commit -m "fix(frontend): normaliza textos do hub e do catalogo"
```

## Task 4: Fix frontend commercial tool copy

**Files:**
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationConfig.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx`
- Modify: `src/pages/tools/QualificacaoLeads/LeadQualificationShell.tsx`
- Modify: `src/pages/tools/DiagnosticoComercial/DiagnosticoApp.tsx`
- Modify: `src/pages/tools/PropostaComercial/CalonValidation.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalForm.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalList.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalPDF.tsx`
- Modify: `src/pages/tools/PropostaComercial/ProposalView.tsx`
- Modify: `src/pages/tools/ValidacaoCaloni/ValidationApp.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationConfig.test.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx`
- Test: `src/pages/tools/QualificacaoLeads/LeadQualificationShell.test.tsx`
- Test: `src/pages/tools/PropostaComercial/ProposalView.test.tsx`
- Test: `src/pages/tools/ValidacaoCaloni/ValidationApp.test.tsx`
- Test: `src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.test.tsx`

- [ ] **Step 1: Update the lead qualification tests to expect corrected PT-BR**

Apply these edits first:

```tsx
// src/pages/tools/QualificacaoLeads/LeadQualificationConfig.test.tsx
expect(await screen.findByText(/configuração salva/i)).toBeInTheDocument();
```

```tsx
// src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx
expect(
  await screen.findByRole("heading", {
    name: /configure o método da empresa antes de cadastrar leads/i,
  }),
).toBeInTheDocument();
expect(screen.getByText(/defina o icp, pesos, faixas e ações/i)).toBeInTheDocument();
fireEvent.change(screen.getByLabelText(/urgência/i), { target: { value: "alta" } });
fireEvent.change(screen.getByLabelText(/nível de dor/i), { target: { value: "alta" } });
fireEvent.change(screen.getByLabelText(/observações/i), { target: { value: "Lead quente" } });
```

- [ ] **Step 2: Run the tool-page test slice and confirm it fails on the old text**

Run from `seven_tools_front/`:

```bash
npx vitest run src/pages/tools/QualificacaoLeads/LeadQualificationConfig.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationShell.test.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/tools/ValidacaoCaloni/ValidationApp.test.tsx src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.test.tsx
```

Expected: FAIL on strings such as `Nao`, `Configuracao`, `Urgencia`, `Observacoes`, or mojibake.

- [ ] **Step 3: Fix the known lead qualification strings first**

Implement these exact replacements:

```tsx
// src/pages/tools/QualificacaoLeads/LeadQualificationConfig.tsx
setFeedback("Não foi possível carregar a configuração atual.");
...
setFeedback("Configuração salva com sucesso.");
...
setFeedback("Não foi possível salvar a configuração.");
...
<h1 className="font-display text-3xl font-bold text-foreground">
  Configuração da Qualificação de Leads
</h1>
...
Defina ICP, pesos, faixas de score e ações recomendadas para liberar a fila compartilhada.
...
<h2 className="font-display text-xl font-semibold text-foreground">Pesos do score</h2>
...
Ajuste quanto cada critério impacta a nota final do lead.
...
<Label htmlFor="weightUrgency">Peso da urgência</Label>
...
<h2 className="font-display text-xl font-semibold text-foreground">Faixas e ações</h2>
...
<Label htmlFor="bronzeAction">Ação bronze</Label>
...
{feedback ?? "A configuração é compartilhada por toda a empresa nesta V1."}
...
{isSaving ? "Salvando..." : "Salvar configuração"}
```

```tsx
// src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx
setFeedback("Não foi possível salvar o lead agora.");
...
<p className="text-sm text-muted-foreground">Carregando configuração...</p>
...
Não foi possível carregar a configuração da empresa
...
Tente novamente em instantes. Se o problema continuar, revise o método comercial antes de cadastrar novos leads.
...
Abrir configuração
...
Configure o método da empresa antes de cadastrar leads
...
Defina o ICP, pesos, faixas e ações para liberar o cadastro manual da fila priorizada.
...
Ir para configuração
...
Preencha o formulário padrão da SEVEN com as opções alinhadas ao método configurado pela empresa.
...
<Label htmlFor="urgency">Urgência</Label>
...
<Label htmlFor="painLevel">Nível de dor</Label>
...
<Label htmlFor="notes">Observações</Label>
placeholder="Contexto complementar do SDR, origem do lead, objeções ou sinais de fit."
```

- [ ] **Step 4: Sweep the remaining tool pages with the exact grep and fix every returned user-facing line before leaving the task**

Run from `seven_tools_front/`:

```powershell
Get-ChildItem src/pages/tools -Recurse -File -Include *.ts,*.tsx |
  Select-String -Pattern 'Ã|Â·|Nao|Configuracao|Validacao|Diagnostico|Urgencia|Observacoes|informacoes|acao|acoes|titulo' |
  Select-Object Path,LineNumber,Line
```

Expected: output must cover the remaining files in `DiagnosticoComercial/`, `PropostaComercial/`, `QualificacaoLeads/`, and `ValidacaoCaloni/`. Fix every returned user-facing line before continuing.

- [ ] **Step 5: Re-run the tool-page tests and the production build**

Run from `seven_tools_front/`:

```bash
npx vitest run src/pages/tools/QualificacaoLeads/LeadQualificationConfig.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationShell.test.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/tools/ValidacaoCaloni/ValidationApp.test.tsx src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.test.tsx
npm run build
```

Expected: PASS and successful build.

- [ ] **Step 6: Commit the frontend tool batch**

Run from `seven_tools_front/`:

```bash
git add src/pages/tools/QualificacaoLeads/LeadQualificationConfig.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.tsx src/pages/tools/QualificacaoLeads/LeadQualificationShell.tsx src/pages/tools/DiagnosticoComercial/DiagnosticoApp.tsx src/pages/tools/PropostaComercial/CalonValidation.tsx src/pages/tools/PropostaComercial/ProposalForm.tsx src/pages/tools/PropostaComercial/ProposalList.tsx src/pages/tools/PropostaComercial/ProposalPDF.tsx src/pages/tools/PropostaComercial/ProposalView.tsx src/pages/tools/ValidacaoCaloni/ValidationApp.tsx src/pages/tools/QualificacaoLeads/LeadQualificationConfig.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationShell.test.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/tools/ValidacaoCaloni/ValidationApp.test.tsx src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.test.tsx
git commit -m "fix(frontend): corrige textos visiveis das ferramentas comerciais"
```

## Task 5: Translate backend user-facing messages to PT-BR

**Files:**
- Modify: `app/dependencies.py`
- Modify: `app/modules/auth/router.py`
- Modify: `app/modules/ai/router.py`
- Modify: `app/modules/lead_qualification/router.py`
- Modify: `app/modules/lead_qualification/service.py`
- Modify: `app/modules/membership/service.py`
- Modify: `app/modules/proposals/router.py`
- Modify: `app/modules/users/router.py`
- Test: `tests/test_ai.py`
- Test: `tests/test_auth.py`
- Test: `tests/test_lead_qualification.py`
- Test: `tests/test_membership.py`
- Test: `tests/test_proposals.py`
- Test: `tests/test_users.py`

- [ ] **Step 1: Update the pytest assertions that already pin user-facing details**

Apply these edits first:

```python
# tests/test_auth.py
assert response.json()["detail"] == "Senha alterada com sucesso."
```

```python
# tests/test_lead_qualification.py
assert response.json()["detail"] == "Configuração de qualificação de leads não configurada."
```

```python
# tests/test_ai.py
assert "indisponível" in response.json()["detail"].lower()
```

Keep all code assertions unchanged.

- [ ] **Step 2: Run the focused backend tests and confirm they fail on the old English or mojibake**

Run from `seven_tools_api/`:

```bash
pytest tests/test_ai.py tests/test_auth.py tests/test_lead_qualification.py tests/test_membership.py tests/test_proposals.py tests/test_users.py -q
```

Expected: FAIL where the API still returns English detail strings or old ASCII text.

- [ ] **Step 3: Translate the backend messages without changing response shape or error codes**

Implement these exact replacements:

```python
# app/dependencies.py
_error(status.HTTP_401_UNAUTHORIZED, "Cabeçalho de autorização inválido.", "INVALID_AUTH")
_error(status.HTTP_401_UNAUTHORIZED, "Sessão inválida ou expirada.", "INVALID_SESSION")
_error(status.HTTP_401_UNAUTHORIZED, "Sessão expirada.", "SESSION_EXPIRED")
_error(status.HTTP_401_UNAUTHORIZED, "Usuário não encontrado.", "USER_NOT_FOUND")
_error(status.HTTP_403_FORBIDDEN, "Validação de membro pendente.", "VALIDATION_PENDING")
_error(status.HTTP_403_FORBIDDEN, "Membro bloqueado.", "MEMBERSHIP_BLOCKED")
_error(status.HTTP_403_FORBIDDEN, "Acesso de administrador obrigatório.", "ADMIN_REQUIRED")
```

```python
# app/modules/auth/router.py
detail={"detail": "Empresa não encontrada.", "code": token_or_error}
detail={"detail": "E-mail já cadastrado.", "code": token_or_error}
detail={"detail": "E-mail ou senha inválidos.", "code": "INVALID_CREDENTIALS"}
raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cabeçalho de autorização inválido.")
raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão inválida.")
raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão expirada.")
return {"detail": "Sessão encerrada com sucesso."}
detail={"detail": "Senha atual inválida.", "code": "INVALID_CURRENT_PASSWORD"}
return {"detail": "Senha alterada com sucesso."}
```

```python
# app/modules/lead_qualification/router.py
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Empresa do usuário não configurada.")
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuração de qualificação de leads não encontrada.")
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead não encontrado.")
```

```python
# app/modules/lead_qualification/service.py
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Empresa do usuário não configurada.")
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Configuração de qualificação de leads não configurada.")
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Empresa do lead não configurada.")
```

```python
# app/modules/users/router.py
detail={"detail": "E-mail já cadastrado.", "code": error_code}
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma empresa associada.")
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada.")
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"detail": "Ferramenta já está nos favoritos.", "code": "DUPLICATE_FAVORITE"})
return {"detail": "Favorito adicionado com sucesso."}
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"detail": "Favorito não encontrado.", "code": "FAVORITE_NOT_FOUND"})
return {"detail": "Favorito removido com sucesso."}
```

```python
# app/modules/membership/service.py
detail={"detail": "Empresa não encontrada.", "code": "COMPANY_NOT_FOUND"}
detail={"detail": "Solicitação de empresa não encontrada.", "code": "COMPANY_REQUEST_NOT_FOUND"}
detail={"detail": "Usuário não encontrado.", "code": "USER_NOT_FOUND"}
detail={"detail": "Usuário não está com revisão pendente.", "code": "USER_NOT_PENDING_REVIEW"}
detail={"detail": "Resolva a empresa antes de aprovar a revisão.", "code": "COMPANY_RESOLUTION_REQUIRED"}
```

```python
# app/modules/proposals/router.py
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposta não encontrada.")
return {"detail": "Proposta excluída com sucesso."}
```

```python
# app/modules/ai/router.py
detail="Serviço de IA indisponível. Tente novamente em alguns instantes."
detail="Não foi possível extrair texto do arquivo."
raise HTTPException(status_code=404, detail="Proposta não encontrada.")
```

- [ ] **Step 4: Re-run the focused backend tests**

Run from `seven_tools_api/`:

```bash
pytest tests/test_ai.py tests/test_auth.py tests/test_lead_qualification.py tests/test_membership.py tests/test_proposals.py tests/test_users.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit the backend message batch**

Run from `seven_tools_api/`:

```bash
git add app/dependencies.py app/modules/auth/router.py app/modules/ai/router.py app/modules/lead_qualification/router.py app/modules/lead_qualification/service.py app/modules/membership/service.py app/modules/proposals/router.py app/modules/users/router.py tests/test_ai.py tests/test_auth.py tests/test_lead_qualification.py tests/test_membership.py tests/test_proposals.py tests/test_users.py
git commit -m "fix(api): traduz mensagens expostas ao usuario para pt-br"
```

## Task 6: Final sweep and cross-repo validation

**Files:**
- Read-only validation across `seven_tools_front/`
- Read-only validation across `seven_tools_api/`

- [ ] **Step 1: Run the final frontend grep for mojibake and English leaks**

Run from `seven_tools_front/`:

```powershell
Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
  Select-String -Pattern 'Ã|Â·|Other|Invalid email|Invalid authorization|Proposal not found|Nao|Configuracao|Validacao|Diagnostico|Urgencia|Observacoes' |
  Select-Object Path,LineNumber,Line
```

Expected: zero unexpected matches in user-facing files. If a returned line is comments, test fixture data, or non-user-facing internals, confirm it manually before changing it.

- [ ] **Step 2: Run the final backend grep for untranslated user-facing details**

Run from `seven_tools_api/`:

```powershell
Get-ChildItem app -Recurse -File -Include *.py |
  Select-String -Pattern 'detail=.*"(Invalid|Session|Proposal|Company|User|Favorite|Membership|Admin)|return \{"detail": "(Favorite|Proposal|Logged out)"' |
  Select-Object Path,LineNumber,Line
```

Expected: zero matches in routes, dependencies, or services that feed the frontend.

- [ ] **Step 3: Run the final frontend validation suite**

Run from `seven_tools_front/`:

```bash
npx vitest run src/pages/auth/Register.test.tsx src/components/layout/Header.test.tsx src/pages/profile/Profile.test.tsx src/pages/admin/MembershipReviewsPage.test.tsx src/pages/Index.test.tsx src/pages/Tools.test.tsx src/pages/ModulePage.test.tsx src/pages/ToolDetail.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationConfig.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationForm.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationDetail.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationQueue.test.tsx src/pages/tools/QualificacaoLeads/LeadQualificationShell.test.tsx src/pages/tools/PropostaComercial/ProposalView.test.tsx src/pages/tools/ValidacaoCaloni/ValidationApp.test.tsx src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.test.tsx
npm run build
```

Expected: PASS and successful build.

- [ ] **Step 4: Run the final backend validation suite**

Run from `seven_tools_api/`:

```bash
pytest tests/test_ai.py tests/test_auth.py tests/test_lead_qualification.py tests/test_membership.py tests/test_proposals.py tests/test_users.py -q
```

Expected: PASS.

- [ ] **Step 5: Manually verify the most important user-facing routes**

Verify these frontend routes in the browser:

- `http://localhost:5173/login`
- `http://localhost:5173/register`
- `http://localhost:5173/aguardando-validacao`
- `http://localhost:5173/hub`
- `http://localhost:5173/tools`
- `http://localhost:5173/modules/comercial`
- `http://localhost:5173/tools/proposta-comercial-smart`
- `http://localhost:5173/tools/validacao-caloni`
- `http://localhost:5173/tools/qualificacao-de-leads/app/config`
- `http://localhost:5173/tools/qualificacao-de-leads/app/new`
- `http://localhost:5173/profile`
- `http://localhost:5173/admin/membros-pendentes`

Expected: no mojibake, no `Other`, no untranslated API errors, and punctuation still reads naturally.

## Global Acceptance Criteria

- [ ] Nenhuma superficie revisada exibe mojibake.
- [ ] Nenhuma superficie revisada exibe texto em ingles quando ha equivalente PT-BR claro.
- [ ] Os erros expostos pelo backend mantem os mesmos `code` values e a mesma estrutura de payload.
- [ ] Os testes focados de frontend e backend passam.
- [ ] `npm run build` passa no `seven_tools_front`.
- [ ] Cada batch foi commitado apenas no sub-repo correto.
