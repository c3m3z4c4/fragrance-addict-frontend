/**
 * API Configuration
 * 
 * Para cambiar la URL del backend, modifica la variable API_BASE_URL
 * También puedes usar una variable de entorno: VITE_API_URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fragranceadict-backend-0tf5vy-debd22-31-97-41-99.traefik.me';

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
  sourceUrl?: string;
}

export interface SearchResponse {
  perfumes: APIPerfume[];
  total: number;
  page: number;
  limit: number;
}

// Fetch all perfumes with pagination
export async function fetchPerfumes(page = 1, limit = 20): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/perfumes?page=${page}&limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch perfumes');
  return response.json();
}

// Search perfumes by query
export async function searchPerfumes(query: string): Promise<APIPerfume[]> {
  const response = await fetch(`${API_BASE_URL}/api/perfumes/search?q=${encodeURIComponent(query)}`);
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
export async function fetchPerfumesByBrand(brand: string): Promise<APIPerfume[]> {
  const response = await fetch(`${API_BASE_URL}/api/perfumes/brand/${encodeURIComponent(brand)}`);
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

const getApiKey = () => import.meta.env.VITE_ADMIN_API_KEY || '';

// Scrape a perfume from URL
export async function scrapePerfume(url: string, save = true): Promise<{ success: boolean; data?: APIPerfume; error?: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/scrape/perfume?url=${encodeURIComponent(url)}&save=${save}`,
    {
      headers: {
        'x-api-key': getApiKey(),
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Scraping failed' }));
    return { success: false, error: error.error || 'Scraping failed' };
  }
  
  const data = await response.json();
  return { success: true, data: data.data || data };
}

// Batch scrape multiple URLs
export async function batchScrapePerfumes(
  urls: string[],
  save = true
): Promise<{ success: boolean; results?: Array<{ url: string; success: boolean; data?: APIPerfume; error?: string }>; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scrape/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
    },
    body: JSON.stringify({ urls, save }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Batch scraping failed' }));
    return { success: false, error: error.error || 'Batch scraping failed' };
  }
  
  const data = await response.json();
  return { success: true, results: data.results };
}

// Delete a perfume
export async function deletePerfume(id: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/perfumes/${id}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': getApiKey(),
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Delete failed' }));
    return { success: false, error: error.error || 'Delete failed' };
  }
  
  return { success: true };
}

// Get scraper cache stats
export async function getCacheStats(): Promise<{ hits: number; misses: number; keys: number }> {
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
export async function fetchSitemapUrls(brand?: string, limit = 100): Promise<{ success: boolean; urls?: string[]; count?: number; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scrape/sitemap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
    },
    body: JSON.stringify({ brand, limit }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch sitemap' }));
    return { success: false, error: error.error || 'Failed to fetch sitemap' };
  }
  
  const data = await response.json();
  return { success: true, urls: data.urls, count: data.count };
}

// Add URLs to scraping queue
export async function addToQueue(urls: string[]): Promise<{ success: boolean; added?: number; skipped?: number; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scrape/queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
    },
    body: JSON.stringify({ urls }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to add to queue' }));
    return { success: false, error: error.error || 'Failed to add to queue' };
  }
  
  return response.json();
}

// Start queue processing
export async function startQueue(): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scrape/queue/start`, {
    method: 'POST',
    headers: {
      'x-api-key': getApiKey(),
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to start queue' }));
    return { success: false, error: error.error || 'Failed to start queue' };
  }
  
  return response.json();
}

// Stop queue processing
export async function stopQueue(): Promise<{ success: boolean; message?: string }> {
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
