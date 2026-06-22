import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';

const sponsors = {
  gold: [
    { name: 'TechCorp India', logoUrl: 'https://placehold.co/320x120/1a1a2e/a78bfa?text=TechCorp&font=Inter', website: '#' },
  ],
  silver: [
    { name: 'Innovate Labs', logoUrl: 'https://placehold.co/280x100/1a1a2e/06b6d4?text=InnovateLabs&font=Inter', website: '#' },
  ],
  bronze: [
    { name: 'Cloud Nexus', logoUrl: 'https://placehold.co/240x90/1a1a2e/10b981?text=CloudNexus&font=Inter', website: '#' },
    { name: 'DevSphere', logoUrl: 'https://placehold.co/240x90/1a1a2e/f59e0b?text=DevSphere&font=Inter', website: '#' },
  ],
};

const tierConfig = {
  gold: { label: 'Gold Partners', gradient: 'from-amber-400 to-yellow-500', border: 'border-amber-500/20' },
  silver: { label: 'Silver Partners', gradient: 'from-gray-300 to-gray-400', border: 'border-gray-500/20' },
  bronze: { label: 'Bronze Partners', gradient: 'from-amber-600 to-orange-700', border: 'border-amber-600/20' },
};

export function SponsorsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="section-padding relative bg-surface/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(124,58,237,0.05)_0%,transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 mb-4">
            Our Partners
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Powered by <span className="gradient-text">Industry Leaders</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're proud to collaborate with organizations that share our vision of empowering the next generation of tech talent.
          </p>
        </motion.div>

        {/* Sponsor Tiers */}
        {(Object.keys(sponsors) as Array<keyof typeof sponsors>).map((tier, tierIndex) => (
          <motion.div
            key={tier}
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: tierIndex * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`h-px flex-1 bg-gradient-to-r ${tierConfig[tier].gradient} opacity-20`} />
              <span className={`text-sm font-semibold uppercase tracking-widest bg-gradient-to-r ${tierConfig[tier].gradient} bg-clip-text text-transparent`}>
                {tierConfig[tier].label}
              </span>
              <div className={`h-px flex-1 bg-gradient-to-l ${tierConfig[tier].gradient} opacity-20`} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              {sponsors[tier].map((sponsor, index) => (
                <motion.a
                  key={sponsor.name}
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative liquid-glass rounded-2xl p-8 flex items-center justify-center hover:scale-[1.03] transition-all duration-300 ${tierConfig[tier].border}`}
                  style={{ minWidth: tier === 'gold' ? '320px' : tier === 'silver' ? '280px' : '240px' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: tierIndex * 0.1 + index * 0.05 }}
                >
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="max-h-16 opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                  />
                  <ExternalLink
                    size={14}
                    className="absolute top-3 right-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </motion.a>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
