import { useState, useEffect } from 'react';

const STORAGE_KEY = 'admin_api_key';

export function useAdminApiKey() {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  const saveApiKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
  };

  return { apiKey, saveApiKey, clearApiKey, isConfigured: !!apiKey };
}

// Getter global para usar en api.ts
export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}
