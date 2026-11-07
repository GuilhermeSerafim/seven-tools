import api, { clearStoredToken, getStoredToken, setStoredToken } from "../lib/apiClient";
import type {
  AuthApiResponse,
  AuthMutationResult,
  Company,
  RegisterData,
  ResolvedAuthSession,
  User,
  UserApiResponse,
  ValidationStatus,
} from "./types";

export const OTHER_COMPANY_ID = "__other__";

export interface RegistrationCompanyOption {
  id: string;
  name: string;
}

interface RegistrationCompaniesResponse {
  items: RegistrationCompanyOption[];
}

function mapUser(data: UserApiResponse): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as "admin" | "user",
    validationStatus: data.validationStatus as ValidationStatus,
    approvalSource: data.approvalSource ?? null,
    jobTitle: data.jobTitle,
    avatarUrl: data.avatarUrl,
    instagram: data.instagram,
    linkedin: data.linkedin,
    companyId: data.company?.id,
    mustChangePassword: data.mustChangePassword ?? false,
  };
}

function mapAuthUser(data: AuthApiResponse["user"]): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as "admin" | "user",
    validationStatus: data.validationStatus,
    approvalSource: data.approvalSource ?? null,
    jobTitle: data.jobTitle,
    avatarUrl: data.avatarUrl,
    instagram: data.instagram,
    linkedin: data.linkedin,
    companyId: data.companyId,
    mustChangePassword: data.mustChangePassword ?? false,
  };
}

function mapResolvedSession(data: AuthApiResponse): ResolvedAuthSession {
  return {
    user: mapAuthUser(data.user),
    company: data.company ?? null,
  };
}

async function getCurrentSession(): Promise<ResolvedAuthSession> {
  const token = getStoredToken();
  if (!token) {
    return { user: null, company: null };
  }

  try {
    const { data } = await api.get<UserApiResponse>("/users/me");
    return {
      user: mapUser(data),
      company: data.company || null,
    };
  } catch {
    clearStoredToken();
    return { user: null, company: null };
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return fallback;
  }

  const response = (error as { response?: { data?: { detail?: unknown } } }).response;
  const detail = response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (typeof detail === "object" && detail !== null && "detail" in detail) {
    const nestedDetail = detail.detail;
    if (typeof nestedDetail === "string") {
      return nestedDetail;
    }
  }

  return fallback;
}

export const authService = {
  async login(
    email: string,
    password: string
  ): Promise<AuthMutationResult> {
    try {
      const { data } = await api.post<AuthApiResponse>("/auth/login", {
        email,
        password,
      });
      setStoredToken(data.token);
      return { success: true, session: mapResolvedSession(data) };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, "Erro ao fazer login.") };
    }
  },

  async register(data: RegisterData): Promise<AuthMutationResult> {
    try {
      const payload =
        "companyId" in data
          ? {
              name: data.name,
              email: data.email,
              password: data.password,
              companyId: data.companyId,
            }
          : {
              name: data.name,
              email: data.email,
              password: data.password,
              otherCompanyName: data.otherCompanyName,
              otherCompanyCnpj: data.otherCompanyCnpj,
            };

      const { data: resp } = await api.post<AuthApiResponse>("/auth/register", payload);
      setStoredToken(resp.token);
      return { success: true, session: mapResolvedSession(resp) };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, "Erro ao registrar.") };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, "Erro ao trocar senha.") };
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post("/auth/password-reset/request", { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Erro ao solicitar recuperacao de senha."),
      };
    }
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post("/auth/password-reset/confirm", {
        token,
        newPassword,
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Erro ao redefinir senha."),
      };
    }
  },

  async getRegistrationCompanies(): Promise<RegistrationCompanyOption[]> {
    try {
      const { data } = await api.get<RegistrationCompaniesResponse>("/companies/registration-options");
      return data.items;
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Não foi possível carregar as empresas disponíveis."),
      );
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors — clear token regardless
    }
    clearStoredToken();
  },

  clearLocalSession(): void {
    clearStoredToken();
  },

  getCurrentSession,

  async getCurrentUser(): Promise<User | null> {
    const { user } = await getCurrentSession();
    return user;
  },

  async getCurrentCompany(): Promise<Company | null> {
    const { company } = await getCurrentSession();
    return company;
  },

  async updateUser(
    _userId: string,
    data: Partial<Omit<User, "id" | "role" | "validationStatus" | "approvalSource">>
  ): Promise<User | null> {
    try {
      const { data: resp } = await api.put<UserApiResponse>("/users/me", data);
      return mapUser(resp);
    } catch {
      return null;
    }
  },

  async updateCompany(
    _companyId: string,
    data: Partial<Omit<Company, "id">>
  ): Promise<Company | null> {
    try {
      const { data: resp } = await api.put<Company>("/users/me/company", data);
      return resp;
    } catch {
      return null;
    }
  },
};

export default authService;
