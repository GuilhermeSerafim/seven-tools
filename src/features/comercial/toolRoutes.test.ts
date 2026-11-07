import { describe, expect, it } from "vitest";
import {
  DIAGNOSTICO_CALONI_TOOL_SLUG,
  LEAD_QUALIFICATION_TOOL_SLUG,
  PROPOSAL_TOOL_SLUG,
  getDiagnosticoCaloniOverviewPath,
  getLeadQualificationAppPath,
  getLeadQualificationConfigPath,
  getLeadQualificationDetailPath,
  getLeadQualificationNewPath,
  getLeadQualificationOverviewPath,
  getProposalAppPath,
  getProposalChatPath,
  getProposalOverviewPath,
  getProposalViewPath,
} from "./toolRoutes";

describe("toolRoutes", () => {
  it("exposes the shared commercial tool slugs and paths", () => {
    expect(PROPOSAL_TOOL_SLUG).toBe("proposta-comercial-smart");
    expect(DIAGNOSTICO_CALONI_TOOL_SLUG).toBe("diagnostico-comercial-caloni");
    expect(LEAD_QUALIFICATION_TOOL_SLUG).toBe("qualificacao-de-leads");
    expect(getProposalOverviewPath()).toBe("/tools/proposta-comercial-smart");
    expect(getProposalAppPath()).toBe("/tools/proposta-comercial-smart/app");
    expect(getProposalChatPath()).toBe("/tools/proposta-comercial-smart/app/chat");
    expect(getProposalChatPath(undefined, "create")).toBe(
      "/tools/proposta-comercial-smart/app/chat?intent=create",
    );
    expect(getProposalViewPath("proposal-7")).toBe("/tools/proposta-comercial-smart/app/proposal-7");
    expect(getDiagnosticoCaloniOverviewPath()).toBe("/tools/diagnostico-comercial-caloni");
    expect(getLeadQualificationOverviewPath()).toBe("/tools/qualificacao-de-leads");
    expect(getLeadQualificationAppPath()).toBe("/tools/qualificacao-de-leads/app");
    expect(getLeadQualificationConfigPath()).toBe("/tools/qualificacao-de-leads/app/config");
    expect(getLeadQualificationNewPath()).toBe("/tools/qualificacao-de-leads/app/new");
    expect(getLeadQualificationDetailPath("lead-7")).toBe("/tools/qualificacao-de-leads/app/lead-7");
  });

  it("encodes proposal chat query params", () => {
    expect(getProposalChatPath("proposal/7?ref=foo&bar=baz", "validate")).toBe(
      "/tools/proposta-comercial-smart/app/chat?proposalId=proposal%2F7%3Fref%3Dfoo%26bar%3Dbaz&intent=validate",
    );
  });
});
