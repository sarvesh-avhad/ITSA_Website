import { motion } from 'framer-motion';
import { Target, Lightbulb, Zap } from 'lucide-react';

const objectives = [
  {
    icon: <Target className="w-6 h-6 text-violet-400" />,
    title: 'Mission',
    description: 'To foster a culture of technical excellence and innovation among students by organizing workshops, hackathons, and industry interactions.'
  },
  {
    icon: <Lightbulb className="w-6 h-6 text-cyan-400" />,
    title: 'Vision',
    description: 'To become a premier student organization that bridges the gap between academic learning and industry requirements.'
  },
  {
    icon: <Zap className="w-6 h-6 text-emerald-400" />,
    title: 'Objectives',
    description: 'Provide a platform for skill development, networking, and collaborative learning to prepare students for the ever-evolving IT landscape.'
  }
];

export function AboutPreview() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2 
            className="text-4xl md:text-5xl font-black text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            About <span className="gradient-text">ITSA</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            We are the official departmental club of Information Technology. A hub where raw talent meets opportunities, and ideas transform into reality.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {objectives.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="liquid-glass rounded-3xl p-8 border border-white/5 relative group hover:-translate-y-2 transition-transform duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
