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
    <section className="relative flex flex-col items-center justify-center overflow-hidden pt-16 pb-10 sm:pt-24 sm:pb-16 md:pt-28 md:pb-20">

      {/* ── Layered atmospheric background ─────────────────────────────────── */}
      {/* Warm radial glow — emanates from top-center like a spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 60% at 50% -10%, hsl(32 40% 78% / 0.38) 0%, transparent 70%)',
        }}
      />
      {/* Secondary warm amber accent in bottom-right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 82% 85%, hsl(23 80% 70% / 0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── Decorative geometric arcs — top right corner ────────────────────── */}
      <div className="hidden sm:block absolute top-0 right-0 w-[540px] h-[540px] pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 540 540"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 right-0 w-full h-full text-foreground opacity-[0.055]"
        >
          <circle cx="540" cy="0" r="440" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="540" cy="0" r="310" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="540" cy="0" r="190" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="540" cy="0" r="90"  stroke="currentColor" strokeWidth="0.5"  />
          <line x1="420" y1="0" x2="540" y2="120" stroke="currentColor" strokeWidth="0.4" opacity="0.8" />
          <line x1="310" y1="0" x2="540" y2="230" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
          <line x1="200" y1="0" x2="540" y2="340" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
        </svg>
      </div>

      {/* ── Decorative arcs — bottom left mirror ────────────────────────────── */}
      <div className="absolute bottom-0 left-0 w-[280px] h-[280px] pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 280 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 left-0 w-full h-full text-foreground opacity-[0.04]"
        >
          <circle cx="0" cy="280" r="210" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="0" cy="280" r="130" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="0" cy="280" r="60"  stroke="currentColor" strokeWidth="0.5"  />
        </svg>
      </div>

      {/* ── Floating atmospheric orbs ─────────────────────────────────────── */}
      <div className="absolute top-1/4 left-[7%]  w-36 h-36 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-[9%] w-24 h-24 rounded-full bg-accent/6  blur-2xl pointer-events-none" />

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">

          {/* Eyebrow — subtle category label */}
          <div className="flex items-center justify-center gap-3 mb-6 md:mb-8 opacity-0 animate-fade-in">
            <div className="h-px w-8 bg-accent/50" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground/70">
              Fragrance Discovery
            </span>
            <div className="h-px w-8 bg-accent/50" />
          </div>

          {/* Main headline — editorial split */}
          <h1 className="mb-6 md:mb-8 opacity-0 animate-fade-in animation-delay-100">
            {/* First line: Dosis, lightweight */}
            <span className="block font-display text-[2.6rem] sm:text-5xl md:text-[4.5rem] lg:text-[5.5rem] font-light tracking-[-0.01em] leading-[0.95] text-foreground/85">
              {t('search.title')}
            </span>
            {/* Second line: Cormorant Garamond italic — the luxury contrast */}
            <span
              className="block text-[2.6rem] sm:text-5xl md:text-[4.5rem] lg:text-[5.5rem] font-light leading-[1.05] mt-1 text-accent"
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                letterSpacing: '-0.01em',
              }}
            >
              {t('search.titleHighlight')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-muted-foreground mb-8 md:mb-12 max-w-lg mx-auto leading-relaxed tracking-wide opacity-0 animate-fade-in animation-delay-200">
            {t('search.subtitle')}
          </p>

          {/* ── Search bar ───────────────────────────────────────────────────── */}
          <div className="relative max-w-2xl mx-auto opacity-0 animate-fade-in animation-delay-300 z-10">
            <form onSubmit={handleSubmit}>
              {/* Pill container */}
              <div
                className={cn(
                  'flex items-center bg-card/90 backdrop-blur-sm border rounded-full',
                  'transition-all duration-300 px-2 shadow-lg',
                  isFocused
                    ? 'border-accent shadow-[0_8px_40px_hsl(23_95%_45%/0.14)]'
                    : 'border-border/70 hover:border-secondary shadow-foreground/6'
                )}
              >
                {/* Search icon / spinner */}
                {isLoading ? (
                  <Loader2 className="shrink-0 ml-4 h-4 w-4 text-accent animate-spin" />
                ) : (
                  <Search className="shrink-0 ml-4 h-4 w-4 text-muted-foreground pointer-events-none" />
                )}

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  placeholder={t('search.placeholder')}
                  className="flex-1 py-4 px-4 bg-transparent text-foreground placeholder:text-muted-foreground/55 focus:outline-none font-body text-sm min-w-0"
                />

                {/* Clear button */}
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors mr-1"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}

                {/* Divider */}
                <div className="shrink-0 w-px h-5 bg-border/60 mx-1" />

                {/* Gender filter buttons — compact, inside pill */}
                <GenderFilterButtons
                  value={genderFilter}
                  onChange={setGenderFilter}
                  compact
                  className="shrink-0 py-2 pr-1"
                />
              </div>

              {/* Quick Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-card/98 backdrop-blur-md border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                    </div>
                  ) : filteredResults.length > 0 ? (
                    <>
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-border/30">
                        {filteredResults.slice(0, 5).map((perfume) => (
                          <button
                            key={perfume.id}
                            type="button"
                            onClick={() => handleResultClick(perfume.id)}
                            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors text-left group/item"
                          >
                            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-secondary/20">
                              <img
                                src={perfume.imageUrl || '/placeholder.svg'}
                                alt={perfume.name}
                                className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{perfume.name}</p>
                              <p className="text-xs text-muted-foreground tracking-wide">{perfume.brand}</p>
                            </div>
                            {perfume.rating && (
                              <span className="text-xs font-bold shrink-0" style={{ color: 'hsl(var(--amber))' }}>
                                ★ {perfume.rating.toFixed(1)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      {filteredResults.length > 5 && (
                        <button
                          type="submit"
                          className="w-full py-3.5 text-center text-[11px] font-bold tracking-[0.15em] uppercase text-accent hover:bg-accent/5 border-t border-border/30 transition-colors"
                        >
                          {filteredResults.length} {t('search.results')} →
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      {t('common.notFound')} &ldquo;{query}&rdquo;
                      {genderFilter !== 'all' && (
                        <p className="text-xs mt-1.5 opacity-60">
                          {t('search.tryRemovingGenderFilter', { defaultValue: 'Try removing the gender filter' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Gender filter label — below pill */}
          {genderFilter !== 'all' && (
            <p className="relative z-0 mt-4 text-xs text-muted-foreground opacity-0 animate-fade-in">
              {t('search.filteringBy', { defaultValue: 'Filtering by' })}:{' '}
              <span className="font-semibold text-foreground">{t(`search.${genderFilter}`)}</span>
              {' · '}
              <button onClick={() => setGenderFilter('all')} className="text-accent hover:underline">
                {t('search.clearFilter', { defaultValue: 'Clear' })}
              </button>
            </p>
          )}

          {/* Trending search hints */}
          <div className={cn(
            'relative z-0 mt-8 flex flex-wrap justify-center items-center gap-2 opacity-0 animate-fade-in animation-delay-400',
            genderFilter !== 'all' && 'mt-3'
          )}>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/50 mr-1">
              {t('search.trending')}
            </span>
            {['Dior Sauvage', 'Vanilla', 'Oud', 'Chanel No. 5'].map((hint) => (
              <button
                key={hint}
                onClick={() => handleHintClick(hint)}
                className="text-xs px-3.5 py-1.5 rounded-full border border-border/50 text-foreground/60 hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all duration-200"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade into catalog section */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
