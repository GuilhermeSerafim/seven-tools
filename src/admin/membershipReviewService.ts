import api from "@/lib/apiClient";

import type {
  MembershipReviewActionResult,
  MembershipReviewApiRow,
  MembershipReviewUserSummary,
} from "./types";

type MembershipReviewApiResponse = {
  items: MembershipReviewApiRow[];
};

function normalizeReviewItem(item: MembershipReviewApiRow): MembershipReviewUserSummary {
  const { partner_1Name, partner_2Name, ...rest } = item;

  return {
    ...rest,
    partner1Name: partner_1Name,
    partner2Name: partner_2Name,
  };
}

export const membershipReviewService = {
  async listPendingReviews(): Promise<MembershipReviewUserSummary[]> {
    const { data } = await api.get<MembershipReviewApiResponse>("/membership/reviews");
    return data.items.map(normalizeReviewItem);
  },

  async approveReview(
    userId: string,
    payload?: {
      companyId?: string;
      createCompanyFromRequest?: boolean;
    },
  ): Promise<MembershipReviewActionResult> {
    const { data } = await api.post<MembershipReviewActionResult>(
      `/membership/reviews/${encodeURIComponent(userId)}/approve`,
      payload,
    );
    return data;
  },

  async blockReview(userId: string): Promise<MembershipReviewActionResult> {
    const { data } = await api.post<MembershipReviewActionResult>(
      `/membership/reviews/${encodeURIComponent(userId)}/block`,
    );
    return data;
  },
};

export default membershipReviewService;
