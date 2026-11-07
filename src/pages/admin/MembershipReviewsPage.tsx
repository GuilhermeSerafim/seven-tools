import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { membershipReviewService } from "@/admin/membershipReviewService";
import type { MembershipReviewRow } from "@/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLoader } from "@/components/ui/app-loader";
import { Separator } from "@/components/ui/separator";

function isOtherCompanyReview(review: MembershipReviewRow): boolean {
  return Boolean(review.requestedCompanyName);
}

function formatPartnerNames(review: MembershipReviewRow): string {
  const partners = [review.partner1Name, review.partner2Name].filter(
    (value): value is string => Boolean(value),
  );

  return partners.length > 0 ? partners.join(" · ") : "Não informado";
}

function ReviewCard({
  review,
  onApprove,
  onBlock,
  approveLabel,
  isApprovePending,
  isBlockPending,
  isRowPending,
}: {
  review: MembershipReviewRow;
  onApprove: (review: MembershipReviewRow) => void;
  onBlock: (review: MembershipReviewRow) => void;
  approveLabel: string;
  isApprovePending: boolean;
  isBlockPending: boolean;
  isRowPending: boolean;
}) {
  const titleId = `membership-review-${review.user.id}`;
  const isOther = isOtherCompanyReview(review);
  const companyLabel = isOther
    ? review.requestedCompanyName ?? "Empresa solicitada não informada"
    : review.selectedCompanyName ?? "Empresa vinculada não informada";
  const contactEmail = review.contactEmail ?? review.user.email;
  const cnpjLabel = review.requestedCnpj ?? "Não informado";

  return (
    <Card className="overflow-hidden">
      <article aria-labelledby={titleId} className="h-full">
        <CardHeader className="space-y-3 border-b border-border/60 bg-muted/20">
          <div className="space-y-1">
            <CardTitle id={titleId} className="text-xl">
              {review.user.name}
            </CardTitle>
            <CardDescription className="text-sm">
              {review.user.email}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">{companyLabel}</p>
                <p className="text-muted-foreground">
                  {isOther ? "Empresa solicitada" : "Empresa vinculada"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Contato
                </p>
                <p className="mt-1 text-sm text-foreground">{contactEmail}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  CNPJ solicitado
                </p>
                <p className="mt-1 text-sm text-foreground">{cnpjLabel}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sócios
                </p>
                <p className="mt-1 text-sm text-foreground">{formatPartnerNames(review)}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status de validação
                </p>
                <p className="mt-1 text-sm text-foreground">{review.user.validationStatus}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="sm:flex-1"
              onClick={() => onApprove(review)}
              disabled={isRowPending}
            >
              {isApprovePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {approveLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => onBlock(review)}
              disabled={isRowPending}
            >
              {isBlockPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
              Bloquear
            </Button>
          </div>
        </CardContent>
      </article>
    </Card>
  );
}

export default function MembershipReviewsPage() {
  const queryClient = useQueryClient();
  const [pendingApprovalIds, setPendingApprovalIds] = useState<string[]>([]);
  const [pendingBlockIds, setPendingBlockIds] = useState<string[]>([]);
  const pendingReviewsQuery = useQuery({
    queryKey: ["membership-reviews", "pending"],
    queryFn: membershipReviewService.listPendingReviews,
    staleTime: 30_000,
  });

  const groupedReviews = useMemo(() => {
    const reviews = pendingReviewsQuery.data ?? [];

    return {
      existing: reviews.filter((review) => !isOtherCompanyReview(review)),
      other: reviews.filter((review) => isOtherCompanyReview(review)),
    };
  }, [pendingReviewsQuery.data]);

  if (pendingReviewsQuery.isLoading) {
    return (
      <div className="container py-12">
        <AppLoader label="Carregando revisões pendentes..." size="sm" />
      </div>
    );
  }

  if (pendingReviewsQuery.isError) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl space-y-3 rounded-lg border border-border/60 bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">
            Não foi possível carregar a fila de revisão
          </h1>
          <p className="text-sm text-muted-foreground">
            Tente novamente em instantes. Se o problema persistir, valide a conexão com a API.
          </p>
          <Button type="button" variant="outline" onClick={() => pendingReviewsQuery.refetch()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const pendingReviews = pendingReviewsQuery.data ?? [];

  if (pendingReviews.length === 0) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Revisão de membros pendentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Nenhuma solicitação aguarda análise no momento.
          </p>
        </div>
      </div>
    );
  }

  const pendingApprovalLookup = new Set(pendingApprovalIds);
  const pendingBlockLookup = new Set(pendingBlockIds);

  async function handleApproveReview(
    userId: string,
    payload?: { createCompanyFromRequest?: boolean },
  ) {
    setPendingApprovalIds((current) => (current.includes(userId) ? current : [...current, userId]));

    try {
      await membershipReviewService.approveReview(userId, payload);
      await queryClient.invalidateQueries({ queryKey: ["membership-reviews"] });
      toast.success("Revisão aprovada.");
    } catch {
      await queryClient.invalidateQueries({ queryKey: ["membership-reviews"] });
      toast.error("Não foi possível aprovar a revisão.");
    } finally {
      setPendingApprovalIds((current) => current.filter((id) => id !== userId));
    }
  }

  async function handleBlockReview(userId: string) {
    setPendingBlockIds((current) => (current.includes(userId) ? current : [...current, userId]));

    try {
      await membershipReviewService.blockReview(userId);
      await queryClient.invalidateQueries({ queryKey: ["membership-reviews"] });
      toast.success("Revisão bloqueada.");
    } catch {
      await queryClient.invalidateQueries({ queryKey: ["membership-reviews"] });
      toast.error("Não foi possível bloquear a revisão.");
    } finally {
      setPendingBlockIds((current) => current.filter((id) => id !== userId));
    }
  }

  return (
    <div className="container py-12">
      <div className="max-w-6xl space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Revisão de membros pendentes
            </h1>
            <Badge variant="secondary">{pendingReviews.length} pendentes</Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Revise cada solicitação, confira os dados da empresa e aprove apenas quando a
            associação estiver correta.
          </p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Empresa existente</h2>
              <p className="text-sm text-muted-foreground">
                Solicitações vinculadas a uma empresa já cadastrada.
              </p>
            </div>
            <Badge variant="outline">{groupedReviews.existing.length}</Badge>
          </div>

          {groupedReviews.existing.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {groupedReviews.existing.map((review) => (
                <ReviewCard
                  key={review.user.id}
                  review={review}
                  approveLabel="Aprovar"
                  onApprove={(current) => handleApproveReview(current.user.id, {})}
                  onBlock={(current) => handleBlockReview(current.user.id)}
                  isApprovePending={pendingApprovalLookup.has(review.user.id)}
                  isBlockPending={pendingBlockLookup.has(review.user.id)}
                  isRowPending={
                    pendingApprovalLookup.has(review.user.id) || pendingBlockLookup.has(review.user.id)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              Nenhuma solicitação de empresa existente no momento.
            </div>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Outra empresa</h2>
              <p className="text-sm text-muted-foreground">
                Solicitações que pedem a criação de uma nova empresa.
              </p>
            </div>
            <Badge variant="outline">{groupedReviews.other.length}</Badge>
          </div>

          {groupedReviews.other.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {groupedReviews.other.map((review) => (
                <ReviewCard
                  key={review.user.id}
                  review={review}
                  approveLabel="Criar empresa e aprovar"
                  onApprove={(current) =>
                    handleApproveReview(current.user.id, { createCompanyFromRequest: true })
                  }
                  onBlock={(current) => handleBlockReview(current.user.id)}
                  isApprovePending={pendingApprovalLookup.has(review.user.id)}
                  isBlockPending={pendingBlockLookup.has(review.user.id)}
                  isRowPending={
                    pendingApprovalLookup.has(review.user.id) || pendingBlockLookup.has(review.user.id)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              Nenhuma solicitação de outra empresa no momento.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
