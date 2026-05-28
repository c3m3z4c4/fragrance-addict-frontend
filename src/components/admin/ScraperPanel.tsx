import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scrapePerfume, batchScrapePerfumes, API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Link as LinkIcon, FileText, CheckCircle2, XCircle, Clock, Globe, ShieldCheck, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Scraping-API proxy config ────────────────────────────────────────────────

interface ProxyConfig {
  success: boolean;
  provider: string | null;
  label: string | null;
  configured: boolean;
  availableProviders: { id: string; label: string; signupUrl: string }[];
}

function ScrapeProxyConfig() {
  const token = getAuthToken() || '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const queryClient = useQueryClient();

  const [provider, setProvider] = useState('scrapingbee');
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data: config } = useQuery<ProxyConfig>({
    queryKey: ['proxy-config'],
    queryFn: async () => {
      const r = await fetch(`${API_BASE_URL}/api/scrape/proxy/config`, { headers });
      return r.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_BASE_URL}/api/scrape/proxy/config`, {
        method: 'POST', headers, body: JSON.stringify({ provider, apiKey }),
      });
      return r.json();
    },
    onSuccess: (res) => {
      toast({
        title: res.success ? 'Proxy configurado' : 'Error',
        description: res.success ? `${res.label} activo. Agrega las vars de entorno para persistir.` : res.error,
        variant: res.success ? 'default' : 'destructive',
      });
      setApiKey('');
      queryClient.invalidateQueries({ queryKey: ['proxy-config'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_BASE_URL}/api/scrape/proxy/test`, {
        method: 'POST', headers, body: JSON.stringify({}),
      });
      return r.json();
    },
    onSuccess: (res) => {
      setTestResult({
        ok: res.success && !res.blocked,
        msg: res.success && !res.blocked
          ? `OK · ${res.bytes} bytes · JSON-LD: ${res.hasJsonLd ? 'sí' : 'no'} · notas: ${res.hasNotes ? 'sí' : 'no'}`
          : `Bloqueado/err: ${res.title || res.error || 'desconocido'}`,
      });
    },
    onError: (e) => setTestResult({ ok: false, msg: String(e) }),
  });

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-accent" /> Proxy de scraping (recomendado)
          {config?.configured && (
            <Badge variant="secondary" className="ml-2 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" /> {config.label}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Fragrantica bloquea la IP del servidor con Cloudflare. Un API de scraping con IP residencial
          obtiene el HTML real (notas, acordes, votos) sin usar Chromium en el VPS — elimina el pico de CPU
          y el bloqueo de Cloudflare a la vez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-[180px_1fr] gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Proveedor</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
            >
              {(config?.availableProviders || []).map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Pega tu API key del proveedor…"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="text-sm font-mono h-9"
              />
              <Button size="sm" className="h-9" disabled={!apiKey || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline" className="h-8 text-xs"
            disabled={!config?.configured || testMutation.isPending}
            onClick={() => testMutation.mutate()}
          >
            {testMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
            Probar bypass CF
          </Button>
          {testResult && (
            <span className={cn('text-xs', testResult.ok ? 'text-green-600' : 'text-red-500')}>
              {testResult.ok ? '✓ ' : '✗ '}{testResult.msg}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Tiers gratis:</span>
          {(config?.availableProviders || []).map(p => (
            <a key={p.id} href={p.signupUrl} target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1 text-accent hover:underline">
              {p.label} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ScrapeResult {
  url: string;
  status: 'pending' | 'success' | 'error';
  name?: string;
  error?: string;
}

export function ScraperPanel() {
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const queryClient = useQueryClient();

  const singleMutation = useMutation({
    mutationFn: (url: string) => scrapePerfume(url, true),
    onSuccess: (result) => {
      if (result.success && result.data) {
        toast({ title: 'Success', description: `Scraped: ${result.data.name}` });
        queryClient.invalidateQueries({ queryKey: ['perfumes'] });
        queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
        setSingleUrl('');
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const batchMutation = useMutation({
    mutationFn: (urls: string[]) => batchScrapePerfumes(urls, true),
    onMutate: (urls) => {
      setResults(urls.map((url) => ({ url, status: 'pending' })));
    },
    onSuccess: (result) => {
      if (result.success && result.results) {
        const updated = result.results.map((r) => ({
          url: r.url,
          status: r.success ? 'success' : 'error',
          name: r.data?.name,
          error: r.error,
        } as ScrapeResult));
        setResults(updated);
        
        const successCount = updated.filter((r) => r.status === 'success').length;
        toast({ 
          title: 'Batch Complete', 
          description: `${successCount}/${updated.length} perfumes scraped successfully` 
        });
        queryClient.invalidateQueries({ queryKey: ['perfumes'] });
        queryClient.invalidateQueries({ queryKey: ['admin-perfumes'] });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSingleScrape = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl.trim()) return;
    singleMutation.mutate(singleUrl.trim());
  };

  const handleBatchScrape = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = batchUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    
    if (urls.length === 0) {
      toast({ title: 'Error', description: 'Enter at least one URL', variant: 'destructive' });
      return;
    }
    
    batchMutation.mutate(urls);
  };

  return (
    <div className="space-y-6">
      <ScrapeProxyConfig />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Fragrantica Scraper
          </CardTitle>
          <CardDescription>
            Scrape perfume data from Fragrantica URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single">
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single URL</TabsTrigger>
              <TabsTrigger value="batch">Batch Scrape</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <form onSubmit={handleSingleScrape} className="space-y-4">
                <div>
                  <Input
                    type="url"
                    placeholder="https://www.fragrantica.com/perfume/..."
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    disabled={singleMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a Fragrantica perfume URL
                  </p>
                </div>
                <Button type="submit" disabled={singleMutation.isPending || !singleUrl.trim()}>
                  {singleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Scrape & Save
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="batch">
              <form onSubmit={handleBatchScrape} className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Enter one URL per line..."
                    value={batchUrls}
                    onChange={(e) => setBatchUrls(e.target.value)}
                    rows={6}
                    disabled={batchMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    One Fragrantica URL per line (max 10 at a time recommended)
                  </p>
                </div>
                <Button type="submit" disabled={batchMutation.isPending || !batchUrls.trim()}>
                  {batchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Start Batch Scrape
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Scraping Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    result.status === 'success' && "bg-green-500/10 border-green-500/20",
                    result.status === 'error' && "bg-destructive/10 border-destructive/20",
                    result.status === 'pending' && "bg-muted/50 border-border"
                  )}
                >
                  {result.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />}
                  {result.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {result.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.name || result.url}
                    </p>
                    {result.error && (
                      <p className="text-xs text-destructive">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-secondary/20">
        <CardHeader>
          <CardTitle className="text-base">Scraping Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Only Fragrantica URLs are supported</p>
          <p>• There's a 3-second delay between requests to be respectful</p>
          <p>• Batch scraping may take several minutes for large lists</p>
          <p>• Duplicate perfumes (same URL) will be skipped</p>
        </CardContent>
      </Card>
    </div>
  );
}
