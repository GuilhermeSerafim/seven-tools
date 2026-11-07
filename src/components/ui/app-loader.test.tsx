import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./orbital-loader", () => ({
  OrbitalLoader: ({ className }: { className?: string }) => (
    <div data-testid="orbital-loader" className={className} />
  ),
}));

import { AppLoader } from "./app-loader";

describe("AppLoader", () => {
  it("renders fullscreen status copy with the orbital loader", () => {
    render(
      <AppLoader
        label="Carregando seu acesso..."
        description="Estamos preparando o hub para voce."
        fullscreen
      />,
    );

    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveClass("min-h-screen");
    expect(screen.getByTestId("app-loader-orbital")).toBeInTheDocument();
    expect(screen.getByTestId("orbital-loader")).toBeInTheDocument();
    expect(screen.getByText("Carregando seu acesso...")).toBeInTheDocument();
    expect(screen.getByText("Estamos preparando o hub para voce.")).toBeInTheDocument();
  });

  it("renders section mode without fullscreen styles or description", () => {
    render(<AppLoader label="Carregando fila..." />);

    const status = screen.getByRole("status");

    expect(status).toHaveClass("py-10");
    expect(status).not.toHaveClass("min-h-screen");
    expect(screen.getByText("Carregando fila...")).toBeInTheDocument();
    expect(screen.queryByText("Estamos preparando o hub para voce.")).not.toBeInTheDocument();
  });

  it("passes size classes through to the orbital loader", () => {
    render(<AppLoader label="Carregando fila..." size="lg" />);

    expect(screen.getByTestId("orbital-loader")).toHaveClass("h-20", "w-20");
  });
});
