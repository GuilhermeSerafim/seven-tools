import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/auth/AuthContext';
import { CategoryBadge } from '@/components/tools/CategoryBadge';
import { FavoriteButton } from '@/components/tools/FavoriteButton';
import { StatusBadge } from '@/components/tools/StatusBadge';
import { ToolCard } from '@/components/tools/ToolCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { getModuleBySlug } from '@/data/modules';
import { getToolsByCategory } from '@/data/tools';
import { type Tool } from '@/data/types';
import { getLatestProposal } from '@/features/comercial/proposalRecency';
import { getProposalAppPath, getProposalChatPath } from '@/features/comercial/toolRoutes';
import { getIconByName } from '@/lib/iconRegistry';
import {
  proposalService,
  type Proposal,
  STATUS_COLORS,
  STATUS_LABELS,
  type ProposalStatus,
} from '@/services/proposalService';

interface PropostaToolCardProps {
  tool: Tool;
  proposalCount: number;
  latestStatus: ProposalStatus | null;
  latestTitle: string;
  isLoading: boolean;
}

function PropostaToolCard({
  tool,
  proposalCount,
  latestStatus,
  latestTitle,
  isLoading,
}: PropostaToolCardProps) {
  const navigate = useNavigate();
  const IconComponent = getIconByName(tool.icon);
  const hasActivity = proposalCount > 0;

  return (
    <div
      onClick={() => navigate(`/tools/${tool.slug}`)}
      className="group relative flex h-full min-h-[220px] cursor-pointer flex-col rounded-xl border border-border/30 bg-card p-5 shadow-depth transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 glow-primary-sm" />

      <div className="relative flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-display text-sm font-semibold leading-tight">{tool.name}</h3>
              <CategoryBadge category={tool.category} className="mt-1" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1" onClick={(event) => event.stopPropagation()}>
            <StatusBadge status={tool.status} />
            <FavoriteButton toolId={tool.id} />
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{tool.shortDescription}</p>

        {isLoading ? (
          <div
            className="rounded-lg border border-primary/10 bg-primary/5 px-3 py-2"
            data-testid="proposal-card-loading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3 w-14 bg-primary/15" />
                <Skeleton className="h-3 w-full max-w-[180px] bg-primary/10" />
              </div>
              <Skeleton className="h-4 w-16 rounded-full bg-primary/15" />
            </div>
          </div>
        ) : hasActivity && latestStatus ? (
          <div
            className="flex items-center justify-between gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 text-xs font-bold tabular-nums text-primary">{proposalCount}</span>
              <span className="truncate text-xs text-muted-foreground">
                {proposalCount === 1 ? 'proposta' : 'propostas'}
                {latestTitle && (
                  <>
                    {' '}
                    · <span className="text-foreground/70">{latestTitle}</span>
                  </>
                )}
              </span>
            </div>
            <Badge
              variant="outline"
              className={`h-4 shrink-0 px-1.5 py-0 text-[10px] ${STATUS_COLORS[latestStatus]}`}
            >
              {STATUS_LABELS[latestStatus]}
            </Badge>
          </div>
        ) : null}

        <div className="mt-auto flex min-h-9 items-center gap-2 pt-2" onClick={(event) => event.stopPropagation()}>
          {isLoading ? (
            <div className="flex items-center gap-2" data-testid="proposal-card-footer-skeleton">
              <Skeleton className="h-8 w-28 bg-muted/80" />
              <Skeleton className="h-8 w-24 bg-primary/10" />
            </div>
          ) : (
            <>
              {hasActivity && (
                <Link to={getProposalAppPath()}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    Abrir propostas
                  </button>
                </Link>
              )}
              <Link to={getProposalChatPath()}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <Plus className="h-3 w-3" /> {hasActivity ? 'Nova proposta' : 'Criar proposta'}
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModulePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const module = getModuleBySlug(slug || '');
  const userId = user?.id;
  const isComercial = slug === 'comercial';

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (isComercial && userId) {
      setIsLoadingProposals(true);

      proposalService
        .getAll(userId)
        .then((items) => {
          if (!cancelled) {
            setProposals(items);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setProposals([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoadingProposals(false);
          }
        });
    } else {
      setProposals([]);
      setIsLoadingProposals(false);
    }

    return () => {
      cancelled = true;
    };
  }, [isComercial, userId]);

  const proposalCount = proposals.length;
  const latestProposal = getLatestProposal(proposals);

  if (!module) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Módulo não encontrado.</p>
        <Link to="/hub">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao início
          </Button>
        </Link>
      </div>
    );
  }

  const IconComponent = getIconByName(module.icon);
  const moduleTools = getToolsByCategory(module.category);
  let moduleToolsSubtitle = 'Novas ferramentas chegando em breve';

  if (moduleTools.length > 0) {
    const toolCountLabel = moduleTools.length === 1 ? 'ferramenta disponível' : 'ferramentas disponíveis';
    moduleToolsSubtitle = `${moduleTools.length} ${toolCountLabel}`;
  }

  return (
    <div className="container py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/hub" className="transition-colors duration-200 hover:text-primary">
          Início
        </Link>
        <span>/</span>
        <span className="text-foreground">{module.name}</span>
      </nav>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-10 flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,140,26,0.1)]">
            <IconComponent className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">{module.name}</h1>
            <p className="mt-1 text-muted-foreground">{module.description}</p>
          </div>
        </div>

        <SectionHeader
          title="Ferramentas do Módulo"
          subtitle={moduleToolsSubtitle}
        />

        {moduleTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moduleTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                className="h-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                {isComercial && tool.slug === 'proposta-comercial-smart' ? (
                  <PropostaToolCard
                    tool={tool}
                    proposalCount={proposalCount}
                    latestStatus={latestProposal?.status ?? null}
                    latestTitle={latestProposal?.title ?? ''}
                    isLoading={isLoadingProposals}
                  />
                ) : (
                  <ToolCard tool={tool} />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/30 bg-card py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <IconComponent className="h-7 w-7" />
            </div>
            <div>
              <p className="font-display text-base font-semibold">Em breve</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                As ferramentas do módulo {module.name} estão sendo preparadas e estarão disponíveis em breve.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
