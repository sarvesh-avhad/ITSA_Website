import { motion } from 'framer-motion';
import { Users, Calendar, Trophy, Handshake } from 'lucide-react';

const stats = [
  { id: 1, label: 'Student Members', value: '500+', icon: <Users /> },
  { id: 2, label: 'Technical Events', value: '50+', icon: <Calendar /> },
  { id: 3, label: 'Registrations', value: '3000+', icon: <Trophy /> },
  { id: 4, label: 'Industry Collaborations', value: '15+', icon: <Handshake /> }
];

export function StatsSection() {
  return (
    <section className="relative py-20 px-6 border-y border-white/5 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              <h4 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                {stat.value}
              </h4>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
