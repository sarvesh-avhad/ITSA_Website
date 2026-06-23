import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Megaphone, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { SEO } from '@/components/seo';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AnnouncementCategory } from '@itsa/shared';

export default function AnnouncementsPage() {
  const [category, setCategory] = useState<string>('ALL');
  
  const { data, isLoading } = useQuery({
    queryKey: ['announcements', category],
    queryFn: async () => {
      const categoryQuery = category !== 'ALL' ? `?category=${category}` : '';
      const res = await apiClient.get(`/announcements${categoryQuery}`);
      return res.data;
    },
  });

  const categories = ['ALL', 'CLUB_UPDATE', 'EVENT_NEWS', 'NOTICE', 'OPPORTUNITY'];

  return (
    <div className="min-h-screen pt-28 pb-20">
      <SEO title="Announcements" description="Stay up to date with the latest news, updates, and notices from ITSA." />
      
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-20 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
              Latest <span className="gradient-text">Updates</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay informed about upcoming events, club announcements, and important notices.
            </p>
          </motion.div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300",
                category === cat
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 size={32} className="animate-spin mb-4 text-violet-400" />
            <p>Loading announcements...</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Megaphone size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No updates yet</h3>
            <p className="text-muted-foreground">Check back later for new announcements.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.data.map((announcement: any, index: number) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  "glass-card rounded-3xl p-6 sm:p-8 hover:bg-white/[0.04] transition-all relative overflow-hidden group",
                  announcement.isPinned && "ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/10"
                )}
              >
                {announcement.isPinned && (
                  <div className="absolute top-6 right-6 px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
                    Pinned
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                    <Megaphone className="text-violet-400" size={28} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-400/10 px-3 py-1 rounded-md">
                        {announcement.category.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar size={14} />
                        {new Date(announcement.publishedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
                      {announcement.title}
                    </h2>
                    
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {announcement.excerpt || announcement.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'}
                    </p>
                    
                    {/* We are just displaying the content inline for simplicity, 
                        or we could have an expansion toggle */}
                    <div className="text-white/80 prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-violet-400 hover:prose-a:text-violet-300" dangerouslySetInnerHTML={{ __html: announcement.content }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
