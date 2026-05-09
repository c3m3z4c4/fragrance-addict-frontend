import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Search, Menu, X, LogIn, LogOut, Key, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { cn } from '@/lib/utils';

interface HeaderProps {
    onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps = {}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { favoritesCount } = useFavorites();
    const { user, isAdmin, logout } = useAuth();
    const isLoggedIn = !!user;
    const isGmailUser = isLoggedIn && (user?.provider === 'google' || user?.email?.toLowerCase().endsWith('@gmail.com'));
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinks = [
        { href: '/', label: t('nav.home') },
        ...(isLoggedIn ? [{ href: '/favorites', label: t('nav.favorites') }] : []),
        { href: '/brands', label: t('nav.brands') },
        { href: '/about', label: t('nav.about') },
        ...(isGmailUser ? [{ href: '/recommendations', label: t('nav.aiRecommendations', { defaultValue: '✨ AI' }) }] : []),
        ...(isAdmin ? [{ href: '/admin', label: t('nav.admin') }] : []),
    ];

    return (
        <header
            className={cn(
                'sticky top-0 z-50 transition-all duration-500',
                scrolled
                    ? 'bg-background/96 backdrop-blur-md border-b border-border shadow-sm'
                    : 'bg-background/75 backdrop-blur-sm border-b border-transparent'
            )}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16 md:h-[72px]">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <span className="font-display text-xl md:text-2xl font-semibold tracking-widest uppercase">
                            Parfum<span className="text-accent">ería</span>
                        </span>
                        <span className="hidden md:block h-1.5 w-1.5 rounded-full bg-accent mb-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-7">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={cn(
                                    'text-[11px] font-bold tracking-[0.18em] uppercase transition-all duration-300 relative pb-0.5',
                                    'after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full',
                                    location.pathname === link.href
                                        ? 'text-accent after:w-full'
                                        : 'text-foreground/55 hover:text-foreground'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-1 md:gap-1.5">
                        <LanguageSelector />

                        {onSearchClick ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onSearchClick}
                                className="hover:text-accent"
                                title={t('common.search')}
                            >
                                <Search className="h-[18px] w-[18px]" />
                            </Button>
                        ) : (
                            <Link to="/">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:text-accent"
                                    title={t('common.search')}
                                >
                                    <Search className="h-[18px] w-[18px]" />
                                </Button>
                            </Link>
                        )}

                        {isLoggedIn && (
                            <Link to="/favorites">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative hover:text-accent"
                                    title={t('nav.favorites')}
                                >
                                    <Heart className="h-[18px] w-[18px]" />
                                    {favoritesCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">
                                            {favoritesCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                        )}

                        {isLoggedIn ? (
                            <div className="hidden md:flex items-center gap-1">
                                <Link to="/profile">
                                    <Button variant="ghost" size="icon" className="hover:text-accent" title="Profile">
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.name ?? ''} className="h-6 w-6 rounded-full object-cover" />
                                        ) : (
                                            <UserCircle className="h-[18px] w-[18px]" />
                                        )}
                                    </Button>
                                </Link>
                                {isAdmin && (
                                    <Link to="/api-keys">
                                        <Button variant="ghost" size="icon" className="hover:text-accent" title={t('nav.apiKeys')}>
                                            <Key className="h-[18px] w-[18px]" />
                                        </Button>
                                    </Link>
                                )}
                                <Button variant="ghost" size="icon" onClick={logout} className="hover:text-accent" title={t('login.logout')}>
                                    <LogOut className="h-[18px] w-[18px]" />
                                </Button>
                            </div>
                        ) : (
                            <Link to="/login" className="hidden md:block">
                                <Button variant="ghost" size="icon" className="hover:text-accent" title={t('login.title')}>
                                    <LogIn className="h-[18px] w-[18px]" />
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <nav className="md:hidden py-6 border-t border-border space-y-0.5 animate-fade-in">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    'block py-3 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors',
                                    location.pathname === link.href
                                        ? 'text-accent'
                                        : 'text-foreground/55 hover:text-foreground'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {isLoggedIn ? (
                            <>
                                <Link to="/profile" onClick={() => setIsMenuOpen(false)}
                                    className="block py-3 text-[11px] font-bold tracking-[0.18em] uppercase text-foreground/55 hover:text-foreground transition-colors">
                                    Profile
                                </Link>
                                {isAdmin && (
                                    <Link to="/api-keys" onClick={() => setIsMenuOpen(false)}
                                        className="block py-3 text-[11px] font-bold tracking-[0.18em] uppercase text-foreground/55 hover:text-foreground transition-colors">
                                        {t('nav.apiKeys')}
                                    </Link>
                                )}
                                <button onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="block py-3 text-[11px] font-bold tracking-[0.18em] uppercase text-foreground/55 hover:text-foreground transition-colors w-full text-left">
                                    {t('login.logout')}
                                </button>
                            </>
                        ) : (
                            <Link to="/login" onClick={() => setIsMenuOpen(false)}
                                className="block py-3 text-[11px] font-bold tracking-[0.18em] uppercase text-foreground/55 hover:text-foreground transition-colors">
                                {t('login.title')}
                            </Link>
                        )}
                    </nav>
                )}
            </div>
        </header>
    );
}
