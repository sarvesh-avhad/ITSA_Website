import { motion } from 'framer-motion';
import { Target, Eye, Award, CheckCircle2, ArrowLeft, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/seo';

const timeline = [
  { year: '2022', title: 'ITSA Inception', desc: 'The Information Technology Students Association was founded to bridge the gap between curriculum and industry.' },
  { year: '2023', title: 'First Hackathon', desc: 'Successfully hosted our first state-level hackathon with over 500 participants.' },
  { year: '2024', title: 'Industry Ties', desc: 'Partnered with major tech corporations to provide internships and industrial visits.' },
  { year: '2025', title: 'Tech Symposium', desc: 'Launched our flagship annual Tech Symposium featuring national speakers and competitions.' },
  { year: '2026', title: 'Going Global', desc: 'Expanding our reach through virtual global events and international student collaborations.' }
];

const faculty = [
  { name: 'Dr. Jane Smith', role: 'Head of Department (IT)', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
  { name: 'Prof. John Doe', role: 'Faculty Coordinator', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
];

const committee = [
  { name: 'Sarah Williams', role: 'President', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400' },
  { name: 'Michael Chen', role: 'Vice President', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Aisha Patel', role: 'Secretary', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
  { name: 'David Kim', role: 'Treasurer', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
  { name: 'Priya Sharma', role: 'Technical Head', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
  { name: 'Arjun Singh', role: 'Marketing Head', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400' },
];

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pt-28 pb-20 overflow-hidden">
      <SEO title="About ITSA" description="Learn about the Information Technology Students Association (ITSA) and our mission to empower tech leaders." />
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
              Department of IT
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-[1.1]">
              About <span className="gradient-text">ITSA</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              The Information Technology Students Association (ITSA) is the premier student body 
              dedicated to fostering innovation, technical excellence, and professional growth.
            </p>
          </motion.div>
        </div>

        {/* Vision, Mission & Objectives */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-10 relative overflow-hidden group border-cyan-500/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 relative z-10">
              <Eye size={28} className="text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Our Vision</h2>
            <p className="text-lg text-muted-foreground leading-relaxed relative z-10">
              To be recognized globally as a center of excellence in Information Technology, 
              producing technically proficient, ethically strong, and socially responsible professionals.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-10 relative overflow-hidden group border-violet-500/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center mb-6 relative z-10">
              <Target size={28} className="text-violet-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed relative z-10">
              To bridge the gap between academia and industry by organizing hands-on workshops, 
              competitive hackathons, and seminars. We strive to build a community of innovators.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-10 relative overflow-hidden group border-emerald-500/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 relative z-10">
              <Award size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Objectives</h2>
            <p className="text-lg text-muted-foreground leading-relaxed relative z-10">
              To provide a platform for skill development, networking, and collaborative learning to prepare students for the ever-evolving IT landscape.
            </p>
          </motion.div>
        </div>

        {/* Timeline */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Journey of ITSA</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A timeline of our major achievements and milestones over the years.</p>
          </div>
          
          <div className="relative border-l-2 border-white/10 ml-4 md:ml-1/2 max-w-4xl mx-auto">
            {timeline.map((item, i) => (
              <motion.div 
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="mb-12 ml-8 relative"
              >
                <div className="absolute -left-10 mt-1.5 w-4 h-4 rounded-full bg-violet-500 border-4 border-background" />
                <div className="flex items-center gap-4 mb-2">
                  <span className="px-3 py-1 rounded bg-white/5 text-violet-400 font-bold font-mono text-sm border border-white/10">{item.year}</span>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Faculty Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Faculty Advisors</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Guiding our vision with experience and wisdom.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-12">
            {faculty.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center w-64"
              >
                <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-4 border-white/10 hover:border-violet-500/50 transition-colors">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 grayscale hover:grayscale-0" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-violet-400 font-medium">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Committee Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Core Committee</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">The dedicated student leaders executing the ITSA vision.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {committee.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative liquid-glass rounded-3xl p-6 text-center border border-white/5 hover:border-violet-500/30 transition-colors"
              >
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-sm font-medium text-violet-400 uppercase tracking-widest">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12">
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
