import { describe, expect, it } from "vitest";

import {
  ACTION_LABELS,
  GROUP_ORDER,
  STATUS_LABELS,
  TIER_LABELS,
  groupLeadAction,
} from "./leadQualificationLabels";

describe("leadQualificationLabels", () => {
  it("exposes stable labels for tiers, statuses, and actions", () => {
    expect(TIER_LABELS.diamond).toBe("Diamante");
    expect(STATUS_LABELS.em_andamento).toBe("Em andamento");
    expect(ACTION_LABELS.abordar_agora).toBe("Abordar agora");
  });

  it("groups lead actions in the configured priority order", () => {
    expect(GROUP_ORDER).toEqual([
      "abordar_agora",
      "revisar_manualmente",
      "nutrir",
      "descartar",
    ]);
    expect(groupLeadAction("abordar_agora")).toBe("Prioridade imediata");
    expect(groupLeadAction("descartar")).toBe("Descartar");
  });
});
