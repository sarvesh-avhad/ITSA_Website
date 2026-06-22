import { SEO } from '@/components/seo';
import { motion } from 'framer-motion';
import { ArrowLeft, MonitorPlay } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudioPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-28 pb-20 overflow-hidden px-6">
      <SEO title="Studio" description="Welcome to the ITSA Studio." />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16 mt-8 relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
              ITSA <span className="gradient-text">Studio</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our creative space is currently under construction. Check back later for awesome content!
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="flex justify-center mt-20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="liquid-glass rounded-3xl p-16 flex flex-col items-center justify-center border-violet-500/20 max-w-md w-full text-center">
            <MonitorPlay size={64} className="text-violet-400 mb-6 opacity-80" />
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-muted-foreground">We are preparing something amazing.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
