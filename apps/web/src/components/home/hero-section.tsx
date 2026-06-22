import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans">

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40 py-[90px] flex-1">
        <h1 
          className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal text-foreground animate-fade-rise"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Empowering <em className="not-italic text-muted-foreground">Innovation</em> Through <em className="not-italic text-muted-foreground">Technology.</em>
        </h1>
        
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
          Information Technology Students Association (ITSA) is a student-led community dedicated to innovation, technical excellence, leadership, and industry engagement.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 animate-fade-rise-delay-2">
          <Link to="/events" className="liquid-glass rounded-full px-10 py-4 text-base text-foreground hover:scale-[1.03] transition-transform cursor-pointer inline-flex items-center justify-center">
            Explore Events
          </Link>
          <Link to="/auth/register" className="glass-card bg-white/5 border-white/10 rounded-full px-10 py-4 text-base text-foreground hover:bg-white/10 hover:scale-[1.03] transition-all cursor-pointer inline-flex items-center justify-center">
            Join ITSA
          </Link>
        </div>
      </div>
    </div>
  );
}
