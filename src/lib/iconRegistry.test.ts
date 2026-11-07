import { Box, FileCheck, Megaphone } from "lucide-react";
import { describe, expect, it } from "vitest";
import { getIconByName } from "./iconRegistry";

describe("getIconByName", () => {
  it("returns the mapped icon component when the name is known", () => {
    expect(getIconByName("FileCheck")).toBe(FileCheck);
    expect(getIconByName("Megaphone")).toBe(Megaphone);
  });

  it("falls back to Box when the icon name is unknown", () => {
    expect(getIconByName("does-not-exist")).toBe(Box);
  });
});
