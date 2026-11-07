import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MembershipReviewsPage from "./MembershipReviewsPage";
import { createDeferred } from "@/test/createDeferred";

const { approveReviewMock, blockReviewMock, listPendingReviewsMock, toastErrorMock, toastSuccessMock } =
  vi.hoisted(() => ({
    approveReviewMock: vi.fn(),
    blockReviewMock: vi.fn(),
    listPendingReviewsMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
  }));

vi.mock("@/admin/membershipReviewService", () => ({
  membershipReviewService: {
    listPendingReviews: listPendingReviewsMock,
    approveReview: approveReviewMock,
    blockReview: blockReviewMock,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

const existingCompanyReview = {
  user: {
    id: "user-existing",
    name: "Maria Silva",
    email: "maria@example.com",
    validationStatus: "pending_review",
    companyId: "company-1",
  },
  selectedCompanyName: "Alpha LTDA",
  contactEmail: "contato@alpha.com",
  partner1Name: "Maria Silva",
  partner2Name: "Joao Silva",
  hasContract: true,
  requestedCompanyName: null,
  requestedCnpj: null,
};

const secondExistingCompanyReview = {
  user: {
    id: "user-existing-2",
    name: "Carlos Lima",
    email: "carlos@example.com",
    validationStatus: "pending_review",
    companyId: "company-2",
  },
  selectedCompanyName: "Beta LTDA",
  contactEmail: "contato@beta.com",
  partner1Name: "Carlos Lima",
  partner2Name: null,
  hasContract: false,
  requestedCompanyName: null,
  requestedCnpj: null,
};

const otherCompanyReview = {
  user: {
    id: "user-other",
    name: "Paula Souza",
    email: "paula@example.com",
    validationStatus: "pending_review",
    companyId: null,
  },
  selectedCompanyName: null,
  contactEmail: null,
  partner1Name: null,
  partner2Name: null,
  hasContract: false,
  requestedCompanyName: "Nova Empresa",
  requestedCnpj: "12.345.678/0001-90",
};

function createReviewMutationResult({
  userId,
  companyId,
  companyName,
  validationStatus = "approved",
  cnpj = null,
}: Readonly<{
  userId: string;
  companyId: string;
  companyName: string;
  validationStatus?: "approved" | "blocked";
  cnpj?: string | null;
}>) {
  return {
    user: {
      id: userId,
      validationStatus,
      approvalSource: "manual" as const,
      approvedAt: "2026-04-13T12:00:00.000Z",
      approvedByUserId: "admin-1",
      companyId,
    },
    company: {
      id: companyId,
      name: companyName,
      cnpj,
    },
  };
}

const approvedExistingReviewResult = createReviewMutationResult({
  userId: "user-existing",
  companyId: "company-1",
  companyName: "Alpha LTDA",
});

const approvedSecondExistingReviewResult = createReviewMutationResult({
  userId: "user-existing-2",
  companyId: "company-2",
  companyName: "Beta LTDA",
});

const approvedOtherReviewResult = createReviewMutationResult({
  userId: "user-other",
  companyId: "company-2",
  companyName: "Nova Empresa",
  cnpj: "12.345.678/0001-90",
});

const blockedExistingReviewResult = createReviewMutationResult({
  userId: "user-existing",
  companyId: "company-1",
  companyName: "Alpha LTDA",
  validationStatus: "blocked",
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MembershipReviewsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { invalidateQueriesSpy };
}

describe("MembershipReviewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders existing-company and other-company review cards", async () => {
    listPendingReviewsMock.mockResolvedValue([existingCompanyReview, otherCompanyReview]);

    renderPage();

    expect(
      await screen.findByRole("heading", { name: /revisão de membros pendentes/i }),
    ).toBeInTheDocument();

    const existingCard = await screen.findByRole("article", { name: /maria silva/i });
    const otherCard = await screen.findByRole("article", { name: /paula souza/i });

    expect(within(existingCard).getByText("Alpha LTDA")).toBeInTheDocument();
    expect(within(existingCard).queryByText(/empresa existente/i)).not.toBeInTheDocument();
    expect(within(otherCard).getByText("Nova Empresa")).toBeInTheDocument();
    expect(within(otherCard).queryByText(/solicitacao de outra empresa/i)).not.toBeInTheDocument();
    expect(within(otherCard).getByText("12.345.678/0001-90")).toBeInTheDocument();
    expect(screen.queryByText(/com contrato/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sem contrato/i)).not.toBeInTheDocument();
  });

  it("renders the orbital loader while pending reviews are loading", async () => {
    const pendingReviews = createDeferred<Array<typeof existingCompanyReview>>();
    listPendingReviewsMock.mockReturnValueOnce(pendingReviews.promise);

    renderPage();

    await waitFor(() => expect(listPendingReviewsMock).toHaveBeenCalledTimes(1));

    const loader = screen.getByRole("status");
    expect(loader).toHaveAttribute("aria-busy", "true");
    expect(loader).toHaveTextContent(/carregando revisões pendentes/i);
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
  });

  it("approves an existing-company pending review", async () => {
    listPendingReviewsMock.mockResolvedValue([existingCompanyReview]);
    const pendingApprove = createDeferred<typeof approvedExistingReviewResult>();
    approveReviewMock.mockReturnValueOnce(pendingApprove.promise);

    const { invalidateQueriesSpy } = renderPage();

    const card = await screen.findByRole("article", { name: /maria silva/i });
    await waitFor(() => expect(listPendingReviewsMock).toHaveBeenCalledTimes(1));

    await screen.findByRole("button", { name: /aprovar/i });
    fireEvent.click(within(card).getByRole("button", { name: /aprovar/i }));

    await waitFor(() =>
      expect(approveReviewMock).toHaveBeenCalledWith("user-existing", {}),
    );
    const approveButton = within(card).getByRole("button", { name: /aprovar/i });
    const blockButton = within(card).getByRole("button", { name: /bloquear/i });
    await waitFor(() => expect(approveButton).toBeDisabled());
    expect(approveButton.querySelector("svg.animate-spin")).toBeTruthy();
    expect(blockButton).toBeDisabled();
    expect(blockButton.querySelector("svg.animate-spin")).toBeNull();

    pendingApprove.resolve(approvedExistingReviewResult);

    await waitFor(() =>
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["membership-reviews"] }),
    );
  });

  it.each([
    {
      actionLabel: "aprovar",
      actionError: "Não foi possível aprovar a revisão.",
      actionMock: approveReviewMock,
      triggerLabel: "aprovar",
      triggerArgs: ["user-existing", {}],
    },
    {
      actionLabel: "bloquear",
      actionError: "Não foi possível bloquear a revisão.",
      actionMock: blockReviewMock,
      triggerLabel: "bloquear",
      triggerArgs: ["user-existing"],
    },
  ])(
    "invalidates the membership review cache when %s fails",
    async ({ actionMock, actionError, triggerLabel, triggerArgs }) => {
      listPendingReviewsMock.mockResolvedValue([existingCompanyReview]);
      actionMock.mockRejectedValueOnce(new Error("conflict"));

      const { invalidateQueriesSpy } = renderPage();

      const card = await screen.findByRole("article", { name: /maria silva/i });
      const actionButton = within(card).getByRole("button", {
        name: new RegExp(triggerLabel, "i"),
      });

      fireEvent.click(actionButton);

      await waitFor(() => expect(actionMock).toHaveBeenCalledWith(...triggerArgs));
      await waitFor(() =>
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["membership-reviews"] }),
      );
      await waitFor(() => expect(actionButton).toBeEnabled());
      expect(toastErrorMock).toHaveBeenCalledWith(actionError);
    },
  );

  it("creates the company and approves when the item came from Other", async () => {
    listPendingReviewsMock.mockResolvedValue([otherCompanyReview]);
    approveReviewMock.mockResolvedValue(approvedOtherReviewResult);

    renderPage();

    const card = await screen.findByRole("article", { name: /paula souza/i });
    fireEvent.click(within(card).getByRole("button", { name: /criar empresa e aprovar/i }));

    await waitFor(() =>
      expect(approveReviewMock).toHaveBeenCalledWith("user-other", {
        createCompanyFromRequest: true,
      }),
    );
  });

  it("keeps unrelated rows actionable while one review is pending", async () => {
    const pendingApproveA = createDeferred<typeof approvedExistingReviewResult>();
    const pendingApproveB = createDeferred<typeof approvedSecondExistingReviewResult>();

    listPendingReviewsMock.mockResolvedValue([
      existingCompanyReview,
      secondExistingCompanyReview,
      otherCompanyReview,
    ]);
    approveReviewMock.mockReturnValueOnce(pendingApproveA.promise);
    approveReviewMock.mockReturnValueOnce(pendingApproveB.promise);

    renderPage();

    const existingCard = await screen.findByRole("article", { name: /maria silva/i });
    const secondExistingCard = await screen.findByRole("article", { name: /carlos lima/i });
    const otherCard = await screen.findByRole("article", { name: /paula souza/i });

    const existingApproveButton = within(existingCard).getByRole("button", { name: /aprovar/i });
    const secondApproveButton = within(secondExistingCard).getByRole("button", { name: /aprovar/i });
    const otherBlockButton = within(otherCard).getByRole("button", { name: /bloquear/i });
    const otherApproveButton = within(otherCard).getByRole("button", {
      name: /criar empresa e aprovar/i,
    });

    fireEvent.click(existingApproveButton);

    await waitFor(() => expect(existingApproveButton).toBeDisabled());
    expect(otherApproveButton).toBeEnabled();
    expect(otherBlockButton).toBeEnabled();
    expect(secondApproveButton).toBeEnabled();

    fireEvent.click(secondApproveButton);

    await waitFor(() => expect(secondApproveButton).toBeDisabled());
    expect(existingApproveButton).toBeDisabled();
    expect(otherApproveButton).toBeEnabled();
    expect(otherBlockButton).toBeEnabled();

    expect(blockReviewMock).not.toHaveBeenCalled();

    pendingApproveA.resolve(approvedExistingReviewResult);
    pendingApproveB.resolve(approvedSecondExistingReviewResult);

    await waitFor(() => expect(approveReviewMock).toHaveBeenCalledTimes(2));
  });

  it("blocks a pending review", async () => {
    listPendingReviewsMock.mockResolvedValue([existingCompanyReview]);
    blockReviewMock.mockResolvedValue(blockedExistingReviewResult);

    renderPage();

    const card = await screen.findByRole("article", { name: /maria silva/i });
    fireEvent.click(within(card).getByRole("button", { name: /bloquear/i }));

    await waitFor(() => expect(blockReviewMock).toHaveBeenCalledWith("user-existing"));
  });
});
