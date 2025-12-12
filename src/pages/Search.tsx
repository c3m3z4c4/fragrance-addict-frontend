import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { usePerfumeSearch } from '@/hooks/usePerfumeSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    // Always call hook - it handles disabled state internally
    const { data, isLoading, error } = usePerfumeSearch(query);

    // Early return for invalid query
    if (query.length < 2) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground mb-2">
                            No search query
                        </p>
                        <p className="text-sm text-muted-foreground/70">
                            Enter at least 2 characters to search
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

    // Loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <h1 className="font-display text-3xl md:text-4xl font-medium mb-8">
                        Searching...
                    </h1>
                    <div className="grid gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
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
                </main>
                <Footer />
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="text-center py-16">
                        <p className="text-lg text-destructive">
                            Error loading results
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            {error instanceof Error
                                ? error.message
                                : 'Please try again'}
                        </p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // No results
    if (!data || data.length === 0) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground mb-2">
                            No fragrances found
                        </p>
                        <p className="text-sm text-muted-foreground/70">
                            Try a different search
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

    // Results
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="font-display text-3xl md:text-4xl font-medium">
                        Results for "{query}"
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {data.length}{' '}
                        {data.length === 1 ? 'fragrance' : 'fragrances'} found
                    </p>
                </div>

                <div className="grid gap-6">
                    {data.map((perfume, index) => (
                        <Link
                            key={perfume.id}
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
                                                {perfume.brand || 'Unknown'}
                                            </p>
                                            <h2 className="font-display text-xl md:text-2xl font-medium group-hover:text-accent transition-colors">
                                                {perfume.name || 'Unnamed'}
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

                                    {perfume.notes &&
                                        perfume.notes.top &&
                                        perfume.notes.top.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-medium text-accent">
                                                        Top:
                                                    </span>
                                                    {perfume.notes.top
                                                        .slice(0, 4)
                                                        .map((note) => (
                                                            <span
                                                                key={note}
                                                                className="text-xs text-muted-foreground"
                                                            >
                                                                {note}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                    {perfume.accords &&
                                        perfume.accords.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {perfume.accords
                                                    .slice(0, 5)
                                                    .map((accord) => (
                                                        <span
                                                            key={accord}
                                                            className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full"
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
            </main>

            <Footer />
        </div>
    );
}
