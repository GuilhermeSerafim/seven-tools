import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import api from "../lib/apiClient";

interface FavoritesContextValue {
  favoriteIds: string[];
  isFavorite: (toolId: string) => boolean;
  toggleFavorite: (toolId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favoriteIds: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }
    api
      .get<{ toolSlugs: string[] }>("/users/me/favorites")
      .then(({ data }) => setFavoriteIds(data.toolSlugs))
      .catch(() => setFavoriteIds([]));
  }, [user]);

  const isFavorite = useCallback(
    (toolId: string) => favoriteIds.includes(toolId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (toolId: string) => {
      if (!user) return;
      if (favoriteIds.includes(toolId)) {
        setFavoriteIds((prev) => prev.filter((id) => id !== toolId));
        try {
          await api.delete(`/users/me/favorites/${toolId}`);
        } catch {
          setFavoriteIds((prev) => [...prev, toolId]);
        }
      } else {
        setFavoriteIds((prev) => [...prev, toolId]);
        try {
          await api.post(`/users/me/favorites/${toolId}`);
        } catch {
          setFavoriteIds((prev) => prev.filter((id) => id !== toolId));
        }
      }
    },
    [user, favoriteIds]
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
