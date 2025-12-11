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
