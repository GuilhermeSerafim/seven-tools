import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { createDeferred } from "@/test/createDeferred";
import { getProposalChatPath } from "@/features/comercial/toolRoutes";

const { getAllMock, navigateMock, buttonHandlers } = vi.hoisted(() => ({
  getAllMock: vi.fn(),
  navigateMock: vi.fn(),
  buttonHandlers: {} as Record<string, (() => void) | undefined>,
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
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    isAuthenticated: true,
    isAdmin: false,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    (() => {
      const getText = (node: React.ReactNode): string => {
        if (typeof node === "string" || typeof node === "number") {
          return String(node);
        }
        if (Array.isArray(node)) {
          return node.map(getText).join(" ");
        }
        if (React.isValidElement(node)) {
          return getText(node.props.children);
        }
        return "";
      };

      const label = getText(children).replace(/\s+/g, " ").trim();
      if (label) {
        buttonHandlers[label] = onClick as (() => void) | undefined;
      }

      return (
        <button onClick={onClick} {...props}>
          {children}
        </button>
      );
    })()
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  DropdownMenuItem: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
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

describe("ProposalList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllMock.mockResolvedValue([]);
    Object.keys(buttonHandlers).forEach((key) => delete buttonHandlers[key]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the orbital loader while proposals are loading", async () => {
    const pendingProposals = createDeferred<unknown[]>();
    getAllMock.mockReturnValueOnce(pendingProposals.promise);

    const { default: ProposalList } = await import("./ProposalList");

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProposalList />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith("user-1"));

    const loader = screen.getByRole("status");
    expect(loader).toHaveAttribute("aria-busy", "true");
    expect(loader).toHaveTextContent(/carregando propostas/i);
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });

  it("sends new proposal actions to the unified proposal chat", async () => {
    const { default: ProposalList } = await import("./ProposalList");

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProposalList />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getAllMock).toHaveBeenCalledWith("user-1"));

    await screen.findByRole("button", { name: /criar primeira proposta/i });
    buttonHandlers["Criar primeira proposta"]?.();

    expect(navigateMock).toHaveBeenCalledWith(getProposalChatPath());
  });
});
