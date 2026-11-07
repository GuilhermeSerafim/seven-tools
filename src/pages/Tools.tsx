import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ModuleCard } from '@/components/home/ModuleCard';
import { modules } from '@/data/modules';
import { useAuth } from '@/auth/AuthContext';
import { proposalService, Proposal, STATUS_LABELS, STATUS_COLORS } from '@/services/proposalService';
import { motion } from 'framer-motion';
import { getProposalAppPath, getProposalChatPath } from '@/features/comercial/toolRoutes';
import { getLatestProposal } from '@/features/comercial/proposalRecency';

export default function Tools() {
  const { user } = useAuth();
  const userId = user?.id;
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    if (userId) {
      proposalService.getAll(userId).then(setProposals).catch(() => setProposals([]));
    } else {
      setProposals([]);
    }
  }, [userId]);

  const latestProposal = getLatestProposal(proposals);

  return (
    <div className="container py-8">
      <SectionHeader
        title="Ferramentas"
        subtitle="Selecione um módulo para acessar as ferramentas da área"
      />

      {proposals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/15 bg-primary/5 shadow-depth px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">Proposta Comercial Smart</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    {proposals.length} {proposals.length === 1 ? 'proposta criada' : 'propostas criadas'}
                  </p>
                  {latestProposal && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 ${STATUS_COLORS[latestProposal.status]}`}
                      >
                        {STATUS_LABELS[latestProposal.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                        {latestProposal.title || 'Sem título'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {latestProposal && (
                <Link to={getProposalChatPath(latestProposal.id, 'validate')}>
                  <Button variant="ghost" size="sm" className="gap-2 text-xs">
                    <Star className="h-3.5 w-3.5" />
                    Validar no Caloni
                  </Button>
                </Link>
              )}
              <Link to={getProposalAppPath()}>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  Ver propostas <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

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
    </div>
  );
}
