import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { API_BASE_URL } from '@/lib/api';

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: 'SUPERADMIN' | 'USER';
    provider: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginWithGoogle: () => void;
    logout: () => void;
    updateProfile: (fields: { name?: string; avatarUrl?: string; email?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTH_TOKEN_KEY = 'fragrance_auth_token';

export function getAuthToken(): string {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

function getTokenExpiry(token: string): number | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const doLogout = useCallback(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
    }, []);

    // Schedule auto-logout when token expires
    const scheduleExpiry = useCallback((token: string) => {
        const expiry = getTokenExpiry(token);
        if (!expiry) return;
        const msUntilExpiry = expiry - Date.now();
        if (msUntilExpiry <= 0) {
            doLogout();
            return;
        }
        const timerId = window.setTimeout(() => {
            doLogout();
        }, msUntilExpiry);
        return () => clearTimeout(timerId);
    }, [doLogout]);

    // Verify stored JWT on mount
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            setIsLoading(false);
            return;
        }

        // Check expiry before hitting network
        const expiry = getTokenExpiry(token);
        if (expiry && expiry < Date.now()) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            setIsLoading(false);
            return;
        }

        fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (res.ok) {
                    const { user } = await res.json();
                    setUser(user);
                    scheduleExpiry(token);
                } else {
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                }
            })
            .catch(() => {
                localStorage.removeItem(AUTH_TOKEN_KEY);
            })
            .finally(() => setIsLoading(false));
    }, [scheduleExpiry]);

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) return false;
            const { token, user } = await res.json();
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            setUser(user);
            scheduleExpiry(token);
            return true;
        } catch {
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, name: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Registration failed' };
            localStorage.setItem(AUTH_TOKEN_KEY, data.token);
            setUser(data.user);
            scheduleExpiry(data.token);
            return { success: true };
        } catch {
            return { success: false, error: 'Network error' };
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = () => {
        window.location.href = `${API_BASE_URL}/api/auth/google`;
    };

    const logout = doLogout;

    const updateProfile = async (fields: { name?: string; avatarUrl?: string; email?: string }): Promise<boolean> => {
        const token = getAuthToken();
        if (!token || !user) return false;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(fields),
            });
            if (!res.ok) return false;
            const { user: updated } = await res.json();
            setUser(updated);
            return true;
        } catch {
            return false;
        }
    };

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isSuperAdmin,
                isAdmin: isSuperAdmin,
                login,
                register,
                loginWithGoogle,
                logout,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function getStoredAdminKey(): string {
    return getAuthToken();
}

export function getStoredApiKey(): string {
    return getAuthToken();
}
