import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { MessageCircle, Instagram, Linkedin, Facebook } from 'lucide-react';
import { siteConfig } from '@/config/site';

const platforms = [
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    description: 'Get event updates and announcements on WhatsApp.',
    icon: MessageCircle,
    url: siteConfig.socials.whatsappCommunity,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    hoverBg: 'hover:bg-emerald-500',
    buttonText: 'Join Now \u2192'
  },
  {
    id: 'instagram',
    title: 'Instagram',
    description: 'Follow us for event highlights and behind the scenes.',
    icon: Instagram,
    url: siteConfig.socials.instagram,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    hoverBg: 'hover:bg-pink-500',
    buttonText: 'Follow Us \u2192'
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    description: 'Follow us on LinkedIn for professional networking.',
    icon: Linkedin,
    url: siteConfig.socials.linkedin,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    hoverBg: 'hover:bg-blue-500',
    buttonText: 'Connect \u2192'
  },
  {
    id: 'facebook',
    title: 'Facebook',
    description: 'Join our Facebook community for discussions.',
    icon: Facebook,
    url: siteConfig.socials.facebook,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    hoverBg: 'hover:bg-indigo-500',
    buttonText: 'Follow \u2192'
  }
].filter(p => p.url && p.url.trim() !== '');

export const ChoosePlatform = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="py-24 px-6 relative bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            Choose Your Platform
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Connect with us on your preferred platform and join thousands of developers
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, idx) => (
            <motion.a
              key={platform.id}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`group flex flex-col items-center text-center glass-card rounded-2xl p-8 border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${platform.bg} mb-6 transition-transform duration-300 group-hover:scale-110`}>
                <platform.icon className={platform.color} size={36} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{platform.title}</h3>
              <p className="text-muted-foreground mb-8 flex-1">
                {platform.description}
              </p>
              <div className={`w-full py-3 rounded-xl bg-white/5 text-white font-medium transition-colors ${platform.hoverBg} group-hover:text-white`}>
                {platform.buttonText}
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
});

ChoosePlatform.displayName = 'ChoosePlatform';
