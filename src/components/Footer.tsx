import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function StarOrnament({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" />
    </svg>
  );
}

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative bg-foreground text-primary-foreground overflow-hidden">

      {/* Decorative curved arc at top — subtle depth */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden h-16 opacity-[0.05]">
        <svg viewBox="0 0 1200 80" fill="none" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none" className="w-full h-full">
          <path d="M0 80 Q600 0 1200 80" stroke="currentColor" strokeWidth="1" />
          <path d="M0 80 Q600 20 1200 80" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Top ornament divider */}
      <div className="flex items-center justify-center pt-14 pb-0">
        <div className="h-px w-24 bg-primary-foreground/15" />
        <StarOrnament className="h-3 w-3 mx-4 fill-primary-foreground/20" />
        <div className="h-px w-24 bg-primary-foreground/15" />
      </div>

      <div className="container mx-auto px-4 pt-12 pb-10 md:pt-14 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-5 group">
              <span className="font-display text-2xl font-semibold tracking-widest uppercase">
                Parfum<span className="text-accent">ería</span>
              </span>
            </Link>
            <p className="text-primary-foreground/45 max-w-sm leading-relaxed text-sm">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-[10px] uppercase tracking-[0.22em] text-primary-foreground/35 mb-5">
              {t('footer.explore')}
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/',          label: t('nav.home') },
                { to: '/brands',    label: t('nav.brands') },
                { to: '/favorites', label: t('nav.favorites') },
                { to: '/about',     label: t('nav.about') },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-xs tracking-wide text-primary-foreground/45 hover:text-accent transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-display text-[10px] uppercase tracking-[0.22em] text-primary-foreground/35 mb-5">
              {t('footer.information')}
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: t('footer.terms') },
                { to: '/', label: t('footer.privacy') },
                { to: '/', label: t('footer.contact') },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-xs tracking-wide text-primary-foreground/45 hover:text-accent transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-primary-foreground/25 tracking-wide">
            © {new Date().getFullYear()} Parfumería. {t('footer.copyright')}
          </p>
          {/* Decorative accent rule */}
          <div className="flex items-center gap-1.5 opacity-30">
            <div className="h-px w-8 bg-accent" />
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </footer>
  );
}
