import React, {
    createContext,
    useContext,
    useState,
    useEffect,
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
    /** Legacy alias — used by components that check isAdmin */
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    loginWithGoogle: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTH_TOKEN_KEY = 'fragrance_auth_token';

export function getAuthToken(): string {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Verify stored JWT on mount
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
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
                } else {
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                }
            })
            .catch(() => {
                localStorage.removeItem(AUTH_TOKEN_KEY);
            })
            .finally(() => setIsLoading(false));
    }, []);

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
            return true;
        } catch {
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = () => {
        window.location.href = `${API_BASE_URL}/api/auth/google`;
    };

    const logout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
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
                loginWithGoogle,
                logout,
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

// Legacy helpers kept for backward compatibility with existing hooks/components
export function getStoredAdminKey(): string {
    return getAuthToken();
}

export function getStoredApiKey(): string {
    return getAuthToken();
}
