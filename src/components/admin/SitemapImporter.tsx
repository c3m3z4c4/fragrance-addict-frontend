import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchSitemapUrls,
  addToQueue,
  startQueue,
  stopQueue,
  getQueueStatus,
  clearQueue,
  retryFailedQueue,
  checkExistingUrls,
  importFullCatalog,
  uploadSitemapFiles,
  type QueueStatus,
  type FullCatalogResult,
  type CatalogDiscovery,
} from '@/lib/api';
import { BulkBrandImporter } from './BulkBrandImporter';
import { AlgoliaImporter } from './AlgoliaImporter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  Play,
  Trash2,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Database,
  Globe,
  TriangleAlert,
  RotateCcw,
  Pause,
  Zap,
  Timer,
  MapPin,
  Upload,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrlCheckResult {
  total: number;
  existingCount: number;
  newCount: number;
  newUrls: string[];
}

// Format milliseconds into a human-readable duration
function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`;
}

function formatEta(etaMs: number): string {
  const eta = new Date(Date.now() + etaMs);
  const durationStr = formatDuration(etaMs);
  const dateStr = eta.toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${durationStr} · termina ~${dateStr}`;
}

function DiscoveryProgressPanel({ discovery }: { discovery: CatalogDiscovery }) {
  const phaseLabel: Record<string, string> = {
    reading_index: 'Leyendo índice de sitemaps…',
    reading_sitemaps: 'Extrayendo URLs de sitemaps…',
    enqueueing: 'Agregando URLs a la cola…',
    done: 'Descubrimiento completado',
    error: 'Error en descubrimiento',
  };

  const isActive = discovery.active;
  const isDone = discovery.phase === 'done';
  const isError = discovery.phase === 'error';

  const sitemapProgress =
    discovery.sitemapsTotal > 0
      ? (discovery.sitemapsProcessed / discovery.sitemapsTotal) * 100
      : 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3 text-sm',
        isError
          ? 'bg-destructive/10 border-destructive/30'
          : isDone
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-accent/10 border-accent/30',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 font-medium">
        {isError ? (
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />
        )}
        <span>{phaseLabel[discovery.phase ?? ''] ?? 'Procesando…'}</span>
      </div>

      {/* Sitemap progress bar */}
      {discovery.sitemapsTotal > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Sitemaps</span>
            <span>{discovery.sitemapsProcessed} / {discovery.sitemapsTotal}</span>
          </div>
          <Progress value={sitemapProgress} className="h-1.5" />
        </div>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {discovery.urlsFound > 0 && (
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {discovery.urlsFound.toLocaleString()} URLs encontradas
          </span>
        )}
        {discovery.currentSitemap && isActive && (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {discovery.currentSitemap}
          </span>
        )}
        {discovery.urlsQueued > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <Plus className="h-3 w-3" />
            {discovery.urlsQueued.toLocaleString()} nuevas en cola
          </span>
        )}
      </div>

      {/* Error message */}
      {isError && discovery.error && (
        <p className="text-xs text-destructive">{discovery.error}</p>
      )}
    </div>
  );
}

export function SitemapImporter() {
  const [brand, setBrand] = useState('');
  const [limit, setLimit] = useState('50');
  const [urlCheckResult, setUrlCheckResult] = useState<UrlCheckResult | null>(null);
  const [fetchedUrls, setFetchedUrls] = useState<string[]>([]);
  const [fullCatalogResult, setFullCatalogResult] = useState<FullCatalogResult | null>(null);
  const [showFullCatalogConfirm, setShowFullCatalogConfirm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const queryClient = useQueryClient();

  // Adaptive polling: fast when active, slow when idle
  const { data: queueStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['queue-status'],
    queryFn: getQueueStatus,
    refetchInterval: (query) => {
      const data = query.state.data as QueueStatus | undefined;
      if (data?.processing) return 3000;          // 3s while scraping
      if (data?.catalogDiscovery?.active) return 2000; // 2s during sitemap discovery
      if ((data?.remaining ?? 0) > 0) return 15000;  // 15s when paused with items
      return false;                                // idle — no polling
    },
    retry: 1,
    retryDelay: 5000,
    staleTime: 2000,
  });

  // Invalidate catalog queries when scraping
  useEffect(() => {
    if (queueStatus?.processing) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
        queryClient.invalidateQueries({ queryKey: ['perfumes'] });
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [queueStatus?.processing, queryClient]);

  const fetchUrlsMutation = useMutation({
    mutationFn: async () => {
      const result = await fetchSitemapUrls(brand || undefined, parseInt(limit));
      if (!result.success || !result.urls) {
        throw new Error(result.error || 'Failed to fetch URLs');
      }
      if (result.urls.length === 0) {
        throw new Error('No URLs found. Try a different brand name or check spelling.');
      }
      setFetchedUrls(result.urls);
      const checkResult = await checkExistingUrls(result.urls);
      if (!checkResult.success) {
        throw new Error(checkResult.error || 'Failed to check existing URLs');
      }
      return checkResult;
    },
    onSuccess: (result) => {
      setUrlCheckResult({
        total: result.total || 0,
        existingCount: result.existingCount || 0,
        newCount: result.newCount || 0,
        newUrls: result.newUrls || [],
      });
      toast({
        title: 'URLs verificadas',
        description: `${result.newCount} nuevas fragancias (${result.existingCount} ya existen)`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const addToQueueMutation = useMutation({
    mutationFn: () => addToQueue(urlCheckResult?.newUrls || []),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Agregadas a la cola', description: `${result.added} URLs agregadas` });
        setUrlCheckResult(null);
        setFetchedUrls([]);
        refetchStatus();
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const startMutation = useMutation({
    mutationFn: startQueue,
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Cola iniciada', description: 'Procesando fragancias en segundo plano' });
        refetchStatus();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopQueue,
    onSuccess: () => {
      toast({ title: 'Cola pausada', description: 'Puedes reanudar en cualquier momento' });
      refetchStatus();
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearQueue('pending'),
    onSuccess: (res) => {
      toast({ title: 'Cola pendiente limpiada', description: `${res.deleted ?? 0} entradas eliminadas` });
      refetchStatus();
    },
  });

  const clearFailedMutation = useMutation({
    mutationFn: () => clearQueue('failed'),
    onSuccess: (res) => {
      toast({ title: 'Entradas fallidas eliminadas', description: `${res.deleted ?? 0} entradas eliminadas` });
      refetchStatus();
    },
  });

  const retryFailedMutation = useMutation({
    mutationFn: retryFailedQueue,
    onSuccess: (res) => {
      toast({ title: 'Reintentando URLs fallidas', description: `${res.retried} URLs movidas a pendiente` });
      refetchStatus();
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadSitemapFiles(files),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Sitemaps procesados',
          description: `${result.newQueued?.toLocaleString()} URLs nuevas agregadas a la cola (${result.alreadyExist?.toLocaleString()} ya existían)`,
        });
        refetchStatus();
      } else {
        toast({ title: 'Error al procesar', description: result.error, variant: 'destructive' });
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const xmlFiles = Array.from(files).filter(f => f.name.endsWith('.xml') || f.type === 'text/xml' || f.type === 'application/xml');
    if (xmlFiles.length === 0) {
      toast({ title: 'Formato incorrecto', description: 'Solo se aceptan archivos .xml', variant: 'destructive' });
      return;
    }
    uploadMutation.mutate(xmlFiles);
  };

  const fullCatalogMutation = useMutation({
    mutationFn: () => importFullCatalog(true),
    onSuccess: (result) => {
      setShowFullCatalogConfirm(false);
      if (result.success) {
        toast({
          title: 'Descubrimiento iniciado',
          description: 'Leyendo sitemaps de Fragrantica en segundo plano. Las URLs aparecerán en la cola en minutos.',
        });
        setTimeout(() => refetchStatus(), 2000);
      } else {
        toast({ title: 'Error de importación', description: result.error || 'No se pudieron obtener los sitemaps', variant: 'destructive' });
      }
    },
    onError: (error: Error) => {
      setShowFullCatalogConfirm(false);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const progress = queueStatus?.total
    ? ((queueStatus.processed + queueStatus.failed) / queueStatus.total) * 100
    : 0;

  const discovery = queueStatus?.catalogDiscovery;
  const showDiscovery = discovery && (discovery.active || discovery.phase === 'done' || discovery.phase === 'error');

  return (
    <div className="space-y-6">

      {/* Algolia-based importer — no Cloudflare blocks */}
      <AlgoliaImporter />

      {/* Bulk Brand Importer */}
      <BulkBrandImporter />

      {/* Full Catalog Import Card */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            Importación Completa del Catálogo
          </CardTitle>
          <CardDescription>
            Importa ~123,000 fragancias de Fragrantica leyendo sus sitemaps públicos. Las ya importadas se omiten automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
            <TriangleAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-muted-foreground">
              <p>
                <strong className="text-foreground">Estimado:</strong> ~123K fragancias × 15 s ={' '}
                <strong className="text-foreground">~21 días</strong> de procesamiento continuo.
              </p>
              <p>La cola corre en el backend — puedes cerrar esta página, pausar y reanudar en cualquier momento.</p>
            </div>
          </div>

          {/* Discovery progress panel */}
          {showDiscovery && <DiscoveryProgressPanel discovery={discovery!} />}

          {/* Result stats after discovery */}
          {fullCatalogResult && fullCatalogResult.status !== 'discovering' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold">{fullCatalogResult.sitemapsDiscovered}</p>
                <p className="text-xs text-muted-foreground">Sitemaps leídos</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold">{fullCatalogResult.totalFound.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total encontradas</p>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xl font-bold text-green-600">{fullCatalogResult.newQueued.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Nuevas en cola</p>
              </div>
              <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xl font-bold text-amber-600">{fullCatalogResult.alreadyExist.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Ya existían</p>
              </div>
            </div>
          )}

          {/* Confirm / Launch */}
          {!showFullCatalogConfirm ? (
            <Button
              variant="outline"
              className="border-accent/40 hover:border-accent"
              onClick={() => setShowFullCatalogConfirm(true)}
              disabled={fullCatalogMutation.isPending || discovery?.active}
            >
              <Globe className="h-4 w-4 mr-2" />
              {discovery?.active ? 'Descubrimiento en curso…' : 'Importar catálogo completo de Fragrantica'}
            </Button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm flex-1">Esto pondrá decenas de miles de URLs en cola. ¿Confirmar?</p>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => fullCatalogMutation.mutate()}
                disabled={fullCatalogMutation.isPending}
              >
                {fullCatalogMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Iniciando…</>
                ) : (
                  'Sí, importar todo'
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowFullCatalogConfirm(false)} disabled={fullCatalogMutation.isPending}>
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Sitemap Upload Card */}
      <Card className="border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            Cargar Sitemaps Manualmente
            <span className="text-xs font-normal text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">Recomendado</span>
          </CardTitle>
          <CardDescription>
            Si el servidor no puede acceder a Fragrantica (bloqueado por Cloudflare), descarga los sitemaps desde tu navegador y súbelos aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step instructions */}
          <div className="space-y-2 text-sm">
            <p className="font-medium text-muted-foreground">Pasos:</p>
            <ol className="space-y-1.5 text-muted-foreground list-none">
              {[
                { n: '1', text: 'Abre cada sitemap en tu navegador (links abajo)', },
                { n: '2', text: 'Ctrl+S → guardar como archivo XML', },
                { n: '3', text: 'Arrastra todos los archivos a la zona de abajo', },
              ].map(({ n, text }) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-blue-500/20 text-blue-600 text-xs flex items-center justify-center font-bold">{n}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Sitemap links */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 13 }, (_, i) => i + 1).map(i => (
              <a
                key={i}
                href={`https://www.fragrantica.com/sitemap_perfumes_${i}.xml`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-muted-foreground hover:text-foreground"
              >
                <FileText className="h-3 w-3" />
                sitemap_{i}.xml
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </div>

          {/* Drop zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
              dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-border hover:border-blue-500/40 hover:bg-muted/30',
              uploadMutation.isPending && 'pointer-events-none opacity-60',
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => document.getElementById('sitemap-file-input')?.click()}
          >
            <input
              id="sitemap-file-input"
              type="file"
              multiple
              accept=".xml,text/xml,application/xml"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-2 text-blue-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-medium">Procesando archivos…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Arrastra los XML aquí o haz clic para seleccionar</span>
                <span className="text-xs">Puedes subir varios archivos a la vez</span>
              </div>
            )}
          </div>

          {/* Upload result */}
          {uploadMutation.isSuccess && uploadMutation.data?.success && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold">{uploadMutation.data.filesProcessed}</p>
                <p className="text-xs text-muted-foreground">Archivos procesados</p>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xl font-bold text-green-600">{uploadMutation.data.newQueued?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Nuevas en cola</p>
              </div>
              <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-xl font-bold text-amber-600">{uploadMutation.data.alreadyExist?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Ya existían</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fetch URLs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Importar desde Fragrantica
          </CardTitle>
          <CardDescription>
            Obtén URLs de fragancias por marca o sitemap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Marca (opcional)</label>
              <Input
                placeholder="ej. Dior, Chanel, Tom Ford"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                disabled={fetchUrlsMutation.isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">Dejar vacío para usar sitemap</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Límite</label>
              <Input
                type="number"
                min="10"
                max="500"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                disabled={fetchUrlsMutation.isPending}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block invisible select-none">_</label>
              <Button
                onClick={() => {
                  setUrlCheckResult(null);
                  fetchUrlsMutation.mutate();
                }}
                disabled={fetchUrlsMutation.isPending}
                className="w-full"
              >
                {fetchUrlsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Search className="h-4 w-4 mr-2" />
                Verificar URLs
              </Button>
            </div>
          </div>

          {urlCheckResult && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Resultados de verificación
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setUrlCheckResult(null); setFetchedUrls([]); }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background rounded-lg border">
                  <p className="text-2xl font-bold">{urlCheckResult.total}</p>
                  <p className="text-xs text-muted-foreground">Total encontradas</p>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-2xl font-bold text-green-600">{urlCheckResult.newCount}</p>
                  <p className="text-xs text-muted-foreground">Nuevas</p>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-2xl font-bold text-amber-600">{urlCheckResult.existingCount}</p>
                  <p className="text-xs text-muted-foreground">Ya existen</p>
                </div>
              </div>

              {urlCheckResult.newCount > 0 ? (
                <Button
                  onClick={() => addToQueueMutation.mutate()}
                  disabled={addToQueueMutation.isPending}
                  className="w-full"
                >
                  {addToQueueMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar {urlCheckResult.newCount} URLs nuevas a la cola
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">¡Todas las fragancias de esta marca ya están en tu base de datos!</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cola de Scraping
            </span>
            <div className="flex items-center gap-2">
              {queueStatus?.processing ? (
                <span className="flex items-center gap-1.5 text-sm text-green-500 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Procesando
                </span>
              ) : queueStatus?.remaining ? (
                <span className="flex items-center gap-1.5 text-sm text-amber-500">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Pausada
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Inactiva</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Progress bar */}
          {queueStatus && queueStatus.total > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium tabular-nums">
                  {(queueStatus.processed + queueStatus.failed).toLocaleString()} / {queueStatus.total.toLocaleString()}
                  <span className="text-muted-foreground ml-1.5">({progress.toFixed(1)}%)</span>
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold tabular-nums">{(queueStatus?.remaining || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <p className="text-2xl font-bold text-green-500 tabular-nums">{(queueStatus?.processed || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-lg">
              <p className="text-2xl font-bold text-destructive tabular-nums">{(queueStatus?.failed || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Fallidas</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold tabular-nums">{(queueStatus?.total || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Performance metrics row — show while running OR when session has data */}
          {((queueStatus?.processing) || (queueStatus?.processedThisSession ?? 0) > 0 || (queueStatus?.rateLimitedThisSession ?? 0) > 0) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-3">
              {/* Processing rate — only when active */}
              {queueStatus?.processing && queueStatus.processingRatePerHour != null && queueStatus.processingRatePerHour > 0 && (
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <strong className="text-foreground">{queueStatus.processingRatePerHour.toLocaleString()}</strong> fragancias/hora
                </span>
              )}
              {/* ETA — only when active */}
              {queueStatus?.processing && queueStatus.etaMs != null && queueStatus.etaMs > 0 && (
                <span className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-accent" />
                  {formatEta(queueStatus.etaMs)}
                </span>
              )}
              {/* Session counts */}
              {(queueStatus?.processedThisSession ?? 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Esta sesión: <strong className="text-foreground">{queueStatus!.processedThisSession}</strong> completadas
                  {(queueStatus!.failedThisSession ?? 0) > 0 && (
                    <>, <span className="text-destructive">{queueStatus!.failedThisSession}</span> fallidas</>
                  )}
                </span>
              )}
              {/* Rate-limit retries */}
              {(queueStatus?.rateLimitedThisSession ?? 0) > 0 && (
                <span className="flex items-center gap-1.5 text-amber-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <strong className="text-foreground">{queueStatus!.rateLimitedThisSession}</strong> rate limits (reintentando)
                </span>
              )}
            </div>
          )}

          {/* Current URL */}
          {queueStatus?.current && (
            <div className="p-3 bg-accent/10 rounded-lg flex items-center gap-2 overflow-hidden">
              <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />
              <span className="text-sm truncate text-muted-foreground">{queueStatus.current}</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {!queueStatus?.processing ? (
              <Button
                onClick={() => startMutation.mutate()}
                disabled={!queueStatus?.remaining || startMutation.isPending}
                className="gap-2"
              >
                {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {queueStatus?.remaining
                  ? `Reanudar (${queueStatus.remaining.toLocaleString()} pendientes)`
                  : 'Iniciar'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
                className="gap-2"
              >
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
            )}

            {(queueStatus?.failed ?? 0) > 0 && !queueStatus?.processing && (
              <Button
                variant="outline"
                onClick={() => retryFailedMutation.mutate()}
                disabled={retryFailedMutation.isPending}
                className="gap-2"
              >
                {retryFailedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Reintentar {queueStatus!.failed.toLocaleString()} fallidas
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => clearMutation.mutate()}
              disabled={queueStatus?.processing || clearMutation.isPending || !queueStatus?.remaining}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar pendientes
            </Button>

            {(queueStatus?.failed ?? 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFailedMutation.mutate()}
                disabled={clearFailedMutation.isPending}
                className="gap-2 text-muted-foreground"
              >
                <Trash2 className="h-3 w-3" />
                Limpiar fallidas
              </Button>
            )}

            {/* Manual refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchStatus()}
              className="gap-2 text-muted-foreground ml-auto"
            >
              <RotateCcw className="h-3 w-3" />
              Actualizar
            </Button>
          </div>

          {/* Paused notice */}
          {!queueStatus?.processing && (queueStatus?.remaining ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-amber-500" />
              Cola pausada — {queueStatus!.remaining.toLocaleString()} URLs esperando. Haz clic en Reanudar para continuar desde donde se quedó.
            </p>
          )}

          {/* Recent Errors */}
          {queueStatus?.errors && queueStatus.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Actividad reciente
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({queueStatus.errors.filter(e => e.type !== 'rate_limit').length} fallos · {queueStatus.errors.filter(e => e.type === 'rate_limit').length} rate limits)
                </span>
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {[...queueStatus.errors].reverse().map((err, i) => (
                  err.type === 'rate_limit' ? (
                    <div key={i} className="text-xs p-2 bg-amber-500/10 border border-amber-500/20 rounded flex items-start gap-2">
                      <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-amber-600 font-medium">Rate limit · </span>
                        <span className="truncate text-muted-foreground">{err.url}</span>
                        <span className="text-muted-foreground"> — {err.error}</span>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="text-xs p-2 bg-destructive/10 border border-destructive/20 rounded flex items-start gap-2">
                      <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-destructive font-medium">Error · </span>
                        <span className="truncate text-muted-foreground">{err.url}</span>
                        <span className="text-muted-foreground"> — {err.error}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-secondary/20">
        <CardHeader>
          <CardTitle className="text-base">Notas importantes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Se respeta un delay de 15 segundos entre peticiones para evitar bloqueos</p>
          <p>• 100 fragancias toman aproximadamente 25-30 minutos en procesarse</p>
          <p>• La cola corre en el backend — puedes cerrar esta página sin interrumpir el proceso</p>
          <p>• Los duplicados se omiten automáticamente</p>
          <p>• Los nombres de marcas deben coincidir exactamente (ej. "Dior" no "dior")</p>
        </CardContent>
      </Card>
    </div>
  );
}
