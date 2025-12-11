import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Star } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NotesPyramidVisual } from '@/components/NotesPyramidVisual';
import { SimilarPerfumes } from '@/components/SimilarPerfumes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { usePerfumeDetail, usePerfumes, findSimilarPerfumes } from '@/hooks/usePerfumeSearch';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const PerfumeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: perfume, isLoading, error } = usePerfumeDetail(id || '');
  const { data: allPerfumes } = usePerfumes(1, 50);

  const favorite = perfume ? isFavorite(perfume.id) : false;
  const similarPerfumes = perfume && allPerfumes?.perfumes 
    ? findSimilarPerfumes(perfume, allPerfumes.perfumes, 4) 
    : [];

  const handleShare = async () => {
    if (!perfume) return;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid lg:grid-cols-2 gap-16">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl mb-4">Perfume not found</h1>
            <Link to="/" className="text-accent hover:underline">Return to search</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Product Section */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image */}
            <div className="relative opacity-0 animate-fade-in-left" style={{ animationFillMode: 'forwards' }}>
              <div className="aspect-square lg:aspect-[4/5] rounded-lg overflow-hidden bg-muted">
                <img
                  src={perfume.imageUrl || '/placeholder.svg'}
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
                {perfume.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= Math.floor(perfume.rating || 0)
                              ? "text-amber fill-current"
                              : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{perfume.rating.toFixed(1)}</span>
                    {perfume.concentration && (
                      <span className="text-sm text-muted-foreground">· {perfume.concentration}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 mb-8 py-6 border-y border-border">
                {perfume.perfumer && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Perfumer</p>
                    <p className="font-medium">{perfume.perfumer}</p>
                  </div>
                )}
                {perfume.year && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Year</p>
                    <p className="font-medium">{perfume.year}</p>
                  </div>
                )}
                {perfume.gender && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Gender</p>
                    <p className="font-medium capitalize">{perfume.gender}</p>
                  </div>
                )}
                {perfume.concentration && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Concentration</p>
                    <p className="font-medium">{perfume.concentration}</p>
                  </div>
                )}
              </div>

              {/* Accords */}
              {perfume.accords && perfume.accords.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-display text-lg mb-4">Main Accords</h2>
                  <div className="flex flex-wrap gap-2">
                    {perfume.accords.map((accord, index) => (
                      <span
                        key={accord}
                        className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-sm font-medium text-foreground"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {accord}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {perfume.description && (
                <div className="mb-8">
                  <h2 className="font-display text-lg mb-3">About this fragrance</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {perfume.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {perfume.notes && (
                <NotesPyramidVisual notes={perfume.notes} />
              )}

              {/* Source link */}
              {perfume.sourceUrl && (
                <div className="mt-8 pt-6 border-t border-border">
                  <a
                    href={perfume.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    View original source →
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Similar Perfumes */}
        {similarPerfumes.length > 0 && (
          <section className="container mx-auto px-4 py-12 border-t border-border">
            <SimilarPerfumes perfumes={similarPerfumes} />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PerfumeDetail;
