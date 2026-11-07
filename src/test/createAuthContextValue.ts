import { vi } from "vitest";

type UserRole = "admin" | "user";

type AuthContextUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  jobTitle: string;
  instagram: string;
  linkedin: string;
};

type AuthContextCompany = {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  instagram: string;
  segment: string;
  shortDescription: string;
  city: string;
};

export function createAuthContextValue({
  isAdmin = false,
  user = {},
  company = {},
}: Readonly<{
  isAdmin?: boolean;
  user?: Partial<AuthContextUser>;
  company?: Partial<AuthContextCompany>;
}> = {}) {
  return {
    user: {
      id: "user-1",
      name: "Maria Silva",
      email: "maria@example.com",
      avatarUrl: null,
      role: (isAdmin ? "admin" : "user") as UserRole,
      jobTitle: "Diretora",
      instagram: "",
      linkedin: "",
      ...user,
    },
    company: {
      id: "company-1",
      name: "SEVEN",
      logoUrl: "",
      website: "",
      instagram: "",
      segment: "",
      shortDescription: "",
      city: "",
      ...company,
    },
    isAuthenticated: true,
    isApproved: true,
    isAdmin,
    logout: vi.fn(),
    clearSession: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    updateUser: vi.fn(),
    updateCompany: vi.fn(),
    refreshUser: vi.fn(),
  };
}
