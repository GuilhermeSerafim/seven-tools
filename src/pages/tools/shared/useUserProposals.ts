import { useEffect, useState } from "react";

import { proposalService, type Proposal } from "@/services/proposalService";

export function useUserProposals(userId?: string) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setProposals([]);
      setProposalsLoading(false);
      return;
    }

    let isCancelled = false;

    setProposalsLoading(true);
    proposalService
      .getAll(userId)
      .then((data) => {
        if (!isCancelled) {
          setProposals(data);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setProposals([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setProposalsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  return { proposals, proposalsLoading };
}
