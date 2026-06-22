import { HeroSection } from '@/components/home/hero-section';
import { AboutPreview } from '@/components/home/about-preview';
import { StatsSection } from '@/components/home/stats-section';
import { UpcomingEvents } from '@/components/home/upcoming-events';
import { CommitteePreview } from '@/components/home/committee-preview';
import { SponsorsSection } from '@/components/home/sponsors-section';
import { Testimonials } from '@/components/home/testimonials';
import { SEO } from '@/components/seo';

export default function HomePage() {
  return (
    <>
      <SEO />
      <HeroSection />
      <AboutPreview />
      <StatsSection />
      <UpcomingEvents />
      <CommitteePreview />
      <Testimonials />
      <SponsorsSection />
    </>
  );
}
