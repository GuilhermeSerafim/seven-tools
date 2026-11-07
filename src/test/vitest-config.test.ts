import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("vitest config", () => {
  it("caps worker fan-out for the jsdom suite", () => {
    const configFile = readFileSync(path.resolve(process.cwd(), "vitest.config.ts"), "utf8");

    expect(configFile).toMatch(/maxWorkers:\s*4/);
  });
});
