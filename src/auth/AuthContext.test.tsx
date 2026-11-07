import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";
import authService from "./authService";
import type { ResolvedAuthSession } from "./types";
import { createDeferred } from "@/test/createDeferred";

vi.mock("./authService", () => ({
  default: {
    getCurrentSession: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearLocalSession: vi.fn(),
    updateUser: vi.fn(),
    updateCompany: vi.fn(),
  },
}));

const emptySession = { user: null, company: null } as const;

function createApprovedSession(
  overrides: Partial<NonNullable<ResolvedAuthSession["user"]>> = {},
): ResolvedAuthSession {
  return {
    user: {
      id: "user-1",
      name: "Maria Silva",
      email: "maria@example.com",
      role: "user",
      validationStatus: "approved",
      approvalSource: "manual",
      ...overrides,
    },
    company: null,
  };
}

function createPendingSession(
  overrides: Partial<NonNullable<ResolvedAuthSession["user"]>> = {},
): ResolvedAuthSession {
  return {
    user: {
      id: "user-2",
      name: "Joana Lima",
      email: "joana@example.com",
      role: "user",
      validationStatus: "pending_review",
      approvalSource: null,
      ...overrides,
    },
    company: null,
  };
}

async function renderHarnessAfterLogin() {
  const refreshSession = createDeferred<ResolvedAuthSession>();

  vi.mocked(authService.getCurrentSession)
    .mockResolvedValueOnce(emptySession)
    .mockImplementationOnce(() => refreshSession.promise);

  vi.mocked(authService.login).mockResolvedValue({
    success: true,
    session: createApprovedSession(),
  });

  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );

  expect(await screen.findByText("anonymous")).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  });

  expect(await screen.findByText("Maria Silva")).toBeInTheDocument();

  return refreshSession;
}

function Harness() {
  const { user, login, logout, clearSession, isApproved } = useAuth();

  return (
    <div>
      <span>{user?.name ?? "anonymous"}</span>
      <span>{isApproved ? "approved" : "pending"}</span>
      <button type="button" onClick={() => void login("maria@example.com", "secret")}>
        Entrar
      </button>
      <button type="button" onClick={() => void logout()}>
        Sair
      </button>
      <button type="button" onClick={() => clearSession()}>
        Limpar sessao local
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a visible loading shell while restoring a stored session", () => {
    vi.mocked(authService.getCurrentSession).mockImplementation(() => new Promise(() => {}));

    render(
      <AuthProvider>
        <div>Protected app</div>
      </AuthProvider>,
    );

    const bootScreen = screen.getByRole("status");

    expect(bootScreen).toHaveAttribute("aria-busy", "true");
    expect(bootScreen).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Carregando seu acesso...")).toBeInTheDocument();
    expect(screen.getByText("Estamos preparando o hub para voce.")).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });

  it("clears the loading shell and renders children after the restore resolves", async () => {
    const restoreSession = createDeferred<ResolvedAuthSession>();
    vi.mocked(authService.getCurrentSession).mockImplementation(() => restoreSession.promise);

    render(
      <AuthProvider>
        <div>Protected app</div>
      </AuthProvider>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Carregando seu acesso...")).toBeInTheDocument();

    await act(async () => {
      restoreSession.resolve(emptySession);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Protected app")).toBeInTheDocument();
  });

  it("hydrates the user from the login response before the background refresh resolves", async () => {
    const refreshSession = await renderHarnessAfterLogin();
    expect(authService.getCurrentSession).toHaveBeenCalledTimes(2);

    await act(async () => {
      refreshSession.resolve(createApprovedSession());
    });
  });

  it("does not rehydrate the user from a stale silent refresh after logout", async () => {
    const refreshSession = await renderHarnessAfterLogin();
    vi.mocked(authService.logout).mockResolvedValue();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    });

    expect(await screen.findByText("anonymous")).toBeInTheDocument();

    await act(async () => {
      refreshSession.resolve(createApprovedSession());
    });

    expect(screen.getByText("anonymous")).toBeInTheDocument();
  });

  it("clears the local session without calling the logout endpoint", async () => {
    const refreshSession = await renderHarnessAfterLogin();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Limpar sessao local" }));
    });

    expect(authService.clearLocalSession).toHaveBeenCalledTimes(1);
    expect(authService.logout).not.toHaveBeenCalled();
    expect(await screen.findByText("anonymous")).toBeInTheDocument();

    await act(async () => {
      refreshSession.resolve(createApprovedSession());
    });

    expect(screen.getByText("anonymous")).toBeInTheDocument();
  });

  it("exposes pending approval state to consumers", async () => {
    vi.mocked(authService.getCurrentSession).mockResolvedValue(createPendingSession());

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    expect(await screen.findByText("Joana Lima")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});
