# Spec - Revisao Editorial PT-BR de Textos Visiveis ao Usuario

**Data:** 2026-04-22
**Repo:** `seven_tools_front`
**Status:** Design aprovado, pronto para plano de implementacao
**Abrangencia:** revisao cross-repo, com implementacao em `seven_tools_front` e `seven_tools_api`

## 1. Contexto e motivacao

Hoje o SEVEN Tools exibe ao usuario final uma combinacao de problemas textuais em mais de uma superficie do produto:

- termos sem acentuacao adequada, como `Configuracao`, `Urgencia` e `Criacao`
- strings com encoding quebrado, como `NÃ£o`, `invÃ¡lido` e variantes parecidas
- mensagens em ingles dentro de uma experiencia majoritariamente em portugues, como `Other` e `Invalid email or password`

O pedido nao e reescrever a comunicacao do produto. O pedido e fazer uma revisao editorial objetiva dos textos visiveis ao usuario, corrigindo ortografia, acentuacao, pontuacao e normalizando esses casos para PT-BR, sem alterar o tom comercial do hub nem abrir uma frente de refactor desnecessaria.

## 2. Objetivo

Entregar uma revisao editorial focada em texto de interface e mensagens de retorno ao usuario, garantindo que o software apresente uma experiencia consistente em PT-BR.

O resultado esperado e:

- strings visiveis ao usuario com ortografia correta
- acentuacao correta em labels, placeholders, titulos, descricoes e mensagens
- pontuacao minima ajustada quando o texto estiver truncado, quebrado ou claramente incorreto
- termos em ingles visiveis ao usuario normalizados para PT-BR quando houver equivalente direto no contexto do produto
- remocao de artefatos de encoding quebrado nas telas e nos feedbacks da aplicacao

## 3. Escopo

### Dentro do escopo

- textos estaticos renderizados no frontend
- labels, placeholders, botoes, titulos, subtitulos e descricoes de paginas e componentes
- estados vazios, estados de erro, estados de carregamento e mensagens de sucesso
- textos de catalogo e metadados usados para renderizar cards e detalhes de ferramentas
- mensagens do backend que chegam ao frontend e sao exibidas ao usuario
- testes automatizados que validem strings visiveis ao usuario e precisem ser atualizados para refletir a correcao

### Fora do escopo

- comentarios de codigo
- documentacao tecnica, AGENTS, plans e specs existentes
- nomes de variaveis, funcoes, arquivos, rotas e tabelas
- logs internos e mensagens destinadas apenas a desenvolvimento
- knowledge bases em `knowledge/caloni` e `knowledge/naka`
- reescrita de copy por criterio de marketing, UX writing ou reposicionamento do produto

## 4. Superficies a revisar

### Frontend

As principais fontes de texto visivel no `seven_tools_front` sao:

- autenticacao: login, cadastro, troca de senha, espera de validacao
- landing page, hub, navegacao global, header e modulos
- paginas de ferramentas comerciais
- componentes compartilhados com texto renderizado ao usuario
- arquivos de dados em `src/data/` que abastecem nomes e descricoes
- services e contexts quando propagarem mensagens para UI

### Backend

No `seven_tools_api`, a revisao deve se limitar a mensagens que realmente podem aparecer para o usuario no frontend, principalmente:

- `HTTPException.detail`
- respostas JSON com `detail`, `message` ou equivalente exibidas na interface
- erros de autenticacao, sessao, autorizacao e validacao
- mensagens ligadas aos fluxos de qualificacao de leads, propostas, membership e perfil quando expostas ao usuario

## 5. Regras editoriais

### Regra principal

Corrigir o minimo necessario para eliminar o erro percebido pelo usuario, preservando significado, tom e intencao original da mensagem.

### Regras praticas

1. Corrigir ortografia, acentuacao e pontuacao sem reescrever a ideia central da frase.
2. Corrigir strings com encoding quebrado para a forma correta em PT-BR.
3. Normalizar para PT-BR qualquer texto em ingles que seja visivel ao usuario e tenha equivalente claro no contexto da aplicacao.
4. Manter nomes proprios e nomes de produto, como `SEVEN`, `Caloni` e `Naka`.
5. Evitar mudancas estilisticas desnecessarias, como trocar frase curta por texto longo ou sofisticar o tom.
6. Quando houver ambiguidade entre "erro ortografico" e "mudanca de copy", escolher a opcao mais conservadora.

## 6. Abordagem de execucao

### Etapa 1 - Inventario orientado por superficie

Levantar os pontos de texto visivel por area funcional, com prioridade para:

1. autenticacao
2. landing e navegacao
3. ferramentas comerciais
4. mensagens de erro e sucesso vindas do backend

O objetivo nao e varrer tudo como texto bruto indistinto, e sim mapear onde a string realmente aparece para o usuario.

### Etapa 2 - Correcao em lotes pequenos

Aplicar correcoes por grupo funcional, para manter contexto e reduzir risco:

- um lote para autenticacao
- um lote para superficies institucionais e de navegacao
- um lote para cada conjunto principal de ferramentas
- um lote para mensagens expostas pelo backend

Cada lote deve preferir mudancas pequenas e rastreaveis.

### Etapa 3 - Ajuste de testes impactados

Se houver testes que validem texto visivel ao usuario, eles devem ser atualizados apenas para refletir a string corrigida. Nao entram novos comportamentos nem ampliacao de escopo.

### Etapa 4 - Validacao final

Ao final, a revisao precisa combinar:

- busca final por padroes tipicos de problema
- execucao de validacoes tecnicas nos pontos alterados
- conferencia manual de que os textos continuam coerentes com o fluxo

## 7. Estrategia de validacao

### Verificacoes textuais

Fazer uma varredura final por padroes comuns de defeito, incluindo:

- sequencias de encoding quebrado, como `Ã`
- palavras frequentes sem acento em contexto de UI, como `Nao`, `Configuracao`, `Validacao`, `Diagnostico`, `Urgencia`, `Observacoes`
- termos em ingles ainda visiveis ao usuario, como `Other`, `Invalid`, `Loading`, `Success`, quando estiverem fora de contexto tecnico

### Verificacoes tecnicas

No frontend:

- rodar testes relevantes
- rodar build para garantir que a revisao nao quebrou importacoes ou asserts

No backend:

- rodar testes relevantes para rotas e schemas tocados, se existirem e forem rapidos
- se nao houver cobertura suficiente, conferir ao menos que as mensagens alteradas mantiveram o mesmo contrato estrutural de resposta

### Verificacao manual

Conferir visualmente, pelo menos, os fluxos abaixo quando tiverem sido alterados:

- login e cadastro
- uma tela principal do hub
- pelo menos uma ferramenta com formularios e mensagens de feedback

## 8. Riscos e mitigacoes

| Risco | Mitigacao |
|---|---|
| Corrigir texto que nao e visivel ao usuario e fugir do escopo | Trabalhar por superficie funcional e nao por substituicao global cega |
| Transformar correcao editorial em reescrita de copy | Aplicar mudanca minima necessaria e preservar o tom original |
| Introduzir inconsistencias entre frontend e backend | Revisar mensagens expostas dos dois lados e validar os fluxos principais |
| Quebrar testes por troca de string | Atualizar apenas asserts de texto visivel e rodar validacao ao final |
| Manter artefatos de encoding em pontos menos obvios | Fazer busca final por padroes de encoding quebrado apos os lotes de correcao |

## 9. Criterios de aceite

- nao restam erros ortograficos evidentes em textos visiveis ao usuario nas areas revisadas
- nao restam strings com encoding quebrado nas superficies alteradas
- strings em ingles visiveis ao usuario foram normalizadas para PT-BR quando havia equivalente claro
- labels, placeholders, botoes, mensagens de erro e estados vazios revisados mantem o sentido original
- testes impactados por strings alteradas foram atualizados
- validacao tecnica minima do frontend foi executada
- mensagens de backend alteradas preservam o contrato esperado pelo frontend

## 10. Decisoes fechadas com o stakeholder

- revisar apenas textos visiveis ao usuario
- incluir ortografia, acentuacao e pontuacao
- normalizar para PT-BR os casos em ingles que aparecam ao usuario final
- nao expandir o trabalho para comentarios, docs internas ou nomes tecnicos

## 11. Proximo passo apos esta spec

Criar um plano de implementacao para executar a revisao editorial em lotes pequenos, com checklist de superficies, estrategia de busca, validacoes e ordem de execucao entre frontend e backend.
