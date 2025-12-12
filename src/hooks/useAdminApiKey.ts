import { useState, useEffect } from 'react';

// Must match the key in AuthContext
const STORAGE_KEY = 'fragrance_admin_key';

export function useAdminApiKey() {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  // Sync with storage changes (from AuthContext)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY) || '';
      setApiKey(stored);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    window.dispatchEvent(new Event('storage'));
  };

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    window.dispatchEvent(new Event('storage'));
  };

  return { apiKey, saveApiKey, clearApiKey, isConfigured: !!apiKey };
}

// Getter global para usar en api.ts
export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}
