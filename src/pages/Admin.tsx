import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminPerfumeList } from '@/components/admin/AdminPerfumeList';
import { ScraperPanel } from '@/components/admin/ScraperPanel';
import { SitemapImporter } from '@/components/admin/SitemapImporter';
import { RescrapePanel } from '@/components/admin/RescrapePanel';
import { AdminStats } from '@/components/admin/AdminStats';
import { MetricsDashboard } from '@/components/admin/MetricsDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { BrandScraper } from '@/components/admin/BrandScraper';
import { ResetPanel } from '@/components/admin/ResetPanel';
import { AboutEditor } from '@/components/admin/AboutEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Sparkles, BarChart3, Globe, Wifi, WifiOff, Loader2, RefreshCw, Activity, Users, Layers, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('perfumes');
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
              Admin Panel
            </h1>
            <p className="text-muted-foreground">
              Manage your perfume catalog and scraping operations
            </p>
          </div>

          {/* Backend Status */}
          <Card className="flex-shrink-0">
            <CardHeader className="py-2 px-4">
              <div className="flex items-center gap-2">
                {backendStatus === 'checking' && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                  </span>
                )}
                {backendStatus === 'online' && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600">
                    <Wifi className="h-3 w-3" /> Backend Online
                  </span>
                )}
                {backendStatus === 'offline' && (
                  <span className="flex items-center gap-1.5 text-xs text-destructive">
                    <WifiOff className="h-3 w-3" /> Backend Offline
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={checkBackend}
                  disabled={backendStatus === 'checking'}
                >
                  <RefreshCw className={`h-3 w-3 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-5xl grid-cols-10">
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
            <TabsTrigger value="rescrape" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Re-Scrape</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Brands</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
            <TabsTrigger value="reset" className="flex items-center gap-2 text-destructive data-[state=active]:text-destructive">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
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

          <TabsContent value="rescrape" className="animate-fade-in">
            <RescrapePanel />
          </TabsContent>

          <TabsContent value="metrics" className="animate-fade-in">
            <MetricsDashboard />
          </TabsContent>

          <TabsContent value="stats" className="animate-fade-in">
            <AdminStats />
          </TabsContent>

          <TabsContent value="users" className="animate-fade-in">
            <UserManagement />
          </TabsContent>

          <TabsContent value="brands" className="animate-fade-in">
            <BrandScraper />
          </TabsContent>

          <TabsContent value="about" className="animate-fade-in">
            <AboutEditor />
          </TabsContent>

          <TabsContent value="reset" className="animate-fade-in">
            <ResetPanel />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
