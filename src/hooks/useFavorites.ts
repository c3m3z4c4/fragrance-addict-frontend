import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    fetchFavorites,
    addFavorite as apiAddFavorite,
    removeFavorite as apiRemoveFavorite,
} from '@/lib/api';

const LOCAL_FAVORITES_KEY = 'perfume-favorites';

export function useFavorites() {
    const { user } = useAuth();
    const isLoggedIn = !!user;

    // Local favorites (for anonymous users)
    const [localFavorites, setLocalFavorites] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Server favorites ids (for logged-in users)
    const [serverFavorites, setServerFavorites] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch server favorites when user logs in
    useEffect(() => {
        if (!isLoggedIn) return;
        setIsLoading(true);
        fetchFavorites()
            .then((perfumes) => setServerFavorites(perfumes.map((p) => p.id)))
            .finally(() => setIsLoading(false));
    }, [isLoggedIn]);

    const favorites = isLoggedIn ? serverFavorites : localFavorites;

    const isFavorite = useCallback(
        (perfumeId: string) => favorites.includes(perfumeId),
        [favorites]
    );

    const toggleFavorite = useCallback(
        async (perfumeId: string) => {
            if (isLoggedIn) {
                const already = serverFavorites.includes(perfumeId);
                if (already) {
                    await apiRemoveFavorite(perfumeId);
                    setServerFavorites((prev) => prev.filter((id) => id !== perfumeId));
                } else {
                    await apiAddFavorite(perfumeId);
                    setServerFavorites((prev) => [...prev, perfumeId]);
                }
            } else {
                const next = localFavorites.includes(perfumeId)
                    ? localFavorites.filter((id) => id !== perfumeId)
                    : [...localFavorites, perfumeId];
                localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(next));
                setLocalFavorites(next);
            }
        },
        [isLoggedIn, serverFavorites, localFavorites]
    );

    return {
        favorites,
        toggleFavorite,
        isFavorite,
        favoritesCount: favorites.length,
        isLoading,
    };
}
