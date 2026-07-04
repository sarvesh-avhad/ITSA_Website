import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Target, Eye, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const { data: cmsData, isLoading } = useQuery({
    queryKey: ['public-cms'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/public');
      return res.data.data;
    }
  });

  return (
    <section ref={ref} className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dots opacity-30" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 mb-4">
            About Us
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Empowering Future{' '}
            <span className="gradient-text">Tech Leaders</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            ITSA is the official student association of the Information Technology Department,
            dedicated to fostering technical excellence, innovation, and collaboration.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {isLoading ? (
             <div className="md:col-span-3 flex justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
             </div>
          ) : [
            {
              icon: Eye,
              title: 'Our Vision',
              description: cmsData?.vision || 'To be the premier platform for IT students to innovate, learn, and grow into industry-ready professionals who lead technological transformation.',
              color: 'from-violet-500 to-purple-600',
              delay: 0.1,
            },
            {
              icon: Target,
              title: 'Our Mission',
              description: cmsData?.mission || 'To organize impactful technical events, provide hands-on learning opportunities, bridge the industry-academia gap, and build a vibrant community of tech enthusiasts.',
              color: 'from-cyan-500 to-blue-600',
              delay: 0.2,
            },
            {
              icon: Lightbulb,
              title: 'Objectives',
              description: cmsData?.objectives || 'Provide a platform for skill development, networking, and collaborative learning to prepare students for the ever-evolving IT landscape.',
              color: 'from-amber-500 to-orange-600',
              delay: 0.3,
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              className="glass-card rounded-2xl p-8 group"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: card.delay }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <card.icon size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium transition-colors group"
          >
            Learn more about ITSA
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
