import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/contexts/AuthContext';
import { ArrowLeft, RefreshCw, Eye, Search, Users, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityStats {
    summary: {
        perfume_views: string;
        brand_searches: string;
        unique_sessions: string;
        unique_users: string;
    };
    events: Array<{
        id: number;
        session_id: string;
        event_type: string;
        entity_id: string | null;
        entity_name: string | null;
        created_at: string;
        user_id: string | null;
        email: string | null;
        user_name: string | null;
    }>;
    topPerfumes: Array<{ entity_name: string; views: string }>;
    topBrands: Array<{ entity_name: string; searches: string }>;
}

async function fetchActivityStats(): Promise<ActivityStats> {
    const res = await fetch(`${API_BASE_URL}/api/activity/stats?limit=100`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
}

const EventTypeIcon = ({ type }: { type: string }) => {
    if (type === 'perfume_view') return <Eye className="h-3.5 w-3.5 text-accent" />;
    if (type === 'brand_search') return <Search className="h-3.5 w-3.5 text-amber" />;
    return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
};

export default function ActivityMonitor() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['activity-stats'],
        queryFn: fetchActivityStats,
        refetchInterval: 30_000,
        staleTime: 10_000,
    });

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">

                {/* Header row */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="font-display text-2xl font-light tracking-wide">{t('activity.title')}</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('activity.subtitle')}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
                        className="text-[11px] tracking-[0.1em] uppercase font-bold gap-1.5">
                        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                        {t('common.refresh')}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-sm" />)}
                    </div>
                ) : error ? (
                    <p className="text-sm text-destructive text-center py-16">{t('common.error')}</p>
                ) : (
                    <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                            {[
                                { label: t('activity.perfumeViews'), value: data?.summary?.perfume_views ?? '0', icon: Eye, color: 'text-accent' },
                                { label: t('activity.brandSearches'), value: data?.summary?.brand_searches ?? '0', icon: Search, color: 'text-amber' },
                                { label: t('activity.uniqueSessions'), value: data?.summary?.unique_sessions ?? '0', icon: Activity, color: 'text-foreground' },
                                { label: t('activity.uniqueUsers'), value: data?.summary?.unique_users ?? '0', icon: Users, color: 'text-foreground' },
                            ].map((card) => (
                                <div key={card.label} className="border border-border/50 rounded-sm p-5 bg-card">
                                    <card.icon className={`h-4 w-4 mb-3 ${card.color}`} />
                                    <p className="font-display text-2xl font-semibold">{card.value}</p>
                                    <p className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.1em] mt-1">{card.label}</p>
                                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">{t('activity.last24h')}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6 mb-10">
                            {/* Top perfumes */}
                            <div className="border border-border/50 rounded-sm p-5 bg-card">
                                <h3 className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground/50 mb-4">
                                    {t('activity.topPerfumes')}
                                </h3>
                                {(data?.topPerfumes ?? []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground/40">{t('activity.noData')}</p>
                                ) : (
                                    <ol className="space-y-2">
                                        {data?.topPerfumes.map((p, i) => (
                                            <li key={p.entity_name} className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[10px] text-muted-foreground/30 w-4 shrink-0">{i + 1}</span>
                                                    <span className="text-xs truncate">{p.entity_name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-accent shrink-0">{p.views}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>

                            {/* Top brands */}
                            <div className="border border-border/50 rounded-sm p-5 bg-card">
                                <h3 className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground/50 mb-4">
                                    {t('activity.topBrands')}
                                </h3>
                                {(data?.topBrands ?? []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground/40">{t('activity.noData')}</p>
                                ) : (
                                    <ol className="space-y-2">
                                        {data?.topBrands.map((b, i) => (
                                            <li key={b.entity_name} className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[10px] text-muted-foreground/30 w-4 shrink-0">{i + 1}</span>
                                                    <span className="text-xs truncate">{b.entity_name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-amber shrink-0">{b.searches}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        </div>

                        {/* Recent events feed */}
                        <div className="border border-border/50 rounded-sm bg-card overflow-hidden">
                            <div className="px-5 py-4 border-b border-border/30">
                                <h3 className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground/50">
                                    {t('activity.recentEvents')}
                                </h3>
                            </div>
                            <div className="divide-y divide-border/20 max-h-[480px] overflow-y-auto">
                                {(data?.events ?? []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground/40 text-center py-10">{t('activity.noData')}</p>
                                ) : (
                                    data?.events.map((ev) => (
                                        <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/10 transition-colors">
                                            <EventTypeIcon type={ev.event_type} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs truncate">
                                                    <span className="font-medium">{ev.entity_name ?? ev.entity_id ?? '—'}</span>
                                                    {ev.email && (
                                                        <span className="text-muted-foreground/50 ml-1">· {ev.user_name ?? ev.email}</span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/40 mt-0.5 capitalize">
                                                    {ev.event_type.replace('_', ' ')}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground/30 shrink-0 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
