export type LeadQualificationAction =
  | 'abordar_agora'
  | 'revisar_manualmente'
  | 'nutrir'
  | 'descartar';

export type LeadQualificationTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LeadQualificationQueueSummary {
  totalLeads: number;
  highestScore: number | null;
  primaryAction: LeadQualificationAction | null;
}

export interface LeadQualificationQueueLead {
  leadId: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  segment: string;
  companySize: string;
  urgency: string;
  timing: string;
  painLevel: string;
  notes: string | null;
  score: number;
  tier: LeadQualificationTier;
  recommendedAction: LeadQualificationAction;
  qualificationReason: string;
  risk: string;
  recommendedNextStep: string;
}

export interface LeadQualificationQueuePayload {
  kind: 'lead_qualification_queue';
  summary: LeadQualificationQueueSummary;
  leads: LeadQualificationQueueLead[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, snakeKey: string, camelKey: string): string {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === 'string' ? value : '';
}

function readNullableString(
  record: Record<string, unknown>,
  snakeKey: string,
  camelKey: string,
): string | null {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === 'string' && value.trim() ? value : null;
}

function readNumber(record: Record<string, unknown>, snakeKey: string, camelKey: string): number {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readNullableNumber(
  record: Record<string, unknown>,
  snakeKey: string,
  camelKey: string,
): number | null {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeAction(value: string): LeadQualificationAction {
  if (
    value === 'abordar_agora' ||
    value === 'revisar_manualmente' ||
    value === 'nutrir' ||
    value === 'descartar'
  ) {
    return value;
  }

  return 'revisar_manualmente';
}

function normalizeNullableAction(value: string): LeadQualificationAction | null {
  return value ? normalizeAction(value) : null;
}

function normalizeTier(value: string): LeadQualificationTier {
  if (value === 'bronze' || value === 'silver' || value === 'gold' || value === 'diamond') {
    return value;
  }

  return 'bronze';
}

export function normalizeLeadQualificationQueuePayload(
  payload: unknown,
): LeadQualificationQueuePayload | null {
  if (!isRecord(payload) || payload.kind !== 'lead_qualification_queue') {
    return null;
  }

  const rawSummary = isRecord(payload.summary) ? payload.summary : {};
  const rawLeads = Array.isArray(payload.leads) ? payload.leads : [];
  const leads = rawLeads.filter(isRecord).map((lead) => ({
    leadId: readString(lead, 'lead_id', 'leadId'),
    companyName: readString(lead, 'company_name', 'companyName'),
    contactName: readString(lead, 'contact_name', 'contactName'),
    contactRole: readString(lead, 'contact_role', 'contactRole'),
    segment: readString(lead, 'segment', 'segment'),
    companySize: readString(lead, 'company_size', 'companySize'),
    urgency: readString(lead, 'urgency', 'urgency'),
    timing: readString(lead, 'timing', 'timing'),
    painLevel: readString(lead, 'pain_level', 'painLevel'),
    notes: readNullableString(lead, 'notes', 'notes'),
    score: readNumber(lead, 'score', 'score'),
    tier: normalizeTier(readString(lead, 'tier', 'tier')),
    recommendedAction: normalizeAction(readString(lead, 'recommended_action', 'recommendedAction')),
    qualificationReason: readString(lead, 'qualification_reason', 'qualificationReason'),
    risk: readString(lead, 'risk', 'risk'),
    recommendedNextStep: readString(lead, 'recommended_next_step', 'recommendedNextStep'),
  }));

  return {
    kind: 'lead_qualification_queue',
    summary: {
      totalLeads: readNumber(rawSummary, 'total_leads', 'totalLeads') || leads.length,
      highestScore: readNullableNumber(rawSummary, 'highest_score', 'highestScore'),
      primaryAction: normalizeNullableAction(
        readString(rawSummary, 'primary_action', 'primaryAction'),
      ),
    },
    leads,
  };
}
