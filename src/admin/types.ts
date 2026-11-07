export interface MembershipReviewUserSummary {
  user: {
    id: string;
    name: string;
    email: string;
    validationStatus: string;
    companyId: string | null;
  };
  selectedCompanyName: string | null;
  contactEmail: string | null;
  partner1Name: string | null;
  partner2Name: string | null;
  hasContract: boolean;
  requestedCompanyName: string | null;
  requestedCnpj: string | null;
}

export interface MembershipReviewApiRow
  extends Omit<MembershipReviewUserSummary, "partner1Name" | "partner2Name"> {
  partner_1Name: string | null;
  partner_2Name: string | null;
}

export type MembershipReviewRow = MembershipReviewUserSummary;

export interface MembershipReviewActionResult {
  user: {
    id: string;
    validationStatus: string;
    approvalSource: string | null;
    approvedAt: string | null;
    approvedByUserId: string | null;
    companyId: string | null;
  };
  company: {
    id: string;
    name: string;
    cnpj: string | null;
  } | null;
}
