import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans">
      {/* Navigation Bar */}
      <nav className="relative z-10 flex flex-row items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <img src="/ITSA_logo.png" alt="ITSA Logo" className="h-10 w-auto object-contain" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm text-foreground transition-colors">
            Home
          </Link>
          <Link to="/studio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Studio
          </Link>
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link to="/journal" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Journal
          </Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Reach Us
          </Link>
        </div>

        <Link to="/events" className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03] transition-transform cursor-pointer">
          Begin Journey
        </Link>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-32 pb-40 py-[90px] flex-1">
        <h1 
          className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal text-foreground animate-fade-rise"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Where <em className="not-italic text-muted-foreground">dreams</em> rise <em className="not-italic text-muted-foreground">through the silence.</em>
        </h1>
        
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
          We're designing tools for deep thinkers, bold creators, and quiet rebels. 
          Amid the chaos, we build digital spaces for sharp focus and inspired work.
        </p>

        <Link to="/events" className="liquid-glass rounded-full px-14 py-5 text-base text-foreground mt-12 hover:scale-[1.03] transition-transform cursor-pointer animate-fade-rise-delay-2 inline-flex items-center justify-center">
          Begin Journey
        </Link>
      </div>
    </div>
  );
}
