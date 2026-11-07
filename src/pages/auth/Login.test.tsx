import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) =>
        ({
          children,
          ...props
        }: Readonly<React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }>) =>
          React.createElement(tag, props, children),
    },
  ),
}));

vi.mock("@/components/ui/background-paths", () => ({
  FloatingPaths: () => null,
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

async function renderLogin() {
  const { default: Login } = await import("./Login");

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe("Login", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows a forgot password link pointing to the recovery request page", async () => {
    await renderLogin();

    const forgotPasswordLink = screen.getByRole("link", {
      name: /esqueci minha senha/i,
    });

    expect(forgotPasswordLink).toHaveAttribute("href", "/esqueci-senha");
  });
});
