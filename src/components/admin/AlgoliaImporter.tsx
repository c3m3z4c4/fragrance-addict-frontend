import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getQueueStatus, startQueue, fetchBrandLogos } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Loader2, CheckCircle2, XCircle, Key, Globe, Play,
  AlertTriangle, Zap, Database, RefreshCw, Eye, EyeOff, Square, Image,
} from 'lucide-react';
import { getAuthHeader } from '@/lib/api';

const API = import.meta.env.VITE_API_URL || '';

// ── API helpers ──────────────────────────────────────────────────────────────

async function fetchAlgoliaStatus() {
  const res = await fetch(`${API}/api/algolia/status`, { headers: getAuthHeader() });
  return res.json();
}

async function saveAlgoliaKey(apiKey: string) {
  const res = await fetch(`${API}/api/algolia/key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ apiKey }),
  });
  return res.json();
}

async function fetchAlgoliaBrands(): Promise<{ success: boolean; total?: number; brands?: any[]; error?: string }> {
  const res = await fetch(`${API}/api/algolia/brands`, { headers: getAuthHeader() });
  return res.json();
}

async function startAlgoliaCatalogImport() {
  const res = await fetch(`${API}/api/algolia/import/catalog`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  return res.json();
}

async function stopAlgoliaCatalogImport() {
  const res = await fetch(`${API}/api/algolia/import/stop`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  return res.json();
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KeyStatusBadge({ valid, expiresAt }: { valid: boolean; expiresAt: string | null }) {
  if (valid) {
    const date = expiresAt ? new Date(expiresAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" />
        Activa{date ? ` · expira ${date}` : ''}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
      <XCircle className="h-3 w-3" />
      {expiresAt ? 'Expirada' : 'Sin configurar'}
    </span>
  );
}

function AlgoliaJobPanel({ job }: { job: any }) {
  const phaseLabel: Record<string, string> = {
    brands: 'Obteniendo listado de marcas…',
    perfumes: 'Obteniendo perfumes por marca…',
    enqueueing: 'Agregando URLs a la cola…',
    done: 'Importación completada',
    error: 'Error en la importación',
  };

  const progress = job.brandsDiscovered > 0
    ? Math.min(100, (job.perfumesDiscovered / (job.brandsDiscovered * 100)) * 100)
    : 0;

  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-3 text-sm',
      job.phase === 'error' ? 'bg-destructive/10 border-destructive/30' :
      job.phase === 'done'  ? 'bg-green-500/10 border-green-500/30' :
                              'bg-accent/10 border-accent/30',
    )}>
      <div className="flex items-center gap-2 font-medium">
        {job.phase === 'error' ? <XCircle className="h-4 w-4 text-destructive shrink-0" /> :
         job.phase === 'done'  ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> :
                                 <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />}
        {phaseLabel[job.phase] ?? 'Procesando…'}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-background/60 rounded-lg">
          <p className="text-base font-bold tabular-nums">{job.brandsDiscovered.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Marcas</p>
        </div>
        <div className="text-center p-2 bg-background/60 rounded-lg">
          <p className="text-base font-bold tabular-nums">{job.perfumesDiscovered.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Perfumes encontrados</p>
        </div>
        <div className="text-center p-2 bg-green-500/20 rounded-lg">
          <p className="text-base font-bold text-green-600 tabular-nums">{job.urlsQueued.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">URLs encoladas</p>
        </div>
      </div>

      {job.error && <p className="text-xs text-destructive">{job.error}</p>}
    </div>
  );
}

function LogoFetchPanel({ job }: { job: NonNullable<ReturnType<typeof useQuery>['data']> extends { logoFetchJob?: infer J } ? J : any }) {
  const progress = job.total > 0 ? (job.processed / job.total) * 100 : 0;
  const isDone = !job.running && job.completedAt;
  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-3 text-sm',
      isDone ? 'bg-green-500/10 border-green-500/30' : 'bg-violet-500/10 border-violet-500/30',
    )}>
      <div className="flex items-center gap-2 font-medium">
        {job.running
          ? <Loader2 className="h-4 w-4 animate-spin text-violet-500 shrink-0" />
          : <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
        {job.running ? `Obteniendo logos desde Algolia… (${job.processed}/${job.total})` : 'Logos completados'}
      </div>
      {job.total > 0 && <Progress value={progress} className="h-1.5" />}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-background/60 rounded-lg">
          <p className="text-base font-bold tabular-nums">{job.total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total marcas</p>
        </div>
        <div className="text-center p-2 bg-green-500/20 rounded-lg">
          <p className="text-base font-bold text-green-600 tabular-nums">{job.updated.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Logos encontrados</p>
        </div>
        <div className="text-center p-2 bg-muted/40 rounded-lg">
          <p className="text-base font-bold text-muted-foreground tabular-nums">{job.failed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Sin logo</p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AlgoliaImporter() {
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [brandCount, setBrandCount] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Poll algolia status via the unified queue/status endpoint
  const { data: queueStatus, refetch: refetchQueue } = useQuery({
    queryKey: ['queue-status'],
    queryFn: getQueueStatus,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (d?.algoliaJob?.active) return 2000;
      if (d?.logoFetchJob?.running) return 3000;
      if (d?.processing) return 3000;
      return false;
    },
    staleTime: 2000,
  });

  const { data: algoliaStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['algolia-status'],
    queryFn: fetchAlgoliaStatus,
    staleTime: 30000,
  });

  const algoliaJob = queueStatus?.algoliaJob;
  const logoJob = queueStatus?.logoFetchJob;
  const keyValid = algoliaStatus?.valid ?? false;
  const keyConfigured = algoliaStatus?.configured ?? false;

  const saveKeyMutation = useMutation({
    mutationFn: () => saveAlgoliaKey(newKey.trim()),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'API key guardada', description: `Válida hasta ${result.expiresAt ? new Date(result.expiresAt).toLocaleDateString('es-MX') : 'fecha desconocida'}` });
        setNewKey('');
        refetchStatus();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const fetchBrandsMutation = useMutation({
    mutationFn: fetchAlgoliaBrands,
    onSuccess: (result) => {
      if (result.success) {
        setBrandCount(result.total ?? 0);
        toast({ title: 'Marcas obtenidas', description: `${result.total?.toLocaleString()} marcas en Fragrantica` });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const importCatalogMutation = useMutation({
    mutationFn: startAlgoliaCatalogImport,
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Importación iniciada', description: 'Obteniendo todos los perfumes de Fragrantica vía Algolia' });
        setTimeout(() => refetchQueue(), 1000);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const stopImportMutation = useMutation({
    mutationFn: stopAlgoliaCatalogImport,
    onSuccess: () => { toast({ title: 'Importación detenida' }); refetchQueue(); },
  });

  const startQueueMutation = useMutation({
    mutationFn: startQueue,
    onSuccess: () => {
      toast({ title: 'Cola iniciada' });
      queryClient.invalidateQueries({ queryKey: ['queue-status'] });
    },
  });

  const fetchLogosMutation = useMutation({
    mutationFn: () => fetchBrandLogos(false, 'algolia'),
    onSuccess: (result) => {
      if (result.success) {
        if (result.status === 'already_running') {
          toast({ title: 'Ya en curso', description: 'El job de logos ya está corriendo' });
        } else if (result.status === 'done' && result.total === 0) {
          toast({ title: 'Sin pendientes', description: 'Todas las marcas de Algolia ya tienen logo' });
        } else {
          toast({ title: 'Buscando logos', description: `Procesando ${result.total?.toLocaleString()} marcas en segundo plano` });
          setTimeout(() => refetchQueue(), 1000);
        }
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return (
    <Card className="border-violet-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-violet-500" />
          Importación vía Algolia
          <span className="text-xs font-normal text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full">Sin bloqueos de Cloudflare</span>
        </CardTitle>
        <CardDescription>
          Fragrantica usa Algolia como motor de búsqueda. Esta API es accesible sin restricciones y tiene los {' '}
          <strong>~131,000 perfumes indexados</strong> con nombre, marca, notas, acordes y perfumistas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* API Key section */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Key className="h-4 w-4" />
              API Key de Algolia
            </div>
            {algoliaStatus && (
              <KeyStatusBadge valid={keyValid} expiresAt={algoliaStatus.expiresAt} />
            )}
          </div>

          {/* How to get the key */}
          {!keyValid && (
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="font-medium text-amber-700">Cómo obtener la API key:</p>
              <ol className="space-y-1 list-none">
                {[
                  'Abre Chrome y visita fragrantica.com',
                  'Abre DevTools → Red (F12)',
                  'Haz clic en la lupa y escribe cualquier letra',
                  'Filtra por "algolia" en la barra de Network',
                  'Copia el valor de x-algolia-api-key de cualquier request',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="shrink-0 font-bold text-amber-700">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Key input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono pr-9 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Pega la x-algolia-api-key aquí…"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey(v => !v)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              onClick={() => saveKeyMutation.mutate()}
              disabled={!newKey.trim() || saveKeyMutation.isPending}
              size="sm"
              className="shrink-0"
            >
              {saveKeyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => refetchStatus()} className="shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {keyValid && algoliaStatus?.keyPreview && (
            <p className="text-xs text-muted-foreground font-mono">Key activa: {algoliaStatus.keyPreview}</p>
          )}
        </div>

        {/* Actions — only when key is valid */}
        {keyValid && (
          <div className="space-y-3">
            {/* Quick stats */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBrandsMutation.mutate()}
              disabled={fetchBrandsMutation.isPending}
              className="gap-2"
            >
              {fetchBrandsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Verificar marcas disponibles
            </Button>

            {brandCount !== null && (
              <div className="flex gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg flex-1">
                  <p className="text-xl font-bold">{brandCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Marcas en Fragrantica</p>
                </div>
                <div className="text-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg flex-1">
                  <p className="text-xl font-bold text-violet-600">~131,000</p>
                  <p className="text-xs text-muted-foreground">Perfumes indexados</p>
                </div>
              </div>
            )}

            {/* Import job panel */}
            {algoliaJob && (algoliaJob.active || algoliaJob.phase) && (
              <AlgoliaJobPanel job={algoliaJob} />
            )}

            {/* Logo fetch job panel */}
            {logoJob && (logoJob.running || logoJob.completedAt) && logoJob.source === 'algolia' && (
              <LogoFetchPanel job={logoJob} />
            )}

            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              {!algoliaJob?.active ? (
                <Button
                  onClick={() => importCatalogMutation.mutate()}
                  disabled={importCatalogMutation.isPending}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  {importCatalogMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Importar catálogo completo vía Algolia
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => stopImportMutation.mutate()}
                  disabled={stopImportMutation.isPending}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Square className="h-4 w-4" />
                  Detener importación
                </Button>
              )}

              {algoliaJob?.phase === 'done' && (queueStatus?.remaining ?? 0) > 0 && !queueStatus?.processing && (
                <Button
                  onClick={() => startQueueMutation.mutate()}
                  disabled={startQueueMutation.isPending}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Iniciar cola ({queueStatus!.remaining.toLocaleString()} pendientes)
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => fetchLogosMutation.mutate()}
                disabled={fetchLogosMutation.isPending || logoJob?.running}
                className="gap-2 border-violet-500/40 hover:border-violet-500"
              >
                {fetchLogosMutation.isPending || logoJob?.running
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Image className="h-4 w-4" />}
                {logoJob?.running
                  ? `Logos… ${logoJob.processed}/${logoJob.total}`
                  : 'Obtener logos de marcas'}
              </Button>
            </div>

            {!algoliaJob?.active && (
              <p className="text-xs text-muted-foreground">
                La importación obtiene las URLs de todos los perfumes desde Algolia (sin tocar Fragrantica directamente) y las agrega a la cola de scraping para obtener fotos, ratings y detalles completos.
              </p>
            )}
          </div>
        )}

        {/* Disabled state */}
        {!keyValid && keyConfigured && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            La API key ha expirado. Captura una nueva desde fragrantica.com y pégala arriba.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
