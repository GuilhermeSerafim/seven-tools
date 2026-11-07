import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/contexts/FavoritesContext';

interface FavoriteButtonProps {
  toolId: string;
  className?: string;
}

export function FavoriteButton({ toolId, className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(toolId);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(toolId);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        'p-1.5 rounded-full transition-all duration-200',
        fav ? 'text-primary' : 'text-muted-foreground hover:text-primary',
        className,
      )}
      aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart className={cn('h-4 w-4 transition-all duration-200', fav && 'fill-primary scale-110 drop-shadow-[0_0_4px_rgba(255,140,26,0.3)]')} />
    </button>
  );
}
