import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_LEAD_QUALIFICATION_CONFIG_INPUT,
  mapLeadQualificationConfigToInput,
} from "@/features/comercial/leadQualificationDefaults";
import {
  leadQualificationService,
  type LeadAction,
  type LeadQualificationConfigInput,
} from "@/services/leadQualificationService";

const ACTION_OPTIONS: Array<{ value: LeadAction; label: string }> = [
  { value: "abordar_agora", label: "Abordar agora" },
  { value: "revisar_manualmente", label: "Revisar manualmente" },
  { value: "nutrir", label: "Nutrir" },
  { value: "descartar", label: "Descartar" },
];

function formatList(values: string[]) {
  return values.join(", ");
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ActionSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: LeadAction;
  onChange: (value: LeadAction) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as LeadAction)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {ACTION_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function LeadQualificationConfig() {
  const [form, setForm] = useState<LeadQualificationConfigInput>(
    DEFAULT_LEAD_QUALIFICATION_CONFIG_INPUT,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        const config = await leadQualificationService.getConfig();
        if (!isMounted || !config) {
          return;
        }

        setForm(mapLeadQualificationConfigToInput(config));
      } catch {
        if (isMounted) {
          setFeedback("Não foi possível carregar a configuração atual.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateNumberField(field: keyof LeadQualificationConfigInput, value: string) {
    setForm((current) => ({
      ...current,
      [field]: Number(value) || 0,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await leadQualificationService.upsertConfig(form);
      setFeedback("Configuração salva com sucesso.");
    } catch {
      setFeedback("Não foi possível salvar a configuração.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="container py-10">
      <div className="rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Configuração do Radar de Leads
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Defina ICP, pesos, faixas de score e ações recomendadas para liberar a fila compartilhada.
        </p>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="idealSegments">Segmentos ICP</Label>
              <Input
                id="idealSegments"
                value={formatList(form.idealSegments)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, idealSegments: parseList(event.target.value) }))
                }
                placeholder="Tech, SaaS"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idealCompanySizes">Portes ICP</Label>
              <Input
                id="idealCompanySizes"
                value={formatList(form.idealCompanySizes)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    idealCompanySizes: parseList(event.target.value),
                  }))
                }
                placeholder="11-50, 51-200"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idealRoles">Perfis ICP</Label>
              <Input
                id="idealRoles"
                value={formatList(form.idealRoles)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, idealRoles: parseList(event.target.value) }))
                }
                placeholder="Founder, Head of Growth"
                disabled={isLoading}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Pesos do score</h2>
              <p className="text-sm text-muted-foreground">
                Ajuste quanto cada critério impacta a nota final do lead.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="weightSegment">Peso do segmento</Label>
                <Input
                  id="weightSegment"
                  type="number"
                  value={form.weightSegment}
                  onChange={(event) => updateNumberField("weightSegment", event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightCompanySize">Peso do porte</Label>
                <Input
                  id="weightCompanySize"
                  type="number"
                  value={form.weightCompanySize}
                  onChange={(event) => updateNumberField("weightCompanySize", event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightRole">Peso do perfil</Label>
                <Input
                  id="weightRole"
                  type="number"
                  value={form.weightRole}
                  onChange={(event) => updateNumberField("weightRole", event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightUrgency">Peso da urgência</Label>
                <Input
                  id="weightUrgency"
                  type="number"
                  value={form.weightUrgency}
                  onChange={(event) => updateNumberField("weightUrgency", event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightTiming">Peso do timing</Label>
                <Input
                  id="weightTiming"
                  type="number"
                  value={form.weightTiming}
                  onChange={(event) => updateNumberField("weightTiming", event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightPainLevel">Peso da dor</Label>
                <Input
                  id="weightPainLevel"
                  type="number"
                  value={form.weightPainLevel}
                  onChange={(event) => updateNumberField("weightPainLevel", event.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Faixas e ações</h2>
              <p className="text-sm text-muted-foreground">
                Configure os cortes de score e o que o time comercial deve fazer em cada faixa.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bronzeMax">Bronze max</Label>
                <Input
                  id="bronzeMax"
                  type="number"
                  value={form.bronzeMax}
                  onChange={(event) => updateNumberField("bronzeMax", event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="silverMax">Prata max</Label>
                <Input
                  id="silverMax"
                  type="number"
                  value={form.silverMax}
                  onChange={(event) => updateNumberField("silverMax", event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goldMax">Ouro max</Label>
                <Input
                  id="goldMax"
                  type="number"
                  value={form.goldMax}
                  onChange={(event) => updateNumberField("goldMax", event.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="bronzeAction">Ação bronze</Label>
                <ActionSelect
                  id="bronzeAction"
                  value={form.bronzeAction}
                  onChange={(value) => setForm((current) => ({ ...current, bronzeAction: value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="silverAction">Ação prata</Label>
                <ActionSelect
                  id="silverAction"
                  value={form.silverAction}
                  onChange={(value) => setForm((current) => ({ ...current, silverAction: value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goldAction">Ação ouro</Label>
                <ActionSelect
                  id="goldAction"
                  value={form.goldAction}
                  onChange={(value) => setForm((current) => ({ ...current, goldAction: value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diamondAction">Ação diamante</Label>
                <ActionSelect
                  id="diamondAction"
                  value={form.diamondAction}
                  onChange={(value) => setForm((current) => ({ ...current, diamondAction: value }))}
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-border/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {feedback ?? "A configuração é compartilhada por toda a empresa nesta V1."}
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar configuração"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
