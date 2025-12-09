import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { perfumes, type Perfume } from '@/data/perfumes';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Perfume[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = perfumes.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.brand.toLowerCase().includes(query.toLowerCase()) ||
          p.notes.top.some(n => n.toLowerCase().includes(query.toLowerCase())) ||
          p.notes.heart.some(n => n.toLowerCase().includes(query.toLowerCase())) ||
          p.notes.base.some(n => n.toLowerCase().includes(query.toLowerCase()))
      );
      setResults(filtered.slice(0, 6));
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (perfumeId: string) => {
    navigate(`/perfume/${perfumeId}`);
    onClose();
    setQuery('');
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute top-0 inset-x-0 p-4 md:p-8 animate-slide-up">
        <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="relative flex items-center border-b border-border">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search perfumes, brands, notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-12 py-6 text-lg border-0 focus-visible:ring-0 bg-transparent"
            />
            <button
              onClick={onClose}
              className="absolute right-4 p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto">
              {results.map((perfume, index) => (
                <button
                  key={perfume.id}
                  onClick={() => handleSelect(perfume.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left",
                    "opacity-0 animate-fade-in",
                    index === 0 && "animation-delay-100",
                    index === 1 && "animation-delay-200",
                    index === 2 && "animation-delay-300"
                  )}
                  style={{ animationFillMode: 'forwards' }}
                >
                  <img
                    src={perfume.imageUrl}
                    alt={perfume.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-display font-medium">{perfume.name}</h3>
                    <p className="text-sm text-muted-foreground">{perfume.brand}</p>
                  </div>
                  <span className="text-lg font-medium">€{perfume.price}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {query && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No perfumes found for "{query}"</p>
            </div>
          )}

          {/* Hints */}
          {!query && (
            <div className="p-6 text-sm text-muted-foreground">
              <p className="mb-2">Try searching for:</p>
              <div className="flex flex-wrap gap-2">
                {['Vanilla', 'Tom Ford', 'Rose', 'Oud'].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="px-3 py-1 bg-muted rounded-full hover:bg-secondary transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
