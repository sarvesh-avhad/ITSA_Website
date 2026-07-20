import { Link } from 'react-router-dom';
import { useSiteConfig } from '@/hooks/use-site-config';

export function HeroSection() {
  const { data: config } = useSiteConfig();

  const heroTitle = config?.hero_title || 'Information Technology Students Association.';
  const heroSubtitle = config?.hero_subtitle || 'Information Technology Students Association (ITSA) is a student-led community dedicated to innovation, technical excellence, leadership, and industry engagement.';

  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans overflow-hidden">
      {config?.hero_video_url && (
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40 mix-blend-screen"
          >
            <source src={config.hero_video_url} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40 py-[90px] flex-1">
        <h1 
          className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal text-foreground animate-fade-rise"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {heroTitle}
        </h1>
        
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
          {heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 animate-fade-rise-delay-2">
          <Link to="/events" className="liquid-glass rounded-full px-10 py-4 text-base text-foreground hover:scale-[1.03] transition-transform cursor-pointer inline-flex items-center justify-center">
            Explore Events
          </Link>
          <Link to="/gallery" className="glass-card bg-white/5 border-white/10 rounded-full px-10 py-4 text-base text-foreground hover:bg-white/10 hover:scale-[1.03] transition-all cursor-pointer inline-flex items-center justify-center">
            View Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}
