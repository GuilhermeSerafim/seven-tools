import { describe, expect, it } from "vitest";
import { getLatestProposal, getProposalSortTimestamp } from "./proposalRecency";
import type { Proposal } from "@/services/proposalService";

function createProposal(overrides: Partial<Proposal>): Proposal {
  return {
    id: "proposal-1",
    userId: "user-1",
    title: "Proposta",
    clientName: "Cliente",
    clientCompany: "Empresa",
    clientEmail: "cliente@test.com",
    clientPhone: "5511999999999",
    projectDescription: "Descricao",
    scope: "Escopo",
    value: "10000",
    deadline: "2026-04-09",
    notes: "",
    status: "draft",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("proposalRecency", () => {
  it("sorts by the newest createdAt or updatedAt timestamp", () => {
    const latest = createProposal({
      id: "proposal-new",
      createdAt: "2026-04-03T00:00:00.000Z",
      updatedAt: "2026-04-05T00:00:00.000Z",
    });

    expect(
      getLatestProposal([
        createProposal({
          id: "proposal-old",
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-02T00:00:00.000Z",
        }),
        latest,
      ]),
    ).toEqual(latest);
  });

  it("treats invalid timestamps as older values", () => {
    const proposal = createProposal({
      id: "proposal-valid",
      updatedAt: "2026-04-02T00:00:00.000Z",
    });

    expect(
      getProposalSortTimestamp(
        createProposal({
          id: "proposal-invalid",
          createdAt: "invalid",
          updatedAt: "invalid",
        }),
      ),
    ).toBe(0);
    expect(
      getLatestProposal([
        createProposal({
          id: "proposal-invalid",
          createdAt: "invalid",
          updatedAt: "invalid",
        }),
        proposal,
      ]),
    ).toEqual(proposal);
  });
});
