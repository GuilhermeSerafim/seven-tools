import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toolChatSessionService, type ToolChatSession } from '@/agents/chat-sessions';
import { AuthProvider } from '@/auth/AuthContext';
import proposalService, { type Proposal } from '@/services/proposalService';
import ChatToolPage from '../ChatToolPage';

const serviceMock = vi.hoisted(() => ({
  listSessions: vi.fn(),
  createSession: vi.fn(),
  getSession: vi.fn(),
  listMessages: vi.fn(),
  createMessage: vi.fn(),
  patchSession: vi.fn(),
}));

vi.mock('@/auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('@/auth/AuthContext')>('@/auth/AuthContext');
  return {
    ...actual,
    AuthProvider: ({ children }: { children: ReactNode }) => children,
    useAuth: () => ({ user: { id: 'u1', email: 'ana@seven.test' } }),
  };
});

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

function renderAt(path = '/tools/proposta-comercial-smart') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/tools/:slug" element={<ChatToolPage />} />
          <Route path="/tools/:slug/app/chat" element={<ChatToolPage />} />
          <Route path="/tools/proposta-comercial-smart/app/:proposalId" element={<div>Proposal app</div>} />
          <Route path="/tools" element={<div>Hub</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function mockAssistantResponse(toolResult: unknown, reply = 'Atualizei seu rascunho.') {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        reply,
        tool_result: toolResult,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

const MOCK_PROPOSAL: Proposal = {
  id: 'p1',
  userId: 'u1',
  title: 'Cliente A',
  clientName: 'Ana',
  clientCompany: '',
  clientEmail: '',
  clientPhone: '',
  projectDescription: '',
  scope: '',
  value: '',
  deadline: '',
  notes: '',
  status: 'draft',
  createdAt: '',
  updatedAt: '',
};

const createdSession: ToolChatSession = {
  id: 's_proposal_test',
  userId: 'u1',
  toolSlug: 'proposta-comercial-smart',
  title: 'Novo chat',
  metadata: {},
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
};

const service = vi.mocked(toolChatSessionService);

async function sendPrompt(text: string) {
  fireEvent.change(screen.getByPlaceholderText('Digite uma mensagem...'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: /Enviar mensagem/i }));

  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

describe('ChatToolPage proposal agent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('seventools_token', 'token-proposal');
    service.listSessions.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 30,
    });
    service.createSession.mockResolvedValue(createdSession);
    service.getSession.mockResolvedValue(createdSession);
    service.listMessages.mockResolvedValue([]);
    service.createMessage.mockImplementation(async (sessionId, input) => ({
      id: `m_${service.createMessage.mock.calls.length}`,
      sessionId,
      createdAt: '2026-05-25T10:00:00Z',
      ...input,
    }));
    service.patchSession.mockImplementation(async (_sessionId, input) => ({
      ...createdSession,
      metadata: input.metadata ?? createdSession.metadata,
    }));
    vi.spyOn(proposalService, 'getAll').mockResolvedValue([MOCK_PROPOSAL]);
    vi.spyOn(proposalService, 'create').mockResolvedValue({ ...MOCK_PROPOSAL, id: 'saved-1' });
    vi.spyOn(proposalService, 'update').mockResolvedValue({ ...MOCK_PROPOSAL, id: 'p1' });
  });

  it('renderiza patch_draft e persiste patch no rascunho local', async () => {
    const fetchMock = mockAssistantResponse({
      kind: 'proposal_draft_patch',
      patch: {
        title: 'Proposta SEVEN',
        clientName: 'Ana Silva',
        projectDescription: 'Implantacao comercial',
      },
      missing_required: ['clientEmail'],
    });

    renderAt();

    await sendPrompt('Crie uma proposta para Ana');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-proposal',
        },
      }),
    );
    expect(screen.queryByTestId('proposal-draft-preview-card')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Ainda preciso de: empresa do cliente, e-mail, telefone, escopo, valor e prazo/i),
    ).toBeInTheDocument();
  });

  it('nao oferece confirmacao quando a API marca o rascunho parcial como completo', async () => {
    mockAssistantResponse(
      {
        kind: 'proposal_draft_patch',
        patch: {
          title: 'Proposta de Auditoria Tecnica e Conteudo para Acme',
          clientName: 'Maria Acme',
          clientCompany: 'Acme',
          projectDescription: 'Realizar auditoria tecnica do ambiente digital da Acme.',
        },
        missing_required: [],
      },
      'Agora tenho as informacoes principais da proposta. Quer editar algum ponto ou confirmar a criacao da proposta?',
    );

    renderAt('/tools/proposta-comercial-smart/app/chat');

    await sendPrompt('Segue o basico');

    expect(screen.queryByTestId('proposal-draft-preview-card')).not.toBeInTheDocument();
    expect(screen.queryByText(/confirmar a criacao da proposta/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Ainda preciso de: e-mail, telefone, escopo, valor e prazo/i)).toBeInTheDocument();
  });

  it('confirma em texto sem renderizar card quando o tool-call parcial vem sem texto', async () => {
    mockAssistantResponse(
      {
        kind: 'proposal_draft_patch',
        patch: {
          clientName: 'Maria Acme',
          clientEmail: 'maria@acme.local',
          clientPhone: '11999999999',
          scope: 'Auditoria tecnica, plano de conteudo e acompanhamento mensal',
          value: 'R$ 25.000',
          deadline: '90 dias',
        },
        missing_required: ['title', 'projectDescription'],
      },
      '',
    );

    renderAt('/tools/proposta-comercial-smart/app/chat');

    await sendPrompt('O cliente e Maria Acme');

    expect(screen.queryByTestId('proposal-draft-preview-card')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Maria Acme/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Atualizei o rascunho da proposta/i)).toBeInTheDocument();
  });

  it('substitui reply generico por chamada final quando o rascunho fica completo', async () => {
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

    expect(screen.getAllByTestId('proposal-draft-preview-card').length).toBeGreaterThan(0);
    expect(screen.getByText(/Agora tenho todas as informacoes do esqueleto/i)).toBeInTheDocument();
    expect(screen.queryByText(/Quer adicionar algo ou salvar a proposta/i)).not.toBeInTheDocument();
  });

  it('mostra o rascunho acumulado quando o agente retorna apenas um patch parcial', async () => {
    mockAssistantResponse(
      {
        kind: 'proposal_draft_patch',
        patch: {
          title: 'Proposta de Auditoria Tecnica e Conteudo para Acme',
          clientCompany: 'Acme',
          clientEmail: 'maria@acme.local',
          clientPhone: '11999999999',
          projectDescription: 'Realizar uma auditoria tecnica do ambiente digital da Acme.',
          scope: 'Auditoria tecnica, plano de conteudo e acompanhamento mensal',
          value: 'R$ 25.000',
          deadline: '90 dias',
        },
        missing_required: ['clientName'],
      },
      '',
    );

    renderAt('/tools/proposta-comercial-smart/app/chat');

    await sendPrompt('Dados principais da Acme');

    mockAssistantResponse(
      {
        kind: 'proposal_draft_patch',
        patch: {
          clientName: 'Acme',
        },
        missing_required: [],
      },
      '',
    );

    await sendPrompt('Nome do cliente e Acme');

    expect(screen.getAllByTestId('proposal-draft-preview-card').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Agora tenho todas as informacoes do esqueleto/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Proposta de Auditoria Tecnica e Conteudo para Acme').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Realizar uma auditoria tecnica do ambiente digital da Acme.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acme').length).toBeGreaterThan(0);
  });

  it('envia rascunho nulo quando o usuario inicia uma proposta nova sem contexto ativo', async () => {
    const fetchMock = mockAssistantResponse(null, 'Vamos comecar do zero.');

    renderAt('/tools/proposta-comercial-smart/app/chat');

    await sendPrompt('Quero montar uma proposta comercial nova');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"current_draft":null'),
      }),
    );
  });

  it('renderiza card de confirmacao quando o agente solicita salvar', async () => {
    mockAssistantResponse(
      {
        kind: 'proposal_save_request',
        draft_summary: {
          title: 'Proposta de crescimento',
          clientName: 'Ana Silva',
          clientCompany: 'Acme',
          clientEmail: 'ana@acme.local',
          clientPhone: '11999999999',
          projectDescription: 'Expansao comercial',
          scope: 'Diagnostico comercial e plano de crescimento',
          value: 'R$ 20.000',
          deadline: '45 dias',
        },
      },
      'Posso salvar essa versao.',
    );

    renderAt('/tools/proposta-comercial-smart/app/chat');

    await sendPrompt('Salvar proposta');

    expect(screen.getByTestId('proposal-save-confirm-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar/i })).toBeInTheDocument();
    expect(screen.getByText('Proposta de crescimento')).toBeInTheDocument();
  });

  it('salva a proposta solicitada pelo agente usando o service real', async () => {
    mockAssistantResponse(
      {
        kind: 'proposal_save_request',
        draft_summary: {
          title: 'Proposta de crescimento',
          clientName: 'Ana Silva',
          clientCompany: 'Acme',
          clientEmail: 'ana@acme.local',
          clientPhone: '11999999999',
          projectDescription: 'Expansao comercial',
          scope: 'Diagnostico comercial e plano de crescimento',
          value: 'R$ 20.000',
          deadline: '45 dias',
        },
      },
      'Posso salvar essa versao.',
    );

    renderAt('/tools/proposta-comercial-smart/app/chat');

    await sendPrompt('Salvar proposta');
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(proposalService.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        title: 'Proposta de crescimento',
        clientName: 'Ana Silva',
        clientCompany: 'Acme',
        clientEmail: 'ana@acme.local',
        clientPhone: '11999999999',
        projectDescription: 'Expansao comercial',
        scope: 'Diagnostico comercial e plano de crescimento',
        value: 'R$ 20.000',
        deadline: '45 dias',
        status: 'draft',
      }),
    );
    expect(screen.getByText('Proposal app')).toBeInTheDocument();
  });

  it('aplica atualizacao solicitada pelo agente usando o service real', async () => {
    mockAssistantResponse(
      {
        kind: 'proposal_update_request',
        proposal_id: 'p1',
        patch: {
          value: 'R$ 30.000',
        },
      },
      'Revise essa alteracao.',
    );

    renderAt('/tools/proposta-comercial-smart/app/chat?proposalId=p1');

    await sendPrompt('Atualizar valor');
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(proposalService.update).toHaveBeenCalledWith('u1', 'p1', { value: 'R$ 30.000' });
    expect(screen.getByText('Proposal app')).toBeInTheDocument();
  });

  it('carrega propostas salvas e envia proposalId selecionado ao adapter', async () => {
    const fetchMock = mockAssistantResponse(null, 'Vou validar essa proposta.');

    renderAt('/tools/proposta-comercial-smart');

    fireEvent.click(screen.getByRole('button', { name: /Validar proposta/i }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(proposalService.getAll).toHaveBeenCalledWith('u1');
    fireEvent.click(screen.getByRole('button', { name: /Cliente A/i }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"current_proposal_id":"p1"'),
      }),
    );
  });

  it('inicia validacao automaticamente em deep link do chat de proposta', async () => {
    const fetchMock = mockAssistantResponse(null, 'Vou validar essa proposta.');

    renderAt('/tools/proposta-comercial-smart/app/chat?proposalId=p1&intent=validate');

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"current_proposal_id":"p1"'),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"intent_hint":"validate"'),
      }),
    );
  });

  it('inicia edicao automaticamente em deep link do chat de proposta', async () => {
    const fetchMock = mockAssistantResponse(null, 'Vamos editar essa proposta.');

    renderAt('/tools/proposta-comercial-smart/app/chat?proposalId=p1&intent=edit');

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"content":"Editar proposta selecionada"'),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"intent_hint":"edit"'),
      }),
    );
  });
});
