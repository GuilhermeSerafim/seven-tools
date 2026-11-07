import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminPendingReviewsBell } from "./AdminPendingReviewsBell";

const { listPendingReviewsMock, useAuthMock } = vi.hoisted(() => ({
  listPendingReviewsMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/admin/membershipReviewService", () => ({
  membershipReviewService: {
    listPendingReviews: listPendingReviewsMock,
    approveReview: vi.fn(),
    blockReview: vi.fn(),
  },
}));

function createPendingReview({
  id,
  name,
  email,
  selectedCompanyName,
  contactEmail = email,
  partner1Name,
  partner2Name,
  hasContract = false,
  requestedCompanyName = null,
  requestedCnpj = null,
}: Readonly<{
  id: string;
  name: string;
  email: string;
  selectedCompanyName: string | null;
  contactEmail?: string | null;
  partner1Name: string | null;
  partner2Name: string | null;
  hasContract?: boolean;
  requestedCompanyName?: string | null;
  requestedCnpj?: string | null;
}>) {
  return {
    user: {
      id,
      name,
      email,
      validationStatus: "pending_review" as const,
      companyId: null,
    },
    selectedCompanyName,
    contactEmail,
    partner1Name,
    partner2Name,
    hasContract,
    requestedCompanyName,
    requestedCnpj,
  };
}

const alphaPendingReview = createPendingReview({
  id: "user-1",
  name: "Alpha User",
  email: "alpha@example.com",
  selectedCompanyName: "Alpha",
  partner1Name: "Alpha One",
  partner2Name: "Alpha Two",
  requestedCompanyName: "Alpha Request",
  requestedCnpj: "00000000000100",
});

const betaPendingReview = createPendingReview({
  id: "user-2",
  name: "Beta User",
  email: "beta@example.com",
  selectedCompanyName: "Beta",
  partner1Name: "Beta One",
  partner2Name: "Beta Two",
  hasContract: true,
  requestedCompanyName: "Beta Request",
  requestedCnpj: "00000000000200",
});

const gammaPendingReview = createPendingReview({
  id: "user-3",
  name: "Gamma User",
  email: "gamma@example.com",
  selectedCompanyName: "Gamma Holdings",
  partner1Name: "Gamma One",
  partner2Name: "Gamma Two",
  requestedCompanyName: "Gamma Request",
  requestedCnpj: "00000000000300",
});

function renderBell() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminPendingReviewsBell />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdminPendingReviewsBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPendingReviewsMock.mockResolvedValue([]);
  });

  it("does not render for non-admin users", () => {
    useAuthMock.mockReturnValue({
      isAdmin: false,
    });

    renderBell();

    expect(screen.queryByRole("button", { name: /revisoes pendentes/i })).not.toBeInTheDocument();
  });

  it("shows the pending count for admins", async () => {
    useAuthMock.mockReturnValue({
      isAdmin: true,
    });
    listPendingReviewsMock.mockResolvedValue([alphaPendingReview, betaPendingReview]);

    renderBell();

    expect(
      await screen.findByRole("button", { name: /2 revis/i }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it("opens a preview dropdown with a link to /admin/membros-pendentes", async () => {
    useAuthMock.mockReturnValue({
      isAdmin: true,
    });
    listPendingReviewsMock.mockResolvedValue([alphaPendingReview]);

    renderBell();

    const trigger = await screen.findByRole("button", { name: /1 revis/i }, { timeout: 5000 });
    fireEvent.mouseDown(trigger, { button: 0 });
    fireEvent.mouseUp(trigger, { button: 0 });
    fireEvent.click(trigger, { button: 0 });

    expect(await screen.findByRole("menuitem", { name: /ver fila completa/i })).toHaveAttribute(
      "href",
      "/admin/membros-pendentes",
    );
  });

  it("deduplicates repeated email values in the preview subtitle", async () => {
    useAuthMock.mockReturnValue({
      isAdmin: true,
    });
    listPendingReviewsMock.mockResolvedValue([gammaPendingReview]);

    renderBell();

    const trigger = await screen.findByRole("button", { name: /1 revis/i }, { timeout: 5000 });
    fireEvent.click(trigger);

    expect(await screen.findByText("Gamma User")).toBeInTheDocument();
    expect(screen.queryByText("gamma@example.com · gamma@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("Gamma Holdings · gamma@example.com")).toBeInTheDocument();
  });
});
