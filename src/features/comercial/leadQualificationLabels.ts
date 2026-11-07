export const TIER_LABELS = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  diamond: "Diamante",
} as const;

export const ACTION_LABELS = {
  abordar_agora: "Abordar agora",
  revisar_manualmente: "Revisar manualmente",
  nutrir: "Nutrir",
  descartar: "Descartar",
} as const;

export const STATUS_LABELS = {
  novo: "Novo",
  em_andamento: "Em andamento",
  qualificado: "Qualificado",
  nutrir: "Nutrir",
  descartado: "Descartado",
} as const;

export const GROUP_ORDER = [
  "abordar_agora",
  "revisar_manualmente",
  "nutrir",
  "descartar",
] as const;

const ACTION_GROUP_LABELS = {
  abordar_agora: "Prioridade imediata",
  revisar_manualmente: "Revisar manualmente",
  nutrir: "Nutrir",
  descartar: "Descartar",
} as const;

export function groupLeadAction(action: keyof typeof ACTION_LABELS) {
  return ACTION_GROUP_LABELS[action];
}
