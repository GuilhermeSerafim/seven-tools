import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGetMock, apiPostMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: apiGetMock,
    post: apiPostMock,
  },
}));

import { membershipReviewService } from "./membershipReviewService";

describe("membershipReviewService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unwraps items when listing pending reviews", async () => {
    apiGetMock.mockResolvedValue({
      data: {
        items: [
          {
            user: {
              id: "user-1",
              name: "Maria Silva",
              email: "maria@example.com",
              validationStatus: "pending_review",
              companyId: null,
            },
            selectedCompanyName: "Alpha",
            contactEmail: "maria@example.com",
            partner_1Name: "Maria Silva",
            partner_2Name: "Joao Silva",
            hasContract: false,
            requestedCompanyName: "Alpha LTDA",
            requestedCnpj: "00000000000100",
          },
        ],
      },
    });

    const reviews = await membershipReviewService.listPendingReviews();
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({
      partner1Name: "Maria Silva",
      partner2Name: "Joao Silva",
    });
    expect(apiGetMock).toHaveBeenCalledWith("/membership/reviews");
  });

  it("posts the optional payload when approving a review", async () => {
    apiPostMock.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          validationStatus: "approved",
          approvalSource: "manual",
          approvedAt: "2026-04-13T12:00:00.000Z",
          approvedByUserId: "admin-1",
          companyId: "company-1",
        },
        company: {
          id: "company-1",
          name: "Alpha LTDA",
          cnpj: "00000000000100",
        },
      },
    });

    await membershipReviewService.approveReview("user-1", {
      companyId: "company-1",
      createCompanyFromRequest: false,
    });

    expect(apiPostMock).toHaveBeenCalledWith("/membership/reviews/user-1/approve", {
      companyId: "company-1",
      createCompanyFromRequest: false,
    });
  });

  it("sends no request body when blocking a review", async () => {
    apiPostMock.mockResolvedValue({
      data: {
        user: {
          id: "user-2",
          validationStatus: "blocked",
          approvalSource: null,
          approvedAt: null,
          approvedByUserId: null,
          companyId: null,
        },
        company: null,
      },
    });

    await membershipReviewService.blockReview("user-2");

    expect(apiPostMock).toHaveBeenCalledWith("/membership/reviews/user-2/block");
  });
});
