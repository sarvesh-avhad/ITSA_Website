import { motion } from 'framer-motion';
import { BookOpen, Users, Award, Briefcase, Code, Terminal } from 'lucide-react';
import { forwardRef } from 'react';

const features = [
  {
    icon: BookOpen,
    title: 'Technical Workshops',
    description: 'Hands-on learning from industry experts.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20'
  },
  {
    icon: Terminal,
    title: 'Coding Competitions',
    description: 'Compete in DSA, Hackathons and Programming contests.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20'
  },
  {
    icon: Code,
    title: 'Real Projects',
    description: 'Work on real technical projects and build your portfolio.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20'
  },
  {
    icon: Award,
    title: 'Leadership Opportunities',
    description: 'Become a Team Lead, Event Coordinator or Club Executive.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20'
  },
  {
    icon: Users,
    title: 'Networking',
    description: 'Connect with seniors, alumni and industry professionals.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20'
  },
  {
    icon: Briefcase,
    title: 'Placement Preparation',
    description: 'Resume reviews, mock interviews and placement guidance.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20'
  }
];

export const WhyJoin = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            Why Join <span className="gradient-text">ITSA?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Unlock amazing opportunities and grow your tech career
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card rounded-2xl p-8 border ${feature.border} hover:bg-white/[0.02] transition-colors`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bg} mb-6`}>
                <feature.icon className={feature.color} size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

WhyJoin.displayName = 'WhyJoin';
