import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
import { BrandLogoUploader } from '@/components/admin/BrandLogoUploader';
import { ResetPanel } from '@/components/admin/ResetPanel';
import { AboutEditor } from '@/components/admin/AboutEditor';
import { AISettings } from '@/components/admin/AISettings';
import { DuplicateManager } from '@/components/admin/DuplicateManager';
import { DatabaseBackup } from '@/components/admin/DatabaseBackup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Sparkles, BarChart3, Globe, Wifi, WifiOff, Loader2, RefreshCw, Activity, Users, Layers, Trash2, FileText, Bot, Copy, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('perfumes');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();

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
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
              Admin Panel
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your perfume catalog and scraping operations
            </p>
          </div>

          {/* Quick actions + Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/activity')}
              className="text-[11px] tracking-[0.1em] uppercase font-bold gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity
            </Button>

            {/* Backend Status */}
            <div className="flex items-center gap-1.5 border border-border rounded-lg py-1.5 px-3 text-xs">
              {backendStatus === 'checking' && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                </span>
              )}
              {backendStatus === 'online' && (
                <span className="flex items-center gap-1.5 text-green-600">
                  <Wifi className="h-3 w-3" /> Backend Online
                </span>
              )}
              {backendStatus === 'offline' && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <WifiOff className="h-3 w-3" /> Backend Offline
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-0.5"
                onClick={checkBackend}
                disabled={backendStatus === 'checking'}
              >
                <RefreshCw className={`h-3 w-3 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Scrollable single-row tab bar */}
          <div className="relative overflow-x-auto scrollbar-hide rounded-lg">
            <TabsList className="flex w-max h-auto gap-0.5 rounded-lg p-1">
              {([
                { value: 'perfumes',   icon: <Database className="h-3.5 w-3.5" />,   label: 'Perfumes' },
                { value: 'scraper',    icon: <Sparkles className="h-3.5 w-3.5" />,   label: 'Scraper' },
                { value: 'import',     icon: <Globe className="h-3.5 w-3.5" />,      label: 'Import' },
                { value: 'rescrape',   icon: <RefreshCw className="h-3.5 w-3.5" />,  label: 'Re-Scrape' },
                { value: 'metrics',    icon: <Activity className="h-3.5 w-3.5" />,   label: 'Metrics' },
                { value: 'stats',      icon: <BarChart3 className="h-3.5 w-3.5" />,  label: 'Stats' },
                { value: 'users',      icon: <Users className="h-3.5 w-3.5" />,      label: 'Users' },
                { value: 'brands',     icon: <Layers className="h-3.5 w-3.5" />,     label: 'Brands' },
                { value: 'duplicates', icon: <Copy className="h-3.5 w-3.5" />,       label: 'Dupes' },
                { value: 'about',      icon: <FileText className="h-3.5 w-3.5" />,   label: 'About' },
                { value: 'ai',         icon: <Bot className="h-3.5 w-3.5" />,        label: 'AI' },
                { value: 'backup',     icon: <HardDrive className="h-3.5 w-3.5" />,  label: 'Backup' },
                { value: 'reset',      icon: <Trash2 className="h-3.5 w-3.5 text-destructive" />, label: 'Reset', destructive: true },
              ] as const).map(({ value, icon, label, destructive }: any) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 rounded-md',
                    destructive && 'text-destructive data-[state=active]:text-destructive'
                  )}
                >
                  {icon}
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

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

          <TabsContent value="brands" className="animate-fade-in space-y-8">
            <BrandLogoUploader />
            <BrandScraper />
          </TabsContent>

          <TabsContent value="duplicates" className="animate-fade-in">
            <DuplicateManager />
          </TabsContent>

          <TabsContent value="about" className="animate-fade-in">
            <AboutEditor />
          </TabsContent>

          <TabsContent value="ai" className="animate-fade-in">
            <AISettings />
          </TabsContent>

          <TabsContent value="backup" className="animate-fade-in">
            <DatabaseBackup />
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
