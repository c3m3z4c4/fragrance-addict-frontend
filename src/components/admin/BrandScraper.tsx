import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    scrapeBrand,
    scrapeBrands,
    getQueueStatus,
    startQueue,
    stopQueue,
    fetchBrandLogos,
    fetchBrandsWithoutLogos,
    type BrandScrapeResult,
    type BrandLogoResult,
    type QueueStatus,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
    Loader2,
    Play,
    Pause,
    X,
    Plus,
    Layers,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ImageIcon,
    Copy,
    Check,
    List,
} from 'lucide-react';

interface BrandResult extends BrandScrapeResult {
    status: 'pending' | 'done' | 'error';
}

export function BrandScraper() {
    const queryClient = useQueryClient();

    // Input state
    const [brandInput, setBrandInput] = useState('');
    const [brands, setBrands] = useState<string[]>([]);
    const [limitPerBrand, setLimitPerBrand] = useState('500');
    const [autoStart, setAutoStart] = useState(true);

    // Processing state
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<BrandResult[]>([]);

    // Logo fetching state
    const [isFetchingLogos, setIsFetchingLogos] = useState(false);
    const [logoResults, setLogoResults] = useState<{ updated: number; failed: number; results: BrandLogoResult[] } | null>(null);

    // Brands without logos
    const [isFetchingMissing, setIsFetchingMissing] = useState(false);
    const [missingLogos, setMissingLogos] = useState<string[] | null>(null);
    const [copied, setCopied] = useState(false);

    // Queue status
    const { data: queueStatus } = useQuery<QueueStatus>({
        queryKey: ['queue-status'],
        queryFn: getQueueStatus,
        refetchInterval: (data) => ((data as QueueStatus)?.processing ? 5000 : 15000),
    });

    const addBrand = useCallback(() => {
        const trimmed = brandInput.trim();
        if (!trimmed) return;
        if (brands.includes(trimmed)) {
            toast.error(`"${trimmed}" is already in the list`);
            return;
        }
        if (brands.length >= 20) {
            toast.error('Maximum 20 brands per batch');
            return;
        }
        setBrands((prev) => [...prev, trimmed]);
        setBrandInput('');
    }, [brandInput, brands]);

    const removeBrand = (brand: string) =>
        setBrands((prev) => prev.filter((b) => b !== brand));

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); addBrand(); }
    };

    const handleFetchMissingList = async () => {
        setIsFetchingMissing(true);
        try {
            const result = await fetchBrandsWithoutLogos();
            if (result.success) {
                setMissingLogos(result.brands);
            } else {
                toast.error(result.error ?? 'Failed to load list');
            }
        } catch {
            toast.error('Failed to load list');
        } finally {
            setIsFetchingMissing(false);
        }
    };

    const handleCopyMissing = () => {
        if (!missingLogos) return;
        navigator.clipboard.writeText(missingLogos.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFetchLogos = async () => {
        setIsFetchingLogos(true);
        setLogoResults(null);
        toast.info('Searching Wikimedia Commons for brand logos… this may take a few minutes.');
        try {
            const result = await fetchBrandLogos();
            if (result.success) {
                setLogoResults(result);
                toast.success(`Logos updated: ${result.updated} found, ${result.failed} not found`);
                queryClient.invalidateQueries({ queryKey: ['brands'] });
            } else {
                toast.error(result.error ?? 'Failed to fetch logos');
            }
        } catch {
            toast.error('Failed to fetch logos');
        } finally {
            setIsFetchingLogos(false);
        }
    };

    const handleScrape = async () => {
        if (brands.length === 0) { toast.error('Add at least one brand'); return; }

        setIsRunning(true);
        setResults(brands.map((b) => ({ success: false, brand: b, total: 0, queued: 0, skipped: 0, status: 'pending' })));

        try {
            if (brands.length === 1) {
                // Single brand — stream result immediately
                const result = await scrapeBrand(brands[0], {
                    limit: parseInt(limitPerBrand),
                    autoStart,
                });
                setResults([{ ...result, status: result.success ? 'done' : 'error' }]);
                if (result.success) {
                    toast.success(`${brands[0]}: ${result.queued} perfumes added to queue`);
                } else {
                    toast.error(result.error || `Failed to scrape ${brands[0]}`);
                }
            } else {
                // Multiple brands — single request
                const data = await scrapeBrands(brands, {
                    limitPerBrand: parseInt(limitPerBrand),
                    autoStart,
                });
                const mapped: BrandResult[] = data.brands.map((b) => ({
                    success: !b.error,
                    brand: b.brand,
                    brandUrl: b.brandUrl,
                    total: b.total ?? 0,
                    queued: b.queued,
                    skipped: b.skipped ?? 0,
                    error: b.error,
                    status: b.error ? 'error' : 'done',
                }));
                setResults(mapped);
                toast.success(
                    `Done! ${data.totalQueued} perfumes queued across ${brands.length} brands`
                );
            }

            queryClient.invalidateQueries({ queryKey: ['queue-status'] });
        } catch (err: any) {
            toast.error(err.message || 'Scraping failed');
        } finally {
            setIsRunning(false);
        }
    };

    const handleStartQueue = async () => {
        await startQueue();
        queryClient.invalidateQueries({ queryKey: ['queue-status'] });
        toast.success('Queue started');
    };

    const handleStopQueue = async () => {
        await stopQueue();
        queryClient.invalidateQueries({ queryKey: ['queue-status'] });
        toast.info('Queue stopped');
    };

    const progress = queueStatus?.total
        ? Math.round(((queueStatus.processed) / queueStatus.total) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Brand list builder */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" /> Scrape by Brand
                    </CardTitle>
                    <CardDescription>
                        Add one or more brands to fetch all their perfumes from Fragrantica and queue them for scraping.
                        Use the exact brand name as it appears on Fragrantica (e.g. "Dior", "Tom Ford", "Yves Saint Laurent").
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Brand input */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Brand name (e.g. Dior)"
                            value={brandInput}
                            onChange={(e) => setBrandInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isRunning}
                            className="max-w-xs"
                        />
                        <Button
                            variant="outline"
                            onClick={addBrand}
                            disabled={!brandInput.trim() || isRunning}
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    </div>

                    {/* Brand tags */}
                    {brands.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {brands.map((b) => (
                                <Badge
                                    key={b}
                                    variant="secondary"
                                    className="flex items-center gap-1 pr-1 text-sm"
                                >
                                    {b}
                                    <button
                                        onClick={() => removeBrand(b)}
                                        disabled={isRunning}
                                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Options */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="space-y-1">
                            <Label htmlFor="limit-per-brand">Max perfumes per brand</Label>
                            <Input
                                id="limit-per-brand"
                                type="number"
                                min="10"
                                max="2000"
                                step="50"
                                value={limitPerBrand}
                                onChange={(e) => setLimitPerBrand(e.target.value)}
                                disabled={isRunning}
                                className="w-28"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                            <Switch
                                id="auto-start"
                                checked={autoStart}
                                onCheckedChange={setAutoStart}
                                disabled={isRunning}
                            />
                            <Label htmlFor="auto-start">Auto-start queue after fetching</Label>
                        </div>
                    </div>

                    {/* Action button */}
                    <Button
                        onClick={handleScrape}
                        disabled={brands.length === 0 || isRunning}
                        className="w-full sm:w-auto"
                    >
                        {isRunning ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching brand pages…</>
                        ) : (
                            <><Play className="h-4 w-4 mr-2" /> Fetch &amp; Queue {brands.length > 0 ? `(${brands.length} brand${brands.length > 1 ? 's' : ''})` : ''}</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Fetch Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {results.map((r) => (
                                <div
                                    key={r.brand}
                                    className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        {r.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                        {r.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                        {r.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                                        <span className="font-medium">{r.brand}</span>
                                        {r.error && <span className="text-destructive text-xs ml-2">{r.error}</span>}
                                    </div>
                                    {r.status !== 'pending' && !r.error && (
                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                            <span className="text-green-600 font-medium">+{r.queued} queued</span>
                                            <span>{r.skipped} skipped</span>
                                            <span>{r.total} total</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Queue status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Queue Status</CardTitle>
                        <div className="flex gap-2">
                            {queueStatus?.processing ? (
                                <Button size="sm" variant="outline" onClick={handleStopQueue} className="border-amber text-amber hover:bg-amber/10">
                                    <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={handleStartQueue}
                                    disabled={!queueStatus?.remaining}
                                >
                                    <Play className="h-3.5 w-3.5 mr-1" />
                                    {queueStatus?.remaining ? 'Reanudar' : 'Iniciar cola'}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {queueStatus?.processing ? (
                        <>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground truncate">
                                Procesando: {queueStatus.current || '…'}
                            </p>
                        </>
                    ) : queueStatus?.remaining ? (
                        <p className="text-xs text-amber font-medium">
                            ⏸ Cola pausada — {queueStatus.remaining} perfumes pendientes
                        </p>
                    ) : null}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        {[
                            { label: 'Processed', value: queueStatus?.processed ?? 0, color: 'text-green-600' },
                            { label: 'Remaining', value: queueStatus?.remaining ?? 0, color: 'text-blue-600' },
                            { label: 'Failed', value: queueStatus?.failed ?? 0, color: 'text-destructive' },
                            { label: 'Total', value: queueStatus?.total ?? 0, color: '' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="rounded-lg border p-3">
                                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        ))}
                    </div>
                    {queueStatus?.errors && queueStatus.errors.length > 0 && (
                        <div className="space-y-1 mt-2">
                            <p className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
                                <AlertTriangle className="h-3 w-3" /> Recent errors
                            </p>
                            {queueStatus.errors.slice(-3).map((e, i) => (
                                <p key={i} className="text-xs text-destructive truncate">
                                    {e.url}: {e.error}
                                </p>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Brands without logos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5" /> Brands Without Logos
                    </CardTitle>
                    <CardDescription>
                        Get the list of brands that still have no logo in the database. Copy it and search for logos manually.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="outline"
                        onClick={handleFetchMissingList}
                        disabled={isFetchingMissing}
                        className="w-full sm:w-auto"
                    >
                        {isFetchingMissing ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…</>
                        ) : (
                            <><List className="h-4 w-4 mr-2" /> Show Brands Without Logo</>
                        )}
                    </Button>

                    {missingLogos !== null && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {missingLogos.length} brands without logo
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyMissing}
                                    disabled={missingLogos.length === 0}
                                >
                                    {copied ? <><Check className="h-3.5 w-3.5 mr-1 text-green-600" /> Copied!</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy list</>}
                                </Button>
                            </div>
                            {missingLogos.length > 0 ? (
                                <div className="rounded-md border bg-muted/30 p-3 max-h-60 overflow-y-auto">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                        {missingLogos.map(name => (
                                            <span key={name} className="text-xs truncate text-muted-foreground py-0.5">
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-green-600 font-medium">All brands have logos!</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Brand Logos via multi-source fetcher */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" /> Brand Logos
                    </CardTitle>
                    <CardDescription>
                        Search Wikimedia Commons and other sources for official brand logos. Only strict logo files (SVG/PNG with "logo" in filename) are accepted — no portrait photos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={handleFetchLogos}
                        disabled={isFetchingLogos}
                        className="w-full sm:w-auto"
                    >
                        {isFetchingLogos ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching logos…</>
                        ) : (
                            <><ImageIcon className="h-4 w-4 mr-2" /> Fetch All Brand Logos</>
                        )}
                    </Button>

                    {isFetchingLogos && (
                        <p className="text-xs text-muted-foreground animate-pulse">
                            Searching Wikimedia Commons for SVG/PNG logo files… only strict logo matches accepted.
                        </p>
                    )}

                    {logoResults && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="border rounded-sm p-3">
                                    <p className="text-2xl font-bold text-green-600">{logoResults.updated}</p>
                                    <p className="text-xs text-muted-foreground">Logos found</p>
                                </div>
                                <div className="border rounded-sm p-3">
                                    <p className="text-2xl font-bold text-muted-foreground">{logoResults.failed}</p>
                                    <p className="text-xs text-muted-foreground">Not found</p>
                                </div>
                            </div>

                            {/* Logo preview grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
                                {logoResults.results
                                    .filter(r => r.logoUrl)
                                    .map(r => (
                                        <div key={r.name} className="border rounded-sm p-2 bg-white flex flex-col items-center gap-1">
                                            <img src={r.logoUrl!} alt={r.name}
                                                className="h-10 w-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <p className="text-[9px] text-center text-muted-foreground truncate w-full">{r.name}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
