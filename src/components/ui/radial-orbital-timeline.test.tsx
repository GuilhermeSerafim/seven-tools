import { render, screen, waitFor } from "@testing-library/react";
import { DollarSign, Handshake, Megaphone, Settings } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import RadialOrbitalTimeline from "./radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "Marketing",
    date: "",
    content: "Tráfego, conteúdo e conversão",
    category: "modulo",
    icon: Megaphone,
    relatedIds: [2],
    status: "completed" as const,
    energy: 85,
  },
  {
    id: 2,
    title: "Comercial",
    date: "",
    content: "Vendas, CRM e propostas",
    category: "modulo",
    icon: Handshake,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Operação",
    date: "",
    content: "Processos, equipe e eficiência",
    category: "modulo",
    icon: Settings,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 70,
  },
  {
    id: 4,
    title: "Financeiro",
    date: "",
    content: "Indicadores, custos e margem",
    category: "modulo",
    icon: DollarSign,
    relatedIds: [3],
    status: "pending" as const,
    energy: 60,
  },
];

describe("RadialOrbitalTimeline", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 320,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  it("shrinks the orbit and centers labels on mobile viewports", async () => {
    render(<RadialOrbitalTimeline timelineData={timelineData} />);

    await waitFor(() => {
      const orbitRing = screen.getByTestId("orbit-ring");
      expect(orbitRing).toHaveStyle({ width: "256px", height: "256px" });
    });

    for (const title of ["Marketing", "Comercial", "Operação", "Financeiro"]) {
      expect(screen.getByText(title)).toHaveClass("left-1/2", "-translate-x-1/2");
    }
  });
});
