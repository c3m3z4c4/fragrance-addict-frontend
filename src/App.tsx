import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Index from './pages/Index';
import PerfumeDetail from './pages/PerfumeDetail';
import Favorites from './pages/Favorites';
import Brands from './pages/Brands';
import BrandDetail from './pages/BrandDetail';
import About from './pages/About';
import Search from './pages/Search';
import { SearchDebug } from './pages/SearchDebug';
import Admin from './pages/Admin';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import { ApiKeys } from './pages/ApiKeys';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
            retry: 1,
            retryDelay: (attemptIndex) =>
                Math.min(1000 * 2 ** attemptIndex, 30000),
        },
    },
});

const LoadingSpinner = () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
);

// Requires any authenticated user (USER or SUPERADMIN)
function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    if (isLoading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

// Requires SUPERADMIN
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAdmin, isLoading } = useAuth();
    if (isLoading) return <LoadingSpinner />;
    if (!isAdmin) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/search-debug" element={<SearchDebug />} />
            <Route path="/perfume/:id" element={<PerfumeDetail />} />
            <Route
                path="/favorites"
                element={
                    <RequireAuth>
                        <Favorites />
                    </RequireAuth>
                }
            />
            <Route path="/brands" element={<Brands />} />
            <Route path="/brands/:brand" element={<BrandDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
                path="/api-keys"
                element={
                    <ProtectedRoute>
                        <ApiKeys />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <Admin />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <AuthProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
