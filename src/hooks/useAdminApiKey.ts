import { AUTH_TOKEN_KEY, getAuthToken } from '@/contexts/AuthContext';

// Legacy hook — kept so existing call sites compile without changes.
// Now returns the JWT token instead of an API key.
export function useAdminApiKey() {
    const apiKey = getAuthToken();
    return {
        apiKey,
        saveApiKey: (_: string) => {},
        clearApiKey: () => {},
        isConfigured: !!apiKey,
    };
}

// Getter global used by api.ts (legacy name kept for compat)
export function getStoredApiKey(): string {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}
