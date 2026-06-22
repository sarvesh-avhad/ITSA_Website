import { motion } from 'framer-motion';
import { Target, Eye, Award, Users, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const stats = [
  { label: 'Active Members', value: '500+' },
  { label: 'Events Hosted', value: '150+' },
  { label: 'Hackathons Won', value: '25+' },
  { label: 'Alumni Network', value: '2000+' },
];

const team = [
  { name: 'Dr. Sarah Connor', role: 'Faculty Advisor', image: 'https://placehold.co/400x400/1a1a2e/7c3aed?text=SC' },
  { name: 'John Doe', role: 'President', image: 'https://placehold.co/400x400/1a1a2e/06b6d4?text=JD' },
  { name: 'Jane Smith', role: 'Vice President', image: 'https://placehold.co/400x400/1a1a2e/10b981?text=JS' },
  { name: 'Mike Ross', role: 'Technical Head', image: 'https://placehold.co/400x400/1a1a2e/f59e0b?text=MR' },
  { name: 'Rachel Zane', role: 'Events Head', image: 'https://placehold.co/400x400/1a1a2e/ec4899?text=RZ' },
  { name: 'Harvey Specter', role: 'PR Head', image: 'https://placehold.co/400x400/1a1a2e/6366f1?text=HS' },
];

import { SEO } from '@/components/seo';

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pt-28 pb-20 overflow-hidden">
      <SEO title="About Us" description="Learn about the Information Technology Students Association (ITSA) and our mission to empower tech leaders." />
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center mb-24 mt-8 relative">
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
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 mb-6">
              Who We Are
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-[1.1]">
              Empowering the Next Generation of <br className="hidden lg:block" />
              <span className="gradient-text">Tech Leaders</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              The Information Technology Students Association (ITSA) is the premier student body 
              dedicated to fostering innovation, technical excellence, and professional growth.
            </p>
          </motion.div>
        </div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Eye size={120} />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center mb-6 relative z-10">
              <Eye size={28} className="text-violet-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Our Vision</h2>
            <p className="text-lg text-muted-foreground leading-relaxed relative z-10">
              To be recognized globally as a center of excellence in Information Technology, 
              producing technically proficient, ethically strong, and socially responsible 
              professionals who can adapt to the ever-evolving tech landscape.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target size={120} />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 relative z-10">
              <Target size={28} className="text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed relative z-10">
              To bridge the gap between academia and industry by organizing hands-on workshops, 
              competitive hackathons, and seminars. We strive to build a community where students 
              collaborate, innovate, and excel.
            </p>
          </motion.div>
        </div>

        {/* Core Values */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">The principles that guide our community and drive our initiatives.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Innovation', desc: 'Encouraging creative problem solving and out-of-the-box thinking in every project.' },
              { title: 'Collaboration', desc: 'Building strong networks and learning through teamwork and shared experiences.' },
              { title: 'Excellence', desc: 'Striving for the highest quality in code, design, and professional conduct.' }
            ].map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass border border-white/5 rounded-2xl p-8 hover:bg-white/[0.02] transition-colors"
              >
                <CheckCircle2 size={24} className="text-violet-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card rounded-3xl p-12 mb-24 border-violet-500/20 bg-violet-900/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center px-4"
              >
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Meet the Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">The dedicated individuals working tirelessly behind the scenes.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group text-center"
              >
                <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white/10 group-hover:border-violet-500/50 transition-colors">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-violet-400 font-medium">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Want to be a part of ITSA?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth/register" className="btn-glow px-8 py-4 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-500 transition-colors">
              Join as a Member
            </Link>
            <Link to="/contact" className="px-8 py-4 glass border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
