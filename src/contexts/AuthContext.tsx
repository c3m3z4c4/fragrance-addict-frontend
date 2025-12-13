import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { API_BASE_URL } from '@/lib/api';

interface AuthContextType {
    isAdmin: boolean;
    apiKey: string | null;
    isLoading: boolean;
    login: (apiKey: string) => Promise<boolean>;
    logout: () => void;
    setApiKey: (key: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_KEY_STORAGE = 'fragrance_admin_key';
const API_KEY_STORAGE = 'apiKey';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [apiKey, setApiKeyState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Validate API key against backend
    const validateApiKey = async (key: string): Promise<boolean> => {
        try {
            console.log(
                '🔐 Validating API key against:',
                `${API_BASE_URL}/api/auth/validate`
            );

            const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
                headers: {
                    'x-api-key': key,
                },
            });

            if (response.ok) {
                console.log('✅ API key is valid');
                return true;
            } else {
                const errorData = await response
                    .json()
                    .catch(() => ({ error: 'Unknown error' }));
                console.error(
                    '❌ API key validation failed:',
                    response.status,
                    errorData
                );
                return false;
            }
        } catch (error) {
            console.error('❌ Connection error during validation:', error);
            return false;
        }
    };

    // Check stored keys on mount
    useEffect(() => {
        const checkStoredKeys = async () => {
            // Check admin key
            const storedAdminKey = localStorage.getItem(ADMIN_KEY_STORAGE);
            if (storedAdminKey) {
                console.log('🔍 Checking stored admin API key...');
                const isValid = await validateApiKey(storedAdminKey);
                setIsAdmin(isValid);
                if (!isValid) {
                    console.log('🗑️ Removing invalid stored admin key');
                    localStorage.removeItem(ADMIN_KEY_STORAGE);
                }
            }

            // Check regular API key
            const storedApiKey = localStorage.getItem(API_KEY_STORAGE);
            if (storedApiKey) {
                console.log('🔍 Checking stored API key...');
                const isValid = await validateApiKey(storedApiKey);
                if (isValid) {
                    setApiKeyState(storedApiKey);
                } else {
                    console.log('🗑️ Removing invalid stored API key');
                    localStorage.removeItem(API_KEY_STORAGE);
                }
            }

            setIsLoading(false);
        };
        checkStoredKeys();
    }, []);

    const login = async (key: string): Promise<boolean> => {
        setIsLoading(true);
        const isValid = await validateApiKey(key);
        if (isValid) {
            localStorage.setItem(ADMIN_KEY_STORAGE, key);
            setIsAdmin(true);
        }
        setIsLoading(false);
        return isValid;
    };

    const logout = () => {
        localStorage.removeItem(ADMIN_KEY_STORAGE);
        localStorage.removeItem(API_KEY_STORAGE);
        setIsAdmin(false);
        setApiKeyState(null);
    };

    const setApiKey = (key: string | null) => {
        if (key) {
            localStorage.setItem(API_KEY_STORAGE, key);
            setApiKeyState(key);
        } else {
            localStorage.removeItem(API_KEY_STORAGE);
            setApiKeyState(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{ isAdmin, apiKey, isLoading, login, logout, setApiKey }}
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
    return localStorage.getItem(ADMIN_KEY_STORAGE) || '';
}

export function getStoredApiKey(): string {
    return localStorage.getItem(API_KEY_STORAGE) || '';
}
