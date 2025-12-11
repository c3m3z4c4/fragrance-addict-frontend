import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminPerfumeList } from '@/components/admin/AdminPerfumeList';
import { ScraperPanel } from '@/components/admin/ScraperPanel';
import { SitemapImporter } from '@/components/admin/SitemapImporter';
import { AdminStats } from '@/components/admin/AdminStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Sparkles, BarChart3, Globe } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('perfumes');

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
