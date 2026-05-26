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
        if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') return `http://${hostname}:3000`;
            if (/^(192\.168|172\.(1[6-9]|2[0-9]|3[01])|10\.)/.test(hostname)) return `http://${hostname}:3000`;
        }

        return 'http://localhost:3000';
    } catch {
        return typeof window !== 'undefined' ? `http://${window.location.hostname}:3000` : 'http://localhost:3000';
    }
};

export const API_BASE_URL = getApiBaseUrl();

export interface APIPerfume {
    id: string;
    name: string;
    brand: string;
    year?: number;
    perfumer?: string;
    perfumerImageUrl?: string | null;
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
    seasonUsage?: {
        winter: number;
        spring: number;
        summer: number;
        autumn: number;
        day: number;
        night: number;
    } | null;
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
            return { perfumes: [], total: 0, page, limit };
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
    } catch {
        return { perfumes: [], total: 0, page, limit };
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
        const response = await fetch(
            `${API_BASE_URL}/api/perfumes/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) return [];

        const data = await response.json();
        let results: APIPerfume[] = [];

        if (data.data && Array.isArray(data.data)) results = data.data;
        else if (data.perfumes && Array.isArray(data.perfumes)) results = data.perfumes;
        else if (Array.isArray(data)) results = data;

        return results
            .filter((item) => item && typeof item === 'object' && (item as any).id && (item as any).name && (item as any).brand)
            .map((item: any) => deepSanitizePerfume(item)) as APIPerfume[];
    } catch {
        return [];
    }
}

// Get perfume by ID
export async function fetchPerfumeById(id: string): Promise<APIPerfume | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/perfumes/${id}`);
        if (!response.ok) return null;

        const data = await response.json();
        let perfume: any = null;

        if (data.data?.data && typeof data.data.data === 'object' && data.data.data.id) {
            perfume = data.data.data;
        } else if (data.data && typeof data.data === 'object' && data.data.id) {
            perfume = data.data;
        } else if (data && typeof data === 'object' && data.id) {
            perfume = data;
        } else if (data && typeof data === 'object' && !data.success) {
            perfume = data;
        } else {
            return null;
        }

        if (!perfume?.id || !perfume?.name) return null;
        return deepSanitizePerfume(perfume);
    } catch {
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
        if (!response.ok) return [];
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
        return [];
    }
}

// Get perfumes by perfumer
export async function fetchPerfumesByPerfumer(name: string): Promise<APIPerfume[]> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/perfumes/perfumer/${encodeURIComponent(name)}`
        );
        if (!response.ok) return [];
        const data = await response.json();
        const results: any[] = data.data ?? data.perfumes ?? (Array.isArray(data) ? data : []);
        return results.map((item) => deepSanitizePerfume(item));
    } catch (error) {
        return [];
    }
}

export interface PerfumerInfo {
    name: string;
    count: number;
    imageUrl: string | null;
    bio?: string | null;
    nationality?: string | null;
    verified?: boolean;
}

// Get all perfumers with count and image
export async function fetchPerfumers(): Promise<PerfumerInfo[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/perfumes/perfumers`);
        if (!response.ok) return [];
        const data = await response.json();
        const raw = data.data ?? data.perfumers ?? data;
        if (!Array.isArray(raw)) return [];
        return raw.map((item: any) => ({
            name: item.name ?? item,
            count: item.count ?? 0,
            imageUrl: item.imageUrl ?? item.image_url ?? null,
            bio: item.bio ?? null,
            nationality: item.nationality ?? null,
            verified: item.verified ?? false,
        }));
    } catch (error) {
        return [];
    }
}

// Admin: upsert verified perfumer data
export async function upsertPerfumerData(
    name: string,
    data: { imageUrl?: string; bio?: string; nationality?: string },
    token: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/perfumers/${encodeURIComponent(name)}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            }
        );
        return response.ok;
    } catch {
        return false;
    }
}

// Admin: delete verified perfumer data (revert to scraped)
export async function deletePerfumerData(name: string, token: string): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/perfumers/${encodeURIComponent(name)}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
        return response.ok;
    } catch {
        return false;
    }
}

// Get brands a perfumer has collaborated with
export async function fetchPerfumerBrands(name: string): Promise<PerfumerInfo[]> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/perfumes/perfumer/${encodeURIComponent(name)}/brands`
        );
        if (!response.ok) return [];
        const data = await response.json();
        const raw = data.data ?? (Array.isArray(data) ? data : []);
        return raw.map((item: any) => ({
            name: item.name ?? item,
            count: item.count ?? 0,
            imageUrl: item.imageUrl ?? item.image_url ?? null,
        }));
    } catch (error) {
        return [];
    }
}

// Get perfumes by perfumer + brand
export async function fetchPerfumesByPerfumerAndBrand(
    perfumer: string,
    brand: string
): Promise<APIPerfume[]> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/perfumes/perfumer/${encodeURIComponent(perfumer)}/brand/${encodeURIComponent(brand)}`
        );
        if (!response.ok) return [];
        const data = await response.json();
        const results: any[] = data.data ?? (Array.isArray(data) ? data : []);
        return results.map((item) => deepSanitizePerfume(item));
    } catch (error) {
        return [];
    }
}

export interface BrandInfo {
    name: string;
    count: number;
    imageUrl: string | null;
}

// Get all brands with image and count
export async function fetchBrands(): Promise<BrandInfo[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/perfumes/brands`);
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        const raw = data.data ?? data.brands ?? data;
        if (!Array.isArray(raw)) return [];
        // Normalise: backend may return {name, count, imageUrl} or plain strings
        return raw.map((item: any) =>
            typeof item === 'string'
                ? { name: item, count: 0, imageUrl: null }
                : { name: item.name ?? item, count: item.count ?? 0, imageUrl: item.imageUrl ?? item.image_url ?? null }
        );
    } catch (error) {
        return [];
    }
}

// Get statistics
export async function fetchStats(): Promise<{ total: number; brands: number }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/perfumes/stats`);
        if (!response.ok) {
            return { total: 0, brands: 0 };
        }
        const raw = await response.json();
        // Backend returns { success, data: { totalPerfumes, totalBrands, ... } }
        const d = raw.data ?? raw;
        return {
            total: d.totalPerfumes ?? d.total ?? 0,
            brands: d.totalBrands ?? d.brands ?? 0,
        };
    } catch (error) {
        return { total: 0, brands: 0 };
    }
}

// ============= ADMIN FUNCTIONS (Protected) =============

import { getAuthToken } from '@/contexts/AuthContext';

export const getAuthHeader = () => ({ Authorization: `Bearer ${getAuthToken()}` });

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
                ...getAuthHeader(),
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
            ...getAuthHeader(),
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
            ...getAuthHeader(),
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
            ...getAuthHeader(),
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
            ...getAuthHeader(),
        },
    });
    if (!response.ok) throw new Error('Failed to clear cache');
    return response.json();
}

// ============= SITEMAP & QUEUE FUNCTIONS =============

export interface CatalogDiscovery {
    active: boolean;
    phase: 'reading_index' | 'reading_sitemaps' | 'enqueueing' | 'done' | 'error' | null;
    currentSitemap: string | null;
    sitemapsTotal: number;
    sitemapsProcessed: number;
    urlsFound: number;
    urlsQueued: number;
    startedAt: string | null;
    finishedAt: string | null;
    error: string | null;
}

export interface QueueStatus {
    processing: boolean;
    current: string | null;
    processed: number;
    failed: number;
    remaining: number;
    total: number;
    processedThisSession?: number;
    failedThisSession?: number;
    rateLimitedThisSession?: number;
    startedAt: string | null;
    errors: Array<{ url: string; error: string; type?: 'error' | 'rate_limit'; time: string }>;
    processingRatePerHour?: number | null;
    etaMs?: number | null;
    catalogDiscovery?: CatalogDiscovery;
    brandImportJob?: BrandImportJob;
    algoliaJob?: {
        active: boolean;
        phase: 'brands' | 'perfumes' | 'enqueueing' | 'done' | 'error' | null;
        brandsDiscovered: number;
        perfumesDiscovered: number;
        urlsQueued: number;
        startedAt: string | null;
        finishedAt: string | null;
        error: string | null;
    };
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
            ...getAuthHeader(),
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
            ...getAuthHeader(),
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
            ...getAuthHeader(),
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
            ...getAuthHeader(),
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
            ...getAuthHeader(),
        },
    });

    if (!response.ok) throw new Error('Failed to stop queue');
    return response.json();
}

// Get queue status
export async function getQueueStatus(): Promise<QueueStatus> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/queue/status`, {
        headers: {
            ...getAuthHeader(),
        },
    });

    if (!response.ok) throw new Error('Failed to get queue status');
    const data = await response.json();
    return data;
}

// Clear queue (all, or by status: 'pending' | 'done' | 'failed')
export async function clearQueue(status?: string): Promise<{ success: boolean; deleted?: number }> {
    const url = status
        ? `${API_BASE_URL}/api/scrape/queue?status=${status}`
        : `${API_BASE_URL}/api/scrape/queue`;
    const response = await fetch(url, { method: 'DELETE', headers: getAuthHeader() });
    if (!response.ok) throw new Error('Failed to clear queue');
    return response.json();
}

// Retry all failed queue entries
export async function retryFailedQueue(): Promise<{ success: boolean; retried: number }> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/queue/retry-failed`, {
        method: 'POST',
        headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to retry failed URLs');
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
    hasNotes: boolean;
    hasAccords: boolean;
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
                ...getAuthHeader(),
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
            ...getAuthHeader(),
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
            ...getAuthHeader(),
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

// Add specific perfume IDs to the scraping queue for re-scraping
export async function addIdsToQueue(ids: string[]): Promise<{
    success: boolean;
    added?: number;
    queueSize?: number;
    total?: number;
    message?: string;
    error?: string;
}> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/scrape/rescrape/queue/ids`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ ids }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { success: false, error: err.error || `Error ${res.status}` };
        }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
    }
}

// Get incomplete perfumes grouped by brand
export interface IncompleteBrand {
    brand: string;
    count: number;
    ids: string[];
    urls: string[];
}

export async function getIncompletePerfumesByBrand(): Promise<{
    success: boolean;
    brands?: IncompleteBrand[];
    total?: number;
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/incomplete/by-brand`, {
        headers: { ...getAuthHeader() },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed' }));
        return { success: false, error: error.error || 'Failed to fetch by-brand data' };
    }
    return response.json();
}

// Re-scrape all incomplete perfumes from a specific brand (queue or direct)
export async function rescrapeBrand(brand: string, direct = false): Promise<{
    success: boolean;
    added?: number;
    queueSize?: number;
    autoStarted?: boolean;
    processed?: number;
    failed?: number;
    message?: string;
    error?: string;
}> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/rescrape/brand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ brand, direct }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed' }));
        return { success: false, error: error.error || 'Failed to rescrape brand' };
    }
    return response.json();
}

// ============= METRICS FUNCTIONS =============

export interface MetricsData {
    timestamp: string;
    uptime: number;
    system: {
        memory: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
            rssMB: string;
            heapTotalMB: string;
            heapUsedMB: string;
        };
        cpu: {
            loadAvg1m: number;
            loadAvg5m: number;
            loadAvg15m: number;
            cores: number;
            avgPercent: string;
        };
    };
    traffic: {
        totalRequests: number;
        rpm: string;
        byMethod: Record<string, number>;
        byStatus: Record<string, number>;
        topRoutes: Array<{ route: string; count: number }>;
    };
    latency: {
        avg: string;
        min: string;
        max: string;
        p50: string;
        p95: string;
        p99: string;
        samples: number;
    };
}

// Fetch backend metrics (protected with JWT)
export async function fetchMetrics(): Promise<MetricsData> {
    const response = await fetch(`${API_BASE_URL}/metrics`, {
        headers: {
            ...getAuthHeader(),
        },
    });
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
}

// ============= FAVORITES FUNCTIONS =============

export async function fetchFavorites(): Promise<APIPerfume[]> {
    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: { ...getAuthHeader() },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.favorites || []).map((p: any) => deepSanitizePerfume(p));
}

export async function addFavorite(perfumeId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/favorites/${perfumeId}`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
    });
    return response.ok;
}

export async function removeFavorite(perfumeId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/favorites/${perfumeId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    return response.ok;
}

// ============= USER MANAGEMENT (SuperAdmin) =============

export async function fetchUsers(): Promise<Array<{
    id: string; email: string; name: string | null;
    avatar_url: string | null; role: string; provider: string;
    is_active: boolean; created_at: string;
}>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: { ...getAuthHeader() },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.users || [];
}

export async function updateUserRole(userId: string, role: 'SUPERADMIN' | 'USER'): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ role }),
    });
    return response.ok;
}

export async function adminUpdateUser(
    userId: string,
    fields: { email?: string; newPassword?: string }
): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(fields),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Update failed' };
    }
    return { success: true };
}

export async function registerUser(
    email: string,
    name: string,
    password: string
): Promise<{ success: boolean; token?: string; user?: unknown; error?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error || 'Registration failed' };
        return { success: true, token: data.token, user: data.user };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function updateMyEmail(email: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ email }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Email update failed' };
    }
    const data = await res.json();
    return { success: true, ...data };
}

export async function updateMyPassword(
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Password update failed' };
    }
    return { success: true };
}

// ============= BRAND SCRAPING =============

export interface BrandScrapeResult {
    success: boolean;
    brand: string;
    brandUrl?: string;
    total: number;
    queued: number;
    skipped: number;
    queueSize?: number;
    autoStarted?: boolean;
    error?: string;
}

export interface BrandsScrapeResult {
    success: boolean;
    brands: Array<{
        brand: string;
        brandUrl?: string;
        total?: number;
        queued: number;
        skipped?: number;
        error?: string;
    }>;
    totalQueued: number;
    totalSkipped: number;
    queueSize: number;
    autoStarted: boolean;
}

export interface BrandLogoResult {
    name: string;
    logoUrl: string | null;
    status: 'updated' | 'not_found' | 'error';
    error?: string;
}

export interface BrandLogosJobStatus {
    success: boolean;
    status?: 'started' | 'already_running' | 'done';
    running: boolean;
    total: number;
    processed: number;
    updated: number;
    failed: number;
    results: BrandLogoResult[];
    startedAt: string | null;
    completedAt: string | null;
    message?: string;
    error?: string;
}

export async function fetchBrandLogos(force = false): Promise<BrandLogosJobStatus> {
    const res = await fetch(`${API_BASE_URL}/api/scrape/brands/logos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ force }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, running: false, total: 0, processed: 0, updated: 0, failed: 0, results: [], startedAt: null, completedAt: null, error: data.error };
    }
    return res.json();
}

export async function getBrandLogosStatus(): Promise<BrandLogosJobStatus> {
    const res = await fetch(`${API_BASE_URL}/api/scrape/brands/logos/status`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, running: false, total: 0, processed: 0, updated: 0, failed: 0, results: [], startedAt: null, completedAt: null, error: data.error };
    }
    return res.json();
}

export async function fetchBrandsWithoutLogos(): Promise<{
    success: boolean;
    total: number;
    brands: string[];
    error?: string;
}> {
    const res = await fetch(`${API_BASE_URL}/api/scrape/brands/without-logos`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, total: 0, brands: [], error: data.error };
    }
    return res.json();
}

export async function scrapeBrand(
    brand: string,
    options: { limit?: number; autoStart?: boolean } = {}
): Promise<BrandScrapeResult> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/brand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ brand, limit: options.limit ?? 500, autoStart: options.autoStart ?? false }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to scrape brand' }));
        return { success: false, brand, total: 0, queued: 0, skipped: 0, error: err.error };
    }
    return response.json();
}

export async function scrapeBrands(
    brands: string[],
    options: { limitPerBrand?: number; autoStart?: boolean } = {}
): Promise<BrandsScrapeResult> {
    const response = await fetch(`${API_BASE_URL}/api/scrape/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ brands, limitPerBrand: options.limitPerBrand ?? 500, autoStart: options.autoStart ?? false }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to scrape brands' }));
        throw new Error(err.error || 'Failed to scrape brands');
    }
    return response.json();
}

// ============= ABOUT PAGE CONTENT =============

export interface AboutContent {
    hero: { eyebrow: string; title: string; titleAccent: string; subtitle: string };
    story: { title: string; paragraphs: string[]; imageUrl: string; imageAlt: string };
    values: { title: string; items: Array<{ title: string; description: string }> };
}

export async function fetchAboutContent(): Promise<AboutContent | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/content/about`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.content ?? null;
    } catch {
        return null;
    }
}

export async function updateAboutContent(content: AboutContent): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/content/about`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(content),
        });
        return res.ok;
    } catch {
        return false;
    }
}

// ============= GEMINI AI RECOMMENDATIONS =============

export async function getAIConfig(): Promise<{ model: string; models: string[] }> {
    const res = await fetch(`${API_BASE_URL}/api/ai/config`, { headers: getAuthHeader() });
    return res.json();
}

export async function setAIDefaultModel(model: string): Promise<{ success: boolean; model: string }> {
    const res = await fetch(`${API_BASE_URL}/api/ai/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ model }),
    });
    return res.json();
}

export interface FullCatalogResult {
    success: boolean;
    status?: 'discovering' | 'done';
    message?: string;
    sitemapsDiscovered: number;
    totalFound: number;
    newQueued: number;
    alreadyExist: number;
    queueSize?: number;
    estimatedHours: number;
    estimatedDays: number;
    autoStarted: boolean;
    error?: string;
}

export interface SitemapUploadResult {
    success: boolean;
    filesProcessed?: number;
    totalFound?: number;
    newQueued?: number;
    alreadyExist?: number;
    error?: string;
}

export async function uploadSitemapFiles(files: File[]): Promise<SitemapUploadResult> {
    const form = new FormData();
    for (const f of files) form.append('sitemaps', f);
    const res = await fetch(`${API_BASE_URL}/api/scrape/catalog/upload`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: form,
    });
    return res.json();
}

export async function importFullCatalog(autoStart = true): Promise<FullCatalogResult> {
    const res = await fetch(`${API_BASE_URL}/api/scrape/catalog/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ autoStart }),
    });
    return res.json();
}

export interface GeminiRecommendation {
    name: string;
    brand: string;
    reason: string;
    keyNotes: string[];
}

export interface AIUserProfile {
    ageRange?: string;
    gender?: string;
    occasions?: string[];
    seasons?: string[];
    intensity?: string;
}

export interface DuplicateGroup {
    name: string;
    brand: string;
    count: number;
    duplicates: { id: number; name: string; brand: string; sourceUrl: string; rating: number }[];
}

export async function fetchDuplicates(): Promise<{ data: DuplicateGroup[]; count: number; error?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/scrape/duplicates`, {
            headers: getAuthHeader(),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { data: [], count: 0, error: data.error || 'Request failed' };
        }
        return res.json();
    } catch {
        return { data: [], count: 0, error: 'Network error' };
    }
}

export async function deleteDuplicates(): Promise<{ deleted: number; error?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/scrape/duplicates`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { deleted: 0, error: data.error || 'Request failed' };
        }
        return res.json();
    } catch {
        return { deleted: 0, error: 'Network error' };
    }
}

export async function fetchAIRecommendations(
    model?: string,
    profile?: AIUserProfile
): Promise<{
    recommendations: GeminiRecommendation[];
    basedOnFavorites: number;
    model?: string;
    error?: string;
}> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/ai/recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ model, profile }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { recommendations: [], basedOnFavorites: 0, error: data.error || 'Request failed' };
        }
        return res.json();
    } catch {
        return { recommendations: [], basedOnFavorites: 0, error: 'Network error' };
    }
}

// ─── Brand logo upload ────────────────────────────────────────────────────────

export async function uploadBrandLogo(brandName: string, file: File): Promise<{
    success: boolean;
    brand?: string;
    logoUrl?: string;
    error?: string;
}> {
    try {
        const form = new FormData();
        form.append('brandName', brandName);
        form.append('file', file);
        const res = await fetch(`${API_BASE_URL}/api/scrape/brands/logo/upload`, {
            method: 'POST',
            headers: { ...getAuthHeader() },
            body: form,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Error ${res.status}: ${res.statusText}` };
        }
        return res.json();
    } catch (err: any) {
        return { success: false, error: err?.message || 'No se pudo conectar con el servidor' };
    }
}

export interface BulkLogoUploadResult {
    filename: string;
    brand: string;
    logoUrl?: string;
    success: boolean;
    error?: string;
}

export async function uploadBrandLogosBulk(
    files: File[],
    mapping?: { filename: string; brandName: string }[]
): Promise<{
    success: boolean;
    total: number;
    updated: number;
    failed: number;
    results: BulkLogoUploadResult[];
    error?: string;
}> {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    if (mapping) form.append('mapping', JSON.stringify(mapping));
    try {
        const res = await fetch(`${API_BASE_URL}/api/scrape/brands/logos/bulk-upload`, {
            method: 'POST',
            headers: { ...getAuthHeader() },
            body: form,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, total: 0, updated: 0, failed: 0, results: [], error: data.error || `Error ${res.status}: ${res.statusText}` };
        }
        return res.json();
    } catch (err: any) {
        return { success: false, total: 0, updated: 0, failed: 0, results: [], error: err?.message || 'No se pudo conectar con el servidor' };
    }
}

// ============= BULK BRAND IMPORT =============

export interface BrandImportJob {
    active: boolean;
    paused: boolean;
    brandsTotal: number;
    brandsProcessed: number;
    brandsSucceeded: number;
    brandsFailed: number;
    urlsQueued: number;
    currentBrand: string | null;
    results: Array<{ brand: string; total: number; queued: number; skipped: number; logoUrl?: boolean; error?: string }>;
    startedAt: string | null;
    finishedAt: string | null;
}

export async function startBulkBrandImport(brands: string[], limitPerBrand = 500): Promise<{ success: boolean; total?: number; error?: string }> {
    const res = await fetch(`${API_BASE_URL}/api/scrape/brands/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ brands, limitPerBrand }),
    });
    return res.json();
}

export async function pauseBulkBrandImport(): Promise<{ success: boolean; paused?: boolean }> {
    const res = await fetch(`${API_BASE_URL}/api/scrape/brands/bulk/pause`, {
        method: 'POST',
        headers: getAuthHeader(),
    });
    return res.json();
}

export async function stopBulkBrandImport(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/api/scrape/brands/bulk/stop`, {
        method: 'POST',
        headers: getAuthHeader(),
    });
    return res.json();
}

// ============= DATABASE BACKUP / RESTORE (new comprehensive API) =============

const BACKUP_BASE = `${API_BASE_URL}/api/backup`;

export interface BackupDestination {
    id: string;
    name: string;
    type: 'webdav' | 'gdrive' | 'sftp';
    enabled: boolean;
    config: Record<string, string>;
}

export interface BackupConfig {
    destinations?: BackupDestination[];
    scheduleEnabled?: boolean;
    scheduleType?: 'daily' | 'weekly' | 'monthly';
    scheduleTime?: string;
    scheduleDay?: number;
    lastBackupAt?: string | null;
}

export interface LocalBackup {
    name: string;
    size: number;
    createdAt: string;
    path: string;
}

export async function getBackupConfig(): Promise<{ success: boolean; config?: BackupConfig; error?: string }> {
    try {
        const res = await fetch(`${BACKUP_BASE}/config`, { headers: getAuthHeader() });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Error ${res.status}` };
        }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
    }
}

export async function saveBackupConfig(config: BackupConfig): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${BACKUP_BASE}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(config),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Error ${res.status}` };
        }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
    }
}

export async function createBackupNow(brand?: string): Promise<{
    success: boolean;
    filename?: string;
    size?: number;
    localPath?: string;
    uploads?: Array<{ id: string; name: string; type: string; success: boolean; remotePath?: string; error?: string }>;
    error?: string;
}> {
    try {
        const res = await fetch(`${BACKUP_BASE}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ brand: brand || undefined, upload: true }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Error ${res.status}` };
        }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
    }
}

export async function listLocalBackups(): Promise<{
    success: boolean;
    backups?: LocalBackup[];
    lastBackupAt?: string | null;
    error?: string;
}> {
    try {
        const res = await fetch(`${BACKUP_BASE}/list`, { headers: getAuthHeader() });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Error ${res.status}` };
        }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
    }
}

export async function restoreFromBackupFile(filename: string): Promise<{
    success: boolean;
    imported?: number;
    total?: number;
    error?: string;
}> {
    try {
        const res = await fetch(`${BACKUP_BASE}/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ filename }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Error ${res.status}` };
        }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
    }
}

export async function deleteLocalBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${BACKUP_BASE}/local/${encodeURIComponent(filename)}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Error ${res.status}` };
        }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
    }
}

export async function testBackupDestination(type: string, config: Record<string, string>): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const res = await fetch(`${BACKUP_BASE}/test-destination`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ type, config }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { success: false, error: data.error || `Error ${res.status}` };
        }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e?.message || 'Network error' };
    }
}

// ============= DATABASE BACKUP / RESTORE (legacy) =============

export async function exportBackup(brand?: string): Promise<void> {
    const url = brand
        ? `${API_BASE_URL}/api/backup/export?brand=${encodeURIComponent(brand)}`
        : `${API_BASE_URL}/api/backup/export`;
    const res = await fetch(url, { headers: { ...getAuthHeader() } });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fragrance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

export async function importBackup(data: object): Promise<{ imported: number }> {
    const res = await fetch(`${API_BASE_URL}/api/backup/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Import failed');
    return res.json();
}
