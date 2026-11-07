import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2 } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";
import authService, {
  OTHER_COMPANY_ID,
  type RegistrationCompanyOption,
} from "@/auth/authService";
import type { RegisterData } from "@/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { CompanyCombobox } from "@/components/auth/CompanyCombobox";

const OTHER_COMPANY_OPTION: RegistrationCompanyOption = {
  id: OTHER_COMPANY_ID,
  name: "Outra empresa",
};

function isOtherCompanyOption(option: RegistrationCompanyOption): boolean {
  const id = option.id.trim().toLowerCase();
  const name = option.name.trim().toLowerCase();

  return id === OTHER_COMPANY_ID || id === "other" || name === "other" || name === "outra empresa";
}

function getCompanyLoadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível carregar as empresas disponíveis.";
}

const schema = z
  .object({
    name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
    companyId: z.string().trim().min(1, "Selecione sua empresa"),
    otherCompanyName: z.string().trim().optional(),
    otherCompanyCnpj: z.string().trim().optional(),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não conferem",
        path: ["confirmPassword"],
      });
    }

    if (data.companyId === OTHER_COMPANY_ID) {
      if (!data.otherCompanyName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nome da empresa deve ser informado",
          path: ["otherCompanyName"],
        });
      }

      if (!data.otherCompanyCnpj?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CNPJ da empresa deve ser informado",
          path: ["otherCompanyCnpj"],
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [companyOptions, setCompanyOptions] = useState<RegistrationCompanyOption[]>([OTHER_COMPANY_OPTION]);
  const [companyLoadError, setCompanyLoadError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    shouldUnregister: true,
    defaultValues: {
      name: "",
      companyId: "",
      otherCompanyName: "",
      otherCompanyCnpj: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const companyId = watch("companyId");
  const isOtherCompany = companyId === OTHER_COMPANY_ID;

  useEffect(() => {
    let active = true;

    const loadCompanies = async () => {
      try {
        const items = await authService.getRegistrationCompanies();
        if (!active) {
          return;
        }

        setCompanyOptions([
          ...items.filter((item) => !isOtherCompanyOption(item)),
          OTHER_COMPANY_OPTION,
        ]);
        setCompanyLoadError("");
      } catch (error) {
        if (!active) {
          return;
        }

        setCompanyOptions([OTHER_COMPANY_OPTION]);
        setCompanyLoadError(getCompanyLoadErrorMessage(error));
      }
    };

    void loadCompanies();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setServerError("");

    const payload: RegisterData =
      data.companyId === OTHER_COMPANY_ID
        ? {
            name: data.name,
            email: data.email,
            password: data.password,
            otherCompanyName: data.otherCompanyName?.trim(),
            otherCompanyCnpj: data.otherCompanyCnpj?.trim(),
          }
        : {
            name: data.name,
            email: data.email,
            password: data.password,
            companyId: data.companyId,
          };

    const result = await authRegister(payload);

    if (result.success) {
      const destination =
        result.session?.user.validationStatus === "approved" ? "/hub" : "/aguardando-validacao";
      navigate(destination, { replace: true });
      return;
    }

    setServerError(result.error ?? "Erro ao criar conta.");
  };

  return (
    <AuthPageLayout
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      }
    >
      <h1 className="font-display font-bold text-2xl mb-1">Criar sua conta</h1>
      <p className="text-sm text-muted-foreground mb-6">Junte-se ao ecossistema SEVEN</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Seu nome</Label>
          <Input
            id="name"
            placeholder="Nome completo"
            autoComplete="name"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyId">Empresa</Label>
          <Controller
            control={control}
            name="companyId"
            render={({ field }) => (
              <CompanyCombobox
                id="companyId"
                options={companyOptions}
                value={field.value}
                onValueChange={field.onChange}
                invalid={!!errors.companyId}
                className="h-10"
              />
            )}
          />
          {errors.companyId && (
            <p className="text-xs text-destructive">{errors.companyId.message}</p>
          )}
        </div>

        {companyLoadError && (
          <div
            role="alert"
            className="flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div className="space-y-1">
              <p className="font-medium">Lista de empresas indisponível.</p>
              <p>
                {companyLoadError} Você ainda pode escolher Outra empresa e enviar o cadastro
                para revisão.
              </p>
            </div>
          </div>
        )}

        {isOtherCompany && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="otherCompanyName">Nome da empresa</Label>
              <Input
                id="otherCompanyName"
                placeholder="Nome da empresa"
                {...register("otherCompanyName")}
                className={errors.otherCompanyName ? "border-destructive" : ""}
              />
              {errors.otherCompanyName && (
                <p className="text-xs text-destructive">{errors.otherCompanyName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="otherCompanyCnpj">CNPJ da empresa</Label>
              <Input
                id="otherCompanyCnpj"
                placeholder="00.000.000/0000-00"
                {...register("otherCompanyCnpj")}
                className={errors.otherCompanyCnpj ? "border-destructive" : ""}
              />
              {errors.otherCompanyCnpj && (
                <p className="text-xs text-destructive">{errors.otherCompanyCnpj.message}</p>
              )}
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <PasswordField
          id="password"
          label="Senha"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirmar senha"
          placeholder="Repita a senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
          showToggle={false}
        />

        {serverError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
