import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requestPasswordResetMock } = vi.hoisted(() => ({
  requestPasswordResetMock: vi.fn(),
}));

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

vi.mock("@/auth/authService", () => ({
  default: {
    requestPasswordReset: requestPasswordResetMock,
  },
}));

async function renderForgotPassword() {
  const { default: ForgotPassword } = await import("./ForgotPassword");

  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>,
  );
}

function submitForgotPasswordForm() {
  const submitButton = screen.getByRole("button", { name: /enviar instruções/i });
  const form = submitButton.closest("form");

  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Expected forgot password submit button to be inside a form.");
  }

  fireEvent.submit(form);
}

describe("ForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestPasswordResetMock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
  });

  it("requests a password reset and shows a safe generic confirmation", async () => {
    await renderForgotPassword();

    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "maria@example.com" },
    });
    submitForgotPasswordForm();

    await waitFor(() => {
      expect(requestPasswordResetMock).toHaveBeenCalledWith("maria@example.com");
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Se este e-mail estiver cadastrado, enviaremos instruções para redefinir sua senha.",
    );
    expect(screen.getByRole("link", { name: /voltar para login/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows a generic error and does not show confirmation when the request fails", async () => {
    requestPasswordResetMock.mockResolvedValue({ success: false });

    await renderForgotPassword();

    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "maria@example.com" },
    });
    submitForgotPasswordForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível enviar as instruções agora. Tente novamente.",
    );
    expect(
      screen.queryByText(
        "Se este e-mail estiver cadastrado, enviaremos instruções para redefinir sua senha.",
      ),
    ).not.toBeInTheDocument();
  });

  it("associates email validation errors with the input", async () => {
    await renderForgotPassword();

    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "email-invalido" },
    });
    submitForgotPasswordForm();

    const emailError = await screen.findByText("Informe um e-mail válido");

    expect(screen.getByLabelText(/^e-mail$/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^e-mail$/i)).toHaveAttribute(
      "aria-describedby",
      emailError.id,
    );
  });
});
