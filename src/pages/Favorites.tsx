import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchModal } from '@/components/SearchModal';
import { PerfumeCard } from '@/components/PerfumeCard';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { perfumes } from '@/data/perfumes';

const Favorites = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { favorites } = useFavorites();

  const favoritePerfumes = perfumes.filter(p => favorites.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium mb-4">
            Your <span className="italic text-accent">Favorites</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {favoritePerfumes.length > 0
              ? `You have ${favoritePerfumes.length} ${favoritePerfumes.length === 1 ? 'fragrance' : 'fragrances'} in your collection`
              : 'Start building your fragrance collection'}
          </p>
        </div>

        {/* Content */}
        {favoritePerfumes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoritePerfumes.map((perfume, index) => (
              <PerfumeCard key={perfume.id} perfume={perfume} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Explore our catalog and click the heart icon to save your favorite fragrances
            </p>
            <Button asChild>
              <Link to="/">Explore Catalog</Link>
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
