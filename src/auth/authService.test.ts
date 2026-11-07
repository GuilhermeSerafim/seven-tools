import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiPostMock, clearStoredTokenMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
  clearStoredTokenMock: vi.fn(),
}));

vi.mock("../lib/apiClient", () => ({
  default: {
    post: apiPostMock,
    get: vi.fn(),
    put: vi.fn(),
  },
  clearStoredToken: clearStoredTokenMock,
  getStoredToken: vi.fn(),
  setStoredToken: vi.fn(),
}));

import authService from "./authService";

describe("authService password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests password reset instructions", async () => {
    apiPostMock.mockResolvedValue({ data: { detail: "ok" } });

    const result = await authService.requestPasswordReset("maria@example.com");

    expect(result).toEqual({ success: true });
    expect(apiPostMock).toHaveBeenCalledWith("/auth/password-reset/request", {
      email: "maria@example.com",
    });
  });

  it("confirms password reset with token and new password", async () => {
    apiPostMock.mockResolvedValue({ data: { detail: "ok" } });

    const result = await authService.confirmPasswordReset("token-123", "new-secret");

    expect(result).toEqual({ success: true });
    expect(apiPostMock).toHaveBeenCalledWith("/auth/password-reset/confirm", {
      token: "token-123",
      newPassword: "new-secret",
    });
  });

  it("clears the local session without calling the logout endpoint", () => {
    authService.clearLocalSession();

    expect(clearStoredTokenMock).toHaveBeenCalledTimes(1);
    expect(apiPostMock).not.toHaveBeenCalled();
  });
});
