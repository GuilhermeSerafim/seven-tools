import type {
  LeadQualificationConfig,
  LeadQualificationConfigInput,
} from "@/services/leadQualificationService";

export const DEFAULT_LEAD_QUALIFICATION_CONFIG_INPUT: LeadQualificationConfigInput = {
  idealSegments: ["Tech"],
  idealCompanySizes: ["11-50"],
  idealRoles: ["Founder"],
  weightSegment: 20,
  weightCompanySize: 15,
  weightRole: 15,
  weightUrgency: 20,
  weightTiming: 15,
  weightPainLevel: 15,
  bronzeMax: 25,
  silverMax: 50,
  goldMax: 75,
  bronzeAction: "nutrir",
  silverAction: "revisar_manualmente",
  goldAction: "abordar_agora",
  diamondAction: "abordar_agora",
};

export function mapLeadQualificationConfigToInput(
  config: LeadQualificationConfig,
): LeadQualificationConfigInput {
  return {
    idealSegments: config.idealSegments,
    idealCompanySizes: config.idealCompanySizes,
    idealRoles: config.idealRoles,
    weightSegment: config.weightSegment,
    weightCompanySize: config.weightCompanySize,
    weightRole: config.weightRole,
    weightUrgency: config.weightUrgency,
    weightTiming: config.weightTiming,
    weightPainLevel: config.weightPainLevel,
    bronzeMax: config.bronzeMax,
    silverMax: config.silverMax,
    goldMax: config.goldMax,
    bronzeAction: config.bronzeAction,
    silverAction: config.silverAction,
    goldAction: config.goldAction,
    diamondAction: config.diamondAction,
  };
}

export function createLeadQualificationConfig(
  overrides: Partial<LeadQualificationConfig> = {},
): LeadQualificationConfig {
  return {
    id: "cfg-1",
    companyId: "company-1",
    ...DEFAULT_LEAD_QUALIFICATION_CONFIG_INPUT,
    createdAt: "2026-04-09T00:00:00.000Z",
    updatedAt: "2026-04-09T00:00:00.000Z",
    ...overrides,
  };
}
