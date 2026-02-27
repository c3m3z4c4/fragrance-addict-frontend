import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Chrome } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, loginWithGoogle, isLoading, isSuperAdmin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // If already authenticated as superadmin, redirect
    useEffect(() => {
        if (!isLoading && isSuperAdmin) {
            navigate('/admin');
        }
    }, [isLoading, isSuperAdmin, navigate]);

    // Show OAuth error if redirected from callback with error
    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'google_cancelled') toast.error('Google login cancelled.');
        else if (error === 'oauth_failed') toast.error('Google login failed. Please try again.');
        else if (error === 'user_creation_failed') toast.error('Could not create user. Please try again.');
    }, [searchParams]);

    // Check backend reachability
    useEffect(() => {
        fetch(`${API_BASE_URL}/health`)
            .then((r) => setBackendStatus(r.ok ? 'online' : 'offline'))
            .catch(() => setBackendStatus('offline'));
    }, []);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast.error('Email and password are required.');
            return;
        }
        if (backendStatus === 'offline') {
            toast.error('Backend is not reachable.');
            return;
        }
        setIsSubmitting(true);
        const success = await login(email, password);
        setIsSubmitting(false);
        if (success) {
            toast.success('Logged in successfully.');
            navigate('/admin');
        } else {
            toast.error('Invalid credentials.');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                </Link>

                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Sign in</CardTitle>
                        <CardDescription>
                            Access the admin panel or your account
                        </CardDescription>

                        {/* Backend Status */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                            {backendStatus === 'checking' && (
                                <span className="text-muted-foreground">Checking backend...</span>
                            )}
                            {backendStatus === 'online' && (
                                <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" /> Backend Online
                                </span>
                            )}
                            {backendStatus === 'offline' && (
                                <span className="flex items-center gap-1 text-destructive">
                                    <AlertCircle className="h-3 w-3" /> Backend Offline
                                </span>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Google OAuth */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11"
                            onClick={loginWithGoogle}
                            disabled={backendStatus === 'offline'}
                        >
                            <Chrome className="h-4 w-4 mr-2" />
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">or</span>
                            </div>
                        </div>

                        {/* Email / Password (superadmin) */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting || isLoading || backendStatus === 'offline'}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isSubmitting || isLoading || backendStatus === 'offline'}
                                    className="h-11"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11"
                                disabled={isSubmitting || isLoading || backendStatus === 'offline'}
                            >
                                {isSubmitting ? 'Signing in…' : 'Sign in with email'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
