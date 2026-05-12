import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchBrands,
    uploadBrandLogo,
    uploadBrandLogosBulk,
    type BrandInfo,
    type BulkLogoUploadResult,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Upload,
    ImageIcon,
    CheckCircle2,
    XCircle,
    Loader2,
    Search,
    X,
    Layers,
} from 'lucide-react';

// ─── Single logo upload ───────────────────────────────────────────────────────

function SingleUpload({ brands }: { brands: BrandInfo[] }) {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<BrandInfo | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.length > 0
        ? brands.filter(b => b.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
        : [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        const url = URL.createObjectURL(f);
        setPreview(url);
    };

    const handleSelect = (brand: BrandInfo) => {
        setSelected(brand);
        setQuery(brand.name);
    };

    const handleUpload = async () => {
        if (!selected || !file) return;
        setUploading(true);
        try {
            const res = await uploadBrandLogo(selected.name, file);
            if (res.success) {
                toast.success(`Logo actualizado para ${selected.name}`);
                queryClient.invalidateQueries({ queryKey: ['brands'] });
                setSelected(null);
                setQuery('');
                setFile(null);
                setPreview(null);
                if (inputRef.current) inputRef.current.value = '';
            } else {
                toast.error(res.error || 'Error al subir logo');
            }
        } finally {
            setUploading(false);
        }
    };

    const clear = () => {
        setSelected(null);
        setQuery('');
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="space-y-5">
            {/* Brand search */}
            <div className="space-y-1.5">
                <Label>Marca</Label>
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        className="pl-9 pr-9"
                        placeholder="Buscar marca…"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelected(null); }}
                    />
                    {query && (
                        <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {filtered.length > 0 && !selected && (
                    <div className="max-w-sm rounded-md border bg-popover shadow-md">
                        {filtered.map(b => (
                            <button
                                key={b.name}
                                className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                                onClick={() => handleSelect(b)}
                            >
                                {b.imageUrl ? (
                                    <img src={b.imageUrl} alt={b.name} className="h-6 w-10 object-contain flex-shrink-0 bg-white rounded" />
                                ) : (
                                    <div className="h-6 w-10 flex-shrink-0 bg-muted rounded flex items-center justify-center">
                                        <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                )}
                                <span className="flex-1 truncate">{b.name}</span>
                                <span className="text-xs text-muted-foreground">{b.count} perfumes</span>
                            </button>
                        ))}
                    </div>
                )}
                {selected && (
                    <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" /> {selected.name}
                    </Badge>
                )}
            </div>

            {/* File input */}
            <div className="space-y-1.5">
                <Label>Imagen del logo</Label>
                <Input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="max-w-sm cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG — máx. 5 MB</p>
            </div>

            {/* Preview */}
            {preview && (
                <div className="flex items-center gap-4">
                    <div className="border rounded-lg p-3 bg-white w-32 h-20 flex items-center justify-center">
                        <img src={preview} alt="preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{file?.name}</p>
                        <p>{file ? `${(file.size / 1024).toFixed(1)} KB` : ''}</p>
                    </div>
                </div>
            )}

            <Button onClick={handleUpload} disabled={!selected || !file || uploading}>
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo…</> : <><Upload className="h-4 w-4 mr-2" /> Subir logo</>}
            </Button>
        </div>
    );
}

// ─── Bulk upload ──────────────────────────────────────────────────────────────

interface PendingFile {
    file: File;
    preview: string;
    matchedBrand: string | null;
    customBrand: string;
}

function BulkUpload({ brands }: { brands: BrandInfo[] }) {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState<PendingFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<BulkLogoUploadResult[] | null>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const brandNames = brands.map(b => b.name);

    const guessBrand = (filename: string): string | null => {
        const base = filename.replace(/\.[^.]+$/, '').replace(/[_\-]/g, ' ').toLowerCase();
        const exact = brandNames.find(n => n.toLowerCase() === base);
        if (exact) return exact;
        const partial = brandNames.find(n => base.includes(n.toLowerCase()) || n.toLowerCase().includes(base));
        return partial || null;
    };

    const addFiles = (files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f.name));
        if (arr.length === 0) { toast.error('Solo se aceptan PNG, JPG, WEBP o SVG'); return; }
        const newPending: PendingFile[] = arr.map(f => ({
            file: f,
            preview: URL.createObjectURL(f),
            matchedBrand: guessBrand(f.name),
            customBrand: guessBrand(f.name) || f.name.replace(/\.[^.]+$/, '').replace(/[_\-]/g, ' '),
        }));
        setPending(prev => {
            const existing = new Set(prev.map(p => p.file.name));
            return [...prev, ...newPending.filter(p => !existing.has(p.file.name))];
        });
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    }, [brands]);

    const onDragOver = (e: React.DragEvent) => e.preventDefault();

    const removeFile = (name: string) =>
        setPending(prev => prev.filter(p => p.file.name !== name));

    const updateBrand = (filename: string, brandName: string) =>
        setPending(prev => prev.map(p => p.file.name === filename ? { ...p, customBrand: brandName } : p));

    const handleUpload = async () => {
        if (pending.length === 0) return;
        setUploading(true);
        setResults(null);
        try {
            const mapping = pending.map(p => ({ filename: p.file.name, brandName: p.customBrand || p.file.name.replace(/\.[^.]+$/, '') }));
            const res = await uploadBrandLogosBulk(pending.map(p => p.file), mapping);
            if (res.success) {
                setResults(res.results);
                toast.success(`${res.updated} logos subidos, ${res.failed} fallidos`);
                queryClient.invalidateQueries({ queryKey: ['brands'] });
                setPending([]);
            } else {
                toast.error(res.error || 'Error en la carga masiva');
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Drop zone */}
            <div
                ref={dropRef}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-accent/30 transition-colors"
            >
                <Layers className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium text-sm">Arrastra aquí los logos o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP, SVG — hasta 100 archivos, 5 MB c/u<br />
                    El nombre del archivo se usa para identificar la marca automáticamente
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && addFiles(e.target.files)}
                />
            </div>

            {/* File list with brand assignment */}
            {pending.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{pending.length} archivo{pending.length > 1 ? 's' : ''} seleccionado{pending.length > 1 ? 's' : ''}</p>
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => setPending([])}>
                            <X className="h-3 w-3 mr-1" /> Limpiar todo
                        </Button>
                    </div>
                    <div className="rounded-md border divide-y max-h-80 overflow-y-auto">
                        {pending.map(p => (
                            <div key={p.file.name} className="flex items-center gap-3 px-3 py-2">
                                <div className="h-10 w-16 flex-shrink-0 border rounded bg-white flex items-center justify-center overflow-hidden">
                                    <img src={p.preview} alt={p.file.name} className="max-h-full max-w-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <p className="text-xs text-muted-foreground truncate">{p.file.name}</p>
                                    <BrandCombobox
                                        value={p.customBrand}
                                        brands={brandNames}
                                        onChange={val => updateBrand(p.file.name, val)}
                                        matched={!!p.matchedBrand}
                                    />
                                </div>
                                <button onClick={() => removeFile(p.file.name)} className="flex-shrink-0 text-muted-foreground hover:text-destructive">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <Button onClick={handleUpload} disabled={uploading} className="w-full sm:w-auto">
                        {uploading
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo {pending.length} logos…</>
                            : <><Upload className="h-4 w-4 mr-2" /> Subir {pending.length} logo{pending.length > 1 ? 's' : ''}</>}
                    </Button>
                </div>
            )}

            {/* Results */}
            {results && results.length > 0 && (
                <div className="rounded-md border divide-y max-h-64 overflow-y-auto">
                    {results.map(r => (
                        <div key={r.filename} className="flex items-center gap-3 px-3 py-2 text-sm">
                            {r.success
                                ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                            <span className="flex-1 truncate font-medium">{r.brand}</span>
                            {r.logoUrl && (
                                <img src={r.logoUrl} alt={r.brand} className="h-6 w-10 object-contain bg-white border rounded flex-shrink-0" />
                            )}
                            {r.error && <span className="text-xs text-destructive truncate">{r.error}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Simple brand combobox ────────────────────────────────────────────────────

function BrandCombobox({
    value, brands, onChange, matched,
}: {
    value: string; brands: string[]; onChange: (v: string) => void; matched: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const filtered = brands.filter(b => b.toLowerCase().includes((q || value).toLowerCase())).slice(0, 6);

    return (
        <div className="relative">
            <div className="flex items-center gap-1">
                <input
                    className="flex-1 text-xs border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    value={value}
                    onChange={e => { onChange(e.target.value); setQ(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder="Nombre de la marca…"
                />
                {matched && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" title="Marca encontrada automáticamente" />}
            </div>
            {open && filtered.length > 0 && (
                <div className="absolute z-50 top-full mt-0.5 left-0 right-0 rounded border bg-popover shadow-md">
                    {filtered.map(b => (
                        <button
                            key={b}
                            className="w-full text-left px-2 py-1 text-xs hover:bg-accent truncate"
                            onMouseDown={() => { onChange(b); setOpen(false); }}
                        >
                            {b}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Mode = 'single' | 'bulk';

export function BrandLogoUploader() {
    const [mode, setMode] = useState<Mode>('single');

    const { data: brands = [], isLoading } = useQuery<BrandInfo[]>({
        queryKey: ['brands'],
        queryFn: async () => {
            const { fetchBrands } = await import('@/lib/api');
            return fetchBrands();
        },
        staleTime: 1000 * 60 * 5,
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" /> Importar logos de marcas
                    </CardTitle>
                    <CardDescription>
                        Sube logos en formato PNG, JPG, WEBP o SVG directamente desde tu dispositivo.
                        Puedes hacerlo marca por marca o de forma masiva.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={mode === 'single' ? 'default' : 'outline'}
                            onClick={() => setMode('single')}
                        >
                            <ImageIcon className="h-4 w-4 mr-1.5" /> Marca individual
                        </Button>
                        <Button
                            size="sm"
                            variant={mode === 'bulk' ? 'default' : 'outline'}
                            onClick={() => setMode('bulk')}
                        >
                            <Layers className="h-4 w-4 mr-1.5" /> Carga masiva
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando marcas…
                        </div>
                    ) : mode === 'single' ? (
                        <SingleUpload brands={brands} />
                    ) : (
                        <BulkUpload brands={brands} />
                    )}
                </CardContent>
            </Card>

            {/* Current logos preview */}
            {!isLoading && brands.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Logos actuales
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                {brands.filter(b => b.imageUrl).length} / {brands.length}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2 max-h-72 overflow-y-auto">
                            {brands.map(b => (
                                <div key={b.name} className="border rounded-md p-2 flex flex-col items-center gap-1 bg-white min-h-[64px]">
                                    {b.imageUrl ? (
                                        <img
                                            src={b.imageUrl}
                                            alt={b.name}
                                            className="h-8 w-full object-contain"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="h-8 w-full flex items-center justify-center">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                                        </div>
                                    )}
                                    <p className="text-[9px] text-center text-muted-foreground leading-tight truncate w-full">{b.name}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
