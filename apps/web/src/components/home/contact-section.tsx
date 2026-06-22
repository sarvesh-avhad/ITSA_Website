import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Send, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';

export function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will be connected to API
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section ref={ref} className="section-padding relative">
      <div className="absolute inset-0 bg-dots opacity-20" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 mb-4">
            Get in Touch
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Let's <span className="gradient-text">Connect</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have a question, want to sponsor an event, or just want to say hi?
            We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {[
              { icon: Mail, label: 'Email', value: 'itsa@college.edu', href: 'mailto:itsa@college.edu' },
              { icon: Phone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
              { icon: MapPin, label: 'Location', value: 'IT Department, Engineering College, Maharashtra, India', href: '#' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-start gap-4 p-5 rounded-2xl glass-card group"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600/20 transition-colors">
                  <item.icon size={18} className="text-violet-400" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-0.5">{item.label}</div>
                  <div className="text-white font-medium text-sm">{item.value}</div>
                </div>
              </a>
            ))}

            {/* Social Links */}
            <div className="p-5 rounded-2xl glass-card">
              <div className="text-sm text-muted-foreground mb-3">Follow Us</div>
              <div className="flex items-center gap-3">
                {['Instagram', 'LinkedIn', 'Twitter', 'GitHub'].map((platform) => (
                  <a
                    key={platform}
                    href="#"
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-violet-600/20 transition-all"
                    aria-label={platform}
                  >
                    <span className="text-xs font-bold">{platform[0]}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-white mb-2">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-white mb-2">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-white mb-2">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  placeholder="What's this about?"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-white mb-2">Message</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  placeholder="Tell us more..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-muted-foreground focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all outline-none text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all hover:scale-[1.01] btn-glow"
              >
                {submitted ? (
                  <>
                    <CheckCircle size={16} />
                    Message Sent!
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
