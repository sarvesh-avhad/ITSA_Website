import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const tierConfig = {
  gold: { label: 'Gold Partners', gradient: 'from-amber-400 to-yellow-500', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
  silver: { label: 'Silver Partners', gradient: 'from-gray-300 to-gray-400', border: 'border-gray-500/20', bg: 'bg-gray-500/5' },
  bronze: { label: 'Bronze Partners', gradient: 'from-amber-600 to-orange-700', border: 'border-amber-600/20', bg: 'bg-amber-600/5' },
};

export default function SponsorsPage() {
  const { data: sponsorsResponse, isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      const res = await apiClient.get('/sponsors');
      return res.data.data;
    },
  });

  const sponsors = sponsorsResponse || [];

  // Group by tier
  const grouped = {
    gold: sponsors.filter((s: any) => s.tier === 'GOLD'),
    silver: sponsors.filter((s: any) => s.tier === 'SILVER'),
    bronze: sponsors.filter((s: any) => s.tier === 'BRONZE'),
  };

  const handleSponsorClick = (id: string) => {
    // Fire & forget analytics tracking
    apiClient.post(`/sponsors/${id}/click`).catch(() => {});
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.1)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Our <span className="gradient-text">Partners</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            We are immensely grateful to the industry leaders who support our vision and make our events possible.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-24">
            {(Object.keys(grouped) as Array<keyof typeof grouped>).map((tier) => {
              if (grouped[tier].length === 0) return null;
              
              const config = tierConfig[tier];
              
              return (
                <div key={tier}>
                  {/* Tier Divider */}
                  <div className="flex items-center gap-4 mb-10">
                    <div className={`h-px flex-1 bg-gradient-to-r ${config.gradient} opacity-30`} />
                    <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-widest bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                      {config.label}
                    </h2>
                    <div className={`h-px flex-1 bg-gradient-to-l ${config.gradient} opacity-30`} />
                  </div>

                  {/* Sponsors Grid */}
                  <div className={`grid gap-6 ${tier === 'gold' ? 'md:grid-cols-2' : tier === 'silver' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                    {grouped[tier].map((sponsor: any, index: number) => (
                      <motion.a
                        key={sponsor.id}
                        href={sponsor.websiteUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleSponsorClick(sponsor.id)}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`group block glass-card rounded-2xl p-8 border hover:scale-[1.02] transition-all duration-300 relative overflow-hidden ${config.border} ${config.bg}`}
                      >
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <ExternalLink size={16} className="absolute top-4 right-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="aspect-video flex items-center justify-center mb-6">
                          <img
                            src={sponsor.logoUrl}
                            alt={sponsor.name}
                            className="max-w-full max-h-full object-contain filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                            loading="lazy"
                          />
                        </div>

                        <div className="text-center relative z-10">
                          <h3 className="text-xl font-bold text-white mb-2">{sponsor.name}</h3>
                          {sponsor.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{sponsor.description}</p>
                          )}
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-32 text-center glass-card rounded-3xl p-12 max-w-4xl mx-auto border-violet-500/20 bg-violet-950/10">
          <h2 className="text-3xl font-bold text-white mb-4">Want to partner with us?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Connect with top engineering talent and showcase your brand to thousands of future tech professionals.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg shadow-xl shadow-violet-600/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all btn-glow"
          >
            Become a Sponsor
          </a>
        </div>
      </div>
    </div>
  );
}
