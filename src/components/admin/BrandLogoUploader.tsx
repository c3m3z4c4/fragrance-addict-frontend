import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchBrands,
    uploadBrandLogosBulk,
    uploadBrandLogo,
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
    AlertCircle,
    FolderOpen,
    ArrowRight,
} from 'lucide-react';

// ─── Matching helpers ─────────────────────────────────────────────────────────

function normalize(s: string) {
    return s.toLowerCase()
        .replace(/[&]/g, 'and')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function matchBrand(filename: string, brands: BrandInfo[]): BrandInfo | null {
    const name = filename.replace(/\.[^.]+$/, ''); // strip extension
    const norm = normalize(name);

    // 1. Exact normalized match
    const exact = brands.find(b => normalize(b.name) === norm);
    if (exact) return exact;

    // 2. One side contains the other
    const partial = brands.find(b => {
        const bn = normalize(b.name);
        return bn.includes(norm) || norm.includes(bn);
    });
    if (partial) return partial;

    // 3. Word overlap — require >50% of words to match
    const words = norm.split(' ').filter(Boolean);
    if (words.length === 0) return null;
    const best = brands
        .map(b => {
            const bwords = normalize(b.name).split(' ').filter(Boolean);
            const shared = words.filter(w => bwords.includes(w)).length;
            const score = shared / Math.max(words.length, bwords.length);
            return { b, score };
        })
        .filter(x => x.score > 0.5)
        .sort((a, b) => b.score - a.score)[0];

    return best?.b ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingFile {
    file: File;
    preview: string;
    matched: BrandInfo | null;   // auto-matched brand
    override: string;             // manual brand name (empty = use matched)
    hasLogo: boolean;             // matched brand already has a logo
}

interface UploadResult extends BulkLogoUploadResult {
    preview?: string;
}

// ─── Bulk import (main feature) ───────────────────────────────────────────────

function BulkImport({ brands }: { brands: BrandInfo[] }) {
    const queryClient = useQueryClient();
    const dropRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<'drop' | 'review' | 'done'>('drop');
    const [pending, setPending] = useState<PendingFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<UploadResult[]>([]);
    const [overwriteExisting, setOverwriteExisting] = useState(false);

    const addFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f.name));
        if (arr.length === 0) { toast.error('Solo se aceptan PNG, JPG, WEBP o SVG'); return; }

        const newPending: PendingFile[] = arr.map(f => {
            const matched = matchBrand(f.name, brands);
            return {
                file: f,
                preview: URL.createObjectURL(f),
                matched,
                override: '',
                hasLogo: !!(matched?.imageUrl),
            };
        });
        setPending(newPending);
        setStep('review');
    }, [brands]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    }, [addFiles]);

    const removeFile = (name: string) => {
        const next = pending.filter(p => p.file.name !== name);
        setPending(next);
        if (next.length === 0) setStep('drop');
    };

    const setOverride = (filename: string, val: string) =>
        setPending(prev => prev.map(p => p.file.name === filename ? { ...p, override: val } : p));

    const toUpload = overwriteExisting
        ? pending.filter(p => p.matched || p.override)
        : pending.filter(p => (p.matched || p.override) && !p.hasLogo);

    const unmatched = pending.filter(p => !p.matched && !p.override);
    const skipped = pending.filter(p => (p.matched || p.override) && p.hasLogo && !overwriteExisting);

    const handleUpload = async () => {
        if (toUpload.length === 0) return;
        setUploading(true);
        try {
            const mapping = toUpload.map(p => ({
                filename: p.file.name,
                brandName: p.override || p.matched!.name,
            }));
            const res = await uploadBrandLogosBulk(toUpload.map(p => p.file), mapping);
            if (res.success) {
                const enriched: UploadResult[] = res.results.map(r => ({
                    ...r,
                    preview: toUpload.find(p => p.file.name === r.filename)?.preview,
                }));
                setResults(enriched);
                setStep('done');
                queryClient.invalidateQueries({ queryKey: ['brands'] });
                toast.success(`${res.updated} logos importados correctamente`);
            } else {
                toast.error(res.error || 'Error en la importación');
            }
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setPending([]);
        setResults([]);
        setStep('drop');
    };

    // ── Step: drop zone ────────────────────────────────────────────────────────
    if (step === 'drop') return (
        <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/60 hover:bg-accent/30 transition-colors group"
        >
            <FolderOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="font-semibold text-base">Arrastra la carpeta de logos o haz clic para seleccionar</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Los archivos deben llamarse igual que la marca: <span className="font-mono bg-muted px-1 rounded text-xs">By Kilian.png</span>,{' '}
                <span className="font-mono bg-muted px-1 rounded text-xs">Chanel.png</span>, etc.
            </p>
            <p className="text-xs text-muted-foreground mt-3">PNG · JPG · WEBP · SVG — hasta 100 archivos, 5 MB c/u</p>
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                multiple
                className="hidden"
                onChange={e => e.target.files && addFiles(e.target.files)}
            />
        </div>
    );

    // ── Step: results ──────────────────────────────────────────────────────────
    if (step === 'done') return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-4">
                    <p className="text-3xl font-bold text-green-600">{results.filter(r => r.success).length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Importados</p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-3xl font-bold text-amber-500">{skipped.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Omitidos (ya tenían logo)</p>
                </div>
                <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 p-4">
                    <p className="text-3xl font-bold text-destructive">{results.filter(r => !r.success).length + unmatched.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Sin match / error</p>
                </div>
            </div>

            <div className="rounded-md border divide-y max-h-72 overflow-y-auto">
                {results.map(r => (
                    <div key={r.filename} className="flex items-center gap-3 px-3 py-2">
                        {r.success
                            ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                        {r.preview && (
                            <div className="h-8 w-12 flex-shrink-0 border rounded bg-white flex items-center justify-center overflow-hidden">
                                <img src={r.preview} alt={r.brand} className="max-h-full max-w-full object-contain" />
                            </div>
                        )}
                        <span className="flex-1 text-sm font-medium truncate">{r.brand}</span>
                        {r.error && <span className="text-xs text-destructive">{r.error}</span>}
                    </div>
                ))}
                {unmatched.map(p => (
                    <div key={p.file.name} className="flex items-center gap-3 px-3 py-2 opacity-50">
                        <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="h-8 w-12 flex-shrink-0 border rounded bg-white flex items-center justify-center overflow-hidden">
                            <img src={p.preview} alt={p.file.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <span className="flex-1 text-sm text-muted-foreground truncate">{p.file.name.replace(/\.[^.]+$/, '')} — sin match</span>
                    </div>
                ))}
            </div>

            <Button variant="outline" onClick={reset}>
                <Upload className="h-4 w-4 mr-2" /> Nueva importación
            </Button>
        </div>
    );

    // ── Step: review ───────────────────────────────────────────────────────────
    const matched = pending.filter(p => p.matched || p.override);
    const noLogo = matched.filter(p => !p.hasLogo || overwriteExisting);

    return (
        <div className="space-y-5">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-lg text-green-600">{matched.filter(p => !p.hasLogo).length}</span>
                    <span className="text-muted-foreground">listos para importar</span>
                </div>
                {skipped.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-lg text-amber-500">{skipped.length}</span>
                        <span className="text-muted-foreground">ya tienen logo</span>
                    </div>
                )}
                {unmatched.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-lg text-muted-foreground">{unmatched.length}</span>
                        <span className="text-muted-foreground">sin match</span>
                    </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                    {skipped.length > 0 && (
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={overwriteExisting}
                                onChange={e => setOverwriteExisting(e.target.checked)}
                                className="rounded"
                            />
                            Sobreescribir existentes
                        </label>
                    )}
                    <Button size="sm" variant="ghost" onClick={reset} className="text-xs">
                        <X className="h-3.5 w-3.5 mr-1" /> Reiniciar
                    </Button>
                </div>
            </div>

            {/* File list */}
            <div className="rounded-md border divide-y max-h-[480px] overflow-y-auto">
                {pending.map(p => {
                    const effectiveName = p.override || p.matched?.name || '';
                    const isSkipped = p.hasLogo && !overwriteExisting && (p.matched || p.override);
                    const isUnmatched = !p.matched && !p.override;
                    return (
                        <div
                            key={p.file.name}
                            className={`flex items-center gap-3 px-3 py-2.5 ${isSkipped ? 'opacity-40' : ''}`}
                        >
                            {/* Preview */}
                            <div className="h-10 w-16 flex-shrink-0 border rounded bg-white flex items-center justify-center overflow-hidden">
                                <img src={p.preview} alt={p.file.name} className="max-h-full max-w-full object-contain" />
                            </div>

                            {/* Filename → brand */}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground truncate max-w-[130px]">
                                    {p.file.name.replace(/\.[^.]+$/, '')}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                {isUnmatched ? (
                                    <BrandPicker
                                        value={p.override}
                                        brands={brands}
                                        onChange={val => setOverride(p.file.name, val)}
                                    />
                                ) : (
                                    <span className="text-sm font-medium truncate">{effectiveName}</span>
                                )}
                            </div>

                            {/* Status badge */}
                            <div className="flex-shrink-0">
                                {isUnmatched ? (
                                    <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">sin match</Badge>
                                ) : isSkipped ? (
                                    <Badge variant="outline" className="text-[10px]">ya tiene logo</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">listo</Badge>
                                )}
                            </div>

                            <button onClick={() => removeFile(p.file.name)} className="flex-shrink-0 text-muted-foreground hover:text-destructive ml-1">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Action */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={handleUpload}
                    disabled={uploading || noLogo.length === 0}
                    size="lg"
                >
                    {uploading
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando…</>
                        : <><Upload className="h-4 w-4 mr-2" /> Importar {noLogo.length} logo{noLogo.length !== 1 ? 's' : ''}</>}
                </Button>
                {unmatched.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {unmatched.length} archivos ignorados — asígnalos manualmente si quieres incluirlos
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Brand picker (inline input + dropdown) ───────────────────────────────────

function BrandPicker({ value, brands, onChange }: {
    value: string;
    brands: BrandInfo[];
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const filtered = brands
        .filter(b => b.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 7);

    return (
        <div className="relative flex-1 min-w-0">
            <input
                className="w-full text-sm border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60"
                value={value}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Escribe para asignar marca…"
            />
            {open && filtered.length > 0 && value.length > 0 && (
                <div className="absolute z-50 top-full mt-0.5 left-0 right-0 rounded border bg-popover shadow-lg max-h-44 overflow-y-auto">
                    {filtered.map(b => (
                        <button
                            key={b.name}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent truncate flex items-center justify-between gap-2"
                            onMouseDown={() => { onChange(b.name); setOpen(false); }}
                        >
                            <span className="truncate">{b.name}</span>
                            {!b.imageUrl && <span className="text-[10px] text-amber-500 flex-shrink-0">sin logo</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

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
        setPreview(URL.createObjectURL(f));
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
                setSelected(null); setQuery(''); setFile(null); setPreview(null);
                if (inputRef.current) inputRef.current.value = '';
            } else {
                toast.error(res.error || 'Error al subir logo');
            }
        } finally {
            setUploading(false);
        }
    };

    const clear = () => {
        setSelected(null); setQuery(''); setFile(null); setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="space-y-5">
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
                            <button key={b.name}
                                className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                                onClick={() => handleSelect(b)}
                            >
                                {b.imageUrl
                                    ? <img src={b.imageUrl} alt={b.name} className="h-6 w-10 object-contain flex-shrink-0 bg-white rounded" />
                                    : <div className="h-6 w-10 flex-shrink-0 bg-muted rounded flex items-center justify-center">
                                        <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                }
                                <span className="flex-1 truncate">{b.name}</span>
                                <span className="text-xs text-muted-foreground">{b.count}</span>
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

            <div className="space-y-1.5">
                <Label>Imagen del logo</Label>
                <Input ref={inputRef} type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange} className="max-w-sm cursor-pointer" />
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG — máx. 5 MB</p>
            </div>

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
                {uploading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo…</>
                    : <><Upload className="h-4 w-4 mr-2" /> Subir logo</>}
            </Button>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Mode = 'bulk' | 'single';

export function BrandLogoUploader() {
    const [mode, setMode] = useState<Mode>('bulk');

    const { data: brands = [], isLoading } = useQuery<BrandInfo[]>({
        queryKey: ['brands'],
        queryFn: fetchBrands,
        staleTime: 1000 * 60 * 5,
    });

    const withLogo = brands.filter(b => b.imageUrl).length;
    const withoutLogo = brands.length - withLogo;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" /> Importar logos de marcas
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Nombra los archivos igual que la marca y el sistema los asigna automáticamente.
                            </CardDescription>
                        </div>
                        {!isLoading && (
                            <div className="text-right flex-shrink-0">
                                <p className="text-2xl font-bold">{withLogo}<span className="text-sm font-normal text-muted-foreground">/{brands.length}</span></p>
                                <p className="text-xs text-muted-foreground">{withoutLogo} sin logo</p>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Mode toggle */}
                    <div className="flex gap-2 border-b pb-4">
                        <button
                            onClick={() => setMode('bulk')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'bulk' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Importación masiva
                        </button>
                        <button
                            onClick={() => setMode('single')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'single' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Marca individual
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando marcas…
                        </div>
                    ) : mode === 'bulk' ? (
                        <BulkImport brands={brands} />
                    ) : (
                        <SingleUpload brands={brands} />
                    )}
                </CardContent>
            </Card>

            {/* Current logos grid */}
            {!isLoading && brands.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Estado de logos
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                {withLogo} con logo · {withoutLogo} sin logo
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-64 overflow-y-auto">
                            {brands.map(b => (
                                <div key={b.name}
                                    className={`border rounded-md p-2 flex flex-col items-center gap-1 min-h-[64px] ${b.imageUrl ? 'bg-white' : 'bg-muted/20'}`}
                                >
                                    {b.imageUrl ? (
                                        <img src={b.imageUrl} alt={b.name}
                                            className="h-7 w-full object-contain"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="h-7 w-full flex items-center justify-center">
                                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        </div>
                                    )}
                                    <p className="text-[8px] text-center text-muted-foreground leading-tight truncate w-full">{b.name}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
