import { motion } from 'framer-motion';
import { Target, Eye, Award, ArrowLeft, Linkedin, Github, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/seo';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { AboutPreview } from '@/components/home/about-preview';

const timeline = [
  { year: '2022', title: 'ITSA Inception', desc: 'The Information Technology Students Association was founded to bridge the gap between curriculum and industry.' },
  { year: '2023', title: 'First Hackathon', desc: 'Successfully hosted our first state-level hackathon with over 500 participants.' },
  { year: '2024', title: 'Industry Ties', desc: 'Partnered with major tech corporations to provide internships and industrial visits.' },
  { year: '2025', title: 'Tech Symposium', desc: 'Launched our flagship annual Tech Symposium featuring national speakers and competitions.' },
  { year: '2026', title: 'Going Global', desc: 'Expanding our reach through virtual global events and international student collaborations.' }
];

const fetchCommittee = async () => {
  const res = await apiClient.get('/committee/assigned');
  return res.data?.data || [];
};

export default function AboutPage() {
  const navigate = useNavigate();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['public-committee'],
    queryFn: fetchCommittee
  });

  const faculty = assignments.filter((a: any) => a.committee === 'FACULTY').sort((a: any, b: any) => a.displayOrder - b.displayOrder || a.user.firstName.localeCompare(b.user.firstName));
  const beCommittee = assignments.filter((a: any) => a.committee === 'BE').sort((a: any, b: any) => a.displayOrder - b.displayOrder || a.user.firstName.localeCompare(b.user.firstName));
  const teCommittee = assignments.filter((a: any) => a.committee === 'TE').sort((a: any, b: any) => a.displayOrder - b.displayOrder || a.user.firstName.localeCompare(b.user.firstName));
  const seCommittee = assignments.filter((a: any) => a.committee === 'SE').sort((a: any, b: any) => a.displayOrder - b.displayOrder || a.user.firstName.localeCompare(b.user.firstName));

  const renderCommitteeSection = (title: string, subtitle: string, list: any[], hideGithub: boolean = false) => {
    if (list.length === 0) return null;

    return (
      <div className="mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {list.map((assignment: any, i: number) => {
            const name = `${assignment.user.firstName} ${assignment.user.lastName}`;
            const image = assignment.committeeImage || assignment.user.avatarUrl || `https://ui-avatars.com/api/?name=${assignment.user.firstName}+${assignment.user.lastName}&background=random`;
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col liquid-glass rounded-2xl overflow-hidden border border-white/5 hover:border-violet-500/40 hover:-translate-y-[6px] hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)] transition-all duration-300 h-full"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-white/5">
                  <img 
                    src={image} 
                    alt={name} 
                    className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300 ease-out" 
                    loading="lazy"
                  />
                </div>
                
                <div className="flex flex-col flex-1 p-6 bg-white/5 text-center">
                  <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                  <p className="text-sm font-medium text-violet-400 mb-3">{assignment.position}</p>
                  
                  {assignment.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {assignment.description}
                    </p>
                  )}
                  
                  <div className="mt-auto flex justify-center items-center h-8 gap-4">
                    {assignment.linkedinUrl && (
                      <a 
                        href={assignment.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-[#0A66C2] hover:scale-110 transition-all duration-200"
                        aria-label={`${name}'s LinkedIn`}
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {!hideGithub && assignment.githubUrl && (
                      <a 
                        href={assignment.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-white hover:scale-110 transition-all duration-200"
                        aria-label={`${name}'s GitHub`}
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-28 pb-20 overflow-hidden">
      <SEO title="About ITSA" description="Learn about the Information Technology Students Association (ITSA) and our mission to empower tech leaders." />
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="mb-8 relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute left-0 top-12 p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors z-50"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
        <AboutPreview />
        
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

        {/* Dynamic Committees */}
        {isLoading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <>
            {renderCommitteeSection('Faculty Advisors', 'Guiding our vision with experience and wisdom.', faculty, true)}
            {renderCommitteeSection('BE Committee', 'The senior student leaders executing the ITSA vision.', beCommittee)}
            {renderCommitteeSection('TE Committee', 'The dedicated student leaders driving our initiatives.', teCommittee)}
            {renderCommitteeSection('SE Committee', 'The dynamic volunteers and upcoming leaders.', seCommittee)}
          </>
        )}


      </div>
    </div>
  );
}
