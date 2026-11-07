export type Role = "admin" | "user";
export type ValidationStatus = "pending_review" | "approved" | "blocked";
export type ApprovalSource = "seed" | "manual" | "clickup_email_match";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  validationStatus: ValidationStatus;
  approvalSource?: ApprovalSource | null;
  jobTitle?: string;
  avatarUrl?: string;
  instagram?: string;
  linkedin?: string;
  companyId?: string;
  mustChangePassword?: boolean;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  instagram?: string;
  segment?: string;
  shortDescription?: string;
  city?: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  name: string;
  roleTitle?: string;
  photoUrl?: string;
  instagram?: string;
  linkedin?: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: number;
}

export interface KnownCompanyRegisterData {
  name: string;
  email: string;
  password: string;
  companyId: string;
}

export interface OtherCompanyRegisterData {
  name: string;
  email: string;
  password: string;
  otherCompanyName: string;
  otherCompanyCnpj: string;
}

export type RegisterData = KnownCompanyRegisterData | OtherCompanyRegisterData;

export interface Favorite {
  userId: string;
  toolId: string;
}

export interface AuthApiResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    validationStatus: ValidationStatus;
    approvalSource?: ApprovalSource | null;
    jobTitle?: string;
    avatarUrl?: string;
    instagram?: string;
    linkedin?: string;
    companyId?: string;
    mustChangePassword?: boolean;
  };
  company?: Company | null;
}

export interface UserApiResponse extends User {
  company: Company | null;
}

export interface ResolvedAuthSession {
  user: User | null;
  company: Company | null;
}

export interface AuthMutationResult {
  success: boolean;
  error?: string;
  session?: ResolvedAuthSession;
}
