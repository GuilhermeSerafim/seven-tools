import api from "../lib/apiClient";

export type LeadTier = "bronze" | "silver" | "gold" | "diamond";
export type LeadAction =
  | "abordar_agora"
  | "revisar_manualmente"
  | "nutrir"
  | "descartar";
export type LeadStatus = "novo" | "em_andamento" | "qualificado" | "nutrir" | "descartado";

export interface LeadQualificationConfig {
  id: string;
  companyId: string;
  idealSegments: string[];
  idealCompanySizes: string[];
  idealRoles: string[];
  weightSegment: number;
  weightCompanySize: number;
  weightRole: number;
  weightUrgency: number;
  weightTiming: number;
  weightPainLevel: number;
  bronzeMax: number;
  silverMax: number;
  goldMax: number;
  bronzeAction: LeadAction;
  silverAction: LeadAction;
  goldAction: LeadAction;
  diamondAction: LeadAction;
  createdAt: string;
  updatedAt: string;
}

export interface LeadQualificationConfigInput {
  idealSegments: string[];
  idealCompanySizes: string[];
  idealRoles: string[];
  weightSegment: number;
  weightCompanySize: number;
  weightRole: number;
  weightUrgency: number;
  weightTiming: number;
  weightPainLevel: number;
  bronzeMax: number;
  silverMax: number;
  goldMax: number;
  bronzeAction: LeadAction;
  silverAction: LeadAction;
  goldAction: LeadAction;
  diamondAction: LeadAction;
}

export interface QualifiedLead {
  id: string;
  companyId: string;
  createdByUserId: string;
  contactName: string;
  companyName: string;
  contactRole: string;
  segment: string;
  companySize: string;
  urgency: string;
  timing: string;
  painLevel: string;
  notes: string | null;
  status: LeadStatus;
  score: number;
  tier: LeadTier;
  recommendedAction: LeadAction;
  scoringSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface QualifiedLeadCreateInput {
  contactName: string;
  companyName: string;
  contactRole: string;
  segment: string;
  companySize: string;
  urgency: string;
  timing: string;
  painLevel: string;
  notes?: string | null;
}

export interface QualifiedLeadUpdateInput extends Partial<QualifiedLeadCreateInput> {
  status?: LeadStatus;
}

export interface PaginatedLeadResponse {
  items: QualifiedLead[];
  total: number;
  page: number;
  perPage: number;
}

export const leadQualificationService = {
  async getConfig(): Promise<LeadQualificationConfig | null> {
    try {
      const { data } = await api.get<LeadQualificationConfig>("/lead-qualification/config");
      return data;
    } catch (error) {
      if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { status?: number } }).response;
        if (response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  async upsertConfig(payload: LeadQualificationConfigInput): Promise<LeadQualificationConfig> {
    const { data } = await api.put<LeadQualificationConfig>("/lead-qualification/config", payload);
    return data;
  },

  async listLeads(page: number = 1, perPage: number = 100): Promise<PaginatedLeadResponse> {
    const { data } = await api.get<PaginatedLeadResponse>("/lead-qualification/leads", {
      params: { page, per_page: perPage },
    });
    return data;
  },

  async createLead(payload: QualifiedLeadCreateInput): Promise<QualifiedLead> {
    const { data } = await api.post<QualifiedLead>("/lead-qualification/leads", payload);
    return data;
  },

  async updateLead(id: string, payload: QualifiedLeadUpdateInput): Promise<QualifiedLead> {
    const { data } = await api.patch<QualifiedLead>(`/lead-qualification/leads/${id}`, payload);
    return data;
  },

  async getLead(id: string): Promise<QualifiedLead> {
    const { data } = await api.get<QualifiedLead>(`/lead-qualification/leads/${id}`);
    return data;
  },
};
