import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLeadQualificationConfig } from "@/features/comercial/leadQualificationDefaults";

const { getConfigMock, upsertConfigMock } = vi.hoisted(() => ({
  getConfigMock: vi.fn(),
  upsertConfigMock: vi.fn(),
}));

vi.mock("@/services/leadQualificationService", () => ({
  leadQualificationService: {
    getConfig: getConfigMock,
    upsertConfig: upsertConfigMock,
  },
}));

describe("LeadQualificationConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the current configuration and saves updated score rules", async () => {
    getConfigMock.mockResolvedValue(
      createLeadQualificationConfig({
        idealSegments: ["Tech", "SaaS"],
      }),
    );
    upsertConfigMock.mockResolvedValue(
      createLeadQualificationConfig({
        idealSegments: ["Tech", "SaaS"],
        weightSegment: 24,
      }),
    );

    const { default: LeadQualificationConfig } = await import("./LeadQualificationConfig");

    render(
      <MemoryRouter>
        <LeadQualificationConfig />
      </MemoryRouter>,
    );

    expect(await screen.findByDisplayValue("Tech, SaaS")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/peso do segmento/i), {
      target: { value: "24" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar configuração/i }));

    await waitFor(() =>
      expect(upsertConfigMock).toHaveBeenCalledWith(
        expect.objectContaining({
          idealSegments: ["Tech", "SaaS"],
          weightSegment: 24,
          goldAction: "abordar_agora",
        }),
      ),
    );
    expect(await screen.findByText(/configuração salva/i)).toBeInTheDocument();
  }, 10000);
});
