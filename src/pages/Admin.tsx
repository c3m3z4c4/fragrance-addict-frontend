import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminPerfumeList } from '@/components/admin/AdminPerfumeList';
import { ScraperPanel } from '@/components/admin/ScraperPanel';
import { SitemapImporter } from '@/components/admin/SitemapImporter';
import { AdminStats } from '@/components/admin/AdminStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Sparkles, BarChart3, Globe, Key, Check, X, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { useAdminApiKey } from '@/hooks/useAdminApiKey';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('perfumes');
  const { apiKey, saveApiKey, clearApiKey, isConfigured } = useAdminApiKey();
  const [inputKey, setInputKey] = useState(apiKey);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const checkBackend = async () => {
    setBackendStatus('checking');
    try {
      const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveKey = () => {
    if (inputKey.trim()) {
      saveApiKey(inputKey.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage your perfume catalog and scraping operations
          </p>
        </div>

        {/* API Key Configuration */}
        <Card className="mb-6">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <CardTitle className="text-base">API Key</CardTitle>
                {isConfigured ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                    <X className="h-3 w-3" /> Not configured
                  </span>
                )}
              </div>
              {/* Backend Status Indicator */}
              <div className="flex items-center gap-2">
                {backendStatus === 'checking' && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking...
                  </span>
                )}
                {backendStatus === 'online' && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full">
                    <Wifi className="h-3 w-3" />
                    Backend Online
                  </span>
                )}
                {backendStatus === 'offline' && (
                  <span className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
                    <WifiOff className="h-3 w-3" />
                    Backend Offline
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={checkBackend}
                  disabled={backendStatus === 'checking'}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <CardDescription>
              Enter your backend API key to access admin functions
            </CardDescription>
          </CardHeader>
          <CardContent className="py-3">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter API key..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="max-w-md"
              />
              <Button onClick={handleSaveKey} disabled={!inputKey.trim()}>
                Save
              </Button>
              {isConfigured && (
                <Button variant="outline" onClick={clearApiKey}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="perfumes" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Perfumes</span>
            </TabsTrigger>
            <TabsTrigger value="scraper" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Scraper</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfumes" className="animate-fade-in">
            <AdminPerfumeList />
          </TabsContent>

          <TabsContent value="scraper" className="animate-fade-in">
            <ScraperPanel />
          </TabsContent>

          <TabsContent value="import" className="animate-fade-in">
            <SitemapImporter />
          </TabsContent>

          <TabsContent value="stats" className="animate-fade-in">
            <AdminStats />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
