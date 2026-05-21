import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getQueueStatus,
  startBulkBrandImport,
  pauseBulkBrandImport,
  stopBulkBrandImport,
  startQueue,
  type BrandImportJob,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  Play,
  Pause,
  Square,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Zap,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EXAMPLE_BRANDS = `Dior
Chanel
Tom Ford
Guerlain
Hermès
Yves Saint Laurent
Giorgio Armani
Versace
Dolce & Gabbana
Paco Rabanne`;

function parseBrandList(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map(b => b.trim())
    .filter(Boolean)
    .filter((b, i, arr) => arr.indexOf(b) === i); // deduplicate
}

function JobProgressPanel({ job }: { job: BrandImportJob }) {
  const [showResults, setShowResults] = useState(false);
  const progress = job.brandsTotal > 0 ? (job.brandsProcessed / job.brandsTotal) * 100 : 0;
  const isDone = !job.active && !!job.finishedAt;
  const isPaused = job.active && job.paused;

  return (
    <div className="space-y-3">
      {/* Status header */}
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : isPaused ? (
            <Pause className="h-4 w-4 text-amber-500" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          )}
          {isDone ? 'Importación completada' : isPaused ? 'Pausada' : 'Importando marcas…'}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {job.brandsProcessed} / {job.brandsTotal} marcas
        </span>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-2.5 bg-muted/50 rounded-lg">
          <p className="text-lg font-bold tabular-nums">{job.brandsProcessed}</p>
          <p className="text-xs text-muted-foreground">Procesadas</p>
        </div>
        <div className="text-center p-2.5 bg-green-500/10 rounded-lg">
          <p className="text-lg font-bold text-green-500 tabular-nums">{job.brandsSucceeded}</p>
          <p className="text-xs text-muted-foreground">Exitosas</p>
        </div>
        <div className="text-center p-2.5 bg-destructive/10 rounded-lg">
          <p className="text-lg font-bold text-destructive tabular-nums">{job.brandsFailed}</p>
          <p className="text-xs text-muted-foreground">Fallidas</p>
        </div>
        <div className="text-center p-2.5 bg-accent/10 rounded-lg">
          <p className="text-lg font-bold text-accent tabular-nums">{job.urlsQueued.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">URLs encoladas</p>
        </div>
      </div>

      {/* Current brand */}
      {job.currentBrand && (
        <div className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg text-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent shrink-0" />
          <span className="text-muted-foreground">Procesando:</span>
          <span className="font-medium">{job.currentBrand}</span>
        </div>
      )}

      {/* Results toggle */}
      {job.results.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-muted/30 hover:bg-muted/50 transition-colors"
            onClick={() => setShowResults(v => !v)}
          >
            <span>Resultados por marca ({job.results.length})</span>
            {showResults ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showResults && (
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {[...job.results].reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 font-medium truncate max-w-[200px]">
                    {r.error ? (
                      <XCircle className="h-3 w-3 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    )}
                    {r.brand}
                  </span>
                  {r.error ? (
                    <span className="text-destructive truncate max-w-[180px]">{r.error}</span>
                  ) : (
                    <span className="flex gap-2 text-muted-foreground shrink-0">
                      <span className="text-green-600 font-medium">+{r.queued}</span>
                      {r.skipped > 0 && <span>·{r.skipped} skip</span>}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BulkBrandImporter() {
  const [brandListText, setBrandListText] = useState('');
  const [limitPerBrand, setLimitPerBrand] = useState('500');
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: queueStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['queue-status'],
    queryFn: getQueueStatus,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.brandImportJob?.active) return 2000;
      if (data?.processing) return 3000;
      return false;
    },
    staleTime: 2000,
  });

  const job = queueStatus?.brandImportJob;
  const jobActive = job?.active ?? false;
  const jobPaused = job?.paused ?? false;
  const jobDone = !jobActive && !!job?.finishedAt;
  const hasJob = jobActive || jobDone;

  const parsedBrands = parseBrandList(brandListText);

  const startMutation = useMutation({
    mutationFn: () => startBulkBrandImport(parsedBrands, parseInt(limitPerBrand) || 500),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Importación iniciada', description: `Procesando ${result.total} marcas en segundo plano` });
        setBrandListText('');
        setTimeout(() => refetchStatus(), 500);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const pauseMutation = useMutation({
    mutationFn: pauseBulkBrandImport,
    onSuccess: (result) => {
      toast({ title: result.paused ? 'Importación pausada' : 'Importación reanudada' });
      refetchStatus();
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopBulkBrandImport,
    onSuccess: () => {
      toast({ title: 'Importación detenida' });
      refetchStatus();
    },
  });

  const startQueueMutation = useMutation({
    mutationFn: startQueue,
    onSuccess: () => {
      toast({ title: 'Cola iniciada', description: 'Procesando fragancias en segundo plano' });
      queryClient.invalidateQueries({ queryKey: ['queue-status'] });
    },
  });

  const loadExample = () => setBrandListText(EXAMPLE_BRANDS);

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          Importación Masiva por Marcas
        </CardTitle>
        <CardDescription>
          Pega una lista de marcas (una por línea, o separadas por comas) y el sistema obtendrá todas sus fragancias de Fragrantica y las agregará a la cola automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Active/done job panel */}
        {hasJob && job && (
          <div className={cn(
            'rounded-lg border p-4 space-y-4',
            jobDone ? 'bg-green-500/5 border-green-500/20' : 'bg-accent/5 border-accent/20',
          )}>
            <JobProgressPanel job={job} />

            {/* Job controls */}
            <div className="flex flex-wrap gap-2">
              {jobActive && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isPending}
                    className="gap-1.5"
                  >
                    {pauseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : jobPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    {jobPaused ? 'Reanudar' : 'Pausar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => stopMutation.mutate()}
                    disabled={stopMutation.isPending}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Detener
                  </Button>
                </>
              )}
              {jobDone && (queueStatus?.remaining ?? 0) > 0 && !queueStatus?.processing && (
                <Button
                  size="sm"
                  onClick={() => startQueueMutation.mutate()}
                  disabled={startQueueMutation.isPending}
                  className="gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" />
                  Iniciar cola ({queueStatus!.remaining.toLocaleString()} pendientes)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Input form — hide while job active */}
        {!jobActive && (
          <>
            {/* Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Lista de marcas</label>
                <button
                  onClick={loadExample}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Cargar ejemplo
                </button>
              </div>
              <textarea
                ref={textareaRef}
                className="w-full min-h-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                placeholder={"Dior\nChanel\nTom Ford\nGuerlain\n..."}
                value={brandListText}
                onChange={(e) => setBrandListText(e.target.value)}
                disabled={startMutation.isPending}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Una por línea, o separadas por comas/puntos y coma</span>
                {parsedBrands.length > 0 && (
                  <span className="font-medium text-foreground">{parsedBrands.length} marcas detectadas</span>
                )}
              </div>
            </div>

            {/* Options row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Límite por marca:</label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={limitPerBrand}
                  onChange={(e) => setLimitPerBrand(e.target.value)}
                  className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={startMutation.isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Máx. de URLs a obtener por marca (Fragrantica puede tener más)
              </p>
            </div>

            {/* Preview chips */}
            {parsedBrands.length > 0 && parsedBrands.length <= 30 && (
              <div className="flex flex-wrap gap-1.5">
                {parsedBrands.map(b => (
                  <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                ))}
              </div>
            )}
            {parsedBrands.length > 30 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                <Package className="h-4 w-4 shrink-0" />
                {parsedBrands.slice(0, 5).join(', ')} … y {parsedBrands.length - 5} marcas más
              </div>
            )}

            {/* Action */}
            <Button
              className="w-full gap-2"
              onClick={() => startMutation.mutate()}
              disabled={parsedBrands.length === 0 || startMutation.isPending}
            >
              {startMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {startMutation.isPending
                ? 'Iniciando…'
                : `Importar ${parsedBrands.length > 0 ? parsedBrands.length : ''} marca${parsedBrands.length !== 1 ? 's' : ''}`}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              El proceso corre en segundo plano — puedes cerrar esta página. Las fragancias se agregan a la cola de scraping conforme se encuentran.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
