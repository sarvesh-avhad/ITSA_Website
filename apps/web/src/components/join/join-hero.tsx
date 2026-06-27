import { motion } from 'framer-motion';

interface JoinHeroProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export function JoinHero({ onGetStarted, onLearnMore }: JoinHeroProps) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-sm font-medium mb-8 border border-violet-500/20">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          500+ active members
        </span>
        
        <h1 
          className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] font-normal text-foreground mb-8"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Join ITSA
        </h1>
        
        <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Become part of a vibrant community of developers, learners, and innovators. 
          Connect, learn, and grow together!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold hover:from-violet-500 hover:to-violet-400 transition-all duration-300 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 btn-glow"
          >
            Get Started
          </button>
          <button
            onClick={onLearnMore}
            className="w-full sm:w-auto glass-card bg-white/5 border-white/10 rounded-full px-8 py-4 text-foreground font-semibold hover:bg-white/10 transition-all duration-300"
          >
            Learn More
          </button>
        </div>
      </motion.div>
    </section>
  );
}
