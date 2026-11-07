# Spec - Esqueci Minha Senha

**Data:** 2026-05-26
**Repos afetados:** `seven_tools_front` + `seven_tools_api`
**Status:** Design aprovado, pronto para plano de implementacao
**Branch alvo:** `main` nos dois repos. Nao usar nem alterar `sales-copilot-caloni-core`.

## 1. Contexto

O SEVEN Tools ja tem autenticacao com login, registro, sessoes server-side e troca obrigatoria de senha. O fluxo atual permite login por e-mail/senha e troca autenticada em `/alterar-senha`, mas nao ha recuperacao quando o usuario perdeu a senha.

A feature adiciona um fluxo publico de recuperacao por e-mail sem revelar se uma conta existe. Em producao, o link sera enviado por e-mail transacional. Em desenvolvimento local, quando nao houver provedor configurado, o backend registra o link no log para teste manual e nunca retorna o token na resposta da API.

## 2. Decisoes aprovadas

- Usar tabela separada `password_reset_tokens`, nao campos temporarios em `users`.
- Guardar apenas hash do token no banco.
- Resposta do pedido de reset sempre generica.
- Provedor recomendado para producao: Resend.
- Em dev/local sem chave de e-mail: logar o link de reset no backend.
- Nao retornar `dev_reset_url` na resposta.
- Apos reset bem-sucedido, invalidar sessoes existentes do usuario.
- O reset nao cria nova sessao automaticamente; o usuario volta ao login.

## 3. Fluxo do usuario

1. Usuario abre `/login`.
2. Abaixo do campo de senha aparece o link **Esqueci minha senha**.
3. Clicando no link, abre `/esqueci-senha`.
4. Usuario informa o e-mail e envia.
5. A tela sempre mostra: "Se este e-mail estiver cadastrado, enviaremos instrucoes para redefinir sua senha."
6. Se o e-mail existir, o backend gera um token temporario e monta um link como `/redefinir-senha?token=<token>`.
7. Em producao, o link vai por e-mail via Resend. Em dev/local, o link aparece no log do backend.
8. Usuario abre o link e ve a tela `/redefinir-senha`.
9. Usuario informa nova senha e confirmacao.
10. Se o token for valido, nao expirado e nao usado, o backend altera a senha, marca o token como usado e remove sessoes antigas.
11. A tela mostra sucesso e oferece voltar para o login.
12. Usuario entra com a nova senha.

## 4. Backend

### 4.1 Modelo

Criar `app/models/password_reset_token.py`.

Campos:

- `id: UUID`, primary key.
- `user_id: UUID`, foreign key para `users.id`.
- `token_hash: str`, unico, indexado.
- `expires_at: datetime`, obrigatorio.
- `used_at: datetime | None`.
- `created_at: datetime`.

Relacionamento:

- `PasswordResetToken.user -> User`.
- Opcionalmente `User.password_reset_tokens`.

Indices:

- `token_hash` unico para lookup direto.
- `user_id` para invalidar tokens anteriores do usuario.
- `expires_at` para limpeza futura.

### 4.2 Migration

Adicionar migration Alembic que cria `password_reset_tokens`.

Downgrade remove indices e tabela.

### 4.3 Settings/env

Adicionar em `app/config.py`:

- `frontend_base_url: str = "http://localhost:8080"`
- `password_reset_token_ttl_minutes: int = 60`
- `email_provider: str = "log"`
- `email_from: str = "SEVEN Tools <no-reply@sevendigitais.com>"`
- `resend_api_key: str = ""`

Atualizar `seven_tools_api/.env.example` com as mesmas variaveis.

Comportamento:

- `EMAIL_PROVIDER=log`: nao envia e-mail real; registra link no log.
- `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`: envia e-mail real via Resend.
- `EMAIL_PROVIDER=resend` sem chave: registra warning e nao expoe token ao cliente.

### 4.4 Servico de e-mail

Criar modulo pequeno e isolado, por exemplo `app/modules/email/service.py`.

Interface:

```python
def send_password_reset_email(to_email: str, reset_url: str) -> None:
    ...
```

Implementacao:

- Se provider for `log`, usar logger com mensagem operacional contendo o link.
- Se provider for `resend`, chamar `https://api.resend.com/emails` com `httpx`.
- Enviar `from`, `to`, `subject`, `html` e `text`.
- Nao bloquear o fluxo do usuario com detalhes do provedor; erros devem ser logados.

### 4.5 Servico de reset

Adicionar funcoes em `app/modules/auth/service.py` ou arquivo focado `app/modules/auth/password_reset.py`.

`request_password_reset(db, email) -> None`:

- Normaliza e-mail com `strip().lower()`.
- Busca usuario por `func.lower(User.email)`.
- Se nao existir, retorna sem erro.
- Se existir, marca tokens nao usados anteriores desse usuario como usados.
- Gera token cru com `secrets.token_urlsafe(32)` ou helper equivalente.
- Salva `sha256(token).hexdigest()` em `token_hash`.
- Define `expires_at = now + ttl`.
- Monta `reset_url = f"{frontend_base_url}/redefinir-senha?token={token}"`.
- Chama `send_password_reset_email(user.email, reset_url)`.
- Commit.

`confirm_password_reset(db, token, new_password) -> bool`:

- Calcula hash do token recebido.
- Busca `PasswordResetToken` por hash.
- Retorna `False` se nao existir, se `used_at` estiver preenchido ou se expirou.
- Atualiza `user.password_hash = hash_password(new_password)`.
- Define `user.must_change_password = False`.
- Define `used_at = now`.
- Remove todas as sessoes existentes desse usuario.
- Commit e retorna `True`.

### 4.6 Schemas

Adicionar em `app/schemas/auth.py`:

```python
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirmRequest(BaseModel):
    token: str = Field(..., min_length=20)
    new_password: str = Field(..., min_length=6)
```

O e-mail deve usar o mesmo normalizador dos schemas de login/registro.

### 4.7 Endpoints

Adicionar em `app/modules/auth/router.py`:

`POST /api/v1/auth/password-reset/request`

- Publico por necessidade do fluxo de recuperacao.
- Rate limit mais restritivo que login, por exemplo `3/minute`.
- Body: `{ "email": "usuario@email.com" }`.
- Resposta sempre `200`:

```json
{
  "detail": "Se este e-mail estiver cadastrado, enviaremos instrucoes para redefinir sua senha."
}
```

`POST /api/v1/auth/password-reset/confirm`

- Publico por necessidade do fluxo.
- Rate limit, por exemplo `5/minute`.
- Body: `{ "token": "...", "new_password": "..." }`.
- Sucesso `200`:

```json
{
  "detail": "Senha redefinida com sucesso."
}
```

- Token invalido, expirado ou usado: `400` com codigo generico:

```json
{
  "detail": {
    "detail": "Link invalido ou expirado. Solicite uma nova recuperacao.",
    "code": "INVALID_OR_EXPIRED_RESET_TOKEN"
  }
}
```

## 5. Frontend

### 5.1 Rotas

Adicionar rotas publicas dentro do bloco que monta `AuthProvider`, mas fora de `PublicOnlyRoute`.

- `/esqueci-senha` -> `ForgotPassword`
- `/redefinir-senha` -> `ResetPassword`

Motivo: se o usuario abrir o link com um token antigo ainda salvo no `localStorage`, a rota de reset continua acessivel e nao redireciona para o hub antes de concluir o fluxo.

### 5.2 Auth service

Adicionar em `src/auth/authService.ts`:

```ts
async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }>
async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; error?: string }>
```

Endpoints:

- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`

Usar `getErrorMessage` existente para mensagens de erro.

### 5.3 Login

Em `src/pages/auth/Login.tsx`:

- Adicionar link `Esqueci minha senha` abaixo do campo `PasswordField`, alinhado a direita ou em linha propria.
- Link aponta para `/esqueci-senha`.
- Manter login, cadastro, validacao e redirecionamentos atuais inalterados.

### 5.4 Tela `ForgotPassword`

Criar `src/pages/auth/ForgotPassword.tsx`.

Usar `AuthPageLayout`, `Label`, `Input`, `Button` e padrao visual existente.

Conteudo:

- H1: `Recuperar senha`
- Texto de apoio: `Informe seu e-mail para receber instrucoes de redefinicao.`
- Campo `E-mail`, `type="email"`, `autoComplete="email"`.
- CTA primaria: `Enviar instrucoes`.
- Link secundario: `Voltar para login`.

Estados:

- Submitting: botao disabled + `Loader2`.
- Sucesso: trocar o formulario por mensagem generica segura.
- Erro de rede/validacao: caixa de erro padrao, sem sugerir se conta existe.

### 5.5 Tela `ResetPassword`

Criar `src/pages/auth/ResetPassword.tsx`.

Usar `AuthPageLayout` e `PasswordField`.

Comportamento:

- Ler `token` de `useSearchParams`.
- Se token estiver ausente, mostrar estado de link invalido com CTA `Solicitar novo link`.
- Form com `Nova senha` e `Confirmar nova senha`.
- Validacao client-side:
  - nova senha com minimo de 6 caracteres;
  - confirmacao igual a nova senha.
- Submit chama `authService.confirmPasswordReset(token, newPassword)`.
- Sucesso: mostrar confirmacao e botao/link para `/login`.
- Falha por token: mostrar mensagem generica e CTA para `/esqueci-senha`.

## 6. UI/UX design

Regras aplicadas a partir do `ui-ux-pro-max` e do design system existente:

- Manter o mesmo `AuthPageLayout` das telas de login, cadastro e troca de senha.
- Usar tokens semanticos (`bg-card`, `text-muted-foreground`, `border-destructive`, `text-primary`) em vez de cores cruas.
- Uma CTA primaria por tela.
- Labels visiveis em todos os campos; placeholder nao substitui label.
- Erros proximos ao campo quando forem erros de formulario.
- Mensagens de sucesso/erro de submit em bloco com `aria-live="polite"` ou `role="status"` quando aplicavel.
- Touch targets com altura minima equivalente aos botoes shadcn existentes.
- `autoComplete` correto:
  - `email` na tela de solicitacao;
  - `new-password` nos campos de redefinicao.
- Icones apenas via Lucide quando necessario (`Loader2`), sem emojis.
- Texto direto e profissional, sem termos tecnicos como token, log, provedor ou API na UI.
- Layout mobile-first com `max-w-md` herdado do `AuthPageLayout`; sem scroll horizontal.

## 7. Seguranca

- Nao revelar se o e-mail existe por status, body ou copy da UI.
- Nao salvar token cru no banco.
- Token tem expiracao curta, default 60 minutos.
- Token usado nao pode ser reutilizado.
- Um novo pedido invalida tokens anteriores nao usados do mesmo usuario.
- Reset bem-sucedido invalida sessoes antigas.
- Reset limpa `must_change_password`, porque o usuario ja comprovou controle do e-mail e definiu senha nova.
- Endpoints publicos ficam rate-limited.
- Logs de dev nao aparecem na resposta HTTP.
- E-mails devem conter link HTTPS em producao via `FRONTEND_BASE_URL`.

## 8. Testes

### Backend

Adicionar cobertura em `tests/test_auth.py` ou arquivo dedicado `tests/test_password_reset.py`.

Casos:

- Pedido de reset para e-mail inexistente retorna 200 com mensagem generica.
- Pedido de reset para e-mail existente retorna a mesma mensagem generica e cria token hasheado.
- Token cru nao e salvo no banco.
- Confirmacao com token valido altera senha.
- Nova senha permite login.
- Senha antiga deixa de funcionar.
- Token usado nao pode ser reutilizado.
- Token expirado nao pode ser usado.
- Novo pedido invalida token anterior nao usado.
- Reset bem-sucedido invalida sessoes existentes do usuario.

### Frontend

Adicionar testes conforme encaixe local:

- Login renderiza link `Esqueci minha senha` apontando para `/esqueci-senha`.
- `ForgotPassword` envia e-mail para `authService.requestPasswordReset` e mostra mensagem generica.
- `ResetPassword` exige confirmacao igual.
- `ResetPassword` chama `authService.confirmPasswordReset` com token da URL.
- Sucesso em `ResetPassword` oferece retorno para login.

## 9. Criterios de aceite

- Usuario consegue pedir recuperacao pela tela de login.
- A resposta nao revela se o e-mail existe.
- Em dev/local, link aparece apenas no log do backend quando aplicavel.
- Em producao, Resend pode enviar o e-mail via envs.
- Token expira.
- Token nao pode ser reutilizado.
- Token anterior e invalidado quando novo reset e pedido.
- Nova senha permite login.
- Senha antiga nao permite login depois do reset.
- Sessoes antigas sao invalidadas apos reset.
- Login atual, cadastro, sessao, troca obrigatoria de senha e usuarios existentes continuam funcionando.
- `.env.example` do backend inclui as novas variaveis.
- Testes backend relevantes passam.
- Testes frontend relevantes passam.

## 10. Fora do escopo

- Tela administrativa para listar resets.
- Job automatico para limpeza de tokens expirados.
- Templates sofisticados de e-mail com branding completo.
- Magic links de login sem senha.
- MFA.
- Alteracoes nas ferramentas comerciais.

## 11. Referencias de implementacao

Arquivos atuais relevantes:

- Backend auth router: `seven_tools_api/app/modules/auth/router.py`
- Backend auth service: `seven_tools_api/app/modules/auth/service.py`
- Backend schemas: `seven_tools_api/app/schemas/auth.py`
- Backend user/session models: `seven_tools_api/app/models/user.py`, `seven_tools_api/app/models/session.py`
- Backend envs: `seven_tools_api/app/config.py`, `seven_tools_api/.env.example`
- Frontend rotas: `seven_tools_front/src/App.tsx`
- Frontend login: `seven_tools_front/src/pages/auth/Login.tsx`
- Frontend auth service: `seven_tools_front/src/auth/authService.ts`
- Frontend auth layout: `seven_tools_front/src/components/auth/AuthPageLayout.tsx`
- Frontend password field: `seven_tools_front/src/components/auth/PasswordField.tsx`
