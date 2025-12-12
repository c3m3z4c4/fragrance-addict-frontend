import { useSearchParams } from 'react-router-dom';
import { usePerfumeSearch } from '@/hooks/usePerfumeSearch';

export function SearchDebug() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    console.log('🐛 SearchDebug render - query:', query);

    // Don't even try to use the hook if query is empty
    if (!query || query.length < 2) {
        return <div>No query or query too short: "{query}"</div>;
    }

    const hookResult = usePerfumeSearch(query);
    console.log('🐛 Hook result:', hookResult);

    return (
        <div>
            <h1>Debug Search</h1>
            <p>Query: {query}</p>
            <p>Status: {hookResult.status}</p>
            <p>Is Loading: {hookResult.isLoading}</p>
            <p>Is Error: {hookResult.isError}</p>
            <p>Data type: {typeof hookResult.data}</p>
            <p>Data is array: {Array.isArray(hookResult.data)}</p>
            <p>
                Data length:{' '}
                {Array.isArray(hookResult.data)
                    ? hookResult.data.length
                    : 'N/A'}
            </p>
            <pre>{JSON.stringify(hookResult.error, null, 2)}</pre>
        </div>
    );
}
