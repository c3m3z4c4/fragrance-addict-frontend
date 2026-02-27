import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_TOKEN_KEY } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            navigate('/login?error=missing_token');
            return;
        }

        localStorage.setItem(AUTH_TOKEN_KEY, token);

        // Fetch user info to decide redirect destination
        fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error('auth_failed');
                const { user } = await res.json();
                navigate(user.role === 'SUPERADMIN' ? '/admin' : '/', { replace: true });
            })
            .catch(() => {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                navigate('/login?error=auth_failed');
            });
    }, []);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Signing you in…</p>
        </div>
    );
}
