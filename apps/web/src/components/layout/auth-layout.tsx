import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none mix-blend-screen"
        >
          <source src="/bg_video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(124,58,237,0.1)_0%,transparent_60%)]" />
      </div>

      <motion.div
        className="w-full max-w-md p-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white mx-auto mb-4">
            IT
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">ITSA Platform</h1>
          <p className="text-sm text-muted-foreground">Information Technology Students Association</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/50">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
