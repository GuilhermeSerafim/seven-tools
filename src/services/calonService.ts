import api from "../lib/apiClient";

export interface CalonInput {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileContent?: string;
}

export interface CalonCriterion {
  name: string;
  score: number;
  comment: string;
}

export interface CalonAnalysis {
  overallScore: number;
  overallLabel: string;
  strongPoints: string[];
  weakPoints: string[];
  criteria: CalonCriterion[];
  suggestions: string[];
  analysedAt: number;
}

export const calonService = {
  async analyzeProposal(input: CalonInput): Promise<CalonAnalysis> {
    if (input.fileContent) {
      const { data } = await api.post("/ai/validate-proposal", {
        fileName: input.fileName,
        fileContent: input.fileContent,
      });
      return {
        ...data,
        analysedAt: Date.now(),
      };
    } else {
      throw new Error("Conteúdo do arquivo é obrigatório para análise.");
    }
  },

  async analyzeFile(file: File): Promise<CalonAnalysis> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/ai/validate-proposal/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      ...data,
      analysedAt: Date.now(),
    };
  },

  async analyzeByProposalId(proposalId: string): Promise<CalonAnalysis> {
    const { data } = await api.post(`/ai/validate-proposal/from-proposal/${proposalId}`);
    return {
      ...data,
      analysedAt: Date.now(),
    };
  },
};

export default calonService;
