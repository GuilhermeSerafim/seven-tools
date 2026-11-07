import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const { getAllMock } = vi.hoisted(() => ({
  getAllMock: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
          React.createElement(tag, props, children),
    },
  ),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Maria Silva" },
    company: { name: "SEVEN" },
    isAuthenticated: true,
    isAdmin: false,
  }),
}));

vi.mock("@/services/proposalService", () => ({
  proposalService: {
    getAll: getAllMock,
  },
  STATUS_LABELS: {
    draft: "Rascunho",
    ready: "Pronta para envio",
    sent: "Enviada",
    approved: "Aprovada",
    rejected: "Recusada",
  },
  STATUS_COLORS: {
    draft: "text-muted-foreground border-border",
    ready: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    sent: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    approved: "text-green-400 border-green-400/30 bg-green-400/10",
    rejected: "text-destructive border-destructive/30 bg-destructive/10",
  },
}));

vi.mock("@/components/tools/FavoriteButton", () => ({
  FavoriteButton: () => <span>Favorite</span>,
}));

vi.mock("@/components/tools/ToolCard", () => ({
  ToolCard: ({ tool }: { tool: { name: string } }) => <div>{tool.name}</div>,
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

async function renderModulePage(path: string) {
  const { default: ModulePage } = await import("./ModulePage");

  await act(async () => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/modules/:slug" element={<ModulePage />} />
        </Routes>
      </MemoryRouter>,
    );
  });
}

describe("ModulePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a stable proposal-card skeleton while proposal activity is still loading", async () => {
    const pendingProposals = createDeferred<
      Array<{
        id: string;
        userId: string;
        title: string;
        clientName: string;
        clientCompany: string;
        clientEmail: string;
        clientPhone: string;
        projectDescription: string;
        scope: string;
        value: string;
        deadline: string;
        notes: string;
        status: "draft" | "ready" | "sent" | "approved" | "rejected";
        createdAt: string;
        updatedAt: string;
      }>
    >();

    getAllMock.mockReturnValue(pendingProposals.promise);

    await renderModulePage("/modules/comercial");

    expect(await screen.findByTestId("proposal-card-loading")).toBeInTheDocument();
    expect(screen.getByTestId("proposal-card-footer-skeleton")).toBeInTheDocument();
    expect(getAllMock).toHaveBeenCalledWith("user-1");
  });

  it("renders proposal activity after loading without losing the proposal actions", async () => {
    getAllMock.mockResolvedValue([
      {
        id: "proposal-1",
        userId: "user-1",
        title: "Proposta Antiga",
        clientName: "Cliente Antigo",
        clientCompany: "Empresa Antiga",
        clientEmail: "antigo@test.com",
        clientPhone: "5511999999999",
        projectDescription: "Descricao",
        scope: "Escopo",
        value: "10000",
        deadline: "2026-04-05",
        notes: "",
        status: "draft",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-02T00:00:00.000Z",
      },
      {
        id: "proposal-2",
        userId: "user-1",
        title: "Proposta Gestão de Tráfego Pago",
        clientName: "Cliente Novo",
        clientCompany: "Empresa Nova",
        clientEmail: "novo@test.com",
        clientPhone: "5511888888888",
        projectDescription: "Descricao",
        scope: "Escopo",
        value: "22000",
        deadline: "2026-04-10",
        notes: "",
        status: "ready",
        createdAt: "2026-04-03T00:00:00.000Z",
        updatedAt: "2026-04-07T00:00:00.000Z",
      },
      {
        id: "proposal-3",
        userId: "user-1",
        title: "Proposta 3",
        clientName: "Cliente 3",
        clientCompany: "Empresa 3",
        clientEmail: "3@test.com",
        clientPhone: "5511777777777",
        projectDescription: "Descricao",
        scope: "Escopo",
        value: "15000",
        deadline: "2026-04-08",
        notes: "",
        status: "sent",
        createdAt: "2026-04-04T00:00:00.000Z",
        updatedAt: "2026-04-04T00:00:00.000Z",
      },
      {
        id: "proposal-4",
        userId: "user-1",
        title: "Proposta 4",
        clientName: "Cliente 4",
        clientCompany: "Empresa 4",
        clientEmail: "4@test.com",
        clientPhone: "5511666666666",
        projectDescription: "Descricao",
        scope: "Escopo",
        value: "18000",
        deadline: "2026-04-09",
        notes: "",
        status: "approved",
        createdAt: "2026-04-02T00:00:00.000Z",
        updatedAt: "2026-04-02T00:00:00.000Z",
      },
    ]);

    await renderModulePage("/modules/comercial");

    expect(await screen.findByText(/^4$/)).toBeInTheDocument();
    expect(screen.getByText(/proposta gestão de tráfego pago/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /abrir propostas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nova proposta/i })).toBeInTheDocument();
    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith("user-1"));
  });
});
