import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, RefreshCw, Search, AlertCircle, Lock, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAIRecommendations, type GeminiRecommendation, type AIUserProfile } from '@/lib/api';

const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '55+'];

const GENDERS = [
    { id: 'man',       label: 'Man' },
    { id: 'woman',     label: 'Woman' },
    { id: 'unisex', label: 'Unisex' },
];

const OCCASIONS = [
    { id: 'daily',   label: 'Daily' },
    { id: 'work',    label: 'Work' },
    { id: 'evening', label: 'Evening' },
    { id: 'sport',   label: 'Sport' },
    { id: 'travel',  label: 'Travel' },
];

const SEASONS = [
    { id: 'spring', label: '🌸 Spring' },
    { id: 'summer', label: '☀️ Summer' },
    { id: 'autumn', label: '🍂 Autumn' },
    { id: 'winter', label: '❄️ Winter' },
];

const INTENSITIES = [
    { id: 'light',   label: 'Light' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'strong',  label: 'Strong' },
];

const PROFILE_KEY = 'ai_user_profile';

// ── Helpers ────────────────────────────────────────────────────────────────────

function isGmailUser(user: { email: string; provider: string } | null): boolean {
    if (!user) return false;
    return user.provider === 'google' || user.email.toLowerCase().endsWith('@gmail.com');
}

function Pill({
    active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                active
                    ? 'bg-accent text-accent-foreground border-accent font-medium'
                    : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
            }`}
        >
            {children}
        </button>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AIRecommendations() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    // User profile (persisted in localStorage)
    const [profileOpen, setProfileOpen] = useState(false);
    const [profile, setProfile] = useState<AIUserProfile>(() => {
        try {
            const stored = localStorage.getItem(PROFILE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch { return {}; }
    });

    // Results
    const [recommendations, setRecommendations] = useState<GeminiRecommendation[]>([]);
    const [basedOn, setBasedOn] = useState(0);
    const [usedModel, setUsedModel] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Persist profile to localStorage on every change
    useEffect(() => {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }, [profile]);

    const gmailUser = isGmailUser(user);

    // Count filled profile fields
    const profileFilled = [
        profile.ageRange,
        profile.gender,
        profile.occasions?.length,
        profile.seasons?.length,
        profile.intensity,
    ].filter(Boolean).length;

    function toggleOccasion(id: string) {
        setProfile(p => {
            const list = p.occasions ?? [];
            return { ...p, occasions: list.includes(id) ? list.filter(o => o !== id) : [...list, id] };
        });
    }

    function toggleSeason(id: string) {
        setProfile(p => {
            const list = p.seasons ?? [];
            return { ...p, seasons: list.includes(id) ? list.filter(s => s !== id) : [...list, id] };
        });
    }

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        const result = await fetchAIRecommendations(undefined, profileFilled > 0 ? profile : undefined);
        setIsLoading(false);
        setHasGenerated(true);
        if (result.error) {
            setError(result.error);
        } else {
            setRecommendations(result.recommendations);
            setBasedOn(result.basedOnFavorites);
            setUsedModel(result.model || selectedModel);
        }
    };

    // ── Guards ─────────────────────────────────────────────────────────────────

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
                        <Button onClick={() => navigate('/login')}>{t('login.title', { defaultValue: 'Log in' })}</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

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
                            {t('ai.gmailDesc', { defaultValue: 'AI recommendations are powered by Google Gemini and require a Gmail or Google account.' })}
                        </p>
                        <Button onClick={() => navigate('/login')}>{t('ai.switchToGoogle', { defaultValue: 'Sign in with Google' })}</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ── Main view ──────────────────────────────────────────────────────────────

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
                        <span className="italic text-accent">{t('ai.titleAccent', { defaultValue: 'Profile' })}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        {t('ai.subtitle', { defaultValue: 'Gemini analyses your favourite fragrances and suggests perfumes that match your unique taste.' })}
                    </p>
                </div>

                {/* ── User profile form ── */}
                <div className="border border-border rounded-2xl mb-6 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setProfileOpen(o => !o)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4 text-accent" />
                            Personalize your recommendations
                            {profileFilled > 0 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                                    {profileFilled} filled
                                </span>
                            )}
                        </div>
                        {profileOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {profileOpen && (
                        <div className="px-5 pb-5 space-y-5 border-t border-border">

                            {/* Age range */}
                            <div className="pt-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Age range</p>
                                <div className="flex flex-wrap gap-2">
                                    {AGE_RANGES.map(r => (
                                        <Pill key={r} active={profile.ageRange === r} onClick={() => setProfile(p => ({ ...p, ageRange: p.ageRange === r ? undefined : r }))}>
                                            {r}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            {/* Gender */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Gender</p>
                                <div className="flex flex-wrap gap-2">
                                    {GENDERS.map(g => (
                                        <Pill key={g.id} active={profile.gender === g.id} onClick={() => setProfile(p => ({ ...p, gender: p.gender === g.id ? undefined : g.id }))}>
                                            {g.label}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            {/* Intensity */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preferred intensity</p>
                                <div className="flex flex-wrap gap-2">
                                    {INTENSITIES.map(i => (
                                        <Pill key={i.id} active={profile.intensity === i.id} onClick={() => setProfile(p => ({ ...p, intensity: p.intensity === i.id ? undefined : i.id }))}>
                                            {i.label}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            {/* Occasions */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Occasions <span className="normal-case font-normal">(select all that apply)</span></p>
                                <div className="flex flex-wrap gap-2">
                                    {OCCASIONS.map(o => (
                                        <Pill key={o.id} active={(profile.occasions ?? []).includes(o.id)} onClick={() => toggleOccasion(o.id)}>
                                            {o.label}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            {/* Seasons */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Seasons <span className="normal-case font-normal">(select all that apply)</span></p>
                                <div className="flex flex-wrap gap-2">
                                    {SEASONS.map(s => (
                                        <Pill key={s.id} active={(profile.seasons ?? []).includes(s.id)} onClick={() => toggleSeason(s.id)}>
                                            {s.label}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            {profileFilled > 0 && (
                                <button
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => setProfile({})}
                                >
                                    Clear profile
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Generate button ── */}
                <div className="flex flex-col items-center gap-4 mb-12">
                    <Button
                        size="lg"
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="gap-3 text-base px-8 py-6 rounded-full"
                    >
                        {isLoading ? (
                            <><RefreshCw className="h-5 w-5 animate-spin" />{t('ai.generating', { defaultValue: 'Analysing your taste…' })}</>
                        ) : hasGenerated ? (
                            <><RefreshCw className="h-5 w-5" />{t('ai.regenerate', { defaultValue: 'Regenerate suggestions' })}</>
                        ) : (
                            <><Sparkles className="h-5 w-5" />{t('ai.generate', { defaultValue: 'Discover my scent profile' })}</>
                        )}
                    </Button>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 p-5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive mb-8">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">{t('ai.errorTitle', { defaultValue: 'Could not generate recommendations' })}</p>
                            <p className="text-sm mt-1 opacity-80">{error}</p>
                            <p className="text-xs mt-2 opacity-60">Please try again in a few minutes.</p>
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

                {/* Empty */}
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
