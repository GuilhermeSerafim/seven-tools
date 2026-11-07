import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Download, Loader2,
  Mail, Phone, User,
  DollarSign, Clock,
  Circle, FileCheck, Send, CheckCircle2, XCircle,
  AlertCircle, Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/auth/AuthContext';
import { proposalService, Proposal, ProposalStatus, STATUS_LABELS, STATUS_COLORS } from '@/services/proposalService';
import { Button } from '@/components/ui/button';
import { AppLoader } from '@/components/ui/app-loader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getProposalAppPath, getProposalChatPath } from '@/features/comercial/toolRoutes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_ICONS: Record<ProposalStatus, React.ReactNode> = {
  draft:    <Circle       className="h-3.5 w-3.5" />,
  ready:    <FileCheck    className="h-3.5 w-3.5" />,
  sent:     <Send         className="h-3.5 w-3.5" />,
  approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  rejected: <XCircle      className="h-3.5 w-3.5" />,
};

function formatDateShort(ts: string | number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DocSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="print-section space-y-3">
      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] print:text-[#FF8C1A]">
        {label}
      </p>
      {children}
    </section>
  );
}

function HighlightCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-border/30 bg-primary/5 p-4 print:border-gray-300 print:bg-gray-50">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-primary print:text-[#FF8C1A]" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider print:text-[#FF8C1A]">
          {label}
        </span>
      </div>
      <p className="font-display font-bold text-lg leading-tight break-words">{value}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProposalView() {
  const { user, company } = useAuth();
  const navigate = useNavigate();
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user && proposalId) {
      setLoading(true);
      proposalService.getById(user.id, proposalId)
        .then((p) => setProposal(p ?? null))
        .finally(() => setLoading(false));
    }
  }, [user, proposalId]);

  const handleExportPDF = async () => {
    if (!proposal) return;
    setExporting(true);
    try {
      const [{ pdf }, { ProposalPDFDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ProposalPDF'),
      ]);
      const blob = await pdf(
        <ProposalPDFDocument proposal={proposal} companyName={company?.name} />,
      ).toBlob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${(proposal.title || 'proposta').replace(/[^\w\s-]/g, '').trim()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[ProposalView] Erro ao gerar PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !proposalId) return;
    if (window.confirm('Excluir esta proposta? Esta ação não pode ser desfeita.')) {
      await proposalService.remove(user.id, proposalId);
      navigate(getProposalAppPath());
    }
  };

  if (loading) {
    return (
      <div className="container">
        <AppLoader label="Carregando proposta..." size="sm" className="py-16" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container py-16 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,140,26,0.1)]">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-muted-foreground font-medium">Proposta não encontrada.</p>
        <Link to={getProposalAppPath()}>
          <Button variant="outline" size="sm" className="hover:-translate-y-0.5 transition-all gap-2">
            <ArrowLeft className="h-4 w-4" /> Ver todas
          </Button>
        </Link>
      </div>
    );
  }

  const hasClient   = !!(proposal.clientName || proposal.clientCompany || proposal.clientEmail || proposal.clientPhone);
  const hasFinance  = !!(proposal.value || proposal.deadline);
  const hasProject  = !!(proposal.projectDescription || proposal.scope);
  const hasNotes    = !!proposal.notes?.trim();
  const validationLabel = proposal.status === 'ready' ? 'Validar antes de enviar' : 'Validar no Caloni';
  const validationIsPrimary = proposal.status !== 'draft';

  return (
    <div className="container py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* ── Action bar (hidden on print) ──────────────────────────────── */}
        <div className="no-print flex items-center justify-between mb-6 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-primary"
            onClick={() => navigate(getProposalAppPath())}
          >
            <ArrowLeft className="h-4 w-4" /> Minhas propostas
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:-translate-y-0.5 transition-all"
              onClick={handleExportPDF}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Gerando…</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar PDF</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
            <Button
              variant={validationIsPrimary ? 'default' : 'outline'}
              size="sm"
              className={
                validationIsPrimary
                  ? 'gap-2 gradient-primary text-primary-foreground font-semibold hover:-translate-y-0.5 transition-all'
                  : 'gap-2 text-primary border-primary/30 hover:bg-primary/10 hover:text-primary hover:-translate-y-0.5 transition-all'
              }
              onClick={() => proposalId && navigate(getProposalChatPath(proposalId, 'validate'))}
            >
              <Star className="h-4 w-4" /> {validationLabel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:-translate-y-0.5 transition-all"
              onClick={() => proposalId && navigate(getProposalChatPath(proposalId, 'edit'))}
            >
              <Edit className="h-4 w-4" /> Editar
            </Button>
          </div>
        </div>

        {/* ── Document card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/30 bg-card shadow-premium overflow-hidden print:border-gray-300 print:shadow-none print:rounded-none">

          {/* Print-only document header */}
          <div className="hidden print:flex items-center justify-between px-8 pt-6 pb-4 border-b border-gray-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF8C1A]">
                SEVEN Tools
              </p>
              <p className="text-xs text-gray-500">Hub de Ferramentas Comerciais</p>
            </div>
            <p className="text-xs text-gray-400">
              Emitida em {formatDateShort(proposal.createdAt)}
            </p>
          </div>

          {/* Proposal header */}
          <div className="px-6 pt-6 pb-5 print:px-8 print:pt-6">
            {/* Status badge */}
            <div className="mb-3">
              <Badge
                variant="outline"
                className={`gap-1.5 text-xs px-2.5 py-1 ${STATUS_COLORS[proposal.status]}`}
              >
                {STATUS_ICONS[proposal.status]}
                {STATUS_LABELS[proposal.status]}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="font-display font-bold text-2xl md:text-3xl leading-tight break-words mb-3">
              {proposal.title || 'Sem título'}
            </h1>

            {/* Meta row */}
            <p className="text-xs text-muted-foreground print:text-gray-500">
              Criada em {formatDateShort(proposal.createdAt)}
              {proposal.updatedAt !== proposal.createdAt && (
                <> · Atualizada em {formatDateShort(proposal.updatedAt)}</>
              )}
              {company && (
                <> · Emitida por <span className="font-medium text-foreground print:text-black">{company.name}</span></>
              )}
            </p>
          </div>

          <Separator className="print:border-gray-200" />

          {/* Body sections */}
          <div className="px-6 py-6 space-y-7 print:px-8 print:py-6">

            {/* Client */}
            {hasClient && (
              <DocSection label="Para">
                <div className="rounded-xl border border-border/30 bg-surface p-4 print:border-gray-200 print:bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {proposal.clientName && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 print:text-gray-400" />
                        <div>
                          <p className="font-display font-semibold text-base leading-tight">{proposal.clientName}</p>
                          {proposal.clientCompany && (
                            <p className="text-sm text-muted-foreground print:text-gray-500">{proposal.clientCompany}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {proposal.clientEmail && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground print:text-gray-600">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {proposal.clientEmail}
                        </p>
                      )}
                      {proposal.clientPhone && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground print:text-gray-600">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {proposal.clientPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </DocSection>
            )}

            {/* Value + Deadline highlight */}
            {hasFinance && (
              <DocSection label="Condições">
                <div className="flex gap-3 flex-wrap">
                  {proposal.value && (
                    <HighlightCard icon={DollarSign} label="Valor" value={proposal.value} />
                  )}
                  {proposal.deadline && (
                    <HighlightCard icon={Clock} label="Prazo" value={proposal.deadline} />
                  )}
                </div>
              </DocSection>
            )}

            {/* Project */}
            {proposal.projectDescription && (
              <DocSection label="Descrição do projeto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 print:text-gray-700">
                  {proposal.projectDescription}
                </p>
              </DocSection>
            )}

            {/* Scope */}
            {proposal.scope && (
              <DocSection label="Escopo / Entregas">
                <div className="rounded-xl border border-border/30 bg-surface p-4 print:border-gray-200 print:bg-white">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 print:text-gray-700">
                    {proposal.scope}
                  </p>
                </div>
              </DocSection>
            )}

            {/* Notes — internal, hidden on print */}
            {hasNotes && (
              <div className="no-print">
                <DocSection label="Notas internas">
                  <div className="rounded-xl border border-dashed border-border/30 bg-surface p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Visível apenas para você · não aparece na impressão
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {proposal.notes}
                    </p>
                  </div>
                </DocSection>
              </div>
            )}

          </div>

          {/* Print footer */}
          <div className="hidden print:block px-8 py-4 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 text-center">
              Documento gerado pelo SEVEN Tools Hub · Todos os dados são de responsabilidade do emissor.
            </p>
          </div>
        </div>

        {/* ── Coming soon block (hidden on print) ──────────────────────── */}
        <div className="no-print mt-5 rounded-xl border border-dashed border-border/30 p-5 text-center space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Em breve nesta proposta</p>
          <p className="text-xs text-muted-foreground">
            Assinatura digital · Link de rastreamento · Envio por e-mail
          </p>
        </div>

      </motion.div>
    </div>
  );
}
