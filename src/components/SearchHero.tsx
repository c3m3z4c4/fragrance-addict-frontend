import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePerfumeSearch } from '@/hooks/usePerfumeSearch';
import { GenderFilterButtons, type GenderFilter } from '@/components/GenderFilterButtons';
import { cn } from '@/lib/utils';

export function SearchHero() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: results, isLoading } = usePerfumeSearch(query);

  // Filter quick-results dropdown by gender too
  const filteredResults = genderFilter === 'all'
    ? (results || [])
    : (results || []).filter(p => p.gender === genderFilter);

  const showResults = isFocused && query.length >= 2;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams({ q: query.trim() });
      if (genderFilter !== 'all') params.set('g', genderFilter);
      navigate(`/search?${params}`);
      setIsFocused(false);
    }
  };

  const handleResultClick = (id: string) => {
    navigate(`/perfume/${id}`);
    setQuery('');
    setIsFocused(false);
  };

  const handleHintClick = (hint: string) => {
    const params = new URLSearchParams({ q: hint });
    if (genderFilter !== 'all') params.set('g', genderFilter);
    navigate(`/search?${params}`);
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium mb-6 animate-fade-in">
            {t('search.title')} <span className="italic text-accent">{t('search.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 opacity-0 animate-fade-in animation-delay-100">
            {t('search.subtitle')}
          </p>

          {/* ── Pill search bar with gender buttons inside ── */}
          <div className="relative max-w-2xl mx-auto opacity-0 animate-fade-in animation-delay-200 z-10">
            <form onSubmit={handleSubmit}>
              {/* Pill container */}
              <div
                className={cn(
                  'flex items-center bg-card border-2 rounded-full transition-all duration-300 px-2',
                  isFocused
                    ? 'border-accent shadow-lg shadow-accent/10'
                    : 'border-border hover:border-secondary'
                )}
              >
                {/* Search icon */}
                <Search className="shrink-0 ml-3 h-5 w-5 text-muted-foreground pointer-events-none" />

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  placeholder={t('search.placeholder')}
                  className="flex-1 py-4 px-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-body min-w-0"
                />

                {/* Clear button */}
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

                {/* Divider */}
                <div className="shrink-0 w-px h-6 bg-border mx-2" />

                {/* Gender filter buttons — compact, inside pill */}
                <GenderFilterButtons
                  value={genderFilter}
                  onChange={setGenderFilter}
                  compact
                  className="shrink-0 py-2"
                />
              </div>

              {/* Quick Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  ) : filteredResults.length > 0 ? (
                    <>
                      <div className="max-h-[400px] overflow-y-auto">
                        {filteredResults.slice(0, 5).map((perfume) => (
                          <button
                            key={perfume.id}
                            type="button"
                            onClick={() => handleResultClick(perfume.id)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                          >
                            <img
                              src={perfume.imageUrl || '/placeholder.svg'}
                              alt={perfume.name}
                              className="w-12 h-12 object-cover rounded-lg shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{perfume.name}</p>
                              <p className="text-sm text-muted-foreground">{perfume.brand}</p>
                            </div>
                            {perfume.rating && (
                              <span className="text-sm text-accent font-medium shrink-0">
                                ★ {perfume.rating.toFixed(1)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      {filteredResults.length > 5 && (
                        <button
                          type="submit"
                          className="w-full py-3 text-center text-sm text-accent hover:bg-muted/50 border-t border-border transition-colors"
                        >
                          {filteredResults.length} {t('search.results')} →
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      {t('common.notFound')} "{query}"
                      {genderFilter !== 'all' && (
                        <p className="text-xs mt-1 opacity-60">
                          {t('search.tryRemovingGenderFilter', { defaultValue: 'Try removing the gender filter' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Gender label hint — below the pill, z-0 so it never overlaps the dropdown */}
          {genderFilter !== 'all' && (
            <p className="relative z-0 mt-3 text-xs text-muted-foreground opacity-0 animate-fade-in">
              {t('search.filteringBy', { defaultValue: 'Filtering by' })}:{' '}
              <span className="font-semibold text-foreground">{t(`search.${genderFilter}`)}</span>
              {' · '}
              <button onClick={() => setGenderFilter('all')} className="text-accent hover:underline">
                {t('search.clearFilter', { defaultValue: 'Clear' })}
              </button>
            </p>
          )}

          {/* Search hints — z-0 so dropdown always renders above them */}
          <div className={cn(
            'relative z-0 mt-6 flex flex-wrap justify-center gap-2 opacity-0 animate-fade-in animation-delay-300',
            genderFilter !== 'all' && 'mt-2'
          )}>
            <span className="text-sm text-muted-foreground">{t('search.trending')}:</span>
            {['Dior Sauvage', 'Vanilla', 'Oud', 'Chanel'].map((hint) => (
              <button
                key={hint}
                onClick={() => handleHintClick(hint)}
                className="text-sm px-3 py-1 rounded-full bg-secondary/30 text-foreground hover:bg-secondary/50 transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
