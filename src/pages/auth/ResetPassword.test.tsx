import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { confirmPasswordResetMock, clearLocalSessionMock } = vi.hoisted(() => ({
  confirmPasswordResetMock: vi.fn(),
  clearLocalSessionMock: vi.fn(),
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
    confirmPasswordReset: confirmPasswordResetMock,
    clearLocalSession: clearLocalSessionMock,
  },
}));

const RESET_TOKEN = "reset-token-with-enough-entropy-123456789";

async function renderResetPassword(path = `/redefinir-senha?token=${RESET_TOKEN}`) {
  const { default: ResetPassword } = await import("./ResetPassword");

  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ResetPassword />
    </MemoryRouter>,
  );
}

function fillPasswordResetForm(password: string, confirmation = password) {
  fireEvent.change(screen.getByLabelText(/^nova senha$/i), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText(/^confirmar nova senha$/i), {
    target: { value: confirmation },
  });
}

function submitPasswordResetForm() {
  const submitButton = screen.getByRole("button", { name: /redefinir senha/i });
  const form = submitButton.closest("form");

  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Expected reset password submit button to be inside a form.");
  }

  fireEvent.submit(form);
}

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmPasswordResetMock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a safe invalid or expired link state when the token is missing", async () => {
    await renderResetPassword("/redefinir-senha");

    expect(screen.getByRole("alert")).toHaveTextContent("Link inválido ou expirado.");
    expect(screen.getByRole("link", { name: /solicitar novo link/i })).toHaveAttribute(
      "href",
      "/esqueci-senha",
    );
    expect(screen.queryByLabelText(/^nova senha$/i)).not.toBeInTheDocument();
  });

  it("confirms the password reset with the token and shows success", async () => {
    await renderResetPassword();

    fillPasswordResetForm("novaSenha");
    submitPasswordResetForm();

    await waitFor(() => {
      expect(confirmPasswordResetMock).toHaveBeenCalledWith(RESET_TOKEN, "novaSenha");
    });

    expect(clearLocalSessionMock).toHaveBeenCalledTimes(1);
    expect(clearLocalSessionMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      confirmPasswordResetMock.mock.invocationCallOrder[0],
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Senha redefinida com sucesso.",
    );
    expect(screen.getByRole("link", { name: /entrar/i })).toHaveAttribute("href", "/login");
  });

  it("shows a generic error and does not show success when the service fails", async () => {
    confirmPasswordResetMock.mockResolvedValue({ success: false, error: "Token expirado" });

    await renderResetPassword();

    fillPasswordResetForm("novaSenha");
    submitPasswordResetForm();

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent(
      "Não foi possível redefinir sua senha. Solicite um novo link.",
    );
    expect(alert).not.toHaveTextContent("Token expirado");
    expect(screen.queryByText("Senha redefinida com sucesso.")).not.toBeInTheDocument();
    expect(clearLocalSessionMock).not.toHaveBeenCalled();
  });

  it("validates the minimum password length", async () => {
    await renderResetPassword();

    fillPasswordResetForm("123");
    submitPasswordResetForm();

    const passwordError = await screen.findByText(
      "A nova senha deve ter pelo menos 6 caracteres",
    );
    const passwordInput = screen.getByLabelText(/^nova senha$/i);

    expect(passwordError).toBeInTheDocument();
    expect(passwordError).toHaveAttribute("id", "newPassword-error");
    expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-describedby", passwordError.id);
    expect(confirmPasswordResetMock).not.toHaveBeenCalled();
  });

  it("validates matching password confirmation", async () => {
    await renderResetPassword();

    fillPasswordResetForm("novaSenha", "outraSenha");
    submitPasswordResetForm();

    const confirmationError = await screen.findByText("As senhas não coincidem");
    const confirmationInput = screen.getByLabelText(/^confirmar nova senha$/i);

    expect(confirmationError).toBeInTheDocument();
    expect(confirmationError).toHaveAttribute("id", "confirmPassword-error");
    expect(confirmationInput).toHaveAttribute("aria-invalid", "true");
    expect(confirmationInput).toHaveAttribute("aria-describedby", confirmationError.id);
    expect(confirmPasswordResetMock).not.toHaveBeenCalled();
  });
});
