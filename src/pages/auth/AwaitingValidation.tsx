import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert, Clock3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { FloatingPaths } from '@/components/ui/background-paths';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/AuthContext';

export default function AwaitingValidation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isBlocked = user?.validationStatus === 'blocked';
  const title = isBlocked ? 'Acesso bloqueado' : 'Aguardando validação';
  const description = isBlocked
    ? 'Seu acesso foi bloqueado pela equipe SEVEN. Se você acredita que isso aconteceu por engano, fale com o time responsável.'
    : 'Sua conta foi criada com sucesso e agora está em análise pela equipe SEVEN.';

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 text-primary/20">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(255,140,26,0.06), transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <img
            src="/seven-logo.png"
            alt="SEVEN"
            className="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,140,26,0.25)]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="font-display font-bold text-xl tracking-tight">
            SEVEN <span className="text-primary">Tools</span>
          </span>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl shadow-depth p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            {isBlocked ? <ShieldAlert className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
          </div>

          <h1 className="font-display font-bold text-2xl mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>

          {user && (
            <div className="mt-6 rounded-xl border border-border/30 bg-background/60 px-4 py-3 text-left text-sm">
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            Assim que a validação for concluída, seu acesso será liberado automaticamente.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleLogout()}
            disabled={isSigningOut}
            className="mt-6 w-full"
          >
            {isSigningOut ? 'Saindo...' : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
