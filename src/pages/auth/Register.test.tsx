import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { registerMock, getRegistrationCompaniesMock } = vi.hoisted(() => ({
  registerMock: vi.fn(),
  getRegistrationCompaniesMock: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) =>
        ({
          children,
          ...props
        }: Readonly<React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }>) =>
          React.createElement(tag, props, children),
    },
  ),
}));

vi.mock("@/components/ui/background-paths", () => ({
  FloatingPaths: () => null,
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => undefined,
}));

function updateMockFieldValue(
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  field: string,
  value: string,
) {
  setValues((current) => ({
    ...current,
    [field]: value,
  }));
}

function createMockFieldRegistration(
  values: Record<string, string>,
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  name: string,
) {
  return {
    name,
    value: values[name] ?? "",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      updateMockFieldValue(setValues, name, event.target.value);
    },
  };
}

function createMockControl(
  values: Record<string, string>,
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>,
) {
  return {
    values,
    setValue: (field: string, value: string) => {
      updateMockFieldValue(setValues, field, value);
    },
  };
}

function createMockHandleSubmit(values: Record<string, string>) {
  return (callback: (data: Record<string, string>) => void) => (event?: Event) => {
    event?.preventDefault?.();
    return callback(values);
  };
}

vi.mock("react-hook-form", async () => {
  const importedReact = await vi.importActual<typeof import("react")>("react");

  return {
    Controller: ({
      name,
      control,
      render,
    }: Readonly<{
      name: string;
      control: {
        values: Record<string, string>;
        setValue: (field: string, value: string) => void;
      };
      render: (args: {
        field: {
          value: string;
          onChange: (value: string) => void;
        };
      }) => React.ReactNode;
    }>) =>
      render({
        field: {
          value: control.values[name] ?? "",
          onChange: (value: string) => control.setValue(name, value),
        },
      }),
    useForm: ({ defaultValues }: { defaultValues?: Record<string, string> } = {}) => {
      const [values, setValues] = importedReact.useState<Record<string, string>>(defaultValues ?? {});

      return {
        register: (name: string) => createMockFieldRegistration(values, setValues, name),
        control: createMockControl(values, setValues),
        handleSubmit: createMockHandleSubmit(values),
        watch: (name: string) => values[name] ?? "",
        formState: {
          errors: {},
          isSubmitting: false,
        },
      };
    },
  };
});

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({
    register: registerMock,
  }),
}));

vi.mock("@/auth/authService", () => ({
  OTHER_COMPANY_ID: "__other__",
  default: {
    getRegistrationCompanies: getRegistrationCompaniesMock,
  },
}));

vi.mock("@/components/auth/CompanyCombobox", () => ({
  CompanyCombobox: ({
    options,
    value = "",
    onValueChange,
    placeholder = "Selecione sua empresa",
  }: Readonly<{
    options: { id: string; name: string }[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
  }>) => (
    <select
      aria-label={placeholder}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  ),
}));

async function renderRegister() {
  const { default: Register } = await import("./Register");

  await act(async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
  });
}

function fillBaseRegistrationFields({
  name,
  email,
  password,
}: Readonly<{
  name: string;
  email: string;
  password: string;
}>) {
  fireEvent.change(screen.getByLabelText(/seu nome/i), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/^senha$/i), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
    target: { value: password },
  });
}

function submitRegistrationForm() {
  const submitButton = screen.getByRole("button", { name: /criar conta/i });
  const form = submitButton.closest("form");

  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Expected register submit button to be inside a form.");
  }

  fireEvent.submit(form);
}

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerMock.mockResolvedValue({ success: false, error: "noop" });
    getRegistrationCompaniesMock.mockResolvedValue([{ id: "company-1", name: "SEVEN" }]);
  });

  afterEach(() => {
    cleanup();
  });

  it("reveals the company name and CNPJ fields only when Outra empresa is selected", async () => {
    await renderRegister();

    expect(screen.queryByLabelText(/nome da empresa/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cnpj da empresa/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/selecione sua empresa/i), {
      target: { value: "company-1" },
    });

    expect(screen.queryByLabelText(/nome da empresa/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cnpj da empresa/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/selecione sua empresa/i), {
      target: { value: "__other__" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nome da empresa/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cnpj da empresa/i)).toBeInTheDocument();
    });
  });

  it("normalizes legacy Other company options to a single PT-BR option", async () => {
    getRegistrationCompaniesMock.mockResolvedValue([
      { id: "company-1", name: "SEVEN" },
      { id: "other", name: "Other" },
      { id: "__other__", name: "Other" },
    ]);

    await renderRegister();

    await screen.findByRole("option", { name: "SEVEN" });

    expect(screen.queryByRole("option", { name: "Other" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: "Outra empresa" })).toHaveLength(1);
  });

  it("shows an actionable fallback when ClickUp companies cannot be loaded", async () => {
    getRegistrationCompaniesMock.mockRejectedValue(
      new Error(
        "Integracao ClickUp nao configurada. Defina CLICKUP_API_TOKEN e CLICKUP_CLIENTS_LIST_ID no ambiente da API.",
      ),
    );

    await renderRegister();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Integracao ClickUp nao configurada");
    expect(alert).toHaveTextContent("Outra empresa");
    expect(screen.getByRole("option", { name: "Outra empresa" })).toBeInTheDocument();
  });

  it("submits the known-company payload without other-company fields", async () => {
    await renderRegister();

    await screen.findByRole("option", { name: "SEVEN" });

    fireEvent.change(screen.getByLabelText(/selecione sua empresa/i), {
      target: { value: "company-1" },
    });
    fillBaseRegistrationFields({
      name: "Maria Silva",
      email: "maria@example.com",
      password: "123456",
    });

    submitRegistrationForm();

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: "Maria Silva",
        email: "maria@example.com",
        password: "123456",
        companyId: "company-1",
      });
    });
  });

  it("submits the Outra empresa payload without companyId", async () => {
    await renderRegister();

    fireEvent.change(screen.getByLabelText(/selecione sua empresa/i), {
      target: { value: "__other__" },
    });
    fillBaseRegistrationFields({
      name: "Joao Souza",
      email: "joao@example.com",
      password: "123456",
    });
    fireEvent.change(screen.getByLabelText(/nome da empresa/i), {
      target: { value: "Nova Empresa" },
    });
    fireEvent.change(screen.getByLabelText(/cnpj da empresa/i), {
      target: { value: "12.345.678/0001-90" },
    });

    submitRegistrationForm();

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: "Joao Souza",
        email: "joao@example.com",
        password: "123456",
        otherCompanyName: "Nova Empresa",
        otherCompanyCnpj: "12.345.678/0001-90",
      });
    });
    expect(registerMock.mock.calls.at(-1)?.[0]).not.toHaveProperty("companyId");
  });
});
