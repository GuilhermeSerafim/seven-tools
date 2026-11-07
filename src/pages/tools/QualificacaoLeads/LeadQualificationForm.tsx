import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Settings2 } from "lucide-react";

import { AppLoader } from "@/components/ui/app-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getLeadQualificationConfigPath,
  getLeadQualificationDetailPath,
} from "@/features/comercial/toolRoutes";
import {
  leadQualificationService,
  type LeadQualificationConfig,
  type QualifiedLeadCreateInput,
} from "@/services/leadQualificationService";

const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "200+"];
const URGENCY_OPTIONS = ["alta", "media", "baixa"];
const TIMING_OPTIONS = [
  { value: "imediato", label: "Imediato" },
  { value: "30_dias", label: "30 dias" },
  { value: "45_dias", label: "45 dias" },
  { value: "mais_tarde", label: "Mais tarde" },
];
const PAIN_LEVEL_OPTIONS = ["alta", "media", "baixa"];

function SelectField({
  id,
  value,
  options,
  onChange,
  disabled = false,
}: {
  id: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <option value="">Selecione</option>
      {options.map((option) => {
        const nextValue = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;

        return (
          <option key={nextValue} value={nextValue}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export default function LeadQualificationForm() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LeadQualificationConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [form, setForm] = useState<QualifiedLeadCreateInput>({
    companyName: "",
    contactName: "",
    contactRole: "",
    segment: "",
    companySize: "",
    urgency: "",
    timing: "",
    painLevel: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        setHasLoadError(false);
        const currentConfig = await leadQualificationService.getConfig();
        if (!isMounted) {
          return;
        }

        setConfig(currentConfig);
        if (currentConfig) {
          setForm((current) => ({
            ...current,
            contactRole: current.contactRole || currentConfig.idealRoles[0] || "",
            segment: current.segment || currentConfig.idealSegments[0] || "",
          }));
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setHasLoadError(true);
      } finally {
        if (isMounted) {
          setIsLoadingConfig(false);
        }
      }
    }

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(field: keyof QualifiedLeadCreateInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const isFormIncomplete =
    !form.companyName.trim() ||
    !form.contactName.trim() ||
    !form.contactRole.trim() ||
    !form.segment.trim() ||
    !form.companySize ||
    !form.urgency ||
    !form.timing ||
    !form.painLevel;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isFormIncomplete) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const lead = await leadQualificationService.createLead({
        ...form,
        notes: form.notes?.trim() || undefined,
      });
      navigate(getLeadQualificationDetailPath(lead.id));
    } catch {
      setFeedback("Não foi possível salvar o lead agora.");
      setIsSubmitting(false);
    }
  }

  if (isLoadingConfig) {
    return (
      <div className="container py-10">
        <AppLoader label="Carregando configuração..." size="sm" className="py-10" />
      </div>
    );
  }

  if (hasLoadError) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Settings2 className="h-6 w-6" />
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground">
            Não foi possível carregar a configuração da empresa
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tente novamente em instantes. Se o problema continuar, revise o método comercial antes
            de cadastrar novos leads.
          </p>

          <div className="mt-8">
            <Link to={getLeadQualificationConfigPath()}>
              <Button className="gap-2">
                Abrir configuração
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Settings2 className="h-6 w-6" />
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground">
            Configure o método da empresa antes de cadastrar leads
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Defina o ICP, pesos, faixas e ações para liberar o cadastro manual da fila
            priorizada.
          </p>

          <div className="mt-8">
            <Link to={getLeadQualificationConfigPath()}>
              <Button className="gap-2">
                Ir para configuração
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
        <h1 className="font-display text-3xl font-bold text-foreground">Novo lead manual</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Preencha o formulário padrão da SEVEN com as opções alinhadas ao método configurado pela
          empresa.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da empresa</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Nome do contato</Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactRole">Cargo do contato</Label>
              <SelectField
                id="contactRole"
                value={form.contactRole}
                options={config.idealRoles}
                onChange={(value) => updateField("contactRole", value)}
                disabled={config.idealRoles.length === 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segmento</Label>
              <SelectField
                id="segment"
                value={form.segment}
                options={config.idealSegments}
                onChange={(value) => updateField("segment", value)}
                disabled={config.idealSegments.length === 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companySize">Porte da empresa</Label>
              <SelectField
                id="companySize"
                value={form.companySize}
                options={COMPANY_SIZE_OPTIONS}
                onChange={(value) => updateField("companySize", value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgência</Label>
              <SelectField
                id="urgency"
                value={form.urgency}
                options={URGENCY_OPTIONS}
                onChange={(value) => updateField("urgency", value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timing">Timing</Label>
              <SelectField
                id="timing"
                value={form.timing}
                options={TIMING_OPTIONS}
                onChange={(value) => updateField("timing", value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="painLevel">Nível de dor</Label>
              <SelectField
                id="painLevel"
                value={form.painLevel}
                options={PAIN_LEVEL_OPTIONS}
                onChange={(value) => updateField("painLevel", value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Contexto complementar do SDR, origem do lead, objeções ou sinais de fit."
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {feedback ?? "Ao salvar, o lead entra imediatamente na fila compartilhada da empresa."}
            </p>
            <Button type="submit" disabled={isSubmitting || isFormIncomplete}>
              {isSubmitting ? "Salvando..." : "Salvar lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
