import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, CheckCircle2, ImageOff, Pencil, Trash2, X, Save,
  ExternalLink, Wand2, Loader2, Check, Square, CheckSquare,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { fetchPerfumers, upsertPerfumerData, deletePerfumerData, type PerfumerInfo } from '@/lib/api';
import { getAuthToken } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── API helpers ──────────────────────────────────────────────────────────────

async function autofillOne(name: string): Promise<{ imageUrl?: string; bio?: string; nationality?: string } | null> {
  const token = getAuthToken();
  const resp = await fetch(`${API_BASE_URL}/api/perfumers/${encodeURIComponent(name)}/autofill`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.data ?? null;
}

async function startBulkAutofill(names?: string[]): Promise<any> {
  const token = getAuthToken();
  const resp = await fetch(`${API_BASE_URL}/api/perfumers/bulk-autofill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ names: names ?? [], saveResults: true }),
  });
  return resp.json();
}

async function getBulkAutofillStatus(): Promise<any> {
  const token = getAuthToken();
  const resp = await fetch(`${API_BASE_URL}/api/perfumers/autofill/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json();
}

async function setVerified(name: string, verified: boolean): Promise<boolean> {
  const token = getAuthToken();
  const resp = await fetch(`${API_BASE_URL}/api/perfumers/${encodeURIComponent(name)}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ verified }),
  });
  return resp.ok;
}

// ─── PerfumerRow ──────────────────────────────────────────────────────────────

interface EditState { imageUrl: string; bio: string; nationality: string; }

function PerfumerRow({
  perfumer,
  selected,
  onSelect,
  onSave,
  onDelete,
  onVerifyToggle,
}: {
  perfumer: PerfumerInfo;
  selected: boolean;
  onSelect: (name: string) => void;
  onSave: (name: string, data: EditState) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
  onVerifyToggle: (name: string, v: boolean) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [form, setForm] = useState<EditState>({
    imageUrl: perfumer.imageUrl ?? '',
    bio: perfumer.bio ?? '',
    nationality: perfumer.nationality ?? '',
  });

  // Sync form when perfumer data changes (e.g. after bulk autofill)
  useEffect(() => {
    if (!editing) {
      setForm({
        imageUrl: perfumer.imageUrl ?? '',
        bio: perfumer.bio ?? '',
        nationality: perfumer.nationality ?? '',
      });
    }
  }, [perfumer.imageUrl, perfumer.bio, perfumer.nationality, editing]);

  const currentImg = previewSrc ?? perfumer.imageUrl;

  const handleAutofill = async () => {
    setAutofilling(true);
    try {
      const data = await autofillOne(perfumer.name);
      if (data && (data.imageUrl || data.bio || data.nationality)) {
        setForm(f => ({
          imageUrl: data.imageUrl || f.imageUrl,
          bio: data.bio || f.bio,
          nationality: data.nationality || f.nationality,
        }));
        setImgError(false);
        setPreviewSrc(data.imageUrl || null);
        setEditing(true);
        toast({ title: `Datos encontrados para ${perfumer.name}` });
      } else {
        toast({ title: `Sin resultados para "${perfumer.name}"`, variant: 'destructive' });
      }
    } finally {
      setAutofilling(false);
    }
  };

  const handleSave = async () => {
    await onSave(perfumer.name, form);
    setEditing(false);
    setPreviewSrc(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setPreviewSrc(null);
    setForm({ imageUrl: perfumer.imageUrl ?? '', bio: perfumer.bio ?? '', nationality: perfumer.nationality ?? '' });
  };

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-all duration-200',
      editing ? 'border-accent ring-1 ring-accent' : 'border-border',
      selected && !editing && 'border-accent/50 bg-accent/5',
    )}>
      <div className="flex gap-3 p-3 items-start">
        {/* Select checkbox */}
        <button
          onClick={() => onSelect(perfumer.name)}
          className="mt-1 shrink-0 text-muted-foreground hover:text-accent transition-colors"
        >
          {selected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
        </button>

        {/* Photo */}
        <div className="shrink-0 w-14 h-18 rounded-md overflow-hidden bg-muted flex items-center justify-center" style={{ height: 72 }}>
          {currentImg && !imgError ? (
            <img src={currentImg} alt={perfumer.name} className="w-full h-full object-cover"
              onError={() => setImgError(true)} />
          ) : (
            <ImageOff className="h-4 w-4 text-muted-foreground/40" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-medium text-sm">{perfumer.name}</span>
            <span className="text-xs text-muted-foreground">{perfumer.count} frag.</span>
            {perfumer.nationality && (
              <span className="text-xs text-muted-foreground">· {perfumer.nationality}</span>
            )}
          </div>
          {perfumer.bio && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{perfumer.bio}</p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1 flex-wrap justify-end">
          {/* Verified toggle */}
          <button
            onClick={() => onVerifyToggle(perfumer.name, !perfumer.verified)}
            title={perfumer.verified ? 'Quitar verificado' : 'Marcar como verificado'}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-md transition-colors border',
              perfumer.verified
                ? 'border-green-500/40 text-green-700 bg-green-50 hover:bg-green-100'
                : 'border-border text-muted-foreground hover:border-green-400 hover:text-green-700'
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </button>

          {!editing && (
            <>
              {/* Auto-search */}
              <button
                onClick={handleAutofill}
                disabled={autofilling}
                title="Buscar datos automáticamente (Wikipedia/DDG)"
                className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-40"
              >
                {autofilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              </button>

              {/* Edit */}
              <button
                onClick={() => setEditing(true)}
                title="Editar manualmente"
                className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              {/* Delete */}
              {(perfumer.verified || perfumer.bio || perfumer.nationality) && (
                <button
                  onClick={() => onDelete(perfumer.name)}
                  title="Eliminar datos verificados"
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}

          {editing && (
            <>
              <button onClick={handleCancel}
                className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleSave}
                className="h-7 w-7 flex items-center justify-center rounded-md border border-green-500/40 text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                <Save className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="border-t border-border bg-muted/20 p-3 space-y-3">
          {/* Image URL */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">URL de foto</label>
            <div className="flex gap-2">
              <Input value={form.imageUrl}
                onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setImgError(false); }}
                placeholder="https://..." className="text-xs h-8" />
              <button onClick={() => { setImgError(false); setPreviewSrc(form.imageUrl || null); }}
                className="h-8 px-2 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
            {previewSrc && (
              <div className="mt-2 flex items-start gap-3">
                <div className="w-16 h-20 rounded border border-border overflow-hidden bg-muted shrink-0">
                  {!imgError
                    ? <img src={previewSrc} alt="preview" className="w-full h-full object-cover" onError={() => setImgError(true)} />
                    : <div className="w-full h-full flex items-center justify-center"><ImageOff className="h-4 w-4 text-muted-foreground/40" /></div>
                  }
                </div>
                {imgError && <p className="text-xs text-destructive mt-1">No se pudo cargar. Verifica la URL.</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Nacionalidad</label>
              <Input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                placeholder="Ej. Francesa, Española..." className="text-xs h-8" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Biografía</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Breve descripción del perfumista..." rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} className="h-7 text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} className="h-7 text-xs">Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PerfumerManager ──────────────────────────────────────────────────────────

export function PerfumerManager() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'nophoto'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkJob, setBulkJob] = useState<any | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const { data: perfumers = [], isLoading } = useQuery({
    queryKey: ['admin-perfumers'],
    queryFn: fetchPerfumers,
    staleTime: 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ name, data }: { name: string; data: EditState }) => {
      const token = getAuthToken();
      const ok = await upsertPerfumerData(name, {
        imageUrl: data.imageUrl || undefined,
        bio: data.bio || undefined,
        nationality: data.nationality || undefined,
      }, token);
      if (!ok) throw new Error('Failed');
    },
    onSuccess: () => {
      toast({ title: 'Datos guardados' });
      queryClient.invalidateQueries({ queryKey: ['admin-perfumers'] });
      queryClient.invalidateQueries({ queryKey: ['perfumers'] });
    },
    onError: () => toast({ title: 'Error al guardar', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = getAuthToken();
      const ok = await deletePerfumerData(name, token);
      if (!ok) throw new Error('Failed');
    },
    onSuccess: () => {
      toast({ title: 'Datos eliminados' });
      queryClient.invalidateQueries({ queryKey: ['admin-perfumers'] });
      queryClient.invalidateQueries({ queryKey: ['perfumers'] });
    },
    onError: () => toast({ title: 'Error al eliminar', variant: 'destructive' }),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ name, verified }: { name: string; verified: boolean }) => {
      const ok = await setVerified(name, verified);
      if (!ok) throw new Error('Failed');
    },
    onSuccess: (_, { name, verified }) => {
      toast({ title: verified ? `${name} marcado como verificado` : `${name} desmarcado` });
      queryClient.invalidateQueries({ queryKey: ['admin-perfumers'] });
      queryClient.invalidateQueries({ queryKey: ['perfumers'] });
    },
    onError: () => toast({ title: 'Error al cambiar verificación', variant: 'destructive' }),
  });

  // Bulk autofill polling
  const stopPoller = () => { if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; } };
  useEffect(() => () => stopPoller(), []);

  const startPoller = () => {
    stopPoller();
    pollerRef.current = setInterval(async () => {
      try {
        const status = await getBulkAutofillStatus();
        setBulkJob(status);
        if (!status.running) {
          stopPoller();
          setIsBulkRunning(false);
          if (status.completedAt) {
            toast({ title: `Auto-búsqueda completada: ${status.updated} encontrados` });
            queryClient.invalidateQueries({ queryKey: ['admin-perfumers'] });
            queryClient.invalidateQueries({ queryKey: ['perfumers'] });
          }
        }
      } catch { /* ignore */ }
    }, 2000);
  };

  const handleBulkAutofill = async (names?: string[]) => {
    if (isBulkRunning) return;
    setIsBulkRunning(true);
    setBulkJob(null);
    try {
      const result = await startBulkAutofill(names);
      if (result.status === 'already_running') {
        setBulkJob(result.job ?? result);
        startPoller();
      } else if (result.status === 'started') {
        toast({ title: `Buscando info de ${result.total} perfumistas en Wikipedia/DDG…` });
        setBulkJob(result);
        startPoller();
      } else if (result.status === 'done') {
        setBulkJob(result);
        setIsBulkRunning(false);
        toast({ title: 'Sin perfumistas que procesar' });
      } else {
        setIsBulkRunning(false);
        toast({ title: result.error ?? 'Error', variant: 'destructive' });
      }
    } catch {
      setIsBulkRunning(false);
      toast({ title: 'Error iniciando auto-búsqueda', variant: 'destructive' });
    }
  };

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = perfumers;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    if (filter === 'verified') result = result.filter(p => p.verified);
    if (filter === 'unverified') result = result.filter(p => !p.verified);
    if (filter === 'nophoto') result = result.filter(p => !p.imageUrl);
    return result;
  }, [perfumers, search, filter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selected.has(p.name));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(p => next.delete(p.name)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(p => next.add(p.name)); return next; });
    }
  };

  const stats = {
    total: perfumers.length,
    verified: perfumers.filter(p => p.verified).length,
    noPhoto: perfumers.filter(p => !p.imageUrl).length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span><strong className="text-foreground">{stats.total}</strong> <span className="text-muted-foreground">perfumistas</span></span>
        <span className="text-green-700"><strong>{stats.verified}</strong> verificados</span>
        <span className="text-amber-600"><strong>{stats.noPhoto}</strong> sin foto</span>
      </div>

      {/* Bulk autofill controls */}
      <div className="flex flex-wrap gap-2 items-center p-3 border border-border rounded-lg bg-muted/20">
        <Wand2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">Auto-búsqueda (Wikipedia + DDG):</span>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
          disabled={isBulkRunning || selected.size === 0}
          onClick={() => handleBulkAutofill([...selected])}>
          {isBulkRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          Buscar seleccionados ({selected.size})
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
          disabled={isBulkRunning}
          onClick={() => handleBulkAutofill([])}>
          {isBulkRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          Buscar todos sin datos
        </Button>
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground underline">
            Limpiar selección ({selected.size})
          </button>
        )}
      </div>

      {/* Bulk job progress */}
      {isBulkRunning && bulkJob && bulkJob.total > 0 && (
        <div className="space-y-1.5 p-3 border border-border rounded-lg bg-muted/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="animate-pulse">Buscando en Wikipedia y DuckDuckGo…</span>
            <span>{bulkJob.processed} / {bulkJob.total}</span>
          </div>
          <Progress value={Math.round((bulkJob.processed / bulkJob.total) * 100)} className="h-1.5" />
          <div className="flex gap-4 text-xs">
            <span className="text-green-700 font-medium">{bulkJob.updated} encontrados</span>
            <span className="text-muted-foreground">{bulkJob.failed} sin resultado</span>
          </div>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar perfumista..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'verified', 'unverified', 'nophoto'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
              className="text-xs h-9" onClick={() => setFilter(f)}>
              {{ all: 'Todos', verified: '✓ Verificados', unverified: 'Sin verificar', nophoto: 'Sin foto' }[f]}
            </Button>
          ))}
        </div>
      </div>

      {/* Select all row */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={toggleSelectAll} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            {allFilteredSelected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
            {allFilteredSelected ? 'Deseleccionar todos' : `Seleccionar todos (${filtered.length})`}
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No se encontraron perfumistas</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <PerfumerRow
              key={p.name}
              perfumer={p}
              selected={selected.has(p.name)}
              onSelect={toggleSelect}
              onSave={(name, data) => saveMutation.mutateAsync({ name, data })}
              onDelete={(name) => deleteMutation.mutateAsync(name)}
              onVerifyToggle={(name, v) => verifyMutation.mutateAsync({ name, verified: v })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
