import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { APIPerfume } from '@/lib/api';

interface SimilarPerfumesProps {
  perfumes: APIPerfume[];
}

export function SimilarPerfumes({ perfumes }: SimilarPerfumesProps) {
  if (!perfumes.length) return null;

  return (
    <section className="py-12">
      <h3 className="font-display text-2xl font-medium mb-6">Similar Fragrances</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {perfumes.map((perfume, index) => (
          <Link
            key={perfume.id}
            to={`/perfume/${perfume.id}`}
            className="group block opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            <div className="hover-lift">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary/20 mb-3">
                <img
                  src={perfume.imageUrl || '/placeholder.svg'}
                  alt={perfume.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {perfume.rating && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-background/90 backdrop-blur-sm rounded text-xs">
                    <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                    <span>{perfume.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{perfume.brand}</p>
              <h4 className="font-medium text-sm group-hover:text-accent transition-colors line-clamp-1">
                {perfume.name}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
