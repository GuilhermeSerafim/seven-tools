import { AlertCircle, CheckCircle2, Lightbulb, Sparkles, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CalonAnalysis } from '@/services/calonService';

function getScoreColor(score: number): string {
  if (score >= 9) return 'text-emerald-400';
  if (score >= 7) return 'text-primary';
  if (score >= 5) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 9) return 'bg-emerald-400';
  if (score >= 7) return 'bg-primary';
  if (score >= 5) return 'bg-amber-400';
  return 'bg-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 9) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 7) return 'bg-primary/10 border-primary/20';
  if (score >= 5) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export interface CaloniResultCardProps {
  result: CalonAnalysis;
  className?: string;
}

export function CaloniResultCard({ result, className }: CaloniResultCardProps) {
  return (
    <section
      data-testid="caloni-guided-report"
      className={cn(
        'mt-4 overflow-hidden rounded-[28px] border border-border/30 bg-card/70 p-5 shadow-sm backdrop-blur sm:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 border-b border-border/20 pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Leitura geral
            </span>
            <h3 className="text-2xl font-semibold leading-tight text-foreground">{result.overallLabel}</h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Esta e a visao consolidada da proposta a partir dos criterios do Metodo Caloni.
            </p>
          </div>

          <div className={cn('rounded-3xl border px-5 py-4 text-left sm:min-w-[15rem]', getScoreBg(result.overallScore))}>
            <div className="flex items-end gap-2">
              <span className={cn('font-display text-5xl font-extrabold leading-none', getScoreColor(result.overallScore))}>
                {result.overallScore.toFixed(1)}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">/10</span>
            </div>
            <p className={cn('mt-2 text-base font-semibold', getScoreColor(result.overallScore))}>
              {result.overallLabel}
            </p>
          </div>
        </div>

        {result.criteria.length > 0 ? (
          <section className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Star className="h-4 w-4 text-primary" /> Criterios observados
            </p>
            <div className="space-y-3">
              {result.criteria.map((criterion) => (
                <article
                  key={criterion.name}
                  className="rounded-2xl border border-border/20 bg-background/40 px-4 py-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">{criterion.name}</span>
                    <span className={cn('text-sm font-bold tabular-nums', getScoreColor(criterion.score))}>
                      {criterion.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${criterion.score * 10}%` }}
                      transition={{ duration: 0.6 }}
                      className={cn('h-full rounded-full', getScoreBarColor(criterion.score))}
                    />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{criterion.comment}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {result.strongPoints.length > 0 || result.weakPoints.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {result.strongPoints.length > 0 ? (
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <TrendingUp className="h-4 w-4" /> Pontos fortes
                </p>
                <ul className="space-y-2">
                  {result.strongPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm leading-6 text-foreground/85">
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {result.weakPoints.length > 0 ? (
              <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                  <TrendingDown className="h-4 w-4" /> Pontos de atencao
                </p>
                <ul className="space-y-2">
                  {result.weakPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm leading-6 text-foreground/85">
                      <AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-red-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}

        {result.suggestions.length > 0 ? (
          <section className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lightbulb className="h-4 w-4 text-primary" /> Proximos ajustes recomendados
            </p>
            <ol className="space-y-3">
              {result.suggestions.map((suggestion, index) => (
                <li key={suggestion} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  {suggestion}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </section>
  );
}
