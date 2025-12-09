import { useState, useMemo } from 'react';
import { SlidersHorizontal, Grid3X3, LayoutList } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchModal } from '@/components/SearchModal';
import { PerfumeCard } from '@/components/PerfumeCard';
import { FilterSidebar, type Filters } from '@/components/FilterSidebar';
import { Button } from '@/components/ui/button';
import { perfumes } from '@/data/perfumes';
import { cn } from '@/lib/utils';

const Index = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest');
  const [filters, setFilters] = useState<Filters>({
    brands: [],
    genders: [],
    families: [],
    priceRange: [0, 600],
    minRating: 0
  });

  const filteredPerfumes = useMemo(() => {
    let result = perfumes.filter((p) => {
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.genders.length && !filters.genders.includes(p.gender)) return false;
      if (filters.families.length && !filters.families.includes(p.family)) return false;
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
      if (p.rating < filters.minRating) return false;
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => b.year - a.year);
    }

    return result;
  }, [filters, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4 opacity-0 animate-fade-in">
              Discover Excellence
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium mb-6 opacity-0 animate-fade-in animation-delay-100">
              The Art of <span className="italic text-accent">Fragrance</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto opacity-0 animate-fade-in animation-delay-200">
              Explore our curated collection of the world's most exquisite perfumes, 
              each crafted with passion and precision.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />

          {/* Product Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <p className="text-sm text-muted-foreground">
                  {filteredPerfumes.length} {filteredPerfumes.length === 1 ? 'perfume' : 'perfumes'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-sm bg-transparent border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>

                {/* View Toggle */}
                <div className="hidden md:flex items-center border border-border rounded overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === 'grid' ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === 'list' ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    )}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            {filteredPerfumes.length > 0 ? (
              <div
                className={cn(
                  "grid gap-6",
                  viewMode === 'grid'
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {filteredPerfumes.map((perfume, index) => (
                  <PerfumeCard key={perfume.id} perfume={perfume} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-2">No perfumes found</p>
                <p className="text-sm text-muted-foreground/70">
                  Try adjusting your filters to discover more fragrances
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
