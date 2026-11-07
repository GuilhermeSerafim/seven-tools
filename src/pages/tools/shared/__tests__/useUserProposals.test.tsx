import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserProposals } from "../useUserProposals";
import { proposalService, type Proposal } from "@/services/proposalService";

const MOCK: Proposal[] = [
  {
    id: "p1",
    userId: "u1",
    title: "Cliente X",
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    projectDescription: "",
    scope: "",
    value: "",
    deadline: "",
    notes: "",
    status: "ready",
    createdAt: "",
    updatedAt: "",
  },
];

describe("useUserProposals", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function createControlledRequest() {
    let resolveRequest: (
      value: Proposal[] | PromiseLike<Proposal[]>,
    ) => void = () => {};
    let markSettled = () => {};
    const settled = new Promise<void>((resolve) => {
      markSettled = resolve;
    });

    const request = new Promise<Proposal[]>((resolve) => {
      resolveRequest = resolve;
    }).finally(() => markSettled());

    return { request, resolveRequest, settled };
  }

  it("com userId valido, busca propostas e loading=false no final", async () => {
    vi.spyOn(proposalService, "getAll").mockResolvedValue(MOCK);
    const { result } = renderHook(() => useUserProposals("u1"));

    expect(result.current.proposalsLoading).toBe(true);
    await waitFor(() => expect(result.current.proposalsLoading).toBe(false));
    expect(result.current.proposals).toEqual(MOCK);
  });

  it("sem userId, retorna lista vazia e loading=false no primeiro render", () => {
    const spy = vi.spyOn(proposalService, "getAll").mockResolvedValue(MOCK);
    const { result } = renderHook(() => useUserProposals(undefined));

    expect(result.current.proposalsLoading).toBe(false);
    expect(result.current.proposals).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("nao atualiza estado quando userId sai antes da resposta chegar", async () => {
    const { request, resolveRequest, settled } = createControlledRequest();
    vi.spyOn(proposalService, "getAll").mockReturnValue(request);

    const { result, rerender } = renderHook(
      (props: { userId?: string }) => useUserProposals(props.userId),
      { initialProps: { userId: "u1" } },
    );

    expect(result.current.proposalsLoading).toBe(true);

    rerender({ userId: undefined });
    expect(result.current.proposalsLoading).toBe(false);
    expect(result.current.proposals).toEqual([]);

    resolveRequest(MOCK);

    await settled;
    await Promise.resolve();
    expect(result.current.proposals).toEqual([]);
    expect(result.current.proposalsLoading).toBe(false);
  });

  it("nao atualiza estado apos desmontar antes da resposta chegar", async () => {
    const { request, resolveRequest, settled } = createControlledRequest();
    vi.spyOn(proposalService, "getAll").mockReturnValue(request);
    const { result, unmount } = renderHook(() => useUserProposals("u1"));

    expect(result.current.proposalsLoading).toBe(true);
    expect(result.current.proposals).toEqual([]);

    unmount();
    resolveRequest(MOCK);

    await settled;
    await Promise.resolve();

    expect(result.current.proposals).toEqual([]);
    expect(result.current.proposalsLoading).toBe(true);
  });

  it("ao erro do service, cai para lista vazia e loading=false", async () => {
    vi.spyOn(proposalService, "getAll").mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useUserProposals("u1"));

    await waitFor(() => expect(result.current.proposalsLoading).toBe(false));
    expect(result.current.proposals).toEqual([]);
  });
});
