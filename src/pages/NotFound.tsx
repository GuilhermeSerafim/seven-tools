import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background px-4"
      style={{ backgroundImage: 'radial-gradient(ellipse at top, rgba(255,140,26,0.04), transparent 60%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,140,26,0.1)] mb-6">
          <AlertCircle className="h-10 w-10" />
        </div>

        <h1 className="font-display font-extrabold text-6xl text-primary mb-3">404</h1>
        <p className="font-display font-semibold text-xl mb-2">Página não encontrada</p>
        <p className="text-muted-foreground text-sm mb-8">
          O endereço acessado não existe ou foi movido.
        </p>

        <Link to="/hub">
          <Button className="gradient-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
