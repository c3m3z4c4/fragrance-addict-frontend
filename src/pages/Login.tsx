import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, CheckCircle, Chrome, Eye, EyeOff, Check, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

// ─── Password strength rules ──────────────────────────────────────────────────

const RULES = [
    { id: 'length',  label: 'At least 8 characters',            test: (p: string) => p.length >= 8 },
    { id: 'lower',   label: 'One lowercase letter',              test: (p: string) => /[a-z]/.test(p) },
    { id: 'upper',   label: 'One uppercase letter',              test: (p: string) => /[A-Z]/.test(p) },
    { id: 'number',  label: 'One number',                        test: (p: string) => /\d/.test(p) },
    { id: 'special', label: 'One special character (!@#$%…)',    test: (p: string) => /[\W_]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
    if (!password) return null;
    return (
        <ul className="space-y-1.5 mt-2">
            {RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                    <li key={rule.id} className={`flex items-center gap-2 text-[11px] transition-colors ${ok ? 'text-green-600' : 'text-muted-foreground/60'}`}>
                        {ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                        {rule.label}
                    </li>
                );
            })}
        </ul>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = 'login' | 'register';

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, register, loginWithGoogle, isLoading, isSuperAdmin, user } = useAuth();

    const [tab, setTab] = useState<Tab>('login');

    // Login fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register fields
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirm, setRegConfirm] = useState('');

    const [showPw, setShowPw] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && user) {
            navigate(isSuperAdmin ? '/admin' : '/profile');
        }
    }, [isLoading, user, isSuperAdmin, navigate]);

    // Show OAuth errors from callback
    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'google_cancelled') toast.error('Google login cancelled.');
        else if (error === 'oauth_failed') toast.error('Google login failed. Please try again.');
        else if (error === 'user_creation_failed') toast.error('Could not create account. Please try again.');
    }, [searchParams]);

    // Backend reachability check
    useEffect(() => {
        fetch(`${API_BASE_URL}/health`)
            .then((r) => setBackendStatus(r.ok ? 'online' : 'offline'))
            .catch(() => setBackendStatus('offline'));
    }, []);

    const passwordValid = RULES.every((r) => r.test(regPassword));

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginEmail.trim() || !loginPassword.trim()) {
            toast.error('Email and password are required.');
            return;
        }
        setIsSubmitting(true);
        const success = await login(loginEmail, loginPassword);
        setIsSubmitting(false);
        if (success) {
            toast.success('Welcome back!');
            navigate(isSuperAdmin ? '/admin' : '/profile');
        } else {
            toast.error('Invalid email or password.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regName.trim() || !regEmail.trim() || !regPassword) {
            toast.error('All fields are required.');
            return;
        }
        if (!passwordValid) {
            toast.error('Password does not meet the requirements.');
            return;
        }
        if (regPassword !== regConfirm) {
            toast.error('Passwords do not match.');
            return;
        }
        setIsSubmitting(true);
        const result = await register(regEmail.trim(), regName.trim(), regPassword);
        setIsSubmitting(false);
        if (!result.success) {
            toast.error(result.error ?? 'Registration failed.');
            return;
        }
        toast.success('Account created! Welcome.');
        navigate('/profile');
    };

    const offline = backendStatus === 'offline';

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Back link */}
                <Link to="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm">
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                </Link>

                {/* Card */}
                <div className="border border-border/50 rounded-sm bg-card shadow-xl overflow-hidden">

                    {/* Tab switcher */}
                    <div className="grid grid-cols-2 border-b border-border/50">
                        {(['login', 'register'] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`py-4 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors ${
                                    tab === t
                                        ? 'text-foreground border-b-2 border-accent -mb-px'
                                        : 'text-muted-foreground/55 hover:text-foreground'
                                }`}
                            >
                                {t === 'login' ? 'Sign In' : 'Register'}
                            </button>
                        ))}
                    </div>

                    <div className="p-7 space-y-5">

                        {/* Backend status */}
                        <div className="flex items-center justify-center gap-1.5 text-xs">
                            {backendStatus === 'checking' && <span className="text-muted-foreground">Checking backend…</span>}
                            {backendStatus === 'online' && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> Backend online</span>}
                            {backendStatus === 'offline' && <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> Backend offline</span>}
                        </div>

                        {/* Google OAuth button */}
                        <Button type="button" variant="outline" className="w-full h-11"
                            onClick={loginWithGoogle} disabled={offline}>
                            <Chrome className="h-4 w-4 mr-2" />
                            {tab === 'login' ? 'Continue with Google' : 'Register with Google'}
                        </Button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">or</span>
                            </div>
                        </div>

                        {/* ── LOGIN FORM ──────────────────────────────────── */}
                        {tab === 'login' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email" className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
                                    <Input id="login-email" type="email" placeholder="your@email.com"
                                        value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                                        disabled={isSubmitting || offline} className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-pw" className="text-xs uppercase tracking-wide text-muted-foreground">Password</Label>
                                    <div className="relative">
                                        <Input id="login-pw" type={showPw ? 'text' : 'password'}
                                            placeholder="••••••••" value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            disabled={isSubmitting || offline} className="h-11 pr-10" />
                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-11" disabled={isSubmitting || isLoading || offline}>
                                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                                </Button>
                                <p className="text-center text-xs text-muted-foreground">
                                    No account yet?{' '}
                                    <button type="button" onClick={() => setTab('register')}
                                        className="text-accent hover:underline font-medium">
                                        Register here
                                    </button>
                                </p>
                            </form>
                        )}

                        {/* ── REGISTER FORM ───────────────────────────────── */}
                        {tab === 'register' && (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-name" className="text-xs uppercase tracking-wide text-muted-foreground">Full Name</Label>
                                    <Input id="reg-name" type="text" placeholder="Ana García"
                                        value={regName} onChange={(e) => setRegName(e.target.value)}
                                        disabled={isSubmitting || offline} className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email" className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
                                    <Input id="reg-email" type="email" placeholder="your@email.com"
                                        value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                                        disabled={isSubmitting || offline} className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-pw" className="text-xs uppercase tracking-wide text-muted-foreground">Password</Label>
                                    <div className="relative">
                                        <Input id="reg-pw" type={showPw ? 'text' : 'password'}
                                            placeholder="••••••••" value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            disabled={isSubmitting || offline} className="h-11 pr-10" />
                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={regPassword} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-confirm" className="text-xs uppercase tracking-wide text-muted-foreground">Confirm Password</Label>
                                    <Input id="reg-confirm" type={showPw ? 'text' : 'password'}
                                        placeholder="••••••••" value={regConfirm}
                                        onChange={(e) => setRegConfirm(e.target.value)}
                                        disabled={isSubmitting || offline} className="h-11" />
                                    {regConfirm && regConfirm !== regPassword && (
                                        <p className="text-[11px] text-destructive">Passwords do not match</p>
                                    )}
                                </div>
                                <Button type="submit" className="w-full h-11"
                                    disabled={isSubmitting || isLoading || offline || !passwordValid || regPassword !== regConfirm}>
                                    {isSubmitting ? 'Creating account…' : 'Create account'}
                                </Button>
                                <p className="text-center text-xs text-muted-foreground">
                                    Already have an account?{' '}
                                    <button type="button" onClick={() => setTab('login')}
                                        className="text-accent hover:underline font-medium">
                                        Sign in
                                    </button>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
