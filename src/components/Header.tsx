import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { favoritesCount } = useFavorites();
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Catalog' },
    { href: '/favorites', label: 'Favorites' },
    { href: '/brands', label: 'Brands' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl md:text-2xl font-semibold tracking-wide">
              Parfum<span className="text-accent">ería</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors hover:text-accent relative",
                  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full",
                  location.pathname === link.href ? "text-accent after:w-full" : "text-foreground/70"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {onSearchClick ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSearchClick}
                className="hover:text-accent"
              >
                <Search className="h-5 w-5" />
              </Button>
            ) : (
              <Link to="/">
                <Button variant="ghost" size="icon" className="hover:text-accent">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <Link to="/favorites">
              <Button variant="ghost" size="icon" className="relative hover:text-accent">
                <Heart className="h-5 w-5" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
                    {favoritesCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "block py-3 text-sm font-medium tracking-wide transition-colors",
                  location.pathname === link.href ? "text-accent" : "text-foreground/70"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
