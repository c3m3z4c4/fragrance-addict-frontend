import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchHero } from '@/components/SearchHero';
import { TrendingPerfumes } from '@/components/TrendingPerfumes';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <SearchHero />

      <main className="flex-1">
        <TrendingPerfumes />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
