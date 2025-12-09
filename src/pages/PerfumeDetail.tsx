import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Star, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchModal } from '@/components/SearchModal';
import { NotePyramid } from '@/components/NotePyramid';
import { PerfumeCard } from '@/components/PerfumeCard';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { perfumes } from '@/data/perfumes';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const PerfumeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('100ml');
  const { toggleFavorite, isFavorite } = useFavorites();

  const perfume = perfumes.find(p => p.id === id);

  if (!perfume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-4">Perfume not found</h1>
          <Link to="/" className="text-accent hover:underline">Return to catalog</Link>
        </div>
      </div>
    );
  }

  const favorite = isFavorite(perfume.id);
  const relatedPerfumes = perfumes
    .filter(p => p.id !== perfume.id && (p.brand === perfume.brand || p.family === perfume.family))
    .slice(0, 4);

  const sizes = [
    { label: '30ml', price: perfume.price * 0.4 },
    { label: '50ml', price: perfume.price * 0.65 },
    { label: '100ml', price: perfume.price },
  ];

  const currentPrice = sizes.find(s => s.label === selectedSize)?.price || perfume.price;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${perfume.name} by ${perfume.brand}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "The perfume link has been copied to your clipboard.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to catalog
          </button>
        </div>

        {/* Product Section */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image */}
            <div className="relative opacity-0 animate-fade-in-left" style={{ animationFillMode: 'forwards' }}>
              <div className="aspect-square lg:aspect-[4/5] rounded-lg overflow-hidden bg-muted">
                <img
                  src={perfume.imageUrl}
                  alt={perfume.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "bg-background/80 backdrop-blur-sm",
                    favorite && "text-accent"
                  )}
                  onClick={() => {
                    toggleFavorite(perfume.id);
                    toast({
                      title: favorite ? "Removed from favorites" : "Added to favorites",
                      description: favorite
                        ? `${perfume.name} has been removed from your favorites`
                        : `${perfume.name} has been added to your favorites`,
                    });
                  }}
                >
                  <Heart className={cn("h-5 w-5", favorite && "fill-current")} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Details */}
            <div className="opacity-0 animate-fade-in-right" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              {/* Brand & Name */}
              <div className="mb-6">
                <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                  {perfume.brand}
                </p>
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium mb-4">
                  {perfume.name}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= Math.floor(perfume.rating)
                            ? "text-amber fill-current"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{perfume.rating}</span>
                  <span className="text-sm text-muted-foreground">· {perfume.concentration}</span>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 mb-8 py-6 border-y border-border">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Perfumer</p>
                  <p className="font-medium">{perfume.perfumer}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Year</p>
                  <p className="font-medium">{perfume.year}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Gender</p>
                  <p className="font-medium capitalize">{perfume.gender}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Family</p>
                  <p className="font-medium">{perfume.family}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-display text-lg mb-3">About this fragrance</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {perfume.description}
                </p>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <h2 className="font-display text-lg mb-4">Fragrance Notes</h2>
                <NotePyramid notes={perfume.notes} />
              </div>

              {/* Size Selection */}
              <div className="mb-8">
                <h2 className="font-display text-lg mb-4">Select Size</h2>
                <div className="flex gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size.label)}
                      className={cn(
                        "flex-1 py-3 px-4 rounded border-2 transition-all",
                        selectedSize === size.label
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-secondary"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{size.label}</span>
                        {selectedSize === size.label && (
                          <Check className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">€{Math.round(size.price)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Add to Cart */}
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-3xl font-semibold">€{Math.round(currentPrice)}</p>
                  <p className="text-sm text-muted-foreground">Free shipping over €100</p>
                </div>
                <Button
                  size="lg"
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
                  onClick={() => {
                    toast({
                      title: "Added to cart",
                      description: `${perfume.name} (${selectedSize}) has been added to your cart.`,
                    });
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Related Perfumes */}
        {relatedPerfumes.length > 0 && (
          <section className="container mx-auto px-4 py-16 border-t border-border">
            <h2 className="font-display text-2xl md:text-3xl mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPerfumes.map((p, index) => (
                <PerfumeCard key={p.id} perfume={p} index={index} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PerfumeDetail;
