import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { type Perfume } from '@/data/perfumes';
import { cn } from '@/lib/utils';

interface PerfumeCardProps {
  perfume: Perfume;
  index?: number;
}

export function PerfumeCard({ perfume, index = 0 }: PerfumeCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(perfume.id);

  return (
    <article
      className={cn(
        "group relative bg-card rounded-lg overflow-hidden hover-lift luxury-border",
        "opacity-0 animate-fade-in"
      )}
      style={{ 
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {/* Image Container */}
      <Link to={`/perfume/${perfume.id}`} className="block aspect-[3/4] relative overflow-hidden">
        <img
          src={perfume.imageUrl}
          alt={perfume.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick View */}
        <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <span className="px-6 py-2 bg-background text-foreground text-sm font-medium tracking-wide rounded-full">
            View Details
          </span>
        </div>
      </Link>

      {/* Favorite Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background transition-all",
          favorite && "text-accent"
        )}
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(perfume.id);
        }}
      >
        <Heart className={cn("h-5 w-5", favorite && "fill-current")} />
      </Button>

      {/* Content */}
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {perfume.brand}
            </p>
            <h3 className="font-display text-lg font-medium leading-tight">
              <Link to={`/perfume/${perfume.id}`} className="hover:text-accent transition-colors">
                {perfume.name}
              </Link>
            </h3>
          </div>
        </div>

        {/* Notes Preview */}
        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
          {perfume.notes.top.slice(0, 2).join(', ')}
        </p>

        {/* Price & Rating */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">€{perfume.price}</span>
          <div className="flex items-center gap-1">
            <span className="text-amber">★</span>
            <span className="text-sm font-medium">{perfume.rating}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
