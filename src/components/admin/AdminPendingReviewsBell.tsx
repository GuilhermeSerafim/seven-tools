import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Loader2, Link as LinkIcon, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { membershipReviewService } from "@/admin/membershipReviewService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MembershipReviewRow } from "@/admin/types";

function getReviewSubtitle(review: MembershipReviewRow): string {
  const details = [
    review.selectedCompanyName ?? review.requestedCompanyName,
    review.contactEmail ?? review.user.email,
    review.requestedCnpj,
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 2);

  if (details.length > 0) {
    return details.join(" · ");
  }

  return review.requestedCnpj ?? "Sem CNPJ informado";
}

export function AdminPendingReviewsBell() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const pendingReviewsQuery = useQuery({
    queryKey: ["membership-reviews", "pending"],
    queryFn: membershipReviewService.listPendingReviews,
    enabled: isAdmin,
    staleTime: 30_000,
  });

  if (!isAdmin) {
    return null;
  }

  const pendingReviews = pendingReviewsQuery.data ?? [];
  const previewReviews = pendingReviews.slice(0, 3);
  const pendingCount = pendingReviews.length;
  const buttonLabel = `${pendingCount} revisões pendentes`;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={buttonLabel}
          className="relative h-10 w-10 rounded-full border border-border/50 bg-background/80 text-foreground hover:bg-primary/5"
          onClick={() => setOpen((current) => !current)}
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">{buttonLabel}</span>
          <Badge
            variant={pendingCount > 0 ? "default" : "secondary"}
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] shadow-sm"
          >
            {pendingCount}
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <DropdownMenuLabel className="p-0 text-sm font-semibold">
              Revisões pendentes
            </DropdownMenuLabel>
            <p className="text-xs text-muted-foreground">
              {pendingCount > 0
                ? "Confira as novas solicitações antes de liberar o acesso."
                : "Nenhuma solicitação aguarda análise no momento."}
            </p>
          </div>
          <Badge variant="outline">{pendingCount}</Badge>
        </div>

        <DropdownMenuSeparator />

        {pendingReviewsQuery.isLoading ? (
          <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando revisões...
          </div>
        ) : pendingReviewsQuery.isError ? (
          <div className="px-4 py-5 text-sm text-muted-foreground">
            Não foi possível carregar as revisões pendentes.
          </div>
        ) : previewReviews.length > 0 ? (
          <div className="max-h-72 overflow-auto">
            {previewReviews.map((review) => (
              <div
                key={review.user.id}
                className="flex items-start justify-between gap-3 border-b border-border/40 px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">
                    {review.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getReviewSubtitle(review)}
                  </p>
                </div>
              </div>
            ))}
            {pendingCount > previewReviews.length && (
              <div className="px-4 py-3 text-xs text-muted-foreground">
                E mais {pendingCount - previewReviews.length} revisões aguardando análise.
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-5 text-sm text-muted-foreground">
            Nenhuma revisão pendente para exibir.
          </div>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer px-4 py-3">
          <Link to="/admin/membros-pendentes" className="flex w-full items-center gap-2">
            <Users className="h-4 w-4" />
            Ver fila completa
            <LinkIcon className="ml-auto h-4 w-4" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AdminPendingReviewsBell;
