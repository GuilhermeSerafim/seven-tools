import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ToolNotFoundState() {
  return (
    <div className="container py-16 flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,140,26,0.1)]">
        <AlertCircle className="h-8 w-8" />
      </div>
      <p className="text-muted-foreground font-medium">Ferramenta não encontrada.</p>
      <Link to="/tools">
        <Button variant="outline" className="mt-2 hover:-translate-y-0.5 transition-all gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar às ferramentas
        </Button>
      </Link>
    </div>
  );
}
