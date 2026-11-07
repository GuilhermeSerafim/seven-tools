import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toolChatSessionService, type ToolChatSession } from '@/agents/chat-sessions';
import { AuthProvider } from '@/auth/AuthContext';
import { proposalService } from '@/services/proposalService';
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
    useAuth: () => ({ user: { id: 'u1', email: 'x@y.com' } }),
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

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/tools/:slug" element={<ChatToolPage />} />
          <Route path="/tools/:slug/app/chat" element={<ChatToolPage />} />
          <Route path="/tools" element={<div>Hub</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

const createdSession: ToolChatSession = {
  id: 's_chat_tool_test',
  userId: 'u1',
  toolSlug: 'proposta-comercial-smart',
  title: 'Novo chat',
  metadata: {},
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
};

const service = vi.mocked(toolChatSessionService);

describe('ChatToolPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
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
    vi.spyOn(proposalService, 'getAll').mockResolvedValue([]);
  });

  it('slug inexistente redireciona para /tools', () => {
    renderAt('/tools/slug-que-nao-existe');
    expect(screen.getByText('Hub')).toBeInTheDocument();
  });

  it('renderiza o agente unificado de proposta sem buscar propostas ao montar', async () => {
    renderAt('/tools/proposta-comercial-smart');

    expect(await screen.findAllByText('Caloni')).not.toHaveLength(0);
    expect(screen.getByText(/Decisor Comercial/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Começar proposta nova/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Validar proposta/i })).toBeInTheDocument();
    expect(proposalService.getAll).not.toHaveBeenCalled();
  });

  it('usa a superficie ampla do chat na rota /app/chat', async () => {
    const { container } = renderAt('/tools/proposta-comercial-smart/app/chat');

    expect(await screen.findAllByText('Caloni')).not.toHaveLength(0);

    const layoutInner = container.querySelector("[data-layout='pure-inner']");
    expect(layoutInner?.className).toContain('max-w-[1120px]');

    const headerShell = screen.getByTestId('agent-header-shell');
    expect(headerShell.className).toContain('max-w-[960px]');

    const emptyState = screen.getByTestId('chat-empty-state');
    expect(emptyState.className).toContain('max-w-[960px]');

    const composerShell = screen.getByTestId('chat-tool-composer-shell');
    expect(composerShell.firstElementChild).toHaveClass('max-w-[960px]');
    expect(composerShell.className).toContain('bg-background/90');
  });

  it('renderiza o chat real do Raio-X na rota /app/chat sem buscar propostas', async () => {
    renderAt('/tools/diagnostico-comercial-caloni/app/chat');

    expect(await screen.findAllByText('Raio-X Comercial')).not.toHaveLength(0);
    expect(screen.getByText(/Diagnostico comercial/i)).toBeInTheDocument();
    expect(
      screen.getByText(/diagnosticar sua operacao comercial, encontrar gargalos do funil/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Diagnosticar operacao/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Encontrar gargalo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fechar plano/i })).toBeInTheDocument();
    expect(proposalService.getAll).not.toHaveBeenCalled();
  });
});
