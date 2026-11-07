import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLeadQualificationConfig } from "@/features/comercial/leadQualificationDefaults";
import { getLeadQualificationDetailPath } from "@/features/comercial/toolRoutes";

const { createLeadMock, getConfigMock, navigateMock } = vi.hoisted(() => ({
  createLeadMock: vi.fn(),
  getConfigMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/services/leadQualificationService", () => ({
  leadQualificationService: {
    createLead: createLeadMock,
    getConfig: getConfigMock,
  },
}));

describe("LeadQualificationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the orbital loader while the config is loading", async () => {
    getConfigMock.mockReturnValue(new Promise(() => undefined));

    const { default: LeadQualificationForm } = await import("./LeadQualificationForm");

    render(
      <MemoryRouter>
        <LeadQualificationForm />
      </MemoryRouter>,
    );

    const loader = screen.getByRole("status");
    expect(loader).toHaveAttribute("aria-busy", "true");
    expect(loader).toHaveTextContent(/carregando configuração/i);
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });

  it("blocks manual lead creation until the company config exists", async () => {
    getConfigMock.mockResolvedValue(null);

    const { default: LeadQualificationForm } = await import("./LeadQualificationForm");

    render(
      <MemoryRouter>
        <LeadQualificationForm />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /configure o método da empresa antes de cadastrar leads/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/defina o icp, pesos, faixas e ações/i)).toBeInTheDocument();
    expect(createLeadMock).not.toHaveBeenCalled();
  }, 10000);

  it("keeps the save action disabled until all required fields are filled", async () => {
    getConfigMock.mockResolvedValue(
      createLeadQualificationConfig({
        idealRoles: ["CEO"],
      }),
    );
    const { default: LeadQualificationForm } = await import("./LeadQualificationForm");

    render(
      <MemoryRouter>
        <LeadQualificationForm />
      </MemoryRouter>,
    );

    await screen.findByDisplayValue("Tech");
    expect(screen.getByRole("button", { name: /salvar lead/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/nome da empresa/i), { target: { value: "Empresa X" } });
    fireEvent.change(screen.getByLabelText(/nome do contato/i), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText(/cargo do contato/i), { target: { value: "CEO" } });
    fireEvent.change(screen.getByLabelText(/segmento/i), { target: { value: "Tech" } });
    fireEvent.change(screen.getByLabelText(/porte da empresa/i), { target: { value: "11-50" } });
    fireEvent.change(screen.getByLabelText(/urgência/i), { target: { value: "alta" } });
    fireEvent.change(screen.getByLabelText(/timing/i), { target: { value: "imediato" } });
    fireEvent.change(screen.getByLabelText(/nível de dor/i), { target: { value: "alta" } });

    expect(screen.getByRole("button", { name: /salvar lead/i })).toBeEnabled();
  }, 10000);

  it("submits the manual lead form and opens the created lead detail", async () => {
    getConfigMock.mockResolvedValue(
      createLeadQualificationConfig({
        idealRoles: ["CEO"],
      }),
    );
    createLeadMock.mockResolvedValue({ id: "lead-1" });

    const { default: LeadQualificationForm } = await import("./LeadQualificationForm");

    render(
      <MemoryRouter>
        <LeadQualificationForm />
      </MemoryRouter>,
    );

    await screen.findByDisplayValue("Tech");
    fireEvent.change(screen.getByLabelText(/nome da empresa/i), { target: { value: "Empresa X" } });
    fireEvent.change(screen.getByLabelText(/nome do contato/i), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText(/cargo do contato/i), { target: { value: "CEO" } });
    fireEvent.change(screen.getByLabelText(/segmento/i), { target: { value: "Tech" } });
    fireEvent.change(screen.getByLabelText(/porte da empresa/i), { target: { value: "11-50" } });
    fireEvent.change(screen.getByLabelText(/urgência/i), { target: { value: "alta" } });
    fireEvent.change(screen.getByLabelText(/timing/i), { target: { value: "imediato" } });
    fireEvent.change(screen.getByLabelText(/nível de dor/i), { target: { value: "alta" } });
    fireEvent.change(screen.getByLabelText(/observações/i), { target: { value: "Lead quente" } });

    fireEvent.click(screen.getByRole("button", { name: /salvar lead/i }));

    await waitFor(() =>
      expect(createLeadMock).toHaveBeenCalledWith({
        companyName: "Empresa X",
        contactName: "Maria",
        contactRole: "CEO",
        segment: "Tech",
        companySize: "11-50",
        urgency: "alta",
        timing: "imediato",
        painLevel: "alta",
        notes: "Lead quente",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith(getLeadQualificationDetailPath("lead-1"));
  }, 10000);
});
