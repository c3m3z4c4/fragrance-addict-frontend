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
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/perfumes?page=${page}&limit=${limit}`
        );
        if (!response.ok) {
            console.error('Failed to fetch perfumes:', response.status);
            return {
                perfumes: [],
                total: 0,
                page,
                limit,
            };
        }
        const data = await response.json();

        // Handle both response formats
        let perfumesData: any[] = [];
        if (data.data && data.pagination) {
            // New format from backend: { success, data, pagination }
            perfumesData = Array.isArray(data.data) ? data.data : [];
        } else if (data.perfumes) {
            // Old format: { perfumes, total, page, limit }
            perfumesData = Array.isArray(data.perfumes) ? data.perfumes : [];
        } else if (Array.isArray(data)) {
            // Direct array response
            perfumesData = data;
        }

        // Sanitize all perfumes
        const sanitized = perfumesData.map((item) => deepSanitizePerfume(item));

        return {
            perfumes: sanitized,
            total: data.pagination?.total || data.total || 0,
            page: data.pagination?.page || data.page || page,
            limit: data.pagination?.limit || data.limit || limit,
        };
    } catch (error) {
        console.error('❌ Fetch perfumes error:', error);
        return {
            perfumes: [],
            total: 0,
            page,
            limit,
        };
    }
}

// Ensure all complex properties are converted to primitives
function deepSanitizePerfume(item: any): APIPerfume {
    if (!item) return null as any;

    // Sanitize accords - MUST be string[]
    if (item.accords && Array.isArray(item.accords)) {
        item.accords = item.accords
            .map((accord: any) => {
                if (typeof accord === 'string') return accord;
                if (accord && typeof accord === 'object' && accord.name) {
                    return String(accord.name).trim();
                }
                if (accord && typeof accord === 'object' && accord.color) {
                    return 'accent'; // Fallback
                }
                return String(accord).trim();
            })
            .filter(Boolean);
    } else {
        item.accords = [];
    }

    // Sanitize notes - MUST be string[]
    if (item.notes && typeof item.notes === 'object') {
        ['top', 'heart', 'base'].forEach((level) => {
            if (item.notes[level] && Array.isArray(item.notes[level])) {
                item.notes[level] = item.notes[level]
                    .map((note: any) => {
                        if (typeof note === 'string') return note;
                        if (note && typeof note === 'object' && note.name) {
                            return String(note.name).trim();
                        }
                        return String(note).trim();
                    })
                    .filter(Boolean);
            } else {
                item.notes[level] = [];
            }
        });
    } else {
        item.notes = { top: [], heart: [], base: [] };
    }

    // Ensure primitives
    item.id = String(item.id || '').trim();
    item.name = String(item.name || '').trim();
    item.brand = String(item.brand || '').trim();
    item.gender = item.gender || undefined;
    item.concentration = item.concentration || undefined;
    item.year = Number(item.year) || undefined;
    item.rating = Number(item.rating) || undefined;

    return item as APIPerfume;
}

// Search perfumes by query
export async function searchPerfumes(query: string): Promise<APIPerfume[]> {
    try {
        console.log('🔍 Searching for:', query);
        console.log(
            '📍 API URL:',
            `${API_BASE_URL}/api/perfumes/search?q=${encodeURIComponent(query)}`
        );

        const response = await fetch(
            `${API_BASE_URL}/api/perfumes/search?q=${encodeURIComponent(query)}`
        );

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
            console.error(
                `Search failed: ${response.status} ${response.statusText}`
            );
            return [];
        }

        const data = await response.json();
        console.log('Raw response data:', data);

        // Handle both response formats
        let results: APIPerfume[] = [];

        if (data.data && Array.isArray(data.data)) {
            console.log(
                '✅ Returning data.data with',
                data.data.length,
                'results'
            );
            results = data.data;
        } else if (data.perfumes && Array.isArray(data.perfumes)) {
            console.log(
                '✅ Returning data.perfumes with',
                data.perfumes.length,
                'results'
            );
            results = data.perfumes;
        } else if (Array.isArray(data)) {
            console.log('✅ Returning array data with', data.length, 'results');
            results = data;
        } else {
            console.warn(
                '❌ No valid data format found, returning empty array'
            );
            results = [];
        }

        // Validate and sanitize results using deepSanitizePerfume
        const validated = results
            .filter(
                (item) =>
                    item &&
                    typeof item === 'object' &&
                    (item as any).id &&
                    (item as any).name &&
                    (item as any).brand
            )
            .map((item: any) => deepSanitizePerfume(item));
        console.log('✅ Validated and sanitized', validated.length, 'perfumes');
        return validated as APIPerfume[];
    } catch (error) {
        console.error('❌ Search error:', error);
        // Return empty array instead of throwing to prevent React crashes
        return [];
    }
}

// Get perfume by ID
export async function fetchPerfumeById(id: string): Promise<APIPerfume | null> {
    try {
        console.log('🔍 Fetching perfume by ID:', id);
        const response = await fetch(`${API_BASE_URL}/api/perfumes/${id}`);
        console.log('Response status:', response.status);

        if (!response.ok) {
            console.error('Perfume not found:', id, response.status);
            return null;
        }
        const data = await response.json();
        console.log('Raw perfume data:', data);
        console.log('Data.data contents:', data.data);
        console.log(
            'Data.data keys:',
            data.data ? Object.keys(data.data) : 'N/A'
        );

        // Handle both response formats
        let perfume: any = null;
        if (data.data && typeof data.data === 'object') {
            console.log('Using data.data format');
            perfume = data.data;
        } else if (data && typeof data === 'object' && data.id) {
            console.log('Using direct object format');
            perfume = data;
        } else if (data && typeof data === 'object' && !data.success) {
            console.log('Using fallback object format');
            perfume = data;
        } else {
            console.warn('❌ Could not extract perfume from response');
            console.log(
                'Data type:',
                typeof data,
                'Keys:',
                Object.keys(data || {})
            );
            return null;
        }

        if (!perfume || !perfume.id || !perfume.name) {
            console.warn('❌ Perfume missing required fields:', {
                id: !!perfume?.id,
                name: !!perfume?.name,
                brand: !!perfume?.brand,
            });
            return null;
        }

        const sanitized = deepSanitizePerfume(perfume);
        console.log('✅ Sanitized perfume:', sanitized.id, sanitized.name);
        return sanitized;
    } catch (error) {
        console.error('❌ Fetch perfume by ID error:', error);
        return null;
    }
}

// Get perfumes by brand
export async function fetchPerfumesByBrand(
    brand: string
): Promise<APIPerfume[]> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/perfumes/brand/${encodeURIComponent(brand)}`
        );
        if (!response.ok) {
            console.error('Failed to fetch brand perfumes:', brand);
            return [];
        }
        const data = await response.json();

        // Handle both response formats
        let results: any[] = [];
        if (data.data && Array.isArray(data.data)) {
            results = data.data;
        } else if (data.perfumes && Array.isArray(data.perfumes)) {
            results = data.perfumes;
        } else if (Array.isArray(data)) {
            results = data;
        }

        return results.map((item) => deepSanitizePerfume(item));
    } catch (error) {
        console.error('❌ Fetch brand perfumes error:', error);
        return [];
    }
}

// Get all brands
export async function fetchBrands(): Promise<string[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/perfumes/brands`);
        if (!response.ok) {
            console.error('Failed to fetch brands');
            return [];
        }
        const data = await response.json();

        // Handle both response formats
        if (data.data && Array.isArray(data.data)) {
            return data.data;
        } else if (data.brands && Array.isArray(data.brands)) {
            return data.brands;
        }
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('❌ Fetch brands error:', error);
        return [];
    }
}

// Get statistics
export async function fetchStats(): Promise<{ total: number; brands: number }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/perfumes/stats`);
        if (!response.ok) {
            console.error('Failed to fetch stats');
            return { total: 0, brands: 0 };
        }
        const data = await response.json();

        // Handle both response formats
        if (data.data && typeof data.data === 'object') {
            return data.data;
        } else if (typeof data === 'object') {
            return data;
        }
        return { total: 0, brands: 0 };
    } catch (error) {
        console.error('❌ Fetch stats error:', error);
        return { total: 0, brands: 0 };
    }
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
