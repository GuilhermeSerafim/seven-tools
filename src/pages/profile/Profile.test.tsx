import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

import { createAuthContextValue } from "@/test/createAuthContextValue";

const { motionProxy, useAuthMock } = vi.hoisted(() => ({
  motionProxy: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
          React.createElement(tag, props, children),
    },
  ),
  useAuthMock: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: motionProxy,
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: useAuthMock,
}));

import Profile from "./Profile";

function mockAuth(isAdmin: boolean) {
  useAuthMock.mockReturnValue(createAuthContextValue({ isAdmin }));
}

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/profile");
  });

  it("renders the admin CTA to review pending members", () => {
    mockAuth(true);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(screen.getByText(/administração/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /revisar membros pendentes/i })).toHaveAttribute(
      "href",
      "/admin/membros-pendentes",
    );
  });
});
