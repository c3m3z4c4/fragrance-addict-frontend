import { useQuery } from '@tanstack/react-query';
import {
    searchPerfumes,
    fetchPerfumes,
    fetchPerfumeById,
    type APIPerfume,
} from '@/lib/api';

export function usePerfumeSearch(query: string) {
    console.log('🎣 usePerfumeSearch called with query:', query);

    const result = useQuery({
        queryKey: ['perfumes', 'search', query],
        queryFn: async () => {
            console.log('📡 queryFn executing for query:', query);
            const data = await searchPerfumes(query);
            return data || [];
        },
        enabled: query.length >= 2,
        staleTime: 1000 * 60 * 5,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    console.log('🎣 usePerfumeSearch returning:', {
        enabled: query.length >= 2,
        status: result.status,
        dataType: typeof result.data,
        dataIsArray: Array.isArray(result.data),
        dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
    });

    return {
        data: Array.isArray(result.data) ? result.data : [],
        isLoading: result.isLoading,
        error: result.error,
        status: result.status,
        isFetching: result.isFetching,
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

// Find similar perfumes based on accords or notes
export function findSimilarPerfumes(
    currentPerfume: APIPerfume,
    allPerfumes: APIPerfume[],
    limit = 4
): APIPerfume[] {
    if (!currentPerfume || !allPerfumes.length) return [];

    const currentAccords = currentPerfume.accords || [];
    const currentNotes = [
        ...(currentPerfume.notes?.top || []),
        ...(currentPerfume.notes?.heart || []),
        ...(currentPerfume.notes?.base || []),
    ];

    const scored = allPerfumes
        .filter((p) => p.id !== currentPerfume.id)
        .map((perfume) => {
            let score = 0;

            // Match accords
            const perfumeAccords = perfume.accords || [];
            currentAccords.forEach((accord) => {
                if (
                    perfumeAccords.some((a) =>
                        a.toLowerCase().includes(accord.toLowerCase())
                    )
                ) {
                    score += 3;
                }
            });

            // Match notes
            const perfumeNotes = [
                ...(perfume.notes?.top || []),
                ...(perfume.notes?.heart || []),
                ...(perfume.notes?.base || []),
            ];
            currentNotes.forEach((note) => {
                if (
                    perfumeNotes.some((n) =>
                        n.toLowerCase().includes(note.toLowerCase())
                    )
                ) {
                    score += 1;
                }
            });

            // Same brand bonus
            if (perfume.brand === currentPerfume.brand) {
                score += 2;
            }

            // Same gender preference
            if (perfume.gender === currentPerfume.gender) {
                score += 1;
            }

            return { perfume, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return scored.map((s) => s.perfume);
}
