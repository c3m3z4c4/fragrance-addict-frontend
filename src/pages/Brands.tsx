import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchModal } from '@/components/SearchModal';
import { perfumes, brands } from '@/data/perfumes';
import { cn } from '@/lib/utils';

const Brands = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const brandData = brands.map(brand => {
    const brandPerfumes = perfumes.filter(p => p.brand === brand);
    return {
      name: brand,
      count: brandPerfumes.length,
      featuredImage: brandPerfumes[0]?.imageUrl,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium mb-4">
            Our <span className="italic text-accent">Brands</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover exceptional fragrances from the world's most prestigious perfume houses
          </p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandData.map((brand, index) => (
            <Link
              key={brand.name}
              to={`/?brand=${encodeURIComponent(brand.name)}`}
              className={cn(
                "group relative aspect-[4/3] rounded-lg overflow-hidden opacity-0 animate-fade-in",
                "hover-lift luxury-border"
              )}
              style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards'
              }}
            >
              {/* Background Image */}
              <img
                src={brand.featuredImage}
                alt={brand.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-primary-foreground">
                <h2 className="font-display text-2xl font-medium mb-1">{brand.name}</h2>
                <p className="text-sm text-primary-foreground/70">
                  {brand.count} {brand.count === 1 ? 'fragrance' : 'fragrances'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Brands;
