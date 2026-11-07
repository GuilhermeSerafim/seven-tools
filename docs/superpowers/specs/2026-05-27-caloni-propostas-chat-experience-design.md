# Spec - Caloni Propostas: experiencia conversacional especialista

**Data:** 2026-05-27  
**Status:** design aprovado para planejamento  
**Repos afetados:** `seven_tools_front` e `seven_tools_api`  
**Ferramenta:** Caloni Propostas (`proposta-comercial-smart`)  

## 1. Contexto

A ferramenta Caloni Propostas ja existe como chat unificado para criar, editar e validar propostas comerciais. O backend possui o endpoint `POST /api/v1/ai/proposal-assistant`, com tool calls para atualizar rascunho, pedir salvamento, editar proposta salva, abrir proposta existente e validar proposta salva. O frontend ja usa `ChatToolPage`, `ToolChatShell`, historico por ferramenta e cards de proposta.

O problema observado nos testes foi de experiencia: em alguns momentos o fluxo parecia formulario com IA, mostrava rascunho parcial cedo demais ou perguntava para confirmar criacao mesmo com dados pendentes. O objetivo desta spec e refinar a experiencia para parecer uma conversa de IA boa, com expertise comercial do Caloni, sem perder guardrails deterministas.

## 2. Objetivo

Transformar a Caloni Propostas em uma experiencia conversacional especialista: o usuario conversa com o Caloni, fornece contexto comercial em texto livre e recebe um esqueleto de proposta mais inteligente, claro e comercialmente defendavel.

O MVP nao deve tentar gerar uma proposta final perfeita em PDF. Ele deve provar que o usuario sente que falou com um especialista comercial que entendeu o contexto, organizou a proposta, melhorou titulo/descricao/posicionamento e deixou o material pronto para salvar, editar ou validar.

## 3. Decisoes aprovadas

1. O inicio de "nova proposta" deve pedir a checklist completa em tom natural.
2. O usuario pode mandar tudo em texto corrido, sem formato rigido.
3. Durante a coleta, nao mostrar card parcial de rascunho.
4. O Caloni pode inferir campos obvios, como titulo e descricao, quando houver contexto suficiente.
5. O Caloni nao pode inventar dados factuais ausentes, como e-mail, telefone, valor, prazo ou escopo.
6. Quando o esqueleto obrigatorio estiver completo, mostrar resposta breve + card completo de revisao + pergunta para editar ou criar.
7. Criar/salvar proposta exige confirmacao explicita do usuario.
8. A experiencia deve ser evidentemente parecida com ChatGPT: novo chat, busca, recentes, continuidade de conversa, mensagens limpas e artifacts apenas quando forem uteis.
9. A geracao de apresentacao HTML/PDF com `guizang-ppt-skill` fica para expansao posterior, apos a proposta estar criada/salva.

## 4. Escopo do MVP

### Dentro

- Refinar regras do `proposal_assistant` para agir como especialista comercial, nao coletor de formulario.
- Ajustar comportamento do inicio de nova proposta para pedir a checklist completa em linguagem natural.
- Garantir que cards parciais nao aparecam durante a coleta.
- Garantir que o card completo apareca apenas quando todos os campos obrigatorios estiverem preenchidos ou inferidos com seguranca.
- Melhorar textos de fallback do frontend para manter tom humano quando o backend retorna tool result sem texto suficiente.
- Preservar historico de conversa por ferramenta usando `ToolChatSession`.
- Reidratar mensagens, payloads e rascunho ao abrir uma conversa antiga.
- Reforcar testes backend/frontend para os guardrails de UX.

### Fora

- Gerar PDF ou HTML navegavel da proposta.
- Editor visual de proposta.
- Multiplas versoes de proposta.
- Envio por e-mail.
- Assinatura, contrato ou checkout.
- Busca semantica no historico.
- Renomear/favoritar/excluir conversas.

## 5. Comportamento conversacional

### 5.1 Inicio de proposta nova

Quando o usuario inicia com "Quero montar uma proposta comercial nova", o Caloni deve responder com uma checklist completa em tom natural. A resposta deve deixar claro que o usuario pode mandar tudo em texto corrido.

Exemplo de direcao:

```text
Perfeito. Para eu montar um bom esqueleto da proposta, me envie em texto corrido:
cliente, empresa, e-mail, telefone, problema ou oportunidade, objetivo comercial,
escopo, valor, prazo e qualquer contexto estrategico que ajude a vender melhor.
```

Essa mensagem nao deve soar como formulario. O objetivo e acelerar quem ja tem tudo em maos e manter a sensacao de chat.

### 5.2 Durante a coleta

Durante a coleta, a conversa e o principal artefato. O Caloni deve:

- confirmar brevemente o que capturou;
- apontar lacunas importantes;
- fazer perguntas inteligentes quando algo pode fortalecer a proposta;
- atualizar o draft via `patch_draft`;
- evitar listas longas repetitivas a cada turno;
- nao renderizar card parcial;
- nao oferecer criacao/salvamento enquanto faltarem campos obrigatorios.

Exemplo:

```text
Anotei cliente, empresa, escopo, valor e prazo. Para fechar o esqueleto, ainda preciso do e-mail e telefone do cliente.
```

### 5.3 Inferencia permitida

O Caloni pode inferir campos obvios quando o usuario forneceu contexto suficiente. Exemplos:

- criar um titulo a partir do escopo e da empresa;
- transformar escopo em descricao executiva do projeto;
- melhorar a clareza da proposta de valor;
- organizar o texto em uma formulacao mais comercial.

Exemplo:

```text
Anotei os dados e completei o esqueleto com um titulo e uma descricao coerentes.
```

Ele nao deve tratar inferencia como fato novo. Se houver ambiguidade relevante, deve perguntar.

### 5.4 Inferencia proibida

O Caloni nao deve inventar:

- e-mail;
- telefone;
- valor;
- prazo;
- escopo nao informado;
- nome de empresa;
- condicoes comerciais;
- promessas de entrega.

Quando faltar dado factual obrigatorio, ele pergunta de forma direta.

### 5.5 Esqueleto completo

Quando todos os campos obrigatorios estiverem completos, a resposta deve combinar:

1. texto humano curto;
2. card completo do rascunho;
3. pergunta final: editar ou criar.

Exemplo:

```text
Fechei o esqueleto da proposta e melhorei titulo e descricao com base no contexto que voce passou.
Da uma olhada: quer editar algum ponto ou posso criar a proposta?
```

O card e o artifact de revisao. A conversa e onde a expertise comercial acontece.

## 6. Campos obrigatorios

Campos obrigatorios do esqueleto:

- `title`;
- `clientName`;
- `clientCompany`;
- `clientEmail`;
- `clientPhone`;
- `projectDescription`;
- `scope`;
- `value`;
- `deadline`.

Campo opcional:

- `notes`.

Regra: `request_save` so pode gerar card de confirmacao se todos os obrigatorios estiverem presentes. Caso contrario, o backend ou o frontend deve degradar para resposta textual com campos faltantes.

## 7. Arquitetura

### 7.1 Abordagem escolhida

A abordagem aprovada e prompt + guardrails deterministas.

O LLM conduz a conversa e decide quando chamar tool calls. O codigo garante as invariantes de produto:

- proposta nao e salva sem confirmacao;
- proposta nao e salva incompleta;
- card parcial nao aparece;
- card completo so aparece no momento correto;
- historico reabre mensagens e payloads;
- tool call invalida nao quebra a conversa.

### 7.2 Backend

Arquivos principais:

- `app/modules/ai/prompts/proposal_assistant.py`;
- `app/modules/ai/tools.py`;
- `app/modules/ai/service.py`;
- `app/modules/ai/schemas.py`.

Mudancas esperadas:

- reforcar `ASSISTANT_RULES` com a ideia de especialista comercial;
- declarar que o Caloni usa os playbooks para melhorar proposta de valor, clareza, objecoes, posicionamento e fechamento;
- ajustar descricoes de tools para evitar `request_save` prematuro;
- manter `load_caloni_knowledge("proposal_assistant")`;
- manter `_REQUIRED_DRAFT_FIELDS` como guardrail deterministico;
- manter fallback para tool calls invalidas.

### 7.3 Frontend

Arquivos principais:

- `src/pages/ChatToolPage.tsx`;
- `src/agents/proposal/config.ts`;
- `src/agents/proposal/ProposalDraftPreviewCard.tsx`;
- `src/agents/proposal/ProposalSaveConfirmCard.tsx`;
- `src/agents/proposal/ProposalUpdateCard.tsx`;
- `src/agents/chat-sessions/*`.

Mudancas esperadas:

- garantir que `proposal_draft_patch` parcial nao renderize card;
- revisar textos de fallback para ficarem naturais e comerciais;
- garantir card completo apenas quando `getMissingRequiredProposalFields` retornar vazio;
- manter `ToolChatShell` como sidebar padrao;
- garantir que `Novo chat` reseta draft e cria sessao nova;
- garantir que conversa antiga reidrata mensagens, payloads e draft derivado.

## 8. UI/UX

A UI deve seguir o design system atual do SEVEN Tools e parecer uma experiencia de chat de IA:

- sidebar com Novo chat, busca e recentes;
- conversa central limpa;
- header compacto do Caloni;
- composer fixo no rodape;
- mensagens com boa leitura;
- artifacts/cards somente quando ajudam na revisao ou acao.

Guardrails de UI:

- usar tokens do design system, sem hex solto;
- usar Lucide para icones, sem emojis;
- foco visivel e navegacao por teclado;
- botoes com area clicavel minima de 44px;
- contraste adequado em dark mode;
- mobile com sidebar em sheet;
- loading e erro sempre com caminho de recuperacao;
- evitar layout shift quando card, loading ou mensagem aparecer.

O card completo deve ter:

- titulo claro;
- todos os campos obrigatorios;
- destaque sutil para campos inferidos, se aplicavel;
- acao primaria `Criar proposta`;
- acao secundaria `Editar pelo chat`;
- estados de loading/disabled durante salvamento.

## 9. Dados e persistencia

A fonte reabrivel da conversa e `ToolChatSession`:

- mensagens de usuario e assistant sao persistidas;
- payloads estruturados sao persistidos;
- `metadata.proposal_id` vincula conversa a proposta salva ou aberta;
- sessoes sao filtradas por `tool_slug=proposta-comercial-smart`.

O draft pode continuar local/derivado, mas deve ser reconstruivel a partir de mensagens com `proposal_draft_patch` ao reabrir sessao antiga.

## 10. Expansao futura: apresentacao HTML/PDF

A geracao de material apresentavel fica fora deste MVP, mas deve ser registrada como caminho de evolucao.

Fluxo futuro:

1. proposta criada/salva;
2. usuario aciona `Gerar apresentacao`;
3. sistema usa `guizang-ppt-skill` para gerar um HTML navegavel em formato deck;
4. usuario revisa o HTML;
5. interface oferece opcao de baixar/exportar em PDF.

Essa expansao transforma a proposta estruturada em material comercial compartilhavel. Ela deve vir depois que o fluxo conversacional estiver validado.

## 11. Testes

### Backend

- `request_save` com campo obrigatorio faltando nao retorna `proposal_save_request`;
- `patch_draft` aceita titulo/descricao inferidos quando enviados pelo modelo;
- tool call invalida retorna resposta textual sem quebrar estado;
- prompt contem regras de experiencia de chat, expertise Caloni e bloqueio de formulario rigido;
- validacao so roda com `proposal_id` valido e pertencente ao usuario;
- proposta inexistente ou de outro usuario retorna resposta segura.

### Frontend

- nova proposta nao renderiza card parcial;
- `proposal_draft_patch` incompleto atualiza draft, mas nao mostra artifact;
- card completo aparece apenas com todos os obrigatorios;
- card completo mostra CTA principal de criar e secundario de editar;
- novo chat reseta draft;
- abrir sessao antiga reidrata mensagens + payloads;
- historico mostra somente sessoes de `proposta-comercial-smart`;
- erro de IA ou persistencia nao apaga mensagem do usuario.

### Smoke manual

1. criar nova conversa;
2. enviar todos os dados em texto corrido;
3. verificar resposta humana + card completo;
4. pedir edicao por chat;
5. criar proposta;
6. reabrir conversa pelo historico;
7. validar proposta salva;
8. testar falta de campos obrigatorios;
9. testar mobile/sidebar;
10. testar erro/rate limit do provider.

## 12. Criterios de aceite

1. A experiencia de ChatGPT fica evidente: novo chat, busca, recentes e continuidade.
2. O primeiro turno pede a checklist completa de forma natural.
3. O usuario pode mandar dados em texto corrido.
4. O Caloni usa inteligencia comercial, nao apenas coleta campos.
5. O card parcial nao aparece durante a coleta.
6. O card completo aparece somente quando o esqueleto esta completo.
7. Criar proposta exige confirmacao explicita.
8. Proposta incompleta nao pode ser salva.
9. Conversa antiga reabre com mensagens e artifacts.
10. A V2 de HTML/PDF esta documentada, mas nao entra no MVP.

## 13. Riscos e mitigacoes

| Risco | Mitigacao |
|---|---|
| O modelo voltar a agir como formulario | Reforcar prompt e testes de prompt; manter fallback text humano no front. |
| Card aparecer cedo demais | Guardrail deterministico no frontend por `getMissingRequiredProposalFields`. |
| Save incompleto | Guardrail no backend em `_request_save_result`. |
| IA inventar dado factual | Prompt explicito + testes de cenarios com campos ausentes. |
| Conversa antiga abrir sem draft coerente | Reidratar draft a partir dos `proposal_draft_patch` persistidos. |
| V2 de HTML/PDF contaminar MVP | Registrar como expansao futura, sem implementar agora. |

## 14. Referencias

- `docs/superpowers/specs/2026-04-25-proposta-unificada-design.md`
- `docs/superpowers/specs/2026-05-25-tool-chat-sessions-design.md`
- `seven_tools_api/app/modules/ai/prompts/proposal_assistant.py`
- `seven_tools_api/app/modules/ai/service.py`
- `seven_tools_front/src/pages/ChatToolPage.tsx`
- `seven_tools_front/src/agents/proposal/`
- `C:\Users\Guiler\.codex\skills\guizang-ppt-skill\SKILL.md`
