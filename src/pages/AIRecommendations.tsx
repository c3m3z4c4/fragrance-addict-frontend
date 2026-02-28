import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, RefreshCw, Search, AlertCircle, Lock, ChevronDown } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAIRecommendations, type GeminiRecommendation } from '@/lib/api';

const MODELS = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Latest · Recommended' },
    { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro',   desc: 'Most capable' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Fast & efficient' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', desc: 'Lightweight' },
    { id: 'gemini-flash-latest', label: 'Gemini Flash (latest)', desc: 'Auto-updated' },
];

/** User qualifies if they have Google OAuth or a Gmail email */
function isGmailUser(user: { email: string; provider: string } | null): boolean {
    if (!user) return false;
    return user.provider === 'google' || user.email.toLowerCase().endsWith('@gmail.com');
}

export default function AIRecommendations() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [modelMenuOpen, setModelMenuOpen] = useState(false);
    const [recommendations, setRecommendations] = useState<GeminiRecommendation[]>([]);
    const [basedOn, setBasedOn] = useState(0);
    const [usedModel, setUsedModel] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    const gmailUser = isGmailUser(user);
    const activeModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        const result = await fetchAIRecommendations(selectedModel);
        setIsLoading(false);
        setHasGenerated(true);
        if (result.error) {
            setError(result.error);
        } else {
            setRecommendations(result.recommendations);
            setBasedOn(result.basedOnFavorites);
            setUsedModel((result as any).model || selectedModel);
        }
    };

    // ── Not logged in ──────────────────────────────────────────────────────────
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md px-4">
                        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h1 className="font-display text-2xl font-medium mb-3">
                            {t('ai.loginRequired', { defaultValue: 'Login required' })}
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            {t('ai.loginDesc', { defaultValue: 'Sign in with your Google account to get AI-powered perfume recommendations.' })}
                        </p>
                        <Button onClick={() => navigate('/login')}>
                            {t('login.title', { defaultValue: 'Log in' })}
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ── Not a Gmail / Google user ──────────────────────────────────────────────
    if (!gmailUser) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md px-4">
                        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h1 className="font-display text-2xl font-medium mb-3">
                            {t('ai.gmailRequired', { defaultValue: 'Gmail account required' })}
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            {t('ai.gmailDesc', { defaultValue: 'AI recommendations are powered by Google Gemini and require a Gmail or Google account. Sign in with Google to unlock this feature.' })}
                        </p>
                        <Button onClick={() => navigate('/login')}>
                            {t('ai.switchToGoogle', { defaultValue: 'Sign in with Google' })}
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ── Gmail / Google user ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
                {/* Page header */}
                <div className="text-center mb-10 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                        <Sparkles className="h-4 w-4" />
                        Gemini AI · {user.email}
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-medium mb-4">
                        {t('ai.title', { defaultValue: 'Your Scent' })}{' '}
                        <span className="italic text-accent">
                            {t('ai.titleAccent', { defaultValue: 'Profile' })}
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        {t('ai.subtitle', { defaultValue: 'Gemini analyses your favourite fragrances and suggests perfumes that match your unique taste.' })}
                    </p>
                </div>

                {/* Model selector + Generate button */}
                <div className="flex flex-col items-center gap-4 mb-12">
                    {/* Model picker */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setModelMenuOpen(o => !o)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm hover:border-accent/50 transition-colors"
                        >
                            <span className="font-medium">{activeModel.label}</span>
                            <span className="text-muted-foreground text-xs">{activeModel.desc}</span>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${modelMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {modelMenuOpen && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 rounded-xl border border-border bg-card shadow-lg z-10 overflow-hidden">
                                {MODELS.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => { setSelectedModel(m.id); setModelMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-accent/5 transition-colors text-left ${m.id === selectedModel ? 'text-accent font-medium' : ''}`}
                                    >
                                        <span>{m.label}</span>
                                        <span className="text-xs text-muted-foreground">{m.desc}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Generate */}
                    <Button
                        size="lg"
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="gap-3 text-base px-8 py-6 rounded-full"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="h-5 w-5 animate-spin" />
                                {t('ai.generating', { defaultValue: 'Analysing your taste…' })}
                            </>
                        ) : hasGenerated ? (
                            <>
                                <RefreshCw className="h-5 w-5" />
                                {t('ai.regenerate', { defaultValue: 'Regenerate suggestions' })}
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                {t('ai.generate', { defaultValue: 'Discover my scent profile' })}
                            </>
                        )}
                    </Button>
                </div>

                {/* Error state */}
                {error && (
                    <div className="flex items-start gap-3 p-5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive mb-8">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">{t('ai.errorTitle', { defaultValue: 'Could not generate recommendations' })}</p>
                            <p className="text-sm mt-1 opacity-80">{error}</p>
                            <p className="text-xs mt-2 opacity-60">Try selecting a different model above.</p>
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-6 border border-border rounded-2xl animate-pulse">
                                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                                <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                                <div className="h-16 bg-muted rounded w-full mb-3" />
                                <div className="flex gap-2">
                                    <div className="h-6 bg-muted rounded-full w-20" />
                                    <div className="h-6 bg-muted rounded-full w-24" />
                                    <div className="h-6 bg-muted rounded-full w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results */}
                {!isLoading && recommendations.length > 0 && (
                    <>
                        <p className="text-sm text-muted-foreground text-center mb-6">
                            {basedOn > 0
                                ? t('ai.basedOn', { count: basedOn, defaultValue: `Based on ${basedOn} favourite perfume${basedOn !== 1 ? 's' : ''}` })
                                : t('ai.basedOnGeneral', { defaultValue: 'Based on your general taste profile' })}
                            {usedModel && <span className="ml-2 opacity-60">· {usedModel}</span>}
                        </p>
                        <div className="space-y-4">
                            {recommendations.map((rec, i) => (
                                <div
                                    key={i}
                                    className="p-6 border border-border rounded-2xl hover:border-accent/50 transition-colors bg-card opacity-0 animate-fade-in"
                                    style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <h3 className="font-display text-xl font-medium">{rec.name}</h3>
                                            <p className="text-sm text-muted-foreground">{rec.brand}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 gap-1.5 text-accent hover:text-accent"
                                            onClick={() => navigate(`/search?q=${encodeURIComponent(rec.name)}`)}
                                        >
                                            <Search className="h-4 w-4" />
                                            {t('ai.find', { defaultValue: 'Find it' })}
                                        </Button>
                                    </div>
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{rec.reason}</p>
                                    {rec.keyNotes && rec.keyNotes.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {rec.keyNotes.map((note, j) => (
                                                <span key={j} className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent font-medium">
                                                    {note}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Empty — no favourites hint */}
                {!isLoading && hasGenerated && recommendations.length === 0 && !error && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>{t('ai.noResults', { defaultValue: 'No suggestions returned. Try adding some favourites first!' })}</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
