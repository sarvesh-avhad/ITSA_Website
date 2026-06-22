import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "Being part of ITSA completely transformed my college experience. The hackathons gave me practical skills I couldn't learn in a classroom.",
    author: "Aditi Sharma",
    role: "TE IT Student"
  },
  {
    quote: "The Code-O-Fiesta event organized by ITSA is the highlight of the year. It's incredibly well-managed and competitive.",
    author: "Rahul Verma",
    role: "BE IT Student"
  },
  {
    quote: "As a junior, the tech talk series gave me a clear roadmap for my career in Web Development and AI.",
    author: "Sneha Patel",
    role: "SE IT Student"
  }
];

export function Testimonials() {
  return (
    <section className="relative py-32 px-6 border-t border-white/5 bg-black/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl md:text-5xl font-black text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Student <span className="gradient-text">Voices</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="liquid-glass rounded-3xl p-8 border border-white/5 relative group"
            >
              <Quote className="w-10 h-10 text-violet-500/20 absolute top-6 right-6" />
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 relative z-10">
                "{item.quote}"
              </p>
              <div>
                <h4 className="text-white font-bold">{item.author}</h4>
                <p className="text-sm text-violet-400 font-medium uppercase tracking-wider mt-1">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
