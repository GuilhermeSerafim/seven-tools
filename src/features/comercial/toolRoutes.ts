export const PROPOSAL_TOOL_SLUG = "proposta-comercial-smart";
export const DIAGNOSTICO_CALONI_TOOL_SLUG = "diagnostico-comercial-caloni";
export const LEAD_QUALIFICATION_TOOL_SLUG = "qualificacao-de-leads";

export function getProposalOverviewPath() {
  return `/tools/${PROPOSAL_TOOL_SLUG}`;
}

export function getProposalAppPath() {
  return `/tools/${PROPOSAL_TOOL_SLUG}/app`;
}

export function getProposalChatPath(
  proposalId?: string,
  intent?: "create" | "validate" | "edit",
) {
  const params = new URLSearchParams();

  if (proposalId) {
    params.set("proposalId", proposalId);
  }

  if (intent) {
    params.set("intent", intent);
  }

  const query = params.toString();
  return `${getProposalAppPath()}/chat${query ? `?${query}` : ""}`;
}

export function getProposalViewPath(proposalId: string) {
  return `${getProposalAppPath()}/${proposalId}`;
}

export function getDiagnosticoCaloniOverviewPath() {
  return `/tools/${DIAGNOSTICO_CALONI_TOOL_SLUG}`;
}

export function getLeadQualificationOverviewPath() {
  return `/tools/${LEAD_QUALIFICATION_TOOL_SLUG}`;
}

export function getLeadQualificationAppPath() {
  return `${getLeadQualificationOverviewPath()}/app`;
}

export function getLeadQualificationConfigPath() {
  return `${getLeadQualificationAppPath()}/config`;
}

export function getLeadQualificationNewPath() {
  return `${getLeadQualificationAppPath()}/new`;
}

export function getLeadQualificationDetailPath(leadId: string) {
  return `${getLeadQualificationAppPath()}/${leadId}`;
}
