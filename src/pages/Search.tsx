import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { usePerfumeSearch } from '@/hooks/usePerfumeSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    // ALWAYS call hooks first, unconditionally
    const {
        data: perfumes = [],
        isLoading,
        error,
        status,
    } = usePerfumeSearch(query);

    console.log('🔍 Search component render:', {
        query,
        status,
        perfumesCount: Array.isArray(perfumes) ? perfumes.length : 0,
        error,
    });

    // Early return AFTER all hooks have been called
    if (!query) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground mb-2">
                            No search query
                        </p>
                        <p className="text-sm text-muted-foreground/70">
                            Enter a search term to find fragrances
                        </p>
                        <Link to="/">
                            <Button className="mt-6">Back to Home</Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link to="/">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to search
                        </Button>
                    </Link>
                    <h1 className="font-display text-3xl md:text-4xl font-medium">
                        Results for "{query}"
                    </h1>
                    {!isLoading &&
                        Array.isArray(perfumes) &&
                        perfumes.length > 0 && (
                            <p className="text-muted-foreground mt-2">
                                {perfumes.length}{' '}
                                {perfumes.length === 1
                                    ? 'fragrance'
                                    : 'fragrances'}{' '}
                                found
                            </p>
                        )}
                </div>

                {isLoading ? (
                    <div className="grid gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="flex gap-6 p-6 border border-border rounded-lg"
                            >
                                <Skeleton className="w-32 h-32 rounded-lg flex-shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-6 w-1/3" />
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <p className="text-lg text-destructive">
                            Error loading results
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            {error instanceof Error
                                ? error.message
                                : 'Please try again later'}
                        </p>
                    </div>
                ) : Array.isArray(perfumes) && perfumes.length > 0 ? (
                    <div className="grid gap-6">
                        {perfumes.map((perfume, index) => {
                            if (!perfume || typeof perfume !== 'object') {
                                console.warn('Invalid perfume data:', perfume);
                                return null;
                            }

                            return (
                                <Link
                                    key={perfume.id || index}
                                    to={`/perfume/${perfume.id}`}
                                    className="group opacity-0 animate-fade-in"
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        animationFillMode: 'forwards',
                                    }}
                                >
                                    <article className="flex flex-col md:flex-row gap-6 p-6 border border-border rounded-lg hover:border-accent/50 hover:shadow-lg transition-all duration-300 bg-card">
                                        <div className="w-full md:w-40 h-40 flex-shrink-0 overflow-hidden rounded-lg bg-secondary/20">
                                            <img
                                                src={
                                                    perfume.imageUrl ||
                                                    '/placeholder.svg'
                                                }
                                                alt={perfume.name || 'Perfume'}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                                                        {perfume.brand ||
                                                            'Unknown Brand'}
                                                    </p>
                                                    <h2 className="font-display text-xl md:text-2xl font-medium group-hover:text-accent transition-colors">
                                                        {perfume.name ||
                                                            'Unnamed'}
                                                    </h2>
                                                </div>
                                                {perfume.rating &&
                                                    typeof perfume.rating ===
                                                        'number' && (
                                                        <div className="flex items-center gap-1 px-2 py-1 bg-secondary/30 rounded-full flex-shrink-0">
                                                            <Star className="h-4 w-4 fill-accent text-accent" />
                                                            <span className="font-medium">
                                                                {perfume.rating.toFixed(
                                                                    1
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {perfume.gender && (
                                                    <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
                                                        {perfume.gender}
                                                    </span>
                                                )}
                                                {perfume.concentration && (
                                                    <span className="text-xs px-2 py-1 bg-muted rounded-full">
                                                        {perfume.concentration}
                                                    </span>
                                                )}
                                                {perfume.year &&
                                                    typeof perfume.year ===
                                                        'number' && (
                                                        <span className="text-xs px-2 py-1 bg-muted rounded-full">
                                                            {perfume.year}
                                                        </span>
                                                    )}
                                            </div>

                                            {/* Notes preview */}
                                            {perfume.notes &&
                                                typeof perfume.notes ===
                                                    'object' &&
                                                Array.isArray(
                                                    perfume.notes.top
                                                ) &&
                                                perfume.notes.top.length >
                                                    0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-medium text-accent">
                                                                Top:
                                                            </span>
                                                            {perfume.notes.top
                                                                .slice(0, 4)
                                                                .map(
                                                                    (
                                                                        note: string
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                note
                                                                            }
                                                                            className="text-xs text-muted-foreground"
                                                                        >
                                                                            {
                                                                                note
                                                                            }
                                                                        </span>
                                                                    )
                                                                )}
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Accords */}
                                            {Array.isArray(perfume.accords) &&
                                                perfume.accords.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {perfume.accords
                                                            .slice(0, 5)
                                                            .map(
                                                                (
                                                                    accord: string
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            accord
                                                                        }
                                                                        className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full"
                                                                    >
                                                                        {accord}
                                                                    </span>
                                                                )
                                                            )}
                                                    </div>
                                                )}
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground mb-2">
                            No fragrances found
                        </p>
                        <p className="text-sm text-muted-foreground/70">
                            Try a different search term or browse our collection
                        </p>
                        <Link to="/">
                            <Button className="mt-6">Back to Home</Button>
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
