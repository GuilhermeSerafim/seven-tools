import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ModuleCard } from '@/components/home/ModuleCard';
import { ToolCard } from '@/components/tools/ToolCard';
import { modules } from '@/data/modules';
import { getToolsByIds } from '@/data/tools';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/auth/AuthContext';
import { proposalService, Proposal } from '@/services/proposalService';
import { motion } from 'framer-motion';
import { getProposalAppPath, getProposalChatPath } from '@/features/comercial/toolRoutes';
import { getLatestProposal } from '@/features/comercial/proposalRecency';

export default function Home() {
  const { favoriteIds } = useFavorites();
  const { user } = useAuth();
  const userId = user?.id;
  const favoriteTools = getToolsByIds(favoriteIds);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      setProposalsLoading(true);
      proposalService
        .getAll(userId)
        .then(setProposals)
        .catch(() => setProposals([]))
        .finally(() => setProposalsLoading(false));
    } else {
      setProposals([]);
      setProposalsLoading(false);
    }
  }, [userId]);

  const latestProposal = getLatestProposal(proposals);
  const firstName = user?.name?.split(' ')[0] ?? '';
  const isLoading = proposalsLoading;

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top, rgba(255,140,26,0.06), transparent 60%)' }}
        />
        <div className="relative container py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/15 backdrop-blur-sm px-4 py-1.5 text-sm text-primary font-medium mb-6 min-h-[34px]">
              {isLoading ? (
                <Skeleton className="h-4 w-40 bg-primary/15" />
              ) : firstName ? (
                <>
                  <span className="text-base leading-none">👋</span>
                  Olá, {firstName} - Hub SEVEN
                </>
              ) : (
                <>
                  <span className="text-base leading-none">✦</span>
                  Hub Exclusivo para Membros
                </>
              )}
            </div>

            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mb-4">
              O Hub Central do Ecossistema{' '}
              <span className="text-gradient-primary">SEVEN</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Ferramentas, IAs e recursos exclusivos organizados por área do negócio. Tudo em um único ambiente premium.
            </p>

            <div className="flex flex-wrap gap-3 min-h-[48px]">
              {isLoading ? (
                <>
                  <Skeleton className="h-11 w-44 rounded-md" />
                  <Skeleton className="h-11 w-40 rounded-md" />
                </>
              ) : proposals.length > 0 ? (
                <>
                  <Link to={getProposalAppPath()}>
                    <Button
                      size="lg"
                      className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Minhas Propostas
                    </Button>
                  </Link>
                  <Link to={getProposalChatPath(latestProposal?.id, 'validate')}>
                    <Button size="lg" variant="outline" className="font-semibold gap-2">
                      <Star className="h-4 w-4" />
                      Validar no Caloni
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/tools">
                  <Button
                    size="lg"
                    className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                  >
                    Ver Ferramentas <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container -mt-2 mb-2">
        {isLoading ? (
          <div className="flex items-center gap-3.5 rounded-xl border border-border/30 bg-card px-5 py-3.5">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <Skeleton className="h-4 flex-1 max-w-xs" />
          </div>
        ) : latestProposal ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link to={getProposalAppPath()}>
              <div className="group flex items-center gap-3.5 rounded-xl border border-border/30 bg-card px-5 py-3.5 hover:border-primary/30 hover:shadow-depth transition-all">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/80 truncate">
                    <span className="font-semibold text-foreground">
                      {proposals.length} {proposals.length === 1 ? 'proposta' : 'propostas'}
                    </span>
                    {' · '}
                    Última:{' '}
                    <span className="font-medium">
                      {latestProposal.title || 'Sem título'}
                    </span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </Link>
          </motion.div>
        ) : null}
      </div>

      <section className="container py-16">
        <SectionHeader
          title="Módulos do Ecossistema"
          subtitle="Navegue pelas áreas do negócio e acesse as ferramentas de cada módulo"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <ModuleCard
                title={mod.name}
                description={mod.description}
                icon={mod.icon}
                to={`/modules/${mod.slug}`}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {favoriteTools.length > 0 && (
        <section className="container py-12">
          <SectionHeader
            title="Seus Favoritos"
            subtitle="Ferramentas que você marcou como favoritas"
            action={
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>
                  {favoriteTools.length} {favoriteTools.length === 1 ? 'ferramenta' : 'ferramentas'}
                </span>
              </div>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteTools.map((tool, i) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <ToolCard tool={tool} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
