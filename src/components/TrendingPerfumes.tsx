import { Link } from 'react-router-dom';
import { usePerfumes } from '@/hooks/usePerfumeSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';

export function TrendingPerfumes() {
  const { data, isLoading, error } = usePerfumes(1, 8);

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Unable to load perfumes. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-medium mb-2">
              Recently Added
            </h2>
            <p className="text-muted-foreground">Explore the latest additions to our catalog</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data?.perfumes.map((perfume, index) => (
              <Link
                key={perfume.id}
                to={`/perfume/${perfume.id}`}
                className="group block opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <article className="hover-lift">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary/20 mb-4">
                    <img
                      src={perfume.imageUrl || '/placeholder.svg'}
                      alt={perfume.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {perfume.rating && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-background/90 backdrop-blur-sm rounded-full text-sm">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span className="font-medium">{perfume.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {perfume.brand}
                    </p>
                    <h3 className="font-display text-lg font-medium group-hover:text-accent transition-colors">
                      {perfume.name}
                    </h3>
                    {perfume.accords && perfume.accords.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {perfume.accords.slice(0, 3).map((accord) => (
                          <span
                            key={accord}
                            className="text-xs px-2 py-0.5 bg-secondary/30 rounded-full text-foreground/80"
                          >
                            {accord}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {data?.perfumes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No perfumes in the catalog yet</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              Add perfumes using the scraping API
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
