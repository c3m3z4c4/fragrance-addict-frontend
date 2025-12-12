/**
 * API Configuration
 *
 * Para cambiar la URL del backend, modifica la variable API_BASE_URL
 * También puedes usar una variable de entorno: VITE_API_URL
 *
 * Development: http://localhost:3000
 * Production: https://tu-api-backend.com
 */
const getApiBaseUrl = (): string => {
    try {
        // Prioridad:
        // 1. Variable de entorno VITE_API_URL (recomendado para desarrollo/producción)
        if (import.meta.env.VITE_API_URL) {
            console.log(
                '📍 Using API_URL from environment:',
                import.meta.env.VITE_API_URL
            );
            return import.meta.env.VITE_API_URL;
        }

        // 2. Detectar si estamos en localhost (desarrollo local)
        // Usar typeof window para evitar errores si window no existe
        if (typeof window !== 'undefined') {
            if (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('192.168') ||
                window.location.hostname.includes('127.0.0.1')
            ) {
                console.log(
                    '📍 Development mode detected, using localhost:3000'
                );
                return 'http://localhost:3000';
            }
        }

        // 3. URL de fallback
        const fallback =
            'https://fragranceadict-backend-0tf5vy-debd22-31-97-41-99.traefik.me';
        console.log('📍 Using fallback API URL:', fallback);
        return fallback;
    } catch (error) {
        console.error('❌ Error determining API_BASE_URL:', error);
        // Fallback seguro
        return 'http://localhost:3000';
    }
};

export const API_BASE_URL = getApiBaseUrl();

export interface APIPerfume {
    id: string;
    name: string;
    brand: string;
    year?: number;
    perfumer?: string;
    gender?: 'masculine' | 'feminine' | 'unisex';
    concentration?: string;
    notes?: {
        top?: string[];
        heart?: string[];
        base?: string[];
    };
    accords?: string[];
    description?: string;
    imageUrl?: string;
    rating?: number;
    sillage?: {
        dominant?: string;
        percentage?: number;
        votes?: Record<string, number>;
    };
    longevity?: {
        dominant?: string;
        percentage?: number;
        votes?: Record<string, number>;
    };
    projection?: string;
    similarPerfumes?: Array<{
        name: string;
        url: string;
        imageUrl?: string;
    }>;
    sourceUrl?: string;
}

export interface SearchResponse {
    perfumes: APIPerfume[];
    total: number;
    page: number;
    limit: number;
}

// Fetch all perfumes with pagination
export async function fetchPerfumes(
    page = 1,
    limit = 20
): Promise<SearchResponse> {
    const response = await fetch(
        `${API_BASE_URL}/api/perfumes?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch perfumes');
    return response.json();
}

// Search perfumes by query
export async function searchPerfumes(query: string): Promise<APIPerfume[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/perfumes/search?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error('Failed to search perfumes');
    const data = await response.json();
    return data.perfumes || data;
}

// Get perfume by ID
export async function fetchPerfumeById(id: string): Promise<APIPerfume> {
    const response = await fetch(`${API_BASE_URL}/api/perfumes/${id}`);
    if (!response.ok) throw new Error('Perfume not found');
    return response.json();
}

// Get perfumes by brand
export async function fetchPerfumesByBrand(
    brand: string
): Promise<APIPerfume[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/perfumes/brand/${encodeURIComponent(brand)}`
    );
    if (!response.ok) throw new Error('Failed to fetch brand perfumes');
    const data = await response.json();
    return data.perfumes || data;
}

// Get all brands
export async function fetchBrands(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/perfumes/brands`);
    if (!response.ok) throw new Error('Failed to fetch brands');
    const data = await response.json();
    return data.brands || data;
}

// Get statistics
export async function fetchStats(): Promise<{ total: number; brands: number }> {
    const response = await fetch(`${API_BASE_URL}/api/perfumes/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
}

// ============= ADMIN FUNCTIONS (Protected) =============

import { getStoredApiKey } from '@/hooks/useAdminApiKey';

const getApiKey = () => getStoredApiKey();

// Scrape a perfume from URL
export async function scrapePerfume(
    url: string,
    save = true
): Promise<{ success: boolean; data?: APIPerfume; error?: string }> {
    const response = await fetch(
        `${API_BASE_URL}/api/scrape/perfume?url=${encodeURIComponent(
            url
        )}&save=${save}`,
        {
            headers: {
                'x-api-key': getApiKey(),
            },
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Scraping failed' }));
        return { success: false, error: error.error || 'Scraping failed' };
    }

    const data = await response.json();
    return { success: true, data: data.data || data };
}

// Batch scrape multiple URLs
export async function batchScrapePerfumes(
    urls: string[],
    save = true
): Promise<{
    success: boolean;
    results?: Array<{
        url: string;
        success: boolean;
        data?: APIPerfume;
        error?: string;
    }>;
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': getApiKey(),
        },
        body: JSON.stringify({ urls, save }),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Batch scraping failed' }));
        return {
            success: false,
            error: error.error || 'Batch scraping failed',
        };
    }

    const data = await response.json();
    return { success: true, results: data.results };
}

// Delete a perfume
export async function deletePerfume(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/perfumes/${id}`, {
        method: 'DELETE',
        headers: {
            'x-api-key': getApiKey(),
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Delete failed' }));
        return { success: false, error: error.error || 'Delete failed' };
    }

    return { success: true };
}

// Get scraper cache stats
export async function getCacheStats(): Promise<{
    hits: number;
    misses: number;
    keys: number;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/cache/stats`, {
        headers: {
            'x-api-key': getApiKey(),
        },
    });
    if (!response.ok) throw new Error('Failed to fetch cache stats');
    const data = await response.json();
    return data.data || data;
}

// Clear scraper cache
export async function clearCache(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/cache`, {
        method: 'DELETE',
        headers: {
            'x-api-key': getApiKey(),
        },
    });
    if (!response.ok) throw new Error('Failed to clear cache');
    return response.json();
}

// ============= SITEMAP & QUEUE FUNCTIONS =============

export interface QueueStatus {
    processing: boolean;
    current: string | null;
    processed: number;
    failed: number;
    remaining: number;
    total: number;
    startedAt: string | null;
    errors: Array<{ url: string; error: string; time: string }>;
}

// Fetch URLs from Fragrantica sitemap or brand page
export async function fetchSitemapUrls(
    brand?: string,
    limit = 100
): Promise<{
    success: boolean;
    urls?: string[];
    count?: number;
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/sitemap`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': getApiKey(),
        },
        body: JSON.stringify({ brand, limit }),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Failed to fetch sitemap' }));
        return {
            success: false,
            error: error.error || 'Failed to fetch sitemap',
        };
    }

    const data = await response.json();
    return { success: true, urls: data.urls, count: data.count };
}

// Check which URLs already exist in the database
export async function checkExistingUrls(urls: string[]): Promise<{
    success: boolean;
    total?: number;
    existingCount?: number;
    newCount?: number;
    existing?: string[];
    newUrls?: string[];
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/queue/check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': getApiKey(),
        },
        body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Failed to check URLs' }));
        return { success: false, error: error.error || 'Failed to check URLs' };
    }

    return response.json();
}

// Add URLs to scraping queue
export async function addToQueue(urls: string[]): Promise<{
    success: boolean;
    added?: number;
    skipped?: number;
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/queue`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': getApiKey(),
        },
        body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Failed to add to queue' }));
        return {
            success: false,
            error: error.error || 'Failed to add to queue',
        };
    }

    return response.json();
}

// Start queue processing
export async function startQueue(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/queue/start`, {
        method: 'POST',
        headers: {
            'x-api-key': getApiKey(),
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Failed to start queue' }));
        return {
            success: false,
            error: error.error || 'Failed to start queue',
        };
    }

    return response.json();
}

// Stop queue processing
export async function stopQueue(): Promise<{
    success: boolean;
    message?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/queue/stop`, {
        method: 'POST',
        headers: {
            'x-api-key': getApiKey(),
        },
    });

    if (!response.ok) throw new Error('Failed to stop queue');
    return response.json();
}

// Get queue status
export async function getQueueStatus(): Promise<QueueStatus> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/queue/status`, {
        headers: {
            'x-api-key': getApiKey(),
        },
    });

    if (!response.ok) throw new Error('Failed to get queue status');
    const data = await response.json();
    return data;
}

// Clear queue
export async function clearQueue(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/queue`, {
        method: 'DELETE',
        headers: {
            'x-api-key': getApiKey(),
        },
    });

    if (!response.ok) throw new Error('Failed to clear queue');
    return response.json();
}

// ============= RE-SCRAPE FUNCTIONS =============

export interface IncompletePerfume {
    id: string;
    name: string;
    brand: string;
    sourceUrl: string;
    hasSillage: boolean;
    hasLongevity: boolean;
    hasSimilarPerfumes: boolean;
}

// Get incomplete perfumes that need re-scraping
export async function getIncompletePerfumes(limit = 50): Promise<{
    success: boolean;
    count?: number;
    perfumes?: IncompletePerfume[];
    error?: string;
}> {
    const response = await fetch(
        `${API_BASE_URL}/api/scrape/incomplete?limit=${limit}`,
        {
            headers: {
                'x-api-key': getApiKey(),
            },
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Failed to get incomplete perfumes' }));
        return {
            success: false,
            error: error.error || 'Failed to get incomplete perfumes',
        };
    }

    return response.json();
}

// Re-scrape specific perfumes by ID
export async function rescrapePerfumes(ids: string[]): Promise<{
    success: boolean;
    processed?: number;
    failed?: number;
    results?: Array<{ id: string; name: string; success: boolean }>;
    errors?: Array<{ id: string; error: string }>;
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/rescrape`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': getApiKey(),
        },
        body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Re-scrape failed' }));
        return { success: false, error: error.error || 'Re-scrape failed' };
    }

    return response.json();
}

// Add incomplete perfumes to re-scrape queue
export async function addIncompleteToQueue(limit = 50): Promise<{
    success: boolean;
    added?: number;
    queueSize?: number;
    message?: string;
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/rescrape/queue`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': getApiKey(),
        },
        body: JSON.stringify({ limit }),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: 'Failed to add to queue' }));
        return {
            success: false,
            error: error.error || 'Failed to add to queue',
        };
    }

    return response.json();
}
