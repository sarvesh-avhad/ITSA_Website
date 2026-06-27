import { useRef, useEffect } from 'react';
import { SEO } from '@/components/seo';
import { JoinHero } from '@/components/join/join-hero';
import { WhyJoin } from '@/components/join/why-join';
import { ChoosePlatform } from '@/components/join/choose-platform';

export default function JoinItsaPage() {
  const whyJoinRef = useRef<HTMLElement>(null);
  const choosePlatformRef = useRef<HTMLElement>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToWhyJoin = () => {
    whyJoinRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToChoosePlatform = () => {
    choosePlatformRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <SEO 
        title="Join ITSA - Information Technology Students Association"
        description="Become a part of the Information Technology Students Association community. Connect, learn, and grow together."
      />
      <div className="relative min-h-screen bg-transparent text-foreground font-sans pt-18">
        <JoinHero 
          onGetStarted={scrollToChoosePlatform} 
          onLearnMore={scrollToWhyJoin} 
        />
        <WhyJoin ref={whyJoinRef} />
        <ChoosePlatform ref={choosePlatformRef} />
      </div>
    </>
  );
}
