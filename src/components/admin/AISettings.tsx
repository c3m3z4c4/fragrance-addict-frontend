import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
    Loader2, CheckCircle2, XCircle, Eye, EyeOff,
    Zap, TestTube, Key, ChevronDown, ChevronUp, TriangleAlert,
    Sparkles, Play, Square,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIProvider {
    provider: string;
    label: string;
    models: string[];
    defaultModel: string;
    hasKey: boolean;
    keySource: 'database' | 'env' | 'none';
    apiKeyMasked: string | null;
    activeModel: string;
    isActive: boolean;
    updatedAt: string | null;
}

// ─── Provider icons (SVG inline) ─────────────────────────────────────────────

const ProviderIcon = ({ provider }: { provider: string }) => {
    if (provider === 'google_gemini') return (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
            <path d="M12 24A14.3 14.3 0 0 0 24 12 14.3 14.3 0 0 0 12 0 14.3 14.3 0 0 0 0 12a14.3 14.3 0 0 0 12 12z" fill="#4285F4" />
            <path d="M12 9.5c1.38 0 2.62.47 3.6 1.24l2.7-2.7A8.45 8.45 0 0 0 12 5.5a8.5 8.5 0 0 0-7.59 4.71l3.14 2.44A5.06 5.06 0 0 1 12 9.5z" fill="#EA4335" />
            <path d="M5.53 14.19A5.1 5.1 0 0 1 5.5 12c0-.76.13-1.5.36-2.19L2.7 7.37A8.5 8.5 0 0 0 3.5 12c0 1.65.47 3.19 1.28 4.5l2.75-2.31z" fill="#FBBC05" />
            <path d="M12 17.06a5.06 5.06 0 0 1-4.42-2.56l-3.14 2.44A8.5 8.5 0 0 0 12 20.5a8.45 8.45 0 0 0 5.8-2.32l-2.93-2.27A5.04 5.04 0 0 1 12 17.06z" fill="#34A853" />
            <path d="M20.5 12c0-.68-.07-1.34-.18-1.97H12v3.73h4.78A4.12 4.12 0 0 1 15 16.13l2.93 2.27A8.48 8.48 0 0 0 20.5 12z" fill="#4285F4" />
        </svg>
    );
    if (provider === 'openai') return (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M22.28 9.47a5.96 5.96 0 0 0-.52-4.9 6.04 6.04 0 0 0-6.5-2.9A6 6 0 0 0 10.74 0a6.04 6.04 0 0 0-5.76 4.18 5.98 5.98 0 0 0-4 2.9 6.04 6.04 0 0 0 .74 7.04 5.96 5.96 0 0 0 .52 4.91 6.04 6.04 0 0 0 6.5 2.9A6 6 0 0 0 13.26 24a6.04 6.04 0 0 0 5.76-4.19 5.98 5.98 0 0 0 4-2.9 6.04 6.04 0 0 0-.74-7.44zM13.26 22.5a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.79-2.77a.77.77 0 0 0 .39-.68v-6.77l2.02 1.17a.07.07 0 0 1 .04.06v5.6a4.5 4.5 0 0 1-4.5 4.5zm-9.63-4.13a4.48 4.48 0 0 1-.54-3.02l.14.09 4.79 2.77a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.07.07 0 0 1-.03.06l-4.84 2.8a4.5 4.5 0 0 1-6.14-1.66zm-1.25-10.4a4.48 4.48 0 0 1 2.34-1.97v5.7a.77.77 0 0 0 .39.67l5.84 3.37-2.02 1.17a.07.07 0 0 1-.07 0L4.02 13.5a4.5 4.5 0 0 1-.64-5.52zm16.6 3.87-5.84-3.37 2.02-1.17a.07.07 0 0 1 .07 0l4.84 2.8a4.5 4.5 0 0 1-.7 8.12v-5.7a.77.77 0 0 0-.39-.68zm2.01-3.04-.14-.08-4.79-2.77a.77.77 0 0 0-.78 0L9.44 10.32V8a.07.07 0 0 1 .03-.06l4.84-2.79a4.5 4.5 0 0 1 6.68 4.66zm-12.65 4.16-2.02-1.17a.07.07 0 0 1-.04-.06v-5.6a4.5 4.5 0 0 1 7.38-3.46l-.14.08-4.79 2.77a.77.77 0 0 0-.39.68v6.76zm1.1-2.36 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3z" />
        </svg>
    );
    // Anthropic
    return (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
            <path d="M17.3 3H13.7L8 21h3.7l1.3-4.3h4l1.3 4.3H22zm-3.8 10.5 1.3-4.3 1.3 4.3zM6.7 3H3L7 12.1 3.1 21H6.8l2.3-5.6L11.4 21h3.7z" />
        </svg>
    );
};

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({ p, authToken }: { p: AIProvider; authToken: string }) {
    const queryClient = useQueryClient();
    const [showKey, setShowKey] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [editingKey, setEditingKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState(p.activeModel);
    const [showModels, setShowModels] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [testing, setTesting] = useState(false);

    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ai-providers'] });

    const saveKeyMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/ai/providers/${p.provider}/key`, {
                method: 'PUT', headers, body: JSON.stringify({ apiKey: newKey }),
            });
            if (!r.ok) throw new Error((await r.json()).error || 'Error');
        },
        onSuccess: () => {
            toast({ title: 'API key saved' });
            setEditingKey(false);
            setNewKey('');
            invalidate();
        },
        onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });

    const saveModelMutation = useMutation({
        mutationFn: async (model: string) => {
            const r = await fetch(`${API_BASE_URL}/api/ai/providers/${p.provider}/model`, {
                method: 'PATCH', headers, body: JSON.stringify({ model }),
            });
            if (!r.ok) throw new Error((await r.json()).error || 'Error');
        },
        onSuccess: (_, model) => {
            toast({ title: 'Model updated', description: model });
            invalidate();
        },
        onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });

    const activateMutation = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/ai/providers/${p.provider}/activate`, {
                method: 'POST', headers,
            });
            if (!r.ok) throw new Error((await r.json()).error || 'Error');
        },
        onSuccess: () => {
            toast({ title: `${p.label} is now the active AI` });
            invalidate();
        },
        onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const r = await fetch(`${API_BASE_URL}/api/ai/providers/${p.provider}/test`, {
                method: 'POST', headers,
            });
            const data = await r.json();
            setTestResult({ ok: data.success, msg: data.success ? data.message : data.error });
        } catch {
            setTestResult({ ok: false, msg: 'Network error' });
        } finally {
            setTesting(false);
        }
    };

    const isActive = p.isActive;
    const hasKey = p.hasKey;

    return (
        <Card className={`transition-all ${isActive ? 'border-accent ring-1 ring-accent/30' : 'border-border'}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                            <ProviderIcon provider={p.provider} />
                        </div>
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                {p.label}
                                {isActive && (
                                    <Badge variant="outline" className="text-[10px] text-accent border-accent/40 gap-1 py-0">
                                        <Zap className="h-2.5 w-2.5" /> Activo
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                {hasKey ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Key configurada {p.keySource === 'env' ? '(env var)' : '(DB)'}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-amber-600">
                                        <XCircle className="h-3 w-3" /> Sin API key
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                        {!isActive && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                disabled={!hasKey || activateMutation.isPending}
                                onClick={() => activateMutation.mutate()}
                            >
                                {activateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Activar'}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7"
                            disabled={!hasKey || testing}
                            onClick={testConnection}
                        >
                            {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
                {/* Test result */}
                {testResult && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${testResult.ok ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                        {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
                        {testResult.msg}
                    </div>
                )}

                {/* API Key section */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Key className="h-3 w-3" /> API Key
                    </label>
                    {editingKey ? (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type={showKey ? 'text' : 'password'}
                                    placeholder="Pega tu API key aquí…"
                                    value={newKey}
                                    onChange={e => setNewKey(e.target.value)}
                                    className="text-xs pr-8 h-8 font-mono"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowKey(v => !v)}
                                >
                                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <Button size="sm" className="h-8 text-xs" disabled={!newKey || saveKeyMutation.isPending} onClick={() => saveKeyMutation.mutate()}>
                                {saveKeyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditingKey(false); setNewKey(''); }}>
                                Cancelar
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-1.5 bg-muted rounded-md text-xs font-mono text-muted-foreground h-8 flex items-center">
                                {p.apiKeyMasked || '— no configurada —'}
                            </div>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditingKey(true)}>
                                {p.hasKey ? 'Cambiar' : 'Agregar'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Model selector */}
                <div className="space-y-2">
                    <button
                        type="button"
                        className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowModels(v => !v)}
                    >
                        <span>Modelo activo: <span className="text-foreground font-mono">{selectedModel}</span></span>
                        {showModels ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showModels && (
                        <div className="space-y-1">
                            {p.models.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setSelectedModel(m);
                                        saveModelMutation.mutate(m);
                                        setShowModels(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors font-mono ${
                                        m === selectedModel
                                            ? 'bg-accent/10 text-accent border border-accent/30'
                                            : 'hover:bg-muted border border-transparent'
                                    }`}
                                >
                                    {m} {m === p.defaultModel && <span className="text-muted-foreground ml-1">(default)</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── AI Enrichment section ────────────────────────────────────────────────────

interface EnrichConfig {
    configured: boolean;
    provider: string | null;
    model: string | null;
    minConfidence: number;
    enrichableFields: string[];
}

interface BulkStatus {
    running: boolean;
    total: number;
    processed: number;
    enriched: number;
    skipped: number;
    failed: number;
    startedAt: string | null;
    finishedAt: string | null;
}

const FIELD_LABELS: Record<string, string> = {
    notes: 'Notas (top/heart/base)',
    accords: 'Acordes principales',
    perfumer: 'Perfumista',
    description: 'Descripción',
    concentration: 'Concentración',
};

function AIEnrichmentSection({ authToken, activeProviderLabel }: { authToken: string; activeProviderLabel: string | null }) {
    const queryClient = useQueryClient();
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

    const [fields, setFields] = useState<string[]>(['notes', 'accords', 'perfumer', 'description', 'concentration']);
    const [minConfidence, setMinConfidence] = useState(0.6);
    const [limit, setLimit] = useState(50);

    const { data: config } = useQuery<EnrichConfig>({
        queryKey: ['enrich-config'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/scrape/enrich-ai/config`, { headers });
            return r.json();
        },
    });

    const { data: bulk } = useQuery<BulkStatus>({
        queryKey: ['enrich-bulk-status'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/scrape/enrich-ai/bulk/status`, { headers });
            return r.json();
        },
        refetchInterval: (q) => ((q.state.data as BulkStatus)?.running ? 1500 : false),
    });

    const startBulk = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/scrape/enrich-ai/bulk`, {
                method: 'POST', headers,
                body: JSON.stringify({ limit, minConfidence, fields }),
            });
            return r.json();
        },
        onSuccess: (res) => {
            toast({
                title: res.success ? 'Enriquecimiento iniciado' : 'Error',
                description: res.success ? `${res.total} perfumes en cola` : res.error,
                variant: res.success ? 'default' : 'destructive',
            });
            queryClient.invalidateQueries({ queryKey: ['enrich-bulk-status'] });
        },
    });

    const stopBulk = useMutation({
        mutationFn: async () => {
            await fetch(`${API_BASE_URL}/api/scrape/enrich-ai/bulk/stop`, { method: 'POST', headers });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrich-bulk-status'] }),
    });

    const toggleField = (f: string) =>
        setFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

    const running = bulk?.running;
    const pct = bulk && bulk.total > 0 ? Math.round((bulk.processed / bulk.total) * 100) : 0;

    return (
        <Card className="border-accent/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-accent" /> Enriquecimiento con IA
                </CardTitle>
                <CardDescription>
                    Rellena notas, acordes, perfumista y descripción de perfumes incompletos usando el proveedor de IA activo.
                    Solo se guardan resultados con confianza ≥ umbral (evita alucinaciones).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!config?.configured ? (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                        <TriangleAlert className="h-3.5 w-3.5" /> No hay proveedor de IA activo. Activa uno arriba.
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground">
                        Usando <strong className="text-foreground">{activeProviderLabel || config.provider}</strong>
                        {config.model && <> · <code className="bg-muted px-1 rounded">{config.model}</code></>}
                    </div>
                )}

                {/* Field selection */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Campos a rellenar</label>
                    <div className="flex flex-wrap gap-2">
                        {(config?.enrichableFields || Object.keys(FIELD_LABELS)).map(f => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => toggleField(f)}
                                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                                    fields.includes(f)
                                        ? 'bg-accent/10 text-accent border-accent/30'
                                        : 'border-input text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {FIELD_LABELS[f] || f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Confidence + limit */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                            Confianza mínima: <span className="text-foreground">{minConfidence.toFixed(2)}</span>
                        </label>
                        <input
                            type="range" min={0} max={1} step={0.05}
                            value={minConfidence}
                            onChange={e => setMinConfidence(parseFloat(e.target.value))}
                            className="w-full accent-[hsl(var(--accent))]"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Límite por lote</label>
                        <Input
                            type="number" min={1} max={500}
                            value={limit}
                            onChange={e => setLimit(Math.max(1, parseInt(e.target.value) || 1))}
                            className="h-8 text-xs"
                        />
                    </div>
                </div>

                {/* Progress */}
                {bulk && (bulk.running || bulk.processed > 0) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{running ? 'Procesando…' : 'Último lote'}</span>
                            <span>{bulk.processed} / {bulk.total} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="text-green-600">✓ {bulk.enriched} enriquecidos</span>
                            <span>↷ {bulk.skipped} baja confianza</span>
                            {bulk.failed > 0 && <span className="text-red-500">✗ {bulk.failed} fallidos</span>}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    {running ? (
                        <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => stopBulk.mutate()}>
                            <Square className="h-3 w-3 mr-1" /> Detener
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            className="h-8 text-xs"
                            disabled={!config?.configured || fields.length === 0 || startBulk.isPending}
                            onClick={() => startBulk.mutate()}
                        >
                            {startBulk.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                            Enriquecer incompletos
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AISettings() {
    const token = getAuthToken() || '';

    const { data, isLoading } = useQuery<{ success: boolean; data: AIProvider[] }>({
        queryKey: ['ai-providers'],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/ai/providers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return r.json();
        },
    });

    const providers = data?.data || [];
    const active = providers.find(p => p.isActive);

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-lg font-medium">Integraciones de IA</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Configura qué proveedor de IA se usará para las recomendaciones de perfumes. Solo un proveedor puede estar activo a la vez.
                </p>
            </div>

            {active && (
                <div className="flex items-center gap-2 px-4 py-3 bg-accent/5 border border-accent/20 rounded-lg text-sm">
                    <Zap className="h-4 w-4 text-accent shrink-0" />
                    <span>Proveedor activo: <strong>{active.label}</strong> con modelo <code className="text-xs bg-muted px-1 rounded">{active.activeModel}</code></span>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando proveedores…
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
                    {providers.map(p => (
                        <ProviderCard key={p.provider} p={p} authToken={token} />
                    ))}
                </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-muted-foreground">
                <TriangleAlert className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p>Las API keys se guardan en la base de datos. Para mayor seguridad en producción, puedes configurarlas como variables de entorno (<code className="bg-muted px-1 rounded">GEMINI_API_KEY</code>, <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code>, <code className="bg-muted px-1 rounded">ANTHROPIC_API_KEY</code>). Las variables de entorno se usan como fallback si no hay key en DB.</p>
            </div>

            <AIEnrichmentSection authToken={token} activeProviderLabel={active?.label || null} />
        </div>
    );
}
