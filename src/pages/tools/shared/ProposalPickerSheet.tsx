import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { Proposal } from '@/services/proposalService';

export interface ProposalPickerSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSelect: (proposal: Proposal) => void;
  proposals: Proposal[];
  loading: boolean;
}

export function ProposalPickerSheet({
  open,
  onOpenChange,
  onSelect,
  proposals,
  loading,
}: ProposalPickerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b border-border/30 p-4">
          <SheetTitle>Selecione uma proposta</SheetTitle>
          <SheetDescription className="sr-only">Selecione uma proposta para enviar por PDF.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {loading ? (
            <div data-testid="proposal-picker-loading" className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {"Voc\u00EA ainda n\u00E3o tem propostas salvas. Use a outra op\u00E7\u00E3o para enviar um PDF."}
            </div>
          ) : (
            proposals.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                className="h-auto w-full justify-start rounded-2xl p-4 text-left"
                onClick={() => onSelect(p)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-semibold">{p.title}</span>
                  {p.clientName ? (
                    <span className="text-xs text-muted-foreground">{p.clientName}</span>
                  ) : null}
                </div>
              </Button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
