// ─── Proposal PDF Document ────────────────────────────────────────────────────
// Rendered via @react-pdf/renderer — real PDF bytecode, not a screenshot.
// Loaded lazily from ProposalView. Never rendered to DOM.

import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';
import type { Proposal } from '@/services/proposalService';
import { STATUS_LABELS } from '@/services/proposalService';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  brand:    '#FF8C1A',
  brandBg:  '#FFF7ED',
  brandBorder: '#FED7AA',
  text:     '#111827',
  body:     '#374151',
  muted:    '#6B7280',
  mutedBg:  '#F9FAFB',
  border:   '#E5E7EB',
  white:    '#FFFFFF',
  // status
  approved: '#16A34A',
  rejected: '#DC2626',
  ready:    '#2563EB',
  sent:     '#D97706',
  draft:    '#6B7280',
} as const;

function statusColor(status: string): string {
  const map: Record<string, string> = {
    approved: C.approved,
    rejected: C.rejected,
    ready:    C.ready,
    sent:     C.sent,
    draft:    C.draft,
  };
  return map[status] ?? C.muted;
}

function formatDate(ts: string | number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.white,
    paddingTop: 40,
    paddingBottom: 52,
    paddingHorizontal: 48,
    fontSize: 9,
    color: C.text,
    lineHeight: 1.5,
  },

  // Document header (brand + date)
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
    paddingBottom: 14,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: C.brand,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerDate: {
    fontSize: 7.5,
    color: C.muted,
  },
  headerCompany: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 2,
  },

  // Status badge
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Title block
  proposalTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 24,
    color: C.text,
    lineHeight: 1.2,
    marginBottom: 8,
  },
  metaRow: {
    fontSize: 7.5,
    color: C.muted,
    marginBottom: 2,
  },

  // Section divider
  divider: {
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    marginVertical: 20,
  },

  // Section label
  sectionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.brand,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  sectionBlock: {
    marginBottom: 20,
  },

  // Client card
  clientCard: {
    backgroundColor: C.mutedBg,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 14,
  },
  clientRow: {
    flexDirection: 'row',
    gap: 20,
  },
  clientCol: {
    flex: 1,
  },
  clientName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: C.text,
    marginBottom: 3,
  },
  clientSub: {
    fontSize: 8.5,
    color: C.muted,
    marginBottom: 2,
  },

  // Finance cards
  financeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  financeCard: {
    flex: 1,
    backgroundColor: C.brandBg,
    borderColor: C.brandBorder,
    borderWidth: 1,
    borderRadius: 6,
    padding: 14,
  },
  financeLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.brand,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  financeValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 15,
    color: C.text,
    lineHeight: 1.2,
  },

  // Body text
  bodyText: {
    fontSize: 9,
    color: C.body,
    lineHeight: 1.7,
  },

  // Scope card
  scopeCard: {
    backgroundColor: C.mutedBg,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 14,
  },

  // Footer (fixed on every page)
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopColor: C.border,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 6.5,
    color: C.muted,
  },
});

// ─── Document component ───────────────────────────────────────────────────────

interface ProposalPDFProps {
  proposal: Proposal;
  companyName?: string;
}

export function ProposalPDFDocument({ proposal, companyName }: ProposalPDFProps) {
  const statusCol  = statusColor(proposal.status);
  const statusBg   = `${statusCol}18`;
  const hasClient  = !!(proposal.clientName || proposal.clientCompany || proposal.clientEmail || proposal.clientPhone);
  const hasFinance = !!(proposal.value || proposal.deadline);

  return (
    <Document
      title={proposal.title || 'Proposta Comercial'}
      author={companyName || 'SEVEN Tools'}
      creator="SEVEN Tools Hub"
      subject="Proposta Comercial"
    >
      <Page size="A4" style={s.page}>

        {/* ── Document header ────────────────────────────────────── */}
        <View style={s.docHeader} fixed>
          <View>
            <Text style={s.brandName}>SEVEN Tools</Text>
            <Text style={s.brandSub}>Hub de Ferramentas Comerciais</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDate}>Emitida em {formatDate(proposal.createdAt)}</Text>
            {companyName && (
              <Text style={s.headerCompany}>Por {companyName}</Text>
            )}
          </View>
        </View>

        {/* ── Proposal header ─────────────────────────────────────── */}
        <View>
          {/* Status */}
          <View style={[s.statusBadge, { borderColor: statusCol, backgroundColor: statusBg }]}>
            <Text style={[s.statusText, { color: statusCol }]}>
              {STATUS_LABELS[proposal.status as keyof typeof STATUS_LABELS] ?? proposal.status}
            </Text>
          </View>

          {/* Title */}
          <Text style={s.proposalTitle}>{proposal.title || 'Sem título'}</Text>

          {/* Meta */}
          <Text style={s.metaRow}>
            {`Criada em ${formatDate(proposal.createdAt)}${
              proposal.updatedAt !== proposal.createdAt
                ? `  ·  Atualizada em ${formatDate(proposal.updatedAt)}`
                : ''
            }`}
          </Text>
        </View>

        <View style={s.divider} />

        {/* ── Cliente ─────────────────────────────────────────────── */}
        {hasClient && (
          <View style={s.sectionBlock}>
            <Text style={s.sectionLabel}>Para</Text>
            <View style={s.clientCard}>
              <View style={s.clientRow}>
                {(proposal.clientName || proposal.clientCompany) && (
                  <View style={s.clientCol}>
                    {proposal.clientName && (
                      <Text style={s.clientName}>{proposal.clientName}</Text>
                    )}
                    {proposal.clientCompany && (
                      <Text style={s.clientSub}>{proposal.clientCompany}</Text>
                    )}
                  </View>
                )}
                {(proposal.clientEmail || proposal.clientPhone) && (
                  <View style={s.clientCol}>
                    {proposal.clientEmail && (
                      <Text style={s.clientSub}>{proposal.clientEmail}</Text>
                    )}
                    {proposal.clientPhone && (
                      <Text style={s.clientSub}>{proposal.clientPhone}</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── Condições ───────────────────────────────────────────── */}
        {hasFinance && (
          <View style={s.sectionBlock}>
            <Text style={s.sectionLabel}>Condições</Text>
            <View style={s.financeRow}>
              {proposal.value && (
                <View style={s.financeCard}>
                  <Text style={s.financeLabel}>Valor</Text>
                  <Text style={s.financeValue}>{proposal.value}</Text>
                </View>
              )}
              {proposal.deadline && (
                <View style={s.financeCard}>
                  <Text style={s.financeLabel}>Prazo</Text>
                  <Text style={s.financeValue}>{proposal.deadline}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Descrição do projeto ─────────────────────────────────── */}
        {proposal.projectDescription && (
          <View style={s.sectionBlock}>
            <Text style={s.sectionLabel}>Descrição do Projeto</Text>
            <Text style={s.bodyText}>{proposal.projectDescription}</Text>
          </View>
        )}

        {/* ── Escopo / Entregas ────────────────────────────────────── */}
        {proposal.scope && (
          <View style={s.sectionBlock}>
            <Text style={s.sectionLabel}>Escopo / Entregas</Text>
            <View style={s.scopeCard}>
              <Text style={s.bodyText}>{proposal.scope}</Text>
            </View>
          </View>
        )}

        {/* ── Footer (fixed on every page) ─────────────────────────── */}
        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>
            Documento gerado pelo SEVEN Tools Hub · Todos os dados são de responsabilidade do emissor.
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
}
