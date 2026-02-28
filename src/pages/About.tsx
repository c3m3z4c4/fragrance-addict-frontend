import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchModal } from '@/components/SearchModal';
import { fetchAboutContent, type AboutContent } from '@/lib/api';

const DEFAULT_CONTENT: AboutContent = {
  hero: {
    eyebrow: 'About Parfumería',
    title: 'The Poetry of',
    titleAccent: 'Scent',
    subtitle:
      'We believe that fragrance is one of the most intimate and powerful forms of self-expression. Our mission is to connect you with the world\'s finest perfumes, each one a masterpiece of olfactory artistry.',
  },
  story: {
    title: 'Our Story',
    paragraphs: [
      'Founded by passionate fragrance enthusiasts, Parfumería began as a dream to create the ultimate destination for perfume lovers. We spent years traveling the world, visiting legendary perfume houses, meeting master perfumers, and curating a collection that represents the pinnacle of fragrance craftsmanship.',
      'Today, our catalog features hundreds of carefully selected fragrances from the most prestigious brands. Each perfume in our collection has been personally evaluated for its quality, creativity, and ability to evoke emotion.',
      'We\'re more than just a catalog—we\'re a community of scent enthusiasts dedicated to helping you discover your signature fragrance.',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1595535873420-a599195b3f4a?w=800',
    imageAlt: 'Perfume craftsmanship',
  },
  values: {
    title: 'Our Values',
    items: [
      { title: 'Authenticity', description: 'Every fragrance in our collection is 100% authentic, sourced directly from authorized distributors.' },
      { title: 'Expertise', description: 'Our team includes certified fragrance specialists who can guide you to your perfect scent.' },
      { title: 'Passion', description: 'We\'re driven by a genuine love for perfumery and a desire to share that passion with you.' },
    ],
  },
};

const About = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['about-content'],
    queryFn: fetchAboutContent,
    staleTime: 5 * 60 * 1000,
  });

  const c = data ?? DEFAULT_CONTENT;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-background to-background" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4">
                {c.hero.eyebrow}
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium mb-6">
                {c.hero.title} <span className="italic text-accent">{c.hero.titleAccent}</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {c.hero.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="opacity-0 animate-fade-in-left" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <h2 className="font-display text-2xl md:text-3xl mb-6">{c.story.title}</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {c.story.paragraphs.map((p, i) => p && <p key={i}>{p}</p>)}
              </div>
            </div>
            <div
              className="aspect-[4/5] rounded-lg overflow-hidden bg-muted opacity-0 animate-fade-in-right"
              style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
            >
              <img
                src={c.story.imageUrl}
                alt={c.story.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-foreground text-primary-foreground py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl md:text-3xl text-center mb-12">{c.values.title}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {c.values.items.map((value, index) => (
                <div
                  key={value.title || index}
                  className="text-center opacity-0 animate-fade-in"
                  style={{ animationDelay: `${300 + index * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <h3 className="font-display text-xl mb-4 text-accent">{value.title}</h3>
                  <p className="text-primary-foreground/70 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
