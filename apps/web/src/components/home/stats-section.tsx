import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

const stats = [
  { value: 500, suffix: '+', label: 'Active Members', description: 'Students and alumni' },
  { value: 50, suffix: '+', label: 'Events Hosted', description: 'Workshops, hackathons & more' },
  { value: 8, suffix: '+', label: 'Years of Legacy', description: 'Since our founding' },
  { value: 2000, suffix: '+', label: 'Alumni Network', description: 'Industry professionals' },
];

function AnimatedCounter({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      current = Math.min(Math.round(increment * frame), target);
      setCount(current);

      if (frame >= steps) {
        clearInterval(timer);
        setCount(target);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target, inView]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background gradient bar */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-transparent to-cyan-500/5" />
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center relative"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* Glow */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-violet-600/10 blur-2xl" />

              <div className="relative">
                <div className="text-5xl sm:text-6xl font-black gradient-text mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={isInView} />
                </div>
                <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>

              {/* Divider (not on last) */}
              {index < stats.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
