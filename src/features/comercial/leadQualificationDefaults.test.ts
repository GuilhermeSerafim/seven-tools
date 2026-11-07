import { describe, expect, it } from "vitest";

import {
  DEFAULT_LEAD_QUALIFICATION_CONFIG_INPUT,
  createLeadQualificationConfig,
} from "./leadQualificationDefaults";

describe("leadQualificationDefaults", () => {
  it("exposes the shared default config input used by the lead qualification flows", () => {
    expect(DEFAULT_LEAD_QUALIFICATION_CONFIG_INPUT).toMatchObject({
      idealSegments: ["Tech"],
      idealCompanySizes: ["11-50"],
      idealRoles: ["Founder"],
      weightSegment: 20,
      bronzeAction: "nutrir",
      diamondAction: "abordar_agora",
    });
  });

  it("builds a persisted config fixture while allowing targeted overrides", () => {
    expect(
      createLeadQualificationConfig({
        weightSegment: 24,
        idealSegments: ["Tech", "SaaS"],
      }),
    ).toMatchObject({
      id: "cfg-1",
      companyId: "company-1",
      idealSegments: ["Tech", "SaaS"],
      weightSegment: 24,
      updatedAt: "2026-04-09T00:00:00.000Z",
    });
  });
});
