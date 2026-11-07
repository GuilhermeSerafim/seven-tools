import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Clock, ChevronRight, Trash2, ChevronDown,
  Check, Circle, FileCheck, Send, CheckCircle2, XCircle, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/auth/AuthContext';
import {
  proposalService,
  Proposal,
  ProposalStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/services/proposalService';
import { Button } from '@/components/ui/button';
import { AppLoader } from '@/components/ui/app-loader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getProposalChatPath,
  getProposalViewPath,
} from '@/features/comercial/toolRoutes';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER: ProposalStatus[] = ['draft', 'ready', 'sent', 'approved', 'rejected'];

const STATUS_ICONS: Record<ProposalStatus, React.ReactNode> = {
  draft:    <Circle       className="h-3 w-3" />,
  ready:    <FileCheck    className="h-3 w-3" />,
  sent:     <Send         className="h-3 w-3" />,
  approved: <CheckCircle2 className="h-3 w-3" />,
  rejected: <XCircle      className="h-3 w-3" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: string | number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Status dropdown ──────────────────────────────────────────────────────────

interface StatusDropdownProps {
  proposal: Proposal;
  onStatusChange: (id: string, status: ProposalStatus) => void;
}

function StatusDropdown({ proposal, onStatusChange }: StatusDropdownProps) {
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={stop}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${STATUS_COLORS[proposal.status]}`}
        >
          {STATUS_ICONS[proposal.status]}
          <span>{STATUS_LABELS[proposal.status]}</span>
          <ChevronDown className="h-3 w-3 opacity-50 ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44" onClick={stop}>
        {STATUS_ORDER.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={(e) => {
              stop(e);
              if (status !== proposal.status) {
                onStatusChange(proposal.id, status);
              }
            }}
            className="gap-2 cursor-pointer"
          >
            <span className={`flex items-center gap-1.5 flex-1 text-xs ${STATUS_COLORS[status].split(' ')[0]}`}>
              {STATUS_ICONS[status]}
              {STATUS_LABELS[status]}
            </span>
            {proposal.status === status && (
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProposalList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [justUpdated, setJustUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLoading(true);
      proposalService.getAll(user.id)
        .then(setProposals)
        .catch(() => setProposals([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (window.confirm('Excluir esta proposta?')) {
      await proposalService.remove(user.id, id);
      proposalService.getAll(user.id).then(setProposals).catch(() => {});
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    if (!user) return;
    await proposalService.update(user.id, id, { status: newStatus });
    proposalService.getAll(user.id).then(setProposals).catch(() => {});
    setJustUpdated(id);
    setTimeout(() => setJustUpdated(null), 1500);
  };

  return (
    <div className="container py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl mb-1">Minhas Propostas</h1>
            <p className="text-muted-foreground text-sm">
              {loading
                ? 'Carregando...'
                : proposals.length === 0
                  ? 'Nenhuma proposta criada ainda.'
                  : `${proposals.length} proposta${proposals.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {proposals.length > 0 && (
              <Button
                onClick={() => navigate(getProposalChatPath(undefined, 'validate'))}
                variant="outline"
                className="gap-2 text-sm"
              >
                <Star className="h-4 w-4" /> Revisar com Caloni
              </Button>
            )}
            <Button
              onClick={() => navigate(getProposalChatPath())}
              className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all gap-2"
            >
              <Plus className="h-4 w-4" /> Nova Proposta
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <AppLoader label="Carregando propostas..." size="sm" className="py-20" />
        )}

        {/* Empty state */}
        {!loading && proposals.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,140,26,0.1)]">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <p className="font-display font-semibold text-lg mb-1">Nenhuma proposta ainda</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                Crie sua primeira proposta comercial profissional agora mesmo.
              </p>
            </div>
            <Button
              onClick={() => navigate(getProposalChatPath())}
              className="gradient-primary text-primary-foreground font-semibold mt-2 gap-2 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-4 w-4" /> Criar primeira proposta
            </Button>
          </div>
        )}

        {/* Proposal list */}
        {proposals.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {proposals.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, layout: { duration: 0.2 } }}
                >
                  {/* div + onClick instead of Link to avoid nested interactive element conflicts */}
                  <div
                    onClick={() => navigate(getProposalViewPath(p.id))}
                    className={`group relative flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all duration-300 ${
                      justUpdated === p.id
                        ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/10'
                        : 'border-border/30 bg-card hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-depth'
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <FileText className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title + client */}
                      <p className="font-display font-semibold truncate leading-snug">
                        {p.title || 'Sem título'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {p.clientName
                          ? `${p.clientName}${p.clientCompany ? ` · ${p.clientCompany}` : ''}`
                          : 'Cliente não informado'}
                      </p>

                      {/* Status + meta row */}
                      <div
                        className="flex items-center gap-3 mt-2.5 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Inline status dropdown */}
                        <StatusDropdown proposal={p} onStatusChange={handleStatusChange} />

                        {/* Value */}
                        {p.value && (
                          <span className="text-xs text-muted-foreground">
                            {p.value}
                          </span>
                        )}

                        {/* Updated at */}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(p.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      <button
                        onClick={(e) => handleDelete(e, p.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir proposta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </motion.div>
    </div>
  );
}
