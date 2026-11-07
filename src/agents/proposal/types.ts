import type { ProposalDraft } from './useProposalDraft';

export type ProposalToolResult =
  | { kind: 'proposal_draft_patch'; patch: Partial<ProposalDraft>; missing_required: string[] }
  | { kind: 'proposal_validation_report'; report: unknown; proposal_id: string }
  | { kind: 'proposal_save_request'; draft_summary: ProposalDraft }
  | { kind: 'proposal_update_request'; proposal_id: string; patch: Partial<ProposalDraft> }
  | { kind: 'proposal_open_existing'; proposal_id: string };

export interface ProposalAssistantResponse {
  reply: string;
  tool_result: ProposalToolResult | null;
}
