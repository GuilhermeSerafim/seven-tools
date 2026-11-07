import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getLeadMock } = vi.hoisted(() => ({
  getLeadMock: vi.fn(),
}));

vi.mock("@/services/leadQualificationService", () => ({
  leadQualificationService: {
    getLead: getLeadMock,
  },
}));

describe("LeadQualificationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the orbital loader while the lead is loading", async () => {
    getLeadMock.mockReturnValue(new Promise(() => undefined));

    const { default: LeadQualificationDetail } = await import("./LeadQualificationDetail");

    render(
      <MemoryRouter initialEntries={["/tools/qualificacao-de-leads/app/lead-1"]}>
        <Routes>
          <Route
            path="/tools/qualificacao-de-leads/app/:leadId"
            element={<LeadQualificationDetail />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const loader = screen.getByRole("status");
    expect(loader).toHaveAttribute("aria-busy", "true");
    expect(loader).toHaveTextContent(/carregando lead/i);
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });

  it("loads the selected lead and renders score, tier, action, and status", async () => {
    getLeadMock.mockResolvedValue({
      id: "lead-1",
      companyId: "company-1",
      createdByUserId: "user-1",
      contactName: "Maria",
      companyName: "Empresa X",
      contactRole: "CEO",
      segment: "Tech",
      companySize: "11-50",
      urgency: "alta",
      timing: "imediato",
      painLevel: "alta",
      notes: "Lead quente",
      status: "novo",
      score: 100,
      tier: "diamond",
      recommendedAction: "abordar_agora",
      scoringSnapshot: {
        matches: { segment: true, companySize: true },
      },
      createdAt: "2026-04-09T00:00:00.000Z",
      updatedAt: "2026-04-09T00:00:00.000Z",
    });

    const { default: LeadQualificationDetail } = await import("./LeadQualificationDetail");

    render(
      <MemoryRouter initialEntries={["/tools/qualificacao-de-leads/app/lead-1"]}>
        <Routes>
          <Route
            path="/tools/qualificacao-de-leads/app/:leadId"
            element={<LeadQualificationDetail />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(getLeadMock).toHaveBeenCalledWith("lead-1"));
    expect(await screen.findByRole("heading", { name: /empresa x/i })).toBeInTheDocument();
    expect(screen.getByText(/maria/i)).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Diamante")).toBeInTheDocument();
    expect(screen.getByText("Abordar agora")).toBeInTheDocument();
    expect(screen.getByText("Novo")).toBeInTheDocument();
  }, 10000);

  it("shows a generic error state when the lead cannot be loaded", async () => {
    getLeadMock.mockRejectedValue(new Error("network"));

    const { default: LeadQualificationDetail } = await import("./LeadQualificationDetail");

    render(
      <MemoryRouter initialEntries={["/tools/qualificacao-de-leads/app/lead-1"]}>
        <Routes>
          <Route
            path="/tools/qualificacao-de-leads/app/:leadId"
            element={<LeadQualificationDetail />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(getLeadMock).toHaveBeenCalledWith("lead-1"));
    expect(
      await screen.findByRole("heading", {
        name: /não foi possível carregar o lead/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tente novamente em instantes/i)).toBeInTheDocument();
  }, 10000);
});
