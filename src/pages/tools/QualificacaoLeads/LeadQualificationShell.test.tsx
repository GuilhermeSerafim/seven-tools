import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  getLeadQualificationAppPath,
  getLeadQualificationConfigPath,
  getLeadQualificationNewPath,
} from "@/features/comercial/toolRoutes";

import LeadQualificationShell from "./LeadQualificationShell";

describe("LeadQualificationShell", () => {
  it("renders shared navigation for queue, new lead, and configuration", () => {
    render(
      <MemoryRouter initialEntries={[getLeadQualificationConfigPath()]}>
        <Routes>
          <Route path="/tools/qualificacao-de-leads/app" element={<LeadQualificationShell />}>
            <Route path="config" element={<div>Config page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /voltar ao resumo/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /fila/i })).toHaveAttribute(
      "href",
      getLeadQualificationAppPath(),
    );
    expect(screen.getByRole("link", { name: /novo lead/i })).toHaveAttribute(
      "href",
      getLeadQualificationNewPath(),
    );
    expect(screen.getByRole("link", { name: /configuração/i })).toHaveAttribute(
      "href",
      getLeadQualificationConfigPath(),
    );
  });
});
