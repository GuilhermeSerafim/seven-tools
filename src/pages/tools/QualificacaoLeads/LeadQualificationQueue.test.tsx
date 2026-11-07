import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLeadQualificationConfig } from "@/features/comercial/leadQualificationDefaults";

const { getConfigMock, listLeadsMock } = vi.hoisted(() => ({
  getConfigMock: vi.fn(),
  listLeadsMock: vi.fn(),
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

vi.mock("@/services/leadQualificationService", () => ({
  leadQualificationService: {
    getConfig: getConfigMock,
    listLeads: listLeadsMock,
  },
}));

describe("LeadQualificationQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the orbital loader while the queue config is loading", async () => {
    getConfigMock.mockReturnValue(new Promise(() => undefined));

    const { default: LeadQualificationQueue } = await import("./LeadQualificationQueue");

    render(
      <MemoryRouter>
        <LeadQualificationQueue />
      </MemoryRouter>,
    );

    const loader = screen.getByRole("status");
    expect(loader).toHaveAttribute("aria-busy", "true");
    expect(loader).toHaveTextContent(/carregando fila/i);
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });

  it("renders the config-first state when the company method is not configured yet", async () => {
    getConfigMock.mockResolvedValue(null);
    listLeadsMock.mockResolvedValue({ items: [], total: 0, page: 1, perPage: 100 });

    const { default: LeadQualificationQueue } = await import("./LeadQualificationQueue");

    render(
      <MemoryRouter>
        <LeadQualificationQueue />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /configure o método da empresa antes de classificar leads/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/defina icp, pesos, faixas e ações para liberar a fila compartilhada/i),
    ).toBeInTheDocument();
    await waitFor(() => expect(getConfigMock).toHaveBeenCalledTimes(1));
    expect(listLeadsMock).not.toHaveBeenCalled();
  }, 10000);

  it("shows a generic loading error when the queue cannot be loaded", async () => {
    getConfigMock.mockRejectedValue(new Error("network"));
    listLeadsMock.mockResolvedValue({ items: [], total: 0, page: 1, perPage: 100 });

    const { default: LeadQualificationQueue } = await import("./LeadQualificationQueue");

    render(
      <MemoryRouter>
        <LeadQualificationQueue />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /não foi possível carregar a fila comercial/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tente novamente em instantes/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: /configure o método da empresa antes de classificar leads/i,
      }),
    ).not.toBeInTheDocument();
  }, 10000);

  it("renders grouped lead cards when the company already has an active method", async () => {
    getConfigMock.mockResolvedValue(createLeadQualificationConfig());
    listLeadsMock.mockResolvedValue({
      items: [
        {
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
          notes: "Fit alto",
          status: "novo",
          score: 100,
          tier: "diamond",
          recommendedAction: "abordar_agora",
          scoringSnapshot: { matches: { segment: true } },
          createdAt: "2026-04-09T00:00:00.000Z",
          updatedAt: "2026-04-09T00:00:00.000Z",
        },
      ],
      total: 150,
      page: 1,
      perPage: 100,
    });

    const { default: LeadQualificationQueue } = await import("./LeadQualificationQueue");

    render(
      <MemoryRouter>
        <LeadQualificationQueue />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /prioridade imediata/i })).toBeInTheDocument();
    expect(screen.getByText("Empresa X")).toBeInTheDocument();
    expect(screen.getByText(/Maria/i)).toBeInTheDocument();
    expect(screen.getByText("Diamante")).toBeInTheDocument();
    expect(screen.getByText("100/100")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText(/mostrando 1 de 150 leads/i)).toBeInTheDocument();
    await waitFor(() => expect(listLeadsMock).toHaveBeenCalledTimes(1));
  }, 10000);
});
