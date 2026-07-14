import { useQuery } from '@tanstack/react-query';
import {
    searchPerfumes,
    fetchPerfumes,
    fetchPerfumeById,
    fetchSimilarPerfumes,
    type APIPerfume,
} from '@/lib/api';

export function usePerfumeSearch(query: string) {
    const isEnabled = query.length >= 2;

    console.log('🎣 usePerfumeSearch called:', { query, isEnabled });

    const result = useQuery({
        queryKey: ['perfumes', 'search', query],
        queryFn: async () => {
            console.log('📡 Fetching perfumes for:', query);
            try {
                const data = await searchPerfumes(query);
                if (!Array.isArray(data)) {
                    console.warn('❌ Data is not array:', typeof data);
                    return [];
                }
                console.log('✅ Got array with', data.length, 'items');
                return data;
            } catch (err) {
                console.error('❌ Error fetching:', err);
                return [];
            }
        },
        enabled: isEnabled,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });

    // Build safe return object
    const safeData: APIPerfume[] = [];
    if (Array.isArray(result.data)) {
        safeData.push(...result.data);
    }

    return {
        data: safeData,
        isLoading: isEnabled && result.isLoading,
        error: isEnabled ? result.error : null,
    };
}
export function usePerfumes(page = 1, limit = 20) {
    return useQuery({
        queryKey: ['perfumes', 'list', page, limit],
        queryFn: () => fetchPerfumes(page, limit),
        staleTime: 1000 * 60 * 5,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

export function usePerfumeDetail(id: string) {
    return useQuery({
        queryKey: ['perfumes', 'detail', id],
        queryFn: () => fetchPerfumeById(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

/**
 * Similar perfumes computed SERVER-SIDE over the whole catalogue by shared
 * notes (same-phase match = 2 pts, cross-phase = 1 pt). Replaces the old
 * client-side findSimilarPerfumes, which only compared against the first
 * page of results.
 */
export function useSimilarPerfumes(id: string, limit = 4) {
    return useQuery({
        queryKey: ['perfumes', 'similar', id, limit],
        queryFn: () => fetchSimilarPerfumes(id, limit),
        enabled: !!id,
        staleTime: 1000 * 60 * 10,
    });
}

