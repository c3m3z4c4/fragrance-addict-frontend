import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getIncompletePerfumes,
  getIncompletePerfumesByBrand,
  rescrapePerfumes,
  rescrapeBrand,
  addIncompleteToQueue,
  getQueueStatus,
  startQueue,
  stopQueue,
  type IncompletePerfume,
  type IncompleteBrand,
} from '@/lib/api';
import {
  RefreshCw, Plus, AlertCircle, CheckCircle2, XCircle,
  Search, Tag, Layers, Play, Square, List,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Tab: Por Perfume ─────────────────────────────────────────────────────────

function ByPerfumeTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['incomplete-perfumes'],
    queryFn: () => getIncompletePerfumes(500),
    staleTime: 30000,
  });

  const rescrapeMutation = useMutation({
    mutationFn: (ids: string[]) => rescrapePerfumes(ids),
    onSuccess: (res) => {
      toast({
        title: res.success ? 'Re-scrape completado' : 'Error',
        description: res.success
          ? `Procesados: ${res.processed}, Fallidos: ${res.failed}`
          : res.error,
        variant: res.success ? 'default' : 'destructive',
      });
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['incomplete-perfumes'] });
        queryClient.invalidateQueries({ queryKey: ['incomplete-by-brand'] });
        setSelectedIds([]);
      }
    },
    onError: (err) => toast({ title: 'Error', description: String(err), variant: 'destructive' }),
  });

  const addToQueueMutation = useMutation({
    mutationFn: (ids: string[]) => rescrapePerfumes(ids), // re-uses direct for small sets
    onSuccess: () => {
      toast({ title: 'En proceso', description: 'Re-scrape de seleccionados iniciado' });
      setSelectedIds([]);
    },
    onError: (err) => toast({ title: 'Error', description: String(err), variant: 'destructive' }),
  });

  const perfumes: IncompletePerfume[] = data?.perfumes || [];
  const filtered = search
    ? perfumes.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase())
      )
    : perfumes;

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selectedIds.includes(p.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => prev.filter(id => !filtered.map(p => p.id).includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filtered.map(p => p.id)])]);
    }
  };

  const toggleOne = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nombre o marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin')} />
          Actualizar
        </Button>
        <Button variant="outline" size="sm" onClick={toggleAll} disabled={filtered.length === 0}>
          {allFilteredSelected ? 'Deseleccionar' : `Seleccionar ${filtered.length}`}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (selectedIds.length > 100) {
              toast({ title: 'Máximo 100 para re-scrape directo', description: 'Usa "Agregar a cola" para más.', variant: 'destructive' });
              return;
            }
            rescrapeMutation.mutate(selectedIds);
          }}
          disabled={selectedIds.length === 0 || rescrapeMutation.isPending}
        >
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', rescrapeMutation.isPending && 'animate-spin')} />
          Re-scrapear ({selectedIds.length})
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // Add selected to queue via addIncompleteToQueue equivalent
            toast({ title: 'Funcionalidad', description: 'Usa la pestaña "Por Lote" para gestionar la cola' });
          }}
          disabled={selectedIds.length === 0}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Agregar a cola
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{data?.count ?? 0} incompletos en total</span>
        {search && <span>· {filtered.length} filtrados</span>}
        {selectedIds.length > 0 && <span>· <strong className="text-foreground">{selectedIds.length} seleccionados</strong></span>}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
          <p className="text-muted-foreground">{search ? 'Sin resultados para esa búsqueda' : '¡Todos los perfumes están completos!'}</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y max-h-[420px] overflow-y-auto text-sm">
          {filtered.map((p: IncompletePerfume) => (
            <div
              key={p.id}
              className={cn('flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors cursor-pointer', selectedIds.includes(p.id) && 'bg-muted/30')}
              onClick={() => toggleOne(p.id)}
            >
              <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleOne(p.id)} onClick={e => e.stopPropagation()} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.brand}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {([
                  { label: 'Notas', has: p.hasNotes },
                  { label: 'Acordes', has: p.hasAccords },
                  { label: 'Rendimiento', has: p.hasSillage && p.hasLongevity },
                ] as const).map(({ label, has }) => (
                  <Badge key={label} variant={has ? 'secondary' : 'destructive'} className="text-[10px] px-1.5 py-0">
                    {has ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <XCircle className="h-2.5 w-2.5 mr-0.5" />}
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Por Marca ───────────────────────────────────────────────────────────

function ByBrandTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['incomplete-by-brand'],
    queryFn: getIncompletePerfumesByBrand,
    staleTime: 30000,
  });

  const handleBrandAction = async (brand: IncompleteBrand, direct: boolean) => {
    if (direct && brand.count > 100) {
      toast({ title: 'Demasiados perfumes', description: 'Usa "Agregar a cola" para marcas con más de 100 pendientes.', variant: 'destructive' });
      return;
    }
    setLoadingBrand(brand.brand);
    try {
      const res = await rescrapeBrand(brand.brand, direct);
      if (res.success) {
        toast({
          title: direct ? 'Re-scrape completado' : 'Agregado a cola',
          description: direct
            ? `Procesados: ${res.processed}, Fallidos: ${res.failed}`
            : `${res.added} perfumes de ${brand.brand} en cola (total: ${res.queueSize})`,
        });
        queryClient.invalidateQueries({ queryKey: ['incomplete-by-brand'] });
        queryClient.invalidateQueries({ queryKey: ['incomplete-perfumes'] });
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    } finally {
      setLoadingBrand(null);
    }
  };

  const brands: IncompleteBrand[] = data?.brands || [];
  const filtered = search
    ? brands.filter(b => b.brand.toLowerCase().includes(search.toLowerCase()))
    : brands;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {data?.total !== undefined && (
        <p className="text-sm text-muted-foreground">
          {data.total} perfumes incompletos en {brands.length} marcas
        </p>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando marcas...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
          <p className="text-muted-foreground">{search ? 'Sin resultados' : '¡Todas las marcas completas!'}</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y max-h-[420px] overflow-y-auto text-sm">
          {filtered.map((b: IncompleteBrand) => (
            <div key={b.brand} className="flex items-center gap-3 px-3 py-3 hover:bg-muted/40 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{b.brand}</p>
                <p className="text-xs text-muted-foreground">{b.count} perfume{b.count !== 1 ? 's' : ''} incompleto{b.count !== 1 ? 's' : ''}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">{b.count}</Badge>
              <div className="flex gap-1.5 shrink-0">
                {b.count <= 100 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={loadingBrand === b.brand}
                    onClick={() => handleBrandAction(b, true)}
                  >
                    {loadingBrand === b.brand
                      ? <RefreshCw className="h-3 w-3 animate-spin" />
                      : <RefreshCw className="h-3 w-3 mr-1" />
                    }
                    Directo
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={loadingBrand === b.brand}
                  onClick={() => handleBrandAction(b, false)}
                >
                  {loadingBrand === b.brand
                    ? <RefreshCw className="h-3 w-3 animate-spin" />
                    : <Plus className="h-3 w-3 mr-1" />
                  }
                  A cola
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Por Lote ────────────────────────────────────────────────────────────

const BATCH_SIZES = [25, 50, 100, 200, 500] as const;

function ByBatchTab() {
  const { toast } = useToast();
  const [batchSize, setBatchSize] = useState<number>(50);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [polling, setPolling] = useState(false);

  // Poll queue status
  useEffect(() => {
    const fetchStatus = async () => {
      const s = await getQueueStatus().catch(() => null);
      if (s) setQueueStatus(s);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const addToQueueMutation = useMutation({
    mutationFn: (limit: number) => addIncompleteToQueue(limit),
    onSuccess: (res) => {
      toast({
        title: res.success ? 'Lote agregado a cola' : 'Info',
        description: res.success
          ? `${res.added} perfumes en cola (total: ${res.queueSize})`
          : res.message || res.error,
        variant: res.success ? 'default' : 'default',
      });
    },
    onError: (err) => toast({ title: 'Error', description: String(err), variant: 'destructive' }),
  });

  const startMutation = useMutation({
    mutationFn: startQueue,
    onSuccess: (res) => {
      toast({ title: res.success ? 'Cola iniciada' : 'Error', description: res.message || res.error });
    },
    onError: (err) => toast({ title: 'Error', description: String(err), variant: 'destructive' }),
  });

  const stopMutation = useMutation({
    mutationFn: stopQueue,
    onSuccess: () => toast({ title: 'Cola detenida' }),
    onError: (err) => toast({ title: 'Error', description: String(err), variant: 'destructive' }),
  });

  const remaining = queueStatus?.remaining ?? 0;
  const processed = queueStatus?.processed ?? 0;
  const total = queueStatus?.total ?? 0;
  const isProcessing = queueStatus?.processing ?? false;
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Queue status card */}
      <div className="rounded-lg border bg-secondary/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Estado de la cola</p>
          <Badge variant={isProcessing ? 'default' : 'secondary'}>
            {isProcessing ? '⚡ Procesando' : remaining > 0 ? '⏸ En pausa' : '✓ Vacía'}
          </Badge>
        </div>

        {total > 0 && (
          <>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{processed} completados · {remaining} pendientes · {queueStatus?.failed ?? 0} fallidos</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}

        {queueStatus?.current && (
          <p className="text-xs text-muted-foreground truncate">
            Procesando: {queueStatus.current}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => startMutation.mutate()}
            disabled={isProcessing || remaining === 0 || startMutation.isPending}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Iniciar cola
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => stopMutation.mutate()}
            disabled={!isProcessing || stopMutation.isPending}
          >
            <Square className="h-3.5 w-3.5 mr-1.5" />
            Detener
          </Button>
        </div>
      </div>

      {/* Batch size selector */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Agregar lote de incompletos a la cola</p>
        <div className="flex flex-wrap gap-2">
          {BATCH_SIZES.map(size => (
            <button
              key={size}
              onClick={() => setBatchSize(size)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm border transition-colors',
                batchSize === size
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-background border-border hover:bg-muted'
              )}
            >
              {size}
            </button>
          ))}
        </div>
        <Button
          onClick={() => addToQueueMutation.mutate(batchSize)}
          disabled={addToQueueMutation.isPending}
        >
          {addToQueueMutation.isPending
            ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            : <Plus className="h-4 w-4 mr-2" />
          }
          Agregar {batchSize} a cola
        </Button>
      </div>

      {/* Recent errors */}
      {queueStatus?.errors?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Últimos errores</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {queueStatus.errors.map((e: any, i: number) => (
              <p key={i} className="text-xs text-destructive truncate">{e.url}: {e.error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RescrapePanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Re-Scrape de Datos Faltantes</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Retoma el scraping pendiente de perfumes sin notas, acordes, rendimiento o perfumes similares.
      </p>

      <Tabs defaultValue="perfume">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perfume" className="flex items-center gap-1.5 text-xs">
            <List className="h-3.5 w-3.5" />
            Por Perfume
          </TabsTrigger>
          <TabsTrigger value="brand" className="flex items-center gap-1.5 text-xs">
            <Tag className="h-3.5 w-3.5" />
            Por Marca
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            Por Lote
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfume" className="mt-4">
          <ByPerfumeTab />
        </TabsContent>

        <TabsContent value="brand" className="mt-4">
          <ByBrandTab />
        </TabsContent>

        <TabsContent value="batch" className="mt-4">
          <ByBatchTab />
        </TabsContent>
      </Tabs>

      <Card className="border-muted">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            Información
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1 pb-4">
          <p>• Re-scrape directo: hasta 100 perfumes, con 15 s de espera entre cada uno</p>
          <p>• Cola: sin límite, se procesa en segundo plano con auto-reanudación si hay rate limit</p>
          <p>• Re-scrape por marca: si la marca tiene más de 100 pendientes, solo está disponible el modo cola</p>
        </CardContent>
      </Card>
    </div>
  );
}
