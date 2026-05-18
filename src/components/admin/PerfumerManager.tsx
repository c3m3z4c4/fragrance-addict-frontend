import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle2, ImageOff, Pencil, Trash2, X, Save, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { fetchPerfumers, upsertPerfumerData, deletePerfumerData, type PerfumerInfo } from '@/lib/api';
import { getAuthToken } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface EditState {
  imageUrl: string;
  bio: string;
  nationality: string;
}

function PerfumerRow({
  perfumer,
  onSave,
  onDelete,
}: {
  perfumer: PerfumerInfo;
  onSave: (name: string, data: EditState) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [form, setForm] = useState<EditState>({
    imageUrl: perfumer.imageUrl ?? '',
    bio: perfumer.bio ?? '',
    nationality: perfumer.nationality ?? '',
  });

  const currentImg = previewSrc ?? perfumer.imageUrl;

  const handlePreview = () => {
    setImgError(false);
    setPreviewSrc(form.imageUrl || null);
  };

  const handleSave = async () => {
    await onSave(perfumer.name, form);
    setEditing(false);
    setPreviewSrc(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setPreviewSrc(null);
    setForm({
      imageUrl: perfumer.imageUrl ?? '',
      bio: perfumer.bio ?? '',
      nationality: perfumer.nationality ?? '',
    });
  };

  return (
    <div className={cn(
      'border border-border rounded-lg overflow-hidden transition-all duration-200',
      editing && 'ring-1 ring-accent'
    )}>
      <div className="flex gap-4 p-4">
        {/* Photo */}
        <div className="shrink-0 w-16 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {currentImg && !imgError ? (
            <img
              src={currentImg}
              alt={perfumer.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <ImageOff className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-medium text-sm">{perfumer.name}</span>
            {perfumer.verified && (
              <Badge variant="outline" className="text-[10px] py-0 h-4 gap-0.5 border-green-500/40 text-green-700">
                <CheckCircle2 className="h-2.5 w-2.5" /> Verified
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{perfumer.count} fragancias</span>
          </div>
          {perfumer.nationality && (
            <p className="text-xs text-muted-foreground mt-0.5">{perfumer.nationality}</p>
          )}
          {perfumer.bio && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{perfumer.bio}</p>
          )}
          {!editing && !perfumer.imageUrl && (
            <p className="text-xs text-amber-600 mt-1">Sin foto</p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-start gap-1">
          {!editing ? (
            <>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setEditing(true)}
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {perfumer.verified && (
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(perfumer.name)}
                  title="Eliminar datos verificados"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleCancel}>
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-700 hover:text-green-700" onClick={handleSave}>
                <Save className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="border-t border-border bg-muted/30 p-4 space-y-3">
          {/* Image URL */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1">
              URL de foto
            </label>
            <div className="flex gap-2">
              <Input
                value={form.imageUrl}
                onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setImgError(false); }}
                placeholder="https://..."
                className="text-xs h-8"
              />
              <Button variant="outline" size="sm" className="shrink-0 h-8 px-2" onClick={handlePreview}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Preview */}
            {previewSrc && (
              <div className="mt-2 flex items-start gap-3">
                <div className="w-20 h-24 rounded border border-border overflow-hidden bg-muted shrink-0">
                  {!imgError ? (
                    <img
                      src={previewSrc}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                {imgError && (
                  <p className="text-xs text-destructive mt-1">No se pudo cargar la imagen. Verifica la URL.</p>
                )}
              </div>
            )}
          </div>

          {/* Nationality */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1">
              Nacionalidad
            </label>
            <Input
              value={form.nationality}
              onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
              placeholder="Ej. Francesa, Española..."
              className="text-xs h-8"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1">
              Biografía breve
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Breve descripción del perfumista..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} className="h-7 text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} className="h-7 text-xs">
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PerfumerManager() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'nophoto'>('all');
  const queryClient = useQueryClient();

  const { data: perfumers = [], isLoading } = useQuery({
    queryKey: ['admin-perfumers'],
    queryFn: fetchPerfumers,
    staleTime: 2 * 60 * 1000,
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
      toast({ title: 'Datos guardados correctamente' });
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
      toast({ title: 'Datos verificados eliminados' });
      queryClient.invalidateQueries({ queryKey: ['admin-perfumers'] });
      queryClient.invalidateQueries({ queryKey: ['perfumers'] });
    },
    onError: () => toast({ title: 'Error al eliminar', variant: 'destructive' }),
  });

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

  const stats = {
    total: perfumers.length,
    verified: perfumers.filter(p => p.verified).length,
    noPhoto: perfumers.filter(p => !p.imageUrl).length,
  };

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span><strong className="text-foreground">{stats.total}</strong> perfumistas</span>
        <span className="text-green-700"><strong>{stats.verified}</strong> verificados</span>
        <span className="text-amber-600"><strong>{stats.noPhoto}</strong> sin foto</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar perfumista..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'verified', 'unverified', 'nophoto'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-9"
              onClick={() => setFilter(f)}
            >
              {{ all: 'Todos', verified: '✓ Verificados', unverified: 'Sin verificar', nophoto: 'Sin foto' }[f]}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No se encontraron perfumistas</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <PerfumerRow
              key={p.name}
              perfumer={p}
              onSave={(name, data) => saveMutation.mutateAsync({ name, data })}
              onDelete={(name) => deleteMutation.mutateAsync(name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
