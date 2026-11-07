import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const {
  getAllMock,
  getProposalAppPathMock,
  getProposalChatPathMock,
} = vi.hoisted(() => ({
  getAllMock: vi.fn(),
  getProposalAppPathMock: vi.fn(() => "/proposal-helper-path"),
  getProposalChatPathMock: vi.fn((proposalId?: string, intent?: string) =>
    `/proposal-chat-helper-path?proposalId=${proposalId ?? ""}&intent=${intent ?? ""}`,
  ),
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

vi.mock("@/contexts/FavoritesContext", () => ({
  useFavorites: () => ({
    favoriteIds: [],
    isFavorite: () => false,
    toggleFavorite: () => undefined,
  }),
}));

vi.mock("@/services/proposalService", () => ({
  proposalService: {
    getAll: getAllMock,
  },
}));

vi.mock("@/features/comercial/toolRoutes", async () => {
  const actual = await vi.importActual<typeof import("@/features/comercial/toolRoutes")>(
    "@/features/comercial/toolRoutes",
  );

  return {
    ...actual,
    getProposalAppPath: getProposalAppPathMock,
    getProposalChatPath: getProposalChatPathMock,
  };
});

vi.mock("@/components/home/ModuleCard", () => ({
  ModuleCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/components/tools/ToolCard", () => ({
  ToolCard: ({ tool }: { tool: { name: string } }) => <div>{tool.name}</div>,
}));

async function renderHome() {
  const { default: Home } = await import("./Index");

  await act(async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
  });
}

describe("Index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses shared proposal helpers and links validation to the newest proposal chat by timestamp", async () => {
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

    await renderHome();

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith("user-1"));

    const linksUsingProposalHelper = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/proposal-helper-path");

    expect(linksUsingProposalHelper).toHaveLength(2);
    expect(screen.getByRole("link", { name: /validar no caloni/i })).toHaveAttribute(
      "href",
      "/proposal-chat-helper-path?proposalId=proposal-new&intent=validate",
    );
    expect(screen.getByText(/proposta mais recente/i)).toBeInTheDocument();
  }, 10000);
});
