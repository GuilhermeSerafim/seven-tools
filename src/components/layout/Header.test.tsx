import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { createAuthContextValue } from "@/test/createAuthContextValue";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/components/admin/AdminPendingReviewsBell", () => ({
  AdminPendingReviewsBell: () => (
    <button type="button" aria-label="0 revisões pendentes">
      Bell
    </button>
  ),
}));

vi.mock("@/components/ui/UserAvatar", () => ({
  UserAvatar: ({ name }: { name: string }) => <div>{name}</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { Header } from "./Header";

function mockAuth(isAdmin: boolean) {
  useAuthMock.mockReturnValue(createAuthContextValue({ isAdmin }));
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/hub");
  });

  it("renders the desktop admin bell and mobile pending members link for admins", () => {
    mockAuth(true);

    render(
      <MemoryRouter initialEntries={["/hub"]}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "0 revisões pendentes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /revisões pendentes/i })).toHaveAttribute(
      "href",
      "/admin/membros-pendentes",
    );
  });

  it("does not render the admin bell or pending members link for non-admins", () => {
    mockAuth(false);

    render(
      <MemoryRouter initialEntries={["/hub"]}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "0 revisões pendentes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /revisões pendentes/i })).not.toBeInTheDocument();
  });

  it("finds accented tool names even when the query is typed without accents", async () => {
    mockAuth(false);

    render(
      <MemoryRouter initialEntries={["/hub"]}>
        <Header />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(/buscar ferramentas/i);
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: "validacao" } });

    expect(await screen.findByText(/caloni propostas/i)).toBeInTheDocument();
    expect(screen.getByText(/valide propostas comerciais/i)).toBeInTheDocument();
  });
  it("uses the chat-focus chrome on the unified proposal chat", () => {
    mockAuth(false);

    render(
      <MemoryRouter initialEntries={["/tools/proposta-comercial-smart/app/chat"]}>
        <Header />
      </MemoryRouter>,
    );

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-variant", "chat-focus");
    expect(banner.className).toContain("bg-background/95");
    expect(banner.className).toContain("border-border/20");
    expect(screen.getAllByRole("link", { name: "Home" })[0].className).toContain("text-muted-foreground/80");
  });

  it("keeps the default chrome on other tool routes that only share the prefix", () => {
    mockAuth(false);

    render(
      <MemoryRouter initialEntries={["/tools/proposta-comercial-smart/app/chat-extra"]}>
        <Header />
      </MemoryRouter>,
    );

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-variant", "default");
    expect(banner.className).toContain("glass-strong");
  });
});
