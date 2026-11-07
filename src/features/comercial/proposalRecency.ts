import type { Proposal } from "@/services/proposalService";

export function getProposalSortTimestamp(proposal: Proposal) {
  const createdAt = Date.parse(proposal.createdAt);
  const updatedAt = Date.parse(proposal.updatedAt);

  return Math.max(
    Number.isNaN(createdAt) ? 0 : createdAt,
    Number.isNaN(updatedAt) ? 0 : updatedAt,
  );
}

export function getLatestProposal(proposals: Proposal[]) {
  return proposals.reduce<Proposal | null>((latest, proposal) => {
    if (!latest) {
      return proposal;
    }

    return getProposalSortTimestamp(proposal) > getProposalSortTimestamp(latest)
      ? proposal
      : latest;
  }, null);
}
