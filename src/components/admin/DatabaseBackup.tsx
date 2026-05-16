import { useState, useEffect } from 'react';
import { join, dirname } from 'path';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Download,
    Database,
    FileJson,
    Cloud,
    Clock,
    HardDrive,
    Trash2,
    RefreshCw,
    CheckCircle,
    XCircle,
    Wifi,
    Calendar,
    Save,
    RotateCcw,
    Globe,
    Server,
    Shield,
    Terminal,
    ChevronDown,
    ChevronRight,
    Plus,
    ExternalLink,
} from 'lucide-react';
import {
    getBackupConfig,
    saveBackupConfig,
    createBackupNow,
    listLocalBackups,
    restoreFromBackupFile,
    deleteLocalBackup,
    testBackupDestination,
    exportBackup,
    type BackupConfig,
    type BackupDestination,
    type LocalBackup,
} from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function newDestId() {
    return `dest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

type DestType = 'webdav' | 'sftp' | 'gdrive' | 'tailscale';

const DEST_META: Record<DestType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; hint: string }> = {
    webdav:    { label: 'WebDAV',       icon: Globe,   color: 'text-blue-500',   hint: 'Asustor NAS, Nextcloud, ownCloud' },
    sftp:      { label: 'SFTP',         icon: Terminal, color: 'text-green-500',  hint: 'Cualquier servidor SSH/SFTP' },
    gdrive:    { label: 'Google Drive', icon: Cloud,   color: 'text-amber-500',  hint: 'Cuenta de servicio GCP' },
    tailscale: { label: 'Tailscale',    icon: Shield,  color: 'text-purple-500', hint: 'Dispositivo en tu red Tailscale (via SFTP)' },
};

const SCHEDULE_TYPES = [
    { value: 'daily',   label: 'Diario' },
    { value: 'weekly',  label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
] as const;

const WEEKDAYS = [
    { value: 0, label: 'Domingo' },  { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },   { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },   { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
];

// ─── DestinationCard ──────────────────────────────────────────────────────────

interface DestCardProps {
    dest: BackupDestination;
    onChange: (d: BackupDestination) => void;
    onDelete: () => void;
    onTest: (d: BackupDestination) => void;
    testing: boolean;
    testResult: { success: boolean; message?: string } | null;
}

function DestinationCard({ dest, onChange, onDelete, onTest, testing, testResult }: DestCardProps) {
    const [open, setOpen] = useState(dest.name === 'Nuevo destino');

    function set(field: string, value: string | boolean) {
        if (field === 'name' || field === 'type' || field === 'enabled') {
            onChange({ ...dest, [field]: value } as BackupDestination);
        } else {
            onChange({ ...dest, config: { ...dest.config, [field]: value as string } });
        }
    }

    const meta = DEST_META[dest.type as DestType] || DEST_META.sftp;
    const Icon = meta.icon;

    return (
        <div className={`rounded-lg border transition-colors ${dest.enabled ? 'border-border' : 'border-dashed border-muted-foreground/30'}`}>
            {/* ── Header ── */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                onClick={() => setOpen(o => !o)}
            >
                {/* Type icon */}
                <Icon className={`h-4 w-4 flex-shrink-0 ${meta.color}`} />

                <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{dest.name || 'Sin nombre'}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{meta.label}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {/* Enabled toggle */}
                    <button
                        type="button"
                        onClick={() => set('enabled', !dest.enabled)}
                        className={`w-8 h-4.5 h-[18px] rounded-full relative transition-colors ${dest.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                        title={dest.enabled ? 'Deshabilitar' : 'Habilitar'}
                    >
                        <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${dest.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>

                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2"
                        onClick={() => onTest(dest)} disabled={testing}>
                        {testing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
                        Probar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                        onClick={onDelete}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div onClick={e => e.stopPropagation()}>
                    <button className="text-muted-foreground hover:text-foreground p-0.5"
                        onClick={() => setOpen(o => !o)}>
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Test result */}
            {testResult && (
                <div className={`px-4 py-2 text-xs flex items-center gap-2 border-t ${testResult.success ? 'bg-green-500/10 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                    {testResult.success ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {testResult.message || (testResult.success ? 'Conexión exitosa' : 'Error de conexión')}
                </div>
            )}

            {/* ── Config fields ── */}
            {open && (
                <div className="px-4 pb-4 pt-2 border-t space-y-4">
                    {/* Name */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Nombre del destino</Label>
                            <Input value={dest.name} onChange={e => set('name', e.target.value)} placeholder="Mi NAS" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Tipo</Label>
                            <select value={dest.type}
                                onChange={e => set('type', e.target.value)}
                                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                {(Object.entries(DEST_META) as [DestType, typeof DEST_META[DestType]][]).map(([v, m]) => (
                                    <option key={v} value={v}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* WebDAV */}
                    {dest.type === 'webdav' && (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground bg-blue-500/10 text-blue-700 rounded px-2 py-1.5">
                                Compatible con Asustor NAS (WebDAV en ADM), Nextcloud, ownCloud
                            </p>
                            <div className="space-y-1">
                                <Label className="text-xs">URL del servidor WebDAV</Label>
                                <Input value={dest.config.url || ''} onChange={e => set('url', e.target.value)}
                                    placeholder="http://192.168.1.100:5005/webdav" className="h-8 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Usuario</Label>
                                    <Input value={dest.config.username || ''} onChange={e => set('username', e.target.value)} placeholder="admin" className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Contraseña</Label>
                                    <Input type="password" value={dest.config.password || ''} onChange={e => set('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" className="h-8 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Ruta remota</Label>
                                <Input value={dest.config.remotePath || '/'} onChange={e => set('remotePath', e.target.value)} placeholder="/backups/fragrance" className="h-8 text-sm" />
                            </div>
                        </div>
                    )}

                    {/* SFTP */}
                    {dest.type === 'sftp' && (
                        <div className="space-y-3">
                            <p className="text-xs bg-green-500/10 text-green-700 rounded px-2 py-1.5">
                                Compatible con Asustor NAS (SSH en ADM), cualquier servidor Linux con SFTP habilitado
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Host / IP</Label>
                                    <Input value={dest.config.host || ''} onChange={e => set('host', e.target.value)} placeholder="192.168.1.100" className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Puerto</Label>
                                    <Input value={dest.config.port || '22'} onChange={e => set('port', e.target.value)} placeholder="22" type="number" className="h-8 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Usuario</Label>
                                    <Input value={dest.config.username || ''} onChange={e => set('username', e.target.value)} placeholder="admin" className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Contraseña</Label>
                                    <Input type="password" value={dest.config.password || ''} onChange={e => set('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" className="h-8 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Ruta remota</Label>
                                <Input value={dest.config.remotePath || '/backups'} onChange={e => set('remotePath', e.target.value)} placeholder="/volume1/backups/fragrance" className="h-8 text-sm" />
                            </div>
                        </div>
                    )}

                    {/* Tailscale */}
                    {dest.type === 'tailscale' && (
                        <div className="space-y-3">
                            <div className="flex items-start gap-2 bg-purple-500/10 text-purple-700 rounded px-2 py-1.5 text-xs">
                                <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <span>
                                    Conecta con cualquier dispositivo en tu red Tailscale vía SFTP.
                                    Usa la IP Tailscale (<code className="font-mono">100.x.x.x</code>) o el hostname MagicDNS
                                    (<code className="font-mono">mynas.tail1234.ts.net</code>).
                                    El servidor debe tener Tailscale instalado y SFTP/SSH activo.
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Host Tailscale</Label>
                                    <Input value={dest.config.host || ''} onChange={e => set('host', e.target.value)}
                                        placeholder="100.64.0.10  o  mynas.tail1234.ts.net" className="h-8 text-sm font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Puerto SSH</Label>
                                    <Input value={dest.config.port || '22'} onChange={e => set('port', e.target.value)} placeholder="22" type="number" className="h-8 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Usuario</Label>
                                    <Input value={dest.config.username || ''} onChange={e => set('username', e.target.value)} placeholder="admin" className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Contraseña SSH</Label>
                                    <Input type="password" value={dest.config.password || ''} onChange={e => set('password', e.target.value)} placeholder="••••••••" autoComplete="new-password" className="h-8 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Ruta remota</Label>
                                <Input value={dest.config.remotePath || '/backups'} onChange={e => set('remotePath', e.target.value)} placeholder="/volume1/backups/fragrance" className="h-8 text-sm" />
                            </div>
                            <a href="https://login.tailscale.com/admin/machines" target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline">
                                <ExternalLink className="h-3 w-3" /> Ver mis dispositivos Tailscale
                            </a>
                        </div>
                    )}

                    {/* Google Drive */}
                    {dest.type === 'gdrive' && (
                        <div className="space-y-3">
                            <p className="text-xs bg-amber-500/10 text-amber-700 rounded px-2 py-1.5">
                                Crea una cuenta de servicio en Google Cloud Console, descarga el JSON y pégalo aquí.
                                Luego comparte la carpeta de Drive con el email de la cuenta de servicio.
                            </p>
                            <div className="space-y-1">
                                <Label className="text-xs">Service Account JSON</Label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono resize-y"
                                    value={dest.config.credentials || ''}
                                    onChange={e => set('credentials', e.target.value)}
                                    placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Folder ID de Google Drive</Label>
                                <Input value={dest.config.folderId || ''} onChange={e => set('folderId', e.target.value)}
                                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" className="h-8 text-sm font-mono" />
                                <p className="text-xs text-muted-foreground">Copia el ID de la URL de la carpeta en Drive. Vacío = raíz.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Respaldos ───────────────────────────────────────────────────────────

interface BackupsTabProps {
    backups: LocalBackup[];
    lastBackupAt: string | null;
    loading: boolean;
    onRefresh: () => void;
}

function BackupsTab({ backups, lastBackupAt, loading, onRefresh }: BackupsTabProps) {
    const { toast } = useToast();
    const [creating, setCreating] = useState(false);
    const [createBrand, setCreateBrand] = useState('');
    const [restoringFile, setRestoringFile] = useState<string | null>(null);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);
    const [downloadingJson, setDownloadingJson] = useState(false);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await createBackupNow(createBrand.trim() || undefined);
            if (!res.success) throw new Error(res.error);
            const uploadSummary = res.uploads?.length
                ? ` · ${res.uploads.filter((u: any) => u.success).length}/${res.uploads.length} destinos`
                : '';
            toast({ title: 'Respaldo creado', description: `${res.filename} (${formatBytes(res.size || 0)})${uploadSummary}` });
            onRefresh();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error al crear respaldo', description: err.message });
        } finally {
            setCreating(false);
        }
    };

    const handleDownloadJson = async () => {
        setDownloadingJson(true);
        try { await exportBackup(undefined); }
        catch (err: any) { toast({ variant: 'destructive', title: 'Error al descargar', description: err.message }); }
        finally { setDownloadingJson(false); }
    };

    const handleRestore = async (filename: string) => {
        if (!confirm(`¿Restaurar desde "${filename}"? Importará todos los perfumes del respaldo (upsert). Los datos existentes no se eliminarán.`)) return;
        setRestoringFile(filename);
        try {
            const res = await restoreFromBackupFile(filename);
            if (!res.success) throw new Error(res.error);
            toast({ title: 'Restauración completa', description: `${res.imported} de ${res.total} perfumes importados.` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error al restaurar', description: err.message });
        } finally { setRestoringFile(null); }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`¿Eliminar "${filename}"? Esta acción no se puede deshacer.`)) return;
        setDeletingFile(filename);
        try {
            const res = await deleteLocalBackup(filename);
            if (!res.success) throw new Error(res.error);
            toast({ title: 'Respaldo eliminado' });
            onRefresh();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error al eliminar', description: err.message });
        } finally { setDeletingFile(null); }
    };

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">Crear respaldo ahora</CardTitle>
                    </div>
                    <CardDescription>Genera un JSON de la base de datos y lo sube a los destinos habilitados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                        <Input placeholder="Filtrar por marca (opcional)" value={createBrand}
                            onChange={e => setCreateBrand(e.target.value)} className="max-w-xs h-8 text-sm" />
                        <Button onClick={handleCreate} disabled={creating} size="sm" className="gap-1.5">
                            {creating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <HardDrive className="h-3.5 w-3.5" />}
                            {creating ? 'Creando…' : 'Crear respaldo'}
                        </Button>
                        <Button variant="outline" onClick={handleDownloadJson} disabled={downloadingJson} size="sm" className="gap-1.5">
                            <Download className="h-3.5 w-3.5" />
                            {downloadingJson ? 'Descargando…' : 'Descargar JSON'}
                        </Button>
                    </div>
                    {lastBackupAt && (
                        <p className="text-xs text-muted-foreground">Último respaldo: {formatDate(lastBackupAt)}</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4 text-primary" />
                            <CardTitle className="text-base">Respaldos locales</CardTitle>
                            {backups.length > 0 && (
                                <Badge variant="secondary" className="text-xs">{backups.length}</Badge>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading} className="h-7 gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                    <CardDescription>Se conservan los últimos 30. Los más antiguos se eliminan automáticamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-sm text-muted-foreground text-center py-6">Cargando…</div>
                    ) : backups.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                            No hay respaldos locales. Crea uno arriba.
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {backups.map(b => (
                                <div key={b.name} className="flex items-center gap-3 px-3 py-2 rounded-md border hover:bg-muted/30 transition-colors">
                                    <FileJson className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono truncate">{b.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(b.createdAt)} · {formatBytes(b.size)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button variant="outline" size="sm" className="h-6 text-xs px-2 gap-1"
                                            onClick={() => handleRestore(b.name)}
                                            disabled={restoringFile === b.name || deletingFile === b.name}>
                                            {restoringFile === b.name ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                            Restaurar
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive"
                                            onClick={() => handleDelete(b.name)}
                                            disabled={deletingFile === b.name || restoringFile === b.name}>
                                            {deletingFile === b.name ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Tab: Destinos ────────────────────────────────────────────────────────────

interface DestinationsTabProps {
    config: BackupConfig;
    onChange: (c: BackupConfig) => void;
    onSave: () => void;
    saving: boolean;
}

function DestinationsTab({ config, onChange, onSave, saving }: DestinationsTabProps) {
    const { toast } = useToast();
    const [testingId, setTestingId] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, { success: boolean; message?: string }>>({});

    const destinations = config.destinations || [];

    function addDestination(type: DestType) {
        const newDest: BackupDestination = {
            id: newDestId(),
            name: DEST_META[type].label,
            type,
            enabled: false,
            config: type === 'sftp' || type === 'tailscale' ? { port: '22' } : {},
        };
        onChange({ ...config, destinations: [...destinations, newDest] });
    }

    function updateDest(updated: BackupDestination) {
        onChange({ ...config, destinations: destinations.map(d => d.id === updated.id ? updated : d) });
    }

    function deleteDest(id: string) {
        onChange({ ...config, destinations: destinations.filter(d => d.id !== id) });
    }

    async function testDest(dest: BackupDestination) {
        setTestingId(dest.id);
        setTestResults(r => ({ ...r, [dest.id]: undefined as any }));
        try {
            const res = await testBackupDestination(dest.type, dest.config);
            setTestResults(r => ({ ...r, [dest.id]: res }));
            toast({
                title: res.success ? 'Conexión exitosa' : 'Error de conexión',
                description: res.message || res.error || '',
                variant: res.success ? 'default' : 'destructive',
            });
        } catch (err: any) {
            setTestResults(r => ({ ...r, [dest.id]: { success: false, message: err.message } }));
        } finally {
            setTestingId(null);
        }
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h3 className="font-medium text-sm">Destinos de respaldo</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Configura dónde se subirán los respaldos automáticamente.
                </p>
            </div>

            {/* Add new — type picker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.entries(DEST_META) as [DestType, typeof DEST_META[DestType]][]).map(([type, meta]) => {
                    const Icon = meta.icon;
                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => addDestination(type)}
                            className="flex flex-col items-center gap-1.5 border border-dashed rounded-lg p-3 hover:border-primary hover:bg-primary/5 transition-colors text-center group"
                        >
                            <Icon className={`h-5 w-5 ${meta.color} group-hover:scale-110 transition-transform`} />
                            <div>
                                <p className="text-xs font-medium">{meta.label}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight">{meta.hint}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Destination list */}
            {destinations.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-sm">
                    <Cloud className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin destinos aún.</p>
                    <p className="text-xs mt-0.5">Haz clic en uno de los botones de arriba para agregar.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {destinations.map(dest => (
                        <DestinationCard
                            key={dest.id}
                            dest={dest}
                            onChange={updateDest}
                            onDelete={() => deleteDest(dest.id)}
                            onTest={testDest}
                            testing={testingId === dest.id}
                            testResult={testResults[dest.id] || null}
                        />
                    ))}
                </div>
            )}

            <div className="flex justify-end pt-1">
                <Button onClick={onSave} disabled={saving} className="gap-2">
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Guardando…' : 'Guardar destinos'}
                </Button>
            </div>
        </div>
    );
}

// ─── Tab: Programar ───────────────────────────────────────────────────────────

interface ScheduleTabProps {
    config: BackupConfig;
    onChange: (c: BackupConfig) => void;
    onSave: () => void;
    saving: boolean;
}

function ScheduleTab({ config, onChange, onSave, saving }: ScheduleTabProps) {
    function set<K extends keyof BackupConfig>(key: K, value: BackupConfig[K]) {
        onChange({ ...config, [key]: value });
    }

    function nextScheduleLabel() {
        if (!config.scheduleEnabled) return null;
        const type = config.scheduleType || 'daily';
        const time = config.scheduleTime || '02:00';
        if (type === 'daily') return `Todos los días a las ${time} UTC`;
        if (type === 'weekly') {
            const day = WEEKDAYS.find(d => d.value === config.scheduleDay)?.label || 'Domingo';
            return `Cada ${day} a las ${time} UTC`;
        }
        if (type === 'monthly') return `El día ${config.scheduleDay ?? 1} de cada mes a las ${time} UTC`;
        return null;
    }

    return (
        <div className="space-y-5 max-w-md">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">Respaldos automáticos</CardTitle>
                    </div>
                    <CardDescription>
                        El servidor ejecuta el respaldo en el horario configurado y lo sube a los destinos habilitados.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Activar respaldos automáticos</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Corre en el servidor, sin necesitar el navegador.</p>
                        </div>
                        <button type="button" onClick={() => set('scheduleEnabled', !config.scheduleEnabled)}
                            className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors ${config.scheduleEnabled ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.scheduleEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    {config.scheduleEnabled && (
                        <div className="space-y-4">
                            {/* Frequency */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Frecuencia</Label>
                                <div className="flex gap-2">
                                    {SCHEDULE_TYPES.map(t => (
                                        <button key={t.value} type="button" onClick={() => set('scheduleType', t.value)}
                                            className={`flex-1 py-1.5 rounded-md text-sm border transition-colors ${config.scheduleType === t.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/50'}`}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time */}
                            <div className="space-y-1.5">
                                <Label htmlFor="sched-time" className="text-xs">Hora (UTC)</Label>
                                <Input id="sched-time" type="time" value={config.scheduleTime || '02:00'}
                                    onChange={e => set('scheduleTime', e.target.value)} className="max-w-[130px] h-8 text-sm" />
                            </div>

                            {/* Day of week */}
                            {config.scheduleType === 'weekly' && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Día de la semana</Label>
                                    <select value={config.scheduleDay ?? 0} onChange={e => set('scheduleDay', parseInt(e.target.value))}
                                        className="h-8 w-full max-w-[180px] rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                        {WEEKDAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Day of month */}
                            {config.scheduleType === 'monthly' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="sched-dom" className="text-xs">Día del mes</Label>
                                    <Input id="sched-dom" type="number" min={1} max={28} value={config.scheduleDay ?? 1}
                                        onChange={e => set('scheduleDay', parseInt(e.target.value))} className="max-w-[90px] h-8 text-sm" />
                                    <p className="text-xs text-muted-foreground">1–28 para compatibilidad con todos los meses.</p>
                                </div>
                            )}

                            {nextScheduleLabel() && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                    Próximo: <strong className="text-foreground">{nextScheduleLabel()}</strong>
                                </div>
                            )}
                        </div>
                    )}

                    {config.lastBackupAt && (
                        <p className="text-xs text-muted-foreground border-t pt-3">
                            Último respaldo: <strong>{formatDate(config.lastBackupAt)}</strong>
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={onSave} disabled={saving} className="gap-2">
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Guardando…' : 'Guardar configuración'}
                </Button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'backups' | 'destinations' | 'schedule';

export function DatabaseBackup() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('backups');
    const [config, setConfig] = useState<BackupConfig>({
        destinations: [], scheduleEnabled: false, scheduleType: 'daily', scheduleTime: '02:00', scheduleDay: 0,
    });
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);
    const [backups, setBackups] = useState<LocalBackup[]>([]);
    const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
    const [loadingBackups, setLoadingBackups] = useState(false);

    useEffect(() => { loadConfig(); loadBackups(); }, []);

    async function loadConfig() {
        setLoadingConfig(true);
        try {
            const res = await getBackupConfig();
            if (res.success && res.config) {
                setConfig(prev => ({ ...prev, destinations: [], scheduleEnabled: false, scheduleType: 'daily', scheduleTime: '02:00', scheduleDay: 0, ...res.config }));
            }
        } catch {}
        setLoadingConfig(false);
    }

    async function loadBackups() {
        setLoadingBackups(true);
        try {
            const res = await listLocalBackups();
            if (res.success) { setBackups(res.backups || []); setLastBackupAt(res.lastBackupAt || null); }
        } catch {}
        setLoadingBackups(false);
    }

    async function handleSave() {
        setSavingConfig(true);
        try {
            const res = await saveBackupConfig(config);
            if (!res.success) throw new Error(res.error);
            toast({ title: 'Configuración guardada' });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error al guardar', description: err.message });
        } finally {
            setSavingConfig(false);
        }
    }

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'backups',      label: 'Respaldos', icon: <HardDrive className="h-3.5 w-3.5" /> },
        { id: 'destinations', label: 'Destinos',  icon: <Cloud className="h-3.5 w-3.5" /> },
        { id: 'schedule',     label: 'Programar', icon: <Clock className="h-3.5 w-3.5" /> },
    ];

    if (loadingConfig) {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Cargando configuración…
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Tab bar */}
            <div className="flex gap-0.5 border-b border-border">
                {tabs.map(tab => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                            activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}>
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'backups' && (
                <BackupsTab backups={backups} lastBackupAt={lastBackupAt} loading={loadingBackups} onRefresh={loadBackups} />
            )}
            {activeTab === 'destinations' && (
                <DestinationsTab config={config} onChange={setConfig} onSave={handleSave} saving={savingConfig} />
            )}
            {activeTab === 'schedule' && (
                <ScheduleTab config={config} onChange={setConfig} onSave={handleSave} saving={savingConfig} />
            )}
        </div>
    );
}
