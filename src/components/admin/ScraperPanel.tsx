import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scrapePerfume, batchScrapePerfumes } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2, Link as LinkIcon, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
