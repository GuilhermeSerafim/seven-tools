import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  AgentHeader,
  ChatEmptyState,
  ChatLayout,
  MessageBubble,
  MessageList,
  type Suggestion,
} from '@/agents/chat';
import { useAgentChat } from '@/agents/chat/useAgentChat';
import type { ChatMessage } from '@/agents/chat/types';
import type { AgentAdapter } from '@/agents/caloni/adapter';
import {
  ToolChatShell,
  chatMessageToPersistedInput,
  toolChatSessionService,
  useToolChatSessions,
  type ToolChatSession,
} from '@/agents/chat-sessions';
import {
  createProposalChatAdapter,
  ProposalDraftPreviewCard,
  ProposalSaveConfirmCard,
  ProposalUpdateCard,
  PROPOSAL_DRAFT_FIELD_ORDER,
  getProposalDraftFieldLabel,
  useProposalDraft,
  type ProposalToolResult,
} from '@/agents/proposal';
import { normalizeLeadQualificationQueuePayload } from '@/agents/leads';
import type { AdapterSendInput } from '@/agents/proposal/useProposalChatAdapter';
import { agentRegistry } from '@/agents/registry';
import type { AgentConfig } from '@/agents/registry';
import { useAuth } from '@/auth/AuthContext';
import { PromptInputBox, type PromptInputBoxHandle } from '@/components/ui/prompt-input-box';
import { ProposalPickerSheet } from '@/pages/tools/shared/ProposalPickerSheet';
import { useUserProposals } from '@/pages/tools/shared/useUserProposals';
import proposalService, { type ProposalDraft as PersistedProposalDraft } from '@/services/proposalService';
import type { ProposalDraft } from '@/agents/proposal/useProposalDraft';

const PROPOSAL_AGENT_ID = 'proposta-comercial-smart';
const LEAD_QUALIFICATION_AGENT_ID = 'qualificacao-de-leads';
const PROPOSAL_SEARCH_PARAM_KEYS = [
  'proposalId',
  'proposal',
  'lastSavedProposal',
  'last_saved_proposal',
  'intent',
] as const;
const REQUIRED_PROPOSAL_DRAFT_FIELDS = [
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getAuthToken(auth: unknown): string {
  if (!isRecord(auth)) {
    return '';
  }

  return (
    getOptionalString(auth.authToken) ??
    getOptionalString(auth.accessToken) ??
    getOptionalString(auth.token) ??
    ''
  );
}

function getIntentHint(searchParams: URLSearchParams): 'create' | 'validate' | 'edit' | null {
  const intent = searchParams.get('intent');

  return intent === 'create' || intent === 'validate' || intent === 'edit' ? intent : null;
}

function isProposalToolResult(payload: unknown): payload is ProposalToolResult {
  return isRecord(payload) && typeof payload.kind === 'string';
}

const SHORT_PROPOSAL_FIELD_LABELS: Partial<Record<keyof ProposalDraft, string>> = {
  clientEmail: 'e-mail',
  clientPhone: 'telefone',
};

function getProposalFieldLabel(field: string): string {
  return (
    SHORT_PROPOSAL_FIELD_LABELS[field as keyof ProposalDraft] ??
    getProposalDraftFieldLabel(field).toLocaleLowerCase('pt-BR')
  );
}

function joinHumanList(items: string[]): string {
  if (items.length <= 1) {
    return items[0] ?? '';
  }

  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;
}

function getPatchSummary(patch: Partial<ProposalDraft>): string {
  return PROPOSAL_DRAFT_FIELD_ORDER.map((key) => patch[key]?.trim()).filter(
    (value): value is string => Boolean(value),
  ).join(', ');
}

function getMergedProposalDraft(
  draft: ProposalDraft | null,
  patch: Partial<ProposalDraft>,
): Partial<ProposalDraft> {
  return draft ? { ...draft, ...patch } : { ...patch };
}

function getMissingRequiredProposalFields(draft: Partial<ProposalDraft>): string[] {
  return REQUIRED_PROPOSAL_DRAFT_FIELDS.filter((field) => !draft[field]?.trim());
}

function getProposalDraftPatchMissing(
  payload: Extract<ProposalToolResult, { kind: 'proposal_draft_patch' }>,
  currentDraft: ProposalDraft | null,
): string[] {
  return getMissingRequiredProposalFields(getMergedProposalDraft(currentDraft, payload.patch));
}

function getMissingRequiredReply(missingFields: string[]): string {
  const missing = joinHumanList(missingFields.map(getProposalFieldLabel));
  return `Ainda preciso de: ${missing}.`;
}

function getProposalFallbackReply(payload: unknown, currentDraft: ProposalDraft | null = null): string {
  if (!isProposalToolResult(payload)) {
    return '';
  }

  switch (payload.kind) {
    case 'proposal_draft_patch': {
      const missingRequired = getProposalDraftPatchMissing(payload, currentDraft);

      if (!missingRequired.length) {
        return 'Agora tenho todas as informacoes do esqueleto da proposta. Quer editar algum ponto ou confirmar a criacao?';
      }

      const captured = getPatchSummary(payload.patch);
      const missing = getMissingRequiredReply(missingRequired);

      return captured
        ? `Atualizei o rascunho da proposta com as informacoes identificadas: ${captured}. ${missing}`
        : `Atualizei o rascunho da proposta. ${missing}`;
    }
    case 'proposal_save_request':
      if (getMissingRequiredProposalFields(payload.draft_summary).length > 0) {
        return getMissingRequiredReply(getMissingRequiredProposalFields(payload.draft_summary));
      }

      return 'O rascunho esta pronto para salvar. Revise os dados abaixo e confirme quando quiser criar a proposta.';
    case 'proposal_update_request':
      return 'Preparei a atualizacao solicitada. Revise os dados abaixo antes de aplicar na proposta.';
    case 'proposal_validation_report':
      return 'Conclui a validacao da proposta. Veja o relatorio abaixo.';
    case 'proposal_open_existing':
      return 'Encontrei a proposta e vou abrir para voce.';
  }
}

function getMessageContent(
  message: ChatMessage,
  isProposalAgent: boolean,
  proposalDraft: ProposalDraft | null,
): React.ReactNode {
  if (!isProposalAgent) {
    return message.content;
  }

  if (isProposalToolResult(message.payload) && message.payload.kind === 'proposal_draft_patch') {
    return getProposalFallbackReply(message.payload, proposalDraft);
  }

  if (
    isProposalToolResult(message.payload) &&
    message.payload.kind === 'proposal_save_request' &&
    getMissingRequiredProposalFields(message.payload.draft_summary).length > 0
  ) {
    return getProposalFallbackReply(message.payload, proposalDraft);
  }

  return message.content || getProposalFallbackReply(message.payload, proposalDraft);
}

function resolveProposalSearchId(searchParams: URLSearchParams): string | null {
  return searchParams.get('proposalId') ?? searchParams.get('proposal');
}

function normalizeIntentText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function isNewProposalRequest(text: string): boolean {
  const normalized = normalizeIntentText(text);
  return normalized.includes('proposta') && normalized.includes('nova');
}

function toPersistedProposalDraft(draft: ProposalDraft | null): PersistedProposalDraft {
  return {
    title: draft?.title ?? '',
    clientName: draft?.clientName ?? '',
    clientCompany: draft?.clientCompany ?? '',
    clientEmail: draft?.clientEmail ?? '',
    clientPhone: draft?.clientPhone ?? '',
    projectDescription: draft?.projectDescription ?? '',
    scope: draft?.scope ?? '',
    value: draft?.value ?? '',
    deadline: draft?.deadline ?? '',
    notes: draft?.notes ?? '',
    status: 'draft',
  };
}

function toPersistedProposalPatch(patch: Partial<ProposalDraft>): Partial<PersistedProposalDraft> {
  const persistedPatch: Partial<PersistedProposalDraft> = {};

  for (const key of PROPOSAL_DRAFT_FIELD_ORDER) {
    if (typeof patch[key] === 'string') {
      persistedPatch[key] = patch[key];
    }
  }

  return persistedPatch;
}

function getSessionSearchId(searchParams: URLSearchParams): string | null {
  return searchParams.get('sessionId');
}

function setSessionSearchId(searchParams: URLSearchParams, sessionId: string): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  for (const key of PROPOSAL_SEARCH_PARAM_KEYS) {
    next.delete(key);
  }
  next.set('sessionId', sessionId);
  return next;
}

function getSessionProposalId(session: ToolChatSession | null | undefined): string | null {
  const proposalId = session?.metadata?.proposal_id;
  return typeof proposalId === 'string' && proposalId.trim() ? proposalId : null;
}

function extractDraftFromMessages(messages: ChatMessage[]): ProposalDraft | null {
  let draft: ProposalDraft | null = null;

  for (const message of messages) {
    if (
      isProposalToolResult(message.payload) &&
      message.payload.kind === 'proposal_draft_patch'
    ) {
      draft = draft ? { ...draft, ...message.payload.patch } : { ...message.payload.patch };
    }
  }

  return draft;
}

function attachmentToAssistantInput(attachment: Parameters<AgentAdapter['send']>[0]['attachments'][number]) {
  const textContent = isRecord(attachment.file)
    ? getOptionalString(attachment.file.textContent)
    : undefined;

  return {
    filename: attachment.name,
    mime_type: attachment.file.type || 'application/octet-stream',
    size_bytes: attachment.sizeBytes,
    text_content: textContent,
  };
}

function messageToAssistantInput(
  message: ChatMessage,
  attachments: AdapterSendInput['attachments'] = [],
): AdapterSendInput {
  return {
    role: message.role,
    content: typeof message.content === 'string' ? message.content : String(message.content ?? ''),
    attachments,
  };
}

export default function ChatToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const config = slug ? agentRegistry[slug] : undefined;

  if (!config) {
    return <Navigate to="/tools" replace />;
  }

  return <ConfiguredChatToolPage key={config.id} config={config} toolSlug={slug} />;
}

function ConfiguredChatToolPage({ config, toolSlug }: { config: AgentConfig; toolSlug: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuth();
  const authUser = auth.user;
  const authToken = getAuthToken(auth);
  const location = useLocation();
  const sessionIdFromUrl = getSessionSearchId(searchParams);
  const sessions = useToolChatSessions(toolSlug);
  const activeSessionIdRef = useRef<string | null>(null);
  const openSessionRequestIdRef = useRef(0);
  const openingSessionIdRef = useRef<string | null>(null);
  const suppressedUrlSessionIdRef = useRef<string | null>(null);
  const pendingSessionRef = useRef<Promise<ToolChatSession | null> | null>(null);
  const sessionCreateRequestIdRef = useRef(0);
  const suppressProposalSearchContextRef = useRef(false);
  const activeSessionProposalIdRef = useRef<string | null>(null);
  const draftHook = useProposalDraft();
  const proposalDraft = draftHook.draft;
  const patchProposalDraft = draftHook.patch;
  const resetProposalDraft = draftHook.reset;
  const isProposalAgent = config.id === PROPOSAL_AGENT_ID;
  const isLeadQualificationAgent = config.id === LEAD_QUALIFICATION_AGENT_ID;

  useEffect(() => {
    if (sessions.activeSession?.id) {
      activeSessionIdRef.current = sessions.activeSession.id;
    }
    activeSessionProposalIdRef.current = getSessionProposalId(sessions.activeSession);
  }, [sessions.activeSession]);

  const runtimeConfig = useMemo<AgentConfig>(() => {
    if (!isProposalAgent) {
      return config;
    }

    const proposalAdapter = createProposalChatAdapter({
      authToken,
      getDraft: () => proposalDraft,
      getCurrentProposalId: () => {
        const sessionProposalId = activeSessionProposalIdRef.current;
        return suppressProposalSearchContextRef.current
          ? sessionProposalId
          : resolveProposalSearchId(searchParams) ?? sessionProposalId;
      },
      getLastSavedProposalId: () =>
        suppressProposalSearchContextRef.current
          ? activeSessionProposalIdRef.current
          : searchParams.get('lastSavedProposal') ??
            searchParams.get('last_saved_proposal') ??
            activeSessionProposalIdRef.current,
      getIntentHint: () =>
        suppressProposalSearchContextRef.current ? null : getIntentHint(searchParams),
    });

    const adapter: AgentAdapter = {
      async send(input, signal) {
        const latestAttachments = input.attachments.map(attachmentToAssistantInput);
        const history = input.history ?? [];
        const historyMessages = history.length
          ? history.map((message, index) =>
              messageToAssistantInput(
                message,
                index === history.length - 1 && message.role === 'user'
                  ? latestAttachments
                  : [],
              ),
            )
          : [
              {
                role: 'user' as const,
                content: input.text,
                attachments: latestAttachments,
              },
            ];

        const result = await proposalAdapter.send(
          historyMessages,
          signal,
          input.context?.proposalId ?? null,
        );

        return { text: result.reply, payload: result.toolResult };
      },
    };

    return { ...config, adapter };
  }, [authToken, config, isProposalAgent, proposalDraft, searchParams]);
  const { messages, isStreaming, send, stop, reset, replaceMessages } = useAgentChat(
    runtimeConfig,
    {
      onUserMessage: async (message) => {
        const sessionId = activeSessionIdRef.current;
        if (!sessionId) {
          throw new Error('Missing active session');
        }
        await toolChatSessionService.createMessage(
          sessionId,
          chatMessageToPersistedInput(message),
          { toolSlug },
        );
        await sessions.refreshSessions();
      },
      onAssistantMessage: async (message) => {
        const sessionId = activeSessionIdRef.current;
        if (!sessionId) {
          return;
        }
        await toolChatSessionService.createMessage(
          sessionId,
          chatMessageToPersistedInput(message),
          { toolSlug },
        );
        await sessions.refreshSessions();
      },
    },
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [proposalAccessEnabled, setProposalAccessEnabled] = useState(false);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(null);
  const inputRef = useRef<PromptInputBoxHandle>(null);
  const canUseSavedProposals = config.id === 'caloni-v1' || isProposalAgent;
  const user = proposalAccessEnabled && canUseSavedProposals ? authUser : undefined;
  const { proposals, proposalsLoading } = useUserProposals(user?.id);
  const consumedDeepLink = useRef<string | null>(null);
  const processedAssistantMessageIds = useRef<Set<string>>(new Set());

  const handleSaveProposal = useCallback(
    async (messageId: string, draftSummary: ProposalDraft) => {
      if (!authUser?.id) {
        inputRef.current?.setValue('Preciso estar autenticado para salvar essa proposta');
        inputRef.current?.focus();
        return;
      }

      setSavingMessageId(messageId);
      try {
        const savedProposal = await proposalService.create(
          authUser.id,
          toPersistedProposalDraft({ ...proposalDraft, ...draftSummary }),
        );
        await sessions.patchActiveSessionMetadata({ proposal_id: savedProposal.id });
        resetProposalDraft();
        navigate(`/tools/proposta-comercial-smart/app/${savedProposal.id}`);
      } catch {
        inputRef.current?.setValue('Nao consegui salvar essa proposta agora');
        inputRef.current?.focus();
      } finally {
        setSavingMessageId(null);
      }
    },
    [authUser?.id, navigate, proposalDraft, resetProposalDraft, sessions],
  );

  const handleApplyProposalPatch = useCallback(
    async (messageId: string, proposalId: string, patch: Partial<ProposalDraft>) => {
      if (!authUser?.id) {
        inputRef.current?.setValue('Preciso estar autenticado para atualizar essa proposta');
        inputRef.current?.focus();
        return;
      }

      setApplyingMessageId(messageId);
      try {
        const updatedProposal = await proposalService.update(
          authUser.id,
          proposalId,
          toPersistedProposalPatch(patch),
        );

        if (updatedProposal) {
          await sessions.patchActiveSessionMetadata({ proposal_id: updatedProposal.id });
          navigate(`/tools/proposta-comercial-smart/app/${updatedProposal.id}`);
        } else {
          inputRef.current?.setValue('Nao consegui aplicar essas alteracoes agora');
          inputRef.current?.focus();
        }
      } catch {
        inputRef.current?.setValue('Nao consegui aplicar essas alteracoes agora');
        inputRef.current?.focus();
      } finally {
        setApplyingMessageId(null);
      }
    },
    [authUser?.id, navigate, sessions],
  );

  useEffect(() => {
    if (!isProposalAgent) {
      return;
    }

    for (const message of messages) {
      if (
        message.role !== 'assistant' ||
        message.payload === undefined ||
        processedAssistantMessageIds.current.has(message.id) ||
        !isProposalToolResult(message.payload)
      ) {
        continue;
      }

      processedAssistantMessageIds.current.add(message.id);

      switch (message.payload.kind) {
        case 'proposal_draft_patch':
          patchProposalDraft(message.payload.patch);
          break;
        case 'proposal_open_existing':
          sessions
            .patchActiveSessionMetadata({ proposal_id: message.payload.proposal_id })
            .catch(() => undefined);
          navigate(`/tools/proposta-comercial-smart/app/${message.payload.proposal_id}`);
          break;
        case 'proposal_validation_report':
        case 'proposal_save_request':
        case 'proposal_update_request':
          break;
      }
    }
  }, [isProposalAgent, messages, navigate, patchProposalDraft, sessions]);

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

  const applySessionMessages = useCallback(
    (nextMessages: ChatMessage[]) => {
      processedAssistantMessageIds.current.clear();
      for (const message of nextMessages) {
        if (message.role === 'assistant') {
          processedAssistantMessageIds.current.add(message.id);
        }
      }
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
      if (openingSessionIdRef.current === sessionId) {
        return;
      }

      const requestId = openSessionRequestIdRef.current + 1;
      openSessionRequestIdRef.current = requestId;
      openingSessionIdRef.current = sessionId;
      pendingSessionRef.current = null;
      sessionCreateRequestIdRef.current += 1;
      suppressProposalSearchContextRef.current = true;
      const loadedMessages = await sessions.openSession(sessionId);
      if (openSessionRequestIdRef.current !== requestId) {
        return;
      }
      openingSessionIdRef.current = null;
      if (suppressedUrlSessionIdRef.current === sessionId) {
        suppressedUrlSessionIdRef.current = null;
      }
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
    openSessionRequestIdRef.current += 1;
    openingSessionIdRef.current = null;
    suppressedUrlSessionIdRef.current = sessionIdFromUrl;
    pendingSessionRef.current = null;
    const createRequestId = sessionCreateRequestIdRef.current + 1;
    sessionCreateRequestIdRef.current = createRequestId;
    suppressProposalSearchContextRef.current = true;
    const created = await sessions.createNewSession();
    if (sessionCreateRequestIdRef.current !== createRequestId) {
      return;
    }
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
  }, [
    isProposalAgent,
    location.pathname,
    navigate,
    reset,
    resetProposalDraft,
    searchParams,
    sessionIdFromUrl,
    sessions,
  ]);

  useEffect(() => {
    if (
      suppressedUrlSessionIdRef.current &&
      suppressedUrlSessionIdRef.current !== sessionIdFromUrl
    ) {
      suppressedUrlSessionIdRef.current = null;
    }

    if (
      !sessionIdFromUrl ||
      suppressedUrlSessionIdRef.current === sessionIdFromUrl ||
      sessions.activeSession?.id === sessionIdFromUrl
    ) {
      return;
    }

    handleOpenSession(sessionIdFromUrl).catch(() => undefined);
  }, [handleOpenSession, sessionIdFromUrl, sessions.activeSession?.id]);

  const ensureActiveSession = useCallback(async (
    options: { clearProposalContext?: boolean } = {},
  ): Promise<ToolChatSession | null> => {
    const shouldClearProposalContext = options.clearProposalContext ?? true;
    suppressProposalSearchContextRef.current = shouldClearProposalContext;

    if (sessions.activeSession) {
      activeSessionIdRef.current = sessions.activeSession.id;
      return sessions.activeSession;
    }

    if (pendingSessionRef.current) {
      const pendingSession = await pendingSessionRef.current;
      if (!pendingSession) {
        return null;
      }
      activeSessionIdRef.current = pendingSession.id;
      return pendingSession;
    }

    openSessionRequestIdRef.current += 1;
    openingSessionIdRef.current = null;
    suppressedUrlSessionIdRef.current = sessionIdFromUrl;
    const createRequestId = sessionCreateRequestIdRef.current + 1;
    sessionCreateRequestIdRef.current = createRequestId;
    const sessionPromise = sessions.createNewSession().then((created) => {
      if (sessionCreateRequestIdRef.current !== createRequestId) {
        return null;
      }
      activeSessionIdRef.current = created.id;
      navigate({
        pathname: location.pathname,
        search: setSessionSearchId(searchParams, created.id).toString(),
      });
      return created;
    });

    pendingSessionRef.current = sessionPromise;

    try {
      return await sessionPromise;
    } finally {
      if (pendingSessionRef.current === sessionPromise) {
        pendingSessionRef.current = null;
      }
    }
  }, [location.pathname, navigate, searchParams, sessionIdFromUrl, sessions]);

  const handleSend = useCallback(
    (text: string, attachments: Parameters<typeof send>[1]) => {
      ensureActiveSession()
        .then((session) => {
          if (!session) {
            return;
          }

          if (isProposalAgent && isNewProposalRequest(text)) {
            resetProposalDraft();
          }

          send(text, attachments);
        })
        .catch(() => undefined);
    },
    [ensureActiveSession, isProposalAgent, resetProposalDraft, send],
  );

  useEffect(() => {
    const proposalId = resolveProposalSearchId(searchParams);
    const intent = getIntentHint(searchParams);
    const deepLinkKey = `${config.id}:${proposalId ?? ''}:${intent ?? ''}`;

    if (!proposalId || consumedDeepLink.current === deepLinkKey) {
      return;
    }

    if (config.id === 'caloni-v1') {
      consumedDeepLink.current = deepLinkKey;
      ensureActiveSession({ clearProposalContext: false })
        .then((session) => {
          if (!session) {
            return;
          }
          send('Analisar proposta selecionada', [], { proposalId });
        })
        .catch(() => undefined);
      return;
    }

    if (!isProposalAgent || (intent !== 'validate' && intent !== 'edit')) {
      return;
    }

    consumedDeepLink.current = deepLinkKey;
    ensureActiveSession({ clearProposalContext: false })
      .then((session) => {
        if (!session) {
          return;
        }
        send(
          intent === 'validate' ? 'Validar proposta selecionada' : 'Editar proposta selecionada',
          [],
          { proposalId },
        );
      })
      .catch(() => undefined);
  }, [config.id, ensureActiveSession, isProposalAgent, searchParams, send]);

  const handlePick = useCallback(
    (suggestion: Suggestion) => {
      if (isStreaming) {
        return;
      }

      switch (suggestion.action.kind) {
        case 'prefill':
          inputRef.current?.setValue(suggestion.action.text);
          inputRef.current?.focus();
          break;
        case 'open-proposal-picker':
          setProposalAccessEnabled(true);
          setPickerOpen(true);
          break;
        case 'open-file-picker':
          inputRef.current?.openFilePicker({ autoSend: true });
          break;
      }
    },
    [isStreaming],
  );

  const renderProposalPayload = useCallback(
    (message: ChatMessage) => {
      if (!isProposalToolResult(message.payload)) {
        return runtimeConfig.renderResult?.(message.payload);
      }

      switch (message.payload.kind) {
        case 'proposal_draft_patch': {
          const mergedDraft = getMergedProposalDraft(proposalDraft, message.payload.patch);
          const missingRequired = getMissingRequiredProposalFields(mergedDraft);

          if (missingRequired.length > 0) {
            return null;
          }

          return (
            <ProposalDraftPreviewCard
              patch={mergedDraft}
              missingRequired={missingRequired}
              extractedFromPdf={false}
            />
          );
        }
        case 'proposal_save_request':
          if (getMissingRequiredProposalFields(message.payload.draft_summary).length > 0) {
            return null;
          }

          return (
            <ProposalSaveConfirmCard
              draft={message.payload.draft_summary}
              saving={savingMessageId === message.id}
              onSave={() => {
                handleSaveProposal(message.id, message.payload.draft_summary).catch(() => undefined);
              }}
              onAdjust={() => {
                inputRef.current?.setValue('Quero ajustar essa proposta antes de salvar');
                inputRef.current?.focus();
              }}
            />
          );
        case 'proposal_update_request':
          return (
            <ProposalUpdateCard
              proposalId={message.payload.proposal_id}
              patch={message.payload.patch}
              applying={applyingMessageId === message.id}
              onApply={() => {
                handleApplyProposalPatch(
                  message.id,
                  message.payload.proposal_id,
                  message.payload.patch,
                ).catch(() => undefined);
              }}
              onCancel={() => {
                inputRef.current?.setValue('Nao aplicar essas alteracoes');
                inputRef.current?.focus();
              }}
            />
          );
        case 'proposal_validation_report':
        case 'proposal_open_existing':
          return runtimeConfig.renderResult?.(message.payload);
      }
    },
    [
      applyingMessageId,
      handleApplyProposalPatch,
      handleSaveProposal,
      proposalDraft,
      runtimeConfig,
      savingMessageId,
    ],
  );

  const lastMessageId = messages.at(-1)?.id;
  const emptyState = useMemo(
    () => (
      <ChatEmptyState
        agentName={config.name}
        avatarSrc={config.avatarSrc}
        agentMission={config.mission}
        suggestions={config.suggestions}
        onPick={handlePick}
        contentClassName="max-w-[960px]"
        className="px-4 pt-14 pb-10"
      />
    ),
    [config, handlePick],
  );

  return (
    <ToolChatShell
      sessions={sessions.sessions}
      activeSessionId={sessions.activeSession?.id ?? sessionIdFromUrl}
      searchQuery={sessions.searchQuery}
      loadingSessions={sessions.loadingSessions}
      sessionsError={sessions.sessionsError}
      onSearchChange={sessions.setSearchQuery}
      onNewChat={() => {
        handleNewChat().catch(() => undefined);
      }}
      onOpenSession={(sessionId) => {
        handleOpenSession(sessionId).catch(() => undefined);
      }}
    >
      <ChatLayout
        mode="pure"
        className="h-[calc(100dvh-9.5rem)] bg-background md:h-[calc(100dvh-4.5rem)]"
        innerClassName="max-w-[1120px]"
      >
        <AgentHeader
          name={config.name}
          subtitle={config.subtitle}
          avatarSrc={config.avatarSrc}
          status={isStreaming ? 'thinking' : 'online'}
          contentClassName="max-w-[960px]"
        />

        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          emptyState={emptyState}
          contentClassName="max-w-[960px]"
        >
          {messages.map((message) => {
            const isCurrentAssistantMessage =
              message.role === 'assistant' && message.id === lastMessageId;
            const shouldRenderResult =
              message.role === 'assistant' &&
              message.payload !== undefined &&
              !(isCurrentAssistantMessage && isStreaming);
            const renderedResult =
              shouldRenderResult && isProposalAgent
                ? renderProposalPayload(message)
                : shouldRenderResult && typeof runtimeConfig.renderResult === 'function'
                  ? runtimeConfig.renderResult(message.payload)
                  : null;
            const messageContent = getMessageContent(message, isProposalAgent, proposalDraft);

            return (
              <MessageBubble
                key={message.id}
                role={message.role}
                variant={message.variant}
                attachments={message.attachments}
                timestamp={message.createdAt}
                isStreaming={isStreaming && message.role === 'assistant' && message.id === lastMessageId}
              >
                {messageContent}
                {renderedResult}
              </MessageBubble>
            );
          })}
        </MessageList>

        <div
          data-testid="chat-tool-composer-shell"
          className="border-t border-border/20 bg-background/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-[960px]">
            <PromptInputBox
              ref={inputRef}
              onSend={handleSend}
              onStop={stop}
              isLoading={isStreaming}
            />
          </div>
        </div>

        <ProposalPickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={(proposal) => {
            setProposalAccessEnabled(true);
            setPickerOpen(false);
            ensureActiveSession()
              .then((session) => {
                if (!session) {
                  return;
                }
                send(`Analisar proposta "${proposal.title}"`, [], { proposalId: proposal.id });
              })
              .catch(() => undefined);
          }}
          proposals={proposals}
          loading={proposalsLoading}
        />
      </ChatLayout>
    </ToolChatShell>
  );
}
