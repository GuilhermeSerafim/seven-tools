import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { getProposalChatPath } from "@/features/comercial/toolRoutes";

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
    user: { id: "user-1" },
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

vi.mock("@/components/home/ModuleCard", () => ({
  ModuleCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

async function renderTools() {
  const { default: Tools } = await import("./Tools");

  await act(async () => {
    render(
      <MemoryRouter>
        <Tools />
      </MemoryRouter>,
    );
  });
}

describe("Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links validation to the unified proposal chat with the newest proposal by timestamp", async () => {
    getAllMock.mockResolvedValue([
      {
        id: "proposal-old",
        userId: "user-1",
        title: "Proposta antiga",
        clientName: "Cliente A",
        clientCompany: "Empresa A",
        clientEmail: "a@test.com",
        clientPhone: "5511999999999",
        projectDescription: "Descricao",
        scope: "Escopo",
        value: "10000",
        deadline: "2026-04-09",
        notes: "",
        status: "draft",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-02T00:00:00.000Z",
      },
      {
        id: "proposal-new",
        userId: "user-1",
        title: "Proposta mais recente",
        clientName: "Cliente B",
        clientCompany: "Empresa B",
        clientEmail: "b@test.com",
        clientPhone: "5511888888888",
        projectDescription: "Descricao",
        scope: "Escopo",
        value: "20000",
        deadline: "2026-04-10",
        notes: "",
        status: "ready",
        createdAt: "2026-04-03T00:00:00.000Z",
        updatedAt: "2026-04-05T00:00:00.000Z",
      },
    ]);

    await renderTools();

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith("user-1"));
    expect(screen.getByRole("link", { name: /validar no caloni/i })).toHaveAttribute(
      "href",
      getProposalChatPath("proposal-new", "validate"),
    );
    expect(screen.getByText(/proposta mais recente/i)).toBeInTheDocument();
  });
});
