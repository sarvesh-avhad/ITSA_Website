import { HeroSection } from '@/components/home/hero-section';
import { StatsSection } from '@/components/home/stats-section';
import { SEO } from '@/components/seo';

export default function HomePage() {
  return (
    <>
      <SEO />
      <HeroSection />
      <StatsSection />
    </>
  );
}
