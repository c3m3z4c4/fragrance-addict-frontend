import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block">
              <h3 className="font-display text-2xl font-semibold mb-4">
                Parfum<span className="text-accent">ería</span>
              </h3>
            </Link>
            <p className="text-primary-foreground/70 max-w-md leading-relaxed">
              Discover the world's finest fragrances. Our curated collection features luxury perfumes 
              from the most prestigious houses, each one a masterpiece of olfactory art.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-2">
              {['New Arrivals', 'Best Sellers', 'Brands', 'About Us'].map((item) => (
                <li key={item}>
                  <Link
                    to="/"
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>hello@parfumeria.com</li>
              <li>+1 (555) 123-4567</li>
              <li className="pt-2">
                New York, Paris, Milan
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/50">
            © 2024 Parfumería. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/50">
            <Link to="/" className="hover:text-accent transition-colors">Privacy</Link>
            <Link to="/" className="hover:text-accent transition-colors">Terms</Link>
            <Link to="/" className="hover:text-accent transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
