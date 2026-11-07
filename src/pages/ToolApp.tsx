import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { getToolBySlug } from '@/data/tools';
import { Button } from '@/components/ui/button';
import { ToolNotFoundState } from '@/components/tools/ToolNotFoundState';
import { getIconByName } from '@/lib/iconRegistry';
import { motion } from 'framer-motion';

export default function ToolApp() {
  const { slug } = useParams();
  const tool = getToolBySlug(slug || '');

  if (!tool) {
    return <ToolNotFoundState />;
  }

  const IconComponent = getIconByName(tool.icon);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* App header bar */}
      <div className="border-b border-border/30 glass-strong">
        <div className="container flex h-14 items-center gap-4">
          <Link to={`/tools/${tool.slug}`}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar à visão geral</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <IconComponent className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-sm">{tool.name}</span>
          </div>
        </div>
      </div>

      {/* App workspace */}
      <div className="flex-1 container py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center gap-6 text-center max-w-lg mx-auto"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,140,26,0.1)]">
            <Construction className="h-10 w-10" />
          </div>

          <div>
            <h1 className="font-display font-bold text-2xl mb-2">{tool.name}</h1>
            <p className="text-muted-foreground">
              A interface desta ferramenta está em desenvolvimento. Em breve estará disponível aqui, integrada ao ecossistema SEVEN.
            </p>
          </div>

          <div className="w-full rounded-xl border border-border/30 bg-card shadow-depth p-6 text-left space-y-3">
            <h3 className="font-display font-semibold text-sm text-primary">O que estará disponível aqui</h3>
            {tool.howToUse?.map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          <Link to={`/tools/${tool.slug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar à visão geral
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
