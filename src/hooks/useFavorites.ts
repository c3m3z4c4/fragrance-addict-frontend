import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'perfume-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  const saveFavorites = useCallback((newFavorites: string[]) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  }, []);

  const toggleFavorite = useCallback((perfumeId: string) => {
    const newFavorites = favorites.includes(perfumeId)
      ? favorites.filter(id => id !== perfumeId)
      : [...favorites, perfumeId];
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  const isFavorite = useCallback((perfumeId: string) => {
    return favorites.includes(perfumeId);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.length
  };
}
