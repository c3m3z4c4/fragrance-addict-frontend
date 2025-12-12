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
    isLoading: boolean;
    login: (apiKey: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_KEY_STORAGE = 'fragrance_admin_key';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Validate API key against backend
    const validateApiKey = async (apiKey: string): Promise<boolean> => {
        try {
            console.log(
                '🔐 Validating API key against:',
                `${API_BASE_URL}/api/auth/validate`
            );

            const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
                headers: {
                    'x-api-key': apiKey,
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

    // Check stored key on mount
    useEffect(() => {
        const checkStoredKey = async () => {
            const storedKey = localStorage.getItem(ADMIN_KEY_STORAGE);
            if (storedKey) {
                console.log('🔍 Checking stored API key...');
                const isValid = await validateApiKey(storedKey);
                setIsAdmin(isValid);
                if (!isValid) {
                    console.log('🗑️ Removing invalid stored key');
                    localStorage.removeItem(ADMIN_KEY_STORAGE);
                }
            }
            setIsLoading(false);
        };
        checkStoredKey();
    }, []);

    const login = async (apiKey: string): Promise<boolean> => {
        setIsLoading(true);
        const isValid = await validateApiKey(apiKey);
        if (isValid) {
            localStorage.setItem(ADMIN_KEY_STORAGE, apiKey);
            setIsAdmin(true);
        }
        setIsLoading(false);
        return isValid;
    };

    const logout = () => {
        localStorage.removeItem(ADMIN_KEY_STORAGE);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ isAdmin, isLoading, login, logout }}>
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
