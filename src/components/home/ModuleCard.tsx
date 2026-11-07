import { Link } from 'react-router-dom';
import { getIconByName } from '@/lib/iconRegistry';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: string;
  to: string;
  color?: string;
}

export function ModuleCard({ title, description, icon, to }: ModuleCardProps) {
  const IconComponent = getIconByName(icon);

  return (
    <Link
      to={to}
      className="group relative flex flex-col items-center text-center rounded-xl border border-border/30 bg-card shadow-depth p-6 transition-all duration-300 hover:scale-[1.04] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none glow-primary-sm" />

      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
        <IconComponent className="h-7 w-7" />
      </div>
      <h3 className="relative font-display font-bold text-base mb-1">{title}</h3>
      <p className="relative text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
