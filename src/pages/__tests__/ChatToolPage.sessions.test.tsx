import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toolChatSessionService, type ToolChatSession } from '@/agents/chat-sessions';
import ChatToolPage from '../ChatToolPage';

const adapterSendMock = vi.fn();
const adapterContextMock = vi.fn();
const serviceMock = vi.hoisted(() => ({
  listSessions: vi.fn(),
  createSession: vi.fn(),
  getSession: vi.fn(),
  listMessages: vi.fn(),
  createMessage: vi.fn(),
  patchSession: vi.fn(),
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' }, authToken: 'token' }),
}));

vi.mock('@/agents/chat-sessions/toolChatSessionService', () => ({
  toolChatSessionService: serviceMock,
}));

vi.mock('@/agents/chat-sessions', async () => {
  const actual = await vi.importActual<typeof import('@/agents/chat-sessions')>(
    '@/agents/chat-sessions',
  );
  return {
    ...actual,
    toolChatSessionService: serviceMock,
  };
});

vi.mock('@/agents/proposal', async () => {
  const actual = await vi.importActual<typeof import('@/agents/proposal')>('@/agents/proposal');
  return {
    ...actual,
    createProposalChatAdapter: (options: {
      getCurrentProposalId: () => string | null;
      getLastSavedProposalId: () => string | null;
      getIntentHint: () => string | null;
    }) => ({
      send: (...args: unknown[]) => {
        adapterContextMock({
          currentProposalId: options.getCurrentProposalId(),
          lastSavedProposalId: options.getLastSavedProposalId(),
          intentHint: options.getIntentHint(),
        });
        return adapterSendMock(...args);
      },
    }),
  };
});

const service = vi.mocked(toolChatSessionService);

const existingSession: ToolChatSession = {
  id: 's_existing',
  userId: 'u1',
  toolSlug: 'proposta-comercial-smart',
  title: 'Proposta Aurora',
  metadata: {},
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
};

const createdSession: ToolChatSession = {
  id: 's_created',
  userId: 'u1',
  toolSlug: 'proposta-comercial-smart',
  title: 'Novo chat',
  metadata: {},
  createdAt: '2026-05-25T11:00:00Z',
  updatedAt: '2026-05-25T11:00:00Z',
};

const proposalScope = { toolSlug: 'proposta-comercial-smart' };
const diagnosisScope = { toolSlug: 'diagnostico-comercial-caloni' };
const radarScope = { toolSlug: 'qualificacao-de-leads' };

const existingDiagnosisSession: ToolChatSession = {
  id: 's_diagnosis_existing',
  userId: 'u1',
  toolSlug: 'diagnostico-comercial-caloni',
  title: 'Diagnostico comercial',
  metadata: {},
  createdAt: '2026-05-25T12:00:00Z',
  updatedAt: '2026-05-25T12:00:00Z',
};

const createdDiagnosisSession: ToolChatSession = {
  id: 's_diagnosis_created',
  userId: 'u1',
  toolSlug: 'diagnostico-comercial-caloni',
  title: 'Novo chat',
  metadata: {},
  createdAt: '2026-05-25T12:30:00Z',
  updatedAt: '2026-05-25T12:30:00Z',
};

const diagnosisReportPayload = {
  kind: 'commercial_diagnosis_report',
  report: {
    cenario: 'Funil com demanda, mas pouca conversao em decisao.',
    gargalo_principal: 'Follow-up sem compromisso claro.',
    etapa_critica_funil: 'Pos-reuniao',
    sintomas: ['Leads esfriam depois da proposta', 'Reunioes terminam sem proximo passo'],
    causa_provavel: 'Falta de cadencia e criterio de prioridade.',
    acao_recomendada: 'Implantar cadencia objetiva com dono e prazo.',
    plano_prioritario: ['Revisar oportunidades abertas', 'Criar cadencia de 7 dias'],
  },
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function LocationProbe() {
  const location = useLocation();

  return (
    <output aria-label="location-search">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderPage(initialEntry = '/tools/proposta-comercial-smart/app/chat') {
  const result = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/tools/:slug/app/chat" element={<ChatToolPage />} />
        <Route path="/tools/proposta-comercial-smart/app/:proposalId" element={<div>Proposal app</div>} />
        <Route path="/tools" element={<div>Hub</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );

  return result;
}

async function sendPrompt(text: string) {
  fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: /Enviar mensagem/i }));
  await act(async () => {
    await Promise.resolve();
  });
}

function makePersistedMessage(index: number) {
  return {
    id: `m_${index}`,
    sessionId: 's_existing',
    role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
    content: `Mensagem historica ${index}`,
    createdAt: `2026-05-25T10:${String(index).padStart(2, '0')}:00Z`,
  };
}

describe('ChatToolPage sessions integration', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();

    adapterSendMock.mockResolvedValue({
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
        missing_required: [],
      },
    });

    service.listSessions.mockResolvedValue({
      items: [existingSession],
      total: 1,
      page: 1,
      perPage: 30,
    });
    service.createSession.mockResolvedValue(createdSession);
    service.getSession.mockResolvedValue(existingSession);
    service.listMessages.mockResolvedValue([]);
    service.createMessage.mockImplementation(async (sessionId, input) => ({
      id: `persisted_${service.createMessage.mock.calls.length}`,
      sessionId,
      createdAt: '2026-05-25T11:00:00Z',
      ...input,
    }));
    service.patchSession.mockResolvedValue(existingSession);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the conversation sidebar and lists sessions for the proposal tool', async () => {
    renderPage();

    expect(screen.getByRole('button', { name: /novo chat/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /buscar conversas/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(service.listSessions).toHaveBeenCalledWith({
        toolSlug: 'proposta-comercial-smart',
        q: '',
        page: 1,
        perPage: 30,
      });
    });
    expect(await screen.findByRole('button', { name: /proposta aurora/i })).toBeInTheDocument();
  });

  it('creates a session before persisting the first user and assistant messages', async () => {
    renderPage();

    await sendPrompt('Crie uma proposta para Maria Aurora');

    await waitFor(() => {
      expect(service.createMessage).toHaveBeenCalledTimes(2);
    });

    expect(service.createSession).toHaveBeenCalledWith({
      toolSlug: 'proposta-comercial-smart',
    });
    expect(service.createSession.mock.invocationCallOrder[0]).toBeLessThan(
      service.createMessage.mock.invocationCallOrder[0],
    );
    expect(service.createMessage).toHaveBeenNthCalledWith(
      1,
      's_created',
      expect.objectContaining({
        role: 'user',
        content: 'Crie uma proposta para Maria Aurora',
      }),
      proposalScope,
    );
    expect(service.createMessage).toHaveBeenNthCalledWith(
      2,
      's_created',
      expect.objectContaining({
        role: 'assistant',
        content: 'Agora tenho o esqueleto. Quer editar ou confirmar?',
        payload: expect.objectContaining({
          kind: 'proposal_draft_patch',
          patch: expect.objectContaining({
            title: 'Proposta Aurora',
            clientName: 'Maria Aurora',
          }),
        }),
      }),
      proposalScope,
    );
  });

  it('opens an existing session and renders persisted messages', async () => {
    service.listMessages.mockResolvedValue([
      {
        id: 'm_user',
        sessionId: 's_existing',
        role: 'user',
        content: 'Recupere a proposta Aurora',
        createdAt: '2026-05-25T10:01:00Z',
      },
      {
        id: 'm_assistant',
        sessionId: 's_existing',
        role: 'assistant',
        content: 'Proposta Aurora restaurada.',
        payload: {
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
          missing_required: [],
        },
        createdAt: '2026-05-25T10:02:00Z',
      },
    ]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /proposta aurora/i }));

    await waitFor(() => {
      expect(service.getSession).toHaveBeenCalledWith('s_existing', proposalScope);
      expect(service.listMessages).toHaveBeenCalledWith('s_existing', proposalScope);
    });
    expect(await screen.findByText('Recupere a proposta Aurora')).toBeInTheDocument();
    expect(screen.getByText(/Agora tenho todas as informacoes do esqueleto/i)).toBeInTheDocument();
    expect(screen.getAllByText('Proposta Aurora').length).toBeGreaterThan(0);
  });

  it('does not let a stale URL session open overwrite a newly created first-send session', async () => {
    const getSessionDeferred = createDeferred<ToolChatSession>();
    const listMessagesDeferred = createDeferred<Awaited<ReturnType<typeof service.listMessages>>>();
    service.getSession.mockReturnValue(getSessionDeferred.promise);
    service.listMessages.mockReturnValue(listMessagesDeferred.promise);

    renderPage('/tools/proposta-comercial-smart/app/chat?sessionId=s_existing');

    await waitFor(() => {
      expect(service.getSession).toHaveBeenCalledWith('s_existing', proposalScope);
      expect(service.listMessages).toHaveBeenCalledWith('s_existing', proposalScope);
    });

    fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), {
      target: { value: 'Crie uma proposta antes do historico carregar' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensagem/i }));

    await waitFor(() => {
      expect(service.createMessage).toHaveBeenCalledWith(
        's_created',
        expect.objectContaining({
          role: 'user',
          content: 'Crie uma proposta antes do historico carregar',
        }),
        proposalScope,
      );
    });

    getSessionDeferred.resolve(existingSession);
    listMessagesDeferred.resolve([
      {
        id: 'm_stale',
        sessionId: 's_existing',
        role: 'user',
        content: 'Mensagem antiga que nao deve voltar',
        createdAt: '2026-05-25T10:01:00Z',
      },
    ]);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText('Mensagem antiga que nao deve voltar')).not.toBeInTheDocument();
  });

  it('sends the full active history to the proposal adapter', async () => {
    const persistedMessages = Array.from({ length: 21 }, (_, index) => makePersistedMessage(index));
    service.listMessages.mockResolvedValueOnce(persistedMessages);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /proposta aurora/i }));
    expect(await screen.findByText('Mensagem historica 20')).toBeInTheDocument();

    await sendPrompt('Continuar com todo o historico');

    await waitFor(() => {
      expect(adapterSendMock).toHaveBeenCalled();
    });
    const messages = adapterSendMock.mock.calls.at(-1)?.[0];
    expect(messages).toHaveLength(22);
    expect(messages.at(0)).toEqual(expect.objectContaining({ content: 'Mensagem historica 0' }));
    expect(messages.at(-1)).toEqual(
      expect.objectContaining({ content: 'Continuar com todo o historico' }),
    );
  });

  it('sends attachment metadata for the latest user history message', async () => {
    const { container } = renderPage();
    const file = new File(['conteudo do briefing'], 'briefing.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'textContent', {
      value: 'conteudo extraido do briefing',
    });

    const fileInput = container.querySelector('input[type="file"]');
    if (!fileInput) {
      throw new Error('Missing file input');
    }

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByText('briefing.txt')).toBeInTheDocument();
    await sendPrompt('Use este briefing');

    await waitFor(() => {
      expect(adapterSendMock).toHaveBeenCalled();
    });
    const messages = adapterSendMock.mock.calls.at(-1)?.[0];
    expect(messages.at(-1)).toEqual(
      expect.objectContaining({
        role: 'user',
        content: 'Use este briefing',
        attachments: [
          expect.objectContaining({
            filename: 'briefing.txt',
            mime_type: 'text/plain',
            size_bytes: file.size,
            text_content: 'conteudo extraido do briefing',
          }),
        ],
      }),
    );
  });

  it('clears stale proposal query params and context when starting a new chat', async () => {
    service.createSession
      .mockResolvedValueOnce({ ...createdSession, id: 's_deeplink' })
      .mockResolvedValue(createdSession);

    renderPage('/tools/proposta-comercial-smart/app/chat?intent=validate&proposalId=p_old');

    await waitFor(() => {
      expect(adapterContextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          currentProposalId: 'p_old',
          intentHint: 'validate',
        }),
      );
    });
    await waitFor(() => {
      expect(service.createMessage).toHaveBeenCalledWith(
        's_deeplink',
        expect.objectContaining({ role: 'assistant' }),
        proposalScope,
      );
    });
    adapterContextMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /novo chat/i }));

    await waitFor(() => {
      const locationText = screen.getByLabelText('location-search').textContent ?? '';
      expect(locationText).toContain('sessionId=s_created');
      expect(locationText).not.toContain('proposalId');
      expect(locationText).not.toContain('intent');
    });

    await sendPrompt('Comecar proposta limpa');

    await waitFor(() => {
      expect(adapterContextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          currentProposalId: null,
          intentHint: null,
        }),
      );
    });
  });

  it('does not replay proposal-open side effects when hydrating persisted messages', async () => {
    service.listMessages.mockResolvedValueOnce([
      {
        id: 'm_open',
        sessionId: 's_existing',
        role: 'assistant',
        content: 'Abrir proposta antiga.',
        payload: {
          kind: 'proposal_open_existing',
          proposal_id: 'p1',
        },
        createdAt: '2026-05-25T10:02:00Z',
      },
    ]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /proposta aurora/i }));

    expect(await screen.findByText('Abrir proposta antiga.')).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });

    expect(service.patchSession).not.toHaveBeenCalled();
    expect(screen.queryByText('Proposal app')).not.toBeInTheDocument();
    expect(screen.getByLabelText('location-search')).toHaveTextContent(
      '/tools/proposta-comercial-smart/app/chat',
    );
  });

  it('reuses a pending session creation for rapid first sends', async () => {
    const createSessionDeferred = createDeferred<ToolChatSession>();
    service.createSession.mockReturnValue(createSessionDeferred.promise);

    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), {
      target: { value: 'Primeira proposta' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensagem/i }));
    fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), {
      target: { value: 'Segunda proposta' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensagem/i }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(service.createSession).toHaveBeenCalledTimes(1);

    createSessionDeferred.resolve(createdSession);

    await waitFor(() => {
      expect(service.createMessage).toHaveBeenCalledWith(
        's_created',
        expect.objectContaining({
          role: 'user',
          content: 'Primeira proposta',
        }),
        proposalScope,
      );
    });
  });

  it('does not let a stale pending first-send create overwrite an opened session', async () => {
    const createSessionDeferred = createDeferred<ToolChatSession>();
    service.createSession.mockReturnValueOnce(createSessionDeferred.promise);
    service.listMessages.mockResolvedValueOnce([
      {
        id: 'm_opened',
        sessionId: 's_existing',
        role: 'user',
        content: 'Historico escolhido pelo usuario',
        createdAt: '2026-05-25T10:01:00Z',
      },
    ]);

    renderPage();

    const existingSessionButton = await screen.findByRole('button', { name: /proposta aurora/i });

    fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), {
      target: { value: 'Mensagem que ficou esperando sessao' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensagem/i }));

    fireEvent.click(existingSessionButton);
    expect(service.getSession).toHaveBeenCalledWith('s_existing', proposalScope);
    expect(service.listMessages).toHaveBeenCalledWith('s_existing', proposalScope);

    createSessionDeferred.resolve({ ...createdSession, id: 's_stale_create' });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(service.createMessage).not.toHaveBeenCalledWith(
      's_stale_create',
      expect.anything(),
      proposalScope,
    );
    expect(screen.getByLabelText('location-search')).toHaveTextContent('sessionId=s_existing');
    expect(await screen.findByText('Historico escolhido pelo usuario')).toBeInTheDocument();
  });

  it('abandons shared pending first-send waiters after a later open invalidates creation', async () => {
    const createSessionDeferred = createDeferred<ToolChatSession>();
    service.createSession.mockReturnValueOnce(createSessionDeferred.promise);
    service.listMessages.mockResolvedValueOnce([
      {
        id: 'm_shared_waiter',
        sessionId: 's_existing',
        role: 'user',
        content: 'Historico aberto depois dos envios pendentes',
        createdAt: '2026-05-25T10:01:00Z',
      },
    ]);

    renderPage();

    const existingSessionButton = await screen.findByRole('button', { name: /proposta aurora/i });

    fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), {
      target: { value: 'Primeira mensagem pendente' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensagem/i }));
    fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), {
      target: { value: 'Segunda mensagem pendente' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar mensagem/i }));
    expect(service.createSession).toHaveBeenCalledTimes(1);

    fireEvent.click(existingSessionButton);
    expect(service.getSession).toHaveBeenCalledWith('s_existing', proposalScope);
    expect(service.listMessages).toHaveBeenCalledWith('s_existing', proposalScope);

    createSessionDeferred.resolve({ ...createdSession, id: 's_stale_shared_create' });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(service.createMessage).not.toHaveBeenCalledWith(
      's_stale_shared_create',
      expect.anything(),
      proposalScope,
    );
    expect(screen.getByLabelText('location-search')).toHaveTextContent('sessionId=s_existing');
    expect(
      await screen.findByText('Historico aberto depois dos envios pendentes'),
    ).toBeInTheDocument();
  });

  it('uses opened session proposal metadata as context when stale URL proposal params are suppressed', async () => {
    service.getSession.mockResolvedValueOnce({
      ...existingSession,
      metadata: { proposal_id: 'p_linked' },
    });
    service.listMessages.mockResolvedValueOnce([
      {
        id: 'm_linked',
        sessionId: 's_existing',
        role: 'user',
        content: 'Historico da proposta vinculada',
        createdAt: '2026-05-25T10:01:00Z',
      },
    ]);

    renderPage('/tools/proposta-comercial-smart/app/chat?proposalId=p_old');

    fireEvent.click(await screen.findByRole('button', { name: /proposta aurora/i }));

    expect(await screen.findByText('Historico da proposta vinculada')).toBeInTheDocument();
    await waitFor(() => {
      const locationText = screen.getByLabelText('location-search').textContent ?? '';
      expect(locationText).toContain('sessionId=s_existing');
      expect(locationText).not.toContain('proposalId=p_old');
    });
    adapterContextMock.mockClear();

    await sendPrompt('Continuar proposta vinculada');

    await waitFor(() => {
      expect(adapterContextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          currentProposalId: 'p_linked',
        }),
      );
    });
    expect(adapterContextMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        currentProposalId: 'p_old',
      }),
    );
  });

  it('creates a diagnosis chat session, calls the AI endpoint, and persists the assistant report', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reply: 'Fechei o diagnostico comercial.',
          tool_result: diagnosisReportPayload,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    service.listSessions.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 30,
    });
    service.createSession.mockResolvedValue(createdDiagnosisSession);
    service.getSession.mockResolvedValue(createdDiagnosisSession);

    renderPage('/tools/diagnostico-comercial-caloni/app/chat');

    await sendPrompt('Diagnostica minha operacao comercial');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/ai/commercial-diagnosis-assistant'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Diagnostica minha operacao comercial' }],
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(service.createMessage).toHaveBeenCalledTimes(2);
    });

    expect(service.createSession).toHaveBeenCalledWith({
      toolSlug: 'diagnostico-comercial-caloni',
    });
    expect(service.createMessage).toHaveBeenNthCalledWith(
      1,
      's_diagnosis_created',
      expect.objectContaining({
        role: 'user',
        content: 'Diagnostica minha operacao comercial',
      }),
      diagnosisScope,
    );
    expect(service.createMessage).toHaveBeenNthCalledWith(
      2,
      's_diagnosis_created',
      expect.objectContaining({
        role: 'assistant',
        content: 'Fechei o diagnostico comercial.',
        payload: diagnosisReportPayload,
      }),
      diagnosisScope,
    );
  });

  it('reopens an existing diagnosis session with report payload without calling AI', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    service.listSessions.mockResolvedValue({
      items: [existingDiagnosisSession],
      total: 1,
      page: 1,
      perPage: 30,
    });
    service.getSession.mockResolvedValue(existingDiagnosisSession);
    service.listMessages.mockResolvedValue([
      {
        id: 'm_diagnosis_user',
        sessionId: 's_diagnosis_existing',
        role: 'user',
        content: 'Onde meu comercial trava?',
        createdAt: '2026-05-25T12:01:00Z',
      },
      {
        id: 'm_diagnosis_assistant',
        sessionId: 's_diagnosis_existing',
        role: 'assistant',
        content: 'Aqui esta o raio-x comercial.',
        payload: diagnosisReportPayload,
        createdAt: '2026-05-25T12:02:00Z',
      },
    ]);

    renderPage('/tools/diagnostico-comercial-caloni/app/chat?sessionId=s_diagnosis_existing');

    expect(await screen.findByText('Onde meu comercial trava?')).toBeInTheDocument();
    expect(await screen.findByTestId('commercial-diagnosis-report-card')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens a Radar de Leads session and renders persisted queue payload without calling the adapter', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
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
    expect(fetchMock).not.toHaveBeenCalled();
    expect(service.patchSession).not.toHaveBeenCalled();
  });

  it('patches Radar session metadata with created lead ids after a new assistant queue payload', async () => {
    const radarCreatedSession: ToolChatSession = {
      id: 's_radar_created',
      userId: 'u1',
      toolSlug: 'qualificacao-de-leads',
      title: 'Novo chat',
      metadata: {},
      createdAt: '2026-05-27T10:00:00Z',
      updatedAt: '2026-05-27T10:00:00Z',
    };
    service.listSessions.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 30,
    });
    service.createSession.mockResolvedValue(radarCreatedSession);
    service.patchSession.mockImplementation(async (_sessionId, input) => ({
      ...radarCreatedSession,
      metadata: input.metadata ?? {},
    }));
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
        radarScope,
      );
    });
    await waitFor(() => {
      expect(service.patchSession).toHaveBeenCalledWith(
        's_radar_created',
        {
          metadata: { lead_ids: ['lead-1'] },
        },
        radarScope,
      );
    });
  });
});
