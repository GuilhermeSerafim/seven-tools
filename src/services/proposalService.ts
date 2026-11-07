import api from "../lib/apiClient";

export type ProposalStatus = "draft" | "ready" | "sent" | "approved" | "rejected";

export interface Proposal {
  id: string;
  userId: string;
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  projectDescription: string;
  scope: string;
  value: string;
  deadline: string;
  notes: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProposalDraft = Omit<Proposal, "id" | "userId" | "createdAt" | "updatedAt">;

interface PaginatedResponse {
  items: Proposal[];
  total: number;
  page: number;
  perPage: number;
}

export const proposalService = {
  async getAll(
    _userId: string,
    page: number = 1,
    perPage: number = 100
  ): Promise<Proposal[]> {
    const { data } = await api.get<PaginatedResponse>("/proposals", {
      params: { page, per_page: perPage },
    });
    return data.items;
  },

  async getById(_userId: string, id: string): Promise<Proposal | undefined> {
    try {
      const { data } = await api.get<Proposal>(`/proposals/${id}`);
      return data;
    } catch {
      return undefined;
    }
  },

  async create(_userId: string, data: ProposalDraft): Promise<Proposal> {
    const { data: resp } = await api.post<Proposal>("/proposals", data);
    return resp;
  },

  async update(
    _userId: string,
    id: string,
    data: Partial<ProposalDraft>
  ): Promise<Proposal | null> {
    try {
      const { data: resp } = await api.patch<Proposal>(`/proposals/${id}`, data);
      return resp;
    } catch {
      return null;
    }
  },

  async remove(_userId: string, id: string): Promise<void> {
    await api.delete(`/proposals/${id}`);
  },
};

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  ready: "Pronta para envio",
  sent: "Enviada",
  approved: "Aprovada",
  rejected: "Recusada",
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: "text-muted-foreground border-border",
  ready: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  sent: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  approved: "text-green-400 border-green-400/30 bg-green-400/10",
  rejected: "text-destructive border-destructive/30 bg-destructive/10",
};

export default proposalService;
