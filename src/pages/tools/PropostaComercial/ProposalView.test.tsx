import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getProposalChatPath } from "@/features/comercial/toolRoutes";
import { createDeferred } from "@/test/createDeferred";

const { navigateMock, getByIdMock, buttonHandlers } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getByIdMock: vi.fn(),
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
    company: { name: "SEVEN" },
    isAuthenticated: true,
    isAdmin: false,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    variant?: string;
  }) => {
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
      <button onClick={onClick} data-variant={variant} {...props}>
        {children}
      </button>
    );
  },
}));

vi.mock("@/services/proposalService", () => ({
  proposalService: {
    getById: getByIdMock,
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

async function renderProposalView(status: "draft" | "ready") {
  const { default: ProposalView } = await import("./ProposalView");

  getByIdMock.mockResolvedValue({
    id: "proposal-1",
    userId: "user-1",
    title: "Proposta Enterprise",
    clientName: "Acme",
    clientCompany: "Acme Corp",
    clientEmail: "contato@acme.test",
    clientPhone: "5511999999999",
    projectDescription: "Descricao",
    scope: "Escopo",
    value: "10000",
    deadline: "2026-04-09",
    notes: "",
    status,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  });

  render(
    <MemoryRouter
      initialEntries={["/tools/proposta-comercial-smart/app/proposal-1"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/tools/proposta-comercial-smart/app/:proposalId"
          element={<ProposalView />}
        />
      </Routes>
    </MemoryRouter>,
  );

  await waitFor(() => expect(getByIdMock).toHaveBeenCalledWith("user-1", "proposal-1"));
}

describe("ProposalView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(buttonHandlers).forEach((key) => delete buttonHandlers[key]);
  });

  it("keeps draft proposals on a secondary validation CTA and opens proposal chat validation with the current proposal id", async () => {
    await renderProposalView("draft");

    const validationButton = await screen.findByRole("button", { name: /validar no caloni/i });
    expect(validationButton).toHaveAttribute("data-variant", "outline");

    buttonHandlers["Validar no Caloni"]?.();

    expect(navigateMock).toHaveBeenCalledWith(getProposalChatPath("proposal-1", "validate"));
  });

  it("promotes validation for ready proposals, demotes edit, and opens proposal chat intents with the current proposal id", async () => {
    await renderProposalView("ready");

    const validationButton = await screen.findByRole("button", { name: /validar antes de enviar/i });
    const editButton = await screen.findByRole("button", { name: /editar/i });

    expect(validationButton).toHaveAttribute("data-variant", "default");
    expect(editButton).toHaveAttribute("data-variant", "outline");

    buttonHandlers["Validar antes de enviar"]?.();
    buttonHandlers["Editar"]?.();

    expect(navigateMock).toHaveBeenCalledWith(getProposalChatPath("proposal-1", "validate"));
    expect(navigateMock).toHaveBeenCalledWith(getProposalChatPath("proposal-1", "edit"));
  });

  it("renders the orbital loader while the proposal is loading", async () => {
    const pendingProposal = createDeferred<unknown>();
    getByIdMock.mockReturnValueOnce(pendingProposal.promise);

    const { default: ProposalView } = await import("./ProposalView");

    render(
      <MemoryRouter
        initialEntries={["/tools/proposta-comercial-smart/app/proposal-1"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route
            path="/tools/proposta-comercial-smart/app/:proposalId"
            element={<ProposalView />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(getByIdMock).toHaveBeenCalledWith("user-1", "proposal-1"));

    const loader = screen.getByRole("status");
    expect(loader).toHaveAttribute("aria-busy", "true");
    expect(loader).toHaveTextContent(/carregando proposta/i);
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });
});
