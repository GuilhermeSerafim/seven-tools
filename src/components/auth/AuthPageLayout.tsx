import type { ReactNode } from 'react';
import { FloatingPaths } from '@/components/ui/background-paths';
import { motion } from 'framer-motion';

interface AuthPageLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageLayout({ children, footer }: AuthPageLayoutProps) {
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
        className="relative z-10 w-full max-w-md px-4 py-12"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <img
            src="/seven-logo.png"
            alt="SEVEN"
            className="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,140,26,0.25)]"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="font-display font-bold text-xl tracking-tight">
            SEVEN <span className="text-primary">Tools</span>
          </span>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl shadow-depth p-8">
          {children}
        </div>

        {footer && (
          <div className="mt-6">{footer}</div>
        )}
      </motion.div>
    </div>
  );
}
