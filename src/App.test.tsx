import { cleanup, render, screen } from "@testing-library/react";
import React, { act } from "react";
import { Outlet } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ProviderProps = Readonly<{ children: React.ReactNode }>;

function passthroughProvider({ children }: ProviderProps) {
  return <>{children}</>;
}

function createMockUser(
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
    validationStatus: "approved" | "pending_review";
    approvalSource: string | null;
  }> = {},
) {
  return {
    id: "user-1",
    name: "Maria Silva",
    email: "maria@example.com",
    role: "user" as const,
    validationStatus: "approved" as const,
    approvalSource: "manual",
    ...overrides,
  };
}

function createMockAuthState(
  overrides: Partial<{
    user: ReturnType<typeof createMockUser> | null;
    company: null;
    isAuthenticated: boolean;
    isApproved: boolean;
    isAdmin: boolean;
  }> = {},
) {
  return {
    user: null,
    company: null,
    isAuthenticated: false,
    isApproved: false,
    isAdmin: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearSession: vi.fn(),
    updateUser: vi.fn(),
    updateCompany: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  };
}

function createApprovedMemberAuthState(
  overrides: Partial<Parameters<typeof createMockUser>[0]> = {},
) {
  return createMockAuthState({
    user: createMockUser(overrides),
    isAuthenticated: true,
    isApproved: true,
  });
}

function createApprovedAdminAuthState() {
  return createMockAuthState({
    user: createMockUser({
      id: "user-admin",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
    }),
    isAuthenticated: true,
    isApproved: true,
    isAdmin: true,
  });
}

function createPendingAuthState(
  overrides: Partial<Parameters<typeof createMockUser>[0]> = {},
) {
  return createMockAuthState({
    user: createMockUser({
      validationStatus: "pending_review",
      approvalSource: null,
      ...overrides,
    }),
    isAuthenticated: true,
    isApproved: false,
  });
}

function mockAuthContext({
  AuthProvider = passthroughProvider,
  useAuth = () => createMockAuthState(),
}: Readonly<{
  AuthProvider?: React.ComponentType<ProviderProps>;
  useAuth?: () => unknown;
}> = {}) {
  vi.doMock("@/auth/AuthContext", () => ({
    AuthProvider,
    useAuth: vi.fn(useAuth),
  }));
}

function mockFavoritesContext(
  FavoritesProvider: React.ComponentType<ProviderProps> = passthroughProvider,
) {
  vi.doMock("@/contexts/FavoritesContext", () => ({
    FavoritesProvider,
    useFavorites: vi.fn(() => ({
      favoriteIds: [],
      isFavorite: () => false,
      toggleFavorite: () => undefined,
    })),
  }));
}

function mockLayout() {
  vi.doMock("@/components/layout/Layout", () => ({
    Layout: () => <Outlet />,
  }));
}

function mockChatDemoPages() {
  vi.doMock("@/pages/chat-demo/ChatDemoPure", () => ({
    default: () => <div>Pure chat demo</div>,
  }));
}

function mockPage(
  modulePath: string,
  text: string,
  tag: "div" | "h1" = "div",
) {
  vi.doMock(modulePath, () => ({
    default: () => React.createElement(tag, undefined, text),
  }));
}

function setPath(path: string) {
  globalThis.history.pushState({}, "", path);
}

function navigateTo(path: string) {
  setPath(path);
  globalThis.dispatchEvent(new PopStateEvent("popstate"));
}

async function renderApp() {
  const { default: App } = await import("./App");
  render(<App />);
}

function createLifecycleAuthProvider(authLifecycle: { mounts: number; unmounts: number }) {
  return function AuthProvider({ children }: ProviderProps) {
    React.useEffect(() => {
      authLifecycle.mounts += 1;
      return () => {
        authLifecycle.unmounts += 1;
      };
    }, []);

    return <>{children}</>;
  };
}

function mockLandingAnimationDependencies() {
  vi.doMock("framer-motion", () => ({
    motion: new Proxy(
      {},
      {
        get: (_, tag: string) =>
          ({
            animate: _animate,
            children,
            exit: _exit,
            initial: _initial,
            transition: _transition,
            variants: _variants,
            viewport: _viewport,
            whileHover: _whileHover,
            whileInView: _whileInView,
            whileTap: _whileTap,
            ...props
          }: React.HTMLAttributes<HTMLElement> & {
            animate?: unknown;
            children?: React.ReactNode;
            exit?: unknown;
            initial?: unknown;
            transition?: unknown;
            variants?: unknown;
            viewport?: unknown;
            whileHover?: unknown;
            whileInView?: unknown;
            whileTap?: unknown;
          }) =>
            React.createElement(tag, props, children),
      },
    ),
  }));

  vi.doMock("@/components/ui/container-scroll-animation", () => ({
    ContainerScroll: ({
      titleComponent,
      children,
    }: Readonly<{
      titleComponent: React.ReactNode;
      children: React.ReactNode;
    }>) => (
      <div>
        {titleComponent}
        {children}
      </div>
    ),
  }));

  vi.doMock("@/components/ui/radial-orbital-timeline", () => ({
    __esModule: true,
    default: () => <div>Timeline</div>,
  }));
}

describe("App bootstrap", () => {
  beforeEach(() => {
    cleanup();
    vi.resetModules();
    vi.clearAllMocks();
    setPath("/");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the public landing page without mounting auth providers", async () => {
    const authProviderMock = vi.fn(() => null);
    const favoritesProviderMock = vi.fn(() => null);

    mockLandingAnimationDependencies();
    mockAuthContext({
      AuthProvider: authProviderMock as unknown as React.ComponentType<ProviderProps>,
      useAuth: vi.fn(),
    });
    mockFavoritesContext(
      favoritesProviderMock as unknown as React.ComponentType<ProviderProps>,
    );

    await renderApp();

    expect((await screen.findAllByRole("link", { name: /Acessar o Hub/i })).length).toBeGreaterThan(0);
    expect(authProviderMock).not.toHaveBeenCalled();
    expect(favoritesProviderMock).not.toHaveBeenCalled();
  });

  it("routes landing hub CTAs directly to the protected hub entrypoint", async () => {
    mockLandingAnimationDependencies();

    await renderApp();

    const links = await screen.findAllByRole("link", { name: /Acessar o Hub/i });

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/hub");
    }
  });

  it("does not eagerly import protected route modules when opening the landing page", async () => {
    let indexModuleLoads = 0;

    mockLandingAnimationDependencies();
    mockAuthContext();
    mockFavoritesContext();

    vi.doMock("@/pages/Index.tsx", () => {
      indexModuleLoads += 1;
      return {
        default: () => <div>Hub page</div>,
      };
    });

    await renderApp();

    expect((await screen.findAllByRole("link", { name: /Acessar o Hub/i })).length).toBeGreaterThan(0);
    expect(indexModuleLoads).toBe(0);
  });

  it("renders the pure chat demo route outside protected app providers", async () => {
    const authProviderMock = vi.fn(() => null);
    const favoritesProviderMock = vi.fn(() => null);

    mockAuthContext({
      AuthProvider: authProviderMock as unknown as React.ComponentType<ProviderProps>,
      useAuth: vi.fn(),
    });
    mockFavoritesContext(
      favoritesProviderMock as unknown as React.ComponentType<ProviderProps>,
    );
    mockChatDemoPages();

    setPath("/chat/demo/pure");
    await renderApp();

    expect(await screen.findByText("Pure chat demo")).toBeInTheDocument();
    expect(screen.queryByText("DEMO")).not.toBeInTheDocument();
    expect(screen.queryByText("Modo:")).not.toBeInTheDocument();
    expect(authProviderMock).not.toHaveBeenCalled();
    expect(favoritesProviderMock).not.toHaveBeenCalled();
  });

  it("redirects the retired split chat demo route to the pure mock", async () => {
    mockChatDemoPages();

    setPath("/chat/demo/split");
    await renderApp();

    expect(await screen.findByText("Pure chat demo")).toBeInTheDocument();
    expect(screen.queryByText("Split chat demo")).not.toBeInTheDocument();
    expect(globalThis.location.pathname).toBe("/chat/demo/pure");
  });

  it("redirects the chat demo index route to the pure chat demo page", async () => {
    mockChatDemoPages();

    setPath("/chat/demo");
    await renderApp();

    expect(await screen.findByText("Pure chat demo")).toBeInTheDocument();
    expect(screen.queryByText("DEMO")).not.toBeInTheDocument();
    expect(screen.queryByText("Modo:")).not.toBeInTheDocument();
    expect(globalThis.location.pathname).toBe("/chat/demo/pure");
  });

  it("redirects the removed proposal validation route to the unified proposal chat", async () => {
    mockAuthContext({
      useAuth: () => createApprovedMemberAuthState(),
    });
    mockFavoritesContext();
    mockLayout();
    mockPage("@/pages/ChatToolPage.tsx", "Chat tool page");

    setPath("/tools/proposta-comercial-smart/app/validate");
    await renderApp();

    expect(await screen.findByText("Chat tool page")).toBeInTheDocument();
    expect(globalThis.location.pathname).toBe("/tools/proposta-comercial-smart/app/chat");
  });

  it("redirects the retired diagnosis app route to the Raio-X chat", async () => {
    mockAuthContext({
      useAuth: () => createApprovedMemberAuthState(),
    });
    mockFavoritesContext();
    mockLayout();
    mockPage("@/pages/ChatToolPage.tsx", "Chat tool page");

    setPath("/tools/diagnostico-comercial-caloni/app");
    await renderApp();

    expect(await screen.findByText("Chat tool page")).toBeInTheDocument();
    expect(globalThis.location.pathname).toBe("/tools/diagnostico-comercial-caloni/app/chat");
  });

  it("routes Radar de Leads chat path to the shared chat page", async () => {
    mockAuthContext({
      useAuth: () => createApprovedMemberAuthState(),
    });
    mockFavoritesContext();
    mockLayout();
    mockPage("@/pages/ChatToolPage.tsx", "Chat tool page");
    mockPage("@/pages/tools/QualificacaoLeads/LeadQualificationDetail.tsx", "Lead detail page");

    setPath("/tools/qualificacao-de-leads/app/chat");
    await renderApp();

    expect(await screen.findByText("Chat tool page")).toBeInTheDocument();
    expect(screen.queryByText("Lead detail page")).not.toBeInTheDocument();
  });

  it("keeps the auth provider mounted while navigating from login to hub", async () => {
    const authLifecycle = { mounts: 0, unmounts: 0 };
    let authenticated = false;

    mockAuthContext({
      AuthProvider: createLifecycleAuthProvider(authLifecycle),
      useAuth: () =>
        authenticated
          ? createMockAuthState({
              user: createMockUser(),
              isAuthenticated: true,
              isApproved: true,
            })
          : createMockAuthState(),
    });
    mockFavoritesContext();
    mockLayout();
    mockPage("@/pages/auth/Login.tsx", "Login page");
    mockPage("@/pages/Index.tsx", "Hub page");

    setPath("/login");
    await renderApp();

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(authLifecycle).toEqual({ mounts: 1, unmounts: 0 });

    authenticated = true;

    act(() => {
      navigateTo("/hub");
    });

    expect(await screen.findByText("Hub page")).toBeInTheDocument();
    expect(authLifecycle).toEqual({ mounts: 1, unmounts: 0 });
  });

  it("shows the route loader while the login chunk is still loading", async () => {
    mockAuthContext({
      useAuth: () => createMockAuthState(),
    });
    mockFavoritesContext();
    vi.doMock("@/pages/auth/Login.tsx", () => new Promise(() => {}));

    setPath("/login");
    await renderApp();

    const loader = screen.getByRole("status");

    expect(loader).toHaveAttribute("aria-busy", "true");
    expect(loader).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });

  it("renders the forgot password route as a public operational page", async () => {
    const authProviderMock = vi.fn(() => null);

    mockAuthContext({
      AuthProvider: authProviderMock as unknown as React.ComponentType<ProviderProps>,
      useAuth: () => createApprovedMemberAuthState(),
    });
    mockFavoritesContext();
    mockPage("@/pages/auth/ForgotPassword.tsx", "Forgot password page");
    mockPage("@/pages/NotFound.tsx", "Not found page");

    setPath("/esqueci-senha");
    await renderApp();

    expect(await screen.findByText("Forgot password page")).toBeInTheDocument();
    expect(screen.queryByText("Not found page")).not.toBeInTheDocument();
    expect(authProviderMock).not.toHaveBeenCalled();
  });

  it("renders the reset password route as a public operational page", async () => {
    const authProviderMock = vi.fn(() => null);

    mockAuthContext({
      AuthProvider: authProviderMock as unknown as React.ComponentType<ProviderProps>,
      useAuth: () => createApprovedMemberAuthState(),
    });
    mockFavoritesContext();
    mockPage("@/pages/auth/ResetPassword.tsx", "Reset password page");
    mockPage("@/pages/NotFound.tsx", "Not found page");

    setPath("/redefinir-senha?token=reset-token");
    await renderApp();

    expect(await screen.findByText("Reset password page")).toBeInTheDocument();
    expect(screen.queryByText("Not found page")).not.toBeInTheDocument();
    expect(authProviderMock).not.toHaveBeenCalled();
  });

  it("keeps the auth provider mounted while navigating from hub to the admin review route", async () => {
    const authLifecycle = { mounts: 0, unmounts: 0 };

    mockAuthContext({
      AuthProvider: createLifecycleAuthProvider(authLifecycle),
      useAuth: () => createApprovedAdminAuthState(),
    });
    mockFavoritesContext();
    mockLayout();
    mockPage("@/pages/Index.tsx", "Hub page");
    mockPage("@/pages/admin/MembershipReviewsPage.tsx", "Membership reviews page");

    setPath("/hub");
    await renderApp();

    expect(await screen.findByText("Hub page")).toBeInTheDocument();
    expect(authLifecycle).toEqual({ mounts: 1, unmounts: 0 });

    act(() => {
      navigateTo("/admin/membros-pendentes");
    });

    expect(await screen.findByText("Membership reviews page")).toBeInTheDocument();
    expect(authLifecycle).toEqual({ mounts: 1, unmounts: 0 });
  });

  it("redirects authenticated pending users from public routes to the awaiting validation page", async () => {
    mockAuthContext({
      useAuth: () =>
        createPendingAuthState({
          id: "user-2",
          name: "Joao Pereira",
          email: "joao@example.com",
        }),
    });
    mockFavoritesContext();
    mockPage("@/pages/auth/Login.tsx", "Login page");
    mockPage("@/pages/auth/AwaitingValidation.tsx", "Waiting page");

    setPath("/login");
    await renderApp();

    expect(await screen.findByText("Waiting page")).toBeInTheDocument();
  });

  it("redirects authenticated pending users from the admin review route to the awaiting validation page", async () => {
    mockAuthContext({
      useAuth: () =>
        createPendingAuthState({
          id: "user-4",
          name: "Paula Costa",
          email: "paula@example.com",
        }),
    });
    mockFavoritesContext();
    mockPage("@/pages/auth/AwaitingValidation.tsx", "Waiting page");

    setPath("/admin/membros-pendentes");
    await renderApp();

    expect(await screen.findByText("Waiting page")).toBeInTheDocument();
    expect(globalThis.location.pathname).toBe("/aguardando-validacao");
  });

  it("lets approved admins reach the pending members review route", async () => {
    mockAuthContext({
      useAuth: () => createApprovedAdminAuthState(),
    });
    mockFavoritesContext();
    mockLayout();
    mockPage("@/pages/Index.tsx", "Hub page");
    mockPage("@/pages/admin/MembershipReviewsPage.tsx", "Membership reviews page", "h1");

    setPath("/admin/membros-pendentes");
    await renderApp();

    expect(await screen.findByRole("heading", { name: "Membership reviews page" })).toBeInTheDocument();
  });

  it("redirects approved non-admin users from the pending members review route to the hub", async () => {
    const adminRouteFavoriteMounts: string[] = [];

    mockAuthContext({
      useAuth: () =>
        createApprovedMemberAuthState({
          id: "user-member",
          name: "Member User",
          email: "member@example.com",
        }),
    });
    mockFavoritesContext(({ children }) => {
      if (globalThis.location.pathname.startsWith("/admin")) {
        adminRouteFavoriteMounts.push(globalThis.location.pathname);
      }

      return <>{children}</>;
    });
    mockLayout();
    mockPage("@/pages/Index.tsx", "Hub page");
    mockPage("@/pages/admin/MembershipReviewsPage.tsx", "Membership reviews page", "h1");

    setPath("/admin/membros-pendentes");
    await renderApp();

    expect(await screen.findByText("Hub page")).toBeInTheDocument();
    expect(screen.queryByText("Membership reviews page")).not.toBeInTheDocument();
    expect(adminRouteFavoriteMounts).toHaveLength(0);
  });

  it("redirects authenticated pending users away from protected routes", async () => {
    const favoritesProviderMock = vi.fn(passthroughProvider);

    mockAuthContext({
      useAuth: () =>
        createPendingAuthState({
          id: "user-3",
          name: "Paula Costa",
          email: "paula@example.com",
        }),
    });
    mockFavoritesContext(
      favoritesProviderMock as unknown as React.ComponentType<ProviderProps>,
    );
    mockPage("@/pages/auth/AwaitingValidation.tsx", "Waiting page");

    setPath("/hub");
    await renderApp();

    expect(await screen.findByText("Waiting page")).toBeInTheDocument();
    expect(favoritesProviderMock).not.toHaveBeenCalled();
  });
});
