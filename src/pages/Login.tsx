import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/api';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendStatus, setBackendStatus] = useState<
        'checking' | 'online' | 'offline'
    >('checking');

    // Check if backend is reachable
    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/health`, {
                    method: 'GET',
                    mode: 'cors',
                });
                setBackendStatus(response.ok ? 'online' : 'offline');
            } catch (error) {
                console.error('Backend check error:', error);
                setBackendStatus('offline');
            }
        };

        checkBackend();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!apiKey.trim()) {
            toast.error(t('login.errorEmpty'));
            return;
        }

        if (backendStatus === 'offline') {
            toast.error(
                'Backend is not reachable. Please check your connection.'
            );
            return;
        }

        setIsSubmitting(true);
        const success = await login(apiKey);
        setIsSubmitting(false);

        if (success) {
            toast.success(t('login.success'));
            navigate('/admin');
        } else {
            toast.error('Invalid API key. Please check and try again.');
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
                    {t('login.backHome')}
                </Link>

                <Card className="border-border/50 shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">
                            {t('login.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('login.description')}
                        </CardDescription>

                        {/* Backend Status */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                            {backendStatus === 'checking' && (
                                <span className="text-muted-foreground">
                                    Checking backend...
                                </span>
                            )}
                            {backendStatus === 'online' && (
                                <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-3 w-3" /> Backend
                                    Online
                                </span>
                            )}
                            {backendStatus === 'offline' && (
                                <span className="flex items-center gap-1 text-destructive">
                                    <AlertCircle className="h-3 w-3" /> Backend
                                    Offline
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">
                                    {t('login.apiKeyLabel')}
                                </Label>
                                <Input
                                    id="apiKey"
                                    type="password"
                                    placeholder={t('login.apiKeyPlaceholder')}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    disabled={
                                        isSubmitting ||
                                        isLoading ||
                                        backendStatus === 'offline'
                                    }
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    API Key is stored securely in your browser's
                                    local storage only.
                                </p>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11"
                                disabled={
                                    isSubmitting ||
                                    isLoading ||
                                    backendStatus === 'offline'
                                }
                            >
                                {isSubmitting
                                    ? t('login.verifying')
                                    : t('login.submit')}
                            </Button>
                        </form>

                        <p className="mt-6 text-sm text-center text-muted-foreground">
                            {t('login.adminOnly')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
