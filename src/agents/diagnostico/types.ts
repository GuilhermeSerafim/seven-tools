export interface CommercialDiagnosisReport {
  cenario: string;
  gargalo_principal: string;
  etapa_critica_funil: string;
  sintomas: string[];
  causa_provavel: string;
  acao_recomendada: string;
  plano_prioritario: string[];
}

export type CommercialDiagnosisToolResult = {
  kind: 'commercial_diagnosis_report';
  report: CommercialDiagnosisReport;
};

export interface CommercialDiagnosisAssistantResponse {
  reply: string;
  tool_result: CommercialDiagnosisToolResult | null;
}
